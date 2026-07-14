# Gestión del backlog

El backlog convierte objetivos de producto en resultados verificables sin confundir intención con compromiso. Durante SPRINT-00 todos los PBIs producen documentación, decisiones o evidencia de descubrimiento; ninguno autoriza implementación.

## Estado del documento

**Estado:** Propuesta.
**Orden final y responsables:** pendientes de aprobación del Product Owner.

## Estructura

- [EPICS.md](EPICS.md): objetivos amplios y condiciones para descomposición.
- [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md): vista ordenable de PBIs.
- [PRIORITIZATION_MODEL.md](PRIORITIZATION_MODEL.md): factores para discutir orden.
- [DEPENDENCY_MAP.md](DEPENDENCY_MAP.md): secuencia y bloqueos conceptuales.
- [pbis/README.md](pbis/README.md): índice de archivos individuales.

## Convenciones de identificadores

| Elemento | Formato | Ejemplo |
|---|---|---|
| Epic | `EPIC-###` | `EPIC-000` |
| Product Backlog Item | `PBI-###` | `PBI-001` |
| Tarea futura | `TASK-###` | `TASK-001` |
| Bug futuro | `BUG-###` | `BUG-001` |
| Decisión arquitectónica | `ADR-###` | `ADR-001` |
| Sprint | `SPRINT-##` | `SPRINT-00` |
| Riesgo formal | `RISK-###` | `RISK-001` |
| Decisión de producto/operación | `DECISION-###` | `DECISION-001` |
| Pregunta | `QUESTION-###` | `QUESTION-001` |

Un identificador no se reutiliza. Las referencias pueden repetirse; la definición canónica debe existir una sola vez.

## Estados propuestos de PBI

`Draft` → `Ready for review` → `Ready` → `In progress` → `In review` → `Done`. También se permiten `Blocked`, `Deferred` y `Cancelled` con una razón explícita. Sólo un PBI que satisfaga la [Definition of Ready](../delivery/DEFINITION_OF_READY.md) puede quedar `Ready` para implementación.

## Reglas de mantenimiento

1. El Product Owner aprueba prioridad y alcance; el equipo aporta riesgo, dependencia y esfuerzo.
2. Cada PBI conserva problema, valor, criterios verificables, exclusiones, dependencias, riesgos y evidencia.
3. Las tareas técnicas se crean sólo al preparar trabajo aprobado; no se usa el backlog para esconder decisiones.
4. Un cambio de alcance actualiza PBI, dependencias y sprint, manteniendo trazabilidad.
5. Estimaciones permanecen `TBD` hasta que el equipo acuerde método y contexto.

## Próxima revisión

En el refinamiento documental de SPRINT-00; fecha: TBD.
