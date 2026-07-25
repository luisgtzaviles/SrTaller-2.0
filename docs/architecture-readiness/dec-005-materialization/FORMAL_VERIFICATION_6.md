# Sexta reverificación formal independiente de DEC-005 y PBI-022

## 1. Título

**Sexta reverificación formal independiente de la materialización de DEC-005
y PBI-022 después de la remediación FV5-001.**

## 2. Fecha y entorno

| Control | Valor |
| --- | --- |
| Fecha y hora de preflight | 2026-07-23 14:04:31 MST |
| Sistema operativo | macOS 26.5.1, build 25F80 |
| Arquitectura | `arm64` |
| Directorio | `<repository-root>` |
| Entorno objetivo | Local exclusivamente |
| Node.js | `v24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |

Se usó la instalación local preexistente de Node.js 24 mediante
`PATH=/opt/homebrew/opt/node@24/bin:$PATH`. No se cambió la toolchain, el
lockfile ni la configuración global.

## 3. Objetivo

Reverificar desde cero:

- FV5-001 y, por consecuencia, FV4-003;
- la ausencia de regresión de FV4-001 y FV4-002;
- DEC005-C01 a DEC005-C05;
- la suficiencia material de D5-R033;
- la conformidad global de policy, checker, fixtures, mutaciones, build,
  smoke, documentación y gates.

La revisión determina si DEC-005 puede declararse `Formally Verified`; no
cambia por sí misma ningún estado documental.

## 4. Alcance

Se inspeccionaron completamente:

- DEC-005, su revisión formal y su resultado;
- PBI-022;
- `FORMAL_VERIFICATION_4.md`, `FORMAL_VERIFICATION_5.md`,
  `FV4_REMEDIATION.md` y `FV5_REMEDIATION.md`;
- `ARCHITECTURE_RULES.md`, `FIXTURES.md`, `IMPLEMENTATION.md`,
  `RESULTS.md`, `EVIDENCE.md` y `TRACEABILITY_MATRIX.md`;
- `architecture/dec-005-policy.json`;
- CLI, checker, fixtures, arnés de fixtures, catálogo y arnés de mutaciones;
- helper y pruebas de cobertura semántica;
- scripts de paths, policy, smoke y package;
- source real, composición de `AppModule`, build y `dist/`.

Se probaron D5-R001 a D5-R036, los hallazgos históricos, diez duplicaciones
semánticas, diez no-colisiones, los doce falsos PASS de FORMAL4, D5-R026,
D5-R027, D5-R035/D5-R036, estructura, roots, paths, determinismo y smoke.

## 5. Criterio de independencia

Las conclusiones de remediaciones y revisiones anteriores se trataron como
afirmaciones por refutar. La evidencia decisoria provino de:

1. lectura directa de implementación y contratos;
2. un arnés externo creado sólo en `/tmp`;
3. casos propios en memoria y roots temporales;
4. ejecución del checker y gates reales;
5. cálculo independiente de conteos y hashes;
6. restauración y comparación byte a byte del preflight.

Ningún PASS previo se aceptó como prueba autosuficiente. No se editó la
implementación al descubrir o ejecutar casos.

## 6. Criterio de materialidad

Un hallazgo sólo bloqueó potencialmente el PASS si era reproducible y
demostraba falso PASS de una infracción real, falso positivo material,
neutralización de cobertura, gate fallido, no determinismo, contradicción
contractual material, remediación irreproducible o falta de preservación.

No se clasificaron como defectos mejoras opcionales, preferencias, refactors,
cobertura hipotética, estándares nuevos, escenarios no reproducidos o
diferencias editoriales sin efecto contractual.

## 7. Estado Git inicial

| Control | Resultado |
| --- | --- |
| Rama | `main` |
| HEAD | `be1fe5a774b3437063b86e6ff16920131e502079` |
| `origin/main` | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia `HEAD...origin/main` | `0 0` |
| Índice | Vacío; `git diff --cached --quiet` devolvió `0` |
| Working tree | Dirty antes de la revisión |
| Rutas preexistentes | 64 |
| Huella agregada de rutas preexistentes | `6af445b0201f65a871e9eea92aae984991b598b4f85b690ab22668213168f218` |
| `FORMAL_VERIFICATION_6.md` inicial | Ausente |

La huella agregada usa filas ordenadas
`<status>\0<path>\0<sha256>`, separadas por salto de línea. No se limpió,
revirtió, formateó ni alteró trabajo preexistente.

Hashes históricos fijados antes de las pruebas:

| Documento | SHA-256 |
| --- | --- |
| `FORMAL_VERIFICATION_4.md` | `e2603b6842bad4f99dafe620a838bbf1383222a8ea5cd3906b82411d9b0595d7` |
| `FORMAL_VERIFICATION_5.md` | `882e39836a39e39d52c654bf221c990fe565f56dbdb11fcbb889ff6e385c478e` |
| `FV4_REMEDIATION.md` | `d11f217c04a05fc0a382085fa8b3c0136f47b563a41c4d4051b85a86b396d8b9` |
| `FV5_REMEDIATION.md` | `88137b9d1149aabf787b3786adde5d0dcc1b896c35cab36d839e7fdddece2046` |

## 8. Resultado global

**PASS — DEC-005 FORMALLY VERIFIED**

No se encontró un defecto material reproducible. FV5-001 queda corregido:
las diez variantes de duplicación fallaron con diagnóstico accionable y
restauración, mientras diez diferencias ejecutables legítimas conservaron
identidades distintas. Los 26 contratos requeridos producen 26 claves
semánticas únicas.

FV4-001, FV4-002 y FV4-003 quedan cerrados en esta revisión. Los gates,
conteos, paths, roots, build, smoke, determinismo, documentación y
preservación pasaron.

Nuevos hallazgos materiales: **ninguno**.

Observaciones no bloqueantes: **ninguna**.

## 9. Matriz DEC005-C01–DEC005-C05

| Condición | Resultado | Evidencia independiente |
| --- | --- | --- |
| DEC005-C01 | **PASS** | Checker real, 36 reglas auditadas, 98 fixtures, 23 mutaciones de producto, 6 mutaciones semánticas, 26 identidades únicas, matrices externas y gates |
| DEC005-C02 | **PASS** | Exactamente seis artefactos de módulo; 15/15 estructuras inválidas rechazadas; 1/1 control permitido |
| DEC005-C03 | **PASS** | Ownership, APIs, consumidores, policy, tres edges, `AppModule`, evidencia y dos roots físicos coinciden |
| DEC005-C04 | **PASS** | `src/shared/` ausente, sin admisiones ni roots genéricos |
| DEC005-C05 | **PASS** | Sin funcionalidad, persistencia, endpoints, autenticación o deploy; gates posteriores preservados |

## 10. Revalidación de hallazgos históricos

| Hallazgo | Estado final | Evidencia |
| --- | --- | --- |
| FV-001 — copias accidentales de SPIKE-009 | **CLOSED** | Sin copias `* 2.*` o equivalentes; originales sin diff atribuible |
| FV-002 — vacíos aceptados | **CLOSED** | 15/15 inválidos rechazados y cleanup completo |
| FV-003 — `AppModule` ficticio | **CLOSED** | 12/12 inválidos rechazados; composición exacta reordenada aceptada |
| FV-004 — D5-R029 sin prueba | **CLOSED** | Directo, alias, namespace y wrappers rechazados |
| FV-005 — D5-R036 indistinguible | **CLOSED** | D5-R035 y D5-R036 conservan conjuntos distintos |
| FV-006 — estados/conteos contradictorios | **CLOSED** | Conteos vigentes 98/159/164 reproducidos; históricos siguen etiquetados |
| FV-007 — carrera de smoke | **CLOSED** | Coordinador 10/10 y smoke compilado 20/20 |
| FV2-001 — paths no portables | **CLOSED** | Roots normal/Unicode, cwd distinto y root absoluto/relativo equivalentes |
| FV2-002 — cobertura insuficiente de paths | **CLOSED** | 86/86 negativos con path y contratos de path 6/6 |
| FV3-001 — aliases/namespaces | **CLOSED** | Matrices directa/alias/namespace y wrappers pasaron |
| FV3-002 — conteos canónicos | **CLOSED** | 98 fixtures, 23 mutaciones, 159 arquitectura, 164 total |
| FV4-001 — wrappers evaden identidad | **CLOSED** | Doce casos originales rechazados 12/12 |
| FV4-002 — falso positivo `global: true` | **CLOSED** | Diez formas ordinarias permitidas; `@Global()` real rechazado |
| FV4-003 — cobertura semántica insuficiente | **CLOSED** | Diez duplicaciones rechazadas, 26 identidades únicas y 6 mutaciones semánticas |
| FV5-001 — ID distinto oculta ejecución duplicada | **CLOSED** | Reproducción independiente con ID/policy, conteo preservado y metadata descriptiva rechazada |

## 11. Revalidación FV5-001

Se reprodujo la condición original y se intentó neutralizar el arnés sin
cambiar el producto:

- se clonó la ejecución de
  `fixture:D5-R025:parenthesized:direct`;
- se asignó otro ID;
- se agregó ese ID a una copia en memoria de policy;
- se conservó regla, polaridad, path, source y diagnóstico;
- se ejecutó `assertRequiredSemanticCoverage()`.

Resultado: rechazo D5-R033 con ambos IDs, D5-R025, polaridad negativa, path,
digest y causa `same effective execution and diagnostic contract`.

También se retiró el caso útil de alias y se sustituyó por la ejecución
directa conservando exactamente 26 IDs. El rechazo identificó:

```text
ids=fixture:D5-R025:parenthesized:direct,
fixture:D5-R025:transparent:alias
rules=D5-R025
polarity=negative
paths=src/modules/access/access.module.ts
reason=same effective execution and diagnostic contract
```

Ambas estructuras se restauraron al SHA lógico previo. El catálogo real y la
policy nunca se escribieron.

## 12. Diez variantes adversariales

Comando común:

```text
node /tmp/fv6-independent-audit.mjs \
  <repository-root>
```

El comando terminó con exit `0` porque atrapó y validó los diez rechazos
esperados. Cada subcaso produjo internamente el error D5-R033 y verificó el
hash de restauración.

| # | Sandbox temporal | Resultado | Diagnóstico verificable | Restauración |
| ---: | --- | --- | --- | --- |
| 1 | Cambiar sólo ID | REJECTED | Ambos IDs, D5-R025, polaridad, path, digest y razón | PASS |
| 2 | Cambiar ID y descripción | REJECTED | Metadata descriptiva no cambia identidad | PASS |
| 3 | Cambiar ID, nombre y descripción | REJECTED | Nombre visible tampoco cambia identidad | PASS |
| 4 | Reordenar propiedades | REJECTED | Claves ordenadas conservan la misma ejecución | PASS |
| 5 | Cambiar posición del arreglo | REJECTED en ambos órdenes | La posición no aporta identidad | PASS |
| 6 | Retirar alias útil y compensar con duplicado, total 26 | REJECTED | IDs directo/alias identificados como misma ejecución | PASS |
| 7 | Usar path equivalente con `./` y `..` | REJECTED | Path normalizado igual | PASS |
| 8 | Cambiar sólo whitespace/comentarios/source formatting | REJECTED | Tokens ejecutables iguales | PASS |
| 9 | Añadir metadata descriptiva dentro de `coverage` | REJECTED | Evidencia/review note no crea ejecución | PASS |
| 10 | Añadir duplicado y su ID a policy | REJECTED | Conteo/policy no ocultan colisión | PASS |

Los diagnósticos incluyeron `source/execution=sha256:` únicamente como
resumen; el rechazo se decidió por la clave completa.

## 13. Controles de no colisión

El mismo arnés exigió claves distintas y ausencia de excepción:

| # | Diferencia material | Resultado |
| ---: | --- | --- |
| 1 | Import directo frente a alias | PASS, distintas |
| 2 | Alias frente a namespace | PASS, distintas |
| 3 | Polaridad negativa frente a positiva | PASS, distintas |
| 4 | Shadowing frente a package incorrecto | PASS, distintas |
| 5 | Paréntesis frente a wrapper tipado | PASS, distintas |
| 6 | D5-R035 frente a D5-R035+D5-R036 | PASS, distintas |
| 7 | Root/path gobernado diferente | PASS, distintas |
| 8 | Source ejecutable `1` frente a `2` | PASS, distintas |
| 9 | Paths y snapshots efectivos diferentes | PASS, distintas |
| 10 | Misma regla con diagnóstico esperado diferente | PASS, distintas |

Resultado: **10/10 controles legítimos aceptados como distintos**.

## 14. Auditoría de identidad semántica

La implementación central en
`test/architecture-semantic-coverage.mjs` fue auditada función por función.

| Dimensión | Conducta comprobada | Resultado |
| --- | --- | --- |
| Tipo de caso | `fixture` y `mutation` participan | PASS |
| Ausencia/`undefined`/`null`/vacío | Serializaciones distintas | PASS |
| Booleanos y números | Tipo y valor preservados; casos especiales tratados | PASS |
| Arrays | Orden material preservado | PASS |
| Objetos | Claves ordenadas; orden de propiedades ignorado | PASS |
| Objetos no planos, funciones y ciclos | Rechazo fail-closed | PASS |
| Paths | `\`, `./`, `..` normalizados de forma portable | PASS |
| Reglas/paths como conjuntos | Ordenados y deduplicados | PASS |
| Source | Tokens TypeScript preservan código y omiten trivia | PASS |
| Snapshot fixture | Base, overrides, deletes y directorios vacíos efectivos | PASS |
| Mutación | Path/content/support/cleanup materializados | PASS |
| Metadata descriptiva | ID, name, description y coverage excluidos | PASS |
| Propiedad futura | Entra en `materialConfiguration` y distingue `false`/`true` | PASS |
| SHA frente a clave | Igual digest con claves distintas no colisiona; misma clave con digests distintos sí falla | PASS |

La detección indexa `entry.identity.key`, no `entry.identity.digest`. Por ello,
una colisión del resumen SHA-256 no puede unir contratos diferentes.

## 15. Auditoría D5-R033

D5-R033 valida por separado:

1. cantidad exacta de IDs de policy;
2. unicidad de IDs;
3. correspondencia exacta policy/catálogo;
4. prefijo de tipo;
5. evidencia textual presente en source;
6. polaridad coherente con reglas;
7. reglas conocidas;
8. paths presentes y normalizados;
9. regla identificada por ID realmente esperada;
10. source ejecutable no vacío;
11. identidad y digest válidos;
12. unicidad de la ejecución canónica completa.

La corrida focalizada:

```text
node --test --test-reporter=tap \
  --test-name-pattern='D5-R033|transparent AST normalizer' \
  test/architecture-coverage.test.mjs \
  test/architecture-semantic-coverage.test.mjs
```

pasó **20/20**: contrato policy, normalizador, seis mutaciones semánticas,
diez rechazos de equivalencia y ocho distinciones legítimas. La neutralización
de un `assert.throws` o del comparador haría fallar las guardas.

## 16. No regresión FV4

Se reconstruyeron los doce falsos PASS de FORMAL4 en roots temporales:

| Familia | Casos | Resultado |
| --- | ---: | --- |
| Controller directo/alias/namespace parentetizado | 3 | D5-R035, 3/3 |
| `Scope` alias/namespace parentetizado | 2 | D5-R029, 2/2 |
| `forwardRef` directo/namespace parentetizado | 2 | D5-R025, 2/2 |
| `Global` directo/namespace parentetizado | 2 | D5-R027, 2/2 |
| `Get` directo/namespace parentetizado | 2 | D5-R035, 2/2 |
| Controller alias parentetizado con autoridad | 1 | D5-R035+D5-R036, 1/1 |

Resultado: **12/12 rechazados por su contrato canónico**. Siete controles
adicionales de condicionales, binarios, calls, computed access, property
access y shadowing no produjeron falsos positivos.

## 17. D5-R026

La revisión probó:

- `ModuleRef` type-only directo;
- alias;
- namespace/qualified type;
- directo parentetizado;
- namespace parentetizado.

Los cinco recibieron exclusivamente D5-R026 y paths relativos exactos:
**5/5 PASS**. Los controles de package ajeno, homónimo y shadowing contenidos
en fixtures permanecieron permitidos. No se reprodujo regresión del traversal
ni de la normalización compartida.

## 18. D5-R027

Diez formas ordinarias se aceptaron con exit `0`:

1. objeto directo;
2. objeto nested;
3. objeto retornado;
4. objeto entregado a función;
5. `true as const`;
6. expresión parentetizada;
7. clase homónima;
8. función homónima;
9. símbolo desde otro package;
10. import correcto oculto por parámetro.

`@Global()` directo, alias, namespace y wrappers desde `@nestjs/common`
activaron D5-R027. El detector amplio `containsTrueProperty()` no existe.
Resultado: **sin falso positivo ni falso negativo reproducible**.

## 19. D5-R035/D5-R036

La autoridad canónica se preserva:

| Caso | Reglas |
| --- | --- |
| `@Get()` real | D5-R035 |
| Controller ordinario | D5-R035 |
| Controller que llama/declara símbolo de autoridad | D5-R035 y D5-R036 |
| Método decorado sin decisión de autoridad | No agrega D5-R036 |

Los casos directos, aliases, namespaces y wrappers pasaron. `Get` no fue
reclasificado como D5-R036. La lista conservadora de símbolos de autoridad
sigue en policy y no se amplió.

## 20. Auditoría de las 36 reglas

| Regla | Superficie verificada | Resultado |
| --- | --- | --- |
| D5-R001 | Un artefacto, manifest y `verify:structure` externo | PASS |
| D5-R002 | Allowlist exacta de módulos | PASS |
| D5-R003 | Archivos/directorios estructurales efectivos | PASS |
| D5-R004 | API pública y exports exactos por `index.ts` | PASS |
| D5-R005 | Prohibición de deep imports | PASS |
| D5-R006 | Edges observados frente a grafo | PASS |
| D5-R007 | Ciclos por DFS | PASS |
| D5-R008 | Dominio hacia capas permitidas | PASS |
| D5-R009 | Aplicación sin outer layers/persistencia | PASS |
| D5-R010 | Nest fuera de dominio/aplicación | PASS |
| D5-R011 | Presentación sin repository/adapter/SQL | PASS |
| D5-R012 | Ports dentro de aplicación | PASS |
| D5-R013 | Adapters fuera de dominio/aplicación | PASS |
| D5-R014 | Sin internals ajenos | PASS |
| D5-R015 | DTO HTTP en presentación | PASS |
| D5-R016 | Contrato público framework-free | PASS |
| D5-R017 | Hecho público del owner; no hay eventos | PASS N/A |
| D5-R018 | Sin entidad/agregado mutable público | PASS |
| D5-R019 | Shared ausente/vacío | PASS |
| D5-R020 | Sin roots genéricos | PASS |
| D5-R021 | Utilidad local; no hay utilidades | PASS N/A |
| D5-R022 | Infraestructura con owner; no hay infra funcional | PASS N/A |
| D5-R023 | `AppModule` estático y exacto | PASS |
| D5-R024 | Sólo `AppModule` importa módulos Nest | PASS |
| D5-R025 | `forwardRef` directo/alias/namespace/wrappers | PASS |
| D5-R026 | `ModuleRef` directo/alias/namespace/type/wrappers | PASS |
| D5-R027 | `@Global()` real sin barrido de objetos ordinarios | PASS |
| D5-R028 | Dynamic modules; ninguno presente | PASS N/A |
| D5-R029 | `Scope.REQUEST` directo/alias/namespace/wrappers | PASS |
| D5-R030 | Use cases planos; sin funcionalidad | PASS N/A |
| D5-R031 | Imports ESM NodeNext | PASS |
| D5-R032 | Doble corrida, salidas y gates | PASS |
| D5-R033 | Cobertura obligatoria e identidad semántica | PASS |
| D5-R034 | Excepción previa; no existen excepciones | PASS N/A |
| D5-R035 | Sin funcionalidad, controllers ni endpoints | PASS |
| D5-R036 | Controller no decide contexto/autoridad final | PASS |

No se encontró una evasión material reproducible en D5-R001 a D5-R036.

## 21. Fixtures y contratos

Conteos derivados de los arreglos ejecutados:

| Métrica | Resultado |
| --- | ---: |
| Fixtures totales | 98 |
| Positivos | 12 |
| Negativos | 86 |
| Negativos con path exacto | 86/86 |
| Reglas directas con fixture negativo | 27/27 |
| Contratos semánticos requeridos | 26 |
| IDs únicos | 26 |
| Claves semánticas únicas | 26 |

Cada fixture corrió dos veces y comparó exit/stdout/stderr. Cada negativo
restringió todos sus diagnósticos al conjunto completo de reglas y paths
declarados. Los contratos críticos conservan evidencia de source, polaridad,
regla, path y ejecución.

La estructura real contiene:

- tres módulos permitidos: `access`, `stations`, `tenancy`;
- seis archivos bajo `src/modules/`;
- tres APIs públicas type-only;
- cero directorios vacíos;
- cero `shared/`, roots genéricos o archivos de negocio.

## 22. Mutaciones

| Superficie | Conteo | Resultado |
| --- | ---: | --- |
| Mutaciones de producto | 23 | 23/23 rechazo y restauración |
| Familias normativas | 12 | 12/12 |
| Mutaciones semánticas D5-R033 | 6 | 6/6 detectadas |
| Duplicaciones adversariales adicionales | 10 | 10/10 detectadas |

Familias de producto:

```text
D5-R003 D5-R005 D5-R007 D5-R010 D5-R019 D5-R020
D5-R023 D5-R025 D5-R027 D5-R029 D5-R035 D5-R036
```

Las mutaciones de producto copiaron `src/` a sandbox, exigieron regla/path
exactos, retiraron el cambio y volvieron a exigir exit `0`. Las seis
mutaciones semánticas operaron en memoria y compararon el SHA lógico antes y
después. No se mutó el árbol compartido.

## 23. Gates

Todos los comandos usaron Node.js 24.18.0.

| Comando | Exit | Duración real | Resultado |
| --- | ---: | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | 0.36 s | Already up to date |
| `pnpm run architecture` | 0 | 1.07 s | Policy 1; tres edges |
| `pnpm run typecheck` | 0 | 1.37 s | Sin errores |
| `pnpm run build` | 0 | 1.61 s | Build ESM limpio |
| `pnpm test` | 0 | 38.56 s | 164/164 |
| `pnpm run test:architecture` | 0 | 40.99 s | 159/159 |
| `pnpm run verify` #1 | 0 | 48.83 s | 164/164 + estructura + arquitectura |
| `pnpm run verify` #2 | 0 | 51.29 s | 164/164 + estructura + arquitectura |
| Foco D5-R033 | 0 | 0.23 s | 20/20 |
| `git diff --check` previo | 0 | — | PASS |

Las dos corridas completas fueron independientes y no reutilizaron una
conclusión cacheada.

## 24. Determinismo

Checker real:

- 20/20 ejecuciones con exit `0`;
- una única combinación de status/stdout/stderr;
- SHA-256 de JSON `{status,stdout,stderr}`:
  `49aee1c02e063df205ed28252cbdd6e9d74334943ca931bc3b07a607c586e604`;
- salida estable:
  `DEC-005 architecture verified (policy 1; edges access->stations, access->tenancy, stations->tenancy)`.

Smoke compilado:

- 20/20 ejecuciones con exit `0`;
- una única combinación de status/stdout/stderr;
- SHA-256 bajo la misma fórmula:
  `9bc1b45ee61c3df04f60daea119ffd4d795e81a393b229b6c320f19dcc1c34c1`;
- salida estable:
  `Compiled dist startup, listener and shutdown verified`.

Además, fixtures corrieron dos veces por caso, roots distintos produjeron
salida idéntica y `verify` pasó dos veces.

## 25. AppModule y estructura

Matriz independiente de `AppModule`:

1. sin decorador;
2. metadata vacía;
3. metadata sin `imports`;
4. módulo faltante;
5. módulo extra;
6. módulo duplicado;
7. metadata en variable;
8. imports en variable;
9. clase incorrecta;
10. clase no exportada;
11. decorador en otra clase;
12. módulo importado bajo alias.

Resultado: **12/12 rechazados exclusivamente por D5-R023**. El control con
los tres módulos exactos reordenados fue aceptado: **1/1**.

Matriz estructural:

- archivo ausente, vacío, whitespace, comentario simple, comentario
  multilínea, shebang/comentario, TypeScript sin símbolo, símbolo incorrecto
  y TypeScript inválido;
- directorio vacío, hidden-only, temporary-only, leaf nested, módulo ausente
  y módulo anticipatorio.

Resultado: **15/15 inválidos rechazados por D5-R003**. Un directorio vacío
fuera de `src/modules` fue aceptado: **1/1**. Todos los sandboxes se
eliminaron.

## 26. Paths y roots

Los contratos canónicos de path pasaron **6/6**. La matriz externa añadió dos
roots:

- root A con nombre normal;
- root B con espacios y Unicode `ñ`.

El CLI se invocó:

- desde cwd distinto y subdirectorio;
- con root absoluto;
- con root relativo equivalente.

Ambos roots conformes devolvieron exit `0` y salida byte-idéntica. Tras
introducir el mismo ciclo, ambos devolvieron exit `1` y salida byte-idéntica:

```text
D5-R006 src/modules: observed graph [...] does not match [...]
D5-R007 src/modules/stations/index.ts: dependency cycle detected:
src/modules/stations/index.ts -> src/modules/tenancy/index.ts ->
src/modules/stations/index.ts
```

La combinación D5-R006+D5-R007 es correcta en modo producto: el edge nuevo
diverge del grafo aprobado y también crea ciclo. No apareció root físico,
`/Users/`, backslash, drive Windows o URL `file:` en diagnósticos.

## 27. Smoke, build y dist

- Coordinador de readiness: 10/10 unitarias.
- Smoke compilado: 20/20.
- Marker, listener, orden inverso, mismo turno, chunks, stderr, timeout,
  terminación y cleanup pasaron.
- `start` y `smoke:start` ejecutan `dist/main.js`.
- Configuración de arranque sigue fail-closed.

Inspección de `dist/`:

| Control | Resultado |
| --- | --- |
| JavaScript | 10 |
| Source maps | 10 |
| Extras | 0 |
| `sourcesContent` | 0 |
| Paths absolutos/locales | 0 |
| URLs `file:` | 0 |
| Imports ESM relativos sin `.js` | 0 |

La composición emitida contiene los tres módulos autorizados. Los tres
`index.js` vacíos en runtime son coherentes con contratos TypeScript
type-only.

## 28. Documentación y enlaces

La comparación entre reglas, fixtures, implementación, resultados, evidencia,
trazabilidad, policy y ejecución fue materialmente consistente:

- 98 fixtures = 12 positivos + 86 negativos;
- 23 mutaciones de producto en 12 familias;
- 6 mutaciones semánticas;
- 26 IDs = 26 identidades;
- 159 pruebas arquitectónicas;
- 164 pruebas totales;
- D5-R035/D5-R036 conserva su autoridad real;
- FV5-001 está descrito como remediado técnico pendiente de esta revisión.

Antes del dictamen se analizaron 342 Markdown:

- 2754 links relativos con target;
- 2 links internos de sólo anchor;
- 11 links externos;
- cero targets faltantes;
- cero fences desbalanceados.

El conjunto equivale a 2756 referencias internas. Trailing whitespace y
`git diff --check` pasaron.

## 29. Preservación SHA-256

Antes de crear este dictamen, las 64 rutas del preflight coincidieron
**64/64** en status y SHA-256. La huella agregada permaneció:

```text
6af445b0201f65a871e9eea92aae984991b598b4f85b690ab22668213168f218
```

Manifiesto individual:

| Ruta | Estado | SHA-256 |
| --- | --- | --- |
| `docs/architecture-readiness/blocker-closure/BLOQUEANTES_DEL_PRIMER_COMMIT.md` | ` M` | `472b245a15b0b73e143160722e875c5320c6835c2beb36a71687c9342b3c6da2` |
| `docs/architecture-readiness/blocker-closure/CLASIFICACION_POR_HITO.md` | ` M` | `c7b2534fb3a567c264cb040083226754adfb8d76cd506f99227ef03b9266c14b` |
| `docs/architecture-readiness/blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md` | ` M` | `b2384bf110a1dcaa0f4a188dce358aea8ad5f9983a24e7ca3ec038da700c0819` |
| `docs/architecture-readiness/blocker-closure/DEPENDENCIAS_ENTRE_DECISIONES.md` | ` M` | `2f1f75336c2daa4f5356081892496ade8f022895ec1e6b7c6ce9ee81bb5e4752` |
| `docs/architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md` | ` M` | `93a92555ffa3fd53c7152532e4467bc3c7fb47d390ce2d88e549508c6cc01bea` |
| `docs/architecture-readiness/blocker-closure/MAPA_DE_ADRS_REQUERIDOS.md` | ` M` | `5e6cdf3986b609963a9b5db7a324faa2a19ff6cbaa4556b330b17d6aae0e723d` |
| `docs/architecture-readiness/blocker-closure/PLAN_DE_CIERRE.md` | ` M` | `cb273176050094254fb3022c1ecc276ed97ecdd5a120d3d314e4ce76a7912814` |
| `docs/architecture-readiness/blocker-closure/README.md` | ` M` | `e1b8651f1c40900729c02f5cc35d202c606d7cd88e021fdaf71de52bc19bc86d` |
| `docs/architecture-readiness/blocker-closure/SECUENCIA_DE_DECISIONES.md` | ` M` | `e675c044b87983f4d443605dc85c186688e00baa9150b0a90f2240a9968996ce` |
| `docs/architecture-readiness/blocker-closure/TRAZABILIDAD.md` | ` M` | `23b91c7b8a6b330463682d1e5e1c0532f54fcf8095523e60295be216600c8450` |
| `docs/architecture-readiness/repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md` | ` M` | `cdd796876889b764810c7d98c23e846cbae0ce9e17b9fd63e7321235d0a7c46d` |
| `docs/architecture-readiness/repair-mvp/ESTADO_DE_PREPARACION_ARQUITECTONICA.md` | ` M` | `a83e7c2f1ad8f196b3bc58c259789ab208119091fed74196819ea2bf81300ce1` |
| `docs/architecture-readiness/repair-mvp/README.md` | ` M` | `dd054c3e564651db04d263fceae3a0efc745a05e693da8a2613834e6edfc51c9` |
| `docs/architecture-readiness/repair-mvp/TRAZABILIDAD.md` | ` M` | `bf7d80ebb1aa0e1a908ad42f4531799e5176e3568ba92245639d2a237d5c0063` |
| `docs/backlog/DEPENDENCY_MAP.md` | ` M` | `a9e397a7a37054070bda608878f8e003bd8efb9a0c3aa89367ed17296c53a05e` |
| `docs/backlog/EPICS.md` | ` M` | `794b14780a7abcf69f47c5607ad0d32d03276f7357b0129718aff23e542dad18` |
| `docs/backlog/PRODUCT_BACKLOG.md` | ` M` | `122a7f1cb41ac23b0a9baf4c7bade0f8040978e6fa8f5409a1e4cd3317f15774` |
| `docs/backlog/README.md` | ` M` | `4f3f315b7450a803ea7d7f6cee9392222730173162c1dd0a475da1fc1d0f971c` |
| `docs/backlog/pbis/README.md` | ` M` | `d8ab4623d5ebe44595cf26c07f7ca29c868b80f6c08d5de1d32c84c25f8c0bc1` |
| `package.json` | ` M` | `b14a00abe9b2473613fd973d4499d853ea3a6fe4a5f5e624093f462e6199e469` |
| `scripts/smoke-start.mjs` | ` M` | `7a220c7c8f4b4e10f02f911c2c687f4c568db9ea063c46623c39f3995419a401` |
| `src/app.module.ts` | ` M` | `78aa0b2472244370e98e5ee7d6c09692d102ceaa08171db8977f8be97ea1124e` |
| `architecture/dec-005-policy.json` | `??` | `b40e4e605c14138d1486e6180b9ff728446e29b0991161753d32c937bb1380d3` |
| `docs/architecture-readiness/NEXT_R0_GATE_ASSESSMENT.md` | `??` | `ae8f2a4269172831b1eae8eb1a01ca884fb6b43bdcaafd40556ad73dc0e61fba` |
| `docs/architecture-readiness/dec-005-materialization/ARCHITECTURE_RULES.md` | `??` | `a964256bf1c9b78e342afeb59aee718977dce48741e8d2270da98aafe39e730a` |
| `docs/architecture-readiness/dec-005-materialization/DEPENDENCY_GRAPH.md` | `??` | `f2e292b70c04df9f59f7b6333a601a7a2ee96631c656cb872b09667e041ac3b2` |
| `docs/architecture-readiness/dec-005-materialization/EVIDENCE.md` | `??` | `fda4dadbd61b544b06bdf134a29256e7c4249262b6709ee3a24ae320a85e84e7` |
| `docs/architecture-readiness/dec-005-materialization/FIXTURES.md` | `??` | `2e7b698394da66aeafdac0d7b104b7907a5e01daf2e95dc877c174d36634b9b0` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION.md` | `??` | `5e666e9f5067dace3191277f31482306e5857dd2ffeec1cf5f34291c68a05fa1` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_2.md` | `??` | `2a10c6f02ae9da84d4c4888f165b686c2d84daf0c1d92311d61a29114f3e1eb7` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_3.md` | `??` | `f842e3f1b6be0a320513ff169716a7b7f244e3822273fdf6d96a891409fb4b82` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_4.md` | `??` | `e2603b6842bad4f99dafe620a838bbf1383222a8ea5cd3906b82411d9b0595d7` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_5.md` | `??` | `882e39836a39e39d52c654bf221c990fe565f56dbdb11fcbb889ff6e385c478e` |
| `docs/architecture-readiness/dec-005-materialization/FV2_REMEDIATION.md` | `??` | `a6de1cb9172156c883762baba714c06e29a1ac45674c132afee6f3b893014292` |
| `docs/architecture-readiness/dec-005-materialization/FV3_REMEDIATION.md` | `??` | `08060313b3d7e82554a603ae775c0f0a2f4098bb968a357816b1e5f4b9347269` |
| `docs/architecture-readiness/dec-005-materialization/FV4_REMEDIATION.md` | `??` | `d11f217c04a05fc0a382085fa8b3c0136f47b563a41c4d4051b85a86b396d8b9` |
| `docs/architecture-readiness/dec-005-materialization/FV5_REMEDIATION.md` | `??` | `88137b9d1149aabf787b3786adde5d0dcc1b896c35cab36d839e7fdddece2046` |
| `docs/architecture-readiness/dec-005-materialization/IMPLEMENTATION.md` | `??` | `efa01bc384cb1894f4e7e45935f2772cb151bd32db443d7e502059fc99db8975` |
| `docs/architecture-readiness/dec-005-materialization/OWNERSHIP.md` | `??` | `5431902937ca8a085d243c0d1db44e9d71060e2cf48ecaac7b345bfb627d712b` |
| `docs/architecture-readiness/dec-005-materialization/REMEDIATION.md` | `??` | `bf45f2220105661caeb9b07934cf5205aa8f6324caf6d741a06b8933f09b822b` |
| `docs/architecture-readiness/dec-005-materialization/RESULTS.md` | `??` | `9d07da60f73809a4faa3b944dac3d61b4f5971f6300fcb550f6542d8d4d6a8d6` |
| `docs/architecture-readiness/dec-005-materialization/TRACEABILITY_MATRIX.md` | `??` | `4f268222b48ed1440688d196a4c07f131dac69c5b513222715dad09cf2a68e58` |
| `docs/backlog/pbis/PBI-022.md` | `??` | `a2fd5df77321723e2c00b2dd86918b569033a6d94d978f976df0fa4ba387baca` |
| `docs/decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md` | `??` | `47af5209d4dba125d256f500d8d4c28a6199bf086856285b8c2326815d24d04f` |
| `docs/decisions/dec-005-modular-monolith-organization/FORMAL_REVIEW.md` | `??` | `6ee52a3ac5ca5eadd59befc474ea9ba8b435765bdf31b5b9f9196670aba3d3f1` |
| `docs/decisions/dec-005-modular-monolith-organization/RESULTS.md` | `??` | `6699aa9dac4f15675074b3c336269a5fd5843976b6b954e39a4dce539a36e28d` |
| `scripts/check-architecture.mjs` | `??` | `f61daeb59dc0b3b44cd0b04beb1ac73f3d36ff6741ba0a20d6dcc2bc2a6c7dbd` |
| `scripts/lib/architecture-checker.mjs` | `??` | `68c4caf564935d1316914bceda0167f35ef8d3bf70dc23088c3be068c4ab5710` |
| `src/modules/access/access.module.ts` | `??` | `0297941ad97b0d8d78429e58f6a05fe9c4cb932e1f76a8ecff3e83629924735e` |
| `src/modules/access/index.ts` | `??` | `70d294e1bc4f4667e5d37fe35f5f3e57eb977d9cdb3bca63b412aa8997203d36` |
| `src/modules/stations/index.ts` | `??` | `7ad32c1ae59fbff5e35d2af2a2cb2f2e7421779a7749274d7d4b29b80cd19425` |
| `src/modules/stations/stations.module.ts` | `??` | `182d02b073baa31f45ef351f55b478ab794ed4f0a696ddb25ac11819d96adaa1` |
| `src/modules/tenancy/index.ts` | `??` | `a1e6dccd34154b173a7cfcaba5f3a71af7ae2dcf2e403f16c341d7bb30cf09a1` |
| `src/modules/tenancy/tenancy.module.ts` | `??` | `dd01263007b5212bdfde60fc5d5dccb7bb67d364c046ef6438697af18c0c4dc8` |
| `test/architecture-coverage.test.mjs` | `??` | `dc3025bcba32833889ffc398eb898f474f31c51f142c022484d1d27fc5332b54` |
| `test/architecture-fixtures.mjs` | `??` | `1a518aaa20d82cbfb016972b5c201e51d24127be33bb15bb7a726146916725b5` |
| `test/architecture-fixtures.test.mjs` | `??` | `36a01a6d055f19e38f9228049450f62a042f2c1893403a64d68c2e4ab7097f05` |
| `test/architecture-mutations.test.mjs` | `??` | `757e0805e1004fa65a2032a48439dcedeb95745e918d0d3f1a8e1f58827a0a77` |
| `test/architecture-paths.test.mjs` | `??` | `31578b83b35df3b2a8e3338d79334f679490b3bd44d9f9e18611cfaea27d1096` |
| `test/architecture-policy.test.mjs` | `??` | `1afe849f5d4dd30f00fa2fd0b476fa1e192981e87ca7c0bc5ebab4563e7f1894` |
| `test/architecture-remediation-mutations.mjs` | `??` | `ddd8f29382d61c006693e3fd0d1f3caf6d06ce203b547401616a5a9a6f2036e8` |
| `test/architecture-semantic-coverage.mjs` | `??` | `9ba6b36d886822533ac5871a742b7ec48374512e2c0ae7fbf749fdc81fb86a37` |
| `test/architecture-semantic-coverage.test.mjs` | `??` | `7f75053a6ef1c656b737738baa83f1fab3cedac78ab6ba3ab4c184ab3bfb78da` |
| `test/architecture-support.mjs` | `??` | `e2515ddd5a45cd72e926adb8a2c6cb228a40041d8530466ea43b3010c4ce7ab1` |

Los cuatro hashes históricos destacados permanecieron iguales. Los scripts
temporales y roots externos no crearon rutas dentro del repositorio.

## 30. Estado Git final

El control final posterior a la escritura confirmó:

- rama `main`;
- HEAD y `origin/main` en
  `be1fe5a774b3437063b86e6ff16920131e502079`;
- divergencia `0 0`;
- índice vacío;
- las 64 rutas preexistentes byte-idénticas;
- una única ruta adicional:
  `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_6.md`;
- working tree dirty preexistente más este dictamen.

No se agrega el dictamen al índice.

## 31. Acciones no realizadas

No se realizó:

- remediación;
- cambio de checker, pruebas, fixtures, mutaciones, policy o package;
- modificación de documentación previa;
- funcionalidad, persistencia, endpoints, autenticación, autorización, PIN o
  sesiones;
- commit, push, PR, merge, rebase, tag, stash, reset o clean;
- CI, deploy, SSH, DB, SQL o migraciones;
- cambio de estado formal.

## 32. Estados posteriores recomendados

Este dictamen declara:

- **DEC-005: Formally Verified**.

Para una tarea posterior y separada recomienda:

1. actualizar formalmente el estado documental de DEC-005;
2. cerrar PBI-022 como `Done`;
3. evaluar y ejecutar el desbloqueo de DEC-049;
4. continuar con el siguiente gate de R0.

Hasta que esa tarea de gobierno se ejecute, los archivos existentes conservan
sus estados previos; esta revisión no los modifica.

## 33. Conclusión

La remediación FV5-001 corrige de forma reproducible la duplicación semántica.
La clave canónica distingue ejecución real y no ID o metadata descriptiva;
usa la representación completa y no depende del digest para decidir unicidad.

FV4-001/FV4-002 no regresaron, FV4-003 queda cerrado, D5-R026 permanece
conforme y D5-R035/D5-R036 mantienen su semántica. Los 36 contratos, gates,
conteos, roots, build, smoke y documentación pasaron. No existe un hallazgo
Blocker, Major, Minor u Observation nuevo.

**Resultado final: PASS — DEC-005 FORMALLY VERIFIED.**

## 34. Siguiente acción

Ejecutar una tarea documental de gobierno separada para registrar el nuevo
estado formal de DEC-005 y PBI-022; después evaluar el desbloqueo de DEC-049 y
el siguiente gate de R0. No realizar esa promoción dentro de esta revisión.
