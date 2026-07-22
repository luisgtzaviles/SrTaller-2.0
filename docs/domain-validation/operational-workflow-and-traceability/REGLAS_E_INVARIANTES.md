# Reglas e invariantes

## Criterio de clasificación

“Validada” significa que el Product Owner confirmó la condición en el alcance indicado. “Validada para Avicell” conserva una práctica real cuya universalidad no está aprobada. “Propuesta” identifica una protección recomendable todavía no confirmada como invariante.

## Matriz

| ID | Condición | Clasificación | Alcance | Precondición o disparador | Resultado esperado | Ejemplo inválido |
|---|---|---|---|---|---|---|
| FOT-INV-001 | Toda acción relevante conserva usuario, fecha, hora, tenant y sucursal | Validada | trazabilidad operativa | acción relevante ejecutada bajo sesión | atribución contextual | cambio sin actor |
| FOT-INV-002 | Toda orden bajo custodia tiene ubicación conocida o excepción explícita | Propuesta | operación física | custodia vigente | ubicación o excepción visible | equipo sin localizar |
| FOT-INV-003 | Estado y ubicación no se infieren uno del otro sin política explícita | Validada | todas las órdenes | cambia una dimensión | la otra permanece independiente | mover por cambiar estado |
| FOT-INV-004 | Marcar Listo no termina custodia | Validada | todas las órdenes | control aprobado/estado Listo | continúa En tienda hasta entrega | tratar Listo como Entregado |
| FOT-INV-005 | Sólo una entrega válida termina custodia | Validada | todas las órdenes | dispositivo bajo custodia | custodia termina con entrega | terminar al notificar |
| FOT-INV-006 | Segunda revisión aprobada precede a Listo | Validada para Avicell; propuesta universal | flujo Avicell | trabajo terminado | revisión aprobada habilita Listo | Listo directo desde Taller |
| FOT-INV-007 | Una segunda revisión rechazada no deja el equipo Listo | Validada para Avicell | control de calidad | resultado rechazado | retorno a Taller/estado no Listo | rechazo y Listo vigentes |
| FOT-INV-008 | Un equipo Entregado no conserva ubicación interna activa | Propuesta | custodia/ubicación | entrega válida | salida, sin estante activo | Entregado en Listos |
| FOT-INV-009 | Una orden No quedó puede continuar bajo custodia | Validada | resultado no reparado | cliente rechaza o equipo no queda | En tienda hasta entrega | asumir salida automática |
| FOT-INV-010 | Cambiar técnico resumen no borra participaciones | Validada | asignación/participación | reasignación | historia completa | sobrescribir al anterior |
| FOT-INV-011 | Una autorización conserva quién la registró y cómo se obtuvo | Validada | decisiones comerciales | aceptación/rechazo | actor, decisor, canal/evidencia y momento | sólo “autorizó” en nota |
| FOT-INV-012 | Un anticipo conserva actor, monto y momento | Validada | movimiento financiero | valor recibido | fila histórica atribuible | total sin movimientos |
| FOT-INV-013 | Una nota narrativa no sustituye un evento estructurado obligatorio | Validada | hechos sensibles | autorización, entrega, anticipo, control u otro obligatorio | evento y nota complementaria | entrega sólo comentada |
| FOT-INV-014 | Una acción sensible requiere sesión/capacidad válidas y control nivel 2 o 3 satisfecho; sin política queda en nivel 4 | Validada + ADR-013 | autorización reforzada | actor intenta acción sensible | acción atribuible o rechazo sin efectos | usar sesión abandonada o aprobación del cliente |
| FOT-INV-015 | Los movimientos físicos relevantes conservan trazabilidad | Propuesta | ubicaciones | dispositivo cambia de área | origen, destino, actor y momento | ubicación sobrescrita sin historia |
| FOT-INV-016 | Toda entrega registra quién entregó | Validada | entrega | transferencia física | actor interno y momento | Entregado sin usuario |
| FOT-INV-017 | Todo control aprobado registra quién revisó | Validada | segunda revisión | resultado aprobado | revisor, momento y resultado | Listo sin revisor |
| FOT-INV-018 | Un cambio de estado no prueba reparación realizada | Validada | trabajo técnico | estado cambia | trabajo se prueba con hecho propio | “reparó” derivado de Listo |
| FOT-INV-019 | El sistema permite detectar divergencias entre estado, ubicación y custodia | Propuesta | consistencia operativa | combinación incompatible | alerta, bloqueo o reconciliación por definir | inconsistencia invisible |
| FOT-INV-020 | Movimientos, asignaciones y revisiones no cambian identidad de orden | Validada | ciclo de custodia | cualquier operación interna | mismo folio/orden | nueva orden por mover |

## Invariantes validadas universales en este alcance

FOT-INV-001, 003–005, 009–014, 016–018 y 020 reflejan decisiones explícitas. “Universal” se limita al dominio documentado; permisos, excepciones legales y casos externos siguen pendientes.

## Reglas contextuales de Avicell

FOT-INV-006 y 007 describen el control confirmado en Avicell. Para convertir la independencia o secuencia exacta de segunda revisión en política universal hace falta decidir:

- talleres con una sola persona;
- tipos de reparación;
- revisiones especializadas;
- excepciones autorizadas;
- evidencia y permisos.

## Propuestas

FOT-INV-002, 008, 015 y 019 son protecciones candidatas. No deben presentarse como decisiones aprobadas ni convertirse automáticamente en bloqueos de software.

## Reglas derivadas del flujo

1. Escanear no cambia estado, ubicación o asignación sin una política aprobada.
2. Probar una pieza temporalmente no demuestra instalación, venta ni consumo.
3. Notificar al cliente no termina custodia.
4. No quedó conserva historia de hallazgos y decisiones.
5. Una reasignación no cambia la orden.
6. Una revisión frente al cliente antes de entregar puede devolver el equipo a Taller.
7. Diferentes personas pueden ejecutar acciones distintas dentro de una orden.
8. La atribución por PIN no reemplaza la autoridad de negocio.

Las reglas 1 y el mecanismo exacto de 6–8 pueden requerir políticas técnicas posteriores; su separación semántica sí está validada.

## Checklist de consistencia

Una propuesta posterior debe responder:

1. ¿Distingue estado, ubicación, custodia, responsabilidad y participación?
2. ¿Conserva actor y momento de acciones relevantes?
3. ¿Preserva múltiples técnicos y ciclos de revisión?
4. ¿Impide que una nota sea la única prueba de un hecho obligatorio?
5. ¿Mantiene Listo y No quedó bajo custodia hasta entrega?
6. ¿Explica por qué un total, resumen o campo actual no reemplaza el historial?
7. ¿Evita presentar Event Sourcing como consecuencia obligatoria?

Una respuesta negativa indica contradicción o una decisión nueva que debe registrarse explícitamente.
