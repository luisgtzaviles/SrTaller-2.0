# PBI-041 — Verification Gate Remediation

- **Fecha:** 2026-09-19.
- **Base:** `ec1c29fc4fe92795e86429f73b37cb15b51e0be7`.
- **Alcance:** exclusivamente el guard de superficies protegidas y los
  contratos de migraciones señalados por el Final Closure Audit.
- **Resultado:** **BLOCKED — los dos blockers originales quedaron resueltos,
  pero `verify` reveló dos blockers PBI-041 distintos fuera del alcance
  autorizado.**

## Reproducción previa

Antes de editar se reprodujeron los fallos originales bajo Node.js `24.18.0` y
pnpm `11.15.1`:

1. `verify:integration-baseline` rechazó
   `apps/dev-preview-web/src/api.ts` desde
   `scripts/lib/integration-baseline.mjs:72`.
2. `verify:full` falló en Stage 0, con Cleanup y Final Fingerprint PASS.
3. `verify` rechazó el inventario de migraciones porque los contratos de test
   no estaban alineados con las 75 migraciones gobernadas del repositorio.

La diferencia entre el blob PBI-039 aceptado
`3a7c93f4f1597dbef9bbbfcc916dcd3cb7afe226` y el blob PBI-041
`f1e9a33f9a7dc534e223eee37bb1b234feafb35b` es exactamente:

```ts
readonly parameter: string | null = null,
```

No se reescribe el resultado anterior: el Final Closure Audit detectó
correctamente ambos blockers.

## Remediación de superficie protegida

`PBI039_PROTECTED_SURFACES` permanece intacto. Una manifestación separada,
`PBI041_AUTHORIZED_PROTECTED_SURFACE_CHANGES`, superpone únicamente:

- path exacto: `apps/dev-preview-web/src/api.ts`;
- blob previo exacto;
- blob autorizado exacto;
- Owner PBI, decisión y razón.

La construcción del contrato rechaza wildcard, path no gobernado, blob previo
stale, duplicados, hash inválido o metadata incompleta. La evaluación continúa
comparando los 20 paths protegidos por hash. Resultado:

- blob PBI-041 actual: PASS;
- drift adicional en `api.ts`: rechazado;
- drift en otra superficie protegida: rechazado;
- path no gobernado: rechazado;
- wildcard: rechazado;
- `verify:integration-baseline` sobre `176da5b`: PASS.

## Remediación del contrato de migraciones

Los allowlists de API pública y ownership reconocen ahora exactamente:

- `20260917190000_catalog_create_field_policies.ts`;
- `20260917190100_access_add_catalog_configuration_capabilities.ts`;
- `20260917190200_access_add_granular_catalog_capabilities.ts`.

Los contratos de manifest materializan las 75 migraciones actuales con orden y
owner exactos. No se cambió ninguna migración, policy de ejecución, timestamp,
wildcard ni rango permisivo.

Pruebas focalizadas: **41/41 PASS**. Incluyen inventario exacto, ownership
fail-closed, migración desconocida inválida, identificador duplicado, drift de
orden y contenido duplicado. PostgreSQL `18.4` desechable: **10/10 PASS**, 75
migraciones aplicadas, segunda ejecución `0` aplicadas / `0` pendientes y
contenedor eliminado.

## Verificación posterior

| Gate | Resultado |
| --- | --- |
| Build gobernado | PASS |
| Guard focalizado | 8/8 PASS |
| Contratos de migración focalizados | 41/41 PASS |
| PostgreSQL PBI-041 | 10/10 PASS; 75 migraciones; segunda ejecución 0 pending |
| `verify` | FAIL; 931 PASS, 2 FAIL, 29 skipped |
| `verify:full` posterior | NOT RUN; el orden autorizado exige `verify` PASS primero |
| Closure Readiness Recheck | NOT RUN; predicates no satisfechos |

El benchmark 10k ejecutado por PostgreSQL midió `publish=28,775.0 ms`, dentro
del presupuesto de 30 s. No se modificó benchmark, threshold ni implementación.

## Nuevos blockers

| ID | Clasificación | Hallazgo |
| --- | --- | --- |
| `B-041-FV-003` | PBI-041 BLOCKER | `test/full-verification-orchestration.test.mjs` detecta que `expectedPostgresqlSkipInventory` espera 21 tests materiales, mientras el árbol actual contiene 29, incluidos 7 en Bulk Catalog, 2 en Catalog y el nuevo test de Catalog authorization. Corregirlo requiere autoridad adicional sobre la orquestación full. |
| `B-041-FV-004` | PBI-041 BLOCKER | `test/ui-foundation-contract.test.mjs` detecta tres infracciones existentes en Composer: inline style en `BulkCatalogComposerPage.tsx`, radius compuesto no canónico y `!important` fuera de la excepción de reduced motion en `bulk-catalog-composer-page.module.css`. Resolverlo requiere remediación de producto/UI, expresamente fuera de este slice. |

No se debilitó ninguno de esos gates. No se ejecutó `verify:full` una segunda
vez, porque `verify` no pasó. No hubo mutación de datos Owner, AviCell,
SupplierVersions, Catalog, schema, roles, policy, push, PR, merge ni deploy.

## Dictamen

Los blockers `B-041-FV-001` y `B-041-FV-002` están **RESOLVED**. PBI-041
permanece **NOT READY — BLOCKERS REMAIN** por `B-041-FV-003` y
`B-041-FV-004`; todavía no es elegible para Formal Verification independiente.
