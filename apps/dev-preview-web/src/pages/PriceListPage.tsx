import { Barcode, Boxes, CircleDollarSign, Plus, Search, Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  changeCatalogBasePrice, changeCatalogReferenceCost, createCatalogBrand,
  createCatalogCategory, createCatalogItem, getCatalogItem, listCatalogReferences,
  revokeCatalogBranchPrice, searchPriceList, setCatalogBranchPrice, updateCatalogItem,
} from '../catalog-api.js';
import type { CatalogItem, CatalogItemKind, CatalogReferences, PriceListItem, PriceListPage } from '../catalog-api.js';
import { CatalogReferenceCombobox } from '../components/CatalogReferenceCombobox.js';
import { Button, Field, Input, Select, Textarea } from '../components/ui/controls.js';
import { Alert, EmptyState, ErrorState, Skeleton, Spinner } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import { useUserPreferences } from '../user-preferences/UserPreferencesProvider.js';
import styles from './price-list-page.module.css';

const kindLabels: Readonly<Record<CatalogItemKind, string>> = Object.freeze({ PART: 'Refacción', PRODUCT: 'Producto', SERVICE: 'Servicio', SUPPLY: 'Insumo' });
type Notice = Readonly<{ tone: 'danger' | 'success' | 'warning'; message: string }>;

function money(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amountMinor / 100);
}
function minor(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/u.test(value.trim())) return null;
  const [whole = '0', decimals = ''] = value.trim().split('.');
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : null;
}
function sku(item: CatalogItem): string { return item.identifiers.find(({ scheme }) => scheme === 'SKU')?.value ?? 'Sin SKU'; }
function identifierName(scheme: string): string { return scheme === 'INTERNAL_BARCODE' ? 'Código interno' : scheme.replace('_', '-'); }

function PriceCard({ value, canManage, onManage }: Readonly<{ value: PriceListItem; canManage: boolean; onManage(itemId: string): void }>) {
  return (
    <article className={styles.priceCard}>
      <div className={styles.cardMain}>
        <span className={styles.kindIcon} aria-hidden="true">{value.item.kind === 'SERVICE' ? <CircleDollarSign size={21} /> : <Boxes size={21} />}</span>
        <div>
          <h2>{value.item.title}</h2>
          <p>{kindLabels[value.item.kind]} · {value.item.category.name}{value.item.brand ? ` · ${value.item.brand.name}` : ''}</p>
          <div className={styles.identifiers}><span><Tag size={14} aria-hidden="true" />SKU {sku(value.item)}</span>{value.item.identifiers.filter(({ scheme }) => scheme !== 'SKU').map((identifier) => <span key={identifier.identifierId}><Barcode size={14} aria-hidden="true" />{identifierName(identifier.scheme)} {identifier.value}</span>)}</div>
        </div>
      </div>
      <div className={styles.cardPrice}>
        {value.price ? <><strong>{money(value.price.amountMinor, value.price.currency)}</strong><span>{value.price.source === 'BRANCH_OVERRIDE' ? 'Override Branch' : 'Base Tenant'}</span></> : <><strong className={styles.notPriced}>Sin precio</strong><span>Requiere precio base</span></>}
        {value.referenceCost ? <small>Costo ref. {money(value.referenceCost.amountMinor, value.referenceCost.currency)}</small> : null}
        {canManage ? <Button size="compact" onClick={() => onManage(value.item.itemId)}>Administrar</Button> : null}
      </div>
    </article>
  );
}

export function PriceListPage({ capabilities, administrationCapabilities, csrfToken }: Readonly<{ capabilities: readonly OperationalCapability[]; administrationCapabilities: readonly OperationalCapability[]; csrfToken: string }>): React.JSX.Element {
  const canManage = hasOperationalCapability(administrationCapabilities, 'catalog.manage');
  const canManagePrice = hasOperationalCapability(administrationCapabilities, 'catalog.prices.manage');
  const canManageBranchPrice = hasOperationalCapability(capabilities, 'catalog.branch_prices.manage');
  const canReadCost = hasOperationalCapability(capabilities, 'catalog.reference_cost.read');
  const canManageCost = hasOperationalCapability(administrationCapabilities, 'catalog.reference_cost.manage');
  const preferences = useUserPreferences();
  const [references, setReferences] = useState<CatalogReferences | null>(null);
  const [page, setPage] = useState<PriceListPage | null>(null);
  const [query, setQuery] = useState(''); const [categoryId, setCategoryId] = useState(''); const [brandId, setBrandId] = useState('');
  const [pageNumber, setPageNumber] = useState(1); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null); const [dialog, setDialog] = useState<'create' | 'manage' | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null); const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<CatalogItemKind>('PART'); const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState(''); const [formBrandId, setFormBrandId] = useState(''); const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formSku, setFormSku] = useState(''); const [internalCode, setInternalCode] = useState(''); const [externalScheme, setExternalScheme] = useState(''); const [externalValue, setExternalValue] = useState('');
  const [basePrice, setBasePrice] = useState(''); const [referenceCost, setReferenceCost] = useState(''); const [overridePrice, setOverridePrice] = useState('');
  const requestId = useRef<string | null>(null);

  const includeCost = canReadCost && preferences.priceListShowReferenceCost;
  const refreshReferences = useCallback(async () => { const value = await listCatalogReferences(); setReferences(value); return value; }, []);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const value = await searchPriceList({ query, categoryId, brandId, page: pageNumber, includeReferenceCost: includeCost }, signal);
    setPage(value); setLoadError(false); setLoading(false);
  }, [query, categoryId, brandId, pageNumber, includeCost]);

  useEffect(() => { void refreshReferences().catch(() => setLoadError(true)); }, [refreshReferences]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    const timeout = window.setTimeout(() => { void refresh(controller.signal).catch((error: unknown) => { if (!(error instanceof DOMException && error.name === 'AbortError')) { setLoadError(true); setLoading(false); } }); }, 220);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [refresh]);

  const activeCategories = useMemo(() => references?.categories.filter(({ status }) => status === 'ACTIVE') ?? [], [references]);
  const activeBrands = useMemo(() => references?.brands.filter(({ status }) => status === 'ACTIVE') ?? [], [references]);
  const applicableCategories = useMemo(() => activeCategories.filter((reference) => reference.applicableKinds.includes(kind)), [activeCategories, kind]);
  const applicableBrands = useMemo(() => activeBrands.filter((reference) => reference.applicableKinds.includes(kind)), [activeBrands, kind]);
  const resetForm = (): void => { setSelected(null); setKind('PART'); setTitle(''); setDescription(''); setFormCategoryId(''); setFormBrandId(''); setFormStatus('ACTIVE'); setFormSku(''); setInternalCode(''); setExternalScheme(''); setExternalValue(''); setBasePrice(''); setReferenceCost(''); setOverridePrice(''); requestId.current = null; };
  const openCreate = (): void => { resetForm(); setDialog('create'); setNotice(null); };
  const openManage = async (itemId: string): Promise<void> => {
    setSaving(true); setNotice(null);
    try { const item = await getCatalogItem(itemId); setSelected(item); setKind(item.kind); setTitle(item.title); setDescription(item.description ?? ''); setFormCategoryId(item.category.categoryId ?? ''); setFormBrandId(item.brand?.brandId ?? ''); setFormStatus(item.status); setDialog('manage'); }
    catch { setNotice({ tone: 'danger', message: 'No fue posible cargar el artículo.' }); }
    finally { setSaving(false); }
  };
  const close = (): void => { if (!saving) { setDialog(null); requestId.current = null; } };
  const nextRequestId = (): string => requestId.current ??= crypto.randomUUID();
  const commandDone = async (message: string): Promise<void> => { requestId.current = null; await refreshReferences(); await refresh(); setNotice({ tone: 'success', message }); };

  const addCategory = async (name: string) => {
    try { const created = await createCatalogCategory(name, [kind], csrfToken, true); await refreshReferences(); setNotice({ tone: 'warning', message: `Categoría “${created.name}” creada como Por revisar. Puedes continuar con el artículo.` }); return created; }
    catch (error) { setNotice({ tone: 'danger', message: 'No fue posible crear la categoría. Revisa si ya existe una equivalente.' }); throw error; }
  };
  const addBrand = async (name: string) => {
    try { const created = await createCatalogBrand(name, [kind], csrfToken, true); await refreshReferences(); setNotice({ tone: 'warning', message: `Marca “${created.name}” creada como Por revisar. Puedes continuar con el artículo.` }); return created; }
    catch (error) { setNotice({ tone: 'danger', message: 'No fue posible crear la marca. Revisa si ya existe una equivalente.' }); throw error; }
  };
  const changeKind = (next: CatalogItemKind): void => {
    const categoryCompatible = activeCategories.find((value) => value.categoryId === formCategoryId)?.applicableKinds.includes(next) ?? false;
    const brandCompatible = !formBrandId || (activeBrands.find((value) => value.brandId === formBrandId)?.applicableKinds.includes(next) ?? false);
    setKind(next);
    if (!categoryCompatible) setFormCategoryId('');
    if (!brandCompatible) setFormBrandId('');
    if ((formCategoryId && !categoryCompatible) || (formBrandId && !brandCompatible)) setNotice({ tone: 'warning', message: 'Limpiamos Categoría o Marca porque no aplican al nuevo Tipo.' });
  };
  const submitCreate = async (): Promise<void> => {
    const price = minor(basePrice); const cost = referenceCost ? minor(referenceCost) : null;
    if (!title.trim() || !formCategoryId || price === null || (referenceCost && cost === null)) { setNotice({ tone: 'danger', message: 'Completa título, categoría y precio con hasta dos decimales.' }); return; }
    setSaving(true);
    try {
      const created = await createCatalogItem({ kind, title, description: description || null, categoryId: formCategoryId, brandId: formBrandId || null, sku: formSku || null, internalCode: internalCode || null, externalIdentifier: externalScheme && externalValue ? { scheme: externalScheme, value: externalValue } : null, basePriceAmountMinor: price, referenceCostAmountMinor: cost, referenceCostSourceType: 'MANUAL', expectedVersion: 0, clientRequestId: nextRequestId() }, csrfToken);
      const createdSku = created.identifiers.find((value) => value.scheme === 'SKU')?.value; const createdCode = created.identifiers.find((value) => value.scheme === 'INTERNAL_BARCODE')?.value;
      await commandDone(`${kind === 'SUPPLY' ? 'Insumo creado en catálogo; no forma parte de la Lista de precios comercial.' : 'Artículo creado y disponible en la lista.'} SKU ${createdSku ?? '—'} · Código interno ${createdCode ?? '—'}`); setDialog(null); resetForm();
    } catch { setNotice({ tone: 'danger', message: 'No fue posible crear. Revisa SKU/código, permisos y datos.' }); }
    finally { setSaving(false); }
  };
  const saveIdentity = async (): Promise<void> => {
    if (!selected || !title.trim() || !formCategoryId) return; setSaving(true);
    try { const updated = await updateCatalogItem(selected.itemId, { title, description: description || null, categoryId: formCategoryId, brandId: formBrandId || null, status: formStatus, expectedVersion: selected.version, clientRequestId: nextRequestId() }, csrfToken); setSelected(updated); await commandDone('Datos del artículo actualizados.'); }
    catch { setNotice({ tone: 'danger', message: 'No se guardó: relee el artículo si otra persona lo modificó.' }); }
    finally { setSaving(false); }
  };
  const moneyCommand = async (type: 'base' | 'cost' | 'override' | 'revoke'): Promise<void> => {
    if (!selected) return; const value = type === 'base' ? basePrice : type === 'cost' ? referenceCost : overridePrice; const amount = type === 'revoke' ? 0 : minor(value);
    if (amount === null) { setNotice({ tone: 'danger', message: 'Escribe un importe válido con hasta dos decimales.' }); return; }
    setSaving(true);
    try {
      const common = { amountMinor: amount, expectedVersion: selected.version, clientRequestId: nextRequestId() };
      const updated = type === 'base' ? await changeCatalogBasePrice(selected.itemId, common, csrfToken)
        : type === 'cost' ? await changeCatalogReferenceCost(selected.itemId, { ...common, sourceType: 'MANUAL' }, csrfToken)
          : type === 'override' ? await setCatalogBranchPrice(selected.itemId, common, csrfToken)
            : await revokeCatalogBranchPrice(selected.itemId, { expectedVersion: selected.version, clientRequestId: nextRequestId() }, csrfToken);
      setSelected(updated); await commandDone(type === 'revoke' ? 'Override revocado; vuelve a heredar Base Tenant.' : 'Importe actualizado con una nueva revisión.');
    } catch { setNotice({ tone: 'danger', message: 'No se aplicó el cambio. Revisa permisos, versión y estado actual.' }); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Listas" title="Lista de precios" description="Referencia rápida del precio efectivo en esta sucursal." primaryAction={canManage && canManagePrice ? <Button tone="primary" onClick={openCreate}><Plus size={18} aria-hidden="true" />Nuevo artículo</Button> : undefined} />
      {notice ? <Alert tone={notice.tone} title={notice.tone === 'success' ? 'Listo' : 'Atención'}>{notice.message}</Alert> : null}
      <section className={styles.toolbar} aria-label="Buscar y filtrar lista de precios">
        <label className={styles.search}><Search size={20} aria-hidden="true" /><span className="srt-visually-hidden">Buscar</span><Input value={query} onChange={(event) => { setQuery(event.target.value); setPageNumber(1); }} placeholder="Buscar por nombre, SKU o código…" autoComplete="off" /></label>
        <label><span className="srt-visually-hidden">Categoría</span><Select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPageNumber(1); }}><option value="">Todas las categorías</option>{activeCategories.map((value) => <option key={value.categoryId} value={value.categoryId}>{value.name}</option>)}</Select></label>
        <label><span className="srt-visually-hidden">Marca</span><Select value={brandId} onChange={(event) => { setBrandId(event.target.value); setPageNumber(1); }}><option value="">Todas las marcas</option>{activeBrands.map((value) => <option key={value.brandId} value={value.brandId}>{value.name}</option>)}</Select></label>
        {canReadCost ? <label className={styles.costToggle}><input type="checkbox" checked={preferences.priceListShowReferenceCost} disabled={preferences.saving} onChange={(event) => { void preferences.setPriceListShowReferenceCost(event.target.checked).catch(() => undefined); }} />Mostrar costos de referencia</label> : null}
      </section>
      {loadError ? <ErrorState title="No pudimos cargar la lista" description="Conservamos el contexto seguro. Intenta de nuevo." />
        : loading ? <Skeleton rows={5} />
          : page?.items.length ? <><div className={styles.results} aria-live="polite">{page.items.map((item) => <PriceCard key={item.item.itemId} value={item} canManage={canManage} onManage={(id) => void openManage(id)} />)}</div><footer className={styles.pagination}><span>{page.totalCount} resultados</span><div><Button size="compact" disabled={pageNumber === 1} onClick={() => setPageNumber((current) => current - 1)}>Anterior</Button><span>Página {pageNumber}</span><Button size="compact" disabled={pageNumber * 25 >= page.totalCount} onClick={() => setPageNumber((current) => current + 1)}>Siguiente</Button></div></footer></>
          : <EmptyState title="No hay artículos para mostrar" description={query || categoryId || brandId ? 'Prueba otra búsqueda o limpia los filtros.' : 'Crea una refacción, producto o servicio para comenzar.'} />}

      <Dialog open={dialog !== null} size="wide" title={dialog === 'create' ? 'Nuevo artículo' : `Administrar ${selected?.title ?? 'artículo'}`} description={dialog === 'create' ? 'Identidad comercial Tenant-wide y precio base.' : 'Los cambios de importe crean revisiones; el override sólo afecta esta sucursal.'} onClose={close} footer={false}>
        <div className={styles.dialogBody}>
          {notice ? <Alert tone={notice.tone}>{notice.message}</Alert> : null}
          <section className={styles.formGrid} aria-label="Identidad del artículo">
            {dialog === 'create' ? <Field id="catalog-kind" label="Tipo" required><Select id="catalog-kind" value={kind} onChange={(event) => changeKind(event.target.value as CatalogItemKind)}><option value="PART">Refacción</option><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option><option value="SUPPLY">Insumo (no aparece en Lista)</option></Select></Field> : null}
            <Field id="catalog-title" label="Título" required fullWidth><Input id="catalog-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field id="catalog-description" label="Descripción" fullWidth><Textarea id="catalog-description" value={description} maxLength={2000} onChange={(event) => setDescription(event.target.value)} /></Field>
            <Field id="catalog-category" label="Categoría" required hint="Busca o crea explícitamente un valor Por revisar."><CatalogReferenceCombobox id="catalog-category" label="Categorías aplicables" emptyLabel="Buscar categoría…" value={formCategoryId} references={applicableCategories} canCreate={canManage} onChange={setFormCategoryId} onCreate={addCategory} /></Field>
            <Field id="catalog-brand" label="Marca" hint="Opcional; deja vacío para Sin marca."><CatalogReferenceCombobox id="catalog-brand" label="Marcas aplicables" emptyLabel="Sin marca / buscar…" value={formBrandId} references={applicableBrands} canCreate={canManage} onChange={setFormBrandId} onCreate={addBrand} /></Field>
            {dialog === 'manage' ? <Field id="catalog-status" label="Estado"><Select id="catalog-status" value={formStatus} onChange={(event) => setFormStatus(event.target.value as 'ACTIVE' | 'INACTIVE')}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></Select></Field> : null}
            {dialog === 'create' ? <><Field id="catalog-sku" label="SKU" hint="Automático si lo dejas vacío."><Input id="catalog-sku" value={formSku} onChange={(event) => setFormSku(event.target.value)} placeholder="Ej. REF-PANTALLA-11" autoComplete="off" /></Field><Field id="catalog-internal-code" label="Código interno" hint="Identificador SR Taller; automático si lo dejas vacío."><Input id="catalog-internal-code" value={internalCode} onChange={(event) => setInternalCode(event.target.value)} placeholder="Ej. SR-LOCAL-001" autoComplete="off" /></Field><details className={styles.externalIdentifier}><summary>Agregar GTIN / EAN / UPC externo</summary><div><Field id="catalog-external-scheme" label="Esquema externo"><Select id="catalog-external-scheme" value={externalScheme} onChange={(event) => setExternalScheme(event.target.value)}><option value="">Sin identificador externo</option><option value="GTIN_8">GTIN / EAN-8</option><option value="GTIN_12">GTIN / UPC-12</option><option value="GTIN_13">GTIN / EAN-13</option><option value="GTIN_14">GTIN-14</option></Select></Field>{externalScheme ? <Field id="catalog-external-code" label="Valor externo"><Input id="catalog-external-code" value={externalValue} onChange={(event) => setExternalValue(event.target.value)} inputMode="numeric" /></Field> : null}</div></details></> : null}
          </section>
          {dialog === 'create' ? <section className={styles.moneyGrid}><Field id="catalog-base-price" label="Precio base" required><Input id="catalog-base-price" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} inputMode="decimal" placeholder="1399.00" /></Field>{canManageCost ? <Field id="catalog-cost" label="Costo de referencia"><Input id="catalog-cost" value={referenceCost} onChange={(event) => setReferenceCost(event.target.value)} inputMode="decimal" placeholder="480.00" /></Field> : null}</section> : null}
          {dialog === 'manage' && selected ? <section className={styles.moneyActions}><h3>Precios y costo</h3>{canManagePrice ? <div><Input aria-label="Nuevo precio base" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} placeholder="Precio base" inputMode="decimal" /><Button disabled={saving} onClick={() => void moneyCommand('base')}>Cambiar base</Button></div> : null}{canManageBranchPrice ? <div><Input aria-label="Override de esta sucursal" value={overridePrice} onChange={(event) => setOverridePrice(event.target.value)} placeholder="Override Branch" inputMode="decimal" /><Button disabled={saving} onClick={() => void moneyCommand('override')}>Aplicar override</Button><Button tone="quiet" disabled={saving} onClick={() => void moneyCommand('revoke')}>Revocar override</Button></div> : null}{canManageCost ? <div><Input aria-label="Nuevo costo de referencia" value={referenceCost} onChange={(event) => setReferenceCost(event.target.value)} placeholder="Costo de referencia" inputMode="decimal" /><Button disabled={saving} onClick={() => void moneyCommand('cost')}>Cambiar costo</Button></div> : null}</section> : null}
          <footer className={styles.dialogFooter}><Button onClick={close} disabled={saving}>Cerrar</Button>{dialog === 'create' ? <Button tone="primary" disabled={saving} onClick={() => void submitCreate()}>{saving ? <Spinner label="Guardando" /> : null}Crear artículo</Button> : <Button tone="primary" disabled={saving} onClick={() => void saveIdentity()}>{saving ? <Spinner label="Guardando" /> : null}Guardar datos</Button>}</footer>
        </div>
      </Dialog>
    </div>
  );
}
