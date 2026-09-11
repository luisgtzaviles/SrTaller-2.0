export interface RepairDeviceTypeReadModel {
  readonly rawLabel: string | null;
  readonly canonicalId: string | null;
  readonly canonicalLabel: string | null;
  readonly effectiveLabel: string | null;
}

export function resolveRepairDeviceTypeReadModel(rawLabel: string | null, canonicalId: string | null, canonicalLabel: string | null): RepairDeviceTypeReadModel {
  if (canonicalId !== null && canonicalLabel === null) throw new Error('Canonical repair DeviceType link has no current label.');
  return Object.freeze({ rawLabel, canonicalId, canonicalLabel, effectiveLabel: canonicalId === null ? rawLabel : canonicalLabel });
}
