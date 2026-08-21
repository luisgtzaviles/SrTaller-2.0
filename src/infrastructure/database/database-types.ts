import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

type ImmutableColumn<T> = ColumnType<T, T, never>;

export interface TenantTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface BranchTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
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
  readonly repair_status: ImmutableColumn<string>;
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

export interface DatabaseSchema {
  readonly tenants: TenantTable;
  readonly branches: BranchTable;
  readonly repairs: RepairTable;
  readonly repair_intakes: RepairIntakeTable;
  readonly repair_timeline_entries: RepairTimelineEntryTable;
  readonly repair_attachments: RepairAttachmentTable;
}

export type TenantRow = Selectable<TenantTable>;
export type NewTenant = Insertable<TenantTable>;
export type TenantUpdate = Updateable<TenantTable>;

export type BranchRow = Selectable<BranchTable>;
export type NewBranch = Insertable<BranchTable>;
export type BranchUpdate = Updateable<BranchTable>;

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
