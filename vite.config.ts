import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore Local API router shared with the production server.
import { createApiRouter } from './server/apiRouter.mjs';

export default defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_STATIC_HOSTING': JSON.stringify(mode === 'pages' ? 'true' : 'false')
  },
  plugins: [
    react(),
    {
      name: 'shattyq-api-router',
      configureServer(server) {
        server.middlewares.use(createApiRouter());
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
}));
