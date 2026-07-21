# Invariantes integradas

## Criterio

Una invariante describe una condición que debe permanecer verdadera en su alcance. Las filas DDV son decisiones validadas; las filas PM son protecciones candidatas que requieren confirmación antes de diseño.

## Orden, recepción y custodia

| ID | Invariante | Clasificación | Trazabilidad |
|---|---|---|---|
| IDM-INV-001 | La orden y la custodia nacen con la creación exitosa. | DDV | RMCA-INV-001 |
| IDM-INV-002 | Una orden representa un único ciclo de servicio y custodia. | DDV | RMCA-INV-002 |
| IDM-INV-003 | Un regreso posterior a la entrega requiere nueva orden. | DDV | RMCA-INV-010 |
| IDM-INV-004 | Nombre del cliente y problema reportado son mínimos universales. | DDV | RMCA-INV-003 |
| IDM-INV-005 | Tenant, sucursal, receptor, fecha, hora y folio hacen atribuible la creación. | DDV | RMCA-INV-004 |
| IDM-INV-006 | Todo equipo bajo custodia permanece identificado con el folio de su orden. | DDV | RMCA-INV-005/007 |
| IDM-INV-007 | Falla de impresora no elimina identificación; debe existir contingencia manual. | DDV | RMCA-INV-006 |
| IDM-INV-008 | Reimprimir una etiqueta no cambia la identidad de la orden. | DDV | RMCA-INV-008 |
| IDM-INV-009 | Listo y No quedó no terminan custodia. | DDV | RMCA-DEC-008; FOT |
| IDM-INV-010 | Sólo una entrega válida termina custodia. | DDV | RMCA-DEC-008; FOT-DEC-010 |

## Técnico y comercial

| ID | Invariante | Clasificación | Trazabilidad |
|---|---|---|---|
| IDM-INV-011 | Problema reportado no sustituye conclusión técnica. | DDV | RMCA-INV-011; DTR-INV |
| IDM-INV-012 | Conclusión, recomendación, cotización y trabajo son conceptos diferentes. | DDV | DTR-DEC-009/014/015/025 |
| IDM-INV-013 | Una pieza temporal de prueba no es pieza vendida ni instalada definitivamente. | DDV | DTR-DEC-005 |
| IDM-INV-014 | La conclusión técnica no fija precio. | DDV | DTR-DEC-012/013 |
| IDM-INV-015 | Diagnósticos y recomendaciones anteriores no se borran ni sobrescriben. | DDV | DTR-DEC-023/024 |
| IDM-INV-016 | Una decisión comercial refiere un concepto y una propuesta identificables. | DDV | RMCA-INV-012 |
| IDM-INV-017 | Los conceptos rechazados permanecen en la historia. | DDV | RMCA-INV-013 |
| IDM-INV-018 | El total autorizado deriva de conceptos autorizados y política aplicable. | DDV | RMCA-INV-014 |
| IDM-INV-019 | El trabajo ejecutado no excede el autorizado, salvo excepción explícita aún no definida. | DDV / PA | DTR-DEC-029 |
| IDM-INV-020 | Un descubrimiento posterior abre nueva evaluación/decisión sin cambiar la identidad de la orden. | DDV | DTR-DEC-019/020/022 |

## Workflow, calidad y responsabilidad

| ID | Invariante | Clasificación | Trazabilidad |
|---|---|---|---|
| IDM-INV-021 | Estado, ubicación, custodia, asignación y responsabilidad no se infieren entre sí. | DDV | FOT-DEC-011; FOT-INV |
| IDM-INV-022 | Escanear el folio abre contexto y no cambia estado por sí solo. | HOV | FOT-DEC-002 |
| IDM-INV-023 | Un movimiento físico requiere equipo, origen/destino, actor y momento atribuibles. | PM | FOT-PROP-011/013 |
| IDM-INV-024 | QC registra actor, momento, resultado y observaciones; no sólo comentario libre. | DDV | FOT-DEC-021/023 |
| IDM-INV-025 | Un QC rechazado no puede sostener un Listo vigente sin nueva resolución. | PM basada en HOV | FOT-DEC-008/009 |
| IDM-INV-026 | La historia de asignaciones y participaciones no se pierde al cambiar técnico resumen. | DDV | FOT-DEC-026/027/028 |
| IDM-INV-027 | Debe poder atribuirse quién recibió, diagnosticó, reparó, revisó, notificó, cobró y entregó. | DDV | FOT-DEC-015/020 |

## Trazabilidad, dinero y entrega

| ID | Invariante | Clasificación | Trazabilidad |
|---|---|---|---|
| IDM-INV-028 | Toda acción relevante conserva actor, momento, tenant, sucursal y contexto aplicable. | DDV | FOT-DEC-017/020 |
| IDM-INV-029 | Evento estructurado, nota narrativa y actividad automática no son sustituibles. | DDV | FOT-DEC-016 |
| IDM-INV-030 | El PIN sólo aporta atribución operativa y no prueba identidad absoluta. | HOV / RCA | FOT-DEC-018/019 |
| IDM-INV-031 | Cada anticipo conserva monto, moneda, actor, fecha, sucursal y medio cuando se conozca. | DDV | FOT-DEC-029/030 |
| IDM-INV-032 | Puede haber múltiples anticipos; no se reducen a un campo mutable. | DDV | FOT-DEC-031 |
| IDM-INV-033 | Correcciones, devoluciones o anulaciones no borran el movimiento original. | DDV | FOT-DEC-032 |
| IDM-INV-034 | Una nota no demuestra autorización, pago, QC ni entrega. | DDV | FOT/RMCA |
| IDM-INV-035 | Una orden no puede entregarse válidamente dos veces. | PM de protección | escenarios requeridos |
| IDM-INV-036 | Completar entrega registra receptor, actor y momento y termina custodia. | DDV | FOT-DEC-010 |

## Tenant, políticas y proyecciones

| ID | Invariante | Clasificación | Trazabilidad |
|---|---|---|---|
| IDM-INV-037 | Una política configurable no puede eliminar mínimos universales. | DDV | RMCA-INV-015 |
| IDM-INV-038 | Cada hecho pertenece a un tenant y, cuando aplica, a una sucursal coherente. | PM basada en arquitectura | MULTITENANCY_MODEL |
| IDM-INV-039 | Una proyección no reemplaza los hechos de los que deriva. | PM | FOT-PROP-006/007/018 |
| IDM-INV-040 | Cambiar política no reinterpreta silenciosamente decisiones históricas. | PM | política versionada candidata |

## Invariantes aún no cerradas

- **PA:** condición financiera exacta para entregar, incluido crédito o excepción.
- **PA:** independencia obligatoria del revisor de calidad.
- **PA:** evidencia mínima de autorización y entrega.
- **PA:** folio único y su alcance bajo concurrencia.
- **PA:** reserva/consumo de inventario y relación con trabajo autorizado.
- **PA:** reglas de salida temporal, proveedor externo y transferencias entre sucursales.
