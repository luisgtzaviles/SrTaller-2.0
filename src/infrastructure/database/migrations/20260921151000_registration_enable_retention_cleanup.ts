import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger registration_acceptance_documents_guard_update on registration_acceptance_documents`.execute(database);
  await sql`create or replace function registration_guard_acceptance_evidence_mutation() returns trigger language plpgsql as $function$ begin
    if tg_op = 'DELETE' then
      raise exception 'Registration acceptance evidence is immutable.' using errcode = '23514';
    end if;
    if old.registration_attempt_id is distinct from new.registration_attempt_id then
      if old.acceptance_evidence_id <> new.acceptance_evidence_id or old.document_key <> new.document_key or old.document_version <> new.document_version or old.accepted_at <> new.accepted_at or old.tenant_id is distinct from new.tenant_id or old.user_id is distinct from new.user_id or old.registration_attempt_id is null or new.registration_attempt_id is not null or not exists (
        select 1 from registration_attempts attempt
        where attempt.registration_attempt_id = old.registration_attempt_id
          and attempt.status in ('CONSUMED', 'EXPIRED')
          and (
            (attempt.status = 'CONSUMED' and attempt.consumed_at <= now() - interval '30 days') or
            (attempt.status = 'EXPIRED' and attempt.expires_at <= now() - interval '30 days')
          )
      ) then
        raise exception 'Registration acceptance evidence cannot be detached before governed retention expires.' using errcode = '23514';
      end if;
      return new;
    end if;
    if old.acceptance_evidence_id <> new.acceptance_evidence_id or old.document_key <> new.document_key or old.document_version <> new.document_version or old.accepted_at <> new.accepted_at or old.tenant_id is not null or old.user_id is not null or new.tenant_id is null or new.user_id is null then
      raise exception 'Registration acceptance evidence is immutable after its one-time authority association.' using errcode = '23514';
    end if;
    return new;
  end; $function$`.execute(database);
  await sql`create trigger registration_acceptance_documents_guard_update before update on registration_acceptance_documents for each row execute function registration_guard_acceptance_evidence_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger registration_acceptance_documents_guard_update on registration_acceptance_documents`.execute(database);
  await sql`create or replace function registration_guard_acceptance_evidence_mutation() returns trigger language plpgsql as $function$ begin
    if tg_op = 'DELETE' or old.acceptance_evidence_id <> new.acceptance_evidence_id or old.document_key <> new.document_key or old.document_version <> new.document_version or old.registration_attempt_id is distinct from new.registration_attempt_id or old.accepted_at <> new.accepted_at or old.tenant_id is not null or old.user_id is not null or new.tenant_id is null or new.user_id is null then
      raise exception 'Registration acceptance evidence is immutable after its one-time authority association.' using errcode = '23514';
    end if;
    return new;
  end; $function$`.execute(database);
  await sql`create trigger registration_acceptance_documents_guard_update before update on registration_acceptance_documents for each row execute function registration_guard_acceptance_evidence_mutation()`.execute(database);
}
