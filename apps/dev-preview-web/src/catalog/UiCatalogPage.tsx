import { CircleCheck, FlaskConical, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Field, Input, Textarea } from '../components/ui/controls.js';
import { ResponsiveDataList, StatusBadge } from '../components/ui/data-display.js';
import type { DataColumn } from '../components/ui/data-display.js';
import { Alert, EmptyState, ErrorState, Skeleton, Spinner } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { Inline, Stack, Text } from '../components/ui/primitives.js';
import { resolveTenantAccent } from '../foundation/accent.mjs';
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

export default function UiCatalogPage(): React.JSX.Element {
  const { preference, resolvedTheme, accent, setPreference, setSyntheticAccent } = useTheme();
  const [accentInput, setAccentInput] = useState('#B45309');
  const [dialogOpen, setDialogOpen] = useState(false);

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
        <header><h2>Temas y tenant accent</h2><p>Preferencia persistida: <strong>{preference}</strong>; tema resuelto: <strong>{resolvedTheme}</strong>.</p></header>
        <Inline gap="2">
          {(['light', 'dark', 'system'] as const).map((theme: ThemePreference) => <Button key={theme} tone={preference === theme ? 'primary' : 'secondary'} onClick={() => setPreference(theme)}>{theme}</Button>)}
        </Inline>
        <div className={styles.accentLab}>
          <Field id="catalog-accent" label="Acento sintético #RRGGBB" hint="Valores inválidos activan fallback seguro.">
            <Input id="catalog-accent" value={accentInput} onChange={(event) => setAccentInput(event.target.value)} aria-describedby="catalog-accent-description" />
          </Field>
          <Button onClick={() => setSyntheticAccent(accentInput)}>Aplicar acento sintético</Button>
          <Button tone="quiet" onClick={() => { setAccentInput('#FFF3B0'); setSyntheticAccent('#FFF3B0'); }}>Probar inseguro</Button>
        </div>
        <div className={styles.accentResults}>
          {[lightPreview, darkPreview].map((result) => <article key={result.theme}><strong>{result.theme}</strong><code>{result.accent}</code><span>hover {result.hover}</span><span>active {result.active}</span><span>subtle {result.subtle}</span><span>ratios {result.surfaceRatio.toFixed(2)} / {result.contrastRatio.toFixed(2)}</span><StatusBadge tone={result.fallback ? 'warning' : 'success'}>{result.fallback ? `fallback: ${result.reason}` : 'válido'}</StatusBadge></article>)}
        </div>
        <Text tone="muted" size="sm">Acento aplicado: {accent.accent}. Success, warning, danger e info conservan tokens independientes.</Text>
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
        <header><h2>Data display responsive</h2><p>Table en desktop y MobileEntityCard bajo el breakpoint md; mismo view model.</p></header>
        <ResponsiveDataList
          rows={catalogRows}
          columns={columns}
          rowKey={(row) => row.id}
          label="Fixtures del catálogo"
          renderMobile={(row) => <div className={styles.catalogCard}><Search aria-hidden="true" size={16} /><span><strong>{row.label}</strong><small>{row.device}</small></span><StatusBadge tone={row.state === 'ready' ? 'success' : 'info'}>{row.state === 'ready' ? 'Lista' : 'Recibida'}</StatusBadge></div>}
        />
      </section>

      <section className={styles.section}>
        <header><h2>Overlay accesible</h2><p>Dialog breve con Escape, focus trap y focus restore.</p></header>
        <Button onClick={() => setDialogOpen(true)}><FlaskConical aria-hidden="true" size={20} />Abrir diálogo</Button>
      </section>
      <Dialog open={dialogOpen} title="Diálogo de demostración" description="No ejecuta ninguna operación de negocio." onClose={() => setDialogOpen(false)}>
        <div className={styles.dialogBody}>El foco permanece dentro mientras está abierto y vuelve al activador al cerrar.</div>
      </Dialog>
    </div>
  );
}
