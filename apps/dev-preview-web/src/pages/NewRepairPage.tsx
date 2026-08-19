import { Save } from 'lucide-react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createPreviewRepair } from '../api.js';
import type { CreatePreviewRepairRequest } from '../api.js';
import { Button, ButtonLink, Field, FormSection, Input, Textarea } from '../components/ui/controls.js';
import { Alert } from '../components/ui/feedback.js';
import { PageHeader } from '../components/ui/navigation.js';
import styles from './pages.module.css';

export function NewRepairPage(): React.JSX.Element {
  const prefix = useId();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const values = new FormData(event.currentTarget);
    const optional = (name: string): string | null => {
      const value = String(values.get(name) ?? '').trim();
      return value || null;
    };
    const request: CreatePreviewRepairRequest = {
      customerName: String(values.get('customerName') ?? '').trim(),
      customerPhone: String(values.get('customerPhone') ?? '').trim(),
      deviceBrand: String(values.get('deviceBrand') ?? '').trim(),
      deviceModel: String(values.get('deviceModel') ?? '').trim(),
      deviceSerial: optional('deviceSerial'),
      deviceColor: optional('deviceColor'),
      reportedProblem: String(values.get('reportedProblem') ?? '').trim(),
      physicalCondition: optional('physicalCondition'),
      notes: optional('notes'),
      estimatedPrice: optional('estimatedPrice') === null ? null : Number(values.get('estimatedPrice')),
      depositAmount: Number(values.get('depositAmount') ?? 0),
    };
    try {
      const repair = await createPreviewRepair(request);
      await navigate(`/reparaciones/${repair.id}`, { replace: true });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar la reparación.');
      setSaving(false);
    }
  }

  const describedBy = (name: string): string => `${prefix}-${name}-description`;
  return (
    <div className={`${styles.pageStack} ${styles.narrow}`}>
      <PageHeader
        eyebrow="Recepción sintética"
        title="Nueva reparación"
        description="Representación visual del formulario V1. El envío no puede persistir hasta materializar la API correspondiente."
        breadcrumb={[{ label: 'Reparaciones', to: '/reparaciones' }, { label: 'Nueva reparación' }]}
        secondaryActions={<ButtonLink to="/reparaciones">Cancelar</ButtonLink>}
      />
      {error ? <Alert tone="danger" title="No fue posible guardar">{error}</Alert> : null}
      <form className={styles.formSurface} onSubmit={(event) => { void submit(event); }}>
        <FormSection step={1} title="Cliente" description="Datos de contacto sintéticos para esta demostración.">
          <Field id={`${prefix}-customerName`} label="Nombre completo" required>
            <Input id={`${prefix}-customerName`} name="customerName" required autoComplete="name" placeholder="Cliente de prueba" />
          </Field>
          <Field id={`${prefix}-customerPhone`} label="Teléfono" required>
            <Input id={`${prefix}-customerPhone`} name="customerPhone" required inputMode="tel" autoComplete="tel" placeholder="662 000 0000" />
          </Field>
        </FormSection>
        <FormSection step={2} title="Equipo" description="Identificación del dispositivo recibido.">
          <Field id={`${prefix}-deviceBrand`} label="Marca" required><Input id={`${prefix}-deviceBrand`} name="deviceBrand" required placeholder="Marca" /></Field>
          <Field id={`${prefix}-deviceModel`} label="Modelo" required><Input id={`${prefix}-deviceModel`} name="deviceModel" required placeholder="Modelo" /></Field>
          <Field id={`${prefix}-deviceSerial`} label="IMEI o serie" hint="Opcional"><Input id={`${prefix}-deviceSerial`} name="deviceSerial" aria-describedby={describedBy('deviceSerial')} placeholder="Identificador sintético" /></Field>
          <Field id={`${prefix}-deviceColor`} label="Color" hint="Opcional"><Input id={`${prefix}-deviceColor`} name="deviceColor" aria-describedby={describedBy('deviceColor')} placeholder="Color del equipo" /></Field>
        </FormSection>
        <FormSection step={3} title="Recepción" description="Motivo, condición e importes iniciales.">
          <Field id={`${prefix}-reportedProblem`} label="Problema reportado" required fullWidth><Textarea id={`${prefix}-reportedProblem`} name="reportedProblem" required rows={4} placeholder="Describe el problema reportado" /></Field>
          <Field id={`${prefix}-physicalCondition`} label="Condición física" hint="Opcional" fullWidth><Textarea id={`${prefix}-physicalCondition`} name="physicalCondition" aria-describedby={describedBy('physicalCondition')} rows={3} placeholder="Estado visible del equipo" /></Field>
          <Field id={`${prefix}-notes`} label="Observaciones" hint="Opcional" fullWidth><Textarea id={`${prefix}-notes`} name="notes" aria-describedby={describedBy('notes')} rows={3} placeholder="Accesorios u observaciones" /></Field>
          <Field id={`${prefix}-estimatedPrice`} label="Precio estimado" hint="Monto sintético en MXN"><Input id={`${prefix}-estimatedPrice`} name="estimatedPrice" aria-describedby={describedBy('estimatedPrice')} type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" /></Field>
          <Field id={`${prefix}-depositAmount`} label="Anticipo" hint="Monto sintético en MXN"><Input id={`${prefix}-depositAmount`} name="depositAmount" aria-describedby={describedBy('depositAmount')} type="number" min="0" step="0.01" inputMode="decimal" defaultValue="0.00" /></Field>
        </FormSection>
        <footer className={styles.formActions}><span>Datos descartables; API no disponible.</span><Button type="submit" tone="primary" disabled={saving}><Save aria-hidden="true" size={20} />{saving ? 'Guardando…' : 'Guardar reparación'}</Button></footer>
      </form>
    </div>
  );
}
