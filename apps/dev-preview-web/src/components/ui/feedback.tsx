import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, CircleAlert, Inbox, LoaderCircle } from 'lucide-react';

import { ButtonLink } from './controls.js';
import styles from './ui.module.css';
import { classNames } from './class-names.js';

export function Alert({
  children,
  tone = 'info',
  title,
}: Readonly<{
  children: React.ReactNode;
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
}>): React.JSX.Element {
  const Icon = tone === 'danger' || tone === 'warning' ? AlertTriangle : CircleAlert;
  return (
    <div className={classNames(styles.alert, styles[`alert${tone}`])} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={20} />
      <div>{title ? <strong>{title}</strong> : null}<div>{children}</div></div>
    </div>
  );
}

export function Spinner({ label = 'Cargando' }: Readonly<{ label?: string }>): React.JSX.Element {
  return <span className={styles.spinner} role="status"><LoaderCircle aria-hidden="true" size={20} /><span className="srt-visually-hidden">{label}</span></span>;
}

export function Toast({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <div className={styles.toast} role="status" aria-live="polite"><CheckCircle2 aria-hidden="true" size={18} />{children}</div>;
}

export function Skeleton({ rows = 4 }: Readonly<{ rows?: number }>): React.JSX.Element {
  return (
    <div className={styles.skeleton} role="status" aria-label="Cargando contenido">
      {Array.from({ length: rows }, (_, index) => <span key={index} />)}
    </div>
  );
}

function StatePanel({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: Readonly<{
  icon: LucideIcon;
  title: string;
  description: string;
  action?: Readonly<{ label: string; to: string }>;
  compact?: boolean;
}>): React.JSX.Element {
  return (
    <section className={classNames(styles.statePanel, compact && styles.statePanelCompact)}>
      <span className={styles.stateIcon}><Icon aria-hidden="true" size={24} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <ButtonLink to={action.to}>{action.label}</ButtonLink> : null}
    </section>
  );
}

export function EmptyState(props: Readonly<Omit<React.ComponentProps<typeof StatePanel>, 'icon'>>): React.JSX.Element {
  return <StatePanel icon={Inbox} {...props} />;
}

export function ErrorState(props: Readonly<Omit<React.ComponentProps<typeof StatePanel>, 'icon'>>): React.JSX.Element {
  return <StatePanel icon={CircleAlert} {...props} />;
}
