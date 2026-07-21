# Concurrencia e idempotencia

## Riesgos concretos

| Riesgo | Impacto y consistencia | Estrategia conceptual | ¿Bloquea? | ADR o prueba | Clasificación |
| --- | --- | --- | --- | --- | --- |
| Dos recepcionistas crean el mismo folio | Identidad duplicada; inmediata | Unicidad por alcance y reserva atómica | Recepción | ADR de folio + prueba concurrente | PB |
| Doble clic al crear orden | Orden/custodia duplicadas; inmediata | Clave idempotente acotada | Recepción | Prueba de reintento | DAR |
| Reintento de anticipo | Doble cobro; inmediata | Identidad única del movimiento | Pagos | ADR de dinero + prueba | RDD |
| Dos usuarios ajustan cotización | Pérdida de cambios; inmediata por versión | Versión esperada y conflicto visible | Comercial | Prueba concurrente | DAR |
| Autorización sobre versión obsoleta | Trabajo/precio inválido; inmediata | Referencia a versión vigente o rechazo | Comercial | ADR de Cotización | RDD |
| Técnico y recepción editan simultáneamente | Sobrescritura o alcance confuso | Propiedad de campos y versiones separadas | Rebanada afectada | Prueba de propiedad | DAR |
| Dos usuarios marcan Listo | Transición/revisión duplicada; inmediata | Estado esperado y resultado QC referenciado | Calidad | Prueba concurrente | RDD |
| Doble notificación | Molestia/costo; eventual | Consumidor idempotente por hecho/canal | No | Prueba al automatizar | DD |
| Doble cobro | Pérdida financiera; inmediata | Movimiento idempotente y conciliación visible | Pagos | ADR de dinero + prueba | RDD |
| Doble entrega | Custodia falsa; inmediata | Entrega única, estado esperado y respuesta repetible | Entrega | ADR de entrega + prueba | RDD |
| Reimpresión múltiple | Etiquetas duplicadas; eventual controlada | Mismo folio, actor y contador de reimpresión | Recepción | Prueba de falla de impresora | DAR |
| Dos movimientos físicos | Ubicación ambigua; inmediata | Secuencia/versión de custodia | Operación | Prueba concurrente | RDD |
| Política cambia al crear orden | Regla no reproducible; inmediata | Resolver versión y conservar referencia/instantánea | Recepción | ADR de política | PB |

## Principios

1. **[DAR]** El cliente puede reintentar sin crear un segundo efecto cuando la intención es la misma.
2. **[DAR]** La respuesta a un conflicto distingue repetición válida de cambio concurrente real.
3. **[DAR]** La clave idempotente está acotada por tenant, actor/canal y operación.
4. **[DAR]** Los consumidores de eventos toleran duplicados.
5. **[DAR]** La protección concreta combina restricciones de persistencia y control de versión; no depende sólo de la interfaz de usuario.

## Decisiones pendientes

- **[PB]** Alcance de unicidad del folio.
- **[PB]** Ventana y retención de claves idempotentes.
- **[PB]** Política de conflicto cuando una autorización o QC llega contra versión reemplazada.
- **[ADR]** Elegir primitivas concretas de bloqueo/versión después de aceptar persistencia; este paquete no prescribe tecnología.

## Pruebas mínimas

**[DAR]** Cada operación crítica debe probar doble envío, dos actores concurrentes, reintento después de expirar el tiempo de espera y cruce de tenant.
