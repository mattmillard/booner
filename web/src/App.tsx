import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Geometry, Polygon, Position } from 'geojson';
import { api, type Folder, type LandInfo, type UserFeature } from './api';
import { BASEMAPS, OVERLAYS, START } from './config';
import { AI_CLICKABLE, buildStyle, OVERLAY_LAYERS, registerIcons, setGeoJSON, USER_LAYERS } from './map';
import { aiTiles, CROP, landformTiles, samplePixel, windBin } from './terrainai';
import { foodAttraction } from './seasonal';
import { phaseOn } from './season';
import { compass } from './conditions';
import { distanceM, fmtAcres, fmtDistance, areaM2, lengthM, usng } from './geo';
import { FeatureEditor, FeatureList, LandCard, LayersPanel, Login } from './panels';
import { IntelPanel, nowHour } from './intel';
import { PlanPanel } from './plan';
import { findGroup, GroupPanel, parcelAt, type Group } from './groups';
import { SettingsPanel } from './settings';
import { FieldNotesPanel } from './fieldnotes';
import { CamerasPanel } from './cameras';
import { ViewControl } from './viewcontrol';
import { JournalPanel, type Insight, type Observation } from './journal';
import { planFeatures, type Plan } from './planner';
import { sunPosition } from './astro';
import { analyzeStand, isStand, plumeFeatures } from './stands';
import { getConditions, hourAt } from './conditions';
import { terrainCached } from './terrain';
import { thermal } from './scent';

type Mode = 'none' | 'pin' | 'line' | 'area' | 'measure';
type Panel = null | 'layers' | 'list' | 'intel' | 'plan' | 'groups' | 'journal' | 'fieldnotes' | 'cameras' | 'settings' | { feature: string } | { land: [number, number]; info: LandInfo | null; error?: string };
export type Prefs = {
  basemap: string;
  overlays: Record<string, { on: boolean; opacity: number }>;
  terrain: { on: boolean; exaggeration: number };
  tfOff: string[]; // terrain-feature kinds he switched off (creek crossings, saddles, ...)
  landformOff: string[]; // landform classes he switched off (Creek, Draw, ...)
  view: { center: [number, number]; zoom: number; bearing: number; pitch: number };
};

// Keeps fitted content clear of the panel: a bottom sheet on phones, a right column on desktop.
const fitPadding = () => window.innerWidth < 700
  ? { top: 60, bottom: Math.round(window.innerHeight * 0.55) + 20, left: 20, right: 20 }
  : { top: 60, bottom: 60, left: 90, right: 420 };

const PREFS_KEY = 'hunt-app:prefs';
function loadPrefs(): Prefs {
  const defaults: Prefs = {
    basemap: BASEMAPS[0].id,
    overlays: Object.fromEntries(OVERLAYS.map((o) => [o.id, { on: o.on, opacity: o.opacity }])),
    terrain: { on: false, exaggeration: 1.5 },
    tfOff: [],
    landformOff: [],
    view: { ...START, bearing: 0, pitch: 0 },
  };
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
    const basemap = BASEMAPS.some((b) => b.id === saved.basemap) ? saved.basemap : defaults.basemap; // e.g. retired 'usgs'
    return { ...defaults, ...saved, basemap, overlays: { ...defaults.overlays, ...saved.overlays } };
  } catch {
    return defaults;
  }
}

export default function App() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    api.me().then((u) => setEmail(u.email), () => setEmail(null));
  }, []);
  if (email === undefined) return null;
  if (!email) return <Login onDone={setEmail} />;
  return <MapApp email={email} onLogout={() => api.logout().then(() => setEmail(null))} />;
}

function MapApp({ email, onLogout }: { email: string; onLogout: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [features, setFeatures] = useState<UserFeature[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sourceDates, setSourceDates] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState<Panel>(null);
  const [camera, setCamera] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('none');
  const [draft, setDraft] = useState<Position[]>([]);
  const [track, setTrack] = useState<{ watch: number; coords: Position[] } | null>(null);
  const [time, setTime] = useState(nowHour);
  const [sunShadows, setSunShadows] = useState(false);
  const [windFrom, setWindFrom] = useState<number | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupArea, setGroupArea] = useState<{ name: string; area: Polygon } | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [windGrid, setWindGrid] = useState<{ lat: number; lng: number; t: number[]; speed: number[]; dir: number[] }[]>([]);

  // Map event handlers are bound once; they read current state through this ref.
  const live = useRef({ mode, prefs });
  live.current = { mode, prefs };

  useEffect(() => {
    api.features().then((fc) => setFeatures(fc.features));
    api.folders().then(setFolders);
    fetch('/api/land/sources').then((r) => r.json()).then(setSourceDates, () => {});
    fetch('/api/journal').then((r) => (r.ok ? r.json() : [])).then(setObservations, () => {});
    fetch('/api/brain/insights').then((r) => (r.ok ? r.json() : [])).then(setInsights, () => {});
  }, []);

  useEffect(() => {
    const { view } = live.current.prefs;
    const m = new maplibregl.Map({
      container: container.current!,
      style: buildStyle(),
      ...view,
      maxPitch: 85,
      maxTileCacheSize: 3000, // zoom out and back in without re-downloading
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    m.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true, positionOptions: { enableHighAccuracy: true } }), 'top-right');
    m.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left');
    m.doubleClickZoom.disable();

    if (import.meta.env.DEV) (window as any).__map = m; // debugging handle, dev builds only
    // style.load, not load: 'load' waits for every first tile (4–7 s MSDIS imagery, DEM), and his layer choices and the
    // base map aren't applied until this runs.
    m.once('style.load', () => {
      registerIcons(m);
      m.fire('move');
      setMap(m);
    });
    m.on('move', () => {
      const c = m.getCenter();
      const { terrain } = live.current.prefs;
      const elev = terrain.on ? m.queryTerrainElevation(c) : null;
      if (readout.current)
        readout.current.textContent = `zoom ${m.getZoom().toFixed(1)} · ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)} · ${usng(c.lng, c.lat)}` +
          (elev != null ? ` · ${Math.round((elev / terrain.exaggeration) * 3.28084)} ft` : '');
    });
    // Once the map has sat still for a few seconds, have the API preload the surrounding aerial in the background.
    let idleTimer = 0;
    m.on('movestart', () => clearTimeout(idleTimer));
    m.on('moveend', () => {
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        const basemap = live.current.prefs.basemap;
        if (m.getZoom() < 12) return;
        const b = m.getBounds();
        fetch('/api/tiles/prefetch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: basemap, bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom: m.getZoom() }),
        }).catch(() => {});
      }, 3000);
      const c = m.getCenter();
      setPrefs((p) => ({ ...p, view: { center: [c.lng, c.lat], zoom: m.getZoom(), bearing: m.getBearing(), pitch: m.getPitch() } }));
    });
    m.on('click', (e) => {
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const current = live.current.mode;
      if (current === 'pin') {
        setMode('none');
        createFeature({ type: 'Point', coordinates: p }, { kind: 'pin', icon: 'stand' });
      } else if (current !== 'none') {
        setDraft((d) => [...d, p]);
      } else {
        const hit = m.queryRenderedFeatures(e.point, { layers: USER_LAYERS })[0];
        const ai = hit ? null : m.queryRenderedFeatures(e.point, { layers: AI_CLICKABLE.filter((l) => m.getLayer(l)) })[0];
        if (hit) setPanel({ feature: String(hit.properties.id) });
        else openLand(ai?.geometry.type === 'Point' ? (ai.geometry.coordinates as [number, number]) : p);
      }
    });
    m.on('dblclick', () => {
      if (live.current.mode !== 'none') document.getElementById('finish-draw')?.click();
    });
    m.on('mousemove', (e) => {
      const drawing = live.current.mode !== 'none';
      const overUser = !drawing && m.queryRenderedFeatures(e.point, { layers: [...USER_LAYERS, ...AI_CLICKABLE] }).length > 0;
      m.getCanvas().style.cursor = drawing ? 'crosshair' : overUser ? 'pointer' : '';
    });
    return () => m.remove();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  // Apply basemap / overlays / terrain.
  useEffect(() => {
    if (!map) return;
    for (const b of BASEMAPS) map.setLayoutProperty(`base-${b.id}`, 'visibility', b.id === prefs.basemap ? 'visible' : 'none');
    const underlay = BASEMAPS.find((b) => b.id === prefs.basemap)?.minzoom;
    map.setLayoutProperty('base-underlay', 'visibility', underlay ? 'visible' : 'none');
    for (const [id, { layers, opacity: [layer, prop] }] of Object.entries(OVERLAY_LAYERS)) {
      const o = prefs.overlays[id];
      for (const l of layers) map.setLayoutProperty(l, 'visibility', o?.on ? 'visible' : 'none');
      if (o) map.setPaintProperty(layer, prop as 'line-opacity', o.opacity);
    }
    map.setTerrain(prefs.terrain.on ? { source: 'dem', exaggeration: prefs.terrain.exaggeration } : null);
  }, [map, prefs.basemap, prefs.overlays, prefs.terrain]);

  // Per-kind switches inside the AI terrain features and landform overlays.
  useEffect(() => {
    if (!map) return;
    map.setFilter('ai-features', prefs.tfOff.length ? ['!', ['in', ['get', 'kind'], ['literal', prefs.tfOff]]] : null);
  }, [map, prefs.tfOff.join()]);
  useEffect(() => {
    if (!map) return;
    (map.getSource('ai-landform') as maplibregl.RasterTileSource).setTiles(landformTiles(prefs.landformOff));
  }, [map, prefs.landformOff.join()]);

  useEffect(() => {
    if (!map) return;
    // Flatten what the map labels need (MapLibre can't read nested props): trophy score on harvest pins.
    const flat = features.map((f) => f.properties.props?.harvest?.score != null
      ? { ...f, properties: { ...f.properties, harvest_score: f.properties.props.harvest.score } } : f);
    setGeoJSON(map, 'user', { type: 'FeatureCollection', features: flat });
  }, [map, features]);

  // Keep the default forecast time on the current hour as the clock rolls over.
  useEffect(() => {
    const id = setInterval(() => setTime((t) => Math.max(t, nowHour())), 60_000);
    return () => clearInterval(id);
  }, []);

  // Wind arrows: refetch the grid when the view moves, re-render when the time slider moves.
  const windOn = prefs.overlays.wind?.on;
  useEffect(() => {
    if (!map || !windOn) return;
    const b = map.getBounds();
    fetch(`/api/weather/wind?bbox=${[b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((v) => v.toFixed(3))}`)
      .then((r) => (r.ok ? r.json() : [])).then(setWindGrid, () => {});
  }, [map, windOn, prefs.view]);
  useEffect(() => {
    if (!map) return;
    setGeoJSON(map, 'wind', {
      type: 'FeatureCollection',
      features: windGrid.flatMap((g) => {
        const i = g.t.reduce((best, t, k) => (Math.abs(t * 1000 - time) < Math.abs(g.t[best] * 1000 - time) ? k : best), 0);
        return g.speed[i] == null ? [] : [{ type: 'Feature', geometry: { type: 'Point', coordinates: [g.lng, g.lat] }, properties: { speed: g.speed[i], dir: g.dir[i] } }];
      }),
    });
  }, [map, windGrid, time]);

  // Scent cones at the slider time: every stand when the overlay is on, otherwise just the selected one.
  const scentOn = prefs.overlays.scent?.on;
  const selectedId = panel && typeof panel === 'object' && 'feature' in panel ? panel.feature : null;
  useEffect(() => {
    if (!map) return;
    const stands = features.filter((f) => isStand(f) && (scentOn || f.id === selectedId)).slice(0, 80);
    let live = true;
    Promise.all(stands.map(async (s) => plumeFeatures(s, await analyzeStand(s, time)).map((f) => f)))
      .then((fs) => live && setGeoJSON(map, 'scent', { type: 'FeatureCollection', features: fs.flat() }))
      .catch((e) => console.warn('scent', e));
    if (!stands.length) setGeoJSON(map, 'scent', { type: 'FeatureCollection', features: [] });
    return () => void (live = false);
  }, [map, features, time, scentOn, selectedId]);

  // Marching dots on the strong deer-travel lanes. Lines are stored bed -> food (the evening direction); before noon on
  // the map clock deer head back to bed, so the dots run the other way.
  const trailsOn = prefs.overlays.ai_trails?.on;
  useEffect(() => {
    if (!map || !trailsOn) return;
    const seq: number[][] = [
      [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
      [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
    ];
    const morning = new Date(time).getHours() < 12;
    let i = 0;
    const id = window.setInterval(() => {
      if (map.getZoom() < 14 || !map.getLayer('ai-trails')) return;
      i = (i + 1) % seq.length;
      map.setPaintProperty('ai-trails', 'line-dasharray', seq[morning ? seq.length - 1 - i : i]);
    }, 90);
    return () => window.clearInterval(id);
  }, [map, trailsOn, new Date(time).getHours() < 12]);

  // Thermal-flow arrows on a grid over the view (zoomed in only; each point samples the DEM).
  const thermalsOn = prefs.overlays.thermals?.on;
  useEffect(() => {
    if (!map) return;
    if (!thermalsOn || map.getZoom() < 13) return setGeoJSON(map, 'thermals', { type: 'FeatureCollection', features: [] });
    let live = true;
    const b = map.getBounds();
    const [lng0, lat0] = prefs.view.center;
    const pts: [number, number][] = [];
    // Dense, lightly staggered sample; only points on real slopes or drainages survive (below), so arrows follow the land.
    // Jittered (fixed per cell, so arrows don't jump as you pan) to avoid rigid rows.
    const jitter = (i: number, j: number, k: number) => ((Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 18; i++)
      for (let j = 0; j < 12; j++)
        pts.push([b.getWest() + ((i + jitter(i, j, 1)) / 18) * (b.getEast() - b.getWest()), b.getSouth() + ((j + jitter(i, j, 2)) / 12) * (b.getNorth() - b.getSouth())]);
    getConditions(lat0, lng0).then(async (c) => {
      const h = hourAt(c, time);
      const feats = await Promise.all(pts.map(async ([lng, lat]) => {
        const ter = await terrainCached(lng, lat);
        // Thermals mean nothing over water or dead-flat fields. Keep slopes (3 deg+), cold-air pools, bottoms and shallow
        // draws (below the ground 150 m around): that's where cold air drains in the evening, even on gentle ground.
        const px = await samplePixel('plan', lng, lat);
        if ((px && px[0] === 6) || (ter.slope < 3 && ter.landform !== 'cold pool' && ter.landform !== 'bottom' && ter.tpi150 > -2)) return null;
        const th = thermal(ter, new Date(time), lat, lng, h.cloud, h.wind * 0.87 * 0.3);
        // Weak or flipping air still gets a mark (calm / swirling) instead of vanishing, so blank never means "no data".
        const calm = th.speed <= 0.15 || Math.abs(th.sign) < 0.5;
        return { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [lng, lat] }, properties: { speed: th.speed, dir: th.towardAz, up: th.sign > 0, calm } };
      }));
      if (live) setGeoJSON(map, 'thermals', { type: 'FeatureCollection', features: feats.filter((f) => f !== null) as any });
    }).catch((e) => console.warn('thermals', e));
    return () => void (live = false);
  }, [map, thermalsOn, prefs.view, time]);

  useEffect(() => {
    if (!map) return;
    setGeoJSON(map, 'plan', { type: 'FeatureCollection', features: plan ? planFeatures(plan) : [] });
    if (plan?.stands.length) {
      const pts = plan.stands.flatMap((s) => [s.lngLat, ...(s.entry?.coords ?? []), ...(s.exit?.coords ?? [])]);
      const b = pts.reduce((bb, p) => bb.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]));
      map.fitBounds(b, { padding: fitPadding(), maxZoom: 16 });
    }
  }, [map, plan]);

  // Journal entries and the brain's accepted proven spots.
  useEffect(() => {
    if (!map) return;
    const ring = (lng: number, lat: number, m: number) => Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * 2 * Math.PI;
      return [lng + (m * Math.sin(a)) / (111_320 * Math.cos((lat * Math.PI) / 180)), lat + (m * Math.cos(a)) / 111_320];
    });
    setGeoJSON(map, 'journal', {
      type: 'FeatureCollection',
      features: [
        ...observations.map((o) => ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [o.lng, o.lat] },
          properties: { role: 'obs', kind: o.kind, mature: !!o.buck?.mature, label: new Date(o.observed_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' }) } })),
        ...insights.filter((i) => i.kind === 'spot' && i.status === 'accepted' && i.lng != null).map((i) => ({
          type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [ring(i.lng!, i.lat!, (i.data?.radius_yd ?? 100) * 0.9144)] }, properties: { role: 'spot', title: i.title } })),
      ],
    });
  }, [map, observations, insights]);

  // AI buck bedding depends on the wind: follow the forecast wind at the crosshair for the slider time.
  useEffect(() => {
    const [lng, lat] = prefs.view.center;
    let live = true;
    getConditions(lat, lng).then((c) => live && setWindFrom(hourAt(c, time).windDir), () => {});
    return () => void (live = false);
  }, [prefs.view.center[0].toFixed(1), prefs.view.center[1].toFixed(1), time]);
  const bin = windFrom == null ? 7 : windBin(windFrom);
  useEffect(() => {
    (map?.getSource('ai-bed-buck') as maplibregl.RasterTileSource | undefined)?.setTiles(aiTiles(`bed_buck_${bin}`));
  }, [map, bin]);

  // Crop fields are shaded by how much deer want each crop in the current season phase.
  const phaseId = phaseOn(new Date(time)).id;
  useEffect(() => {
    if (!map) return;
    const k = prefs.overlays.ai_food?.opacity ?? 0.6;
    map.setPaintProperty('ai-food-fill', 'fill-opacity',
      ['match', ['get', 'crop'], ...Object.keys(CROP).flatMap((c) => [c, k * foodAttraction(c, new Date(time))]), 0.2] as any);
  }, [map, phaseId, new Date(time).toDateString(), prefs.overlays.ai_food?.opacity]);

  // Optionally light the hillshade from the real sun position at the slider time.
  useEffect(() => {
    if (!map) return;
    if (!sunShadows) {
      for (const prop of ['hillshade-illumination-direction', 'hillshade-illumination-altitude', 'hillshade-illumination-anchor'] as const)
        map.setPaintProperty('hillshade', prop, undefined);
      map.setPaintProperty('hillshade', 'hillshade-method', 'multidirectional');
      return;
    }
    const [lng, lat] = prefs.view.center;
    const sun = sunPosition(new Date(time), lat, lng);
    map.setPaintProperty('hillshade', 'hillshade-method', 'standard');
    map.setPaintProperty('hillshade', 'hillshade-illumination-anchor', 'map');
    map.setPaintProperty('hillshade', 'hillshade-illumination-direction', sun.azimuth);
    map.setPaintProperty('hillshade', 'hillshade-illumination-altitude', Math.max(2, sun.altitude));
  }, [map, sunShadows, time, prefs.view.center]);

  const selected = panel && typeof panel === 'object' && 'feature' in panel ? features.find((f) => f.id === panel.feature) ?? null : null;
  const land = panel && typeof panel === 'object' && 'land' in panel ? panel : null;

  // Highlight the selected feature or tapped parcel.
  useEffect(() => {
    if (!map) return;
    const geom = selected?.geometry ?? land?.info?.parcel?.geometry;
    setGeoJSON(map, 'highlight', { type: 'FeatureCollection', features: geom ? [{ type: 'Feature', geometry: geom, properties: {} }] : [] });
  }, [map, selected, land]);

  useEffect(() => {
    if (!map) return;
    setGeoJSON(map, 'group', {
      type: 'FeatureCollection',
      features: (group?.parcels ?? []).map((p) => ({ type: 'Feature', geometry: p.geometry, properties: { on: p.on } })),
    });
  }, [map, group]);

  // Selected pins get a drag handle to move them.
  useEffect(() => {
    if (!map || selected?.geometry.type !== 'Point') return;
    const el = document.createElement('div');
    el.className = 'drag-handle';
    el.title = 'Drag to move';
    const marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat(selected.geometry.coordinates as [number, number])
      .addTo(map);
    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      saveFeature(selected.id as string, { geometry: { type: 'Point', coordinates: [lng, lat] } });
    });
    return () => void marker.remove();
  }, [map, selected?.id, selected?.geometry]);

  // Draft (drawing / measuring / live track) preview.
  const drawCoords = track?.coords ?? draft;
  useEffect(() => {
    if (!map) return;
    const line = mode === 'area' && draft.length > 2 ? [...draft, draft[0]] : drawCoords;
    setGeoJSON(map, 'draft', {
      type: 'FeatureCollection',
      features: [
        ...(line.length > 1 ? [{ type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: line }, properties: {} }] : []),
        ...(track ? [] : draft.map((p) => ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: p }, properties: {} }))),
      ],
    });
  }, [map, drawCoords, mode, draft, track]);

  async function createFeature(geometry: Geometry, properties: Parameters<typeof api.createFeature>[1]) {
    const f = await api.createFeature(geometry, properties);
    setFeatures((fs) => [...fs, f]);
    setPanel({ feature: f.id as string });
  }

  async function saveFeature(id: string, patch: Parameters<typeof api.updateFeature>[1]) {
    const f = await api.updateFeature(id, patch);
    setFeatures((fs) => fs.map((x) => (x.id === id ? f : x)));
  }

  async function removeFeature(id: string) {
    await api.deleteFeature(id);
    setFeatures((fs) => fs.filter((x) => x.id !== id));
    setPanel(null);
  }

  async function openLand(p: [number, number]) {
    setPanel({ land: p, info: null });
    try {
      const info = await api.at(p[0], p[1]);
      setPanel((cur) => (cur && typeof cur === 'object' && 'land' in cur && cur.land === p ? { land: p, info } : cur));
    } catch (e) {
      setPanel({ land: p, info: null, error: (e as Error).message });
    }
  }

  function showGroup(g: Group) {
    setGroup(g);
    setGroupArea(null);
    setPanel('groups');
    const pts = g.parcels.flatMap((p) => p.geometry.coordinates.flat(2)) as [number, number][];
    if (map && pts.length) map.fitBounds(pts.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0])), { padding: fitPadding(), maxZoom: 16 });
  }

  async function addToGroup(g: Group, p: [number, number]) {
    const hit = await parcelAt(p[0], p[1]);
    if (!hit) return;
    const has = g.parcels.some((x) => x.id === hit.id);
    setGroup({ ...g, parcels: has ? g.parcels.map((x) => (x.id === hit.id ? { ...x, on: true } : x)) : [...g.parcels, hit] });
    setPanel('groups');
  }

  function startDraw(m: Mode) {
    setDraft([]);
    setMode(mode === m ? 'none' : m);
  }

  async function finishDraw() {
    const pts = draft.filter((p, i) => i === 0 || distanceM(draft[i - 1], p) > 0.5);
    if (mode === 'line' && pts.length >= 2) await createFeature({ type: 'LineString', coordinates: pts }, { kind: 'line', color: '#ffd43b' });
    if (mode === 'area' && pts.length >= 3) await createFeature({ type: 'Polygon', coordinates: [[...pts, pts[0]]] }, { kind: 'area', color: '#ffd43b' });
    setDraft([]);
    setMode('none');
  }

  function toggleTrack() {
    if (track) {
      navigator.geolocation.clearWatch(track.watch);
      if (track.coords.length >= 2)
        createFeature({ type: 'LineString', coordinates: track.coords }, { kind: 'track', name: `Track ${new Date().toLocaleString()}` });
      setTrack(null);
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > 50) return;
        setTrack((t) => t && { ...t, coords: [...t.coords, [pos.coords.longitude, pos.coords.latitude]] });
      },
      (err) => alert(`GPS error: ${err.message}`),
      { enableHighAccuracy: true },
    );
    setTrack({ watch, coords: [] });
  }

  const drawStatus =
    mode === 'pin' ? 'Tap the map to drop a pin'
    : mode === 'area' ? (draft.length > 2 ? `${fmtAcres(areaM2(draft))} · ${fmtDistance(lengthM([...draft, draft[0]]))} around` : 'Tap to add corners')
    : mode !== 'none' ? (draft.length > 1 ? fmtDistance(lengthM(draft)) : 'Tap to add points')
    : null;

  const flyTo = (f: UserFeature) => {
    const coords: Position[] = f.geometry.type === 'Point' ? [f.geometry.coordinates]
      : f.geometry.type === 'LineString' ? f.geometry.coordinates
      : f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : [];
    if (!map || !coords.length) return;
    const bounds = coords.reduce((b, p) => b.extend(p as [number, number]), new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]));
    map.fitBounds(bounds, { padding: 120, maxZoom: 17 });
    setPanel({ feature: f.id as string });
  };

  const tool = (m: Mode, label: string, icon: string) => (
    <button className={mode === m ? 'active' : ''} onClick={() => startDraw(m)} title={label}>
      <span>{icon}</span>{label}
    </button>
  );

  return (
    <div className="app">
      <div ref={container} className="map" />
      {map && <ViewControl map={map} />}
      <div className="crosshair" />
      <div ref={readout} className="readout" />

      <header className="topbar">
        <strong>hunt-app</strong>
        <span className="muted">{email}</span>
        <button className="link" onClick={onLogout}>Sign out</button>
      </header>

      <nav className="toolbar">
        <button className={panel === 'layers' ? 'active' : ''} onClick={() => setPanel(panel === 'layers' ? null : 'layers')}><span>🗺️</span>Layers</button>
        <button className={panel === 'list' ? 'active' : ''} onClick={() => setPanel(panel === 'list' ? null : 'list')}><span>📋</span>My map</button>
        <button className={panel === 'intel' ? 'active' : ''} onClick={() => setPanel(panel === 'intel' ? null : 'intel')}><span>🌤️</span>Intel</button>
        <button className={panel === 'plan' ? 'active' : ''} onClick={() => setPanel(panel === 'plan' ? null : 'plan')}><span>🎯</span>Plan</button>
        <button className={panel === 'groups' ? 'active' : ''} onClick={() => setPanel(panel === 'groups' ? null : 'groups')}><span>🧩</span>Groups</button>
        <button className={panel === 'journal' ? 'active' : ''} onClick={() => setPanel(panel === 'journal' ? null : 'journal')}><span>📓</span>Journal</button>
        <button className={panel === 'fieldnotes' ? 'active' : ''} onClick={() => setPanel(panel === 'fieldnotes' ? null : 'fieldnotes')}><span>📝</span>Field Notes</button>
        <button className={panel === 'cameras' ? 'active' : ''} onClick={() => setPanel(panel === 'cameras' ? null : 'cameras')}><span>📷</span>Cameras</button>
        <button className={panel === 'settings' ? 'active' : ''} onClick={() => setPanel(panel === 'settings' ? null : 'settings')}><span>⚙️</span>Settings</button>
        {tool('pin', 'Pin', '📍')}
        {tool('line', 'Line', '〰️')}
        {tool('area', 'Area', '⬠')}
        {tool('measure', 'Measure', '📏')}
        <button className={track ? 'recording' : ''} onClick={toggleTrack}><span>{track ? '⏹️' : '⏺️'}</span>{track ? 'Stop' : 'Track'}</button>
        <button
          className={prefs.terrain.on ? 'active' : ''}
          onClick={() => {
            const on = !prefs.terrain.on;
            setPrefs((p) => ({ ...p, terrain: { ...p.terrain, on } }));
            if (on && map && map.getPitch() < 30) map.easeTo({ pitch: 60, duration: 800 });
          }}
        ><span>⛰️</span>3D</button>
      </nav>

      {time !== nowHour() && panel !== 'intel' && (
        <button className="timechip" onClick={() => setTime(nowHour())} title="Back to now">
          🕒 {new Date(time).toLocaleString([], { weekday: 'short', hour: 'numeric' })} ✕
        </button>
      )}

      {(drawStatus || track) && (
        <div className="drawbar">
          <span>{track ? `Recording · ${fmtDistance(lengthM(track.coords))} · ${track.coords.length} pts` : drawStatus}</span>
          {mode !== 'none' && mode !== 'pin' && (
            <>
              <button onClick={() => setDraft((d) => d.slice(0, -1))} disabled={!draft.length}>Undo</button>
              {mode !== 'measure' && <button id="finish-draw" className="primary" onClick={finishDraw}>Finish</button>}
            </>
          )}
          {mode !== 'none' && <button onClick={() => { setDraft([]); setMode('none'); }}>{mode === 'measure' ? 'Done' : 'Cancel'}</button>}
        </div>
      )}

      {panel && (
        <aside className="panel">
          <button className="close" onClick={() => setPanel(null)} aria-label="Close">✕</button>
          {panel === 'plan' && map && (
            <PlanPanel
              // A planned group rides in as the first drawn area, so the planner picks it by default.
              features={groupArea ? [{ type: 'Feature', id: 'group', geometry: groupArea.area, properties: { id: 'group', kind: 'area', name: `Group: ${groupArea.name}`, props: {} } } as unknown as UserFeature, ...features] : features}
              observations={observations}
              insights={insights}
              viewBounds={(() => { const b = map.getBounds(); return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]; })()}
              viewZoom={prefs.view.zoom}
              center={prefs.view.center}
              plan={plan}
              setPlan={setPlan}
              onSaved={(fs) => setFeatures((cur) => [...cur, ...fs])}
              onFocus={(p) => map.flyTo({ center: p, zoom: 16.5 })}
            />
          )}
          {panel === 'groups' && (
            <GroupPanel
              group={group}
              setGroup={(g) => { setGroup(g); if (!g) setGroupArea(null); }}
              onShow={showGroup}
              onPlan={(area) => { setGroupArea({ name: group!.name, area }); setPanel('plan'); }}
            />
          )}
          {panel === 'journal' && map && (
            <JournalPanel
              center={prefs.view.center}
              observations={observations}
              setObservations={setObservations}
              insights={insights}
              setInsights={setInsights}
              onFocus={(p) => map.flyTo({ center: p, zoom: 16 })}
            />
          )}
          {panel === 'intel' && (
            <IntelPanel
              center={prefs.view.center}
              stands={features.filter(isStand)}
              onStand={(f) => flyTo(f)}
              time={time}
              setTime={setTime}
              sunShadows={sunShadows}
              setSunShadows={(on) => {
                setSunShadows(on);
                if (on) setPrefs((p) => ({ ...p, overlays: { ...p.overlays, hillshade: { ...p.overlays.hillshade, on: true } } }));
              }}
            />
          )}
          {panel === 'layers' && (
            <LayersPanel
              prefs={prefs}
              setPrefs={setPrefs}
              sourceDates={sourceDates}
              notes={{
                ai_bed_buck: `Showing wind from ${compass(bin * 45)} (forecast at the crosshair, ${new Date(time).toLocaleString([], { weekday: 'short', hour: 'numeric' })}).`,
                ai_food: `Shaded by deer draw in the current phase: ${phaseOn(new Date(time)).name}.`,
              }}
            />
          )}
          {panel === 'fieldnotes' && map && (
            <FieldNotesPanel center={prefs.view.center} features={features} onFocus={(p) => map.flyTo({ center: p, zoom: 16.5 })} />
          )}
          {panel === 'cameras' && (
            <CamerasPanel features={features} camera={camera} setCamera={setCamera} onFocus={flyTo} />
          )}
          {panel === 'settings' && (
            <SettingsPanel
              features={features}
              onSelect={flyTo}
              onKnowledge={(f, knowledge) => saveFeature(f.id as string, { properties: { props: { ...f.properties.props, knowledge } } })}
            />
          )}
          {panel === 'list' && (
            <FeatureList
              features={features}
              folders={folders}
              onSelect={flyTo}
              onImported={(fs) => setFeatures((cur) => [...cur, ...fs])}
            />
          )}
          {selected && (
            <FeatureEditor
              key={selected.id}
              feature={selected}
              time={time}
              folders={folders}
              onSave={(patch) => saveFeature(selected.id as string, patch)}
              onDelete={() => removeFeature(selected.id as string)}
              onClose={() => setPanel(null)}
              onPhotos={() => { setCamera(selected.id as string); setPanel('cameras'); }}
              onNewFolder={async (name) => {
                const f = await api.createFolder(name);
                setFolders((fs) => [...fs, f]);
                return f.id;
              }}
            />
          )}
          {land && (
            <LandCard
              windBin={bin}
              time={time}
              at={land.land}
              info={land.info}
              error={land.error}
              onDropPin={() => createFeature({ type: 'Point', coordinates: land.land }, { kind: 'pin', icon: 'pin' })}
              onGroup={(owner, county) => findGroup(owner, county).then(showGroup, (e) => alert(e.message))}
              onAddToGroup={group ? () => addToGroup(group, land.land).catch((e) => alert(e.message)) : undefined}
            />
          )}
        </aside>
      )}
    </div>
  );
}
