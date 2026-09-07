# Reglas de arquitectura materializadas

## Política ejecutable

La fuente legible por máquina es
`architecture/dec-005-policy.json`. El checker analiza archivos TypeScript y
JavaScript bajo `src/`, compara los módulos y edges contra esa política y
emite diagnósticos ordenados con el ID normativo D5 correspondiente.

## Catálogo D5-R001 a D5-R053

| ID | Nivel | Norma | Motivo | Detección actual | Severidad | Excepción y autoridad |
| --- | --- | --- | --- | --- | --- | --- |
| D5-R001 | MUST | Una app y un artefacto en R0 | Cumplir ADR-002/009 | Manifest, ausencia de workspace y verificador DEC-004 | Blocker | No; requiere nueva decisión de Arquitectura |
| D5-R002 | MUST | Cada módulo representa responsabilidad durable con owner | Evitar módulos por pantalla/archivo | Allowlist, policy y `OWNERSHIP.md` | Blocker | No; Arquitectura decide fronteras |
| D5-R003 | MUST NOT | Crear módulo, archivo estructural o directorio gobernado vacío/futuro | Evitar sobrearquitectura y falsos PASS | `governedRoots`, contenido efectivo, AST de declaraciones y allowlist | Blocker | No |
| D5-R004 | MUST | API funcional sólo por `index.ts` | Proteger internals | Superficie obligatoria, exports exactos y reexports | Blocker | No |
| D5-R005 | MUST NOT | Import profundo a otro módulo | Preservar encapsulación | Resolución AST del specifier al target | Blocker | No |
| D5-R006 | MUST | Toda dependencia consta en el grafo | Hacer visible el acoplamiento | Comparación de edges observados/policy | Blocker | No; Arquitectura aprueba primero el grafo |
| D5-R007 | MUST | Grafo acíclico | Evitar coordinación recíproca | DFS sobre imports locales, incluido ciclo intermodular | Blocker | No |
| D5-R008 | MUST | Dominio depende sólo de sí mismo/shared admitido | Aislar reglas | Capa origen y target resuelto | Blocker | No |
| D5-R009 | MUST NOT | Aplicación importa presentación/infraestructura | Inversión de dependencias | Capa target y paquetes SQL/ORM | Blocker | No |
| D5-R010 | MUST NOT | NestJS en dominio/aplicación | Cumplir ADR-005 | Imports `@nestjs/*` por capa | Blocker | No; requiere nueva decisión de Arquitectura |
| D5-R011 | MUST NOT | Controller/presentación accede a SQL, repository o adapter | Transporte delgado | Paths y packages de persistencia | Blocker | No |
| D5-R012 | MUST | Puertos viven hacia adentro | Mantener adapters reemplazables | Path `application/ports` | Major | No; cambio exige Arquitectura |
| D5-R013 | MUST | Adapters fuera de dominio/aplicación | Evitar inversión incorrecta | Path/nombre de adapter | Blocker | No |
| D5-R014 | MUST NOT | Acceso a tabla/repository/adapter de otro módulo | Preservar ownership | Target intermodular internal/infra/adapter/repository | Blocker | No; DEC-049 conserva datos |
| D5-R015 | MUST | DTO HTTP permanece en presentación | Evitar filtración de transporte | Sufijo `*.dto.*` y capa | Major | No |
| D5-R016 | MUST | Contrato público framework-free | Independencia del módulo | Imports NestJS desde `index.ts` | Blocker | No |
| D5-R017 | MUST | Evento público representa hecho del owner | Evitar comandos encubiertos | Revisión semántica; no hay eventos | Major | Sólo renombrar antes de publicar; owner funcional + Arquitectura |
| D5-R018 | MUST NOT | Exportar entidad/agregado mutable | Evitar autoridad compartida | Export `*Entity`/`*Aggregate` + revisión | Blocker | No |
| D5-R019 | MUST | Shared cumple siete criterios | Evitar depósito común | Contenido de `src/shared/`; admisión por revisión | Blocker | No; Arquitectura admite cada elemento |
| D5-R020 | MUST NOT | Roots `common`, `utils`, `helpers`, `base`, `core` | Evitar bypass de shared | Directorios globales bajo `src/` | Blocker | No |
| D5-R021 | SHOULD | Utilidad permanece local hasta demostrar transversalidad | Reducir abstracción prematura | Revisión; no hay utilidades | Advisory | Sí, documentada por Arquitectura |
| D5-R022 | MUST | Infraestructura de módulo permanece con su owner | Evitar adapters globales | Paths/patrones + revisión de ownership | Major | Facility técnica revisada por Arquitectura |
| D5-R023 | MUST | `AppModule` sólo composition root y compone exactamente los módulos autorizados | Evitar agregado técnico universal y wiring ficticio | AST de clase, `@Module`, metadata, arreglo `imports` e imports nombrados exactos | Blocker | No |
| D5-R024 | MAY restringido | `AppModule` conserva la composición exterior; un módulo sólo puede importar otro `<module>.module.ts` mediante una arista de composición dirigida registrada, estática y exacta | Separar contrato y wiring sin impedir DI explícita entre capacidades aprobadas | Policy v4 + AST de consumer/producer, clases/specifiers exactos, `@Module imports`, tokens/interfaces públicos, provider/export/inject y ausencia de aliases/dynamic/namespace | Blocker | Sólo edge, módulos y bindings aprobados previamente por Arquitectura; no hay excepción implícita |
| D5-R025 | MUST NOT | Usar `forwardRef` en R0 | Exponer ciclos | Identidad AST normalizada de `@nestjs/common.forwardRef` | Blocker | No |
| D5-R026 | MUST NOT | `ModuleRef` resuelve flujos funcionales | Dependencias explícitas | Identidad AST normalizada de `@nestjs/core.ModuleRef` | Blocker | No |
| D5-R027 | MUST NOT | Módulo Nest funcional global | Evitar dependencias invisibles | Identidad AST normalizada del decorador `@nestjs/common.Global` | Blocker | No |
| D5-R028 | MAY restringido | Dynamic module sólo para infraestructura revisada | Limitar magia de composición | Revisión; no hay dynamic modules | Major | Sí, registro previo de Arquitectura |
| D5-R029 | MUST NOT | Request scope es autoridad de contexto | Cumplir ADR-010/011 | Identidad AST normalizada de `@nestjs/common.Scope.REQUEST` + revisión semántica | Blocker | No |
| D5-R030 | SHOULD | Casos de uso TypeScript plano y sin Nest | Testabilidad | No aplicable aún; prueba futura | Major | Justificación de Arquitectura + Ingeniería |
| D5-R031 | MUST | Imports ESM respetan NodeNext | Reproducibilidad | Typecheck y extensión JS explícita | Blocker | No |
| D5-R032 | MUST | Enforcement local determinista/no interactivo | Repetibilidad | Doble corrida por fixture y del gate | Blocker | No |
| D5-R033 | MUST | Toda regla automatizable tiene caso inválido | Evitar checks decorativos | Policy→fixture, ejecución efectiva e identidad canónica comprobadas; el baseline histórico PBI-022 conserva 98/23/6/26 y el estado ejecutable vigente comprende 188 fixtures, 53 mutaciones de producto y 68 contratos críticos únicos | Major | Límite temporal fechado por Arquitectura + Ingeniería |
| D5-R034 | MUST | Excepción registrada antes de merge | Evitar deuda silenciosa | Policy fail-closed; no hay excepciones | Blocker | No |
| D5-R035 | MUST | Toda superficie HTTP funcional requiere autorización posterior a DEC-005, registro exacto, owner único, capa `presentation` y composición explícita en su módulo | Preservar gates H0/H1 sin convertir el shell en un bloqueo permanente | Registry fail-closed, allowlist de source e identidad AST normalizada de Controller/decoradores HTTP | Blocker | Sólo mediante autoridad funcional previa y registro canónico |
| D5-R036 | MUST NOT | Controller decide contexto confiable o autorización final | Cumplir ADR-005/010/012 | Identidad AST normalizada de `@nestjs/common.Controller` y símbolos de autoridad definidos en policy | Blocker | No |
| D5-R037 | MUST | Dependencias DB sólo en roots de infraestructura registrados | Evitar que Kysely/pg atraviesen capas | Specifiers AST estáticos, type-only, reexports, `import =`, `require()` e `import()` contra allowlist cerrada | Blocker | Sólo roots exactos de `persistence.allowedDependencyRoots` |
| D5-R038 | MUST NOT | Exponer capacidad DB global ordinaria | Evitar singleton/query builder importable | Export AST dentro de facility registrada y nombres de capacidad prohibidos | Blocker | Factory exacta registrada con consumidor explícito |
| D5-R039 | MUST NOT | Repository/CRUD genérico transversal | Preservar ownership por agregado | Declaraciones genéricas y conjunto de capacidades; helper arbitrario de tabla | Blocker | Repositorio específico owner-scoped |
| D5-R040 | MUST NOT | Dominio/aplicación importan facility DB o migrations | Preservar inversión de dependencias | Target local resuelto, incluidos barrels/reexports | Blocker | Ninguna |
| D5-R041 | MUST | Adapter coincide con owner, port y composition consumer | Evitar adapters huérfanos/globales | Registry exacto + resolución source/target | Blocker | Ninguna; registrar antes de materializar |
| D5-R042 | MUST | Migraciones sólo en root central, nombre UTC-owner y runner | Evitar migraciones dispersas/startup | Path/naming + imports locales resueltos | Blocker | Runner central registrado |
| D5-R043 | MUST NOT | Port filtra tipos Kysely/pg/DB | Mantener contratos internos independientes | Procedencia AST en imports, aliases, namespace, qualified/generic y reexports | Blocker | Ninguna |
| D5-R044 | MUST | Cada operación persistente exige scope tenant estructural no opcional | Evitar bypass implícito/global | Firma AST, tipo de scope allowlisted, optional/nullable/default rechazados | Blocker | Sólo scopes registrados; sin excepciones silenciosas |
| D5-R045 | MUST | Facility DB tiene owner, API y consumidor registrados | Evitar placeholders/runners desconectados | Registry fail-closed, exports exactos y consumo local resuelto | Blocker | Runner materializado puede diferir consumidor hasta el gate de migraciones declarado |
| D5-R046 | MUST NOT | SQL ejecutable fuera de migración autorizada | Evitar bypass del query builder/ownership | Procedencia de `kysely.sql`, `.raw` y `query()` sobre executor tipado | Blocker | Migración central; probe connection owner-scoped literal `select 1` |
| D5-R047 | MUST | Operación Kysely y toda migración no incluida en el baseline legacy exacto usan exclusivamente objetos DB del owner registrado | Aplicar ownership físico preventivo también a DDL, funciones y triggers sin bypass cronológico | Executor tipado + registry fail-closed; allowlist legacy cerrada y registro exacto owner/tablas/funciones/triggers contrastado contra AST Kysely y SQL estático para cualquier migración nueva, incluso backdated | Blocker | Ninguna |
| D5-R048 | MUST | Frontera transaccional explícita, owner-internal y sin control manual | Evitar transacciones implícitas, nesting silencioso y fuga de executor | Imports/reexports/dynamic imports de async context, target interno resuelto, consumidores prohibidos y métodos manuales | Blocker | Ninguna; savepoints o propagación implícita requieren decisión separada |
| D5-R049 | MUST | Capability y proveedor de migraciones permanecen owner-internal y el runner no se consume desde startup o capas funcionales | Evitar ejecución automática, acceso lateral y bypass del flujo operativo gobernado | Targets locales resueltos contra `migrationBoundary.allowedInternalConsumers` y consumidores prohibidos del runner | Blocker | Ninguna; la composición operativa requiere un gate posterior explícito |
| D5-R050 | MUST | La primera migración crea sólo `tenants` y `branches` con columnas, tipos y nullability exactos | Impedir schema no autorizado en el primer cambio irreversible | AST de cadenas Kysely contra `persistence.initialSchema` | Blocker | Ninguna; ampliar el schema requiere gate posterior |
| D5-R051 | MUST | `branches` conserva PK tenant-scoped y FK restrictiva a `tenants` | Impedir identidad global o sucursal huérfana/cross-tenant | AST de PK/FK, columnas, target y políticas `RESTRICT` | Blocker | Ninguna |
| D5-R052 | MUST NOT | La primera migración contiene DML, seed o SQL raw | Separar estructura de datos y evitar bypass no revisado | AST de operaciones DML y procedencia de `kysely.sql`, incluidos alias/namespace | Blocker | Ninguna |
| D5-R053 | MUST | `down` elimina `branches` antes de `tenants` y no usa `CASCADE` | Reversión explícita, predecible y fail-closed ante dependencias | AST de cadenas `dropTable` y ausencia de `cascade` | Blocker | Ninguna |

## Interpretación vigente de composición dirigida

La policy v4 registra exactamente `access->stations` y `access->users` como
composición runtime dirigida. D5-R024 exige conjuntamente el edge del grafo, el
registro de módulos y specifiers, imports nombrados sin alias, metadata
`@Module` estática, contratos/tokens desde el `index.ts` público y bindings
`provide`/`exports`/`inject` únicos. Un edge presente sólo en `dependencies` no
autoriza importar el archivo Nest del productor.

El detector falla cerrado ante metadata faltante o duplicada, imports por
alias, namespace, `import()`, `require`, reexport o forma dinámica. D5-R005,
D5-R007, D5-R014, D5-R016 y D5-R025–R027 siguen aplicando de forma acumulativa:
Option A no permite internals, repositories, ciclos, `forwardRef`, `ModuleRef`
ni módulos globales. `AppModule` conserva en D5-R023 su registro exterior exacto.

La aplicación de estas invariantes al candidato PBI-034 y los resultados aún
pendientes sobre su SHA final se separan en
[PBI-034 Option A Verification](PBI_034_OPTION_A_VERIFICATION.md).

## Interpretación vigente de la superficie HTTP

La regla histórica permanece verdadera: aceptar DEC-005, por sí solo, no
autorizó código funcional, controllers ni endpoints. PBI-022 materializó por
eso un shell sin controllers de producto. Esa restricción era un gate de fase,
no una negación del árbol objetivo de DEC-005, que ubica controllers y DTOs en
`<module>/presentation/http/`, ni de ADR-005, que define controllers delgados.

Una superficie autorizada posteriormente sólo pasa cuando
`httpSurfacePolicy.controllers` declara su path exacto, owner, clase y módulo
de composición; el archivo pertenece a `productModuleFiles`; la capa es
`presentation`; y el módulo registra el controller exactamente una vez. El
registro no exime D5-R005, D5-R011, D5-R014, D5-R036 ni las reglas de contexto,
persistencia y autoridad. La cronología y el cambio de enforcement se detallan
en [HTTP Surface Reconciliation](HTTP_SURFACE_RECONCILIATION.md).

## Diagnóstico y exit codes

- Árbol conforme: exit `0` y una línea estable con versión de policy y edges.
- Árbol no conforme: exit distinto de `0`; cada línea incluye regla, path
  relativo y causa accionable.
- Los paths absolutos del equipo no se imprimen.
- Múltiples violaciones reales se reportan completas; los fixtures mínimos
  están diseñados para no ocultar la causa primaria.

## Parser y resolución

El checker usa el AST de TypeScript para reconocer:

- imports estáticos y type-only;
- imports default, `import = require()`, aliases y namespace;
- exports con specifier y reexports;
- `import()` con literal;
- `require()` con literal;
- declaraciones públicas directas, su export y su nombre exacto;
- decoradores de clase y su metadata estática;
- composición exacta del arreglo `imports` de `AppModule`;
- composición dirigida exacta por consumer/producer, módulos, specifiers,
  tokens, interfaces y bindings registrados;
- identidad de símbolos importados por nombre directo, alias o namespace desde
  `@nestjs/common`/`@nestjs/core`;
- wrappers transparentes, iterativos y anidados:
  `ParenthesizedExpression`, `AsExpression`, `TypeAssertionExpression`,
  `NonNullExpression`, `SatisfiesExpression` y
  `PartiallyEmittedExpression`;
- `forwardRef`, `ModuleRef`, `Global`, `Scope.REQUEST`, controllers, endpoints
  y decisiones de autoridad dentro de controllers;
- shadowing léxico por parámetros y declaraciones locales, sin confundir
  homónimos, otros paquetes, comentarios o strings.
- tipos de driver a través de aliases, qualified names y argumentos genéricos;
- receivers tipados de Kysely/pg, tagged templates y llamadas de tabla;
- ownership, APIs, consumers, ports, adapters y objetos físicos mediante un
  registro cerrado de paths futuros aprobados.

Los archivos estructurales requeridos se clasifican explícitamente como
inexistentes, vacíos, whitespace-only, comment-only, sintácticamente inválidos,
sin declaración, con declaración incorrecta o conformes. No se evalúa código,
no se usa reflexión y la composición calculada/dinámica se rechaza.

D5-R033 construye para cada contrato una representación canónica independiente
del ID, nombre, descripción, posición y orden de propiedades. La identidad
incluye tipo de caso, polaridad, reglas y diagnóstico esperados, paths
normalizados, snapshot efectivo de archivos/directorios y configuración
material. La serialización ordena claves, conserva tipos y distingue ausencia,
`undefined`, `null` y cadena vacía cuando no son equivalentes. El source se
representa por tokens TypeScript sin whitespace ni comentarios; imports,
aliases, namespaces, wrappers, literales y operaciones permanecen materiales.
Un SHA-256 sirve sólo como resumen diagnóstico: la detección compara la
representación completa.

La resolución local contempla `.js`/`.mjs`/`.cjs` emitidos hacia
`.ts`/`.mts`/`.cts`, archivos directos e `index.*`. Los aliases de `tsconfig`,
package exports locales y loaders personalizados no están autorizados en esta
baseline y no se modelan.

## Paths inspeccionados e ignorados

La verificación de producto inspecciona únicamente `src/`. La policy gobierna
directorios vacíos exclusivamente bajo `src/modules/`, en cualquier nivel. Un
directorio realmente vacío o con sólo archivos ocultos/temporales se rechaza;
una cadena se rechaza por su leaf y por cualquier ancestro sin contenido
estructural. Un directorio vacío fuera de ese root no es materia de D5-R003.
`dist/`, `node_modules/`, `docs/`, `spikes/` y `test/` no forman parte del grafo
de producto. Los fixtures se inspeccionan como árboles `src/` independientes
en directorios temporales y nunca se copian al producto.

## Falsos positivos y negativos conocidos

Controles explícitos contra falsos positivos:

- propiedades ordinarias `global: true`, incluso anidadas, retornadas o
  entregadas a funciones locales, no representan `@Global()` de Nest;
- package ajeno, homónimos locales, comentarios, strings y símbolos
  shadowed permanecen ignorados aun con wrappers transparentes.

Posibles falsos positivos deliberados:

- nombres `*Entity` o `*Aggregate` exportados aunque el autor alegue
  inmutabilidad;
- nombres/path de adapter, repository o DTO fuera de su lugar normativo.

Posibles falsos negativos:

- imports dinámicos cuyo specifier sea calculado;
- dependencias creadas por reflexión, generación o loaders no seleccionados;
- acceso a símbolos Nest mediante propiedades calculadas; los imports default
  o `import =` sí se resuelven para las reglas de persistencia;
- configuración funcional global distinta del decorador importado `@Global()`;
  si aparece, requiere decisión y vínculo semántico reproducible antes de
  ampliar D5-R027;
- semántica de un hecho público, mutabilidad efectiva o autoridad de negocio;
- una decisión de autoridad expresada con vocabulario distinto de los símbolos
  conservadores registrados en policy;
- operaciones DB calculadas distintas de las APIs Kysely registradas; en
  migraciones gobernadas, toda referencia SQL dinámica se rechaza porque no
  puede contrastarse con el registro exacto de D5-R047.

Estos límites no habilitan excepciones. Si aparece una sintaxis no cubierta,
el cambio se detiene y Arquitectura decide si se amplía el checker o se adopta
una herramienta distinta. La sustitución futura debe conservar esta policy,
los fixtures y los mismos casos de rechazo; DEC-051 decidirá su gate general.

La canonicalización D5-R033 sólo equipara paths normalizables y trivia léxica.
Dos contratos con distinto source ejecutable, polaridad, regla, diagnóstico,
root, tipo de caso o configuración material conservan identidades distintas.
Una configuración nueva entra como propiedad material hasta que una prueba
demuestre equivalencia.

La correspondencia completa entre policy, detector, diagnóstico y pruebas está
en [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

Estado vigente de cobertura tras PBI-023 y el hardening acumulado hasta PBI-034:
44 reglas directas del checker, una externa, dos compuestas y seis
documentales; 188 fixtures (24 positivos y 164 negativos), 53 mutaciones de
producto y 68 contratos
semánticos críticos únicos. Los conteos fechados de las verificaciones formales
de PBI-022 permanecen históricos.
