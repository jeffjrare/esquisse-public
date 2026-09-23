---
description: Run the corrective loop unattended — review, then fix what it found, stopping at each gate for your pick.
name: converge
argument-hint: "[target] [options]"
disable-model-invocation: true
model: inherit
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You are closing the corrective loop on a finished plan without the user watching. Your job is orchestration and honest relay — nothing else. You do not review, you do not fix, you do not decide.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Use `esq next-phase "$0"` to prove the plan is complete before starting, `esq branch check "$0"` for the branch-ownership verdict that gates the whole run, `esq brief plan "$0"` when the target is a corrective brief, `esq plan set-reviewed` to record a clean completion's review coverage, and `esq validate` for invariants. The CLI cannot decide finding severity, user authority, or whether a returned fix is trustworthy.

Do NOT use plan mode. No code: you write only a brief's decision lines, a strike on `applied: true`, and on a clean completion the `**Reviewed at:**` field `esq plan set-reviewed` writes and its one commit, after every check in "Ready to land" has passed. **This command never merges;** landing is `/esq:land`.

## The principle this rests on

`/esq:check`, `/esq:review` and `/esq:fix` all end by telling the user to `/clear` and run the next step. Those stops are `[context]`-class — they exist because context accumulates across a finder and its fixer, not because a decision is owed.

A subagent has its own context window. **A subagent is a clean session**, so dissolving those stops implements what `/clear` was doing by hand.

It covers exactly those stops. Every other stop is a decision owed to the user, and you honor all of them. See "Gates you honor" below.

## The itinerary — one fixed sequence, on every plan

1. `/esq:review <plan>`.
2. `/esq:fix <brief>` only if the review wrote a brief with 🟢 items.
3. Report and stop. At most two step agents, plus one apply agent per approved decision routed `apply`.

The review covers both the delivered goal and code quality; `/esq:check` remains a user-requested diagnosis. Never follow a worker's `→ Next`, repeat a step, or add a re-review after fix. Brief entry starts at step 2 under the provenance rules in Preflight.

## What this run leaves behind, and what it never claims

- **Clean review:** the review's own coverage says it read those commits.
- **Review then verified fixes, nothing open:** the fixes have not been read by a reviewer. Record only this run's provenance, `plan(converged):`, after "Ready to land" passes. Never use `plan(reviewed):`: a later delta review must not skip unseen fixes.
- **Open findings, gates or failed workers:** report `○ not ready` and the action that clears them; never claim a clean completion.

Do not add a step to close these gaps. Standalone fix and land can recommend the review they require; this command keeps its fixed itinerary.

## The invariant — no decisions about cost, at any point

One clause, and it is the whole of what this command promises about what it spends:

**The itinerary is fixed before the run starts and is never re-decided inside it.** You run review → fix to its end. Nothing a subagent returns lengthens it, shortens it, or reorders it: not a reviewer reporting the change is scarier than the plan thought, not a fixer that escalated everything to 🟡, not a `→ Next` line pointing past step 2. Relay what you saw and let the report carry it — the user overrides the sequence any time by invoking a finder directly, which you never refuse.

## Announce, before anything

<!-- announce-open:start -->
Print this line first, before any tool call, then continue with the first call in the same response:

> `/esq:converge — review, then fix what it found. Bound: at most two subagents, one extra per decision; never merges.`

Stop at the bound and report what remains uncovered. Announce the resolved target after preflight.
<!-- announce-open:end -->

## Preflight

1. **Resolve the argument.**
   - A `*-fixes.brief.md` path → the run **enters at the fix step**, one subagent instead of two. Someone already ran the finder, and re-running it would pay again for findings you already have.

     Run `esq brief plan <brief-path>` once and retain `plan`, `range`, `finder` after the brief is deleted. Stop on any resolution refusal; never guess.
     - `plan: null`: stop and recommend `/esq:fix <brief-path>`. Never pass its range as a plan; fix handles the corrected range.
     - `finder: review`: eligible for coverage after the clean bar, as the fix half of review → fix.
     - `finder: check` or `null`: fix only, then `○ not ready — fixes applied, no review has read this unit` → `/esq:review <plan-path>`. Never write `**Reviewed at:**` or `plan(converged):`. Disclose missing provenance for `null` and announce this outcome before spending.

   - A plan path → start at step 1.
   - No argument → the most recently modified `*.md` in `docs/plans/` excluding `*.brief.md` and `*.log.md`. None → STOP and say so.
2. **Check the branch owns this plan — before the first spawn, before anything is spent.** Run `esq branch check <plan-path>`, once, here, on the plan path step 1 resolved. It is the only thing that decides branch ownership: it compares the current branch against the plan's recorded `**Branch:**` and every other shipping unit's recorded branch, and returns one JSON verdict, reading only. Route off `refuse`, never off the prose:
   - **`refuse: false`** → carry the verdict into the announce line in step 7 — `branch <name>` for `ok`, and `branch unrecorded — legacy plan` for a plan written before the field existed — and continue unchanged. Nothing else in this command reads it.
   - **`refuse: true`** → STOP here, before a subagent is spawned and before a byte is written. Put the refusal to the user as the option set in "Refuse a branch this plan does not own" below. Never switch a branch yourself, and never edit the plan header to make this run proceed.

   **Read `unit.open` from that verdict before spawning.** Any open same-unit 🐛/⚠️ row stops the run: print its ID, type, status and Source. Close nothing. Recommend `/esq:work <B-NNN>` for a verified fix, or the user's `/esq:backlog <B-NNN> dropped` to accept it unfixed, then resume converge. Empty means continue silently.

   For brief entry, check the resolved stem plan; the CLI already handles corrective/stem ownership.

3. **Classify the phases from the skeleton grep** — you need the headings only, so read them directly: `grep -n -E '^#{1,3} ' <plan-path>` — a strict subset of the skeleton grep `/esq:autopilot` carries in its `shared:log-skeleton` block, which stays the authority on what that output means. Do not open another command file to recover an expression. The `### Phase N —` headings above `## Execution log` are the phases; those inside the log span are their entries, each classified by its own heading text: `completed`, `⏸ paused`, or no entry at all. Read no entry body — the classification is all you need, and it is all step 4 uses; nothing downstream reads an entry either.
4. **Refuse an unfinished plan.** If any phase is `⏸` or has no log entry, STOP. Reviewing a half-built plan reports the unbuilt half as gaps, and the user pays a subagent for a list they could have predicted. → Next is `/esq:build <plan-path>` (a `⏸` pause) or `/esq:autopilot <plan-path>` (phases remaining).
5. **Fetch tools:** `ToolSearch "select:Agent,AskUserQuestion,PushNotification"`. `AskUserQuestion` is how a 🔴 reaches the user without ending the run; without it a red degrades to a printed block and a stop, which still works. If `Agent` is unavailable, STOP — say plainly that unattended orchestration isn't possible in this session and the user should run `/esq:check` themselves. Do not fall back to running the steps yourself; one session holding a check, a fix and a review is precisely the context pollution this exists to avoid.
6. **Record the starting `HEAD` short hash**, and snapshot the current set of `docs/plans/*-fixes.brief.md` paths. Step 1 needs to know which brief is new.
7. **Announce the resolved target** — the second line, once preflight has settled which itinerary this run is and what it costs:
   <!-- announce:start -->
   > `Converge on <slug> — branch <the step-2 verdict: the branch name, or `unrecorded — legacy plan`>: review → fix, at most 2 subagents.`

   Entering from a brief, drop the review and its cost, and say what the run can end at — which `finder` already decided:
   > from a **review** brief: `Converge on <slug> from <brief> — branch <same>: fix, at most 1. Can end ready to land.`
   > from a **check** brief, or one declaring no finder: `Converge on <slug> from <brief> — branch <same>: fix, at most 1. Ends at /esq:review — no review has read this unit.`
   <!-- announce:end -->

   Do not ask for confirmation — the user invoked this command; that was the confirmation. This is the free moment to be redirected — the target is on screen before anything has been spent on it.

## Refuse a branch this plan does not own

Reached only from preflight step 2, on `refuse: true`. Nothing has been spawned and nothing written, and nothing will be: this is an **authority** stop and it is terminal. Converge never picks a branch for the user, never runs a `git switch` itself, and never edits the plan's `**Branch:**` field to make itself proceed — that field is `/esq:plan`'s, single-writer **among commands**, and rewriting it here would convert a guard into a rubber stamp. The rule binds commands, never the human: your own edit to your own plan header is the escape, and it is the second step option A asks you for.

Hand the decision back as an option set, in this shape and no other. The verdict supplies every value in it: `reason` is the opener, `branch` and `recorded` fill the `git switch` lines, `owners[].file` names the conflict, and the plan's filename slug is the fresh-branch name.

```
**Decision — <one line: this branch is <branch>, and this plan <recorded <recorded> | is owned by <owners[0].file>>.>**
Yours because it settles where this run's fix commits land, and only you know whether this branch is meant to carry this plan's work.

A. Start this plan's own branch.
   Consequence: the itinerary's commits land somewhere nothing else claims; <branch> keeps whatever it already carries.
   do: git switch -c esq/<plan-slug>
   then: unless the plan header's **Branch:** field already names that branch, edit it to esq/<plan-slug> yourself and re-run /esq:converge <target> — the switch alone leaves the header naming the branch that was just refused.
B. Continue on the branch this plan recorded.   [mismatch only]
   Consequence: the run happens where the plan says its work goes; whatever is uncommitted here comes with you.
   do: git switch <recorded>
C. Record the reuse deliberately.
   Consequence: <branch> ends up owning two plans' work, and /esq:land later lands <branch> into the plan's **Origin:** — everything else that branch carries goes with it; take it only when the two are one shipping unit.
   do: edit the plan header's **Branch:** field to <branch> yourself, then re-run /esq:converge <target>

Leaning: <A on `mismatch` where the recorded branch no longer exists, B on `mismatch` where it does, A on `owned-elsewhere`.>
```

Three verdicts arrive here, and each shifts the wording, never the shape:

- **`mismatch`** — the plan recorded a branch, HEAD is on another. Name both. All three options apply; B is the leaning whenever `recorded` still exists as a ref, because the plan already said where its work goes.
- **`owned-elsewhere`** — a *different* plan recorded this branch. Name that plan's path, as a fact about how confusing the reuse would be — it is not what decided the refusal, since ownership alone does. Drop options B *and* C, and lean A: this verdict only fires where the plan already records `<branch>`, so returning to the recorded branch and recording the reuse are both no-ops — the claim being refused is the other plan's. A is the only escape the rule leaves, and neither of its halves clears the gate alone: the `git switch -c` without the header edit refuses again as `mismatch`, and the header edit without the switch leaves HEAD on the contested branch. Give both steps.
- **`detached`** — HEAD is on no branch at all. There is nothing to reuse and nothing to record, so the option set collapses to A, plus returning to whatever branch the user left (`git switch -`).

Then stop. Do not re-run the check hoping for a different verdict, do not spawn the itinerary's first step, and do not fall through to the announce line.


## Running a step

<!-- orch-shared:spawn-sync:start -->
Spawn sequentially with `Agent`, type `general-purpose`, `run_in_background: false`, and explicit `model: opus`. Start `description` with `esq:<command>` (`esq:apply` for an apply agent).

When invoked on a plan, append `plan:<slug>` using its basename without `.md`, dated or canonical. Keep the `plan:` prefix; never substitute a bare token, path or invented slug. Without a plan, omit the marker.

The model field is a request, not proof of the effective model; see "The model a worker runs on".
<!-- orch-shared:spawn-sync:end -->

The task, with `<command>` and `<argument>` filled in:

> Invoke the `<command>` slash command via the `Skill` tool with `<argument>` as its argument. Follow that command's procedure exactly as written — it is the authority on its own job. Do not improvise around it and do not skip its verification.
>
> When it finishes, report back in plain text: what it did, the path of any brief it wrote or deleted, the commit short hashes it made, and — if it stopped early — the verbatim reason.
>
> If it stopped on something the user must decide, that command requires the decision to be written as an option set — a one-line statement of the decision, why it is the user's, two or three lettered options each with a one-line consequence and a `do:` that runs as written, and the option it leans toward. Return that block verbatim. If it stopped on a failure that needs no user authority, return that as a diagnosis — the failing output, the cause and the exact next action — and wrap no option set around it. Only if it named a missing user authority as a bare question, fill the shape in yourself before you return — you ran the step, so you are the only party who can; I did not, and I will not invent options on your behalf.

<!-- orch-shared:no-paraphrase:start -->
**Do not restate a command's procedure in your prompt.** A paraphrase drifts from the real command on the next edit, and you would have two descriptions of one procedure disagreeing — the defect class `docs/AUDIT.md` exists to prevent.
<!-- orch-shared:no-paraphrase:end -->

<!-- orch-shared:unattended-flag:start -->
Append to every spawn prompt, verbatim: `This run is unattended: you are a subagent and your task list renders to no one, so make no TaskCreate, TaskUpdate or TaskList call. Everything else in that command's procedure is unchanged.`
<!-- orch-shared:unattended-flag:end -->

**The model a worker runs on.** Every `Agent` spawn below carries `model: opus`, explicitly. Whether the harness honors it is not something this run can see: nothing here reads telemetry, waits for a record or asserts a verdict, and a worker that ignored the field would have inherited this session's model. **So do not claim the effective model in either direction** — not that a worker ran on Opus, not that it inherited. What you may state is what you asked for, and what this session is on. None of this is ever a reason to stop, to investigate, or to send the user to an instrument: a missing measurement is a missing measurement.

## Read the artifact, not the narration

<!-- orch-shared:read-artifact:start -->
A subagent's summary is whatever it chose to write; the artifact is what happened. Trust the artifacts over any agent's account of itself, including your own.
<!-- orch-shared:read-artifact:end -->

Here that is the brief file and the git log. After every step, classify from those.

**After the review (step 1):**

1. Re-list `docs/plans/*-fixes.brief.md`. The brief is the path that is new since your snapshot, or the one whose mtime moved. Cross-check it against the `brief(fixes): <slug>` commit the finder made (`git show --stat`) if two candidates are ambiguous — the finders append `-2`, `-3` to avoid clobbering, so "the newest" is a guess and the commit is a fact. Update your snapshot.
2. **No new or modified brief** → the review found nothing that clears its bar. That is the clean outcome.
3. Otherwise read the brief and count the items under each of `## 🟢 Fix now (safe)`, `## 🟡 Needs a plan`, and `## 🔴 Needs your decision`.

<!-- brief-routing:start -->
**🔴 outranks every other tier.** Any 🔴 item present → settle it before any fix runs. A 🔴 is a question only the user can answer, and it may be the question of whether the 🟢 items are worth applying at all. Do not apply the greens first and surface the reds after; do not judge whether a particular red "looks independent" of them. Put it to the user as its option set, and let their answer land before the fix step begins.
<!-- brief-routing:end -->

Then: any 🟢 → run the fix step against this brief. No 🟢 → skip the fix and go to the report.

**After the fix (step 2):**

`/esq:fix` is resilient by design — a failed item is downgraded to 🟡 and the run continues. So a fixer that escalated things is not a gate; it is a result. Read what it actually did:

1. `git log --oneline <hash-before-this-step>..HEAD` — the `fix(...)` commits are the applied items. Record the hashes.
2. Re-read the brief. Deleted → everything was applied and nothing remains. Present → what it now lists under 🟡/🔴 is what survived, including anything it downgraded mid-run.
3. Read which rows the fixer closed from `docs/BACKLOG.md` (` · Done by <brief-slug>`) and which it left open, and relay both as facts — you never close, drop or re-file one.

A fixer that returned nothing usable, died, or was interrupted **is** a gate: stop and report it as one.

## Gates you honor

Halt the itinerary immediately and relay the reason **verbatim**. Two of these the user can settle on the spot; the rest end the run.

**Answerable — put it to them, apply their pick, resume:**

- Any 🔴 in either brief that carries a real option set.
- A finder or fixer that stopped on a decision and returned one.

**Terminal — report and stop; there is nothing to choose between:**

- A `/esq:check` verdict of the form "built as planned, but it doesn't answer the question" — that is a scope finding, and no option in a brief addresses it. What follows is re-planning, which is `/esq:plan`'s and never yours.
- A 🔴 or an escalation that arrived as a bare question, with no options and none you are entitled to write.
- A finder or fixer that stopped early for a reason of its own, or asked something that is not a choice.
- A subagent that returned nothing usable, died, or was interrupted.
- The plan turning out to be unfinished (caught in preflight, but re-check it if a step reports it).
- A gate that fires a second time after an applied option — one round each.

**The split is whether an answer exists that you could act on**, not how serious the finding is: a red with two concrete options is answerable however alarming it reads, and a scope verdict is terminal however small it sounds.

Do not soften a gate, do not summarize away the question, and do not judge whether it "looks minor" — you are the least-informed party about a step you did not run.

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

A 🔴 already in a brief arrives in that shape — `/esq:check` and `/esq:review` are required to write it that way — so you copy it across untouched. **You never author an option or a leaning yourself.** If a brief carries a red as a bare question, say exactly that, quote what you got, and make → Next the attended re-run of the step that produced it — never your own reconstruction of what it might have meant. **A report with no option set is a diagnosis, and you relay it as one:** the agent's diagnosis and exact action verbatim, the failing output under `Evidence:`, and no option, leaning or decision line authored around it; → Next is the agent's named action. Ask the agent again for an option set only when its own report names a missing user authority and offers no options.

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

> Apply exactly this change and nothing else: `<the chosen do:, verbatim — on an approved repair the replacement, never the original>`. It was authored by the agent that found the problem and chosen by the user, so it is not yours to improve on, widen, or second-guess. Make the change and verify it the way the brief's item names — on an approved repair, by its `verify:` alone, leaving `<its deferred reminder>` undone and changing only the record if that already passes. Only once that verification passes, commit it alone as `fix(<scope>): <the option's label>`.
>
> Then, in `<brief-path>`, strike that one 🔴 from `## 🔴 Needs your decision` — the whole item, leaving the section itself if other reds remain and removing the empty section if it does not. Change nothing else in the brief. Commit it alone as `brief(decided): <slug> — <the decision>, <the chosen option's label>`, so the commit carries the record the brief no longer does; on a repair, its body quotes the original.
>
> If the change cannot be applied as written, make no edit and report why. If it fails that verification, stop: commit nothing, strike nothing, reset, restore, clean or discard nothing, and report the failure and the edits left in the tree.

**A relayed decision is *selected*, not applied, and this is where that is written down.** On `route: relay` nothing was spawned and nothing was changed, so the run records the answer rather than its effect: write one line into that 🔴 item in `<brief-path>`, indented under it —

> `- Selected: **<letter> · <label>** — direct invocation required — run: ``<the chosen option's do: string, verbatim>`` — recorded <YYYY-MM-DD>`

— then commit the brief alone as `brief(selected): <slug> — <the decision>, <the chosen option's label>`, print the command flush-left, and stop the itinerary there. **The 🔴 stays.** The decision is answered and the change is not made, and a red struck before its effect exists is a brief that lies to the next reader. That one line is bookkeeping about the decision, which is yours; the change never was.

**On resume, the recorded selection is the answer — never put the same decision twice.** A 🔴 carrying a `Selected:` line is already decided: do not offer it, do not ask about it, do not spawn on it. An unclassifiable pick follows its history below: the original is never routed again. Call `esq apply route '<the recorded do:>'` once and route on `applied`:

- **`true`** — the state the command writes is in the tree. Strike that one 🔴 exactly as the apply agent would have, commit it alone as `brief(decided): <slug> — <the decision>, <the chosen option's label>`, and resume the itinerary at the step after the one that gated. No finder re-runs.
- **`false`** — the command has not run. Print it flush-left again and stop: no question, no spawn, and no edit to the brief, which already carries everything the next run needs.
- **`null`** — nothing in the tree settles it, and `confirm` says why. Print the command again, say in one line that this run cannot observe whether it ran, and stop with the itinerary's next step as `→ Next`. Nothing is erased: the 🔴 and its `Selected:` line stay, so whoever runs the command can strike it, and no step of this run proceeds on a decision that was only displayed.

**Closing the red in the brief is what makes the resume work.**

**An unclassifiable pick keeps an append-only history under its 🔴, and the last line is the effective state.** One commit per line, before the step it enables; never edited:

1. **Record the pick** — before any proposal: `- Selected: **<letter> · <label>** — recorded <YYYY-MM-DD> — original do (not runnable: <reason>): "<the do: verbatim>"` (`brief(selected):`).
2. **Propose the repair** — above, once per run.
3. **Record the approval** — before routing: `- Repair approved #<n>: <YYYY-MM-DD> — do: ``<the repair>`` — deferred: <the reminder> — verify: <the checks>`, plus `— supersedes #<m>` over an earlier one (`brief(repaired):`).
4. **Route the approved repair** — once. A pause appends `- Paused: <YYYY-MM-DD> — by your choice, nothing run`; a failed repair, `- Repair failed #<n>: <YYYY-MM-DD> — <reason>` (both `brief(paused):`). The 🔴 is struck by the apply agent after verification, or by you when `applied` is `true`.

**On resume, act on the last line, never on an earlier one.** `Repair approved #<n>` → route #<n> once; when it routes `relay`, branch on its `applied` exactly as for a recorded selection above. `Paused` or `Repair failed` → propose again, naming what it supersedes; an older approval runs nothing unless re-approved. `Selected` → step 2. So approval, then pause, then a newly approved replacement routes only the replacement, and a malformed repair is never routed twice.

**Then resume the itinerary at the step that gated** — a 🔴 found in step 1's brief resumes at step 2. Do not restart from step 1: the review already ran. If the apply agent reported it could not apply or verify the change, do not resume — report that, with any edits it left, and stop.

**State the moved bound.** An approved action routing `apply`, option or repair, adds one apply agent: at worst two steps plus one per such gate, one plus one from a brief. A relayed gate adds none and ends the run. A stopped gate adds one only when its approved repair routes `apply`, then resumes unless that repair failed; otherwise it adds none and ends the run. Say that number before you run to it.

<!-- orch-shared:runs-long:start -->
**A subagent that runs long is not a gate.** You have no timeout and you do not invent one: you cannot tell a genuinely large job from a stuck one, and killing the wrong one leaves work half-committed with nothing recording it. Wait, and let the elapsed time you record put the cost on the record.
<!-- orch-shared:runs-long:end -->

<!-- orch-shared:elapsed-span:start -->
Report measured elapsed time: use a field on the returning tool result, or one `date` reading before and one after the step, chained into shell calls already needed. The span ends when the result arrives. Ignore later kill notifications, agent-registration lifetime, uncited harness timing and durations in worker prose.
<!-- orch-shared:elapsed-span:end -->

🟡 items are **not** a gate. They are the expected terminal state — substantive work with its own tradeoffs, which is exactly what this command does not touch. They go in the report and become the `→ Next`.

## Ready to land — the clean completion

**A clean completion is ready to land, and this command never merges.** A run whose itinerary finished with nothing left open has proved what a corrective loop can prove. Landing it is `/esq:land`, a separate command the user runs, which re-checks every durable prerequisite for itself. This section decides only whether this run was clean, and records that it was.

**The clean bar, cheapest first.** Stop at the first that fails and report `○ not ready` with the command that clears it:

1. **No gate is left open, and no 🟢, 🟡 or 🔴 survives in any brief this run read.** Both facts are already in hand from the step classifications — do not re-read a brief for them.
2. **`unit.open` is still empty.** Briefs are not the only place this unit records what is wrong with it: a 🐛/⚠️ row its own `build:`/`fix:` steps filed and nobody disposed of is the same unfinished branch in the ledger instead of in a brief, and the fix steps in this itinerary can have added one. Re-read it from the verdict — `esq branch check <plan-path>` again, one subprocess, because `HEAD` and the ledger have both moved since preflight. A row still standing is a branch that is not finished, whatever its commits say.
3. **A review has actually read this unit.** Either step 1 ran `/esq:review` in this itinerary, or preflight's `finder` was `review`. A `check` brief, or one whose `Source:` names no finder, fails this bar — and it is the one bar that cannot be cleared by anything this run does, because what is missing is a reader. Report `○ not ready — fixes applied, no review has read this unit`, make `→ Next` `/esq:review <plan-path>`, and stop here: **nothing below runs.** This is not a loop and adds no step; it hands the user the one command that closes the gap.

**Record coverage once, only after all three checks pass.** If the branch verdict's `coverage` is already `covered`, write nothing. Otherwise chain `git rev-parse HEAD` into `esq plan set-reviewed <plan-path> <full commit>`, then commit that plan file alone:

`git commit -m "plan(converged): <slug> at <short hash>" -- <plan-path>`

Never use the review's commit subject: these fix commits have not been reviewed, and a later delta review must still read them. This bookkeeping field leaves gate verification valid.

Landing separately checks unit completeness (`unit.incomplete`), promised rows (`unit.promised`), verification across all unit plans, destination and merge. A plan this run completed does not prove every plan on its branch complete. A ready result may still be refused by land, with the clearing command. Spec/architecture freshness is advisory; do not require or perform a refresh.

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## The report

Always produce this, whether the run went clean through or stopped at step 1:

```
⚠  converge — <slug> · 2/2 steps · 1 decision · 3 commits · 8m40s · NEEDS YOU (1)

  1  Plan the remaining retry-policy change
     /esq:plan docs/plans/<brief>

  ✔ review      2 🟢, 1 🟡, 1 🔴       (4m)
  ⚑ decision    retry ceiling → picked A · applied 8f2a1c
  ✔ fix         2 applied              abc1234, def5678 (4m40s)
  ○ not ready   1 🟡 survives           /esq:plan docs/plans/<brief>
  ✔ closed      B-27                   fixed in abc1234 by /esq:fix
  ○ not run     plan the 🟡 · arch · spec

→ Next: <the one exact command the user should run>
```

Emit each zone-3 step line **the moment that step resolves**, not at the end. The user is not watching, but the session can die mid-run — a converge that printed as it went still leaves a usable trace.

Add one `○ worker model  asked opus · session on <model>` line only when this session is not on Opus — it says what was requested and what the workers may have inherited instead, which is the whole of what this run knows. On an Opus session the line is absent, and there is never a `✔` or `✖` form: no verdict was taken.

Zone 2 carries a gate **only while it is still unresolved** — one nobody answered, one whose option could not be applied, one raised with no `AskUserQuestion` available. A gate the user already answered is settled; its zone-3 line records the pick and that is the whole of its reporting. Reprinting the options asks them to decide it twice. A resolved gate may carry an indented `Evidence:` (≤10 lines) only when its outcome line cannot state what happened.

**The completion is one zone-3 line, and it is never absent.** It takes one of two forms, and a run that is not ready still says so — silence there reads as a claim that the branch can land:

```
✔ ready to land  reviewed at 6c4bbe8     /esq:land docs/plans/<plan>.md
○ not ready      <the reason, verbatim>   <the command that clears it>
```

`✔ ready to land` carries the commit the coverage names — the one this run recorded, or the one a clean review already had. `○ not ready` carries the first failing check of the clean bar and its command. **A bare reason with no command is a defect, not a detail**: the command is what stops a user from having a run that never becomes landable and no way to tell why. Neither line is a landing — `/esq:land` decides that, and a run of this command never reports `landed`.

`closed` names the fixer that closed the row; you closed nothing yourself.

Compute `→ Next`:
- Stopped on an **unresolved** 🔴 → `"<N> decision(s) above — run the `do:` of the option you pick on each, then: /esq:converge <plan-path>"`. Name no option as chosen; the leaning is already in the block. Never `"answer the 🔴 item(s)"` — the options are written out, and asking someone to answer a question you already reduced to a choice makes them re-derive it.
- A decision was answered and applied, and the run then completed → treat it as any clean run; the decision is a line in the report, not a next step. Nothing is owed for something already settled.
- Stopped on a **relayed** gate — the chosen option's `do:` or its approved repair routed `relay`, or a resume whose `applied` came back `false` → the relayed command first, exactly as written, then `/esq:converge <brief-path>` as what resumes the itinerary once it has run. A relay that `esq apply route` cannot observe at all (`applied: null`) names the command and then the itinerary's next step instead, because re-entering this command would reach the same unobservable answer.
- Stopped because a gate fired twice → name what the applied option didn't fix, then the command for the step that gated.
- Stopped on a scope verdict → name the unmet condition, then `/esq:plan <plan-path>`.
- Stopped on a failed step → name what broke, then the step agent's own named action when it returned one; only when it named none is the next command the one that step was running.
- An unclassifiable pick paused or its repair failed → `paused by your choice — nothing to run now (resume later: /esq:converge <brief-path>)`, a failed repair named first, never the original.
- 🟡 remain → `/esq:plan <brief-path>` · run `/clear` first.
- Nothing remains and the clean bar stopped the completion → the command that clears it: `/esq:backlog` for a `unit.open` row still standing. The loop ran clean and the branch is not ready; those are two facts, and the second one is the next step.
- Nothing remains and the completion is recorded → `/esq:land <plan-path>`. No spec or arch refresh is owed first: `/esq:land` reports a stale projection as advice, never a stop, so zone 3 names none as required and this run runs neither.
- Nothing remains and the plan records no `**Origin:**` — a legacy plan, which never lands → `"Loop clean — legacy plan, nothing to land."`

The **last line of your entire response** is that `→ Next`, copy-pasteable with its concrete path, and nothing after it.

Send a `PushNotification`: `"esq:converge — <X>/<N> steps. <K fixes applied · M 🟡 remain | stopped at <step>: reason>."` The user isn't watching; that notification is the whole point.

<!-- orch-shared:notify-ask:start -->
**Notify before you ask, too.** A gate prompt waits silently for someone who left, so send `"esq:<this command> — <what gated> needs one decision: <the decision line>"` *before* the `AskUserQuestion` call, not after it. A question nobody knows about is the same session-shaped wait the prompt was meant to remove.
<!-- orch-shared:notify-ask:end -->

## Constraints

- **Orchestrate only — you write no code.** In a brief you write only the decision lines above and a strike on `applied: true`, and never `docs/BACKLOG.md`; every other mutation is a subagent's, following `/esq:fix` or applying the approved action verbatim, and your output is a report. The other exception is the clean completion's bookkeeping: `esq plan set-reviewed` and that plan file's one commit, recording a fact and changing no requirement.
- **Never merge.** Not through `esq merge land`, not by hand, not "because the run was clean". Landing is `/esq:land`, which re-checks what this run cannot; never stage, never switch a branch, never push.
- **Never apply, promote, or reinterpret a 🟡 or 🔴 on your own.** The tiers are the finders' judgment; you are not a fifth opinion on them. Applying a 🔴's option because the *user* picked it is their judgment, not a reclassification — and a 🟡 has no options to pick, so it never becomes one.
- **Never re-run a step.** A failure is a finding to relay, not a flake to re-roll. Resuming after an applied option is not a re-run: you continue *forward* from the step that gated, never back to one that already produced its artifact.
- **Never extend the itinerary past step 2.** Not a second review, not `/esq:check`, not `/esq:plan`, not `/esq:build`, not `/esq:arch`, not `/esq:spec`, however the findings read. You recommend and stop.
- **The itinerary is review → fix on every plan, and nothing inside the run re-decides it.**
- **At most two subagents** — one when entered from a brief — in the itinerary's order, strictly sequential, never concurrent, plus one apply agent per decision whose approved action routes `apply`. Step 2 fixes what step 1 found, so parallelism here is a race, not an optimization. State the bound up front and never exceed it.
- **A 🔴 is put to the user as a prompt, resolved by their pick, applied by a subagent on `route: apply` or seen applied on resume, then resumed forward** — once per gate, never twice, never unanswered, never with an option you wrote. Never answer one on the user's behalf, and never pick an option from an `AskUserQuestion` a subagent raised. Relaying a brief's or a step agent's leaning is not answering; forming your own, or acting on a prompt nobody answered, is.
- **A decision is relayed as an option set** with a runnable `do:` per option, never as a question, **and a diagnosis as a diagnosis** — neither invented: every option comes from the brief or the step agent, and every diagnosis and action from the step agent, never from you.
- **Decide from the brief file and the git log**, never from a subagent's self-report.
- **🔴 outranks everything** and stops the run before any fix. 🟡 is the expected terminal state, not a gate.
- **Never close a backlog item yourself.** The fixers close what their verified fixes delivered; you relay what the ledger says.
- **Report the bill** — steps, commits, elapsed time — per step as it resolves, and again at the end even on an early stop. Honest reporting only: if a step failed, the report says so first, not last.
