import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { loadRequiredServerSecrets } from '../config/external-configuration.js';
import type { RegistrationRuntimeConfiguration } from './index.js';

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

  createAccessAdminPasswordHasher<Hasher>(
    adapter: new (pepper: string) => Hasher,
  ): Hasher {
    const secrets = loadRequiredServerSecrets(
      this.#environment,
      ['SR_ADMIN_PASSWORD_PEPPER'],
    );
    return new adapter(secrets.get('SR_ADMIN_PASSWORD_PEPPER'));
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

  registrationConfiguration(): RegistrationRuntimeConfiguration {
    const local = this.localRuntimePolicy().enabled;
    if (!local && !this.applicationDatabaseConfigured()) {
      return Object.freeze({
        enabled: false,
        mode: 'local' as const,
        sender: 'SR Taller <no-reply@srtaller.com>' as const,
        publicBaseUrl: '',
        legalDocuments: Object.freeze([]),
        principalDigest: (value: string) => createHmac('sha256', 'disabled-test-runtime')
          .update(value, 'utf8').digest(),
        createResendAdapter: <Adapter>(_constructor: new (apiKey: string, sender: string) => Adapter): Adapter => {
          throw new Error('Registration runtime is disabled.');
        },
      });
    }
    const secrets = loadRequiredServerSecrets(
      this.#environment,
      local
        ? ['SR_REGISTRATION_ABUSE_PEPPER']
        : ['SR_REGISTRATION_ABUSE_PEPPER', 'SR_RESEND_API_KEY'],
    );
    const approved = local || this.#environment.SR_REGISTRATION_LEGAL_APPROVED === 'true';
    const documents = local
      ? [
        { key: 'terms' as const, version: 'local-v1', url: '/legal/terms/local-v1' },
        { key: 'privacy' as const, version: 'local-v1', url: '/legal/privacy/local-v1' },
      ]
      : [
        { key: 'terms' as const, version: this.#environment.SR_REGISTRATION_TERMS_VERSION ?? '', url: this.#environment.SR_REGISTRATION_TERMS_URL ?? '' },
        { key: 'privacy' as const, version: this.#environment.SR_REGISTRATION_PRIVACY_VERSION ?? '', url: this.#environment.SR_REGISTRATION_PRIVACY_URL ?? '' },
      ];
    const baseUrl = local
      ? 'http://127.0.0.1:4173'
      : this.#environment.SR_REGISTRATION_PUBLIC_BASE_URL ?? '';
    const configured = approved && /^https:\/\//u.test(baseUrl) && documents.every((document) =>
      /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(document.version) && /^https:\/\//u.test(document.url));
    const enabled = local || configured;
    const abusePepper = secrets.get('SR_REGISTRATION_ABUSE_PEPPER');
    return Object.freeze({
      enabled,
      mode: local ? 'local' as const : 'resend' as const,
      sender: 'SR Taller <no-reply@srtaller.com>' as const,
      publicBaseUrl: baseUrl,
      legalDocuments: Object.freeze(documents.map((document) => Object.freeze(document))),
      principalDigest: (value: string) => createHmac('sha256', Buffer.from(abusePepper, 'base64url'))
        .update('srtaller-registration-abuse\0v1\0').update(value, 'utf8').digest(),
      createResendAdapter: <Adapter>(constructor: new (apiKey: string, sender: string) => Adapter): Adapter => {
        if (local) throw new Error('Resend adapter is unavailable in local runtime.');
        return new constructor(secrets.get('SR_RESEND_API_KEY'), 'SR Taller <no-reply@srtaller.com>');
      },
    });
  }

}
