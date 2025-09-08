import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist/main',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'main/index.html')
      }
    }
  },
  root: './main',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared')
    }
  },
  define: {
    'import.meta.env.VITE_APP_TYPE': '"main"'
  }
})
