# SPIKE-002 — Resultados de investigación

## Estado

- **Clasificación:** `Mandatory before implementation`.
- **Fecha de investigación:** 2026-07-24.
- **Timebox ejecutado:** una iteración documental y de metadata autoritativa.
- **Resultado de investigación:** `PASS`.
- **Resultado ejecutable:** `NOT RUN`.
- **Estado final del spike:** `Open — executable evidence pending`.
- **Dictamen para PBI-023:** `CONDITIONAL PASS FOR PLANNING / BLOCKED FOR
  IMPLEMENTATION`.

## Hipótesis

Un contexto inmutable, repositorios tenant-aware y constraints compuestas
pueden bloquear CRUD y referencias cross-tenant sin depender de filtros
opcionales.

La investigación demuestra que el tooling candidato puede soportar el
experimento. No demuestra la hipótesis de aislamiento: eso exige código
desechable, PostgreSQL real y casos negativos, acciones prohibidas en esta
tarea.

## Método reproducible

Se inspeccionaron sin instalación:

- metadata npm mediante `npm view`;
- documentación oficial;
- repositorios y tags oficiales;
- código fuente de migrador/adaptador en Kysely `0.29.4`;
- documentación PostgreSQL 18.

No se usaron blogs como evidencia primaria. No se ejecutaron scripts de
instalación.

## Registro de fuentes

| Fuente primaria | Fecha/versión | Conclusión | Impacto |
|---|---|---|---|
| [Kysely migrations](https://www.kysely.dev/docs/migrations) | 2026-07-24 | provider por archivos, `up`/`down`, orden e inmutabilidad | soporta DEC-050 |
| [Kysely v0.29.4 migrator](https://github.com/kysely-org/kysely/blob/v0.29.4/src/migration/migrator.ts) | `0.29.4` | journal, strict order, lock, transacción y resultado | runner puede ser mínimo |
| [Kysely v0.29.4 PostgreSQL adapter](https://github.com/kysely-org/kysely/blob/v0.29.4/src/dialect/postgres/postgres-adapter.ts) | `0.29.4` | advisory lock de sesión y timeout interno | agregar timeout de job |
| [Kysely npm](https://www.npmjs.com/package/kysely/v/0.29.4) | `0.29.4` | Node `>=22`, ESM; metadata oficial incluye `pg@8.22.0`, tipos y TS 6 en desarrollo | candidato compatible declarado |
| [node-postgres](https://node-postgres.com/) | `pg@8.22.0` | ESM, pool, lifecycle y transacciones sobre un mismo client | driver candidato |
| [pg transactions](https://node-postgres.com/features/transactions) | consulta 2026-07-24 | toda transacción usa el mismo client, no `pool.query` | gate DEC049-C04 |
| [PostgreSQL advisory locks](https://www.postgresql.org/docs/18/explicit-locking.html#ADVISORY-LOCKS) | PostgreSQL 18 | locks de sesión se liberan al cerrar conexión | valida semántica del adapter |
| [PostgreSQL retry](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html) | PostgreSQL 18 | `40001` y `40P01` requieren reintentar transacción completa | no retry ciego del statement |
| metadata npm de `pg` | `8.22.0` | Node `>=16`, export ESM y publicación 2026-06-29 | compatible declarado con Node 24 |
| metadata npm de `@types/pg` | `8.20.0` | tag TypeScript 6 disponible | tipos candidatos |
| metadata npm de Testcontainers | `12.0.4` | paquete actual, runtime/dependencias adicionales | alternativa no adoptada |

## Respuestas

### 1. Node.js 24.18.0, TypeScript 6.0.3, ESM y NodeNext

**Compatibilidad declarada: sí. Compatibilidad ejecutada: pendiente.**

Kysely `0.29.4` declara Node `>=22`, publica ESM y su metadata oficial usa
TypeScript 6 en desarrollo. El repositorio ya materializa ESM/NodeNext y
TypeScript `6.0.3`. Sólo una instalación congelada más typecheck/build/test en
Node `24.18.0` puede cerrar DEC050-C01.

### 2. Paquete y versión de `pg`

`pg@8.22.0` y `@types/pg@8.20.0` son los candidatos exactos. Kysely `0.29.4`
usa esas versiones en su propio desarrollo. Deben fijarse sin rangos y
revalidarse antes de cambiar el lockfile.

### 3. Ejecución de migraciones

Kysely expone `Migrator` y `FileMigrationProvider`. Un runner ESM explícito
crea la conexión de migración, resuelve archivos, invoca status/latest/down
según comando, inspecciona el resultado, cierra recursos y sale distinto de
cero ante error. No se ejecuta desde la aplicación.

### 4. Transacciones en PostgreSQL

Sí. El adapter PostgreSQL soporta DDL transaccional y el migrador usa
transacción por defecto. R0 no habilitará `disableTransactions`.

### 5. Locking concurrente

El adapter PostgreSQL de Kysely usa advisory lock de sesión. DEC-050 agrega
exclusión a nivel de job y timeout externo. El spike ejecutable debe iniciar
dos migradores y comprobar que sólo uno avanza a la vez.

### 6. PostgreSQL real en desarrollo y CI

Usar PostgreSQL `18.4` real mediante configuración de test explícita. Local
puede apuntar a una instancia aislada `18.4`; Linux CI debe provisionar un
servicio efímero fijado a `18.4`. La suite crea una base única por run/worker,
migra, prueba y elimina en `finally`.

### 7. Docker Compose, Testcontainers u otra opción

**Selección inicial: endpoint PostgreSQL externo al test.**

En CI puede ser un service container; esto es infraestructura de test, no una
decisión de despliegue de ADR-007. Local puede usar la instancia `18.4`
administrada por el desarrollador. Testcontainers reduce diferencias de
lifecycle, pero agrega paquetes y exige un daemon; no hay evidencia ejecutada
para adoptarlo. Docker Compose tampoco es necesario para un único servicio.

### 8. Reproducibilidad Linux

- toolchain exacta de DEC-004;
- lockfile congelado;
- PostgreSQL `18.4` fijado;
- timezone UTC y locale controlado;
- comandos no interactivos idénticos;
- datos sintéticos deterministas;
- base única por run;
- manifest de versiones, commit, resultados y hashes;
- dos runs Linux comparados.

### 9. Limpieza/restauración

Cada worker recibe una base efímera de nombre aleatorio generado por el
harness, no por datos de negocio. El `finally` cierra pools y elimina la base.
Un cleanup previo sólo puede eliminar recursos con el prefijo de test y la
marca del run. No se restaura snapshot productivo. Las pruebas de migración
crean desde vacío o desde un estado anterior sintético controlado.

### 10. Aislamiento tenant negativo

Dos tenants y al menos dos sucursales con IDs deliberadamente similares.
Ejecutar list/read/create/update/delete, join y FK cruzada; omitir scope,
intercambiar tenant, intercambiar branch y reutilizar contexto concurrente.
Toda operación ordinaria debe denegar o afectar cero filas sin revelar
existencia ajena.

### 11. Persistencia crítica sin mocks

Mocks sólo prueban decisiones puras o puertos. Migraciones, constraints,
transacciones, errores de driver, pooling, locks, queries e aislamiento se
prueban contra PostgreSQL `18.4` real.

### 12. Limitaciones y riesgos

- aún no existe evidencia ejecutada en la baseline exacta;
- el journal core no guarda checksum del contenido;
- el advisory lock interno tolera una espera larga;
- lifecycle local y CI usan proveedores distintos;
- el schema productivo mínimo no ofrece por sí solo 2–3 agregados
  representativos;
- el checker actual no autoriza infraestructura de persistencia;
- no se ha probado cleanup ante kill abrupto;
- no se ha probado comportamiento de pool concurrente.

### 13. Versiones exactas

| Componente | Candidato |
|---|---:|
| Node.js | `24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |
| PostgreSQL | `18.4` |
| Kysely | `0.29.4` |
| `pg` | `8.22.0` |
| `@types/pg` | `8.20.0` |

### 14. Scripts futuros

- `migrate:status`
- `migrate:latest`
- `migrate:down`
- `migrate:verify`
- `test:persistence`
- integración de `test:persistence` en `verify` cuando el lifecycle sea
  materializado y rápido/reproducible.

Ninguno fue creado.

### 15. Evidencia futura de PBI-023

- manifest exacto de toolchain y PostgreSQL;
- lockfile y diff de dependencias;
- diseño/registry de objetos;
- migración desde vacío/anterior/re-run;
- lock concurrente;
- commit/rollback de misma conexión;
- dos tenants y sucursales;
- matriz negativa CRUD/join/FK/contexto;
- errores traducidos/sanitizados;
- fixtures y cleanup;
- checker con caso válido, negativos y mutaciones;
- doble run Linux y hashes.

## Brecha entre el spike y el schema productivo

SPIKE-002 exige dos o tres agregados representativos. PBI-023 sólo autoriza
objetos base de tenant/sucursal y prohíbe modelar Reparaciones. El spike
ejecutable debe usar probes desechables fuera del schema productivo para
ejercitar CRUD, joins y referencias. Esos probes se eliminan al cerrar el
spike y no justifican tablas productivas.

## Cleanup de esta iteración

No hubo paquetes, código, base, contenedor, credenciales ni procesos que
limpiar. Sólo se creó documentación versionada.

## Criterio de cierre pendiente

SPIKE-002 sólo puede cerrarse cuando:

1. se autorice un experimento ejecutable desechable;
2. se use la baseline exacta y PostgreSQL `18.4`;
3. se ejecuten todos los casos de éxito/fracaso originales;
4. se preserve evidencia sanitizada y reproducible;
5. se eliminen probes, bases y credenciales efímeras;
6. Arquitectura, Seguridad y Calidad emitan dictamen.
