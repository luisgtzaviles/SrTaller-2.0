# Gestión del backlog

El backlog convierte objetivos de producto en resultados verificables sin
confundir intención con compromiso. PBI-001–PBI-020 conservan su historia de
Sprint 00 y tienen resultado reconciliado. [PBI-021](pbis/PBI-021.md) y
[PBI-022](pbis/PBI-022.md) están `Done` después de sus verificaciones formales.
[PBI-023](pbis/PBI-023.md) es el primer PBI propuesto de R0 y está `Ready`,
con autorización pendiente; PBI-024–PBI-029 descomponen el resto de H1. Ninguno
está iniciado ni autoriza funcionalidad, R0 o cierre de Sprint 00.

## Estado del documento

**Estado:** Reconciliado para revisión final de Sprint 00.
**Orden R0 y ejecución:** no autorizados; owners definidos por rol.

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

`Draft` → `Ready for review` → `Ready` → `In progress` → `In review` →
`Done`. También se permiten `Blocked`, `Deferred`, `Superseded` y `Cancelled`
con una razón explícita. Sólo un PBI que satisfaga la
[Definition of Ready](../delivery/DEFINITION_OF_READY.md) puede quedar `Ready`
para revisión de autorización; `Ready` no autoriza inicio.

## Reglas de mantenimiento

1. El Product Owner aprueba prioridad y alcance; el equipo aporta riesgo, dependencia y esfuerzo.
2. Cada PBI conserva problema, valor, criterios verificables, exclusiones, dependencias, riesgos y evidencia.
3. Las tareas técnicas se crean sólo al preparar trabajo aprobado; no se usa el backlog para esconder decisiones.
4. Un cambio de alcance actualiza PBI, dependencias y sprint, manteniendo trazabilidad.
5. Estimaciones permanecen `TBD` hasta que el equipo acuerde método y contexto.

## Próxima revisión

En la revisión final independiente de Sprint 00 y PBI-023.
