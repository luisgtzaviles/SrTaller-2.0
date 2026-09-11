import { argon2, createHmac, randomBytes } from 'node:crypto';

import {
  LOCAL_OWNER_USER_ID,
  LOCAL_SEED_TIMESTAMP,
  LOCAL_TENANT_ID,
  assertLocalTarget,
} from './local-development.mjs';

const profile = Object.freeze({
  algorithm: 'argon2id',
  memoryKiB: 65_536,
  passes: 3,
  parallelism: 4,
  profileVersion: 1,
  pepperVersion: 1,
  saltLength: 16,
  tagLength: 32,
});

const definitions = Object.freeze([
  Object.freeze({
    userId: '00000000-0000-4000-8000-000000000501',
    credentialId: '00000000-0000-4000-8000-000000000801',
    clientRequestId: '00000000-0000-4000-8000-000000000811',
    environmentKey: 'SR_LOCAL_PIN_JORGE',
  }),
  Object.freeze({
    userId: '00000000-0000-4000-8000-000000000502',
    credentialId: '00000000-0000-4000-8000-000000000802',
    clientRequestId: '00000000-0000-4000-8000-000000000812',
    environmentKey: 'SR_LOCAL_PIN_MARIA',
  }),
  Object.freeze({
    userId: '00000000-0000-4000-8000-000000000503',
    credentialId: '00000000-0000-4000-8000-000000000803',
    clientRequestId: '00000000-0000-4000-8000-000000000813',
    environmentKey: 'SR_LOCAL_PIN_CARLOS',
  }),
  Object.freeze({
    userId: LOCAL_OWNER_USER_ID,
    credentialId: '00000000-0000-4000-8000-000000000804',
    clientRequestId: '00000000-0000-4000-8000-000000000814',
    environmentKey: 'SR_LOCAL_PIN_LUIS',
  }),
]);

function derivePin(pin, salt, pepper, userId, purpose) {
  const message = Buffer.from(pin, 'ascii');
  const secret = Buffer.from(pepper);
  const associatedData = Buffer.from(
    `srtaller-pin-${purpose}\0v1\0${LOCAL_TENANT_ID}\0${userId}`,
    'utf8',
  );
  return new Promise((resolve, reject) => {
    argon2(
      profile.algorithm,
      {
        message,
        nonce: salt,
        memory: profile.memoryKiB,
        passes: profile.passes,
        parallelism: profile.parallelism,
        tagLength: profile.tagLength,
        secret,
        associatedData,
      },
      (error, verifier) => {
        message.fill(0);
        secret.fill(0);
        associatedData.fill(0);
        if (error) reject(new Error('Local PIN fixture derivation failed.'));
        else resolve(verifier);
      },
    );
  });
}

function provisioningFingerprintSalt(pepper, userId, clientRequestId) {
  const digest = createHmac('sha256', pepper)
    .update(
      `srtaller-pin-provision-salt\0v1\0${LOCAL_TENANT_ID}\0${userId}\0${clientRequestId}`,
      'utf8',
    )
    .digest();
  try {
    return Buffer.from(digest.subarray(0, profile.saltLength));
  } finally {
    digest.fill(0);
  }
}

function lookupDigest(pepper, pin) {
  return createHmac('sha256', pepper)
    .update('srtaller-pin-lookup\0v1\0', 'utf8')
    .update(LOCAL_TENANT_ID, 'utf8')
    .update('\0', 'utf8')
    .update(pin, 'ascii')
    .digest();
}

function decodePepper(value) {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(value)) {
    throw new Error('Local PIN fixture configuration is invalid.');
  }
  const pepper = Buffer.from(value, 'base64url');
  if (pepper.length !== 32 || pepper.toString('base64url') !== value) {
    pepper.fill(0);
    throw new Error('Local PIN fixture configuration is invalid.');
  }
  return pepper;
}

export async function localPinCredentialRows(values) {
  assertLocalTarget(values);
  const pepper = decodePepper(values.SR_PIN_PEPPER);
  const rows = [];
  const assignedPins = new Set();
  try {
    for (const definition of definitions) {
      const configuredPin = values[definition.environmentKey];
      if (typeof configuredPin !== 'string' || !/^[0-9]{4}(?:[0-9]{2})?$/u.test(configuredPin)) {
        throw new Error('Local PIN fixture configuration is invalid.');
      }
      // Existing local environments used six-digit fixtures. Preserve those
      // environments without exposing the value by canonically migrating the
      // last four digits to the Owner-approved PIN-only contract.
      const pin = configuredPin.slice(-4);
      if (assignedPins.has(pin)) {
        throw new Error('Local PIN fixture configuration is ambiguous.');
      }
      assignedPins.add(pin);
      const salt = randomBytes(profile.saltLength);
      let verifier;
      let fingerprintSalt;
      let requestFingerprint;
      let pinLookupDigest;
      try {
        verifier = await derivePin(
          pin,
          salt,
          pepper,
          definition.userId,
          'credential',
        );
        fingerprintSalt = provisioningFingerprintSalt(
          pepper,
          definition.userId,
          definition.clientRequestId,
        );
        requestFingerprint = await derivePin(
          pin,
          fingerprintSalt,
          pepper,
          definition.userId,
          'provision-fingerprint',
        );
        pinLookupDigest = lookupDigest(pepper, pin);
        rows.push(Object.freeze({
          tenantId: LOCAL_TENANT_ID,
          userId: definition.userId,
          credentialId: definition.credentialId,
          clientRequestId: definition.clientRequestId,
          existingUserOnly: definition.existingUserOnly === true,
          algorithm: profile.algorithm,
          profileVersion: profile.profileVersion,
          pepperVersion: profile.pepperVersion,
          memoryKiB: profile.memoryKiB,
          passes: profile.passes,
          parallelism: profile.parallelism,
          salt: Buffer.from(salt),
          verifier: Buffer.from(verifier),
          lookupDigest: Buffer.from(pinLookupDigest),
          requestFingerprint: Buffer.from(requestFingerprint),
          createdAt: LOCAL_SEED_TIMESTAMP,
        }));
      } finally {
        salt.fill(0);
        verifier?.fill(0);
        fingerprintSalt?.fill(0);
        requestFingerprint?.fill(0);
        pinLookupDigest?.fill(0);
      }
    }
    return Object.freeze(rows);
  } finally {
    pepper.fill(0);
  }
}

export const LOCAL_PIN_FIXTURE_PROFILE = profile;
