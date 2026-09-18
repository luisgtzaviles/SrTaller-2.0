import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';

import { ApplicationShell } from './components/shell/ApplicationShell.js';
import { Spinner } from './components/ui/feedback.js';
import { AccessDeniedPage } from './pages/AccessDeniedPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { NewRepairEntryPage } from './pages/NewRepairEntryPage.js';
import { RepairDetailPage } from './pages/RepairDetailPage.js';
import { RepairsPage } from './pages/RepairsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { BranchSettingsPage } from './pages/BranchSettingsPage.js';
import { RolesPage } from './pages/RolesPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { NewRepairConfigurationPage } from './pages/NewRepairConfigurationPage.js';
import { RepairCatalogsPage } from './pages/RepairCatalogsPage.js';
import { CatalogFieldPolicyConfigurationPage } from './pages/CatalogFieldPolicyConfigurationPage.js';
import { PriceListPage } from './pages/PriceListPage.js';
import { BulkCatalogComposerPage } from './pages/BulkCatalogComposerPage.js';
import { SessionProvider } from './session/SessionProvider.js';
import { hasOperationalCapability } from './session/session-capabilities.mjs';
import type { OperationalCapability } from './session/session-api.js';
import { UserPreferencesProvider } from './user-preferences/UserPreferencesProvider.js';

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

function NewRepairConfigurationBoundary({
  operationalCapabilities,
  administrationCapabilities,
  children,
}: Readonly<{
  operationalCapabilities: readonly OperationalCapability[];
  administrationCapabilities: readonly OperationalCapability[];
  children: React.ReactNode;
}>): React.JSX.Element {
  return hasOperationalCapability(operationalCapabilities, 'repairs.create') ||
    hasOperationalCapability(administrationCapabilities, 'repairs.configuration.read')
    ? <>{children}</>
    : <AccessDeniedPage />;
}

function CatalogConfigurationBoundary({ capabilities, children }: Readonly<{ capabilities: readonly OperationalCapability[]; children: React.ReactNode }>): React.JSX.Element {
  return hasOperationalCapability(capabilities, 'repairs.catalogs.read') || hasOperationalCapability(capabilities, 'catalog.manage') ? <>{children}</> : <AccessDeniedPage />;
}

function CatalogFieldPolicyBoundary({ capabilities, children }: Readonly<{ capabilities: readonly OperationalCapability[]; children: React.ReactNode }>): React.JSX.Element {
  return hasOperationalCapability(capabilities, 'catalog.configuration.read') && hasOperationalCapability(capabilities, 'catalog.reference_cost.read')
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
      {({ session, timeZone, capabilities, administrationCapabilities, csrfToken, busy, errorMessage, focusTarget, beginUserSwitch, logout }) => (
        <ApplicationShell
          actor={session}
          capabilities={capabilities}
          busy={busy}
          errorMessage={errorMessage}
          focusTarget={focusTarget}
          onChangeUser={beginUserSwitch}
          onLogout={logout}
        >
          <UserPreferencesProvider
            key={`${session.tenantId}:${session.userId}`}
            csrfToken={csrfToken}
          >
          <Suspense fallback={<Spinner label="Cargando superficie" />}>
            <Routes location={backgroundLocation ?? location}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/reparaciones" element={<CapabilityBoundary capabilities={capabilities} capability="repairs.read"><RepairsPage capabilities={capabilities} timeZone={timeZone} /></CapabilityBoundary>} />
              <Route path="/reparaciones/nueva" element={<CapabilityBoundary capabilities={capabilities} capability="repairs.create"><CapabilityBoundary capabilities={capabilities} capability="repairs.read"><><RepairsPage capabilities={capabilities} timeZone={timeZone} /><NewRepairEntryPage csrfToken={csrfToken} timeZone={timeZone} /></></CapabilityBoundary></CapabilityBoundary>} />
              <Route path="/reparaciones/:id" element={<CapabilityBoundary capabilities={capabilities} capability="repairs.read"><RepairDetailPage capabilities={capabilities} csrfToken={csrfToken} sessionId={session.sessionId} timeZone={timeZone} /></CapabilityBoundary>} />
              <Route path="/listas/precios" element={<CapabilityBoundary capabilities={capabilities} capability="price_list.read"><PriceListPage capabilities={capabilities} administrationCapabilities={administrationCapabilities} csrfToken={csrfToken} /></CapabilityBoundary>} />
              <Route path="/listas/precios/carga-masiva" element={<CapabilityBoundary capabilities={administrationCapabilities} capability="catalog.import.prepare"><BulkCatalogComposerPage capabilities={administrationCapabilities} csrfToken={csrfToken} timeZone={timeZone} /></CapabilityBoundary>} />
              <Route path="/configuracion" element={<SettingsPage operationalCapabilities={capabilities} administrationCapabilities={administrationCapabilities} />} />
              <Route path="/configuracion/sucursal" element={<CapabilityBoundary capabilities={administrationCapabilities} capability="access_matrix.manage"><BranchSettingsPage csrfToken={csrfToken} /></CapabilityBoundary>} />
              <Route path="/configuracion/roles" element={<CapabilityBoundary capabilities={administrationCapabilities} capability="access_matrix.read"><RolesPage capabilities={administrationCapabilities} csrfToken={csrfToken} /></CapabilityBoundary>} />
              <Route path="/configuracion/usuarios" element={<CapabilityBoundary capabilities={administrationCapabilities} capability="users.read"><UsersPage capabilities={administrationCapabilities} csrfToken={csrfToken} /></CapabilityBoundary>} />
              <Route path="/configuracion/catalogos/nueva-reparacion" element={<NewRepairConfigurationBoundary operationalCapabilities={capabilities} administrationCapabilities={administrationCapabilities}><NewRepairConfigurationPage operationalCapabilities={capabilities} administrationCapabilities={administrationCapabilities} csrfToken={csrfToken} /></NewRepairConfigurationBoundary>} />
              <Route path="/configuracion/catalogos" element={<CatalogConfigurationBoundary capabilities={administrationCapabilities}><RepairCatalogsPage capabilities={administrationCapabilities} csrfToken={csrfToken} /></CatalogConfigurationBoundary>} />
              <Route path="/configuracion/catalogos/lista-de-precios/campos-de-carga" element={<CatalogFieldPolicyBoundary capabilities={administrationCapabilities}><CatalogFieldPolicyConfigurationPage canManage={hasOperationalCapability(administrationCapabilities, 'catalog.configuration.manage') && hasOperationalCapability(administrationCapabilities, 'catalog.reference_cost.manage')} csrfToken={csrfToken} /></CatalogFieldPolicyBoundary>} />
              {UiCatalogPage ? <Route path="/__internal/ui-catalog" element={<UiCatalogPage />} /> : null}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {backgroundLocation && hasOperationalCapability(capabilities, 'repairs.read') ? (
              <Routes>
                <Route path="/reparaciones/nueva" element={<CapabilityBoundary capabilities={capabilities} capability="repairs.create"><NewRepairEntryPage csrfToken={csrfToken} timeZone={timeZone} /></CapabilityBoundary>} />
                <Route path="/reparaciones/:id" element={<RepairDetailPage capabilities={capabilities} csrfToken={csrfToken} sessionId={session.sessionId} timeZone={timeZone} host="overlay" />} />
              </Routes>
            ) : null}
          </Suspense>
          </UserPreferencesProvider>
        </ApplicationShell>
      )}
    </SessionProvider>
  );
}
