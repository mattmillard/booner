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
