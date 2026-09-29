# Prove the opted-in Codex adversary end to end in /esq:plan

**Branch:** esq/codex-adversary-in-plan

**Origin:** main

## Context
Corrective plan for `/esq:review` findings on `codex-adversary-in-plan` (brief
`docs/plans/2026-09-28-codex-adversary-in-plan-fixes.brief.md`, B-186). Phase 1 shipped the Codex counter-plan and
pre-mortem in `/esq:plan`, but only the two schema smokes ran: no opted-in plan run has shown the counter-plan launched,
killed when late, or the `Adversary (codex` block landing in a plan commit body. The two 🟢 fixes this depends on have
landed (6ec9aea gate read in a shell call, ac31c38 `timeout: 600000` on the pre-mortem call), and both were found by
reading, which is exactly why a run is owed.

## Goal
The maintainer can re-run one command that performs a real opted-in `/esq:plan` on a throwaway repository and says, per
property, whether the Codex path worked; no user-facing behavior changes, it protects the feature's first Done bullet
(`ESQ_CODEX=on` users see the counter-plan verdict and accepted-finding counts) from shipping broken.

## Done looks like
- One recorded opted-in `/esq:plan` run on a scratch target, whose plan commit's `git log -1 --format=%b` carries the
  `Adversary (codex` block, and whose final report carries the `Codex:` line.
- The same run shows the counter-plan was launched before the pre-mortem, never received Claude's plan, and — being
  deliberately late — was stopped and recorded `not returned`, with no Codex process left behind.
- Any defect the run exposes in `codex-adversary.md` or the plan skill is fixed on this branch and the run repeated green.

## Approaches considered
- **A — a maintainer probe script driving headless Claude with a `codex` shim (chosen).** `scripts/probe-codex-plan.sh`
  builds a throwaway git repo, puts a `codex` shim first on `PATH`, and runs `claude -p --plugin-dir ./plugin` with
  `ESQ_CODEX=on` on a one-line task, credentials isolated per `docs/headless-trial.md`. The shim logs each call's
  arguments and stdin; for the counter-plan call (argument names `codex-counter-plan.schema.json`) it sleeps past the
  run, so kill-on-late is forced rather than hoped for; for the pre-mortem it `exec`s the real `codex` with the
  arguments unchanged, so `-C`, `-o`, stdin `-` and the effort flag meet the real CLI. Cost: one headless Claude plan
  run and one low-effort Codex call per invocation, repeatable after any fix.
- **B — the user runs `/esq:plan` by hand with `ESQ_CODEX=on` in a scratch project.** Cheapest to write, but the
  counter-plan usually returns during investigation, so kill-on-late stays unobserved, and a regression later needs a
  human to repeat it. Loses on the brief's own "kills it when late" property.
- Rejected detail: faking the pre-mortem too. The schema smokes never ran `-C`, `-o` and stdin together against the real
  CLI; that is the one Codex-side surface still unproved, so the pre-mortem stays real.

## Recommendation
A. The probe is a research instrument (CLAUDE.md § Map: probes reached only by maintainers, never gating delivery): it
is **not** wired into `./scripts/audit.sh` or `--lab`, because every run spends Claude and Codex money. It reuses the
headless recipe's isolation (temporary `CLAUDE_CONFIG_DIR` holding a copied credential, `--no-session-persistence`,
hooks off, `ESQ_TELEMETRY=off`), so nothing under `~/.claude/` is written. Bound, stated before spending: one call,
`--max-budget-usd 5`, outer `timeout --signal=KILL 1200`, `ESQ_CODEX_EFFORT=low`; no automatic retry.

## Security notes
The probe sends only the throwaway repository and its one-line task to Anthropic and OpenAI under the maintainer's own
logins. The credential is copied into a `mktemp -d` config dir (mode 700) removed by an `EXIT` trap and never printed;
`ANTHROPIC_API_KEY` / `CLAUDE_CODE_OAUTH_TOKEN` are unset for the child. The shim's logs hold only the scratch repo's
prompts and live under the probe's result dir, outside the esq working tree.

## Phases

Single phase: the probe, its run, and any fix the run exposes.

### Phase 1 — Record an opted-in plan run with a late counter-plan
- **Goal:** one green probe run proves launch, blindness, kill-on-late, the commit-body block and the report line.
- **Files touched:** `scripts/probe-codex-plan.sh` (new); `plugin/skills/plan/references/codex-adversary.md` and
  `plugin/skills/plan/SKILL.md` only if the run exposes a defect.
- **Tasks:**
  - Task 1.1: add `scripts/probe-codex-plan.sh`, the opted-in `/esq:plan` end-to-end probe. It:
    - makes a `mktemp -d` scratch repo on `main` with one committed `cli.js` and `package.json`, and a result dir
      beside it (both printed at start, kept on failure, removed on success);
    - writes the `codex` shim: every call appends `argv` and a copy of stdin to `<result>/codex-calls.log`; a call
      naming `codex-counter-plan.schema.json` writes `<result>/counter.started`, then `exec sleep 1500` under a
      recognisable `argv[0]`; any other call `exec`s the real `codex` found on the original `PATH`;
    - runs `claude --plugin-dir "$REPO/plugin" -p "/esq:plan Add a --version flag to cli.js that prints the version from package.json"`
      in the scratch repo, flags per `docs/headless-trial.md` except tools: `--allowedTools` and `--tools`
      `Bash,Read,Write,Edit,Grep,Glob,Skill,TaskStop`, `--permission-mode dontAsk`, env `ESQ_CODEX=on`,
      `ESQ_CODEX_EFFORT=low`, `ESQ_TELEMETRY=off`, the shim dir first on `PATH`, output `stream-json` to the result dir;
      `claude --help` is read before writing the flags, and any the installed CLI lacks is dropped with a comment;
    - asserts, each printed `PASS`/`FAIL <what was seen>`, exit 0 only if all pass:
      1. the counter-plan call precedes the pre-mortem call in `codex-calls.log`;
      2. the counter-plan stdin contains no `## Phases` and no `docs/plans/<date>-` plan path (blind);
      3. `git -C <scratch> log -1 --format=%b` contains `Adversary (codex config` and `counter-plan: not returned`
         (config: `ESQ_CODEX_MODEL` is unset);
      4. the stream's final result text contains a line starting `Codex:`;
      5. no process whose command line carries the shim's sleep marker is alive after the run.
    - prints exit, elapsed seconds and the reported cost (`unknown` when absent, never 0).
  - Task 1.2 (only if the run fails an assertion for a skill defect, one commit per defect): fix it in
    `codex-adversary.md` or `plugin/skills/plan/SKILL.md`, e.g. `fix(plan): <defect>`. A failure caused by the probe
    itself is fixed in Task 1.1's script instead, as its own commit. Re-run the probe after each fix; at most two
    re-runs, then stop and report the failing assertion with its evidence rather than a third spend.
- **Verification:**
  - `(auto)` `scripts/probe-codex-plan.sh` — exits 0 with five `PASS` lines; launched with the Bash tool's
    `run_in_background: true` (it can exceed the 600 s foreground cap) and outside the sandbox (provider network, per
    `docs/headless-trial.md`); the execution log records elapsed seconds, cost and the scratch commit body's
    `Adversary` block verbatim
  - `(auto)` `./scripts/audit.sh` — PASS: product checks and suites unaffected by the new script and any skill fix

## Risks
- **Pre-mortem (why this proof is not used):** the probe costs a few dollars per run, so nobody re-runs it after the
  next edit to `codex-adversary.md`, and the proof goes stale. Answer: it is one command with its bound printed, and
  B-186's closing and this execution log name it for the next editor; re-running stays a maintainer choice, never a
  gate (CLAUDE.md rule 1).
- The headless run may not reach the plan commit: `/esq:plan` can stop on an ambiguity question with no
  `AskUserQuestion` in `-p`. The task is chosen to be unambiguous; a stop is a probe FAIL on assertion 3, diagnosed from
  the stream, not retried blindly.
- `run_in_background` Bash tasks and `TaskStop` inside `claude -p` may behave differently than interactively (the session
  can end before a stop). Assertion 5 catches a leftover; if the cause is the headless host rather than the skill, it is
  recorded as such and the interactive path stays unproved — reported, not papered over.
- Unproved by design: the path where the counter-plan **returns** and is kept/merged. It reads one JSON file; the
  original plan's 3-cycle observation on real opted-in runs covers it.
- Codex quota or login failure makes the pre-mortem `not run`; assertion 3 still needs the `Adversary` block, which the
  reference writes on failure too, so the probe still discriminates.

## Open questions
None: spending is bounded above and announced by the script before launch; the brief settled what must be observed.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-09-28

**Plan committed at:** 73f1ed5

**Commits:** 66ffd73

**Verified:** 66ffd732dabf194fee788bf515ecd6a0d516aa89
- `scripts/probe-codex-plan.sh`
- `./scripts/audit.sh`

**What got built:** scripts/probe-codex-plan.sh: a maintainer-only probe that runs one real headless opted-in /esq:plan on a throwaway repo behind a codex shim (late counter-plan forced, pre-mortem on the real Codex CLI) and judges five properties; not wired into audit.sh or --lab.

**Verification:**
- (auto) scripts/probe-codex-plan.sh — exit 0, 5/5 PASS on the first run, background, outside the sandbox; claude exit 0, 97 s, 0.437 USD (reported); report line `Codex: counter-plan not returned (stopped once the review was done); pre-mortem 2/3 accepted.`; plan commit body verbatim: `Adversary (codex config): / counter-plan: not returned — still running when the pre-mortem ended / F1 accepted criterion-does-not-prove — the test ignored the CLI's exit status / F2 accepted criterion-does-not-prove — a hardcoded version would have passed / F3 rejected criterion-does-not-prove — Node realpaths the bin symlink; a package install is out of scope`
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), exit 0

**Surprises / decisions made during execution:** - Assertion 2 (blind) is judged as: no `## Phases` in the counter-plan prompt AND no plan file under docs/plans when it was launched (the shim records it), not as a grep for a `docs/plans/<date>-` path: codex-adversary.md requires the prompt to name `docs/plans/<today>-<slug>*` as the path NOT to read, so the literal grep would red on the prompt the reference mandates. The chosen check is at least as strict about the property (the plan did not exist yet).
- Assertion 4 accepts a Markdown list/quote/backtick prefix before `Codex:` (the report is Markdown); the observed line started with `Codex:` bare.
- Claude's Bash tool re-sources ~/.bashrc, which prepends ~/.local/bin (the real codex), so the shim is also re-prepended via CLAUDE_ENV_FILE; a zero-cost dry run with a fake `claude` proved interception before any spend.
- --add-dir "$REPO/plugin" added beside --restricted so the file tools can read the skill's references.
- Task 1.2 not executed: no assertion failed, so no skill defect to fix. B-186 closed Done (ca47b0d) before this entry, from this run's evidence.
- Kill-on-late is proved on the headless host only; the interactive TaskStop path is covered by the same skill text but was not observed interactively.

**Backlog candidates:** None.

**For Phase 2:** Last phase — no next phase. Re-run scripts/probe-codex-plan.sh by hand after any edit to plugin/skills/plan/references/codex-adversary.md (≈0.5 USD, ~2 min).
