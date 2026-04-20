import type { Context } from 'hono'
import { Hono } from 'hono'
import { ensureDb, getSql } from '../server/db'
import { readSession } from '../server/session'
import { createDefaultTemplate } from '../lib/template'
import { layoutBowtie } from '../lib/layout'

const diagrams = new Hono()

diagrams.use('*', async (c, next) => {
  await ensureDb(c)
  await next()
})

function randomToken(): string {
  const a = new Uint8Array(24)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function requireUser(c: Context) {
  const s = await readSession(c)
  if (!s) return null
  return s
}

async function canViewDiagram(c: Context, diagramId: string, userId: string): Promise<boolean> {
  const own = await getSql(c).execute({
    sql: 'SELECT 1 FROM diagrams WHERE id = ? AND owner_id = ? LIMIT 1',
    args: [diagramId, userId],
  })
  if (own.rows.length > 0) return true
  const acc = await getSql(c).execute({
    sql: 'SELECT 1 FROM diagram_access WHERE diagram_id = ? AND user_id = ? LIMIT 1',
    args: [diagramId, userId],
  })
  return acc.rows.length > 0
}

async function canEditDiagram(c: Context, diagramId: string, userId: string): Promise<boolean> {
  const own = await getSql(c).execute({
    sql: 'SELECT 1 FROM diagrams WHERE id = ? AND owner_id = ? LIMIT 1',
    args: [diagramId, userId],
  })
  if (own.rows.length > 0) return true
  const acc = await getSql(c).execute({
    sql: `SELECT 1 FROM diagram_access WHERE diagram_id = ? AND user_id = ? AND role = 'editor' LIMIT 1`,
    args: [diagramId, userId],
  })
  return acc.rows.length > 0
}

diagrams.get('/', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const rows = await getSql(c).execute({
    sql: `SELECT id, title, updated_at, version, owner_id, my_role FROM (
            SELECT id, title, updated_at, version, owner_id, 'owner' AS my_role FROM diagrams WHERE owner_id = ?
            UNION
            SELECT d.id, d.title, d.updated_at, d.version, d.owner_id, a.role AS my_role
            FROM diagrams d
            INNER JOIN diagram_access a ON a.diagram_id = d.id AND a.user_id = ?
          ) ORDER BY updated_at DESC`,
    args: [s.sub, s.sub],
  })
  const list = rows.rows.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updated_at,
    version: r.version,
    ownerId: r.owner_id,
    myRole: r.my_role,
  }))
  return c.json({ diagrams: list })
})

diagrams.post('/', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const body = await c.req.json<{ title?: string }>().catch(() => ({}))
  const title = (body.title ?? 'Mi diagrama').trim() || 'Mi diagrama'
  const t = createDefaultTemplate()
  const nodes = layoutBowtie(t.nodes)
  const id = crypto.randomUUID()
  const now = Date.now()
  await getSql(c).execute({
    sql: `INSERT INTO diagrams (id, owner_id, title, nodes_json, edges_json, version, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    args: [id, s.sub, title, JSON.stringify(nodes), JSON.stringify(t.edges), now, now],
  })
  return c.json({ id, title, version: 1 })
})

diagrams.get('/:id/access', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const id = c.req.param('id')
  if (!(await canViewDiagram(c, id, s.sub))) return c.json({ error: 'No encontrado' }, 404)
  const owner = await getSql(c).execute({
    sql: `SELECT u.id, u.email, u.name, 'owner' AS role FROM diagrams d JOIN users u ON u.id = d.owner_id WHERE d.id = ?`,
    args: [id],
  })
  const collab = await getSql(c).execute({
    sql: `SELECT u.id, u.email, u.name, a.role FROM diagram_access a JOIN users u ON u.id = a.user_id WHERE a.diagram_id = ?`,
    args: [id],
  })
  return c.json({
    owner: owner.rows[0] ?? null,
    collaborators: collab.rows,
  })
})

diagrams.post('/:id/access', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const diagramId = c.req.param('id')
  const ownerRow = await getSql(c).execute({
    sql: 'SELECT owner_id FROM diagrams WHERE id = ? LIMIT 1',
    args: [diagramId],
  })
  if (ownerRow.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
  const ownerId = (ownerRow.rows[0] as { owner_id: string }).owner_id
  const me = await getSql(c).execute({
    sql: 'SELECT role FROM users WHERE id = ? LIMIT 1',
    args: [s.sub],
  })
  const myRole = (me.rows[0] as { role: string }).role
  const isOwner = ownerId === s.sub
  const isSuper = myRole === 'super'
  if (!isOwner && !isSuper) return c.json({ error: 'Solo el propietario o el superusuario puede invitar' }, 403)
  const body = await c.req.json<{ email?: string; role?: string }>().catch(() => ({}))
  const email = (body.email ?? '').trim().toLowerCase()
  const role = body.role === 'viewer' ? 'viewer' : 'editor'
  if (!email) return c.json({ error: 'Email obligatorio' }, 400)
  const target = await getSql(c).execute({
    sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
    args: [email],
  })
  if (target.rows.length === 0) return c.json({ error: 'No existe un usuario con ese email' }, 404)
  const targetId = (target.rows[0] as { id: string }).id
  if (targetId === ownerId) return c.json({ error: 'El propietario ya tiene acceso' }, 400)
  const now = Date.now()
  await getSql(c).execute({
    sql: `INSERT INTO diagram_access (diagram_id, user_id, role, invited_by, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(diagram_id, user_id) DO UPDATE SET role = excluded.role`,
    args: [diagramId, targetId, role, s.sub, now],
  })
  return c.json({ ok: true })
})

diagrams.post('/:id/demo', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const diagramId = c.req.param('id')
  if (!(await canEditDiagram(c, diagramId, s.sub))) return c.json({ error: 'No autorizado' }, 403)
  const row = await getSql(c).execute({
    sql: 'SELECT title, nodes_json, edges_json FROM diagrams WHERE id = ? LIMIT 1',
    args: [diagramId],
  })
  if (row.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
  const d = row.rows[0] as { title: string; nodes_json: string; edges_json: string }
  const body = await c.req.json<{ days?: number }>().catch(() => ({}))
  const days = typeof body.days === 'number' && body.days > 0 ? Math.min(body.days, 90) : 30
  const token = randomToken()
  const now = Date.now()
  const expires = now + days * 24 * 60 * 60 * 1000
  await getSql(c).execute({
    sql: `INSERT INTO demo_links (token, title, nodes_json, edges_json, created_by, created_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [token, d.title, d.nodes_json, d.edges_json, s.sub, now, expires],
  })
  return c.json({ token, expiresAt: expires })
})

diagrams.get('/:id', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const id = c.req.param('id')
  if (!(await canViewDiagram(c, id, s.sub))) return c.json({ error: 'No encontrado' }, 404)
  const row = await getSql(c).execute({
    sql: 'SELECT id, title, nodes_json, edges_json, version, updated_at, owner_id FROM diagrams WHERE id = ? LIMIT 1',
    args: [id],
  })
  const d = row.rows[0] as {
    id: string
    title: string
    nodes_json: string
    edges_json: string
    version: number
    updated_at: number
    owner_id: string
  }
  return c.json({
    id: d.id,
    title: d.title,
    nodes: JSON.parse(d.nodes_json),
    edges: JSON.parse(d.edges_json),
    version: d.version,
    updatedAt: d.updated_at,
    ownerId: d.owner_id,
  })
})

diagrams.put('/:id', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const id = c.req.param('id')
  if (!(await canEditDiagram(c, id, s.sub))) return c.json({ error: 'No autorizado' }, 403)
  const body = await c.req
    .json<{ nodes?: unknown[]; edges?: unknown[]; version?: number }>()
    .catch(() => ({}))
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges) || typeof body.version !== 'number') {
    return c.json({ error: 'nodes, edges y version son obligatorios' }, 400)
  }
  const cur = await getSql(c).execute({
    sql: 'SELECT version FROM diagrams WHERE id = ? LIMIT 1',
    args: [id],
  })
  if (cur.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
  const currentVersion = (cur.rows[0] as { version: number }).version
  if (currentVersion !== body.version) {
    return c.json({ error: 'Conflicto de versión', currentVersion, expectedVersion: body.version }, 409)
  }
  const next = currentVersion + 1
  const now = Date.now()
  await getSql(c).execute({
    sql: `UPDATE diagrams SET nodes_json = ?, edges_json = ?, version = ?, updated_at = ? WHERE id = ?`,
    args: [JSON.stringify(body.nodes), JSON.stringify(body.edges), next, now, id],
  })
  return c.json({ ok: true, version: next, updatedAt: now })
})

diagrams.patch('/:id', async (c) => {
  const s = await requireUser(c)
  if (!s) return c.json({ error: 'No autorizado' }, 401)
  const id = c.req.param('id')
  if (!(await canEditDiagram(c, id, s.sub))) return c.json({ error: 'No autorizado' }, 403)
  const body = await c.req.json<{ title?: string; version?: number }>().catch(() => ({}))
  const title = (body.title ?? '').trim()
  if (!title) return c.json({ error: 'Título obligatorio' }, 400)
  if (typeof body.version !== 'number') {
    return c.json({ error: 'version es obligatoria' }, 400)
  }
  const cur = await getSql(c).execute({
    sql: 'SELECT version FROM diagrams WHERE id = ? LIMIT 1',
    args: [id],
  })
  if (cur.rows.length === 0) return c.json({ error: 'No encontrado' }, 404)
  const currentVersion = (cur.rows[0] as { version: number }).version
  if (currentVersion !== body.version) {
    return c.json(
      { error: 'Conflicto de versión', currentVersion, expectedVersion: body.version },
      409,
    )
  }
  const next = currentVersion + 1
  const now = Date.now()
  await getSql(c).execute({
    sql: `UPDATE diagrams SET title = ?, version = ?, updated_at = ? WHERE id = ?`,
    args: [title, next, now, id],
  })
  return c.json({ ok: true, title, version: next, updatedAt: now })
})

export default diagrams
