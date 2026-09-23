# Main Branch Protection Contract

## Status and observed baseline

- **Status:** applied on 2026-09-22 under Owner decision INFRA-003.
- **Authority:** Owner authorization for the deterministic authoritative CI
  Infrastructure Work Unit.
- **Repository:** public user-owned repository; default branch `main`.
- **Mechanical protection:** active repository ruleset
  `main-governed-promotion`; no bypass actors; current administrators cannot
  bypass it.
- **Merge settings:** merge commits enabled; squash/rebase/auto-merge disabled;
  automatic merged-head deletion enabled.
- The current workflow exposes mutually conditional DOCS_ONLY and FULL jobs.
  `Authoritative promotion gate` is the single always-resolving aggregate added
  by Harness 2.0 and is the only required status check, pinned to the GitHub
  Actions integration.

This document does not grant push, review, merge, deploy, permission-change or
repository-administration authority.

## Exact active main ruleset

The active repository ruleset `main-governed-promotion` targets only the
default branch (`main`) with these settings:

| Rule | Exact setting |
|---|---|
| Restrict deletions | Enabled. |
| Block force pushes | Enabled; no force-push allowance. |
| Require a pull request before merging | Enabled. |
| Required approvals | `0`. Risk-appropriate review remains a workflow obligation, not an artificial named-account gate. |
| Dismiss stale approvals | Disabled because GitHub approvals are not the authority for NORMAL work. |
| Require review from Code Owners | Disabled until a separately approved CODEOWNERS policy exists. |
| Require approval of most recent reviewable push | Disabled. |
| Require conversation resolution | Enabled. |
| Required status checks | Exactly `Authoritative promotion gate`, sourced from GitHub Actions. |
| Require branches to be up to date | Enabled. WIP is one and merge queue is unavailable, so the branch is updated and reverified before merge. |
| Require linear history | Disabled; ordinary merge commits remain canonical. |
| Require signed commits | Disabled unless separately approved. |
| Merge queue | Not configured. |
| Bypass actors | None. Administrators are subject to the ruleset. |

Repository merge settings should be reconciled at activation time:

- keep **merge commits** enabled;
- disable **squash merge** and **rebase merge**;
- enable **automatically delete head branches**;
- leave auto-merge disabled unless separately authorized.

Automatic head-branch deletion happens only after a successful merge. The
agent must first confirm that no unique unmerged commit or Owner artifact would
be lost.

## Required check semantics

`Authoritative promotion gate` runs with `if: always()` and depends on change
classification plus both conditional verification paths.

- DOCS_ONLY succeeds only when classification succeeds, the DOCS_ONLY gate
  succeeds, and the FULL/comparison jobs are legitimately skipped.
- FULL succeeds only when classification succeeds, the DOCS_ONLY job is
  legitimately skipped, both matrix verification legs succeed, and comparison
  succeeds.
- A failed, cancelled or unexpectedly skipped prerequisite makes the aggregate
  fail.

The aggregate adds no reduced path and does not replace the underlying jobs or
artifacts. Its stable name is the future branch-protection interface.

An explicitly dispatched `mode=tier2-shadow` run is not a promotion run. Its
hosted FULL legs and comparison are ineligible and `Authoritative promotion
gate` is skipped as not applicable. The Tier-2 job remains independently
observable as PASS/FAIL, but neither its run conclusion nor its SHADOW artifact
can satisfy the required check or a Work Unit closure. Pull requests, pushes
and `workflow_dispatch mode=normal` retain the authoritative behavior above.

The protected `authoritative-ci` Environment admits only `main`, disables
administrator bypass and contains only the isolated CI-project credential named
`HCLOUD_TOKEN`. The credential value is never repository evidence. The initial
Tier-2 integration is shadow-only and does not alter this required-check
semantics until bounded observations support a separately reviewed cutover.
Its explicitly dispatched observation may run independently of hosted FULL
success, but it is absent from the aggregate's prerequisites and cannot satisfy
promotion or Work Unit closure.

Before Environment access, a credential-free context job checks the exact
upstream repository, protected live-main controller, explicit subject allowlist
and ancestry. The protected orchestrator validates the same boundary again
before provisioning.

## Review policy

| Shadow risk | Review expectation |
|---|---|
| `NORMAL` | GitHub approvals required: `0`. Technical review still occurs as workflow practice. Owner controls merge. No named external reviewer dependency. |
| `SENSITIVE` | Explicit Owner approval before merge plus a deliberate second technical, domain or security review. |
| `ARCHITECTURAL` | Explicit Owner approval, ADR/DEC when applicable, and a deliberate second review pass. |

No active policy requires `empresasgalatech`. Emergency recovery uses an
explicit Owner-authorized temporary ruleset change; there is no standing
bypass actor.

## Activation and recovery

The ruleset was activated only after Owner authorization and API verification
of its target, exact check source, zero approvals, conversation resolution and
empty bypass list. The eventual Infra promotion PR must exercise the ordinary
PR/check path before the Work Unit can promote.

Recovery is not a standing bypass. The Owner/repository administrator must
explicitly authorize and apply a temporary ruleset change through GitHub's
administrative surface, preserve the audit event, repair the blocking fault and
restore/reverify this exact contract. Direct push, force push, deletion or
moving a closure tag is never the recovery mechanism.
