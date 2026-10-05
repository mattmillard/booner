import { Hono } from 'hono';
import { pool } from './db.ts';
import { requireUser, type Env } from './auth.ts';

const GEOMETRY_FOR_KIND: Record<string, string> = {
  pin: 'Point',
  line: 'LineString',
  track: 'LineString',
  area: 'Polygon',
};

const EDITABLE = ['name', 'notes', 'icon', 'color', 'props', 'folder_id'] as const;

const SELECT = `SELECT id, num, folder_id, kind, icon, name, notes, color, props,
  ST_AsGeoJSON(geom)::json AS geometry, created_at, updated_at FROM features`;

function toFeature({ geometry, id, ...properties }: any) {
  return { type: 'Feature', id, geometry, properties: { id, ...properties } };
}

// Body: GeoJSON Feature. properties.kind required on create; everything else optional.
export const features = new Hono<Env>()
  .use(requireUser)
  .get('/', async (c) => {
    const { rows } = await pool.query(
      `${SELECT} WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at`,
      [c.get('userId')],
    );
    return c.json({ type: 'FeatureCollection', features: rows.map(toFeature) });
  })
  .post('/', async (c) => {
    const { id, geometry, properties: p = {} } = await c.req.json();
    if (GEOMETRY_FOR_KIND[p.kind] !== geometry?.type)
      return c.json({ error: 'kind must be pin|line|track|area with a matching geometry' }, 400);
    const { rows } = await pool.query(
      `INSERT INTO features (id, user_id, num, folder_id, kind, icon, name, notes, color, props, geom)
       VALUES (coalesce($1::uuid, gen_random_uuid()), $2, (SELECT coalesce(max(num), 0) + 1 FROM features WHERE user_id = $2),
               $3, $4, $5, coalesce($6, ''), coalesce($7, ''), $8, coalesce($9::jsonb, '{}'), ST_SetSRID(ST_GeomFromGeoJSON($10), 4326))
       RETURNING id`,
      [id ?? null, c.get('userId'), p.folder_id ?? null, p.kind, p.icon ?? null, p.name, p.notes,
       p.color ?? null, p.props ? JSON.stringify(p.props) : null, JSON.stringify(geometry)],
    );
    const created = await pool.query(`${SELECT} WHERE id = $1`, [rows[0].id]);
    return c.json(toFeature(created.rows[0]), 201);
  })
  .patch('/:id', async (c) => {
    const { geometry, properties: p = {} } = await c.req.json();
    const sets: string[] = [];
    const values: unknown[] = [c.req.param('id'), c.get('userId')];
    for (const col of EDITABLE) {
      if (!(col in p)) continue;
      values.push(col === 'props' ? JSON.stringify(p[col]) : p[col]);
      sets.push(`${col} = $${values.length}`);
    }
    if (geometry) {
      values.push(JSON.stringify(geometry));
      sets.push(`geom = ST_SetSRID(ST_GeomFromGeoJSON($${values.length}), 4326)`);
    }
    if (!sets.length) return c.json({ error: 'nothing to update' }, 400);
    const { rowCount } = await pool.query(
      `UPDATE features SET ${sets.join(', ')}, updated_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      values,
    );
    if (!rowCount) return c.json({ error: 'not found' }, 404);
    const updated = await pool.query(`${SELECT} WHERE id = $1`, [c.req.param('id')]);
    return c.json(toFeature(updated.rows[0]));
  })
  .delete('/:id', async (c) => {
    const { rowCount } = await pool.query(
      `UPDATE features SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [c.req.param('id'), c.get('userId')],
    );
    return rowCount ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  });

export const folders = new Hono<Env>()
  .use(requireUser)
  .get('/', async (c) => {
    const { rows } = await pool.query(
      'SELECT id, name, color FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name',
      [c.get('userId')],
    );
    return c.json(rows);
  })
  .post('/', async (c) => {
    const { name, color } = await c.req.json();
    if (typeof name !== 'string' || !name.trim()) return c.json({ error: 'name required' }, 400);
    const { rows } = await pool.query(
      'INSERT INTO folders (user_id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color',
      [c.get('userId'), name.trim(), color ?? null],
    );
    return c.json(rows[0], 201);
  })
  .delete('/:id', async (c) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rowCount } = await client.query(
        `UPDATE folders SET deleted_at = now(), updated_at = now()
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [c.req.param('id'), c.get('userId')],
      );
      await client.query(
        'UPDATE features SET folder_id = NULL, updated_at = now() WHERE folder_id = $1 AND user_id = $2',
        [c.req.param('id'), c.get('userId')],
      );
      await client.query('COMMIT');
      return rowCount ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });
