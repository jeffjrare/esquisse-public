# Roadmap

<!-- Durable order explicitly reconciled 2026-09-24; state comes from backlog, plan logs and epic status. -->
<!-- Rank is projected through esq backlog rank; no inferred implementation dependency is invented. -->

Initial order proposed by [PRIORITY-REVIEW.md](PRIORITY-REVIEW.md), checked against public snapshot `d45188e`; the user selected B-172 first, then B-129, on 2026-09-24. Historical acceptance was examined in the former development checkout; its plans are intentionally omitted here. Historical upstream commit IDs are provenance, not local Git refs. This replaces the inherited queue rationale; Git retains the previous derivations.

**Objective:** useful features shipped quickly, fewer unnecessary interruptions, reliable verification and beautiful, thoughtful design. Spend tokens, tool turns and elapsed time in proportion to that value. The CLI owns deterministic structure; the model owns judgment. A guard must detect a defect, resolve a reference or protect a parsed format. Optional telemetry and research never gate delivery. Deployment remains outside ESQ's scope.

The sequence below is the remaining execution proposal, not a claim that work has started. Re-derived 2026-09-30 after preparation-concision closed (B-182 Dropped as an accepted limit, `docs/preparation/2026-09-30-b182-word-bound.md`): autonomy-remainder rises to Now; the conditional Later queue keeps its order. Order is positional unless a `needs:` edge is written. Existing confirmed priorities remain intact, including hi on conditional work. Backlog Rank records the active sequence, while priority-sorted backlog views still group by Pri; those views must not be read as the roadmap. No implementation is commissioned by a generated state alone.

## Now

### autonomy-remainder
**covers:** B-169, epic:esq-decides-implementation-detail
**why now:** parked — specialist back-end guidance isn't needed yet: Tamialog (backend-api skill) and assets-prospection (data-model, database-safety, job-queue, security-rules) already cover back-end choices with their own skills; resume when a run asks or builds badly on something no project skill covers
**acceptance:** A real selected case proceeds without an implementation-detail question, with evidence of correct behavior and design quality; guidance stays on demand and within a stated cost bound.
**state:** <!-- GENERATED --> B-169 Open [hi]; epic Active; no plan; not started. parked — specialist guidance (the epic's last unbuilt part) has no unmet need: observed projects' own skills settle back-end choices, and the plugin already ships front-end/design guidance; resume when a run asks or builds badly on something no project skill covers. Standards Part 2 (domain defaults) stays empty.

## Next

## Later

### background-acceptance
**covers:** B-085, B-087
**why now:** Conditional follow-up, not another implementation of the shipped collection protocol. Preserve B-085 confirmed hi, but defer its unproved savings and harness-registration claim: the 2026-09-08 owner choice explicitly left both open after shipping process cleanup.
**acceptance:** Only a concrete recurrence or relevant harness capability change earns new work; distinguish process teardown, delayed delivery and actual revival, retaining the original operational acceptance as unproved.
**state:** <!-- GENERATED --> Both historically Planned; upstream background-task-lifecycle completed four phases but explicitly left their acceptance open. No plan or active execution here; neither row is Done.

### reread-cost
**covers:** B-070
**why now:** Confirmed hi is preserved as importance, not a mandate to buy an inconclusive study before shipping. The read-once rule and instrument exist; the frozen reading cannot support the old comparison.
**acceptance:** Name a current redundant read and remove its cause, or establish a comparable bounded measurement before claiming savings; research never gates a demonstrated fix.
**state:** <!-- GENERATED --> Historically Planned; the read-once rule and B-151 measurement exist, but savings are unproved. Private plan omitted; no active execution here.

### conditional-lab
**covers:** B-094, B-133, B-095, B-118, B-047
**why now:** Select only for a current question: mutation overlays and promotion guidance are useful when extending journeys; wider coverage and interactive-model readings have no present delivery dependency. A generic fresh-project install -> change -> review -> land walkthrough can locate adoption friction when that goal is selected.
**acceptance:** Bound any paid run before spending; no reinstated lane, mandatory model assertion, outcome gate or whole-registry purchase merely to refresh evidence. Release audit alone never proves a user journey.
**state:** <!-- GENERATED --> All Open; candidate lifecycle already documented, remaining B-133 gap is the point-of-use version/cost warning; no new live runs purchased.

### codex-option
**covers:** B-006
**why now:** A strategic confirmed hi, explicitly parked: cross-host use has not been selected as the next product goal. Revisit when it is; clearing all old backlog items is not a prerequisite, and the old adapter plan needs reassessment against the current single corpus.
**acceptance:** A selected cross-host use case and current capability contract justify the smallest useful port.
**state:** <!-- GENERATED --> Historically Planned; private adapter plan omitted, parked and not executing here.

### sheets-option
**covers:** B-001
**why now:** Externally conditional integration follows product delivery until the partner workflow is selected. Do not research connector capabilities merely to keep this row warm.
**acceptance:** Revalidate both the need and connector capability at selection time; the historical missing-connector claim is not a current market finding.
**state:** <!-- GENERATED --> Open; historically parked, not executing.

B-149 is Dropped in this public checkout: the historical briefs were intentionally omitted, so no local cleanup remains. This is not evidence that their findings were fixed; B-179 keeps the generic correction/disposition requirement.

The remaining ranked backlog work has no committed implementation position: B-078 (one remaining SIGPIPE site), B-158 (a demonstrated dead reference before a new guard), B-141 (concrete contradictory decisions), B-130 (a needed minor/major release), B-096 (a repeated observable failure). Each keeps its individual current scope and earns selection through that trigger; they are not one project or a guard campaign.

## Shipped
<!-- Implemented work, newest first, recent entries retained; this does not assert publication. Individual dispositions are in BACKLOG.md. -->
- 2026-09-30 · preparation-concision — B-182 (done: Dropped as accepted limit)
- 2026-09-30 · verdict-under-mandate — B-190 (done)
- 2026-09-29 · preparation-fidelity — B-189, B-188 (done)
- 2026-09-29 · b181-closing — B-181 closed by re-scope: kept `/esq:plan` read-back item 6 (`538c7c8`) makes C1–C4 and C6 reliable (≥2/3); C5 → B-188, C7 → B-189. Fidelity-trial fix withdrawn (`a5e1666`). Evidence: `docs/preparation/2026-09-29-b181-variance.md`.
- 2026-09-29 · durable-ui-evidence — B-076 (done)
