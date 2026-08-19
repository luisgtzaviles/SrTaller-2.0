import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
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
import styles from './application-shell.module.css';

const SIDEBAR_STORAGE_KEY = 'srtaller.sidebar.collapsed';

const navigation: readonly Readonly<{
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}>[] = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/reparaciones', label: 'Reparaciones', icon: Wrench },
];

function readCollapsedPreference(): boolean {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true' || stored === 'false') return stored === 'true';
  } catch {
    // A viewport-based default remains available without storage.
  }
  return !window.matchMedia('(min-width: 1280px)').matches;
}

function Navigation({ collapsed, onNavigate }: Readonly<{ collapsed: boolean; onNavigate?: () => void }>): React.JSX.Element {
  return (
    <nav aria-label="Navegación principal" className={styles.navigation}>
      <span className={styles.navigationGroup}>Operación</span>
      {navigation.map(({ to, label, icon: Icon, end }) => (
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

function OperatorMenu(): React.JSX.Element {
  return (
    <details className={styles.operatorMenu}>
      <summary aria-label="Abrir menú del operador sintético">
        <UserCircle aria-hidden="true" size={20} />
        <span><strong>Operador sintético</strong><small>Sin identidad integrada</small></span>
        <ChevronDown aria-hidden="true" size={16} />
      </summary>
      <div className={styles.operatorPopover}>
        <p>Presentación únicamente. PBI-024 e identidad no están integrados.</p>
        <button type="button" disabled><LogOut aria-hidden="true" size={16} />Cerrar sesión no disponible</button>
      </div>
    </details>
  );
}

export function ApplicationShell({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
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
          <Brand className={styles.headerBrand} meta="Sucursal sintética · Preview" />
        </div>
        <div className={styles.headerEnd}>
          <span className={styles.previewBadge}>Preview · Datos sintéticos</span>
          <ThemeControl />
          <OperatorMenu />
          <button className={styles.logoutButton} type="button" disabled aria-label="Cerrar sesión no disponible" title="La autenticación no está integrada">
            <LogOut aria-hidden="true" size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      <div className={styles.desktopBody}>
        <aside className={styles.sidebar} aria-label="Shell principal">
          <Navigation collapsed={collapsed} />
          <div className={styles.sidebarFooter}>
            <span className={styles.environmentDot} aria-hidden="true" />
            <span className={classNames(styles.environmentCopy, collapsed && styles.collapsedOnly)}><strong>Preview aislado</strong><small>Sin datos reales</small></span>
          </div>
        </aside>

        <div className={styles.workspace}>
          <div className={styles.blockingBanner}>
            <Alert tone="warning" title="Contexto operativo no integrado">
              Empresa, sucursal, estación e identidad siguen sin una fuente backend confiable. Las superficies son demostraciones sintéticas.
            </Alert>
          </div>

          <main id="main-content" className={styles.mainContent} tabIndex={-1}>{children}</main>
        </div>
      </div>

      {drawerOpen ? (
        <div className={styles.drawerLayer}>
          <div className={styles.drawerBackdrop} aria-hidden="true" onClick={closeDrawer} />
          <aside ref={drawerRef} className={styles.drawer} role="dialog" aria-modal="true" aria-label="Navegación móvil" tabIndex={-1}>
            <header><Brand /><IconButton icon={X} label="Cerrar navegación" tone="inverse" onClick={closeDrawer} /></header>
            <Navigation collapsed={false} onNavigate={closeDrawer} />
            <footer><span className={styles.environmentDot} aria-hidden="true" /><span><strong>Preview aislado</strong><small>Sin datos reales</small></span></footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
