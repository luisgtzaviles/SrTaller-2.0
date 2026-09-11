# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** snapshot del cierre candidato de PBI-039 sobre la baseline
  integrada y validada en Preview.
- **Baseline Git integrada observada:** `main` y `origin/main` en
  `0d1c5760ce962d17a8292b841f5de43a8cb453a7`.
- **CI autoritativa exacta de `main`:** run
  [`34619271236`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34619271236),
  `SUCCESS`; run-1, run-2 y comparison verdes.
- **PBI actual:** `PBI-039` en `Done candidate`; el merge autorizado y CI
  autoritativa de `main` de este PR documental materializan `Done` efectivo.
- **WIP:** `0/1`; no existe siguiente PBI seleccionado ni autorizado.
- **Preview:** desplegado desde el merge exacto `0d1c576…`, saludable y
  validado con un flujo autenticado New Repair create/detail/reload/worklist.
- **Production:** no desplegada ni autorizada.
- **Regla:** este documento describe estado; no autoriza iniciar otro PBI,
  Production, infraestructura o un release adicional.

## Resumen ejecutivo

PBI-039 entregó Customer Minimum, New Repair Classic 2.0, Personal Form Mode,
Guided V2, política de campos por Branch, catálogos administrativos y las
superficies aceptadas de Repair Detail. El Functional Slice fue aceptado por
Owner; Formal UI Verification, Hardening, Authoritative Full Verification,
CI / PR Readiness, CI autoritativa y revisión independiente terminaron `PASS`.

El cambio principal se integró mediante PR
[#42](https://github.com/luisgtzaviles/SrTaller-2.0/pull/42), merge
`6c04e57c8a5d3bf8600cd4a2a3a191958aa0f0c2`, y recibió CI exacta de `main`
[`34604591354`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34604591354)
verde. La revisión independiente había encontrado una omisión HIGH de
`canonicalDeviceTypeId` en la huella idempotente y una contradicción MEDIUM en
documentación viva; ambos findings se remediaron y reverificaron antes del
merge.

La validación post-deploy de Preview descubrió dos defectos reales de
integración, ya cerrados sin reabrir decisiones de producto:

1. PR [#43](https://github.com/luisgtzaviles/SrTaller-2.0/pull/43), merge
   `5ccc525a09d29fd6dcabbbfaabff9b811677c985`, corrigió el cache/ETag del
   entrypoint SPA. CI exacta de `main` `34614530586` terminó verde.
2. PR [#44](https://github.com/luisgtzaviles/SrTaller-2.0/pull/44), merge
   `0d1c5760ce962d17a8292b841f5de43a8cb453a7`, recompuso Repairs sobre la
   conexión compartida gobernada para que el runtime OCI de Preview use los
   repositorios persistentes. CI exacta de `main` `34619271236` terminó verde.

El único warning de build aceptado es el chunk Vite de aproximadamente
531.33 kB. No se redujo cobertura, no se ocultaron skips materiales y no se
inició Lista de precios, Caja, Evidencias/R2 ni otro ciclo.

## Evidencia de cierre PBI-039

| Área | Evidencia vigente |
|---|---|
| Functional Slice | Frozen — Owner Accepted |
| Formal UI Verification | PASS |
| Hardening | PASS |
| Full Verification del candidato principal | PASS; campañas y fingerprints conservados en el expediente PBI |
| Revisión independiente | PASS; registrada como comentario formal por restricción de autoaprobación GitHub |
| Integración principal | PR #42 -> `6c04e57…` |
| Cache/ETag Preview | PR #43 -> `5ccc525…`; exact-main CI `34614530586` PASS |
| Repairs shared runtime | PR #44 -> `0d1c576…`; exact-main CI `34619271236` PASS |
| Full Verification hotfix runtime | `local-full-verification-20260911154146-5ccc525a09d2`; 12/12 PASS; fingerprint `10fb843932175f6dc0d7c75ce5e3b08404d69858b016d407cb6480ad6cf3f4c4` |
| PostgreSQL material | PBI-023 17/17 y PBI-039 2/2, cero skips materiales |
| Preview endpoints | root 200 con `Cache-Control: no-store`; `/livez` 200; `/readyz` 200; API desconocida 404 |
| Preview UI | sesión Luis/Station reconocida; create/detail/reload/worklist PASS con `SR-2026-1000` y datos sintéticos |
| Production | No desplegada; no autorizada |

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles, capabilities, PIN y Operational
  Session con autorización contextual server-side.
- Customer mínimo y New Repair persistentes, Tenant/Branch scoped, con create
  idempotente y transaccional.
- New Repair Classic, Personal Form Mode y Guided V2 comparten dominio y
  comando; Device Access no persiste secretos.
- Catálogos de Device Types, Risks, Brands, Models y Problem Categories con
  reconciliación no bloqueante donde corresponde.
- Repair Worklist/Detail, Operational Header, Recepción, Historial y superficies
  read-only de Conceptos/Evidencias según el alcance aceptado.
- Auditoría y timeline atómicos para los writes cubiertos.

## Límites y deuda conocida

- Basic Operational Evidence con mutación, Price List, Refacciones, Servicios,
  venta personalizada, Caja, Anticipo, Abonos, Liquidación, Diagnosis avanzada,
  analytics/AI y promoción de catálogos siguen diferidos y no bloquearon
  PBI-039.
- Los secretos de acceso de dispositivos no se persisten; su almacenamiento
  seguro requiere arquitectura y autorización separadas.
- El warning Vite de tamaño de chunk queda visible como deuda no bloqueante.
- Preview contiene datos sintéticos de validación; no es Production.
- El repositorio público observado continúa sin branch protection/ruleset;
  autorización humana y evidencia siguen siendo gates obligatorios.

## Roadmap y WIP

| Elemento | Estado vigente |
|---|---|
| Sprint activo | SPRINT-02 — Operational Authentication & Authorization |
| Current PBI | `PBI-039` — Done candidate durante este PR documental |
| WIP | `0/1` |
| Next candidate | `NONE` |
| G6 Customer mínimo | PASS candidate |
| G7 New Repair / Intake | PASS candidate |
| Preview | Desplegado y validado en `0d1c576…` |
| Production / release | NO / NO |

## Próxima acción

Revisar, integrar y ejecutar CI autoritativa sobre el SHA exacto de `main` de
este PR documental. Ese resultado materializa PBI-039 `Done`; después, detenerse
sin seleccionar ni iniciar otro PBI.
