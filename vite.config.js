import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5617,
    strictPort: true,
    host: '127.0.0.1',
    open: false,
    allowedHosts: ['scores.cardiosmart.ai'],
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.VITE_API_PORT || 4617}`,
        changeOrigin: true
      }
    }
  }
})