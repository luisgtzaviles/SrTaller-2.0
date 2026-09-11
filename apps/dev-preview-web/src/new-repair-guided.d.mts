import type { NewRepairValidationSection } from './new-repair-validation.mjs';

export type GuidedNewRepairStepId = NewRepairValidationSection | 'review';

export interface GuidedNewRepairStep {
  readonly id: GuidedNewRepairStepId;
  readonly title: string;
  readonly description: string;
}

export declare function resolveGuidedNewRepairSteps(
  fieldStates?: Readonly<Record<string, string>>,
): readonly GuidedNewRepairStep[];

export declare function guidedAccessSummary(type: string, credentialReady: boolean): string;
export declare function formatGuidedLocalDateTime(value: string): string;
export declare function formatGuidedMoney(value: string): string;
