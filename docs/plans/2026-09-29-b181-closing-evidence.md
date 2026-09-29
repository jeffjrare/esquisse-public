# Close B-181 with a brief-fidelity fix and one paid Tamialog trial

**Branch:** esq/b181-closing-evidence

**Origin:** main

**Reviewed at:** 3ee7602449890e2b8668b89ccb80f5842a6627d9

## Context
B-181 (carry the user's outcome from grill to plan without a re-grill) stays Open: the retained Tamialog "after"
proposal (`docs/preparation/2026-09-25-b181-tamialog/after-proposal.md`, fix `7a79ffa`) restored the drawer notice and
dropped the SPEC gate, but kept the fixed « 1 comprimé » field (line 46) that the brief explicitly asked to replace,
overriding it in silence on a "fidelity to the real form" ground. `/esq:plan`'s grill-brief paragraph
(`plugin/skills/plan/SKILL.md:80`) says not to re-litigate *decisions*, but says nothing about an explicit *instruction*
the repo seems to contradict. Grill brief `docs/plans/2026-09-29-b181-closing-evidence.brief.md`; the user chose (2026-09-29)
fix + **one** paid trial over closing without a run.

## Goal
A user whose brief says "replace X" gets a plan that replaces X or names the conflict, and B-181's status is settled by
one inspectable run on the same Tamialog case, not by assertion.

## Done looks like
- The plan fix is committed, and its diff and word delta are in the evidence file.
- `docs/preparation/2026-09-29-b181-fidelity.md` exists with the protocol, the before-launch bound, source hashes, the
  proposal kept whole, a normalized trace, metrics, and an after-arm vs new-run table on each closing criterion plus
  words/time/cost (reported, not gating).
- B-181 is either Done, with a note citing the run and its limits, or still Open with the reason. When a regression
  occurred, the fix is withdrawn and the diff is empty against the pre-unit source.
- `./scripts/audit.sh` PASS is recorded.

## Approaches considered
- **Entrypoint only (chosen).** Extend the grill-brief paragraph at `SKILL.md:80`, which every brief-consuming run
  loads: an explicit brief instruction outranks a repo-derived consistency preference; a real conflict goes to the plan's
  `## Risks`/`## Open questions`, never resolved silently. ~40 words, no new section. The defect is not UI-specific (a
  brief can say "remove the endpoint" too), so it belongs where brief handling lives.
- **Also in `references/screens-and-manual-steps.md`.** Loses: duplicates the rule, and the reference only loads for UI
  phases; the entrypoint already reaches the failing case (the 2026-09-25 trace shows the skill loaded).

Trial harness: reuse `docs/headless-trial.md`'s bash block verbatim (the recipe the B-182 retry proved), plus
`-u ESQ_CODEX` in its `env`. No new script in the repo: the instrument lives in the scratchpad and `/tmp`, per CLAUDE.md
(no research instrument in the product path).

## Recommendation
Single phase: fix → rebuild and verify the case → one bounded trial → evidence → disposition (and withdrawal if it
regressed) → one final audit. The audit comes **last**, not before the trial: a prose edit cannot break plugin structure,
and running it before would buy it twice whenever the fix is withdrawn. The judgment is the build model's reading against
the brief's closing criterion and `docs/preparation/2026-09-25-b181-tamialog/judgment.md` — no word-presence score.

## Security notes
The trial sends the 437-file Tamialog inventory and the plugin to Anthropic; the user authorized that inventory
(B-181 § Protocole, 2026-09-25) and this brief extends it to this single run. Credentials are copied read-only from
`~/.claude/.credentials.json` into a `mktemp` dir removed by the recipe's trap; nothing is written under `~/.claude/` or in
`events-tracker`. The model gets Read/Grep/Glob/Skill only, `--restricted` to the case. Retained evidence keeps no
credential, no raw source content from Tamialog beyond the proposal, and `<case>`-normalized paths.

## Phases

Single-phase plan.

### Phase 1 — Fix, one trial, evidence, disposition
- **Goal:** the brief-fidelity rule ships (or is withdrawn on regression), and B-181's status follows one inspectable run.
- **Files touched:** `plugin/skills/plan/SKILL.md`; `docs/preparation/2026-09-29-b181-fidelity.md` and
  `docs/preparation/2026-09-29-b181-fidelity/` (`inputs.json`, `prompt.txt` copy, `correction.diff`, `correction.json`,
  `proposal.md`, `messages.md`, `trace.json`, `metrics.json`); `docs/BACKLOG.md` (B-181 status + detail note).
- **Tasks:**
  - Task 1.1: `plan: an explicit brief instruction outranks a repo-derived consistency preference` — in the grill-brief
    paragraph (`SKILL.md:80`), after "Don't re-litigate them", add one or two sentences: an explicit instruction in the
    brief (replace, remove, reorder) outranks a consistency preference derived from the repo; when the repo makes it a
    real conflict, the plan says so in `## Risks` or `## Open questions` and never keeps the replaced element silently.
    Replace/extend existing prose, no checklist, no role, no new test. Record before/after SHA-256 and `wc -w`.
  - Task 1.2 (no commit — execution): rebuild the case and run the trial.
    1. Case under `/tmp/b181-fidelity-case`: for each entry of `docs/preparation/2026-09-25-b181-tamialog/inputs.json`
       `.sources`, write `git -C ~/projects/events-tracker cat-file blob <git_blob>` to its path; check every SHA-256
       (437/437) and stop on any mismatch. Copy `plugin/` from `git archive HEAD plugin` (the Task 1.1 commit), no
       `.git`; record each plugin file's SHA-256. Verify the case holds no `judgment.md`, final plan, later decisions or
       B-076 captures (they are not in the selection; confirm, don't assume).
    2. Prompt: `docs/preparation/2026-09-25-b181-tamialog/prompt.txt`, byte-identical (record its SHA-256).
    3. Print the bound before launch — **one call, ≤ 3 USD / 180 s, Opus/medium** — then run the `docs/headless-trial.md`
       block with `CASE_DIR=/tmp/b181-fidelity-case`, `RESULT_DIR=/tmp/b181-fidelity-result`, `env -u ESQ_CODEX` added,
       **outside the sandbox** (brief's resolved decision; B-182 DNS diagnosis). No retry, no second arm. An
       infrastructure failure (auth, DNS) is diagnosed and reported, and B-181 stays Open pending a new authorization.
    4. Check the case's hashes are unchanged after the run.
  - Task 1.3: `docs(preparation): B-181 fidelity trial — evidence and comparison` — write the folder in the shape of
    `docs/preparation/2026-09-25-b181-tamialog/` (trace normalized like `after-trace.json`: tool name, `<case>`-relative
    input, result characters/SHA-256/is_error; metrics like `after-metrics.json`), the proposal kept whole, and the
    report `2026-09-29-b181-fidelity.md` (French, like its siblings): protocol, bound printed before launch, hashes,
    fix diff and word delta, and a table after-arm vs new run on each closing criterion — quantity field replaced or
    conflict flagged; drawer notice read from `QuickLogSheet`; no SPEC gate/re-grill question; Household after Steps,
    before Forecasting; FR/EN copy complete incl. "powdered-formula"; one complete phase with build, landing tests and
    `--no-build` audit; no invented Git state — then words/tool calls/output tokens/time/cost as reported, not gating.
    Name the limits: plugin is current source + fix (all plan changes since `f6f6278`, incl. the `ESQ_CODEX`-gated
    adversary, are in the comparison); Claude Code now 2.1.284 vs 2.1.282; one run, no variance estimate.
  - Task 1.4 (only on a regression of a retained gain): `revert: withdraw brief-fidelity fix (B-181 trial regressed)` —
    `git revert` Task 1.1, per the B-182 precedent (`8a4a2e6`).
  - Task 1.5: `backlog: B-181 disposition from the fidelity trial` — `esq backlog set-status B-181 Done` when the closing
    criterion holds; otherwise `esq backlog set-status B-181 Open`. Append a dated detail note under `## B-181` linking
    `preparation/2026-09-29-b181-fidelity.md`, with the verdict, the limits and, on failure, the reason and whether the fix
    was kept (field unfixed, no regression) or withdrawn (regression). No further run either way.
- **Verification:**
  - `(auto)` `test -s docs/preparation/2026-09-29-b181-fidelity.md` — the evidence report exists
  - `(auto)` `grep -c "preparation/2026-09-29-b181-fidelity.md" docs/BACKLOG.md` — the B-181 detail note links the evidence (count ≥ 1)
  - `(auto)` `git diff main -- plugin/skills/plan/SKILL.md` — shows only the Task 1.1 sentences when the fix is kept, or is empty when it was withdrawn, matching the disposition in the evidence file
  - `(auto)` `./scripts/audit.sh` — PASS (runs the product suites itself; no `node --test` beside it; `ESQ_TELEMETRY` must not be inherited from the trial launcher, the 2026-09-25 lesson)

## Risks
- **Pre-mortem:** the rule ships but the run still keeps « 1 comprimé » — the model reads "fidelity to the real form" as
  a *real* conflict and still doesn't flag it. Answer: the rule's wording names both outcomes (replace, or flag in
  Risks/Open questions); an unflagged override stays a failure, recorded, fix kept if nothing regressed.
- **Confounded comparison:** the plugin has changed since `f6f6278` beyond this fix; a regression may come from those
  changes, not the fix. The brief's rule still withdraws the fix on regression; the evidence must say the attribution is
  uncertain.
- **Landing re-runs `(auto)` steps:** the trial is deliberately not a verification step — it is paid and never rerun.
- **Case rebuild:** `events-tracker` must still hold the 33e750a1 blobs; a missing blob stops the run before any spend.
- **Credentials:** an expired credential copy fails at startup at zero cost (B-182 precedent); report it, no relaunch
  without authorization.
- **One-sample verdict:** a single run can pass or fail by variance; the evidence says so, and the brief forbids a retry.

## Open questions
None — scope, bound, protocol, closing criterion and failure handling are settled in the brief.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-09-29

**Plan committed at:** 2eb54d6

**Commits:** 5031a4a, 554a79b, a5e1666, cc67a60

**Verified:** cc67a6042235f19dbce9ff0203f2c01087eae2ee
- `test -s docs/preparation/2026-09-29-b181-fidelity.md`
- `grep -c "preparation/2026-09-29-b181-fidelity.md" docs/BACKLOG.md`
- `git diff main -- plugin/skills/plan/SKILL.md`
- `./scripts/audit.sh`

**What got built:** The brief-fidelity rule was committed, tried on one authorized Tamialog run (122 s, reported $0.9493406), and withdrawn because two retained gains regressed. docs/preparation/2026-09-29-b181-fidelity.md and its folder hold the protocol, hashes, the whole proposal, the normalized trace, metrics and the comparison. B-181 is back to Open, with a detail note.

**Verification:**
- (auto) test -s docs/preparation/2026-09-29-b181-fidelity.md — PASS
- (auto) grep -c "preparation/2026-09-29-b181-fidelity.md" docs/BACKLOG.md — 1 (≥ 1) PASS
- (auto) git diff main -- plugin/skills/plan/SKILL.md — empty (0 bytes; SHA-256 back to 4cd1d43e…), matching the withdrawal recorded in the evidence file — PASS
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), 27 s, ESQ_TELEMETRY unset — PASS

**Surprises / decisions made during execution:** - Trial verdict: the quantity field is still not clearly replaced (fieldValue kept, chips added) and no conflict is flagged. Regressions against the after-arm: the drawer notice is again claimed absent and replaced by the spacing-confirm modal, although screens-and-manual-steps.md was loaded; the EN copy loses 'powdered'. Held: no SPEC gate, the order, one phase with --no-build, no invented Git state. The rule did fire once: the model openly named the brief-vs-app wording gap for the notice, but on a false reading. Attribution is uncertain (plugin 0.3.48 → 0.3.65, Claude Code 2.1.282 → 2.1.284, one run).
- Task 1.4 ran (git revert, amended message), per the brief's regression rule.
- `esq backlog set-status` accepts --by only with Done/Planned and --reason only with Dropped, so the Open flip carries no reason; the why is in the detail note.
- The case rebuilt 437/437 from events-tracker blobs; 484 files, unchanged after the run; case and raw results deleted after sanitizing, and no auth temp dir left.

**Backlog candidates:** None.

**For Phase 2:** Last phase. B-181 stays Open with no further authorized run. The brief-fidelity defect and the drawer-notice regression are both inspectable in docs/preparation/2026-09-29-b181-fidelity.md.
