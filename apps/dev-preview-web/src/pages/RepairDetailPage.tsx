import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarClock,
  Camera,
  Clock3,
  Image as ImageIcon,
  Pencil,
  Phone,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { addRepairOperationalNote, addRepairProblemClassification, correctRepairEquipment, getOperationalProblemCategories, getOperationalRepairBrands, getOperationalRepairModels, getRepairDetail, PreviewApiError, removeRepairProblemClassification } from '../api.js';
import type {
  OperationalRepairBrand,
  OperationalRepairModel,
  RepairDetail,
  RepairEvidenceItem,
  RepairTimelineItem,
  RepairProblemCategory,
} from '../api.js';
import { Button, Field, Input, Textarea } from '../components/ui/controls.js';
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

function includedAccessory(value: boolean): string {
  return value ? 'Trae' : 'No trae';
}

function receivedPowerState(value: RepairDetail['intake']['receivedPowerState']): string {
  return value === 'powered_on' ? 'Encendido' : value === 'powered_off' ? 'Apagado' : 'No registrado';
}

function accessType(value: RepairDetail['intake']['deviceAccessType']): string {
  return value === 'none' ? 'Sin bloqueo' : value === 'pin' ? 'PIN — secreto no almacenado' : value === 'password' ? 'Contraseña — secreto no almacenado' : value === 'pattern' ? 'Patrón — secreto no almacenado' : 'No registrado';
}

function money(value: number | null): string {
  return value === null
    ? 'Sin presupuesto inicial'
    : `$${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value / 100)} MXN`;
}

function compactTimelineAt(value: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('day')} ${part('month').replace('.', '')} · ${part('hour')}:${part('minute')} ${part('dayPeriod')}`.trim();
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

function RepairTimelineEntry({ entry, timeZone }: Readonly<{ entry: RepairTimelineItem; timeZone: string }>) {
  const fallbackTitle = entry.type === 'note' ? 'Nota operativa' : 'Actividad registrada';

  return <li data-kind={entry.type}>
    <article>
      <div className={styles.timelineItemMeta}>
        <time dateTime={entry.occurredAt}>{compactTimelineAt(entry.occurredAt, timeZone)}</time>
        <span className={styles.timelineActor}>{entry.actor.displayName}</span>
      </div>
      <h3>{entry.title?.trim() || fallbackTitle}</h3>
      {entry.body ? <p>{entry.body}</p> : null}
    </article>
  </li>;
}

export function RepairDetailWorkspace({
  repair,
  sessionId,
  host = 'page',
  capabilities,
  csrfToken,
  timeZone,
  onNoteAdded,
  onEquipmentCorrected,
  onClassificationChanged,
  onDraftDirtyChange,
}: Readonly<{
  repair: RepairDetail;
  sessionId: string;
  host?: 'page' | 'overlay';
  capabilities: readonly OperationalCapability[];
  csrfToken: string;
  timeZone: string;
  onNoteAdded(note: RepairTimelineItem): void;
  onEquipmentCorrected(): void;
  onClassificationChanged(): void;
  onDraftDirtyChange(dirty: boolean): void;
}>): React.JSX.Element {
  const [selectedEvidence, setSelectedEvidence] = useState<number | null>(null);
  const [failedEvidence, setFailedEvidence] = useState<ReadonlySet<string>>(() => new Set());
  const [noteDraft, setNoteDraft] = useState(() => storedDraft(sessionId, repair.id));
  const [noteSubmitState, setNoteSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [noteMessage, setNoteMessage] = useState('');
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionBusy, setCorrectionBusy] = useState(false);
  const [correctionMessage, setCorrectionMessage] = useState('');
  const [brandValue, setBrandValue] = useState('');
  const [canonicalBrandId, setCanonicalBrandId] = useState<string | null>(null);
  const [brandOptions, setBrandOptions] = useState<readonly OperationalRepairBrand[]>([]);
  const [modelValue, setModelValue] = useState('');
  const [canonicalModelId, setCanonicalModelId] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<readonly OperationalRepairModel[]>([]);
  const [correctionReason, setCorrectionReason] = useState('');
  const [classificationOpen, setClassificationOpen] = useState(false);
  const [classificationBusy, setClassificationBusy] = useState(false);
  const [classificationMessage, setClassificationMessage] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<readonly RepairProblemCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<ReadonlySet<string>>(() => new Set());
  const correctionRequestId = useRef<string | null>(null);
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
  const canCorrectEquipment = hasOperationalCapability(capabilities, 'repairs.correct_intake');
  const canClassify = hasOperationalCapability(capabilities, 'repairs.classify');
  const currentTechnician = repair.currentSituation.technician;
  const hasPhysicalState = Boolean(
    repair.intake.physicalConditionSummary?.trim()
    || repair.receivedDevice.color?.trim()
    || repair.intake.receivedPowerState,
  );
  const hasReceivedEquipmentFacts = Boolean(
    repair.receivedDevice.type?.trim()
    || repair.receivedDevice.identifierUnavailable
    || repair.receivedDevice.identifier?.trim()
    || repair.receivedDevice.accessories.simIncluded !== null
    || repair.receivedDevice.accessories.memoryCardIncluded !== null
    || repair.receivedDevice.accessories.other?.trim(),
  );
  const hasSpecialConditions = Boolean(
    repair.intake.warrantyReviewRequested
    || repair.intake.previousRepairId
    || repair.intake.deliveredByName?.trim()
    || repair.intake.acceptedInterventionRisks.length > 0
    || repair.intake.documentedRiskSummary?.trim(),
  );

  const openClassification = (): void => {
    setSelectedCategoryIds(new Set(repair.problemClassifications.map((category) => category.categoryId)));
    setClassificationMessage('');
    setClassificationOpen(true);
    void getOperationalProblemCategories().then((response) => setCategoryOptions(response.items)).catch((cause: unknown) => setClassificationMessage(cause instanceof Error ? cause.message : 'No fue posible cargar las categorías.'));
  };

  const saveClassification = async (): Promise<void> => {
    if (classificationBusy) return;
    setClassificationBusy(true); setClassificationMessage('Guardando clasificación…');
    const current = new Set(repair.problemClassifications.map((category) => category.categoryId));
    try {
      for (const categoryId of selectedCategoryIds) if (!current.has(categoryId)) await addRepairProblemClassification(repair.id, categoryId, csrfToken);
      for (const categoryId of current) if (!selectedCategoryIds.has(categoryId)) await removeRepairProblemClassification(repair.id, categoryId, csrfToken);
      setClassificationMessage(''); setClassificationOpen(false); onClassificationChanged();
    } catch (cause: unknown) { setClassificationMessage(cause instanceof PreviewApiError && cause.status === 409 ? 'La clasificación cambió durante la operación. Actualiza el detalle y vuelve a intentar.' : cause instanceof Error ? cause.message : 'No fue posible guardar la clasificación.'); }
    finally { setClassificationBusy(false); }
  };

  const removeClassification = async (category: RepairDetail['problemClassifications'][number]): Promise<void> => {
    if (classificationBusy) return;
    setClassificationBusy(true);
    setClassificationMessage('');
    try {
      await removeRepairProblemClassification(repair.id, category.categoryId, csrfToken);
      onClassificationChanged();
    } catch (cause: unknown) {
      setClassificationMessage(cause instanceof PreviewApiError && cause.status === 409
        ? 'La clasificación cambió durante la operación. Actualiza el detalle y vuelve a intentar.'
        : cause instanceof PreviewApiError && cause.status === 403
          ? 'Tu sesión no tiene autorización para modificar esta clasificación.'
          : 'No fue posible retirar la categoría.');
    } finally {
      setClassificationBusy(false);
    }
  };

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

  useEffect(() => {
    if (!correctionOpen) return undefined;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void getOperationalRepairBrands(brandValue, controller.signal)
        .then((response) => setBrandOptions(response.items))
        .catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setBrandOptions([]); });
    }, 120);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [brandValue, correctionOpen]);

  useEffect(() => {
    if (!correctionOpen || !canonicalBrandId) { setModelOptions([]); return undefined; }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void getOperationalRepairModels(canonicalBrandId, modelValue, controller.signal)
        .then((response) => setModelOptions(response.items))
        .catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setModelOptions([]); });
    }, 120);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [canonicalBrandId, correctionOpen, modelValue]);

  const openCorrection = (): void => {
    setBrandValue(repair.receivedDevice.correction.capturedBrand ?? repair.receivedDevice.brand);
    setCanonicalBrandId(repair.receivedDevice.correction.canonicalBrandId);
    setModelValue(repair.receivedDevice.correction.capturedModel ?? repair.receivedDevice.model);
    setCanonicalModelId(repair.receivedDevice.correction.canonicalModelId);
    setCorrectionReason('');
    setCorrectionMessage('');
    correctionRequestId.current = null;
    setCorrectionOpen(true);
  };

  const submitEquipmentCorrection = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const brand = brandValue.trim();
    const model = modelValue.trim();
    const reason = correctionReason.trim();
    if (!brand || !model || reason.length < 3 || correctionBusy) return;
    const clientRequestId = correctionRequestId.current ?? crypto.randomUUID();
    correctionRequestId.current = clientRequestId;
    setCorrectionBusy(true);
    setCorrectionMessage('Guardando corrección…');
    try {
      await correctRepairEquipment(repair.id, {
        clientRequestId,
        expectedVersion: repair.receivedDevice.correction.version,
        deviceBrand: brand,
        canonicalBrandId,
        deviceModel: model,
        canonicalModelId,
        reason,
      }, csrfToken);
      correctionRequestId.current = null;
      setCorrectionOpen(false);
      onEquipmentCorrected();
    } catch (cause: unknown) {
      setCorrectionMessage(cause instanceof PreviewApiError && cause.status === 409
        ? 'El equipo cambió en otra sesión. Cierra y vuelve a abrir para revisar los datos actuales.'
        : cause instanceof PreviewApiError && cause.status === 403
          ? 'Tu sesión no tiene autorización para corregir este equipo.'
          : cause instanceof PreviewApiError && cause.status === 400
            ? 'La Marca o el Modelo ya no están disponibles o no son compatibles.'
            : 'No fue posible guardar la corrección. Tus datos se conservaron para reintentar.');
    } finally {
      setCorrectionBusy(false);
    }
  };

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
            <span><UserRound aria-hidden="true" size={16} /><strong>{repair.customer.name}</strong></span>
            <span><Phone aria-hidden="true" size={16} />{optionalValue(repair.customer.phone)}</span>
          </p>
          <div className={styles.workspaceFolioLine}>
            <strong>{repair.folio}</strong>
            {canCorrectEquipment ? <Button size="compact" tone="quiet" onClick={openCorrection}><Pencil aria-hidden="true" size={14} />Corregir equipo</Button> : null}
            <details>
              <summary>Metadata técnica</summary>
              <dl className={styles.workspaceTechnicalMetadata}>
                <div><dt>Equipo</dt><dd>v{repair.receivedDevice.correction.version}</dd></div>
                <div><dt>Política de recepción</dt><dd>v{repair.intake.newRepairPolicyVersion}</dd></div>
              </dl>
            </details>
          </div>
        </div>

        <div className={styles.workspaceOperationalHeader}>
          <dl className={styles.workspaceSummaryCards} aria-label="Resumen de recepción y compromiso inicial">
            <div>
              <dt><Clock3 aria-hidden="true" size={15} />Recepción</dt>
              <dd><time dateTime={repair.intake.receivedAt}>{receivedAt(repair.intake.receivedAt, timeZone)}</time></dd>
            </div>
            <div data-empty={repair.intake.estimatedDeliveryAt === null}>
              <dt><CalendarClock aria-hidden="true" size={15} />Promesa de entrega</dt>
              <dd>{repair.intake.estimatedDeliveryAt ? <time dateTime={repair.intake.estimatedDeliveryAt}>{receivedAt(repair.intake.estimatedDeliveryAt, timeZone)}</time> : 'Sin promesa'}</dd>
            </div>
            <div data-empty={repair.intake.initialBudgetAmountMinor === null}>
              <dt><Banknote aria-hidden="true" size={15} />Presupuesto inicial</dt>
              <dd>{money(repair.intake.initialBudgetAmountMinor)}</dd>
            </div>
          </dl>

          <dl className={styles.workspaceOperationalIndicators} aria-label="Situación operativa actual">
            <div><dt>Estado</dt><dd className={styles.workspaceOperationalStatus}><StatusBadge tone={repair.currentSituation.repairStatus.tone}>{repair.currentSituation.repairStatus.label}</StatusBadge></dd></div>
            <div><dt>Técnico</dt><dd>{currentTechnician?.displayName ?? 'Sin asignar'}</dd></div>
            <div><dt>Custodia</dt><dd>{repair.currentSituation.custody.label}</dd></div>
            <div><dt>Ubicación</dt><dd>{repair.currentSituation.location?.label ?? 'Sin registrar'}</dd></div>
          </dl>
        </div>
      </section>

      <div className={styles.workspaceMain}>
        <article className={styles.intakeCard} aria-labelledby="intake-title">
          <header>
            <h2 id="intake-title">Recepción</h2>
          </header>
          <div className={styles.receptionContent}>
            <section className={`${styles.receptionGroup} ${styles.receptionProblemGroup}`} aria-labelledby={`reception-problem-${repair.id}`}>
              <h3 id={`reception-problem-${repair.id}`}>Problema y contexto</h3>
              <div className={styles.receptionProblemContent}>
                <div className={styles.receptionPrimaryProblem}>
                  <span className={styles.receptionFactLabel}>Problemas reportados</span>
                  <span className={styles.classificationChips}>{repair.intake.reportedProblems.length === 0 ? <em>{optionalValue(repair.intake.reportedIssue, 'Sin problema reportado')}</em> : repair.intake.reportedProblems.map((problem) => <span key={problem.problemCaptureId} data-inactive={problem.status === 'inactive'}>{problem.label}{problem.status === 'pending' ? ' · Por revisar' : problem.status === 'inactive' ? ' · Inactiva' : ''}</span>)}</span>
                </div>
                {repair.intake.customerNarrative?.trim() ? <div className={styles.receptionNarrative}>
                  <span className={styles.receptionFactLabel}>Relato del cliente</span>
                  <p>{repair.intake.customerNarrative}</p>
                </div> : null}
              </div>

              <div className={styles.receptionClassification}>
                <div>
                  <span className={styles.receptionFactLabel}>Clasificación</span>
                  <span className={styles.classificationChips}>{repair.problemClassifications.length === 0 ? <em>Sin clasificación</em> : repair.problemClassifications.map((category) => <span key={category.categoryId} data-inactive={category.status === 'inactive'}>{category.label}{category.status === 'inactive' ? ' · Inactiva' : ''}{canClassify ? <button type="button" disabled={classificationBusy} aria-label={`Retirar ${category.label}`} onClick={() => { void removeClassification(category); }}>×</button> : null}</span>)}</span>
                </div>
                {canClassify ? <Button size="compact" tone="quiet" onClick={openClassification}>+ Agregar categoría</Button> : null}
                {classificationMessage && !classificationOpen ? <small role="status">{classificationMessage}</small> : null}
              </div>
            </section>

            {(hasPhysicalState || hasReceivedEquipmentFacts) ? <div className={styles.receptionTwinGroups}>
              {hasPhysicalState ? <section className={styles.receptionGroup} aria-labelledby={`reception-physical-${repair.id}`}>
                <h3 id={`reception-physical-${repair.id}`}>Estado físico recibido</h3>
                <dl className={styles.receptionFactGrid}>
                  {repair.intake.physicalConditionSummary?.trim() ? <div><dt>Condición física</dt><dd>{repair.intake.physicalConditionSummary}</dd></div> : null}
                  {repair.receivedDevice.color?.trim() ? <div><dt>Color</dt><dd>{repair.receivedDevice.color}</dd></div> : null}
                  {repair.intake.receivedPowerState ? <div><dt>Estado al recibir</dt><dd>{receivedPowerState(repair.intake.receivedPowerState)}</dd></div> : null}
                </dl>
              </section> : null}

              {hasReceivedEquipmentFacts ? <section className={styles.receptionGroup} aria-labelledby={`reception-equipment-${repair.id}`}>
                <h3 id={`reception-equipment-${repair.id}`}>Equipo recibido</h3>
                <dl className={styles.receptionFactGrid}>
                  {repair.receivedDevice.type?.trim() ? <div><dt>Tipo</dt><dd>{repair.receivedDevice.type}</dd></div> : null}
                  {(repair.receivedDevice.identifierUnavailable || repair.receivedDevice.identifier?.trim()) ? <div><dt>IMEI / Serie</dt><dd>{repair.receivedDevice.identifierUnavailable ? 'No disponible' : repair.receivedDevice.identifier}</dd></div> : null}
                  {repair.receivedDevice.accessories.simIncluded !== null ? <div><dt>SIM</dt><dd>{includedAccessory(repair.receivedDevice.accessories.simIncluded)}</dd></div> : null}
                  {repair.receivedDevice.accessories.memoryCardIncluded !== null ? <div><dt>Memoria</dt><dd>{includedAccessory(repair.receivedDevice.accessories.memoryCardIncluded)}</dd></div> : null}
                  {repair.receivedDevice.accessories.other?.trim() ? <div className={styles.receptionWideFact}><dt>Accesorios</dt><dd>{repair.receivedDevice.accessories.other}</dd></div> : null}
                </dl>
              </section> : null}
            </div> : null}

            {hasSpecialConditions ? <section className={styles.receptionGroup} aria-labelledby={`reception-special-${repair.id}`}>
              <h3 id={`reception-special-${repair.id}`}>Condiciones especiales</h3>
              <dl className={styles.receptionFactGrid}>
                {repair.intake.warrantyReviewRequested ? <div><dt>Garantía</dt><dd>Revisión solicitada</dd></div> : null}
                {repair.intake.previousRepairId ? <div><dt>Reparación anterior</dt><dd><Link className={styles.actionLink} to={`/reparaciones/${repair.intake.previousRepairId}`}>Ver reparación relacionada</Link></dd></div> : null}
                {repair.intake.deliveredByName?.trim() ? <div><dt>Entrega</dt><dd>{repair.intake.deliveredByName}</dd></div> : null}
                {repair.intake.acceptedInterventionRisks.length > 0 ? <div className={styles.receptionWideFact}>
                  <dt>Riesgos aceptados</dt>
                  <dd><span className={styles.receptionRiskChips}>{repair.intake.acceptedInterventionRisks.map((risk, index) => <span key={`${risk.label}-${index}`}>{risk.label}</span>)}</span></dd>
                </div> : null}
                {repair.intake.documentedRiskSummary?.trim() ? <div className={styles.receptionWideFact}><dt>Detalle comunicado</dt><dd>{repair.intake.documentedRiskSummary}</dd></div> : null}
              </dl>
            </section> : null}

            {repair.intake.deviceAccessType ? <section className={`${styles.receptionGroup} ${styles.receptionAccess}`} aria-labelledby={`reception-access-${repair.id}`}>
              <h3 id={`reception-access-${repair.id}`}>Acceso</h3>
              <p>{accessType(repair.intake.deviceAccessType)}</p>
            </section> : null}

            {repair.intake.receivedBy ? <p className={styles.receptionAttribution}>Recibió: <strong>{repair.intake.receivedBy.displayName}</strong></p> : null}
          </div>
        </article>

        <section className={styles.repairTimeline} data-empty={repair.timeline.items.length === 0} aria-labelledby="repair-timeline-title">
          <header>
            <h2 id="repair-timeline-title">Historial</h2>
            {repair.timeline.totalCount > repair.timeline.items.length ? (
              <span>Últimas {repair.timeline.items.length} de {repair.timeline.totalCount}</span>
            ) : (
              <span>{repair.timeline.totalCount} {repair.timeline.totalCount === 1 ? 'evento' : 'eventos'}</span>
            )}
          </header>

          {canAddNote ? <form className={styles.noteComposer} onSubmit={(event) => void submitNote(event)}>
            <label htmlFor={`operational-note-${repair.id}`}>Agregar nota operativa</label>
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

          <div className={styles.timelineContent}>
            {repair.timeline.items.length === 0 ? (
              <div className={styles.timelineEmpty}>
                <strong>No hay actividad registrada todavía.</strong>
                <span>Las notas y actividades aparecerán aquí.</span>
              </div>
            ) : (
              <ol className={styles.timelineList} aria-label="Historial de actividad, de la más reciente a la más antigua">
                {repair.timeline.items.map((entry) => (
                  <RepairTimelineEntry key={entry.id} entry={entry} timeZone={timeZone} />
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className={styles.repairConcepts} aria-labelledby="repair-concepts-title">
          <header>
            <h2 id="repair-concepts-title">Conceptos</h2>
            <span>Próximamente</span>
          </header>
          <div className={styles.conceptsPlaceholder}>
            <p>Las refacciones, servicios y conceptos personalizados aparecerán aquí cuando Lista de precios y Caja estén disponibles.</p>
          </div>
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
        open={classificationOpen}
        title="Clasificación del problema"
        description="Selecciona una o varias categorías activas para reportes. No sustituye el diagnóstico."
        onClose={() => !classificationBusy && setClassificationOpen(false)}
        footer={<><Button disabled={classificationBusy} onClick={() => setClassificationOpen(false)}>Cancelar</Button><Button tone="primary" disabled={classificationBusy} onClick={() => { void saveClassification(); }}>Guardar</Button></>}
      >
        <div className={styles.classificationOptions}>{categoryOptions.length === 0 ? <p>No hay categorías activas disponibles.</p> : categoryOptions.map((category) => <label key={category.categoryId}><input type="checkbox" checked={selectedCategoryIds.has(category.categoryId)} onChange={(event) => setSelectedCategoryIds((current) => { const next = new Set(current); if (event.target.checked) next.add(category.categoryId); else next.delete(category.categoryId); return next; })} /><span>{category.label}</span></label>)}{classificationMessage ? <p aria-live="polite">{classificationMessage}</p> : null}</div>
      </Dialog>

      <Dialog
        open={correctionOpen}
        title="Corregir equipo"
        description="Actualiza únicamente la Marca y el Modelo de esta reparación. La captura anterior quedará en el historial."
        onClose={() => { if (!correctionBusy) setCorrectionOpen(false); }}
        footer={false}
      >
        <form className={styles.equipmentCorrectionForm} onSubmit={(event) => { void submitEquipmentCorrection(event); }}>
          <Field id={`correction-brand-${repair.id}`} label="Marca" hint={canonicalBrandId ? 'Marca canónica seleccionada.' : 'Entrada libre; quedará pendiente de reconciliación.'} required>
            <div className={styles.correctionAutocomplete}>
              <Input id={`correction-brand-${repair.id}`} value={brandValue} maxLength={160} autoComplete="off" required aria-autocomplete="list" onChange={(event) => { setBrandValue(event.target.value); setCanonicalBrandId(null); setCanonicalModelId(null); correctionRequestId.current = null; }} />
              {brandValue.trim() && brandOptions.length > 0 ? <div className={styles.correctionOptions} role="listbox" aria-label="Marcas sugeridas">{brandOptions.map((brand) => <button key={brand.brandId} type="button" role="option" aria-selected={canonicalBrandId === brand.brandId} onClick={() => { if (canonicalBrandId !== brand.brandId) { setModelValue(''); setCanonicalModelId(null); } setBrandValue(brand.label); setCanonicalBrandId(brand.brandId); setBrandOptions([]); correctionRequestId.current = null; }}><strong>{brand.label}</strong><small>{brand.scope === 'platform' ? 'Plataforma' : 'Organización'}</small></button>)}</div> : null}
            </div>
          </Field>
          <Field id={`correction-model-${repair.id}`} label="Modelo" hint={canonicalBrandId ? canonicalModelId ? 'Modelo canónico de la Marca seleccionada.' : 'Selecciona una sugerencia o conserva entrada libre.' : 'Entrada libre; selecciona primero una Marca canónica para ver sugerencias.'} required>
            <div className={styles.correctionAutocomplete}>
              <Input id={`correction-model-${repair.id}`} value={modelValue} maxLength={160} autoComplete="off" required aria-autocomplete="list" onChange={(event) => { setModelValue(event.target.value); setCanonicalModelId(null); correctionRequestId.current = null; }} />
              {canonicalBrandId && modelValue.trim() && modelOptions.length > 0 ? <div className={styles.correctionOptions} role="listbox" aria-label="Modelos sugeridos">{modelOptions.map((model) => <button key={model.modelId} type="button" role="option" aria-selected={canonicalModelId === model.modelId} onClick={() => { setModelValue(model.label); setCanonicalModelId(model.modelId); setModelOptions([]); correctionRequestId.current = null; }}><strong>{model.label}</strong><small>{model.brandLabel}</small></button>)}</div> : null}
            </div>
          </Field>
          <Field id={`correction-reason-${repair.id}`} label="Motivo" hint={`${correctionReason.length} / 400`} required>
            <Textarea id={`correction-reason-${repair.id}`} value={correctionReason} minLength={3} maxLength={400} required placeholder="Ej. Error de captura" onChange={(event) => { setCorrectionReason(event.target.value); correctionRequestId.current = null; }} />
          </Field>
          <p className={styles.correctionMessage} data-error={correctionMessage && correctionMessage !== 'Guardando corrección…'} aria-live="polite">{correctionMessage}</p>
          <div className={styles.equipmentCorrectionActions}><Button disabled={correctionBusy} onClick={() => setCorrectionOpen(false)}>Cancelar</Button><Button type="submit" tone="primary" disabled={correctionBusy || !brandValue.trim() || !modelValue.trim() || correctionReason.trim().length < 3}>{correctionBusy ? 'Guardando…' : 'Guardar corrección'}</Button></div>
        </form>
      </Dialog>

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
        onEquipmentCorrected={() => load()}
        onClassificationChanged={() => load()}
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
