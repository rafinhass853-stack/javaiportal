import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
    host: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  // Garante que imagens do Leaflet sejam resolvidas corretamente
  optimizeDeps: {
    include: ['leaflet', 'leaflet-routing-machine'],
  },
})
