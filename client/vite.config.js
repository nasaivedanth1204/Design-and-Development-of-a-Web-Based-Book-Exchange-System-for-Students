import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// During development the React app runs on Vite (port 5173) and forwards
// every /api and /uploads request to the Express server (port 4000).
const API_TARGET = `http://localhost:${process.env.PORT || 4000}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': API_TARGET,
      '/uploads': API_TARGET,
    },
  },
});
