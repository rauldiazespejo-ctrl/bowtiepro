import { cpSync, mkdirSync } from 'node:fs'

const files = ['favicon.svg', 'logo.png', 'og-image.png']

for (const file of files) {
  try {
    cpSync(`public/${file}`, `dist/${file}`)
    console.log(`✓ Copied public/${file} → dist/${file}`)
  } catch (e) {
    console.warn(`⚠  Skipped ${file}: ${e.message}`)
  }
}
