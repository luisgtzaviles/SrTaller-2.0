import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NestExpressApplication } from '@nestjs/platform-express';

interface PreviewRequest {
  readonly method: string;
  readonly path: string;
  accepts(type: string): false | string | readonly string[];
}

interface PreviewResponse {
  sendFile(path: string): void;
  setHeader(name: string, value: string): void;
}

type PreviewNext = () => void;

const previewSpaExactPaths = new Set([
  '/',
  '/reparaciones',
  '/reparaciones/nueva',
  '/listas/precios',
  '/listas/precios/carga-masiva',
  '/configuracion',
  '/configuracion/sucursal',
  '/configuracion/roles',
  '/configuracion/usuarios',
  '/configuracion/catalogos/nueva-reparacion',
  '/configuracion/catalogos',
  '/configuracion/catalogos/lista-de-precios/campos-de-carga',
]);
const previewRepairDetailPath = /^\/reparaciones\/[^/]+$/u;
const previewCatalogPath = '/__internal/ui-catalog';

function isPreviewSpaRoute(path: string, catalogEnabled: boolean): boolean {
  return previewSpaExactPaths.has(path)
    || previewRepairDetailPath.test(path)
    || (catalogEnabled && path === previewCatalogPath);
}

export async function configurePreviewStaticFiles(
  application: NestExpressApplication,
): Promise<void> {
  const publicDirectory = resolve(
    dirname(fileURLToPath(import.meta.url)),
    'public',
  );
  const indexFile = resolve(publicDirectory, 'index.html');

  await access(indexFile);
  const indexSource = await readFile(indexFile, 'utf8');
  const indexEtag = `"${createHash('sha256').update(indexSource).digest('base64url')}"`;
  const catalogEnabled = indexSource.includes('name="srt-ui-catalog" content="enabled"');
  application.useStaticAssets(publicDirectory, {
    index: false,
    setHeaders: (response, path): void => {
      if (path.endsWith('/runtime-provenance.json')) {
        response.setHeader('Cache-Control', 'no-store');
      }
    },
  });
  application.use(
    (
      request: PreviewRequest,
      response: PreviewResponse,
      next: PreviewNext,
    ): void => {
      if (
        request.method !== 'GET' ||
        !isPreviewSpaRoute(request.path, catalogEnabled) ||
        request.accepts('html') === false
      ) {
        next();
        return;
      }
      if (request.path === previewCatalogPath) {
        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      }
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('ETag', indexEtag);
      response.sendFile(indexFile);
    },
  );
}
