export type ApplicationDatabaseOperationKind =
  | 'persistence'
  | 'transaction';

export type ApplicationDatabaseOperationRelease = () => void;

export type ApplicationDatabaseOperationSchedulerOptions = Readonly<{
  maxPending?: number;
  waitTimeoutMs?: number;
}>;

type DatabaseOperationWaiter = {
  readonly kind: ApplicationDatabaseOperationKind;
  readonly start: (release: ApplicationDatabaseOperationRelease) => void;
  readonly timeout: NodeJS.Timeout;
};

const defaultWaitTimeoutMs = 25_000;
const defaultMaxPending = 256;

function positiveSafeInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive safe integer.`);
  }
  return value;
}

/**
 * Serializes connection-level transactions without reducing ordinary
 * persistence operations to a single lane. This is infrastructure-internal:
 * it does not grant product modules a transaction or database capability.
 */
export class ApplicationDatabaseOperationScheduler {
  #activePersistence = 0;
  #closing = false;
  #drainPromise: Promise<void> | null = null;
  #resolveDrain: (() => void) | null = null;
  #transactionActive = false;
  readonly #maxPending: number;
  readonly #waitTimeoutMs: number;
  readonly #waiters: DatabaseOperationWaiter[] = [];

  constructor(
    options: ApplicationDatabaseOperationSchedulerOptions = {},
  ) {
    this.#maxPending = positiveSafeInteger(
      options.maxPending ?? defaultMaxPending,
      'maxPending',
    );
    this.#waitTimeoutMs = positiveSafeInteger(
      options.waitTimeoutMs ?? defaultWaitTimeoutMs,
      'waitTimeoutMs',
    );
  }

  acquire(
    kind: ApplicationDatabaseOperationKind,
    admissionError: () => Error,
  ): Promise<ApplicationDatabaseOperationRelease> {
    if (this.#closing) {
      return Promise.reject(admissionError());
    }
    if (this.#canStartImmediately(kind)) {
      return Promise.resolve(this.#start(kind));
    }
    if (this.#waiters.length >= this.#maxPending) {
      return Promise.reject(admissionError());
    }
    return new Promise<ApplicationDatabaseOperationRelease>(
      (resolve, reject) => {
        let waiter: DatabaseOperationWaiter;
        const timeout = setTimeout(() => {
          const index = this.#waiters.indexOf(waiter);
          if (index >= 0) this.#waiters.splice(index, 1);
          reject(admissionError());
          this.#pump();
          this.#resolveDrainIfIdle();
        }, this.#waitTimeoutMs);
        waiter = {
          kind,
          timeout,
          start: (release) => {
            clearTimeout(timeout);
            resolve(release);
          },
        };
        this.#waiters.push(waiter);
      },
    );
  }

  close(): Promise<void> {
    this.#closing = true;
    if (this.#isIdle()) return Promise.resolve();
    if (!this.#drainPromise) {
      this.#drainPromise = new Promise<void>((resolve) => {
        this.#resolveDrain = resolve;
      });
    }
    return this.#drainPromise;
  }

  #canStartImmediately(kind: ApplicationDatabaseOperationKind): boolean {
    if (this.#waiters.length > 0 || this.#transactionActive) return false;
    return kind === 'persistence' || this.#activePersistence === 0;
  }

  #start(
    kind: ApplicationDatabaseOperationKind,
  ): ApplicationDatabaseOperationRelease {
    if (kind === 'transaction') this.#transactionActive = true;
    else this.#activePersistence += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (kind === 'transaction') this.#transactionActive = false;
      else this.#activePersistence -= 1;
      this.#pump();
      this.#resolveDrainIfIdle();
    };
  }

  #pump(): void {
    if (this.#transactionActive || this.#waiters.length === 0) return;
    const first = this.#waiters[0]!;
    if (first.kind === 'transaction') {
      if (this.#activePersistence > 0) return;
      this.#waiters.shift();
      first.start(this.#start('transaction'));
      return;
    }
    while (
      this.#waiters[0]?.kind === 'persistence' &&
      !this.#transactionActive
    ) {
      const waiter = this.#waiters.shift()!;
      waiter.start(this.#start('persistence'));
    }
  }

  #isIdle(): boolean {
    return !this.#transactionActive &&
      this.#activePersistence === 0 &&
      this.#waiters.length === 0;
  }

  #resolveDrainIfIdle(): void {
    if (!this.#closing || !this.#isIdle()) return;
    this.#resolveDrain?.();
    this.#resolveDrain = null;
    this.#drainPromise = null;
  }
}
