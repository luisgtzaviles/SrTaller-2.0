import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';

import { ApplicationShell } from './components/shell/ApplicationShell.js';
import { Spinner } from './components/ui/feedback.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { NewRepairPage } from './pages/NewRepairPage.js';
import { RepairDetailPage } from './pages/RepairDetailPage.js';
import { RepairsPage } from './pages/RepairsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { SessionProvider } from './session/SessionProvider.js';

const UiCatalogPage = __UI_CATALOG_ENABLED__
  ? lazy(() => import('./catalog/UiCatalogPage.js'))
  : null;

export function App(): React.JSX.Element {
  const location = useLocation();
  const routeState = location.state as Readonly<{
    backgroundLocation?: Location;
  }> | null;
  const backgroundLocation = routeState?.backgroundLocation;

  return (
    <SessionProvider>
      {({ session, busy, errorMessage, focusTarget, beginUserSwitch, logout }) => (
        <ApplicationShell
          actor={session}
          busy={busy}
          errorMessage={errorMessage}
          focusTarget={focusTarget}
          onChangeUser={beginUserSwitch}
          onLogout={logout}
        >
          <Suspense fallback={<Spinner label="Cargando superficie" />}>
            <Routes location={backgroundLocation ?? location}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/reparaciones" element={<RepairsPage />} />
              <Route path="/reparaciones/nueva" element={<NewRepairPage />} />
              <Route path="/reparaciones/:id" element={<RepairDetailPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
              {UiCatalogPage ? <Route path="/__internal/ui-catalog" element={<UiCatalogPage />} /> : null}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {backgroundLocation ? (
              <Routes>
                <Route path="/reparaciones/:id" element={<RepairDetailPage host="overlay" />} />
              </Routes>
            ) : null}
          </Suspense>
        </ApplicationShell>
      )}
    </SessionProvider>
  );
}
