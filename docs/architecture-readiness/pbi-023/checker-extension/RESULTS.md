# Resultados del checker extension

## Resultado global

**PASS — PBI-023 PERSISTENCE BOUNDARIES ENFORCED**

## Checklist

| Criterio | Resultado |
| --- | --- |
| D5-R037–D5-R047 implementadas | PASS |
| Registry future-approved fail-closed | PASS |
| 36 fixtures nuevas | PASS |
| 11 mutaciones aisladas | PASS |
| neutralización fixture-only/restauración | PASS |
| aliases/namespaces/type/reexports/shadowing | PASS |
| determinismo | PASS |
| falsos positivos sobre todo el repo | cero |
| SQL semántico adoptado | PASS — D5-R046 |
| `src/` sin cambios | PASS |
| manifests/lock/workflow sin cambios | PASS |

## Conteos

| Métrica | Antes | Después |
| --- | ---: | ---: |
| reglas directas del checker | 27 | 38 |
| fixtures | 98 | 134 |
| fixtures positivos | 12 | 17 |
| fixtures negativos | 86 | 117 |
| mutaciones de producto | 23 | 34 |
| contratos semánticos requeridos | 26 | 49 |
| pruebas de arquitectura | 159 | 207 |
| pruebas totales | 171 | 219 |

Los conteos de pruebas corresponden a la ejecución final registrada en el
manifest. Los seis adversariales internos D5-R033 permanecen fuera del conteo
de mutaciones de producto.

## Gates

| Comando | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run architecture` | PASS; policy 2; tres edges históricos |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS — 219/219 |
| `pnpm run test:architecture` | PASS — 207/207 |
| `pnpm run verify` | PASS — 219/219 + estructura + arquitectura |
| `pnpm run smoke:start` | PASS |
| `git diff --check` | PASS |
| links/JSON/YAML/sanitization/scope | PASS |

## Riesgos residuales

- No hay prueba PostgreSQL productiva: C03/C04 de DEC-051 siguen pendientes.
- Los paths registrados aún no existen y no deben crearse sin el Paso 4/5
  correspondiente.
- Una nueva API calculada de DB exige ampliar AST y pruebas antes de merge.
- D5-R039 identifica capacidad genérica estructural; la semántica de un
  repository específico conserva revisión humana.

## Estado

- PBI-023:
  `Ready — persistence boundaries enforced / dependency installation authorized`.
- No se autoriza implementación DB, R0, merge ni cierre de Sprint 00.
