# PBI-037 — Users & Roles Product Iteration Evidence

## State

PBI-037 is the Owner-authorized Users & Roles product slice integrated inside
the PBI-028 identity checkpoint. It does not become a second current PBI, does
not reopen the completed PBI-032/PBI-033 foundations and has no independent
`Done`, release or deploy claim.

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

## Canonical relation and remaining authority

PR #37 integrated the shared checkpoint at
`ab8e8ba9a1274030e27ad920d61c66ed461bf122`; its exact-main CI `34193770228`
is GREEN. PR #38 integrated the PIN-dialog focus remediation at
`a9bb0744ebf8b32b91a9ddf90f67570830182afc`; its exact-main CI `34197268832`
is GREEN. The remaining gate belongs exclusively to PBI-028's documentary
closure PR. No Production credential, remote database, release or deploy
belongs to this evidence.
