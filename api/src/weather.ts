import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';

// NWS asks every client to identify itself.
const NWS_UA = process.env.NWS_USER_AGENT ?? 'hunt-app/0.1 (self-hosted hunting map)';
const TZ = 'America/Chicago';
const MIN = 60_000;

export async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${new URL(url).host} HTTP ${res.status}`);
  return res.json();
}

// Serve from api_cache while fresh; on upstream failure fall back to the stale copy.
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const { rows } = await pool.query('SELECT data, fetched_at FROM api_cache WHERE key = $1', [key]);
  const hit = rows[0];
  if (hit && Date.now() - hit.fetched_at.getTime() < ttlMs) return hit.data;
  try {
    const data = await fetcher();
    await pool.query(
      `INSERT INTO api_cache (key, data) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()`,
      [key, JSON.stringify(data)],
    );
    return data;
  } catch (e) {
    if (hit) return hit.data;
    throw e;
  }
}

const round = (v: number, step: number) => Math.round(v / step) * step;
const fixed = (v: number) => v.toFixed(2);

const HOURLY = [
  'temperature_2m', 'dew_point_2m', 'relative_humidity_2m', 'wind_speed_10m', 'wind_direction_10m',
  'wind_gusts_10m', 'cloud_cover', 'precipitation', 'precipitation_probability', 'pressure_msl', 'weather_code',
];
export const UNITS = `temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=${encodeURIComponent(TZ)}&timeformat=unixtime`;

type Hour = {
  t: number; temp: number; dew: number; rh: number; wind: number; windDir: number; gust: number;
  cloud: number; precip: number; pop: number; pressure: number; code: number;
};

async function forecast(lat: number, lng: number) {
  const d = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=${HOURLY.join(',')}` +
      `&daily=temperature_2m_max,temperature_2m_min&past_days=1&forecast_days=8&${UNITS}`,
  );
  const h = d.hourly;
  const hours: Hour[] = h.time.map((t: number, i: number) => ({
    t, temp: h.temperature_2m[i], dew: h.dew_point_2m[i], rh: h.relative_humidity_2m[i],
    wind: h.wind_speed_10m[i], windDir: h.wind_direction_10m[i], gust: h.wind_gusts_10m[i],
    cloud: h.cloud_cover[i], precip: h.precipitation[i], pop: h.precipitation_probability[i] ?? 0,
    pressure: h.pressure_msl[i], code: h.weather_code[i],
  }));
  const days = d.daily.time.map((t: number, i: number) => ({ t, high: d.daily.temperature_2m_max[i], low: d.daily.temperature_2m_min[i] }));
  return { hours: hours.filter((x) => x.temp != null), days };
}

// 1991–2020 daily normal high/low from the ERA5 archive, smoothed ±7 days, indexed by day of year (0–365).
async function normals(lat: number, lng: number) {
  const d = await getJson(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&start_date=1991-01-01&end_date=2020-12-31&daily=temperature_2m_max,temperature_2m_min&${UNITS}`,
  );
  const sums = Array.from({ length: 366 }, () => ({ hi: 0, lo: 0, n: 0 }));
  d.daily.time.forEach((t: number, i: number) => {
    const hi = d.daily.temperature_2m_max[i];
    const lo = d.daily.temperature_2m_min[i];
    if (hi == null || lo == null) return;
    const doy = dayOfYear(new Date(t * 1000));
    for (let k = -7; k <= 7; k++) {
      const s = sums[(doy + k + 366) % 366];
      s.hi += hi;
      s.lo += lo;
      s.n++;
    }
  });
  return sums.map((s) => ({ high: +(s.hi / s.n).toFixed(1), low: +(s.lo / s.n).toFixed(1) }));
}

// Normal high/low for a date at a spot (ERA5 1991–2020, cached per 0.25° cell for a year).
export async function normalFor(lat: number, lng: number, date: Date) {
  const la = round(lat, 0.25), ln = round(lng, 0.25);
  const table = await cached(`normals:${la},${ln}`, 365 * 24 * 60 * MIN, () => normals(la, ln));
  return table[dayOfYear(date)];
}

export function dayOfYear(date: Date) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
  const start = new Date(local.getFullYear(), 0, 1);
  return Math.min(365, Math.floor((local.getTime() - start.getTime()) / 86_400_000));
}

async function nws(lat: number, lng: number) {
  const headers = { 'User-Agent': NWS_UA, Accept: 'application/geo+json' };
  const point = await cached(`nws-point:${fixed(lat)},${fixed(lng)}`, 30 * 24 * 60 * MIN, () =>
    getJson(`https://api.weather.gov/points/${fixed(lat)},${fixed(lng)}`, headers).then((p) => ({ forecast: p.properties.forecast })),
  );
  const [fc, alerts] = await Promise.all([
    cached(`nws-fc:${point.forecast}`, 30 * MIN, () =>
      getJson(point.forecast, headers).then((f) =>
        f.properties.periods.slice(0, 8).map((p: any) => ({
          name: p.name, start: p.startTime, short: p.shortForecast, detail: p.detailedForecast,
        })),
      ),
    ),
    cached(`nws-alerts:${fixed(lat)},${fixed(lng)}`, 10 * MIN, () =>
      getJson(`https://api.weather.gov/alerts/active?point=${fixed(lat)},${fixed(lng)}`, headers).then((a) =>
        a.features.map((f: any) => ({
          event: f.properties.event, headline: f.properties.headline, severity: f.properties.severity,
          ends: f.properties.ends ?? f.properties.expires, description: f.properties.description,
        })),
      ),
    ),
  ]);
  return { periods: fc, alerts };
}

export const weather = new Hono<Env>()
  .use(requireUser)
  // Everything the Intel panel needs for one spot. Weather is cached per 0.1° cell, normals per 0.25° (ERA5 grid).
  .get('/conditions', async (c) => {
    const lat = Number(c.req.query('lat'));
    const lng = Number(c.req.query('lng'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return c.json({ error: 'lat and lng required' }, 400);
    const cell = { lat: +round(lat, 0.1).toFixed(1), lng: +round(lng, 0.1).toFixed(1) };
    const ncell = { lat: round(lat, 0.25), lng: round(lng, 0.25) };
    const [fc, norm, official] = await Promise.all([
      cached(`om:${cell.lat},${cell.lng}`, 30 * MIN, () => forecast(cell.lat, cell.lng)),
      cached(`normals:${ncell.lat},${ncell.lng}`, 365 * 24 * 60 * MIN, () => normals(ncell.lat, ncell.lng)),
      nws(lat, lng).catch(() => ({ periods: [], alerts: [] })),
    ]);
    const days = fc.days.map((d: any) => {
      const n = norm[dayOfYear(new Date(d.t * 1000))];
      return { ...d, normalHigh: n.high, normalLow: n.low };
    });
    return c.json({ cell, hours: fc.hours, days, ...official });
  })
  // Hourly wind for a handful of points spread over the view (one multi-location Open-Meteo call for uncached cells).
  .get('/wind', async (c) => {
    const bbox = (c.req.query('bbox') ?? '').split(',').map(Number);
    if (bbox.length !== 4 || bbox.some((v) => !Number.isFinite(v))) return c.json({ error: 'bbox=w,s,e,n required' }, 400);
    const [w, s, e, n] = bbox;
    const cells = new Map<string, { lat: number; lng: number }>();
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 4; j++) {
        const lat = +round(s + ((j + 0.5) / 4) * (n - s), 0.1).toFixed(1);
        const lng = +round(w + ((i + 0.5) / 5) * (e - w), 0.1).toFixed(1);
        cells.set(`${lat},${lng}`, { lat, lng });
      }
    const keys = [...cells.keys()].slice(0, 20).map((k) => `wind:${k}`);
    const { rows } = await pool.query(
      `SELECT key, data FROM api_cache WHERE key = ANY($1) AND fetched_at > now() - interval '30 minutes'`,
      [keys],
    );
    const have = new Map(rows.map((r) => [r.key, r.data]));
    const missing = keys.filter((k) => !have.has(k)).map((k) => cells.get(k.slice(5))!);
    if (missing.length) {
      const d = await getJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${missing.map((m) => m.lat)}&longitude=${missing.map((m) => m.lng)}` +
          `&hourly=wind_speed_10m,wind_direction_10m&forecast_hours=96&${UNITS}`,
      );
      const list = Array.isArray(d) ? d : [d];
      for (const [i, m] of missing.entries()) {
        const h = list[i].hourly;
        const data = { lat: m.lat, lng: m.lng, t: h.time, speed: h.wind_speed_10m, dir: h.wind_direction_10m };
        have.set(`wind:${m.lat},${m.lng}`, data);
        await pool.query(
          `INSERT INTO api_cache (key, data) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()`,
          [`wind:${m.lat},${m.lng}`, JSON.stringify(data)],
        );
      }
    }
    return c.json([...have.values()]);
  })
  .get('/harvest', async (c) => {
    const { rows } = await pool.query(
      'SELECT year, total, archery, firearms, antlered FROM harvest WHERE county = $1 ORDER BY year',
      [c.req.query('county') ?? ''],
    );
    return c.json(rows);
  });
