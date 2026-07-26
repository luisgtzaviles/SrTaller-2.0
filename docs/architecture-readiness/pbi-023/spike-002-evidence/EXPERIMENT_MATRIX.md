# Matriz de experimentos

Todos los casos se ejecutaron en run-1 y run-2. Cada expectativa se evaluó
mediante assertions; una omisión o desviación hacía terminar el harness con
exit code distinto de cero.

| ID | Resultado | Evidencia material |
|---|---|---|
| E1 | PASS | ESM/NodeNext compiló; imports exactos, conexión, query y cierre de pool pasaron |
| E2 | PASS | configuración faltante/vacía/inválida falló antes de uso; PostgreSQL devolvió `28P01` y `3D000`; SSL incompatible y endpoint inalcanzable fallaron con timeout finito |
| E3 | PASS | `FileMigrationProvider` aplicó `001`, `002`, `003` en orden; journal/status correctos; segundo latest no-op; down/reapply seguro |
| E4 | PASS | la migración intencionalmente fallida revirtió objeto y journal; operación no transaccional fue rechazada con `25001` |
| E5 | PASS | dos migradores concurrentes se serializaron; sólo uno aplicó; waiter expiró con `57014`; lock liberado tras cierre normal y por error |
| E6 | PASS | CRUD y joins tenant-scoped preservaron dos filas finales por tenant |
| E7 | PASS | referencia válida pasó; insert/update cross-tenant fallaron con `23503`; FK compuesta impuso ownership |
| E8 | PASS | contexto ausente, vacío o inválido fue denegado; señuelos y IDs ambiguos no cruzaron tenant |
| E9 | PASS | update/delete cross-tenant afectaron cero; upsert falló; transacción mixta revirtió todo |
| E10 | PASS | clave duplicada concurrente produjo un éxito y `23505`; se observó `read committed`, se reprodujo lost update y CAS evitó la segunda escritura |
| E11 | PASS | pool límite `2`, reutilización y timeout de tercer checkout pasaron; error `42P01` no filtró cliente; cierre terminó con cero conexiones/waiters |
| E12 | PASS | harness cerró recursos y el controlador externo verificó cero contenedores, volúmenes, redes, puertos y archivos efímeros |

## Migraciones experimentales

El orden observado en ambos runs fue:

1. `001_tenancy_create_tenants`
2. `002_stations_create_branches`
3. `003_stations_add_tenant_constraints`

Además se usaron una migración de fallo intencional y una migración de lock.
Ninguna fue copiada al árbol productivo.

## Constraints observadas

- `branches_pk`;
- `branch_items_branch_fk`.

La FK compuesta demostró que el schema, no sólo un filtro de aplicación,
rechaza referencias de branch entre tenants.

## Conclusión

La hipótesis queda confirmada para el patrón candidato: contexto obligatorio,
queries scopeadas y constraints compuestas pueden impedir acceso y referencias
cross-tenant sin RLS. La materialización productiva sigue sujeta al checker,
ownership, configuración, roles, CI y gates de implementación.
