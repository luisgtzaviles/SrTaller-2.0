import { timingSafeEqual } from 'node:crypto';

import {
  databaseEnvironment,
  ensureLocalEnvironment,
} from './lib/local-development.mjs';

const [tenantId, displayName, clientRequestId, operationalIdentifier = ''] =
  process.argv.slice(2);

if (!tenantId || !displayName || !clientRequestId) {
  throw new Error(
    'Usage: provision-first-user <tenant-id> <display-name> <client-request-id> [operational-identifier]',
  );
}

const values = await ensureLocalEnvironment({ create: false });
const expected = Buffer.from(values.SR_USER_BOOTSTRAP_SECRET, 'utf8');
const actual = Buffer.from(process.env.SR_USER_BOOTSTRAP_SECRET ?? '', 'utf8');
if (
  expected.length !== actual.length ||
  !timingSafeEqual(expected, actual)
) {
  throw new Error('First-user provisioning authority rejected.');
}

const { parseDatabaseConfig } = await import(
  '../dist/infrastructure/database/database-config.js'
);
const { createDatabaseConnection } = await import(
  '../dist/infrastructure/database/database-connection.js'
);
const { createKyselyUserRepository } = await import(
  '../dist/modules/users/infrastructure/persistence/kysely-user.repository.js'
);
const { ProvisionFirstUserUseCase } = await import(
  '../dist/modules/users/application/use-cases/provision-first-user.use-case.js'
);
const { UserInputError } = await import(
  '../dist/modules/users/application/user-input.js'
);
const { UserPersistenceError } = await import(
  '../dist/modules/users/application/ports/user-repository.port.js'
);

const environment = databaseEnvironment(values, 'application');
const connection = createDatabaseConnection(parseDatabaseConfig(environment));
try {
  await connection.verify();
  const useCase = new ProvisionFirstUserUseCase(
    createKyselyUserRepository(connection),
  );
  const result = await useCase.execute(
    { tenantId },
    {
      displayName,
      operationalIdentifier: operationalIdentifier.trim() || null,
      clientRequestId,
    },
  );
  process.stdout.write(
    `${JSON.stringify({
      event: 'first_user_provisioned',
      tenantId: result.tenantId,
      userId: result.userId,
    })}\n`,
  );
} catch (error) {
  if (error instanceof UserInputError) {
    throw new Error(`FIRST_USER_PROVISIONING_INPUT_${error.parameter}`);
  }
  if (error instanceof UserPersistenceError) {
    throw new Error(error.code);
  }
  throw new Error('FIRST_USER_PROVISIONING_FAILED');
} finally {
  await connection.close();
}
