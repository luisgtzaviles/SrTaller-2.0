export type BranchStatus = 'ACTIVE' | 'INACTIVE';

export type BranchDisplayName = string & { readonly __branchDisplayName: true };

export function parseBranchDisplayName(value: unknown): BranchDisplayName {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    value.length < 1 ||
    value.length > 160
  ) {
    throw new TypeError('Branch display name must be trimmed and contain 1 to 160 characters.');
  }
  return value as BranchDisplayName;
}

export function branchStatus(active: boolean): BranchStatus {
  return active ? 'ACTIVE' : 'INACTIVE';
}
