# Plan secuencial de implementación de PBI-023

## Regla de ejecución

Cada paso es un checkpoint revisable. Un paso rojo detiene los siguientes. Los
paths son previstos; el diff real debe limitarse al consumidor de ese paso.

## Paso 1 — Ratificar DEC-050

- **Objetivo:** conservar estrategia y condiciones antes de materializar.
- **Archivos:** documentos DEC-050 y expediente PBI-023.
- **Dependencias:** ADR-003, DEC-004/049/051/063.
- **Riesgos:** confundir aceptación con materialización.
- **Pruebas:** enlaces, estados, contradicciones y revisión.
- **Evidencia:** propuesta y formal review.
- **Rollback:** revertir sólo el cambio documental mediante Git.
- **Gate:** autoridad del Responsable del Proyecto.
- **Salida:** `Completed — Accepted with conditions`; C01–C10 pending.

## Paso 2 — Ejecutar y cerrar SPIKE-002

- **Objetivo:** validar el patrón tenant-aware antes de schema productivo.
- **Archivos:** prototipo desechable fuera de `src/`; resultados del spike.
- **Dependencias:** autorización explícita, versiones candidatas, PG `18.4`.
- **Riesgos:** convertir probe en producto o cerrar sin negativos.
- **Pruebas:** CRUD, joins, branch/FK, contexto ausente/manipulado,
  concurrencia, job y query global separada.
- **Evidencia:** manifest, comandos, resultados, hashes y cleanup.
- **Rollback:** eliminar base, credenciales, paquetes/probes desechables.
- **Gate:** Arquitectura + Seguridad + Calidad.
- **Salida:** `Completed — PASS`; hipótesis confirmada en
  [evidencia material](spike-002-evidence/RESULTS.md).

## Paso 3 — Extender boundaries y checker

- **Estado:** `Completed — PASS` en
  [checker-extension/](checker-extension/README.md).

- **Objetivo:** autorizar exactamente la facility database y adapters owners.
- **Archivos:** `architecture/dec-005-policy.json`, checker sólo si es
  necesario, fixtures/mutaciones/tests arquitectónicos.
- **Dependencias:** SPIKE-002 favorable y paths aprobados.
- **Riesgos:** allowlist demasiado amplia o falso PASS.
- **Pruebas:** caso válido, package en capa inválida, repo genérico, deep
  import, tabla ajena, raw SQL y facility no autorizada; doble run.
- **Evidencia:** policy version, IDs D5, diagnósticos y mutaciones.
- **Rollback:** revertir policy/checker/tests; todavía sin runtime.
- **Gate:** DEC051-C06/C09 y DEC063-C02.
- **Salida:** checker falla cerrado antes de crear `src/`; D5-R037–D5-R047,
  36 fixtures y 11 mutaciones.

## Paso 4 — Instalar dependencias exactas

- **Estado:** `Completed — PASS` en
  [dependency-installation/](dependency-installation/README.md).
- **Objetivo:** materializar Kysely/pg sin otra librería.
- **Archivos:** `package.json`, `pnpm-lock.yaml`.
- **Dependencias:** DEC050-C01, Node `24.18.0`, pnpm `11.15.1`.
- **Riesgos:** transitivas, licencia, incompatibilidad TS/ESM.
- **Pruebas:** frozen install limpio, audit/metadata, typecheck/build/test.
- **Evidencia:** metadata oficial, cierre transitivo, supply-chain review, dos
  frozen installs, hashes y tres ciclos de gates.
- **Rollback:** revertir manifest/lock y eliminar install local.
- **Gate:** Ingeniería + Arquitectura.
- **Salida:** `kysely@0.29.4`, `pg@8.22.0` y `@types/pg@8.20.0` exactos;
  baseline compila sin código persistence.

## Paso 5 — Configuración tipada

- **Estado:** `Completed — PASS` en
  [typed-configuration/](typed-configuration/README.md).
- **Objetivo:** validar variables y redaction sin abrir conexión.
- **Archivos:** `database-config.ts`, unit tests y policy exacta.
- **Dependencias:** pasos 3–4.
- **Riesgos:** defaults inseguros o secretos en error.
- **Pruebas:** faltantes, tipos/rangos, SSL por ambiente, password vacío,
  redaction y no fallback test→shared.
- **Evidencia:** matriz de config y resultados.
- **Rollback:** revertir archivos; no existe DB.
- **Gate:** DEC044, DEC050-C06 y DEC063-C06.
- **Salida:** config inmutable fail-fast y sanitizada.

## Paso 6 — Facility de conexión

- **Estado:** `Completed — PASS` en
  [connection-facility/](connection-facility/README.md).
- **Objetivo:** lifecycle de pool, verificación técnica y cierre controlado.
- **Archivos:** connection, tests, harness PostgreSQL y enforcement exacto.
- **Dependencias:** config validada y PG `18.4` test.
- **Riesgos:** leak, pool por query, cierre incompleto y errores sensibles.
- **Pruebas:** lazy create, verify/close, release, concurrencia, timeout,
  auth/database/SSL y sanitización.
- **Evidencia:** counts/lifecycle sanitizados y dos runs PG 18.4.
- **Rollback:** cerrar pool, eliminar container efímero y revertir facility.
- **Gate:** DEC049-C06/C07; DEC051-C03 permanece pendiente en CI.
- **Salida:** cero conexiones pendientes y API sin driver.

## Paso 7 — Transaction runner

- **Estado:** `Completed — PASS` en
  [transaction-runner/](transaction-runner/README.md).
- **Objetivo:** ejecutar toda unidad sobre una misma conexión.
- **Archivos:** transaction runner, capability owner-internal, coordinación
  mínima de connection, tests/harness y D5-R048.
- **Dependencias:** Paso 6 verificado.
- **Riesgos:** retry parcial, pool query dentro de transacción, release/rollback.
- **Pruebas:** commit, rollback, isolation, read-only, nesting, errores,
  concurrencia, cierre y fallos.
- **Gate:** DEC049-C04/C06.
- **Evidencia:** dos runs PostgreSQL 18.4, comparación material y cleanup.
- **Salida:** runner verificado; todavía sin migraciones/tablas productivas.

## Paso 8 — Runner de migraciones

- **Estado:** `Completed — PASS` en
  [migration-runner/](migration-runner/README.md).
- **Objetivo:** status/latest/down/verify explícitos.
- **Archivos:** migration runner, capability/provider internos, tests/harness
  y D5-R049. CLI y scripts package permanecen diferidos.
- **Dependencias:** DEC-050, connection runtime y transaction runner cuando el
  migrador requiera unidad transaccional.
- **Riesgos:** mutación por import/start, lock largo, resultado ignorado.
- **Pruebas:** status, up/latest/down, startup sin migración, manifest/drift,
  dos runners, timeout, journal, rollback, ESM/dist y cleanup.
- **Evidencia:** dos runs PostgreSQL `18.4`, comparación material, manifest,
  lock y salida sanitizada.
- **Rollback:** eliminar runner/scripts; base aún sin schema productivo.
- **Gate:** DEC050-C03/C08.
- **Salida:** API administrativa explícita verificada; ruta productiva
  inexistente y composición CLI diferida hasta un contrato operacional seguro.

## Paso 9 — Primera migración mínima

- **Objetivo:** crear tenants/branches y metadata core en base efímera.
- **Archivos:** un archivo de migración real, registry materializado, schema
  types.
- **Dependencias:** SPIKE cerrado; C02/C09; owners aprobados.
- **Riesgos:** schema de negocio prematuro, constraint débil, naming drift.
- **Pruebas:** vacío/anterior/re-run, PK/FK/not-null, branch cross-tenant.
- **Evidencia:** status, hash, owner/scope e inspección de schema.
- **Rollback:** descartar base; `down` sólo si seguro y probado.
- **Gate:** DEC049-C02/C03, DEC050-C02/C09, DEC063-C05/C06.
- **Salida:** schema mínimo reproducible, sin datos reales.

## Paso 10 — Tests de migración

- **Objetivo:** probar lifecycle completo y fallos.
- **Archivos:** migration tests/support/fixtures.
- **Dependencias:** primera migración.
- **Riesgos:** prueba feliz únicamente o cleanup destructivo.
- **Pruebas:** vacío, anterior, re-run, out-of-order, drift, fallo,
  concurrencia, down, cleanup.
- **Evidencia:** resultados y hashes por caso.
- **Rollback:** eliminar sólo bases marcadas del run.
- **Gate:** DEC050-C04/C05/C07.
- **Salida:** suite determinista en PG `18.4`.

## Paso 11 — PostgreSQL real en Linux CI

- **Objetivo:** lifecycle aislado/reproducible autoritativo.
- **Archivos:** workflow autorizado, scripts de test y manifest.
- **Dependencias:** DEC051-C02/C03 y review de Operaciones.
- **Riesgos:** imagen mutable, secreto, dependencia del runner, cleanup.
- **Pruebas:** versión exacta, health, timeout, base por run, failure cleanup,
  dos runs.
- **Evidencia:** run/job IDs, platform, versión, manifest/hashes.
- **Rollback:** revertir workflow; service desaparece con job.
- **Gate:** Operaciones + Calidad; branch protection.
- **Salida:** C03 verificable y job requerido.

## Paso 12 — Adapters owner-scoped

- **Objetivo:** materializar sólo métodos con consumidor/prueba real.
- **Archivos:** ports/adapters tenancy y stations, exports mínimos si aplican.
- **Dependencias:** schema, checker y transaction runner.
- **Riesgos:** CRUD genérico, import intermodular, branch sin tenant.
- **Pruebas:** signatures scope required, own-table only, error translation.
- **Evidencia:** graph/checker y tests reales.
- **Rollback:** revertir adapters/ports; schema puede quedar sin consumidor y
  debe evaluarse antes del merge.
- **Gate:** DEC049-C02/C05/C06/C07 y DEC051-C06.
- **Salida:** no query global ni dependencia de dominio a Kysely.

## Paso 13 — Aislamiento tenant negativo

- **Objetivo:** ejecutar ISO-001 a ISO-020.
- **Archivos:** isolation tests y fixtures.
- **Dependencias:** adapters, PG real y probes cerrados.
- **Riesgos:** enumeración, contaminación concurrente, falso positivo.
- **Pruebas:** matriz completa positiva/negativa/mutaciones.
- **Evidencia:** resultados por ID sin SQL/datos sensibles.
- **Rollback:** eliminar fixtures/base efímera.
- **Gate:** SPIKE-002, DEC049-C03, DEC051-C04, DEC063-C06.
- **Salida:** cero acceso/referencia cross-tenant; cualquier fallo bloquea.

## Paso 14 — Smoke compilado y gate canónico

- **Objetivo:** comprobar que el artefacto inicia sin migrar y todos los gates
  siguen verdes.
- **Archivos:** sólo los necesarios para scripts/gates ya aprobados.
- **Dependencias:** pasos técnicos completos.
- **Riesgos:** import side effect o test que depende de estado residual.
- **Pruebas:** architecture, typecheck, build, test, test:architecture,
  verify, smoke:start y test:persistence dos veces.
- **Evidencia:** manifest de comandos/resultados y árbol limpio.
- **Rollback:** revertir último slice; limpiar dist/base.
- **Gate:** DEC051/063.
- **Salida:** salida cero repetible, app sin DDL/startup.

## Paso 15 — Evidencia, review y merge

- **Objetivo:** obtener dictamen formal sin ampliar alcance.
- **Archivos:** expediente de implementación, manifest, resultados y
  trazabilidad.
- **Dependencias:** todos los pasos verdes y branch protection.
- **Riesgos:** declarar condiciones satisfechas sin evidencia o mezclar PBI-024.
- **Pruebas:** enlaces, secretos, paths, whitespace, doble run y diff scope.
- **Evidencia:** [EXPECTED_EVIDENCE.md](EXPECTED_EVIDENCE.md) completa.
- **Rollback:** no merge; corregir en rama. Después de merge, follow-forward
  según migration strategy.
- **Gate:** Arquitectura + Ingeniería + Seguridad + Operaciones + Calidad.
- **Salida:** sólo entonces PBI-023 puede pasar a review/Done según DEC-063;
  merge no autoriza PBI-024.

## Orden definitivo

El orden recomendado pone el checker antes de `src/` y separa schema/adapters.
Los pasos 1–7 están completos. El siguiente paso autorizable es **Paso 8**,
sujeto a autorización explícita; los pasos 8–15 no quedan autorizados por este
cierre.
