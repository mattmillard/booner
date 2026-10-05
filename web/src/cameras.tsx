// Trail cameras: import an SD card's photos onto the camera pin they came from, tag each trigger, and see in plain
// words when the bucks show up (daylight, temperature drops, moon). The server looks up the weather for every photo.
import { useEffect, useMemo, useState } from 'react';
import exifr from 'exifr';
import type { UserFeature } from './api';

type Photo = {
  id: string; camera_id: string; taken_at: string; time_source: 'exif' | 'file'; orig_name: string;
  tag: Tag | null; deer_count: number | null; mature: boolean | null; note: string; conditions: any;
};
type Tag = 'empty' | 'doe' | 'buck' | 'target buck' | 'other';
type Counts = { camera_id: string; photos: number; untagged: number; bucks: number; last: string };

const TAGS: [Tag, string][] = [['empty', 'Nothing'], ['doe', 'Doe / fawns'], ['buck', 'Buck'], ['target buck', 'Target buck'], ['other', 'Other']];
const BURST_MS = 5 * 60_000; // photos within 5 min of each other are one visit
const src = (id: string, thumb = false) => `/api/cameras/photos/${id}${thumb ? '_t' : ''}.jpg`;
const when = (t: string) => new Date(t).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

async function call(method: string, path: string, body?: unknown) {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error ?? r.statusText);
  return data;
}

async function jpeg(bmp: ImageBitmap, max: number, quality: number) {
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise<Blob>((ok) => c.toBlob((b) => ok(b!), 'image/jpeg', quality));
}

// Resize in the browser (SD-card originals are 5–30 MB) and send with the capture time from EXIF.
async function upload(camera: string, file: File) {
  const exif = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']).catch(() => null);
  const t: Date | undefined = exif?.DateTimeOriginal ?? exif?.CreateDate;
  const bmp = await createImageBitmap(file);
  const form = new FormData();
  form.set('photo', await jpeg(bmp, 1600, 0.82), 'photo.jpg');
  form.set('thumb', await jpeg(bmp, 360, 0.7), 'thumb.jpg');
  form.set('taken_at', (t instanceof Date ? t : new Date(file.lastModified)).toISOString());
  form.set('time_source', t instanceof Date ? 'exif' : 'file');
  form.set('name', file.name);
  form.set('width', String(bmp.width));
  form.set('height', String(bmp.height));
  bmp.close();
  const r = await fetch(`/api/cameras/${camera}/photos`, { method: 'POST', body: form });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error ?? r.statusText);
  return data as { id?: string; duplicate?: boolean };
}

function visits(photos: Photo[]) {
  const asc = [...photos].sort((a, b) => a.taken_at.localeCompare(b.taken_at));
  const out: Photo[][] = [];
  for (const p of asc) {
    const last = out[out.length - 1];
    if (last && new Date(p.taken_at).getTime() - new Date(last[last.length - 1].taken_at).getTime() <= BURST_MS) last.push(p);
    else out.push([p]);
  }
  return out.reverse(); // newest first
}

// Plain-language read of this camera's buck visits.
function story(vs: Photo[][]) {
  const tagged = vs.filter((v) => v[0].tag);
  const deer = tagged.filter((v) => ['doe', 'buck', 'target buck'].includes(v[0].tag!));
  const bucks = tagged.filter((v) => v[0].tag === 'buck' || v[0].tag === 'target buck');
  const target = bucks.filter((v) => v[0].tag === 'target buck');
  if (!tagged.length) return ['Tag some visits and this will start to show when the deer come through.'];
  const out = [`${tagged.length} tagged visit${tagged.length === 1 ? '' : 's'}: ${deer.length} with deer, ${bucks.length} with a buck${target.length ? ` (${target.length} your target buck)` : ''}.`];
  if (!bucks.length) return out;
  const light = bucks.filter((v) => (v[0].conditions.astro?.sunAlt ?? -90) > -6).length;
  out.push(`${light} of ${bucks.length} buck visits were in shooting light${light ? '' : ': so far he moves after dark here'}.`);
  const withT = bucks.filter((v) => v[0].conditions.weather?.tempChange24hF != null);
  const cooler = withT.filter((v) => v[0].conditions.weather.tempChange24hF <= -5).length;
  const allT = vs.filter((v) => v[0].conditions.weather?.tempChange24hF != null);
  const baseline = allT.length ? allT.filter((v) => v[0].conditions.weather.tempChange24hF <= -5).length / allT.length : 0;
  if (withT.length >= 3) out.push(`${cooler} of ${withT.length} buck visits came when it was 5° or more cooler than the day before (${Math.round(baseline * 100)}% of all visits were).`);
  const hours = bucks.map((v) => new Date(v[0].taken_at).getHours());
  const top = Object.entries(hours.reduce<Record<number, number>>((m, h) => ({ ...m, [h]: (m[h] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0];
  if (top && Number(top[1]) >= 2) out.push(`Most common buck hour: ${new Date(2000, 0, 1, Number(top[0])).toLocaleTimeString([], { hour: 'numeric' })} (${top[1]} visits).`);
  return out;
}

export function CamerasPanel({ features, camera, setCamera, onFocus }: {
  features: UserFeature[]; camera: string | null; setCamera: (id: string | null) => void; onFocus: (f: UserFeature) => void;
}) {
  const cams = features.filter((f) => f.geometry.type === 'Point' && f.properties.icon === 'camera').sort((a, b) => a.properties.num - b.properties.num);
  const [counts, setCounts] = useState<Counts[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filter, setFilter] = useState<'all' | 'untagged' | 'deer' | 'bucks'>('all');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState<{ v: number; p: number } | null>(null);
  const cam = cams.find((c) => c.id === camera) ?? null;

  const refreshCounts = () => call('GET', '/api/cameras').then(setCounts, () => {});
  useEffect(() => { refreshCounts(); }, []);
  useEffect(() => {
    setPhotos([]);
    setOpen(null);
    if (camera) call('GET', `/api/cameras/${camera}/photos`).then(setPhotos, (e) => setError(e.message));
  }, [camera]);

  const all = useMemo(() => visits(photos), [photos]);
  const shown = all.filter((v) => filter === 'all' || (filter === 'untagged' ? !v[0].tag
    : filter === 'deer' ? ['doe', 'buck', 'target buck'].includes(v[0].tag ?? '') : v[0].tag === 'buck' || v[0].tag === 'target buck'));

  async function importFiles(files: FileList | null) {
    if (!files || !camera) return;
    const list = [...files].filter((f) => /\.jpe?g$/i.test(f.name));
    if (!list.length) return setError('No JPEG photos in that selection.');
    setError('');
    let done = 0, dup = 0, failed = 0;
    const queue = [...list];
    const work = async () => {
      for (let f = queue.shift(); f; f = queue.shift()) {
        try { if ((await upload(camera, f)).duplicate) dup++; } catch { failed++; }
        done++;
        setBusy(`Importing ${done} of ${list.length}…`);
      }
    };
    setBusy(`Importing 0 of ${list.length}…`);
    await Promise.all([work(), work(), work()]);
    setBusy('');
    setError(failed ? `${failed} photo${failed === 1 ? '' : 's'} failed to import.` : '');
    if (dup) setError((e) => `${e} ${dup} already imported, skipped.`.trim());
    setPhotos(await call('GET', `/api/cameras/${camera}/photos`));
    refreshCounts();
  }

  async function tag(v: Photo[], t: Tag) {
    await call('PATCH', '/api/cameras/photos/tag', { ids: v.map((p) => p.id), tag: t });
    const ids = new Set(v.map((p) => p.id));
    setPhotos((cur) => cur.map((p) => (ids.has(p.id) ? { ...p, tag: t } : p)));
    refreshCounts();
    // Jump to the next untagged visit so a whole card goes fast.
    const i = shown.indexOf(v);
    const next = shown.findIndex((x, j) => j > i && !x[0].tag);
    setOpen(next >= 0 ? { v: next, p: 0 } : null);
  }

  async function removeVisit(v: Photo[]) {
    if (!confirm(`Delete ${v.length} photo${v.length === 1 ? '' : 's'} from this visit?`)) return;
    await call('DELETE', '/api/cameras/photos', { ids: v.map((p) => p.id) });
    const ids = new Set(v.map((p) => p.id));
    setPhotos((cur) => cur.filter((p) => !ids.has(p.id)));
    setOpen(null);
    refreshCounts();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const v = shown[open.v];
      if (!v) return;
      if (e.key === 'Escape') setOpen(null);
      else if (e.key === 'ArrowRight') setOpen({ v: open.v, p: Math.min(v.length - 1, open.p + 1) });
      else if (e.key === 'ArrowLeft') setOpen({ v: open.v, p: Math.max(0, open.p - 1) });
      else if (e.key === 'ArrowDown') setOpen({ v: Math.min(shown.length - 1, open.v + 1), p: 0 });
      else if (e.key === 'ArrowUp') setOpen({ v: Math.max(0, open.v - 1), p: 0 });
      else if (/^[1-5]$/.test(e.key)) tag(v, TAGS[Number(e.key) - 1][0]);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!cam) {
    return (
      <div className="journal cameras">
        <h2>📷 Trail cameras</h2>
        <p className="muted small">Your camera pins. Pick one to import its SD card and tag the photos. Drop a 📷 pin first for a new camera.</p>
        {!cams.length && <p className="muted">No camera pins yet.</p>}
        {cams.map((c) => {
          const n = counts.find((x) => x.camera_id === c.id);
          return (
            <button key={c.id} className="card camrow" onClick={() => setCamera(c.id as string)}>
              <strong>#{c.properties.num} {c.properties.name || 'Camera'}</strong>
              <span className="muted small">{n ? `${n.photos} photos · ${n.bucks} buck · ${n.untagged} to tag · last ${new Date(n.last).toLocaleDateString()}` : 'No photos yet'}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const cur = open && shown[open.v] ? shown[open.v][open.p] : null;
  const curVisit = open ? shown[open.v] : null;
  return (
    <div className="journal cameras">
      <div className="row">
        <button className="link" onClick={() => setCamera(null)}>← Cameras</button>
        <h2 className="grow">#{cam.properties.num} {cam.properties.name || 'Camera'}</h2>
        <button onClick={() => onFocus(cam)}>Show</button>
      </div>
      <div className="row wrap">
        <label className="button primary">Import photos<input type="file" accept="image/jpeg" multiple hidden onChange={(e) => { importFiles(e.target.files); e.target.value = ''; }} /></label>
        {/* @ts-expect-error webkitdirectory is non-standard but supported by every desktop browser */}
        <label className="button">Import a folder<input type="file" webkitdirectory="" multiple hidden onChange={(e) => { importFiles(e.target.files); e.target.value = ''; }} /></label>
      </div>
      {busy && <p className="muted small">{busy}</p>}
      {error && <p className="error">{error}</p>}
      <div className="card">{story(all).map((s, i) => <p key={i} className="small">{s}</p>)}</div>
      <div className="row wrap">
        {(['all', 'untagged', 'deer', 'bucks'] as const).map((f) => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      <p className="muted small">{shown.length} visit{shown.length === 1 ? "" : "s"} · tap one to tag it (keys 1–5, arrows to move)</p>
      <div className="thumbs">
        {shown.map((v, i) => (
          <button key={v[0].id} className={`thumb ${v[0].tag ? `tag-${v[0].tag.replace(' ', '-')}` : ''}`} onClick={() => setOpen({ v: i, p: 0 })}>
            <img src={src(v[0].id, true)} loading="lazy" alt="" />
            <span>{when(v[0].taken_at)}{v.length > 1 ? ` · ${v.length}` : ''}{v[0].tag ? ` · ${v[0].tag}` : ''}</span>
          </button>
        ))}
      </div>

      {cur && curVisit && (
        <div className="viewer" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="viewer-box">
            <img src={src(cur.id)} alt="" />
            <div className="row wrap">
              <strong className="grow">{when(cur.taken_at)}{cur.time_source === 'file' ? ' (time from file, check it)' : ''} · photo {open!.p + 1} of {curVisit.length}</strong>
              <button onClick={() => setOpen({ v: open!.v, p: Math.max(0, open!.p - 1) })}>‹</button>
              <button onClick={() => setOpen({ v: open!.v, p: Math.min(curVisit.length - 1, open!.p + 1) })}>›</button>
              <button onClick={() => setOpen(null)}>✕</button>
            </div>
            {cur.conditions.weather && (
              <p className="small muted">
                {cur.conditions.weather.tempF}°F{Math.abs(cur.conditions.weather.tempChange24hF) >= 4 ? `, ${Math.abs(cur.conditions.weather.tempChange24hF)}° ${cur.conditions.weather.tempChange24hF < 0 ? 'cooler' : 'warmer'} than the day before` : ''}
                {cur.conditions.weather.front ? ` · ${cur.conditions.weather.front}` : ''} · {cur.conditions.astro?.moonPhase} moon · {cur.conditions.rutPhase}
              </p>
            )}
            <div className="row wrap">
              {TAGS.map(([t, l], i) => <button key={t} className={curVisit[0].tag === t ? 'active' : ''} onClick={() => tag(curVisit, t)}>{i + 1} {l}</button>)}
              <button className="link danger" onClick={() => removeVisit(curVisit)}>Delete visit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
