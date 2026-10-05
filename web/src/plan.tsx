import { useState } from 'react';
import type { Polygon } from 'geojson';
import { api, type UserFeature } from './api';
import { compass } from './conditions';
import { periodAt } from './intel';
import { planHunt, fmtTime, type Plan, type PlanStand } from './planner';
import type { Period } from './rating';
import type { Insight, Observation } from './journal';

const DAY = 86_400_000;
const pct = (e: number) => `${e > 0 ? '+' : ''}${Math.round(e * 100)}%`;

function bboxOf(ring: number[][]) {
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

export function PlanPanel({ features, observations, insights, viewBounds, viewZoom, center, plan, setPlan, onSaved, onFocus }: {
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
}) {
  const areas = features.filter((f) => f.properties.kind === 'area');
  const [areaId, setAreaId] = useState<string>(areas[0]?.id as string ?? 'view');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const [dayOffset, setDayOffset] = useState(0);
  const [period, setPeriod] = useState<Period>(() => {
    const p = periodAt(Date.now(), center[1], center[0]);
    return p === 'midday' ? 'pm' : p;
  });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function run() {
    setError('');
    setPlan(null);
    const area = areas.find((a) => a.id === areaId);
    if (!area && viewZoom < 13.5) return setError('Zoom in to a property (zoom 14+) or pick one of your drawn areas.');
    try {
      const geom = area?.geometry as Polygon | undefined;
      const result = await planHunt({
        area: geom ?? null,
        bbox: geom ? bboxOf(geom.coordinates[0]) : viewBounds,
        day: new Date(today.getTime() + dayOffset * DAY),
        period,
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
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          {areas.map((a) => <option key={a.id} value={a.id as string}>{a.properties.name || 'Unnamed area'}</option>)}
          <option value="view">Current map view</option>
        </select>
      </label>
      {!areas.length && <p className="muted small">Tip: draw your hunting ground with the Area tool so the plan stays on land you can hunt (routes avoid crossing neighbors).</p>}
      <div className="row">
        <label className="grow">Day
          <select value={dayOffset} onChange={(e) => setDayOffset(Number(e.target.value))}>
            {Array.from({ length: 7 }, (_, i) => (
              <option key={i} value={i}>{new Date(today.getTime() + i * DAY).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</option>
            ))}
          </select>
        </label>
        <label className="grow">Sit
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
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
