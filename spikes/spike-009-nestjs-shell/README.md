# SPIKE-009 — NestJS como shell técnico desacoplado

## Advertencia

Este directorio contiene un experimento técnico **no productivo, sintético, desechable y eliminable**. No es el scaffold de R0, no implementa Reparaciones y no selecciona permanentemente package manager, driver, ORM, migrador, contrato HTTP, estrategia de jobs ni plataforma de observabilidad.

ADR-005 permanece `Proposed`, DEC-004 permanece abierta y DEC-044/049/050/051 no se resuelven aquí.

## Estado

**REMEDIATIONS PASS — ready for focused re-review.**

El dictamen anterior fue **APPROVED FOR ADR REVIEW WITH REQUIRED REMEDIATIONS (Opción B)**. Las remediaciones obligatorias de Seguridad, Operaciones y Calidad se implementaron y validaron localmente; todavía requieren una revisión enfocada independiente. Este estado no recomienda ni implica aceptar ADR-005.

## Hipótesis y alcance

NestJS puede aportar bootstrap, composición, DI, transporte HTTP, validación y lifecycle sin entrar en dominio o aplicación ni convertirse en autoridad de tenant, contexto, autorización o correlación.

El recorrido contiene una entidad y caso de uso sintéticos, PostgreSQL real y aislado, controller REST/JSON, job diferido dentro del mismo artefacto, auditoría autoritativa, telemetría técnica, health y shutdown. La remediación añadió:

- pruebas de auditoría independientes y un caso observable de fallo de auditoría posterior al commit;
- drenaje determinista de un job realmente bloqueado durante shutdown;
- logs JSON sanitizados de startup, readiness, dependencia caída y lifecycle;
- correlation ID generado siempre por servidor y candidato cliente secundario validado;
- timeouts configurables de PostgreSQL y pruebas de conexión silenciosa, statement y lock;
- PostgreSQL temporal por ejecución, puerto/socket dinámicos y cleanup con `trap`;
- runner compatible con macOS/Linux y script de CI aislado;
- gate arquitectónico obligatorio, detección de ciclos y mutation checks controlados.

## Baseline efectiva del experimento

| Elemento | Versión o selección |
|---|---|
| Node.js | `24.18.0` |
| npm | `11.16.0`, provisional |
| TypeScript | `7.0.2`, modo estricto |
| NestJS | `11.1.28` |
| Adaptador HTTP | `@nestjs/platform-express` `11.1.28` |
| PostgreSQL | `18.4` |
| Driver experimental | `pg` `8.22.0` |
| Lockfile | `package-lock.json`, lockfileVersion 3 |

No se usaron prereleases, workspaces, Nx, Turborepo, contenedores, RLS, ORM ni migrador. npm y `pg` son elecciones reversibles exclusivas del experimento.

## Estructura

```text
src/
├── bootstrap/                   # composición NestJS y lifecycle
└── synthetic/
    ├── domain/                  # sin dependencias de framework
    ├── application/             # caso de uso, política, contexto y puertos
    ├── infrastructure/          # PostgreSQL, fixtures, jobs y observabilidad
    └── transport/http/          # controller, DTO, guard, filtro y health
scripts/                         # PostgreSQL aislado, gate y CI local
test/
├── unit/
├── architecture/
├── integration/
├── e2e/
├── job/
├── postgres/
└── operations/
```

## Requisitos y portabilidad

- Node.js `24.18.x` y npm `11.16.x`;
- PostgreSQL `18.x`, incluidos `initdb`, `pg_ctl`, `psql` y `createdb`;
- Bash y utilidades POSIX usadas por los scripts;
- macOS: Homebrew se descubre en `/opt/homebrew/opt/postgresql@18/bin`;
- Linux: se descubre `/usr/lib/postgresql/18/bin` o `/usr/local/pgsql/bin`;
- otra instalación: definir `POSTGRES_BIN` con el directorio de binarios.

Cada suite con base crea un directorio `/tmp/srtaller-spike009.XXXXXX`, un socket dentro de ese directorio y un puerto TCP libre. Un marcador de propiedad impide borrar recursos de otra ejecución. `scripts/with-postgres.sh` propaga señales y ejecuta cleanup en éxito, fallo, `INT`, `TERM` o `HUP`; `db:stop` sin una ejecución propia seleccionada es un no-op seguro.

La elección de un puerto libre tiene una ventana TOCTOU mínima entre sondeo y arranque; el runner reintenta hasta cinco veces. No sustituye aislamiento de CI por job/container.

## Ejecución reproducible

Instalación limpia y gate local:

```bash
cd spikes/spike-009-nestjs-shell
export PATH="/opt/homebrew/opt/node@24/bin:$PATH" # macOS Homebrew
# export POSTGRES_BIN="/usr/lib/postgresql/18/bin" # Linux si no está en PATH
npm ci
npm run verify
npm audit --audit-level=low
npm audit signatures
```

`verify` ejecuta typecheck, lint, unit, arquitectura, integración, E2E, jobs, timeouts PostgreSQL, lifecycle/cleanup y build. Las suites dependientes de PostgreSQL levantan y eliminan su propia instancia.

Para envolver otro comando con PostgreSQL temporal:

```bash
npm run db:with -- node --import tsx path/to/test.ts
```

El modo manual requiere mantener las variables en el mismo shell:

```bash
eval "$(npm run --silent db:start)"
npm run db:status
npm run db:stop
```

El schema es destructivo únicamente sobre la base temporal `spike009`; nunca debe apuntarse a un servidor compartido o productivo.

## Timeouts experimentales

| Variable | Default |
|---|---:|
| `SPIKE_PG_CONNECTION_TIMEOUT_MS` | `750` |
| `SPIKE_PG_STATEMENT_TIMEOUT_MS` | `750` |
| `SPIKE_PG_LOCK_TIMEOUT_MS` | `300` |
| `SPIKE_PG_IDLE_TIMEOUT_MS` | `1000` |
| `SPIKE_PG_IDLE_TRANSACTION_TIMEOUT_MS` | `1500` |

Son valores cortos de prueba, configurables y no una baseline productiva. `pg` aplica `connectionTimeoutMillis` al establecimiento/espera soportada por el pool; el spike no selecciona todavía una política adicional de adquisición.

## Señales operativas

`OperationalLogger` emite una línea JSON por evento con `timestamp`, `level` y `event`; cuando aplica, usa `serverCorrelationId` y conserva el candidato cliente sólo como referencia secundaria validada. Incluye inicio/listo/readiness, dependencia PostgreSQL caída, inicio y fin de drenaje, cierre de listener/pool, shutdown completo y errores inesperados. No registra credenciales, secretos, PIN, SQL, payloads ni cadenas de conexión.

Es una abstracción mínima del spike, no una selección de proveedor o plataforma de logging.

## CI experimental

```bash
bash scripts/ci.sh
```

Exige Node.js `24.18.x` y npm `11.16.x`, y ejecuta `npm ci`, `verify`, `npm audit --audit-level=low` y `npm audit signatures`; el runner de base rechaza binarios que no sean PostgreSQL 18.x. No despliega, publica artefactos, crea releases ni usa secretos. No se añadió un workflow raíz porque este spike aún no está comprometido y hacerlo aparentaría una baseline oficial. La ejecución remota Linux queda pendiente de una revisión/CI posterior; localmente se validaron descubrimiento de binarios, recursos dinámicos y comandos compatibles.

## Gate arquitectónico

`test:architecture` está incluido en `test:all`, `verify` y `ci`. Falla ante imports NestJS en dominio/aplicación, infraestructura/transporte desde dominio, `ModuleRef`, request scope no autorizado, SQL o adapter directo en controllers y ciclos relativos detectables. La suite prueba mutaciones controladas para demostrar fallos reales.

El checker es textual y deliberadamente pequeño: puede producir falsos positivos/negativos frente a sintaxis compleja, aliases, imports dinámicos o reexports. No sustituye un análisis AST o de grafo de producción.

## Evidencia y siguiente gate

La evidencia, fallos y repeticiones están en [EVIDENCE.md](EVIDENCE.md); los riesgos y la interpretación están en [RESULTS.md](RESULTS.md).

El siguiente paso permitido es una revisión enfocada de estas remediaciones por Seguridad, Operaciones y Calidad. Arquitectura + Ingeniería sólo podrán decidir ADR-005 en una iteración documental posterior; DEC-004 continúa abierta.
