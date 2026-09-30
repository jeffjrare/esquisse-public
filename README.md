# esquisse

*Esquisse* is French for the sketch before construction. It is a Claude Code
plugin that takes a feature from idea to merged code — **plan → build → review →
land** — with thoughtful design and a reviewable trail. Plans, backlog and decisions
live as Markdown in your repository, so a fresh session picks up where the last
one stopped.

- **It asks only what only you can answer.** Intent, priority and tradeoffs on your
  constraints come to you; anything it can find by reading, running or reasoning, it
  settles itself.
- **Design is part of the feature.** UI work is planned with its empty, loading,
  error and success states, and reviewed as part of the delivery.
- **Every phase is verified.** Each plan phase has a deliverable and an explicit
  check, and the result is recorded in the plan.
- **Nothing pushes.** Work lands with a local merge into the branch it started from.
  Publishing stays in your hands.

## Install

You need Claude Code with plugin support, Node.js and Git. The plugin has no npm
dependencies.

In Claude Code:

```text
/plugin marketplace add jeffjrare/esquisse-public
/plugin install esq@esquisse
```

Restart Claude Code. The commands appear as `/esq:<name>`. To pick up a new
version later, run `/plugin marketplace update esquisse`, then restart.

Want to hack on esquisse itself? Clone the repository and see
[docs/MAINTAINING.md](docs/MAINTAINING.md).

## Your first feature

Run these in your project, clearing context between steps. Use the plan path that
`plan` reports:

```text
/esq:plan add CSV export to the invoices screen
/clear
/esq:build docs/plans/<date>-invoice-export.md
```

`plan` reads the codebase, writes a plan with verifiable phases and commits it on a
new branch. `build` implements **one** phase, runs its verification and records
what it proved. Repeat `build` for the remaining phases, or hand them all to
`/esq:autopilot <plan>`.

Then review and land:

```text
/clear
/esq:review docs/plans/<date>-invoice-export.md
/clear
/esq:land docs/plans/<date>-invoice-export.md
```

`review` checks both that the goal was delivered and that the code is sound.
`land` confirms the whole branch is ready, then merges it locally into the branch
the plan started from.

**Not sure what to build yet?** Start with `/esq:grill <idea>`. It questions you
until the scope is clear and writes a brief that `plan` picks up. For a product with
no UI yet, it suggests `/esq:ui --greenfield` to put rendered design directions on
screen before any code.

**Small change?** `/esq:work fix the typo in the sign-in error` records the item,
sizes it, and — when it is truly small — makes the change, verifies it and commits,
with no plan. Anything bigger gets the exact next command instead. A real run:

```text
✔  work — B-078 · ⚠️ debt [med?] · verdict: inline · done · 59s

  ✔ reads as    The only head pipeline left under pipefail was an unused function in scripts/worktree.sh.
  ✔ sizing      One file, four lines deleted, no design choice.
  ✔ applied     ccff966               removed the unused main_worktree()
  ✔ verified    bash -n passes, no references left, ./scripts/audit.sh clean (7 checks)
  ✔ closed      B-078 → Done
  ○ if you disagree  keep the function and rewrite it without head, if you plan to call it soon

→ Next: /esq:work
```

**New to a codebase?** `/esq:status` orients you without changing anything.
`/esq:spec`, `/esq:arch` and `/esq:harvest` write a product spec, an architecture
map and a decision record on demand; none is a required setup step.

## Commands

| Command | Purpose | Main result |
|---|---|---|
| `/esq:grill <idea>` | Resolve scope and consequential choices before planning | A brief in `docs/plans/` |
| `/esq:plan <brief-or-task>` | Design the work and its verifiable phases | A plan committed on its own branch |
| `/esq:build <plan>` | Implement and verify one phase, then stop | Task commits and an execution-log entry |
| `/esq:review <plan-or-commit-or-range>` | Assess the delivered goal, correctness, security, UX and design | Review findings; a corrective brief when needed |
| `/esq:fix <fixes-brief> [--accept B-NNN,...]` | Apply safe corrections or record explicitly accepted findings | Verified fix commits and updated findings |
| `/esq:land <plan>` | Verify readiness and merge the work into the branch it started from | A local merge or an explained refusal; never a push |
| `/esq:check <plan>` | Diagnose missed tasks, divergence and unplanned work phase by phase | A report and corrective brief; no review coverage |
| `/esq:work [item-or-text] [route]` | Investigate one item; do it now if trivial, otherwise recommend the method | Code commit and backlog close for small work; otherwise the next command |
| `/esq:backlog [text-or-IDs]` | Capture, list, prioritize and update tasks; `publish` exports them | `docs/BACKLOG.md`; `publish` writes a CSV, and a Google Sheet when a connector is available |
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
| `/esq:ui [--greenfield <brief-or-copy>]` | Inspect an existing interface, or explore one before implementation | A rendered recommended direction (two in `--greenfield`, or when the choice is yours), a comparison page and a planning brief |

In every example, use the actual paths the previous command reported. `review` and
`check` need an explicit target and ask for one when it is missing.

## How it works

esquisse is a plugin, not a service or a database. **The model handles judgment:**
which problem matters, what experience to design, how to implement it, what a test
proves and when a decision belongs to you. **A small local CLI handles the
repeatable facts:** parsing records, assigning IDs, checking branch and
verification state, and merging safely.

| Piece | Where | Responsibility |
|---|---|---|
| Skills | `plugin/skills/<name>/SKILL.md` | The `/esq:*` commands: understand the goal, make design and scope judgments, decide when your authority is needed |
| CLI | `plugin/bin/esq` and `plugin/lib/` | Parse plans and ledgers, assign IDs, check branches and review coverage, keep verification evidence, perform safe local merges. It answers structured questions; it makes no product choices |
| Project records | `docs/` in your project, and Git | Keep plans, decisions, committed work and the execution log available to the next session |
| Hooks | `plugin/hooks/hooks.json` and `plugin/scripts/` | Protect the installed plugin, validate changed records when a session stops, and keep optional local usage counters |

Skills pre-approve exactly one tool: the plugin's own CLI (`Bash(esq *)`), so
bookkeeping never waits on a permission prompt. Every other tool stays under your
permission settings.

### What lands in your repository

| File | Role |
|---|---|
| `docs/plans/*.brief.md` | Scope and review findings passed between commands |
| `docs/plans/*.md` | Goal, phases, verification and the execution log |
| `docs/BACKLOG.md` | Tasks with permanent `B-NNN` IDs |
| `docs/DECISIONS.md` | Decisions and the authority behind each one |
| `docs/ROADMAP.md` | Ordered `Now`, `Next` and `Later` work, with the reason for each position |
| `docs/epics/<slug>.md` | A theme joining several plans and backlog items |
| `docs/SPEC.md` | The live product as users experience it |
| `docs/ARCHITECTURE.md` | Components, boundaries and implementation rules |

Backlog statuses are `Open`, `Planned`, `Needs-decision`, `Done` and `Dropped`.

## Review, fixes and landing

Review covers the original goal as well as the code. Each finding is sorted by who
has to act on it:

| Finding | What happens next |
|---|---|
| 🔴 Needs your decision | You pick one of the options it presents; red comes first |
| 🟢 Mechanical, contained fix | `/esq:fix` applies and verifies it |
| 🟡 Substantive change | `/esq:plan` defines the work |
| Clean | The work moves on toward landing |

`/esq:converge <plan>` runs review → fix for you and reports whether the work is
ready; it never merges. `/esq:check` is an optional, deeper phase-by-phase
reconciliation; it does not count as a review.

Corrections are bounded: a piece of work gets at most two corrective plans. Past
that, safe fixes still go through `fix` → `review` → `land`, and
`fix --accept B-NNN,...` records your decision to leave named findings unfixed — as
`Dropped`, never `Done`, and without skipping verification.

**Landing** checks the whole branch, not just the named plan: plans complete or
explicitly abandoned, findings dealt with, review done, working tree clean. It
reuses verification that still holds and runs only what is owed, then merges
locally. Conflicts that need judgment come back to you with a recovery action.
When the feature needs more than a merge to reach users — a migration, an
environment variable, a restart — the plan's rollout steps are listed in the
landing report under **To reach users**. esquisse shows them; it never runs them.

**Manual checks** need an actual observation of the stated behavior. An
unconfirmed manual step leaves the phase paused; resume with `/esq:build <plan>`,
which picks up from the log and existing commits.

**Reviewing work without a plan:** `/esq:review <full-commit-hash>` or
`<base>..<tip>`. Avoid bare `HEAD` after `/esq:work`: the last commit is then the
backlog update, not the change. A plan-less review ends at its findings; `land`
only operates on planned work.

## Backlog, roadmap and epics

- `/esq:backlog <text>` captures an item; `/esq:work` takes one item at a time and,
  with no argument, picks the top of the roadmap.
- `/esq:roadmap plan` orders the open work and records why each item sits where it
  does; bare `/esq:roadmap` refreshes state without reordering. A finished plan does
  not close its items by itself: `/esq:sweep` closes one only with evidence of its
  whole outcome.
- `/esq:advance` works the roadmap's `Now` items — one worker per item, at most one
  new plan per entry — and stops before building.
- `/esq:epic new <title>` creates a theme; tag work with `epic:<slug>`.

## Parallel sessions

Use separate Git worktrees for independent sessions:

```text
/esq:worktree feature-b
/esq:worktree ls
```

Open the reported directory in another terminal. Each tree has its own working
files and its own block of backlog IDs, so two sessions never hand out the same ID.
Merge with `/esq:worktree merge feature-b` from the destination checkout, or use
`land` for planned work. The merge reconciles the backlog and decision records; other
conflicts stay ordinary Git conflicts.

## Sessions and models

### Mode discipline

Use a fresh context (`/clear`) between planning, building and reviewing. The skills
write their own files, so Claude Code's plan mode is not needed and can block those
writes.

### Model recommendations

Workers request Opus. `status`, `backlog`, `epic`, `sweep` and `worktree` declare
Sonnet; `autopilot`, `converge` and `advance` use your session's model and request
Opus for their workers. A requested model is not a guarantee: if the host does not
honor it, the worker runs on your session's model.

## Privacy and options

- **Telemetry** is local and optional: counters and validated identifiers only —
  never prompts, responses, tool inputs or source code. Set `ESQ_TELEMETRY=off`
  before starting Claude Code to turn it off. It never blocks or authorizes anything.
- **Hooks** protect the installed plugin from direct edits and, when a session stops
  after changing a record, validate it once.
- **Codex as a second opinion (opt-in).** With `ESQ_CODEX=on`, `/esq:plan` asks the
  local `codex` CLI for a blind counter-plan and a pre-mortem of the written plan.
  Claude judges both against the code; they never block the plan. **Opting in sends
  the goal text and whatever Codex reads in your repository to OpenAI under your own
  Codex login.** Set it per project in `.claude/settings.json`:

  ```json
  { "env": { "ESQ_CODEX": "on", "ESQ_CODEX_MODEL": "gpt-6-astra", "ESQ_CODEX_EFFORT": "high" } }
  ```

  The model and effort are optional; unset, `~/.codex/config.toml` applies. A missing
  or failing `codex` costs one `Codex: not run — <reason>` line.

## Design principles

- **Value first.** Judge success by the value delivered and the quality of the
  experience — hierarchy, typography, interaction and feedback included.
- **Treat tokens like money.** Count the whole workflow: model calls, context,
  tool round trips, subagents, elapsed time and repeated work. Reuse verification
  that still holds; never pay twice for the same answer.
- **Code for facts, models for judgment.** The CLI owns IDs, records and structural
  checks; the model owns scope, design and implementation choices.
- **Ask only for real authority.** Technical uncertainty is work to do, not a
  question. A decision that is yours comes with options, consequences and a runnable
  next step.
- **Verification earns its cost.** Checks match the change and the failure they can
  catch — no audits of audits.

These are design commitments, not a claim of measured savings on every task.

## Contributing

Read [CLAUDE.md](CLAUDE.md) for the project's goals and editing rules, and
[docs/MAINTAINING.md](docs/MAINTAINING.md) for the audit, release and research tools.
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) describes how the pieces fit.

## License

MIT — see [LICENSE](LICENSE). Contributions and forks welcome.
