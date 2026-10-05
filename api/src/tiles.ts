import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { localOrUser, requireUser, type Env } from './auth.ts';
import { pool } from './db.ts';

export const DATA_DIR = new URL('../../data/', import.meta.url);

const HALF = 20037508.342789244;
const bbox3857 = (z: number, x: number, y: number) => {
  const size = (2 * HALF) / 2 ** z;
  return [-HALF + x * size, HALF - (y + 1) * size, -HALF + (x + 1) * size, HALF - y * size].join(',');
};

// MSDIS imagery: 4–7 s per tile upstream (its tile cache is UTM, so every web tile is re-rendered). Fetched with
// retries and cached on disk forever, so a spot you've looked at once comes back instantly. Public data.
const msdis = (service: string, extra = '') => (z: number, x: number, y: number) =>
  `https://${service}/exportImage?bbox=${bbox3857(z, x, y)}&bboxSR=3857&imageSR=3857&size=512,512&format=jpgpng${extra}&f=image`;
const UPSTREAM: Record<string, (z: number, x: number, y: number) => string> = {
  leafoff: msdis('stateimagery.msdis.missouri.edu/arcgis/rest/services/Missouri_6inch_Statewide_2023_2024_Cached/ImageServer'),
  naip: msdis('imagery.msdis.missouri.edu/arcgis/rest/services/NAIP/NAIP2024/ImageServer', '&bandIds=0,1,2'),
  // Fast upstreams, cached too so a slow or dropped connection doesn't blank the map once an area has been seen.
  topo: (z, x, y) => `https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/${z}/${y}/${x}`,
  dem: (z, x, y) => `https://tiles.mapterhorn.com/${z}/${x}/${y}.webp`, // 3DEP terrain (3D, hillshade, contours, slope)
};

async function fetchRetry(url: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.ok && res.headers.get('content-type')?.startsWith('image/')) return new Uint8Array(await res.arrayBuffer());
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (attempt === 3) throw e;
    }
  }
}

const tileParams = (p: Record<string, string>) => {
  const [z, x, y] = [p.z, p.x, p.y.replace(/\.\w+$/, '')].map((v) => Number.parseInt(v, 10));
  return [z, x, y].some(Number.isNaN) ? null : [z, x, y];
};

// Public imagery only, so no login: the browser fetches it from a second host name (127.0.0.1 vs localhost) to get
// its own 6-connection pool. Otherwise a few 5-second first-time tiles stall every other tile on the page.
// Background preloading: while he isn't using the map, fetch imagery he's likely to look at into the disk cache —
// around every pin, and around wherever he last stopped. Pauses whenever the map is asking for tiles, so it never
// competes with him. Two at a time, to be gentle on the state's server.
const QUIET_MS = 4000;
let lastUserTile = 0;
const queue: string[] = [];
const queued = new Set<string>();
const cacheFile = (name: string, z: number, x: number, y: number) => new URL(`cache/${name}/${z}/${x}/${y}.img`, DATA_DIR);
const tileOf = (lng: number, lat: number, z: number) => {
  const n = 2 ** z, r = (lat * Math.PI) / 180;
  return [Math.floor(((lng + 180) / 360) * n), Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)];
};
function enqueue(name: string, bbox: number[], zooms: number[], first = false) {
  const keys: string[] = [];
  for (const z of zooms) {
    const [x0, y0] = tileOf(bbox[0], bbox[3], z), [x1, y1] = tileOf(bbox[2], bbox[1], z);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 600) continue; // too big an area at this zoom
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = `${name}/${z}/${x}/${y}`;
      if (!queued.has(k)) { queued.add(k); keys.push(k); }
    }
  }
  if (first) queue.unshift(...keys); else queue.push(...keys);
}
async function prefetchWorker() {
  for (;;) {
    if (!queue.length || Date.now() - lastUserTile < QUIET_MS) { await new Promise((r) => setTimeout(r, 1000)); continue; }
    const k = queue.shift()!;
    queued.delete(k);
    const [name, z, x, y] = k.split('/');
    const file = cacheFile(name, +z, +x, +y);
    if (await access(file).then(() => true, () => false)) continue;
    try {
      const b = await fetchRetry(UPSTREAM[name](+z, +x, +y));
      await mkdir(dirname(fileURLToPath(file)), { recursive: true });
      await writeFile(file, b);
    } catch {}
  }
}
// ~1.5 km around every pin at the zooms he hunts at (z18 only close in: it's 4x the tiles).
const around = (lng: number, lat: number, km: number) => {
  const dLat = km / 111.32, dLng = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
};
export async function startPrefetch() {
  prefetchWorker();
  prefetchWorker();
  const { rows } = await pool.query(
    `SELECT ST_X(ST_PointOnSurface(geom)) AS lng, ST_Y(ST_PointOnSurface(geom)) AS lat FROM features WHERE deleted_at IS NULL`).catch(() => ({ rows: [] }));
  for (const p of rows) enqueue('leafoff', around(p.lng, p.lat, 1.5), [14, 15, 16, 17]);
  for (const p of rows) enqueue('dem', around(p.lng, p.lat, 2), [12, 13, 14, 15]);
  for (const p of rows) enqueue('leafoff', around(p.lng, p.lat, 0.4), [18]);
}

export const imagery = new Hono<Env>().use(localOrUser).get('/:name/:z/:x/:y', async (c) => {
  lastUserTile = Date.now();
  const name = c.req.param('name');
  const upstream = UPSTREAM[name];
  const zxy = tileParams(c.req.param());
  if (!upstream || !zxy) return c.json({ error: 'not found' }, 404);
  const file = new URL(`cache/${name}/${zxy.join('/')}.img`, DATA_DIR);
  // Tell JPEG / WebP / PNG apart by the first byte (MSDIS jpgpng answers either JPEG or PNG per tile).
  const headers = (b: Uint8Array) => ({
    'Content-Type': b[0] === 0xff ? 'image/jpeg' : b[0] === 0x52 ? 'image/webp' : 'image/png', 'Cache-Control': 'public, max-age=2592000', 'Access-Control-Allow-Origin': '*',
  });
  try {
    const b = await readFile(file);
    return c.body(b, 200, headers(b));
  } catch {}
  try {
    const b = await fetchRetry(upstream(zxy[0], zxy[1], zxy[2]));
    await mkdir(dirname(fileURLToPath(file)), { recursive: true });
    await writeFile(file, b);
    return c.body(b, 200, headers(b));
  } catch {
    return c.body(null, 204, { 'Access-Control-Allow-Origin': '*' });
  }
});

export const tiles = new Hono<Env>()
  .use(requireUser)
  // The map stopped here: preload this area (twice the view) one zoom either side, ahead of the pin backlog.
  .post('/prefetch', async (c) => {
    const { name, bbox, zoom } = await c.req.json();
    if (!Array.isArray(bbox) || bbox.length !== 4 || !Number.isFinite(zoom)) return c.json({ error: 'bbox, zoom required' }, 400);
    const [w, s, e, n] = bbox.map(Number), dx = (e - w) / 2, dy = (n - s) / 2;
    const z = Math.round(zoom);
    const area = [w - dx, s - dy, e + dx, n + dy];
    if (UPSTREAM[name] && name !== 'dem') enqueue(name, area, [z, z + 1, z - 1].filter((v) => v >= 12 && v <= 19), true);
    enqueue('dem', area, [z - 2, z - 1, z].filter((v) => v >= 10 && v <= 15), true); // DEM tiles are 512 px: a zoom lower
    return c.json({ queued: queue.length });
  })
  // Terrain-intelligence rasters written by pipeline/terrain.py (data/tiles/<layer>/z/x/y.png). Missing = transparent.
  .get('/ai/:layer/:z/:x/:y', async (c) => {
    const zxy = tileParams(c.req.param());
    const layer = c.req.param('layer');
    if (!zxy || !/^[a-z0-9_]+$/.test(layer)) return c.json({ error: 'not found' }, 404);
    try {
      const png = await readFile(new URL(`tiles/${layer}/${zxy.join('/')}.png`, DATA_DIR));
      return c.body(png, 200, { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300' });
    } catch {
      return c.body(null, 204);
    }
  });
