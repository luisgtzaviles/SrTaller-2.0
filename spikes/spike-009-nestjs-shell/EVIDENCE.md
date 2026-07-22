# Evidencia de SPIKE-009

## Identificación, límites y dictamen previo

- **Fecha:** 2026-07-22.
- **Rama:** `spike/spike-009-nestjs-shell`.
- **HEAD/base:** `48dc6fbdc04725c90c04f593f78f376476cc3f45`.
- **Base remota:** `origin/main` en el mismo SHA; divergencia `0 0`.
- **Datos:** fixtures sintéticos de dos tenants; sin datos o servicios reales.
- **Entorno:** local; sin commit, push, PR ni deploy.
- **Dictamen anterior:** `APPROVED FOR ADR REVIEW WITH REQUIRED REMEDIATIONS` (Opción B).
- **Estado tras esta iteración:** `REMEDIATIONS PASS — ready for focused re-review`.

El estado no acepta ADR-005 ni cierra DEC-004. El directorio sigue siendo un experimento desechable, no el scaffold de R0.

## Baseline y supply chain

La instalación final se hizo desde `node_modules` ausente mediante Node.js `24.18.0`, npm `11.16.0` y `npm ci`. Se instalaron 134 paquetes y npm auditó 135 sin vulnerabilidades. El SHA-256 de `package-lock.json` fue idéntico antes y después:

```text
7ef6d7f24d29eb7b902c7b43f250cedf0d47fa91f88d9b96732303144311e898
```

`npm audit signatures` verificó firmas de registry para 134 paquetes y attestations para 4. npm informó que los scripts de instalación de `esbuild@0.25.12` y `fsevents@2.3.3` no están cubiertos por una política `allowScripts`; no se cambió el lockfile ni se seleccionó una política definitiva de scripts en esta iteración.

Un primer intento de instalación limpia usó accidentalmente el Node.js global `25.9.0`/npm `11.12.1` y produjo `EBADENGINE`. La instalación se eliminó y repitió con el PATH explícito de Node.js `24.18.0`/npm `11.16.0`; el lockfile permaneció intacto.

## Archivos de la remediación

La remediación añadió:

- `scripts/architecture-rules.mjs` y su declaración TypeScript;
- `scripts/with-postgres.sh` y `scripts/ci.sh`;
- observabilidad/correlación en `src/synthetic/infrastructure/observability/`;
- `test/e2e/correlation-and-observability.test.ts`;
- `test/postgres/postgres-timeouts.test.ts`;
- `test/operations/runtime-and-cleanup.test.ts`;
- `test/unit/correlation-and-operational-logger.test.ts`.

También actualizó `package.json`, `scripts/postgres.sh`, `scripts/static-check.mjs`, bootstrap/lifecycle/tokens/composition root, puertos/contexto/caso de uso, job, adapters PostgreSQL/seguridad, transporte HTTP, soporte de pruebas y las suites existentes. Sólo se modificó el spike y el estado mínimo de documentación canónica.

## 1. Independencia de auditoría

### Causa raíz

La prueba anterior consultaba eventos que podían haber sido creados por otras pruebas y por tanto dependía de estado compartido/orden de ejecución.

### Corrección

- `beforeEach` reconstruye schema y fixtures para cada caso de integración;
- la prueba crea explícitamente sus operaciones exitosa y fallida;
- usa correlation IDs únicos del propio caso;
- filtra y verifica exclusivamente esos eventos;
- el runner PostgreSQL temporal elimina toda la instancia al terminar.

La suite completa pasó 6/6. La prueba `records authoritative audit from fixtures created by this test only` pasó aislada tres veces consecutivas: 1/1 en `1.59 s`, `1.43 s` y `1.65 s` de tiempo real. El runner usado no ofrece orden aleatorio nativo para este archivo; el reset por caso y las ejecuciones aisladas/posteriores eliminan la dependencia observable del orden.

## 2. Job pendiente durante shutdown

La prueba E2E adquiere un row lock PostgreSQL como barrera explícita, inicia un job y comprueba `pendingCount === 1`. Luego inicia `app.close()`, espera el evento de drenaje, verifica que un nuevo job sea rechazado, libera la barrera y comprueba:

- el job aceptado termina;
- `pendingCount` llega a cero;
- listener y pool quedan cerrados;
- se emiten eventos de lifecycle;
- el listener deja de responder;
- el wrapper limpia PostgreSQL incluso ante fallo.

No usa sleeps para controlar el job y tiene timeout finito. Pasó aislada 2/2 (`2.35 s`, `2.25 s`) además de las suites E2E y ambos gates completos.

## 3. Observabilidad sanitizada

`OperationalLogger` escribe una línea JSON con `timestamp`, `level`, `event` y sólo campos allowlisted. Se probaron:

- `process.start` y `application.ready`;
- `readiness.reached`;
- `dependency.postgres.unavailable`;
- inicio/fin de shutdown y drenaje;
- cierre de listener y pool;
- `lifecycle.shutdown.completed`;
- errores inesperados de bootstrap/lifecycle.

Las capturas automatizadas rechazan credenciales, tokens, password, PIN, SQL, payloads y connection strings. El startup/shutdown real pasó aislado 2/2 (`2.34 s`, `2.24 s`). La abstracción no selecciona proveedor ni plataforma definitiva.

## 4. Correlation ID autoritativo

Cada petición genera un UUID `serverCorrelationId`. `x-correlation-id` de entrada se trata sólo como `clientCorrelationIdCandidate`: se recorta, acepta únicamente `[A-Za-z0-9._:-]`, exige 3–80 caracteres y descarta controles o valores largos. Nunca reemplaza la autoridad del servidor.

Respuesta, contexto, telemetría y `synthetic_audit_events.correlation_id` usan el ID del servidor. El candidato válido sólo puede aparecer como referencia secundaria en logs técnicos. Se cubrieron ausencia, válido, inválido, demasiado largo, caracteres de control, candidatos iguales concurrentes e independencia de auditoría. La correlación concurrente pasó aislada 2/2 (`2.40 s`, `2.27 s`) y cada respuesta tuvo un server ID distinto.

## 5. Timeouts y dependencia PostgreSQL

Valores experimentales configurables:

| Límite | Variable | Default |
|---|---|---:|
| conexión/espera soportada por `pg` | `SPIKE_PG_CONNECTION_TIMEOUT_MS` | `750 ms` |
| statement | `SPIKE_PG_STATEMENT_TIMEOUT_MS` | `750 ms` |
| lock | `SPIKE_PG_LOCK_TIMEOUT_MS` | `300 ms` |
| cliente idle del pool | `SPIKE_PG_IDLE_TIMEOUT_MS` | `1000 ms` |
| transacción idle | `SPIKE_PG_IDLE_TRANSACTION_TIMEOUT_MS` | `1500 ms` |

El pool es de máximo 8 conexiones. Las pruebas verifican configuración, conexión rechazada con liveness 200/readiness 503 y log sanitizado, servidor TCP que acepta pero no completa handshake, `pg_sleep` con rollback/pool reutilizable y dos conexiones con row lock controlado, timeout, rollback y ausencia de lock residual.

La primera prueba del servidor silencioso falló porque el driver devolvió un mensaje de timeout no cubierto por la clasificación inicial. La clasificación pasó de una frase específica a `/timeout/i`; después la suite pasó 5/5 en la ejecución exacta, en ambos gates y en dos repeticiones focalizadas (`3.12 s`, `2.52 s`).

## 6. Cleanup, colisiones y lifecycle

`scripts/postgres.sh` descubre PostgreSQL 18 en macOS, Linux, `pg_config` o `POSTGRES_BIN`; usa `mktemp`, socket por ejecución y puerto dinámico. El marcador `.spike009-owned` limita el cleanup a recursos propios. El wrapper instala traps para `EXIT`, `INT`, `TERM` y `HUP`, propaga señales al hijo y conserva su exit code.

Las pruebas cubren:

- éxito y fallo simulado con código 23;
- `db:stop` sin ejecución seleccionada;
- dos instancias concurrentes con run dir, socket y puerto distintos;
- `SIGTERM` con código 143;
- directorios, puertos, sockets y listeners eliminados;
- shutdown real del artefacto y bootstrap fallido.

La suite operativa pasó 4/4. Las suites PostgreSQL exactas se ejecutaron además en paralelo entre sí sin colisión.

## 7. Linux y CI

La portabilidad local cubre Homebrew, `/usr/lib/postgresql/18/bin`, `/usr/local/pgsql/bin`, `pg_config` y override `POSTGRES_BIN`. No hay rutas personales absolutas. `scripts/ci.sh` ejecuta:

```text
npm ci
npm run verify
npm audit --audit-level=low
npm audit signatures
```

Cada suite levanta/detiene PostgreSQL de forma autónoma. El script exige Node.js `24.18.x`/npm `11.16.x`; una prueba con el Node global incorrecto terminó inmediatamente con exit 1. El runner también valida PostgreSQL 18.x. El script no despliega, publica, crea releases ni consume secretos. `npm run ci` pasó localmente de extremo a extremo con la baseline correcta. No se añadió workflow raíz porque el spike no está comprometido y no debe presentarse como baseline oficial. La ejecución efectiva en runner Linux remoto permanece pendiente; se validó localmente la ruta automatizable.

## 8. Gate de arquitectura

`test:architecture` forma parte de `test:all`, `verify` y `ci`. Las siete pruebas comprueban:

- cero NestJS en dominio/aplicación;
- cero infraestructura/transporte desde dominio;
- DTOs dentro de transporte;
- cero `ModuleRef`, request scope no autorizado, SQL o adapter directo en controllers;
- cero ciclos relativos detectables;
- sólo el módulo sintético previsto;
- rechazo de mutaciones controladas.

El controller dejó de importar la autoridad fixture concreta y depende del puerto de aplicación. Health depende de un puerto de readiness y de una interfaz mínima de logging.

El checker es textual: no cubre de manera exhaustiva aliases complejos, reexports, imports dinámicos o toda la semántica TypeScript. Sus mutation checks prueban las reglas presentes, pero no sustituye análisis AST/grafo de producto.

## 9. Auditoría autoritativa pendiente

El comportamiento actual es explícito y está probado: el write de negocio hace commit y después se solicita la auditoría de éxito. Si ese adapter falla, el efecto de negocio permanece confirmado, la promesa rechaza y el flujo actual intenta registrar además el fallo, por lo que la prueba observa dos intentos fallidos. Existe riesgo de efecto confirmado sin evento autoritativo y de retry ambiguo.

Este punto es una **condición previa a implementar R0**, no una falla de NestJS. Debe decidirse posteriormente entre, al menos:

1. auditoría en la misma transacción;
2. outbox transaccional;
3. efecto confirmado + auditoría posterior con reconciliación;
4. fallo cerrado antes del commit;
5. fallo abierto explícito sólo si el dominio lo permite.

La remediación no selecciona ninguna política.

## Resultados completos

El total anterior era 31/31. Se agregaron 17 pruebas: 3 unitarias, 1 de arquitectura, 1 de integración, 3 E2E, 5 PostgreSQL y 4 operativas. Total final: **48/48**.

| Comando exacto | Exit | Resultado / duración real |
|---|---:|---|
| `npm ci` | 0 | 134 paquetes; 135 auditados; `2 s` según npm |
| `npm run typecheck` | 0 | sin errores; `1.56 s` |
| `npm run lint` | 0 | checks estáticos; `0.47 s` |
| `npm test` | 0 | 9/9; `0.71 s` |
| `npm run test:architecture` | 0 | 7/7; `0.72 s` |
| `npm run test:integration` | 0 | 6/6; `2.88 s` |
| `npm run test:e2e` | 0 | 13/13; `3.45 s` |
| `npm run test:job` | 0 | 4/4; `2.84 s` |
| `npm run test:postgres` | 0 | 5/5; `2.80 s` |
| `npm run test:operations` | 0 | 4/4; `5.53 s` |
| `npm run build` | 0 | compilación correcta; `0.57 s` |
| `npm audit --audit-level=low` | 0 | 0 vulnerabilidades; `0.89 s` |
| `npm audit signatures` | 0 | 134 firmas y 4 attestations; `2.32 s` |
| `npm run verify` — repetición 1 | 0 | 48/48 + build; `15.33 s` |
| `npm run verify` — repetición 2 | 0 | 48/48 + build; `18.34 s` |
| `npm run ci` — repetición final | 0 | instalación limpia + 48/48 + build + audits; `20.97 s` |
| `npm run verify` — estado final | 0 | 48/48 + build; `16.95 s` |

La matriz final quedó verde sin flakiness activa. Todas las instancias creadas por los wrappers fueron verificadas como eliminadas por las propias pruebas; la inspección final externa no encontró procesos o directorios temporales del spike.

## Fallos históricos observados

Además de los dos hallazgos de remediación ya descritos (dependencia de orden de auditoría y clasificación del timeout silencioso), se conservan los tres fallos del experimento original:

1. socket Unix demasiado largo en macOS, corregido primero con `/tmp` y ahora con directorio temporal único;
2. falso positivo de `ModuleRef` dentro del checker, corregido al limitar la regla a fuentes inspeccionadas;
3. `unhandledRejection` secundario en cleanup de jobs por `void task.finally(...)`, corregido con handlers explícitos.

4. Una repetición de CI frío expuso una carrera en `waitForFile`: el archivo podía crearse entre `access()` y la instalación del watcher, y los procesos hijos no estaban bajo un `finally` en ese caso. La ejecución llegó al timeout finito de `10 s`; se terminó el árbol iniciado por la prueba y los traps eliminaron sus dos PostgreSQL temporales. La corrección revalida el archivo después de instalar el watcher, garantiza terminación de hijos en `finally` y usa `20 s` como techo para inicializaciones frías. La suite operativa pasó 4/4 cuatro veces consecutivas después del cambio; sobre el código final pasaron el CI completo 48/48 en `20.97 s` y otro `verify` 48/48 en `16.95 s`.

La instalación accidental con Node.js global incompatible también quedó registrada arriba y se repitió correctamente. Ningún fallo permanece activo en la validación final.

## Cierre de evidencia

Se satisfacen los ocho hallazgos obligatorios dentro del alcance del spike. Permanecen como riesgos/decisiones externas: atomicidad de auditoría, ejecución CI Linux remota, evolución del checker textual, política de scripts npm y las decisiones DEC-044/049/050/051/004.

**REMEDIATIONS PASS — ready for focused re-review.**
