import type { TrustedStationContext } from '../../stations/index.js';
import type {
  CreatePreviewRepairInput,
  PreviewRepairDetail,
  PreviewRepairRecord,
  PreviewRepairStatus,
} from '../domain/preview-repair.js';
import {
  parseExpectedRevision,
  parsePreviewRepairId,
  parsePreviewRepairStatus,
  validateCreatePreviewRepairInput,
} from '../domain/preview-repair.js';
import type {
  PreviewActorPersistenceScope,
  PreviewRepairPersistenceScope,
  PreviewRepairRepositoryPort,
  PreviewRepairTransitionResult,
} from './ports/preview-repair-repository.port.js';

export interface PreviewActorContext {
  readonly station: TrustedStationContext;
  readonly actorLabel: string;
}

function scope(context: TrustedStationContext): PreviewRepairPersistenceScope {
  return Object.freeze({
    tenantId: context.tenantId,
    branchId: context.branchId,
  });
}

function actorScope(context: PreviewActorContext): PreviewActorPersistenceScope {
  return Object.freeze({
    tenantId: context.station.tenantId,
    branchId: context.station.branchId,
    stationId: context.station.stationId,
    actorLabel: context.actorLabel,
  });
}

export class PreviewRepairService {
  constructor(private readonly repository: PreviewRepairRepositoryPort) {}

  create(
    context: PreviewActorContext,
    input: CreatePreviewRepairInput,
  ): Promise<PreviewRepairDetail> {
    return this.repository.create(
      actorScope(context),
      validateCreatePreviewRepairInput(input),
    );
  }

  list(context: TrustedStationContext): Promise<readonly PreviewRepairRecord[]> {
    return this.repository.list(scope(context));
  }

  detail(
    context: TrustedStationContext,
    repairId: unknown,
  ): Promise<PreviewRepairDetail | null> {
    return this.repository.findById(scope(context), parsePreviewRepairId(repairId));
  }

  transitionStatus(
    context: PreviewActorContext,
    repairId: unknown,
    expectedRevision: unknown,
    status: unknown,
  ): Promise<PreviewRepairTransitionResult> {
    return this.repository.transitionStatus(
      actorScope(context),
      parsePreviewRepairId(repairId),
      parseExpectedRevision(expectedRevision),
      parsePreviewRepairStatus(status),
    );
  }
}
