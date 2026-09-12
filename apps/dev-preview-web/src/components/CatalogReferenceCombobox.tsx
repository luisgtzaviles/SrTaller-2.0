import { Check, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { CatalogReference } from '../catalog-api.js';
import { Input } from './ui/controls.js';
import { SearchAutocomplete, autocompleteInputProps } from './ui/SearchAutocomplete.js';

function key(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX').replace(/\s+/gu, ' ').trim();
}

export function CatalogReferenceCombobox({
  id,
  label,
  emptyLabel,
  value,
  references,
  disabled = false,
  canCreate,
  onChange,
  onCreate,
}: Readonly<{
  id: string;
  label: string;
  emptyLabel: string;
  value: string;
  references: readonly CatalogReference[];
  disabled?: boolean;
  canCreate: boolean;
  onChange(id: string): void;
  onCreate(name: string): Promise<CatalogReference>;
}>): React.JSX.Element {
  const selected = references.find((reference) => (reference.categoryId ?? reference.brandId) === value);
  const [query, setQuery] = useState(selected?.name ?? '');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const normalized = key(query);

  useEffect(() => { setQuery(selected?.name ?? ''); }, [selected?.name]);

  const matches = useMemo(() => references.filter((reference) => !normalized || key(reference.name).includes(normalized)).slice(0, 10), [normalized, references]);
  const exact = references.some((reference) => key(reference.name) === normalized);
  const createVisible = canCreate && normalized.length > 0 && !exact;
  const options = [
    ...matches.map((reference) => ({
      id: `${id}-option-${reference.categoryId ?? reference.brandId}`,
      key: reference.categoryId ?? reference.brandId ?? reference.name,
      primary: reference.name,
      secondary: reference.reviewStatus === 'PENDING' ? 'Disponible durante la operación' : undefined,
      badge: reference.reviewStatus === 'PENDING' ? 'Por revisar' : undefined,
      icon: (reference.categoryId ?? reference.brandId) === value ? <Check size={16} /> : undefined,
      selected: (reference.categoryId ?? reference.brandId) === value,
      reference,
    })),
    ...(createVisible ? [{ id: `${id}-create`, key: `${id}-create`, primary: `Crear “${query.trim()}”`, secondary: 'Se guardará como Por revisar', icon: <Plus size={16} />, selected: false, reference: null }] : []),
  ];
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, options.length - 1));
  const listboxId = `${id}-options`;

  async function choose(index: number): Promise<void> {
    const option = options[index];
    if (!option || creating) return;
    if (option.reference) {
      onChange(option.reference.categoryId ?? option.reference.brandId ?? '');
      setQuery(option.reference.name); setFocused(false); return;
    }
    setCreating(true);
    try {
      const created = await onCreate(query.trim());
      onChange(created.categoryId ?? created.brandId ?? '');
      setQuery(created.name); setFocused(false);
    } finally { setCreating(false); }
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
        disabled={disabled || creating}
        placeholder={disabled ? 'Selecciona primero un Tipo' : emptyLabel}
        {...autocompleteInputProps(listboxId, focused && options.length > 0, options[safeActiveIndex]?.id)}
        onFocus={() => setFocused(true)}
        onChange={(event) => {
          setQuery(event.target.value); setActiveIndex(0);
          if (!selected || key(event.target.value) !== key(selected.name)) onChange('');
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
