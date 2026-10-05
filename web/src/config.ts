// Map sources. Every layer carries its source + data date so the UI can show how fresh it is.

// MSDIS imagery goes through the API's disk cache (api/src/tiles.ts): 4–7 s per tile upstream, instant once seen.
// Fetched straight from the API under the other local host name, so slow first-time tiles get their own connections.
const API_PORT = 8787;
const otherHost = location.hostname === '127.0.0.1' ? 'localhost' : '127.0.0.1';
// From the internet (Tailscale Funnel) there's only the one address, and HTTPS/2 makes the connection trick unneeded.
const onThisPc = ['localhost', '127.0.0.1'].includes(location.hostname);
const cachedImagery = (id: string) => onThisPc
  ? `${location.protocol}//${otherHost}:${API_PORT}/imagery/${id}/{z}/{x}/{y}`
  : `${location.origin}/imagery/${id}/{z}/{x}/{y}`;

// minzoom: below it only the fast Esri aerial shows. Esri also sits underneath at every zoom, so the screen is never
// black or blurry while the sharper MSDIS tiles arrive.
export type Basemap = { id: string; label: string; date: string; source: string; tiles: string; tileSize: number; maxzoom: number; minzoom?: number };

export const BASEMAPS: Basemap[] = [
  {
    id: 'leafoff',
    label: 'Aerial 6″ statewide',
    date: '2023–24',
    source: 'MSDIS Missouri statewide imagery',
    tiles: cachedImagery('leafoff'),
    tileSize: 512,
    maxzoom: 22,
    minzoom: 12,
  },
  {
    id: 'naip',
    label: 'Aerial summer 30 cm',
    date: '2024',
    source: 'USDA NAIP via MSDIS',
    tiles: cachedImagery('naip'),
    tileSize: 512,
    maxzoom: 21,
    minzoom: 12,
  },
  // Esri World Imagery: pre-cut tiles on a CDN, fast everywhere. It's the base under the 6" leaf-off at every zoom, so
  // the screen is never blank or blurry while MSDIS tiles arrive. Straight from Esri, never disk-cached (their terms).
  {
    id: 'esri',
    label: 'Aerial (fast)',
    date: 'varies',
    source: 'Esri, Maxar, Earthstar Geographics',
    tiles: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    tileSize: 256,
    maxzoom: 19,
  },
  {
    id: 'topo',
    label: 'Topo',
    date: '2026-09',
    source: 'USGS Topo',
    tiles: cachedImagery('topo'),
    tileSize: 256,
    maxzoom: 16,
  },
];

export const DEM = {
  tiles: cachedImagery('dem'), // Mapterhorn (3DEP), through the API's disk cache
  tileSize: 512,
  maxzoom: 16,
  encoding: 'terrarium' as const,
};


export const VECTOR_BASE = 'https://tiles.openfreemap.org/planet';
export const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
export const FONT = ['Noto Sans Regular'];
export const FONT_BOLD = ['Noto Sans Bold'];

export type Overlay = { id: string; label: string; date: string; source: string; on: boolean; opacity: number };

export const OVERLAYS: Overlay[] = [
  { id: 'labels', label: 'Roads & labels', date: 'live', source: 'OpenStreetMap / OpenFreeMap', on: true, opacity: 1 },
  { id: 'public', label: 'Public land', date: 'ingest', source: 'MDC, USFS, USFWS', on: true, opacity: 0.35 },
  { id: 'pinches', label: 'Pinches (forced paths)', date: 'ai', source: 'Terrain model: cliffs, banks and water squeezing travel', on: true, opacity: 1 },
  { id: 'zones', label: 'Hunting zones (public areas)', date: 'ingest', source: 'Traced from MDC area maps', on: true, opacity: 1 },
  { id: 'water', label: 'Big water (deer walk around)', date: 'ai', source: 'OpenStreetMap lakes of 10+ acres', on: true, opacity: 1 },
  { id: 'parcels', label: 'Parcels & owners', date: 'ingest', source: 'County assessors: Callaway, Cooper, Cole, Boone', on: true, opacity: 1 },
  { id: 'plss', label: 'Sections (PLSS)', date: 'ingest', source: 'MSDIS', on: false, opacity: 0.8 },
  { id: 'counties', label: 'County lines', date: 'ingest', source: 'MSDIS', on: true, opacity: 0.9 },
  { id: 'ai_features', label: 'AI terrain features', date: 'ai', source: 'Terrain model (3DEP, CDL, OSM)', on: true, opacity: 1 },
  { id: 'ai_bed_buck', label: 'AI buck bedding (for the wind)', date: 'ai', source: 'Terrain model', on: false, opacity: 0.8 },
  { id: 'ai_bed_doe', label: 'AI doe bedding', date: 'ai', source: 'Terrain model', on: false, opacity: 0.7 },
  { id: 'ai_corridor', label: 'AI travel corridors', date: 'ai', source: 'Least-cost paths bed ↔ food/bed', on: false, opacity: 0.8 },
  { id: 'ai_trails', label: 'AI predicted trails (zoom 12+)', date: 'ai', source: 'Least-cost paths', on: false, opacity: 0.7 },
  { id: 'ai_landform', label: 'Landforms (benches, draws, cold pools)', date: 'ai', source: '3DEP terrain analysis', on: false, opacity: 0.8 },
  { id: 'ai_food', label: 'Crop fields (by season)', date: 'ai', source: 'USDA Cropland Data Layer', on: false, opacity: 0.6 },
  { id: 'hillshade', label: 'LiDAR hillshade', date: '3DEP', source: 'Mapterhorn (USGS 3DEP)', on: false, opacity: 0.5 },
  { id: 'contours', label: 'Contours (ft)', date: '3DEP', source: 'Mapterhorn (USGS 3DEP)', on: false, opacity: 0.9 },
  { id: 'slope', label: 'Slope', date: '3DEP', source: 'USGS 3DEP', on: false, opacity: 0.45 },
  { id: 'scent', label: 'Scent cones (all stands)', date: 'forecast', source: 'Wind + thermal model', on: true, opacity: 0.2 },
  { id: 'thermals', label: 'Thermal flow (zoom 13+)', date: 'forecast', source: 'Sun + terrain model', on: false, opacity: 0.9 },
  { id: 'wind', label: 'Wind arrows (time slider)', date: 'forecast', source: 'Open-Meteo', on: false, opacity: 0.9 },
  { id: 'radar', label: 'Radar (current)', date: 'live', source: 'NOAA NEXRAD via Iowa State Mesonet', on: false, opacity: 0.6 },
];

export const RADAR_TILES = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png';

export const PUBLIC_COLORS: Record<string, string> = { mdc: '#2f9e44', usfs: '#8ce99a', usfws: '#fab005' };

export const START = { center: [-92.2, 38.85] as [number, number], zoom: 9.5 };

// Pin icons. Drawn at runtime on canvas (no image assets needed).
export type IconDef = { label: string; glyph: string; color: string; group: string };

export const ICONS: Record<string, IconDef> = {
  stand: { label: 'Tree stand', glyph: '🌳', color: '#e8590c', group: 'Setups' },
  blind: { label: 'Ground blind', glyph: '⛺', color: '#d9480f', group: 'Setups' },
  camera: { label: 'Trail camera', glyph: '📷', color: '#1971c2', group: 'Setups' },
  feeder: { label: 'Food plot / mineral', glyph: '🌱', color: '#2f9e44', group: 'Setups' },
  bed: { label: 'Bedding', glyph: '🛏️', color: '#862e9c', group: 'Sign' },
  pinch: { label: 'Pinch', glyph: '⌛', color: '#e64980', group: 'Sign' },
  rub: { label: 'Rub', glyph: '🪵', color: '#a0522d', group: 'Sign' },
  scrape: { label: 'Scrape', glyph: '⛏️', color: '#795548', group: 'Sign' },
  trail: { label: 'Deer trail', glyph: '👣', color: '#6d4c41', group: 'Sign' },
  crossing: { label: 'Crossing / funnel', glyph: '✖️', color: '#c92a2a', group: 'Sign' },
  water: { label: 'Water', glyph: '💧', color: '#1c7ed6', group: 'Sign' },
  buck: { label: 'Buck sighting', glyph: '🦌', color: '#5c3d1e', group: 'Sightings' },
  doe: { label: 'Doe sighting', glyph: '🦌', color: '#c08552', group: 'Sightings' },
  turkey: { label: 'Turkey', glyph: '🦃', color: '#495057', group: 'Sightings' },
  other: { label: 'Other animal', glyph: '🐾', color: '#868e96', group: 'Sightings' },
  harvest: { label: 'Harvest', glyph: '🏆', color: '#f08c00', group: 'Sightings' },
  parking: { label: 'Parking', glyph: '🅿️', color: '#343a40', group: 'Access' },
  gate: { label: 'Gate', glyph: '🚧', color: '#343a40', group: 'Access' },
  pin: { label: 'Pin', glyph: '📍', color: '#e03131', group: 'Access' },
};

export const STAND_TYPES = ['Ladder', 'Hang-on', 'Climber', 'Saddle', 'Box blind', 'Tripod'];
export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const LINE_COLORS = ['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#f783ac', '#ffffff'];
