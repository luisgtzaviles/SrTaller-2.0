# Adapter de tenant

## Path

`src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts`

## Contrato

- owner: `tenancy`;
- tabla: `tenants`;
- port: `TenantRepositoryPort`;
- factories: ordinaria y transaction-bound;
- consumidor de composición: `tenancy.module.ts`, sólo type registration.

## Comportamiento

1. valida UUID, scope, igualdad payload/scope y timestamp antes de ejecutar;
2. invoca la capability con owner literal `tenancy`;
3. crea o selecciona exclusivamente `tenants`;
4. filtra find/exists por `tenant_id`;
5. mapea la fila a un record congelado;
6. traduce cualquier failure antes de cruzar el puerto.

Duplicate `23505` produce `TENANT_PERSISTENCE_CONFLICT`. La transacción de
commit conserva la fila y la transacción con callback fallido no deja cambios.

No existe delete, update, tabla dinámica, query global, pool, query builder
expuesto ni estado mutable global.
