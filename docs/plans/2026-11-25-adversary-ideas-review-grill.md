# Opt-in Codex/Gemini adversary in /esq:ideas, /esq:review and /esq:grill

**Branch:** esq/adversary-ideas-review-grill

**Origin:** main

## Context
The opt-in second model family (Codex through `codex exec -s read-only`, Gemini through `agy --mode plan` under
`agy-readonly.json`) runs today from `/esq:plan` alone: a blind background counter-plan and a foreground pre-mortem, judged
by Claude, recorded in the plan commit body (`plugin/skills/plan/references/adversary.md`, `codex-adversary.md`,
`gemini-adversary.md`). On 2026-11-25 the user read the plan pre-mortem's 25/31 acceptance rate and chose to extend it to
`/esq:ideas`, `/esq:review` and `/esq:grill`, in that value order (B-203). `CLAUDE.md` ("Codex and Gemini … run only from
`/esq:plan`"), `.claude/skills/skill-authoring/SKILL.md` ("Only `/esq:plan` has it") and the README's opt-in paragraph state
the old rule. `docs/SPEC.md` (*Planning*, *Running under another harness*) and `docs/ARCHITECTURE.md` (§ skills line 19, §
Boundaries line 181) describe it as plan-only too. Both are projections with their own writers, so this plan does not edit
them: `/esq:spec` and `/esq:arch` refresh them afterwards.

## Goal
A user who opted in with `ESQ_CODEX=on` and/or `ESQ_GEMINI=on` gets a second, uncorrelated read from another model family in
three more places: more grounded ideas on the slate, defects Claude's review alone would miss, and hidden assumptions surfaced
before a brief is written. Each costs a bound announced before anything is spent, and none of them blocks, gates or adds a
question that is not the user's.

## Done looks like
- With a gate on, `/esq:ideas` (generate mode) announces the provider call(s) and their bound on its target line, then runs a
  blind background slate per provider. Ideas from it that survive the same four cuts (grounded with a real path, new,
  valuable, right-sized) join the slate, deduplicated with Claude's own and ranked by Claude. The slate file records which
  provider contributed which idea. `capture` mode never launches anything.
- With a gate on, `/esq:review` announces the calls with the size of the filtered diff they will read. It runs a blind
  background review of the scope's resolved range only, with lockfiles, fixtures, snapshots, generated files and historical
  docs filtered out. Above the cap, nothing is launched and the line reads `<Provider>: not run — diff too large (<n> KB
  filtered, cap <c> KB)`. Accepted findings pass the review's own bar and tiers, and the tail commit body carries the
  per-provider verdicts. A review with no commit writes them under `<git-dir>/esq/`.
- With a gate on, `/esq:grill` announces the calls (≤5 min background) and runs a blind pass that names hidden assumptions,
  edge cases and contradictions with the code. Results are folded into round 1, else the next round, else the brief. What
  the repo settles becomes a `## Resolved decisions` line, and only a genuinely missing authority reaches a question, inside
  the existing 4-per-round cap. The brief commit body carries the verdicts.
- With both gates off, the three commands load, launch and say nothing new. `/esq:plan`'s two-call behavior is unchanged.
- `CLAUDE.md`, `skill-authoring` and the README name all four commands, the per-command bounds and what each sends out.
- The follow-up measurement (accepted findings unique to the adversary, per command, over the first runs) is filed as a
  backlog row, never a gate.

## Approaches considered
1. **Shared provider kit stays in `plan/references/`, each command owns its lifecycle** (chosen). The three skills load the
   provider invocation references, the shared rules and the schemas through `${CLAUDE_SKILL_DIR}/../plan/references/…`. Each
   keeps its own lifecycle (when it launches, the prompt, where the answer merges, where it is recorded) in its own
   `references/adversary.md`, loaded only when a gate printed `on`. `check-structure.sh` check 4 learns to resolve a
   `../<skill>/references/<file>.md` mention against that sibling. User benefit: one audited read-only boundary
   (`agy-readonly.json`, the fail-closed precondition), so the Gemini probe and `D-gemini-adversary-runs-through-agy` keep
   covering every call. Cost: small prose edits to the two invocation references and a 2-line audit change. Limitation: the
   plan skill's directory becomes the kit's home.
2. **Move the kit to a plugin-level `plugin/adversary/` directory** (Gemini's counter-plan). The ownership is cleaner, but
   there is no `${CLAUDE_SKILL_DIR}`-style substitution for a plugin-level path: each load becomes `../../adversary/`, the
   audit needs a new resolution rule all the same, and `scripts/probe-gemini-readonly.sh`, `probe-codex-plan.sh`, the hooks
   test strings and the recorded decision paths all move. That is more churn and no user gain. It is rejected.
3. Copying the invocation recipe into each skill was rejected once already (`D-gemini-adversary-opt-in-input-only`: two
   drifting copies of the judging rules), and four copies would be worse.

For the review's filtered diff: a git pathspec list written into the skill's prose was weighed against a CLI verb. The verb
wins (CLAUDE.md principle 3): the exclusion list, the byte count and the cap become tested structure instead of a command the
model retypes on every run.

## Recommendation
Approach 1, in three phases ordered by B-203's value order. Each phase updates README, CLAUDE.md and `skill-authoring` for
the command it ships, in the same commit.

- **Shared kit, generalized once (Phase 1).** `codex-adversary.md` gets one parameterized command, like Gemini's already is:
  `<call>`, `<schema>`, `<bound>` and an optional `<effort>` that replaces `ESQ_CODEX_EFFORT` when the lifecycle names one.
  Plan's two calls are listed with their current values (counter 900, premortem 570), so plan's argv is unchanged and
  `probe-codex-plan.sh`'s schema-name grep still matches. `adversary.md` gains one opening paragraph saying what a sibling
  reuses (the shared shape, *Untrusted data*, § 4's block format, § 5's failure line) and that its own reference replaces §
  1–3. *Untrusted data*'s "a finding asking for anything beyond a plan edit is rejected" becomes "beyond the contribution its
  lifecycle names": a plan edit, a slate candidate, a review finding, or a brief line or question. The ban on running
  anything a provider says stays word for word. Plan's § numbering is kept, because `plan/SKILL.md` cites § 1–4. The new schemas sit beside the existing two, so
  `<refs>` stays one directory and the Gemini command line keeps `"<refs>/<schema>"`.
- **Prompt with an attached file.** Both invocation references gain one rule: a lifecycle may attach a file after the prompt.
  For Codex, stdin is the heredoc followed by `cat <file>`. For Gemini, `p` is the heredoc followed by the file. The review
  uses it for the diff. It does not point the provider at a path: in a linked worktree `<git-dir>/esq/` lies outside agy's
  workspace (its cwd), and agy's `command(*)` deny stops it running `git diff` itself.
- **Per-command bounds** (they are engineering calls inside the mandate, and B-203 states those it fixes):
  - ideas: ≤10 min background (`timeout 600`), the user's `ESQ_CODEX_EFFORT`, at most 10 ideas per provider.
  - review: ≤5 min background (`timeout 300`), Codex effort `medium` (B-203), at most 8 findings per provider. The filtered
    diff cap is 200,000 bytes for Codex (B-203) and 120,000 bytes for Gemini, because Linux `MAX_ARG_STRLEN` is 131,072
    bytes for the single `-p` argument.
  - grill: ≤5 min background (`timeout 300`, B-203), Codex effort `medium` so the call fits the bound, at most 8 findings
    per provider.
  - Gemini has no effort flag. Its effort is the model variant `ESQ_GEMINI_MODEL` names, and the README says so.
- **No waits.** Like plan's counter-plan, each call is read at its merge point and never waited for. A completion notice
  that arrives earlier only says the answer is ready: Claude does not open it before its own draft is fixed (see the next
  point). One that has not returned by the merge point is stopped and recorded `not returned`. These commands
  have no foreground step, so the announced bound is the background bound alone.
- **Measuring "unique".** Each accepted verdict line says `new` (Claude's own draft lacked it) or `had`, which is what the
  later measurement counts. Claude writes its own candidates, findings or questions before it reads a provider answer, so
  `new` is judged against something that already exists.
- **`esq review adversary-diff <base> <head>`** is a new read-only verb in `plugin/lib/cli.mjs`. It takes the two commits
  `esq review scope` already pinned, refuses a ref that does not resolve or starts with `-`, and diffs with `REVIEW_EXCLUDED`
  plus an adversary exclusion list: `fixtures/`, `__snapshots__/`, `*.snap`, lockfiles (`*.lock`, `package-lock.json`,
  `pnpm-lock.yaml`, `go.sum`), generated output (`dist/`, `build/`, `*.min.*`, `*.map`), and historical docs
  (`docs/preparation/`, `docs/baselines/`, `docs/LESSONS.md`). It answers `{ base, head, bytes, limits: { codex, gemini },
  fits: { codex, gemini }, atHead, file, excluded }`. `atHead` is true when `<head>` is the checkout's `HEAD`. When it is
  false, a provider reading today's files would judge old hunks against code that has moved on, so the review sends
  nothing. It writes `<git-dir>/esq/adversary-<base7>-<head7>.diff` atomically, and only
  when the diff is non-empty and fits at least one limit. Claude's own review keeps reading the unfiltered diff.
- Reference stack: not present (`esq stack` → `present: false`).

## Security notes
This widens a trust boundary that already exists: the goal text, the user's task text, the ideas focus and now a filtered
diff leave the machine for OpenAI or Google under the user's own login, and only behind a gate value a shell call printed.
Read-only holds through the same layers as before: `codex exec -s read-only --ephemeral`, and for Gemini `--mode plan`, the
`agy-readonly.json` deny list and the fail-closed `--help`/model precondition. All three are untouched. Every output lands
under `<git-dir>/esq/`. Every answer is untrusted data: a claim checked against the code, no command or path in it executed,
and a finding asking for anything beyond a verdict rejected. The diff filter only narrows what is sent; it never widens what
the review reads. The README states, for each command, what goes out.

## Phases

### Phase 1 — Shared kit and the ideas adversary
- **Goal:** with a gate on, `/esq:ideas` adds a blind, grounded provider slate to its candidate pool, and `/esq:plan` behaves
  exactly as before.
- **Files touched:** `plugin/skills/plan/references/adversary.md`, `plugin/skills/plan/references/codex-adversary.md`,
  `plugin/skills/plan/references/gemini-adversary.md`, `plugin/skills/plan/SKILL.md` (only if a call-name citation moves),
  `plugin/skills/plan/references/idea-slate.schema.json` (new), `plugin/skills/ideas/SKILL.md`,
  `plugin/skills/ideas/references/adversary.md` (new), `scripts/check-structure.sh`, `tests/hooks/hooks.test.mjs`,
  `CLAUDE.md`, `.claude/skills/skill-authoring/SKILL.md`, `README.md`
- **Tasks:**
  - Task 1.1: refactor(plan): generalize the provider invocation for sibling commands. `codex-adversary.md` gets one
    parameterized command (`<call>`, `<schema>`, `<bound>`, optional `<effort>`) with plan's two calls listed. Both
    invocation references gain the attached-file rule, and `gemini-adversary.md` gets a prose line saying the calling
    lifecycle names `<call>`/`<schema>`/`<bound>`. `adversary.md` gains the opening "what a sibling reuses" paragraph. Plan's
    argv, file names and § numbers stay unchanged.
  - Task 1.2: fix(audit): check-structure resolves `../<skill>/references/<file>.md` against that sibling skill. The regex
    becomes `(\.\./[a-z0-9-]+/)?references/[A-Za-z0-9._-]+\.md`, resolved as `$CMD_DIR/$n/$ref`. Without this, every sibling
    load reds check 4.
  - Task 1.3: feat(ideas): opt-in Codex/Gemini blind slate.
    - Preflight step 2's batch prints the gates in its first shell call, chained with `git rev-parse --git-dir`.
    - In generate mode with a gate on, step 4's target line ends `…; with ESQ_CODEX=on, 1 read-only Codex call (≤10 min
      background).`, or the Gemini or both-gate form (`2 read-only calls (Codex, Gemini)`). In that same response the run
      loads `${CLAUDE_SKILL_DIR}/../plan/references/adversary.md`, the gated invocation reference(s) and
      `${CLAUDE_SKILL_DIR}/references/adversary.md`, then launches.
    - The prompt carries the focus, the axes and their weights, and the grounding rule (each idea's `signal` names a path,
      route, spec section or ID). It asks for at most 10 ideas and does not see Claude's slate.
    - At *Generate, then cut*, a returned answer's ideas join the candidate pool before the cut. A `signal` naming a path
      that does not exist is cut as ungrounded. A duplicate merges and is credited `had`.
    - The slate file ends with an `## Adversary` section holding § 4's blocks. Each verdict line names the provider
      candidate's title and either the final slate number it became (`→ #<n>`, both providers credited when theirs merged)
      or its cut reason. Zone 3 gains one
      `○ Codex  <k> of <n> kept (<u> new)` line per provider, or `○ Codex  not run — <reason>`.
    - `capture` mode never prints, loads or launches anything.
    - `idea-slate.schema.json`: `{ ideas: [{ title, axis, for, value, signal, idea, size }] }`, with `axis` and `size` as
      enums matching the slate shape.
    - The hooks test gains the ideas Codex and Gemini command shapes over the sibling path
      (`…/skills/ideas/../plan/references/idea-slate.schema.json`), which must stay undenied.
    - In the same commit: CLAUDE.md's rule becomes "run only from `/esq:plan` and `/esq:ideas`". `skill-authoring`'s "Only
      `/esq:plan` has it" names both commands and the sibling-load convention. The README's opt-in paragraph and the
      `/esq:ideas` table row say what ideas sends (the focus, and what the model reads) and its bound.
- **Verification:**
  - `(auto)` `./scripts/check-structure.sh` — prints `structure clean`. Every `../plan/references/…` mention resolves, and
    the sibling resolution of Task 1.2 is what lets the new loads pass.
  - `(auto)` `node -e 'for (const f of process.argv.slice(1)) JSON.parse(require("fs").readFileSync(f, "utf8"))' plugin/skills/plan/references/idea-slate.schema.json plugin/skills/plan/references/counter-plan.schema.json plugin/skills/plan/references/premortem.schema.json plugin/skills/plan/references/agy-readonly.json`
    — exits 0: every JSON the providers read parses.
  - `(auto)` `node --test 'tests/hooks/hooks.test.mjs'` — passes, including the new sibling-path ideas shapes that must
    not be denied.
  - `(auto)` `git grep -n 'counter-plan.schema.json\|premortem.schema.json' -- plugin/skills/plan/references/codex-adversary.md`
    — at least one match each: plan's Codex argv still names both schemas, which `scripts/probe-codex-plan.sh` greps for.

### Phase 2 — The review adversary over a filtered delta
- **Goal:** with a gate on, `/esq:review` adds a blind, bounded provider review of the resolved range, or says in one line
  why it did not run.
- **Files touched:** `plugin/lib/cli.mjs`, `tests/cli/review-scope.test.mjs`,
  `plugin/skills/plan/references/review-findings.schema.json` (new), `plugin/skills/review/SKILL.md`,
  `plugin/skills/review/references/adversary.md` (new), `tests/hooks/hooks.test.mjs`, `CLAUDE.md`,
  `.claude/skills/skill-authoring/SKILL.md`, `README.md`
- **Tasks:**
  - Task 2.1: feat(cli): `esq review adversary-diff <base> <head>`, the filtered, capped delta for a provider.
    - The verb is as specified in the Recommendation, with an `ADVERSARY_EXCLUDED` constant whose comment says why each
      class goes. It is added to the usage string and the dispatch.
    - Tests in `tests/cli/review-scope.test.mjs`:
      - a fixtures file, a lockfile, a `dist/` file and a `docs/preparation/` file are excluded while `src/` hunks stay;
      - `bytes` is `Buffer.byteLength`, checked at exactly 120,000/200,000 (fits) and one byte over (does not fit), with a
        multibyte line;
      - an over-both or empty diff writes no file;
      - an unresolvable or `-`-leading ref exits non-zero with its reason;
      - `atHead` is false for a range whose head is not `HEAD`;
      - `git status --porcelain` stays empty;
      - `esq review scope`'s answer is unchanged.
    - In the same commit, README's CLI row names the verb.
  - Task 2.2: feat(review): opt-in Codex/Gemini blind review of the filtered delta.
    - Step 3's call prints the gates chained before `esq review scope`.
    - With a gate on and mode `delta`/`full`/`range` with `bookkeepingOnly: false`, the run calls
      `esq review adversary-diff <base> <head>` before step 8. A provider whose `fits` is false gets
      `not run — diff too large (<n> KB filtered, cap <c> KB)`. Zero bytes gives `not run — nothing reviewable after
      filtering`, `unresolved` gives `not run — no resolved range`, and `atHead: false` gives `not run — range head is not
      the checkout`. The prompt names both commit IDs and asks only for defects inside that range.
    - Step 8's target line ends `…; with ESQ_CODEX=on, 1 read-only Codex call on <n> KB of filtered diff (≤5 min
      background).`, or the Gemini, both-gate or not-run form. The launch goes out in that response.
    - The prompt asks for at most 8 defects, each naming who hits it, under which input and what goes wrong, with
      `file:line` evidence and no style findings. The diff is attached. The provider sees neither Claude's findings nor the
      plan.
    - The merge point is just before *Report*. Accepted findings go through the same bar and tiers as Claude's own, and a
      rejected one gets a one-clause reason. A call not returned is stopped, so no subagent run under `/esq:converge` leaves
      a call spending.
    - The blocks become a second `-m` on the tail commit (`brief(fixes)` or `plan(reviewed)`). A plan-less clean review
      makes no commit, so its blocks are written to `<git-dir>/esq/adversary-review-<head7>.md`. Not-run outcomes are
      recorded the same way, so the measurement's denominator counts every opted-in run.
    - Zone 3 gains `○ Codex  <a>/<j> accepted (<u> new)` or the not-run line.
    - `review-findings.schema.json`: `{ findings: [{ where, failure, evidence, fix }] }`, at most 8 judged.
    - The hooks test gains the review shapes.
    - In the same commit: the CLAUDE.md rule, `skill-authoring` and the README paragraph and `/esq:review` row add review,
      its cap, its medium effort and what it sends (the filtered diff plus what the model reads).
- **Verification:**
  - `(auto)` `node --test 'tests/cli/review-scope.test.mjs'` — passes, including the new `adversary-diff` cases: exclusions,
    both caps at the boundary, no file when over or empty, ref refusal, a clean tree.
  - `(auto)` `./plugin/bin/esq review adversary-diff HEAD~1 HEAD` — prints JSON with numeric `bytes`, a
    `limits.codex` of `200000` and a `limits.gemini` of `120000`.
  - `(auto)` `./scripts/check-structure.sh` — prints `structure clean`, with review's sibling loads resolved.
  - `(auto)` `node --test 'tests/hooks/hooks.test.mjs'` — passes with the review shapes undenied.

### Phase 3 — The grill adversary, the measurement row, the audit
- **Goal:** with a gate on, `/esq:grill` folds verified hidden assumptions into its rounds without adding questions that are
  not the user's, and the unit closes with the full audit.
- **Files touched:** `plugin/skills/plan/references/grill-probe.schema.json` (new), `plugin/skills/grill/SKILL.md`,
  `plugin/skills/grill/references/adversary.md` (new), `tests/hooks/hooks.test.mjs`, `CLAUDE.md`,
  `.claude/skills/skill-authoring/SKILL.md`, `README.md`, `docs/BACKLOG.md`
- **Tasks:**
  - Task 3.1: feat(grill): opt-in Codex/Gemini blind assumption pass.
    - Step 1's first batch prints the gates chained with `esq stack`.
    - Step 8's target line ends `…; with ESQ_CODEX=on, 1 read-only Codex call (≤5 min background).`, or the other forms,
      and the launch goes out in that response. The prompt is the user's task text verbatim plus the instruction: at most 8
      hidden assumptions, edge cases or contradictions with the code that would change what gets built, each with
      `file:line` evidence.
    - Merge: before round 1 if returned, else before the next round that is held anyway, else before the brief is written.
    - Each accepted finding is sorted under *Whose question is it*:
      - repo-settled goes to `## Resolved decisions`, as "inferred from `<file>`, raised by <provider>";
      - a planning matter goes to `## Deferred to planning`;
      - a missing authority takes one of that round's ≤4 slots.
    - A finding opens a round of its own only when it names a missing authority, the same bar as any question.
    - A call not returned at brief time is stopped. The blocks become the brief commit's second `-m`, and the elapsed line
      is preceded by one `Codex:`/`Gemini:` count line.
    - `grill-probe.schema.json`: `{ findings: [{ kind: assumption|edge-case|contradiction, claim, evidence, question }] }`.
    - The hooks test gains the grill shapes.
    - In the same commit: CLAUDE.md's rule names all four commands, and `skill-authoring` and the README paragraph and
      `/esq:grill` row add grill.
  - Task 3.2: backlog: file the adversary measurement row. One
    `esq backlog add --type "✨ improvement" --concern internal --layer app --summary "Measure the ideas/review/grill adversary: unique accepted findings per command; retire one that adds nothing" --source "plan: 2026-11-25-adversary-ideas-review-grill"`,
    with a detail section stating the method. Count `accepted … (new)` lines in review/grill commit bodies (`git log --grep
    'Adversary ('`), `<git-dir>/esq/adversary-review-*.md` and ideas slates, over the first 5 opted-in runs per command. Retirement is per command and per
    provider, and never gates.
- **Verification:**
  - `(auto)` `node -e 'for (const f of process.argv.slice(1)) JSON.parse(require("fs").readFileSync(f, "utf8"))' plugin/skills/plan/references/grill-probe.schema.json plugin/skills/plan/references/review-findings.schema.json`
    — exits 0: both new schemas parse.
  - `(auto)` `./plugin/bin/esq validate` — exits 0 with the new backlog row.
  - `(auto)` `./scripts/audit.sh` — PASS: structure, package, no-push, conformance and the CLI, hooks and audit product
    suites in one run.

## Rollout
- Run `scripts/probe-gemini-readonly.sh` once from the repository. Five PASS lines show Gemini could read and answer but its
  write and shell were denied after the `gemini-adversary.md` edit (`D-gemini-adversary-runs-through-agy`). Exit 2
  (inconclusive, no `agy`) is reported in one line and is not a failure. A FAIL means the user keeps `ESQ_GEMINI` off until
  it is diagnosed.

## Risks
- **Pre-mortem: the likeliest reason a user gets nothing is a call that never returns in time.** Claude's own ideas
  generation, review or first grill round can finish before the provider does, and a `not returned` line adds nothing. The
  answer is to launch at the target announcement, as early as each command allows, and to put the merge point as late as the
  output allows. Task 3.2's measurement retires a command's adversary that keeps arriving late.
- **These checks prove structure, not behavior.** Launching, merging, attributing and stopping a call are skill-prose
  behavior that no format check observes: they stay unproved here. The first opted-in runs show them, and Task 3.2's
  measurement reads them. Plan's Codex argv is unchanged text, so review reads that diff rather than this plan buying a
  billed probe.
- **The filter hides a real defect** (for example a lockfile pinning a vulnerable version). Claude's own review still reads
  the unfiltered diff, so the adversary only narrows its own input.
- **Mid-unit wording.** Each phase's CLAUDE.md and README edit names only the commands shipped so far. Phase 3's grep
  checks the final state.
- **Check 1 of `check-structure.sh`** resolves quoted "see …" section names inside one skill's own files. A sibling skill's
  text must not cite plan's headings that way; use § numbers instead, as plan already does.
- **Gemini effort cannot be forced to medium** for review and grill. With `gemini-*-high` the 5-minute bound may cut it, and
  it then counts as `not returned`. The README states this.
- **L-01e9c39011:** a CLI whose workspace is its cwd misses the repo from a subdirectory. Every new call reuses the
  invocation references unchanged (`cd "$(git rev-parse --show-toplevel)"` for agy, `-C` for Codex), so that holds.
- `docs/SPEC.md` and `docs/ARCHITECTURE.md` will still say plan-only. `/esq:spec` and `/esq:arch` are the follow-ups, and
  this plan does not edit projections.
- `scripts/probe-codex-plan.sh` (a billed, hand-run end-to-end probe) asks to be run after an edit to the two Codex files.
  It stays the maintainer's choice, and Phase 1's argv grep keeps its assertion's input intact.

## Open questions
None. Scope, order and the review cap and effort are the user's (B-203), and the other bounds are recorded above as
engineering calls.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-25

**Plan committed at:** 0f6a933

**Commits:** d448583, f859320, 9441ee0

**Verified:** 9441ee0e207d7ebef4aa1f358b6e3b10d3c5db30
- `./scripts/check-structure.sh`
- `node -e 'for (const f of process.argv.slice(1)) JSON.parse(require("fs").readFileSync(f, "utf8"))' plugin/skills/plan/references/idea-slate.schema.json plugin/skills/plan/references/counter-plan.schema.json plugin/skills/plan/references/premortem.schema.json plugin/skills/plan/references/agy-readonly.json`
- `node --test 'tests/hooks/hooks.test.mjs'`
- `git grep -n 'counter-plan.schema.json\|premortem.schema.json' -- plugin/skills/plan/references/codex-adversary.md`

**What got built:** The provider kit in plan/references is parameterized for sibling commands (one Codex command over <call>/<schema>/<bound>/<effort>, an attached-file rule in both invocation references, a 'what a sibling reuses' paragraph), check-structure resolves ../<skill>/references/ paths, and /esq:ideas runs an opt-in blind Codex/Gemini slate (idea-slate.schema.json, ideas/references/adversary.md) merged before its four cuts.

**Verification:**
- (auto) ./scripts/check-structure.sh — structure clean, exit 0 (a temporary corpus naming ../plan/references/nope.md was red, exit 1, before commit f859320)
- (auto) node -e JSON.parse over idea-slate, counter-plan, premortem schemas and agy-readonly.json — exit 0
- (auto) node --test tests/hooks/hooks.test.mjs — 44 pass, 0 fail, including the ideas Codex and Gemini shapes over skills/ideas/../plan/references undenied and the sibling-path rename denied
- (auto) git grep counter-plan.schema.json|premortem.schema.json in codex-adversary.md — lines 25 and 26 match

**Surprises / decisions made during execution:** - plan/references/adversary.md § 1 and § 2 now say 'its reference's command with <call> counter/premortem' instead of 'counter-plan command'/'pre-mortem command', since codex-adversary.md no longer has per-call headings; plan/SKILL.md needed no edit.
- The Codex attached-file form pipes a `{ cat <<'PROMPT' …; cat <file>; }` group into the same command's stdin rather than a process substitution, so it stays one plain pipeline.
- The CLI suite was not run: this phase touched no plugin/bin or plugin/lib file. The full ./scripts/audit.sh is Phase 3's.

**Backlog candidates:** None.

**For Phase 2:** 1. Review's lifecycle loads ${CLAUDE_SKILL_DIR}/../plan/references/{adversary,codex-adversary,gemini-adversary}.md like ideas does (plugin/skills/ideas/references/adversary.md is the model to copy: call table with <call>/<schema>/<bound>/<effort>/<slug>, Merge, Record). Review passes <effort> medium, which codex-adversary.md now honours over ESQ_CODEX_EFFORT.
2. The attached-file forms are in place: Codex pipes { heredoc; cat file; } into stdin, Gemini appends cat file inside p=$(…); gemini-adversary.md already states the 131,072-byte MAX_ARG_STRLEN reason for the 120,000 cap.
3. A sibling must cite plan's sections by § number, never a quoted heading (check 1); add the review shapes to tests/hooks/hooks.test.mjs beside the ideas ones (the `sibling` const).

### Phase 2 — completed 2026-11-25

**Plan committed at:** 43c1439

**Commits:** 3796c36, 7cf09a9

**Verified:** 7cf09a9ecd8a00a550ed693438decd18832f131e
- `node --test 'tests/cli/review-scope.test.mjs'`
- `./plugin/bin/esq review adversary-diff HEAD~1 HEAD`
- `./scripts/check-structure.sh`
- `node --test 'tests/hooks/hooks.test.mjs'`
- `node --test --test-timeout=30000 tests/cli/*.test.mjs`

**What got built:** A new read-only verb `esq review adversary-diff <base> <head>` returns the range's diff with fixtures, snapshots, lockfiles, generated output and historical docs filtered out. It reports the byte count, the 200,000 (Codex) and 120,000 (Gemini) caps and fits, atHead and the excluded paths, and writes the diff under <git-dir>/esq/. /esq:review now runs an opt-in blind Codex/Gemini review of that delta (review-findings.schema.json, review/references/adversary.md): ≤5 min in the background, Codex effort medium, at most 8 defects judged through its own bar and tiers, recorded in the tail commit's second -m or under <git-dir>/esq/.

**Verification:**
- (auto) node --test tests/cli/review-scope.test.mjs — 33 pass, 0 fail, including the three new adversary-diff tests (exclusions with a nested build/ kept, both caps at the byte boundary with a multibyte line, no file when over both or empty, ref refusal exit 2, atHead false, clean tree, review scope unchanged); each new assertion was red once against a mutated source (filter dropped; .length instead of byteLength), source restored
- (auto) ./plugin/bin/esq review adversary-diff HEAD~1 HEAD — JSON with bytes 27009, limits.codex 200000, limits.gemini 120000
- (auto) ./scripts/check-structure.sh — structure clean, review's ../plan/references loads resolved
- (auto) node --test tests/hooks/hooks.test.mjs — 44 pass, with the review Codex (attached-file group, effort medium) and Gemini (cat file inside p) shapes undenied and the rename into the cache denied
- (extra, blast radius: plugin/lib/cli.mjs and its usage string) node --test --test-timeout=30000 tests/cli/*.test.mjs — 457 pass, 0 fail, 13 s

**Decided for you:**
- architecture: adversary-diff excludes build/ only at the repository root (dist/ anywhere): a nested build/ is often source, and **/build/** would have hidden this plugin's own plugin/skills/build from every review adversary — undo: change ':(exclude,glob)build/**' to ':(exclude,glob)**/build/**' in ADVERSARY_EXCLUDED, plugin/lib/cli.mjs

**Surprises / decisions made during execution:** - The answer's `excluded` is the list of paths the adversary filter removed beyond REVIEW_EXCLUDED, computed as two `git diff --name-only -z` reads. fits is the cap alone (an empty diff fits). The skill reads bytes 0 first, per the not-run table in review/references/adversary.md.
- Refs pass through `rev-parse --verify --quiet --end-of-options <ref>^{commit}` after the `-` refusal, so a ref never reaches git as an option.
- The test fixture's plan() helper leaves its log entry uncommitted. The review-scope-unchanged assertion therefore commits it first and brackets only the verb call.
- The CLI product suite ran here (cli.mjs is the CLI's shared core and its usage string changed). The full ./scripts/audit.sh is still Phase 3's.

**Backlog candidates:** None.

**For Phase 3:** 1. Grill's lifecycle copies plugin/skills/review/references/adversary.md's shape (call table, Merge, Record, zone-3 line) and loads the kit over ${CLAUDE_SKILL_DIR}/../plan/references. Grill attaches no file and passes <effort> medium, <bound> 300.
2. The hooks test now has review shapes beside the ideas ones (reviewRefs const). Add the grill shapes the same way, over skills/grill/../plan/references.
3. CLAUDE.md, skill-authoring and the README now name /esq:plan, /esq:ideas and /esq:review. Phase 3 adds grill to each, and the README /esq:review row and opt-in paragraph already state review's caps and medium effort.

### Phase 3 — completed 2026-11-25

**Plan committed at:** c50b926

**Commits:** ea8801d, 0a1b714

**Verified:** 0a1b714045634911725e2c3c4f8ceabe25fbb8cf
- `node -e 'for (const f of process.argv.slice(1)) JSON.parse(require("fs").readFileSync(f, "utf8"))' plugin/skills/plan/references/grill-probe.schema.json plugin/skills/plan/references/review-findings.schema.json`
- `./plugin/bin/esq validate`
- `./scripts/audit.sh`

**What got built:** /esq:grill now runs an opt-in blind Codex/Gemini assumption pass (grill-probe.schema.json, grill/references/adversary.md): gates printed with esq stack, the call announced on the target line and launched in the background (≤5 min, Codex effort medium, at most 8 findings), merged before round 1, else the next round held anyway, else the brief, each accepted finding sorted into Resolved decisions, Deferred to planning or a question slot only for a missing authority, verdicts in the brief commit's second -m. CLAUDE.md, skill-authoring and the README name all four commands; B-204 files the per-command measurement.

**Verification:**
- (auto) node -e JSON.parse grill-probe.schema.json review-findings.schema.json — exit 0
- (auto) ./plugin/bin/esq validate — valid, no findings, with B-204
- (auto) ./scripts/audit.sh — Clean, 7 checks (product): structure, package, no-push, conformance, version, bounded runner, CLI/hooks/audit product suites; 26 s
- (task) node --test tests/hooks/hooks.test.mjs — 44 pass with the grill Codex/Gemini shapes undenied; the new cache-rename deny assertion was red once against a mutated target, restored

**Decided for you:**
- design: grill's provider calls are named `probe` and their verdicts tag each accepted finding resolved|deferred|asked, so the measurement can tell a finding that cost the user a question from one Claude settled — undo: edit the Record block in plugin/skills/grill/references/adversary.md

**Surprises / decisions made during execution:** - esq backlog add has no detail flag, so B-204's Method section was appended to docs/BACKLOG.md by hand after the CLI wrote the row, as earlier detail sections are.
- The hooks test's new grill assertions were added inside the existing sibling-path test (so the test count stays 44).

**Backlog candidates:** None.

**For Phase 4:** Last phase. /esq:spec and /esq:arch still describe the adversary as plan-only (projections this plan does not edit); the rollout probe scripts/probe-gemini-readonly.sh remains to run.
