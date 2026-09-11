export type NewRepairValidationSection = 'customer' | 'equipment' | 'reception' | 'access' | 'commitment';

export interface NewRepairValidationIssue {
  readonly fieldKey: string;
  readonly section: NewRepairValidationSection;
  readonly message: string;
  readonly focusTarget: string;
}

export interface NewRepairValidationInput {
  readonly fieldStates: Readonly<Record<string, string>>;
  readonly selectedCustomer: boolean;
  readonly identifierUnavailable: boolean;
  readonly reportedProblemCount: number;
  readonly acceptedRiskCount: number;
  readonly patternValid: boolean;
  readonly riskSelectionMessage?: string;
  readonly values: Readonly<{
    customerGivenName: string;
    customerFamilyName: string;
    customerPhone: string;
    deviceType: string;
    deviceBrand: string;
    deviceModel: string;
    deviceIdentifier: string;
    deviceColor: string;
    physicalConditionSummary: string;
    simIncluded: boolean | null;
    memoryCardIncluded: boolean | null;
    receivedPowerState: string;
    customerNarrative: string;
    warrantyReviewRequested: boolean | null;
    differentDeliverer: boolean | null;
    deliveredByName: string;
    requiresRiskAcceptance: boolean | null;
    deviceAccessType: string;
    deviceAccessSecret: string;
    estimatedDeliveryLocal: string;
    initialBudgetAmount: string;
  }>;
}

export function collectNewRepairValidationIssues(input: NewRepairValidationInput): readonly NewRepairValidationIssue[];
