const equipmentFields = Object.freeze([
  'deviceType',
  'deviceBrand',
  'deviceModel',
  'deviceIdentifier',
  'deviceColor',
  'physicalConditionSummary',
  'simIncluded',
  'memoryCardIncluded',
  'receivedPowerState',
]);

function visible(fieldStates, key) {
  return fieldStates[key] !== 'hidden';
}

/** Guided V2 changes presentation only. These steps map to the shared Classic
 * validation sections and omit policy-driven groups that would be empty. */
export function resolveGuidedNewRepairSteps(fieldStates = {}) {
  const steps = [
    Object.freeze({ id: 'customer', title: 'Cliente', description: 'Identifica a la persona y confirma su contacto.' }),
  ];
  if (equipmentFields.some((key) => visible(fieldStates, key))) {
    steps.push(Object.freeze({ id: 'equipment', title: 'Equipo', description: 'Registra el equipo y cómo se recibe.' }));
  }
  steps.push(Object.freeze({ id: 'reception', title: 'Motivo y condiciones', description: 'Documenta el problema y las condiciones de recepción.' }));
  if (visible(fieldStates, 'deviceAccessType')) {
    steps.push(Object.freeze({ id: 'access', title: 'Acceso', description: 'Registra de forma temporal cómo acceder al equipo.' }));
  }
  if (visible(fieldStates, 'estimatedDeliveryLocal') || visible(fieldStates, 'initialBudgetAmount')) {
    steps.push(Object.freeze({ id: 'commitment', title: 'Compromiso', description: 'Define la referencia inicial para el cliente.' }));
  }
  steps.push(Object.freeze({ id: 'review', title: 'Revisión', description: 'Confirma la recepción antes de crear la reparación.' }));
  return Object.freeze(steps);
}

export function guidedAccessSummary(type, credentialReady) {
  if (!type) return 'Pendiente';
  if (type === 'none') return 'Sin bloqueo';
  if (type === 'pin') return credentialReady ? 'PIN proporcionado' : 'PIN pendiente';
  if (type === 'password') return credentialReady ? 'Contraseña proporcionada' : 'Contraseña pendiente';
  if (type === 'pattern') return credentialReady ? 'Patrón capturado' : 'Patrón pendiente';
  return 'Pendiente';
}

/** The datetime-local value already represents Branch wall-clock time. Format
 * those components for review without converting them through browser time. */
export function formatGuidedLocalDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u.exec(value);
  if (!match) return '';
  const [, year, month, day, hour, minute] = match;
  const instant = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)));
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(instant);
}

export function formatGuidedMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || value.trim() === '') return '';
  return `$${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(amount)} MXN`;
}
