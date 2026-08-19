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
  };
});
