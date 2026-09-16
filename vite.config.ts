import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore Local middleware shared with the production server.
import {leadMiddleware} from './server/leads.mjs';
export default defineConfig({plugins:[react(),{name:'shattyq-local-leads',configureServer(server){server.middlewares.use(leadMiddleware());}}],server:{port:3000,host:true}});
