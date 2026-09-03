import { Plus, Printer, Search, Smartphone, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { listRepairs } from '../api.js';
import type {
  CustodyStatusCode,
  RepairStatusCode,
  RepairWorklistItem,
  RepairWorklistQuery,
  RepairWorklistResponse,
} from '../api.js';
import { Button, ButtonLink, IconButton, Input } from '../components/ui/controls.js';
import { FilterBar, ResponsiveDataList, StatusBadge } from '../components/ui/data-display.js';
import type { DataColumn } from '../components/ui/data-display.js';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import styles from './pages.module.css';

const periods = [
  ['today', 'Hoy'],
  ['week', 'Esta semana'],
  ['month', 'Este mes'],
  ['all', 'Desde siempre'],
  ['custom', 'Personalizado'],
] as const;
type Period = typeof periods[number][0];

const statusOptions: readonly Readonly<{ code: RepairStatusCode; label: string }>[] = [
  { code: 'pending', label: 'Pendiente' },
  { code: 'diagnosing', label: 'En diagnóstico' },
  { code: 'awaiting_authorization', label: 'Espera de autorización' },
  { code: 'awaiting_part', label: 'Espera de refacción' },
  { code: 'repairing', label: 'En reparación' },
  { code: 'reviewing', label: 'En revisión' },
  { code: 'ready', label: 'Listo' },
  { code: 'unsuccessful', label: 'No quedó' },
  { code: 'cancelled', label: 'Cancelado' },
  { code: 'delivered', label: 'Entregado' },
];

const custodyOptions: readonly Readonly<{ code: CustodyStatusCode; label: string }>[] = [
  { code: 'active', label: 'En tienda' },
  { code: 'ended', label: 'Entregado' },
];

interface WorklistFilters {
  readonly q: string;
  readonly period: Period;
  readonly from: string;
  readonly to: string;
  readonly status: RepairStatusCode | '';
  readonly technicianId: string;
  readonly unassigned: boolean;
  readonly custody: CustodyStatusCode | '';
  readonly page: number;
  readonly pageSize: number;
}

function parseNumber(value: string | null, fallback: number, maximum?: number): number {
  if (!value || !/^\d+$/u.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) return fallback;
  return parsed;
}

function readFilters(params: URLSearchParams): WorklistFilters {
  const periodValue = params.get('period');
  const hasRange = Boolean(params.get('from') || params.get('to'));
  const period: Period = periodValue === 'today' || periodValue === 'week' || periodValue === 'month' || periodValue === 'custom'
    ? periodValue
    : hasRange
      ? 'custom'
      : 'all';
  return {
    q: params.get('q') ?? '',
    period,
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    status: statusOptions.some((option) => option.code === params.get('status'))
      ? params.get('status') as RepairStatusCode
      : '',
    technicianId: params.get('technicianId') ?? '',
    unassigned: params.get('unassigned') === 'true',
    custody: custodyOptions.some((option) => option.code === params.get('custody'))
      ? params.get('custody') as CustodyStatusCode
      : '',
    page: parseNumber(params.get('page'), 1),
    pageSize: parseNumber(params.get('pageSize'), 25, 50),
  };
}

function apiQuery(filters: WorklistFilters): RepairWorklistQuery {
  return {
    q: filters.q || undefined,
    period: filters.period === 'custom' ? 'all' : filters.period,
    from: filters.from || undefined,
    to: filters.to || undefined,
    status: filters.status || undefined,
    technicianId: filters.technicianId || undefined,
    unassigned: filters.unassigned || undefined,
    custody: filters.custody || undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

function formatReceivedAt(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function statusBadge(item: RepairWorklistItem): React.JSX.Element {
  return <StatusBadge tone={item.repairStatus.tone}>{item.repairStatus.label}</StatusBadge>;
}

function validDateInput(value: string): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function dateRangeError(filters: WorklistFilters): string | null {
  if (filters.period !== 'custom') return null;
  if (filters.from && !validDateInput(filters.from)) return 'La fecha Desde no es válida.';
  if (filters.to && !validDateInput(filters.to)) return 'La fecha Hasta no es válida.';
  if (filters.from && filters.to && filters.from > filters.to) return 'Desde no puede ser posterior a Hasta.';
  return null;
}

export function RepairsPage(): React.JSX.Element {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [queryInput, setQueryInput] = useState(filters.q);
  const [data, setData] = useState<RepairWorklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const initialLocationKey = useRef(location.key);

  useEffect(() => setQueryInput(filters.q), [filters.q]);

  useEffect(() => {
    if (location.key === initialLocationKey.current) return;
    initialLocationKey.current = location.key;
    setRetry((value) => value + 1);
  }, [location.key]);

  const customRangeError = dateRangeError(filters);
  const hasDetailedFilters = Boolean(filters.status || filters.technicianId || filters.unassigned || filters.custody);

  useEffect(() => {
    if (hasDetailedFilters) setDetailsOpen(true);
    else if (!hasDetailedFilters) setDetailsOpen(false);
  }, [hasDetailedFilters]);

  useEffect(() => {
    if (queryInput === filters.q) return undefined;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (queryInput.trim()) next.set('q', queryInput.trim());
      else next.delete('q');
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters.q, queryInput, searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    if (customRangeError) {
      setData(null);
      setFailed(false);
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    setFailed(false);
    void listRepairs(apiQuery(filters), controller.signal)
      .then(setData)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [customRangeError, filters, retry]);

  function updatePeriod(period: Period) {
    const next = new URLSearchParams(searchParams);
    next.set('period', period);
    if (period !== 'custom') {
      next.delete('from');
      next.delete('to');
    }
    next.delete('page');
    setSearchParams(next);
  }

  function updateFilter(key: string, value: string | boolean) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page' && key !== 'pageSize') next.delete('page');
    setSearchParams(next);
  }

  function clearDetailedFilters() {
    const next = new URLSearchParams(searchParams);
    for (const key of ['status', 'technicianId', 'unassigned', 'custody']) next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  function updateTechnicianFilter(value: string) {
    const next = new URLSearchParams(searchParams);
    next.delete('technicianId');
    next.delete('unassigned');
    if (value === '__unassigned__') next.set('unassigned', 'true');
    else if (value) next.set('technicianId', value);
    next.delete('page');
    setSearchParams(next);
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const technicians = data?.facets.technicians ?? [];
  const countReady = Boolean(pagination && !loading && !failed);
  const totalCount = pagination?.totalCount ?? 0;
  const detailLinkState = {
    backgroundLocation: location,
    returnTo: `${location.pathname}${location.search}`,
  };

  const columns: readonly DataColumn<RepairWorklistItem>[] = [
    {
      key: 'folio',
      header: 'Folio / recepción',
      render: (repair) => <span className={styles.identity}><Link className={styles.actionLink} data-repair-detail-trigger={repair.id} state={{ ...detailLinkState, restoreFocusSelector: `[data-repair-detail-trigger="${repair.id}"]` }} to={`/reparaciones/${repair.id}?${searchParams.toString()}`}>{repair.folio}</Link><small className={styles.tabular}>{formatReceivedAt(repair.receivedAt)}</small></span>,
    },
    { key: 'customer', header: 'Cliente', render: (repair) => <span className={styles.identity}><strong>{repair.customer.name}</strong><small>{repair.customer.phone ?? 'Teléfono no registrado'}</small></span> },
    { key: 'device', header: 'Equipo', render: (repair) => <span className={styles.identity}><strong>{repair.device.label}</strong></span> },
    { key: 'issue', header: 'Falla', className: styles.problemCell ?? '', render: (repair) => repair.reportedIssue },
    { key: 'technician', header: 'Técnico', render: (repair) => repair.technician?.displayName ?? 'Sin técnico asignado' },
    { key: 'status', header: 'Estado', render: statusBadge },
    { key: 'custody', header: 'Custodia', render: (repair) => <span className={styles.custodyLabel}>{repair.custody.label}</span> },
  ];

  return (
    <div className={`${styles.pageStack} ${styles.worklistWide}`}>
      <PageHeader
        eyebrow="Operación"
        title="Reparaciones"
        description="Consulta el trabajo recibido en esta sucursal. Los cambios todavía no están disponibles en este slice."
        primaryAction={(
          <div className={styles.worklistHeaderActions}>
            {countReady ? (
              <div className={styles.worklistCount} aria-live="polite">
                <strong>{totalCount}</strong>
                <span>{totalCount === 1 ? 'reparación' : 'reparaciones'}</span>
              </div>
            ) : null}
            <ButtonLink to="/reparaciones/nueva" tone="primary">
              <Plus aria-hidden="true" size={20} />
              Nueva reparación
            </ButtonLink>
            <IconButton
              label="Imprimir lista"
              tooltip="Imprimir lista"
              icon={Printer}
              tone="default"
              onClick={() => window.print()}
            />
          </div>
        )}
      />
      <section className={styles.dataSurface} aria-busy={loading} aria-labelledby="repair-worklist-heading">
        <FilterBar summary={failed ? 'No disponible' : loading ? 'Cargando…' : null}>
          <div className={styles.searchFieldGroup}>
            <span className={styles.filterLabel}>Búsqueda general</span>
            <label className={styles.searchField} htmlFor="repair-worklist-search">
              <span className="srt-visually-hidden">Buscar reparaciones</span>
              <Search aria-hidden="true" size={20} />
              <Input id="repair-worklist-search" type="search" placeholder="Buscar por folio, cliente, teléfono, equipo o falla" value={queryInput} disabled={loading && !data || failed} onChange={(event) => setQueryInput(event.target.value)} />
            </label>
          </div>
        </FilterBar>
        <div className={styles.worklistFilters}>
          <div className={styles.periodGroup} role="group" aria-label="Seleccionar periodo">
            <span className={styles.filterLabel}>Periodo</span>
            <div className={styles.periodOptions}>
              {periods.map(([value, label]) => <button key={value} type="button" className={styles.periodButton} aria-pressed={filters.period === value} onClick={() => updatePeriod(value)}>{label}</button>)}
            </div>
            {filters.period === 'custom' ? (
              <div className={styles.customRange} aria-label="Rango personalizado">
                <label className={styles.filterField} htmlFor="repair-filter-from">Desde<input id="repair-filter-from" type="date" value={filters.from} aria-invalid={customRangeError?.includes('Desde') || undefined} onInput={(event) => updateFilter('from', event.currentTarget.value)} /></label>
                <label className={styles.filterField} htmlFor="repair-filter-to">Hasta<input id="repair-filter-to" type="date" value={filters.to} aria-invalid={customRangeError?.includes('Hasta') || undefined} onInput={(event) => updateFilter('to', event.currentTarget.value)} /></label>
                {customRangeError ? <p className={styles.dateError} role="alert">{customRangeError}</p> : null}
              </div>
            ) : null}
          </div>
          <details className={styles.advancedFilters} data-filtered={hasDetailedFilters || undefined} open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
            <summary>{detailsOpen ? 'Ocultar filtros' : 'Filtros a detalle'}{hasDetailedFilters ? <span className={styles.filterState}>Activos</span> : null}</summary>
            <div className={styles.advancedFilterGrid}>
              <label className={styles.filterField}>Estado<select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">Todos los estados</option>{statusOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label>
              <div className={`${styles.filterField} ${styles.technicianField}`}>
                <label htmlFor="repair-filter-technician">Técnico</label>
                <select id="repair-filter-technician" value={filters.unassigned ? '__unassigned__' : filters.technicianId} onChange={(event) => updateTechnicianFilter(event.target.value)}><option value="">Todos los técnicos</option><option value="__unassigned__">Sin técnico asignado</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.displayName}</option>)}</select>
              </div>
              <label className={styles.filterField}>Custodia<select value={filters.custody} onChange={(event) => updateFilter('custody', event.target.value)}><option value="">Toda la custodia</option>{custodyOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label>
              {hasDetailedFilters ? <Button size="compact" tone="quiet" onClick={clearDetailedFilters}>Limpiar filtros</Button> : null}
            </div>
          </details>
        </div>
        <div className={styles.resultsHeader}>
          <span className={styles.filterLabel}>Resultados</span>
          <h2 id="repair-worklist-heading">Lista de reparaciones</h2>
          <p>Resultados ordenados por recepción más reciente.</p>
        </div>
        {loading && !data ? <Skeleton rows={6} /> : null}
        {failed ? <ErrorState compact title="No se pudo cargar Reparaciones" description="La lectura local no respondió. Revisa el backend y vuelve a intentar." /> : null}
        {!failed && !loading && items.length === 0 ? <EmptyState compact title={data?.unfilteredCount ? 'Sin coincidencias' : 'Aún no hay reparaciones'} description={data?.unfilteredCount ? 'Prueba con otros filtros o limpia la búsqueda.' : 'No existen reparaciones en la sucursal local.'} /> : null}
        {!failed && items.length > 0 ? <ResponsiveDataList rows={items} columns={columns} rowKey={(repair) => repair.id} label="Reparaciones" renderMobile={(repair) => (
          <div className={styles.mobileEntityCard}>
            <header><span className={styles.identity}><Link className={styles.actionLink} data-repair-detail-trigger={repair.id} state={{ ...detailLinkState, restoreFocusSelector: `[data-repair-detail-trigger="${repair.id}"]` }} to={`/reparaciones/${repair.id}?${searchParams.toString()}`}>{repair.folio}</Link><small>{formatReceivedAt(repair.receivedAt)}</small></span>{statusBadge(repair)}</header>
            <div><UserRound aria-hidden="true" size={16} /><span><strong>{repair.customer.name}</strong><small>{repair.customer.phone ?? 'Teléfono no registrado'}</small></span></div>
            <div><Smartphone aria-hidden="true" size={16} /><span><strong>{repair.device.label}</strong><small>{repair.reportedIssue}</small></span></div>
            <div><span aria-hidden="true" /><span><small>Técnico</small><strong>{repair.technician?.displayName ?? 'Sin técnico asignado'}</strong></span></div>
            <footer><span>{repair.custody.label}</span><Link className={styles.actionLink} data-repair-detail-trigger={repair.id} state={{ ...detailLinkState, restoreFocusSelector: `[data-repair-detail-trigger="${repair.id}"]` }} to={`/reparaciones/${repair.id}?${searchParams.toString()}`}>Ver detalle</Link></footer>
          </div>
        )} /> : null}
        {pagination && pagination.totalCount > 0 ? <nav className={styles.pagination} aria-label="Paginación de reparaciones">
          <Button size="compact" tone="secondary" disabled={filters.page <= 1} onClick={() => updateFilter('page', String(Math.max(1, filters.page - 1)))}>Anterior</Button>
          <span aria-live="polite">Página {filters.page}</span>
          <Button size="compact" tone="secondary" disabled={!pagination.hasNextPage} onClick={() => updateFilter('page', String(filters.page + 1))}>Siguiente</Button>
        </nav> : null}
      </section>
      {failed ? <Button tone="secondary" onClick={() => setRetry((value) => value + 1)}>Reintentar lectura</Button> : null}
    </div>
  );
}
