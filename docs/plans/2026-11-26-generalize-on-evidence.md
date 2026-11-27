# Generalize on evidence: a counterweight to esq's anti-abstraction rule

**Branch:** esq/generalize-on-evidence

**Origin:** main

**Reviewed at:** 3f6aa5ef217c6e576d6fac45ef552e3ea6dffe30

## Context
esq's rules push only one way. `/esq:plan`'s priorities line forbids "abstraction, configuration, extension points … without a current requirement", line 31 says "Right-sizing trims generality, never design", and its right-size pass cuts "a future uncommitted use case: single-use abstractions, … speculative extension points and restructuring that unblocks nothing" (`plugin/skills/plan/SKILL.md:29`, `:31`, `:310-315`). `/esq:review`'s bar drops neatness and consistency findings and excludes "speculative extensibility" and "consider extracting" without a concrete defect (`plugin/skills/review/SKILL.md:84-88`), and its quality pass admits only the four kinds listed at `:147-152`. Nothing ever names the case where generalizing *is* the requirement, and nothing makes either command look for the existing copies of what a change adds, so plans and reviews of every product built with esq, esq included, let copies multiply. This week's proof is in this repository: one wait rule had to be fixed in three adversary references (862bf54), then again in the three `SKILL.md` bodies those edits missed (a451d92).

## Goal
A plan or review that meets duplicated or growing code proposes the extraction the evidence justifies, and still cuts speculative abstraction; the user gets solutions that ease the next change without over-engineering.

## Done looks like
- When a planned change would add a copy of logic the code already repeats and the copies must change together, the plan extracts it and names that evidence in the task; when it would merely look similar, it does not.
- When a reviewed change adds such a copy, the review reports it as a finding naming who hits it: the next editor who fixes one copy and misses the others.
- Speculative abstraction is still cut: no extension point, configuration or abstraction enters a plan without a named current requirement or recorded next consumer.
- `CLAUDE.md` and the README say the same thing as the skills.

## Approaches considered
- **Counterweight written into the rules themselves (chosen).** Qualify the cut sentences so they no longer contradict the counterweight, add the evidence rule in the same paragraph as the cut, give each command one bounded look for existing copies, and align `CLAUDE.md` and the README in the same commits. User benefit: every plan and review applies it from the next run. Cost: four files. Limit: model behavior, unproved until real runs show it.
- **One shared rule text included by plan and review.** Loses: plan proposes an extraction and review reports a missing one, with different ledgers in view, so one text fits neither; and it adds a mechanism the goal rules out.
- **A mechanical duplicate detector (a CLI verb or audit check counting copies).** Loses: "must change together" is judgment, a lookalike is not a copy, and CLAUDE.md principle 5 forbids a guard that polices prose.

Codex's counter-plan took the same approach and added two things kept here: the smallest extraction scoped to the named evidence, and the quality pass's closed list as the second place review must change. Gemini's counter-plan, also the same approach, added the routing kept in Task 1.2 (never 🟢; 🟡 when the diff introduces the copy; backlog when the copies predate it) and a `docs/ROADMAP.md` read in preflight, rejected: the roadmap orders backlog rows, plans and epics, which preflight already matches.

## Recommendation
The counterweight in the rules themselves, with three evidence kinds, each a fact the run can cite:
- **(a) A copy that must change with others.** The change adds logic the code already repeats, and the copies share one rule and one reason to change. A lookalike is not evidence, nor are copies the code already keeps in sync by its own mechanism (a marked shared block, a generated file).
- **(b) A next consumer already recorded**, in what the run already reads: for `/esq:plan`, a backlog row or epic its preflight matched, or a consumer the task or brief names; for `/esq:review`, a consumer the reviewed plan, brief or code names. No new ledger read.
- **(c) A new arm that repeats a policy the other arms share**, on a structure that grows with every addition (a dispatch chain, a block copied per variant), so the next edit to that policy touches every arm. An independent case added to an adequate dispatcher is not evidence.

The extraction is the smallest one serving the named copies or consumer, never a guessed third. Each command looks once, bounded, for the existing copies of the rule a change adds. The registry records the rule (`D-generalize-on-evidence`), since a later edit could re-tighten the cut without knowing why it was loosened.

## Phases

Single phase: the rule is a few sentences in four files.

### Phase 1 — Plan, review and project rules generalize on evidence
- **Goal:** `/esq:plan` and `/esq:review` both apply the evidence counterweight and look for existing copies, and `CLAUDE.md` and the README state it.
- **Files touched:** `plugin/skills/plan/SKILL.md`, `plugin/skills/review/SKILL.md`, `CLAUDE.md`, `README.md`
- **Tasks:**
  - Task 1.1: feat(plan): generalize on evidence, never on speculation. In `plugin/skills/plan/SKILL.md`: the priorities line (`:29`) says "without a current requirement or evidence" and points to *Right-size*; line 31 reads "Right-sizing trims speculative generality and generalizes on evidence, never design."; the cut sentence (`:311-313`) is qualified to "an unrecorded future use case" and "restructuring that unblocks nothing and serves no named evidence", and the same paragraph gains the **generalize on evidence** rule (kinds (a)–(c) as in the Recommendation, the task naming its evidence, the smallest extraction), keeping "Never cut a trust boundary…" as its close. `## Investigation` gains one bounded clause: for each rule a task adds, one search for its existing implementations, chained into the wave that reads the candidate files. In the same commit, `CLAUDE.md` principle 4 and the README's "Design is part of the feature" bullet say right-sizing trims speculative generality and generalizes on evidence. Acceptance, by reading the edited text: a copy sharing one rule is extracted; two functions that merely look alike are not; a marked shared block is not; an independent dispatcher case is not.
  - Task 1.2: feat(review): a copy that must change with others is a finding, on evidence. In `plugin/skills/review/SKILL.md`, the quality pass's "Only these clear the bar" list (`:147-152`) gains one bullet and `## The bar` (`:86-88`) the matching include, both using the words "on evidence": a change that adds a copy which must be edited together with others already in the code (who hits it: the next editor who fixes one copy and misses the rest), a new arm repeating a policy its siblings share (the next policy change edits every arm), or a hard-coding against a consumer the reviewed plan, brief or code names (the consumer's implementer must rework that boundary). Each names the copies, arms or consumer and the smallest extraction; lookalikes and copies kept in sync by a mechanism are excluded. The quality pass looks once, in one batch, for existing copies of each rule the diff adds. Routing: 🟡 when the diff itself introduces the copy, a backlog row when the copies predate the diff, never 🟢. The exclusion of speculative extensibility and of "consider extracting" without a concrete defect stays, and "would I hold up a merge over it?" is unchanged. In the same commit, `CLAUDE.md` principle 4 and the README bullet gain the review half. Acceptance, by reading: the four controls of Task 1.1 give one finding (the shared-rule copy) and no other.
- **Verification:**
  - `(auto)` `grep -L 'on evidence' plugin/skills/plan/SKILL.md plugin/skills/review/SKILL.md CLAUDE.md README.md` — prints nothing: every file carries the rule (format only; behavior is unproved, see Risks)
  - `(auto)` `grep -c 'would I hold up a merge over it' plugin/skills/review/SKILL.md` — prints 1: the review's merge test is unchanged
  - `(auto)` `./scripts/audit.sh` — Clean: structure, plugin validation, conformance and the product suites pass (README and skill semantic parity is the tasks' read-back, not the audit's)

## Risks
- **Pre-mortem: the likeliest way the user gets nothing is that the model reads the new rule and still never applies it**, because the text around it argues against generality. Task 1.1 removes the contradiction in the cut sentence itself and keeps the rule in the cut's paragraph, and both commands now look for existing copies. Behavior stays unproved: the next real `/esq:plan` or `/esq:review` on a change that duplicates code is the observation, and no paid run is bought to stand in for it.
- **Over-correction: extraction of lookalikes or of independent dispatcher cases.** The "one rule, one reason to change" test and the explicit exclusions are the guard; a review flagging two intentionally divergent blocks is the symptom to watch.
- `docs/SPEC.md`'s `/esq:plan` rules (`:43`, `:61`) still say only "cuts generality nobody has a caller for". `/esq:spec` is the user-triggered follow-up; this plan does not edit SPEC.
- The adversary duplication that motivated this (one lifecycle text in four commands) is the next plan's subject, not this one's.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-26

**Plan committed at:** c23b047

**Commits:** 7e03e25, 2ed3a11

**Verified:** 2ed3a1111a1e2acd92fbc60b4b568b10e7bf14cf
- `grep -L 'on evidence' plugin/skills/plan/SKILL.md plugin/skills/review/SKILL.md CLAUDE.md README.md`
- `grep -c 'would I hold up a merge over it' plugin/skills/review/SKILL.md`
- `./scripts/audit.sh`

**What got built:** /esq:plan generalizes on evidence (a copy that must change with others, a recorded next consumer, a new arm repeating a shared policy) in the same paragraph as its speculative cut, and looks once for existing copies; /esq:review counts such a copy as a finding, routed yellow or backlog, never green. CLAUDE.md and the README state both halves.

**Verification:**
- (auto) grep -L on evidence over the four files — prints nothing, every file carries the rule (format only)
- (auto) grep -c would I hold up a merge over it — 1, the merge test is unchanged
- (auto) ./scripts/audit.sh — Clean, 7 checks (product)

**Surprises / decisions made during execution:** None — phase executed as planned. Acceptance controls walked by reading: a shared-rule copy is extracted or reported; a lookalike, a marked shared block and an independent dispatcher case are not.

**Backlog candidates:** None.

**For Phase 2:** Last phase. Behavior stays unproved until a real /esq:plan or /esq:review meets duplicated code; docs/SPEC.md still states only the cut (/esq:spec follow-up).
