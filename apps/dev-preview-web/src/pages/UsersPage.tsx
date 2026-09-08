import { KeyRound, Pencil, Plus, ShieldCheck, UserCheck, UserPlus, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Field, Input } from '../components/ui/controls.js';
import { ResponsiveDataList, StatusBadge } from '../components/ui/data-display.js';
import type { DataColumn } from '../components/ui/data-display.js';
import { Alert, EmptyState, ErrorState, Spinner } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import {
  assignProductRole,
  createProductUser,
  listProductAccessMatrix,
  listProductUsers,
  provisionProductLocalPin,
  revokeProductRole,
  transitionProductUser,
  updateProductUser,
} from '../users-api.js';
import type { ProductAccessMatrix, ProductUser } from '../users-api.js';
import styles from './users-page.module.css';

type Notice = Readonly<{ tone: 'danger' | 'success'; message: string }>;

function statusView(status: ProductUser['status']): Readonly<{
  label: string;
  tone: 'danger' | 'success' | 'warning';
}> {
  if (status === 'active') return { label: 'Activo', tone: 'success' };
  if (status === 'inactive') return { label: 'Inactivo', tone: 'warning' };
  return { label: 'Revocado', tone: 'danger' };
}

function RoleTags({ names }: Readonly<{ names: readonly string[] | null }>): React.JSX.Element {
  if (names === null) return <span className={styles.muted}>No disponible</span>;
  if (names.length === 0) return <span className={styles.muted}>Sin roles</span>;
  return <span className={styles.roleTags}>{names.map((name) => <span key={name}>{name}</span>)}</span>;
}

export function UsersPage({ capabilities, csrfToken }: Readonly<{
  capabilities: readonly OperationalCapability[];
  csrfToken: string;
}>): React.JSX.Element {
  const canManage = hasOperationalCapability(capabilities, 'users.manage');
  const canReadMatrix = hasOperationalCapability(capabilities, 'access_matrix.read');
  const [users, setUsers] = useState<readonly ProductUser[] | null>(null);
  const [matrix, setMatrix] = useState<ProductAccessMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialog, setDialog] = useState<'create' | string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editIdentifier, setEditIdentifier] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [pin, setPin] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const createRequestId = useRef<string | null>(null);
  const mutationRequestIds = useRef(new Map<string, string>());

  const requestIdFor = (key: string): string => {
    const existing = mutationRequestIds.current.get(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    mutationRequestIds.current.set(key, created);
    return created;
  };

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(false);
    try {
      const [loadedUsers, loadedMatrix] = await Promise.all([
        listProductUsers(),
        canReadMatrix ? listProductAccessMatrix() : Promise.resolve(null),
      ]);
      setUsers(loadedUsers);
      setMatrix(loadedMatrix);
    } catch {
      setUsers(null);
      setMatrix(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [canReadMatrix]);

  useEffect(() => { void load(); }, [load]);

  const selectedUser = useMemo(
    () => dialog && dialog !== 'create' ? users?.find((user) => user.userId === dialog) ?? null : null,
    [dialog, users],
  );

  useEffect(() => {
    if (!selectedUser) return;
    setEditDisplayName(selectedUser.displayName);
    setEditIdentifier(selectedUser.operationalIdentifier ?? '');
  }, [selectedUser?.userId]);

  const activeAssignmentsFor = useCallback((userId: string) => (
    matrix?.assignments.filter((assignment) => assignment.userId === userId && assignment.status === 'active') ?? []
  ), [matrix?.assignments]);

  const roleNamesFor = useCallback((userId: string): readonly string[] | null => {
    if (!matrix) return canReadMatrix ? [] : null;
    return activeAssignmentsFor(userId).flatMap((assignment) => {
      const role = matrix.roles.find((candidate) => candidate.roleId === assignment.roleId);
      return role ? [role.displayName] : [];
    });
  }, [activeAssignmentsFor, canReadMatrix, matrix]);

  const resetDialog = (): void => {
    setDialog(null);
    setDisplayName('');
    setIdentifier('');
    setEditDisplayName('');
    setEditIdentifier('');
    setSelectedRoleId('');
    setPin('');
    setConfirmingDeactivate(false);
  };

  const closeDialog = (): void => {
    if (busyAction === null) {
      setNotice(null);
      resetDialog();
    }
  };

  const openCreate = (): void => {
    setNotice(null);
    createRequestId.current = null;
    setDisplayName('');
    setIdentifier('');
    setDialog('create');
  };

  const openUser = (user: ProductUser): void => {
    setNotice(null);
    setEditDisplayName(user.displayName);
    setEditIdentifier(user.operationalIdentifier ?? '');
    setSelectedRoleId('');
    setPin('');
    setConfirmingDeactivate(false);
    setDialog(user.userId);
  };

  const refreshAssignments = async (): Promise<void> => {
    if (!canReadMatrix) return;
    setMatrix(await listProductAccessMatrix());
  };

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setNotice({ tone: 'danger', message: 'Escribe el nombre del usuario.' });
      return;
    }
    setBusyAction('create');
    setNotice(null);
    try {
      createRequestId.current ??= crypto.randomUUID();
      const created = await createProductUser({
        displayName: name,
        operationalIdentifier: identifier.trim() || null,
        clientRequestId: createRequestId.current,
      }, csrfToken);
      createRequestId.current = null;
      setUsers((current) => [...(current ?? []), created].sort((left, right) => left.displayName.localeCompare(right.displayName, 'es')));
      resetDialog();
      setNotice({ tone: 'success', message: `${created.displayName} fue creado. Ya puedes abrir su ficha para asignar roles y configurar su PIN.` });
    } catch {
      setNotice({ tone: 'danger', message: 'No fue posible crear el usuario. Revisa los datos e intenta de nuevo.' });
    } finally {
      setBusyAction(null);
    }
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedUser || !editDisplayName.trim()) {
      setNotice({ tone: 'danger', message: 'El nombre es obligatorio.' });
      return;
    }
    setBusyAction('profile');
    setNotice(null);
    try {
      const updated = await updateProductUser(selectedUser.userId, {
        displayName: editDisplayName.trim(),
        operationalIdentifier: editIdentifier.trim() || null,
        expectedVersion: selectedUser.version,
      }, csrfToken);
      const safeUpdated = { ...updated, pinConfigured: selectedUser.pinConfigured };
      setUsers((current) => current?.map((user) => user.userId === safeUpdated.userId ? safeUpdated : user) ?? current);
      setNotice({ tone: 'success', message: 'Los datos del usuario se actualizaron.' });
    } catch {
      setNotice({ tone: 'danger', message: 'No fue posible actualizar los datos. Recarga la información e intenta de nuevo.' });
    } finally {
      setBusyAction(null);
    }
  };

  const assignRole = async (): Promise<void> => {
    if (!selectedUser || !selectedRoleId) return;
    const requestKey = `assign:${selectedUser.userId}:${selectedRoleId}`;
    setBusyAction('role');
    setNotice(null);
    try {
      await assignProductRole(selectedUser.userId, selectedRoleId, requestIdFor(requestKey), csrfToken);
      mutationRequestIds.current.delete(requestKey);
      await refreshAssignments();
      setSelectedRoleId('');
      setNotice({ tone: 'success', message: 'Rol asignado. Sus permisos se aplican automáticamente.' });
    } catch {
      setNotice({ tone: 'danger', message: 'No fue posible asignar el rol.' });
    } finally {
      setBusyAction(null);
    }
  };

  const revokeRole = async (assignmentId: string, expectedVersion: number, roleName: string): Promise<void> => {
    if (!selectedUser) return;
    const requestKey = `revoke:${assignmentId}:${expectedVersion}`;
    setBusyAction(`role-${assignmentId}`);
    setNotice(null);
    try {
      await revokeProductRole(selectedUser.userId, assignmentId, expectedVersion, requestIdFor(requestKey), csrfToken);
      mutationRequestIds.current.delete(requestKey);
      await refreshAssignments();
      setNotice({ tone: 'success', message: `El rol ${roleName} fue retirado. Los permisos efectivos se recalcularon.` });
    } catch {
      setNotice({ tone: 'danger', message: `No fue posible retirar el rol ${roleName}.` });
    } finally {
      setBusyAction(null);
    }
  };

  const savePin = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedUser || !/^\d{4}$/u.test(pin)) {
      setNotice({ tone: 'danger', message: 'El PIN debe contener exactamente cuatro dígitos.' });
      return;
    }
    setBusyAction('pin');
    setNotice(null);
    try {
      await provisionProductLocalPin(selectedUser.userId, pin, crypto.randomUUID(), csrfToken);
      setUsers((current) => current?.map((user) => user.userId === selectedUser.userId ? { ...user, pinConfigured: true } : user) ?? current);
      setNotice({ tone: 'success', message: 'PIN configurado. El valor no se conserva ni vuelve a mostrarse.' });
    } catch {
      setNotice({ tone: 'danger', message: 'No fue posible configurar el PIN.' });
    } finally {
      setPin('');
      setBusyAction(null);
    }
  };

  const transitionStatus = async (status: 'active' | 'inactive'): Promise<void> => {
    if (!selectedUser) return;
    const requestKey = `status:${selectedUser.userId}:${selectedUser.version}:${status}`;
    setBusyAction('status');
    setNotice(null);
    try {
      const updated = await transitionProductUser(selectedUser.userId, {
        status,
        expectedVersion: selectedUser.version,
        clientRequestId: requestIdFor(requestKey),
      }, csrfToken);
      mutationRequestIds.current.delete(requestKey);
      const safeUpdated = { ...updated, pinConfigured: selectedUser.pinConfigured };
      setUsers((current) => current?.map((user) => user.userId === safeUpdated.userId ? safeUpdated : user) ?? current);
      setConfirmingDeactivate(false);
      setNotice({ tone: 'success', message: status === 'active'
        ? 'Usuario activado. Puede volver a iniciar sesión con su PIN vigente.'
        : 'Usuario desactivado. Conserva su identidad e historial, pero ya no puede iniciar sesión.' });
    } catch {
      setNotice({ tone: 'danger', message: 'No fue posible cambiar el estado del usuario.' });
    } finally {
      setBusyAction(null);
    }
  };

  const columns: readonly DataColumn<ProductUser>[] = [
    { key: 'name', header: 'Nombre', render: (user) => <strong className={styles.userName}>{user.displayName}</strong> },
    { key: 'identifier', header: 'ID operativo', render: (user) => user.operationalIdentifier ?? <span className={styles.muted}>Sin ID</span> },
    { key: 'roles', header: 'Roles', render: (user) => <RoleTags names={roleNamesFor(user.userId)} /> },
    { key: 'status', header: 'Estado', render: (user) => { const status = statusView(user.status); return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>; } },
    { key: 'pin', header: 'PIN', render: (user) => <span className={user.pinConfigured ? styles.pinReady : styles.muted}>{user.pinConfigured ? 'Configurado' : 'Pendiente'}</span> },
    { key: 'actions', header: 'Acciones', render: (user) => <Button size="compact" tone="secondary" data-user-edit-trigger={user.userId} onClick={() => openUser(user)}><Pencil aria-hidden="true" size={16} />{canManage ? 'Editar' : 'Ver'}</Button> },
  ];

  const activeAssignments = selectedUser ? activeAssignmentsFor(selectedUser.userId) : [];
  const assignedRoleIds = activeAssignments.map((assignment) => assignment.roleId);
  const availableRoles = matrix?.roles.filter((role) => role.status === 'active' && !assignedRoleIds.includes(role.roleId)) ?? [];
  const selectedStatus = selectedUser ? statusView(selectedUser.status) : null;

  return (
    <div className={styles.pageStack}>
      <PageHeader
        breadcrumb={[{ label: 'Configuración', to: '/configuracion' }, { label: 'Usuarios' }]}
        eyebrow="Administración del equipo"
        title="Usuarios"
        description="Gestiona quién puede operar en esta sucursal. El acceso se obtiene por roles; nunca se asignan permisos directamente a una persona."
        primaryAction={canManage ? <Button tone="primary" data-create-user-trigger onClick={openCreate}><Plus aria-hidden="true" size={18} />Nuevo usuario</Button> : undefined}
      />

      {!canManage ? <Alert tone="info" title="Modo de consulta">Puedes revisar el directorio, pero tu sesión no permite modificar usuarios.</Alert> : null}
      {dialog === null && notice ? <Alert tone={notice.tone}>{notice.message}</Alert> : null}

      {loading ? (
        <section className={styles.loadingState} aria-busy="true"><Spinner label="Cargando usuarios" /><span>Cargando directorio operativo…</span></section>
      ) : loadError || users === null ? (
        <div className={styles.errorState}>
          <ErrorState title="No pudimos cargar los usuarios" description="Verifica tu sesión y vuelve a intentar." />
          <Button tone="primary" onClick={() => void load()}>Reintentar</Button>
        </div>
      ) : (
        <>
          <section className={styles.summaryGrid} aria-label="Resumen de usuarios">
            <article><span className={styles.summaryIcon}><UsersRound aria-hidden="true" size={20} /></span><div><strong>{users.length}</strong><span>Usuarios registrados</span></div></article>
            <article><span className={styles.summaryIcon}><UserCheck aria-hidden="true" size={20} /></span><div><strong>{users.filter((user) => user.status === 'active').length}</strong><span>Usuarios activos</span></div></article>
            <article><span className={styles.summaryIcon}><KeyRound aria-hidden="true" size={20} /></span><div><strong>{users.filter((user) => user.pinConfigured).length}</strong><span>Con PIN configurado</span></div></article>
          </section>

          <section className={styles.surface} aria-labelledby="users-list-title">
            <header className={styles.surfaceHeader}><div><h2 id="users-list-title">Directorio operativo</h2><p>Las identidades se conservan en el historial; no se eliminan desde esta pantalla.</p></div></header>
            {users.length === 0 ? (
              <EmptyState title="Aún no hay usuarios" description="Crea la primera identidad operativa del equipo." compact />
            ) : (
              <ResponsiveDataList
                rows={users}
                columns={columns}
                rowKey={(user) => user.userId}
                label="Usuarios operativos"
                renderMobile={(user) => {
                  const status = statusView(user.status);
                  return (
                    <div className={styles.mobileUser}>
                      <header><div><strong>{user.displayName}</strong><span>{user.operationalIdentifier ?? 'Sin ID operativo'}</span></div><StatusBadge tone={status.tone}>{status.label}</StatusBadge></header>
                      <dl><div><dt>Roles</dt><dd><RoleTags names={roleNamesFor(user.userId)} /></dd></div><div><dt>PIN</dt><dd>{user.pinConfigured ? 'Configurado' : 'Pendiente'}</dd></div></dl>
                      <Button tone="secondary" data-user-edit-trigger={user.userId} onClick={() => openUser(user)}><Pencil aria-hidden="true" size={16} />{canManage ? 'Editar usuario' : 'Ver usuario'}</Button>
                    </div>
                  );
                }}
              />
            )}
          </section>
        </>
      )}

      <Dialog
        open={dialog === 'create'}
        title="Crear usuario"
        description="Registra primero su identidad. Después podrás asignar roles y configurar un PIN desde su ficha."
        restoreFocusSelector="[data-create-user-trigger]"
        onClose={closeDialog}
        footer={(
          <div className={styles.dialogActions}>
            <Button disabled={busyAction !== null} onClick={closeDialog}>Cancelar</Button>
            <Button form="create-user-form" type="submit" tone="primary" disabled={busyAction !== null}>{busyAction === 'create' ? 'Creando…' : 'Crear usuario'}</Button>
          </div>
        )}
      >
        <form id="create-user-form" className={styles.dialogForm} onSubmit={(event) => void submitCreate(event)}>
          {notice ? <Alert tone={notice.tone}>{notice.message}</Alert> : null}
          <Field id="new-user-name" label="Nombre completo" required><Input id="new-user-name" value={displayName} maxLength={160} disabled={busyAction !== null} autoComplete="off" onChange={(event) => setDisplayName(event.target.value)} /></Field>
          <Field id="new-user-identifier" label="ID operativo" hint="Opcional. Usa el alias con el que el equipo reconoce a esta persona."><Input id="new-user-identifier" value={identifier} maxLength={160} disabled={busyAction !== null} autoComplete="off" onChange={(event) => setIdentifier(event.target.value)} /></Field>
        </form>
      </Dialog>

      <Dialog
        open={selectedUser !== null}
        title={selectedUser?.displayName ?? 'Usuario'}
        description="Edita su identidad, roles, PIN y estado de acceso desde una sola ficha."
        size="wide"
        restoreFocusSelector={selectedUser ? `[data-user-edit-trigger="${selectedUser.userId}"]` : undefined}
        onClose={closeDialog}
        footer={<Button tone="primary" disabled={busyAction !== null} onClick={closeDialog}>Cerrar</Button>}
      >
        {selectedUser && selectedStatus ? (
          <div className={styles.userEditor}>
            {notice ? <Alert tone={notice.tone}>{notice.message}</Alert> : null}
            <section className={styles.editorSection} aria-labelledby="identity-section-title">
              <header><span className={styles.sectionIcon}><UserPlus aria-hidden="true" size={20} /></span><div><h3 id="identity-section-title">Identidad operativa</h3><p>Información visible para reconocer a la persona en la operación.</p></div></header>
              <form className={styles.sectionForm} onSubmit={(event) => void saveProfile(event)}>
                <Field id="edit-user-name" label="Nombre completo" required><Input id="edit-user-name" value={editDisplayName} maxLength={160} disabled={!canManage || busyAction !== null} autoComplete="off" onChange={(event) => setEditDisplayName(event.target.value)} /></Field>
                <Field id="edit-user-identifier" label="ID operativo"><Input id="edit-user-identifier" value={editIdentifier} maxLength={160} disabled={!canManage || busyAction !== null} autoComplete="off" onChange={(event) => setEditIdentifier(event.target.value)} /></Field>
                {canManage ? <Button type="submit" tone="secondary" disabled={busyAction !== null}>{busyAction === 'profile' ? 'Guardando…' : 'Guardar datos'}</Button> : null}
              </form>
            </section>

            <section className={styles.editorSection} aria-labelledby="roles-section-title">
              <header><span className={styles.sectionIcon}><ShieldCheck aria-hidden="true" size={20} /></span><div><h3 id="roles-section-title">Roles</h3><p>Sus permisos efectivos son la unión de estos roles. No existen permisos directos por usuario.</p></div></header>
              {matrix ? (
                <div className={styles.assignmentStack}>
                  {activeAssignments.length === 0 ? <span className={styles.muted}>Sin roles asignados</span> : activeAssignments.map((assignment) => {
                    const role = matrix.roles.find((candidate) => candidate.roleId === assignment.roleId);
                    if (!role) return null;
                    return <div key={assignment.assignmentId} className={styles.assignmentRow}><span>{role.displayName}</span>{canManage ? <Button size="compact" tone="quiet" disabled={busyAction !== null} aria-label={`Quitar ${role.displayName} de ${selectedUser.displayName}`} onClick={() => void revokeRole(assignment.assignmentId, assignment.version, role.displayName)}>{busyAction === `role-${assignment.assignmentId}` ? 'Quitando…' : 'Quitar'}</Button> : null}</div>;
                  })}
                  {canManage && availableRoles.length > 0 ? <div className={styles.assignmentControls}><label htmlFor="assign-user-role">Asignar otro rol</label><div><select id="assign-user-role" value={selectedRoleId} disabled={busyAction !== null} onChange={(event) => setSelectedRoleId(event.target.value)}><option value="">Selecciona un rol…</option>{availableRoles.map((role) => <option key={role.roleId} value={role.roleId}>{role.displayName}</option>)}</select><Button tone="secondary" disabled={!selectedRoleId || busyAction !== null} onClick={() => void assignRole()}>{busyAction === 'role' ? 'Asignando…' : 'Asignar rol'}</Button></div></div> : null}
                </div>
              ) : <Alert tone="info">La matriz de roles no está disponible para esta sesión.</Alert>}
            </section>

            <section className={styles.editorSection} aria-labelledby="pin-section-title">
              <header><span className={styles.sectionIcon}><KeyRound aria-hidden="true" size={20} /></span><div><h3 id="pin-section-title">PIN de acceso</h3><p>{selectedUser.pinConfigured ? 'PIN configurado. Usa esta acción sólo para reemplazarlo.' : 'Aún no tiene un PIN configurado.'}</p></div></header>
              {canManage ? (
                <form className={styles.pinForm} onSubmit={(event) => void savePin(event)}>
                  <Field id="edit-user-pin" label={selectedUser.pinConfigured ? 'Nuevo PIN' : 'PIN'} hint="Exactamente 4 dígitos. No se mostrará después de guardarlo." required>
                    <Input id="edit-user-pin" name="new-pin" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="new-password" aria-describedby="edit-user-pin-description" value={pin} disabled={busyAction !== null} onChange={(event) => setPin(event.target.value.replace(/\D/gu, '').slice(0, 4))} />
                  </Field>
                  <Button type="submit" tone="secondary" disabled={busyAction !== null || pin.length !== 4}>{busyAction === 'pin' ? 'Guardando…' : selectedUser.pinConfigured ? 'Cambiar PIN' : 'Configurar PIN'}</Button>
                </form>
              ) : null}
            </section>

            <section className={styles.editorSection} aria-labelledby="status-section-title">
              <header><span className={styles.sectionIcon}><UserCheck aria-hidden="true" size={20} /></span><div><h3 id="status-section-title">Estado de acceso</h3><p>Desactivar conserva la identidad y el historial, pero bloquea nuevos inicios de sesión.</p></div></header>
              <div className={styles.statusControls}>
                <StatusBadge tone={selectedStatus.tone}>{selectedStatus.label}</StatusBadge>
                {canManage && selectedUser.status === 'inactive' ? <Button tone="secondary" disabled={busyAction !== null} onClick={() => void transitionStatus('active')}>{busyAction === 'status' ? 'Activando…' : 'Activar usuario'}</Button> : null}
                {canManage && selectedUser.status === 'active' && !confirmingDeactivate ? <Button tone="danger" disabled={busyAction !== null} onClick={() => setConfirmingDeactivate(true)}>Desactivar usuario</Button> : null}
              </div>
              {confirmingDeactivate ? <Alert tone="warning" title="Confirma la desactivación"><span>El usuario no podrá iniciar sesión hasta que vuelvas a activarlo.</span><div className={styles.confirmActions}><Button disabled={busyAction !== null} onClick={() => setConfirmingDeactivate(false)}>Cancelar</Button><Button tone="danger" disabled={busyAction !== null} onClick={() => void transitionStatus('inactive')}>{busyAction === 'status' ? 'Desactivando…' : 'Sí, desactivar'}</Button></div></Alert> : null}
            </section>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
