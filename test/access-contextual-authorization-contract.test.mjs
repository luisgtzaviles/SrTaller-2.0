import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  CONTEXTUAL_AUTHORIZATION_EXECUTOR,
  ContextualAuthorizationError,
} from '../dist/modules/access/index.js';

test('public contextual authorization contract is framework-neutral and sanitized', async () => {
  const source = await readFile('src/modules/access/index.ts', 'utf8');
  assert.equal(typeof CONTEXTUAL_AUTHORIZATION_EXECUTOR, 'symbol');
  assert.equal(
    CONTEXTUAL_AUTHORIZATION_EXECUTOR.description,
    'srtaller.access.contextual-authorization-executor',
  );
  assert.deepEqual(
    new ContextualAuthorizationError('AUTHENTICATION_REQUIRED').toJSON(),
    { name: 'ContextualAuthorizationError', code: 'AUTHENTICATION_REQUIRED' },
  );
  assert.deepEqual(
    new ContextualAuthorizationError('ACCESS_DENIED').toJSON(),
    { name: 'ContextualAuthorizationError', code: 'ACCESS_DENIED' },
  );
  assert.doesNotMatch(source, /@nestjs|express|Controller|Repository|Kysely/iu);
  assert.doesNotMatch(source, /roleName|roleKey|isAdmin|administrator/iu);
  assert.match(source, /readonly tenantId: TenantId/u);
  assert.match(source, /readonly branchId: string/u);
  assert.match(source, /readonly stationId: string/u);
  assert.match(source, /readonly sessionId: string/u);
  assert.match(source, /readonly userId: string/u);
  assert.match(source, /readonly capability: CapabilityCode/u);
});

test('Access owns and exports explicit branch-context and tenant-wide authorization providers', async () => {
  const [moduleSource, executorSource, tenantWideSource] = await Promise.all([
    readFile('src/modules/access/access.module.ts', 'utf8'),
    readFile(
      'src/modules/access/presentation/contextual-authorization.executor.ts',
      'utf8',
    ),
    readFile(
      'src/modules/access/presentation/tenant-wide-authorization.executor.ts',
      'utf8',
    ),
  ]);
  assert.match(
    moduleSource,
    /provide: CONTEXTUAL_AUTHORIZATION_EXECUTOR,[\s\S]*inject: \[ACCESS_SESSION_RUNTIME\]/u,
  );
  assert.match(moduleSource, /exports: \[CONTEXTUAL_AUTHORIZATION_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR, SENSITIVE_ACTION_LEVEL2_EXECUTOR\]/u);
  assert.equal(
    (moduleSource.match(/provide: CONTEXTUAL_AUTHORIZATION_EXECUTOR/gu) ?? []).length,
    1,
  );
  assert.match(
    executorSource,
    /this\.runtime\.trustedStations\.resolve\([\s\S]*this\.runtime\.resolveSession\.execute\([\s\S]*this\.runtime\.resolveCapabilities\.execute\(/u,
  );
  assert.match(executorSource, /touch: true/u);
  assert.doesNotMatch(executorSource, /capabilit(?:y|ies)Cache|roleName|roleKey/iu);
  assert.match(
    moduleSource,
    /provide: TENANT_WIDE_AUTHORIZATION_EXECUTOR,[\s\S]*inject: \[CONTEXTUAL_AUTHORIZATION_EXECUTOR, ACCESS_SESSION_RUNTIME\]/u,
  );
  assert.match(moduleSource, /exports: \[[^\]]*TENANT_WIDE_AUTHORIZATION_EXECUTOR/u);
  assert.equal(
    (moduleSource.match(/provide: TENANT_WIDE_AUTHORIZATION_EXECUTOR/gu) ?? []).length,
    1,
  );
  assert.match(tenantWideSource, /assignment\.assignmentScope === 'TENANT_WIDE'/u);
  assert.match(tenantWideSource, /confirmCurrent/u);
  assert.doesNotMatch(tenantWideSource, /roleName|roleKey|isAdmin/iu);
});

test('session projection publishes capabilities only for an authenticated Session', async () => {
  const source = await readFile(
    'src/modules/access/presentation/access-session.controller.ts',
    'utf8',
  );
  assert.match(
    source,
    /session: null,[\s\S]*revalidateAfterMs: null/u,
  );
  assert.match(source, /capabilities: Object\.freeze\(\[\]\)/u);
  assert.equal(
    (source.match(/this\.runtime\.resolveCapabilities\.execute\(/gu) ?? []).length,
    2,
  );
});
