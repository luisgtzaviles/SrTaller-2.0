# PBI-026 — Contextual Authorization Evidence

## Estado

- **Estado:** Done candidate; alcance funcional integrado, CI exacto GREEN,
  focused review PASS y cierre documental pendiente.
- **PBI actual / WIP:** NONE / `0/1`.
- **Risk / size:** Critical / Large.
- **DoR:** [PASS](./DEFINITION_OF_READY.md).
- **Threat model:** [complete](./THREAT_MODEL.md).
- **Integration candidate:** [artefactos, matriz y verificación
  local](./INTEGRATION_CANDIDATE.md).
- **Closure candidate:** [evidencia de cierre](./CLOSURE_CANDIDATE.md).
- **Owner Start Authorization:** `Identity Master Goal` y decisión Owner de
  reanudación vigentes para este slice exacto.
- **Released / deployed:** NO / NO.

## Baseline

- Candidate: `54b3cf01c6b5ae0b51ca0b8f432d23abbb229ab7`.
- Candidate CI: run `34157187442`, run-1/run-2/comparison GREEN.
- Focused Critical-risk review: PASS; `0` BLOCKER, `0` HIGH, `0` MEDIUM y `0`
  LOW.
- PR funcional: #35; merge ordinario
  `4db5d9384d13c200eb2031dceb32dd89efcca64d` el
  `2026-09-07T20:07:36Z`.
- CI autoritativo exact-main: run `34158203438`, run-1/run-2/comparison GREEN.
- Owner Acceptance condicional: `APPROVED` al satisfacerse los predicados
  materiales sobre el merge y CI exactos.
- PBI-034: `Done`; G3: `PASS`.

## Candidate scope

- executor Access-owned de autorización contextual server-side;
- Station + Session + User + grants frescos y action capability exacta;
- resource membership Repairs-owned y scope Tenant/Branch efectivo;
- reads con `repairs.read`, note con `repairs.add_note` + CSRF;
- D5/D6/New Repair deny-by-default sin capabilities especulativas;
- capability projection advisory en UI, limpia en logout/switch;
- composición DEC-005 dirigida `repairs -> access`;
- PostgreSQL material, tests, documentación y evidencia; sin migración.

## Verification matrix

| Riesgo / criterio | Evidencia | Estado |
|---|---|---|
| Station/Session/User/grant fresh | application/HTTP/PostgreSQL | PASS local + PostgreSQL material |
| Capability exacta y role name ignored | contract/PostgreSQL | PASS local + PostgreSQL material |
| Tenant/Branch/resource isolation | HTTP/PostgreSQL | PASS local; PostgreSQL 18.4 `8/8` |
| Revocación/no cache | controlled application/PostgreSQL | PASS local + PostgreSQL material |
| CSRF/origin/JSON/no-store/errors | contract tests | PASS local; AppModule unauthenticated smoke incluido |
| D5/D6/New Repair zero effects | HTTP/UI/PostgreSQL | PASS contractual + PostgreSQL + runtime local |
| DEC-005 Option A | policy/checker/mutations | PASS local — policy v5; `307/307` |
| Login/reload/logout/switch projection | UI/local runtime | PASS contractual; login/logout/direct route PASS en runtime |
| Light/Dark/responsive/focus | local visual validation | PASS — 390/768/1280 px |
| Two-run reproducibility | CI run-1/run-2/comparison | PASS — candidate `34157187442`; exact-main `34158203438` |

Los estados anteriores distinguen artefactos existentes de ejecución exitosa.
El resultado reproducible de cada comando vive en
[Integration Candidate](./INTEGRATION_CANDIDATE.md); una fila no pasa a `PASS`
por existir un test, y ningún resultado local sustituye CI exacto.

La suite material PBI-026 cerró `8/8 PASS` sobre PostgreSQL 18.4; dos runs
fueron `MATCH`, con material SHA-256
`b6cbc03d7c758b613e31a4131c01e547603da691c846f04db205fc0c09a353b7`.
También pasaron localmente la matriz exacta de endpoints Repairs y el smoke de
`AppModule`/Nest sin Station confiable: `401 AUTHENTICATION_REQUIRED`, sin
bootstrap local implícito. `pnpm run verify` pasó con `599` tests, `582` PASS,
`17` skips esperados y `0` fail; typecheck, build, arquitectura v5,
configuración externa, UI foundation y exclusión del catálogo productivo
quedaron GREEN. Enlaces relativos (`586` archivos) y `git diff --check`
también pasaron. La validación visual/runtime local pasó en Light/Dark y
390/768/1280 px: login, Repairs, Detail, logout y acceso directo protegido;
New Repair y writes D5/D6 permanecieron sin affordances. Candidate y exact-main
CI quedaron GREEN.

## Boundaries

No actor/audit/correlation PBI-028, capability catalog expansion, ABAC,
reinforced authorization, administration productiva, remote infrastructure,
release or deploy.

## Estado de cierre

- DoD material: PASS.
- Focused Critical-risk review: PASS, sin findings abiertos.
- Merge funcional y CI exacto de `main`: PASS.
- Owner Acceptance condicional: APPROVED.
- Cierre documental: este candidato; merge y CI post-cierre pendientes.

PBI-026 queda `Done candidate`, G4 AUTHORIZATION `PASS candidate`, Current PBI
`NONE` y WIP `0/1`. PBI-028 queda seleccionado como siguiente candidato, no
iniciado, y no obtiene autoridad de implementación por este expediente.

## Próxima revisión

Integrar este cierre sólo mediante merge autorizado y exigir CI GREEN sobre su
SHA exacto de `main`. Esa conjunción vuelve efectivos PBI-026 `Done` y G4
`PASS` sin closure-of-closure; no autoriza release, deploy ni PBI-028.
