import { createHash, randomBytes } from 'node:crypto';

import type { AdminSessionTokenPort } from '../../application/ports/admin-session-token.port.js';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/u;

export class AdminSessionTokenInputError extends Error {
  readonly code = 'ADMIN_SESSION_CREDENTIAL_INVALID';

  constructor() {
    super('Administrative Session credential is invalid.');
    this.name = 'AdminSessionTokenInputError';
  }
}

function digest(value: string): Uint8Array {
  if (!tokenPattern.test(value)) throw new AdminSessionTokenInputError();
  return createHash('sha256').update(value, 'utf8').digest();
}

export class NodeAdminSessionToken implements AdminSessionTokenPort {
  issue() {
    const bearer = randomBytes(32).toString('base64url');
    const csrf = randomBytes(32).toString('base64url');
    return Object.freeze({
      bearer,
      bearerVerifier: digest(bearer),
      csrf,
      csrfVerifier: digest(csrf),
    });
  }

  digestBearer(value: string): Uint8Array { return digest(value); }
  digestCsrf(value: string): Uint8Array { return digest(value); }
}
