import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const files = ['favicon.svg', 'logo.png', 'og-image.png']

for (const file of files) {
  try {
    cpSync(`public/${file}`, `.vercel/output/static/${file}`)
    console.log(`✓ Copied public/${file} → .vercel/output/static/${file}`)
  } catch (e) {
    console.warn(`⚠  Skipped ${file}: ${e.message}`)
  }
}

const vcConfigPath = '.vercel/output/functions/__hono.func/.vc-config.json'
try {
  const cfg = JSON.parse(readFileSync(vcConfigPath, 'utf8'))
  cfg.runtime = 'nodejs22.x'
  writeFileSync(vcConfigPath, JSON.stringify(cfg))
  console.log('✓ Pinned runtime to nodejs22.x')
} catch (e) {
  console.warn(`⚠  Could not patch .vc-config.json: ${e.message}`)
}

const funcNodeModules = '.vercel/output/functions/__hono.func/node_modules'
mkdirSync(funcNodeModules, { recursive: true })

const runtimePkgs = [
  '@libsql/client', '@libsql/core', '@libsql/hrana-client', '@libsql/isomorphic-ws',
  'ws', 'cross-fetch', 'node-fetch', 'data-uri-to-buffer', 'fetch-blob',
  'formdata-polyfill', 'js-base64', 'promise-limit',
]
for (const pkg of runtimePkgs) {
  try {
    const dest = `${funcNodeModules}/${pkg}`
    if (pkg.startsWith('@')) {
      const [scope] = pkg.split('/')
      mkdirSync(`${funcNodeModules}/${scope}`, { recursive: true })
    }
    cpSync(`node_modules/${pkg}`, dest, { recursive: true })
    console.log(`✓ Copied node_modules/${pkg} → ${dest}`)
  } catch (e) {
    console.warn(`⚠  Skipped ${pkg}: ${e.message}`)
  }
}
