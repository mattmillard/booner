import { useEffect, useState, type FormEvent } from 'react';
import type { MultiPolygon, Polygon } from 'geojson';
import { call } from './api';
import { CROP, TF } from './terrainai';
import { centroid, circle, CIRCLE_ACRES, estimateDeer, fmt, range, type DeerEstimate } from './deer';

export type GroupParcel = {
  id: number; county: string; parcel_id: string | null; owner: string | null; acres: number | null; gis_acres: number;
  geometry: MultiPolygon; on: boolean;
};
export type Group = { id: string | null; name: string; county: string; parcels: GroupParcel[]; known?: Record<string, number> };
type Saved = { id: string; name: string; county: string; parcel_ids: number[]; known?: Record<string, number> };
type Analysis = {
  n: number; deeded_acres: number | null; gis_acres: number; geometry: Polygon | MultiPolygon;
  food: { crop: string; acres: number }[];
  terrain: { kind: string; n: number }[];
  public: { name: string; manager: string; dist_m: number }[];
  zones: { area_name: string; kind: string; label: string; rules: string; dist_m: number }[];
};

const COUNTIES = ['Callaway', 'Cooper', 'Cole', 'Boone'];
const lastName = (owner: string) => owner.split(',')[0].trim().toUpperCase();
const ac = (v: number) => `${Math.round(v).toLocaleString()} ac`;
const away = (m: number) => (m < 5 ? 'adjoins or inside' : `${m} m away`);

const parcels = (q: string) =>
  call<Omit<GroupParcel, 'on'>[]>('GET', `/groups/parcels?${q}`).then((rs) => rs.map((p) => ({ ...p, on: true })));
export async function findGroup(name: string, county: string): Promise<Group> {
  return { id: null, name: `${lastName(name)} (${county})`, county, parcels: await parcels(new URLSearchParams({ name, county }).toString()) };
}
export const parcelAt = (lng: number, lat: number) => parcels(`lng=${lng}&lat=${lat}`).then((rs) => rs[0] ?? null);

// The planner fills one ring with even-odd scanlines. Every ring (all parts, holes too) joined into one ring, with a
// hop back to the first vertex after each, fills exactly the union: each hop is walked out and back, so it cancels.
function planArea(g: Polygon | MultiPolygon): Polygon {
  const rings = g.type === 'Polygon' ? g.coordinates : g.coordinates.flat();
  return { type: 'Polygon', coordinates: [rings.flatMap((r) => [...r, rings[0][0]])] };
}

export function GroupPanel({ group, setGroup, onShow, onPlan }: {
  group: Group | null;
  setGroup: (g: Group | null) => void;
  onShow: (g: Group) => void;
  onPlan: (area: Polygon) => void;
}) {
  const [saved, setSaved] = useState<Saved[]>([]);
  const [name, setName] = useState('');
  const [county, setCounty] = useState(group?.county ?? 'Cooper');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [deer, setDeer] = useState<{ inside: DeerEstimate | null; around: DeerEstimate | null } | null>(null);
  const [error, setError] = useState('');
  const on = group?.parcels.filter((p) => p.on) ?? [];
  const key = on.map((p) => p.id).join(',');

  useEffect(() => void call<Saved[]>('GET', '/groups').then(setSaved).catch((e) => setError(e.message)), []);
  useEffect(() => {
    setAnalysis(null);
    if (!key) return;
    let live = true;
    setDeer(null);
    call<Analysis>('POST', '/groups/analyze', { ids: key.split(',').map(Number) })
      .then(async (a) => {
        if (!live) return;
        setAnalysis(a);
        // Deer live across the neighbourhood, not on the deed: estimate the group and the 1,000 acres around it.
        const [inside, around] = await Promise.all([
          estimateDeer(a.geometry, group!.county), estimateDeer(circle(centroid(a.geometry)), group!.county),
        ]);
        if (live) setDeer({ inside, around });
      }).catch((e) => live && setError(e.message));
    return () => void (live = false);
  }, [key]);

  async function search(e: FormEvent) {
    e.preventDefault();
    setError('');
    const g = await findGroup(name, county).catch((err) => (setError(err.message), null));
    if (g && !g.parcels.length) setError(`No ${county} County parcels with owner last name ${lastName(name)}.`);
    else if (g) onShow(g);
  }

  async function save() {
    if (!group) return;
    const body = { name: group.name, county: group.county, parcel_ids: on.map((p) => p.id), known: group.known ?? {} };
    try {
      const s = group.id ? await call<Saved>('PATCH', `/groups/${group.id}`, body) : await call<Saved>('POST', '/groups', body);
      setGroup({ ...group, id: s.id });
      setSaved((cur) => [s, ...cur.filter((x) => x.id !== s.id)]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function open(s: Saved) {
    setError('');
    try {
      onShow({ id: s.id, name: s.name, county: s.county, known: s.known ?? {}, parcels: await parcels(`ids=${s.parcel_ids.join(',')}`) });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function rename(s: Saved) {
    const n = prompt('Group name', s.name)?.trim();
    if (!n) return;
    const r = await call<Saved>('PATCH', `/groups/${s.id}`, { name: n });
    setSaved((cur) => cur.map((x) => (x.id === s.id ? r : x)));
    if (group?.id === s.id) setGroup({ ...group, name: n });
  }

  async function remove(s: Saved) {
    if (!confirm(`Delete the group "${s.name}"?`)) return;
    await call('DELETE', `/groups/${s.id}`);
    setSaved((cur) => cur.filter((x) => x.id !== s.id));
    if (group?.id === s.id) setGroup({ ...group, id: null });
  }

  // His confirmed mature bucks (130"+) per year; saved with the group.
  const year = new Date().getFullYear();
  const years = [year - 3, year - 2, year - 1, year].map(String);
  const known = group?.known ?? {};
  const setKnown = (y: string, v: string) => {
    if (!group) return;
    const k = { ...known };
    if (v === '') delete k[y]; else k[y] = Number(v);
    setGroup({ ...group, known: k });
  };
  const knownVals = Object.values(known);
  const knownAvg = knownVals.length ? knownVals.reduce((a, b) => a + b, 0) / knownVals.length : null;
  const herd = (d: DeerEstimate, label: string) => (
    <div className="deer">
      <p><strong>{label}</strong> <span className="muted small">({fmt(d.acres)} ac: {Object.entries(d.cover).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}%`).join(', ')})</span></p>
      <p>Deer living here: <strong>{range([d.low.deer, d.typ.deer, d.high.deer])}</strong> · antlered bucks {range([d.low.bucks, d.typ.bucks, d.high.bucks])}
        · 2.5+ {range([d.low.b25, d.typ.b25, d.high.b25])}</p>
      <p>Mature 3.5+: <strong>{range([d.low.b35, d.typ.b35, d.high.b35])}</strong> live here · 4.5+ {range([d.low.b45, d.typ.b45, d.high.b45])}
        · mature bucks using it regularly {range(d.matureRegular)}, passing through in the fall {range(d.maturePassing)}</p>
    </div>
  );

  const toggle = (id: number) => group && setGroup({ ...group, parcels: group.parcels.map((p) => (p.id === id ? { ...p, on: !p.on } : p)) });
  const boone = county === 'Boone' || group?.county === 'Boone';

  return (
    <div className="groups">
      <h2>Parcel groups</h2>
      <form className="row" onSubmit={search}>
        <input className="grow" placeholder="Owner last name (e.g. Kramer)" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={county} onChange={(e) => setCounty(e.target.value)}>
          {COUNTIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button>Find</button>
      </form>
      {boone && <p className="muted small">Boone County owners are only known for parcels someone has tapped (fetched one at a time), so a Boone group by name will be partial. Tap the others and use "Add to group".</p>}
      {error && <p className="error">{error}</p>}

      {group && (
        <div className="card">
          <input value={group.name} onChange={(e) => setGroup({ ...group, name: e.target.value })} aria-label="Group name" />
          <p><strong>{on.length}</strong> of {group.parcels.length} parcels · <strong>{ac(on.reduce((s, p) => s + (p.acres ?? p.gis_acres), 0))}</strong></p>
          <ul className="grouplist">
            {group.parcels.map((p) => (
              <li key={p.id}>
                <label className="row">
                  <input type="checkbox" checked={p.on} onChange={() => toggle(p.id)} />
                  <span className="grow">{p.owner || 'Unknown owner'}<span className="muted small"> · {p.parcel_id}</span></span>
                  <span>{p.acres ?? p.gis_acres} ac</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="muted small">Uncheck parcels that aren't related. To add one, tap it on the map and choose "Add to group".</p>
          <div className="row wrap">
            <button className="primary" onClick={save} disabled={!on.length || !group.name.trim()}>{group.id ? 'Save changes' : 'Save group'}</button>
            <button onClick={() => analysis && onPlan(planArea(analysis.geometry))} disabled={!analysis}>🎯 Plan this group</button>
            <button className="link" onClick={() => setGroup(null)}>Close group</button>
          </div>
        </div>
      )}

      {group && on.length > 0 && (
        <div className="card">
          <h3>What's on it</h3>
          {!analysis ? <p className="muted">Analyzing…</p> : (
            <>
              <p>{analysis.n} parcels: {analysis.deeded_acres != null ? `${ac(analysis.deeded_acres)} deeded, ` : ''}{ac(analysis.gis_acres)} mapped.</p>
              <p>{analysis.food.length
                ? <>Crop fields (USDA cropland data): {analysis.food.map((f) => `${CROP[f.crop]?.label ?? f.crop} ${ac(f.acres)}`).join(', ')}.</>
                : 'No crop or hay fields mapped inside.'}</p>
              <p>{analysis.terrain.length
                ? <>Terrain model finds inside: {analysis.terrain.map((t) => `${TF[t.kind]?.label ?? t.kind} ×${t.n}`).join(', ')}.</>
                : 'The terrain model has no features inside (is this county modeled?).'}</p>
              <p>{analysis.public.length
                ? <>Public land: {analysis.public.map((l) => `${l.name} (${l.manager}, ${away(l.dist_m)})`).join('; ')}.</>
                : 'No public land within 400 m.'}</p>
              {analysis.zones.map((z) => (
                <p key={z.area_name + z.label} className="small"><strong>{z.area_name}: {z.label}</strong> ({away(z.dist_m)}). {z.rules}</p>
              ))}
            </>
          )}
        </div>
      )}

      {group && on.length > 0 && (
        <div className="card">
          <h3>🦌 Deer estimate</h3>
          {!deer ? <p className="muted">Estimating…</p> : (
            <>
              {deer.inside ? herd(deer.inside, 'On the group') : <p className="muted small">No terrain-model data for this county.</p>}
              {deer.around && herd(deer.around, `The ${CIRCLE_ACRES.toLocaleString()} acres around it`)}
              <p className="muted small">County deer density from MDC harvest (2023–25), shifted by how much timber, cover, crop and forage
                is here compared with the county. Mature-buck shares assume no antler restriction (2026 on). Low–high is the honest range;
                see docs/research/10-deer-density.md.</p>
            </>
          )}
          <h4>Mature bucks (130″+) you confirmed around here</h4>
          <div className="row wrap">
            {years.map((y) => (
              <label key={y} className="grow">{y}
                <input type="number" min={0} max={50} value={known[y] ?? ''} placeholder="?" onChange={(e) => setKnown(y, e.target.value)} />
              </label>
            ))}
          </div>
          {knownAvg != null && deer?.around && (
            <p className="small">You've confirmed <strong>{fmt(knownAvg)}</strong> a year on average. The model says {range(deer.around.matureRegular)} use the
              {' '}{CIRCLE_ACRES.toLocaleString()} acres around it regularly, so your ground runs at <strong>{fmt(knownAvg / deer.around.matureRegular[1])}×</strong> the
              {' '}typical estimate. That ratio is how the app will calibrate this area as your counts come in.</p>
          )}
          <p className="muted small">{group.id ? 'Press "Save changes" to keep these counts with the group.' : 'Save the group to keep these counts.'}</p>
        </div>
      )}

      <h3>Saved groups</h3>
      {!saved.length && <p className="muted small">None yet. Group parcels from a parcel card ("Group by owner") or the search above.</p>}
      {saved.map((s) => (
        <div key={s.id} className="row">
          <button className="link grow" onClick={() => open(s)}>{s.name}</button>
          <span className="muted small">{s.parcel_ids.length} parcels</span>
          <button onClick={() => rename(s)}>Rename</button>
          <button className="danger" onClick={() => remove(s)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
