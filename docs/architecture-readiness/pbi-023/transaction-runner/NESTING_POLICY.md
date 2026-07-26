# Política de nesting

## Decisión

**Fail-closed.** Una facility admite una transacción activa. Toda segunda
invocación sobre la misma facility, directa, indirecta o solapada, falla con
`DATABASE_TRANSACTION_NESTED_FORBIDDEN`.

No existen:

- `AsyncLocalStorage`;
- transacción implícita por request;
- savepoints;
- commit/rollback manual;
- reutilización silenciosa;
- Unit of Work global.

El contexto explícito debe propagarse a infraestructura futura. En este paso
sólo el helper owner-internal puede resolver el executor y deja de hacerlo al
terminar el callback.

## Consecuencia

La política conservadora evita nesting aunque limita concurrencia por facility.
Las pruebas de concurrencia independiente usan facilities aisladas contra la
misma base. Permitir varias unidades simultáneas sobre una facility compartida
requiere una decisión posterior de scope explícito; no se resolverá mediante
contexto global implícito.
