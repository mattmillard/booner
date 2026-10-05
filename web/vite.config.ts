import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // maplibre-gl locates its worker via new URL(..., import.meta.url); pre-bundling breaks that path.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  worker: { format: 'es' },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8787', '/health': 'http://localhost:8787' },
  },
})
