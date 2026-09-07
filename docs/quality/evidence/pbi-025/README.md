# PBI-025 — PIN Credential Authentication Evidence

## Estado

- **Estado:** `Done`; [canonical closure](./CLOSURE_CANDIDATE.md) integrated.
- **PBI:** PBI-025; current PBI NONE; WIP 0/1; PBI-034 Done candidate.
- **Risk / size:** Critical / Large.
- **DoR:** [PASS](./DEFINITION_OF_READY.md).
- **Threat model:** [complete](./THREAT_MODEL.md).
- **CI determinism:** [flakiness incident and scoped remediation](./CI_FLAKINESS_INCIDENT.md).
- **Remediation:** PR #31 merged as
  `a51ddcca13cfc43fccb77378643b6874dfb772da`; exact-main CI
  `34100056690` GREEN on attempt 1; code commit
  `e1c1a9ddcbcb57b43986697076078800fcb3b509`, incident record commit
  `8b1079b19bb8ff9c8d0863e5e8b3c2ad21d62839`.
- **Functional candidate:** `9ce69334692e919276dbe1100d232e695b6ae115`;
  focused Critical-risk review PASS with no open BLOCKER/HIGH/MEDIUM finding.
- **Functional integration:** PR #30, merge
  `328bdf541be88b21a2e7dbea28f4a2a6f32f6986`; exact-main CI
  `34094803024` GREEN on attempt 1.
- **Candidate CI incident:** run `34092781952` attempt 1 failed in both
  independent owner-scoped PostgreSQL legs; attempt 2 passed on the same SHA.
  The first result remains material and is not replaced by the rerun.
- **Owner ratification:** PR #30 integration ratified only for PBI-025 closure;
  the recorded DEC-051/DEC-063 deviation remains, with no general waiver.
- **Owner Acceptance:** APPROVED conditionally; all material predicates passed.
- **Closure:** PR #32 merge
  `ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e`; exact-main CI
  `34124746317` GREEN in attempt 1.
- **Released / deployed:** NO / NO.

## Candidate scope

- credencial PIN Access-owned separada del User;
- Argon2id versionado con salt/pepper;
- provisioning server-only local/test e idempotencia;
- verificación sobre Trusted Station + User seleccionado;
- cinco fallos/lock cinco minutos y rate limit Station/principal opaco;
- prueba de autenticación efímera; ninguna Session/capability/action.

## Artifact inventory

### Product and persistence

- `src/modules/access/domain/pin-credential.ts`;
- `src/modules/access/application/pin-input.ts`;
- `src/modules/access/application/ports/pin-secret-hasher.port.ts`;
- `src/modules/access/application/ports/pin-credential-repository.port.ts`;
- `src/modules/access/application/use-cases/provision-pin-credential.use-case.ts`;
- `src/modules/access/application/use-cases/authenticate-pin.use-case.ts`;
- `src/modules/access/infrastructure/security/node-argon2-pin-hasher.ts`;
- `src/modules/access/infrastructure/persistence/kysely-pin-credential.repository.ts`;
- narrow Users authentication reader and public Trusted Station context seam;
- `20260907010000_access_create_pin_credentials.ts` additive migration;
- local-only ignored-environment PIN/pepper generation and hashed seed rows.

### Tests and authoritative inventory

- `test/access-pin-application.test.mjs`: exact input, generic denial, proof
  boundary and no Session/authorization;
- `test/access-pin-contract.test.mjs`: schema/KDF/configuration/redaction and
  production exclusions;
- `test/access-pin-postgresql.test.mjs`: real migration, provisioning,
  idempotency, concurrency, lock/rate, tenant/Station/User isolation and
  plaintext exclusion;
- `test/local-development-contract.test.mjs`: synthetic local fixtures persist
  only verifier material;
- architecture migration/schema/persistence contracts and full mutation suite;
- owner-scoped PostgreSQL runner and VC-024 evidence manifest register the
  migration and material suite explicitly.

## Verification matrix

| Risk / criterion | Evidence | Candidate result |
|---|---|---|
| Six ASCII digits and exact payload | application/contract tests | PASS local |
| Argon2id profile, pepper, salt and redaction | contract tests + external-configuration scan | PASS local |
| Provisioning idempotency/concurrency | PostgreSQL material | PASS, two deterministic runs |
| Five failures, lock and expiry | PostgreSQL material | PASS, including concurrent threshold |
| Station/principal rate limit | PostgreSQL material | PASS, including successful, unknown, opaque-key, eligibility-invariant and concurrent-cap attempts |
| Tenant/Station/User isolation | PostgreSQL material negative cases | PASS |
| Inactive/revoked/missing User or credential | application + PostgreSQL | PASS; revoked credential uses dummy KDF and remains immutable |
| Migration up/down/reapply and constraints | PostgreSQL 18.4 | PASS, including negative CHECK/FK writes for credential and abuse-control tables |
| No Session/login/authorization surface | contract and production exclusion | PASS local |
| DEC-005/049 ownership and exact inventories | architecture + mutations | PASS local |
| Reproducibility | owner-scoped PostgreSQL run-1/run-2/comparison | PASS; PR #31 exact-main CI `34100056690` GREEN on attempt 1; original red preserved |

The material PostgreSQL runner completed `6/6` adapter suites in each of two
independent runs, cleanup passed, comparison matched and the material evidence
digest was
`cd7fcb704b4b3dd8d2e29ee3b8c02291b2a9add9751c1de81ab25fc2af03101f`.

## Implementation audit remediation

Focused review found and remediated four HIGH issues before final review: the
Argon2 limiter could transfer capacity unsafely and was instance-local; the
provisioning journal used a cheap HMAC over the six-digit PIN as an offline
oracle; and eligibility selected a shared versus per-User rate bucket, making
active Users enumerable after saturation; an active credential under lock
also skipped the dummy verifier on a fresh Station and exposed a timing
oracle. The implementation now uses a
race-free process-wide limiter, an Argon2id provisioning fingerprint with a
domain-separated deterministic salt, and an eligibility-invariant opaque
rate principal with bounded Station-local retention. Locked, missing,
ineligible and invalid-credential paths traverse the same dummy verifier seam
when rate capacity is available. Public failures collapse to one denial and
repository exceptions are sanitized. Contract and material tests cover
limiter capacity, divergent replay, local-fixture equivalence,
cross-eligibility rate state and locked-credential dummy verification. A
MEDIUM stale configuration statement that still classified `SR_PIN_PEPPER` as
reserved was also corrected. The final focused product/security review passed
with no open BLOCKER/HIGH/MEDIUM finding. A later independent DoD audit found
the separate CI determinism blocker recorded above; it does not reopen the
resolved product findings.

## Canonical closure

The authorized merge of the [closure candidate](./CLOSURE_CANDIDATE.md) and
exact-main CI `34124746317` GREEN satisfy the post-merge semantics. PBI-025 is
canonically `Done`; this does not authorize release or deploy.

## Boundaries

No login UI/HTTP, Operational Session, contextual authorization, business
audit, operational reset/revocation command or surface, production secret,
remote infrastructure, release or deploy. `Identity Master Goal — Part D`
autoriza esta secuencia: estado/versionado y fallo cerrado aquí no afirman que
el lifecycle operacional futuro ya esté implementado.
