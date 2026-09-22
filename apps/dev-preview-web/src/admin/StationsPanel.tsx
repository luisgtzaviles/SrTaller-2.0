import { KeyRound, Link2Off, MonitorSmartphone, Pencil, Plus, QrCode, RefreshCw, ShieldX } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';

import { adminApi, AdminApiError } from '../admin-api.js';
import type { AdminBranch, AdminSessionSnapshot, AdminStation, AdminStationEnrollment, IssuedAdminStationEnrollment } from '../admin-api.js';
import { Button, Field, Input, Select } from '../components/ui/controls.js';
import { Alert, EmptyState } from '../components/ui/feedback.js';
import { StatusBadge } from '../components/ui/data-display.js';
import { Dialog } from '../components/ui/overlays.js';
import styles from './admin-app.module.css';

type SensitiveAction = Readonly<{ kind: 'UNLINK' | 'RELINK' | 'REVOKE'; station: AdminStation }>;

function failure(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.status === 401) return 'La sesión administrativa venció. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'Tu sesión no tiene autoridad para esta acción o necesita reautenticación reciente.';
    if (error.code === 'STATION_BRANCH_INACTIVE') return 'La sucursal destino está inactiva.';
    if (error.code === 'STATION_VERSION_CONFLICT') return 'El dispositivo cambió. Recarga e intenta de nuevo.';
    if (error.code === 'STATION_INVALID_TRANSITION') return 'El estado actual del dispositivo no permite esta acción.';
  }
  return 'No fue posible completar la acción. Intenta de nuevo.';
}

function statusTone(status: AdminStation['status']): 'success' | 'warning' | 'neutral' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'UNLINKED') return 'warning';
  return 'neutral';
}

function statusLabel(status: AdminStation['status']): string {
  if (status === 'ACTIVE') return 'Vinculado';
  if (status === 'UNLINKED') return 'Desvinculado';
  return 'Revocado';
}

function enrollmentTone(status: AdminStationEnrollment['status']): 'success' | 'warning' | 'neutral' {
  if (status === 'ACTIVE') return 'warning';
  if (status === 'CONSUMED') return 'success';
  return 'neutral';
}

function branchDateTime(value: string, branch?: AdminBranch): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: branch?.timeZone ?? 'UTC',
  }).format(new Date(value));
}

export function StationsPanel({
  snapshot, branches,
}: Readonly<{ snapshot: AdminSessionSnapshot; branches: readonly AdminBranch[] }>): React.JSX.Element {
  const [stations, setStations] = useState<readonly AdminStation[]>([]);
  const [enrollments, setEnrollments] = useState<readonly AdminStationEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issued, setIssued] = useState<IssuedAdminStationEnrollment | null>(null);
  const [editing, setEditing] = useState<AdminStation | null>(null);
  const [detail, setDetail] = useState<AdminStation | null>(null);
  const [sensitive, setSensitive] = useState<SensitiveAction | null>(null);
  const canRead = snapshot.capabilities.includes('stations.read');
  const canManage = snapshot.capabilities.includes('stations.manage');
  const canIssue = snapshot.capabilities.includes('stations.enrollment.issue');
  const canCancel = snapshot.capabilities.includes('stations.enrollment.cancel');
  const canRelink = snapshot.capabilities.includes('stations.relink');
  const canRevoke = snapshot.capabilities.includes('stations.revoke');

  async function load(): Promise<void> {
    if (!canRead) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [stationResult, enrollmentResult] = await Promise.all([
        adminApi.listStations(), adminApi.listStationEnrollments(),
      ]);
      setStations(stationResult.items); setEnrollments(enrollmentResult.items);
    } catch (cause) { setError(failure(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [canRead]);

  return <>
    <div className={styles.pageHeader}><div><p className={styles.eyebrow}>Confianza operativa</p><h1>Dispositivos</h1><p>Administra el inventario y emite autoridades de vinculación de un solo uso. Los secretos de dispositivo nunca se muestran aquí.</p></div>{canIssue ? <Button tone="primary" data-station-issue-trigger="true" onClick={() => setIssueOpen(true)}><Plus aria-hidden="true" /> Vincular dispositivo</Button> : null}</div>
    {!canRead ? <Alert tone="danger" title="Acceso denegado">No cuentas con la capability stations.read.</Alert> : null}
    {error ? <Alert tone="danger">{error}</Alert> : null}
    {loading ? <Alert tone="info">Cargando inventario…</Alert> : null}
    {canRead && !loading && stations.length === 0 ? <EmptyState title="Aún no hay dispositivos" description="Emite una autoridad de vinculación para preparar el primer dispositivo." /> : null}
    {stations.length > 0 ? <section className={styles.stationGrid} aria-label="Dispositivos del tenant">{stations.map((station) => <article key={station.stationId} className={styles.stationCard}><div className={styles.adminCardHeading}><span className={styles.branchIcon}><MonitorSmartphone aria-hidden="true" /></span><div><h2>{station.displayName}</h2><p>{station.branchDisplayName ?? 'Sin sucursal vinculada'}</p></div><StatusBadge tone={statusTone(station.status)}>{statusLabel(station.status)}</StatusBadge></div><dl className={styles.stationFacts}><div><dt>Credencial</dt><dd>{station.credentialState === 'CURRENT' ? 'Vigente' : station.credentialState === 'REVOKED' ? 'Revocada' : 'Sin credencial'}</dd></div><div><dt>Revisión de admisión</dt><dd>{station.admissionRevision}</dd></div><div><dt>Sucursal</dt><dd>{station.branchStatus === 'INACTIVE' ? 'Inactiva' : station.branchStatus === 'ACTIVE' ? 'Activa' : 'No vinculada'}</dd></div></dl><small className={styles.stationId}>ID: {station.stationId}</small><div className={styles.cardActions}><Button size="compact" onClick={() => void adminApi.readStation(station.stationId).then(({ item }) => setDetail(item)).catch((cause) => setError(failure(cause)))}>Detalle</Button>{canManage && station.status !== 'REVOKED' ? <Button size="compact" data-station-rename-trigger={station.stationId} onClick={() => setEditing(station)}><Pencil aria-hidden="true" /> Renombrar</Button> : null}{canRelink && station.status === 'ACTIVE' ? <><Button size="compact" tone="danger" data-station-unlink-trigger={station.stationId} onClick={() => setSensitive({ kind: 'UNLINK', station })}><Link2Off aria-hidden="true" /> Desvincular</Button><Button size="compact" data-station-relink-trigger={station.stationId} onClick={() => setSensitive({ kind: 'RELINK', station })}><RefreshCw aria-hidden="true" /> Cambiar sucursal</Button></> : null}{canRevoke && station.status !== 'REVOKED' ? <Button size="compact" tone="danger" data-station-revoke-trigger={station.stationId} onClick={() => setSensitive({ kind: 'REVOKE', station })}><ShieldX aria-hidden="true" /> Revocar</Button> : null}</div></article>)}</section> : null}
    {canRead ? <section className={styles.enrollmentSection}><div><h2>Vinculaciones pendientes e historial</h2><p>Los códigos vencen a los 10 minutos y sólo pueden consumirse una vez.</p></div>{enrollments.length === 0 ? <p className={styles.muted}>No hay autoridades emitidas.</p> : <div className={styles.enrollmentList}>{enrollments.map((entry) => { const branch = branches.find((candidate) => candidate.branchId === entry.targetBranchId); return <article key={entry.challengeId}><div><strong>{entry.intendedDisplayName}</strong><span>{entry.targetBranchDisplayName} · vence {branchDateTime(entry.expiresAt, branch)}</span></div><StatusBadge tone={enrollmentTone(entry.status)}>{entry.status}</StatusBadge>{canCancel && entry.status === 'ACTIVE' ? <Button size="compact" tone="danger" onClick={() => void adminApi.cancelStationEnrollment(snapshot.csrfToken, entry).then(load).catch((cause) => setError(failure(cause)))}>Cancelar</Button> : null}</article>; })}</div>}</section> : null}
    {issueOpen ? <IssueDialog snapshot={snapshot} branches={branches} onClose={() => setIssueOpen(false)} onIssued={async (value) => { setIssueOpen(false); setIssued(value); await load(); }} /> : null}
    {issued ? <IssuedAuthorityDialog value={issued} branches={branches} onClose={() => setIssued(null)} /> : null}
    {editing ? <RenameDialog snapshot={snapshot} station={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} /> : null}
    {detail ? <StationDetailDialog station={detail} branches={branches} onClose={() => setDetail(null)} /> : null}
    {sensitive ? <SensitiveStationDialog snapshot={snapshot} action={sensitive} branches={branches} onClose={() => setSensitive(null)} onIssued={(value) => setIssued(value)} onComplete={async () => { setSensitive(null); await load(); }} /> : null}
  </>;
}

function IssueDialog({ snapshot, branches, onClose, onIssued }: Readonly<{ snapshot: AdminSessionSnapshot; branches: readonly AdminBranch[]; onClose(): void; onIssued(value: IssuedAdminStationEnrollment): Promise<void> }>) {
  const activeBranches = branches.filter((branch) => branch.status === 'ACTIVE');
  const [branchId, setBranchId] = useState(activeBranches[0]?.branchId ?? ''); const [displayName, setDisplayName] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  return <Dialog open title="Vincular dispositivo" description="Autoriza una sucursal y un nombre inmutables para esta vinculación." restoreFocusSelector='[data-station-issue-trigger="true"]' onClose={() => { if (!busy) onClose(); }} footer={false}><p className={styles.eyebrow}>Acción sensible · Nivel 2</p>{error ? <Alert tone="danger">{error}</Alert> : null}<form className={styles.reauthenticationForm} onSubmit={(event) => { event.preventDefault(); setBusy(true); setError(null); void adminApi.reauthenticate(snapshot.csrfToken, password).then(() => adminApi.issueStationEnrollment(snapshot.csrfToken, branchId, displayName)).then(onIssued).catch((cause) => setError(failure(cause))).finally(() => setBusy(false)); }}><Field id="station-issue-branch" label="Sucursal" required><Select id="station-issue-branch" value={branchId} onChange={(event) => setBranchId(event.target.value)} required>{activeBranches.map((branch) => <option key={branch.branchId} value={branch.branchId}>{branch.displayName}</option>)}</Select></Field><Field id="station-issue-name" label="Nombre del dispositivo" hint="El dispositivo no podrá cambiar este nombre al redimir." required><Input id="station-issue-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} required /></Field><Field id="station-issue-password" label="Contraseña administrativa" hint="Confirma esta acción durante los próximos 10 minutos." required><Input id="station-issue-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Field><div className={styles.formActions}><Button disabled={busy} onClick={onClose}>Cancelar</Button><Button tone="primary" type="submit" disabled={busy || !branchId || !displayName.trim() || !password}>{busy ? 'Emitiendo…' : 'Emitir autoridad'}</Button></div></form></Dialog>;
}

function IssuedAuthorityDialog({ value, branches, onClose }: Readonly<{ value: IssuedAdminStationEnrollment; branches: readonly AdminBranch[]; onClose(): void }>) {
  const [qr, setQr] = useState<string | null>(null); const [copied, setCopied] = useState(false);
  const branch = branches.find((candidate) => candidate.branchId === value.enrollment.targetBranchId);
  useEffect(() => { let active = true; if (value.qrPayload) void QRCode.toDataURL(value.qrPayload, { margin: 2, width: 240, errorCorrectionLevel: 'M' }).then((url) => { if (active) setQr(url); }); return () => { active = false; }; }, [value.qrPayload]);
  return <Dialog open title="Autoridad de vinculación emitida" description="Muéstrala únicamente al dispositivo que será vinculado. No podrá recuperarse después de cerrar." onClose={onClose} footer={false}><Alert tone="warning" title="Se muestra una sola vez">El QR y el código manual representan la misma autoridad, vencen a los 10 minutos y se consumen juntos.</Alert><div className={styles.enrollmentSecret}>{qr ? <img src={qr} alt="Código QR de vinculación" /> : <span className={styles.qrPlaceholder}><QrCode aria-hidden="true" /> Generando QR…</span>}<div><span>Código manual</span><code>{value.manualCode ?? 'No disponible en una respuesta repetida'}</code>{value.manualCode ? <Button size="compact" onClick={() => void navigator.clipboard.writeText(value.manualCode!).then(() => setCopied(true))}>{copied ? 'Copiado' : 'Copiar código'}</Button> : null}<small>Destino: {value.enrollment.targetBranchDisplayName}</small><small>Vence: {branchDateTime(value.enrollment.expiresAt, branch)}</small></div></div><div className={styles.formActions}><Button tone="primary" onClick={onClose}>Ya guardé el código</Button></div></Dialog>;
}

function RenameDialog({ snapshot, station, onClose, onSaved }: Readonly<{ snapshot: AdminSessionSnapshot; station: AdminStation; onClose(): void; onSaved(): Promise<void> }>) {
  const [displayName, setDisplayName] = useState(station.displayName); const [error, setError] = useState<string | null>(null);
  return <Dialog open title="Renombrar dispositivo" description="El nombre ayuda a identificar el equipo; no cambia su autoridad ni su credencial." restoreFocusSelector={`[data-station-rename-trigger="${station.stationId}"]`} onClose={onClose} footer={false}>{error ? <Alert tone="danger">{error}</Alert> : null}<form className={styles.reauthenticationForm} onSubmit={(event) => { event.preventDefault(); void adminApi.renameStation(snapshot.csrfToken, station, displayName).then(onSaved).catch((cause) => setError(failure(cause))); }}><Field id="station-rename" label="Nombre" required><Input id="station-rename" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} required /></Field><div className={styles.formActions}><Button onClick={onClose}>Cancelar</Button><Button tone="primary" type="submit" disabled={!displayName.trim()}>Guardar</Button></div></form></Dialog>;
}

function StationDetailDialog({ station, branches, onClose }: Readonly<{ station: AdminStation; branches: readonly AdminBranch[]; onClose(): void }>) {
  return <Dialog open title={station.displayName} description="Estado seguro e historial de sucursales del dispositivo." onClose={onClose}><dl className={styles.detailFacts}><div><dt>Estado</dt><dd>{statusLabel(station.status)}</dd></div><div><dt>Credencial</dt><dd>{station.credentialState}</dd></div><div><dt>Versión</dt><dd>{station.version}</dd></div><div><dt>Revisión de admisión</dt><dd>{station.admissionRevision}</dd></div></dl><h3>Historial de vinculación</h3>{station.bindingHistory?.length ? <ol className={styles.bindingHistory}>{station.bindingHistory.map((binding, index) => { const branch = branches.find((candidate) => candidate.branchId === binding.branchId); return <li key={`${binding.branchId}-${binding.linkedAt}-${index}`}><strong>{binding.branchDisplayName}</strong><span>Desde {branchDateTime(binding.linkedAt, branch)}{binding.unlinkedAt ? ` · hasta ${branchDateTime(binding.unlinkedAt, branch)}` : ' · actual'}</span></li>; })}</ol> : <p className={styles.muted}>Sin historial de vinculación.</p>}</Dialog>;
}

function SensitiveStationDialog({ snapshot, action, branches, onClose, onIssued, onComplete }: Readonly<{ snapshot: AdminSessionSnapshot; action: SensitiveAction; branches: readonly AdminBranch[]; onClose(): void; onIssued(value: IssuedAdminStationEnrollment): void; onComplete(): Promise<void> }>) {
  const activeBranches = useMemo(() => branches.filter((branch) => branch.status === 'ACTIVE'), [branches]);
  const [branchId, setBranchId] = useState(activeBranches.find((branch) => branch.branchId !== action.station.branchId)?.branchId ?? ''); const [displayName, setDisplayName] = useState(action.station.displayName); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const titles = { UNLINK: 'Desvincular dispositivo', RELINK: 'Cambiar dispositivo de sucursal', REVOKE: 'Revocar dispositivo' } as const;
  const descriptions = { UNLINK: 'Corta inmediatamente la credencial, las sesiones y la confianza operativa. Podrá recuperarse con una nueva vinculación.', RELINK: 'Corta primero la confianza actual y emite una nueva autoridad vinculada a la sucursal destino.', REVOKE: 'La revocación es terminal para el flujo administrativo ordinario y no puede deshacerse.' } as const;
  const trigger = action.kind === 'UNLINK' ? 'unlink' : action.kind === 'RELINK' ? 'relink' : 'revoke';
  return <Dialog open title={titles[action.kind]} description={descriptions[action.kind]} restoreFocusSelector={`[data-station-${trigger}-trigger="${action.station.stationId}"]`} onClose={() => { if (!busy) onClose(); }} footer={false}><p className={styles.eyebrow}>Acción sensible · Nivel 2</p>{error ? <Alert tone="danger">{error}</Alert> : null}<form className={styles.reauthenticationForm} onSubmit={(event) => { event.preventDefault(); setBusy(true); setError(null); void (async () => { await adminApi.reauthenticate(snapshot.csrfToken, password); if (action.kind === 'RELINK') { const result = await adminApi.relinkStation(snapshot.csrfToken, action.station, branchId, displayName); onIssued(result); } else if (action.kind === 'UNLINK') { await adminApi.unlinkStation(snapshot.csrfToken, action.station); } else { await adminApi.revokeStation(snapshot.csrfToken, action.station); } await onComplete(); })().catch((cause) => setError(failure(cause))).finally(() => setBusy(false)); }} >{action.kind === 'RELINK' ? <><Field id="station-relink-branch" label="Nueva sucursal" required><Select id="station-relink-branch" value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="">Selecciona una sucursal</option>{activeBranches.filter((branch) => branch.branchId !== action.station.branchId).map((branch) => <option key={branch.branchId} value={branch.branchId}>{branch.displayName}</option>)}</Select></Field><Field id="station-relink-name" label="Nombre autorizado" required><Input id="station-relink-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} required /></Field></> : null}<Field id="station-action-password" label="Contraseña administrativa" required><Input id="station-action-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Field><div className={styles.formActions}><Button disabled={busy} onClick={onClose}>Cancelar</Button><Button tone={action.kind === 'RELINK' ? 'primary' : 'danger'} type="submit" disabled={busy || !password || (action.kind === 'RELINK' && (!branchId || !displayName.trim()))}>{busy ? 'Confirmando…' : titles[action.kind]}</Button></div></form></Dialog>;
}
