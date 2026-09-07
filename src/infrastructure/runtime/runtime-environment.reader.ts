import { Injectable } from '@nestjs/common';

import { loadRequiredServerSecrets } from '../config/external-configuration.js';

const forbiddenDatabaseVariables = new Set([
  'DATABASE_URL',
  'PGDATABASE',
  'PGHOST',
  'PGPASSWORD',
  'PGPORT',
  'PGSERVICE',
  'PGSSLMODE',
  'PGUSER',
  'SR_DATABASE_URL',
  'SR_DB_URL',
  'SR_TEST_DATABASE_URL',
  'SR_TEST_DB_URL',
]);

type LocalRuntimePolicy = Readonly<{
  enabled: boolean;
  host: '127.0.0.1';
}>;

/**
 * The only injectable environment reader. It converts ambient input into
 * narrow capabilities; it is deliberately not exported by the runtime index.
 */
@Injectable()
export class RuntimeEnvironmentReader {
  readonly #environment: Readonly<Record<string, string | undefined>>;

  constructor() {
    this.#environment = process.env;
  }

  applicationDatabaseConfigured(): boolean {
    return (
      this.#environment.SR_DB_ROLE === 'application' &&
      this.#environment.SR_DB_MIGRATIONS_ENABLED === 'false'
    );
  }

  applicationDatabaseEnvironment(): Readonly<
    Record<string, string | undefined>
  > {
    return Object.freeze(Object.fromEntries(
      Object.entries(this.#environment).filter(([name]) =>
        name.startsWith('SR_DB_') ||
        name.startsWith('SR_TEST_DB_') ||
        forbiddenDatabaseVariables.has(name),
      ),
    ));
  }

  createAccessPinHasher<Hasher>(
    adapter: new (pepper: string) => Hasher,
  ): Hasher {
    const secrets = loadRequiredServerSecrets(
      this.#environment,
      ['SR_PIN_PEPPER'],
    );
    return new adapter(secrets.get('SR_PIN_PEPPER'));
  }

  localRuntimePolicy(): LocalRuntimePolicy {
    return Object.freeze({
      enabled:
        this.#environment.SR_LOCAL_RUNTIME === 'true' &&
        this.#environment.NODE_ENV === 'development' &&
        this.#environment.SR_DB_ENVIRONMENT === 'development' &&
        this.#environment.HOST === '127.0.0.1',
      host: '127.0.0.1',
    });
  }

  createLocalStationBootstrapCredential(
    createCredential: (
      environment: Readonly<Record<string, string | undefined>>,
    ) => string,
  ): string {
    const secrets = loadRequiredServerSecrets(
      this.#environment,
      ['SR_STATION_BOOTSTRAP_SECRET'],
    );
    return createCredential(Object.freeze({
      NODE_ENV: this.#environment.NODE_ENV,
      SR_DB_ENVIRONMENT: this.#environment.SR_DB_ENVIRONMENT,
      SR_STATION_BOOTSTRAP_SECRET: secrets.get(
        'SR_STATION_BOOTSTRAP_SECRET',
      ),
    }));
  }

  createLocalPinOnlyBindings<Bindings>(
    createBindings: (
      environment: Readonly<Record<string, string | undefined>>,
    ) => Bindings,
  ): Bindings {
    if (!this.localRuntimePolicy().enabled) {
      throw new Error('Local PIN-only login is unavailable outside development.');
    }
    const secrets = loadRequiredServerSecrets(
      this.#environment,
      ['SR_LOCAL_PIN_JORGE', 'SR_LOCAL_PIN_MARIA', 'SR_LOCAL_PIN_CARLOS'],
    );
    return createBindings(Object.freeze({
      NODE_ENV: this.#environment.NODE_ENV,
      SR_DB_ENVIRONMENT: this.#environment.SR_DB_ENVIRONMENT,
      SR_LOCAL_PIN_JORGE: secrets.get('SR_LOCAL_PIN_JORGE'),
      SR_LOCAL_PIN_MARIA: secrets.get('SR_LOCAL_PIN_MARIA'),
      SR_LOCAL_PIN_CARLOS: secrets.get('SR_LOCAL_PIN_CARLOS'),
      SR_LOCAL_PIN_LUIS: this.#environment.SR_LOCAL_PIN_LUIS,
      SR_LOCAL_USER_LUIS_ID: this.#environment.SR_LOCAL_USER_LUIS_ID,
    }));
  }
}
