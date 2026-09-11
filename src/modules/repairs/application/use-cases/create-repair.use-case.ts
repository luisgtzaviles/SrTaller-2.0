import { randomUUID } from 'node:crypto';

import type { CustomerIntakeRuntime } from '../../../customers/index.js';
import { branchLocalCalendarDate, branchLocalDateTimeToUtc } from '../../../stations/index.js';
import type { BranchTimeZone } from '../../../stations/index.js';
import type { CreatedRepairRecord, NewRepairPolicyRecord, RepairCreateContext, RepairRepositoryPort } from '../ports/repair-repository.port.js';
import { RepairCreateAuthorizationChangedError, RepairCreateBrandUnavailableError, RepairCreateIdempotencyConflictError, RepairCreateModelUnavailableError, RepairCreateProblemCategoryUnavailableError, RepairCreateRiskUnavailableError } from '../ports/repair-repository.port.js';
import { RepairCreateDeviceTypeUnavailableError } from '../ports/repair-repository.port.js';
import { newRepairFieldRegistry, newRepairPolicySchemaVersion, systemNewRepairFieldStates } from '../../domain/new-repair-field-policy.js';
import { normalizeNewRepairInput } from '../../domain/new-repair-input-normalization.js';
import type { NewRepairNormalizedField } from '../../domain/new-repair-input-normalization.js';
import { normalizeRepairProblemCategoryKey } from '../repair-problem-category-catalog.service.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const allowedKeys = Object.freeze([
  'customerId', 'customerGivenName', 'customerFamilyName', 'customerPhone', 'addCustomerContactPhone',
  'deviceType', 'canonicalDeviceTypeId', 'deviceBrand', 'canonicalBrandId', 'deviceModel', 'canonicalModelId', 'deviceIdentifier',
  'deviceIdentifierUnavailable', 'deviceColor', 'distinctiveSigns',
  'simIncluded', 'memoryCardIncluded', 'otherAccessories', 'reportedProblems',
  'customerNarrative', 'physicalConditionSummary', 'documentedRiskSummary',
  'acceptedRiskIds', 'receivedPowerState', 'deviceAccessType',
  'warrantyReviewRequested', 'previousRepairId', 'differentDeliverer', 'deliveredByName',
  'requiresRiskAcceptance',
  'estimatedDeliveryLocal', 'initialBudgetAmount', 'clientRequestId',
]);

export class CreateRepairInputError extends Error {
  constructor(readonly parameter: string) { super('Create repair input is invalid.'); this.name = 'CreateRepairInputError'; }
}
export class CreateRepairConflictError extends Error {
  constructor() { super('Create repair request conflicts with a previous request.'); this.name = 'CreateRepairConflictError'; }
}
export class CreateRepairAuthorizationError extends Error {
  constructor() { super('Create repair authorization changed before confirmation.'); this.name = 'CreateRepairAuthorizationError'; }
}

export interface CreateRepairInput { readonly request: unknown; }

function required(value: unknown, parameter: string, maximum: number): string {
  if (typeof value !== 'string') throw new CreateRepairInputError(parameter);
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length < 1 || normalized.length > maximum) throw new CreateRepairInputError(parameter);
  return normalized;
}
function optional(value: unknown, parameter: string, maximum: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  return required(value, parameter, maximum);
}
function normalizedOptional(value: unknown, parameter: string, maximum: number, field: NewRepairNormalizedField): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new CreateRepairInputError(parameter);
  const normalized = normalizeNewRepairInput(field, value);
  if (normalized.length < 1 || normalized.length > maximum) throw new CreateRepairInputError(parameter);
  return normalized;
}
function optionalUuid(value: unknown, parameter: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !uuid.test(value)) throw new CreateRepairInputError(parameter);
  return value;
}
function uuidArray(value: unknown, parameter: string): readonly string[] {
  if (value === undefined || value === null) return Object.freeze([]);
  if (!Array.isArray(value) || value.length > 64 || value.some((item) => typeof item !== 'string' || !uuid.test(item))) throw new CreateRepairInputError(parameter);
  if (new Set(value).size !== value.length) throw new CreateRepairInputError(parameter);
  return Object.freeze([...value]);
}
function reportedProblems(value: unknown): readonly Readonly<{ rawLabel: string; normalizedKey: string; canonicalCategoryId: string | null }>[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) throw new CreateRepairInputError('reportedProblems');
  const result = value.map((item, index) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) throw new CreateRepairInputError(`reportedProblems.${index}`);
    const input = item as Readonly<Record<string, unknown>>;
    if (Object.keys(input).some((key) => !['label', 'categoryId'].includes(key))) throw new CreateRepairInputError(`reportedProblems.${index}`);
    const rawLabel = normalizedOptional(input.label, `reportedProblems.${index}.label`, 160, 'reportedProblem');
    if (rawLabel === null) throw new CreateRepairInputError(`reportedProblems.${index}.label`);
    const normalizedKey = normalizeRepairProblemCategoryKey(rawLabel);
    if (normalizedKey.length < 2) throw new CreateRepairInputError(`reportedProblems.${index}.label`);
    return Object.freeze({ rawLabel, normalizedKey, canonicalCategoryId: optionalUuid(input.categoryId, `reportedProblems.${index}.categoryId`) });
  });
  if (new Set(result.map((item) => item.normalizedKey)).size !== result.length) throw new CreateRepairInputError('reportedProblems');
  return Object.freeze(result);
}
function optionalEnum<const Value extends string>(value: unknown, parameter: string, values: readonly Value[]): Value | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !values.includes(value as Value)) throw new CreateRepairInputError(parameter);
  return value as Value;
}
function optionalBoolean(value: unknown, parameter: string): boolean | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'boolean') throw new CreateRepairInputError(parameter);
  return value;
}
function boolean(value: unknown, parameter: string): boolean {
  if (typeof value !== 'boolean') throw new CreateRepairInputError(parameter);
  return value;
}
function validPhone(value: string | null): string | null {
  if (value === null) return null;
  const digits = value.replace(/[^0-9]/gu, '');
  if (digits.length < 7 || digits.length > 20) throw new CreateRepairInputError('customerPhone');
  return value;
}
function optionalMoneyMinor(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{1,10}(?:\.\d{1,2})?$/u.test(value)) throw new CreateRepairInputError('initialBudgetAmount');
  const [whole, fraction = ''] = value.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor > 999999999999) throw new CreateRepairInputError('initialBudgetAmount');
  return minor;
}
function optionalEstimatedDelivery(value: unknown, timeZone: BranchTimeZone): Date | null {
  const localDateTime = optional(value, 'estimatedDeliveryLocal', 16);
  if (localDateTime === null) return null;
  try {
    return branchLocalDateTimeToUtc(localDateTime, timeZone);
  } catch {
    throw new CreateRepairInputError('estimatedDeliveryLocal');
  }
}
function hasValue(value: unknown): boolean {
  return typeof value === 'boolean' || typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0) || (Array.isArray(value) && value.length > 0);
}

function enforcePolicy(input: Readonly<Record<string, unknown>>, policy: NewRepairPolicyRecord): void {
  for (const field of newRepairFieldRegistry) {
    const state = policy.fieldStates[field.key];
    if (state === 'hidden' && field.payloadKeys.some((key) => Object.hasOwn(input, key))) throw new CreateRepairInputError(field.key);
    if (state === 'required' && !field.payloadKeys.some((key) => hasValue(input[key]))) throw new CreateRepairInputError(field.key);
  }
}

function request(value: unknown, policy: NewRepairPolicyRecord, timeZone: BranchTimeZone) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new CreateRepairInputError('payload');
  const input = value as Readonly<Record<string, unknown>>;
  if (Object.keys(input).some((key) => !allowedKeys.includes(key))) throw new CreateRepairInputError('payload');
  enforcePolicy(input, policy);
  if (typeof input.clientRequestId !== 'string' || !uuid.test(input.clientRequestId)) throw new CreateRepairInputError('clientRequestId');
  const customerId = optionalUuid(input.customerId, 'customerId');
  const customerGivenName = normalizedOptional(input.customerGivenName, 'customerGivenName', 80, 'customerGivenName');
  if (!customerId && !customerGivenName) throw new CreateRepairInputError('customerGivenName');
  const customerPhone = validPhone(optional(input.customerPhone, 'customerPhone', 40));
  const addCustomerContactPhone = input.addCustomerContactPhone === undefined ? false : boolean(input.addCustomerContactPhone, 'addCustomerContactPhone');
  if (addCustomerContactPhone && (!customerId || !customerPhone)) throw new CreateRepairInputError('addCustomerContactPhone');
  const deviceBrand = normalizedOptional(input.deviceBrand, 'deviceBrand', 160, 'deviceBrand');
  const deviceType = normalizedOptional(input.deviceType, 'deviceType', 160, 'deviceType');
  const canonicalDeviceTypeId = optionalUuid(input.canonicalDeviceTypeId, 'canonicalDeviceTypeId');
  if (canonicalDeviceTypeId && !deviceType) throw new CreateRepairInputError('deviceType');
  const canonicalBrandId = optionalUuid(input.canonicalBrandId, 'canonicalBrandId');
  if (canonicalBrandId && !deviceBrand) throw new CreateRepairInputError('deviceBrand');
  const deviceModel = normalizedOptional(input.deviceModel, 'deviceModel', 120, 'deviceModel');
  const canonicalModelId = optionalUuid(input.canonicalModelId, 'canonicalModelId');
  if (canonicalModelId && (!deviceModel || !canonicalBrandId)) throw new CreateRepairInputError('canonicalModelId');
  const deviceIdentifierUnavailable = input.deviceIdentifierUnavailable === undefined ? false : boolean(input.deviceIdentifierUnavailable, 'deviceIdentifierUnavailable');
  const deviceIdentifier = normalizedOptional(input.deviceIdentifier, 'deviceIdentifier', 120, 'deviceIdentifier');
  if (deviceIdentifierUnavailable && deviceIdentifier) throw new CreateRepairInputError('deviceIdentifier');
  const warrantyDecision = optionalBoolean(input.warrantyReviewRequested, 'warrantyReviewRequested');
  const warrantyReviewRequested = warrantyDecision ?? false;
  const previousRepairId = optionalUuid(input.previousRepairId, 'previousRepairId');
  if (previousRepairId && warrantyDecision !== true) throw new CreateRepairInputError('previousRepairId');
  const differentDeliverer = optionalBoolean(input.differentDeliverer, 'differentDeliverer');
  const deliveredByName = normalizedOptional(input.deliveredByName, 'deliveredByName', 200, 'deliveredByName');
  if (differentDeliverer === true && !deliveredByName) throw new CreateRepairInputError('deliveredByName');
  if (differentDeliverer !== true && deliveredByName) throw new CreateRepairInputError('differentDeliverer');
  const requiresRiskAcceptance = optionalBoolean(input.requiresRiskAcceptance, 'requiresRiskAcceptance');
  const simIncluded = optionalBoolean(input.simIncluded, 'simIncluded');
  const memoryCardIncluded = optionalBoolean(input.memoryCardIncluded, 'memoryCardIncluded');
  const receivedPowerState = optionalEnum(input.receivedPowerState, 'receivedPowerState', ['powered_on', 'powered_off'] as const);
  const deviceAccessType = optionalEnum(input.deviceAccessType, 'deviceAccessType', ['none', 'pin', 'password', 'pattern'] as const);
  const acceptedRiskIds = uuidArray(input.acceptedRiskIds, 'acceptedRiskIds');
  const capturedProblems = reportedProblems(input.reportedProblems);
  const documentedRiskSummary = normalizedOptional(input.documentedRiskSummary, 'documentedRiskSummary', 800, 'documentedRiskSummary');
  if (requiresRiskAcceptance === true && acceptedRiskIds.length === 0) throw new CreateRepairInputError('acceptedRiskIds');
  if (requiresRiskAcceptance !== true && (acceptedRiskIds.length > 0 || documentedRiskSummary)) throw new CreateRepairInputError('requiresRiskAcceptance');
  return Object.freeze({
    customerId,
    customerGivenName,
    customerFamilyName: normalizedOptional(input.customerFamilyName, 'customerFamilyName', 120, 'customerFamilyName'),
    customerPhone,
    addCustomerContactPhone,
    deviceType,
    canonicalDeviceTypeId,
    deviceBrand,
    canonicalBrandId,
    deviceModel,
    canonicalModelId,
    deviceIdentifier,
    deviceIdentifierUnavailable,
    deviceColor: normalizedOptional(input.deviceColor, 'deviceColor', 80, 'deviceColor'),
    distinctiveSigns: normalizedOptional(input.distinctiveSigns, 'distinctiveSigns', 1200, 'distinctiveSigns'),
    simIncluded,
    memoryCardIncluded,
    otherAccessories: normalizedOptional(input.otherAccessories, 'otherAccessories', 800, 'otherAccessories'),
    reportedProblems: capturedProblems,
    reportedIssueCompatibilitySummary: capturedProblems.map((problem) => problem.rawLabel).join(' · ').slice(0, 500),
    customerNarrative: normalizedOptional(input.customerNarrative, 'customerNarrative', 2000, 'customerNarrative'),
    physicalConditionSummary: normalizedOptional(input.physicalConditionSummary, 'physicalConditionSummary', 1200, 'physicalConditionSummary'),
    documentedRiskSummary,
    acceptedRiskIds,
    receivedPowerState,
    deviceAccessType,
    warrantyReviewRequested,
    previousRepairId,
    deliveredByName,
    estimatedDeliveryAt: optionalEstimatedDelivery(input.estimatedDeliveryLocal, timeZone),
    initialBudgetAmountMinor: optionalMoneyMinor(input.initialBudgetAmount),
    clientRequestId: input.clientRequestId,
  });
}
function trusted(value: RepairCreateContext): RepairCreateContext {
  if (!uuid.test(value.tenantId) || !uuid.test(value.branchId) || !uuid.test(value.stationId) || !uuid.test(value.sessionId) || !uuid.test(value.actorUserId) || value.capability !== 'repairs.create' || typeof value.actorDisplayName !== 'string' || value.actorDisplayName.trim().length < 1 || !value.commitGuard) throw new Error('Trusted create repair context is invalid.');
  return Object.freeze({ ...value, actorDisplayName: value.actorDisplayName.trim() });
}

export class CreateRepairUseCase {
  constructor(private readonly repository: RepairRepositoryPort, private readonly customers: CustomerIntakeRuntime, private readonly resolveContext: () => RepairCreateContext, private readonly timeZone: BranchTimeZone, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID, private readonly policy: NewRepairPolicyRecord = Object.freeze({ schemaVersion: newRepairPolicySchemaVersion, policyVersion: 0, fieldStates: systemNewRepairFieldStates(), updatedAt: null })) {}
  async execute(input: CreateRepairInput): Promise<CreatedRepairRecord> {
    const value = request(input.request, this.policy, this.timeZone);
    const context = trusted(this.resolveContext());
    const occurredAt = this.now();
    const ids = [this.createId(), this.createId(), this.createId(), this.createId(), this.createId(), this.createId(), this.createId(), ...value.reportedProblems.flatMap(() => [this.createId(), this.createId()])] as const;
    if (ids.some((id) => !uuid.test(id)) || new Set(ids).size !== ids.length) throw new Error('Server-generated create repair identifiers are invalid.');
    const persistedProblems = value.reportedProblems.map((problem, index) => Object.freeze({
      ...problem,
      problemCaptureId: ids[7 + index * 2]!,
      pendingProblemValueId: ids[8 + index * 2]!,
    }));
    try {
      return await this.repository.createRepair(context, {
        repairId: ids[0], timelineEntryId: ids[1], auditEventId: ids[2], correlationId: ids[3], clientRequestId: value.clientRequestId,
        customerId: value.customerId, customerGivenName: value.customerGivenName, customerFamilyName: value.customerFamilyName,
        customerPhone: value.customerPhone, addCustomerContactPhone: value.addCustomerContactPhone, deviceType: value.deviceType, canonicalDeviceTypeId: value.canonicalDeviceTypeId,
        pendingDeviceTypeValueId: value.deviceType && !value.canonicalDeviceTypeId ? ids[4] : null, deviceBrand: value.deviceBrand, canonicalBrandId: value.canonicalBrandId,
        pendingBrandValueId: value.deviceBrand && !value.canonicalBrandId ? ids[5] : null, deviceModel: value.deviceModel,
        canonicalModelId: value.canonicalModelId, pendingModelValueId: value.deviceModel && !value.canonicalModelId ? ids[6] : null,
        deviceIdentifier: value.deviceIdentifier, deviceIdentifierUnavailable: value.deviceIdentifierUnavailable, deviceColor: value.deviceColor,
        distinctiveSigns: value.distinctiveSigns, simIncluded: value.simIncluded, memoryCardIncluded: value.memoryCardIncluded,
        otherAccessories: value.otherAccessories,
        reportedIssueCompatibilitySummary: value.reportedIssueCompatibilitySummary, reportedProblems: persistedProblems,
        customerNarrative: value.customerNarrative, physicalConditionSummary: value.physicalConditionSummary, documentedRiskSummary: value.documentedRiskSummary,
        acceptedRiskIds: value.acceptedRiskIds, receivedPowerState: value.receivedPowerState, deviceAccessType: value.deviceAccessType,
        warrantyReviewRequested: value.warrantyReviewRequested, previousRepairId: value.previousRepairId,
        deliveredByName: value.deliveredByName, estimatedDeliveryAt: value.estimatedDeliveryAt, initialBudgetAmountMinor: value.initialBudgetAmountMinor,
        newRepairPolicyVersion: this.policy.policyVersion,
        action: 'repair.received', occurredAt, folioYear: Number(branchLocalCalendarDate(occurredAt, this.timeZone).slice(0, 4)),
      }, (transactionContext) => this.customers.resolveSelectedOrCreate(
        { tenantId: context.tenantId, branchId: context.branchId },
        {
          customerId: value.customerId,
          givenName: value.customerGivenName,
          familyName: value.customerFamilyName,
          contactPhone: !value.customerId || value.addCustomerContactPhone ? value.customerPhone : null,
          addCustomerContactPhone: value.addCustomerContactPhone,
        },
        transactionContext,
      ));
    } catch (error: unknown) {
      if (error instanceof RepairCreateIdempotencyConflictError) throw new CreateRepairConflictError();
      if (error instanceof RepairCreateAuthorizationChangedError) throw new CreateRepairAuthorizationError();
      if (error instanceof RepairCreateRiskUnavailableError) throw new CreateRepairInputError('acceptedRiskIds');
      if (error instanceof RepairCreateBrandUnavailableError) throw new CreateRepairInputError('canonicalBrandId');
      if (error instanceof RepairCreateDeviceTypeUnavailableError) throw new CreateRepairInputError('canonicalDeviceTypeId');
      if (error instanceof RepairCreateModelUnavailableError) throw new CreateRepairInputError('canonicalModelId');
      if (error instanceof RepairCreateProblemCategoryUnavailableError) throw new CreateRepairInputError('reportedProblems');
      throw error;
    }
  }
}
