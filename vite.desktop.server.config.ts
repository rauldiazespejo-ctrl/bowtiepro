import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'

const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]

export default defineConfig({
  build: {
    ssr: 'src/index.desktop.ts',
    outDir: 'dist/desktop',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/index.desktop.ts',
      external: [
        ...nodeBuiltins,
        'electron',
        /^hono/,
        /^@hono/,
        /^@libsql/,
        'bcryptjs',
      ],
      output: {
        entryFileNames: 'server.mjs',
        format: 'es',
      },
    },
    target: 'node20',
  },
})
