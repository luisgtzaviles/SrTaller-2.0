declare const adminIdentityIdBrand: unique symbol;

export type AdminIdentityId = string & {
  readonly [adminIdentityIdBrand]: 'AdminIdentityId';
};
export type AdminIdentityStatus = 'active' | 'revoked';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const asciiEmail = /^[\x21-\x7e]+@[\x21-\x7e]+$/u;

export class AdminIdentityInputError extends Error {
  readonly code = 'ADMIN_IDENTITY_INPUT_INVALID';

  constructor(readonly parameter: 'adminIdentityId' | 'email') {
    super('Administrative identity input is invalid.');
    this.name = 'AdminIdentityInputError';
  }
}

export function parseAdminIdentityId(value: string): AdminIdentityId {
  if (!canonicalUuid.test(value)) {
    throw new AdminIdentityInputError('adminIdentityId');
  }
  return value as AdminIdentityId;
}

export type NormalizedAdminEmail = Readonly<{
  display: string;
  normalized: string;
}>;

export function normalizeAdminEmail(value: unknown): NormalizedAdminEmail {
  if (typeof value !== 'string') throw new AdminIdentityInputError('email');
  const display = value.trim().normalize('NFC');
  if (
    display.length < 3 ||
    display.length > 254 ||
    !asciiEmail.test(display) ||
    display.startsWith('@') ||
    display.endsWith('@') ||
    display.includes('..') ||
    display.split('@').length !== 2
  ) {
    throw new AdminIdentityInputError('email');
  }
  return Object.freeze({ display, normalized: display.toLowerCase() });
}
