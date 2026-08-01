import type {
  CreatePreviewRepairInput,
  PreviewRepairDetail,
  PreviewRepairRecord,
  PreviewRepairStatus,
} from '../../domain/preview-repair.js';

export interface PreviewRepairPersistenceScope {
  readonly tenantId: string;
  readonly branchId: string;
}

export interface PreviewActorPersistenceScope {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly actorLabel: string;
}

export type PreviewRepairTransitionResult =
  | Readonly<{ kind: 'updated'; repair: PreviewRepairDetail }>
  | Readonly<{ kind: 'not-found' }>
  | Readonly<{ kind: 'revision-conflict'; actualRevision: number }>
  | Readonly<{ kind: 'transition-conflict'; actualStatus: PreviewRepairStatus }>;

export interface PreviewRepairRepositoryPort {
  create(
    context: PreviewActorPersistenceScope,
    input: CreatePreviewRepairInput,
  ): Promise<PreviewRepairDetail>;
  list(context: PreviewRepairPersistenceScope): Promise<readonly PreviewRepairRecord[]>;
  findById(
    context: PreviewRepairPersistenceScope,
    repairId: string,
  ): Promise<PreviewRepairDetail | null>;
  transitionStatus(
    context: PreviewActorPersistenceScope,
    repairId: string,
    expectedRevision: number,
    status: PreviewRepairStatus,
  ): Promise<PreviewRepairTransitionResult>;
}
