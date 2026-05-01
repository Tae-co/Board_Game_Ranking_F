import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['motion/react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://meeple-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: 'https://boardup.pages.dev',
        },
      },
      '/ws': {
        target: 'https://meeple-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
})
