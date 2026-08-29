import { parseTenantId } from '../../../tenancy/index.js';
import type {
  RepairPersistenceScope,
  RepairRepositoryPort,
  RepairWorklistPage,
  RepairWorklistQuery,
} from '../ports/repair-repository.port.js';
import {
  custodyStatusCodes,
  repairStatusCodes,
} from '../../domain/repair-status.js';
import type {
  CustodyStatusCode,
  RepairStatusCode,
} from '../../domain/repair-status.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const dateOnly = /^\d{4}-\d{2}-\d{2}$/u;

export class ListRepairsQueryError extends Error {
  constructor(readonly parameter: string) {
    super(`Invalid repairs worklist query parameter: ${parameter}`);
    this.name = 'ListRepairsQueryError';
  }
}

export interface ListRepairsInput {
  readonly q?: unknown;
  readonly period?: unknown;
  readonly from?: unknown;
  readonly to?: unknown;
  readonly status?: unknown;
  readonly technicianId?: unknown;
  readonly unassigned?: unknown;
  readonly custody?: unknown;
  readonly page?: unknown;
  readonly pageSize?: unknown;
}

function singleValue(value: unknown, parameter: string): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value) || typeof value !== 'string') {
    throw new ListRepairsQueryError(parameter);
  }
  return value;
}

function enumValue<T extends string>(
  value: unknown,
  parameter: string,
  allowed: readonly T[],
): T | undefined {
  const candidate = singleValue(value, parameter);
  if (candidate === undefined || candidate === '') return undefined;
  if (!allowed.includes(candidate as T)) {
    throw new ListRepairsQueryError(parameter);
  }
  return candidate as T;
}

function parsePage(value: unknown, parameter: string, fallback: number, max: number): number {
  const candidate = singleValue(value, parameter);
  if (candidate === undefined || candidate === '') return fallback;
  if (!/^\d+$/u.test(candidate)) throw new ListRepairsQueryError(parameter);
  const parsed = Number(candidate);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new ListRepairsQueryError(parameter);
  }
  return parsed;
}

function parseDate(value: unknown, parameter: string): string | undefined {
  const candidate = singleValue(value, parameter);
  if (candidate === undefined || candidate === '') return undefined;
  if (!dateOnly.test(candidate)) throw new ListRepairsQueryError(parameter);
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  if (parsed.toISOString().slice(0, 10) !== candidate) {
    throw new ListRepairsQueryError(parameter);
  }
  return candidate;
}

function parseBoolean(value: unknown, parameter: string): boolean | undefined {
  const candidate = singleValue(value, parameter);
  if (candidate === undefined || candidate === '') return undefined;
  if (candidate !== 'true' && candidate !== 'false') {
    throw new ListRepairsQueryError(parameter);
  }
  return candidate === 'true';
}

export function parseListRepairsQuery(input: ListRepairsInput): RepairWorklistQuery {
  const q = singleValue(input.q, 'q')?.trim().replace(/\s+/gu, ' ');
  if (q && q.length > 120) throw new ListRepairsQueryError('q');
  const from = parseDate(input.from, 'from');
  const to = parseDate(input.to, 'to');
  if (from && to && from > to) throw new ListRepairsQueryError('date-range');

  const technicianId = singleValue(input.technicianId, 'technicianId');
  if (technicianId && !canonicalUuid.test(technicianId)) {
    throw new ListRepairsQueryError('technicianId');
  }

  return Object.freeze({
    q: q || undefined,
    period: enumValue(input.period, 'period', ['today', 'week', 'month', 'all'] as const) ?? 'all',
    from,
    to,
    status: enumValue(input.status, 'status', repairStatusCodes) as RepairStatusCode | undefined,
    technicianId: technicianId || undefined,
    unassigned: parseBoolean(input.unassigned, 'unassigned'),
    custody: enumValue(input.custody, 'custody', custodyStatusCodes) as CustodyStatusCode | undefined,
    page: parsePage(input.page, 'page', 1, Number.MAX_SAFE_INTEGER),
    pageSize: parsePage(input.pageSize, 'pageSize', 25, 50),
  });
}

export class ListRepairsUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly resolveScope: () => RepairPersistenceScope,
  ) {}

  async execute(input: ListRepairsInput): Promise<RepairWorklistPage> {
    return this.repository.listWorklist(
      this.resolveScope(),
      parseListRepairsQuery(input),
    );
  }
}

export type ListRepairsResult = RepairWorklistPage;

export function assertLocalRepairScope(scope: RepairPersistenceScope): RepairPersistenceScope {
  try {
    const tenantId = parseTenantId(scope.tenantId);
    if (!canonicalUuid.test(scope.branchId)) throw new Error('invalid branch');
    return Object.freeze({ tenantId, branchId: scope.branchId });
  } catch {
    throw new ListRepairsQueryError('scope');
  }
}
