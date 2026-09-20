# PBI-041 — Preview SPA direct-route remediation

## Classification

- **Finding:** internal SPA navigation reached Bulk Catalog Composer and Catalog
  Field Policy, but direct navigation or browser reload returned HTTP `404`.
- **Environment:** Preview after PR #55 merge `b54a095241891807e8b399e12ef783d72f8982b5`.
- **Scope:** delivery/runtime routing only. Domain, API, authorization,
  persistence, migrations and Owner data are unchanged.
- **Root cause:** the bounded Preview SPA fallback allowlist did not contain the
  two PBI-041 paths declared by the frontend router.

## Remediation

The Preview static server now recognizes exactly:

- `/listas/precios/carga-masiva`;
- `/configuracion/catalogos/lista-de-precios/campos-de-carga`.

No wildcard or prefix fallback was added. Unknown product and API routes remain
`404`. The static-surface contract rejects removal of either path, and both the
compiled UI smoke and OCI verifier require each direct route to return the same
no-store SPA entrypoint as `/`.

## Local evidence

- bounded static-surface contract: `10/10` PASS;
- typecheck: PASS;
- build: PASS;
- DEC-005 architecture: PASS;
- compiled runtime smoke with PostgreSQL `18.4`: both routes `200`,
  `/api/unknown` `404`, unknown UI route `404`;
- migrations in the disposable smoke database: `75` applied, `0` pending;
- base `verify`: `940` PASS, `0` FAIL, `30` governed skips;
- `git diff --check`: PASS.

The first direct invocation of the smoke script lacked the required external
configuration and failed before runtime readiness. Re-running through the
repository's governed disposable PostgreSQL harness passed; no product defect
was hidden and no Owner data was used or changed.

## Pending governed evidence

- full integration verification: PASS on execution HEAD
  `d04264f9626eb134354540c72e5ebb75ecc77db3`; Stages `0..13`, PostgreSQL
  composite `17/17`, PBI-041 `10/10`, 75 migrations, second run `0 pending`,
  compiled UI smoke and cleanup/fingerprint all PASS;
- authoritative candidate CI and independent review on the exact HEAD;
- authorized merge and exact-main CI;
- corrected Preview deployment and direct navigation/reload proof.

Production is not authorized and remains unchanged.
