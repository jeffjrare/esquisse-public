# Behavioral conformance contract

This is the external referent for changing how esquisse is packaged or executed, and it is
deliberately narrow: **the shapes a skill writes and a conserved reader parses.** A section heading,
a header field, a path form, a table row, a glyph. `scripts/check-conformance.sh` evaluates the skill
package against it.

**Why these and not the rules.** The `node --test` suites prove the CLI *reads* each shape; nothing
else proves a skill template still *writes* it. Reword a template and `parsePlan`, `esq branch check`,
`esq merge land`, `briefPlan` or the backlog parser silently find nothing — no error, no finding, just
a reader that returns empty forever. That is the one defect class a lexical check catches and a test
cannot, and it is the only one this document is for.

**What is not here.** Clauses that pinned a rule's phrasing, an explanation, a recommendation or the
order two sentences appear in. The document carried 38 scenarios and 359 such clauses on 2026-09-22
and 19 scenarios and 174 after a first cut; both figures described a check that failed a correct
rewrite, which makes it an editor rather than a contract. Those rules are still rules — they live in
the skills as instructions, and in `docs/AUDIT.md`'s reading pass, which is where a human judges
whether a paragraph still says what it should. **Do not re-add one here under another name**, and do
not keep a list of what was removed.

## Scenario P-02 — the plan file four readers parse

`/esq:plan`'s template writes these tokens, and these read them:

| Token | Parsed by |
|---|---|
| `## Execution log` | `parsePlan` finds the log span by it; `esq plan append-log` appends under it |
| `**Branch:**` | `headerField`, then `esq branch check` (the shipping unit) and `esq merge land` (the source ref) |
| `**Origin:**` | `esq merge land` — the landing **destination**. A plan missing it is refused rather than repaired, so losing the line from the template loses every landing. |
| `## Rollout` | `esq branch check` collects its bullets into `unit.rollout`, which `/esq:land` shows after the merge. Renamed in the template, every deployment step silently disappears from the landing report. |

**The token, not the sentence around it.** A placeholder explaining which branch belongs in the field
is prose: reword it freely. What may not change is the field marker the parser matches.

## Scenario U-01 — the execution-log entry the classifier reads by glyph

`/esq:build`'s paused template writes `### Phase N — ⏸ …`. `parsePlan` matches
`^### Phase (\d+) — (completed|⏸)` and **classifies on the glyph, never on the clause after it** —
which is why there are two clauses today (`awaiting manual verification`, `blocked on an open
same-unit defect`), why every consumer routes on `status: 'paused'` instead of either literal, and why
a third would need no parser change. One clause here, on the glyph, for the same reason: pinning both
sentences would freeze exactly what that design left free.

## Scenario P-03 — the corrective-brief name `esq brief plan` resolves by

Both finders write `docs/plans/<YYYY-MM-DD>-<slug>-fixes.brief.md`. The parsed part is the
`-fixes.brief.md` suffix: `CORRECTIVE_BRIEF` matches it, `briefPlan` resolves the plan a brief
corrects by the slug before it, and `esq brief pending` finds unconsumed briefs the same way. A brief
named some other way resolves to nothing, silently.

## Scenario P-04 — the backlog row the table parser reads

`/esq:backlog`'s quick-add writes `| B-NNN | <today> | …`. `backlogTable` reads the ID column first
and every consumer filters on the `Status` cell; a row that does not start this way is invisible to
the whole set.
