# Eventos, notas y actividad

## Separación validada

### FOT-DEC-016 — Tres clases de registro

La trazabilidad debe distinguir:

| Clase | Propósito | Ejemplo | Lo que no sustituye |
|---|---|---|---|
| Evento estructurado | afirmar un hecho de negocio con significado propio | autorización registrada | nota libre o log técnico |
| Nota narrativa | conservar contexto humano complementario | cliente vendrá mañana | decisión estructurada obligatoria |
| Actividad automática | registrar una interacción o consecuencia operativa del sistema | usuario escaneó el equipo | hecho de negocio si la interacción no lo demuestra |

No toda interacción humana requiere una nota y no toda actividad automática merece el mismo peso visual o retención.

## Eventos estructurados documentados

Los nombres son descripciones de negocio, no contratos técnicos.

| ID | Hecho | Actor o fuente | Contexto mínimo | Consecuencia de negocio |
|---|---|---|---|---|
| FOT-EVT-001 | Orden recibida | recepción | orden, dispositivo, usuario, tenant, sucursal, momento | inicia recorrido posterior a la recepción creada |
| FOT-EVT-002 | Equipo trasladado | persona que mueve | origen, destino, usuario, momento, motivo si aplica | actualiza ubicación conocida |
| FOT-EVT-003 | Diagnóstico registrado | técnico | hallazgos, conclusión, pruebas, usuario, momento | habilita decisión técnica/comercial posterior |
| FOT-EVT-004 | Trabajo terminado | técnico | alcance realizado, resultado, pruebas, usuario, momento | habilita segunda revisión |
| FOT-EVT-005 | Control de calidad aprobado | revisor | criterios, resultado, observaciones, usuario, momento | habilita marcar Listo |
| FOT-EVT-006 | Control de calidad rechazado | revisor | fallas, observaciones, usuario, momento | devuelve a Taller |
| FOT-EVT-007 | Cliente notificado | recepción/atención | destinatario, canal, resultado, usuario, momento | conserva comunicación; no prueba entrega |
| FOT-EVT-008 | Autorización registrada | recepción/atención | decisor, conceptos, canal/evidencia, usuario, momento | habilita trabajo autorizado |
| FOT-EVT-009 | Rechazo registrado | recepción/atención | decisor, conceptos, canal/evidencia, usuario, momento | impide tratar conceptos como autorizados |
| FOT-EVT-010 | Anticipo recibido | usuario que cobra | importe, moneda, usuario, sucursal, momento y medio si se conoce | incrementa historial de anticipos |
| FOT-EVT-011 | Estado cambiado | usuario autorizado | estado anterior/nuevo, usuario, momento, motivo si aplica | cambia situación de negocio, no ubicación |
| FOT-EVT-012 | Asignación técnica cambiada | asignador | técnico anterior/nuevo, alcance, usuario, momento, motivo | cambia asignación sin borrar historia |
| FOT-EVT-013 | Equipo entregado | recepción | receptor/legitimación por definir, usuario que entrega, momento, condición | termina custodia |

### FOT-DEC-017 — Autoría y contexto

Todo evento estructurado conserva autor o fuente, fecha y hora y contexto suficiente de orden, tenant y sucursal. Que un proceso produzca automáticamente el registro no elimina el actor humano cuando el hecho proviene de su acción.

## Notas narrativas

Son apropiadas para información como:

- “cliente vendrá mañana”;
- “cliente pidió conservar una mica”;
- “se observó un detalle contextual que no cambia el resultado”;
- explicación adicional de una llamada, prueba o excepción.

Una nota puede enlazarse conceptualmente con un evento, pero no debe ser la única evidencia de:

- autorización o rechazo;
- entrega;
- anticipo;
- cambio de estado;
- control de calidad;
- asignación técnica;
- trabajo terminado.

El seguimiento legacy conserva usuario, fecha/hora y comentario. Esa evidencia es útil, pero la fecha prueba el registro de la nota, no necesariamente el momento real del hecho narrado.

## Actividad automática

Ejemplos confirmados o solicitados:

- usuario escaneó el dispositivo;
- etiqueta reimpresa;
- vista de orden consultada;
- técnico asignado;
- cambio de estado;
- cambio de ubicación;
- impresión de ticket.

Una misma acción puede producir dos registros con propósitos diferentes. Por ejemplo:

- el evento “Asignación técnica cambiada” conserva el hecho de negocio;
- una actividad automática puede conservar que el sistema actualizó una proyección o envió una notificación.

La actividad derivada no sustituye el evento. Tampoco toda consulta o clic se promueve a hecho de negocio.

## Peso de presentación

### FOT-PROP-005 — Jerarquía de actividad

Mostrar eventos de negocio, notas y actividad técnica con distinto peso es una propuesta. La interfaz no se diseña aquí, pero el dominio debe evitar una línea cronológica donde una consulta tenga la misma importancia que una entrega.

Una clasificación candidata:

| Prioridad conceptual | Contenido |
|---|---|
| Principal | custodia, autorización, dinero, trabajo, control de calidad, estado y entrega |
| Contextual | notas humanas vinculadas o independientes |
| Operativa | escaneo, impresión, consulta y otras actividades automáticas |

## Fuente de trazabilidad

### FOT-PROP-006 — Historial como fuente

Tratar un historial de hechos como fuente principal de trazabilidad es una propuesta de dominio. No prescribe Event Sourcing, almacenamiento inmutable, bus de eventos ni publicación externa.

### FOT-PROP-007 — Resúmenes derivados

Mostrar “recibió”, “reparó”, “revisó” y “entregó” como proyecciones derivadas del historial es una propuesta. Los resúmenes no deben convertirse en el único registro fuente ni borrar múltiples participantes.

## Estados inválidos

- Autorización existente sólo como comentario.
- Anticipo representado únicamente por un total acumulado.
- Entrega inferida de una impresión de ticket.
- Reparación inferida del cambio a Listo.
- Escaneo tratado como inicio automático de trabajo sin regla aprobada.
- Nota con fecha de captura presentada como hora cierta de la llamada.
- Actividad automática sin actor atribuible cuando provino de una acción humana.

## Retención pendiente

No se decide si toda actividad automática se conserva permanentemente. Retención, visibilidad al cliente, privacidad y nivel de detalle permanecen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
