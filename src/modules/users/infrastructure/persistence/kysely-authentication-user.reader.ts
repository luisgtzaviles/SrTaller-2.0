import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceConnection } from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  AuthenticationUserReaderPort,
} from '../../application/ports/authentication-user-reader.port.js';
import type {
  AuthenticationUserReader,
  AuthenticationUserAdmissionValidator,
  AuthenticationUserRecord,
} from '../../index.js';
import { parseTenantId } from '../../../tenancy/index.js';
import { parseUserId, parseUserStatus } from '../../domain/user.js';

export class KyselyAuthenticationUserReader
  implements AuthenticationUserReaderPort, AuthenticationUserAdmissionValidator
{
  constructor(private readonly connection: InternalDatabasePersistenceConnection) {}

  async findAuthenticationUser(
    scope: Readonly<{ tenantId: string }>,
    userId: string,
  ): Promise<AuthenticationUserRecord | null> {
    let tenantId;
    let parsedUserId;
    try {
      tenantId = parseTenantId(scope?.tenantId);
      parsedUserId = parseUserId(userId);
    } catch {
      return null;
    }
    return useDatabasePersistenceExecutor(
      this.connection,
      'users',
      async (database) => {
        const row = await database
          .selectFrom('users')
          .select([
            'tenant_id',
            'user_id',
            'display_name',
            'status',
            'version',
            'admission_revision',
          ])
          .where('tenant_id', '=', tenantId)
          .where('user_id', '=', parsedUserId)
          .executeTakeFirst();
        if (!row) return null;
        return Object.freeze({
          tenantId: parseTenantId(row.tenant_id),
          userId: parseUserId(row.user_id),
          displayName: row.display_name,
          status: parseUserStatus(row.status),
          version: row.version,
          admissionRevision: row.admission_revision,
        });
      },
    );
  }

  async validateAuthenticationUserAdmission(
    scope: Readonly<{ tenantId: string }>,
    userId: string,
    expectedVersion: number,
    expectedAdmissionRevision: number,
    transactionContext: object,
  ) {
    let tenantId;
    let parsedUserId;
    try {
      tenantId = parseTenantId(scope?.tenantId);
      parsedUserId = parseUserId(userId);
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
        return null;
      }
      if (
        !Number.isSafeInteger(expectedAdmissionRevision) ||
        expectedAdmissionRevision < 0
      ) {
        return null;
      }
    } catch {
      return null;
    }
    return useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'users',
      async (database) => {
        const row = await database
          .selectFrom('users')
          .select([
            'tenant_id',
            'user_id',
            'display_name',
            'status',
            'version',
            'admission_revision',
          ])
          .where('tenant_id', '=', tenantId)
          .where('user_id', '=', parsedUserId)
          .where('status', '=', 'active')
          .where('version', '=', expectedVersion)
          .where('admission_revision', '=', expectedAdmissionRevision)
          .forShare()
          .executeTakeFirst();
        if (!row) return null;
        return Object.freeze({
          user: Object.freeze({
            tenantId: parseTenantId(row.tenant_id),
            userId: parseUserId(row.user_id),
            displayName: row.display_name,
            status: parseUserStatus(row.status),
            version: row.version,
            admissionRevision: row.admission_revision,
          }),
          admissionRevision: row.admission_revision,
        });
      },
    );
  }
}

export function createKyselyAuthenticationUserReader(
  connection: InternalDatabasePersistenceConnection,
): AuthenticationUserReader {
  return new KyselyAuthenticationUserReader(connection);
}
