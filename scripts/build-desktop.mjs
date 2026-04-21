import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function run(cmd) {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { cwd: root, stdio: 'inherit' })
}

rmSync(join(root, 'dist/desktop'), { recursive: true, force: true })
mkdirSync(join(root, 'dist/desktop'), { recursive: true })

run('npx vite build -c vite.desktop.server.config.ts')

run('npx vite build -c vite.desktop.client.config.ts')

for (const file of ['favicon.svg', 'logo.png', 'og-image.png']) {
  try {
    cpSync(join(root, 'public', file), join(root, 'dist/desktop', file))
    console.log(`✓ Copied public/${file} → dist/desktop/${file}`)
  } catch (e) {
    console.warn(`⚠  Skipped ${file}: ${e.message}`)
  }
}

console.log('\n✅ Desktop build complete → dist/desktop/')
console.log('   Run `npm run desktop:pack` to create the installer.')
