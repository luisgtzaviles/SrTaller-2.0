import { inspect } from 'node:util';

export type SecretConfigurationName =
  | 'SR_DB_PASSWORD'
  | 'SR_TEST_DB_PASSWORD'
  | 'SR_PIN_PEPPER'
  | 'SR_SESSION_SIGNING_KEY'
  | 'SR_STATION_BOOTSTRAP_SECRET'
  | 'SR_USER_BOOTSTRAP_SECRET';

export type ExternalConfigurationName =
  | SecretConfigurationName
  | 'HOST'
  | 'NODE_ENV'
  | 'PORT'
  | 'SR_DB_ENVIRONMENT'
  | 'SR_LOCAL_RUNTIME'
  | 'SR_RUNTIME_GIT_SHA'
  | 'SR_RUNTIME_SOURCE_STATE';

type ConfigurationStatus = 'active' | 'reserved';

export type ExternalConfigurationClassification = 'non-secret' | 'secret';

export interface ExternalConfigurationDefinition {
  readonly name: ExternalConfigurationName;
  readonly classification: ExternalConfigurationClassification;
  readonly consumer:
    | 'technical-shell'
    | 'access'
    | 'database'
    | 'future-access'
    | 'stations-bootstrap'
    | 'users-bootstrap';
  readonly status: ConfigurationStatus;
  readonly source: 'process-environment';
  readonly clientExposure: 'forbidden' | 'bounded-public';
}

export const externalConfigurationCatalog = Object.freeze([
  Object.freeze({
    name: 'HOST',
    classification: 'non-secret' as const,
    consumer: 'technical-shell' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'NODE_ENV',
    classification: 'non-secret' as const,
    consumer: 'technical-shell' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'PORT',
    classification: 'non-secret' as const,
    consumer: 'technical-shell' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_DB_ENVIRONMENT',
    classification: 'non-secret' as const,
    consumer: 'database' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_LOCAL_RUNTIME',
    classification: 'non-secret' as const,
    consumer: 'stations-bootstrap' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_RUNTIME_GIT_SHA',
    classification: 'non-secret' as const,
    consumer: 'technical-shell' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'bounded-public' as const,
  }),
  Object.freeze({
    name: 'SR_RUNTIME_SOURCE_STATE',
    classification: 'non-secret' as const,
    consumer: 'technical-shell' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'bounded-public' as const,
  }),
  Object.freeze({
    name: 'SR_DB_PASSWORD',
    classification: 'secret' as const,
    consumer: 'database' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_TEST_DB_PASSWORD',
    classification: 'secret' as const,
    consumer: 'database' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_PIN_PEPPER',
    classification: 'secret' as const,
    consumer: 'access' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_SESSION_SIGNING_KEY',
    classification: 'secret' as const,
    consumer: 'future-access' as const,
    status: 'reserved' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_STATION_BOOTSTRAP_SECRET',
    classification: 'secret' as const,
    consumer: 'stations-bootstrap' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
  Object.freeze({
    name: 'SR_USER_BOOTSTRAP_SECRET',
    classification: 'secret' as const,
    consumer: 'users-bootstrap' as const,
    status: 'active' as const,
    source: 'process-environment' as const,
    clientExposure: 'forbidden' as const,
  }),
] satisfies readonly ExternalConfigurationDefinition[]);

type ExternalConfigurationErrorCode =
  | 'EXTERNAL_CONFIGURATION_REQUIRED'
  | 'EXTERNAL_CONFIGURATION_EMPTY'
  | 'EXTERNAL_CONFIGURATION_INVALID_SECRET'
  | 'EXTERNAL_CONFIGURATION_DUPLICATE_REQUIREMENT';

export class ExternalConfigurationError extends Error {
  readonly category = 'Configuration';

  constructor(
    readonly code: ExternalConfigurationErrorCode,
    readonly variable: SecretConfigurationName,
    readonly reason: string,
  ) {
    super(`${code}: ${variable}: ${reason}`);
    this.name = 'ExternalConfigurationError';
  }

  toJSON(): Readonly<{
    name: 'ExternalConfigurationError';
    category: 'Configuration';
    code: ExternalConfigurationErrorCode;
    variable: SecretConfigurationName;
    reason: string;
    message: string;
  }> {
    return Object.freeze({
      name: 'ExternalConfigurationError' as const,
      category: this.category,
      code: this.code,
      variable: this.variable,
      reason: this.reason,
      message: this.message,
    });
  }

  [inspect.custom](): ReturnType<ExternalConfigurationError['toJSON']> {
    return this.toJSON();
  }
}

function fail(
  code: ExternalConfigurationErrorCode,
  variable: SecretConfigurationName,
  reason: string,
): never {
  throw new ExternalConfigurationError(code, variable, reason);
}

function requireSecret(
  input: Readonly<Record<string, string | undefined>>,
  variable: SecretConfigurationName,
): string {
  const value = input[variable];
  if (value === undefined) {
    return fail(
      'EXTERNAL_CONFIGURATION_REQUIRED',
      variable,
      'required server-only configuration is missing',
    );
  }
  if (value.length === 0 || /^\s+$/u.test(value)) {
    return fail(
      'EXTERNAL_CONFIGURATION_EMPTY',
      variable,
      'required server-only configuration must not be empty',
    );
  }
  if (value.length > 4_096 || value !== value.trim()) {
    return fail(
      'EXTERNAL_CONFIGURATION_INVALID_SECRET',
      variable,
      'secret does not satisfy the governed runtime format',
    );
  }
  return value;
}

/**
 * Holds secret values only in ECMAScript private fields. Consumers must request
 * an explicit catalogued name; diagnostics expose metadata, never values.
 */
export class RequiredServerSecrets {
  readonly #values: ReadonlyMap<SecretConfigurationName, string>;

  constructor(values: ReadonlyMap<SecretConfigurationName, string>) {
    this.#values = values;
  }

  get(name: SecretConfigurationName): string {
    const value = this.#values.get(name);
    if (value === undefined) {
      return fail(
        'EXTERNAL_CONFIGURATION_REQUIRED',
        name,
        'secret was not declared as required by this runtime consumer',
      );
    }
    return value;
  }

  toJSON(): Readonly<{
    classification: 'secret';
    configured: readonly SecretConfigurationName[];
    values: '[REDACTED]';
  }> {
    return Object.freeze({
      classification: 'secret',
      configured: Object.freeze([...this.#values.keys()]),
      values: '[REDACTED]',
    });
  }

  [inspect.custom](): ReturnType<RequiredServerSecrets['toJSON']> {
    return this.toJSON();
  }
}

export function loadRequiredServerSecrets(
  input: Readonly<Record<string, string | undefined>>,
  required: readonly SecretConfigurationName[],
): RequiredServerSecrets {
  const values = new Map<SecretConfigurationName, string>();
  for (const variable of required) {
    if (values.has(variable)) {
      fail(
        'EXTERNAL_CONFIGURATION_DUPLICATE_REQUIREMENT',
        variable,
        'a secret may be required only once by a runtime consumer',
      );
    }
    values.set(variable, requireSecret(input, variable));
  }
  return new RequiredServerSecrets(values);
}
