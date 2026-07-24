# Remediación técnica de los hallazgos FV4

## Estado

**PASS TÉCNICO — REMEDIACIÓN FV4 LISTA PARA QUINTA VERIFICACIÓN**

Este documento registra la remediación local de FV4-001, FV4-002 y FV4-003.
No constituye una quinta verificación formal, no cambia estados de gobierno y
no sustituye una revisión independiente.

## Alcance y baseline

| Control | Valor |
| --- | --- |
| Rama | `main` |
| Commit base | `be1fe5a774b3437063b86e6ff16920131e502079` |
| `origin/main` inicial | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia inicial | `0 0` |
| Entorno | Local únicamente |
| Toolchain | Node.js `24.18.0`, pnpm `11.15.1`, TypeScript `6.0.3` |

El working tree ya estaba dirty por la materialización de PBI-022 y las
verificaciones anteriores. Se fijó un inventario y SHA-256 por ruta antes de
editar. No se modificó
[FORMAL_VERIFICATION_4.md](FORMAL_VERIFICATION_4.md), que conserva su
dictamen `FAIL`.

## Causa raíz

### FV4-001

`createImportIdentityResolver().matches()` comparaba el nodo recibido
directamente contra `Identifier`, `PropertyAccessExpression` o
`QualifiedName`. Calls, members y decoradores podían entregar esa identidad
dentro de uno o más wrappers AST transparentes. El resolvedor devolvía
`false`, aunque el símbolo siguiera enlazado al mismo import de Nest.

La corrección está en el owner compartido:
`unwrapTransparentExpression()` desenvuelve iterativamente antes de resolver
identidad. No se agregaron excepciones por fixture ni búsquedas textuales.

### FV4-002

`containsTrueProperty()` recorría todo el archivo y clasificaba cualquier
propiedad `global: true` como módulo Nest global. No comprobaba vínculo con
`@nestjs/common` ni con una construcción autorizada de Nest.

Se eliminó ese detector. D5-R027 reconoce únicamente el decorador real
`Global` importado desde `@nestjs/common`, incluidos import directo, alias,
namespace y wrappers transparentes. Objetos ordinarios, objetos anidados,
retornos y argumentos locales con `global: true` son controles positivos.
No existe hoy otra configuración funcional global aprobada que pueda ligarse
semánticamente sin inferencia.

### FV4-003

D5-R033 sólo verificaba que cada regla ejecutable apareciera en algún fixture.
No preservaba casos semánticos concretos ni demostraba que el source crítico
continuara presente.

La policy ahora declara `requiredSemanticCoverage`. Una prueba independiente:

1. exige correspondencia exacta y sin duplicados entre los IDs requeridos y
   los casos reales;
2. comprueba que cada caso conserve fragmentos de source declarados;
3. exige regla y path exactos para casos negativos;
4. exige que los controles positivos no esperen la regla que refutan;
5. ejecuta después fixtures y mutaciones contra el checker real.

La suite de fixtures también valida que **todos** los diagnósticos pertenezcan
al conjunto completo de reglas y paths permitidos, y que cada path declarado
aparezca.

## Wrappers AST normalizados

| Wrapper TypeScript 6.0.3 | Tratamiento | Motivo |
| --- | --- | --- |
| `ParenthesizedExpression` | Desenvuelto iterativamente | Sólo agrupa la misma expresión |
| `AsExpression` | Desenvuelto iterativamente | La aserción de tipo no cambia identidad runtime |
| `TypeAssertionExpression` | Desenvuelto iterativamente | Forma angular equivalente de aserción de tipo |
| `NonNullExpression` | Desenvuelto iterativamente | El operador no-null sólo afecta tipos |
| `SatisfiesExpression` | Desenvuelto iterativamente | Valida tipo sin cambiar el valor |
| `PartiallyEmittedExpression` | Desenvuelto iterativamente | Wrapper interno de transformación/emisión |

El normalizador se detiene ante operaciones con semántica propia:
`PropertyAccessExpression`, `ElementAccessExpression`, calls, condicionales y
binarios —incluido comma—. El resolvedor inspecciona después la propiedad y
normaliza únicamente su base namespace cuando corresponde. No cruza calls,
computed properties ni composición dinámica.

## Reglas corregidas

| Regla | Corrección | Evidencia |
| --- | --- | --- |
| D5-R025 | Identidad de `forwardRef` tras wrappers | directo, alias, namespace; fixture y mutación |
| D5-R027 | Identidad de `Global` tras wrappers; eliminado barrido `global: true` | tres negativos, cuatro formas positivas ordinarias y mutación |
| D5-R029 | Identidad de `Scope` tras wrappers en la base de `.REQUEST` | directo, alias, namespace; fixture y mutación |
| D5-R035 | Identidad de `Controller` y decorators HTTP tras wrappers | matrices controller/endpoint y mutación |
| D5-R036 | Controller normalizado antes de inspeccionar autoridad | fixture y mutación con D5-R035+D5-R036 |
| D5-R033 | Cobertura semántica obligatoria en policy | 26 IDs con source, regla y path contractuales |

D5-R026 no necesitaba el mismo cambio para el caso observado porque su
traversal alcanzaba el `Identifier` o `QualifiedName` interior. Se añadió un
control compuesto con referencias parentetizadas directas, alias y namespace
para demostrar que continúa rechazando `ModuleRef`.

## Fixtures añadidos

Se añadieron **21** fixtures:

- 3 de D5-R025: directo parentetizado, alias con wrappers anidados y namespace;
- 3 de D5-R027: directo, alias y namespace con wrappers;
- 3 de D5-R029: directo, alias y namespace;
- 6 de D5-R035: matrices de Controller y endpoint, cada una con directo, alias
  y namespace;
- 1 de D5-R036: Controller aliased con wrapper y autoridad;
- 1 control negativo D5-R026 con tres formas type-only parentetizadas;
- 1 control positivo con cuatro formas ordinarias de `global: true`;
- 3 controles positivos para package ajeno, shadowing y
  homónimos/comentarios/strings.

Conteo vigente: **98 fixtures = 12 positivos + 86 negativos**.

## Mutaciones añadidas

Se añadieron **5** mutaciones, una por cada familia semántica afectada:
D5-R025, D5-R027, D5-R029, D5-R035 y D5-R036. Todas parten de una copia
temporal de `src/`, exigen el conjunto exacto de regla/path, restauran en
`finally` mediante la eliminación del sandbox y vuelven a exigir checker
conforme.

Conteo vigente: **23 mutaciones en 12 familias normativas**.

## Auditoría D5-R001 a D5-R036

Se revisaron las superficies que consumen expresiones:

- D5-R025/R026/R027/R029/R035/R036 comparten resolución de identidad; sólo las
  cinco reglas con evasión reproducida necesitaron cambio funcional y D5-R026
  recibió control de no regresión.
- D5-R023 exige deliberadamente composición estática y símbolos directos de
  `AppModule`; un wrapper no debe normalizarse para volverse aceptable.
- D5-R003 valida el decorador estructural `@Module` exacto; una forma distinta
  sigue siendo estructura no conforme.
- D5-R004 a D5-R016, D5-R018 a D5-R020, D5-R024 y D5-R031 consumen paths,
  declaraciones o module specifiers, no identidad de expresión equivalente.
- D5-R017/R021/R022/R028/R030/R034 son documentales y D5-R032/R033 son
  compuestas.

No se modificó ninguna regla adicional sin defecto reproducido.

## Paths, evidencia y determinismo

- Los 86 fixtures negativos declaran path exacto.
- Los casos con más de un diagnóstico declaran el conjunto completo de paths.
- Cada fixture corre dos veces y exige stdout/stderr byte-idénticos.
- Las 23 mutaciones restringen todos sus diagnósticos a reglas y paths
  permitidos y validan restauración.
- Los 26 IDs de cobertura semántica están declarados en la policy y presentes
  exactamente una vez.
- El checker sigue emitiendo únicamente paths relativos y sanitizados.

## Validaciones

| Validación | Resultado |
| --- | --- |
| Normalizador AST y contrato D5-R033 | PASS, 2/2 |
| Fixtures | PASS, 98/98 |
| Mutaciones | PASS, 23/23 |
| Contratos de paths | PASS, 6/6 |
| AppModule/composición focalizada | PASS, 11/11 |
| Estructura focalizada | PASS, 19/19 |
| Aliases/namespaces/shadowing/wrappers focalizados | PASS, 50/50 |
| Policy y smoke unitario | PASS, 12/12 |
| Suite arquitectónica | PASS, 141/141 |
| Suite total | PASS, 146/146 |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS |
| `pnpm run test:architecture` | PASS |
| `pnpm run verify` | PASS/PASS |
| Checker determinista | PASS, 20/20; una salida; SHA-256 `f511df85afa559942b1e957536643e1927b7a9bacd08f7f81072850b155e2b89` |
| Smoke unitario | PASS, 10/10 |
| Smoke compilado | PASS, 20/20 |
| Inspección `dist/` | PASS: 10 JS, 10 maps, 0 extras, 0 `sourcesContent`, 0 paths absolutos/`file:` |
| Links Markdown | PASS: 333 archivos, 2733 enlaces relativos y fences balanceados |
| Whitespace y `git diff --check` | PASS |

Los comandos canónicos se ejecutaron con
`PATH=/opt/homebrew/opt/node@24/bin:$PATH`, usando la instalación local
preexistente. No se instaló ni cambió una toolchain global.

## Alcance y estados preservados

- DEC-005: `Accepted — Materialized / Formal Verification Pending`.
- PBI-022: `In review`.
- DEC-049: abierta y bloqueada.
- R0: no autorizado.
- Sprint 00: abierto.
- FV-001 a FV-007: `CLOSED`.
- FV2-001/FV2-002: `CLOSED`.
- FV3-002: `CLOSED`.
- FV3-001: la regresión de FORMAL4 queda técnicamente remediada, pendiente de
  confirmación independiente.

No hubo commit, push, PR, merge, rebase, tag, stash, reset, clean, CI, deploy,
SSH, base de datos, SQL ni migraciones.

Las 57 rutas dirty del preflight se volvieron a hashear al cierre. Las 12
rutas preexistentes modificadas pertenecen exactamente a esta remediación; las
otras **45 rutas preexistentes ajenas conservaron su SHA-256**. Se agregaron
únicamente tres rutas nuevas de esta tarea: el test de cobertura, el catálogo
de mutaciones FV4 y este documento.

## Resultado y siguiente gate

**PASS TÉCNICO — FV4-001/FV4-002/FV4-003 REMEDIADOS**

El siguiente trabajo permitido es una **quinta verificación formal
independiente desde cero**. Este documento no la crea, no la simula y no
anticipa su dictamen.
