import { randomUUID } from 'node:crypto';

export const previewRepairStatuses = Object.freeze([
  'received',
  'diagnosing',
  'ready',
  'delivered',
  'cancelled',
] as const);

export type PreviewRepairStatus = (typeof previewRepairStatuses)[number];

export interface PreviewRepairRecord {
  readonly id: string;
  readonly folio: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly deviceBrand: string;
  readonly deviceModel: string;
  readonly deviceSerial: string | null;
  readonly deviceColor: string | null;
  readonly reportedProblem: string;
  readonly physicalCondition: string | null;
  readonly notes: string | null;
  readonly estimatedPrice: number | null;
  readonly depositAmount: number;
  readonly status: PreviewRepairStatus;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PreviewRepairStatusHistory {
  readonly id: string;
  readonly fromStatus: PreviewRepairStatus | null;
  readonly toStatus: PreviewRepairStatus;
  readonly resultingRevision: number;
  readonly stationId: string;
  readonly actorLabel: string;
  readonly changedAt: string;
}

export interface PreviewRepairDetail extends PreviewRepairRecord {
  readonly history: readonly PreviewRepairStatusHistory[];
}

export interface CreatePreviewRepairInput {
  readonly customerName: string;
  readonly customerPhone: string;
  readonly deviceBrand: string;
  readonly deviceModel: string;
  readonly deviceSerial: string | null;
  readonly deviceColor: string | null;
  readonly reportedProblem: string;
  readonly physicalCondition: string | null;
  readonly notes: string | null;
  readonly estimatedPrice: number | null;
  readonly depositAmount: number;
}

export class PreviewRepairDomainError extends Error {
  readonly category = 'Validation';

  constructor(readonly code: 'PREVIEW_REPAIR_INVALID' | 'PREVIEW_REPAIR_TRANSITION_INVALID') {
    super(code === 'PREVIEW_REPAIR_INVALID'
      ? 'Preview repair data is invalid.'
      : 'Preview repair status transition is invalid.');
    this.name = 'PreviewRepairDomainError';
  }
}

function text(value: unknown, maximum: number, optional = false): string | null {
  if (optional && (value === null || value === '')) {
    return null;
  }
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    value.length < 1 ||
    value.length > maximum
  ) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_INVALID');
  }
  return value;
}

export function validateCreatePreviewRepairInput(
  input: CreatePreviewRepairInput,
): CreatePreviewRepairInput {
  const depositAmount = Number(input?.depositAmount);
  const estimatedPrice = input?.estimatedPrice === null
    ? null
    : Number(input?.estimatedPrice);
  if (!Number.isFinite(depositAmount) || depositAmount < 0 || depositAmount > 9_999_999_999.99) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_INVALID');
  }
  if (
    estimatedPrice !== null &&
    (!Number.isFinite(estimatedPrice) || estimatedPrice < 0 || estimatedPrice > 9_999_999_999.99)
  ) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_INVALID');
  }
  return Object.freeze({
    customerName: text(input?.customerName, 120) as string,
    customerPhone: text(input?.customerPhone, 32) as string,
    deviceBrand: text(input?.deviceBrand, 80) as string,
    deviceModel: text(input?.deviceModel, 80) as string,
    deviceSerial: text(input?.deviceSerial, 120, true),
    deviceColor: text(input?.deviceColor, 80, true),
    reportedProblem: text(input?.reportedProblem, 1000) as string,
    physicalCondition: text(input?.physicalCondition, 1000, true),
    notes: text(input?.notes, 1000, true),
    estimatedPrice: estimatedPrice === null
      ? null
      : Math.round(estimatedPrice * 100) / 100,
    depositAmount: Math.round(depositAmount * 100) / 100,
  });
}

export function parsePreviewRepairStatus(value: unknown): PreviewRepairStatus {
  if (!previewRepairStatuses.includes(value as PreviewRepairStatus)) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_INVALID');
  }
  return value as PreviewRepairStatus;
}

export function parseExpectedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_INVALID');
  }
  return Number(value);
}

export function parsePreviewRepairId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)
  ) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_INVALID');
  }
  return value;
}

const transitions = Object.freeze({
  received: Object.freeze(['diagnosing', 'cancelled'] as const),
  diagnosing: Object.freeze(['ready', 'cancelled'] as const),
  ready: Object.freeze(['delivered', 'cancelled'] as const),
  delivered: Object.freeze([] as const),
  cancelled: Object.freeze([] as const),
}) satisfies Readonly<
  Record<PreviewRepairStatus, readonly PreviewRepairStatus[]>
>;

export function assertPreviewRepairTransition(
  from: PreviewRepairStatus,
  to: PreviewRepairStatus,
): void {
  const allowed = transitions[from] as readonly PreviewRepairStatus[];
  if (!allowed.includes(to)) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_TRANSITION_INVALID');
  }
}

export function newPreviewRepairIdentity(now = new Date()): Readonly<{
  id: string;
  folio: string;
  instant: string;
}> {
  const id = randomUUID();
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  return Object.freeze({
    id,
    folio: `PRE-${date}-${id.slice(0, 8).toUpperCase()}`,
    instant: now.toISOString(),
  });
}
