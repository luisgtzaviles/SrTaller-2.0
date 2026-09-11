import { Plus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { getIntakeProblemCategories } from '../api.js';
import type { RepairProblemCategory } from '../api.js';
import { compactInputWhitespace, normalizeInputLookupKey, normalizeNewRepairInput } from '../../../../src/modules/repairs/domain/new-repair-input-normalization.js';
import { Button, Input } from './ui/controls.js';
import { autocompleteInputProps, SearchAutocomplete } from './ui/SearchAutocomplete.js';
import type { SearchAutocompleteStatus } from './ui/SearchAutocomplete.js';
import styles from './reported-problems-input.module.css';

export interface ReportedProblemValue { readonly label: string; readonly categoryId: string | null; }

function normalized(value: string): string { return normalizeInputLookupKey(value); }

export function ReportedProblemsInput({ id, value, error, describedBy, onChange }: Readonly<{ id: string; value: readonly ReportedProblemValue[]; error?: string | undefined; describedBy?: string | undefined; onChange(value: readonly ReportedProblemValue[]): void }>): React.JSX.Element {
  const prefix = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<readonly RepairProblemCategory[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [state, setState] = useState<'idle' | 'loading' | 'empty' | 'error' | 'duplicate'>('idle');
  const [lookupFocused, setLookupFocused] = useState(false);
  const [retry, setRetry] = useState(0);
  const term = normalized(query);

  useEffect(() => {
    if (term.length < 1) { setOptions([]); setActiveIndex(-1); setState('idle'); return undefined; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState('loading');
      void getIntakeProblemCategories(controller.signal).then((response) => {
        const selected = new Set(value.map((item) => normalized(item.label)));
        const matches = response.items.filter((item) => normalized(item.label).includes(term) && !selected.has(normalized(item.label))).slice(0, 8);
        setOptions(matches); setActiveIndex(matches.length > 0 ? 0 : -1); setState(matches.length > 0 ? 'idle' : 'empty');
      }).catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setOptions([]); setActiveIndex(-1); setState('error');
      });
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [retry, term, value]);

  function add(label: string, categoryId: string | null): void {
    const clean = normalizeNewRepairInput('reportedProblem', label, categoryId ? label : null); const key = normalized(clean);
    if (clean.length < 2 || clean.length > 160 || value.length >= 12) return;
    if (value.some((item) => normalized(item.label) === key)) { setState('duplicate'); return; }
    onChange(Object.freeze([...value, Object.freeze({ label: clean, categoryId })]));
    setQuery(''); setOptions([]); setActiveIndex(-1); setState('idle');
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown' && options.length > 0) { event.preventDefault(); setActiveIndex((current) => current < options.length - 1 ? current + 1 : 0); }
    else if (event.key === 'ArrowUp' && options.length > 0) { event.preventDefault(); setActiveIndex((current) => current > 0 ? current - 1 : options.length - 1); }
    else if (event.key === 'Enter') { event.preventDefault(); const option = activeIndex >= 0 ? options[activeIndex] : undefined; if (option) add(option.label, option.categoryId); else add(query, null); }
  }

  const autocompleteStatus: SearchAutocompleteStatus = state === 'loading'
    ? { kind: 'loading', message: 'Buscando categorías…' }
    : state === 'empty' && term
      ? { kind: 'empty', message: <>Sin coincidencias. Presiona Enter o Agregar para conservar “{normalizeNewRepairInput('reportedProblem', query)}”.</> }
      : state === 'error'
        ? { kind: 'error', message: 'No fue posible consultar el catálogo. Puedes agregar el texto libre.', retryLabel: 'Reintentar', onRetry: () => setRetry((current) => current + 1) }
        : { kind: 'idle' };

  return <div className={styles.root}>
    {value.length > 0 ? <div className={styles.chips} aria-label="Problemas capturados">{value.map((item) => <span key={normalized(item.label)}><span className={styles.chipLabel}>{item.label}</span>{item.categoryId === null ? <span className={styles.pendingBadge}>Por revisar</span> : null}<button type="button" aria-label={`Quitar ${item.label}`} onClick={() => onChange(value.filter((candidate) => normalized(candidate.label) !== normalized(item.label)))}><X size={14} aria-hidden="true" /></button></span>)}</div> : null}
    <div className={styles.entry}>
      <SearchAutocomplete
        listboxId={`${prefix}-reported-problem-options`}
        label="Categorías de problema sugeridas"
        options={options.map((option, index) => ({ id: `${prefix}-reported-problem-option-${index}`, key: option.categoryId, primary: option.label, secondary: option.scope === 'platform' ? 'Plataforma' : 'Organización' }))}
        activeIndex={activeIndex}
        status={autocompleteStatus}
        width="wide"
        focused={lookupFocused}
        onFocusWithinChange={setLookupFocused}
        onActiveIndexChange={setActiveIndex}
        onSelect={(index) => { const option = options[index]; if (option) add(option.label, option.categoryId); }}
        onDismiss={() => { setOptions([]); setActiveIndex(-1); setState('idle'); }}
      >
        <Input ref={inputRef} id={id} value={query} required={value.length === 0} minLength={value.length === 0 ? 2 : undefined} maxLength={160} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} placeholder="Buscar o escribir otro problema..." {...autocompleteInputProps(`${prefix}-reported-problem-options`, lookupFocused && options.length > 0, lookupFocused && activeIndex >= 0 ? `${prefix}-reported-problem-option-${activeIndex}` : undefined)} onChange={(event) => { setQuery(event.target.value); if (state === 'duplicate') setState('idle'); }} onKeyDown={keyDown} />
      </SearchAutocomplete>
      <Button type="button" size="compact" disabled={compactInputWhitespace(query).length < 2 || value.length >= 12} onClick={() => add(query, null)}><Plus size={15} aria-hidden="true" />Agregar</Button>
    </div>
    {state === 'duplicate' ? <div className={styles.feedback} aria-live="polite"><small>Ese problema ya está incluido.</small></div> : null}
    <small className={styles.hint}>{value.length}/12 · El texto libre no bloquea la recepción y queda por revisar.</small>
  </div>;
}
