import type {
  AuthorizedOperationalContext,
  ContextualAuthorizationExecutor,
  ProtectedRequestEvidence,
} from '../../access/index.js';
import type { BranchSettingsRuntime } from '../../stations/index.js';
import type { CustomerIntakeRuntime } from '../../customers/index.js';

import type { RepairEvidenceStoragePort } from './ports/repair-evidence-storage.port.js';
import type {
  RepairBrandCatalogContext,
  RepairDeviceTypeCatalogContext,
  RepairModelCatalogContext,
  RepairEquipmentCorrectionContext,
  RepairOperationalNoteContext,
  RepairPersistenceScope,
  RepairRepositoryPort,
  RepairRiskCatalogContext,
  RepairProblemCategoryCatalogContext,
  RepairClassificationContext,
} from './ports/repair-repository.port.js';
import {
  AddRepairOperationalNoteUseCase,
} from './use-cases/add-repair-operational-note.use-case.js';
import { CreateRepairUseCase } from './use-cases/create-repair.use-case.js';
import { CorrectRepairEquipmentUseCase } from './use-cases/correct-repair-equipment.use-case.js';
import { NewRepairPolicyService } from './new-repair-policy.service.js';
import { RepairBrandCatalogService } from './repair-brand-catalog.service.js';
import { RepairDeviceTypeCatalogService } from './repair-device-type-catalog.service.js';
import { RepairModelCatalogService } from './repair-model-catalog.service.js';
import { RepairRiskCatalogService } from './repair-risk-catalog.service.js';
import { RepairProblemCategoryCatalogService } from './repair-problem-category-catalog.service.js';
import { ChangeRepairProblemClassificationService } from './change-repair-problem-classification.service.js';
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
  ListRepairsQueryError,
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
const repairsCreateRequirement = Object.freeze({
  capability: 'repairs.create' as const,
  kind: 'state-change' as const,
});
const repairsCorrectIntakeRequirement = Object.freeze({
  capability: 'repairs.correct_intake' as const,
  kind: 'state-change' as const,
});
const repairsClassifyReadRequirement = Object.freeze({ capability: 'repairs.classify' as const, kind: 'read' as const });
const repairsClassifyRequirement = Object.freeze({ capability: 'repairs.classify' as const, kind: 'state-change' as const });
const repairsCreateLookupRequirement = Object.freeze({
  capability: 'repairs.create' as const,
  kind: 'read' as const,
});
const repairsConfigurationReadRequirement = Object.freeze({
  capability: 'repairs.configuration.read' as const,
  kind: 'read' as const,
});
const repairsConfigurationManageRequirement = Object.freeze({
  capability: 'repairs.configuration.manage' as const,
  kind: 'state-change' as const,
});
const repairsCatalogsReadRequirement = Object.freeze({
  capability: 'repairs.catalogs.read' as const,
  kind: 'read' as const,
});
const repairsCatalogsManageRequirement = Object.freeze({
  capability: 'repairs.catalogs.manage' as const,
  kind: 'state-change' as const,
});

function repairScope(context: AuthorizedOperationalContext): RepairPersistenceScope {
  return Object.freeze({
    tenantId: context.tenantId,
    branchId: context.branchId,
  });
}

function repairOperationalNoteContext(
  context: AuthorizedOperationalContext,
): RepairOperationalNoteContext {
  if (context.capability !== repairsAddNoteRequirement.capability) {
    throw new RepairOperationAccessDeniedError();
  }
  return Object.freeze({
    tenantId: context.tenantId,
    branchId: context.branchId,
    stationId: context.stationId,
    sessionId: context.sessionId,
    actorUserId: context.userId,
    actorDisplayName: context.userDisplayName,
    capability: context.capability,
    commitGuard: context.commitGuard,
  });
}

function repairCreateContext(context: AuthorizedOperationalContext) {
  if (context.capability !== repairsCreateRequirement.capability) throw new RepairOperationAccessDeniedError();
  return Object.freeze({
    tenantId: context.tenantId, branchId: context.branchId, stationId: context.stationId,
    sessionId: context.sessionId, actorUserId: context.userId, actorDisplayName: context.userDisplayName,
    capability: context.capability, commitGuard: context.commitGuard,
  });
}

function repairEquipmentCorrectionContext(context: AuthorizedOperationalContext): RepairEquipmentCorrectionContext {
  if (context.capability !== repairsCorrectIntakeRequirement.capability) throw new RepairOperationAccessDeniedError();
  return Object.freeze({
    tenantId: context.tenantId, branchId: context.branchId, stationId: context.stationId,
    sessionId: context.sessionId, actorUserId: context.userId, actorDisplayName: context.userDisplayName,
    capability: context.capability, commitGuard: context.commitGuard,
  });
}

function repairConfigurationContext(context: AuthorizedOperationalContext) {
  if (context.capability !== repairsConfigurationManageRequirement.capability) throw new RepairOperationAccessDeniedError();
  return Object.freeze({
    tenantId: context.tenantId, branchId: context.branchId, stationId: context.stationId,
    sessionId: context.sessionId, actorUserId: context.userId, actorDisplayName: context.userDisplayName,
    capability: context.capability, commitGuard: context.commitGuard,
  });
}

function repairRiskCatalogContext(context: AuthorizedOperationalContext): RepairRiskCatalogContext {
  if (context.capability !== repairsCatalogsManageRequirement.capability) throw new RepairOperationAccessDeniedError();
  return Object.freeze({
    tenantId: context.tenantId,
    branchId: context.branchId,
    stationId: context.stationId,
    sessionId: context.sessionId,
    actorUserId: context.userId,
    actorDisplayName: context.userDisplayName,
    capability: context.capability,
    commitGuard: context.commitGuard,
  });
}

function repairBrandCatalogContext(context: AuthorizedOperationalContext): RepairBrandCatalogContext {
  if (context.capability !== repairsCatalogsManageRequirement.capability) throw new RepairOperationAccessDeniedError();
  return Object.freeze({
    tenantId: context.tenantId,
    branchId: context.branchId,
    stationId: context.stationId,
    sessionId: context.sessionId,
    actorUserId: context.userId,
    actorDisplayName: context.userDisplayName,
    capability: context.capability,
    commitGuard: context.commitGuard,
  });
}

function repairDeviceTypeCatalogContext(context: AuthorizedOperationalContext): RepairDeviceTypeCatalogContext {
  return repairBrandCatalogContext(context);
}

function repairModelCatalogContext(context: AuthorizedOperationalContext): RepairModelCatalogContext {
  return repairBrandCatalogContext(context);
}

function repairProblemCategoryCatalogContext(context: AuthorizedOperationalContext): RepairProblemCategoryCatalogContext {
  return repairBrandCatalogContext(context);
}

function repairClassificationContext(context: AuthorizedOperationalContext): RepairClassificationContext {
  if (context.capability !== repairsClassifyRequirement.capability) throw new RepairOperationAccessDeniedError();
  return Object.freeze({ tenantId: context.tenantId, branchId: context.branchId, stationId: context.stationId, sessionId: context.sessionId, actorUserId: context.userId, actorDisplayName: context.userDisplayName, capability: context.capability, commitGuard: context.commitGuard });
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
    private readonly branchSettings: BranchSettingsRuntime,
    private readonly customers: CustomerIntakeRuntime,
  ) {}

  listRepairs(evidence: ProtectedRequestEvidence, input: ListRepairsInput) {
    return this.authorization.execute(
      evidence,
      repairsReadRequirement,
      async (context) => {
        const scope = repairScope(context);
        const branch = await this.branchSettings.readTimeZone({
          tenantId: context.tenantId,
          branchId: context.branchId,
        });
        if (!branch) throw new RepairOperationAccessDeniedError();
        return new ListRepairsUseCase(
          this.repository,
          () => scope,
          branch.timeZone,
        ).execute(input);
      },
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
        () => repairOperationalNoteContext(context),
      ).execute(input),
    );
  }

  createRepair(evidence: ProtectedRequestEvidence, input: Readonly<{ request: unknown }>) {
    return this.authorization.execute(evidence, repairsCreateRequirement, async (context) => {
      const branch = await this.branchSettings.readTimeZone({
        tenantId: context.tenantId,
        branchId: context.branchId,
      });
      if (!branch) throw new RepairOperationAccessDeniedError();
      const policy = await new NewRepairPolicyService(this.repository).effective(repairScope(context));
      return new CreateRepairUseCase(
        this.repository,
        this.customers,
        () => repairCreateContext(context),
        branch.timeZone,
        undefined,
        undefined,
        policy,
      ).execute(input);
    });
  }

  correctRepairEquipment(
    evidence: ProtectedRequestEvidence,
    input: Readonly<{ repairId: unknown; request: unknown }>,
  ) {
    return this.authorization.execute(evidence, repairsCorrectIntakeRequirement, (context) =>
      new CorrectRepairEquipmentUseCase(
        this.repository,
        () => repairEquipmentCorrectionContext(context),
      ).execute(input));
  }

  listOperationalProblemCategories(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsClassifyReadRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).listEffective(repairScope(context)));
  }

  listIntakeProblemCategories(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCreateLookupRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).listEffective(repairScope(context)));
  }

  addRepairProblemClassification(evidence: ProtectedRequestEvidence, repairId: unknown, categoryId: unknown) {
    return this.authorization.execute(evidence, repairsClassifyRequirement, (context) => new ChangeRepairProblemClassificationService(this.repository).add(repairClassificationContext(context), repairId, categoryId));
  }

  removeRepairProblemClassification(evidence: ProtectedRequestEvidence, repairId: unknown, categoryId: unknown) {
    return this.authorization.execute(evidence, repairsClassifyRequirement, (context) => new ChangeRepairProblemClassificationService(this.repository).remove(repairClassificationContext(context), repairId, categoryId));
  }

  listAdminProblemCategories(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).listAdmin(repairScope(context)));
  }
  listPendingProblems(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).listPending(repairScope(context)));
  }
  createProblemCategory(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).create(repairProblemCategoryCatalogContext(context), input)); }
  renameProblemCategory(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).rename(repairProblemCategoryCatalogContext(context), input)); }
  deactivateProblemCategory(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).deactivate(repairProblemCategoryCatalogContext(context), input)); }
  reactivateProblemCategory(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).reactivate(repairProblemCategoryCatalogContext(context), input)); }
  deleteProblemCategory(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).delete(repairProblemCategoryCatalogContext(context), input)); }
  resolvePendingProblem(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairProblemCategoryCatalogService(this.repository).resolve(repairProblemCategoryCatalogContext(context), input)); }

  readOperationalNewRepairPolicy(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCreateLookupRequirement, (context) =>
      new NewRepairPolicyService(this.repository).effective(repairScope(context)));
  }

  listOperationalRepairRisks(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCreateLookupRequirement, (context) =>
      new RepairRiskCatalogService(this.repository).listEffective(repairScope(context)));
  }

  listOperationalRepairBrands(evidence: ProtectedRequestEvidence, query?: unknown) {
    return this.authorization.execute(evidence, repairsCreateLookupRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).listEffective(repairScope(context), query));
  }

  listOperationalRepairDeviceTypes(evidence: ProtectedRequestEvidence, query?: unknown) { return this.authorization.execute(evidence, repairsCreateLookupRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).listEffective(repairScope(context), query)); }
  listAdminRepairDeviceTypes(evidence: ProtectedRequestEvidence) { return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).listAdmin(repairScope(context))); }
  listPendingRepairDeviceTypes(evidence: ProtectedRequestEvidence) { return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).listPending(repairScope(context))); }
  createRepairDeviceType(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).create(repairDeviceTypeCatalogContext(context), input)); }
  renameRepairDeviceType(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).rename(repairDeviceTypeCatalogContext(context), input)); }
  deactivateRepairDeviceType(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).deactivate(repairDeviceTypeCatalogContext(context), input)); }
  reactivateRepairDeviceType(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).reactivate(repairDeviceTypeCatalogContext(context), input)); }
  resolvePendingRepairDeviceType(evidence: ProtectedRequestEvidence, input: unknown) { return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) => new RepairDeviceTypeCatalogService(this.repository).resolve(repairDeviceTypeCatalogContext(context), input)); }

  listAdminRepairBrands(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).listAdmin(repairScope(context)));
  }

  listPendingRepairBrands(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).listPending(repairScope(context)));
  }

  createRepairBrand(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).create(repairBrandCatalogContext(context), input));
  }

  renameRepairBrand(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).rename(repairBrandCatalogContext(context), input));
  }

  deactivateRepairBrand(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).deactivate(repairBrandCatalogContext(context), input));
  }

  reactivateRepairBrand(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).reactivate(repairBrandCatalogContext(context), input));
  }

  resolvePendingRepairBrand(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairBrandCatalogService(this.repository).resolve(repairBrandCatalogContext(context), input));
  }

  listOperationalRepairModels(evidence: ProtectedRequestEvidence, brandId: unknown, query?: unknown) {
    return this.authorization.execute(evidence, repairsCreateLookupRequirement, (context) =>
      new RepairModelCatalogService(this.repository).listEffective(repairScope(context), brandId, query));
  }

  listAdminRepairModels(evidence: ProtectedRequestEvidence, brandId?: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) =>
      new RepairModelCatalogService(this.repository).listAdmin(repairScope(context), brandId));
  }

  listPendingRepairModels(evidence: ProtectedRequestEvidence, brandId?: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) =>
      new RepairModelCatalogService(this.repository).listPending(repairScope(context), brandId));
  }

  createRepairModel(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairModelCatalogService(this.repository).create(repairModelCatalogContext(context), input));
  }

  renameRepairModel(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairModelCatalogService(this.repository).rename(repairModelCatalogContext(context), input));
  }

  deactivateRepairModel(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairModelCatalogService(this.repository).deactivate(repairModelCatalogContext(context), input));
  }

  reactivateRepairModel(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairModelCatalogService(this.repository).reactivate(repairModelCatalogContext(context), input));
  }

  resolvePendingRepairModel(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairModelCatalogService(this.repository).resolve(repairModelCatalogContext(context), input));
  }

  listAdminRepairRisks(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsCatalogsReadRequirement, (context) =>
      new RepairRiskCatalogService(this.repository).listAdmin(repairScope(context)));
  }

  createRepairRisk(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairRiskCatalogService(this.repository).create(repairRiskCatalogContext(context), input));
  }

  renameRepairRisk(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairRiskCatalogService(this.repository).rename(repairRiskCatalogContext(context), input));
  }

  deactivateRepairRisk(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairRiskCatalogService(this.repository).deactivate(repairRiskCatalogContext(context), input));
  }

  reactivateRepairRisk(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsCatalogsManageRequirement, (context) =>
      new RepairRiskCatalogService(this.repository).reactivate(repairRiskCatalogContext(context), input));
  }

  readAdminNewRepairPolicy(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, repairsConfigurationReadRequirement, (context) =>
      new NewRepairPolicyService(this.repository).effective(repairScope(context)));
  }

  updateNewRepairPolicy(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsConfigurationManageRequirement, (context) =>
      new NewRepairPolicyService(this.repository).update(repairConfigurationContext(context), input));
  }

  resetNewRepairPolicy(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, repairsConfigurationManageRequirement, (context) =>
      new NewRepairPolicyService(this.repository).reset(repairConfigurationContext(context), input));
  }

  searchCustomers(evidence: ProtectedRequestEvidence, query: unknown) {
    if (typeof query !== 'string') throw new RepairOperationAccessDeniedError();
    return this.authorization.execute(
      evidence,
      repairsCreateLookupRequirement,
      (context) => this.customers.search({ tenantId: context.tenantId, branchId: context.branchId }, query),
    );
  }

  searchPreviousRepairs(evidence: ProtectedRequestEvidence, query: unknown) {
    return this.authorization.execute(
      evidence,
      repairsCreateLookupRequirement,
      async (context) => {
        const normalized = typeof query === 'string' ? query.trim().replace(/\s+/gu, ' ') : '';
        if (normalized.length < 2 || normalized.length > 120) throw new ListRepairsQueryError('q');
        const branch = await this.branchSettings.readTimeZone({
          tenantId: context.tenantId,
          branchId: context.branchId,
        });
        if (!branch) throw new RepairOperationAccessDeniedError();
        return new ListRepairsUseCase(
          this.repository,
          () => repairScope(context),
          branch.timeZone,
        ).execute({ q: normalized, period: 'all', page: '1', pageSize: '8' });
      },
    );
  }

  rejectUncataloguedWrite(): never {
    throw new RepairOperationAccessDeniedError();
  }
}
