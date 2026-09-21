import { performance } from 'node:perf_hooks';

function queryText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.text === 'string') return value.text;
  if (value && typeof value === 'object' && typeof value.sql === 'string') return value.sql;
  return '';
}

export function classifyPostgresqlQuery(value) {
  const normalized = queryText(value).trim().replace(/\s+/gu, ' ').toLowerCase();
  if (normalized === '') return 'other:unknown';
  if (/^start transaction(?:\s|$)/u.test(normalized)) return 'transaction:begin';
  if (/^(begin|commit|rollback)(?:\s|$)/u.test(normalized)) return `transaction:${normalized.split(' ', 1)[0]}`;
  const operation = normalized.match(/^(select|insert|update|delete)(?:\s|$)/u)?.[1] ?? 'other';
  const table = normalized.match(/(?:from|into|update)\s+"?([a-z][a-z0-9_]*)"?/u)?.[1] ?? 'unknown';
  return `${operation}:${table}`;
}

export async function measurePostgresqlQueries(run, options = {}) {
  const clientPrototype = options.clientPrototype;
  if (!clientPrototype || typeof clientPrototype.query !== 'function') {
    return Object.freeze({ value: await run(), diagnostics: null });
  }

  const originalQuery = clientPrototype.query;
  const buckets = new Map();
  let queryCount = 0;
  let queryMs = 0;
  let maxQueryMs = 0;
  let transactionStarted = null;
  let transactionMs = null;

  clientPrototype.query = function measuredQuery(...args) {
    const started = performance.now();
    const label = classifyPostgresqlQuery(args[0]);
    if (label === 'transaction:begin') transactionStarted = started;
    const result = originalQuery.apply(this, args);
    if (!result || typeof result.then !== 'function') return result;
    const record = () => {
      const elapsed = performance.now() - started;
      const current = buckets.get(label) ?? { count: 0, totalMs: 0, maxMs: 0 };
      current.count += 1;
      current.totalMs += elapsed;
      current.maxMs = Math.max(current.maxMs, elapsed);
      buckets.set(label, current);
      queryCount += 1;
      queryMs += elapsed;
      maxQueryMs = Math.max(maxQueryMs, elapsed);
      if ((label === 'transaction:commit' || label === 'transaction:rollback') && transactionStarted !== null) {
        transactionMs = performance.now() - transactionStarted;
      }
    };
    return result.then(
      (value) => { record(); return value; },
      (error) => { record(); throw error; },
    );
  };

  const started = performance.now();
  try {
    const value = await run();
    const wallMs = performance.now() - started;
    const breakdown = [...buckets.entries()]
      .map(([label, timing]) => Object.freeze({
        label,
        count: timing.count,
        totalMs: Number(timing.totalMs.toFixed(1)),
        maxMs: Number(timing.maxMs.toFixed(1)),
      }))
      .sort((left, right) => right.totalMs - left.totalMs || left.label.localeCompare(right.label));
    return Object.freeze({
      value,
      diagnostics: Object.freeze({
        wallMs: Number(wallMs.toFixed(1)),
        queryCount,
        queryMs: Number(queryMs.toFixed(1)),
        nonQueryMs: Number(Math.max(0, wallMs - queryMs).toFixed(1)),
        maxQueryMs: Number(maxQueryMs.toFixed(1)),
        transactionMs: transactionMs === null ? null : Number(transactionMs.toFixed(1)),
        breakdown: Object.freeze(breakdown),
      }),
    });
  } finally {
    clientPrototype.query = originalQuery;
  }
}

export function createPhaseRecorder(clock = () => performance.now()) {
  const origin = clock();
  const phases = [];
  return Object.freeze({
    async measure(name, run) {
      const started = clock();
      try {
        return await run();
      } finally {
        phases.push(Object.freeze({ name, durationMs: Number((clock() - started).toFixed(1)) }));
      }
    },
    snapshot() {
      return Object.freeze({
        totalMs: Number((clock() - origin).toFixed(1)),
        phases: Object.freeze([...phases]),
      });
    },
  });
}
