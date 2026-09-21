import { createHash, timingSafeEqual } from 'node:crypto';
import type { InternalDatabasePersistenceConnection } from '../../../../infrastructure/database/database-persistence-capability.js';
import { useDatabasePersistenceExecutor, useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type {
  InternalDatabasePersistenceExecutor,
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  AccessCapabilityRow,
  AccessRoleAssignmentCommandRow,
  AccessRoleAssignmentRow,
  AccessRoleCommandRow,
  AccessRoleRow,
} from '../../../../infrastructure/database/database-types.js';
import { parseTenantId } from '../../../tenancy/index.js';
import {
  composeEffectiveCapabilities,
  parseCapabilityCode,
} from '../../domain/capability.js';
import type { CapabilityCode } from '../../domain/capability.js';
import {
  parseRoleDisplayName,
  parseRoleDescription,
  parseRoleId,
  parseRoleKey,
  parseRoleStatus,
} from '../../domain/role.js';
import {
  parseAccessBranchId,
  parseAccessUserId,
  parseRoleAssignmentId,
  parseRoleAssignmentStatus,
  parseRoleAssignmentTarget,
} from '../../domain/role-assignment.js';
import { AccessPersistenceError } from '../../application/ports/access-repository.port.js';
import type {
  AccessBranchScope,
  AccessMutationCommitGuard,
  AccessCapabilityRecord,
  AccessMatrixRecord,
  AccessPrincipalScope,
  AccessRepositoryPort,
  AccessRoleAssignmentRecord,
  AccessRoleRecord,
  CreateAccessRoleInput,
  ReplaceAccessRoleCapabilitiesInput,
  UpdateAccessRoleInput,
  AccessTenantScope,
  AssignRoleInput,
  RevokeRoleAssignmentInput,
} from '../../application/ports/access-repository.port.js';

type AccessExecutor = InternalDatabasePersistenceExecutor<'access'>;
type AccessOperation = <Result>(
  operation: InternalDatabasePersistenceOperation<'access', Result>,
) => Promise<Result>;
type AccessTransactionOperation = <Result>(
  operation: (executor: AccessExecutor, transactionContext: object) => Promise<Result>,
) => Promise<Result>;

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function driverErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return typeof candidate.code === 'string' ? candidate.code : '';
}

function mapAccessError(error: unknown): AccessPersistenceError {
  if (error instanceof AccessPersistenceError) {
    return error;
  }
  const code = driverErrorCode(error);
  if (code === '23505') {
    return new AccessPersistenceError('ACCESS_ASSIGNMENT_CONFLICT');
  }
  if (code === '23503') {
    return new AccessPersistenceError('ACCESS_REFERENCE_NOT_FOUND');
  }
  if (
    code === '22001' ||
    code === '22P02' ||
    code === '23502' ||
    code === '23514'
  ) {
    return new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
  return new AccessPersistenceError('ACCESS_PERSISTENCE_FAILED');
}

function validInstant(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

function validateClientRequestId(value: unknown): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
  return value;
}

function validateTenantScope(
  scope: AccessTenantScope,
): Readonly<{ tenantId: AccessTenantScope['tenantId'] }> {
  try {
    return Object.freeze({ tenantId: parseTenantId(scope?.tenantId) });
  } catch {
    throw new AccessPersistenceError('ACCESS_TENANT_SCOPE_REQUIRED');
  }
}

function validateBranchScope(scope: AccessBranchScope): Readonly<{
  tenantId: AccessBranchScope['tenantId'];
  branchId: AccessBranchScope['branchId'];
}> {
  const trustedTenant = validateTenantScope(scope);
  try {
    return Object.freeze({
      tenantId: trustedTenant.tenantId,
      branchId: parseAccessBranchId(scope?.branchId),
    });
  } catch {
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
}

function validatePrincipalScope(scope: AccessPrincipalScope): Readonly<{
  tenantId: AccessPrincipalScope['tenantId'];
  branchId: AccessPrincipalScope['branchId'];
  userId: AccessPrincipalScope['userId'];
}> {
  const trustedBranch = validateBranchScope(scope);
  try {
    return Object.freeze({
      ...trustedBranch,
      userId: parseAccessUserId(scope?.userId),
    });
  } catch {
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
}

function validateAssignInput(input: AssignRoleInput): Readonly<{
  assignmentId: AssignRoleInput['assignmentId'];
  userId: AssignRoleInput['userId'];
  roleId: AssignRoleInput['roleId'];
  assignmentScope: AssignRoleInput['assignmentScope'];
  branchId: AssignRoleInput['branchId'];
  clientRequestId: string;
  occurredAt: Date;
}> {
  try {
    if (!validInstant(input?.occurredAt)) {
      throw new Error('invalid instant');
    }
    const target = parseRoleAssignmentTarget(
      input.assignmentScope,
      input.branchId,
    );
    return Object.freeze({
      assignmentId: parseRoleAssignmentId(input.assignmentId),
      userId: parseAccessUserId(input.userId),
      roleId: parseRoleId(input.roleId),
      assignmentScope: target.scope,
      branchId: target.branchId,
      clientRequestId: validateClientRequestId(input.clientRequestId),
      occurredAt: new Date(input.occurredAt),
    });
  } catch (error: unknown) {
    if (error instanceof AccessPersistenceError) {
      throw error;
    }
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
}

function validateCreateRoleInput(input: CreateAccessRoleInput): Readonly<{
  roleId: CreateAccessRoleInput['roleId'];
  roleKey: CreateAccessRoleInput['roleKey'];
  displayName: CreateAccessRoleInput['displayName'];
  description: CreateAccessRoleInput['description'];
  capabilityCodes: readonly CapabilityCode[];
  clientRequestId: string;
  occurredAt: Date;
}> {
  try {
    if (!validInstant(input?.occurredAt) || !Array.isArray(input.capabilityCodes) || input.capabilityCodes.length < 1) {
      throw new Error('invalid role input');
    }
    const capabilityCodes = input.capabilityCodes.map(parseCapabilityCode);
    if (new Set(capabilityCodes).size !== capabilityCodes.length) throw new Error('duplicate capability');
    return Object.freeze({
      roleId: parseRoleId(input.roleId),
      roleKey: parseRoleKey(input.roleKey),
      displayName: parseRoleDisplayName(input.displayName),
      description: parseRoleDescription(input.description),
      capabilityCodes: Object.freeze(capabilityCodes),
      clientRequestId: validateClientRequestId(input.clientRequestId),
      occurredAt: new Date(input.occurredAt),
    });
  } catch {
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
}

function validateReplaceRoleCapabilitiesInput(input: ReplaceAccessRoleCapabilitiesInput): Readonly<{
  roleId: ReplaceAccessRoleCapabilitiesInput['roleId'];
  expectedVersion: number;
  capabilityCodes: readonly CapabilityCode[];
  clientRequestId: string;
  occurredAt: Date;
}> {
  try {
    if (
      !validInstant(input?.occurredAt) ||
      !Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion < 0 ||
      !Array.isArray(input.capabilityCodes) ||
      input.capabilityCodes.length < 1
    ) throw new Error('invalid role replacement');
    const capabilityCodes = input.capabilityCodes.map(parseCapabilityCode);
    if (new Set(capabilityCodes).size !== capabilityCodes.length) throw new Error('duplicate capability');
    return Object.freeze({
      roleId: parseRoleId(input.roleId),
      expectedVersion: input.expectedVersion,
      capabilityCodes: Object.freeze(capabilityCodes),
      clientRequestId: validateClientRequestId(input.clientRequestId),
      occurredAt: new Date(input.occurredAt),
    });
  } catch {
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
}

function validateUpdateRoleInput(input: UpdateAccessRoleInput): Readonly<{
  roleId: UpdateAccessRoleInput['roleId'];
  displayName: UpdateAccessRoleInput['displayName'];
  description: UpdateAccessRoleInput['description'];
  expectedVersion: number;
  clientRequestId: string;
  occurredAt: Date;
}> {
  try {
    if (
      !validInstant(input?.occurredAt) ||
      !Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion < 0
    ) throw new Error('invalid role update');
    return Object.freeze({
      roleId: parseRoleId(input.roleId),
      displayName: parseRoleDisplayName(input.displayName),
      description: parseRoleDescription(input.description),
      expectedVersion: input.expectedVersion,
      clientRequestId: validateClientRequestId(input.clientRequestId),
      occurredAt: new Date(input.occurredAt),
    });
  } catch {
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
}

function validateRevokeInput(input: RevokeRoleAssignmentInput): Readonly<{
  assignmentId: RevokeRoleAssignmentInput['assignmentId'];
  expectedVersion: number;
  clientRequestId: string;
  occurredAt: Date;
}> {
  try {
    if (
      !Number.isSafeInteger(input?.expectedVersion) ||
      input.expectedVersion < 0 ||
      !validInstant(input.occurredAt)
    ) {
      throw new Error('invalid revoke input');
    }
    return Object.freeze({
      assignmentId: parseRoleAssignmentId(input.assignmentId),
      expectedVersion: input.expectedVersion,
      clientRequestId: validateClientRequestId(input.clientRequestId),
      occurredAt: new Date(input.occurredAt),
    });
  } catch (error: unknown) {
    if (error instanceof AccessPersistenceError) {
      throw error;
    }
    throw new AccessPersistenceError('ACCESS_INPUT_INVALID');
  }
}

function mapCapabilityRecord(row: AccessCapabilityRow): AccessCapabilityRecord {
  return Object.freeze({
    capabilityCode: parseCapabilityCode(row.capability_code),
    createdAt: row.created_at.toISOString(),
  });
}

function mapRoleRecord(
  row: AccessRoleRow,
  capabilityCodes: readonly CapabilityCode[],
): AccessRoleRecord {
  return Object.freeze({
    tenantId: parseTenantId(row.tenant_id),
    roleId: parseRoleId(row.role_id),
    roleKey: parseRoleKey(row.role_key),
    displayName: parseRoleDisplayName(row.display_name),
    description: parseRoleDescription(row.description),
    status: parseRoleStatus(row.status),
    version: row.version,
    managementMode: row.management_mode,
    policyVersion: row.policy_version,
    capabilityCodes: composeEffectiveCapabilities(capabilityCodes),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

function roleFingerprint(value: unknown): Uint8Array {
  return Uint8Array.from(
    createHash('sha256').update(JSON.stringify(value), 'utf8').digest(),
  );
}

function mapRoleCommand(command: AccessRoleCommandRow): AccessRoleRecord {
  return Object.freeze({
    tenantId: parseTenantId(command.tenant_id),
    roleId: parseRoleId(command.role_id),
    roleKey: parseRoleKey(command.result_role_key),
    displayName: parseRoleDisplayName(command.result_display_name),
    description: parseRoleDescription(command.result_description),
    status: parseRoleStatus(command.result_status),
    version: command.result_version,
    managementMode: 'TENANT_MANAGED',
    policyVersion: null,
    capabilityCodes: composeEffectiveCapabilities(
      command.result_capability_codes.map(parseCapabilityCode),
    ),
    createdAt: command.result_created_at.toISOString(),
    updatedAt: command.result_updated_at.toISOString(),
  });
}

function replayRoleCommand(
  command: AccessRoleCommandRow,
  type: AccessRoleCommandRow['command_type'],
  fingerprint: Uint8Array,
): AccessRoleRecord {
  if (
    command.command_type !== type ||
    !timingSafeEqual(
      Buffer.from(command.request_fingerprint),
      Buffer.from(fingerprint),
    )
  ) {
    throw new AccessPersistenceError('ACCESS_IDEMPOTENCY_CONFLICT');
  }
  return mapRoleCommand(command);
}

function mapAssignmentRecord(
  row: AccessRoleAssignmentRow,
): AccessRoleAssignmentRecord {
  const target = parseRoleAssignmentTarget(
    row.assignment_scope,
    row.branch_id,
  );
  return Object.freeze({
    tenantId: parseTenantId(row.tenant_id),
    assignmentId: parseRoleAssignmentId(row.assignment_id),
    userId: parseAccessUserId(row.user_id),
    roleId: parseRoleId(row.role_id),
    assignmentScope: target.scope,
    branchId: target.branchId,
    status: parseRoleAssignmentStatus(row.status),
    version: row.version,
    assignedAt: row.assigned_at.toISOString(),
    revokedAt: row.revoked_at?.toISOString() ?? null,
  });
}

function mapCommandResult(
  command: AccessRoleAssignmentCommandRow,
): AccessRoleAssignmentRecord {
  const target = parseRoleAssignmentTarget(
    command.assignment_scope,
    command.branch_id,
  );
  return Object.freeze({
    tenantId: parseTenantId(command.tenant_id),
    assignmentId: parseRoleAssignmentId(command.assignment_id),
    userId: parseAccessUserId(command.user_id),
    roleId: parseRoleId(command.role_id),
    assignmentScope: target.scope,
    branchId: target.branchId,
    status: parseRoleAssignmentStatus(command.result_status),
    version: command.result_version,
    assignedAt: command.result_assigned_at.toISOString(),
    revokedAt: command.result_revoked_at?.toISOString() ?? null,
  });
}

function sameBranch(left: string | null, right: string | null): boolean {
  return left === right;
}

function replayAssignCommand(
  command: AccessRoleAssignmentCommandRow,
  input: ReturnType<typeof validateAssignInput>,
): AccessRoleAssignmentRecord {
  if (
    command.command_type !== 'assign' ||
    command.user_id !== input.userId ||
    command.role_id !== input.roleId ||
    command.assignment_scope !== input.assignmentScope ||
    !sameBranch(command.branch_id, input.branchId) ||
    command.expected_version !== null
  ) {
    throw new AccessPersistenceError('ACCESS_IDEMPOTENCY_CONFLICT');
  }
  return mapCommandResult(command);
}

function replayRevokeCommand(
  command: AccessRoleAssignmentCommandRow,
  input: ReturnType<typeof validateRevokeInput>,
): AccessRoleAssignmentRecord {
  if (
    command.command_type !== 'revoke' ||
    command.assignment_id !== input.assignmentId ||
    command.expected_version !== input.expectedVersion
  ) {
    throw new AccessPersistenceError('ACCESS_IDEMPOTENCY_CONFLICT');
  }
  return mapCommandResult(command);
}

class KyselyAccessRepository implements AccessRepositoryPort {
  constructor(
    private readonly execute: AccessOperation,
    private readonly executeTransaction: AccessTransactionOperation,
  ) {}

  async listMatrix(scope: AccessTenantScope): Promise<AccessMatrixRecord> {
    const trustedScope = validateTenantScope(scope);
    try {
      return await this.execute(async (database: AccessExecutor) => {
        const capabilityRows = await database
          .selectFrom('access_capabilities')
          .selectAll()
          .orderBy('capability_code', 'asc')
          .execute();
        const roleRows = await database
          .selectFrom('access_roles')
          .selectAll()
          .where('tenant_id', '=', trustedScope.tenantId)
          .orderBy('role_key', 'asc')
          .orderBy('role_id', 'asc')
          .execute();
        const roleCapabilityRows = await database
          .selectFrom('access_role_capabilities')
          .select(['role_id', 'capability_code'])
          .where('tenant_id', '=', trustedScope.tenantId)
          .orderBy('role_id', 'asc')
          .orderBy('capability_code', 'asc')
          .execute();
        const assignmentRows = await database
          .selectFrom('access_role_assignments')
          .selectAll()
          .where('tenant_id', '=', trustedScope.tenantId)
          .orderBy('assigned_at', 'asc')
          .orderBy('assignment_id', 'asc')
          .execute();

        const capabilitiesByRole = new Map<string, CapabilityCode[]>();
        for (const row of roleCapabilityRows) {
          const capabilities = capabilitiesByRole.get(row.role_id) ?? [];
          capabilities.push(parseCapabilityCode(row.capability_code));
          capabilitiesByRole.set(row.role_id, capabilities);
        }

        return Object.freeze({
          capabilities: Object.freeze(capabilityRows.map(mapCapabilityRecord)),
          roles: Object.freeze(
            roleRows.map((role) =>
              mapRoleRecord(role, capabilitiesByRole.get(role.role_id) ?? []),
            ),
          ),
          assignments: Object.freeze(assignmentRows.map(mapAssignmentRecord)),
        });
      });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }

  async createRole(
    scope: AccessTenantScope,
    input: CreateAccessRoleInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleRecord> {
    const trustedScope = validateTenantScope(scope);
    const trustedInput = validateCreateRoleInput(input);
    const fingerprint = roleFingerprint({
      capabilityCodes: [...trustedInput.capabilityCodes].sort(),
      description: trustedInput.description,
      displayName: trustedInput.displayName,
      roleKey: trustedInput.roleKey,
    });
    try {
      return await this.executeTransaction(async (transaction, transactionContext) => {
          if (guard && !await guard.confirmCurrent(transactionContext)) {
            throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
          }
          const prior = await transaction.selectFrom('access_role_commands')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('client_request_id', '=', trustedInput.clientRequestId)
            .executeTakeFirst();
          if (prior) return replayRoleCommand(prior, 'create', fingerprint);
          const role = await transaction.insertInto('access_roles').values({
            tenant_id: trustedScope.tenantId,
            role_id: trustedInput.roleId,
            role_key: trustedInput.roleKey,
            display_name: trustedInput.displayName,
            description: trustedInput.description,
            status: 'active',
            version: 0,
            management_mode: 'TENANT_MANAGED',
            policy_version: null,
            created_at: trustedInput.occurredAt,
            updated_at: trustedInput.occurredAt,
          }).returningAll().executeTakeFirstOrThrow();
          await transaction.insertInto('access_role_capabilities').values(
            trustedInput.capabilityCodes.map((capabilityCode) => ({
              tenant_id: trustedScope.tenantId,
              role_id: trustedInput.roleId,
              capability_code: capabilityCode,
              created_at: trustedInput.occurredAt,
            })),
          ).execute();
          const command = await transaction.insertInto('access_role_commands')
            .values({
              tenant_id: trustedScope.tenantId,
              client_request_id: trustedInput.clientRequestId,
              command_type: 'create',
              role_id: role.role_id,
              request_fingerprint: fingerprint,
              result_role_key: role.role_key,
              result_display_name: role.display_name,
              result_description: role.description,
              result_status: role.status,
              result_version: role.version,
              result_capability_codes: [...trustedInput.capabilityCodes].sort(),
              result_created_at: role.created_at,
              result_updated_at: role.updated_at,
              applied_at: trustedInput.occurredAt,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          return mapRoleCommand(command);
        });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }

  async replaceRoleCapabilities(
    scope: AccessTenantScope,
    input: ReplaceAccessRoleCapabilitiesInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleRecord> {
    const trustedScope = validateTenantScope(scope);
    const trustedInput = validateReplaceRoleCapabilitiesInput(input);
    const fingerprint = roleFingerprint({
      capabilityCodes: [...trustedInput.capabilityCodes].sort(),
      expectedVersion: trustedInput.expectedVersion,
      roleId: trustedInput.roleId,
    });
    try {
      return await this.executeTransaction(async (transaction, transactionContext) => {
          if (guard && !await guard.confirmCurrent(transactionContext)) {
            throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
          }
          const prior = await transaction.selectFrom('access_role_commands')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('client_request_id', '=', trustedInput.clientRequestId)
            .executeTakeFirst();
          if (prior) {
            return replayRoleCommand(prior, 'replace_capabilities', fingerprint);
          }
          const current = await transaction
            .selectFrom('access_roles')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('role_id', '=', trustedInput.roleId)
            .where('status', '=', 'active')
            .executeTakeFirst();
          if (!current) throw new AccessPersistenceError('ACCESS_REFERENCE_NOT_FOUND');
          if (current.management_mode === 'SYSTEM_MANAGED') {
            throw new AccessPersistenceError('ACCESS_PROTECTED_ROLE');
          }
          if (current.version !== trustedInput.expectedVersion) {
            throw new AccessPersistenceError('ACCESS_STALE_WRITE');
          }
          await transaction
            .deleteFrom('access_role_capabilities')
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('role_id', '=', trustedInput.roleId)
            .execute();
          await transaction.insertInto('access_role_capabilities').values(
            trustedInput.capabilityCodes.map((capabilityCode) => ({
              tenant_id: trustedScope.tenantId,
              role_id: trustedInput.roleId,
              capability_code: capabilityCode,
              created_at: trustedInput.occurredAt,
            })),
          ).execute();
          const updated = await transaction
            .updateTable('access_roles')
            .set({ version: current.version + 1, updated_at: trustedInput.occurredAt })
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('role_id', '=', trustedInput.roleId)
            .where('version', '=', trustedInput.expectedVersion)
            .returningAll()
            .executeTakeFirst();
          if (!updated) throw new AccessPersistenceError('ACCESS_STALE_WRITE');
          const command = await transaction.insertInto('access_role_commands')
            .values({
              tenant_id: trustedScope.tenantId,
              client_request_id: trustedInput.clientRequestId,
              command_type: 'replace_capabilities',
              role_id: updated.role_id,
              request_fingerprint: fingerprint,
              result_role_key: updated.role_key,
              result_display_name: updated.display_name,
              result_description: updated.description,
              result_status: updated.status,
              result_version: updated.version,
              result_capability_codes: [...trustedInput.capabilityCodes].sort(),
              result_created_at: updated.created_at,
              result_updated_at: updated.updated_at,
              applied_at: trustedInput.occurredAt,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          if (guard?.confirmContinuity && !await guard.confirmContinuity(transactionContext)) {
            throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
          }
          return mapRoleCommand(command);
        });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }

  async updateRole(
    scope: AccessTenantScope,
    input: UpdateAccessRoleInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleRecord> {
    const trustedScope = validateTenantScope(scope);
    const trustedInput = validateUpdateRoleInput(input);
    const fingerprint = roleFingerprint({
      description: trustedInput.description,
      displayName: trustedInput.displayName,
      expectedVersion: trustedInput.expectedVersion,
      roleId: trustedInput.roleId,
    });
    try {
      return await this.executeTransaction(async (transaction, transactionContext) => {
          if (guard && !await guard.confirmCurrent(transactionContext)) {
            throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
          }
          const prior = await transaction.selectFrom('access_role_commands')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('client_request_id', '=', trustedInput.clientRequestId)
            .executeTakeFirst();
          if (prior) return replayRoleCommand(prior, 'update', fingerprint);
          const current = await transaction.selectFrom('access_roles')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('role_id', '=', trustedInput.roleId)
            .where('status', '=', 'active')
            .executeTakeFirst();
          if (!current) throw new AccessPersistenceError('ACCESS_REFERENCE_NOT_FOUND');
          if (current.management_mode === 'SYSTEM_MANAGED') {
            throw new AccessPersistenceError('ACCESS_PROTECTED_ROLE');
          }
          if (current.version !== trustedInput.expectedVersion) {
            throw new AccessPersistenceError('ACCESS_STALE_WRITE');
          }
          const capabilities = await transaction.selectFrom('access_role_capabilities')
            .select('capability_code')
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('role_id', '=', trustedInput.roleId)
            .orderBy('capability_code', 'asc')
            .execute();
          const updated = await transaction.updateTable('access_roles')
            .set({
              display_name: trustedInput.displayName,
              description: trustedInput.description,
              version: current.version + 1,
              updated_at: trustedInput.occurredAt,
            })
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('role_id', '=', trustedInput.roleId)
            .where('version', '=', trustedInput.expectedVersion)
            .returningAll()
            .executeTakeFirst();
          if (!updated) throw new AccessPersistenceError('ACCESS_STALE_WRITE');
          const capabilityCodes = capabilities.map(({ capability_code }) => capability_code);
          const command = await transaction.insertInto('access_role_commands')
            .values({
              tenant_id: trustedScope.tenantId,
              client_request_id: trustedInput.clientRequestId,
              command_type: 'update',
              role_id: updated.role_id,
              request_fingerprint: fingerprint,
              result_role_key: updated.role_key,
              result_display_name: updated.display_name,
              result_description: updated.description,
              result_status: updated.status,
              result_version: updated.version,
              result_capability_codes: capabilityCodes,
              result_created_at: updated.created_at,
              result_updated_at: updated.updated_at,
              applied_at: trustedInput.occurredAt,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          return mapRoleCommand(command);
        });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }

  async listApplicableUserIds(
    scope: AccessBranchScope,
  ): Promise<readonly ReturnType<typeof parseAccessUserId>[]> {
    const trustedScope = validateBranchScope(scope);
    try {
      return await this.execute(async (database: AccessExecutor) => {
        const rows = await database
          .selectFrom('access_role_assignments')
          .innerJoin('access_roles', (join) =>
            join
              .onRef(
                'access_roles.tenant_id',
                '=',
                'access_role_assignments.tenant_id',
              )
              .onRef(
                'access_roles.role_id',
                '=',
                'access_role_assignments.role_id',
              ),
          )
          .select('access_role_assignments.user_id')
          .distinct()
          .where(
            'access_role_assignments.tenant_id',
            '=',
            trustedScope.tenantId,
          )
          .where('access_role_assignments.status', '=', 'active')
          .where('access_roles.status', '=', 'active')
          .where((expression) =>
            expression.or([
              expression(
                'access_role_assignments.assignment_scope',
                '=',
                'TENANT_WIDE',
              ),
              expression.and([
                expression(
                  'access_role_assignments.assignment_scope',
                  '=',
                  'BRANCH_RESTRICTED',
                ),
                expression(
                  'access_role_assignments.branch_id',
                  '=',
                  trustedScope.branchId,
                ),
              ]),
            ]),
          )
          .orderBy('access_role_assignments.user_id', 'asc')
          .execute();
        return Object.freeze(rows.map((row) => parseAccessUserId(row.user_id)));
      });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }

  async resolveEffectiveCapabilities(
    scope: AccessPrincipalScope,
  ): Promise<readonly CapabilityCode[]> {
    const trustedScope = validatePrincipalScope(scope);
    try {
      return await this.execute(async (database: AccessExecutor) => {
        const rows = await database
          .selectFrom('access_role_assignments')
          .innerJoin('access_roles', (join) =>
            join
              .onRef(
                'access_roles.tenant_id',
                '=',
                'access_role_assignments.tenant_id',
              )
              .onRef(
                'access_roles.role_id',
                '=',
                'access_role_assignments.role_id',
              ),
          )
          .innerJoin('access_role_capabilities', (join) =>
            join
              .onRef(
                'access_role_capabilities.tenant_id',
                '=',
                'access_roles.tenant_id',
              )
              .onRef(
                'access_role_capabilities.role_id',
                '=',
                'access_roles.role_id',
              ),
          )
          .innerJoin(
            'access_capabilities',
            'access_capabilities.capability_code',
            'access_role_capabilities.capability_code',
          )
          .select('access_capabilities.capability_code')
          .distinct()
          .where(
            'access_role_assignments.tenant_id',
            '=',
            trustedScope.tenantId,
          )
          .where('access_role_assignments.user_id', '=', trustedScope.userId)
          .where('access_role_assignments.status', '=', 'active')
          .where('access_roles.status', '=', 'active')
          .where((expression) =>
            expression.or([
              expression(
                'access_role_assignments.assignment_scope',
                '=',
                'TENANT_WIDE',
              ),
              expression.and([
                expression(
                  'access_role_assignments.assignment_scope',
                  '=',
                  'BRANCH_RESTRICTED',
                ),
                expression(
                  'access_role_assignments.branch_id',
                  '=',
                  trustedScope.branchId,
                ),
              ]),
            ]),
          )
          .orderBy('access_capabilities.capability_code', 'asc')
          .execute();
        return composeEffectiveCapabilities(
          rows.map((row) => parseCapabilityCode(row.capability_code)),
        );
      });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }

  async assignRole(
    scope: AccessTenantScope,
    input: AssignRoleInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleAssignmentRecord> {
    const trustedScope = validateTenantScope(scope);
    const trustedInput = validateAssignInput(input);
    try {
      return await this.executeTransaction(async (transaction, transactionContext) => {
          if (guard && !await guard.confirmCurrent(transactionContext)) {
            throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
          }
          await transaction
            .insertInto('access_pin_eligibility_tenant_guards')
            .values({
              tenant_id: trustedScope.tenantId,
              created_at: trustedInput.occurredAt,
            })
            .onConflict((conflict) => conflict.column('tenant_id').doNothing())
            .execute();
          await transaction
            .selectFrom('access_pin_eligibility_tenant_guards')
            .select('tenant_id')
            .where('tenant_id', '=', trustedScope.tenantId)
            .forUpdate()
            .executeTakeFirstOrThrow();
          const previousCommand = await transaction
            .selectFrom('access_role_assignment_commands')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('client_request_id', '=', trustedInput.clientRequestId)
            .executeTakeFirst();
          if (previousCommand) {
            return replayAssignCommand(previousCommand, trustedInput);
          }

          const activeRole = await transaction
            .selectFrom('access_roles')
            .select('role_id')
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('role_id', '=', trustedInput.roleId)
            .where('status', '=', 'active')
            .executeTakeFirst();
          if (!activeRole) {
            throw new AccessPersistenceError('ACCESS_REFERENCE_NOT_FOUND');
          }

          const assignment = await transaction
            .insertInto('access_role_assignments')
            .values({
              tenant_id: trustedScope.tenantId,
              assignment_id: trustedInput.assignmentId,
              user_id: trustedInput.userId,
              role_id: trustedInput.roleId,
              assignment_scope: trustedInput.assignmentScope,
              branch_id: trustedInput.branchId,
              status: 'active',
              version: 0,
              assigned_at: trustedInput.occurredAt,
              revoked_at: null,
            })
            .onConflict((conflict) => conflict.doNothing())
            .returningAll()
            .executeTakeFirst();

          if (!assignment) {
            const concurrentCommand = await transaction
              .selectFrom('access_role_assignment_commands')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('client_request_id', '=', trustedInput.clientRequestId)
              .executeTakeFirst();
            if (concurrentCommand) {
              return replayAssignCommand(concurrentCommand, trustedInput);
            }
            throw new AccessPersistenceError('ACCESS_ASSIGNMENT_CONFLICT');
          }

          const command = await transaction
            .insertInto('access_role_assignment_commands')
            .values({
              tenant_id: trustedScope.tenantId,
              client_request_id: trustedInput.clientRequestId,
              command_type: 'assign',
              assignment_id: assignment.assignment_id,
              user_id: assignment.user_id,
              role_id: assignment.role_id,
              assignment_scope: assignment.assignment_scope,
              branch_id: assignment.branch_id,
              expected_version: null,
              result_status: assignment.status,
              result_version: assignment.version,
              result_assigned_at: assignment.assigned_at,
              result_revoked_at: assignment.revoked_at,
              applied_at: trustedInput.occurredAt,
            })
            .onConflict((conflict) =>
              conflict.columns(['tenant_id', 'client_request_id']).doNothing(),
            )
            .returningAll()
            .executeTakeFirst();

          if (!command) {
            const prior = await transaction
              .selectFrom('access_role_assignment_commands')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('client_request_id', '=', trustedInput.clientRequestId)
              .executeTakeFirstOrThrow();
            return replayAssignCommand(prior, trustedInput);
          }
          return mapCommandResult(command);
        });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }

  async revokeRoleAssignment(
    scope: AccessTenantScope,
    input: RevokeRoleAssignmentInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleAssignmentRecord> {
    const trustedScope = validateTenantScope(scope);
    const trustedInput = validateRevokeInput(input);
    try {
      return await this.executeTransaction(async (transaction, transactionContext) => {
          if (guard && !await guard.confirmCurrent(transactionContext)) {
            throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
          }
          const previousCommand = await transaction
            .selectFrom('access_role_assignment_commands')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('client_request_id', '=', trustedInput.clientRequestId)
            .executeTakeFirst();
          if (previousCommand) {
            return replayRevokeCommand(previousCommand, trustedInput);
          }

          const current = await transaction
            .selectFrom('access_role_assignments')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('assignment_id', '=', trustedInput.assignmentId)
            .executeTakeFirst();
          if (!current) {
            throw new AccessPersistenceError('ACCESS_ASSIGNMENT_NOT_FOUND');
          }
          if (current.status !== 'active') {
            throw new AccessPersistenceError('ACCESS_ASSIGNMENT_REVOKED');
          }
          if (current.version !== trustedInput.expectedVersion) {
            throw new AccessPersistenceError('ACCESS_STALE_WRITE');
          }

          const assignment = await transaction
            .updateTable('access_role_assignments')
            .set({
              status: 'revoked',
              version: current.version + 1,
              revoked_at: trustedInput.occurredAt,
            })
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('assignment_id', '=', trustedInput.assignmentId)
            .where('status', '=', 'active')
            .where('version', '=', trustedInput.expectedVersion)
            .returningAll()
            .executeTakeFirst();

          if (!assignment) {
            const concurrentCommand = await transaction
              .selectFrom('access_role_assignment_commands')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('client_request_id', '=', trustedInput.clientRequestId)
              .executeTakeFirst();
            if (concurrentCommand) {
              return replayRevokeCommand(concurrentCommand, trustedInput);
            }
            throw new AccessPersistenceError('ACCESS_STALE_WRITE');
          }

          const command = await transaction
            .insertInto('access_role_assignment_commands')
            .values({
              tenant_id: trustedScope.tenantId,
              client_request_id: trustedInput.clientRequestId,
              command_type: 'revoke',
              assignment_id: assignment.assignment_id,
              user_id: assignment.user_id,
              role_id: assignment.role_id,
              assignment_scope: assignment.assignment_scope,
              branch_id: assignment.branch_id,
              expected_version: trustedInput.expectedVersion,
              result_status: assignment.status,
              result_version: assignment.version,
              result_assigned_at: assignment.assigned_at,
              result_revoked_at: assignment.revoked_at,
              applied_at: trustedInput.occurredAt,
            })
            .onConflict((conflict) =>
              conflict.columns(['tenant_id', 'client_request_id']).doNothing(),
            )
            .returningAll()
            .executeTakeFirst();

          if (guard?.confirmContinuity && !await guard.confirmContinuity(transactionContext)) {
            throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
          }
          if (!command) {
            const prior = await transaction
              .selectFrom('access_role_assignment_commands')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('client_request_id', '=', trustedInput.clientRequestId)
              .executeTakeFirstOrThrow();
            return replayRevokeCommand(prior, trustedInput);
          }
          return mapCommandResult(command);
        });
    } catch (error: unknown) {
      throw mapAccessError(error);
    }
  }
}

export function createKyselyAccessRepository(
  connection: InternalDatabasePersistenceConnection,
): AccessRepositoryPort {
  let transactionTail = Promise.resolve();
  return new KyselyAccessRepository(
    (operation) => useDatabasePersistenceExecutor(connection, 'access', operation),
    async (operation) => {
      let releaseTurn!: () => void;
      const previousTurn = transactionTail;
      transactionTail = new Promise<void>((resolve) => { releaseTurn = resolve; });
      await previousTurn;
      let operationFailed = false;
      let operationError: unknown;
      try {
        return await runInTransaction(
          connection as unknown as DatabaseConnection,
          { isolationLevel: 'serializable' },
          async (transactionContext) => {
            try {
              return await useTransactionalDatabasePersistenceExecutor(
                transactionContext,
                'access',
                (executor) => operation(executor, transactionContext),
              );
            } catch (error: unknown) {
              operationFailed = true;
              operationError = error;
              throw error;
            }
          },
        );
      } catch (error: unknown) {
        if (operationFailed) throw operationError;
        throw error;
      } finally {
        releaseTurn();
      }
    },
  );
}

export type KyselyAccessRepositoryFactory =
  typeof createKyselyAccessRepository;
