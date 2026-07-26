# Contratos de puertos

## Tenant

```text
createTenant(scope: TenantPersistenceScope, record: CreateTenantRecord)
findTenantById(scope: TenantPersistenceScope)
existsTenant(scope: TenantPersistenceScope)
```

`TenantPersistenceScope.tenantId` es obligatorio y nominal. `TenantRecord`
contiene únicamente `tenantId` y `createdAt`.

## Branch

```text
createBranch(scope: TenantBranchPersistenceScope, record: CreateBranchRecord)
findBranchById(scope: TenantBranchPersistenceScope)
listBranchesByTenant(scope: TenantPersistenceScope)
existsBranch(scope: TenantBranchPersistenceScope)
```

Las operaciones individuales no aceptan `branchId` sin `tenantId`. No existe
`listAllBranches`.

## Retornos

- read inexistente o cross-tenant: `null`;
- exists inexistente o cross-tenant: `false`;
- list: arreglo readonly, ordenado y sólo del tenant;
- create: record readonly mapeado, nunca fila Kysely.

## CRUD mínimo

El schema sólo tiene identificadores y timestamp inmutables. Por ello el
contrato real autorizado es create/read/exists/list. No se inventó update y
no se implementó delete porque no existe política de eliminación autorizada y
la FK vigente es restrictiva.

Los records usan `createdAt` ISO UTC para no exponer un objeto `Date` mutable.
