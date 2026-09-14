import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ReceiptText,
  Settings,
  Sun,
  UserCircle,
  Wrench,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { Alert } from '../ui/feedback.js';
import { IconButton } from '../ui/controls.js';
import { useFocusTrap } from '../ui/overlays.js';
import { classNames } from '../ui/class-names.js';
import { useTheme } from '../../foundation/theme.js';
import { hasOperationalCapability } from '../../session/session-capabilities.mjs';
import type { ActiveOperationalSession, OperationalCapability } from '../../session/session-api.js';
import styles from './application-shell.module.css';

const SIDEBAR_STORAGE_KEY = 'srtaller.sidebar.collapsed';

type NavigationItem = Readonly<{
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  requiredCapability?: OperationalCapability;
}>;

const operationNavigation: readonly NavigationItem[] = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/reparaciones', label: 'Reparaciones', icon: Wrench, requiredCapability: 'repairs.read' },
];

const listNavigation: readonly NavigationItem[] = Object.freeze([
  { to: '/listas/precios', label: 'Lista de precios', icon: ReceiptText, requiredCapability: 'price_list.read' as const },
]);

const systemNavigation: readonly NavigationItem[] = Object.freeze([
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]);

function readCollapsedPreference(): boolean {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true' || stored === 'false') return stored === 'true';
  } catch {
    // A viewport-based default remains available without storage.
  }
  return !window.matchMedia('(min-width: 1280px)').matches;
}

function Navigation({ capabilities, collapsed, onNavigate }: Readonly<{
  capabilities: readonly OperationalCapability[];
  collapsed: boolean;
  onNavigate?: () => void;
}>): React.JSX.Element {
  return (
    <nav aria-label="Navegación principal" className={styles.navigation}>
      {[
        { group: 'Operación', items: operationNavigation },
        { group: 'Listas', items: listNavigation },
        { group: 'Sistema', items: systemNavigation },
      ].map(({ group, items }) => <div className={styles.navigationSection} key={group}>
      <span className={styles.navigationGroup}>{group}</span>
      {items.filter(({ requiredCapability }) => (
        !requiredCapability || hasOperationalCapability(capabilities, requiredCapability)
      )).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          {...(end === undefined ? {} : { end })}
          {...(onNavigate ? { onClick: onNavigate } : {})}
          {...(collapsed ? { 'aria-label': label, title: label } : {})}
          data-label={label}
          className={({ isActive }) => classNames(styles.navItem, isActive && styles.navItemActive)}
        >
          <Icon aria-hidden="true" size={20} />
          <span className={styles.navLabel}>{label}</span>
        </NavLink>
      ))}
      </div>)}
    </nav>
  );
}

function Brand({
  collapsed = false,
  className,
  meta = '2.0',
}: Readonly<{ collapsed?: boolean; className?: string | undefined; meta?: string }>): React.JSX.Element {
  return (
    <Link className={classNames(styles.brand, className)} to="/" aria-label="SR Taller 2.0, inicio">
      <span className={styles.brandMark} aria-hidden="true">SR</span>
      <span className={classNames(styles.brandName, collapsed && styles.collapsedOnly)}><strong>SR Taller</strong><small>{meta}</small></span>
    </Link>
  );
}

function ThemeControl(): React.JSX.Element {
  const { preference, setPreference } = useTheme();
  return (
    <div className={styles.themeControl} role="group" aria-label="Selector de tema">
      <button
        type="button"
        className={classNames(styles.themeOption, preference === 'light' && styles.themeOptionActive)}
        aria-label="Tema claro"
        aria-pressed={preference === 'light'}
        title="Tema claro"
        onClick={() => setPreference('light')}
      >
        <Sun aria-hidden="true" size={20} />
      </button>
      <span className={styles.themeSeparator} aria-hidden="true">|</span>
      <button
        type="button"
        className={classNames(styles.themeOption, preference === 'dark' && styles.themeOptionActive)}
        aria-label="Tema oscuro"
        aria-pressed={preference === 'dark'}
        title="Tema oscuro"
        onClick={() => setPreference('dark')}
      >
        <Moon aria-hidden="true" size={20} />
      </button>
    </div>
  );
}

function OperatorMenu({
  actor,
  busy,
  triggerRef,
  onChangeUser,
  onLogout,
}: Readonly<{
  actor: ActiveOperationalSession;
  busy: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  onChangeUser(): void;
  onLogout(): void;
}>): React.JSX.Element {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const runAction = (action: () => void): void => {
    menuRef.current?.removeAttribute('open');
    action();
  };
  return (
    <details ref={menuRef} className={styles.operatorMenu}>
      <summary ref={triggerRef} aria-label={`Abrir menú de ${actor.displayName}`}>
        <UserCircle aria-hidden="true" size={20} />
        <span><strong>{actor.displayName}</strong><small>Sesión operativa</small></span>
        <ChevronDown aria-hidden="true" size={16} />
      </summary>
      <div className={styles.operatorPopover}>
        <p><strong>{actor.displayName}</strong> está operando desde una estación reconocida y una sucursal vinculada.</p>
        <div className={styles.operatorActions}>
          <button type="button" disabled={busy} onClick={() => runAction(onChangeUser)}>
            <RefreshCw aria-hidden="true" size={16} />Cambiar usuario
          </button>
          <button type="button" disabled={busy} onClick={() => runAction(onLogout)}>
            <LogOut aria-hidden="true" size={16} />Cerrar sesión
          </button>
        </div>
      </div>
    </details>
  );
}

export function ApplicationShell({
  actor,
  capabilities,
  busy,
  errorMessage,
  focusTarget,
  onChangeUser,
  onLogout,
  children,
}: Readonly<{
  actor: ActiveOperationalSession;
  capabilities: readonly OperationalCapability[];
  busy: boolean;
  errorMessage: string | null;
  focusTarget: 'main' | 'operator' | null;
  onChangeUser(): void;
  onLogout(): void;
  children: React.ReactNode;
}>): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const operatorTriggerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const closeDrawer = useCallback((): void => setDrawerOpen(false), []);
  useFocusTrap(drawerOpen, drawerRef, closeDrawer);

  useEffect(() => {
    closeDrawer();
  }, [closeDrawer, location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('srt-drawer-open', drawerOpen);
    return () => document.body.classList.remove('srt-drawer-open');
  }, [drawerOpen]);

  useEffect(() => {
    if (!focusTarget) return undefined;
    const frame = window.requestAnimationFrame(() => {
      if (focusTarget === 'operator') {
        operatorTriggerRef.current?.focus();
        return;
      }
      const activeElement = document.activeElement;
      if (!activeElement || activeElement === document.body || !activeElement.isConnected) {
        document.getElementById('main-content')?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusTarget]);

  const toggleCollapsed = (): void => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // The shell remains usable without persistence.
      }
      return next;
    });
  };

  return (
    <div className={classNames(styles.shell, collapsed && styles.shellCollapsed)}>
      <a className={styles.skipLink} href="#main-content">Saltar al contenido</a>
      <header className={styles.globalHeader}>
        <div className={styles.headerStart}>
          <IconButton className={styles.mobileMenuButton} icon={Menu} label="Abrir navegación" onClick={() => setDrawerOpen(true)} />
          <IconButton
            className={styles.collapseButton}
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            tooltip={collapsed ? 'Expandir navegación' : 'Colapsar navegación'}
            onClick={toggleCollapsed}
          />
          <Brand className={styles.headerBrand} meta="Sucursal vinculada · Estación reconocida" />
        </div>
        <div className={styles.headerEnd}>
          <span className={styles.previewBadge}>{__SRT_DEPLOY_ENV__ === 'local' ? 'Local' : 'Preview'} · Datos sintéticos</span>
          <ThemeControl />
          <OperatorMenu
            actor={actor}
            busy={busy}
            triggerRef={operatorTriggerRef}
            onChangeUser={onChangeUser}
            onLogout={onLogout}
          />
          <button className={styles.logoutButton} type="button" disabled={busy} onClick={onLogout} aria-label="Cerrar sesión">
            <LogOut aria-hidden="true" size={20} />
            <span>{busy ? 'Procesando…' : 'Cerrar sesión'}</span>
          </button>
        </div>
      </header>

      <div className={styles.desktopBody}>
        <aside className={styles.sidebar} aria-label="Shell principal">
          <Brand className={styles.sidebarIdentity} collapsed={collapsed} meta="Sucursal vinculada" />
          <Navigation capabilities={capabilities} collapsed={collapsed} />
          <div className={styles.sidebarFooter}>
            <span className={styles.environmentDot} aria-hidden="true" />
            <span className={classNames(styles.environmentCopy, collapsed && styles.collapsedOnly)}><strong>Estación reconocida</strong><small>{actor.displayName} · Sesión activa</small></span>
          </div>
        </aside>

        <div className={styles.workspace}>
          <div className={styles.blockingBanner}>
            <Alert tone="info" title={__SRT_DEPLOY_ENV__ === 'local' ? 'Entorno local de desarrollo' : 'Entorno de preview'}>
              {__SRT_DEPLOY_ENV__ === 'local'
                ? 'El contexto confiable y la sesión provienen del servidor local.'
                : 'El contexto confiable y la sesión provienen del servidor de preview.'}
              {' '}Los registros operativos siguen siendo fixtures sintéticos; esto no corresponde a Production.
            </Alert>
            {errorMessage ? (
              <Alert tone="danger" title="No se completó la acción">{errorMessage}</Alert>
            ) : null}
          </div>

          <main id="main-content" className={styles.mainContent} tabIndex={-1}>{children}</main>
        </div>
      </div>

      {drawerOpen ? (
        <div className={styles.drawerLayer}>
          <div className={styles.drawerBackdrop} aria-hidden="true" onClick={closeDrawer} />
          <aside ref={drawerRef} className={styles.drawer} role="dialog" aria-modal="true" aria-label="Navegación móvil" tabIndex={-1}>
            <header><Brand /><IconButton icon={X} label="Cerrar navegación" tone="inverse" onClick={closeDrawer} /></header>
            <Navigation capabilities={capabilities} collapsed={false} onNavigate={closeDrawer} />
            <footer><span className={styles.environmentDot} aria-hidden="true" /><span><strong>Estación reconocida</strong><small>{actor.displayName} · Sesión activa</small></span></footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
