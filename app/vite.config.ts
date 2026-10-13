import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        id: '/',
        name: '방송실 문제 다모아',
        short_name: '방송다모아',
        description: '방송 담당 교사를 위한 장비·프로그램·운영 문제 해결 가이드',
        theme_color: '#1e3a5c',
        background_color: '#f8fafc',
        display: 'standalone',
        lang: 'ko',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
