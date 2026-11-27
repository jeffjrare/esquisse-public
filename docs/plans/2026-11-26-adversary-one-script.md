# The Codex/Gemini adversary runs through one shipped script

**Branch:** esq/adversary-one-script

**Origin:** main

## Context
Every opt-in adversary call (plan counter-plan and pre-mortem, ideas slate, review, grill probe) has the model hand-render 15–25 lines of bash from `plugin/skills/plan/references/codex-adversary.md` and `gemini-adversary.md`, then hand-read the output (Codex JSON, the Gemini envelope, the `.err` last line), and each lifecycle file (`plan|ideas|review|grill/references/adversary.md`) restates launch, wait, read and stop. Three defects came from it this week in events-tracker and assets-prospection runs: a hoisted `refs=` got the ideas slate denied by `protect-installed`; a hand-merged `( … ) & ( … ) & wait` left Gemini with an empty `$d` writing `/gemini-….json.part`; and one wait-rule change was made in 3 references, then again in 3 `SKILL.md` bodies (862bf54, a451d92). `scripts/probe-gemini-readonly.sh` carries a fourth copy of Gemini's precondition and model step, and `ideas/SKILL.md:167` a stale fifth ("bounded at 10 minutes … never waited for"). This is `D-generalize-on-evidence` (a) and (c): copies edited together, and one more variant per provider.

## Goal
Every `/esq:plan`, `/esq:ideas`, `/esq:review` and `/esq:grill` run with a gate on launches, waits for and reads Codex and Gemini through one tested script, so the user gets each provider's answer without the model improvising shell, and a provider is added in one place.

## Done looks like
- A run with a gate on calls each provider in one line per call, the prompt on stdin, and reads one normalized result per provider; the model never renders `codex exec`/`agy` argv or parses an envelope or `.err` file.
- The calls keep every current guarantee: the gates, blind prompts, bounds, `codex -s read-only`, agy's plan mode with `agy-readonly.json` and its capability precondition, the `gemini-*` model rule, the review/grill `-medium` variant, the record format, outputs only under `<git-dir>/esq/`.
- The `protect-installed` hook lets the one-line form through, and the script refuses before touching the filesystem when it cannot resolve the git directory or is given a slug or call that could leave it.
- Fake `codex`/`agy` tests prove launch, marker, read, schema validation, model variant, attached file, refusal and timeout; a real agy call proves Gemini still cannot write or run a command.
- A rule about calling, waiting or reading lives in one file.

## Approaches considered
- **A dependency-free Node script beside the references, `plugin/skills/plan/references/adversary.mjs` (chosen).** Both providers' counter-plans proposed it independently, replacing my bash draft: argv arrays with no shell interpolation, native JSON, a real schema check, and functions the node suite imports. It stays in `/esq:plan`'s references, out of the git-only CLI, as the plugin-runtime rule requires.
- **A bash script, `adversary.sh` (my first draft).** Loses: JSON parsing and schema checks would need `node` anyway, shell quoting is where this week's defects came from, and its tests would have to drive it as a subprocess only.
- **An `esq adversary` CLI verb.** Rejected: the CLI is git-only and dependency-free by contract, and a second model family is reached from a skill, never from the CLI (`docs/ARCHITECTURE.md`).

## Recommendation
`node <refs>/adversary.mjs`, one argument order everywhere (`<slug> <call>`):

```
adversary.mjs launch <codex|gemini> <slug> <call> <schema> <bound> [--effort <e>] [--attach <file>]   # prompt on stdin
adversary.mjs wait   <slug> <call> <provider>… [--bound <s>]                                        # default 170, exit 0 or 124
adversary.mjs read   <slug> <call> <provider>…                                                      # one JSON line per provider
```

- **Refuse before any write** (exit 2, nothing created): the provider's gate is not exactly `on` in the environment; `git rev-parse --absolute-git-dir` or `--show-toplevel` fails or answers anything but an existing absolute directory; `<slug>` or `<call>` does not match `^[a-z0-9][a-z0-9-]*$`; `--attach` (resolved against the caller's cwd before anything else) is unreadable. `<schema>` is a file name beside the script or an absolute path.
- **Launch**: `<d>` = `<git-dir>/esq`; removes `<d>/<provider>-<slug>-<call>.*` only; writes `.meta.json` (provider, schema path, bound, effort, start time, and the model once resolved) before spawning; Codex keeps today's argv (`-s read-only -C <toplevel> --ephemeral`, model flag from `ESQ_CODEX_MODEL`, effort from `--effort` else `ESQ_CODEX_EFFORT`, `--output-schema`, `-o`), prompt plus attachment on stdin; Gemini runs from the toplevel after the capability precondition (`--settings`, `--json-schema`, `--mode` in `agy --help`), the `gemini-*` model rule, the `-<effort>` variant when `agy models` lists it, `-p` capped below `MAX_ARG_STRLEN`, `--mode plan --settings <refs>/agy-readonly.json --output-format json`, never `--dangerously-skip-permissions`. A failed precondition records its reason with `meta.stage: "refused"` and spawns nothing. The child runs in its own process group under the bound (SIGTERM, then SIGKILL, exit 124), signals to the script are forwarded to that group, stdout lands in `.json.part` and is renamed to `.json` whatever the exit, and `.exit` is written last, always.
- **Read** (from `.meta.json`, never from arguments): `running` without `.exit`; `ok` with the answer and model when the answer (Codex's file, Gemini's envelope `structured_output` with status `SUCCESS`) validates against the schema; otherwise `not-run` with the reason: `timed out after <bound> s`, the refusal, Gemini's `error.message` then `status`, the `.err` last line, or the schema violation. The validator covers what the shipped schemas use (`type`, `required`, `properties`, `items`, `enum`, `additionalProperties`).
- `codex-adversary.md` and `gemini-adversary.md` are retired; their provider facts move into one *Providers* table in `plan/references/adversary.md`. Recorded as `D-adversary-runs-through-one-script`.

## Capability inventory
| Source | Capability | Disposition |
|---|---|---|
| `plugin/skills/plan/references/codex-adversary.md` | the Codex call template (argv, flags, effort, attached file) | moved — `plugin/skills/plan/references/adversary.mjs` (`launch codex`) and the *Providers* table in `plugin/skills/plan/references/adversary.md` |
| `plugin/skills/plan/references/gemini-adversary.md` | the Gemini call template (precondition, model rule, read-only layers, envelope reading) | moved — `adversary.mjs` (`launch gemini`, `read`) and the *Providers* table |

## Phases

### Phase 1 — The script, proved against fake providers
- **Goal:** `adversary.mjs` launches, waits for and reads both providers with every current guarantee, proved by a node suite with fake `codex`/`agy` on `PATH`; the hook and the reference check accept it; nothing calls it yet.
- **Files touched:** `plugin/skills/plan/references/adversary.mjs` (new), `tests/cli/adversary.test.mjs` (new), `plugin/scripts/protect-installed.mjs`, `tests/hooks/hooks.test.mjs`, `scripts/check-structure.sh`
- **Tasks:**
  - Task 1.1: feat(adversary): one script launches, waits for and reads a provider call. The contract above, exported functions behind an `isMain` guard, a usage line on a wrong subcommand (exit 2).
  - Task 1.2: test(adversary): fake codex and agy prove every path. In a temp git repo with fakes logging argv, cwd and stdin: Codex argv equals today's template and `--effort medium` replaces `ESQ_CODEX_EFFORT`; Gemini carries plan mode, settings, schema and json output, runs from the toplevel when launched from a subdirectory (L-01e9c39011), takes `gemini-4-neon-medium` for `--effort medium` only when listed, and spawns nothing on a non-`gemini-*` model or a missing flag; a relative `--attach` from a subdirectory reaches each provider after the prompt, an unreadable one spawns nothing; a gate not `on`, a failed or empty git dir (outside a repository, and a fake `git` printing nothing) and a `../x` slug each exit 2 with no file created; `read` answers `running`, `ok` with model, `not-run` with the usage-limit line, the `ERROR` envelope's `error.message` from a fake `agy` exiting 1, `{"findings":null}` and `{"findings":[{}]}` as schema violations, and `timed out after 1 s` on a fake that sleeps past `--bound`-sized launch bound 1; `wait --bound 1` exits 0 with markers and 124 without.
  - Task 1.3: fix(hooks): a mutation word inside a token is not a mutation. `MUTATION` matches `rm`, `mv`, `cp`, `ln`, … only as a whole shell word (not inside `rm-old-cache`), and the hook suite adds the one-line launch with a hyphenated slug, a prompt body mentioning `rm -f` and `>>`, and the `wait`/`read` forms, all not denied, beside the existing denials, which still deny.
  - Task 1.4: fix(audit): a skill's script reference must resolve too. `check-structure.sh` check 4 resolves `references/<name>.mjs` as it does `.md`.
- **Verification:**
  - `(auto)` `node --test tests/cli/adversary.test.mjs` — every launch, refusal, read, schema, wait, model-variant, attach and timeout case passes
  - `(auto)` `node --test tests/hooks/hooks.test.mjs` — the hook suite passes: the one-line forms pass and every existing denial still denies

### Phase 2 — Every command calls the script; one place holds each rule
- **Goal:** plan, ideas, review and grill launch, wait and read through `adversary.mjs`, the provider references are retired, the Gemini probe runs the script, and a real agy call proves the read-only layers hold.
- **Files touched:** `plugin/skills/plan/references/adversary.md`, `plugin/skills/plan/references/codex-adversary.md` (deleted), `plugin/skills/plan/references/gemini-adversary.md` (deleted), `plugin/skills/plan/SKILL.md`, `plugin/skills/ideas/SKILL.md`, `plugin/skills/ideas/references/adversary.md`, `plugin/skills/review/SKILL.md`, `plugin/skills/review/references/adversary.md`, `plugin/skills/grill/SKILL.md`, `plugin/skills/grill/references/adversary.md`, `scripts/probe-gemini-readonly.sh`, `scripts/probe-codex-plan.sh`, `.claude/skills/skill-authoring/SKILL.md`
- **Tasks:**
  - Task 2.1: refactor(plan): the adversary kit calls adversary.mjs. `plan/references/adversary.md` gains the *Providers* table (gate, model variable, read-only layer, effort meaning) and the three one-line forms; *Waiting for a call* and § 5 shrink to `wait` and `read`; § 1–2 launch with `launch`; the two provider references are deleted; `plan/SKILL.md`'s gate line (`:77`) and "Commit and stop" step 0 (`:399`) load and cite `adversary.md` alone.
  - Task 2.2: refactor(ideas,review,grill): each lifecycle keeps its parameters, prompt, merge point and record. Each `references/adversary.md` names its `launch` line (with `--effort`/`--attach` where it has them) and merges through `wait`/`read`; each `SKILL.md` gate line loads `plan/references/adversary.md` and its own file only; `ideas/SKILL.md:167` keeps only that a provider call is not a subagent, pointing to its reference.
  - Task 2.3: refactor(probe): probe-gemini-readonly.sh runs the script. The call goes through `adversary.mjs launch gemini` (absolute schema, from the scratch repo, `ESQ_GEMINI=on` in its env); a refused precondition (`meta.stage`) stays exit 2; checks 3–4 run whenever a call was spawned; checks 2 and 5 read the envelope it leaves. `probe-codex-plan.sh`'s header and `skill-authoring`'s provider-kit sentence name the script.
- **Verification:**
  - `(auto)` `git grep -nE 'codex-adversary\.md|gemini-adversary\.md|codex exec|agy -p' -- plugin .claude scripts ':!plugin/skills/plan/references/adversary.mjs' ':!scripts/probe-codex-plan.sh'` — no match: no skill, doc or probe names a retired reference or renders a provider command outside the script (`probe-codex-plan.sh` runs the real `codex` through `/esq:plan` itself and names it only to find it)
  - `(auto)` `scripts/probe-gemini-readonly.sh` — exits 0 with five PASS lines: through the script, agy read and answered and could neither write nor run a command (one agy call, ≤300 s, the user's own Google account); exit 2 or 1 leaves this phase unverified
  - `(auto)` `./scripts/audit.sh` — Clean: every `.md` and `.mjs` reference a skill names resolves, the plugin validates, and the product suites (the adversary and hook suites included) pass

## Risks
- **Pre-mortem: the likeliest way the user gets nothing is a script that works on fakes and fails against the real CLIs** (flag order, a stdin `agy` ignores). The fakes assert today's exact argv, and Phase 2's real-agy probe runs through the script; Codex's real call is first observed on the next gated run, and its `not-run` line names the cause rather than failing silently.
- **A model still renders around the script** (adds `cd`, hoists paths). The one-line forms are the only commands the references show, and the hook suite covers them.
- `docs/ARCHITECTURE.md` (`:19`) still says `/esq:plan` alone calls the providers through `codex-adversary.md`; `/esq:arch` is the user-triggered follow-up, as is `/esq:spec`.
- Sessions running an older installed plugin keep the old references until restarted; the release after landing says so.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-26

**Plan committed at:** 81ca513

**Commits:** d625b0e, 1e5a951, f947edc, cbaf11c

**Verified:** cbaf11ce048406b875d7014cf866761627ceeb16
- `node --test tests/cli/adversary.test.mjs`
- `node --test tests/hooks/hooks.test.mjs`

**What got built:** plugin/skills/plan/references/adversary.mjs launches (refusing before any write on gate, git dir, slug/call, schema or attach), waits for and reads Codex and Gemini calls with every current read-only layer, a .meta.json and an always-written .exit; read returns one schema-validated result per provider. The hook passes its one-line forms and check-structure resolves .mjs references.

**Verification:**
- (auto) node --test tests/cli/adversary.test.mjs — 9 pass (argv, effort, variant, attach, refusals, read reasons, schema, timeout, wait)
- (auto) node --test tests/hooks/hooks.test.mjs — 44 pass, the one-line forms included and every existing denial still denying

**Surprises / decisions made during execution:** Mutation-checked per the testing-pitfalls module: forcing workspace-write, skipping the gate and ignoring the timeout each turned its test red (3 of 9), restored; the old hook fails the new hook case (43/44). launch exits 3 on a refused provider precondition (not in the plan text) so a background notification tells it apart from a provider failure. Codex reasons pick the last ERROR line of .err, since its real last line is the token count.

**Backlog candidates:** None.

**For Phase 2:** 1. Call forms: node <refs>/adversary.mjs launch <provider> <slug> <call> <schema> <bound> [--effort e] [--attach f] <<PROMPT; wait <slug> <call> <providers…> [--bound s]; read <slug> <call> <providers…>. 2. Gates must be exported as ESQ_CODEX=on / ESQ_GEMINI=on in the env the script sees (the probe must set ESQ_GEMINI=on). 3. read reports model per provider; lifecycle record blocks should use it instead of the model variable.

### Phase 1 — reverified 2026-11-27

**Reverified by:** adversary-one-script-fixes item 5

**Verified:** 4b3cba4088328871fbff4214ca4cccb4e56824f4
- `node --test tests/cli/adversary.test.mjs`

### Phase 2 — completed 2026-11-26

**Plan committed at:** d44706a

**Commits:** fb6635f, 20b7f4a, 0b77bca, 6c98d03

**Verified:** 6c98d03befa2e0e9e26273e7fa560af875f7f32d
- `git grep -nE 'codex-adversary\.md|gemini-adversary\.md|codex exec|agy -p' -- plugin .claude scripts ':!plugin/skills/plan/references/adversary.mjs' ':!scripts/probe-codex-plan.sh'`
- `scripts/probe-gemini-readonly.sh`
- `./scripts/audit.sh`

**What got built:** plan, ideas, review and grill launch, wait and read through adversary.mjs: plan's adversary.md holds the Providers table and the three one-line forms, each lifecycle keeps only its launch line, prompt, merge point and record, codex-adversary.md and gemini-adversary.md are gone, and probe-gemini-readonly.sh proves the script's own Gemini call read-only.

**Verification:**
- (auto) git grep for retired references and provider commands outside the script — no match (after repair 6c98d03)
- (auto) scripts/probe-gemini-readonly.sh — exit 0, PASS 1-5 with real agy 1.5.18, gemini-4-neon-high, through adversary.mjs
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), the adversary and hook suites included

**Surprises / decisions made during execution:** Repair 1/3: the removal grep matched the Providers table and skill-authoring, which spelled the codex command while describing its read-only layer; both now name the layer (-s read-only, ephemeral) without the command (6c98d03).

**Backlog candidates:** None.

**For Phase 3:** Last phase. The first real Codex call through the script is observed on the next gated run; docs/ARCHITECTURE.md:19 and docs/SPEC.md still describe the retired references (/esq:arch, /esq:spec).
