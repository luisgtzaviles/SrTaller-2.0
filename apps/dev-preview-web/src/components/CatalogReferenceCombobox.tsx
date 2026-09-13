import { Check, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { normalizeCatalogReferenceText } from '../catalog-api.js';
import type { CatalogReference } from '../catalog-api.js';
import { Input } from './ui/controls.js';
import { SearchAutocomplete, autocompleteInputProps } from './ui/SearchAutocomplete.js';

export function CatalogReferenceCombobox({
  id,
  label,
  emptyLabel,
  value,
  references,
  expansionReferences = [],
  expansionLabel,
  disabled = false,
  canCreate,
  onChange,
  onCapture,
  onExpand,
}: Readonly<{
  id: string;
  label: string;
  emptyLabel: string;
  value: string;
  references: readonly CatalogReference[];
  expansionReferences?: readonly CatalogReference[];
  expansionLabel?: string;
  disabled?: boolean;
  canCreate: boolean;
  onChange(id: string): void;
  onCapture(name: string): void;
  onExpand?(name: string): void;
}>): React.JSX.Element {
  const capturedValue = value.startsWith('captured:') ? value.slice('captured:'.length) : '';
  const selected = references.find((reference) => (reference.categoryId ?? reference.brandId) === value);
  const [query, setQuery] = useState(selected?.name ?? capturedValue);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalized = normalizeCatalogReferenceText(query);

  useEffect(() => { setQuery(selected?.name ?? capturedValue); }, [selected?.name, capturedValue]);

  const matches = useMemo(() => references.filter((reference) => !normalized || normalizeCatalogReferenceText(reference.name).includes(normalized)).slice(0, 10), [normalized, references]);
  const exactCompatible = references.find((reference) => normalizeCatalogReferenceText(reference.name) === normalized);
  const exactExpansion = expansionReferences.find((reference) => normalizeCatalogReferenceText(reference.name) === normalized);
  const exact = exactCompatible ?? exactExpansion;
  const exactCompatibleId = exactCompatible?.categoryId ?? exactCompatible?.brandId ?? '';
  const createVisible = canCreate && normalized.length > 0 && !exact;

  useEffect(() => {
    if (normalized && exactCompatibleId && value !== exactCompatibleId) onChange(exactCompatibleId);
    else if (normalized && exactExpansion && normalizeCatalogReferenceText(capturedValue) !== normalized) (onExpand ?? onCapture)(exactExpansion.name);
  }, [capturedValue, exactCompatibleId, exactExpansion, normalized, onCapture, onChange, onExpand, value]);
  const options = [
    ...matches.map((reference) => ({
      id: `${id}-option-${reference.categoryId ?? reference.brandId}`,
      key: reference.categoryId ?? reference.brandId ?? reference.name,
      primary: reference.name,
      icon: (reference.categoryId ?? reference.brandId) === value ? <Check size={16} /> : undefined,
      selected: (reference.categoryId ?? reference.brandId) === value,
      reference,
      expansion: false,
    })),
    ...(exactExpansion ? [{ id: `${id}-expand-${exactExpansion.categoryId ?? exactExpansion.brandId}`, key: `expand-${exactExpansion.categoryId ?? exactExpansion.brandId}`, primary: exactExpansion.name, secondary: expansionLabel ?? 'La referencia existente se habilitará para este Tipo al crear el artículo', icon: capturedValue && normalizeCatalogReferenceText(capturedValue) === normalized ? <Check size={16} /> : undefined, selected: capturedValue.length > 0, reference: exactExpansion, expansion: true }] : []),
    ...(createVisible ? [{ id: `${id}-create`, key: `${id}-create`, primary: `Usar “${query.trim()}”`, secondary: 'Se capturará como valor Por revisar al guardar el artículo', icon: <Plus size={16} />, selected: false, reference: null, expansion: false }] : []),
  ];
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, options.length - 1));
  const listboxId = `${id}-options`;

  async function choose(index: number): Promise<void> {
    const option = options[index];
    if (!option) return;
    if (option.reference && option.expansion) {
      (onExpand ?? onCapture)(option.reference.name);
      setQuery(option.reference.name); setFocused(false); return;
    }
    if (option.reference) {
      onChange(option.reference.categoryId ?? option.reference.brandId ?? '');
      setQuery(option.reference.name); setFocused(false); return;
    }
    onCapture(query.trim());
    setQuery(query.trim()); setFocused(false);
  }

  return (
    <SearchAutocomplete
      listboxId={listboxId}
      label={label}
      options={options}
      activeIndex={safeActiveIndex}
      focused={focused}
      status={{ kind: 'empty', message: normalized ? 'No hay coincidencias.' : emptyLabel }}
      onFocusWithinChange={setFocused}
      onActiveIndexChange={setActiveIndex}
      onSelect={(index) => { void choose(index); }}
      onDismiss={() => setFocused(false)}
      width="wide"
    >
      <Input
        id={id}
        value={query}
        disabled={disabled}
        placeholder={disabled ? 'Selecciona primero un Tipo' : emptyLabel}
        {...autocompleteInputProps(listboxId, focused && options.length > 0, options[safeActiveIndex]?.id)}
        onFocus={() => setFocused(true)}
        onChange={(event) => {
          setQuery(event.target.value); setActiveIndex(0);
          if (!selected || normalizeCatalogReferenceText(event.target.value) !== normalizeCatalogReferenceText(selected.name)) onChange('');
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && options.length > 0) { event.preventDefault(); setFocused(true); setActiveIndex((current) => (current + 1) % options.length); }
          if (event.key === 'ArrowUp' && options.length > 0) { event.preventDefault(); setFocused(true); setActiveIndex((current) => (current - 1 + options.length) % options.length); }
          if (event.key === 'Enter' && focused && options.length > 0) { event.preventDefault(); void choose(safeActiveIndex); }
        }}
      />
    </SearchAutocomplete>
  );
}
