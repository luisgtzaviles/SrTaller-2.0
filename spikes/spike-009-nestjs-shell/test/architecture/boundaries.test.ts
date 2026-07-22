import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { findImportCycle, inspectSource } from '../../scripts/architecture-rules.mjs';

const sourceRoot = resolve(new URL('../../src', import.meta.url).pathname);

async function sourceFiles(directory = sourceRoot): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await sourceFiles(path));
    else if (entry.name.endsWith('.ts')) result.push(path);
  }
  return result;
}

async function imports(path: string): Promise<string[]> {
  const source = await readFile(path, 'utf8');
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '');
}

describe('architecture boundaries', () => {
  it('keeps NestJS out of domain and application', async () => {
    const files = (await sourceFiles()).filter((file) => /\/synthetic\/(domain|application)\//.test(file));
    for (const file of files) {
      assert.equal((await readFile(file, 'utf8')).includes('@nestjs/'), false, relative(sourceRoot, file));
    }
  });

  it('keeps infrastructure and transport out of domain', async () => {
    const files = (await sourceFiles()).filter((file) => file.includes('/synthetic/domain/'));
    for (const file of files) {
      const dependencies = await imports(file);
      assert.equal(dependencies.some((value) => /infrastructure|transport|postgres|http/.test(value)), false);
    }
  });

  it('keeps transport DTOs inside transport', async () => {
    for (const file of await sourceFiles()) {
      if (file.endsWith('.dto.ts')) assert.match(file, /\/transport\//);
    }
  });

  it('has no ModuleRef service locator or SQL in controllers', async () => {
    for (const file of await sourceFiles()) {
      const source = await readFile(file, 'utf8');
      assert.equal(/\bModuleRef\b/.test(source), false, relative(sourceRoot, file));
      if (file.endsWith('.controller.ts')) {
        assert.equal(/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i.test(source), false, relative(sourceRoot, file));
      }
    }
  });

  it('has no relative import cycles', async () => {
    const files = await sourceFiles();
    const known = new Set(files.map(normalize));
    const graph = new Map<string, string[]>();
    for (const file of files) {
      const dependencies = (await imports(file))
        .filter((value) => value.startsWith('.'))
        .map((value) => normalize(resolve(dirname(file), value.replace(/\.js$/, '.ts'))))
        .filter((value) => known.has(value));
      graph.set(normalize(file), dependencies);
    }
    const cycle = findImportCycle(graph);
    assert.equal(cycle, undefined, cycle ? `Import cycle detected at ${relative(sourceRoot, cycle)}` : '');
  });

  it('contains only the synthetic business module', async () => {
    const topLevel = await readdir(join(sourceRoot, 'synthetic'));
    assert.deepEqual(topLevel.sort(), ['application', 'domain', 'infrastructure', 'transport']);
  });

  it('rejects controlled architecture mutations', () => {
    const nestImport = `import { Injectable } from '${'@nest' + 'js/common'}';`;
    const moduleReference = `const locator = new ${'Module' + 'Ref'}();`;
    const requestScope = `const provider = { scope: ${'Scope' + '.REQUEST'} };`;
    const controllerAdapter = `import { Store } from '../${'infrastructure'}/postgres-adapter.js';`;
    const controllerSql = `const query = '${'SEL' + 'ECT'} * FROM records';`;

    assert.notEqual(inspectSource('src/synthetic/domain/entity.ts', nestImport).length, 0);
    assert.notEqual(inspectSource('src/synthetic/application/use-case.ts', nestImport).length, 0);
    assert.notEqual(inspectSource('src/bootstrap/module.ts', moduleReference).length, 0);
    assert.notEqual(inspectSource('src/bootstrap/module.ts', requestScope).length, 0);
    assert.notEqual(inspectSource('src/synthetic/transport/http/x.controller.ts', controllerAdapter).length, 0);
    assert.notEqual(inspectSource('src/synthetic/transport/http/x.controller.ts', controllerSql).length, 0);
    assert.equal(findImportCycle(new Map([
      ['a.ts', ['b.ts']],
      ['b.ts', ['a.ts']],
    ])), 'a.ts');
  });
});
