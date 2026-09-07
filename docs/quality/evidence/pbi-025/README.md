# PBI-025 — PIN Credential Authentication Evidence

## Estado

- **Estado:** implementation evidence in progress.
- **PBI:** PBI-025; current PBI; WIP 1/1.
- **Risk / size:** Critical / Large.
- **DoR:** [PASS](./DEFINITION_OF_READY.md).
- **Threat model:** [complete](./THREAT_MODEL.md).
- **Baseline:** `main` at
  `d1a98c6d158cf53e1718a75c82f8eafbc3aafaf1`; exact-main CI
  `34084930812` GREEN.
- **Released / deployed:** NO / NO.

## Candidate scope

- credencial PIN Access-owned separada del User;
- Argon2id versionado con salt/pepper;
- provisioning server-only local/test e idempotencia;
- verificación sobre Trusted Station + User seleccionado;
- cinco fallos/lock cinco minutos y rate limit Station/User;
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
| Station/User rate limit | PostgreSQL material | PASS, including successful and unknown-principal attempts |
| Tenant/Station/User isolation | PostgreSQL material negative cases | PASS |
| Inactive/revoked/missing User or credential | application + PostgreSQL | PASS; revoked credential uses dummy KDF and remains immutable |
| Migration up/down/reapply and constraints | PostgreSQL 18.4 | PASS |
| No Session/login/authorization surface | contract and production exclusion | PASS local |
| DEC-005/049 ownership and exact inventories | architecture + mutations | PASS local |
| Reproducibility | owner-scoped PostgreSQL run-1/run-2/comparison | PASS local; candidate VC-024 pending |

The material PostgreSQL runner completed `6/6` adapter suites in each of two
independent runs, cleanup passed, comparison matched and the material evidence
digest was
`cd7fcb704b4b3dd8d2e29ee3b8c02291b2a9add9751c1de81ab25fc2af03101f`.

## Implementation audit remediation

One HIGH finding was identified before the candidate was committed: the
Argon2 work limiter released capacity before handing a permit to a queued
operation and its default capacity was instance-local. That could exceed the
governed memory bound when a new caller barged ahead of a resumed waiter or
when multiple default hasher instances existed. The implementation now uses a
race-free permit transfer and a process-wide default limiter; invalid custom
limits, zero-queue exhaustion and cross-instance capacity are covered by
contract tests. A focused documentation review also found a MEDIUM stale
configuration statement that still classified `SR_PIN_PEPPER` as reserved;
the configuration and local-development contracts now identify the active
server-only Access consumer. No BLOCKER/HIGH/MEDIUM finding remains from this
audit.

## Evidence pending

- exact implementation commits and Draft PR;
- candidate CI exact run-1/run-2/comparison;
- focused Critical-risk review;
- merge/main CI/Owner Acceptance and closure evidence.

The final evidence update must bind every `PASS` above to the exact candidate
SHA and CI run. Local success does not imply review, merge, `Done`, release or
deploy.

## Boundaries

No login UI/HTTP, Operational Session, contextual authorization, business
audit, operational reset/revocation command or surface, production secret,
remote infrastructure, release or deploy. `Identity Master Goal — Part D`
autoriza esta secuencia: estado/versionado y fallo cerrado aquí no afirman que
el lifecycle operacional futuro ya esté implementado.
