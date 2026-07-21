# Modelo de asignación técnica

## Hechos validados

### FOT-DEC-026 — Varios técnicos

Una orden puede pasar por más de un técnico. El modelo debe soportar que uno diagnostique, otro repare y otros colaboren o participen en ciclos posteriores.

### FOT-DEC-027 — Historia preservada

Cambiar el técnico asignado no puede borrar asignaciones ni participación técnica previa.

### FOT-DEC-028 — Resumen legacy insuficiente

El campo único “técnico” del legacy puede funcionar como resumen de la situación actual, pero no prueba:

- identidad estable;
- periodo de asignación;
- aceptación del trabajo;
- diagnóstico realizado;
- reparación ejecutada;
- posesión física;
- participación de otros técnicos.

## Separaciones

| Concepto | Pregunta | Ejemplo |
|---|---|---|
| Asignación actual | ¿A quién se encomendó trabajo ahora? | Ana atiende el siguiente ciclo |
| Historial de asignación | ¿Quién fue asignado y durante qué periodo? | Luis antes, Ana después |
| Participación técnica | ¿Qué hizo realmente cada persona? | Luis diagnosticó; Ana reparó |
| Responsabilidad operativa | ¿Quién debe actuar ahora? | recepción debe obtener autorización |
| Ubicación física | ¿Dónde está el equipo? | segunda revisión |
| Custodia | ¿El taller aún responde por él? | bajo custodia |

Ninguna columna puede deducirse únicamente de otra.

## Propuestas de modelado

### FOT-PROP-016 — Historial de asignaciones

Representar asignación como historial y no sólo como campo mutable es una propuesta. Su granularidad, aceptación, fechas y reglas de simultaneidad siguen abiertas.

### FOT-PROP-017 — Participantes por contribución

Permitir participaciones técnicas con contribuciones “diagnosticó”, “reparó”, “apoyó” y “revisó técnicamente” es una propuesta. Los nombres, solapamientos y autoridad no están aprobados.

### FOT-PROP-018 — Técnico resumen derivado

Conservar un “técnico principal” o “técnico actual” como proyección es una propuesta. Debe tener una regla explícita y nunca borrar la historia.

## Ciclo de asignación candidato

| Hecho | Información conceptual | Lo que no demuestra |
|---|---|---|
| técnico asignado | técnico, asignador, momento, alcance | inicio de trabajo |
| asignación aceptada | técnico, momento, condición | movimiento físico |
| diagnóstico registrado | autor, hallazgos, pruebas | reparación ejecutada |
| reparación registrada | autor, alcance, resultado | control aprobado |
| técnico cambiado | anterior, nuevo, asignador, motivo, momento | que el anterior no participó |
| apoyo técnico registrado | colaborador, contribución, momento | responsabilidad principal |

Aceptación explícita es una posibilidad, no un hecho validado.

## Escenarios soportados

- Técnico A diagnostica y Técnico B repara.
- Técnico A inicia, cambia el turno y Técnico B continúa.
- Técnico A prueba una pieza; Técnico B ejecuta la reparación autorizada.
- Técnico B corrige después de una segunda revisión fallida.
- Varios técnicos apoyan sin ser el técnico resumen.
- Recepción es responsable de llamar mientras el equipo sigue asignado técnicamente.

## Reglas

- La identidad de la orden no cambia por asignar o reasignar.
- Una reasignación conserva actor, momento, anterior, nuevo y motivo cuando aplica.
- La participación se prueba por acciones registradas, no sólo por selección en un campo.
- El técnico asignado no es automáticamente custodio físico.
- El último técnico no reemplaza a quienes diagnosticaron o repararon.
- La revisión realizada por recepción no debe atribuirse al técnico resumen.

## Estados inválidos

- Sobrescribir “Luis” con “Ana” y perder que Luis diagnosticó.
- Mostrar un solo “reparó” cuando intervinieron varias personas.
- Considerar que escanear asignó automáticamente sin política.
- Considerar que asignar inició cronometraje o reparación.
- Usar ubicación Taller como prueba de técnico responsable.
- Usar un seguimiento narrado por recepción como prueba de autoría técnica.

## Preguntas

Asignación simultánea, técnico principal, aceptación, permisos, periodos, turnos, colaboradores y medición se conservan en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
