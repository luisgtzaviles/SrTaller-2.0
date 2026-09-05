import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { inspect } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);

const {
  ExternalConfigurationError,
  externalConfigurationCatalog,
  loadRequiredServerSecrets,
} = await import('../dist/infrastructure/config/external-configuration.js');

const syntheticSecret = 'synthetic-only-server-secret';

function expectError(action, code, variable, forbiddenValues = []) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof ExternalConfigurationError);
    assert.equal(error.category, 'Configuration');
    assert.equal(error.code, code);
    assert.equal(error.variable, variable);
    const rendered = [
      error.message,
      error.stack,
      JSON.stringify(error),
      inspect(error),
    ].join('\n');
    for (const value of forbiddenValues) {
      assert.ok(!rendered.includes(value));
    }
    return true;
  });
}

test('catalog distinguishes active non-secret configuration from server-only secrets without values', () => {
  assert.deepEqual(
    externalConfigurationCatalog
      .filter(({ classification }) => classification === 'secret')
      .map(({ name, classification, clientExposure }) => ({
        name,
        classification,
        clientExposure,
      })),
    [
      { name: 'SR_DB_PASSWORD', classification: 'secret', clientExposure: 'forbidden' },
      { name: 'SR_TEST_DB_PASSWORD', classification: 'secret', clientExposure: 'forbidden' },
      { name: 'SR_PIN_PEPPER', classification: 'secret', clientExposure: 'forbidden' },
      { name: 'SR_SESSION_SIGNING_KEY', classification: 'secret', clientExposure: 'forbidden' },
      { name: 'SR_STATION_BOOTSTRAP_SECRET', classification: 'secret', clientExposure: 'forbidden' },
    ],
  );
  assert.deepEqual(
    externalConfigurationCatalog
      .filter(({ classification }) => classification === 'non-secret')
      .map(({ name, classification }) => ({ name, classification })),
    [
      { name: 'HOST', classification: 'non-secret' },
      { name: 'NODE_ENV', classification: 'non-secret' },
      { name: 'PORT', classification: 'non-secret' },
      { name: 'SR_DB_ENVIRONMENT', classification: 'non-secret' },
    ],
  );
  assert.ok(externalConfigurationCatalog.every(Object.isFrozen));
});

test('required server secrets load from an explicit external input and redact diagnostics', () => {
  const secrets = loadRequiredServerSecrets(
    { SR_DB_PASSWORD: syntheticSecret },
    ['SR_DB_PASSWORD'],
  );
  assert.equal(secrets.get('SR_DB_PASSWORD'), syntheticSecret);
  const rendered = `${JSON.stringify(secrets)}\n${inspect(secrets)}`;
  assert.ok(!rendered.includes(syntheticSecret));
  assert.match(rendered, /\[REDACTED\]/u);
});

test('missing, empty, malformed and duplicate required secrets fail closed without leaks', () => {
  expectError(
    () => loadRequiredServerSecrets({}, ['SR_DB_PASSWORD']),
    'EXTERNAL_CONFIGURATION_REQUIRED',
    'SR_DB_PASSWORD',
  );
  expectError(
    () => loadRequiredServerSecrets({ SR_DB_PASSWORD: '   ' }, ['SR_DB_PASSWORD']),
    'EXTERNAL_CONFIGURATION_EMPTY',
    'SR_DB_PASSWORD',
  );
  const malicious = ` ${syntheticSecret}\n`;
  expectError(
    () => loadRequiredServerSecrets({ SR_DB_PASSWORD: malicious }, ['SR_DB_PASSWORD']),
    'EXTERNAL_CONFIGURATION_INVALID_SECRET',
    'SR_DB_PASSWORD',
    [syntheticSecret, malicious],
  );
  expectError(
    () => loadRequiredServerSecrets(
      { SR_DB_PASSWORD: syntheticSecret },
      ['SR_DB_PASSWORD', 'SR_DB_PASSWORD'],
    ),
    'EXTERNAL_CONFIGURATION_DUPLICATE_REQUIREMENT',
    'SR_DB_PASSWORD',
    [syntheticSecret],
  );
});

test('a consumer cannot read a secret it did not explicitly require', () => {
  const secrets = loadRequiredServerSecrets(
    {
      SR_DB_PASSWORD: syntheticSecret,
      SR_PIN_PEPPER: 'synthetic-future-pepper',
    },
    ['SR_DB_PASSWORD'],
  );
  expectError(
    () => secrets.get('SR_PIN_PEPPER'),
    'EXTERNAL_CONFIGURATION_REQUIRED',
    'SR_PIN_PEPPER',
    [syntheticSecret],
  );
});

test('client boundary and tracked environment policy reject server-only secret exposure', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/check-external-configuration.mjs',
  ]);
  assert.match(stdout, /External configuration boundary verified/u);
});

test('application startup requires the active database secret before opening the runtime', async () => {
  const source = await (await import('node:fs/promises')).readFile('src/main.ts', 'utf8');
  assert.match(
    source,
    /loadRequiredServerSecrets\(process\.env, \['SR_DB_PASSWORD'\]\)/u,
  );
});
