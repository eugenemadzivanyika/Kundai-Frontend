import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // Provide Vite-inlined env vars so src/config/env.ts doesn't throw on load.
  define: {
    'import.meta.env.VITE_API_URL':        JSON.stringify('http://localhost:5000/api'),
    'import.meta.env.VITE_AI_SERVICE_URL': JSON.stringify('http://localhost:8000'),
    'import.meta.env.VITE_WEBSOCKET_URL':  JSON.stringify('ws://localhost:5000'),
    'import.meta.env.MODE':                JSON.stringify('test'),
    'import.meta.env.DEV':                 'false',
    'import.meta.env.PROD':                'false',
    'import.meta.env.SSR':                 'false',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/test/**',
      ],
    },
  },
});
