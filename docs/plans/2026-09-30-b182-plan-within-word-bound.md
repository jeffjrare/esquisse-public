# Fit /esq:plan's proposal inside a stated word bound without losing brief fidelity (B-182)

**Branch:** esq/b182-plan-within-word-bound

**Origin:** main

**Reviewed at:** 733d4585f3758528839768ecf58d3ffd54b6bba5

## Context
On the retained Tamialog case (brief `2026-09-24-vitrine-fonctions-recentes-multi-membre`, 437 sources at
`events-tracker` `33e750a1`), the prompt caps the proposal at 900 words. Every retained run overran it. The shipped
fidelity baseline is the B-189-alone set (`docs/preparation/2026-09-29-b189-alone-tamialog.md`, same text as the
shipped rule, `5d4c995`). It measured 1,305 / 1,219 / 1,307 words (`wc -w`) and scored C1 2/3, C2 3/3, C3 3/3,
C4 3/3, C5 2/3 (1/3 literal), C6 1/3 and C7 3/3. The overrun has a clear source. Per-section counts on those three
proposals show the FR/EN copy (340–400 words, which the brief requires) next to a separate "verified in the code"
inventory (163–192), a layout section (138–217) and a verification section (138–159). The inventory restates facts
that are cited again where they are used. `plugin/skills/plan/SKILL.md` § Style says "state each fact once" but says
nothing about a length bound the caller sets. Four earlier B-182 attempts cut source length or split the skill. None
reached the cap, and one lost fidelity (see B-182's notes). B-190 now lets a run-set verdict be applied under mandate
(`D-a-measurement-verdict-is-settled-under-mandate`).

## Goal
A person who caps `/esq:plan`'s answer (a proposal, a read-only preparation) gets one that fits the cap and keeps
everything the brief asked for: its replacements, its quoted copy, its order and a complete, non-duplicated
verification.

## Done looks like
- On one bounded set of 3 Tamialog runs with the edited skill, at least 2 of 3 proposals are ≤ 900 words (`wc -w`),
  and no C1–C7 criterion shows an attributable loss against the baseline above.
- The verdict below was stated before spending and applied as written. B-182 is dispositioned by it, not by a user
  question.
- The report sits beside its siblings in `docs/preparation/`, with its runs inspectable.

## Approaches considered
- **One conditional budgeting rule in § Style (chosen).** When the invocation bounds the response length, the bound
  becomes a requirement, met by budgeting rather than end-trimming. Protected content is placed first: the brief's
  replace/remove instructions or the named conflict, its quoted copy in every language written, acceptance, and each
  verification command with its property. The rest shares what is left. A verified fact is marked by its `path:line`
  where it is used, never in a separate inventory. This targets the measured surplus, the inventory and restated
  rationale, and it protects the content C1, C5 and C6 read. It costs about 80 words on every `/esq:plan` load. It
  changes nothing in a plan run with no stated bound.
- **Shorten the skill source further.** It was tried on 2026-09-25 (4,874 → 3,365 words of input): the output stayed
  at 1,217 words, and the attempt lost "powdered" and the UI-reference load. Input length did not drive output
  length.
- **A deterministic length check.** In this setting the model has no shell (Read/Grep/Glob/Skill), and a real plan
  file has no stated cap. A check would guard nothing on the path that overruns.

## Recommendation
Add the budgeting rule to `plugin/skills/plan/SKILL.md` § "Style for the plan content", the paragraph that already
owns "state each fact once". Nothing changes in the CLI, the references or the audit. Then run one set in the same
shape as the B-189-alone set.

**Verdict, stated before spending** (`D-a-measurement-verdict-is-settled-under-mandate`):
- **Target:** ≥ 2/3 proposals ≤ 900 words by `wc -w`, which is the baseline's method.
- **No loss:** each Cᵢ holds at least its baseline count, read as the baseline report reads it (C5 is read on
  "powdered" kept). A fall is a regression **only when the edit can cause it.** The failing text must lose content the
  rule governs: a replacement or conflict note, a qualifier or copy line, an acceptance line, a verification step or
  its `--no-build`, or a `path:line` citation that C2 needs. A fall is not attributable when it repeats a baseline
  failure mode through a mechanism this edit does not touch. Examples: C6 as "build, then audit without `--no-build`"
  with the step present (fragility accepted in `D-keep-git-state-rule-despite-c6`), C2 as "modal instead of drawer",
  C7. Such a fall is reported and never reverts. A timeout fails every criterion and the target for that run. It is
  attributable only when the trace shows time spent on the length rule itself.
- **Outcomes:**
  1. Target met, no attributable regression → keep; B-182 **Done**.
  2. Target missed, no attributable regression, median words ≤ 1,175 (−10 % from the baseline median of 1,305) →
     keep; B-182 **Open**. The report names the next lever: the section still carrying the overrun, measured.
  3. Target missed and median > 1,175 → revert: five wording levers have now failed to move length. B-182 **Dropped**
     as an accepted limit citing the report.
  4. Attributable regression → revert. B-182 stays **Open**, with the next lever named as the rule minus the clause
     the regression traces to. When the regression traces to the rule as a whole, it becomes **Dropped**, an accepted
     limit.
- **Bound:** 3 runs, Opus / medium, at most 3 USD and 180 s each, 9 USD in total. These are CLI list-price
  estimates, and on the subscription they consume usage without being billed. Any further run is the user's
  authorization.

## Phases

Single phase: one edit, one run set, one disposition.

### Phase 1 — Budget a bounded answer, judge it on one run set, dispose of B-182
- **Goal:** `/esq:plan` fits a stated word bound on Tamialog, as judged on 3 runs with no attributable fidelity loss.
- **Files touched:** `plugin/skills/plan/SKILL.md`; `docs/preparation/2026-09-30-b182-word-bound.md` and
  `docs/preparation/2026-09-30-b182-word-bound/` (`inputs.json`, `prompt.txt`, `correction.diff`,
  `run-{1,2,3}/{proposal.md,messages.md,trace.json,metrics.json}`); `docs/BACKLOG.md`.
- **Tasks:**
  - Task 1.1: `plan: budget a response to a stated length bound, protected content first (B-182)`. Add the rule from
    § Recommendation to § "Style for the plan content", in at most about 80 words, after "Cut repeated rationale…".
    Record the SHA-256 and `wc -w` of `SKILL.md` before and after. `correction.diff` is
    `git diff HEAD~1 -- plugin/skills/plan/SKILL.md`.
  - Task 1.2 (execution, no commit): rebuild `/tmp/b182-bound-case` the way Task 1.2 of
    `docs/plans/2026-09-29-git-state-rule-alone.md` did it:
    - the blobs from `docs/preparation/2026-09-25-b181-tamialog/inputs.json`, with 437/437 SHA-256 matching, else stop
      before spending;
    - `plugin/` from `git archive HEAD plugin`, hashed;
    - the prompt byte-identical to `docs/preparation/2026-09-29-b189-alone-tamialog/prompt.txt` (`d17732b6…`).

    Print the bound, then run the `docs/headless-trial.md` block 3 times concurrently, with `env -u ESQ_CODEX`,
    outside the sandbox, each run with its own `RESULT_DIR` and config dir. Afterwards, check that the case hashes are
    unchanged and that no `/tmp/esq-headless-auth.*` remains. Record the Claude Code version.
  - Task 1.3: `docs(preparation): B-182 word bound — one run set and verdict`. Write the report in French, like its
    siblings, in the B-189-alone report's shape:
    - a C1–C7 × run table (✅/❌, citing the proposal line) and a baseline-versus-this-set column table;
    - the same per-section word table as § Context, so the next lever is measured, not guessed;
    - the verdict applied as written, with the attribution line for every fall;
    - volume and cost;
    - the confounds: the plugin commits since `32404b4` other than this one (`db82592` adds about 110 words of verdict
      text to the same file, `41de29f`, and build/land changes this run does not load), and any Claude Code version
      change since 2.1.284.
  - Task 1.4 (only on outcome 3, or on outcome 4 traced to the whole rule):
    `revert: plan: budget a response to a stated length bound (B-182)`, via `git revert` of Task 1.1.
    - On outcome 4 with a named clause: revert the same way. The lever goes into the row, and nothing else is edited
      here.
  - Task 1.5: `backlog: B-182 disposition`. Apply the outcome with the exact command:
    - Done: `esq backlog set-status B-182 Done --by 2026-09-30-b182-plan-within-word-bound --resolution "<report link, words n/3 ≤ 900, C1–C7 vs baseline>"`
    - Dropped: `esq backlog set-status B-182 Dropped --reason "accepted limit: <report link, verdict>"`
    - Open: status unchanged.

    Either way, add a dated note under B-182's `##` detail. It links the report and gives the counts and the verdict's
    one-line reason.
- **Verification:**
  - `(auto)` `grep -c "preparation/2026-09-30-b182-word-bound.md" docs/BACKLOG.md` — ≥ 1: B-182's detail note links the report, and its status matches the report's verdict
  - `(auto)` `./scripts/audit.sh` — PASS (it runs the product suites itself; no `node --test` beside it)

## Rollout
- If the edit is kept: once `main` carries it, publish with `./scripts/update.sh`.

## Risks
- **Pre-mortem: the proposal fits by dropping what the user asked for.** A budget pressures exactly the content C1 and
  C5 read. The rule names that content as protected, and the verdict counts such a loss as attributable, so the edit
  cannot "win" on words by losing fidelity.
- **The model cannot count.** There is no shell in the run, so the 900 words are estimated. If the runs land at
  950–1,000, the verdict returns outcome 2 with a measured lever, not a false Done.
- **n = 3, one case.** Three runs separate 0/3 from 3/3, not 60 % from 80 %. The verdict is the stop condition fixed
  beforehand, not a statistical claim, and a real plan file without a cap is unaffected.
- **Timeouts:** baseline run 1 ended at 178.8 s against a 180 s limit. A shorter answer should help, and the timeout
  attribution is stated in the verdict.
- **Data sent out:** the Tamialog inventory goes to Anthropic again, as in the three prior sets. This invocation's
  "one bounded run set" is the authorization. Nothing is written in `events-tracker` or under `~/.claude/`.

## Open questions
None. The mandate names the case, the bound, the criteria and one run set. The verdict above settles every outcome.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-09-30

**Plan committed at:** 3c01751

**Commits:** c566df9, 7cc436c, 93d408b, 84d80ff

**Verified:** 84d80ffb0a234d9c75522c2ad7b5822996dd5ac5
- `grep -c "preparation/2026-09-30-b182-word-bound.md" docs/BACKLOG.md`
- `./scripts/audit.sh`

**What got built:** The bounded-length budgeting rule was added to plan § Style (c566df9), judged on one bounded set of 3 Tamialog runs, and reverted under the pre-stated verdict (outcome 3); the French report and inspectable runs are in docs/preparation/2026-09-30-b182-word-bound*, and B-182 is Dropped as an accepted limit with a dated note.

**Verification:**
- (auto) grep -c "preparation/2026-09-30-b182-word-bound.md" docs/BACKLOG.md — 2 (row provenance + dated detail note); B-182 is Dropped, matching the report's outcome 3
- (auto) ./scripts/audit.sh — exit 0, Clean — 7 checks (product), 26 s

**Surprises / decisions made during execution:** - Run set (3 runs, 118/137/151 s, 2.71 USD reported list price, ≤ 9 USD bound): 0/3 ≤ 900 words — 1,435 / 1,471 / 1,411, median up 10% from the 1,305 baseline. The separate inventory vanished in all three, but its words went to layout, copy and verification.
- C1 2/3, C3 3/3, C4 3/3, C5 2/3 (1/3 literal), C6 1/3, C7 3/3 held their baseline. C2 fell 3/3 → 1/3; not attributable: runs 1–2 never read the notice in QuickLogSheet (only grepped it for chips) and described the spacing-confirm dialog, the modal-instead-of-drawer mode the verdict names.
- Verdict outcome 3 applied as written: Task 1.4 reverted c566df9 (SKILL.md back to 8ce6b924… byte-identical), B-182 Dropped via esq backlog set-status.
- Confounds: Claude Code 2.1.284 → 2.1.285; db82592 (+~110 words in the same SKILL.md) since the baseline. The /esq:plan skill text is not in stream-json, so the rule's load is inferred from the case's plugin hash, not the stream.
- Metrics/trace/messages were extracted by a scratch script in the sibling sets' shape; case and raw results deleted after sanitizing, no /tmp/esq-headless-auth.* left.

**Backlog candidates:** None.

**For Phase 2:** Last phase. No rollout is owed: the edit was reverted, so plugin/ is unchanged from Origin and ./scripts/update.sh has nothing to publish for this unit.
