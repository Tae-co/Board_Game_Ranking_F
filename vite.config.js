import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 로컬 백엔드로 돌리려면 .env.local 에 VITE_PROXY_TARGET=http://localhost:8080
  // 미설정 시 운영 백엔드 (기존 동작 그대로)
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://meeple-production.up.railway.app'
  const isLocalBackend = proxyTarget.includes('localhost') || proxyTarget.includes('127.0.0.1')

  return {
    base: './',
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
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          // 운영 백엔드는 특정 Origin을 요구하므로 강제. 로컬 백엔드엔 불필요
          ...(isLocalBackend ? {} : { headers: { Origin: 'https://boardup.pages.dev' } }),
        },
        '/ws': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    },
  }
})
