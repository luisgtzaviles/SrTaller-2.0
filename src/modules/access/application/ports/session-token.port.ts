import type { OperationalSessionTokenMaterial } from '../../domain/operational-session.js';

export class SessionTokenInputError extends Error {
  constructor() {
    super('Session credential is invalid.');
    this.name = 'SessionTokenInputError';
  }
}

export interface SessionTokenPort {
  issue(): OperationalSessionTokenMaterial;
  verifyBearer(value: string): Uint8Array;
  verifyCsrf(value: string): Uint8Array;
}
