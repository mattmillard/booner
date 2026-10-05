import type { Feature, Geometry, Position } from 'geojson';
import { forward as toMgrs } from 'mgrs';
import type { UserFeature } from './api';

const R = 6371008.8; // mean earth radius, m
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceM(a: Position, b: Position) {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const lengthM = (coords: Position[]) =>
  coords.slice(1).reduce((sum, p, i) => sum + distanceM(coords[i], p), 0);

// Spherical polygon area (same method as turf/area), m².
export function areaM2(ring: Position[]) {
  let total = 0;
  for (let i = 0; i < ring.length; i++) {
    const [p1, p2, p3] = [ring[i], ring[(i + 1) % ring.length], ring[(i + 2) % ring.length]];
    total += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
  }
  return Math.abs((total * R * R) / 2);
}

export function fmtDistance(m: number) {
  const ft = m * 3.28084;
  return ft < 1000 ? `${Math.round(ft)} ft (${Math.round(ft / 3)} yd)` : `${(m / 1609.344).toFixed(2)} mi`;
}

export const fmtAcres = (m2: number) => `${(m2 / 4046.8564224).toFixed(m2 < 40468 ? 2 : 1)} ac`;

export const usng = (lng: number, lat: number) => {
  const m = toMgrs([lng, lat], 5); // e.g. 15SWC1234567890
  return m.replace(/^(\d+[A-Z])([A-Z]{2})(\d{5})(\d{5})$/, '$1 $2 $3 $4');
};

export function measure(geometry: Geometry) {
  if (geometry.type === 'LineString') return fmtDistance(lengthM(geometry.coordinates));
  if (geometry.type === 'Polygon') return `${fmtAcres(areaM2(geometry.coordinates[0]))} · ${fmtDistance(lengthM(geometry.coordinates[0]))} around`;
  return '';
}

const esc = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
const pt = (p: Position) => `lat="${p[1]}" lon="${p[0]}"`;

export function toGpx(features: UserFeature[]) {
  const body = features.map((f) => {
    const name = `<name>${esc(f.properties.name || f.properties.icon || f.properties.kind)}</name><desc>${esc(f.properties.notes)}</desc>`;
    const g = f.geometry;
    if (g.type === 'Point') return `<wpt ${pt(g.coordinates)}>${name}<sym>${esc(f.properties.icon ?? 'pin')}</sym></wpt>`;
    if (g.type === 'LineString')
      return `<trk>${name}<trkseg>${g.coordinates.map((p) => `<trkpt ${pt(p)}/>`).join('')}</trkseg></trk>`;
    if (g.type === 'Polygon')
      return `<trk>${name}<trkseg>${g.coordinates[0].map((p) => `<trkpt ${pt(p)}/>`).join('')}</trkseg></trk>`;
    return '';
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="hunt-app" xmlns="http://www.topografix.com/GPX/1/1">${body.join('\n')}</gpx>`;
}

export function toKml(features: UserFeature[]) {
  const coords = (ps: Position[]) => ps.map((p) => `${p[0]},${p[1]}`).join(' ');
  const body = features.map((f) => {
    const g = f.geometry;
    const shape =
      g.type === 'Point' ? `<Point><coordinates>${coords([g.coordinates])}</coordinates></Point>`
      : g.type === 'LineString' ? `<LineString><coordinates>${coords(g.coordinates)}</coordinates></LineString>`
      : g.type === 'Polygon' ? `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords(g.coordinates[0])}</coordinates></LinearRing></outerBoundaryIs></Polygon>`
      : '';
    return `<Placemark><name>${esc(f.properties.name)}</name><description>${esc(f.properties.notes)}</description>${shape}</Placemark>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${body.join('\n')}</Document></kml>`;
}

// Flatten imported GeoJSON into the shapes we store.
export function importable(f: Feature): { geometry: Geometry; kind: 'pin' | 'line' | 'area'; name: string }[] {
  const name = String(f.properties?.name ?? '');
  const g = f.geometry;
  if (!g) return [];
  switch (g.type) {
    case 'Point': return [{ geometry: g, kind: 'pin', name }];
    case 'LineString': return [{ geometry: g, kind: 'line', name }];
    case 'Polygon': return [{ geometry: g, kind: 'area', name }];
    case 'MultiLineString': return g.coordinates.map((c) => ({ geometry: { type: 'LineString', coordinates: c }, kind: 'line', name }));
    case 'MultiPolygon': return g.coordinates.map((c) => ({ geometry: { type: 'Polygon', coordinates: c }, kind: 'area', name }));
    case 'GeometryCollection': return g.geometries.flatMap((geometry) => importable({ ...f, geometry }));
    default: return [];
  }
}

export function download(filename: string, text: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
