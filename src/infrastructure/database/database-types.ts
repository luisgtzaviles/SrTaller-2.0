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

export interface DatabaseSchema {
  readonly tenants: TenantTable;
  readonly branches: BranchTable;
  readonly stations: StationTable;
  readonly station_bindings: StationBindingTable;
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
