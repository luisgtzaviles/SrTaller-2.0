import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  AuthenticationUserReaderPort,
} from '../../application/ports/authentication-user-reader.port.js';
import type {
  AuthenticationUserReader,
  AuthenticationUserRecord,
} from '../../index.js';
import { parseTenantId } from '../../../tenancy/index.js';
import { parseUserId, parseUserStatus } from '../../domain/user.js';

export class KyselyAuthenticationUserReader
  implements AuthenticationUserReaderPort
{
  constructor(private readonly connection: DatabaseConnection) {}

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
        });
      },
    );
  }
}

export function createKyselyAuthenticationUserReader(
  connection: DatabaseConnection,
): AuthenticationUserReader {
  return new KyselyAuthenticationUserReader(connection);
}
