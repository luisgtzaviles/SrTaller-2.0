# Introspección PostgreSQL

La prueba no se limita a ausencia de excepción. Compara el contrato esperado
contra:

- `information_schema.columns`: columnas, orden, UDT, nullability y defaults;
- `pg_constraint`: PK, FK, `NOT NULL` y acciones referenciales;
- `pg_indexes`: nombres y definiciones;
- `pg_class`: tablas e índices físicos;
- `pg_attribute`: orden, tipo y `attnotnull`;
- `pg_namespace`: schema `public`.

Resultado: tablas, cinco columnas, ocho constraints visibles en PostgreSQL
18.4 y dos índices coinciden exactamente. No aparecieron secuencias,
extensiones, tablas o índices adicionales.

Los resultados persistidos en este expediente son sólo resúmenes estructurales
sanitizados; no contienen credenciales, rutas locales ni datos de negocio.
