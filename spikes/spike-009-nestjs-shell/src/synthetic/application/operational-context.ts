export const WRITE_SYNTHETIC_RECORD = 'synthetic:write';

export interface OperationalContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly capabilities: readonly string[];
  readonly serverCorrelationId: string;
}

export function createOperationalContext(input: OperationalContext): OperationalContext {
  return Object.freeze({
    ...input,
    capabilities: Object.freeze([...input.capabilities]),
  });
}
