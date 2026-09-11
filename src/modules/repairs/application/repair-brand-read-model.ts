export interface RepairBrandReadModel {
  readonly rawLabel: string | null;
  readonly canonicalId: string | null;
  readonly canonicalLabel: string | null;
  readonly effectiveLabel: string | null;
}

export function resolveRepairBrandReadModel(
  rawLabel: string | null,
  canonicalId: string | null,
  canonicalLabel: string | null,
): RepairBrandReadModel {
  if (canonicalId !== null && canonicalLabel === null) {
    throw new Error('Canonical repair brand link has no current label.');
  }

  return Object.freeze({
    rawLabel,
    canonicalId,
    canonicalLabel,
    effectiveLabel: canonicalId === null ? rawLabel : canonicalLabel,
  });
}
