# Evidencia de schema

## `stations`

Clave primaria compuesta `(tenant_id, station_id)`, FK restrictiva a Tenant,
estado limitado a `Unlinked|Active|Revoked`, revisión positiva y coherencia
entre `status` y `revoked_at`.

## `station_bindings`

Clave primaria `(tenant_id, station_id, binding_revision)`, FK compuesta
restrictiva a Station, FK compuesta restrictiva a Branch, revisión positiva e
intervalo temporal válido.

El índice parcial único `station_bindings_one_open_uq` impide más de un
binding abierto por tenant/station. El índice `(tenant_id, branch_id)` sirve
las consultas owner-scoped.

La introspección real encontró 13 columnas y ambas tablas. No se creó RLS.
