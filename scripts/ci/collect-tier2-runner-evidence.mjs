import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import {
  TIER2_BOOTSTRAP_VERSION,
  TIER2_CONTRACT,
  parseOwnerScopedDiagnostics,
} from '../lib/tier2-authoritative-ci.mjs';

const execute = promisify(execFile);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function required(name) {
  const value = argument(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function command(commandName, argumentsList = []) {
  const { stdout } = await execute(commandName, argumentsList, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

const output = required('--output');
const fullPath = required('--full');
const verificationLogPath = required('--verification-log');
const testedSha = required('--tested-sha');
const leg = required('--leg');
const verificationExitCode = Number(required('--verification-exit-code'));
if (!/^[0-9a-f]{40}$/u.test(testedSha)) throw new Error('tested SHA is invalid');
if (!/^run-[12]$/u.test(leg)) throw new Error('leg must be run-1 or run-2');

const [full, verificationLog, osRelease, cpuInfo, memoryInfo, diskInfo] = await Promise.all([
  readFile(fullPath, 'utf8').then(JSON.parse),
  readFile(verificationLogPath, 'utf8'),
  readFile('/etc/os-release', 'utf8'),
  command('lscpu'),
  command('free', ['--bytes']),
  command('df', ['--block-size=1', '--output=size,avail', '/']),
]);

const os = Object.fromEntries(
  osRelease
    .split(/\r?\n/u)
    .filter((line) => line.includes('='))
    .map((line) => {
      const [key, ...parts] = line.split('=');
      return [key, parts.join('=').replace(/^"|"$/gu, '')];
    }),
);
const cpu = Object.fromEntries(
  cpuInfo
    .split(/\r?\n/u)
    .filter((line) => line.includes(':'))
    .map((line) => {
      const [key, ...parts] = line.split(':');
      return [key.trim(), parts.join(':').trim()];
    }),
);
const memoryLines = memoryInfo.split(/\r?\n/u);
const memoryColumns = memoryLines[1]?.trim().split(/\s+/u) ?? [];
const diskColumns = diskInfo.split(/\r?\n/u)[1]?.trim().split(/\s+/u) ?? [];
const postgresqlDiagnostics = parseOwnerScopedDiagnostics(verificationLog);

const evidence = {
  schemaVersion: 1,
  bootstrapVersion: TIER2_BOOTSTRAP_VERSION,
  contract: TIER2_CONTRACT,
  full,
  leg,
  machine: {
    architecture: await command('uname', ['-m']),
    cpuModel: cpu['Model name'],
    cpuCount: Number(cpu['CPU(s)']),
    diskAvailableBytes: Number(diskColumns[1]),
    diskTotalBytes: Number(diskColumns[0]),
    memoryBytes: Number(memoryColumns[1]),
    osId: os.ID,
    osVersion: os.VERSION_ID,
  },
  postgresqlDiagnostics,
  testedSha,
  toolchain: {
    docker: await command('docker', ['version', '--format', '{{.Server.Version}}']),
    node: process.versions.node,
    pnpm: await command('pnpm', ['--version']),
    postgres: full.postgresql?.composite?.postgres,
  },
  verificationExitCode,
};

await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });

if (
  verificationExitCode !== 0 ||
  full.verdict !== 'PASS' ||
  full.cleanup?.status !== 'PASS' ||
  evidence.postgresqlDiagnostics?.ownerScoped?.runs?.[0]?.fileTimings?.length !== 8
) {
  process.exitCode = 1;
}
