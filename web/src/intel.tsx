import { useEffect, useState } from 'react';
import { api, type UserFeature } from './api';
import { periodFits, type PeriodFit } from './stands';
import { moonDay, startOfDay, sunDay, sunPosition } from './astro';
import { compass, getConditions, cellKey, hourAt, sky, type Conditions } from './conditions';
import { rate, type Period, type Rating } from './rating';
import { firearmsActive, phaseOn, portionsOn } from './season';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const nowHour = () => Math.floor(Date.now() / HOUR) * HOUR;

const fmtTime = (d: Date | null) => (d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—');
const fmtWhen = (t: number) => new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
const pct = (e: number) => `${e > 0 ? '+' : ''}${Math.round(e * 100)}%`;
const PERIOD_LABEL: Record<Period, string> = { am: 'Morning', midday: 'Midday', pm: 'Evening' };

export function periodAt(t: number, lat: number, lng: number): Period {
  const s = sunDay(new Date(t), lat, lng);
  if (!s) return 'pm';
  if (t < s.sunrise.getTime() + 2.5 * HOUR) return 'am';
  if (t < s.sunset.getTime() - 3 * HOUR) return 'midday';
  return 'pm';
}

export function TimeSlider({ time, setTime }: { time: number; setTime: (t: number) => void }) {
  const start = nowHour();
  return (
    <div className="timeslider">
      <div className="row">
        <button onClick={() => setTime(Math.max(start, time - HOUR))} aria-label="One hour earlier">◀</button>
        <strong className="grow center">{fmtWhen(time)}</strong>
        <button onClick={() => setTime(Math.min(start + 7 * DAY, time + HOUR))} aria-label="One hour later">▶</button>
        <button onClick={() => setTime(start)} disabled={time === start}>Now</button>
      </div>
      <input type="range" min={start} max={start + 7 * DAY} step={HOUR} value={time} onChange={(e) => setTime(Number(e.target.value))} aria-label="Forecast time" />
    </div>
  );
}

function WindArrow({ from, size = 18 }: { from: number; size?: number }) {
  // Arrow points the way the wind blows (downwind), i.e. where your scent goes.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${from + 180}deg)` }} aria-hidden>
      <path d="M12 2 L18 14 H13.5 V22 H10.5 V14 H6 Z" fill="currentColor" />
    </svg>
  );
}

export function ScoreBadge({ r }: { r: Rating | null }) {
  if (!r) return <span className="score none">—</span>;
  const cls = r.score >= 70 ? 'hi' : r.score >= 45 ? 'mid' : 'lo';
  return <span className={`score ${cls}`} title={r.closed ? 'Archery closed' : undefined}>{r.score}{r.closed ? '*' : ''}</span>;
}

function StandBoard({ stands, onStand, jumpTo }: {
  stands: UserFeature[];
  onStand: (f: UserFeature) => void;
  jumpTo: (d: Date, p: Period) => void;
}) {
  const [rows, setRows] = useState<Record<string, PeriodFit[][]>>({});
  const days = [0, 1, 2].map((i) => new Date(startOfDay(new Date()).getTime() + i * DAY + 12 * HOUR));
  const key = JSON.stringify(stands.map((s) => [s.id, s.geometry, s.properties.icon, s.properties.props]));
  useEffect(() => {
    let live = true;
    Promise.all(stands.map(async (s) => [s.id as string, await periodFits(s, days)] as const))
      .then((entries) => live && setRows(Object.fromEntries(entries)), (e) => console.warn('board', e));
    return () => void (live = false);
  }, [key]);
  if (!stands.length) return <p className="muted small">Drop a Tree stand or Ground blind pin and set its good winds to get a 3-day wind board.</p>;
  return (
    <table className="board">
      <thead>
        <tr><th />{days.map((d) => <th key={d.getDate()} colSpan={3}>{d.toLocaleDateString([], { weekday: 'short' })}</th>)}</tr>
        <tr><th />{days.flatMap((d) => ['AM', 'Mid', 'PM'].map((p) => <th key={`${d.getDate()}${p}`} className="small muted">{p}</th>))}</tr>
      </thead>
      <tbody>
        {stands.map((s) => (
          <tr key={s.id}>
            <th><button className="link" onClick={() => onStand(s)}>{s.properties.name || 'Stand'}</button></th>
            {(rows[s.id as string] ?? days.map(() => [null, null, null])).flatMap((periods, di) =>
              periods.map((pf, pi) => (
                <td key={`${di}${pi}`}>
                  <button
                    className={`fit ${pf?.level ?? 'none'}`}
                    title={pf ? `${pf.text}${pf.rating ? ` · rating ${pf.rating.score}` : ''}` : 'Loading…'}
                    onClick={() => { jumpTo(days[di], (['am', 'midday', 'pm'] as Period[])[pi]); onStand(s); }}
                  >{pf?.rating?.score ?? '…'}</button>
                </td>
              )))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function IntelPanel({ center, stands, onStand, time, setTime, sunShadows, setSunShadows }: {
  center: [number, number];
  stands: UserFeature[];
  onStand: (f: UserFeature) => void;
  time: number;
  setTime: (t: number) => void;
  sunShadows: boolean;
  setSunShadows: (on: boolean) => void;
}) {
  const [lng, lat] = center;
  const key = cellKey(lat, lng);
  const [c, setC] = useState<Conditions | null>(null);
  const [error, setError] = useState('');
  const [county, setCounty] = useState<string | null>(null);
  const [harvest, setHarvest] = useState<{ year: number; total: number; archery: number }[]>([]);

  useEffect(() => {
    let live = true;
    setError('');
    getConditions(lat, lng).then((x) => live && setC(x), (e) => live && setError(e.message));
    api.at(lng, lat).then((i) => live && setCounty(i.county), () => {});
    return () => void (live = false);
  }, [key]);

  useEffect(() => {
    if (!county) return setHarvest([]);
    fetch(`/api/weather/harvest?county=${encodeURIComponent(county)}`).then((r) => r.json()).then(setHarvest, () => {});
  }, [county]);

  const day = new Date(time);
  const sun = sunDay(day, lat, lng);
  const moon = moonDay(day, lat, lng);
  const pos = sunPosition(day, lat, lng);
  const phase = phaseOn(day);
  const portions = portionsOn(day);
  const h = c ? hourAt(c, time) : null;
  const h3 = c ? hourAt(c, time - 3 * HOUR) : null;
  const period = periodAt(time, lat, lng);
  const ratingNow = c ? rate(c, day, period, lat, lng) : null;
  const nwsPeriod = c?.periods.find((p, i) => new Date(p.start).getTime() <= time && (!c.periods[i + 1] || new Date(c.periods[i + 1].start).getTime() > time));
  const days = [0, 1, 2].map((i) => new Date(startOfDay(new Date()).getTime() + i * DAY + 12 * HOUR));
  const maxHarvest = Math.max(1, ...harvest.map((x) => x.total));

  const jumpTo = (d: Date, p: Period) => {
    const s = sunDay(d, lat, lng);
    if (!s) return;
    setTime(Math.floor((p === 'am' ? s.sunrise.getTime() : p === 'midday' ? s.sunrise.getTime() + 5 * HOUR : s.sunset.getTime() - HOUR) / HOUR) * HOUR);
  };

  return (
    <div className="intel">
      <h2>Intel <span className="muted small">at the crosshair · {key}</span></h2>
      <TimeSlider time={time} setTime={setTime} />
      {error && <p className="error">{error}</p>}
      {!c && !error && <p className="muted">Loading forecast…</p>}

      {h && (
        <div className="card now">
          <div className="big">{Math.round(h.temp)}°F</div>
          <div className="wind">
            <WindArrow from={h.windDir} size={26} />
            <div>
              <strong>{compass(h.windDir)} {Math.round(h.wind)} mph</strong>
              <div className="muted small">gust {Math.round(h.gust)} · scent goes {compass(h.windDir + 180)}</div>
            </div>
          </div>
          <dl>
            <dt>Sky</dt><dd>{sky(h.code)} · {h.cloud}% cloud</dd>
            <dt>Rain</dt><dd>{h.pop}% chance{h.precip > 0 ? ` · ${h.precip.toFixed(2)}″/h` : ''}</dd>
            <dt>Humidity</dt><dd>{h.rh}% · dew point {Math.round(h.dew)}°</dd>
            <dt>Pressure</dt><dd>{Math.round(h.pressure)} mb {h3 && `(${h.pressure - h3.pressure >= 0 ? '↑' : '↓'} ${Math.abs(h.pressure - h3.pressure).toFixed(1)} in 3 h)`}</dd>
          </dl>
          {nwsPeriod && <p className="small"><strong>NWS {nwsPeriod.name}:</strong> {nwsPeriod.detail}</p>}
        </div>
      )}

      {c?.alerts.map((a) => (
        <div key={a.headline} className="card alert">
          <strong>⚠️ {a.event}</strong>
          <p className="small">{a.headline}</p>
        </div>
      ))}

      {ratingNow && (
        <div className="card">
          <div className="row">
            <ScoreBadge r={ratingNow} />
            <div className="grow">
              <strong>{PERIOD_LABEL[period]} hunt rating</strong>
              <div className="muted small">{fmtTime(ratingNow.start)}–{fmtTime(ratingNow.end)}</div>
            </div>
          </div>
          <ul className="reasons">
            <li><span>{ratingNow.baseText}</span><span className="muted">base {ratingNow.base}</span></li>
            {ratingNow.reasons.map((r) => (
              <li key={r.text}><span>{r.text}</span><span className={r.effect > 0 ? 'up' : 'down'}>{pct(r.effect)}</span></li>
            ))}
            <li><span>Moon phase / solunar</span><span className="muted">0% (no measurable effect in GPS studies)</span></li>
          </ul>
        </div>
      )}

      {c && (
        <table className="days">
          <thead><tr><th /><th>High</th><th>AM</th><th>Mid</th><th>PM</th></tr></thead>
          <tbody>
            {days.map((d) => {
              const row = c.days.find((x) => Math.abs(x.t * 1000 - startOfDay(d).getTime()) < 2 * HOUR);
              return (
                <tr key={d.toDateString()}>
                  <th>{d.toLocaleDateString([], { weekday: 'short' })}</th>
                  <td>{row ? <>{Math.round(row.high)}° <span className="muted small">({row.high - row.normalHigh >= 0 ? '+' : ''}{Math.round(row.high - row.normalHigh)})</span></> : '—'}</td>
                  {(['am', 'midday', 'pm'] as Period[]).map((p) => (
                    <td key={p}><button className="cell" onClick={() => jumpTo(d, p)}><ScoreBadge r={rate(c, d, p, lat, lng)} /></button></td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="card">
        <h3>Stand wind board</h3>
        <StandBoard stands={stands} onStand={onStand} jumpTo={jumpTo} />
        <p className="muted small">Color = how well the wind at the stand (thermals included) matches its good winds. Number = hunt rating for that period.</p>
      </div>

      <div className="card">
        <h3>Season</h3>
        <strong>{phase.name}</strong>
        <p className="small">{phase.deer}</p>
        <p className="small"><strong>Where:</strong> {phase.where}</p>
        <p className="small">
          {portions.length ? portions.map((p) => p.name).join(' · ') : 'No deer season open'}
          {firearmsActive(day) && ' · 🟠 firearms hunters out: wear hunter orange'}
        </p>
      </div>

      <div className="card">
        <h3>Sun &amp; light</h3>
        {sun && (
          <dl>
            <dt>Legal light</dt><dd>{fmtTime(sun.legalStart)} – {fmtTime(sun.legalEnd)}</dd>
            <dt>Sun</dt><dd>rise {fmtTime(sun.sunrise)} · set {fmtTime(sun.sunset)}</dd>
            <dt>Now</dt><dd>{pos.altitude > 0 ? `az ${Math.round(pos.azimuth)}° · ${Math.round(pos.altitude)}° up` : 'below horizon'}</dd>
          </dl>
        )}
        <label className="row">
          <input type="checkbox" checked={sunShadows} onChange={(e) => setSunShadows(e.target.checked)} />
          <span className="grow">Light the hillshade from the sun at this time</span>
        </label>
        <h3>Moon</h3>
        <dl>
          <dt>Phase</dt><dd>{moon.name} · {Math.round(moon.illumination * 100)}%</dd>
          <dt>Rise/set</dt><dd>{fmtTime(moon.rise)} / {fmtTime(moon.set)}</dd>
          <dt>Solunar</dt><dd className="small">{moon.periods.map((p) => `${p.kind === 'major' ? 'Major' : 'Minor'} ${fmtTime(p.at)}`).join(' · ') || '—'}</dd>
        </dl>
        <p className="muted small">Shown for reference only: GPS-collar studies found no measurable moon effect on deer movement.</p>
      </div>

      {harvest.length > 0 && (
        <div className="card">
          <h3>{county} County deer harvest</h3>
          <div className="bars" role="img" aria-label="Deer harvest by year">
            {harvest.slice(-12).map((x) => (
              <div key={x.year} title={`${x.year}: ${x.total.toLocaleString()} total, ${x.archery.toLocaleString()} archery`}>
                <span style={{ height: `${(x.total / maxHarvest) * 100}%` }} />
                <span className="arch" style={{ height: `${(x.archery / maxHarvest) * 100}%` }} />
                <em>{String(x.year).slice(2)}</em>
              </div>
            ))}
          </div>
          <p className="small">
            {harvest.at(-1)!.year}: <strong>{harvest.at(-1)!.total.toLocaleString()}</strong> deer, {harvest.at(-1)!.archery.toLocaleString()} by archery. <span className="muted">MDC Telecheck</span>
          </p>
        </div>
      )}
    </div>
  );
}
