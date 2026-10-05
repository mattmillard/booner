// The analyst: Claude reads the hunter's journal, field notes and tagged trail-camera visits (each with the weather,
// moon and sun the app looked up) plus the brain knowledge files, and proposes patterns, rules, spots and questions.
// It runs the Claude Code CLI installed on this PC under his own login (no API key; the app is local and his alone).
import { spawn } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';

const MODEL = process.env.BRAIN_MODEL; // optional --model override; default is his Claude Code default
const CLAUDE = process.env.CLAUDE_BIN
  ?? (process.env.APPDATA ? join(process.env.APPDATA, 'npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe') : 'claude');

// claude -p with no tools: one structured answer, nothing executed, no session saved.
function runClaude(system: string, prompt: string, schema: object): Promise<{ structured_output?: unknown; is_error?: boolean; result?: string }> {
  return new Promise(async (resolve, reject) => {
    const sysFile = join(tmpdir(), `hunt-brain-${process.pid}-${Date.now()}.md`);
    await writeFile(sysFile, system);
    const args = ['-p', '--output-format', 'json', '--tools', '', '--no-session-persistence',
      '--system-prompt-file', sysFile, '--json-schema', JSON.stringify(schema), ...(MODEL ? ['--model', MODEL] : [])];
    const child = spawn(CLAUDE, args, { cwd: tmpdir(), windowsHide: true });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => { rm(sysFile, { force: true }); reject(new Error(`Couldn't start Claude Code (${CLAUDE}): ${e.message}`)); });
    child.on('close', (code) => {
      rm(sysFile, { force: true });
      try { resolve(JSON.parse(out)); } catch { reject(new Error(`Claude Code exited ${code}: ${(err || out).trim().slice(0, 500)}`)); }
    });
    child.stdin.end(prompt);
  });
}

let available: Promise<boolean> | null = null;
const claudeAvailable = () => (available ??= new Promise((ok) => {
  const p = spawn(CLAUDE, ['--version'], { windowsHide: true });
  p.on('error', () => ok(false));
  p.on('close', (code) => ok(code === 0));
}));
const DOCS = new URL('../../docs/brain/', import.meta.url);

const ROLE = `You are the hunting brain for one Missouri bowhunter: a whitetail analyst who thinks like the best
pressured-deer bowhunters (Eberhart, Infalt, public-land hunters) and like a field scientist. You study his own
sightings, kills, sits and stories — each with the weather, fronts, temperature swings, moon, sun timing, thermal state,
terrain and model values at that exact time and place — to find what puts mature bucks on their feet in daylight on
HIS ground, and where. His field record outranks book rules once it repeats; say plainly when the data is too thin.
Every finding needs a mechanism (why a mature buck would be there then) and honest evidence counts. Prefer insights he
can act on: a proven spot with the conditions that make it fire, a rule the planner can apply, or the next question to
ask him. Lng/lat you give for spots must come from his observations or marked pins (or lie within ~300 yd of them).
His map pins are private notes and are NOT evidence. You only see pins he explicitly marked as knowledge
("#133 is a real bedding area"); use exactly what he said about each, nothing more.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'patterns', 'rules', 'spots', 'questions'],
  properties: {
    summary: { type: 'string', description: 'What the journal says so far, in plain language (markdown ok).' },
    patterns: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'finding', 'mechanism', 'evidence', 'confidence'],
        properties: {
          title: { type: 'string' }, finding: { type: 'string' }, mechanism: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' }, description: 'observation ids' },
          confidence: { type: 'number', description: '0–1' },
        },
      },
    },
    rules: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'rule', 'when', 'evidence', 'confidence'],
        properties: {
          title: { type: 'string' }, rule: { type: 'string' },
          when: { type: 'string', description: 'conditions the rule applies under (phase, wind, time, temp swing…)' },
          evidence: { type: 'array', items: { type: 'string' } }, confidence: { type: 'number' },
        },
      },
    },
    spots: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'lng', 'lat', 'radius_yd', 'why', 'best_conditions', 'evidence', 'confidence'],
        properties: {
          title: { type: 'string' }, lng: { type: 'number' }, lat: { type: 'number' }, radius_yd: { type: 'number' },
          why: { type: 'string' }, best_conditions: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } }, confidence: { type: 'number' },
        },
      },
    },
    questions: { type: 'array', items: { type: 'string' }, description: 'what to ask him or log next time' },
  },
} as const;

type Result = {
  summary: string;
  patterns: { title: string; finding: string; mechanism: string; evidence: string[]; confidence: number }[];
  rules: { title: string; rule: string; when: string; evidence: string[]; confidence: number }[];
  spots: { title: string; lng: number; lat: number; radius_yd: number; why: string; best_conditions: string; evidence: string[]; confidence: number }[];
  questions: string[];
};

export const brain = new Hono<Env>()
  .use(requireUser)
  .get('/status', async (c) => c.json({ enabled: await claudeAvailable() }))
  .get('/insights', async (c) => {
    const { rows } = await pool.query(
      `SELECT id, kind, title, body, evidence, confidence, status, data, ST_X(geom) AS lng, ST_Y(geom) AS lat, created_at
       FROM brain_insights WHERE user_id = $1 AND status <> 'rejected' ORDER BY created_at DESC`,
      [c.get('userId')],
    );
    return c.json(rows);
  })
  .patch('/insights/:id', async (c) => {
    const { status } = await c.req.json();
    if (!['proposed', 'accepted', 'rejected'].includes(status)) return c.json({ error: 'bad status' }, 400);
    const { rowCount } = await pool.query('UPDATE brain_insights SET status = $3 WHERE id = $1 AND user_id = $2',
      [c.req.param('id'), c.get('userId'), status]);
    return rowCount ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  })
  .post('/analyze', async (c) => {
    if (!(await claudeAvailable())) return c.json({ error: `Claude Code isn't installed where the app looks (${CLAUDE}). Set CLAUDE_BIN in .env.` }, 503);
    const { question } = await c.req.json().catch(() => ({}));
    const userId = c.get('userId');
    const [obs, known, knowledge, field, marked, sits, photos] = await Promise.all([
      pool.query(
        `SELECT id, kind, observed_at, round(ST_X(geom)::numeric, 5) AS lng, round(ST_Y(geom)::numeric, 5) AS lat,
                buck, deer_count, behavior, travel_dir, notes, conditions
         FROM observations WHERE user_id = $1 AND deleted_at IS NULL ORDER BY observed_at LIMIT 400`, [userId]),
      pool.query(`SELECT kind, title, status FROM brain_insights WHERE user_id = $1`, [userId]),
      readFile(new URL('knowledge.md', DOCS), 'utf8'),
      readFile(new URL('field-knowledge.md', DOCS), 'utf8'),
      // Only pins he marked as knowledge (field-knowledge L6), plus his Harvest pins (trophy kills with score/age, which
      // he enters for exactly this); every other pin stays private.
      pool.query(
        `SELECT num, name, icon, notes, props->'knowledge' AS knowledge, props->'harvest' AS harvest,
                round(ST_X(ST_PointOnSurface(geom))::numeric, 5) AS lng, round(ST_Y(ST_PointOnSurface(geom))::numeric, 5) AS lat
         FROM features WHERE user_id = $1 AND deleted_at IS NULL AND (props ? 'knowledge' OR icon = 'harvest') ORDER BY num`, [userId]),
      // Field notes: in-stand wind vs the model's, sightings by time, and his verdict on the stand.
      pool.query(
        `SELECT h.id, f.num AS stand, h.started_at, h.ended_at, round(ST_X(h.geom)::numeric, 5) AS lng, round(ST_Y(h.geom)::numeric, 5) AS lat,
                h.wind_note, h.pressure, h.sightings, h.activity, h.stand_verdict, h.move, h.notes, h.conditions - 'forecastWind' AS conditions
         FROM hunts h LEFT JOIN features f ON f.id = h.stand_id
         WHERE h.user_id = $1 AND h.deleted_at IS NULL ORDER BY h.started_at LIMIT 300`, [userId]),
      // Tagged trail-camera photos with deer (he tagged them; empty triggers left out).
      pool.query(
        `SELECT f.num AS camera, p.camera_id, p.taken_at, p.tag, p.deer_count, p.mature, p.note,
                p.conditions->'weather' AS weather, p.conditions->'astro' AS astro, p.conditions->>'rutPhase' AS rut
         FROM camera_photos p JOIN features f ON f.id = p.camera_id
         WHERE p.user_id = $1 AND p.tag IN ('doe', 'buck', 'target buck') ORDER BY p.camera_id, p.taken_at`, [userId]),
    ]);
    if (!obs.rows.length && !sits.rows.length && !photos.rows.length)
      return c.json({ error: 'Log some hunts in Field Notes, tag some trail-camera photos, or add journal entries first.' }, 400);

    const journal = obs.rows.map((o) => JSON.stringify({ ...o, observed_at: new Date(o.observed_at).toLocaleString('en-US', { timeZone: 'America/Chicago' }) })).join('\n');
    const local = (t: string | null) => t && new Date(t).toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const fieldNotes = sits.rows.map((h) => JSON.stringify({ ...h, stand: h.stand ? `#${h.stand}` : null, started_at: local(h.started_at), ended_at: local(h.ended_at) })).join('\n') || '(none)';
    const pins = marked.rows.map((p) => JSON.stringify({ pin: `#${p.num}`, ...p, num: undefined })).join('\n') || '(none marked)';
    // One line per camera visit (a trigger burst within 5 minutes), not per photo.
    const visits: any[] = [];
    for (const p of photos.rows) {
      const last = visits[visits.length - 1];
      if (last && last.camera_id === p.camera_id && new Date(p.taken_at).getTime() - last.t <= 5 * 60_000) { last.t = new Date(p.taken_at).getTime(); continue; }
      visits.push({ ...p, t: new Date(p.taken_at).getTime() });
    }
    const camera = visits.map(({ camera_id, t, ...v }) => JSON.stringify({ ...v, camera: `#${v.camera}`, taken_at: local(v.taken_at) })).join('\n') || '(none)';
    const prior = known.rows.map((k) => `- [${k.status}] ${k.kind}: ${k.title}`).join('\n') || '(none yet)';
    const system = `${ROLE}\n\n# Standing knowledge\n\n${knowledge}\n\n# This hunter's field knowledge\n\n${field}\n\n` +
      'Answer only with the JSON object the schema asks for.';
    const prompt = `Journal (${obs.rows.length} entries, one JSON per line; times are Central):\n${journal}\n\n` +
      `Field notes (${sits.rows.length} hunts in his words; conditions = the weather the app looked up for that sit, pressure = other hunters he saw):\n${fieldNotes}\n\n` +
      `Trail-camera visits with deer (${visits.length}; camera = his camera pin; weather/astro = looked up for that moment):\n${camera}\n\n` +
      `Pins he marked as knowledge (his words), plus his Harvest pins (trophy bucks he killed, 130"+ P&Y, with score in inches and age when entered). All other pins are private and not shown:\n${pins}\n\n` +
      `Insights already on file (don't repeat rejected ones; build on accepted ones):\n${prior}\n\n` +
      (question ? `The hunter asks: ${question}\n` : 'Analyze all of it.');
    try {
      const out = await runClaude(system, prompt, SCHEMA);
      if (out.is_error || !out.structured_output) return c.json({ error: `The analyst returned no result: ${(out.result ?? '').slice(0, 300)}` }, 502);
      const r = out.structured_output as Result;

      const clamp01 = (v: number) => Math.min(1, Math.max(0, Number(v) || 0));
      const rows: [string, string, string, string[], number, object, number | null, number | null][] = [
        ...r.patterns.map((p) => ['pattern', p.title, `${p.finding}\n\nWhy: ${p.mechanism}`, p.evidence, p.confidence, {}, null, null] as const),
        ...r.rules.map((p) => ['rule', p.title, `${p.rule}\n\nWhen: ${p.when}`, p.evidence, p.confidence, { when: p.when }, null, null] as const),
        ...r.spots.map((p) => ['spot', p.title, `${p.why}\n\nBest: ${p.best_conditions}`, p.evidence, p.confidence,
          { radius_yd: p.radius_yd, best_conditions: p.best_conditions }, p.lng, p.lat] as const),
        ...r.questions.map((q) => ['question', q, q, [], 0.5, {}, null, null] as const),
      ].map((x) => [...x] as any);
      for (const [kind, title, body, evidence, conf, data, lng, lat] of rows)
        await pool.query(
          `INSERT INTO brain_insights (user_id, kind, title, body, evidence, confidence, data, geom)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $8::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_Point($8, $9), 4326) END)`,
          [userId, kind, title, body, JSON.stringify(evidence ?? []), clamp01(conf), JSON.stringify(data), lng, lat],
        );
      return c.json(r);
    } catch (e) {
      return c.json({ error: (e as Error).message }, 502);
    }
  });
