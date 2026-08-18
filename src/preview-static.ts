import { access } from 'node:fs/promises';
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
}

type PreviewNext = () => void;

const previewSpaExactPaths = new Set([
  '/',
  '/reparaciones',
  '/reparaciones/nueva',
]);
const previewRepairDetailPath = /^\/reparaciones\/[^/]+$/u;

function isPreviewSpaRoute(path: string): boolean {
  return previewSpaExactPaths.has(path) || previewRepairDetailPath.test(path);
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
  application.useStaticAssets(publicDirectory, { index: false });
  application.use(
    (
      request: PreviewRequest,
      response: PreviewResponse,
      next: PreviewNext,
    ): void => {
      if (
        request.method !== 'GET' ||
        !isPreviewSpaRoute(request.path) ||
        request.accepts('html') === false
      ) {
        next();
        return;
      }
      response.sendFile(indexFile);
    },
  );
}
