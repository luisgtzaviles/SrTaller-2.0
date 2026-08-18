import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateAuthorizedHealthSurface,
} from '../scripts/lib/health-surface-contract.mjs';

const validSurface = [
  "import { Controller, Get } from '@nestjs/common';",
  '@Controller()',
  'export class HealthController {',
  "  @Get('livez') livez(): object { return {}; }",
  "  @Get('readyz') readyz(): object { return {}; }",
  '}',
  '',
].join('\n');

test('health surface contract accepts only livez and readyz', () => {
  assert.deepEqual(validateAuthorizedHealthSurface(validSurface), []);
});

for (const [name, mutation] of [
  ['controller prefix', validSurface.replace('@Controller()', "@Controller('health')")],
  [
    'additional route',
    validSurface.replace(
      "  @Get('readyz')",
      "  @Get('status') status(): object { return {}; }\n  @Get('readyz')",
    ),
  ],
  ['changed method', validSurface.replace("@Get('livez')", "@Post('livez')")],
  ['changed path', validSurface.replace("@Get('readyz')", "@Get('healthz')")],
]) {
  test(`health surface contract rejects ${name}`, () => {
    assert.ok(validateAuthorizedHealthSurface(mutation).length > 0);
  });
}
