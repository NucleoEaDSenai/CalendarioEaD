import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { jsonApi } from './server/jsonApi.ts';

export default defineConfig({
  base: '/calendario-ead/',
  plugins: [react(), tailwindcss(), jsonApi({ arquivo: 'data/db.json' })],
});
