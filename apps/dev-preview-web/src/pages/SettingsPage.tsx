import { Check, Moon, RotateCcw, Sparkles, UserCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { BRAND_DEFAULT, normalizeHex } from '../foundation/accent.mjs';
import { useTheme } from '../foundation/theme.js';
import { Button, Field, Input } from '../components/ui/controls.js';
import { ButtonLink } from '../components/ui/controls.js';
import { PageHeader } from '../components/ui/navigation.js';
import { classNames } from '../components/ui/class-names.js';
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

export function SettingsPage(): React.JSX.Element {
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
          <p>Administra usuarios operativos y consulta roles/capabilities locales.</p>
        </header>
        <div className={styles.colorControls}>
          <ButtonLink to="/configuracion/usuarios" tone="primary">Abrir usuarios</ButtonLink>
          <ButtonLink to="/configuracion/roles" tone="secondary">Abrir roles</ButtonLink>
        </div>
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
              <span className={styles.controlLabel}>Presets útiles</span>
              <div className={styles.presetList} role="group" aria-label="Presets de color de marca">
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
              {brandWasAdapted ? <strong>El resolver adaptó este color para mantener el contraste.</strong> : null}
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
              <span className={styles.themeBadge}>{resolvedTheme === 'light' ? 'Light' : 'Dark'}</span>
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
                  <span>Campo con focus</span>
                  <input aria-label="Campo con focus de vista previa" defaultValue="Cliente sintético" />
                </label>
              </div>
            </div>
            <dl className={styles.previewRoleGrid} aria-label="Roles de marca resueltos">
              <div><dt>Input</dt><dd><code>{brand.input}</code></dd></div>
              <div><dt>Base foreground</dt><dd><code>{brand.onBase}</code></dd></div>
              <div><dt>Surface</dt><dd><code>{brand.surface}</code></dd></div>
              <div><dt>Action</dt><dd><code>{brand.action}</code></dd></div>
              <div><dt>Surface foreground</dt><dd><code>{brand.surfaceFocus}</code></dd></div>
              <div><dt>Action foreground</dt><dd><code>{brand.contrast}</code></dd></div>
            </dl>
            <p className={styles.previewNote}>El resolver mantiene fidelidad, contraste y separación de roles para {resolvedTheme}; success, warning, danger e info permanecen independientes.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
