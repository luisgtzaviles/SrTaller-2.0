import { Link } from 'react-router-dom';

import styles from './catalog-module-navigation.module.css';

export function CatalogModuleNavigation({ active, showCatalogs = true }: Readonly<{
  active: 'catalogs' | 'new-repair';
  showCatalogs?: boolean;
}>): React.JSX.Element {
  return (
    <nav className={styles.navigation} aria-label="Configuración de Reparaciones">
      {showCatalogs ? <Link to="/configuracion/catalogos" aria-current={active === 'catalogs' ? 'page' : undefined}>Catálogos</Link> : null}
      <Link to="/configuracion/catalogos/nueva-reparacion" aria-current={active === 'new-repair' ? 'page' : undefined}>Nueva reparación</Link>
    </nav>
  );
}
