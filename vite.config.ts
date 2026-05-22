import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isRemoteDev = !!process.env.VITE_REMOTE_DEV;

// https://vitejs.dev/config/
export default defineConfig({
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
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: isRemoteDev ? ['kundai.app', 'www.kundai.app', 'localhost'] : ['localhost'],
    fs: {
      // Prevent Vite from serving or transforming .git internals as modules.
      deny: ['.git', 'node_modules'],
    },
    watch: {
      ignored: ['**/.git/**'],
    },
    // When running behind nginx on the VPS (VITE_REMOTE_DEV=1), the browser
    // must reach the HMR websocket via the public domain's WSS proxy.
    // Locally, just use the plain dev-server port.
    hmr: isRemoteDev
      ? { host: 'www.kundai.app', protocol: 'wss', clientPort: 443 }
      : { port: 5173 },
  },
});