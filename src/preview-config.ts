import type { BranchId, TenantId } from './modules/tenancy/index.js';
import { parseBranchId, parseTenantId } from './modules/tenancy/index.js';
import type { StationId } from './modules/stations/index.js';
import { parseStationId } from './modules/stations/index.js';

interface PreviewDisabledConfig {
  readonly enabled: false;
}

export interface PreviewEnabledConfig {
  readonly enabled: true;
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly stationId: StationId;
  readonly stationEvidence: string;
  readonly tenantName: string;
  readonly branchName: string;
  readonly stationLabel: string;
  readonly actorLabel: string;
  readonly publicBaseUrl: URL | null;
}

export type PreviewConfig = PreviewDisabledConfig | PreviewEnabledConfig;

export class PreviewConfigError extends Error {
  readonly category = 'Configuration';

  constructor(readonly variable: string, reason: string) {
    super(`Preview configuration rejected ${variable}: ${reason}`);
    this.name = 'PreviewConfigError';
  }
}

function required(
  environment: NodeJS.ProcessEnv,
  variable: string,
  maximumLength: number,
): string {
  const value = environment[variable];
  if (value === undefined || value.length === 0) {
    throw new PreviewConfigError(variable, 'required value is missing');
  }
  if (value !== value.trim() || value.length > maximumLength) {
    throw new PreviewConfigError(variable, 'value does not satisfy the governed format');
  }
  return value;
}

function identifier<Value>(
  environment: NodeJS.ProcessEnv,
  variable: string,
  parser: (value: unknown) => Value,
): Value {
  try {
    return parser(required(environment, variable, 36));
  } catch {
    throw new PreviewConfigError(variable, 'value must be a canonical UUID');
  }
}

function optionalUrl(
  environment: NodeJS.ProcessEnv,
): URL | null {
  const value = environment.SR_PREVIEW_PUBLIC_BASE_URL;
  if (value === undefined) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') {
      throw new TypeError('invalid preview URL');
    }
    return url;
  } catch {
    throw new PreviewConfigError(
      'SR_PREVIEW_PUBLIC_BASE_URL',
      'value must be an origin-only HTTPS URL',
    );
  }
}

export function loadPreviewConfig(
  environment: NodeJS.ProcessEnv,
): PreviewConfig {
  const enabled = environment.SR_PREVIEW_ENABLED;
  if (enabled === undefined || enabled === 'false') {
    return Object.freeze({ enabled: false });
  }
  if (enabled !== 'true') {
    throw new PreviewConfigError(
      'SR_PREVIEW_ENABLED',
      'value must be exactly true or false',
    );
  }

  return Object.freeze({
    enabled: true,
    tenantId: identifier(environment, 'SR_PREVIEW_TENANT_ID', parseTenantId),
    branchId: identifier(environment, 'SR_PREVIEW_BRANCH_ID', parseBranchId),
    stationId: identifier(environment, 'SR_PREVIEW_STATION_ID', parseStationId),
    stationEvidence: required(environment, 'SR_PREVIEW_STATION_EVIDENCE', 256),
    tenantName: required(environment, 'SR_PREVIEW_TENANT_NAME', 120),
    branchName: required(environment, 'SR_PREVIEW_BRANCH_NAME', 120),
    stationLabel: required(environment, 'SR_PREVIEW_STATION_LABEL', 120),
    actorLabel: required(environment, 'SR_PREVIEW_ACTOR_LABEL', 120),
    publicBaseUrl: optionalUrl(environment),
  });
}
