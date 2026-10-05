// Point terrain metrics sampled from the same DEM tiles the map uses (Mapterhorn, 3DEP-based).
import { demSource } from './map';

const Z = 14; // 512-px tiles at z14 ≈ 3.7 m per pixel in central Missouri
const M_PER_DEG = 111_320;
type Tile = { width: number; height: number; data: Float32Array };
const tiles = new Map<string, Promise<Tile>>();

function tile(x: number, y: number) {
  const key = `${x}/${y}`;
  let t = tiles.get(key);
  if (!t) {
    t = demSource.getDemTile(Z, x, y) as Promise<Tile>;
    t.catch(() => tiles.delete(key));
    tiles.set(key, t);
    if (tiles.size > 300) tiles.delete(tiles.keys().next().value!);
  }
  return t;
}

async function elevation(lng: number, lat: number) {
  const n = 2 ** Z;
  const fx = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  const tx = Math.floor(fx), ty = Math.floor(fy);
  const t = await tile(tx, ty);
  const px = Math.min(t.width - 1.001, Math.max(0, (fx - tx) * t.width - 0.5));
  const py = Math.min(t.height - 1.001, Math.max(0, (fy - ty) * t.height - 0.5));
  const x0 = Math.floor(px), y0 = Math.floor(py), dx = px - x0, dy = py - y0;
  const v = (x: number, y: number) => t.data[y * t.width + x];
  return (v(x0, y0) * (1 - dx) + v(x0 + 1, y0) * dx) * (1 - dy) + (v(x0, y0 + 1) * (1 - dx) + v(x0 + 1, y0 + 1) * dx) * dy;
}

const offset = (lng: number, lat: number, eastM: number, northM: number): [number, number] => [
  lng + eastM / (M_PER_DEG * Math.cos((lat * Math.PI) / 180)),
  lat + northM / M_PER_DEG,
];

const ring = (lng: number, lat: number, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => offset(lng, lat, r * Math.sin((2 * Math.PI * i) / n), r * Math.cos((2 * Math.PI * i) / n)));

const toDeg = (rad: number) => (rad * 180) / Math.PI;
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

async function gradient(lng: number, lat: number, s: number) {
  const [e, w, n, so] = await Promise.all(
    [offset(lng, lat, s, 0), offset(lng, lat, -s, 0), offset(lng, lat, 0, s), offset(lng, lat, 0, -s)].map((p) => elevation(...p)),
  );
  const dzdx = (e - w) / (2 * s), dzdy = (n - so) / (2 * s);
  return {
    slope: toDeg(Math.atan(Math.hypot(dzdx, dzdy))),
    downhill: (toDeg(Math.atan2(-dzdx, -dzdy)) + 360) % 360, // compass bearing water would run
  };
}

export type Landform = 'cold pool' | 'bottom' | 'ridge' | 'sidehill' | 'flat';
export type Terrain = {
  elev: number;          // m
  slope: number;         // deg, 30 m scale
  aspect: number;        // downhill bearing, 30 m scale
  drainAz: number;       // downhill bearing, 80 m scale: the way thermals drain / the drainage axis on valley floors
  drainSlope: number;
  tpi150: number;        // m above (+) or below (−) the ring 150 m out
  tpi400: number;
  valleyDepth: number;   // m below surroundings (0 on slopes/ridges)
  landform: Landform;
};

export async function terrainAt(lng: number, lat: number): Promise<Terrain> {
  const [e0, g30, g80, r150, r400] = await Promise.all([
    elevation(lng, lat),
    gradient(lng, lat, 30),
    gradient(lng, lat, 80),
    Promise.all(ring(lng, lat, 150, 12).map((p) => elevation(...p))),
    Promise.all(ring(lng, lat, 400, 16).map((p) => elevation(...p))),
  ]);
  const tpi150 = e0 - mean(r150);
  const tpi400 = e0 - mean(r400);
  const landform: Landform =
    tpi400 < -8 && g30.slope < 6 ? 'cold pool'
    : tpi400 < -5 && g30.slope < 10 ? 'bottom'
    : tpi400 > 8 && g30.slope < 10 ? 'ridge'
    : g30.slope >= 6 ? 'sidehill' : 'flat';
  return {
    elev: e0, slope: g30.slope, aspect: g30.downhill, drainAz: g80.downhill, drainSlope: g80.slope,
    tpi150, tpi400, valleyDepth: Math.max(0, -tpi400), landform,
  };
}

const cache = new Map<string, Promise<Terrain>>();
export function terrainCached(lng: number, lat: number) {
  const key = `${lng.toFixed(5)},${lat.toFixed(5)}`;
  let t = cache.get(key);
  if (!t) {
    t = terrainAt(lng, lat);
    t.catch(() => cache.delete(key));
    cache.set(key, t);
  }
  return t;
}
