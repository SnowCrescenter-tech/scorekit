import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/scorekit/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'ScoreKit - 计分工具箱',
        short_name: 'ScoreKit',
        description: '超多功能计分工具箱 - 德州扑克计分器',
        theme_color: '#0a0f1c',
        background_color: '#0a0f1c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/scorekit/',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5分钟
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心独立分包
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 动画库独立分包
          'vendor-motion': ['framer-motion'],
          // Supabase 独立分包（按需加载）
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
})
