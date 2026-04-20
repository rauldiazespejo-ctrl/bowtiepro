import { Hono } from 'hono'
import auth from './api/auth'
import users from './api/users'
import diagrams from './api/diagrams'
import publicApi from './api/public'
import {
  createD1SqlClient,
  DatabaseNotConfiguredError,
  getLibsqlSqlClientSingleton,
  type D1Database,
} from './server/db'

type PagesBindings = { DB?: D1Database }

const app = new Hono<{ Bindings: PagesBindings }>()

app.onError((err, c) => {
  if (err instanceof DatabaseNotConfiguredError || err.name === 'DatabaseNotConfiguredError') {
    return c.json({ error: err.message, code: 'DB_NOT_CONFIGURED' }, 503)
  }
  console.error('[bowtie]', err)
  return c.json({ error: 'Error interno del servidor' }, 500)
})

/** D1 en Cloudflare Pages (automático) o libsql/Turso/local en el resto. */
app.use('*', async (c, next) => {
  const d1 = c.env?.DB
  if (d1) {
    c.set('sql', createD1SqlClient(d1))
  } else {
    c.set('sql', getLibsqlSqlClientSingleton())
  }
  await next()
})

// Mount API routes
app.route('/api/auth', auth)
app.route('/api/users', users)
app.route('/api/diagrams', diagrams)
app.route('/api/public', publicApi)

// Fallback to React app
app.get('*', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Bowtie Studio</title>
        ${
          import.meta.env.PROD
            ? `<link rel="stylesheet" href="/static/assets/style.css">`
            : `<script type="module" src="/src/client.tsx"></script>`
        }
      </head>
      <body>
        <div id="root"></div>
        ${
          import.meta.env.PROD
            ? `<script type="module" src="/static/assets/client.js"></script>`
            : ''
        }
      </body>
    </html>
  `)
})

export default app
