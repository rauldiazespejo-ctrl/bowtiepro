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
        <title>Bowtie Studio Pro — Editor HSE profesional</title>
        <meta name="description" content="Editor profesional de diagramas bowtie para análisis de riesgos HSE. Colaboración en tiempo real, plantillas y más." />
        <meta name="theme-color" content="#0ea5e9" />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.png" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Bowtie Studio Pro" />
        <meta property="og:description" content="Editor profesional de diagramas bowtie para procesos HSE" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://bowtiepro.netlify.app" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bowtie Studio Pro" />
        <meta name="twitter:description" content="Editor profesional de diagramas bowtie para procesos HSE" />
        <meta name="twitter:image" content="/og-image.png" />
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
