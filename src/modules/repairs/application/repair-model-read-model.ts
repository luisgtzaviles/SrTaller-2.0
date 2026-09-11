export interface RepairModelReadModel {
  readonly rawLabel: string | null;
  readonly canonicalId: string | null;
  readonly canonicalLabel: string | null;
  readonly canonicalBrandId: string | null;
  readonly effectiveLabel: string | null;
}

export function resolveRepairModelReadModel(
  rawLabel: string | null,
  canonicalId: string | null,
  canonicalLabel: string | null,
  modelBrandId: string | null,
  repairBrandId: string | null,
): RepairModelReadModel {
  if (canonicalId !== null && (canonicalLabel === null || modelBrandId === null)) {
    throw new Error('Canonical repair model link is incomplete.');
  }
  if (canonicalId !== null && modelBrandId !== repairBrandId) {
    throw new Error('Canonical repair model conflicts with the canonical repair brand.');
  }
  return Object.freeze({
    rawLabel,
    canonicalId,
    canonicalLabel,
    canonicalBrandId: modelBrandId,
    effectiveLabel: canonicalId === null ? rawLabel : canonicalLabel,
  });
}
