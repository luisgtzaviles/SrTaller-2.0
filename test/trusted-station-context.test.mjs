import assert from 'node:assert/strict';
import test from 'node:test';

import {
  readStationCredentialCookie,
  stationCredentialCookieName,
} from '../dist/modules/stations/index.js';
import {
  ResolveTrustedStationContextUseCase,
  TrustedStationContextError,
} from '../dist/modules/stations/application/use-cases/resolve-trusted-station-context.js';

const credential = 'A'.repeat(43);
const verified = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001',
  branchId: '20000000-0000-4000-8000-000000000002',
  stationId: '30000000-0000-4000-8000-000000000003',
});

test('station cookie accepts only the server-issued opaque credential', () => {
  assert.equal(readStationCredentialCookie(`${stationCredentialCookieName}=${credential}`), credential);
  assert.equal(readStationCredentialCookie(`${stationCredentialCookieName}=short`), null);
  assert.equal(readStationCredentialCookie(undefined), null);
});

test('trusted station context fails closed without a recognized credential', async () => {
  const resolver = new ResolveTrustedStationContextUseCase({
    verify: async () => null,
  });
  await assert.rejects(resolver.execute(null), TrustedStationContextError);
  await assert.rejects(resolver.execute(credential), TrustedStationContextError);
});

test('trusted station context only derives its scope from the verifier', async () => {
  const resolver = new ResolveTrustedStationContextUseCase({
    verify: async () => verified,
  });
  const context = await resolver.execute(credential);
  assert.deepEqual(
    { tenantId: context.tenantId, branchId: context.branchId, stationId: context.stationId, source: context.source },
    { ...verified, source: 'server-verified-station-cookie' },
  );
  assert.ok(Object.isFrozen(context));
});
