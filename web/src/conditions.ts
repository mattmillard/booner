// Weather for a spot, fetched once per 0.1° cell (the server caches per cell too).
export type Hour = {
  t: number; temp: number; dew: number; rh: number; wind: number; windDir: number; gust: number;
  cloud: number; precip: number; pop: number; pressure: number; code: number;
};
export type Day = { t: number; high: number; low: number; normalHigh: number; normalLow: number };
export type Conditions = {
  cell: { lat: number; lng: number };
  hours: Hour[];
  days: Day[];
  periods: { name: string; start: string; short: string; detail: string }[];
  alerts: { event: string; headline: string; severity: string; ends: string; description: string }[];
};

const cache = new Map<string, { at: number; p: Promise<Conditions> }>();
const TTL = 20 * 60_000;

export const cellKey = (lat: number, lng: number) => `${(Math.round(lat * 10) / 10).toFixed(1)},${(Math.round(lng * 10) / 10).toFixed(1)}`;

export function getConditions(lat: number, lng: number): Promise<Conditions> {
  const key = cellKey(lat, lng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.p;
  const p = fetch(`/api/weather/conditions?lat=${lat}&lng=${lng}`).then(async (r) => {
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? r.statusText);
    return r.json();
  });
  p.catch(() => cache.delete(key));
  cache.set(key, { at: Date.now(), p });
  return p;
}

export const hourAt = (c: Conditions, t: number) =>
  c.hours.reduce((best, h) => (Math.abs(h.t * 1000 - t) < Math.abs(best.t * 1000 - t) ? h : best), c.hours[0]);

export const COMPASS16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export const compass = (deg: number) => COMPASS16[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];

// WMO weather codes used by Open-Meteo.
export function sky(code: number) {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
}
