// Field notes: hunts in his own words (wind note, deer seen by time, other hunters, is the stand right).
// The server works out the weather; he never has to enter it.
import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';
import { enrich, hourlyAround } from './journal.ts';

const HOUR = 3_600_000;
const VERDICTS = ['right', 'close', 'wrong'];
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const compass = (d: number) => COMPASS[Math.round((((d % 360) + 360) % 360) / 22.5) % 16];
const hhmm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' });

const SELECT = `SELECT h.id, h.stand_id, f.num AS stand_num, f.name AS stand_name, ST_X(h.geom) AS lng, ST_Y(h.geom) AS lat,
  h.started_at, h.ended_at, h.wind_note, h.pressure, h.sightings, h.activity, h.stand_verdict, h.move, h.notes, h.conditions
  FROM hunts h LEFT JOIN features f ON f.id = h.stand_id`;

// Weather at the start plus the model's wind for every hour of the sit, to compare with what he felt.
async function refresh(id: string, userId: number) {
  const { rows } = await pool.query(`${SELECT} WHERE h.id = $1 AND h.user_id = $2`, [id, userId]);
  const h = rows[0];
  if (!h) return null;
  try {
    const start = new Date(h.started_at), end = h.ended_at ? new Date(h.ended_at) : new Date(start.getTime() + 3 * HOUR);
    const [c, hours] = await Promise.all([enrich(h.lat, h.lng, start), hourlyAround(h.lat, h.lng, start)]);
    const forecastWind = hours.filter((x) => x.t >= start.getTime() - HOUR / 2 && x.t <= end.getTime() + HOUR / 2)
      .map((x) => ({ time: hhmm(x.t), t: x.t, from: compass(x.dir), deg: Math.round(x.dir), mph: Math.round(x.wind), cloud: x.cloud }));
    const conditions = { ...c, forecastWind };
    await pool.query(`UPDATE hunts SET conditions = conditions || $2::jsonb WHERE id = $1`, [id, JSON.stringify(conditions)]);
    h.conditions = { ...h.conditions, ...conditions };
  } catch (e) {
    h.conditions = { ...h.conditions, error: (e as Error).message };
  }
  return h;
}

function fields(b: any) {
  const start = new Date(b.started_at), end = b.ended_at ? new Date(b.ended_at) : null;
  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime())) || !Number.isFinite(b.lng) || !Number.isFinite(b.lat))
    return 'started_at, lng, lat required';
  if (start.getTime() > Date.now() + HOUR) return 'the hunt starts in the future';
  if (b.stand_verdict != null && !VERDICTS.includes(b.stand_verdict)) return 'stand_verdict must be right|close|wrong';
  return [b.stand_id ?? null, b.lng, b.lat, start, end, b.wind_note ?? '', JSON.stringify(b.pressure ?? {}), JSON.stringify(b.sightings ?? []),
    b.activity ?? null, b.stand_verdict ?? null, JSON.stringify(b.move ?? {}), b.notes ?? ''];
}

export const hunts = new Hono<Env>()
  .use(requireUser)
  .get('/', async (c) => {
    const { rows } = await pool.query(`${SELECT} WHERE h.user_id = $1 AND h.deleted_at IS NULL ORDER BY h.started_at DESC`, [c.get('userId')]);
    return c.json(rows);
  })
  .post('/', async (c) => {
    const v = fields(await c.req.json());
    if (typeof v === 'string') return c.json({ error: v }, 400);
    const { rows } = await pool.query(
      `INSERT INTO hunts (user_id, stand_id, geom, started_at, ended_at, wind_note, pressure, sightings, activity, stand_verdict, move, notes)
       VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326), $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [c.get('userId'), ...v],
    );
    return c.json(await refresh(rows[0].id, c.get('userId')), 201);
  })
  .put('/:id', async (c) => {
    const v = fields(await c.req.json());
    if (typeof v === 'string') return c.json({ error: v }, 400);
    const { rowCount } = await pool.query(
      `UPDATE hunts SET stand_id = $3, geom = ST_SetSRID(ST_Point($4, $5), 4326), started_at = $6, ended_at = $7, wind_note = $8,
         pressure = $9, sightings = $10, activity = $11, stand_verdict = $12, move = $13, notes = $14, updated_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [c.req.param('id'), c.get('userId'), ...v],
    );
    if (!rowCount) return c.json({ error: 'not found' }, 404);
    return c.json(await refresh(c.req.param('id'), c.get('userId')));
  })
  .delete('/:id', async (c) => {
    const { rowCount } = await pool.query(
      'UPDATE hunts SET deleted_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [c.req.param('id'), c.get('userId')],
    );
    return rowCount ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  });
