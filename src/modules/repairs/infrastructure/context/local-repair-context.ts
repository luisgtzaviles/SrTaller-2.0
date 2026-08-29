import { parseTenantId } from '../../../tenancy/index.js';
import type { RepairPersistenceScope } from '../../application/ports/repair-repository.port.js';

const LOCAL_TENANT_ID = '00000000-0000-4000-8000-000000000001';
const LOCAL_BRANCH_ID = '00000000-0000-4000-8000-000000000101';

export class LocalRepairContextError extends Error {
  constructor() {
    super('A local synthetic repairs context is unavailable outside local development.');
    this.name = 'LocalRepairContextError';
  }
}

export class LocalRepairContext {
  resolve(): RepairPersistenceScope {
    if (
      process.env.NODE_ENV !== 'development' ||
      process.env.SR_DB_ENVIRONMENT !== 'development'
    ) {
      throw new LocalRepairContextError();
    }
    return Object.freeze({
      tenantId: parseTenantId(LOCAL_TENANT_ID),
      branchId: LOCAL_BRANCH_ID,
    });
  }
}
