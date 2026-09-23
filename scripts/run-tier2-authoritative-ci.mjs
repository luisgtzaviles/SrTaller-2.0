import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  TIER2_BOOTSTRAP_VERSION,
  TIER2_CONTRACT,
  TIER2_LOCATION,
  TIER2_PROVIDER,
  TIER2_SERVER_TYPE,
  TIER2_SHADOW_MODE,
  TIER2_TTL_MINUTES,
  classifyManagedResources,
  compareTier2Legs,
  createTier2Attestation,
  estimateTier2Cost,
  isRetryableTier2DeleteStatus,
  isRetryableTier2PreBootstrapTransportError,
  tier2ResourceLabels,
  validateTier2RecoveryInvocation,
  validateTier2Invocation,
  validateTier2ServerProfile,
} from './lib/tier2-authoritative-ci.mjs';
import { parseWorkUnitDocument } from './lib/work-unit.mjs';
import { runStreamingCommand } from './lib/process-runner.mjs';

const execute = promisify(execFile);
const apiBase = 'https://api.hetzner.cloud/v1';
const projectRoot = process.cwd();

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function safeRunToken(value) {
  const token = value.replace(/[^A-Za-z0-9-]/gu, '-').slice(0, 30);
  if (!token) throw new Error('GitHub run identity is invalid');
  return token;
}

async function git(argumentsList) {
  const { stdout } = await execute('git', argumentsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

async function api(path, { body, expected = [200], method = 'GET' } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${requiredEnvironment('HCLOUD_TOKEN')}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    method,
  });
  if (!expected.includes(response.status)) {
    throw new Error(`Hetzner API ${method} ${path} failed with status ${response.status}`);
  }
  if (response.status === 204 || response.status === 404) return null;
  return response.json();
}

async function listManaged(kind) {
  const plural = kind === 'ssh_key' ? 'ssh_keys' : `${kind}s`;
  const resources = [];
  let page = 1;
  do {
    const response = await api(
      `/${plural}?label_selector=${encodeURIComponent('managed-by=srtaller-authoritative-ci')}&per_page=50&page=${page}`,
    );
    resources.push(...(response[plural] ?? []).map((resource) => ({
      id: resource.id,
      kind,
      labels: resource.labels ?? {},
      name: resource.name,
    })));
    page = response.meta?.pagination?.next_page ?? null;
  } while (page !== null);
  return resources;
}

async function managedResources() {
  return (await Promise.all(
    ['server', 'firewall', 'placement_group', 'ssh_key'].map(listManaged),
  )).flat();
}

function resourcePath(resource) {
  const plural = resource.kind === 'ssh_key' ? 'ssh_keys' : `${resource.kind}s`;
  return `/${plural}/${resource.id}`;
}

async function deleteResource(resource) {
  const path = resourcePath(resource);
  const acceptanceDeadline = Date.now() + 90_000;
  let deleteAccepted = false;
  while (Date.now() < acceptanceDeadline && !deleteAccepted) {
    const response = await fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${requiredEnvironment('HCLOUD_TOKEN')}` },
      method: 'DELETE',
    });
    if (response.status === 404) return;
    if (response.status === 200 || response.status === 204) {
      deleteAccepted = true;
      break;
    }
    if (!isRetryableTier2DeleteStatus(resource.kind, response.status)) {
      throw new Error(`Hetzner API DELETE ${path} failed with status ${response.status}`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
  }
  if (!deleteAccepted) {
    throw new Error(`Hetzner resource dependency did not clear: ${resource.kind} ${resource.id}`);
  }
  const proofDeadline = Date.now() + 90_000;
  while (Date.now() < proofDeadline) {
    const response = await fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${requiredEnvironment('HCLOUD_TOKEN')}` },
    });
    if (response.status === 404) return;
    if (response.status !== 200) {
      throw new Error(`Hetzner deletion proof failed for ${resource.kind} ${resource.id}`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
  }
  throw new Error(`Hetzner resource remained after deletion: ${resource.kind} ${resource.id}`);
}

async function sweepRunResources(outputDirectory, recoveryRunId) {
  const controllerSha = requiredEnvironment('GITHUB_SHA');
  const remote = (await git(['ls-remote', '--heads', 'origin', 'refs/heads/main'])).split(/\s+/u);
  const liveMainSha = remote[0];
  validateTier2RecoveryInvocation({
    controllerSha,
    environmentAuthorized: Boolean(process.env.HCLOUD_TOKEN),
    eventName: requiredEnvironment('GITHUB_EVENT_NAME'),
    liveMainSha,
    recoveryRunId,
    ref: requiredEnvironment('GITHUB_REF'),
    repository: requiredEnvironment('GITHUB_REPOSITORY'),
  });
  const resources = (await managedResources()).filter(
    ({ labels }) => labels?.['run-id'] === recoveryRunId,
  );
  if (resources.some(({ kind }) => kind === 'server')) {
    throw new Error('Tier-2 explicit recovery refuses to delete a run with a remaining server');
  }
  const deleted = [];
  for (const kind of ['firewall', 'placement_group', 'ssh_key']) {
    for (const resource of resources.filter((candidate) => candidate.kind === kind)) {
      await deleteResource(resource);
      deleted.push({ id: resource.id, kind: resource.kind, name: resource.name });
    }
  }
  const remaining = (await managedResources()).filter(
    ({ labels }) => labels?.['run-id'] === recoveryRunId,
  );
  const evidence = {
    contract: TIER2_CONTRACT,
    controllerSha,
    deleted,
    inspected: classifyManagedResources(resources, Math.floor(Date.now() / 1_000)),
    mode: 'EXPLICIT_NON_SERVER_RECOVERY',
    recoveryRunId,
    remaining: classifyManagedResources(remaining, Math.floor(Date.now() / 1_000)),
    status: remaining.length === 0 ? 'PASS' : 'FAIL',
  };
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    join(outputDirectory, 'TIER2_RUN_RECOVERY.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    { mode: 0o600 },
  );
  if (remaining.length > 0) throw new Error('Tier-2 explicit recovery left managed resources');
}

async function sweepExpired(outputDirectory) {
  const nowEpoch = Math.floor(Date.now() / 1_000);
  const resources = await managedResources();
  const classified = classifyManagedResources(resources, nowEpoch);
  const expired = classified.filter(({ state }) => state === 'EXPIRED_ORPHAN');
  for (const kind of ['server', 'firewall', 'placement_group', 'ssh_key']) {
    for (const candidate of expired.filter((resource) => resource.kind === kind)) {
      await deleteResource(candidate);
    }
  }
  const remaining = await managedResources();
  const evidence = {
    contract: TIER2_CONTRACT,
    deleted: expired,
    inspected: classified,
    remaining: classifyManagedResources(remaining, nowEpoch),
    status: 'PASS',
  };
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    join(outputDirectory, 'TIER2_ORPHAN_SWEEP.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    { mode: 0o600 },
  );
}

async function waitForServer(serverId) {
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    const { server } = await api(`/servers/${serverId}`);
    if (server.status === 'running' && server.public_net?.ipv4?.ip) return server;
    if (['deleting', 'off', 'stopping'].includes(server.status)) {
      throw new Error(`Tier-2 server entered unexpected state ${server.status}`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
  }
  throw new Error(`Tier-2 server ${serverId} did not become ready`);
}

function sshArguments(privateKey, knownHosts, ip, remoteArguments) {
  return [
    '-i', privateKey,
    '-o', 'BatchMode=yes',
    '-o', 'IdentitiesOnly=yes',
    '-o', `UserKnownHostsFile=${knownHosts}`,
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=10',
    `root@${ip}`,
    ...remoteArguments,
  ];
}

async function waitForSsh(privateKey, knownHosts, ip) {
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    try {
      await execute('ssh', sshArguments(privateKey, knownHosts, ip, ['true']), {
        encoding: 'utf8',
        timeout: 15_000,
      });
      return;
    } catch {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000));
    }
  }
  throw new Error(`SSH did not become ready for Tier-2 server ${ip}`);
}

function secretFreeEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) =>
      !name.includes('TOKEN') &&
      !name.includes('SECRET') &&
      !name.includes('PASSWORD') &&
      !name.startsWith('SR_DB_'),
    ),
  );
}

async function runPreBootstrapCommand(command, argumentsList, options) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await runStreamingCommand(command, argumentsList, options);
    } catch (error) {
      lastError = error;
      if (attempt === 2 || !isRetryableTier2PreBootstrapTransportError(error)) throw error;
      process.stdout.write('Tier-2 pre-bootstrap transport recovery 1/1\n');
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000));
    }
  }
  throw lastError;
}

async function executeLeg({
  ip,
  knownHosts,
  leg,
  outputDirectory,
  privateKey,
  repositoryUrl,
  server,
  testedSha,
}) {
  await waitForSsh(privateKey, knownHosts, ip);
  await runPreBootstrapCommand(
    'ssh',
    sshArguments(privateKey, knownHosts, ip, [
      'install', '-d', '-m', '0700', '/opt/srtaller-control/ci', '/opt/srtaller-control/lib',
    ]),
    { env: secretFreeEnvironment(), timeoutMs: 30_000 },
  );
  const scpBase = [
    '-i', privateKey,
    '-o', 'BatchMode=yes',
    '-o', 'IdentitiesOnly=yes',
    '-o', `UserKnownHostsFile=${knownHosts}`,
    '-o', 'StrictHostKeyChecking=accept-new',
  ];
  await runPreBootstrapCommand('scp', [
    ...scpBase,
    resolve(projectRoot, 'scripts/ci/tier2-bootstrap.sh'),
    resolve(projectRoot, 'scripts/ci/collect-tier2-runner-evidence.mjs'),
    `root@${ip}:/opt/srtaller-control/ci/`,
  ], { env: secretFreeEnvironment(), timeoutMs: 60_000 });
  await runPreBootstrapCommand('scp', [
    ...scpBase,
    resolve(projectRoot, 'scripts/lib/tier2-authoritative-ci.mjs'),
    `root@${ip}:/opt/srtaller-control/lib/`,
  ], { env: secretFreeEnvironment(), timeoutMs: 60_000 });

  let executionError = null;
  try {
    await runStreamingCommand('ssh', sshArguments(privateKey, knownHosts, ip, [
      'bash', '/opt/srtaller-control/ci/tier2-bootstrap.sh', repositoryUrl, testedSha, leg,
    ]), { env: secretFreeEnvironment(), timeoutMs: 75 * 60_000 });
  } catch (error) {
    executionError = error;
  }

  const legDirectory = join(outputDirectory, leg);
  await mkdir(legDirectory, { recursive: true });
  try {
    await runStreamingCommand('scp', [
      ...scpBase,
      '-r',
      `root@${ip}:/opt/srtaller-evidence/.`,
      legDirectory,
    ], { env: secretFreeEnvironment(), timeoutMs: 2 * 60_000 });
  } catch (error) {
    if (executionError === null) executionError = error;
  }
  if (executionError !== null) throw executionError;

  const evidencePath = join(legDirectory, 'TIER2_RUNNER_EVIDENCE.json');
  const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
  const enriched = {
    ...evidence,
    provider: {
      location: TIER2_LOCATION,
      name: TIER2_PROVIDER,
      placementGroupId: server.placementGroupId,
      serverId: server.id,
      serverType: TIER2_SERVER_TYPE,
    },
  };
  const serialized = JSON.stringify(enriched);
  if (serialized.includes(requiredEnvironment('HCLOUD_TOKEN'))) {
    throw new Error('Tier-2 evidence contains the provisioning credential');
  }
  await writeFile(evidencePath, `${JSON.stringify(enriched, null, 2)}\n`, { mode: 0o600 });
  return enriched;
}

async function runCampaign(outputDirectory) {
  const startedAt = Date.now();
  const controllerSha = requiredEnvironment('GITHUB_SHA');
  const runId = requiredEnvironment('GITHUB_RUN_ID');
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT ?? '1';
  const eventName = requiredEnvironment('GITHUB_EVENT_NAME');
  const ref = requiredEnvironment('GITHUB_REF');
  const workflow = requiredEnvironment('GITHUB_WORKFLOW');
  const repository = requiredEnvironment('GITHUB_REPOSITORY');
  const serverUrl = requiredEnvironment('GITHUB_SERVER_URL');
  if (serverUrl !== 'https://github.com' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository)) {
    throw new Error('Tier-2 public repository identity is invalid');
  }
  const testedSha = argument('--tested-sha') ?? controllerSha;
  const remote = (await git(['ls-remote', '--heads', 'origin', 'refs/heads/main'])).split(/\s+/u);
  const liveMainSha = remote[0];
  const checklist = parseWorkUnitDocument(
    await readFile(resolve(projectRoot, 'docs/work/ACTIVE_CHECKLIST.md'), 'utf8'),
  );
  if (checklist.findings.length > 0) {
    throw new Error('ACTIVE_CHECKLIST Work Unit metadata is invalid');
  }
  validateTier2Invocation({
    controllerSha,
    dependencySubjectSha: checklist.metadata.dependency_subject_sha,
    environmentAuthorized: Boolean(process.env.HCLOUD_TOKEN),
    eventName,
    liveMainSha,
    ref,
    repository,
    requested: process.env.SR_TIER2_SHADOW_REQUESTED === 'true',
    testedSha,
  });
  await git(['merge-base', '--is-ancestor', testedSha, liveMainSha]);

  const existing = await managedResources();
  if (existing.length > 0) {
    const inventory = classifyManagedResources(existing, Math.floor(Date.now() / 1_000));
    throw new Error(`Managed Tier-2 resources already exist: ${inventory.map(({ kind, name, state }) => `${kind}:${name}:${state}`).join(', ')}`);
  }

  const runToken = safeRunToken(`${runId}-${runAttempt}`);
  const expiresAtEpoch = Math.floor(Date.now() / 1_000) + TIER2_TTL_MINUTES * 60;
  const labels = tier2ResourceLabels({ controllerSha, expiresAtEpoch, runId: runToken });
  const temporary = await mkdtemp(join(tmpdir(), 'srtaller-tier2-'));
  const privateKey = join(temporary, 'id_ed25519');
  const publicKey = `${privateKey}.pub`;
  const knownHosts = join(temporary, 'known_hosts');
  const created = [];
  let cleanup = { status: 'NOT_RUN' };
  let campaignError = null;
  let campaign = null;

  try {
    await execute('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', privateKey, '-C', `srtaller-${runToken}`]);
    const key = await api('/ssh_keys', {
      body: { labels, name: `sr-ci-key-${runToken}`, public_key: (await readFile(publicKey, 'utf8')).trim() },
      expected: [201],
      method: 'POST',
    });
    created.push({ id: key.ssh_key.id, kind: 'ssh_key', name: key.ssh_key.name });

    const controllerIpResponse = await fetch('https://api.ipify.org');
    if (!controllerIpResponse.ok) throw new Error('Cannot resolve trusted controller IPv4 address');
    const controllerIp = (await controllerIpResponse.text()).trim();
    if (!/^(?:\d{1,3}\.){3}\d{1,3}$/u.test(controllerIp)) {
      throw new Error('Trusted controller did not resolve to IPv4');
    }
    const firewall = await api('/firewalls', {
      body: {
        labels,
        name: `sr-ci-firewall-${runToken}`,
        rules: [{ direction: 'in', port: '22', protocol: 'tcp', source_ips: [`${controllerIp}/32`] }],
      },
      expected: [201],
      method: 'POST',
    });
    created.push({ id: firewall.firewall.id, kind: 'firewall', name: firewall.firewall.name });

    const placement = await api('/placement_groups', {
      body: { labels, name: `sr-ci-spread-${runToken}`, type: 'spread' },
      expected: [201],
      method: 'POST',
    });
    created.push({ id: placement.placement_group.id, kind: 'placement_group', name: placement.placement_group.name });

    const serverSettlements = await Promise.allSettled(['run-1', 'run-2'].map(async (leg) => {
      const response = await api('/servers', {
        body: {
          firewalls: [{ firewall: firewall.firewall.id }],
          image: 'ubuntu-24.04',
          labels: { ...labels, leg },
          location: TIER2_LOCATION,
          name: `sr-ci-${leg}-${runToken}`,
          placement_group: placement.placement_group.id,
          public_net: { enable_ipv4: true, enable_ipv6: false },
          server_type: TIER2_SERVER_TYPE,
          ssh_keys: [key.ssh_key.id],
          start_after_create: true,
        },
        expected: [201],
        method: 'POST',
      });
      const createdServer = {
        id: response.server.id,
        kind: 'server',
        name: response.server.name,
      };
      created.push(createdServer);
      const server = await waitForServer(response.server.id);
      validateTier2ServerProfile(server, placement.placement_group.id);
      return {
        ...createdServer,
        ip: server.public_net.ipv4.ip,
        leg,
        placementGroupId: placement.placement_group.id,
      };
    }));
    const failedServer = serverSettlements.find(({ status }) => status === 'rejected');
    if (failedServer) throw failedServer.reason;
    const servers = serverSettlements.map(({ value }) => value);

    const repositoryUrl = `${serverUrl}/${repository}.git`;
    const legSettlements = await Promise.allSettled(servers.map((server) => executeLeg({
      ip: server.ip,
      knownHosts,
      leg: server.leg,
      outputDirectory,
      privateKey,
      repositoryUrl,
      server,
      testedSha,
    })));
    const failedLeg = legSettlements.find(({ status }) => status === 'rejected');
    if (failedLeg) throw failedLeg.reason;
    const [left, right] = legSettlements.map(({ value }) => value);
    const comparison = compareTier2Legs(left, right);
    const attestation = createTier2Attestation({
      comparison,
      controllerSha,
      runAttempt,
      runId,
      testedSha,
      workflow,
    });
    campaign = {
      attestation,
      authoritative: false,
      bootstrapVersion: TIER2_BOOTSTRAP_VERSION,
      comparison,
      contract: TIER2_CONTRACT,
      eventName,
      mode: TIER2_SHADOW_MODE,
      ref,
      status: 'PASS',
    };
  } catch (error) {
    campaignError = error;
  } finally {
    const cleanupFailures = [];
    for (const kind of ['server', 'firewall', 'placement_group', 'ssh_key']) {
      for (const resource of created.filter((candidate) => candidate.kind === kind)) {
        try {
          await deleteResource(resource);
        } catch (error) {
          cleanupFailures.push(`${resource.kind}:${resource.id}:${error.message}`);
        }
      }
    }
    let remaining = [];
    try {
      remaining = (await managedResources()).filter(
        ({ labels: resourceLabels }) => resourceLabels?.['run-id'] === runToken,
      );
    } catch (error) {
      cleanupFailures.push(`deletion-inventory:${error.message}`);
    }
    if (remaining.length > 0) cleanupFailures.push('managed resources remain after cleanup');
    cleanup = {
      deletedResources: created.length - remaining.length,
      failures: cleanupFailures,
      remainingResources: remaining.length,
      status: cleanupFailures.length === 0 ? 'PASS' : 'FAIL',
    };
    await rm(temporary, { force: true, recursive: true });
  }

  await mkdir(outputDirectory, { recursive: true });
  const finalEvidence = {
    ...(campaign ?? {
      authoritative: false,
      contract: TIER2_CONTRACT,
      failure: campaignError?.message ?? 'Tier-2 campaign failed',
      mode: TIER2_SHADOW_MODE,
      status: 'FAIL',
    }),
    cleanup,
    cost: estimateTier2Cost({ elapsedMs: Date.now() - startedAt }),
    schemaVersion: 1,
  };
  await writeFile(
    join(outputDirectory, 'TIER2_CAMPAIGN.json'),
    `${JSON.stringify(finalEvidence, null, 2)}\n`,
    { mode: 0o600 },
  );
  if (campaignError !== null) throw campaignError;
  if (cleanup.status !== 'PASS') throw new Error('Tier-2 resource cleanup failed');
}

const outputDirectory = resolve(argument('--output') ?? 'tier2-evidence');
const recoveryRunId = argument('--sweep-run-id');
if (recoveryRunId) {
  await sweepRunResources(outputDirectory, recoveryRunId);
} else if (process.argv.includes('--sweep-expired')) {
  await sweepExpired(outputDirectory);
} else {
  await runCampaign(outputDirectory);
}

process.stdout.write(`Tier-2 evidence written to ${basename(outputDirectory)}\n`);
