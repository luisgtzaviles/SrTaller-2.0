import { ClipboardList, ShieldCheck, Wrench } from 'lucide-react';

import { ButtonLink } from '../components/ui/controls.js';
import { EmptyState } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import styles from './pages.module.css';

export function DashboardPage(): React.JSX.Element {
  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="Operación sintética"
        title="Inicio"
        description="Foundation visual de SR Taller 2.0. Ninguna métrica o capacidad de negocio se presenta como real."
      />
      <section className={styles.hero}>
        <div>
          <span>Design System & Application Shell V1</span>
          <h2>Una base consistente para el trabajo diario del taller.</h2>
          <p>La foundation demuestra navegación, temas, responsive y estados honestos. Reparaciones sólo opera con el backend local sintético y no representa una capacidad productiva.</p>
        </div>
        <ButtonLink to="/reparaciones/nueva" tone="primary"><Wrench aria-hidden="true" size={20} />Nueva reparación</ButtonLink>
      </section>
      <section className={styles.metrics} aria-label="Resumen sintético no conectado">
        <article><ClipboardList aria-hidden="true" size={24} /><small>Reparaciones</small><strong>—</strong><span>Datos sintéticos locales</span></article>
        <article><Wrench aria-hidden="true" size={24} /><small>En diagnóstico</small><strong>—</strong><span>Sin datos de negocio</span></article>
        <article><ShieldCheck aria-hidden="true" size={24} /><small>Contexto</small><strong>—</strong><span>PBI-024 no integrado</span></article>
      </section>
      <EmptyState
        title="Preview preparado para iterar"
        description="La UI usa fixtures y estados sintéticos; registrar y persistir reparaciones requiere un PBI funcional separado."
      />
    </div>
  );
}
