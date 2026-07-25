# Segunda verificación formal independiente de DEC-005 y PBI-022

## Dictamen

**FAIL — DEC-005 FORMAL REVERIFICATION BLOCKED**

- **Fecha:** 2026-07-22.
- **Autoridad de revisión:** Arquitectura + Ingeniería.
- **Objeto:** materialización local de DEC-005 mediante PBI-022, después de la
  remediación documentada.
- **DEC-005 antes/después:** `Accepted — Materialized / Formal Verification Pending`.
- **PBI-022 antes/después:** `In review`.
- **Límite:** DEC-049 sigue abierta, R0 no está autorizado y Sprint 00 sigue
  abierto.

La revisión se repitió desde cero. Los siete hallazgos de la primera
[verificación formal](FORMAL_VERIFICATION.md) están remediados, los gates
técnicos pasan y el smoke compilado fue estable en 50 corridas consecutivas.
No obstante, una regresión adicional reprodujo paths no relativos ni
sanitizados en cuatro ramas del checker. Esto incumple DEC005-C01 y la regla
documentada de diagnóstico, por lo que DEC-005 no puede avanzar a `Verified`
ni PBI-022 a `Done`.

## Independencia y fuentes

Se inspeccionaron directamente la policy, el checker, sus pruebas, el shell,
el árbol de módulos y los documentos canónicos. [REMEDIATION.md](REMEDIATION.md),
[RESULTS.md](RESULTS.md) y [EVIDENCE.md](EVIDENCE.md) se trataron como evidencia
del implementador, no como aprobación. El FAIL histórico se conserva intacto.

Fuentes principales:

- [`architecture/dec-005-policy.json`](../../../architecture/dec-005-policy.json);
- [`scripts/lib/architecture-checker.mjs`](../../../scripts/lib/architecture-checker.mjs);
- [`scripts/check-architecture.mjs`](../../../scripts/check-architecture.mjs);
- [`scripts/smoke-start.mjs`](../../../scripts/smoke-start.mjs);
- [`test/architecture-fixtures.mjs`](../../../test/architecture-fixtures.mjs);
- [`test/architecture-fixtures.test.mjs`](../../../test/architecture-fixtures.test.mjs);
- [`test/architecture-mutations.test.mjs`](../../../test/architecture-mutations.test.mjs);
- [`test/architecture-policy.test.mjs`](../../../test/architecture-policy.test.mjs);
- [`src/app.module.ts`](../../../src/app.module.ts) y [`src/modules/`](../../../src/modules/);
- [PBI-022](../../backlog/pbis/PBI-022.md) y el expediente de
  [DEC-005](../../decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md).

## Baseline Git reproducida

| Control | Resultado |
| --- | --- |
| Rama | `main` |
| HEAD | `be1fe5a774b3437063b86e6ff16920131e502079` |
| `origin/main` | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia `HEAD...origin/main` | `0 0` |
| Índice | Vacío |
| Working tree | Dirty esperado por PBI-022 y su remediación |
| `git diff --check` inicial | PASS |
| Archivos protegidos | `src/main.ts`, `src/startup-config.ts` y `pnpm-lock.yaml` sin diff |

No se reutilizó SPIKE-009, no se modificó el lockfile y no se encontró ningún
archivo con sufijo accidental ` 2`.

## Revisión del alcance real

El árbol de producto contiene exactamente seis archivos bajo `src/modules/`:

```text
src/modules/access/access.module.ts
src/modules/access/index.ts
src/modules/stations/index.ts
src/modules/stations/stations.module.ts
src/modules/tenancy/index.ts
src/modules/tenancy/tenancy.module.ts
```

`src/shared/` y `src/infrastructure/` están ausentes. No hay archivos ni
directorios vacíos bajo el root gobernado. Las búsquedas sobre el diff y el
árbol confirmaron que no se introdujeron controllers reales, providers
funcionales, endpoints, autenticación, autorización funcional, PIN, sesiones,
persistencia, SQL, migraciones, lógica multitenant, lógica de estaciones,
lógica de reparaciones, lógica de negocio, CI, deploy, workspaces,
microservicios, aliases, loaders o roots anticipatorios. El provider técnico
preexistente del shell permanece fuera de este cambio funcional.

## Hallazgos históricos FV-001 a FV-007

| Hallazgo previo | Remediación declarada | Evidencia independiente reproducida | Resultado |
| --- | --- | --- | --- |
| FV-001 — siete copias `* 2.*`, dos divergentes | Clasificación y eliminación de las siete copias; originales preservados | `find` no encontró copias; no hay diff de SPIKE-009 | PASS |
| FV-002 — falsos PASS para archivo/directorio vacío | AST y gobierno de directorios; fixtures y mutaciones | 15 escenarios obligatorios más sintaxis inválida; todos rechazados salvo el directorio externo, correctamente ignorado; restauración PASS | PASS |
| FV-003 — `AppModule` no comprobaba composición real | Detector AST de clase, decorador, metadata e imports | 12 mutaciones nuevas; todas exit `1`, D5-R023, path esperado y restauración PASS | PASS |
| FV-004 — D5-R029 sin prueba | Fixture y mutación para `Scope.REQUEST` | Infracción real rechazada; comentario/string no activa la regla; restauración PASS | PASS |
| FV-005 — D5-R036 no distinguible | Detector AST dentro de `@Controller` | D5-R035 aislada y D5-R036 independiente reproducidas; comentarios, strings y clase no-controller no generan D5-R036 | PASS |
| FV-006 — conteos y estados contradictorios | Reconciliación documental | 57 fixtures, 82 pruebas arquitectónicas y 87 totales reproducidos; el FAIL previo permanece histórico; remediación no se presenta como verificación | PASS |
| FV-007 — carrera entre listener y marker | Coordinador de readiness y pruebas de orden/chunks/cleanup | 10 pruebas unitarias PASS y smoke compilado 50/50; ningún proceso residual | PASS |

## Nuevos hallazgos

### FV2-001 — Blocker — paths diagnósticos no relativos ni sanitizados

El helper `add()` aplica siempre `relative(projectRoot, file)`. Cuatro ramas le
entregan un path que ya es relativo, por lo que Node lo resuelve contra el
directorio de ejecución del revisor antes de relativizarlo otra vez:

1. D5-R003 cuando falta por completo un módulo obligatorio;
2. D5-R007 cuando existe un ciclo;
3. D5-R006 cuando el grafo observado no coincide con el esperado;
4. DEC005-C03 cuando falta evidencia requerida.

Las cuatro copias temporales terminaron con exit `1` y detectaron la regla
correcta, pero el campo `file` tomó una forma equivalente a:

```text
../../../../../../Users/<local-user>/.../src/modules/access
```

en lugar de `src/modules/access`, `src/modules/access/index.ts`, `src/modules`
o el path documental relativo correspondiente. Después de restaurar cada copia,
el checker volvió a PASS. El defecto contradice explícitamente
[ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md), que promete paths relativos y
que no se imprimen paths absolutos del equipo.

**Remediación requerida:** normalizar en un solo lugar entradas absolutas y
relativas respecto de `projectRoot`, y agregar regresiones para las cuatro
ramas. No se implementó esa corrección durante esta revisión independiente.

### FV2-002 — Major — cobertura insuficiente del contrato de path

Los 54 fixtures negativos validan exit code, reglas y contenido esencial, pero
sólo 21 validan `expectedPath`. El fixture de ciclo no valida path, no existe un
fixture que elimine un módulo completo y las ramas de grafo global y evidencia
faltante no tienen regresión de sanitización. Las 13 mutaciones sólo exigen exit
`1` y presencia de regla; no validan path ni contenido. Esta brecha permitió
que FV2-001 coexistiera con 82/82 pruebas arquitectónicas verdes.

**Remediación requerida:** convertir el path relativo/sanitizado en aserción
obligatoria para todo diagnóstico negativo y cubrir explícitamente las cuatro
ramas de FV2-001.

## Revisión independiente del checker

- Usa el parser TypeScript real y AST para imports, exports, declaraciones,
  decoradores, metadata de módulos, `AppModule`, `Scope.REQUEST` y autoridad en
  controllers.
- Distingue archivo inexistente, vacío, whitespace-only, comment-only, sintaxis
  inválida, símbolo ausente y declaración incorrecta.
- Gobierna exactamente `src/modules/`; un directorio vacío fuera de ese root no
  genera infracción.
- Rechaza directorios vacíos, hidden-only, temporary-only y chains vacíos.
- Ordena diagnósticos y produce exit codes deterministas.
- No depende de nombres de fixtures ni incorpora un modo que fuerce resultados.
- El modo `fixture` sólo desacopla el allowlist del producto para probar reglas;
  no sustituye el algoritmo.
- No se encontraron hardcodes dirigidos exclusivamente a las nuevas mutaciones.
- La normalización de paths no es uniforme y genera FV2-001; por ello no puede
  afirmarse que el checker carece de falsos PASS o diagnósticos inseguros
  conocidos bajo DEC005-C01.

## Regresiones independientes de AppModule

| Caso | Exit | Regla/path | Restauración |
| --- | --- | --- | --- |
| Imports TypeScript sin decorador | `1` | D5-R023 / `src/app.module.ts` | PASS |
| `@Module({})` | `1` | D5-R023 / `src/app.module.ts` | PASS |
| `@Module({ imports: [] })` | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Módulo obligatorio faltante en metadata | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Módulo desconocido | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Módulo duplicado | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Metadata en variable | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Array de imports en variable | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Clase con nombre incorrecto | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Clase no exportada | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Decorador aplicado a otra clase | `1` | D5-R023 / `src/app.module.ts` | PASS |
| Símbolo de metadata sin import nombrado válido | `1` | D5-R023 / `src/app.module.ts` | PASS |

La implementación exige clase exportada `AppModule`, exactamente un decorador
`@Module`, objeto y arreglo literales estáticos, los tres módulos exactos, sin
faltantes/extras/duplicados, y correspondencia con imports nombrados.

## Regresiones independientes de archivos y directorios

| Caso | Resultado |
| --- | --- |
| Archivo obligatorio inexistente | D5-R003, exit `1`, path correcto |
| Archivo vacío | D5-R003, exit `1`, path correcto |
| Whitespace-only | D5-R003, exit `1`, path correcto |
| Comentario de una línea | D5-R003, exit `1`, path correcto |
| Comentario multilínea | D5-R003, exit `1`, path correcto |
| Shebang/comentario sin declaración | D5-R003, exit `1`, path correcto |
| TypeScript válido sin símbolo requerido | D5-R003, exit `1`, path correcto |
| Declaración con nombre incorrecto | D5-R003, exit `1`, path correcto |
| Sintaxis inválida adicional | D5-R003, exit `1`, path correcto |
| Directorio vacío | D5-R003, exit `1`, path correcto |
| Directorio con `.DS_Store` | D5-R003, exit `1`, path correcto |
| Directorio con temporal | D5-R003, exit `1`, path correcto |
| Directorio con subdirectorio vacío | D5-R003, exit `1`, leaf correcto |
| Cadena de directorios vacíos | D5-R003, exit `1`, leaf correcto |
| Módulo adicional vacío | D5-R003, exit `1`, path correcto |
| Directorio vacío fuera del root gobernado | exit `0`, correctamente ignorado |

Cada copia se reconstruyó desde `src/` y volvió a exit `0` antes del caso
siguiente. La variante distinta de eliminar el módulo completo sí descubrió
FV2-001 aunque la detección D5-R003 ocurrió.

## Revisión D5-R001 a D5-R036

`Diag.` indica el diagnóstico real. `F` y `M` indican fixture negativo y
mutación controlada. Las reglas documentales se contrastaron manualmente.

| Regla | Naturaleza y detector | Diag. | F/M | Resultado reproducido | Limitación |
| --- | --- | --- | --- | --- | --- |
| D5-R001 | Externa; `verify:structure`, manifest y ausencia de workspace | Propio del gate | —/— | PASS | No la ejecuta este checker |
| D5-R002 | Ejecutable; allowlist de módulos + ownership | D5-R002 | Sí/— | PASS | Fronteras nuevas requieren Arquitectura |
| D5-R003 | Ejecutable; árbol gobernado, contenido y AST estructural | D5-R003 | 13/Sí | **FAIL de contrato de path** | Módulo completamente ausente usa path ya relativo |
| D5-R004 | Ejecutable; `index.ts`, exports y símbolo exacto | D5-R004 | 3/— | PASS | Semántica pública requiere revisión |
| D5-R005 | Ejecutable; target resuelto fuera de `index.ts` | D5-R005 | Sí/Sí | PASS | Imports calculados no se resuelven |
| D5-R006 | Ejecutable; edge observado contra policy | D5-R006 | 2/— | **FAIL de contrato de path** | Divergencia global usa `src/modules` ya relativo |
| D5-R007 | Ejecutable; DFS del grafo de archivos | D5-R007 | Sí/Sí | **FAIL de contrato de path** | Ciclo se convierte a relativo dos veces |
| D5-R008 | Ejecutable; capas origen/target | D5-R008 | Sí/— | PASS | Depende de paths reconocidos |
| D5-R009 | Ejecutable; aplicación hacia presentación/infra/SQL | D5-R009 | Sí/— | PASS | Packages no catalogados requieren revisión |
| D5-R010 | Ejecutable; imports `@nestjs/*` en dominio/aplicación | D5-R010 | 2/Sí | PASS | Reflexión no cubierta |
| D5-R011 | Ejecutable; presentación hacia persistencia | D5-R011 | Sí/— | PASS | Heurística de path/package |
| D5-R012 | Ejecutable; ports fuera de `application/ports` | D5-R012 | Sí/— | PASS | Convención nominal |
| D5-R013 | Ejecutable; adapters en dominio/aplicación | D5-R013 | Sí/— | PASS | Convención nominal |
| D5-R014 | Ejecutable; internals/repository/adapter ajeno | D5-R014 | Sí/— | PASS | DEC-049 conserva tablas |
| D5-R015 | Ejecutable; `*.dto.*` fuera de presentación | D5-R015 | Sí/— | PASS | Convención de nombre |
| D5-R016 | Ejecutable; NestJS desde contrato público | D5-R016 | Sí/— | PASS | Otros frameworks futuros no seleccionados |
| D5-R017 | Documental; revisión de hechos públicos | No aplica | —/— | PASS por no aplicabilidad | Semántica humana |
| D5-R018 | Ejecutable; export `*Entity`/`*Aggregate` | D5-R018 | Sí/— | PASS | Mutabilidad efectiva requiere revisión |
| D5-R019 | Ejecutable; contenido en `src/shared` | D5-R019 | Sí/Sí | PASS | Admisión futura es documental |
| D5-R020 | Ejecutable; roots genéricos prohibidos | D5-R020 | 5/Sí | PASS | Lista explícita |
| D5-R021 | Documental; localidad de utilidades | No aplica | —/— | PASS por no aplicabilidad | Exige juicio de transversalidad |
| D5-R022 | Documental; ownership de infraestructura | No aplica | —/— | PASS por no aplicabilidad | DEC-049 sigue abierta |
| D5-R023 | Ejecutable; AST completo de `AppModule` | D5-R023 | 7/Sí | PASS; 12 regresiones extra | Metadata dinámica se rechaza |
| D5-R024 | Ejecutable; import de módulo Nest sólo desde `AppModule` | D5-R024 | Sí/— | PASS | Sólo módulos autorizados actuales |
| D5-R025 | Ejecutable; uso de `forwardRef` | D5-R025 | Sí/Sí | PASS | Detección conservadora |
| D5-R026 | Ejecutable; símbolo `ModuleRef` | D5-R026 | Sí/— | PASS | Posible falso positivo nominal documentado |
| D5-R027 | Ejecutable; `@Global()`/`global: true` | D5-R027 | Sí/— | PASS | Metadata dinámica fuera de alcance |
| D5-R028 | Documental; dynamic modules restringidos | No aplica | —/— | PASS por no aplicabilidad | Requiere registro previo |
| D5-R029 | Ejecutable; AST de `Scope.REQUEST` | D5-R029 | Sí/Sí | PASS; real rechazada y texto inocuo aceptado | Autoridad con otro vocabulario exige revisión |
| D5-R030 | Documental; casos de uso TypeScript plano | No aplica | —/— | PASS por no aplicabilidad | No hay funcionalidad |
| D5-R031 | Ejecutable; imports relativos NodeNext | D5-R031 | Sí/— | PASS | Aliases/loaders no autorizados |
| D5-R032 | Compuesta; doble ejecución y salida estable | Diferencia falla suite | Todos/restore | PASS | Cobertura sólo de sintaxis conocida |
| D5-R033 | Compuesta; policy→fixture y mutaciones | Falla de cobertura | 27/27; 13 | **FAIL de suficiencia** por FV2-002 | Paths no son aserción universal |
| D5-R034 | Documental; fail-closed sin excepciones | No aplica | —/— | PASS por no aplicabilidad | Excepción futura exige decisión |
| D5-R035 | Ejecutable; controllers, endpoints, conducta y allowlist | D5-R035 | 4/2 | PASS; controller aislado reproducido | No evalúa corrección de negocio |
| D5-R036 | Ejecutable; AST de autoridad dentro de `@Controller` | D5-R036 | Sí/Sí | PASS; distinguible de D5-R035 | Vocabulario conservador de policy |

## D5-R029 y separación D5-R035/D5-R036

- `Scope.REQUEST` real produjo D5-R029, exit `1` y path relativo correcto; la
  mención únicamente en comentario/string produjo exit `0` y ninguna D5-R029.
- Controller o endpoint sin decisión de autoridad produjo D5-R035 y no
  D5-R036.
- Método `authorize` o `resolveTenantContext` dentro de `@Controller` produjo
  D5-R036 además de D5-R035.
- Los mismos vocablos sólo en comentarios/strings no produjeron D5-R036.
- Una clase no-controller con nombres similares no produjo D5-R035 ni D5-R036.
- Controller vacío y controller con método decorado ordinario produjeron sólo
  D5-R035.

## Calidad y conteos de pruebas

| Aspecto | Resultado independiente |
| --- | --- |
| IDs de reglas | Sí; conjunto exacto comparado por fixture |
| Contenido esencial | Sí; 54/54 fixtures negativos tienen `expectedText` |
| Paths | Parcial; 21/54 negativos tienen `expectedPath` |
| Exit code | Sí; fixtures y mutaciones |
| Cleanup en `finally` | Sí; fixtures y mutaciones |
| Duplicación del algoritmo | No material; se ejecuta el CLI real |
| Tautología | No para rechazo/determinismo; sí existe brecha de cobertura de path |
| Orden accidental | No; reglas se normalizan y salidas se comparan dos veces |
| Estado mutable compartido | No; roots temporales independientes |
| Repetibilidad | PASS en suites y restauraciones |
| Errores ocultos | No en regla/exit; FV2-002 sí ocultó el contrato de path |

Conteos obtenidos desde las estructuras reales y corroborados por TAP:

- fixtures: **57** — 3 positivos y 54 negativos;
- mutaciones: **13**, distribuidas en 11 familias normativas;
- reglas directas del checker con fixture: **27/27**;
- pruebas arquitectónicas: **82/82 PASS**;
- pruebas totales: **87/87 PASS**;
- pruebas unitarias del coordinador de smoke: **10/10 PASS**.

## Smoke y lifecycle

El coordinador actual acumula stdout/stderr, reconoce marker y listener en
cualquier orden, contempla el mismo turno y chunks divididos, rechaza salida
prematura y timeout, y remueve listeners tanto en PASS como en FAIL. El runner
aborta el probe, termina el child, espera su salida y destruye streams en
`finally`. Las diez pruebas unitarias cubren esos contratos. El smoke compilado
pasó **50/50** corridas consecutivas, con detención al primer fallo y sin
reintento silencioso. Después no quedaron procesos `dist/main.js` ni
`smoke-start.mjs`.

## Toolchain y gates

| Validación | Resultado |
| --- | --- |
| Node.js | `v24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |
| `pnpm install --frozen-lockfile` | PASS; lockfile sin cambios |
| `git diff --check` inicial | PASS |
| `pnpm run verify:architecture` | PASS para el árbol vigente |
| `pnpm run test:architecture` | PASS, 82/82 |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS, 87/87 |
| `pnpm run verify`, corrida 1 | PASS |
| `pnpm run verify`, corrida 2 | PASS |
| Smoke compilado | PASS, 50/50 |

Que el árbol vigente pase no corrige el defecto revelado por entradas inválidas
adicionales: el propósito del checker incluye producir diagnósticos seguros y
accionables cuando falla.

## Ownership, API y grafo

- `tenancy`, `stations` y `access` son los únicos módulos.
- Los tres `index.ts` publican exclusivamente interfaces type-only y están
  libres de NestJS.
- Los módulos Nest son superficies de composición importadas sólo por
  `AppModule`.
- No hay deep imports ni dependencias inversas.
- Grafo observado: `access -> stations`, `access -> tenancy` y
  `stations -> tenancy`; no hay ciclos.
- Los consumidores reales coinciden con
  [OWNERSHIP.md](OWNERSHIP.md) y [DEPENDENCY_GRAPH.md](DEPENDENCY_GRAPH.md).
- Ownership se expresa por funciones; no se inventaron personas.
- Arquitectura conserva autoridad sobre fronteras y excepciones; DEC-049
  conserva ownership físico de persistencia.

## Consistencia documental

La búsqueda global clasificó como históricas y contextualizadas las cifras
45/45 y 50/50 del primer FAIL. Los conteos vigentes 57, 82/82 y 87/87 se
reprodujeron. No hay documento vigente que marque PBI-022 `Done`, DEC-005
`Verified`, R0 autorizado o Sprint 00 cerrado. La remediación se describe como
evidencia técnica y no como dictamen formal. No se modificó el FAIL histórico.

## DEC005-C01 a DEC005-C05

| Criterio | Dictamen | Justificación |
| --- | --- | --- |
| DEC005-C01 | **FAIL** | FV2-001 demuestra diagnósticos no relativos/sanitizados y FV2-002 demuestra cobertura insuficiente del contrato de path; hay un defecto conocido pese a determinismo, fixtures y mutaciones verdes |
| DEC005-C02 | **PASS** | Sin rutas vacías, genéricas, anticipatorias o sin ownership; 15 casos independientes más sintaxis inválida |
| DEC005-C03 | **PASS** | Ownership, APIs, consumidores y grafo coinciden con código y policy; el fallo de path del diagnóstico `DEC005-C03` se imputa a C01, no al contenido del expediente vigente |
| DEC005-C04 | **PASS** | `src/shared/` ausente y sin admisiones o excepciones silenciosas |
| DEC005-C05 | **PASS** | Sin funcionalidad; DEC-004/044/049/050/051/063 independientes; R0 no autorizado y Sprint 00 abierto |

Un solo FAIL impide `Verified` y `Done`.

## Archivos y acciones de esta revisión

- **Creado:** `FORMAL_VERIFICATION_2.md`.
- **Modificados:** ninguno fuera de este nuevo dictamen.
- **Eliminados:** ninguno.
- **Funcionalidad creada:** ninguna.
- **Commit, push, PR, merge, CI y deploy:** no ejecutados.

## Limitaciones conservadas

- Imports calculados, reflexión, generación, aliases y loaders no autorizados
  no se resuelven.
- Semántica de hechos, mutabilidad y autoridad con vocabulario fuera de policy
  requiere revisión humana.
- El checker es enforcement local transitorio; DEC-051 conserva el gate general.
- Persistencia y ownership físico permanecen en DEC-049.
- La revisión no cambia estados ni remedia el defecto encontrado.

## Siguiente acción exacta

Remediar FV2-001 y FV2-002 en una tarea acotada de PBI-022: corregir la
normalización de paths del checker, agregar regresiones obligatorias para las
cuatro ramas afectadas y repetir esta verificación formal independiente antes
de avanzar DEC-049.
