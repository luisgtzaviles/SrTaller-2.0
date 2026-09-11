/** Public marker for the Customer minimum boundary. */
export interface CustomersModuleContract {
  readonly module: 'customers';
}

export interface CustomerIntakeScope {
  readonly tenantId: string;
  readonly branchId: string;
}

export interface CustomerIntakeInput {
  /** A human-selected, Branch-scoped Customer. Absence means create a new identity. */
  readonly customerId: string | null;
  readonly givenName: string | null;
  readonly familyName: string | null;
  /** Repair contact to persist automatically for a new Customer or explicitly for a selected Customer. Never an identity key. */
  readonly contactPhone: string | null;
  /** Explicit command for a selected Customer. New Customers persist their initial contact without this flag. */
  readonly addCustomerContactPhone: boolean;
}

export interface CustomerIntakeRecord {
  readonly customerId: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly givenName: string;
  readonly familyName: string | null;
  readonly displayName: string;
  readonly created: boolean;
}

/** Search returns suggestions only. Selection always belongs to the receiving user. */
export interface CustomerSearchCandidate {
  readonly customerId: string;
  readonly givenName: string;
  readonly familyName: string | null;
  readonly displayName: string;
  /** Stable preferred display phone; never inferred from Repair snapshots. */
  readonly contactPhone: string | null;
  /** All phones owned by this Branch-scoped Customer. */
  readonly contactPhones: readonly string[];
  /** Customer-owned phone that matched a telephone query, when applicable. */
  readonly matchedPhone: string | null;
}

/** Narrow contract used by Repairs only during its already-open Intake transaction. */
export interface CustomerIntakeRuntime {
  search(
    scope: CustomerIntakeScope,
    query: string,
  ): Promise<readonly CustomerSearchCandidate[]>;
  resolveSelectedOrCreate(
    scope: CustomerIntakeScope,
    input: CustomerIntakeInput,
    transactionContext: object,
  ): Promise<CustomerIntakeRecord>;
}

export const CUSTOMER_INTAKE_RUNTIME: unique symbol = Symbol('srtaller.customers.intake-runtime');
