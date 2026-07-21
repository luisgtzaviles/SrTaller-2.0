# Límites transaccionales

## Operaciones que exigen consistencia inmediata

| Operación | Efecto atómico mínimo | Motivo | Clasificación |
| --- | --- | --- | --- |
| Crear orden | Tenant/sucursal, identidad, folio, cliente mínimo, problema, receptor e inicio de custodia | No puede existir recepción sin custodia | RDD |
| Registrar autorización | Versión vigente, precios históricos, decisiones por concepto, actor, momento y total autorizado | Evitar alcance ambiguo | RDD |
| Iniciar trabajo autorizado | Validación de autorización y revisión de ejecución | Evitar trabajo no autorizado | RDD |
| Registrar QC | Revisión examinada, actor y resultado | Evitar aprobar revisión distinta | RDD |
| Registrar anticipo/pago | Monto, moneda, orden, usuario, sucursal, identidad idempotente y referencia | Evitar duplicidad financiera | RDD |
| Revertir pago | Nuevo movimiento compensatorio y autorización | Preservar historia | RDD |
| Entregar | Elegibilidad, evidencia, no duplicidad y término de custodia | Evitar custodia abierta o entrega fantasma | RDD |
| Publicar configuración | Versión coherente y vigencia | Evitar lectura parcial | DAR |

## Operaciones que no deben ampliar la transacción

- **[DAR]** Generar o imprimir etiqueta física después de confirmar la orden; si falla, se reintenta.
- **[DAR]** Crear miniaturas o procesar archivos después de registrar metadatos seguros.
- **[DAR]** Notificar al cliente después de confirmar el hecho de negocio.
- **[DAR]** Actualizar proyecciones reconstruibles fuera de la transacción autoritativa.
- **[DAR]** Consumir integraciones futuras mediante adaptadores idempotentes.

## Regla de fallo

**[DAR]** La transacción confirma un hecho de negocio o no lo confirma. Los efectos secundarios fallidos quedan visibles, reintentables y auditables; nunca obligan a deshacer silenciosamente un hecho ya válido.

## Decisiones por operación

### Crear orden e identificar físicamente

**[DAR]** Reservar folio, crear orden e iniciar custodia deben compartir consistencia inmediata. La impresión o generación física puede ocurrir como obligación posterior inmediata: si falla, la orden permanece válida, se marca identificación manual/impresión pendiente y se permite reintento idempotente.

### Autorizar conceptos

**[RDD]** La decisión protege cotización vigente, precio histórico, conceptos, actor, momento y total autorizado en una unidad coherente. Una versión obsoleta se rechaza; no se “actualiza” silenciosamente.

### Aprobar segunda revisión y marcar Listo

**[DAP]** Se recomienda que el resultado de segunda revisión y la transición a Listo se confirmen en una coordinación local inmediata. Pueden ser dos registros propietarios, pero no debe existir una ventana donde se muestre Listo sin revisión aprobada. Un rechazo conserva la orden en Taller/corrección.

### Cobro y entrega

**[DAP]** No se asume una transacción universal que siempre cobre y entregue. Registrar cada movimiento de pago es atómico; entregar es otra operación atómica que reevalúa política financiera, custodia y no duplicidad.

- **[R]** Cobrar sin entregar puede ser válido si queda saldo/entrega pendiente visible; no debe aparentar cierre.
- **[R]** Entregar sin cobrar sólo es válido si una política explícita permite saldo pendiente y queda actor/motivo.
- **[R]** Una falla de Caja no puede generar un segundo cobro al reintentar.
- **[RDD]** Una entrega repetida devuelve el resultado previo o conflicto, nunca termina custodia dos veces.

## Pendientes

- **[PB]** Definir la condición financiera exacta de entrega.
- **[PB]** Definir si un folio se reserva antes o durante la creación.
- **[PB]** Definir si el marcado Listo es parte de QC o una transición coordinada inmediatamente.
- **[ADR]** Elegir mecanismo de persistencia y publicación confiable después de aceptar la plataforma.
