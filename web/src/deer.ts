// How many deer an area holds (docs/research/10-deer-density.md §5): county density from MDC harvest, redistributed by
// habitat inside the area (timber, thick cover, crops/forage near cover, pasture, developed, water). Every number is a
// low–typical–high range. Land cover comes from the terrain model's data tile; crop type from the CDL crop fields.
import type { MultiPolygon, Polygon, Position } from 'geojson';
import { samplePixel } from './terrainai';

// MDC 3-year means (2023–25): antlered and total harvest per sq mi; county forest share (CDL). APR is gone in all four
// counties from the 2026 season, so the typical harvest rate is the no-APR one.
const COUNTY: Record<string, { ab: number; tot: number; forest: number }> = {
  Boone: { ab: 2.62, tot: 5.6, forest: 0.345 }, Callaway: { ab: 2.74, tot: 6.6, forest: 0.41 },
  Cole: { ab: 2.46, tot: 5.7, forest: 0.353 }, Cooper: { ab: 1.98, tot: 4.5, forest: 0.215 },
};
const SETS = {
  low: { h: 0.5, rdb: 1.5, rfd: 0.6, s25: 0.45, s35: 0.18, s45: 0.07 },
  typ: { h: 0.43, rdb: 1.8, rfd: 0.8, s25: 0.52, s35: 0.25, s45: 0.12 },
  high: { h: 0.32, rdb: 2.2, rfd: 1.0, s25: 0.6, s35: 0.35, s45: 0.17 },
};
export const CIRCLE_ACRES = 1000;
const AC = 4046.86;

export type Herd = { deer: number; bucks: number; does: number; fawns: number; b25: number; b35: number; b45: number };
export type DeerEstimate = {
  acres: number; cover: Record<string, number>; q: number;
  low: Herd; typ: Herd; high: Herd;
  matureRegular: [number, number, number]; maturePassing: [number, number, number];
};

const inRing = (x: number, y: number, ring: Position[]) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inPoly = (x: number, y: number, g: Polygon | MultiPolygon) =>
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).some((p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h)));

export function circle([lng, lat]: [number, number], acres = CIRCLE_ACRES): Polygon {
  const r = Math.sqrt((acres * AC) / Math.PI), dLat = r / 111320, dLng = r / (111320 * Math.cos((lat * Math.PI) / 180));
  return { type: 'Polygon', coordinates: [Array.from({ length: 49 }, (_, i) => [lng + dLng * Math.cos((i / 48) * 2 * Math.PI), lat + dLat * Math.sin((i / 48) * 2 * Math.PI)])] };
}

export function centroid(g: Polygon | MultiPolygon): [number, number] {
  let a = 0, x = 0, y = 0;
  for (const p of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
    const r = p[0];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
      a += f; x += (r[j][0] + r[i][0]) * f; y += (r[j][1] + r[i][1]) * f;
    }
  }
  return a ? [x / (3 * a), y / (3 * a)] : (g.type === 'Polygon' ? g.coordinates[0][0] : g.coordinates[0][0][0]) as [number, number];
}

function perimeterM(g: Polygon | MultiPolygon) {
  let p = 0;
  for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
    for (let i = 1; i < poly[0].length; i++) {
      const [x0, y0] = poly[0][i - 1], [x1, y1] = poly[0][i];
      p += Math.hypot((x1 - x0) * 111320 * Math.cos((y0 * Math.PI) / 180), (y1 - y0) * 111320);
    }
  return p;
}

export async function estimateDeer(area: Polygon | MultiPolygon, county: string): Promise<DeerEstimate | null> {
  const k = COUNTY[county];
  if (!k) return null;
  const ring = (area.type === 'Polygon' ? [area.coordinates] : area.coordinates).flatMap((p) => p[0]);
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  const [w, s, e, n] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const lat0 = (s + n) / 2, mx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const bboxM2 = (e - w) * mx * (n - s) * 111320;
  const step = Math.min(60, Math.max(15, Math.sqrt(bboxM2 / 5000)));               // ~5,000 samples at most
  const dx = step / mx, dy = step / 111320;
  const fields: { crop: string; geometry: Polygon | MultiPolygon }[] =
    await fetch(`/api/land/food?bbox=${[w, s, e, n].map((v) => v.toFixed(5))}`).then((r) => (r.ok ? r.json() : []));
  const cols = Math.ceil((e - w) / dx), rows = Math.ceil((n - s) / dy);
  const code = new Int8Array(cols * rows).fill(-1);                                // -1 outside area / unknown
  const jobs: Promise<void>[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = w + (i + 0.5) * dx, y = s + (j + 0.5) * dy;
      if (!inPoly(x, y, area)) continue;
      jobs.push(samplePixel('plan', x, y).then((px) => { code[j * cols + i] = px && px[3] ? px[0] : 0; }));
    }
  await Promise.all(jobs);
  const isCover = (c: number) => c === 1 || c === 2;
  const near = Math.ceil(300 / step);
  const cover: Record<string, number> = {};
  let wsum = 0, nKnown = 0, nArea = 0;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const c = code[j * cols + i];
      if (c < 0) continue;
      nArea++;
      if (c === 0) continue;                                                       // no model data here
      let cls: string, wt: number;
      if (c === 1) { cls = 'timber'; wt = 1; }
      else if (c === 2) { cls = 'thick cover'; wt = 1; }
      else if (c === 5) { cls = 'developed'; wt = 0.1; }
      else if (c === 6) { cls = 'water'; wt = 0; }
      else {
        const x = w + (i + 0.5) * dx, y = s + (j + 0.5) * dy;
        const crop = fields.find((f) => inPoly(x, y, f.geometry))?.crop;
        let byCover = false;
        for (let b = -near; b <= near && !byCover; b++)
          for (let a = -near; a <= near; a++) {
            const jj = j + b, ii = i + a;
            if (jj >= 0 && jj < rows && ii >= 0 && ii < cols && isCover(code[jj * cols + ii]) && a * a + b * b <= near * near) { byCover = true; break; }
          }
        if (crop === 'corn' || crop === 'soybeans' || crop === 'sorghum') { cls = 'row crops'; wt = byCover ? 0.7 : 0.2; }
        else if (crop === 'wheat' || crop === 'alfalfa') { cls = 'green forage'; wt = byCover ? 0.9 : 0.45; }
        else { cls = 'pasture / hay'; wt = byCover ? 0.45 : 0.2; }
      }
      cover[cls] = (cover[cls] ?? 0) + 1;
      wsum += wt; nKnown++;
    }
  if (!nKnown) return null;
  const forestShare = ((cover.timber ?? 0) + (cover['thick cover'] ?? 0)) / nKnown;
  if (forestShare > 0.75) wsum -= 0.2 * (cover.timber ?? 0);                     // big woods run on acorns
  const q = Math.min(2, Math.max(0.2, wsum / nKnown / (0.36 + 0.68 * k.forest)));
  const acres = (nArea * step * step) / AC;
  const herd = (p: typeof SETS.typ): Herd => {
    const bc = k.ab / p.h;
    const dc = Math.min(k.tot / 0.18, Math.max(k.tot / 0.3, bc * (1 + p.rdb * (1 + p.rfd))));
    const f = (q * acres) / 640, bucks = bc * f;
    return { deer: dc * f, bucks, does: bucks * p.rdb, fawns: bucks * p.rdb * p.rfd, b25: bucks * p.s25, b35: bucks * p.s35, b45: bucks * p.s45 };
  };
  const low = herd(SETS.low), typ = herd(SETS.typ), high = herd(SETS.high);
  const am2 = acres * AC, r = 950;                                                // fall buck range radius
  const touch = (am2 + perimeterM(area) * r + Math.PI * r * r) / am2;
  const tri = (f: (h: Herd) => number) => [f(low), f(typ), f(high)] as [number, number, number];
  for (const key of Object.keys(cover)) cover[key] = Math.round((cover[key] / nKnown) * 100);
  return { acres, cover, q, low, typ, high, matureRegular: tri((h) => h.b35 * (1 + 0.27 * (touch - 1))), maturePassing: tri((h) => h.b35 * touch) };
}

// 1 decimal under 5, whole numbers above (the research doc's rounding rule).
export const fmt = (v: number) => (v < 5 ? v.toFixed(1) : String(Math.round(v)));
export const range = ([a, b, c]: [number, number, number]) => `${fmt(b)} (${fmt(a)}–${fmt(c)})`;
