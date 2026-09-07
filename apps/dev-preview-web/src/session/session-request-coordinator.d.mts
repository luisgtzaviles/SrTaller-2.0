export class OperationalSessionCoordinationError extends Error {}

export function runCoordinatedSessionRead<Result>(
  operation: (signal: AbortSignal) => Promise<Result>,
  signal?: AbortSignal,
): Promise<Result>;

export function runCoordinatedSessionMutation<Result>(
  operation: (
    markMayHaveChanged: () => void,
    signal: AbortSignal,
  ) => Promise<Result>,
  signal?: AbortSignal,
): Promise<Result>;

export function subscribeToRemoteSessionChanges(listener: () => void): () => void;
