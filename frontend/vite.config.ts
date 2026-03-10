import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { UserConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => ({
  base: '/',

  // ═══════════════════════════════════════════════════════════════════════════════
  // PLUGINS
  // ═══════════════════════════════════════════════════════════════════════════════
  plugins: [
    react({
      include: '**/*.{jsx,tsx}',
    }),
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // RESOLVE
  // ═══════════════════════════════════════════════════════════════════════════════
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BUILD OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════════════════
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode === 'development',
    minify: 'esbuild',

    // ═══════════════════════════════════════════════════════════════════════════
    // CHUNK SPLITTING STRATEGY
    // ═══════════════════════════════════════════════════════════════════════════
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-avatar',
            '@radix-ui/react-alert-dialog',
          ],
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          'vendor-charts': [
            'recharts',
          ],
          'vendor-utils': [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name ?? '';
          if (info.endsWith('.css')) {
            return 'assets/styles/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(info)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|ttf|otf|eot)$/.test(info)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    chunkSizeWarningLimit: 500,
    cssMinify: true,
    cssCodeSplit: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEVELOPMENT SERVER
  // ═══════════════════════════════════════════════════════════════════════════════
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // OPTIMIZE DEPS
  // ═══════════════════════════════════════════════════════════════════════════════
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zod',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════════════════════════
  css: {
    devSourcemap: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // PREVIEW
  // ═══════════════════════════════════════════════════════════════════════════════
  preview: {
    port: 4173,
    host: true,
  },
}))
