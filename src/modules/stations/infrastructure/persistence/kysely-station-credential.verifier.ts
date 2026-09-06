import { createHash, timingSafeEqual } from 'node:crypto';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { parseTenantId } from '../../../tenancy/index.js';
import { parseBranchId } from '../../application/ports/branch-repository.port.js';
import type { StationCredentialVerifier, VerifiedStationCredential } from '../../application/ports/station-credential.port.js';
import { parseStationId } from '../../domain/station.js';

export const stationCredentialCookieName = 'sr_station';

export function hashStationCredential(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function validCredential(value: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/u.test(value);
}

export function readStationCredentialCookie(header: string | undefined): string | null {
  if (typeof header !== 'string' || header.length > 8_192) return null;
  const found = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${stationCredentialCookieName}=`));
  if (!found) return null;
  const value = found.slice(stationCredentialCookieName.length + 1);
  return validCredential(value) ? value : null;
}

export class KyselyStationCredentialVerifier implements StationCredentialVerifier {
  constructor(private readonly connection: DatabaseConnection) {}

  async verify(rawCredential: string): Promise<VerifiedStationCredential | null> {
    if (!validCredential(rawCredential)) return null;
    const hash = hashStationCredential(rawCredential);
    return useDatabasePersistenceExecutor(this.connection, 'stations', async (database) => {
      const row = await database.selectFrom('station_credentials')
        .innerJoin('stations', (join) => join
          .onRef('stations.tenant_id', '=', 'station_credentials.tenant_id')
          .onRef('stations.station_id', '=', 'station_credentials.station_id'))
        .innerJoin('station_bindings', (join) => join
          .onRef('station_bindings.tenant_id', '=', 'stations.tenant_id')
          .onRef('station_bindings.station_id', '=', 'stations.station_id'))
        .innerJoin('branches', (join) => join
          .onRef('branches.tenant_id', '=', 'station_bindings.tenant_id')
          .onRef('branches.branch_id', '=', 'station_bindings.branch_id'))
        .select(['station_credentials.credential_hash', 'stations.tenant_id', 'stations.station_id', 'station_bindings.branch_id'])
        .where('station_credentials.credential_hash', '=', hash)
        .where('station_credentials.revoked_at', 'is', null)
        .where('stations.status', '=', 'active')
        .where('stations.revoked_at', 'is', null)
        .executeTakeFirst();
      if (!row || !timingSafeEqual(Buffer.from(hash), Buffer.from(row.credential_hash))) return null;
      return Object.freeze({ tenantId: parseTenantId(row.tenant_id), stationId: parseStationId(row.station_id), branchId: parseBranchId(row.branch_id) });
    });
  }
}
