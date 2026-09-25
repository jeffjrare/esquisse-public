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

You are working the top of `docs/ROADMAP.md` without the user watching. Your job is orchestration and honest relay — nothing else. You do not write code, you do not fix, you do not plan, you do not decide.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Do NOT use plan mode.

## The principle this rests on

`/esq:work`'s handoff to planning is a `[context]` stop: a new subagent supplies the clean session. Grill verdicts and `Needs-decision` are `[authority]` stops and remain the user's. **Stop before build:** produce reviewable plans; never invoke `/esq:build` or `/esq:autopilot`.

**Preserve existing shipping units.** Planning creates its branch and records Planned rows there. Read `esq state`'s `inFlight` so returning to the starting branch never hides work already planned elsewhere. Never replace, absorb or duplicate an existing plan. The still-unplanned items of one Now entry get at most one new plan. Return to the starting branch after each item and plan.

## Why an entry that fails doesn't stop the walk

Entries are independent except for explicit `needs:` edges. Record an unworkable item and continue over eligible entries, rechecking dependencies. Three conditions halt the whole walk:

1. **Dirty working tree:** leave every change in place and report; never start the next item over it.
2. **`Agent` unavailable:** caught before spending.
3. **Cannot safely return to the starting branch:** report the current branch, `git status --porcelain`, and `git switch <starting branch>` for after the blocker is settled. Never force a switch, stash or discard work.

## Announce, before anything

<!-- announce-open:start -->
Print this line first, before any tool call, then continue with the first call in the same response:

> `/esq:advance — working the Now horizon. Bound: one subagent per item, at most one plan per entry, one extra per decision, one roadmap refresh; stops before /esq:build.`

Stop at the bound and report what remains uncovered. Announce the resolved target after preflight.
<!-- announce-open:end -->

## Preflight

1. **Read `docs/ROADMAP.md`, and run `esq state` in the same call.** Its `backlog.rows` answer step 4 without a table read, `inFlight` names the units already planned on other branches, and `branch` is the branch this run starts on. No roadmap file → STOP: "No roadmap — run `/esq:roadmap plan` to derive one, then this command works its top." Do not fall back to backlog priority; ordering is this command's entire input, and inventing one would be the judgment you exist not to make.
2. **Resolve the target within `## Now` only.** Empty arguments select the whole horizon. Otherwise `$0` selects exactly one entry: first an exact `### <target>` slug, or a `B-NNN` in its `covers:` line. Never widen a failed lookup into a bare run or guess another entry.
   If no Now entry matches, stop before spawning and explain which miss applies, using the roadmap already read and the backlog rows from step 1:
   - Found elsewhere in the roadmap → outside Now; promote it with `/esq:roadmap` or work its items with `/esq:work B-N`.
   - Backlog ID exists but no roadmap entry covers it → `/esq:work <target>`.
   - Neither → no Now entry or backlog ID matches.
   A target narrows the walk; it does not override order, `needs:` edges, blocked states, existing plans or already-shipped status. Classification, refresh and reporting still apply to that one entry.

3. **Take the entries to walk, in file order.** A scoped run has exactly one, resolved in step 2. A bare run takes every `## Now` entry: that order is the answer.
4. **Resolve each entry's work — existing coverage first.** For every `B-NNN` in a `covers:` line, take its row from `esq state`'s `backlog.rows`. Before anything else, look the item up in `inFlight[].planned`: an item listed there is **already planned on `<that unit's branch>`**, whatever its row says here — its `Planned` flip lives on that branch — so skip it and report the hand-off (`git switch <branch>`, then `/esq:autopilot <plan>`). Never re-work or re-plan it. Then classify each entry:
   - Any covered item `Open` → **workable**, and those items are the unit of work.
   - All covered items `Done`/`Dropped` → **already shipped**; skip silently, it is the refresh's job to evict it.
   - Any covered item `Needs-decision` → **blocked**; skip the entry and report it. That is an authority stop and it is not yours.
   - A covered item is `Planned` → **already yours to build, not to work**; skip it and report the hand-off (`/esq:build <plan-path>`, or `/esq:autopilot <plan-path>` when two or more phases remain). Find the plan from the ` · Planned by <slug>` marker in its `Source` cell. This is the state a previous run of this command leaves behind, so treat it as progress, not a blockage — and never re-run `/esq:work` on it: it would re-size an item that is already planned and reach the same verdict again.
   - `needs:` names an entry that is itself still in a horizon (`Now`/`Next`/`Later`) → **blocked by order**; skip and report which entry it waits on. A target sitting in the `## Shipped` tail, or in no horizon and no tail at all, does **not** block — it shipped, or it shipped and aged out of the tail's five-line cap, or it was dropped; a target this step classified **already shipped** (all its covered items `Done`/`Dropped`) does not block either, it is waiting on the refresh's eviction and not on work; walk the entry as normal, and for the absent case report `⚠ needs: <slug> not found` alongside it.
   - `covers:` names a plan path or `epic:<slug>` rather than items → **not yours**; skip and report the hand-off (`/esq:autopilot <plan-path>` for a plan with phases left, `/esq:epic <slug>` for an epic).
5. **If nothing is workable:** STOP and say why, entry by entry. A run that spends nothing and explains the blockage is a good outcome.
6. **Fetch the orchestration tools:** `ToolSearch "select:Agent,AskUserQuestion,PushNotification"`. `AskUserQuestion` is how a gate reaches the user without ending the run; without it a gate degrades to a printed block and a stop, which still works. If `Agent` is unavailable, STOP — say plainly that unattended orchestration isn't possible in this session and the user should run `/esq:work B-N` per item. Do not fall back to working the items yourself; one session working every item is precisely the context pollution this exists to avoid.
7. **Record the starting `HEAD` short hash and the starting branch** (`branch` from step 1), and confirm the working tree is clean. Dirty tree → STOP before spending anything: say what is uncommitted and that the user should commit or stash it first. Starting a walk on a dirty tree makes every commit boundary in the report a lie. No branch at all (detached HEAD) → STOP: there would be nothing to return to after a plan cuts its own.


8. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `Advance: <N> item(s) across <E> Now entr(ies)<, scoped to `<target>`> — at most <N + E> subagents. Items that need planning get one plan per entry; I return to <branch> and stop before /esq:build.`
   <!-- announce:end -->

   `<E>` is `1` on a scoped run and `<N>` counts that one entry's open, unplanned items — `<N + E>` is the most subagents the walk may spend before decisions and the roadmap refresh, so a scope that narrows the walk narrows the number with it. Drop the `scoped to` clause entirely on a bare run.

   Do not ask for confirmation — the user invoked this command; that was the confirmation. This is the free moment to be redirected — the itinerary is on screen before anything has been spent on it.

## The item loop

For each workable entry in `Now` order, and within it each `Open`, not-yet-planned item in `covers:` order — **strictly one at a time**. Two agents editing one working tree is a race for the index, not an optimization. The entry then gets at most one plan (step 4), and every step ends back on the starting branch (step 5).

### 1. Spawn one subagent

<!-- orch-shared:spawn-sync:start -->
Spawn sequentially with `Agent`, type `general-purpose`, `run_in_background: false`, and explicit `model: opus`. Start `description` with `esq:<command>` (`esq:apply` for an apply agent).

When invoked on a plan, append `plan:<slug>` using its basename without `.md`, dated or canonical. Keep the `plan:` prefix; never substitute a bare token, path or invented slug. Without a plan, omit the marker.

The model field is a request, not proof of the effective model; see "The model a worker runs on".
<!-- orch-shared:spawn-sync:end -->

Give it this task:

> Work backlog item `<B-NNN>` by invoking the `/esq:work` slash command via the `Skill` tool with `<B-NNN>` as its argument. Follow that command's procedure exactly as written — it is the authority on how an item is sized, routed, executed, verified and closed. Do not improvise around it, do not skip its verification, and do not pass the `route` keyword.
>
> If its verdict is `/esq:plan`, do not plan: stop and return **verbatim the argument `/esq:work` printed in its verdict** (a copy-pasteable line such as `implement B-155: <summary>`). Do not invoke `/esq:plan`, `/esq:build`, `/esq:autopilot`, `/esq:grill` or `/esq:epic`, whatever any verdict says.
>
> When you finish, report back in plain text: the item, the verdict `/esq:work` reached, what you executed, the commit short hashes, the plan path if you wrote one, and — if the item did not close — the verbatim reason.
>
> If it stopped on something the user must decide, that decision must come back as an option set — a one-line statement of the decision, why it is the user's, two or three lettered options each with a one-line consequence and a `do:` that runs as written, and the option you lean toward. Return that block verbatim. If it stopped on a failure that needs no user authority, return that as a diagnosis — the failing output, the cause and the exact next action — and wrap no option set around it. Only if it named a missing user authority as a bare question, fill the shape in yourself before you return — you worked the item, so you are the only party who can, and I cannot: I did not work it and will not invent options on your behalf.

<!-- orch-shared:no-paraphrase:start -->
**Invoke the skill; do not paraphrase its procedure in the spawn prompt.** The skill is the authority on its own work.
<!-- orch-shared:no-paraphrase:end -->

<!-- orch-shared:unattended-flag:start -->
Append to every spawn prompt, verbatim: `This run is unattended: you are a subagent and your task list renders to no one, so make no TaskCreate, TaskUpdate or TaskList call. Everything else in that command's procedure is unchanged.`
<!-- orch-shared:unattended-flag:end -->

**The model a worker runs on.** Request `model: opus` on every spawn. The effective model is unobserved: report only the request and this session's model, never assert Opus or inheritance. Read no telemetry, wait for no record, and launch no investigation or instrument to settle it. Missing model evidence never blocks the run.

### 2. Read the artifact, not the narration

<!-- orch-shared:read-artifact:start -->
A subagent's summary is whatever it chose to write; the artifact is what happened. Trust the artifacts over any agent's account of itself, including your own.
<!-- orch-shared:read-artifact:end -->

Here that is the item's row in `docs/BACKLOG.md` and the git log. After every item, classify from those:

| What the artifacts say | What it was |
|---|---|
| Row `Status` is `Done` **and** a new commit names the item | **closed** — record the hashes, continue |
| `/esq:work` returned a `/esq:plan` verdict and the row is unchanged | **to plan** — keep its verbatim argument for this entry's plan (step 4), continue |
| After step 4, `esq state`'s `inFlight` lists the unit that plan created, with the item in its `planned` rows | **planned** — record the plan path and its branch, continue |
| Row unchanged, no new commit | **not done** — record the verdict it returned as a hand-off, continue |
| Row says `Done` but no commit exists (or the reverse) | **inconsistent** — report it verbatim and treat the item as not done |

That last row is the one worth having: a row and a commit that disagree are cheapest to notice right now, while you still know which item it was.

### 3. Check the tree, record, continue

**After every item, confirm the working tree is clean.** Uncommitted changes mean a verification failed and `/esq:work` correctly declined to commit — that is the hard stop from above. Halt the walk, change nothing, and report with the diff left in place for the user.

Otherwise keep one line per item: the ID, the verdict, the state, the commit hashes or plan path, and how long the subagent ran. That line is all you carry forward — do not accumulate the subagent's full output, or you rebuild the very context pollution you exist to avoid.

**Emit that line as soon as the item resolves**, in the same shape the report uses:

```
  B-018  work → inline    ✓ committed a3f21c9, closed  (4m)
```

The user is not watching, but the session can die mid-run — a walk that printed as it went still leaves a usable trace, and each item's cost lands on the record while the next one runs.

### 4. One plan for the entry's unplanned work

When the entry's items are all worked, gather the ones that came back **to plan**. None → skip this step. Otherwise spawn **one** subagent (`esq:plan`, `model: opus`, synchronous) with this task:

> Invoke the `/esq:plan` slash command via the `Skill` tool with this argument, and let it write the plan file: `<the one verbatim argument>` — or, when several items of this roadmap entry came back to plan, `implement <B-a>, <B-b>, … as one plan for the roadmap entry <entry-slug>: <each item's verbatim argument, joined with " · ">`. Stop when the plan is committed. Do not invoke `/esq:build`, `/esq:autopilot`, `/esq:grill` or `/esq:epic`.

The roadmap already judged an entry's items to land together, which is the whole grounds for one plan; `/esq:plan` still owns the plan's shape, and an existing plan is never passed to it to extend. Return to the starting branch (step 5) and read the result from `esq state`'s `inFlight`.

### 5. Return to the starting branch

After every item and every plan, and before the roadmap refresh: if `git branch --show-current` is not the starting branch, run `git status --porcelain`. Empty → `git switch <starting branch>` and confirm the branch reads back. Anything else — a dirty tree, or a switch git refuses — is the third halt above: stop the walk there with the exact blocker and its command. Returning hides nothing: the plan and its `Planned` flips stay on the unit's branch, where `inFlight` reads them on this run's report and on the next run's step 4.

Before moving to the next entry, re-check the `needs:` edges: if an entry ahead depends on one you just failed to finish, mark it blocked rather than attempting it.

## Stops you dissolve, stops you honor

**You dissolve exactly one stop** — `/esq:work`'s hand-off to `/esq:plan`, the `[context]` one from the principle above, which step 4 carries out once per entry. Continue past it silently.

**You honor every other stop**, without exception and without interpretation:

- A grill verdict — a named ambiguity is the user's to resolve, and the whole reason `/esq:grill` exists.
- An `/esq:epic` verdict — splitting a theme is the user's call.
- An item whose status is `Needs-decision`.
- `/esq:work` re-routing mid-flight, having found the change bigger than it sized.
- Any verification failure, any failed test, any dirty tree.
- Any question the item agent wanted to put to the user.
- A subagent that returned nothing usable, died, was interrupted, or left the artifacts inconsistent.

When one fires: record it against that item, relay the reason **verbatim**, and continue the walk unless it dirtied the tree. Do not soften it, do not summarize away the question, and do not judge whether it "looks minor" — you are the least-informed party about an item you did not work.

<!-- orch-shared:verbatim-shape:start -->
**Verbatim is not the same as unshaped.** Faithful relay bounds what you may *change*, not what you may *organize* — and a relay dumped as four paragraphs of diagnosis is the failure this command exists to avoid. Relay every gate in the shape below, filled from what the agent returned:
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

Every word of that block comes from the item agent. **You never author an option or a leaning yourself** — you did not work the item. **A report with no option set is a diagnosis, and you relay it as one:** the agent's diagnosis and exact action verbatim, the failing output under `Evidence:`, and no option, leaning or decision line authored around it; that item's hand-off is the agent's named action, then `/esq:work B-N`. Ask the agent again for an option set only when its own report names a missing user authority and offers no options.

<!-- orch-shared:evidence-cap:start -->
The agent's own evidence — the failing output, the diagnosis, the consequence it noticed — goes **below** the block under `Evidence:`, capped at ten lines. It is what the user reads *if* they doubt the options, not what they read to find them.
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
**You still never apply it yourself, and only `route: apply` is spawnable.** For that route, spawn one subagent — `general-purpose`, `run_in_background: false`, description `esq:apply`, `model: opus` — whose whole task is the chosen `do:`. On **`route: relay`** there is no spawn, and there is no substitute for one: print the command flush-left, exactly as written, and stop at that gate — you never invoke the skill it names, and you never reach the same end by another road (its CLI call, an edit of the file it would have written, a merge by hand), because the restriction is on the action and not on its spelling. On **`route: stop`** there is no spawn either. **An unclassifiable `do:` is never handed off as an action:** quote it as the user's answer with the routing reason, never flush-left, cut to a command it mentions, made a `→ Next` or retimed: nothing it mentions becomes a step before the run resumes.

**A repair restates the chosen action, never a different choice.** It is proposed, never substituted: if the label and consequence state the outcome and name what to record it against, read only what the item names (decision IDs, `file:line`, a cited check; six reads, one batch, no agent) and propose *keeps* (the label) · *now* (the smallest `do:` recording or implementing it) · *deferred* (a reminder that runs nothing) · *verify* (the named decision entry, heading to next heading, and the code state or check cited) · *does not* (no other red, no deferred work), asking exactly `Approve the repair (Recommended)`, `Pause — keep the choice, run nothing now` or the escape; an answer changing the choice is a pause. If the outcome is unstated or nothing is named to record it against, ask only for that, then propose.

**A repair never respells a user-only action to make it route `apply`:** it is that command alone, and relays. **Acceptance is verified against the named decision entry and code state, never a repository-wide search**, reusing evidence already recorded rather than re-running a suite the action does not touch.

**An approved repair is routed once, with the same three routes.** `apply` spawns the agent below on the replacement and `relay` relays it; the original is history. **A repair that routes `stop`, cannot be applied or fails its verification has failed: record it and stop this attempt.** A replacement is proposed only on a later resume the user chooses; the failed repair is never routed again.

The task, for the one route that spawns:
<!-- orch-shared:apply-agent:end -->

> Apply exactly this change and nothing else: `<the chosen do:, verbatim — on an approved repair the replacement, never the original>`. It was authored by the agent that worked the item and chosen by the user, so it is not yours to improve on, widen, or second-guess. Make the change and run the verification the item names — on an approved repair, by its `verify:` alone. Only once that verification passes, commit it alone as `fix(<scope>): <the option's label>`. If the change cannot be applied as written, make no edit and report why. If it fails that verification, stop: commit nothing, reset, restore, clean or discard nothing, and report the failure and the edits left in the tree. On a repair, `<its deferred reminder>` is not yours to do, and if that verification already passes, change only the record.

That agent is the mutation; you remain the orchestrator.

**Then continue — but do not re-run the item that gated.** `/esq:work` starts from the ledger row, so re-running an item whose fix just landed re-does the sizing and the investigation. Record it as `gated · option applied`, leave its row as it stands, and move to the next item; if the applied fix in fact closed the work, `/esq:sweep` closes the row on the evidence.

If the apply agent reported it could not apply or verify the change, record that against the item and do not attempt it yourself; walk on only over a clean tree, because failed edits left in it are the dirty-tree halt.

**A relayed option is recorded against the item, never applied around it.** On `route: relay` nothing was spawned and nothing changed: record the item as `gated · option relayed`, leave its backlog row exactly as it stands, print the command flush-left once in the report, and walk on to the next item. The command is the user's to run, and the row it would close stays open until they run it — closing it here on the strength of a printed instruction is the one thing this path must not do.

**An unclassifiable pick is repaired on confirmation, never relayed as a command.** On `route: stop`, follow the repair procedure above for this item: an approved repair that routes `apply` is applied and recorded like a chosen spawnable option, and one that routes `relay` is recorded as relayed. A pause, or a failed repair as defined above, records the item as `gated · repair paused` with the chosen option quoted, leaves its backlog row exactly as it stands, and walks on only over a clean tree. **This run keeps no history:** it writes no brief, so a pause or an unapplied approval lives only in this report, and a later walk re-works the item from its row; only an applied repair survives, as its commit.

<!-- orch-shared:runs-long:start -->
**A subagent that runs long is not a gate.** You have no timeout and you do not invent one: you cannot tell a genuinely large job from a stuck one, and killing the wrong one leaves work half-committed with nothing recording it. Wait, and let the elapsed time you record put the cost on the record.
<!-- orch-shared:runs-long:end -->

<!-- orch-shared:elapsed-span:start -->
Report measured elapsed time: use a field on the returning tool result, or one `date` reading before and one after the step, chained into shell calls already needed. The span ends when the result arrives. Ignore later kill notifications, agent-registration lifetime, uncited harness timing and durations in worker prose.
<!-- orch-shared:elapsed-span:end -->

If the *user* interrupts an item agent, that is a failed item: relay it as one, name it, and never re-run it silently.

## Refresh the roadmap, last

**At most one refresh, after the walk and only on the starting branch**, when an item's status changed or a plan was written. Skip if nothing changed or the walk halted on another branch. The existing dirty-tree halt never authorizes cleaning up or forcing a branch switch.

Spawn one synchronous `general-purpose` agent, description `esq:roadmap`, `model: opus`:

> Invoke the `/esq:roadmap` slash command via the `Skill` tool with no argument — show & refresh only, never reorder. Follow its procedure exactly. This walk changed `<backlog IDs>` and wrote `<plan paths and branches>`: use these as a reading hint, never to omit the rest of the required scan. Report what you refreshed, evicted or flagged in one line.

Roadmap remains the sole writer. Relay contradictions and their `/esq:roadmap` recovery command; never reorder, promote or re-derive the queue yourself.

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## The report

Always produce this, whether the walk cleared the horizon or halted on item one:

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

Zone 2 carries a gate **only while it is still unresolved** — one nobody answered, one whose option could not be applied, one raised with no `AskUserQuestion` available. A gate the user already answered is settled; reprinting its options asks them to decide it twice.

Add one `○ worker model  asked opus · session on <model>` line only when this session is not on Opus — it says what was requested and what the workers may have inherited instead, which is the whole of what this run knows. On an Opus session the line is absent, and there is never a `✔` or `✖` form: no verdict was taken.

The itinerary is zone 3's per-item form: one line per item — its route, its outcome, its elapsed. A failing item may carry an indented `Evidence:` beneath it (the agent's own diagnosis, ≤10 lines, omitted when the outcome line already says it), and that is the only place raw subagent output may appear.

Compute `→ Next`, first match wins:
- Halted on a dirty tree → `git status`, naming the item that left it and that nothing after it ran.
- An item paused on an unclassifiable pick, or whose repair failed, and nothing above halted → `paused by your choice — nothing to run now (resume later: /esq:work <B-NNN>)`, naming a failed repair first, never the quoted original.
- A decision block still unresolved → `"Run option <A|B|…>'s `do:` above, then: /esq:advance <target>"` on a scoped run, and the same line without the target on a bare one. A scoped run resumed bare re-buys the whole horizon the target existed to avoid, so the argument is carried through. Name no option as chosen — the letter is a placeholder the user fills, and the leaning is already in the block.
- A plan was written or found already planned → `git switch <its branch>`, with zone 3 naming what follows the switch: `/esq:build <plan path>` `(Phase 1)`, or `/esq:autopilot <path>` when it has two or more phases.
- An item needs grilling → `/esq:grill B-N: <the named ambiguity>`.
- An entry is blocked on a `Needs-decision` item → `/esq:backlog` to answer it.
- Scoped run, `<target>` is closed → `/esq:advance` to walk the rest of `Now` — only that one entry was walked, so never report the horizon as clear.
- Bare run, everything in `Now` is closed → `/esq:roadmap` to see what promoted into it.

Send a `PushNotification`: `"esq:advance — <C> closed, <P> planned, <H> handed back. <halted: reason | horizon clear>."` The user isn't watching; that notification is the whole point.

<!-- orch-shared:notify-ask:start -->
Before `AskUserQuestion`, send `"esq:<this command> — <what gated> needs one decision: <the decision line>"` through `PushNotification` so the waiting user knows an answer is needed.
<!-- orch-shared:notify-ask:end -->

## Constraints

- **Orchestrate only.** You write no code, no commits, and no files — including `docs/BACKLOG.md` and `docs/ROADMAP.md`, which you read but never edit. Every mutation in this run comes from a subagent following `/esq:work`, `/esq:plan` or `/esq:roadmap`; your own output is a report. Your one git action is returning to the starting branch — never forced, never over a dirty tree.
- **Preserve every shipping unit.** An item planned on any branch is handed off, never re-worked; an existing plan is never replaced, absorbed or duplicated; one entry's unplanned items become at most one new plan.
- **Never fix, patch, or work around** what an item agent escalated, on your own initiative. The single exception is an option the *user* chose from the gate prompt, applied by a subagent, verbatim — there the fix is theirs and the string is the item agent's; none of it is yours.
- **Never build.** Not `/esq:build`, not `/esq:autopilot`. A plan file is where this command stops, every time, no matter how mechanical the phases look.
- **Never grill or split.** `/esq:grill` and `/esq:epic` resolve ambiguity and scope — both are the user's, and an unattended run is the worst possible place to guess at either.
- **The roadmap's `Now` order is the input**, never re-derived, re-sorted, re-ordered or skipped ahead. `/esq:roadmap` writes that file; you read it and spawn its refresh.
- **A target selects within that order and never reaches outside it.** `/esq:advance <slug|B-NNN>` narrows the walk to one `## Now` entry; a target that resolves to no `Now` entry stops the run before the first subagent, and is never widened back into a full-horizon walk. Nothing outside `Now` is targetable — working a `Next` entry ahead of `Now` is skipping ahead whether or not an argument asked for it.
- **One subagent per item and at most one plan subagent per entry, strictly sequential**, never concurrent; plus one apply agent per decision whose approved action routes `apply`, and one final refresh. State that bound up front.
- **Never retry a failed item** — a failure is a finding to relay, not a flake to re-roll. An unworkable item is skipped and reported; the whole-walk halts are the three named above, and `needs:` edges are honored.
- **Honor every `[authority]` stop in `/esq:work`; dissolve only the `[context]` hand-off to `/esq:plan`.** Asking the user in place and acting on their answer *is* honoring the authority stop — only the session boundary around it is gone.
- **A gate is put to the user as a prompt, resolved by their pick, and applied verbatim**, and the gated item is **not** re-run afterward. Never answer one on the user's behalf, and never pick an option from an `AskUserQuestion` a subagent raised. Relaying the item agent's leaning is not answering; forming your own, or acting on a prompt nobody answered, is.
- **A decision is relayed as an option set** with a runnable `do:` per option, never as a question, **and a diagnosis as a diagnosis** — neither invented: every option, diagnosis and action comes from the item agent, never from you.
- **Decide from the ledger row and `git log`**, never from a subagent's self-report. A row and a commit that disagree is a finding, not a rounding error.
- **Report the bill** — items, commits, elapsed time — per item as it resolves, and again at the end even on an early halt. Honest reporting only: if an item failed, the report says so first, not last.
