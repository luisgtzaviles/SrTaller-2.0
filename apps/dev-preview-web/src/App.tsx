import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ApplicationShell } from './components/shell/ApplicationShell.js';
import { Spinner } from './components/ui/feedback.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { NewRepairPage } from './pages/NewRepairPage.js';
import { RepairDetailPage } from './pages/RepairDetailPage.js';
import { RepairsPage } from './pages/RepairsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const UiCatalogPage = __UI_CATALOG_ENABLED__
  ? lazy(() => import('./catalog/UiCatalogPage.js'))
  : null;

export function App(): React.JSX.Element {
  return (
    <ApplicationShell>
      <Suspense fallback={<Spinner label="Cargando superficie" />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reparaciones" element={<RepairsPage />} />
          <Route path="/reparaciones/nueva" element={<NewRepairPage />} />
          <Route path="/reparaciones/:id" element={<RepairDetailPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          {UiCatalogPage ? <Route path="/__internal/ui-catalog" element={<UiCatalogPage />} /> : null}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ApplicationShell>
  );
}
