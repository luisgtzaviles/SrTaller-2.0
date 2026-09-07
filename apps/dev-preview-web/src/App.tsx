import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';

import { ApplicationShell } from './components/shell/ApplicationShell.js';
import { Spinner } from './components/ui/feedback.js';
import { AccessDeniedPage } from './pages/AccessDeniedPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { RepairDetailPage } from './pages/RepairDetailPage.js';
import { RepairsPage } from './pages/RepairsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { SessionProvider } from './session/SessionProvider.js';
import { hasOperationalCapability } from './session/session-capabilities.mjs';
import type { OperationalCapability } from './session/session-api.js';

const UiCatalogPage = __UI_CATALOG_ENABLED__
  ? lazy(() => import('./catalog/UiCatalogPage.js'))
  : null;

function CapabilityBoundary({
  capabilities,
  capability,
  children,
}: Readonly<{
  capabilities: readonly OperationalCapability[];
  capability: OperationalCapability;
  children: React.ReactNode;
}>): React.JSX.Element {
  return hasOperationalCapability(capabilities, capability)
    ? <>{children}</>
    : <AccessDeniedPage />;
}

export function App(): React.JSX.Element {
  const location = useLocation();
  const routeState = location.state as Readonly<{
    backgroundLocation?: Location;
  }> | null;
  const backgroundLocation = routeState?.backgroundLocation;

  return (
    <SessionProvider>
      {({ session, capabilities, csrfToken, busy, errorMessage, focusTarget, beginUserSwitch, logout }) => (
        <ApplicationShell
          actor={session}
          capabilities={capabilities}
          busy={busy}
          errorMessage={errorMessage}
          focusTarget={focusTarget}
          onChangeUser={beginUserSwitch}
          onLogout={logout}
        >
          <Suspense fallback={<Spinner label="Cargando superficie" />}>
            <Routes location={backgroundLocation ?? location}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/reparaciones" element={<CapabilityBoundary capabilities={capabilities} capability="repairs.read"><RepairsPage /></CapabilityBoundary>} />
              <Route path="/reparaciones/nueva" element={<AccessDeniedPage />} />
              <Route path="/reparaciones/:id" element={<CapabilityBoundary capabilities={capabilities} capability="repairs.read"><RepairDetailPage capabilities={capabilities} csrfToken={csrfToken} sessionId={session.sessionId} /></CapabilityBoundary>} />
              <Route path="/configuracion" element={<SettingsPage />} />
              {UiCatalogPage ? <Route path="/__internal/ui-catalog" element={<UiCatalogPage />} /> : null}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {backgroundLocation && hasOperationalCapability(capabilities, 'repairs.read') ? (
              <Routes>
                <Route path="/reparaciones/:id" element={<RepairDetailPage capabilities={capabilities} csrfToken={csrfToken} sessionId={session.sessionId} host="overlay" />} />
              </Routes>
            ) : null}
          </Suspense>
        </ApplicationShell>
      )}
    </SessionProvider>
  );
}
