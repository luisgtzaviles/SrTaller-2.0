import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  EXPECTED_NODE_VERSION,
  EXPECTED_PNPM_VERSION,
  parsePnpmVersion,
  readJson,
  validateRuntimeFacts,
} from '../scripts/lib/toolchain-contract.mjs';

test('accepted runtime facts pass and incompatible facts fail', () => {
  assert.deepEqual(
    validateRuntimeFacts({
      nodeVersion: EXPECTED_NODE_VERSION,
      packageManagerVersion: EXPECTED_PNPM_VERSION,
    }),
    [],
  );

  assert.equal(
    validateRuntimeFacts({
      nodeVersion: '25.9.0',
      packageManagerVersion: EXPECTED_PNPM_VERSION,
    }).length,
    1,
  );

  assert.equal(
    validateRuntimeFacts({
      nodeVersion: EXPECTED_NODE_VERSION,
      packageManagerVersion: '11.15.0',
    }).length,
    1,
  );

  assert.equal(
    parsePnpmVersion('pnpm/11.15.1 npm/? node/v24.18.0 darwin arm64'),
    EXPECTED_PNPM_VERSION,
  );
  assert.equal(parsePnpmVersion('npm/11.0.0 node/v24.18.0 darwin arm64'), undefined);
});

test('package manifest pins the accepted baseline and blocks lifecycle scripts', async () => {
  const packageManifest = await readJson('package.json');
  const previewManifest = await readJson('apps/dev-preview-web/package.json');
  const supplyChainPolicy = await readJson('supply-chain-policy.json');
  const workspaceManifest = await readFile('pnpm-workspace.yaml', 'utf8');

  assert.equal(packageManifest.engines.node, EXPECTED_NODE_VERSION);
  assert.equal(packageManifest.engines.pnpm, EXPECTED_PNPM_VERSION);
  assert.equal(packageManifest.packageManager, `pnpm@${EXPECTED_PNPM_VERSION}`);
  assert.equal(packageManifest.pnpm, undefined);
  assert.equal(supplyChainPolicy.dependencyLifecycleDefault, 'blocked');
  assert.deepEqual(supplyChainPolicy.allowlist, []);
  assert.equal(
    workspaceManifest,
    'packages:\n  - .\n  - apps/dev-preview-web\n',
  );
  assert.equal(previewManifest.dependencies.react, '19.2.8');
  assert.equal(previewManifest.devDependencies.vite, '8.2.0');
});

test('compiled startup config accepts valid values and fails closed', async () => {
  const { loadStartupConfig } = await import('../dist/startup-config.js');
  const valid = loadStartupConfig({
    HOST: '127.0.0.1',
    NODE_ENV: 'production',
    PORT: '3000',
  });

  assert.deepEqual(valid, {
    host: '127.0.0.1',
    nodeEnv: 'production',
    port: 3000,
  });
  assert.throws(() => loadStartupConfig({ HOST: '127.0.0.1', PORT: '3000' }));
  assert.throws(() =>
    loadStartupConfig({
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      PORT: 'invalid',
    }),
  );
});

test('build emits native JavaScript and external source maps without sources', async () => {
  const mainOutput = await readFile('dist/main.js', 'utf8');
  const mainMap = await readJson('dist/main.js.map');

  assert.match(mainOutput, /from '\.\/app\.module\.js'/u);
  assert.doesNotMatch(mainOutput, /\.ts(?:'|")/u);
  assert.ok(!('sourcesContent' in mainMap));
  assert.ok(mainMap.sources.every((source) => source.endsWith('.ts')));
});

test('technical shell has only the authorized health route surface', async () => {
  const sourceFiles = [
    'src/app.module.ts',
    'src/health/health.controller.ts',
    'src/health/health-readiness.service.ts',
    'src/main.ts',
    'src/startup-config.ts',
    'src/technical-shell.service.ts',
  ];
  const source = (
    await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))
  ).join('\n');

  assert.match(
    source,
    /providers: \[[\s\S]*HealthReadiness,[\s\S]*TechnicalShellService,[\s\S]*APP_FILTER[\s\S]*HttpCorrelationExceptionFilter[\s\S]*\]/u,
  );
  assert.match(source, /@Controller\(\)/u);
  assert.match(source, /@Get\('livez'\)/u);
  assert.match(source, /@Get\('readyz'\)/u);
  assert.doesNotMatch(source, /@(Post|Put|Patch|Delete)\s*\(/u);
  assert.doesNotMatch(source, /@Get\('health/u);
});
