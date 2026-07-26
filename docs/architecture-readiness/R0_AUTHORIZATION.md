# Autorización formal de R0

## 1. Fecha

2026-07-24.

## 2. Autoridad

El Responsable del Proyecto, actuando también como Responsable de Producto,
autorizó esta revisión independiente para hacer efectiva B-21 si Sprint 00,
H0, DoR, H1, riesgos y gates resultaban conformes.

## 3. Estado inicial

La revisión recibió:

- Sprint 00 en `Formal Closure Remediation Complete / Final Review Pending`;
- R0 en `Authorization Review Ready`, no autorizado;
- H0 `Complete — 9/0`;
- B-21 `Satisfied — conditional effectiveness`;
- PBI-023 `Ready`, no iniciado;
- 24 contratos H1 abiertos y trazados.

Esta sección conserva el snapshot de entrada a la revisión; no describe el
estado vigente posterior al dictamen. Desde esta autorización, toda afirmación
preexistente en expedientes, verificaciones o resúmenes que presente la
autorización de R0 o el cierre de Sprint 00 como pendientes queda supersedida
únicamente como estado operativo actual por las secciones 5 y 14 de este
documento y por el cierre canónico de Sprint 00. Esos textos permanecen como
evidencia histórica y no constituyen revocación ni reapertura. Al 2026-07-26
no existe una revocación o reapertura formal posterior.

## 4. H0

H0 permanece `Complete — 9/0`. DEC-004/VC-024, DEC-005, DEC-044, DEC-049,
DEC-051, DEC-063 y los contratos de alcance que integran H0 conservan sus
estados y autoridades. Esta autorización no reabre ni amplía decisiones
aceptadas.

## 5. Sprint 00

[Sprint 00](../reviews/sprint-00/SPRINT_00_CLOSURE.md) queda `Closed`. El
criterio 14 permanece
`Partially met — Accepted deferred remainder`, gobernado por PBI-020.

## 6. B-21

B-21 queda `Satisfied — effective within the authorized scope`. Su condición
de cierre, PBI `Ready` y revisión independiente se cumplió. No constituye
autorización general del Repair MVP, otros PBIs, release o producción.

## 7. H1

Los 24 contratos exactos permanecen abiertos y asignados:

| PBI | Contratos H1 |
|---|---|
| PBI-023 | DEC-006–008, DEC-050, DEC-052 |
| PBI-024 | DEC-009–012 |
| PBI-025 | DEC-013–016 |
| PBI-026 | DEC-017–020 |
| PBI-027 | DEC-037–038 |
| PBI-028 | DEC-045–048 |
| PBI-029 | DEC-055 |

Se permite resolver contratos aplicables de forma incremental dentro del PBI
autorizado y antes de su trigger irreversible. Agruparlos no los acepta ni los
marca satisfechos. PBI-024–PBI-029 no quedan autorizados.

## 8. PBI-023

[PBI-023](../backlog/pbis/PBI-023.md) es el menor slice fundacional: PostgreSQL
18.4 real, migraciones gobernadas, ownership/repositorios tenant-scoped,
fixtures sintéticos y prueba negativa con dos tenants. Excluye API, auth, PIN,
sesiones, roles, UI, negocio, datos reales, deploy y ambiente compartido.

Estado al emitir esta autorización: `Ready / Authorized to start`; ejecución
aún no iniciada.

**Actualización de planificación 2026-07-24:** la estimación quedó fijada en
`13 SP` y DEC-050 fue aceptada con condiciones. La investigación documental de
SPIKE-002 no produjo —ni podía producir bajo sus restricciones— la evidencia
PostgreSQL ejecutable exigida. PBI-023 conserva autorización limitada, pero su
estado operativo al 2026-07-24 era `Blocked — executable SPIKE-002 evidence
pending`.

**Actualización material 2026-07-25:** SPIKE-002 ejecutó E1–E12 dos veces
contra PostgreSQL `18.4`, pasó comparación y cleanup y recibió dictamen
`PASS`. PBI-023 queda `Ready — SPIKE-002 materially verified /
implementation gates ready`; no está iniciado.

**Actualización de cierre 2026-07-25:** PBI-023 materializó el alcance
autorizado, ejecutó cinco suites críticas en PostgreSQL `18.4` dentro de los
dos runs autoritativos y recibió el dictamen `PASS — PBI-023 FORMALLY CLOSED`.
Su estado vigente es `Closed — PostgreSQL CI authoritative materialized and
formally reviewed`. Este cierre no amplía R0, no autoriza PBI-024, merge,
release o deploy y no satisface DEC051-C02, que continúa pendiente hasta el
primer merge real a `main`.

## 9. Definition of Ready

**Veredicto:** `READY WITH NON-BLOCKING NOTES — READY CONFIRMED`.

| Criterio DoR de implementación | Evidencia | Resultado / nota |
|---|---|---|
| Problema y fuente | Objetivo de PBI-023, plan H1, ADR-004 y DEC-049 | PASS |
| Valor y epic | Fundación tenant-scoped; EPIC-001 | PASS |
| Alcance y exclusiones | Secciones explícitas del PBI | PASS |
| Aceptación, errores y límites | 15 criterios observables, casos negativos, sanitización y cleanup | PASS |
| Dependencias | Satisfechas o incluidas con orden fail-closed | PASS |
| Riesgos y mitigación | Riesgo alto, RISK-001, dos tenants y gates DEC-051/063 | PASS |
| Estimación | Pendiente antes de compromiso | Nota no bloqueante para autorización; obligatoria antes de entrar a un sprint |
| Multitenancy | Scope explícito, constraints y casos cross-tenant | PASS |
| Sucursales | Runtime de sucursal/estación excluido; DEC-009–012 en PBI-024 | No aplica, justificado |
| Permisos | Auth/roles excluidos; este slice sólo demuestra scope de datos | No aplica, justificado |
| Datos | Ownership, lifecycle, migración, recuperación, constraints y cleanup | PASS |
| Seguridad y privacidad | Fail-closed, datos sintéticos, no secrets/PII/SQL en evidencia | PASS |
| Visual | No existe UI en el alcance | No aplica, justificado |
| Operación | PostgreSQL reproducible/aislado, lifecycle, cleanup y evidencia | PASS |
| Integraciones | No hay servicios externos ni ambiente compartido | No aplica, justificado |
| Preguntas bloqueantes | DEC-050 y SPIKE-002 eran los primeros gates internos | ambos cerrados para viabilidad; gates productivos siguen por paso |
| Documentación relacionada | ADR/DEC, H1, DoR/DoD, manifest y evidencia identificados | PASS |
| Decisión aprobada cuando sea necesaria | Stack/H0 aceptados; DEC-050 debía decidirse antes de migrar | PASS; DEC-050 quedó aceptada con condiciones |
| Estrategia de pruebas | PostgreSQL real, dos tenants, positivos/negativos, transacción y mutaciones | PASS |
| Evidencia QA | Registry, manifests, hashes, suites, comparación y dictámenes | PASS |
| Rollout/rollback | Sin producción/deploy; recuperación de migración sí es criterio | No aplica a rollout; recuperación cubierta |

| Campo de evaluación | Resultado |
|---|---|
| PBI | PBI-023 |
| Resultado | `Ready / Authorized to start` |
| No aplicables | Sucursal runtime, permisos, visual, integraciones y rollout, por exclusión verificable |
| Preguntas bloqueantes externas | Ninguna |
| Gates internos previos a código irreversible | DEC-050, SPIKE-002, DEC063-C02/C05/C06 y condiciones aplicables |
| Riesgo | Alto, fail-closed |
| Revisores por rol | Producto/Proyecto, Arquitectura, Seguridad, Operaciones y Calidad |
| Evidencia | PBI-023, plan H1, cierre Sprint 00 y este dictamen |

La nota de estimación impide comprometer el PBI a un sprint hasta acordarla;
no invalida la claridad del resultado ni autoriza saltar ese criterio.

## 10. Gates

Sobre `47db8047ab18ac1a76181f8170156d7fb091cc91` pasaron:

- Node.js `24.18.0` y pnpm `11.15.1`;
- frozen install, architecture, typecheck y build;
- 171/171 tests y 159/159 tests de arquitectura;
- `verify` y smoke compilado;
- `git diff --check` e índice vacío;
- 14 JSON y 2 YAML válidos;
- 369 Markdown con enlaces, anchors y fences válidos;
- 24 contratos H1 exactos, sin duplicados ni huérfanos;
- seis checks remotos verdes: push y pull request, run-1/run-2/comparison;
- cero reviews, comentarios o threads pendientes.

El run push `30138803792` ejecutó el head exacto. El run PR `30138805215`
está asociado al head exacto y ejecutó el merge sintético correcto con
`origin/main`.

## 11. Riesgos

- PBI-023 sigue siendo de riesgo alto y falla cerrado.
- DEC051-C02–C06/C08/C10 y DEC063-C02/C05–C08 siguen por trigger.
- PostgreSQL real, dos tenants y denegación cross-tenant son obligatorios.
- Las condiciones aplicables de DEC-050 deben preceder cada trigger; SPIKE-002
  ya cerró el gate material de viabilidad.
- La protección de `main` no se presume demostrada.
- `Authorized` no equivale a `In progress`, `Done`, `Released` o R0 aceptado.

## 12. Condiciones de autorización

La autorización permite únicamente:

1. preparar y comenzar PBI-023 después de acordar su estimación/compromiso;
2. materializar las condiciones de DEC-050 en orden fail-closed después del
   cierre `PASS` de SPIKE-002;
3. materializar exclusivamente la fundación técnica descrita;
4. satisfacer y demostrar las condiciones DEC-049/051/063 aplicables;
5. detenerse ante una decisión material no incluida o un gate rojo.

## 13. Exclusiones

No se autoriza:

- implementar todo el Repair MVP;
- iniciar PBI-024–PBI-029 sin su propio `Ready` y autorización;
- negocio, reparaciones, clientes, inventario o UI;
- endpoints, auth, PIN, sesiones, roles o permisos funcionales;
- datos reales, SQL manual no gobernado o secretos compartidos;
- deploy, producción, release o promoción de ambientes;
- omitir PostgreSQL real, aislamiento tenant, seguridad o gates;
- declarar R0 aceptado antes de demostrar su contrato de salida.

## 14. Resultado

**R0 AUTHORIZED**

La autorización es organizacional, limitada, reversible ante gate rojo y no
equivale a aceptación de la implementación futura.

## 15. Estado R0

`Authorized`.

PBI-023 ejerció la autorización limitada y está `Closed`. H1 continúa abierto;
PBI-024–PBI-029 no están autorizados. R0 aún debe completar los demás alcances,
demostrarse y recibir aceptación formal.

## 16. Siguiente acción

Tomar una decisión separada sobre promover el PR #2 de `Draft` a
`Ready for review`. La promoción no autoriza merge, PBI-024, release, deploy
ni aceptación de R0.
