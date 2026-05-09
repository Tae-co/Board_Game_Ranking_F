import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-data': ['axios', '@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'motion/react'],
          'vendor-capacitor': ['@capacitor/core', '@capacitor/app', '@capacitor/browser'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'axios', '@tanstack/react-query',
      '@capacitor/core', '@capacitor/app', '@capacitor/browser',
      'lucide-react', 'motion/react',
    ],
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
