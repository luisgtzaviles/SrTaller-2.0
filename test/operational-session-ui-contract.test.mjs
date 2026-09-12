import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createLatestRequestCommitGuard,
  isLatestOperationGeneration,
} from '../apps/dev-preview-web/src/session/latest-request-commit-guard.mjs';
import {
  parseSessionCapabilities,
} from '../apps/dev-preview-web/src/session/session-capabilities.mjs';

const [
  appSource,
  apiSource,
  gateSource,
  providerSource,
  gateStyles,
  shellSource,
  shellStyles,
  localDevSource,
  localBackendSource,
  coordinatorSource,
] = await Promise.all([
  readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/session/session-api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/session/OperationalSessionGate.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/session/SessionProvider.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/session/operational-session-gate.module.css', 'utf8'),
  readFile('apps/dev-preview-web/src/components/shell/ApplicationShell.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/shell/application-shell.module.css', 'utf8'),
  readFile('scripts/local-dev.mjs', 'utf8'),
  readFile('scripts/local-backend.mjs', 'utf8'),
  readFile('apps/dev-preview-web/src/session/session-request-coordinator.mjs', 'utf8'),
]);

function sourceSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

test('session HTTP client uses the single cookie-backed, CSRF-protected contract', () => {
  assert.match(apiSource, /const SESSION_PATH = '\/api\/access\/session';/u);
  assert.doesNotMatch(apiSource, /\/api\/access\/session\/local-pin/u);
  assert.match(apiSource, /const LOCAL_STATION_BOOTSTRAP_PATH = '\/api\/stations\/local-bootstrap';/u);
  assert.equal(apiSource.match(/credentials: 'include'/gu)?.length, 4);
  assert.equal(apiSource.match(/cache: 'no-store'/gu)?.length, 4);
  assert.equal(apiSource.match(/\[CSRF_HEADER\]: before\.csrfToken/gu)?.length, 2);
  assert.equal(apiSource.match(/'Content-Type': 'application\/json'/gu)?.length, 2);
  assert.match(apiSource, /body: JSON\.stringify\(\{[\s\S]*?pin: request\.pin,[\s\S]*?expectedSessionId,/u);
  assert.doesNotMatch(
    sourceSection(apiSource, 'export async function startOrSwitchOperationalSession', 'export async function logoutOperationalSession'),
    /userId: request\.userId/u,
  );
  assert.doesNotMatch(apiSource, /login-context|localStorage|sessionStorage/iu);

  const bootstrap = sourceSection(
    apiSource,
    'export async function bootstrapLocalStation',
    'export async function startOrSwitchOperationalSession',
  );
  assert.match(bootstrap, /method: 'POST'/u);
  assert.doesNotMatch(bootstrap, /body:/u);

  const logout = sourceSection(
    apiSource,
    'export async function logoutOperationalSession',
    '\n}',
  );
  assert.match(logout, /method: 'DELETE'/u);
  assert.match(logout, /'Content-Type': 'application\/json'/u);
  assert.match(logout, /\[CSRF_HEADER\]: before\.csrfToken/u);
  assert.doesNotMatch(logout, /body:/u);
});

test('browser coordination serializes complete Session exchanges and publishes only invalidation', () => {
  assert.match(coordinatorSource, /globalThis\.navigator\?\.locks/u);
  assert.match(coordinatorSource, /new Channel\(CHANNEL_NAME\)/u);
  assert.match(coordinatorSource, /LOCK_NAME,[\s\S]*?\{ mode: 'exclusive', signal: exchange\.signal \}/u);
  assert.match(coordinatorSource, /DEFAULT_EXCHANGE_TIMEOUT_MS = 15_000/u);
  assert.match(coordinatorSource, /exchange\.abort\(new OperationalSessionCoordinationError\(\)\)/u);
  assert.match(coordinatorSource, /publishChange\('session-changing'\)/u);
  assert.match(coordinatorSource, /publishChange\('session-changed'\)/u);
  assert.match(coordinatorSource, /channel\.postMessage\(\{ type, version: 1 \}\)/u);
  assert.doesNotMatch(coordinatorSource, /localStorage|sessionStorage/iu);
  assert.doesNotMatch(
    sourceSection(coordinatorSource, 'const publishChange =', '\n  };'),
    /actor|bearer|csrf|pin|sessionId|userId/iu,
  );

  const start = sourceSection(
    apiSource,
    'export async function startOrSwitchOperationalSession',
    'export async function logoutOperationalSession',
  );
  assert.match(start, /const before = await requestSnapshot\(signal\)/u);
  assert.match(start, /sessionId\(before\) !== expectedSessionId/u);
  assert.match(start, /markMayHaveChanged\(\)/u);
  assert.match(start, /const confirmed = await requestSnapshot\(signal\)/u);
  assert.match(start, /sessionId\(confirmed\) !== created\.session\.sessionId/u);
  assert.ok(
    start.indexOf('markMayHaveChanged()') < start.indexOf('const response = await fetch'),
    'peer snapshots must be invalidated before the Session POST is dispatched',
  );

  const logout = apiSource.slice(apiSource.indexOf('export async function logoutOperationalSession'));
  assert.match(logout, /const before = await requestSnapshot\(signal\)/u);
  assert.match(logout, /sessionId\(before\) !== expectedSessionId/u);
  assert.match(logout, /const confirmed = await requestSnapshot\(signal\)/u);
  assert.ok(
    logout.indexOf('markMayHaveChanged()') < logout.indexOf('const response = await fetch'),
    'peer snapshots must be invalidated before the Session DELETE is dispatched',
  );
});

test('remote mutation invalidation hides the actor before queued reconciliation', () => {
  const subscription = sourceSection(
    gateSource,
    'const invalidate = (background = false): void => {',
    '    let unsubscribe:',
  );
  assert.match(subscription, /operationGeneration\.current \+= 1/u);
  assert.match(subscription, /pending = true/u);
  assert.match(subscription, /if \(!background\) \{[\s\S]*?setSnapshot\(null\)[\s\S]*?setPhase\('loading'\)/u);
  assert.match(subscription, /void reconcile\(\)/u);
  assert.ok(
    subscription.indexOf("setPhase('loading')") < subscription.indexOf('void reconcile()'),
    'the verified actor must be hidden before reconciliation waits for the Session lock',
  );
  assert.match(gateSource, /subscribeToRemoteSessionChanges\(\(\) => invalidate\(false\)\)/u);
  assert.match(gateSource, /window\.addEventListener\(SESSION_INVALIDATED_EVENT, localInvalidation\)/u);
});

test('session snapshots fail closed before reaching the shell', () => {
  assert.match(apiSource, /administrationCapabilities: readonly OperationalCapability\[\]/u);
  assert.match(apiSource, /parseSessionCapabilities\([\s\S]*?value\.administrationCapabilities,[\s\S]*?session !== null/u);
  assert.doesNotMatch(apiSource, /value\.administrationCapabilities \?\? \[\]/u);
  assert.match(gateSource, /administrationCapabilities: snapshot\.administrationCapabilities/u);
  assert.match(appSource, /capabilities=\{administrationCapabilities\} capability="users\.read"/u);
  assert.match(appSource, /capabilities=\{administrationCapabilities\} capability="access_matrix\.read"/u);
  assert.match(apiSource, /const CSRF_PATTERN = \/\^\[A-Za-z0-9_-\]\{43\}\$\/u/u);
  assert.match(apiSource, /session\.stationId !== station\.stationId/u);
  assert.match(apiSource, /session\.branchId !== station\.branchId/u);
  assert.match(apiSource, /typeof hasEligibleUsers !== 'boolean'/u);
  assert.match(apiSource, /if \(!isRecord\(value\) \|\| value\.status !== 'active'\)/u);
  assert.match(apiSource, /const session = parseActiveSession\(value\.session, station\)/u);
  assert.match(apiSource, /if \(session === null\) \{[\s\S]*?revalidateAfterMs !== null/u);
  assert.match(apiSource, /typeof revalidateAfterMs !== 'number'/u);
  assert.match(apiSource, /!Number\.isSafeInteger\(revalidateAfterMs\)/u);
  assert.match(apiSource, /revalidateAfterMs < 1_000/u);
  assert.match(apiSource, /revalidateAfterMs > 60 \* 60 \* 1_000/u);
});

test('tenant-wide administration grants satisfy the browser catalog-order contract', () => {
  assert.deepEqual(parseSessionCapabilities([
    'users.read',
    'users.manage',
    'access_matrix.read',
    'access_matrix.manage',
  ], true), [
    'users.read',
    'users.manage',
    'access_matrix.read',
    'access_matrix.manage',
  ]);
});

test('provider bootstraps only a missing local Station and treats session null as the login gate', () => {
  assert.match(providerSource, /OperationalSessionGate as SessionProvider/u);
  assert.match(appSource, /<SessionProvider>/u);
  assert.match(appSource, /actor=\{session\}/u);
  assert.match(gateSource, /error\.status !== 401/u);
  assert.match(gateSource, /__SRT_DEPLOY_ENV__ !== 'local'/u);
  assert.match(gateSource, /await bootstrapLocalStationOnce\(\);[\s\S]*?getOperationalSession\(controller\.signal\)/u);
  assert.match(gateSource, /current\.finally\([\s\S]*?localStationBootstrapRequest = null/u);
  assert.match(gateSource, /if \(!snapshot\.session \|\| switching\)/u);
  assert.match(gateSource, /function LoginPage/u);
  assert.doesNotMatch(gateSource, /localStorage|sessionStorage/iu);
  assert.match(gateSource, /Sucursal vinculada/u);
  assert.match(gateSource, /Contexto confirmado/u);
  assert.doesNotMatch(apiSource, /JSON\.stringify\([^\n]*(?:stationId|branchId|tenantId)/u);
});

test('login page uses the four-digit PIN-only flow without exposing a user directory', () => {
  assert.match(gateSource, /const PIN_PATTERN = \/\^\\d\{4\}\$\/u/u);
  assert.match(gateSource, /inputMode="numeric"/u);
  assert.match(gateSource, /autoComplete="off"/u);
  assert.match(gateSource, /pattern="\[0-9\]\{4\}"/u);
  assert.match(gateSource, /minLength=\{4\}/u);
  assert.match(gateSource, /maxLength=\{4\}/u);
  assert.match(gateSource, /replace\(\/\\D\/gu, ''\)\.slice\(0, 4\)/u);
  assert.ok(gateSource.indexOf("setPin('');") < gateSource.indexOf('await onAuthenticate(submittedPin);'));
  assert.match(gateSource, /pinRef\.current\?\.focus\(\)/u);
  assert.match(gateSource, /aria-invalid=\{pinHasError \|\| undefined\}/u);
  assert.match(gateSource, /aria-describedby=\{`operational-pin-hint\$\{pinHasError \? ' session-error' : ''\}`\}/u);
  assert.match(gateSource, /Se usa sólo para esta verificación y no se guarda en el almacenamiento del navegador/u);
  assert.match(gateSource, /styles\.pinKeypad/u);
  assert.doesNotMatch(gateSource, /operational-user|selectedUserId|UserRoundCheck/u);
  assert.match(gateSource, /submitting \|\| busy \? 'Procesando…'/u);
  assert.match(gateSource, /event\.key === 'Escape'/u);
  assert.match(gateSource, /<form[\s\S]*?onSubmit=/u);
  assert.match(gateSource, /<DeferredLoadingGate \/>/u);
  assert.match(gateSource, /<FailedGate onRetry=/u);
});

test('fast Session verification stays visually quiet while slow verification remains explicit', () => {
  assert.match(gateSource, /const SESSION_LOADING_FEEDBACK_DELAY_MS = 180;/u);
  const deferred = sourceSection(
    gateSource,
    'function DeferredLoadingGate()',
    'function FailedGate',
  );
  assert.match(deferred, /const \[visible, setVisible\] = useState\(false\)/u);
  assert.match(deferred, /window\.setTimeout\([\s\S]*?SESSION_LOADING_FEEDBACK_DELAY_MS/u);
  assert.match(deferred, /window\.clearTimeout\(timer\)/u);
  assert.match(deferred, /visible[\s\S]*?<LoadingGate \/>[\s\S]*?styles\.deferredLoading/u);
  assert.match(deferred, /aria-busy="true"/u);
  assert.match(gateStyles, /\.deferredLoading \{[\s\S]*?min-height: 100dvh;[\s\S]*?background: var\(--color-canvas\)/u);
});

test('active Session revalidation is server-scheduled and runs on timer, focus, and visibility', () => {
  assert.match(gateSource, /function sessionRevalidationDelay\(revalidateAfterMs: number\)/u);
  assert.match(gateSource, /revalidateAfterMs \+ SESSION_REVALIDATION_EPSILON_MS/u);
  assert.match(gateSource, /if \(snapshot\.revalidateAfterMs === null\) return undefined/u);
  assert.match(gateSource, /const delay = sessionRevalidationDelay\(snapshot\.revalidateAfterMs\)/u);
  assert.match(gateSource, /window\.setTimeout\(\(\) => void revalidate\(\), delay\)/u);
  assert.match(gateSource, /window\.addEventListener\('focus', revalidate\)/u);
  assert.match(gateSource, /document\.addEventListener\('visibilitychange', handleVisibility\)/u);
  assert.match(gateSource, /window\.addEventListener\('pageshow', revalidate\)/u);
  assert.match(gateSource, /inFlight\?\.abort\(\)/u);
  assert.match(gateSource, /const requestGuard = createLatestRequestCommitGuard\(\)/u);
  assert.match(gateSource, /const permit = requestGuard\.start\(\)/u);
  assert.match(
    gateSource,
    /!permit\.mayCommit\(\) \|\|\s+!isLatestOperationGeneration\(operationGeneration\.current, generation\)/u,
  );
  assert.match(gateSource, /requestGuard\.dispose\(\)/u);
  assert.doesNotMatch(gateSource, /Date\.now\(\)|Date\.parse\(session\.(?:lastActivityAt|expiresAt)\)/u);
});

test('active Session revalidation commits only the latest non-disposed response', async () => {
  const guard = createLatestRequestCommitGuard();
  const committed = [];

  const run = async (response) => {
    const permit = guard.start();
    assert.ok(permit);
    const value = await response;
    if (permit.mayCommit()) committed.push(value);
  };

  const first = Promise.withResolvers();
  const second = Promise.withResolvers();
  const firstRun = run(first.promise);
  const secondRun = run(second.promise);

  second.resolve('newest');
  await secondRun;
  first.resolve('stale');
  await firstRun;
  assert.deepEqual(committed, ['newest']);

  const afterDispose = Promise.withResolvers();
  const disposedRun = run(afterDispose.promise);
  guard.dispose();
  afterDispose.resolve('disposed');
  await disposedRun;
  assert.deepEqual(committed, ['newest']);
  assert.equal(guard.start(), null);
});

test('mutation failures cannot overwrite a newer operational Session result', async () => {
  let currentGeneration = 0;
  const committed = [];
  const run = async (response, failureLabel) => {
    const generation = ++currentGeneration;
    try {
      const value = await response;
      if (isLatestOperationGeneration(currentGeneration, generation)) committed.push(value);
    } catch {
      if (isLatestOperationGeneration(currentGeneration, generation)) {
        committed.push(failureLabel);
      }
    }
  };

  const stale = Promise.withResolvers();
  const latest = Promise.withResolvers();
  const staleRun = run(stale.promise, 'stale-failure');
  const latestRun = run(latest.promise, 'latest-failure');

  latest.resolve('latest-success');
  await latestRun;
  stale.reject(new Error('stale request failed'));
  await staleRun;

  assert.deepEqual(committed, ['latest-success']);
});

test('switch, cancellation, and logout reconcile server truth and restore deterministic focus', () => {
  const authenticate = sourceSection(
    gateSource,
    'const authenticate = useCallback',
    'const logout = useCallback',
  );
  assert.match(authenticate, /const previousSessionId = snapshot\.session\?\.sessionId \?\? null/u);
  assert.match(authenticate, /startOrSwitchOperationalSession\(\{ pin \}, previousSessionId\)/u);
  assert.match(authenticate, /verified\.session\.sessionId !== previousSessionId/u);
  assert.match(authenticate, /setSwitching\(verified\.session !== null && previousSessionId !== null\)/u);
  assert.match(authenticate, /setFocusTarget\('main'\)/u);

  const logout = sourceSection(
    gateSource,
    'const logout = useCallback',
    'const beginUserSwitch = useCallback',
  );
  assert.match(logout, /await logoutOperationalSession\(expectedSessionId\)/u);
  assert.match(logout, /const verified = await getOperationalSession\(\)/u);
  assert.match(logout, /La identidad verificada continúa activa/u);
  assert.match(
    logout,
    /catch \{\s+if \(!isLatestOperationGeneration\(operationGeneration\.current, generation\)\) return;\s+setSnapshot\(null\);\s+setPhase\('failed'\);/u,
  );

  const switchPreparation = sourceSection(
    gateSource,
    'const beginUserSwitch = useCallback',
    'const cancelUserSwitch = useCallback',
  );
  assert.match(
    switchPreparation,
    /catch \{\s+if \(!isLatestOperationGeneration\(operationGeneration\.current, generation\)\) return;\s+setSnapshot\(null\);\s+setSwitching\(false\);\s+setPhase\('failed'\);/u,
  );

  const cancellation = sourceSection(
    gateSource,
    'const cancelUserSwitch = useCallback',
    "if (phase === 'loading')",
  );
  assert.match(cancellation, /const next = await getOperationalSession\(\)/u);
  assert.match(cancellation, /setFocusTarget\(next\.session \? 'operator' : null\)/u);
  assert.match(gateSource, /focusTarget,/u);
  assert.match(shellSource, /focusTarget === 'operator'/u);
  assert.match(shellSource, /operatorTriggerRef\.current\?\.focus\(\)/u);
  assert.match(shellSource, /document\.getElementById\('main-content'\)\?\.focus\(\)/u);
});

test('authenticated shell renders the verified actor and honest local fixture boundary', () => {
  assert.match(shellSource, /<strong>\{actor\.displayName\}<\/strong><small>Sesión operativa<\/small>/u);
  assert.match(shellSource, /Cambiar usuario/u);
  assert.match(shellSource, /Cerrar sesión/u);
  assert.match(shellSource, /onClick=\{onLogout\}/u);
  assert.match(shellSource, /contexto confiable y la sesión provienen del servidor local/iu);
  assert.match(shellSource, /fixtures sintéticos/iu);
  assert.match(shellSource, /no corresponde a Production/iu);
  assert.doesNotMatch(shellSource, /Operador sintético|Sin identidad integrada|Cerrar sesión no disponible/iu);
  assert.match(shellSource, /aria-label=\{`Abrir menú de \$\{actor\.displayName\}`\}/u);
  assert.match(shellStyles, /overflow-wrap: anywhere/u);
  assert.match(shellSource, /<span>\{busy \? 'Procesando…' : 'Cerrar sesión'\}<\/span>/u);
});

test('login gate is mobile-first and covers the governed responsive widths', () => {
  assert.match(gateStyles, /min-height: 100dvh/u);
  assert.match(gateStyles, /width: min\(100%, 1180px\)/u);
  assert.match(gateStyles, /@media \(min-width: 768px\)/u);
  assert.match(gateStyles, /@media \(min-width: 1024px\)/u);
  assert.match(gateStyles, /@media \(min-width: 1280px\)/u);
  assert.match(gateStyles, /\.actions \{[\s\S]*?flex-direction: column/u);
  const actions = sourceSection(gateSource, '<div className={styles.actions}>', '</div>\n          </form>');
  assert.ok(
    actions.indexOf('>Cancelar</Button>') <
      actions.indexOf('type="submit"'),
    'mobile visual order must follow the DOM focus order: cancel, then submit',
  );
  assert.match(gateStyles, /@media \(min-width: 768px\) \{[\s\S]*?\.actions \{[\s\S]*?flex-direction: row/u);
});

test('local child processes scrub inherited governed secrets and inject only active consumers', () => {
  for (const source of [localDevSource, localBackendSource]) {
    for (const key of [
      'SR_PIN_PEPPER',
      'SR_SESSION_SIGNING_KEY',
      'SR_STATION_BOOTSTRAP_SECRET',
      'SR_USER_BOOTSTRAP_SECRET',
    ]) assert.match(source, new RegExp(`'${key}'`, 'u'));
    assert.match(source, /delete baseEnvironment\[key\]/u);
    assert.match(source, /SR_PIN_PEPPER: values\.SR_PIN_PEPPER/u);
    assert.match(source, /SR_STATION_BOOTSTRAP_SECRET: values\.SR_STATION_BOOTSTRAP_SECRET/u);
    assert.doesNotMatch(source, /SR_SESSION_SIGNING_KEY:\s*values/u);
    assert.doesNotMatch(source, /SR_USER_BOOTSTRAP_SECRET:\s*values/u);
  }

  const frontendSpawn = localDevSource.slice(localDevSource.indexOf("const frontend = spawn"));
  assert.doesNotMatch(frontendSpawn, /SR_PIN_PEPPER:|SR_SESSION_SIGNING_KEY:|SR_STATION_BOOTSTRAP_SECRET:|SR_USER_BOOTSTRAP_SECRET:/u);
  assert.match(frontendSpawn, /env: \{ \.\.\.baseEnvironment, \.\.\.viteEnvironment\(values, provenanceEnvironment\) \}/u);
  assert.match(localDevSource, /inspectWorkingTreeProvenance/u);
  assert.match(localDevSource, /waitForLiveRuntimeProvenance/u);
});
