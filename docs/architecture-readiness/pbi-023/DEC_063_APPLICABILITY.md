# Aplicabilidad de DEC-063

## Estado de entrada

- C01, C03 y C04: `Satisfied`.
- C02 y C05–C08: `Pending`.

No se cambia ese registro. SPIKE-002 y el Paso 4 aportan preparación material,
no cumplimiento final del PBI. El Paso 5 agrega evidencia fail-closed,
seguridad y trazabilidad del contrato de configuración, sin cerrar condiciones
runtime.

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

La [revisión de dependencias](dependency-installation/SUPPLY_CHAIN_REVIEW.md)
registra cierre transitivo, integridades, licencias, advisories, lifecycle,
reversibilidad y superficies preservadas. Reduce el riesgo de instalación,
pero no el riesgo inherente alto de persistencia tenant-scoped.

La [evidencia de configuración](typed-configuration/RESULTS.md) agrega cero
defaults, separación de roles/namespaces, TLS productivo, redaction, freeze y
rollback Git-only. C02/C06 avanzan de forma parcial; C05 continúa bloqueada
hasta migraciones, roles efectivos, PostgreSQL y recovery.

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

La fila de SPIKE-002 está satisfecha. El transaction runner completa rollback,
errores, cleanup y dos runs locales, pero no marca migración transaccional,
Linux CI, constraints, roles ni recovery como satisfechos.

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

C02/C05/C06 son gates materiales del primer merge persistente. El checker y la
instalación gobernada completan componentes estáticos/reversibles, pero no
PostgreSQL, mínimo privilegio ni controles runtime. C07 es pre-release. C08
permanece dormida hasta una excepción real.

## Evidencia del Paso 7

El [expediente transaccional](transaction-runner/README.md) aporta a C02 el
tratamiento fail-closed de nesting/timeout/rollback; a C05, atomicidad y cleanup
sin migración productiva; y a C06, sanitización y D5-R048. Los tres estados
siguen `Partial`: no existen todavía schema tenant-scoped, roles productivos,
job PostgreSQL autoritativo ni aprobación de merge.

## Evidencia del Paso 8

El [expediente del migration runner](migration-runner/README.md) aporta a C02
un cambio high-risk fail-closed; a C05, manifest, rollback/down, advisory lock,
dos runs y cleanup; y a C06, sanitización y D5-R049. Los estados permanecen
`Partial`: no existen primera migración/schema tenant-scoped, roles
productivos, job PostgreSQL autoritativo ni aprobación de merge.
