# Claves y constraints

## Catálogo esperado

| Constraint | Tipo | Definición |
| --- | --- | --- |
| `tenants_pk` | PK | `PRIMARY KEY (tenant_id)` |
| `branches_pk` | PK | `PRIMARY KEY (tenant_id, branch_id)` |
| `branches_tenant_fk` | FK | `tenant_id → tenants.tenant_id`, update/delete `RESTRICT` |

PostgreSQL 18.4 representa además cada `NOT NULL` en `pg_constraint` con
`contype = n`; la introspección confirmó cinco constraints no nulos.

## Resultados negativos

| Caso | Resultado |
| --- | --- |
| branch con tenant inexistente | rechazado, `23503` |
| mover branch a tenant inexistente | rechazado, `23503` |
| eliminar tenant referenciado | rechazado, `23001` (`RESTRICT`) |
| tenant o branch nulo | rechazado, `23502` |
| duplicar `(tenant_id, branch_id)` | rechazado, `23505` |

No hay `CASCADE`, claves globales de branch ni constraints fuera del contrato.
