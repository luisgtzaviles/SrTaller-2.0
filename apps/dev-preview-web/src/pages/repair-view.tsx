import type { PreviewRepairStatus } from '../api.js';
import { StatusBadge } from '../components/ui/data-display.js';

export const statusLabels: Readonly<Record<PreviewRepairStatus, string>> = {
  received: 'Recibida',
  diagnosing: 'En diagnóstico',
  ready: 'Lista',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

const statusTones: Readonly<Record<PreviewRepairStatus, 'info' | 'warning' | 'success' | 'neutral' | 'danger'>> = {
  received: 'info',
  diagnosing: 'warning',
  ready: 'success',
  delivered: 'neutral',
  cancelled: 'danger',
};

export function RepairStatus({ status }: Readonly<{ status: PreviewRepairStatus }>): React.JSX.Element {
  return <StatusBadge tone={statusTones[status]}>{statusLabels[status]}</StatusBadge>;
}

export function dateTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
