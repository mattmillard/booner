import * as maplibregl from 'maplibre-gl';
import { DEM } from './config';
// Terrain-intelligence layers produced by pipeline/terrain.py: legend, "why" text, seasonal food weights,
// and point sampling of the raster tiles (each pixel's alpha is the model value × 255).

export const TF: Record<string, { label: string; letter: string; symbol?: 'pinch'; color: string; why: string }> = {
  saddle: { label: 'Saddle', letter: 'S', color: '#e8590c',
    why: 'A low crossing in a ridge. Deer cross here instead of topping out, so it funnels travel: a classic rut stand. Hunt it on a wind that carries your scent down one side, not along the ridge.' },
  hub: { label: 'Thermal hub', letter: 'H', color: '#1971c2',
    why: 'Three or more draws meet. In the pre-rut and rut bucks scent-check several drainages at once here. Scent pools and swirls in tight hubs, so favor calm, frosty mornings in wider bottoms.' },
  point: { label: 'Ridge point', letter: 'P', color: '#f59f00',
    why: 'A spur off a ridge. Mature bucks bed near point tips with the wind at their backs, watching downhill, and trails converge at the end.' },
  bench: { label: 'Bench', letter: 'B', color: '#0ca678',
    why: 'A flat shelf on a steep sidehill. Deer travel and bed along benches, out of sight from the ridgetop. Set up on the downwind edge.' },
  pinch: { label: 'Pinch point', letter: '', symbol: 'pinch', color: '#c92a2a',
    why: 'Predicted travel squeezes through narrow cover, a saddle or a bench here. A top ambush spot when the wind carries your scent away from the corridor.' },
  inside_corner: { label: 'Inside corner', letter: 'C', color: '#2f9e44',
    why: 'Timber wraps a field corner. Deer enter fields at corners, and the shape gives you several wind options.' },
  crossing: { label: 'Creek crossing', letter: 'X', color: '#1c7ed6',
    why: 'Low banks with cover on both sides; deer cross creeks where it is easy. Look for a worn trail.' },
  bed_buck: { label: 'Likely buck bed', letter: '♂', color: '#9c36b5',
    why: 'Model peak: thick screening cover, upper-third or leeward slope with a view, away from roads and houses, 300–1,600 m from food.' },
  stand_site: { label: 'Stand site (main travel)', letter: '★', color: '#f08c00',
    why: 'On a busy travel lane: a spot in cover 15–35 yd off the path and 7–50 ft above it, out of bedding, with 2+ winds that carry your scent off the path and away from beds, and a walk in from a road that skirts bedding. See its winds, height and walk.' },
  bed_doe: { label: 'Likely doe bedding', letter: '♀', color: '#1098ad',
    why: 'Model peak: good cover close to food (50–400 m), away from disturbance. In the rut, bucks cruise the downwind side of doe bedding.' },
};

export const LANDFORM_KEY: [string, [number, number, number]][] = [
  ['Creek', [51, 154, 240]], ['Draw', [116, 192, 252]], ['Bench', [59, 201, 219]], ['Cold-air pool', [165, 216, 255]],
];

export const CROP: Record<string, { label: string; color: string }> = {
  corn: { label: 'Corn', color: '#ffd43b' },
  soybeans: { label: 'Soybeans', color: '#94d82d' },
  wheat: { label: 'Winter wheat / double crop', color: '#20c997' },
  alfalfa: { label: 'Alfalfa / clover', color: '#b197fc' },
  hay: { label: 'Hay', color: '#e599f7' },
  sorghum: { label: 'Sorghum', color: '#ff922b' },
};


export const windBin = (fromDeg: number) => Math.round((((fromDeg % 360) + 360) % 360) / 45) % 8;
export const aiTiles = (layer: string) => [`${location.origin}/api/tiles/ai/${layer}/{z}/{x}/{y}`];

// The landform raster bakes creek / draw / bench / cold-pool into one image. landform://<hidden>/z/x/y fetches the
// real tile and clears the classes he switched off (nearest class color, so downsampled pyramid tiles work too).
// Slope, computed in the browser from the same 3DEP-based DEM tiles the hillshade uses (fast CDN). USGS's slope
// service took ~13 s per new tile and stalled every other tile behind it. Steeper = warmer; flat ground clear, so
// benches show as gaps in the color on a sidehill.
export const SLOPE_KEY: [string, [number, number, number, number]][] = [
  ['5–10°', [255, 255, 153, 110]], ['10–15°', [255, 212, 59, 150]], ['15–20°', [255, 146, 43, 170]], ['20–30°', [240, 62, 62, 185]], ['30°+', [156, 54, 181, 200]],
];
maplibregl.addProtocol('slope', async (params, abort) => {
  const [z, x, y] = params.url.slice('slope://'.length).split('/').map(Number);
  const res = await fetch(DEM.tiles.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)), { signal: abort.signal });
  if (res.status !== 200) return { data: await empty() };
  const bmp = await createImageBitmap(await res.blob());
  const w = bmp.width, h = bmp.height;
  const c = new OffscreenCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  const src = ctx.getImageData(0, 0, w, h).data;
  const elev = new Float32Array(w * h);
  for (let i = 0; i < elev.length; i++) elev[i] = src[i * 4] * 256 + src[i * 4 + 1] + src[i * 4 + 2] / 256 - 32768; // terrarium
  const n = 2 ** z, lat = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / n)));
  const m = (40075016.686 * Math.cos(lat)) / (n * w); // meters per pixel
  const k = Math.max(1, Math.round(3 / m)); // ~3 m baseline: hillside slope, not every log and creek bank
  const out = ctx.createImageData(w, h), d = out.data;
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
    const e = (qq: number, rr: number) => elev[Math.min(h - 1, Math.max(0, rr)) * w + Math.min(w - 1, Math.max(0, qq))];
    const deg = (Math.atan(Math.hypot(e(q + k, r) - e(q - k, r), e(q, r + k) - e(q, r - k)) / (2 * k * m)) * 180) / Math.PI;
    const band = deg < 5 ? -1 : deg < 10 ? 0 : deg < 15 ? 1 : deg < 20 ? 2 : deg < 30 ? 3 : 4;
    if (band >= 0) d.set(SLOPE_KEY[band][1], (r * w + q) * 4);
  }
  ctx.putImageData(out, 0, 0);
  return { data: await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer() };
});

export const landformTiles = (hidden: string[]) => [`landform://${hidden.length ? hidden.map((h) => LANDFORM_KEY.findIndex(([n]) => n === h)).join('-') : 'all'}/{z}/{x}/{y}`];
let emptyPng: Promise<ArrayBuffer> | null = null;
const empty = () => (emptyPng ??= new OffscreenCanvas(1, 1).convertToBlob({ type: 'image/png' }).then((b) => b.arrayBuffer()));
maplibregl.addProtocol('landform', async (params, abort) => {
  const [hide, z, x, y] = params.url.slice('landform://'.length).split('/');
  const res = await fetch(`${location.origin}/api/tiles/ai/landform/${z}/${x}/${y}`, { signal: abort.signal });
  if (res.status !== 200) return { data: await empty() };
  if (hide === 'all') return { data: await res.arrayBuffer() };
  const off = new Set(hide.split('-').map(Number));
  const bmp = await createImageBitmap(await res.blob());
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    let best = 0, bd = Infinity;
    LANDFORM_KEY.forEach(([, col], k) => {
      const dist = (col[0] - d[i]) ** 2 + (col[1] - d[i + 1]) ** 2 + (col[2] - d[i + 2]) ** 2;
      if (dist < bd) { bd = dist; best = k; }
    });
    if (off.has(best)) d[i + 3] = 0;
  }
  ctx.putImageData(img, 0, 0);
  return { data: await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer() };
});

const Z = 14;
const cache = new Map<string, Promise<ImageData | null>>();

export function tileImage(layer: string, x: number, y: number) {
  const key = `${layer}/${x}/${y}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/api/tiles/ai/${layer}/${Z}/${x}/${y}`).then(async (r) => {
      if (r.status !== 200) return null;
      const bmp = await createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = c.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      return ctx.getImageData(0, 0, bmp.width, bmp.height);
    });
    cache.set(key, p);
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
  }
  return p;
}

// Pixel at a point: [r, g, b, a] or null where the model has nothing.
export async function samplePixel(layer: string, lng: number, lat: number) {
  const n = 2 ** Z;
  const fx = ((lng + 180) / 360) * n;
  const rr = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(rr) + 1 / Math.cos(rr)) / Math.PI) / 2) * n;
  const img = await tileImage(layer, Math.floor(fx), Math.floor(fy));
  if (!img) return null;
  const i = (Math.floor((fy % 1) * img.height) * img.width + Math.floor((fx % 1) * img.width)) * 4;
  const px = [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
  return px[3] ? px : null;
}

export async function sampleValue(layer: string, lng: number, lat: number) {
  const px = await samplePixel(layer, lng, lat);
  return px ? px[3] / 255 : 0;
}

export async function sampleLandform(lng: number, lat: number) {
  const px = await samplePixel('landform', lng, lat);
  if (!px) return null;
  const [name] = LANDFORM_KEY.reduce(
    (best, [n, c]) => {
      const d = Math.hypot(c[0] - px[0], c[1] - px[1], c[2] - px[2]);
      return d < best[1] ? [n, d] : best;
    },
    ['', Infinity] as [string, number],
  );
  return name;
}
