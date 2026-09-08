# Gestión del backlog

El backlog convierte objetivos de producto en resultados verificables sin
confundir intención con compromiso. PBI-001–PBI-020 conservan su historia de
Sprint 00 y tienen resultado reconciliado. [PBI-021](pbis/PBI-021.md) y
[PBI-022](pbis/PBI-022.md) están `Done` después de sus verificaciones formales.
[PBI-023](pbis/PBI-023.md) está `Closed`.
[PBI-024](pbis/PBI-024.md) fue acotado a Trusted Station Runtime Context; la
rama/PR draft histórica es sólo fuente de recuperación selectiva. PBI-025–029
y PBI-031–036 materializan la partición aprobada de Identity & Context.
[PBI-030](pbis/PBI-030.md) materializa UI Foundation y Application
Shell V1, está integrado en `main` y su cierre es `Done` con Owner
Acceptance y disposición LOW del riesgo AT aprobadas. No está desplegado ni
`Released`; CI de implementación e independent review pasan.

## Estado del documento

**Estado:** Reconciliado con el MVP Operating Roadmap aprobado.
**Orden operativo:** PBI-030, PBI-027, PBI-029, PBI-024, PBI-032 y PBI-033
están `Done` y `Released: NO`; Sprint 01 está `Closed`. SPRINT-02 está
`Active`; PBI-025 quedó `Done` mediante PR #32 y CI exacto de `main` GREEN.
PBI-034 está `Done` después del cierre PR #34 y CI exacto GREEN; G3 está
`PASS`. PBI-026 está `Done`, G4 `PASS`; PBI-028 está `In progress` como único
PBI actual y WIP es `1/1`.

## Estructura

- [EPICS.md](EPICS.md): objetivos amplios y condiciones para descomposición.
- [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md): vista ordenable de PBIs.
- [PRIORITIZATION_MODEL.md](PRIORITIZATION_MODEL.md): factores para discutir orden.
- [DEPENDENCY_MAP.md](DEPENDENCY_MAP.md): secuencia y bloqueos conceptuales.
- [MVP Operating Roadmap](../product/MVP_OPERATING_ROADMAP.md): fases, WIP y
  checkpoint vigente.
- [pbis/README.md](pbis/README.md): índice de archivos individuales.
- [PBI-030 Readiness Review](../design-system/PBI_030_READINESS_REVIEW.md):
  gates, DoR `PASS` y frontera de autorización de la foundation visual.

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

1. El Product Owner aprueba prioridad, alcance, aceptación y autorización de
   implementación; el equipo aporta riesgo, dependencia y esfuerzo.
2. Cada PBI conserva problema, valor, criterios verificables, exclusiones, dependencias, riesgos y evidencia.
3. Las tareas técnicas se crean sólo al preparar trabajo aprobado; no se usa el backlog para esconder decisiones.
4. Un cambio de alcance actualiza PBI, dependencias y sprint, manteniendo trazabilidad.
5. Estimaciones permanecen `TBD` hasta que el equipo acuerde método y contexto.
6. Sólo un PBI puede estar en ejecución o cierre; el siguiente se selecciona
   mediante avance documental y no comienza automáticamente.

## Próxima revisión

Completar PBI-028, focused High-risk review y CI exacto del candidato. No
iniciar otro PBI, liberar ni desplegar.
