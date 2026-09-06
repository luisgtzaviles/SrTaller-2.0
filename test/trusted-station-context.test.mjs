import assert from 'node:assert/strict';
import test from 'node:test';

import {
  readStationCredentialCookie,
  stationCredentialCookieName,
  localStationBootstrapCredential,
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

test('local bootstrap cannot silently escape development', () => {
  assert.throws(() => localStationBootstrapCredential({ NODE_ENV: 'production', SR_DB_ENVIRONMENT: 'production', SR_STATION_BOOTSTRAP_SECRET: 'a'.repeat(32) }));
  assert.throws(() => localStationBootstrapCredential({ NODE_ENV: 'development', SR_DB_ENVIRONMENT: 'development' }));
  const value = localStationBootstrapCredential({ NODE_ENV: 'development', SR_DB_ENVIRONMENT: 'development', SR_STATION_BOOTSTRAP_SECRET: 'a'.repeat(32) });
  assert.match(value, /^[A-Za-z0-9_-]{43}$/u);
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
