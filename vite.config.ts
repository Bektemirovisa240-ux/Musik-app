import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build also works under a sub-path (e.g. GitHub Pages).
// Spotify only accepts loopback redirect URIs on 127.0.0.1, not "localhost".
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
