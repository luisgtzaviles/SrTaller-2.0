import {
  inspectWorkingTreeProvenance,
  inspectLiveRuntimeProvenance,
} from './lib/runtime-provenance.mjs';

const expected = await inspectWorkingTreeProvenance();
const result = await inspectLiveRuntimeProvenance({
  frontendBaseUrl: process.env.SR_RUNTIME_FRONTEND_URL ?? 'http://127.0.0.1:4173',
  backendBaseUrl: process.env.SR_RUNTIME_BACKEND_URL ?? 'http://127.0.0.1:3000',
  expected,
});

process.stdout.write(`${JSON.stringify({
  event: 'runtime_provenance_verified',
  ...result,
})}\n`);
