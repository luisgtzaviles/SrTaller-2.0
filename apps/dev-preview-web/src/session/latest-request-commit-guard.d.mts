export interface LatestRequestCommitPermit {
  mayCommit(): boolean;
}

export interface LatestRequestCommitGuard {
  start(): LatestRequestCommitPermit | null;
  dispose(): void;
}

export function createLatestRequestCommitGuard(): LatestRequestCommitGuard;

export function isLatestOperationGeneration(
  currentGeneration: number,
  expectedGeneration: number,
): boolean;
