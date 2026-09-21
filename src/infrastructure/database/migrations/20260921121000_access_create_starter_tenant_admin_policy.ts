import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { AccessCapabilityCode, DatabaseSchema } from '../database-types.js';

const newCapabilities = [
  'tenant.profile.read',
  'tenant.profile.manage',
  'branches.read',
  'branches.manage',
  'branches.deactivate',
  'stations.read',
  'stations.manage',
  'stations.enrollment.issue',
  'stations.enrollment.cancel',
  'stations.revoke',
  'stations.relink',
] as const satisfies readonly AccessCapabilityCode[];

const starterBundle = [
  'tenant.profile.read',
  'tenant.profile.manage',
  'branches.read',
  'branches.manage',
  'branches.deactivate',
  'users.read',
  'users.manage',
  'access_matrix.read',
  'access_matrix.manage',
  'stations.read',
  'stations.manage',
  'stations.enrollment.issue',
  'stations.enrollment.cancel',
  'stations.revoke',
  'stations.relink',
] as const satisfies readonly AccessCapabilityCode[];

const allCapabilities = [
  'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
  'repairs.read', 'repairs.add_note', 'repairs.create', 'repairs.correct_intake',
  'repairs.classify', 'repairs.catalogs.read', 'repairs.catalogs.manage',
  'repairs.configuration.read', 'repairs.configuration.manage', 'price_list.read',
  'catalog.manage', 'catalog.items.create', 'catalog.items.update',
  'catalog.items.deactivate', 'catalog.prices.manage',
  'catalog.branch_prices.manage', 'catalog.reference_cost.read',
  'catalog.reference_cost.manage', 'catalog.configuration.read',
  'catalog.configuration.manage', 'catalog.import.read',
  'catalog.import.prepare', 'catalog.import.publish',
  'catalog.items.bulk_retire', 'catalog.suppliers.delete',
  ...newCapabilities,
] as const;

async function replaceCapabilityConstraint(
  database: Kysely<DatabaseSchema>,
  values: readonly string[],
): Promise<void> {
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`
    .execute(database);
  await sql.raw(
    `alter table access_capabilities add constraint access_capabilities_code_ck check (capability_code in (${values.map((value) => `'${value}'`).join(', ')}))`,
  ).execute(database);
}

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('access_roles')
    .addColumn('management_mode', 'varchar(24)', (column) =>
      column.notNull().defaultTo('TENANT_MANAGED'))
    .addColumn('policy_version', 'integer')
    .execute();
  await database.schema.alterTable('access_roles').addCheckConstraint(
    'access_roles_management_policy_ck',
    sql`(management_mode = 'TENANT_MANAGED' and policy_version is null) or
        (management_mode = 'SYSTEM_MANAGED' and policy_version >= 1)`,
  ).execute();

  await replaceCapabilityConstraint(database, allCapabilities);
  const createdAt = new Date('2026-09-21T12:10:00.000Z');
  await database.insertInto('access_capabilities')
    .values(newCapabilities.map((capability_code) => ({ capability_code, created_at: createdAt })))
    .onConflict((conflict) => conflict.column('capability_code').doNothing())
    .execute();

  await sql`
    insert into access_roles (
      tenant_id, role_id, role_key, display_name, description, status, version,
      management_mode, policy_version, created_at, updated_at
    )
    select
      tenant.tenant_id,
      md5('srtaller:tenant-admin-role:' || tenant.tenant_id::text)::uuid,
      'tenant_admin',
      'Administrador del tenant',
      'Autoridad administrativa inicial protegida por el sistema.',
      'active',
      0,
      'SYSTEM_MANAGED',
      1,
      tenant.created_at,
      tenant.created_at
    from tenants tenant
    where exists (
      select 1
      from users actor
      join access_admin_identities identity
        on identity.tenant_id = actor.tenant_id
       and identity.user_id = actor.user_id
      join access_admin_password_credentials credential
        on credential.tenant_id = identity.tenant_id
       and credential.admin_identity_id = identity.admin_identity_id
       and credential.user_id = identity.user_id
      where actor.tenant_id = tenant.tenant_id
        and actor.status = 'active'
        and identity.status = 'active'
        and identity.verified_at is not null
        and credential.status = 'active'
    )
    on conflict (tenant_id, role_key) do nothing
  `.execute(database);

  await sql`
    insert into access_role_capabilities (
      tenant_id, role_id, capability_code, created_at
    )
    select role.tenant_id, role.role_id, bundle.capability_code, role.created_at
    from access_roles role
    cross join unnest(${starterBundle}::varchar[]) as bundle(capability_code)
    where role.role_key = 'tenant_admin'
      and role.management_mode = 'SYSTEM_MANAGED'
      and role.policy_version = 1
    on conflict (tenant_id, role_id, capability_code) do nothing
  `.execute(database);

  await sql`
    insert into access_role_assignments (
      tenant_id, assignment_id, user_id, role_id, assignment_scope,
      branch_id, status, version, assigned_at, revoked_at
    )
    select
      identity.tenant_id,
      md5('srtaller:tenant-admin-assignment:' || identity.tenant_id::text || ':' || identity.user_id::text)::uuid,
      identity.user_id,
      role.role_id,
      'TENANT_WIDE',
      null,
      'active',
      0,
      greatest(identity.created_at, role.created_at),
      null
    from access_admin_identities identity
    join access_admin_password_credentials credential
      on credential.tenant_id = identity.tenant_id
     and credential.admin_identity_id = identity.admin_identity_id
     and credential.user_id = identity.user_id
    join users actor
      on actor.tenant_id = identity.tenant_id
     and actor.user_id = identity.user_id
    join access_roles role
      on role.tenant_id = identity.tenant_id
     and role.role_key = 'tenant_admin'
     and role.management_mode = 'SYSTEM_MANAGED'
     and role.policy_version = 1
    where identity.status = 'active'
      and identity.verified_at is not null
      and credential.status = 'active'
      and actor.status = 'active'
    on conflict do nothing
  `.execute(database);

  await sql`
    update tenants tenant
    set lifecycle_status = 'ACTIVE',
        version = tenant.version + 1,
        updated_at = greatest(tenant.updated_at, clock_timestamp())
    where tenant.lifecycle_status = 'ONBOARDING'
      and exists (
        select 1 from branches branch
        where branch.tenant_id = tenant.tenant_id and branch.active = true
      )
      and exists (
        select 1
        from access_role_assignments assignment
        join access_roles role
          on role.tenant_id = assignment.tenant_id
         and role.role_id = assignment.role_id
        join users actor
          on actor.tenant_id = assignment.tenant_id
         and actor.user_id = assignment.user_id
        join access_admin_identities identity
          on identity.tenant_id = actor.tenant_id
         and identity.user_id = actor.user_id
        join access_admin_password_credentials credential
          on credential.tenant_id = identity.tenant_id
         and credential.admin_identity_id = identity.admin_identity_id
         and credential.user_id = identity.user_id
        where assignment.tenant_id = tenant.tenant_id
          and assignment.assignment_scope = 'TENANT_WIDE'
          and assignment.status = 'active'
          and role.role_key = 'tenant_admin'
          and role.management_mode = 'SYSTEM_MANAGED'
          and role.policy_version = 1
          and role.status = 'active'
          and actor.status = 'active'
          and identity.status = 'active'
          and identity.verified_at is not null
          and credential.status = 'active'
      )
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.updateTable('tenants')
    .set({ lifecycle_status: 'ONBOARDING' })
    .where('lifecycle_status', '=', 'ACTIVE')
    .execute();
  await sql`
    delete from access_role_assignments assignment
    using access_roles role
    where role.tenant_id = assignment.tenant_id
      and role.role_id = assignment.role_id
      and role.management_mode = 'SYSTEM_MANAGED'
      and role.role_key = 'tenant_admin'
  `.execute(database);
  await sql`
    delete from access_role_capabilities capability
    using access_roles role
    where role.tenant_id = capability.tenant_id
      and role.role_id = capability.role_id
      and role.management_mode = 'SYSTEM_MANAGED'
      and role.role_key = 'tenant_admin'
  `.execute(database);
  await database.deleteFrom('access_roles')
    .where('management_mode', '=', 'SYSTEM_MANAGED')
    .where('role_key', '=', 'tenant_admin')
    .execute();
  await database.deleteFrom('access_capabilities')
    .where('capability_code', 'in', newCapabilities)
    .execute();
  await replaceCapabilityConstraint(database, allCapabilities.filter(
    (capability) => !newCapabilities.includes(capability as typeof newCapabilities[number]),
  ));
  await database.schema.alterTable('access_roles')
    .dropConstraint('access_roles_management_policy_ck')
    .execute();
  await database.schema.alterTable('access_roles')
    .dropColumn('policy_version')
    .dropColumn('management_mode')
    .execute();
}
