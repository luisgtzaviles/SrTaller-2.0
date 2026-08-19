import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const projectDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => {
  const requestedEnvironment = process.env.SRT_DEPLOY_ENV;
  const deployEnvironment = requestedEnvironment === 'production' || requestedEnvironment === 'staging'
    || requestedEnvironment === 'preview' || requestedEnvironment === 'local'
    ? requestedEnvironment
    : command === 'serve' ? 'local' : 'preview';
  const catalogEnabled = deployEnvironment === 'local' || deployEnvironment === 'preview';
  const localBackendPort = Number(process.env.SRT_LOCAL_BACKEND_PORT ?? '3000');
  const localServer = command === 'serve' && deployEnvironment === 'local'
    ? {
        host: process.env.SRT_LOCAL_VITE_HOST ?? '127.0.0.1',
        port: Number(process.env.SRT_LOCAL_VITE_PORT ?? '4173'),
        strictPort: true,
        proxy: {
          '/api': { target: `http://127.0.0.1:${localBackendPort}`, changeOrigin: false },
          '/livez': { target: `http://127.0.0.1:${localBackendPort}`, changeOrigin: false },
          '/readyz': { target: `http://127.0.0.1:${localBackendPort}`, changeOrigin: false },
        },
      }
    : null;

  return {
    plugins: [
      react(),
      {
        name: 'srtaller-ui-catalog-policy',
        transformIndexHtml: {
          order: 'pre',
          handler: () => catalogEnabled
            ? [{ tag: 'meta', attrs: { name: 'srt-ui-catalog', content: 'enabled' }, injectTo: 'head' }]
            : [],
        },
      },
    ],
    define: {
      __UI_CATALOG_ENABLED__: JSON.stringify(catalogEnabled),
      __SRT_DEPLOY_ENV__: JSON.stringify(deployEnvironment),
    },
    build: {
      outDir: resolve(projectDirectory, '../../dist/public'),
      emptyOutDir: false,
    },
    ...(localServer ? { server: localServer } : {}),
  };
});
