# esquisse

*Esquisse* is French for the sketch before construction. It is a Claude Code
plugin that takes a feature from idea to merged code — **plan → build → review →
land** — with thoughtful design and a reviewable trail. Plans, backlog and decisions
live as Markdown in your repository, so a fresh session picks up where the last
one stopped.

## What it optimizes for

**The most shipped features you actually value.** Everything else is a constraint
on that, never a rival to it:

- **Value first.** A plan is written against what the feature is for, and review
  checks that this goal was delivered, not only that the code is sound. Every order
  esq proposes (the roadmap, a suggested priority, the next step) puts what you and
  your users get first; the rest follows common sense.
- **Cost is a requirement.** The whole workflow counts — model calls, context, tool
  round trips, subagents, elapsed time and repeated work — and stays proportionate
  to the value. Verification that still holds is reused; the same answer is never
  paid for twice.
- **It never blocks on what it can settle.** You decide product, architecture and
  design; intent, priority and tradeoffs on your constraints come to you. Anything
  it can find by reading, running or reasoning, it settles itself — and you are
  never its tester. A decision that is yours comes with options, consequences and a
  runnable next step.
- **Design is part of the feature.** Hierarchy, typography, interaction and
  feedback count as value. UI work is planned with its empty, loading, error and
  success states, and reviewed as part of the delivery. Right-sizing trims
  generality, never design.
- **Deterministic where it can be.** A dependency-free CLI owns structure, IDs and
  invariants; the model spends tokens only on judgment.

And two guarantees on how work gets done:

- **Every phase is verified, at the cost it earns.** Each plan phase has a
  deliverable and an explicit check matched to the failure it can catch — no audits
  of audits — and the result is recorded in the plan.
- **Nothing pushes.** Work lands with a local merge into the branch it started from.
  Publishing stays in your hands.

These are design commitments, not a claim of measured savings on every task.

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
new branch. Before committing, it tries each check against the repository: test
commands are listed without being run, and every file a removal check would still
find is assigned to a phase or excluded by name, so `build` does not discover it
mid-run. `build` implements **one** phase, runs its verification and records
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
until the scope is clear and writes a brief that `plan` picks up. Asking for it in
the conversation ("grill B-12") is enough: Claude starts it for you. For a product with
no UI yet, it suggests `/esq:ui --greenfield` to put rendered design directions on
screen before any code.

**Out of ideas?** `/esq:ideas` reads what the product already is (the spec, its screens
and routes, the backlog, the decisions, where the history churns) and proposes a short
slate, user value first: new end-user features, then adjustments to what exists, then
content (copy, templates, onboarding, the defaults people start from), then container
(architecture, structure, the surfaces it lives on), each judged by the user value it
unlocks. Every idea names what it was read from, who gets what, its size and the command
that takes it further; nothing generic, nothing already in the backlog or decided against.
Narrow it with a focus (`/esq:ideas invoicing`) or an axis (`features`, `adjust`,
`content`, `container`). You pick in one question; what you pick becomes backlog rows
with a suggested priority, and the rest stays in a slate you can capture from later
(`/esq:ideas capture 4,7`) without generating again. It writes no code and no plan.

**An interface that works but looks dull?** `/esq:ui` (or `/esq:ui <screen>`) never reads
one page alone. It covers a slice: the journeys through the screen, and the screens a
change there would reach through a shared component, layout or token. It walks those
journeys end to end in the running app (steps, dead ends, labels that disagree, input lost
on back) and checks current practice. Then it renders the directions across every screen
they change, linked so you walk the journey, on a comparison page at the width people use
it. A surface too big for one run (more than 3 journeys or 6 screens) is cut into slices:
the brief names the next ones, each with the command that covers it. A real defect it
finds outside the work is filed as a backlog row, committed with the brief before it asks
you anything. A direction answers what the screen should feel like, not just
the defects it counted: each carries its own signature and motion, built live on the page
so you play the hover, the press and the transitions before choosing. It may break the
app's own visual rules where only habit set them, and it ships only after it passes
contrast, focus, 44 px targets, phone width, reduced motion and its empty, loading and
error states. Each direction's own HTML (no embedded screenshots, one section per screen)
is committed beside the brief, and that is what `/esq:build` reads when it builds the screen,
so a mockup is never too big to read.

**A screen someone misread?** `/esq:ui B-NNN` (or a sentence saying what went wrong)
captures the screen as they met it, along with the screens of its journey and the ones
its fix would also change. It renders the fix where it lands (two directions when the
choice is yours) on a comparison page, and writes the brief `plan` picks up. `/esq:work`
routes such an item there itself.

**Does the product do what it says?** `/esq:promise` collects every promise the product
makes: the marketing site, pricing, onboarding and `docs/SPEC.md`. It walks each one in the
running app as the person it was made to would, and gives it a verdict with its evidence:
kept, partial, broken, absent, unverifiable here, or not testable at all ("the best").
Verdicts live in `docs/PROMISES.md`, so a re-run walks only what is not already proven
(`--all` re-proves everything). Each promise that does not hold becomes a backlog row
naming both remedies, make the product do it or change the words, for you to pick, and
what else it affects. A defect seen on the way is filed too, and the part of your ask no
promise can judge ("is the UX a pleasure?") is filed as one idea holding the `/esq:ui`
invocations that judge it. The report ends with one `/esq:roadmap` invocation that places
everything filed. It never writes to a production instance.
`/esq:promise --sense` sweeps the screens for what makes no sense: a button that does
nothing, a count that disagrees with its list, "Cancel" that saves, a field asked for and
never used, work lost on back. Each finding is filed with the step that shows it.
`/esq:promise --copy [page]` writes or improves a site's page copy, claiming only what was
proven, in the product's voice and its own names for things, checked to fit at phone
width. It shows each page before and after; what you approve is written into the source,
one commit per page.

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
| `/esq:plan <brief-or-task>` | Design the work and its verifiable phases | A plan committed on its own branch, its checks tried against the repository first, citing any lesson from `docs/LESSONS.md` that changed its design; when it replaces a surface, the inventory of what that surface did, any drop asked first |
| `/esq:build <plan>` | Implement and verify one phase, then stop, weighing the lessons earlier cycles left on its files | Task commits and an execution-log entry; a repo fact in `docs/LESSONS.md` for a trap the phase hit and verified itself |
| `/esq:review <plan-or-commit-or-range>` | Assess the delivered goal, what it removed, correctness, security, UX and design | Review findings, each marked `(repeats L-<id>)` when it repeats a defect a lesson recorded; the calls build decided for you by hat; a corrective brief when needed |
| `/esq:fix <fixes-brief> [--accept B-NNN,...]` | Apply safe corrections or record explicitly accepted findings | Verified fix commits and updated findings; a lesson in `docs/LESSONS.md` for a fix whose contrast recurs beyond its line |
| `/esq:land <plan>` | Verify readiness and merge the work into the branch it started from | A local merge or an explained refusal, then every rollout step esq can run; never a push |
| `/esq:check <plan>` | Diagnose missed tasks, divergence and unplanned work phase by phase | A report and corrective brief; no review coverage |
| `/esq:work [item-or-text] [route]` | Investigate one item; do it now if trivial, otherwise recommend the method | Code commit and backlog close for small work; otherwise the next command |
| `/esq:backlog [text-or-IDs]` | Capture, list, prioritize and update tasks; `publish` exports them | `docs/BACKLOG.md`; `publish` writes a CSV, and a Google Sheet when a connector is available |
| `/esq:sweep` | Reconcile backlog items against evidence of delivery | Backlog closures; questions only for unresolved cases |
| `/esq:roadmap [plan-or-edit]` | Show and refresh the queue; `plan` derives its order | `docs/ROADMAP.md`; backlog priority/rank updates when ordering |
| `/esq:advance [Now-entry-or-B-NNN]` | Work the roadmap's `Now` items and plan substantive work | Inline fixes and plans; stops before building |
| `/esq:autopilot <plan>` | Build remaining phases sequentially, one worker per phase | Code and execution logs |
| `/esq:converge <plan-or-fixes-brief>` | Run review → fix, then plan → build → review any 🟡 left, or resume an existing brief | Readiness report, and a lesson for a 🟡 its corrective round closed whose contrast recurs; no merge |
| `/esq:epic [new title-or-slug]` | Group a theme spanning several plans and backlog items | `docs/epics/<slug>.md` |
| `/esq:worktree [name-or-action]` | Create, list, remove or merge linked worktrees | Separate working directories and reserved backlog ID blocks |
| `/esq:status` | Orient without changing anything | Plan, backlog, pending briefs, roadmap and next action |
| `/esq:harvest` | Recover decisions from the code, history and discussion | `docs/DECISIONS.md` |
| `/esq:spec` | Describe the product's live features and business rules | `docs/SPEC.md` |
| `/esq:arch` | Refresh architecture and project instructions from the code | `CLAUDE.md`, project skills and `docs/ARCHITECTURE.md` |
| `/esq:ideas [focus] [features\|adjust\|content\|container]`, `/esq:ideas capture <n,…>` | Propose grounded ideas, user value first: new features, adjustments, content and container (architecture, structure, surfaces) | A ranked slate you pick from in one question; picked ideas become backlog rows with a suggested priority, the rest kept for a later `capture` |
| `/esq:promise [page-or-feature] [--sense \| --copy] [--all]` | Check that what the product promises works in the running app; sweep it for UX nonsense; write or improve page copy | `docs/PROMISES.md` verdicts with evidence and a backlog row per promise that does not hold, per defect seen on the way and for the part of the ask it cannot judge; `--sense` backlog rows; `--copy` a before/after page, then approved copy committed page by page |
| `/esq:ui [screen-problem-or-B-NNN] [--greenfield <brief-or-copy>]` | Inspect an existing interface (the journeys through a screen and every screen a change reaches, sliced when large) or one screen a user misread, or explore one before implementation | A rendered recommended direction across the screens it changes (two in `--greenfield`, or when the choice is yours), live, animated and walkable, gated on contrast, focus, target size, phone width, reduced motion and states, a comparison page, each direction's HTML source committed beside a planning brief naming the next slices (the source, not the page, is what `/esq:build` builds from); backlog rows for the defects outside the work |

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
| CLI | `plugin/bin/esq` and `plugin/lib/` | Parse plans and ledgers, assign IDs, check branches and review coverage, keep verification evidence, perform safe local merges, keep the lessons ledger (`esq lessons add` refuses an entry whose evidence does not resolve; `esq lessons match` returns at most six cues for the files in hand, and the build preflight and review scope carry them without an extra call; `esq lessons show` opens one), and read the spec and architecture by section (`esq projection outline` gives the heading tree, what each section costs, the projection's freshness and which given files changed since it was mined; `esq projection read` returns only the chosen sections, history comments stripped). It answers structured questions; it makes no product choices |
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
| `docs/LESSONS.md` | Lessons from closed defects and verified repo facts, each tied to its evidence and the paths it is about |
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
| 🔴 Needs your decision | You pick one of the options it presents; red comes first. "No preference" lets it take its recommended option |
| 🟢 Mechanical, contained fix | `/esq:fix` applies and verifies it; a red its own change explains (a stale mock, a missed import) is corrected and re-run once before it would escalate |
| 🟡 Substantive change | `/esq:plan` defines the work |
| Clean | The work moves on toward landing |

`/esq:converge <plan>` runs review → fix for you and reports whether the work is
ready; it never merges. A 🟡 left over is not a question for you: converge plans it,
builds it phase by phase and reviews it again, within the two-corrective-plan bound
below, and stops only on a decision that is yours. `/esq:check` is an optional, deeper phase-by-phase
reconciliation; it does not count as a review.

Corrections are bounded: a piece of work gets at most two corrective plans. Past
that, safe fixes still go through `fix` → `review` → `land`, and
`fix --accept B-NNN,...` records your decision to leave named findings unfixed — as
`Dropped`, never `Done`, and without skipping verification.

**Landing** checks the whole branch, not just the named plan: plans complete or
explicitly abandoned, findings dealt with, review done, every module the branch
deleted or left unused accounted for, working tree clean (screenshots build left
behind are committed, never asked about). It
reuses verification that still holds and runs only what is owed. A red test is
diagnosed on the spot, alone and on the branch's origin: an inherited failure or a
flake lands, only a regression of the branch stops it. A red caused by your local
setup (a flag left on in a gitignored `.env`, a stale server, a cache, a test
database behind the branch's migrations — destructive ones included, since the test
suite owns that data; your local dev database too, after a dump that is its undo) is
fixed by the landing itself and reported with its undo, never handed back to you; only a
secret or a remote database is yours. A check the machine killed for low memory is re-run
once in the foreground after esq's own leftover servers are stopped. A backlog row the
branch only partly delivered is split: the delivered part closes, the rest becomes its own
row for you to triage whenever you like. It then merges
locally, listing once, by hat, the calls build decided for you with how to undo
each; silence is consent. Conflicts that need judgment come back to you with a recovery action.
When the feature needs more than a merge to reach users — a migration, an
environment variable, a restart — the plan's rollout steps are listed in the
landing report under **Rollout**, and the landing runs every step it can itself.
It stops only at a step that is yours — a push, a deploy, an action in your own
accounts — and once you have done it, `/esq:land <plan> --from <n>` (or saying
done in the same session) carries on. esquisse never pushes. A plan that lands into
another plan's branch rather than your trunk has shipped nothing yet: the report
says where that parent stands and points at its next step, and the deployment
steps come when the parent lands.

**Replacing a screen, an editor or a form** keeps what the old one did unless you
say otherwise. `plan` reads the old code and lists each capability it carried — the
autocomplete, the map picker, the geolocation — as kept or moved (and where), or
dropped. Dropping one is always your call, asked before anything is built, and every
kept one gets a check proving it works on the new surface; `build` walks that list on
the new screen, not just the new flow. `review` names the feature behind every file
the change deleted or left unused and where it lives now — one that lives nowhere comes
to you as a decision — and `land` refuses while any of them is unaccounted for.

**Manual checks** need an actual observation of the stated behavior, and the
build makes it with a browser tool when one is available: a "phone" check runs at a
phone-sized viewport. A native phone behavior (install, push, haptics, camera) never
stops the run: the build prepares the artifact (the APK, the link) and `land` asks you,
once and after the merge, only whether the result is right on your device. Any other
step left unobserved pauses the phase; resume with `/esq:build <plan>`, which picks up
from the log and existing commits.

**Reviewing work without a plan:** `/esq:review <full-commit-hash>` or
`<base>..<tip>`. Avoid bare `HEAD` after `/esq:work`: the last commit is then the
backlog update, not the change. A plan-less review ends at its findings; `land`
only operates on planned work.

## Backlog, roadmap and epics

- `/esq:backlog <text>` captures an item; `/esq:work` takes one item at a time and,
  with no argument, picks the top of the roadmap.
- `/esq:roadmap plan` orders the open work, user and business value first, and records
  why each item sits where it does; bare `/esq:roadmap` refreshes state without reordering; `/esq:roadmap <edit>`
  applies one edit per line (`add`, `X before Y`, `why X: …`) in one run and one commit. A finished plan does
  not close its items by itself: `/esq:sweep` closes one only with evidence of its
  whole outcome.
- `/esq:advance` works the roadmap's `Now` items — one worker per item, at most one
  new plan per entry — and stops before building.
- `/esq:ideas [focus]` proposes grounded features, adjustments, content and container
  changes, and captures the ones you pick as backlog rows.
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

## Contributing

Read [CLAUDE.md](CLAUDE.md) for the project's goals and editing rules, and
[docs/MAINTAINING.md](docs/MAINTAINING.md) for the audit, release and research tools.
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) describes how the pieces fit.

## License

MIT — see [LICENSE](LICENSE). Contributions and forks welcome.
