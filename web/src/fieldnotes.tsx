// Field notes: log each hunt in your own words. The app looks up the weather for the sit and spells out what changed
// (a 10° drop since yesterday, a front, a wind shift) so nobody has to enter weather by hand.
import { useEffect, useState } from 'react';
import type { Point } from 'geojson';
import type { UserFeature } from './api';

type Sighting = {
  time: string; count: string; what: string; mature: boolean; age: string; points: string; behavior: string;
  from: string; to: string; yards: string; outcome: string; note: string;
};
export type Hunt = {
  id: string; stand_id: string | null; stand_num: number | null; stand_name: string | null; lng: number; lat: number;
  started_at: string; ended_at: string | null; wind_note: string; pressure: { trucks?: string; hunters?: string; shots?: boolean };
  sightings: Sighting[]; activity: string | null; stand_verdict: 'right' | 'close' | 'wrong' | null;
  move: { toward?: string; yards?: string; why?: string }; notes: string; conditions: any;
};

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const WHAT = ['target buck', 'buck', 'doe', 'does + fawns', 'fawn', 'unknown'];
const BEHAVIOR = ['', 'cruising', 'chasing', 'tending a doe', 'walking to food', 'walking to bed', 'feeding', 'bedded', 'scent-checking', 'rubbing / scraping', 'winded me', 'other'];
const OUTCOME = [['', '—'], ['passed', 'Passed'], ['no shot', 'No shot offered'], ['shot', 'Shot (no recovery)'], ['killed', 'Killed']];
const ACTIVITY = [['', '?'], ['none', 'Dead (nothing moving)'], ['slow', 'Slow'], ['steady', 'Steady'], ['hot', 'Hot']];
const VERDICT = [['right', '✅ Right spot'], ['close', '↔️ Close, needs a move'], ['wrong', '❌ Wrong spot']] as const;
const WORDS: Record<string, string> = { N: 'north', E: 'east', S: 'south', W: 'west' };
const say = (c: string) => c.split('').map((x) => WORDS[x]).join('').replace(/^(north|south)(north|south)/, '$1-$2')
  .replace(/^(north|south|east|west)(north|south)(east|west)$/, '$1-$2$3');

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const clock = (t: string) => new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const newSighting = (): Sighting => ({ time: hm(new Date()), count: '1', what: 'doe', mature: false, age: '', points: '', behavior: '', from: '', to: '', yards: '', outcome: '', note: '' });
const blank = () => ({
  id: null as string | null, stand: '', spot: null as [number, number] | null, date: ymd(new Date()), start: '', end: '',
  windNote: '', pressure: { trucks: '', hunters: '', shots: false }, sightings: [] as Sighting[], activity: '',
  verdict: '' as '' | 'right' | 'close' | 'wrong', move: { toward: '', yards: '', why: '' }, notes: '',
});

async function call(method: string, path: string, body?: unknown) {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error ?? r.statusText);
  return data;
}

// What the weather was doing, in plain words, worked out from the numbers the server looked up.
function weatherStory(h: Hunt): string[] {
  const w = h.conditions.weather, a = h.conditions.astro;
  if (!w) return [h.conditions.error ? `Couldn't look up the weather: ${h.conditions.error}` : 'Looking up the weather…'];
  const out: string[] = [];
  const d = w.tempChange24hF;
  out.push(`${w.tempF}°F when you got in, ${Math.abs(d) < 4 ? 'about the same as this time yesterday' : `${Math.abs(d)}° ${d < 0 ? 'cooler' : 'warmer'} than this time yesterday`}.`);
  if (w.departureF != null && Math.abs(w.departureF) >= 5) out.push(`The day ran ${Math.abs(w.departureF)}° ${w.departureF < 0 ? 'below' : 'above'} normal for the date.`);
  if (w.front) out.push(`${w.front[0].toUpperCase()}${w.front.slice(1)}.`);
  const fw: { from: string; deg: number; mph: number }[] = h.conditions.forecastWind ?? [];
  const shift = fw.length > 1 && Math.abs(((fw[fw.length - 1].deg - fw[0].deg + 540) % 360) - 180) >= 45;
  out.push(w.windMph <= 2 ? 'Almost no wind.' : `Wind out of the ${say(w.windFrom)} around ${w.windMph} mph${shift ? `, swinging to the ${say(fw[fw.length - 1].from)} during the sit` : ''}.`);
  if (Math.abs(w.pressureTrend3hMb) >= 1) out.push(`Barometer ${w.pressureTrend3hMb > 0 ? 'rising' : 'falling'}.`);
  if (w.rainingNow) out.push('Raining.');
  else if (w.hoursSinceRain != null && w.hoursSinceRain <= 12) out.push(`It rained ${w.hoursSinceRain} hours before.`);
  if (a?.moonPhase) out.push(`${a.moonPhase[0].toUpperCase()}${a.moonPhase.slice(1)} moon · ${h.conditions.rutPhase}.`);
  return out;
}

function sightingLine(s: Sighting) {
  const deer = s.what === 'target buck' || s.what === 'buck'
    ? `${s.what === 'target buck' ? 'Target buck' : s.mature ? 'Mature buck' : 'Buck'}${s.points ? `, ${s.points} pts` : ''}${s.age ? `, ${s.age} yrs` : ''}`
    : `${Number(s.count) > 1 ? `${s.count} ` : ''}${s.what}`;
  const path = [s.from && `from the ${say(s.from)}`, s.to && `heading ${say(s.to)}`].filter(Boolean).join(', ');
  return [`${s.time ? clock(s.time) : '?'} · ${deer}`, s.behavior, path, s.yards && `${s.yards} yd`,
    OUTCOME.find(([k]) => k === s.outcome && k)?.[1], s.note].filter(Boolean).join(' · ');
}

export function FieldNotesPanel({ center, features, onFocus }: {
  center: [number, number]; features: UserFeature[]; onFocus: (lngLat: [number, number]) => void;
}) {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const set = (p: Partial<ReturnType<typeof blank>>) => setForm((f) => ({ ...f, ...p }));
  const stands = features.filter((f) => f.geometry.type === 'Point' && (f.properties.icon === 'stand' || f.properties.icon === 'blind'))
    .sort((a, b) => a.properties.num - b.properties.num);

  useEffect(() => { call('GET', '/api/hunts').then(setHunts, (e) => setError(e.message)); }, []);

  const setSighting = (i: number, p: Partial<Sighting>) => setForm((f) => ({ ...f, sightings: f.sightings.map((x, j) => (j === i ? { ...x, ...p } : x)) }));

  function edit(h: Hunt) {
    const s = new Date(h.started_at), e = h.ended_at ? new Date(h.ended_at) : null;
    setForm({
      id: h.id, stand: h.stand_id ?? '', spot: [h.lng, h.lat], date: ymd(s), start: hm(s), end: e ? hm(e) : '',
      windNote: h.wind_note, pressure: { trucks: h.pressure.trucks ?? '', hunters: h.pressure.hunters ?? '', shots: !!h.pressure.shots },
      sightings: h.sightings, activity: h.activity ?? '', verdict: h.stand_verdict ?? '',
      move: { toward: h.move.toward ?? '', yards: h.move.yards ?? '', why: h.move.why ?? '' }, notes: h.notes,
    });
  }

  async function save() {
    setError('');
    if (!form.start) return setError('Add the time you got in the stand.');
    const stand = stands.find((s) => s.id === form.stand);
    const [lng, lat] = stand ? ((stand.geometry as Point).coordinates as [number, number]) : form.spot ?? center;
    setBusy('Saving and looking up the weather for the sit…');
    try {
      const p = form.pressure;
      const body = {
        stand_id: stand?.id ?? null, lng, lat,
        started_at: new Date(`${form.date}T${form.start}`).toISOString(),
        ended_at: form.end ? new Date(`${form.date}T${form.end}`).toISOString() : null,
        wind_note: form.windNote, pressure: p.trucks || p.hunters || p.shots ? p : {}, sightings: form.sightings,
        activity: form.activity || null, stand_verdict: form.verdict || null,
        move: form.verdict && form.verdict !== 'right' ? form.move : {}, notes: form.notes,
      };
      const h: Hunt = await call(form.id ? 'PUT' : 'POST', form.id ? `/api/hunts/${form.id}` : '/api/hunts', body);
      setHunts((cur) => [h, ...cur.filter((x) => x.id !== h.id)].sort((a, b) => b.started_at.localeCompare(a.started_at)));
      setForm(blank());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this hunt?')) return;
    await call('DELETE', `/api/hunts/${id}`);
    setHunts((cur) => cur.filter((h) => h.id !== id));
  }

  return (
    <div className="journal fieldnotes">
      <h2>📝 Field notes</h2>
      <p className="muted small">Log every sit, even the dead ones. Just say what happened. The app looks up the temperature, fronts, wind and moon for you.</p>

      <label>Stand
        <select value={form.stand} onChange={(e) => set({ stand: e.target.value })}>
          <option value="">{form.spot ? 'Saved spot' : 'Map crosshair'}</option>
          {stands.map((s) => <option key={s.id} value={s.id as string}>#{s.properties.num} {s.properties.name || s.properties.icon}</option>)}
        </select>
      </label>
      <div className="row">
        <label className="grow">Date<input type="date" value={form.date} max={ymd(new Date())} onChange={(e) => set({ date: e.target.value })} /></label>
        <label className="grow">In<input type="time" value={form.start} onChange={(e) => set({ start: e.target.value })} /></label>
        <label className="grow">Out<input type="time" value={form.end} onChange={(e) => set({ end: e.target.value })} /></label>
      </div>

      <h3>Deer seen</h3>
      {form.sightings.map((s, i) => (
        <div key={i} className="card subrow">
          <div className="row wrap">
            <input type="time" value={s.time} onChange={(e) => setSighting(i, { time: e.target.value })} />
            <input type="number" min={1} max={50} value={s.count} title="How many" style={{ width: '4em' }} onChange={(e) => setSighting(i, { count: e.target.value })} />
            <select value={s.what} onChange={(e) => setSighting(i, { what: e.target.value })}>{WHAT.map((w) => <option key={w}>{w}</option>)}</select>
            <button className="link danger" onClick={() => setForm((f) => ({ ...f, sightings: f.sightings.filter((_, j) => j !== i) }))} aria-label="Remove">✕</button>
          </div>
          {(s.what === 'buck' || s.what === 'target buck') && (
            <div className="row wrap">
              {s.what === 'buck' && <label className="row"><input type="checkbox" checked={s.mature} onChange={(e) => setSighting(i, { mature: e.target.checked })} /> Mature</label>}
              <select value={s.age} onChange={(e) => setSighting(i, { age: e.target.value })}>
                <option value="">Age?</option>{['1.5', '2.5', '3.5', '4.5', '5.5+'].map((a) => <option key={a}>{a}</option>)}
              </select>
              <input type="number" min={0} max={40} placeholder="Pts" style={{ width: '4em' }} value={s.points} onChange={(e) => setSighting(i, { points: e.target.value })} />
              <select value={s.outcome} onChange={(e) => setSighting(i, { outcome: e.target.value })}>{OUTCOME.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </div>
          )}
          <details>
            <summary className="muted small">More (optional)</summary>
            <div className="row wrap">
              <select value={s.behavior} onChange={(e) => setSighting(i, { behavior: e.target.value })}>{BEHAVIOR.map((b) => <option key={b} value={b}>{b || 'Doing?'}</option>)}</select>
              <select value={s.from} onChange={(e) => setSighting(i, { from: e.target.value })}><option value="">Came from?</option>{DIRS.map((d) => <option key={d}>{d}</option>)}</select>
              <select value={s.to} onChange={(e) => setSighting(i, { to: e.target.value })}><option value="">Went?</option>{DIRS.map((d) => <option key={d}>{d}</option>)}</select>
              <input type="number" min={0} max={500} placeholder="Yards" style={{ width: '5em' }} value={s.yards} onChange={(e) => setSighting(i, { yards: e.target.value })} />
            </div>
          </details>
          <input placeholder="Anything else about this deer" value={s.note} onChange={(e) => setSighting(i, { note: e.target.value })} />
        </div>
      ))}
      <button className="link" onClick={() => set({ sightings: [...form.sightings, newSighting()] })}>+ Deer</button>

      <label>Deer activity
        <select value={form.activity} onChange={(e) => set({ activity: e.target.value })}>{ACTIVITY.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </label>
      <label>Wind in the stand (optional, your words)
        <input value={form.windNote} placeholder="e.g. swirled all evening, kept hitting my neck" onChange={(e) => set({ windNote: e.target.value })} />
      </label>

      <h3>Other hunters</h3>
      <div className="row wrap">
        <label className="grow">Trucks at the lot<input type="number" min={0} max={50} value={form.pressure.trucks} onChange={(e) => set({ pressure: { ...form.pressure, trucks: e.target.value } })} /></label>
        <label className="grow">Hunters seen<input type="number" min={0} max={50} value={form.pressure.hunters} onChange={(e) => set({ pressure: { ...form.pressure, hunters: e.target.value } })} /></label>
        <label className="row"><input type="checkbox" checked={form.pressure.shots} onChange={(e) => set({ pressure: { ...form.pressure, shots: e.target.checked } })} /> Heard shots</label>
      </div>

      <h3>Is the stand in the right spot?</h3>
      <div className="row wrap">
        {VERDICT.map(([k, l]) => (
          <button key={k} className={form.verdict === k ? 'active' : ''} onClick={() => set({ verdict: form.verdict === k ? '' : k })}>{l}</button>
        ))}
      </div>
      {form.verdict && form.verdict !== 'right' && (
        <div className="row wrap">
          <select value={form.move.toward} onChange={(e) => set({ move: { ...form.move, toward: e.target.value } })}><option value="">Move which way?</option>{DIRS.map((d) => <option key={d}>{d}</option>)}</select>
          <input type="number" min={0} max={2000} placeholder="Yards" style={{ width: '5em' }} value={form.move.yards} onChange={(e) => set({ move: { ...form.move, yards: e.target.value } })} />
          <input className="grow" placeholder="Why: deer passed out of range on the bench below…" value={form.move.why} onChange={(e) => set({ move: { ...form.move, why: e.target.value } })} />
        </div>
      )}

      <label>Notes
        <textarea rows={3} value={form.notes} placeholder="Walk in, bumped deer, anything else" onChange={(e) => set({ notes: e.target.value })} />
      </label>
      <div className="row">
        <button className="primary grow" onClick={save} disabled={!!busy}>{busy || (form.id ? 'Save changes' : 'Log hunt')}</button>
        {form.id && <button onClick={() => setForm(blank())}>Cancel</button>}
      </div>
      {error && <p className="error">{error}</p>}

      <h2>Hunts ({hunts.length})</h2>
      {hunts.map((h) => {
        const s = new Date(h.started_at), e = h.ended_at ? new Date(h.ended_at) : null;
        const verdict = VERDICT.find(([k]) => k === h.stand_verdict)?.[1];
        const p = h.pressure;
        const others = [p.trucks && `${p.trucks} truck${p.trucks === '1' ? '' : 's'} at the lot`, p.hunters && `${p.hunters} hunter${p.hunters === '1' ? '' : 's'} seen`, p.shots && 'heard shots'].filter(Boolean);
        return (
          <div key={h.id} className="card entry">
            <div className="row">
              <strong className="grow">{h.stand_num ? `#${h.stand_num} ${h.stand_name ?? ''}` : 'Map spot'}</strong>
              <button onClick={() => onFocus([h.lng, h.lat])}>Show</button>
              <button onClick={() => edit(h)}>Edit</button>
            </div>
            <p className="muted small">
              {s.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {clock(hm(s))}{e ? `–${clock(hm(e))}` : ''}
              {h.activity ? ` · deer activity: ${ACTIVITY.find(([k]) => k === h.activity)?.[1]?.toLowerCase()}` : ''}
            </p>
            {h.sightings.map((x, i) => <p key={i} className="small">🦌 {sightingLine(x)}</p>)}
            {!h.sightings.length && <p className="small muted">No deer seen.</p>}
            <p className="small">🌡️ {weatherStory(h).join(' ')}</p>
            {h.wind_note && <p className="small">💨 {h.wind_note}</p>}
            {others.length > 0 && <p className="small">🧢 {others.join(', ')}</p>}
            {verdict && <p className="small"><strong>{verdict}</strong>{h.move.toward || h.move.yards ? ` · move ${h.move.yards ? `${h.move.yards} yd ` : ''}${h.move.toward ? say(h.move.toward) : ''}` : ''}{h.move.why ? ` · ${h.move.why}` : ''}</p>}
            {h.notes && <p className="small pre">{h.notes}</p>}
            <button className="link danger" onClick={() => remove(h.id)}>Delete</button>
          </div>
        );
      })}
    </div>
  );
}
