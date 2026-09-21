import { timingSafeEqual } from 'node:crypto';

import {
  assertLocalAdminProvisioningContext,
  databaseEnvironment,
  ensureLocalEnvironment,
  LOCAL_BACKEND_HOST,
} from './lib/local-development.mjs';

const [tenantId, userId, email, ...unexpected] = process.argv.slice(2);
if (!tenantId || !userId || !email || unexpected.length !== 0) {
  throw new Error('Usage: local:admin:provision <tenant-id> <user-id> <verified-email>');
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('LOCAL_ADMIN_PASSWORD_TTY_REQUIRED');
  }
  process.stderr.write(prompt);
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stderr.write('\n');
      if (error) reject(error); else resolve(value);
    };
    const onData = (chunk) => {
      const text = chunk.toString('utf8');
      for (const character of text) {
        if (character === '\u0003') return finish(new Error('LOCAL_ADMIN_PROVISION_CANCELLED'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else value += character;
      }
    };
    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

const values = await ensureLocalEnvironment({ create: false });
const database = databaseEnvironment(values, 'application');
assertLocalAdminProvisioningContext(values, {
  NODE_ENV: 'development',
  SR_LOCAL_RUNTIME: 'true',
  SR_DB_ENVIRONMENT: database.SR_DB_ENVIRONMENT,
  HOST: LOCAL_BACKEND_HOST,
});

const password = await readHidden('Administrative password: ');
const confirmation = await readHidden('Confirm administrative password: ');
const passwordBytes = Buffer.from(password, 'utf8');
const confirmationBytes = Buffer.from(confirmation, 'utf8');
if (passwordBytes.length !== confirmationBytes.length || !timingSafeEqual(passwordBytes, confirmationBytes)) {
  throw new Error('LOCAL_ADMIN_PASSWORD_CONFIRMATION_MISMATCH');
}

const [{ parseDatabaseConfig }, { createDatabaseConnection }, { KyselyAdminAuthRepository }, { KyselyAuthenticationUserReader }, { NodeArgon2AdminPasswordHasher }, { ProvisionAdminIdentityUseCase }] = await Promise.all([
  import('../dist/infrastructure/database/database-config.js'),
  import('../dist/infrastructure/database/database-connection.js'),
  import('../dist/modules/access/infrastructure/persistence/kysely-admin-auth.repository.js'),
  import('../dist/modules/users/infrastructure/persistence/kysely-authentication-user.reader.js'),
  import('../dist/modules/access/infrastructure/security/node-argon2-admin-password-hasher.js'),
  import('../dist/modules/access/application/use-cases/admin-session.use-cases.js'),
]);

const connection = createDatabaseConnection(parseDatabaseConfig(database));
try {
  await connection.verify();
  const useCase = new ProvisionAdminIdentityUseCase(
    new KyselyAdminAuthRepository(connection),
    new KyselyAuthenticationUserReader(connection),
    new NodeArgon2AdminPasswordHasher(values.SR_ADMIN_PASSWORD_PEPPER),
  );
  const result = await useCase.execute({ tenantId, userId, email, password });
  process.stdout.write(`${JSON.stringify({
    event: 'local_admin_identity_provisioned',
    tenantId: result.tenantId,
    userId: result.userId,
    adminIdentityId: result.adminIdentityId,
  })}\n`);
} catch {
  throw new Error('LOCAL_ADMIN_IDENTITY_PROVISIONING_FAILED');
} finally {
  passwordBytes.fill(0);
  confirmationBytes.fill(0);
  await connection.close();
}
