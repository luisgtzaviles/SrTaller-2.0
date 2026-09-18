import { Building2, Check, Moon, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, UserCircle, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { BRAND_DEFAULT, normalizeHex } from '../foundation/accent.mjs';
import { useTheme } from '../foundation/theme.js';
import { Button, Field, Input } from '../components/ui/controls.js';
import { ButtonLink } from '../components/ui/controls.js';
import { PageHeader } from '../components/ui/navigation.js';
import { classNames } from '../components/ui/class-names.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import styles from './settings-page.module.css';

const BRAND_PRESETS = Object.freeze([
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Índigo', hex: '#4F46E5' },
  { name: 'Violeta', hex: '#7C3AED' },
  { name: 'Verde', hex: '#16A34A' },
  { name: 'Ámbar', hex: '#D97706' },
  { name: 'Naranja', hex: '#EA580C' },
  { name: 'Rojo', hex: '#DC2626' },
] as const);

export function SettingsPage({ operationalCapabilities, administrationCapabilities }: Readonly<{
  operationalCapabilities: readonly OperationalCapability[];
  administrationCapabilities: readonly OperationalCapability[];
}>): React.JSX.Element {
  const { brand, resolvedTheme, syntheticAccent, setSyntheticAccent } = useTheme();
  const defaultInput = BRAND_DEFAULT;
  const sourceInput = syntheticAccent ?? defaultInput;
  const [hexInput, setHexInput] = useState(sourceInput);

  useEffect(() => {
    setHexInput(sourceInput);
  }, [sourceInput]);

  const normalizedInput = normalizeHex(hexInput);
  const colorInputValue = normalizedInput ?? brand.base;
  const hexError = hexInput.length > 0 && !normalizedInput;
  const selectedPreset = useMemo(
    () => BRAND_PRESETS.find((preset) => preset.hex === normalizeHex(sourceInput))?.name ?? null,
    [sourceInput],
  );
  const brandWasAdapted = Boolean(syntheticAccent && brand.fallback);
  const canReadUsers = hasOperationalCapability(administrationCapabilities, 'users.read');
  const canReadRoles = hasOperationalCapability(administrationCapabilities, 'access_matrix.read');
  const canManageUsers = hasOperationalCapability(administrationCapabilities, 'users.manage');
  const canManageRoles = hasOperationalCapability(administrationCapabilities, 'access_matrix.manage');
  const canManageBranch = hasOperationalCapability(administrationCapabilities, 'access_matrix.manage');
  const canReadNewRepairConfiguration = hasOperationalCapability(administrationCapabilities, 'repairs.configuration.read');
  const canManageNewRepairConfiguration = hasOperationalCapability(administrationCapabilities, 'repairs.configuration.manage');
  const canReadRepairCatalogs = hasOperationalCapability(administrationCapabilities, 'repairs.catalogs.read');
  const canManageRepairCatalogs = hasOperationalCapability(administrationCapabilities, 'repairs.catalogs.manage');
  const canManageCommercialCatalogs = hasOperationalCapability(administrationCapabilities, 'catalog.manage');
  const canReadCatalogFieldPolicy = hasOperationalCapability(administrationCapabilities, 'catalog.configuration.read') && hasOperationalCapability(administrationCapabilities, 'catalog.reference_cost.read');
  const canManageCatalogFieldPolicy = hasOperationalCapability(administrationCapabilities, 'catalog.configuration.manage') && hasOperationalCapability(administrationCapabilities, 'catalog.reference_cost.manage');
  const canCreateRepairs = hasOperationalCapability(operationalCapabilities, 'repairs.create');

  const applyInput = (value: string): void => {
    const normalized = normalizeHex(value);
    setHexInput(value.toUpperCase());
    if (normalized) setSyntheticAccent(normalized);
  };

  const restoreDefault = (): void => {
    setSyntheticAccent(null);
    setHexInput(defaultInput);
  };

  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="Configuración general"
        title="Configuración"
        description="Configura la apariencia y preferencias de esta sucursal."
      />

      <section className={styles.appearanceSection} aria-labelledby="administration-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Administración local</span>
          <h2 id="administration-title">Equipo y permisos</h2>
          <p>Consulta las identidades operativas y los permisos disponibles para el equipo.</p>
        </header>
        {canReadUsers || canReadRoles || canManageBranch || canReadNewRepairConfiguration || canReadRepairCatalogs || canManageCommercialCatalogs || canCreateRepairs ? (
          <div className={styles.administrationGrid}>
            {canReadUsers ? (
              <article className={styles.administrationCard}>
                <span className={styles.cardIcon} aria-hidden="true"><UsersRound size={20} /></span>
                <div><h3>Usuarios</h3><p>Identidades operativas, roles, estado de acceso y PIN.</p></div>
                <ButtonLink to="/configuracion/usuarios" tone="primary">{canManageUsers ? 'Administrar usuarios' : 'Consultar usuarios'}</ButtonLink>
              </article>
            ) : null}
            {canReadRoles ? (
              <article className={styles.administrationCard}>
                <span className={styles.cardIcon} aria-hidden="true"><ShieldCheck size={20} /></span>
                <div><h3>Roles y permisos</h3><p>Perfiles reutilizables que determinan qué puede hacer cada persona.</p></div>
                <ButtonLink to="/configuracion/roles" tone="secondary">{canManageRoles ? 'Administrar roles' : 'Consultar roles'}</ButtonLink>
              </article>
            ) : null}
            {canManageBranch ? (
              <article className={styles.administrationCard}>
                <span className={styles.cardIcon} aria-hidden="true"><Building2 size={20} /></span>
                <div><h3>Sucursal</h3><p>Zona horaria usada para presentar la operación local de esta estación.</p></div>
                <ButtonLink to="/configuracion/sucursal" tone="secondary">Configurar sucursal</ButtonLink>
              </article>
            ) : null}
            {canReadRepairCatalogs || canReadNewRepairConfiguration || canManageCommercialCatalogs ? (
              <article className={styles.administrationCard}>
                <span className={styles.cardIcon} aria-hidden="true"><SlidersHorizontal size={20} /></span>
                <div><h3>Catálogos por módulo</h3><p>Gobierno de catálogos de Reparaciones y Lista de precios.</p></div>
                <ButtonLink to={canReadRepairCatalogs ? '/configuracion/catalogos' : canManageCommercialCatalogs ? '/configuracion/catalogos?module=price-list' : '/configuracion/catalogos/nueva-reparacion'} tone="secondary">{canManageRepairCatalogs || canManageNewRepairConfiguration || canManageCommercialCatalogs ? 'Configurar catálogos' : 'Consultar Reparaciones'}</ButtonLink>
              </article>
            ) : null}
            {canReadCatalogFieldPolicy ? (
              <article className={styles.administrationCard}>
                <span className={styles.cardIcon} aria-hidden="true"><SlidersHorizontal size={20} /></span>
                <div><h3>Lista de precios</h3><p>Política tenant-wide de campos para las cargas masivas.</p></div>
                <ButtonLink to="/configuracion/catalogos/lista-de-precios/campos-de-carga" tone="secondary">{canManageCatalogFieldPolicy ? 'Configurar campos' : 'Consultar campos'}</ButtonLink>
              </article>
            ) : null}
            {canCreateRepairs && !canReadRepairCatalogs && !canReadNewRepairConfiguration ? (
              <article className={styles.administrationCard}>
                <span className={styles.cardIcon} aria-hidden="true"><UserCircle size={20} /></span>
                <div><h3>Nueva reparación</h3><p>Elige tu presentación personal para recibir equipos.</p></div>
                <ButtonLink to="/configuracion/catalogos/nueva-reparacion" tone="secondary">Preferencia personal</ButtonLink>
              </article>
            ) : null}
          </div>
        ) : (
          <p className={styles.restrictedCopy}>Tu sesión no tiene acceso a la administración del equipo.</p>
        )}
      </section>

      <section className={styles.appearanceSection} aria-labelledby="appearance-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Apariencia</span>
          <h2 id="appearance-title">Apariencia</h2>
          <p>Explora cómo el color de marca puede acompañar la operación sin alterar los estados del sistema.</p>
        </header>

        <article className={styles.brandCard} aria-labelledby="brand-color-title">
          <div className={styles.cardCopy}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardIcon} aria-hidden="true"><Sparkles size={20} /></span>
              <div>
                <h3 id="brand-color-title">Color de marca</h3>
                <p>Personaliza el color principal utilizado en acciones, navegación y elementos de identidad de esta sucursal.</p>
              </div>
            </div>

            <div className={styles.colorControls}>
              <Field
                id="brand-color-hex"
                label="Código HEX"
                {...(hexError
                  ? { error: 'Escribe un color HEX válido, por ejemplo #2563EB.' }
                  : { hint: 'Usa un valor opaco en formato #RRGGBB.' })}
              >
                <Input
                  id="brand-color-hex"
                  value={hexInput}
                  onChange={(event) => applyInput(event.target.value)}
                  onBlur={() => {
                    if (hexError) setHexInput(sourceInput);
                  }}
                  aria-invalid={hexError || undefined}
                  aria-describedby="brand-color-hex-description"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>

              <Field id="brand-color-picker" label="Selector visual" hint="Elige un color para aplicarlo inmediatamente.">
                <div className={styles.colorPickerRow}>
                  <input
                    id="brand-color-picker"
                    className={styles.colorPicker}
                    type="color"
                    value={colorInputValue}
                    onChange={(event) => applyInput(event.target.value)}
                    aria-label="Elegir color de marca"
                  />
                  <span className={styles.colorSwatch} aria-hidden="true" />
                  <code>{brand.base}</code>
                </div>
              </Field>
            </div>

            <div className={styles.presetBlock}>
              <span className={styles.controlLabel}>Opciones predeterminadas</span>
              <div className={styles.presetList} role="group" aria-label="Opciones predeterminadas de color de marca">
                {BRAND_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.name;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      className={classNames(styles.preset, isSelected && styles.presetSelected)}
                      aria-label={`${preset.name}, ${preset.hex}${isSelected ? ', seleccionado' : ''}`}
                      aria-pressed={isSelected}
                      onClick={() => applyInput(preset.hex)}
                    >
                      <span className={styles.presetDot} aria-hidden="true" />
                      <span>{preset.name}</span>
                      <code>{preset.hex}</code>
                      {isSelected ? <Check size={16} aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.stateNote} role="status" aria-live="polite">
              <span className={styles.stateDot} aria-hidden="true" />
              <span>Guardado automáticamente en este navegador.</span>
              {brandWasAdapted ? <strong>El sistema ajustó este color para mantener el contraste.</strong> : null}
            </div>

            <Button tone="secondary" onClick={restoreDefault}>
              <RotateCcw aria-hidden="true" size={16} />
              Restaurar predeterminado
            </Button>
          </div>

          <div className={styles.previewPanel} aria-labelledby="brand-preview-title">
            <div className={styles.previewHeader}>
              <div>
                <span className={styles.previewEyebrow}>Vista previa</span>
                <h3 id="brand-preview-title">Así se verá en la operación</h3>
              </div>
              <span className={styles.themeBadge}>{resolvedTheme === 'light' ? 'Tema claro' : 'Tema oscuro'}</span>
            </div>
            <div className={styles.previewSurface}>
              <div className={styles.previewTopline}>
                <span className={styles.previewMark} aria-hidden="true">SR</span>
                <span><strong>SR Taller</strong><small>Esta sucursal</small></span>
                <span className={styles.previewChromeGroup} aria-hidden="true">
                  <span className={styles.previewChromeControl}><Moon size={16} /></span>
                  <span className={styles.previewOperator}><UserCircle size={16} />Operador</span>
                </span>
              </div>
              <div className={styles.previewContent}>
                <Button tone="primary" size="compact">Nueva reparación</Button>
                <div className={styles.previewNavItem}>
                  <span className={styles.previewNavDot} aria-hidden="true" />
                  <span>Reparaciones</span>
                </div>
                <label className={styles.previewFocusField}>
                  <span>Campo enfocado</span>
                  <input aria-label="Campo enfocado de vista previa" defaultValue="Cliente sintético" />
                </label>
              </div>
            </div>
            <dl className={styles.previewRoleGrid} aria-label="Roles de marca resueltos">
              <div><dt>Color elegido</dt><dd><code>{brand.input}</code></dd></div>
              <div><dt>Texto principal</dt><dd><code>{brand.onBase}</code></dd></div>
              <div><dt>Superficie</dt><dd><code>{brand.surface}</code></dd></div>
              <div><dt>Acción</dt><dd><code>{brand.action}</code></dd></div>
              <div><dt>Texto sobre superficie</dt><dd><code>{brand.surfaceFocus}</code></dd></div>
              <div><dt>Texto sobre acción</dt><dd><code>{brand.contrast}</code></dd></div>
            </dl>
            <p className={styles.previewNote}>El color conserva fidelidad y contraste en el tema {resolvedTheme === 'light' ? 'claro' : 'oscuro'}; los estados de éxito, advertencia, peligro e información permanecen independientes.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
