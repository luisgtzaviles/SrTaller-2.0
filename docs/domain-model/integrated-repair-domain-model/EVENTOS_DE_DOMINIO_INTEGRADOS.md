# Eventos de dominio integrados

## Criterio

**IDO:** un evento integrado nombra algo relevante que ya ocurrió. La clasificación indica su significado conceptual; no obliga a almacenarlo como evento, publicarlo, usar mensajería ni adoptar Event Sourcing.

## Recepción y custodia

| Evento candidato | Tipo | Contexto propietario | Significado | Fuente/clasificación |
|---|---|---|---|---|
| Orden creada | Dominio | Órdenes | nació una identidad para el ciclo | RMCA-DEC-001; DDV |
| Custodia iniciada | Dominio | Recepción/Custodia | el taller aceptó responsabilidad física | RMCA-DEC-007; DDV |
| Equipo identificado físicamente | Operativo | Recepción/Custodia | folio quedó unido al equipo | RMCA-DEC-010/012; DDV |
| Recepción completada | Dominio | Recepción | mínimos y políticas aplicables fueron satisfechos | PM basada en RMCA |
| Evidencia inicial agregada | Operativo | Evidencias | se agregó evidencia posterior a creación | RMCA-DEC-006; HOV/DDV |
| Etiqueta reimpresa | Operativo | Recepción/Custodia | se repuso identificación sin cambiar orden | RMCA-DEC-013; DDV |

## Workflow y responsabilidad

| Evento candidato | Tipo | Contexto propietario | Significado | Fuente/clasificación |
|---|---|---|---|---|
| Equipo movido | Operativo | Workflow | cambió la ubicación física registrada | FOT-PROP-011/013; PM |
| Técnico asignado | Dominio | Técnico/Workflow | comenzó una responsabilidad técnica temporal | FOT-DEC-026/027; DDV/PM |
| Equipo escaneado | Actividad técnica | Workflow | un actor abrió el contexto de la orden | FOT-DEC-002; HOV |
| Estado cambiado | Dominio/operativo | Workflow | cambió la condición de negocio con motivo | FOT-PROP-010; PM |
| Participación técnica registrada | Actividad técnica | Técnico | quedó atribuida una contribución concreta | FOT-DEC-026/027; DDV/PM |
| Técnico resumen actualizado | Posible proyección | Lectura operativa | cambió un resumen derivado, no la historia | FOT-PROP-018; PM |

## Diagnóstico, recomendación y trabajo

| Evento candidato | Tipo | Contexto propietario | Significado | Fuente/clasificación |
|---|---|---|---|---|
| Evaluación diagnóstica iniciada | Dominio | Técnico | comenzó una evaluación atribuible | DTR-PROP-001/006; PM |
| Evaluación diagnóstica concluida | Dominio | Técnico | existe una conclusión suficiente o no concluyente | DTR-DEC-006/009/041; DDV |
| Recomendación técnica emitida | Dominio | Técnico | se expresó una necesidad/mejora separada del precio | DTR-DEC-014/015; DDV |
| Servicio ejecutado | Actividad técnica | Técnico | se realizó una acción de servicio | DTR-DEC-004/037; HOV/DDV |
| Trabajo autorizado | Dominio | Comercial/Técnico | un alcance quedó habilitado | DTR-DEC-029; DDV |
| Trabajo iniciado | Dominio/operativo | Técnico | comenzó ejecución del alcance vigente | PM |
| Trabajo terminado | Dominio | Técnico | terminó una ejecución con resultado atribuible | DTR-DEC-036; DDV |
| Nuevo problema detectado | Dominio | Técnico | apareció una necesidad no cubierta por el alcance vigente | DTR-DEC-019; DDV |
| Nueva evaluación diagnóstica requerida | Dominio | Técnico | se necesita otra iteración sin borrar anteriores | DTR-DEC-020/021/024; DDV/PM |

## Comercial y comunicación

| Evento candidato | Tipo | Contexto propietario | Significado | Fuente/clasificación |
|---|---|---|---|---|
| Cotización emitida | Dominio | Comercial | se ofreció una versión con conceptos y precios | RMCA-DEC-019/024; DDV |
| Concepto autorizado | Dominio | Comercial | decisor aprobó un concepto concreto | RMCA-DEC-020/021; DDV |
| Concepto rechazado | Dominio | Comercial | decisor no aprobó un concepto y queda historial | RMCA-DEC-022; DDV |
| Cotización parcialmente autorizada | Posible proyección/dominio | Comercial | algunas decisiones de concepto son positivas y otras no | RMCA-DEC-021; DDV/IDO |
| Cliente contactado | Operativo | Comunicación | se intentó o logró interacción; resultado debe distinguirse | FOT-DEC-013; HOV/PM |
| Cliente notificado | Operativo | Comunicación/Notificaciones | se comunicó información concreta por un canal | HOV/PM |

## Calidad, disponibilidad y devolución

| Evento candidato | Tipo | Contexto propietario | Significado | Fuente/clasificación |
|---|---|---|---|---|
| Equipo enviado a segunda revisión | Operativo | Workflow/Calidad | trabajo terminó y espera QC | FOT-DEC-008; HOV |
| Control de calidad aprobado | Dominio | Calidad | revisión vigente tuvo resultado positivo | FOT-DEC-021/023; DDV |
| Control de calidad rechazado | Dominio | Calidad | revisión vigente encontró motivo de retorno | FOT-DEC-021/023; DDV |
| Equipo marcado Listo | Dominio/operativo | Workflow | quedó disponible tras control aplicable | FOT-DEC-009; HOV; no fin de custodia |
| Equipo marcado No quedó | Dominio/operativo | Workflow | no se completará el resultado esperado bajo alcance actual | FOT-DEC-006; HOV; no fin de custodia |
| Equipo devuelto a Taller | Operativo | Workflow | volvió a cola/ubicación técnica | FOT-DEC-008/009; HOV |
| Equipo colocado en caja de listos | Operativo | Workflow | cambió a una ubicación física de resguardo | FOT-DEC-024/025; RCA |

## Finanzas y entrega

| Evento candidato | Tipo | Contexto propietario | Significado | Fuente/clasificación |
|---|---|---|---|---|
| Anticipo recibido | Financiero | Pagos | se recibió un monto previo atribuible | FOT-DEC-029/030; DDV |
| Pago recibido | Financiero | Pagos | se recibió un monto con propósito y medio | IDO; definición completa abierta |
| Entrega iniciada | Operativo | Entrega | comenzó verificación final, cobro y legitimación | HOV/PM |
| Cobro completado | Financiero | Pagos | se cumplió la condición de cobro aplicable | HOV; crédito/excepción abiertos |
| Equipo entregado | Dominio | Entrega | el equipo salió mediante entrega válida | FOT-DEC-010; DDV |
| Custodia terminada | Dominio | Recepción/Custodia | dejó de existir custodia del taller | RMCA-DEC-008; DDV |

## Reglas de uso

- **DDV:** evento estructurado, nota narrativa y actividad automática son clases diferentes.
- **DDV:** un cambio de estado no demuestra un movimiento y un movimiento no demuestra cambio de estado.
- **PM:** eventos compuestos como “cotización parcialmente autorizada” pueden ser proyecciones de eventos más elementales.
- **RCL:** webhooks, impresiones o actualizaciones de campos legacy no se tratan automáticamente como eventos de dominio.
- **PA:** decidir qué eventos son internos, auditables, notificables o compartidos entre contextos.
