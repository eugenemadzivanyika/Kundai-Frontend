import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const isRemoteDev = !!process.env.VITE_REMOTE_DEV;
  const ngrokHost   = env.VITE_PUBLIC_URL ? new URL(env.VITE_PUBLIC_URL).hostname : null;
  const useProxy    = isRemoteDev || !!ngrokHost || !!process.env.VITE_PROXY_API;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      sourcemap: true,
    },
    server: {
      host: ngrokHost ? '0.0.0.0' : '127.0.0.1',
      port: 5173,
      strictPort: true,
      allowedHosts: isRemoteDev
        ? ['kundai.app', 'www.kundai.app', 'localhost']
        : ngrokHost
          ? [ngrokHost, 'localhost']
          : ['localhost'],
      fs: {
        deny: ['.git', 'node_modules'],
      },
      watch: {
        ignored: ['**/.git/**'],
      },
      hmr: isRemoteDev
        ? { host: 'www.kundai.app', protocol: 'wss', clientPort: 443 }
        : { port: 5173 },
      ...(useProxy && {
        proxy: {
          '/api':       { target: 'http://localhost:5000', changeOrigin: true },
          '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
        },
      }),
    },
  };
});
