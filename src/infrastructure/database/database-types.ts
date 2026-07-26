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

export interface DatabaseSchema {
  readonly tenants: TenantTable;
  readonly branches: BranchTable;
}

export type TenantRow = Selectable<TenantTable>;
export type NewTenant = Insertable<TenantTable>;
export type TenantUpdate = Updateable<TenantTable>;

export type BranchRow = Selectable<BranchTable>;
export type NewBranch = Insertable<BranchTable>;
export type BranchUpdate = Updateable<BranchTable>;
