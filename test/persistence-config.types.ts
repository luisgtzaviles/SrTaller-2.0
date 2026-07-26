import type { DatabaseConfig } from '../src/infrastructure/database/database-config.js';

declare const config: Readonly<DatabaseConfig>;

// @ts-expect-error DatabaseConfig is immutable at the top level.
config.identity = config.identity;
// @ts-expect-error Connection identity is immutable.
config.identity.host = 'mutated';
// @ts-expect-error Pool settings are immutable.
config.pool.max = 99;
// @ts-expect-error Runtime selection is immutable.
config.runtime.role = 'migration';
// @ts-expect-error Observability labels are immutable.
config.observability.labels.component = 'mutated';

export {};
