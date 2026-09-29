# Plans name a Git state only from observed output: the C7 rule, judged on its own

**Branch:** esq/git-state-rule-alone

**Origin:** esq/git-state-and-copy-fidelity

## Context
`2026-09-29-git-state-and-copy-fidelity` tested two `/esq:plan` wording fixes in one shared set of 3 Tamialog runs
(`docs/preparation/2026-09-29-b188-b189-tamialog.md`). The Git-state rule (C7, commit `44f5ff6`) raised C7 from 1/3 to
3/3. C1 and C6 fell from 2/3 to 1/3, though, so the pre-written rule reverted both edits (`cc45e94` reverted the C7
edit). A shared set cannot say which edit cost C1/C6. The report names the likely one: the C5 clause, which lengthens
item 6, where the C1 and C6 clauses live. C7 sits outside item 6. B-189 is Open, and the unit it came from cannot land
while it stays promised. This plan is cut from that unit's branch and lands back into it. Once B-189 is disposed here and
B-188 elsewhere, that unit can land on `main`.

## Goal
A person reading a `/esq:plan` output from a shell-less run is never told a Git state nobody observed. This is proven on
the retained Tamialog case, and B-181's other criteria lose nothing.

## Done looks like
- In `/esq:plan`, a Git state is named only from the output of a command that actually ran. With no shell, or when the
  command did not run, the plan says "branch not observed" and names no state and no consequence of one.
- One bounded set of 3 runs on the retained Tamialog case judges it, with C1–C7 and the rule below written before any
  run. B-189 is Done if C7 holds ≥ 2/3 while C1, C2, C3, C4 and C6 each hold ≥ 2/3.
- If the rule reverts the edit, `plugin/` ends byte-identical to its current state, and B-189 stays Open with the table
  as its reason.
- `./scripts/audit.sh` PASS is recorded.

## Approaches considered
- **Re-apply `44f5ff6` unchanged, with one run set (chosen).** This is the exact text that held C7 3/3, now alone, so
  any change in C1/C6 can be attributed to it. It costs about 95 words per `/esq:plan` load, plus 3 runs
  (≤ 9 USD list price, ~3.7 USD expected from the last set).
- **A shorter rewording (~40 words).** It would be cheaper on every load. But it would test new text, so the 3/3 would
  no longer apply to it, and it would not settle whether C7 caused the C1/C6 drop. It can come later if the
  95 words are kept and judged too costly.

## Recommendation
`git revert cc45e94` re-applies `44f5ff6` verbatim in `plugin/skills/plan/SKILL.md`, which owns this wording. Nothing is
added to the CLI, the audit or the references.

**Rule fixed before spending.** The baseline is the 2026-09-29 variance fix arm, which is today's `SKILL.md`
(`8f505624…`): C1 2/3, C2 2/3, C3 3/3, C4 3/3, C5 1/3, C6 2/3, C7 1/3.
- **Target:** C7 ≥ 2/3 → B-189 Done.
- **No regression:** C1, C2, C3, C4 and C6 each ≥ 2/3, the level B-181 closed them at. C5 is reported but plays no part
  in the rule: its 1/3 baseline has no room to fall that n = 3 could tell from noise.
- **Regression** (any of them < 2/3): revert the edit and leave B-189 Open. This time the loss is attributable to C7 or to
  noise, and the report says which reading the evidence supports.
- **No regression, target missed:** revert. The edit costs words and buys nothing.
- A run killed at 180 s delivers nothing and fails every criterion. Only an infrastructure failure (auth, DNS) is
  relaunched, and only once.

**Budget, printed before launch:** 3 runs, at most 3 USD and 180 s each, 9 USD in total. These are CLI list-price
estimates: on the subscription they use plan quota and are not billed.

## Security notes
The Tamialog inventory (437 files at `events-tracker` `33e750a1`) goes to Anthropic again. The user authorized this for
the B-181 and B-188/B-189 trials, and this run set is the follow-up the user asked for. The credential is copied into a
`mktemp` that a trap removes. The retained evidence keeps only paths relative to `<case>`, the character counts and hashes
of tool results, and the proposals, in the 2026-09-29 folder's shape. Nothing is written in `events-tracker` or under
`~/.claude/`.

## Phases

Single phase: one edit, one run set, one disposition.

### Phase 1 — Re-apply the C7 rule, run it alone, dispose of B-189
- **Goal:** `/esq:plan` stops naming unobserved Git state, as judged on 3 Tamialog runs with no regression elsewhere.
- **Files touched:** `plugin/skills/plan/SKILL.md`; `docs/preparation/2026-09-29-b189-alone-tamialog.md` and
  `docs/preparation/2026-09-29-b189-alone-tamialog/` (`inputs.json`, `prompt.txt`, `correction.diff`,
  `run-{1,2,3}/{proposal.md,messages.md,trace.json,metrics.json}`); `docs/BACKLOG.md`.
- **Tasks:**
  - Task 1.1: `plan: name a Git state only from observed command output (B-189)`. Run `git revert cc45e94`, rewording
    the commit subject to this one. Record the SHA-256 and `wc -w` of `SKILL.md` before and after; the after file must be
    byte-identical to `git show 44f5ff6:plugin/skills/plan/SKILL.md`, and `correction.diff` is
    `git diff HEAD~1 -- plugin/skills/plan/SKILL.md`.
  - Task 1.2 (execution, no commit): rebuild `/tmp/b189-alone-case` exactly as Task 1.3 of
    `docs/plans/2026-09-29-git-state-and-copy-fidelity.md` did. The blobs come from
    `docs/preparation/2026-09-25-b181-tamialog/inputs.json`, and all 437 SHA-256 must match, or the run stops before
    spending. `plugin/` comes from `git archive HEAD plugin`, with its hashes recorded. The prompt is the byte-identical
    `docs/preparation/2026-09-29-b181-variance/prompt.txt` (`d17732b6…`). Print the bound, then run the
    `docs/headless-trial.md` block 3 times concurrently, with `env -u ESQ_CODEX`, outside the sandbox, and a separate
    `RESULT_DIR` and config dir per run. Afterwards check that the case hashes are unchanged and that no
    `/tmp/esq-headless-auth.*` remains. Record the Claude Code version.
  - Task 1.3: `docs(preparation): B-189 alone — one run set and verdict`. Keep the runs in the variance folder's shape.
    The report is in French, like its siblings. It gives the protocol, the bound, the hashes and the diff. It includes:
    - a C1–C7 × run table (✅/❌, citing the proposal line);
    - a table comparing three columns: baseline (fix arm), the shared B-188/B-189 set, and this set;
    - the rule applied as written, and what the comparison says about the C1/C6 attribution;
    - the confounds: plugin commits since `538c7c8` other than this one, and any Claude Code version change.
  - Task 1.4 (only when the rule reverts): `revert: plan: name a Git state only from observed command output (B-189)`,
    via `git revert` of Task 1.1.
  - Task 1.5: `backlog: B-189 disposition`.
    - Target met: run `esq backlog set-status B-189 Done --by 2026-09-29-git-state-rule-alone --resolution "<report link, C7 n/3, no regression>"`.
    - Otherwise: leave B-189 Open.
    - Either way, add a dated note under B-189's `##` detail linking the report, with the pass counts.
- **Verification:**
  - `(auto)` `grep -c "branch not observed" plugin/skills/plan/SKILL.md` — 3 while Task 1.1 is kept (shipping-unit paragraph, Commit step 1, step 4's reason list); 0 (exit 1) when the rule reverted it; the count matches the report's verdict
  - `(auto)` `grep -c "preparation/2026-09-29-b189-alone-tamialog.md" docs/BACKLOG.md` — ≥ 1: B-189's detail note links the report
  - `(auto)` `./scripts/audit.sh` — PASS (it runs the product suites itself; no `node --test` beside it)

## Rollout
- If the edit is kept: once `main` carries it, publish with `./scripts/update.sh`.

## Risks
- **Pre-mortem: C1/C6 fall again.** Then the evidence points at C7 rather than at C5, the rule reverts, and B-189 is
  promised by two units with no fix. Landing `esq/git-state-and-copy-fidelity` would then need your disposition of
  B-189 (accept it as a known limit, or a shorter rewording as the next lever), not a third run of this text.
- **n = 3** separates 0/3 from 3/3, not 60 % from 80 %. A single 2/3 → 1/3 drop is within noise, and the rule still
  treats it as regression. That is the stop condition, not a statistical claim; the report says so.
- **Timeouts:** the last set ran 152–157 s against 180 s. Without the C5 words the proposals should be no longer, but
  a single timeout fails every criterion for that run and can trigger a revert by itself.
- **Case rebuild:** `events-tracker` must still hold the `33e750a1` blobs.
- **Landing chain:** this unit lands into `esq/git-state-and-copy-fidelity`, and that unit still owes B-188, which is
  planned separately.

## Open questions
None. The user asked for this run ("run alone"). The criteria, the rule and the bound are set above, inherited from
the plan the user already approved.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
