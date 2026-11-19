import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, API calls are forwarded to the Go server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8081' },
  },
});
