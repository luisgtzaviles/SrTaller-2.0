import { createHash, randomBytes } from 'node:crypto';

import { SessionTokenInputError } from '../../application/ports/session-token.port.js';
import type { SessionTokenPort } from '../../application/ports/session-token.port.js';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/u;

function verifier(value: string): Uint8Array {
  return createHash('sha256').update(value, 'utf8').digest();
}

function parse(value: string): Uint8Array {
  if (!tokenPattern.test(value)) throw new SessionTokenInputError();
  return verifier(value);
}

export class NodeSessionToken implements SessionTokenPort {
  issue() {
    const bearer = randomBytes(32).toString('base64url');
    const csrf = randomBytes(32).toString('base64url');
    return Object.freeze({
      bearer,
      bearerVerifier: verifier(bearer),
      csrf,
      csrfVerifier: verifier(csrf),
    });
  }

  verifyBearer(value: string): Uint8Array {
    return parse(value);
  }

  verifyCsrf(value: string): Uint8Array {
    return parse(value);
  }
}
