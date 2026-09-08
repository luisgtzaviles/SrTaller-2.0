import { parseBranchId } from './ports/branch-repository.port.js';
import type { BranchRepositoryPort } from './ports/branch-repository.port.js';
import type {
  BranchSettingsRuntime,
  BranchSettingsScope,
} from './ports/branch-settings-runtime.port.js';
import type { BranchTimeZone } from './branch-time-zone.js';

function branchScope(scope: BranchSettingsScope) {
  return Object.freeze({
    tenantId: scope.tenantId,
    branchId: parseBranchId(scope.branchId),
  });
}

function response(timeZone: BranchTimeZone): Readonly<{ timeZone: BranchTimeZone }> {
  return Object.freeze({ timeZone });
}

/**
 * Stations owns Branch persistence. Callers provide only the already trusted
 * Station scope; no client-supplied tenant or Branch identifier is accepted.
 */
export class BranchSettingsRuntimeService implements BranchSettingsRuntime {
  constructor(private readonly branches: BranchRepositoryPort) {}

  async readTimeZone(
    scope: BranchSettingsScope,
  ): Promise<Readonly<{ timeZone: BranchTimeZone }> | null> {
    const branch = await this.branches.findBranchById(branchScope(scope));
    return branch === null ? null : response(branch.timeZone);
  }

  async updateTimeZone(
    scope: BranchSettingsScope,
    timeZone: unknown,
  ): Promise<Readonly<{ timeZone: BranchTimeZone }>> {
    // The existing Stations repository performs the authoritative IANA parse
    // before persisting. A fixed UTC offset therefore cannot become authority.
    const branch = await this.branches.updateBranchTimeZone(
      branchScope(scope),
      timeZone as BranchTimeZone,
    );
    return response(branch.timeZone);
  }
}
