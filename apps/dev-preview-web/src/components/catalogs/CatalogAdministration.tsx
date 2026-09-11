import { BookOpen, LockKeyhole } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '../ui/controls.js';
import { Alert } from '../ui/feedback.js';
import styles from './catalog-administration.module.css';

export type CatalogLifecycle = 'active' | 'inactive' | 'all';
export type CatalogSurface = 'canonical' | 'pending';

export function CatalogPanel({ labelledBy, children }: Readonly<{
  labelledBy: string;
  children: React.ReactNode;
}>): React.JSX.Element {
  return <section className={styles.panel} aria-labelledby={labelledBy}>{children}</section>;
}

export function CatalogHeader({
  id,
  title,
  description,
  metadata,
  action,
  canManage,
  icon: Icon = BookOpen,
}: Readonly<{
  id: string;
  title: string;
  description: string;
  metadata?: React.ReactNode;
  action?: React.ReactNode;
  canManage: boolean;
  icon?: LucideIcon;
}>): React.JSX.Element {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <span className={styles.icon}><Icon size={18} aria-hidden="true" /></span>
        <div className={styles.headingCopy}>
          <h2 id={id}>{title}</h2>
          <div className={styles.metadata}><span>{description}</span>{metadata}</div>
        </div>
      </div>
      {canManage ? action : <span className={styles.readOnly}><LockKeyhole size={14} aria-hidden="true" />Sólo lectura</span>}
    </header>
  );
}

export function CatalogReconciliationSummary({
  canonicalCount,
  pendingCount,
  value,
  onChange,
}: Readonly<{
  canonicalCount: number;
  pendingCount: number;
  value: CatalogSurface;
  onChange(value: CatalogSurface): void;
}>): React.JSX.Element {
  const canonicalLabel = `${canonicalCount} ${canonicalCount === 1 ? 'canónica' : 'canónicas'}`;
  if (pendingCount === 0 && value === 'canonical') return <span className={styles.reconciliationSummary}>{canonicalLabel}</span>;
  return (
    <span className={styles.reconciliationSummary} role="group" aria-label="Vista del catálogo">
      <button type="button" aria-pressed={value === 'canonical'} onClick={() => onChange('canonical')}>{canonicalLabel}</button>
      {pendingCount > 0 ? <><span aria-hidden="true">·</span>
        <button type="button" aria-pressed={value === 'pending'} onClick={() => onChange('pending')}>{pendingCount} por revisar</button></> : null}
    </span>
  );
}

export function CatalogToolbar({ contextualFilter, lifecycleFilter, result }: Readonly<{
  contextualFilter?: React.ReactNode;
  lifecycleFilter?: React.ReactNode;
  result?: React.ReactNode;
}>): React.JSX.Element {
  return (
    <div className={styles.toolbar}>
      {contextualFilter ? <div className={styles.contextualFilter}>{contextualFilter}</div> : null}
      <div className={styles.toolbarEnd}>{lifecycleFilter}{result ? <span className={styles.result} aria-live="polite">{result}</span> : null}</div>
    </div>
  );
}

export function CatalogLifecycleFilter({
  value,
  activeCount,
  inactiveCount,
  onChange,
  label,
}: Readonly<{
  value: CatalogLifecycle;
  activeCount: number;
  inactiveCount: number;
  onChange(value: CatalogLifecycle): void;
  label: string;
}>): React.JSX.Element {
  const options = [
    { value: 'active', label: 'Activos', count: activeCount },
    { value: 'inactive', label: 'Inactivos', count: inactiveCount },
    { value: 'all', label: 'Todos', count: activeCount + inactiveCount },
  ] as const;
  return (
    <div className={styles.lifecycleFilter} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}<span>{option.count}</span>
        </button>
      ))}
    </div>
  );
}

export function CatalogFeedback({ error, success, successTitle = 'Catálogo actualizado' }: Readonly<{
  error: string | null;
  success: string | null;
  successTitle?: string;
}>): React.JSX.Element | null {
  if (!error && !success) return null;
  return (
    <div className={styles.feedback}>
      {error ? <Alert tone="danger" title="No fue posible completar la operación">{error}</Alert> : null}
      {success ? <Alert tone="success" title={successTitle}>{success}</Alert> : null}
    </div>
  );
}

export function CatalogTable({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <div className={styles.tableShell}><table>{children}</table></div>;
}

export function CatalogLoadingState({ label = 'Cargando catálogo…' }: Readonly<{ label?: string }>): React.JSX.Element {
  return <p className={styles.state} role="status">{label}</p>;
}

export function CatalogEmptyState({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <p className={styles.state}>{children}</p>;
}

export function CatalogEmptyRow({ colSpan, children }: Readonly<{ colSpan: number; children: React.ReactNode }>): React.JSX.Element {
  return <tr><td colSpan={colSpan} className={styles.emptyRow}>{children}</td></tr>;
}

export function CatalogEntityName({ label, secondary }: Readonly<{ label: string; secondary?: string }>): React.JSX.Element {
  return <><strong className={styles.entityLabel}>{label}</strong>{secondary ? <small className={styles.entityMeta}>{secondary}</small> : null}</>;
}

export function CatalogScopeBadge({ scope }: Readonly<{ scope: 'platform' | 'tenant' }>): React.JSX.Element {
  return <span className={scope === 'platform' ? styles.platformBadge : styles.tenantBadge}>{scope === 'platform' ? 'Plataforma' : 'Organización'}</span>;
}

export function CatalogStatusBadge({ status }: Readonly<{ status: 'active' | 'inactive' }>): React.JSX.Element {
  return <span className={status === 'active' ? styles.activeBadge : styles.inactiveBadge}>{status === 'active' ? 'Activo' : 'Inactivo'}</span>;
}

export function CatalogUsage({ count }: Readonly<{ count: number }>): React.JSX.Element {
  return <>{count} {count === 1 ? 'reparación' : 'reparaciones'}</>;
}

export function formatCatalogResultCount(count: number): string {
  return `${count} ${count === 1 ? 'resultado' : 'resultados'}`;
}

export type CatalogRowAction = Readonly<{
  key: string;
  label: string;
  onClick(): void;
  icon?: LucideIcon | undefined;
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger' | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
}>;

export function CatalogRowActions({ actions, emptyLabel }: Readonly<{
  actions: readonly CatalogRowAction[];
  emptyLabel: string;
}>): React.JSX.Element {
  if (actions.length === 0) return <span className={styles.readOnly}>{emptyLabel}</span>;
  return (
    <div className={styles.rowActions}>
      {actions.map(({ key, label, onClick, icon: Icon, tone = 'quiet', id, disabled }) => (
        <Button key={key} id={id} size="compact" tone={tone} disabled={disabled} onClick={onClick}>
          {Icon ? <Icon size={14} aria-hidden="true" /> : null}{label}
        </Button>
      ))}
    </div>
  );
}

export { styles as catalogAdministrationStyles };
