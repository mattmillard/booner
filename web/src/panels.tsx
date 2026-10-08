import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { gpx, kml } from '@tmcw/togeojson';
import { api, type Folder, type LandInfo, type UserFeature } from './api';
import { BASEMAPS, COMPASS, ICONS, LINE_COLORS, OVERLAYS, STAND_TYPES } from './config';
import { download, importable, measure, toGpx, toKml, usng } from './geo';
import { iconUrl } from './map';
import type { Prefs } from './App';
import { analyzeStand, isStand, type StandAt } from './stands';
import { compass } from './conditions';
import { CROP, LANDFORM_KEY, sampleLandform, samplePixel, sampleValue, SLOPE_KEY, TF } from './terrainai';
import { foodAttraction } from './seasonal';
import { guessKind, KNOWLEDGE_KINDS, type Knowledge } from './knowledge';
import { circle, CIRCLE_ACRES, estimateDeer, range, type DeerEstimate } from './deer';
import { phaseOn } from './season';

const Legend = ({ items }: { items: [string, string][] }) => (
  <div className="legend">{items.map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
);

function TerrainIcon({ kind, color }: { kind: string; color: string }) {
  if (kind === 'pinch') return (
    <svg className="terrain-pinch-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 2h16l-8 7L2 2Zm8 9 8 7H2l8-7Z" fill={color} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
  return <i className="terrain-kind-icon" style={{ background: color }} />;
}

// One switch per kind inside an overlay (creek crossings, saddles, buck beds...). `off` = kinds he turned off.
function KindSwitches({ items, off, setOff }: { items: [string, string, string, string?][]; off: string[]; setOff: (off: string[]) => void }) {
  return (
    <div className="kinds">
      {items.map(([id, label, color, glyph]) => (
        <label key={id} className="row">
          <input type="checkbox" checked={!off.includes(id)} onChange={(e) => setOff(e.target.checked ? off.filter((k) => k !== id) : [...off, id])} />
          {glyph ? <TerrainIcon kind={glyph} color={color} /> : <i style={{ background: color }} />}
          <span>{label}</span>
        </label>
      ))}
      <div className="row">
        <button className="link" onClick={() => setOff([])}>All</button>
        <button className="link" onClick={() => setOff(items.map(([id]) => id))}>None</button>
      </div>
    </div>
  );
}

function TerrainIntel({ at, windBin, time, info }: { at: [number, number]; windBin: number; time: number; info: LandInfo }) {
  const [v, setV] = useState<{ buck: number; doe: number; corridor: number; landform: string | null; modeled: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([
      sampleValue(`bed_buck_${windBin}`, ...at), sampleValue('bed_doe', ...at), sampleValue('corridor', ...at), sampleLandform(...at),
      samplePixel('plan', ...at),   // the model's data tile exists wherever the county has been run
    ]).then(([buck, doe, corridor, landform, plan]) => live && setV({ buck, doe, corridor, landform, modeled: !!plan }), () => live && setV(null));
    return () => void (live = false);
  }, [at, windBin]);
  const phase = phaseOn(new Date(time));
  const empty = v && !v.buck && !v.doe && !v.corridor && !v.landform && !info.terrain.length && !info.food;
  const bar = (label: string, x: number, color: string) => (
    <div className="meter" key={label}>
      <span>{label}</span>
      <b><i style={{ width: `${Math.round(x * 100)}%`, background: color }} /></b>
      <em>{Math.round(x * 100)}%</em>
    </div>
  );
  return (
    <div className="card">
      <h3>Terrain intelligence</h3>
      {!v && <p className="muted small">Reading the terrain model…</p>}
      {empty && (v.modeled
        ? <p className="muted small">Nothing notable right here: open ground with no bedding, travel, terrain features or crop field nearby.</p>
        : <p className="muted small">No AI terrain data here yet. Run <code>pipeline/terrain.py</code> for this county.</p>)}
      {v && !empty && (
        <>
          {bar(`Buck bedding (wind ${compass(windBin * 45)})`, v.buck, '#be4bdb')}
          {bar('Doe bedding', v.doe, '#15aabf')}
          {bar('Travel corridor', v.corridor, '#fd7e14')}
          {v.landform && <p className="small">Landform: <strong>{v.landform}</strong></p>}
        </>
      )}
      {info.food && (
        <p className="small">
          Field: <strong>{CROP[info.food.crop]?.label ?? info.food.crop}</strong> ({Math.round(info.food.acres)} ac, {info.food.year} crop).
          Deer draw on this date ({phase.name.toLowerCase()}): <strong>{Math.round(foodAttraction(info.food.crop, new Date(time)) * 100)}%</strong>
        </p>
      )}
      {info.terrain.map((t, i) => {
        const def = TF[t.kind];
        if (!def) return null;
        return (
          <details key={i} open={i === 0} className="why">
            <summary>
              <span className="tfbadge" style={{ background: def.symbol ? 'transparent' : def.color }}>
                {def.symbol ? <TerrainIcon kind={def.symbol} color={def.color} /> : def.letter}
              </span>
              {def.label} · {Math.round(t.dist_m / 0.9144)} yd · score {Math.round(t.score * 100)}
            </summary>
            <p className="small">{def.why}</p>
            {t.kind === 'bed_buck' && t.props.wind && (
              <p className="small muted">Bedding odds by wind: {t.props.wind.map((w: number, k: number) => `${compass(k * 45)} ${Math.round(w * 100)}%`).join(' · ')}</p>
            )}
            {t.props.cover_width_yd && <p className="small muted">Cover is ~{t.props.cover_width_yd} yd wide here.</p>}
            {t.props.draws && <p className="small muted">{t.props.draws} draws converge.</p>}
          </details>
        );
      })}
      <p className="muted small">Model output from elevation, crop and road data. Treat it as a scouting lead and confirm with boots on the ground.</p>
    </div>
  );
}

function StandConditions({ feature, time }: { feature: UserFeature; time: number }) {
  const [a, setA] = useState<StandAt | null>(null);
  const [error, setError] = useState('');
  const deps = JSON.stringify([feature.geometry, feature.properties.props, feature.properties.icon]);
  useEffect(() => {
    let live = true;
    analyzeStand(feature, time).then((x) => live && setA(x), (e) => live && setError(e.message));
    return () => void (live = false);
  }, [deps, time]);
  if (error) return <p className="error small">{error}</p>;
  if (!a) return <p className="muted small">Checking wind and terrain…</p>;
  const { eff, plume: p, ter, grade: g } = a;
  const h = a.c.hours.find((x) => x.t * 1000 === a.hourT);
  return (
    <div className={`card standwx ${g.level}`}>
      <div className="row">
        <strong className="grow">Wind &amp; scent · {new Date(a.hourT).toLocaleString([], { weekday: 'short', hour: 'numeric' })}</strong>
        <span className={`badge fitbadge ${g.level}`}>{g.level === 'unset' ? 'no good winds set' : g.level}</span>
      </div>
      <p className="small">{g.text}</p>
      <dl>
        <dt>At stand</dt><dd>from {compass(eff.fromAz)} {eff.speed.toFixed(1)} mph <span className="muted">({eff.driver === 'thermal' ? 'thermal-driven' : eff.driver === 'mixed' ? 'wind + thermal' : 'wind-driven'})</span></dd>
        {h && <><dt>Forecast</dt><dd>{compass(h.windDir)} {Math.round(h.wind)} mph (gust {Math.round(h.gust)}) at 33 ft</dd></>}
        <dt>Thermal</dt><dd>{eff.thermal.label}{eff.thermal.speed > 0.1 ? ` · ~${eff.thermal.speed.toFixed(1)} mph toward ${compass(eff.thermal.towardAz)}` : ''}</dd>
        <dt>Scent</dt><dd>{p.calm ? 'pools around the stand (near calm)' : `drifts toward ${compass(eff.towardAz)}, ±${p.halfAngle}° (+${p.spread}° forecast spread), likely detected out to ~${Math.round(p.lengthsYd[1])} yd, possible to ${Math.round(p.lengthsYd[2])} yd`}</dd>
        <dt>Terrain</dt><dd>{ter.landform}, {Math.round(ter.slope)}° slope facing {compass(ter.aspect)}, {Math.round(ter.elev * 3.28084)} ft</dd>
      </dl>
      {ter.landform === 'cold pool' && <p className="small warn">Cold-air pool: before ~1.5 h after sunrise and after sunset, scent drains down this bottom regardless of the forecast wind.</p>}
      {eff.channeled && <p className="small warn">Deep drainage: light wind is channeled along the bottom ({compass(ter.drainAz)}–{compass(ter.drainAz + 180)}).</p>}
      {eff.leeEddy && <p className="small warn">Lee side of the ridge in strong wind: expect eddies and reversed flow near the ground.</p>}
    </div>
  );
}

export function Login({ onDone }: { onDone: (email: string) => void }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const username = String(form.get('username'));
      const password = String(form.get('password'));
      const u = register
        ? await api.register(username, String(form.get('email')), password)
        : await api.login(username, password);
      onDone(u.email);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1>hunt-app</h1>
        <p className="muted">Missouri hunting maps · Callaway &amp; Cooper</p>
        <input name="username" type="text" placeholder="Username" autoComplete="username" required />
        {register && <input name="email" type="email" placeholder="Email" autoComplete="email" required />}
        <input name="password" type="password" placeholder="Password (10+ characters)" autoComplete={register ? 'new-password' : 'current-password'} minLength={10} required />
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{register ? 'Create account' : 'Sign in'}</button>
        <button type="button" className="link" onClick={() => setRegister(!register)}>
          {register ? 'Have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  );
}

export function LayersPanel({ prefs, setPrefs, sourceDates, notes }: { prefs: Prefs; setPrefs: Dispatch<SetStateAction<Prefs>>; sourceDates: Record<string, string>; notes: Record<string, string> }) {
  const setOverlay = (id: string, patch: Partial<{ on: boolean; opacity: number }>) =>
    setPrefs((p) => ({ ...p, overlays: { ...p.overlays, [id]: { ...p.overlays[id], ...patch } } }));

  return (
    <div>
      <h2>Base map</h2>
      {BASEMAPS.map((b) => (
        <label key={b.id} className="row">
          <input type="radio" checked={prefs.basemap === b.id} onChange={() => setPrefs((p) => ({ ...p, basemap: b.id }))} />
          <span className="grow">{b.label}</span>
          <span className="date" title={b.source}>{b.date}</span>
        </label>
      ))}

      <div className="row">
        <h2 className="grow">Overlays <span className="muted small">(load from zoom 14.5; property lines 13.5, markers &amp; slope 14)</span></h2>
        <button title="Turn every overlay and 3D off, then switch on only what you want"
          onClick={() => setPrefs((p) => ({ ...p, terrain: { ...p.terrain, on: false },
            overlays: Object.fromEntries(Object.entries(p.overlays).map(([k, v]) => [k, { ...v, on: false }])) }))}>
          Clear map
        </button>
      </div>
      {OVERLAYS.map((o) => {
        const state = prefs.overlays[o.id];
        return (
          <div key={o.id} className="overlay">
            <label className="row">
              <input type="checkbox" checked={state.on} onChange={(e) => setOverlay(o.id, { on: e.target.checked })} />
              <span className="grow">{o.label}</span>
              <span className="date" title={o.source}>{(o.date === 'ai' ? sourceDates.ai : sourceDates[o.id]) ?? o.date}</span>
            </label>
            {state.on && (
              <input type="range" min={0.1} max={1} step={0.05} value={state.opacity} onChange={(e) => setOverlay(o.id, { opacity: Number(e.target.value) })} aria-label={`${o.label} opacity`} />
            )}
            {state.on && notes[o.id] && <p className="muted small note">{notes[o.id]}</p>}
            {state.on && o.id === 'slope' && <Legend items={SLOPE_KEY.map(([n, c]) => [n, `rgb(${c.slice(0, 3).join(',')})`])} />}
            {state.on && o.id === 'ai_landform' && (
              <KindSwitches items={LANDFORM_KEY.map(([n, c]) => [n, n, `rgb(${c.join(',')})`])} off={prefs.landformOff} setOff={(landformOff) => setPrefs((p) => ({ ...p, landformOff }))} />
            )}
            {state.on && o.id === 'ai_food' && <Legend items={Object.values(CROP).map((c) => [c.label, c.color])} />}
            {state.on && o.id === 'ai_features' && (
              <KindSwitches items={Object.entries(TF).map(([k, t]) => [k, t.symbol ? t.label : `${t.letter} ${t.label}`, t.color, t.symbol ? k : undefined])} off={prefs.tfOff} setOff={(tfOff) => setPrefs((p) => ({ ...p, tfOff }))} />
            )}
            {state.on && o.id === 'ai_trails' && <Legend items={[['Bed ↔ food', '#ffa94d'], ['Bed ↔ bed (rut)', '#f783ac']]} />}
          </div>
        );
      })}

      <h2>3D terrain</h2>
      <label className="row">
        <input type="checkbox" checked={prefs.terrain.on} onChange={(e) => setPrefs((p) => ({ ...p, terrain: { ...p.terrain, on: e.target.checked } }))} />
        <span className="grow">Show 3D</span>
        <span className="date">{prefs.terrain.exaggeration.toFixed(1)}×</span>
      </label>
      <input type="range" min={1} max={4} step={0.1} value={prefs.terrain.exaggeration} onChange={(e) => setPrefs((p) => ({ ...p, terrain: { ...p.terrain, exaggeration: Number(e.target.value) } }))} aria-label="Terrain exaggeration" />
      <p className="muted small">Right-drag (or two-finger drag) to tilt and rotate.</p>
    </div>
  );
}

const money = (n: number | null) => (n ? `$${Math.round(n).toLocaleString()}` : null);

// The 1,000 acres around any tapped spot: deer live across the neighbourhood, not on one deed (a 4-acre house lot holds
// none, the circle around it holds plenty).
function DeerAround({ at, county }: { at: [number, number]; county: string }) {
  const [d, setD] = useState<DeerEstimate | null | 'busy' | 'none'>(null);
  useEffect(() => setD(null), [at[0], at[1]]);
  const go = () => { setD('busy'); estimateDeer(circle(at), county).then((r) => setD(r ?? 'none'), () => setD('none')); };
  return (
    <div className="card">
      {d === null && <button onClick={go}>🦌 Deer in the {CIRCLE_ACRES.toLocaleString()} acres around here</button>}
      {d === 'busy' && <p className="muted small">Estimating…</p>}
      {d === 'none' && <p className="muted small">No terrain-model data here to estimate from.</p>}
      {d && typeof d === 'object' && (
        <>
          <h3>🦌 The {CIRCLE_ACRES.toLocaleString()} acres around here</h3>
          <p className="small">Deer living here <strong>{range([d.low.deer, d.typ.deer, d.high.deer])}</strong> · antlered bucks {range([d.low.bucks, d.typ.bucks, d.high.bucks])}
            {' '}· mature 3.5+ <strong>{range([d.low.b35, d.typ.b35, d.high.b35])}</strong> · 4.5+ {range([d.low.b45, d.typ.b45, d.high.b45])}</p>
          <p className="small">Mature bucks using it regularly {range(d.matureRegular)}, passing through in the fall {range(d.maturePassing)}.</p>
          <p className="muted small">{Object.entries(d.cover).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}%`).join(', ')}. County density from MDC
            harvest, shifted by habitat (docs/research/10-deer-density.md).</p>
        </>
      )}
    </div>
  );
}

export function LandCard({ at, info, error, onDropPin, onGroup, onAddToGroup, windBin, time }: {
  at: [number, number]; info: LandInfo | null; error?: string; onDropPin: () => void; windBin: number; time: number;
  onGroup: (owner: string, county: string) => void; onAddToGroup?: () => void;
}) {
  const p = info?.parcel;
  return (
    <div>
      {!info && !error && <p className="muted">Looking up…</p>}
      {error && <p className="error">{error}</p>}
      {info && (
        <>
          {info.publicLands.map((l) => (
            <div key={l.name} className="card public">
              <div className="badge public">Public land</div>
              <h2>{l.name}</h2>
              <p>{l.manager}{l.acres ? ` · ${Math.round(l.acres).toLocaleString()} ac` : ''}</p>
              {l.attrs?.Huntable && <p>Hunting: {l.attrs.Huntable}</p>}
              {l.zones.map((z) => (
                <div key={z.kind} className={`zone ${z.kind}`}>
                  <strong>{z.kind === 'hunting' ? '✅ ' : '⛔ '}{z.label}</strong>
                  <p className="small">{z.rules}</p>
                  <p className="date">{z.source}</p>
                </div>
              ))}
              <p className="links">
                {l.regs_url && <a href={l.regs_url} target="_blank" rel="noreferrer">Area regulations</a>}
                {l.info_url && <a href={l.info_url} target="_blank" rel="noreferrer">Area info</a>}
              </p>
              <p className="date">Data {l.source_date}</p>
            </div>
          ))}
          {p ? (
            <div className="card">
              {!info.publicLands.length && <div className="badge private">Private: get permission</div>}
              <h2>{p.owner || 'Unknown owner'}</h2>
              <dl>
                <dt>Acres</dt><dd>{p.acres ?? '—'} deeded · {p.gis_acres} mapped</dd>
                {p.mail_address && <><dt>Mailing</dt><dd>{p.mail_address}</dd></>}
                {p.site_address && <><dt>Site</dt><dd>{p.site_address}</dd></>}
                <dt>Parcel</dt><dd>{p.parcel_id}</dd>
                {p.plss && <><dt>S-T-R</dt><dd>{p.plss}</dd></>}
                {p.legal && <><dt>Legal</dt><dd className="small">{p.legal}</dd></>}
                {p.sale_date_ms && <><dt>Last sale</dt><dd>{new Date(p.sale_date_ms).toLocaleDateString()} {money(p.sale_amount)}</dd></>}
              </dl>
              <p className="date">{p.county} County Assessor · fetched {p.source_date}</p>
              <div className="row wrap">
                {p.owner && <button onClick={() => onGroup(p.owner!, p.county)}>🧩 Group by owner</button>}
                {onAddToGroup && <button onClick={onAddToGroup}>➕ Add to group</button>}
              </div>
            </div>
          ) : (
            !info.publicLands.length && <p className="muted">No parcel data here yet{info.county && info.county !== 'Callaway' ? ` (${info.county} County not loaded)` : ''}.</p>
          )}
          <TerrainIntel at={at} windBin={windBin} time={time} info={info} />
          {info.county && <DeerAround at={at} county={info.county} />}
          <dl className="card">
            {info.county && <><dt>County</dt><dd>{info.county}</dd></>}
            {info.section && <><dt>Section</dt><dd>{info.section}</dd></>}
            <dt>Lat/Lng</dt><dd>{at[1].toFixed(5)}, {at[0].toFixed(5)}</dd>
            <dt>USNG</dt><dd>{usng(at[0], at[1])}</dd>
          </dl>
        </>
      )}
      <button className="primary" onClick={onDropPin}>📍 Drop pin here</button>
    </div>
  );
}

export function FeatureEditor({ feature, time, folders, onSave, onDelete, onNewFolder, onClose, onPhotos }: {
  feature: UserFeature;
  time: number;
  folders: Folder[];
  onSave: (patch: { properties: Partial<UserFeature['properties']> }) => Promise<void>;
  onDelete: () => void;
  onNewFolder: (name: string) => Promise<string>;
  onClose: () => void;
  onPhotos?: () => void;
}) {
  const [f, setF] = useState(feature.properties);
  const [saved, setSaved] = useState(true);
  const set = (patch: Partial<typeof f>) => {
    setF((cur) => ({ ...cur, ...patch }));
    setSaved(false);
  };
  const setProp = (k: string, v: unknown) => set({ props: { ...f.props, [k]: v } });
  const isStandIcon = f.kind === 'pin' && (f.icon === 'stand' || f.icon === 'blind');
  const winds: string[] = f.props.goodWinds ?? [];
  const g = feature.geometry;

  // Changing the pin type saves right away (other unsaved edits stay pending); the editor stays open.
  function changeIcon(icon: string) {
    setF((cur) => ({ ...cur, icon }));
    onSave({ properties: { icon } });
  }

  async function save() {
    await onSave({ properties: { name: f.name, notes: f.notes, icon: f.icon, color: f.color, folder_id: f.folder_id, props: f.props } });
    setSaved(true);
    onClose(); // done with this pin: back to the map to drop the next one
  }
  const k: Knowledge | undefined = f.props.knowledge;

  return (
    <div className="editor">
      <span className="pinnum">#{f.num}</span>
      <input className="title" value={f.name} placeholder={f.kind === 'pin' ? ICONS[f.icon ?? 'pin']?.label : `Unnamed ${f.kind}`} onChange={(e) => set({ name: e.target.value })} />
      {g.type === 'Point' ? (
        <p className="muted small">{g.coordinates[1].toFixed(5)}, {g.coordinates[0].toFixed(5)} · {usng(g.coordinates[0], g.coordinates[1])} · drag the ring to move</p>
      ) : (
        <p className="muted">{measure(g)}</p>
      )}

      {f.kind === 'pin' ? (
        <div className="icons">
          {Object.entries(ICONS).map(([id, def]) => (
            <button key={id} className={f.icon === id ? 'active' : ''} title={def.label} onClick={() => changeIcon(id)}>
              <img src={iconUrl(id)} alt="" />
              <span>{def.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="swatches">
          {LINE_COLORS.map((c) => (
            <button key={c} className={f.color === c ? 'active' : ''} style={{ background: c }} onClick={() => set({ color: c })} aria-label={c} />
          ))}
        </div>
      )}

      {isStand(feature) && <StandConditions feature={feature} time={time} />}

      {(f.icon === 'parking' || f.icon === 'gate') && (
        <label className="row">
          <input type="checkbox" checked={!!f.props.publicAccess} onChange={(e) => setProp('publicAccess', e.target.checked || undefined)} />
          <span className="grow">Public access (other hunters park here). The planner treats it as hunting pressure.</span>
        </label>
      )}

      {isStandIcon && (
        <fieldset>
          <legend>Stand</legend>
          <label>Type
            <select value={f.props.standType ?? ''} onChange={(e) => setProp('standType', e.target.value || undefined)}>
              <option value="">—</option>
              {STAND_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Height (ft)
            <input type="number" min={0} max={40} value={f.props.heightFt ?? ''} onChange={(e) => setProp('heightFt', e.target.value ? Number(e.target.value) : undefined)} />
          </label>
          <label>Facing
            <select value={f.props.facing ?? ''} onChange={(e) => setProp('facing', e.target.value || undefined)}>
              <option value="">—</option>
              {COMPASS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <div className="winds">
            <span>Good winds</span>
            <div>
              {COMPASS.map((d) => (
                <button key={d} className={winds.includes(d) ? 'active' : ''}
                  onClick={() => setProp('goodWinds', winds.includes(d) ? winds.filter((w) => w !== d) : [...winds, d])}>{d}</button>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      <label>Folder
        <select
          value={f.folder_id ?? ''}
          onChange={async (e) => {
            if (e.target.value !== '__new') return set({ folder_id: e.target.value || null });
            const name = prompt('Folder name');
            if (name?.trim()) set({ folder_id: await onNewFolder(name.trim()) });
          }}
        >
          <option value="">No folder</option>
          {folders.map((fo) => <option key={fo.id} value={fo.id}>{fo.name}</option>)}
          <option value="__new">+ New folder…</option>
        </select>
      </label>
      {f.icon === 'harvest' && (
        <div className="row">
          <label className="grow">Score (inches, P&amp;Y gross)
            <input type="number" min={100} max={250} step={0.125} value={f.props.harvest?.score ?? ''} placeholder="174"
              onChange={(e) => setProp('harvest', { ...f.props.harvest, score: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="grow">Age (years)
            <input type="number" min={1.5} max={12} step={0.5} value={f.props.harvest?.age ?? ''} placeholder="5.5"
              onChange={(e) => setProp('harvest', { ...f.props.harvest, age: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
        </div>
      )}
      {f.icon === 'harvest' && f.props.harvest?.score != null && f.props.harvest.score < 130 && (
        <p className="muted small">Harvest pins are for trophies, 130″ and up.</p>
      )}
      <label>Notes
        <textarea rows={4} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>

      <fieldset className="knowledge">
        <legend>Use as knowledge?</legend>
        <label className="row">
          <input type="checkbox" checked={!!k} onChange={(e) => setProp('knowledge', e.target.checked ? { kind: guessKind(f.notes || f.name), note: f.notes || f.name, at: new Date().toISOString() } : undefined)} />
          <span className="grow">{k ? 'The planner and analyst use this pin' : 'Private note: the planner and analyst ignore this pin'}</span>
        </label>
        {k && (
          <>
            <select value={k.kind} onChange={(e) => setProp('knowledge', { ...k, kind: e.target.value })}>
              {KNOWLEDGE_KINDS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
            </select>
            <input value={k.note} placeholder="What should the app know about this spot?" onChange={(e) => setProp('knowledge', { ...k, note: e.target.value })} />
          </>
        )}
      </fieldset>

      <div className="actions">
        <button className="primary" onClick={save} disabled={saved}>{saved ? 'Saved' : 'Save'}</button>
        {f.icon === 'camera' && onPhotos && <button onClick={onPhotos}>📷 Photos</button>}
        <button className="danger" onClick={() => confirm('Delete this?') && onDelete()}>Delete</button>
      </div>
      <p className="date">Created {new Date(f.created_at).toLocaleString()}</p>
    </div>
  );
}

export function FeatureList({ features, folders, onSelect, onImported }: {
  features: UserFeature[];
  folders: Folder[];
  onSelect: (f: UserFeature) => void;
  onImported: (fs: UserFeature[]) => void;
}) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const match = (f: UserFeature) => {
    const p = f.properties;
    return `${p.name} ${p.notes} ${ICONS[p.icon ?? '']?.label ?? p.kind}`.toLowerCase().includes(q.toLowerCase());
  };
  const groups = [...folders.map((fo) => ({ id: fo.id, name: fo.name })), { id: null, name: 'No folder' }]
    .map((g) => ({ ...g, items: features.filter((f) => (f.properties.folder_id ?? null) === g.id && match(f)) }))
    .filter((g) => g.items.length);

  async function importFile(file: File) {
    const doc = new DOMParser().parseFromString(await file.text(), 'text/xml');
    const fc = file.name.toLowerCase().endsWith('.kml') ? kml(doc) : gpx(doc);
    const items = fc.features.flatMap((f) => importable(f as GeoJSON.Feature));
    const created: UserFeature[] = [];
    for (const [i, it] of items.entries()) {
      setStatus(`Importing ${i + 1} / ${items.length}…`);
      created.push(await api.createFeature(it.geometry, { kind: it.kind, name: it.name, icon: it.kind === 'pin' ? 'pin' : null, color: it.kind === 'pin' ? null : '#4dabf7' }));
    }
    onImported(created);
    setStatus(`Imported ${created.length} items`);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <h2>My map ({features.length})</h2>
      <input type="search" placeholder="Search pins, lines, notes…" value={q} onChange={(e) => setQ(e.target.value)} />
      {groups.map((g) => (
        <section key={g.id ?? 'none'}>
          <h3>{g.name}</h3>
          {g.items.map((f) => (
            <button key={f.id} className="item" onClick={() => onSelect(f)}>
              {f.properties.kind === 'pin' ? <img src={iconUrl(f.properties.icon ?? 'pin')} alt="" /> : <span className="swatch" style={{ background: f.properties.color ?? '#ffd43b' }} />}
              <span className="grow"><span className="muted">#{f.properties.num}</span> {f.properties.name || (f.properties.kind === 'pin' ? ICONS[f.properties.icon ?? 'pin']?.label : `Unnamed ${f.properties.kind}`)}{f.properties.props?.knowledge ? ' 🧠' : ''}</span>
              <span className="date">{f.properties.kind === 'pin' ? '' : measure(f.geometry).split(' · ')[0]}</span>
            </button>
          ))}
        </section>
      ))}
      {!features.length && <p className="muted">Nothing yet. Use Pin, Line or Area on the left, or import a GPX/KML file.</p>}

      <h2>Import / export</h2>
      <label className="filebtn">
        Import GPX or KML
        <input type="file" accept=".gpx,.kml" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0]).catch((err) => setStatus(err.message))} />
      </label>
      {status && <p className="muted small">{status}</p>}
      <div className="actions">
        <button onClick={() => download(`hunt-map-${stamp}.gpx`, toGpx(features), 'application/gpx+xml')} disabled={!features.length}>GPX</button>
        <button onClick={() => download(`hunt-map-${stamp}.kml`, toKml(features), 'application/vnd.google-earth.kml+xml')} disabled={!features.length}>KML</button>
        <button onClick={() => download(`hunt-map-${stamp}.geojson`, JSON.stringify({ type: 'FeatureCollection', features }), 'application/geo+json')} disabled={!features.length}>GeoJSON</button>
      </div>
    </div>
  );
}
