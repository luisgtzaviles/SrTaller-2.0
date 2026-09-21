import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, Field, Input } from '../components/ui/controls.js';
import styles from './public-registration-page.module.css';

type LegalDocument = Readonly<{ key: 'terms' | 'privacy'; version: string; url: string }>;
type Policy = Readonly<{ enabled: boolean; documents: readonly LegalDocument[] }>;
type Screen = 'registration' | 'pending' | 'verifying' | 'success' | 'invalid';

async function publicRequest(path: string, body?: unknown): Promise<unknown> {
  const response = await fetch(`/api/public/${path}`, body === undefined
    ? { method: 'GET', credentials: 'same-origin' }
    : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
  if (!response.ok) throw new Error('PUBLIC_REQUEST_FAILED');
  return response.json();
}

export function PublicRegistrationPage(): React.JSX.Element {
  const verificationToken = useMemo(() => new URLSearchParams(window.location.hash.slice(1)).get('token'), []);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [screen, setScreen] = useState<Screen>(verificationToken ? 'verifying' : 'registration');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    void publicRequest('registration-policy').then((value) => setPolicy(value as Policy)).catch(() => setPolicy({ enabled: false, documents: [] }));
  }, []);

  useEffect(() => {
    if (!verificationToken) return;
    void publicRequest('registrations/verify', { token: verificationToken }).then((value) => {
      window.history.replaceState(null, '', '/verificar');
      const result = value as Readonly<{ result: string }>;
      setScreen(result.result === 'completed' ? 'success' : result.result === 'retryable' ? 'verifying' : 'invalid');
      if (result.result === 'retryable') setMessage('No pudimos terminar el alta. Vuelve a intentarlo desde el mismo enlace.');
    }).catch(() => { window.history.replaceState(null, '', '/verificar'); setScreen('invalid'); });
  }, [verificationToken]);

  useEffect(() => {
    if (resendSeconds < 1) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function register(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      await publicRequest('registrations', {
        personName: data.get('personName'), workshopName: data.get('workshopName'),
        email: data.get('email'), password: data.get('password'),
        acceptedDocuments: policy?.documents.map(({ key, version }) => ({ key, version })) ?? [],
      });
      setEmail(String(data.get('email') ?? '')); setResendSeconds(60); setScreen('pending');
    } catch { setMessage('No fue posible completar la solicitud. Revisa los datos e intenta de nuevo.'); }
    finally { setBusy(false); }
  }

  async function resend(): Promise<void> {
    if (resendSeconds > 0 || !email) return;
    setBusy(true); setMessage(null);
    try { await publicRequest('registrations/resend', { email }); setResendSeconds(60); setMessage('Si el registro sigue vigente, enviamos un enlace nuevo.'); }
    catch { setMessage('No fue posible solicitar otro enlace. Intenta más tarde.'); }
    finally { setBusy(false); }
  }

  const enabled = policy?.enabled === true && policy.documents.length === 2;
  return <main className={styles.shell}>
    <section className={styles.brandPanel} aria-label="SR Taller">
      <div className={styles.brandMark}>SR</div>
      <p className={styles.eyebrow}>SR TALLER 2.0</p>
      <h1>Tu taller, listo para operar con control.</h1>
      <p>Registra la organización. Después podrás iniciar sesión en el espacio administrativo y completar la primera sucursal.</p>
      <ul><li><ShieldCheck aria-hidden="true" /> Identidad administrativa separada</li><li><Mail aria-hidden="true" /> Correo verificado</li><li><KeyRound aria-hidden="true" /> Acceso protegido</li></ul>
    </section>
    <section className={styles.card} aria-live="polite">
      {screen === 'registration' ? <>
        <header><p className={styles.eyebrow}>CREAR ORGANIZACIÓN</p><h2>Empieza con tu cuenta administrativa</h2><p>Verificaremos tu correo antes de crear el acceso del taller.</p></header>
        {policy === null ? <p>Cargando configuración…</p> : !enabled ? <div role="alert" className={styles.alert}>El registro público no está disponible en este entorno.</div> :
          <form className={styles.form} onSubmit={(event) => { void register(event); }}>
            <Field id="registration-person" label="Tu nombre" required><Input id="registration-person" name="personName" required minLength={2} maxLength={160} autoComplete="name" /></Field>
            <Field id="registration-workshop" label="Nombre del taller" required><Input id="registration-workshop" name="workshopName" required minLength={2} maxLength={160} autoComplete="organization" /></Field>
            <Field id="registration-email" label="Correo administrativo" required><Input id="registration-email" name="email" required type="email" maxLength={254} autoComplete="email" /></Field>
            <Field id="registration-password" label="Contraseña" required hint="Usa al menos 12 caracteres."><Input id="registration-password" name="password" required type="password" minLength={12} maxLength={128} autoComplete="new-password" /></Field>
            <label className={styles.acceptance}><input name="legalAcceptance" type="checkbox" required /><span>Acepto los {policy.documents.map((document, index) => <span key={document.key}>{index > 0 ? ' y el ' : ''}<a href={document.url} target="_blank" rel="noreferrer">{document.key === 'terms' ? 'Términos de Servicio' : 'Aviso de Privacidad'}</a> <small>({document.version})</small></span>)}</span></label>
            {message ? <p role="alert" className={styles.alert}>{message}</p> : null}
            <Button tone="primary" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Crear cuenta y verificar correo'}</Button>
          </form>}
      </> : null}
      {screen === 'pending' ? <div className={styles.state}><Mail aria-hidden="true" /><h2>Revisa tu correo</h2><p>Si los datos pueden registrarse, recibirás un enlace válido por 60 minutos.</p>{message ? <p className={styles.notice}>{message}</p> : null}<Button onClick={() => { void resend(); }} disabled={busy || resendSeconds > 0}>{resendSeconds > 0 ? `Reenviar en ${resendSeconds} s` : 'Reenviar enlace'}</Button></div> : null}
      {screen === 'verifying' ? <div className={styles.state}><span className={styles.spinner} aria-hidden="true" /><h2>Verificando correo</h2><p>{message ?? 'Estamos completando el alta segura de tu organización.'}</p></div> : null}
      {screen === 'invalid' ? <div className={styles.state}><Mail aria-hidden="true" /><h2>El enlace no está disponible</h2><p>Puede haber vencido o haber sido reemplazado. Inicia de nuevo o solicita otro enlace desde la pantalla pendiente.</p><a className={styles.linkButton} href="/registro">Volver al registro</a></div> : null}
      {screen === 'success' ? <div className={styles.state}><CheckCircle2 aria-hidden="true" /><h2>Correo verificado</h2><p>Tu organización quedó creada en onboarding. Continúa en la administración para completar la primera sucursal.</p><a className={styles.linkButton} href="https://admin.srtaller.com/login">Ir al inicio de sesión administrativo</a></div> : null}
    </section>
  </main>;
}
