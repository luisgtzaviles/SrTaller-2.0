# Clasificación de decisiones por hito

## Regla de conteo

Cada decisión tiene un hito primario para evitar doble conteo. Una fila puede imponer una condición secundaria posterior, indicada en la matriz maestra. `Cerrada`, una aceptación sin remanente o `Materialized / Formally Verified` significa que ya no bloquea; `Selection Approved / Evidence Pending` y `Selection Approved / Materialization Pending` continúan abiertas para el hito hasta aportar su evidencia.

## Distribución

| Hito primario | Decisiones evaluadas | Cerradas o aceptadas | Abiertas | Resultado |
| --- | ---: | ---: | ---: | --- |
| H0 — Primer cambio de implementación de R0 | 9 | 9 | 0 | Complete |
| H1 — R0 | 24 | 0 | 24 | R0 no programable |
| H2 — R1 | 21 | 1 | 20 | R1 no programable |
| H3 — Piloto | 9 | 0 | 9 | Piloto bloqueado |
| H4 — Producción | 6 | 0 | 6 | Producción bloqueada |
| H5 — Diferible | 13 | 13 diferidas | 0 para MVP | No bloquean MVP |
| **Total** | **82** | **22** | **60** | H0 completo; H1 y autorización organizacional pendientes |

## H0 — Antes del primer cambio de implementación de R0

`DEC-001`, `DEC-002`, `DEC-004`, `DEC-005`, `DEC-044`, `DEC-049`, `DEC-051`, `DEC-062` y `DEC-063`.

ADR-002 cierra `DEC-001`; la decisión del Responsable de Producto del
2026-07-21 cierra `DEC-002` y `DEC-062`; la sexta reverificación formal cierra
el remanente H0 de DEC-005 el 2026-07-23; y el Responsable del Proyecto acepta
DEC-044, DEC-049, DEC-051 y
[DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) el
2026-07-24. La
[verificación formal de VC-024](../dec-004-linux-verification/vc-024/FORMAL_VERIFICATION.md)
obtuvo `PASS` ese mismo día y cerró el remanente de DEC-004. DEC051-C01/C07/C09
y DEC063-C01/C03/C04 quedan `Satisfied`; las demás condiciones permanecen
`Pending`. H0 queda completo en 9 cerrados y 0 abiertos, sin autorizar R0.

## H1 — Antes de programar R0

`DEC-006` a `DEC-020`, `DEC-037`, `DEC-038`, `DEC-045` a `DEC-048`, `DEC-050`, `DEC-052` y `DEC-055`.

Estas decisiones protegen aislamiento, identidad, sesión, permisos, tiempo, persistencia, auditoría, observabilidad, datos de prueba y secretos.

## H2 — Antes de programar R1

`DEC-003`, `DEC-021` a `DEC-030`, `DEC-032` a `DEC-036`, `DEC-039` a `DEC-042` y `DEC-058`.

`DEC-042` — contingencia manual de identificación — está cerrada por decisión de dominio. Las veinte restantes necesitan cierre total o evidencia técnica antes de R1.

## H3 — Antes del piloto

`DEC-031`, `DEC-053`, `DEC-054`, `DEC-057`, `DEC-059`, `DEC-060`, `DEC-061`, `DEC-065` y `DEC-068`.

El piloto requiere el MVP R1–R5, recuperación ensayada y una operación limitada gobernable; no exige todavía todos los controles de producción general.

## H4 — Antes de producción

`DEC-056`, `DEC-064`, `DEC-066`, `DEC-067`, `DEC-069` y `DEC-070`.

Estas decisiones gobiernan retención, seguridad final, escala, comercialización SaaS y ciclo de vida del tenant.

## H5 — Diferible

`DEC-043` y `DEC-071` a `DEC-082`.

Se activan sólo por un caso de negocio, riesgo o métrica real. No forman un backlog implícito ni justifican módulos vacíos.

## Estado por capacidad de avance

| Capacidad | Estado | Motivo |
| --- | --- | --- |
| Documentar y diseñar ADRs | Permitido | Trabajo reversible y no ejecutable |
| Preparar spikes | Permitido sólo como diseño | Su ejecución necesita autorización |
| Scaffolding reversible | No autorizado | Gate organizacional y H1 abiertos |
| Fundación ejecutable | Bloqueada | H1 y autorización organizacional abiertos |
| Código de negocio R1 | Bloqueado | R0 no demostrado y H2 abierto |
| Piloto | Bloqueado | R1–R5 y H3 abiertos |
| Producción | Bloqueada | H4 abierto |
