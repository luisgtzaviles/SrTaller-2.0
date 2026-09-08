import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Palette,
  Phone,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { addRepairOperationalNote, getRepairDetail, PreviewApiError } from '../api.js';
import type {
  RepairDetail,
  RepairEvidenceItem,
  RepairTimelineItem,
  RepairTimelineItemType,
} from '../api.js';
import { Button, Textarea } from '../components/ui/controls.js';
import { StatusBadge } from '../components/ui/data-display.js';
import { ErrorState, Skeleton } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import styles from './pages.module.css';

function receivedAt(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(value));
}

function optionalValue(value: string | null, fallback = 'No registrado'): string {
  return value?.trim() || fallback;
}

function timelineTypeLabel(type: RepairTimelineItemType): string {
  return type === 'note' ? 'Nota' : 'Actividad';
}

function timelineSourceLabel(source: string): string {
  const labels: Readonly<Record<string, string>> = Object.freeze({
    'local.assignment_projection': 'Cambio de asignación',
    'local.operator_note': 'Nota operativa',
    'local.operational_note': 'Nota operativa local',
    'repairs.operational_note': 'Nota operativa',
    'local.reception': 'Recepción',
    'local.status_projection': 'Cambio de situación',
    'local.technician_assignment': 'Asignación de técnico',
    'local.workflow': 'Flujo de reparación',
    'local.location': 'Ubicación interna',
  });
  return labels[source] ?? 'Actividad registrada';
}

const noteBodyMinLength = 3;
const noteBodyMaxLength = 4000;

function draftKey(sessionId: string, repairId: string): string {
  return `srtaller.local.repair-note-draft.${sessionId}.${repairId}`;
}

function storedDraft(sessionId: string, repairId: string): string {
  try {
    return window.sessionStorage.getItem(draftKey(sessionId, repairId)) ?? '';
  } catch {
    return '';
  }
}

function storeDraft(sessionId: string, repairId: string, value: string): void {
  try {
    if (value === '') window.sessionStorage.removeItem(draftKey(sessionId, repairId));
    else window.sessionStorage.setItem(draftKey(sessionId, repairId), value);
  } catch {
    // Draft retention is a safety enhancement; the composer remains functional without storage.
  }
}

function evidenceAlt(item: RepairEvidenceItem): string {
  return item.caption?.trim() || (item.category === 'intake'
    ? 'Evidencia visual sintética de recepción'
    : 'Evidencia visual sintética general');
}

export function RepairDetailWorkspace({
  repair,
  sessionId,
  host = 'page',
  capabilities,
  csrfToken,
  timeZone,
  onNoteAdded,
  onDraftDirtyChange,
}: Readonly<{
  repair: RepairDetail;
  sessionId: string;
  host?: 'page' | 'overlay';
  capabilities: readonly OperationalCapability[];
  csrfToken: string;
  timeZone: string;
  onNoteAdded(note: RepairTimelineItem): void;
  onDraftDirtyChange(dirty: boolean): void;
}>): React.JSX.Element {
  const [selectedEvidence, setSelectedEvidence] = useState<number | null>(null);
  const [failedEvidence, setFailedEvidence] = useState<ReadonlySet<string>>(() => new Set());
  const [noteDraft, setNoteDraft] = useState(() => storedDraft(sessionId, repair.id));
  const [noteSubmitState, setNoteSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [noteMessage, setNoteMessage] = useState('');
  const noteRequestId = useRef<string | null>(null);
  const closeEvidence = useCallback(() => setSelectedEvidence(null), []);
  const activeEvidence = selectedEvidence === null
    ? null
    : repair.evidence.items[selectedEvidence] ?? null;
  const primaryEvidenceIndex = useMemo(() => {
    const intakeIndex = repair.evidence.items.findIndex((item) => item.category === 'intake');
    return intakeIndex >= 0 ? intakeIndex : repair.evidence.items.length > 0 ? 0 : null;
  }, [repair.evidence.items]);
  const primaryEvidence = primaryEvidenceIndex === null
    ? null
    : repair.evidence.items[primaryEvidenceIndex] ?? null;
  const normalizedNote = noteDraft.trim();
  const noteValid = normalizedNote.length >= noteBodyMinLength && normalizedNote.length <= noteBodyMaxLength;
  const canAddNote = hasOperationalCapability(capabilities, 'repairs.add_note');
  const currentTechnician = repair.currentSituation.technician;

  useEffect(() => {
    if (!canAddNote) {
      onDraftDirtyChange(false);
      return;
    }
    storeDraft(sessionId, repair.id, noteDraft);
    onDraftDirtyChange(normalizedNote.length > 0);
  }, [canAddNote, noteDraft, normalizedNote.length, onDraftDirtyChange, repair.id, sessionId]);

  useEffect(() => {
    if (!canAddNote || normalizedNote.length === 0) return undefined;
    const beforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [canAddNote, normalizedNote.length]);

  const submitNote = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!noteValid || noteSubmitState === 'submitting') return;
    const clientRequestId = noteRequestId.current ?? crypto.randomUUID();
    noteRequestId.current = clientRequestId;
    setNoteSubmitState('submitting');
    setNoteMessage('Agregando nota…');
    try {
      const response = await addRepairOperationalNote(repair.id, {
        body: normalizedNote,
        clientRequestId,
      }, csrfToken);
      onNoteAdded({
        ...response.item,
      });
      noteRequestId.current = null;
      setNoteDraft('');
      setNoteSubmitState('success');
      setNoteMessage('Nota agregada al historial.');
    } catch (error: unknown) {
      setNoteSubmitState('error');
      setNoteMessage(error instanceof PreviewApiError && error.status === 403
        ? 'Tu sesión no tiene autorización para agregar esta nota.'
        : 'No fue posible agregar la nota. El texto se conservó; puedes reintentar.');
    }
  };

  return (
    <div className={`${styles.repairWorkspace} ${host === 'overlay' ? styles.workspaceOverlay : ''}`}>
      <section className={styles.workspaceHero} aria-labelledby="repair-identity-title">
        <div className={styles.workspaceHeroVisual}>
          {primaryEvidence && !failedEvidence.has(primaryEvidence.id) ? (
            <button
              type="button"
              onClick={() => setSelectedEvidence(primaryEvidenceIndex)}
              aria-label={`Abrir evidencia principal: ${evidenceAlt(primaryEvidence)}`}
            >
              <img
                src={primaryEvidence.thumbnailUrl}
                alt={evidenceAlt(primaryEvidence)}
                width={primaryEvidence.width ?? undefined}
                height={primaryEvidence.height ?? undefined}
                onError={() => setFailedEvidence((current) => new Set(current).add(primaryEvidence.id))}
              />
            </button>
          ) : primaryEvidence ? (
            <div className={styles.heroEvidenceUnavailable} role="img" aria-label="Evidencia principal no disponible en este entorno local">
              <ImageIcon aria-hidden="true" size={24} />
              <span>Evidencia no disponible</span>
            </div>
          ) : (
            <div className={styles.heroEvidenceEmpty} role="img" aria-label="Sin evidencia de recepción registrada">
              <Camera aria-hidden="true" size={24} />
              <span>Sin evidencia de recepción</span>
            </div>
          )}
        </div>

        <div className={styles.workspaceHeroIdentity}>
          <span className={styles.eyebrow}>Equipo recibido</span>
          <h2 id="repair-identity-title">{repair.receivedDevice.label}</h2>
          <p>
            <UserRound aria-hidden="true" size={16} />
            <strong>{repair.customer.name}</strong>
            <span aria-hidden="true">·</span>
            <Phone aria-hidden="true" size={16} />
            <span>{optionalValue(repair.customer.phone)}</span>
          </p>
          <div className={styles.workspaceFolioLine}>
            <strong>{repair.folio}</strong>
            <details>
              <summary>Metadata técnica</summary>
              <code>{repair.id}</code>
            </details>
          </div>
        </div>

        <dl className={styles.workspaceHeroSummary}>
          <div><dt><Clock3 aria-hidden="true" size={16} />Recepción</dt><dd><time dateTime={repair.intake.receivedAt}>{receivedAt(repair.intake.receivedAt, timeZone)}</time></dd></div>
          <div><dt><Wrench aria-hidden="true" size={16} />Estado</dt><dd><StatusBadge tone={repair.currentSituation.repairStatus.tone}>{repair.currentSituation.repairStatus.label}</StatusBadge></dd></div>
        </dl>
      </section>

      <div className={styles.workspaceMain}>
        <aside className={styles.operationalRail} aria-labelledby="current-situation-title">
          <header>
            <h2 id="current-situation-title">Situación actual</h2>
          </header>
          <dl>
            <div><dt>Estado</dt><dd><StatusBadge tone={repair.currentSituation.repairStatus.tone}>{repair.currentSituation.repairStatus.label}</StatusBadge></dd></div>
            <div><dt>Técnico</dt><dd><span>{currentTechnician?.displayName ?? 'Sin técnico asignado'}</span></dd></div>
            <div><dt>Custodia</dt><dd>{repair.currentSituation.custody.label}</dd></div>
            <div><dt><MapPin aria-hidden="true" size={14} />Ubicación</dt><dd>{repair.currentSituation.location?.label ?? 'Ubicación no registrada'}</dd></div>
          </dl>
          {repair.currentSituation.technicianSummary.history.length > 0 ? (
            <section className={styles.assignmentHistory} aria-labelledby="technician-history-title">
              <header>
                <h3 id="technician-history-title">Historial de asignaciones</h3>
                <span>{repair.currentSituation.technicianSummary.historyCount}</span>
              </header>
              <ol>
                {repair.currentSituation.technicianSummary.history.map((entry) => (
                  <li key={entry.assignmentId}>
                    <div>
                      <strong>{entry.technician.displayName}</strong>
                      <span>{entry.endedAt ? 'Finalizada' : 'Activa'}</span>
                    </div>
                    <time dateTime={entry.assignedAt}>{receivedAt(entry.assignedAt, timeZone)}</time>
                    {entry.reason ? <p>{entry.reason}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </aside>

        <article className={styles.intakeCard} aria-labelledby="intake-title">
          <header>
            <h2 id="intake-title">Recepción</h2>
          </header>
          <dl className={styles.intakeFacts}>
            <div className={styles.intakeReportedIssue}>
              <dt>Falla reportada</dt>
              <dd>{optionalValue(repair.intake.reportedIssue)}</dd>
            </div>
            <div>
              <dt>Relato del cliente</dt>
              <dd>{optionalValue(repair.intake.customerNarrative, 'Sin relato registrado')}</dd>
            </div>
            <div>
              <dt>Condición física</dt>
              <dd>{optionalValue(repair.intake.physicalConditionSummary)}</dd>
            </div>
            <div className={styles.documentedRisk} data-empty={!repair.intake.documentedRiskSummary}>
              <dt>Riesgo documentado/informado</dt>
              <dd>{optionalValue(repair.intake.documentedRiskSummary, 'Sin riesgo documentado')}</dd>
            </div>
            <div className={styles.intakeSecondaryFact}>
              <dt>Recibió</dt>
              <dd>{repair.intake.receivedBy?.displayName ?? 'No registrado'}</dd>
            </div>
            <div className={styles.intakeSecondaryFact}>
              <dt><Palette aria-hidden="true" size={14} />Color</dt>
              <dd>{optionalValue(repair.receivedDevice.color, 'Color no registrado')}</dd>
            </div>
          </dl>
        </article>

        <section className={styles.repairTimeline} data-empty={repair.timeline.items.length === 0} aria-labelledby="repair-timeline-title">
          <header>
            <h2 id="repair-timeline-title">Historial</h2>
            {repair.timeline.totalCount > repair.timeline.items.length ? (
              <span>Últimas {repair.timeline.items.length} de {repair.timeline.totalCount}</span>
            ) : (
              <span>{repair.timeline.totalCount} {repair.timeline.totalCount === 1 ? 'entrada' : 'entradas'}</span>
            )}
          </header>

          <div className={styles.timelineContent}>
            {repair.timeline.items.length === 0 ? (
              <div className={styles.timelineEmpty}>
                <strong>No hay actividad registrada todavía.</strong>
                <span>Las notas y actividades aparecerán aquí.</span>
              </div>
            ) : (
              <ol className={styles.timelineList}>
                {repair.timeline.items.map((entry) => (
                  <li key={entry.id}>
                    <article>
                      <div className={styles.timelineItemMeta}>
                        <span className={styles.timelineType}>{timelineTypeLabel(entry.type)}</span>
                        <time dateTime={entry.occurredAt}>{receivedAt(entry.occurredAt, timeZone)}</time>
                      </div>
                      <h3>{entry.title ?? timelineTypeLabel(entry.type)}</h3>
                      <strong>{entry.actor.displayName}</strong>
                      {entry.body ? <p>{entry.body}</p> : null}
                      <small>Origen: {timelineSourceLabel(entry.source)}</small>
                    </article>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {canAddNote ? <form className={styles.noteComposer} onSubmit={(event) => void submitNote(event)}>
            <label htmlFor={`operational-note-${repair.id}`}>Nota operativa</label>
            <div className={styles.noteComposerControls}>
              <Textarea
                id={`operational-note-${repair.id}`}
                value={noteDraft}
                placeholder="Escribe una nota operativa…"
                minLength={noteBodyMinLength}
                maxLength={noteBodyMaxLength}
                disabled={noteSubmitState === 'submitting'}
                aria-describedby={`operational-note-status-${repair.id}`}
                onChange={(event) => {
                  setNoteDraft(event.target.value);
                  noteRequestId.current = null;
                  setNoteSubmitState('idle');
                  setNoteMessage('');
                }}
              />
              <Button type="submit" tone="primary" disabled={!noteValid || noteSubmitState === 'submitting'}>
                {noteSubmitState === 'submitting' ? 'Agregando…' : 'Agregar'}
              </Button>
            </div>
            <div className={styles.noteComposerMeta}>
              <span>{noteDraft.length} / {noteBodyMaxLength}</span>
              <span
                id={`operational-note-status-${repair.id}`}
                className={styles.noteComposerMessage}
                data-error={noteSubmitState === 'error'}
                aria-live="polite"
              >{noteMessage}</span>
            </div>
          </form> : null}
        </section>
      </div>

      <section className={styles.repairEvidence} data-empty={repair.evidence.items.length === 0} aria-labelledby="repair-evidence-title">
        <header>
          <h2 id="repair-evidence-title">Evidencias</h2>
          <span>{repair.evidence.totalCount} {repair.evidence.totalCount === 1 ? 'imagen' : 'imágenes'}</span>
        </header>
        {repair.evidence.items.length === 0 ? (
          <p className={styles.evidenceEmpty}>No hay evidencias visuales registradas.</p>
        ) : (
          <ul className={styles.evidenceGrid} aria-label="Evidencias visuales de la reparación">
            {repair.evidence.items.map((item, index) => (
              <li key={item.id}>
                {failedEvidence.has(item.id) ? (
                  <div className={styles.evidenceFailure} role="status">
                    <ImageIcon aria-hidden="true" size={20} />
                    <strong>Evidencia no disponible</strong>
                    <span>{item.caption ?? 'La evidencia sintética no está disponible en este entorno local.'}</span>
                  </div>
                ) : (
                  <button type="button" onClick={() => setSelectedEvidence(index)} aria-label={`Abrir evidencia: ${evidenceAlt(item)}`}>
                    <img
                      src={item.thumbnailUrl}
                      alt={evidenceAlt(item)}
                      width={item.width ?? undefined}
                      height={item.height ?? undefined}
                      loading="lazy"
                      onError={() => setFailedEvidence((current) => new Set(current).add(item.id))}
                    />
                    <span>{item.caption ?? (item.category === 'intake' ? 'Recepción' : 'General')}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={activeEvidence !== null}
        title="Evidencia visual"
        description={selectedEvidence === null ? 'Visor de evidencia.' : `${selectedEvidence + 1} de ${repair.evidence.items.length}`}
        size="wide"
        onClose={closeEvidence}
        footer={selectedEvidence === null ? null : (
          <div className={styles.evidenceViewerActions}>
            <Button
              onClick={() => setSelectedEvidence((current) => current === null ? null : Math.max(0, current - 1))}
              disabled={selectedEvidence === 0}
            ><ArrowLeft aria-hidden="true" size={16} />Anterior</Button>
            <Button
              onClick={() => setSelectedEvidence((current) => current === null ? null : Math.min(repair.evidence.items.length - 1, current + 1))}
              disabled={selectedEvidence === repair.evidence.items.length - 1}
            >Siguiente<ArrowRight aria-hidden="true" size={16} /></Button>
            <Button tone="primary" onClick={closeEvidence}>Cerrar</Button>
          </div>
        )}
      >
        {selectedEvidence === null || !activeEvidence ? null : (
          <figure className={styles.evidenceViewer}>
            {failedEvidence.has(activeEvidence.id) ? (
              <div className={styles.evidenceFailure} role="status">
                <ImageIcon aria-hidden="true" size={20} />
                <strong>Evidencia no disponible</strong>
                <span>Esta evidencia sintética no pudo cargarse en este entorno local.</span>
              </div>
            ) : (
              <img
                src={activeEvidence.contentUrl}
                alt={evidenceAlt(activeEvidence)}
                width={activeEvidence.width ?? undefined}
                height={activeEvidence.height ?? undefined}
                onError={() => setFailedEvidence((current) => new Set(current).add(activeEvidence.id))}
              />
            )}
            <figcaption>
              <strong>{activeEvidence.caption ?? 'Sin descripción registrada'}</strong>
              <span>{activeEvidence.category === 'intake' ? 'Recepción' : 'General'} · {receivedAt(activeEvidence.uploadedAt, timeZone)}</span>
            </figcaption>
          </figure>
        )}
      </Dialog>
    </div>
  );
}

export function RepairDetailPage({
  capabilities,
  csrfToken,
  sessionId,
  timeZone,
  host = 'page',
}: Readonly<{
  capabilities: readonly OperationalCapability[];
  csrfToken: string;
  sessionId: string;
  timeZone: string;
  host?: 'page' | 'overlay';
}>): React.JSX.Element {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as Readonly<{
    returnTo?: string;
    restoreFocusSelector?: string;
  }> | null;
  const returnTo = routeState?.returnTo ?? (location.search ? `/reparaciones${location.search}` : '/reparaciones');
  const [repair, setRepair] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not-found' | 'denied' | 'failed' | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [discardPromptOpen, setDiscardPromptOpen] = useState(false);

  const load = useCallback((signal?: AbortSignal): void => {
    setLoading(true);
    setError(null);
    void getRepairDetail(id, signal)
      .then((detail) => setRepair(detail))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setRepair(null);
        setError(cause instanceof PreviewApiError && cause.status === 404
          ? 'not-found'
          : cause instanceof PreviewApiError && cause.status === 403
            ? 'denied'
            : 'failed');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const closeWorkspace = useCallback(() => {
    if (draftDirty) {
      setDiscardPromptOpen(true);
      return;
    }
    navigate(-1);
  }, [draftDirty, navigate]);
  const addNoteToTimeline = useCallback((note: RepairTimelineItem): void => {
    setRepair((current) => {
      if (!current) return current;
      const alreadyPresent = current.timeline.items.some((entry) => entry.id === note.id);
      const items = alreadyPresent
        ? current.timeline.items
        : [note, ...current.timeline.items].slice(0, current.timeline.limit);
      return {
        ...current,
        timeline: {
          ...current.timeline,
          items,
          totalCount: current.timeline.totalCount + (alreadyPresent ? 0 : 1),
        },
      };
    });
  }, []);
  const header = (
    <PageHeader
      title="Detalle de reparación"
      breadcrumb={[{ label: 'Reparaciones', to: returnTo }, { label: repair?.folio ?? 'Detalle' }]}
    />
  );

  let content: React.ReactNode;
  if (loading && !repair) {
    content = <div className={styles.workspaceState}><Skeleton rows={6} /></div>;
  } else if (error === 'not-found') {
    content = (
      <div className={styles.workspaceState}>
        <ErrorState
          title="Reparación no disponible"
          description="La reparación no existe o no está disponible en este contexto."
          action={{ label: 'Volver a reparaciones', to: returnTo }}
        />
      </div>
    );
  } else if (error === 'denied') {
    content = (
      <div className={styles.workspaceState}>
        <ErrorState
          title="Acceso no autorizado"
          description="Tu sesión operativa ya no tiene acceso a esta reparación."
          action={{ label: 'Volver al inicio', to: '/' }}
        />
      </div>
    );
  } else if (error === 'failed' || !repair) {
    content = (
      <section className={`${styles.workspaceState} ${styles.detailError}`} aria-live="polite">
        <ErrorState
          title="No fue posible cargar el detalle"
          description="Ocurrió un error al consultar la reparación."
          action={{ label: 'Volver a reparaciones', to: returnTo }}
        />
        <button type="button" className={styles.retryButton} onClick={() => load()}>Reintentar</button>
      </section>
    );
  } else {
    content = (
      <RepairDetailWorkspace
        repair={repair}
        sessionId={sessionId}
        capabilities={capabilities}
        csrfToken={csrfToken}
        timeZone={timeZone}
        host={host}
        onNoteAdded={addNoteToTimeline}
        onDraftDirtyChange={setDraftDirty}
      />
    );
  }

  if (host === 'overlay') {
    return (
      <>
      <Dialog
        open
        title="Detalle de reparación"
        description={repair?.folio ?? 'Cargando detalle'}
        size="workspace"
        variant="workspace"
        footer={false}
        restoreFocusSelector={routeState?.restoreFocusSelector}
        onClose={closeWorkspace}
      >
        {content}
      </Dialog>
      <Dialog
        open={discardPromptOpen}
        title="¿Descartar la nota sin guardar?"
        description="La nota todavía no se ha agregado al historial."
        onClose={() => setDiscardPromptOpen(false)}
        footer={(
          <div className={styles.discardDraftActions}>
            <Button onClick={() => setDiscardPromptOpen(false)}>Seguir escribiendo</Button>
            <Button
              tone="danger"
              onClick={() => {
                storeDraft(sessionId, id, '');
                setDraftDirty(false);
                setDiscardPromptOpen(false);
                navigate(-1);
              }}
            >Descartar nota</Button>
          </div>
        )}
      >
        <p className={styles.discardDraftCopy}>Si sales ahora, el texto se descartará.</p>
      </Dialog>
      </>
    );
  }

  return <div className={`${styles.pageStack} ${styles.detailPage}`}>{header}{content}</div>;
}
