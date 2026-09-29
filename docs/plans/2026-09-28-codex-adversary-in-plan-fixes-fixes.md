# Make the Codex plan probe prove the stop and plan a task it cannot skip

**Branch:** esq/codex-adversary-in-plan

**Origin:** main

## Context
Corrective plan (second generation, `esq brief depth` → `open`, 2/2) for `/esq:review` findings on
`codex-adversary-in-plan-fixes` (brief `docs/plans/2026-09-28-codex-adversary-in-plan-fixes-fixes.brief.md`, B-187).
`scripts/probe-codex-plan.sh` has two defects. Assertion 5 (`:185`) only checks that no counter-plan process survives
`claude -p`. An exiting headless host can reap its background tasks itself, so an edit to `codex-adversary.md:61` that
drops "stop its background task" still passes 5/5. The probe's one-line task (`:46`, `--version` flag) now lets
`/esq:plan` take its small-task exit (`plugin/skills/plan/SKILL.md:102`): the 2026-09-28 re-run ended 0/5 in 12 s with
no plan and no Codex call. Nothing about the skill changes. The probe is the instrument that guards it.

## Goal
The maintainer re-runs one command after an edit to `codex-adversary.md` and gets a verdict that goes red when the
skill stops calling `TaskStop` on a late counter-plan. The target is one `/esq:plan` cannot dismiss as too small. There
is no user-facing change. The probe protects interactive `ESQ_CODEX=on` users from a late counter-plan that keeps
spending Codex tokens until its `timeout`.

## Done looks like
- The probe's assertion 5 FAILs with `the skill never called TaskStop` when the run's `stream.jsonl` has no `assistant`
  `tool_use` named `TaskStop`, whether or not a process was left behind. It still FAILs on a leftover process.
- The probe's task is a multi-file feature that `/esq:plan` plans rather than waving off, and one recorded run goes 5/5
  green with assertion 5 naming the `TaskStop` call.

## Approaches considered
- **A — a multi-file, unambiguous feature as the probe task (chosen).** Replace `TASK` with work that spans a new
  module, the CLI entry and a test file, and pin every choice it would otherwise ask about. Example: storage file name,
  command names, test runner. The small-task exit ("a one-line fix, a trivial rename") then has no ground, and the
  ambiguity stop (there is no `AskUserQuestion` in `-p`) has none either. Cost: a longer investigation, so the run cost
  goes from about 0.44 USD to an expected 1 to 2 USD, still under the printed 5 USD bound.
- **B — drive the probe from a grill brief seeded in the scratch repo.** `/esq:plan <brief>` inherits settled scope.
  But the small-task sentence still applies to brief input, and it adds a fixture file shaped like a real brief that
  drifts whenever the grill brief shape changes. It is more to maintain without removing the cause.
- Rejected: telling the skill in the prompt not to take the small-task exit. The probe would then test a prompt a real
  user never writes.

## Recommendation
A. The probe stays a research instrument. It is not wired into `audit.sh`, `--lab` or any skill, and it never gates
(CLAUDE.md rule 1). Bound, unchanged and printed before launch: one headless call, `--max-budget-usd 5`, KILL at
1200 s, `ESQ_CODEX_EFFORT=low`, no retry. The `TaskStop` check follows the brief's own fix and pins the property to the
skill's own action rather than the host's teardown. It checks that a call exists, not which task id it targeted. The
skill runs no other background task in a plan run, so a stricter id match would add parsing without catching anything
more.

## Phases

Single phase: both probe fixes, then one run.

### Phase 1 — Probe asserts the skill's TaskStop on a plan-worthy task
- **Goal:** one green probe run where assertion 5 names the `TaskStop` call, on a task `/esq:plan` plans.
- **Files touched:** `scripts/probe-codex-plan.sh`, and `plugin/skills/plan/references/codex-adversary.md` or
  `plugin/skills/plan/SKILL.md` only if the run exposes a skill defect.
- **Tasks:**
  - Task 1.1: `fix(scripts): make probe-codex-plan assert the skill's TaskStop and plan a multi-file task`. The script
    is one file and the two defects make one failure between them (a red run hides the TaskStop check), so they share
    one commit:
    - Extend the node block (`:168`) to print a third line, `yes`/`no`, for whether any `type: "assistant"` message's
      `message.content[]` has an entry with `type: "tool_use"` and `name: "TaskStop"`.
    - Assertion 5 FAILs `the skill never called TaskStop` when that line is not `yes`. It keeps the existing
      leftover-process FAIL. PASS reads `5 skill called TaskStop, no counter-plan process left behind`.
    - Replace `TASK` with a multi-file feature on the scratch CLI, all choices pinned. Example: *"Add a todo command
      set to cli.js — `todo add <text>`, `todo list`, `todo done <n>` — in a new lib/todo.js that stores items in
      .todo.json in the current directory, rejects a missing or non-numeric <n> with exit 1, treats a missing file as
      empty and a corrupt one as an error with exit 1, and add node:test tests in test/todo.test.js covering each
      command and those error cases."* Update the header comment's list of assertions (`:19`) to match.
    - Before any spend, do the zero-cost dry run the first build used: a fake `claude` on `PATH` writes a synthetic
      `stream.jsonl` with no `TaskStop`. Assertion 5 must FAIL with `the skill never called TaskStop`, which is the
      counterexample the old check passed. Record it in the execution log.
  - Task 1.2 (only if the run fails an assertion for a skill defect, one commit per defect): `fix(plan): <defect>` in
    `codex-adversary.md` or `SKILL.md`. A failure the probe causes is fixed in the script as its own commit. Re-run at
    most twice in total, then stop and report the failing assertion with its evidence.
- **Verification:**
  - `(auto)` `bash -n scripts/probe-codex-plan.sh` — the edited probe parses
  - `(auto)` `scripts/probe-codex-plan.sh` — exits 0 with five `PASS` lines, assertion 5 naming the `TaskStop` call.
    Launch it with the Bash tool's `run_in_background: true`, outside the sandbox (provider network, per
    `docs/headless-trial.md`). The execution log records elapsed seconds, cost and the scratch commit body's
    `Adversary` block verbatim.
  - `(auto)` `./scripts/audit.sh` — PASS: product checks and suites unaffected

## Risks
- **Pre-mortem:** even the larger task is waved off, or the skill stops on an ambiguity with no question tool, and the
  run is red for a reason unrelated to Codex. Answer: every choice is pinned in the task text. A stop shows up as
  assertion 3's `last commit 'init'`, is diagnosed from the kept stream and fixed in the task text, and counts against
  the two re-runs.
- One green run does not prove the target is stable across runs, because model behavior varies. The fix removes the
  observed cause (a one-line task). A future red caused by a skip is still visible, not silent.
- The headless host may reap the background task before the skill's `TaskStop` runs, and the skill may then skip the
  call. That is exactly the case the new check turns red. If it happens, the interactive stop path is unproved and is
  reported as such, not papered over.
- The longer investigation raises the per-run cost. The 5 USD cap and the 1200 s KILL still bound it.

## Open questions
None. The brief's one design choice (the probe target) is an engineering call within the probe's mandate, settled
above. There is no 🔴 item and no 🟢 item left for `/esq:fix`.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
