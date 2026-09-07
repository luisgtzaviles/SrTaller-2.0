import { UserPlus, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Alert, EmptyState, Spinner } from '../components/ui/feedback.js';
import { Button, Field, Input } from '../components/ui/controls.js';
import { PageHeader } from '../components/ui/navigation.js';
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

export function UsersPage({ csrfToken }: Readonly<{ csrfToken: string }>): React.JSX.Element {
  const [users, setUsers] = useState<readonly ProductUser[] | null>(null);
  const [matrix, setMatrix] = useState<ProductAccessMatrix | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [roleByUser, setRoleByUser] = useState<Record<string, string>>({});
  const [pinByUser, setPinByUser] = useState<Record<string, string>>({});
  const [pinConfiguredByUser, setPinConfiguredByUser] = useState<Record<string, boolean>>({});
  const [profileByUser, setProfileByUser] = useState<Record<string, { displayName: string; operationalIdentifier: string }>>({});

  const load = useCallback(async (): Promise<void> => {
    try {
      const [loadedUsers, loadedMatrix] = await Promise.all([listProductUsers(), listProductAccessMatrix()]);
      setUsers(loadedUsers);
      setPinConfiguredByUser(Object.fromEntries(loadedUsers.map((user) => [user.userId, user.pinConfigured])));
      setMatrix(loadedMatrix);
    } catch {
      setMessage('No fue posible cargar los usuarios. Verifica tu sesión y vuelve a intentar.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setMessage('Escribe el nombre del usuario.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const created = await createProductUser({
        displayName: name,
        operationalIdentifier: identifier.trim() || null,
        clientRequestId: crypto.randomUUID(),
      }, csrfToken);
      setUsers((current) => [...(current ?? []), created].sort((left, right) => left.displayName.localeCompare(right.displayName, 'es')));
      setDisplayName('');
      setIdentifier('');
      setMessage(`${created.displayName} fue creado. La asignación de roles y PIN se habilitará en el siguiente bloque.`);
    } catch {
      setMessage('No fue posible crear el usuario. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const assignRole = async (userId: string): Promise<void> => {
    const roleId = roleByUser[userId];
    if (!roleId) return;
    try {
      await assignProductRole(userId, roleId, csrfToken);
      await load();
      setMessage('Rol asignado. Los permisos se heredan del rol, sin permisos directos.');
    } catch { setMessage('No fue posible asignar el rol.'); }
  };

  const provisionPin = async (userId: string): Promise<void> => {
    const pin = pinByUser[userId] ?? '';
    if (!/^\d{4}$/u.test(pin)) {
      setMessage('El PIN local debe tener cuatro dígitos.');
      return;
    }
    try {
      await provisionProductLocalPin(userId, pin, csrfToken);
      setPinByUser((current) => ({ ...current, [userId]: '' }));
      setPinConfiguredByUser((current) => ({ ...current, [userId]: true }));
      setMessage('PIN local asignado. No se muestra ni se guarda en esta pantalla.');
    } catch { setMessage('No fue posible asignar el PIN local.'); }
  };

  const toggleStatus = async (user: ProductUser): Promise<void> => {
    try {
      const updated = await transitionProductUser(user.userId, {
        status: user.status === 'active' ? 'inactive' : 'active',
        expectedVersion: user.version,
      }, csrfToken);
      setUsers((current) => current?.map((candidate) => candidate.userId === updated.userId ? updated : candidate) ?? current);
      setMessage(updated.status === 'active' ? 'Usuario activado.' : 'Usuario desactivado. Conserva su identidad e historial.');
    } catch { setMessage('No fue posible cambiar el estado del usuario.'); }
  };

  const saveProfile = async (user: ProductUser): Promise<void> => {
    const draft = profileByUser[user.userId] ?? { displayName: user.displayName, operationalIdentifier: user.operationalIdentifier ?? '' };
    if (!draft.displayName.trim()) { setMessage('El nombre es obligatorio.'); return; }
    try {
      const updated = await updateProductUser(user.userId, { displayName: draft.displayName.trim(), operationalIdentifier: draft.operationalIdentifier.trim() || null, expectedVersion: user.version }, csrfToken);
      setUsers((current) => current?.map((candidate) => candidate.userId === updated.userId ? updated : candidate) ?? current);
      setProfileByUser((current) => { const next = { ...current }; delete next[user.userId]; return next; });
      setMessage('Datos del usuario actualizados.');
    } catch { setMessage('No fue posible actualizar el usuario.'); }
  };

  const revokeRole = async (userId: string, assignmentId: string, expectedVersion: number): Promise<void> => {
    try { await revokeProductRole(userId, assignmentId, expectedVersion, csrfToken); await load(); setMessage('Rol retirado. Los permisos efectivos fueron recalculados.'); }
    catch { setMessage('No fue posible retirar el rol.'); }
  };

  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="Configuración · Usuarios"
        title="Usuarios"
        description="Administra las identidades operativas de esta sucursal local."
      />
      <section className={styles.layout}>
        <article className={styles.card}>
          <header><UsersRound size={20} aria-hidden="true" /><div><h2>Directorio operativo</h2><p>Usuarios disponibles para la operación local.</p></div></header>
          {users === null ? <Spinner label="Cargando usuarios" /> : users.length === 0 ? (
            <EmptyState title="Sin usuarios" description="Crea el primer usuario operativo para esta sesión local." compact />
          ) : (
            <ul className={styles.userList}>
              {users.map((user) => {
                const assignments = matrix?.assignments.filter((assignment) => assignment.userId === user.userId && assignment.status === 'active') ?? [];
                const assignedRoleIds = assignments.map((assignment) => assignment.roleId);
                const assignedRoles = assignments.flatMap((assignment) => {
                  const role = matrix?.roles.find((candidate) => candidate.roleId === assignment.roleId);
                  return role ? [{ assignment, role }] : [];
                });
                const pinConfigured = pinConfiguredByUser[user.userId] ?? user.pinConfigured;
                const draft = profileByUser[user.userId] ?? { displayName: user.displayName, operationalIdentifier: user.operationalIdentifier ?? '' };
                const changeDraft = (field: 'displayName' | 'operationalIdentifier', value: string) => setProfileByUser((current) => ({ ...current, [user.userId]: { ...draft, [field]: value } }));
                return <li key={user.userId}><div><strong>{user.displayName}</strong><span>{user.operationalIdentifier ? `ID operativo: ${user.operationalIdentifier}` : 'Sin identificador operativo'}</span><div className={styles.actions}><Input aria-label={`Nombre para ${user.displayName}`} value={draft.displayName} maxLength={160} onChange={(event) => changeDraft('displayName', event.target.value)} /><Input aria-label={`Identificador para ${user.displayName}`} value={draft.operationalIdentifier} maxLength={160} onChange={(event) => changeDraft('operationalIdentifier', event.target.value)} /><Button size="compact" tone="secondary" onClick={() => void saveProfile(user)}>Guardar datos</Button></div><span>{assignedRoles.length ? 'Roles:' : 'Sin roles asignados'}</span>{assignedRoles.map(({ assignment, role }) => <div className={styles.actions} key={assignment.assignmentId}><span>{role.displayName}</span><Button size="compact" tone="quiet" onClick={() => void revokeRole(user.userId, assignment.assignmentId, assignment.version)}>Quitar rol</Button></div>)}<div className={styles.actions}><select aria-label={`Rol para ${user.displayName}`} value={roleByUser[user.userId] ?? ''} onChange={(event) => setRoleByUser((current) => ({ ...current, [user.userId]: event.target.value }))}><option value="">Asignar rol…</option>{matrix?.roles.filter((role) => role.status === 'active' && !assignedRoleIds.includes(role.roleId)).map((role) => <option key={role.roleId} value={role.roleId}>{role.displayName}</option>)}</select><Button size="compact" tone="secondary" onClick={() => void assignRole(user.userId)}>Asignar</Button></div><div className={styles.actions}>{pinConfigured ? <span className={styles.pinStatus}>PIN configurado</span> : null}<Input aria-label={`PIN local para ${user.displayName}`} inputMode="numeric" maxLength={4} value={pinByUser[user.userId] ?? ''} onChange={(event) => setPinByUser((current) => ({ ...current, [user.userId]: event.target.value.replace(/[^0-9]/gu, '') }))} placeholder="PIN 4 dígitos" /><Button size="compact" tone="secondary" onClick={() => void provisionPin(user.userId)}>{pinConfigured ? 'Cambiar PIN' : 'Asignar PIN'}</Button></div></div><div className={styles.userControls}><span className={styles.status}>{user.status === 'active' ? 'Activo' : 'Inactivo'}</span><Button size="compact" tone={user.status === 'active' ? 'danger' : 'secondary'} onClick={() => void toggleStatus(user)}>{user.status === 'active' ? 'Desactivar' : 'Activar'}</Button></div></li>;
              })}
            </ul>
          )}
        </article>
        <article className={styles.card}>
          <header><UserPlus size={20} aria-hidden="true" /><div><h2>Nuevo usuario</h2><p>El identificador y la fecha los determina el servidor.</p></div></header>
          <form className={styles.form} onSubmit={(event) => void submit(event)}>
            <Field id="product-user-name" label="Nombre" required><Input id="product-user-name" value={displayName} maxLength={160} disabled={saving} onChange={(event) => setDisplayName(event.target.value)} /></Field>
            <Field id="product-user-identifier" label="Identificador operativo" hint="Opcional; por ejemplo, el alias local."><Input id="product-user-identifier" value={identifier} maxLength={160} disabled={saving} onChange={(event) => setIdentifier(event.target.value)} /></Field>
            {message ? <Alert tone={message.includes('creado') ? 'success' : 'danger'}>{message}</Alert> : null}
            <Button tone="primary" type="submit" disabled={saving}>{saving ? 'Creando…' : 'Crear usuario'}</Button>
          </form>
        </article>
      </section>
    </div>
  );
}
