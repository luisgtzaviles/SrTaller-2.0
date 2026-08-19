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
  const catalogEnabled = indexSource.includes('name="srt-ui-catalog" content="enabled"');
  application.useStaticAssets(publicDirectory, { index: false });
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
      response.sendFile(indexFile);
    },
  );
}
