export const ADMIN_PASSWORD_ACTIVE_PEPPER_VERSION = 1 as const;

export const ADMIN_PASSWORD_KDF_PROFILE = Object.freeze({
  algorithm: 'argon2id' as const,
  memoryKiB: 65_536,
  parallelism: 4,
  passes: 3,
  profileVersion: 1,
  saltLength: 16,
  tagLength: 32,
});

export class AdminPasswordInputError extends Error {
  readonly code = 'ADMIN_PASSWORD_INPUT_INVALID';

  constructor() {
    super('Administrative credential input is invalid.');
    this.name = 'AdminPasswordInputError';
  }
}

/** Passwords are exact UTF-8 material: never trim or normalize them. */
export function parseAdminPassword(value: unknown): string {
  if (
    typeof value !== 'string' ||
    [...value].length < 12 ||
    [...value].length > 128 ||
    Buffer.byteLength(value, 'utf8') > 512
  ) {
    throw new AdminPasswordInputError();
  }
  return value;
}
