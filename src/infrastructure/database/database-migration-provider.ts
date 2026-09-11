import { createHash } from 'node:crypto';
import {
  lstat,
  readFile,
  readdir,
  realpath,
} from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspect } from 'node:util';

import { FileMigrationProvider } from 'kysely/migration';
import type { MigrationProvider } from 'kysely/migration';

type MigrationArtifactMode = 'compiled' | 'source';

type MigrationOwner =
  | 'access'
  | 'database'
  | 'repairs'
  | 'stations'
  | 'tenancy'
  | 'users';

type InternalMigrationProviderErrorCode =
  | 'DIRECTORY_MISSING'
  | 'PATH_FORBIDDEN'
  | 'FILENAME_INVALID'
  | 'DUPLICATE'
  | 'PROVIDER_FAILED';

export type InternalMigrationSource = Readonly<{
  root: string;
  authorizedRoot: string;
  normalizedRoot: string;
  mode: MigrationArtifactMode;
}>;

export type InternalMigrationManifestItem = Readonly<{
  fileName: string;
  migrationName: string;
  timestamp: string;
  owner: MigrationOwner;
  action: string;
  sha256: string;
  size: number;
  order: number;
}>;

export type InternalMigrationManifest = Readonly<{
  schemaVersion: 1;
  root: string;
  mode: MigrationArtifactMode;
  migrations: readonly InternalMigrationManifestItem[];
  aggregateSha256: string;
}>;

export type InternalMigrationInspection = Readonly<{
  source: InternalMigrationSource;
  resolvedRoot: string;
  manifest: InternalMigrationManifest;
}>;

export const databaseMigrationSourceOverride: unique symbol = Symbol(
  'srtaller.database.migration-source-override',
);

export class InternalMigrationProviderError extends Error {
  constructor(readonly code: InternalMigrationProviderErrorCode) {
    super('Governed migration provider rejected the source.');
    this.name = 'InternalMigrationProviderError';
  }

  toJSON(): Readonly<{
    name: 'InternalMigrationProviderError';
    code: InternalMigrationProviderErrorCode;
    message: string;
  }> {
    return Object.freeze({
      name: 'InternalMigrationProviderError',
      code: this.code,
      message: this.message,
    });
  }

  [inspect.custom](): ReturnType<InternalMigrationProviderError['toJSON']> {
    return this.toJSON();
  }
}

const migrationPattern =
  /^(?<timestamp>\d{14})_(?<owner>access|customers|database|repairs|stations|tenancy|users)_(?<action>[a-z][a-z0-9]*(?:_[a-z0-9]+)+)\.(?<extension>ts|js)$/u;

function isContained(parent: string, candidate: string): boolean {
  const difference = relative(parent, candidate);
  return (
    difference === '' ||
    (!difference.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) &&
      difference !== '..' &&
      !isAbsolute(difference))
  );
}

function validUtcTimestamp(timestamp: string): boolean {
  const year = Number(timestamp.slice(0, 4));
  const month = Number(timestamp.slice(4, 6));
  const day = Number(timestamp.slice(6, 8));
  const hour = Number(timestamp.slice(8, 10));
  const minute = Number(timestamp.slice(10, 12));
  const second = Number(timestamp.slice(12, 14));
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const normalized = [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
  ].join('');
  return year >= 2000 && normalized === timestamp;
}

function freezeManifest(
  root: string,
  mode: MigrationArtifactMode,
  migrations: readonly InternalMigrationManifestItem[],
): InternalMigrationManifest {
  const aggregateInput = JSON.stringify({
    schemaVersion: 1,
    root,
    mode,
    migrations: migrations.map(
      ({ fileName, migrationName, timestamp, owner, action, sha256, size, order }) => ({
        fileName,
        migrationName,
        timestamp,
        owner,
        action,
        sha256,
        size,
        order,
      }),
    ),
  });
  return Object.freeze({
    schemaVersion: 1,
    root,
    mode,
    migrations: Object.freeze([...migrations]),
    aggregateSha256: createHash('sha256')
      .update(aggregateInput)
      .digest('hex'),
  });
}

async function governedRoot(
  source: InternalMigrationSource,
): Promise<string> {
  const root = resolve(source.root);
  const authorizedRoot = resolve(source.authorizedRoot);
  if (!isContained(authorizedRoot, root)) {
    throw new InternalMigrationProviderError('PATH_FORBIDDEN');
  }
  try {
    const rootState = await lstat(root);
    if (!rootState.isDirectory() || rootState.isSymbolicLink()) {
      throw new InternalMigrationProviderError('PATH_FORBIDDEN');
    }
    const [realRoot, realAuthorizedRoot] = await Promise.all([
      realpath(root),
      realpath(authorizedRoot),
    ]);
    if (!isContained(realAuthorizedRoot, realRoot)) {
      throw new InternalMigrationProviderError('PATH_FORBIDDEN');
    }
    return realRoot;
  } catch (error: unknown) {
    if (error instanceof InternalMigrationProviderError) {
      throw error;
    }
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : '';
    throw new InternalMigrationProviderError(
      code === 'ENOENT' ? 'DIRECTORY_MISSING' : 'PATH_FORBIDDEN',
    );
  }
}

export async function inspectMigrationSource(
  source: InternalMigrationSource,
): Promise<InternalMigrationInspection> {
  if (
    typeof source !== 'object' ||
    source === null ||
    typeof source.root !== 'string' ||
    typeof source.authorizedRoot !== 'string' ||
    typeof source.normalizedRoot !== 'string' ||
    !/^[a-z0-9][a-z0-9/_-]*$/u.test(source.normalizedRoot) ||
    (source.mode !== 'source' && source.mode !== 'compiled')
  ) {
    throw new InternalMigrationProviderError('PATH_FORBIDDEN');
  }
  const resolvedRoot = await governedRoot(source);
  let entries;
  try {
    entries = await readdir(resolvedRoot, { withFileTypes: true });
  } catch {
    throw new InternalMigrationProviderError('DIRECTORY_MISSING');
  }
  const expectedExtension = source.mode === 'source' ? '.ts' : '.js';
  const sortedEntries = [...entries].sort((left, right) =>
    left.name.localeCompare(right.name, 'en'),
  );
  const compiledMigrationNames = new Set(
    sortedEntries
      .filter(
        (entry) =>
          entry.isFile() &&
          !entry.isSymbolicLink() &&
          entry.name.endsWith('.js'),
      )
      .map((entry) => entry.name),
  );
  const timestamps = new Set<string>();
  const migrationNames = new Set<string>();
  const migrations: InternalMigrationManifestItem[] = [];

  for (const entry of sortedEntries) {
    if (
      source.mode === 'compiled' &&
      entry.name.endsWith('.js.map') &&
      entry.isFile() &&
      !entry.isSymbolicLink() &&
      compiledMigrationNames.has(entry.name.slice(0, -4))
    ) {
      continue;
    }
    const match = migrationPattern.exec(entry.name);
    const groups = match?.groups;
    if (
      !entry.isFile() ||
      entry.isSymbolicLink() ||
      extname(entry.name) !== expectedExtension ||
      !groups ||
      !validUtcTimestamp(groups.timestamp ?? '')
    ) {
      throw new InternalMigrationProviderError('FILENAME_INVALID');
    }
    const timestamp = groups.timestamp as string;
    const owner = groups.owner as MigrationOwner;
    const action = groups.action as string;
    const migrationName = basename(entry.name, expectedExtension);
    if (
      timestamps.has(timestamp) ||
      migrationNames.has(migrationName)
    ) {
      throw new InternalMigrationProviderError('DUPLICATE');
    }
    timestamps.add(timestamp);
    migrationNames.add(migrationName);

    const filePath = join(resolvedRoot, entry.name);
    const [fileState, realFile] = await Promise.all([
      lstat(filePath),
      realpath(filePath),
    ]);
    if (
      !fileState.isFile() ||
      fileState.isSymbolicLink() ||
      !isContained(resolvedRoot, realFile)
    ) {
      throw new InternalMigrationProviderError('PATH_FORBIDDEN');
    }
    const content = await readFile(realFile);
    migrations.push(
      Object.freeze({
        fileName: entry.name,
        migrationName,
        timestamp,
        owner,
        action,
        sha256: createHash('sha256').update(content).digest('hex'),
        size: content.byteLength,
        order: migrations.length,
      }),
    );
  }

  return Object.freeze({
    source: Object.freeze({ ...source }),
    resolvedRoot,
    manifest: freezeManifest(
      source.normalizedRoot,
      source.mode,
      migrations,
    ),
  });
}

export function createGovernedFileMigrationProvider(
  inspection: InternalMigrationInspection,
): MigrationProvider {
  const allowed = new Map(
    inspection.manifest.migrations.map((item) => [item.fileName, item]),
  );
  const root = inspection.resolvedRoot;

  return new FileMigrationProvider({
    fs: {
      async readdir(requestedRoot: string): Promise<string[]> {
        if (resolve(requestedRoot) !== root) {
          throw new InternalMigrationProviderError('PATH_FORBIDDEN');
        }
        return [...allowed.keys()];
      },
    },
    migrationFolder: root,
    path: {
      join(requestedRoot: string, fileName: string): string {
        if (
          resolve(requestedRoot) !== root ||
          !allowed.has(fileName) ||
          basename(fileName) !== fileName
        ) {
          throw new InternalMigrationProviderError('PATH_FORBIDDEN');
        }
        return join(root, fileName);
      },
    },
    async import(filePath: string): Promise<unknown> {
      const fileName = basename(filePath);
      const expected = allowed.get(fileName);
      if (!expected || resolve(filePath) !== join(root, fileName)) {
        throw new InternalMigrationProviderError('PATH_FORBIDDEN');
      }
      try {
        const [realFile, content] = await Promise.all([
          realpath(filePath),
          readFile(filePath),
        ]);
        if (
          !isContained(root, realFile) ||
          createHash('sha256').update(content).digest('hex') !== expected.sha256
        ) {
          throw new InternalMigrationProviderError('PATH_FORBIDDEN');
        }
        return await import(
          `${pathToFileURL(realFile).href}?sha256=${expected.sha256}`
        );
      } catch (error: unknown) {
        if (error instanceof InternalMigrationProviderError) {
          throw error;
        }
        throw new InternalMigrationProviderError('PROVIDER_FAILED');
      }
    },
    onFileIgnored(): void {
      throw new InternalMigrationProviderError('PROVIDER_FAILED');
    },
  });
}
