import { Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getPreviewContext, getPreviewRepair, transitionPreviewRepair } from '../api.js';
import type { PreviewContext, PreviewRepairDetail, PreviewRepairStatus } from '../api.js';
import { Button } from '../components/ui/controls.js';
import { Alert, ErrorState, Skeleton } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { RepairStatus, dateTime, statusLabels } from './repair-view.js';
import styles from './pages.module.css';

export function RepairDetailPage(): React.JSX.Element {
  const { id = '' } = useParams();
  const [repair, setRepair] = useState<PreviewRepairDetail | null>(null);
  const [context, setContext] = useState<PreviewContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([getPreviewRepair(id, controller.signal), getPreviewContext(controller.signal)])
      .then(([record, operationalContext]) => { setRepair(record); setContext(operationalContext); })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'No fue posible cargar el detalle.');
      });
    return () => controller.abort();
  }, [id]);

  async function transition(status: PreviewRepairStatus): Promise<void> {
    if (!repair) return;
    setSaving(true);
    setError(null);
    try { setRepair(await transitionPreviewRepair(repair, status)); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'No fue posible actualizar el estado.'); }
    finally { setSaving(false); }
  }

  if (error && !repair) return (
    <div className={`${styles.pageStack} ${styles.narrow}`}>
      <PageHeader
        eyebrow="Operación"
        title="Detalle de reparación"
        description="La superficie conserva una jerarquía accesible aunque el registro operativo no esté disponible."
        breadcrumb={[{ label: 'Reparaciones', to: '/reparaciones' }, { label: 'Detalle no disponible' }]}
      />
      <ErrorState title="Detalle no disponible" description="La API de Reparaciones no está materializada; no existe un registro operativo que mostrar." action={{ label: 'Volver a reparaciones', to: '/reparaciones' }} />
    </div>
  );
  if (!repair) return (
    <div className={`${styles.pageStack} ${styles.narrow}`}>
      <PageHeader
        eyebrow="Operación"
        title="Detalle de reparación"
        description="Cargando la superficie solicitada sin asumir que el registro existe."
        breadcrumb={[{ label: 'Reparaciones', to: '/reparaciones' }, { label: 'Cargando detalle' }]}
      />
      <div className={styles.loadingDetail}><Skeleton rows={5} /></div>
    </div>
  );

  const next: Readonly<Record<PreviewRepairStatus, readonly PreviewRepairStatus[]>> = {
    received: ['diagnosing', 'cancelled'], diagnosing: ['ready', 'cancelled'], ready: ['delivered', 'cancelled'], delivered: [], cancelled: [],
  };

  return (
    <div className={`${styles.pageStack} ${styles.narrow}`}>
      <PageHeader
        eyebrow={repair.folio}
        title={`${repair.deviceBrand} ${repair.deviceModel}`}
        description={`${repair.customerName} · recibido ${dateTime(repair.createdAt)}`}
        breadcrumb={[{ label: 'Reparaciones', to: '/reparaciones' }, { label: repair.folio }]}
        status={<RepairStatus status={repair.status} />}
      />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <section className={styles.detailGrid}>
        <article className={styles.detailCard}><header><h2>Recepción</h2><span>Rev. {repair.revision}</span></header><dl>
          <div><dt>Cliente</dt><dd>{repair.customerName}</dd></div><div><dt>Teléfono</dt><dd>{repair.customerPhone}</dd></div>
          <div><dt>Equipo</dt><dd>{repair.deviceBrand} {repair.deviceModel}</dd></div><div><dt>IMEI o serie</dt><dd>{repair.deviceSerial ?? 'No registrado'}</dd></div>
          <div><dt>Color</dt><dd>{repair.deviceColor ?? 'No registrado'}</dd></div><div className={styles.detailWide}><dt>Problema reportado</dt><dd>{repair.reportedProblem}</dd></div>
          <div className={styles.detailWide}><dt>Condición física</dt><dd>{repair.physicalCondition ?? 'No registrada'}</dd></div><div className={styles.detailWide}><dt>Observaciones</dt><dd>{repair.notes ?? 'Sin observaciones'}</dd></div>
          <div><dt>Precio estimado</dt><dd className={styles.tabular}>{repair.estimatedPrice === null ? 'No registrado' : `$${repair.estimatedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}</dd></div>
          <div><dt>Anticipo sintético</dt><dd className={styles.tabular}>${repair.depositAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</dd></div>
          <div><dt>Empresa</dt><dd>{context?.tenantName ?? 'Sin verificar'}</dd></div><div><dt>Sucursal</dt><dd>{context?.branchName ?? 'Sin verificar'}</dd></div>
          <div><dt>Estación</dt><dd>{context?.stationLabel ?? 'Sin verificar'}</dd></div><div><dt>Actualizada</dt><dd className={styles.tabular}>{dateTime(repair.updatedAt)}</dd></div>
        </dl></article>
        <article className={styles.detailCard}><header><h2>Cambiar estado</h2></header>{next[repair.status].length > 0 ? <div className={styles.statusActions}>{next[repair.status].map((status) => <Button key={status} disabled={saving} onClick={() => { void transition(status); }}>{statusLabels[status]}</Button>)}</div> : <p className={styles.muted}>Este estado es terminal para la demostración visual.</p>}</article>
        <article className={styles.detailCard}><header><h2>Historial</h2><span>{repair.history.length} eventos</span></header><ol className={styles.timeline}>{repair.history.map((event) => <li key={event.id}><Clock3 aria-hidden="true" size={16} /><div><strong>{statusLabels[event.toStatus]}</strong><small>{dateTime(event.changedAt)} · {event.actorLabel}</small><p>{event.fromStatus ? `${statusLabels[event.fromStatus]} → ${statusLabels[event.toStatus]}` : 'Reparación recibida'}</p></div><b>Rev. {event.resultingRevision}</b></li>)}</ol></article>
      </section>
    </div>
  );
}
