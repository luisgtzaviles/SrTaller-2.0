# Remediación de hallazgos FV3

Fecha: 2026-07-23

## Resultado y alcance

**PASS técnico de remediación — cuarta reverificación formal pendiente.**

Esta intervención remedia exclusivamente FV3-001 y FV3-002. No constituye una
reverificación formal, no reemplaza el FAIL de
[FORMAL_VERIFICATION_3.md](FORMAL_VERIFICATION_3.md), no aprueba DEC-005 y no
cierra PBI-022, DEC-049, R0 ni Sprint 00.

## Causa raíz confirmada

D5-R027, D5-R029, D5-R035 y D5-R036 asociaban la infracción al nombre local
escrito (`Global`, `Scope`, `Controller`) o a una expresión textual. Por ello,
un alias nombrado o un namespace conservaba la identidad real de
`@nestjs/common`, pero evadía el detector.

La revisión D5-R001–D5-R036 encontró la misma causa en D5-R025 y D5-R026:
`forwardRef` y `ModuleRef` se buscaban por texto y no por declaración de
import. Se incluyeron porque comparten exactamente la frontera técnica; no se
modificó ninguna otra semántica normativa.

## Diseño de resolución de símbolos

`scripts/lib/architecture-checker.mjs` construye por archivo una tabla AST con:

- nombre exportado, nombre local y package para imports nombrados;
- alias local y package para namespace imports;
- resolución equivalente de identificadores, property access y qualified
  names usados en anotaciones de tipo;
- detección de shadowing por parámetros, bloques, `catch` y `for`;
- helpers compartidos para calls, members, referencias y decoradores.

La identidad se comprueba contra `@nestjs/common` o `@nestjs/core`; no depende
del texto del decorador ni usa un TypeChecker completo.

## Reglas corregidas

| Regla | Símbolo | Formas cubiertas |
| --- | --- | --- |
| D5-R025 | `@nestjs/common.forwardRef` | Directa, alias y namespace |
| D5-R026 | `@nestjs/core.ModuleRef` | Directa, alias, namespace y qualified type |
| D5-R027 | `@nestjs/common.Global` | Directa, alias y namespace; `global: true` sigue bajo AST |
| D5-R029 | `@nestjs/common.Scope.REQUEST` | Directa, alias y namespace |
| D5-R035 | `Controller` y decoradores HTTP de `@nestjs/common` | Directa, alias y namespace |
| D5-R036 | `@nestjs/common.Controller` más símbolos de autoridad de policy | Directa, alias y namespace |

D5-R035 y D5-R036 siguen separadas: un controller ordinario activa D5-R035;
un controller que decide autoridad activa D5-R036 y, por estar fuera del
alcance de PBI-022, también D5-R035.

## Falsos positivos evitados

Los fixtures positivos demuestran que no se clasifican como Nest:

- símbolos homónimos importados desde otro package;
- funciones, clases u objetos locales con nombres `Controller`, `Scope`,
  `Global`, `forwardRef` o `ModuleRef`;
- comentarios y strings con sintaxis aparente;
- imports nombrados o namespace ocultos válidamente por parámetros locales.

## Cobertura y mutaciones

| Evidencia | Antes de FV3 | Después de FV3 |
| --- | ---: | ---: |
| Fixtures | 58 | 77 |
| Fixtures positivos | 3 | 8 |
| Fixtures negativos | 55 | 69 |
| Mutaciones | 13 | 18 |
| Familias normativas mutadas | 11 | 12 |
| Pruebas arquitectónicas | 89 | 113 |
| Pruebas totales | 94 | 118 |

Las mutaciones nuevas cubren alias de `forwardRef`, alias de `Global`, alias de
`Controller`, alias de `Scope.REQUEST` y namespace de Controller con decisión
de autoridad. Cada caso exige exit `1`, conjunto exacto de reglas, paths
permitidos exactos y restauración del árbol temporal a exit `0`.

La matriz adversarial temporal reprodujo 12/12 casos con nombres directos,
aliases cortos/no semánticos, `HttpController`, `NestScope`, namespaces `Nest`
y `NC`, otro package, función/objeto local, comentario, string y shadowing. Los
árboles se crearon fuera del repositorio y se retiraron en `finally`.

## FV3-002: clasificación de conteos

### Históricos preservados

- [FORMAL_VERIFICATION.md](FORMAL_VERIFICATION.md): primer FAIL y sus conteos.
- [REMEDIATION.md](REMEDIATION.md): primera remediación, 57/82/87.
- [FORMAL_VERIFICATION_2.md](FORMAL_VERIFICATION_2.md): segunda verificación,
  57/82/87.
- [FV2_REMEDIATION.md](FV2_REMEDIATION.md): remediación FV2, 58/89/94.
- [FORMAL_VERIFICATION_3.md](FORMAL_VERIFICATION_3.md): tercer FAIL y baseline
  58/89/94.

No se cambió ningún resultado histórico ni se convirtió un FAIL en PASS.

### Canónicos vigentes actualizados

- [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md)
- [FIXTURES.md](FIXTURES.md)
- [IMPLEMENTATION.md](IMPLEMENTATION.md)
- [RESULTS.md](RESULTS.md)
- [EVIDENCE.md](EVIDENCE.md)
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)

`EVIDENCE.md` separa expresamente la ejecución histórica 82/87 de la ejecución
vigente 113/118. Los conteos actuales provienen de TAP real, no de una
estimación.

## Archivos técnicos modificados

- `scripts/lib/architecture-checker.mjs`
- `test/architecture-fixtures.mjs`
- `test/architecture-mutations.test.mjs`

No cambiaron `package.json`, `pnpm-lock.yaml`, la toolchain, la policy ni el
runtime de producto.

## Validaciones ejecutadas

Toolchain exacta:

- Node.js `24.18.0`;
- pnpm `11.15.1`;
- TypeScript `6.0.3`;
- `pnpm install --frozen-lockfile`: PASS, sin cambios.

Gates:

| Validación | Resultado |
| --- | --- |
| `pnpm run verify:architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run test:architecture` | PASS — 113/113 |
| `pnpm test` | PASS — 118/118 |
| `pnpm run verify` — corrida 1 | PASS |
| `pnpm run verify` — corrida 2 | PASS |
| Checker real consecutivo | PASS — 20/20, salida idéntica |
| Smoke compilado consecutivo | PASS — 20/20 |
| Adversariales temporales | PASS — 12/12 |
| `git diff --check` | PASS |

Las suites focalizadas cubrieron D5-R027, D5-R029, D5-R035, D5-R036, aliases,
namespaces, AppModule, estructura, paths, mutaciones, smoke unitario y smoke
compilado.

## Determinismo y cleanup

- El checker produjo el mismo exit y la misma evidencia en 20 corridas.
- Los 18 casos de mutación restauraron su copia temporal y exigieron PASS.
- No quedaron fixtures, directorios temporales del repositorio, listeners ni
  procesos de checker/smoke creados por esta tarea.
- El índice Git permaneció vacío.

## Limitaciones

- No se resuelven propiedades calculadas como `Nest['Controller']`, imports
  default o `import =`; esas formas no están autorizadas por la baseline.
- `global: true` permanece como forma estructural conservadora.
- D5-R036 conserva el vocabulario de autoridad definido en policy; decisiones
  expresadas con otro vocabulario requieren revisión semántica.
- El resolvedor AST es enforcement local transitorio y no interpreta
  reflexión o generación.

## Estados preservados

- DEC-005: `Accepted — Materialized / Formal Verification Pending`.
- PBI-022: `In review`.
- DEC-049: abierta y bloqueada.
- R0: no autorizado.
- Sprint 00: abierto.

No se hizo commit, push, PR, merge, rebase, tag, CI, deploy, SQL, migración ni
operación remota. No se ejecutó ni simuló una cuarta reverificación formal
independiente.

## Siguiente acción

Ejecutar una cuarta reverificación formal independiente desde cero.
