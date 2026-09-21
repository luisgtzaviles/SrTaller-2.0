import {
  databasePersistenceCapability,
} from '../database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceConnection,
  InternalDatabasePersistenceOperation,
  InternalDatabasePersistenceOwner,
} from '../database/database-persistence-capability.js';
import {
  databaseTransactionCapability,
} from '../database/database-transaction-capability.js';
import type {
  InternalDatabaseTransactionConnection,
  InternalDatabaseTransactionOperation,
  InternalDatabaseTransactionSettings,
} from '../database/database-transaction-capability.js';

export const APPLICATION_DATABASE_CONNECTION = Symbol(
  'srtaller.runtime.application-database-connection',
);

export const ACCESS_PIN_HASHER_FACTORY = Symbol(
  'srtaller.runtime.access-pin-hasher-factory',
);

export const LOCAL_RUNTIME_CONFIGURATION = Symbol(
  'srtaller.runtime.local-configuration',
);

export const SESSION_TRANSPORT_POLICY = Symbol(
  'srtaller.runtime.session-transport-policy',
);

export const REGISTRATION_RUNTIME_CONFIGURATION = Symbol(
  'srtaller.runtime.registration-configuration',
);

export interface RegistrationRuntimeConfiguration {
  readonly enabled: boolean;
  readonly mode: 'local' | 'resend';
  readonly sender: 'SR Taller <no-reply@srtaller.com>';
  readonly publicBaseUrl: string;
  readonly legalDocuments: readonly Readonly<{
    key: 'terms' | 'privacy';
    version: string;
    url: string;
  }>[];
  principalDigest(value: string): Uint8Array;
  createResendAdapter<Adapter>(constructor: new (apiKey: string, sender: string) => Adapter): Adapter;
}

/**
 * One lifecycle-owned application database capability. Product modules receive
 * this interface; pool creation, initialization and shutdown stay technical.
 */
export interface ApplicationDatabaseConnection
  extends
    InternalDatabasePersistenceConnection,
    InternalDatabaseTransactionConnection {
  readonly state: string;
  checkReady(): Promise<boolean>;
  [databasePersistenceCapability]<
    Owner extends InternalDatabasePersistenceOwner,
    Result,
  >(
    owner: Owner,
    operation: InternalDatabasePersistenceOperation<Owner, Result>,
  ): Promise<Result>;
  [databaseTransactionCapability]<Result>(
    settings: InternalDatabaseTransactionSettings,
    operation: InternalDatabaseTransactionOperation<Result>,
  ): Promise<Result>;
}

/** Creates an Access-owned adapter without exporting the configured pepper. */
export interface AccessPinHasherFactory {
  create<Hasher>(adapter: new (pepper: string) => Hasher): Hasher;
  createAdminPasswordHasher<Hasher>(adapter: new (pepper: string) => Hasher): Hasher;
}

/**
 * Framework-neutral, local-only Station bootstrap configuration capability.
 */
export interface LocalRuntimeConfiguration {
  readonly enabled: boolean;
  readonly host: '127.0.0.1';
  createLocalStationBootstrapCredential(
    createCredential: (
      environment: Readonly<Record<string, string | undefined>>,
    ) => string,
  ): string;
}

/** Server-owned browser transport decisions; no environment values escape. */
export interface SessionTransportPolicy {
  isExplicitLocalRequest(input: Readonly<{
    host?: string | undefined;
  }>): boolean;
  requiresSecureCookies(input: Readonly<{
    host?: string | undefined;
  }>): boolean;
}
