import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

type ImmutableColumn<T> = ColumnType<T, T, never>;
type DefaultedImmutableColumn<T> = ColumnType<T, T | undefined, never>;
type MutableColumn<T> = ColumnType<T, T, T>;

export interface TenantTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface BranchTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly time_zone: MutableColumn<string>;
  readonly active: DefaultedImmutableColumn<boolean>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface StationTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly status: ImmutableColumn<'active' | 'revoked'>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: ImmutableColumn<Date>;
  readonly revoked_at: ImmutableColumn<Date | null>;
}

export interface StationBindingTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly revoked_at: ImmutableColumn<Date | null>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface StationCredentialTable {
  readonly credential_id: ImmutableColumn<string>;
  readonly credential_hash: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly revoked_at: ImmutableColumn<Date | null>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface UserTable {
  readonly user_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly display_name: MutableColumn<string>;
  readonly operational_identifier: MutableColumn<string | null>;
  readonly status: MutableColumn<'active' | 'inactive' | 'revoked'>;
  readonly version: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
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

export interface RepairTable {
  readonly repair_id: ImmutableColumn<string>;
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly folio: ImmutableColumn<string>;
  readonly received_at: ImmutableColumn<Date>;
  readonly customer_name: ImmutableColumn<string>;
  readonly customer_phone: ImmutableColumn<string>;
  readonly device_brand: ImmutableColumn<string>;
  readonly device_model: ImmutableColumn<string>;
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
  readonly received_by_id: ImmutableColumn<string | null>;
  readonly received_by_display_name: ImmutableColumn<string | null>;
  readonly customer_narrative: ImmutableColumn<string | null>;
  readonly physical_condition_summary: ImmutableColumn<string | null>;
  readonly documented_risk_summary: ImmutableColumn<string | null>;
  readonly created_at: ImmutableColumn<Date>;
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
  readonly user_provisioning_bootstraps: UserProvisioningBootstrapTable;
  readonly user_lifecycle_commands: UserLifecycleCommandTable;
  readonly repairs: RepairTable;
  readonly repair_intakes: RepairIntakeTable;
  readonly repair_timeline_entries: RepairTimelineEntryTable;
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
export type UserProvisioningBootstrapRow = Selectable<UserProvisioningBootstrapTable>;
export type NewUserProvisioningBootstrap = Insertable<UserProvisioningBootstrapTable>;
export type UserLifecycleCommandRow = Selectable<UserLifecycleCommandTable>;
export type NewUserLifecycleCommand = Insertable<UserLifecycleCommandTable>;

export type RepairRow = Selectable<RepairTable>;
export type NewRepair = Insertable<RepairTable>;
export type RepairUpdate = Updateable<RepairTable>;

export type RepairIntakeRow = Selectable<RepairIntakeTable>;
export type NewRepairIntake = Insertable<RepairIntakeTable>;
export type RepairIntakeUpdate = Updateable<RepairIntakeTable>;

export type RepairTimelineEntryRow = Selectable<RepairTimelineEntryTable>;
export type NewRepairTimelineEntry = Insertable<RepairTimelineEntryTable>;
export type RepairTimelineEntryUpdate = Updateable<RepairTimelineEntryTable>;

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
