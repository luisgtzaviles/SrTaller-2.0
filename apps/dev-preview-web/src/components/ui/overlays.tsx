import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { Button, IconButton } from './controls.js';
import styles from './ui.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const dialogLayers: HTMLElement[] = [];

export function useFocusTrap(
  active: boolean,
  container: React.RefObject<HTMLElement | null>,
  onEscape: () => void,
  restoreFocusSelector?: string,
): void {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active || !container.current) return undefined;
    const root = container.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = (): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent): void => {
      const ownerLayer = root.closest<HTMLElement>('[data-dialog-layer="true"]');
      if (ownerLayer && dialogLayers.at(-1) !== ownerLayer) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      window.requestAnimationFrame(() => {
        const explicitTarget = restoreFocusSelector
          ? Array.from(document.querySelectorAll<HTMLElement>(restoreFocusSelector))
            .find((element) => element.getClientRects().length > 0)
          : null;
        (explicitTarget ?? previous)?.focus();
      });
    };
  }, [active, container, restoreFocusSelector]);
}

export function Dialog({
  open,
  title,
  description,
  children,
  size = 'default',
  variant = 'standard',
  footer,
  restoreFocusSelector,
  onClose,
}: Readonly<{
  open: boolean;
  title: string;
  description: string;
  children?: React.ReactNode;
  size?: 'default' | 'wide' | 'workspace';
  variant?: 'standard' | 'workspace';
  footer?: React.ReactNode | false;
  restoreFocusSelector?: string | undefined;
  onClose(): void;
}>): React.JSX.Element | null {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, dialogRef, onClose, restoreFocusSelector);

  useEffect(() => {
    if (!open || !layerRef.current) return undefined;
    const layer = layerRef.current;
    const previousLayer = dialogLayers.at(-1);
    const root = document.getElementById('root');
    const bodyHadDialogLock = document.body.classList.contains('srt-dialog-open');

    if (previousLayer) previousLayer.inert = true;
    else if (root) root.inert = true;
    dialogLayers.push(layer);
    document.body.classList.add('srt-dialog-open');

    return () => {
      const index = dialogLayers.lastIndexOf(layer);
      if (index >= 0) dialogLayers.splice(index, 1);
      const revealedLayer = dialogLayers.at(-1);
      if (revealedLayer) revealedLayer.inert = false;
      else if (root) root.inert = false;
      if (dialogLayers.length === 0 && !bodyHadDialogLock) document.body.classList.remove('srt-dialog-open');
    };
  }, [open]);

  if (!open) return null;
  const sizeClass = size === 'workspace'
    ? styles.dialogWorkspace
    : size === 'wide'
      ? styles.dialogWide
      : '';
  return createPortal(
    <div
      ref={layerRef}
      className={`${styles.overlay} ${variant === 'workspace' ? styles.overlayWorkspace : ''}`}
      data-dialog-layer="true"
      data-dialog-variant={variant}
    >
      <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
      <div ref={dialogRef} className={`${styles.dialog} ${sizeClass}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
        <header><div><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div><IconButton label="Cerrar diálogo" icon={X} onClick={onClose} /></header>
        <div className={styles.dialogBody}>{children}</div>
        {footer === false ? null : <footer>{footer ?? <Button tone="primary" onClick={onClose}>Entendido</Button>}</footer>}
      </div>
    </div>,
    document.body,
  );
}
