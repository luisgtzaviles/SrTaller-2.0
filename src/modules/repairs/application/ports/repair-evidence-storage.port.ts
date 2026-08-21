export interface RepairEvidenceStoragePort {
  read(storageKey: string): Promise<Uint8Array | null>;
}
