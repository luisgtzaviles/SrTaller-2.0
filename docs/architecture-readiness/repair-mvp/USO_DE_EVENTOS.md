# Uso de eventos

## Propósito

**[DAR]** Los eventos representan hechos de negocio ya confirmados y desacoplan proyecciones o efectos secundarios. No sustituyen comandos, no autorizan acciones y no convierten el sistema en Event Sourcing.

## Categorías

| Categoría | Propósito | Ejemplo | Clasificación |
| --- | --- | --- | --- |
| Evento de dominio interno | Expresar hecho con significado e invariantes | OrdenCreada | DAP |
| Evento operativo | Coordinar trabajo recuperable | ImpresionPendiente | DAP |
| Actividad de auditoría | Preservar responsabilidad y motivo | PrecioModificado | RDD |
| Evento de integración futuro | Publicar contrato hacia otro sistema | OrdenCerradaPublicada | DD |
| Notificación | Solicitar comunicación por canal | AvisoEquipoListoSolicitado | DD |

## Eventos candidatos del MVP

| Hecho | Consumidores probables | Clasificación |
| --- | --- | --- |
| OrdenCreada / CustodiaIniciada | Línea temporal, etiqueta, lista operativa | DAP |
| RecomendacionTecnicaEmitida | Comercial, línea temporal | DAP |
| Propuesta emitida | Timeline, notificación diferible | DAP |
| CotizacionAutorizadaParcialmente | Trabajo técnico, línea temporal | DAP |
| TrabajoTerminado | Calidad, línea temporal | DAP |
| ControlCalidadAprobado/Rechazado | Flujo, línea temporal | DAP |
| EquipoListo / EquipoNoQuedo | Lista operativa, línea temporal | DAP |
| PagoRecibido/PagoRevertido | Posición financiera, línea temporal | DAP |
| EquipoEntregado/CustodiaTerminada | Línea temporal, cierre operativo | DAP |

## Reglas

1. **[RDD]** Un evento usa tiempo, actor, sesión, tenant, sucursal, estación, correlación e identidad de entidad verificables cuando corresponda.
2. **[DAR]** Se publica después de confirmar el hecho o mediante mecanismo transaccional confiable.
3. **[DAR]** Los consumidores son idempotentes y toleran repetición.
4. **[DAR]** El contrato evita datos sensibles innecesarios.
5. **[DAR]** La evolución del evento conserva compatibilidad o versión explícita.
6. **[DAR]** No todo cambio necesita evento explícito; sólo hechos con consumidor o valor histórico claro.

## Sincronía

**[DAP]** Los invariantes del usuario se resuelven sincrónicamente dentro de la operación. Proyecciones, impresión y notificación pueden procesarse después de confirmar la transacción. Un intermediario externo de mensajes no es requisito del MVP.

## Exclusión

**[FMVP]** No se reconstruyen agregados desde eventos ni se define un almacén de eventos. Adoptar Event Sourcing requeriría una necesidad independiente y un ADR posterior.
