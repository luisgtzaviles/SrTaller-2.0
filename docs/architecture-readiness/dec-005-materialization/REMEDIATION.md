# Remediación de PBI-022 posterior al FAIL formal

## Autoridad y alcance

Este documento registra la remediación técnica de los hallazgos de
[FORMAL_VERIFICATION.md](FORMAL_VERIFICATION.md), cuyo dictamen histórico
permanece **FAIL — DEC-005 FORMAL VERIFICATION BLOCKED**. La remediación no es
una aprobación formal, no cambia PBI-022 de `In review` y conserva DEC-005 en
`Accepted — Materialized / Formal Verification Pending`.

No se añadió funcionalidad de negocio. DEC-049 continúa abierta, R0 no está
autorizado y Sprint 00 permanece abierto.

## Hallazgos y causas raíz

| Hallazgo | Causa raíz | Cambio aplicado | Regresión |
| --- | --- | --- | --- |
| FV-001 — copias SPIKE-009 | Dos guardados locales antiguos quedaron junto a los canónicos sin consumidores | Se compararon hashes, diff, referencias y metadata; eran revisiones obsoletas y se eliminaron sin tocar originales | Búsqueda final de nombres `* 2.*` |
| FV-002 — vacíos | El checker infería contenido por cantidad de source files y no gobernaba directorios internos | Policy de roots/archivos estructurales, clasificación de contenido y AST de declaraciones | Fixtures de vacío/whitespace/comentarios/barrel/directorios y dos mutaciones D5-R003 |
| FV-003 — `AppModule` | Se comprobaban imports TypeScript, no composición NestJS | AST de clase, decorador, metadata, arreglo literal, conjunto exacto e imports nombrados | Siete fixtures D5-R023 y mutación de metadata |
| FV-004 — D5-R029 | Había detector sin prueba negativa | Detector AST de `Scope.REQUEST` conservado y trazado a prueba propia | Fixture y mutación D5-R029 |
| FV-005 — D5-R036 | Controllers/endpoints sólo producían D5-R035 | D5-R035 quedó como gate de superficie/funcionalidad y D5-R036 recibió detector AST/diagnóstico propio de autoridad | Controller simple D5-R035; controller de autoridad D5-R035 + D5-R036; mutación D5-R036 |
| FV-006 — documentación | Conteos y estados históricos no distinguían selección, materialización y verificación | Conteos derivados del source, matriz D5 y estado vigente reconciliado sin alterar el FAIL histórico | Test policy→fixtures/matriz y validación de enlaces/whitespace |
| FV-007 — carrera de smoke | El runner decidía después del listener sin coordinar el marker asíncrono | Coordinador de dos señales independiente del orden, buffers, timeout, errores y cleanup | Diez pruebas unitarias y stress consecutivo |

## Cambios del checker

- La policy delimita `src/modules` como root gobernado y clasifica archivos
  ocultos/temporales como no estructurales.
- Los siete archivos estructurales obligatorios exigen declaración exportada
  exacta; los módulos exigen `@Module` con metadata estática.
- `AppModule` debe componer exactamente `TenancyModule`, `StationsModule` y
  `AccessModule`, sin faltantes, extras, duplicados o composición calculada.
- D5-R029 reconoce `Scope.REQUEST` mediante AST.
- D5-R036 reconoce únicamente decisiones de contexto/autorización dentro de
  una clase decorada con `@Controller`; D5-R035 conserva el gate general de
  superficie y funcionalidad.
- Los diagnósticos continúan ordenados, con paths relativos y exit codes
  deterministas.

La correspondencia completa está en
[TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

## Cobertura y conteos

| Evidencia | Conteo real |
| --- | --- |
| Fixtures | 57: 3 positivos y 54 negativos |
| Reglas directas del checker con fixture negativo | 27/27 |
| Roots globales prohibidos cubiertos | 5/5 |
| Mutaciones | 13 casos en 11 familias normativas |
| Pruebas unitarias del coordinador de smoke | 10 |

## Regresiones manuales obligatorias

Cada mutación se ejecutó en un temporal aislado, exigió exit `1`, verificó
regla y path, restauró `src/` desde el árbol real y exigió exit `0` antes del
siguiente caso.

| # | Mutación | Exit | Regla esperada | Reglas obtenidas | Path | Restauración | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `access.module.ts` vacío | `1` | D5-R003 | D5-R003 | `src/modules/access/access.module.ts` | exit `0` | PASS |
| 2 | `access.module.ts` con whitespace | `1` | D5-R003 | D5-R003 | `src/modules/access/access.module.ts` | exit `0` | PASS |
| 3 | `access.module.ts` sólo comentarios | `1` | D5-R003 | D5-R003 | `src/modules/access/access.module.ts` | exit `0` | PASS |
| 4 | Directorio interno vacío | `1` | D5-R003 | D5-R003 | `src/modules/access/domain` | exit `0` | PASS |
| 5 | Subdirectorio interno vacío | `1` | D5-R003 | D5-R003 | `src/modules/access/domain/future` | exit `0` | PASS |
| 6 | `AppModule` sin decorador | `1` | D5-R023 | D5-R023 | `src/app.module.ts` | exit `0` | PASS |
| 7 | Imports TypeScript sin composición | `1` | D5-R023 | D5-R023 | `src/app.module.ts` | exit `0` | PASS |
| 8 | `@Module({})` | `1` | D5-R023 | D5-R023 | `src/app.module.ts` | exit `0` | PASS |
| 9 | `@Module` sin `imports` | `1` | D5-R023 | D5-R023 | `src/app.module.ts` | exit `0` | PASS |
| 10 | Módulo obligatorio faltante | `1` | D5-R003 | D5-R003 | `src/modules/access/access.module.ts` | exit `0` | PASS |
| 11 | Módulo desconocido adicional | `1` | D5-R023 | D5-R023 | `src/app.module.ts` | exit `0` | PASS |
| 12 | Violación D5-R029 | `1` | D5-R029 | D5-R029 | `src/modules/access/infrastructure/request-context.ts` | exit `0` | PASS |
| 13 | Violación D5-R035 | `1` | D5-R035 | D5-R035 | `src/modules/access/domain/create-repair.ts` | exit `0` | PASS |
| 14 | Violación D5-R036 | `1` | D5-R036 | D5-R035, D5-R036 | `src/modules/access/presentation/http/authority.controller.ts` | exit `0` | PASS |

El caso 13 demuestra D5-R035 sin D5-R036. El caso 14 demuestra el diagnóstico
propio D5-R036; también activa D5-R035 porque todos los controllers continúan
fuera del alcance de PBI-022.

## Copias divergentes de SPIKE-009

`postgres 2.sh` era una revisión más corta con path Homebrew y puerto fijos y
runtime persistente. El `postgres.sh` canónico contiene descubrimiento de
PostgreSQL 18, runtime/puerto aislados, ownership y cleanup. `static-check
2.mjs` sólo comprobaba `ModuleRef`; el canónico añade las reglas
arquitectónicas. Ninguna copia tenía referencias o cambios legítimos ausentes
del original. Se clasificaron como copias accidentales/superseded (caso A) y
se eliminaron. Los originales de SPIKE-009 permanecen intactos.

## Limitaciones conservadas

- No se evalúa código ni metadata dinámica; la composición calculada se
  rechaza.
- No se resuelven imports calculados, reflexión, generación, aliases o loaders
  no autorizados.
- La semántica de hechos, mutabilidad y autoridad con vocabulario no incluido
  en policy exige revisión humana.
- El checker sigue siendo enforcement local transitorio; DEC-051 conserva la
  estrategia general y DEC-049 conserva persistencia/ownership de datos.

## Ausencias confirmadas

No se crearon controllers reales, providers funcionales, endpoints,
autenticación, autorización funcional, PIN, sesiones, persistencia, SQL,
migraciones, lógica tenant/sucursal/reparación, CI, deploy, workspaces,
microservicios, aliases, loaders ni roots anticipatorios.

## Resultado de remediación

| Validación | Resultado |
| --- | --- |
| Toolchain Node.js/pnpm/TypeScript | PASS — `24.18.0` / `11.15.1` / `6.0.3` |
| Install frozen | PASS |
| `verify:architecture` | PASS |
| `test:architecture` | PASS — 82/82 |
| `typecheck` | PASS |
| `build` | PASS |
| `pnpm test` | PASS — 87/87 |
| `verify`, primera y segunda corrida | PASS / PASS |
| Smoke compilado | PASS — 25/25 consecutivos, sin reintento silencioso |
| Regresiones manuales | PASS — 14/14 y 14/14 restauraciones |
| Duplicados `* 2.*` | PASS — ninguno permanece |
| Whitespace y enlaces Markdown | PASS |

**PASS — DEC-005 REMEDIATIONS COMPLETE**

Aun con este PASS técnico falta repetir desde cero la verificación formal
independiente. Este documento no la ejecuta ni la sustituye; DEC-005 permanece
`Accepted — Materialized / Formal Verification Pending` y PBI-022 permanece
`In review`.
