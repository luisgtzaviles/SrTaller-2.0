import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tenantId = '10000000-0000-4000-8000-000000000025';
const otherTenantId = '10000000-0000-4000-8000-000000000026';
const userId = '40000000-0000-4000-8000-000000000025';
const otherUserId = '40000000-0000-4000-8000-000000000026';
const clientRequestId = '60000000-0000-4000-8000-000000000025';
const pin = '270625';
const pepper = Buffer.alloc(32, 0x25).toString('base64url');

test('PBI-025 persists a separate tenant/User credential with governed lock and rate-limit state', async () => {
  const migration = await readFile(
    'src/infrastructure/database/migrations/20260907010000_access_create_pin_credentials.ts',
    'utf8',
  );

  assert.match(migration, /createTable\('access_pin_credentials'\)/u);
  assert.match(
    migration,
    /addPrimaryKeyConstraint\('access_pin_credentials_pk', \[\s*'tenant_id',\s*'user_id',?\s*\]\)/u,
  );
  assert.match(
    migration,
    /\['tenant_id', 'user_id'\][\s\S]*'users'[\s\S]*\['tenant_id', 'user_id'\]/u,
  );
  assert.match(migration, /algorithm = 'argon2id'/u);
  assert.match(migration, /memory_kib = 65536/u);
  assert.match(migration, /passes = 3/u);
  assert.match(migration, /parallelism = 4/u);
  assert.match(migration, /octet_length\(salt\) = 16/u);
  assert.match(migration, /octet_length\(verifier\) = 32/u);
  assert.match(migration, /consecutive_failures between 0 and 5/u);
  assert.match(migration, /createTable\('access_pin_attempt_limits'\)/u);
  assert.match(
    migration,
    /createTable\('access_pin_attempt_station_guards'\)/u,
  );
  assert.match(
    migration,
    /addPrimaryKeyConstraint\('access_pin_attempt_limits_pk', \[\s*'tenant_id',\s*'station_id',\s*'rate_principal_id',?\s*\]\)/u,
  );
  assert.match(
    migration,
    /\['tenant_id', 'station_id'\][\s\S]*'stations'[\s\S]*\['tenant_id', 'station_id'\]/u,
  );
  const repository = await readFile(
    'src/modules/access/infrastructure/persistence/kysely-pin-credential.repository.ts',
    'utf8',
  );
  assert.match(repository, /maxRatePrincipalsPerStation = 1_024/u);
  assert.match(repository, /deleteFrom\('access_pin_attempt_limits'\)/u);
  assert.match(
    repository,
    /access_pin_attempt_station_guards'[\s\S]*forUpdate\(\)/u,
  );
  assert.doesNotMatch(migration, /addColumn\(['"]pin['"]/iu);
});

test('PIN authentication remains server-only and does not absorb Session or authorization', async () => {
  const authenticate = await readFile(
    'src/modules/access/application/use-cases/authenticate-pin.use-case.ts',
    'utf8',
  );
  const provisioning = await readFile(
    'src/modules/access/application/use-cases/provision-pin-credential.use-case.ts',
    'utf8',
  );
  const proof = await readFile(
    'src/modules/access/domain/pin-credential.ts',
    'utf8',
  );
  const accessModule = await readFile(
    'src/modules/access/access.module.ts',
    'utf8',
  );

  assert.match(authenticate, /parseTrustedPinContext/u);
  assert.match(authenticate, /findAuthenticationUser/u);
  assert.match(authenticate, /user\?\.status === 'active'/u);
  assert.match(authenticate, /PIN_AUTHENTICATION_DENIED/u);
  assert.match(provisioning, /Server-only provisioning seam/u);
  assert.doesNotMatch(
    `${authenticate}\n${provisioning}\n${accessModule}`,
    /@Controller|@Get|@Post|@Patch|@Delete/gu,
  );
  assert.doesNotMatch(proof, /sessionId|capabilities|roleIds/u);
  assert.doesNotMatch(
    `${authenticate}\n${provisioning}`,
    /createSession|authorizeCapability|resolveEffectiveCapabilities/u,
  );
});

test('Argon2id profile is explicit, peppered, context-bound, bounded and redacted', async () => {
  const hasherSource = await readFile(
    'src/modules/access/infrastructure/security/node-argon2-pin-hasher.ts',
    'utf8',
  );
  const configuration = await readFile(
    'src/infrastructure/config/external-configuration.ts',
    'utf8',
  );

  assert.match(hasherSource, /argon2\(\s*'argon2id'/u);
  assert.match(hasherSource, /secret,/u);
  assert.match(hasherSource, /associatedData: context/u);
  assert.match(hasherSource, /randomBytes\(PIN_KDF_PROFILE\.saltLength\)/u);
  assert.match(hasherSource, /provisioningFingerprintSalt/u);
  assert.match(hasherSource, /srtaller-pin-rate-principal/u);
  assert.match(
    hasherSource,
    /requestFingerprint = await this\.#derive\([\s\S]*'provision-fingerprint'/u,
  );
  assert.doesNotMatch(
    hasherSource,
    /srtaller-pin-provision-salt[^\n]*input\.pin/u,
  );
  assert.match(hasherSource, /timingSafeEqual\(actual, expected\)/u);
  assert.match(hasherSource, /BoundedArgon2WorkLimiter/u);
  assert.match(
    hasherSource,
    /const defaultArgon2WorkLimiter = new BoundedArgon2WorkLimiter\(2, 8\)/u,
  );
  assert.match(hasherSource, /PIN_HASHING_CAPACITY_EXHAUSTED/u);
  assert.match(
    hasherSource,
    /const next = this\.#queued\.shift\(\);[\s\S]*if \(next\) next\(\);[\s\S]*else this\.#active -= 1/u,
  );
  assert.doesNotMatch(
    hasherSource,
    /this\.#active -= 1;\s*this\.#queued\.shift\(\)\?\.\(\)/u,
  );
  assert.match(hasherSource, /loadRequiredServerSecrets\(environment, \['SR_PIN_PEPPER'\]\)/u);
  assert.match(hasherSource, /pepper: '\[REDACTED\]'/u);
  assert.match(
    configuration,
    /name: 'SR_PIN_PEPPER'[\s\S]*consumer: 'access'[\s\S]*status: 'active'[\s\S]*clientExposure: 'forbidden'/u,
  );
});

test('Node Argon2id hasher protects, binds and verifies PIN material without diagnostic disclosure', async () => {
  const {
    NodeArgon2PinHasher,
    PinHashingError,
    createNodeArgon2PinHasher,
  } = await import(
    '../dist/modules/access/infrastructure/security/node-argon2-pin-hasher.js'
  );

  const hasher = new NodeArgon2PinHasher(pepper);
  const ratePrincipal = hasher.rateLimitPrincipalId({ tenantId, userId });
  assert.match(ratePrincipal, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  assert.equal(
    hasher.rateLimitPrincipalId({ tenantId, userId }),
    ratePrincipal,
  );
  assert.notEqual(
    hasher.rateLimitPrincipalId({ tenantId, userId: otherUserId }),
    ratePrincipal,
  );
  assert.notEqual(
    hasher.rateLimitPrincipalId({ tenantId: otherTenantId, userId }),
    ratePrincipal,
  );
  assert.notEqual(ratePrincipal, userId);
  const first = await hasher.hash({
    tenantId,
    userId,
    clientRequestId,
    pin,
  });
  const second = await hasher.hash({
    tenantId,
    userId,
    clientRequestId,
    pin,
  });
  const differentPin = await hasher.hash({
    tenantId,
    userId,
    clientRequestId,
    pin: '270626',
  });
  const differentRequest = await hasher.hash({
    tenantId,
    userId,
    clientRequestId: '60000000-0000-4000-8000-000000000026',
    pin,
  });

  assert.equal(first.algorithm, 'argon2id');
  assert.deepEqual(
    {
      profileVersion: first.profileVersion,
      pepperVersion: first.pepperVersion,
      memoryKiB: first.memoryKiB,
      passes: first.passes,
      parallelism: first.parallelism,
      saltLength: first.salt.byteLength,
      verifierLength: first.verifier.byteLength,
      fingerprintLength: first.requestFingerprint.byteLength,
    },
    {
      profileVersion: 1,
      pepperVersion: 1,
      memoryKiB: 65_536,
      passes: 3,
      parallelism: 4,
      saltLength: 16,
      verifierLength: 32,
      fingerprintLength: 32,
    },
  );
  assert.notDeepEqual(first.salt, second.salt);
  assert.notDeepEqual(first.verifier, second.verifier);
  assert.deepEqual(first.requestFingerprint, second.requestFingerprint);
  assert.notDeepEqual(first.requestFingerprint, differentPin.requestFingerprint);
  assert.notDeepEqual(first.requestFingerprint, differentRequest.requestFingerprint);
  assert.equal(
    await hasher.verify({ tenantId, userId, pin, stored: first }),
    true,
  );
  assert.equal(
    await hasher.verify({ tenantId, userId, pin: '270626', stored: first }),
    false,
  );
  assert.equal(
    await hasher.verify({ tenantId: otherTenantId, userId, pin, stored: first }),
    false,
  );
  assert.equal(
    await hasher.verify({ tenantId, userId: otherUserId, pin, stored: first }),
    false,
  );
  assert.equal(
    await new NodeArgon2PinHasher(
      Buffer.alloc(32, 0x26).toString('base64url'),
    ).verify({ tenantId, userId, pin, stored: first }),
    false,
  );
  assert.equal(
    await hasher.verify({
      tenantId,
      userId,
      pin,
      stored: Object.freeze({ ...first, passes: 2 }),
    }),
    false,
  );
  assert.equal(
    await hasher.verify({ tenantId, userId, pin, stored: null }),
    false,
  );

  const rendered = `${JSON.stringify(hasher)}\n${inspect(hasher)}`;
  assert.match(rendered, /\[REDACTED\]/u);
  assert.doesNotMatch(rendered, new RegExp(`${pepper}|${pin}`, 'u'));
  assert.ok(createNodeArgon2PinHasher({ SR_PIN_PEPPER: pepper }));
  assert.throws(
    () => new NodeArgon2PinHasher('not-a-valid-pepper'),
    (error) =>
      error instanceof PinHashingError &&
      error.code === 'PIN_HASHING_CONFIGURATION_INVALID' &&
      !JSON.stringify(error).includes('not-a-valid-pepper'),
  );

  for (const limits of [
    { maxActive: 0 },
    { maxActive: 1.5 },
    { maxQueued: -1 },
    { maxQueued: 1.5 },
  ]) {
    assert.throws(
      () => new NodeArgon2PinHasher(pepper, limits),
      (error) =>
        error instanceof PinHashingError &&
        error.code === 'PIN_HASHING_CONFIGURATION_INVALID',
    );
  }

  const noQueueHasher = new NodeArgon2PinHasher(pepper, {
    maxActive: 1,
    maxQueued: 0,
  });
  const activeHash = noQueueHasher.hash({
    tenantId,
    userId,
    clientRequestId,
    pin,
  });
  await assert.rejects(
    noQueueHasher.hash({
      tenantId,
      userId,
      clientRequestId,
      pin,
    }),
    (error) =>
      error instanceof PinHashingError &&
      error.code === 'PIN_HASHING_CAPACITY_EXHAUSTED',
  );
  await activeHash;

  const sharedCapacityA = new NodeArgon2PinHasher(pepper);
  const sharedCapacityB = new NodeArgon2PinHasher(pepper);
  const activeAndQueued = Array.from({ length: 10 }, () =>
    sharedCapacityA.hash({ tenantId, userId, clientRequestId, pin }),
  );
  await assert.rejects(
    sharedCapacityB.hash({ tenantId, userId, clientRequestId, pin }),
    (error) =>
      error instanceof PinHashingError &&
      error.code === 'PIN_HASHING_CAPACITY_EXHAUSTED',
  );
  await Promise.all(activeAndQueued);
});
