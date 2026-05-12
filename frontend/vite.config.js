import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,  // Запрещает использовать другой порт, если 5174 занят
    host: '192.168.7.103',
    proxy: {
      '/api': {
        target: 'http://192.168.7.103:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://192.168.7.103:8000',
        changeOrigin: true,
      },
    },
  },
});
