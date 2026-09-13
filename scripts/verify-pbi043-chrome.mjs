import { randomInt, randomUUID } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

import {
  ensureLocalEnvironment,
  localUserRows,
} from './lib/local-development.mjs';

const origin = 'http://127.0.0.1:4173';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ownerPort = 19_243;
const qaPort = 19_244;

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
    this.socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
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

async function waitForPage(port) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
        (response) => response.json(),
      );
      const page = targets.find(
        (target) => target.type === 'page' && target.url.startsWith(origin),
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

async function reload(client) {
  await client.send('Page.reload', { ignoreCache: true });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

async function navigate(client, path, title) {
  await client.send('Page.navigate', { url: `${origin}${path}` });
  await new Promise((resolve) => setTimeout(resolve, 800));
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

function launch(profileDirectory, port, windowPosition) {
  const child = spawn(chrome, [
    `--user-data-dir=${profileDirectory}`,
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--window-position=${windowPosition}`,
    '--window-size=960,900',
    '--new-window',
    `${origin}/reparaciones`,
  ], { detached: true, stdio: 'ignore' });
  child.unref();
}

const root = await mkdtemp(join(tmpdir(), 'srtaller-pbi043-chrome-'));
const ownerDirectory = join(root, 'owner');
const qaDirectory = join(root, 'qa');
launch(ownerDirectory, ownerPort, '0,30');
launch(qaDirectory, qaPort, '980,30');

const ownerTarget = await waitForPage(ownerPort);
const qaTarget = await waitForPage(qaPort);
const owner = await new CdpClient(ownerTarget.webSocketDebuggerUrl).open();
const qa = await new CdpClient(qaTarget.webSocketDebuggerUrl).open();

try {
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

  await Promise.all([reload(owner), reload(qa)]);
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
    navigate(owner, '/reparaciones/nueva', 'PBI-043 OWNER — sesión activa'),
    navigate(qa, '/reparaciones', 'PBI-043 QA — sesión activa'),
  ]);
  await Promise.all([
    screenshot(owner, join(root, 'owner.png')),
    screenshot(qa, join(root, 'qa.png')),
  ]);

  process.stdout.write(`${JSON.stringify({
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
    screenshots: [join(root, 'owner.png'), join(root, 'qa.png')],
    profileDirectories: [ownerDirectory, qaDirectory],
  }, null, 2)}\n`);
} finally {
  owner.close();
  qa.close();
}
