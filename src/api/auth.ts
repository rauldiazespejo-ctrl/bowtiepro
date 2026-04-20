import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { ensureDb, getSql } from '../server/db'
import { clearSessionCookie, createSessionToken, readSession, setSessionCookie } from '../server/session'

const auth = new Hono()

auth.use('*', async (c, next) => {
  await ensureDb(c)
  await next()
})

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}))
  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''
  if (!email || !password) {
    return c.json({ ok: false, error: 'Email y contraseña son obligatorios' }, 400)
  }
  const row = await getSql(c).execute({
    sql: 'SELECT id, email, name, role, password_hash FROM users WHERE email = ? LIMIT 1',
    args: [email],
  })
  if (row.rows.length === 0) {
    return c.json({ ok: false, error: 'Credenciales incorrectas' }, 401)
  }
  const u = row.rows[0] as {
    id: string
    email: string
    name: string
    role: string
    password_hash: string
  }
  const ok = bcrypt.compareSync(password, u.password_hash)
  if (!ok) return c.json({ ok: false, error: 'Credenciales incorrectas' }, 401)
  const role = u.role === 'super' ? 'super' : 'user'
  const token = await createSessionToken({
    sub: u.id,
    email: u.email,
    name: u.name,
    role,
  })
  setSessionCookie(c, token)
  return c.json({
    ok: true,
    user: { id: u.id, email: u.email, name: u.name, role },
  })
})

auth.get('/session', async (c) => {
  const s = await readSession(c)
  if (!s) return c.json({ authenticated: false, user: null })
  const row = await getSql(c).execute({
    sql: 'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1',
    args: [s.sub],
  })
  if (row.rows.length === 0) {
    clearSessionCookie(c)
    return c.json({ authenticated: false, user: null })
  }
  const u = row.rows[0] as { id: string; email: string; name: string; role: string }
  return c.json({
    authenticated: true,
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    },
  })
})

auth.post('/logout', (c) => {
  clearSessionCookie(c)
  return c.json({ ok: true })
})

export default auth
