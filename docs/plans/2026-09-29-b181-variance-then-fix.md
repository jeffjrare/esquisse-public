# Settle B-181 on three runs per arm instead of one

**Branch:** esq/b181-variance-then-fix

**Origin:** esq/b181-closing-evidence

## Context
B-181 (carry the user's outcome from grill to plan without a re-grill) has had three bounded attempts, each judged on
**one** run: the invented invoice case (2026-09-24), the Tamialog before/after pair (2026-09-25) and the fidelity trial
(2026-09-29, `docs/preparation/2026-09-29-b181-fidelity.md`, withdrawn in `a5e1666`). Each verdict mixed the fix with
model variance, and the last one also mixed in 17 plugin versions and a Claude Code update, so nobody can say which
failure is reliable and which was noise. The drawer-notice misread happened again even though the guidance against it
(`plugin/skills/plan/references/screens-and-manual-steps.md:21`) was loaded. That argues against another in-investigation
rule. The prior brief said "no further run". On 2026-09-29 the user overrode that for this plan ("j'autorise la
dépense d'essayer") after being shown the loop. `/esq:land` of `b181-closing-evidence` is blocked on B-181 being promised and not delivered.

## Goal
A user whose grill brief says "replace X", "keep the notice in the drawer" or quotes copy gets a plan that honors it or
names the conflict, and B-181's status rests on a per-criterion pass rate over repeated runs, not on one sample.

## Done looks like
- The current plugin's reliability on each B-181 closing criterion is known from 3 runs on the identical Tamialog case,
  retained with proposals, normalized traces and metrics.
- If the baseline already meets the Done rule, B-181 is Done with no plugin change.
- Otherwise a fix aimed only at the criteria that fail reliably is tried on 3 runs. It is kept or withdrawn by a rule
  written before any run, and B-181 is Done or stays Open with the per-criterion table as the reason.
- Nothing in `plugin/` changes unless the fix is kept. `./scripts/audit.sh` PASS is recorded.

## Approaches considered
- **Baseline ×3, then a targeted fix ×3 (chosen).** The baseline separates reliable failures from noise, and may
  close B-181 outright. Both arms run on the same plugin source (except the fix), the same Claude Code version and the
  same day, which removes the confound that made the 2026-09-29 verdict unattributable. Cost: 6 runs, expected ~6 USD.
- **Another single-run fix trial.** Cheaper (~1 USD), but it repeats the method that produced three inconclusive
  verdicts. Rejected by the user's own complaint ("on tourne en rond").
- **A deterministic `esq brief items` extract checked against the plan.** Loses: the trial harness exposes only
  Read/Grep/Glob/Skill, so the model could not run it and the fix would be untestable on this case. A guard checking
  that brief strings appear in the plan would also be the prose-presence check CLAUDE.md rule 5 forbids.

## Recommendation
Two phases, with the decision rules fixed here, before spending:

- **Closing criteria** (from the 2026-09-29 brief and `docs/preparation/2026-09-25-b181-tamialog/judgment.md`, unchanged).
  C1: the quantity value is replaced, or the conflict is flagged. C2: the drawer notice is read from `QuickLogSheet`,
  not a modal. C3: no SPEC gate and no re-grill question. C4: Household comes after Steps and before Forecasting.
  C5: FR/EN copy is complete, including "powdered-formula". C6: one complete phase with build, landing tests and a
  `--no-build` audit. C7: no invented Git state. Judged by the reader, with no word-presence score.
- **Done rule:** every criterion holds in ≥ 2 of 3 runs of the arm being judged.
- **Reliable failure:** a criterion failing in ≥ 2 of 3 baseline runs. Only these get a fix.
- **Keep rule:** keep the fix only if every targeted criterion gains ≥ 1 run over baseline **and** no criterion loses
  ≥ 2 runs. Otherwise `git revert` it (precedents `8a4a2e6`, `a5e1666`).
- **Fix placement:** the owner is `/esq:plan` (`plugin/skills/plan/SKILL.md`, § "Right-size, then read it once"). Add
  one numbered item to the final read-back, the pass the model actually executes on its own output, rather than
  another investigation-time rule it already ignored. Scope it to the reliable failures only. Candidate wording for all
  three observed departures: *for a grill brief, each explicit instruction (replace, remove, reorder), each state the
  brief says exists, and each quoted copy string is honored as written, or the conflict is named in `## Risks`; saying a
  state the brief describes is absent requires the render lines that show it missing.* Trim it to the criteria that
  actually fail. The boundary not crossed: nothing is added to the CLI, the audit or the reference files.
- **Budget:** amounts are the CLI's list-price estimates; the user is on a Claude Code subscription, so a run consumes plan usage, not billed dollars, and `--max-budget-usd` acts as a usage cap. Each run is bounded at 3 USD / 180 s (the `docs/headless-trial.md` block). That gives ≤ 9 USD per phase and
  ≤ 18 USD in total, with ~1 USD/run expected (2026-09-29: 0.949 USD / 122 s). Print it before each phase's launch. No
  retry of a finished run; an infrastructure failure (auth, DNS) is diagnosed, and only that run is relaunched once.

## Security notes
The Tamialog inventory (437 files at `33e750a1`) goes to Anthropic again. The user authorized that for the B-181 trials
(2026-09-25) and extended it to this plan's runs on 2026-09-29. The credential is copied read-only into a `mktemp`
removed by trap. The retained evidence keeps only `<case>`-relative paths, character counts and hashes of tool
results, plus the proposals, as in the 2026-09-29 folder. Nothing is written in `events-tracker` or under `~/.claude/`.

## Phases

### Phase 1 — Baseline: 3 runs of the current plugin
- **Goal:** know, per criterion, what the unchanged plugin does reliably, and close B-181 if it already meets the Done rule.
- **Files touched:** `docs/preparation/2026-09-29-b181-variance.md`; `docs/preparation/2026-09-29-b181-variance/`
  (`inputs.json`, `prompt.txt`, `baseline-{1,2,3}/{proposal.md,messages.md,trace.json,metrics.json}`); `docs/BACKLOG.md`
  only if Done.
- **Tasks:**
  - Task 1.1 (execution, no commit): rebuild `/tmp/b181-variance-case` exactly as Task 1.2 of
    `docs/plans/2026-09-29-b181-closing-evidence.md` did. Write the blobs from
    `docs/preparation/2026-09-25-b181-tamialog/inputs.json`, get 437/437 SHA-256 matches or stop before spending, and
    copy `plugin/` from `git archive HEAD plugin` with its hashes. The prompt is the byte-identical `prompt.txt`
    (`d17732b6…`). Print the bound: **3 runs, ≤ 3 USD / 180 s each, ≤ 9 USD**. Run the `docs/headless-trial.md` block
    three times concurrently, with `env -u ESQ_CODEX`, outside the sandbox, and a separate `RESULT_DIR`
    (`/tmp/b181-variance-baseline-N`) and config dir for each run. Check the case hashes are unchanged afterwards.
  - Task 1.2: `docs(preparation): B-181 variance baseline — 3 runs`. Retain each run in the 2026-09-29 folder's shape.
    The report (French, like its siblings) gives the protocol, the bound printed before launch, hashes, and a
    criteria × run table (C1–C7, ✅/❌ with the proposal line cited). It adds pass counts, the list of reliable failures,
    and words/tool calls/output tokens/time/cost as reported, not gating. It names the limits: 3 runs; this case only.
  - Task 1.3 (only if the Done rule holds): `backlog: B-181 Done on the variance baseline`. Run
    `esq backlog set-status B-181 Done --by 2026-09-29-b181-variance-then-fix --resolution "<pass counts, evidence link>"`
    and add a dated detail note under `## B-181` linking `preparation/2026-09-29-b181-variance.md`.
- **Verification:**
  - `(auto)` `test -s docs/preparation/2026-09-29-b181-variance.md` — the variance report exists (Phase 2 extends it)

### Phase 2 — Targeted fix: 3 runs, keep or withdraw, disposition
- **Goal:** fix only what fails reliably, judge it on the same case and conditions, and record B-181's disposition.
- **Skip condition:** if Task 1.3 recorded B-181 Done, this phase makes no plugin change and no run. It runs only the
  final audit and logs the skip, citing Task 1.3's commit.
- **Files touched:** `plugin/skills/plan/SKILL.md`; `docs/preparation/2026-09-29-b181-variance.md` and
  `.../2026-09-29-b181-variance/{correction.diff,correction.json,fix-{1,2,3}/…}`; `docs/BACKLOG.md`.
- **Tasks:**
  - Task 2.1: `plan: read the plan back against the brief's explicit instructions`. Add one numbered item to § "Right-size,
    then read it once", covering only Phase 1's reliable failures (candidate wording in the Recommendation). Add no
    checklist, role or reference file. Record the before/after SHA-256 and `wc -w`.
  - Task 2.2 (execution, no commit): recopy only `plugin/` into the case from `git archive HEAD plugin`, recording its
    hashes and re-checking the 437 sources. Print the bound: **3 runs, ≤ 9 USD**. Launch exactly like Task 1.1 with
    `RESULT_DIR=/tmp/b181-variance-fix-N`, then check the case hashes.
  - Task 2.3: `docs(preparation): B-181 variance — fix arm and verdict`. Retain `fix-{1,2,3}/`, the diff and its hashes.
    Extend the report with the fix arm's C1–C7 table, a baseline vs fix pass-count table, and the keep-rule verdict
    applied as written above.
  - Task 2.4 (only when the keep rule fails): `revert: withdraw brief read-back (B-181 variance verdict)`, a `git revert`
    of Task 2.1.
  - Task 2.5: `backlog: B-181 disposition from the variance trial`. Run `esq backlog set-status B-181 Done --by …` when
    the kept fix meets the Done rule, otherwise `esq backlog set-status B-181 Open`. Add a dated note linking the
    report, with the pass counts, which criteria stay unreliable, and whether the fix was kept.
- **Verification:**
  - `(auto)` `grep -c "preparation/2026-09-29-b181-variance.md" docs/BACKLOG.md` — the B-181 detail note links the report (count ≥ 1)
  - `(auto)` `git diff main -- plugin/skills/plan/SKILL.md` — shows only the Task 2.1 item when the fix is kept, is empty when it was withdrawn or skipped, and matches the verdict in the report
  - `(auto)` `./scripts/audit.sh` — PASS (runs the product suites itself; no `node --test` beside it; `ESQ_TELEMETRY` not inherited from the launcher)

## Rollout
- If Phase 2 kept the fix: publish it with `./scripts/update.sh` once `main` carries it.

## Risks
- **Pre-mortem:** the baseline shows C2 or C5 failing 1 of 3 and C1 failing 3 of 3. The fix then lifts C1 while one
  retained gain drops by one run. The keep rule accepts that trade (it withdraws only on a loss of ≥ 2), and the Done
  rule still judges every criterion. The report says which criterion stays fragile rather than calling it solved.
- **Three runs is a small sample:** it separates 0/3 from 3/3, not 60 % from 80 %. The report says so. The rules
  above are the user's stop condition, not a statistical claim.
- **Concurrent runs** may hit a rate limit. A run that fails on infrastructure is relaunched once, on its own, and
  reported. A run that finished is never rerun.
- **Stacked unit:** this branch is cut from `esq/b181-closing-evidence`, so it lands into that branch first. If B-181
  still ends Open, `/esq:land` keeps refusing both units, because B-181 stays promised and undelivered. The next step
  is then yours: drop or re-scope B-181 through `/esq:backlog`. Those runs are the last this plan authorizes.
- **Case rebuild:** `events-tracker` must still hold the `33e750a1` blobs. A missing blob stops the run before any spend.

## Open questions
None. The user authorized the spending on 2026-09-29. The criteria, rules and bounds are fixed above.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-09-29

**Plan committed at:** 62eb89b

**Commits:** 23eb35f

**Verified:** 23eb35f5c8294203d3dfc49abe394acb90222bd3
- `test -s docs/preparation/2026-09-29-b181-variance.md`

**What got built:** The variance baseline (3 runs of the unchanged plugin on the Tamialog case) is retained under docs/preparation/2026-09-29-b181-variance/ with its French report and C1–C7 × run table. Reliable failures: C1, C5, C6 (0/3 each). Done rule not met, B-181 stays Open.

**Verification:**
- (auto) test -s docs/preparation/2026-09-29-b181-variance.md — PASS

**Surprises / decisions made during execution:** - Run 1 was killed at 180 s (exit 137) with no proposal. Diagnosed as not infrastructure: all rate_limit_event allowed, no auth/DNS error, 54 tool calls and still investigating. Per the plan's relaunch rule (infrastructure only), it was not relaunched and counts as delivering nothing (fails every criterion). The report also gives the 2-delivered-run view (C1/C5/C6 0/2, others 2/2), which reaches the same verdict.
- C6 fails because both delivered runs call `node landing/scripts/audit.mjs` without `--no-build` after `pnpm -r build`. That criterion comes from judgment.md, not the brief, which never names `--no-build`.
- C2 (the drawer-notice regression that led to withdrawing a5e1666) holds 2/2 on delivered runs, so that regression looks like noise. C5 fails 2/2, so it is a reliable failure, not noise.
- Task 1.3 was skipped (Done rule not met). Reported cost: 1.86 USD for runs 2 and 3; run 1 unknown (≤ 3 USD cap). Wall-clock was 180 s for the concurrent batch.
- The case /tmp/b181-variance-case (484 files, unchanged) is kept for Task 2.2. Raw results were deleted after normalization, and no /tmp/esq-headless-auth.* remains.

**Backlog candidates:** None.

**For Phase 2:** 1. The case /tmp/b181-variance-case is still built (437 sources, plugin at 62eb89b). Task 2.2 recopies only plugin/ after removing the old one, then re-checks the 437 sources; the normalizer shape is in the report (trace/metrics/messages/proposal per run).
2. The reliable failures are C1 (chips added beside a kept `1 comprimé`, no conflict named), C5 (EN drops "powdered") and C6 (audit without `--no-build`). The Recommendation's candidate wording covers C1 and C5 (explicit replace + quoted copy). It does not cover C6, which is not a brief instruction. Scoping the fix to C6 too means wording about reusing an existing build (a verification-economy point), which the plan did not draft: decide it inside Task 2.1's one-item bound or leave C6 targeted-but-unfixed and say so in the report.
3. The keep rule needs every targeted criterion to gain ≥ 1 run over the baseline (0/3 here), and a timeout run counts as failing everything. One timeout in the fix arm therefore costs a run on every criterion; judge it as written.
