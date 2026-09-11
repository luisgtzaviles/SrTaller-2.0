import type {
  CustomerIntakeInput,
  CustomerIntakeRecord,
  CustomerSearchCandidate,
} from '../../index.js';

export interface CustomerPersistenceScope {
  readonly tenantId: string;
  readonly branchId: string;
}

/** Customer-owned persistence port behind the public Intake runtime. */
export interface CustomerIntakePersistencePort {
  search(
    scope: CustomerPersistenceScope,
    query: string,
  ): Promise<readonly CustomerSearchCandidate[]>;
  resolveSelectedOrCreate(
    scope: CustomerPersistenceScope,
    input: CustomerIntakeInput,
    transactionContext: object,
  ): Promise<CustomerIntakeRecord>;
}
