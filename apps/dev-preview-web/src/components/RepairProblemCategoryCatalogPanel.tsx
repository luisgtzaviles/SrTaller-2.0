import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { changeProblemCategoryStatus, createProblemCategory, deleteProblemCategory, getAdminProblemCategories, getPendingProblems, PreviewApiError, renameProblemCategory, resolvePendingProblem } from '../api.js';
import type { PendingRepairProblem, RepairProblemCategory } from '../api.js';
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
  CatalogReconciliationSummary,
  CatalogRowActions,
  CatalogScopeBadge,
  CatalogStatusBadge,
  CatalogTable,
  CatalogToolbar,
  CatalogUsage,
  catalogAdministrationStyles as styles,
  formatCatalogResultCount,
} from './catalogs/CatalogAdministration.js';
import type { CatalogLifecycle, CatalogRowAction, CatalogSurface } from './catalogs/CatalogAdministration.js';
import { Button, Field, Input, Select } from './ui/controls.js';
import { Dialog } from './ui/overlays.js';

function message(error: unknown): string {
  if (error instanceof PreviewApiError && error.code === 'REPAIR_PROBLEM_CATEGORY_DUPLICATE') return 'Ya existe una categoría equivalente en el catálogo efectivo.';
  if (error instanceof PreviewApiError && error.code === 'REPAIR_PROBLEM_CATEGORY_DELETE_NOT_ALLOWED') return 'La categoría forma parte de la historia operacional y no puede eliminarse. Puedes desactivarla.';
  if (error instanceof PreviewApiError && error.status === 403) return 'Tu sesión no tiene autorización para administrar este catálogo.';
  if (error instanceof PreviewApiError && error.status === 409) return 'El catálogo cambió durante la operación. Revisa la versión vigente.';
  return error instanceof Error ? error.message : 'No fue posible actualizar el catálogo.';
}
function date(value: string): string { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value)); }

export function RepairProblemCategoryCatalogPanel({ canManage, csrfToken }: Readonly<{ canManage: boolean; csrfToken: string }>): React.JSX.Element {
  const [items, setItems] = useState<readonly RepairProblemCategory[]>([]);
  const [pending, setPending] = useState<readonly PendingRepairProblem[]>([]);
  const [surface, setSurface] = useState<CatalogSurface>('canonical');
  const [status, setStatus] = useState<CatalogLifecycle>('active');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<RepairProblemCategory | 'new' | null>(null);
  const [label, setLabel] = useState('');
  const [transition, setTransition] = useState<RepairProblemCategory | null>(null);
  const [deletion, setDeletion] = useState<RepairProblemCategory | null>(null);
  const [resolution, setResolution] = useState<PendingRepairProblem | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'existing' | 'new'>('existing');
  const [resolutionCategoryId, setResolutionCategoryId] = useState('');
  const [resolutionLabel, setResolutionLabel] = useState('');

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    void Promise.all([getAdminProblemCategories(signal), getPendingProblems(signal)]).then(([catalog, review]) => {
      setItems(catalog.items); setPending(review.items);
      if (!review.items.some((item) => item.status === 'pending')) setSurface('canonical');
      setError(null);
    }).catch((cause: unknown) => {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(message(cause));
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);

  const activeCount = items.filter((item) => item.status === 'active').length;
  const visible = status === 'all' ? items : items.filter((item) => item.status === status);
  const pendingItems = pending.filter((item) => item.status === 'pending');

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editor || !canManage || label.trim().length < 2) return;
    const normalizedLabel = normalizeRelatedRepairCatalogInput('problemCategory', label);
    setBusy(true); setError(null); setNotice(null);
    try {
      if (editor === 'new') await createProblemCategory(normalizedLabel, csrfToken);
      else await renameProblemCategory(editor.categoryId, normalizedLabel, editor.version, csrfToken);
      setNotice(editor === 'new' ? 'Categoría creada para toda la organización.' : 'Categoría actualizada; conservó su identificador estable.');
      setEditor(null); load();
    } catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  };

  const changeStatus = async () => {
    if (!transition || !canManage) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const next = transition.status === 'active' ? 'inactive' : 'active';
      await changeProblemCategoryStatus(transition.categoryId, next, transition.version, csrfToken);
      setNotice(next === 'active' ? 'Categoría reactivada.' : 'Categoría desactivada; permanece visible donde ya fue asignada.');
      setTransition(null); load();
    } catch (cause) { setError(message(cause)); setTransition(null); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!deletion || !deletion.deletable || !canManage) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await deleteProblemCategory(deletion.categoryId, deletion.version, csrfToken);
      setNotice(`“${deletion.label}” se eliminó definitivamente porque nunca tuvo uso operacional.`);
      setDeletion(null); load();
    } catch (cause) { setError(message(cause)); setDeletion(null); load(); } finally { setBusy(false); }
  };

  const openResolution = (item: PendingRepairProblem) => {
    setResolution(item); setResolutionMode('existing'); setResolutionCategoryId(items.find((category) => category.status === 'active')?.categoryId ?? ''); setResolutionLabel(item.rawLabel);
  };
  const resolve = async (event: React.FormEvent) => {
    event.preventDefault(); if (!resolution || !canManage) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const normalizedResolutionLabel = normalizeRelatedRepairCatalogInput('problemCategory', resolutionLabel);
      await resolvePendingProblem(resolution.pendingProblemValueId, resolutionMode === 'existing' ? { canonicalCategoryId: resolutionCategoryId } : { canonicalLabel: normalizedResolutionLabel }, resolution.version, csrfToken);
      setNotice(`“${resolution.rawLabel}” quedó reconciliado. Las capturas conservan su texto original y muestran la categoría vigente.`);
      setResolution(null); load();
    } catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  };

  function actions(item: RepairProblemCategory): readonly CatalogRowAction[] {
    if (item.scope === 'platform' || !canManage) return [];
    const result: CatalogRowAction[] = [
      { key: 'edit', id: `edit-category-${item.categoryId}`, label: 'Editar', icon: Pencil, onClick: () => { setLabel(item.label); setEditor(item); } },
    ];
    if (item.status === 'inactive' || !item.deletable) result.push({ key: 'lifecycle', label: item.status === 'active' ? 'Desactivar' : 'Reactivar', icon: item.status === 'inactive' ? RotateCcw : undefined, onClick: () => setTransition(item) });
    if (item.deletable) result.push({ key: 'delete', label: 'Eliminar', icon: Trash2, tone: 'danger', onClick: () => setDeletion(item) });
    return result;
  }

  return <>
    <CatalogPanel labelledBy="problem-categories-title">
      <CatalogHeader id="problem-categories-title" title="Categorías de problema" description="Clasificación estructurada para recepción y reportes." metadata={<CatalogReconciliationSummary canonicalCount={items.length} pendingCount={pendingItems.length} value={surface} onChange={setSurface} />} canManage={canManage} action={surface === 'canonical' ? <Button id="add-problem-category" tone="primary" size="compact" onClick={() => { setLabel(''); setEditor('new'); }}><Plus size={16} aria-hidden="true" />Agregar categoría</Button> : undefined} />
      <CatalogFeedback error={error} success={notice} successTitle="Cambio guardado" />
      <CatalogToolbar lifecycleFilter={surface === 'canonical' ? <CatalogLifecycleFilter value={status} activeCount={activeCount} inactiveCount={items.length - activeCount} onChange={setStatus} label="Filtrar categorías por estado" /> : undefined} result={surface === 'canonical' ? formatCatalogResultCount(visible.length) : `${pendingItems.length} por revisar`} />
      {loading ? <CatalogLoadingState /> : surface === 'canonical' ? <CatalogTable>
        <thead><tr><th>Categoría</th><th data-mobile-hidden="true">Alcance</th><th>Estado</th><th data-mobile-hidden="true"><CatalogCanonicalUsageHeader /></th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead>
        <tbody>{visible.length === 0 ? <CatalogEmptyRow colSpan={5}>No hay categorías {status === 'active' ? 'activas' : status === 'inactive' ? 'inactivas' : 'en el catálogo'}.</CatalogEmptyRow> : visible.map((item) => <tr key={item.categoryId} data-status={item.status}>
          <td><CatalogEntityName label={item.label} secondary={`v${item.version}`} /></td><td data-mobile-hidden="true"><CatalogScopeBadge scope={item.scope} /></td><td><CatalogStatusBadge status={item.status} /></td><td data-mobile-hidden="true"><CatalogUsage count={item.usageCount} /></td><td><CatalogRowActions actions={actions(item)} emptyLabel={item.scope === 'platform' ? 'Sólo lectura' : 'Sin permisos de edición'} /></td>
        </tr>)}</tbody>
      </CatalogTable> : <CatalogTable>
        <thead><tr><th>Valor capturado</th><th data-mobile-hidden="true">Uso</th><th data-mobile-hidden="true">Primera vez</th><th data-mobile-hidden="true">Última vez</th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead>
        <tbody>{pendingItems.length === 0 ? <CatalogEmptyRow colSpan={5}>No hay valores por revisar.</CatalogEmptyRow> : pendingItems.map((item) => <tr key={item.pendingProblemValueId}>
          <td><CatalogEntityName label={normalizeRelatedRepairCatalogInput('problemCategory', item.rawLabel)} secondary={`Pendiente · v${item.version}`} /></td><td data-mobile-hidden="true"><CatalogUsage count={item.usageCount} /></td><td data-mobile-hidden="true">{date(item.firstSeenAt)}</td><td data-mobile-hidden="true">{date(item.lastSeenAt)}</td><td><CatalogRowActions actions={canManage ? [{ key: 'resolve', label: 'Resolver', tone: 'primary', onClick: () => openResolution(item) }] : []} emptyLabel="Sin permisos de edición" /></td>
        </tr>)}</tbody>
      </CatalogTable>}
    </CatalogPanel>

    <Dialog open={editor !== null} title={editor === 'new' ? 'Agregar categoría' : 'Editar categoría'} description="Identidad canónica para clasificación y reportes." restoreFocusSelector={editor === 'new' ? '#add-problem-category' : editor ? `#edit-category-${editor.categoryId}` : undefined} onClose={() => !busy && setEditor(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void save(event); }}><Field id="problem-category-label" label="Nombre de la categoría" required hint="Los duplicados normalizados se rechazan."><Input id="problem-category-label" value={label} minLength={2} maxLength={160} onChange={(event) => setLabel(event.target.value)} onBlur={() => setLabel(normalizeRelatedRepairCatalogInput('problemCategory', label))} /></Field><dl><div><dt>Alcance</dt><dd>Organización</dd></div></dl><div className={styles.dialogActions}><Button onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || label.trim().length < 2}>Guardar</Button></div></form></Dialog>
    <Dialog open={transition !== null} title={transition?.status === 'active' ? 'Desactivar categoría' : 'Reactivar categoría'} description={transition?.label ?? ''} onClose={() => !busy && setTransition(null)} footer={<><Button onClick={() => setTransition(null)}>Cancelar</Button><Button tone={transition?.status === 'active' ? 'danger' : 'primary'} onClick={() => { void changeStatus(); }}>{transition?.status === 'active' ? 'Desactivar' : 'Reactivar'}</Button></>}><p className={styles.confirmCopy}>{transition?.status === 'active' ? 'Dejará de estar disponible para nuevas capturas; las asociaciones actuales conservarán su visualización.' : 'Volverá a estar disponible para recepción y clasificación.'}</p></Dialog>
    <Dialog open={deletion !== null} title="¿Eliminar esta categoría?" description={deletion?.label ?? ''} onClose={() => !busy && setDeletion(null)} footer={<><Button onClick={() => setDeletion(null)}>Cancelar</Button><Button tone="danger" disabled={busy} onClick={() => { void remove(); }}>Eliminar definitivamente</Button></>}><p className={styles.confirmCopy}>Nunca ha sido utilizada por una reparación.<br />Esta acción eliminará definitivamente el registro.</p></Dialog>
    <Dialog open={resolution !== null} title="Resolver valor capturado" description={resolution?.rawLabel ?? ''} onClose={() => !busy && setResolution(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void resolve(event); }}><div className={styles.resolutionModes} role="group" aria-label="Tipo de resolución"><label><input type="radio" name="resolutionMode" checked={resolutionMode === 'existing'} onChange={() => setResolutionMode('existing')} />Categoría existente</label><label><input type="radio" name="resolutionMode" checked={resolutionMode === 'new'} onChange={() => setResolutionMode('new')} />Crear categoría de Organización</label></div>{resolutionMode === 'existing' ? <Field id="problem-resolution-category" label="Categoría" required><Select id="problem-resolution-category" value={resolutionCategoryId} required onChange={(event) => setResolutionCategoryId(event.target.value)}><option value="">Seleccionar</option>{items.filter((item) => item.status === 'active').map((item) => <option key={item.categoryId} value={item.categoryId}>{item.label}</option>)}</Select></Field> : <Field id="problem-resolution-label" label="Nueva categoría" required><Input id="problem-resolution-label" value={resolutionLabel} minLength={2} maxLength={160} onChange={(event) => setResolutionLabel(event.target.value)} onBlur={() => setResolutionLabel(normalizeRelatedRepairCatalogInput('problemCategory', resolutionLabel))} /></Field>}<p className={styles.confirmCopy}>La identidad de reporte cambia a la categoría elegida. El texto capturado permanece como snapshot de auditoría.</p><div className={styles.dialogActions}><Button onClick={() => setResolution(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || (resolutionMode === 'existing' ? !resolutionCategoryId : resolutionLabel.trim().length < 2)}>Resolver</Button></div></form></Dialog>
  </>;
}
