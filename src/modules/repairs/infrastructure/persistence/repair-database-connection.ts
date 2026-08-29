import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import {
  createDatabaseConnection,
} from '../../../../infrastructure/database/database-connection.js';
import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import {
  databasePersistenceCapability,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceOperation,
  InternalDatabasePersistenceOwner,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import { parseDatabaseConfig } from '../../../../infrastructure/database/database-config.js';

type RepairDatabaseConnectionCapability = DatabaseConnection & {
  [databasePersistenceCapability]: <
    Owner extends InternalDatabasePersistenceOwner,
    Result,
  >(
    owner: Owner,
    operation: InternalDatabasePersistenceOperation<Owner, Result>,
  ) => Promise<Result>;
};

@Injectable()
export class RepairDatabaseConnection implements OnModuleInit, OnModuleDestroy {
  #connection: RepairDatabaseConnectionCapability | null = null;

  readonly connection: RepairDatabaseConnectionCapability;

  constructor() {
    const owner = this;
    this.connection = {
      get state(): DatabaseConnection['state'] {
        return owner.#connection?.state ?? 'failed';
      },
      verify: async (): Promise<void> => {
        if (!owner.#connection) {
          throw new Error('Repair database connection is unavailable outside local development.');
        }
        await owner.#connection.verify();
      },
      close: async (): Promise<void> => {
        await owner.#connection?.close();
      },
      [databasePersistenceCapability]: async <
        Owner extends InternalDatabasePersistenceOwner,
        Result,
      >(
        scope: Owner,
        operation: InternalDatabasePersistenceOperation<Owner, Result>,
      ): Promise<Result> => {
        if (!owner.#connection) {
          throw new Error('Repair database connection is unavailable outside local development.');
        }
        return owner.#connection[databasePersistenceCapability](scope, operation);
      },
    };
  }

  async onModuleInit(): Promise<void> {
    if (
      process.env.NODE_ENV !== 'development' ||
      process.env.SR_DB_ENVIRONMENT !== 'development'
    ) {
      return;
    }
    this.#connection = createDatabaseConnection(
      parseDatabaseConfig(process.env),
    ) as RepairDatabaseConnectionCapability;
    await this.connection.verify();
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection.close();
  }
}
