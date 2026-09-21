import type { AdminSessionTokenMaterial } from '../../domain/admin-session.js';

export interface AdminSessionTokenPort {
  issue(): AdminSessionTokenMaterial;
  digestBearer(value: string): Uint8Array;
  digestCsrf(value: string): Uint8Array;
}
