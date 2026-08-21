import { access, readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

import { readJson } from './lib/toolchain-contract.mjs';
import {
  authorizedHealthSurfacePath,
  validateAuthorizedHealthSurface,
} from './lib/health-surface-contract.mjs';
import {
  authorizedPreviewStaticSurfacePath,
  validateAuthorizedPreviewStaticSurface,
} from './lib/preview-static-surface-contract.mjs';

async function exists(relativePath) {
  try {
    await access(resolve(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listFiles(relativeDirectory) {
  const directory = resolve(process.cwd(), relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

const packageManifest = await readJson('package.json');
const tsconfig = await readJson('tsconfig.json');
const buildConfig = await readJson('tsconfig.build.json');
const failures = [];
const requiredScripts = [
  'verify:toolchain',
  'clean',
  'typecheck',
  'build',
  'db:migrate',
  'test',
  'start',
  'dev',
  'verify',
];

for (const scriptName of requiredScripts) {
  if (typeof packageManifest.scripts?.[scriptName] !== 'string') {
    failures.push(`Missing canonical script: ${scriptName}`);
  }
}

if (packageManifest.type !== 'module') {
  failures.push('package.json must select native ESM');
}

if (/\.(?:c|m)?ts(?:\s|$)/u.test(packageManifest.scripts?.start ?? '')) {
  failures.push('Production start must not execute TypeScript');
}

if (!/(?:^|\s)dist\/main\.js(?:\s|$)/u.test(packageManifest.scripts?.start ?? '')) {
  failures.push('Production start must execute dist/main.js');
}

if (!packageManifest.scripts?.dev?.includes('scripts/dev.mjs')) {
  failures.push('Development must use the controlled compile-watch script');
}

const compilerOptions = tsconfig.compilerOptions ?? {};
for (const [option, expected] of Object.entries({
  module: 'NodeNext',
  moduleResolution: 'NodeNext',
  strict: true,
  noImplicitAny: true,
  useUnknownInCatchVariables: true,
  noImplicitOverride: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  forceConsistentCasingInFileNames: true,
  verbatimModuleSyntax: true,
  noEmitOnError: true,
})) {
  if (compilerOptions[option] !== expected) {
    failures.push(`tsconfig compilerOptions.${option} is not ${String(expected)}`);
  }
}

if (compilerOptions.rootDir !== 'src' || compilerOptions.outDir !== 'dist') {
  failures.push('TypeScript source/output directories must be src and dist');
}

if (
  buildConfig.compilerOptions?.sourceMap !== true ||
  buildConfig.compilerOptions?.inlineSourceMap !== false ||
  buildConfig.compilerOptions?.inlineSources !== false
) {
  failures.push('Build source maps must be external and exclude inline sources');
}

for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, version] of Object.entries(packageManifest[section] ?? {})) {
    if (!/^\d+\.\d+\.\d+$/u.test(version)) {
      failures.push(`${section}.${name} is not pinned to an exact release`);
    }
  }
}

for (const forbiddenPath of [
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
]) {
  if (await exists(forbiddenPath)) {
    failures.push(`Forbidden root artifact detected: ${forbiddenPath}`);
  }
}

const workspaceManifest = await readFile(
  resolve(process.cwd(), 'pnpm-workspace.yaml'),
  'utf8',
);
if (workspaceManifest !== 'packages:\n  - .\n  - apps/dev-preview-web\n') {
  failures.push(
    'pnpm-workspace.yaml must contain only the root and authorized app packages',
  );
}

const sourceFiles = await listFiles('src');
let healthSurfaceFound = false;
let previewStaticSurfaceFound = false;
for (const sourceFile of sourceFiles) {
  const sourceText = await readFile(sourceFile, 'utf8');
  if (sourceFile === authorizedHealthSurfacePath) {
    healthSurfaceFound = true;
    for (const problem of validateAuthorizedHealthSurface(sourceText)) {
      failures.push(`Unauthorized HTTP surface detected: ${problem}`);
    }
    continue;
  }
  if (sourceFile === authorizedPreviewStaticSurfacePath) {
    previewStaticSurfaceFound = true;
    for (const problem of validateAuthorizedPreviewStaticSurface(sourceText)) {
      failures.push(`Unauthorized preview static surface detected: ${problem}`);
    }
  }
}
if (!healthSurfaceFound) {
  failures.push(`Authorized health surface is missing: ${authorizedHealthSurfacePath}`);
}
if (!previewStaticSurfaceFound) {
  failures.push(
    `Authorized preview static surface is missing: ${authorizedPreviewStaticSurfacePath}`,
  );
}

if (!(await exists('dist/main.js'))) {
  failures.push('Compiled entrypoint dist/main.js is missing');
} else {
  const outputFiles = await listFiles('dist');
  for (const outputFile of outputFiles) {
    const previewAsset =
      outputFile === 'dist/public/index.html' ||
      /^dist\/public\/assets\/[A-Za-z0-9_-]+\.(?:css|js)$/u.test(outputFile);
    if (!previewAsset && !['.js', '.map'].includes(extname(outputFile))) {
      failures.push(`Unexpected build artifact: ${outputFile}`);
    }
  }

  if (!outputFiles.includes('dist/public/index.html')) {
    failures.push('Compiled preview entrypoint dist/public/index.html is missing');
  }
  if (!outputFiles.some((file) => /^dist\/public\/assets\/.+\.css$/u.test(file))) {
    failures.push('Compiled preview CSS asset is missing');
  }
  if (!outputFiles.some((file) => /^dist\/public\/assets\/.+\.js$/u.test(file))) {
    failures.push('Compiled preview JavaScript asset is missing');
  }

  for (const mapFile of outputFiles.filter((file) => file.endsWith('.js.map'))) {
    const sourceMap = await readJson(mapFile);
    if ('sourcesContent' in sourceMap) {
      failures.push(`Source map includes inline source content: ${mapFile}`);
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('DEC-004 product-root structure verified\n');
}
