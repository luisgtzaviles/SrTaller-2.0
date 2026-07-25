# Tabla `branches`

- Owner: `stations`.
- Rol: sucursal perteneciente a un tenant.
- PK: `branches_pk (tenant_id, branch_id)`.
- FK: `branches_tenant_fk (tenant_id) → tenants (tenant_id)`.
- Policies: `ON UPDATE RESTRICT`, `ON DELETE RESTRICT`.
- Columnas: `tenant_id uuid`, `branch_id uuid`, `created_at timestamptz`;
  todas no nulas y sin defaults.
- UK adicionales: ninguno.
- Checks adicionales: ninguno.

`branch_id` no es único globalmente. La prueba real insertó el mismo
`branch_id` bajo dos tenants distintos. La identidad física completa de una
sucursal es `(tenant_id, branch_id)`.
