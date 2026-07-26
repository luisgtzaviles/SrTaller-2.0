# Tenant scope

`TenantId` y `BranchId` son tipos nominales distintos. El compile test confirma
que TypeScript rechaza su intercambio.

| Operación | Scope requerido | Fallo por omisión/invalidez |
|---|---|---|
| tenant create/find/exists | `TenantPersistenceScope` | `PERSISTENCE_TENANT_SCOPE_REQUIRED` |
| branch create/find/exists | `TenantBranchPersistenceScope` | tenant o branch scope error |
| branch list | `TenantPersistenceScope` | `PERSISTENCE_TENANT_SCOPE_REQUIRED` |

Los parsers sólo aceptan UUID canónico. El adapter repite la validación en el
boundary runtime porque los tipos TypeScript no protegen llamadas JavaScript
ni casts.

Scope y payload de create deben coincidir exactamente. El payload nunca
selecciona un tenant distinto. Todas las validaciones negativas unitarias
comprueban que la capability no fue invocada, por lo que el fallo ocurre antes
de pool/query.

Los scopes validados y records retornados son congelados. No hay
`AsyncLocalStorage`, request scope ni variable global con tenant residual.
