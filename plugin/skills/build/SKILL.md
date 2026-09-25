---
description: Execute the next phase of a plan file, one phase per invocation — atomic commits, verification, execution log.
name: build
argument-hint: "[target] [options]"
model: opus
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

**No mandate, no run.** Model invocation of this skill is legitimate only when a user-invoked orchestrator explicitly delegated this run and its target appears in the invoking turn. Invoked without that explicit target — or off a description match, on your own initiative — do not guess: stop and print the exact invocation for the user to run.


You are executing one phase of a plan, then stopping. Each fresh `/esq:build` invocation handles ONE phase. Multi-phase plans require multiple sessions with `/clear` between them.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Use `esq branch check "$0"` for the branch-ownership verdict, `esq next-phase "$0" --context` for the phase classification and the plan text and log slices this command reads, and `esq validate` for invariants. Append a new entry only through `esq plan append-log "$0" '<json>'`; never hand-edit a new log entry. Use `esq backlog reserve-id` before adding a backlog row. The CLI parses and mutates structure; architecture, scope, verification quality, risk, and UX remain your decisions.

Do NOT use plan mode. You need to write code.

## Announce, before anything

<!-- announce-open:start -->
Print this line first, before any tool call, then continue with the first call in the same response:

> `/esq:build — executing one phase. Bound: exactly one phase, no subagents, one commit per task.`

Stop at the bound and report what remains uncovered. Announce the resolved target after preflight.
<!-- announce-open:end -->

## Preflight

1. Determine the plan file path:
   - If user provided a path argument, use it
   - Else, use the most recently modified `*.md` in `docs/plans/` excluding `*.log.md` and `*.brief.md` (a `.brief.md` is grill output, not a plan)
2. If no plan file is found or path is invalid, STOP and tell the user how to invoke `/esq:build` properly
3. **Check the branch owns this plan — before the read, before any edit.** Run `esq branch check <plan-path>`, once, here. It is the only thing that decides branch ownership: it compares the current branch against the plan's recorded `**Branch:**` and every other shipping unit's recorded branch, and returns one JSON verdict, reading only. Route off `refuse`, never off the prose:
   - **`refuse: false`** → carry the verdict into the announce line in step 9 — `branch <name>` for `ok`, and `branch unrecorded — legacy plan` for a plan written before the field existed — and continue unchanged. Nothing else in this command reads it.
   - **`refuse: true`** → STOP here, before the plan file is read and before a byte is written. Put the refusal to the user as the option set in "Refuse a branch this plan does not own" below. Do not read the plan's phases, do not edit the plan header, and never switch a branch yourself.
     It is an **authority** stop and that option set is the only shape it takes. In the plugin the section is `${CLAUDE_SKILL_DIR}/references/refuse-a-branch.md`: you MUST load it before you write the refusal, and it is loaded on this branch and on no other — a `refuse: false` run never reads it.

   The order is the point: the refusal costs one subprocess and zero file reads, which is cheaper than the read it prevents.
4. **Read the plan through `esq next-phase <plan-path> --context`, once.** Wait for the branch verdict; never batch these calls. Keep the returned `state`, `phase`, `entry` and `context` for phase selection and announcement.

   `context.phases` gives each phase's heading/status; `context.completed` supplies the completed count. `context.log` gives the log's `line`, `end` and `appendix` boundary. `context.sections` supplies verbatim source, in document order with `kind` and 1-based `from`/`to`:
   - `plan`: the whole plan through `## Execution log` and its reserved append comment when present. Without that heading, the whole file.
   - `entry`: the newest log entry and, when distinct, the paused entry selected by the response's `entry` key, including its heading, continuity field and handoff. `roles` identifies each; lines are not duplicated.
   - `appendix`: all plan material following the log span.

   Use these slices without a second classification call, skeleton grep or reread. This snapshot does not replace later reads explicitly required after mutation: keep the continuity anchor from step 5, recompute `unit.open` before logging, and reread files this run changes when needed.

   The CLI owns the slicing. The following definition is retained for orchestrators that read a skeleton directly; it is not another build preflight:

   <!-- shared:log-skeleton:start -->
   **Skeleton first.** `grep -n -E '^#{1,3} |^\*\*(Plan committed at|Commits):\*\*' <plan-path>` returns the plan file's whole structure in one pass. Its output grows by about two lines per phase, where the execution log's span grows by about thirty. Derive every boundary from what it returns, never from an assumption about where a section sits:

   - `L` — the line of `## Execution log`.
   - `A` — the first `#` or `##` heading after `L`, if there is one. The log span is `L` → `A-1`; whatever starts at `A` is plan material (an appendix the phases cite) and is not log. With no `A`, the log span runs to EOF.
   - The `### Phase N — <name>` headings **above** `L` are the plan's phases, in order, with their names.
   - The `### Phase N — …` headings **inside the log span** are those phases' execution-log entries. Each entry's own heading text classifies it: `completed`, or a `⏸` pause — `⏸ awaiting manual verification` or `⏸ blocked on an open same-unit defect`. **The glyph classifies, never the clause after it.** A phase with no entry heading in that span has not been logged; reconciliation checks whether its tasks already ran.
   - `**Plan committed at:**` and `**Commits:**` are an entry's first two field lines — the continuity anchor the entry was written against, and that phase's commit short hashes.
   <!-- shared:log-skeleton:end -->

5. **Compute the continuity anchor** — run `git log -1 --format=%h -- <plan-path>` now, once, before this invocation commits anything. That short hash is the `**Plan committed at:**` field every execution-log entry this run writes carries, verbatim and unrecomputed: a run that resolves a pause and continues into the next phase writes the same hash into both entries, because the confirm commit in between touched only the log. Empty output means no commit has ever touched this plan file — write `unversioned` and note it in the entry's Surprises.
6. Read `CLAUDE.md` at project root if present
7. Fetch tools: call `ToolSearch "select:TaskCreate,TaskUpdate,TaskList,PushNotification"`. Continue without any that are unavailable.
8. Call `TaskList`. If any tasks are in `pending` or `in_progress` state (stale from a previous aborted run), call `TaskUpdate` on each to set them `completed` before creating fresh tasks for this phase. Skip if TaskList is unavailable.
9. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `Plan <slug> — <N> phases, <M> logged complete; next up is Phase <k>. Branch: <the step-3 verdict — the branch name, or `unrecorded — legacy plan`>.`
   <!-- announce:end -->

   This is the free moment to be redirected — the target is on screen before anything has been spent on it.

<!-- shared:unattended-tasks:start -->
**Unattended runs make no `TaskCreate`, `TaskUpdate` or `TaskList` calls anywhere in this procedure.** Attended runs use the available task tools for progress as described below.
<!-- shared:unattended-tasks:end -->

<!-- shared:read-once:start -->
**Read each file once**, taking the needed slice on large files and retaining it for later steps. Re-read only if you have written to it since. A later reference to that file or a desire to double-check does not justify another read.
<!-- shared:read-once:end -->

<!-- shared:batch-independent:start -->
**Batch independent, read-only calls in one turn.** A call that consumes another's result waits for it. Serialize Git mutations, writes to the same file, and reads of a file another call writes; never run them concurrently. Group ordered shell operations with `&&` in one call so failure stops the chain.

Keep one atomic, independently revertible implementation commit per task. Batching calls never merges tasks or justifies an unnecessary read; retain the read-once rule.
<!-- shared:batch-independent:end -->

## Identify the next phase

Use preflight's `esq next-phase <plan-path> --context` response; no second query or file read. `context.phases[].status` is `completed` only for a completed entry, `paused` for any `⏸` heading regardless of its clause, and `null` when no entry exists. Unlogged does not prove unexecuted; reconciliation below checks that.

1. **Paused phase takes priority.** If any phase has a `⏸` entry, do NOT start a new phase. Resolve it first, and which resolution depends on the clause:
   - `⏸ awaiting manual verification` → go to "Resolve a paused phase" below.
     In the plugin that section, and the "Observe the `(manual)` steps" procedure it runs, are both in `${CLAUDE_SKILL_DIR}/references/manual-verification.md`: you MUST load it before you resolve the pause, and a run that resolves one never self-certifies the steps instead.
   - `⏸ blocked on an open same-unit defect` → go to "Resolve a blocked phase" and follow it. That is the only path out of this clause, it re-executes no task, and it ends in a CLI write rather than a header edited by hand.
     In the plugin that section is `${CLAUDE_SKILL_DIR}/references/resolve-a-blocked-phase.md`: load it when this branch sends you there, and never for a phase that is not blocked.

   Only after the entry flips to `completed` do you continue.
2. Otherwise the next phase is the lowest-numbered phase with no `completed` entry.

If all phases are already completed, report that and STOP. Recommend `/clear`, then `/esq:review <plan-path>`; offer `/esq:converge <plan-path>` for unattended review → fix, at most two step agents. `/esq:check` is an optional diagnosis for suspected drift, not a prerequisite. Architecture refresh is separate from that review loop.

## Conditional references

Two loads are decided here, from the phase just identified above, and **whichever apply go out together in one turn** — never one read now and a second when its own step arrives. Both are read-only and independent — the parallel shape the batching rule names.

- **This phase renders user-facing UI** → `${CLAUDE_SKILL_DIR}/references/ui.md`.
- **This phase's verification names a genuinely `(manual)` step** → `${CLAUDE_SKILL_DIR}/references/manual-verification.md`, which carries "Observe the `(manual)` steps" and "Resolve a paused phase" in full. Apply the sanity check "Execute the phase" states — a step tagged `(manual)` whose result is machine-readable output is an `(auto)` step you will run yourself, and it does not earn this load. Judge it from the plan's steps, which you already hold; if the phase turns out to owe a real `(manual)` step after all, load the file there instead, at the cost of one turn.

A phase that renders nothing and names no `(manual)` step loads neither, and that is the common case — do not read a reference whose condition did not fire. A file this run has already read is not read again: the paused-phase branch above may have loaded the manual reference already.

## Reconcile before executing

**Only when no phase is paused**, inspect for tasks committed before an interrupted run could log them. Use preflight's continuity anchor: `git log --oneline <anchor>..HEAD`, once. Drop metadata subjects starting `plan:`, `plan(`, `brief`, `backlog:`, `decisions:`, `epic:`, `roadmap:`, `spec:`, `merge:`, `docs(claude):` or `docs(arch):`.

- **No remaining commits:** execute normally, silently.
- **Commits cover only some tasks:** report their hashes/subjects, then execute normally; the task loop recognizes already-landed work and implements only what is missing. No gate or pause.
- **An unlogged commit corresponds to every task:** run only the phase's `(auto)` verification first; implement and write nothing until it answers. All PASS → log the phase without reimplementing tasks, performing manual observation normally. The fresh `unit.open` check before logging still applies, including rows an interrupted run already filed. Any FAIL → report the failing step and execute normally; this is not the failure route for work this invocation broke.

**Both complete task evidence and passing verification are required.** Verification alone can pass before a task runs. Detection is not exhaustive: a later hand edit to the plan can move the anchor past unlogged work; disclose suspected misses, never invent evidence.

**One reconciliation per invocation.** It spends no implementation-phase budget. If its entry is completed, report it and continue into the next phase. A paused entry stops immediately. If the next phase is also reconcilable, report its hashes and stop; never reconcile a second phase in this run.

## Continuity check

Before executing, verify the plan section above the execution-log marker hasn't been modified since the most recent execution-log entry.

**Check it, don't sense it.** Take the hash from the newest execution-log entry's `**Plan committed at:**` field line — the first field line under its `### Phase N —` header, written there by the templates below, and inside the newest-entry slice preflight read. Run `git diff <that-hash> -- <plan-path>` and read what actually changed.

**No such field line?** The entry predates this convention — the newest entry's text is in hand either way, from `context.sections`, so its absence is a fact rather than a guess. Fall back to the newest commit that touched the plan file and was made by this workflow: `git log -1 --format=%h --grep='^plan(' -- <plan-path>` — `/esq:build`'s own log, pause and confirm commits are `plan(<slug>): …`, while the plan's authoring commit is `plan: <slug>` with no parens and is therefore correctly excluded. Empty result means nothing has logged against this plan yet: this is the first phase, and no continuity check is owed.

Then decide, and only escalate what genuinely needs the user:

- **No diff, or the diff is confined to the `## Execution log`** → nothing happened. Say nothing and execute.
- **The plan changed, but not in the phase you're about to run** → amending a plan mid-flight is expected — `/esq:build`'s own failure path tells the user to do exactly that. Note it in one line ("Phase 4's tasks were rewritten since Phase 2's log entry — not this phase") and execute.
- **The phase you're about to run changed** → this is the one case where proceeding could build something the user already decided against. Show the diff of that phase and ask whether to execute the current text. This is the only question this step may produce.

If this is the first phase being executed, no continuity check is needed.


## Execute the phase

Announce: "Executing Phase N: <name>. Tasks: <count>. One commit each; the suite runs once, after the last one."

Call `TaskCreate` for each task in the phase (title: `"Task N.M — <description>"`, status: `pending`) plus one titled `"Verification"` (status: `pending`). Note each returned `id` — required for `TaskUpdate` calls below. Skip silently if TaskCreate is unavailable.

For each task in the phase, in order:

1. **Announce + start:** "Starting Task N.M: <task description>". Call `TaskUpdate` to set that task `in_progress`.
2. **Read first, write second.** View the relevant files before editing.
3. **Implement** the change. Stay within CONVENTIONS.md and the plan's stated approach. If the task renders anything a person looks at, apply "Building UI" above before you write it.
4. **Self-check:** Does this task's work, on its own, advance the phase's goal? If not, you've drifted — correct it under the Drift clause of the recovery contract ("On failure").
5. **Test the change — at the narrowest scope that would still catch a break.** Run the test file(s) covering what you just touched (`vitest run <file>`, `pytest <file>::<test>`, `go test ./<pkg>/...`, `jest -t <name>`), not the whole suite. The full suite runs **once**, at the end of the phase, as `(auto)` verification. If tests fail, apply the recovery contract's task route ("On failure" below); a test still red is a failure.
6. **Commit atomically.** Stage only files relevant to this task. Conventional-commit format (`feat`/`fix`/`refactor`/`test`/`docs`/`chore` + `(scope): subject`, imperative, lowercase, no period, ≤72 chars; body explains *why* if non-obvious). **A task whose implementation stages nothing has already landed** — expected on the execute-anyway paths out of "Reconcile before executing". Report it as already-landed and move to the next task; never force an empty commit, and never read it as a broken phase.
7. **Report + complete:** "Task N.M committed (<short-hash>). <one-line summary>." Call `TaskUpdate` to set that task `completed`.

After all tasks committed, run the phase's verification. Call `TaskUpdate` to set the Verification task `in_progress`.

Verification steps are tagged `(auto)` or `(manual)` in the plan. (If a plan predates this convention and steps are untagged, treat anything you can run as `(auto)` and anything requiring a human to observe a screen/behavior as `(manual)`.) Handle the two kinds differently:

**Before running anything — sanity-check the tags.**
If a step is tagged `(manual)` but is actually machine-executable (an HTTP request, a database query, a log check, a CLI output), **reclassify it as `(auto)` and run it yourself.** `(manual)` is reserved for steps where a human looking at a rendered screen is the only instrument. Backend behavior, API responses, and data state are never genuinely manual — they produce machine-readable output. Don't impose a session-ending pause on the user for something you can verify with `curl` or a test command.

**`(auto)` steps — you run them.**
1. **Resolve an unrunnable command before running the phase's checks.** Read the named executable and its documented usage. Missing/non-executable scripts, refused argument shapes or a command targeting a different artifact than its prose are plan defects, not permission for an unrecorded substitution. Only when the step itself unambiguously names the artifact and property, correct its command at the same or greater strictness under the existing repair budget (one edit for this cause). Change only the prospective step above `## Execution log`; keep the criterion sentence, reads declarations, Branch/Origin, phase identity and historical log/proof bytes intact. Add a dated amendment beside the step naming the original command, corrected command, diagnosis and why it proves the same property. Use the recovery contract's verify-before-commit order: stage the correction → capture `git write-tree` → run the corrected step once → judge the unchanged criterion → commit only on PASS. Before attributing that result to the new commit, require its tree to equal the captured tree and no uncommitted input changes; otherwise it is unproved. Carry this result into phase verification without a duplicate execution. Never relabel an earlier PASS with the correction's commit. If discovered after other checks ran, reassess their freshness under the normal rules; rerun only invalidated evidence. This is a repair, not a third verification path; load the failure/recovery procedure under "On failure" before applying it.
2. Execute each current `(auto)` step exactly as written, with **one substitution exception — a whole-repo suite this phase's blast radius does not earn** (see Verification economy below). It spends no repair budget. Record the actual command, original command and why the wider suite could not catch anything this phase could break in `verification`. For a corrected unrunnable step, that same field records the original and corrected commands, the original criterion, diagnosis, amendment commit and observed result. A repaired plan defect is not left as an unresolved backlog candidate; any remaining defect follows the existing same-unit recovery rules. Land receives the corrected obligation and exact proof through the existing gate, never an equivalence claim.
3. For each: report ✅ PASS with evidence, ❌ FAIL with what you observed, or ⚠️ CAN'T RUN with why. **An unrunnable command with no safe correction is ⚠️ CAN'T RUN, and the phase fails** — where the step is only a command, its prose names no artifact and property, or two readings would run different checks, never invent intent or amend the criterion to manufacture a PASS. An executable check that disproves the criterion is ❌ FAIL, not an unrunnable command; repair the defect, never replace the check to turn its result green.
4. If any `(auto)` step is ❌ or ⚠️, apply the recovery contract's phase route ("On failure"). A step still red after it — or red once the budget is exhausted — sets the Verification task `failed` and is a failure. Do NOT proceed to manual steps while any `(auto)` step is red.

**Record proof as `verified.at` and `verified.commands`.** After judging the `(auto)` steps, capture `git rev-parse HEAD` once: a full 40-character commit, never a moving ref or short hash. Record the exact commands whose complete steps you judged PASS, including any actual substitutions. PASS is the criterion, not exit 0: no-match grep can pass at exit 1. Never record a ❌/⚠️ step or invent either half of the proof.

`esq plan append-log` requires this block for a phase naming runnable auto verification when it completes or pauses only for `manualOutstanding`: both have passed their auto steps. A phase unable to supply that proof cannot be completed. The CLI does not match commands against the plan; recording what actually ran keeps substitutions honest.

**Verification economy.** Verification exists to catch a break, not to demonstrate diligence. Time spent here is time the user is watching a spinner, so:

- **Never run the same check twice.** If a task already ran a command and nothing has changed since, reuse that result and say so — don't re-run it because it appears again in the step list.
- **A whole-repo suite runs on blast radius, not on ritual.** Phases run back to back under `/esq:autopilot`, so a step reading "the full suite is green" written into every phase pays for it once per phase over a tree that gained a handful of tests. Decide from what *this* phase touched. A file imported outside its own package — a shared helper, a core module, a type its callers read — earns the whole suite **here, immediately**: the callers it may have broken are exactly the ones this phase's targeted tests don't name. A phase confined to its own package runs that package's suite, and the log entry names the suite it skipped and why. **The plan's last phase runs the whole thing regardless** — nothing is declared done on a partial signal, and `/esq:check` audits the plan, it does not stand in for a green tree.
- **One attempt at anything slow.** Budget a single run for a suite, a build, or an app launch, and report its wall-clock cost in the log entry. Do not retry hoping for a different outcome — a flake is a finding, not a reason to loop.
- **Start the slow check before the writing, not after it.** The log entry's *What got built*, *Surprises*, *Backlog candidates* and *For Phase N+1* depend on nothing a suite returns — but written after it, their minutes are added to its wall-clock instead of hidden inside it. Launch the slow run with `run_in_background: true` the moment the last task is committed, draft those sections while it runs, then read its result, fill *Verification* from it, and only then commit. **Read the result before anything is committed**: a suite that reds is a failed phase however finished the prose looks. Nothing is wasted in that case either — a failure report needs the same account of what got built and what broke.
<!-- shared:collect-once:start -->
- **Collect a finite background check once.** Wait under a deadline or on actual process/task completion, never with an unbounded sentinel or repeated status polling. Use the collection primitive named by the launch result; do not assume an unavailable `TaskOutput` or `BashOutput`.
<!-- shared:collect-once:end -->
  - **Every process this phase started is confirmed gone before the execution-log entry is appended.** Process-group ownership, not a single PID: the phase owns what it launched, confirms nothing of it survives, and only then writes the entry. A phase that logs over a live child has left the next run something it never agreed to inherit.
  - Process cleanup does not clear the harness's task registration. A later notification, including `status: killed`, never revives work that has already concluded.

- **A red verification is never logged `completed`, however the wait was collected.** Collecting a result late, or badly, or after a bound expired does not change its colour: a phase whose `(auto)` step reds gets a failure report, and no `### Phase N — completed` entry is appended over it.
- **Scope expensive rituals to what this phase added.** If the project's conventions prescribe a per-assertion ritual (mutation checks, deliberately breaking the source to confirm a test reds), apply it once per assertion **this phase wrote** — never to assertions that already existed, and never to the suite at large. Restore the source and confirm the tree is clean in the same breath, not as a separate pass.
- **Report the bill.** If verification took more than a couple of minutes, put the number in the log entry — a phase whose checks cost more than its implementation is a signal the user needs to see.

**`(manual)` steps — only for rendered UI that requires human eyes.**
A genuine manual step is one where the observable result is a browser screen, a rendered component, or a visual UX flow — something only a human *or a browser-driving tool* can judge.

**Run "Observe the `(manual)` steps" above — the full procedure, probe included.** Do not decide here that you have no instrument; that decision is made by the probe, in that section, and nowhere else.
In the plugin it is `${CLAUDE_SKILL_DIR}/references/manual-verification.md`, loaded under "Conditional references" above; if it is somehow not in hand, load it now — before the probe, and before any step is called PASS.

- No `(manual)` steps, all `(auto)` passed → verified. `TaskUpdate` the Verification task `completed`, log the phase `completed` (below).
- `(manual)` steps, all observed PASS → verified the same way. Name the instrument in the log entry. **This is the expected outcome whenever the project's resources cover this step's path — the phase does not pause.**
- `(manual)` steps left unobserved because a link the observation needs is uncovered, closing it exceeded this phase's mandate or failed inside its bound, and neither this run nor the user has observed the result → the phase is NOT done. `TaskUpdate` the Verification task `in_progress` (leave it open), log the phase `⏸ awaiting manual verification` (below), then STOP — do not advance. The next build run resolves it via "Resolve a paused phase."

## A defect against this unit is not a backlog candidate

**Out of scope means outside the shipping *unit*, not outside this phase.** The unit is every plan
recording the same `**Branch:**` — a plan and its corrective siblings are one unit, which is why
`esq branch check` computes it from that field and nothing else.

A backlog row was only ever meant for work this phase deliberately did not do *because it belongs
somewhere else*. It is not a place to park a defect in code this unit just wrote
(`D-a-defect-against-the-unit-is-not-a-row`).

**The gate is source-based, and deliberately conservative.** `esq plan append-log` blocks a `completed`
entry on any undisposed 🐛/⚠️ whose `Source` names a `build:` or `fix:` step of this unit — **wherever the
failure lives.** It reads three backlog table cells and stops there, so the decision point is *filing the
row at all*, not where the failure sits, and the two outcomes are these — neither of them a row:

- **An ordinary omission** — a missed case, a wrong bound, a guard that does not cover what the task
  said it covers. Correct it inside this phase, in the task's own commit. It was always yours.
- **Substantive** — it needs a decision, a design, or work the plan did not buy. **The phase pauses.**
  Append the paused entry with `blockedBy` naming the rows, and stop. The heading renders
  `⏸ blocked on an open same-unit defect` and every consumer already routes on the `⏸`.

`esq plan append-log` enforces the line — it refuses a `completed` entry while any such row stands, naming
it, and leaves the plan byte-identical. A row the unit's own commit then fixes and verifies, you close:
`esq backlog set-status <B-NNN> Done --by <slug> --resolution "<the fix and its commit>"`. Accepting a defect
unfixed is a decision you put to the user as an option set — never one you take to clear the gate.

**`observed:` is only for a finding outside the promised work that this unit neither introduced nor
aggravated — and neither an untouched file nor a pre-existing failure establishes that alone.** An unchanged file proves nothing: a caller, data, configuration or interface this unit changed can break a consumer it never edited, and that is the unit's regression.
A failure that already existed may be one this unit made worse, made reachable, or promised to fix. So
file `esq backlog add --source "observed: <slug> Phase N"` only when all three hold: it fails the same way
on the unit's `**Origin:**`, nothing this unit changed reaches or worsens it, and nothing this unit
promised (`## Done looks like`, a `Planned by` row) covers it. Anything short of that, a finding you cannot
place included, is `build: <slug> Phase N`: it blocks, and is fixed or paused on as above. Never route a
regression or an unfulfilled promise around `unit.open`, and never drop or re-file a row to get a phase
past its gate. A 💡 idea never blocks, and neither does a row a finder filed (`check:`, `review:`).

## Append to execution log

**Six steps, and the order is the contract.** A 🐛/⚠️ row this phase files names this unit in its `Source`, so it is exactly what `esq plan append-log`'s gate blocks a `completed` entry on — and a row filed *after* the entry never faced that gate, which is how a defect against this unit gets parked while the phase that found it reports `completed`. Filing first shuts that window; nothing else about the entry changes.

1. **Draft the whole payload in memory, and write nothing yet** — every field of the `esq plan append-log` call below, `backlogCandidates` included.
2. **File this phase's backlog candidates first.** Run the "Capture backlog candidates" step now, ending in its own `backlog: capture candidates from phase N (<slug>)` commit. `"None."` files nothing and commits nothing, which is the common case and leaves this step a no-op; the step dedups against the rows it reads, so running it twice files nothing twice.
3. **Recompute the unit's open defects** — `esq branch check <plan-path>`, once, here. Preflight's verdict predates this phase's commits and the row step 2 just filed, and this is the call that sees them: one subprocess, and no file this run has already read.
4. **`unit.open` non-empty → the paused format, `blockedBy` naming those rows, and no `completed` entry is attempted.** The CLI would refuse one, and a refusal you could have predicted buys a round trip to be told what you already know. The phase pauses instead of completing, whatever its `(manual)` steps did or did not owe — a red `(auto)` step is still a failure report and still logs nothing.
5. **`unit.open` empty → the entry as drafted** — completed, or paused for `(manual)` steps still outstanding.
6. **Then the rest of the bookkeeping** — the decisions entry, then the closing proposals, both working from what step 2 already read.

**Load the bookkeeping procedures only where this phase owes work in them.** Steps 2 and 6 live in `${CLAUDE_SKILL_DIR}/references/decisions-and-backlog.md`, and three branches earn that load — decided from the payload drafted at step 1 and the phase preflight identified. Whichever apply are **one** load: a file this invocation has read is not read again.

- **Candidates at step 2** — `backlogCandidates` is anything but `"None."`. Load `${CLAUDE_SKILL_DIR}/references/decisions-and-backlog.md` **before any row is filed**: it carries the ID block, the dedup, the `build:`/`observed:` wording the section above already made you classify, and the separate commit. `"None."` files nothing and commits nothing, so step 2 is a no-op and earns no load.
- **A qualifying decision at step 6** — an item in *Surprises / decisions made during execution* where you **chose between alternatives**, a call that could have gone differently; a pure surprise, unexpected with no real choice in it, does not qualify. One qualifying item and you load `${CLAUDE_SKILL_DIR}/references/decisions-and-backlog.md` for the entry's shape, its slug ID and its own commit.
- **The plan's last phase, and it completed** — the rows `/esq:plan` stamped ` · Planned by <slug>` are inspected and closed here, and that work is owed even with no candidates and no decisions. Load `${CLAUDE_SKILL_DIR}/references/decisions-and-backlog.md` and look; never report that nothing matched without having looked.

A non-final phase with `"None."` candidates and no qualifying decision loads none of it, and still runs steps 1–5 exactly as written: the unit re-read, the state choice, the entry through `esq plan append-log`, the plan commit. Not reading the file waives nothing. A branch you are genuinely unsure of is a branch that loads. A phase that stops at a failure before step 2 never loads it — a failure reports from "On failure" below and files nothing — but a run that recovers from one and goes on to reach step 2 is judged by the three branches above like any other.

Append an entry at the **end of the execution-log span** — after the newest entry, and before any section that follows the log (preflight's `A`), which is plan material and must stay below it. Only when nothing follows the log is its span's end the end of the file; never append at EOF without checking. Use the **completed** format when the phase is fully verified, or the **paused** format when `(manual)` steps remain or step 4 fired.

**Completed format** (all steps verified — no unconfirmed `(manual)` steps):

```markdown
### Phase N — completed <YYYY-MM-DD>

**Plan committed at:** <the short hash preflight computed — this exact field name, this position, always the first field line>

**Commits:** <comma-separated short hashes>

**Verified:** <required whenever this phase's verification names a runnable `(auto)` command, and `esq plan append-log` refuses the entry without it — written by that `verified` field, never by hand: the full 40-character commit its `(auto)` steps ran on, then one inline-code line per command judged PASS. Omit the field entirely only where the phase has no such command, or cannot state both halves honestly, which is not a phase that completes.>

**Reconciled:** <only on an entry written by "Reconcile before executing" — the unlogged commits found, the `(auto)` steps that passed, and the fact that no task was re-implemented. Omit the field entirely on a phase this invocation executed.>

**What got built:** Brief 1-2 sentence summary of what's now in the codebase that wasn't before.

**Verification:** For each verification step, the result with evidence in one line. For observed UI, retain the named state, observation provenance and durable Markdown reference established by the manual-verification procedure; preserve a human confirmation even without an image.

**Surprises / decisions made during execution:**
- <Anything you decided that diverged from the plan, with a brief why>
- <Anything that broke or was harder than expected>
- (Or "None — phase executed as planned." if there genuinely were no surprises.)

**Backlog candidates:** Out-of-scope things you noticed while building this phase but deliberately did NOT do — an unrelated bug, an improvement idea, a follow-up todo. **Out of scope means outside the *unit*, not outside the phase** — see "A defect against this unit is not a backlog candidate" above; a 🐛 or ⚠️ in code this unit wrote is corrected or paused on rather than listed here, and any 🐛/⚠️ you do list from this phase blocks the phase's `completed` entry until it is disposed of. One line each with a type guess (🐛/✨/☑️/💡), or "None." (the common case). Each must name a failure: something that breaks, for someone, under some input. Polish — a rename, a guard for what can't happen, a test for a case that can't occur — is not a candidate. These never belong in this phase's commits; step 2 above filed them to the backlog before this entry was written.

**For Phase N+1:** Hand-off note. Three things max:
1. What's wired up that the next phase will rely on (files, deps, config)
2. Decisions that diverge from the plan that the next phase should know
3. Gotchas or brittle parts to watch

(If next phase can proceed exactly as planned with no notes needed: "Phase N+1 can proceed as planned, no surprises.")
```

**Paused format** (code committed and `(auto)` steps passed, but the phase is not done). Two clauses, and `esq plan append-log` picks the heading from the payload: `⏸ awaiting manual verification` when `manualOutstanding` is the only cause, `⏸ blocked on an open same-unit defect` the moment `blockedBy` is present. A payload carrying neither is refused — a pause has to say why it paused.

```markdown
### Phase N — ⏸ awaiting manual verification (<YYYY-MM-DD>)   ← or `⏸ blocked on an open same-unit defect`

**Plan committed at:** <the short hash preflight computed — same field, same position as the completed format>

**Commits:** <comma-separated short hashes>

**Verified:** <same field and same position as the completed format, and required whenever this phase names a runnable `(auto)` command and `manualOutstanding` is the pause's only cause — a phase waiting on a human's eyes passed its `(auto)` steps on a tree, and that is provenance whatever those steps still owe. `esq plan append-log` refuses that pause without it. A pause naming `blockedBy` keeps the field optional: it may have stopped before judging its steps.>

**Reconciled:** <same field, same position and same rule as the completed format — a reconciled phase whose `(manual)` steps are still unobserved lands here rather than there.>

**What got built:** Brief 1-2 sentence summary.

**Auto verification:** Each `(auto)` step with its result and evidence in one line.

**Blocked by:** <only when `blockedBy` was given — written by `esq plan append-log`, never by hand: one line per same-unit backlog row that stopped the phase, as `esq branch check`'s `unit.open` names it (`B-139 (bug, Open) — <its summary>`). Omit the field entirely otherwise.>

**Manual verification outstanding:** The `(manual)` steps a human or browser/app agent must observe before this phase is done. Copy each verbatim, INCLUDING its starting state:
- [<starting state>] <step> → expected: <what the user should see>

**Surprises / decisions made during execution:** (same as completed format)
```

**The payload, exactly.** One `completed` example and one `paused` one — copy the shape, not the values:

```bash
esq plan append-log <plan-path> '{"phase":1,"status":"completed","date":"2026-08-22","planCommittedAt":"46771fd","commits":["8112bb3","6c4bbe8"],"whatBuilt":"The append-log payload is one schema constant the validator and --help both read.","verification":["(auto) node --test tests/cli/esq.test.mjs — 38 pass","(auto) ./scripts/audit.sh — exit 0"],"verified":{"at":"6c4bbe8f1a2b3c4d5e6f708192a3b4c5d6e7f809","commands":["node --test tests/cli/esq.test.mjs","./scripts/audit.sh"]},"surprises":"None — phase executed as planned.","backlogCandidates":"None.","forNextPhase":"Phase 2 enforces the schema this phase published."}'

esq plan append-log <plan-path> '{"phase":1,"status":"paused","date":"2026-08-22","planCommittedAt":"46771fd","commits":["8112bb3"],"whatBuilt":"The settings panel renders the dark-mode toggle.","verification":["(auto) node --test tests/ui/panel.test.mjs — 12 pass"],"verified":{"at":"8112bb3f1a2b3c4d5e6f708192a3b4c5d6e7f809","commands":["node --test tests/ui/panel.test.mjs"]},"manualOutstanding":["[on /settings, logged in] toggle dark mode → expect: the panel repaints without a reload"],"surprises":"None — phase executed as planned."}'
```

Any key not shown is listed by `esq plan append-log --help`, which reads no file and writes none — and a payload it refuses leaves the plan byte-identical, so a wrong one costs a retry and never a corrupted ledger.

The `⏸` entry means the next build run goes through "Resolve a paused phase" before anything else. Do not write a hand-off note for the next phase from a paused entry — the next phase doesn't start until this one is confirmed.

Then commit the plan file together with any newly preserved UI evidence it links, chained in one call: `git add <plan-file-path> <new-evidence-paths> && git commit -m "plan(<slug>): log phase N execution"` (omit the evidence operands when none; slug from the plan filename) — or `"plan(<slug>): pause phase N for manual verification"`, or `"plan(<slug>): pause phase N on an open same-unit defect"`, for the two paused headings. Stage only those files, so the log never commits a link to an untracked capture.

Once the outcome is known, read `${CLAUDE_SKILL_DIR}/references/reporting-and-stops.md` and follow exactly the matching success or pause branch. A failure never arrives here — it is reported from "On failure" below.

## On failure

A failure is any of:
- A test command failed during a task
- An `(auto)` verification step returned ❌ FAIL or ⚠️ CAN'T RUN
- A `(manual)` verification step was observed to FAIL during "Resolve a paused phase" (the behavior was wrong, not merely unconfirmed)
- You discovered the plan as written is wrong (missing task, wrong order, contradicts reality)
- You hit a context budget concern (>60% used) before the phase finished

(An unconfirmed `(manual)` step is NOT a failure — it's a pause. See "Resolve a paused phase.")

Stop the phase immediately unless the recovery contract below lets this invocation repair it. Do NOT auto-revert. Nothing continues past a failure except through that contract, and a 🔴 reaches the user only for an authority they hold.

**The recovery contract — a budget of three repair edits per phase, per invocation.**
- **Two routes, one budget.** A *task test* is the narrow test of task step 5, run before that task's commit; a *phase verification* is an `(auto)` step run after every task of the phase has committed. Each invocation has a budget of three repair edits per phase, shared by both routes.
- **Spent on the repair edit.** Diagnosing costs nothing. One unit of budget is spent the moment you make a repair edit, on either route, whether the repair came from your own diagnosis or from an option the user picked.
- **Distinct causes only — a second edit against a cause this phase already spent one on is exhaustion, not a repair.** The budget bounds thrash by wall-clock; this rule bounds it by kind, and the two are not redundant. Name the cause as you spend on it, and count a re-labelled repeat of a cause already repaired as the same cause: it stops the phase with no further edit, whatever number the budget would still allow. A run that reaches `repairs 3/3` has found three distinct causes in one phase, which means the plan is the suspect — the report prints the count so that reads as a plan defect rather than a quiet run.
- **Repair only inside the plan.** You repair on your own only when the diagnosed cause sits inside the task or phase as planned: approach, files and every stated criterion unchanged. A cause that needs a criterion loosened or changed, the scope changed, a stated limit exceeded or a known defect accepted is not a repair — it is a 🔴, and the attempt is spent only when its chosen option is applied.
- **Verify before commit.** Task route: repair, re-run the same narrow test once; green → the repair lands in that task's own commit. Phase route: repair, re-run the failing step once; green → commit the repair alone as `fix(<scope>): <cause>`, then run the phase's remaining steps. Before that commit, re-run every earlier step already judged PASS whose inputs the repair edit touched — when the repaired paths cannot show a step independent, re-run it — and keep, without re-running, the PASS of a step the repair provably did not touch; a PASS the repair could have invalidated enters `verified.commands` only once it is re-run, and a kept PASS still counts. The task route owes the same: before that task's commit, re-run any earlier task test of this phase whose files the repair edit touched.
- **An exhausted budget forbids another edit.** The budget is exhausted when three repair edits have been spent, or when the next red's cause is one this phase already repaired. Once it is exhausted, any further red in that phase — the same check again or a different one — stops the phase with no further edit and no question to apply; a 🔴 found then is printed for the next invocation, not asked. A fresh budget exists only in a new `/esq:build` invocation the user launches, and `/esq:autopilot` never retries a reported failure.
- **A failed attempt keeps everything.** Its edits stay uncommitted in the tree, every earlier task commit stays, nothing is reverted, stashed or discarded, no execution-log entry is appended and no step is recorded PASS in `verified`. The report names the uncommitted paths, the failing output, the diagnosis and the exact next action.
- **Drift.** Correcting drift (task step 4) removes only changes this task made in this invocation, by editing them back. It never runs `git checkout`, `restore`, `reset`, `clean` or `stash` on a path, never touches a path that was dirty when the task started or that another actor wrote, and stops with a diagnosis when the drift cannot be separated from that work. Drift correction is not a repair and spends no attempt.
- **Only suite narrowing is exempt from the repair budget.** Correcting an unrunnable command spends a repair and follows the prospective-amendment/proof order above. A `grep` that returns matches has run: judge those matches against the original criterion, never recast a red as an unrunnable command to replace it. Ambiguous intent stays unverified; ask only when resolving it needs user-owned authority.

Whether it ends in a 🔴 or in a diagnosis, the report, the option set, the ask, the apply and the recovery routes are one procedure — the only part of this command an ordinary phase never reaches. In the plugin it is `${CLAUDE_SKILL_DIR}/references/failure-and-recovery.md`: you MUST load it the moment any condition above holds and before you write a word of the report, on every route that reaches one — a task's own test, a red or unrunnable `(auto)` step, a `(manual)` step observed FAIL in either place it can be, a plan defect, a context-budget stop. Never reconstruct it from this list, from the filename or from memory, and never wait for the reporting dispatch above to send you there: every one of those routes stops before it. Do not load it unless a failure condition occurs; a recovered phase may subsequently complete or pause.

## Constraints

- Execute exactly ONE phase per invocation. Never start the next phase, even if context allows. The lone exception: resolving a paused phase **by your own observation** costs no phase budget, so that run continues into the next phase (see "Resolve a paused phase").
- Reconciling a phase whose commits already landed implements no task and writes no code, so it costs no phase budget either and the invocation continues into the next phase — **at most one reconciliation per invocation**, and a second reconcilable phase is reported and stops the run (see "Reconcile before executing").
- Never re-implement a task whose work the tree already carries. Reconciliation runs before the first edit for exactly that reason, and its verification — not a commit-subject match — is what proves the work is there.
- **After any user confirmation (AskUserQuestion or plain text) that resolves a paused phase: update the execution log, commit, tell the user what to run next, and STOP. This is the entire session. Nothing else runs — not decisions, not the next phase, nothing.**
- Probe before you pause, always. A pause is a claim that this step's observation path has an uncovered link — make it only after `ToolSearch` and the skills listing say so, never from memory or assumption.
- Never ask the user to confirm a result you observed yourself. Report the evidence and let them veto.
- Do NOT modify files outside what the phase touches (plus the plan file's execution log)
- Do NOT skip verification, even if you "know" it'll pass
- Do NOT silently rewrite tasks. If a task is wrong, stop and tell the user.
- Atomic commits per task — never combine multiple tasks into one commit
- **no subagents** — this command is the executor, and it applies a chosen option itself; `/esq:autopilot` buys agents, and it buys this one as a subagent rather than the other way round.
- Honest reporting only. If something didn't work, say so. Never claim verification you didn't run.
- NEVER self-certify a `(manual)` verification step. Without an actual observation (a tool's output or the user's confirmation), a phase with manual steps is paused, not completed, and flipping `⏸` to `completed` on your own say-so is forbidden. This is the single rule that keeps "tests pass" from masquerading as "the feature works."
- The execution log entry is the contract with future phases. Make hand-off notes useful.
