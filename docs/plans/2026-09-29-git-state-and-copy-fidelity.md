# Plans state only observed Git state and keep every qualifier of quoted copy

**Branch:** esq/git-state-and-copy-fidelity

**Origin:** main

## Context
B-181 was closed by re-scoping. Its two criteria that stayed unreliable on the 2026-09-29 variance trial
(`docs/preparation/2026-09-29-b181-variance.md`, fix arm) became B-189 (C7, 1/3) and B-188 (C5, 1/3). **B-189:** in a
shell-less run, two of three proposals say "Le dépôt est en HEAD détachée" (fix-1 l. 5, fix-3 l. 12), yet the case has no
`.git` and no command ran. The likely source is `plugin/skills/plan/SKILL.md`, which says in two places (l. 129–131 and
Commit step 1, l. 344–347) that *empty output means detached HEAD*. It never says what to state when the command did not
run, so "no output" reads as "empty output". **B-188:** the brief quotes only French ("seulement les biberons en poudre,
et leurs ml"). `/esq:plan` translates it to English and drops the qualifier ("only the formula bottles") in 2 of 3 runs.
fix-1 even writes the English as "l'équivalent", never in full. Read-back item 6 (l. 296–300, commit `538c7c8`) already
says "keeps every qualifier in each language". That rule proved too abstract.

## Goal
A person reading a `/esq:plan` output is never told a Git state nobody observed, and the English copy it proposes says
everything the French brief says. This is proven on the retained Tamialog case, with no loss on B-181's other criteria.

## Done looks like
- In `/esq:plan`, a Git state is named only from the output of a command that actually ran. With no shell, or when the
  command did not run, the plan says "branch not observed" and names no state.
- Quoted brief copy keeps every qualifier in each language the plan writes it in. A translation is written in full,
  never as "the equivalent".
- One bounded set of 3 runs on the retained Tamialog case judges both, with the C1–C7 criteria and a pre-written rule.
  B-189 is Done if C7 holds ≥ 2/3, B-188 is Done if C5 holds ≥ 2/3, and C1, C2, C3, C4 and C6 each hold ≥ 2/3.
- `./scripts/audit.sh` PASS is recorded.

## Approaches considered
- **Two targeted wording changes in `/esq:plan`, one run set (chosen).** C7 gets a rule at the source of the inference:
  the Git state comes from observed output only, and the case where the command did not run gets its own named outcome.
  C5 makes item 6 concrete: a qualifier is translated word for word, and the translation is written in full. Cost:
  about 60 words per `/esq:plan` load, plus 3 runs (≤ 9 USD list price, ~3.3 USD expected from the fix arm).
- **A deterministic check (`esq` extracts brief strings and compares them with the plan).** This loses on two counts. The
  trial exposes only Read/Grep/Glob/Skill, so the model cannot run it. A check that brief strings appear in the plan is
  also the prose-presence guard that CLAUDE.md rule 5 forbids. Qualifier fidelity across a translation is judgment.
- **Two separate run sets, one per row.** This would attribute each gain to its own wording, but it doubles the cost.
  The user asked for one shared set.

## Recommendation
Both edits go in `plugin/skills/plan/SKILL.md`, the owner. Nothing is added to the CLI, the audit or the reference files.

- **C7 (B-189).** Rewrite the two places that map output to a state. The shipping-unit paragraph (l. 129–131) and Commit
  step 1 (l. 344–347) get the same rule. *A Git state is named only from the output of a command that ran: empty output
  from `git branch --show-current` is detached HEAD, and a non-zero exit is no repository. When the command did not run
  (no shell, a read-only run), the plan states "branch not observed", names no state and no consequence of one.*
  Step 4's list of reasons for omitted fields gains "branch not observed".
- **C5 (B-188).** Tighten item 6's copy clause without teaching the test word. *Quoted copy keeps every qualifier in
  each language the plan writes it in: a translation renders each modifier of the source (« lait entier » → "whole
  milk", not "milk") and is written in full, never as "the equivalent".* The example is deliberately not Tamialog's
  phrase, so a pass comes from the rule, not from reciting the answer.
- **Rule fixed before spending** (baseline = the 2026-09-29 fix arm: C1 2/3, C2 2/3, C3 3/3, C4 3/3, C5 1/3, C6 2/3,
  C7 1/3).
  - A **target** is met when it holds ≥ 2/3. B-189 is then Done (C7) and B-188 Done (C5).
  - **No regression**: C1, C2, C3, C4 and C6 each hold ≥ 2/3. This is the level B-181 used to close them. At n = 3,
    a drop from 3/3 to 2/3 is within noise, and the report names it.
  - **Regression** (any of them < 2/3): revert both edits. One shared run set cannot attribute the loss, and the rows
    stay Open.
  - **No regression, target missed**: keep that target's edit only if it gained ≥ 1 run over the baseline (row stays
    Open, with the table as the reason). Otherwise revert it: it costs words and buys nothing.
  - A run killed at 180 s delivers nothing and fails every criterion, as in the variance trial. Only an infrastructure
    failure (auth, DNS) is relaunched, once.
- **Budget, printed before launch:** 3 runs, ≤ 3 USD / 180 s each, ≤ 9 USD. The amounts are CLI list-price estimates.
  On the subscription they consume plan usage, and they are not billed.

## Security notes
The Tamialog inventory (437 files at `events-tracker` `33e750a1`) goes to Anthropic again. The user authorized this
for the B-181 trials and extends it to this run set by requesting verification "on the retained Tamialog case". The
credential is copied into a `mktemp` removed by trap. The retained evidence keeps only `<case>`-relative paths, the
character counts and hashes of tool results, and the proposals, in the 2026-09-29 folder's shape. Nothing is written
in `events-tracker` or under `~/.claude/`.

## Phases

Single phase: the two edits share one run set, so they are proven together.

### Phase 1 — Two wording fixes, one run set, disposition
- **Goal:** `/esq:plan` stops inventing Git state and dropping qualifiers in translation, as judged on 3 Tamialog runs.
- **Files touched:** `plugin/skills/plan/SKILL.md`; `docs/preparation/2026-09-29-b188-b189-tamialog.md` and
  `docs/preparation/2026-09-29-b188-b189-tamialog/` (`inputs.json`, `prompt.txt`, `correction.diff`,
  `run-{1,2,3}/{proposal.md,messages.md,trace.json,metrics.json}`); `docs/BACKLOG.md`.
- **Tasks:**
  - Task 1.1: `plan: name a Git state only from observed command output (B-189)`. Apply the C7 wording to both places
    and to step 4's reason list. Leave the `<!-- Omit BOTH … -->` template comment as it is. It already says when to
    omit, and "not observed" also omits both fields.
  - Task 1.2: `plan: translate every qualifier of quoted copy, in full (B-188)`. Apply the C5 wording to item 6 only.
    Record the before/after SHA-256 and `wc -w` of `SKILL.md` across both tasks.
  - Task 1.3 (execution, no commit): rebuild `/tmp/b188-b189-case` as Task 1.2 of
    `docs/plans/2026-09-29-b181-closing-evidence.md` did. The blobs come from
    `docs/preparation/2026-09-25-b181-tamialog/inputs.json`, and 437/437 SHA-256 must match or the run stops before
    spending. Copy `plugin/` from `git archive HEAD plugin` and record its hashes. The prompt is the byte-identical
    `docs/preparation/2026-09-29-b181-variance/prompt.txt` (`d17732b6…`). Print the bound, then run the
    `docs/headless-trial.md` block 3 times concurrently, with `env -u ESQ_CODEX`, outside the sandbox, and a separate
    `RESULT_DIR` and config dir per run. Afterwards, check that the case hashes are unchanged and that no
    `/tmp/esq-headless-auth.*` remains. Record the Claude Code version.
  - Task 1.4: `docs(preparation): B-188/B-189 — one run set and verdict`. Retain the runs in the variance folder's shape.
    The report (French, like its siblings) gives the protocol, the bound, the hashes and the diff. It includes a C1–C7 ×
    run table (✅/❌ with the proposal line cited), a baseline (fix arm) vs this set table, and the rule applied as
    written. Name the confounds: plugin commits after `538c7c8` other than these two, and any Claude Code version
    change.
  - Task 1.5 (only when the rule reverts): `revert: …`. `git revert` Task 1.1 and/or Task 1.2, as the rule says.
  - Task 1.6: `backlog: B-188 and B-189 disposition`. Run `esq backlog set-status B-189 Done --by 2026-09-29-git-state-and-copy-fidelity`
    when its target is met, otherwise `… Open`. Do the same for B-188. Add a dated note under each `##` detail linking
    the report, with the pass counts.
- **Verification:**
  - `(auto)` `grep -c "not observed" plugin/skills/plan/SKILL.md` — ≥ 2 while Task 1.1 is kept (shipping-unit paragraph and Commit step 1), 0 when the rule reverted it, and it matches the report's verdict
  - `(auto)` `grep -c "preparation/2026-09-29-b188-b189-tamialog.md" docs/BACKLOG.md` — ≥ 2: both detail notes link the report
  - `(auto)` `./scripts/audit.sh` — PASS (it runs the product suites itself; no `node --test` beside it)

## Rollout
- If either edit is kept: once `main` carries it, publish with `./scripts/update.sh`.

## Risks
- **Pre-mortem: the rule is followed and the output is still wrong.** C7 could fail differently. A run may skip "detached
  HEAD" and still invent a consequence ("/esq:land ne pourrait pas livrer"). The C7 wording forbids both the state and
  its consequence, and the reader judges the whole claim, not the phrase.
- **C5 may stay fragile.** The wording already failed once in abstract form. If it misses again (≤ 1/3 with no gain),
  the rule reverts it and B-188 stays Open. The next lever is then yours: a deterministic translation aid is excluded
  (see Approaches), so what remains is accepting it as a known limit.
- **Shared run set:** a regression reverts both edits, even if only one caused it. This is the price of the single set
  the user chose, and the report says so.
- **n = 3** separates 0/3 from 3/3, not 60 % from 80 %. The rule is the stop condition, not a statistical claim.
- **Timeouts:** fix-arm runs took 129–149 s against 180 s, and the new words add length. One timeout fails every
  criterion for that run and can by itself trigger a regression revert. Judge it as written.
- **Case rebuild:** `events-tracker` must still hold the `33e750a1` blobs (the commit is present today).

## Open questions
None. The user's request authorizes the edits, the run set and its spend. The criteria, the rule and the bound are set
above.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-09-29

**Plan committed at:** a629393

**Commits:** 44f5ff6, babfddd, 31097e7, 053276f, cc45e94, 33fd6bb

**Verified:** 33fd6bbc3208f754c6185abb1176a5b90e44f523
- `grep -c "not observed" plugin/skills/plan/SKILL.md`
- `grep -c "preparation/2026-09-29-b188-b189-tamialog.md" docs/BACKLOG.md`
- `./scripts/audit.sh`

**What got built:** Both /esq:plan wording fixes (C7 observed-Git-state rule, C5 full-translation clause) were written, judged on one bounded set of 3 Tamialog runs, and reverted under the pre-written rule because C1 and C6 fell to 1/3; the retained evidence and French report are in docs/preparation/2026-09-29-b188-b189-tamialog*, and B-188/B-189 are back to Open with dated notes.

**Verification:**
- (auto) grep -c "not observed" plugin/skills/plan/SKILL.md — 0 (exit 1): Task 1.1 reverted, matching the report's regression verdict; SKILL.md back to 8f505624… byte-identical
- (auto) grep -c "preparation/2026-09-29-b188-b189-tamialog.md" docs/BACKLOG.md — 2 (both detail notes)
- (auto) ./scripts/audit.sh — exit 0, Clean — 7 checks (product), 25 s

**Surprises / decisions made during execution:** - Run set (3 runs, 157/154/152 s, 3.65 USD reported list price, ≤ 9 USD bound): C7 3/3 (from 1/3), C5 3/3 on the qualifier reading (1/3 on the literal "powdered-formula" label), but C1 1/3 and C6 1/3 (from 2/3) — the rule reads regression, so both edits were reverted. Plausible, unproven mechanism: the C5 clause lengthens item 6, where the C1 and C6 clauses live; noise is the alternative at n = 3.
- Task 1.5 is two `git revert` commits (053276f, cc45e94), one per reverted task, rather than one combined commit, so each stays independently revertible.
- `esq backlog set-status … Open` accepts neither `--by` nor `--reason`; the disposition reason lives in the dated detail notes instead.
- One tool error in run 2 (Grep on a nonexistent `EventFields.tsx`), no effect; no permission denials; case 484 files unchanged; no auth tempdir left.

**Backlog candidates:** None.

**For Phase 2:** Last phase. Next lever named in the report, not proven: run the C7 rule alone (it sits outside item 6), and try a C5 clause that does not lengthen item 6. No rollout is owed: nothing is kept in plugin/.
