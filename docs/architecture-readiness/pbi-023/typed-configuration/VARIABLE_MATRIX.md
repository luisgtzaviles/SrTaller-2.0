# Matriz de variables

No existe ningún default. “Test” usa el nombre `SR_TEST_DB_<SUFIJO>`; los
otros ambientes usan `SR_DB_<SUFIJO>`.

| Variable | Obligatoria | Tipo/rango | Secreto | Ambientes | Ejemplo seguro | Error principal |
|---|---|---|---|---|---|---|
| `SR_DB_ENVIRONMENT` | sí | development/test/production | no | todos | `test` | UNKNOWN_VALUE |
| `<P>HOST` | sí | ASCII host/IP, 1–255 | no; se oculta en diagnóstico | todos | `127.0.0.1` | INVALID_STRING |
| `<P>PORT` | sí | entero 1–65535 | no | todos | `5432` | INVALID_INTEGER/OUT_OF_RANGE |
| `<P>NAME` | sí | ASCII gobernado, 1–63 | no; se oculta | todos | `srtaller_development` | INVALID_STRING |
| `<P>USER` | sí | ASCII gobernado, 1–63 | sensible; se oculta | todos | `srtaller_application` | INVALID_STRING |
| `<P>PASSWORD` | sí | 1–1024, no whitespace-only | sí | todos | placeholder externo | REQUIRED/EMPTY |
| `<P>SSL_MODE` | sí | disable/verify-ca/verify-full | no | todos | `verify-full` | UNKNOWN_VALUE |
| `<P>POOL_MIN` | sí | entero 0–100 | no | todos | `0` | OUT_OF_RANGE |
| `<P>POOL_MAX` | sí | entero 1–100 | no | todos | `8` | OUT_OF_RANGE |
| `<P>IDLE_TIMEOUT_MS` | sí | entero 1–3600000 | no | todos | `30000` | OUT_OF_RANGE |
| `<P>CONNECTION_TIMEOUT_MS` | sí | entero 1–3600000 | no | todos | `5000` | OUT_OF_RANGE |
| `<P>STATEMENT_TIMEOUT_MS` | sí | entero 1–3600000 | no | todos | `15000` | OUT_OF_RANGE |
| `<P>QUERY_TIMEOUT_MS` | sí | entero 1–3600000 | no | todos | `20000` | OUT_OF_RANGE |
| `<P>APPLICATION_NAME` | sí | ASCII gobernado, 1–63 | no | todos | `srtaller-api` | INVALID_STRING |
| `<P>ROLE` | sí | application/migration/test | no | todos | `application` | UNKNOWN_VALUE |
| `<P>ACCESS_MODE` | sí | read-only/read-write | no | todos | `read-write` | UNKNOWN_VALUE |
| `<P>MIGRATIONS_ENABLED` | sí | exactamente true/false | no | todos | `false` | INVALID_BOOLEAN |
| `SR_TEST_DB_RUN_ID` | sí en test | `[a-z0-9_]{1,40}` | no | test | `run_001` | INVALID_STRING |

`<P>` significa `SR_DB_` o `SR_TEST_DB_` según el ambiente.

## Reglas de namespace

- Test rechaza cualquier variable compartida `SR_DB_*` distinta de
  `SR_DB_ENVIRONMENT`.
- Development/production rechazan toda variable `SR_TEST_DB_*`.
- Cualquier variable desconocida dentro de ambos prefijos falla.
- `DATABASE_URL`, `SR_DB_URL`, `SR_TEST_DB_URL` y fallbacks `PG*` conocidos
  fallan aunque su valor esté vacío.
