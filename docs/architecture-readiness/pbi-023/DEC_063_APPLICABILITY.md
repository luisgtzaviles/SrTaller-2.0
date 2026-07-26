# Aplicabilidad de DEC-063

## Estado de entrada

- C01, C03 y C04: `Satisfied`.
- C02/C05/C06: materialmente completas para el scope PBI-023; ratificación
  formal pendiente.
- C07/C08: `Pending` según trigger.

SPIKE-002 y los Pasos 4–10 aportaron preparación material. El Paso 11 completa
la evidencia runtime/CI aplicable, pero no sustituye la ratificación de cierre,
el gate de release ni decisiones operativas productivas.

## Matriz

| Condición | Trigger | Aplicabilidad PBI-023 | Estado | Evidencia futura | Gate |
|---|---|---|---|---|---|
| C02 — riesgo fail-closed | antes de integrar riesgo medio/alto | directa | `Complete for PBI-023 scope — closure ratification pending` | checker/runtime/CI/evidencia completos | revisión formal de cierre |
| C05 — checklist persistence/migration | antes del primer cambio persistente | directa | `Complete for PBI-023 scope — closure ratification pending` | owner/migration/PG/recovery/constraints/CI | revisión formal de cierre |
| C06 — checklist security | antes de tenant/auth/sensitive funcional | directa para tenant; auth no aplica | `Complete for PBI-023 scope — production privilege pending` | scope/leakage/sanitización/CI completos | revisión formal de cierre |
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

- [x] DEC-050 aceptada y condición aplicable identificada.
- [x] SPIKE-002 cerrado con PostgreSQL `18.4`.
- [x] versión/owner/scope/invariantes de objeto registrados.
- [x] migración ordenada, inmutable y transaccional.
- [x] lock y fallo parcial probados.
- [x] vacío/anterior/re-run probados.
- [x] constraints y queries tenant/branch negativas.
- [x] recovery/roll-forward probado para el alcance efímero.
- [x] roles y secretos sintéticos gobernados; operación productiva diferida.
- [x] logs y manifest sanitizados.
- [x] cleanup seguro.
- [x] checker/gates actualizados con mutaciones.
- [x] dos runs Linux equivalentes.
- [ ] aprobación formal de cierre por riesgo.

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

## Evidencia del Paso 9

La [primera migración productiva](first-productive-migration/RESULTS.md)
aporta a C02 un cambio high-risk con checker y rollback fail-closed; a C05,
schema exacto, manifest/drift, up/down/reapply, atomicidad e introspección; y a
C06, aislamiento estructural negativo, sanitización y cleanup. Las condiciones
permanecen parciales para adapters, CI, privilegio operacional y release; no se
cierran C07/C08.

## Evidencia del Paso 11

El [expediente CI](postgresql-ci/README.md) completa checker, runtime,
PostgreSQL `18.4`, migración, schema, adapters, negativos, comparación,
artifacts, sanitización y cleanup en Linux. C02/C05/C06 quedan materialmente
completas para el alcance PBI-023 y pasan a ratificación en la revisión formal
de cierre. Esto no resuelve privilegios/provider productivos.

C07 continúa reservado al release y C08 no se activó porque no existe waiver.
