import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import honoApp from './index'

/**
 * Starts the embedded Hono server for the Electron desktop app.
 * @param staticRoot  Absolute path to the folder that contains assets/, favicon.svg, logo.png
 * @param dbPath      Absolute path to the SQLite file (e.g. userData/bowtie.db)
 * @returns           The port the server is listening on
 */
export async function startDesktopServer(opts: {
  staticRoot: string
  dbPath: string
}): Promise<number> {
  process.env.LIBSQL_URL = `file:${opts.dbPath}`

  const root = opts.staticRoot

  const wrapper = new Hono()

  wrapper.use('/static/*', serveStatic({ root }))
  wrapper.get('/favicon.svg', serveStatic({ path: 'favicon.svg', root }))
  wrapper.get('/logo.png', serveStatic({ path: 'logo.png', root }))
  wrapper.get('/og-image.png', serveStatic({ path: 'og-image.png', root }))

  wrapper.route('/', honoApp)

  return new Promise((resolve) => {
    serve({ fetch: wrapper.fetch, port: 0 }, (info) => {
      console.log(`[bowtie-desktop] server listening on http://localhost:${info.port}`)
      resolve(info.port)
    })
  })
}
