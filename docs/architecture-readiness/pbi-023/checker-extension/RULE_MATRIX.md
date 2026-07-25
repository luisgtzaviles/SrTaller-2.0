# Matriz de reglas D5-R037–D5-R047

| ID | Título | Criterio ejecutable | Permitido | Prohibido | Excepción | Mutación |
| --- | --- | --- | --- | --- | --- | --- |
| D5-R037 | DB dependencies only in registered infrastructure | Specifier de `kysely`, `pg` o prefijo `pg-` exige root exacto | facility central y adapters owner-scoped registrados | domain, application, presentation, shared o path no registrado | ninguna implícita | `mutation:D5-R037:persistence-boundary` |
| D5-R038 | No global DB capability | Export de facility no puede ser `db`, `database`, `pool`, `client`, `query`, `executeQuery` o `kysely` | factory exacta registrada | singleton/query builder público ordinario | factory con API y consumer exactos | `mutation:D5-R038:persistence-boundary` |
| D5-R039 | No generic repository | Declaración genérica no puede combinar capacidades CRUD cross-entity ni tabla arbitraria | repository específico del owner | `Generic/Base/Crud/Repository<T>` equivalente | ninguna compartida | `mutation:D5-R039:persistence-boundary` |
| D5-R040 | Inner layers do not import DB infrastructure | Target local resuelto hacia DB/migration root falla desde domain/application | port puro | import/reexport/barrel de facility | ninguna | `mutation:D5-R040:persistence-boundary` |
| D5-R041 | Adapter owner/port/composition | Path debe coincidir con registry, módulo owner, port y consumer de composición | dos adapters futuros exactos | huérfano, compartido, sin port o sin composición | registrar antes de crear | `mutation:D5-R041:persistence-boundary` |
| D5-R042 | Central owner-named migrations | Root central y regex UTC lexicográfica con owner | `YYYYMMDDHHMMSS_owner_description.ts` | migration por módulo, nombre libre, import desde startup/domain/controller | runner central registrado | `mutation:D5-R042:persistence-boundary` |
| D5-R043 | Ports do not leak drivers | Procedencia AST de tipos/reexports no puede alcanzar Kysely/pg/DB infra | tipos del módulo y scopes | `Kysely`, `Transaction`, `Pool*`, `QueryResult*` equivalentes | ninguna | `mutation:D5-R043:persistence-boundary` |
| D5-R044 | Structural tenant scope required | Cada método exige un scope allowlisted no optional, nullable ni defaulted | `TenantPersistenceScope`, `TenantBranchPersistenceScope` según port | tenant implícito, string nominal, branch-only | sólo scope registrado | `mutation:D5-R044:persistence-boundary` |
| D5-R045 | Registered facility API and consumer | Archivo DB exige owner, exports exactos y consumer materializado | cinco facilities futuras registradas | path/API/runner/placeholder desconocido o sin consumidor | ninguna automática | `mutation:D5-R045:persistence-boundary` |
| D5-R046 | Raw SQL only in authorized migration | Procedencia de `kysely.sql`, `.raw` o `query()` sobre executor tipado | migración central con nombre válido | tagged/raw/query fuera de migrations | sólo migration root | `mutation:D5-R046:persistence-boundary` |
| D5-R047 | Database object belongs to adapter owner | Operación Kysely tipada exige objeto registrado y mismo owner | `tenants`→tenancy, `branches`→stations | tabla ajena, desconocida o calculada | ninguna | `mutation:D5-R047:persistence-boundary` |

Todos los diagnósticos son distintos. Los fixtures mínimos evitan duplicar
reglas por la misma causa; las fronteras generales DEC-005 continúan aplicando
cuando la violación es realmente independiente.
