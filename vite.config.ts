import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_PATH is "/" for Vercel and "/<repo-name>/" for GitHub Pages
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: { port: 5173 }
  };
});
