# Mapeo de errores de PBI-024

## Reglas

- Se usa la Opción A de DEC-044: errores tipados por capa.
- El adapter traduce `pg`/Kysely antes del puerto.
- La aplicación traduce cuando cambia la semántica.
- Un borde futuro publica sólo códigos allowlisted.
- Ningún texto de driver, SQLSTATE, tabla, constraint, ID, secreto o stack
  cruza el contrato.
- No se añade catálogo global ni excepciones Nest en dominio/aplicación.

## Catálogo interno mínimo

| Código conceptual | Categoría | Nace en | Traducción/exposición | Retry |
| --- | --- | --- | --- | --- |
| `STATION_EVIDENCE_REQUIRED` | Authentication | recognition/application | `AUTHENTICATION_REQUIRED` / 401 | never |
| `STATION_EVIDENCE_REJECTED` | Authentication | recognition adapter | mismo 401 genérico | never |
| `STATION_NOT_TRUSTED` | Authentication | application | mismo 401 para unknown/unlinked/revoked | never |
| `STATION_SCOPE_MISMATCH` | Authorization interno | application | `RESOURCE_NOT_FOUND` / 404 | never |
| `STATION_CONTEXT_INPUT_CONFLICT` | Validation | ingress/application | `VALIDATION_FAILED` / 400 | never |
| `STATION_LIFECYCLE_CONFLICT` | Conflict | domain/application | `RESOURCE_CONFLICT` / 409 | never |
| `STATION_CONTEXT_STALE` | Concurrency | application | `CONCURRENCY_CONFLICT` / 409 | never transparente |
| `STATION_TRANSIENT_CONCURRENCY` | Concurrency | adapter/application | `TRANSIENT_CONCURRENCY_FAILURE` / 503 agotado | conditional |
| `STATION_REFERENCE_NOT_FOUND` | NotFound | repository/application | 404 sólo si visible; se colapsa según scope | never |
| `STATION_PERSISTENCE_FAILED` | Persistence | adapter | `INTERNAL_ERROR` / 500 o 503 clasificado | según causa |
| `STATION_CONFIGURATION_INVALID` | Configuration | startup/adapter | readiness fail; 500/503 genérico si atiende | never |
| `STATION_INVARIANT_BROKEN` | Unexpected | domain/application | `INTERNAL_ERROR` / 500 | never |

## Señales PostgreSQL

| Señal | Traducción | Resultado |
| --- | --- | --- |
| `23505` binding abierto duplicado / PK conocida | Conflict | 409 seguro |
| `23503` tenant/branch/station conocida | NotFound o invariant según operación | 404 o 500 sanitizado |
| `23514`/`23502` estado/lifecycle conocido | BusinessRule si intención válida; de otro modo Unexpected | 422 o 500 |
| `40001` | Concurrency transitoria | retry de unidad completa sólo idempotente |
| `40P01` | Concurrency transitoria | mismo contrato |
| `57014`/timeout | Persistence/Infrastructure | 503 sólo si outcome conocido |
| revisión condicional sin fila | Concurrency stale | 409 |
| código desconocido | Persistence → Unexpected | 500 |

El mapping usa código estructurado y constraint lógico conocido, nunca parsing
de mensajes.

## Anti-enumeración

Los siguientes estados colapsan externamente en
`AUTHENTICATION_REQUIRED`/401:

- evidencia ausente o inválida;
- station desconocida;
- station `Unlinked`;
- station `Revoked`;
- station de otro tenant.

Un recurso solicitado fuera del contexto ya resuelto usa
`RESOURCE_NOT_FOUND`/404. Un tenant/branch enviados por cliente en conflicto
con la evidencia verificada usan `VALIDATION_FAILED`/400 sin devolver el valor
correcto.

## Logging futuro

Cuando PBI-028 materialice logging, un evento autoritativo podrá incluir:

- correlation ID ya confiable;
- módulo `stations`;
- operación estable;
- tenant/branch/station sólo después de resolverlos;
- categoría/código interno;
- duración, outcome e intento;
- revision esperada/observada sólo si no crea fuga.

Nunca incluye credencial de station, evidencia cruda, fingerprint, payload,
PIN, token, SQL, SQLSTATE, constraint, nombre de conexión o IDs adivinados
desde el cliente.

Hasta PBI-028, PBI-024 prueba resultados y sanitización; no inventa sink,
retención, correlación o evento de auditoría.

## Public contract

PBI-024 no crea HTTP. Un borde futuro reutilizará exactamente el envelope de
DEC-044. No se agregan fields o códigos station-specific públicos sin contract
review.
