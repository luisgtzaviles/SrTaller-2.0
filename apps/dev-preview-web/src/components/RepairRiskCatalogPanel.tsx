import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  changeRepairRiskStatus,
  createRepairRisk,
  deleteRepairRisk,
  getAdminRepairRisks,
  PreviewApiError,
  renameRepairRisk,
} from '../api.js';
import type { AdminRepairRisk } from '../api.js';
import { normalizeRelatedRepairCatalogInput } from '../../../../src/modules/repairs/domain/new-repair-input-normalization.js';
import {
  CatalogEmptyRow,
  CatalogCanonicalUsageHeader,
  CatalogEntityName,
  CatalogFeedback,
  CatalogHeader,
  CatalogLifecycleFilter,
  CatalogLoadingState,
  CatalogPanel,
  CatalogRowActions,
  CatalogSafeDeleteDialog,
  CatalogScopeBadge,
  CatalogStatusBadge,
  CatalogTable,
  CatalogToolbar,
  CatalogUsage,
  catalogAdministrationStyles as styles,
  catalogSafeDeleteFailure,
  formatCatalogResultCount,
  deriveCatalogLifecycleActions,
} from './catalogs/CatalogAdministration.js';
import type { CatalogLifecycle, CatalogRowAction } from './catalogs/CatalogAdministration.js';
import { Button, Field, Input } from './ui/controls.js';
import { Alert } from './ui/feedback.js';
import { Dialog } from './ui/overlays.js';

type CatalogNotice = Readonly<{ title: string; message: string }>;

function mutationMessage(error: unknown): string {
  if (error instanceof PreviewApiError && error.code === 'REPAIR_RISK_DUPLICATE') return 'Ya existe un riesgo equivalente en el catálogo efectivo. Usa un nombre diferente.';
  if (error instanceof PreviewApiError && error.code === 'REPAIR_RISK_VERSION_CONFLICT') return 'Este riesgo cambió mientras lo editabas. Cierra este diálogo y vuelve a abrir Editar para usar la versión vigente.';
  if (error instanceof PreviewApiError && error.status === 409) return 'El catálogo cambió durante la operación. La lista se actualizó; revisa la versión vigente.';
  if (error instanceof PreviewApiError && error.status === 403) return 'Tu sesión ya no tiene autorización para administrar este catálogo.';
  return error instanceof Error ? error.message : 'No fue posible actualizar el catálogo.';
}

export function RepairRiskCatalogPanel({ canManage, csrfToken }: Readonly<{
  canManage: boolean;
  csrfToken: string;
}>): React.JSX.Element {
  const [risks, setRisks] = useState<readonly AdminRepairRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<CatalogNotice | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [status, setStatus] = useState<CatalogLifecycle>('active');
  const [editor, setEditor] = useState<AdminRepairRisk | 'new' | null>(null);
  const [label, setLabel] = useState('');
  const [transition, setTransition] = useState<AdminRepairRisk | null>(null);
  const [deletion, setDeletion] = useState<AdminRepairRisk | null>(null);
  const activeCount = risks.filter((risk) => risk.status === 'active').length;
  const inactiveCount = risks.length - activeCount;
  const visible = status === 'all' ? risks : risks.filter((risk) => risk.status === status);

  const load = useCallback((signal?: AbortSignal, preserveError = false): void => {
    setLoading(true);
    void getAdminRepairRisks(signal).then((response) => {
      setRisks(response.items);
      if (!preserveError) setError(null);
    }).catch((cause: unknown) => {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'No fue posible cargar los riesgos.');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const openCreate = (): void => { setLabel(''); setEditor('new'); setNotice(null); setDialogError(null); };
  const openEdit = (risk: AdminRepairRisk): void => { setLabel(risk.label); setEditor(risk); setNotice(null); setDialogError(null); };

  const save = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!editor || !canManage || label.trim().length < 2) return;
    const normalizedLabel = normalizeRelatedRepairCatalogInput('risk', label);
    setBusy(true); setError(null); setDialogError(null);
    try {
      if (editor === 'new') {
        await createRepairRisk(normalizedLabel, csrfToken);
        setNotice({ title: 'Riesgo creado.', message: 'Ya está disponible para todas las sucursales de la organización y en Nueva reparación.' });
      } else {
        await renameRepairRisk(editor.riskId, normalizedLabel, editor.version, csrfToken);
        setNotice({ title: 'Riesgo actualizado.', message: 'El identificador se conservó; las reparaciones históricas mantienen el nombre capturado.' });
      }
      setEditor(null); load();
    } catch (cause: unknown) {
      setDialogError(mutationMessage(cause)); load(undefined, true);
    } finally { setBusy(false); }
  };

  const confirmTransition = async (): Promise<void> => {
    if (!transition || !canManage) return;
    setBusy(true); setError(null);
    const nextStatus = transition.status === 'active' ? 'inactive' : 'active';
    try {
      await changeRepairRiskStatus(transition.riskId, nextStatus, transition.version, csrfToken);
      setNotice(nextStatus === 'active'
        ? { title: 'Riesgo reactivado.', message: 'Volvió a estar disponible para nuevas reparaciones.' }
        : { title: 'Riesgo desactivado.', message: 'Ya no aparece en nuevas recepciones; las reparaciones existentes conservan su información.' });
      setTransition(null); load();
    } catch (cause: unknown) {
      setError(mutationMessage(cause)); setTransition(null); load(undefined, true);
    } finally { setBusy(false); }
  };
  const remove = async (): Promise<void> => {
    if (!deletion || !canManage) return;
    setBusy(true); setError(null);
    try { await deleteRepairRisk(deletion.riskId, deletion.version, csrfToken); setNotice({ title: 'Riesgo eliminado.', message: 'El registro sin referencias se eliminó definitivamente.' }); setDeletion(null); load(); }
    catch (cause) { setDeletion(null); setError(catalogSafeDeleteFailure(cause)); load(undefined, true); }
    finally { setBusy(false); }
  };

  function actions(risk: AdminRepairRisk): readonly CatalogRowAction[] {
    if (risk.scope === 'platform' || !canManage) return [];
    return deriveCatalogLifecycleActions({ idPrefix: `risk-${risk.riskId}`, status: risk.status, deletable: risk.deletable, busy, onEdit: () => openEdit(risk), onDelete: () => setDeletion(risk), onDeactivate: () => { setNotice(null); setTransition(risk); }, onReactivate: () => { setNotice(null); setTransition(risk); } });
  }

  return <>
    <CatalogPanel labelledBy="risks-title">
      <CatalogHeader id="risks-title" title="Riesgos" description="Riesgos de intervención comunicables durante la recepción." canManage={canManage} action={<Button id="add-repair-risk" tone="primary" size="compact" onClick={openCreate}><Plus size={16} aria-hidden="true" />Agregar riesgo</Button>} />
      <CatalogFeedback error={error} success={notice?.message ?? null} successTitle={notice?.title ?? 'Catálogo actualizado'} />
      <CatalogToolbar lifecycleFilter={<CatalogLifecycleFilter value={status} activeCount={activeCount} inactiveCount={inactiveCount} onChange={setStatus} label="Filtrar riesgos por estado" />} result={formatCatalogResultCount(visible.length)} />
      {loading ? <CatalogLoadingState /> : <CatalogTable>
        <thead><tr><th>Riesgo</th><th data-mobile-hidden="true">Alcance</th><th>Estado</th><th data-mobile-hidden="true"><CatalogCanonicalUsageHeader /></th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead>
        <tbody>{visible.length === 0 ? <CatalogEmptyRow colSpan={5}>No hay riesgos {status === 'inactive' ? 'inactivos' : status === 'active' ? 'activos' : 'disponibles'}.</CatalogEmptyRow> : visible.map((risk) => <tr key={risk.riskId} data-status={risk.status}>
          <td><CatalogEntityName label={risk.label} secondary={`v${risk.version}`} /></td>
          <td data-mobile-hidden="true"><CatalogScopeBadge scope={risk.scope} /></td>
          <td><CatalogStatusBadge status={risk.status} /></td>
          <td data-mobile-hidden="true"><CatalogUsage count={risk.usageCount} /></td>
          <td><CatalogRowActions actions={actions(risk)} emptyLabel={risk.scope === 'platform' ? 'Sólo lectura' : 'Sin permisos de edición'} /></td>
        </tr>)}</tbody>
      </CatalogTable>}
    </CatalogPanel>
    <Dialog open={editor !== null} title={editor === 'new' ? 'Agregar riesgo' : 'Editar riesgo'} description={editor === 'new' ? 'Se creará para toda la organización.' : 'El mismo identificador y las referencias existentes se conservarán.'} restoreFocusSelector={editor === 'new' ? '#add-repair-risk' : editor ? `#edit-risk-${editor.riskId}` : undefined} onClose={() => { if (!busy) { setEditor(null); setDialogError(null); } }} footer={false}>
      <form className={styles.editorForm} onSubmit={(event) => { void save(event); }}>
        {dialogError ? <Alert tone="danger" title="No fue posible guardar">{dialogError}</Alert> : null}
        <Field id="repair-risk-label" label="Nombre del riesgo" required hint="Se aplicará formato conservador; los duplicados normalizados se rechazan."><Input id="repair-risk-label" value={label} required minLength={2} maxLength={160} autoComplete="off" onChange={(event) => setLabel(event.target.value)} onBlur={() => setLabel(normalizeRelatedRepairCatalogInput('risk', label))} /></Field>
        <dl><div><dt>Alcance</dt><dd>Organización</dd></div></dl>
        <div className={styles.dialogActions}><Button disabled={busy} onClick={() => { setEditor(null); setDialogError(null); }}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || label.trim().length < 2}>{busy ? 'Guardando…' : 'Guardar'}</Button></div>
      </form>
    </Dialog>
    <Dialog open={transition !== null} title={transition?.status === 'active' ? 'Desactivar riesgo' : 'Reactivar riesgo'} description={transition?.label ?? 'Cambio de disponibilidad'} onClose={() => !busy && setTransition(null)} footer={<><Button disabled={busy} onClick={() => setTransition(null)}>Cancelar</Button><Button tone={transition?.status === 'active' ? 'secondary' : 'primary'} disabled={busy} onClick={() => { void confirmTransition(); }}>{transition?.status === 'active' ? 'Desactivar' : 'Reactivar'}</Button></>}>
      <p className={styles.confirmCopy}>{transition?.status === 'active' ? 'Este riesgo dejará de estar disponible para nuevas reparaciones. Las reparaciones existentes conservarán su información.' : 'Este riesgo volverá a estar disponible para nuevas reparaciones de todas las sucursales de la organización.'}</p>
    </Dialog>
    <CatalogSafeDeleteDialog open={deletion !== null} label={deletion?.label ?? ''} entityLabel="riesgo" busy={busy} restoreFocusSelector={deletion ? `#edit-risk-${deletion.riskId}` : undefined} onClose={() => setDeletion(null)} onConfirm={() => { void remove(); }} />
  </>;
}
