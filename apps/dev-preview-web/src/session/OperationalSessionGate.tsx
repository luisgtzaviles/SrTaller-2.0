import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyRound, LockKeyhole, Moon, ShieldCheck, Sun } from 'lucide-react';

import { Button, Input } from '../components/ui/controls.js';
import { Alert, Spinner } from '../components/ui/feedback.js';
import { useTheme } from '../foundation/theme.js';
import {
  OperationalSessionApiError,
  OperationalSessionStateChangedError,
  bootstrapLocalStation,
  getOperationalSession,
  logoutOperationalSession,
  startOrSwitchOperationalSession,
} from './session-api.js';
import { subscribeToRemoteSessionChanges } from './session-request-coordinator.mjs';
import type {
  ActiveOperationalSession,
  OperationalCapability,
  OperationalSessionSnapshot,
} from './session-api.js';
import {
  createLatestRequestCommitGuard,
  isLatestOperationGeneration,
} from './latest-request-commit-guard.mjs';
import styles from './operational-session-gate.module.css';

const PIN_PATTERN = /^\d{4}$/u;
const SESSION_REVALIDATION_MINIMUM_MS = 1_000;
const SESSION_REVALIDATION_EPSILON_MS = 25;
const MAX_BROWSER_TIMEOUT_MS = 2_147_483_647;
const SESSION_INVALIDATED_EVENT = 'srtaller:session-invalidated';
const EMPTY_CAPABILITIES: readonly OperationalCapability[] = Object.freeze([]);
let localStationBootstrapRequest: Promise<void> | null = null;

type LoginError = Readonly<{
  field: 'pin' | 'form';
  message: string;
}>;

function sessionRevalidationDelay(revalidateAfterMs: number): number {
  return Math.min(
    MAX_BROWSER_TIMEOUT_MS,
    Math.max(
      SESSION_REVALIDATION_MINIMUM_MS,
      revalidateAfterMs + SESSION_REVALIDATION_EPSILON_MS,
    ),
  );
}

class OperationalSessionNoLongerActiveError extends Error {
  constructor() {
    super('The previous Operational Session is no longer active.');
    this.name = 'OperationalSessionNoLongerActiveError';
  }
}

function bootstrapLocalStationOnce(): Promise<void> {
  if (!localStationBootstrapRequest) {
    const current = bootstrapLocalStation();
    localStationBootstrapRequest = current;
    void current.finally(() => {
      if (localStationBootstrapRequest === current) localStationBootstrapRequest = null;
    }).catch(() => undefined);
  }
  return localStationBootstrapRequest;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function ThemeControls(): React.JSX.Element {
  const { preference, setPreference } = useTheme();
  return (
    <div className={styles.themeControls} role="group" aria-label="Selector de tema">
      <button
        type="button"
        aria-label="Tema claro"
        aria-pressed={preference === 'light'}
        onClick={() => setPreference('light')}
      >
        <Sun aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        aria-label="Tema oscuro"
        aria-pressed={preference === 'dark'}
        onClick={() => setPreference('dark')}
      >
        <Moon aria-hidden="true" size={18} />
      </button>
    </div>
  );
}

function SessionFrame({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className={styles.gate}>
      <header className={styles.gateHeader}>
        <div className={styles.brand} aria-label="SR Taller 2.0">
          <span aria-hidden="true">SR</span>
          <strong>SR Taller <small>2.0</small></strong>
        </div>
        <ThemeControls />
      </header>
      {children}
    </div>
  );
}

function LoadingGate(): React.JSX.Element {
  return (
    <SessionFrame>
      <main className={styles.centeredState} aria-busy="true">
        <span className={styles.stateIcon}><Spinner label="Verificando sesión operativa" /></span>
        <h1>Verificando la estación</h1>
        <p>Estamos confirmando el contexto confiable y la sesión operativa.</p>
      </main>
    </SessionFrame>
  );
}

function FailedGate({ onRetry }: Readonly<{ onRetry(): void }>): React.JSX.Element {
  const retryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => retryRef.current?.focus(), []);
  return (
    <SessionFrame>
      <main className={styles.centeredState}>
        <span className={styles.stateIcon}><LockKeyhole aria-hidden="true" size={24} /></span>
        <h1>No se pudo verificar la estación</h1>
        <p>La aplicación permanece bloqueada hasta recuperar un contexto local confiable.</p>
        <Button ref={retryRef} tone="primary" onClick={onRetry}>Reintentar</Button>
      </main>
    </SessionFrame>
  );
}

function LoginPage({
  snapshot,
  currentSession,
  busy,
  onAuthenticate,
  onCancel,
}: Readonly<{
  snapshot: OperationalSessionSnapshot;
  currentSession: ActiveOperationalSession | null;
  busy: boolean;
  onAuthenticate(pin: string): Promise<void>;
  onCancel?: (() => Promise<void>) | undefined;
}>): React.JSX.Element {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const switching = currentSession !== null;
  const hasEligibleUsers = snapshot.hasEligibleUsers;
  const pinHasError = error?.field === 'pin';

  useEffect(() => {
    if (hasEligibleUsers) pinRef.current?.focus();
    else titleRef.current?.focus();
  }, [hasEligibleUsers]);

  useEffect(() => {
    if (!onCancel) return undefined;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !submitting && !busy) void onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel, submitting]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (!PIN_PATTERN.test(pin)) {
      setError({ field: 'pin', message: 'Ingresa los 4 dígitos de tu PIN.' });
      pinRef.current?.focus();
      return;
    }
    const submittedPin = pin;
    setPin('');
    setSubmitting(true);
    try {
      await onAuthenticate(submittedPin);
    } catch (error: unknown) {
      setError({
        field: 'form',
        message: error instanceof OperationalSessionNoLongerActiveError
          ? 'La sesión anterior terminó. Autentícate de nuevo para continuar.'
          : switching
            ? 'No fue posible cambiar de usuario. La sesión anterior continúa activa.'
            : 'No fue posible iniciar sesión. Verifica tus datos e intenta de nuevo.',
      });
      requestAnimationFrame(() => pinRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SessionFrame>
      <main className={styles.loginMain}>
        <section className={styles.contextPanel} aria-label="Contexto de estación">
          <span className={styles.contextIcon}><ShieldCheck aria-hidden="true" size={28} /></span>
          <p className={styles.eyebrow}>Contexto confiable</p>
          <h1>Sucursal vinculada</h1>
          <p>Tu estación está reconocida y lista para operar.</p>
          <dl>
            <div><dt>Estación</dt><dd>Reconocida</dd></div>
            <div><dt>Sucursal</dt><dd>Contexto confirmado</dd></div>
            <div><dt>Entorno</dt><dd>{__SRT_DEPLOY_ENV__ === 'local' ? 'Local' : 'Preview'}</dd></div>
          </dl>
        </section>

        <section className={styles.loginPanel} aria-labelledby="session-title">
          <div className={styles.loginIcon}><KeyRound aria-hidden="true" size={24} /></div>
          <p className={styles.eyebrow}>{switching ? 'Cambio de usuario' : 'Sesión operativa'}</p>
          <h2 ref={titleRef} id="session-title" tabIndex={hasEligibleUsers ? undefined : -1}>
            Ingresa tu PIN
          </h2>
          <p className={styles.loginDescription}>
            {switching
              ? `La sesión de ${currentSession.displayName} se conserva hasta validar el nuevo PIN.`
              : 'Tu PIN identifica tu sesión para esta sucursal.'}
          </p>

          {!hasEligibleUsers ? (
            <Alert tone="danger" title="Sin usuarios elegibles">
              No hay una identidad habilitada para operar en esta estación.
            </Alert>
          ) : null}

          <form className={styles.loginForm} onSubmit={(event) => void handleSubmit(event)} noValidate>
            <div className={styles.field}>
              <label htmlFor="operational-pin">PIN</label>
              <div className={styles.pinControl}>
                <KeyRound aria-hidden="true" size={18} />
                <Input
                  ref={pinRef}
                  id="operational-pin"
                  name="pin"
                  type="password"
                  value={pin}
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{4}"
                  minLength={4}
                  maxLength={4}
                  required
                  disabled={submitting || busy || !hasEligibleUsers}
                  aria-describedby={`operational-pin-hint${pinHasError ? ' session-error' : ''}`}
                  aria-invalid={pinHasError || undefined}
                  onChange={(event) => {
                    setPin(event.target.value.replace(/\D/gu, '').slice(0, 4));
                    if (pinHasError) setError(null);
                  }}
                />
              </div>
              <small id="operational-pin-hint">4 dígitos. Se usa sólo para esta verificación y no se guarda en el almacenamiento del navegador.</small>
            </div>

            <div className={styles.pinKeypad} role="group" aria-label="Teclado numérico">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={submitting || busy || !hasEligibleUsers}
                  onClick={() => {
                    setPin((current) => `${current}${digit}`.slice(0, 4));
                    if (pinHasError) setError(null);
                  }}
                >{digit}</button>
              ))}
              <button type="button" disabled={submitting || busy || !hasEligibleUsers} aria-label="Borrar último dígito" onClick={() => setPin((current) => current.slice(0, -1))}>←</button>
              <button type="button" disabled={submitting || busy || !hasEligibleUsers} onClick={() => {
                setPin((current) => `${current}0`.slice(0, 4));
                if (pinHasError) setError(null);
              }}>0</button>
              <button type="submit" disabled={submitting || busy || !hasEligibleUsers || pin.length !== 4} aria-label="Continuar con el PIN">✓</button>
            </div>

            <div id="session-error" className={styles.formMessage} role="alert" aria-live="assertive">
              {error?.message}
            </div>

            <div className={styles.actions}>
              {onCancel ? (
                <Button disabled={submitting || busy} onClick={() => void onCancel()}>Cancelar</Button>
              ) : null}
              <Button type="submit" tone="primary" disabled={submitting || busy || !hasEligibleUsers || pin.length !== 4}>
                {submitting || busy ? 'Procesando…' : 'Continuar'}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </SessionFrame>
  );
}

export interface AuthenticatedSessionView {
  readonly session: ActiveOperationalSession;
  readonly capabilities: readonly OperationalCapability[];
  readonly csrfToken: string;
  readonly busy: boolean;
  readonly errorMessage: string | null;
  readonly focusTarget: 'main' | 'operator' | null;
  beginUserSwitch(): void;
  logout(): void;
}

export function OperationalSessionGate({
  children,
}: Readonly<{
  children(view: AuthenticatedSessionView): React.ReactNode;
}>): React.JSX.Element {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [snapshot, setSnapshot] = useState<OperationalSessionSnapshot | null>(null);
  const [switching, setSwitching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<'main' | 'operator' | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const operationGeneration = useRef(0);

  useEffect(() => {
    let disposed = false;
    let reconciling = false;
    let pending = false;
    const reconcile = async (): Promise<void> => {
      if (reconciling) return;
      reconciling = true;
      while (pending && !disposed) {
        pending = false;
        const generation = operationGeneration.current;
        try {
          const next = await getOperationalSession();
          if (disposed || !isLatestOperationGeneration(operationGeneration.current, generation)) {
            continue;
          }
          setSnapshot(next);
          setSwitching(false);
          setPhase('ready');
        } catch {
          if (disposed || !isLatestOperationGeneration(operationGeneration.current, generation)) {
            continue;
          }
          setSnapshot(null);
          setSwitching(false);
          setPhase('failed');
        }
      }
      reconciling = false;
    };
    const invalidate = (): void => {
      operationGeneration.current += 1;
      pending = true;
      setBusy(false);
      setSwitching(false);
      setSnapshot(null);
      setPhase('loading');
      void reconcile();
    };
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToRemoteSessionChanges(invalidate);
      window.addEventListener(SESSION_INVALIDATED_EVENT, invalidate);
    } catch {
      setSnapshot(null);
      setPhase('failed');
    }
    return () => {
      disposed = true;
      unsubscribe?.();
      window.removeEventListener(SESSION_INVALIDATED_EVENT, invalidate);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const generation = operationGeneration.current;
    const initialize = async (): Promise<void> => {
      setPhase('loading');
      setErrorMessage(null);
      try {
        let next: OperationalSessionSnapshot;
        try {
          next = await getOperationalSession(controller.signal);
        } catch (error) {
          if (
            !(error instanceof OperationalSessionApiError) ||
            error.status !== 401 ||
            __SRT_DEPLOY_ENV__ !== 'local'
          ) throw error;
          await bootstrapLocalStationOnce();
          next = await getOperationalSession(controller.signal);
        }
        if (
          !controller.signal.aborted &&
          isLatestOperationGeneration(operationGeneration.current, generation)
        ) {
          setSnapshot(next);
          setSwitching(false);
          setPhase('ready');
        }
      } catch (error) {
        if (
          !controller.signal.aborted &&
          !isAbortError(error) &&
          isLatestOperationGeneration(operationGeneration.current, generation)
        ) {
          setSnapshot(null);
          setPhase('failed');
        }
      }
    };
    void initialize();
    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    if (phase !== 'ready' || !snapshot?.session || switching || busy) return undefined;
    if (snapshot.revalidateAfterMs === null) return undefined;
    const delay = sessionRevalidationDelay(snapshot.revalidateAfterMs);
    const requestGuard = createLatestRequestCommitGuard();
    let inFlight: AbortController | null = null;
    const revalidate = async (): Promise<void> => {
      const permit = requestGuard.start();
      if (!permit) return;
      const generation = operationGeneration.current;
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;
      try {
        const next = await getOperationalSession(controller.signal);
        if (
          !permit.mayCommit() ||
          !isLatestOperationGeneration(operationGeneration.current, generation)
        ) return;
        setSnapshot(next);
        setSwitching(false);
        setPhase('ready');
      } catch (error) {
        if (isAbortError(error)) return;
        if (
          permit.mayCommit() &&
          isLatestOperationGeneration(operationGeneration.current, generation)
        ) {
          setSnapshot(null);
          setPhase('failed');
        }
      }
    };
    const timer = window.setTimeout(() => void revalidate(), delay);
    const handleVisibility = (): void => {
      if (document.visibilityState === 'visible') void revalidate();
    };
    window.addEventListener('focus', revalidate);
    window.addEventListener('pageshow', revalidate);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      requestGuard.dispose();
      inFlight?.abort();
      window.clearTimeout(timer);
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('pageshow', revalidate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [busy, phase, snapshot?.revalidateAfterMs, snapshot?.session, switching]);

  const authenticate = useCallback(async (pin: string): Promise<void> => {
    if (!snapshot) throw new OperationalSessionApiError(0);
    const generation = operationGeneration.current + 1;
    operationGeneration.current = generation;
    setBusy(true);
    setErrorMessage(null);
    const previousSessionId = snapshot.session?.sessionId ?? null;
    try {
      const next = await startOrSwitchOperationalSession({ pin }, previousSessionId);
      if (!next.session) throw new OperationalSessionApiError(0);
      if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
      setSnapshot(next);
      setSwitching(false);
      setFocusTarget('main');
    } catch (error: unknown) {
      if (error instanceof OperationalSessionStateChangedError) {
        if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
        setSnapshot(error.snapshot);
        setSwitching(false);
        setFocusTarget(error.snapshot.session ? 'main' : null);
        return;
      }
      let verified: OperationalSessionSnapshot;
      try {
        verified = await getOperationalSession();
      } catch {
        if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
        setSnapshot(null);
        setSwitching(false);
        setPhase('failed');
        throw error;
      }
      if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
      setSnapshot(verified);
      if (verified.session && verified.session.sessionId !== previousSessionId) {
        setSwitching(false);
        setFocusTarget('main');
        return;
      }
      setSwitching(verified.session !== null && previousSessionId !== null);
      if (!verified.session && previousSessionId) {
        throw new OperationalSessionNoLongerActiveError();
      }
      throw error;
    } finally {
      if (isLatestOperationGeneration(operationGeneration.current, generation)) setBusy(false);
    }
  }, [snapshot]);

  const logout = useCallback((): void => {
    if (!snapshot?.session || busy) return;
    const expectedSessionId = snapshot.session.sessionId;
    const generation = operationGeneration.current + 1;
    operationGeneration.current = generation;
    const closeSession = async (): Promise<void> => {
      setBusy(true);
      setErrorMessage(null);
      setSnapshot((current) => current ? { ...current, capabilities: EMPTY_CAPABILITIES } : current);
      setPhase('loading');
      try {
        const next = await logoutOperationalSession(expectedSessionId);
        if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
        setSnapshot(next);
        setSwitching(false);
        setPhase('ready');
        setErrorMessage(next.session
          ? 'No fue posible confirmar el cierre. La identidad verificada continúa activa.'
          : null);
      } catch (error) {
        if (error instanceof OperationalSessionStateChangedError) {
          if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
          setSnapshot(error.snapshot);
          setSwitching(false);
          setPhase('ready');
          setErrorMessage(null);
          return;
        }
        try {
          const verified = await getOperationalSession();
          if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
          setSnapshot(verified);
          setSwitching(false);
          setPhase('ready');
          setErrorMessage(verified.session
            ? 'No fue posible cerrar la sesión. La identidad verificada continúa activa.'
            : null);
        } catch {
          if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
          setSnapshot(null);
          setPhase('failed');
        }
      } finally {
        if (isLatestOperationGeneration(operationGeneration.current, generation)) setBusy(false);
      }
    };
    void closeSession();
  }, [busy, snapshot]);

  const beginUserSwitch = useCallback((): void => {
    if (!snapshot?.session || busy) return;
    const generation = operationGeneration.current + 1;
    operationGeneration.current = generation;
    setFocusTarget(null);
    setSnapshot((current) => current ? { ...current, capabilities: EMPTY_CAPABILITIES } : current);
    setSwitching(true);
    const prepare = async (): Promise<void> => {
      setBusy(true);
      setErrorMessage(null);
      try {
        const next = await getOperationalSession();
        if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
        setSnapshot(next);
        setSwitching(next.session !== null);
      } catch {
        if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
        setSnapshot(null);
        setSwitching(false);
        setPhase('failed');
      } finally {
        if (isLatestOperationGeneration(operationGeneration.current, generation)) setBusy(false);
      }
    };
    void prepare();
  }, [busy, snapshot?.session]);

  const cancelUserSwitch = useCallback(async (): Promise<void> => {
    if (!snapshot?.session || busy) return;
    const generation = operationGeneration.current + 1;
    operationGeneration.current = generation;
    setBusy(true);
    setErrorMessage(null);
    try {
      const next = await getOperationalSession();
      if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
      setSnapshot(next);
      setSwitching(false);
      setPhase('ready');
      setFocusTarget(next.session ? 'operator' : null);
    } catch {
      if (!isLatestOperationGeneration(operationGeneration.current, generation)) return;
      setSnapshot(null);
      setSwitching(false);
      setPhase('failed');
    } finally {
      if (isLatestOperationGeneration(operationGeneration.current, generation)) setBusy(false);
    }
  }, [busy, snapshot?.session]);

  if (phase === 'loading') return <LoadingGate />;
  if (phase === 'failed' || !snapshot) {
    return <FailedGate onRetry={() => setRetryKey((current) => current + 1)} />;
  }
  if (!snapshot.session || switching) {
    return (
      <LoginPage
        key={switching ? 'switch-user' : 'login'}
        snapshot={snapshot}
        currentSession={switching ? snapshot.session : null}
        busy={busy}
        onAuthenticate={authenticate}
        {...(switching ? { onCancel: cancelUserSwitch } : {})}
      />
    );
  }
  return (
    <>
      {children({
        session: snapshot.session,
        capabilities: snapshot.capabilities,
        csrfToken: snapshot.csrfToken,
        busy,
        errorMessage,
        focusTarget,
        beginUserSwitch,
        logout,
      })}
    </>
  );
}
