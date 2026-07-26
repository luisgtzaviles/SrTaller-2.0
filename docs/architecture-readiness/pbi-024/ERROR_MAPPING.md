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
| `STATION_EVIDENCE_MALFORMED` | Validation | recognition boundary | `VALIDATION_FAILED` / 400 | never |
| `STATION_EVIDENCE_REJECTED` | Authentication | recognition adapter | mismo 401 genérico | never |
| `STATION_TENANT_NOT_RECOGNIZED` | Authentication | recognition/application | mismo 401 genérico | never |
| `STATION_NOT_TRUSTED` | Authentication | application | mismo 401 para unknown/unlinked/revoked | never |
| `STATION_BRANCH_NOT_ELIGIBLE` | NotFound | tenancy/application | `RESOURCE_NOT_FOUND` / 404 | never |
| `STATION_SCOPE_MISMATCH` | NotFound | application | `RESOURCE_NOT_FOUND` / 404 | never |
| `STATION_CONTEXT_INPUT_CONFLICT` | Validation | ingress/application | `VALIDATION_FAILED` / 400 | never |
| `STATION_LIFECYCLE_CONFLICT` | Conflict | domain/application | `RESOURCE_CONFLICT` / 409 | never |
| `STATION_CONTEXT_STALE` | Concurrency | application | `CONCURRENCY_CONFLICT` / 409 | never transparente |
| `STATION_TRANSIENT_CONCURRENCY` | Concurrency | adapter/application | `TRANSIENT_CONCURRENCY_FAILURE` / 503 agotado | conditional |
| `STATION_REFERENCE_NOT_FOUND` | NotFound | repository/application | 404 sólo si visible; se colapsa según scope | never |
| `STATION_PERSISTENCE_FAILED` | Persistence | adapter | `INTERNAL_ERROR` / 500 o 503 clasificado | según causa |
| `STATION_CONFIGURATION_INVALID` | Configuration | startup/adapter | readiness fail; 500/503 genérico si atiende | never |
| `STATION_REFERENCE_INTEGRITY_BROKEN` | Unexpected | application | `INTERNAL_ERROR` / 500 | never |
| `STATION_INVARIANT_BROKEN` | Unexpected | domain/application | `INTERNAL_ERROR` / 500 | never |

## Señales PostgreSQL

| Señal | Traducción | Resultado |
| --- | --- | --- |
| `23505` binding abierto duplicado / PK conocida | Conflict | 409 seguro |
| `23503` al validar una referencia solicitada y visible | NotFound | 404 sanitizado |
| `23503` en binding/station ya persistidos | Unexpected por integridad rota | 500 sanitizado |
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
- evidencia bien formada no reconocida;
- tenant no reconocible desde evidencia server-side;
- station desconocida;
- station `Unlinked`;
- station `Revoked`;
- station de otro tenant.

Un recurso solicitado fuera del contexto ya resuelto usa
`RESOURCE_NOT_FOUND`/404. Un tenant/branch enviados por cliente en conflicto
con la evidencia verificada usan `VALIDATION_FAILED`/400 sin devolver el valor
correcto.

Una evidencia presente pero estructuralmente malformada usa
`VALIDATION_FAILED`/400 porque el fallo ocurre antes de consultar estado. No se
incluye el valor recibido. Una referencia persistida imposible usa
`STATION_REFERENCE_INTEGRITY_BROKEN`/`Unexpected` y sólo publica
`INTERNAL_ERROR`/500.

## Mapeo inequívoco de AD-05, AD-07 y AD-11

| Escenario | Categoría/código interno único | Código/HTTP externo |
| --- | --- | --- |
| AD-05A branch fuera de scope | `NotFound` / `STATION_BRANCH_NOT_ELIGIBLE` | `RESOURCE_NOT_FOUND` / 404 |
| AD-05B binding cross-tenant imposible | `Unexpected` / `STATION_REFERENCE_INTEGRITY_BROKEN` | `INTERNAL_ERROR` / 500 |
| AD-07A tenant no reconocido | `Authentication` / `STATION_TENANT_NOT_RECOGNIZED` | `AUTHENTICATION_REQUIRED` / 401 |
| AD-07B referencia persistida a tenant inexistente | `Unexpected` / `STATION_REFERENCE_INTEGRITY_BROKEN` | `INTERNAL_ERROR` / 500 |
| AD-11A evidencia ausente | `Authentication` / `STATION_EVIDENCE_REQUIRED` | `AUTHENTICATION_REQUIRED` / 401 |
| AD-11B evidencia malformada | `Validation` / `STATION_EVIDENCE_MALFORMED` | `VALIDATION_FAILED` / 400 |
| AD-11C evidencia no reconocida | `Authentication` / `STATION_EVIDENCE_REJECTED` | `AUTHENTICATION_REQUIRED` / 401 |

Estas categorías no son alternativas. Causas internas distintas pueden
compartir una representación externa por anti-enumeración, pero cada test y log
conserva un único código interno.

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
