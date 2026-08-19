import styles from './ui.module.css';
import { classNames } from './class-names.js';

export function StatusBadge({
  children,
  tone = 'neutral',
}: Readonly<{
  children: React.ReactNode;
  tone?: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
}>): React.JSX.Element {
  return <span className={classNames(styles.statusBadge, styles[`status${tone}`])}>{children}</span>;
}

export interface DataColumn<Row> {
  readonly key: string;
  readonly header: string;
  readonly className?: string;
  render(row: Row): React.ReactNode;
}

export function ResponsiveDataList<Row>({
  rows,
  columns,
  rowKey,
  renderMobile,
  label,
}: Readonly<{
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  rowKey(row: Row): string;
  renderMobile(row: Row): React.ReactNode;
  label: string;
}>): React.JSX.Element {
  return (
    <>
      <div className={styles.tableViewport}>
        <table className={styles.table} aria-label={label}>
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={rowKey(row)}>{columns.map((column) => <td key={column.key} className={column.className}>{column.render(row)}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
      <div className={styles.mobileCards} aria-label={`${label}, vista móvil`}>
        {rows.map((row) => <article key={rowKey(row)}>{renderMobile(row)}</article>)}
      </div>
    </>
  );
}

export function FilterBar({ children, summary }: Readonly<{ children: React.ReactNode; summary: React.ReactNode }>): React.JSX.Element {
  return <div className={styles.filterBar}><div>{children}</div><span aria-live="polite">{summary}</span></div>;
}
