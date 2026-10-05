import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';
import { astroAt } from './astro.ts';
import { cached, getJson, normalFor, UNITS } from './weather.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const KINDS = ['sighting', 'kill', 'sit', 'sign', 'story'];
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const compass = (d: number) => COMPASS[Math.round((((d % 360) + 360) % 360) / 22.5) % 16];
const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);

// Central Missouri rut phases (same table as web/src/season.ts).
const PHASES: [string, number, number][] = [
  ['early season', 915, 1004], ['October lull', 1005, 1022], ['pre-rut', 1023, 1105], ['seeking & chasing', 1106, 1112],
  ['peak breeding', 1113, 1120], ['post-rut', 1121, 1204], ['second rut', 1205, 1218], ['late season', 1219, 115],
];
function phaseOn(t: Date) {
  const local = new Date(t.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const md = (local.getMonth() + 1) * 100 + local.getDate();
  return PHASES.find(([, s, e]) => (s <= e ? md >= s && md <= e : md >= s || md <= e))?.[0] ?? 'off season';
}

type H = { t: number; temp: number; dew: number; rh: number; wind: number; dir: number; gust: number; cloud: number; precip: number; pressure: number };

// Hourly weather around a moment: ERA5 archive (back to 1940, ~5-day lag) or the forecast API for the last few days.
export async function hourlyAround(lat: number, lng: number, t: Date): Promise<H[]> {
  const la = lat.toFixed(2), ln = lng.toFixed(2);
  const recent = Date.now() - t.getTime() < 6 * DAY;
  const start = ymd(t.getTime() - 2 * DAY), end = ymd(Math.min(t.getTime() + DAY, Date.now()));
  const vars = 'temperature_2m,dew_point_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,precipitation,pressure_msl';
  const base = recent ? 'https://api.open-meteo.com/v1/forecast' : 'https://archive-api.open-meteo.com/v1/archive';
  const d = await cached(`hist:${la},${ln}:${start}:${end}`, recent ? HOUR : 3650 * DAY, () =>
    getJson(`${base}?latitude=${la}&longitude=${ln}&hourly=${vars}&start_date=${start}&end_date=${end}&${UNITS}`));
  const h = d.hourly;
  return h.time.map((tt: number, i: number) => ({
    t: tt * 1000, temp: h.temperature_2m[i], dew: h.dew_point_2m[i], rh: h.relative_humidity_2m[i], wind: h.wind_speed_10m[i],
    dir: h.wind_direction_10m[i], gust: h.wind_gusts_10m[i], cloud: h.cloud_cover[i], precip: h.precipitation[i], pressure: h.pressure_msl[i],
  })).filter((x: H) => x.temp != null);
}

// Everything that might explain deer movement at that moment, in plain numbers.
export async function enrich(lat: number, lng: number, t: Date) {
  const hours = await hourlyAround(lat, lng, t);
  if (!hours.length) throw new Error('no weather history for that time');
  const at = (ms: number) => hours.reduce((b, h) => (Math.abs(h.t - ms) < Math.abs(b.t - ms) ? h : b), hours[0]);
  const now = at(t.getTime()), h3 = at(t.getTime() - 3 * HOUR), h12 = at(t.getTime() - 12 * HOUR), h24 = at(t.getTime() - DAY);
  const localDay = new Date(t.toLocaleString('en-US', { timeZone: 'America/Chicago' })).toDateString();
  const today = hours.filter((h) => new Date(new Date(h.t).toLocaleString('en-US', { timeZone: 'America/Chicago' })).toDateString() === localDay);
  const high = Math.max(...today.map((h) => h.temp)), low = Math.min(...today.map((h) => h.temp));
  const normal = await normalFor(lat, lng, t).catch(() => null);
  const last12 = hours.filter((h) => h.t <= t.getTime() && h.t > t.getTime() - 12 * HOUR);
  const lastRain = [...hours].reverse().find((h) => h.t <= t.getTime() && h.precip >= 0.01);
  const dT24 = now.temp - h24.temp, dp12 = now.pressure - h12.pressure;
  const northwest = now.dir >= 225 || now.dir <= 20;
  const front = dT24 <= -8 && dp12 > 1 && northwest ? 'cold front passed in the last 24 h'
    : dp12 < -3 && now.dir > 120 && now.dir < 225 ? 'front approaching (pressure falling, south wind)' : null;
  return {
    weather: {
      tempF: Math.round(now.temp), dayHighF: Math.round(high), dayLowF: Math.round(low),
      normalHighF: normal?.high ?? null, departureF: normal ? Math.round(high - normal.high) : null,
      tempChange24hF: Math.round(dT24), tempChange3hF: Math.round(now.temp - h3.temp),
      windMph: Math.round(now.wind), gustMph: Math.round(now.gust), windFrom: compass(now.dir), windDeg: Math.round(now.dir),
      windShift24hDeg: Math.round(angleDiff(now.dir, h24.dir)),
      pressureMb: Math.round(now.pressure), pressureTrend3hMb: +(now.pressure - h3.pressure).toFixed(1), pressureTrend12hMb: +dp12.toFixed(1),
      cloudPct: now.cloud, humidityPct: now.rh, dewPointF: Math.round(now.dew),
      rainLast12hIn: +last12.reduce((s, h) => s + h.precip, 0).toFixed(2), rainingNow: now.precip >= 0.01,
      hoursSinceRain: lastRain ? Math.round((t.getTime() - lastRain.t) / HOUR) : null,
      front,
      source: Date.now() - t.getTime() < 6 * DAY ? 'Open-Meteo forecast model (recent)' : 'ERA5 reanalysis (Open-Meteo archive)',
    },
    astro: astroAt(t, lat, lng),
    rutPhase: phaseOn(t),
  };
}

const SELECT = `SELECT id, kind, observed_at, ST_X(geom) AS lng, ST_Y(geom) AS lat, stand_id, buck, deer_count, behavior,
  travel_dir, notes, conditions, created_at FROM observations`;

async function refresh(id: string, userId: number) {
  const { rows } = await pool.query(`${SELECT} WHERE id = $1 AND user_id = $2`, [id, userId]);
  const o = rows[0];
  if (!o) return null;
  try {
    const c = await enrich(o.lat, o.lng, new Date(o.observed_at));
    await pool.query(`UPDATE observations SET conditions = conditions || $2::jsonb, updated_at = now() WHERE id = $1`, [id, JSON.stringify(c)]);
    o.conditions = { ...o.conditions, ...c };
  } catch (e) {
    o.conditions = { ...o.conditions, error: (e as Error).message };
  }
  return o;
}

export const journal = new Hono<Env>()
  .use(requireUser)
  .get('/', async (c) => {
    const { rows } = await pool.query(`${SELECT} WHERE user_id = $1 AND deleted_at IS NULL ORDER BY observed_at DESC`, [c.get('userId')]);
    return c.json(rows);
  })
  .post('/', async (c) => {
    const b = await c.req.json();
    const t = new Date(b.observed_at);
    if (!KINDS.includes(b.kind) || Number.isNaN(t.getTime()) || !Number.isFinite(b.lng) || !Number.isFinite(b.lat))
      return c.json({ error: 'kind, observed_at, lng, lat required' }, 400);
    if (t.getTime() > Date.now() + HOUR) return c.json({ error: 'observed_at is in the future' }, 400);
    const { rows } = await pool.query(
      `INSERT INTO observations (user_id, kind, observed_at, geom, stand_id, buck, deer_count, behavior, travel_dir, notes)
       VALUES ($1, $2, $3, ST_SetSRID(ST_Point($4, $5), 4326), $6, $7, $8, $9, $10, $11) RETURNING id`,
      [c.get('userId'), b.kind, t, b.lng, b.lat, b.stand_id ?? null, JSON.stringify(b.buck ?? {}), b.deer_count ?? null,
       b.behavior ?? null, b.travel_dir ?? null, b.notes ?? ''],
    );
    return c.json(await refresh(rows[0].id, c.get('userId')), 201);
  })
  // Browser-computed site facts (terrain, thermals, model values) merged into conditions.site.
  .patch('/:id/site', async (c) => {
    const site = await c.req.json();
    const { rowCount } = await pool.query(
      `UPDATE observations SET conditions = jsonb_set(conditions, '{site}', $3::jsonb), updated_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [c.req.param('id'), c.get('userId'), JSON.stringify(site)],
    );
    return rowCount ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  })
  .post('/:id/refresh', async (c) => {
    const o = await refresh(c.req.param('id'), c.get('userId'));
    return o ? c.json(o) : c.json({ error: 'not found' }, 404);
  })
  .delete('/:id', async (c) => {
    const { rowCount } = await pool.query(
      'UPDATE observations SET deleted_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [c.req.param('id'), c.get('userId')],
    );
    return rowCount ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  });
