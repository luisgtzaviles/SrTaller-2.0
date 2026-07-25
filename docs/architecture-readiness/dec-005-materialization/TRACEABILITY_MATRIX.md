# Matriz autoritativa de trazabilidad D5

Esta matriz relaciona las 36 reglas de DEC-005 con su mecanismo real después
de la remediación de PBI-022. `PASS técnico` describe la clase de evidencia de
cada fila. La
[sexta reverificación formal independiente](FORMAL_VERIFICATION_6.md) confirmó
la matriz, DEC005-C01 a DEC005-C05 y el resultado global en `PASS`; DEC-005
queda `Accepted — Materialized / Formally Verified`.

La clasificación ejecutable se mantiene en
`architecture/dec-005-policy.json`. El fixture positivo común es el árbol base
permitido. Los nombres de fixtures y mutaciones corresponden literalmente a
los casos automatizados.

| Regla | Naturaleza | Política | Detector | Diagnóstico | Fixture positivo | Fixture negativo | Mutación | Resultado | Limitación |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D5-R001 | Ejecutable externo | Manifest y DEC-004 | `verify:structure` | Propio de DEC-004 | Árbol base | No aplica — pertenece al verificador de estructura DEC-004 | No aplica — contrato externo | PASS técnico | Un artefacto se valida fuera del checker D5 |
| D5-R002 | Ejecutable | `allowedModules` | Directorios directos bajo `src/modules` | `module … is not authorized` | Árbol base | `unauthorized module` | No aplica — fixture aislado suficiente | PASS técnico | La allowlist sólo cubre la materialización autorizada |
| D5-R003 | Ejecutable | `governedRoots`, `requiredStructuralFiles` | Contenido estructural, AST y directorios gobernados | Diagnósticos propios de archivo/directorio vacío, ausente o inválido | Árbol base y directorio vacío fuera del root gobernado | Módulo/archivo/barrel vacío, whitespace, comentarios, declaración incorrecta, directorio/leaf/chain/hidden/temp vacío | `empty required structural file`; `empty governed directory` | PASS técnico | Sólo `src/modules` es root gobernado para directorios vacíos |
| D5-R004 | Ejecutable | `publicSurfaces`, `requiredStructuralFiles` | AST de exports y `index.ts` | Superficie ausente, símbolo faltante o reexport interno | Árbol base; export framework-free | `missing public surface`; `required public symbol missing`; `invalid public re-export` | No aplica — fixture aislado suficiente | PASS técnico | Contratos actuales son marcadores type-only |
| D5-R005 | Ejecutable | Grafo y superficie pública | Resolución AST de imports locales | `deep-imports` | Árbol base | `deep inter-module import` | `boundary/deep import` | PASS técnico | No resuelve aliases/loaders no autorizados |
| D5-R006 | Ejecutable | `dependencies` | Edge observado contra grafo | `outside the approved graph` | Árbol base | `inverse dependency`; `dependency outside the graph` | No aplica — D5-R007 muta el grafo relacionado | PASS técnico | Imports calculados no se modelan |
| D5-R007 | Ejecutable | `dependencies` | DFS del grafo local | `dependency cycle detected` | Árbol base | `inter-module cycle` | `inter-module dependency cycle` | PASS técnico | Sólo dependencias observables por imports autorizados |
| D5-R008 | Ejecutable | Capas DEC-005 | Origen/target resuelto | `domain import crosses` | Árbol base | `domain imports application` | No aplica — fixture aislado suficiente | PASS técnico | Revisión humana conserva semántica de dominio |
| D5-R009 | Ejecutable | Capas DEC-005 | Origen/target y paquetes de persistencia | `outer layer` | Árbol base | `application imports infrastructure` | No aplica — fixture aislado suficiente | PASS técnico | DEC-049 sigue gobernando persistencia real |
| D5-R010 | Ejecutable | Capas DEC-005 | Imports AST `@nestjs/*` | `forbidden in domain/application` | Árbol base | `NestJS in domain`; `NestJS in application` | `framework boundary` | PASS técnico | No infiere dependencias por reflexión |
| D5-R011 | Ejecutable | Capas DEC-005 | Target/path/package de persistencia | `presentation cannot access` | Árbol base | `presentation imports repository` | No aplica — fixture aislado suficiente | PASS técnico | Sin controllers reales en este PBI |
| D5-R012 | Ejecutable | Paths de ports | Path normalizado | `ports must live` | Árbol base | `port outside application` | No aplica — fixture aislado suficiente | PASS técnico | No decide el contenido futuro de ports |
| D5-R013 | Ejecutable | Paths de adapters | Capa y nombre de archivo | `adapters cannot live` | Árbol base | `adapter in domain` | No aplica — fixture aislado suficiente | PASS técnico | Convención conservadora de nombre/path |
| D5-R014 | Ejecutable | Ownership intermodular | Target internal/infra/adapter/repository | `accesses … internals` | Árbol base | `internal access across modules` | No aplica — fixture aislado suficiente | PASS técnico | Ownership físico de datos sigue en DEC-049 |
| D5-R015 | Ejecutable | Paths de DTO | Sufijo DTO y capa | `HTTP DTOs must remain` | Árbol base | `HTTP DTO outside presentation` | No aplica — fixture aislado suficiente | PASS técnico | Convención de archivo, no semántica del DTO |
| D5-R016 | Ejecutable | `publicSurfaces` | Imports NestJS desde `index.ts` | `public contract imports NestJS` | Export framework-free | `NestJS in public contract` | No aplica — fixture aislado suficiente | PASS técnico | Otras filtraciones semánticas requieren revisión |
| D5-R017 | Documental | Ownership semántico | Revisión humana | No aplica — regla documental | No aplica — no hay eventos | No aplica — regla documental | No aplica — regla documental | PASS por no aplicabilidad | La calidad semántica de hechos no es inferible por AST |
| D5-R018 | Ejecutable | Superficie pública | AST de declaraciones exportadas | `mutable domain shape … cannot be public` | Árbol base | `entity exported from public surface` | No aplica — fixture aislado suficiente | PASS técnico | Inmutabilidad efectiva requiere revisión |
| D5-R019 | Ejecutable | Shared vacío | Contenido de `src/shared` | `shared must remain absent or empty` | Árbol base | `shared content` | `shared admission` | PASS técnico | Cada admisión futura requiere Arquitectura |
| D5-R020 | Ejecutable | `forbiddenGlobalRoots` | Roots directos bajo `src` | `global root … is forbidden` | Árbol base | `forbidden utils/common/helpers/base/core root` | `generic global root` | PASS técnico | Lista explícita, no heurística sobre todo el repo |
| D5-R021 | Documental | Localidad de utilidades | Revisión humana | No aplica — regla documental | No aplica — no hay utilidades | No aplica — regla documental | No aplica — regla documental | PASS por no aplicabilidad | Transversalidad exige evidencia humana |
| D5-R022 | Documental | Ownership de infraestructura | Revisión humana | No aplica — regla documental | No aplica — no hay infraestructura funcional | No aplica — regla documental | No aplica — regla documental | PASS por no aplicabilidad | DEC-049 conserva ownership de persistencia |
| D5-R023 | Ejecutable | `appModuleComposition`, `requiredStructuralFiles` | AST de clase, decorador, metadata, arreglo e imports nombrados | Diagnósticos propios de composición | Árbol base con `@Module({ imports: […] })` | Sin decorador; metadata vacía/sin imports; incompleta; desconocida; duplicada; calculada | `AppModule metadata composition removed` | PASS técnico | Composición dinámica se rechaza deliberadamente |
| D5-R024 | Ejecutable | Composition root | Source/target resuelto | `only AppModule may import` | Árbol base | `module composition import outside AppModule` | No aplica — fixture aislado suficiente | PASS técnico | Sólo aplica a módulos Nest autorizados |
| D5-R025 | Ejecutable | Prohibición explícita | Identidad normalizada de `forwardRef`, directa/alias/namespace y wrappers transparentes | `forwardRef is forbidden` | Árbol base; paquetes ajenos/homónimos/shadowing parentetizados | Casos nominales y tres variantes wrapped | Mutaciones nominales y alias wrapped | PASS técnico | Propiedad calculada no autorizada fuera del modelo |
| D5-R026 | Ejecutable | Prohibición explícita | Identidad normalizada de `ModuleRef`, directa/alias/namespace/qualified type | Diagnóstico propio D5-R026 | Árbol base; paquetes ajenos/homónimos | Casos nominales y control parentetizado triple | No aplica — fixtures aislados suficientes | PASS técnico | No infiere service location con vocabulario distinto |
| D5-R027 | Ejecutable | Prohibición explícita | Identidad normalizada del decorador `Global`, directa/alias/namespace | Diagnóstico propio D5-R027 | Árbol base; objetos `global: true`; paquetes ajenos/homónimos/shadowing | Casos nominales y tres variantes wrapped | Alias nominal y namespace wrapped | PASS técnico | Otra configuración global funcional exige vínculo semántico decidido |
| D5-R028 | Documental | Dynamic module restringido | Revisión humana | No aplica — regla documental | No aplica — no hay dynamic modules | No aplica — regla documental | No aplica — regla documental | PASS por no aplicabilidad | Una autorización futura exige registro previo |
| D5-R029 | Ejecutable | Prohibición explícita | Identidad normalizada de `Scope.REQUEST`, directa/alias/namespace | `request scope cannot be operational-context authority` | Árbol base; paquetes ajenos/homónimos/shadowing parentetizados | Casos nominales y tres variantes wrapped | Directo, alias nominal y alias wrapped | PASS técnico | La autoridad semántica adicional sigue bajo revisión |
| D5-R030 | Documental | Casos de uso planos | Revisión humana futura | No aplica — regla documental | No aplica — no hay casos de uso | No aplica — regla documental | No aplica — regla documental | PASS por no aplicabilidad | Se activa cuando exista funcionalidad autorizada |
| D5-R031 | Ejecutable | NodeNext | Imports relativos AST y typecheck | `lacks a NodeNext JavaScript extension` | Árbol base | `NodeNext extension violation` | No aplica — typecheck aporta segunda barrera | PASS técnico | Aliases/loaders no están autorizados |
| D5-R032 | Compuesta | Orden y salidas deterministas | Doble ejecución por fixture y gate repetido | Diferencia de salida falla la suite | Todos los fixtures se ejecutan dos veces | Todos los fixtures negativos se comparan dos veces | Restauración de 23 mutaciones | PASS técnico | Determinismo cubierto para sintaxis conocida |
| D5-R033 | Compuesta | `checkerRules`, `requiredSemanticCoverage` y catálogo | Policy→caso, 26 contratos únicos y clave canónica de tipo/polaridad/regla/diagnóstico/path/snapshot efectivo/configuración | Falla ante ausencia, ID repetido, duplicado semántico con otro ID, neutralización o contrato incompleto; identifica ambos contratos | Árbol real, 12 fixtures positivos y 8 distinciones semánticas explícitas | 27 reglas del checker tienen fixture negativo; 86 negativos; 10 rechazos de equivalencia | 23 mutaciones de producto en 12 reglas/familias + 6 mutaciones semánticas D5-R033 con restauración | PASS técnico | Sólo paths equivalentes y trivia no semántica se normalizan; la revisión independiente sigue validando suficiencia |
| D5-R034 | Documental | Fail-closed sin excepciones | Policy y revisión | No aplica — no existen excepciones | Árbol base | No aplica — no hay excepción autorizada | No aplica — regla documental | PASS por no aplicabilidad | Una excepción futura requiere decisión previa |
| D5-R035 | Ejecutable | Allowlist de PBI-022 | Identidad normalizada de Controller/decoradores HTTP directa/alias/namespace; comportamiento y allowlist | Diagnóstico propio D5-R035 | Árbol base; paquetes ajenos/homónimos/shadowing parentetizados | Controller y endpoint nominales y wrapped; comportamiento funcional | HTTP/Controller nominales, endpoint wrapped y comportamiento | PASS técnico | Prohíbe funcionalidad; no clasifica su corrección de negocio |
| D5-R036 | Ejecutable | `controllerAuthoritySymbols` | Identidad normalizada de Controller y miembros/calls de autoridad | Diagnóstico propio D5-R036 | Árbol base; paquetes ajenos/homónimos/shadowing parentetizados | Controller nominal y wrapped decide autorización | Controller nominal, namespace y alias wrapped | PASS técnico | Detector conservador por símbolos; revisión semántica sigue obligatoria |

## Lectura de cobertura

- Reglas ejecutadas directamente por el checker: 27; todas tienen al menos un
  fixture negativo aislado.
- Regla ejecutable externa: D5-R001, gobernada por `verify:structure`.
- Reglas compuestas: D5-R032 y D5-R033.
- Reglas documentales/no aplicables al árbol sin funcionalidad: seis.
- No queda `Pendiente` en una regla presentada como gate ejecutable.

La separación D5-R035/D5-R036 es intencional: un controller simple activa
D5-R035 sin D5-R036; un controller que intenta decidir autoridad activa el
diagnóstico propio D5-R036 además de D5-R035 porque cualquier controller sigue
fuera del alcance de PBI-022.
