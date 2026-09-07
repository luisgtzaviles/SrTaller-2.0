import type {
  AuthorizedOperationalContext,
  ContextualAuthorizationExecutor,
  ProtectedRequestEvidence,
} from '../../access/index.js';

import type { RepairEvidenceStoragePort } from './ports/repair-evidence-storage.port.js';
import type {
  RepairPersistenceScope,
  RepairRepositoryPort,
} from './ports/repair-repository.port.js';
import {
  AddRepairOperationalNoteUseCase,
} from './use-cases/add-repair-operational-note.use-case.js';
import type {
  AddRepairOperationalNoteInput,
} from './use-cases/add-repair-operational-note.use-case.js';
import {
  GetRepairDetailUseCase,
} from './use-cases/get-repair-detail.use-case.js';
import type {
  GetRepairDetailInput,
} from './use-cases/get-repair-detail.use-case.js';
import {
  GetRepairEvidenceContentUseCase,
} from './use-cases/get-repair-evidence-content.use-case.js';
import { ListRepairTechniciansUseCase } from './use-cases/list-repair-technicians.use-case.js';
import {
  ListRepairsUseCase,
} from './use-cases/list-repairs.use-case.js';
import type {
  ListRepairsInput,
} from './use-cases/list-repairs.use-case.js';

const repairsReadRequirement = Object.freeze({
  capability: 'repairs.read' as const,
  kind: 'read' as const,
});

const repairsAddNoteRequirement = Object.freeze({
  capability: 'repairs.add_note' as const,
  kind: 'state-change' as const,
});

function repairScope(context: AuthorizedOperationalContext): RepairPersistenceScope {
  return Object.freeze({
    tenantId: context.tenantId,
    branchId: context.branchId,
  });
}

/**
 * Existing D5/D6 commands are deliberately unreachable until their concrete
 * capabilities are catalogued. A caller cannot turn a route, payload, or role
 * name into authority.
 */
export class RepairOperationAccessDeniedError extends Error {
  constructor() {
    super('The repair operation has no approved capability.');
    this.name = 'RepairOperationAccessDeniedError';
  }
}

/**
 * Repairs-owned mapping from concrete operations to Access-owned
 * authorization. Controllers select an operation method, never a capability
 * supplied by the request.
 */
export class RepairProtectedOperations {
  constructor(
    private readonly authorization: ContextualAuthorizationExecutor,
    private readonly repository: RepairRepositoryPort,
    private readonly evidenceStorage: RepairEvidenceStoragePort,
  ) {}

  listRepairs(evidence: ProtectedRequestEvidence, input: ListRepairsInput) {
    return this.authorization.execute(
      evidence,
      repairsReadRequirement,
      (context) => new ListRepairsUseCase(
        this.repository,
        () => repairScope(context),
      ).execute(input),
    );
  }

  getRepairDetail(evidence: ProtectedRequestEvidence, input: GetRepairDetailInput) {
    return this.authorization.execute(
      evidence,
      repairsReadRequirement,
      (context) => new GetRepairDetailUseCase(
        this.repository,
        () => repairScope(context),
      ).execute(input),
    );
  }

  getRepairEvidenceContent(
    evidence: ProtectedRequestEvidence,
    input: Readonly<{ repairId: unknown; evidenceId: unknown }>,
  ) {
    return this.authorization.execute(
      evidence,
      repairsReadRequirement,
      (context) => new GetRepairEvidenceContentUseCase(
        this.repository,
        this.evidenceStorage,
        () => repairScope(context),
      ).execute(input),
    );
  }

  listRepairTechnicians(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(
      evidence,
      repairsReadRequirement,
      (context) => new ListRepairTechniciansUseCase(
        this.repository,
        () => repairScope(context),
      ).execute(),
    );
  }

  addRepairOperationalNote(
    evidence: ProtectedRequestEvidence,
    input: AddRepairOperationalNoteInput,
  ) {
    return this.authorization.execute(
      evidence,
      repairsAddNoteRequirement,
      (context) => new AddRepairOperationalNoteUseCase(
        this.repository,
        () => repairScope(context),
      ).execute(input),
    );
  }

  rejectUncataloguedWrite(): never {
    throw new RepairOperationAccessDeniedError();
  }
}
