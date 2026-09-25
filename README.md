# esquisse

*Esquisse* is French for the sketch before construction. It is a Claude Code
plugin for shipping features people actually value, with beautiful, thoughtful
design and a reviewable trail. It aims to keep the full cost of delivery — model
tokens and calls, tool turns, elapsed time and user interruptions — proportionate
to that value, while preserving correctness and user authority. Plans and work
records live in your repository, so a fresh session can pick up where the last
one stopped.

**The usual path:** `/esq:plan` → `/esq:build` → `/esq:review` → `/esq:land`.
Corrections happen when the review finds them. Smaller work can use `/esq:work`
without a plan; uncertain scope can start with `/esq:grill`. Nothing pushes.

## Install

Requirements: Claude Code with plugin support, Node.js and Git. The plugin CLI
uses Node built-ins and has no npm dependencies. Bash and GNU `timeout` are also
needed for this repository's development and release scripts.

Clone this repository locally, then register its marketplace in Claude Code:

```bash
git clone https://github.com/jeffjrare/esquisse-public.git ~/code/esquisse
```

```text
/plugin marketplace add ~/code/esquisse
/plugin install esq@esquisse
```

The marketplace contains one plugin, `esq`. Claude Code installs `plugin/` and
exposes its skills as `/esq:<name>`. Restart Claude Code after an update to load
the installed version in a fresh session. For development, preview the checkout
without installing it with `claude --plugin-dir ./plugin`. Maintainer updates are
described under [Updating the local installation](#updating-the-local-installation).

## Getting started

For a feature with clear scope, run these in your project (use the plan path that
`plan` actually returns):

```text
/esq:plan add CSV export to the invoices screen
/clear
/esq:build docs/plans/<date>-invoice-export.md
```

Repeat `build` in fresh sessions for the remaining phases, or use
`/esq:autopilot <plan>` to delegate them. Each phase has a deliverable and explicit
verification. A plan records its `Branch` and `Origin`; work is built on that
branch and later lands where it started.

For observed UI states, build keeps reusable captures or rendered excerpts linked
from the execution log so review can reopen them later. Human confirmations remain
valid without an extra screenshot; missing evidence is reported separately from a
visually incorrect result.

After implementation:

```text
/clear
/esq:review docs/plans/<date>-invoice-export.md
```

Follow the review's next action: fix mechanical findings, plan substantive work,
or settle a decision that needs your authority. Once the unit is ready:

```text
/esq:land docs/plans/<date>-invoice-export.md
```

For uncertain scope, run `/esq:grill <idea>` first and pass its brief to `plan`.
Grill proposes a useful outcome from the user's present friction; plan carries it
through UX choices, architecture tradeoffs and a first usable delivery. Ordinary
design omissions are resolved during planning, within the accepted constraints.
Plans keep relevant decisions and verification, without migrating unrelated historical
registry entries. Corrective procedures and decision-record formats load only when needed.
One viable approach is enough; alternatives must improve the outcome within the constraints.
Architecture refreshes use applicable decisions and report changes with short reasons and links.
For an unfamiliar codebase, `/esq:status` or the `harvest`, `spec` and `arch`
commands can help on demand; none is a mandatory setup sequence. In `spec`,
« Je ne sais pas — montre-moi où » shows the documented rule, observed behavior
and user consequence, then asks only the missing choice. Unresolved rules remain
unchanged; settled edits survive without certifying a complete refresh. A tiny edit
that needs no workflow record can use ordinary Claude Code.

### Small changes without a plan

Run `/esq:work B-007` or `/esq:work fix the typo in the sign-in error`. Free text
is captured in the backlog before sizing. Trivial work is verified and committed,
then closed in a separate backlog commit. `/esq:work … route` captures and sizes
an item without implementing it.

For an independent review, use `/esq:review <full-code-commit-hash>` or a
`<base>..<tip>` range. Do not use bare `HEAD` after the backlog close: it names
the bookkeeping commit. If review finds 🟢 items, `/esq:fix <brief>` verifies
them and returns a range ending at its last fix commit; 🔴 needs your decision,
while 🟡 goes to `plan`. A clean plan-less review ends there: it records no plan
coverage and does not offer `land`, which operates on planned shipping units.

## How esquisse works

Esquisse is a plugin, not a service or a separate database. **Models handle
judgment:** which problem matters, what experience to design, how to implement
it, what a test proves and when a decision belongs to the user. **Local code
handles repeatable facts:** parsing records, assigning IDs, checking branch and
verification state, and enforcing merge boundaries. Its runtime has four pieces:

| Piece | Where | Responsibility |
|---|---|---|
| Model-driven skills | `plugin/skills/<name>/SKILL.md` | The `/esq:*` commands: understand the goal, make design and scope judgments, and decide when user authority is needed. |
| Deterministic CLI | `plugin/bin/esq` and `plugin/lib/` | Parse plans and ledgers, assign IDs, check branches and review coverage, preserve verification evidence, and perform safe local merges. It answers structured questions rather than making product choices. |
| Project records | `docs/plans/`, `docs/BACKLOG.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` and Git | Keep the plan, decisions, committed work and execution log available to the next session. |
| Hooks | `plugin/hooks/hooks.json` and `plugin/scripts/` | Protect the installed plugin, validate changed ledgers on stop, and record optional usage counters. They do not decide whether a feature is good. |

In a planned run, `plan` commits the plan on a new shipping branch. `build`
implements one phase and records what its verification proved. `review` assesses
the delivered goal and code independently; findings may enter a bounded
correction loop. `land` checks the *whole* branch's unit, reuses valid proof or
runs what is still owed, then merges locally into the plan's recorded origin.
It may first commit backlog closures whose delivery it can cite. It never
publishes or pushes.

`scripts/audit.sh` tests this repository during development and is not a step
every project must run. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the detailed component and
flow contracts.

## What esquisse optimizes for

**Ship high-value features with beautiful, thoughtful design.** Prioritize work
that solves a meaningful user problem, improves an experience people actually use,
or unlocks a valuable capability. Judge success by the value delivered and the
quality of the experience. Visual hierarchy, typography, coherent styling,
interaction and feedback are part of that outcome.

Time and model budgets should go toward that product value. esq aims to make
delivery faster, simpler and less interruptive by removing unnecessary process
and repeated work. Correctness, data integrity and user authority remain required.

- **Treat tokens like money.** Count the whole workflow: model calls, context
  loaded and re-sent, tool round trips, subagents, elapsed time and repeated work.
  A shorter prompt helps, but so does avoiding a redundant agent or a second
  verification of an unchanged result. Each extra step must justify its cost.
- **Do not buy the same answer twice.** Reuse valid verification evidence; read
  only the context the task needs and retain it; batch independent reads; carry
  durable state between fresh sessions. Announce bounds before spending. Resolve
  a known blocker before paying another worker to rediscover it.
- **Use code for deterministic work, models for judgment.** The CLI owns parsing,
  IDs, ledger cells and structural invariants. The model owns scope, design,
  severity and implementation choices. Repeating a mechanical operation through
  model reasoning spends more and makes its result less predictable.
- **Keep progress within the agent's mandate.** Read, run and investigate what the
  repository can answer. Ask the user for missing intent, priority or authorization
  that changes the outcome, scope, constraints or consequential cost/risk. Technical
  uncertainty alone is work to do. A user decision gets distinct options, their
  consequences and an executable next action. Safety refusals remain explicit;
  telemetry, model probes and research registries never gate delivery.
- **Make verification earn its cost.** Match checks to the change and the failure
  they can catch. Do not stack reviews or audits of audits for reassurance, or
  enforce wording for its own sake. Test behavior and parsed contracts; retire
  controls whose purpose disappeared. A different implementation is a finding
  only when it loses an outcome or causes a current failure.
- **Invest in the experience; trim unnecessary generality.** Plan and build
  polished, accessible interfaces with clear flows and considered loading, empty,
  error and success states. Give design work an observable outcome and review it
  as part of the feature. Use the smallest workflow that delivers that outcome;
  fewer words, tests or agents help only when product quality holds.

This is why the normal path has one review, `check` is optional, inline fixes need
no plan artifact, and corrective work has a bound. These are design commitments,
not a claim of measured savings for every task. [CLAUDE.md](CLAUDE.md) carries the
contributor rules that apply this philosophy to changes in esq itself.

## Commands

| Command | Purpose | Main result |
|---|---|---|
| `/esq:grill <idea>` | Resolve scope and consequential choices before planning | A brief in `docs/plans/` |
| `/esq:plan <brief-or-task>` | Design the work and its verifiable phases | A plan committed on its shipping branch |
| `/esq:build <plan>` | Implement and verify one phase, then stop | Task commits and an execution-log entry |
| `/esq:review <plan-or-commit-or-range>` | Assess the delivered goal, correctness, security, UX and design | Review findings; a corrective brief when needed |
| `/esq:fix <fixes-brief> [--accept B-NNN,...]` | Apply safe corrections or record explicitly accepted findings | Verified fix commits and updated findings |
| `/esq:land <plan>` | Verify readiness and merge the unit into its recorded origin | A local merge or an explained refusal; never a push |
| `/esq:check <plan>` | Diagnose missed tasks, divergence and unplanned work phase by phase | A report and corrective brief; no review coverage |
| `/esq:work [item-or-text] [route]` | Investigate one item; execute it if trivial, otherwise recommend its method | Capture if needed; code commit and backlog close for inline work |
| `/esq:backlog [text-or-IDs]` | Capture, list, prioritize and update tasks; `publish` exports them | `docs/BACKLOG.md` |
| `/esq:sweep` | Reconcile backlog items against evidence of delivery | Backlog closures; questions only for unresolved cases |
| `/esq:roadmap [plan-or-edit]` | Show and refresh the queue; `plan` derives its order | `docs/ROADMAP.md`; backlog priority/rank updates when ordering |
| `/esq:advance [Now-entry-or-B-NNN]` | Work the roadmap's `Now` items and plan substantive work | Inline fixes and plans; stops before building |
| `/esq:autopilot <plan>` | Build remaining phases sequentially, one worker per phase | Code and execution logs |
| `/esq:converge <plan-or-fixes-brief>` | Run review → fix, or resume an existing brief | Readiness report; no merge |
| `/esq:epic [new title-or-slug]` | Group a theme spanning several plans and backlog items | `docs/epics/<slug>.md` |
| `/esq:worktree [name-or-action]` | Create, list, remove or merge linked worktrees | Separate working directories and reserved backlog ID blocks |
| `/esq:status` | Orient without changing anything | Plan, backlog, pending briefs, roadmap and next action |
| `/esq:harvest` | Recover decisions from the code, history and discussion | `docs/DECISIONS.md` |
| `/esq:spec` | Describe the product's live features and business rules | `docs/SPEC.md` |
| `/esq:arch` | Refresh architecture and project instructions from the code | `CLAUDE.md`, project skills and `docs/ARCHITECTURE.md` |
| `/esq:ui [--greenfield <brief-or-copy>]` | Inspect an existing interface, or explore one before implementation | Two rendered directions, a comparison page and a planning brief |

These commands run in your project. They are not this repository's development
audit scripts. In every example, use the actual paths reported by the preceding
command. `review` and `check` require an explicit target and ask for one when
omitted.

The two-generation corrective bound limits new plans. Safe document or prospective plan corrections can still pass through `fix` → `review` → `land`, with historical execution evidence preserved and new proof appended. `fix --accept B-NNN,...` records only the user's explicit acceptance of those findings as `Dropped`, with what remains unfixed; it neither certifies delivery nor bypasses verification.

## Sessions and models

### Mode discipline

Use a fresh context between planning, implementation and assessment. The skills
write their own artifacts; Claude Code's plan mode can prevent those writes and
is not required to run the esq planning skill. Follow each command's mode guidance.

### Model recommendations

Workers request Opus. `status`, `backlog`, `epic`, `sweep` and `worktree` declare
Sonnet; `autopilot`, `converge` and `advance` inherit the session model and request
Opus for their workers. A requested model is not proof of the effective model:
if the host does not honor it, the worker may inherit the session model.

No model probe, telemetry record or `docs/EVIDENCE.md` file is a prerequisite for
using esq. A fresh project can start without any of them.

## Review, correction and landing

Review covers the original objective as well as the code. `check` is available
when you need a deeper phase-by-phase reconciliation, but it cannot certify that
a review occurred.

| Finding | Next action |
|---|---|
| 🔴 Missing user authority | Choose an option first; red takes precedence over other findings |
| 🟢 Mechanical, contained correction | `fix` applies and verifies it |
| 🟡 Substantive change | `plan` defines the work |
| Clean | Report the result and, for a planned unit, proceed toward landing |

### Closing the loop — `/esq:converge`

A plan entry runs **review → fix**, with at most two itinerary workers. Fix is
skipped when there are no 🟢 findings. An existing brief resumes at fix. Decision
application may spend an additional worker, announced separately.

| Entry and result | What converge may report |
|---|---|
| Review is clean | Review coverage recorded; ready to land if the remaining readiness checks pass |
| A review brief's fixes are verified and nothing remains open | Correction coverage recorded under `plan(converged):`; ready to land, without claiming a second review |
| A check brief, or a brief with unreadable provenance | Fixes applied, no review coverage; `/esq:review <plan>` is still owed |

Open decisions or substantive findings prevent a ready verdict. Converge never
merges. It does not re-review its fix commits: verified correction coverage and
an independent reading of corrected code are different claims.

### Landing — `/esq:land`

Landing checks the whole branch's shipping unit, not just the named plan. Plans
must be complete or explicitly abandoned; live findings and promised backlog
work must be disposed of; review coverage must be valid. Branch ownership,
recorded origin and working-tree cleanliness are checked before merging.

`esq gate verify` reuses recorded PASS results only while their provenance still
holds, then identifies what must run. The merge engine reads `Branch` and `Origin`
from the plan itself and checks the destination checkout again before writing.
Conflicts needing judgment are handed back with an attended recovery action.
Nothing pushes or publishes a release.

A remaining limitation: if verification succeeds but the merge is refused, the
next landing attempt may run that verification again.

Build can repair an unrunnable verification command when the step unambiguously states its artifact and criterion. It preserves that criterion, records the amendment and proves the corrected command; land does not substitute commands or transfer old proofs.

### Manual verification and interrupted work

A manual step needs an observation of the stated behavior, not a rewritten test
or a promise to check later. An unconfirmed step leaves the phase paused. An open
same-unit defect can also pause a phase; neither is a completed phase.

Resume with `/esq:build <plan>`. It uses the durable log and existing commits to
finish what remains. A diagnosed blocker is resolved through the CLI's pause
protocol; a failed check is investigated, not turned into a question about which
technical cause the user prefers.

## Keeping track of work

| Artifact | Role |
|---|---|
| `docs/plans/*.brief.md` | Scope and corrective findings passed between commands |
| `docs/plans/*.md` | Goal, completion conditions, phases, verification and execution log |
| `docs/BACKLOG.md` | Tasks with permanent `B-NNN` IDs |
| `docs/DECISIONS.md` | Decisions and the cited authority behind them |
| `docs/ROADMAP.md` | Ordered `Now`, `Next`, `Later` work and the reason for that order |
| `docs/epics/<slug>.md` | A theme joining several plans and backlog items |
| `docs/SPEC.md` | The live product as users experience it |
| `docs/ARCHITECTURE.md` | Components, boundaries and implementation rules |

Backlog statuses are `Open`, `Planned`, `Needs-decision`, `Done` and `Dropped`.
Use `backlog` to capture or edit an item and `sweep` to reconcile delivery.
`work` takes one item; without an argument it prefers actionable work from the
roadmap, then falls back to backlog priority.

`/esq:roadmap plan` derives the order; bare `/esq:roadmap` refreshes state without
silently re-planning it. A completed plan does not ship an open covered item:
roadmap checks its acceptance before recommending reconciliation, and sweep
closes it only with evidence of the whole outcome, including post-plan conditions.
Status, backlog and roadmap distinguish explicitly parked work from execution,
showing its reason and restart condition beside the unchanged canonical status.
Planned means associated with a plan; it does not mean work is running.
When discussing one entry, roadmap and status offer `/esq:advance <slug>` for
eligible work in that Now entry; an explicit whole-Now request keeps `/esq:advance`.
`/esq:advance` walks `Now`, or one named `Now` entry,
respecting dependencies and existing plans. It uses one worker per eligible item,
at most one new plan per entry, decision workers when needed and one final
roadmap refresh. It stops before building and returns to the starting branch
between items. It never runs concurrent writers on the same working tree.

`/esq:epic new <title>` creates a theme. Tag work with `epic:<slug>` and use
`/esq:epic <slug>` to see the current plans and backlog rows joined by that slug.

## Parallel sessions — worktrees

Use separate Git worktrees for independent sessions:

```text
/esq:worktree feature-b
/esq:worktree ls
```

Open the reported directory in another terminal. Each tree has its own working
files and a reserved backlog ID block. IDs are permanent; neither allocation nor
merge renumbers existing citations.
Removing a worktree keeps any block witnessed by backlog IDs on a retained local
branch unavailable to new worktrees. Reopening that branch reserves a fresh block
for new items; existing IDs stay unchanged. An unused block can be reused.

For an attended merge, run `/esq:worktree merge feature-b` from the intended
destination checkout, or name the destination with `into <branch>`. Planned units
can use `land`, which locates the checkout holding the recorded origin.

The merge engine reconciles backlog and decision ledgers. It distinguishes an
existing item edited on both branches from two independently allocated items with
the same ID; the latter requires user resolution. Other conflicting files remain
ordinary Git conflicts. It does not regenerate `arch` or `spec` during a merge.

The repository's `scripts/worktree.sh` provides terminal `new`, `ls` and `rm`
operations; `/esq:worktree` also works in projects without that helper script.

## Deterministic CLI

The distributed `plugin/bin/esq` supplies structured reads and mutations:

```bash
esq state
esq validate
esq review scope docs/plans/<plan>.md
esq review scope <base>..<tip>
esq brief plan docs/plans/<fixes>.brief.md
esq telemetry summary
```

These examples use placeholders; supply actual paths or Git refs. `review scope`
takes a positional plan, range or commit, not `--range` or `--commit` flags.
`brief plan` resolves `plan`, `range` and `finder` from the brief's provenance;
`brief depth` separately answers the corrective generation and its bound.

`state` keeps the roadmap's projected order/text separate from `roadmap.entries[].live`
backlog statuses, including Done/Dropped. A mixed closed/open entry is valid; free-form
roadmap freshness is unassessed. Each entry also returns its existing `acceptance`
text (or null), so orientation retains restart conditions without another read.
`epics[].rows` compares explicit projected Backlog
status bullets with the same live ledger and reports mismatches or unknowns. These
reads never refresh projections; no Git-history lookup or model call is added.

The CLI owns ledger IDs, status cells, plan logs, branch checks and merge safety.
Most results are JSON; `telemetry summary` defaults to a human-readable report
and also accepts `--json`.

Skills resolve `esq` from the plugin's `PATH`, then use
`"$CLAUDE_PLUGIN_ROOT/bin/esq"` if needed. If neither runs they report the problem
and stop; they do not reconstruct deterministic operations by hand. To inspect
CLI behavior from this checkout, use `./plugin/bin/esq`.

## Native hooks

- **PreToolUse:** protects the installed plugin from direct edits.
- **Stop:** first checks whether structured ledgers changed. Only then does it
  validate them; it does not run the development audit. Its blocking correction
  opportunity is bounded, and active background work prevents this validation.
- **PostToolUse / SubagentStop / Stop / SessionEnd:** record optional local usage
  telemetry. Stored records contain counters and validated identifiers, not
  prompts, responses, tool inputs or source content.

Set `ESQ_TELEMETRY=off` in the environment before starting Claude Code to disable
telemetry writes. Telemetry never authorizes or blocks delivery.

## Contributing

Read [CLAUDE.md](CLAUDE.md) for the project's goals and editing rules. Source lives
in `plugin/`; installed files are not source. Preview with
`claude --plugin-dir ./plugin` rather than editing the plugin cache.

Run checks proportionate to the change and one final audit:

```bash
./scripts/audit.sh
```

This includes structural references, package validation, the no-push contract,
parsed-format conformance, manifest agreement, the bounded runner and the CLI,
hook and corpus-helper tests. Node suites are discovered by convention and run
inside the audit; do not run them a second time alongside it on the same tree.
A pending release is reported, not treated as a product regression.

For release or packaging changes, add `--release`. For research tools or their
fixtures, add `--lab`. Flags add checks without repeating the base pass:

```bash
./scripts/audit.sh --release --lab
```

Release tests use disposable repositories and isolated configuration; they do not
update your real installation. The lab pass uses fixtures and replay, not billed
model calls. See [docs/AUDIT.md](docs/AUDIT.md) for semantic reading and
[docs/CONFORMANCE.md](docs/CONFORMANCE.md) for the small set of parsed formats.
Checks enforce working references and code contracts, not preferred prose.

## Updating the local installation

After the intended changes are verified, committed and on `main`, run from this
repository:

```bash
./scripts/update.sh
```

The router refuses a dirty tree or a branch other than `main`. It asks
`check-release-version.sh` whether the plugin changed since its version bump:

- **A release is needed:** `release-local.sh --patch` requires a primary checkout,
  checks that Claude's `esquisse` marketplace resolves to this local checkout,
  bumps both manifests, proves that only their versions changed, commits the bump,
  then invokes the official Claude plugin updater. It verifies installed version,
  release commit and bytes. Restart Claude Code after success.
- **No release is needed:** show `release-local.sh --check` and exit without
  installing. This does **not** mean the installed plugin matches the checkout;
  read the reported version, commit and byte comparison.
- **The verdict is missing, malformed or its command fails:** refuse. Report and
  release failures propagate instead of printing a success message.

The router runs no audit; verification must already have passed. It never pushes,
switches branches or commits unrelated work. The release's only installation
write is the official `claude --bare plugin update esq@esquisse --scope user --yes`
call, with closed stdin and a timeout. Nothing edits `~/.claude/` directly.

For a read-only installation report at any time:

```bash
./scripts/release-local.sh --check
```

This report exits zero even when the installation differs or cannot be read; its
exit code is not an installation certificate. If an install fails after a bump
commit, that commit remains. Follow the updater's printed retry command rather
than making another release to retry the same installation.

If you move or clone the repository, Claude may still use the old directory.
The release refuses before changing versions when that happens; `--check` also
reports the registered source. From the intended checkout, reconnect it and
install the version already committed:

```bash
claude --bare plugin marketplace add "$PWD" --scope user </dev/null
claude --bare plugin update esq@esquisse --scope user --yes </dev/null
./scripts/release-local.sh --check
```

## Operations

| Tool | Use |
|---|---|
| `scripts/audit.sh [--release] [--lab]` | Development verification with optional release and research-fixture passes |
| `scripts/check-plugin.sh` | Official plugin validation, syntax, hooks and skill frontmatter |
| `scripts/check-structure.sh` | Command, section, brief and reference-path resolution |
| `scripts/check-conformance.sh` | Template tokens consumed by retained parsers |
| `scripts/check-release-version.sh . --json` | Manifest agreement and whether source changes need a release |
| `scripts/update.sh` | Route a verified local checkout to release, or report without installing |
| `scripts/release-local.sh --check` | Read source and installation state without changing either |

Research remains optional. `probe-model-pins.mjs`, `smoke-work-capture.mjs` and
`smoke-journeys.mjs` have live paths that make billed model calls; run them only
intentionally. `measure-wait-cost.mjs`, `measure-rereads.mjs` and
`cost-budgets.mjs` inspect local usage. None is a product prerequisite or part of
the default audit. Historical harness observations live in
[docs/EVIDENCE.md](docs/EVIDENCE.md); they are not fresh runtime guarantees.

### Measured cost per command — 2026-08-19

Historical subagent baseline, retained because `scripts/cost-budgets.mjs` reads
its budget column. **These measurements predate the simplified workflow and
prompt compression. They do not measure the current release or promise savings.**
“Confirmed” here means at least five token-bearing runs in that historical
sample, not a current model or behavior certification.

**Subagent runs** — historical sample:

| Command group | Runs | Status | Median out tok | Median duration | Budget (out tok / duration) |
|---|---|---|---|---|---|
| `esq:apply` | 3 | provisional | 8.1k | 2m09s | — |
| `/esq:build` | 33 | confirmed | 28.9k | 7m02s | 43.5k / 10m45s · n=33 · 2026-08-19 |
| `/esq:check` | 13 | confirmed | 6.7k | 2m03s | 10.5k / 3m15s · n=13 · 2026-08-19 |
| `/esq:fix` | 11 | confirmed | 5.5k | 2m08s | 8.5k / 3m15s · n=11 · 2026-08-19 |
| `/esq:review` | 13 | confirmed | 13.6k | 3m24s | 20.5k / 5m15s · n=13 · 2026-08-19 |
| `/esq:roadmap` | 1 | provisional | 194 | 6s | — |
| `/esq:work` | 5 | confirmed | 14.4k | 4m43s | 22.0k / 7m15s · n=5 · 2026-08-19 |

Budgets are 1.5 times the historical median, rounded upward. The tool compares
current confirmed subagent samples with those budgets; a breach needs
interpretation, not an automatic product stop. Direct-session durations include
human waits and are not compared. `esq:apply` is an internal worker label, not a
slash command. Missing or provisional samples do not establish a cost claim.

## License

MIT — see [LICENSE](LICENSE). Contributions and forks welcome.
