# Remediación del cierre de Sprint 00

## Estado

- **Resultado:** `Formal Closure Remediation Complete / Final Review Pending`.
- **Fecha:** 2026-07-24.
- **Autoridad de Producto:** Responsable del Proyecto actuando también como
  Responsable de Producto.
- **Sprint 00:** abierto.
- **R0:** `Authorization Review Ready`; no autorizado.
- **PR #1:** Draft; merge fuera de alcance.

## 1. Resultado previo

La revisión anterior concluyó:
`BLOCKED — SPRINT 00 CLOSURE CRITERIA NOT MET`. El dictamen identificó un gate
organizacional sin resolución, contradicciones de estado, dos anchors rotos,
Review incompleta, PBI-001–PBI-021 sin reconciliación vigente y H1 sin
descomposición ejecutable.

## 2. Bloqueos

| Bloqueo | Estado tras remediación |
|---|---|
| VC-024/H0 contradictorios | Corregido: VC-024 `Closed / PASS`; H0 9/0 |
| Dos anchors internos rotos | Corregidos y sujetos al validador global |
| Review/Backlog/Goal incompletos | Reconciliados; cierre final pendiente |
| PBI-001–PBI-020 sin resultado | 13 `Done`, 6 `Deferred`, 1 `Superseded` |
| PBI-021 desactualizado | `Done`, con evidencia VC-024 |
| B-21 sin decisión | `Satisfied — conditional effectiveness` |
| H1 no ejecutable | 24 contratos inventariados en siete PBIs |
| Primer PBI R0 ausente | PBI-023 preparado para revisión de autorización |

## 3. Remediaciones

- Se distinguió la fotografía anterior del estado vigente.
- Se reconciliaron Sprint Goal, Sprint Backlog, Review, evaluación de cierre,
  backlog e índices actuales.
- Se preservaron decisiones aceptadas, evidencia autoritativa y documentos
  históricos.
- Se registró una única secuencia de paso: revisión final, cierre de Sprint 00
  y dictamen separado de autorización.

## 4. Contradicciones corregidas

[NEXT_R0_GATE_ASSESSMENT](../../architecture-readiness/NEXT_R0_GATE_ASSESSMENT.md)
ahora registra DEC-004 con evidencia verificada, PBI-021 `Done`, H0 9/0 y
VC-024 `Closed / PASS`. Los mapas vigentes de backlog/readiness usan los mismos
estados. Las afirmaciones previas se mantienen sólo donde el documento declara
expresamente que son una fotografía histórica.

## 5. Anchors corregidos

En [ADR_READINESS_MATRIX](ADR_READINESS_MATRIX.md) se corrigieron las
referencias a los anchors reales:

- `PROTOTYPE_CANDIDATES.md#spike-003`;
- `PROTOTYPE_CANDIDATES.md#spike-008`.

No se cambiaron los títulos de destino.

## 6. PBI-001–PBI-020

| Resultado | PBIs | Tratamiento |
|---|---|---|
| `Done` | 001–005, 007–012, 015–016 | Evidencia y resultado reconciliados |
| `Deferred` | 006, 013–014, 018–020 | Remanente, owner por rol e hito explícitos |
| `Superseded` | 017 | DEC-051 es el contrato canónico |

La tabla individual con estado anterior, evidencia y remanente está en la
[Review](../../sprints/sprint-00/REVIEW.md#resultado-por-pbi-001020).

## 7. PBI-021

[PBI-021](../../backlog/pbis/PBI-021.md) queda `Done`: VC-001–VC-024 fueron
ejecutados, VC-024 obtuvo `PASS` y la evidencia autoritativa Linux está
versionada. Las condiciones DEC-051/063 no satisfechas se conservan como gates
por trigger; no invalidan el alcance ya terminado ni autorizan funcionalidad.

## 8. Sprint Goal

Los 15 criterios canónicos fueron evaluados sin reescribir el objetivo:

- 14 `Met`;
- 1 `Partially met`;
- 0 `Not met`;
- 0 `Not applicable`.

El criterio 14 permanece parcial porque el repositorio sólo puede atestiguar
fuentes conocidas. La revisión final debe aceptar o rechazar esa limitación.

## 9. Review

La [Review](../../sprints/sprint-00/REVIEW.md) incluye fecha, autoridad real,
alcance, resultados por PBI, decisiones, evidencia, VC-024, H0, diferidos,
riesgos, deuda, Sprint Goal, decisión de Producto, recomendación y siguiente
hito. No se inventaron asistentes ni firmas.

## 10. Sprint Backlog

El [Sprint Backlog](../../sprints/sprint-00/SPRINT_BACKLOG.md) deja de ser
preliminar y registra ejecución/reconciliación, estado individual, elementos
diferidos, autoridad y fecha. Permanece abierto hasta revisión independiente.

## 11. B-21

El Responsable del Proyecto, actuando también como Responsable de Producto,
resolvió el 2026-07-24:

> Se autoriza preparar R0 y comenzar su implementación únicamente después de
> cerrar documentalmente Sprint 00, reconciliar los bloqueos detectados, crear
> un primer PBI que cumpla Definition of Ready y superar nuevamente la revisión
> final. Esta autorización no permite comenzar funcionalidad dentro de la
> presente tarea.

B-21 queda `Satisfied — conditional effectiveness`. No inicia R0, no elimina
H1, no sustituye DoR, no autoriza merge, deploy ni funcionalidad inmediata.

## 12. H1

Los 24 contratos exactos están en el
[plan H1](../../backlog/R0_H1_EXECUTION_PLAN.md): DEC-006–020, DEC-037–038,
DEC-045–048, DEC-050, DEC-052 y DEC-055. Cada fila identifica estado,
categoría, dependencia, aplicabilidad, bloqueo del primer PBI, capacidad de
resolución en R0, autoridad, PBI y orden.

## 13. Primer PBI R0

[PBI-023](../../backlog/pbis/PBI-023.md) es el menor slice fundacional:
PostgreSQL 18.4 real, migraciones gobernadas, ownership/repositories
tenant-scoped, fixtures sintéticos y prueba negativa con dos tenants. Excluye
API, autenticación, PIN, sesión, roles, UI y negocio.

PBI-023 está `Ready`, no iniciado y con autorización pendiente. Incluye dentro
de su alcance DEC-050, SPIKE-002, DEC-052 y las condiciones DEC-051/063
aplicables, por lo que no oculta una decisión material fuera de su slice.

## 14. Estado H0

- H0: 9 cerrados / 0 abiertos.
- H0 readiness: `Complete`.
- VC-024: `Closed / PASS`.
- Commit candidato VC-024:
  `becb61c98c3bdf51ba9574c985fb071556c9bc8a`.

## 15. Estado R0

R0 está `Authorization Review Ready` y **no autorizado**. H0 completo no
satisface automáticamente H1, no activa B-21 y no permite iniciar PBI-023.

## 16. Estado Sprint 00

Sprint 00 queda `Formal Closure Remediation Complete / Final Review Pending`.
Permanece abierto. Este documento no emite el dictamen independiente de cierre.

## 17. Evidencia

- [VC-024 formal](../../architecture-readiness/dec-004-linux-verification/vc-024/FORMAL_VERIFICATION.md).
- [PBI-021](../../backlog/pbis/PBI-021.md).
- [Sprint Goal](../../sprints/sprint-00/SPRINT_GOAL.md).
- [Review](../../sprints/sprint-00/REVIEW.md).
- [Sprint Backlog](../../sprints/sprint-00/SPRINT_BACKLOG.md).
- [Evaluación de cierre](SPRINT_00_CLOSURE_ASSESSMENT.md).
- [Plan H1](../../backlog/R0_H1_EXECUTION_PLAN.md).
- [PBI-023](../../backlog/pbis/PBI-023.md).

## 18. Riesgos

- Confundir `Ready` con autorizado o iniciado.
- Tratar condiciones DEC-051/063 pendientes como satisfechas por VC-024.
- Implementar persistencia antes de DEC-050/SPIKE-002 y sus gates.
- Resolver mecanismos de PIN, tiempo o secretos por conveniencia técnica.
- Cerrar Sprint 00 sin aceptar expresamente la limitación del criterio 14.
- Convertir el PR a Ready o mergearlo antes del gate independiente.

## 19. Elementos aún pendientes

- Revisión final independiente y decisión de cierre de Sprint 00.
- Dictamen separado que haga efectiva o rechace la autorización de R0.
- Confirmación independiente del DoR de PBI-023.
- DEC051-C02–C06/C08/C10.
- DEC063-C02/C05–C08.
- Materialización de los 24 contratos H1 por trigger.
- Protección demostrada de `main` y revisión/merge del PR por sus gates propios.

## 20. Recomendación para repetir revisión final

Repetir la revisión final sobre el commit documental publicado. Verificar
alcance, enlaces, estados, PBI-001–PBI-023, B-21, H1, condiciones
DEC-051/063, gates y preservación documental. Emitir por separado:

1. cierre o extensión de Sprint 00;
2. aceptación o rechazo del DoR de PBI-023;
3. autorización efectiva o no de R0.

Hasta entonces no iniciar funcionalidad, no convertir el PR a Ready y no hacer
merge.
