import { Hono } from 'hono'
import { ensureDb, getSql } from '../server/db'

const publicApi = new Hono()

publicApi.use('*', async (c, next) => {
  await ensureDb(c)
  await next()
})

/** Lectura pública de una versión demo (sin sesión). */
publicApi.get('/demo/:token', async (c) => {
  const token = c.req.param('token')
  const row = await getSql(c).execute({
    sql: 'SELECT title, nodes_json, edges_json, expires_at FROM demo_links WHERE token = ? LIMIT 1',
    args: [token],
  })
  if (row.rows.length === 0) return c.json({ error: 'Enlace no válido' }, 404)
  const r = row.rows[0] as { title: string; nodes_json: string; edges_json: string; expires_at: number | null }
  if (r.expires_at != null && Date.now() > r.expires_at) {
    return c.json({ error: 'Este enlace demo ha caducado' }, 410)
  }
  return c.json({
    title: r.title,
    nodes: JSON.parse(r.nodes_json),
    edges: JSON.parse(r.edges_json),
  })
})

export default publicApi
