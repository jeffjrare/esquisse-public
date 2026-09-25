---
description: Refresh the architecture projection from the codebase — a thin CLAUDE.md plus a deep docs/ARCHITECTURE.md. Replaces the retired `sync`.
name: arch
argument-hint: "[target] [options]"
disable-model-invocation: true
model: opus
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You maintain the projection that tells a future session — yours, someone else's, or a plain Claude Code session with no esquisse at all — how this codebase is built. Not what it does for users (that's `docs/SPEC.md`, owned by `/esq:spec`), and not what to work on next (that's the backlog). How it's *built*: what the pieces are, where the boundaries run, and which rules must not be broken.

Get this right and every later session starts informed: fewer wrong assumptions, less re-derivation, fewer regressions from someone not knowing a rule existed. Get it wrong and you have taxed every future session with noise.

Do NOT use plan mode. You write files at the end.

## Three homes, and how to choose between them

Knowledge costs differently depending on where you put it, so the choice is not stylistic:

| | `CLAUDE.md` | `.claude/skills/<topic>/SKILL.md` | `docs/ARCHITECTURE.md` |
|---|---|---|---|
| Always in context | the whole file | **the description line only** | nothing |
| Body loads | always | when the topic comes up | when something points at it |
| Cost | paid on "fix this typo" too | one line, always; the rest on demand | zero until read |
| Fails by | **dilution** — present but competing | **missing** — the topic didn't match | not being pointed at |

A line in `CLAUDE.md` is guaranteed to be present, and guaranteed to compete for attention with everything else — including on the many tasks it has nothing to do with. Thirty rules there is not thirty times the safety of one; past a point the rules that matter most get read with the same weight as the one about a port number.

So route each rule by **what a miss costs**, not by how important it feels:

> **The miss test.** If a session never saw this rule, would breaking it be *obvious*?

- **A miss is silent or expensive → `CLAUDE.md`.** Nothing catches it, or it's caught after damage: a tenant check that can be bypassed, a middleware order that hangs requests, an integrity constraint no schema tool declares, a cache nobody knows to invalidate. These must be present unconditionally, whatever the session thinks it's doing. Keep this list short enough that it stays readable — that shortness is what makes it work.
- **A miss is loud → a skill.** A build error, a failing test, a lint rule, a broken page, a convention the next reviewer spots immediately. Naming conventions, tooling invariants, formatting, a pinned port, framework-specific patterns. Being *usually* loaded is enough here, and it buys back the attention budget.
- **Explanation, reasoning, flows → `docs/ARCHITECTURE.md`.** Anything a person reads to *understand* rather than to *comply*. Every rule's "why" lives here, in full, wherever the rule itself lives.

**The miss test routes rules. It cannot route a procedure.** Ask it of "how this app comes up locally, seeded and logged in" and every category answers no: there is nothing to *break*, so the knowledge lands nowhere and each session works it out again. Route those by a second question, into the same skill home:

> **The re-derivation test.** If a session never saw this, would it have to work it out from scratch?

- **Yes, and it costs more than a couple of tool calls → a skill, and a runnable one.** Which ports are pinned, what brings infrastructure up, how a fixture gets seeded and *authenticated*, and the harness that drives a real screen. Otherwise every session re-derives the environment into a scratchpad that dies with it.
- **Put the executable beside the skill** (`.claude/skills/<topic>/scripts/`), not the recipe alone. A procedure described in prose gets re-implemented, and the implementation is precisely what you are trying to stop paying for. Its `description` must say it *launches or drives this app* — that is the string `/esq:build`'s `(manual)` probe searches for, and a runnable skill the probe cannot find is one nobody will run.
- **The environment that recipe needs is the skill's to establish, not the caller's.** Setup must be idempotent, leave nothing to undo, and require nothing of the caller that a script can compute about itself. An install the caller has to revert (`pnpm add -Dw playwright-core  # one-time`, then `git checkout package.json pnpm-lock.yaml` at the end of every session) and an invocation the caller has to assemble (`NODE_PATH=$PWD/node_modules:$PWD/../frontend/node_modules node <script>.js`, with the correct value differing per script) are the same defect: the re-derivation was moved rather than removed, and moved somewhere no `(auto)` step will ever go red. Install outside the tree the repo tracks (a project-owned cache directory, symlinked into the gitignored `node_modules/`, a no-op after the first run), and derive every path and every env file from the script's own location. A skill that documents a gotcha its own setup could have removed has written down the bill instead of paying it once.
- **Five parts, and the last two are what make it safe rather than merely fast:** *is the stack up* — one command showing every expected port, what starts each, and a smoke check that discriminates, naming the paths that look right and answer nothing; *the gotchas* that break the launch; *a reusable kit* rather than a one-off script; *a disposable fixture whose teardown is proven* — wrapped in `try/finally`, recognisably prefixed so a stray is obvious, and confirmed against the starting state instead of assumed; and *the rules that stop a false pass* — a blank frame is a failed launch and not a green, an observation that would look identical with the feature disabled proves nothing, and anything about data scoping is asserted on the wire and not only in the pixels. Name the env file it writes to and that it is never pointed at production. A generated skill missing the last two parts is a trap, not a shortcut: it makes a wrong pass cheap.
- **Point at the knowledge skill, never restate it.** If a `testing` or framework skill already carries the technique, the runnable one carries the commands and cites it. Two copies of one convention is the drift this whole file exists to prevent.

`/esq:build`'s probe files a backlog candidate whenever it improvises a driver because no such skill existed. That candidate is the request for this one, and it names the recipe that already worked.

**CLAUDE.md is not a summary of ARCHITECTURE.md.** It holds the map, so a session can orient, plus the rules above — and pointers.

A pointer without a trigger doesn't work. `See docs/ARCHITECTURE.md for details` is ignored. `Before changing anything that writes to the ledger, read docs/ARCHITECTURE.md § Ledger — writes are append-only and ordering is load-bearing` gets read, because it tells a session *when it is the one being addressed*. A skill's `description` is a pointer of the same kind, made structural: the harness keeps it in front of every session, and the body costs nothing until it matches.

## Announce, before anything

<!-- announce-open:start -->
**Announce in one line, then keep working in the same response.** Print the line below before any tool call, with nothing of your own above it — and never end your response on it: the run's first tool call follows in that same response. A bound named after the spending is a bill.

> `/esq:arch — refreshing CLAUDE.md, docs/ARCHITECTURE.md and project skills. Bound: no subagents, at most five skills.`

If a pass would exceed it, stop at the bound and say what you did not cover. The resolved target lands in the second line, at the end of preflight.
<!-- announce-open:end -->

Phase 1 is a whole-codebase read and it is silent. The itinerary is what distinguishes a run in progress from a run that died.

## Preflight

1. Read `CLAUDE.md` at the project root. If it doesn't exist, say so and create it from scratch in this run — unlike its predecessor, this command does not require an existing base, because building the first one is exactly the work.
2. Read `docs/ARCHITECTURE.md` if present.
3. Note the freshness marker: `<!-- last-arch: YYYY-MM-DD @ <commit> -->` (an older one carries the date alone), or the older `<!-- last-synced: YYYY-MM-DD -->` left by the retired `sync` command (treat it as the same thing and replace it with `last-arch` when you write).
4. Note today's date in YYYY-MM-DD format, and **the commit you are mining**: `git rev-parse HEAD`, once, here, chained into a call you already make. That full commit is what both markers record — the existing tree this projection describes, never the refresh commit this run will make, which does not exist yet and is never amended in — unless Phase 5 commits project skills first, and then that skills commit is the one they record.
5. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `<First run | Refresh since YYYY-MM-DD>.`
   <!-- announce:end -->

   This is the free moment to be redirected — the target is on screen before anything has been spent on it.

Retain each read and its evidence for the whole pass. Batch independent reads; load
only missing facts afterwards. Reuse applicable verification already recorded; a
refresh does not rerun a test or launch research merely to restate its result.

## The altitude test — apply it to every candidate line

This is the rule that decides what these documents are. The command this replaced mined build logs for whatever past sessions happened to trip over, which produced a drawer of implementation trivia. The fix is not to mine more carefully — it's to ask one question of every line:

> **Would this still be true, and still matter, after the file it came from is rewritten?**

Architecture survives refactors. Implementation details don't.

- ❌ "The user list component paginates at 50" — read it from the code when you need it.
- ✅ "Every list endpoint is paginated; unbounded collection reads are not allowed to reach the database." — a rule that shapes new work.
- ❌ "JWT refresh has no grace window" — a behavior, findable in one grep.
- ✅ "`auth/` owns every token lifecycle operation. Nothing outside it issues, refreshes, or validates a token." — a boundary, and violating it is how the next duplicate token path gets written.

The pattern: **a fact about one file is not architecture. A rule about a class of files, or a boundary between them, is.** When a candidate is genuinely a one-off gotcha that would still bite — rare, but real — it goes in ARCHITECTURE.md under the component it belongs to, never in CLAUDE.md.

And for anything headed to `CLAUDE.md`, one further test, because that file is re-read forever:

> **Would a session that never saw this line make a different decision?**

If not, it's noise. Noise in CLAUDE.md is paid on every invocation, including the ones that had nothing to do with it. A missing line costs once, when someone has to go look; a wrong or pointless line costs every time. Cut accordingly.

## Phase 1 — Read the codebase

**The codebase is the primary source.** This is what makes the documents true rather than anecdotal. Read it directly — don't reconstruct the architecture from what past sessions wrote about it.

Investigate proportionally; you are mapping, not auditing:

- **The shape.** Top-level layout, workspace/package boundaries, services or apps and how they're deployed. What is actually a separate deployable, versus a folder.
- **Entry points.** Routes, pages, CLI commands, queue consumers, cron entries, public API surface. These are where control enters the system.
- **Ownership.** For each significant domain concept, which module owns it. Where is it written, and by whom. A concept written from three places is itself a finding worth documenting.
- **Boundaries and flows.** Which module calls which, what crosses a network or a process, where data is transformed and by whom. Follow one or two representative flows end to end — a write path and a read path teach more than a directory listing.
- **The rules the code already enforces.** Auth checks, validation layers, migrations, feature flags, the test layout, the CI gates. What must a change satisfy to be mergeable here?
- **The design system, if there's a UI.** Where tokens/theme live, the component library, how empty / loading / error states are conventionally rendered, the accessibility floor. Prefer the concrete pointer — "colors and spacing come from `src/theme/tokens.ts`; components never hardcode hex or px" — over the aspiration.

On a refresh, scope this by what changed: `git log --stat` since the freshness marker tells you which areas moved. Re-read those in full; skim the rest for contradictions with what's already documented.

## Phase 2 — Read the intent

The code says *what*. These say *why*, and a rule without its reason gets overruled by the next person who finds it inconvenient.

**`docs/DECISIONS.md`** — locate entries for the concepts and changed areas found in
Phase 1, then read only those details and any directly cited supersession. Relevant
`arch`, `infra`, `deps`, and `ux` entries supply intent, not automatic authority:
check applicability against the current mandate, code and cited `Fondement`.
`Active` alone does not reinstate a retired rule. Preserve historical records;
do not scan the whole detail tail or migrate unrelated metadata. A first projection
uses the component map to select relevant entries, not every past decision.

**Plan execution logs** — read them last, only for a named boundary or invariant
still unexplained by code and relevant decisions. Use the cited plan's retained
evidence; no plan-directory sweep. A log signal must pass the altitude test and
generalize beyond its original file. Taking nothing from logs is normal.

**`docs/SPEC.md`** — existence and its freshness marker suffice for the document-map
and staleness advisory; do not read its body for that purpose. Never copy feature
descriptions here. Add a missing pointer to SPEC, DECISIONS, BACKLOG or ARCHITECTURE
when its absence would hide a document a future session needs.

Never write `docs/SPEC.md`, and never invoke `/esq:spec`. You report; the user decides.

## Phase 3 — Verify what's already written, and delete what's false

**Do this before drafting anything new.** Every line already written is a claim about the codebase, and an unverified claim is worse than a blank page: it is confidently wrong, on every session, forever.

On refresh, check claims affected by Phase 1's changes in CLAUDE.md, maintained
project skills and ARCHITECTURE.md, including dependent boundaries and apparent
contradictions. Reuse the unchanged projection's established evidence. On a first
projection, cover the current component map. For each claim in that scope:

- **Still true?** Check it against what you read in Phase 1. A module that moved, a rule that's now enforced elsewhere, a "never do X" for an X that no longer exists.
- **Still architecture?** Entries left by the retired `sync` command are frequently implementation trivia. Apply the altitude test to what's already there, not only to what you're adding. This is how the drawer gets emptied.
- **Still earning its place in CLAUDE.md?** A true line that changes nobody's decision belongs in ARCHITECTURE.md or nowhere. And a true line whose miss would be *loud* belongs in a skill — on a project whose CLAUDE.md predates the miss test, expect most of the file to move, not to be deleted.

Judge deletions and relocations by the same evidence as additions. Zero cuts can be
correct; never manufacture removals to demonstrate review. Report the checked scope
and only consequential corrections, preserving silent or expensive safety rules.

## Phase 4 — Draft, and route every line to its home

`docs/ARCHITECTURE.md` uses this shape. Write in the project's working language (French if the project is French, English otherwise):

```markdown
# Architecture — <Project Name>
<!-- last-arch: YYYY-MM-DD @ <full commit from preflight> -->
<!-- How this codebase is built. Maintained by /esq:arch. Features live in docs/SPEC.md. -->

## Vue d'ensemble
2–4 sentences: what the system is made of and how the pieces relate. Someone who
reads only this paragraph should be able to place any file they open next.

## Composants
### <name> — <one-line role>
**Responsabilité:** what it owns, and what it deliberately does not.
**Entrées:** how control and data reach it (routes, events, jobs, callers).
**Dépend de:** the other components it needs, and for what.
**À savoir:** the non-obvious things — an invariant it assumes, a constraint it
imposes on callers, a failure mode. Only what survives a rewrite.

[repeat per component]

## Flux clés
The two or three paths that carry the most weight, end to end. Name each step and
which component owns it. A reader should be able to follow one without opening code.

## Règles
Each rule as: the rule, then **why** — one line. A rule without its reason gets
overruled by the next person who finds it inconvenient.
- <rule> — *why:* <reason>

## Frontières à ne pas franchir
The couplings that must not be created, and what breaks if they are. This is the
section that prevents regressions, so be specific about the damage.
```

For **`CLAUDE.md`**, propose surgical edits only — never a rewrite, never a restructure. It holds four things:

- What the project is, in two lines.
- The map: one line per service/module — its name, its role, where it lives.
- The non-negotiable rules: only those that fail **the miss test** — a miss is silent or expensive. If it's longer than about ten lines, it isn't the short list; re-route the rest.
- Pointers with triggers, to `docs/ARCHITECTURE.md`, `docs/SPEC.md`, `docs/DECISIONS.md`, `docs/BACKLOG.md`, and to each skill you wrote. Each names the situation in which a session should stop and go read.

Match the existing document's style exactly — same heading levels, same bullet or table shape, same density.

### Skills — the topic-scoped rules

Every rule that passed the altitude test but whose miss is **loud** goes into a project skill instead of `CLAUDE.md`. This is what keeps the always-loaded file short enough to actually be read.

Group them by the area of the codebase a session would be working in when they apply — database & schema, i18n, UI & design system, testing, build & tooling, deploy. **Group coarsely: more than about five skills means the grouping is too fine**, and a rule split across two skills is a rule that fires in neither. A project with few such rules gets one skill, or none; do not manufacture them for structure's sake.

Path `.claude/skills/<topic>/SKILL.md`, committed to the repo like any other source file:

```markdown
---
name: <topic>
description: <What it covers, and — critically — WHEN it applies. This line is
  what every session sees, and the only thing deciding whether the body loads.
  Name the concrete triggers: the paths, the file types, the operations. "Prisma
  schema, migrations, and DB naming conventions for <project> — read before
  editing schema.prisma, writing a migration, or adding a model." A description
  that only says what it is ("database conventions") never fires.>
---

# <Topic> — <project>

<One line on what this covers and where the deep version lives.>

## Rules

- **<rule>** — *why:* <reason>. <What breaking it looks like, so a reader can
  tell they've hit it.>

## See also
`docs/ARCHITECTURE.md § <section>` for the reasoning behind these.
```

The description is the whole mechanism. Write it as the answer to *"when should this load?"*, never as a title — a skill nobody triggers is knowledge you deleted with extra steps.

### The CLAUDE.md volume gate — this is a pass, not a target

Count the lines of `CLAUDE.md` as you would write it. **If it exceeds 80, you are not done drafting.** Go back and re-route until it fits:

1. Every rule that fails the miss test (a miss would be loud) → move it to a skill.
2. Every line that explains rather than instructs → move it to `docs/ARCHITECTURE.md`, leaving at most a triggered pointer.
3. Still over? The map is too detailed. One line per service, not per module.

Do not deliver an over-length file with a note apologizing for it — over the limit means re-route, not explain. State the final count in the report so the user can see the gate was applied.

## Phase 5 — Write it, commit, then show your work

**Do not ask permission to write.** You read the codebase, you applied the tests, and every file you touch is committed to git — so a wrong line costs one `git revert`, while a confirmation round-trip costs a session and buys nothing you didn't already decide. The report is the confirmation, and it is strictly better arriving after: the user can revert, or say "put that line back", at the same cost as answering a question, without having been blocked.

1. Write each `.claude/skills/<topic>/SKILL.md` you routed there. Create the directories as needed. Skills are source, not local config. **If any skill file changed, commit those alone, first:** `git add .claude/skills && git commit -m "docs(arch): project skills for refresh YYYY-MM-DD"`, then `git rev-parse HEAD` — that commit replaces the preflight commit as the one both markers record. A project skill is not projection bookkeeping: `esq projections` stales on any byte under `.claude/skills/`, so recording the preflight commit and committing skills on top of it would leave this refresh stale the moment it was made. The skills commit is an existing commit and never this refresh's own, so every later skill edit still invalidates. No skill changed, or `.claude/` is gitignored (say so, and that the skills won't reach teammates until that changes; write them anyway) → the preflight commit stands.
2. Write `docs/ARCHITECTURE.md` with the content that passed the altitude test. Set `<!-- last-arch: YYYY-MM-DD @ <the recorded full commit> -->` on line 2 — the full commit, never a short one: `esq projections` proves this projection still describes `HEAD` from it, and `/esq:land` reports a projection it cannot prove fresh as an advisory line. Freshness survives exactly the bookkeeping a refresh or a landing makes — this file, `CLAUDE.md`, `docs/SPEC.md`, Markdown under `docs/plans/`, `docs/BACKLOG.md` — so a same-day `/esq:spec` before or after this run leaves both fresh as long as this run changed no project skill; a skills commit after the spec was mined stales the spec, so when skills move, `/esq:spec` runs after this command.
3. Apply the CLAUDE.md edits surgically. Set or update `<!-- last-arch: YYYY-MM-DD @ <the recorded full commit> -->` near the top, replacing any `last-synced` marker.
4. `git add CLAUDE.md docs/ARCHITECTURE.md`
5. `git commit -m "docs(arch): <first run | refresh YYYY-MM-DD> (<N> added, <M> cut, CLAUDE.md <L> lines)"` — the refresh's second commit when step 1 made one, and the only one otherwise.

<!-- conclusion:start -->
6. **Conclude in three zones, using short bullets and links.**
   - **Headline:** `✔|⚠|✖ arch — <changed scope> · <measured elapsed>`; include
     `NEEDS YOU (n)` only for genuine unresolved user authority.
   - **User needs, if any:** name the missing authority and its consequence. A
     code/decision contradiction is first a diagnosis: use current intent and evidence
     to settle its meaning. Ask only if a product choice or authorization remains;
     never ask the user to guess whether code or history is wrong.
   - **Result:** each consequential change states what changed, why it helps the next
     implementation, and its file/section. Group related moves and deletions. Include
     CLAUDE.md's final line count, verification reused/performed, unresolved limits,
     the commit and undo command. Link the committed files/diff; do not paste the
     whole draft, diff, or per-line inventory unless requested.

`→ Next` names the one warranted action, or says nothing is owed. Spec staleness is
optional advice, not a user gate or reason to launch `/esq:spec`. Keep missing facts
visible without inventing a question. Omit empty categories and repeated rationale.
<!-- conclusion:end -->

A loud failure can still be expensive. Keep rules whose violation risks real money,
data or a production incident in CLAUDE.md under the existing miss test; visibility
alone does not justify moving them or asking the user to approve that move.

## Constraints

- Do NOT spawn subagents — the whole value here is one reader holding the shape of the system at once, which a fleet of specialists cannot do. The announced bound says **no subagents**.
- Three destinations, ever: `CLAUDE.md`, `docs/ARCHITECTURE.md`, and `.claude/skills/<topic>/SKILL.md`. Never `docs/SPEC.md`, never code, never a plan.
- **The 80-line gate on CLAUDE.md is not negotiable by prose** — see "The CLAUDE.md volume gate — this is a pass, not a target".
- Never chain into another command. Spec staleness and decision contradictions are reported and stop there.
- Surgical edits to CLAUDE.md — insert, correct, delete. Do not restructure a document the user wrote.
- Only what passed the altitude test gets written, deletions included. The Phase 5 report is the confirmation, and it arrives after the commit — never before it.
- No feature descriptions. If you catch yourself explaining what a user can do, it belongs in `docs/SPEC.md`.
- If the project has no git repo, write the files and skip the commit; say so.
