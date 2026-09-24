# esquisse — CLAUDE.md
<!-- last-arch: 2026-09-22 @ d876e355d71131d635ffcfd14780322a54b64361 -->

esquisse is a Claude Code plugin (`esq`): twenty-one skills, a dependency-free CLI and four hook handlers (five events) running a
plan → build → review cycle over Markdown ledgers in `docs/`. This repo is also its marketplace. How it is built — components,
flows, the why behind every rule below — is `docs/ARCHITECTURE.md`.

## What esq is for

**A framework that is fast, facilitating and non-blocking, whose output is the maximum of shipped features a
user actually values.** That is the maximand. The rest are constraints on it, never rivals to it:

1. **Never block.** A command answers what it can answer and does the work itself. A stop is earned only when
   the answer lives in the user's head — intent, priority, a tradeoff on their constraints — never when it is
   in the repo, reachable by reading, running or reasoning. **No research instrument, measurement registry or
   telemetry reading ever gates delivery.**
2. **Spend tokens like money** — § Cost is a requirement below, on every change.
3. **Deterministic where it can be, model where it must be.** The CLI owns structure, IDs, cells and
   invariants; the model owns judgment. Work moved from the model to a local script is won twice: cheaper,
   and repeatable. Work left to the model that a script could settle is paid again on every run.
4. **Design quality is part of the feature**, not a layer on it. The right-sizing pass trims generality; it
   never trims design.
5. **A guard earns its place by catching a defect, not by existing.** A check that verifies *a sentence is
   present* is not a check; one that verifies *a reference resolves*, or *a format the code parses is intact*,
   is. There is no check of a check, and no policing of prose.

## Critical rule

**Never modify anything under `~/.claude/` directly.** It is installation state, never source; the source is `plugin/skills/`,
the only corpus since 2026-09-22. Rollback is git for this repository and `claude plugin` for the installed package. For plugin
development, load the local package without installing it: `claude --plugin-dir ./plugin`.

**One sanctioned exception, and it never opens a path there for writing:** `./scripts/update.sh` puts a verified `main` into
service through the official `claude plugin update` call alone. It publishes rather than verifies. Read
`docs/ARCHITECTURE.md § Boundaries not to cross` before touching it, or before adding anything else that reaches into
`~/.claude`.

## Repo structure

```
plugin/   ← the distributed plugin: skills/<name>/SKILL.md (source of truth), bin/esq + lib/ (deterministic CLI), hooks/ (four
            handlers, five events), standards/STANDARDS.md (the default arbitration referent `esq standards` resolves, under a
            project's own docs/STANDARDS.md where it speaks)
scripts/  ← audit.sh, the lanceur: one `run` helper every check goes through, which propagates the check's exit code.
            check-structure.sh + the few remaining checks; check-bounded.sh (the node runner); update.sh and release-local.sh
            (the laptop release, reached by `--release`); worktree.sh; lib/; the research instruments — probes, measures,
            captures — reached by `--lab` and never by the default pass
tests/    ← node --test suites, discovered conventionally. Product pass: tests/{cli,hooks,audit}. Lab pass (`--lab`):
            tests/{capture-schema,smoke,journeys,probe,measure,cost-budgets}. Each owns its fixtures/.
docs/     ← SPEC.md (what it does for users, /esq:spec) · ARCHITECTURE.md (how it is built, /esq:arch) · DECISIONS.md ·
            BACKLOG.md (the task ledger) · ROADMAP.md (the ordered queue) · epics/ (join key: slug) · plans/ (plan files,
            *-fixes.brief.md, *.log.md) · baselines/ (frozen) · CONFORMANCE.md (the formats the code parses, and the
            behaviors that must survive a migration) · AUDIT.md (the non-mechanical reading pass) · EVIDENCE.md (maintainer
            harness notes, append-only by hand — nothing in the product reads it)
```

## Verification: each phase runs what its change earns; the final phase runs `./scripts/audit.sh`

A phase runs the checks its change earns, and a change crossing packages (skills, scripts, CLI) earns broader ones — never a
standalone check beside an audit that runs it. The final phase names `./scripts/audit.sh`, runs it, and records its genuine PASS
in `esq plan append-log`'s `verified` block; `/esq:land` reuses that PASS or runs the audit once.

**`./scripts/audit.sh` runs the node product suites itself. Never run `node --test` again beside it on the same tree.** Its two
flags *add* a pass, they never re-buy the base one: `--release` runs the packaging and release checks, `--lab` runs the research
fixture suites. Neither belongs in the frequent path.

It is mechanical only: two commands handling one case *differently* is `docs/AUDIT.md`'s pass. A step's verdict never depends on
which implementation of an ambient tool the shell resolves, and a sweep is judged against the property it describes, never the
matches its command returned.

## Cost is a requirement, not a nice-to-have

**Every change is audited for what it spends — tokens, subagents, wall-clock, redone work — whether or not the change is about
cost.** Four questions, on every change, of which the first catches the expensive class:

1. **What does this re-run that already succeeded?** Paid work done twice is the costly failure, never the new work.
2. **Is the bound stated before spending?** A worst case named afterwards is a bill, not a bound.
3. **Does this resume into a stop?** If the halt reason is still in the artifact the next step reads, resuming buys a full agent
   to be told what you know.
4. **What was the human's judgment silently supplying?** Automating a manual step inherits the written rule and none of the
   unwritten one.

A command that runs long states its bound before its first tool call. That is an instruction to honor, not a linted string.

## Model policy

Workers are spawned with `model: opus`. If the session runs on a cheaper model and that field is not honored, the worker
inherits the session's model. **That is a fact to report in one line, never a stop**, and nothing measures it on the user's
behalf — no preflight, no registry, no assertion after a spawn.

## Resolving the CLI

Skills call `esq` from `PATH`, which the plugin populates. When `PATH` does not resolve it, the distributed binary is
`"$CLAUDE_PLUGIN_ROOT/bin/esq"` — use it. A stop is earned only when **neither** runs, which means the CLI is genuinely absent
or unusable. **There is no prose fallback that recomputes a ledger, a branch verdict or a context budget by hand**; those paths
were removed on 2026-09-22 and are not to come back.

## Where the rest of the rules live

- **Editing or adding a skill** (`plugin/skills/`, the README command table) — the project skill `skill-authoring` carries the
  contract: frontmatter, mandate guard vs `disable-model-invocation`, the named load a split skill owes at every branch, what an
  entrypoint cites rather than recites, the one exhaustive README table.
- **Editing `scripts/audit.sh` or any check** — `audit-scripts`: every check goes through `run`, which propagates its exit code
  and prints its output; **every non-zero code fails the pass, exit 2 included** — a selected check that cannot read its own
  inputs has not answered, and a verdict withheld on purpose exits 0 instead; a check verifies a resolvable reference or a
  parsed format, never a sentence; there is no check of a check and no opt-out registry to maintain.
- **Editing `plugin/bin`, `plugin/lib`, `plugin/scripts`, `hooks.json` or `tests/`** — `plugin-runtime`: the CLI owns structure
  and never judgment; hooks are bounded, non-blocking and store numbers, never content; suites are discovered by convention,
  never listed by hand.
- **Before changing what a skill reads or writes in `docs/`**, or the order in which `/esq:fix` stages, verifies and records,
  read `docs/ARCHITECTURE.md § docs/ — ledgers and projections` — one writer per file, with one recorded exception:
  `**Verified:**` is written by `/esq:build` *and* by `/esq:fix` through `esq plan record-verification`, so every reader returns
  every block a phase records rather than its first. `/esq:fix` may also make a safe prospective plan correction above
  the execution log, preserving intent, branch/origin, phase identity and historical evidence (D-bounded-correction-exit-preserves-proof). A recording item's path is chosen **before** its verification runs — stage →
  `git write-tree` → one run → judge the criterion → commit the fix → record and commit the proof. `esq validate` blocks the stop
  on a ledger it cannot parse, and the Stop hook asks it only when the registry paths are actually dirty.
- **Before touching subagent spawning or telemetry**, read `docs/ARCHITECTURE.md § Billing a subagent` — the `esq:<command>`
  description prefix is the only subagent join key, and `plan:<slug>` in that same description is the only plan identity. Direct
  rows are keyed `(sessionId, segment)` and never pooled with subagent rows; every row carries `repoKey`. **Telemetry is
  optional and non-blocking: `ESQ_TELEMETRY=off` is answered before any work, and no telemetry reading ever authorizes or
  refuses a step.**
- **Before adding a step that re-reads a file the run has already read, that issues two tool calls where one turn would do, or
  that waits on something the run launched**, read `docs/ARCHITECTURE.md § Rules` — the round trip is the unit this system is
  billed in: independent read-only calls go out together, anything ordered is chained in one call, and **git mutations are never
  issued side by side**. A command's own bookkeeping is one commit; implementation commits stay one per task.
- **Before filing a backlog row for a defect in code this shipping unit changed**, or before touching how a phase pauses or
  repairs a diagnosed failure, read `docs/ARCHITECTURE.md § Rules` — *out of scope* means outside the unit (every plan recording
  the same `**Branch:**`), not outside the phase: fix it in the task's commit or pause with `blockedBy`. `esq plan append-log`
  refuses a `completed` entry while such a row stands, and the one way out of the pause is `esq plan resolve-block`. A pause is
  classified by its `⏸` glyph. Rows are filed and closed only through `esq backlog add` / `set-status`.
- **Before adding anything that merges or pushes**, read `docs/ARCHITECTURE.md § Boundaries not to cross` — `esq merge land`
  opens the plan file itself and takes both refs from its header, `**Branch:**` as the source and `**Origin:**` as the
  destination, both through `safeRef`; a shipping unit lands on the branch it started on, and a plan missing either field is
  refused rather than repaired. A unit lands only when every plan on its branch is built or recorded abandoned through
  `esq plan abandon`. Nothing in `plugin/` runs or spells a push.
- **Before writing a `-fixes` plan, or changing what a finder's `→ Next` offers**, read `docs/ARCHITECTURE.md § Rules` — a
  corrective chain opens two generations and no more; every consumer asks **`esq brief depth`** for the generation and its
  `open`/`exhausted` verdict, rather than counting suffixes.
- **`esq brief plan <fixes-brief>` is a different verb and the only place a `/esq:fix` run gets its target.** It reads the
  brief's own `Source:` and answers three fields: `plan` (the stem it corrects, resolved by slug beside it), `range` (set
  instead, when that `Source:` names commits rather than a plan — a review of a change with no plan file), and `finder`
  (`check` or `review`, which is what stops `/esq:converge` certifying a unit no reviewer read). It must keep **refusing,
  never ranking** — a `Source:`/filename disagreement, two candidates, or no plan carrying the slug.
- **Before authoring a question, a 🔴 or a `docs/DECISIONS.md` entry**, read `docs/ARCHITECTURE.md § Rules` — ask only for a
  named, unrecorded authority that would change the product outcome, the scope, a major architecture commitment, a stated
  constraint or an unauthorized cost or risk; a failure or missing evidence is a diagnosis with its action, never a choice
  between causes. An entry authorizes by the `**Fondement:**` citation it names and by nothing else.
