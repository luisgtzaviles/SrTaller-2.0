import { GitMerge, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createCatalogBrand, createCatalogCategory, deleteCatalogBrand, deleteCatalogCategory, listCatalogAdministrationReferences,
  mergeCatalogBrands, mergeCatalogCategories, normalizeCatalogReferenceText, resolveCatalogBrand, resolveCatalogCategory, updateCatalogBrand, updateCatalogCategory,
} from '../catalog-api.js';
import type { CatalogItemKind, CatalogPendingBrand, CatalogPendingCategory, CatalogReference, CatalogReferences } from '../catalog-api.js';
import { PreviewApiError } from '../api.js';
import {
  CatalogCanonicalUsageHeader, CatalogEmptyRow, CatalogEntityName, CatalogFeedback,
  CatalogHeader, CatalogLifecycleFilter, CatalogLoadingState, CatalogPanel,
  CatalogMergeDialog, CatalogReconciliationSummary, CatalogRowActions, CatalogSafeDeleteDialog, CatalogSectionTabs, CatalogStatusBadge, CatalogTable,
  CatalogToolbar, CatalogUsage, catalogAdministrationStyles as styles, catalogSafeDeleteFailure, formatCatalogResultCount,
  deriveCatalogLifecycleActions,
} from './catalogs/CatalogAdministration.js';
import type { CatalogLifecycle, CatalogSurface } from './catalogs/CatalogAdministration.js';
import { Button, Field, Input, Select } from './ui/controls.js';
import { Dialog } from './ui/overlays.js';

const kindLabels: Readonly<Record<CatalogItemKind, string>> = Object.freeze({ PART: 'Refacción', PRODUCT: 'Producto', SERVICE: 'Servicio', SUPPLY: 'Insumo' });
const allKinds = Object.keys(kindLabels) as CatalogItemKind[];
type ReferenceKind = 'category' | 'brand';
type PendingReference = CatalogPendingCategory | CatalogPendingBrand;

function id(reference: CatalogReference): string { return reference.categoryId ?? reference.brandId ?? ''; }
function pendingId(reference: PendingReference): string { return 'pendingCategoryValueId' in reference ? reference.pendingCategoryValueId : reference.pendingBrandValueId; }
function pendingKinds(reference: PendingReference): readonly CatalogItemKind[] { return 'kind' in reference ? [reference.kind] : reference.applicableKinds; }
function date(value: string): string { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value)); }
function usage(value: number): string { return `${value} ${value === 1 ? 'uso' : 'usos'}`; }
function referenceError(cause: unknown, label: string, kind: ReferenceKind, fallback: string): string {
  return cause instanceof PreviewApiError && cause.code === 'CATALOG_REFERENCE_ALREADY_EXISTS'
    ? `Ya existe la ${kind === 'category' ? 'categoría' : 'marca'} “${label.trim()}”. Asóciala a esa referencia.`
    : fallback;
}

export function CatalogPriceListReferencesPanel({ csrfToken }: Readonly<{ csrfToken: string }>): React.JSX.Element {
  const [references, setReferences] = useState<CatalogReferences>({ categories: [], brands: [], pendingCategories: [], pendingBrands: [], categoryBrandApplicability: [] });
  const [referenceKind, setReferenceKind] = useState<ReferenceKind>('category');
  const [typeFilter, setTypeFilter] = useState<CatalogItemKind | 'all'>('all');
  const [surface, setSurface] = useState<CatalogSurface>('canonical');
  const [status, setStatus] = useState<CatalogLifecycle>('active');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<CatalogReference | 'new' | null>(null);
  const [deletion, setDeletion] = useState<CatalogReference | null>(null);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [merging, setMerging] = useState(false);
  const [survivorId, setSurvivorId] = useState(''); const [mergeName, setMergeName] = useState('');
  const [name, setName] = useState(''); const [kinds, setKinds] = useState<readonly CatalogItemKind[]>(['PART']);
  const [resolver, setResolver] = useState<PendingReference | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'existing' | 'new'>('existing');
  const [resolutionId, setResolutionId] = useState(''); const [resolutionQuery, setResolutionQuery] = useState('');
  const [resolutionName, setResolutionName] = useState(''); const [resolutionKinds, setResolutionKinds] = useState<readonly CatalogItemKind[]>(['PART']);

  const load = useCallback(async (signal?: AbortSignal, preserveError = false) => {
    setLoading(true);
    try { setReferences(await listCatalogAdministrationReferences(signal)); if (!preserveError) setError(null); }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError('No fue posible cargar los catálogos comerciales.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const allItems = referenceKind === 'category' ? references.categories : references.brands;
  const allPending = referenceKind === 'category' ? references.pendingCategories : references.pendingBrands;
  const items = typeFilter === 'all' ? allItems : allItems.filter((item) => item.applicableKinds.includes(typeFilter));
  const pending = typeFilter === 'all' ? allPending : allPending.filter((item) => pendingKinds(item).includes(typeFilter));
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const visible = status === 'all' ? items : items.filter((item) => item.status === status.toUpperCase());
  const selected = items.filter((item) => selectedIds.includes(id(item)));
  const selectedCategoryKind = referenceKind === 'category' ? selected[0]?.applicableKinds[0] ?? null : null;
  const selectionCompatible = selected.length >= 2 && (referenceKind === 'brand' || selected.every((item) => item.applicableKinds.length === 1 && item.applicableKinds[0] === selectedCategoryKind));
  const survivor = selected.find((item) => id(item) === survivorId) ?? null;
  const reassignmentCount = selected.filter((item) => id(item) !== survivorId).reduce((total, item) => total + (item.usageCount ?? 0), 0);
  const requiredKinds = resolver ? pendingKinds(resolver) : [];
  const exactCanonicalMatch = useMemo(() => resolver ? allItems.find((item) => item.status === 'ACTIVE' && normalizeCatalogReferenceText(item.name) === resolver.normalizedKey && (referenceKind === 'brand' || requiredKinds.every((kind) => item.applicableKinds.includes(kind)))) ?? null : null, [allItems, referenceKind, requiredKinds, resolver]);
  const candidates = useMemo(() => resolutionQuery.trim() ? allItems.filter((item) => item.status === 'ACTIVE' && (referenceKind === 'brand' || requiredKinds.every((kind) => item.applicableKinds.includes(kind))) && normalizeCatalogReferenceText(item.name).includes(normalizeCatalogReferenceText(resolutionQuery))).slice(0, 8) : [], [allItems, referenceKind, requiredKinds, resolutionQuery]);

  function openEditor(value: CatalogReference | 'new'): void { setEditor(value); setName(value === 'new' ? '' : value.name); setKinds(value === 'new' ? ['PART'] : value.applicableKinds); setNotice(null); }
  function toggleSelected(reference: CatalogReference): void {
    const referenceId = id(reference);
    setSelectedIds((current) => current.includes(referenceId) ? current.filter((value) => value !== referenceId) : [...current, referenceId]);
  }
  function openMerge(): void {
    if (!selectionCompatible) return;
    const preferred = selected[0]!;
    setSurvivorId(id(preferred)); setMergeName(preferred.name); setMerging(true); setNotice(null);
  }
  function toggleKind(kind: CatalogItemKind): void {
    if (referenceKind === 'category') { setKinds([kind]); return; }
    setKinds((current) => current.includes(kind) ? current.filter((value) => value !== kind) : [...current, kind]);
  }
  function openResolver(value: PendingReference): void { const required = pendingKinds(value); const exact = allItems.find((item) => item.status === 'ACTIVE' && normalizeCatalogReferenceText(item.name) === value.normalizedKey && (referenceKind === 'brand' || required.every((kind) => item.applicableKinds.includes(kind)))); setResolver(value); setResolutionMode('existing'); setResolutionId(exact ? id(exact) : ''); setResolutionQuery(exact?.name ?? ''); setResolutionName(value.rawLabel); setResolutionKinds(required); setNotice(null); }
  function toggleResolutionKind(kind: CatalogItemKind): void { if (requiredKinds.includes(kind)) return; setResolutionKinds((current) => current.includes(kind) ? current.filter((value) => value !== kind) : [...current, kind]); }

  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!editor || !name.trim() || kinds.length < 1) return; setBusy(true); setError(null);
    try {
      if (editor === 'new') { if (referenceKind === 'category') await createCatalogCategory(name.trim(), kinds, csrfToken); else await createCatalogBrand(name.trim(), kinds, csrfToken); }
      else { const body = { name: name.trim(), status: editor.status, applicableKinds: kinds, expectedVersion: editor.version, clientRequestId: crypto.randomUUID() }; if (referenceKind === 'category') await updateCatalogCategory(id(editor), body, csrfToken); else await updateCatalogBrand(id(editor), body, csrfToken); }
      setNotice(editor === 'new' ? 'Referencia canónica creada.' : 'Referencia canónica actualizada.'); setEditor(null); await load();
    } catch (cause) { setError(referenceError(cause, name, referenceKind, 'No se guardó. Revisa aplicabilidad o una versión más reciente.')); await load(undefined, true); }
    finally { setBusy(false); }
  }
  async function transition(reference: CatalogReference): Promise<void> {
    setBusy(true); setError(null);
    try { const body = { name: reference.name, status: reference.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', applicableKinds: reference.applicableKinds, expectedVersion: reference.version, clientRequestId: crypto.randomUUID() }; if (referenceKind === 'category') await updateCatalogCategory(id(reference), body, csrfToken); else await updateCatalogBrand(id(reference), body, csrfToken); setNotice(reference.status === 'ACTIVE' ? 'Referencia retirada de nuevas sugerencias.' : 'Referencia reactivada.'); await load(); }
    catch { setError('No fue posible cambiar el estado; revisa uso, aplicabilidad o una versión nueva.'); await load(undefined, true); }
    finally { setBusy(false); }
  }
  async function remove(): Promise<void> {
    if (!deletion) return;
    setBusy(true); setError(null);
    try {
      if (referenceKind === 'category') await deleteCatalogCategory(id(deletion), deletion.version, csrfToken);
      else await deleteCatalogBrand(id(deletion), deletion.version, csrfToken);
      setNotice(`“${deletion.name}” se eliminó definitivamente porque no tenía referencias.`); setDeletion(null); await load();
    } catch (cause) {
      setDeletion(null);
      setError(catalogSafeDeleteFailure(cause));
      await load(undefined, true);
    } finally { setBusy(false); }
  }
  function actions(reference: CatalogReference) {
    return deriveCatalogLifecycleActions({ idPrefix: `commercial-${id(reference)}`, status: reference.status.toLowerCase() as 'active' | 'inactive', deletable: reference.deletable, busy, onEdit: () => openEditor(reference), onDelete: () => setDeletion(reference), onDeactivate: () => { void transition(reference); }, onReactivate: () => { void transition(reference); } });
  }
  async function resolve(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!resolver || (resolutionMode === 'existing' ? !resolutionId : resolutionName.trim().length < 1)) return; setBusy(true); setError(null);
    try {
      const body = resolutionMode === 'existing'
        ? { [referenceKind === 'category' ? 'canonicalCategoryId' : 'canonicalBrandId']: resolutionId, expectedVersion: resolver.version, clientRequestId: crypto.randomUUID() }
        : { canonicalName: resolutionName.trim(), applicableKinds: resolutionKinds, expectedVersion: resolver.version, clientRequestId: crypto.randomUUID() };
      if (referenceKind === 'category') await resolveCatalogCategory(pendingId(resolver), body, csrfToken); else await resolveCatalogBrand(pendingId(resolver), body, csrfToken);
      setNotice(`“${resolver.rawLabel}” quedó resuelto; el valor capturado permanece trazable.`); setResolver(null); await load();
    } catch (cause) { setError(referenceError(cause, resolver.rawLabel, referenceKind, 'No fue posible resolver. Revisa que la referencia esté activa y sea compatible.')); await load(undefined, true); }
    finally { setBusy(false); }
  }
  async function merge(): Promise<void> {
    if (!selectionCompatible || !survivor || !mergeName.trim()) return;
    setBusy(true); setError(null);
    try {
      const body = { references: selected.map((reference) => ({ referenceId: id(reference), expectedVersion: reference.version })), survivorReferenceId: survivorId, finalName: mergeName.trim(), clientRequestId: crypto.randomUUID() };
      const result = referenceKind === 'category' ? await mergeCatalogCategories(body, csrfToken) : await mergeCatalogBrands(body, csrfToken);
      setNotice(`${selected.length} referencias se fusionaron en “${result.survivor.name}”; ${result.reassignedItemCount} ${result.reassignedItemCount === 1 ? 'artículo reasignado' : 'artículos reasignados'}.`);
      setMerging(false); setSelectedIds([]); await load();
    } catch (cause) {
      setError(referenceError(cause, mergeName, referenceKind, 'No fue posible fusionar. Relee el catálogo y verifica Tipo, estado y versiones.'));
      await load(undefined, true);
    } finally { setBusy(false); }
  }

  return <>
    <CatalogSectionTabs<ReferenceKind> value={referenceKind} label="Catálogos de Lista de precios" onChange={(value) => { setReferenceKind(value); setSurface('canonical'); setSelectedIds([]); }} options={[{ value: 'category', label: 'Categorías', count: references.categories.length }, { value: 'brand', label: 'Marcas', count: references.brands.length }]} />
    <CatalogPanel labelledBy="commercial-reference-title">
      <CatalogHeader id="commercial-reference-title" title={referenceKind === 'category' ? 'Categorías comerciales' : 'Marcas comerciales'} description={referenceKind === 'category' ? 'Cada categoría canónica pertenece a un Tipo; los valores libres se reconcilian después.' : 'Una marca canónica puede aplicar a varios Tipos; los valores libres se reconcilian después.'} metadata={<CatalogReconciliationSummary canonicalCount={items.length} pendingCount={pending.length} value={surface} onChange={(value) => { setSurface(value); setSelectedIds([]); }} />} canManage action={surface === 'canonical' ? <>{selectionCompatible ? <Button size="compact" onClick={openMerge}><GitMerge size={16} aria-hidden="true" />Fusionar seleccionados</Button> : null}<Button tone="primary" size="compact" onClick={() => openEditor('new')}><Plus size={16} aria-hidden="true" />Agregar {referenceKind === 'category' ? 'categoría' : 'marca'}</Button></> : undefined} />
      <CatalogFeedback error={error} success={notice} />
      <CatalogToolbar contextualFilter={<Field id="commercial-reference-type" label="Tipo"><Select id="commercial-reference-type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as CatalogItemKind | 'all'); setSelectedIds([]); }}><option value="all">Todos</option>{allKinds.map((kind) => <option key={kind} value={kind}>{kindLabels[kind]}</option>)}</Select></Field>} lifecycleFilter={surface === 'canonical' ? <CatalogLifecycleFilter value={status} activeCount={activeCount} inactiveCount={items.length - activeCount} onChange={(value) => { setStatus(value); setSelectedIds([]); }} label={`Filtrar ${referenceKind === 'category' ? 'categorías' : 'marcas'} por estado`} /> : undefined} result={surface === 'canonical' ? formatCatalogResultCount(visible.length) : `${pending.length} por revisar`} />
      {loading ? <CatalogLoadingState label={surface === 'canonical' ? 'Cargando referencias canónicas…' : 'Cargando valores por revisar…'} /> : surface === 'canonical' ? <CatalogTable><thead><tr><th><span className={styles.srOnly}>Seleccionar</span></th><th>Referencia</th><th>Aplicable a</th><th>Estado</th><th data-mobile-hidden="true"><CatalogCanonicalUsageHeader description="Artículos vinculados por identidad canónica. No cuenta coincidencias del texto capturado." /></th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead><tbody>{visible.length === 0 ? <CatalogEmptyRow colSpan={6}>No hay referencias {status === 'active' ? 'activas' : status === 'inactive' ? 'inactivas' : 'en el catálogo'}.</CatalogEmptyRow> : visible.map((reference) => { const incompatible = referenceKind === 'category' && selectedCategoryKind !== null && !selectedIds.includes(id(reference)) && reference.applicableKinds[0] !== selectedCategoryKind; return <tr key={id(reference)} data-status={reference.status.toLowerCase()}><td><input type="checkbox" aria-label={`Seleccionar ${reference.name} para fusionar`} checked={selectedIds.includes(id(reference))} disabled={busy || reference.status !== 'ACTIVE' || incompatible} onChange={() => toggleSelected(reference)} /></td><td><CatalogEntityName label={reference.name} secondary={`v${reference.version}`} /></td><td>{reference.applicableKinds.map((kind) => kindLabels[kind]).join(', ')}</td><td><CatalogStatusBadge status={reference.status.toLowerCase() as 'active' | 'inactive'} /></td><td data-mobile-hidden="true"><CatalogUsage count={reference.usageCount ?? 0} singular="artículo" plural="artículos" /></td><td><CatalogRowActions emptyLabel="Sin acciones" actions={actions(reference)} /></td></tr>; })}</tbody></CatalogTable> : <CatalogTable><thead><tr><th>Valor capturado</th><th>Tipo aplicable</th><th data-mobile-hidden="true">Uso</th><th data-mobile-hidden="true">Primera / última vez</th><th data-mobile-hidden="true">Capturado por</th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead><tbody>{pending.length === 0 ? <CatalogEmptyRow colSpan={6}>No hay valores por revisar.</CatalogEmptyRow> : pending.map((item) => <tr key={pendingId(item)}><td><CatalogEntityName label={item.rawLabel} secondary={`Pendiente · v${item.version}`} /></td><td>{pendingKinds(item).map((kind) => kindLabels[kind]).join(', ')}</td><td data-mobile-hidden="true"><CatalogUsage count={item.usageCount} singular="artículo" plural="artículos" /></td><td data-mobile-hidden="true"><small>{date(item.firstSeenAt)}<br />{date(item.lastSeenAt)}</small></td><td data-mobile-hidden="true"><small>{item.capturedBy ?? 'Actor no disponible'}<br />Branch {item.capturedInBranchId.slice(0, 8)}</small></td><td><CatalogRowActions actions={[{ key: 'resolve', label: 'Resolver', tone: 'primary', disabled: busy, onClick: () => openResolver(item) }]} emptyLabel="Sin acciones" /></td></tr>)}</tbody></CatalogTable>}
    </CatalogPanel>

    <Dialog open={editor !== null} title={editor === 'new' ? `Agregar ${referenceKind === 'category' ? 'categoría' : 'marca'}` : 'Editar referencia'} description="Gobierno Tenant-wide del catálogo comercial." onClose={() => !busy && setEditor(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void save(event); }}><Field id="commercial-reference-name" label="Nombre" required><Input id="commercial-reference-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></Field><fieldset className={styles.resolutionModes}><legend>Aplicable a</legend>{allKinds.map((kind) => <label key={kind}><input type={referenceKind === 'category' ? 'radio' : 'checkbox'} name="commercial-kind" checked={kinds.includes(kind)} onChange={() => toggleKind(kind)} />{kindLabels[kind]}</label>)}</fieldset><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || !name.trim() || kinds.length < 1}>Guardar</Button></div></form></Dialog>
    <CatalogMergeDialog open={merging} title={`Fusionar ${referenceKind === 'category' ? 'categorías' : 'marcas'}`} description="Consolida identidades canónicas; no elimina su trazabilidad histórica." busy={busy} canConfirm={Boolean(survivor && mergeName.trim())} reassignmentCount={reassignmentCount} onClose={() => setMerging(false)} onConfirm={() => { void merge(); }}><div className={styles.resolutionModes}><strong>Referencias seleccionadas</strong>{selected.map((reference) => <span key={id(reference)}>{reference.name} · {usage(reference.usageCount ?? 0)} · {reference.applicableKinds.map((kind) => kindLabels[kind]).join(', ')}</span>)}</div><Field id="commercial-merge-survivor" label="Referencia superviviente" required><Select id="commercial-merge-survivor" value={survivorId} onChange={(event) => { const next = selected.find((reference) => id(reference) === event.target.value); setSurvivorId(event.target.value); if (next) setMergeName(next.name); }}>{selected.map((reference) => <option key={id(reference)} value={id(reference)}>{reference.name}</option>)}</Select></Field><Field id="commercial-merge-name" label="Nombre final" required><Input id="commercial-merge-name" value={mergeName} maxLength={120} onChange={(event) => setMergeName(event.target.value)} /></Field></CatalogMergeDialog>
    <Dialog open={resolver !== null} title={`Resolver ${referenceKind === 'category' ? 'categoría' : 'marca'} pendiente`} description={resolver ? `Valor capturado: ${resolver.rawLabel} · ${usage(resolver.usageCount)}` : ''} onClose={() => !busy && setResolver(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void resolve(event); }}>
      {exactCanonicalMatch ? <p className={styles.confirmCopy}>Ya existe la {referenceKind === 'category' ? 'categoría' : 'marca'} “{exactCanonicalMatch.name}”{referenceKind === 'category' ? ` para ${kindLabels[requiredKinds[0]!]}` : ''}. Asóciala a esa referencia; no se creará otra identidad.</p> : null}
      <div className={styles.resolutionModes} role="group" aria-label="Tipo de resolución"><label><input type="radio" checked={resolutionMode === 'existing'} onChange={() => { setResolutionMode('existing'); setResolutionId(exactCanonicalMatch ? id(exactCanonicalMatch) : ''); setResolutionQuery(exactCanonicalMatch?.name ?? ''); }} />Asociar a referencia existente</label><label><input type="radio" checked={resolutionMode === 'new'} disabled={exactCanonicalMatch !== null} onChange={() => { setResolutionMode('new'); setResolutionId(''); }} />Crear referencia canónica</label></div>{resolutionMode === 'existing' ? <Field id="commercial-resolution-search" label="Buscar referencia canónica compatible" required><div className={styles.resolutionSearch}><Input id="commercial-resolution-search" value={resolutionQuery} autoComplete="off" placeholder="Buscar…" role="combobox" aria-autocomplete="list" aria-expanded={candidates.length > 0} aria-controls="commercial-resolution-options" onChange={(event) => { const query = event.target.value; const exact = allItems.find((item) => item.status === 'ACTIVE' && normalizeCatalogReferenceText(item.name) === normalizeCatalogReferenceText(query) && (referenceKind === 'brand' || requiredKinds.every((kind) => item.applicableKinds.includes(kind)))); setResolutionQuery(query); setResolutionId(exact ? id(exact) : ''); }} />{candidates.length > 0 ? <div id="commercial-resolution-options" className={styles.resolutionOptions} role="listbox">{candidates.map((candidate) => <button key={id(candidate)} type="button" role="option" aria-selected={resolutionId === id(candidate)} onClick={() => { setResolutionId(id(candidate)); setResolutionQuery(candidate.name); }}><strong>{candidate.name}</strong><small>{candidate.applicableKinds.map((kind) => kindLabels[kind]).join(', ')}</small></button>)}</div> : resolutionQuery.trim() ? <small className={styles.resolutionEmpty}>No hay coincidencias canónicas activas y compatibles.</small> : null}</div></Field> : <><Field id="commercial-resolution-name" label="Nombre canónico" required><Input id="commercial-resolution-name" value={resolutionName} maxLength={120} onChange={(event) => setResolutionName(event.target.value)} /></Field><fieldset className={styles.resolutionModes}><legend>Aplicable a</legend>{allKinds.map((kind) => <label key={kind}><input type={referenceKind === 'category' ? 'radio' : 'checkbox'} checked={resolutionKinds.includes(kind)} disabled={requiredKinds.includes(kind)} onChange={() => toggleResolutionKind(kind)} />{kindLabels[kind]}{requiredKinds.includes(kind) ? ' · requerido por uso' : ''}</label>)}</fieldset></>}<p className={styles.confirmCopy}>Los artículos relacionados usarán la identidad canónica; el valor capturado y su trazabilidad permanecen intactos.</p><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setResolver(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || (resolutionMode === 'existing' ? !resolutionId : !resolutionName.trim() || resolutionKinds.length < 1)}>Resolver</Button></div>
    </form></Dialog>
    <CatalogSafeDeleteDialog open={deletion !== null} label={deletion?.name ?? ''} entityLabel={referenceKind === 'category' ? 'categoría comercial' : 'marca comercial'} busy={busy} restoreFocusSelector={deletion ? `#edit-commercial-${id(deletion)}` : undefined} onClose={() => setDeletion(null)} onConfirm={() => { void remove(); }} />
  </>;
}
