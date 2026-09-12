import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const projectDirectory = fileURLToPath(new URL('.', import.meta.url));
const repositoryDirectory = resolve(projectDirectory, '../..');
const revisionPattern = /^[0-9a-f]{40}$/u;

function runtimeProvenance(): Readonly<{
  role: 'frontend';
  sourceRevision: string;
  sourceState: 'clean' | 'dirty';
}> {
  const configuredRevision = process.env.SR_RUNTIME_GIT_SHA?.trim();
  const configuredState = process.env.SR_RUNTIME_SOURCE_STATE?.trim();
  const sourceRevision = configuredRevision ?? execFileSync(
    'git', ['rev-parse', 'HEAD'], { cwd: repositoryDirectory, encoding: 'utf8' },
  ).trim();
  const sourceState = configuredState ?? (execFileSync(
    'git', ['status', '--porcelain=v1', '--untracked-files=all'],
    { cwd: repositoryDirectory, encoding: 'utf8' },
  ).trim() === '' ? 'clean' : 'dirty');
  if (!revisionPattern.test(sourceRevision) || (sourceState !== 'clean' && sourceState !== 'dirty')) {
    throw new Error('Frontend runtime provenance is missing or invalid.');
  }
  return Object.freeze({ role: 'frontend', sourceRevision, sourceState });
}

export default defineConfig(({ command }) => {
  const provenance = runtimeProvenance();
  const provenanceJson = `${JSON.stringify(provenance)}\n`;
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
      {
        name: 'srtaller-runtime-provenance',
        configureServer(server) {
          server.middlewares.use('/runtime-provenance.json', (_request, response) => {
            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.setHeader('Cache-Control', 'no-store');
            response.end(provenanceJson);
          });
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'runtime-provenance.json',
            source: provenanceJson,
          });
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
