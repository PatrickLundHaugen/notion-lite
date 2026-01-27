/**
 * Vite PWA Plugin Configuration
 * 
 * Configures service worker, caching strategies, and manifest.
 */

import { VitePWA } from 'vite-plugin-pwa';

export function createPWAConfig() {
  return VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
    
    manifest: {
      name: "Pat's Notes",
      short_name: 'Notes',
      description: 'A focused writing environment with version history and AI assistance',
      theme_color: '#1C1917',
      background_color: '#FAFAF9',
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any',
        },
      ],
    },

    workbox: {
      // Cache strategies
      runtimeCaching: [
        {
          // Cache API responses (network first, fall back to cache)
          urlPattern: /^https?:\/\/.*\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24, // 24 hours
            },
            networkTimeoutSeconds: 10,
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // Cache fonts (cache first)
          urlPattern: /^https:\/\/api\.fontshare\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'font-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // Cache images (cache first with network fallback)
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          // Cache JS/CSS (stale while revalidate)
          urlPattern: /\.(?:js|css)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            },
          },
        },
      ],
      
      // Pre-cache app shell
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      
      // Skip waiting and claim clients immediately
      skipWaiting: true,
      clientsClaim: true,
      
      // Clean up old caches
      cleanupOutdatedCaches: true,
    },

    devOptions: {
      enabled: false, // Disable in development for easier debugging
      type: 'module',
    },
  });
}

/**
 * Example vite.config.ts usage:
 * 
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { createPWAConfig } from './pwa.config';
 * 
 * export default defineConfig({
 *   plugins: [
 *     react(),
 *     createPWAConfig(),
 *   ],
 *   // ... other config
 * });
 */