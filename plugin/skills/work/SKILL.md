---
description: Route a backlog item to the right entry point — and execute it inline when it's small.
name: work
argument-hint: "[target] [options]"
model: opus
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

**No mandate, no run.** Model invocation of this skill is legitimate only when a user-invoked orchestrator explicitly delegated this run and its target appears in the invoking turn. Invoked without that explicit target — or off a description match, on your own initiative — do not guess: stop and print the exact invocation for the user to run.

Investigate one backlog item, then choose its method. Execute a trivial inline verdict: change, verify, commit, close the row. For every other verdict, print the exact command and stop; the user runs it.

Do NOT use plan mode: capture and inline execution write and commit.

**`route` keyword:** after an ID or item text (`/esq:work B-7 route`, `/esq:work "…" route`), it withholds inline execution. Investigation and free-text capture still run.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Allocate a captured row's ID only with `esq backlog reserve-id`, and run
`esq validate` before the final report. The CLI owns IDs, cells and invariants; the verdict, the sizing, the type
and priority of a row captured from free text, and whether the work is truly done remain yours.

## Announce, before anything

<!-- announce-open:start -->
Print this bound before the first tool call, then continue working in the same response:

> `/esq:work — sizing one backlog item, finishing it when it is small. Bound: no subagents, one item per pass.`

If a pass would exceed it, stop at the bound and say what you did not cover. The resolved target lands in the second line, at the end of preflight.
<!-- announce-open:end -->

## Preflight

1. **Read the table, not the file.** `docs/BACKLOG.md` is an index (the `| B-NNN |` rows) followed by per-item detail sections that are the bulk of it. Read the rows to find your item, then open **only that item's** `## B-NNN` section. If it doesn't exist and the argument is item text, create it from the template in `/esq:backlog` and continue; otherwise STOP: "No `docs/BACKLOG.md` — nothing to route. Capture something with `/esq:backlog <text>` first."
2. Read `CLAUDE.md` at project root if present — project conventions inform the sizing.
3. Resolve the target item:
   - **Argument is an ID** (`B-7`, `B-007`, `#7` — match leniently, zero-padding is cosmetic) → that's the item. If no row matches, say so and stop; never invent one.
   - **No argument** → pick the top actionable item yourself. **If `docs/ROADMAP.md` exists, its order wins:** read it (the top `## Now` entry only) and take the first `B-NNN` in that entry's `covers:` line whose backlog row is still `Open` or `Needs-decision`. Say which entry you're working from and quote its `why now` in one line. Only fall through to priority when there's no roadmap, its `Now` is empty, or nothing it points at is still actionable.
     Without a roadmap: `Open` items sorted `hi` → `med` → `lo` → blank (a suggested `hi?` sorts at `hi`), then by ID ascending. Say which you picked and why in one line. If there are `Needs-decision` items, pick the highest-priority one of *those* instead — they gate everything. If nothing is actionable: "Backlog is clear — nothing to route."
   - **Two or more IDs** → route only the first, and say: "Routing B-7; re-run for the others — one item per pass keeps the judgment honest."
   - **Argument is item text** — anything that is neither an ID shape, nor the bare `route` keyword, nor empty → the user had a thought and no row. **Capture it into one, then route that row**: see "Capturing a row from free text" below. The captured `B-NNN` is the resolved target from here on, and the verdict ladder runs on it unchanged.
4. Read the item's detail section below the `---` if it has one. The `What` / `Why it matters` / `Notes` lines are the richest signal you have.
5. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `Working <B-N>: <summary>.<  Picked because <why>.><  Captured from your text.>`
   <!-- announce:end -->

   On a bare run the pick was yours — say why, so a wrong one costs a keystroke rather than a whole pass.

   On a captured run the *row* was yours — the `Captured from your text.` clause is the user's interrupt moment, printed before a single tool call of investigation is spent on it, so a mis-read phrase costs a keystroke too.

<!-- shared:read-once:start -->
**Read each file once**, taking the needed slice on large files and retaining it for later steps. Re-read only if you have written to it since. A later reference to that file or a desire to double-check does not justify another read.
<!-- shared:read-once:end -->

<!-- shared:batch-independent:start -->
**Batch independent, read-only calls in one turn.** A call that consumes another's result waits for it. Serialize Git mutations, writes to the same file, and reads of a file another call writes; never run them concurrently. Group ordered shell operations with `&&` in one call so failure stops the chain.

Keep one atomic, independently revertible implementation commit per task. Batching calls never merges tasks or justifies an unnecessary read; retain the read-once rule.
<!-- shared:batch-independent:end -->

### Capturing a row from free text

Capture before every verdict, `route` included. The resulting `B-NNN` is the target for the verdict, commits and downstream commands.

1. **Read the row's fields off the text, by reference — never by copy.** `/esq:backlog` Mode A owns those heuristics and is their single source: step 1 *Determine the type* (the `bug:`/`imp:`/`todo:`/`idea:`/`debt:` prefixes, else infer from wording), step 2 *Assign a priority (confirmed or suggested)* (a `?`-suffixed guess unless the user signaled `!!`/`!`/`lo`), step 3 *Dedup*, and step 3.5 *Detect an epic tag* (`epic:<slug>`). Follow those sections as written; do not restate them here and do not invent a second set.
2. **A duplicate routes — it does not stop.** Mode A step 3 tells the user an overlapping `Open`/`Needs-decision` item is already tracked and stops there. You are a router with hands: say the same thing (`Already tracked as B-xxx — routing that one.`), mint nothing, and take that existing item as the target. Rows already `Done`/`Dropped` do not block a capture.
3. **Allocate the ID** with `esq backlog reserve-id`. Honor the CLI refusal; never calculate it yourself.

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

4. **Write the row and commit it alone.** `| B-NNN | <today> | <type emoji + word> | <pri or blank> | <summary ≤ ~12 words, the user's own wording where it survives> | work | <epic slug or blank> | | Open |`, with a detail section below the `---` only when the text carried more than its summary. The `Source` cell is `work`, matching `check: <slug>`'s convention of naming the capturing command. Then `git add docs/BACKLOG.md && git commit -m "backlog: add B-NNN <short summary>"` — `docs/BACKLOG.md` and nothing else.

   <!-- shared:row-header:start -->
   Match the table's **actual header row** rather than the literal cell count above (canonical: `ID | Date | Type | Pri | Summary | Source | Epic | Version | Status`; an older backlog may lack `Epic`/`Version`) — one cell per existing column, or the `Status` lands in the wrong one.
   <!-- shared:row-header:end -->
5. **`route` still captures.** `route` disables *execution*, not target resolution: the row is minted and committed exactly as above, and what `route` withholds is the code change and the status change. A trailing `route` token is the keyword, not part of the captured summary.
6. **An ID shape that matches no row is still a refusal.** `/esq:work B-999` is a typo, not item text — the discriminator is the shape, not the lookup. That argument keeps hitting the ID branch's "say so and stop; never invent one", or a fat finger silently mints a permanent citation key.

## Investigate before you judge

A routing verdict made from the summary line alone is a guess. Investigate proportionally to the item's apparent size — a typo fix needs one `grep`, a "rework the auth flow" item needs real reading.

Gather:

1. **The code it touches.** Grep/glob for the subject of the summary. How many files? Is there one obvious call site or a scattered pattern? Does a test exist for this area?
2. **Prior art in the workflow.** Glob `docs/plans/*.md`:
   - Is there an **active plan** whose scope already covers this item (especially one where the item is already `Status: Planned`)? Then the answer is `/esq:build`, not a new plan.
   - Is there a **`*-fixes.brief.md`** that still lists this item? If the item's `Source` is `fix: <slug>` and that brief exists, the item may already be triaged as 🟢/🟡/🔴 there — read it and honor that triage.
   - Is there a **grill brief** already written for this item? Then it's ready to plan, not to grill again.
3. **The epic, if tagged.** If the `Epic` cell is filled, read `docs/epics/<slug>.md` for the theme's scope and status — it tells you whether this item is one slice of in-flight work or the start of something.
4. **`docs/DECISIONS.md`** if present, but only when the item plausibly collides with a recorded decision. A conflict with a standing decision is a routing signal (it pushes toward `/esq:grill`, because the user has to re-open the call).

Stop investigating once you can defend the verdict — you are sizing the work, not planning it.

## The routing decision

Evaluate in this order and take the **first** match. Ordering matters: the gates come before the sizing.

**Gates — these override everything below.**

1. **Status is `Needs-decision`** → the item is blocked on the user, not on a method. Verdict: state the open question in one line, and offer `/esq:grill <the question>` to work it through, or a direct answer via `/esq:backlog B-N <the answer as a note> open`.
2. **Status is `Done` or `Dropped`** → say so and stop. Offer `/esq:backlog B-N reopen` if they meant to revive it.
3. **Status is `Planned`, and a plan covering it exists** → verdict `/esq:build <plan-path>`. Name the phase it lands in if the plan makes that clear.
4. **A `*-fixes.brief.md` lists this item as 🟢** → verdict `/esq:fix <brief-path>`. The triage is already done; re-planning it would be duplicated work.
5. **A grill brief already exists for this item** → verdict `/esq:plan <brief-path>`. The ambiguity was already killed. Unless a plan beside that brief already carries its slug — the brief was planned, and a planned brief is never re-planned: the verdict is `/esq:build <plan-path>`. (`esq brief pending` is what answers which briefs still owe a plan.)

**Sizing — when no gate fires.**

6. **Too big for one plan** — the item plainly spans several initiatives (multiple subsystems each needing their own phases, or a theme rather than a task) → verdict `/esq:epic new <title>`, then grill the first slice. Only call this when it's genuinely a theme; most items are not.
7. **Ambiguous** — you cannot state, in one sentence, what "done" observably looks like; *or* there are two or more plausible readings of the summary that would produce materially different work; *or* it's an 💡 idea with no detail section; *or* it collides with a recorded decision → verdict `/esq:grill B-N: <summary>`. Name the specific ambiguity.
8. **Clear but substantive** — scope is unambiguous, but the work touches multiple files, needs a design choice, changes an interface, or wants more than one commit to land safely → verdict `/esq:plan implement B-N: <summary>`. (`/esq:plan` will find the item and mark it `Planned` itself.)
9. **Trivial and contained** — one file or a couple of adjacent lines, one clearly-correct change, no design decision, and a runnable verification exists or is obvious → verdict **inline — execute it now** (see "Executing an inline verdict" below). With `route`, print the verdict and stop instead: say what the change is and what would verify it.

**Calibration.** Steps 8 and 9 are where the judgment actually lives. Bias toward 8 when you're torn: a plan for a small task costs one session, whereas an unplanned change that turns out substantive costs a corrective loop. Bias toward 9 only when you have *read the code* and can point at the exact lines — "looks small" is not evidence. Execution raises the bar, it doesn't lower it: "I could probably do this now" is verdict 8, not 9.

## Executing an inline verdict

Only verdict 9 executes; every other verdict prints its command and stops. The sequence:

1. **Print the routing block first** (the Output format below) — the judgment stays visible even when you act on it, so the user can interrupt a bad call.
2. **Apply the change.** Exactly the change you sized — the lines you pointed at in the evidence. If, mid-edit, the change turns out bigger than sized (a second design decision appears, the blast radius grows, a hidden coupling surfaces), **stop**: undo only this run's edits, preserve pre-existing work, explain the changed scope and re-route (usually `/esq:plan`). If your edits cannot be safely separated, leave them and name the affected files.
3. **Verify.** Run the verification you named in the verdict (test, build, lint, a targeted command). If it fails and the fix isn't a trivial correction of your own edit, do **not** commit: leave the diff in the working tree, show the failure, and hand back — the user decides whether to push through or revert.
4. **Commit the code** — one atomic commit, message in the project's convention (e.g. `fix: <what> (B-NNN)`). Code only; `docs/BACKLOG.md` is not in this commit.
5. **Close the backlog item** per `/esq:backlog`'s own rules (table row is the single source of truth): Status cell → `Done`, append ` · Done inline` to the `Source` cell if not already there, set the detail section's `**Resolution:**` line (one sentence) when a section exists, and strip any legacy field lines you touch. Commit it alone: `git add docs/BACKLOG.md && git commit -m "backlog: update B-NNN (done — inline via work)"`. Two commits, not three — the code alone, then the close.

   **Write no plan file.** The code commit and closed row are this fix's record. A review takes that commit or an explicit range; neither `/esq:check` nor `/esq:review` guesses a target.

6. **Confirm** in two lines: the code commit (hash + message) and the backlog close. When the change is worth a second pair of eyes, name `/esq:review <the code commit's full hash>` as `→ Next` — **the hash, never a bare `HEAD`**: a single commit-ish means that commit alone, and by the time it runs the last commit is the backlog close, so a review aimed there would read the bookkeeping instead of the change. It reads exactly that commit and needs no plan.

   A plan-less review routes 🔴 to the user first, 🟢 to `/esq:fix`, and 🟡 alone to `/esq:plan`. After fixes, re-review uses the original base through the last fix commit. A clean review stops without coverage or `/esq:land`: landing requires a plan.

This is the only mutation path that touches code; the free-text capture above is the other one, and it writes a single backlog row. Every other verdict is a hand-off, and the Constraints below say exactly what that forecloses.

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## Output

One compact block. No preamble.

```
✔  work — B-007 · 🐛 bug [hi] · verdict: inline · done · 3m

  ✔ reads as    <one sentence: what the work actually is, after investigating>
  ✔ evidence    <2–4 clauses — files read, blast radius, tests present, prior art>
  ✔ sizing      <one line: why it lands here — files touched, decisions, ambiguity>
  ✔ applied     a3f21c9               <what changed>
  ✔ verified    <the runnable check and its result>
  ✔ closed      B-007 → Done
  ○ if you disagree  <the runner-up method> — <the one condition that would flip it>

→ Next: /esq:work   (next actionable item)
```

On a routing verdict the run stopped rather than finished, so the last three lines are replaced by what the method needs:

```
✔  work — B-155 · ✨ feature · verdict: plan · routed · 2m

  ✔ reads as    <one sentence>
  ✔ evidence    <2–4 clauses>
  ✔ sizing      <one line: why this is too big for inline>
  ○ not done    nothing applied — this needs a plan first
  ○ if you disagree  <the runner-up method> — <the one condition that would flip it>

→ Next: /esq:plan B-155: <the scoped task, in the words the plan should start from>
```

The headline's verdict token (`inline` · `fix` · `plan` · `grill` · `epic`) and its outcome (`done` · `routed`) are the two facts a reader wants, and an item that routed is still `✔` — routing correctly is this command succeeding. Reserve `⚠` for a verdict you could not reach, and `NEEDS YOU` for an item that turned out to be `Needs-decision`.

Rules for the output:

- **`→ Next` carries the verdict's command, and it must be copy-pasteable** — real paths, real item text, no placeholders. An executed inline verdict has no command to hand off, so its `→ Next` is the next item (`/esq:work`) and the change it made is stated on the `✔ applied` line. Before executing, it still prints the change it is about to make in one line (`applying now: <file> — <the change>`), so a bad call can be interrupted.
- **The `○ if you disagree` line is mandatory**, on both verdicts, and must name a **falsifiable condition** ("if the retry ceiling is already decided, skip the grill and plan directly"), not a hedge.
- Use relative paths throughout (strip `/home/…/` and cwd prefixes).
- Prefix `→ Next` with `/clear` when the verdict starts a fresh cognitive phase (`/esq:grill`, `/esq:plan`, `/esq:build`) — those want a clean session. Not for an inline fix.
- Never emit two verdicts. Pick one; the runner-up lives in the `○ if you disagree` line.

## Constraints

- **Only two mutation paths:** free-text capture writes and commits one backlog row before any verdict, including `route`; inline execution commits code, then the backlog close, separately. No plan artifact. Every other verdict is read-only: no brief, epic, decision, plan or status edit. Status-only requests belong to `/esq:backlog B-N planned`.
- **no subagents** — routing is one judgment made by one reader; `/esq:advance` buys agents, and it buys this one as a subagent rather than the other way round.
- **Never run another esq command.** A non-inline verdict prints its command; the user runs it. `/esq:fix`, `/esq:plan`, `/esq:grill`, `/esq:epic`, `/esq:build` are hand-offs, always.
- **`route` disables execution.** With the `route` keyword, even an inline verdict is offered, not applied.
- **One item per pass.** Batching dilutes the judgment.
- **Never plan.** Sizing evidence only — the moment you're describing *how* (an approach, phases, architecture, a file-by-file change list), you've overrun into `/esq:plan`'s job.
- **Name the ambiguity or don't claim one** — `/esq:grill` is the expensive verdict.
- **Honest sizing.** If you didn't read the code, say the sizing is from the summary alone and route conservatively (toward `/esq:plan`).
