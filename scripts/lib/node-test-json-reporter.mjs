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

  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') {
      continue;
    }

    const data = event.data;
    const skipped = data.skip !== undefined && data.skip !== false;
    tests.push({
      file: data.file ?? null,
      name: data.name,
      fullName: data.name,
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
