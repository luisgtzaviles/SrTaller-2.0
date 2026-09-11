# Active Development Checklist

Milestone / Functional Goal: New Repair Classic 2.0 + Guided V2
Sprint: SPRINT-02 — Operational Authentication & Authorization
Current PBI: PBI-039
Status: PBI-039 integrated and Preview post-deploy validation PASS
WIP: 0/1
Progress: Functional Slice accepted; UI Verification PASS; Hardening PASS; Full Verification PASS; CI / PR Readiness PASS; PR CI PASS
Current: Archived after PR #44 integration, exact-main CI and authenticated
Preview validation
Next: Canonical documentation closure only; no next PBI selected
Blocked: None
Last updated: 2026-09-11 08:46 MST

## PBI-039 Functional Slice Freeze — Owner Accepted

- [x] Owner accepted Classic 2.0 and Personal Form Mode
- [x] Owner accepted compacted Guided V2
- [x] Owner accepted Risks, Brands, Models and Problem Categories as one
  consolidated administrative catalog family without erasing domain differences
- [x] Owner accepted Device Type plus the Repair Detail modal radius correction
- [x] Owner accepted Repair Detail Operational Header, Recepción, Historial and
  the final long-value collision correction
- [x] Owner accepted the structural Conceptos reservation with commercial
  functionality explicitly deferred
- [x] Owner confirmed the read-only Evidence surface is sufficient for PBI-039;
  Basic Operational Evidence remains a future PBI
- [x] Access PIN 401 classified as Expected QA Setup Behavior, Product Healthy
  and Closed
- [x] No material functional blocker is known; UI Verification readiness and
  hardening readiness are YES
- [x] Freeze change control limits PBI-039 to defect, verification,
  accessibility, responsive, security, regression, architecture, test
  infrastructure and delivery remediation
- [x] Formal UI Verification — PASS; UIV-039-001 and UIV-039-002 independently
  reverified and closed, with no material regression blocking hardening

PBI-039 remains `In progress`: Owner acceptance, UI Verification PASS,
Hardening Batch 1 PASS and Full Verification PASS are not CI, PR, independent
review, merge, deploy, release or `Done`.

## Formal UI Verification remediation — Batch A + C

- [x] Preserve the Functional Slice Freeze and exclude the Worklist mobile
  page-size/pagination product idea
- [x] Reconcile `UIV-039-001` to the native/document Escape path and shared
  `SearchAutocomplete` ownership
- [x] Consume first Escape only while the popover is visible; preserve typed
  value, draft, active selection state and input focus
- [x] Keep second Escape available to the outer New Repair dirty/clean close
  contract
- [x] Prove Customer, Device Type, Brand, Model, Problems and Previous Repair in
  Classic plus Customer and Previous Repair in Guided
- [x] Preserve ArrowUp/ArrowDown/Enter, pointer selection, portal positioning,
  combobox ARIA and browser-autofill suppression contracts
- [x] Spot-check Pattern, Catalog and Evidence dialogs plus dirty New Repair
  Escape/focus restoration
- [x] Reconcile `UIV-039-002` to the local Conceptos header competing with the
  badge under global heading word wrapping
- [x] Keep `Conceptos` and `Próximamente` whole while allowing wrap between them
  without changing desktop `32 / 43 / 25` or tablet/mobile ordering
- [x] Prove Conceptos direct/modal at 1280, 768 and 640 in light/dark without
  horizontal overflow
- [x] Pass 79 focused/regression contracts, frontend typecheck/build and
  `git diff --check`; architecture was not required for UI/CSS/test/doc paths
- [x] `UIV-039-001` — REMEDIATED — READY FOR REVERIFICATION
- [x] `UIV-039-002` — REMEDIATED — READY FOR REVERIFICATION
- [x] Formal UI Verification Pass 2 — PASS; subsequent gate-recording state is
  reconciled by Hardening Batch 1

## Hardening Batch 1 — Toolchain, migrations and test infrastructure

- [x] Establish `scripts/pnpm-governed` as the deterministic local/Codex entry
  for Node 24.18.0 and pnpm 11.15.1 without a machine-specific absolute path
- [x] Keep ambient Node 25.9.0 fail-closed under `verify:toolchain`; document the
  governed launcher in AGENTS and Local Development
- [x] Reconcile the authoritative migration manifest to 51 ordered, unique,
  owner-scoped files and derive preview expectations from that manifest
- [x] Confirm the local database at 51 applied, 0 pending and 0 duplicate
  timestamps; preview PostgreSQL applies 51 from empty and leaves 0 pending
- [x] Reconcile current schema coverage, Access migration expectations and
  teardown inventories without weakening up/down or ownership assertions
- [x] Confirm DatabaseSchema represents Customer, preference and all PBI-039
  catalog/reconciliation tables with typecheck and PostgreSQL evidence
- [x] Classify D5-R045 as stale directed-composition/database-type fixtures;
  production architecture was compliant and 307/307 architecture tests pass
- [x] Isolate every owner-scoped PostgreSQL test file in a fresh database and
  container, preserving the exact eight-file inventory and zero skips
- [x] Pass three consecutive grouped owner-scoped executions: 8/8 each,
  material hash `56c94ea2…`, no port collision and cleanup PASS
- [x] Pass the focused PBI-039 PostgreSQL runner three times with fresh
  database/container per Customer phone and User preferences test file
- [x] Pass governed toolchain contracts 17/17, typecheck, build,
  `verify:architecture` and architecture 307/307
- [x] Audit Vite main chunk 530.33 kB / gzip 147.20 kB as an accepted warning;
  optimization is deferred and does not require Hardening Batch 2
- [x] Inspect, but do not execute, `pnpm verify`; full verify and CI remain
  pending their own gates
- [x] Full Verification Readiness Review — conditional PASS; orchestration
  update required

## Full Verification Orchestration Remediation

- [x] Preserve `verify` as the canonical base gate and add one dedicated,
  fail-fast `verify:full` orchestrator
- [x] Fingerprint base HEAD, tracked binary diff, deterministic untracked
  manifest and porcelain status before and after the campaign
- [x] Fail preflight on `UNKNOWN` untracked candidate paths
- [x] Extend external-configuration inspection to tracked plus untracked,
  non-ignored candidate files without printing secret values
- [x] Replace Preview runtime port `31991` with one dynamically assigned
  loopback port while preserving its PostgreSQL/readiness lifecycle
- [x] Compose base verify, 17-test PostgreSQL composite, two PBI-039 PostgreSQL
  tests, Preview runtime and compiled backend/UI smoke in the required order
- [x] Provide one exclusive migrated PostgreSQL 18.4 smoke harness, controlled
  synthetic environment, process-group cleanup and governed Docker labels
- [x] Reconcile the 19 expected base skips to 17 composite plus two PBI-039
  material executions and fail closed on inventory drift
- [x] Write final PASS/FAIL evidence outside the repository, always attempt
  cleanup and record final candidate identity
- [x] Pass focused orchestration, fingerprint, external-config, dynamic-port and
  smoke-harness contracts plus governed static/infrastructure checks
- [x] Complete dry inventory only; authoritative `verify:full` was not executed
- [x] Historical CI gap recorded at this checkpoint: Customer phone and User
  preferences PostgreSQL were absent then; resolved in CI / PR Readiness below
- [x] Preserve first-campaign FAIL evidence: base verify exposed nine stale or
  incomplete contracts; mandatory cleanup and candidate stability both passed
- [x] Reconcile Device Type, normalization, authorization, Detail and shared
  autocomplete contracts; remove the visual-foundation violations without
  changing accepted product behavior
- [x] Pass the 37-test focused remediation set, the final 8-test Concepts
  regression and `git diff --check`
- [x] Preserve second-campaign FAIL evidence: the complete base gate passed
  779/798 with exactly 19 expected skips, but the orchestrator expected an
  obsolete Node test-summary marker; cleanup and candidate stability passed
- [x] Reconcile the skip-summary parser to the governed Node 24.18.0 output and
  prove the fail-closed infrastructure contracts 13/13
- [x] Authoritative Full Verification local — PASS; campaign
  `local-full-verification-20260911031648-94065dfedc55`, candidate
  `034d3ffec64f5d2fc20d6cfd3cb4a56da6d1e8db7d36a53b23af239846b26948`
- [x] Confirm all 12 stages PASS, PostgreSQL 18.4 material 17 + 2 tests with
  zero skips, Preview-like runtime, compiled backend/UI smoke, cleanup and
  identical before/after candidate fingerprints
- [x] Keep `VITE_MAIN_CHUNK_OVER_500_KB` as an accepted warning and carry the
  then-missing PBI-039 PostgreSQL CI coverage into the next gate for resolution

## CI / PR Readiness

- [x] Fetch `origin`, confirm `main` / `origin/main` at
  `94065dfedc55234fd1738a6674289278aa49d224` and branch divergence `0/0`
- [x] Audit the authoritative workflow against the local Full Verification
  stages without folding PBI-039 into the PBI-023 contract
- [x] Add both focused PBI-039 PostgreSQL contracts to each independent CI leg
- [x] Produce a sanitized PBI-039 PostgreSQL manifest bound to commit, workflow
  run and execution label with zero material skips
- [x] Extend VC-024 evidence schema and semantic run comparison to require the
  PBI-039 manifest
- [x] Extend `if: always()` cleanup to both PBI-023 and PBI-039 governed labels
- [x] Prove focused CI/evidence contracts 25/25, PostgreSQL PBI-039 2/2,
  external configuration boundary and Full Verification dry inventory
- [x] Classify the complete local WIP and prepare coherent Git candidate
  `8b1d91efeafe58c7b56e7b7af2a955d39d635c10`
- [x] Execute two complete independent reverifications on the exact committed
  candidate: both 12/12 PASS with identical fingerprint `d8737807…`
- [x] Reconcile PBI-039, checklist and current-state delivery evidence
- [x] Stop at Owner authorization for PR; do not publish or create it

## PR + Authoritative CI

- [x] Receive explicit Owner authorization to publish the branch and create PR
- [x] Publish `feature/pbi-039-customer-minimum-new-repair` without force push
- [x] Create PR #42 against exact base
  `94065dfedc55234fd1738a6674289278aa49d224`
- [x] Pass authoritative run `34562890493` on head `80c49150…`: run-1,
  run-2 and semantic comparison all SUCCESS
- [x] Confirm PBI-023 17/17 and PBI-039 2/2 PostgreSQL material in each leg,
  zero critical skips/failures and cleanup/sanitization PASS
- [x] Confirm comparison `equivalent: true`, zero differences and identical
  comparable hash `f5d5ccc9…`
- [x] Record Vite 531.33 kB as accepted warning and the GitHub Actions Node 20
  runtime annotation as separate non-blocking delivery debt
- [x] Reconcile PBI-039, checklist and current state in a docs-only commit and
  obtain authoritative CI on that exact final PR head before handoff
- [x] Independent review completed with `CHANGES REQUIRED`: one HIGH Create
  Repair idempotency finding and one MEDIUM living-documentation finding
- [ ] Owner merge authorization

## Independent Review Remediation

- [x] Include `canonicalDeviceTypeId` in the Create Repair request fingerprint
- [x] Prove exact replay, incompatible payload, concurrent same-key creation
  and canonical Device Type compatibility in material PostgreSQL
- [x] Execute the required high-risk local reverification on the changed
  candidate: campaign `local-full-verification-20260911054515-f32f41dfc5ef`,
  12/12 PASS, fingerprint `c1f8273a…` identical before/after, cleanup PASS
- [x] Reconcile Roadmap, delivery workflow, SPRINT-02, PBI-039, checklist and
  current-state evidence without claiming merge or `Done`
- [x] Commit `e51729c…` and push the same PR branch without force
- [x] Require authoritative exact-head CI run-1, run-2 and comparison PASS:
  run `34567516069` attempt 3 is `SUCCESS`; comparison job `103181336253`
  consumed the two exact-run manifests and produced `equivalent: true`, zero
  differences and identical comparable hash `9fa4a5cf…`
- [x] Hand off PR #42 as ready for independent re-review

## Merge, Preview deploy and post-deploy validation

- [x] Independent re-review accepted the technical and documentation
  remediation; the authenticated PR author recorded the formal PASS as a
  review comment because GitHub disallows self-approval
- [x] Merge PR #42 normally at exact head `6733765…`; resulting `main` merge
  commit `6c04e57…`
- [x] Pass exact-main authoritative CI run `34604591354`, including run-1,
  run-2, comparison, PostgreSQL material and cleanup
- [x] Apply all 51 migrations to Preview from the same image and restore the
  HTTP command explicitly
- [x] Confirm Preview health (`/livez` 200, `/readyz` 200, unknown API 404) and
  exact deployed source `6c04e57…`
- [!] Post-deploy UI validation found a stale cached `index.html` whose weak
  size/mtime ETag survived a content-hash change and referenced a removed
  hashed bundle; bounded cache/ETag remediation is in progress
- [x] Reverify the cache remediation without changing accepted PBI-039 product
  behavior: authoritative Full Verification 12/12 stages and cleanup PASS
- [x] Integrate cache remediation PR #43 as `5ccc525…`, pass exact-main CI run
  `34614530586`, redeploy Preview and prove stale-browser recovery plus current
  hashed asset, `no-store` HTML, `/livez`, `/readyz` and unknown API behavior
- [!] Authenticated Preview validation exposed a second real defect: Repairs
  composed a private connection initialized only for `NODE_ENV=development`,
  leaving Worklist/catalog/policy repositories unavailable in the production
  image while the shared runtime remained healthy
- [x] Recompose Repairs through `APPLICATION_DATABASE_CONNECTION`, remove the
  obsolete private lifecycle and prove the production-runtime contract
- [x] Pass authoritative high-risk Full Verification campaign
  `local-full-verification-20260911154146-5ccc525a09d2`: 12/12 stages,
  PostgreSQL 17/17 + PBI-039 2/2, compiled smoke, cleanup and candidate
  integrity PASS; accepted Vite warning unchanged
- [x] Integrate the Repairs runtime hotfix through PR #44 and
  exact-main authoritative CI
- [x] Redeploy Preview and complete authenticated New Repair create/detail/
  reload smoke with synthetic development-only data
- [~] Reconcile closure documentation through a governed PR and exact-main CI
  without selecting the next PBI; tracked in the new active closure checklist

El commit posterior que materialice únicamente este registro documental no
altera el candidato funcional; su propio HEAD debe conservar CI autoritativa
verde antes del handoff.

## Current Functional Goal

- [x] Owner iteration 2 decisions applied
- [x] Large modal over Worklist with safe close and sticky footer
- [x] Customer autocomplete without a separate search field/button
- [x] Customer, phone, brand and model formatting
- [x] Compact Device section without Distinctive Signs
- [x] Preset/custom color picker
- [x] SIM and memory decisions controlled by effective Branch policy
- [x] Reception narrative and conditional warranty/deliverer
- [x] Structured risk selection without simulated consent
- [x] Received power state limited to Encendido / Apagado and policy-controlled
- [x] Device access type without secret persistence
- [x] Delivery estimate with Branch timezone
- [x] Historical initial budget snapshot
- [x] Disabled deposit pending Cash/Payments
- [x] Focused folio audit; current safe generator preserved
- [x] Create Repair, Worklist, Detail, Timeline and reload
- [x] Stable local Owner fixture: Luis / Administrador survives volume recreation
- [x] Owner visual iteration 2
- [x] Required received state limited to Encendido / Apagado
- [x] Other accessories opt-in clears and omits inactive values
- [x] Risk selector consumes the Repairs-owned persistent effective catalog
- [x] Future administrative sources reconciled in the PBI contract
- [x] Owner iteration 3 focused checks and localhost proof
- [x] Receipt row order: SIM, memory, received state, other accessories
- [x] Local protected PIN UX without persistence
- [x] Local protected password UX without persistence
- [x] Accessible 3x3 pattern modal with Owner minimum of two distinct nodes
- [x] Secret clearing on type/form cancellation
- [x] Payload/API/DB secret exclusion proof
- [x] Owner iteration 4 focused checks and localhost proof

## Customer Phone Search + Hydration bugfix

- [x] Trace the observed Customer and phone ownership from PostgreSQL through
  Customer lookup, response DTO and New Repair selection
- [x] Resolve through which explicit command a Repair contact may
  become a Customer-owned lookup phone; do not infer ownership from history
- [x] Reuse the existing phone parser/normalization for name, family name and
  phone lookup without treating phone as Customer identity
- [x] Return the Customer-owned phone required for result metadata and initial
  Repair contact hydration
- [x] Preserve deliberate operator phone input plus Cambiar/Quitar and all
  non-Customer capture
- [x] Prove PostgreSQL/API isolation, same-customer phone variants and Repair
  snapshot independence
- [x] Complete focused frontend/backend checks and Chrome localhost Owner proof

## Intermediate UI/UX Conformance Review

- [x] Review first and classify findings before remediation
- [x] Desktop/light and dark conformance against the current application shell
- [x] Customer, Equipment, Reception, Risks, Access, Commitment and footer states
- [x] Keyboard/focus, validation, Pattern dialog and safe modal-close behavior
- [x] Exact 1280x800, 768x1024 and 640x900 responsive proof without horizontal overflow
- [x] Correct the two demonstrated Medium findings: concurrent autocomplete surfaces and PBI-039 UI-foundation regressions
- [x] Owner accepted the resulting functional surface at the 2026-09-10 freeze;
  the earlier review state remains historical evidence

## Visual Design Iteration

- [x] Chrome baseline against Worklist, Detail, Settings, Users and Roles
- [x] Header, section surfaces and compact grid hierarchy
- [x] Cliente, Equipo, Recepción, Acceso, Compromiso and footer refinement
- [x] Light/dark plus 1280/768/640 browser iteration
- [x] Focused frontend checks and Owner visual handoff

## New Repair Input Normalization Policy

- [x] Inventory every current New Repair field and assign an explicit strategy
- [x] Centralize deterministic presentation normalization under Repairs ownership
- [x] Keep display formatting separate from exact normalized-key identity matching
- [x] Normalize simple inputs on blur, problem values on token commit and all values before payload construction
- [x] Apply equivalent backend normalization as the final persistence authority
- [x] Preserve canonical Brand, Model, Risk and Category labels when explicitly selected
- [x] Keep free-entry Brand and problems non-blocking and eligible for governed pending reconciliation
- [x] Preserve conservative Model casing and exact identifier content after allowed trim
- [x] Preserve PIN, password and pattern content exactly in memory and omit it from API/DB
- [x] Normalize manual create/edit input in Risks, Brands, Models and Problem Categories
- [x] Preserve all historical raw snapshots and reconciliation history without a retrospective migration
- [x] Complete focused localhost UX and reload proof with Owner synthetic capture
- [x] Complete frontend, normalization/New Repair/catalog, persistence-read, DEC-005 and diff checks
- [x] Owner accepted the normalization behavior as part of the 2026-09-10
  functional freeze

## New Repair Customer UX + Surface Hierarchy

- [x] Replace the full-width Customer results row with a 500 px maximum floating listbox
- [x] Keep loading, empty, error, pointer and explicit keyboard selection semantics
- [x] Present the linked Customer as a compact identity state without internal IDs
- [x] Add separate Cambiar and Quitar actions with useful focus restoration
- [x] Keep name, family name, Repair phone and every non-Customer capture intact when unlinking
- [x] Differentiate modal canvas, reusable section cards, operational groups and conditional panels using Design System tokens
- [x] Preserve section order, fields, policy, normalization, persistence and sticky footer
- [x] Verify light/dark and exact 1280x800, 768x1024 and 640x900 viewports without horizontal overflow
- [x] Complete focused Customer/New Repair/UI contracts, frontend checks and localhost interaction proof
- [x] Owner accepted the Customer UX and surface hierarchy as part of Classic
  at the 2026-09-10 functional freeze

## New Repair Search UX + Visual Compaction

- [x] Add one domain-agnostic `SearchAutocomplete` presentation primitive
- [x] Move Customer, Brand, Model, Reported Problems and Previous Repair to the
  same floating popover and compact result-row contract
- [x] Centralize listbox/option rendering plus shared loading, empty, error,
  retry, active and selected visual states
- [x] Preserve combobox ARIA, Arrow keys, Enter, Escape, pointer/touch and focus
  restoration behavior
- [x] Preserve Customer unlink semantics and multi-problem canonical/free-entry
  reconciliation semantics
- [x] Compact Previous Repair selection with explicit Cambiar and Quitar
- [x] Replace the 3 px plus glow focus treatment with a tokenized 2 px ring,
  1 px offset and no input glow
- [x] Reduce the desktop workspace maximum from 1480 px to 1180 px and compact
  section headers, grids, operational groups, conditional panels and footer
- [x] Verify the five search flows, light/dark and exact 1280x800, 768x1024 and
  640x900 viewports in localhost without horizontal overflow or popover layout
  shift
- [x] Suppress browser autofill only on the seven app-owned New Repair search
  inputs while preserving search/tel input type, phone keyboard and combobox ARIA
- [x] Pass frontend typecheck/build, the current 34-test focused UI suite,
  DEC-005 and `git diff --check`
- [x] Owner accepted Search UX + Visual Compaction as part of the 2026-09-10
  functional freeze; Formal UI Verification later completed in PASS

## Classic Tablet Density + Operational Validation

- [x] Add a dedicated 720–1023 px tablet composition without changing mobile or desktop contracts
- [x] Reduce 768x1024 initial content from 1990 px to 1416 px and Equipo from 849 px to 469 px
- [x] Reduce the fully expanded 1280x800 form from 1666 px to 1443 px without hiding active information
- [x] Replace Chrome-first submit feedback with one New Repair-specific policy-aware validation collection
- [x] Keep Save available and present inline, section, footer, first-focus and dialog-body scroll feedback after an invalid submit
- [x] Distinguish missing required decisions from a valid No response and preserve conditional validation
- [x] Keep canonical and free-entry problems valid; mark free-entry values with a neutral Por revisar badge
- [x] Compact Device Access while preserving local-only secrets and the 2–9 node Pattern contract
- [x] Replace the disabled Anticipo input with a non-focusable 53 px future-state summary excluded from validation and payload
- [x] Verify light/dark, keyboard, 1280x800, 768x1024 and 640x900 without horizontal overflow
- [x] Pass focused frontend, validation, policy, create, access and autocomplete checks with the governed toolchain
- [x] Classic remained accepted; Guided V2 was accepted separately at the
  2026-09-10 functional freeze

## Customer Phone Match Hydration Bugfix

- [x] Reproduce the partial-query hydration bug in `/reparaciones/nueva`
- [x] Return all Customer-owned phones plus the exact phone matched by a telephone query
- [x] Keep the preferred Customer phone stable for name-based results
- [x] Hydrate an empty phone or the partial query that produced the selected match
- [x] Preserve a deliberate different Repair phone without changing Customer automatically
- [x] Compare formatted, country-prefixed and national Mexico phones by governed normalized equivalence
- [x] Show ownership opt-in only for a sufficiently valid phone not already owned by the selected Customer
- [x] Preserve Cambiar/Quitar semantics and Tenant + Branch search isolation
- [x] Pass focused frontend, Customer read-model, PostgreSQL, architecture and diff checks with the governed toolchain
- [x] Owner accepted the corrected Customer phone ownership/hydration flow

## Classic Autofill + Risk Options + Post-create Detail Modal

- [x] Audit browser-autofill ownership for Customer search and the additional
  Tipo, IMEI / Serie and Persona que entrega capture fields
- [x] Suppress native suggestions only on the audited application fields; keep
  form semantics, phone keyboard, Device Access and app-owned combobox ARIA
- [x] Present the effective dynamic risk catalog as compact wrapping options
  without changing catalog, validation or persistence ownership
- [x] Preserve real checkbox semantics, multiple selection, deselection,
  keyboard Space behavior and visible focus
- [x] Verify risk options in light/dark at 1280x800, 768x1024 and 640x900
  without horizontal overflow
- [x] Preserve the Worklist background route after a successful create and use
  the exact Repair id returned by the API
- [x] Replace New Repair with one Detail modal, refresh the Worklist and keep
  failures inside the New Repair dialog
- [x] Verify Detail close, Back/Forward history and standalone direct URL
- [x] Create local synthetic Repair `SR-2026-1031` and verify its persisted
  Customer, equipment and pending reported-problem snapshot in Detail
- [x] Pass focused frontend contracts, typecheck, build, architecture and diff
  checks with the governed toolchain
- [x] Owner accepted Classic separately; the historical no-inference boundary
  remains valid for this earlier checkpoint

## Personal New Repair Form Mode Foundation

- [x] Record Owner acceptance of the current Classic functional gate without
  inferring final UI verification, hardening or PBI closure
- [x] Persist the personal mode under Users by Tenant + User, with missing
  preference resolving to Classic and last-write-wins updates
- [x] Expose exact self-service GET/PATCH operations derived from the active
  authenticated session, with same-origin and CSRF enforcement on PATCH
- [x] Prove the foundation checkpoint with Guided V2 unavailable before its
  functional implementation
- [x] Allow an operator with `repairs.create` to access only the personal
  preference surface while an administrator also sees Branch field policy
- [x] Present the personal capsule before Branch fields with immediate-save
  feedback and separation from Branch policy
- [x] Resolve the preference before mounting New Repair through one entry page
  shared by direct and Worklist-overlay routes
- [x] Reset preference state on trusted identity change and fall back visibly to
  Classic on a read failure
- [x] Keep mode out of Repair commands, payloads, persistence and Detail
- [x] Pass focused Users/Access/frontend/Classic/PostgreSQL/architecture checks
  and responsive localhost proof in light/dark
- [x] Owner accepted the personal mode foundation; this did not accept Guided
  V2, final UI verification, hardening or later lifecycle actions

## New Repair Guided V2 — Functional Iteration

- [x] Enable `guided_v2` in the existing Tenant + User preference contract
  without adding mode to Repair commands, payloads or persistence
- [x] Resolve Classic or Guided before mounting New Repair through the same
  direct/overlay entry resolver, with explicit Classic fallback on read failure
- [x] Reuse the complete Classic capture state, policy, validation,
  normalization, create command, idempotency and post-create Detail flow
- [x] Present a distinct progressive flow for Cliente, Equipo, Motivo y
  condiciones, Acceso, Compromiso and Revisión
- [x] Derive the effective steps from Branch policy and omit completely empty
  policy-driven sections
- [x] Validate the current step with the shared engine, focus its first issue
  and run full shared validation before final submit
- [x] Keep step movement inside component state without creating browser
  history entries; preserve Back/Forward ownership for route overlays
- [x] Add a grouped final review with Edit actions and semantic-only Device
  Access status; never render PIN, password or pattern values
- [x] Preserve dirty-close confirmation, create-failure state and exact
  Repair-id navigation to Detail after success
- [x] Correct Enter/Continue behavior so the penultimate step cannot submit
  before Revisión
- [x] Mark the transient Device Access value as a one-time code and confirm in
  Chrome that it does not offer to retain it as a website password after create
- [x] Exercise mode switching, step validation, free-entry Brand/Model/problem,
  grouped review, Edit return, responsive layouts and post-create Detail in
  local Chrome
- [x] Pass focused frontend, Repairs, Device Access, preferences, architecture
  and whitespace checks with the governed toolchain
- [x] Owner accepted Guided V2 at the 2026-09-10 functional freeze

## Guided V2 Compaction + Search Layering — Owner Iteration

- [x] Move the shared SearchAutocomplete listbox to a dialog-owned floating
  portal instead of positioning it inside clipping form sections
- [x] Anchor compact narrow/default/wide popovers to their inputs, clamp them
  to dialog/viewport bounds and reposition on captured scroll, resize and
  ResizeObserver changes
- [x] Flip bottom-field results above their input and constrain their internal
  height with scroll when available room is limited
- [x] Preserve the common Customer, Brand, Model, Problems and Previous Repair
  combobox/listbox/option, pointer/touch, Arrow, Enter and Escape contracts
- [x] Replace the redundant Guided orientation card with one compact current
  step + progress layer and suppress only the duplicate Guided FormSection
  header while retaining its semantic heading
- [x] Remove the outer Guided step card, fixed empty height and decorative
  Review cards without changing Classic section presentation
- [x] Rebuild Review as a content-driven semantic summary with per-section Edit,
  compact problems/risks, human Branch-local date and MXN presentation
- [x] Keep explicit operational absences, omit empty/default noise and continue
  excluding PIN, password and pattern values from Review and transport
- [x] Exercise the five search consumers, bottom-field flip, Access variants,
  Commitment, Review Edit, light/dark and 1280x800, 768x1024 and 640x900 in
  local Chrome without horizontal overflow or layout shift
- [x] Smoke Classic Customer, Brand and Model through the same floating primitive;
  preserve its accepted full-form sections and shared Problems/Previous Repair
  paths
- [x] Complete focused frontend/Classic/Guided checks, DEC-005 and whitespace
  proof with the governed toolchain
- [x] Owner accepted the compacted Guided V2 at the 2026-09-10 functional freeze

## Deliberately later — not completed by this iteration

- [x] Repairs-owned value catalog and screen for models
- [x] User-owned Classic / Guided V2 preference; presentation mode is not
  Branch field policy
- [!] Device access secrets — requires authenticated encryption, external key,
  reveal capability, audited access and expiry/deletion before persistence
- [ ] Quoting / commercial authorization
- [ ] Payment / deposit
- [ ] Photo upload, receipt and physical label actions

## New Repair Configuration V1

- [x] Central field registry with field-specific allowed states and Owner defaults
- [x] Branch-scoped effective policy with system-default fallback and no Tenant inheritance
- [x] Immutable policy versions, optimistic concurrency, reset version and audit attribution
- [x] Dedicated read/manage capabilities and operational consumption through `repairs.create`
- [x] Administration route under Catálogos por módulo -> Nueva Reparación
- [x] Classic 2.0 required/optional/hidden semantics with fixed product order
- [x] Backend fail-closed validation and Repair `policyVersion` reference
- [x] Secrets, value catalogs and Classic/Guided preference excluded from field policy
- [x] Typecheck, build, architecture and focused unit/contract checks
- [x] PostgreSQL material verification
- [x] Localhost configuration, reload, reset, Branch/auth and created Repair walkthrough

## New Repair Configuration — Visual Design Iteration

- [x] Baseline current 2.0 y referencia operativa legacy
- [x] Header y metadata de sucursal compactos
- [x] Dashboard de cinco secciones con alta densidad desktop
- [x] Checkbox principal Requerido/Opcional
- [x] Acción secundaria Ocultar/Mostrar
- [x] Estados Fijo, Condicional y No disponible en lenguaje humano
- [x] Dirty state explícito y discreto
- [x] Action bar compacta con descartar, restaurar y guardar
- [x] Confirmación clara antes de restaurar predeterminados
- [x] Responsive sin overflow horizontal
- [x] Light/dark y keyboard/focus
- [x] Checks frontend y proof Chrome focalizados

## Owner correction — Initial Branch defaults

- [x] Default central: sólo Marca y Modelo obligatorios
- [x] Fallback de sucursal nueva y Restaurar usan el mismo default
- [x] Contratos/PBI reconciliados con la decisión Owner vigente
- [x] Checks focalizados y proof localhost

## Owner iteration — Boolean policy + Repair autocomplete

- [x] Tres activadores configurables required/optional en registry
- [x] Semántica server-side: required exige decisión, false es válido
- [x] Dependencias conditional preservadas y limpiadas al responder No
- [x] Controles Sí/No inequívocos en Classic
- [x] Repair lookup dedicado con scope Tenant + Branch server-side
- [x] Autocomplete sin botón, debounce, estados y selección humana
- [x] Estado seleccionado conserva repairId opaco y permite Cambiar
- [x] Condición física alineada en desktop y responsive
- [x] PBI y contratos focalizados reconciliados
- [x] Checks y proof localhost focalizados

## Intermediate UI Verification — Classic + Field Configuration

- [x] Classic header, sections, hierarchy and density
- [x] Equipo alignment and operational reception row
- [x] Optional and required boolean policy states
- [x] Customer autocomplete ARIA and keyboard behavior
- [x] Previous Repair autocomplete states and keyboard behavior
- [x] Required/hidden/conditional validation presentation
- [x] Configuration desktop density and scanability
- [x] Required/Optional interaction by pointer, keyboard and label
- [x] Hidden state and secondary Hide/Show action
- [x] Fixed, Conditional and Unavailable states
- [x] Boolean activators and conditional relationship
- [x] Configuration metadata hierarchy
- [x] Dirty state, discard and save behavior
- [x] Restore confirmation, version and clean state
- [x] Policy-to-Classic consistency proof
- [x] Conditional transitions and state cleanup
- [x] Device access states and pattern dialog
- [x] Focus trap, Escape and focus restoration
- [x] Light mode
- [x] Dark mode
- [x] Desktop 1280 x 800
- [x] Tablet 768 x 1024
- [x] Narrow 640 x 900
- [x] Design System reuse, focused checks and findings matrix

## Catalogs by Module V1 — Risks first

- [x] Sibling navigation: Catálogos / Nueva reparación
- [x] Repairs catalog shell with only Risks functional
- [x] Platform + Tenant architecture; Platform baseline WIP later removed by Owner correction
- [x] Stable risk ID, canonical label, normalized key and lifecycle
- [x] Dedicated `repairs.catalogs.read/manage` capabilities
- [x] Platform entries remain read-only when present; an empty Platform catalog is valid
- [x] Tenant create and normalized duplicate rejection
- [x] Rename preserves ID, increments version and retains snapshots
- [x] Deactivate/reactivate without hard delete
- [x] Append-only administrative audit attribution
- [x] Tenant-scoped aggregate usage count
- [x] New Repair consumes effective active risks through `repairs.create`
- [x] Detail/reload preserves captured label after rename/deactivation
- [x] Same-Tenant Branch visibility and cross-Tenant isolation
- [x] Optimistic concurrency and server-side create revalidation
- [x] PostgreSQL, light/dark, desktop/tablet, dialog and keyboard proof

## Owner iteration — Risk Catalog CRUD UX

- [x] Default Activos filter with compact Activos / Inactivos / Todos control
- [x] Future Platform entries remain read-only and Tenant create/edit/lifecycle actions remain explicit
- [x] Independent dialogs with governed validation and focus restoration
- [x] Exact create/update/deactivate/reactivate success feedback
- [x] Duplicate, stale-version, authorization and backend errors use distinct feedback
- [~] Prior singular CRUD walkthrough superseded by the plural-risk proof below
- [x] Frontend, focused PostgreSQL, architecture and diff checks retained from the prior checkpoint

## Owner domain correction — Multiple accepted intervention risks

- [x] Product language corrected from observed conditions to intervention risks
- [x] Six unapproved Platform seeds removed; Owner Tenant risks preserved
- [x] Singular `riskId` authority replaced by `acceptedRiskIds`
- [x] Normalized `repair_intervention_risks` relation with Repair/Risk FKs and uniqueness
- [x] Ordered historical label snapshots with receptionist and timestamp
- [x] Backend validates zero-or-many semantics, effective active IDs and duplicates
- [x] Design System multiselect with autocomplete, keyboard navigation and removable chips
- [x] Detail plural list and aggregate association-based usage counts
- [x] Focused typecheck, build, unit/contract, PostgreSQL and architecture checks
- [x] Localhost proof: two risks, reload, usage, lifecycle, rename snapshots and restricted user
- [x] Owner accepted the corrected Risk functional flow at the 2026-09-10 freeze

## Owner UX correction — Intervention risk checkbox list

- [x] Replace autocomplete and chips with a compact checkbox list
- [x] Preserve dynamic server catalog loading, empty and retryable error states
- [x] Required validation focuses the group; No clears and hides all selections
- [x] Focused frontend typecheck, build, selector/Create Repair tests and diff check
- [x] Localhost proof for selection, cleanup and catalog create/deactivate behavior
- [x] Owner accepted the Risk checkbox interaction at the 2026-09-10 freeze

## Owner direction change — Global catalogs + non-blocking reconciliation

- [x] Prior Brand WIP classified against the new Owner direction and ADR-004
- [x] Normalized Platform/Tenant canonical Brand and Tenant pending-value model
- [x] Free-entry Brand snapshots with optional analytical canonical identity
- [x] Non-blocking autocomplete from active Platform + Tenant + resolved aliases
- [x] Canonical CRUD, lifecycle, usage, append-only audit and optimistic concurrency
- [x] Human pending resolution to existing/new Tenant canonical without snapshot rewrite
- [x] PostgreSQL material proof for grouping, reporting identity, scope and stale version; authorization and browser review
- [x] Owner accepted Brand catalog and canonicalization at the 2026-09-10 freeze

## Owner bug investigation — free-entry Brand reconciliation

- [x] Trace SR-2026-1009 by opaque ID from snapshot through pending and canonical identity
- [x] Confirm no stale frontend canonical selection and no fuzzy backend resolution
- [x] Identify the prior local proof resolution as the leaked Tenant alias
- [x] Reopen only the `appple` group with append-only audit and preserve every snapshot
- [x] Show SR-2026-1009 again in the Tenant-wide pending queue
- [x] Prove Apple selected then edited to `appple-test` persists as free entry
- [x] Cover exact normalization, non-exact variants, Branch visibility and Tenant isolation
- [x] Focused frontend, Brand/Create Repair, PostgreSQL, architecture and diff checks
- [x] Owner accepted the corrected Brand reconciliation state at the 2026-09-10 freeze

## Owner correction — Canonical Brand operational display

- [x] Shared read model separates raw, canonical and effective Brand values
- [x] Worklist and Detail prefer the current canonical label when linked
- [x] Unresolved Repairs fall back to their raw snapshots
- [x] Operational API keeps UUID and administrative Brand metadata private
- [x] Worklist search recognizes raw and current canonical labels
- [x] PostgreSQL regression covers resolution, rename, restore and reopen fallback
- [x] `SR-2026-1009` displays Apple while preserving raw `appple`
- [x] Temporary `Apple Test` rename propagated and canonical `Apple` restored
- [x] `SR-2026-1010` remains pending and displays raw `appple-test`
- [x] Owner accepted canonical operational display at the 2026-09-10 freeze

The Brand foundation is now consumed by Model: every canonical Model depends on
canonical Brand, while free capture and the raw/canonical/effective display
rule remain intact. Problem Reported remains narrative while Failure
Classification is future structured data. Tenant candidates never auto-promote
to Platform and no cross-Tenant signal is exposed in this slice.

## Owner iteration — Model catalog + Brand-bound reconciliation

- [x] Canonical Model requires a canonical Brand FK and cannot change Brand
- [x] Platform/Tenant effective catalog with Tenant Model -> Platform Brand support
- [x] Cross-Tenant Brand ownership and intake Brand/Model mismatch rejected in DB
- [x] Free-entry Model snapshot remains valid and non-blocking
- [x] Optional canonical identity plus Tenant/Brand-contextual pending identity
- [x] Exact normalization only within the same Brand; no fuzzy auto-merge
- [x] Brand-filtered autocomplete with debounce, pointer and keyboard behavior
- [x] Canónicos / Por revisar administration with required Brand filter/context
- [x] Tenant create, rename, deactivate/reactivate, version and append-only audit
- [x] Human resolution to existing/new same-Brand Model without snapshot rewrite
- [x] Effective Brand + Model display/search and aggregate usage without N+1
- [x] Local PostgreSQL 18.4 and Chrome synthetic proof, including stale version
- [x] Catalog tab selection persisted in URL and preserved across reload
- [x] Owner accepted Model catalog and Brand-bound reconciliation at the 2026-09-10 freeze

## Owner iteration — Repair equipment correction + Model Brand filter UX

- [x] Explicit Detail command limited to Brand and Model
- [x] Required reason, optimistic version and idempotent request identity
- [x] Dedicated `repairs.correct_intake` authorization under trusted context
- [x] Append-only old/new correction history with audit and Timeline linkage
- [x] Canonical Brand-bound Model validation in backend and PostgreSQL
- [x] Free-entry Brand/Model remains valid and non-blocking
- [x] Brand edits clear incompatible canonical Model selection
- [x] Current Detail, Worklist, search and reload use corrected values
- [x] Pending history retained with current-use counts and no canonical double count
- [x] Timeline renders old -> new, reason and actor without technical UUIDs
- [x] Shared compact Model Brand filter verified in light, dark and tablet
- [x] PostgreSQL 18.4 and focused local checks/proof
- [x] Owner accepted the resulting catalog/detail behavior at the 2026-09-10 freeze

## Regression correction — Model Catalog reload session flicker

- [x] Exact `?catalog=models` hard-reload reproduction with timed visual and network capture
- [x] Root cause isolated to concurrent protected reads competing to touch one Session version
- [x] Session activity writes coalesced without skipping trusted-context or admission validation
- [x] Fast Session verification kept visually quiet; slow verification still exposes an explicit loading state
- [x] Three Chrome reloads preserved Modelos with five API responses, all 200 and no visible verification flash
- [x] Typecheck, build, 54 focused Session/authorization tests and `git diff --check`
- [x] Owner accepted the corrected reload behavior at the 2026-09-10 freeze

## Owner iteration — Problem Category catalog + Repair classification

- [x] Product concept separated from reported issue, diagnosis and work authorization
- [x] Repairs-owned Platform + Tenant catalog with empty Platform seed
- [x] Stable ID, exact normalized duplicate detection and versioned lifecycle
- [x] Tenant CRUD with Platform entries read-only; safe delete is limited to
  entries with no historical references or identity dependencies
- [x] Dedicated `repairs.classify` capability, separate from intake correction and catalog administration
- [x] N:M current classification with label snapshot, actor, time, manual source and post-intake stage
- [x] Trusted Tenant/Branch Repair and effective active Category validation
- [x] Append-only assignment/removal events linked to human Timeline entries
- [x] Detail chips, multi-select dialog, inactive historical visibility and no free entry
- [x] Catalog tab renamed from Fallas to Categorías with current-use counts
- [x] Detail label corrected to Problema reportado; New Repair remains unchanged
- [x] Focused unit/contract, PostgreSQL 18.4 and localhost proof
- [x] Light/dark and responsive visual evidence for Catalog + Detail
- [x] Restricted-capability and cross-Tenant runtime proof
- [x] Owner accepted Problem Category classification at the 2026-09-10 freeze

## Owner direction — Multi-problem intake + category reconciliation

- [x] Reuse the existing Problem Category catalog and N:M foundation
- [x] Require one or more ordered reported-problem values during intake
- [x] Autocomplete active Platform/Tenant categories with pointer and keyboard support
- [x] Preserve free entry and create the Repair when no canonical category exists
- [x] Reject same-Repair duplicates by exact normalized key without fuzzy matching
- [x] Group pending values by Tenant, never by Branch, with usage and timestamps
- [x] Resolve pending values explicitly to an existing or new Tenant category
- [x] Preserve raw snapshots while effective labels/report identity become canonical
- [x] Keep customer narrative separate and legacy `reported_issue` as compatibility summary only
- [x] Keep post-intake changes under `repairs.classify`
- [x] Count distinct Repairs for canonical and pending usage
- [x] Preserve Platform/Tenant and cross-Tenant authorization boundaries
- [x] Detail/reload present effective `Problemas reportados` plus separate narrative
- [x] Focused typecheck, build, unit/contract and PostgreSQL 18.4 proof
- [x] DEC-005 registration and migration up/down/reapply proof
- [x] Owner accepted multi-problem intake and reconciliation at the 2026-09-10 freeze

## Owner iteration — Catalog density + safe delete

- [x] Replace the full Canónicas / Por revisar row with compact metadata
- [x] Keep Activas / Inactivas / Todas as the only canonical-list filter row
- [x] Show pending as a compact control only when pending values exist
- [x] Derive `deletable` exclusively in the Repairs backend from ownership and
  historical dependencies
- [x] Permit hard delete only for a Tenant category that has never been used
- [x] Keep used active categories on Edit / Deactivate and used inactive
  categories on Edit / Reactivate
- [x] Offer Edit / Delete for never-used active categories and Edit /
  Reactivate / Delete for never-used inactive categories
- [x] Keep Platform categories read-only and never deletable by a Tenant
- [x] Require `expectedVersion`, trusted Tenant context and
  `repairs.catalogs.manage`; reject stale, used and Platform delete attempts
- [x] Delete transactionally without cascade and retain append-only
  `catalog_entry.deleted` attempt/result audit evidence
- [x] Preserve pending-value reconciliation as a separate flow without a
  pending-delete command
- [x] Focused frontend, authorization, architecture and PostgreSQL 18.4 proof
- [x] Localhost proof for compact density, exact confirmation, successful
  never-used deletion and absence from New Repair/Detail
- [x] Owner accepted catalog density and governed safe delete at the 2026-09-10 freeze

## Owner iteration — Catalog administration UI consolidation

- [x] Audit duplicate headers, metadata, filters, tables, badges, actions,
  feedback, dialogs and responsive rules across the four catalog panels
- [x] Keep domain services, repositories, commands, lifecycle and ownership out
  of the shared presentation layer
- [x] Add shared Catalog Panel, Header, Toolbar, Table and feedback primitives
- [x] Add one shared canonical/pending summary for Brands, Models and Problem
  Categories; keep Risks without reconciliation
- [x] Add one shared Activos / Inactivos / Todos lifecycle control
- [x] Keep the Model Brand Select as a domain-specific contextual toolbar filter
- [x] Standardize scope, status, usage and row-action presentation without
  introducing delete for Risks, Brands or Models
- [x] Preserve the Problem Category backend-owned `deletable` action matrix
- [x] Focused catalog UI/domain contracts pass: 22 / 22
- [x] Compare light/dark, 1280/768/640, keyboard, dialogs, pending, inactive and
  empty states in the same local session
- [x] Run frontend build, necessary architecture check and `git diff --check`
- [x] Reconcile the PBI with focused proof and explicit intentional differences
- [x] Owner accepted the consolidated administration family at the 2026-09-10 freeze

## Owner iteration — Device Type catalog + Detail modal radius

- [x] Model Device Type as a first-class Repairs catalog independent from Brand
- [x] Add Platform read-only plus Tenant lifecycle, stable identity, version and append-only audit
- [x] Preserve raw `device_type` and add optional canonical/pending identities without backfill or default seed
- [x] Group free-entry pending values by Tenant and exact normalized key, never fuzzy matching
- [x] Resolve pending values to an existing or new Tenant canonical without rewriting historical snapshots
- [x] Present the current canonical label in Detail while retaining raw evidence
- [x] Reuse the same accessible SearchAutocomplete and command state in Classic and Guided V2
- [x] Preserve Branch field policy and keep Type independent from Brand compatibility
- [x] Add `Tipos` between Riesgos and Marcas with Canónicas / Por revisar administration
- [x] Prove same-Tenant cross-Branch sharing, cross-Tenant isolation, lifecycle, concurrency and PostgreSQL audit
- [x] Fix footerless shared Dialog lower-corner clipping without changing the direct Detail route
- [x] Complete focused typecheck, frontend build, contracts, PostgreSQL 18.4, architecture and diff checks
- [x] Prior standalone manual Device Type proof was superseded by explicit
  Owner acceptance; the surface was later covered by Formal UI Verification
- [x] Owner accepted Device Type catalog and Detail modal radius at the 2026-09-10 freeze

## Owner iteration — Repair Detail operational header

- [x] Audit the existing authoritative sources for reception, promise, initial budget, status, technician, custody and location
- [x] Recompose the upper header around Device / Customer identity
- [x] Add compact Reception, Delivery Promise and Initial Budget summaries
- [x] Move labelled Status, Technician, Custody and Location indicators into the upper header
- [x] Remove the redundant standalone Current Situation card
- [x] Adapt the untouched Reception / History body to a balanced two-column layout
- [x] Preserve canonical labels, phone presentation, correction, technical metadata and modal/direct-route context
- [x] Preserve modal radius, post-create overlay and browser-history behavior
- [x] Verify responsive composition at 1280, 768 and 640 px widths; the local screen provided 738 px physical content height
- [x] Verify light/dark plus keyboard and screen-reader semantics
- [x] Pass 92 focused Detail/Create and related contracts, typecheck, build, architecture and `git diff --check`
- [x] Owner authorized the next section after functional review of the operational header

## Owner iteration — Repair Detail Reception information architecture

- [x] Inventory every currently rendered Reception field and classify its destination
- [x] Audit V1 `Información principal` as density evidence without adopting its domain or CSS
- [x] Remove promise and initial budget duplication from Reception
- [x] Make reported problems and Customer narrative the primary Reception context
- [x] Keep post-intake classification available but visually secondary
- [x] Group physical condition, color and received power state
- [x] Group effective Device Type, IMEI/Serie, SIM, memory and meaningful accessories
- [x] Render warranty, previous Repair, alternate deliverer and accepted risks only when applicable
- [x] Preserve received-by attribution and secure access-type semantics without secrets
- [x] Preserve Historial, Evidencias, correction, modal/direct route and post-create boundaries
- [x] Prove simple/complex, classification, risk, access and Device Type states
- [x] Verify light/dark and responsive 1280/768/640 composition without horizontal overflow
- [x] Pass focused Detail/regression contracts, typecheck, build, architecture and `git diff --check`
- [x] Owner reviewed the Repair Detail Reception information architecture and authorized the next structural checkpoint

## Owner iteration — Repair Detail Future Concepts surface

- [x] Audit the current two-column body and compare 32/43/25, 33/42/25 and 30/45/25 ratios
- [x] Add `Conceptos` as the third sibling body surface without functional actions
- [x] Keep the placeholder concise, legible and explicitly future-facing
- [x] Preserve the boundary: Conceptos holds commercial items; Caja owns monetary movements
- [x] Preserve Reception, Historial, Evidencias and the operational header
- [x] Keep modal, direct route, scrolling and post-create behavior intact
- [x] Use 32/43/25 on desktop, two functional columns plus Conceptos below on tablet, and semantic stacking on 640
- [x] Verify the placeholder in light/dark without fake totals or focusable controls
- [x] Pass focused Detail/Reception/Header/Timeline/post-create regression contracts
- [x] Pass frontend typecheck/build, architecture and `git diff --check`
- [x] Record the future Price List → Caja → Repair integration sequence without claiming implementation
- [x] Owner reviewed the Repair Detail Future Concepts surface and authorized the Historial checkpoint

## Owner iteration — Repair Detail History / Follow-up information architecture

- [x] Reconcile the Owner authorization without reopening Header, Reception, Concepts or Evidence
- [x] Audit V1 follow-up rendering, composer placement, chronology and density at legacy SHA `9357b8629ed320f690ee07d106660020ce8b42e3`
- [x] Inventory and classify every timeline event currently materialized by Repairs
- [x] Put the compact authorized note composer before the chronological list
- [x] Render one continuous dense timeline with time/actor first and meaning before metadata
- [x] Distinguish human notes from system events without nested event cards or alert styling
- [x] Keep Branch-aware exact timestamps, direct actor names and only useful provenance
- [x] Preserve newest-first authoritative order and use the Detail body as the scroll owner
- [x] Prove empty, simple, multiple-note, mixed-event and long-note presentation without destructive Owner-data writes
- [x] Preserve the 32/43/25 body, tablet/mobile ordering, light/dark and accessibility boundaries
- [x] Pass focused timeline/note and materially affected Detail regression contracts
- [x] Pass frontend typecheck/build, architecture and `git diff --check`; reconcile PBI-039 evidence
- [x] Owner accepted Repair Detail History / Follow-up information architecture
  at the 2026-09-10 freeze

## Repair Detail header long-value collision fix

- [x] Confirm the exact cause in the current four-indicator layout
- [x] Keep the shared StatusBadge unchanged and contain its wrapping locally
- [x] Preserve Estado, Técnico, Custodia and Ubicación order and semantics
- [x] Add a content-width 2×2 fallback before desktop indicators become unreadably narrow
- [x] Preserve tablet 2×2 and the current compact 640 composition
- [x] Prove the four exact long-value fixtures without writing Owner data
- [x] Verify modal and direct route in light/dark at 1280, 768 and 640 widths
- [x] Pass focused Detail regressions, frontend typecheck/build, architecture and whitespace checks
- [x] Confirm the prior CDP helper was external to the repository; remove it
  after the focused Access investigation because it embedded a local PIN
- [x] Owner accepted the Repair Detail header collision fix at the 2026-09-10 freeze

## Access PIN 401 focused investigation

- [x] Reproduce the 401 in the isolated Chrome profile against the real
  `127.0.0.1:4173` frontend and `127.0.0.1:3000` backend
- [x] Confirm the request had trusted Station, same-origin metadata, JSON,
  login CSRF cookie/header and no authoritative Session cookie pair
- [x] Confirm Luis is active, has an active Administrator assignment and an
  active current-profile PIN credential matching the configured local fixture
- [x] Confirm zero consecutive credential failures, no lockout and no
  revocation; do not mutate the Owner credential
- [x] Identify the internal denial as optimistic Operational Session admission:
  the isolated request sent `expectedSessionId: null` while the Station already
  had another active Session
- [x] Confirm the normal Chrome profile holds the authoritative Session cookies
  and remains ready as Luis after governed backend startup plus two reloads
- [x] Prove invalid-PIN, lockout, Tenant/Station isolation and Session
  replacement/recovery with focused unit and ephemeral PostgreSQL fixtures
- [x] Remove the three external `/tmp` QA helpers and the temporary test loader;
  retain no PIN-bearing helper or repository artifact
- [x] Classify the finding as `EXPECTED QA SETUP BEHAVIOR`; no product code or
  Owner-data change was required
- [x] Close the focused 401 finding while keeping PBI-039 open
- [x] Access PIN 401 finding closed as Product Healthy; the Evidence audit
  separately confirmed that operational mutation does not block PBI-039

## Later lifecycle gates — outside this checkpoint

- [x] Owner Functional Approval — Functional Slice Frozen on 2026-09-10; PBI
  remains open for verification, hardening and delivery
- [x] Hardening Batch 1 — toolchain, migrations, schema and PostgreSQL test
  infrastructure PASS; no Batch 2 required by current findings
- [x] Broad owner-scoped PostgreSQL harness isolated and deterministic across
  three consecutive grouped executions
- [x] Customer D5-R045 fixture/export debt reconciled; broad architecture
  307/307 PASS
- [x] Full verification — authoritative local PASS on 2026-09-10
- [x] CI / PR Readiness — PASS on 2026-09-10
- [x] PR #42 / authoritative final CI run `34564110272` on exact head
  `f32f41d…` — PASS
- [x] Independent review — CHANGES REQUIRED; remediation authorized
- [x] Independent re-review — PASS recorded as a review comment due GitHub
  self-approval restriction
- [x] Merge — PR #42 merged as `6c04e57…`
- [x] Preview post-deploy validation — cache/ETag and Repairs shared-runtime
  defects closed; authenticated create/detail/reload/worklist PASS

> This checklist is operational visibility only. It records the explicit Owner
> Acceptance above, but does not grant authority or declare PBI-039 `Done`,
> released or deployed.
