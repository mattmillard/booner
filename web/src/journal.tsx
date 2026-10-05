import { useEffect, useState } from 'react';
import { api } from './api';
import { compass } from './conditions';
import { angleDiff, thermal } from './scent';
import { terrainAt } from './terrain';
import { sampleLandform, sampleValue, windBin } from './terrainai';

export type Observation = {
  id: string; kind: string; observed_at: string; lng: number; lat: number; buck: { mature?: boolean; age?: string; points?: number };
  deer_count: number | null; behavior: string | null; travel_dir: string | null; notes: string; conditions: any;
};
export type Insight = {
  id: string; kind: 'pattern' | 'rule' | 'spot' | 'question'; title: string; body: string; confidence: number;
  status: string; data: any; lng: number | null; lat: number | null; evidence: string[];
};

const KINDS = [['sighting', '🦌 Sighting'], ['kill', '🏆 Kill'], ['sit', '🌳 Sit (saw nothing counts too)'], ['sign', '🪵 Sign'], ['story', '📖 Story']];
const BEHAVIOR = ['cruising', 'chasing', 'tending a doe', 'walking to food', 'walking to bed', 'feeding', 'bedded', 'scent-checking', 'rubbing / scraping', 'other'];
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const pad = (n: number) => String(n).padStart(2, '0');
const localInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

async function call(method: string, path: string, body?: unknown) {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error ?? r.statusText);
  return data;
}

// Terrain, thermal state and model values at the spot and moment — computed in the browser from the map's own data.
async function siteFacts(o: Observation) {
  const w = o.conditions.weather;
  const t = new Date(o.observed_at);
  const ter = await terrainAt(o.lng, o.lat);
  const th = thermal(ter, t, o.lat, o.lng, w?.cloudPct ?? 50, (w?.windMph ?? 5) * 0.87 * 0.3);
  const bin = windBin(w?.windDeg ?? 0);
  const [buckBed, doeBed, corridor, landformLayer, info] = await Promise.all([
    sampleValue(`bed_buck_${bin}`, o.lng, o.lat), sampleValue('bed_doe', o.lng, o.lat), sampleValue('corridor', o.lng, o.lat),
    sampleLandform(o.lng, o.lat), api.at(o.lng, o.lat).catch(() => null),
  ]);
  const travel = o.travel_dir ? DIRS.indexOf(o.travel_dir) * 45 : null;
  const vsWind = travel == null || w?.windDeg == null ? null : (() => {
    const d = angleDiff(travel, w.windDeg); // travelling toward where the wind comes from = into the wind
    return d <= 45 ? 'into the wind' : d >= 135 ? 'with the wind at his back' : 'crosswind';
  })();
  return {
    landform: ter.landform, slopeDeg: Math.round(ter.slope), facing: compass(ter.aspect), elevFt: Math.round(ter.elev * 3.28084),
    tpi400m: Math.round(ter.tpi400),
    thermal: { state: th.sign > 0.5 ? 'rising (uphill)' : th.sign < -0.5 ? 'falling / draining downhill' : 'transition (swirling)', note: th.label, towardDir: compass(th.towardAz), mph: +th.speed.toFixed(1) },
    deerTravelVsWind: vsWind,
    model: { buckBedding: +buckBed.toFixed(2), doeBedding: +doeBed.toFixed(2), corridor: +corridor.toFixed(2), landformLayer },
    nearbyTerrain: info?.terrain.slice(0, 4).map((x) => `${x.kind} ${Math.round(x.dist_m / 0.9144)} yd`) ?? [],
    field: info?.food ? `${info.food.crop} (${Math.round(info.food.acres)} ac)` : null,
    publicLand: info?.publicLands[0]?.name ?? null,
  };
}

function summary(o: Observation) {
  const w = o.conditions.weather, a = o.conditions.astro, s = o.conditions.site;
  if (!w) return o.conditions.error ? `Weather lookup failed: ${o.conditions.error}` : 'Looking up conditions…';
  const sun = a?.minFromSunrise != null && Math.abs(a.minFromSunrise) < 240 ? `${a.minFromSunrise >= 0 ? a.minFromSunrise + ' min after' : -a.minFromSunrise + ' min before'} sunrise`
    : a?.minToSunset != null ? `${a.minToSunset >= 0 ? a.minToSunset + ' min before' : -a.minToSunset + ' min after'} sunset` : '';
  return [
    sun, `${o.conditions.rutPhase}`,
    `${w.tempF}°F (${w.tempChange24hF > 0 ? '+' : ''}${w.tempChange24hF}° vs yesterday${w.departureF != null ? `, high ${w.departureF > 0 ? '+' : ''}${w.departureF}° vs normal` : ''})`,
    `wind ${w.windFrom} ${w.windMph} mph`, `pressure ${w.pressureTrend3hMb > 0.5 ? 'rising' : w.pressureTrend3hMb < -0.5 ? 'falling' : 'steady'}`,
    w.front, w.rainingNow ? 'raining' : w.hoursSinceRain != null && w.hoursSinceRain < 12 ? `${w.hoursSinceRain} h after rain` : null,
    `${a.moonPhase} moon${a.solunarMajor ? ' (solunar major)' : ''}`,
    s && `thermal ${s.thermal.state}`, s && s.landform, s?.deerTravelVsWind && `buck moving ${s.deerTravelVsWind}`,
  ].filter(Boolean).join(' · ');
}

export function JournalPanel({ center, observations, setObservations, insights, setInsights, onFocus }: {
  center: [number, number];
  observations: Observation[];
  setObservations: (f: (o: Observation[]) => Observation[]) => void;
  insights: Insight[];
  setInsights: (i: Insight[]) => void;
  onFocus: (lngLat: [number, number]) => void;
}) {
  const [form, setForm] = useState({ kind: 'sighting', when: localInput(new Date()), mature: true, age: '', points: '', count: '1', behavior: 'cruising', dir: '', notes: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [brainOn, setBrainOn] = useState<boolean | null>(null);
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState<{ summary: string } | null>(null);
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  useEffect(() => { call('GET', '/api/brain/status').then((s) => setBrainOn(s.enabled), () => setBrainOn(false)); }, []);

  async function save() {
    setError('');
    setBusy('Saving and pulling the weather for that moment…');
    try {
      const deerless = form.kind === 'sit' || form.kind === 'sign';
      const o: Observation = await call('POST', '/api/journal', {
        kind: form.kind, observed_at: new Date(form.when).toISOString(), lng: center[0], lat: center[1],
        buck: deerless ? {} : { mature: form.mature, age: form.age || undefined, points: form.points ? Number(form.points) : undefined },
        deer_count: deerless ? null : Number(form.count) || null, behavior: deerless ? null : form.behavior, travel_dir: form.dir || null, notes: form.notes,
      });
      setBusy('Reading terrain and thermals at the spot…');
      const site = await siteFacts(o).catch(() => null);
      if (site) {
        await call('PATCH', `/api/journal/${o.id}/site`, site);
        o.conditions = { ...o.conditions, site };
      }
      setObservations((cur) => [o, ...cur]);
      set({ notes: '', points: '', age: '' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this journal entry?')) return;
    await call('DELETE', `/api/journal/${id}`);
    setObservations((cur) => cur.filter((o) => o.id !== id));
  }

  async function analyze() {
    setError('');
    setBusy('Claude is studying your journal… (can take a minute)');
    try {
      const r = await call('POST', '/api/brain/analyze', { question: question || undefined });
      setAnalysis(r);
      setInsights(await call('GET', '/api/brain/insights'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function mark(i: Insight, status: 'accepted' | 'rejected') {
    await call('PATCH', `/api/brain/insights/${i.id}`, { status });
    setInsights(status === 'rejected' ? insights.filter((x) => x.id !== i.id) : insights.map((x) => (x.id === i.id ? { ...x, status } : x)));
  }

  const deerless = form.kind === 'sit' || form.kind === 'sign';
  return (
    <div className="journal">
      <h2>Hunt journal</h2>
      <p className="muted small">Put the crosshair on the spot, then log it. The app looks up the weather, front, temperature swing, moon, sun timing, thermals and terrain for that exact moment.</p>
      <div className="row">
        <label className="grow">What
          <select value={form.kind} onChange={(e) => set({ kind: e.target.value })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="grow">When
          <input type="datetime-local" value={form.when} max={localInput(new Date())} onChange={(e) => set({ when: e.target.value })} />
        </label>
      </div>
      {!deerless && (
        <div className="row wrap">
          <label className="row"><input type="checkbox" checked={form.mature} onChange={(e) => set({ mature: e.target.checked })} /> Mature buck</label>
          <label className="grow">Age
            <select value={form.age} onChange={(e) => set({ age: e.target.value })}>
              <option value="">?</option>{['1.5', '2.5', '3.5', '4.5', '5.5+'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label className="grow">Points<input type="number" min={0} max={40} value={form.points} onChange={(e) => set({ points: e.target.value })} /></label>
          <label className="grow">Deer<input type="number" min={1} max={50} value={form.count} onChange={(e) => set({ count: e.target.value })} /></label>
        </div>
      )}
      <div className="row">
        {!deerless && (
          <label className="grow">Doing
            <select value={form.behavior} onChange={(e) => set({ behavior: e.target.value })}>{BEHAVIOR.map((b) => <option key={b}>{b}</option>)}</select>
          </label>
        )}
        <label className="grow">Heading
          <select value={form.dir} onChange={(e) => set({ dir: e.target.value })}><option value="">?</option>{DIRS.map((d) => <option key={d}>{d}</option>)}</select>
        </label>
      </div>
      <label>Story / notes
        <textarea rows={4} value={form.notes} placeholder="Where he came from, what the wind and thermals were doing, where you sat, why you think he moved…" onChange={(e) => set({ notes: e.target.value })} />
      </label>
      <p className="muted small">Spot: {center[1].toFixed(5)}, {center[0].toFixed(5)} (map crosshair)</p>
      <button className="primary wide" onClick={save} disabled={!!busy}>{busy || 'Log it'}</button>
      {error && <p className="error">{error}</p>}

      <h2>Hunting brain</h2>
      {brainOn === false && <p className="muted small">The analyst can't find Claude Code on this PC. Install it, or set <code>CLAUDE_BIN</code> in <code>hunt-app/.env</code> and restart the API.</p>}
      <input placeholder="Ask about your data (optional): e.g. what brings the big 10 past the bench stand?" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button className="wide" onClick={analyze} disabled={!!busy || !brainOn}>🧠 Analyze my journal, field notes and cameras with Claude</button>
      {analysis && <div className="card"><p className="small pre">{analysis.summary}</p></div>}
      {insights.map((i) => (
        <div key={i.id} className={`card insight ${i.status}`}>
          <div className="row">
            <span className="badge kind">{i.kind}</span>
            <strong className="grow">{i.title}</strong>
            <span className="muted small">{Math.round(i.confidence * 100)}%</span>
          </div>
          <p className="small pre">{i.body}</p>
          <div className="actions">
            {i.lng != null && <button onClick={() => onFocus([i.lng!, i.lat!])}>Show</button>}
            {i.status !== 'accepted' && i.kind !== 'question' && <button onClick={() => mark(i, 'accepted')}>Accept</button>}
            <button className="danger" onClick={() => mark(i, 'rejected')}>{i.kind === 'question' ? 'Dismiss' : 'Reject'}</button>
          </div>
        </div>
      ))}

      <h2>Entries ({observations.length})</h2>
      {observations.map((o) => (
        <div key={o.id} className="card entry">
          <div className="row">
            <strong className="grow">{KINDS.find(([k]) => k === o.kind)?.[1]}{o.buck?.mature ? ' · mature buck' : ''}{o.buck?.points ? ` · ${o.buck.points} pts` : ''}</strong>
            <button onClick={() => onFocus([o.lng, o.lat])}>Show</button>
          </div>
          <p className="muted small">{new Date(o.observed_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}{o.behavior ? ` · ${o.behavior}` : ''}{o.travel_dir ? ` → ${o.travel_dir}` : ''}</p>
          <p className="small">{summary(o)}</p>
          {o.notes && <p className="small pre">{o.notes}</p>}
          <button className="link danger" onClick={() => remove(o.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
