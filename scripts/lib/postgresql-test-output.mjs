function summaryValue(output, label) {
  const pattern = new RegExp(
    `^[^\\r\\n]*\\b${label}\\s+(\\d+)\\s*$`,
    'mu',
  );
  const value = pattern.exec(output)?.[1];
  if (value === undefined) {
    throw new Error(`PostgreSQL test output is missing ${label} count`);
  }
  return Number.parseInt(value, 10);
}

export function assertPostgresqlTestSummary(
  output,
  { minimumTests = 1 } = {},
) {
  const summary = Object.freeze({
    tests: summaryValue(output, 'tests'),
    pass: summaryValue(output, 'pass'),
    fail: summaryValue(output, 'fail'),
    cancelled: summaryValue(output, 'cancelled'),
    skipped: summaryValue(output, 'skipped'),
    todo: summaryValue(output, 'todo'),
  });

  if (
    summary.tests < minimumTests ||
    summary.pass !== summary.tests ||
    summary.fail !== 0 ||
    summary.cancelled !== 0 ||
    summary.skipped !== 0 ||
    summary.todo !== 0
  ) {
    throw new Error(
      'PostgreSQL critical suite did not execute every expected test',
    );
  }

  return summary;
}
