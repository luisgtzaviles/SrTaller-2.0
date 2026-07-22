import { AuthorizationError } from './errors.js';
import { WRITE_SYNTHETIC_RECORD, type OperationalContext } from './operational-context.js';

export class SyntheticAuthorizationPolicy {
  assertCanWrite(context: OperationalContext): void {
    if (!context.capabilities.includes(WRITE_SYNTHETIC_RECORD)) {
      throw new AuthorizationError();
    }
  }
}
