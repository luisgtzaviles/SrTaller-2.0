import type { TrustedStationContext } from '../../../stations/index.js';

import type { CapabilityCode } from '../../domain/capability.js';
import type { OperationalSessionContext } from '../../domain/operational-session.js';

/**
 * Access-owned commit-time guard for a protected business effect.
 *
 * The opaque transaction context is created by the consuming owner. Access,
 * Stations, and Users use it only through their owner-scoped persistence
 * capabilities so authority is revalidated and locked in the same database
 * transaction that confirms the effect.
 */
export interface OperationalAuthorizationCommitGuardPort {
  confirmCurrent(
    station: TrustedStationContext,
    session: OperationalSessionContext,
    capability: CapabilityCode,
    transactionContext: object,
  ): Promise<boolean>;
  confirmTemporalCurrent(
    station: TrustedStationContext,
    session: OperationalSessionContext,
    transactionContext: object,
  ): Promise<boolean>;
}
