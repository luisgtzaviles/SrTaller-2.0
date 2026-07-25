# Auditoría del resolvedor AST

## Resultado

El resolvedor central existente se reutilizó y amplió. No se instalaron los
paquetes de fixtures: TypeScript puede parsear specifiers y procedencia sin
resolverlos en `node_modules`.

| Forma | Estado |
| --- | --- |
| import declaration/value/type-only | soportada |
| default/named alias/namespace | soportada |
| `import = require()` | agregada y probada |
| `require()` literal | agregada a procedencia namespace; probada |
| `import()` literal | specifier detectado |
| direct reexport/export star | specifier detectado |
| property access/qualified name | procedencia resuelta |
| generic type/type alias local | driver detectado |
| wrappers transparentes | soportados iterativamente |
| shadowing de valor | respetado |
| local homonym/wrong package | ignorado |
| comentario/string | ignorado |

## Defectos corregidos

1. El resolvedor sólo registraba named/namespace imports; ahora registra
   default, `import =` y namespace obtenido de `require`.
2. `collectModuleSpecifiers` no incluía `import = require()`; ahora lo incluye.
3. Los bindings de executor tipado distinguen la declaración léxica efectiva,
   evitando confundir un parámetro local homónimo.
4. El scope tenant no se acepta por nombre: su declaración debe contener los
   campos `readonly` registrados con tipo `string`.

## SQL

D5-R046 no busca palabras SQL. Sólo reconoce:

- tag cuya procedencia es `kysely.sql`;
- `.raw()` cuyo receiver tiene esa procedencia;
- `.query()` con argumento literal sobre un binding cuyo tipo/procedencia es
  un executor Kysely/pg registrado.

Por eso mensajes, documentación, comentarios, strings no ejecutadas, packages
ajenos y objetos locales `query()` permanecen fuera del diagnóstico.

## Límite fail-closed

Una sintaxis de ejecución DB calculada no reconocida no queda autorizada:
debe detener la revisión e incorporar fixture/regla antes de materializarla.
