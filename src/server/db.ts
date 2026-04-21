import type { Context } from 'hono'
import bcrypt from 'bcryptjs'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createClient as createWebClient } from '@libsql/client/web'

type CreateClientFn = typeof import('@libsql/client').createClient
type Client = import('@libsql/client').Client

function normalizeLibsqlUrl(url: string): string {
  if (url.startsWith('libsql://')) return url.replace('libsql://', 'https://')
  if (url.startsWith('wss://')) return url.replace('wss://', 'https://')
  return url
}

async function loadCreateClient(): Promise<CreateClientFn> {
  const url = process.env.LIBSQL_URL || process.env.TURSO_DATABASE_URL || ''
  const isRemote = url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('wss://')
  if (isRemote) {
    return createWebClient as unknown as CreateClientFn
  }
  try {
    const m = await import('@libsql/client')
    return m.createClient
  } catch {
    throw new DatabaseNotConfiguredError()
  }
}

const SUPER_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? 'rauldiazespejo@gmail.com').toLowerCase()
const SUPER_DEFAULT_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? 'bowtie28'

export type SqlExecuteResult = { rows: Array<Record<string, unknown>> }

export type SqlClient = {
  execute(input: { sql: string; args?: unknown[] }): Promise<SqlExecuteResult>
}

/** Mínimo tipado para D1 en Workers (evita dependencia @cloudflare/workers-types). */
export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement
  all(): Promise<{ results?: Record<string, unknown>[] }>
  run(): Promise<unknown>
}

export type D1Database = {
  prepare(query: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<unknown>
}

let libsqlClient: Client | null = null
let libsqlClientPromise: Promise<Client> | null = null
let libsqlInitPromise: Promise<void> | null = null

/** Workers (p. ej. Cloudflare) no pueden usar SQLite en disco sin D1 ni Turso. */
export class DatabaseNotConfiguredError extends Error {
  readonly status = 503
  readonly code = 'DB_NOT_CONFIGURED'
  constructor() {
    super(
      'Base de datos no configurada: enlaza una base D1 (binding DB) en Cloudflare Pages o ejecuta `npm run cf:provision`, o bien configura LIBSQL_URL / TURSO_DATABASE_URL.',
    )
    this.name = 'DatabaseNotConfiguredError'
  }
}

function isEdgeWorkerWithoutNodeFs(): boolean {
  try {
    if (typeof navigator === 'undefined' || !('userAgent' in navigator)) return false
    const ua = String((navigator as { userAgent?: string }).userAgent ?? '')
    if (ua.includes('Cloudflare-Workers')) return true
    if (ua.includes('Vercel-Edge')) return true
    return false
  } catch {
    return false
  }
}

function requiresRemoteLibsqlUrl(): boolean {
  if (process.env.CF_PAGES === '1') return true
  if (process.env.VERCEL === '1') return true
  return isEdgeWorkerWithoutNodeFs()
}


async function getLibsqlRawClientAsync(): Promise<Client> {
  if (libsqlClient) return libsqlClient
  if (!libsqlClientPromise) {
    libsqlClientPromise = (async () => {
      const createClient = await loadCreateClient()
      const url = (() => {
        const fromEnv = process.env.LIBSQL_URL || process.env.TURSO_DATABASE_URL
        if (fromEnv) return fromEnv
        if (requiresRemoteLibsqlUrl()) throw new DatabaseNotConfiguredError()
        const dir = join(process.cwd(), '.data')
        try { mkdirSync(dir, { recursive: true }) } catch { /* exists */ }
        return `file:${join(dir, 'bowtie.db')}`
      })()
      libsqlClient = createClient({ url: normalizeLibsqlUrl(url), authToken: process.env.LIBSQL_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN })
      return libsqlClient
    })()
  }
  return libsqlClientPromise
}

/** Singleton libsql para desarrollo local / Node. */
export function getLibsqlSqlClientSingleton(): SqlClient {
  return {
    async execute(input) {
      const client = await getLibsqlRawClientAsync()
      const r = await client.execute({ sql: input.sql, args: input.args ?? [] })
      return { rows: r.rows as Record<string, unknown>[] }
    },
  }
}

export function createD1SqlClient(db: D1Database): SqlClient {
  return {
    async execute(input) {
      const args = input.args ?? []
      const norm = args.map((a) => (a === undefined ? null : a))
      const stmt = db.prepare(input.sql)
      const bound = norm.length ? stmt.bind(...norm) : stmt
      const t = input.sql.trim().toLowerCase()
      const reads =
        t.startsWith('select') || t.startsWith('with') || t.startsWith('pragma') || t.startsWith('explain')
      if (reads) {
        const r = await bound.all()
        return { rows: (r.results ?? []) as Record<string, unknown>[] }
      }
      await bound.run()
      return { rows: [] }
    },
  }
}

export function getSql(c: Context): SqlClient {
  const sql = c.get('sql')
  if (!sql) {
    throw new Error('Cliente SQL no inicializado: falta middleware en index.tsx')
  }
  return sql
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS diagrams (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    nodes_json TEXT NOT NULL,
    edges_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS diagram_access (
    diagram_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (diagram_id, user_id),
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS demo_links (
    token TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    nodes_json TEXT NOT NULL,
    edges_json TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
  )`,
]

async function initSchema(sql: SqlClient) {
  for (const statement of SCHEMA_STATEMENTS) {
    await sql.execute({ sql: statement, args: [] })
  }
}

async function initSchemaD1Batch(db: D1Database) {
  await db.batch(SCHEMA_STATEMENTS.map((s) => db.prepare(s)))
}

async function seedSuper(sql: SqlClient) {
  const row = await sql.execute({
    sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
    args: [SUPER_EMAIL],
  })
  if (row.rows.length > 0) return
  const id = crypto.randomUUID()
  const hash = bcrypt.hashSync(SUPER_DEFAULT_PASSWORD, 10)
  const now = Date.now()
  await sql.execute({
    sql: `INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, SUPER_EMAIL, hash, 'Super administrador', 'super', now],
  })
}

let d1Bootstrap: Promise<void> | null = null

export async function ensureDb(c: Context): Promise<void> {
  const d1 = c.env && typeof c.env === 'object' && 'DB' in c.env ? (c.env as { DB?: D1Database }).DB : undefined

  if (d1) {
    if (!d1Bootstrap) {
      d1Bootstrap = (async () => {
        await initSchemaD1Batch(d1)
        await seedSuper(createD1SqlClient(d1))
      })().catch((e) => {
        d1Bootstrap = null
        throw e
      })
    }
    await d1Bootstrap
    return
  }

  const sql = getSql(c)
  if (!libsqlInitPromise) {
    libsqlInitPromise = (async () => {
      await initSchema(sql)
      await seedSuper(sql)
    })().catch((e) => {
      libsqlInitPromise = null
      throw e
    })
  }
  await libsqlInitPromise
}

export { SUPER_EMAIL }

declare module 'hono' {
  interface ContextVariableMap {
    sql: SqlClient
  }
}
