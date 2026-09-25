# B-013 — One check result, its gaps and its next action

Inline maintainer change, 2026-09-25, starting from clean
`812aae26b83bf78119fc2fb381f753f4e5882b12`. Authority: the user's B-013 request,
CLAUDE.md and `.claude/skills/skill-authoring/SKILL.md`. No implementation plan
was needed for this instruction change. No runtime or parsed format changes.

## Existing evidence, not a new check run

The public `docs/plans/README.md` explains why the old plans are absent. A bounded
search of local esquisse transcripts found actual assistant reports. The search
excluded tool-result copies of the skill and announcement-only messages. The
two specimens below were read along with their invocation mandates. No historical
test was rerun, and none of its PASS claims certifies today's tree.

Local provenance, relative to
`~/.claude/projects/-home-jeffgirard-projects-esquisse/` (read only):

| Specimen | Transcript and assistant line | Timestamp |
|---|---|---|
| Gaps | `75612b4c-4fcc-46da-a35b-a1772f65d1bf/subagents/agent-a75cf601ea09313ea.jsonl:98` | 2026-09-20T16:17:51.334Z |
| Clean | `227d6d0c-f243-45b8-8d83-16ae252b2780/subagents/agent-a89d62c540ab2f073.jsonl:60` | 2026-09-22T03:16:09.907Z |

### Observed output

- **Gaps:** the headline named `every-open-item-is-ranked`, four phases and two
  findings. A green wording fix came before the yellow behavior gap. Later,
  `answers` said `Done looks like — 4 of 5 met`: changing a roadmap did not move
  the stored rank without a second command. The report preserved the unmet
  outcome, but its opening did not say what failed for the user.
- **Clean:** the headline named `standards-referent-fixes`, two phases and zero
  findings; a separate `answers` row stated six of six conditions met. It
  correctly handed off to `/esq:review docs/plans/2026-09-21-standards-referent-fixes.md`.
  It explicitly reused the recorded audit PASS at `21e8480`.
- **Both:** after `→ Next`, a `Report for the caller` repeated results, findings
  or acceptance details. Both mandates (line 1 of each transcript) requested a
  return naming work, brief, commits and any early-stop reason. That is a
  plausible contributor to the duplication; it is not proof that the six
  verdict options caused it. Neither report fabricated a product decision.
- **Historical limitation:** the gap report's converge description promised a
  review. Current source already corrects that check-origin handoff; this change
  preserves the correction and does not claim to have introduced it. Old checks
  of prose parity in these reports are historical evidence, not checks to restore.

### Risks inferred from the current instructions

At the starting commit, three-zone instructions, an exact report example and six
separate verdict options compete for placement. The example orders phase success
before the unmet outcome. The route table has no incomplete-only branch, though
its report shows paused phases. The user-judgment branch offers review on a yes
without considering other gaps; a red-only brief can be skipped as
“informational”. The significant-drift verdict invites a generic amend-plan / fix-code
choice. These are source-level ambiguities, not observed wrong decisions or false
clean results in the two specimens. The sources already distinguish missing
artifacts from never-observed manual work; that distinction is retained.

## Before / after

- **Before:** counters first, acceptance later, optional extra verdict and caller
  recap. **After:** one outcome statement in the headline; actions describe the
  gaps, factual rows carry supporting proof and requested bookkeeping.
- **Before:** six competing sentences plus an exact example. **After:** their
  meanings live in outcome, gap and routing rules, with flexible labels/layout.
- **Before:** incomplete-only routing and red-only persistence are ambiguous.
  **After:** resume the phase once prerequisites are settled; preserve a genuine
  decision in the existing brief; reserve review for the proved, complete case.

The following are **editorial applications to the recorded facts**, not outputs
from a new native invocation. Historical paths identify those examples only;
they are not runnable targets in this public snapshot. Elapsed figures are
omitted here rather than presenting historical reported durations as new timings.

Gaps, condensed from the first specimen:

```text
⚠ check — Editing the roadmap still needs a second command to change rank (Done looks like #4) · NEEDS YOU (2).
🟢 Qualify the wording promise — README.md:1090 and backlog skill:37 → /esq:fix docs/plans/2026-09-20-every-open-item-is-ranked-fixes.brief.md
🟡 Plan the direct rank update — roadmap/SKILL.md:219; already B-173 → /esq:plan docs/plans/2026-09-20-every-open-item-is-ranked-fixes.brief.md
✔ Four phases completed; all tasks matched; no manual step owed.
✔ Evidence reported: CLI, validation, package and conformance checks; full audit not rerun.
○ Spec stale in two features; refresh is advice.
✔ Brief recorded in 5d71205: docs/plans/2026-09-20-every-open-item-is-ranked-fixes.brief.md.
→ Next: /clear, then /esq:fix docs/plans/2026-09-20-every-open-item-is-ranked-fixes.brief.md
Or: /esq:converge docs/plans/2026-09-20-every-open-item-is-ranked-fixes.brief.md — applies safe fixes and stops; one subagent. Review remains owed after the remaining gap: /esq:review docs/plans/2026-09-20-every-open-item-is-ranked.md
```

Clean, condensed from the second specimen (six lines; no ask, brief or convergence):

```text
✔ check — standards-referent-fixes satisfies all six Done looks like conditions.
✔ Two phases complete — a54388b, 3fa5923, a5bf896, 21e8480; tasks matched.
✔ Reported evidence: carrier checks, native fault injection and conformance passed.
✔ Audit PASS at 21e8480 reused: only plan-log commits followed it.
○ Spec stale in one feature; /esq:spec is optional advice.
→ Next: /esq:review docs/plans/2026-09-21-standards-referent-fixes.md
```

## Directed verification of the final instructions

Read the outcome analysis, per-phase proof rules, report, routes, corrective-depth
bound and brief write as one procedure, against the six old verdict meanings.
These are semantic counterexamples examined by reading, not fabricated runtime
observations or phrase-presence tests.

| Case | Result and continuation checked |
|---|---|
| Every task shipped, one acceptance condition fails | The failed user outcome leads; phase success cannot make it clean. Diagnose the gap and use its correction tier. |
| Conditions proved and phases complete | One satisfied outcome, supporting proof, review at the concrete plan path. No fix, converge or landing claim. The clean specimen above exercises this presentation. |
| Harmless implementation drift | At most a note; the same clean route survives. No manufactured action or decision. |
| Missing task or outcome-changing drift | Name the lost capability and technical correction; mechanical vs substantive determines fix vs plan. No generic question about changing acceptance. |
| Missing, stale or unreadable capture | Recover or observe the uncovered condition within mandate. If still unproved, retain missing proof; do not infer a visual defect or never-observed work. |
| Manual work explicitly deferred despite completed status | Keep false-complete prominent, name the owed observation and resume build. A proof gap alone does not earn this classification. |
| Incomplete-only phase; blocked phase plus corrections | Resume build in the former; route the cause's correction first in the latter and retain phase resumption. Neither is all clear. |
| Genuine user-only judgment, alone or with technical gaps | Keep the missing authority and distinct executable options; preserve it even in a red-only brief. A yes settles that condition alone; other findings still govern continuation. |
| Two corrective generations exhausted | Existing depth query and bounded correction/disposition rules still override the normal route; no third plan or implicit waiver of failed acceptance. |
| Same proof used for outcome and phase analysis | Reuse valid recorded evidence and this run's observations; only unresolved coverage/validity earns a check. No second run merely to fill another report zone. |

The README's command row and review explanation remain accurate: diagnostic
report and corrective brief, no review coverage. No README behavior rewrite is
needed. The change does not refresh SPEC or ARCHITECTURE or rewrite historical
decisions. The roadmap's remaining-work mention and backlog disposition are
updated solely for this selected item.

## Cost and checks

No subagent, paid model trial, new format, new test, transcript export or runtime
framework. Existing evidence was reused. Initial broad reads returned excessive
historical text; no measured token or execution-cost saving is claimed. Shorter
editorial reports demonstrate presentation, not compliance by future model runs.

One product audit, bounded at 180 seconds, is run for the final skill source.
Its Node suites are not run separately. Native package validation is mechanical evidence;
no new interactive Claude check run or review coverage is claimed.

Results: the initial audit exited 1, **5/7 PASS**. Structure, native package,
no-push, parsed conformance and manifest agreement passed. The bounded runner's
late-failure specimen returned a child test-file failure instead of its named
assertion, and the product suites reported child test-file failures. Only those
two failed controls were retried outside the sandbox, under one 160-second outer
bound, with the same product source: **bounded=0 (9 s), product=0 (14 s)**.
This establishes environment-dependent failures; it does not identify the exact
sandbox mechanism. No successful audit check was rerun. This is five initial
passes plus two successful retries, not an uninterrupted 7/7 audit.

- [Initial audit](2026-09-25-b013-audit.txt)
- [Bounded-runner retry](2026-09-25-b013-bounded-retry.txt)
- [Product-suite retry](2026-09-25-b013-product-retry.txt)

B-013's closure covers the instruction reconciliation verified above, not a
measured improvement in native generated reports or execution cost. Its original
date, priority and source remain; the CLI adds the disposition and clears its
inactive rank. The roadmap records local delivery without queue promotion.

Final bookkeeping checks: `plugin/bin/esq validate` returned `valid: true`, no
findings; `git diff --check` passed. No push, release or publication.
