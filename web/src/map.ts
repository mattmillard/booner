import * as maplibregl from 'maplibre-gl';
import type { ExpressionSpecification, LayerSpecification, Map, StyleSpecification } from 'maplibre-gl';
import mlcontour from 'maplibre-contour';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { TF, CROP, aiTiles, landformTiles } from './terrainai';
import { BASEMAPS, DEM, FONT, FONT_BOLD, GLYPHS, ICONS, PUBLIC_COLORS, RADAR_TILES, VECTOR_BASE } from './config';

// Production: point maplibre at the worker Vite bundled (it imports a shared chunk the build would otherwise drop).
// Dev: maplibre's own new URL(..., import.meta.url) lookup works because maplibre-gl is excluded from pre-bundling.
if (import.meta.env.PROD) maplibregl.setWorkerUrl(new URL(workerUrl, location.href).href);
// Many vector + raster layers: parse tiles on more than the default single worker.
maplibregl.setWorkerCount(Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1)));

export const demSource = new mlcontour.DemSource({ url: DEM.tiles, encoding: DEM.encoding, maxzoom: DEM.maxzoom, worker: true });
demSource.setupMaplibre(maplibregl);

const EMPTY = { type: 'FeatureCollection' as const, features: [] };
const tiles = (layer: string) => [`${location.origin}/api/land/tiles/${layer}/{z}/{x}/{y}`];
const byZoom = (...stops: number[]): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], ...stops];
// ['match', ['get', prop], k1, v1, k2, v2, …, fallback] built from a lookup table.
const matchBy = (prop: string, pairs: [string, string | number][], fallback: string | number) =>
  ['match', ['get', prop], ...pairs.flat(), fallback] as unknown as ExpressionSpecification;
const halo = { 'text-halo-color': 'rgba(0,0,0,.85)', 'text-halo-width': 1.4 };

// Overlay id -> its layers; the first layer/property pair takes the opacity slider.
// Zoom at which overlays start loading (his call: 2026-10-03). Below it, it's just the map.
export const DETAIL_MINZOOM = 14.5;
const START_ZOOM: Record<string, number> = { 'parcels-line': 13.5, 'parcels-label': 13.5, 'ai-features': 14, 'pinch-points': 14, slope: 14 };

export const OVERLAY_LAYERS: Record<string, { layers: string[]; opacity: [string, string] }> = {
  labels: { layers: ['osm-water', 'osm-roads', 'osm-road-names', 'osm-places'], opacity: ['osm-roads', 'line-opacity'] },
  public: { layers: ['public-fill', 'public-line', 'public-label'], opacity: ['public-fill', 'fill-opacity'] },
  pinches: { layers: ['pinch-points'], opacity: ['pinch-points', 'icon-opacity'] },
  zones: { layers: ['zones-closed-fill', 'zones-line', 'zones-label'], opacity: ['zones-closed-fill', 'fill-opacity'] },
  water: { layers: ['water-blocked-fill', 'water-blocked-line', 'water-blocked-label'], opacity: ['water-blocked-fill', 'fill-opacity'] },
  parcels: { layers: ['parcels-line', 'parcels-label'], opacity: ['parcels-line', 'line-opacity'] },
  plss: { layers: ['plss-line', 'plss-label'], opacity: ['plss-line', 'line-opacity'] },
  counties: { layers: ['counties-line'], opacity: ['counties-line', 'line-opacity'] },
  hillshade: { layers: ['hillshade'], opacity: ['hillshade', 'hillshade-exaggeration'] },
  contours: { layers: ['contour-lines', 'contour-labels'], opacity: ['contour-lines', 'line-opacity'] },
  slope: { layers: ['slope'], opacity: ['slope', 'raster-opacity'] },
  wind: { layers: ['wind-arrows'], opacity: ['wind-arrows', 'icon-opacity'] },
  ai_features: { layers: ['ai-features'], opacity: ['ai-features', 'icon-opacity'] },
  ai_bed_buck: { layers: ['ai-bed-buck'], opacity: ['ai-bed-buck', 'raster-opacity'] },
  ai_bed_doe: { layers: ['ai-bed-doe'], opacity: ['ai-bed-doe', 'raster-opacity'] },
  ai_corridor: { layers: ['ai-corridor'], opacity: ['ai-corridor', 'raster-opacity'] },
  ai_trails: { layers: ['ai-trails'], opacity: ['ai-trails', 'line-opacity'] },
  ai_landform: { layers: ['ai-landform'], opacity: ['ai-landform', 'raster-opacity'] },
  ai_food: { layers: ['ai-food-fill', 'ai-food-line'], opacity: ['ai-food-line', 'line-opacity'] },
  scent: { layers: ['scent-uncertain', 'scent-bands', 'scent-edge'], opacity: ['scent-bands', 'fill-opacity'] },
  thermals: { layers: ['thermal-arrows', 'thermal-calm'], opacity: ['thermal-arrows', 'icon-opacity'] },
  radar: { layers: ['radar'], opacity: ['radar', 'raster-opacity'] },
};

export const USER_LAYERS = ['user-pins', 'user-lines', 'user-tracks', 'user-area-fill'];
export const AI_CLICKABLE = ['ai-features'];

export function buildStyle(): StyleSpecification {
  const kind = (k: string): ExpressionSpecification => ['==', ['get', 'kind'], k];
  const userColor: ExpressionSpecification = ['coalesce', ['get', 'color'], '#ffd43b'];

  const layers: LayerSpecification[] = [
    { id: 'base-underlay', type: 'raster', source: 'base-esri', layout: { visibility: 'none' } }, // fast Esri aerial under MSDIS
    ...BASEMAPS.map((b): LayerSpecification => ({ id: `base-${b.id}`, type: 'raster', source: `base-${b.id}`, minzoom: b.minzoom ?? 0, layout: { visibility: 'none' } })),
    { id: 'hillshade', type: 'hillshade', source: 'dem-hs', paint: { 'hillshade-method': 'multidirectional', 'hillshade-exaggeration': 0.5 } },
    { id: 'slope', type: 'raster', source: 'slope', minzoom: 14 }, // he asked for slope from zoom 14
    {
      id: 'public-fill', type: 'fill', source: 'land-public', 'source-layer': 'public_lands',
      paint: { 'fill-color': ['match', ['get', 'source'], 'mdc', PUBLIC_COLORS.mdc, 'usfs', PUBLIC_COLORS.usfs, PUBLIC_COLORS.usfws] },
    },
    { id: 'public-line', type: 'line', source: 'land-public', 'source-layer': 'public_lands', paint: { 'line-color': '#b2f2bb', 'line-width': 1.5 } },
    // Hunting zones inside public areas, traced from the area maps (docs/research/09-area-regulations.md).
    { id: 'zones-closed-fill', type: 'fill', source: 'land-zones', 'source-layer': 'area_zones', filter: ['!=', ['get', 'kind'], 'hunting'], paint: { 'fill-color': '#e03131', 'fill-opacity': 0.28 } },
    { id: 'zones-line', type: 'line', source: 'land-zones', 'source-layer': 'area_zones',
      paint: { 'line-color': ['match', ['get', 'kind'], 'hunting', '#69db7c', '#ff8787'], 'line-width': 2, 'line-dasharray': [2, 1] } },
    // Lakes of 10+ acres: deer walk around, never across (field-knowledge L7). Only the water is blocked, not the shore.
    { id: 'water-blocked-fill', type: 'fill', source: 'land-water', 'source-layer': 'big_water', paint: { 'fill-pattern': 'hatch-blocked' } },
    { id: 'water-blocked-line', type: 'line', source: 'land-water', 'source-layer': 'big_water', paint: { 'line-color': '#ff6b6b', 'line-width': 1.5, 'line-dasharray': [3, 2] } },
    {
      id: 'ai-food-fill', type: 'fill', source: 'ai-vec-food', 'source-layer': 'food_areas',
      paint: { 'fill-color': matchBy('crop', Object.entries(CROP).map(([k, v]) => [k, v.color]), '#fff'), 'fill-opacity': 0.4 },
    },
    { id: 'ai-food-line', type: 'line', source: 'ai-vec-food', 'source-layer': 'food_areas', minzoom: 12,
      paint: { 'line-color': matchBy('crop', Object.entries(CROP).map(([k, v]) => [k, v.color]), '#fff'), 'line-width': 1 } },
    { id: 'ai-landform', type: 'raster', source: 'ai-landform' },
    { id: 'ai-bed-doe', type: 'raster', source: 'ai-bed-doe' },
    { id: 'ai-bed-buck', type: 'raster', source: 'ai-bed-buck' },
    { id: 'ai-corridor', type: 'raster', source: 'ai-corridor' },
    {
      id: 'contour-lines', type: 'line', source: 'contours', 'source-layer': 'contours',
      paint: { 'line-color': '#ffc078', 'line-width': ['match', ['get', 'level'], 1, 1.3, 0.6] },
    },
    {
      id: 'contour-labels', type: 'symbol', source: 'contours', 'source-layer': 'contours', filter: ['>', ['get', 'level'], 0],
      layout: { 'symbol-placement': 'line', 'text-field': ['concat', ['number-format', ['get', 'ele'], {}], "'"], 'text-font': FONT, 'text-size': 10 },
      paint: { 'text-color': '#ffd8a8', ...halo },
    },
    { id: 'osm-water', type: 'line', source: 'osm', 'source-layer': 'waterway', minzoom: 11, paint: { 'line-color': '#74c0fc', 'line-width': byZoom(11, 0.5, 16, 2) } },
    {
      id: 'osm-roads', type: 'line', source: 'osm', 'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service', 'track'], true, false],
      paint: {
        'line-color': ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], '#ffe066', ['secondary', 'tertiary'], '#fff3bf', '#f1f3f5'],
        'line-width': byZoom(8, 0.5, 16, 3),
        'line-opacity': 1,
      },
    },
    {
      id: 'osm-road-names', type: 'symbol', source: 'osm', 'source-layer': 'transportation_name', minzoom: 12,
      layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name'], ['get', 'ref']], 'text-font': FONT, 'text-size': 11 },
      paint: { 'text-color': '#fff', ...halo },
    },
    {
      id: 'osm-places', type: 'symbol', source: 'osm', 'source-layer': 'place',
      filter: ['match', ['get', 'class'], ['city', 'town', 'village', 'hamlet'], true, false],
      layout: { 'text-field': ['get', 'name'], 'text-font': FONT_BOLD, 'text-size': byZoom(8, 11, 14, 15) },
      paint: { 'text-color': '#fff', ...halo },
    },
    { id: 'counties-line', type: 'line', source: 'land-bounds', 'source-layer': 'boundaries', filter: kind('county'), paint: { 'line-color': '#f783ac', 'line-width': 2.5, 'line-dasharray': [4, 2] } },
    { id: 'plss-line', type: 'line', source: 'land-bounds', 'source-layer': 'boundaries', filter: kind('plss'), paint: { 'line-color': '#e599f7', 'line-width': 1 } },
    {
      id: 'plss-label', type: 'symbol', source: 'land-bounds', 'source-layer': 'boundaries', filter: kind('plss'), minzoom: 13,
      layout: { 'text-field': ['get', 'name'], 'text-font': FONT, 'text-size': 10 },
      paint: { 'text-color': '#f3d9fa', ...halo },
    },
    { id: 'parcels-line', type: 'line', source: 'land-parcels', 'source-layer': 'parcels', paint: { 'line-color': '#ffd43b', 'line-width': byZoom(12, 0.5, 17, 2) } },
    {
      id: 'parcels-label', type: 'symbol', source: 'land-parcels', 'source-layer': 'parcels', minzoom: 15,
      layout: {
        'text-field': ['format', ['coalesce', ['get', 'owner'], ''], {}, '\n', {}, ['concat', ['number-format', ['get', 'acres'], { 'max-fraction-digits': 1 }], ' ac'], { 'font-scale': 0.85 }],
        'text-font': FONT_BOLD, 'text-size': 11, 'text-max-width': 10,
      },
      paint: { 'text-color': '#fff3bf', ...halo },
    },
    {
      id: 'public-label', type: 'symbol', source: 'land-public', 'source-layer': 'public_lands', minzoom: 10,
      layout: { 'text-field': ['get', 'name'], 'text-font': FONT_BOLD, 'text-size': 12, 'text-max-width': 12 },
      paint: { 'text-color': '#d3f9d8', ...halo },
    },
    // Forced-path pinches (pipeline/pinches.py, field-knowledge L10): where cliffs, banks or water squeeze travel into one lane.
    {
      id: 'pinch-points', type: 'symbol', source: 'land-pinches', 'source-layer': 'pinches',
      layout: {
        'icon-image': 'pinch-forced', 'icon-allow-overlap': true, 'symbol-sort-key': ['-', 0, ['get', 'score']],
        'icon-size': ['interpolate', ['linear'], ['get', 'score'], 0, 0.55, 300, 0.85, 1500, 1.2],
        'text-field': ['step', ['zoom'], '', 16, ['concat', 'Pinch · ', ['to-string', ['get', 'lane_yd']], ' yd']],
        'text-font': FONT_BOLD, 'text-size': 11, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-optional': true,
      },
      paint: { 'text-color': '#ffd8f0', ...halo },
    },
    {
      id: 'zones-label', type: 'symbol', source: 'land-zones', 'source-layer': 'area_zones', minzoom: 13,
      layout: { 'text-field': ['match', ['get', 'kind'], 'hunting', 'Hunting zone (archery)', ['get', 'label']], 'text-font': FONT_BOLD, 'text-size': 12 },
      paint: { 'text-color': ['match', ['get', 'kind'], 'hunting', '#b2f2bb', '#ffa8a8'], ...halo },
    },
    {
      id: 'water-blocked-label', type: 'symbol', source: 'land-water', 'source-layer': 'big_water', minzoom: 12,
      layout: { 'text-field': 'Deer walk around', 'text-font': FONT_BOLD, 'text-size': 11 },
      paint: { 'text-color': '#ffc9c9', ...halo },
    },
    { id: 'radar', type: 'raster', source: 'radar' },
    {
      id: 'wind-arrows', type: 'symbol', source: 'wind',
      layout: {
        'icon-image': 'arrow', 'icon-rotate': ['+', ['get', 'dir'], 180], 'icon-rotation-alignment': 'map', 'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['get', 'speed'], 0, 0.6, 20, 1.3],
        'text-field': ['concat', ['to-string', ['round', ['get', 'speed']]], ' mph'], 'text-font': FONT_BOLD, 'text-size': 11,
        'text-offset': [0, 1.8], 'text-allow-overlap': true,
      },
      paint: { 'text-color': '#fff', ...halo },
    },
    {
      id: 'ai-trails', type: 'line', source: 'ai-vec-trails', 'source-layer': 'deer_trails',
      // Dotted lines on the strong lanes only (weight >= 0.7); ones with a workable stand site ('stand') brighter.
      filter: ['any', ['==', ['get', 'kind'], 'stand'], ['>=', ['get', 'weight'], 0.7]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['match', ['get', 'kind'], 'stand', '#ff922b', 'rut', '#f783ac', '#ffc078'],
        'line-width': ['interpolate', ['linear'], ['get', 'weight'], 0.7, 1.2, 1, 2.8],
        'line-dasharray': [3, 2],
      },
    },
    {
      id: 'ai-features', type: 'symbol', source: 'ai-vec-features', 'source-layer': 'terrain_features',
      layout: {
        'icon-image': ['concat', 'tf-', ['get', 'kind']], 'icon-allow-overlap': false, 'icon-padding': 1,
        'icon-size': ['interpolate', ['linear'], ['get', 'score'], 0, 0.7, 1, 1.05],
        'symbol-sort-key': ['-', 1, ['get', 'score']],
        'text-field': ['step', ['zoom'], '', 15, matchBy('kind', Object.entries(TF).map(([k, v]) => [k, v.label]), '')],
        'text-font': FONT, 'text-size': 10, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-optional': true,
      },
      paint: { 'text-color': '#fff', ...halo },
    },
    // Parcel group (groups.tsx): unchecked parcels keep a faint outline.
    { id: 'group-fill', type: 'fill', source: 'group', filter: ['==', ['get', 'on'], true], paint: { 'fill-color': '#3bc9db', 'fill-opacity': 0.16 } },
    { id: 'group-line', type: 'line', source: 'group', paint: { 'line-color': '#3bc9db', 'line-width': 2.5, 'line-opacity': ['case', ['==', ['get', 'on'], true], 1, 0.35] } },
    { id: 'highlight-fill', type: 'fill', source: 'highlight', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#fff', 'fill-opacity': 0.12 } },
    { id: 'highlight-line', type: 'line', source: 'highlight', paint: { 'line-color': '#fff', 'line-width': 3 } },
    {
      id: 'thermal-arrows', type: 'symbol', source: 'thermals', filter: ['!', ['get', 'calm']],
      layout: {
        'icon-image': ['case', ['get', 'up'], 'arrow-warm', 'arrow-cool'], 'icon-rotate': ['get', 'dir'],
        'icon-rotation-alignment': 'map', 'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['get', 'speed'], 0, 0.7, 2, 1.3],
      },
    },
    // Calm or swirling air (thermal flipping, or too weak to move scent): a faint ring, so it doesn't read as "no data".
    { id: 'thermal-calm', type: 'circle', source: 'thermals', filter: ['get', 'calm'],
      paint: { 'circle-radius': 4, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#e9ecef', 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.7 } },
    { id: 'scent-uncertain', type: 'fill', source: 'scent', filter: ['==', ['get', 'band'], -1], paint: { 'fill-color': '#fff', 'fill-opacity': 0.07 } },
    {
      id: 'scent-bands', type: 'fill', source: 'scent', filter: ['>=', ['get', 'band'], 0],
      paint: {
        'fill-color': ['match', ['get', 'level'], 'good', '#40c057', 'marginal', '#fab005', 'bad', '#fa5252', '#ff922b'],
        'fill-opacity': 0.2, // the three bands overlap, so the near band stacks darkest
      },
    },
    { id: 'scent-edge', type: 'line', source: 'scent', filter: ['==', ['get', 'band'], -1], paint: { 'line-color': '#fff', 'line-opacity': 0.5, 'line-width': 1, 'line-dasharray': [2, 2] } },
    { id: 'user-area-fill', type: 'fill', source: 'user', filter: kind('area'), paint: { 'fill-color': userColor, 'fill-opacity': 0.22 } },
    { id: 'user-area-line', type: 'line', source: 'user', filter: kind('area'), paint: { 'line-color': userColor, 'line-width': 2 } },
    { id: 'user-lines', type: 'line', source: 'user', filter: kind('line'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': userColor, 'line-width': 3 } },
    { id: 'user-tracks', type: 'line', source: 'user', filter: kind('track'), paint: { 'line-color': ['coalesce', ['get', 'color'], '#ff6b6b'], 'line-width': 3, 'line-dasharray': [2, 1] } },
    { id: 'highlight-point', type: 'circle', source: 'highlight', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 20, 'circle-color': 'rgba(255,255,255,.25)', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } },
    {
      id: 'user-pins', type: 'symbol', source: 'user', filter: kind('pin'),
      layout: {
        'icon-image': ['coalesce', ['get', 'icon'], 'pin'], 'icon-allow-overlap': true,
        'text-field': ['concat', '#', ['to-string', ['get', 'num']], ['case', ['>', ['length', ['get', 'name']], 0], ['concat', ' ', ['get', 'name']], ''],
          ['case', ['has', 'harvest_score'], ['concat', ' · ', ['to-string', ['get', 'harvest_score']], '″'], '']],
        'text-font': FONT_BOLD, 'text-size': 12, 'text-optional': true,
        // Labels try every side of the pin before giving up, so stacked pins still show their numbers.
        'text-variable-anchor': ['top', 'bottom', 'right', 'left', 'top-right', 'bottom-left'], 'text-radial-offset': 1.4,
      },
      paint: { 'text-color': '#fff', ...halo },
    },
    { id: 'journal-spots', type: 'fill', source: 'journal', filter: ['==', ['get', 'role'], 'spot'], paint: { 'fill-color': '#f06595', 'fill-opacity': 0.14 } },
    { id: 'journal-spots-line', type: 'line', source: 'journal', filter: ['==', ['get', 'role'], 'spot'], paint: { 'line-color': '#f06595', 'line-width': 2, 'line-dasharray': [3, 2] } },
    {
      id: 'journal-obs', type: 'symbol', source: 'journal', filter: ['==', ['get', 'role'], 'obs'],
      layout: {
        'icon-image': ['match', ['get', 'kind'], 'kill', 'harvest', 'sit', 'stand', 'sign', 'rub', 'story', 'pin', ['case', ['get', 'mature'], 'buck', 'doe']],
        'icon-size': 0.8, 'icon-allow-overlap': true,
        'text-field': ['step', ['zoom'], '', 14, ['get', 'label']], 'text-font': FONT, 'text-size': 10, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-optional': true,
      },
      paint: { 'text-color': '#ffc9de', ...halo },
    },
    { id: 'plan-cone', type: 'fill', source: 'plan', filter: ['==', ['get', 'role'], 'cone'], paint: { 'fill-color': '#ff922b', 'fill-opacity': 0.22 } },
    {
      id: 'plan-routes', type: 'line', source: 'plan', filter: ['match', ['get', 'role'], ['entry', 'exit'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['match', ['get', 'role'], 'entry', '#69db7c', '#4dabf7'], 'line-width': 3.5, 'line-dasharray': [2, 1.2] },
    },
    { id: 'plan-beds', type: 'circle', source: 'plan', filter: ['==', ['get', 'role'], 'bed'], paint: { 'circle-radius': 5, 'circle-color': '#be4bdb', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } },
    { id: 'plan-stands', type: 'circle', source: 'plan', filter: ['==', ['get', 'role'], 'stand'], paint: { 'circle-radius': 13, 'circle-color': '#f08c00', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } },
    {
      id: 'plan-labels', type: 'symbol', source: 'plan', filter: ['==', ['get', 'role'], 'stand'],
      layout: { 'text-field': ['get', 'label'], 'text-font': FONT_BOLD, 'text-size': 15, 'text-allow-overlap': true },
      paint: { 'text-color': '#1a1206' },
    },
    { id: 'draft-line', type: 'line', source: 'draft', paint: { 'line-color': '#fff', 'line-width': 2, 'line-dasharray': [2, 2] } },
    { id: 'draft-points', type: 'circle', source: 'draft', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 4, 'circle-color': '#fff', 'circle-stroke-color': '#000', 'circle-stroke-width': 1 } },
  ];
  // Every overlay starts hidden; the app switches on only the ones in his saved choices. Otherwise the map downloads
  // tiles for every layer (slope, radar, AI rasters, contours) before anything else.
  // Zoomed out past DETAIL_MINZOOM it's just the map (imagery, roads, town names): no overlay loads anything.
  const overlay = new Set(Object.values(OVERLAY_LAYERS).flatMap((o) => o.layers));
  const mapOnly = new Set(OVERLAY_LAYERS.labels.layers);
  for (const l of layers) {
    if (!overlay.has(l.id)) continue;
    l.layout = { ...l.layout, visibility: 'none' } as never;
    if (!mapOnly.has(l.id)) l.minzoom = Math.max(l.minzoom ?? 0, START_ZOOM[l.id] ?? DETAIL_MINZOOM);
  }

  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {
      ...Object.fromEntries(BASEMAPS.map((b) => [`base-${b.id}`, {
        type: 'raster' as const, tiles: [b.tiles], tileSize: b.tileSize, maxzoom: b.maxzoom, attribution: `${b.source} (${b.date})`,
      }])),
      dem: { type: 'raster-dem', tiles: [demSource.sharedDemProtocolUrl], tileSize: DEM.tileSize, maxzoom: DEM.maxzoom, encoding: DEM.encoding, attribution: '© Mapterhorn, USGS 3DEP' },
      'dem-hs': { type: 'raster-dem', tiles: [demSource.sharedDemProtocolUrl], tileSize: DEM.tileSize, maxzoom: DEM.maxzoom, encoding: DEM.encoding },
      contours: {
        type: 'vector', maxzoom: 16,
        tiles: [demSource.contourProtocolUrl({
          multiplier: 3.28084, overzoom: 1, elevationKey: 'ele', levelKey: 'level', contourLayer: 'contours',
          thresholds: { 11: [50, 250], 12: [20, 100], 13: [10, 50], 15: [5, 25] },
        })],
      },
      slope: { type: 'raster', tiles: ['slope://{z}/{x}/{y}'], tileSize: 512, maxzoom: DEM.maxzoom, attribution: '© Mapterhorn, USGS 3DEP' },
      osm: { type: 'vector', url: VECTOR_BASE, attribution: '© OpenStreetMap contributors, OpenFreeMap' },
      'land-parcels': { type: 'vector', tiles: tiles('parcels'), minzoom: 12, maxzoom: 16, attribution: 'County assessors (Callaway, Cooper, Cole, Boone)' },
      'land-public': { type: 'vector', tiles: tiles('public_lands'), minzoom: 6, maxzoom: 14, attribution: 'MDC, USFS, USFWS' },
      'land-pinches': { type: 'vector', tiles: tiles('pinches'), minzoom: 13, maxzoom: 15, attribution: 'Terrain model' },
      'land-zones': { type: 'vector', tiles: tiles('area_zones'), minzoom: 10, maxzoom: 14, attribution: 'MDC area maps' },
      'land-water': { type: 'vector', tiles: tiles('big_water'), minzoom: 9, maxzoom: 14, attribution: '© OpenStreetMap contributors' },
      'land-bounds': { type: 'vector', tiles: tiles('boundaries'), minzoom: 6, maxzoom: 14, attribution: 'MSDIS' },
      'ai-bed-buck': { type: 'raster', tiles: aiTiles('bed_buck_7'), tileSize: 256, minzoom: 10, maxzoom: 14, attribution: 'Terrain model' },
      'ai-bed-doe': { type: 'raster', tiles: aiTiles('bed_doe'), tileSize: 256, minzoom: 10, maxzoom: 14 },
      'ai-corridor': { type: 'raster', tiles: aiTiles('corridor'), tileSize: 256, minzoom: 10, maxzoom: 14 },
      'ai-landform': { type: 'raster', tiles: landformTiles([]), tileSize: 256, minzoom: 10, maxzoom: 14 },
      'ai-vec-features': { type: 'vector', tiles: tiles('terrain_features'), minzoom: 11, maxzoom: 15 },
      'ai-vec-trails': { type: 'vector', tiles: tiles('deer_trails'), minzoom: 12, maxzoom: 15 },
      'ai-vec-food': { type: 'vector', tiles: tiles('food_areas'), minzoom: 10, maxzoom: 14, attribution: 'USDA NASS CDL' },
      radar: { type: 'raster', tiles: [RADAR_TILES], tileSize: 256, attribution: 'NEXRAD: Iowa Environmental Mesonet' },
      wind: { type: 'geojson', data: EMPTY },
      scent: { type: 'geojson', data: EMPTY },
      plan: { type: 'geojson', data: EMPTY },
      journal: { type: 'geojson', data: EMPTY },
      thermals: { type: 'geojson', data: EMPTY },
      user: { type: 'geojson', data: EMPTY },
      draft: { type: 'geojson', data: EMPTY },
      highlight: { type: 'geojson', data: EMPTY },
      group: { type: 'geojson', data: EMPTY },
    },
    layers,
  };
}

function drawIcon(id: string, size: number) {
  const def = ICONS[id] ?? ICONS.pin;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const r = size / 2;
  ctx.beginPath();
  ctx.arc(r, r, r - size / 16, 0, Math.PI * 2);
  ctx.fillStyle = def.color;
  ctx.fill();
  ctx.lineWidth = size / 16;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  // Emoji glyph boxes vary by platform, and iOS Safari doesn't reliably flush emoji pixels to a
  // canvas we can read back — so center on the *ink* bounds from measureText, which is
  // synchronous everywhere. Only fall back to reading pixels if measureText reports no ink.
  const font = `${size * 0.46}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(def.glyph);
  const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  let gx: number, gy: number;
  if (Number.isFinite(inkW) && Number.isFinite(inkH) && inkW > 0 && inkH > 0) {
    // Place the baseline so the painted box lands dead center: [x0-left, x0+right] and [y0-ascent, y0+descent].
    gx = r + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
    gy = r + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  } else {
    const { dx, dy } = measureGlyphByPixels(def.glyph, font, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    gx = r + dx;
    gy = r + dy;
  }
  ctx.fillText(def.glyph, gx, gy);
  return c;
}

// Fallback centering: read back the painted pixels (works on Chromium; used only if measureText gives no ink).
function measureGlyphByPixels(glyph: string, font: string, size: number) {
  const r = size / 2;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(glyph, r, r);
  const px = g.getImageData(0, 0, size, size).data;
  let minX = size, minY = size, maxX = -1, maxY = -1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (px[(y * size + x) * 4 + 3] <= 8) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { dx: maxX < 0 ? 0 : r - (minX + maxX) / 2, dy: maxY < 0 ? 0 : r - (minY + maxY) / 2 };
}

const iconUrls: Record<string, string> = {};
export const iconUrl = (id: string) => (iconUrls[id] ??= drawIcon(id, 48).toDataURL());

function drawArrow(size: number, fill = '#fff') {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const s = size / 24;
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(12, 2); ctx.lineTo(19, 14); ctx.lineTo(14, 14); ctx.lineTo(14, 22); ctx.lineTo(10, 22); ctx.lineTo(10, 14); ctx.lineTo(5, 14);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(0,0,0,.8)';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  return c;
}

export function registerIcons(map: Map) {
  for (const [kind, def] of Object.entries(TF)) {
    const size = 40;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.beginPath();
    if (kind.startsWith('bed_')) ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
    else ctx.roundRect(3, 3, size - 6, size - 6, 7);
    ctx.fillStyle = def.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    if (def.symbol === 'pinch') {
      ctx.beginPath();
      ctx.moveTo(9, 7); ctx.lineTo(31, 7); ctx.lineTo(20, 21);
      ctx.closePath();
      ctx.moveTo(20, 19); ctx.lineTo(31, 33); ctx.lineTo(9, 33);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.font = `bold ${size * 0.5}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.letter, size / 2, size / 2 + 1);
    }
    map.addImage(`tf-${kind}`, ctx.getImageData(0, 0, size, size), { pixelRatio: 2 });
  }
  // Hourglass for forced-path pinches.
  const pc = document.createElement('canvas');
  pc.width = pc.height = 44;
  const px2 = pc.getContext('2d')!;
  px2.beginPath(); px2.moveTo(8, 6); px2.lineTo(36, 6); px2.lineTo(24, 22); px2.lineTo(36, 38); px2.lineTo(8, 38); px2.lineTo(20, 22); px2.closePath();
  px2.fillStyle = '#e64980'; px2.fill(); px2.lineWidth = 3; px2.strokeStyle = '#fff'; px2.stroke();
  map.addImage('pinch-forced', px2.getImageData(0, 0, 44, 44), { pixelRatio: 2 });
  // Diagonal red hatch for water deer won't cross.
  const h = document.createElement('canvas');
  h.width = h.height = 16;
  const hx = h.getContext('2d')!;
  hx.fillStyle = 'rgba(255, 107, 107, 0.12)';
  hx.fillRect(0, 0, 16, 16);
  hx.strokeStyle = 'rgba(255, 107, 107, 0.75)';
  hx.lineWidth = 2;
  hx.beginPath();
  for (const o of [-16, 0, 16]) { hx.moveTo(o, 16); hx.lineTo(o + 16, 0); }
  hx.stroke();
  map.addImage('hatch-blocked', hx.getImageData(0, 0, 16, 16), { pixelRatio: 2 });
  const arrows: [string, string][] = [['arrow', '#fff'], ['arrow-warm', '#ff922b'], ['arrow-cool', '#4dabf7']];
  for (const [id, fill] of arrows) map.addImage(id, drawArrow(48, fill).getContext('2d')!.getImageData(0, 0, 48, 48), { pixelRatio: 2 });
  for (const id of Object.keys(ICONS)) {
    const c = drawIcon(id, 64);
    map.addImage(id, c.getContext('2d')!.getImageData(0, 0, 64, 64), { pixelRatio: 2 });
  }
}

export function setGeoJSON(map: Map, source: string, data: GeoJSON.GeoJSON) {
  (map.getSource(source) as maplibregl.GeoJSONSource | undefined)?.setData(data);
}
