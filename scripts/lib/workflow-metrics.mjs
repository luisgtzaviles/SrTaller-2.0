import { readFile, writeFile } from 'node:fs/promises';

const stagePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const findingPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

export const authoritativeWorkflowStageNames = Object.freeze([
  'install',
  'base-verify',
  'compiled-smoke-migration',
  'postgresql-composite',
  'pbi039-postgresql',
  'tl02-postgresql',
  'tl03-postgresql',
  'postgresql-cleanup',
  'compiled-backend-smoke',
  'compiled-ui-smoke',
]);

export function validateWorkflowMetrics(value) {
  const rootKeys = Object.keys(value ?? {}).sort();
  if (
    value?.schemaVersion !== 1 ||
    value?.contract !== 'WF-005/WORKFLOW-METRICS' ||
    !Array.isArray(value.stages) ||
    value.stages.length === 0 ||
    JSON.stringify(rootKeys) !== JSON.stringify(['contract', 'schemaVersion', 'stages'])
  ) {
    throw new Error('Workflow metrics contract has invalid or forbidden properties');
  }
  const stageNames = new Set();
  for (const stage of value.stages) {
    const stageKeys = Object.keys(stage ?? {}).sort();
    if (
      JSON.stringify(stageKeys) !== JSON.stringify([
        'durationMs',
        'finding',
        'finishedAt',
        'name',
        'result',
        'startedAt',
      ]) ||
      !stagePattern.test(stage.name ?? '') ||
      !['PASS', 'FAIL'].includes(stage.result) ||
      !Number.isInteger(stage.durationMs) ||
      stage.durationMs < 0 ||
      (stage.finding !== null && !findingPattern.test(stage.finding ?? '')) ||
      (stage.result === 'PASS' && stage.finding !== null) ||
      (stage.result === 'FAIL' && stage.finding === null) ||
      !Number.isInteger(Date.parse(stage.startedAt)) ||
      !Number.isInteger(Date.parse(stage.finishedAt))
    ) {
      throw new Error('Workflow stage metric is invalid');
    }
    if (stageNames.has(stage.name)) {
      throw new Error(`Workflow stage metric is duplicated: ${stage.name}`);
    }
    stageNames.add(stage.name);
  }
  const serialized = JSON.stringify(value);
  if (
    /postgres(?:ql)?:\/\//iu.test(serialized) ||
    /(?:^|[\\/])Users[\\/]|(?:^|[\\/])home[\\/]runner[\\/]work[\\/]/u.test(serialized)
  ) {
    throw new Error('Workflow metrics contain forbidden material');
  }
  return value;
}

export async function readWorkflowMetrics(path) {
  try {
    return validateWorkflowMetrics(JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return Object.freeze({
        schemaVersion: 1,
        contract: 'WF-005/WORKFLOW-METRICS',
        stages: Object.freeze([]),
      });
    }
    throw error;
  }
}

export async function appendWorkflowMetric(path, stage) {
  const current = await readWorkflowMetrics(path);
  const next = validateWorkflowMetrics({
    ...current,
    stages: [...current.stages, Object.freeze({ ...stage })],
  });
  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

export function comparableWorkflowMetrics(metrics) {
  validateWorkflowMetrics(metrics);
  return Object.freeze({
    schemaVersion: metrics.schemaVersion,
    contract: metrics.contract,
    stages: Object.freeze(metrics.stages.map(({ name, result, finding }) =>
      Object.freeze({ name, result, finding }),
    )),
  });
}

export function validateAuthoritativeWorkflowMetrics(value) {
  const metrics = validateWorkflowMetrics(value);
  const names = metrics.stages.map(({ name }) => name);
  if (
    JSON.stringify(names) !== JSON.stringify(authoritativeWorkflowStageNames) ||
    metrics.stages.some(({ result }) => result !== 'PASS')
  ) {
    throw new Error(
      'Authoritative workflow metrics must contain the exact ordered full stage inventory',
    );
  }
  return metrics;
}
