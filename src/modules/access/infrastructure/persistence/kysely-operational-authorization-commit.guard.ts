import {
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { TrustedStationAdmissionValidator } from '../../../stations/index.js';
import type { AuthenticationUserAdmissionValidator } from '../../../users/index.js';
import type {
  OperationalAuthorizationCommitGuardPort,
} from '../../application/ports/operational-authorization-commit-guard.port.js';
import type { CapabilityCode } from '../../domain/capability.js';
import type { OperationalSessionContext } from '../../domain/operational-session.js';
import { OPERATIONAL_SESSION_IDLE_MS } from '../../domain/operational-session.js';
import type { TrustedStationContext } from '../../../stations/index.js';

export class KyselyOperationalAuthorizationCommitGuard
implements OperationalAuthorizationCommitGuardPort {
  constructor(
    private readonly stations: TrustedStationAdmissionValidator,
    private readonly users: AuthenticationUserAdmissionValidator,
  ) {}

  async confirmCurrent(
    station: TrustedStationContext,
    session: OperationalSessionContext,
    capability: CapabilityCode,
    transactionContext: object,
  ): Promise<boolean> {
    return useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'access',
      async (database) => {
        const candidate = await database
          .selectFrom('access_operational_sessions')
          .selectAll()
          .where('tenant_id', '=', station.tenantId)
          .where('branch_id', '=', station.branchId)
          .where('station_id', '=', station.stationId)
          .where('station_credential_id', '=', station.stationCredentialId)
          .where('session_id', '=', session.sessionId)
          .where('user_id', '=', session.userId)
          .where('status', '=', 'active')
          .where('user_version', '=', session.userVersion)
          .where('user_admission_revision', '=', session.userAdmissionRevision)
          .where('credential_version', '=', session.credentialVersion)
          .executeTakeFirst();
        if (!candidate) return false;

        const trustedStation = await this.stations.validateTrustedStationAdmission(
          station,
          {
            branchRevision: candidate.branch_admission_revision,
            stationRevision: candidate.station_admission_revision,
            bindingRevision: candidate.station_binding_admission_revision,
            credentialRevision: candidate.station_credential_admission_revision,
          },
          transactionContext,
        );
        if (!trustedStation) return false;

        const trustedUser = await this.users.validateAuthenticationUserAdmission(
          { tenantId: station.tenantId },
          candidate.user_id,
          candidate.user_version,
          candidate.user_admission_revision,
          transactionContext,
        );
        if (
          !trustedUser ||
          trustedUser.user.displayName !== session.displayName
        ) return false;

        const pin = await database
          .selectFrom('access_pin_credentials')
          .select('user_id')
          .where('tenant_id', '=', candidate.tenant_id)
          .where('user_id', '=', candidate.user_id)
          .where('status', '=', 'active')
          .where('revoked_at', 'is', null)
          .where('credential_version', '=', candidate.credential_version)
          .forShare()
          .executeTakeFirst();
        if (!pin) return false;

        const grant = await database
          .selectFrom('access_role_assignments')
          .innerJoin('access_roles', (join) => join
            .onRef('access_roles.tenant_id', '=', 'access_role_assignments.tenant_id')
            .onRef('access_roles.role_id', '=', 'access_role_assignments.role_id'))
          .innerJoin('access_role_capabilities', (join) => join
            .onRef('access_role_capabilities.tenant_id', '=', 'access_roles.tenant_id')
            .onRef('access_role_capabilities.role_id', '=', 'access_roles.role_id'))
          .select('access_role_assignments.assignment_id')
          .where('access_role_assignments.tenant_id', '=', candidate.tenant_id)
          .where('access_role_assignments.user_id', '=', candidate.user_id)
          .where('access_role_assignments.status', '=', 'active')
          .where('access_role_assignments.revoked_at', 'is', null)
          .where('access_roles.status', '=', 'active')
          .where('access_role_capabilities.capability_code', '=', capability)
          .where((expression) => expression.or([
            expression('access_role_assignments.assignment_scope', '=', 'TENANT_WIDE'),
            expression.and([
              expression('access_role_assignments.assignment_scope', '=', 'BRANCH_RESTRICTED'),
              expression('access_role_assignments.branch_id', '=', candidate.branch_id),
            ]),
          ]))
          .forShare([
            'access_role_assignments',
            'access_roles',
            'access_role_capabilities',
          ])
          .executeTakeFirst();
        if (!grant) return false;

        const lockedSession = await database
          .selectFrom('access_operational_sessions')
          .select([
            'session_id',
            'expires_at',
            'last_activity_at',
          ])
          .select(({ fn }) => fn<Date>('clock_timestamp', []).as('database_now'))
          .where('tenant_id', '=', candidate.tenant_id)
          .where('session_id', '=', candidate.session_id)
          .where('status', '=', 'active')
          .forShare()
          .executeTakeFirst();
        return lockedSession !== undefined &&
          lockedSession.expires_at.getTime() > lockedSession.database_now.getTime() &&
          lockedSession.last_activity_at.getTime() >
            lockedSession.database_now.getTime() - OPERATIONAL_SESSION_IDLE_MS;
      },
    );
  }
}
