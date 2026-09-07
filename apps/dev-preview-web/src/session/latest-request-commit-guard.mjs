export function createLatestRequestCommitGuard() {
  let disposed = false;
  let latestRequest = 0;

  return Object.freeze({
    start() {
      if (disposed) return null;
      const request = ++latestRequest;
      return Object.freeze({
        mayCommit() {
          return !disposed && request === latestRequest;
        },
      });
    },
    dispose() {
      disposed = true;
      latestRequest += 1;
    },
  });
}

export function isLatestOperationGeneration(currentGeneration, expectedGeneration) {
  return currentGeneration === expectedGeneration;
}
