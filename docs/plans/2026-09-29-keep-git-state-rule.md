# Keep the observed-Git-state rule in /esq:plan (B-189)

**Branch:** esq/keep-git-state-rule

**Origin:** esq/git-state-rule-alone

**Reviewed at:** 02b249f236c18176d7ebade37c5ea9848fab8f72

## Context
The rule "a Git state is named only from the output of a command that ran; otherwise *branch not observed*"
(`44f5ff6`) held C7 in 6 of 6 runs across two run sets. Without it, C7 held 1/3 (reports
`docs/preparation/2026-09-29-b188-b189-tamialog.md` and `docs/preparation/2026-09-29-b189-alone-tamialog.md`). Both sets
reverted it under the pre-written rule, because C6 fell to 1/3 (baseline 2/3). But C6 fails the same way with or
without the rule: the plan builds, then runs the audit without `--no-build`. The user delegated the call on
2026-09-29, and the call is to keep the rule and accept C6 at 1/3. B-189 is promised by the two unlanded units above
this one. Landing here closes it, which unblocks `esq/git-state-rule-alone` and then `esq/git-state-and-copy-fidelity`.
That last unit still owes B-188.

## Goal
A person reading a `/esq:plan` output from a shell-less or read-only run is never told a Git state nobody observed.
The run says "branch not observed" and names no state and no consequence of one.

## Done looks like
- `plugin/skills/plan/SKILL.md` carries the observed-Git-state rule exactly as `44f5ff6` wrote it, in the shipping-unit
  paragraph, Commit step 1 and step 4's reason list, and nothing else in the file changes.
- No new run set is spent. The two retained sets are the evidence, and C6 at 1/3 is recorded as accepted, not as fixed.
- B-189 is Done, with its resolution citing both reports and the acceptance.
- `./scripts/audit.sh` PASS is recorded.

## Approaches considered
- **Re-apply `44f5ff6` verbatim, with no run set (chosen).** This is the exact text the two sets judged: 6/6 on C7, and
  C1 back to 2/3 once the translation clause was removed. It costs ~95 words per `/esq:plan` load and no further
  trial spend.
- **A third run set before keeping it.** Rejected by the user's delegated decision. At n = 3, one more set cannot tell
  a one-run C6 swing from noise either, so it would buy ~3.6 USD of list-price usage and no answer.

## Recommendation
`git revert 2520048` re-applies `32404b4` (byte-identical to `44f5ff6`) in `plugin/skills/plan/SKILL.md`, which owns
this wording. Nothing changes in the CLI, the audit or the references. The keep-despite-C6 call is recorded as
`D-keep-git-state-rule-despite-c6` (Fondement: user, delegated 2026-09-29). A later run set that sees C6 drop must
not read that drop as new evidence against this rule. C6 is its own open fragility, and it is tracked nowhere yet
because no plan has taken it on.

## Phases

Single phase: one edit, verified by grep, identity and audit.

### Phase 1 — Re-apply the rule and keep it
- **Goal:** `/esq:plan` ships the observed-Git-state rule, and B-189 is closed on the recorded evidence.
- **Files touched:** `plugin/skills/plan/SKILL.md`.
- **Tasks:**
  - Task 1.1: `plan: name a Git state only from observed command output (B-189)`. Run `git revert 2520048`, rewording
    the subject to this one and citing `D-keep-git-state-rule-despite-c6` in the body.
- **Verification:**
  - `(auto)` `git diff --quiet 44f5ff6 -- plugin/skills/plan/SKILL.md` — exit 0: the file is byte-identical to the judged text of `44f5ff6`
  - `(auto)` `grep -c "branch not observed" plugin/skills/plan/SKILL.md` — 3 (shipping-unit paragraph, Commit step 1, step 4's reason list)
  - `(auto)` `./scripts/audit.sh` — PASS (it runs the product suites itself; no `node --test` beside it)

## Rollout
- Once `main` carries it, publish with `./scripts/update.sh`.

## Risks
- **Pre-mortem: C6 keeps failing, and someone blames this rule.** The decision entry records that C6 fails the same
  way without the rule, so a future C6 fix is judged on its own.
- **Landing chain:** this unit lands into `esq/git-state-rule-alone`. That unit lands into
  `esq/git-state-and-copy-fidelity`, which still owes B-188 before it can reach `main`.
- **B-189 closure** is the closing step of `/esq:build`'s last phase (a `Planned by` row). Its resolution must cite
  both reports and the acceptance, not a new measurement.

## Open questions
None. The user delegated the keep/revert call on 2026-09-29.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-09-29

**Plan committed at:** abcab7b

**Commits:** 5d4c995

**Verified:** 5d4c9957b2de22824ac2c827ca4a2f44a885b827
- `git diff --quiet 44f5ff6 -- plugin/skills/plan/SKILL.md`
- `grep -c "branch not observed" plugin/skills/plan/SKILL.md`
- `./scripts/audit.sh`

**What got built:** plugin/skills/plan/SKILL.md carries the observed-Git-state rule again (revert of 2520048, byte-identical to 44f5ff6): a Git state is named only from command output that ran, otherwise "branch not observed".

**Verification:**
- (auto) git diff --quiet 44f5ff6 -- plugin/skills/plan/SKILL.md — exit 0, byte-identical
- (auto) grep -c "branch not observed" plugin/skills/plan/SKILL.md — 3
- (auto) ./scripts/audit.sh — exit 0, Clean — 7 checks (product), 27 s

**Surprises / decisions made during execution:** D-keep-git-state-rule-despite-c6 already existed in docs/DECISIONS.md when the phase ran, so no registry entry was written. No run set was spent.

**Backlog candidates:** None.

**For Phase 2:** Last phase. B-189 closes on this entry; the unit lands into esq/git-state-rule-alone.
