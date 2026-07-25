# Aplicabilidad de DEC-063

## Estado de entrada

- C01, C03 y C04: `Satisfied`.
- C02 y C05–C08: `Pending`.

No se cambia ese registro. SPIKE-002 aporta preparación material, no
cumplimiento final del PBI.

## Matriz

| Condición | Trigger | Aplicabilidad PBI-023 | Estado | Evidencia futura | Gate |
|---|---|---|---|---|---|
| C02 — riesgo fail-closed | antes de integrar riesgo medio/alto | directa | `Partial — checker PASS` | matriz/versionado/mutaciones completos; review runtime pendiente | antes del primer merge persistente |
| C05 — checklist persistence/migration | antes del primer cambio persistente | directa | `Partial — checker item PASS` | owner/naming/SQL static completos; PG/recovery/constraints pendientes | antes de primera migración/merge |
| C06 — checklist security | antes de tenant/auth/sensitive funcional | directa para tenant; auth no aplica | `Partial — static negatives PASS` | scope/leakage/sanitization scans completos; privilege/runtime pendiente | antes del primer merge tenant |
| C07 — release/hotfix | antes del primer release candidate | no bloquea planificación/implementación local | `Pending` | runbook, rollback, smoke y evidencia release | pre-release |
| C08 — waivers | antes de aprobar excepción | no activada | `Pending` | owner, razón, expiración, compensación y cierre | sólo ante excepción |

## C02 — clasificación

PBI-023 es `High`. La clasificación no puede reducirse porque el schema sea
pequeño. Un cambio en scoping, constraints, credenciales, migrador, pool,
checker o cleanup exige nueva revisión del
[RISK_ASSESSMENT.md](RISK_ASSESSMENT.md).

## C05 — checklist de persistencia/migración

Antes de cualquier cambio persistente:

- [ ] DEC-050 aceptada y condición aplicable identificada.
- [x] SPIKE-002 cerrado con PostgreSQL `18.4`.
- [ ] versión/owner/scope/invariantes de objeto registrados.
- [ ] migración ordenada, inmutable y transaccional.
- [ ] lock y fallo parcial probados.
- [ ] vacío/anterior/re-run probados.
- [ ] constraints y queries tenant/branch negativas.
- [ ] recovery/roll-forward probado.
- [ ] roles y secretos gobernados.
- [ ] logs y manifest sanitizados.
- [ ] cleanup seguro.
- [x] checker/gates actualizados con mutaciones.
- [ ] dos runs Linux equivalentes.
- [ ] aprobaciones por riesgo.

La fila de SPIKE-002 está satisfecha. Las demás conservan su estado hasta que
exista implementación, checker, roles, CI y revisión productivos.

## C06 — checklist de seguridad

Aplican a PBI-023:

- tenant y branch obligatorios/coherentes;
- denegación por omisión/conflicto;
- no enumeración de IDs ajenos;
- mínimo privilegio y separación app/migration;
- credenciales efímeras en test;
- sanitización de SQL/driver/secretos;
- no query global ordinaria;
- no RLS afirmado;
- cleanup allowlisted.

No aplican aún:

- PIN, password de usuario, sesión, roles/capabilities, step-up;
- endpoint/HTTP, cookie, CORS/CSRF;
- acción sensible de negocio.

## C07

Es pre-release. No bloquea esta planificación ni la futura implementación
local/CI de PBI-023. Sí bloquea declarar un release candidato. PBI-023 no
modifica release ni despliega.

## C08

No existe waiver, bypass o excepción. La condición no está activada y no se
marca satisfecha. Si un gate no puede cumplirse, el trabajo se detiene; no se
crea una excepción implícita.

## Dictamen

C02/C05/C06 son gates materiales del primer merge persistente. El checker
completa sus componentes estáticos, pero no PostgreSQL, mínimo privilegio ni
controles runtime. C07 es pre-release. C08 permanece dormida
hasta una excepción real.
