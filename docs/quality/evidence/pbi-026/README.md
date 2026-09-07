# PBI-026 — Contextual Authorization Evidence

## Estado

- **Estado:** In progress; candidato local de integración materializado, todavía
  no revisado ni integrado.
- **PBI actual / WIP:** PBI-026 / `1/1`.
- **Risk / size:** Critical / Large.
- **DoR:** [PASS](./DEFINITION_OF_READY.md).
- **Threat model:** [complete](./THREAT_MODEL.md).
- **Integration candidate:** [artefactos, matriz y verificación
  local](./INTEGRATION_CANDIDATE.md).
- **Owner Start Authorization:** `Identity Master Goal` y decisión Owner de
  reanudación vigentes para este slice exacto.
- **Released / deployed:** NO / NO.

## Baseline

- `main`: `54ddc251cda8ec7465b7913786c647f8d3ccbeac`.
- Cierre PBI-034: PR #34, merge exacto anterior.
- CI autoritativo exact-main: run `34153470560`, run-1/run-2/comparison GREEN.
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
| Two-run reproducibility | CI run-1/run-2/comparison | Pending; no CI run claimed |

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
New Repair y writes D5/D6 permanecieron sin affordances. CI exacto sigue
pendiente.

## Boundaries

No actor/audit/correlation PBI-028, capability catalog expansion, ABAC,
reinforced authorization, administration productiva, remote infrastructure,
release or deploy.

## Gates pendientes

- SHA/commit lógico y Draft PR exactos;
- CI candidate run-1/run-2/comparison GREEN;
- focused Critical-risk review y Owner Review.

G4 permanece `Pending`; PBI-026 no está `Done` ni `Released`. PBI-028 sigue
como candidato no iniciado y no obtiene autoridad por este expediente.

## Próxima revisión

Actualizar la matriz únicamente con resultados ejecutados sobre el mismo
candidato exacto. El siguiente gate es focused Critical-risk review y Owner
Review; no merge, cierre, release, deploy ni PBI-028 por inferencia.
