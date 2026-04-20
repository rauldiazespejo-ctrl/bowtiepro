#!/usr/bin/env node
/**
 * Crea una base D1 en tu cuenta Cloudflare (requiere `npx wrangler login`)
 * y escribe el database_id en wrangler.jsonc para el binding `DB`.
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const wranglerPath = join(root, 'wrangler.jsonc')

const name = process.argv[2] || 'bowtie-studio-pro'

console.log(`Creando D1 "${name}"…`)
const out = execSync(`npx wrangler d1 create "${name}" --json`, {
  encoding: 'utf8',
  cwd: root,
  stdio: ['inherit', 'pipe', 'inherit'],
})

let database_id
let database_name = name
try {
  const j = JSON.parse(out.trim().split('\n').filter(Boolean).at(-1) || out)
  database_id = j.database_id ?? j.uuid ?? j.id
  database_name = j.name ?? name
} catch {
  const m = out.match(/database_id[=:\s]+([0-9a-f-]{36})/i) || out.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  database_id = m ? m[1] : null
}

if (!database_id) {
  console.error('No se pudo obtener database_id. Salida de wrangler:\n', out)
  process.exit(1)
}

let raw = readFileSync(wranglerPath, 'utf8')
const d1Block = `"d1_databases": [
    {
      "binding": "DB",
      "database_name": "${database_name}",
      "database_id": "${database_id}"
    }
  ]`

if (raw.includes('"d1_databases"')) {
  raw = raw.replace(
    /"d1_databases"\s*:\s*\[[\s\S]*?\]/m,
    d1Block,
  )
} else {
  raw = raw.replace(
    /(\s*"compatibility_flags"\s*:\s*\[[^\]]+\])\s*\n\s*\}/,
    `$1,
  ${d1Block}
}`,
  )
}

writeFileSync(wranglerPath, raw)
console.log(`Listo. database_id=${database_id}`)
console.log('Siguiente: npm run build && npx wrangler pages deploy dist --project-name=webapp')
