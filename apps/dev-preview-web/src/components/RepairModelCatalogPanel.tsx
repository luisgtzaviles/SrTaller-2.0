import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { changeRepairModelStatus, createRepairModel, deleteRepairModel, getAdminRepairBrands, getAdminRepairModels, getPendingRepairModels, PreviewApiError, renameRepairModel, resolvePendingRepairModel } from '../api.js';
import type { AdminRepairBrand, AdminRepairModel, PendingRepairModel } from '../api.js';
import { normalizeInputLookupKey, normalizeRelatedRepairCatalogInput } from '../../../../src/modules/repairs/domain/new-repair-input-normalization.js';
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
  CatalogSafeDeleteDialog,
  CatalogScopeBadge,
  CatalogStatusBadge,
  CatalogTable,
  CatalogToolbar,
  CatalogUsage,
  catalogAdministrationStyles as styles,
  catalogSafeDeleteFailure,
  deriveCatalogLifecycleActions,
  formatCatalogResultCount,
} from './catalogs/CatalogAdministration.js';
import type { CatalogLifecycle, CatalogRowAction, CatalogSurface } from './catalogs/CatalogAdministration.js';
import { Button, Field, Input, Select } from './ui/controls.js';
import { Dialog } from './ui/overlays.js';

function usage(count: number): string { return `${count} ${count === 1 ? 'reparación' : 'reparaciones'}`; }
function date(value: string): string { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value)); }
function message(error: unknown): string {
  if (error instanceof PreviewApiError && error.code === 'REPAIR_MODEL_DUPLICATE') return 'Ya existe un modelo equivalente para esta marca.';
  if (error instanceof PreviewApiError && error.code === 'REPAIR_MODEL_VERSION_CONFLICT') return 'Este modelo cambió mientras lo editabas. La lista se actualizó.';
  if (error instanceof PreviewApiError && error.status === 403) return 'Tu sesión ya no tiene autorización para administrar este catálogo.';
  return error instanceof Error ? error.message : 'No fue posible actualizar el catálogo.';
}

export function RepairModelCatalogPanel({ canManage, csrfToken }: Readonly<{ canManage: boolean; csrfToken: string }>): React.JSX.Element {
  const [brands, setBrands] = useState<readonly AdminRepairBrand[]>([]);
  const [models, setModels] = useState<readonly AdminRepairModel[]>([]);
  const [pending, setPending] = useState<readonly PendingRepairModel[]>([]);
  const [brandId, setBrandId] = useState('');
  const [surface, setSurface] = useState<CatalogSurface>('canonical');
  const [status, setStatus] = useState<CatalogLifecycle>('active');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<AdminRepairModel | 'new' | null>(null);
  const [label, setLabel] = useState('');
  const [editorBrandId, setEditorBrandId] = useState('');
  const [transition, setTransition] = useState<AdminRepairModel | null>(null);
  const [deletion, setDeletion] = useState<AdminRepairModel | null>(null);
  const [resolver, setResolver] = useState<PendingRepairModel | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'existing' | 'new'>('existing');
  const [resolutionModelId, setResolutionModelId] = useState('');
  const [resolutionQuery, setResolutionQuery] = useState('');
  const [resolutionLabel, setResolutionLabel] = useState('');

  const load = useCallback((signal?: AbortSignal, preserveError = false): void => {
    setLoading(true);
    void Promise.all([getAdminRepairBrands(signal), getAdminRepairModels(undefined, signal), getPendingRepairModels(undefined, signal)]).then(([brandResponse, modelResponse, pendingResponse]) => {
      setBrands(brandResponse.items); setModels(modelResponse.items); setPending(pendingResponse.items);
      if (!preserveError) setError(null);
    }).catch((cause: unknown) => {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'No fue posible cargar los modelos.');
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);

  const activeBrands = brands.filter((brand) => brand.status === 'active');
  const contextualModels = models.filter((model) => !brandId || model.brandId === brandId);
  const visibleModels = contextualModels.filter((model) => status === 'all' || model.status === status);
  const visiblePending = pending.filter((item) => !brandId || item.brandId === brandId);
  const activeCount = contextualModels.filter((model) => model.status === 'active').length;
  const resolutionCandidates = useMemo(() => {
    if (!resolver?.brandId) return [];
    const query = normalizeInputLookupKey(resolutionQuery);
    return models.filter((model) => model.brandId === resolver.brandId && model.status === 'active' && (!query || normalizeInputLookupKey(model.label).includes(query))).slice(0, 8);
  }, [models, resolutionQuery, resolver]);

  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!editor || !canManage || label.trim().length < 2 || (editor === 'new' && !editorBrandId)) return;
    const normalizedLabel = normalizeRelatedRepairCatalogInput('model', label);
    setBusy(true); setError(null);
    try {
      if (editor === 'new') await createRepairModel(editorBrandId, normalizedLabel, csrfToken);
      else await renameRepairModel(editor.modelId, normalizedLabel, editor.version, csrfToken);
      setNotice(editor === 'new' ? 'Modelo creado dentro de la marca seleccionada.' : 'Modelo actualizado; el identificador y los snapshots se conservaron.');
      setEditor(null); load();
    } catch (cause: unknown) { setError(message(cause)); load(undefined, true); } finally { setBusy(false); }
  }

  async function confirmTransition(): Promise<void> {
    if (!transition || !canManage) return;
    setBusy(true);
    try {
      const next = transition.status === 'active' ? 'inactive' : 'active';
      await changeRepairModelStatus(transition.modelId, next, transition.version, csrfToken);
      setNotice(next === 'active' ? 'Modelo reactivado para nuevas sugerencias.' : 'Modelo fuera de sugerencias; la captura libre continúa disponible.');
      setTransition(null); load();
    } catch (cause: unknown) { setError(message(cause)); setTransition(null); load(undefined, true); } finally { setBusy(false); }
  }

  async function remove(): Promise<void> {
    if (!deletion || !canManage) return;
    setBusy(true); setError(null);
    try {
      await deleteRepairModel(deletion.modelId, deletion.version, csrfToken);
      setNotice('Modelo sin referencias eliminado definitivamente.');
      setDeletion(null); load();
    } catch (cause: unknown) { setDeletion(null); setError(catalogSafeDeleteFailure(cause)); load(undefined, true); } finally { setBusy(false); }
  }

  function openResolver(item: PendingRepairModel): void {
    setResolver(item); setResolutionMode('existing'); setResolutionModelId(''); setResolutionQuery(''); setResolutionLabel(item.rawModelLabel); setError(null);
  }

  async function resolve(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!resolver || !resolver.brandId || !canManage) return;
    if (resolutionMode === 'existing' && !resolutionModelId) return;
    if (resolutionMode === 'new' && resolutionLabel.trim().length < 2) return;
    setBusy(true);
    try {
      const normalizedResolutionLabel = normalizeRelatedRepairCatalogInput('model', resolutionLabel);
      await resolvePendingRepairModel(resolver.pendingModelValueId, resolutionMode === 'existing' ? { canonicalModelId: resolutionModelId, expectedVersion: resolver.version } : { canonicalLabel: normalizedResolutionLabel, expectedVersion: resolver.version }, csrfToken);
      setNotice(`“${resolver.rawModelLabel}” quedó reconciliado dentro de ${resolver.brandLabel ?? resolver.rawBrandLabel ?? 'su marca'}; el texto original no cambió.`);
      setResolver(null); load();
    } catch (cause: unknown) { setError(message(cause)); load(undefined, true); } finally { setBusy(false); }
  }

  function actions(model: AdminRepairModel): readonly CatalogRowAction[] {
    if (model.scope === 'platform' || !canManage) return [];
    return deriveCatalogLifecycleActions({ idPrefix: `model-${model.modelId}`, status: model.status, deletable: model.deletable, busy, onEdit: () => { setLabel(model.label); setEditor(model); }, onDelete: () => setDeletion(model), onDeactivate: () => setTransition(model), onReactivate: () => setTransition(model) });
  }

  const brandFilter = <Field id="model-brand-filter" label="Marca" className={styles.contextualSelect}><Select id="model-brand-filter" value={brandId} onChange={(event) => setBrandId(event.target.value)}><option value="">Todas las marcas</option>{brands.map((brand) => <option key={brand.brandId} value={brand.brandId}>{brand.label}{brand.status === 'inactive' ? ' · Inactiva' : ''}</option>)}</Select></Field>;

  return <>
    <CatalogPanel labelledBy="models-title">
      <CatalogHeader id="models-title" title="Modelos" description="Cada modelo pertenece a una Marca canónica." metadata={<CatalogReconciliationSummary canonicalCount={contextualModels.length} pendingCount={visiblePending.length} value={surface} onChange={setSurface} />} canManage={canManage} action={surface === 'canonical' ? <Button id="add-repair-model" tone="primary" size="compact" onClick={() => { setLabel(''); setEditorBrandId(brandId); setEditor('new'); setNotice(null); }}><Plus size={16} aria-hidden="true" />Agregar modelo</Button> : undefined} />
      <CatalogFeedback error={error} success={notice} />
      <CatalogToolbar contextualFilter={brandFilter} lifecycleFilter={surface === 'canonical' ? <CatalogLifecycleFilter value={status} activeCount={activeCount} inactiveCount={contextualModels.length - activeCount} onChange={setStatus} label="Filtrar modelos por estado" /> : undefined} result={surface === 'canonical' ? formatCatalogResultCount(visibleModels.length) : `${visiblePending.length} por revisar`} />
      {loading ? <CatalogLoadingState label={surface === 'canonical' ? 'Cargando modelos…' : 'Cargando valores por revisar…'} /> : surface === 'canonical' ? <CatalogTable>
        <thead><tr><th>Modelo</th><th>Marca</th><th data-mobile-hidden="true">Alcance</th><th>Estado</th><th data-mobile-hidden="true"><CatalogCanonicalUsageHeader /></th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead>
        <tbody>{visibleModels.length === 0 ? <CatalogEmptyRow colSpan={6}>No hay modelos {status === 'active' ? 'activos' : status === 'inactive' ? 'inactivos' : 'en esta marca'}.</CatalogEmptyRow> : visibleModels.map((model) => <tr key={model.modelId} data-status={model.status}>
          <td><CatalogEntityName label={model.label} secondary={`v${model.version}`} /></td><td>{model.brandLabel}</td><td data-mobile-hidden="true"><CatalogScopeBadge scope={model.scope} /></td><td><CatalogStatusBadge status={model.status} /></td><td data-mobile-hidden="true"><CatalogUsage count={model.usageCount} /></td><td><CatalogRowActions actions={actions(model)} emptyLabel={model.scope === 'platform' ? 'Sólo lectura' : 'Sin permisos'} /></td>
        </tr>)}</tbody>
      </CatalogTable> : <CatalogTable>
        <thead><tr><th>Modelo capturado</th><th>Marca</th><th data-mobile-hidden="true">Uso</th><th data-mobile-hidden="true">Primera vez</th><th data-mobile-hidden="true">Última vez</th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead>
        <tbody>{visiblePending.length === 0 ? <CatalogEmptyRow colSpan={6}>No hay valores por revisar.</CatalogEmptyRow> : visiblePending.map((item) => <tr key={item.pendingModelValueId}>
          <td><CatalogEntityName label={normalizeRelatedRepairCatalogInput('model', item.rawModelLabel)} secondary={`Pendiente · v${item.version}`} /></td><td>{item.brandLabel ?? (item.rawBrandLabel ? normalizeRelatedRepairCatalogInput('brand', item.rawBrandLabel) : 'Marca pendiente')}</td><td data-mobile-hidden="true"><CatalogUsage count={item.usageCount} /></td><td data-mobile-hidden="true">{date(item.firstSeenAt)}</td><td data-mobile-hidden="true">{date(item.lastSeenAt)}</td><td><CatalogRowActions actions={canManage && item.brandId ? [{ key: 'resolve', id: `resolve-model-${item.pendingModelValueId}`, label: 'Resolver', tone: 'primary', onClick: () => openResolver(item) }] : []} emptyLabel={item.brandId ? 'Sin permisos' : 'Resuelve la marca primero'} /></td>
        </tr>)}</tbody>
      </CatalogTable>}
    </CatalogPanel>

    <Dialog open={editor !== null} title={editor === 'new' ? 'Agregar modelo' : 'Editar modelo'} description="La marca del modelo no puede cambiar después de crearlo." onClose={() => !busy && setEditor(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void save(event); }}>{editor === 'new' ? <Field id="repair-model-brand" label="Marca canónica" required><Select id="repair-model-brand" required value={editorBrandId} onChange={(event) => setEditorBrandId(event.target.value)}><option value="">Selecciona una marca</option>{activeBrands.map((brand) => <option key={brand.brandId} value={brand.brandId}>{brand.label} · {brand.scope === 'platform' ? 'Plataforma' : 'Organización'}</option>)}</Select></Field> : editor ? <dl><div><dt>Marca</dt><dd>{editor.brandLabel}</dd></div></dl> : null}<Field id="repair-model-label" label="Nombre del modelo" required><Input id="repair-model-label" value={label} minLength={2} maxLength={160} required autoComplete="off" onChange={(event) => setLabel(event.target.value)} onBlur={() => setLabel(normalizeRelatedRepairCatalogInput('model', label))} /></Field><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || label.trim().length < 2 || (editor === 'new' && !editorBrandId)}>Guardar</Button></div></form></Dialog>
    <Dialog open={transition !== null} title={transition?.status === 'active' ? 'Desactivar modelo' : 'Reactivar modelo'} description={transition ? `${transition.brandLabel} · ${transition.label}` : ''} onClose={() => !busy && setTransition(null)} footer={<><Button disabled={busy} onClick={() => setTransition(null)}>Cancelar</Button><Button tone={transition?.status === 'active' ? 'secondary' : 'primary'} disabled={busy} onClick={() => { void confirmTransition(); }}>{transition?.status === 'active' ? 'Desactivar' : 'Reactivar'}</Button></>}><p className={styles.confirmCopy}>Sólo cambia su disponibilidad en nuevas sugerencias. Las reparaciones existentes conservan su referencia.</p></Dialog>
    <CatalogSafeDeleteDialog open={deletion !== null} label={deletion ? `${deletion.brandLabel} · ${deletion.label}` : ''} entityLabel="modelo" busy={busy} restoreFocusSelector={deletion ? `#edit-model-${deletion.modelId}` : undefined} onClose={() => setDeletion(null)} onConfirm={() => { void remove(); }} />
    <Dialog open={resolver !== null} title="Resolver modelo pendiente" description={resolver ? `${resolver.brandLabel ?? resolver.rawBrandLabel ?? 'Marca pendiente'} · ${resolver.rawModelLabel} · ${usage(resolver.usageCount)}` : ''} onClose={() => !busy && setResolver(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void resolve(event); }}><div className={styles.resolutionModes} role="group" aria-label="Tipo de resolución"><label><input type="radio" checked={resolutionMode === 'existing'} onChange={() => { setResolutionMode('existing'); setResolutionModelId(''); setResolutionQuery(''); }} />Asociar a modelo existente</label><label><input type="radio" checked={resolutionMode === 'new'} onChange={() => { setResolutionMode('new'); setResolutionModelId(''); }} />Crear modelo de Organización</label></div>{resolutionMode === 'existing' ? <Field id="resolved-model-search" label="Modelo de la misma marca" required><div className={styles.resolutionSearch}><Input id="resolved-model-search" value={resolutionQuery} autoComplete="off" placeholder="Buscar modelo…" onChange={(event) => { setResolutionQuery(event.target.value); setResolutionModelId(''); }} />{resolutionCandidates.length > 0 ? <div className={styles.resolutionOptions} role="listbox">{resolutionCandidates.map((model) => <button key={model.modelId} type="button" role="option" aria-selected={resolutionModelId === model.modelId} onClick={() => { setResolutionModelId(model.modelId); setResolutionQuery(model.label); }}><strong>{model.label}</strong><small>{model.brandLabel}</small></button>)}</div> : <small className={styles.resolutionEmpty}>No hay coincidencias activas dentro de esta marca.</small>}</div></Field> : <Field id="resolved-model-label" label="Nombre canónico del modelo" required><Input id="resolved-model-label" value={resolutionLabel} minLength={2} maxLength={160} required onChange={(event) => setResolutionLabel(event.target.value)} onBlur={() => setResolutionLabel(normalizeRelatedRepairCatalogInput('model', resolutionLabel))} /></Field>}<p className={styles.confirmCopy}>Las reparaciones relacionadas mostrarán el modelo canónico; el texto capturado seguirá intacto.</p><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setResolver(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || !resolver?.brandId || (resolutionMode === 'existing' ? !resolutionModelId : resolutionLabel.trim().length < 2)}>Resolver</Button></div></form></Dialog>
  </>;
}
