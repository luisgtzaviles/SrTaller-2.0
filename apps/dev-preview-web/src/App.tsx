import { useEffect, useId, useMemo, useState } from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  createPreviewRepair,
  getPreviewContext,
  getPreviewRepair,
  listPreviewRepairs,
  transitionPreviewRepair,
} from './api.js';
import type {
  CreatePreviewRepairRequest,
  PreviewContext,
  PreviewRepairDetail,
  PreviewRepairRecord,
  PreviewRepairStatus,
} from './api.js';

const statusLabels: Readonly<Record<PreviewRepairStatus, string>> = {
  received: 'Recibida',
  diagnosing: 'En diagnóstico',
  ready: 'Lista',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

function dateTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StatusPill({ status }: Readonly<{ status: PreviewRepairStatus }>): React.JSX.Element {
  return <span className={`status-pill status-${status}`}>{statusLabels[status]}</span>;
}

const navigation = [
  { to: '/', label: 'Inicio', icon: '⌂' },
  { to: '/reparaciones', label: 'Reparaciones', icon: '▤' },
  { to: '/reparaciones/nueva', label: 'Nueva reparación', icon: '+' },
] as const;

function PreviewBadge(): React.JSX.Element {
  return <span className="preview-badge">Development preview · Datos sintéticos</span>;
}

function ContextBar(): React.JSX.Element {
  const [context, setContext] = useState<PreviewContext | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getPreviewContext(controller.signal)
      .then((result) => setContext(result))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, []);

  if (failed) {
    return (
      <div className="context-bar context-bar-error" role="status">
        Contexto operativo no disponible. El preview permanece bloqueado.
      </div>
    );
  }

  return (
    <div className="context-bar" aria-live="polite">
      <span><small>Empresa</small>{context?.tenantName ?? 'Verificando…'}</span>
      <span><small>Sucursal</small>{context?.branchName ?? 'Verificando…'}</span>
      <span><small>Estación</small>{context?.stationLabel ?? 'Verificando…'}</span>
      <span><small>Entorno</small>{context?.environment ?? 'Verificando…'}</span>
    </div>
  );
}

function Shell({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const location = useLocation();
  const title = location.pathname === '/'
    ? 'Centro operativo'
    : location.pathname === '/reparaciones/nueva'
      ? 'Nueva reparación'
      : location.pathname.startsWith('/reparaciones/')
        ? 'Detalle de reparación'
        : 'Reparaciones';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="SR Taller 2.0 inicio">
          <span className="brand-mark">SR</span>
          <span><strong>SR Taller</strong><small>2.0</small></span>
        </Link>
        <nav aria-label="Navegación principal">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          Entorno aislado
          <small>Sin datos reales</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div><small>SR Taller 2.0</small><h1>{title}</h1></div>
          <PreviewBadge />
        </header>
        <ContextBar />
        <main>{children}</main>
      </div>
    </div>
  );
}

function Dashboard(): React.JSX.Element {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Visual Slice 0</span>
          <h2>Recepción clara, contexto confiable.</h2>
          <p>Un recorrido mínimo para registrar y seguir reparaciones con alcance aislado por empresa, sucursal y estación.</p>
        </div>
        <Link className="button button-primary" to="/reparaciones/nueva">Nueva reparación</Link>
      </section>
      <section className="metrics-grid" aria-label="Resumen sintético">
        <article><small>Recibidas hoy</small><strong>—</strong><span>Disponible después del primer registro</span></article>
        <article><small>En diagnóstico</small><strong>—</strong><span>Vista previa sin datos de producción</span></article>
        <article><small>Listas para entrega</small><strong>—</strong><span>Contexto operativo verificado</span></article>
      </section>
      <section className="empty-panel">
        <div className="empty-icon">◎</div>
        <h3>El entorno está listo para comenzar</h3>
        <p>Crea la primera reparación sintética para validar el flujo vertical.</p>
      </section>
    </div>
  );
}

function Repairs(): React.JSX.Element {
  const [repairs, setRepairs] = useState<readonly PreviewRepairRecord[]>([]);
  const [context, setContext] = useState<PreviewContext | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      listPreviewRepairs(controller.signal),
      getPreviewContext(controller.signal),
    ])
      .then(([records, operationalContext]) => {
        setRepairs(records);
        setContext(operationalContext);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setFailed(true);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es-MX');
    if (!term) return repairs;
    return repairs.filter((repair) => [
      repair.folio,
      repair.customerName,
      repair.customerPhone,
      repair.deviceBrand,
      repair.deviceModel,
    ].some((value) => value.toLocaleLowerCase('es-MX').includes(term)));
  }, [query, repairs]);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Operación</span><h2>Reparaciones</h2><p>Registros sintéticos del entorno de desarrollo.</p></div>
        <Link className="button button-primary" to="/reparaciones/nueva">+ Nueva reparación</Link>
      </section>
      <section className="table-card" aria-busy={loading}>
        <div className="toolbar"><label>Buscar<input type="search" placeholder="Folio, cliente o equipo" value={query} onChange={(event) => setQuery(event.target.value)} /></label><span>{filtered.length} registros</span></div>
        {failed ? <div className="empty-panel compact"><div className="empty-icon">!</div><h3>No se pudo cargar la lista</h3><p>Actualiza la página para volver a intentarlo.</p></div> : null}
        {!failed && !loading && filtered.length === 0 ? <div className="empty-panel compact"><div className="empty-icon">▤</div><h3>{repairs.length === 0 ? 'Aún no hay reparaciones' : 'Sin coincidencias'}</h3><p>{repairs.length === 0 ? 'Crea el primer registro sintético de este preview.' : 'Prueba con otra búsqueda.'}</p></div> : null}
        {!failed && filtered.length > 0 ? (
          <div className="table-scroll"><table><thead><tr><th>Folio</th><th>Cliente</th><th>Equipo</th><th>Problema</th><th>Estado</th><th>Fecha</th><th>Sucursal</th></tr></thead><tbody>{filtered.map((repair) => (
            <tr key={repair.id}><td><Link className="folio-link" to={`/reparaciones/${repair.id}`}>{repair.folio}</Link></td><td><strong>{repair.customerName}</strong><small>{repair.customerPhone}</small></td><td><strong>{repair.deviceBrand} {repair.deviceModel}</strong><small>{repair.deviceColor ?? 'Color no registrado'}</small></td><td className="problem-cell">{repair.reportedProblem}</td><td><StatusPill status={repair.status} /></td><td>{dateTime(repair.createdAt)}</td><td>{context?.branchName ?? 'Verificando…'}</td></tr>
          ))}</tbody></table></div>
        ) : null}
      </section>
    </div>
  );
}

function Field({ label, children, hint }: Readonly<{ label: string; children: React.ReactNode; hint?: string }>): React.JSX.Element {
  return <label className="field"><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}

function NewRepair(): React.JSX.Element {
  const formId = useId();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const values = new FormData(event.currentTarget);
    const optional = (name: string): string | null => {
      const value = String(values.get(name) ?? '').trim();
      return value || null;
    };
    const request: CreatePreviewRepairRequest = {
      customerName: String(values.get('customerName') ?? '').trim(),
      customerPhone: String(values.get('customerPhone') ?? '').trim(),
      deviceBrand: String(values.get('deviceBrand') ?? '').trim(),
      deviceModel: String(values.get('deviceModel') ?? '').trim(),
      deviceSerial: optional('deviceSerial'),
      deviceColor: optional('deviceColor'),
      reportedProblem: String(values.get('reportedProblem') ?? '').trim(),
      physicalCondition: optional('physicalCondition'),
      notes: optional('notes'),
      estimatedPrice: optional('estimatedPrice') === null
        ? null
        : Number(values.get('estimatedPrice')),
      depositAmount: Number(values.get('depositAmount') ?? 0),
    };
    try {
      const repair = await createPreviewRepair(request);
      await navigate(`/reparaciones/${repair.id}`, { replace: true });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar la reparación.');
      setSaving(false);
    }
  }

  return (
    <div className="page-stack narrow">
      <section className="page-heading">
        <div><span className="eyebrow">Recepción</span><h2>Nueva reparación</h2><p>Captura los datos mínimos para iniciar el seguimiento.</p></div>
        <Link className="button button-quiet" to="/reparaciones">Cancelar</Link>
      </section>
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      <form className="form-card" aria-labelledby={`${formId}-title`} onSubmit={(event) => { void submit(event); }}>
        <div className="form-section"><div><span className="step">1</span><h3 id={`${formId}-title`}>Cliente</h3><p>Datos de contacto para esta recepción.</p></div><div className="form-grid">
          <Field label="Nombre completo"><input name="customerName" required autoComplete="name" placeholder="Cliente de prueba" /></Field>
          <Field label="Teléfono"><input name="customerPhone" required inputMode="tel" autoComplete="tel" placeholder="662 000 0000" /></Field>
        </div></div>
        <div className="form-section"><div><span className="step">2</span><h3>Equipo</h3><p>Identificación del dispositivo recibido.</p></div><div className="form-grid">
          <Field label="Marca"><input name="deviceBrand" required placeholder="Marca" /></Field>
          <Field label="Modelo"><input name="deviceModel" required placeholder="Modelo" /></Field>
          <Field label="IMEI o serie" hint="Opcional"><input name="deviceSerial" placeholder="Identificador sintético" /></Field>
          <Field label="Color" hint="Opcional"><input name="deviceColor" placeholder="Color del equipo" /></Field>
        </div></div>
        <div className="form-section"><div><span className="step">3</span><h3>Recepción</h3><p>Motivo, condición e importes iniciales.</p></div><div className="form-grid">
          <Field label="Problema reportado"><textarea name="reportedProblem" required rows={4} placeholder="Describe el problema reportado" /></Field>
          <Field label="Condición física" hint="Opcional"><textarea name="physicalCondition" rows={3} placeholder="Estado visible del equipo" /></Field>
          <Field label="Observaciones" hint="Opcional"><textarea name="notes" rows={3} placeholder="Accesorios u observaciones" /></Field>
          <Field label="Precio estimado" hint="Monto sintético en MXN"><input name="estimatedPrice" type="number" min="0" step="0.01" placeholder="0.00" /></Field>
          <Field label="Anticipo" hint="Monto sintético en MXN"><input name="depositAmount" type="number" min="0" step="0.01" defaultValue="0.00" /></Field>
        </div></div>
        <div className="form-actions"><span>Los datos de este entorno son descartables.</span><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar reparación'}</button></div>
      </form>
    </div>
  );
}

function RepairDetail(): React.JSX.Element {
  const { id = '' } = useParams();
  const [repair, setRepair] = useState<PreviewRepairDetail | null>(null);
  const [context, setContext] = useState<PreviewContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      getPreviewRepair(id, controller.signal),
      getPreviewContext(controller.signal),
    ])
      .then(([record, operationalContext]) => {
        setRepair(record);
        setContext(operationalContext);
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
          setError(cause instanceof Error ? cause.message : 'No fue posible cargar el detalle.');
        }
      });
    return () => controller.abort();
  }, [id]);

  async function transition(status: PreviewRepairStatus): Promise<void> {
    if (!repair) return;
    setSaving(true);
    setError(null);
    try {
      setRepair(await transitionPreviewRepair(repair, status));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No fue posible actualizar el estado.');
    } finally {
      setSaving(false);
    }
  }

  if (error && !repair) {
    return <div className="empty-panel"><div className="empty-icon">!</div><h2>Detalle no disponible</h2><p>{error}</p><Link className="button button-quiet" to="/reparaciones">Volver a reparaciones</Link></div>;
  }
  if (!repair) {
    return <div className="empty-panel" aria-busy="true"><div className="empty-icon">···</div><h2>Cargando detalle</h2><p>Verificando el alcance operativo.</p></div>;
  }

  const next: Readonly<Record<PreviewRepairStatus, readonly PreviewRepairStatus[]>> = {
    received: ['diagnosing', 'cancelled'],
    diagnosing: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  return (
    <div className="page-stack narrow">
      <section className="page-heading"><div><span className="eyebrow">{repair.folio}</span><h2>{repair.deviceBrand} {repair.deviceModel}</h2><p>{repair.customerName} · recibido {dateTime(repair.createdAt)}</p></div><StatusPill status={repair.status} /></section>
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      <section className="detail-grid">
        <article className="detail-card"><header><h3>Recepción</h3><span>Rev. {repair.revision}</span></header><dl><div><dt>Cliente</dt><dd>{repair.customerName}</dd></div><div><dt>Teléfono</dt><dd>{repair.customerPhone}</dd></div><div><dt>Equipo</dt><dd>{repair.deviceBrand} {repair.deviceModel}</dd></div><div><dt>IMEI o serie</dt><dd>{repair.deviceSerial ?? 'No registrado'}</dd></div><div><dt>Color</dt><dd>{repair.deviceColor ?? 'No registrado'}</dd></div><div className="wide"><dt>Problema reportado</dt><dd>{repair.reportedProblem}</dd></div><div className="wide"><dt>Condición física</dt><dd>{repair.physicalCondition ?? 'No registrada'}</dd></div><div className="wide"><dt>Observaciones</dt><dd>{repair.notes ?? 'Sin observaciones'}</dd></div><div><dt>Precio estimado</dt><dd>{repair.estimatedPrice === null ? 'No registrado' : `$${repair.estimatedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}</dd></div><div><dt>Anticipo sintético</dt><dd>${repair.depositAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</dd></div><div><dt>Empresa</dt><dd>{context?.tenantName ?? 'Verificando…'}</dd></div><div><dt>Sucursal</dt><dd>{context?.branchName ?? 'Verificando…'}</dd></div><div><dt>Estación</dt><dd>{context?.stationLabel ?? 'Verificando…'}</dd></div><div><dt>Actualizada</dt><dd>{dateTime(repair.updatedAt)}</dd></div></dl></article>
        <article className="detail-card"><header><h3>Cambiar estado</h3></header>{next[repair.status].length > 0 ? <div className="status-actions">{next[repair.status].map((status) => <button key={status} className="button button-quiet" type="button" disabled={saving} onClick={() => { void transition(status); }}>{statusLabels[status]}</button>)}</div> : <p className="muted">Este estado es terminal para el alcance de VS0.</p>}</article>
        <article className="detail-card timeline-card"><header><h3>Historial</h3><span>{repair.history.length} eventos</span></header><ol className="timeline">{repair.history.map((event) => <li key={event.id}><span className="timeline-dot" /><div><strong>{statusLabels[event.toStatus]}</strong><small>{dateTime(event.changedAt)} · {event.actorLabel}</small><p>{event.fromStatus ? `${statusLabels[event.fromStatus]} → ${statusLabels[event.toStatus]}` : 'Reparación recibida'}</p></div><b>Rev. {event.resultingRevision}</b></li>)}</ol></article>
      </section>
    </div>
  );
}

export function App(): React.JSX.Element {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reparaciones" element={<Repairs />} />
        <Route path="/reparaciones/nueva" element={<NewRepair />} />
        <Route path="/reparaciones/:id" element={<RepairDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
