# Enforcement arquitectónico

## Reglas nuevas

| Regla | Obligación |
| --- | --- |
| D5-R050 | sólo `tenants` y `branches`, columnas/tipos/nullability exactos |
| D5-R051 | PK tenant, PK tenant+branch y FK restrictiva |
| D5-R052 | cero DML, seed o SQL raw |
| D5-R053 | down branches→tenants y sin `CASCADE` |

El checker usa AST TypeScript y cadenas de llamadas Kysely; no depende de grep.
La cobertura incluye PASS exacto, tabla extra, FK no restrictiva, alias DML,
namespace raw SQL, shadowing local, comentarios/strings, cascade y una
mutación aislada por regla. La neutralización sólo existe en fixtures.

## Fronteras preservadas

- root productivo central único;
- owner de filename válido;
- migración no consumida desde módulos ni startup;
- objetos registrados a `tenancy`/`stations`;
- migration runner sólo materializa schema;
- cero repository, adapter, port o seed.

Cobertura vigente: 44 reglas directas, 160 fixtures, 40 mutaciones de producto
y 68 contratos semánticos críticos únicos.
