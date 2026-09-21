# Future Main Branch Protection Contract

## Status

Design only. It has not been applied to GitHub, does not describe current plan
capabilities as confirmed, and grants no push, review, merge, or administration
authority.

## Desired main enforcement

- reject normal direct pushes;
- reject force pushes and branch deletion;
- require a pull request and the authoritative aggregate check;
- require applicable conversations to be resolved;
- require the branch to be sufficiently current for the selected safe merge
  mechanism;
- keep merge under Owner/admin control;
- delete a feature branch only after successful merge and retention checks.

## Proposed review policy

| Shadow risk | Review expectation |
|---|---|
| `NORMAL` | A separate agent/context may perform technical review; no artificial `empresasgalatech` approval requirement; Owner still controls merge. |
| `SENSITIVE` | Explicit Owner approval plus deeper technical, domain, or security review. |
| `ARCHITECTURAL` | Explicit Owner approval, applicable architecture-decision process, and a second deliberate review pass. |

## Unresolved implementation questions

- GitHub plan and repository ruleset capabilities must be verified at the time
  of implementation.
- The exact aggregate check name and merge-up-to-date mechanism must be mapped
  to the then-current authoritative workflow.
- Admin bypass, emergency recovery and automated branch-deletion permissions
  need explicit Owner decisions.
- Enforcement must be tested in observation mode before activation and must not
  strand recovery or exact-main verification.

Applying this design requires separate authorization. Iteration 2 performs no
GitHub settings, ruleset, permission, remote, or `empresasgalatech` change.
