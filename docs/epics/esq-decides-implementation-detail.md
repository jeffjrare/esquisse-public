# Epic: esq decides implementation detail instead of asking

<!-- Epic: a theme spanning multiple plans over time. Managed by /esq:epic. -->
<!-- Join key: the slug below; used by BACKLOG.md Epic and plan **Epic:** headers. -->
<!-- Slug: esq-decides-implementation-detail -->

**Status:** Active
**Started:** 2026-09-19

## Goal

**esq's first objective is end-user value, shipped fast, with beautiful, thoughtful design.**
Assurance, ledgers and corrective loops serve that result. A run asks only for missing user authority
that materially changes the product, scope, major architecture, constraints or consequential cost/risk;
implementation detail is delegated work. Keep total cost — tokens, calls, elapsed time, repeated work
and interruptions — proportionate to the value shipped. Deterministic structure belongs in the CLI;
judgment stays with the model, and guards must catch defects rather than police sentences.

Preserve both user measures: **time to client value** and **blocking rate**. The user's bar remains
*"si esq me fait bloquer, c'est mauvais"*. This reconciliation supplies no current quantitative outcome
measurement; shipping a rule or passing a fixture is not proof of either improvement. Optional research
and telemetry never become delivery gates.

## Scope

- Apply a diagnosed in-scope fix rather than returning typing to the user, within the existing repair budget.
- Arbitrate stated constraints before asking, using the shipped standards referent and project overrides.
  The absence observed on 2026-09-19 is historical: `plugin/standards/STANDARDS.md`, `esq standards`,
  consumers and `tests/cli/standards.test.mjs` now exist.
- Make corrective work converge with a bounded, usable exit. A depth limit alone is insufficient:
  B-179 now supports safe prospective corrections and explicit dispositions through fix -> review -> land,
  preserving historical proofs and the two-generation bound.
- Select specialist guidance from a concrete unmet front-end, back-end or design need. Standards Part 2
  is deliberately empty; this does not justify a generic role framework, nor mean workers must ask whenever
  no default is written. Use repository conventions and the existing mandate first.
- Keep design quality observable, not merely asserted. B-076 is related delivery work, not evidence that
  role skills C have shipped and not an automatic prerequisite for every autonomy change.
- Out: weakening the genuine missing-authority rule, unbounded corrective generations, rewriting historical
  verification to obtain a green gate, deployment, and mandatory research/telemetry campaigns.

## Order

The user's 2026-09-19 order **A -> D -> B -> C**, with A and D in one original shipping unit, remains.
D's discovered gap is repaired. The user-selected global queue now handles B-172, then B-129/B-079, before resuming C on a concrete unmet need; the epic's internal A/D -> B -> C order is preserved.

1. **A — the stop does the work: delivered contract.** The 2026-09-19 plan replaced the single repair
   ceiling with a budget of three edits for distinct causes. `build/SKILL.md` and
   `build/references/failure-and-recovery.md` require applying an exact in-scope diagnosis while budget
   remains. Do not read this as unlimited recovery or measured elimination of all interruptions.
2. **D — the corrective loop converges: supported exit delivered locally.** `esq brief depth` still bounds
   plan generations at two. B-179 is Done: safe prospective corrections and explicit dispositions pass
   through fix -> review -> land while preserving historical proof. Three real-Git scenarios verify
   the deterministic path; no live model journey or measured improvement is claimed.
   B-180 was corrected first because stale proof could hide a failed check; it remains a separate defect.
3. **B — a standards referent: arbitration delivered.** The 2026-09-21 stem and both fixes plans are
   complete. The plugin default, project precedence, `(hard)` limits, unreadable-referent behavior and
   caller clauses exist. Tests cover filesystem resolution, including subdirectory invocation. Domain
   defaults remain empty on purpose; do not equate this delivered mechanism with finished specialist competence.
4. **C — specialist guidance: not implemented.** First select one observed need that A/B and repository
   conventions do not settle. Add the smallest useful on-demand guidance/skill, with evidence of useful,
   correct and well-designed output and a stated cost bound. If no need survives, leave this conditional;
   closing or abandoning C later must record that evidence explicitly. No blanket abandonment in this pass.

## Plans
<!-- GENERATED from plans present in this public checkout. -->
_No plans tag this epic in the public snapshot. Historical private plans are intentionally omitted; see [plan archive](../plans/README.md)._

## Backlog
<!-- GENERATED from BACKLOG.md Epic and Status cells; order shown follows the roadmap. -->
- B-179 — Provide a bounded safe correction/disposition for a completed plan when corrective depth is exhausted — Done
- B-169 — Autonomy epic: A and standards arbitration B delivered; finish D via B-179, then evidence-led specialist guidance C — Open

## Log

- 2026-09-19 — Epic opened.
- 2026-09-19 — Goal and Scope corrected after the user checked the framing: client value first;
  overengineering/recursion retained; the 40 min, 9 commits, 2 of 6 phases stopped for a fixture edit
  specimen recorded. The absent standards referent was verified at that date, before it shipped.
- 2026-09-19 — User order recorded: A -> D -> B -> C, with A and D as one shipping unit.
- 2026-09-24 — Reconciled against public snapshot d45188e and PRIORITY-REVIEW.md. Upstream history records four completed plans,
  including the standards stem and its two corrections. They are not present in this snapshot; the generated Plans view correctly remains empty. A/B delivery is recognized;
  D's mechanism does not settle B-179's missing exit. B-179 now carries this epic's join key.
  B-169 stays Open and the epic Active because D/C outcomes remain. No corrective implementation,
  new live model journey or claimed time/blocking-rate improvement accompanies this document update.

- 2026-09-24 — B-180 implemented and verified in the public repository (7/7 product audit checks).
  This strengthens verification without closing B-169; B-179 is now the next delivery task.

- 2026-09-24 — B-179 implemented locally: three real-Git correction/disposition scenarios and 7/7 product audit checks.
  D now has its supported exit; no live model journey or measured blocking-rate gain is claimed.
  B-169 remains Open and the epic Active for the conditional specialist-guidance outcome C.

- 2026-09-24 — User selected B-172 as the next implementation, then B-129. The roadmap places
  those concrete queue defects ahead of the conditional C slice. The epic remains Active; no specialist
  work or evidence has been invented, and B-172 is not added to this epic.
