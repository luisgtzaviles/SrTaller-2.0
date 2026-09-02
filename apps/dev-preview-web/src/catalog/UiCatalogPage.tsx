import { CircleCheck, FlaskConical, LogOut, Menu, Moon, Search, Sun, TriangleAlert, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Field, Input, Textarea } from '../components/ui/controls.js';
import { ResponsiveDataList, StatusBadge } from '../components/ui/data-display.js';
import type { DataColumn } from '../components/ui/data-display.js';
import { Alert, EmptyState, ErrorState, Skeleton, Spinner } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { Inline, Stack, Text } from '../components/ui/primitives.js';
import { resolveTenantAccent } from '../foundation/accent.mjs';
import type { TenantBrandResult } from '../foundation/accent.mjs';
import { useTheme } from '../foundation/theme.js';
import type { ThemePreference } from '../foundation/theme.js';
import styles from './ui-catalog.module.css';

interface CatalogRecord {
  readonly id: string;
  readonly label: string;
  readonly device: string;
  readonly state: 'received' | 'ready';
}

const catalogRows: readonly CatalogRecord[] = [
  { id: 'fixture-a', label: 'Fixture A', device: 'Dispositivo sintético', state: 'received' },
  { id: 'fixture-b', label: 'Fixture B', device: 'Equipo de demostración', state: 'ready' },
];

const brandRoles = (result: TenantBrandResult): readonly [string, string][] => [
  ['Brand input', result.input],
  ['Action', result.action],
  ['Action hover', result.actionHover],
  ['Action active', result.actionActive],
  ['Subtle', result.subtle],
  ['Muted', result.muted],
  ['Surface', result.surface],
  ['Surface raised', result.surfaceRaised],
  ['Surface hover', result.surfaceHover],
  ['Surface active', result.surfaceActive],
  ['Border', result.border],
  ['Action foreground', result.contrast],
  ['Focus', result.focus],
  ['Surface foreground', result.surfaceFocus],
];

export default function UiCatalogPage(): React.JSX.Element {
  const { preference, resolvedTheme, brand, setPreference, setSyntheticAccent } = useTheme();
  const [accentInput, setAccentInput] = useState('#B45309');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);

  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex,nofollow,noarchive';
    document.head.append(robots);
    return () => robots.remove();
  }, []);

  const lightPreview = resolveTenantAccent(accentInput, 'light');
  const darkPreview = resolveTenantAccent(accentInput, 'dark');
  const columns: readonly DataColumn<CatalogRecord>[] = [
    { key: 'label', header: 'Entidad', render: (row) => <strong>{row.label}</strong> },
    { key: 'device', header: 'Equipo', render: (row) => row.device },
    { key: 'state', header: 'Estado', render: (row) => <StatusBadge tone={row.state === 'ready' ? 'success' : 'info'}>{row.state === 'ready' ? 'Lista' : 'Recibida'}</StatusBadge> },
  ];

  return (
    <div className={styles.catalog}>
      <PageHeader
        eyebrow="Preview / Internal catalog"
        title="UI Catalog V1"
        description="Catálogo público de Preview con fixtures sintéticos. No es una barrera de seguridad ni una superficie de producto."
      />
      <Alert tone="info" title="Catálogo interno de desarrollo">
        Disponible en Local y Preview; Production debe excluir ruta, enlace y chunks.
      </Alert>

      <section className={styles.section}>
        <header><h2>Surface Hierarchy</h2><p>La misma composición permite comprobar canvas, workspace, surface, raised e input/inset con los tokens del tema activo: <strong>{resolvedTheme}</strong>.</p></header>
        <Inline gap="2">
          {(['light', 'dark'] as const).map((theme: ThemePreference) => <Button key={`surface-${theme}`} aria-pressed={preference === theme} tone={preference === theme ? 'primary' : 'secondary'} onClick={() => setPreference(theme)}>{theme}</Button>)}
        </Inline>
        <div className={styles.surfaceCanvas} aria-label={`Jerarquía de superficies ${resolvedTheme}`}>
          <span>Canvas</span>
          <div className={styles.surfaceWorkspace}>
            <span>Workspace</span>
            <div className={styles.surfacePanel}>
              <span>Surface / data panel</span>
              <div className={styles.surfaceRaised}>
                <span>Raised</span>
                <label className={styles.surfaceInset}>Input / inset<input aria-label="Input de muestra de jerarquía" value="Área interactiva" readOnly /></label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <header><h2>Brand Surface &amp; Chrome</h2><p>Un único color de sucursal deriva una superficie sobria, acciones identificables y chrome translúcido gobernado para Light y Dark. Preferencia persistida: <strong>{preference}</strong>; tema resuelto: <strong>{resolvedTheme}</strong>.</p></header>
        <Inline gap="2">
          {(['light', 'dark'] as const).map((theme: ThemePreference) => <Button key={theme} aria-pressed={preference === theme} tone={preference === theme ? 'primary' : 'secondary'} onClick={() => setPreference(theme)}>{theme}</Button>)}
        </Inline>
        <div className={styles.accentLab}>
          <Field id="catalog-accent" label="Color de marca sintético #RRGGBB" hint="Valores inválidos activan fallback seguro.">
            <Input id="catalog-accent" value={accentInput} onChange={(event) => setAccentInput(event.target.value)} aria-describedby="catalog-accent-description" />
          </Field>
          <Button onClick={() => setSyntheticAccent(accentInput)}>Aplicar color sintético</Button>
          <Button tone="quiet" onClick={() => { setAccentInput('#FFF3B0'); setSyntheticAccent('#FFF3B0'); }}>Probar inseguro</Button>
        </div>
        <div className={styles.brandSample} aria-label="Muestra técnica con los roles de marca activos">
          <div className={styles.brandSampleTopbar}>
            <span className={styles.brandSampleChrome} aria-hidden="true"><Menu size={20} /></span>
            <span className={styles.brandSampleMark}>SR</span>
            <span className={styles.brandSampleIdentity}><strong>SR Taller</strong><small>Identidad sobre brand surface</small></span>
            <span className={styles.brandSampleBadge}>Preview</span>
            <span className={styles.brandSampleTheme} aria-hidden="true"><span className={styles.brandSampleThemeActive}><Sun size={16} /></span><Moon size={16} /></span>
            <span className={styles.brandSampleOperator}><UserCircle aria-hidden="true" size={18} /><span><strong>Operador</strong><small>Identidad ligera</small></span></span>
            <span className={styles.brandSampleLogout} aria-hidden="true"><LogOut size={18} /></span>
          </div>
          <div className={styles.brandSampleBody}>
            <Button tone="primary">Primary action</Button>
            <span className={styles.brandSampleNav}>Active navigation</span>
            <span className={styles.brandSampleFocus}>Focus role</span>
          </div>
        </div>
        <div className={styles.chromeRoleGrid} aria-label="Roles de chrome sobre la superficie de marca">
          <span><i className={styles.chromeDefault} />Chrome</span>
          <span><i className={styles.chromeHover} />Hover</span>
          <span><i className={styles.chromeActive} />Active</span>
          <span><i className={styles.chromeMuted} />Muted text</span>
          <span><i className={styles.chromeBorder} />Boundary</span>
        </div>
        <div className={styles.accentResults}>
          {[lightPreview, darkPreview].map((result) => (
            <article key={result.theme}>
              <header><strong>{result.theme}</strong><StatusBadge tone={result.fallback ? 'warning' : 'success'}>{result.fallback ? `fallback: ${result.reason}` : 'válido'}</StatusBadge></header>
              <p>Input <code>{result.input}</code> · Surface <code>{result.surface}</code> · Action <code>{result.action}</code> · Surface foreground <code>{result.surfaceFocus}</code> · Action foreground <code>{result.contrast}</code></p>
              <dl>{brandRoles(result).map(([role, value]) => <div key={role}><dt>{role}</dt><dd><code>{value}</code></dd></div>)}</dl>
              <p>Contraste action/texto {result.actionContrastRatio.toFixed(2)} · surface/texto {result.surfaceContrastRatio.toFixed(2)} · border/surface {result.borderSurfaceRatio.toFixed(2)}</p>
            </article>
          ))}
        </div>
        <Text tone="muted" size="sm">Marca aplicada: {brand.action}. Success, warning, danger e info conservan tokens semánticos independientes.</Text>
      </section>

      <section className={styles.section}>
        <header><h2>Controles</h2><p>Default, hover/focus interactivos, disabled y loading.</p></header>
        <Inline gap="3">
          <Button tone="primary">Primaria</Button><Button>Secundaria</Button><Button tone="quiet">Quiet</Button><Button tone="danger">Destructiva</Button><Button disabled>Disabled</Button><Button disabled><Spinner label="Procesando" />Loading</Button>
        </Inline>
        <div className={styles.formDemo}>
          <Field id="catalog-default" label="Input default"><Input id="catalog-default" placeholder="Escribe para probar focus" /></Field>
          <Field id="catalog-disabled" label="Input disabled"><Input id="catalog-disabled" disabled value="No editable" readOnly /></Field>
          <Field id="catalog-error" label="Input con error" error="Mensaje asociado al control"><Input id="catalog-error" aria-invalid="true" aria-describedby="catalog-error-description" defaultValue="Valor inválido" /></Field>
          <Field id="catalog-textarea" label="Textarea" fullWidth><Textarea id="catalog-textarea" rows={3} defaultValue="Fixture sintético sin PII." /></Field>
        </div>
      </section>

      <section className={styles.section}>
        <header><h2>Feedback y estados</h2><p>Los estados semánticos no dependen del acento.</p></header>
        <Stack gap="3">
          <Alert tone="success" title="Success"><CircleCheck aria-hidden="true" size={16} /> Estado semántico independiente.</Alert>
          <Alert tone="warning" title="Warning"><TriangleAlert aria-hidden="true" size={16} /> Requiere atención.</Alert>
          <Alert tone="danger" title="Error">Operación no completada.</Alert>
          <Alert tone="info" title="Información">Fixture de catálogo.</Alert>
        </Stack>
        <Inline gap="2"><StatusBadge tone="info">Recibida</StatusBadge><StatusBadge tone="warning">Diagnóstico</StatusBadge><StatusBadge tone="success">Lista</StatusBadge><StatusBadge tone="danger">Cancelada</StatusBadge><StatusBadge>Entregada</StatusBadge></Inline>
        <Skeleton rows={3} />
        <div className={styles.stateGrid}><EmptyState compact title="Estado vacío" description="No hay elementos sintéticos." /><ErrorState compact title="Estado de error" description="La fuente simulada no respondió." /></div>
      </section>

      <section className={styles.section}>
        <header><h2>Data display responsive</h2><p>Table en desktop y MobileEntityCard bajo el breakpoint lg; mismo view model.</p></header>
        <ResponsiveDataList
          rows={catalogRows}
          columns={columns}
          rowKey={(row) => row.id}
          label="Fixtures del catálogo"
          renderMobile={(row) => <div className={styles.catalogCard}><Search aria-hidden="true" size={16} /><span><strong>{row.label}</strong><small>{row.device}</small></span><StatusBadge tone={row.state === 'ready' ? 'success' : 'info'}>{row.state === 'ready' ? 'Lista' : 'Recibida'}</StatusBadge></div>}
        />
      </section>

      <section className={styles.section}>
        <header><h2>Overlay accesible</h2><p>Dialog breve y variante workspace con Escape, focus trap y focus restore.</p></header>
        <Inline gap="2">
          <Button onClick={() => setDialogOpen(true)}><FlaskConical aria-hidden="true" size={20} />Abrir diálogo</Button>
          <Button tone="secondary" onClick={() => setWorkspaceDialogOpen(true)}>Abrir workspace</Button>
        </Inline>
      </section>
      <Dialog open={dialogOpen} title="Diálogo de demostración" description="No ejecuta ninguna operación de negocio." onClose={() => setDialogOpen(false)}>
        <div className={styles.dialogBody}>El foco permanece dentro mientras está abierto y vuelve al activador al cerrar.</div>
      </Dialog>
      <Dialog open={workspaceDialogOpen} title="Workspace de demostración" description="Variante amplia para una tarea concentrada." size="workspace" variant="workspace" onClose={() => setWorkspaceDialogOpen(false)}>
        <div className={styles.dialogBody}>El backdrop se atenúa y se desenfoca sólo para esta variante semántica.</div>
      </Dialog>
    </div>
  );
}
