import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  },
  build: {
    outDir: 'dist/admin',
    rollupOptions: {
      input: {
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  },
  root: './admin',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared')
    }
  },
  define: {
    'import.meta.env.VITE_APP_TYPE': '"admin"'
  },
  cacheDir: 'node_modules/.vite/admin'
})
