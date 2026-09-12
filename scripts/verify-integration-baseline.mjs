import { inspectIntegrationBaseline } from './lib/integration-baseline.mjs';

const result = await inspectIntegrationBaseline();
process.stdout.write(`${JSON.stringify({
  event: 'integration_baseline_verified',
  ...result,
})}\n`);
