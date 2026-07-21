# Roles y responsabilidades operativas

## Principio

Una persona, un usuario, un puesto, un rol de permisos y una responsabilidad dentro de una orden no son equivalentes. En un taller pequeño la misma persona puede ejercer varias responsabilidades, pero cada acción conserva su significado y atribución.

## Decisiones validadas

### FOT-DEC-012 — Identidad operativa individual

Cada recepcionista, técnico u otro usuario entra con su propio PIN. Las acciones relevantes se atribuyen al usuario autenticado en ese momento.

### FOT-DEC-013 — Separación técnica y comercial

El técnico no es el actor principal de negociación con el cliente. Produce hallazgos, diagnóstico, pruebas y trabajo realizado. Recepción o atención al cliente comunica, cotiza, obtiene decisiones, notifica y entrega en el flujo validado de Avicell.

### FOT-DEC-014 — Participación distribuida

Diferentes personas pueden recibir, diagnosticar, reparar, revisar, notificar, cobrar y entregar. La persona que entrega no tiene que ser quien recibió, revisó o reparó.

### FOT-DEC-015 — Roles consultables

La orden debe permitir responder, al menos:

- quién recibió;
- quién diagnosticó;
- quién reparó;
- quién revisó;
- quién notificó;
- quién recibió un anticipo;
- quién registró autorización o rechazo;
- quién cambió un estado;
- quién asignó o cambió técnico;
- quién entregó;
- quién registró cada seguimiento.

## Matriz de responsabilidad del flujo Avicell

| Responsabilidad | Produce o decide | No debe inferirse | Actor habitual validado |
|---|---|---|---|
| Recepción de orden | acepta ingreso, crea y coloca en pendientes | propiedad legal o diagnóstico | recepción |
| Toma técnica | retira de pendientes y consulta orden | asignación permanente | técnico |
| Diagnóstico | hallazgos, pruebas y conclusión | autorización comercial | técnico |
| Reparación | trabajo ejecutado y resultado | cotización aceptada por silencio | técnico |
| Segunda revisión | resultado independiente y observaciones | autoría de la reparación | recepción en Avicell |
| Comunicación | intento, destinatario y resultado | autorización si no hubo decisión | recepción/atención |
| Cotización | propuesta comercial | diagnóstico por sí sola | recepción/atención |
| Autorización/rechazo | registra decisión del cliente | autoridad universal del contacto | recepción/atención |
| Notificación de listo | comunica disponibilidad | entrega física | recepción/atención |
| Anticipo/cobro | recibe y registra valor | conciliación de Caja completa | usuario que cobra |
| Entrega | localiza, prueba, cobra y transfiere custodia | cierre total de obligaciones | recepción |

## Misma persona, responsabilidades distintas

Una persona puede:

- recibir y después realizar segunda revisión;
- notificar y después entregar;
- registrar varios seguimientos;
- recibir la orden y también un anticipo;
- ejercer más de un rol durante un turno.

Eso no permite reducir toda la historia a “último usuario”. Cada actuación relevante conserva actor, momento, contexto y significado.

## Múltiples personas en una orden

El modelo de dominio debe poder expresar:

- recepción por una persona;
- diagnóstico por otra;
- reparación por una tercera;
- segunda revisión por una cuarta;
- notificación por una quinta;
- entrega por una sexta.

También debe soportar que una persona ejecute varias de esas acciones sin duplicar identidades ni confundir funciones.

## Responsabilidad actual

### FOT-PROP-004 — Responsabilidad operativa explícita

Tratar “quién debe actuar ahora” como una dimensión visible es una propuesta. Puede corresponder a recepción, taller, una persona, un equipo o una cola; su forma y transferencia no están decididas.

La responsabilidad actual:

- no es necesariamente quien tiene físicamente el dispositivo;
- no es necesariamente el técnico resumen;
- no borra responsables anteriores;
- puede cambiar sin movimiento físico;
- puede transferirse por cambio de turno, sujeto a reglas abiertas.

## Segunda revisión e independencia

En Avicell la segunda revisión puede hacerla el recepcionista en turno. Se validó que funciona como segundo filtro. Que siempre deba realizarla una persona distinta del ejecutor técnico es una política candidata, no una invariante universal aprobada.

## Autoridad y permisos

Este documento describe responsabilidades de negocio, no concede permisos. Quedan abiertas las acciones sensibles, revalidación por PIN, excepciones, combinación de roles y límites por tenant/sucursal.

## Ejemplos inválidos

- Tratar “Técnico” como permiso para registrar una autorización del cliente.
- Afirmar que quien cambió el estado fue quien reparó.
- Usar el actor del último seguimiento como responsable de todos los hechos narrados.
- Reemplazar al técnico asignado y eliminar participaciones anteriores.
- Considerar al recepcionista que entregó como receptor del dispositivo.
- Suponer que un mismo puesto implica la misma persona durante todo el ciclo.
