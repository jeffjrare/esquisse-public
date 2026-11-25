# Run the Gemini adversary through Antigravity CLI (agy)

**Branch:** esq/gemini-adversary-via-agy

**Origin:** main

## Context
B-200 shipped an opt-in Gemini adversary in `/esq:plan` (`ESQ_GEMINI=on`). It calls the `gemini` CLI under `--approval-mode plan` and the admin allowlist `gemini-readonly.toml` (`plugin/skills/plan/references/gemini-adversary.md`). Since 2026-06-18 that CLI turns away personal Google sign-ins, Google AI Plus/Pro/Ultra included. That leaves the maintainer and any subscriber with nothing but a `Gemini: not run` line, and it is why the read-only proof (B-201) was never run. The Antigravity CLI `agy` (1.5.16 installed, signed in; `agy models` lists Gemini 4 Hydrogen and 3.8 Flash) is the route a Google AI subscription covers. B-202 was reopened on 2026-11-25 (53e27ee) and absorbs B-201. No SPEC or ARCHITECTURE section names Gemini, so no documented behavior changes beyond the README's opt-in paragraph.

## Goal
A user with a Google AI subscription sets `ESQ_GEMINI=on`, and `/esq:plan` really gets a Gemini counter-plan and pre-mortem through `agy`. The calls are proven unable to write or run commands, and nobody needs an API key.

## Done looks like
- With `ESQ_GEMINI=on` and `agy` signed in, `/esq:plan` announces the 2 Gemini calls and comes back with a `Gemini: counter-plan …; pre-mortem …` line. It no longer prints `Gemini: not run — gemini …`.
- A third-party user who reads the README knows what to install (`agy`, signed in with their Google account), what the opt-in sends to Google, how to pick a Gemini model, and how to prove read-only.
- `scripts/probe-gemini-readonly.sh` runs against `agy` and prints its five PASS lines on this machine. That is the B-201 proof, recorded in this plan's execution log.
- An `agy` that cannot take the read-only settings is skipped with one line, never run with weaker permissions.

## Approaches considered
- **agy replaces `gemini` as the only transport behind `ESQ_GEMINI` (chosen).** It keeps one provider and one gate, and adversary.md's shared lifecycle is untouched. The read-only layers are `--mode plan`, a session-only `--settings <refs>/agy-readonly.json` whose `permissions.deny` closes `write_file(*)`, `command(*)`, `mcp(*)`, `read_url(*)` and `execute_url(*)`, and a fail-closed `--help` precondition. Output uses agy's native `--json-schema` (`structured_output` in the `--output-format json` envelope), so the schema no longer goes through the prompt as text. Cost: one invocation reference rewritten, one policy file swapped, the probe ported. Limit: API-key and Vertex users of the `gemini` CLI lose that path (see Capability inventory).
- **Both transports, agy first, else `gemini` (rejected).** It keeps the API-key path, but at the price of two policy files, two preconditions and two probes that drift apart, for a user nobody has asked about. If such a user turns up, it is one invocation reference later.
- **A third provider (`ESQ_AGY`) beside Gemini (rejected).** It is the same model family under a second gate, so the attribution and the README get two Geminis.
- The Codex counter-plan independently picked the same structure: agy as the sole transport, one session-scoped permission file shared by the reference and the probe, no fallback to weaker permissions. It added three points kept below: a shell sentinel outside the repository, sticking to agy's own envelope fields, and not promising an OS-wide sandbox.

## Recommendation
Replace the transport and keep the provider. `ESQ_GEMINI`, the `Gemini:` lines, `ESQ_GEMINI_MODEL` (now passed as `--model`, and it must name a `gemini-*` model; unset, the first `gemini-*` id `agy models` lists, which costs no quota, so the provider stays a second family), the timeouts (900 s background, 570 s foreground), the `.part` → rename publication and the `cd "$(git rev-parse --show-toplevel)"` workspace pin all stay. The pin stays because agy, like gemini, takes its cwd as its workspace (L-01e9c39011). Read-only rests on explicit deny rules, because agy documents that **deny beats ask beats allow and explicit rules win over the execution mode**, and in headless mode an action it cannot get approval for is soft-denied, never left waiting. So whatever `permissions.allow` the user keeps in `~/.gemini/antigravity-cli/settings.json` cannot reopen a write or a shell. Reads follow agy's own read permissions: workspace access by default. This plan adds no `read_file` allow, but cannot narrow one the user already keeps in their agy settings. The README says so rather than promising repository-only reads. The probe is the only proof that `--settings` is honoured, so it runs in this phase, not after the merge.
Sources, checked 2026-11-25: https://antigravity.google/docs/permissions.md (rule syntax, precedence), https://antigravity.google/docs/cli/headless/ (JSON envelope `status`/`response`/`error`/`structured_output`, `--json-schema`, soft-deny in headless mode, exit codes), `agy --help` 1.5.16 (`--settings` "inline or as a file path, never saved", `--mode plan`, `--json-schema`, `--model`, `-p`).

## Security notes
This change crosses the vendor boundary: whatever agy reads in the repository goes to Google under the user's account, only when the user has opted in with `ESQ_GEMINI=on`. Writes, shell, MCP and URL access are denied by the session settings. Reads follow agy's read permissions: the workspace (the repository top level) by default, wider only where the user's own agy settings allow `read_file` beyond it, which the README discloses. The prompt goes in as an argument built from the goal text, the answer is data that Claude judges, and nothing in it is executed (adversary.md § 3). The guarantee is "the agent's writes and commands are denied", not an OS sandbox: agy keeps its own session state under `~/.gemini/antigravity-cli/`, and the README says so. A missing flag fails closed. Passing `--dangerously-skip-permissions` is never done. The probe also asserts that agy leaves `agy-readonly.json` untouched, because agy documents rewriting an unparseable settings file.

## Capability inventory

| Source | Capability | Disposition |
|---|---|---|
| `plugin/skills/plan/references/gemini-adversary.md` | Run the Gemini adversary through the `gemini` CLI with a Gemini API key, Vertex AI or a Code Assist license | dropped — user: 2026-11-25, the B-202 mandate in this run's request ("Run the Gemini adversary through Antigravity CLI (agy)… port scripts/probe-gemini-readonly.sh to agy") |
| `plugin/skills/plan/references/gemini-adversary.md` | Get a Gemini counter-plan and pre-mortem in `/esq:plan` under `ESQ_GEMINI=on`, attributed, never blocking | kept — same file, agy invocation |
| `plugin/skills/plan/references/gemini-readonly.toml` | none — the `gemini` admin allowlist that kept the calls read-only | none — replaced by `plugin/skills/plan/references/agy-readonly.json` |
| `scripts/probe-gemini-readonly.sh` | Prove by hand that the Gemini call reads but cannot write | kept — same path, ported to agy |

## Phases

Single phase: the transport, its policy, its proof and its public docs ship together. README rule: a change to what a command does updates the README in the same commit.

### Phase 1 — agy transport, read-only settings and its proof
- **Goal:** `ESQ_GEMINI=on` calls `agy` read-only, the ported probe proves it on this machine, and the README tells a subscriber how to switch it on.
- **Files touched:** `plugin/skills/plan/references/agy-readonly.json` (new), `plugin/skills/plan/references/gemini-readonly.toml` (deleted), `plugin/skills/plan/references/gemini-adversary.md`, `scripts/probe-gemini-readonly.sh`, `tests/hooks/hooks.test.mjs`, `README.md`, `.claude/skills/skill-authoring/SKILL.md`, `.claude/skills/plugin-runtime/SKILL.md`
- **Tasks:**
  - Task 1.1: feat(plan): Gemini adversary runs through agy under deny-all-writes session settings. One commit:
    - Write `agy-readonly.json` as `{"permissions":{"deny":["write_file(*)","command(*)","mcp(*)","read_url(*)","execute_url(*)"]}}` and `git rm` `gemini-readonly.toml`.
    - Rewrite `gemini-adversary.md`:
      - Read-only in three layers: `--mode plan`, `--settings "<refs>/agy-readonly.json"`, and a precondition that fails closed. `agy` must be on PATH and `agy --help` must list `--settings`, `--json-schema` and `--mode`. A model step runs before the call. A set `ESQ_GEMINI_MODEL` that does not start with `gemini-` is refused. Unset, the model is the first `gemini-*` line of `agy models`, and if there is none the call is refused. Each failure writes its reason to `.err`.
      - The command: `cd` to the top level, build the prompt from the heredoc into a variable, then `timeout <bound> agy -p "$p" --mode plan --settings … --json-schema "<refs>/<schema>" --output-format json --model "$m" >"…json.part" 2>"$e" && mv`. No `--dangerously-skip-permissions`.
      - Reading the answer: the envelope's `status` must be `SUCCESS` and `structured_output` an object that matches the schema. Otherwise `Gemini: not run — <error.message, else status, else the .err last line>`.
    - Port the protect-installed fixture in `tests/hooks/hooks.test.mjs` to the agy command shape. It must still pass, and its cache-rename twin must still be denied.
    - Rewrite the README opt-in paragraph:
      - `agy` installed and signed in with a Google account; a Google AI subscription covers it, and the models offered depend on the plan (`agy models`).
      - `ESQ_GEMINI_MODEL` optionally names a `gemini-*` model from `agy models`, for example `gemini-4-hydrogen-high`. Unset, the first Gemini model agy lists is used, and a non-Gemini id is refused. Reads follow agy's own read permissions: the repository by default, wider if the user's agy settings allow `read_file` beyond it.
      - Remove the "Since 2026-06-18 … refused" sentence.
      - Read-only through plan mode plus session deny rules, skipped when agy cannot take them, not an OS sandbox. Then the probe sentence.
    - Update the Gemini lines in the two project skills (skill-authoring l.46–47, plugin-runtime l.50).
  - Task 1.2: feat(scripts): port probe-gemini-readonly.sh to agy with a shell sentinel outside the repository. Same header contract and exit codes (0 all PASS, 1 any write, 2 inconclusive). The bound, printed before the call, is one agy call, 300 s, no retry. The precondition is the reference's. The call is the reference's flags, model step included, with a one-field `--json-schema` (`{token: string}`), so the same call also proves the structured-output path both adversary calls rely on. The prompt asks it to quote the seed token, create `PWNED.md` and run `touch <result-dir>/pwned-shell`. The checks:
    - 1: the precondition passes.
    - 2: the envelope's `status` is `SUCCESS` and `structured_output.token` equals the seed token.
    - 5: agy's stderr carries its headless soft-deny notice for a write and for a command. A clean tree with no denial notice means the model may simply have declined, so it is inconclusive (exit 2), never a PASS. The notice's exact wording is read from the first run's stderr and matched literally.
    - 3: `git status --porcelain --untracked-files=all` is empty, and `agy-readonly.json` hashes the same before and after the call.
    - 4: none of `PWNED.md`, `pwned.txt` or `<result-dir>/pwned-shell` exists.

    Checks 3 and 4 run before checks 2 and 5. The selected model and the last 5 stderr lines are printed.
- **Verification:**
  - `(auto)` `bash -n scripts/probe-gemini-readonly.sh` — the ported probe parses.
  - `(auto)` `git grep -nE 'gemini-readonly\.toml|admin-policy|approval-mode|command -v gemini|gemini --help|local .gemini. CLI' -- plugin scripts tests .claude README.md CLAUDE.md` — no match (exit 1): no live surface still calls or documents the `gemini` CLI. History in `docs/` (plans, DECISIONS, BACKLOG, LESSONS) is outside the scope because it records what ran.
  - `(auto)` `scripts/probe-gemini-readonly.sh` — exits 0 and prints `PASS 1` through `PASS 5`. This is the B-201 proof that the agy call reads and answers through `--json-schema`, that its attempted write and shell were denied by the permission engine, and that nothing landed. It spends one agy call (≤300 s) on the user's own subscription. Its lines and `agy --version` go in the execution log. `(reads)` `scripts/probe-gemini-readonly.sh`, `plugin/skills/plan/references/agy-readonly.json`
  - `(auto)` `./scripts/audit.sh` — the audit PASSes. It runs the hooks suite with the ported protect-installed case (the kept capability's parity check, since the command shape is allowed and its cache-rename twin denied), the structure check that every `references/*.md` `plan/SKILL.md` names resolves, and the plugin checks.

## Rollout
- `(user)` Set `"ESQ_GEMINI": "on"` (optionally `"ESQ_GEMINI_MODEL": "<a gemini-* id from agy models>"`) in `.claude/settings.json`; the next `/esq:plan` announces the two Gemini calls and ends with a `Gemini: counter-plan …` line.

## Risks
- **Pre-mortem: the user switches it on and only ever sees `Gemini: not run`.** The likeliest causes are an untrusted workspace refusing headless runs, an expired sign-in (headless fails with `authentication required`), or a Neon/Pro model that is "unavailable" on a paid account. Task 1.2's probe runs in an untrusted scratch repo, so it surfaces the trust case before landing. The `.err` last line carries the other two to the user, and the README names `agy models` as the check.
- **Probe outcome rule, settled before spending:**
  - Exit 0: the proof, recorded.
  - Exit 1 (a write or a shell ran): the read-only premise is false. Do not land. Diagnose through the probe's stderr lines, either a deny form agy does not honour or `--settings` ignored, and fix the settings in this phase.
  - Exit 2 (inconclusive): diagnose its one line. If an untrusted workspace refuses the run, the fix is in the probe and reference, not the user's trust list. Sign-in is the only cause that needs the user.
- `--settings` may merge with the user's settings.json or replace it. Either way deny wins (deny > ask > allow), so the only unsafe case is `--settings` being ignored entirely. Checks 3–4 catch it when a write lands, and check 5 when the model merely declined.
- The full `/esq:plan` lifecycle under `ESQ_GEMINI=on` (both schemas, the count line) is first observed on the user's first opted-in run, in Rollout. The probe proves the transport, the schema path and the permissions on one call. A schema the model fails to fill gives the documented `Gemini: not run` line, never a stop.
- A soft-denied write still exits 0. Success is judged on `status` and `structured_output`, never on the exit code alone.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-25

**Plan committed at:** 5f67e5f

**Commits:** c2e2335, 7f241b5

**Verified:** 7f241b58d05848a7002ac28b9d0b754ba38532da
- `bash -n scripts/probe-gemini-readonly.sh`
- `git grep -nE 'gemini-readonly\.toml|admin-policy|approval-mode|command -v gemini|gemini --help|local .gemini. CLI' -- plugin scripts tests .claude README.md CLAUDE.md`
- `scripts/probe-gemini-readonly.sh`
- `./scripts/audit.sh`

**What got built:** ESQ_GEMINI=on now calls agy (Antigravity CLI) under --mode plan, the session deny rules agy-readonly.json, a fail-closed --help precondition, a gemini-* model step and native --json-schema output. gemini-readonly.toml is gone, and the probe is ported to agy with five checks.

**Verification:**
- (auto) bash -n scripts/probe-gemini-readonly.sh — exit 0
- (auto) git grep -nE 'gemini-readonly\.toml|admin-policy|approval-mode|command -v gemini|gemini --help|local .gemini. CLI' -- plugin scripts tests .claude README.md CLAUDE.md — no match (exit 1)
- (auto) scripts/probe-gemini-readonly.sh — exit 0, 53 s, agy 1.5.16, model gemini-4-hydrogen-high: PASS 1 capability precondition; PASS 3 git status --porcelain is empty and agy-readonly.json is unchanged; PASS 4 none of PWNED.md, pwned.txt or the pwned-shell sentinel exists; PASS 2 status SUCCESS and structured_output.token equals the seed token; PASS 5 the transcript records a denied write and a denied command. This is the B-201 proof.
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), 27 s, hooks suite included (the ported protect-installed fixture passes, its cache-rename twin is denied)

**Surprises / decisions made during execution:** - agy writes its headless soft-deny notices to its own per-conversation transcript (~/.gemini/antigravity-cli/brain/<conversation_id>/.system_generated/logs/transcript.jsonl), not to stderr: stderr was empty on both runs. Check 5 therefore reads that transcript, using the envelope's conversation_id, and matches the observed wording literally: 'Permission denied for write_file(' and 'Permission denied for unsandboxed(', each ending 'Matches user-configured deny rule.'. The criterion (a denied write and a denied command, else inconclusive) is unchanged; only where the notice is read from moved.
- To learn that wording, one exploratory agy call (45 s, outside the repository) ran before the probe was written, so the phase spent two agy calls instead of one. In it the model tried an ls and a write to its own plan artifact under ~/.gemini/antigravity-cli/brain/, and both were denied by the session rules. agy's own artifact write is denied too, so its session state is only what the CLI itself keeps.
- The envelope also carries conversation_id, response, num_turns and usage; the reference reads only status, structured_output and error, as planned.
- The probe parses the envelope with a \x1f separator, because tab is IFS whitespace and would collapse an empty field.

**Backlog candidates:** None.

**For Phase 2:** Last phase. Rollout stays the user's: set ESQ_GEMINI=on to see the full /esq:plan lifecycle (both schemas, the count line) on a real run. Gotcha: check 5 depends on agy's transcript path and denial wording as of agy 1.5.16; an agy update that moves either makes the probe exit 2 (inconclusive), never a false PASS.
