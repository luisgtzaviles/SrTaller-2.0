import {
  argon2,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { inspect } from 'node:util';

import { loadRequiredServerSecrets } from '../../../../infrastructure/config/external-configuration.js';
import { PIN_KDF_PROFILE, parsePin } from '../../domain/pin-credential.js';
import type {
  PinSecretHasherPort,
  PinSecretMaterial,
  PinStoredVerifier,
} from '../../application/ports/pin-secret-hasher.port.js';

type PinHashingErrorCode =
  | 'PIN_HASHING_CAPACITY_EXHAUSTED'
  | 'PIN_HASHING_CONFIGURATION_INVALID'
  | 'PIN_HASHING_FAILED';

export class PinHashingError extends Error {
  readonly category = 'Authentication';

  constructor(readonly code: PinHashingErrorCode) {
    super('PIN credential protection operation failed.');
    this.name = 'PinHashingError';
  }

  toJSON(): Readonly<{
    name: string;
    category: 'Authentication';
    code: PinHashingErrorCode;
    message: string;
  }> {
    return Object.freeze({
      name: this.name,
      category: this.category,
      code: this.code,
      message: this.message,
    });
  }

  [inspect.custom](): ReturnType<PinHashingError['toJSON']> {
    return this.toJSON();
  }
}

class BoundedArgon2WorkLimiter {
  #active = 0;
  readonly #queued: Array<() => void> = [];

  constructor(
    private readonly maxActive: number,
    private readonly maxQueued: number,
  ) {
    if (
      !Number.isSafeInteger(maxActive) ||
      maxActive < 1 ||
      !Number.isSafeInteger(maxQueued) ||
      maxQueued < 0
    ) {
      throw new PinHashingError('PIN_HASHING_CONFIGURATION_INVALID');
    }
  }

  async run<Result>(operation: () => Promise<Result>): Promise<Result> {
    if (this.#active >= this.maxActive) {
      if (this.#queued.length >= this.maxQueued) {
        throw new PinHashingError('PIN_HASHING_CAPACITY_EXHAUSTED');
      }
      await new Promise<void>((resolve) => this.#queued.push(resolve));
    } else {
      this.#active += 1;
    }
    try {
      return await operation();
    } finally {
      const next = this.#queued.shift();
      if (next) next();
      else this.#active -= 1;
    }
  }
}

const defaultArgon2WorkLimiter = new BoundedArgon2WorkLimiter(2, 8);

function decodePepper(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(value)) {
    throw new PinHashingError('PIN_HASHING_CONFIGURATION_INVALID');
  }
  const pepper = Buffer.from(value, 'base64url');
  if (pepper.length !== 32 || pepper.toString('base64url') !== value) {
    pepper.fill(0);
    throw new PinHashingError('PIN_HASHING_CONFIGURATION_INVALID');
  }
  return pepper;
}

type PinDerivationPurpose = 'credential' | 'provision-fingerprint';

function associatedData(
  purpose: PinDerivationPurpose,
  tenantId: string,
  userId: string,
): Buffer {
  return Buffer.from(
    `srtaller-pin-${purpose}\0v1\0${tenantId}\0${userId}`,
    'utf8',
  );
}

function provisioningFingerprintSalt(
  pepper: Buffer,
  tenantId: string,
  userId: string,
  clientRequestId: string,
): Buffer {
  const digest = createHmac('sha256', pepper)
    .update(
      `srtaller-pin-provision-salt\0v1\0${tenantId}\0${userId}\0${clientRequestId}`,
      'utf8',
    )
    .digest();
  try {
    return Buffer.from(digest.subarray(0, PIN_KDF_PROFILE.saltLength));
  } finally {
    digest.fill(0);
  }
}

function rateLimitPrincipalId(
  pepper: Buffer,
  tenantId: string,
  userId: string,
): string {
  const digest = createHmac('sha256', pepper)
    .update(`srtaller-pin-rate-principal\0v1\0${tenantId}\0${userId}`, 'utf8')
    .digest();
  try {
    const bytes = Buffer.from(digest.subarray(0, 16));
    bytes.writeUInt8((bytes.readUInt8(6) & 0x0f) | 0x40, 6);
    bytes.writeUInt8((bytes.readUInt8(8) & 0x3f) | 0x80, 8);
    const hex = bytes.toString('hex');
    bytes.fill(0);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } finally {
    digest.fill(0);
  }
}

function argon2id(
  message: Buffer,
  salt: Buffer,
  secret: Buffer,
  context: Buffer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2(
      'argon2id',
      {
        message,
        nonce: salt,
        memory: PIN_KDF_PROFILE.memoryKiB,
        passes: PIN_KDF_PROFILE.passes,
        parallelism: PIN_KDF_PROFILE.parallelism,
        tagLength: PIN_KDF_PROFILE.tagLength,
        secret,
        associatedData: context,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

function validStoredVerifier(value: PinStoredVerifier | null): value is PinStoredVerifier {
  return (
    value !== null &&
    value.algorithm === PIN_KDF_PROFILE.algorithm &&
    value.profileVersion === PIN_KDF_PROFILE.profileVersion &&
    value.pepperVersion === 1 &&
    value.memoryKiB === PIN_KDF_PROFILE.memoryKiB &&
    value.passes === PIN_KDF_PROFILE.passes &&
    value.parallelism === PIN_KDF_PROFILE.parallelism &&
    value.salt.byteLength === PIN_KDF_PROFILE.saltLength &&
    value.verifier.byteLength === PIN_KDF_PROFILE.tagLength
  );
}

export class NodeArgon2PinHasher implements PinSecretHasherPort {
  readonly #pepper: Buffer;
  readonly #limiter: BoundedArgon2WorkLimiter;

  constructor(
    pepper: string,
    limits?: Readonly<{ maxActive?: number; maxQueued?: number }>,
  ) {
    this.#limiter = limits
      ? new BoundedArgon2WorkLimiter(
          limits.maxActive ?? 2,
          limits.maxQueued ?? 8,
        )
      : defaultArgon2WorkLimiter;
    this.#pepper = decodePepper(pepper);
  }

  rateLimitPrincipalId(
    input: Parameters<PinSecretHasherPort['rateLimitPrincipalId']>[0],
  ): string {
    return rateLimitPrincipalId(this.#pepper, input.tenantId, input.userId);
  }

  async #derive(
    pin: string,
    salt: Buffer,
    tenantId: string,
    userId: string,
    purpose: PinDerivationPurpose,
  ) {
    const message = Buffer.from(parsePin(pin), 'ascii');
    const secret = Buffer.from(this.#pepper);
    const context = associatedData(purpose, tenantId, userId);
    try {
      return await this.#limiter.run(() =>
        argon2id(message, salt, secret, context),
      );
    } catch (error: unknown) {
      if (error instanceof PinHashingError) throw error;
      throw new PinHashingError('PIN_HASHING_FAILED');
    } finally {
      message.fill(0);
      secret.fill(0);
      context.fill(0);
    }
  }

  async hash(input: Parameters<PinSecretHasherPort['hash']>[0]): Promise<PinSecretMaterial> {
    const salt = randomBytes(PIN_KDF_PROFILE.saltLength);
    let verifier: Buffer | undefined;
    let fingerprintSalt: Buffer | undefined;
    let requestFingerprint: Buffer | undefined;
    try {
      verifier = await this.#derive(
        input.pin,
        salt,
        input.tenantId,
        input.userId,
        'credential',
      );
      fingerprintSalt = provisioningFingerprintSalt(
        this.#pepper,
        input.tenantId,
        input.userId,
        input.clientRequestId,
      );
      requestFingerprint = await this.#derive(
        input.pin,
        fingerprintSalt,
        input.tenantId,
        input.userId,
        'provision-fingerprint',
      );
      return Object.freeze({
        algorithm: PIN_KDF_PROFILE.algorithm,
        profileVersion: PIN_KDF_PROFILE.profileVersion,
        pepperVersion: 1,
        memoryKiB: PIN_KDF_PROFILE.memoryKiB,
        passes: PIN_KDF_PROFILE.passes,
        parallelism: PIN_KDF_PROFILE.parallelism,
        salt: Uint8Array.from(salt),
        verifier: Uint8Array.from(verifier),
        requestFingerprint: Uint8Array.from(requestFingerprint),
      });
    } finally {
      salt.fill(0);
      verifier?.fill(0);
      fingerprintSalt?.fill(0);
      requestFingerprint?.fill(0);
    }
  }

  async verify(input: Parameters<PinSecretHasherPort['verify']>[0]): Promise<boolean> {
    const valid = validStoredVerifier(input.stored);
    const salt = valid
      ? Buffer.from(input.stored.salt)
      : Buffer.alloc(PIN_KDF_PROFILE.saltLength, 0x5a);
    const expected = valid
      ? Buffer.from(input.stored.verifier)
      : Buffer.alloc(PIN_KDF_PROFILE.tagLength);
    const actual = await this.#derive(
      input.pin,
      salt,
      input.tenantId,
      input.userId,
      'credential',
    );
    try {
      const matched = timingSafeEqual(actual, expected);
      return valid && matched;
    } finally {
      salt.fill(0);
      expected.fill(0);
      actual.fill(0);
    }
  }

  toJSON(): Readonly<{
    algorithm: 'argon2id';
    profileVersion: 1;
    pepper: '[REDACTED]';
  }> {
    return Object.freeze({
      algorithm: 'argon2id',
      profileVersion: 1,
      pepper: '[REDACTED]',
    });
  }

  [inspect.custom](): ReturnType<NodeArgon2PinHasher['toJSON']> {
    return this.toJSON();
  }
}

export function createNodeArgon2PinHasher(
  environment: Readonly<Record<string, string | undefined>>,
): NodeArgon2PinHasher {
  const secrets = loadRequiredServerSecrets(environment, ['SR_PIN_PEPPER']);
  return new NodeArgon2PinHasher(secrets.get('SR_PIN_PEPPER'));
}
