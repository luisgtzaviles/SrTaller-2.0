# Contrato de conexión

## API pública

| Símbolo | Contrato |
|---|---|
| `DatabaseConnection` | expone sólo `state`, `verify()` y `close()` |
| `DatabaseConnectionError` | error estable sin causa del driver |
| `createDatabaseConnection(config)` | crea recursos locales lazy; no lee ambiente ni conecta |
| `sanitizeDatabaseConnectionState(connection)` | devuelve diagnóstico técnico permitido |

No se exportan `Pool`, `PoolClient`, `Kysely`, executor, query o singleton.

## Mapping `DatabaseConfig` → `PoolConfig`

| Configuración gobernada | Propiedad `pg` |
|---|---|
| host, port, database, user, password | propiedades separadas; nunca connection string |
| `sslMode=disable` | `ssl=false` |
| `sslMode=verify-ca` | TLS con CA verificada y hostname diferido por contrato |
| `sslMode=verify-full` | TLS con certificado y hostname verificados |
| pool min/max | `min` / `max` |
| idle timeout | `idleTimeoutMillis` |
| connection timeout | `connectionTimeoutMillis` |
| statement timeout | `statement_timeout` |
| query timeout | `query_timeout` |
| application name | `application_name` |

`allowExitOnIdle` se omite: el lifecycle no depende de una salida implícita.
El proceso/test debe invocar `close()`.

## Kysely

La factory crea `Kysely<EmptyDatabaseSchema>` con `PostgresDialect` sobre el
mismo pool controlado. El schema es deliberadamente vacío: este paso no crea
tipos falsos, tablas ni objetos de negocio. Kysely queda encapsulado y se
cierra dentro de la facility.

## Verificación

`verify()` adquiere un cliente del pool, ejecuta el literal único `select 1` y
libera el cliente en `finally`. Los timeouts son finitos y proceden de la
configuración ya validada. No existe query de negocio ni mutación.
