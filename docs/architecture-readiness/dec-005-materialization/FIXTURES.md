# Fixtures y mutaciones del checker

## Aislamiento

Los casos se declaran en `test/architecture-fixtures.mjs` y se escriben en un
directorio temporal único por prueba. El código de producto no se muta. Cada
caso corre dos veces y compara exit code, stdout y stderr.

## Matriz de fixtures

| Caso | Tipo | Regla esperada | Exit esperado |
| --- | --- | --- | --- |
| Grafo permitido por índices públicos | Positivo | Ninguna | `0` |
| Export framework-free directo | Positivo | Ninguna | `0` |
| Directorio vacío fuera de roots gobernados | Positivo | Ninguna | `0` |
| Símbolos Nest-like desde otro paquete | Positivo | Ninguna | `0` |
| Homónimos Nest locales | Positivo | Ninguna | `0` |
| Símbolos Nest en comentarios y strings | Positivo | Ninguna | `0` |
| Imports nombrados Nest ocultos por parámetros | Positivo | Ninguna | `0` |
| Namespace Nest oculto por parámetro | Positivo | Ninguna | `0` |
| Módulo no autorizado | Negativo | D5-R002 | `1` |
| Deep import intermodular | Negativo | D5-R005 | `1` |
| Acceso a internal ajeno | Negativo | D5-R014 | `1` |
| Dependencia inversa | Negativo | D5-R006 | `1` |
| Dependencia fuera del grafo | Negativo | D5-R006 | `1` |
| Ciclo intermodular | Negativo | D5-R007 | `1` |
| NestJS en dominio | Negativo | D5-R010 | `1` |
| NestJS en aplicación | Negativo | D5-R010 | `1` |
| NestJS en contrato público | Negativo | D5-R016 | `1` |
| `forwardRef` | Negativo | D5-R025 | `1` |
| Alias de `forwardRef` | Negativo | D5-R025 | `1` |
| Namespace de `forwardRef` | Negativo | D5-R025 | `1` |
| `ModuleRef` | Negativo | D5-R026 | `1` |
| Alias de `ModuleRef` | Negativo | D5-R026 | `1` |
| Namespace de `ModuleRef` | Negativo | D5-R026 | `1` |
| Módulo funcional global | Negativo | D5-R027 | `1` |
| Módulo funcional global mediante alias | Negativo | D5-R027 | `1` |
| Módulo funcional global mediante namespace | Negativo | D5-R027 | `1` |
| Root global `utils` | Negativo | D5-R020 | `1` |
| Root global `common` | Negativo | D5-R020 | `1` |
| Root global `helpers` | Negativo | D5-R020 | `1` |
| Root global `base` | Negativo | D5-R020 | `1` |
| Root global `core` | Negativo | D5-R020 | `1` |
| Módulo vacío anticipatorio | Negativo | D5-R003 | `1` |
| Superficie pública ausente | Negativo | D5-R004 | `1` |
| Reexport público interno | Negativo | D5-R004 | `1` |
| Controller no autorizado | Negativo | D5-R035 | `1` |
| Controller no autorizado mediante alias | Negativo | D5-R035 | `1` |
| Controller no autorizado mediante namespace | Negativo | D5-R035 | `1` |
| Endpoint no autorizado | Negativo | D5-R035 | `1` |
| Endpoint no autorizado mediante alias | Negativo | D5-R035 | `1` |
| Endpoint no autorizado mediante namespace | Negativo | D5-R035 | `1` |
| Contenido en `shared` | Negativo | D5-R019 | `1` |
| Dominio importa aplicación | Negativo | D5-R008 | `1` |
| Aplicación importa infraestructura | Negativo | D5-R009 | `1` |
| Módulo Nest importado fuera de AppModule | Negativo | D5-R024 | `1` |
| Comportamiento funcional | Negativo | D5-R035 | `1` |
| Import relativo sin extensión NodeNext | Negativo | D5-R031 | `1` |
| Port fuera de aplicación | Negativo | D5-R012 | `1` |
| Adapter en dominio | Negativo | D5-R013 | `1` |
| DTO HTTP fuera de presentación | Negativo | D5-R015 | `1` |
| Entidad exportada públicamente | Negativo | D5-R018 | `1` |
| Presentación importa repository | Negativo | D5-R011 | `1` |
| Archivo de módulo requerido vacío | Negativo | D5-R003 | `1` |
| Archivo de módulo requerido con whitespace | Negativo | D5-R003 | `1` |
| Archivo de módulo requerido sólo con comentarios | Negativo | D5-R003 | `1` |
| Barrel público requerido vacío | Negativo | D5-R003 | `1` |
| Símbolo público requerido ausente | Negativo | D5-R004 | `1` |
| Declaración de módulo requerida incorrecta | Negativo | D5-R003 | `1` |
| Directorio interno vacío | Negativo | D5-R003 | `1` |
| Subdirectorio interno vacío | Negativo | D5-R003 | `1` |
| Módulo adicional vacío | Negativo | D5-R003 | `1` |
| Cadena de directorios con leaf vacío | Negativo | D5-R003 | `1` |
| Directorio sólo con archivos ocultos | Negativo | D5-R003 | `1` |
| Directorio sólo con archivos temporales | Negativo | D5-R003 | `1` |
| Imports TypeScript en AppModule sin `@Module` | Negativo | D5-R023 | `1` |
| `@Module({})` en AppModule | Negativo | D5-R023 | `1` |
| Metadata de AppModule sin `imports` | Negativo | D5-R023 | `1` |
| Composición incompleta de AppModule | Negativo | D5-R023 | `1` |
| Módulo desconocido en AppModule | Negativo | D5-R023 | `1` |
| Módulo duplicado en AppModule | Negativo | D5-R023 | `1` |
| Composición calculada/no estática | Negativo | D5-R023 | `1` |
| Request scope como autoridad de contexto | Negativo | D5-R029 | `1` |
| Alias de request scope como autoridad | Negativo | D5-R029 | `1` |
| Namespace de request scope como autoridad | Negativo | D5-R029 | `1` |
| Controller decide autorización final | Negativo | D5-R035 y D5-R036 | `1` |
| Alias de Controller decide autorización final | Negativo | D5-R035 y D5-R036 | `1` |
| Namespace de Controller decide autorización final | Negativo | D5-R035 y D5-R036 | `1` |
| `forwardRef` directo parentetizado | Negativo | D5-R025 | `1` |
| Alias de `forwardRef` con wrappers anidados | Negativo | D5-R025 | `1` |
| Namespace de `forwardRef` con type assertion | Negativo | D5-R025 | `1` |
| `Global` directo parentetizado | Negativo | D5-R027 | `1` |
| Alias de `Global` con non-null | Negativo | D5-R027 | `1` |
| Namespace de `Global` con type assertion | Negativo | D5-R027 | `1` |
| `Scope.REQUEST` directo parentetizado | Negativo | D5-R029 | `1` |
| Alias de `Scope.REQUEST` con `satisfies` | Negativo | D5-R029 | `1` |
| Namespace de `Scope.REQUEST` parentetizado | Negativo | D5-R029 | `1` |
| Controller directo parentetizado | Negativo | D5-R035 | `1` |
| Alias de Controller con type assertion | Negativo | D5-R035 | `1` |
| Namespace de Controller con type assertion | Negativo | D5-R035 | `1` |
| Endpoint directo parentetizado | Negativo | D5-R035 | `1` |
| Alias de endpoint con non-null | Negativo | D5-R035 | `1` |
| Namespace de endpoint parentetizado | Negativo | D5-R035 | `1` |
| Controller wrapped decide autorización | Negativo | D5-R035 y D5-R036 | `1` |
| `ModuleRef` directo/alias/namespace parentetizado | Negativo | D5-R026 | `1` |
| Objetos ordinarios con `global: true` | Positivo | Ninguna | `0` |
| Símbolos Nest-like parentetizados de otro package | Positivo | Ninguna | `0` |
| Imports Nest parentetizados y shadowed | Positivo | Ninguna | `0` |
| Homónimos/texto parentetizados | Positivo | Ninguna | `0` |

## Mutaciones controladas

Cada mutación parte de una copia temporal del `src/` real, introduce una
violación, exige exit `1`, retira la mutación y exige exit `0`.

| Familia | Mutación | Regla observada | Restauración |
| --- | --- | --- | --- |
| Superficie/frontera | Deep import | D5-R005 | PASS |
| Grafo | Ciclo intermodular | D5-R007 | PASS |
| Framework | NestJS en dominio | D5-R010 | PASS |
| Composición | `forwardRef` | D5-R025 | PASS |
| Composición | Alias de `forwardRef` | D5-R025 | PASS |
| Composición | Alias de `Global` | D5-R027 | PASS |
| Roots | `src/utils/` | D5-R020 | PASS |
| Shared | Contenido no admitido | D5-R019 | PASS |
| Transporte | Controller | D5-R035 | PASS |
| Transporte | Alias de Controller | D5-R035 | PASS |
| Alcance | Comportamiento de reparación | D5-R035 | PASS |
| Estructura | Archivo estructural requerido vacío | D5-R003 | PASS |
| Estructura | Directorio gobernado vacío | D5-R003 | PASS |
| Composición | Metadata real de `AppModule` retirada | D5-R023 | PASS |
| Contexto | `Scope.REQUEST` como autoridad | D5-R029 | PASS |
| Contexto | Alias de `Scope.REQUEST` como autoridad | D5-R029 | PASS |
| Autoridad | Controller decide autorización final | D5-R036 | PASS |
| Autoridad | Namespace Controller decide autorización final | D5-R035 y D5-R036 | PASS |
| Composición | Alias de `forwardRef` con wrappers | D5-R025 | PASS |
| Composición | Namespace de `Global` parentetizado | D5-R027 | PASS |
| Contexto | Alias de `Scope.REQUEST` con `satisfies` | D5-R029 | PASS |
| Transporte | Endpoint aliased con non-null | D5-R035 | PASS |
| Autoridad | Controller aliased wrapped decide autorización | D5-R035 y D5-R036 | PASS |

## Mutaciones semánticas D5-R033

Estas seis mutaciones operan sobre contratos en memoria, exigen el rechazo del
duplicado y restauran la estructura original comprobando su SHA-256. Son
guardas del arnés D5-R033, no nuevas familias normativas del checker de
producto.

| Propiedad protegida | Mutación | Resultado | Restauración |
| --- | --- | --- | --- |
| ID no define identidad | Duplicado con ID distinto | Rechazado | SHA original |
| Descripción no define identidad | Duplicado con ID y descripción distintos | Rechazado | SHA original |
| Conteo no compensa cobertura | Retirar caso útil y agregar duplicado | Rechazado | SHA original |
| Orden no define identidad | Reordenar propiedades | Rechazado | SHA original |
| Evidencia descriptiva no neutraliza | Cambiar ID y fragmentos declarativos | Rechazado | SHA original |
| Campos materiales permanecen en la clave | Retirar la única diferencia diagnóstica | Rechazado | SHA original |

La suite añade además cuatro rechazos directos para nombre visible, paths
equivalentes, formato no semántico del source y posición del arreglo; y ocho
controles que preservan diferencias reales: directo/alias, alias/namespace,
polaridad, shadowing/package ajeno, wrappers AST, D5-R035/D5-R036, roots y
source ejecutable.

## Extensión PBI-023

`test/architecture-persistence-fixtures.mjs` agrega 36 árboles sintéticos:
cinco positivos y 31 negativos. Cubren D5-R037–D5-R047, imports directos,
default, aliases, namespace, type-only, `import =`, `require`, `import()`,
reexports, barrels, qualified names, type aliases, shadowing, homónimos,
paquetes ajenos, comentarios/strings, scope tenant/branch, migración central,
SQL tipado y ownership físico fail-closed.

`test/architecture-persistence-mutations.test.mjs` agrega once mutaciones
aisladas, una por regla nueva. Para cada una el runner demuestra: árbol
permitido PASS, mutación con exactamente el ID/path esperado, neutralización
de esa regla sólo en fixture sin diagnóstico y restauración a PASS. La API
rechaza neutralización fuera de `fixture: true`.

## Criterio de suficiencia

El baseline histórico PBI-022 conserva 98 fixtures (12 positivos y 86
negativos). El estado vigente es **134 fixtures: 17 positivos y 117
negativos**. Cubren las 38 reglas ejecutadas directamente por el checker;
D5-R001 pertenece al verificador
externo de DEC-004, D5-R032/D5-R033 son compuestas y seis reglas son
documentales/no aplicables al árbol sin funcionalidad.

Las 23 mutaciones históricas cubren 12 familias normativas distintas: D5-R003, D5-R005,
D5-R007, D5-R010, D5-R019, D5-R020, D5-R023, D5-R025, D5-R027, D5-R029,
D5-R035 y D5-R036. Cada una exige el conjunto exacto de reglas y paths
permitidos, restaura la copia temporal y vuelve a exigir PASS; no son búsquedas
de texto que omitan la ejecución del checker. PBI-023 suma 11 familias
D5-R037–D5-R047; el total vigente es **34 mutaciones de producto**.

Además, 49 IDs de `requiredSemanticCoverage` fijan las variantes críticas
directas, alias, namespace, wrappers, controles positivos y cinco mutaciones.
La suite falla si un ID desaparece, se duplica, pierde su fragmento de source,
su regla o su path, y también si dos IDs corresponden a la misma ejecución
canónica. Los 26 históricos y los 23 agregados por PBI-023 resultaron únicos.
Los fixtures con varios diagnósticos declaran y validan el
conjunto completo de paths, no sólo uno de ellos.

Las seis guardas semánticas históricas prueban el contrato compuesto D5-R033 y
no inventan una familia de arquitectura adicional para inflar ese conteo.
