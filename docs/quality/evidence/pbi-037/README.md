# PBI-037 — Users & Roles Product Iteration Evidence

## State

PBI-037 is the Owner-authorized Users & Roles product slice hardened inside the
active PBI-028 identity checkpoint. It does not become a second current PBI,
does not reopen the completed PBI-032/PBI-033 foundations and does not claim
integration, release or deploy.

## Material result

- business-language Roles list/create/edit and grouped capability replacement;
- Users list/create/edit, one-or-more Role assignments and active/inactive
  lifecycle without destructive delete;
- four-digit PIN initial provisioning and explicit replacement without
  plaintext response, persistence or post-save display;
- demo PIN inputs supplied only to the local seed process and scrubbed from
  `.env.local`, including inherited fixture keys;
- PIN-only login, server-resolved identity and real Operational Session;
- effective permissions derived only as the union of applicable Roles;
- tenant-wide server authorization for administration reads and writes, with
  a separate tenant-wide Session projection, transactional commit-time
  revalidation and preservation of at least one active, PIN-authenticable
  administrator holding all four administration capabilities across
  authority-removing mutations;
- profile editing with durable request identity and atomic exact-replay
  journal, plus replacement-first PIN idempotency after ambiguous responses;
- PIN replacement requires both User and access-matrix management authority;
  a successful PIN-only login releases only its own Station rate reservation
  and cannot clear failed attempts belonging to other callers;
- PostgreSQL collision/concurrency/idempotency/isolation coverage and a clean,
  responsive Light/Dark UI.

The shared exact evidence, commands, local browser proof and remaining gates are
recorded in the
[PBI-028 hardened integration candidate](../pbi-028/INTEGRATION_CANDIDATE.md).

## Remaining authority

Draft PR, exact candidate CI, focused review and explicit Owner merge
authorization are still required. No Production credential, remote database,
release or deploy belongs to this evidence.
