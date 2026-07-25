# Quinta reverificación formal independiente de DEC-005 y PBI-022

## 1. Título

**Quinta reverificación formal independiente de la materialización de
DEC-005 y PBI-022 después de la remediación FV4.**

## 2. Fecha y entorno

| Control | Valor |
| --- | --- |
| Fecha y hora de preflight | 2026-07-23 12:54:10 MST |
| Sistema operativo | macOS 26.5.1, build 25F80; Darwin 25.5.0 |
| Arquitectura | `arm64` |
| Directorio | `<repository-root>` |
| Entorno objetivo | Local exclusivamente |
| Node.js | `v24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |

Se usó la instalación local preexistente de Node.js 24 mediante
`PATH=/opt/homebrew/opt/node@24/bin:$PATH`. No se cambió la toolchain ni el
lockfile.

## 3. Alcance

La revisión cubrió:

- DEC005-C01 a DEC005-C05;
- FV-001 a FV-007, FV2-001/FV2-002, FV3-001/FV3-002 y
  FV4-001/FV4-002/FV4-003;
- D5-R001 a D5-R036;
- policy, checker, CLI, fixtures, cobertura, mutaciones y scripts canónicos;
- identidad importada, aliases, namespaces, shadowing y wrappers AST;
- controles `global: true`, roots físicos, paths, determinismo y smoke;
- árbol, APIs, ownership, grafo, `AppModule`, build, `dist/` y documentación.

No se implementó ni remedió ningún hallazgo.

## 4. Independencia y metodología

La remediación y sus resultados se trataron como afirmaciones por refutar.
La revisión:

1. leyó la decisión, su dictamen, PBI-022, FORMAL4, FV4 y el expediente;
2. inspeccionó directamente policy, checker y pruebas;
3. reconstruyó fuera del repositorio los doce falsos PASS originales;
4. creó matrices independientes adicionales desde copias temporales de
   `src/`;
5. mutó copias temporales del mecanismo D5-R033 una por una;
6. ejecutó gates, roots, checker, smoke y build reales;
7. comparó hashes antes de crear este dictamen.

No se usó un PASS de la remediación como evidencia autosuficiente.

## 5. Estado Git inicial

| Control | Resultado |
| --- | --- |
| Rama | `main` |
| HEAD | `be1fe5a774b3437063b86e6ff16920131e502079` |
| `origin/main` | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia `HEAD...origin/main` | `0 0` |
| Índice | Vacío; `git diff --cached --quiet` devolvió `0` |
| Working tree | Dirty antes de la revisión |
| Rutas preexistentes inventariadas | 60 |
| Huella agregada del inventario | `d2524ad1a8e9c1d8cd800f1d98745bbf42489e56077411beba9b8ccf4cb9cca7` |
| `FORMAL_VERIFICATION_5.md` inicial | Ausente |

No se limpió, revirtió, formateó ni alteró el trabajo preexistente.

## 6. Resultado global

**FAIL — DEC-005 FIFTH FORMAL REVERIFICATION**

FV4-001 y FV4-002 quedan corregidos técnicamente. FV4-003 no queda cerrado:
D5-R033 detectó 9 de 10 mutaciones adversariales, pero aceptó que un contrato
de alias reutilizara exactamente el source y path del caso directo. Los IDs,
conteos, fragmentos, regla y path continuaron formalmente válidos aunque la
variante semántica desapareció.

### FV5-001 — Major — D5-R033 acepta duplicación semántica

La prueba temporal sustituyó el source del contrato
`fixture:D5-R025:transparent:alias` por el source exacto del caso directo,
conservó su ID de alias, regla D5-R025, path y evidencia ajustada. Resultado:

```text
node --test test/architecture-coverage.test.mjs
exit 0
```

El fixture duplicado también sigue siendo una infracción real D5-R025, por lo
que ejecutar fixtures no distingue que la variante alias fue perdida. La
implementación exige unicidad de ID, no unicidad o correspondencia semántica
entre ID, forma sintáctica y source. Esto contradice la afirmación vigente de
que D5-R033 falla ante duplicación.

Impacto: DEC005-C01 y D5-R033 fallan. Por el criterio expreso de esta revisión,
una mutación de cobertura no detectada impide PASS.

### FV5-002 — Observation — el contrato de revisión invierte D5-R035/D5-R036

La instrucción de esta quinta revisión pide que `Get` produzca D5-R036 y no
D5-R035. La autoridad canónica dice lo contrario:

- D5-R035 prohíbe iniciar código funcional, controller o endpoint;
- D5-R036 prohíbe que un controller decida contexto confiable o autorización
  final.

La ejecución confirmó:

- `@Get()` real: sólo D5-R035;
- controller ordinario: sólo D5-R035;
- controller con `decideAuthorization`: D5-R035 y D5-R036.

No es una confusión de la implementación. La matriz se evaluó contra DEC-005,
que es la autoridad normativa. La redacción contradictoria de la solicitud
debe corregirse en una tarea de gobierno, no cambiando el checker.

## 7. Matriz DEC005-C01 a DEC005-C05

| Condición | Resultado | Evidencia |
| --- | --- | --- |
| DEC005-C01 | **FAIL** | FV5-001 demuestra duplicación semántica no detectada por D5-R033; checker funcional y gates nominales sí pasan |
| DEC005-C02 | **PASS** | 15/15 estructuras inválidas rechazadas, control permitido 1/1, árbol real sin vacíos/placeholders |
| DEC005-C03 | **PASS** | Ownership, APIs, consumidores, grafo, `AppModule` y dos roots físicos coinciden |
| DEC005-C04 | **PASS** | `src/shared/` ausente, sin admisiones, roots genéricos o ownership silencioso |
| DEC005-C05 | **PASS** | Sin funcionalidad, persistencia, CI o deploy; gates posteriores conservan autoridad |

## 8. Revalidación FV-001 a FV-007

| Hallazgo | Estado en esta revisión | Evidencia |
| --- | --- | --- |
| FV-001 — copias de SPIKE-009 | **CLOSED** | No aparecieron copias nuevas ni diff de los originales |
| FV-002 — vacíos aceptados | **CLOSED** | 15/15 inválidos estructurales rechazados; cleanup completo |
| FV-003 — `AppModule` ficticio | **CLOSED** | 12/12 adversariales rechazados y control reordenado aceptado |
| FV-004 — D5-R029 sin prueba | **CLOSED** | Directo, alias, namespace y wrappers rechazados |
| FV-005 — D5-R036 indistinguible | **CLOSED** | Controller simple y autoridad producen conjuntos distintos |
| FV-006 — estados/conteos | **CLOSED** | Conteos vigentes 98/141/146 reproducidos; históricos etiquetados |
| FV-007 — carrera del smoke | **CLOSED** | 10/10 unitarias y 20/20 smokes compilados |

## 9. Revalidación FV2-001/FV2-002

| Hallazgo | Estado | Evidencia |
| --- | --- | --- |
| FV2-001 — paths no portables | **CLOSED** | Dos roots con espacios/Unicode, cwd distinto y root relativo/absoluto dieron salida idéntica |
| FV2-002 — cobertura de paths | **CLOSED** para la fuga original | 86/86 fixtures negativos tienen path; contratos de paths 6/6; FV5-001 es una brecha semántica distinta |

## 10. Revalidación FV3-001/FV3-002

| Hallazgo | Estado | Evidencia |
| --- | --- | --- |
| FV3-001 — alias/namespace | **CLOSED técnicamente** | Matriz independiente directa/alias/namespace/wrappers y controles de binding pasó |
| FV3-002 — conteos obsoletos | **CLOSED** | 98 fixtures, 23 mutaciones, 141 pruebas arquitectónicas y 146 totales |

## 11. Revalidación FV4-001/FV4-002/FV4-003

| Hallazgo | Resultado | Evidencia |
| --- | --- | --- |
| FV4-001 — paréntesis evaden identidad | **CLOSED técnicamente** | 12/12 casos originales rechazados; matriz independiente adicional sin evasiones |
| FV4-002 — falso positivo `global: true` | **CLOSED técnicamente** | Diez formas ordinarias aceptadas; `@Global()` real rechazado |
| FV4-003 — cobertura insuficiente | **OPEN / PARCIAL** | 9/10 mutaciones de cobertura detectadas; duplicación semántica no detectada |

## 12. Casos adversariales propios

La matriz independiente se construyó copiando el `src/` real a roots
temporales y ejecutando el CLI real en modo fixture.

| Grupo | Casos | Resultado |
| --- | ---: | --- |
| Doce falsos PASS originales de FORMAL4 | 12 | 12/12 rechazados por reglas canónicas |
| Wrappers adicionales D5-R025/027/029/035/036 | 11 | 11/11 |
| D5-R026 directo/alias/namespace type-only | 3 | 3/3 |
| Shadowing, paquete ajeno y homónimos | 4 | 4/4 controles permitidos |
| Objetos ordinarios `global: true` | 2 archivos, 10 formas | 10/10 permitidas |
| Sobre-normalización | 5 formas runtime | 5/5 permitidas |
| Controles D5-R026 adicionales | 5 | 5/5 |

Las formas de sobre-normalización fueron condicional, `||`, factory,
computed property y property access ordinario. Ninguna fue confundida con
un símbolo Nest real.

## 13. Auditoría del normalizador AST

`unwrapTransparentExpression()`:

- desenvuelve iterativamente `ParenthesizedExpression`, `AsExpression`,
  `TypeAssertionExpression`, `NonNullExpression`, `SatisfiesExpression` y
  `PartiallyEmittedExpression`;
- usa un `Set` de nodos visitados y termina incluso ante un wrapper cíclico
  artificial;
- preserva la frontera de calls, property access, element access,
  condicionales y binarios;
- puede retirar el paréntesis exterior de `(a, b)`, pero devuelve el
  `BinaryExpression` y no atraviesa sus operandos;
- normaliza sólo la base de un namespace cuando el resolvedor espera una
  property access válida;
- conserva validación de package, símbolo importado, binding local y
  shadowing.

Prueba directa del helper: 5/5 cadenas transparentes, el wrapper
`PartiallyEmittedExpression`, 7/7 fronteras semánticas y terminación cíclica
pasaron. No se reprodujo sobre-normalización.

## 14. Auditoría D5-R027

Rechazados:

- `Global` directo;
- alias;
- namespace;
- property access del namespace;
- paréntesis simples y anidados;
- `as`, non-null y wrappers combinados.

Permitidos:

- objetos ordinarios directos y nested;
- retorno `{ global: true }`;
- argumento de función;
- `Global` como objeto ordinario;
- `global: true as const`;
- expresión parentetizada;
- clase y función homónimas;
- paquete incorrecto y símbolo shadowed.

El detector eliminado `containsTrueProperty()` no permanece en el checker.
`@Global()` importado desde `@nestjs/common` produce D5-R027.

## 15. Auditoría D5-R033

La policy declara 26 IDs: 21 fixtures y 5 mutaciones. Son únicos y todos
existen. El test vigente valida presencia, ID, fragmento de source, polaridad,
regla y existencia de un path para negativos.

| Mutación temporal | Resultado esperado | Resultado real |
| --- | --- | --- |
| Eliminar fixture D5-R025 parentetizado | FAIL | FAIL |
| Eliminar fixture D5-R027 parentetizado | FAIL | FAIL |
| Eliminar fixture D5-R029 parentetizado | FAIL | FAIL |
| Eliminar fixture D5-R035 parentetizado | FAIL | FAIL |
| Eliminar fixture D5-R036 wrapped | FAIL | FAIL |
| Invertir polaridad del control `global: true` | FAIL | FAIL |
| Cambiar D5-R035 esperado a D5-R036 | FAIL | FAIL |
| Duplicar source/path directo bajo ID de alias | FAIL | **PASS — FV5-001** |
| Neutralizar mutación D5-R025 | FAIL | FAIL por ejecución de mutación |
| Eliminar control D5-R026 | FAIL | FAIL |

Cada escenario usó una copia temporal independiente. Los hashes del fixture y
catálogo de mutaciones del repositorio fueron iguales antes y después:

```text
test/architecture-fixtures.mjs
1a518aaa20d82cbfb016972b5c201e51d24127be33bb15bb7a726146916725b5

test/architecture-remediation-mutations.mjs
ddd8f29382d61c006693e3fd0d1f3caf6d06ce203b547401616a5a9a6f2036e8
```

D5-R033 no puede declararse suficiente sólo porque el conjunto de 26 IDs sea
exacto.

## 16. Auditoría de las 36 reglas

| Regla | Consumo principal | Exposición a wrappers | Resultado |
| --- | --- | --- | --- |
| D5-R001 | Estructura/manifest externo | No | PASS |
| D5-R002 | Paths y allowlist | No | PASS |
| D5-R003 | Estructura/AST/filesystem | Decorador estructural deliberadamente exacto | PASS |
| D5-R004 | Exports y superficie | No | PASS |
| D5-R005 | Imports y paths | No | PASS |
| D5-R006 | Imports y grafo | No | PASS |
| D5-R007 | Grafo de imports | No | PASS |
| D5-R008 | Imports/capas | No | PASS |
| D5-R009 | Imports/capas/packages | No | PASS |
| D5-R010 | Imports de package | No | PASS |
| D5-R011 | Imports/paths/packages | No | PASS |
| D5-R012 | Paths | No | PASS |
| D5-R013 | Paths/nombres | No | PASS |
| D5-R014 | Imports y ownership | No | PASS |
| D5-R015 | Paths/nombres | No | PASS |
| D5-R016 | Imports en API | No | PASS |
| D5-R017 | Semántica documental | No aplicable | PASS N/A |
| D5-R018 | Metadata de export/nombre | No | PASS |
| D5-R019 | Filesystem/shared | No | PASS |
| D5-R020 | Paths/roots | No | PASS |
| D5-R021 | Revisión documental | No aplicable | PASS N/A |
| D5-R022 | Revisión de ownership | No aplicable | PASS N/A |
| D5-R023 | Clase/decorador/metadata estática | Forma deliberadamente exacta | PASS |
| D5-R024 | Imports de módulos Nest | No | PASS |
| D5-R025 | Identidad de expresión | Sí; normalizada | PASS |
| D5-R026 | Identidad/referencia/type | Sí; traversal + normalización | PASS |
| D5-R027 | Identidad de decorador | Sí; normalizada | PASS |
| D5-R028 | Revisión documental | No aplicable | PASS N/A |
| D5-R029 | Identidad/member access | Sí; base normalizada | PASS |
| D5-R030 | Revisión futura | No aplicable | PASS N/A |
| D5-R031 | Module specifiers | No | PASS |
| D5-R032 | Determinismo compuesto | Indirecta | PASS |
| D5-R033 | Cobertura compuesta | Indirecta | **FAIL — FV5-001** |
| D5-R034 | Policy documental | No aplicable | PASS N/A |
| D5-R035 | Identidad, metadata y allowlist | Sí; normalizada | PASS |
| D5-R036 | Controller + símbolos de autoridad | Sí; normalizada | PASS |

No se reprodujo otra evasión por paréntesis, alias, namespace, shadowing,
wrapper u homónimo.

## 17. Fixtures

Conteos derivados del arreglo ejecutado:

| Métrica | Resultado |
| --- | ---: |
| Fixtures totales | 98 |
| Positivos | 12 |
| Negativos | 86 |
| Negativos con path exacto | 86/86 |
| IDs semánticos en fixtures | 21 |
| Reglas directas con fixture negativo | 27/27 |

Cada fixture se ejecuta dos veces y compara exit/stdout/stderr. Los negativos
validan el conjunto completo de reglas y restringen todos los diagnósticos a
los paths declarados.

## 18. Mutaciones

| Métrica | Resultado |
| --- | ---: |
| Mutaciones base | 18 |
| Mutaciones FV4 | 5 |
| Total | 23 |
| Familias normativas | 12 |
| Rechazo/restauración canónica | 23/23 |
| Mutaciones adversariales D5-R033 detectadas | 9/10 |

Familias: D5-R003, D5-R005, D5-R007, D5-R010, D5-R019, D5-R020,
D5-R023, D5-R025, D5-R027, D5-R029, D5-R035 y D5-R036.

Las mutaciones canónicas usan copias temporales de `src/` y eliminan el
sandbox en `finally`. La neutralización temporal de una mutación fue detectada
por su ejecución real.

## 19. Gates

| Comando | Exit | Duración | Resumen |
| --- | ---: | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | 0.268 s | Already up to date |
| `pnpm run architecture` | 0 | 0.989 s | Alias real a `verify:architecture`; policy 1, tres edges |
| `pnpm run typecheck` | 0 | 1.267 s | Sin errores |
| `pnpm run build` | 0 | 1.522 s | Clean + compilación ESM |
| `pnpm test` | 0 | 37.626 s | 146/146 |
| `pnpm run test:architecture` | 0 | 44.784 s | 141/141 |
| `pnpm run verify` — 1 | 0 | 46.330 s | Gate completo PASS |
| `pnpm run verify` — 2 | 0 | 52.085 s | Gate completo PASS |

La composición de las 141 pruebas arquitectónicas es verificable:
98 fixtures + 23 mutaciones + 2 cobertura/normalizador + 6 paths + 12
policy/smoke. La suite total añade 5 pruebas baseline.

Los gates verdes no invalidan FV5-001: la mutación adversarial demuestra una
propiedad que las suites canónicas no exigen.

## 20. Determinismo

- Checker real: 20/20 exit `0`, una única combinación de
  exit/stdout/stderr.
- SHA-256 de la salida serializada:
  `841d86091b812144e9411094c3071fbe7fc97f65d3d2b26e0de2271bd6e1db02`.
- Orden observado: `access->stations, access->tenancy, stations->tenancy`.
- Archivos source observados: 10; archivos de módulo: 6; conteos estables.
- `verify`: PASS/PASS.

El checker es determinista sobre el estado evaluado. Un resultado determinista
no vuelve suficiente la cobertura semántica.

## 21. AppModule

Matriz independiente:

1. sin decorador;
2. metadata vacía;
3. metadata sin `imports`;
4. módulo faltante;
5. módulo extra;
6. duplicado;
7. metadata en variable;
8. arreglo en variable;
9. clase incorrecta;
10. clase no exportada;
11. decorador en otra clase;
12. módulo aliased.

Resultado: 12/12 rechazados por D5-R023. El control con los tres módulos
exactos reordenados fue aceptado: 13/13 casos totales.

## 22. Estructura

Matriz independiente:

- 15 inválidos: archivo ausente, vacío, whitespace, comentario simple,
  comentario multilínea, shebang/comentario, TypeScript válido sin símbolo,
  símbolo incorrecto, TypeScript inválido, directorio vacío, hidden-only,
  temporary-only, leaf nested, cadena vacía y módulo anticipatorio;
- 1 control: directorio vacío fuera del root gobernado.

Resultado: 15/15 inválidos rechazados, 1/1 control aceptado y 16/16 sandboxes
eliminados.

El árbol real contiene sólo los tres módulos autorizados y seis archivos de
módulo. No hay directorios vacíos, `.gitkeep`, temporales, `shared/` ni
`infrastructure/`.

## 23. Paths y roots

Los contratos de path canónicos pasaron 6/6. Todos los paths de diagnósticos
son relativos, normalizados y con `/`.

Se poblaron dos roots externos:

- root A con path normal;
- root B con espacios y Unicode `ñ`.

Se invocaron desde cwd distinto, desde un subdirectorio y usando root absoluto
o relativo equivalente. En conformidad, ambos devolvieron exit `0` y salida
byte-idéntica. Con un ciclo D5-R007, ambos devolvieron exit `1` y el mismo
diagnóstico:

```text
D5-R007 src/modules/stations/index.ts: dependency cycle detected:
src/modules/stations/index.ts -> src/modules/tenancy/index.ts ->
src/modules/stations/index.ts
```

SHA-256 de la salida fallida serializada:
`b55814fd4cce51e712a6e734c6b25328cf2e012f727df66f9668825b38a6f286`.
No se filtró ningún root físico.

## 24. Aliases, namespaces y shadowing

La matriz propia probó:

- imports directos, aliases y namespaces;
- `import type` y qualified types para ModuleRef;
- package correcto/incorrecto;
- binding local correcto;
- parámetros shadowed;
- imports correctos y ajenos simultáneos;
- homónimos locales;
- comentarios y strings;
- property access ordinario.

La matriz general pasó 37/37 y los cinco controles adicionales D5-R026
pasaron 5/5. Los símbolos reales fueron rechazados y los controles válidos
aceptados. No se observó regresión de D5-R026.

## 25. Smoke y build

- Smoke unitario: 10/10.
- Smoke compilado: 20/20.
- Las 20 ejecuciones compiladas tuvieron una sola salida; SHA-256
  `8da7ebd049a2d2a9580fce90dc3bd36eba1c2cd1d41ca3066beb622aa6ac3126`.
- Duración acumulada del stress compilado: 21.907 s.
- Marker, listener, shutdown y cleanup pasaron.
- `start` y `smoke:start` ejecutan `dist/main.js`; producción no ejecuta
  TypeScript directo.

Una ejecución directa deliberada sin `HOST`, `NODE_ENV` y `PORT` fue
rechazada por la configuración fail-closed. El smoke canónico inyectó estas
variables técnicas y pasó; no es un fallo de runtime.

## 26. Inspección de dist

| Control | Resultado |
| --- | --- |
| Archivos `.js` | 10 |
| Source maps | 10 |
| Extras | 0 |
| `sourcesContent` | 0 |
| Paths absolutos o `/Users/...` embebidos | 0 |
| URLs `file:` embebidas | 0 |
| Imports relativos ESM sin `.js` | 0 |

La composición emitida importa `TenancyModule`, `StationsModule` y
`AccessModule`; los `index.js` type-only son coherentes con la ausencia de
runtime funcional.

## 27. Documentación y enlaces

Se compararon `ARCHITECTURE_RULES.md`, `FIXTURES.md`, `IMPLEMENTATION.md`,
`RESULTS.md`, `EVIDENCE.md`, `TRACEABILITY_MATRIX.md`,
`FV4_REMEDIATION.md`, policy y ejecución.

Consistentes:

- 98 fixtures = 12 positivos + 86 negativos;
- 23 mutaciones en 12 familias;
- 26 contratos = 21 fixtures + 5 mutaciones;
- 141 pruebas arquitectónicas y 146 totales;
- scripts `architecture`, `verify:architecture`, `test:architecture` y
  `verify`;
- estados de gobierno y grafo.

Inconsistencia material:

- `TRACEABILITY_MATRIX.md` y FV4 presentan D5-R033 como capaz de fallar ante
  duplicación, pero FV5-001 demuestra que sólo detecta duplicados de ID, no
  duplicación semántica.

Validación del conjunto directamente relacionado: 20 Markdown, 130 enlaces
relativos, cero targets faltantes y cero fences desbalanceados. No hubo
trailing whitespace y `git diff --check` pasó antes del dictamen.

`FORMAL_VERIFICATION_4.md` conserva SHA-256
`e2603b6842bad4f99dafe620a838bbf1383222a8ea5cd3906b82411d9b0595d7`.

## 28. Preservación SHA-256

Antes de crear este dictamen, las 60 rutas del preflight coincidían 60/60 con
sus hashes originales. La huella agregada ordenada permaneció:

```text
d2524ad1a8e9c1d8cd800f1d98745bbf42489e56077411beba9b8ccf4cb9cca7
```

El manifiesto individual del preflight fue:

| Ruta | Estado inicial | SHA-256 |
| --- | --- | --- |
| `architecture/dec-005-policy.json` | `??` | `0a792f7afdf4587a573b6cf6436270e5582aa4208200ecf8aee2003962cff28d` |
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
| `docs/architecture-readiness/dec-005-materialization/ARCHITECTURE_RULES.md` | `??` | `ebab2921a95e92da57c0cfade33bb2d003673f7e380b53c8ec4829d3bacd5e4f` |
| `docs/architecture-readiness/dec-005-materialization/DEPENDENCY_GRAPH.md` | `??` | `f2e292b70c04df9f59f7b6333a601a7a2ee96631c656cb872b09667e041ac3b2` |
| `docs/architecture-readiness/dec-005-materialization/EVIDENCE.md` | `??` | `eeed2da0df1b0ec7475e062d4a77a79942b59af0c2e4347eb39f8a8124ce997a` |
| `docs/architecture-readiness/dec-005-materialization/FIXTURES.md` | `??` | `f46b1e806e0207fcc4ea78d45fb29fcaf6d530382f03205c3f508a11399a4ecf` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_2.md` | `??` | `2a10c6f02ae9da84d4c4888f165b686c2d84daf0c1d92311d61a29114f3e1eb7` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_3.md` | `??` | `f842e3f1b6be0a320513ff169716a7b7f244e3822273fdf6d96a891409fb4b82` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_4.md` | `??` | `e2603b6842bad4f99dafe620a838bbf1383222a8ea5cd3906b82411d9b0595d7` |
| `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION.md` | `??` | `5e666e9f5067dace3191277f31482306e5857dd2ffeec1cf5f34291c68a05fa1` |
| `docs/architecture-readiness/dec-005-materialization/FV2_REMEDIATION.md` | `??` | `a6de1cb9172156c883762baba714c06e29a1ac45674c132afee6f3b893014292` |
| `docs/architecture-readiness/dec-005-materialization/FV3_REMEDIATION.md` | `??` | `08060313b3d7e82554a603ae775c0f0a2f4098bb968a357816b1e5f4b9347269` |
| `docs/architecture-readiness/dec-005-materialization/FV4_REMEDIATION.md` | `??` | `d11f217c04a05fc0a382085fa8b3c0136f47b563a41c4d4051b85a86b396d8b9` |
| `docs/architecture-readiness/dec-005-materialization/IMPLEMENTATION.md` | `??` | `47ad3610e47b812208b23e22e335562a4197186b377cb96eee9b305e476e2cd7` |
| `docs/architecture-readiness/dec-005-materialization/OWNERSHIP.md` | `??` | `5431902937ca8a085d243c0d1db44e9d71060e2cf48ecaac7b345bfb627d712b` |
| `docs/architecture-readiness/dec-005-materialization/REMEDIATION.md` | `??` | `bf45f2220105661caeb9b07934cf5205aa8f6324caf6d741a06b8933f09b822b` |
| `docs/architecture-readiness/dec-005-materialization/RESULTS.md` | `??` | `f7fae89d94e463de23cd66d9bbce8a1f494bf4d34601a59cbce49cf8c19abf18` |
| `docs/architecture-readiness/dec-005-materialization/TRACEABILITY_MATRIX.md` | `??` | `6c00b012de94f48bbbc7bf762827da145fd4ff7b49de5a21fbc1687d4c76d01e` |
| `docs/architecture-readiness/NEXT_R0_GATE_ASSESSMENT.md` | `??` | `ae8f2a4269172831b1eae8eb1a01ca884fb6b43bdcaafd40556ad73dc0e61fba` |
| `docs/architecture-readiness/repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md` | ` M` | `cdd796876889b764810c7d98c23e846cbae0ce9e17b9fd63e7321235d0a7c46d` |
| `docs/architecture-readiness/repair-mvp/ESTADO_DE_PREPARACION_ARQUITECTONICA.md` | ` M` | `a83e7c2f1ad8f196b3bc58c259789ab208119091fed74196819ea2bf81300ce1` |
| `docs/architecture-readiness/repair-mvp/README.md` | ` M` | `dd054c3e564651db04d263fceae3a0efc745a05e693da8a2613834e6edfc51c9` |
| `docs/architecture-readiness/repair-mvp/TRAZABILIDAD.md` | ` M` | `bf7d80ebb1aa0e1a908ad42f4531799e5176e3568ba92245639d2a237d5c0063` |
| `docs/backlog/DEPENDENCY_MAP.md` | ` M` | `a9e397a7a37054070bda608878f8e003bd8efb9a0c3aa89367ed17296c53a05e` |
| `docs/backlog/EPICS.md` | ` M` | `794b14780a7abcf69f47c5607ad0d32d03276f7357b0129718aff23e542dad18` |
| `docs/backlog/pbis/PBI-022.md` | `??` | `a2fd5df77321723e2c00b2dd86918b569033a6d94d978f976df0fa4ba387baca` |
| `docs/backlog/pbis/README.md` | ` M` | `d8ab4623d5ebe44595cf26c07f7ca29c868b80f6c08d5de1d32c84c25f8c0bc1` |
| `docs/backlog/PRODUCT_BACKLOG.md` | ` M` | `122a7f1cb41ac23b0a9baf4c7bade0f8040978e6fa8f5409a1e4cd3317f15774` |
| `docs/backlog/README.md` | ` M` | `4f3f315b7450a803ea7d7f6cee9392222730173162c1dd0a475da1fc1d0f971c` |
| `docs/decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md` | `??` | `47af5209d4dba125d256f500d8d4c28a6199bf086856285b8c2326815d24d04f` |
| `docs/decisions/dec-005-modular-monolith-organization/FORMAL_REVIEW.md` | `??` | `6ee52a3ac5ca5eadd59befc474ea9ba8b435765bdf31b5b9f9196670aba3d3f1` |
| `docs/decisions/dec-005-modular-monolith-organization/RESULTS.md` | `??` | `6699aa9dac4f15675074b3c336269a5fd5843976b6b954e39a4dce539a36e28d` |
| `package.json` | ` M` | `b14a00abe9b2473613fd973d4499d853ea3a6fe4a5f5e624093f462e6199e469` |
| `scripts/check-architecture.mjs` | `??` | `f61daeb59dc0b3b44cd0b04beb1ac73f3d36ff6741ba0a20d6dcc2bc2a6c7dbd` |
| `scripts/lib/architecture-checker.mjs` | `??` | `68c4caf564935d1316914bceda0167f35ef8d3bf70dc23088c3be068c4ab5710` |
| `scripts/smoke-start.mjs` | ` M` | `7a220c7c8f4b4e10f02f911c2c687f4c568db9ea063c46623c39f3995419a401` |
| `src/app.module.ts` | ` M` | `78aa0b2472244370e98e5ee7d6c09692d102ceaa08171db8977f8be97ea1124e` |
| `src/modules/access/access.module.ts` | `??` | `0297941ad97b0d8d78429e58f6a05fe9c4cb932e1f76a8ecff3e83629924735e` |
| `src/modules/access/index.ts` | `??` | `70d294e1bc4f4667e5d37fe35f5f3e57eb977d9cdb3bca63b412aa8997203d36` |
| `src/modules/stations/index.ts` | `??` | `7ad32c1ae59fbff5e35d2af2a2cb2f2e7421779a7749274d7d4b29b80cd19425` |
| `src/modules/stations/stations.module.ts` | `??` | `182d02b073baa31f45ef351f55b478ab794ed4f0a696ddb25ac11819d96adaa1` |
| `src/modules/tenancy/index.ts` | `??` | `a1e6dccd34154b173a7cfcaba5f3a71af7ae2dcf2e403f16c341d7bb30cf09a1` |
| `src/modules/tenancy/tenancy.module.ts` | `??` | `dd01263007b5212bdfde60fc5d5dccb7bb67d364c046ef6438697af18c0c4dc8` |
| `test/architecture-coverage.test.mjs` | `??` | `be550ba6c77c212d4774b838dc44e37abf9e416819c01da8eaf720e28efdf87a` |
| `test/architecture-fixtures.mjs` | `??` | `1a518aaa20d82cbfb016972b5c201e51d24127be33bb15bb7a726146916725b5` |
| `test/architecture-fixtures.test.mjs` | `??` | `36a01a6d055f19e38f9228049450f62a042f2c1893403a64d68c2e4ab7097f05` |
| `test/architecture-mutations.test.mjs` | `??` | `757e0805e1004fa65a2032a48439dcedeb95745e918d0d3f1a8e1f58827a0a77` |
| `test/architecture-paths.test.mjs` | `??` | `31578b83b35df3b2a8e3338d79334f679490b3bd44d9f9e18611cfaea27d1096` |
| `test/architecture-policy.test.mjs` | `??` | `1afe849f5d4dd30f00fa2fd0b476fa1e192981e87ca7c0bc5ebab4563e7f1894` |
| `test/architecture-remediation-mutations.mjs` | `??` | `ddd8f29382d61c006693e3fd0d1f3caf6d06ce203b547401616a5a9a6f2036e8` |
| `test/architecture-support.mjs` | `??` | `e2515ddd5a45cd72e926adb8a2c6cb228a40041d8530466ea43b3010c4ce7ab1` |

Las mutaciones externas se eliminaron y no generaron una ruta versionable.

## 29. Estado Git final

El control posterior a la escritura confirmó:

- rama `main`;
- HEAD y `origin/main` en
  `be1fe5a774b3437063b86e6ff16920131e502079`;
- divergencia `0 0`;
- índice vacío; `git diff --cached --quiet` devolvió `0`;
- las 60 rutas preexistentes byte-idénticas, 60/60 hashes coincidentes;
- una única ruta adicional atribuible a esta revisión:
  `docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_5.md`;
- cero temporales DEC-005/FV5 y cero procesos de checker, smoke, tests o
  `verify` atribuibles a esta revisión;
- `git diff --check` y trailing whitespace en PASS.

## 30. Acciones no realizadas

No se realizó:

- remediación;
- cambio de checker, fixture, mutación, policy, package o estado;
- commit, push, PR, merge, rebase, tag, stash, reset o clean;
- CI, deploy o SSH;
- DB, SQL o migraciones;
- cambio funcional;
- modificación de documentación distinta de este dictamen.

## 31. Estados finales autorizados

Por resultado FAIL se conservan:

- DEC-005: `Accepted — Materialized / Formal Verification Pending`;
- PBI-022: `In review`;
- DEC-049: abierta y bloqueada;
- R0: no autorizado;
- Sprint 00: abierto.

DEC-044, DEC-050, DEC-051, DEC-063 y los remanentes de DEC-004 permanecen
independientes y sin resolución por esta tarea.

## 32. Conclusión

La remediación FV4 corrigió la identidad parentetizada y el falso positivo
`global: true`. El checker, wrappers, D5-R026, roots, paths, estructura,
`AppModule`, build, smoke, determinismo y gates nominales funcionan.

No obstante, D5-R033 aún permite una cobertura nominalmente completa pero
semánticamente duplicada. La quinta reverificación no puede dictaminar
DEC-005 como `Formally Verified`.

**Resultado final: FAIL.**

## 33. Siguiente acción

Ejecutar una remediación acotada de PBI-022 que:

1. cierre FV5-001 haciendo verificable la correspondencia semántica entre ID,
   source, path y variante, no sólo su unicidad nominal;
2. incluya una mutación permanente que duplique la evidencia semántica y deba
   fallar;
3. preserve el checker, la separación canónica D5-R035/D5-R036 y todos los
   gates ya conformes;
4. repita una sexta reverificación formal independiente antes de promover
   DEC-005 o avanzar DEC-049.
