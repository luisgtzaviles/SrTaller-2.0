# D6.1 — transición local a diagnóstico

## Estado y alcance

- **Estado:** implementación local autorizada; sin commit, integración ni deploy.
- **Command:** `StartRepairDiagnosis`.
- **Única transición escribible:** `Pendiente → En diagnóstico`.
- **Fuera de alcance:** Location, writes de Custody, blockers, estados
  posteriores, Delivery, finanzas, identidad y capabilities productivas.

## Contrato

`POST /api/repairs/:repairId/workflow/start-diagnosis` acepta únicamente:

```json
{
  "clientRequestId": "uuid",
  "expectedVersion": 0
}
```

La aplicación resuelve tenant, sucursal y actor sintético del contexto local;
ninguno se acepta desde el cliente. El command requiere una reparación visible
en el scope vigente, custodia activa, workflow `pending` y la versión esperada.
No requiere técnico asignado.

## Persistencia y proyección

`repair_workflow_transitions` es el historial append-only y source of truth de
las transiciones. Guarda scope compuesto, estado anterior/nuevo, actor snapshot,
hora de servidor, `clientRequestId`, versión esperada y `workflowVersion`.
`repairs.repair_status` permanece como cache de compatibilidad para filtros; se
actualiza en la misma transacción serializable. Detail y filas recuperadas de
Worklist derivan el estado actual del último evento, con el estado de creación
como versión cero cuando aún no existe transición.

La idempotencia se delimita por tenant, sucursal, reparación y
`clientRequestId`. Repetir el mismo command devuelve el resultado original;
reutilizar la clave con payload diferente, una versión stale o una transición
concurrente responde conflicto sin duplicar historia.

## Timeline y streams independientes

La transición inserta atómicamente una actividad estructurada con source
`local.workflow`; no se representa como nota. Sólo cambia `workflowVersion`.
`technicianAssignmentVersion`, Location y Custody permanecen independientes.
La custodia vigente se consulta únicamente como precondición temporal; su
modelo histórico y sus writes siguen siendo deuda explícita de una slice futura.

## Arquitectura

La ruta conserva `presentation → application → port → adapter`. El controller
no conoce SQL ni el repository concreto. La migración, el nuevo caso de uso y
la superficie de Repairs están registrados en la policy DEC-005 sin bypass.

## Datos locales

El seed mantiene fixtures de lectura con estados sintéticos más amplios para no
regresar D1–D5. Sólo `pending` y `diagnosing` pertenecen al write contract D6.1;
los demás estados visibles no son seleccionables ni escribibles por esta ruta.
