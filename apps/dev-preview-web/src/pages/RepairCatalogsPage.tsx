import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { CatalogModuleNavigation } from '../components/CatalogModuleNavigation.js';
import { RepairBrandCatalogPanel } from '../components/RepairBrandCatalogPanel.js';
import { RepairDeviceTypeCatalogPanel } from '../components/RepairDeviceTypeCatalogPanel.js';
import { RepairModelCatalogPanel } from '../components/RepairModelCatalogPanel.js';
import { RepairProblemCategoryCatalogPanel } from '../components/RepairProblemCategoryCatalogPanel.js';
import { RepairRiskCatalogPanel } from '../components/RepairRiskCatalogPanel.js';
import { CatalogPriceListReferencesPanel } from '../components/CatalogPriceListReferencesPanel.js';
import { ButtonLink } from '../components/ui/controls.js';
import { PageHeader } from '../components/ui/navigation.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import styles from './repair-catalogs-page.module.css';

const futureCatalogs = ['Estados'] as const;
type RepairCatalog = 'risks' | 'device-types' | 'brands' | 'models' | 'categories';

function repairCatalogFromSearchParams(searchParams: URLSearchParams): RepairCatalog {
  const catalog = searchParams.get('catalog');
  return catalog === 'device-types' || catalog === 'brands' || catalog === 'models' || catalog === 'categories' ? catalog : 'risks';
}

export function RepairCatalogsPage({ capabilities, csrfToken }: Readonly<{
  capabilities: readonly OperationalCapability[];
  csrfToken: string;
}>): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCatalog = repairCatalogFromSearchParams(searchParams);
  const canManage = hasOperationalCapability(capabilities, 'repairs.catalogs.manage');
  const canReadRepairs = hasOperationalCapability(capabilities, 'repairs.catalogs.read');
  const canManageCommercial = hasOperationalCapability(capabilities, 'catalog.manage');
  const requestedModule = searchParams.get('module');
  const activeModule = (requestedModule === 'price-list' && canManageCommercial) || !canReadRepairs ? 'price-list' : 'repairs';

  const selectCatalog = (catalog: RepairCatalog): void => {
    const next = new URLSearchParams(searchParams);
    if (catalog === 'risks') next.delete('catalog');
    else next.set('catalog', catalog);
    setSearchParams(next, { replace: true });
  };
  const selectModule = (module: 'repairs' | 'price-list'): void => {
    const next = new URLSearchParams();
    if (module === 'price-list') next.set('module', 'price-list');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className={styles.page}>
      <ButtonLink to="/configuracion" tone="quiet" size="compact" className={styles.backLink}><ArrowLeft size={16} aria-hidden="true" />Volver a Configuración</ButtonLink>
      <CatalogModuleNavigation active="catalogs" showNewRepair={canReadRepairs} />
      <div className={styles.headingRow}>
        <PageHeader eyebrow="Catálogos por módulo" title={activeModule === 'repairs' ? 'Reparaciones' : 'Lista de precios'} description={activeModule === 'repairs' ? 'Administra los valores operativos propios del dominio de Reparaciones.' : 'Gobierna categorías y marcas de Catalog sin interrumpir la operación.'} />
        <div className={styles.modulePicker}>
          <span><SlidersHorizontal size={17} aria-hidden="true" /></span>
          <label htmlFor="catalog-module">Módulo</label>
          <select id="catalog-module" value={activeModule} onChange={(event) => selectModule(event.target.value as 'repairs' | 'price-list')}><option value="repairs" disabled={!canReadRepairs}>Reparaciones</option><option value="price-list" disabled={!canManageCommercial}>Lista de precios</option></select>
        </div>
      </div>

      {activeModule === 'repairs' ? <><nav className={styles.catalogTabs} aria-label="Catálogos de Reparaciones">
        <button type="button" aria-current={activeCatalog === 'risks' ? 'page' : undefined} onClick={() => selectCatalog('risks')}>Riesgos</button>
        <button type="button" aria-current={activeCatalog === 'device-types' ? 'page' : undefined} onClick={() => selectCatalog('device-types')}>Tipos</button>
        <button type="button" aria-current={activeCatalog === 'brands' ? 'page' : undefined} onClick={() => selectCatalog('brands')}>Marcas</button>
        <button type="button" aria-current={activeCatalog === 'models' ? 'page' : undefined} onClick={() => selectCatalog('models')}>Modelos</button>
        <button type="button" aria-current={activeCatalog === 'categories' ? 'page' : undefined} onClick={() => selectCatalog('categories')}>Categorías</button>
        {futureCatalogs.map((catalog) => <button type="button" key={catalog} disabled>{catalog}<small>Próximamente</small></button>)}
      </nav>

      {activeCatalog === 'risks' ? <RepairRiskCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'device-types' ? <RepairDeviceTypeCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'brands' ? <RepairBrandCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'models' ? <RepairModelCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'categories' ? <RepairProblemCategoryCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      </> : <CatalogPriceListReferencesPanel csrfToken={csrfToken} />}
    </div>
  );
}
