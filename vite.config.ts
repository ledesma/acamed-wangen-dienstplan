/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spaFallback } from './vite-plugin-spa-fallback'

export default defineConfig({
  plugins: [react(), spaFallback()],
  server: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    exclude: ['@netlify/functions']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/vite-env.d.ts']
    }
  }
})
