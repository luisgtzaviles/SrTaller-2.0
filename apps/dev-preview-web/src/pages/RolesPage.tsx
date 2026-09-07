import { KeyRound, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Alert, Spinner } from '../components/ui/feedback.js';
import { Button, Field, Input } from '../components/ui/controls.js';
import { PageHeader } from '../components/ui/navigation.js';
import {
  createProductRole,
  humanCapabilityLabel,
  listProductAccessMatrix,
  replaceProductRoleCapabilities,
} from '../users-api.js';
import type { ProductAccessMatrix } from '../users-api.js';
import styles from './roles-page.module.css';

export function RolesPage({ csrfToken }: Readonly<{ csrfToken: string }>): React.JSX.Element {
  const [matrix, setMatrix] = useState<ProductAccessMatrix | null>(null);
  const [error, setError] = useState(false);
  const [roleKey, setRoleKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<readonly string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingCapabilities, setEditingCapabilities] = useState<readonly string[]>([]);
  const load = useCallback(async (): Promise<void> => {
    try { setMatrix(await listProductAccessMatrix()); } catch { setError(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!matrix || !roleKey.trim() || !displayName.trim() || selectedCapabilities.length === 0) {
      setError(true);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      const created = await createProductRole({
        roleKey: roleKey.trim(),
        displayName: displayName.trim(),
        capabilityCodes: selectedCapabilities,
      }, csrfToken);
      setMatrix((current) => current ? { ...current, roles: [...current.roles, created].sort((left, right) => left.roleKey.localeCompare(right.roleKey)) } : current);
      setRoleKey(''); setDisplayName(''); setSelectedCapabilities([]);
    } catch { setError(true); } finally { setSaving(false); }
  };

  const replaceCapabilities = async (roleId: string): Promise<void> => {
    const role = matrix?.roles.find((candidate) => candidate.roleId === roleId);
    if (!role || editingCapabilities.length === 0) return;
    setSaving(true);
    setError(false);
    try {
      const updated = await replaceProductRoleCapabilities(roleId, {
        expectedVersion: role.version,
        capabilityCodes: editingCapabilities,
      }, csrfToken);
      setMatrix((current) => current ? {
        ...current,
        roles: current.roles.map((candidate) => candidate.roleId === updated.roleId ? updated : candidate),
      } : current);
      setEditingRoleId(null);
      setEditingCapabilities([]);
    } catch { setError(true); } finally { setSaving(false); }
  };

  return (
    <div className={styles.pageStack}>
        <PageHeader eyebrow="Configuración · Roles" title="Roles y permisos" description="Los permisos efectivos se heredan de roles; un usuario no recibe permisos directos." />
      {error ? <Alert tone="danger">No fue posible cargar la matriz de acceso.</Alert> : null}
      {matrix === null ? <Spinner label="Cargando roles" /> : (
        <section className={styles.layout}>
          <article className={styles.card}>
            <header><ShieldCheck size={20} aria-hidden="true" /><div><h2>Roles</h2><p>Capacidades definidas por rol, no directamente por usuario.</p></div></header>
            <ul className={styles.roleList}>
              {matrix.roles.map((role) => <li key={role.roleId}><div><strong>{role.displayName}</strong><span>{role.roleKey}</span></div><div className={styles.capabilities}>{role.capabilityCodes.map((code) => <span key={code}>{humanCapabilityLabel(code)}</span>)}</div>{editingRoleId === role.roleId ? <div className={styles.form}><fieldset className={styles.checklist}><legend>Permisos de {role.displayName}</legend>{matrix.capabilities.map((capability) => <label key={capability.capabilityCode}><input type="checkbox" checked={editingCapabilities.includes(capability.capabilityCode)} disabled={saving} onChange={() => setEditingCapabilities((current) => current.includes(capability.capabilityCode) ? current.filter((code) => code !== capability.capabilityCode) : [...current, capability.capabilityCode])} />{humanCapabilityLabel(capability.capabilityCode)}</label>)}</fieldset><Button tone="primary" type="button" disabled={saving || editingCapabilities.length === 0} onClick={() => void replaceCapabilities(role.roleId)}>Guardar permisos</Button></div> : <Button tone="secondary" type="button" disabled={saving} onClick={() => { setEditingRoleId(role.roleId); setEditingCapabilities(role.capabilityCodes); }}>Editar permisos</Button>}</li>)}
            </ul>
          </article>
          <article className={styles.card}>
            <header><KeyRound size={20} aria-hidden="true" /><div><h2>Catálogo de permisos</h2><p>El servidor determina cuáles pueden ser asignados.</p></div></header>
            <div className={styles.capabilities}>{matrix.capabilities.map((capability) => <span key={capability.capabilityCode}>{humanCapabilityLabel(capability.capabilityCode)}</span>)}</div>
          </article>
          <article className={styles.card}>
            <header><KeyRound size={20} aria-hidden="true" /><div><h2>Nuevo rol</h2><p>Elige al menos un permiso. Se guarda todo en una sola operación.</p></div></header>
            <form className={styles.form} onSubmit={(event) => void submit(event)}>
              <Field id="role-name" label="Nombre" required><Input id="role-name" value={displayName} maxLength={160} disabled={saving} onChange={(event) => setDisplayName(event.target.value)} /></Field>
              <Field id="role-key" label="Clave" required hint="Minúsculas y guiones bajos; por ejemplo, supervisor_local."><Input id="role-key" value={roleKey} maxLength={64} disabled={saving} onChange={(event) => setRoleKey(event.target.value.replace(/[^a-z0-9_]/gu, ''))} /></Field>
              <fieldset className={styles.checklist}><legend>Permisos</legend>{matrix.capabilities.map((capability) => <label key={capability.capabilityCode}><input type="checkbox" checked={selectedCapabilities.includes(capability.capabilityCode)} disabled={saving} onChange={() => setSelectedCapabilities((current) => current.includes(capability.capabilityCode) ? current.filter((code) => code !== capability.capabilityCode) : [...current, capability.capabilityCode])} />{humanCapabilityLabel(capability.capabilityCode)}</label>)}</fieldset>
              <Button tone="primary" type="submit" disabled={saving}>{saving ? 'Creando…' : 'Crear rol'}</Button>
            </form>
          </article>
        </section>
      )}
    </div>
  );
}
