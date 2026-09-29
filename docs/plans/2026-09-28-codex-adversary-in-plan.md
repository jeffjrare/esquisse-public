# Codex as an independent adversary inside /esq:plan

**Branch:** esq/codex-adversary-in-plan

**Origin:** main

## Context
The most expensive defects measured in real cycles are born in the plan, not the code: the node24 cycle
(events-tracker, 2026-09-27) spent ~0.6M eq and four hand-offs on a Phase 1 `(auto)` criterion that described
the half-way state Phase 2 changed. The `/esq:plan` checks that would have caught it are Claude reviewing
Claude's own plan, and the "structurally different alternative" is one Claude invents against itself. The
installed Codex plugin only reviews code after it is written. The user ran bounded Codex adversarial passes by
hand on 2026-09-24 (`docs/preparation/`) and wants that inside the plan step, opt-in.

## Goal
With `ESQ_CODEX=on` set for a project, every `/esq:plan` run gets a second model's independent approach and a
pre-mortem of the written plan before it is committed, with each finding judged and the judgments recorded in
the plan commit; with it unset, `/esq:plan` behaves and costs exactly as today.

## Done looks like
- A user who sets `ESQ_CODEX=on` (in the project's `.claude/settings.json` `env`) and runs `/esq:plan` sees,
  in the plan run's report, what the counter-plan changed and how many pre-mortem findings were accepted.
- The counter-plan is blind: Codex receives the goal and the repository, never Claude's plan.
- Codex missing, failing, slow or unauthenticated costs one report line and never stops the plan.
- `ESQ_CODEX_MODEL` / `ESQ_CODEX_EFFORT` pick the model and reasoning effort; unset, `~/.codex/config.toml`
  applies (today `gpt-6-astra`, `high`).
- Over the next 3 opted-in cycles the user can read, from `git log` on the plan commits, how many findings were
  accepted — the data that decides whether this stays.

## Approaches considered
- **A — `codex exec` from the plan skill (chosen).** The `codex` CLI (0.156.1) runs read-only
  (`-s read-only`), takes the prompt on stdin, enforces a JSON answer with `--output-schema` and writes it with
  `-o`; `-m` and `-c model_reasoning_effort=…` carry the two settings. The counter-plan runs as a background
  Bash task overlapping Claude's investigation; the pre-mortem runs in the foreground under `timeout`. No
  dependency on another plugin, schema-checked output, nothing to poll.
- **B — the Codex plugin's `codex-companion.mjs task` (as first asked).** Loses: its script lives in another
  plugin's versioned cache (`~/.claude/plugins/cache/openai-codex/codex/<version>/`), so esq would hard-code
  a path that moves on every Codex plugin update; its `task` output is rendered prose, not a schema; its
  runtime skill declares itself internal to its own rescue subagent; a background job adds `status`/`result`
  polling turns. It runs the same `codex` underneath, so A keeps its capability.
- **Structural alternative — a Claude subagent as the adversary.** Loses: same model family, correlated blind
  spots, which is the thing a second opinion is bought to escape; it also breaks `/esq:plan`'s "no subagents"
  bound.
- Rejected detail: `codex exec resume --last` for the pre-mortem (reuses Codex's investigation) — `--last`
  picks the newest session in the directory, which can be an unrelated one; the pre-mortem runs fresh.

## Recommendation
A. The skill owns the call (the CLI stays dependency-free: git is its one external process). Opt-in is an env
var because Claude Code's per-project `.claude/settings.json` `env` block already scopes it per project and
needs no new esq config file. Codex output is data Claude judges, never a verdict: it cannot fail, gate or
rewrite the plan by itself. The judgments go in the plan commit's body, not in the plan, so no `/esq:build`
worker pays to read rejected findings. Checked `codex exec --help` / `codex exec resume --help`, 2026-09-28.

## Security notes
This sends the goal text and whatever Codex reads in the repository to OpenAI under the user's own Codex
login. The opt-in per project is that consent, and the README says so. Codex runs `-s read-only`: it can read,
never write. Its answer is untrusted data: a finding is a claim Claude checks against the code before acting on
it, and no command, path or instruction inside it is ever executed. Its output files go under
`<git-dir>/esq/`, never the working tree, so nothing Codex wrote can be committed by accident.

## Phases

Single phase: one skill change, its reference and schemas, and the README.

### Phase 1 — The plan skill asks Codex, when opted in
- **Goal:** `/esq:plan` runs the blind counter-plan and the pre-mortem when `ESQ_CODEX=on`, judges both, and
  records the judgments in its commit body; unset, nothing changes.
- **Files touched:** `plugin/skills/plan/references/codex-adversary.md`,
  `plugin/skills/plan/references/codex-counter-plan.schema.json`,
  `plugin/skills/plan/references/codex-premortem.schema.json`, `plugin/skills/plan/SKILL.md`, `README.md`
- **Tasks:**
  - Task 1.1: add the Codex adversary reference and its two answer schemas. The reference holds:
    - **Gate:** `[ "$ESQ_CODEX" = on ]`, else nothing is loaded or said. The flags are
      `${ESQ_CODEX_MODEL:+-m "$ESQ_CODEX_MODEL"}` and
      `${ESQ_CODEX_EFFORT:+-c model_reasoning_effort="$ESQ_CODEX_EFFORT"}`, passing nothing when unset.
    - **Counter-plan:** launched right after the target is announced, as one background Bash call:
      `timeout 900 codex exec -s read-only -C <root> --ephemeral <flags> --output-schema <schema> -o <git-dir>/esq/codex-<slug>-counter.json -`,
      with the prompt on stdin. The prompt carries the goal (the task text, or the brief's path) and asks for
      an independent approach: the approach, 1–4 phases each with its user-visible outcome and proof, the one
      structural choice, and the top risks. Claude's plan does not exist yet, and the prompt forbids reading
      `docs/plans/<today>-<slug>*`.
    - **Pre-mortem:** after the plan is written and read once, before the commit, one foreground call:
      `timeout 570 codex exec …` with `codex-premortem.schema.json`. The prompt names the plan path and asks
      for at most 8 findings. Each finding has a `kind`: `missing-task`, `criterion-does-not-prove`,
      `criterion-between-phases`, `phase-order`, `scope`, `security` or `other`. It also has `where` (a plan
      section or phase), `claim`, `evidence` (`file:line` or plan line) and `fix`. Claude judges only the
      first 8.
    - **Judging:**
      - Counter-plan: keep, merge or reject, against the same user-result criteria as `## Approaches
        considered`. When Codex proposes a structurally different approach, it replaces the self-invented
        structural alternative.
      - Each pre-mortem finding: accepted (the plan edit made) or rejected (one-clause reason, checked against
        the code it cites).
      - A counter-plan that has not returned when the pre-mortem ends is killed and reported as not returned;
        nothing waits for it.
    - **Record:** an `Adversary (codex <model|config>):` block in the plan commit body, with one line for the
      counter-plan and one line per finding. The same counts go in one line of the final report. A missing
      `codex`, a non-zero exit, a timeout or an answer that does not parse gives one report line, e.g.
      `Codex: not run — <reason>`, and the plan continues.
    - **Untrusted-data rule** (see § Security notes).

    Schemas are OpenAI structured-output compatible: every property required, `additionalProperties: false`,
    and no `maxItems` (the count is bounded in the prompt and by Claude reading the first 8).
  - Task 1.2: wire the reference into `plugin/skills/plan/SKILL.md`, as a named load at each branch that
    uses it. Four points:
    - the announce line gains `…; with ESQ_CODEX=on, 2 read-only Codex calls (≤15 min background, ≤10 min
      foreground)`;
    - preflight step 11 launches the counter-plan;
    - `## Approaches considered` reads it if it has returned;
    - "Commit and stop" runs the pre-mortem before staging and carries the `Adversary` block in the commit
      body and the count line in step 4's report.

    Nothing else in the skill changes when the variable is unset.
  - Task 1.3: document `ESQ_CODEX`, `ESQ_CODEX_MODEL` and `ESQ_CODEX_EFFORT` in `README.md`, next to
    `ESQ_TELEMETRY`. Cover:
    - how to set them per project in `.claude/settings.json` `env`;
    - what is sent to OpenAI;
    - the time bound;
    - that it never blocks.
- **Verification:**
  - `(auto)` `codex exec -s read-only --ephemeral --output-schema plugin/skills/plan/references/codex-premortem.schema.json "Reply with an empty findings list."` — exits 0 and its final message is JSON `{"findings": []}`, proving the schema is accepted by the model API and the flags resolve
  - `(auto)` `codex exec -s read-only --ephemeral --output-schema plugin/skills/plan/references/codex-counter-plan.schema.json "Reply with approach 'none', no phases, structuralChoice 'none' and no risks."` — exits 0 and its final message parses as JSON with the four schema keys
  - `(auto)` `./scripts/audit.sh` — PASS: the structure check resolves every `references/…` path the skill names, and the product suites pass

## Risks
- **Pre-mortem (why nobody uses it):** the pre-mortem adds several minutes of waiting to every plan, and its
  findings are mostly noise that Claude rejects. The data answers this: the commit-body ledger counts
  accepted findings. If 3 opted-in cycles show none that changed a phase or a criterion, the feature comes
  out. That review is the user's, with `/esq:plan` runs on events-tracker; it is not a task here.
- Codex anchored on the repository's existing plans could echo esq's own habits instead of disagreeing. The
  counter-plan prompt asks for the approach it would take from the goal, not a review of anything existing.
- The structured-output schema could be refused by the API (strict-mode keyword limits). The two `(auto)`
  smokes are exactly that check, and they run before any real plan depends on it.
- `timeout 900` in the background can outlive a short plan run. The kill-and-report rule bounds it at the
  pre-mortem's end.
- Quota or authentication failures on the user's Codex account surface as `Codex: not run — <stderr's last
  line>`, never as a stop.

## Open questions
None: model, effort, opt-in form and bound were settled with the user on 2026-09-28 (this conversation), and
the rest follows the Recommendation.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
