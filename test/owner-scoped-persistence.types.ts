import type { TenantId } from '../src/modules/tenancy/index.js';
import type { BranchId } from '../src/modules/stations/application/ports/branch-repository.port.js';

declare const tenantId: TenantId;
declare const branchId: BranchId;

const tenantIdentity: TenantId = tenantId;
const branchIdentity: BranchId = branchId;

// @ts-expect-error BranchId must never be assignable to TenantId.
const invalidTenantIdentity: TenantId = branchId;
// @ts-expect-error TenantId must never be assignable to BranchId.
const invalidBranchIdentity: BranchId = tenantId;

void tenantIdentity;
void branchIdentity;
void invalidTenantIdentity;
void invalidBranchIdentity;
