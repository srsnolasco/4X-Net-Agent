import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/mcp': {
        target: 'http://127.0.0.1:39001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
