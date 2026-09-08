import { Building2, CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getBranchSettings,
  updateBranchTimeZone,
} from '../branch-settings-api.js';
import {
  branchTimeZoneOptions,
  humanBranchTimeZoneLabel,
} from '../branch-time-zones.mjs';
import { Button, ButtonLink, Field } from '../components/ui/controls.js';
import { ErrorState, Spinner } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import styles from './settings-page.module.css';

type Notice = Readonly<{ tone: 'success' | 'danger'; message: string }>;

export function BranchSettingsPage({ csrfToken }: Readonly<{ csrfToken: string }>): React.JSX.Element {
  const [persistedTimeZone, setPersistedTimeZone] = useState<string | null>(null);
  const [selectedTimeZone, setSelectedTimeZone] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setFailed(false);
    try {
      const settings = await getBranchSettings();
      setPersistedTimeZone(settings.timeZone);
      setSelectedTimeZone(settings.timeZone);
    } catch {
      setPersistedTimeZone(null);
      setSelectedTimeZone('');
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const options = useMemo(
    () => persistedTimeZone ? branchTimeZoneOptions(persistedTimeZone) : [],
    [persistedTimeZone],
  );

  const save = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedTimeZone || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const settings = await updateBranchTimeZone(selectedTimeZone, csrfToken);
      setPersistedTimeZone(settings.timeZone);
      setSelectedTimeZone(settings.timeZone);
      setNotice({ tone: 'success', message: 'Zona horaria guardada.' });
    } catch {
      setNotice({ tone: 'danger', message: 'No fue posible guardar la zona horaria.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageStack}>
      <PageHeader
        breadcrumb={[{ label: 'Configuración', to: '/configuracion' }, { label: 'Sucursal' }]}
        eyebrow="Configuración de sucursal"
        title="Sucursal"
        description="Administra la zona horaria de la sucursal vinculada a esta estación."
      />

      {loading ? <Spinner label="Cargando configuración de sucursal" /> : null}
      {failed ? <ErrorState title="No fue posible cargar la sucursal" description="Verifica tu sesión y vuelve a cargar la página." /> : null}
      {persistedTimeZone ? (
        <section className={styles.branchSettingsCard} aria-labelledby="branch-settings-title">
          <header className={styles.cardTitleRow}>
            <span className={styles.cardIcon} aria-hidden="true"><Building2 size={20} /></span>
            <div>
              <span className={styles.sectionEyebrow}>Sucursal vinculada</span>
              <h2 id="branch-settings-title">General</h2>
              <p>La zona se usa para presentar fechas y horas locales. Los instantes históricos siguen en UTC.</p>
            </div>
          </header>

          <form className={styles.branchSettingsForm} onSubmit={(event) => void save(event)}>
            <Field id="branch-time-zone" label="Zona horaria" hint="El horario mostrado se calcula desde la zona seleccionada.">
              <select
                id="branch-time-zone"
                className={styles.timeZoneSelect}
                value={selectedTimeZone}
                onChange={(event) => setSelectedTimeZone(event.target.value)}
                disabled={saving}
              >
                {options.map((option) => (
                  <option key={option.timeZone} value={option.timeZone}>
                    {humanBranchTimeZoneLabel(option.timeZone)}
                  </option>
                ))}
              </select>
            </Field>
            <p className={styles.ianaNote}>Zona IANA: <code>{persistedTimeZone}</code></p>
            {notice ? (
              <p className={notice.tone === 'success' ? styles.successNotice : styles.errorNotice} role="status">
                {notice.tone === 'success' ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
                {notice.message}
              </p>
            ) : null}
            <div className={styles.branchSettingsActions}>
              <Button tone="primary" type="submit" disabled={saving || selectedTimeZone === persistedTimeZone}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <ButtonLink to="/configuracion" tone="secondary">Volver a configuración</ButtonLink>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
