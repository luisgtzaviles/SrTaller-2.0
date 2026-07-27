import {
  buildStationTestFullName,
} from './station-test-results.mjs';

const reporterFormat = 'srtaller-node-test-results/v1';

function serializeError(error) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  return {
    name: typeof error.name === 'string' ? error.name : 'Error',
    code: typeof error.code === 'string' ? error.code : null,
    message: typeof error.message === 'string' ? error.message : '',
    stack: typeof error.stack === 'string' ? error.stack : '',
    failureType:
      typeof error.failureType === 'string' ? error.failureType : null,
  };
}

export default async function* nodeTestJsonReporter(source) {
  const tests = [];
  const enqueued = new Map();
  const activeNamesByFile = new Map();

  for await (const event of source) {
    const data = event.data;
    if (
      event.type === 'test:enqueue' &&
      Number.isInteger(data?.testId) &&
      data.testId > 0
    ) {
      enqueued.set(data.testId, {
        kind: data.type === 'suite' ? 'suite' : 'test',
      });
      continue;
    }
    if (
      event.type === 'test:start' &&
      Number.isInteger(data?.testId) &&
      data.testId > 0 &&
      typeof data.file === 'string' &&
      Number.isInteger(data.nesting) &&
      data.nesting >= 0 &&
      typeof data.name === 'string' &&
      data.name !== ''
    ) {
      const activeNames = activeNamesByFile.get(data.file) ?? [];
      const suitePath = activeNames.slice(0, data.nesting);
      enqueued.set(data.testId, {
        ...enqueued.get(data.testId),
        fullName: buildStationTestFullName(suitePath, data.name),
        suitePath,
      });
      activeNames[data.nesting] = data.name;
      activeNames.length = data.nesting + 1;
      activeNamesByFile.set(data.file, activeNames);
      continue;
    }
    if (event.type !== 'test:pass' && event.type !== 'test:fail') {
      continue;
    }

    const identity = enqueued.get(data.testId);
    const suitePath = identity?.suitePath ?? [];
    const fullName = identity?.fullName ??
      buildStationTestFullName(suitePath, data.name);
    const skipped = data.skip !== undefined && data.skip !== false;
    tests.push({
      file: data.file ?? null,
      name: data.name,
      fullName,
      suitePath,
      kind: identity?.kind ??
        (data.details?.type === 'suite' ? 'suite' : 'test'),
      testId: data.testId,
      nesting: data.nesting,
      status: skipped
        ? 'SKIP'
        : event.type === 'test:fail'
          ? 'FAIL'
          : 'PASS',
      error: event.type === 'test:fail'
        ? serializeError(data.details?.error)
        : null,
    });
  }

  yield `${JSON.stringify({
    complete: true,
    format: reporterFormat,
    tests,
  })}\n`;
}
