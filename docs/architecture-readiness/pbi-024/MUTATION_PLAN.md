# Plan de mutaciones críticas

## Estrategia ejecutable

El harness usa una copia temporal controlada por mutación. Copia sólo las
superficies requeridas, reutiliza las dependencias congeladas mediante un
symlink de `node_modules`, aplica una transformación semántica y ejecuta:

1. `pnpm run build`;
2. el subconjunto de pruebas de Station que debe matar el defecto.

Las mutaciones corren serialmente con timeout. Un reporter personalizado
compatible con la API oficial `node:test` de Node.js 24 emite
`srtaller-node-test-results/v1`. El parser exige identidad exacta por archivo
normalizado + nombre completo, diferencia PASS/FAIL/SKIP y valida una huella
causal estable. No se usa substring, color, salida visual ni exit code como
prueba de causalidad.

El runner captura `stdout`/`stderr`, exige que el código mutado compile, exige
que al menos una prueba objetivo exacta falle con firma compatible y limpia
en `finally`. También compara exactamente el estado Git original y rechaza
mutación no aplicada, sintaxis rota, superviviente, fallo ajeno, timeout,
salida inválida, cleanup incompleto, residual o contaminación.

Se eligió `controlled-temporary-copy` porque el harness también debe funcionar
mientras el checkout de desarrollo contiene cambios aún no confirmados. Un
worktree detached sólo ve el commit y no necesariamente el material exacto
que se está validando antes de commit.

| ID | Defecto sembrado | Suite que debe matarlo |
| --- | --- | --- |
| MUT-024-01 | eliminar `tenantId` del predicado station | PostgreSQL isolation |
| MUT-024-02 | omitir `tenantId` del lookup de binding abierto | binding tenant scope |
| MUT-024-03 | permitir status `Revoked` en resolver | application/lifecycle |
| MUT-024-04 | omitir validación de `bindingRevision` antes de emitir confianza | resolver lower/higher revision |
| MUT-024-05 | aceptar `branchId` de payload como efectivo | contract/security |
| MUT-024-06 | omitir denegación por elegibilidad de Branch | resolver fail-closed |
| MUT-024-07 | omitir `FOR UPDATE` del lock de Station | lock semantics |
| MUT-024-08 | ejecutar efecto protegido fuera de la unidad de trabajo | rollback/atomicidad |
| MUT-024-09 | devolver `TrustedStationContext` mutable | freeze |
| MUT-024-10 | fallback a la primera Station reconocida | recognition fail-closed |
| MUT-024-11 | revocar sin cerrar el binding abierto | lifecycle/history |
| MUT-024-12 | incrementar revision por dos | monotonicidad exacta |
| MUT-024-13 | permitir record de binding cross-tenant | ownership tenant |
| MUT-024-14 | aceptar contexto estructuralmente forjado | context source |
| MUT-024-15 | exponer mensaje interno públicamente | sanitización |
| MUT-024-16 | omitir revisión de Station en el guard | defensa en profundidad |
| MUT-024-17 | omitir `bindingRevision` en el guard | defensa en profundidad |
| MUT-024-18 | omitir Branch del binding en el guard | defensa en profundidad |
| MUT-024-19 | omitir status Active en el guard | defensa en profundidad |
| MUT-024-20 | convertir deny de reconocimiento en allow | deny-by-default |
| MUT-024-21 | aceptar múltiples bindings abiertos | integridad |
| MUT-024-22 | cerrar binding sin tenant scope | aislamiento |
| MUT-024-23 | transición de Station sin CAS de revisión | concurrencia |
| MUT-024-24 | permitir transición fuera de Revoked terminal | lifecycle |
| MUT-024-25 | permitir link cuando ya existe binding abierto | integridad/lifecycle |

Los IDs existentes se preservan, aunque su transformación se corrigió para
que cada uno represente un defecto runtime válido. Ninguna mutación usa
comentarios, código muerto, sintaxis inválida, imports irrelevantes o
aserciones que busquen el texto sembrado.

Cada ID declara una lista de objetivos exactos. El baseline estructurado
inventaría 34 pruebas y valida 35 declaraciones: cada objetivo debe existir
una sola vez, ejecutarse, pasar y no estar skipped antes de comenzar la
campaña. Sólo `EXPECTED_TEST_FAILURE` puede producir `killed: true`.

Las clasificaciones exclusivas son `PASS`, `EXPECTED_TEST_FAILURE`,
`UNRELATED_TEST_FAILURE`, `BUILD_FAILURE`, `TEST_DISCOVERY_FAILURE`,
`INFRASTRUCTURE_FAILURE`, `TIMEOUT`, `MUTATION_NOT_APPLIED`,
`RESULT_PARSE_FAILURE` y `CLEANUP_FAILURE`.

## Demostraciones manuales

Además de la campaña automática, `MUT-024-01`, `04`, `07`, `11` y `15` se
ejecutan aisladamente para demostrar tenant scope, `bindingRevision`,
`FOR UPDATE`, cierre del binding en revoke y sanitización. Véase
[evidence/MANUAL_MUTATION_RESULTS.md](evidence/MANUAL_MUTATION_RESULTS.md).

## Evidencia

Por mutación:

- ID y riesgo;
- archivo/copia temporal;
- cambio semántico;
- comando y exit code;
- test/diagnóstico que la detectó;
- resultados estructurados, fallos esperados/inesperados y `causalMatch`;
- duración y prueba de cleanup/restauración;
- baseline posterior.

No se versiona código mutado ni logs con paths personales o secretos.

Los casos negativos A–J y la regresión explícita de expected test incorrecto
ejecutan el mismo camino del runner oficial. Véase
[CAUSAL_MUTATION_REMEDIATION.md](CAUSAL_MUTATION_REMEDIATION.md).
