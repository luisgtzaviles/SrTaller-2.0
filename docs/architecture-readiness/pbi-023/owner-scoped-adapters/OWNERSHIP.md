# Ownership

| Owner | Puerto | Adapter | Tabla | Escritura |
|---|---|---|---|---|
| `tenancy` | `TenantRepositoryPort` | `kysely-tenant.repository.ts` | `tenants` | sólo create tenant |
| `stations` | `BranchRepositoryPort` | `kysely-branch.repository.ts` | `branches` | sólo create branch |
| `database` | capability de ejecución | `database-persistence-capability.ts` | ninguna | no expresa DML |

No existe co-ownership. El adapter tenancy no contiene `branches`; el adapter
stations no selecciona ni escribe `tenants`. La FK de `branches` no concede a
stations autoridad de lectura sobre la tabla tenant.

Los módulos registran el adapter mediante un import type de composición. No se
crea provider Nest ni instancia global. Las factories concretas permanecen en
infraestructura y no se reexportan desde el barrel público.

La única ampliación pública es el tipo nominal `TenantId` y su parser en el
contrato de tenancy, consumidos realmente por stations. `BranchId` permanece
en el puerto owner porque todavía no existe consumidor cross-module.
