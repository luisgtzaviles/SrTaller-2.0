import { randomInt, randomUUID } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

import {
  ensureLocalEnvironment,
  localUserRows,
} from './lib/local-development.mjs';

const origin = 'http://127.0.0.1:4173';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (process.platform !== 'darwin') {
  throw new Error('PBI-043 visible Chrome proof is available only on local macOS.');
}

const values = await ensureLocalEnvironment();
const ownerPin = values.SR_LOCAL_PIN_LUIS;
const qaUser = localUserRows().find(
  (user) => user.operationalIdentifier === 'JORGE',
);
if (!/^\d{4}$/u.test(ownerPin ?? '') || !qaUser) {
  throw new Error('Governed local Owner/QA fixtures are unavailable.');
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.telemetry = {
      consoleErrors: 0,
      runtimeExceptions: 0,
      failedRequests: 0,
      serverErrors: 0,
      navigationAborts: 0,
      networkConsoleEntries: 0,
    };
    this.socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) {
        if (message.method === 'Runtime.exceptionThrown') {
          this.telemetry.consoleErrors += 1;
        }
        if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
          this.telemetry.consoleErrors += 1;
        }
        if (message.method === 'Log.entryAdded' && message.params?.entry?.level === 'error') {
          if (message.params.entry.source === 'network') {
            this.telemetry.networkConsoleEntries += 1;
          } else {
            this.telemetry.consoleErrors += 1;
          }
        }
        if (message.method === 'Runtime.exceptionThrown') {
          this.telemetry.runtimeExceptions += 1;
        }
        if (message.method === 'Network.loadingFailed') {
          if (
            message.params?.canceled ||
            message.params?.errorText === 'net::ERR_ABORTED'
          ) {
            this.telemetry.navigationAborts += 1;
          } else {
            this.telemetry.failedRequests += 1;
          }
        }
        if (
          message.method === 'Network.responseReceived' &&
          message.params?.response?.status >= 500
        ) this.telemetry.serverErrors += 1;
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    return this;
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (typeof address === 'string' || address === null) {
    server.close();
    throw new Error('Could not reserve a Chrome debugging port.');
  }
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function waitForPage(port, marker) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
        (response) => response.json(),
      );
      const page = targets.find(
        (target) =>
          target.type === 'page' &&
          target.url.startsWith(origin) &&
          target.url.includes(marker),
      );
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Visible Chrome profile did not expose the local page.');
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const description =
      result.exceptionDetails.exception?.description ??
      result.exceptionDetails.text ??
      'unknown';
    throw new Error(`Chrome runtime evaluation failed: ${description}`);
  }
  return result.result.value;
}

const request = (path, options = {}) => `(async () => {
  const response = await fetch(${JSON.stringify(`${origin}${path}`)}, ${JSON.stringify(options)});
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
})()`;

async function snapshot(client) {
  const result = await evaluate(client, request('/api/access/session', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  }));
  if (result.status !== 200) throw new Error('Operational snapshot failed.');
  return result.body;
}

async function bootstrap(client) {
  const result = await evaluate(client, request('/api/stations/local-bootstrap', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  }));
  if (result.status !== 204) throw new Error('Local Station bootstrap failed.');
}

async function login(client, pin, expectedSessionId = null) {
  const before = await snapshot(client);
  const result = await evaluate(client, request('/api/access/session', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-SR-CSRF-Token': before.csrfToken,
    },
    body: JSON.stringify({ expectedSessionId, pin }),
  }));
  if (result.status !== 201 || !result.body?.session) {
    throw new Error('Operational login/switch failed.');
  }
  return result.body;
}

async function logout(client) {
  const before = await snapshot(client);
  const result = await evaluate(client, request('/api/access/session', {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-SR-CSRF-Token': before.csrfToken,
    },
  }));
  if (result.status !== 204) throw new Error('Operational logout failed.');
}

async function replaceQaPin(owner, qaPin) {
  const before = await snapshot(owner);
  const result = await evaluate(owner, request(
    `/api/access/administration/users/${qaUser.userId}/pin`,
    {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-SR-CSRF-Token': before.csrfToken,
      },
      body: JSON.stringify({
        clientRequestId: randomUUID(),
        pin: qaPin,
      }),
    },
  ));
  return result.status;
}

async function waitForDomRoute(client, path, expectedHeading) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const state = await evaluate(client, `(() => {
      const headings = [...document.querySelectorAll('h1, h2')]
        .map((element) => element.textContent?.trim() ?? '');
      const body = document.body?.innerText ?? '';
      return {
        ready: document.readyState,
        pathname: location.pathname,
        heading: headings.includes(${JSON.stringify(expectedHeading)}),
        authenticated: !body.includes('Ingresa tu PIN'),
      };
    })()`);
    if (
      state.ready === 'complete' &&
      state.pathname === path &&
      state.heading &&
      state.authenticated
    ) return state;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Authenticated DOM route did not settle: ${path}`);
}

async function reload(client, path, expectedHeading) {
  await client.send('Page.reload', { ignoreCache: true });
  await waitForDomRoute(client, path, expectedHeading);
}

async function navigate(client, path, title, expectedHeading) {
  await client.send('Page.navigate', { url: `${origin}${path}` });
  await waitForDomRoute(client, path, expectedHeading);
  await evaluate(
    client,
    `document.title = ${JSON.stringify(title)}; document.title`,
  );
}

async function screenshot(client, path) {
  const result = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  await writeFile(path, Buffer.from(result.data, 'base64'));
}

function launch(profileDirectory, port, windowPosition, marker) {
  const child = spawn(chrome, [
    `--user-data-dir=${profileDirectory}`,
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--enable-automation',
    `--window-position=${windowPosition}`,
    '--window-size=960,900',
    '--new-window',
    `${origin}/reparaciones?${marker}`,
  ], { detached: true, stdio: 'ignore' });
  child.unref();
  return child;
}

const root = await mkdtemp(join(tmpdir(), 'srtaller-pbi043-chrome-'));
const ownerDirectory = join(root, 'owner');
const qaDirectory = join(root, 'qa');
const [ownerPort, qaPort] = await Promise.all([reservePort(), reservePort()]);
if (ownerPort === qaPort) throw new Error('Chrome debugging ports must be distinct.');
const marker = `pbi043=${randomUUID()}`;
const ownerProcess = launch(ownerDirectory, ownerPort, '0,30', marker);
const qaProcess = launch(qaDirectory, qaPort, '980,30', marker);

const ownerTarget = await waitForPage(ownerPort, marker);
const qaTarget = await waitForPage(qaPort, marker);
const owner = await new CdpClient(ownerTarget.webSocketDebuggerUrl).open();
const qa = await new CdpClient(qaTarget.webSocketDebuggerUrl).open();
let proofPassed = false;

try {
  await Promise.all([
    owner.send('Page.enable'),
    owner.send('Runtime.enable'),
    owner.send('Network.enable'),
    owner.send('Log.enable'),
    qa.send('Page.enable'),
    qa.send('Runtime.enable'),
    qa.send('Network.enable'),
    qa.send('Log.enable'),
  ]);
  const [ownerCommandLine, qaCommandLine] = await Promise.all([
    owner.send('Browser.getBrowserCommandLine'),
    qa.send('Browser.getBrowserCommandLine'),
  ]);
  if (
    !ownerCommandLine.arguments.includes(`--user-data-dir=${ownerDirectory}`) ||
    !qaCommandLine.arguments.includes(`--user-data-dir=${qaDirectory}`) ||
    !ownerCommandLine.arguments.includes(`--remote-debugging-port=${ownerPort}`) ||
    !qaCommandLine.arguments.includes(`--remote-debugging-port=${qaPort}`)
  ) throw new Error('CDP targets do not belong to the launched isolated profiles.');

  await Promise.all([
    owner.send('Page.navigate', { url: `${origin}/reparaciones` }),
    qa.send('Page.navigate', { url: `${origin}/reparaciones` }),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 800));
  const pageContexts = await Promise.all([
    evaluate(owner, '({ href: location.href, origin: location.origin, ready: document.readyState })'),
    evaluate(qa, '({ href: location.href, origin: location.origin, ready: document.readyState })'),
  ]);
  if (pageContexts.some((context) => context.origin !== origin)) {
    throw new Error(`Unexpected Chrome page context: ${JSON.stringify(pageContexts)}`);
  }
  await Promise.all([bootstrap(owner), bootstrap(qa)]);
  const ownerLogin = await login(owner, ownerPin);

  let qaPin;
  let pinStatus = 0;
  for (let attempt = 0; attempt < 20 && pinStatus !== 201; attempt += 1) {
    qaPin = String(randomInt(1_000, 10_000));
    if (qaPin === ownerPin) continue;
    pinStatus = await replaceQaPin(owner, qaPin);
  }
  if (pinStatus !== 201 || !qaPin) {
    throw new Error('Could not provision an isolated synthetic QA PIN.');
  }

  const qaLogin = await login(qa, qaPin);
  if (
    ownerLogin.station.stationId !== qaLogin.station.stationId ||
    ownerLogin.session.sessionId === qaLogin.session.sessionId ||
    ownerLogin.session.userId === qaLogin.session.userId
  ) throw new Error('Owner and QA did not establish independent Sessions.');

  await Promise.all([
    reload(owner, '/reparaciones', 'Reparaciones'),
    reload(qa, '/reparaciones', 'Reparaciones'),
  ]);
  const [ownerReloaded, qaReloaded] = await Promise.all([
    snapshot(owner),
    snapshot(qa),
  ]);
  if (
    ownerReloaded.session?.sessionId !== ownerLogin.session.sessionId ||
    qaReloaded.session?.sessionId !== qaLogin.session.sessionId
  ) throw new Error('Independent Sessions did not survive reload.');

  await logout(qa);
  const [ownerAfterQaLogout, qaAfterLogout] = await Promise.all([
    snapshot(owner),
    snapshot(qa),
  ]);
  if (
    ownerAfterQaLogout.session?.sessionId !== ownerLogin.session.sessionId ||
    qaAfterLogout.session !== null
  ) throw new Error('QA logout affected the wrong profile.');

  const qaRelogin = await login(qa, qaPin);
  const qaSwitched = await login(
    qa,
    ownerPin,
    qaRelogin.session.sessionId,
  );
  const ownerAfterQaSwitch = await snapshot(owner);
  if (
    ownerAfterQaSwitch.session?.sessionId !== ownerLogin.session.sessionId ||
    qaSwitched.session.sessionId === ownerLogin.session.sessionId ||
    qaSwitched.session.userId !== ownerLogin.session.userId
  ) throw new Error('QA switch affected the Owner profile.');

  const qaRestored = await login(qa, qaPin, qaSwitched.session.sessionId);
  const ownerFinal = await snapshot(owner);
  if (
    ownerFinal.session?.sessionId !== ownerLogin.session.sessionId ||
    qaRestored.session.userId === ownerFinal.session.userId
  ) throw new Error('Final Owner/QA independence was not preserved.');

  await Promise.all([
    navigate(
      owner,
      '/reparaciones/nueva',
      'PBI-043 OWNER — sesión activa',
      'Nueva reparación',
    ),
    navigate(qa, '/reparaciones', 'PBI-043 QA — sesión activa', 'Reparaciones'),
  ]);
  await Promise.all([
    screenshot(owner, join(root, 'owner.png')),
    screenshot(qa, join(root, 'qa.png')),
  ]);

  const telemetry = {
    consoleErrors: owner.telemetry.consoleErrors + qa.telemetry.consoleErrors,
    runtimeExceptions:
      owner.telemetry.runtimeExceptions + qa.telemetry.runtimeExceptions,
    failedRequests: owner.telemetry.failedRequests + qa.telemetry.failedRequests,
    serverErrors: owner.telemetry.serverErrors + qa.telemetry.serverErrors,
    navigationAborts:
      owner.telemetry.navigationAborts + qa.telemetry.navigationAborts,
    networkConsoleEntries:
      owner.telemetry.networkConsoleEntries + qa.telemetry.networkConsoleEntries,
  };
  if (
    telemetry.consoleErrors !== 0 ||
    telemetry.runtimeExceptions !== 0 ||
    telemetry.failedRequests !== 0 ||
    telemetry.serverErrors !== 0
  ) {
    throw new Error(`Chrome telemetry contains failures: ${JSON.stringify(telemetry)}`);
  }
  const evidence = {
    status: 'PASS',
    origin,
    stationShared: true,
    usersDistinct: true,
    sessionsDistinct: true,
    reloadPreservedBoth: true,
    qaLogoutPreservedOwner: true,
    qaReloginPreservedOwner: true,
    qaSwitchPreservedOwner: true,
    finalOwnerRoute: '/reparaciones/nueva',
    finalQaRoute: '/reparaciones',
    authenticatedDomRoutesVerified: true,
    telemetry,
    capturedRequestPayloads: false,
    screenshots: [join(root, 'owner.png'), join(root, 'qa.png')],
    profileDirectories: [ownerDirectory, qaDirectory],
    processIds: [ownerProcess.pid, qaProcess.pid],
    debuggingPorts: [ownerPort, qaPort],
  };
  const serializedEvidence = JSON.stringify(evidence, null, 2);
  if (
    serializedEvidence.includes(ownerPin) ||
    serializedEvidence.includes(qaPin)
  ) throw new Error('Chrome evidence contains a PIN secret.');
  process.stdout.write(`${serializedEvidence}\n`);
  proofPassed = true;
} finally {
  owner.close();
  qa.close();
  if (!proofPassed) {
    for (const child of [ownerProcess, qaProcess]) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        // The failed Chrome process is already gone.
      }
    }
  }
}
