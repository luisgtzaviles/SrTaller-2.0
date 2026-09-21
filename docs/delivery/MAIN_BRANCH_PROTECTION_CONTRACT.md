# Main Branch Protection Contract

## Status and observed baseline

- **Status:** exact proposed configuration; not applied.
- **Authority required to apply:** separate explicit Owner authorization.
- **Observed 2026-09-20:** public user-owned repository; default branch `main`;
  Owner has `ADMIN`; `main` has no branch protection and no ruleset.
- Merge commits, squash and rebase are currently allowed;
  `delete_branch_on_merge` is disabled.
- The current workflow exposes mutually conditional DOCS_ONLY and FULL jobs.
  `Authoritative promotion gate` is the single always-resolving aggregate added
  by Harness 2.0 and is the only proposed required status check.

This document does not grant push, review, merge, deploy, permission-change or
repository-administration authority.

## Exact proposed main ruleset

Create one active repository ruleset named `main-governed-promotion` targeting
only `refs/heads/main` with these settings:

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

## Review policy

| Shadow risk | Review expectation |
|---|---|
| `NORMAL` | GitHub approvals required: `0`. Technical review still occurs as workflow practice. Owner controls merge. No named external reviewer dependency. |
| `SENSITIVE` | Explicit Owner approval before merge plus a deliberate second technical, domain or security review. |
| `ARCHITECTURAL` | Explicit Owner approval, ADR/DEC when applicable, and a deliberate second review pass. |

No active policy requires `empresasgalatech`. Emergency recovery uses an
explicit Owner-authorized temporary ruleset change; there is no standing
bypass actor.

## Safe activation sequence

1. Promote Harness 2.0 through a PR while current repository settings remain
   unchanged.
2. Confirm `Authoritative promotion gate` resolves successfully on both a
   FULL change and a legitimate DOCS_ONLY change.
3. Create the ruleset in evaluation/disabled mode when GitHub exposes such a
   mode; otherwise prepare it without activation.
4. Verify target, exact check identity and absence of bypass actors.
5. Obtain separate Owner authorization.
6. Activate and test with a disposable branch/PR: direct push denied, PR path
   allowed, stale branch requires update, failed aggregate blocks, conversation
   blocks until resolved, force push and deletion denied.
7. Reconfirm Owner recovery access before changing collaborator permissions.

Protection activation is not part of Harness 2.0 Iteration 5.
