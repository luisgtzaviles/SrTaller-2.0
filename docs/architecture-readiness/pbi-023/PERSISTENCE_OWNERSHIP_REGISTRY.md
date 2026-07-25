# Registry propuesto de ownership de persistencia

## Estado

- **Estado:** registrada en policy y enforced por fixtures; paths productivos
  no materializados.
- **Autoridad:** DEC-049.
- **Gate:** DEC049-C02.
- **Co-ownership:** prohibido.

La representación machine-readable vigente está en
`architecture/dec-005-policy.json` bajo `persistence`. D5-R041, D5-R044,
D5-R045 y D5-R047 fallan cerrado ante owner, scope, API, consumer u objeto no
registrado.

## Objetos

| Objeto | Owner único | Scope | Escrituras | Lecturas | Invariantes | Evolución |
|---|---|---|---|---|---|---|
| `tenants` | `tenancy` | global SaaS; raíz de tenant | sólo adapter tenancy; alta técnica PBI-023 | tenancy; referencias por FK | ID no nulo; no se usa como autorización; sin delete en PBI-023 | migraciones owner `tenancy` |
| `branches` | `stations` | tenant + sucursal | sólo adapter stations; tenant inmutable | stations con tenant + branch | pertenece a un tenant; identidad compuesta; sin acceso por branch aislada | migraciones owner `stations` |
| `kysely_migration` | facility database | técnico global | sólo migrador core | runner/status | journal no manipulable por app | DEC-050 |
| `kysely_migration_lock` | facility database | técnico global | sólo migrador core | migrador | exclusión del migrador | DEC-050 |

## Accesos

- `tenancy` no accede físicamente a `branches`.
- `stations` puede depender del contrato público de tenancy, pero su FK no
  autoriza lectura arbitraria de la tabla owner.
- La migración central puede crear objetos de distintos owners sólo con un
  archivo y review que declare el owner correspondiente.
- Tests no convierten acceso directo en API productiva.
- No existe `BaseRepository`, CRUD genérico ni query global ordinaria.

## Scope de repositorios

| Puerto | Scope obligatorio | Métodos iniciales permitidos |
|---|---|---|
| tenant repository | `tenantId` explícito para operación tenant | sólo los necesarios por la prueba/consumidor real |
| branch repository | `tenantId` + `branchId` cuando es individual; `tenantId` para lista tenant-wide explícita | sólo los necesarios por la prueba/consumidor real |

No se anticipan firmas completas hasta que el adapter y su prueba se creen en
el mismo paso.

## Constraints físicas previstas

- `tenants`: PK por tenant.
- `branches`: PK compuesta tenant + branch; FK al tenant.
- futuras referencias branch-scoped: FK compuesta tenant + branch.
- futuras claves naturales tenant-scoped: UK con tenant.
- índices: comienzan por tenant cuando la query medida lo requiere.

## Cambios al registry

Agregar tabla, vista, secuencia, función, índice especial o acceso cross-module
requiere:

1. owner único;
2. scope;
3. invariantes;
4. consumidores;
5. migración owner;
6. actualización de tests/constraints/checker;
7. revisión DEC-049.
