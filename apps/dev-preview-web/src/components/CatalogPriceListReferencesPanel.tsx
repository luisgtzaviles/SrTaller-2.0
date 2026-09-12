import { Check, Merge, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createCatalogBrand, createCatalogCategory, listCatalogAdministrationReferences,
  resolveCatalogBrand, resolveCatalogCategory, updateCatalogBrand, updateCatalogCategory,
} from '../catalog-api.js';
import type { CatalogItemKind, CatalogReference, CatalogReferences } from '../catalog-api.js';
import {
  CatalogEmptyRow, CatalogEntityName, CatalogFeedback, CatalogHeader, CatalogLoadingState,
  CatalogPanel, CatalogRowActions, CatalogStatusBadge, CatalogTable, CatalogToolbar,
  catalogAdministrationStyles as styles,
} from './catalogs/CatalogAdministration.js';
import { Button, Field, Input, Select } from './ui/controls.js';
import { Dialog } from './ui/overlays.js';

const kindLabels: Readonly<Record<CatalogItemKind, string>> = Object.freeze({ PART: 'Refacción', PRODUCT: 'Producto', SERVICE: 'Servicio', SUPPLY: 'Insumo' });
const allKinds = Object.keys(kindLabels) as CatalogItemKind[];
type ReferenceKind = 'category' | 'brand';

function id(reference: CatalogReference): string { return reference.categoryId ?? reference.brandId ?? ''; }
function date(value?: string): string { return value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sin dato previo'; }

export function CatalogPriceListReferencesPanel({ csrfToken }: Readonly<{ csrfToken: string }>): React.JSX.Element {
  const [references, setReferences] = useState<CatalogReferences>({ categories: [], brands: [] });
  const [referenceKind, setReferenceKind] = useState<ReferenceKind>('category');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<CatalogReference | 'new' | null>(null);
  const [name, setName] = useState(''); const [kinds, setKinds] = useState<readonly CatalogItemKind[]>(['PART']);
  const [mergeSource, setMergeSource] = useState<CatalogReference | null>(null); const [mergeTargetId, setMergeTargetId] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try { setReferences(await listCatalogAdministrationReferences(signal)); setError(null); }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError('No fue posible cargar los catálogos comerciales.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const items = referenceKind === 'category' ? references.categories : references.brands;
  const pending = items.filter((item) => item.reviewStatus === 'PENDING');
  const governed = items.filter((item) => item.reviewStatus !== 'MERGED');
  const mergeTargets = useMemo(() => items.filter((item) => item.reviewStatus === 'APPROVED' && item.status === 'ACTIVE' && mergeSource?.applicableKinds.every((kind) => item.applicableKinds.includes(kind))), [items, mergeSource]);

  function openEditor(value: CatalogReference | 'new'): void {
    setEditor(value); setName(value === 'new' ? '' : value.name); setKinds(value === 'new' ? ['PART'] : value.applicableKinds); setNotice(null);
  }
  function toggleKind(kind: CatalogItemKind): void {
    if (referenceKind === 'category') { setKinds([kind]); return; }
    setKinds((current) => current.includes(kind) ? current.filter((value) => value !== kind) : [...current, kind]);
  }
  async function save(event: React.FormEvent): Promise<void> {
    event.preventDefault(); if (!editor || !name.trim() || kinds.length < 1) return;
    setBusy(true); setError(null);
    try {
      if (editor === 'new') {
        if (referenceKind === 'category') await createCatalogCategory(name.trim(), kinds, csrfToken);
        else await createCatalogBrand(name.trim(), kinds, csrfToken);
      } else {
        const body = { name: name.trim(), status: editor.status, applicableKinds: kinds, expectedVersion: editor.version, clientRequestId: crypto.randomUUID() };
        if (referenceKind === 'category') await updateCatalogCategory(id(editor), body, csrfToken); else await updateCatalogBrand(id(editor), body, csrfToken);
      }
      setNotice(editor === 'new' ? 'Referencia canónica creada.' : 'Referencia actualizada con su aplicabilidad explícita.'); setEditor(null); await load();
    } catch { setError('No se guardó. Revisa duplicados, uso incompatible o una versión más reciente.'); }
    finally { setBusy(false); }
  }
  async function transition(reference: CatalogReference): Promise<void> {
    setBusy(true); setError(null);
    try {
      const body = { name: reference.name, status: reference.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', applicableKinds: reference.applicableKinds, expectedVersion: reference.version, clientRequestId: crypto.randomUUID() };
      if (referenceKind === 'category') await updateCatalogCategory(id(reference), body, csrfToken); else await updateCatalogBrand(id(reference), body, csrfToken);
      setNotice(reference.status === 'ACTIVE' ? 'Referencia retirada de nuevas sugerencias.' : 'Referencia reactivada.'); await load();
    } catch { setError('No fue posible cambiar el estado; puede existir uso incompatible o una versión nueva.'); }
    finally { setBusy(false); }
  }
  async function approve(reference: CatalogReference): Promise<void> {
    setBusy(true); setError(null);
    try {
      const body = { resolution: 'APPROVE', targetId: null, expectedVersion: reference.version, clientRequestId: crypto.randomUUID() };
      if (referenceKind === 'category') await resolveCatalogCategory(id(reference), body, csrfToken); else await resolveCatalogBrand(id(reference), body, csrfToken);
      setNotice(`“${reference.name}” quedó aprobado como referencia canónica.`); await load();
    } catch { setError('No fue posible aprobar; actualiza y revisa el estado vigente.'); }
    finally { setBusy(false); }
  }
  async function merge(): Promise<void> {
    if (!mergeSource || !mergeTargetId) return; setBusy(true); setError(null);
    try {
      const body = { resolution: 'MERGE', targetId: mergeTargetId, expectedVersion: mergeSource.version, clientRequestId: crypto.randomUUID() };
      if (referenceKind === 'category') await resolveCatalogCategory(id(mergeSource), body, csrfToken); else await resolveCatalogBrand(id(mergeSource), body, csrfToken);
      setNotice(`“${mergeSource.name}” se reconcilió con la referencia canónica elegida.`); setMergeSource(null); await load();
    } catch { setError('No fue posible fusionar. La referencia destino debe estar activa, aprobada y ser compatible.'); }
    finally { setBusy(false); }
  }

  return <>
    <nav className={styles.lifecycleFilter} aria-label="Catálogos de Lista de precios">
      <button type="button" aria-pressed={referenceKind === 'category'} onClick={() => setReferenceKind('category')}>Categorías <span>{references.categories.filter((value) => value.reviewStatus !== 'MERGED').length}</span></button>
      <button type="button" aria-pressed={referenceKind === 'brand'} onClick={() => setReferenceKind('brand')}>Marcas <span>{references.brands.filter((value) => value.reviewStatus !== 'MERGED').length}</span></button>
    </nav>
    <CatalogPanel labelledBy="commercial-reference-title">
      <CatalogHeader id="commercial-reference-title" title={referenceKind === 'category' ? 'Categorías comerciales' : 'Marcas comerciales'} description={referenceKind === 'category' ? 'Cada categoría nace gobernada por un Tipo.' : 'Una sola identidad Tenant-wide puede aplicar a varios Tipos.'} metadata={pending.length ? <strong>{pending.length} por revisar</strong> : <span>Sin pendientes</span>} canManage action={<Button tone="primary" size="compact" onClick={() => openEditor('new')}><Plus size={16} aria-hidden="true" />Agregar</Button>} />
      <CatalogFeedback error={error} success={notice} />
      <CatalogToolbar result={`${governed.length} referencias · ${pending.length} por revisar`} />
      {loading ? <CatalogLoadingState /> : <CatalogTable><thead><tr><th>Referencia</th><th>Aplicable a</th><th>Revisión</th><th data-mobile-hidden="true">Trazabilidad</th><th>Estado</th><th><span className={styles.srOnly}>Acciones</span></th></tr></thead><tbody>
        {governed.length === 0 ? <CatalogEmptyRow colSpan={6}>Aún no hay referencias.</CatalogEmptyRow> : governed.map((reference) => <tr key={id(reference)}>
          <td><CatalogEntityName label={reference.name} secondary={`v${reference.version} · ${reference.usageCount ?? 0} usos`} /></td>
          <td>{reference.applicableKinds.map((kind) => kindLabels[kind]).join(', ')}</td>
          <td>{reference.reviewStatus === 'PENDING' ? <strong>POR REVISAR</strong> : 'Aprobada'}</td>
          <td data-mobile-hidden="true"><small>{reference.createdBy ?? 'Migración previa'}<br />Branch {reference.createdInBranchId?.slice(0, 8) ?? 'sin contexto'}<br />{date(reference.createdAt)}</small></td>
          <td><CatalogStatusBadge status={reference.status === 'ACTIVE' ? 'active' : 'inactive'} /></td>
          <td><CatalogRowActions emptyLabel="Sin acciones" actions={reference.reviewStatus === 'PENDING' ? [
            { key: 'approve', label: 'Aprobar', icon: Check, tone: 'primary', disabled: busy, onClick: () => { void approve(reference); } },
            { key: 'merge', label: 'Fusionar', icon: Merge, disabled: busy, onClick: () => { setMergeSource(reference); setMergeTargetId(''); } },
          ] : [
            { key: 'edit', label: 'Editar', icon: Pencil, disabled: busy, onClick: () => openEditor(reference) },
            { key: 'status', label: reference.status === 'ACTIVE' ? 'Desactivar' : 'Reactivar', icon: reference.status === 'INACTIVE' ? RotateCcw : undefined, disabled: busy, onClick: () => { void transition(reference); } },
          ]} /></td>
        </tr>)}
      </tbody></CatalogTable>}
    </CatalogPanel>

    <Dialog open={editor !== null} title={editor === 'new' ? `Agregar ${referenceKind === 'category' ? 'categoría' : 'marca'}` : 'Editar referencia'} description="Gobierno Tenant-wide del catálogo comercial." onClose={() => !busy && setEditor(null)} footer={false}><form className={styles.editorForm} onSubmit={(event) => { void save(event); }}><Field id="commercial-reference-name" label="Nombre" required><Input id="commercial-reference-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></Field><fieldset className={styles.resolutionModes}><legend>Aplicable a</legend>{allKinds.map((kind) => <label key={kind}><input type={referenceKind === 'category' ? 'radio' : 'checkbox'} name="commercial-kind" checked={kinds.includes(kind)} onChange={() => toggleKind(kind)} />{kindLabels[kind]}</label>)}</fieldset><div className={styles.dialogActions}><Button disabled={busy} onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" tone="primary" disabled={busy || !name.trim() || kinds.length < 1}>Guardar</Button></div></form></Dialog>
    <Dialog open={mergeSource !== null} title="Fusionar valor Por revisar" description={mergeSource?.name ?? ''} onClose={() => !busy && setMergeSource(null)} footer={<><Button disabled={busy} onClick={() => setMergeSource(null)}>Cancelar</Button><Button tone="primary" disabled={busy || !mergeTargetId} onClick={() => { void merge(); }}>Fusionar</Button></>}><Field id="commercial-merge-target" label="Referencia canónica destino" required><Select id="commercial-merge-target" value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}><option value="">Selecciona…</option>{mergeTargets.map((target) => <option key={id(target)} value={id(target)}>{target.name}</option>)}</Select></Field><p>Los artículos se reasignan a la identidad canónica; el valor capturado queda trazado como fusionado.</p></Dialog>
  </>;
}
