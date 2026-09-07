# PBI-028 — Threat Model

## Activos y fronteras

El activo es la atribución histórica autoritativa de una Operational Note: el
actor, Tenant, Branch, Station, Session, acción, recurso, resultado, momento y
correlation ID que existían al confirmar el efecto. La frontera no confiable es
HTTP; la autoridad nace al resolver sesión, estación, grants y recurso
server-side. Repairs posee el timeline y el store de auditoría acotado, pero
ambos conservan semántica distinta; los logs técnicos tienen otro propósito.
No se crea un módulo Audit global.

## Amenazas y controles

| Amenaza | Control obligatorio | Evidencia |
|---|---|---|
| Actor o contexto forjado en payload/header | El caso de uso recibe `AuthorizedOperationalContext`; el contrato HTTP no acepta autoridad del cliente | pruebas HTTP negativas y de contrato |
| Session, User, Station o capability revocados | Resolución fresca de PBI-026 antes de cada operación | pruebas de revocación/deny |
| Divergencia nota/auditoría | Misma transacción PostgreSQL; fallo de auditoría revierte la nota | prueba material de rollback |
| Replay o carrera duplica hechos | `clientRequestId` conserva idempotencia del efecto; un solo par nota/auditoría | retry, mismatch y concurrencia material |
| Cruce Tenant/Branch/Repair | Scope explícito y constraints/queries compatibles con ownership | matriz A/B y recurso ajeno |
| Recalcular historia tras cambios de identidad | Persistir IDs opacos y snapshot de presentación necesario al confirmar | prueba posterior a cambios de lifecycle |
| Exfiltrar body, PIN, token, cookie, SQL o payload | Allowlist fija; no serializar request ni excepciones | secret/payload scan y aserciones de columnas |
| Confundir correlation con autoridad | ID aleatorio server-side y opaco; separado de sesión, auth e idempotencia | contrato y prueba de spoofing |
| Alterar o borrar auditoría mediante producto | Persistencia append-only de Repairs; sin update/delete ni API/UI de lectura | pruebas arquitectónicas y de superficie |
| Exponer internals al fallar DB | Error estable y sanitizado; no efecto parcial | pruebas HTTP/DB unavailable |
| Duplicar audit al reintentar | El replay retorna el efecto existente y preserva su correlation original | prueba de replay exacto |
| Presentar un intento fallido como éxito | Sólo el commit confirmado crea el hecho de negocio `succeeded` | pruebas deny/error sin success fact |

## Riesgos residuales aceptados

- Un actor privilegiado directo de PostgreSQL queda fuera de la protección
  append-only de la aplicación.
- No existe todavía integridad criptográfica, SIEM, exportación ni retención
  legal completa.
- Intentos denegados/fallidos quedan en la frontera de seguridad/logging y no
  en el hecho de negocio mínimo de este slice.
- La cobertura se limita a `repairs.add_note`; otros writes sintéticos no se
  reinterpretan como resueltos.

Estos riesgos no se ocultan ni se convierten en Production Readiness. El riesgo
del PBI permanece `High`.
