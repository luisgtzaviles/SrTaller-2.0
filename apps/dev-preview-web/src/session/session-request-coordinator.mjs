const CHANNEL_NAME = 'srtaller.operational-session.v1';
const LOCK_NAME = 'srtaller.operational-session.request.v1';
const DEFAULT_EXCHANGE_TIMEOUT_MS = 15_000;

export class OperationalSessionCoordinationError extends Error {
  constructor() {
    super('Operational Session browser coordination is unavailable.');
    this.name = 'OperationalSessionCoordinationError';
  }
}

function isChangeSignal(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 2 &&
    (value.type === 'session-changing' || value.type === 'session-changed') &&
    value.version === 1
  );
}

export function createSessionRequestCoordinator({
  lockManager,
  channel,
  timeoutMs = DEFAULT_EXCHANGE_TIMEOUT_MS,
}) {
  if (
    !lockManager ||
    typeof lockManager.request !== 'function' ||
    !channel ||
    typeof channel.postMessage !== 'function' ||
    typeof channel.addEventListener !== 'function' ||
    typeof channel.removeEventListener !== 'function' ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1
  ) throw new OperationalSessionCoordinationError();

  const listeners = new Set();
  let disposed = false;
  const receive = (message) => {
    if (disposed || !isChangeSignal(message?.data)) return;
    for (const listener of listeners) listener();
  };
  channel.addEventListener('message', receive);

  const publishChange = (type) => {
    try {
      channel.postMessage({ type, version: 1 });
    } catch {
      throw new OperationalSessionCoordinationError();
    }
  };

  const runLocked = async (operation, callerSignal, deadlineDuringOperation) => {
    if (disposed) throw new OperationalSessionCoordinationError();
    const exchange = new AbortController();
    const abortFromCaller = () => exchange.abort(callerSignal?.reason);
    if (callerSignal?.aborted) abortFromCaller();
    else callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
    const timeout = setTimeout(
      () => exchange.abort(new OperationalSessionCoordinationError()),
      timeoutMs,
    );
    try {
      return await lockManager.request(
        LOCK_NAME,
        { mode: 'exclusive', signal: exchange.signal },
        () => {
          // A read is safe to abort because it cannot change authoritative
          // Session state. Once a mutation owns the lock, keep it until the
          // server outcome is known; releasing on a client deadline could
          // orphan committed credentials whose Set-Cookie response was lost.
          if (!deadlineDuringOperation) {
            clearTimeout(timeout);
            callerSignal?.removeEventListener('abort', abortFromCaller);
          }
          return operation(exchange.signal);
        },
      );
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    }
  };

  return Object.freeze({
    runRead(operation, signal) {
      return runLocked(operation, signal, true);
    },
    runMutation(operation, signal) {
      return runLocked(async (exchangeSignal) => {
        let mayHaveChanged = false;
        const markMayHaveChanged = () => {
          if (mayHaveChanged) return;
          // Invalidate peer snapshots before dispatching a request that may
          // replace the shared cookie-backed actor. Their reconciliation read
          // stays queued behind this same exclusive lock until the mutation's
          // outcome is known.
          publishChange('session-changing');
          mayHaveChanged = true;
        };
        try {
          return await operation(markMayHaveChanged, exchangeSignal);
        } finally {
          if (mayHaveChanged) publishChange('session-changed');
        }
      }, signal, false);
    },
    subscribe(listener) {
      if (disposed || typeof listener !== 'function') {
        throw new OperationalSessionCoordinationError();
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      channel.removeEventListener('message', receive);
      listeners.clear();
      channel.close?.();
    },
  });
}

let browserCoordinator;

function requireBrowserCoordinator() {
  if (browserCoordinator) return browserCoordinator;
  const lockManager = globalThis.navigator?.locks;
  const Channel = globalThis.BroadcastChannel;
  if (!lockManager || typeof Channel !== 'function') {
    throw new OperationalSessionCoordinationError();
  }
  browserCoordinator = createSessionRequestCoordinator({
    lockManager,
    channel: new Channel(CHANNEL_NAME),
  });
  return browserCoordinator;
}

export function runCoordinatedSessionRead(operation, signal) {
  return requireBrowserCoordinator().runRead(operation, signal);
}

export function runCoordinatedSessionMutation(operation, signal) {
  return requireBrowserCoordinator().runMutation(operation, signal);
}

export function subscribeToRemoteSessionChanges(listener) {
  return requireBrowserCoordinator().subscribe(listener);
}
