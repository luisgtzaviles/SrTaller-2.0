export const authorizedPreviewStaticSurfacePath = 'src/preview-static.ts';

const requiredFragments = Object.freeze([
  "const previewSpaExactPaths = new Set([\n  '/',\n  '/reparaciones',\n  '/reparaciones/nueva',\n]);",
  'const previewRepairDetailPath = /^\\/reparaciones\\/[^/]+$/u;',
  "const previewCatalogPath = '/__internal/ui-catalog';",
  '|| (catalogEnabled && path === previewCatalogPath);',
  "const catalogEnabled = indexSource.includes('name=\"srt-ui-catalog\" content=\"enabled\"');",
  "response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');",
  "request.method !== 'GET'",
  '!isPreviewSpaRoute(request.path, catalogEnabled)',
  "request.accepts('html') === false",
  'await access(indexFile);',
  "await readFile(indexFile, 'utf8');",
  "createHash('sha256').update(indexSource).digest('base64url')",
  'application.useStaticAssets(publicDirectory, {',
  "path.endsWith('/runtime-provenance.json')",
  "response.setHeader('Cache-Control', 'no-store');",
  "response.setHeader('Cache-Control', 'no-store');",
  "response.setHeader('ETag', indexEtag);",
  'response.sendFile(indexFile);',
]);

const forbiddenFragments = Object.freeze([
  '@Controller(',
  '@Get(',
  '@Post(',
  '@Put(',
  '@Patch(',
  '@Delete(',
  "startsWith('/api')",
  "startsWith('/')",
]);

export function validateAuthorizedPreviewStaticSurface(source) {
  const problems = [];

  for (const fragment of requiredFragments) {
    if (!source.includes(fragment)) {
      problems.push(`authorized static serving fragment is missing: ${fragment}`);
    }
  }

  for (const fragment of forbiddenFragments) {
    if (source.includes(fragment)) {
      problems.push(`forbidden static serving fragment is present: ${fragment}`);
    }
  }

  const staticRegistrationCount = source.match(/application\.useStaticAssets\s*\(/gu)?.length ?? 0;
  const fallbackRegistrationCount = source.match(/application\.use\s*\(/gu)?.length ?? 0;
  if (staticRegistrationCount !== 1 || fallbackRegistrationCount !== 1) {
    problems.push('authorized static serving must register exactly one asset root and one SPA fallback');
  }

  return Object.freeze(problems);
}
