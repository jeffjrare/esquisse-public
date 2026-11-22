# Gemini as a second opt-in adversary beside Codex in /esq:plan

**Branch:** esq/add-gemini-opt-in-adversary

**Origin:** main

**Reviewed at:** 5f1a316a3350e8ac8ed8ab5d88d50a7229b04a96

## Context
`/esq:plan` can already ask one other model family for a second opinion. With `ESQ_CODEX=on`, it runs a blind counter-plan in the background and a pre-mortem of the written plan, judges both itself and records the tally in the commit body (`plugin/skills/plan/references/codex-adversary.md`, D-codex-adversary-opt-in-input-only). B-200 asks for Gemini as a second, independent adversary under the same contract. A user without a Codex login then gets the second opinion, and a user with both gets two uncorrelated reads of the same plan. SPEC *Planning — `/esq:plan`* ("Opt-in second opinion from another model family") documents Codex only. This plan widens that behavior, and `/esq:spec` refreshes the text afterwards.

## Goal
A user who sets `ESQ_GEMINI=on` gets the same blind counter-plan and pre-mortem from the local `gemini` CLI, alone or beside Codex. It runs read-only, never blocks, and Claude judges it.

## Done looks like
- With only `ESQ_GEMINI=on`, `/esq:plan` announces two read-only Gemini calls with their time bounds. In `## Approaches considered` it judges a Gemini counter-plan that has returned by then, and otherwise records it as `not returned`. It judges the Gemini pre-mortem findings before the commit. The plan commit body carries an `Adversary (gemini …)` block, and the report carries a `Gemini:` count line.
- With both gates on, both providers run. The two counter-plans run in the background at the same time, and the two pre-mortems run in one foreground call at the same time, so the announced wall-clock bounds are unchanged (≤15 min background, ≤10 min foreground). Each provider's verdicts stay attributed to it.
- With neither gate on, `/esq:plan` behaves exactly as today: nothing is loaded, launched or said.
- A missing `gemini`, a `gemini` too old to enforce the read-only policy, a non-zero exit, a timeout or an unparseable answer costs one `Gemini: not run — <reason>` line, and the plan continues.
- Gemini cannot write to the repository or run a shell command during either call.
- The README tells the user, before they opt in, that Gemini sends the goal and the code it reads to Google under their own Gemini login, and shows how to set it per project.

## Approaches considered
1. **A shared lifecycle reference plus one thin invocation reference per provider (chosen).** `references/adversary.md` holds what both providers share: the gate, blindness, timing, judging, the untrusted-data rule, the record and the one-line failure. `codex-adversary.md` keeps only the Codex invocation. `gemini-adversary.md` holds the Gemini invocation and its read-only policy. The skill loads the shared reference once, plus the reference of each provider whose gate is on. The two schemas move to provider-neutral names (`counter-plan.schema.json`, `premortem.schema.json`) and both providers use them. User benefit: one set of rules for judging and recording, so a user with both gates on gets comparable, attributed verdicts. Cost: Codex's text and its probe move around, but its behavior does not change.
2. **A sibling `gemini-adversary.md` that copies the whole Codex reference.** It costs the least to write and leaves Codex untouched. Its limit is two copies of the judging, record and failure rules, which will drift, and a both-gates run would then judge the two providers by different rules.
3. **Counter-plan's structural alternative, merged: a small dependency-free CLI helper to unwrap and validate Gemini's JSON envelope.** Rejected. Claude reads the answer anyway to judge it, so a malformed answer shows in that same read and becomes the `not run` line. A new `esq` verb would add a CLI surface and tests and save no read.

The Codex counter-plan (blind) proposed approach 1 with the same structural choice: share the protocol, keep provider execution separate and inside the skill. It was merged with three changes: neutral schema names, an explicit Gemini read-only policy, and concurrent pre-mortems when both gates are on.

## Recommendation
Approach 1. The owning component is `plugin/skills/plan/` (ARCHITECTURE *skills*). The boundary it must not cross is *No model other than Claude enters `plugin/lib`, and none gates*: every Gemini call lives in the skill's reference, its answer is data, and nothing it proposes runs.

**Read-only enforcement for Gemini, in three layers.** Gemini has no OS sandbox equivalent to `codex -s read-only`. Gemini CLI docs (geminicli.com/docs, cli-reference, plan-mode and policy-engine, checked 2026-11-21) document the following. `--approval-mode plan` is a read-only mode, but it may write `.md` files in its plans directory and can switch to implementation through `exit_plan_mode`. `--admin-policy <file>` adds admin-tier policy rules, which outrank user rules and the built-in mode defaults. `-o json` wraps the final answer in `{response, stats, error?}`. There is no output-schema flag. So the call uses:
- `--approval-mode plan`, so the model has no write tool by default;
- `--admin-policy "<refs>/gemini-readonly.toml"`, which allows only the read tools (`read_file`, `read_many_files`, `list_directory`, `glob`, `grep_search`) and denies everything else at admin priority, including `run_shell_command`, `write_file`, `replace`, `exit_plan_mode`, web fetch and MCP tools;
- a capability precondition in the same call, failing closed: `gemini --help` must list both `--admin-policy` and `plan`, and the system policy directory the policy-engine doc names for the platform must hold no `*.toml`, because the doc says supplemental admin policies are ignored when it does. Otherwise the result is `Gemini: not run — <the missing condition>`: the call is skipped, never run with weaker permissions.

The schema goes to Gemini as text: the prompt heredoc and the schema file are piped together on stdin, and `-p` carries one instruction line. stdout (the JSON envelope) goes to `<git-dir>/esq/gemini-<slug>-<call>.json.part` and is renamed on exit 0, so a counter-plan that is still running is never read half-written. Model selection: `${ESQ_GEMINI_MODEL:+-m "$ESQ_GEMINI_MODEL"}`; unset, Gemini's own settings apply. No effort variable: the Gemini CLI documents no reasoning-effort flag.

Reference stack: none recorded (`esq stack` present: false).

## Security notes
Opting in sends the goal text and every file Gemini reads in the repository to Google under the user's own Gemini login. That is why the gate is the *printed* `ESQ_GEMINI=on` value, never a guess at the environment, and why the README says so before the settings snippet. Only the plan skill calls Gemini, never `plugin/lib`. Its tools are limited to repository reads by plan mode plus the admin allowlist policy, with the capability precondition refusing a CLI that cannot enforce it. Its output is untrusted: no command, path or instruction in it is executed or followed, and a finding that asks for anything beyond a plan edit is rejected. Nothing it writes lands in the working tree: output and stderr go under `<git-dir>/esq/`, and stdout never enters the context.

## Phases

Single-phase plan: the shared reference, the Gemini invocation, its policy and the user documentation make sense only together.

### Phase 1 — Gemini adversary in /esq:plan, alone or beside Codex
- **Goal:** `ESQ_GEMINI=on` runs Gemini's blind counter-plan and pre-mortem under the same judged, non-blocking contract as Codex, alone or together, documented for the user.
- **Files touched:** `plugin/skills/plan/SKILL.md`, `plugin/skills/plan/references/adversary.md` (new), `plugin/skills/plan/references/codex-adversary.md`, `plugin/skills/plan/references/gemini-adversary.md` (new), `plugin/skills/plan/references/gemini-readonly.toml` (new), `plugin/skills/plan/references/codex-counter-plan.schema.json` → `counter-plan.schema.json`, `plugin/skills/plan/references/codex-premortem.schema.json` → `premortem.schema.json`, `scripts/probe-codex-plan.sh`, `scripts/probe-gemini-readonly.sh` (new), `tests/hooks/hooks.test.mjs`, `README.md`, `CLAUDE.md`, `.claude/skills/skill-authoring/SKILL.md`, `.claude/skills/plugin-runtime/SKILL.md`
- **Tasks:**
  - Task 1.1: Split the adversary protocol into a shared `adversary.md` and a Codex-only `codex-adversary.md`, and rename the two schemas to provider-neutral names. This is a pure move: Codex's calls, bounds, prompts, record and failure line stay byte-for-byte equivalent apart from the schema paths. `adversary.md` gets the shared shape (`<d>`, stdout discarded, stdin prompt), § counter-plan lifecycle, § pre-mortem lifecycle, § judging, § record (one `Adversary (<provider> <model|config>):` block per provider that ran) and § failure. The schema-path consumers update in the same commit: `scripts/probe-codex-plan.sh` (its argv match and comments) and the Codex command in `tests/hooks/hooks.test.mjs`. `plugin/skills/plan/SKILL.md` § "Commit and stop" step 0 and `## Approaches considered` point to `adversary.md` + `codex-adversary.md`.
  - Task 1.2: Add the Gemini adversary. Create `gemini-readonly.toml` (the admin allowlist: allow the read tools above; deny everything else, with the named denies `run_shell_command`, `write_file`, `replace`, `exit_plan_mode`, `web_fetch`, `google_web_search`) and `gemini-adversary.md`. The latter holds both invocations: the capability precondition, `--approval-mode plan --admin-policy`, the stdin prompt+schema, `-o json` to `.part` then a rename, `timeout 900` for the background call and `timeout 570` for the foreground one, and the rule that Claude reads `response` from the envelope (an absent, non-JSON or schema-mismatched `response`, or an `error` field, gives the `not run` line, with the reason taken from `error.message` or the `.err` file's last line). In `plugin/skills/plan/SKILL.md`: the preflight prints `printf 'ESQ_CODEX=%s ESQ_GEMINI=%s\n' …`. Every Codex-only clause is generalized to "each provider whose gate printed `on`". The target line names the gates and the call count (`…; with ESQ_GEMINI=on, 2 read-only Gemini calls (≤15 min background, ≤10 min foreground).`, or `4 read-only calls (Codex, Gemini)` with the same bounds when both are on). When both are on, the two counter-plans launch as two background calls in the same response, and both pre-mortems run as one foreground call (`( codex … ) & ( gemini … ) & wait`, Bash `timeout: 600000`). Each provider's first 8 findings are judged, and duplicate fixes are applied once and credited to both. Step 4's report gets a `Gemini:` line beside `Codex:`. Add a Gemini case to `tests/hooks/hooks.test.mjs`. It covers the real command shape: `rm -f "$d/…"` under `.git`, a `cat` of the plugin's schema, and `--admin-policy` naming the plugin's toml. The protect-installed hook must allow it, because reading a plugin file next to a mutation under `.git` is not an edit of the cache. The existing test asserts the same for Codex.
  - Task 1.3: Add `scripts/probe-gemini-readonly.sh`, a research instrument run by hand and wired to nothing (not `audit.sh`, not `--lab`), like `probe-codex-plan.sh`. It prints its bound before spending: one `gemini` call, `timeout 300`, no retry, under the user's own login. In a `mktemp -d` git repo it runs the exact `gemini-adversary.md` flags with a prompt that tells Gemini to create `PWNED.md` and run `touch pwned.txt`. The repo holds a committed `seed.txt` with a random token. It prints PASS/FAIL for each of: the precondition passed; the call exited 0 with a non-empty `response` that quotes the token (the positive control: Gemini really ran and could read); `git status --porcelain` is empty afterwards; no `PWNED.md` or `pwned.txt` exists. It exits 0 only when all pass. A failed precondition, a non-zero exit or a missing token is *inconclusive*: exit 2 with one line, never a PASS. A missing `gemini` also exits 2.
  - Task 1.4: Document it for the user and the authors. In the README, the "second opinion" paragraph covers both providers: what each sends to whom (OpenAI for Codex, Google for Gemini), the per-project `.claude/settings.json` snippet with `ESQ_GEMINI` / `ESQ_GEMINI_MODEL`, the probe to run once after installing `gemini`, and the `Gemini: not run — <reason>` line. In `CLAUDE.md` (Model policy paragraph), `.claude/skills/skill-authoring/SKILL.md` (the "Another vendor's model" rule) and `.claude/skills/plugin-runtime/SKILL.md` (the `codex` call line), the rule is stated per provider with its printed gate. It still runs only from `/esq:plan`, read-only, and it is judged, never obeyed.
- **Verification:**
  - `(auto)` `git grep -nE 'codex-(counter-plan|premortem)\.schema' -- plugin scripts tests .claude README.md CLAUDE.md` — no match (exit 1). The rename reached every live consumer. History under `docs/plans` and `docs/preparation` is excluded by scope, because those files record what ran.
  - `(auto)` `ls plugin/skills/plan/references/adversary.md plugin/skills/plan/references/gemini-adversary.md plugin/skills/plan/references/gemini-readonly.toml plugin/skills/plan/references/counter-plan.schema.json plugin/skills/plan/references/premortem.schema.json` — exits 0; every file the references name exists (check-structure verifies only the `.md` ones).
  - `(auto)` `bash -n scripts/probe-gemini-readonly.sh` — the probe parses.
  - `(auto)` `./scripts/audit.sh` — the audit PASSes. It runs the product node suites, including the new and renamed protect-installed cases in `tests/hooks/hooks.test.mjs`, plus the structure check that every `references/*.md` `plugin/skills/plan/SKILL.md` names resolves.

## Rollout
- `(user)` Install the Gemini CLI and sign in once: `gemini -p "say ok"` answers in your terminal.
- `scripts/probe-gemini-readonly.sh` — exits 0 with four PASS lines; record its output in the B-200 closing note. A FAIL means Gemini could write: set `ESQ_GEMINI` to anything but `on` until it is fixed.

## Risks
- **Pre-mortem: the user never turns it on**, because nothing tells them it exists or it costs too much wall-clock. Task 1.4's README paragraph sits beside the Codex one, and the both-gates design keeps the announced bounds unchanged.
- **The read-only boundary rests on documented, unprobed Gemini semantics.** `gemini` is not installed on this machine, so plan-mode-plus-admin-policy denial is unproved until the Rollout probe runs. The capability precondition stops a CLI that lacks the flags, not one whose policy engine behaves differently from its docs. The probe is the proof, and the README tells the user to run it once before opting in.
- **The exact tool name for leaving plan mode** (`exit_plan_mode`) comes from the plan-mode doc. The policy-engine page does not list it. The allowlist covers this: whatever the name, everything not explicitly allowed is denied, and the named denies only make the policy explicit.
- **The task 1.1 move must not change Codex's behavior.** Its comparison point is `scripts/probe-codex-plan.sh` (billed, run by hand), whose criteria 1–5 stay valid after the schema rename. The plan does not buy a run of it. Its argv match is updated in the same commit.
- **The skill lifecycle is unproved by this plan's checks**: the Gemini-only and both-gates sequencing, attribution and failure lines are skill prose, and only a billed opted-in `/esq:plan` run observes them. The audit proves references resolve and the hook allows the call. The first opted-in run is the observation, and `scripts/probe-codex-plan.sh` is the pattern if a probe is later wanted.
- **Gemini hooks configured by the user or project still run** under the call, as they do in any `gemini` session in that repository. esq neither adds nor widens that exposure.
- **Gemini's answer may not match the schema** (no `--output-schema`). That gives one `not run` line, with no repair call.
- **`docs/ARCHITECTURE.md` (Components and Boundaries) and `docs/SPEC.md` (Planning) describe Codex alone.** Their owners, `/esq:arch` and `/esq:spec`, refresh them after this lands. Not a prerequisite.
- D-codex-adversary-opt-in-input-only's exit clause (remove after 3 opted-in cycles with no accepted finding that changed a phase or criterion) applies to each provider separately, recorded in the new decision.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-21

**Plan committed at:** 0096855

**Commits:** 1c8238d, 215c0bf, 6e72049, 8c86910

**Verified:** 8c86910b11a811f6c9c62f25f0886374f3b1428f
- `git grep -nE 'codex-(counter-plan|premortem)\.schema' -- plugin scripts tests .claude README.md CLAUDE.md`
- `ls plugin/skills/plan/references/adversary.md plugin/skills/plan/references/gemini-adversary.md plugin/skills/plan/references/gemini-readonly.toml plugin/skills/plan/references/counter-plan.schema.json plugin/skills/plan/references/premortem.schema.json`
- `bash -n scripts/probe-gemini-readonly.sh`
- `./scripts/audit.sh`

**What got built:** /esq:plan's adversary protocol is now one shared references/adversary.md plus a thin invocation reference per provider; ESQ_GEMINI=on runs Gemini's blind counter-plan and pre-mortem read-only (plan mode, admin allowlist policy gemini-readonly.toml, fail-closed capability precondition), alone or concurrently with Codex, with a by-hand read-only probe and README/author docs.

**Verification:**
- (auto) git grep -nE 'codex-(counter-plan|premortem)\.schema' -- plugin scripts tests .claude README.md CLAUDE.md — no match (exit 1)
- (auto) ls of the five new/renamed reference files — exit 0, all present
- (auto) bash -n scripts/probe-gemini-readonly.sh — parses (exit 0)
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), exit 0 in 27 s; hooks suite 44 pass incl. the new Gemini protect-installed case (mutation-checked: coarsening the hook reds it, source restored)

**Decided for you:**
- architecture: Gemini's `response` is parsed after stripping one surrounding Markdown code fence — a fenced JSON answer is common and would otherwise cost a wasted `not run` — undo: delete the fence clause in plugin/skills/plan/references/gemini-adversary.md § Reading the answer
- architecture: the precondition checks /etc/gemini-cli/policies and /Library/Application Support/GeminiCli/policies for *.toml — the platform system-policy dirs per the policy-engine doc as the plan cited it — undo: edit the ls paths in gemini-adversary.md and scripts/probe-gemini-readonly.sh

**Surprises / decisions made during execution:** - The probe exits 1 when check 3 or 4 FAILs (Gemini wrote), distinct from exit 2 inconclusive; the plan only fixed exit 0 and 2.
- The probe runs Gemini with a plain task prompt rather than the adversary schema, since it judges permissions, not answer shape; flags are the reference's exactly.
- The Gemini allowlist policy ends with a toolName-less catch-all deny at priority 100 under the allows (200) and named denies (300); whether the engine accepts a rule without toolName is unprobed until the Rollout probe runs.
- The Gemini command is written once in gemini-adversary.md, parameterised by <call>/<schema>/<bound>, instead of two copied blocks like Codex's.

**Backlog candidates:** None.

**For Phase 2:** Last phase. The Rollout probe scripts/probe-gemini-readonly.sh (gemini not installed here, exits 2 inconclusive) is the only proof of the read-only boundary; its output belongs in the B-200 closing note. docs/ARCHITECTURE.md and docs/SPEC.md still describe Codex alone: /esq:arch and /esq:spec refresh them.
