---
description: The deeper plan-versus-reality diagnosis, asked for when a plan is large or drift is suspected. Read-only. Catches missed tasks, divergence and unplanned work, phase by phase.
name: check
argument-hint: "[target] [options]"
model: opus
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

**No mandate, no run.** Model invocation of this skill is legitimate only when a user-invoked orchestrator explicitly delegated this run and its target appears in the invoking turn. Invoked without that explicit target — or off a description match, on your own initiative — do not guess: stop and print the exact invocation for the user to run.

You are comparing a plan against its implementation, phase by phase. Read-only on code — no code changes, no plan-file edits. You assess and triage, writing a corrective brief for `/esq:fix` and `/esq:plan`, plus out-of-scope backlog observations when warranted.

Use this explicit diagnostic for a large plan, a log/diff disagreement or suspected unplanned work. Normal delivery uses `/esq:review` to assess both the goal and code. **Check records no review coverage and never substitutes for review.**

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Run `esq validate` before analysis, and use `esq backlog reserve-id` for each out-of-scope row. The CLI owns parsing and IDs; materiality, severity, user authority, and conformity remain your judgment.

This is NOT code quality review (`/esq:review` does that). This is plan-vs-reality reconciliation.

Do NOT use plan mode — it would block the corrective-brief write. You still change no code.

## Announce, before anything

<!-- announce-open:start -->
Print this bound before the first tool call, then continue working in the same response:

> `/esq:check — checking the plan against what shipped. Bound: no subagents, no code changes, at most one corrective brief.`

If a pass would exceed it, stop at the bound and say what you did not cover. The resolved target lands in the second line, at the end of preflight.
<!-- announce-open:end -->

## Preflight

1. Determine the plan file path:
   - If the user provided a path argument, use it.
   - Otherwise stop with one line: `` `/esq:check <plan-path>` — which plan should I reconcile? `` Never choose the most recently modified plan. This command accepts only a plan; a plan-less change goes to `/esq:review <A>..<B>`.
2. Read the plan file in full, including the `## Execution log` section
3. Derive the audit range — cheapest source first, no git archaeology:
   - **Primary:** the `## Execution log` you just read already names the commit short hashes per phase. Collect those, plus any fix commits from `/esq:fix` runs on this slug's fixes briefs; the range is `<earliest>^..HEAD` — the caret is required, because `A..B` excludes `A` and the earliest hash is a real implementation commit.
   - **Fallback** (no log entries, or the entries cite no hashes): find the `plan: <slug>` commit and use `<plan-commit>..HEAD`.
   - `git log --oneline <range>` for the commit list
   - `git log --stat <range> -- . ':!docs/plans' ':!docs/BACKLOG.md' ':!docs/DECISIONS.md'` — the exclusions drop esquisse metadata churn (briefs, backlog captures) that is never audit material. **This is the only per-commit file listing this run fetches**; per-phase analysis reads each commit's stat out of it rather than re-running `git show --stat`
   - Treat esquisse metadata commits as workflow artifacts throughout — any subject starting `plan:`, `plan(`, `brief`, `backlog:`, `decisions:`, `epic:`, `roadmap:`, `spec:`, `merge:`, `docs(claude):`, or `docs(arch):`. Don't inspect their diffs and don't count them as unplanned work
4. Read `CLAUDE.md` at project root if present. Read `docs/SPEC.md` if present — you'll need the feature sections covering what this plan touched (see "Spec conformance" under cross-cutting analysis). Skip this read if no spec file exists.
5. Fetch task tracking tools: call `ToolSearch "select:TaskCreate,TaskUpdate"`. If available, create five tasks (all `pending`): `"Load plan & git history"`, `"Does it answer the question?"`, `"Per-phase analysis"`, `"Cross-cutting analysis"`, `"Generate report"`. Note IDs. Mark `"Load plan & git history"` `completed` immediately. Skip silently if unavailable.
6. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `Auditing <slug> over <range> — <N> commits.`
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

## The bar

Your job is to catch what lets a feature look done while being broken: a task never built, a phase marked complete whose manual verification never happened, a plan promise the code doesn't keep. That's the signal, and it's the whole reason this step exists.

**Divergence is not, by itself, a finding.** A build that took a different route to the same outcome exercised judgment the plan couldn't have had — that's the system working, not drift to correct. So before anything becomes an action item:

> **Name what's missing or wrong now.** What did the plan promise that the code doesn't deliver, and what breaks because of it?

If the answer is "nothing — it was just built differently," it's one zone-3 line, not an action item. Report it once and move on.

- **Not findings:** a cleaner implementation than planned · a helper file the plan didn't name · a small unplanned cleanup commit · tasks done out of order · wording drift between plan and code.
- **Findings:** a task with no implementation · a phase marked complete with manual verification never observed · a verification claim you can't reproduce · a divergence that changed the *outcome*, not just the route · a plan promise silently dropped.

Code quality is out of scope here even when it clears that bar — `/esq:review` owns it. Don't smuggle quality items in as "drift."

## The check

### Did it answer the question? — run this first

Call `TaskUpdate` to set `"Does it answer the question?"` `in_progress`.

A chain sound at every link can still be attached to nothing. So before any of the link-to-link comparisons below, read the plan's `## Done looks like` and `## Goal`, and answer one question about what shipped:

> **Does the delivered thing satisfy the conditions the person who asked for it would recognize as done?**

Judge it against those conditions in *their* terms — not against the tasks, not against the verification steps, which can only ever confirm the plan against itself.

**Proof is recorded evidence that still holds.** A test or a `**Manual verification:** confirmed …` line proves a condition only when all three hold: (1) its passing result is recorded — a command under that phase's `**Verified:**` field, or a confirmation line carrying its evidence; (2) it covers this condition — the test asserts it, or the confirmation names what was observed; (3) it still applies — nothing the condition depends on changed after the recorded `verified.at` or the confirming phase, read from the preflight `git log --stat` already in hand. A test that merely exists, or a confirmation later changes invalidated, is not proof. **Missing proof is investigated before anything else:** read the code path and run the covering `(auto)` step once. Still unproven and machine-observable → a 🟡 finding, the missing verification.

Three outcomes:

- **Yes** — zone 3's `answers` line says so, naming the condition and what in the code satisfies it. Say it explicitly even when obvious; an audit that never states this is the audit that let it slip.
- **Partly, and you can name the gap** — the plan built something the brief's conditions don't cover, or covers a condition only in the happy path. That's a finding at its own severity, not a note. Name which condition is unmet and what would meet it.
- **Only the user can judge it** — the condition is about whether a person's problem is actually solved, the investigation above settled nothing, and no valid confirmation exists. Only then is it a 🔴, written in the shape below: the decision is *"does <the concrete screen or output> give you Y?"*, `Why yours` is that only looking settles it, and the two options are *it does* (→ `/esq:review <plan-path>`) and *it doesn't* (→ `/esq:plan <brief-path>`). Do not resolve it by assuming the plan was right; the plan is the thing under audit.

If the plan has no `## Done looks like` (written before this section existed), say so plainly in one line and fall back to `## Goal` — then note that the next plan for this work should carry the brief's conditions forward, because auditing a plan against itself is what this section exists to prevent.

**This outranks everything below.** A plan whose every task shipped, whose every verification passed, and whose result answers the wrong question is a *failed* plan — report it that way in the verdict, not as a clean run with a footnote.

### Per-phase analysis

Now cross-reference the plan against git history and current state. Call `TaskUpdate` to set `"Does it answer the question?"` `completed` and `"Per-phase analysis"` `in_progress`. For each `### Phase N` in the plan:

1. **Was it executed, and is it done?** Read its execution-log entry. `completed` means done; **`⏸` means paused and incomplete regardless of the following prose**. Surface every paused phase. Its `**Manual verification outstanding:**` and `**Blocked by:**` fields identify the manual steps or same-unit defects still owed.
2. **Do the commits match?** The execution log lists commit short hashes. Verify they exist in the preflight commit list, then read each one's file list and shape out of the preflight `git log --stat` — that usually confirms or refutes the task↔commit match on its own, and it is already fetched. Open a full `git show <hash>` only when the stat looks off (unexpected files, surprising size) or the task can't be confirmed from file names alone. Never re-fetch a stat you already have, and do not full-diff every commit by default.
3. **Were all tasks done?** For each task listed in the phase, find the corresponding commit. If a task has no matching commit, that's a gap.
4. **Did verification actually pass — including the manual steps?** Re-run a sample `(auto)` step yourself if possible; if the log claimed ✅ but you can't reproduce it, flag it. Then check the `(manual)` steps: a `completed` phase that had `(manual)` verification MUST carry a `**Manual verification:** confirmed …` line with evidence. If a phase was marked `completed` but its manual steps were deferred, excused in prose ("deferred to live env"), or never observed, that's a **false-complete** — flag it as prominently as a missing task.
5. **Did the divergences change the outcome?** For the tasks where the plan prescribed a specific approach, read those diffs (the ones already opened in step 2, plus any approach-critical ones). The question is not "did they follow the recipe" — it's whether the difference cost anything. A different route to the same result is a note. A divergence that changed behavior, dropped a requirement, or took on a constraint the plan explicitly ruled out is a finding.

### Cross-cutting analysis

Call `TaskUpdate` to set `"Per-phase analysis"` `completed` and `"Cross-cutting analysis"` `in_progress`. After per-phase, look across the whole change:

1. **Unplanned commits.** Are there commits since the plan was created that don't map to any task in any phase? Give them a zone-3 line — acknowledged, not actioned. One becomes a finding only if it undid planned work, changed behavior the plan specified, or landed unverified.
2. **Surprises consistency.** The execution log called out surprises. Are those surprises reflected in the actual code? (E.g., if the log says "switched from middleware to inline handler," is the code inline?)
3. **Open questions.** The plan listed open questions. Were they resolved during execution? If so, how? If not, do they still need answering?
4. **Files touched outside plan.** Did the implementation modify files the plan didn't mention? List them with a one-word call. A plan names the files it could foresee; touching others is normal (an import in a dependent file, a helper the plan didn't anticipate). Only a change to a file the plan implied should *not* change is a finding.
5. **Spec conformance.** Skip entirely if `docs/SPEC.md` doesn't exist. Otherwise, for the features this plan touched, compare what shipped against what the spec documents:
   - **Contradiction** — shipped behavior differs from a documented **Règle métier**. Read the plan under review, its execution log and the Active `docs/DECISIONS.md` entries touching the feature first, then classify the difference one of three ways:
     - **Explicitly authorized** — the approved plan's Goal, Recommendation or a task stated before the change was built names the change, or an Active decision whose `**Fondement:**` names a basis that covers *this* change → spec staleness, cited by that ID, `→ run /esq:spec`. A `mandate` basis covers a delegated technical choice and never a change to an explicit constraint, a promised capability or a major commitment. `Statut: Active`, the entry's date and its commit's position relative to the plan's prove nothing on their own, and neither does a basis with no citation after the em dash. An entry with no `**Fondement:**` is context — never authorization, and never on its own a question. An execution-log entry, a Surprises line or a decision that records what the worker did is recorded drift, not authorization: classify that difference by the two cases below.
     - **Clear requirement, wrong implementation** — the rule is unambiguous and nothing recorded changes it → a technical defect, 🟢 when the fix is mechanical and 🟡 when it needs a plan, cited as `SPEC.md › <feature> › <rule>`.
     - **Missing intent or authorization** — the rule is genuinely ambiguous on a product-visible point, or two recorded intents are incompatible → 🔴 whose `Why yours:` names exactly what is missing.

     The absence of an authorizing decision alone is the second case, never a question.
   - **Undocumented feature** — the plan shipped user-facing behavior the spec doesn't describe at all. Not a defect; it means the spec has fallen behind. Note it, and say how many features are affected.
   - **Retired behavior** — the plan removed or replaced something the spec still describes as live. Same treatment.
   Report spec staleness — an authorized difference, an undocumented feature, retired behavior — as a **staleness note**, not as an action item: end the section with `→ Run /esq:spec to refresh (N feature(s) affected)`. Do NOT edit `docs/SPEC.md`, and do NOT run `/esq:spec` — that command is user-triggered only.

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## Report

Call `TaskUpdate` to set `"Cross-cutting analysis"` `completed` and `"Generate report"` `in_progress`. Output findings in this exact structure — **lead with verdict and action items so the user knows what to do before reading any detail**. Call `TaskUpdate` to set `"Generate report"` `completed` after writing.

Rank the action items by consequence, worst first.

### How to write a 🔴

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

```
⚠  check — <slug> · 5 phases · 4 findings · 4m · NEEDS YOU (4)

  1  <the 🔴, option-set shape above — verb first, ≤10 words; options and leaning under it>

  🟢 safe fixes (2) → /esq:fix
     <finding> — `file:line` — fix: <one line> — verify: <runnable check>
  🟡 needs planning (1) → /esq:plan
     <finding> — `file:line` — why: <one line>
  ⏸ paused (1) → /esq:build
     Phase 4 — <what the entry owes: the `(manual)` steps to observe, or the same-unit rows blocking it>

  ✔ phases      4/5 complete          Phases 1–3, 5 — tasks matched, auto + manual confirmed
  ✖ Phase 4     🚩 false-complete     marked done, manual verification never observed
     Task 4.2: ❌ no matching commit
  ⚠ answers     `Done looks like` — 3 of 4 met
     ⚠ <the unmet condition> — <what is missing>
  ○ clean       no unplanned commits, no files outside plan, no surprises
  ○ spec        stale — 2 feature(s) → /esq:spec

→ Next: <computed — see below>
```

Zone 2 is all four tiers, worst first, and `NEEDS YOU (<n>)` counts every item across them — each one is a thing the user must run or settle. Omit a tier with zero items; all four empty means the headline is `✔` and zone 2 is gone entirely.

Zone 3 aggregates clean phases in the `phases` count; expand only problem phases and their failing tasks. Combine clean cross-cutting categories in one `○ clean` line. **Always retain the separate `answers` line**, even on success: it states whether the delivered result satisfies `Done looks like`.

**🟢 means a gap with a mechanical fix — not a change that is merely safe to make.** Safety is what makes a gap green; it is never what makes something a finding. An observation that failed the bar is a zone-3 line or nothing.

Compute **→ Next** as one of — always with the concrete path (`<brief-path>` is the corrective brief you write below; `<plan-path>` is the plan you checked), so the line is copy-pasteable. **🔴 outranks every other tier**: a red may be the question of whether the greens are worth applying at all, so it routes the whole brief even when greens are present — the same precedence `/esq:converge` honors when it runs this loop unattended.
- 🔴 present → `"Run the `do:` of the option you pick on each 🔴 above, then: /esq:check <plan-path>"` — name the count (`1 decision`, `2 decisions`) so the user knows how many picks stand between them and the loop closing. Never `"answer the 🔴 items"` — the options are already written above.
- No 🔴, any 🟢 → `"/clear, then run: /esq:fix <brief-path>"`, and on a second line the unattended form, at what it actually buys: `"Or: /esq:converge <brief-path> — applies these and stops. One subagent."` **Say that it stops there**, because entering converge from a *check* brief runs the fix and no review: `/esq:check` records no review coverage and neither does that run, so the unit is still owed `/esq:review <plan-path>` afterwards. Name that command on the same line. Do not describe converge as re-reviewing anything — from this brief it does not.
- No 🔴/🟢, any 🟡 → `"/clear, then run: /esq:plan <brief-path>"`
- All clear → `"Run: /esq:review <plan-path>"` — this command reconciled the plan against the implementation and recorded no coverage, so a review is still what a landing reads.

**Then bound the loop before that line is written.** The corrective brief below is written either way — the findings are the record and are never lost — but the `→ Next` above may not open a round this unit has run out of.

<!-- shared:corrective-bound:start -->
**Two corrective generations, and the third is not yours to open.** Before anything opens another corrective round, run `esq brief depth <brief-path>` and route off its `verdict` alone — never off the filename, and never off a generation you counted yourself. `open` changes nothing. `exhausted` means this unit has already been corrected twice, and what is left is a budget call only the user holds — so hand back this 🔴, a decision in this exact shape, and nothing else:

> **🔴 Third corrective round on `<stem>` — accept it or re-plan it**
> - **Why yours:** two corrective rounds have already landed on this unit, and whether to keep spending on it is an authorization only you hold.
> - **A · accept what stands** — the 🟢 items are applied and every finding left becomes a recorded backlog row, so the unit lands with its debt written down — do: `/esq:fix <brief-path>`
> - **B · abandon and re-plan the stem** — this unit's unbuilt plans are retired and the work is planned again from `<stem>`, at the price of a fresh planning pass — do: `esq plan abandon <plan-path> --reason "third corrective round refused"`, then `/esq:plan <stem>`
> - **Leaning:** **A** — the debt is recorded either way, and a third round costs more than it retires.

No finding is lost to this refusal: the corrective brief stays on disk, so `unit.findings` keeps the landing blocked until option A's `do:` disposes of it.
<!-- shared:corrective-bound:end -->

At `exhausted` that 🔴 **is** the `→ Next`: it replaces the line computed above, and neither `/esq:fix <brief-path>` followed by a corrective plan nor `/esq:converge` is offered beside it.

Offer `/esq:converge` on the 🟢 branch **only** — on a 🔴 it stops on the red you just reported, on a 🟡-only brief it has nothing to apply, and on an all-clear brief it has no fixes to apply; hand off to review directly.

## Write the corrective brief

If there are any 🟢 or 🟡 findings, emit a corrective brief so the loop can close — otherwise the findings die in this chat. The only other permitted write is the out-of-scope backlog capture below; neither changes code.

1. Path: `docs/plans/<YYYY-MM-DD>-<slug>-fixes.brief.md` — slug from the plan filename, today's date. If it exists, append `-2`, `-3`, … until unique.
2. Write it in the corrective-brief format below.
3. `git add` that file only — and do not commit yet. `/esq:check` writes both this brief and the backlog rows below in this one pass and owns both files while it does, so its whole tail is **one** commit, made at the end of "Out-of-scope observations → backlog". Stage nothing else — you changed no code.

If everything is clean (no 🟢/🟡, at most informational 🔴), skip the brief and say so.

```
# Fixes brief: <plan title>

Source: /esq:check on <plan-slug>, <YYYY-MM-DD>

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- <finding> — `file:line` — fix: <one line> — verify: <runnable check>

## 🟡 Needs a plan
Substantive — route through /esq:plan → /esq:build.
- <finding> — `file:line` — why it needs planning: <one line>

## 🔴 Needs your decision
Only the user can answer. Nothing proceeds until resolved.
- <each item in the 🔴 shape from "How to write a 🔴" — decision, why yours, lettered options with a runnable `do:`, leaning. Copy it into the brief in full; a red that arrives here as a bare question is a red the next reader has to re-derive.>

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
```

(Omit any tier with no items.)

## Out-of-scope observations → backlog

If, while comparing plan against reality, you notice something real that is **neither a gap nor drift** — an unrelated bug in adjacent code, an improvement idea, a follow-up worth remembering — it doesn't belong in the corrective brief. Capture it in `docs/BACKLOG.md` so it isn't lost (schema and template live in `/esq:backlog`):

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

- Row: `| B-NNN | <today> | <type emoji + word> | <blank> | <one-phrase summary> | check: <slug> | | | Open |` — Status `Open`, no priority.

<!-- shared:row-header:start -->
Match the table's **actual header row** rather than the literal cell count above (canonical: `ID | Date | Type | Pri | Summary | Source | Epic | Version | Status`; an older backlog may lack `Epic`/`Version`) — one cell per existing column, or the `Status` lands in the wrong one.
<!-- shared:row-header:end -->
- Dedup against existing rows first. Create the file from the template if it's missing.
- **The tail is one commit, naming both halves:** `git add docs/BACKLOG.md && git commit -m "brief(fixes): <slug> + backlog observations from check"`, over the brief staged above and these rows together. Reverting one without the other would leave a brief citing observations that no longer exist, or rows citing a brief that does not. With nothing out of scope there is nothing to add here and the tail is the brief alone: `git commit -m "brief(fixes): <slug>"`.
- List what you captured under a "Logged to backlog" note at the end. If nothing was out of scope, capture nothing and say nothing.

Same bar as everything else: an out-of-scope observation still has to name a failure. The backlog is **not** where observations that didn't clear it go to be polite — those are dropped. A nit you file is a nit the user has to triage later, which is the same cost deferred. Gaps and drift go in the brief, not the backlog.

## Style

Be specific, blunt, useful. Cite commit hashes and file paths. Don't pad with "great work overall" filler. A clean check should take 10 lines, not 100.

Verdict options — the first outranks all the others, for the reason its own section above gives:
- "Built as planned, but it doesn't answer the question: <the unmet condition from `Done looks like`>. <what's missing>."
- "Implementation matches plan and satisfies `Done looks like`. Proceed to /esq:review <plan-path>."
- "Implementation matches plan with minor drift: <summary>. Reasonable to proceed."
- "Gaps found: <count>. Do not declare done until: <list>."
- "Manual verification never done: phase(s) <list> marked complete but no user-facing behavior was observed. Re-run /esq:build before declaring done."
- "Significant drift from plan — recommend: <amend plan / fix code to match plan>."

## Constraints

- Do NOT modify code or make code commits
- **No subagents:** reconcile the plan and implementation in this context.
- The only files you may write and commit are the corrective brief (`docs/plans/<...>-fixes.brief.md`) and `docs/BACKLOG.md` (out-of-scope observations only) — nothing else, and never code
- Do NOT execute tests beyond what's needed to spot-check verification claims
- Do NOT review code quality (that's `/esq:review`'s job) — focus on plan-vs-reality only
- Output the report in chat (the corrective brief is a condensed, actionable subset of it — not a replacement)
- Do NOT apply fixes yourself — triage only. `/esq:fix` applies; you assess.
