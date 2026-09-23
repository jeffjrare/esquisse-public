# Auditing esquisse itself

`./scripts/audit.sh` catches what a machine can catch: a reference pointing at nothing, a command in the README with no
source file, an artifact written but never read, a format the code parses that drifted. It runs the node product suites
itself — never run `node --test` beside it on the same tree. `--release` adds the packaging and release checks; `--lab` adds
the research fixture suites.

**This document covers what greps cannot see**, and it is the only pass that can. Both defects found on 2026-08-05 were of that
kind, and both were found because a *user* noticed something felt wrong, not because any check fired.

What a check may assert is deliberately narrow (`.claude/skills/audit-scripts`): a reference that must resolve, or a format the
code parses. **Everything about what a document *says* — a rule stated twice and differently, a procedure that lost its
condition, a paragraph that grew a claim nobody verified — belongs here.** A great many lexical guards were removed on
2026-09-22 precisely because they gave the impression this pass had been mechanized. It has not been, and it cannot be.

## The failure mode

Both bugs had the same shape: **a capability was added, and its integration points were never traced.**

- `/esq:spec` gained a writer for `docs/SPEC.md`. No command ever gained a reader. The spec could drift from the code indefinitely and nothing would notice. (Now caught mechanically: `check-structure.sh` requires every brief section to have a consumer, and a writer with no reader is the same defect one level up.)
- `/esq:build` gained a "probe for a `/run` skill" instruction — in **one** of the two code paths that settle a `(manual)` step. The end-of-phase path only suggested it; the paused-phase path mandated it. Same user request, two behaviors, depending on which run you were in.

The second is not detectable by grep. Both paths mentioned the same skills, in similar prose, at similar length. Only reading them side by side reveals that one says *may* and the other says *must*.

## The reading pass

Do this when adding a capability to a command, and periodically across the set.

### 0. Find where the new thing should be *offered*

Adding a command is not the same as making it reachable. `/esq:autopilot` shipped fully documented — README section, command table, model table — and stayed invisible, because `/esq:plan`'s closing message still hard-coded "run `/esq:build` to execute Phase 1". A user who finishes planning reads that line, not the README.

So before anything else: **grep for the hand-offs.** Every place a command tells the user what to run next is an integration point. If the new capability is an alternative at any of them, it belongs there — and if it is an alternative only at *some* of them, say which, because "mention it everywhere" is how hand-offs turn to noise.

This was the third defect of the same shape in two days (`SPEC.md` written and never read; the `/run` probe added to one of two paths; autopilot never offered). The pattern is not carelessness about *this* feature — it is that adding is visible work and wiring is not. Nothing guards it. The habit has to be yours.

### 1. Trace the new artifact end to end

For anything a command now writes: who reads it, and what do they do differently because of it? A writer with no reader is a file that rots. A reader that only *mentions* the artifact in a disclaimer (as `worktree.md` did for `SPEC.md`) is not a reader — confirm by eye.

**Trace sections, not just files.** File granularity hid the worst defect the set has had. `docs/plans/` had plenty of readers, so the brief looked wired — but `## Done looks like`, the one section in it stating what the *user* would accept as done, was written by `/esq:grill` into every brief and read by no command anywhere. `/esq:plan` consumed the brief's other six sections and dropped that one; nothing carried it into the plan; `/esq:check` audited plan-against-code and `/esq:review` audited code-against-a-spec-generated-from-code. Every link of the chain was verified against the link before it, and nothing was ever verified against the question that started it. The cycle could confirm the right pixels rendered without once asking whether they answered anything — and it would report that as a clean run.

The tell is worth memorizing, because it produces *confident* wrong output rather than obvious breakage: **when every validation compares a thing to its own upstream artifact, the chain has no external referent.** Ask of any assessment step: what would make this report a failure on work that is internally perfect? If nothing would, it isn't auditing — it's confirming. `check-structure.sh` enforces that every brief section has a consumer; the general question is still yours to ask.

### 2. Find the other path

Whenever you edit a procedure, ask: **is there a second place in this command — or in another command — that handles the same case?** Then diff them by reading, not by grepping. Look specifically for:

- One says "may" / "if available", the other says "must" / "fetch it now"
- One prescribes a tool call, the other relies on the model's impression
- One asks the user, the other decides alone
- Different outcomes for the same observation (one continues, one stops)

If two paths handle the same case, the fix is usually to extract one shared section both call — not to sync the wording, which drifts again on the next edit.

### 3. Challenge every capability assumption

The `(manual)` bug's root cause was a command *asserting* that no browser-driving tool existed without probing for one. Anywhere a command concludes "X is not available," ask whether it checked or assumed. **An assumption of absence must be a tool call.** This is where the cost lands on the user: a wrong assumption becomes a session-ending pause and a round-trip.

### 4. Count the user round-trips

For each place a command stops to ask something: could it have found the answer itself? A question the command could have answered by acting is a defect, not caution. Blocking questions are for decisions only the user can make — never for results the command could observe.

**The test:** does the answer live only in the user's head — intent, priority, a tradeoff hinging on their constraints — or is it in the repo, reachable by reading, running, or reasoning? Only the first earns a stop.

Three shapes that fail it, all found in one pass on 2026-08-10:

- **Confirm-before-write.** `/esq:arch`, `/esq:spec` and `/esq:harvest` each drafted a file, then stopped to ask "does this look right?" before writing it. But every file they write is committed, so a wrong line costs one `git revert` — while the question costs a session and asks about a judgment the command already made and can defend. The report is what the confirmation was *for*, and it is strictly better arriving after: the user can revert or say "put that line back" at the same cost, without having been blocked. **A confirmation before a git-committed write is not a question; it is asking permission to do the job.**
- **Permission for a verified-safe operation.** `/esq:worktree rm` proved a branch fully merged with `git merge-base --is-ancestor`, then asked whether to delete it. Asking permission to discard nothing teaches the user their answer never mattered, which is how they learn to stop reading the questions.
- **Handing back work already done.** `/esq:worktree merge` ran the merge, hit a conflict outside its scope, aborted, and told the user to run `git merge <name>` themselves. The command threw away its own work so the user could redo it. Not touching a file you can't judge is right; discarding the merge around it is not.

The failure mode is not laziness — each of these felt like courtesy when written. Courtesy that costs a session is a defect. And a question the user always answers the same way is worse than no question: it trains them to stop reading.

### 5. Count the agent spend

§4 counts what a change costs the *user*. This counts what it costs the *fleet* — tokens, subagents, wall-clock, redone work. Both are the same defect class wearing different clothes, and for years only the first was audited, because a wasted session is visible to the person waiting through it and a wasted subagent is not.

**Run this on every change that adds, moves, or automates a step.** Four questions, in order of how much they have caught:

1. **What does this re-run that already succeeded?** The expensive failure is never the new work — it is paid work done twice. Ask specifically: does the step being re-entered read from an artifact that records what already landed, or does it re-derive from scratch? A producer that leaves no resumable trace *will* be restarted from zero by whatever calls it next.
2. **Does the caller state its bound before it spends?** A worst case named after the fact is a bill, not a bound. If a command **runs long** — spawning agents, or just thinking — the cap belongs in its opening line, emitted before the first tool call, and any conditional extra ("one more per decision you answer") belongs there too. Agents are not the only spend: 26k tokens of generation behind a `Forming…` spinner is the same bill with nobody watching it accrue, and on 2026-08-13 the user read it as a hang and killed it. **And the bound has to be one the command honors.** A dozen announcements written from one template in one session is a dozen chances to name a plausible cap nothing enforces. Nothing checks it: reading the bound against what the command actually does is this pass's job.
3. **Does this resume into a stop?** Continuing an itinerary is only cheap if the next step can actually proceed. If the reason it halted is still written in the artifact the next step reads, resuming spends a full agent to be told what you already know.
4. **What was the human's judgment silently supplying?** See below — this is the one that produced the worst misses.

**When you automate a step the user was doing by hand, enumerate what their judgment was providing for free.** That judgment is nowhere in the spec, because nobody ever had to write it down. A user re-running `/esq:build` after a failed phase looks at the log, sees three tasks committed, and resumes accordingly — without ever forming the thought. Automate the same step from the written procedure alone and you get the *literal* behavior: `/esq:build` reads a phase with no execution-log entry as `not started`, so the automated resume re-executed three committed tasks with the most expensive agent in the system. The written rule was followed exactly. The unwritten one was the whole point.

Both misses on 2026-08-12 had this shape, both shipped in a change whose stated purpose was *reducing* cost, and neither was caught by the pass that added them — a user asking "is this still careful about cost?" is what surfaced them. That is the same tell as the 2026-08-05 pair: the defects that survive are the ones nobody thought to look for, not the ones nobody could find.

**Read the bill of a real run before theorizing about it.** The four questions above are asked of a *change*. Once a command has actually run, the transcript is on disk and the answer stops being an argument: `~/.claude/projects/<slug>/<session>/subagents/agent-*.jsonl`, one file per subagent, every `tool_use` and every `tool_result` in it. Count tool calls per agent, group them by what the command was, and sum `tool_result` sizes — that is where an orchestrated run's cost actually lives.

Two traps, both of which produced a wrong headline on 2026-08-16 before the numbers were checked twice:

- **An image is not its base64.** A `tool_result` carrying a PNG holds ~75k characters of base64; at the usual chars-per-token ratio that reads as 20k tokens. The real cost is by area — roughly `width × height / 750` — so a 500 × 705 screenshot is about **470** tokens, forty times less. Measure image reads by dimensions, never by payload length.
- **A category regex overmatches.** `port` matches `import`; classifying turns with it put "environment setup" at 25% of a run that actually measured 6%. Anchor on literals that cannot appear in source (`psql`, `docker ps`, `ss -ltnp`, a literal `:5434`), then read a sample of the matches back before quoting the number.

What that measurement found, on a four-phase `/esq:autopilot` run of 391 tool calls: **the agents' own prose was ~1k tokens per phase against 155–208k totals.** Generated output is not the bill; *turns* are, because every turn re-sends the accumulated context. The two backend phases cost 63 and 86 turns; the first phase to touch the frontend cost 155, and the second one only 87 — the difference is not the code, which the plan had named file by file, but **first contact with a live app**: finding the dev server's port, the seed path, an email-verified household, and hand-writing a browser-driving harness. That is paid once per plan and is invisible to every check in `audit.sh`.

**The reason this needs a standing question rather than good intentions:** adding capability is visible work, and spending is invisible until someone reads the bill. The rule is that every command running long states a bound before it spends and reports the bill after — four short commands excepted. It shipped broken once, while five green `(auto)` steps certified an announcement the command never printed: a lexical check cannot tell a stated bound from an honored one, which is why the four questions above are the whole of what catches it.

### 6. Check the README says what the command does

`check-structure.sh` verifies every command appears in the README's **Commands** section. That is presence, not truth: whether the row *describes* the command is this pass's job, and it is the one that goes stale first, because changing behavior and changing its sentence are two separate edits.

The check exists because the prose rule did not hold. `CLAUDE.md` has said "update `README.md` in the same commit" since the beginning, and `/esq:sweep` still sat in neither table for months, and `/esq:roadmap` was added to one table and missed in two — by someone who had just read that rule. A convention that has failed twice is a check waiting to be written.

**It still cannot verify the entry is *true*.** A row can name every command and describe none of them correctly. When a command's user-facing behavior changes, re-read its README section as a user would, and check the walkthrough examples still describe what actually happens.

### 7. Read the output as a report, not as reasoning

Every question above audits what a command *does*. This one audits what it *prints*, which is the only part the user actually pays attention to — and it is unguarded by construction, because the constraint lists in these files restrict **writes** and say nothing about output. A command can honor "the only file you write is `docs/BACKLOG.md`" and still return three screens of prose.

Two questions, on any command whose response is a report.

**Does every block in the template have a producer?** Trace each heading back to the step that fills it. A block with no step behind it is not inert — it is a blank the run will fill with whatever it has, and what a model has at the end of a classification pass is its reasoning. `/esq:sweep` classified three ways (settled / ambiguous / untouched) and reported four; the fourth, `Left open`, was fed by nothing, so it collected paragraph-length explanations of items that were merely still open. The item was open, the backlog already said so, and the reader had to finish the paragraph to learn it needed nothing from them. This is the writer-with-no-reader defect one level down — an artifact with no *writer* — and the same question finds it.

**Does the command narrate anything it was positioned to fix?** A finding printed as an observation is a finding the command declined to act on, and the pass that found it is nearly always the pass best placed to handle it — that is *why* it found it. When the output contains a defect and no action, the missing thing is a branch, not better wording. `/esq:sweep` reads every backlog row on every run, which is exactly why it noticed four rows carrying a status outside the canonical five; it then wrote them up under a heading it invented for the purpose. Adding a rule saying "be concise" would have shortened the paragraph and kept the defect.

The general shape, and a sibling to the one in §5's closing note: **a command that ends by describing something it could have done.** The tell is a report section the template did not ask for — *notes*, *observations*, *out of scope but worth mentioning*, *two honest notes*. An invented heading is a slot the command needed and did not have, and it is a reliable signal that the fix belongs in the classification, not the prose.

## Known duplicated definitions

These are facts more than one command has to hold the same way. Until 2026-09-22 most of them were held by a lexical check; the checks are gone, so **they are held here, by this reading pass**, which is what the pass is for. Read this list when you change any of them.

- **The backlog ID allocation rule** — a worktree mints IDs from its own reserved block, never from the backlog's global maximum. Five files describe it; the *protection* is the CLI's exclusive-create lock in `reserveBlock`, which is tested. A drifted description allocates outside the block and re-mints an ID that already exists on another branch — silently, which is why this one is first on the list.
- **The backlog status vocabulary** — five values, and every consumer filters by inclusion or exclusion, so **a sixth value matches neither branch and the row goes invisible to the whole set**: not worked, not counted, not swept, not roadmapped, with nothing reporting it missing. The duplication is not the defect; the filtering idiom is. `/esq:sweep` is the one pass that reads every row on every run, so it carries the synonym map and the `Ledger defects` report block — check them when a status value is added.
- **🔴 precedence in the corrective brief** — a 🔴 outranks the other tiers and routes the whole brief, even when 🟢 items are present. Attended, a drifted copy costs a wasted `/esq:fix` the user can see and revert; unattended it is worse and quieter — converge would apply the greens against a decision the user never got to make.
- **The decision shape** — every 🔴 and every gate is handed over as an option set: the decision in ten words, why it is the user's, lettered options each with a runnable `do:`, and a leaning. Never a bare question. The phrases that mean it drifted are "Answer the 🔴" and "Answer the open question" outside a `never` clause.
- **The conclusion protocol** — three zones, in order, and nothing outside them. The rule that regresses first is the collapse: printing `None.` feels thorough, costs the reader a scan to learn nothing happened, and teaches them to skip the zone — including on the run where it mattered.
- **The `Planned by <slug>` marker** — written by `/esq:plan`, read by the landing gate's `unit.promised`. Reword it in the writer and nothing errors: every reader simply finds nothing, forever.
- **The branch-ownership contract** — `**Branch:**` and `**Origin:**`, written by `/esq:plan`, read by `esq branch check` and `esq merge land`. The CLI owns the verdict; a skill describing it differently is a description that has drifted from the thing that decides.
- **The `(auto)` / `(manual)` split and what each owes** — described in `/esq:plan`, executed by `/esq:build`, re-run or reused by `/esq:land`. Three commands, one meaning.

## Structural notes

Kept here rather than in any command, since they concern the set as a whole.

- **`build.md` is the largest command (~370 lines).** Measured 2026-08-05: it is not padded with redundancy — the critical "never self-certify a manual step" rule appears 3×, which is deliberate (procedure, procedure recap, Constraints). The largest sections are execution-log templates that must be verbatim, and the task loop. What *is* notable: roughly a quarter of the file is ledger bookkeeping (writing DECISIONS.md, capturing and proposing closes on BACKLOG.md) rather than phase execution. That is a passenger on build's altitude, not fat to trim — worth watching if it grows further.
- **Prompt files that only ever grow will eventually see their middles honored less than their edges.** When adding a rule, prefer replacing a weaker statement of the same rule over appending a stronger one beside it.
