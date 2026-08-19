import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const FRONTEND_ROOT = 'apps/dev-preview-web';
const SOURCE_ROOT = `${FRONTEND_ROOT}/src`;
const TOKEN_FILE = `${SOURCE_ROOT}/styles/tokens.css`;
const BASE_FILE = `${SOURCE_ROOT}/styles/base.css`;
const LEGACY_FILE = `${SOURCE_ROOT}/styles.css`;
const ALLOWED_BREAKPOINTS = new Set(['640', '768', '1024', '1280']);
const LEGACY_MARKERS = [
  '#ed5f2c',
  '#ff713b',
  '--sidebar-width',
  'font-family: Inter',
  '@media (max-width: 820px)',
  '@media (max-width: 560px)',
  'className="app-shell"',
  'className="topbar"',
  'className="context-bar"',
  'className="status-pill',
];

async function exists(root, relativePath) {
  try {
    await access(resolve(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root, relativeDirectory) {
  const directory = resolve(root, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await listFiles(root, relativePath));
    if (entry.isFile()) files.push(relativePath);
  }
  return files.sort();
}

function inspectCss(path, source, problems) {
  if (path !== TOKEN_FILE && /#[0-9a-f]{3,8}\b|(?:rgb|hsl|oklch)\(/iu.test(source)) {
    problems.push(`${path}: hardcoded color outside the token source`);
  }
  for (const match of source.matchAll(/@media[^\{]*(?:min|max)-width:\s*(\d+)px/giu)) {
    if (!ALLOWED_BREAKPOINTS.has(match[1])) problems.push(`${path}: non-canonical breakpoint ${match[1]}px`);
  }
  if (path.endsWith('.module.css')) {
    for (const match of source.matchAll(/border-radius:\s*([^;]+);/gu)) {
      if (!match[1]?.trim().startsWith('var(')) problems.push(`${path}: component radius must consume a token`);
    }
  }
  if (path.endsWith('.module.css') && /font-weight:\s*\d+/gu.test(source)) {
    problems.push(`${path}: component font weight must consume a token`);
  }
  if (path.endsWith('.module.css') && /(?:animation|transition)(?:-[a-z-]+)?:\s*[^;]*(?:\d+(?:\.\d+)?m?s)/gu.test(source)) {
    problems.push(`${path}: component motion must consume a duration token`);
  }
  if (path !== BASE_FILE && source.includes('!important')) {
    problems.push(`${path}: !important is only allowed in the reduced-motion base exception`);
  }
  if (path !== TOKEN_FILE && /(^|\n)\s*--[a-z0-9-]+\s*:/gu.test(source)) {
    problems.push(`${path}: token declaration outside the canonical token file`);
  }
}

function inspectTypeScript(path, source, problems) {
  if (/\bstyle\s*=\s*\{/gu.test(source)) problems.push(`${path}: inline style is forbidden`);
  if (/<svg\b/gu.test(source)) problems.push(`${path}: inline SVG bypasses governed iconography`);
  if (/DynamicIcon|import\s+\*\s+as\s+.+from\s+['"]lucide-react|import\s+\w+\s+from\s+['"]lucide-react/gu.test(source)) {
    problems.push(`${path}: Lucide must use static named imports and never DynamicIcon`);
  }
  if (source.includes("from './styles.css'") || source.includes("from \"./styles.css\"")) {
    problems.push(`${path}: legacy styles import is forbidden`);
  }
  if (source.includes('.style.setProperty') && path !== `${SOURCE_ROOT}/foundation/theme.tsx`) {
    problems.push(`${path}: dynamic root accent is the only style mutation exception`);
  }
}

export async function validateUiFoundation(root = process.cwd()) {
  const problems = [];
  if (await exists(root, LEGACY_FILE)) problems.push(`${LEGACY_FILE}: legacy foundation still exists`);
  const files = await listFiles(root, SOURCE_ROOT);
  const mainSource = await readFile(resolve(root, `${SOURCE_ROOT}/main.tsx`), 'utf8');
  if (!mainSource.includes("import './styles/base.css';")) problems.push('main.tsx must import the single global base entry');
  if (!mainSource.includes('<ThemeProvider>')) problems.push('main.tsx must install ThemeProvider before rendering the app');

  let baseImportCount = 0;
  for (const path of files) {
    if (!/\.(?:css|ts|tsx|mjs)$/u.test(path)) continue;
    const source = await readFile(resolve(root, path), 'utf8');
    if (source.includes("import './styles/base.css';")) baseImportCount += 1;
    for (const marker of LEGACY_MARKERS) {
      if (source.toLowerCase().includes(marker.toLowerCase())) problems.push(`${path}: legacy marker ${marker}`);
    }
    if (path.endsWith('.css')) inspectCss(path, source, problems);
    if (/\.(?:ts|tsx|mjs)$/u.test(path)) inspectTypeScript(path, source, problems);
    if (path.endsWith('.css') && path !== TOKEN_FILE && path !== BASE_FILE && !path.endsWith('.module.css')) {
      problems.push(`${path}: component CSS must use CSS Modules`);
    }
  }
  if (baseImportCount !== 1) problems.push(`global base stylesheet must have exactly one import, found ${baseImportCount}`);

  const manifest = JSON.parse(await readFile(resolve(root, `${FRONTEND_ROOT}/package.json`), 'utf8'));
  if (manifest.dependencies?.['lucide-react'] !== '1.32.0') problems.push('lucide-react must remain pinned to approved version 1.32.0');
  const iconDependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
    .filter((name) => /(?:lucide|icon|heroicons|fontawesome)/iu.test(name));
  if (iconDependencies.length !== 1 || iconDependencies[0] !== 'lucide-react') problems.push('exactly one functional icon dependency is allowed');

  const appSource = await readFile(resolve(root, `${SOURCE_ROOT}/App.tsx`), 'utf8');
  if (!appSource.includes("lazy(() => import('./catalog/UiCatalogPage.js'))")) problems.push('catalog must remain a lazy import');
  if (!appSource.includes('__UI_CATALOG_ENABLED__')) problems.push('catalog route must be guarded by the build policy');
  return Object.freeze(problems);
}

export function findLegacyBundleMarkers(source) {
  return Object.freeze(LEGACY_MARKERS.filter((marker) => source.toLowerCase().includes(marker.toLowerCase())));
}
