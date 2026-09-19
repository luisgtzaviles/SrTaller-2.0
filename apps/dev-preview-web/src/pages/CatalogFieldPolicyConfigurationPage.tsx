import { ArrowLeft, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PreviewApiError } from '../api.js';
import type { CatalogFieldPolicyLevel, CatalogFieldPolicyResponse } from '../catalog-api.js';
import { getCatalogFieldPolicy, restoreCatalogFieldPolicyDefaults, updateCatalogFieldPolicy } from '../catalog-api.js';
import { Button, ButtonLink } from '../components/ui/controls.js';
import { Alert } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import styles from './catalog-field-policy-configuration-page.module.css';

const labels: Readonly<Record<CatalogFieldPolicyLevel, string>> = Object.freeze({
  REQUIRED: 'Obligatorio',
  ESSENTIAL: 'Esencial',
  OPTIONAL: 'Opcional',
});

function errorMessage(cause: unknown): string {
  if (cause instanceof PreviewApiError) {
    if (cause.status === 403) return 'Tu sesión no tiene permiso para consultar esta configuración.';
    if (cause.status === 409) return 'La configuración cambió en otra sesión. Recarga los valores actuales antes de guardar.';
    if (cause.status === 400) return 'La configuración solicitada ya no es válida. Recarga e inténtalo de nuevo.';
  }
  return 'No fue posible completar la operación. Inténtalo de nuevo.';
}

function sourceLabel(policy: CatalogFieldPolicyResponse): string {
  return policy.source === 'product-default' ? 'Predeterminada por SR Taller' : 'Configuración personalizada';
}

export function CatalogFieldPolicyConfigurationPage({ canManage, csrfToken }: Readonly<{ canManage: boolean; csrfToken: string }>): React.JSX.Element {
  const [policy, setPolicy] = useState<CatalogFieldPolicyResponse | null>(null);
  const [draft, setDraft] = useState<CatalogFieldPolicyResponse['fieldLevels'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const load = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const next = await getCatalogFieldPolicy();
      setPolicy(next);
      setDraft(next.fieldLevels);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const dirty = useMemo(() => Boolean(policy && draft && policy.registry.some((field) => draft[field.key] !== policy.fieldLevels[field.key])), [draft, policy]);
  const fixedFields = useMemo(() => policy?.registry.filter((field) => field.domainFixed) ?? [], [policy]);
  const configurableFields = useMemo(() => policy?.registry.filter((field) => !field.domainFixed && field.allowedLevels.length > 1) ?? [], [policy]);

  const apply = (next: CatalogFieldPolicyResponse, message: string): void => {
    setPolicy(next);
    setDraft(next.fieldLevels);
    setNotice(message);
    setError(null);
    setConfirmRestore(false);
  };

  const change = (key: keyof CatalogFieldPolicyResponse['fieldLevels'], value: CatalogFieldPolicyLevel): void => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setNotice(null);
  };

  const save = async (): Promise<void> => {
    if (!policy || !draft || !dirty || !canManage) return;
    setBusy(true);
    try {
      apply(await updateCatalogFieldPolicy({ expectedVersion: policy.policyVersion, fieldLevels: draft }, csrfToken), 'Configuración guardada como una nueva versión.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const restore = async (): Promise<void> => {
    if (!policy || !canManage) return;
    setBusy(true);
    try {
      apply(await restoreCatalogFieldPolicyDefaults(policy.policyVersion, csrfToken), 'Valores predeterminados restaurados como una nueva versión. El historial se conserva.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  return <div className={styles.page}>
    <ButtonLink to="/configuracion" tone="quiet" size="compact" className={styles.backLink}><ArrowLeft size={16} aria-hidden="true" />Volver a Configuración</ButtonLink>
    <div className={styles.headingRow}>
      <PageHeader eyebrow="Configuración · Catálogos · Lista de precios" title="Campos de carga masiva" description="Define qué información debe exigir tu catálogo y qué campos quieres ver normalmente durante una carga." />
      {policy ? <div className={styles.policyMeta} aria-label="Estado de configuración">
        <span className={styles.metaIcon}><SlidersHorizontal size={17} aria-hidden="true" /></span>
        <span><strong>{sourceLabel(policy)}</strong><small>Configuración de este tenant</small></span>
        <b>v{policy.policyVersion} · {dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'}</b>
        {!canManage ? <em>Sólo lectura</em> : null}
      </div> : null}
    </div>

    <section className={styles.explainer} aria-labelledby="policy-help-title">
      <h2 id="policy-help-title">Cómo se interpreta cada estado</h2>
      <dl>
        <div><dt>Obligatorio</dt><dd>Debe existir un valor efectivo antes de procesar una carga.</dd></div>
        <div><dt>Esencial</dt><dd>Se mostrará normalmente durante la carga, pero puede quedar vacío.</dd></div>
        <div><dt>Opcional</dt><dd>Disponible cuando lo necesites.</dd></div>
      </dl>
    </section>

    {error ? <Alert tone="danger" title="No fue posible completar la operación"><p>{error}</p>{policy ? <Button tone="secondary" size="compact" disabled={busy} onClick={() => { void load(); }}>Recargar valores actuales</Button> : null}</Alert> : null}
    {notice ? <Alert tone="success" title="Configuración actualizada">{notice}</Alert> : null}
    {!policy || !draft ? <p className={styles.loading} role="status">{busy ? 'Cargando configuración de campos…' : 'No fue posible cargar la configuración.'}</p> : <>
      <section className={styles.settings} aria-labelledby="field-policy-title">
        <header>
          <div><h2 id="field-policy-title">Política de campos</h2><p>Los cambios se guardan explícitamente y se aplican al revisar y aplicar cargas posteriores.</p></div>
          <span className={dirty ? styles.dirty : styles.saved} role="status" aria-live="polite">{dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'}</span>
        </header>
        <div className={styles.columnHeaders} aria-hidden="true"><span>Campo</span><span>Política</span><span>Estado</span></div>
        <div className={styles.fieldList}>
          {fixedFields.map((field) => <div className={styles.fieldRow} key={field.key}>
            <div><strong>{field.label}</strong><small>Protegido por reglas de producto</small></div>
            <span className={styles.level}>{labels[draft[field.key]]}</span>
            <span className={styles.fixedBadge}>Fijo</span>
          </div>)}
          {configurableFields.map((field) => <div className={styles.fieldRow} key={field.key}>
            <label htmlFor={`catalog-field-policy-${field.key}`}><strong>{field.label}</strong><small>{field.referenceCostSensitive ? 'Visible sólo con autoridad de costo de referencia.' : 'Puedes ajustar su política para este tenant.'}</small></label>
            <select
              id={`catalog-field-policy-${field.key}`}
              value={draft[field.key]}
              disabled={!canManage || busy}
              aria-label={`Política para ${field.label}`}
              onChange={(event) => change(field.key, event.target.value as CatalogFieldPolicyLevel)}
            >
              {field.allowedLevels.map((level) => <option key={level} value={level}>{labels[level]}</option>)}
            </select>
            <span className={styles.configurableBadge}>Configurable</span>
          </div>)}
        </div>
      </section>
      {canManage ? <div className={styles.actions}>
        <span className={dirty ? styles.dirty : styles.saved} role="status" aria-live="polite">{dirty ? 'Cambios sin guardar' : 'Todo guardado'}</span>
        <div>
          <Button tone="quiet" size="compact" disabled={busy || !dirty} onClick={() => { setDraft(policy.fieldLevels); setNotice(null); setError(null); }}>Descartar cambios</Button>
          <Button size="compact" disabled={busy} data-restore-catalog-policy-trigger="true" onClick={() => setConfirmRestore(true)}><RotateCcw size={15} aria-hidden="true" />Restaurar</Button>
          <Button tone="primary" size="compact" disabled={busy || !dirty} onClick={() => { void save(); }}><Save size={15} aria-hidden="true" />{busy ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div> : <p className={styles.readOnly}>Tu sesión puede consultar esta política, pero no modificarla.</p>}
      <Dialog
        open={confirmRestore}
        title="¿Restaurar valores predeterminados?"
        description="Esta acción crea una nueva versión de la configuración del tenant. No elimina el historial."
        restoreFocusSelector='[data-restore-catalog-policy-trigger="true"]'
        footer={<><Button disabled={busy} onClick={() => setConfirmRestore(false)}>Cancelar</Button><Button tone="primary" disabled={busy} onClick={() => { void restore(); }}><RotateCcw size={16} aria-hidden="true" />{busy ? 'Restaurando…' : 'Restaurar valores'}</Button></>}
        onClose={() => { if (!busy) setConfirmRestore(false); }}
      ><p className={styles.confirmCopy}>Se restaurará la política inicial de SR Taller; el historial de cambios se conserva.</p></Dialog>
    </>}
  </div>;
}
