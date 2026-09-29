# Roadmap

<!-- Durable order explicitly reconciled 2026-09-24; state comes from backlog, plan logs and epic status. -->
<!-- Rank is projected through esq backlog rank; no inferred implementation dependency is invented. -->

Initial order proposed by [PRIORITY-REVIEW.md](PRIORITY-REVIEW.md), checked against public snapshot `d45188e`; the user selected B-172 first, then B-129, on 2026-09-24. Historical acceptance was examined in the former development checkout; its plans are intentionally omitted here. Historical upstream commit IDs are provenance, not local Git refs. This replaces the inherited queue rationale; Git retains the previous derivations.

**Objective:** useful features shipped quickly, fewer unnecessary interruptions, reliable verification and beautiful, thoughtful design. Spend tokens, tool turns and elapsed time in proportion to that value. The CLI owns deterministic structure; the model owns judgment. A guard must detect a defect, resolve a reference or protect a parsed format. Optional telemetry and research never gate delivery. Deployment remains outside ESQ's scope.

The sequence below is the remaining execution proposal, not a claim that work has started. Re-derived 2026-09-29 after B-181 closed by re-scope into B-188/B-189: Now carries the two preparation criteria its kept fix left unreliable, on the retained Tamialog case. Order is positional unless a `needs:` edge is written. Existing confirmed priorities remain intact, including hi on conditional work. Backlog Rank records the active sequence, while priority-sorted backlog views still group by Pri; those views must not be read as the roadmap. No implementation is commissioned by a generated state alone.

## Now

### preparation-fidelity
**covers:** B-189, B-188
**why now:** The two criteria B-181's kept read-back fix left unreliable (C7, C5), split off 2026-09-29 with the Tamialog case, its sources and the criteria × runs table still retained — nothing to re-derive. B-189 first: asserting Git state the run never observed is a correctness defect with a narrow rule to state; B-188 follows, since a targeted fix already reached only 1/3 and is the less certain of the two.
**acceptance:** On the retained case, neither criterion fails in a bounded run set stated before spending; the gains C1–C4 and C6 from `538c7c8` do not regress. Research never gates a demonstrated fix.
**unblocks:** preparation-concision
**state:** <!-- GENERATED --> B-189 Open [hi?]; B-188 Open [hi?]; no plan. Kept fix `538c7c8` (plan read-back item 6) in place; C5 1/3, C7 1/3 on the 2026-09-29 variance fix arm. Evidence: docs/preparation/2026-09-29-b181-variance.md.

## Next

### preparation-concision
**covers:** B-182
**why now:** Same preparation path and same retained case, so it lands right after fidelity: the 2026-09-25 source split was withdrawn precisely because a shorter plan lost "powdered" again, so length cuts are judged against a stable fidelity baseline, not beside a moving one.
**acceptance:** Output within its word bound with no loss on the fidelity criteria; record what improves and what does not, without equating shorter instructions with better proposals.
**needs:** preparation-fidelity
**state:** <!-- GENERATED --> B-182 Open [hi]; no plan; blocked on preparation-fidelity (Now). Four bounded observations retained, none meets concision acceptance; last candidate withdrawn 2026-09-25.

### autonomy-remainder
**covers:** B-169, epic:esq-decides-implementation-detail
**why now:** Resume after the concrete queue defects, on an observed specialist need. Within the epic, preserve A/D -> B -> C: A and standards arbitration B shipped, and B-179 delivered D's exit locally. For C, select one unmet need before adding guidance or role skills, keeping beautiful design part of delivery.
**acceptance:** A real selected case proceeds without an implementation-detail question, with evidence of correct behavior and design quality; guidance stays on demand and within a stated cost bound.
**state:** <!-- GENERATED --> B-169 Open [hi]; epic Active; no tagged plans in this snapshot; domain defaults in standards Part 2 remain empty, C not implemented. No concrete specialist case selected yet; no generic role framework commissioned.

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
- 2026-09-29 · b181-closing — B-181 closed by re-scope: kept `/esq:plan` read-back item 6 (`538c7c8`) makes C1–C4 and C6 reliable (≥2/3); C5 → B-188, C7 → B-189. Fidelity-trial fix withdrawn (`a5e1666`). Evidence: `docs/preparation/2026-09-29-b181-variance.md`.
- 2026-09-29 · durable-ui-evidence — B-076 (done)
- 2026-09-29 · verification-commands — B-107, B-163 (done)
- 2026-09-25 · plan preparation experiment — B-182 stays Open. Authorized Tamialog retry is faster and cheaper but still over 900 words and loses required English copy; candidate split withdrawn, B-181 source restored exactly. Reference never rerun, no new trial or full audit. Evidence: `docs/preparation/2026-09-25-b182-tamialog.md`. No publication or queue change.
- 2026-09-25 · UI preparation instructions — real Tamialog brief at 33e750a1, two bounded read-only trials: corrected drawer grounding, removed SPEC prerequisite and repeated builds/audits. Output still exceeds 900 words and cost rises; B-181/B-182/B-169 C stay Open. Source changes and mixed evidence only, no Tamialog UI delivery or publication. Exact comparison: `docs/preparation/2026-09-25-b181-tamialog.md`.
