import { initializeWorkUnit } from './lib/work-unit.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const result = await initializeWorkUnit({
  projectRoot: process.cwd(),
  name: argument('--name'),
  branch: argument('--branch'),
  objective: argument('--objective'),
  risk: argument('--risk') ?? 'TRANSITIONAL',
  shadowRisk: argument('--shadow-risk') ?? 'NORMAL',
  type: argument('--type') ?? 'GOVERNANCE',
  baseSha: argument('--base'),
  confirmPreviousClosed: process.argv.includes('--confirm-previous-closed'),
  dependencyException: argument('--dependency-exception'),
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
