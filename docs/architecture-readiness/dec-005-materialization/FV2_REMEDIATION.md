# Remediación de FV2-001 y FV2-002

## Resultado técnico

**PASS — FV2 REMEDIATIONS COMPLETE**

- **Fecha:** 2026-07-22.
- **Alcance:** corrección del contrato de paths del checker de DEC-005 y de su
  cobertura automatizada.
- **Naturaleza:** remediación técnica de PBI-022; no es aprobación ni
  reverificación formal independiente.
- **Dictamen autoritativo preservado:**
  [FORMAL_VERIFICATION_2.md](FORMAL_VERIFICATION_2.md) continúa en FAIL hasta
  que una actividad independiente emita un nuevo dictamen.

## Causa raíz confirmada

El helper interno que agregaba diagnósticos ejecutaba siempre
`path.relative(projectRoot, value)`. La mayoría de sus entradas eran paths
absolutos obtenidos del filesystem, pero cuatro ramas entregaban valores ya
relativos. En esas ramas, Node interpretaba el valor relativo contra el
current working directory y después lo relativizaba contra el root temporal,
produciendo evidencia dependiente de la ubicación física del checkout.

FV2-002 permitió que el defecto sobreviviera porque los 54 fixtures negativos
validaban regla y contenido, pero sólo 21 exigían un path exacto. Las mutaciones
tampoco comprobaban el contrato de presentación del path.

## Clasificación de entradas auditadas

| Clase | Origen | Tratamiento final |
| --- | --- | --- |
| Path absoluto | `walk()`, archivos parseados, directorios gobernados, archivos estructurales resueltos y `AppModule` | `path.relative` respecto del root autoritativo exactamente una vez |
| Path relativo al root | módulo obligatorio faltante, ubicación sintética `src/modules` y paths documentales de evidencia | se normaliza directamente; nunca se resuelve contra cwd ni vuelve a relativizarse |
| Specifier de import | AST de imports/exports/dynamic imports | se conserva como contexto del mensaje; el path validable sigue siendo el archivo consumidor |
| Path derivado del AST | archivo fuente absoluto asociado al nodo inspeccionado | pasa por la misma frontera absoluta antes de almacenarse |
| Path sintético de fixtures | keys relativas usadas para construir temporales | el checker observa archivos absolutos después de crearlos; las ubicaciones sintéticas ausentes conservan su forma relativa |

## Contrato final de paths

La única frontera de presentación es
`toRepositoryRelativePath(projectRoot, path)` en
[`architecture-checker.mjs`](../../../scripts/lib/architecture-checker.mjs).
El agregador de diagnósticos siempre la usa antes de almacenar `file`.

El contrato:

1. acepta un path absoluto interno o uno ya relativo al repositorio;
2. aplica `path.relative` sólo al path absoluto;
3. no usa el current working directory para paths relativos;
4. normaliza con semántica POSIX y emite `/`;
5. elimina segmentos redundantes mediante `path.posix.normalize`;
6. rechaza string vacío, root sin identidad de artefacto, escapes `..`, paths
   absolutos externos, letras de unidad externas y `file:`;
7. no usa sustitución textual del root ni reduce el resultado a `basename`;
8. emite errores de contrato sin incluir el valor o root rechazado;
9. conserva un path estable y suficientemente específico para cada infracción.

## Cuatro ramas corregidas

| Rama | Antes | Después | Regresión |
| --- | --- | --- | --- |
| D5-R003 — módulo obligatorio ausente | valor relativo vuelto a relativizar | `src/modules/access` | dos roots temporales, salida idéntica |
| D5-R007 — ciclo | primer path ya relativo vuelto a relativizar | ciclo y campo `file` pasan por el normalizador central desde paths absolutos | dos roots temporales, salida idéntica |
| D5-R006 — grafo observado divergente | `src/modules` vuelto a relativizar | `src/modules` normalizado directamente | dos roots de producto, salida idéntica |
| DEC005-C03 — evidencia ausente | path documental vuelto a relativizar | path documental repository-relative estable | dos roots de producto, salida idéntica |

## Archivos modificados y creados

### Modificados

- `scripts/lib/architecture-checker.mjs`;
- `test/architecture-fixtures.mjs`;
- `test/architecture-fixtures.test.mjs`;
- `test/architecture-mutations.test.mjs`;
- `test/architecture-support.mjs`.

### Creados

- `test/architecture-paths.test.mjs`;
- `docs/architecture-readiness/dec-005-materialization/FV2_REMEDIATION.md`.

No se modificaron policy, código funcional, lockfile ni estados canónicos.

## Cobertura antes y después

| Cobertura | Antes | Después |
| --- | ---: | ---: |
| Fixtures negativos con path exacto | 21/54 | **55/55** |
| Fixtures totales | 57 | **58** |
| Positivos / negativos | 3 / 54 | **3 / 55** |
| Mutaciones con regla y path exactos | 0/13 | **13/13** |
| Regresiones específicas FV2 | 0 | **4** |
| Regresiones entre dos roots físicos | 0 | **4/4** |

El fixture nuevo elimina por completo un módulo requerido. Todos los fixtures
negativos exigen un `expectedPath` exacto y, adicionalmente, todos los
diagnósticos emitidos se verifican contra el contrato portable: sin root
temporal, path absoluto, backslashes, letra de unidad, `file:`, `.` o `..`.

## Regresiones nuevas

La suite aislada `test/architecture-paths.test.mjs` contiene seis pruebas:

1. normalización única y rechazo seguro de escapes/formas externas;
2. módulo requerido faltante bajo dos roots;
3. ciclo bajo dos roots;
4. grafo declarado divergente bajo dos roots de producto;
5. evidencia requerida faltante bajo dos roots de producto;
6. obligación de path exacto para cada fixture negativo.

Cada regresión de las cuatro ramas crea dos temporales mediante `mkdtemp`,
confirma roots distintos, compara stdout/stderr completos, exige regla y path
exactos, y elimina ambos temporales en `finally` aun ante fallo.

## Compatibilidad preservada

- Parser TypeScript y análisis AST: sin cambios.
- D5-R029: infracción real rechazada; comentarios/strings no se convierten en
  coincidencias por la corrección de paths.
- D5-R035 y D5-R036: siguen siendo diagnósticos distinguibles.
- AppModule: las 12 mutaciones independientes continúan rechazadas y cada
  restauración vuelve a PASS.
- Casos estructurales: 16/16 pruebas focalizadas PASS.
- Mutaciones: 13/13 PASS con cleanup y path exacto.
- Smoke unitario: 10/10 PASS.
- Smoke compilado: PASS mediante `pnpm run smoke:start`.

## Toolchain y comandos ejecutados

| Comando o validación | Resultado real |
| --- | --- |
| `node --version` | PASS — `v24.18.0` |
| `pnpm --version` | PASS — `11.15.1` |
| `pnpm exec tsc --version` | PASS — `6.0.3` |
| `pnpm install --frozen-lockfile` | PASS — lockfile sin cambios |
| `pnpm run verify:architecture` | PASS; es el nombre canónico existente equivalente al gate solicitado como `pnpm architecture` |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run test:architecture` | PASS — 89/89 |
| `pnpm test` | PASS — 94/94 |
| `pnpm run verify` — primera corrida | PASS — 94/94 y gates completos |
| `pnpm run verify` — segunda corrida | PASS — 94/94 y gates completos |
| Suite aislada de paths | PASS — 6/6 |
| AppModule focalizado | PASS — 8/8 nombres coincidentes; matriz independiente 12/12 |
| Estructurales focalizadas | PASS — 16/16 |
| D5-R029/D5-R035/D5-R036 focalizadas | PASS — 7/7 |
| Smoke unitario focalizado | PASS — 10/10 |
| `pnpm run smoke:start` | PASS |
| Checker consecutivo | PASS — status/stdout/stderr idénticos; SHA-256 `49aee1c02e063df205ed28252cbdd6e9d74334943ca931bc3b07a607c586e604` |
| `git diff --check` | PASS |

No se agregó un alias nuevo a `package.json`; se preservó el script canónico
`verify:architecture` ya aprobado por PBI-022.

## Búsqueda de paths absolutos

La búsqueda activa no encontró un path absoluto generado por el checker. Las
coincidencias textuales restantes se clasifican así:

- documentos históricos de DEC-004 y auditoría legacy que registran el root
  usado en su ejecución original;
- el ejemplo sanitizado del FAIL histórico en `FORMAL_VERIFICATION_2.md`;
- literales deliberadamente inválidos de Windows y `file:` en la prueba del
  normalizador.

No se alteró evidencia histórica para ocultar esas coincidencias.

## Cleanup y determinismo

- Las salidas relevantes de las dos ubicaciones físicas fueron idénticas en
  las cuatro regresiones.
- Dos ejecuciones consecutivas del checker del producto produjeron evidencia
  idéntica.
- No quedaron directorios `srtaller-dec005-*` ni `dec005-*` bajo el root
  temporal inspeccionado.
- No quedaron procesos `dist/main.js`, `smoke-start.mjs` o `pnpm run verify`.
- El índice Git permaneció vacío.

## Limitaciones restantes

Se conservan las limitaciones ya documentadas: imports calculados, reflexión,
generación, aliases/loaders no autorizados y semántica de autoridad con
vocabulario fuera de policy requieren revisión humana. El checker sigue siendo
enforcement local transitorio hasta DEC-051. Esta remediación no decide
persistencia, ownership de tablas ni DEC-049.

## Estados preservados

- DEC-005: `Accepted — Materialized / Formal Verification Pending`.
- PBI-022: `In review`.
- DEC-049: abierta, sin avance.
- R0: no autorizado.
- Sprint 00: abierto.

## Declaración de no aprobación

Esta tarea no ejecutó ni simuló la reverificación formal independiente. No se
declara DEC-005 `Verified`, `Complete` o `Closed`, ni PBI-022 `Done`.

## Siguiente acción

Ejecutar una nueva reverificación formal independiente de DEC-005 y PBI-022
sobre esta remediación antes de avanzar DEC-049.
