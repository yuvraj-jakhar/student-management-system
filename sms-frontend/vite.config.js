import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/login': 'http://127.0.0.1:8000',
      '/token': 'http://127.0.0.1:8000',
      '/register': 'http://127.0.0.1:8000',
      '/upload-image': 'http://127.0.0.1:8000',
      '/forgot-password': 'http://127.0.0.1:8000',
      '/reset-password': 'http://127.0.0.1:8000',
      '/refresh-token': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000',
      '/student': 'http://127.0.0.1:8000',
      '/teacher': 'http://127.0.0.1:8000',
      '/library': 'http://127.0.0.1:8000',
      '/events': 'http://127.0.0.1:8000',
      '/notices': 'http://127.0.0.1:8000',
      '/notifications': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
})