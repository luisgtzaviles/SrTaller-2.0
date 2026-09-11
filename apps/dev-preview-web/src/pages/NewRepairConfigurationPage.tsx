import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Smartphone,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getAdminNewRepairPolicy, resetNewRepairPolicy, updateNewRepairPolicy } from '../api.js';
import type { NewRepairFieldSection, NewRepairFieldState, NewRepairPolicyResponse } from '../api.js';
import { Button, ButtonLink } from '../components/ui/controls.js';
import { Alert } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { CatalogModuleNavigation } from '../components/CatalogModuleNavigation.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import { useUserPreferences } from '../user-preferences/UserPreferencesProvider.js';
import styles from './new-repair-configuration-page.module.css';

const sections: readonly Readonly<{
  key: NewRepairFieldSection;
  label: string;
  description: string;
  icon: LucideIcon;
}>[] = Object.freeze([
  { key: 'customer', label: 'Cliente', description: 'Identidad y contacto', icon: UserRound },
  { key: 'access', label: 'Acceso', description: 'Tipo de bloqueo', icon: KeyRound },
  { key: 'commitment', label: 'Compromiso', description: 'Tiempo y referencia inicial', icon: CalendarClock },
  { key: 'equipment', label: 'Equipo', description: 'Identificación y estado', icon: Smartphone },
  { key: 'reception', label: 'Recepción', description: 'Motivo y condiciones', icon: ClipboardList },
]);

const sectionClasses: Readonly<Record<NewRepairFieldSection, string>> = Object.freeze({
  customer: styles.customer ?? '',
  equipment: styles.equipment ?? '',
  reception: styles.reception ?? '',
  access: styles.access ?? '',
  commitment: styles.commitment ?? '',
});

const conditionDescriptions: Readonly<Record<string, string>> = Object.freeze({
  otherAccessories: 'Cuando se registran otros accesorios',
  previousRepairId: 'Cuando solicita revisión por garantía',
  deliveredByName: 'Cuando entrega otra persona',
  acceptedInterventionRisks: 'Cuando la reparación requiere aceptar riesgos',
  deposit: 'Requiere Caja',
});

function savedDescription(policy: NewRepairPolicyResponse): string {
  if (policy.source === 'system-default') return 'Usando valores predeterminados';
  return policy.updatedAt
    ? `Guardada ${new Date(policy.updatedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`
    : 'Configuración guardada';
}

export function NewRepairConfigurationPage({ operationalCapabilities, administrationCapabilities, csrfToken }: Readonly<{
  operationalCapabilities: readonly OperationalCapability[];
  administrationCapabilities: readonly OperationalCapability[];
  csrfToken: string;
}>): React.JSX.Element {
  const [policy, setPolicy] = useState<NewRepairPolicyResponse | null>(null);
  const [draft, setDraft] = useState<Readonly<Record<string, NewRepairFieldState>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const preferences = useUserPreferences();
  const canReadBranchPolicy = hasOperationalCapability(administrationCapabilities, 'repairs.configuration.read');
  const canManage = hasOperationalCapability(administrationCapabilities, 'repairs.configuration.manage');
  const canCreateRepairs = hasOperationalCapability(operationalCapabilities, 'repairs.create');

  const load = (): void => {
    if (!canReadBranchPolicy) return;
    setError(null);
    void getAdminNewRepairPolicy().then((next) => {
      setPolicy(next);
      setDraft(next.fieldStates);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No fue posible cargar la política.'));
  };

  useEffect(() => { load(); }, [canReadBranchPolicy]);

  const dirty = useMemo(() => policy !== null && policy.registry.some((field) => draft[field.key] !== policy.fieldStates[field.key]), [draft, policy]);

  const apply = (next: NewRepairPolicyResponse, message: string): void => {
    setPolicy(next);
    setDraft(next.fieldStates);
    setNotice(message);
    setError(null);
    setConfirmReset(false);
  };

  const changeField = (key: string, state: NewRepairFieldState): void => {
    setNotice(null);
    setDraft((current) => ({ ...current, [key]: state }));
  };

  const save = async (): Promise<void> => {
    if (!policy || !dirty || !canManage) return;
    setBusy(true);
    try { apply(await updateNewRepairPolicy(policy.policyVersion, draft, csrfToken), 'Configuración guardada para esta sucursal.'); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'No fue posible guardar la configuración.'); }
    finally { setBusy(false); }
  };

  const reset = async (): Promise<void> => {
    if (!policy || !canManage) return;
    setBusy(true);
    try { apply(await resetNewRepairPolicy(policy.policyVersion, csrfToken), 'Valores predeterminados restaurados como una nueva versión.'); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'No fue posible restaurar los valores.'); }
    finally { setBusy(false); }
  };

  return <div className={styles.page}>
    <ButtonLink to="/configuracion" tone="quiet" size="compact" className={styles.backLink}><ArrowLeft size={16} aria-hidden="true" />Volver a Configuración</ButtonLink>
    <CatalogModuleNavigation
      active="new-repair"
      showCatalogs={hasOperationalCapability(administrationCapabilities, 'repairs.catalogs.read')}
    />
    <div className={styles.headingRow}>
      <PageHeader eyebrow="Configuración · Nueva Reparación" title="Nueva reparación" description="Elige tu experiencia de captura y, si tienes permiso, configura los campos de esta sucursal." />
      {policy ? <div className={styles.policyMeta} aria-label="Versión de la configuración">
        <span className={styles.metaIcon}><SlidersHorizontal size={17} aria-hidden="true" /></span>
        <span><strong>Configuración de esta sucursal</strong><small>{savedDescription(policy)}</small></span>
        <b>v{policy.policyVersion}</b>
        {!canManage ? <em>Sólo lectura</em> : null}
      </div> : null}
    </div>
    <section className={styles.personalPreference} aria-labelledby="personal-new-repair-mode-title">
      <div className={styles.personalPreferenceCopy}>
        <span className={styles.metaIcon}><UserRound size={17} aria-hidden="true" /></span>
        <div>
          <span className={styles.personalEyebrow}>Preferencia personal</span>
          <h2 id="personal-new-repair-mode-title">Presentación de Nueva Reparación</h2>
          <p>Esta selección pertenece a tu usuario y no modifica la configuración de la sucursal.</p>
        </div>
      </div>
      <fieldset className={styles.modeOptions} disabled={preferences.saving}>
        <legend className="srt-visually-hidden">Presentación de Nueva Reparación</legend>
        <label>
          <input
            type="radio"
            name="newRepairFormMode"
            value="classic"
            checked={preferences.mode === 'classic'}
            onChange={() => { void preferences.setMode('classic').catch(() => undefined); }}
          />
          <span><strong>Classic 2.0</strong><small>Captura completa y compacta</small></span>
        </label>
        <label>
          <input
            type="radio"
            name="newRepairFormMode"
            value="guided_v2"
            checked={preferences.mode === 'guided_v2'}
            onChange={() => { void preferences.setMode('guided_v2').catch(() => undefined); }}
          />
          <span><strong>Guided V2</strong><small>Captura guiada paso a paso</small></span>
        </label>
      </fieldset>
      <span className={styles.personalStatus} role="status" aria-live="polite">
        {preferences.saving ? 'Guardando…' : preferences.status === 'ready' ? 'Guardado automáticamente' : 'Classic temporal'}
      </span>
    </section>
    {preferences.message ? <Alert tone={preferences.status === 'fallback' ? 'warning' : 'danger'} title="Preferencia personal">{preferences.message}</Alert> : null}
    {error ? <Alert tone="danger" title="No fue posible completar la operación">{error}</Alert> : null}
    {notice ? <Alert tone="success" title="Configuración actualizada">{notice}</Alert> : null}
    {!canReadBranchPolicy ? <p className={styles.personalOnlyNote}>{canCreateRepairs ? 'Tu sesión puede cambiar esta preferencia personal. La política de campos de la sucursal requiere permiso administrativo.' : 'La política de campos de la sucursal requiere permiso administrativo.'}</p> : !policy ? <p className={styles.loading}>Cargando configuración de la sucursal…</p> : <>
      <div className={styles.sectionHeading}>
        <div><h2>Campos de recepción</h2><p>Marca los datos obligatorios. Los demás serán opcionales.</p></div>
        {canManage ? <span className={dirty ? styles.dirty : styles.saved}>{dirty ? '● Cambios sin guardar' : 'Sin cambios pendientes'}</span> : null}
      </div>
      <div className={styles.dashboard}>
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return <section key={section.key} className={`${styles.section} ${sectionClasses[section.key]}`}>
            <header><span><SectionIcon size={17} aria-hidden="true" /></span><div><h3>{section.label}</h3><p>{section.description}</p></div></header>
            <div className={styles.fields}>
              {policy.registry.filter((field) => field.section === section.key).map((field) => {
                const state = draft[field.key] ?? field.systemDefault;
                const supportsRequired = field.allowedStates.includes('required');
                const supportsOptional = field.allowedStates.includes('optional');
                const canToggleRequired = canManage && field.available && supportsRequired && supportsOptional;
                const canHide = canManage && field.available && field.allowedStates.includes('hidden');
                const hidden = state === 'hidden';
                const condition = conditionDescriptions[field.key] ?? (field.condition ? 'Disponible sólo cuando corresponde' : null);
                return <div key={field.key} className={styles.fieldRow} data-state={state}>
                  <div className={styles.fieldMain}>
                    {canToggleRequired ? <label className={styles.fieldToggle}>
                      <input
                        type="checkbox"
                        checked={!hidden && state === 'required'}
                        disabled={busy || hidden}
                        onChange={(event) => changeField(field.key, event.target.checked ? 'required' : 'optional')}
                      />
                      <span><strong>{field.label}</strong><small>{hidden ? 'Oculto' : state === 'required' ? 'Obligatorio' : 'Opcional'}</small></span>
                    </label> : <div className={styles.fieldLabel}><strong>{field.label}</strong>{condition ? <small>{condition}</small> : null}</div>}
                  </div>
                  <div className={styles.fieldState}>
                    {!field.available ? <span className={`${styles.badge} ${styles.unavailable}`}>No disponible</span>
                      : canToggleRequired && !hidden ? null
                        : state === 'fixed' ? <span className={styles.badge}>Fijo</span>
                          : state === 'conditional' ? <span className={`${styles.badge} ${styles.conditional}`}>Condicional</span>
                            : hidden ? <span className={`${styles.badge} ${styles.hiddenBadge}`}>Oculto</span>
                              : <span className={`${styles.badge} ${styles.optionalBadge}`}>Opcional</span>}
                    {canHide ? <Button
                      size="compact"
                      tone="quiet"
                      className={hidden ? styles.showButton : styles.hideButton}
                      aria-label={hidden ? `Mostrar ${field.label}` : `Ocultar ${field.label}`}
                      title={hidden ? `Mostrar ${field.label}` : `Ocultar ${field.label}`}
                      disabled={busy}
                      onClick={() => changeField(field.key, hidden ? (supportsOptional ? 'optional' : field.systemDefault) : 'hidden')}
                    >{hidden ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}<span>{hidden ? 'Mostrar' : 'Ocultar'}</span></Button> : null}
                  </div>
                </div>;
              })}
            </div>
          </section>;
        })}
      </div>
      {canManage ? <div className={styles.actions}>
        <span className={dirty ? styles.dirty : styles.saved}>{dirty ? '● Cambios sin guardar' : 'Todo guardado'}</span>
        <div>
          <Button tone="quiet" size="compact" disabled={busy || !dirty} onClick={() => { setDraft(policy.fieldStates); setNotice(null); }}>Descartar</Button>
          <Button size="compact" disabled={busy} data-reset-policy-trigger="true" onClick={() => setConfirmReset(true)}><RotateCcw size={15} aria-hidden="true" />Restaurar</Button>
          <Button tone="primary" size="compact" disabled={busy || !dirty} onClick={() => { void save(); }}><Save size={15} aria-hidden="true" />{busy ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div> : null}
      <Dialog
        open={confirmReset}
        title="¿Restaurar valores predeterminados?"
        description="Esta acción es distinta de descartar cambios y crea una nueva versión para esta sucursal."
        restoreFocusSelector='[data-reset-policy-trigger="true"]'
        footer={<><Button disabled={busy} onClick={() => setConfirmReset(false)}>Cancelar</Button><Button tone="primary" disabled={busy} onClick={() => { void reset(); }}><RotateCcw size={16} aria-hidden="true" />{busy ? 'Restaurando…' : 'Restaurar valores'}</Button></>}
        onClose={() => { if (!busy) setConfirmReset(false); }}
      ><p className={styles.confirmCopy}>Se reemplazará la configuración vigente por la política inicial del producto. La operación quedará versionada.</p></Dialog>
    </>}
  </div>;
}
