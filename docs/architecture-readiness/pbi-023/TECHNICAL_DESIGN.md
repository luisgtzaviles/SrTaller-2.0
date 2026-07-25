# Diseño técnico ejecutable de PBI-023

## 1. Objetivo

Definir la menor fundación productiva que permita a módulos propietarios usar
PostgreSQL `18.4` mediante Kysely, aplicar migraciones gobernadas y demostrar
aislamiento tenant/sucursal sin API, identidad ni negocio.

Este diseño no materializa paths. Cada path se crea sólo cuando su paso tenga
un consumidor real, prueba y actualización previa del checker.

## 2. Arquitectura

Flujo previsto:

1. configuración validada crea una facility de conexión;
2. el runner de migraciones usa una identidad exclusiva;
3. cada módulo declara su puerto hacia adentro;
4. el adapter Kysely vive en la infraestructura del módulo owner;
5. el adapter recibe scope explícito y una conexión/transaction handle;
6. el schema y constraints preservan tenant/sucursal;
7. DEC-044 traduce errores antes de cruzar la infraestructura.

No habrá:

- repositorio genérico;
- acceso de un módulo a tablas de otro;
- Kysely en dominio/aplicación;
- migración desde bootstrap;
- query global ordinaria;
- contexto mutable global o request-scoped como autoridad;
- RLS.

## 3. Dependencias candidatas

| Dependencia | Versión | Tipo | Criterio |
|---|---:|---|---|
| `kysely` | `0.29.4` | runtime | query builder y migrador seleccionados por DEC-049/050 |
| `pg` | `8.22.0` | runtime | dialecto/pool oficial PostgreSQL |
| `@types/pg` | `8.20.0` | desarrollo | tipos compatibles con TypeScript 6 |

No se propone CLI de migraciones ni framework adicional. Para pruebas se usa
`node:test` ya disponible y PostgreSQL real provisionado fuera del proceso.
Testcontainers `12.0.4` es sólo una alternativa investigada.

Antes de instalar se ejecuta DEC050-C01: reconfirmar metadata, fuente oficial,
baseline exacta, licencia, integridad, dependencias transitivas y compatibilidad
ejecutada.

## 4. Paths previstos

La infraestructura raíz tiene policy preventiva D5-R037–D5-R049. Los paths no
materializados siguen siendo futuros aprobados, no autorización para crearlos.

| Path previsto | Owner | Consumidor | API pública | Razón | Momento |
|---|---|---|---|---|---|
| `src/infrastructure/database/database-config.ts` | Ingeniería + Operaciones | connection/migrator futuro | `DatabaseConfig`, error, parser y redacted view | validar configuración una vez | paso 5 — materializado |
| `src/infrastructure/database/database-types.ts` | Ingeniería | adapters y migrator | tipo de schema técnico | tipos Kysely sin filtrarlos al dominio | futuro; no materializado en Paso 6 |
| `src/infrastructure/database/database-connection.ts` | Ingeniería + Operaciones | transaction runner materializado/adapters futuros y tests | interface/error/create/sanitize; no drivers | pool único y lifecycle explícito | paso 6 — materializado; drain interno Paso 7 |
| `src/infrastructure/database/database-transaction-capability.ts` | Ingeniería + Operaciones | sólo connection/runner | capability interna, nunca barrel público | executor Kysely owner-scoped | paso 6B — materializado |
| `src/infrastructure/database/transaction-runner.ts` | Ingeniería + Operaciones | adapters futuros | options/context/error/run exactos | commit/rollback seguro | paso 7 — materializado |
| `src/infrastructure/database/database-migration-capability.ts` | Ingeniería + Operaciones | sólo connection/runner | capability owner-internal | sesión dedicada sin exponer Kysely | paso 8 — materializado |
| `src/infrastructure/database/database-migration-provider.ts` | Ingeniería + Operaciones | sólo migration runner | provider/manifest internos | discovery y hash fail-closed | paso 8 — materializado |
| `src/infrastructure/database/migration-runner.ts` | Ingeniería + Operaciones | composición operativa futura | status/latest/up/down/destroy | aislar mutación del bootstrap | paso 8 — materializado |
| `src/infrastructure/database/migrations/` | owner por archivo; custodia Operaciones | migration runner | módulos de migración congelados | secuencia central determinista | paso 9; inexistente hasta la primera migración |
| `src/modules/tenancy/application/ports/tenant-repository.port.ts` | tenancy | aplicación tenancy futura | puerto interno; no export cross-module | contrato owner-first | paso 11, sólo con adapter real |
| `src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts` | tenancy | composición/test | ninguna cross-module | acceso a objeto propio | paso 11 |
| `src/modules/stations/application/ports/branch-repository.port.ts` | stations | aplicación stations futura | puerto interno; no export cross-module | exigir tenant + branch | paso 11 |
| `src/modules/stations/infrastructure/persistence/kysely-branch.repository.ts` | stations | composición/test | ninguna cross-module | acceso a objeto propio | paso 11 |
| `scripts/run-migrations.mjs` | Ingeniería + Operaciones | scripts package futuros | CLI de proceso | entrada explícita no importable por runtime | composición operacional diferida |
| `test/persistence-support.mjs` | Calidad + Ingeniería | pruebas persistence | helpers sólo de test | lifecycle DB/cleanup | paso 9 |
| `test/persistence-fixtures.mjs` | Calidad + Seguridad | pruebas persistence | fixtures sintéticos | dos tenants/sucursales deterministas | paso 12 |
| `test/persistence-migrations.test.mjs` | Calidad + Operaciones | `test:persistence` | ninguna | vacío/anterior/re-run/lock/fallo | paso 9 |
| `test/persistence-isolation.test.mjs` | Seguridad + Calidad | `test:persistence` | ninguna | matriz negativa | paso 12 |
| `test/persistence-transactions.test.mjs` | Ingeniería + Calidad | `test:persistence` | ninguna | misma conexión, commit/rollback | paso 12 |
| `architecture/dec-005-policy.json` | Arquitectura | checker | policy versionada | autorizar facility/paths/edges exactos | paso 3 — completado |
| `scripts/check-architecture.mjs` | Arquitectura + Ingeniería | gates | diagnostics D5 | detectar nuevos límites | paso 3 — CLI preservado |
| fixtures/mutaciones del checker | Arquitectura + Calidad | `test:architecture` | casos de prueba | demostrar fail-closed | paso 3 — completado |

La ubicación central de migraciones no comparte ownership: cada archivo y
objeto conserva owner único en
[PERSISTENCE_OWNERSHIP_REGISTRY.md](PERSISTENCE_OWNERSHIP_REGISTRY.md). El
runner sólo custodia orden y ejecución.

## 5. Modelo mínimo propuesto

SPIKE-002 está cerrado. No se escribirá SQL productivo hasta cerrar los gates
de checker, ownership, dependencias, configuración y migración aplicables.

### `tenants`

| Campo | Diseño |
|---|---|
| Propósito | raíz de aislamiento SaaS |
| Owner | módulo `tenancy` |
| Scope | global del sistema; define el tenant, no pertenece a otro |
| Columnas mínimas | `tenant_id` UUID; `created_at` timestamptz |
| PK | `tenant_id` |
| UK | ninguna adicional en PBI-023 |
| FK | ninguna |
| Constraints | ID y timestamp no nulos |
| Índices | PK |
| Eliminación | no disponible en PBI-023; referencias restringen borrado |
| Riesgo | convertir ID conocido en autorización o agregar datos comerciales prematuros |

### `branches`

| Campo | Diseño |
|---|---|
| Propósito | demostrar pertenencia de sucursal a un tenant |
| Owner | módulo `stations` |
| Scope | tenant + sucursal |
| Columnas mínimas | `tenant_id` UUID; `branch_id` UUID; `created_at` timestamptz |
| PK | `(tenant_id, branch_id)` |
| UK | ninguna adicional |
| FK | `tenant_id` referencia al tenant owner |
| Constraints | tenant, branch y timestamp no nulos; tenant inmutable por contrato |
| Índices | PK ya comienza por tenant; índice adicional sólo con query medida |
| Eliminación | no disponible en PBI-023; dependencias futuras restringen |
| Riesgo | tratar `branch_id` aislado como identidad/autoridad global |

### Metadata de migración

Las tablas default `kysely_migration` y `kysely_migration_lock` pertenecen a la
facility de persistencia, tienen scope técnico global y no son consumidas por
módulos de dominio.

### Probes de SPIKE-002

Los objetos necesarios para CRUD/joins del spike son desechables y viven sólo
en su base efímera. No forman parte del schema productivo ni del registry de
PBI-023.

## 6. Decisiones de identidad física

- UUID se genera fuera de PostgreSQL para no introducir extensiones ni defaults
  no decididos.
- La PK compuesta de sucursal obliga a conservar `tenant_id` en referencias
  branch-scoped futuras.
- IDs opacos no son autorización.
- No se agregan `name`, `slug`, estado comercial, soft-delete ni `updated_at`
  sin caso de uso autorizado.
- Timestamps se almacenan con zona y se generan mediante reloj controlado por
  el adapter/migración según diseño futuro.

## 7. Configuración materializada

El contrato usa `SR_DB_`; test usa `SR_TEST_DB_` y nunca hereda
silenciosamente una configuración compartida. `SR_DB_ENVIRONMENT` selecciona
el namespace. No hay defaults.

| Variable | Regla |
|---|---|
| `SR_DB_ENVIRONMENT` | obligatoria; development/test/production |
| `SR_DB_HOST` | obligatoria fuera de test; test exige `SR_TEST_DB_HOST` |
| `SR_DB_PORT` | entero 1–65535; obligatorio |
| `SR_DB_NAME` | obligatoria; no se imprime |
| `SR_DB_USER` | obligatoria; no se imprime en logs públicos |
| `SR_DB_PASSWORD` | obligatoria, secreta, sin default |
| `SR_DB_SSL_MODE` | obligatoria; production exige `verify-full` |
| `SR_DB_POOL_MIN` / `SR_DB_POOL_MAX` | 0–100 / 1–100; min ≤ max |
| `SR_DB_CONNECTION_TIMEOUT_MS` | entero positivo obligatorio |
| `SR_DB_IDLE_TIMEOUT_MS` | entero positivo obligatorio |
| `SR_DB_STATEMENT_TIMEOUT_MS` | entero positivo obligatorio |
| `SR_DB_QUERY_TIMEOUT_MS` | entero positivo obligatorio |
| `SR_DB_APPLICATION_NAME` | obligatorio y gobernado |
| `SR_DB_ROLE` | application/migration; test usa role test en su namespace |
| `SR_DB_ACCESS_MODE` | read-only/read-write; migration/test exigen write |
| `SR_DB_MIGRATIONS_ENABLED` | boolean exacto; true sólo para migration |
| `SR_TEST_DB_RUN_ID` | obligatorio; liga la base test al run |

La configuración:

- valida tipo, rango, combinación y ambiente antes de abrir conexión;
- falla cerrado si falta un valor;
- no acepta password vacío;
- no registra objeto/env completo;
- ofrece una vista redacted con host hash/alias, puerto, database alias,
  SSL, pool y timeouts;
- exige TLS con verificación en ambientes compartidos;
- permite SSL deshabilitado sólo para una instancia local/CI aislada declarada;
- separa credenciales `app`, `migration` y `test-lifecycle`.

No se crean `.env`, secretos ni valores reales.

El contrato y sus matrices completas están en
[typed-configuration/](typed-configuration/README.md). No se aceptó CA inline:
su fuente de confianza queda para la facility TLS gobernada del Paso 6.

## 8. Pool y transacciones

- Un pool por rol/proceso; no un pool por query.
- Cada préstamo se libera en `finally`.
- El proceso cierra el pool en shutdown de test/runner.
- Transaction runner adquiere un client, ejecuta toda la unidad sobre ese
  client y hace commit/rollback antes de liberarlo.
- Repositorios reciben un executor ya scopeado; no obtienen pools globales.
- Retry se decide en la frontera de aplicación y reinicia toda la unidad para
  categorías permitidas; no repite un statement aislado.

## 9. Errores y logging

El adapter traduce:

- unique/FK → `Conflict` o `Business Rule` según contrato;
- serialización/deadlock → `Concurrency`, retryable a nivel de unidad;
- timeout → `Persistence` o `Infrastructure`, según origen;
- configuración → `Configuration`;
- desconocido → `Unexpected`.

Ningún error de `pg`, SQLSTATE, SQL, parámetro o stack cruza el adapter. Logs
incluyen operación estable, categoría, severidad, correlación, duración y
tenant/branch sólo cuando sea necesario y minimizado.

## 10. Testing

| Nivel | Qué prueba | PostgreSQL real |
|---|---|---|
| unit | parser, redaction, decisiones puras, contract guards | no |
| architecture | imports, ownership, paths, paquetes, raw SQL y bypass | no |
| migration | vacío/anterior/re-run/fallo/lock/down | sí |
| integration | pool, query, constraints, errores, transaction runner | sí |
| isolation | CRUD/join/FK/contexto concurrente | sí |
| compiled smoke | imports/build y comando no mutante `status` | conexión sólo en suite dedicada |

SQLite y mocks no sustituyen los tres últimos niveles.

## 11. Revisión de boundaries

Antes del primer archivo de `src/`:

1. versionar la policy nueva;
2. autorizar la facility raíz exacta;
3. registrar edges facility → adapter sin abrir acceso intermodular;
4. registrar paquetes de persistencia sólo en infraestructura;
5. agregar casos válidos, negativos y mutaciones;
6. ejecutar dos veces el checker;
7. confirmar que AppModule y exports públicos siguen exactos.

## 12. Fuera de alcance

API/HTTP, health endpoint público, Nest providers productivos, resolución de
tenant por request, estaciones runtime, auth, usuarios, PIN, sesiones, roles,
reparaciones, RLS, jobs, proveedor productivo, datos reales, deploy y release.
