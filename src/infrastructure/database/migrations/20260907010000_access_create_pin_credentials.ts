import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('access_pin_credentials')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('credential_id', 'uuid', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) =>
      column.notNull().defaultTo('active'),
    )
    .addColumn('algorithm', 'varchar(16)', (column) => column.notNull())
    .addColumn('profile_version', 'integer', (column) => column.notNull())
    .addColumn('pepper_version', 'integer', (column) => column.notNull())
    .addColumn('memory_kib', 'integer', (column) => column.notNull())
    .addColumn('passes', 'integer', (column) => column.notNull())
    .addColumn('parallelism', 'integer', (column) => column.notNull())
    .addColumn('salt', 'bytea', (column) => column.notNull())
    .addColumn('verifier', 'bytea', (column) => column.notNull())
    .addColumn('credential_version', 'integer', (column) =>
      column.notNull().defaultTo(0),
    )
    .addColumn('consecutive_failures', 'integer', (column) =>
      column.notNull().defaultTo(0),
    )
    .addColumn('locked_until', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addPrimaryKeyConstraint('access_pin_credentials_pk', [
      'tenant_id',
      'user_id',
    ])
    .addUniqueConstraint('access_pin_credentials_identity_uq', [
      'tenant_id',
      'user_id',
      'credential_id',
    ])
    .addUniqueConstraint('access_pin_credentials_id_uq', [
      'tenant_id',
      'credential_id',
    ])
    .addForeignKeyConstraint(
      'access_pin_credentials_user_fk',
      ['tenant_id', 'user_id'],
      'users',
      ['tenant_id', 'user_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'access_pin_credentials_status_ck',
      sql`(status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null)`,
    )
    .addCheckConstraint(
      'access_pin_credentials_kdf_ck',
      sql`algorithm = 'argon2id' and profile_version = 1 and pepper_version >= 1 and memory_kib = 65536 and passes = 3 and parallelism = 4`,
    )
    .addCheckConstraint(
      'access_pin_credentials_secret_ck',
      sql`octet_length(salt) = 16 and octet_length(verifier) = 32`,
    )
    .addCheckConstraint(
      'access_pin_credentials_version_ck',
      sql`credential_version >= 0`,
    )
    .addCheckConstraint(
      'access_pin_credentials_failures_ck',
      sql`consecutive_failures between 0 and 5 and (locked_until is null or consecutive_failures = 5)`,
    )
    .addCheckConstraint(
      'access_pin_credentials_time_ck',
      sql`updated_at >= created_at and (revoked_at is null or revoked_at >= created_at)`,
    )
    .execute();

  await database.schema
    .createTable('access_pin_credential_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('credential_id', 'uuid', (column) => column.notNull())
    .addColumn('command_type', 'varchar(16)', (column) => column.notNull())
    .addColumn('request_fingerprint', 'bytea', (column) => column.notNull())
    .addColumn('result_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('result_credential_version', 'integer', (column) =>
      column.notNull(),
    )
    .addColumn('result_created_at', 'timestamptz', (column) =>
      column.notNull(),
    )
    .addColumn('result_updated_at', 'timestamptz', (column) =>
      column.notNull(),
    )
    .addColumn('applied_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_pin_credential_commands_pk', [
      'tenant_id',
      'client_request_id',
    ])
    .addForeignKeyConstraint(
      'access_pin_credential_commands_credential_fk',
      ['tenant_id', 'user_id', 'credential_id'],
      'access_pin_credentials',
      ['tenant_id', 'user_id', 'credential_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'access_pin_credential_commands_semantics_ck',
      sql`command_type = 'provision' and result_status = 'active' and result_credential_version = 0`,
    )
    .addCheckConstraint(
      'access_pin_credential_commands_fingerprint_ck',
      sql`octet_length(request_fingerprint) = 32`,
    )
    .addCheckConstraint(
      'access_pin_credential_commands_time_ck',
      sql`result_updated_at >= result_created_at and applied_at >= result_created_at`,
    )
    .execute();

  await database.schema
    .createTable('access_pin_attempt_station_guards')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_pin_attempt_station_guards_pk', [
      'tenant_id',
      'station_id',
    ])
    .addForeignKeyConstraint(
      'access_pin_attempt_station_guards_station_fk',
      ['tenant_id', 'station_id'],
      'stations',
      ['tenant_id', 'station_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'access_pin_attempt_station_guards_time_ck',
      sql`updated_at >= created_at`,
    )
    .execute();

  await database.schema
    .createTable('access_pin_attempt_limits')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('rate_principal_id', 'uuid', (column) => column.notNull())
    .addColumn('attempt_count', 'integer', (column) =>
      column.notNull().defaultTo(0),
    )
    .addColumn('window_started_at', 'timestamptz', (column) =>
      column.notNull(),
    )
    .addColumn('blocked_until', 'timestamptz')
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_pin_attempt_limits_pk', [
      'tenant_id',
      'station_id',
      'rate_principal_id',
    ])
    .addForeignKeyConstraint(
      'access_pin_attempt_limits_station_fk',
      ['tenant_id', 'station_id'],
      'stations',
      ['tenant_id', 'station_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'access_pin_attempt_limits_count_ck',
      sql`attempt_count between 0 and 5`,
    )
    .addCheckConstraint(
      'access_pin_attempt_limits_time_ck',
      sql`updated_at >= window_started_at and (blocked_until is null or blocked_until >= window_started_at)`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('access_pin_attempt_limits').execute();
  await database.schema.dropTable('access_pin_attempt_station_guards').execute();
  await database.schema.dropTable('access_pin_credential_commands').execute();
  await database.schema.dropTable('access_pin_credentials').execute();
}
