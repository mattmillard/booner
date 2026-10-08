// Parcel groups: a neighbor family's parcels (every KRAMER in Cooper) analyzed and planned as one property.
import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';

const PARCEL = `SELECT id::int, county, parcel_id, owner, acres,
  round((ST_Area(geom::geography) / 4046.8564224)::numeric, 1)::float8 AS gis_acres, ST_AsGeoJSON(geom, 6)::json AS geometry
  FROM parcels`;
const ids = (v: unknown) => (Array.isArray(v) && v.length && v.every(Number.isInteger) ? (v as number[]) : null);
const agg = (sql: string, order: string) => `(SELECT coalesce(json_agg(x ORDER BY ${order}), '[]') FROM (${sql}) x)`;
// Public land / zones within 400 m; the && prefilter (~500 m at this latitude) keeps the gist index in play.
const near = (table: string, cols: string) => `SELECT ${cols}, round(ST_Distance(t.geom::geography, g.geom::geography))::int AS dist_m
  FROM ${table} t WHERE t.geom && ST_Expand(g.geom, 0.006) AND ST_DWithin(t.geom::geography, g.geom::geography, 400)`;

// {"2024": 3, ...}: mature (130"+) bucks he confirmed per year. Anything else is dropped.
const known = (v: unknown) => v && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).filter(([y, n]) => /^(19|20)\d\d$/.test(y) && Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 50))
  : null;

// Whole-group plan area: the union of every parcel in the group, plus any MDC/USFS land that touches it.
// Used when the crosshair sits on a parcel that belongs to one of his saved groups.
const GROUP_PLAN_SQL = `
WITH RECURSIVE
grp AS (SELECT ST_Union(ST_MakeValid(geom)) AS geom FROM parcels WHERE id = ANY($1::bigint[])),
conservation AS (SELECT id, name, geom FROM public_lands WHERE source IN ('mdc', 'usfs')),
connected(id) AS (
  SELECT c.id FROM conservation c CROSS JOIN grp
  WHERE c.geom && ST_Expand(grp.geom, 0.00002) AND ST_DWithin(c.geom, grp.geom, 0.00001)
  UNION
  SELECT adjacent.id
  FROM connected linked
  JOIN conservation current ON current.id = linked.id
  JOIN conservation adjacent ON adjacent.id <> current.id
    AND adjacent.geom && ST_Expand(current.geom, 0.00002)
    AND ST_DWithin(adjacent.geom, current.geom, 0.00001)
),
selected AS (
  SELECT geom FROM parcels WHERE id = ANY($1::bigint[])
  UNION ALL
  SELECT c.geom FROM conservation c JOIN connected x ON x.id = c.id
),
area AS (SELECT ST_UnaryUnion(ST_Collect(geom)) AS geom FROM selected)
SELECT (SELECT count(*)::int FROM parcels WHERE id = ANY($1::bigint[])) AS parcel_count,
  COALESCE((SELECT array_agg(name ORDER BY name) FROM
    (SELECT DISTINCT c.name FROM conservation c JOIN connected x ON x.id = c.id) names), ARRAY[]::text[]) AS conservation_names,
  ST_AsGeoJSON(area.geom, 6)::json AS geometry
FROM area WHERE area.geom IS NOT NULL`;

export const groups = new Hono<Env>()
  .use(requireUser)
  // Parcels for a group: by last name (token before the first comma) in a county, at a point, or by id.
  .get('/parcels', async (c) => {
    const { name, county, lng, lat, ids: list } = c.req.query();
    if (name && county) {
      const { rows } = await pool.query(
        `${PARCEL} WHERE county = $1 AND upper(btrim(split_part(owner, ',', 1))) = upper(btrim(split_part($2, ',', 1)))
         ORDER BY owner, parcel_id LIMIT 500`,
        [county, name],
      );
      return c.json(rows);
    }
    if (lng && lat) {
      const { rows } = await pool.query(`${PARCEL} WHERE ST_Intersects(geom, ST_SetSRID(ST_Point($1, $2), 4326)) LIMIT 1`, [Number(lng), Number(lat)]);
      return c.json(rows);
    }
    if (list) {
      const { rows } = await pool.query(`${PARCEL} WHERE id = ANY($1::bigint[]) ORDER BY owner, parcel_id`, [list.split(',').map(Number)]);
      return c.json(rows);
    }
    return c.json({ error: 'name+county, lng+lat, or ids required' }, 400);
  })
  .get('/plan-area', async (c) => {
    const lng = Number(c.req.query('lng'));
    const lat = Number(c.req.query('lat'));
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90)
      return c.json({ error: 'valid lng and lat required' }, 400);
    // If the crosshair sits on a parcel that belongs to one of his saved groups, plan the whole group.
    const hit = await pool.query(
      `SELECT g.id, g.name, g.county, g.parcel_ids::int[] AS parcel_ids
       FROM parcel_groups g
       JOIN parcels p ON p.id = ANY(g.parcel_ids)
       WHERE g.user_id = $1 AND ST_Intersects(p.geom, ST_SetSRID(ST_Point($2, $3), 4326))
       ORDER BY ST_Area(p.geom::geography) LIMIT 1`,
      [c.get('userId'), lng, lat],
    );
    if (hit.rows[0]) {
      const g = hit.rows[0];
      const { rows } = await pool.query(GROUP_PLAN_SQL, [g.parcel_ids]);
      if (rows[0]) return c.json({
        county: g.county, owner: null, parcel_id: null,
        name: `${g.name} (group · ${rows[0].parcel_count} parcels)`,
        parcel_count: rows[0].parcel_count, conservation_names: rows[0].conservation_names,
        geometry: rows[0].geometry, group_id: g.id,
      });
    }
    const { rows } = await pool.query(
      `WITH RECURSIVE
       point AS (SELECT ST_SetSRID(ST_Point($1, $2), 4326) AS geom),
       parcel AS (
         SELECT id, county, owner, parcel_id, geom FROM parcels
         WHERE ST_Intersects(geom, (SELECT geom FROM point))
         ORDER BY ST_Area(geom::geography) LIMIT 1
       ),
       owner_key AS (
         SELECT county,
           CASE WHEN normalized IN ('USA', 'UNITEDSTATESOFAMERICA') OR normalized LIKE 'MARKTWAINNATIONALFOREST%'
             THEN 'GOVERNMENT' ELSE normalized END AS surname,
           CASE WHEN normalized IN ('USA', 'UNITEDSTATESOFAMERICA') OR normalized LIKE 'MARKTWAINNATIONALFOREST%'
             THEN 'U.S.A.' ELSE upper(btrim(split_part(owner, ',', 1))) END AS owner_label
         FROM (SELECT county, owner,
           upper(regexp_replace(btrim(split_part(owner, ',', 1)), '[^A-Za-z0-9]', '', 'g')) AS normalized
           FROM parcel) normalized_owner
       ),
       connected_parcels(id) AS (
         SELECT id FROM parcel
         UNION
         SELECT adjacent.id
         FROM connected_parcels linked
         JOIN parcels current ON current.id = linked.id
         JOIN parcels adjacent ON adjacent.id <> current.id
           AND adjacent.county = (SELECT county FROM owner_key)
           AND adjacent.geom && ST_Expand(current.geom, 0.00002)
           AND NULLIF((SELECT surname FROM owner_key), '') IS NOT NULL
           AND upper(btrim(split_part(adjacent.owner, ',', 1))) = (SELECT surname FROM owner_key)
           AND ST_DWithin(adjacent.geom, current.geom, 0.00001)
       ),
       parcels_in_plan AS (
         SELECT p.id, p.geom FROM parcels p JOIN connected_parcels cp ON cp.id = p.id
       ),
       conservation AS (SELECT id, name, geom FROM public_lands WHERE source IN ('mdc', 'usfs')),
       connected(id) AS (
         SELECT c.id FROM conservation c CROSS JOIN point
         LEFT JOIN parcels_in_plan p ON true
         WHERE ST_Intersects(c.geom, point.geom)
            OR (p.geom IS NOT NULL AND c.geom && ST_Expand(p.geom, 0.00002)
              AND ST_DWithin(c.geom, p.geom, 0.00001))
         UNION
         SELECT adjacent.id
         FROM connected linked
         JOIN conservation current ON current.id = linked.id
         JOIN conservation adjacent ON adjacent.id <> current.id
           AND adjacent.geom && ST_Expand(current.geom, 0.00002)
           AND ST_DWithin(adjacent.geom, current.geom, 0.00001)
       ),
       selected AS (
         SELECT geom FROM parcels_in_plan
         UNION ALL
         SELECT c.geom FROM conservation c JOIN connected x ON x.id = c.id
       ),
       area AS (SELECT ST_UnaryUnion(ST_Collect(geom)) AS geom FROM selected)
       SELECT p.county, p.owner, p.parcel_id,
         COALESCE(NULLIF(trim(concat_ws(' · ',
           CASE WHEN (SELECT count(*) FROM connected_parcels) > 1
             THEN (SELECT owner_label FROM owner_key) || ' properties (' || (SELECT count(*) FROM connected_parcels) || ' parcels)'
             ELSE p.owner END,
           CASE WHEN (SELECT count(*) FROM connected_parcels) > 1 THEN NULL ELSE p.parcel_id END)), ''),
           (SELECT min(name) FROM conservation c JOIN connected x ON x.id = c.id)) AS name,
         (SELECT count(*)::int FROM connected_parcels) AS parcel_count,
         COALESCE((SELECT array_agg(name ORDER BY name) FROM
           (SELECT DISTINCT c.name FROM conservation c JOIN connected x ON x.id = c.id) names), ARRAY[]::text[]) AS conservation_names,
         ST_AsGeoJSON(area.geom, 6)::json AS geometry
       FROM area LEFT JOIN parcel p ON true
       WHERE area.geom IS NOT NULL`,
      [lng, lat],
    );
    return rows[0] ? c.json(rows[0]) : c.json({ error: 'No parcel or conservation area at the crosshair.' }, 404);
  })
  // Everything inside (or next to) the union of the group's parcels.
  .post('/analyze', async (c) => {
    const list = ids((await c.req.json()).ids);
    if (!list) return c.json({ error: 'ids required' }, 400);
    const { rows } = await pool.query(
      `WITH g AS (SELECT ST_Union(ST_MakeValid(geom)) AS geom, sum(acres) AS deeded, count(*)::int AS n FROM parcels WHERE id = ANY($1::bigint[]))
       SELECT n, round(deeded::numeric, 1)::float8 AS deeded_acres,
         round((ST_Area(geom::geography) / 4046.8564224)::numeric, 1)::float8 AS gis_acres,
         ST_AsGeoJSON(geom, 6)::json AS geometry,
         ${agg(`SELECT crop, round((sum(ST_Area(ST_Intersection(t.geom, g.geom)::geography)) / 4046.8564224)::numeric, 1)::float8 AS acres
                FROM food_areas t WHERE ST_Intersects(t.geom, g.geom) GROUP BY crop`, 'x.acres DESC')} AS food,
         ${agg(`SELECT kind, count(*)::int AS n FROM terrain_features t WHERE ST_Intersects(t.geom, g.geom) GROUP BY kind`, 'x.n DESC')} AS terrain,
         ${agg(near('public_lands', 'name, manager'), 'x.dist_m')} AS public,
         ${agg(near('area_zones', 'area_name, kind, label, rules'), 'x.dist_m')} AS zones
       FROM g WHERE g.geom IS NOT NULL`,
      [list],
    );
    return rows[0] ? c.json(rows[0]) : c.json({ error: 'no parcels' }, 404);
  })
  .get('/', async (c) => {
    const { rows } = await pool.query(
      'SELECT id, name, county, parcel_ids::int[], known, created_at FROM parcel_groups WHERE user_id = $1 ORDER BY created_at DESC',
      [c.get('userId')],
    );
    return c.json(rows);
  })
  .post('/', async (c) => {
    const b = await c.req.json();
    const list = ids(b.parcel_ids);
    if (!b.name?.trim() || !b.county || !list) return c.json({ error: 'name, county, parcel_ids required' }, 400);
    const { rows } = await pool.query(
      `INSERT INTO parcel_groups (user_id, name, county, parcel_ids, known) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, county, parcel_ids::int[], known, created_at`,
      [c.get('userId'), b.name.trim(), b.county, list, JSON.stringify(known(b.known) ?? {})],
    );
    return c.json(rows[0], 201);
  })
  .patch('/:id', async (c) => {
    const b = await c.req.json();
    const list = b.parcel_ids === undefined ? undefined : ids(b.parcel_ids);
    if ((b.name !== undefined && !String(b.name).trim()) || list === null) return c.json({ error: 'bad name or parcel_ids' }, 400);
    const { rows } = await pool.query(
      `UPDATE parcel_groups SET name = coalesce($3, name), parcel_ids = coalesce($4, parcel_ids), known = coalesce($5, known)
       WHERE id = $1 AND user_id = $2 RETURNING id, name, county, parcel_ids::int[], known, created_at`,
      [c.req.param('id'), c.get('userId'), b.name?.trim() ?? null, list ?? null, b.known === undefined ? null : JSON.stringify(known(b.known) ?? {})],
    );
    return rows[0] ? c.json(rows[0]) : c.json({ error: 'not found' }, 404);
  })
  .delete('/:id', async (c) => {
    const { rowCount } = await pool.query('DELETE FROM parcel_groups WHERE id = $1 AND user_id = $2', [c.req.param('id'), c.get('userId')]);
    return rowCount ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  });
