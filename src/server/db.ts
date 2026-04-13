import { createClient, type Client } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'

const SUPER_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? 'rauldiazespejo@gmail.com').toLowerCase()
const SUPER_DEFAULT_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? 'bowtie28'

let client: Client | null = null
let initPromise: Promise<void> | null = null

export function getLibsqlUrl(): string {
  const fromEnv = process.env.LIBSQL_URL ?? process.env.TURSO_DATABASE_URL
  if (fromEnv) return fromEnv
  const dir = join(process.cwd(), '.data')
  try {
    mkdirSync(dir, { recursive: true })
  } catch {
    /* exists */
  }
  return `file:${join(dir, 'bowtie.db')}`
}

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: getLibsqlUrl(),
      authToken: process.env.LIBSQL_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
    })
  }
  return client
}

async function exec(sql: string, args: unknown[] = []) {
  await getDb().execute({ sql, args })
}

async function initSchema() {
  await exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL
  )`)
  await exec(`CREATE TABLE IF NOT EXISTS diagrams (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    nodes_json TEXT NOT NULL,
    edges_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  )`)
  await exec(`CREATE TABLE IF NOT EXISTS diagram_access (
    diagram_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (diagram_id, user_id),
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)
  await exec(`CREATE TABLE IF NOT EXISTS demo_links (
    token TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    nodes_json TEXT NOT NULL,
    edges_json TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
  )`)
}

async function seedSuper() {
  const row = await getDb().execute({
    sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
    args: [SUPER_EMAIL],
  })
  if (row.rows.length > 0) return
  const id = crypto.randomUUID()
  const hash = bcrypt.hashSync(SUPER_DEFAULT_PASSWORD, 10)
  const now = Date.now()
  await exec(
    `INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, SUPER_EMAIL, hash, 'Super administrador', 'super', now],
  )
}

export async function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await initSchema()
      await seedSuper()
    })()
  }
  await initPromise
}

export { SUPER_EMAIL }
