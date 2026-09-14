import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { CatalogModuleNavigation } from '../components/CatalogModuleNavigation.js';
import { RepairBrandCatalogPanel } from '../components/RepairBrandCatalogPanel.js';
import { RepairDeviceTypeCatalogPanel } from '../components/RepairDeviceTypeCatalogPanel.js';
import { RepairModelCatalogPanel } from '../components/RepairModelCatalogPanel.js';
import { RepairProblemCategoryCatalogPanel } from '../components/RepairProblemCategoryCatalogPanel.js';
import { RepairRiskCatalogPanel } from '../components/RepairRiskCatalogPanel.js';
import { CatalogPriceListReferencesPanel } from '../components/CatalogPriceListReferencesPanel.js';
import { CatalogSectionTabs } from '../components/catalogs/CatalogAdministration.js';
import { ButtonLink } from '../components/ui/controls.js';
import { PageHeader } from '../components/ui/navigation.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import styles from './repair-catalogs-page.module.css';

const futureCatalogs = ['Estados'] as const;
type RepairCatalog = 'risks' | 'device-types' | 'brands' | 'models' | 'categories';
type RepairCatalogTab = RepairCatalog | 'future-statuses';

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

      {activeModule === 'repairs' ? <><CatalogSectionTabs<RepairCatalogTab> value={activeCatalog} label="Catálogos de Reparaciones" onChange={(catalog) => {
        if (catalog !== 'future-statuses') selectCatalog(catalog);
      }} options={[
        { value: 'risks', label: 'Riesgos' },
        { value: 'device-types', label: 'Tipos' },
        { value: 'brands', label: 'Marcas' },
        { value: 'models', label: 'Modelos' },
        { value: 'categories', label: 'Categorías' },
        ...futureCatalogs.map((catalog) => ({ value: 'future-statuses' as const, label: catalog, badge: 'Próximamente', disabled: true })),
      ]} />

      {activeCatalog === 'risks' ? <RepairRiskCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'device-types' ? <RepairDeviceTypeCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'brands' ? <RepairBrandCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'models' ? <RepairModelCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      {activeCatalog === 'categories' ? <RepairProblemCategoryCatalogPanel canManage={canManage} csrfToken={csrfToken} /> : null}
      </> : <CatalogPriceListReferencesPanel csrfToken={csrfToken} />}
    </div>
  );
}
