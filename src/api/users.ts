import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { ensureDb, getSql } from '../server/db'
import { readSession } from '../server/session'

const users = new Hono()

users.use('*', async (c, next) => {
  await ensureDb(c)
  await next()
})

users.get('/me', async (c) => {
  const s = await readSession(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const row = await getSql(c).execute({
    sql: 'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1',
    args: [s.sub],
  })
  if (row.rows.length === 0) return c.json({ error: 'No autorizado' }, 401)
  const u = row.rows[0] as { id: string; email: string; name: string; role: string }
  return c.json({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    preferences: { locale: 'es', autoSave: true, autoLayoutOnLoad: true },
  })
})

/** Solo el superusuario puede crear cuentas. */
users.post('/', async (c) => {
  const s = await readSession(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const superRow = await getSql(c).execute({
    sql: 'SELECT role FROM users WHERE id = ? LIMIT 1',
    args: [s.sub],
  })
  if (superRow.rows.length === 0) return c.json({ error: 'No autorizado' }, 401)
  if ((superRow.rows[0] as { role: string }).role !== 'super') {
    return c.json({ error: 'Solo el superusuario puede crear usuarios' }, 403)
  }
  const body = await c.req.json<{ email?: string; password?: string; name?: string }>().catch(() => ({}))
  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''
  const name = (body.name ?? '').trim() || email.split('@')[0]
  if (!email || !password) {
    return c.json({ error: 'Email y contraseña son obligatorios' }, 400)
  }
  if (password.length < 6) {
    return c.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400)
  }
  const exists = await getSql(c).execute({
    sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
    args: [email],
  })
  if (exists.rows.length > 0) {
    return c.json({ error: 'Ya existe un usuario con ese email' }, 409)
  }
  const id = crypto.randomUUID()
  const hash = bcrypt.hashSync(password, 10)
  const now = Date.now()
  await getSql(c).execute({
    sql: `INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, 'user', ?)`,
    args: [id, email, hash, name, now],
  })
  return c.json({ ok: true, user: { id, email, name, role: 'user' } })
})

export default users
