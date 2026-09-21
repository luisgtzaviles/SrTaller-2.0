# Development Workflow Efficiency Audit

> **HISTORICAL:** este análisis conserva observaciones y opciones de su fecha.
> No es política operacional vigente. Las decisiones materializadas están en
> `DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md`; el workflow actual y su
> autoridad se definen en `DEVELOPMENT_AND_DELIVERY_WORKFLOW.md` y
> `SOURCE_OF_TRUTH.md`.

**Estado:** Audit complete — Owner decisions recorded

**Fecha de corte:** 2026-09-14

**Alcance:** PBI-039, PBI-040 y PBI-043

**Naturaleza:** Diagnóstico y propuesta. Este documento no cambia el workflow,
CI, Branch Policy, producto, migraciones ni autoridad Owner.

## 1. Executive summary

El workflow vigente sí está comprando seguridad real. Durante los tres PBIs
auditados detectó defectos de contratos, aislamiento de datos, rollback,
integridad del candidato, runtime de producción, rutas SPA, configuración de
Preview y determinismo. La recomendación no es reducirlo a “compila y merge”.

El costo excesivo proviene de cuatro fuentes distintas:

1. `verify:full` se volvió la respuesta por defecto durante iteraciones Owner,
   aunque muchas modificaciones sólo requerían pruebas focalizadas.
2. Cada leg de CI repite internamente arquitectura, typecheck, build y tests que
   después vuelve a ejecutar `verify`.
3. Commits documentales posteriores al candidato funcional disparan la misma
   campaña que un cambio de migración o autorización.
4. Algunos defectos específicos de Preview —orden real de migraciones, variables
   de entorno y rutas directas— sólo se buscaron después del merge.

La evidencia medida es material:

- 52 campañas locales `verify:full`: 34 PASS, 18 FAIL y 175.5 minutos de
  ejecución. PBI-040 por sí solo consumió 39 campañas y 131.4 minutos.
- 28 workflows Linux: 410.0 minutos de pared y 641.7 job-minutes.
- En el exact-main más reciente, cada leg empleó aproximadamente 340 segundos
  en invocaciones que ya estaban cubiertas dentro del mismo leg por `verify` o
  por suites más amplias.
- Los diez pares PR/merge examinados produjeron exactamente el mismo Git tree.
  Aun así, cada merge pagó nuevamente la campaña completa porque la evidencia
  actual está ligada al commit SHA, no a una identidad verificable del árbol.

Se recomienda una transición en dos fases:

1. **Option A, inmediata y conservadora:** eliminar duplicación interna, añadir
   preflights tempranos, instrumentar métricas, usar pruebas focalizadas durante
   iteraciones y reservar un full local autoritativo para el freeze funcional.
2. **Option B, sólo después de un piloto en sombra:** clasificador de riesgo
   fail-closed, pipelines proporcionales al delta y exact-main reducido cuando
   una atestación criptográfica demuestre identidad completa del candidato.

Esto conserva VC-024, independent review, evidencia exacta, seguridad de
migraciones y validación real de Preview. La primera fase puede reducir entre
30 % y 45 % del cómputo CI sin cambiar qué riesgos se demuestran. La segunda
puede llevar cierres normales hacia el objetivo de menos de 45 minutos, pero
requiere decisiones Owner y diseño formal antes de activarse.

## 2. Current workflow map

El camino vigente, reconstruido desde
[`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](DEVELOPMENT_AND_DELIVERY_WORKFLOW.md),
[`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md),
[`BRANCH_POLICY.md`](BRANCH_POLICY.md) y
[`TRACEABILITY_MODEL.md`](TRACEABILITY_MODEL.md), es:

```text
Owner iterations
  -> Owner functional review
  -> Owner Acceptance
  -> Formal UI Verification
  -> hardening/remediation
  -> local verify:full
  -> PR readiness
  -> PR
  -> Linux CI run-1
  -> Linux CI run-2
  -> exact comparison
  -> independent review
  -> merge
  -> exact-main full CI
  -> Preview deployment
  -> Preview-specific validation
  -> closure reconciliation
  -> branch cleanup
```

Hay tres fronteras de autoridad que deben seguir separadas:

- **Candidato local:** demuestra comportamiento y contratos en el ambiente
  gobernado de desarrollo.
- **Candidato PR:** CI Linux y VC-024 demuestran reproducibilidad independiente
  y evidencia comparable para un SHA concreto.
- **Release en Preview:** demuestra configuración, datos, routing y activación
  de un runtime real. Ni un PASS local ni un PASS de CI otorgan esa evidencia.

### Qué ejecuta hoy `verify:full`

El orquestador vigente ejecuta trece etapas:

0. preflight de candidato e integración;
1. toolchain gobernado;
2. integridad del repositorio;
3. `verify` base;
4. PostgreSQL composite;
5. PostgreSQL material de PBI-039;
6. PostgreSQL material de PBI-040;
7. runtime PostgreSQL tipo Preview;
8. provisión PostgreSQL para compiled smoke;
9. compiled backend smoke;
10. compiled UI smoke;
11. cleanup;
12. fingerprint final y evidencia.

PBI-039 y PBI-043 usaron la versión anterior de doce etapas, antes de añadir el
stage PostgreSQL de PBI-040.

## 3. Measured history: PBI-039, PBI-040 and PBI-043

### Resumen cuantitativo

| PBI / período | Full locales | PASS | FAIL | Minutos locales | Workflows CI | Minutos pared CI | Job-minutes CI |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| PBI-039 | 9 | 6 | 3 | 29.2 | 13 | 238.4 | 317.4 |
| PBI-040 antes de pausa | 16 | 11 | 5 | 55.0 | — | — | — |
| PBI-043 | 4 | 3 | 1 | 14.9 | 6 | 66.4 | 127.7 |
| PBI-040 reanudado/cierre | 23 | 14 | 9 | 76.4 | 9 | 105.2 | 196.6 |
| **Total** | **52** | **34** | **18** | **175.5** | **28** | **410.0** | **641.7** |

Los minutos locales provienen de los resúmenes JSON de `verify:full`
conservados por el runner local. Los tiempos CI provienen de las ejecuciones y
jobs autoritativos de GitHub auditados el 2026-09-14. Son tiempo de máquina y
tiempo de pared observados; no incluyen toda la espera humana entre eventos.

### PBI-039

Hallazgos reales:

- contratos incompletos del fixture/read model y UI;
- parser de infraestructura incompatible con la salida TAP de Node 24;
- Escape se propagaba desde un control anidado y cerraba la superficie superior;
- wrap visual de Conceptos;
- Preview sirvió un índice cacheado que referenciaba un bundle retirado;
- el contenedor de producción no inicializaba repositorios privados de Repairs,
  aunque `/readyz` permanecía sano.

Costos evitables:

- cinco de seis campañas de PR posteriores al primer candidato fueron motivadas
  por deltas exclusivamente documentales;
- parte del cierre volvió a probar el mismo árbol ejecutable por cambios de
  evidencia, Sprint e índices.

### PBI-040

Hallazgos reales:

- esquema PostgreSQL, limpieza owner-scoped y fixtures de Access no conocían las
  nuevas tablas de catálogo/precios;
- contratos de arquitectura y allowlists de artefactos quedaron obsoletos;
- cambios protegidos de PBI-039 fueron detectados por el preflight;
- rollback de Access asumía que PBI-043 era la última migración y no revertía
  migraciones posteriores de Catalog;
- collector CI rechazó un artefacto de runtime provenance gobernado;
- Preview contenía una migración posterior mientras cinco migraciones PBI-040
  aún tenían timestamps anteriores;
- las rutas directas `/listas/precios` y Configuración/Catálogos no estaban en
  el allowlist SPA del runtime publicado.

Costos evitables:

- 39 campañas full locales durante iteración y reconciliación;
- campañas completas después de cambios de documentos/evidencia;
- hotfixes de migración y routing sólo después de merge, porque esos estados no
  tenían un preflight equivalente antes del PR;
- el mismo trabajo base se repitió dentro de cada leg y luego otra vez en
  exact-main.

### PBI-043

Hallazgos reales:

- el fingerprint final detectó que el candidato mutó durante verificación;
- independent review encontró oráculos débiles de concurrencia y evidencia que
  afirmaba más de lo demostrado;
- el primer contenedor de Preview falló con
  `DATABASE_RUNTIME_SCHEMA_NOT_READY` hasta aplicar la migración one-shot.

La repetición de dos legs fue valiosa aquí: concurrencia, sesiones y revocación
son material de autorización y requieren la defensa VC-024. El ahorro debe venir
de no ejecutar dos veces el mismo stage dentro de cada leg, no de retirar la
independencia entre legs.

### Ledger completo de campañas locales

Claves: `VF12`/`VF13` indican el orquestador full de 12/13 etapas; `—` significa
que no apareció un defecto nuevo; “antes” indica si una guard especializada
podía haberlo encontrado antes del full. Todos los timestamps son UTC.

| Inicio | PBI | min | HEAD | resultado / stage | finding | ¿antes? | señal solapada |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| 09-11 03:01 | 039 | 1.4 | `94065dfe` | FAIL base | contratos incompletos | sí, focused contracts | parcial |
| 09-11 03:14 | 039 | 1.7 | `94065dfe` | FAIL base | parser TAP obsoleto | sí, self-test runner | no |
| 09-11 03:16 | 039 | 3.8 | `94065dfe` | PASS VF12 | — | — | luego CI |
| 09-11 03:42 | 039 | 4.1 | `8b1d91ef` | PASS VF12 | — | — | luego CI |
| 09-11 03:46 | 039 | 4.2 | `8b1d91ef` | PASS VF12 | — | — | repetición local |
| 09-11 05:45 | 039 | 4.2 | `f32f41df` | PASS VF12 | — | — | docs delta |
| 09-11 14:51 | 039 | 1.6 | `6c04e57c` | FAIL base | contrato stale tras remediation | sí, focused | parcial |
| 09-11 14:53 | 039 | 4.1 | `6c04e57c` | PASS VF12 | — | — | luego CI |
| 09-11 15:41 | 039 | 4.1 | `5ccc525a` | PASS VF12 | — | — | luego CI |
| 09-12 00:48 | 040 | 2.1 | `766a38c7` | FAIL PG composite | schema/fixture catálogo | sí, impacted PG | no |
| 09-12 00:50 | 040 | 2.1 | `e1ecb55c` | FAIL PG composite | cleanup owner-scoped | sí, impacted PG | no |
| 09-12 00:55 | 040 | 2.8 | `6b067588` | FAIL PG composite | roles/currency fixtures | sí, impacted PG | no |
| 09-12 01:06 | 040 | 4.3 | `409852a3` | PASS VF13 | — | — | luego CI |
| 09-12 01:18 | 040 | 4.1 | `fb730586` | PASS VF13 | — | — | iteración |
| 09-12 01:22 | 040 | 4.3 | `fb730586` | PASS VF13 | — | — | duplicado exacto local |
| 09-12 02:17 | 040 | 1.7 | `99dae3df` | FAIL base | reglas arquitectura stale | sí, architecture focused | parcial |
| 09-12 02:21 | 040 | 4.6 | `37c3dde2` | PASS VF13 | — | — | iteración |
| 09-12 02:26 | 040 | 4.0 | `aef7d3a7` | PASS VF13 | — | — | iteración |
| 09-12 02:49 | 040 | 3.8 | `aef7d3a7` | PASS VF13 | — | — | duplicado exacto local |
| 09-12 03:23 | 040 | 4.0 | `7d8f626c` | PASS VF13 | — | — | iteración |
| 09-12 03:56 | 040 | 3.9 | `b903eab1` | PASS VF13 | — | — | iteración |
| 09-12 04:29 | 040 | 3.9 | `453eeb09` | PASS VF13 | — | — | iteración |
| 09-12 04:35 | 040 | 4.1 | `1487dcfa` | PASS VF13 | — | — | iteración |
| 09-12 21:17 | 040 | 1.5 | `b2798df0` | FAIL base | provenance fuera de allowlist | sí, artifact contract | parcial |
| 09-12 21:19 | 040 | 3.9 | `52679c2d` | PASS VF13 | — | — | iteración |
| 09-13 00:24 | 043 | 3.5 | `ae5e9bf8` | PASS VF12 | — | — | luego CI |
| 09-13 00:47 | 043 | 3.8 | `b76e75bc` | FAIL fingerprint | candidato mutó | no, ésta es la guard | no |
| 09-13 00:53 | 043 | 3.7 | `fcf1eba4` | PASS VF12 | — | — | luego CI |
| 09-13 01:00 | 043 | 4.0 | `65cf2da6` | PASS VF12 | — | — | luego CI |
| 09-13 04:55 | 040 | 3.8 | `28320b39` | PASS VF13 | — | — | iteración |
| 09-13 06:23 | 040 | 1.6 | `8b21cb68` | FAIL base | UI contract compartido | sí, focused UI | parcial |
| 09-13 06:25 | 040 | 3.5 | `bc9fcab9` | FAIL PG | rollback Access/Catalog | sí, impacted PG | no |
| 09-13 06:29 | 040 | 2.9 | `bc9fcab9` | FAIL PG | mismo rollback | sí, impacted PG | duplicado |
| 09-13 06:38 | 040 | 3.5 | `4ef0fc9d` | PASS VF13 | — | — | iteración |
| 09-13 06:45 | 040 | 3.5 | `3b8d0e3c` | PASS VF13 | — | — | iteración |
| 09-13 21:48 | 040 | 0.0 | `3b8d0e3c` | FAIL preflight | superficie PBI-039 tocada | no, guard correcta | no |
| 09-13 21:49 | 040 | 4.2 | `3b8d0e3c` | PASS VF13 | — | — | mismo tree tras reconciliar |
| 09-13 21:56 | 040 | 4.3 | `c8410bf8` | PASS VF13 | — | — | iteración |
| 09-13 22:34 | 040 | 1.7 | `530d51c4` | FAIL base | conteo migraciones 60→61 | sí, migration manifest | parcial |
| 09-13 22:36 | 040 | 3.7 | `c7d94533` | FAIL PG | teardown Access incompleto | sí, rollback focused | no |
| 09-13 22:42 | 040 | 4.4 | `f4ace4af` | PASS VF13 | — | — | iteración |
| 09-13 23:37 | 040 | 0.0 | `a5448af1` | FAIL integrity | whitespace documental | sí, docs lint | no |
| 09-13 23:38 | 040 | 3.8 | `a5448af1` | FAIL PG | teardown no conocía merge event | sí, impacted PG | no |
| 09-13 23:46 | 040 | 4.2 | `229fafb9` | PASS VF13 | — | — | iteración |
| 09-13 23:59 | 040 | 4.4 | `0720813f` | PASS VF13 | — | — | iteración |
| 09-14 00:04 | 040 | 4.2 | `aecd6c43` | PASS VF13 | — | — | iteración |
| 09-14 02:47 | 040 | 3.8 | `33d83e3e` | PASS VF13 | — | — | final local |
| 09-14 03:05 | 040 | 3.8 | `dd3cf105` | PASS VF13 | — | — | evidence/CI fix |
| 09-14 04:08 | 040 | 3.2 | `91bbfabe` | FAIL PG | rollback tras rename migration | sí, migration preflight | no |
| 09-14 04:15 | 040 | 3.9 | `91bbfabe` | PASS VF13 | — | — | hotfix migration |
| 09-14 04:55 | 040 | 4.0 | `a3cd6119` | PASS VF13 | — | — | routing hotfix |
| 09-14 05:01 | 040 | 4.1 | `68316b01` | PASS VF13 | — | — | routing hotfix final |

### Ledger completo de workflows Linux

Cada workflow ejecutó dos legs Ubuntu 24.04 y comparación, salvo que una falla
impidiera llegar a comparison. `wall` mide la duración observable del workflow;
`jobs` suma el tiempo de sus jobs. `docs` significa que el delta de ese SHA no
cambiaba bytes ejecutables del producto.

| Run | PBI | propósito | SHA | resultado | wall/job min | finding / solape |
| ---: | --- | --- | --- | --- | ---: | --- |
| 34562890493 | 039 | PR docs/readiness | `80c49150` | PASS | 16.7 / 31.1 | sin finding; full por docs |
| 34564110272 | 039 | PR docs/evidence | `f32f41df` | PASS | 19.2 / 37.2 | sin finding; full por docs |
| 34567516069 | 039 | fix ejecutable | `e51729c1` | PASS | 87.6 / 37.4 | señal útil; wall incluye bloqueo externo |
| 34574461352 | 039 | PR docs/review | `c7835f39` | PASS | 11.9 / 23.1 | sin finding; full por docs |
| 34577352782 | 039 | PR docs/Sprint | `0e0ceda4` | PASS | 11.5 / 20.2 | sin finding; full por docs |
| 34603394588 | 039 | PR docs/backlog | `67337651` | PASS | 11.7 / 20.1 | sin finding; full por docs |
| 34604591354 | 039 | exact-main | `6c04e57c` | PASS | 12.3 / 22.3 | tree ya verificado; repetición completa |
| 34613325999 | 039 | remediation PR | `1469f8fd` | PASS | 11.5 / 22.0 | cambio ejecutable; señal útil |
| 34614530586 | 039 | exact-main | `5ccc525a` | PASS | 11.9 / 22.5 | tree idéntico |
| 34618135275 | 039 | remediation PR | `667bf4c2` | PASS | 11.3 / 19.5 | runtime/cache; señal útil |
| 34619271236 | 039 | exact-main | `0d1c5760` | PASS | 9.2 / 17.7 | tree idéntico |
| 34621835918 | 039 | closure PR | `745b25c3` | PASS | 12.1 / 22.4 | docs; full por trazabilidad |
| 34623060504 | 039 | exact-main closure | `40684d75` | PASS | 11.5 / 22.0 | tree idéntico |
| 34725299162 | 043 | readiness PR | `e4f64615` | PASS | 11.8 / 21.9 | docs; full por trazabilidad |
| 34725827409 | 043 | exact-main readiness | `9ed68856` | PASS | 11.6 / 22.6 | tree idéntico |
| 34729684465 | 043 | feature PR | `65cf2da6` | PASS | 9.2 / 17.1 | autorización; dos legs justificados |
| 34730090448 | 043 | exact-main feature | `aab27d98` | PASS | 11.4 / 22.3 | tree idéntico |
| 34731700059 | 043 | closure PR | `84124647` | PASS | 11.4 / 22.2 | docs; full por trazabilidad |
| 34732201476 | 043 | exact-main closure | `5be5cd60` | PASS | 11.1 / 21.6 | tree idéntico |
| 34800704258 | 040 | feature PR | `6b8a5172` | FAIL | 11.3 / 20.6 | collector rechazó provenance; CI-specific |
| 34801674770 | 040 | feature PR retry | `b035a617` | PASS | 11.8 / 20.7 | collector corregido |
| 34802433615 | 040 | exact-main | `91bbfabe` | PASS | 12.5 / 21.4 | tree idéntico |
| 34805632530 | 040 | migration hotfix PR | `40bbed50` | PASS | 10.3 / 19.7 | migración; full justificado |
| 34806294225 | 040 | exact-main hotfix | `a3cd6119` | PASS | 12.4 / 23.9 | tree idéntico, riesgo alto |
| 34808427617 | 040 | routing hotfix PR | `68316b01` | PASS | 9.7 / 18.1 | runtime route; señal útil |
| 34809054770 | 040 | exact-main routing | `09e14c89` | PASS | 12.0 / 23.5 | tree idéntico |
| 34813085050 | 040 | closure docs PR | `0624eae9` | PASS | 12.8 / 24.2 | docs; full por trazabilidad |
| 34814070839 | 040 | exact-main closure | `a0604941` | PASS | 12.6 / 24.6 | tree idéntico |

En los diez pares PR/merge examinados, `git rev-parse <sha>^{tree}` coincidió
exactamente. Esto es evidencia histórica favorable para una atestación futura;
no autoriza omitir exact-main bajo el contrato vigente.

## 4. Gate value classification

| Gate | Clase | Razón |
| --- | --- | --- |
| Owner functional review | A — unique signal | Valida utilidad y semántica que los tests no pueden decidir. |
| Focused contract/unit tests | A | Feedback temprano sobre el delta exacto. |
| Impacted PostgreSQL suite | A | Detecta schema, aislamiento, rollback y fixtures afectados. |
| Formal browser verification | A | Geometría, interacción, foco y comportamiento real. |
| Local `verify:full` en freeze | B — justified defense | Integra módulos y produce fingerprint antes de push. |
| Full local tras cada ajuste menor | C — duplicated | Repite material no afectado sin cambiar ambiente. |
| Candidate/integration fingerprint | A | Detectó mutación real de PBI-043. |
| PR CI run-1 | A | Linux limpio y autoridad de CI. |
| PR CI run-2 | B | Independencia/determinismo exigidos por VC-024. |
| Comparison exacta | A | Es la prueba de equivalencia entre legs; además es barata. |
| Stages explícitos repetidos por `verify` en el mismo leg | C | Mismo checkout, ambiente y comandos; no añade independencia. |
| Exact-main full con tree diferente | A/B | Verifica lo que realmente se fusionó. |
| Exact-main full con tree idéntico y atestación completa inexistente | B hoy | Defensa necesaria bajo el contrato actual. |
| Exact-main full con tree idéntico y futura atestación completa | C potencial | Podría sustituirse por integrity/attestation reducido. |
| Preview runtime/migration/session/routing | A | Sólo Preview puede demostrar ese estado externo. |
| Encontrar por primera vez en Preview algo simulable | E — too late | La señal es valiosa, pero falta preflight anterior. |
| Full CI por commit documental no ejecutable | C | No añade señal de producto; hoy cubre trazabilidad por ausencia de gate especializado. |
| Independent review del candidato funcional final | A | Encontró oráculos débiles en PBI-043. |
| Re-review por evidencia automática sin delta semántico | C | No invalida la revisión funcional. |
| Living-doc reconciliation post-merge mediante otro ciclo completo | D — legacy/problem | El propio merge ya hizo efectivo Done; genera recursión documental. |

No se identificó un gate completo que deba eliminarse como “obsoleto” sin
reemplazo. La mayor oportunidad está dentro de los gates y en su selección.

## 5. Duplication matrix

`●` ejecuta/demuestra; `○` sólo valida efecto runtime; `—` no corresponde.

| Stage | local full | PR run-1 | PR run-2 | main CI | Preview |
| --- | :---: | :---: | :---: | :---: | :---: |
| toolchain pins | ● | ● | ● | ● | ○ |
| integrity / clean tree | ● | ● | ● | ● | — |
| architecture | ● | ●×2+ | ●×2+ | ●×2+ | — |
| typecheck | ● | ●×2 | ●×2 | ●×2 | — |
| build | ● | ●×2 | ●×2 | ●×2 | ○ deployed build |
| broad unit/contracts | ● | ●×2 | ●×2 | ●×2 | — |
| dedicated architecture suite | ● | ● además de broad | ● además de broad | ● además de broad | — |
| migrate smoke | ● | ● | ● | ● | ○ real journal |
| PG composite | ● | ● | ● | ● | ○ real data/state |
| PBI-039 PG | ● | ● | ● | ● | — |
| PBI-040 PG | ● | no actualmente | no actualmente | no actualmente | — |
| Preview-like PG runtime | ● | no actualmente | no actualmente | no actualmente | ○ real runtime |
| compiled backend smoke | ● | ● | ● | ● | ○ |
| compiled UI route smoke | ● | ● | ● | ● | ○ real routing/TLS |
| final fingerprint | ● | evidence manifest | evidence manifest | evidence manifest | release SHA |
| exact comparison | — | input | input | input | — |

La duplicación marcada `×2` sucede dentro de cada leg: CI llama architecture,
typecheck, build y tests explícitamente y después `verify` vuelve a llamarlos.
Las suites de arquitectura aparecen en el broad test, en una invocación dedicada
y nuevamente en el broad test interno de `verify`.

## 6. Failures caught by each gate

| Gate | Defectos observados | Valor que debe conservarse |
| --- | --- | --- |
| focused/base contracts | UI/read-model incompleto, rulesets stale, artifact allowlist | feedback inmediato |
| PostgreSQL material | schema, cleanup owner-scoped, rol/currency fixtures, rollback ordering | persistencia e isolation reales |
| preflight/fingerprint | protected surface modificada, dirty/mutating candidate | identidad del candidato |
| Formal UI | Escape propagation, wrap de Conceptos | interacción/geometría real |
| independent review | oráculos de concurrencia débiles, evidencia sobreafirmada | revisión crítica separada |
| PR CI | collector/provenance incompatible con evidencia Linux | autoridad y packaging CI |
| Preview | cache/bundle stale, repository init de producción, migration drift, schema no listo, direct-route 404 | estado ambiental real |

Ninguna categoría justifica ejecutar todo en cada iteración. Sí justifica que el
workflow final conserve un lugar inequívoco para cada señal.

## 7. Problems detected too late

| Problema | Dónde apareció | Dónde debió detectarse |
| --- | --- | --- |
| índice cacheado apuntaba a bundle retirado | Preview PBI-039 | production-image/cache-header smoke pre-merge |
| repositorios Repairs no inicializados en producción | Preview PBI-039 | compiled runtime con `NODE_ENV=production` |
| migration timestamps anteriores al journal ya desplegado | Preview PBI-040 | manifest snapshot pre-PR/pre-merge |
| rutas directas nuevas ausentes del allowlist SPA | Preview PBI-040 | route registry/production-image direct-route smoke |
| schema requerido no aplicado antes de activar runtime | Preview PBI-043 | deployment preflight y orden migrate-before-activate |
| variable de build SHA ausente o mal formada | deploy/Preview | schema de configuración predeploy |

Preview debe seguir validando estos puntos porque es la autoridad ambiental. El
cambio es añadir una guard equivalente antes, no declarar PASS sin observar
Preview.

## 8. Governed change-risk classification

El clasificador propuesto usa paths versionados, contenido del diff y marcadores
semánticos. Nunca se basa únicamente en el título del commit o en una etiqueta
manual.

| Clase | Ejemplos | Gate mínimo propuesto |
| --- | --- | --- |
| `DOCS_ONLY` | Markdown no ejecutable, evidencia, índices | integrity, links, policy consistency, secret scan, diff/fingerprint |
| `UI_ONLY` | componentes/CSS sin API ni datos | UI contracts, typecheck, web build, routes, browser representativo |
| `APPLICATION_LOGIC` | servicios, commands, handlers | typecheck, build, unit, impacted integration, architecture, smoke |
| `DATABASE_SCHEMA` | schema ORM/SQL | full migration material, isolation y full pipeline |
| `MIGRATION` | migration/up/down/journal assumptions | fresh/existing/down/rollback, manifest y full pipeline |
| `AUTHORIZATION_SECURITY` | capabilities, sesiones, CSRF, Tenant/Branch guards | full dos legs VC-024, negativos y browser cuando aplique |
| `CI_INFRASTRUCTURE` | workflow, collector, evidence schema | dos legs, fixtures bootstrap/mutation y comparison |
| `DEPLOYMENT_INFRASTRUCTURE` | image, routing, env/runtime activation | OCI/config/provenance/direct-route y Preview |
| `CROSS_MODULE_HIGH_RISK` | múltiples bounded contexts o unknown | full fail-closed |

Reglas fail-closed:

- todo path o extensión desconocida escala a `CROSS_MODULE_HIGH_RISK`;
- múltiples clases adoptan el riesgo máximo, no el promedio;
- cambios en tests, scripts de evidencia, workflow, policy ejecutable o
  configuración no pueden clasificarse como docs-only;
- strings sensibles (`migration`, `tenant`, `branch`, `capability`, `session`,
  `csrf`, `cookie`, `rollback`, `workflow`) escalan para revisión semántica;
- CI registra clase, paths, reglas activadas, gates seleccionados y fingerprint;
- una persona puede elevar riesgo, nunca reducirlo sin excepción Owner trazable.

## 9. Local verification recommendation

### Durante Owner iterations

Ejecutar:

1. preflight de desarrollo;
2. contratos/unit tests del delta;
3. suite PostgreSQL afectada si toca persistencia;
4. build o typecheck del paquete afectado;
5. runtime/browser para el flujo Owner observable.

No ejecutar `verify:full` después de cada cambio menor. Un cambio de copy, CSS o
documentación no gana información al levantar todas las migraciones y todos los
bounded contexts.

### En functional freeze

Ejecutar una vez `verify:full` sobre el candidato exacto, capturar su fingerprint
y no modificar bytes ejecutables después. Si aparece un fix:

- rerun focused primero;
- repetir full si el fix es de migración, autorización, CI/evidence, runtime,
  cross-module o si el clasificador no puede demostrar bajo riesgo;
- en deltas menores, invalidar sólo los gates explícitamente afectados según la
  política que el Owner apruebe.

### Development preflight único

Debe comprobar, sin destruir estado:

- branch, base, SHA y dirty state conocidos;
- Node 24.18.0 y pnpm 11.15.1 gobernados;
- frontend y backend compilados desde el mismo SHA;
- procesos/puertos y provenance del runtime;
- nombres/contenidos duplicados de source/migrations;
- journal DB local contra el manifest candidato;
- fixtures de Station/session disponibles;
- capacidad de seed/reset, pero sin ejecutarlo automáticamente.

Si necesita reset destructivo local, debe explicarlo y usar autoridad explícita.
Durante esta auditoría, `local:db:reset` fue autorizado y se limitó al volumen
local gobernado. Las 62 migraciones aplicaron correctamente; el seed reveló una
fricción: el comando no es autocontenido con la configuración Owner diaria y
requiere tres PINs sintéticos adicionales en variables de proceso. Se completó
con valores efímeros no impresos. Es una deuda del entorno local, no un defecto
de producto ni autorización para cambiarlo en este audit.

### Formal UI Verification mínima

Los contratos automatizados deben cubrir estructura, estados, ARIA, routing y
reglas deterministas. El browser real se concentra en lo que esos contratos no
pueden observar:

| Observación | Matriz mínima | Cuándo ampliar |
| --- | --- | --- |
| viewport principal | 1280, light, flujo crítico completo | cambia layout o primitive compartido |
| tablet | 768, dark, jerarquía y acciones | cambia navegación responsive |
| narrow | 640, spot light/dark | cambia densidad, wrap o controles |
| teclado/foco | Tab, Shift+Tab, Enter, Escape en primitive y flujo crítico | cambia modal, popover o focus trap |
| hover/selected/disabled | muestra representativa | cambia design system |
| console/network | cero errores inesperados en cada flujo | siempre |
| routing | entrada directa, reload y back/forward en ruta nueva | cambia router/runtime |

No se repite manualmente cada assert ya probado por contratos. Sí se registra
qué fue observado; toda celda no ejecutada permanece **NOT OBSERVED**, nunca
PASS implícito.

## 10. CI recommendation

### Mantener

- checkout Linux limpio por leg;
- instalación frozen y toolchain fijado;
- dos legs independientes donde VC-024 aplique;
- PostgreSQL material repetido por leg para probar determinismo;
- evidencia semántica y hashes de `dist` por leg;
- comparison exacta.

### Optimizar sin perder señal

- definir una sola lista atómica de stages;
- ejecutar architecture, typecheck, build y broad tests una sola vez por leg;
- hacer que `verify` consuma resultados del orquestador o que el orquestador
  invoque directamente cada stage, sin recursión;
- mantener los dos legs independientes: no compartir resultados de test ni
  `dist` entre ellos;
- subir un solo manifest por leg y comparar exactamente ambos.

En el run 34814070839, los stages explícitos `architecture` (3 s), `typecheck`
(17 s), `build` (13 s), `full tests` (158 s) y `dedicated architecture`
(149 s) sumaron aproximadamente 340 segundos por leg antes de contar sus
equivalentes dentro de `canonical verify`. Esa es la primera duplicación a
eliminar.

## 11. Exact-main recommendation

Crear una atestación de candidato con:

- Git tree SHA;
- commit SHA y base esperada;
- lockfile y toolchain pins;
- hash del workflow/evidence schema;
- migration manifest hash;
- hash agregado de `dist`;
- versión del manifest de tests y evidencia;
- IDs/resultados de run-1, run-2 y comparison.

Después del merge:

1. comprobar criptográficamente que `main^{tree}` es igual al tree atestado;
2. comprobar que el merge usó la base esperada y no tuvo resolución adicional;
3. verificar que workflow, lockfile, migrations y evidence schema coinciden;
4. registrar el nuevo commit SHA de main;
5. ejecutar integrity/attestation reducido.

Full exact-main sigue siendo obligatorio si:

- cambia el tree;
- hubo resolución de conflictos;
- cambió workflow, evidence, toolchain o migration manifest;
- el cambio es un hotfix de migración/autorización;
- una política transversal lo exige;
- cualquier comparación es desconocida.

La igualdad de trees observada en diez de diez merges demuestra oportunidad,
no suficiencia. El contrato actual liga evidencia al SHA y debe mantenerse hasta
aprobar, implementar y probar esta atestación.

## 12. Preview recommendation

Preview debe conservar:

- health/readiness reales;
- release SHA servido;
- configuración Dokploy efectiva;
- routing y TLS;
- journal y orden real de migraciones;
- activación migrate-before-runtime;
- Station/session/capabilities reales;
- smoke crítico del producto autenticado.

CI no puede sustituir estas observaciones. Para mover fallos a la izquierda:

- validar un schema predeploy de keys y formatos, incluido `SR_BUILD_GIT_SHA`,
  sin exponer valores secretos;
- construir el contenedor de producción y probar rutas directas/reload;
- generar rutas desde un registro autoritativo único en vez de allowlists
  manuales divergentes;
- comparar migrations contra un snapshot gobernado de Preview antes del PR;
- verificar que migrate finaliza antes de activar el nuevo runtime.

## 13. Migration preflight

Proponer un artefacto versionado o de evidencia llamado conceptualmente
`PREVIEW_MIGRATION_STATE.json`, sin credenciales ni datos de negocio, que tenga:

- environment y timestamp de captura;
- migration filename/id aplicado;
- hash de contenido;
- orden/journal head;
- schema/manifest version;
- release SHA que lo produjo.

La guard candidate-vs-snapshot debe fallar si encuentra:

- dos filenames/IDs iguales;
- contenidos duplicados bajo filenames diferentes;
- copias/sufijos accidentales;
- hash distinto para una migración ya aplicada;
- migration pendiente con timestamp anterior al último aplicado;
- `down` que presupone ser la última migration y omite migraciones posteriores;
- cadena fresh/existing/down/redo no determinista.

El snapshot permite desarrollo sin acceso en vivo a Preview. Antes de deploy se
repite contra el journal real, read-only, porque el snapshot puede estar stale.

Para un hotfix de migración deben repetirse migration material, rollback del
contexto afectado, aislamiento, base verify y compiled runtime. No es necesario
repetir manualmente toda la matriz visual si no cambió UI.

## 14. Documentation and review optimization

Orden preferido:

1. escribir docs funcionales antes del freeze;
2. congelar el último candidato ejecutable;
3. correr local full y PR CI;
4. generar evidencia automática ligada al fingerprint;
5. independent review del candidato final;
6. permitir sólo reconciliación documental no ejecutable mediante gate
   docs-only especializado.

Un gate docs-only debe comprobar estructura, links, referencias de SHA/run,
policy consistency, secretos y que el diff sea realmente no ejecutable. Nunca
puede aceptar una afirmación de PASS para un SHA distinto: las docs deben citar
la atestación inmutable del candidato y separar “candidato verificado” de
“commit que documenta esa evidencia”.

La independent review se invalida por cambios en producto, tests, migraciones,
workflow, contratos de seguridad, evidencia ejecutable o cualquier delta que
pueda alterar la conclusión. No se invalida por un manifest generado o una
corrección editorial que el clasificador demuestre no ejecutable.

## 15. Caching and artifact reuse

| Recurso | Reuso seguro | Condición |
| --- | --- | --- |
| pnpm store | sí | key por lockfile + toolchain + plataforma |
| Docker layers/base image | sí | digest pin y provenance |
| PostgreSQL image pull | sí | mismo digest; DB de test nueva por leg |
| immutable checkout | sí | tree/commit verificado |
| evidence schema/tool binaries | sí | hash/version incluido |
| resultados de tests | no entre legs | destruiría independencia VC-024 |
| compiled `dist` | no compartir run-1→run-2 | ambos deben producir y hashear |
| PR attestation en exact-main | sí, futuro | sólo tras tree/fingerprint exactos |

El cache reduce descarga/compilación preparatoria; no debe convertir run-2 en
una lectura de resultados generados por run-1.

## 16. Automation and Owner authority

| Categoría | Ejemplos | Conducta Codex |
| --- | --- | --- |
| Owner Decision | nueva semántica, scope, risk waiver, Production, datos reales destructivos | detenerse y pedir decisión |
| Sensitive operation already authorized | reset sintético local, commit, push/PR/merge/Preview expresamente incluidos | continuar dentro del envelope |
| External blocker | credencial ausente, billing/service caído, acceso revocado | agotar checks seguros y escalar |
| Technical failure | test, puerto, stale runtime, fixture, build, migration local | remediar autónomamente dentro de alcance |

Cada Master Goal debería declarar un **authorization envelope** explícito:
branch, cambios permitidos, resets sintéticos locales, commit, push, PR, merge,
Preview, Production y scopes de datos. Esto reduce preguntas sin transferir
autoridad implícitamente.

## 17. Option A — Conservative optimized

Mantiene el modelo actual y cambia principalmente ejecución:

- focused gates durante Owner iterations;
- un local full en functional freeze;
- CI PR de dos legs y comparison exacta;
- eliminación de duplicación dentro de cada leg;
- preflights de environment, production image, routes y migrations;
- independent review una vez sobre el candidato final;
- exact-main full mientras no exista atestación aprobada;
- gate docs-only para deltas demostrablemente documentales.

| Dimensión | Evaluación |
| --- | --- |
| seguridad | alta, casi idéntica a hoy |
| velocidad | mejora media |
| complejidad | baja-media |
| falso verde | bajo |
| mantenimiento | menor que hoy al unificar stages |
| facilidad para Codex | alta; reglas simples |
| evidencia | conserva formato actual con menos repetición |

Estimación: 30–45 % menos cómputo CI en campañas típicas, más ahorro local al no
usar full como loop de edición. Exact-main seguiría costando alrededor de 10–12
minutos de pared.

## 18. Option B — Risk-based pipeline

Añade a Option A:

- clasificador fail-closed versionado;
- pipelines docs, UI, application, database/migration, auth/security,
  CI/deploy infrastructure y high-risk;
- invalidación selectiva explícita de gates/review;
- exact-main reducido mediante verified-tree attestation;
- full dos legs para high-risk/unknown y toda excepción definida por política.

| Dimensión | Evaluación |
| --- | --- |
| seguridad | alta si falla cerrado y tiene pruebas negativas |
| velocidad | mejora alta |
| complejidad | alta |
| falso verde | mayor riesgo por clasificación incompleta |
| mantenimiento | requiere ownership continuo de reglas |
| facilidad para Codex | alta después de estabilizar; peligrosa antes |
| evidencia | más precisa, pero schema nuevo |

No debe activarse directamente. Primero debe correr en **shadow mode** durante
2–3 PBIs: clasifica y registra qué habría omitido, mientras el pipeline full
sigue ejecutándose. Cualquier finding que el pipeline propuesto hubiera perdido
obliga a corregir reglas antes de pedir activación.

## 19. Recommendation

Adoptar por decisión Owner una secuencia de dos fases:

### Fase 1

- Option A;
- remover duplicación intra-leg;
- preflight único de desarrollo;
- preflight de migration snapshot, env y routes;
- instrumentación permanente;
- docs antes del freeze y gate docs-only diseñado formalmente.

### Fase 2

- implementar el clasificador en shadow mode;
- observar 2–3 PBIs de perfiles distintos;
- validar que ninguna señal real se habría perdido;
- diseñar la atestación de candidate/tree como decisión arquitectónica;
- volver al Owner para decidir activación de Option B.

El flujo objetivo sería:

```text
Owner iterations: focused verification
  -> Owner Acceptance / functional freeze
  -> one authoritative local full
  -> PR: Linux run-1 + run-2 + exact comparison
  -> independent review
  -> merge
  -> post-merge tree/integrity attestation
     -> full sólo si cambió fingerprint o política lo exige
  -> Preview migration preflight
  -> Preview deploy
  -> Preview-specific validation
  -> Done / cleanup
```

## 20. Expected time savings and metrics

### Ahorro estimado

- **Duplicación intra-leg:** aproximadamente 5.7 min por leg, 11.3 job-minutes
  por workflow; el wall típico podría bajar de 10–12 a 5–7 min según paralelismo.
- **Docs-only PR + exact-main:** hoy consume aproximadamente 25 min de pared y
  48 job-minutes; un par de gates especializados puede aspirar a menos de 10
  min totales, ahorrando 15–18 min de pared y cerca de 40 job-minutes.
- **PBI-040 contrafactual:** frente a 105.2 min de pared/196.6 job-minutes en
  nueve workflows, conservar tres campañas ejecutables (feature, migration,
  routing), usar checks reducidos para identity y docs produciría una estimación
  de 45–60 min de pared, ahorrando 45–60 min y 90–120 job-minutes. Es un modelo,
  no una medición retrospectiva exacta.
- **Loop local PBI-040:** sustituir la mayoría de sus 39 fulls por focused gates
  pudo ahorrar aproximadamente 80–100 de 131.4 minutos de máquina. Los fulls de
  migration/security/freeze se conservan.

### Métricas permanentes

- Owner Acceptance → functional freeze;
- freeze → PR;
- PR → CI green;
- CI green → merge;
- merge → Preview green;
- total closure time;
- número de full locales y workflows CI;
- tiempo por stage y job-minutes duplicados;
- findings por primer gate detector;
- fallos encontrados únicamente en Preview;
- invalidaciones de review;
- interrupciones Owner clasificadas por autoridad;
- aciertos/falsos negativos del clasificador shadow.

Objetivos iniciales a evaluar, sin convertirlos en waiver de seguridad:

- PBI normal sin remediation real: menos de 45 min desde Acceptance a Preview
  green;
- docs-only: menos de 10 min;
- defecto real: tiempo adicional separado y proporcional a su remediation.

## 21. Residual risks and PBI-040 lessons

### Qué retrasó específicamente PBI-040

| Factor observado | Clasificación | Tratamiento futuro |
| --- | --- | --- |
| stale runtime durante QA local | systemic preflight gap | provenance/port/process preflight |
| Formal UI Verification y sus remediations | señal única | conservar matriz mínima, evitar repetición contractual |
| evidence contract mismatch | one-time hardening | self-tests del collector |
| campañas full repetidas | systemic workflow cost | focused loop + un full en freeze |
| campañas PR/exact-main repetidas | systemic workflow cost | dedupe y futura atestación |
| configuración Dokploy de build SHA | systemic configuration gap | schema predeploy |
| valor de Preview ausente/mal formado | systemic configuration gap | validación sin secretos |
| archivos/copies inesperados | systemic integrity gap | duplicate-source/migration guard |
| migration drift real | systemic migration-preflight gap | snapshot + journal real |
| rollback asumía ser último | systemic migration-test risk | revertir posteriores explícitamente |
| hotfix PR de migración | remediation real | conservar full material de alto riesgo |
| exact-main reruns | systemic hasta atestación | identity gate futuro |

No existe telemetría histórica uniforme para atribuir una cantidad exacta de
incidentes a stale process, puerto o Node PATH. La tabla distingue únicamente
casos demostrados por evidencia; la recomendación incluye instrumentarlos en
adelante en vez de convertir una estimación en hecho.

### One-time hardening ya capitalizado

| Hallazgo PBI-040 | Tipo |
| --- | --- |
| evidence collector no aceptaba runtime provenance | hardening de contrato CI |
| allowlist SPA omitía rutas aceptadas | hardening de producción/routing |
| integration fixtures no conocían Catalog | hardening al introducir bounded context |
| reglas/contadores esperaban arquitectura anterior | hardening de transición |

Estos defectos concretos están corregidos y no deben usarse para justificar
permanentemente campañas adicionales ad hoc.

### Costos sistémicos que permanecen

| Problema | Tipo |
| --- | --- |
| full durante casi cada Owner iteration | systemic workflow cost |
| stages duplicados dentro de cada leg | systemic workflow cost |
| full CI por docs/evidence | systemic workflow cost |
| exact-main full pese a tree idéntico | systemic hasta tener atestación |
| migration state de Preview descubierto tarde | systemic preflight gap |
| rollback supone orden histórico fijo | systemic migration-test risk |
| stale runtime/branch/SHA/ports en Owner QA | systemic local-preflight gap |
| build SHA/env mal formada detectada en deploy | systemic configuration gap |

Riesgos residuales de la propuesta:

- un clasificador incompleto puede omitir un gate material;
- un snapshot de Preview puede quedar stale;
- igualdad de Git tree no cubre por sí sola toolchain, workflow, secretos ni
  infraestructura;
- optimizar browser matrices puede perder un breakpoint no representado;
- caches mal keyeados pueden ocultar contaminación;
- docs-only mal definido puede incluir políticas o assets ejecutables;
- reducir exact-main antes de tener atestación formal rompería trazabilidad.

Mitigaciones: fail-closed, shadow mode, snapshots con freshness, fingerprints
compuestos, pruebas negativas del clasificador y escape hatch full explícito.

## 22. Owner decisions

El Product Owner aprobó WF-001 a WF-010 el 2026-09-14. Su contrato exacto y
límites de materialización se promovieron a
[Development Workflow Efficiency Decisions](DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md).

La aprobación autoriza Fase 1, DOCS_ONLY fail-closed, Development Preflight,
migration-state snapshot, métricas y los mecanismos generales de clasificación
y tree attestation únicamente en shadow mode. Ninguno de esos dos mecanismos
reduce exact-main durante el piloto; sólo DOCS_ONLY usa el gate especializado
autorizado por separado. Migration hotfix conserva full exact-main.
