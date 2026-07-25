import type { Transaction } from 'kysely';

type EmptyDatabaseSchema = Record<never, never>;

export type InternalDatabaseTransactionSettings = Readonly<{
  isolationLevel:
    | 'read uncommitted'
    | 'read committed'
    | 'repeatable read'
    | 'serializable';
  accessMode: 'read only' | 'read write';
}>;

export type InternalDatabaseTransactionExecutor =
  Transaction<EmptyDatabaseSchema>;

export type InternalDatabaseTransactionOperation<T> = (
  executor: InternalDatabaseTransactionExecutor,
) => Promise<T>;

export const databaseTransactionCapability: unique symbol = Symbol(
  'srtaller.database.transaction-capability',
);

export class DatabaseTransactionCapabilityError extends Error {
  constructor(readonly code: 'NESTED_FORBIDDEN') {
    super('Database transaction capability rejected the operation.');
    this.name = 'DatabaseTransactionCapabilityError';
  }
}

export interface InternalDatabaseTransactionConnection {
  readonly state: string;
  [databaseTransactionCapability]<T>(
    settings: InternalDatabaseTransactionSettings,
    operation: InternalDatabaseTransactionOperation<T>,
  ): Promise<T>;
}

type InactiveContextFactory = () => Error;

type ContextBinding = {
  executor: InternalDatabaseTransactionExecutor | null;
  readonly inactiveContext: InactiveContextFactory;
};

const contextBindings = new WeakMap<object, ContextBinding>();

export function bindDatabaseTransactionContext(
  context: object,
  executor: InternalDatabaseTransactionExecutor,
  inactiveContext: InactiveContextFactory,
): void {
  if (contextBindings.has(context)) {
    throw inactiveContext();
  }
  contextBindings.set(context, { executor, inactiveContext });
}

export function releaseDatabaseTransactionContext(context: object): void {
  const binding = contextBindings.get(context);
  if (binding) {
    binding.executor = null;
  }
}

export async function useDatabaseTransactionExecutor<T>(
  context: object,
  operation: InternalDatabaseTransactionOperation<T>,
): Promise<T> {
  const binding = contextBindings.get(context);
  if (!binding || binding.executor === null) {
    throw binding?.inactiveContext() ??
      new Error('Inactive database transaction context.');
  }
  return operation(binding.executor);
}
