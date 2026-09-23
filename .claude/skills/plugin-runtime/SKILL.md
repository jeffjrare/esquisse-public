---
name: plugin-runtime
description: Rules for the esq CLI and hooks — read before editing plugin/bin, plugin/lib, plugin/scripts, plugin/hooks/hooks.json, or anything under tests/. Covers what the CLI may own (structure, never judgment), atomic writes and JSON output, hook handler shape and the block-once bound, telemetry data minimization and its opt-out, and how the node suites are discovered.
---

# Plugin runtime — esquisse

`plugin/bin/esq` + `plugin/lib/` and the four hook handlers in `plugin/scripts/` (five events). Reasoning:
`docs/ARCHITECTURE.md § plugin/bin/esq` and `§ plugin/hooks`.

## Rules

- **The CLI owns structure: table/plan parsing, IDs, status cells, log appends, invariants, state, telemetry sums. It never
  chooses — no approach, severity, materiality or scope.** A subcommand that encodes a judgment is rejected even when
  convenient. Extend an existing read-only subcommand in place rather than adding a sibling.
- **`esq plan append-log` refuses a `completed` entry while `esq branch check`'s `unit.open` is non-empty** — the undisposed
  🐛/⚠️ backlog rows whose `Source` names a `build:`/`fix:` step of any plan recording this plan's `**Branch:**`. Three table
  cells and one header field decide it, no severity is judged, and it happens before the plan file is opened so the refusal
  leaves it byte-identical. A paused entry must carry `manualOutstanding`, `blockedBy` or both, and `markdown.mjs` matches the
  `⏸` glyph rather than either clause. The exit from that pause is `esq plan resolve-block`: read-only without `--confirm`, and
  with it re-deriving the unit, the dispositions and the phase's own `(auto)` freshness from the tree, refusing a command it
  could not prove green, and rewriting the entry in one atomic write.
- **`append-log`'s second refusal is provenance: a `completed` entry carrying no `verified` block is refused wherever that
  phase's verification names at least one resolvable `(auto)` command.** The block is `{at, commands}`, `at` the **full** 40-hex
  commit and `commands` the exact strings the worker judged PASS. The block is required, never its contents. `paused` entries
  keep it optional — *why:* `esq gate verify` can only reuse a result against a block that exists.
- **`**Verified:**` is the one field with two writers, so every reader returns every block a phase records rather than its
  first.** `esq plan record-verification` appends `/esq:fix`'s proof as its own `### Phase N — reverified <date>` block, and
  attribution is by **exact text identity with the plan's own `(auto)` step** — exactly one match or the verb records nothing.
  The other refusals: an `at` that is not a full commit this repository holds and equal to `HEAD`, a commit whose tree is not
  the caller's own `git write-tree`, an unclean tree, a phase carrying no entry, a plan with no `## Execution log`. Each leaves
  the plan byte-identical and exits 1.
- **`esq brief depth <plan-or-fixes-brief>` answers the corrective generation and nothing else** — `depth`, `nextGeneration`,
  the `bound`, and an `open`/`exhausted` verdict. It reads no file and always exits 0, because the caller asking is
  `/esq:plan` deciding whether to *write* the next file, which therefore does not exist yet. Every consumer asks it rather than
  counting `-fixes` suffixes.
- **`esq brief plan <fixes-brief>` is the separate verb that resolves a target**, and the only place a `/esq:fix` run gets one.
  From the brief's own `Source:` it answers `plan` (the stem, resolved by slug among the brief's siblings and validated against
  that line), `range` (set instead of `plan` when the `Source:` names a commit range — a review with no plan file), and
  `finder` (`check`/`review`/`null`). It refuses — never ranks — a `Source:`/filename disagreement, two candidates, or no plan
  carrying the slug, and falls back to the filename alone when no `Source:` is readable. **Only a `Source:` that itself names a
  range makes a brief plan-less**; none of the three refusals is relaxed by that case. It must keep answering after the brief is
  deleted from the caller's hands.
- **Every fact a landing reads is a read-only CLI answer, and each harmless list is defined once and deliberately different:**
  `PROVENANCE_HARMLESS` (projection freshness and review `coverage`) and the gate's command-owned lifecycle list (which admits
  `docs/DECISIONS.md` and, inside the plan section, leaves out exactly `**Reviewed at:**` and `**Abandoned:**`). Never merge
  them and never widen either for convenience — a path added to a harmless list is verification `/esq:land` silently skips.
  `tests/cli/landing.test.mjs` and `gate.test.mjs` pin the invalidations; extend them with the list.
- **Node built-ins only; `git` is the one external process** — the plugin is dependency-free by contract; the
  `NODE_ENV=test` + `ESQ_TEST_GIT_ROOT` seam replaces git in tests.
- **Every file write goes through `atomicWrite`** (temp file beside the target, same mode, rename) — a half-written ledger is a
  broken stop for every later session.
- **Output is JSON, one object, via `output()`; errors are `{error}` on stderr with exit 2; `validate` exits 1 on findings.** A
  read whose audience is a person at a terminal and off which no skill routes — `telemetry summary` — prints a report by
  default with the same numbers behind `--json`.
- **The backlog status vocabulary is the closed set in `STATUSES`; the ID shape `B-NNN`; `reserveBlock` is the one ID-block
  allocator** — `reserveId`, `esq backlog add`, `/esq:worktree` and `scripts/worktree.sh` all reach it, and it chooses and
  writes `.esq-id-block` inside one exclusive-create lock in the git common directory. A second chooser outside that lock is
  the collision it exists to prevent.
- **Hook handlers export a pure `fn(input, environment)` and run only under `isMain(import.meta.url)`; they read stdin once via
  `hook-io.mjs`** — `tests/hooks` imports the function.
- **The Stop hook is cheap before it is thorough.** It short-circuits on `stop_hook_active`, skips when background tasks or
  crons are live, and **asks the git question first**: if `docs/BACKLOG.md`, `docs/DECISIONS.md` and `docs/plans` carry no
  uncommitted change, it returns without running `validate` at all. Committed defects from earlier sessions are not this
  session's to fix before stopping, and a stop that changed no ledger buys no scan.
- **Telemetry is optional and non-blocking.** Every writer calls `telemetryOptedOut` first, before any work. **No telemetry
  reading ever authorizes or refuses a step** — there is no assertion after a spawn, and no verdict a run waits on.
- **Telemetry stores numbers and ids only — never a prompt, description, tool input or response.** An `AgentLabel` carries a
  closed set of validated fields: the `esq:<command>` slug and, when marked, the plan slug (both from `LABEL_PATTERN`), the
  spawn's `requestedModel` (`MODEL_PATTERN`) and the `repoKey` every row gets — each omitted when it does not match, never
  stored raw. The run-row allowlist (`RUN_ROW_KEYS`) carries `agentId` and admits no prompt, response, tool input, path,
  session identity or code content. Dedupe is the exclusive-create claim file, not scan-then-append, and under it the most
  complete record wins; the file stays append-only. `tests/hooks` has data-minimization tests that fail on a new field carrying
  content.
- **`canonicalPlanSlug` in `hook-io.mjs` is the only definition of the plan-slug stripping** (date prefix, trailing
  uniquifier), and the writer canonicalizes — the reader never does. The CLI builds the join's plan index with that same
  function. **`plan:<slug>` in the spawn description is the only plan identity**; there is no declaration log.
- **The session writer** (`record-session-telemetry.mjs`, Stop async + SessionEnd) reads only the bytes the transcript gained
  since its per-session cursor sidecar, JSON-parses only lines that can carry a marker, runs the shared reducer with
  `readText: false`, and writes one cumulative row per segment the delta touched. `tests/hooks` asserts the bound and "no text
  ever". Any typed command closes the open segment; only a valid `esq:` slug opens one.
- **`plugin/lib` imports from `plugin/scripts` only `hook-io.mjs`'s pure helpers**, and any rule a writer and the reader must
  both apply (`carriesWholeRunUsage`) lives there, never restated in `telemetry.mjs`. `hook-io.mjs` stays built-ins only.
- **A group carries four axes — tokens, tool calls, round trips (`apiRequests`) and duration** — each summed and medianed over
  the runs that carry it; the calls-per-round-trip ratio is summed over the `paired` sub-population carrying *both* counts,
  never a median of per-run ratios, and prints to two decimals. No paired run means `—`.
- **Dedupe lives in the reader:** one record per `agentId`, last row per `(sessionId, segment)`; every token-less run is named
  (`fallbackOnly` / `noUsage` / `zeroUsage`) and enters no token median; `MIN_SAMPLE_RUNS` is a constant stamped as
  `provisional`, never a flag.
- **`esq apply route` reads whether a chosen `do:` may be run by a subagent out of the named skill's own frontmatter** —
  `plugin/skills/<name>/SKILL.md` resolved relative to `cli.mjs`, so one path serves the checkout and the installed plugin — and
  never out of a list written anywhere else. Its three routes are `apply`, `relay`, `stop`; the recognizer is one `/esq:<skill>`
  token at the start with no chaining, and everything it cannot place fails closed to `stop`, never to a spawn. `applied` is
  `true`/`false` only where the arguments name a `B-NNN` and a status from `STATUSES` and `docs/BACKLOG.md` settles it.
- **`esq review scope` answers what a review must read, and its target is positional.** `esq review scope <plan-path>
  [--full]` scopes from the plan's own commits, narrowing a re-review to `<Reviewed at>..HEAD`; `esq review scope <A>..<B>` or
  `esq review scope <ref>` scopes from git alone and needs no plan. There is no `--range` or `--commit` flag. The two are told
  apart by the one thing that cannot be both — a plan is a file that exists on disk — so a mistyped plan path is handed to git
  and reported as git's own miss, never resolved silently against nothing. `--full` belongs to the plan form; on a named range
  it is refused, because a range is already the whole scope.
- **No audit in a PostToolUse hook, no semantic notification in a Stop hook.**
- **Tests are `node --test <dir>/*.test.mjs` — the file/glob form always (a bare directory does not resolve on Node 22 here).
  `scripts/audit.sh` discovers them by convention**: `tests/{cli,hooks,audit}` in the product pass, the lab directories under
  `--lab`. **Never maintain a list of suite paths** — that is how a suite goes unrun. Fixtures for anything that must not count
  as a plugin skill live under `tests/fixtures/`, outside `plugin/`.
- **A measured harness fact carries its Claude Code version and date in the code comment** — it is re-probed per upgrade, and
  an undated fact cannot be retired.

## See also
`docs/ARCHITECTURE.md § Key flows — A build phase at runtime · Billing a subagent`, `README.md § Deterministic CLI` and
`§ Native hooks`.
