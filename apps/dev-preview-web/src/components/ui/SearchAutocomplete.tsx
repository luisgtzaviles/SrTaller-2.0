import { useLayoutEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { classNames } from './class-names.js';
import styles from './ui.module.css';

export type SearchAutocompleteWidth = 'narrow' | 'default' | 'wide';

export interface SearchAutocompleteOption {
  readonly id: string;
  readonly key: string;
  readonly primary: ReactNode;
  readonly secondary?: ReactNode;
  readonly tertiary?: ReactNode;
  readonly meta?: ReactNode;
  readonly icon?: ReactNode;
  readonly badge?: ReactNode;
  readonly selected?: boolean;
}

export type SearchAutocompleteStatus = Readonly<{
  kind: 'idle' | 'loading' | 'empty' | 'error';
  message?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
}>;

export type SearchAutocompleteInputKind = 'search' | 'telephone';

type FloatingPosition = Readonly<{
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
  placement: 'above' | 'below';
}>;

const FLOATING_WIDTHS: Readonly<Record<SearchAutocompleteWidth, Readonly<{ min: number; max: number }>>> = Object.freeze({
  narrow: Object.freeze({ min: 280, max: 420 }),
  default: Object.freeze({ min: 320, max: 450 }),
  wide: Object.freeze({ min: 420, max: 500 }),
});

function samePosition(current: FloatingPosition | null, next: FloatingPosition): boolean {
  return current?.left === next.left
    && current.top === next.top
    && current.bottom === next.bottom
    && current.width === next.width
    && current.maxHeight === next.maxHeight
    && current.placement === next.placement;
}

export function autocompleteInputProps(
  listboxId: string,
  expanded: boolean,
  activeOptionId?: string,
  inputKind: SearchAutocompleteInputKind = 'search',
): Pick<InputHTMLAttributes<HTMLInputElement>, 'type' | 'autoComplete' | 'role' | 'aria-autocomplete' | 'aria-expanded' | 'aria-controls' | 'aria-activedescendant'> {
  return {
    type: inputKind === 'telephone' ? 'tel' : 'search',
    autoComplete: 'off',
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': expanded,
    'aria-controls': listboxId,
    'aria-activedescendant': activeOptionId,
  };
}

export function SearchAutocomplete({
  children,
  listboxId,
  label,
  options,
  activeIndex,
  status = { kind: 'idle' },
  width = 'default',
  className,
  focused,
  onFocusWithinChange,
  onActiveIndexChange,
  onSelect,
  onDismiss,
}: Readonly<{
  children: ReactNode;
  listboxId: string;
  label: string;
  options: readonly SearchAutocompleteOption[];
  activeIndex: number;
  status?: SearchAutocompleteStatus;
  width?: SearchAutocompleteWidth;
  className?: string | undefined;
  focused: boolean;
  onFocusWithinChange(focused: boolean): void;
  onActiveIndexChange(index: number): void;
  onSelect(index: number): void;
  onDismiss(): void;
}>): React.JSX.Element {
  const optionsVisible = focused && options.length > 0;
  const statusVisible = focused && options.length === 0 && status.kind !== 'idle' && status.message;
  const popoverVisible = Boolean(optionsVisible || statusVisible);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [floatingPosition, setFloatingPosition] = useState<FloatingPosition | null>(null);
  const widthClass = width === 'narrow'
    ? styles.searchAutocompleteNarrow
    : width === 'wide'
      ? styles.searchAutocompleteWide
      : styles.searchAutocompleteDefault;

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!popoverVisible || !anchor) {
      setFloatingPosition(null);
      return undefined;
    }

    const dialog = anchor.closest<HTMLElement>('[role="dialog"]');
    const host = dialog?.querySelector<HTMLElement>('[data-dialog-floating-root="true"]') ?? document.body;
    setPortalHost(host);

    const updatePosition = (): void => {
      const anchorRect = anchor.getBoundingClientRect();
      const dialogRect = dialog?.getBoundingClientRect();
      const viewportPadding = 8;
      const gap = 4;
      const boundary = dialogRect
        ? { left: dialogRect.left + viewportPadding, right: dialogRect.right - viewportPadding, top: dialogRect.top + viewportPadding, bottom: dialogRect.bottom - viewportPadding }
        : { left: viewportPadding, right: window.innerWidth - viewportPadding, top: viewportPadding, bottom: window.innerHeight - viewportPadding };
      const availableWidth = Math.max(1, boundary.right - boundary.left);
      const widthPolicy = FLOATING_WIDTHS[width];
      const popoverWidth = Math.min(availableWidth, widthPolicy.max, Math.max(anchorRect.width, widthPolicy.min));
      const left = Math.max(boundary.left, Math.min(anchorRect.left, boundary.right - popoverWidth));
      const spaceBelow = Math.max(0, boundary.bottom - anchorRect.bottom - gap);
      const spaceAbove = Math.max(0, anchorRect.top - boundary.top - gap);
      const placement = spaceBelow < Math.min(160, spaceAbove) && spaceAbove > spaceBelow ? 'above' : 'below';
      const maxHeight = Math.max(1, Math.min(260, placement === 'above' ? spaceAbove : spaceBelow));
      const next: FloatingPosition = placement === 'above'
        ? { left, bottom: window.innerHeight - anchorRect.top + gap, width: popoverWidth, maxHeight, placement }
        : { left, top: anchorRect.bottom + gap, width: popoverWidth, maxHeight, placement };
      setFloatingPosition((current) => samePosition(current, next) ? current : next);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    document.addEventListener('scroll', updatePosition, true);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updatePosition);
    observer?.observe(anchor);
    if (dialog) observer?.observe(dialog);
    return () => {
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('scroll', updatePosition, true);
      observer?.disconnect();
    };
  }, [popoverVisible, width]);

  const popover = floatingPosition && portalHost ? (
    optionsVisible ? (
      <div ref={popoverRef} id={listboxId} className={styles.searchAutocompletePopover} data-left={floatingPosition.left} data-top={floatingPosition.top} data-bottom={floatingPosition.bottom} data-width={floatingPosition.width} data-max-height={floatingPosition.maxHeight} data-placement={floatingPosition.placement} role="listbox" aria-label={label}>
        {options.map((option, index) => {
          const active = activeIndex === index;
          return (
            <button
              id={option.id}
              key={option.key}
              type="button"
              tabIndex={-1}
              className={styles.searchAutocompleteOption}
              role="option"
              aria-selected={option.selected ?? active}
              data-active={active || undefined}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onActiveIndexChange(index)}
              onClick={() => onSelect(index)}
            >
              {option.icon ? <span className={styles.searchAutocompleteIcon} aria-hidden="true">{option.icon}</span> : null}
              <span className={styles.searchAutocompleteCopy}>
                <span className={styles.searchAutocompletePrimary}>{option.primary}</span>
                {option.secondary ? <span className={styles.searchAutocompleteSecondary}>{option.secondary}</span> : null}
                {option.tertiary ? <span className={styles.searchAutocompleteTertiary}>{option.tertiary}</span> : null}
              </span>
              {option.badge ? <span className={styles.searchAutocompleteBadge}>{option.badge}</span> : null}
              {option.meta ? <span className={styles.searchAutocompleteMeta}>{option.meta}</span> : null}
            </button>
          );
        })}
      </div>
    ) : statusVisible ? (
      <div ref={popoverRef} className={classNames(styles.searchAutocompletePopover, styles.searchAutocompleteStatus, status.kind === 'error' && styles.searchAutocompleteError)} data-left={floatingPosition.left} data-top={floatingPosition.top} data-bottom={floatingPosition.bottom} data-width={floatingPosition.width} data-max-height={floatingPosition.maxHeight} data-placement={floatingPosition.placement} role="status" aria-live="polite">
        <span>{status.message}</span>
        {status.kind === 'error' && status.onRetry ? <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={status.onRetry}>{status.retryLabel ?? 'Reintentar'}</button> : null}
      </div>
    ) : null
  ) : null;

  return (
    <div
      ref={anchorRef}
      className={classNames(styles.searchAutocomplete, widthClass, className)}
      onFocusCapture={() => onFocusWithinChange(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextTarget) && !popoverRef.current?.contains(nextTarget)) onFocusWithinChange(false);
      }}
      onKeyDownCapture={(event) => {
        if (event.key !== 'Escape' || !popoverVisible) return;
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
      }}
    >
      {children}
      {popover && portalHost ? createPortal(popover, portalHost) : null}
    </div>
  );
}
