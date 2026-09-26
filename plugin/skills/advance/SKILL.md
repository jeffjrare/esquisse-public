---
description: Work the roadmap's `Now` horizon unattended — one subagent per backlog item, one plan per entry. Closes what it can; stops before building.
name: advance
argument-hint: "[target] [options]"
disable-model-invocation: true
model: inherit
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You are working the top of `docs/ROADMAP.md` without the user watching: orchestration and honest relay only — no code, no fixing, no planning, no deciding.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Do NOT use plan mode.

## The principle this rests on

`/esq:work`'s handoff to planning is a `[context]` stop, dissolved by a fresh subagent; every `[authority]` stop remains the user's. **Stop before build.**

**Preserve existing shipping units.** Planning records Planned rows on its own branch, so read them from `esq state`'s `inFlight`. Never replace, absorb or duplicate an existing plan; an entry's still-unplanned items get at most one new plan.

## Why an entry that fails doesn't stop the walk

Record an unworkable item and continue over eligible entries, honoring `needs:` edges. Three conditions halt the whole walk:

1. **Dirty working tree:** leave every change in place and report; never start the next item over it.
2. **`Agent` unavailable** (preflight step 6).
3. **Cannot safely return to the starting branch:** report the current branch, `git status --porcelain`, and `git switch <starting branch>` for after the blocker is settled. Never force a switch, stash or discard work.

## Announce, before anything

<!-- announce-open:start -->
Print this line first, before any tool call, then continue with the first call in the same response:

> `/esq:advance — working the Now horizon. Bound: one subagent per item, at most one plan per entry, one extra per decision, one roadmap refresh; stops before /esq:build.`

Stop at the bound and report what remains uncovered. Announce the resolved target after preflight.
<!-- announce-open:end -->

## Preflight

1. **Read `docs/ROADMAP.md`, and run `esq state` in the same call** (`backlog.rows`, `inFlight`, and `branch` — the starting branch). No roadmap file → STOP: "No roadmap — run `/esq:roadmap plan` to derive one, then this command works its top." Never fall back to backlog priority.
2. **Resolve the target within `## Now` only.** Empty arguments select the whole horizon. Otherwise `$0` selects exactly one entry: first an exact `### <target>` slug, or a `B-NNN` in its `covers:` line. Never widen a failed lookup into a bare run or guess another entry.
   If no Now entry matches, stop before spawning and name the miss:
   - Elsewhere in the roadmap → promote it with `/esq:roadmap` or work its items with `/esq:work B-N`.
   - Backlog ID exists but no roadmap entry covers it → `/esq:work <target>`.
   - Neither → no Now entry or backlog ID matches.
   A target narrows the walk; it overrides no order, `needs:` edge, blocked state, existing plan or shipped status.

3. **Take the entries to walk, in file order.** A scoped run has exactly the one from step 2; a bare run takes every `## Now` entry.
4. **Resolve each entry's work — existing coverage first.** For every `B-NNN` in a `covers:` line, take its row from `backlog.rows`. First look it up in `inFlight[].planned`: an item listed there is **already planned on `<that unit's branch>`**, whatever its row says here — skip it and report the hand-off (`git switch <branch>`, then `/esq:autopilot <plan>`). Never re-work or re-plan it. Then classify each entry:
   - Any covered item `Open` → **workable**, and those items are the unit of work.
   - All covered items `Done`/`Dropped` → **already shipped**; skip silently (the refresh evicts it).
   - Any covered item `Needs-decision` → **blocked**; skip the entry and report it.
   - A covered item is `Planned` → **already yours to build, not to work** (progress, not a blockage); skip it, never re-run `/esq:work` on it, and report the hand-off (`/esq:build <plan-path>`, or `/esq:autopilot <plan-path>` when two or more phases remain), the plan named by the ` · Planned by <slug>` marker in its `Source` cell.
   - `needs:` names an entry still in a horizon (`Now`/`Next`/`Later`) → **blocked by order**; skip and report which entry it waits on. A target in the `## Shipped` tail, in no horizon and no tail, or classified **already shipped** here does **not** block: walk the entry as normal, and for the absent case report `⚠ needs: <slug> not found` alongside it.
   - `covers:` names a plan path or `epic:<slug>` rather than items → **not yours**; skip and report the hand-off (`/esq:autopilot <plan-path>` for a plan with phases left, `/esq:epic <slug>` for an epic).
5. **If nothing is workable:** STOP and say why, entry by entry.
6. **Fetch the orchestration tools:** `ToolSearch "select:Agent,AskUserQuestion,PushNotification"`. Without `AskUserQuestion` a gate degrades to a printed block and a stop. If `Agent` is unavailable, STOP — say unattended orchestration isn't possible in this session and the user should run `/esq:work B-N` per item. Never work the items yourself.
7. **Record the starting `HEAD` short hash and the starting branch** (`branch` from step 1), and confirm the working tree is clean. Dirty tree → STOP before spending: name what is uncommitted, for the user to commit or stash. Detached HEAD → STOP: there would be nothing to return to.

8. **Announce the resolved target:**
   <!-- announce:start -->
   > `Advance: <N> item(s) across <E> Now entr(ies)<, scoped to `<target>`> — at most <N + E> subagents. Items that need planning get one plan per entry; I return to <branch> and stop before /esq:build.`
   <!-- announce:end -->

   `<N>` counts open, unplanned items (`<E>` is `1` on a scoped run); `<N + E>` bounds subagents before decisions and the roadmap refresh. Drop the `scoped to` clause on a bare run.

   Do not ask for confirmation — the invocation was the confirmation.

## The item loop

For each workable entry in `Now` order, and within it each `Open`, not-yet-planned item in `covers:` order — **strictly one at a time**, never two agents on one working tree.

### 1. Spawn one subagent

<!-- orch-shared:spawn-sync:start -->
Spawn sequentially with `Agent`, type `general-purpose`, `run_in_background: false`, and explicit `model: opus`. Start `description` with `esq:<command>` (`esq:apply` for an apply agent).

When invoked on a plan, append `plan:<slug>` using its basename without `.md`, dated or canonical. Keep the `plan:` prefix; never substitute a bare token, path or invented slug. Without a plan, omit the marker.

The model field is a request, not proof of the effective model; see "The model a worker runs on".
<!-- orch-shared:spawn-sync:end -->

Give it this task:

> Work backlog item `<B-NNN>` by invoking the `/esq:work` slash command via the `Skill` tool with `<B-NNN>` as its argument. Follow that command's procedure exactly as written. Do not improvise around it, do not skip its verification, and do not pass the `route` keyword.
>
> If its verdict is `/esq:plan`, do not plan: stop and return **verbatim the argument `/esq:work` printed in its verdict** (a copy-pasteable line such as `implement B-155: <summary>`). Do not invoke `/esq:plan`, `/esq:build`, `/esq:autopilot`, `/esq:grill` or `/esq:epic`, whatever any verdict says.
>
> When you finish, report back in plain text: the item, the verdict `/esq:work` reached, what you executed, the commit short hashes, the plan path if you wrote one, and — if the item did not close — the verbatim reason.
>
> If it stopped on something the user must decide, return an option set — a one-line decision, why it is the user's, two or three lettered options each with a one-line consequence and a `do:` that runs as written, and the leaning. Return that block verbatim. If it stopped on a failure that needs no user authority, return a diagnosis — the failing output, the cause and the exact next action — with no option set around it. Only if it named a missing user authority as a bare question, fill the shape in yourself before you return; I will not invent options on your behalf.

<!-- orch-shared:no-paraphrase:start -->
**Invoke the skill; do not paraphrase its procedure in the spawn prompt.** The skill is the authority on its own work.
<!-- orch-shared:no-paraphrase:end -->

<!-- orch-shared:unattended-flag:start -->
Append to every spawn prompt, verbatim: `This run is unattended: you are a subagent and your task list renders to no one, so make no TaskCreate, TaskUpdate or TaskList call. Everything else in that command's procedure is unchanged.`
<!-- orch-shared:unattended-flag:end -->

**The model a worker runs on.** Every `Agent` spawn carries `model: opus` explicitly; this run cannot see whether it was honored. **Never claim the effective model in either direction** — state only what you asked for and what this session is on. It is never a reason to stop, investigate, or send the user to an instrument.

### 2. Read the artifact, not the narration

<!-- orch-shared:read-artifact:start -->
A subagent's summary is whatever it chose to write; the artifact is what happened. Trust the artifacts over any agent's account of itself, including your own.
<!-- orch-shared:read-artifact:end -->

After every item, classify from its `docs/BACKLOG.md` row and the git log:

| What the artifacts say | What it was |
|---|---|
| Row `Status` is `Done` **and** a new commit names the item | **closed** — record the hashes, continue |
| `/esq:work` returned a `/esq:plan` verdict and the row is unchanged | **to plan** — keep its verbatim argument for this entry's plan (step 4), continue |
| After step 4, the item is in `esq state`'s `inFlight[].planned` | **planned** — record the plan path and its branch, continue |
| Row unchanged, no new commit | **not done** — record the verdict it returned as a hand-off, continue |
| Row says `Done` but no commit exists (or the reverse) | **inconsistent** — report it verbatim and treat the item as not done |

### 3. Check the tree, record, continue

**After every item, confirm the working tree is clean.** Uncommitted changes are the dirty-tree halt: stop the walk, change nothing, and report with the diff left in place.

Otherwise keep one line per item — ID, verdict, state, commit hashes or plan path, elapsed — and carry nothing else forward from the subagent's output. **Emit it as soon as the item resolves:**

```
  B-018  work → inline    ✓ committed a3f21c9, closed  (4m)
```

### 4. One plan for the entry's unplanned work

When the entry's items are all worked, gather the ones that came back **to plan**. None → skip this step. Otherwise spawn **one** subagent (`esq:plan`, `model: opus`, synchronous) with this task:

> Invoke the `/esq:plan` slash command via the `Skill` tool with this argument, and let it write the plan file: `<the one verbatim argument>` — or, when several items of this roadmap entry came back to plan, `implement <B-a>, <B-b>, … as one plan for the roadmap entry <entry-slug>: <each item's verbatim argument, joined with " · ">`. Stop when the plan is committed. Do not invoke `/esq:build`, `/esq:autopilot`, `/esq:grill` or `/esq:epic`.

`/esq:plan` owns the plan's shape; an existing plan is never passed to it to extend. Return to the starting branch (step 5) and read the result from `esq state`'s `inFlight`.

### 5. Return to the starting branch

After every item and every plan, and before the roadmap refresh: if `git branch --show-current` is not the starting branch, run `git status --porcelain`. Empty → `git switch <starting branch>` and confirm the branch reads back. Anything else — a dirty tree, or a switch git refuses — is the third halt above: stop the walk there with the exact blocker and its command.

Before moving to the next entry, re-check the `needs:` edges: an entry ahead that depends on one you just failed to finish is blocked, not attempted.

## Stops you dissolve, stops you honor

**You dissolve exactly one stop** — `/esq:work`'s `[context]` hand-off to `/esq:plan`, which step 4 carries out once per entry. Continue past it silently.

**You honor every other stop** — asking the user in place and acting on their answer *is* honoring it:

- A grill verdict.
- An `/esq:epic` verdict.
- An item whose status is `Needs-decision`.
- `/esq:work` re-routing mid-flight.
- Any verification failure, failed test or dirty tree.
- Any question the item agent wanted to put to the user.
- A subagent that returned nothing usable, died, was interrupted, or left the artifacts inconsistent.

When one fires: record it against that item, relay the reason **verbatim**, and continue the walk unless it dirtied the tree. Never soften it, summarize away the question, or judge that it "looks minor".

<!-- orch-shared:verbatim-shape:start -->
**Verbatim is not the same as unshaped.** Faithful relay bounds what you may *change*, not what you may *organize*. Relay every gate in the shape below, filled from what the agent returned:
<!-- orch-shared:verbatim-shape:end -->

<!-- decision-block:start -->
**Every 🔴 is a user-owned decision with two or three distinct options:**

> **🔴 <decision, ≤10 words, verb first>**
> - **Why yours:** <one line naming the missing user intent, preference or authorization>
> - **A · <label>** — <consequence, one line> — do: `<runnable command, or file:line → exact replacement>`
> - **B · <label>** — <consequence, one line> — do: `<same>`
> - **Leaning:** **A** — <≤12 words> · or **Leaning:** none — <what is missing>

No introductory or restating paragraph between these lines. If you cannot name distinct options, route substantive work as 🟡 to `/esq:plan` or drop it below the finding bar; "investigate/decide/review X" alone is not an option.

**Establish user ownership first.** Read the mandate, code, approved plan and Active decisions, then make one bounded search. Ask only for an unrecorded preference or authorization affecting product outcome, scope, a major architectural commitment, a stated constraint, or consequential cost/risk. Several viable approaches, uncertainty, UX/design or an absent decision are not sufficient: decide within the mandate and record it. Failures, red checks and missing evidence require diagnosis, never a choice between causes. A prior record authorizes only what its cited authority covers; an entry without a basis is context.

**Arbitrate constraints through `esq standards` first.** If its clause covers both the constraint class and the observed overrun, decide and record the constraint, observed value, clause and `Fondement: mandate — <the clause>`. Ask when the standard is silent, unreadable, exceeded, excludes that class, or the constraint is `(hard)`; disclose an unreadable standard.

**Each `do:` settles only the present decision and runs as written.** Put deferred work in the consequence. Keeping existing state requires verifying it and recording acceptance against the specific decision entry, with the evidence named. A user-only command remains that command alone, never an equivalent edit or shell call. Give a justified leaning, or name why none is possible; the user chooses. Never apply an option while presenting it or present one as already decided.
<!-- decision-block:end -->

Every word of that block comes from the item agent. **You never author an option or a leaning yourself.** **A report with no option set is a diagnosis, relayed as one:** the agent's diagnosis and exact action verbatim, the failing output under `Evidence:`, no option, leaning or decision line around it; that item's hand-off is the agent's named action, then `/esq:work B-N`. Ask the agent again for an option set only when its own report names a missing user authority and offers no options.

<!-- orch-shared:evidence-cap:start -->
The agent's own evidence — failing output, diagnosis, noticed consequence — goes **below** the block under `Evidence:`, capped at ten lines.
<!-- orch-shared:evidence-cap:end -->

### Then ask it, and act on the answer

<!-- orch-shared:route-do:start -->
Before offering options, call `esq apply route '<do A>' '<do B>'` once for the whole set. Read each route:
- `apply`: a subagent may execute the chosen action.
- `relay`: direct-user-only; label it "you run this one yourself". Never spawn it or bypass its restriction.
- `stop`: unknown or mixed; label it "not runnable as written: choosing it keeps your choice, then esq proposes the action to record it". Never spawn an unclassified string.
<!-- orch-shared:route-do:end -->

<!-- decision-ask:start -->
**Ask through `AskUserQuestion` and wait for the user's answer.** Fetch it with `ToolSearch "select:AskUserQuestion"` if needed. Use:
- `question`: the decision verbatim; `header`: ≤12 characters.
- One entry per author's option: its label, consequence and literal `do:`.
- Put the leaning first with `(Recommended)`; with no leaning, preserve order and append nothing.

Never invent, combine or omit options, or add "you decide"/"skip". Apply only the selected `do:` through the routing below; nothing unchosen or deferred is authorized.

One round per gate: if the same step gates again after an applied option, stop and report. If the tool is unavailable, print the option block and stop; do not simulate it, ask in prose or choose for the user.
<!-- decision-ask:end -->

<!-- orch-shared:apply-agent:start -->
**You still never apply it yourself, and only `route: apply` is spawnable.** For that route, spawn one subagent — `general-purpose`, `run_in_background: false`, description `esq:apply`, `model: opus` — whose whole task is the chosen `do:`. On **`route: relay`** there is no spawn and no substitute: print the command flush-left, exactly as written, and stop at that gate — never invoke the skill it names, and never reach the same end another way (its CLI call, an edit of the file it would write, a merge by hand). On **`route: stop`** there is no spawn either. **An unclassifiable `do:` is never handed off as an action:** quote it as the user's answer with the routing reason, never flush-left, cut to a command it mentions, made a `→ Next` or retimed: nothing it mentions becomes a step before the run resumes.

**A repair restates the chosen action, never a different choice.** It is proposed, never substituted: if the label and consequence state the outcome and name what to record it against, read only what the item names (decision IDs, `file:line`, a cited check; six reads, one batch, no agent) and propose *keeps* (the label) · *now* (the smallest `do:` recording or implementing it) · *deferred* (a reminder that runs nothing) · *verify* (the named decision entry, heading to next heading, and the code state or check cited) · *does not* (no other red, no deferred work), asking exactly `Approve the repair (Recommended)`, `Pause — keep the choice, run nothing now` or the escape; an answer changing the choice is a pause. If the outcome is unstated or nothing is named to record it against, ask only for that, then propose.

**A repair never respells a user-only action to make it route `apply`:** it is that command alone, and relays. **Acceptance is verified against the named decision entry and code state, never a repository-wide search**, reusing evidence already recorded rather than re-running a suite the action does not touch.

**An approved repair is routed once, with the same three routes.** `apply` spawns the agent below on the replacement and `relay` relays it; the original is history. **A repair that routes `stop`, cannot be applied or fails its verification has failed: record it and stop this attempt.** A replacement is proposed only on a later resume the user chooses; the failed repair is never routed again.

The task, for the one route that spawns:
<!-- orch-shared:apply-agent:end -->

> Apply exactly this change and nothing else: `<the chosen do:, verbatim — on an approved repair the replacement, never the original>`. It is not yours to improve on, widen, or second-guess. Make the change and run the verification the item names — on an approved repair, by its `verify:` alone. Only once that verification passes, commit it alone as `fix(<scope>): <the option's label>`. If the change cannot be applied as written, make no edit and report why. If it fails that verification, stop: commit nothing, reset, restore, clean or discard nothing, and report the failure and the edits left in the tree. On a repair, `<its deferred reminder>` is not yours to do, and if that verification already passes, change only the record.

**Then continue — but do not re-run the item that gated.** Record it as `gated · option applied`, leave its row as it stands, and move to the next item; if the applied fix in fact closed the work, `/esq:sweep` closes the row on the evidence.

If the apply agent reported it could not apply or verify the change, record that against the item, never attempt it yourself, and walk on only over a clean tree.

**A relayed option is recorded against the item, never applied around it.** On `route: relay`: record the item as `gated · option relayed`, leave its backlog row exactly as it stands, print the command flush-left once in the report, and walk on to the next item.

**An unclassifiable pick is repaired on confirmation, never relayed as a command.** On `route: stop`, follow the repair procedure above for this item: an approved repair that routes `apply` is applied and recorded like a chosen spawnable option, and one that routes `relay` is recorded as relayed. A pause, or a failed repair, records the item as `gated · repair paused` with the chosen option quoted, leaves its backlog row exactly as it stands, and walks on only over a clean tree. **This run keeps no history:** it writes no brief, so a pause or an unapplied approval lives only in this report; only an applied repair survives, as its commit.

<!-- orch-shared:runs-long:start -->
**A subagent that runs long is not a gate.** You have no timeout and never invent one. Wait, and record the elapsed time.
<!-- orch-shared:runs-long:end -->

<!-- orch-shared:elapsed-span:start -->
Report measured elapsed time: use a field on the returning tool result, or one `date` reading before and one after the step, chained into shell calls already needed. The span ends when the result arrives. Ignore later kill notifications, agent-registration lifetime, uncited harness timing and durations in worker prose.
<!-- orch-shared:elapsed-span:end -->

A *user*-interrupted item agent is a failed item: relay and name it; never re-run it silently.

## Refresh the roadmap, last

**At most one refresh, after the walk and only on the starting branch**, when an item's status changed or a plan was written. Skip if nothing changed or the walk halted on another branch.

Spawn one synchronous `general-purpose` agent, description `esq:roadmap`, `model: opus`:

> Invoke the `/esq:roadmap` slash command via the `Skill` tool with no argument — show & refresh only, never reorder. Follow its procedure exactly. This walk changed `<backlog IDs>` and wrote `<plan paths and branches>`: use these as a reading hint, never to omit the rest of the required scan. Report what you refreshed, evicted or flagged in one line.

Relay contradictions and their `/esq:roadmap` recovery command; never reorder, promote or re-derive the queue yourself.

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## The report

Always produce this, even on an early halt:

```
⚠  advance — 3/3 entries · 4 items · 2 closed · 1 planned · 1 blocked · <measured elapsed> · NEEDS YOU (1)

  1  <the unresolved decision on B-153, relayed verbatim>

  [1/3] dev-only-bumps
    B-018  work → inline   ✔ a3f21c9, closed   (4m)
    B-020  work → inline   ✔ 8b40e11, closed   (3m)
  [2/3] alias-sweep
    B-155  work → plan     ✔ docs/plans/<plan>.md on esq/alias-sweep   (9m)
  [3/3] redis-queue
    B-153                 ⏸ Needs-decision — entry skipped

  ✔ roadmap    <what the refresh actually updated>
  ○ not run    build · review

→ Next: <the one exact command the user should run>
```

Zone 2 carries a gate **only while it is still unresolved** — unanswered, unappliable, or raised with no `AskUserQuestion` available. Never reprint an answered gate's options.

Add one `○ worker model  asked opus · session on <model>` line only when this session is not on Opus. There is never a `✔` or `✖` form of it.

Zone 3 has one line per item — route, outcome, elapsed — and a failing item may carry an indented `Evidence:` (≤10 lines, omitted when the outcome line says it), the only place raw subagent output appears.

Compute `→ Next`, first match wins:
- Halted on a dirty tree → `git status`, naming the item that left it and that nothing after it ran.
- An item paused on an unclassifiable pick, or whose repair failed, and nothing above halted → `paused by your choice — nothing to run now (resume later: /esq:work <B-NNN>)`, naming a failed repair first, never the quoted original.
- A decision block still unresolved → `"Run option <A|B|…>'s `do:` above, then: /esq:advance <target>"` on a scoped run (always carry the target through), and the same line without the target on a bare one. Name no option as chosen.
- A plan was written or found already planned → `git switch <its branch>`, with zone 3 naming what follows the switch: `/esq:build <plan path>` `(Phase 1)`, or `/esq:autopilot <path>` when it has two or more phases.
- An item needs grilling → `/esq:grill B-N: <the named ambiguity>`.
- An entry is blocked on a `Needs-decision` item → `/esq:backlog` to answer it.
- Scoped run, `<target>` is closed → `/esq:advance` to walk the rest of `Now` — never report the horizon as clear.
- Bare run, everything in `Now` is closed → `/esq:roadmap` to see what promoted into it.

Send a `PushNotification`: `"esq:advance — <C> closed, <P> planned, <H> handed back. <halted: reason | horizon clear>."`

<!-- orch-shared:notify-ask:start -->
**Notify before you ask, too:** send `"esq:<this command> — <what gated> needs one decision: <the decision line>"` through `PushNotification` *before* the `AskUserQuestion` call, not after it.
<!-- orch-shared:notify-ask:end -->

## Constraints

- **Orchestrate only.** You write no code, no commits, and no files — including `docs/BACKLOG.md` and `docs/ROADMAP.md`, which you read but never edit. Every mutation comes from a subagent following `/esq:work`, `/esq:plan` or `/esq:roadmap`. Your one git action is returning to the starting branch — never forced, never over a dirty tree.
- **Never fix, patch, or work around** what an item agent escalated — except an option the *user* chose, applied verbatim by a subagent.
- **Never build** (`/esq:build`, `/esq:autopilot`) — a plan file is where this command stops, every time. **Never grill or split** (`/esq:grill`, `/esq:epic`) — ambiguity and scope are the user's.
- **The roadmap's `Now` order is the input**, never re-derived, re-sorted or skipped ahead; nothing outside `Now` is targetable.
- **One subagent per item and at most one plan subagent per entry, strictly sequential**, never concurrent; plus one apply agent per decision whose approved action routes `apply`, and one final refresh. State that bound up front.
- **Never retry a failed item** — a failure is a finding, not a flake.
- **A gate is resolved once by the user's pick, applied verbatim, and the gated item is not re-run.** Never answer one on the user's behalf, and never pick an option from an `AskUserQuestion` a subagent raised. Relaying the item agent's leaning is not answering; forming your own, or acting on a prompt nobody answered, is.
- **A decision is relayed as an option set, never as a question, and a diagnosis as a diagnosis** — every option, diagnosis and action from the item agent, never from you.
- **Report the bill** — items, commits, elapsed — per item and again at the end, even on an early halt; a failed item is reported first.
