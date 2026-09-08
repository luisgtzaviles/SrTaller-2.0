# PBI-028 — Audit and Correlation Contract

## Hecho mínimo

El store de auditoría acotado propiedad de Repairs conserva el hecho confirmado
de `repairs.add_note` mediante campos tipados y allowlisted. Este contrato no
crea un módulo Audit global:

- identificador propio del evento;
- `tenantId`, `branchId`, `stationId`, `userId` y `sessionId`;
- acción exacta `repairs.add_note`;
- tipo e identificador opaco del recurso Repair;
- resultado `succeeded`;
- timestamp server-side;
- correlation ID server-side;
- clave de efecto/idempotencia suficiente para impedir duplicados.

No conserva el cuerpo de la nota, request completo, nombres innecesarios,
secretos, PIN, token, cookie, SQL ni stack trace. El timeline conserva el texto
y el snapshot de presentación del actor; no sustituye al hecho de auditoría.

## Correlation

- El servidor genera el identificador autoritativo con aleatoriedad segura.
- Un valor del cliente puede ser tratado sólo como candidato no autoritativo y
  nunca reemplaza el ID server-side.
- Correlation no concede identidad, scope, capability ni idempotencia.
- El éxito y los errores HTTP exponen una referencia segura que permite unir
  respuesta, log técnico permitido y hecho confirmado cuando existe.
- Un replay idempotente no crea un segundo hecho y conserva la correlation del
  efecto original.

## Consistencia

Repairs gobierna la transacción y ambas persistencias del caso de uso mediante
sus puertos públicos. La inserción de timeline y la inserción append-only en el
store de auditoría de Repairs forman una unidad de commit. Ningún adaptador
reconstruye actor, contexto o autorización. Si falla el write obligatorio del
hecho de auditoría, no se confirma la nota.

## Acceso y retención del slice

No existe endpoint de lectura, exportación, dashboard ni UI para el store de
auditoría acotado de Repairs. No hay eliminación automática en el slice
local/MVP. Cualquier acceso productivo, retención legal, anonimización, backup
específico o mecanismo criptográfico requiere decisión posterior; esta reserva
no permite omitir el hecho mínimo.

## Matriz de aceptación

| ID | Predicado observable |
|---|---|
| AC-01 | La nota confirmada muestra el User autenticado, no actor sintético |
| AC-02 | Existe exactamente un hecho separado con contexto completo y correlation |
| AC-03 | Nota y auditoría confirman o revierten juntas |
| AC-04 | Retry concurrente produce un solo par; mismatch produce `409` sin otro hecho |
| AC-05 | Tenant/Branch/recurso ajenos no producen lectura, nota ni hecho cruzado |
| AC-06 | Cliente no puede escoger actor, contexto o correlation autoritativos |
| AC-07 | Allowlist demuestra ausencia de contenido y secretos |
| AC-08 | Revocación/capability removal deniega antes del efecto |
| AC-09 | Errores son estables, sanitizados y correlacionables |
| AC-10 | Migración es aditiva, reversible y pasa DB fresh/existing |
| AC-11 | No aparece módulo Audit global, API/UI de consulta ni observabilidad extendida |

## Evidencia de pruebas requerida

- Unit/application: mapeo del contexto, generación de correlation, allowlist y
  rechazo de autoridad del cliente.
- PostgreSQL 18.4 material: migración up/down/fresh/existing, atomicidad,
  rollback inyectado, retry, mismatch, concurrencia, aislamiento y lifecycle.
- HTTP/security: same-origin, JSON, CSRF, spoofing, revocación,
  anti-enumeration, errores y correlation.
- Arquitectura: Repairs conserva ownership y puertos de ambas persistencias,
  sin módulo global, deep imports, raw SQL en aplicación ni autoridad en
  controller.
- UI focalizada: payload mínimo, draft/session safety y actor real sólo tras
  confirmación; sin superficie de consulta de auditoría.
- `pnpm run verify`, dos corridas autoritativas y comparison GREEN.
