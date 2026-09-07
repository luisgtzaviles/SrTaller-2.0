import { ErrorState } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import styles from './pages.module.css';

export function AccessDeniedPage(): React.JSX.Element {
  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="Acceso contextual"
        title="Acceso no autorizado"
        description="Tu sesión operativa no tiene la capacidad requerida para esta superficie."
      />
      <ErrorState
        title="La operación permanece bloqueada"
        description="La visibilidad de la interfaz es informativa; el servidor vuelve a verificar cada solicitud."
        action={{ label: 'Volver al inicio', to: '/' }}
      />
    </div>
  );
}
