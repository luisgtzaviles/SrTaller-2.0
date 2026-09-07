import { createHash, timingSafeEqual } from 'node:crypto';

import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceConnection } from '../../../../infrastructure/database/database-persistence-capability.js';
import { parseTenantId } from '../../../tenancy/index.js';
import { parseBranchId } from '../../application/ports/branch-repository.port.js';
import type {
  TrustedStationAdmissionValidator,
  TrustedStationAdmissionSnapshot,
  TrustedStationContext,
} from '../../index.js';
import { isTrustedStationContext } from '../../index.js';
import type { StationCredentialVerifier, VerifiedStationCredential } from '../../application/ports/station-credential.port.js';
import { parseStationId } from '../../domain/station.js';
import { readStationCredentialCookie } from '../http/station-credential-cookie.js';

export function hashStationCredential(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function validCredential(value: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/u.test(value);
}

export class KyselyStationCredentialVerifier
  implements StationCredentialVerifier, TrustedStationAdmissionValidator {
  constructor(private readonly connection: InternalDatabasePersistenceConnection) {}

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
        .select([
          'station_credentials.credential_id',
          'station_credentials.credential_hash',
          'station_credentials.admission_revision as credential_revision',
          'stations.tenant_id',
          'stations.station_id',
          'stations.admission_revision as station_revision',
          'station_bindings.branch_id',
          'station_bindings.admission_revision as binding_revision',
          'branches.admission_revision as branch_revision',
        ])
        .where('station_credentials.credential_hash', '=', hash)
        .where('station_credentials.revoked_at', 'is', null)
        .where('stations.status', '=', 'active')
        .where('stations.revoked_at', 'is', null)
        .where('station_bindings.revoked_at', 'is', null)
        .where('branches.active', '=', true)
        .executeTakeFirst();
      if (!row || !timingSafeEqual(Buffer.from(hash), Buffer.from(row.credential_hash))) return null;
      return Object.freeze({
        stationCredentialId: row.credential_id,
        tenantId: parseTenantId(row.tenant_id),
        stationId: parseStationId(row.station_id),
        branchId: parseBranchId(row.branch_id),
        branchAdmissionRevision: row.branch_revision,
        stationAdmissionRevision: row.station_revision,
        stationBindingAdmissionRevision: row.binding_revision,
        stationCredentialAdmissionRevision: row.credential_revision,
      });
    });
  }

  async validateTrustedStationAdmission(
    context: TrustedStationContext,
    expected: TrustedStationAdmissionSnapshot,
    transactionContext: object,
  ): Promise<TrustedStationAdmissionSnapshot | null> {
    if (!isTrustedStationContext(context)) return null;
    if (
      !Number.isSafeInteger(expected?.branchRevision) ||
      expected.branchRevision < 0 ||
      !Number.isSafeInteger(expected.stationRevision) ||
      expected.stationRevision < 0 ||
      !Number.isSafeInteger(expected.bindingRevision) ||
      expected.bindingRevision < 0 ||
      !Number.isSafeInteger(expected.credentialRevision) ||
      expected.credentialRevision < 0
    ) return null;
    return useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'stations',
      async (database) => {
        const row = await database
          .selectFrom('station_credentials')
          .innerJoin('stations', (join) => join
            .onRef('stations.tenant_id', '=', 'station_credentials.tenant_id')
            .onRef('stations.station_id', '=', 'station_credentials.station_id'))
          .innerJoin('station_bindings', (join) => join
            .onRef('station_bindings.tenant_id', '=', 'stations.tenant_id')
            .onRef('station_bindings.station_id', '=', 'stations.station_id'))
          .innerJoin('branches', (join) => join
            .onRef('branches.tenant_id', '=', 'station_bindings.tenant_id')
            .onRef('branches.branch_id', '=', 'station_bindings.branch_id'))
          .select([
            'branches.admission_revision as branch_revision',
            'stations.admission_revision as station_revision',
            'station_bindings.admission_revision as binding_revision',
            'station_credentials.admission_revision as credential_revision',
          ])
          .where('station_credentials.tenant_id', '=', context.tenantId)
          .where('station_credentials.station_id', '=', context.stationId)
          .where('station_credentials.credential_id', '=', context.stationCredentialId)
          .where('station_credentials.revoked_at', 'is', null)
          .where('stations.status', '=', 'active')
          .where('stations.revoked_at', 'is', null)
          .where('station_bindings.branch_id', '=', context.branchId)
          .where('station_bindings.revoked_at', 'is', null)
          .where('branches.active', '=', true)
          .where('branches.admission_revision', '=', expected.branchRevision)
          .where('stations.admission_revision', '=', expected.stationRevision)
          .where('station_bindings.admission_revision', '=', expected.bindingRevision)
          .where('station_credentials.admission_revision', '=', expected.credentialRevision)
          .forShare([
            'station_credentials',
            'stations',
            'station_bindings',
            'branches',
          ])
          .executeTakeFirst();
        return row
          ? Object.freeze({
              branchRevision: row.branch_revision,
              stationRevision: row.station_revision,
              bindingRevision: row.binding_revision,
              credentialRevision: row.credential_revision,
            })
          : null;
      },
    );
  }
}
