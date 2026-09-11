import { useEffect, useRef, useState } from 'react';

import { addDevicePatternNode, isDevicePatternValid, MIN_DEVICE_PATTERN_NODES } from '../device-access-pattern.mjs';
import styles from '../pages/pages.module.css';
import { Button } from './ui/controls.js';
import { Dialog } from './ui/overlays.js';

const PATTERN_NODES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

function nodeCoordinates(node: number): Readonly<{ x: number; y: number }> {
  const index = node - 1;
  return { x: (index % 3) * 100 + 50, y: Math.floor(index / 3) * 100 + 50 };
}

export function DevicePatternDialog({
  open,
  savedPattern,
  restoreFocusSelector,
  onCancel,
  onSave,
}: Readonly<{
  open: boolean;
  savedPattern: readonly number[];
  restoreFocusSelector: string;
  onCancel(): void;
  onSave(pattern: readonly number[]): void;
}>): React.JSX.Element {
  const [draftPattern, setDraftPattern] = useState<readonly number[]>(savedPattern);
  const activePointerId = useRef<number | null>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open) setDraftPattern(savedPattern);
  }, [open, savedPattern]);

  useEffect(() => {
    const canvas = lineCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const draw = (): void => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = getComputedStyle(canvas).getPropertyValue('--color-brand-action').trim();
      context.lineWidth = 8;
      context.lineCap = 'round';
      for (let index = 1; index < draftPattern.length; index += 1) {
        const previous = draftPattern[index - 1];
        const node = draftPattern[index];
        if (previous === undefined || node === undefined) continue;
        const start = nodeCoordinates(previous);
        const end = nodeCoordinates(node);
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
      }
    };
    draw();
    const themeObserver = new MutationObserver(draw);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    return () => themeObserver.disconnect();
  }, [draftPattern]);

  function addNode(node: number): void {
    setDraftPattern((current) => addDevicePatternNode(current, node));
  }

  function nodeAtPointer(container: HTMLDivElement, clientX: number, clientY: number): number | null {
    const hit = document.elementFromPoint(clientX, clientY);
    const button = hit?.closest<HTMLButtonElement>('[data-pattern-node]');
    if (!button || !container.contains(button)) return null;
    const node = Number(button.dataset.patternNode);
    return Number.isInteger(node) && node >= 1 && node <= 9 ? node : null;
  }

  function beginPointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.pointerType !== 'mouse') event.preventDefault();
    activePointerId.current = event.pointerId;
    const node = nodeAtPointer(event.currentTarget, event.clientX, event.clientY);
    if (node !== null) addNode(node);
  }

  function movePointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (activePointerId.current !== event.pointerId) return;
    if (event.pointerType !== 'mouse') event.preventDefault();
    const node = nodeAtPointer(event.currentTarget, event.clientX, event.clientY);
    if (node !== null) addNode(node);
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (activePointerId.current === event.pointerId) activePointerId.current = null;
  }

  const valid = isDevicePatternValid(draftPattern);
  const status = draftPattern.length === 0
    ? `Selecciona al menos ${MIN_DEVICE_PATTERN_NODES} nodos.`
    : valid
      ? `Patrón válido · ${draftPattern.length} nodos seleccionados.`
      : `${draftPattern.length} de ${MIN_DEVICE_PATTERN_NODES} nodos mínimos.`;

  return (
    <Dialog
      open={open}
      title="Dibuja tu patrón"
      description="Une al menos 2 nodos distintos. Puedes usar arrastre, clic o teclado."
      restoreFocusSelector={restoreFocusSelector}
      footer={<div className={styles.patternActions}><Button onClick={() => setDraftPattern([])}>Reiniciar</Button><Button onClick={onCancel}>Cancelar</Button><Button tone="primary" disabled={!valid} onClick={() => onSave(draftPattern)}>Guardar</Button></div>}
      onClose={onCancel}
    >
      <div className={styles.patternDialogBody}>
        <div
          className={styles.patternGrid}
          role="group"
          aria-label="Patrón de desbloqueo de 3 por 3"
          onPointerDown={beginPointer}
          onPointerMove={movePointer}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={endPointer}
        >
          <canvas ref={lineCanvasRef} width="300" height="300" aria-hidden="true" />
          {PATTERN_NODES.map((node) => {
            const order = draftPattern.indexOf(node);
            const selected = order >= 0;
            return <button key={node} type="button" data-pattern-node={node} aria-pressed={selected} aria-label={selected ? `Nodo ${node}, posición ${order + 1}` : `Nodo ${node}`} onClick={() => addNode(node)}>{selected ? order + 1 : ''}</button>;
          })}
        </div>
        <p className={styles.patternStatus} aria-live="polite">{status}</p>
        <small>El patrón permanece sólo en memoria mientras este formulario está abierto. No se enviará ni almacenará.</small>
      </div>
    </Dialog>
  );
}
