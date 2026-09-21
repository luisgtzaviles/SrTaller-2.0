import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

type ImmutableColumn<T> = ColumnType<T, T, never>;
type DefaultedImmutableColumn<T> = ColumnType<T, T | undefined, never>;
type MutableColumn<T> = ColumnType<T, T, T>;
type DefaultedMutableColumn<T> = ColumnType<T, T | undefined, T>;

export interface TenantTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly operating_currency: MutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface BranchTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly time_zone: MutableColumn<string>;
  readonly active: DefaultedImmutableColumn<boolean>;
  /** Stations-owned monotonic epoch for Session admission authority. */
  readonly admission_revision: DefaultedImmutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface StationTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly status: ImmutableColumn<'active' | 'revoked'>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: ImmutableColumn<Date>;
  readonly revoked_at: ImmutableColumn<Date | null>;
  /** Stations-owned monotonic epoch for lifecycle authority. */
  readonly admission_revision: DefaultedImmutableColumn<number>;
}

export interface StationBindingTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly revoked_at: ImmutableColumn<Date | null>;
  readonly created_at: ImmutableColumn<Date>;
  /** Stations-owned monotonic epoch for binding authority. */
  readonly admission_revision: DefaultedImmutableColumn<number>;
}

export interface StationCredentialTable {
  readonly credential_id: ImmutableColumn<string>;
  readonly credential_hash: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly revoked_at: ImmutableColumn<Date | null>;
  readonly created_at: ImmutableColumn<Date>;
  /** Stations-owned monotonic epoch for exact credential authority. */
  readonly admission_revision: DefaultedImmutableColumn<number>;
}

export interface UserTable {
  readonly user_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly display_name: MutableColumn<string>;
  readonly operational_identifier: MutableColumn<string | null>;
  readonly status: MutableColumn<'active' | 'inactive' | 'revoked'>;
  readonly version: MutableColumn<number>;
  /** Users-owned monotonic epoch for authentication lifecycle authority. */
  readonly admission_revision: DefaultedImmutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export type NewRepairFormMode = 'classic' | 'guided_v2';

/** Users-owned personal presentation preference; absence resolves to Classic. */
export interface UserPreferencesTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly new_repair_form_mode: DefaultedMutableColumn<NewRepairFormMode>;
  readonly price_list_show_reference_cost: DefaultedMutableColumn<boolean>;
  readonly updated_at: MutableColumn<Date>;
}

export type CatalogItemKind = 'PART' | 'PRODUCT' | 'SERVICE' | 'SUPPLY';
export type CatalogLifecycle = 'ACTIVE' | 'INACTIVE';
export type CatalogIdentifierScheme = 'SKU' | 'BARCODE';

export interface CatalogCategoryTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly category_id: ImmutableColumn<string>;
  readonly kind: MutableColumn<CatalogItemKind>;
  readonly display_name: MutableColumn<string>;
  readonly normalized_name: MutableColumn<string>;
  readonly status: MutableColumn<CatalogLifecycle>;
  readonly merged_into_id: MutableColumn<string | null>;
  readonly merged_by_actor_id: MutableColumn<string | null>;
  readonly merged_at: MutableColumn<Date | null>;
  readonly created_by_actor_id: ImmutableColumn<string | null>;
  readonly created_in_branch_id: ImmutableColumn<string | null>;
  readonly created_in_station_id: ImmutableColumn<string | null>;
  readonly created_in_session_id: ImmutableColumn<string | null>;
  readonly version: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface CatalogBrandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly brand_id: ImmutableColumn<string>;
  readonly display_name: MutableColumn<string>;
  readonly normalized_name: MutableColumn<string>;
  readonly status: MutableColumn<CatalogLifecycle>;
  readonly merged_into_id: MutableColumn<string | null>;
  readonly merged_by_actor_id: MutableColumn<string | null>;
  readonly merged_at: MutableColumn<Date | null>;
  readonly created_by_actor_id: ImmutableColumn<string | null>;
  readonly created_in_branch_id: ImmutableColumn<string | null>;
  readonly created_in_station_id: ImmutableColumn<string | null>;
  readonly created_in_session_id: ImmutableColumn<string | null>;
  readonly version: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface CatalogItemTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly item_id: ImmutableColumn<string>;
  readonly kind: MutableColumn<CatalogItemKind>;
  readonly title: MutableColumn<string>;
  readonly normalized_title: MutableColumn<string>;
  readonly description: MutableColumn<string | null>;
  readonly category_id: MutableColumn<string | null>;
  readonly brand_id: MutableColumn<string | null>;
  readonly pending_category_value_id: MutableColumn<string | null>;
  readonly pending_brand_value_id: MutableColumn<string | null>;
  readonly status: MutableColumn<CatalogLifecycle>;
  readonly sellable: MutableColumn<boolean>;
  readonly stockable: MutableColumn<boolean>;
  readonly purchasable: MutableColumn<boolean>;
  readonly applicable_to_repair: MutableColumn<boolean>;
  readonly version: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface CatalogCategoryPendingValueTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly pending_category_value_id: ImmutableColumn<string>;
  readonly raw_label_example: ImmutableColumn<string>;
  readonly normalized_key: ImmutableColumn<string>;
  readonly kind: ImmutableColumn<CatalogItemKind>;
  readonly resolution_status: MutableColumn<'PENDING' | 'RESOLVED'>;
  readonly canonical_category_id: MutableColumn<string | null>;
  readonly version: MutableColumn<number>;
  readonly first_seen_at: ImmutableColumn<Date>;
  readonly last_seen_at: MutableColumn<Date>;
  readonly captured_by_actor_id: ImmutableColumn<string>;
  readonly captured_by_actor_display_name: ImmutableColumn<string>;
  readonly captured_in_branch_id: ImmutableColumn<string>;
  readonly captured_in_station_id: ImmutableColumn<string>;
  readonly captured_in_session_id: ImmutableColumn<string>;
  readonly resolved_by_actor_id: MutableColumn<string | null>;
  readonly resolved_at: MutableColumn<Date | null>;
}

export interface CatalogBrandPendingValueTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly pending_brand_value_id: ImmutableColumn<string>;
  readonly raw_label_example: ImmutableColumn<string>;
  readonly normalized_key: ImmutableColumn<string>;
  readonly resolution_status: MutableColumn<'PENDING' | 'RESOLVED'>;
  readonly canonical_brand_id: MutableColumn<string | null>;
  readonly version: MutableColumn<number>;
  readonly first_seen_at: ImmutableColumn<Date>;
  readonly last_seen_at: MutableColumn<Date>;
  readonly captured_by_actor_id: ImmutableColumn<string>;
  readonly captured_by_actor_display_name: ImmutableColumn<string>;
  readonly captured_in_branch_id: ImmutableColumn<string>;
  readonly captured_in_station_id: ImmutableColumn<string>;
  readonly captured_in_session_id: ImmutableColumn<string>;
  readonly resolved_by_actor_id: MutableColumn<string | null>;
  readonly resolved_at: MutableColumn<Date | null>;
}

export interface CatalogBrandPendingKindApplicabilityTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly pending_brand_value_id: ImmutableColumn<string>;
  readonly kind: ImmutableColumn<CatalogItemKind>;
}

export interface CatalogItemIdentifierTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly identifier_id: ImmutableColumn<string>;
  readonly item_id: ImmutableColumn<string>;
  readonly scheme: ImmutableColumn<CatalogIdentifierScheme>;
  readonly normalized_value: ImmutableColumn<string>;
  readonly display_value: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface CatalogSkuSequenceTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly kind: ImmutableColumn<CatalogItemKind>;
  readonly next_value: MutableColumn<string>;
}

export interface CatalogCategoryKindApplicabilityTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly category_id: ImmutableColumn<string>;
  readonly kind: ImmutableColumn<CatalogItemKind>;
}

export interface CatalogBrandKindApplicabilityTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly brand_id: ImmutableColumn<string>;
  readonly kind: ImmutableColumn<CatalogItemKind>;
}

export interface CatalogReferenceIdentityLockTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly identity_key: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface CatalogBarcodeSequenceTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly next_value: MutableColumn<string>;
}

export interface CatalogBasePriceRevisionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly revision_id: ImmutableColumn<string>;
  readonly item_id: ImmutableColumn<string>;
  readonly amount_minor: ImmutableColumn<string>;
  readonly currency: ImmutableColumn<string>;
  readonly item_version: ImmutableColumn<number>;
  readonly reason: ImmutableColumn<string | null>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly effective_from: ImmutableColumn<Date>;
}

export interface CatalogBranchPriceRevisionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly revision_id: ImmutableColumn<string>;
  readonly item_id: ImmutableColumn<string>;
  readonly action: ImmutableColumn<'SET' | 'REVOKE'>;
  readonly amount_minor: ImmutableColumn<string | null>;
  readonly currency: ImmutableColumn<string>;
  readonly item_version: ImmutableColumn<number>;
  readonly reason: ImmutableColumn<string | null>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly effective_from: ImmutableColumn<Date>;
}

export interface CatalogReferenceCostRevisionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly revision_id: ImmutableColumn<string>;
  readonly item_id: ImmutableColumn<string>;
  readonly amount_minor: ImmutableColumn<string>;
  readonly currency: ImmutableColumn<string>;
  readonly source_type: ImmutableColumn<'MANUAL' | 'IMPORTED' | 'ESTIMATED' | 'THIRD_PARTY'>;
  readonly source_label: ImmutableColumn<string | null>;
  readonly observed_at: ImmutableColumn<Date>;
  readonly item_version: ImmutableColumn<number>;
  readonly reason: ImmutableColumn<string | null>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly effective_from: ImmutableColumn<Date>;
}

export interface CatalogCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly operation: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly request_fingerprint: ImmutableColumn<Uint8Array>;
  readonly result_item_id: ImmutableColumn<string>;
  readonly result_version: ImmutableColumn<number>;
  readonly result_payload: ImmutableColumn<unknown>;
  readonly applied_at: ImmutableColumn<Date>;
}

export interface CatalogAuditEventTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly audit_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string | null>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<string>;
  readonly action: ImmutableColumn<string>;
  readonly resource_id: ImmutableColumn<string>;
  readonly old_version: ImmutableColumn<number | null>;
  readonly new_version: ImmutableColumn<number>;
  readonly change_summary: ImmutableColumn<unknown>;
  readonly result: ImmutableColumn<'SUCCEEDED'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface CatalogSupplierSourceTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly source_id: ImmutableColumn<string>;
  readonly display_name: MutableColumn<string>;
  readonly normalized_name: ImmutableColumn<string>;
  readonly status: MutableColumn<'ACTIVE' | 'INACTIVE'>;
  readonly version: MutableColumn<number>;
  readonly next_version_sequence: MutableColumn<number>;
  readonly created_by_actor_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface CatalogSupplierCatalogVersionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly version_id: ImmutableColumn<string>;
  readonly source_id: ImmutableColumn<string>;
  readonly supersedes_version_id: ImmutableColumn<string | null>;
  readonly sequence_number: ImmutableColumn<number>;
  readonly source_revision: ImmutableColumn<string>;
  readonly description: MutableColumn<string | null>;
  readonly create_client_request_id: ImmutableColumn<string | null>;
  readonly create_request_sha256: ImmutableColumn<string | null>;
  /** Mutable only while its Supplier Version remains DRAFT; immutable after Analyze. */
  readonly composer_mode: MutableColumn<'FULL' | 'COMPACT'>;
  /** Immutable once the supplier version leaves DRAFT. Historical rows default conservatively. */
  readonly completeness: MutableColumn<'PARTIAL' | 'COMPLETE'>;
  readonly column_signature: MutableColumn<string>;
  readonly lifecycle: MutableColumn<'DRAFT' | 'INGESTED'>;
  readonly lock_version: MutableColumn<number>;
  readonly row_count: MutableColumn<number>;
  readonly content_sha256: MutableColumn<string | null>;
  readonly ingested_at: MutableColumn<Date | null>;
  readonly created_by_actor_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface CatalogSupplierSourceDeletionEventTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly deletion_id: ImmutableColumn<string>;
  readonly source_id: ImmutableColumn<string>;
  readonly source_name: ImmutableColumn<string>;
  readonly normalized_name: ImmutableColumn<string>;
  readonly source_version: ImmutableColumn<number>;
  readonly deleted_version_count: ImmutableColumn<number>;
  readonly deleted_listing_count: ImmutableColumn<number>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<string>;
  readonly sensitivity_level: ImmutableColumn<number>;
  readonly reauthenticated_at: ImmutableColumn<Date>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly request_sha256: ImmutableColumn<string>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface CatalogSupplierVersionRawPayloadTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly version_id: ImmutableColumn<string>;
  readonly payload_text: MutableColumn<string | null>;
  readonly retained_until: ImmutableColumn<Date>;
  readonly purged_at: MutableColumn<Date | null>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface CatalogSupplierListingTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly listing_id: ImmutableColumn<string>;
  readonly version_id: ImmutableColumn<string>;
  readonly row_number: ImmutableColumn<number>;
  readonly item_kind: ImmutableColumn<CatalogItemKind | null>;
  readonly supplier_item_code: ImmutableColumn<string | null>;
  readonly normalized_supplier_item_code: ImmutableColumn<string | null>;
  readonly normalized_signature: ImmutableColumn<string>;
  readonly supplier_sku: ImmutableColumn<string | null>;
  readonly supplier_barcode: ImmutableColumn<string | null>;
  readonly supplier_title: ImmutableColumn<string | null>;
  readonly supplier_title_search: DefaultedImmutableColumn<string>;
  readonly supplier_description: ImmutableColumn<string | null>;
  readonly category_label: ImmutableColumn<string | null>;
  readonly brand_label: ImmutableColumn<string | null>;
  readonly supplier_cost_minor: ImmutableColumn<string | null>;
  readonly currency: ImmutableColumn<string | null>;
  readonly source_observation: ImmutableColumn<unknown>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface CatalogUpdateBatchTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly batch_id: ImmutableColumn<string>;
  readonly version_id: ImmutableColumn<string>;
  readonly lifecycle: MutableColumn<'DRAFT' | 'ANALYZING' | 'RECONCILING' | 'READY' | 'APPLIED'>;
  readonly lock_version: MutableColumn<number>;
  readonly counts: MutableColumn<unknown>;
  readonly analysis_sha256: MutableColumn<string | null>;
  readonly publish_client_request_id: MutableColumn<string | null>;
  readonly publish_request_sha256: MutableColumn<string | null>;
  readonly published_at: MutableColumn<Date | null>;
  readonly published_by_actor_id: MutableColumn<string | null>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export type CatalogUpdateRowClassification = 'NEW' | 'UPDATE' | 'REACTIVATE' | 'UNCHANGED' | 'CANDIDATE' | 'PENDING_REFERENCE' | 'AMBIGUOUS' | 'CONFLICT' | 'INVALID';
export interface CatalogUpdateRowDecisionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly row_decision_id: ImmutableColumn<string>;
  readonly batch_id: ImmutableColumn<string>;
  readonly listing_id: ImmutableColumn<string>;
  readonly row_number: ImmutableColumn<number>;
  readonly proposal: MutableColumn<unknown>;
  readonly classification: MutableColumn<CatalogUpdateRowClassification>;
  readonly decision: MutableColumn<'UNRESOLVED' | 'APPLY' | 'EXCLUDE'>;
  readonly title_decision: DefaultedMutableColumn<'KEEP_CURRENT' | 'ADOPT_OBSERVED' | null>;
  readonly target_item_id: MutableColumn<string | null>;
  readonly expected_item_version: MutableColumn<number | null>;
  readonly preselected_by_memory: MutableColumn<boolean>;
  readonly match_origin: MutableColumn<'NONE' | 'INTERNAL_IDENTIFIER' | 'TRUSTED_HISTORY' | 'CANDIDATE' | 'OWNER_SELECTED'>;
  readonly match_algorithm_version: MutableColumn<number>;
  readonly candidate_matches: MutableColumn<unknown>;
  readonly errors: MutableColumn<unknown>;
  readonly warnings: MutableColumn<unknown>;
  readonly lock_version: MutableColumn<number>;
  readonly updated_at: MutableColumn<Date>;
}

export interface CatalogSupplierListingResolutionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly resolution_id: ImmutableColumn<string>;
  readonly source_id: ImmutableColumn<string>;
  readonly version_id: ImmutableColumn<string>;
  readonly listing_id: ImmutableColumn<string>;
  readonly batch_id: ImmutableColumn<string>;
  readonly item_id: ImmutableColumn<string | null>;
  readonly resolution: ImmutableColumn<'MATCHED' | 'CREATED' | 'EXCLUDED' | 'CONFLICT'>;
  readonly identifier_scheme: ImmutableColumn<CatalogIdentifierScheme | 'SUPPLIER_CODE' | 'SIGNATURE' | null>;
  readonly normalized_identifier: ImmutableColumn<string | null>;
  readonly column_signature: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export type CatalogSupplierMemoryScheme = CatalogIdentifierScheme | 'SUPPLIER_CODE' | 'SIGNATURE';
export interface CatalogSupplierReconciliationMemoryTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly source_id: ImmutableColumn<string>;
  readonly identifier_scheme: ImmutableColumn<CatalogSupplierMemoryScheme>;
  readonly normalized_identifier: ImmutableColumn<string>;
  readonly column_signature: ImmutableColumn<string>;
  readonly item_id: MutableColumn<string>;
  readonly item_kind: ImmutableColumn<CatalogItemKind>;
  readonly last_resolution_id: MutableColumn<string>;
  readonly first_confirmed_at: ImmutableColumn<Date>;
  readonly last_confirmed_at: MutableColumn<Date>;
  readonly consistency_state: MutableColumn<'CONSISTENT' | 'CONFLICTED'>;
  readonly correction_count: MutableColumn<number>;
  readonly version: MutableColumn<number>;
}

export interface CatalogRetirementPlanTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly plan_id: ImmutableColumn<string>;
  readonly scope: ImmutableColumn<'ACTIVE_CATALOG' | 'BATCH_CREATED'>;
  readonly batch_id: ImmutableColumn<string | null>;
  readonly item_set_sha256: ImmutableColumn<string>;
  readonly active_count: ImmutableColumn<number>;
  readonly already_inactive_count: ImmutableColumn<number>;
  readonly created_by_actor_id: ImmutableColumn<string>;
  readonly created_in_branch_id: ImmutableColumn<string>;
  readonly created_in_station_id: ImmutableColumn<string>;
  readonly created_in_session_id: ImmutableColumn<string>;
  readonly status: MutableColumn<'PENDING' | 'EXECUTED' | 'STALE' | 'EXPIRED'>;
  readonly expires_at: ImmutableColumn<Date>;
  readonly execution_client_request_id: MutableColumn<string | null>;
  readonly retired_count: MutableColumn<number | null>;
  readonly created_at: ImmutableColumn<Date>;
  readonly executed_at: MutableColumn<Date | null>;
}

export interface CatalogRetirementEventTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly event_id: ImmutableColumn<string>;
  readonly plan_id: ImmutableColumn<string>;
  readonly scope: ImmutableColumn<'ACTIVE_CATALOG' | 'BATCH_CREATED'>;
  readonly batch_id: ImmutableColumn<string | null>;
  readonly branch_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'catalog.items.bulk_retire'>;
  readonly sensitivity_level: ImmutableColumn<2>;
  readonly reauthenticated_at: ImmutableColumn<Date>;
  readonly item_set_sha256: ImmutableColumn<string>;
  readonly planned_count: ImmutableColumn<number>;
  readonly retired_count: ImmutableColumn<number>;
  readonly result: ImmutableColumn<'SUCCEEDED' | 'REJECTED'>;
  readonly rejection_reason: ImmutableColumn<'PLAN_STALE' | 'PLAN_EXPIRED' | 'PLAN_CONTEXT_CHANGED' | 'AUTHORIZATION_CHANGED' | null>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface CatalogFieldPolicyHeadTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly schema_version: MutableColumn<number>;
  readonly current_version: MutableColumn<number>;
  readonly field_levels: MutableColumn<Record<string, string>>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}
export interface CatalogFieldPolicyVersionTable {
  readonly tenant_id: ImmutableColumn<string>; readonly policy_version: ImmutableColumn<number>;
  readonly schema_version: ImmutableColumn<number>; readonly previous_version: ImmutableColumn<number>;
  readonly field_levels: ImmutableColumn<Record<string, string>>;
  readonly actor_user_id: ImmutableColumn<string>; readonly actor_display_name: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>; readonly session_id: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'catalog.configuration.manage'>;
  readonly action: ImmutableColumn<'catalog_field_policy.updated' | 'catalog_field_policy.reset'>;
  readonly result: ImmutableColumn<'succeeded'>; readonly correlation_id: ImmutableColumn<string>; readonly occurred_at: ImmutableColumn<Date>;
}

/** Customer identity is Branch-scoped; Repairs own their historical snapshots. */
export interface CustomerTable {
  readonly customer_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly given_name: ImmutableColumn<string>;
  readonly family_name: ImmutableColumn<string | null>;
  readonly created_at: ImmutableColumn<Date>;
}

/** Optional lookup aids; a phone is never a Customer identity or global key. */
export interface CustomerContactPhoneTable {
  readonly customer_contact_phone_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly customer_id: ImmutableColumn<string>;
  readonly phone_normalized: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

/** Durable, tenant-scoped gate for the governed first-user bootstrap. */
export interface UserProvisioningBootstrapTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly first_user_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly display_name: ImmutableColumn<string>;
  readonly operational_identifier: ImmutableColumn<string | null>;
  readonly provisioned_at: ImmutableColumn<Date>;
}

/** Immutable replay record for a tenant-scoped User lifecycle command. */
export interface UserLifecycleCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly requested_status: ImmutableColumn<'active' | 'inactive' | 'revoked'>;
  readonly expected_version: ImmutableColumn<number>;
  readonly result_display_name: ImmutableColumn<string>;
  readonly result_operational_identifier: ImmutableColumn<string | null>;
  readonly result_status: ImmutableColumn<'active' | 'inactive' | 'revoked'>;
  readonly result_version: ImmutableColumn<number>;
  readonly result_created_at: ImmutableColumn<Date>;
  readonly result_updated_at: ImmutableColumn<Date>;
  readonly applied_at: ImmutableColumn<Date>;
}

/** Immutable replay record for a User identity-metadata edit. */
export interface UserProfileUpdateCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly requested_display_name: ImmutableColumn<string>;
  readonly requested_operational_identifier: ImmutableColumn<string | null>;
  readonly expected_version: ImmutableColumn<number>;
  readonly result_display_name: ImmutableColumn<string>;
  readonly result_operational_identifier: ImmutableColumn<string | null>;
  readonly result_status: ImmutableColumn<'active' | 'inactive' | 'revoked'>;
  readonly result_version: ImmutableColumn<number>;
  readonly result_created_at: ImmutableColumn<Date>;
  readonly result_updated_at: ImmutableColumn<Date>;
  readonly applied_at: ImmutableColumn<Date>;
}

/** Immutable replay record for an ordinary tenant-scoped User creation. */
export interface UserCreateCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly requested_display_name: ImmutableColumn<string>;
  readonly requested_operational_identifier: ImmutableColumn<string | null>;
  readonly result_display_name: ImmutableColumn<string>;
  readonly result_operational_identifier: ImmutableColumn<string | null>;
  readonly result_status: ImmutableColumn<'active'>;
  readonly result_version: ImmutableColumn<0>;
  readonly result_created_at: ImmutableColumn<Date>;
  readonly result_updated_at: ImmutableColumn<Date>;
  readonly applied_at: ImmutableColumn<Date>;
}

export type AccessCapabilityCode =
  | 'access_matrix.read'
  | 'access_matrix.manage'
  | 'repairs.add_note'
  | 'repairs.create'
  | 'repairs.correct_intake'
  | 'repairs.classify'
  | 'repairs.catalogs.read'
  | 'repairs.catalogs.manage'
  | 'repairs.configuration.read'
  | 'repairs.configuration.manage'
  | 'repairs.read'
  | 'price_list.read'
  | 'catalog.manage'
  | 'catalog.items.create'
  | 'catalog.items.update'
  | 'catalog.items.deactivate'
  | 'catalog.prices.manage'
  | 'catalog.branch_prices.manage'
  | 'catalog.reference_cost.read'
  | 'catalog.reference_cost.manage'
  | 'catalog.configuration.read'
  | 'catalog.configuration.manage'
  | 'catalog.import.read'
  | 'catalog.import.prepare'
  | 'catalog.import.publish'
  | 'catalog.items.bulk_retire'
  | 'catalog.suppliers.delete'
  | 'users.read'
  | 'users.manage';

export interface AccessCapabilityTable {
  readonly capability_code: ImmutableColumn<AccessCapabilityCode>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface AccessRoleTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly role_id: ImmutableColumn<string>;
  readonly role_key: ImmutableColumn<string>;
  readonly display_name: MutableColumn<string>;
  readonly description: MutableColumn<string | null>;
  readonly status: MutableColumn<'active' | 'disabled' | 'archived'>;
  readonly version: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface AccessRoleCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly command_type: ImmutableColumn<'create' | 'update' | 'replace_capabilities'>;
  readonly role_id: ImmutableColumn<string>;
  readonly request_fingerprint: ImmutableColumn<Uint8Array>;
  readonly result_role_key: ImmutableColumn<string>;
  readonly result_display_name: ImmutableColumn<string>;
  readonly result_description: ImmutableColumn<string | null>;
  readonly result_status: ImmutableColumn<'active' | 'disabled' | 'archived'>;
  readonly result_version: ImmutableColumn<number>;
  readonly result_capability_codes: ImmutableColumn<string[]>;
  readonly result_created_at: ImmutableColumn<Date>;
  readonly result_updated_at: ImmutableColumn<Date>;
  readonly applied_at: ImmutableColumn<Date>;
}

export interface AccessRoleCapabilityTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly role_id: ImmutableColumn<string>;
  readonly capability_code: ImmutableColumn<AccessCapabilityCode>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface AccessRoleAssignmentTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly assignment_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly role_id: ImmutableColumn<string>;
  readonly assignment_scope: ImmutableColumn<'TENANT_WIDE' | 'BRANCH_RESTRICTED'>;
  readonly branch_id: ImmutableColumn<string | null>;
  readonly status: MutableColumn<'active' | 'revoked'>;
  readonly version: MutableColumn<number>;
  readonly assigned_at: ImmutableColumn<Date>;
  readonly revoked_at: MutableColumn<Date | null>;
}

export interface AccessRoleAssignmentCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly command_type: ImmutableColumn<'assign' | 'revoke'>;
  readonly assignment_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly role_id: ImmutableColumn<string>;
  readonly assignment_scope: ImmutableColumn<'TENANT_WIDE' | 'BRANCH_RESTRICTED'>;
  readonly branch_id: ImmutableColumn<string | null>;
  readonly expected_version: ImmutableColumn<number | null>;
  readonly result_status: ImmutableColumn<'active' | 'revoked'>;
  readonly result_version: ImmutableColumn<number>;
  readonly result_assigned_at: ImmutableColumn<Date>;
  readonly result_revoked_at: ImmutableColumn<Date | null>;
  readonly applied_at: ImmutableColumn<Date>;
}

export type AccessPinCredentialStatus = 'active' | 'revoked';

/**
 * The access owner keeps PIN credential material separate from the User row.
 * The composite primary key enforces at most one credential per tenant/User.
 */
export interface AccessPinCredentialTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly credential_id: ImmutableColumn<string>;
  readonly status: MutableColumn<AccessPinCredentialStatus>;
  readonly algorithm: MutableColumn<'argon2id'>;
  readonly profile_version: MutableColumn<number>;
  readonly pepper_version: MutableColumn<number>;
  readonly memory_kib: MutableColumn<number>;
  readonly passes: MutableColumn<number>;
  readonly parallelism: MutableColumn<number>;
  readonly salt: MutableColumn<Uint8Array>;
  readonly verifier: MutableColumn<Uint8Array>;
  /** Pepper-keyed lookup tag; never a plaintext PIN or reusable verifier. */
  readonly lookup_digest: MutableColumn<Uint8Array | null>;
  readonly credential_version: MutableColumn<number>;
  readonly consecutive_failures: MutableColumn<number>;
  readonly locked_until: MutableColumn<Date | null>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
  readonly revoked_at: MutableColumn<Date | null>;
}

/** Immutable replay evidence for the server-only provisioning command. */
export interface AccessPinCredentialCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly credential_id: ImmutableColumn<string>;
  readonly command_type: ImmutableColumn<'provision' | 'replace'>;
  readonly request_fingerprint: ImmutableColumn<Uint8Array>;
  readonly result_status: ImmutableColumn<'active'>;
  readonly result_credential_version: ImmutableColumn<number>;
  readonly result_created_at: ImmutableColumn<Date>;
  readonly result_updated_at: ImmutableColumn<Date>;
  readonly applied_at: ImmutableColumn<Date>;
}

/** Serializes tenant-wide mutations that can change PIN-only eligibility. */
export interface AccessPinEligibilityTenantGuardTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

/** Serializes bounded abuse-control cardinality for one trusted Station. */
export interface AccessPinAttemptStationGuardTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

/** Bounded abuse-control state scoped to a trusted Station and opaque principal. */
export interface AccessPinAttemptLimitTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly rate_principal_id: ImmutableColumn<string>;
  readonly attempt_count: MutableColumn<number>;
  readonly window_started_at: MutableColumn<Date>;
  readonly blocked_until: MutableColumn<Date | null>;
  readonly updated_at: MutableColumn<Date>;
}

export type AccessOperationalSessionStatus =
  | 'active'
  | 'expired'
  | 'invalidated'
  | 'logged_out'
  | 'replaced';

/** Legacy Access-owned guard retained for rollback compatibility. */
export interface AccessOperationalSessionStationGuardTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface AccessOperationalSessionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly station_credential_id: ImmutableColumn<string>;
  readonly branch_admission_revision: ImmutableColumn<number>;
  readonly station_admission_revision: ImmutableColumn<number>;
  readonly station_binding_admission_revision: ImmutableColumn<number>;
  readonly station_credential_admission_revision: ImmutableColumn<number>;
  readonly user_id: ImmutableColumn<string>;
  readonly user_version: ImmutableColumn<number>;
  readonly user_admission_revision: ImmutableColumn<number>;
  readonly credential_version: ImmutableColumn<number>;
  readonly token_verifier: ImmutableColumn<Uint8Array>;
  readonly csrf_verifier: ImmutableColumn<Uint8Array>;
  readonly status: MutableColumn<AccessOperationalSessionStatus>;
  readonly version: MutableColumn<number>;
  readonly issued_at: ImmutableColumn<Date>;
  readonly last_activity_at: MutableColumn<Date>;
  readonly expires_at: ImmutableColumn<Date>;
  readonly ended_at: MutableColumn<Date | null>;
}

export interface AccessAdminIdentityTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly admin_identity_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly normalized_email: ImmutableColumn<string>;
  readonly email_display: MutableColumn<string>;
  readonly verified_at: MutableColumn<Date | null>;
  readonly status: MutableColumn<'active' | 'revoked'>;
  readonly identity_version: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface AccessAdminPasswordCredentialTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly admin_identity_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly status: MutableColumn<'active' | 'revoked'>;
  readonly algorithm: MutableColumn<'argon2id'>;
  readonly profile_version: MutableColumn<number>;
  readonly pepper_version: MutableColumn<number>;
  readonly memory_kib: MutableColumn<number>;
  readonly passes: MutableColumn<number>;
  readonly parallelism: MutableColumn<number>;
  readonly salt: MutableColumn<Uint8Array>;
  readonly verifier: MutableColumn<Uint8Array>;
  readonly credential_version: MutableColumn<number>;
  readonly session_revision: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
  readonly revoked_at: MutableColumn<Date | null>;
}

export interface AccessAdminSessionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly admin_identity_id: ImmutableColumn<string>;
  readonly user_admission_revision: ImmutableColumn<number>;
  readonly identity_version: ImmutableColumn<number>;
  readonly credential_version: ImmutableColumn<number>;
  readonly session_revision: ImmutableColumn<number>;
  readonly token_verifier: ImmutableColumn<Uint8Array>;
  readonly csrf_verifier: ImmutableColumn<Uint8Array>;
  readonly status: MutableColumn<'active' | 'expired' | 'logged_out' | 'revoked'>;
  readonly version: MutableColumn<number>;
  readonly issued_at: ImmutableColumn<Date>;
  readonly last_activity_at: MutableColumn<Date>;
  readonly expires_at: ImmutableColumn<Date>;
  readonly reauthenticated_at: MutableColumn<Date | null>;
  readonly ended_at: MutableColumn<Date | null>;
}

export interface AccessAdminAuthAttemptLimitTable {
  readonly principal_digest: ImmutableColumn<Uint8Array>;
  readonly attempt_count: MutableColumn<number>;
  readonly window_started_at: MutableColumn<Date>;
  readonly blocked_until: MutableColumn<Date | null>;
  readonly updated_at: MutableColumn<Date>;
}

export interface AccessAdminRecoveryChallengeTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly challenge_id: ImmutableColumn<string>;
  readonly admin_identity_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string>;
  readonly token_verifier: ImmutableColumn<Uint8Array>;
  readonly identity_version: ImmutableColumn<number>;
  readonly credential_version: ImmutableColumn<number>;
  readonly status: MutableColumn<'active' | 'consumed' | 'expired' | 'cancelled'>;
  readonly version: MutableColumn<number>;
  readonly issued_at: ImmutableColumn<Date>;
  readonly expires_at: ImmutableColumn<Date>;
  readonly consumed_at: MutableColumn<Date | null>;
}

export interface AccessAdminSecurityEventTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly event_id: ImmutableColumn<string>;
  readonly user_id: ImmutableColumn<string | null>;
  readonly admin_identity_id: ImmutableColumn<string | null>;
  readonly session_id: ImmutableColumn<string | null>;
  readonly event_type: ImmutableColumn<string>;
  readonly result: ImmutableColumn<'SUCCEEDED' | 'DENIED'>;
  readonly reason_code: ImmutableColumn<string>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairTable {
  readonly repair_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly folio: ImmutableColumn<string>;
  readonly received_at: ImmutableColumn<Date>;
  readonly customer_name: ImmutableColumn<string>;
  readonly customer_phone: ImmutableColumn<string | null>;
  readonly customer_id: ImmutableColumn<string | null>;
  readonly device_brand: MutableColumn<string | null>;
  readonly device_model: MutableColumn<string | null>;
  readonly reported_issue: ImmutableColumn<string>;
  readonly technician_id: ImmutableColumn<string | null>;
  readonly technician_display_name: ImmutableColumn<string | null>;
  readonly repair_status: MutableColumn<string>;
  readonly custody_status: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface RepairIntakeTable {
  readonly repair_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly device_color: ImmutableColumn<string | null>;
  readonly device_type: ImmutableColumn<string | null>;
  readonly canonical_device_type_id: DefaultedMutableColumn<string | null>;
  readonly pending_device_type_value_id: DefaultedMutableColumn<string | null>;
  readonly device_identifier: ImmutableColumn<string | null>;
  readonly device_identifier_unavailable: DefaultedImmutableColumn<boolean>;
  readonly distinctive_signs: ImmutableColumn<string | null>;
  readonly sim_included: ImmutableColumn<boolean | null>;
  readonly memory_card_included: ImmutableColumn<boolean | null>;
  readonly other_accessories: ImmutableColumn<string | null>;
  readonly warranty_review_requested: DefaultedImmutableColumn<boolean>;
  readonly previous_repair_id: ImmutableColumn<string | null>;
  readonly delivered_by_name: ImmutableColumn<string | null>;
  readonly estimated_delivery_at: ImmutableColumn<Date | null>;
  readonly received_by_id: ImmutableColumn<string | null>;
  readonly received_by_display_name: ImmutableColumn<string | null>;
  readonly customer_narrative: ImmutableColumn<string | null>;
  readonly physical_condition_summary: ImmutableColumn<string | null>;
  readonly documented_risk_summary: ImmutableColumn<string | null>;
  readonly received_power_state: ImmutableColumn<'powered_on' | 'powered_off' | null>;
  readonly device_access_type: ImmutableColumn<'none' | 'pin' | 'password' | 'pattern' | null>;
  readonly initial_budget_amount_minor: ImmutableColumn<string | null>;
  readonly new_repair_policy_version: ImmutableColumn<number>;
  readonly canonical_brand_id: MutableColumn<string | null>;
  readonly pending_brand_value_id: MutableColumn<string | null>;
  readonly canonical_model_id: MutableColumn<string | null>;
  readonly pending_model_value_id: MutableColumn<string | null>;
  readonly equipment_version: DefaultedMutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface RepairDeviceTypeTable {
  readonly device_type_id: ImmutableColumn<string>; readonly scope: ImmutableColumn<'platform' | 'tenant'>; readonly tenant_id: ImmutableColumn<string | null>; readonly code: ImmutableColumn<string | null>;
  readonly canonical_label: MutableColumn<string>; readonly normalized_key: MutableColumn<string>; readonly status: MutableColumn<'active' | 'inactive'>; readonly version: MutableColumn<number>;
  readonly created_by_actor_id: ImmutableColumn<string | null>; readonly updated_by_actor_id: MutableColumn<string | null>; readonly created_at: ImmutableColumn<Date>; readonly updated_at: MutableColumn<Date>;
}
export interface RepairDeviceTypePendingValueTable {
  readonly pending_device_type_value_id: ImmutableColumn<string>; readonly tenant_id: ImmutableColumn<string>; readonly raw_label_example: ImmutableColumn<string>; readonly normalized_key: ImmutableColumn<string>;
  readonly resolution_status: MutableColumn<'pending' | 'resolved'>; readonly canonical_device_type_id: MutableColumn<string | null>; readonly version: MutableColumn<number>; readonly first_seen_at: ImmutableColumn<Date>; readonly last_seen_at: MutableColumn<Date>; readonly resolved_by_actor_id: MutableColumn<string | null>; readonly resolved_at: MutableColumn<Date | null>;
}
export interface RepairDeviceTypeCatalogEventTable {
  readonly event_id: ImmutableColumn<string>; readonly tenant_id: ImmutableColumn<string>; readonly device_type_id: ImmutableColumn<string | null>; readonly pending_device_type_value_id: ImmutableColumn<string | null>;
  readonly station_id: ImmutableColumn<string>; readonly session_id: ImmutableColumn<string>; readonly actor_user_id: ImmutableColumn<string>; readonly actor_display_name: ImmutableColumn<string>; readonly capability: ImmutableColumn<'repairs.catalogs.manage'>;
  readonly action: ImmutableColumn<'repair_device_type.created' | 'repair_device_type.renamed' | 'repair_device_type.deactivated' | 'repair_device_type.reactivated' | 'repair_device_type_pending.resolved' | 'repair_device_type_pending.canonical_created'>;
  readonly old_version: ImmutableColumn<number | null>; readonly new_version: ImmutableColumn<number>; readonly old_label: ImmutableColumn<string | null>; readonly new_label: ImmutableColumn<string>; readonly old_status: ImmutableColumn<string | null>; readonly new_status: ImmutableColumn<string>;
  readonly old_canonical_device_type_id: ImmutableColumn<string | null>; readonly new_canonical_device_type_id: ImmutableColumn<string | null>; readonly result: ImmutableColumn<'succeeded'>; readonly correlation_id: ImmutableColumn<string>; readonly occurred_at: ImmutableColumn<Date>;
}

/** Immutable history and replay evidence for a Brand/Model intake correction. */
export interface RepairEquipmentCorrectionTable {
  readonly correction_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly timeline_entry_id: ImmutableColumn<string>;
  readonly audit_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly request_fingerprint: ImmutableColumn<Uint8Array>;
  readonly expected_version: ImmutableColumn<number>;
  readonly equipment_version: ImmutableColumn<number>;
  readonly old_brand_label: ImmutableColumn<string | null>;
  readonly new_brand_label: ImmutableColumn<string | null>;
  readonly old_canonical_brand_id: ImmutableColumn<string | null>;
  readonly new_canonical_brand_id: ImmutableColumn<string | null>;
  readonly old_pending_brand_value_id: ImmutableColumn<string | null>;
  readonly new_pending_brand_value_id: ImmutableColumn<string | null>;
  readonly old_model_label: ImmutableColumn<string | null>;
  readonly new_model_label: ImmutableColumn<string | null>;
  readonly old_canonical_model_id: ImmutableColumn<string | null>;
  readonly new_canonical_model_id: ImmutableColumn<string | null>;
  readonly old_pending_model_value_id: ImmutableColumn<string | null>;
  readonly new_pending_model_value_id: ImmutableColumn<string | null>;
  readonly reason: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.correct_intake'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairBrandTable {
  readonly brand_id: ImmutableColumn<string>;
  readonly scope: ImmutableColumn<'platform' | 'tenant'>;
  readonly tenant_id: ImmutableColumn<string | null>;
  readonly code: ImmutableColumn<string | null>;
  readonly canonical_label: MutableColumn<string>;
  readonly normalized_key: MutableColumn<string>;
  readonly status: MutableColumn<'active' | 'inactive'>;
  readonly version: MutableColumn<number>;
  readonly created_by_actor_id: ImmutableColumn<string | null>;
  readonly updated_by_actor_id: MutableColumn<string | null>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface RepairBrandPendingValueTable {
  readonly pending_brand_value_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly raw_label_example: ImmutableColumn<string>;
  readonly normalized_key: ImmutableColumn<string>;
  readonly resolution_status: MutableColumn<'pending' | 'resolved'>;
  readonly canonical_brand_id: MutableColumn<string | null>;
  readonly version: MutableColumn<number>;
  readonly first_seen_at: ImmutableColumn<Date>;
  readonly last_seen_at: MutableColumn<Date>;
  readonly resolved_by_actor_id: MutableColumn<string | null>;
  readonly resolved_at: MutableColumn<Date | null>;
}

export interface RepairBrandCatalogEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly brand_id: ImmutableColumn<string | null>;
  readonly pending_brand_value_id: ImmutableColumn<string | null>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.catalogs.manage'>;
  readonly action: ImmutableColumn<'repair_brand.created' | 'repair_brand.renamed' | 'repair_brand.deactivated' | 'repair_brand.reactivated' | 'repair_brand_pending.resolved' | 'repair_brand_pending.canonical_created' | 'repair_brand_pending.reopened'>;
  readonly old_version: ImmutableColumn<number | null>;
  readonly new_version: ImmutableColumn<number>;
  readonly old_label: ImmutableColumn<string | null>;
  readonly new_label: ImmutableColumn<string>;
  readonly old_status: ImmutableColumn<string | null>;
  readonly new_status: ImmutableColumn<string>;
  readonly old_canonical_brand_id: ImmutableColumn<string | null>;
  readonly new_canonical_brand_id: ImmutableColumn<string | null>;
  readonly result: ImmutableColumn<'succeeded'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairModelTable {
  readonly model_id: ImmutableColumn<string>;
  readonly canonical_brand_id: ImmutableColumn<string>;
  readonly scope: ImmutableColumn<'platform' | 'tenant'>;
  readonly tenant_id: ImmutableColumn<string | null>;
  readonly code: ImmutableColumn<string | null>;
  readonly canonical_label: MutableColumn<string>;
  readonly normalized_key: MutableColumn<string>;
  readonly status: MutableColumn<'active' | 'inactive'>;
  readonly version: MutableColumn<number>;
  readonly created_by_actor_id: ImmutableColumn<string | null>;
  readonly updated_by_actor_id: MutableColumn<string | null>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface RepairModelPendingValueTable {
  readonly pending_model_value_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly brand_context_key: ImmutableColumn<string>;
  readonly canonical_brand_id: ImmutableColumn<string | null>;
  readonly pending_brand_value_id: ImmutableColumn<string | null>;
  readonly raw_brand_label_example: ImmutableColumn<string | null>;
  readonly raw_model_label_example: ImmutableColumn<string>;
  readonly normalized_model_key: ImmutableColumn<string>;
  readonly resolution_status: MutableColumn<'pending' | 'resolved'>;
  readonly canonical_model_id: MutableColumn<string | null>;
  readonly version: MutableColumn<number>;
  readonly first_seen_at: ImmutableColumn<Date>;
  readonly last_seen_at: MutableColumn<Date>;
  readonly resolved_by_actor_id: MutableColumn<string | null>;
  readonly resolved_at: MutableColumn<Date | null>;
}

export interface RepairModelCatalogEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly model_id: ImmutableColumn<string | null>;
  readonly canonical_brand_id: ImmutableColumn<string>;
  readonly pending_model_value_id: ImmutableColumn<string | null>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.catalogs.manage'>;
  readonly action: ImmutableColumn<'repair_model.created' | 'repair_model.renamed' | 'repair_model.deactivated' | 'repair_model.reactivated' | 'repair_model_pending.resolved' | 'repair_model_pending.canonical_created'>;
  readonly old_version: ImmutableColumn<number | null>;
  readonly new_version: ImmutableColumn<number>;
  readonly old_label: ImmutableColumn<string | null>;
  readonly new_label: ImmutableColumn<string>;
  readonly old_status: ImmutableColumn<string | null>;
  readonly new_status: ImmutableColumn<string>;
  readonly old_canonical_model_id: ImmutableColumn<string | null>;
  readonly new_canonical_model_id: ImmutableColumn<string | null>;
  readonly result: ImmutableColumn<'succeeded'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairRiskTable {
  readonly risk_id: ImmutableColumn<string>;
  readonly scope: ImmutableColumn<'platform' | 'tenant'>;
  readonly tenant_id: ImmutableColumn<string | null>;
  readonly code: ImmutableColumn<string | null>;
  readonly canonical_label: MutableColumn<string>;
  readonly normalized_key: MutableColumn<string>;
  readonly status: MutableColumn<'active' | 'inactive'>;
  readonly version: MutableColumn<number>;
  readonly created_by_actor_id: ImmutableColumn<string | null>;
  readonly updated_by_actor_id: MutableColumn<string | null>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface RepairInterventionRiskTable {
  readonly repair_id: ImmutableColumn<string>;
  readonly risk_id: ImmutableColumn<string>;
  readonly risk_label_snapshot: ImmutableColumn<string>;
  readonly selection_order: ImmutableColumn<number>;
  readonly recorded_by_actor_id: ImmutableColumn<string>;
  readonly recorded_at: ImmutableColumn<Date>;
}

export interface RepairRiskCatalogEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly risk_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.catalogs.manage'>;
  readonly action: ImmutableColumn<'repair_risk.created' | 'repair_risk.renamed' | 'repair_risk.deactivated' | 'repair_risk.reactivated'>;
  readonly old_version: ImmutableColumn<number | null>;
  readonly new_version: ImmutableColumn<number>;
  readonly old_label: ImmutableColumn<string | null>;
  readonly new_label: ImmutableColumn<string>;
  readonly old_status: ImmutableColumn<'active' | 'inactive' | null>;
  readonly new_status: ImmutableColumn<'active' | 'inactive'>;
  readonly result: ImmutableColumn<'succeeded'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairProblemCategoryTable {
  readonly category_id: ImmutableColumn<string>;
  readonly scope: ImmutableColumn<'platform' | 'tenant'>;
  readonly tenant_id: ImmutableColumn<string | null>;
  readonly code: ImmutableColumn<string | null>;
  readonly canonical_label: MutableColumn<string>;
  readonly normalized_key: MutableColumn<string>;
  readonly status: MutableColumn<'active' | 'inactive'>;
  readonly version: MutableColumn<number>;
  readonly created_by_actor_id: ImmutableColumn<string | null>;
  readonly updated_by_actor_id: MutableColumn<string | null>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface RepairProblemCategoryCatalogEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly category_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.catalogs.manage'>;
  readonly pending_problem_value_id: ImmutableColumn<string | null>;
  readonly action: ImmutableColumn<'repair_problem_category.created' | 'repair_problem_category.renamed' | 'repair_problem_category.deactivated' | 'repair_problem_category.reactivated' | 'repair_problem_pending.resolved' | 'repair_problem_pending.canonical_created'>;
  readonly old_version: ImmutableColumn<number | null>;
  readonly new_version: ImmutableColumn<number>;
  readonly old_label: ImmutableColumn<string | null>;
  readonly new_label: ImmutableColumn<string>;
  readonly old_status: ImmutableColumn<'active' | 'inactive' | 'pending' | null>;
  readonly new_status: ImmutableColumn<'active' | 'inactive' | 'resolved'>;
  readonly result: ImmutableColumn<'succeeded'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairProblemCategoryDeletionEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly category_id: ImmutableColumn<string>;
  readonly catalog_scope: ImmutableColumn<'platform' | 'tenant'>;
  readonly previous_label: ImmutableColumn<string | null>;
  readonly previous_status: ImmutableColumn<'active' | 'inactive' | null>;
  readonly category_version: ImmutableColumn<number | null>;
  readonly expected_version: ImmutableColumn<number>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.catalogs.manage'>;
  readonly action: ImmutableColumn<'catalog_entry.deleted'>;
  readonly result: ImmutableColumn<'succeeded' | 'rejected'>;
  readonly rejection_reason: ImmutableColumn<'not_found' | 'platform_owned' | 'version_conflict' | 'historical_references' | null>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface CatalogReferenceDeletionEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly reference_kind: ImmutableColumn<'CATEGORY' | 'BRAND'>;
  readonly reference_id: ImmutableColumn<string>;
  readonly catalog_scope: ImmutableColumn<'platform' | 'tenant'>;
  readonly previous_label: ImmutableColumn<string | null>;
  readonly previous_status: ImmutableColumn<'ACTIVE' | 'INACTIVE' | null>;
  readonly reference_version: ImmutableColumn<number | null>;
  readonly expected_version: ImmutableColumn<number>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<string>;
  readonly result: ImmutableColumn<'succeeded' | 'rejected'>;
  readonly rejection_reason: ImmutableColumn<'not_found' | 'version_conflict' | 'reference_in_use' | 'authorization_changed' | null>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface CatalogReferenceMergeEventTable {
  readonly merge_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly reference_kind: ImmutableColumn<'CATEGORY' | 'BRAND'>;
  readonly survivor_reference_id: ImmutableColumn<string>;
  readonly source_reference_ids: ImmutableColumn<unknown>;
  readonly previous_names: ImmutableColumn<unknown>;
  readonly final_name: ImmutableColumn<string>;
  readonly reassigned_item_count: ImmutableColumn<number>;
  readonly reassigned_reconciliation_count: ImmutableColumn<number>;
  readonly applicability_before: ImmutableColumn<unknown>;
  readonly applicability_after: ImmutableColumn<unknown>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<string>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairCatalogReferenceDeletionEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly reference_kind: ImmutableColumn<'RISK' | 'DEVICE_TYPE' | 'BRAND' | 'MODEL'>;
  readonly reference_id: ImmutableColumn<string>;
  readonly catalog_scope: ImmutableColumn<'platform' | 'tenant'>;
  readonly previous_label: ImmutableColumn<string | null>;
  readonly previous_status: ImmutableColumn<'active' | 'inactive' | null>;
  readonly previous_record: ImmutableColumn<Readonly<Record<string, unknown>> | null>;
  readonly reference_version: ImmutableColumn<number | null>;
  readonly expected_version: ImmutableColumn<number>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.catalogs.manage'>;
  readonly result: ImmutableColumn<'succeeded' | 'rejected'>;
  readonly rejection_reason: ImmutableColumn<'not_found' | 'platform_owned' | 'version_conflict' | 'reference_in_use' | 'authorization_changed' | null>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairProblemPendingValueTable {
  readonly pending_problem_value_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly raw_label_example: ImmutableColumn<string>;
  readonly normalized_key: ImmutableColumn<string>;
  readonly resolution_status: MutableColumn<'pending' | 'resolved'>;
  readonly canonical_category_id: MutableColumn<string | null>;
  readonly version: MutableColumn<number>;
  readonly first_seen_at: ImmutableColumn<Date>;
  readonly last_seen_at: MutableColumn<Date>;
  readonly resolved_by_actor_id: MutableColumn<string | null>;
  readonly resolved_at: MutableColumn<Date | null>;
}

export interface RepairProblemClassificationTable {
  readonly problem_capture_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly category_id: MutableColumn<string | null>;
  readonly pending_problem_value_id: ImmutableColumn<string | null>;
  readonly raw_problem_label_snapshot: ImmutableColumn<string>;
  readonly normalized_problem_key: ImmutableColumn<string>;
  readonly category_label_snapshot: MutableColumn<string | null>;
  readonly selection_order: ImmutableColumn<number>;
  readonly source: ImmutableColumn<'manual'>;
  readonly stage: ImmutableColumn<'intake' | 'post_intake'>;
  readonly assigned_by_actor_id: ImmutableColumn<string>;
  readonly assigned_at: ImmutableColumn<Date>;
}

export interface RepairProblemClassificationEventTable {
  readonly event_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly category_id: ImmutableColumn<string>;
  readonly timeline_entry_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.classify'>;
  readonly action: ImmutableColumn<'repair.problem_category.assigned' | 'repair.problem_category.removed'>;
  readonly category_label_snapshot: ImmutableColumn<string>;
  readonly source: ImmutableColumn<'manual'>;
  readonly stage: ImmutableColumn<'post_intake'>;
  readonly result: ImmutableColumn<'succeeded'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairNewRepairPolicyHeadTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly schema_version: MutableColumn<number>;
  readonly current_version: MutableColumn<number>;
  readonly field_states: MutableColumn<Record<string, string>>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

export interface RepairNewRepairPolicyVersionTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly policy_version: ImmutableColumn<number>;
  readonly schema_version: ImmutableColumn<number>;
  readonly previous_version: ImmutableColumn<number>;
  readonly field_states: ImmutableColumn<Record<string, string>>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.configuration.manage'>;
  readonly action: ImmutableColumn<'new_repair_policy.updated' | 'new_repair_policy.reset'>;
  readonly result: ImmutableColumn<'succeeded'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
}

export interface RepairTimelineEntryTable {
  readonly entry_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly entry_type: ImmutableColumn<string>;
  readonly actor_id: ImmutableColumn<string | null>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly title: ImmutableColumn<string | null>;
  readonly body: ImmutableColumn<string | null>;
  readonly source: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string | null>;
  readonly occurred_at: ImmutableColumn<Date>;
  readonly created_at: ImmutableColumn<Date>;
}

/** Repairs-owned, append-only business evidence; never a timeline or log. */
export interface RepairBusinessAuditEventTable {
  readonly audit_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly session_id: ImmutableColumn<string>;
  readonly actor_user_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly capability: ImmutableColumn<'repairs.add_note' | 'repairs.create' | 'repairs.correct_intake'>;
  readonly action: ImmutableColumn<'repair.operational_note.added' | 'repair.received' | 'repair.equipment.corrected'>;
  readonly resource_type: ImmutableColumn<'repair'>;
  readonly resource_id: ImmutableColumn<string>;
  readonly result: ImmutableColumn<'succeeded'>;
  readonly correlation_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
  readonly created_at: ImmutableColumn<Date>;
}

/** Repairs-owned durable serialization key for operational-note retries. */
export interface RepairOperationalNoteRequestGuardTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly action: ImmutableColumn<'repair.operational_note.added'>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

/** Repairs-owned replay record for the atomic Customer + Repair intake write. */
export interface RepairCreateCommandTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly request_fingerprint: ImmutableColumn<Uint8Array>;
  readonly repair_id: ImmutableColumn<string>;
  readonly customer_id: ImmutableColumn<string>;
  readonly folio: ImmutableColumn<string>;
  readonly applied_at: ImmutableColumn<Date>;
}

export interface RepairFolioSequenceTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly next_value: MutableColumn<number>;
  readonly updated_at: MutableColumn<Date>;
}

export interface RepairAttachmentTable {
  readonly attachment_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly kind: ImmutableColumn<string>;
  readonly category: ImmutableColumn<string>;
  readonly storage_key: ImmutableColumn<string>;
  readonly mime_type: ImmutableColumn<string>;
  readonly size_bytes: ImmutableColumn<number>;
  readonly width: ImmutableColumn<number | null>;
  readonly height: ImmutableColumn<number | null>;
  readonly caption: ImmutableColumn<string | null>;
  readonly captured_at: ImmutableColumn<Date | null>;
  readonly uploaded_at: ImmutableColumn<Date>;
  readonly uploaded_by_id: ImmutableColumn<string | null>;
  readonly uploaded_by_display_name: ImmutableColumn<string | null>;
}

export interface RepairTechnicianTable {
  readonly technician_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly display_name: ImmutableColumn<string>;
  readonly active: ImmutableColumn<boolean>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface RepairTechnicianBranchTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly technician_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface RepairTechnicianAssignmentTable {
  readonly assignment_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly technician_id: ImmutableColumn<string>;
  readonly assigned_by_actor_id: ImmutableColumn<string>;
  readonly assigned_by_actor_display_name: ImmutableColumn<string>;
  readonly assigned_at: ImmutableColumn<Date>;
  readonly ended_at: MutableColumn<Date | null>;
  readonly ended_by_actor_id: MutableColumn<string | null>;
  readonly ended_by_actor_display_name: MutableColumn<string | null>;
  readonly reason: MutableColumn<string | null>;
  readonly client_request_id: MutableColumn<string>;
  readonly ended_client_request_id: MutableColumn<string | null>;
  readonly assignment_sequence: ImmutableColumn<number>;
}

export interface RepairWorkflowTransitionTable {
  readonly transition_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly command: ImmutableColumn<string>;
  readonly from_state: ImmutableColumn<string>;
  readonly to_state: ImmutableColumn<string>;
  readonly actor_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
  readonly reason: ImmutableColumn<string | null>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly expected_workflow_version: ImmutableColumn<number>;
  readonly workflow_version: ImmutableColumn<number>;
}

export interface RepairLocationTable {
  readonly location_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly code: ImmutableColumn<string>;
  readonly semantic_category: ImmutableColumn<string>;
  readonly display_label: ImmutableColumn<string>;
  readonly active: ImmutableColumn<boolean>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface RepairLocationMovementTable {
  readonly movement_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly command: ImmutableColumn<string>;
  readonly from_location_id: ImmutableColumn<string | null>;
  readonly to_location_id: ImmutableColumn<string>;
  readonly from_code: ImmutableColumn<string | null>;
  readonly from_label: ImmutableColumn<string | null>;
  readonly to_code: ImmutableColumn<string>;
  readonly to_label: ImmutableColumn<string>;
  readonly actor_id: ImmutableColumn<string>;
  readonly actor_display_name: ImmutableColumn<string>;
  readonly occurred_at: ImmutableColumn<Date>;
  readonly reason: ImmutableColumn<string | null>;
  readonly client_request_id: ImmutableColumn<string>;
  readonly expected_location_version: ImmutableColumn<number>;
  readonly location_version: ImmutableColumn<number>;
}

export interface DatabaseSchema {
  readonly tenants: TenantTable;
  readonly branches: BranchTable;
  readonly stations: StationTable;
  readonly station_bindings: StationBindingTable;
  readonly station_credentials: StationCredentialTable;
  readonly users: UserTable;
  readonly user_preferences: UserPreferencesTable;
  readonly catalog_categories: CatalogCategoryTable;
  readonly catalog_brands: CatalogBrandTable;
  readonly catalog_category_pending_values: CatalogCategoryPendingValueTable;
  readonly catalog_brand_pending_values: CatalogBrandPendingValueTable;
  readonly catalog_brand_pending_kind_applicability: CatalogBrandPendingKindApplicabilityTable;
  readonly catalog_items: CatalogItemTable;
  readonly catalog_item_identifiers: CatalogItemIdentifierTable;
  readonly catalog_sku_sequences: CatalogSkuSequenceTable;
  readonly catalog_category_kind_applicability: CatalogCategoryKindApplicabilityTable;
  readonly catalog_brand_kind_applicability: CatalogBrandKindApplicabilityTable;
  readonly catalog_barcode_sequences: CatalogBarcodeSequenceTable;
  readonly catalog_base_price_revisions: CatalogBasePriceRevisionTable;
  readonly catalog_branch_price_revisions: CatalogBranchPriceRevisionTable;
  readonly catalog_reference_cost_revisions: CatalogReferenceCostRevisionTable;
  readonly catalog_commands: CatalogCommandTable;
  readonly catalog_audit_events: CatalogAuditEventTable;
  readonly catalog_reference_deletion_events: CatalogReferenceDeletionEventTable;
  readonly catalog_reference_merge_events: CatalogReferenceMergeEventTable;
  readonly catalog_reference_identity_locks: CatalogReferenceIdentityLockTable;
  readonly catalog_supplier_sources: CatalogSupplierSourceTable;
  readonly catalog_supplier_catalog_versions: CatalogSupplierCatalogVersionTable;
  readonly catalog_supplier_version_raw_payloads: CatalogSupplierVersionRawPayloadTable;
  readonly catalog_supplier_listings: CatalogSupplierListingTable;
  readonly catalog_update_batches: CatalogUpdateBatchTable;
  readonly catalog_update_row_decisions: CatalogUpdateRowDecisionTable;
  readonly catalog_supplier_listing_resolutions: CatalogSupplierListingResolutionTable;
  readonly catalog_supplier_reconciliation_memory: CatalogSupplierReconciliationMemoryTable;
  readonly catalog_supplier_source_deletion_events: CatalogSupplierSourceDeletionEventTable;
  readonly catalog_retirement_plans: CatalogRetirementPlanTable;
  readonly catalog_retirement_events: CatalogRetirementEventTable;
  readonly catalog_field_policy_heads: CatalogFieldPolicyHeadTable;
  readonly catalog_field_policy_versions: CatalogFieldPolicyVersionTable;
  readonly customers: CustomerTable;
  readonly customer_contact_phones: CustomerContactPhoneTable;
  readonly user_provisioning_bootstraps: UserProvisioningBootstrapTable;
  readonly user_lifecycle_commands: UserLifecycleCommandTable;
  readonly user_profile_update_commands: UserProfileUpdateCommandTable;
  readonly user_create_commands: UserCreateCommandTable;
  readonly access_capabilities: AccessCapabilityTable;
  readonly access_roles: AccessRoleTable;
  readonly access_role_commands: AccessRoleCommandTable;
  readonly access_role_capabilities: AccessRoleCapabilityTable;
  readonly access_role_assignments: AccessRoleAssignmentTable;
  readonly access_role_assignment_commands: AccessRoleAssignmentCommandTable;
  readonly access_pin_credentials: AccessPinCredentialTable;
  readonly access_pin_credential_commands: AccessPinCredentialCommandTable;
  readonly access_pin_eligibility_tenant_guards: AccessPinEligibilityTenantGuardTable;
  readonly access_pin_attempt_station_guards: AccessPinAttemptStationGuardTable;
  readonly access_pin_attempt_limits: AccessPinAttemptLimitTable;
  readonly access_operational_session_station_guards: AccessOperationalSessionStationGuardTable;
  readonly access_operational_sessions: AccessOperationalSessionTable;
  readonly access_admin_identities: AccessAdminIdentityTable;
  readonly access_admin_password_credentials: AccessAdminPasswordCredentialTable;
  readonly access_admin_sessions: AccessAdminSessionTable;
  readonly access_admin_auth_attempt_limits: AccessAdminAuthAttemptLimitTable;
  readonly access_admin_recovery_challenges: AccessAdminRecoveryChallengeTable;
  readonly access_admin_security_events: AccessAdminSecurityEventTable;
  readonly repairs: RepairTable;
  readonly repair_intakes: RepairIntakeTable;
  readonly repair_device_types: RepairDeviceTypeTable;
  readonly repair_device_type_pending_values: RepairDeviceTypePendingValueTable;
  readonly repair_device_type_catalog_events: RepairDeviceTypeCatalogEventTable;
  readonly repair_equipment_corrections: RepairEquipmentCorrectionTable;
  readonly repair_brands: RepairBrandTable;
  readonly repair_brand_pending_values: RepairBrandPendingValueTable;
  readonly repair_brand_catalog_events: RepairBrandCatalogEventTable;
  readonly repair_models: RepairModelTable;
  readonly repair_model_pending_values: RepairModelPendingValueTable;
  readonly repair_model_catalog_events: RepairModelCatalogEventTable;
  readonly repair_risks: RepairRiskTable;
  readonly repair_intervention_risks: RepairInterventionRiskTable;
  readonly repair_risk_catalog_events: RepairRiskCatalogEventTable;
  readonly repair_problem_categories: RepairProblemCategoryTable;
  readonly repair_problem_pending_values: RepairProblemPendingValueTable;
  readonly repair_problem_category_catalog_events: RepairProblemCategoryCatalogEventTable;
  readonly repair_problem_category_deletion_events: RepairProblemCategoryDeletionEventTable;
  readonly repair_catalog_reference_deletion_events: RepairCatalogReferenceDeletionEventTable;
  readonly repair_problem_classifications: RepairProblemClassificationTable;
  readonly repair_problem_classification_events: RepairProblemClassificationEventTable;
  readonly repair_new_repair_policy_heads: RepairNewRepairPolicyHeadTable;
  readonly repair_new_repair_policy_versions: RepairNewRepairPolicyVersionTable;
  readonly repair_timeline_entries: RepairTimelineEntryTable;
  readonly repair_business_audit_events: RepairBusinessAuditEventTable;
  readonly repair_operational_note_request_guards: RepairOperationalNoteRequestGuardTable;
  readonly repair_create_commands: RepairCreateCommandTable;
  readonly repair_folio_sequences: RepairFolioSequenceTable;
  readonly repair_attachments: RepairAttachmentTable;
  readonly repair_technicians: RepairTechnicianTable;
  readonly repair_technician_branches: RepairTechnicianBranchTable;
  readonly repair_technician_assignments: RepairTechnicianAssignmentTable;
  readonly repair_workflow_transitions: RepairWorkflowTransitionTable;
  readonly repair_locations: RepairLocationTable;
  readonly repair_location_movements: RepairLocationMovementTable;
}

export type TenantRow = Selectable<TenantTable>;
export type NewTenant = Insertable<TenantTable>;
export type TenantUpdate = Updateable<TenantTable>;

export type BranchRow = Selectable<BranchTable>;
export type NewBranch = Insertable<BranchTable>;
export type BranchUpdate = Updateable<BranchTable>;

export type StationRow = Selectable<StationTable>;
export type NewStation = Insertable<StationTable>;
export type StationBindingRow = Selectable<StationBindingTable>;
export type NewStationBinding = Insertable<StationBindingTable>;
export type StationCredentialRow = Selectable<StationCredentialTable>;
export type NewStationCredential = Insertable<StationCredentialTable>;
export type UserRow = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type CustomerRow = Selectable<CustomerTable>;
export type NewCustomer = Insertable<CustomerTable>;
export type CustomerContactPhoneRow = Selectable<CustomerContactPhoneTable>;
export type NewCustomerContactPhone = Insertable<CustomerContactPhoneTable>;
export type UserProvisioningBootstrapRow = Selectable<UserProvisioningBootstrapTable>;
export type NewUserProvisioningBootstrap = Insertable<UserProvisioningBootstrapTable>;
export type UserLifecycleCommandRow = Selectable<UserLifecycleCommandTable>;
export type NewUserLifecycleCommand = Insertable<UserLifecycleCommandTable>;
export type UserProfileUpdateCommandRow = Selectable<UserProfileUpdateCommandTable>;
export type UserCreateCommandRow = Selectable<UserCreateCommandTable>;
export type NewUserCreateCommand = Insertable<UserCreateCommandTable>;
export type NewUserProfileUpdateCommand = Insertable<UserProfileUpdateCommandTable>;

export type AccessCapabilityRow = Selectable<AccessCapabilityTable>;
export type NewAccessCapability = Insertable<AccessCapabilityTable>;

export type AccessRoleRow = Selectable<AccessRoleTable>;
export type NewAccessRole = Insertable<AccessRoleTable>;
export type AccessRoleUpdate = Updateable<AccessRoleTable>;
export type AccessRoleCommandRow = Selectable<AccessRoleCommandTable>;
export type NewAccessRoleCommand = Insertable<AccessRoleCommandTable>;

export type AccessRoleCapabilityRow = Selectable<AccessRoleCapabilityTable>;
export type NewAccessRoleCapability = Insertable<AccessRoleCapabilityTable>;

export type AccessRoleAssignmentRow = Selectable<AccessRoleAssignmentTable>;
export type NewAccessRoleAssignment = Insertable<AccessRoleAssignmentTable>;
export type AccessRoleAssignmentUpdate = Updateable<AccessRoleAssignmentTable>;

export type AccessRoleAssignmentCommandRow =
  Selectable<AccessRoleAssignmentCommandTable>;
export type NewAccessRoleAssignmentCommand =
  Insertable<AccessRoleAssignmentCommandTable>;

export type AccessPinCredentialRow = Selectable<AccessPinCredentialTable>;
export type NewAccessPinCredential = Insertable<AccessPinCredentialTable>;
export type AccessPinCredentialUpdate = Updateable<AccessPinCredentialTable>;

export type AccessPinCredentialCommandRow =
  Selectable<AccessPinCredentialCommandTable>;
export type NewAccessPinCredentialCommand =
  Insertable<AccessPinCredentialCommandTable>;

export type AccessPinEligibilityTenantGuardRow =
  Selectable<AccessPinEligibilityTenantGuardTable>;
export type NewAccessPinEligibilityTenantGuard =
  Insertable<AccessPinEligibilityTenantGuardTable>;

export type AccessPinAttemptLimitRow = Selectable<AccessPinAttemptLimitTable>;
export type NewAccessPinAttemptLimit = Insertable<AccessPinAttemptLimitTable>;
export type AccessPinAttemptLimitUpdate = Updateable<AccessPinAttemptLimitTable>;

export type AccessPinAttemptStationGuardRow =
  Selectable<AccessPinAttemptStationGuardTable>;
export type NewAccessPinAttemptStationGuard =
  Insertable<AccessPinAttemptStationGuardTable>;

export type AccessOperationalSessionRow = Selectable<AccessOperationalSessionTable>;
export type NewAccessOperationalSession = Insertable<AccessOperationalSessionTable>;
export type AccessOperationalSessionUpdate = Updateable<AccessOperationalSessionTable>;
export type AccessOperationalSessionStationGuardRow =
  Selectable<AccessOperationalSessionStationGuardTable>;
export type AccessAdminIdentityRow = Selectable<AccessAdminIdentityTable>;
export type NewAccessAdminIdentity = Insertable<AccessAdminIdentityTable>;
export type AccessAdminIdentityUpdate = Updateable<AccessAdminIdentityTable>;
export type AccessAdminPasswordCredentialRow = Selectable<AccessAdminPasswordCredentialTable>;
export type NewAccessAdminPasswordCredential = Insertable<AccessAdminPasswordCredentialTable>;
export type AccessAdminPasswordCredentialUpdate = Updateable<AccessAdminPasswordCredentialTable>;
export type AccessAdminSessionRow = Selectable<AccessAdminSessionTable>;
export type NewAccessAdminSession = Insertable<AccessAdminSessionTable>;
export type AccessAdminSessionUpdate = Updateable<AccessAdminSessionTable>;
export type AccessAdminAuthAttemptLimitRow = Selectable<AccessAdminAuthAttemptLimitTable>;
export type AccessAdminRecoveryChallengeRow = Selectable<AccessAdminRecoveryChallengeTable>;
export type AccessAdminSecurityEventRow = Selectable<AccessAdminSecurityEventTable>;
export type NewAccessOperationalSessionStationGuard =
  Insertable<AccessOperationalSessionStationGuardTable>;

export type RepairRow = Selectable<RepairTable>;
export type NewRepair = Insertable<RepairTable>;
export type RepairUpdate = Updateable<RepairTable>;

export type RepairIntakeRow = Selectable<RepairIntakeTable>;
export type NewRepairIntake = Insertable<RepairIntakeTable>;
export type RepairIntakeUpdate = Updateable<RepairIntakeTable>;

export type RepairTimelineEntryRow = Selectable<RepairTimelineEntryTable>;
export type NewRepairTimelineEntry = Insertable<RepairTimelineEntryTable>;
export type RepairTimelineEntryUpdate = Updateable<RepairTimelineEntryTable>;

export type RepairBusinessAuditEventRow = Selectable<RepairBusinessAuditEventTable>;
export type NewRepairBusinessAuditEvent = Insertable<RepairBusinessAuditEventTable>;
export type RepairOperationalNoteRequestGuardRow = Selectable<RepairOperationalNoteRequestGuardTable>;
export type NewRepairOperationalNoteRequestGuard = Insertable<RepairOperationalNoteRequestGuardTable>;
export type RepairCreateCommandRow = Selectable<RepairCreateCommandTable>;
export type NewRepairCreateCommand = Insertable<RepairCreateCommandTable>;
export type RepairFolioSequenceRow = Selectable<RepairFolioSequenceTable>;
export type NewRepairFolioSequence = Insertable<RepairFolioSequenceTable>;

export type RepairAttachmentRow = Selectable<RepairAttachmentTable>;
export type NewRepairAttachment = Insertable<RepairAttachmentTable>;
export type RepairAttachmentUpdate = Updateable<RepairAttachmentTable>;
export type RepairTechnicianRow = Selectable<RepairTechnicianTable>;
export type NewRepairTechnician = Insertable<RepairTechnicianTable>;
export type RepairTechnicianBranchRow = Selectable<RepairTechnicianBranchTable>;
export type NewRepairTechnicianBranch = Insertable<RepairTechnicianBranchTable>;
export type RepairTechnicianAssignmentRow = Selectable<RepairTechnicianAssignmentTable>;
export type NewRepairTechnicianAssignment = Insertable<RepairTechnicianAssignmentTable>;
export type RepairWorkflowTransitionRow = Selectable<RepairWorkflowTransitionTable>;
export type NewRepairWorkflowTransition = Insertable<RepairWorkflowTransitionTable>;
export type RepairLocationRow = Selectable<RepairLocationTable>;
export type NewRepairLocation = Insertable<RepairLocationTable>;
export type RepairLocationMovementRow = Selectable<RepairLocationMovementTable>;
export type NewRepairLocationMovement = Insertable<RepairLocationMovementTable>;
