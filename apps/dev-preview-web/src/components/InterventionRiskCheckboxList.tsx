import { forwardRef } from 'react';
import { Check } from 'lucide-react';

import type { OperationalRepairRisk } from '../api.js';
import { Button } from './ui/controls.js';
import styles from './intervention-risk-checkbox-list.module.css';

export const InterventionRiskCheckboxList = forwardRef<HTMLFieldSetElement, Readonly<{
  id: string;
  options: readonly OperationalRepairRisk[];
  selectedRiskIds: readonly string[];
  loading: boolean;
  catalogError: string | null;
  selectionError: string | null | undefined;
  onChange(riskIds: readonly string[]): void;
  onRetry(): void;
}>>(function InterventionRiskCheckboxList({
  id,
  options,
  selectedRiskIds,
  loading,
  catalogError,
  selectionError,
  onChange,
  onRetry,
}, ref) {
  const descriptionIds = [`${id}-hint`, selectionError ? `${id}-error` : null].filter(Boolean).join(' ');

  function toggle(riskId: string, checked: boolean): void {
    if (checked) {
      if (!selectedRiskIds.includes(riskId)) onChange(Object.freeze([...selectedRiskIds, riskId]));
      return;
    }
    onChange(Object.freeze(selectedRiskIds.filter((selectedRiskId) => selectedRiskId !== riskId)));
  }

  return (
    <fieldset
      ref={ref}
      id={id}
      className={`${styles.group} ${selectionError ? styles.invalid : ''}`}
      aria-required="true"
      aria-invalid={selectionError ? 'true' : undefined}
      aria-describedby={descriptionIds}
      tabIndex={selectionError ? -1 : undefined}
    >
      <legend>Riesgos aceptados <span aria-hidden="true">*</span></legend>
      {loading ? <p className={styles.state} role="status">Cargando riesgos…</p> : null}
      {!loading && catalogError ? (
        <div className={`${styles.state} ${styles.errorState}`} role="alert">
          <span>{catalogError}</span>
          <Button type="button" size="compact" onClick={onRetry}>Reintentar</Button>
        </div>
      ) : null}
      {!loading && !catalogError && options.length === 0 ? <p className={styles.state}>No hay riesgos disponibles.</p> : null}
      {!loading && !catalogError && options.length > 0 ? (
        <div className={styles.options}>
          {options.map((risk, index) => {
            const checked = selectedRiskIds.includes(risk.riskId);
            const optionId = `${id}-option-${index}`;
            return (
              <label key={risk.riskId} htmlFor={optionId} className={`${styles.option} ${checked ? styles.selected : ''}`} data-selected={checked || undefined}>
                <input id={optionId} type="checkbox" checked={checked} onChange={(event) => toggle(risk.riskId, event.target.checked)} />
                <span className={styles.optionMarker} aria-hidden="true">{checked ? <Check size={12} strokeWidth={3} /> : null}</span>
                <span>{risk.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}
      <p id={`${id}-hint`} className={styles.hint}>Selecciona uno o varios riesgos comunicados y aceptados.</p>
      {selectionError ? <p id={`${id}-error`} className={styles.error} role="alert">{selectionError}</p> : null}
    </fieldset>
  );
});
