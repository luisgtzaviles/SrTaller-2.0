import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

type ImmutableColumn<T> = ColumnType<T, T, never>;
type MutableColumn<T> = ColumnType<T, T, T>;

export interface TenantTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface BranchTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
}

export interface StationTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly status: MutableColumn<'Unlinked' | 'Active' | 'Revoked'>;
  readonly revision: MutableColumn<number>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
  readonly revoked_at: MutableColumn<Date | null>;
}

export interface StationBindingTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly station_id: ImmutableColumn<string>;
  readonly binding_revision: ImmutableColumn<number>;
  readonly branch_id: ImmutableColumn<string>;
  readonly linked_at: ImmutableColumn<Date>;
  readonly unlinked_at: MutableColumn<Date | null>;
}

type PreviewRepairStatus =
  | 'received'
  | 'diagnosing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

interface PreviewRepairTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly folio: ImmutableColumn<string>;
  readonly customer_name: ImmutableColumn<string>;
  readonly customer_phone: ImmutableColumn<string>;
  readonly device_brand: ImmutableColumn<string>;
  readonly device_model: ImmutableColumn<string>;
  readonly device_serial: ImmutableColumn<string | null>;
  readonly device_color: ImmutableColumn<string | null>;
  readonly reported_problem: ImmutableColumn<string>;
  readonly physical_condition: ImmutableColumn<string | null>;
  readonly notes: ImmutableColumn<string | null>;
  readonly estimated_price: ImmutableColumn<string | null>;
  readonly deposit_amount: ImmutableColumn<string>;
  readonly status: MutableColumn<PreviewRepairStatus>;
  readonly revision: MutableColumn<number>;
  readonly created_station_id: ImmutableColumn<string>;
  readonly created_by_label: ImmutableColumn<string>;
  readonly created_at: ImmutableColumn<Date>;
  readonly updated_at: MutableColumn<Date>;
}

interface PreviewRepairStatusHistoryTable {
  readonly tenant_id: ImmutableColumn<string>;
  readonly branch_id: ImmutableColumn<string>;
  readonly history_id: ImmutableColumn<string>;
  readonly repair_id: ImmutableColumn<string>;
  readonly from_status: ImmutableColumn<PreviewRepairStatus | null>;
  readonly to_status: ImmutableColumn<PreviewRepairStatus>;
  readonly resulting_revision: ImmutableColumn<number>;
  readonly station_id: ImmutableColumn<string>;
  readonly actor_label: ImmutableColumn<string>;
  readonly changed_at: ImmutableColumn<Date>;
}

export interface DatabaseSchema {
  readonly tenants: TenantTable;
  readonly branches: BranchTable;
  readonly stations: StationTable;
  readonly station_bindings: StationBindingTable;
  readonly preview_repairs: PreviewRepairTable;
  readonly preview_repair_status_history: PreviewRepairStatusHistoryTable;
}

export type TenantRow = Selectable<TenantTable>;
export type NewTenant = Insertable<TenantTable>;
export type TenantUpdate = Updateable<TenantTable>;

export type BranchRow = Selectable<BranchTable>;
export type NewBranch = Insertable<BranchTable>;
export type BranchUpdate = Updateable<BranchTable>;

export type StationRow = Selectable<StationTable>;
export type NewStation = Insertable<StationTable>;
export type StationUpdate = Updateable<StationTable>;

export type StationBindingRow = Selectable<StationBindingTable>;
export type NewStationBinding = Insertable<StationBindingTable>;
export type StationBindingUpdate = Updateable<StationBindingTable>;
