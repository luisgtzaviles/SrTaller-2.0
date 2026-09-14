# Workflow Phase 1 — Implementation Evidence

## Estado

- **Estado:** Done — merged; PR CI, independent review and exact-main full CI PASS.
- **Fecha:** 2026-09-14.
- **PR:** [#53](https://github.com/luisgtzaviles/SrTaller-2.0/pull/53).
- **Merge commit:** `859825025cf1f9fa94a8b0ced5b91b95760e36a8`.
- **Producto:** sin cambios.
- **PBI-041:** no seleccionado, no iniciado.
- **Owner Acceptance:** `DEVELOPMENT WORKFLOW PHASE 1 — OWNER ACCEPTED`,
  recibida el 2026-09-14.

## Candidato ejecutable congelado

| Evidencia | Resultado |
| --- | --- |
| Commit | `b01ba976737eb928b21c33ec44e894216b1a2441` |
| Risk classification | `CROSS_MODULE_HIGH_RISK` / enforced `FULL` |
| Shadow omission | `false` |
| Focused contracts | 45/45 PASS |
| Base verify | PASS; 860 tests, 840 PASS, 20 PostgreSQL skips materializados por el full |
| Full verification | 13/13 PASS |
| PostgreSQL composite | 5 suites, 17 tests, 0 critical skips |
| PBI-039 PostgreSQL | 2/2 PASS; 62 migrations |
| PBI-040 PostgreSQL | 1/1 PASS; 62 migrations; 10,000 items; p95 5.27 ms / 750 ms |
| Preview-like runtime | PASS; migrate 62/62, readiness failure/recovery y cleanup |
| Compiled backend/UI smoke | PASS |
| Candidate fingerprint | `17f96b6b7ff826ed914ec70cd15988a99acab5d4e9a3abb1a3b33411557c3c75` |
| Warning | Vite main chunk over 500 kB; warning preexistente aceptado por el gate |

La evidencia JSON vive fuera del repositorio en el directorio temporal
gobernado reportado por `verify:full`; no contiene credenciales ni datos de
negocio.

## Reconciliación final de policy

La reorganización del expediente técnico quedó congelada en
`5df5e1dad94140e52065694d7a86deb5a96f4d2f` y se sometió nuevamente a la campaña
integral. Este commit no cambia producto.

| Evidencia | Resultado |
| --- | --- |
| Full verification final | 13/13 PASS |
| Base verify | 860 tests; 840 PASS; 20 PostgreSQL skips materializados después |
| PostgreSQL composite | 5 suites; 17 tests; 0 critical skips |
| PBI-039 PostgreSQL | 2/2 PASS; 62 migrations |
| PBI-040 PostgreSQL | 1/1 PASS; 62 migrations; 10,000 items; p95 5.40 ms / 750 ms |
| Preview-like runtime | PASS; migrate 62/62, readiness failure/recovery y cleanup |
| Compiled backend/UI smoke | PASS; rutas de catálogo y Lista de precios incluidas |
| Candidate fingerprint | `de901e5573bf43a401ca6b272bd075af7285694d68eaa5fd5e8bd75d76152ca4` |
| Evidence path | `/var/folders/cv/669w783s1ksdxpldb_tcgq940000gn/T/srtaller-full-verification-evidence-YeYW8N/FULL_VERIFICATION_SUMMARY.json` |
| Warning | Vite main chunk over 500 kB; warning preexistente aceptado por el gate |

## Preflights

- Development Preflight: PASS; `main == origin/main`, branch basada en `main`,
  toolchain exacto, runtime local no requerido/no corriendo, PostgreSQL local
  disponible, journal 62/62, fixtures Owner disponibles y candidato estable.
- Preview migration state pre-merge: `UNKNOWN`, `NOT_CAPTURED`,
  `compatibility: NOT_ASSERTED`, advisory y no bloqueante.
- Pre-deploy con ese estado: bloqueante por contrato. No hubo acceso remoto,
  deploy ni journal inventado.

## Límites de evidencia

- No hubo cambio de producto, Preview mutation, deploy ni Production.
- PBI-041 permanece Ready, no seleccionado, no autorizado y no iniciado.
- El snapshot de migraciones Preview continúa `NOT_CAPTURED`; pre-merge fue
  advisory y no afirmó compatibilidad. Pre-deploy permanece bloqueante.

## Integración autoritativa

| Evidencia | Resultado |
| --- | --- |
| Head exacto final | `a0eb1f65c7afe32cbeddb01dc09ff52a47ff6026` |
| Full local final | 13/13 PASS; fingerprint `dc0dd7630743e801b67116489d8d6b43fa95ceedd851c8d4e85fe314356d4def` |
| PR CI | `34892262371` PASS sobre el head exacto |
| VC-024 | run-1 PASS; run-2 PASS; comparison PASS, differences `[]` |
| Independent review | PASS; Critical 0, High 0, Medium 0, Low 0 |
| Merge | PR #53 → `859825025cf1f9fa94a8b0ced5b91b95760e36a8` |
| Exact-main full CI | `34893081175` PASS; run-1, run-2 y comparison PASS |
| Candidate/main tree | ambos `afb2d52554ad57cc2d7d414b1e8301365a801e48` |
| Signal lost | cero |

Los dos intentos previos no se usaron como evidencia de aprobación. El run
`34889939355` detectó un contexto inválido de `runner.temp` a nivel job y el
run `34890595529` detectó checkout sin historia suficiente para el baseline.
La revisión independiente encontró además escapes potenciales por rename,
inventario parcial de métricas, enlaces hacia documentación eliminada y binding
al SHA sintético del PR. Todos fueron remediados, cubiertos y revalidados antes
del run verde final.

## Medición Phase 1

Baseline comparable auditada: exact-main `34814070839`, 12.6 min wall y
24.6 job-minutes.

| Medición | Wall | Job-minutes | Ahorro wall | Ahorro job |
| --- | ---: | ---: | ---: | ---: |
| PR Phase 1 `34892262371` | 6.98 min | 11.80 | 44.6 % | 52.0 % |
| exact-main `34893081175` | 7.13 min | 13.02 | 43.4 % | 47.1 % |

Contra el rango histórico de 10–12 min de pared, el PR observado redujo entre
30.2 % y 41.8 %. Cada leg conservó exactamente ocho stages materiales, una sola
vez y en orden:

| Stage | run-1 | run-2 |
| --- | ---: | ---: |
| install | 2.819 s | 2.335 s |
| base-verify | 191.930 s | 133.900 s |
| compiled-smoke-migration | 1.794 s | 1.270 s |
| postgresql-composite | 145.103 s | 117.205 s |
| pbi039-postgresql | 6.776 s | 6.409 s |
| postgresql-cleanup | 0.084 s | 0.071 s |
| compiled-backend-smoke | 1.613 s | 1.171 s |
| compiled-ui-smoke | 7.737 s | 7.194 s |

Architecture, typecheck, build y broad tests permanecen dentro de
`base-verify`; PostgreSQL material, evidence, determinism comparison y cleanup
permanecen explícitos. Se retiraron las invocaciones redundantes que antes
sumaban aproximadamente 340 segundos por leg, sin retirar ninguna de esas
señales.

## Shadow commissioning record

- clasificación propuesta: `CROSS_MODULE_HIGH_RISK`;
- pipeline recomendado por shadow: `CROSS_MODULE_HIGH_RISK`;
- pipeline ejecutado: `FULL` por `classification-policy-change`;
- gates ejecutados: clasificación, run-1, run-2, PostgreSQL material,
  compiled smokes, evidence, cleanup y comparison exacta;
- gates omitidos por shadow: ninguno;
- finding que un pipeline reducido habría perdido: ninguno;
- tree attestation: `SHADOW`, equivalencia candidata/integrada confirmada,
  `canReduceExactMain: false`, `fullExactMainRequired: true`.

Esta observación es el commissioning de la fábrica y no cuenta como uno de los
tres PBIs implementados exigidos por WF-006.
