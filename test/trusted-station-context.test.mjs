import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStationCredential,
  readStationCredentialCookie,
  serializeStationCredentialCookie,
  stationCredentialCookieName,
} from '../dist/modules/stations/infrastructure/http/station-credential-cookie.js';
import { localStationBootstrapCredential } from '../dist/modules/stations/infrastructure/development/local-station-bootstrap.js';
import { TrustedStationRequestContextResolver } from '../dist/modules/stations/infrastructure/http/trusted-station-request-context.resolver.js';
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

test('station browser transport is opaque, HttpOnly and secure when required', () => {
  const issued = createStationCredential();
  assert.match(issued, /^[A-Za-z0-9_-]{43}$/u);
  const secure = serializeStationCredentialCookie(issued, true);
  assert.match(secure, /^sr_station=/u);
  assert.match(secure, /; HttpOnly; SameSite=Strict; Path=\/; Secure$/u);
  assert.doesNotMatch(serializeStationCredentialCookie(issued, false), /; Secure$/u);
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

test('request resolver rejects non-cookie context inputs and fails closed', async () => {
  const resolver = new TrustedStationRequestContextResolver(
    new ResolveTrustedStationContextUseCase({ verify: async () => verified }),
  );
  await assert.rejects(resolver.resolve({}), TrustedStationContextError);
  await assert.rejects(resolver.resolve({ cookie: ['sr_station=' + credential] }), TrustedStationContextError);
  const context = await resolver.resolve({ cookie: `other=value; sr_station=${credential}` });
  assert.equal(context.stationId, verified.stationId);
});
