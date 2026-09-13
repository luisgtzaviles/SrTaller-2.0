import { Pencil, Plus, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createCatalogBrand, createCatalogCategory, listCatalogAdministrationReferences,
  resolveCatalogBrand, resolveCatalogCategory, updateCatalogBrand, updateCatalogCategory,
} from '../catalog-api.js';
import type { CatalogItemKind, CatalogPendingBrand, CatalogPendingCategory, CatalogReference, CatalogReferences } from '../catalog-api.js';
import {
  CatalogCanonicalUsageHeader, CatalogEmptyRow, CatalogEntityName, CatalogFeedback,
  CatalogHeader, CatalogLifecycleFilter, CatalogLoadingState, CatalogPanel,
  CatalogReconciliationSummary, CatalogRowActions, CatalogSectionTabs, CatalogStatusBadge, CatalogTable,
  CatalogToolbar, CatalogUsage, catalogAdministrationStyles as styles, formatCatalogResultCount,
} from './catalogs/CatalogAdministration.js';
import type { CatalogLifecycle, CatalogSurface } from './catalogs/CatalogAdministration.js';
import { Button, Field, Input } from './ui/controls.js';
import { Dialog } from './ui/overlays.js';

const kindLabels: Readonly<Record<CatalogItemKind, string>> = Object.freeze({ PART: 'Refacción', PRODUCT: 'Producto', SERVICE: 'Servicio', SUPPLY: 'Insumo' });
const allKinds = Object.keys(kindLabels) as CatalogItemKind[];
type ReferenceKind = 'category' | 'brand';
type PendingReference = CatalogPendingCategory | CatalogPendingBrand;

function id(reference: CatalogReference): string { return reference.categoryId ?? reference.brandId ?? ''; }
function pendingId(reference: PendingReference): string { return 'pendingCategoryValueId' in reference ? reference.pendingCategoryValueId : reference.pendingBrandValueId; }
function pendingKinds(reference: PendingReference): readonly CatalogItemKind[] { return 'kind' in reference ? [reference.kind] : reference.applicableKinds; }
function normalized(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX').replace(/\s+/gu, ' ').trim(); }
function date(value: string): string { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value)); }
function usage(value: number): string { return `${value} ${value === 1 ? 'uso' : 'usos'}`; }

export function CatalogPriceListReferencesPanel({ csrfToken }: Readonly<{ csrfToken: string }>): React.JSX.Element {
  const [references, setReferences] = useState<CatalogReferences>({ categories: [], brands: [], pendingCategories: [], pendingBrands: [], categoryBrandApplicability: [] });
  const [referenceKind, setReferenceKind] = useState<ReferenceKind>('category');
  const [surface, setSurface] = useState<CatalogSurface>('canonical');
  const [status, setStatus] = useState<CatalogLifecycle>('active');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<CatalogReference | 'new' | null>(null);
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

  const items = referenceKind === 'category' ? references.categories : references.brands;
  const pending = referenceKind === 'category' ? references.pendingCategories : references.pendingBrands;
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const visible = status === 'all' ? items : items.filter((item) => item.status === status.toUpperCase());
  const requiredKinds = resolver ? pendingKinds(resolver) : [];
  const candidates = useMemo(() => resolutionQuery.trim() ? items.filter((item) => item.status === 'ACTIVE' && requiredKinds.every((kind) => item.applicableKinds.includes(kind)) && normalized(item.name).includes(normalized(resolutionQuery))).slice(0, 8) : [], [items, requiredKinds, resolutionQuery]);

  function openEditor(value: CatalogReference | 'new'): void { setEditor(value); setName(value === 'new' ? '' : value.name); setKinds(value === 'new' ? ['PART'] : value.applicableKinds); setNotice(null); }
  function toggleKind(kind: CatalogItemKind): void {
    if (referenceKind === 'category') { setKinds([kind]); return; }
    setKinds((current) => current.includes(kind) ? current.filter((value) => value !== kind) : [...current, kind]);
  }
  function openResolver(value: PendingReference): void { const required = pendingKinds(value); setResolver(value); setResolutionMode('existing'); setResolutionId(''); setResolutionQuery(''); setResolutionName(value.rawLabel); setResolutionKinds(required); setNotice(null); }
  function toggleResolutionKind(kind: CatalogItemKind): void { if (requiredKinds.includes(kind)) return; setResolutionKinds((current) => current.includes(kind) ? current.filter((value) => value !== kind) : [...current, kind]); }

  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!editor || !name.trim() || kinds.length < 1) return; setBusy(true); setError(null);
    try {
      if (editor === 'new') { if (referenceKind === 'category') await createCatalogCategory(name.trim(), kinds, csrfToken); else await createCatalogBrand(name.trim(), kinds, csrfToken); }
      else { const body = { name: name.trim(), status: editor.status, applicableKinds: kinds, expectedVersion: editor.version, clientRequestId: crypto.randomUUID() }; if (referenceKind === 'category') await updateCatalogCategory(id(editor), body, csrfToken); else await updateCatalogBrand(id(editor), body, csrfToken); }
      setNotice(editor === 'new' ? 'Referencia canónica creada.' : 'Referencia canónica actualizada.'); setEditor(null); await load();
    } catch { setError('No se guardó. Revisa duplicados, aplicabilidad o una versión más reciente.'); await load(undefined, true); }
    finally { setBusy(false); }
  }
  async function transition(reference: CatalogReference): Promise<void> {
    setBusy(true); setError(null);
    try { const body = { name: reference.name, status: reference.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', applicableKinds: reference.applicableKinds, expectedVersion: reference.version, clientRequestId: crypto.randomUUID() }; if (referenceKind === 'category') await updateCatalogCategory(id(reference), body, csrfToken); else await updateCatalogBrand(id(reference), body, csrfToken); setNotice(reference.status === 'ACTIVE' ? 'Referencia retirada de nuevas sugerencias.' : 'Referencia reactivada.'); await load(); }
    catch { setError('No fue posible cambiar el estado; revisa uso, aplicabilidad o una versión nueva.'); await load(undefined, true); }
    finally { setBusy(false); }
  }
  async function resolve(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!resolver || (resolutionMode === 'existing' ? !resolutionId : resolutionName.trim().length < 1)) return; setBusy(true); setError(null);
    try {
      const body = resolutionMode === 'existing'
        ? { [referenceKind === 'category' ? 'canonicalCategoryId' : 'canonicalBrandId']: resolutionId, expectedVersion: resolver.version, clientRequestId: crypto.randomUUID() }
        : { canonicalName: resolutionName.trim(), applicableKinds: resolutionKinds, expectedVersion: resolver.version, clientRequestId: crypto.randomUUID() };
      if (referenceKind === 'category') await resolveCatalogCategory(pendingId(resolver), body, csrfToken); else await resolveCatalogBrand(pendingId(resolver), body, csrfToken);
      setNotice(`“${resolver.rawLabel}” quedó resuelto; el valor capturado permanece trazable.`); setResolver(null); await load();
    } catch { setError('No fue posible resolver. La referencia debe ser activa, compatible y no duplicada.'); await load(undefined, true); }
    finally { setBusy(false); }
  }

  return <>
    <CatalogSectionTabs<ReferenceKind> value={referenceKind} label="Catálogos de Lista de precios" onChange={(value) => { setReferenceKind(value); setSurface('canonical'); }} options={[{ value: 'category', label: 'Categorías', count: references.categories.length }, { value: 'brand', label: 'Marcas', count: references.brands.length }]} />
    <CatalogPanel labelledBy="commercial-reference-title">
      <CatalogHeader id="commercial-reference-title" title={referenceKind === 'category' ? 'Categorías comerciales' : 'Marcas comerciales'} description={referenceKind === 'category' ? 'Cada categoría canónica pertenece a un Tipo; los valores libres se reconcilian después.' : 'Una marca canónica puede aplicar a varios Tipos; los valores libres se reconcilian después.'} metadata={<CatalogReconciliationSummary canonicalCount={items.length} pendingCount={pending.length} value={surface} onChange={setSurface} />} canManage action={surface === 'canonical' ? <Button tone="primary" size="compact" onClick={() => openEditor('new')}><Plus size={16} aria-hidden="true" />Agregar {referenceKind === 'category' ? 'categoría' : 'marca'}</Button> : undefined} />
      <CatalogFeedback error={error} success={notice} />
      <CatalogToolbar lifecycleFilter={surface === 'canonical' ? <CatalogLifecycleFilter value={status} activeCount={activeCount} inactiveCount={items.length - activeCount} onChange={setStatus} label={`Filtrar ${referenceKind === 'category' ? 'categorías' : 'marcas'} por estado`} /> : undefined} result={surface === 'canonical' ? formatCatalogResultCount(visible.length) : `${pending.length} por revisar`} />
      {loading ? <CatalogLoadingState label={surface === 'canonical' ? 'Cargando referencias canónicas…' : 'Cargando valores por revisar…'} /> : surface === 'canonical' ? <CatalogTable><thead><tr><th>Referencia</th><th>Aplicable a</th><th>Estado</th><th data-mobile-hidden="true"><CatalogCanonicalUsageHeader description="Artículos vinculados por identidad canónica. No cuenta coincidencias del texto capturado." /></th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead><tbody>{visible.length === 0 ? <CatalogEmptyRow colSpan={5}>No hay referencias {status === 'active' ? 'activas' : status === 'inactive' ? 'inactivas' : 'en el catálogo'}.</CatalogEmptyRow> : visible.map((reference) => <tr key={id(reference)} data-status={reference.status.toLowerCase()}><td><CatalogEntityName label={reference.name} secondary={`v${reference.version}`} /></td><td>{reference.applicableKinds.map((kind) => kindLabels[kind]).join(', ')}</td><td><CatalogStatusBadge status={reference.status.toLowerCase() as 'active' | 'inactive'} /></td><td data-mobile-hidden="true"><CatalogUsage count={reference.usageCount ?? 0} singular="artículo" plural="artículos" /></td><td><CatalogRowActions emptyLabel="Sin acciones" actions={[{ key: 'edit', label: 'Editar', icon: Pencil, disabled: busy, onClick: () => openEditor(reference) }, { key: 'status', label: reference.status === 'ACTIVE' ? 'Desactivar' : 'Reactivar', icon: reference.status === 'INACTIVE' ? RotateCcw : undefined, disabled: busy, onClick: () => { void transition(reference); } }]} /></td></tr>)}</tbody></CatalogTable> : <CatalogTable><thead><tr><th>Valor capturado</th><th>Tipo aplicable</th><th data-mobile-hidden="true">Uso</th><th data-mobile-hidden="true">Primera / última vez</th><th data-mobile-hidden="true">Capturado por</th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead><tbody>{pending.length === 0 ? <CatalogEmptyRow colSpan={6}>No hay valores por revisar.</CatalogEmptyRow> : pending.map((item) => <tr key={pendingId(item)}><td><CatalogEntityName label={item.rawLabel} secondary={`Pendiente · v${item.version}`} /></td><td>{pendingKinds(item).map((kind) => kindLabels[kind]).join(', ')}</td><td data-mobile-hidden="true"><CatalogUsage count={item.usageCount} singular="artículo" plural="artículos" /></td><td data-mobile-hidden="true"><small>{date(item.firstSeenAt)}<br />{date(item.lastSeenAt)}</small></td><td data-mobile-hidden="true"><small>{item.capturedBy ?? 'Actor no disponible'}<br />Branch {item.capturedInBranchId.slice(0, 8)}</small></td><td><CatalogRowActions actions={[{ key: 'resolve', label: 'Resolver', tone: 'primary', disabled: busy, onClick: () => openResolver(item) }]} emptyLabel="Sin acciones" /></td></tr>)}</tbody></CatalogTable>}
    </CatalogPanel>

    <Dialog open={editor !== null} title={editor === 'new' ? `Agregar ${referenceKind === 'category' ? 'categoría' : 'marca'}` : 'Editar referencia'} description="Gobierno Tenant-wide del catálogo comercial." onClose={() => !busy && setEditor(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void save(event); }}><Field id="commercial-reference-name" label="Nombre" required><Input id="commercial-reference-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></Field><fieldset className={styles.resolutionModes}><legend>Aplicable a</legend>{allKinds.map((kind) => <label key={kind}><input type={referenceKind === 'category' ? 'radio' : 'checkbox'} name="commercial-kind" checked={kinds.includes(kind)} onChange={() => toggleKind(kind)} />{kindLabels[kind]}</label>)}</fieldset><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || !name.trim() || kinds.length < 1}>Guardar</Button></div></form></Dialog>
    <Dialog open={resolver !== null} title={`Resolver ${referenceKind === 'category' ? 'categoría' : 'marca'} pendiente`} description={resolver ? `Valor capturado: ${resolver.rawLabel} · ${usage(resolver.usageCount)}` : ''} onClose={() => !busy && setResolver(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void resolve(event); }}><div className={styles.resolutionModes} role="group" aria-label="Tipo de resolución"><label><input type="radio" checked={resolutionMode === 'existing'} onChange={() => { setResolutionMode('existing'); setResolutionId(''); setResolutionQuery(''); }} />Asociar a referencia existente</label><label><input type="radio" checked={resolutionMode === 'new'} onChange={() => { setResolutionMode('new'); setResolutionId(''); }} />Crear referencia canónica</label></div>{resolutionMode === 'existing' ? <Field id="commercial-resolution-search" label="Buscar referencia canónica compatible" required><div className={styles.resolutionSearch}><Input id="commercial-resolution-search" value={resolutionQuery} autoComplete="off" placeholder="Buscar…" role="combobox" aria-autocomplete="list" aria-expanded={candidates.length > 0} aria-controls="commercial-resolution-options" onChange={(event) => { setResolutionQuery(event.target.value); setResolutionId(''); }} />{candidates.length > 0 ? <div id="commercial-resolution-options" className={styles.resolutionOptions} role="listbox">{candidates.map((candidate) => <button key={id(candidate)} type="button" role="option" aria-selected={resolutionId === id(candidate)} onClick={() => { setResolutionId(id(candidate)); setResolutionQuery(candidate.name); }}><strong>{candidate.name}</strong><small>{candidate.applicableKinds.map((kind) => kindLabels[kind]).join(', ')}</small></button>)}</div> : resolutionQuery.trim() ? <small className={styles.resolutionEmpty}>No hay coincidencias canónicas activas y compatibles.</small> : null}</div></Field> : <><Field id="commercial-resolution-name" label="Nombre canónico" required><Input id="commercial-resolution-name" value={resolutionName} maxLength={120} onChange={(event) => setResolutionName(event.target.value)} /></Field><fieldset className={styles.resolutionModes}><legend>Aplicable a</legend>{allKinds.map((kind) => <label key={kind}><input type={referenceKind === 'category' ? 'radio' : 'checkbox'} checked={resolutionKinds.includes(kind)} disabled={requiredKinds.includes(kind)} onChange={() => toggleResolutionKind(kind)} />{kindLabels[kind]}{requiredKinds.includes(kind) ? ' · requerido por uso' : ''}</label>)}</fieldset></>}<p className={styles.confirmCopy}>Los artículos relacionados usarán la identidad canónica; el valor capturado y su trazabilidad permanecen intactos.</p><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setResolver(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || (resolutionMode === 'existing' ? !resolutionId : !resolutionName.trim() || resolutionKinds.length < 1)}>Resolver</Button></div></form></Dialog>
  </>;
}
