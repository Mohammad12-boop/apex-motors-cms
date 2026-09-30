import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: { rollupOptions: { output: { manualChunks: { 'react-vendor': ['react', 'react-dom', 'react-dom/client', 'react-router-dom'], supabase: ['@supabase/supabase-js'] } } } },
});
