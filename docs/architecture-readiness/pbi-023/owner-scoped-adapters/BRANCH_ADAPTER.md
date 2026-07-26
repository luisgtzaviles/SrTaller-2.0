# Adapter de branch

## Path

`src/modules/stations/infrastructure/persistence/kysely-branch.repository.ts`

## Contrato

- owner: `stations`;
- tabla: `branches`;
- port: `BranchRepositoryPort`;
- factories: ordinaria y transaction-bound;
- consumidor de composición: `stations.module.ts`, sólo type registration.

## Predicados

`findBranchById` y `existsBranch` aplican `tenant_id` y `branch_id`.
`listBranchesByTenant` aplica `tenant_id`. Create toma ambos IDs del scope
validado y rechaza cualquier diferencia con el record antes de la query.

## Aislamiento

- A no obtiene A1 al consultar con tenant B;
- list A no contiene filas B;
- el mismo `branchId` puede existir en A y B por la PK compuesta;
- duplicate `(tenantId, branchId)` produce conflicto;
- tenant inexistente produce error tipado por FK;
- no existe fallback por `branchId` global ni probe que revele otro tenant.

No se implementaron update/delete. Por tanto no hay escritura cross-tenant
silenciosa; la única escritura autorizada es create con scope y payload
idénticos.
