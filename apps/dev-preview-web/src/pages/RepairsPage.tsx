import { Search, Smartphone, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getPreviewContext, listPreviewRepairs } from '../api.js';
import type { PreviewContext, PreviewRepairRecord } from '../api.js';
import { ButtonLink, Input } from '../components/ui/controls.js';
import { FilterBar, ResponsiveDataList } from '../components/ui/data-display.js';
import type { DataColumn } from '../components/ui/data-display.js';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { RepairStatus, dateTime } from './repair-view.js';
import styles from './pages.module.css';

export function RepairsPage(): React.JSX.Element {
  const [repairs, setRepairs] = useState<readonly PreviewRepairRecord[]>([]);
  const [context, setContext] = useState<PreviewContext | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([listPreviewRepairs(controller.signal), getPreviewContext(controller.signal)])
      .then(([records, operationalContext]) => {
        setRepairs(records);
        setContext(operationalContext);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es-MX');
    return term
      ? repairs.filter((repair) => [repair.folio, repair.customerName, repair.customerPhone, repair.deviceBrand, repair.deviceModel]
        .some((value) => value.toLocaleLowerCase('es-MX').includes(term)))
      : repairs;
  }, [query, repairs]);

  const columns: readonly DataColumn<PreviewRepairRecord>[] = [
    { key: 'folio', header: 'Folio', render: (repair) => <Link className={styles.actionLink} to={`/reparaciones/${repair.id}`}>{repair.folio}</Link> },
    { key: 'customer', header: 'Cliente', render: (repair) => <span className={styles.identity}><strong>{repair.customerName}</strong><small>{repair.customerPhone}</small></span> },
    { key: 'device', header: 'Equipo', render: (repair) => <span className={styles.identity}><strong>{repair.deviceBrand} {repair.deviceModel}</strong><small>{repair.deviceColor ?? 'Color no registrado'}</small></span> },
    { key: 'problem', header: 'Problema', className: styles.problemCell ?? '', render: (repair) => repair.reportedProblem },
    { key: 'status', header: 'Estado', render: (repair) => <RepairStatus status={repair.status} /> },
    { key: 'date', header: 'Fecha', render: (repair) => <span className={styles.tabular}>{dateTime(repair.createdAt)}</span> },
    { key: 'branch', header: 'Sucursal', render: () => context?.branchName ?? 'Sin verificar' },
  ];

  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="Operación"
        title="Reparaciones"
        description="Superficie visual conservada; el backend de Reparaciones todavía no existe."
        primaryAction={<ButtonLink to="/reparaciones/nueva" tone="primary">Nueva reparación</ButtonLink>}
      />
      <section className={styles.dataSurface} aria-busy={loading}>
        <FilterBar summary={<><strong>{filtered.length}</strong> {filtered.length === 1 ? 'registro' : 'registros'}</>}>
          <label className={styles.searchField}>
            <span className="srt-visually-hidden">Buscar reparaciones</span>
            <Search aria-hidden="true" size={20} />
            <Input type="search" placeholder="Buscar por folio, cliente o equipo" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </FilterBar>
        {!failed && loading ? <Skeleton rows={5} /> : null}
        {failed ? <ErrorState compact title="Lista no disponible" description="La API de Reparaciones no está materializada. Este error es esperado y no se sustituye con datos falsamente operativos." /> : null}
        {!failed && !loading && filtered.length === 0 ? (
          <EmptyState compact title={repairs.length === 0 ? 'Aún no hay reparaciones' : 'Sin coincidencias'} description={repairs.length === 0 ? 'No existe una fuente de datos funcional en este Preview.' : 'Prueba con otra búsqueda.'} />
        ) : null}
        {!failed && filtered.length > 0 ? (
          <ResponsiveDataList
            rows={filtered}
            columns={columns}
            rowKey={(repair) => repair.id}
            label="Reparaciones sintéticas"
            renderMobile={(repair) => (
              <div className={styles.mobileEntityCard}>
                <header><Link className={styles.actionLink} to={`/reparaciones/${repair.id}`}>{repair.folio}</Link><RepairStatus status={repair.status} /></header>
                <div><UserRound aria-hidden="true" size={16} /><span><strong>{repair.customerName}</strong><small>{repair.customerPhone}</small></span></div>
                <div><Smartphone aria-hidden="true" size={16} /><span><strong>{repair.deviceBrand} {repair.deviceModel}</strong><small>{repair.reportedProblem}</small></span></div>
                <footer><span>{context?.branchName ?? 'Sucursal sin verificar'}</span><time dateTime={repair.createdAt}>{dateTime(repair.createdAt)}</time></footer>
              </div>
            )}
          />
        ) : null}
      </section>
    </div>
  );
}
