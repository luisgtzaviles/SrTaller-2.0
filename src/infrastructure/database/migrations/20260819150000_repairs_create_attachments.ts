import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('repair_attachments')
    .addColumn('attachment_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('kind', 'varchar(16)', (column) => column.notNull())
    .addColumn('category', 'varchar(16)', (column) => column.notNull())
    .addColumn('storage_key', 'varchar(80)', (column) => column.notNull().unique())
    .addColumn('mime_type', 'varchar(32)', (column) => column.notNull())
    .addColumn('size_bytes', 'integer', (column) => column.notNull())
    .addColumn('width', 'integer')
    .addColumn('height', 'integer')
    .addColumn('caption', 'varchar(300)')
    .addColumn('captured_at', 'timestamptz')
    .addColumn('uploaded_at', 'timestamptz', (column) => column.notNull())
    .addColumn('uploaded_by_id', 'uuid')
    .addColumn('uploaded_by_display_name', 'varchar(120)')
    .addPrimaryKeyConstraint('repair_attachments_pk', ['attachment_id'])
    .addForeignKeyConstraint(
      'repair_attachments_repair_scope_fk',
      ['tenant_id', 'branch_id', 'repair_id'],
      'repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint('repair_attachments_kind_ck', sql`kind = 'photo'`)
    .addCheckConstraint('repair_attachments_category_ck', sql`category in ('intake', 'general')`)
    .addCheckConstraint('repair_attachments_mime_ck', sql`mime_type = 'image/png'`)
    .addCheckConstraint('repair_attachments_size_ck', sql`size_bytes > 0 and size_bytes <= 5242880`)
    .addCheckConstraint(
      'repair_attachments_dimensions_ck',
      sql`(width is null and height is null) or (width > 0 and height > 0)`,
    )
    .addCheckConstraint(
      'repair_attachments_uploader_ck',
      sql`(uploaded_by_id is null) = (uploaded_by_display_name is null)`,
    )
    .addCheckConstraint(
      'repair_attachments_storage_key_ck',
      sql`storage_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.png$'`,
    )
    .execute();

  await database.schema
    .createIndex('repair_attachments_scope_uploaded_idx')
    .on('repair_attachments')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'uploaded_at', 'attachment_id'])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_attachments_scope_uploaded_idx').execute();
  await database.schema.dropTable('repair_attachments').execute();
}
