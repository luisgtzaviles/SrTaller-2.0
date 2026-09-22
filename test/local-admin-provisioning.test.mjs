import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertLocalAdminProvisioningContext } from '../scripts/lib/local-development.mjs';

const values = Object.freeze({
  SR_LOCAL_ENVIRONMENT: 'local', SR_LOCAL_DB_HOST: '127.0.0.1', SR_LOCAL_DB_PORT: '55432',
  SR_LOCAL_DB_NAME: 'srtaller_local', SR_LOCAL_ADMIN_USER: 'srtaller_local_admin', SR_LOCAL_ADMIN_PASSWORD: 'synthetic-admin-secret',
  SR_LOCAL_MIGRATION_USER: 'srtaller_local_migration', SR_LOCAL_MIGRATION_PASSWORD: 'synthetic-migration-secret',
  SR_LOCAL_APPLICATION_USER: 'srtaller_local_application', SR_LOCAL_APPLICATION_PASSWORD: 'synthetic-application-secret',
  SR_LOCAL_BACKEND_HOST: '127.0.0.1', SR_LOCAL_BACKEND_PORT: '3000', SR_LOCAL_VITE_HOST: '127.0.0.1', SR_LOCAL_VITE_PORT: '4173',
  SR_STATION_BOOTSTRAP_SECRET: 'synthetic-station-secret', SR_USER_BOOTSTRAP_SECRET: 'synthetic-user-secret',
  SR_PIN_PEPPER: 'synthetic-pin-pepper', SR_ADMIN_PASSWORD_PEPPER: 'synthetic-admin-password-pepper', SR_REGISTRATION_ABUSE_PEPPER: 'synthetic-registration-abuse-pepper',
});

test('local admin provisioner fails closed outside explicit development localhost context', () => {
  assert.equal(assertLocalAdminProvisioningContext(values, { NODE_ENV: 'development', SR_LOCAL_RUNTIME: 'true', SR_DB_ENVIRONMENT: 'development', HOST: '127.0.0.1' }), values);
  assert.throws(() => assertLocalAdminProvisioningContext(values, { NODE_ENV: 'production', SR_LOCAL_RUNTIME: 'true', SR_DB_ENVIRONMENT: 'development', HOST: '127.0.0.1' }), /rejected/u);
  assert.throws(() => assertLocalAdminProvisioningContext(values, { NODE_ENV: 'development', SR_LOCAL_RUNTIME: 'true', SR_DB_ENVIRONMENT: 'development', HOST: '0.0.0.0' }), /rejected/u);
});

test('local admin provisioner accepts identity arguments only and obtains password from hidden TTY input', async () => {
  const source = await readFile(new URL('../scripts/provision-local-admin.mjs', import.meta.url), 'utf8');
  assert.match(source, /const \[tenantId, userId, email, \.\.\.unexpected\] = process\.argv\.slice\(2\)/u);
  assert.match(source, /process\.stdin\.isTTY/u);
  assert.match(source, /process\.stdin\.setRawMode\(true\)/u);
  assert.doesNotMatch(source, /password.*process\.argv/iu);
  assert.doesNotMatch(source, /JSON\.stringify\([^\n]*password/iu);
});
