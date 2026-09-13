import { sql } from 'kysely';
import type { Kysely, SqlBool } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

const active = sql<SqlBool>`status = 'active'`;

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createIndex('access_operational_sessions_active_station_idx')
    .on('access_operational_sessions')
    .columns(['tenant_id', 'station_id'])
    .where(active)
    .execute();

  await database.schema
    .createIndex('access_operational_sessions_active_user_idx')
    .on('access_operational_sessions')
    .columns(['tenant_id', 'user_id'])
    .where(active)
    .execute();

  await database.schema
    .createIndex('access_operational_sessions_active_pin_credential_idx')
    .on('access_operational_sessions')
    .columns(['tenant_id', 'user_id', 'credential_version'])
    .where(active)
    .execute();

  await database.schema
    .dropIndex('access_operational_sessions_one_active_station_uq')
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  const duplicate = await sql<{ readonly unsafe: boolean }>`
    select true as unsafe
    from access_operational_sessions
    where status = 'active'
    group by tenant_id, station_id
    having count(*) > 1
    limit 1
  `.execute(database);
  if (duplicate.rows.length > 0) {
    throw new Error(
      'Concurrent Operational Sessions rollback requires explicit session reconciliation.',
    );
  }

  await database.schema
    .createIndex('access_operational_sessions_one_active_station_uq')
    .unique()
    .on('access_operational_sessions')
    .columns(['tenant_id', 'station_id'])
    .where(active)
    .execute();

  await database.schema
    .dropIndex('access_operational_sessions_active_pin_credential_idx')
    .execute();
  await database.schema
    .dropIndex('access_operational_sessions_active_user_idx')
    .execute();
  await database.schema
    .dropIndex('access_operational_sessions_active_station_idx')
    .execute();
}
