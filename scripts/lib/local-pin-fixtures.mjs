import { argon2, createHmac, randomBytes } from 'node:crypto';

import {
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
]);

function derivePin(pin, salt, pepper, userId) {
  const message = Buffer.from(pin, 'ascii');
  const secret = Buffer.from(pepper);
  const associatedData = Buffer.from(
    `srtaller-pin-credential\0v1\0${LOCAL_TENANT_ID}\0${userId}`,
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
  try {
    for (const definition of definitions) {
      const pin = values[definition.environmentKey];
      if (typeof pin !== 'string' || !/^[0-9]{6}$/u.test(pin)) {
        throw new Error('Local PIN fixture configuration is invalid.');
      }
      const salt = randomBytes(profile.saltLength);
      const verifier = await derivePin(pin, salt, pepper, definition.userId);
      const fingerprintInput = Buffer.from(
        `srtaller-pin-provision\0v1\0${LOCAL_TENANT_ID}\0${definition.userId}\0${definition.clientRequestId}\0${pin}`,
        'utf8',
      );
      try {
        rows.push(Object.freeze({
          tenantId: LOCAL_TENANT_ID,
          userId: definition.userId,
          credentialId: definition.credentialId,
          clientRequestId: definition.clientRequestId,
          algorithm: profile.algorithm,
          profileVersion: profile.profileVersion,
          pepperVersion: profile.pepperVersion,
          memoryKiB: profile.memoryKiB,
          passes: profile.passes,
          parallelism: profile.parallelism,
          salt: Buffer.from(salt),
          verifier: Buffer.from(verifier),
          requestFingerprint: createHmac('sha256', pepper)
            .update(fingerprintInput)
            .digest(),
          createdAt: LOCAL_SEED_TIMESTAMP,
        }));
      } finally {
        salt.fill(0);
        verifier.fill(0);
        fingerprintInput.fill(0);
      }
    }
    return Object.freeze(rows);
  } finally {
    pepper.fill(0);
  }
}

export const LOCAL_PIN_FIXTURE_PROFILE = profile;
