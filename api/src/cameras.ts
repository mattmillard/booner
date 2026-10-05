// Trail-camera photos: import (resized in the browser), tag, and look up the weather for each one.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';
import { enrich } from './journal.ts';
import { DATA_DIR } from './tiles.ts';

const PHOTOS = new URL('photos/', DATA_DIR);
const TAGS = ['empty', 'doe', 'buck', 'target buck', 'other'];
const SELECT = `SELECT id, camera_id, taken_at, time_source, orig_name, width, height, tag, deer_count, mature, note, conditions
  FROM camera_photos`;

export const cameras = new Hono<Env>()
  .use(requireUser)
  // Photo counts per camera pin.
  .get('/', async (c) => {
    const { rows } = await pool.query(
      `SELECT camera_id, count(*)::int AS photos, count(*) FILTER (WHERE tag IS NULL)::int AS untagged,
              count(*) FILTER (WHERE tag IN ('buck', 'target buck'))::int AS bucks, max(taken_at) AS last
       FROM camera_photos WHERE user_id = $1 GROUP BY camera_id`, [c.get('userId')]);
    return c.json(rows);
  })
  .get('/:camera/photos', async (c) => {
    const { rows } = await pool.query(`${SELECT} WHERE user_id = $1 AND camera_id = $2 ORDER BY taken_at DESC`, [c.get('userId'), c.req.param('camera')]);
    return c.json(rows);
  })
  // Multipart: photo (resized jpeg), thumb (jpeg), taken_at (ISO), time_source, name, width, height.
  .post('/:camera/photos', async (c) => {
    const userId = c.get('userId');
    const cam = await pool.query(
      `SELECT ST_X(geom) AS lng, ST_Y(geom) AS lat FROM features WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL AND kind = 'pin'`,
      [c.req.param('camera'), userId]);
    if (!cam.rows[0]) return c.json({ error: 'camera pin not found' }, 404);
    const b = await c.req.parseBody();
    const t = new Date(String(b.taken_at));
    if (!(b.photo instanceof File) || !(b.thumb instanceof File) || Number.isNaN(t.getTime()) || !b.name)
      return c.json({ error: 'photo, thumb, taken_at, name required' }, 400);
    const { rows } = await pool.query(
      `INSERT INTO camera_photos (user_id, camera_id, taken_at, time_source, orig_name, width, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (camera_id, orig_name, taken_at) DO NOTHING RETURNING id`,
      [userId, c.req.param('camera'), t, b.time_source === 'file' ? 'file' : 'exif', String(b.name), Number(b.width) || null, Number(b.height) || null]);
    if (!rows[0]) return c.json({ duplicate: true });
    const id = rows[0].id;
    await mkdir(PHOTOS, { recursive: true });
    await writeFile(new URL(`${id}.jpg`, PHOTOS), Buffer.from(await b.photo.arrayBuffer()));
    await writeFile(new URL(`${id}_t.jpg`, PHOTOS), Buffer.from(await b.thumb.arrayBuffer()));
    const conditions = await enrich(cam.rows[0].lat, cam.rows[0].lng, t).catch((e) => ({ error: (e as Error).message }));
    await pool.query('UPDATE camera_photos SET conditions = $2 WHERE id = $1', [id, JSON.stringify(conditions)]);
    return c.json({ id }, 201);
  })
  // Tag a whole trigger burst at once.
  .patch('/photos/tag', async (c) => {
    const { ids, tag, deer_count, mature, note } = await c.req.json();
    if (!Array.isArray(ids) || !ids.length || (tag != null && !TAGS.includes(tag))) return c.json({ error: 'ids and a valid tag required' }, 400);
    await pool.query(
      `UPDATE camera_photos SET tag = $3, deer_count = $4, mature = $5, note = coalesce($6, note) WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [c.get('userId'), ids, tag ?? null, deer_count ?? null, mature ?? null, note ?? null]);
    return c.json({ ok: true });
  })
  .get('/photos/:file{[0-9a-f_t-]+\\.jpg}', async (c) => {
    const id = c.req.param('file').slice(0, 36);
    const own = await pool.query('SELECT 1 FROM camera_photos WHERE id = $1 AND user_id = $2', [id, c.get('userId')]);
    if (!own.rows[0]) return c.json({ error: 'not found' }, 404);
    const buf = await readFile(new URL(c.req.param('file'), PHOTOS)).catch(() => null);
    return buf ? c.body(buf, 200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' }) : c.json({ error: 'missing file' }, 404);
  })
  .delete('/photos', async (c) => {
    const { ids } = await c.req.json();
    if (!Array.isArray(ids) || !ids.length) return c.json({ error: 'ids required' }, 400);
    const { rows } = await pool.query('DELETE FROM camera_photos WHERE user_id = $1 AND id = ANY($2::uuid[]) RETURNING id', [c.get('userId'), ids]);
    await Promise.all(rows.flatMap((r) => [rm(new URL(`${r.id}.jpg`, PHOTOS), { force: true }), rm(new URL(`${r.id}_t.jpg`, PHOTOS), { force: true })]));
    return c.json({ deleted: rows.length });
  });
