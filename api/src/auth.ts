import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { pool } from './db.ts';

export type Env = { Variables: { userId: number } };

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = 'sid';
const SESSION_DAYS = 30;
const MIN_PASSWORD = 10;

async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

async function verifyPassword(pw: string, stored: string) {
  const [, salt, key] = stored.split('$');
  const expected = Buffer.from(key, 'base64');
  const actual = await scryptAsync(pw, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Reached on this PC (localhost) vs. from the internet through a public HTTPS tunnel.
export const isLocal = (c: Context) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(c.req.header('host') ?? '');

// Login throttle for the internet side: 8 tries per address per 15 minutes.
const tries = new Map<string, { n: number; t: number }>();
function throttled(c: Context) {
  if (isLocal(c)) return false;
  const ip = (c.req.header('x-forwarded-for') ?? 'remote').split(',')[0].trim();
  const now = Date.now(), e = tries.get(ip);
  if (!e || now - e.t > 15 * 60_000) { tries.set(ip, { n: 1, t: now }); return false; }
  e.n++;
  return e.n > 8;
}

// Compared against when the username is unknown, so login timing doesn't reveal which accounts exist.
const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'));

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function startSession(c: Context, userId: number) {
  const token = randomBytes(32).toString('base64url');
  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [sha256(token), userId, SESSION_DAYS],
  );
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: !isLocal(c),   // HTTPS through Funnel; plain http on this PC
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
}

// Public data (imagery) is open on this PC; from the internet it needs a login so nobody uses the PC as a proxy.
export const localOrUser: MiddlewareHandler<Env> = async (c, next) => (isLocal(c) ? next() : requireUser(c, next));

export const requireUser: MiddlewareHandler<Env> = async (c, next) => {
  const token = getCookie(c, COOKIE);
  if (token) {
    const { rows } = await pool.query(
      'SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()',
      [sha256(token)],
    );
    if (rows[0]) {
      c.set('userId', Number(rows[0].user_id));
      return next();
    }
  }
  return c.json({ error: 'unauthorized' }, 401);
};

function credentials(body: any) {
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  return { username, email, password };
}

export const auth = new Hono<Env>()
  .post('/register', async (c) => {
    if (!isLocal(c)) return c.json({ error: 'New accounts can only be created on the home PC.' }, 403);
    const { username, email, password } = credentials(await c.req.json());
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) || !email.includes('@') || password.length < MIN_PASSWORD)
      return c.json({ error: `Valid username, email, and a password of at least ${MIN_PASSWORD} characters required` }, 400);
    const { rows } = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id',
      [username, email, await hashPassword(password)],
    );
    if (!rows[0]) return c.json({ error: 'Username or email already registered' }, 409);
    await startSession(c, Number(rows[0].id));
    return c.json({ email });
  })
  .post('/login', async (c) => {
    if (throttled(c)) return c.json({ error: 'Too many tries. Wait 15 minutes.' }, 429);
    const { username, password } = credentials(await c.req.json());
    const { rows } = await pool.query('SELECT id, email, password_hash FROM users WHERE username = $1', [username]);
    const ok = await verifyPassword(password, rows[0]?.password_hash ?? DUMMY_HASH);
    if (!rows[0] || !ok) return c.json({ error: 'Wrong username or password' }, 401);
    await pool.query('DELETE FROM sessions WHERE expires_at < now()');
    await startSession(c, Number(rows[0].id));
    return c.json({ email: rows[0].email });
  })
  .post('/logout', async (c) => {
    const token = getCookie(c, COOKIE);
    if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)]);
    deleteCookie(c, COOKIE, { path: '/' });
    return c.json({ ok: true });
  })
  .get('/me', requireUser, async (c) => {
    const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [c.get('userId')]);
    return c.json({ email: rows[0].email });
  });
