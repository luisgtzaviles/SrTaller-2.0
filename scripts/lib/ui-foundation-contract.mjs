import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const FRONTEND_ROOT = 'apps/dev-preview-web';
const SOURCE_ROOT = `${FRONTEND_ROOT}/src`;
const TOKEN_FILE = `${SOURCE_ROOT}/styles/tokens.css`;
const BASE_FILE = `${SOURCE_ROOT}/styles/base.css`;
const LEGACY_FILE = `${SOURCE_ROOT}/styles.css`;
const BULK_GRID_LAYOUT_FILE = `${SOURCE_ROOT}/pages/bulk-catalog-grid-layout.ts`;
const ALLOWED_BREAKPOINTS = new Set(['640', '768', '1024', '1280']);
const BRAND_ROLE_TOKENS = Object.freeze([
  'base', 'on-base', 'action', 'action-hover', 'action-active', 'subtle', 'muted', 'surface',
  'surface-raised', 'surface-hover', 'surface-active', 'border', 'contrast',
  'focus', 'surface-focus',
]);
const BRAND_CHROME_TOKENS = Object.freeze([
  'chrome', 'chrome-hover', 'chrome-active', 'chrome-border', 'chrome-muted',
]);
const ALLOWED_RADIUS_VALUES = new Set([
  '0',
  'var(--radius-sm)',
  'var(--radius-md)',
  'var(--radius-lg)',
  'var(--radius-full)',
]);
const ICON_LIBRARY_PATTERN = /(?:^|\/)(?:@fortawesome|@heroicons|@iconify|@mui\/icons-material|@phosphor-icons\/react|@tabler\/icons-react|fontawesome|heroicons|iconoir|lucide|phosphor|react-feather|react-icons|remixicon|tabler-icons)(?:$|[-/])/iu;
const CSS_NAMED_COLORS = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(' '));
const REDUCED_MOTION_EXCEPTION = `@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`;
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
      const value = match[1]?.trim() ?? '';
      if (!ALLOWED_RADIUS_VALUES.has(value)) problems.push(`${path}: component radius must use 0 or a canonical radius token; received ${value}`);
    }
  }
  if (path.endsWith('.module.css') && /font-weight:\s*\d+/gu.test(source)) {
    problems.push(`${path}: component font weight must consume a token`);
  }
  if (path.endsWith('.module.css') && /(?:animation|transition)(?:-[a-z-]+)?:\s*[^;]*(?:\d+(?:\.\d+)?m?s)/gu.test(source)) {
    problems.push(`${path}: component motion must consume a duration token`);
  }
  if (source.includes('!important')) {
    const sourceWithoutException = path === BASE_FILE
      ? source.replace(REDUCED_MOTION_EXCEPTION, '')
      : source;
    if (sourceWithoutException.includes('!important')) {
      problems.push(`${path}: !important is only allowed in the exact reduced-motion base exception`);
    }
  }
  if (path !== TOKEN_FILE && /(^|\n)\s*--[a-z0-9-]+\s*:/gu.test(source)) {
    problems.push(`${path}: token declaration outside the canonical token file`);
  }
  if (path !== TOKEN_FILE && /var\(--color-(?:accent(?:-[a-z-]+)?|on-accent|focus)\)/gu.test(source)) {
    problems.push(`${path}: legacy accent token bypasses the semantic brand contract`);
  }
  for (const match of source.matchAll(/(?:^|[;{])\s*(?:background|border(?:-(?:top|right|bottom|left))?|color|fill|outline-color|stroke)\s*:\s*([^;}]+)/gimu)) {
    const words = match[1]?.toLowerCase().match(/[a-z]+/gu) ?? [];
    const namedColor = words.find((word) => CSS_NAMED_COLORS.has(word));
    if (namedColor) problems.push(`${path}: hardcoded named color ${namedColor} outside the token source`);
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
  if (source.includes('.style.setProperty') && ![`${SOURCE_ROOT}/foundation/theme.tsx`, BULK_GRID_LAYOUT_FILE].includes(path)) {
    problems.push(`${path}: dynamic root accent is the only style mutation exception`);
  }
  if (/\.style\.(?!setProperty\b)/gu.test(source)) problems.push(`${path}: direct style mutation is forbidden`);
  if (!path.includes('/catalog/')) {
    for (const line of source.split('\n')) {
      if (/^\s*import\b/gu.test(line) && /\/catalog\//gu.test(line)) problems.push(`${path}: catalog code must never be imported eagerly`);
    }
  }
}

export async function validateUiFoundation(root = process.cwd()) {
  const problems = [];
  if (await exists(root, LEGACY_FILE)) problems.push(`${LEGACY_FILE}: legacy foundation still exists`);
  const files = await listFiles(root, SOURCE_ROOT);
  const mainSource = await readFile(resolve(root, `${SOURCE_ROOT}/main.tsx`), 'utf8');
  const tokenSource = await readFile(resolve(root, TOKEN_FILE), 'utf8');
  const themeSource = await readFile(resolve(root, `${SOURCE_ROOT}/foundation/theme.tsx`), 'utf8');
  const bulkGridLayoutSource = await readFile(resolve(root, BULK_GRID_LAYOUT_FILE), 'utf8');
  if (!mainSource.includes("import './styles/base.css';")) problems.push('main.tsx must import the single global base entry');
  if (!mainSource.includes('<ThemeProvider>')) problems.push('main.tsx must install ThemeProvider before rendering the app');
  for (const role of BRAND_ROLE_TOKENS) {
    const token = `--color-brand-${role}`;
    if (!tokenSource.includes(`${token}:`)) problems.push(`${TOKEN_FILE}: missing semantic brand token ${token}`);
    if (!themeSource.includes(`setProperty('${token}'`)) problems.push(`theme.tsx must inject semantic brand token ${token}`);
  }
  for (const role of BRAND_CHROME_TOKENS) {
    const token = `--color-brand-${role}`;
    if (!tokenSource.includes(`${token}:`)) problems.push(`${TOKEN_FILE}: missing semantic brand chrome token ${token}`);
  }
  const bulkGridProperties = [...bulkGridLayoutSource.matchAll(/\.style\.setProperty\('([^']+)'/gu)].map((match) => match[1]);
  if (bulkGridProperties.length !== 5 || bulkGridProperties.some((property) => !['--bulk-grid-columns', '--bulk-grid-width', '--bulk-grid-height', '--bulk-grid-offset'].includes(property))) {
    problems.push(`${BULK_GRID_LAYOUT_FILE}: dynamic layout may set only the governed bulk grid custom properties`);
  }

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
  if (manifest.dependencies?.['lucide-react'] !== '1.31.0') problems.push('lucide-react must remain pinned to governed version 1.31.0');
  const iconDependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
    .filter((name) => ICON_LIBRARY_PATTERN.test(name));
  if (iconDependencies.length !== 1 || iconDependencies[0] !== 'lucide-react') problems.push('exactly one functional icon dependency is allowed');

  const appSource = await readFile(resolve(root, `${SOURCE_ROOT}/App.tsx`), 'utf8');
  const catalogLazyImportCount = appSource.match(/lazy\(\(\) => import\('\.\/catalog\/UiCatalogPage\.js'\)\)/gu)?.length ?? 0;
  if (catalogLazyImportCount !== 1) problems.push(`catalog must have exactly one lazy import, found ${catalogLazyImportCount}`);
  if (!appSource.includes('__UI_CATALOG_ENABLED__')) problems.push('catalog route must be guarded by the build policy');
  return Object.freeze(problems);
}

export function findLegacyBundleMarkers(source) {
  return Object.freeze(LEGACY_MARKERS.filter((marker) => source.toLowerCase().includes(marker.toLowerCase())));
}
