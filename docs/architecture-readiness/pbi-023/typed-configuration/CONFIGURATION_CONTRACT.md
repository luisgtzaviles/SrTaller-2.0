# Contrato de configuración

## Función pura

`parseDatabaseConfig(input)` cumple:

`input explícito → validación fail-closed → DatabaseConfig inmutable`

No conserva el input, no consulta estado global, no ejecuta I/O y no aplica
fallback. Dos inputs equivalentes producen valores equivalentes sin compartir
objetos mutables.

## Modelo

| Grupo | Campos |
|---|---|
| `identity` | host, port, database, user, password |
| `transport` | `sslMode`: `disable`, `verify-ca` o `verify-full` |
| `pool` | min, max y timeouts idle/connection/statement/query |
| `runtime` | environment, role, accessMode, migrationsEnabled, testRunId |
| `observability` | applicationName y labels no sensibles |

Todos los tipos y propiedades son `readonly`; cada objeto anidado y el objeto
raíz se congelan con `Object.freeze`.

## Ambientes y roles

| Ambiente | Namespace | Roles | SSL |
|---|---|---|---|
| development | `SR_DB_*` | application, migration | elección explícita |
| test | `SR_TEST_DB_*` | test | elección explícita |
| production | `SR_DB_*` | application, migration | sólo `verify-full` |

- `application`: migraciones deshabilitadas; read-only o read-write.
- `migration`: migraciones habilitadas y read-write.
- `test`: migraciones deshabilitadas, read-write y base
  `srtaller_test_<run_id>`.

El rol migration no se integra al servidor ordinario: el bootstrap no cambió
y el futuro runner será su único consumidor autorizado.

## Decisiones deliberadas

- Cero defaults, incluso para puerto y application name, para evitar seleccionar
  accidentalmente una base.
- Connection strings y variables fallback de `libpq` están prohibidas.
- No se admite CA inline en este paso. La fuente de trust material se decidirá
  de manera gobernada al materializar TLS en el Paso 6.
- El password permanece disponible sólo dentro del contrato infraestructural;
  la vista de diagnóstico nunca lo replica.
- No se exporta barrel ni singleton.

## Errores

`DatabaseConfigError` expone únicamente categoría `Configuration`, código,
nombre de variable y razón estable. Nunca conserva ni serializa el valor
recibido.
