import { useEffect, useState } from 'react';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import { api, type CrosshairPlanArea, type UserFeature } from './api';
import { compass } from './conditions';
import { planHunt, fmtTime, type Plan, type PlanStand } from './planner';
import type { Period } from './rating';
import type { Insight, Observation } from './journal';

const DAY = 86_400_000;
const pct = (e: number) => `${e > 0 ? '+' : ''}${Math.round(e * 100)}%`;

function nextTimeframe(now: Date): { dayOffset: number; period: Period } {
  if (now.getHours() < 8) return { dayOffset: 0, period: 'am' };
  if (now.getHours() < 17) return { dayOffset: 0, period: 'pm' };
  return { dayOffset: 1, period: 'am' };
}

type PropertyArea = Polygon | MultiPolygon;

function bboxOf(area: PropertyArea) {
  const polygons = area.type === 'Polygon' ? [area.coordinates] : area.coordinates;
  const points = polygons.flat(2) as Position[];
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

export function PlanPanel({ features, observations, insights, viewBounds, viewZoom, center, plan, setPlan, onSaved, onFocus, currentParcel = null, currentGroup = null, preferredProperty }: {
  features: UserFeature[];
  observations: Observation[];
  insights: Insight[];
  viewBounds: number[];
  viewZoom: number;
  center: [number, number];
  plan: Plan | null;
  setPlan: (p: Plan | null) => void;
  onSaved: (fs: UserFeature[]) => void;
  onFocus: (lngLat: [number, number]) => void;
  currentParcel?: { name: string; geometry: PropertyArea } | null;
  currentGroup?: { name: string; geometry: PropertyArea } | null;
  preferredProperty?: 'currentGroup';
}) {
  const areas = features.filter((f) => f.properties.kind === 'area');
  const [areaId, setAreaId] = useState('');
  const [crosshairLookup, setCrosshairLookup] = useState<{ key: string; area: CrosshairPlanArea | null; loading: boolean }>({ key: '', area: null, loading: false });
  const crosshairKey = `${center[0]},${center[1]}`;
  const crosshairArea = crosshairLookup.key === crosshairKey ? crosshairLookup.area : null;
  const crosshairLoading = crosshairLookup.key !== crosshairKey || crosshairLookup.loading;
  const selectedProperty = areaId || preferredProperty || (crosshairArea || crosshairLoading ? 'crosshair' : areas[0]?.id as string ?? 'view');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const [timeframe, setTimeframe] = useState(() => nextTimeframe(new Date()));
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    api.planAreaAt(center[0], center[1]).then((area) => {
      if (live) setCrosshairLookup({ key: crosshairKey, area, loading: false });
    }).catch(() => {
      if (live) setCrosshairLookup({ key: crosshairKey, area: null, loading: false });
    });
    return () => { live = false; };
  }, [crosshairKey]);

  async function run() {
    setError('');
    setPlan(null);
    if (selectedProperty === 'crosshair' && crosshairLoading) return setError('Finding the property at the crosshair…');
    if (selectedProperty === 'crosshair' && !crosshairArea) return setError('No parcel at the crosshair. Choose another property or use the current map view.');
    const area = selectedProperty === 'crosshair' ? crosshairArea
      : selectedProperty === 'currentParcel' ? currentParcel
      : selectedProperty === 'currentGroup' ? currentGroup
      : areas.find((a) => a.id === selectedProperty);
    const geom = area?.geometry as PropertyArea | undefined;
    if (!geom && viewZoom < 13.5) return setError('Zoom in to a property (zoom 14+) or pick one of your drawn areas.');
    try {
      const result = await planHunt({
        area: geom ?? null,
        bbox: geom ? bboxOf(geom) : viewBounds,
        day: new Date(today.getTime() + timeframe.dayOffset * DAY),
        period: timeframe.period,
        pins: features,
        onProgress: setBusy,
        proven: {
          spots: insights.filter((i) => i.kind === 'spot' && i.status === 'accepted' && i.lng != null)
            .map((i) => ({ lng: i.lng!, lat: i.lat!, radiusM: (i.data?.radius_yd ?? 100) * 0.9144, title: i.title })),
          bucks: observations.filter((o) => o.kind === 'kill' || (o.kind === 'sighting' && o.buck?.mature)).map((o) => ({ lng: o.lng, lat: o.lat, kind: o.kind })),
        },
      });
      setPlan(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function saveStand(s: PlanStand) {
    const created = [await api.createFeature({ type: 'Point', coordinates: s.lngLat }, {
      kind: 'pin', icon: 'stand', name: `Planned stand #${s.rank}`,
      notes: `From the planner (${plan!.day.toLocaleDateString()} ${plan!.period.toUpperCase()}, wind ${compass(plan!.windFrom)}). ${s.source}.\n` + s.why.map((w) => `• ${w.text}`).join('\n'),
      props: { goodWinds: s.goodWinds, standType: 'Hang-on', heightFt: 20 },
    })];
    if (s.entry) created.push(await api.createFeature({ type: 'LineString', coordinates: s.entry.coords }, { kind: 'line', name: `Stand #${s.rank} walk-in`, color: '#69db7c' }));
    if (s.exit) created.push(await api.createFeature({ type: 'LineString', coordinates: s.exit.coords }, { kind: 'line', name: `Stand #${s.rank} exit`, color: '#4dabf7' }));
    onSaved(created);
  }

  return (
    <div className="plan">
      <h2>Plan my hunt</h2>
      <label>Property
        <select value={selectedProperty} onChange={(e) => setAreaId(e.target.value)}>
          {(crosshairArea || crosshairLoading) && (
            <option value="crosshair">{crosshairArea
              ? `Property at crosshair · ${crosshairArea.name}${crosshairArea.conservation_names.length ? ` + ${crosshairArea.conservation_names.length} connected conservation areas` : ''}`
              : 'Property at crosshair · Finding…'}</option>
          )}
          {currentParcel && <option value="currentParcel">Current focused parcel · {currentParcel.name}</option>}
          {currentGroup && <option value="currentGroup">Current focused group · {currentGroup.name}</option>}
          {areas.map((a) => <option key={a.id} value={a.id as string}>{a.properties.name || 'Unnamed area'}</option>)}
          <option value="view">Current map view</option>
        </select>
      </label>
      {!areas.length && !crosshairArea && !crosshairLoading && !currentParcel && !currentGroup && <p className="muted small">No parcel at the crosshair. Choose a focused parcel/group, drawn area, or current map view.</p>}
      <div className="row">
        <label className="grow">Day
          <select value={timeframe.dayOffset} onChange={(e) => setTimeframe((current) => ({ ...current, dayOffset: Number(e.target.value) }))}>
            {Array.from({ length: 7 }, (_, i) => (
              <option key={i} value={i}>{new Date(today.getTime() + i * DAY).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</option>
            ))}
          </select>
        </label>
        <label className="grow">Sit
          <select value={timeframe.period} onChange={(e) => setTimeframe((current) => ({ ...current, period: e.target.value as Period }))}>
            <option value="am">Morning</option>
            <option value="midday">Midday (rut)</option>
            <option value="pm">Evening</option>
          </select>
        </label>
      </div>
      <button className="primary wide" onClick={run} disabled={!!busy}>{busy || '🎯 Plan my hunt'}</button>
      {error && <p className="error">{error}</p>}

      {plan && (
        <>
          <div className="card">
            {plan.briefing.map((b, i) => <p key={i} className="small">{b}</p>)}
            <p className="muted small">Map: numbered stands, green = walk in, blue = walk out, orange cone = your scent during the sit, purple dots = likely buck beds the plan works around.</p>
          </div>
          {plan.stands.map((s) => (
            <div key={s.rank} className="card planstand">
              <div className="row">
                <span className="rank">{s.rank}</span>
                <div className="grow">
                  <strong>{s.source}</strong>
                  <div className="muted small">site {s.score} · hunt rating {s.rating?.score ?? '—'} · wind at stand {compass(s.windFrom)} {s.windSpeed.toFixed(1)} mph</div>
                </div>
                <button onClick={() => onFocus(s.lngLat)}>Show</button>
              </div>
              <ul className="reasons">
                {s.why.map((w) => <li key={w.text}><span>{w.text}</span><span className={w.effect >= 0 ? 'up' : 'down'}>{pct(w.effect)}</span></li>)}
              </ul>
              <h3>Timeline</h3>
              <ul className="timeline">
                {s.timeline.map((t) => <li key={t.at.getTime() + t.text}><b>{fmtTime(t.at)}</b> {t.text}</li>)}
              </ul>
              <p className="small">Good winds for this spot: <strong>{s.goodWinds.length === 8 ? 'any wind (nothing sensitive downwind)' : s.goodWinds.join(', ') || 'none clean'}</strong></p>
              <button onClick={() => saveStand(s)}>{s.yours ? 'Save routes' : 'Save stand + routes'}</button>
            </div>
          ))}
          <button className="link" onClick={() => setPlan(null)}>Clear plan</button>
        </>
      )}
    </div>
  );
}
