import type { Kysely, Transaction } from 'kysely';

import { useDatabaseTransactionExecutor } from './database-transaction-capability.js';
import type { DatabaseSchema } from './database-types.js';

export type InternalDatabasePersistenceOwner =
  | 'access'
  | 'catalog'
  | 'customers'
  | 'database'
  | 'repairs'
  | 'stations'
  | 'tenancy'
  | 'users';

type DatabaseMigrationJournalTable = Readonly<{
  name: string;
  timestamp: string;
}>;

type DatabaseTechnicalSchema = Pick<DatabaseSchema, 'branches' | 'tenants' | 'stations' | 'station_bindings' | 'station_credentials'> &
  Readonly<{
    kysely_migration: DatabaseMigrationJournalTable;
    repairs: DatabaseSchema['repairs'];
    repair_intakes: DatabaseSchema['repair_intakes'];
    repair_equipment_corrections: DatabaseSchema['repair_equipment_corrections'];
    repair_device_types: DatabaseSchema['repair_device_types'];
    repair_device_type_pending_values: DatabaseSchema['repair_device_type_pending_values'];
    repair_device_type_catalog_events: DatabaseSchema['repair_device_type_catalog_events'];
    repair_brands: DatabaseSchema['repair_brands'];
    repair_brand_pending_values: DatabaseSchema['repair_brand_pending_values'];
    repair_brand_catalog_events: DatabaseSchema['repair_brand_catalog_events'];
    repair_models: DatabaseSchema['repair_models'];
    repair_model_pending_values: DatabaseSchema['repair_model_pending_values'];
    repair_model_catalog_events: DatabaseSchema['repair_model_catalog_events'];
    repair_risks: DatabaseSchema['repair_risks'];
    repair_intervention_risks: DatabaseSchema['repair_intervention_risks'];
    repair_risk_catalog_events: DatabaseSchema['repair_risk_catalog_events'];
    repair_problem_categories: DatabaseSchema['repair_problem_categories'];
    repair_problem_pending_values: DatabaseSchema['repair_problem_pending_values'];
    repair_problem_category_catalog_events: DatabaseSchema['repair_problem_category_catalog_events'];
    repair_problem_category_deletion_events: DatabaseSchema['repair_problem_category_deletion_events'];
    repair_catalog_reference_deletion_events: DatabaseSchema['repair_catalog_reference_deletion_events'];
    repair_problem_classifications: DatabaseSchema['repair_problem_classifications'];
    repair_problem_classification_events: DatabaseSchema['repair_problem_classification_events'];
    repair_timeline_entries: DatabaseSchema['repair_timeline_entries'];
    repair_business_audit_events: DatabaseSchema['repair_business_audit_events'];
    repair_operational_note_request_guards: DatabaseSchema['repair_operational_note_request_guards'];
    repair_attachments: DatabaseSchema['repair_attachments'];
    repair_technicians: DatabaseSchema['repair_technicians'];
    repair_technician_branches: DatabaseSchema['repair_technician_branches'];
    repair_technician_assignments: DatabaseSchema['repair_technician_assignments'];
    repair_workflow_transitions: DatabaseSchema['repair_workflow_transitions'];
    repair_locations: DatabaseSchema['repair_locations'];
    repair_location_movements: DatabaseSchema['repair_location_movements'];
    customers: DatabaseSchema['customers'];
    customer_contact_phones: DatabaseSchema['customer_contact_phones'];
    repair_create_commands: DatabaseSchema['repair_create_commands'];
    repair_folio_sequences: DatabaseSchema['repair_folio_sequences'];
    repair_new_repair_policy_heads: DatabaseSchema['repair_new_repair_policy_heads'];
    repair_new_repair_policy_versions: DatabaseSchema['repair_new_repair_policy_versions'];
    users: DatabaseSchema['users'];
    user_preferences: DatabaseSchema['user_preferences'];
    user_provisioning_bootstraps: DatabaseSchema['user_provisioning_bootstraps'];
    tenant_bootstrap_commands: DatabaseSchema['tenant_bootstrap_commands'];
    user_lifecycle_commands: DatabaseSchema['user_lifecycle_commands'];
    user_profile_update_commands: DatabaseSchema['user_profile_update_commands'];
    user_create_commands: DatabaseSchema['user_create_commands'];
    access_capabilities: DatabaseSchema['access_capabilities'];
    access_roles: DatabaseSchema['access_roles'];
    access_role_commands: DatabaseSchema['access_role_commands'];
    access_role_capabilities: DatabaseSchema['access_role_capabilities'];
    access_role_assignments: DatabaseSchema['access_role_assignments'];
    access_role_assignment_commands: DatabaseSchema['access_role_assignment_commands'];
    access_pin_credentials: DatabaseSchema['access_pin_credentials'];
    access_pin_credential_commands: DatabaseSchema['access_pin_credential_commands'];
    access_pin_eligibility_tenant_guards: DatabaseSchema['access_pin_eligibility_tenant_guards'];
    access_pin_attempt_station_guards: DatabaseSchema['access_pin_attempt_station_guards'];
    access_pin_attempt_limits: DatabaseSchema['access_pin_attempt_limits'];
    access_operational_session_station_guards: DatabaseSchema['access_operational_session_station_guards'];
    access_operational_sessions: DatabaseSchema['access_operational_sessions'];
    access_admin_identities: DatabaseSchema['access_admin_identities'];
    access_admin_password_credentials: DatabaseSchema['access_admin_password_credentials'];
    access_admin_sessions: DatabaseSchema['access_admin_sessions'];
    access_admin_auth_attempt_limits: DatabaseSchema['access_admin_auth_attempt_limits'];
    access_admin_recovery_challenges: DatabaseSchema['access_admin_recovery_challenges'];
    access_admin_security_events: DatabaseSchema['access_admin_security_events'];
    catalog_categories: DatabaseSchema['catalog_categories'];
    catalog_brands: DatabaseSchema['catalog_brands'];
    catalog_category_pending_values: DatabaseSchema['catalog_category_pending_values'];
    catalog_brand_pending_values: DatabaseSchema['catalog_brand_pending_values'];
    catalog_brand_pending_kind_applicability: DatabaseSchema['catalog_brand_pending_kind_applicability'];
    catalog_items: DatabaseSchema['catalog_items'];
    catalog_item_identifiers: DatabaseSchema['catalog_item_identifiers'];
    catalog_sku_sequences: DatabaseSchema['catalog_sku_sequences'];
    catalog_category_kind_applicability: DatabaseSchema['catalog_category_kind_applicability'];
    catalog_brand_kind_applicability: DatabaseSchema['catalog_brand_kind_applicability'];
    catalog_barcode_sequences: DatabaseSchema['catalog_barcode_sequences'];
    catalog_base_price_revisions: DatabaseSchema['catalog_base_price_revisions'];
    catalog_branch_price_revisions: DatabaseSchema['catalog_branch_price_revisions'];
    catalog_reference_cost_revisions: DatabaseSchema['catalog_reference_cost_revisions'];
    catalog_commands: DatabaseSchema['catalog_commands'];
    catalog_audit_events: DatabaseSchema['catalog_audit_events'];
    catalog_reference_deletion_events: DatabaseSchema['catalog_reference_deletion_events'];
    catalog_reference_merge_events: DatabaseSchema['catalog_reference_merge_events'];
    catalog_supplier_sources: DatabaseSchema['catalog_supplier_sources'];
    catalog_supplier_catalog_versions: DatabaseSchema['catalog_supplier_catalog_versions'];
    catalog_supplier_version_raw_payloads: DatabaseSchema['catalog_supplier_version_raw_payloads'];
    catalog_supplier_listings: DatabaseSchema['catalog_supplier_listings'];
    catalog_update_batches: DatabaseSchema['catalog_update_batches'];
    catalog_update_row_decisions: DatabaseSchema['catalog_update_row_decisions'];
    catalog_supplier_listing_resolutions: DatabaseSchema['catalog_supplier_listing_resolutions'];
    catalog_supplier_reconciliation_memory: DatabaseSchema['catalog_supplier_reconciliation_memory'];
    catalog_supplier_source_deletion_events: DatabaseSchema['catalog_supplier_source_deletion_events'];
    catalog_retirement_plans: DatabaseSchema['catalog_retirement_plans'];
    catalog_retirement_events: DatabaseSchema['catalog_retirement_events'];
    catalog_field_policy_heads: DatabaseSchema['catalog_field_policy_heads'];
    catalog_field_policy_versions: DatabaseSchema['catalog_field_policy_versions'];
  }>;

type OwnerSchema<Owner extends InternalDatabasePersistenceOwner> =
  Owner extends 'access'
    ? Pick<DatabaseSchema, 'access_capabilities' | 'access_roles' | 'access_role_commands' | 'access_role_capabilities' | 'access_role_assignments' | 'access_role_assignment_commands' | 'access_pin_credentials' | 'access_pin_credential_commands' | 'access_pin_eligibility_tenant_guards' | 'access_pin_attempt_station_guards' | 'access_pin_attempt_limits' | 'access_operational_session_station_guards' | 'access_operational_sessions' | 'access_admin_identities' | 'access_admin_password_credentials' | 'access_admin_sessions' | 'access_admin_auth_attempt_limits' | 'access_admin_recovery_challenges' | 'access_admin_security_events'>
    : Owner extends 'catalog'
    ? Pick<DatabaseSchema, 'catalog_categories' | 'catalog_brands' | 'catalog_category_pending_values' | 'catalog_brand_pending_values' | 'catalog_brand_pending_kind_applicability' | 'catalog_items' | 'catalog_item_identifiers' | 'catalog_sku_sequences' | 'catalog_category_kind_applicability' | 'catalog_brand_kind_applicability' | 'catalog_barcode_sequences' | 'catalog_base_price_revisions' | 'catalog_branch_price_revisions' | 'catalog_reference_cost_revisions' | 'catalog_commands' | 'catalog_audit_events' | 'catalog_reference_deletion_events' | 'catalog_reference_merge_events' | 'catalog_reference_identity_locks' | 'catalog_supplier_sources' | 'catalog_supplier_catalog_versions' | 'catalog_supplier_version_raw_payloads' | 'catalog_supplier_listings' | 'catalog_update_batches' | 'catalog_update_row_decisions' | 'catalog_supplier_listing_resolutions' | 'catalog_supplier_reconciliation_memory' | 'catalog_supplier_source_deletion_events' | 'catalog_retirement_plans' | 'catalog_retirement_events' | 'catalog_field_policy_heads' | 'catalog_field_policy_versions'>
    : Owner extends 'customers'
    ? Pick<DatabaseSchema, 'customers' | 'customer_contact_phones'>
    : Owner extends 'database'
    ? DatabaseTechnicalSchema
    : Owner extends 'repairs'
    ? Pick<DatabaseSchema, 'repair_catalog_reference_deletion_events' | 'repair_attachments' | 'repair_business_audit_events' | 'repair_intakes' | 'repair_equipment_corrections' | 'repair_device_types' | 'repair_device_type_pending_values' | 'repair_device_type_catalog_events' | 'repair_brands' | 'repair_brand_pending_values' | 'repair_brand_catalog_events' | 'repair_models' | 'repair_model_pending_values' | 'repair_model_catalog_events' | 'repair_risks' | 'repair_intervention_risks' | 'repair_risk_catalog_events' | 'repair_problem_categories' | 'repair_problem_pending_values' | 'repair_problem_category_catalog_events' | 'repair_problem_category_deletion_events' | 'repair_problem_classifications' | 'repair_problem_classification_events' | 'repair_operational_note_request_guards' | 'repair_create_commands' | 'repair_folio_sequences' | 'repair_new_repair_policy_heads' | 'repair_new_repair_policy_versions' | 'repair_timeline_entries' | 'repairs' | 'repair_technicians' | 'repair_technician_branches' | 'repair_technician_assignments' | 'repair_workflow_transitions' | 'repair_locations' | 'repair_location_movements'>
    : Owner extends 'tenancy'
    ? Pick<DatabaseSchema, 'tenants' | 'tenant_bootstrap_commands'>
    : Owner extends 'users'
    ? Pick<DatabaseSchema, 'users' | 'user_preferences' | 'user_provisioning_bootstraps' | 'user_lifecycle_commands' | 'user_profile_update_commands' | 'user_create_commands'>
    : Pick<DatabaseSchema, 'branches' | 'stations' | 'station_bindings' | 'station_credentials'>;

export type InternalDatabasePersistenceExecutor<
  Owner extends InternalDatabasePersistenceOwner,
> =
  | Kysely<OwnerSchema<Owner>>
  | Transaction<OwnerSchema<Owner>>;

export type InternalDatabasePersistenceOperation<
  Owner extends InternalDatabasePersistenceOwner,
  Result,
> = (
  executor: InternalDatabasePersistenceExecutor<Owner>,
) => Promise<Result>;

export const databasePersistenceCapability: unique symbol = Symbol(
  'srtaller.database.persistence-capability',
);

export class DatabasePersistenceCapabilityError extends Error {
  constructor(readonly code: 'INVALID_STATE') {
    super('Database persistence capability rejected the operation.');
    this.name = 'DatabasePersistenceCapabilityError';
  }
}

export interface InternalDatabasePersistenceConnection {
  readonly state: string;
  verify(): Promise<void>;
  [databasePersistenceCapability]<
    Owner extends InternalDatabasePersistenceOwner,
    Result,
  >(
    owner: Owner,
    operation: InternalDatabasePersistenceOperation<Owner, Result>,
  ): Promise<Result>;
}

function persistenceConnection(
  connection: object,
): InternalDatabasePersistenceConnection {
  if (
    !(databasePersistenceCapability in connection)
  ) {
    throw new DatabasePersistenceCapabilityError('INVALID_STATE');
  }
  return connection as InternalDatabasePersistenceConnection;
}

export async function useDatabasePersistenceExecutor<
  Owner extends InternalDatabasePersistenceOwner,
  Result,
>(
  connection: object,
  owner: Owner,
  operation: InternalDatabasePersistenceOperation<Owner, Result>,
): Promise<Result> {
  const capability = persistenceConnection(connection);
  if (
    capability.state === 'created' ||
    capability.state === 'verifying' ||
    capability.state === 'failed'
  ) {
    await capability.verify();
  }
  if (capability.state !== 'ready') {
    throw new DatabasePersistenceCapabilityError('INVALID_STATE');
  }
  return capability[databasePersistenceCapability](owner, operation);
}

export async function useTransactionalDatabasePersistenceExecutor<
  Owner extends InternalDatabasePersistenceOwner,
  Result,
>(
  context: object,
  owner: Owner,
  operation: InternalDatabasePersistenceOperation<Owner, Result>,
): Promise<Result> {
  return useDatabaseTransactionExecutor(context, async (executor) =>
    operation(
      executor as unknown as InternalDatabasePersistenceExecutor<Owner>,
    ),
  );
}
