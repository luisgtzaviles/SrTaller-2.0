# Tercera reverificación formal independiente de DEC-005 y PBI-022

## 1. Fecha

- **Fecha:** 2026-07-23.
- **Objeto:** materialización local de DEC-005 mediante PBI-022, después de
  [FV2_REMEDIATION.md](FV2_REMEDIATION.md).

## 2. Rol y alcance independiente

Esta revisión actuó desde Arquitectura e Ingeniería como verificador
independiente. Inspeccionó directamente decisión, PBI, policy, checker,
fixtures, mutaciones, código de producto, artefactos compilados y expediente
documental. Los resultados de implementación y remediación se trataron como
evidencia por refutar, no como aprobación.

No se corrigió código, tests, fixtures, documentación canónica ni estados. No
se ejecutaron commit, push, PR, merge, rebase, tag, CI, deploy, base de datos,
SQL o migraciones.

## 3. Baseline Git

| Control | Resultado |
| --- | --- |
| Rama | `main` |
| HEAD | `be1fe5a774b3437063b86e6ff16920131e502079` |
| `origin/main` | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia `HEAD...origin/main` | `0 0` |
| Índice inicial | Vacío |
| `git diff --check` inicial | PASS |
| Entorno | Local únicamente |

## 4. Estado inicial del working tree

El árbol ya estaba dirty antes de esta actividad: 54 rutas preexistentes
correspondientes al expediente no versionado de DEC-005/PBI-022. Se calculó
una huella agregada, excluyendo este dictamen:

```text
b86f84d194fa2617fb9006c5f80935df96f4cf917db625e04ac259a7ca5eb209
```

El índice estaba vacío y `FORMAL_VERIFICATION_3.md` no existía. No había
temporales DEC-005 del proyecto ni procesos `dist/main.js`,
`smoke-start.mjs`, `check-architecture.mjs` o `pnpm run verify` atribuibles a
la tarea. Los procesos Node preexistentes correspondían a aplicaciones locales
legítimas y no se intervinieron.

## 5. Dictamen

**FAIL — DEC-005 FORMAL REVERIFICATION**

Los gates canónicos, paths, dos roots, determinismo, estructura, composición y
smoke pasan. Sin embargo, la prueba adversarial independiente encontró falsos
PASS reproducibles mediante aliases y namespace imports en D5-R027, D5-R029,
D5-R035 y D5-R036. Además, los conteos vigentes del paquete canónico no fueron
actualizados después de FV2. Existe un Blocker y un Major nuevos; por contrato,
DEC-005 no puede avanzar.

## 6. DEC005-C01 a DEC005-C05

| Condición | Resultado | Evidencia independiente |
| --- | --- | --- |
| DEC005-C01 | **FAIL** | El checker es determinista y sus casos declarados pasan, pero aliases válidos de `Global`, `Scope` y `Controller`, además de namespace imports Nest, reciben exit `0`. La evidencia canónica también conserva conteos anteriores a FV2. |
| DEC005-C02 | **PASS** | Existen exactamente seis artefactos de módulo; 15 formas estructurales inválidas fueron rechazadas, un directorio externo al root gobernado fue aceptado y 16/16 restauraciones pasaron. |
| DEC005-C03 | **PASS** | Ownership, superficies, consumidores, policy y grafo coinciden con el source real. Los dos roots producen el mismo diagnóstico para evidencia faltante. |
| DEC005-C04 | **PASS** | `src/shared/` permanece ausente y no existen admisiones o excepciones silenciosas. |
| DEC005-C05 | **PASS** | No apareció funcionalidad, persistencia, CI o deploy; DEC-004/044/049/050/051/063 conservan autoridad; R0 no está autorizado y Sprint 00 sigue abierto. |

## 7. Hallazgos históricos

| Hallazgo | Estado | Reproducción |
| --- | --- | --- |
| FV-001 — copias `* 2.*` de SPIKE-009 | **CLOSED** | No existe ninguna copia y los originales protegidos no tienen diff. |
| FV-002 — vacíos aceptados | **CLOSED** | Archivos vacíos, whitespace, comentarios, TypeScript inválido y directorios vacíos se rechazaron. |
| FV-003 — composición ficticia de `AppModule` | **CLOSED** | 12/12 mutaciones independientes fueron rechazadas con D5-R023 y path exacto; 12/12 restauraciones pasaron. |
| FV-004 — D5-R029 sin prueba | **CLOSED** | Fixture y mutación nominales existen; infracción `Scope.REQUEST` directa se rechaza. La evasión por alias es FV3-001. |
| FV-005 — D5-R036 no distinguible | **CLOSED** | Los casos nominales separan D5-R035 de D5-R036. La evasión por alias/namespace es FV3-001. |
| FV-006 — documentación contradictoria | **REGRESSED** | Los estados siguen coherentes, pero documentos canónicos afirman 57/82/87 frente a 58/89/94 reales. Se registra como FV3-002. |
| FV-007 — carrera de smoke | **CLOSED** | 10/10 unitarias, 20/20 smokes compilados y cleanup sin procesos residuales. |
| FV2-001 — paths no relativos/sanitizados | **CLOSED** | Cuatro ramas críticas produjeron paths repository-relative idénticos bajo dos roots distintos. |
| FV2-002 — cobertura insuficiente de paths | **CLOSED** | 55/55 fixtures negativos y 13/13 mutaciones exigen path exacto; la suite aislada pasa 6/6. |

## 8. Hallazgos nuevos

### FV3-001 — Blocker — aliases y namespace imports evaden reglas ejecutables

La detección no resuelve el binding importado:

- `Global as ProcessGlobal` con `@ProcessGlobal()` recibe exit `0` en lugar de
  D5-R027;
- `Scope as NestScope` con `NestScope.REQUEST` recibe exit `0` en lugar de
  D5-R029;
- `Controller as HttpController` y `Get as HttpGet`, en un archivo cuyo nombre
  no termina en `.controller.ts`, reciben exit `0` en lugar de
  D5-R035/D5-R036;
- `import * as Nest` con `@Nest.Controller()` y `@Nest.Get()` recibe exit `0`
  en lugar de D5-R035/D5-R036.

Son sintaxis ESM/TypeScript ordinarias, no aliases de `tsconfig`, loaders o
imports calculados. La causa es que
[`architecture-checker.mjs`](../../../scripts/lib/architecture-checker.mjs)
combina nombres AST literales con expresiones regulares, sin seguir named
bindings o namespace bindings para esos decoradores y valores.

**Impacto:** DEC005-C01, D5-R027, D5-R029, D5-R033, D5-R035 y D5-R036.

**Remediación requerida:** resolver mediante AST el símbolo importado para
named aliases y namespace members, preservar la separación D5-R035/D5-R036 y
agregar fixtures/mutaciones aislados con regla, path, exit, restauración y
variantes inocuas. No debe relajarse ninguna regla ni resolverse dentro de esta
reverificación.

### FV3-002 — Major — conteos canónicos posteriores a FV2 son inconsistentes

La realidad reproducida es 58 fixtures, 3 positivos, 55 negativos, 89 pruebas
arquitectónicas y 94 totales. Sin embargo:

- [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md) declara 57 fixtures;
- [FIXTURES.md](FIXTURES.md) declara 57, con 3 positivos y 54 negativos;
- [IMPLEMENTATION.md](IMPLEMENTATION.md) declara 57, con 3 positivos y 54
  negativos;
- [RESULTS.md](RESULTS.md) declara 54/54 negativos y usa 57 en DEC005-C01;
- [EVIDENCE.md](EVIDENCE.md) conserva 82 pruebas arquitectónicas y 87 totales
  como si fueran el resultado vigente.

[FV2_REMEDIATION.md](FV2_REMEDIATION.md) sí registra 58/89/94, pero no elimina
la contradicción con el paquete canónico presentado como remediado. La
evidencia queda ambigua y el hallazgo no puede clasificarse Minor.

**Remediación requerida:** reconciliar los documentos canónicos con conteos
derivados del source y agregar una comprobación semántica que no se limite a
presencia de strings. Los FAIL históricos deben conservar sus cifras
históricas.

## 9. Revisión D5-R001 a D5-R036

| Regla | Resultado | Evidencia o límite |
| --- | --- | --- |
| D5-R001 | PASS | `verify:structure` y manifest confirman una app/artefacto. |
| D5-R002 | PASS | Allowlist exacta de `access`, `stations`, `tenancy`. |
| D5-R003 | PASS | 15 inválidos estructurales rechazados; paths exactos. |
| D5-R004 | PASS | Tres `index.ts`, exports exactos y fixture de superficie. |
| D5-R005 | PASS | Deep import rechazado en fixture y mutación. |
| D5-R006 | PASS | Grafo divergente e inverso rechazados; path `src/modules`. |
| D5-R007 | PASS | Ciclo rechazado; diagnóstico portable entre dos roots. |
| D5-R008 | PASS | Dominio hacia aplicación rechazado. |
| D5-R009 | PASS | Aplicación hacia infraestructura rechazada. |
| D5-R010 | PASS | NestJS en dominio/aplicación rechazado por specifier. |
| D5-R011 | PASS | Presentación hacia repository rechazada. |
| D5-R012 | PASS | Port fuera de aplicación rechazado. |
| D5-R013 | PASS | Adapter en dominio rechazado. |
| D5-R014 | PASS | Acceso a internals ajenos rechazado. |
| D5-R015 | PASS | DTO HTTP fuera de presentación rechazado. |
| D5-R016 | PASS | Contrato público NestJS rechazado. |
| D5-R017 | PASS por no aplicabilidad | No existen eventos públicos; revisión semántica preservada. |
| D5-R018 | PASS | Entidad/agregado nominal público rechazado. |
| D5-R019 | PASS | `shared` ausente; contenido temporal rechazado. |
| D5-R020 | PASS | Cinco roots globales prohibidos cubiertos. |
| D5-R021 | PASS por no aplicabilidad | No existen utilidades candidatas. |
| D5-R022 | PASS por no aplicabilidad | No existe infraestructura funcional. |
| D5-R023 | PASS | 12/12 AppModule adversariales rechazados; alias de módulo rechazado. |
| D5-R024 | PASS | Módulo Nest importado fuera de `AppModule` rechazado. |
| D5-R025 | PASS | `forwardRef` rechazado. |
| D5-R026 | PASS | `ModuleRef` rechazado. |
| D5-R027 | **FAIL** | `Global as ProcessGlobal` con `@ProcessGlobal()` produce falso PASS. |
| D5-R028 | PASS por no aplicabilidad | No existen dynamic modules. |
| D5-R029 | **FAIL** | `Scope.REQUEST` directo se rechaza; `NestScope.REQUEST` por alias produce falso PASS. |
| D5-R030 | PASS por no aplicabilidad | No existen casos de uso. |
| D5-R031 | PASS | Extensión NodeNext ausente se rechaza y typecheck pasa. |
| D5-R032 | PASS acotado | 20 corridas nominales son idénticas; determinismo no corrige falsos PASS. |
| D5-R033 | **FAIL** | 27/27 reglas tienen fixture nominal, pero no existen casos para las evasiones FV3-001. |
| D5-R034 | PASS | No existen excepciones. |
| D5-R035 | **FAIL** | Controller ordinario se rechaza; decorators aliased/namespace producen falso PASS. |
| D5-R036 | **FAIL** | Caso nominal es distinguible; decorators aliased/namespace omiten la decisión de autoridad. |

## 10. Contrato de paths

La frontera única
`toRepositoryRelativePath(projectRoot, path)`:

1. relativiza una entrada absoluta exactamente una vez;
2. preserva una entrada ya relativa sin resolverla contra cwd;
3. normaliza separadores y segmentos con forma POSIX;
4. rechaza vacío, `.`, root, escapes `..`, paths externos, drive absoluto,
   UNC y `file:`;
5. conserva directorio y basename, sin recortar a basename;
6. emite errores sin filtrar el valor rechazado.

D5-R003, D5-R006, D5-R007 y DEC005-C03 producen los paths exactos esperados.
D5-R033 cubre actualmente 55/55 paths negativos y 13/13 paths de mutaciones.

## 11. Pruebas adversariales de paths

Se ejecutó un harness efímero externo al repositorio mediante:

```text
node --input-type=module - <<'NODE'
```

Resultado:

| Caso | Resultado |
| --- | --- |
| Módulo requerido faltante | D5-R003, `src/modules/access`, exit `1` |
| Ciclo | D5-R007, `src/modules/stations/index.ts`, exit `1` |
| Grafo observado divergente | D5-R006, `src/modules`, exit `1` |
| Evidencia requerida faltante | DEC005-C03, path documental relativo, exit `1` |
| Path relativo válido | PASS |
| Path absoluto dentro del root | PASS y conversión relativa |
| Path absoluto externo / root similar | Rechazados |
| `../escape` y escape normalizado | Rechazados |
| Drive Windows y UNC | Rechazados |
| `file:` | Rechazado |
| Separadores mixtos | Normalizados |
| Mismo basename en dos directorios | Paths distintos preservados |
| Cwd distinto al root | Evidencia idéntica |
| Root con espacios | PASS |
| Root con Unicode | PASS |
| Vacío, `.`, root sin artefacto | Rechazados |

Fueron 16 contratos directos más las cuatro ramas del checker. El entorno
macOS soportó espacios y Unicode sin limitación.

## 12. Comparación independiente entre dos roots

Se usaron `<temp-root-a>` y `<temp-root-b>`, con cwd `<temp-cwd>`, y se
eliminaron al terminar.

| Rama | SHA-256 de status/stdout/stderr idéntico en ambos roots |
| --- | --- |
| D5-R003 — módulo faltante | `ba534ad08edfef2e94e46d453b8fd96202f8e4903d1cbe6c66d65b648be7a072` |
| D5-R007 — ciclo | `b811ad511006f53b5804e005cf843c0ff0ddcb4cf6c124b65b3544ff40d9207f` |
| D5-R006 — grafo divergente | `4f2dd750fe605ba59c978f09739eaab0554f9989b618d9720ff4750f709e763a` |
| DEC005-C03 — evidencia faltante | `af0317307b502acb31ac6875459927b658262c8c56521a143f2ad2c21856b58b` |

No hubo diff de evidencia ni filtración de los roots físicos. Cleanup: PASS.

## 13. Cobertura recalculada de fixtures y paths

| Métrica | Resultado real |
| --- | ---: |
| Fixtures | 58 |
| Positivos | 3 |
| Negativos | 55 |
| Negativos con `expectedText` | 55/55 |
| Negativos con `expectedPath` | 55/55 |
| Reglas directas con fixture | 27/27 |
| Reglas externas | 1 |
| Reglas compuestas | 2 |
| Reglas documentales/no aplicables | 6 |
| Total D5 | 36 |
| Pruebas arquitectónicas | 89/89 PASS |
| Pruebas totales | 94/94 PASS |

La cobertura declarada ejecuta el checker real y no duplica su algoritmo. Es
insuficiente frente a FV3-001 porque carece de aliases/namespace variants.

## 14. Mutaciones y familias

Se reprodujeron las 13 mutaciones en 11 familias normativas:

```text
D5-R003, D5-R005, D5-R007, D5-R010, D5-R019, D5-R020,
D5-R023, D5-R025, D5-R029, D5-R035, D5-R036
```

Las 13 fueron rechazadas, 13/13 validaron path exacto y 13/13 restauraciones
volvieron a exit `0`. Doce produjeron una única regla esperada; la mutación de
autoridad produjo intencionalmente D5-R035 y D5-R036. No hubo reglas
accidentales ni residuo.

## 15. AppModule

Comando focalizado:

```text
node --test --test-name-pattern='AppModule|AppModule metadata composition' test/architecture-fixtures.test.mjs test/architecture-mutations.test.mjs
```

Resultado permanente: 9/9 PASS. La matriz independiente ejecutó 12 variantes:
sin decorador, metadata vacía, arreglo vacío, faltante, extra, duplicado,
metadata variable, arreglo variable, clase incorrecta, clase no exportada,
decorador en otra clase y alias de módulo. Todas recibieron D5-R023 en
`src/app.module.ts`; 12/12 restauraciones pasaron. Reordenar el conjunto
estático fue aceptado, correctamente, porque el orden no es normativo.

## 16. Casos estructurales

Comando focalizado:

```text
node --test --test-name-pattern='required module|empty|whitespace|comments|public barrel|public symbol|declaration incorrect|directory containing|additional module' test/architecture-fixtures.test.mjs
```

Resultado focalizado: 16/16 PASS.

La matriz independiente tuvo 16 casos: 15 inválidos rechazados y un directorio
vacío fuera del root gobernado aceptado. Incluyó inexistente, vacío,
whitespace, comentarios de una/múltiples líneas, shebang sin declaración,
TypeScript válido sin símbolo, nombre incorrecto, TypeScript inválido,
directorios vacíos/hidden/temporales/anidados, cadena vacía y módulo adicional.
Las 16 restauraciones pasaron.

El primer intento del harness independiente dejó un padre temporal vacío al
retirar un archivo oculto; el checker lo rechazó correctamente. Se corrigió
sólo el cleanup del script efímero y se repitieron los 16 casos completos. El
repositorio nunca fue mutado.

## 17. D5-R029, D5-R035 y D5-R036

Comando focalizado:

```text
node --test --test-name-pattern='request scope|controller decides|controller final|unauthorized controller|unauthorized endpoint' test/architecture-fixtures.test.mjs test/architecture-mutations.test.mjs
```

Resultado nominal: 6/6 PASS.

La matriz independiente confirmó:

- D5-R029 directa: rechazada;
- comentarios, strings e identificadores semejantes: sin falso positivo;
- controller ordinario: sólo D5-R035;
- controller con `authorize`: D5-R035 y D5-R036;
- palabras reservadas sólo en comentario/string de un controller: D5-R035,
  no D5-R036;
- clase no-controller con `authorize`: sin D5-R035/D5-R036.

Las variantes aliased y namespace descritas en FV3-001 produjeron falsos PASS.

## 18. Ownership, APIs y grafo

El material contiene exactamente tres archivos de API pública y tres archivos
Nest de composición:

| Módulo | Export público | Consumidores | Dependencias |
| --- | --- | --- | --- |
| `tenancy` | `TenancyModuleContract` | `stations`, `access` | Ninguna |
| `stations` | `StationsModuleContract` | `access` | `tenancy` |
| `access` | `AccessModuleContract` | `AppModule` en compile time | `stations`, `tenancy` |

Los tres exports son interfaces type-only. Todos los imports intermodulares de
los `index.ts` son `import type`, usan la superficie pública y no importan
NestJS. [OWNERSHIP.md](OWNERSHIP.md),
[DEPENDENCY_GRAPH.md](DEPENDENCY_GRAPH.md) y la
[policy](../../../architecture/dec-005-policy.json) coinciden con el source.

Grafo declarado y observado:

```text
access -> stations
access -> tenancy
stations -> tenancy
```

No existen ciclos, edges inversos, deep imports, APIs runtime intermodulares,
personas inventadas ni ownership físico de datos anticipado.

## 19. Toolchain

| Herramienta | Versión |
| --- | --- |
| Node.js | `v24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |

Todos los comandos se ejecutaron con
`PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.

## 20. Gates y comandos

| Comando | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS; lockfile vigente |
| `pnpm run verify:architecture` | PASS; policy 1, tres edges |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run test:architecture` | PASS, 89/89 |
| `pnpm test` | PASS, 94/94 |
| `pnpm run verify`, corrida 1 | PASS, 94/94 y gates |
| `pnpm run verify`, corrida 2 | PASS, 94/94 y gates |
| `node --test test/architecture-paths.test.mjs` | PASS, 6/6 |
| `node --test --test-name-pattern='smoke readiness' test/architecture-policy.test.mjs` | PASS, 10/10 |
| `pnpm run smoke:start` | PASS |
| `git diff --check` | PASS antes de emitir el dictamen |

Los gates verdes no cubren las variantes FV3-001 y por ello no justifican PASS
formal.

## 21. Determinismo

Veinte ejecuciones consecutivas del checker real tuvieron exit `0` y una única
salida byte a byte:

```text
d9bac7c6d7d657d7b84212d3a5ef3d12d8d714fd36e8e6bb6f19300aa8507fe7
```

Las dos ejecuciones completas de `pnpm run verify` pasaron. Los fixtures
comparan dos ejecuciones por caso. Los cuatro fallos entre dos roots también
fueron byte-idénticos.

## 22. Smoke unitario y compilado

- Coordinador unitario: 10/10 PASS para orden de señales, mismo turno, chunks,
  stderr, terminación, timeout y cleanup.
- `pnpm run smoke:start`: PASS.
- Stress independiente: 20/20, detención al primer fallo, sin reintentos.
- Las 20 salidas fueron idénticas, SHA-256:
  `c4949ec84c4b0b63fbd3c082c9621b403e7ecdf18ddc7a8201df7f28244152d0`.
- No quedaron child processes, sockets de prueba o listeners observables.

## 23. Cleanup y restauración

- 13/13 mutaciones restauradas.
- 12/12 AppModule restauradas.
- 16/16 casos estructurales restaurados.
- Dos roots y todos los sandboxes externos eliminados en `finally`.
- Búsqueda de `srtaller-dec005-*` y `dec005-*`: sin resultados.
- Sin procesos huérfanos de checker, verify, smoke o `dist/main.js`.
- Índice Git vacío.
- La huella de las 54 rutas dirty preexistentes permaneció
  `b86f84d194fa2617fb9006c5f80935df96f4cf917db625e04ac259a7ca5eb209`.
- El único delta de esta actividad es este dictamen.

## 24. Artefactos compilados

`dist/` contiene diez archivos JavaScript y diez source maps. Se verificó:

- metadata runtime de `AppModule`:
  `TenancyModule`, `StationsModule`, `AccessModule`;
- imports ESM relativos `.js`;
- módulos Nest mínimos sin providers/controllers funcionales;
- los tres `index.js` emiten `export {}`, coherente con APIs type-only;
- 10/10 source maps sin `sourcesContent` y sin source paths absolutos;
- arranque de `dist/main.js` desde `<temp-cwd>`, marker, listener y shutdown:
  PASS.

El checker es JavaScript ESM ejecutado directamente y está fuera de
`tsconfig.build`; no existe artefacto compilado del checker que comparar. Su
runtime real fue el utilizado en todas las pruebas.

## 25. Consistencia documental

PASS:

- los dos FAIL previos permanecen históricos;
- REMEDIATION y FV2_REMEDIATION se presentan como PASS técnicos, no
  aprobaciones;
- DEC-005 sigue Formal Verification Pending;
- PBI-022 sigue `In review`;
- DEC-049 no avanzó;
- R0 no está autorizado;
- Sprint 00 sigue abierto;
- la única coincidencia `/Users/` es el ejemplo sanitizado
  `/Users/<local-user>/` del FAIL histórico;
- los literales Windows y `file:` restantes son inputs negativos de tests, no
  output activo.

FAIL:

- los conteos canónicos vigentes son incompatibles con source y TAP, según
  FV3-002.

## 26. Limitaciones

Permanecen las limitaciones ya declaradas para imports calculados, reflexión,
generación, loaders, semántica de hechos, mutabilidad efectiva y vocabulario
de autoridad fuera de policy. El checker continúa siendo enforcement local
transitorio hasta DEC-051.

La evasión por named aliases o namespace imports no queda aceptada como una
limitación: es sintaxis estática ordinaria, totalmente analizable por AST, y
viola reglas Blocker presentadas como ejecutables.

## 27. Estados finales preservados

- DEC-005: `Accepted — Materialized / Formal Verification Pending`.
- PBI-022: `In review`.
- DEC-049: abierta y bloqueada.
- R0: no autorizado.
- Sprint 00: abierto.

No se registra `Verified`, `Done`, `Complete` o `Closed`.

## 28. Siguiente acción

Ejecutar una remediación acotada de PBI-022 para:

1. cerrar FV3-001 con resolución AST de named aliases y namespace imports para
   D5-R027/D5-R029/D5-R035/D5-R036;
2. agregar casos positivos, negativos y mutaciones con path exacto,
   restauración y determinismo;
3. cerrar FV3-002 reconciliando 58/89/94 en la documentación canónica, sin
   reescribir cifras históricas;
4. repetir una verificación formal independiente completa.

DEC-005 y PBI-022 no son elegibles para promoción/cierre mientras estos
hallazgos permanezcan abiertos. DEC-049 continúa bloqueada. Esta
reverificación no realiza ninguna promoción.
