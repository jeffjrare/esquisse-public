# Settle a measurement verdict under mandate, never as a user question (B-190)

**Epic:** esq-decides-implementation-detail

**Branch:** esq/measurement-verdict-under-mandate

**Origin:** main

## Context
B-189 needed three shipping units and a 🔴 at `/esq:land`. `docs/plans/2026-09-29-git-state-rule-alone.md` wrote its own
keep/revert rule before spending: any criterion below 2/3 means revert. C6 fell from 2/3 to 1/3, but it fails the same way
with or without the edit (build, then audit without `--no-build`). The rule still reverted a fix that held C7 at 6/6. Then
build's handoff ("needs the user's disposition of B-189") and land's promised-row step put a keep/revert/drop choice to the
user. The user delegated it three times on 2026-09-29 ("you decide"; "jtai demandé de décider tantot ce genre de trucs"). No
skill says how a plan writes such a rule, and none says who applies it when its premise fails. `plugin/skills/plan/SKILL.md:98`
asks for "the smallest observation that can settle the claimed outcome" and stops there. Build's
`references/decisions-and-backlog.md` "Close the items" step and land's `unit.promised` step
(`plugin/skills/land/SKILL.md:67`) both fall back on a user choice. SPEC does not describe this behavior. A `/esq:spec`
refresh afterwards is the user's call, not a prerequisite.

## Goal
When a change is judged by a bounded run set, the user is no longer asked to keep, revert or drop it. esq applies the rule it
stated before spending, counts a fall as a regression only when the edit can cause it, and records the call in one line. The
user's time goes to product decisions, and a demonstrated fix is not reverted because of noise.

## Done looks like
- A plan whose change is judged by a run set states its keep/revert rule before spending, with an attribution test. A fall
  in a criterion counts as a regression only when the edit can cause it. A fall the baseline arm shows the same way, or one
  from a mechanism the edit does not touch, is reported but never triggers a revert.
- The rule settles every outcome, including a missed target and the promised row's disposition. `/esq:plan` never lists it
  as an open question. `/esq:build` applies it with a one-line reason in the execution log, and its handoff never names a
  user disposition for it.
- `/esq:land`, meeting a promised row whose plan recorded such a verdict, follows the verdict. If the verdict names a next
  lever, land routes it to `/esq:plan implement`. If it names none within the stated bound, land drops the row as an accepted
  limit, citing the verdict. It never offers a delivered/not-delivered 🔴 for that row.
- Spending beyond the stated bound (another paid run set) still needs the user's authorization, and research never gates a
  demonstrated fix.
- `./scripts/audit.sh` PASS is recorded.

## Approaches considered
- **One rule stated where each of the three skills acts (chosen).** Add a sentence in plan's improvement paragraph (where the
  rule is authored), in build's "Close the items" step (where the verdict's row is dispositioned and the handoff is written)
  and in land's `unit.promised` step (where the 🔴 was raised). One decision entry carries the user's delegation as the
  basis. The cost is about 150 words across three loads, with no CLI change.
- **Edit the shared `ask-altitude` block instead.** It sits in grill, plan and ui, but not in build or land, where both
  stops happened. It would widen three loads and still miss the two sites that asked.
- **A CLI verdict (`esq verdict`) computing keep/revert from a criteria table.** Deterministic, but attribution ("can the
  edit cause this fall?") is judgment by nature, and no second consumer exists yet. Rejected under CLAUDE.md's rule 3.

## Recommendation
Take the first approach. Plan owns authoring the rule, build owns applying it and closing the row, and land owns its last
disposition (`docs/ARCHITECTURE.md`'s one-writer-per-file rule is untouched: all row writes still go through `esq backlog`).
Record `D-a-measurement-verdict-is-settled-under-mandate` with `Fondement: user`, citing the 2026-09-29 delegations; its
three sentences cite it. Keep build's "Never drop a row here" guard: build leaves a verdict-missed row Open with the verdict
recorded, and only land, which must empty `unit.promised`, drops it as an accepted limit.

## Phases

Single phase: three prose rules and their decision land together, since any one of them alone still lets the question
reach the user.

### Phase 1 — The verdict is stated, applied and dispositioned under mandate
- **Goal:** plan, build and land each carry the rule at the point where they act, citing the new decision.
- **Files touched:** `plugin/skills/plan/SKILL.md`, `plugin/skills/build/references/decisions-and-backlog.md`,
  `plugin/skills/land/SKILL.md`, `docs/BACKLOG.md` (B-190 close, owned by build's step). The decision entry is
  written with this plan.
- **Tasks:**
  - Task 1.1: `plan: state a run-set verdict with its attribution test and settle it under mandate (B-190)`. After
    "Plan the smallest observation that can settle the claimed outcome." at `plugin/skills/plan/SKILL.md:98`, add the
    following. When a bounded run set judges the edit, state the keep/revert rule before spending. The rule includes the
    attribution test: a fall counts as a regression only when the edit can cause it, and a criterion that fails the same way
    in the baseline arm, or through a mechanism the edit does not touch, is reported and never reverts. The rule settles every
    outcome, including a missed target and the promised row's disposition (Done, Open with a named next lever, or no lever
    left). It is never an open question, and the executing session applies it with a one-line reason (cite the decision). A
    further paid run beyond the stated bound stays the user's authorization.
  - Task 1.2: `build: apply a plan's run-set verdict and record it, never hand it back (B-190)`. In
    `plugin/skills/build/references/decisions-and-backlog.md`, add the following to the paragraph "A row you left open is not
    a request to the user…". A row the plan's run-set verdict left unmet is not such a decision. Record the verdict, its
    one-line reason and any named next lever as a zone-3 fact and in the log's handoff. Never write a user disposition for
    it; land disposes of it (cite the decision). "Never drop a row here" stays.
  - Task 1.3: `land: dispose a verdict-settled promised row without a user choice (B-190)`. In `plugin/skills/land/SKILL.md`'s
    `unit.promised` bullets, add the following. A row whose unit plan recorded a run-set verdict follows it. A named next
    lever routes to `/esq:plan implement <id>: <lever>`. No lever within the stated bound means
    `esq backlog set-status <id> Dropped --reason "accepted limit: <verdict citation>"`, closed in the same backlog commit as
    proved rows. Neither case is a delivered/not-delivered choice (cite the decision). `--reason` is accepted with
    `Dropped` only (`plugin/lib/cli.mjs:563`).
- **Verification:**
  - `(auto)` `grep -c "a-measurement-verdict-is-settled-under-mandate" plugin/skills/plan/SKILL.md plugin/skills/build/references/decisions-and-backlog.md plugin/skills/land/SKILL.md` — each file reports 1: all three sites cite the decision
  - `(auto)` `grep -c "^## D-a-measurement-verdict-is-settled-under-mandate " docs/DECISIONS.md` — 1: the entry exists, so the citations resolve
  - `(auto)` `grep -c "Never drop a row here" plugin/skills/build/references/decisions-and-backlog.md` — 1: build's drop guard survives
  - `(auto)` `esq validate` — `"valid": true`: ledgers and decision index intact
  - `(auto)` `./scripts/audit.sh` — PASS; it runs the product suites and the skill-corpus/structure checks itself, so no `node --test` beside it

## Risks
- **Pre-mortem: the next run-set plan still asks.** A plan author writes a rule without an attribution test, or build's
  handoff copies an old plan's "needs your disposition" wording. Task 1.1 puts the test in the paragraph every improvement plan
  reads, and Task 1.2 forbids the handoff line where it is written. The next B-182 run set is the live observation, and until
  then the change is unproved. No paid run is bought here to prove it.
- **Attribution becomes an excuse to keep everything.** "The edit cannot cause it" must name the mechanism (as C6's build/audit
  path did), not assert it. Task 1.1's wording requires the baseline arm or a mechanism, never a bare claim.
- **Legitimate counterexample:** a verdict whose keep needs more spending than stated (another run set) or changes a
  user-visible product outcome. The first stays the user's authorization, and it is written in the decision and Task 1.1. The second
  is outside this rule: a verdict about esq's own preparation quality is not a product decision, but a copy tradeoff in a
  user's app would still go through the existing ask-altitude rule.
- **Word cost:** about 150 words across three skill loads. Land and build load them only at their steps. Plan's paragraph is
  read every run.

## Open questions
None. The user delegated this class of call on 2026-09-29, recorded as the new decision's basis.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
