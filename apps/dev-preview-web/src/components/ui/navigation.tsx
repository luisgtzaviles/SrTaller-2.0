import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { classNames } from './class-names.js';
import styles from './ui.module.css';

export interface BreadcrumbItem {
  readonly label: string;
  readonly to?: string;
}

export function Breadcrumb({ items }: Readonly<{ items: readonly BreadcrumbItem[] }>): React.JSX.Element {
  return (
    <nav aria-label="Ruta de navegación" className={styles.breadcrumb}>
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronRight aria-hidden="true" size={16} /> : null}
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  primaryAction,
  secondaryActions,
  status,
}: Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: readonly BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  status?: React.ReactNode;
}>): React.JSX.Element {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderCopy}>
        {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <div className={styles.titleRow}><h1>{title}</h1>{status}</div>
        {description ? <p>{description}</p> : null}
      </div>
      {primaryAction || secondaryActions ? (
        <div className={classNames(styles.pageActions, Boolean(primaryAction) && styles.hasPrimary)}>
          {secondaryActions}{primaryAction}
        </div>
      ) : null}
    </header>
  );
}
