import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { changeRepairBrandStatus, createRepairBrand, deleteRepairBrand, getAdminRepairBrands, getPendingRepairBrands, PreviewApiError, renameRepairBrand, resolvePendingRepairBrand } from '../api.js';
import type { AdminRepairBrand, PendingRepairBrand } from '../api.js';
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
  formatCatalogResultCount,
  deriveCatalogLifecycleActions,
} from './catalogs/CatalogAdministration.js';
import type { CatalogLifecycle, CatalogRowAction, CatalogSurface } from './catalogs/CatalogAdministration.js';
import { Button, Field, Input } from './ui/controls.js';
import { Dialog } from './ui/overlays.js';

function usage(count: number): string { return `${count} ${count === 1 ? 'reparación' : 'reparaciones'}`; }
function date(value: string): string { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value)); }
function message(error: unknown): string {
  if (error instanceof PreviewApiError && error.code === 'REPAIR_BRAND_DUPLICATE') return 'Ya existe una marca equivalente en el catálogo efectivo.';
  if (error instanceof PreviewApiError && error.code === 'REPAIR_BRAND_VERSION_CONFLICT') return 'Este registro cambió mientras lo editabas. La lista se actualizó; inténtalo con la versión vigente.';
  if (error instanceof PreviewApiError && error.status === 403) return 'Tu sesión ya no tiene autorización para administrar este catálogo.';
  return error instanceof Error ? error.message : 'No fue posible actualizar el catálogo.';
}

export function RepairBrandCatalogPanel({ canManage, csrfToken }: Readonly<{ canManage: boolean; csrfToken: string }>): React.JSX.Element {
  const [brands, setBrands] = useState<readonly AdminRepairBrand[]>([]);
  const [pending, setPending] = useState<readonly PendingRepairBrand[]>([]);
  const [surface, setSurface] = useState<CatalogSurface>('canonical');
  const [status, setStatus] = useState<CatalogLifecycle>('active');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<AdminRepairBrand | 'new' | null>(null);
  const [label, setLabel] = useState('');
  const [transition, setTransition] = useState<AdminRepairBrand | null>(null);
  const [deletion, setDeletion] = useState<AdminRepairBrand | null>(null);
  const [resolver, setResolver] = useState<PendingRepairBrand | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'existing' | 'new'>('existing');
  const [resolutionBrandId, setResolutionBrandId] = useState('');
  const [resolutionQuery, setResolutionQuery] = useState('');
  const [resolutionLabel, setResolutionLabel] = useState('');

  const load = useCallback((signal?: AbortSignal, preserveError = false): void => {
    setLoading(true);
    void Promise.all([getAdminRepairBrands(signal), getPendingRepairBrands(signal)]).then(([brandResponse, pendingResponse]) => {
      setBrands(brandResponse.items); setPending(pendingResponse.items);
      if (pendingResponse.items.length === 0) setSurface('canonical');
      if (!preserveError) setError(null);
    }).catch((cause: unknown) => {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'No fue posible cargar las marcas.');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);

  const activeCount = brands.filter((brand) => brand.status === 'active').length;
  const visible = status === 'all' ? brands : brands.filter((brand) => brand.status === status);
  const activeBrands = brands.filter((brand) => brand.status === 'active');
  const resolutionKey = normalizeInputLookupKey(resolutionQuery);
  const resolutionCandidates = resolutionKey.length < 1 ? [] : activeBrands.filter((brand) => normalizeInputLookupKey(brand.label).includes(resolutionKey)).slice(0, 8);

  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!editor || label.trim().length < 2 || !canManage) return;
    const normalizedLabel = normalizeRelatedRepairCatalogInput('brand', label);
    setBusy(true); setError(null);
    try {
      if (editor === 'new') await createRepairBrand(normalizedLabel, csrfToken);
      else await renameRepairBrand(editor.brandId, normalizedLabel, editor.version, csrfToken);
      setNotice(editor === 'new' ? 'Marca canónica creada para toda la organización.' : 'Marca actualizada; se conservó el identificador y los snapshots históricos.');
      setEditor(null); load();
    } catch (cause: unknown) { setError(message(cause)); load(undefined, true); } finally { setBusy(false); }
  }

  async function confirmTransition(): Promise<void> {
    if (!transition || !canManage) return;
    setBusy(true);
    try {
      const next = transition.status === 'active' ? 'inactive' : 'active';
      await changeRepairBrandStatus(transition.brandId, next, transition.version, csrfToken);
      setNotice(next === 'active' ? 'Marca reactivada para nuevas sugerencias.' : 'Marca fuera de sugerencias; la captura libre sigue disponible.');
      setTransition(null); load();
    } catch (cause: unknown) { setError(message(cause)); setTransition(null); load(undefined, true); } finally { setBusy(false); }
  }
  async function remove(): Promise<void> { if (!deletion || !canManage) return; setBusy(true); setError(null); try { await deleteRepairBrand(deletion.brandId, deletion.version, csrfToken); setNotice('Marca sin referencias eliminada definitivamente.'); setDeletion(null); load(); } catch (cause) { setDeletion(null); setError(catalogSafeDeleteFailure(cause)); load(undefined, true); } finally { setBusy(false); } }

  function openResolver(item: PendingRepairBrand): void {
    setResolver(item); setResolutionMode('existing'); setResolutionBrandId(''); setResolutionQuery(''); setResolutionLabel(item.rawLabel); setError(null);
  }

  async function resolve(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!resolver || !canManage) return;
    if (resolutionMode === 'existing' && !resolutionBrandId) return;
    if (resolutionMode === 'new' && resolutionLabel.trim().length < 2) return;
    setBusy(true);
    try {
      const normalizedResolutionLabel = normalizeRelatedRepairCatalogInput('brand', resolutionLabel);
      await resolvePendingRepairBrand(resolver.pendingBrandValueId, resolutionMode === 'existing'
        ? { canonicalBrandId: resolutionBrandId, expectedVersion: resolver.version }
        : { canonicalLabel: normalizedResolutionLabel, expectedVersion: resolver.version }, csrfToken);
      setNotice(`“${resolver.rawLabel}” quedó resuelto; los snapshots históricos no cambiaron.`);
      setResolver(null); load();
    } catch (cause: unknown) { setError(message(cause)); load(undefined, true); } finally { setBusy(false); }
  }

  function actions(brand: AdminRepairBrand): readonly CatalogRowAction[] {
    if (brand.scope === 'platform' || !canManage) return [];
    return deriveCatalogLifecycleActions({ idPrefix: `brand-${brand.brandId}`, status: brand.status, deletable: brand.deletable, busy, onEdit: () => { setLabel(brand.label); setEditor(brand); setNotice(null); }, onDelete: () => setDeletion(brand), onDeactivate: () => setTransition(brand), onReactivate: () => setTransition(brand) });
  }

  return <>
    <CatalogPanel labelledBy="brands-title">
      <CatalogHeader id="brands-title" title="Marcas" description="Captura libre con identidad canónica y revisión posterior de variantes." metadata={<CatalogReconciliationSummary canonicalCount={brands.length} pendingCount={pending.length} value={surface} onChange={setSurface} />} canManage={canManage} action={surface === 'canonical' ? <Button id="add-repair-brand" tone="primary" size="compact" onClick={() => { setLabel(''); setEditor('new'); setNotice(null); }}><Plus size={16} aria-hidden="true" />Agregar marca</Button> : undefined} />
      <CatalogFeedback error={error} success={notice} />
      <CatalogToolbar lifecycleFilter={surface === 'canonical' ? <CatalogLifecycleFilter value={status} activeCount={activeCount} inactiveCount={brands.length - activeCount} onChange={setStatus} label="Filtrar marcas por estado" /> : undefined} result={surface === 'canonical' ? formatCatalogResultCount(visible.length) : `${pending.length} por revisar`} />
      {loading ? <CatalogLoadingState label={surface === 'canonical' ? 'Cargando marcas…' : 'Cargando valores por revisar…'} /> : surface === 'canonical' ? <CatalogTable>
        <thead><tr><th>Marca</th><th data-mobile-hidden="true">Alcance</th><th>Estado</th><th data-mobile-hidden="true"><CatalogCanonicalUsageHeader /></th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead>
        <tbody>{visible.length === 0 ? <CatalogEmptyRow colSpan={5}>No hay marcas {status === 'active' ? 'activas' : status === 'inactive' ? 'inactivas' : 'en el catálogo'}.</CatalogEmptyRow> : visible.map((brand) => <tr key={brand.brandId} data-status={brand.status}>
          <td><CatalogEntityName label={brand.label} secondary={`v${brand.version}`} /></td><td data-mobile-hidden="true"><CatalogScopeBadge scope={brand.scope} /></td><td><CatalogStatusBadge status={brand.status} /></td><td data-mobile-hidden="true"><CatalogUsage count={brand.usageCount} /></td><td><CatalogRowActions actions={actions(brand)} emptyLabel={brand.scope === 'platform' ? 'Sólo lectura' : 'Sin permisos de edición'} /></td>
        </tr>)}</tbody>
      </CatalogTable> : <CatalogTable>
        <thead><tr><th>Valor capturado</th><th data-mobile-hidden="true">Uso</th><th data-mobile-hidden="true">Primera vez</th><th data-mobile-hidden="true">Última vez</th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead>
        <tbody>{pending.length === 0 ? <CatalogEmptyRow colSpan={5}>No hay valores por revisar.</CatalogEmptyRow> : pending.map((item) => <tr key={item.pendingBrandValueId}>
          <td><CatalogEntityName label={normalizeRelatedRepairCatalogInput('brand', item.rawLabel)} secondary={`Pendiente · v${item.version}`} /></td><td data-mobile-hidden="true"><CatalogUsage count={item.usageCount} /></td><td data-mobile-hidden="true">{date(item.firstSeenAt)}</td><td data-mobile-hidden="true">{date(item.lastSeenAt)}</td><td><CatalogRowActions actions={canManage ? [{ key: 'resolve', id: `resolve-brand-${item.pendingBrandValueId}`, label: 'Resolver', tone: 'primary', onClick: () => openResolver(item) }] : []} emptyLabel="Sin permisos" /></td>
        </tr>)}</tbody>
      </CatalogTable>}
    </CatalogPanel>

    <Dialog open={editor !== null} title={editor === 'new' ? 'Agregar marca' : 'Editar marca'} description="La etiqueta canónica se usa en sugerencias; los snapshots históricos no se reescriben." onClose={() => !busy && setEditor(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void save(event); }}><Field id="repair-brand-label" label="Nombre de la marca" required><Input id="repair-brand-label" value={label} minLength={2} maxLength={160} required autoComplete="off" onChange={(event) => setLabel(event.target.value)} onBlur={() => setLabel(normalizeRelatedRepairCatalogInput('brand', label))} /></Field><dl><div><dt>Alcance</dt><dd>Organización</dd></div></dl><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || label.trim().length < 2}>Guardar</Button></div></form></Dialog>
    <Dialog open={transition !== null} title={transition?.status === 'active' ? 'Desactivar marca' : 'Reactivar marca'} description={transition?.label ?? ''} onClose={() => !busy && setTransition(null)} footer={<><Button disabled={busy} onClick={() => setTransition(null)}>Cancelar</Button><Button tone={transition?.status === 'active' ? 'secondary' : 'primary'} disabled={busy} onClick={() => { void confirmTransition(); }}>{transition?.status === 'active' ? 'Desactivar' : 'Reactivar'}</Button></>}><p className={styles.confirmCopy}>La referencia histórica seguirá disponible. Sólo cambia su disponibilidad como sugerencia.</p></Dialog>
    <Dialog open={resolver !== null} title="Resolver marca pendiente" description={`Valor capturado: ${resolver?.rawLabel ?? ''} · Usado: ${resolver ? usage(resolver.usageCount) : ''}`} onClose={() => !busy && setResolver(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void resolve(event); }}><div className={styles.resolutionModes} role="group" aria-label="Tipo de resolución"><label><input type="radio" checked={resolutionMode === 'existing'} onChange={() => { setResolutionMode('existing'); setResolutionBrandId(''); setResolutionQuery(''); }} />Asociar a marca existente</label><label><input type="radio" checked={resolutionMode === 'new'} onChange={() => { setResolutionMode('new'); setResolutionBrandId(''); }} />Crear como nueva marca de Organización</label></div>{resolutionMode === 'existing' ? <Field id="resolved-brand-search" label="Buscar marca canónica" required><div className={styles.resolutionSearch}><Input id="resolved-brand-search" value={resolutionQuery} autoComplete="off" placeholder="Buscar Apple…" role="combobox" aria-autocomplete="list" aria-expanded={resolutionCandidates.length > 0} aria-controls="resolved-brand-options" onChange={(event) => { setResolutionQuery(event.target.value); setResolutionBrandId(''); }} />{resolutionCandidates.length > 0 ? <div id="resolved-brand-options" className={styles.resolutionOptions} role="listbox" aria-label="Marcas canónicas disponibles">{resolutionCandidates.map((brand) => <button key={brand.brandId} type="button" role="option" aria-selected={resolutionBrandId === brand.brandId} onClick={() => { setResolutionBrandId(brand.brandId); setResolutionQuery(brand.label); }}><strong>{brand.label}</strong><small>{brand.scope === 'platform' ? 'Plataforma' : 'Organización'}</small></button>)}</div> : resolutionQuery.trim() && !resolutionBrandId ? <small className={styles.resolutionEmpty}>No hay coincidencias canónicas activas.</small> : null}</div></Field> : <Field id="resolved-brand-label" label="Nombre de la marca" required><Input id="resolved-brand-label" value={resolutionLabel} minLength={2} maxLength={160} required onChange={(event) => setResolutionLabel(event.target.value)} onBlur={() => setResolutionLabel(normalizeRelatedRepairCatalogInput('brand', resolutionLabel))} /></Field>}<p className={styles.confirmCopy}>Las reparaciones relacionadas usarán esta identidad para reportes. El texto capturado en cada reparación permanecerá intacto.</p><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setResolver(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || (resolutionMode === 'existing' ? !resolutionBrandId : resolutionLabel.trim().length < 2)}>Resolver</Button></div></form></Dialog>
    <CatalogSafeDeleteDialog open={deletion !== null} label={deletion?.label ?? ''} entityLabel="marca de Reparaciones" busy={busy} restoreFocusSelector={deletion ? `#edit-brand-${deletion.brandId}` : undefined} onClose={() => setDeletion(null)} onConfirm={() => { void remove(); }} />
  </>;
}
