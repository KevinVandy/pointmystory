import { defineConfig } from 'vite'
// import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'url'

import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // React 19 shims - redirect use-sync-external-store to local shims that re-export from React
      'use-sync-external-store/shim/with-selector.js': fileURLToPath(new URL('./src/shims/use-sync-external-store-with-selector.ts', import.meta.url)),
      'use-sync-external-store/shim/with-selector': fileURLToPath(new URL('./src/shims/use-sync-external-store-with-selector.ts', import.meta.url)),
      'use-sync-external-store/shim/index.js': fileURLToPath(new URL('./src/shims/use-sync-external-store-shim.ts', import.meta.url)),
      'use-sync-external-store/shim': fileURLToPath(new URL('./src/shims/use-sync-external-store-shim.ts', import.meta.url)),
      'use-sync-external-store': fileURLToPath(new URL('./src/shims/use-sync-external-store-shim.ts', import.meta.url)),
    },
  },
  plugins: [
    // devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    netlify(),
    viteReact(),
  ],
})

export default config
