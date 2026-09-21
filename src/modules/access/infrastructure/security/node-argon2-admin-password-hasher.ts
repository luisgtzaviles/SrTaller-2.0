import { argon2, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { inspect } from 'node:util';

import type {
  AdminPasswordHasherPort,
  AdminPasswordStoredVerifier,
} from '../../application/ports/admin-password-hasher.port.js';
import {
  ADMIN_PASSWORD_ACTIVE_PEPPER_VERSION,
  ADMIN_PASSWORD_KDF_PROFILE,
  parseAdminPassword,
} from '../../domain/admin-password.js';

export type AdminPasswordHashingErrorCode =
  | 'ADMIN_PASSWORD_HASHING_CAPACITY_EXHAUSTED'
  | 'ADMIN_PASSWORD_HASHING_CONFIGURATION_INVALID'
  | 'ADMIN_PASSWORD_HASHING_FAILED';

export class AdminPasswordHashingError extends Error {
  readonly category = 'Authentication';

  constructor(readonly code: AdminPasswordHashingErrorCode) {
    super('Administrative credential protection operation failed.');
    this.name = 'AdminPasswordHashingError';
  }
}

class BoundedAdminPasswordWorkLimiter {
  #active = 0;
  readonly #queued: Array<() => void> = [];

  constructor(private readonly maxActive: number, private readonly maxQueued: number) {
    if (!Number.isSafeInteger(maxActive) || maxActive < 1 || !Number.isSafeInteger(maxQueued) || maxQueued < 0) {
      throw new AdminPasswordHashingError('ADMIN_PASSWORD_HASHING_CONFIGURATION_INVALID');
    }
  }

  async run<Result>(operation: () => Promise<Result>): Promise<Result> {
    if (this.#active >= this.maxActive) {
      if (this.#queued.length >= this.maxQueued) {
        throw new AdminPasswordHashingError('ADMIN_PASSWORD_HASHING_CAPACITY_EXHAUSTED');
      }
      await new Promise<void>((resolve) => this.#queued.push(resolve));
    } else this.#active += 1;
    try {
      return await operation();
    } finally {
      const next = this.#queued.shift();
      if (next) next();
      else this.#active -= 1;
    }
  }
}

const sharedLimiter = new BoundedAdminPasswordWorkLimiter(2, 8);

function decodePepper(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(value)) {
    throw new AdminPasswordHashingError('ADMIN_PASSWORD_HASHING_CONFIGURATION_INVALID');
  }
  const pepper = Buffer.from(value, 'base64url');
  if (pepper.length !== 32 || pepper.toString('base64url') !== value) {
    pepper.fill(0);
    throw new AdminPasswordHashingError('ADMIN_PASSWORD_HASHING_CONFIGURATION_INVALID');
  }
  return pepper;
}

function context(tenantId: string, identityId: string): Buffer {
  return Buffer.from(`srtaller-admin-password\0v1\0${tenantId}\0${identityId}`, 'utf8');
}

function derive(message: Buffer, salt: Buffer, secret: Buffer, associatedData: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2('argon2id', {
      message,
      nonce: salt,
      memory: ADMIN_PASSWORD_KDF_PROFILE.memoryKiB,
      passes: ADMIN_PASSWORD_KDF_PROFILE.passes,
      parallelism: ADMIN_PASSWORD_KDF_PROFILE.parallelism,
      tagLength: ADMIN_PASSWORD_KDF_PROFILE.tagLength,
      secret,
      associatedData,
    }, (error, result) => error ? reject(error) : resolve(result));
  });
}

function validStored(value: AdminPasswordStoredVerifier | null): value is AdminPasswordStoredVerifier {
  return value !== null &&
    value.algorithm === ADMIN_PASSWORD_KDF_PROFILE.algorithm &&
    value.profileVersion === ADMIN_PASSWORD_KDF_PROFILE.profileVersion &&
    value.pepperVersion === ADMIN_PASSWORD_ACTIVE_PEPPER_VERSION &&
    value.memoryKiB === ADMIN_PASSWORD_KDF_PROFILE.memoryKiB &&
    value.passes === ADMIN_PASSWORD_KDF_PROFILE.passes &&
    value.parallelism === ADMIN_PASSWORD_KDF_PROFILE.parallelism &&
    value.salt.byteLength === ADMIN_PASSWORD_KDF_PROFILE.saltLength &&
    value.verifier.byteLength === ADMIN_PASSWORD_KDF_PROFILE.tagLength;
}

export class NodeArgon2AdminPasswordHasher implements AdminPasswordHasherPort {
  readonly #pepper: Buffer;
  readonly #limiter: BoundedAdminPasswordWorkLimiter;

  constructor(pepper: string, limits?: Readonly<{ maxActive?: number; maxQueued?: number }>) {
    this.#pepper = decodePepper(pepper);
    this.#limiter = limits
      ? new BoundedAdminPasswordWorkLimiter(limits.maxActive ?? 2, limits.maxQueued ?? 8)
      : sharedLimiter;
  }

  principalDigest(normalizedEmail: string): Uint8Array {
    return createHmac('sha256', this.#pepper)
      .update('srtaller-admin-rate-principal\0v1\0', 'utf8')
      .update(normalizedEmail, 'utf8')
      .digest();
  }

  async #derive(password: string, salt: Buffer, tenantId: string, identityId: string): Promise<Buffer> {
    const message = Buffer.from(parseAdminPassword(password), 'utf8');
    const secret = Buffer.from(this.#pepper);
    const associatedData = context(tenantId, identityId);
    try {
      return await this.#limiter.run(() => derive(message, salt, secret, associatedData));
    } catch (error: unknown) {
      if (error instanceof AdminPasswordHashingError) throw error;
      throw new AdminPasswordHashingError('ADMIN_PASSWORD_HASHING_FAILED');
    } finally {
      message.fill(0);
      secret.fill(0);
      associatedData.fill(0);
    }
  }

  async hash(input: Parameters<AdminPasswordHasherPort['hash']>[0]): Promise<AdminPasswordStoredVerifier> {
    const salt = randomBytes(ADMIN_PASSWORD_KDF_PROFILE.saltLength);
    let verifier: Buffer | undefined;
    try {
      verifier = await this.#derive(input.password, salt, input.tenantId, input.adminIdentityId);
      return Object.freeze({
        algorithm: ADMIN_PASSWORD_KDF_PROFILE.algorithm,
        profileVersion: ADMIN_PASSWORD_KDF_PROFILE.profileVersion,
        pepperVersion: ADMIN_PASSWORD_ACTIVE_PEPPER_VERSION,
        memoryKiB: ADMIN_PASSWORD_KDF_PROFILE.memoryKiB,
        passes: ADMIN_PASSWORD_KDF_PROFILE.passes,
        parallelism: ADMIN_PASSWORD_KDF_PROFILE.parallelism,
        salt: Uint8Array.from(salt),
        verifier: Uint8Array.from(verifier),
      });
    } finally {
      salt.fill(0);
      verifier?.fill(0);
    }
  }

  async verify(input: Parameters<AdminPasswordHasherPort['verify']>[0]): Promise<boolean> {
    const valid = validStored(input.stored) && input.tenantId !== null && input.adminIdentityId !== null;
    const salt = valid ? Buffer.from(input.stored.salt) : Buffer.alloc(ADMIN_PASSWORD_KDF_PROFILE.saltLength, 0x6b);
    const expected = valid ? Buffer.from(input.stored.verifier) : Buffer.alloc(ADMIN_PASSWORD_KDF_PROFILE.tagLength);
    const actual = await this.#derive(input.password, salt, input.tenantId ?? '00000000-0000-4000-8000-000000000000', input.adminIdentityId ?? '00000000-0000-4000-8000-000000000000');
    try {
      return valid && timingSafeEqual(actual, expected);
    } finally {
      salt.fill(0);
      expected.fill(0);
      actual.fill(0);
    }
  }

  toJSON(): Readonly<{ algorithm: 'argon2id'; profileVersion: 1; pepper: '[REDACTED]' }> {
    return Object.freeze({ algorithm: 'argon2id', profileVersion: 1, pepper: '[REDACTED]' });
  }

  [inspect.custom](): ReturnType<NodeArgon2AdminPasswordHasher['toJSON']> {
    return this.toJSON();
  }
}
