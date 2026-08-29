export const repairStatusCatalog = Object.freeze({
  pending: Object.freeze({ label: 'Pendiente', tone: 'neutral' as const }),
  diagnosing: Object.freeze({ label: 'En diagnóstico', tone: 'info' as const }),
  awaiting_authorization: Object.freeze({ label: 'Espera de autorización', tone: 'warning' as const }),
  awaiting_part: Object.freeze({ label: 'Espera de refacción', tone: 'warning' as const }),
  repairing: Object.freeze({ label: 'En reparación', tone: 'info' as const }),
  reviewing: Object.freeze({ label: 'En revisión', tone: 'info' as const }),
  ready: Object.freeze({ label: 'Listo', tone: 'success' as const }),
  unsuccessful: Object.freeze({ label: 'No quedó', tone: 'neutral' as const }),
  cancelled: Object.freeze({ label: 'Cancelado', tone: 'neutral' as const }),
  delivered: Object.freeze({ label: 'Entregado', tone: 'success' as const }),
});

export type RepairStatusCode = keyof typeof repairStatusCatalog;
export const repairStatusCodes = Object.freeze(
  Object.keys(repairStatusCatalog) as RepairStatusCode[],
);

export const custodyStatusCatalog = Object.freeze({
  active: Object.freeze({ label: 'En tienda', tone: 'neutral' as const }),
  ended: Object.freeze({ label: 'Entregado', tone: 'neutral' as const }),
});

export type CustodyStatusCode = keyof typeof custodyStatusCatalog;
export const custodyStatusCodes = Object.freeze(
  Object.keys(custodyStatusCatalog) as CustodyStatusCode[],
);
