# SPRINT-00 — Sprint Backlog

## Estado del documento

- **Estado:** ejecutado, reconciliado y `Closed`.
- **Fecha de revisión:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto actuando también como Responsable de
  Producto.
- **Cierre del Sprint:** [dictamen final emitido](../../reviews/sprint-00/SPRINT_00_CLOSURE.md).
- **Capacidad/estimaciones históricas:** no acordadas; no se inventan.

Los veinte PBIs formaron la fundación documental inicial. El resultado final
expresa el cumplimiento real de cada PBI: un elemento `Deferred` o
`Superseded` no se presenta como `Done`.

## Resultado final de PBI-001 a PBI-020

| PBI | Resultado esperado | Clasificación anterior | Resultado final | Remanente / hito |
|---|---|---|---|---|
| [PBI-001](../../backlog/pbis/PBI-001.md) | Visión y principios | Committed / Ready for review | `Done` | Métricas cuantitativas, cuando exista evidencia de producto. |
| [PBI-002](../../backlog/pbis/PBI-002.md) | Actores/contextos | Requires product input / Draft | `Done` | Variaciones operativas por rebanada. |
| [PBI-003](../../backlog/pbis/PBI-003.md) | Alcance/exclusiones | Requires product input / Draft | `Done` | Alcances posteriores se deciden en su gate. |
| [PBI-004](../../backlog/pbis/PBI-004.md) | Glosario | Committed / Ready for review | `Done` | Evolución continua del vocabulario. |
| [PBI-005](../../backlog/pbis/PBI-005.md) | Mapa de módulos | Committed / Ready for review | `Done` | Aplicación de límites en R0. |
| [PBI-006](../../backlog/pbis/PBI-006.md) | Lecciones legacy | Committed / Ready for review | `Deferred` | Contraste adicional al planificar convivencia/migración. |
| [PBI-007](../../backlog/pbis/PBI-007.md) | Modelo multitenant | Committed / Ready for review | `Done` | Aplicación/pruebas en H1. |
| [PBI-008](../../backlog/pbis/PBI-008.md) | Identidad/permisos | Requires product input / Draft | `Done` | Mecanismos y composición en H1. |
| [PBI-009](../../backlog/pbis/PBI-009.md) | Sucursal/dispositivo/PIN | Requires product input / Draft | `Done` | Aplicación y threat model en H1. |
| [PBI-010](../../backlog/pbis/PBI-010.md) | Arquitectura objetivo | Committed / Ready for review | `Done` | Materialización por PBIs autorizados. |
| [PBI-011](../../backlog/pbis/PBI-011.md) | Estrategia de base de datos | Candidate / Draft | `Done` | DEC-050 y persistencia ejecutable en R0. |
| [PBI-012](../../backlog/pbis/PBI-012.md) | Backend/API | Candidate / decisión completada | `Done` | Aplicar ADR-005 y contratos derivados. |
| [PBI-013](../../backlog/pbis/PBI-013.md) | Web/design system | Blocked | `Deferred` | Antes del primer cliente web; no bloquea R0 técnico. |
| [PBI-014](../../backlog/pbis/PBI-014.md) | Realtime/mensajería | Candidate / Draft | `Deferred` | Cuando producto confirme canal y SLA. |
| [PBI-015](../../backlog/pbis/PBI-015.md) | Ambientes/despliegue | Candidate / Draft | `Done` | Proveedor y release en gates posteriores. |
| [PBI-016](../../backlog/pbis/PBI-016.md) | Workflow documental/ADR | Committed / Ready for review | `Done` | Mantenimiento continuo. |
| [PBI-017](../../backlog/pbis/PBI-017.md) | Testing/aislamiento | Committed / Ready for review | `Superseded` | DEC-051 y sus condiciones son el contrato canónico. |
| [PBI-018](../../backlog/pbis/PBI-018.md) | Security baseline | Committed / Ready for review | `Deferred` | Threat models y checklist DEC063-C06 en H1. |
| [PBI-019](../../backlog/pbis/PBI-019.md) | Observability baseline | Committed / Ready for review | `Deferred` | DEC-045 a DEC-048 en H1. |
| [PBI-020](../../backlog/pbis/PBI-020.md) | Preguntas/gates | Requires product input / Draft | `Deferred` | Registro vivo; la atestación de fuentes conocidas se revisa al cierre. |

## Elementos posteriores no incorporados retroactivamente

- [PBI-021](../../backlog/pbis/PBI-021.md): `Done`; toolchain y VC-024.
- [PBI-022](../../backlog/pbis/PBI-022.md): `Done`; DEC-005 materializada y
  verificada.
- [PBI-023](../../backlog/pbis/PBI-023.md): primer PBI técnico de R0,
  `Ready / Authorized to start`; no iniciado.
- PBI-024 a PBI-029: descomposición H1 `Draft`/`Blocked`, descrita en el
  [plan H1](../../backlog/R0_H1_EXECUTION_PLAN.md).

## Elementos diferidos

Los remanentes de PBI-006, PBI-013/014 y PBI-018/019/020 tienen owner por rol,
hito y condición de salida en sus documentos. No se eliminan ni se tratan como
cumplidos. Los contratos H1 conservan su autoridad y estado en el inventario.

## Aprobación y efecto

El Responsable del Proyecto/Producto revisó esta reconciliación el 2026-07-24.
El [dictamen final](../../reviews/sprint-00/SPRINT_00_CLOSURE.md) cerró Sprint
00 y la [autorización de R0](../../architecture-readiness/R0_AUTHORIZATION.md)
limitó el inicio a PBI-023. Este backlog no autoriza otros PBIs, release ni
producción.

## Próxima revisión

Retrospectiva y seguimiento de los diferidos en sus gates.
