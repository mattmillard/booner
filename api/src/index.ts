import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { pool } from './db.ts';
import { auth } from './auth.ts';
import { features, folders } from './features.ts';
import { land } from './land.ts';
import { weather } from './weather.ts';
import { imagery, startPrefetch, tiles } from './tiles.ts';
import { journal } from './journal.ts';
import { hunts } from './hunts.ts';
import { cameras } from './cameras.ts';
import { brain } from './brain.ts';
import { groups } from './groups.ts';

const app = new Hono()
  .get('/health', async (c) => {
    await pool.query('SELECT 1');
    return c.json({ ok: true });
  })
  .route('/api/auth', auth)
  .route('/api/features', features)
  .route('/api/folders', folders)
  .route('/api/land', land)
  .route('/api/weather', weather)
  .route('/api/tiles', tiles)
  .route('/imagery', imagery)
  .route('/api/journal', journal)
  .route('/api/hunts', hunts)
  .route('/api/cameras', cameras)
  .route('/api/brain', brain)
  .route('/api/groups', groups);

// The built web app (web/dist), so one port serves everything: this PC and Tailscale Funnel alike.
app.use('/*', serveStatic({ root: '../web/dist' }));
app.get('*', serveStatic({ path: '../web/dist/index.html' }));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'server error' }, 500);
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`api on http://localhost:${port}`));
startPrefetch();
