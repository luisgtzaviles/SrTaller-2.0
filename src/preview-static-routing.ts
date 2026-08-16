import { extname } from 'node:path';

export interface PreviewStaticRequest {
  readonly method: string;
  readonly path: string;
  accepts(type: string): false | string;
}

const runtimeRoutePaths = new Set(['/healthz']);

export function shouldServePreviewIndex(
  request: PreviewStaticRequest,
): boolean {
  return (
    request.method === 'GET' &&
    !runtimeRoutePaths.has(request.path) &&
    !request.path.startsWith('/api/') &&
    extname(request.path) === '' &&
    request.accepts('html') !== false
  );
}
