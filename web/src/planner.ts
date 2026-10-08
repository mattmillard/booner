// "Plan my hunt" (docs/research/05 §9.3–9.6): candidate stands -> score for the day's wind and period ->
// scent-aware entry/exit routes -> top 3 with a timeline. Runs in the browser on the z14 model tiles.
import type { Feature, MultiPolygon, Point, Polygon, Position } from 'geojson';
import type { UserFeature } from './api';
import { knowledgeOf, label, type Knowledge } from './knowledge';
import { sunDay, sunPosition } from './astro';
import { compass, getConditions, hourAt, type Hour } from './conditions';
import { demSource } from './map';
import { periodWindows, rate, type Period, type Rating } from './rating';
import { angleDiff, COMPASS8, cone, effectiveWind, plume, thermal } from './scent';
import { phaseOn } from './season';
import { terrainCached } from './terrain';
import { CROP, tileImage, windBin } from './terrainai';
import { foodAttraction } from './seasonal';

const Z = 14;
const MIN = 60_000;
const HOUR = 3_600_000;
const R = 6378137;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

// --- Grid on the z14 tile pixels (~7.4 m cells in central Missouri) -----------------------------

type Grid = { tx0: number; ty0: number; ntx: number; nty: number; w: number; h: number; g: number };

const worldPx = (lng: number, lat: number): [number, number] => {
  const n = 2 ** Z * 256;
  const r = rad(lat);
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n];
};

function makeGrid([w, s, e, n]: number[]): Grid {
  const [x0, y0] = worldPx(w, n);
  const [x1, y1] = worldPx(e, s);
  const tx0 = Math.floor(x0 / 256), ty0 = Math.floor(y0 / 256);
  const ntx = Math.floor(x1 / 256) - tx0 + 1, nty = Math.floor(y1 / 256) - ty0 + 1;
  if (ntx * nty > 25) throw new Error('That area is too big to plan at once (max ~9 km across). Draw a smaller property.');
  const lat = (s + n) / 2;
  return { tx0, ty0, ntx, nty, w: ntx * 256, h: nty * 256, g: ((2 * Math.PI * R) / (2 ** Z * 256)) * Math.cos(rad(lat)) };
}

const toCell = (G: Grid, lng: number, lat: number): [number, number] => {
  const [x, y] = worldPx(lng, lat);
  return [Math.floor(x - G.tx0 * 256), Math.floor(y - G.ty0 * 256)];
};
const toLngLat = (G: Grid, c: number, r: number): [number, number] => {
  const n = 2 ** Z * 256;
  const x = G.tx0 * 256 + c + 0.5, y = G.ty0 * 256 + r + 0.5;
  return [(x / n) * 360 - 180, deg(Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))))];
};

async function eachTile(G: Grid, fn: (tx: number, ty: number, ox: number, oy: number) => Promise<void>) {
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < G.ntx; i++) for (let j = 0; j < G.nty; j++) jobs.push(fn(G.tx0 + i, G.ty0 + j, i * 256, j * 256));
  await Promise.all(jobs);
}

// Alpha channel / 255 of a model layer (value encoding used by pipeline/terrain.py).
async function loadAlpha(G: Grid, layer: string) {
  const out = new Float32Array(G.w * G.h);
  await eachTile(G, async (tx, ty, ox, oy) => {
    const img = await tileImage(layer, tx, ty);
    if (!img) return;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) out[(oy + y) * G.w + ox + x] = img.data[(y * 256 + x) * 4 + 3] / 255;
  });
  return out;
}

async function loadPlan(G: Grid) {
  const code = new Uint8Array(G.w * G.h), dist = new Float32Array(G.w * G.h), flags = new Uint8Array(G.w * G.h);
  let any = false;
  await eachTile(G, async (tx, ty, ox, oy) => {
    const img = await tileImage('plan', tx, ty);
    if (!img) return;
    any = true;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const i = (y * 256 + x) * 4, k = (oy + y) * G.w + ox + x;
        if (!img.data[i + 3]) continue;
        code[k] = img.data[i];
        dist[k] = img.data[i + 1] / 255;
        flags[k] = img.data[i + 2];
      }
  });
  if (!any) throw new Error('No terrain model here yet. Run pipeline/terrain.py for this county.');
  return { code, dist, flags };
}

// Mapterhorn 512-px z13 tiles have exactly the z14 pixel grid; each covers 2×2 of our tiles.
async function loadDem(G: Grid) {
  const out = new Float32Array(G.w * G.h);
  await eachTile(G, async (tx, ty, ox, oy) => {
    const t = (await demSource.getDemTile(13, tx >> 1, ty >> 1)) as { width: number; data: Float32Array };
    const qx = (tx & 1) * 256, qy = (ty & 1) * 256;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) out[(oy + y) * G.w + ox + x] = t.data[(qy + y) * t.width + qx + x];
  });
  return out;
}

// Two-pass chamfer distance (in cells) to the nearest cell where `src` is true.
function distanceTo(G: Grid, src: (k: number) => boolean) {
  const { w, h } = G;
  const d = new Float32Array(w * h).fill(1e9);
  for (let k = 0; k < w * h; k++) if (src(k)) d[k] = 0;
  const D = Math.SQRT2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      if (x > 0) d[k] = Math.min(d[k], d[k - 1] + 1);
      if (y > 0) {
        d[k] = Math.min(d[k], d[k - w] + 1);
        if (x > 0) d[k] = Math.min(d[k], d[k - w - 1] + D);
        if (x < w - 1) d[k] = Math.min(d[k], d[k - w + 1] + D);
      }
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const k = y * w + x;
      if (x < w - 1) d[k] = Math.min(d[k], d[k + 1] + 1);
      if (y < h - 1) {
        d[k] = Math.min(d[k], d[k + w] + 1);
        if (x < w - 1) d[k] = Math.min(d[k], d[k + w + 1] + D);
        if (x > 0) d[k] = Math.min(d[k], d[k + w - 1] + D);
      }
    }
  return d;
}

function rasterizePolygon(G: Grid, ring: Position[], out: Uint8Array | Float32Array = new Uint8Array(G.w * G.h), value = 1) {
  const pts = ring.map(([lng, lat]) => {
    const [x, y] = worldPx(lng, lat);
    return [x - G.tx0 * 256, y - G.ty0 * 256];
  });
  const ys = pts.map((p) => p[1]);
  const rMin = Math.max(0, Math.floor(Math.min(...ys))), rMax = Math.min(G.h - 1, Math.ceil(Math.max(...ys)));
  for (let r = rMin; r <= rMax; r++) {
    const yc = r + 0.5;
    const xs: number[] = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (yi > yc !== yj > yc) xs.push(xi + ((yc - yi) / (yj - yi)) * (xj - xi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let c = Math.max(0, Math.ceil(xs[k] - 0.5)); c < Math.min(G.w, xs[k + 1] - 0.5); c++) out[r * G.w + c] = Math.max(out[r * G.w + c], value);
  }
  return out;
}

function rasterizeArea(G: Grid, area: Polygon | MultiPolygon) {
  const polygons: Position[][][] = area.type === 'Polygon' ? [area.coordinates] : area.coordinates;
  const mask = new Uint8Array(G.w * G.h);
  for (const rings of polygons) {
    const ring = rings.length === 1 ? rings[0] : rings.flatMap((r) => [...r, rings[0][0]]);
    rasterizePolygon(G, ring, mask);
  }
  return mask;
}

// --- Scent ------------------------------------------------------------------------------------

// Weighted mean and peak of `target` under a stand's plume (cone toward `az`, detection decay λ).
function exposure(G: Grid, target: Float32Array, c0: number, r0: number, az: number, half: number, lengthM: number, lambdaM: number) {
  const L = Math.ceil(lengthM / G.g);
  let sum = 0, wsum = 0, peak = 0;
  for (let dy = -L; dy <= L; dy++)
    for (let dx = -L; dx <= L; dx++) {
      const c = c0 + dx, r = r0 + dy;
      if (c < 0 || r < 0 || c >= G.w || r >= G.h || (dx === 0 && dy === 0)) continue;
      const d = Math.hypot(dx, dy) * G.g;
      if (d > lengthM) continue;
      const off = angleDiff(deg(Math.atan2(dx, -dy)), az);
      if (off > half) continue;
      const w = Math.exp(-d / lambdaM) * Math.sqrt(1 - off / (half + 1e-6));
      const v = w * target[r * G.w + c];
      sum += v;
      wsum += w;
      if (v > peak) peak = v;
    }
  return { mean: wsum ? sum / wsum : 0, peak };
}

// For a walker at each cell: how much deer-occupied ground lies downwind (routes avoid leaking scent onto it).
function dangerField(G: Grid, target: Float32Array, towardAz: number, speed: number) {
  const out = new Float32Array(G.w * G.h);
  const offs: [number, number, number][] = [];
  if (speed < 2) {
    for (const r of [15, 30, 50]) for (let a = 0; a < 360; a += 45) offs.push([r * Math.sin(rad(a)), -r * Math.cos(rad(a)), Math.exp(-r / 60)]);
  } else {
    const half = speed < 5 ? 30 : speed < 10 ? 20 : 12;
    for (const r of [15, 30, 50, 75, 105, 140, 180, 230])
      for (const a of [-half, 0, half]) offs.push([r * Math.sin(rad(towardAz + a)), -r * Math.cos(rad(towardAz + a)), Math.exp(-r / 120)]);
  }
  let wsum = 0;
  for (const [ex, ny, w] of offs) {
    wsum += w;
    const dx = Math.round(ex / G.g), dy = Math.round(ny / G.g);
    for (let r = Math.max(0, -dy); r < Math.min(G.h, G.h - dy); r++) {
      const row = r * G.w, trow = (r + dy) * G.w;
      for (let c = Math.max(0, -dx); c < Math.min(G.w, G.w - dx); c++) out[row + c] += w * target[trow + c + dx];
    }
  }
  for (let k = 0; k < out.length; k++) out[k] /= wsum;
  return out;
}

// --- Routing ------------------------------------------------------------------------------------

class Heap {
  k: number[] = [];
  v: number[] = [];
  push(key: number, val: number) {
    const { k, v } = this;
    k.push(key); v.push(val);
    let i = k.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (v[p] <= v[i]) break;
      [k[p], k[i], v[p], v[i]] = [k[i], k[p], v[i], v[p]];
      i = p;
    }
  }
  pop(): [number, number] {
    const { k, v } = this;
    const top: [number, number] = [k[0], v[0]];
    const lk = k.pop()!, lv = v.pop()!;
    if (k.length) {
      k[0] = lk; v[0] = lv;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < k.length && v[l] < v[m]) m = l;
        if (r < k.length && v[r] < v[m]) m = r;
        if (m === i) break;
        [k[m], k[i], v[m], v[i]] = [k[i], k[m], v[i], v[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.k.length; }
}

type Route = { cells: number[]; walkSec: number; penSec: number; meters: number; end: number };

// Dijkstra from the stand outward until the first access cell. Cost = walking seconds (Tobler) + scent / bedding /
// trail / trespass penalties in second-equivalents (Sturgis: a long detour beats bumping deer).
function route(G: Grid, L: Layers, start: number, danger: Float32Array, isGoal: Uint8Array, openPenalty: number): Route | null {
  const n = G.w * G.h;
  const cost = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const heap = new Heap();
  cost[start] = 0;
  heap.push(start, 0);
  const DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1];
  let goal = -1;
  while (heap.size) {
    const [k, cst] = heap.pop();
    if (cst > cost[k]) continue;
    if (isGoal[k] && k !== start) { goal = k; break; }
    const x = k % G.w, y = (k - x) / G.w;
    for (let i = 0; i < 8; i++) {
      const nx = x + DX[i], ny = y + DY[i];
      if (nx < 0 || ny < 0 || nx >= G.w || ny >= G.h) continue;
      const m = ny * G.w + nx;
      const step = (DX[i] && DY[i] ? Math.SQRT2 : 1) * G.g;
      const c = stepCost(L, k, m, step, danger, openPenalty);
      if (cst + c < cost[m]) { cost[m] = cst + c; prev[m] = k; heap.push(m, cst + c); }
    }
  }
  if (goal < 0) return null;
  const cells: number[] = [];
  for (let k = goal; k >= 0; k = prev[k]) cells.push(k);
  let walkSec = 0, penSec = 0, meters = 0;
  for (let i = 1; i < cells.length; i++) {
    const a = cells[i - 1], b = cells[i];
    const step = (a % G.w !== b % G.w && Math.floor(a / G.w) !== Math.floor(b / G.w) ? Math.SQRT2 : 1) * G.g;
    const ws = walkTime(L, a, b, step);
    walkSec += ws;
    penSec += stepCost(L, a, b, step, danger, openPenalty) - ws;
    meters += step;
  }
  return { cells, walkSec, penSec, meters, end: goal };
}

function walkTime(L: Layers, a: number, b: number, step: number) {
  const slope = (L.dem[b] - L.dem[a]) / step;
  const kmh = 6 * Math.exp(-3.5 * Math.abs(slope + 0.05)); // Tobler's hiking function
  const slow = L.code[b] === 2 ? 1.4 : L.code[b] === 6 ? 1e4 : // nobody walks across a lake
    L.flags[b] & 1 ? 0.8 : 1;
  return (step / (kmh / 3.6)) * slow;
}

function stepCost(L: Layers, a: number, b: number, step: number, danger: Float32Array, openPenalty: number) {
  const cells = step / L.g;
  let pen = 45 * danger[b] + 400 * L.bed[b] ** 2 + 8 * L.corridor[b] + openPenalty * (L.code[b] === 3 || L.code[b] === 4 ? 1 : 0);
  if (L.flags[b] & 2) pen *= 0.8; // walking a creek bed / ditch masks scent and noise
  if (!L.inProp[b] && !(L.flags[b] & 1)) pen += 250; // stay on your ground or the road
  return walkTime(L, a, b, step) + pen * cells;
}

// --- Planning -------------------------------------------------------------------------------------

type Layers = {
  g: number; code: Uint8Array; flags: Uint8Array; dist: Float32Array; dem: Float32Array;
  bed: Float32Array; doe: Float32Array; corridor: Float32Array; inProp: Uint8Array;
};

export type PlanStand = {
  rank: number; lngLat: [number, number]; score: number; rating: Rating | null; source: string; yours: boolean;
  why: { text: string; effect: number }[]; goodWinds: string[];
  entry: { coords: [number, number][]; minutes: number; miles: number; leave: Date; scentPenalty: number } | null;
  exit: { coords: [number, number][]; minutes: number; miles: number; scentPenalty: number } | null;
  timeline: { at: Date; text: string }[];
  cone: Polygon; windFrom: number; windSpeed: number;
};
export type Plan = {
  day: Date; period: Period; windFrom: number; windSpeed: number; phase: string; stands: PlanStand[];
  briefing: string[]; beds: [number, number][]; bbox: number[];
};

const KIND_BONUS: Record<string, number> = { pinch: 0.3, saddle: 0.25, hub: 0.2, bench: 0.15, inside_corner: 0.2, crossing: 0.15 };
const RUT = new Set(['prerut', 'seeking', 'peak']);
const FOOD_SEASON = new Set(['early', 'postrut', 'second', 'late']);

const meanWind = (hours: Hour[]) => {
  let x = 0, y = 0, s = 0;
  for (const h of hours) { x += Math.sin(rad(h.windDir)) * h.wind; y += Math.cos(rad(h.windDir)) * h.wind; s += h.wind; }
  return { from: (deg(Math.atan2(x, y)) + 360) % 360, speed: s / hours.length };
};

const pointOf = (f: UserFeature) => (f.geometry as Point).coordinates as [number, number];
const fmt = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export async function planHunt(opts: {
  area: Polygon | MultiPolygon | null; bbox: number[]; day: Date; period: Period; pins: UserFeature[]; onProgress?: (s: string) => void;
  proven?: { spots: { lng: number; lat: number; radiusM: number; title: string }[]; bucks: { lng: number; lat: number; kind: string }[] };
}): Promise<Plan> {
  const { area, day, period, pins } = opts;
  const proven = { spots: [...(opts.proven?.spots ?? [])], bucks: opts.proven?.bucks ?? [] };
  // His pins are private notes: only access points (parking/gate) and pins he marked as knowledge count (field-knowledge L6).
  const known = pins.filter((p) => p.geometry.type === 'Point' && knowledgeOf(p))
    .map((p) => ({ f: p, k: knowledgeOf(p) as Knowledge, at: pointOf(p) }));
  const knownOf = (kind: Knowledge['kind']) => known.filter((x) => x.k.kind === kind);
  for (const x of knownOf('kill')) proven.spots.push({ lng: x.at[0], lat: x.at[1], radiusM: 90, title: `${label(x.f)} ${x.k.note}`.trim() });
  const say = opts.onProgress ?? (() => {});
  const pad = 0.004;
  const bbox = [opts.bbox[0] - pad, opts.bbox[1] - pad, opts.bbox[2] + pad, opts.bbox[3] + pad];
  const G = makeGrid(bbox);
  const center: [number, number] = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  const cond = await getConditions(center[1], center[0]);
  const win = periodWindows(day, center[1], center[0]);
  if (!win) throw new Error('No sunrise/sunset for that day.');
  const [ws, we] = win[period];
  const sitHours = cond.hours.filter((h) => h.t * 1000 >= ws.getTime() - HOUR / 2 && h.t * 1000 <= we.getTime() + HOUR / 2);
  if (!sitHours.length) throw new Error('No forecast for that day yet (forecast covers 7 days).');
  const wind = meanWind(sitHours);
  const phase = phaseOn(day);
  const sun = sunDay(day, center[1], center[0])!;

  say('Loading terrain model…');
  const [plan, corridor, doe, bed, dem] = await Promise.all([
    loadPlan(G), loadAlpha(G, 'corridor'), loadAlpha(G, 'bed_doe'), loadAlpha(G, `bed_buck_${windBin(wind.from)}`), loadDem(G),
  ]);
  const inProp = area ? rasterizeArea(G, area) : (() => {
    const m = new Uint8Array(G.w * G.h);
    const [c0, r0] = toCell(G, opts.bbox[0], opts.bbox[3]), [c1, r1] = toCell(G, opts.bbox[2], opts.bbox[1]);
    for (let r = Math.max(0, r0); r <= Math.min(G.h - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(G.w - 1, c1); c++) m[r * G.w + c] = 1;
    return m;
  })();
  const L: Layers = { g: G.g, code: plan.code, flags: plan.flags, dist: plan.dist, dem, bed, doe, corridor, inProp };
  const pm = period === 'pm';
  // Deer ground the plume must avoid: only real bedding / travel counts (faint model values are everywhere in cover).
  const over = (v: number, t: number) => Math.max(0, (v - t) / (1 - t));
  say('Finding stand sites…');
  const isCover = (k: number) => plan.code[k] === 1 || plan.code[k] === 2;
  const dWater = distanceTo(G, (k) => plan.code[k] === 6);
  const dOpen = distanceTo(G, (k) => plan.code[k] === 3 || plan.code[k] === 4);
  // Food: crop fields weighted by how much deer want that crop on this date (crop stage from NASS progress;
  // field-knowledge L5, research/07 §8.3), plus upland oak acorns on their drop curve.
  const CROPS = Object.keys(CROP);
  const oakW = foodAttraction('oak', day);
  const foodW = new Float32Array(G.w * G.h), cropIdx = new Uint8Array(G.w * G.h);
  const fields: { crop: string; geometry: Polygon | { type: 'MultiPolygon'; coordinates: Position[][][] } }[] =
    await fetch(`/api/land/food?bbox=${bbox.map((v) => v.toFixed(5))}`).then((r) => (r.ok ? r.json() : []));
  for (const f of fields) {
    const w = foodAttraction(f.crop, day);
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const mask = new Uint8Array(G.w * G.h);
    for (const poly of polys) rasterizePolygon(G, poly[0], mask);
    for (let k = 0; k < mask.length; k++) if (mask[k] && w > foodW[k]) { foodW[k] = w; cropIdx[k] = CROPS.indexOf(f.crop) + 1; }
  }
  for (let k = 0; k < foodW.length; k++) if (!cropIdx[k] && plan.flags[k] & 8 && (plan.code[k] === 1 || plan.code[k] === 2)) foodW[k] = oakW;
  // Knowledge pins overrule the model where he says so: paint "real bedding" / "real food" into the fields.
  const paint = (arr: Float32Array, [lng, lat]: [number, number], radiusM: number, v: number) => {
    const [c0, r0] = toCell(G, lng, lat), n = Math.ceil(radiusM / G.g);
    for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
      const c = c0 + dx, r = r0 + dy;
      if (c < 0 || r < 0 || c >= G.w || r >= G.h || Math.hypot(dx, dy) * G.g > radiusM) continue;
      arr[r * G.w + c] = Math.max(arr[r * G.w + c], v);
    }
  };
  for (const x of knownOf('bedding')) paint(bed, x.at, 45, 0.9);
  for (const x of knownOf('food')) paint(foodW, x.at, 40, 1);
  const dActive = distanceTo(G, (k) => foodW[k] >= 0.6);
  const foodName = (c: number, r: number) => {
    let best = Infinity, name = 'food';
    for (let dy = -45; dy <= 45; dy += 3) for (let dx = -45; dx <= 45; dx += 3) {
      const cc = c + dx, rr = r + dy;
      if (cc < 0 || rr < 0 || cc >= G.w || rr >= G.h) continue;
      const k = rr * G.w + cc;
      if (foodW[k] < 0.5 || Math.hypot(dx, dy) >= best) continue;
      best = Math.hypot(dx, dy);
      name = cropIdx[k] ? CROP[CROPS[cropIdx[k] - 1]]?.label.toLowerCase() ?? 'crop' : 'acorn timber';
    }
    return name;
  };
  // Travel = model corridors + what the land forces (field-knowledge L4): the timber strip squeezed between water and
  // open ground (deer moving along a lake must pass it), and benches / draws in cover that deer follow and climb.
  const pinch = new Uint8Array(G.w * G.h);
  const travel = new Float32Array(G.w * G.h);
  for (let k = 0; k < travel.length; k++) {
    if (isCover(k) && dWater[k] * G.g <= 120 && (dWater[k] + dOpen[k]) * G.g <= 170) pinch[k] = 1;
    travel[k] = Math.max(corridor[k], pinch[k] ? 0.55 : 0, isCover(k) && plan.flags[k] & 4 ? 0.35 : 0, isCover(k) && plan.flags[k] & 2 ? 0.3 : 0,
      isCover(k) && dActive[k] * G.g <= 15 ? 0.45 : 0); // timber edge where deer step out onto an active crop
  }
  for (const x of knownOf('travel')) paint(travel, x.at, 25, 0.8);
  const target = new Float32Array(G.w * G.h);
  for (let k = 0; k < target.length; k++)
    target[k] = Math.min(1, over(bed[k], 0.45) + 0.6 * over(doe[k], 0.45) + 0.5 * over(travel[k], 0.25) + (pm ? 0.4 * foodW[k] : 0));

  const dBed = distanceTo(G, (k) => bed[k] > 0.5);
  const dFood = distanceTo(G, (k) => foodW[k] >= 0.5);
  const dRoad = distanceTo(G, (k) => (plan.flags[k] & 1) > 0);
  const dCover = distanceTo(G, isCover);
  // Share of the ~35 yd bow-range circle that is open water (no deer will walk there).
  const waterShare = (c: number, r: number) => {
    let n = 0, wet = 0;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      if (Math.hypot(dx, dy) * G.g > 32) continue;
      const cc = c + dx, rr = r + dy;
      if (cc < 0 || rr < 0 || cc >= G.w || rr >= G.h) continue;
      n++;
      if (plan.code[rr * G.w + cc] === 6) wet++;
    }
    return n ? wet / n : 0;
  };
  const feats: { kind: string; score: number; lng: number; lat: number }[] =
    await fetch(`/api/land/features?bbox=${bbox.map((v) => v.toFixed(5))}`).then((r) => (r.ok ? r.json() : []));

  type Cand = { c: number; r: number; source: string; bonus: number; yours: boolean; name?: string };
  const cands: Cand[] = [];
  const inside = (c: number, r: number) => c >= 0 && r >= 0 && c < G.w && r < G.h && inProp[r * G.w + c] > 0;
  const avoid = knownOf('avoid').map((x) => toCell(G, ...x.at));
  // Closed-to-hunting zones inside public areas (e.g. south Little Dixie Lake CA): never a stand there.
  const closed = new Uint8Array(G.w * G.h);
  for (const z of await fetch(`/api/land/closed?bbox=${bbox.map((v) => v.toFixed(5))}`).then((r) => (r.ok ? r.json() : [])))
    for (const poly of z.geometry.coordinates) rasterizePolygon(G, poly[0], closed);
  const add = (c: number, r: number, source: string, bonus: number, yours = false, name?: string) => {
    if (!inside(c, r) || (!yours && dRoad[r * G.w + c] * G.g < 45)) return;
    if (avoid.some(([ac, ar]) => Math.hypot(ac - c, ar - r) * G.g < 100) || closed[r * G.w + c]) return;
    const dry = (cc: number, rr: number) => dWater[rr * G.w + cc] * G.g >= 12 && waterShare(cc, rr) <= 0.35;
    // Needs a tree: if the spot is in the open, slide to the nearest edge tree within ~40 m.
    if (!yours && dCover[r * G.w + c] > 0) {
      let best: [number, number] | null = null, bd = 6;
      for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
        const k = (r + dy) * G.w + c + dx;
        if (inside(c + dx, r + dy) && dCover[k] === 0 && dry(c + dx, r + dy) && Math.hypot(dx, dy) < bd) { bd = Math.hypot(dx, dy); best = [c + dx, r + dy]; }
      }
      if (!best) return;
      [c, r] = best;
    }
    if (!yours && !dry(c, r)) return; // not on a lake shore or with the water inside bow range
    if (cands.some((o) => Math.hypot(o.c - c, o.r - r) * G.g < 40 && !yours && !o.yours)) return;
    cands.push({ c, r, source, bonus, yours, name });
  };
  for (const f of feats) {
    if (!(f.kind in KIND_BONUS)) continue;
    const [c, r] = toCell(G, f.lng, f.lat);
    const rutMult = RUT.has(phase.id) && ['saddle', 'hub', 'pinch'].includes(f.kind) ? 1.5 : 1;
    const foodMult = FOOD_SEASON.has(phase.id) && f.kind === 'inside_corner' ? 1.3 : 1;
    add(c, r, f.kind, KIND_BONUS[f.kind] * f.score * rutMult * foodMult);
  }
  // Travel peaks inside cover (non-max suppression over ~60 m).
  const peaks: [number, number, number][] = [];
  for (let r = 4; r < G.h - 4; r += 2)
    for (let c = 4; c < G.w - 4; c += 2) {
      const v = travel[r * G.w + c];
      if (v < 0.35 || !inside(c, r)) continue;
      let isMax = true;
      for (let dy = -8; dy <= 8 && isMax; dy += 2) for (let dx = -8; dx <= 8; dx += 2) if (travel[(r + dy) * G.w + c + dx] > v) { isMax = false; break; }
      if (isMax) peaks.push([v, c, r]);
    }
  peaks.sort((a, b) => b[0] - a[0]).slice(0, 40).forEach(([, c, r]) => add(c, r, 'corridor', 0));
  // Overlooks: a tree on the slope 12–32 m above a travel line, 2.5–14 m higher: out of the deer's eye line,
  // shooting down into the trail (the hunter's "hill above them").
  const lines: [number, number, number][] = [];
  for (let r = 5; r < G.h - 5; r += 3)
    for (let c = 5; c < G.w - 5; c += 3) {
      const k = r * G.w + c;
      if (travel[k] >= 0.45 && inside(c, r)) lines.push([travel[k] + (pinch[k] ? 0.3 : 0), c, r]);
    }
  for (const [, c, r] of lines.sort((a, b) => b[0] - a[0]).slice(0, 150)) {
    const t = r * G.w + c;
    let best: [number, number] | null = null, bestGain = 2.5;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.hypot(dx, dy) * G.g;
      if (d < 12 || d > 32) continue;
      const n = (r + dy) * G.w + c + dx;
      const gain = dem[n] - dem[t];
      if (gain > bestGain && gain <= 14 && isCover(n)) { bestGain = gain; best = [c + dx, r + dy]; }
    }
    if (best) add(best[0], best[1], 'overlook', 0.2 + (pinch[t] ? 0.2 : 0));
  }
  for (const x of known.filter((x) => x.f.properties.icon === 'stand' || x.f.properties.icon === 'blind')) {
    const [c, r] = toCell(G, ...x.at);
    add(c, r, 'your stand', 0.1, true, `${label(x.f)} ${x.f.properties.name}`.trim());
  }
  // Pressure only from what he actually saw (field notes: trucks, hunters, shots). A public lot alone means little:
  // the CA lot by his house sees almost nobody (field-knowledge L8).
  const pressure: { lng: number; lat: number; w: number }[] = (await fetch('/api/hunts').then((r) => (r.ok ? r.json() : [])).catch(() => []))
    .map((h: { lng: number; lat: number; pressure: { trucks?: string; hunters?: string; shots?: boolean } }) => ({
      lng: h.lng, lat: h.lat, w: Math.min(1, 0.35 * Number(h.pressure.hunters || 0) + 0.15 * Number(h.pressure.trucks || 0) + (h.pressure.shots ? 0.2 : 0)),
    })).filter((p: { w: number }) => p.w > 0);
  const sign = knownOf('sign').map((x) => ({ name: label(x.f), cell: toCell(G, ...x.at) }));
  // The hunter's proven spots are always candidates (his record outranks the model).
  for (const s of proven.spots) {
    const [c, r] = toCell(G, s.lng, s.lat);
    add(c, r, 'proven spot', 0.4);
  }
  // Small properties rarely hold a mapped funnel: fall back to every wooded spot on a ~37 m grid.
  if (cands.filter((c) => !c.yours).length < 5)
    for (let r = 0; r < G.h; r += 5) for (let c = 0; c < G.w; c += 5) if (dCover[r * G.w + c] === 0) add(c, r, 'timber', 0);
  if (!cands.length) throw new Error('No stand sites found inside this area (it needs timber or brush and model coverage).');

  say(`Scoring ${cands.length} sites for ${compass(wind.from)} ${Math.round(wind.speed)} mph…`);
  const sample = sitHours.filter((_, i) => i % Math.max(1, Math.floor(sitHours.length / 4)) === 0).slice(0, 4);
  const scored = await Promise.all(cands.map(async (cd) => {
    const k = cd.r * G.w + cd.c;
    const [lng, lat] = toLngLat(G, cd.c, cd.r);
    const ter = await terrainCached(lng, lat);
    const why: { text: string; effect: number }[] = [];
    let safety = 0, lastEff = null as ReturnType<typeof effectiveWind> | null, lastPlume = null as ReturnType<typeof plume> | null;
    for (const h of sample) {
      const eff = effectiveWind(h, ter, new Date(h.t * 1000), lat, lng, true);
      const p = plume(eff, h, Math.max(0, (h.t * 1000 - Date.now()) / HOUR));
      const half = p.calm ? 180 : p.halfAngle, len = (p.calm ? 55 : p.lengthsYd[2]) * 0.9144;
      const ex = exposure(G, target, cd.c, cd.r, eff.towardAz, half, len, p.lambdaYd * 0.9144);
      safety += Math.exp(-2.5 * ex.mean - 1.5 * ex.peak);
      lastEff = eff; lastPlume = p;
    }
    safety /= sample.length;
    // Opportunity: deer travel passing 10–30 yd from the tree, not right under it.
    let ring = 0, ringK = -1, pinchInRange = false;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      const d = Math.hypot(dx, dy) * G.g;
      if (d < 9 || d > 32) continue;
      const kk = (cd.r + dy) * G.w + cd.c + dx;
      if (kk >= 0 && kk < travel.length && plan.code[kk] !== 6 && travel[kk] > ring) { ring = travel[kk]; ringK = kk; }
      if (kk >= 0 && kk < pinch.length && pinch[kk] && kk !== k) pinchInRange = true;
    }
    const corrTerm = Math.max(0, ring - 0.3 * travel[k]);
    let bonus = cd.bonus;
    for (const s of sign) {
      if (Math.hypot(s.cell[0] - cd.c, s.cell[1] - cd.r) * G.g > 60) continue;
      const b = 0.3 * (RUT.has(phase.id) ? 1.5 : 1);
      bonus += b;
      why.push({ text: `Near real sign you marked (${s.name})`, effect: b });
    }
    for (const s of proven.spots) {
      if (Math.hypot((s.lng - lng) * 86_700, (s.lat - lat) * 111_320) > s.radiusM) continue;
      bonus += 0.6;
      why.push({ text: `Inside your proven spot "${s.title}"`, effect: 0.6 });
    }
    const nearBucks = proven.bucks.filter((b) => Math.hypot((b.lng - lng) * 86_700, (b.lat - lat) * 111_320) < 90);
    if (nearBucks.length) {
      const b = Math.min(0.6, 0.2 * nearBucks.length);
      bonus += b;
      why.push({ text: `${nearBucks.length} mature-buck ${nearBucks.some((x) => x.kind === 'kill') ? 'sighting/kill' : 'sighting'}${nearBucks.length > 1 ? 's' : ''} in your journal within 100 yd`, effect: b });
    }
    if (pinchInRange) {
      const b = 0.3 * (RUT.has(phase.id) ? 1.3 : 1);
      bonus += b;
      why.push({ text: 'Water pinch in bow range: deer moving along the lake must pass between the water and open ground', effect: b });
    }
    const above = ringK >= 0 ? dem[k] - dem[ringK] : 0;
    if (above >= 2.5) {
      const b = period === 'am' ? 0.15 : 0.05;
      bonus += b;
      why.push({ text: `~${Math.round(above * 3.28)} ft above the travel line below${period === 'am' ? ' (morning: rising thermals lift your scent off it)' : ' (evening: falling thermals drain downhill; the scent check below decides it)'}`, effect: b });
    }
    const opp0 = 0.25 + 1.2 * corrTerm + bonus;
    if (corrTerm > 0.2) why.push({ text: `Deer travel within bow range (${Math.round(ring * 100)}%)`, effect: corrTerm });
    if (cd.bonus > 0 && !cd.yours)
      why.push({ text: cd.source === 'overlook' ? 'Overlook on the slope above the travel line' : `${cd.source.replace('_', ' ')} (terrain funnel)`, effect: cd.bonus });
    let rules = 1;
    const rule = (m: number, text: string) => { if (Math.abs(m - 1) > 0.01) { rules *= m; why.push({ text, effect: m - 1 }); } };
    const bedM = dBed[k] * G.g, bedYd = Math.round(bedM / 0.9144);
    // Mornings: set between food and beds (catch deer heading back). Evenings: staging toward food is fine far from beds.
    const ideal = period === 'am' ? 230 : 350;
    rule(bedM < 50 ? 0.35 : bedM < 65 ? 0.7 : bedM <= ideal ? 1 : period === 'am' ? (bedM <= 400 ? 0.85 : 0.7) : 0.9,
      bedM < 65 ? `Only ${bedYd} yd from likely buck bedding: high risk of bumping deer` : bedM <= ideal ? `${bedYd} yd off likely bedding (ideal range)` : `${bedYd} yd from likely bedding`);
    // Early season → pre-rut: dawn and dusk on or just off the crop the does are using (field-knowledge L5).
    const fm = dFood[k] * G.g, crop = fm < 350 ? foodName(cd.c, cd.r) : 'food';
    const feedPhase = ['early', 'lull', 'prerut'].includes(phase.id) || FOOD_SEASON.has(phase.id);
    const mast = crop === 'acorn timber';
    if (pm && feedPhase)
      rule(fm <= 40 ? 1.2 : fm <= 320 ? 1.1 : 0.9,
        fm <= 40 ? (mast ? 'Evening in the acorn timber: oaks are dropping now' : `Evening on the ${crop} edge: deer feed here before dusk`)
          : fm <= 320 ? `Staging ${Math.round(fm / 0.9144)} yd off the ${mast ? 'acorn flat' : crop}` : 'Far from evening food');
    else if (period === 'am' && ['early', 'lull', 'prerut'].includes(phase.id))
      rule(mast ? (fm <= 120 ? 1.1 : 1) : fm >= 60 && fm <= 250 ? 1.1 : fm < 60 ? 0.9 : 1,
        mast ? 'Morning on the acorns: deer feed in the oaks on the way back to bed'
          : fm >= 60 && fm <= 250 ? `Between the ${crop} and the timber at dawn (deer heading back to bed)`
            : fm < 60 ? `On the ${crop} at dawn: deer still feeding may catch you walking in` : 'Away from the feed');
    const wet = waterShare(cd.c, cd.r);
    if (wet > 0.05) rule(Math.max(0.1, 1 - 2 * wet), `${Math.round(wet * 100)}% of your bow range is open water`);
    if (pressure.length) {
      const hit = Math.max(...pressure.map((p) => p.w * Math.exp(-Math.hypot((p.lng - lng) * 86_700, (p.lat - lat) * 111_320) / 300)));
      if (hit > 0.1) rule(1 - 0.35 * hit, 'Other hunters logged near here in your field notes');
    }
    const rm = dRoad[k] * G.g;
    rule(rm < 60 ? 0.3 : rm < 120 ? 0.7 : rm < 180 ? 0.9 : 1, `${Math.round(rm / 0.9144)} yd from a road`);
    rule(plan.code[k] === 1 ? 1 : plan.code[k] === 2 ? 0.9 : dCover[k] * G.g <= 15 ? 0.85 : cd.yours ? 1 : 0.2,
      plan.code[k] === 2 ? 'Thick cover: fewer climbable trees (good for a blind)' : 'Edge tree');
    // Sun in your eyes: low sun toward where deer come from.
    let sunM = 1;
    const low = new Date(period === 'am' ? sun.sunrise.getTime() + 30 * MIN : sun.sunset.getTime() - 30 * MIN);
    const sp = sunPosition(low, lat, lng);
    let bx = 0, by = 0;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      const kk = (cd.r + dy) * G.w + cd.c + dx;
      if (kk >= 0 && kk < corridor.length) { bx += dx * corridor[kk]; by += -dy * corridor[kk]; }
    }
    if (period !== 'midday' && sp.altitude < 15 && (bx || by) && angleDiff(deg(Math.atan2(bx, by)), sp.azimuth) < 30) {
      sunM = 0.85;
      why.push({ text: `Low ${period === 'am' ? 'morning' : 'evening'} sun faces the deer approach`, effect: -0.15 });
    }
    why.push({ text: `Scent: ${safety > 0.75 ? 'blows clear of bedding and trails' : safety > 0.5 ? 'partly over deer areas' : 'carries into bedding or trails'} (${Math.round(safety * 100)}%)`, effect: safety - 1 });
    return { cd, k, lng, lat, ter, safety, opp: opp0 * rules * sunM, pre: opp0 * rules * sunM * safety, why, eff: lastEff!, plume: lastPlume! };
  }));

  scored.sort((a, b) => b.pre - a.pre);
  const top = scored.slice(0, 8);

  say('Routing entry and exit…');
  const entryT = period === 'am' ? sun.legalStart.getTime() - 60 * MIN : period === 'pm' ? sun.sunset.getTime() - 3 * HOUR - 20 * MIN : ws.getTime() - 20 * MIN;
  const exitT = period === 'am' ? we.getTime() + 15 * MIN : period === 'pm' ? sun.legalEnd.getTime() + 15 * MIN : we.getTime() + 15 * MIN;
  const hIn = hourAt(cond, entryT), hOut = hourAt(cond, exitT);
  // Morning entry in the dark: deer are on food or heading back. Evening entry: deer are bedded.
  const inTarget = new Float32Array(G.w * G.h), outTarget = new Float32Array(G.w * G.h);
  for (let k = 0; k < inTarget.length; k++) {
    const food = plan.flags[k] & 8 ? 1 : 0;
    const b = over(bed[k], 0.45), d = over(doe[k], 0.45), cr = over(corridor[k], 0.25);
    inTarget[k] = Math.min(1, period === 'am' ? 0.8 * food + 0.6 * cr + 0.4 * b : b + 0.6 * d + 0.3 * cr);
    outTarget[k] = Math.min(1, period === 'pm' ? food + 0.5 * cr : b + 0.6 * d + 0.3 * cr);
  }
  const dangerIn = dangerField(G, inTarget, (hIn.windDir + 180) % 360, hIn.wind * 0.87 * 0.3);
  const dangerOut = dangerField(G, outTarget, (hOut.windDir + 180) % 360, hOut.wind * 0.87 * 0.3);
  const goals = new Uint8Array(G.w * G.h);
  const parking = pins.filter((p) => p.geometry.type === 'Point' && (p.properties.icon === 'parking' || p.properties.icon === 'gate'));
  for (const p of parking) {
    const [c, r] = toCell(G, ...pointOf(p));
    if (c >= 0 && r >= 0 && c < G.w && r < G.h) goals[r * G.w + c] = 1;
  }
  if (!goals.some((v) => v)) for (let k = 0; k < goals.length; k++) if (plan.flags[k] & 1) goals[k] = 1;

  const routed = top.map((s) => {
    const entry = route(G, L, s.k, dangerIn, goals, period === 'am' ? 2 : 1);
    const exit = route(G, L, s.k, dangerOut, goals, period === 'pm' ? 6 : 1);
    const pen = (entry?.penSec ?? 1800) + (exit?.penSec ?? 1800);
    const access = Math.exp(-pen / 1500);
    return { ...s, entry, exit, access, final: s.pre * access };
  });
  routed.sort((a, b) => b.final - a.final);

  const picked: typeof routed = [];
  for (const s of routed) {
    if (picked.length === 3) break;
    if (picked.some((p) => Math.hypot(p.lng - s.lng, (p.lat - s.lat) * 1.28) * 86_000 < 150)) continue;
    picked.push(s);
  }
  const pathCoords = (rt: Route | null) => rt ? rt.cells.filter((_, i, a) => i % 3 === 0 || i === a.length - 1).reverse()
    .map((k) => toLngLat(G, k % G.w, Math.floor(k / G.w))) : [];

  const stands: PlanStand[] = picked.map((s, i) => {
    const rating = rate(cond, day, period, s.lat, s.lng);
    const minutesIn = s.entry ? Math.ceil(s.entry.walkSec / 60) : 0;
    const arrive = period === 'am' ? sun.legalStart.getTime() - 40 * MIN : period === 'pm' ? sun.sunset.getTime() - 3 * HOUR : ws.getTime();
    const leave = new Date(arrive - (minutesIn + 10) * MIN);
    const timeline: { at: Date; text: string }[] = [
      { at: leave, text: s.entry ? `Leave ${parking.length ? 'parking' : 'the road'}: ${minutesIn} min walk (${(s.entry.meters / 1609).toFixed(2)} mi) on the green route` : 'No safe walk-in route found' },
      { at: new Date(arrive), text: 'Settled in the stand, quiet' },
    ];
    // Thermal flips at the stand during the sit.
    let lastSign = 0;
    for (let t = Math.floor(ws.getTime() / (15 * MIN)) * 15 * MIN; t <= we.getTime(); t += 15 * MIN) {
      const h = hourAt(cond, t);
      const th = thermal(s.ter, new Date(t), s.lat, s.lng, h.cloud, h.wind * 0.87 * 0.5);
      const sg = Math.sign(Math.round(th.sign));
      if (lastSign && sg !== lastSign && sg !== 0) timeline.push({ at: new Date(t), text: sg > 0 ? 'Thermals turn uphill' : 'Thermals start falling downhill: scent sinks' });
      if (sg) lastSign = sg;
    }
    if (period === 'am') timeline.push({ at: sun.legalStart, text: 'Legal shooting light' });
    if (period === 'pm') timeline.push({ at: sun.legalEnd, text: 'Last legal light' });
    timeline.push({ at: new Date(exitT), text: s.exit ? `Exit on the blue route (${Math.ceil(s.exit.walkSec / 60)} min)${period === 'pm' ? ', away from fields where deer are feeding' : ''}` : 'No clean exit route found: wait for deer to clear' });
    timeline.sort((a, b) => a.at.getTime() - b.at.getTime());
    // Good winds for this site: compass bins whose plume stays off deer ground.
    // Winds within reach of this site's best one (keeps all eight when nothing sensitive lies downwind).
    const binSafety = COMPASS8.map((name, b) => {
      const ex = exposure(G, target, s.cd.c, s.cd.r, (b * 45 + 180) % 360, 22, 170, 130);
      return { name, safe: Math.exp(-2.5 * ex.mean - 1.5 * ex.peak) };
    }).sort((a, b) => b.safe - a.safe);
    const goodWinds = binSafety.filter((x) => x.safe >= 0.6 && x.safe >= binSafety[0].safe - 0.08).map((x) => x.name)
      .sort((a, b) => COMPASS8.indexOf(a) - COMPASS8.indexOf(b));
    const why = [...s.why];
    if (s.entry) why.push({ text: `Walk-in ${minutesIn} min, scent cost ${Math.round(s.entry.penSec / 60)} min-equivalent`, effect: -Math.min(0.5, s.entry.penSec / 3600) });
    const p = s.plume;
    return {
      rank: i + 1,
      lngLat: [s.lng, s.lat],
      score: Math.round(100 * (1 - Math.exp(-2 * s.final))), // absolute, same order as the ranking
      rating, source: s.cd.yours ? `your stand${s.cd.name ? ` "${s.cd.name}"` : ''}` : s.cd.source.replace('_', ' '), yours: s.cd.yours,
      why, goodWinds,
      entry: s.entry ? { coords: pathCoords(s.entry), minutes: minutesIn, miles: s.entry.meters / 1609, leave, scentPenalty: s.entry.penSec } : null,
      exit: s.exit ? { coords: pathCoords(s.exit), minutes: Math.ceil(s.exit.walkSec / 60), miles: s.exit.meters / 1609, scentPenalty: s.exit.penSec } : null,
      timeline,
      cone: cone([s.lng, s.lat], s.eff.towardAz, p.calm ? 170 : p.halfAngle, p.calm ? 55 : p.lengthsYd[1]),
      windFrom: s.eff.fromAz, windSpeed: s.eff.speed,
    };
  });

  // Likely buck beds inside the area (the planner's assumptions, shown on the map).
  const beds: [number, number][] = feats.filter((f) => f.kind === 'bed_buck').filter((f) => {
    const [c, r] = toCell(G, f.lng, f.lat);
    return inside(c, r);
  }).map((f) => [f.lng, f.lat]);

  const r0 = stands[0]?.rating;
  const briefing = [
    `${day.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} ${period === 'am' ? 'morning' : period === 'pm' ? 'evening' : 'midday'}: ${phase.name.toLowerCase()}. Forecast wind ${compass(wind.from)} ${Math.round(wind.speed)} mph during the sit${r0 ? `, hunt rating ${r0.score}` : ''}.`,
    period === 'am'
      ? 'Deer are coming back from food toward bedding at first light, so the plan sits between food and beds and walks in well before light, keeping your scent off the fields and trails they use.'
      : period === 'pm'
        ? 'Deer are bedded when you walk in, so the entry keeps scent off bedding; the exit after dark avoids the fields where deer will be feeding.'
        : 'Midday sits pay off during the rut, when bucks cruise between doe bedding areas.',
    stands.length ? `Best set: #1 (${stands[0].source}) with a ${stands[0].score} site score. Save any of these as a stand to track it on the wind board.` : 'No workable set on this wind; try another day or period.',
  ];
  return { day, period, windFrom: wind.from, windSpeed: wind.speed, phase: phase.name, stands, briefing, beds, bbox: opts.bbox };
}

export function planFeatures(plan: Plan): Feature[] {
  const out: Feature[] = [];
  for (const s of plan.stands) {
    out.push({ type: 'Feature', geometry: s.cone, properties: { role: 'cone', rank: s.rank } });
    if (s.entry) out.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: s.entry.coords }, properties: { role: 'entry', rank: s.rank } });
    if (s.exit) out.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: s.exit.coords }, properties: { role: 'exit', rank: s.rank } });
    out.push({ type: 'Feature', geometry: { type: 'Point', coordinates: s.lngLat }, properties: { role: 'stand', rank: s.rank, label: String(s.rank) } });
  }
  for (const b of plan.beds) out.push({ type: 'Feature', geometry: { type: 'Point', coordinates: b }, properties: { role: 'bed' } });
  return out;
}

export const fmtTime = fmt;
