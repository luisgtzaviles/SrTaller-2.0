import assert from 'node:assert/strict';
import test from 'node:test';

import { healthRoutePolicyFailures } from '../scripts/lib/health-route-policy.mjs';

const healthController =
  'src/modules/preview/presentation/http/health.controller.ts';

function policy(source, file = healthController) {
  return healthRoutePolicyFailures(file, source);
}

test('health route policy allows only the explicitly authorized GET /healthz controller', () => {
  assert.deepEqual(policy(`
    @Controller()
    class HealthController {
      @Get('healthz')
      healthz() {}
    }
  `), []);
});

for (const [name, source] of [
  ['POST /healthz', `@Controller() class C { @Post('healthz') value() {} }`],
  ['GET /health', `@Controller() class C { @Get('health') value() {} }`],
  ['GET /readyz', `@Controller() class C { @Get('readyz') value() {} }`],
  ['GET /metrics', `@Controller() class C { @Get('metrics') value() {} }`],
  ['arbitrary health-like route', `@Controller() class C { @Get('health-detail') value() {} }`],
]) {
  test(`health route policy rejects ${name}`, () => {
    assert.notDeepEqual(policy(source), []);
  });
}

test('health route policy rejects the otherwise valid health route outside its allowlisted file', () => {
  assert.notDeepEqual(policy(
    `@Controller() class C { @Get('healthz') healthz() {} }`,
    'src/modules/preview/presentation/http/another.controller.ts',
  ), []);
});

test('health route policy preserves an existing nested business status transition', () => {
  assert.deepEqual(policy(
    `@Controller('api/preview') class C { @Patch('repairs/:id/status') update() {} }`,
    'src/modules/preview/presentation/http/preview.controller.ts',
  ), []);
});
