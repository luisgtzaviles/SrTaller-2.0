# Preparación para revisión formal

## Dictamen del refinamiento

**PASS — PBI-024 REFINED AND READY FOR FORMAL REVIEW**

Este dictamen evalúa completitud documental. No es revisión independiente, no
autoriza implementación, no cambia R0 y no permite merge.

## Checklist de completitud

| Criterio | Resultado | Evidencia |
| --- | --- | --- |
| alcance cerrado | PASS | PBI + README |
| exclusiones cerradas | PASS | PBI + plan |
| arquitectura clara | PASS | ARCHITECTURE |
| modelo station claro | PASS | ARCHITECTURE |
| trusted context claro | PASS | ARCHITECTURE |
| lifecycle claro | PASS | STATION_LIFECYCLE |
| matriz completa | PASS | 20 casos allow/deny |
| errores claros | PASS | ERROR_MAPPING |
| persistencia definida | PASS | dos tablas, constraints y owner |
| concurrencia definida | PASS | revision + guard + no cache |
| pruebas definidas | PASS | TEST_PLAN |
| mutaciones definidas | PASS | 20 mutaciones |
| evidencia definida | PASS | EXPECTED_EVIDENCE |
| riesgo clasificado | PASS | alto, fail-closed |
| estimación incluida | PASS | L por bloques |
| criterios verificables | PASS | 18 criterios binarios |
| gates de Ready completos | PASS | DEC-051/063 aplicabilidad |
| C02 preservado | PASS | Pending; merge bloqueado |
| implementación no autorizada | PASS | estado y restricciones |
| decisión bloqueante en scope | ninguna | diferidos asignados a PBIs owners |

## Gates antes de autorizar implementación

La revisión independiente debe obtener dictámenes separados:

| Rol | Pregunta |
| --- | --- |
| Producto | ¿Lifecycle, relink/revoke y exclusiones conservan ADR-010? |
| Seguridad | ¿Recognition boundary, anti-enumeración y threat cases son suficientes? |
| Arquitectura | ¿Ownership, graph, public API y persistence respetan DEC-005/049? |
| Ingeniería | ¿CAS, guard, schema, tests y secuencia son implementables? |
| Operaciones | ¿PostgreSQL/cleanup/evidence y C02 están correctamente gobernados? |
| Calidad | ¿Criterios, matriz y mutaciones prueban el contrato? |

Además debe:

- verificar HEAD y diff exactos;
- confirmar ausencia de contradicción nueva;
- confirmar DEC051-C04 y DEC063-C02/C06 como gates;
- reevaluar C02;
- emitir `PASS`, `PASS WITH CONDITIONS` o `FAIL`;
- decidir separadamente autorización, alcance y eventual rama.

## Decisiones cerradas dentro del alcance

- tipo de contexto y fields;
- ownership;
- tablas/constraints conceptuales;
- lifecycle y relink;
- terminalidad de revoke;
- public API;
- source boundary;
- no cache;
- optimistic concurrency/guard;
- errors;
- pruebas/mutations/evidence;
- integración con PBIs 025–029.

## Diferidos no bloqueantes

| Tema | Owner futuro | Razón |
| --- | --- | --- |
| credential mechanism/rotation | PBI-029 | secreto/configuración |
| usuario/PIN/sesión | PBI-025 | ADR-011 |
| autorización lifecycle | PBI-026 | ADR-012/013 |
| resolvedAt/time policy | PBI-027 | DEC-037/038 |
| correlation/auditoría/motivo | PBI-028 | DEC-045–048 |
| HTTP/UI | PBI posterior | fuera de alcance |
| RLS/offline/cache | decisión futura | no necesarios |

Cada diferido tiene owner y frontera. Ninguno exige una elección para
implementar y probar el slice fundacional sin wiring funcional.

## Estado resultante

`Ready for formal review — implementation not authorized`.

No usar `Ready for implementation`, `In progress`, `Authorized` o `Done`.

## Validación del refinamiento

Ejecutada localmente el 2026-07-26 con Node.js `24.18.0` y pnpm `11.15.1`:

| Gate | Resultado |
| --- | --- |
| Markdown, links y fences del expediente | PASS — 16 archivos, 0 fallos |
| `git diff --check` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run test:architecture` | PASS — 261/261 |
| `pnpm test -- test/ci-evidence.test.mjs` | PASS — 335 pass, 10 skips ordinarios, 0 fail |
| scope del diff | PASS — sólo documentación PBI-024 |
| secrets scan focalizado | PASS |

El shell por defecto usaba Node.js `25.9.0` y el gate lo rechazó correctamente
antes de ejecutar. La validación autoritativa se repitió con la instalación
local canónica de Node.js `24.18.0`; no se instaló ni modificó ninguna
dependencia.

## Restricción de merge

Incluso si una revisión posterior autoriza implementación, DEC051-C02 mantiene
bloqueado el primer merge funcional hasta quedar `Satisfied` o ser modificada
por decisión formal separada.

## Siguiente acción autorizada

**Ejecutar una revisión formal independiente de PBI-024 para decidir si puede
autorizarse su implementación.**
