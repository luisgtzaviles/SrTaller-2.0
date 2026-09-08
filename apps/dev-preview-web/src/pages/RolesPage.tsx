import { KeyRound, Plus, ShieldCheck, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Field, Input, Textarea } from '../components/ui/controls.js';
import { StatusBadge } from '../components/ui/data-display.js';
import { Alert, EmptyState, ErrorState, Spinner } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import {
  createProductRole,
  humanCapabilityLabel,
  listProductAccessMatrix,
  replaceProductRoleCapabilities,
  updateProductRole,
} from '../users-api.js';
import type { ProductAccessMatrix, ProductRole } from '../users-api.js';
import styles from './roles-page.module.css';

type Notice = Readonly<{ tone: 'danger' | 'success'; message: string }>;

function roleStatusView(status: ProductRole['status']): Readonly<{
  label: string;
  tone: 'neutral' | 'success' | 'warning';
}> {
  if (status === 'active') return { label: 'Activo', tone: 'success' };
  if (status === 'disabled') return { label: 'Desactivado', tone: 'warning' };
  return { label: 'Archivado', tone: 'neutral' };
}

const CAPABILITY_GROUPS = Object.freeze([
  Object.freeze({ key: 'operation', title: 'Operación del taller', description: 'Acceso al trabajo diario de reparaciones.', prefix: 'repairs.' }),
  Object.freeze({ key: 'users', title: 'Equipo', description: 'Consulta y administración de usuarios.', prefix: 'users.' }),
  Object.freeze({ key: 'roles', title: 'Roles y permisos', description: 'Consulta y administración de perfiles de acceso.', prefix: 'access_matrix.' }),
]);

function generatedRoleKey(displayName: string): string {
  return displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^_+|_+$/gu, '')
    .slice(0, 64);
}

function CapabilityChecklist({
  available,
  selected,
  disabled,
  onToggle,
}: Readonly<{
  available: ProductAccessMatrix['capabilities'];
  selected: readonly string[];
  disabled: boolean;
  onToggle(code: string): void;
}>): React.JSX.Element {
  return (
    <div className={styles.capabilityGroups}>
      {CAPABILITY_GROUPS.map((group) => {
        const capabilities = available.filter(({ capabilityCode }) => capabilityCode.startsWith(group.prefix));
        if (capabilities.length === 0) return null;
        return (
          <fieldset key={group.key} className={styles.capabilityGroup}>
            <legend>{group.title}</legend>
            <p>{group.description}</p>
            {capabilities.map(({ capabilityCode }) => (
              <label key={capabilityCode}>
                <input
                  type="checkbox"
                  checked={selected.includes(capabilityCode)}
                  disabled={disabled}
                  onChange={() => onToggle(capabilityCode)}
                />
                <span>{humanCapabilityLabel(capabilityCode)}</span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}

function RolePermissions({ role }: Readonly<{ role: ProductRole }>): React.JSX.Element {
  return (
    <div className={styles.permissionList} aria-label={`Permisos de ${role.displayName}`}>
      {role.capabilityCodes.map((code) => <span key={code}>{humanCapabilityLabel(code)}</span>)}
    </div>
  );
}

export function RolesPage({ capabilities, csrfToken }: Readonly<{
  capabilities: readonly OperationalCapability[];
  csrfToken: string;
}>): React.JSX.Element {
  const canManage = hasOperationalCapability(capabilities, 'access_matrix.manage');
  const [matrix, setMatrix] = useState<ProductAccessMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialog, setDialog] = useState<'create' | string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<readonly string[]>([]);
  const [saving, setSaving] = useState(false);
  const createRequestId = useRef<string | null>(null);
  const metadataRequestId = useRef<string | null>(null);
  const capabilitiesRequestId = useRef<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(false);
    try {
      setMatrix(await listProductAccessMatrix());
    } catch {
      setMatrix(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const editingRole = useMemo(
    () => dialog && dialog !== 'create' ? matrix?.roles.find((role) => role.roleId === dialog) ?? null : null,
    [dialog, matrix?.roles],
  );

  const resetDialog = (): void => {
    setDialog(null);
    setDisplayName('');
    setDescription('');
    setSelectedCapabilities([]);
    createRequestId.current = null;
    metadataRequestId.current = null;
    capabilitiesRequestId.current = null;
  };

  const closeDialog = (): void => {
    if (!saving) resetDialog();
  };

  const openCreate = (): void => {
    setNotice(null);
    setDisplayName('');
    setDescription('');
    setSelectedCapabilities([]);
    setDialog('create');
  };

  const openEdit = (role: ProductRole): void => {
    setNotice(null);
    setDisplayName(role.displayName);
    setDescription(role.description ?? '');
    setSelectedCapabilities(role.capabilityCodes);
    setDialog(role.roleId);
  };

  const toggleCapability = (code: string): void => {
    createRequestId.current = null;
    capabilitiesRequestId.current = null;
    setSelectedCapabilities((current) => current.includes(code)
      ? current.filter((candidate) => candidate !== code)
      : [...current, code]);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!matrix || selectedCapabilities.length === 0) {
      setNotice({ tone: 'danger', message: 'Selecciona al menos un permiso para continuar.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      if (dialog === 'create') {
        const name = displayName.trim();
        const roleKey = generatedRoleKey(name);
        if (!name || !roleKey) {
          setNotice({ tone: 'danger', message: 'Escribe un nombre válido para el rol.' });
          return;
        }
        const created = await createProductRole({
          roleKey,
          displayName: name,
          description: description.trim() || null,
          capabilityCodes: selectedCapabilities,
          clientRequestId: createRequestId.current ??= crypto.randomUUID(),
        }, csrfToken);
        setMatrix((current) => current ? {
          ...current,
          roles: [...current.roles, created].sort((left, right) => left.displayName.localeCompare(right.displayName, 'es')),
        } : current);
        setNotice({ tone: 'success', message: `El rol ${created.displayName} quedó disponible para asignarse.` });
      } else if (editingRole) {
        const name = displayName.trim();
        if (!name) {
          setNotice({ tone: 'danger', message: 'El nombre del rol es obligatorio.' });
          return;
        }
        const nextDescription = description.trim() || null;
        const metadataChanged = name !== editingRole.displayName || nextDescription !== editingRole.description;
        const capabilitiesChanged = selectedCapabilities.length !== editingRole.capabilityCodes.length ||
          selectedCapabilities.some((code) => !editingRole.capabilityCodes.includes(code));
        let updated = editingRole;
        if (metadataChanged) {
          const metadataUpdated = await updateProductRole(editingRole.roleId, {
            displayName: name,
            description: nextDescription,
            expectedVersion: updated.version,
            clientRequestId: metadataRequestId.current ??= crypto.randomUUID(),
          }, csrfToken);
          updated = metadataUpdated;
          metadataRequestId.current = null;
          setMatrix((current) => current ? {
            ...current,
            roles: current.roles.map((role) => role.roleId === metadataUpdated.roleId ? metadataUpdated : role),
          } : current);
        }
        if (capabilitiesChanged) {
          updated = await replaceProductRoleCapabilities(editingRole.roleId, {
            expectedVersion: updated.version,
            capabilityCodes: selectedCapabilities,
            clientRequestId: capabilitiesRequestId.current ??= crypto.randomUUID(),
          }, csrfToken);
          capabilitiesRequestId.current = null;
        }
        setMatrix((current) => current ? {
          ...current,
          roles: current.roles.map((role) => role.roleId === updated.roleId ? updated : role),
        } : current);
        setNotice({ tone: 'success', message: `El rol ${updated.displayName} se actualizó.` });
      }
      resetDialog();
    } catch {
      setNotice({ tone: 'danger', message: 'No fue posible guardar el rol. Actualiza la información e intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageStack}>
      <PageHeader
        breadcrumb={[{ label: 'Configuración', to: '/configuracion' }, { label: 'Roles' }]}
        eyebrow="Administración del equipo"
        title="Roles y permisos"
        description="Cada rol reúne permisos reutilizables. Los usuarios reciben acceso únicamente por los roles que tienen asignados."
        primaryAction={canManage ? <Button tone="primary" onClick={openCreate}><Plus aria-hidden="true" size={18} />Nuevo rol</Button> : undefined}
      />

      {!canManage ? <Alert tone="info" title="Modo de consulta">Puedes revisar los roles, pero tu sesión no permite modificarlos.</Alert> : null}
      {dialog === null && notice ? <Alert tone={notice.tone}>{notice.message}</Alert> : null}

      {loading ? (
        <section className={styles.loadingState} aria-busy="true"><Spinner label="Cargando roles" /><span>Cargando roles y permisos…</span></section>
      ) : loadError || !matrix ? (
        <div className={styles.errorState}>
          <ErrorState title="No pudimos cargar los roles" description="Verifica tu sesión y vuelve a intentar." />
          <Button tone="primary" onClick={() => void load()}>Reintentar</Button>
        </div>
      ) : (
        <>
          <section className={styles.summaryGrid} aria-label="Resumen de acceso">
            <article><span className={styles.summaryIcon}><ShieldCheck aria-hidden="true" size={20} /></span><div><strong>{matrix.roles.length}</strong><span>Roles disponibles</span></div></article>
            <article><span className={styles.summaryIcon}><KeyRound aria-hidden="true" size={20} /></span><div><strong>{matrix.capabilities.length}</strong><span>Permisos del sistema</span></div></article>
            <article><span className={styles.summaryIcon}><UsersRound aria-hidden="true" size={20} /></span><div><strong>{matrix.assignments.filter((assignment) => assignment.status === 'active').length}</strong><span>Asignaciones activas</span></div></article>
          </section>

          <section className={styles.surface} aria-labelledby="roles-list-title">
            <header className={styles.surfaceHeader}>
              <div><h2 id="roles-list-title">Roles del equipo</h2><p>Los cambios de un rol se reflejan automáticamente en todos sus usuarios.</p></div>
            </header>
            {matrix.roles.length === 0 ? (
              <EmptyState title="Aún no hay roles" description="Crea un rol para reunir los permisos de una función del taller." compact />
            ) : (
              <div className={styles.roleGrid}>
                {matrix.roles.map((role) => (
                  <article key={role.roleId} className={styles.roleCard}>
                    <header>
                      <div><h3>{role.displayName}</h3><span>{role.capabilityCodes.length} {role.capabilityCodes.length === 1 ? 'permiso' : 'permisos'}</span></div>
                      <StatusBadge tone={roleStatusView(role.status).tone}>{roleStatusView(role.status).label}</StatusBadge>
                    </header>
                    {role.description ? <p className={styles.roleDescription}>{role.description}</p> : null}
                    <RolePermissions role={role} />
                    {canManage && role.status === 'active' ? (
                      <Button tone="secondary" data-role-edit-trigger={role.roleId} onClick={() => openEdit(role)} aria-label={`Editar rol ${role.displayName}`}>Editar rol</Button>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Dialog
        open={dialog !== null}
        title={dialog === 'create' ? 'Crear un rol' : `Editar ${editingRole?.displayName ?? 'rol'}`}
        description={dialog === 'create'
          ? 'Define una función del equipo y selecciona lo que podrá hacer.'
          : 'El nombre, la descripción y los permisos se aplican a todos los usuarios que tengan este rol.'}
        size="wide"
        restoreFocusSelector={editingRole ? `[data-role-edit-trigger="${editingRole.roleId}"]` : undefined}
        onClose={closeDialog}
        footer={(
          <div className={styles.dialogActions}>
            <Button disabled={saving} onClick={closeDialog}>Cancelar</Button>
            <Button form="role-form" type="submit" tone="primary" disabled={saving || selectedCapabilities.length === 0}>
              {saving ? 'Guardando…' : dialog === 'create' ? 'Crear rol' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      >
        <form id="role-form" className={styles.dialogForm} onSubmit={(event) => void submit(event)}>
          {notice ? <Alert tone={notice.tone}>{notice.message}</Alert> : null}
          <div className={styles.metadataFields}>
            <Field id="role-name" label="Nombre del rol" hint="Usa el nombre de la función, por ejemplo Ventas o Recepción." required>
              <Input id="role-name" value={displayName} maxLength={160} disabled={saving} autoComplete="off" onChange={(event) => {
                createRequestId.current = null;
                metadataRequestId.current = null;
                setDisplayName(event.target.value);
              }} />
            </Field>
            <Field id="role-description" label="Descripción" hint="Opcional. Explica para quién es este rol o cuándo debe usarse." fullWidth>
              <Textarea id="role-description" value={description} maxLength={320} rows={3} disabled={saving} onChange={(event) => {
                createRequestId.current = null;
                metadataRequestId.current = null;
                setDescription(event.target.value);
              }} />
            </Field>
          </div>
          {matrix ? (
            <CapabilityChecklist available={matrix.capabilities} selected={selectedCapabilities} disabled={saving} onToggle={toggleCapability} />
          ) : null}
        </form>
      </Dialog>
    </div>
  );
}
