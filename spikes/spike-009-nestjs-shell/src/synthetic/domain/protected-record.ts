import { DomainValidationError } from './errors.js';

export class SyntheticValue {
  private constructor(readonly value: string) {}

  static create(candidate: string): SyntheticValue {
    const value = candidate.trim();
    if (value.length < 3 || value.length > 80) {
      throw new DomainValidationError('Synthetic value must contain between 3 and 80 characters.');
    }
    return new SyntheticValue(value);
  }
}

export class ProtectedRecord {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly branchId: string,
    private currentValue: SyntheticValue,
    private currentVersion: number,
  ) {}

  static rehydrate(input: {
    id: string;
    tenantId: string;
    branchId: string;
    value: string;
    version: number;
  }): ProtectedRecord {
    if (input.version < 1) throw new DomainValidationError('Synthetic record version must be positive.');
    return new ProtectedRecord(
      input.id,
      input.tenantId,
      input.branchId,
      SyntheticValue.create(input.value),
      input.version,
    );
  }

  update(nextValue: string): void {
    const value = SyntheticValue.create(nextValue);
    if (value.value === this.currentValue.value) {
      throw new DomainValidationError('Synthetic value must change.');
    }
    this.currentValue = value;
    this.currentVersion += 1;
  }

  get value(): string {
    return this.currentValue.value;
  }

  get version(): number {
    return this.currentVersion;
  }
}
