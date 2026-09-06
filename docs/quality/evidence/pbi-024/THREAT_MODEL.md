# PBI-024 — Trusted Station Runtime Context Threat Model

## Boundary

The only runtime authority is an opaque, high-entropy credential carried in a
server-issued HttpOnly cookie. The verifier hashes it server-side and derives
tenant, station and branch solely from persistence. Request payload, query,
local storage, display names and browser fingerprints are not inputs to that
decision.

## Threats and controls

| Threat | Control | Required evidence |
| --- | --- | --- |
| Guessing or spoofing | Opaque credential and verifier lookup | verifier negative tests |
| Cookie exposure | HttpOnly transport contract; no API, DOM or logs expose the value | transport review |
| Replay after revocation | credential and station must both be active | PostgreSQL negative test |
| Cross-tenant binding | composite tenant/station and tenant/branch foreign keys | PostgreSQL FK test |
| Missing authority | resolver returns no partial context | unit negative tests |
| Local bootstrap escape | dual development gate and server-only configuration | bootstrap negative test |

## Non-goals

No production enrollment, administrative binding, hardware attestation, users,
PIN, sessions, authorization or remote secrets are implemented here.
