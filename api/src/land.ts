import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';

// Vector tile layers built on the fly with ST_AsMVT. $1 = zoom. Owner names only at z15+.
const mvtGeom = 'ST_AsMVTGeom(ST_Transform(geom, 3857), env.e, 4096, 64, true) AS geom';
const inTile = 'geom && ST_Transform(env.e, 4326)';

const TILE_LAYERS: Record<string, { minzoom: number; sql: string }> = {
  parcels: {
    minzoom: 12,
    sql: `SELECT id, parcel_id, acres, CASE WHEN $1 >= 15 THEN owner END AS owner, ${mvtGeom}
          FROM parcels, env WHERE ${inTile}`,
  },
  public_lands: {
    minzoom: 6,
    sql: `SELECT id, source, name, manager, ${mvtGeom} FROM public_lands, env WHERE ${inTile}`,
  },
  terrain_features: {
    minzoom: 11,
    sql: `SELECT id, kind, round(score::numeric, 2)::float8 AS score, ${mvtGeom} FROM terrain_features, env
          WHERE ${inTile} AND (kind NOT IN ('bed_buck', 'bed_doe', 'crossing', 'inside_corner') OR $1 >= 13)`,
  },
  deer_trails: {
    minzoom: 12,
    sql: `SELECT id, kind, weight, ${mvtGeom} FROM deer_trails, env WHERE ${inTile}`,
  },
  food_areas: {
    minzoom: 10,
    sql: `SELECT id, crop, round(acres::numeric, 1)::float8 AS acres, ${mvtGeom} FROM food_areas, env WHERE ${inTile}`,
  },
  pinches: {
    minzoom: 13,
    sql: `SELECT id, round(score)::int AS score, round(lane_m / 0.9144)::int AS lane_yd, round(slope)::int AS slope, ${mvtGeom}
          FROM pinches, env WHERE show AND ${inTile}`,
  },
  area_zones: {
    minzoom: 10,
    sql: `SELECT id, kind, label, ${mvtGeom} FROM area_zones, env WHERE ${inTile}`,
  },
  big_water: {
    minzoom: 9,
    sql: `SELECT id, round(acres)::int AS acres, ${mvtGeom} FROM big_water, env WHERE ${inTile}`,
  },
  boundaries: {
    minzoom: 6,
    sql: `SELECT id, kind, name, ${mvtGeom} FROM boundaries, env
          WHERE ${inTile} AND (kind = 'county' OR $1 >= 12)`,
  },
};

const POINT = 'ST_SetSRID(ST_Point($1, $2), 4326)';

// Boone County publishes owners through its report API (what its parcel viewer calls), one parcel at a time.
// Looked up on first tap and cached into the parcels row.
async function booneOwner(id: number, parcelId: string) {
  const key = parcelId.length === 16 ? parcelId.slice(0, -2) : parcelId;
  const res = await fetch(`https://report.boonemo.gov/mrcjava/rest/REST_MP/I01130s/get?slnk=1&rls_PARCEL__X4=EQ&val_PARCEL__X4=${encodeURIComponent(key)}`,
    { headers: { 'User-Agent': 'hunt-app/0.1 (personal hunting map)' }, signal: AbortSignal.timeout(15_000) });
  const r = (await res.json())?.[0];
  if (!r?.OWNER) return {};
  const t = (v: unknown) => String(v ?? '').trim();
  const row = {
    owner: t(r.OWNER),
    mail_address: [r.MAILING1, r.MAILING2, r.MAILING3].map(t).filter(Boolean).join(', ') || null,
    acres: Number(r.DEEDACRES) || Number(r.CALCACRES) || null,
    legal: [r.LEGAL1, r.LEGAL2, r.LEGAL3, r.LEGAL4].map(t).filter(Boolean).join(' ') || null,
  };
  await pool.query(
    `UPDATE parcels SET owner = $2, mail_address = $3, acres = $4, legal = $5, attrs = attrs || $6::jsonb WHERE id = $1`,
    [id, row.owner, row.mail_address, row.acres, row.legal, JSON.stringify({ boone_report: r })],
  );
  return row;
}

export const land = new Hono<Env>()
  .use(requireUser)
  .get('/tiles/:layer/:z/:x/:y', async (c) => {
    const layer = TILE_LAYERS[c.req.param('layer')];
    const [z, x, y] = ['z', 'x', 'y'].map((k) => Number.parseInt(c.req.param(k)!, 10));
    if (!layer || [z, x, y].some(Number.isNaN)) return c.json({ error: 'not found' }, 404);
    if (z < layer.minzoom) return c.body(null, 204);
    const { rows } = await pool.query(
      `WITH env AS (SELECT ST_TileEnvelope($1, $2, $3) AS e), t AS (${layer.sql})
       SELECT ST_AsMVT(t, $4, 4096, 'geom') AS mvt FROM t`,
      [z, x, y, c.req.param('layer')],
    );
    const mvt: Buffer | null = rows[0].mvt;
    if (!mvt?.length) return c.body(null, 204);
    return c.body(new Uint8Array(mvt), 200, {
      'Content-Type': 'application/vnd.mapbox-vector-tile',
      'Cache-Control': 'private, max-age=3600',
    });
  })
  // Date each ingested layer was last refreshed, keyed by web overlay id.
  .get('/sources', async (c) => {
    const { rows } = await pool.query(`
      SELECT 'parcels' AS id, max(source_date)::text AS date FROM parcels
      UNION ALL SELECT 'public', max(source_date)::text FROM public_lands
      UNION ALL SELECT CASE kind WHEN 'county' THEN 'counties' ELSE kind END, max(source_date)::text
        FROM boundaries GROUP BY kind
      UNION ALL SELECT 'ai', max(run_at)::date::text FROM terrain_runs`);
    return c.json(Object.fromEntries(rows.map((r) => [r.id, r.date])));
  })
  // Terrain-model point features in a bbox (planner candidates).
  .get('/features', async (c) => {
    const b = (c.req.query('bbox') ?? '').split(',').map(Number);
    if (b.length !== 4 || b.some((v) => !Number.isFinite(v))) return c.json({ error: 'bbox=w,s,e,n required' }, 400);
    const { rows } = await pool.query(
      `SELECT kind, score, props, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM terrain_features
       WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326) LIMIT 3000`,
      b,
    );
    return c.json(rows);
  })
  // Where hunting is not allowed inside public areas (planner never puts a stand there).
  .get('/closed', async (c) => {
    const b = (c.req.query('bbox') ?? '').split(',').map(Number);
    if (b.length !== 4 || b.some((v) => !Number.isFinite(v))) return c.json({ error: 'bbox=w,s,e,n required' }, 400);
    const { rows } = await pool.query(
      `SELECT label, ST_AsGeoJSON(geom, 6)::json AS geometry FROM area_zones
       WHERE kind <> 'hunting' AND geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)`,
      b,
    );
    return c.json(rows);
  })
  // Crop fields in a bbox (planner: crop-specific, season-weighted food).
  .get('/food', async (c) => {
    const b = (c.req.query('bbox') ?? '').split(',').map(Number);
    if (b.length !== 4 || b.some((v) => !Number.isFinite(v))) return c.json({ error: 'bbox=w,s,e,n required' }, 400);
    const { rows } = await pool.query(
      `SELECT crop, acres, ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.00005), 6)::json AS geometry FROM food_areas
       WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326) LIMIT 3000`,
      b,
    );
    return c.json(rows);
  })
  // Tap-anywhere card: everything we know about the point.
  .get('/at', async (c) => {
    const lng = Number(c.req.query('lng'));
    const lat = Number(c.req.query('lat'));
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return c.json({ error: 'lng and lat required' }, 400);
    const [parcel, lands, bounds, food, nearby, zones] = await Promise.all([
      pool.query(
        `SELECT id, county, parcel_id, owner, mail_address, acres, plss, legal, source_date,
                attrs->>'ADDRESS' AS site_address, attrs->>'PCLCLASS' AS class,
                (attrs->>'SALE_DATE')::float8 AS sale_date_ms, (attrs->>'SALE_AMOUNT')::float8 AS sale_amount,
                round((ST_Area(geom::geography) / 4046.8564224)::numeric, 1)::float8 AS gis_acres,
                ST_AsGeoJSON(geom)::json AS geometry
         FROM parcels WHERE ST_Intersects(geom, ${POINT}) LIMIT 1`,
        [lng, lat],
      ),
      pool.query(
        `SELECT source, name, manager, acres, regs_url, info_url, source_date, attrs
         FROM public_lands WHERE ST_Intersects(geom, ${POINT})`,
        [lng, lat],
      ),
      pool.query(`SELECT kind, name FROM boundaries WHERE ST_Intersects(geom, ${POINT})`, [lng, lat]),
      pool.query(
        `SELECT crop, acres, year FROM food_areas WHERE ST_Intersects(geom, ${POINT}) LIMIT 1`,
        [lng, lat],
      ),
      pool.query(
        `SELECT kind, score, props, round(ST_Distance(geom::geography, ${POINT}::geography)::numeric)::int AS dist_m
         FROM terrain_features WHERE ST_DWithin(geom::geography, ${POINT}::geography, 90)
         ORDER BY geom::geography <-> ${POINT}::geography LIMIT 6`,
        [lng, lat],
      ),
      pool.query(`SELECT area_name, kind, label, rules, source FROM area_zones WHERE ST_Intersects(geom, ${POINT})`, [lng, lat]),
    ]);
    const p = parcel.rows[0];
    if (p?.county === 'Boone' && !p.owner) Object.assign(p, await booneOwner(p.id, p.parcel_id).catch(() => ({})));
    if (p) delete p.id;
    return c.json({
      parcel: p ?? null,
      publicLands: lands.rows.map((l) => ({ ...l, zones: zones.rows.filter((z) => z.area_name === l.name) })),
      county: bounds.rows.find((b) => b.kind === 'county')?.name ?? null,
      section: bounds.rows.find((b) => b.kind === 'plss')?.name ?? null,
      food: food.rows[0] ?? null,
      terrain: nearby.rows,
    });
  });
