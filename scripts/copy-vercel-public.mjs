import { cpSync } from 'node:fs'

const files = ['favicon.svg', 'logo.png', 'og-image.png']

for (const file of files) {
  try {
    cpSync(`public/${file}`, `.vercel/output/static/${file}`)
    console.log(`✓ Copied public/${file} → .vercel/output/static/${file}`)
  } catch (e) {
    console.warn(`⚠  Skipped ${file}: ${e.message}`)
  }
}
