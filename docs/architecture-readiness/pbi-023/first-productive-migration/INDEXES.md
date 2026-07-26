# Índices

La introspección encontró únicamente:

1. `tenants_pk` sobre `(tenant_id)`;
2. `branches_pk` sobre `(tenant_id, branch_id)`.

No se agrega un índice redundante sobre `branches.tenant_id`: la PK compuesta
ya inicia por `tenant_id`. Con 48 tenants y 2,304 branches sintéticas, `EXPLAIN
(FORMAT JSON)` confirmó uso de `branches_pk` para búsqueda por tenant y por
`(tenant_id, branch_id)`.

No se realizó benchmark ni se añadió optimización especulativa. Un índice
adicional exige una consulta real medida en un PBI posterior.
