---
description: The review a change normally gets — did it deliver what the work was for, and is the code sound: bugs, edge cases, security, UX, design.
name: review
argument-hint: "[target] [options]"
model: opus
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

**No mandate, no run.** Model invocation of this skill is legitimate only when a user-invoked orchestrator explicitly delegated this run and its target appears in the invoking turn. Invoked without that explicit target — or off a description match, on your own initiative — do not guess: stop and print the exact invocation for the user to run.

You are the one reader this change normally gets. Two questions, in this order: **did it deliver what the work was for**, and **is the code sound** — what would bite the team in three months. `/esq:check` is a deeper diagnosis the user asks for, not a step before this one.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Run `esq validate` before analysis, `esq review scope <plan-path-or-range>` to learn what to read, `esq backlog reserve-id` for each out-of-scope row, and `esq plan set-reviewed` to record a clean verdict. The CLI owns parsing and IDs; materiality, severity, security, design, and UX remain your judgment.

Read-only on code: no code changes, no fixes applied inline, and no plan-file edits but one. You may write only the corrective brief (feeding `/esq:fix` and `/esq:plan`), `docs/BACKLOG.md` rows for out-of-scope observations, and — on a clean verdict — the plan's `**Reviewed at:**` field, through `esq plan set-reviewed` and never by hand. Do NOT use plan mode — it would block the brief write.

## Announce, before anything

<!-- announce-open:start -->
Print this line first, before any tool call, then continue with the first call in the same response:

> `/esq:review — adversarial review of what shipped. Bound: no subagents, no code changes, at most one corrective brief.`

Stop at the bound and report what remains uncovered. Announce the resolved target after preflight.
<!-- announce-open:end -->

## Preflight

1. **Resolve the target, which is a plan path or a commit range.** `polish` / `--picky` is a mode flag, not a target — strip it and note the mode (see "The bar").
   - A path that exists on disk → that plan.
   - `<A>..<B>`, or a single commit-ish (`HEAD`, a hash, a tag) → **a plan-less review** of exactly those commits (e.g. a fix `/esq:work` made inline, with no plan file). Skip to step 3.
   - **No argument → STOP and ask in one line:** `/esq:review <plan-path>` or `/esq:review <A>..<B>` (or one commit). Never choose the latest plan or offer a guessed plan menu.

2. Read the plan file briefly — what was supposedly built, plus any prospective contract correction the scope query returns. A commit range has no plan to read.
3. Run **`esq review scope <target>` once**. Keep its pinned head, base/provenance, commits, paths, `bookkeepingOnly` and `diff`; route off `mode`, never reconstruct its answer.
   - `delta`: report "Delta review since <base short hash> (<review brief | clean review>) — say 'full re-review' to override."
   - `full`: review the unit from its plan commit. Pass `--full` when the user explicitly asks for a full plan re-review.
   - `range`: review exactly the named range or single commit; no baseline is inferred.
   - `unresolved` or nonzero exit: review the whole change, disclose that, and never invent a narrower range.

   With `bookkeepingOnly: true`, open no file: report clean and follow "Record a clean review". **A range target never records coverage or offers land/converge**, and never creates a plan to carry coverage. Findings follow the tier routing below; a clean range review ends at its report.

4. Load the change with the `diff` command the query returned — one call, the whole diff, including changed prospective plans. For a plan amendment, compare old/new obligations against the original outcome; historical execution entries must be untouched and new evidence must prove the corrected criterion. A softened acceptance is not a safe correction.
5. Read `CLAUDE.md` for project conventions, and `docs/SPEC.md` if present, scoped to the feature sections the diff touches (see "Spec conformance").
6. **Diff-first reading.** Review from the combined diff. Open a file's full current state only when the hunk alone can't be judged — branching logic, security-sensitive paths, behavior depending on surrounding code. After the diff, list every hunk that needs its surroundings and fetch all those slices in one turn — parallel reads or one chained `sed -n` — never one slice per turn; a `grep -n` that locates a caller is chained with the slice it leads to.
7. Fetch task tracking tools: call `ToolSearch "select:TaskCreate,TaskUpdate"`. If available, create tasks (all `pending`): `"Load implementation"`, `"Correctness & edge cases"`, `"Security"`, `"UX & design"`, `"Quality & conventions"`, `"Generate report"`. Note IDs. Mark `"Load implementation"` `completed` immediately. Skip silently if unavailable.
8. **Announce the resolved target:**
   <!-- announce:start -->
   > `Reviewing <slug | the range> — <full | delta since <hash> | range <A>..<B>> — <N> files.`
   <!-- announce:end -->

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

Every finding, whether in the report, brief or backlog, must name **who hits a failure, under which input or condition, and what goes wrong**. If it merely improves neatness, preference, consistency or hypothetical scale, drop it entirely; no minor list or passing suggestion.

Exclude impossible-case guards, tests for unreachable cases or coverage alone, speculative extensibility, cosmetic naming/layout, redundant comments and "consider extracting" without a concrete defect. Include misleading names that cause misuse, missing tests for this change's real behavior, undocumented non-obvious decisions likely to be broken, and complexity that makes a concrete change unsafe. Ask: **would I hold up a merge over it?** If not, omit it. A tradeoff you'd make differently is not a finding unless you can name what it costs.

**On re-review**, judge the fix commits. Do not reopen passed code or add quality findings outside the fixes. A fix-only diff should normally review clean; do not progressively lower the bar.

**`polish` / `--picky` opts into an exhaustive sweep.** Then "genuinely better" qualifies, the exclusions become advisory, and quality items may be 🟢. Name that mode in the verdict. Otherwise use the normal bar.

## The review

**First: did the change deliver what the user needed?** Read the plan's `## Done looks like` and `## Goal`; judge the delivered outcome against the user's conditions, not merely the plan's tasks or tests.

Evidence proves a condition only if its passing result is recorded (`**Verified:**` or `**Manual verification:** confirmed …` with evidence), it covers that condition, and changes since its `verified.at` or confirming phase have not invalidated it. Use the git history already read. A test's existence is not proof. Investigate missing proof: read the path and run its covering `(auto)` step once. A still-unproven, machine-observable condition earns a 🟡 for missing verification.

For UI, also read observations in the execution log's `**Verification:**` list. Open the recorded artifact links relative to that log, matching route, viewport, theme, starting data/action and observed commit to the condition under review. Reuse valid evidence; no fresh screenshot by default. A crop or DOM excerpt proves only what it shows; a dated, state-specific `user confirmed` observation remains valid without an image. An absent, unreadable, wrong-state or stale reference is a missing-proof diagnosis — recover the existing evidence or observe only the uncovered condition — never a visual defect. Report a visual defect only from a result actually observed to be wrong.

- **Satisfied:** report `answers`, naming the condition and implementation.
- **Partial/wrong outcome:** raise the unmet condition at its severity and state what would satisfy it. Correct code solving the wrong problem is a failed change.
- **Only the user can judge:** after investigation and without valid confirmation, ask a 🔴 about the concrete screen/output. On a plan, the options are acceptance toward `/esq:land <plan-path>` or re-planning via `/esq:plan <brief-path>`; the final handoff still follows the gates below. Never assume the plan itself proves success.

If `## Done looks like` is absent, report that, use `## Goal`, and note that the next plan should carry the user's conditions. Without a plan, derive the goal from commit messages and code, disclose that source, and perform the same outcome assessment.

Then read the code in the repo now, not the plan's word for it. The places below are where to look, not a roster: a category with nothing that clears the bar produces no output.

**Correctness** — `TaskUpdate`: `"Correctness & edge cases"` `in_progress`.

- Logic errors: off-by-ones, wrong operators, misnamed variables, copy-paste bugs.
- Edge cases: empty, null/undefined, zero, negative, max values, malformed data.
- Concurrency: races, ordering assumptions, lock contention.
- Error handling: swallowed exceptions, errors leaking sensitive info, retries that loop forever.

**Security** — `TaskUpdate`: `"Correctness & edge cases"` `completed`, `"Security"` `in_progress`.

- Input validation: injection (SQL, command, path traversal, XSS).
- Authn/authz: access control on new endpoints, token handling, sessions.
- Secrets: hardcoded credentials, secrets in logs or commit history.
- External calls: SSRF, untrusted URL fetches.
- **The plan's `## Security notes`, if any**, is a claim about the trust boundary: read the code against it as against a **Règle métier**. A promised boundary the code doesn't enforce is a finding at its own severity.

**UX & design** (skip only if the diff renders nothing a person looks at) — `TaskUpdate`: `"Security"` `completed`, `"UX & design"` `in_progress`.

A screen that works and is unusable is a defect no test reports:

- **A state that renders nothing or crashes** — empty, loading, error, partial: `return null` while loading, an unhandled rejection, a list with no empty state.
- **An action with no feedback** — async or destructive with nothing changing on screen (double-submit, assumed failure); destructive with no confirmation and no undo is worse.
- **An error the user can't act on** — swallowed, console-only, or a raw exception; what went wrong and what to do next must be on screen.
- **Off the system** — a hardcoded color, spacing, radius or font size where the codebase has a token or component for it.
- **Unreachable** — not keyboard-operable, lost or missing focus, a control with no accessible name, illegible contrast, a touch target too small.

Taste is not a finding — "the user cannot tell what happened" is.

**Quality, conventions & maintenance** — `TaskUpdate`: `"UX & design"` `completed`, `"Quality & conventions"` `in_progress`.

One pass; empty is the normal answer. Only these clear the bar:

- Structure, naming, or coupling that will *cause* a future defect.
- A convention in CLAUDE.md / CONVENTIONS.md the change actually violates.
- A test gap where a regression in *this change's* behavior would go unnoticed.
- A break in something already relied upon: a public API, an existing caller, a deploy (schema change with no migration, config change with no notice).

**Spec conformance** (skip if `docs/SPEC.md` doesn't exist)

Each **Règle métier** in a touched feature is a claim about product behavior; read the code against it.

- A documented rule the code doesn't enforce (missing limit, absent permission check, a forbidden state transition) → a finding at its own severity, cited as `SPEC.md › <feature> › <rule>`.
- A rule the code enforces *differently* than documented → read the plan under review, its execution log and the Active `docs/DECISIONS.md` entries touching the feature first, then classify:
  - **Explicitly authorized** — the approved plan's Goal, Recommendation or a task stated before the change was built names the change, or an Active decision whose `**Fondement:**` names a basis that covers *this* change → spec staleness, cited by that ID, `→ run /esq:spec`. A `mandate` basis covers a delegated technical choice and never a change to an explicit constraint, a promised capability or a major commitment. `Statut: Active`, the entry's date and its commit's position relative to the plan's prove nothing on their own, and neither does a basis with no citation after the em dash. An entry with no `**Fondement:**` is context — never authorization, and never on its own a question. An execution-log entry, a Surprises line or a decision that records what the worker did is recorded drift, not authorization: classify it by the two cases below.
  - **Clear requirement, wrong implementation** — the rule is unambiguous and nothing recorded changes it → a technical defect, 🟢 when the fix is mechanical and 🟡 when it needs a plan, cited as `SPEC.md › <feature> › <rule>`.
  - **Missing intent or authorization** — the rule is genuinely ambiguous on a product-visible point, or two recorded intents are incompatible → 🔴 whose `Why yours:` names exactly what is missing.

  The absence of an authorizing decision alone is the second case, never a question.
- Behavior in the diff that no spec feature covers → not a defect; note spec staleness, `→ run /esq:spec`.

Do NOT edit `docs/SPEC.md` and do NOT run `/esq:spec` — that command is user-triggered only.

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## Report

`TaskUpdate`: `"Quality & conventions"` `completed`, `"Generate report"` `in_progress` (then `completed` after writing). Output findings in this exact structure — **verdict and action items first**.

Rank action items by consequence, worst first. **🟢 means a defect with a mechanical fix — not a change that is merely safe to make.** A polish item is not a small 🟢, it is nothing.

More than ~6 action items on a phase-sized diff means taste crept in: cut to what you'd hold a merge over, with no "also noted" tail and no count of what you dropped.

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
⚠  review — <slug> @ <HEAD short hash> · ship after fixing 3 · 11m · NEEDS YOU (3)

  1  <the 🔴, option-set shape above — verb first, ≤10 words; options and leaning under it>

  🟢 safe fixes (1) → /esq:fix
     <finding> — `file:line` — fix: <one line> — verify: <runnable check>
  🟡 needs planning (1) → /esq:plan
     <finding> — `file:line` — why: <one line>

  ✖ bugs        1                     `file:line` — <what's wrong> → <what happens>
  ✖ security    1                     `file:line` — <untrusted input, mishandled how>
  ⚠ spec        2 features behind     `SPEC.md › <feature> › <rule>` → /esq:spec
  ○ clean       edge cases · UX · quality — nothing that clears the bar
  ✔ strong      <one clause, omit unless genuinely remarkable>

→ Next: <computed — see below>
```

The headline's counter is the verdict itself: `ship it` · `ship after fixing <n>` · `hold for rework` · `architectural concern — <≤6 words>`.

Zone 2 is the three tiers, worst first; `NEEDS YOU (<n>)` counts every item across them. Omit empty tiers; none means `✔` and no zone 2.

Zone 3 is the six review dimensions, and **it collapses hard**: clean dimensions merge into one `○ clean` line naming them; only a dimension with findings expands, one line per finding, several indented beneath its count. Never a `None found.` line per dimension. `✔ strong` is optional, one clause, only when genuinely remarkable. A clean review is short: "Ship it." plus three lines is the expected output for a small, competent change.

Compute **→ Next** as one of, always with the concrete path (`<brief-path>` is the corrective brief you write below; `<plan-path>` the plan reviewed) so the line is copy-pasteable, e.g. `→ Next: /esq:fix docs/plans/2026-07-12-<slug>-fixes.brief.md · run /clear first`. **🔴 outranks every other tier** and routes the whole brief even when greens are present — the same precedence `/esq:converge` honors.
- 🔴 present, **plan target** → `"/clear, then run: /esq:converge <brief-path>"` — it puts each decision, applies the pick and strikes the answered 🔴, which clears the brief for landing; a `do:` run by hand leaves it standing. On a **plan-less** target → `"Run the `do:` of the option you pick on each 🔴 above, then: /esq:review <base>..HEAD"`, *after running the action you picked* — the real base and the literal `HEAD`, so the re-review contains what that action committed; never the original range, and never `/esq:fix` while a red stands. Either way, name the count (`1 decision`, `2 decisions`). Never `"answer the 🔴 items"` — the options are already written above.
- No 🔴, any 🟢 → `"/clear, then run: /esq:fix <brief-path>"`. **On a plan target only**, a second line: `"Or: /esq:converge <brief-path> — applies these and stops. One subagent."` — this brief names `/esq:review` as its finder, so that run may record coverage and end ready to land. **Never offer `/esq:converge` on a plan-less brief** — it needs a plan and refuses one; there `/esq:fix` hands back a review ending at its own last fix commit.
- No 🔴/🟢, any 🟡 → `"/clear, then run: /esq:plan <brief-path>"` — **plan target only.** On a plan-less review: `"/clear, then run: /esq:plan <describe the work>"` with the finding quoted, saying the brief holds the detail; never `/esq:fix`.
- All clear, plan target → `/clear`, then `/esq:land <plan-path>`, once "Record a clean review" below has written its field — the landing reads that coverage.
- All clear, plan-less target → nothing runs. Say the range reviewed clean and that no coverage was recorded (no plan file). **Never offer `/esq:land`** and never invent a plan file to make one: landing is plan-based.

**Bound the loop before writing that line.** The brief is written either way, but `→ Next` may not open a round this unit has run out of.

<!-- shared:corrective-bound:start -->
**Two corrective plan generations.** Run `esq brief depth <brief-path>` before offering another plan; route off `verdict`, never count suffixes. `open` changes nothing. At `exhausted`, create no third-generation plan and offer no generic abandon/re-plan escape:

- Subject to unresolved 🔴 precedence, remaining 🟢 items → `/esq:fix <brief-path>`, then `/esq:review <resolved-plan>`. A bounded safe correction, including a prospective plan/document correction, consumes no new plan generation and needs no extra budget decision. Fix revalidates safety; neither an empty brief nor a recorded backlog row promises landing.
- Remaining 🟡/🔴 items → state the concrete unresolved outcome and the authority it needs. A failed check or missing proof is a diagnosis to investigate, not permission to weaken acceptance. Where accepting named debt is a real user tradeoff, offer `/esq:fix <brief-path> --accept <B-IDs>` only for existing rows matched to those findings, explaining what will stay unfixed. That choice records `Dropped`, never `Done`; it is not authorized by depth alone. Otherwise ask the actual scope/constraint decision, without promising an executable third plan.
- Never abandon a completed plan. `esq plan abandon` applies only to an explicitly selected unfinished plan when the user has decided not to build it; it does not dispose of findings or backlog promises.

Preserve every unresolved finding in the brief. A remaining item still blocks landing until its correction or explicitly authorized disposition is recorded; a clean review and the normal landing gates remain owed.
<!-- shared:corrective-bound:end -->

At `exhausted`, the applicable route above replaces the normal `→ Next`; do not offer a corrective plan or another converge cycle beside it. `/esq:converge` is offered on a plan target's 🔴 and 🟢 branches only.

## Write the corrective brief

If there are any 🟢 or 🟡 findings, emit a corrective brief — otherwise the findings die in this chat. On "Ship it" (no 🟢/🟡), skip it, say so, and record the review below.

1. Path: `docs/plans/<YYYY-MM-DD>-<slug>-fixes.brief.md` — slug from the plan filename, today's date; if it exists, append `-2`, `-3`, … until unique. **Plan-less** (mode `range`): the slug is the range's head commit, short — `docs/plans/<YYYY-MM-DD>-<head-short>-fixes.brief.md`.
2. Write it in the format below.
3. `git add` that file only, and do not commit yet: the brief and the backlog rows are **one** tail commit, made at the end of "Out-of-scope observations → backlog".

**Source identifies what this review read.** For a plan-less brief, replace the template's plan slug with `<base>..<head>`, using both full 40-hex hashes returned by `esq review scope`. No moving refs or short hashes. `esq brief plan` returns that range with `plan: null`; the fixer keeps its base but advances the next review's upper bound to its last correction. Never anticipate that correction in this brief's Source.

```
# Fixes brief: <plan title>

Source: /esq:review on <plan-slug>, <YYYY-MM-DD>
Reviewed at: <current HEAD short hash>

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- <finding> — `file:line` — fix: <one line> — verify: <runnable check>

## 🟡 Needs a plan
Substantive — route through /esq:plan → /esq:build.
- <finding> — `file:line` — why it needs planning: <one line>

## 🔴 Needs your decision
Only the user can answer. Nothing proceeds until resolved.
- <each item in the full 🔴 shape from "How to write a 🔴" — decision, why yours, lettered options with a runnable `do:`, leaning; never a bare question.>

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
```

(Omit any tier with no items.)

## Record a clean review

**Record coverage only for a plan with no 🟢, 🟡 or 🔴 findings.** Chain `git rev-parse HEAD` into `esq plan set-reviewed <plan-path> <full commit>`. `changed: false` needs no write or commit. Otherwise stage only that plan field with the review's tail bookkeeping: `plan(reviewed): <slug> at <short hash>`, optionally ` + backlog observations from review` when rows were added.

This field records the commit reviewed; it does not stale the phase proofs. A plan-less review records none and says so explicitly.

## Out-of-scope observations → backlog

Something real **not about this change** — a latent bug in adjacent code, a follow-up — goes in `docs/BACKLOG.md`, not the brief (schema and template live in `/esq:backlog`). It must still name a failure: findings that didn't clear the bar are dropped, not filed. An in-scope bug goes in the brief.

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

- Row: `| B-NNN | <today> | <type emoji + word> | <blank> | <one-phrase summary> | review: <slug> | | | Open |` — Status `Open`, no priority (the user triages).

<!-- shared:row-header:start -->
Match the table's **actual header row** rather than the literal cell count above (canonical: `ID | Date | Type | Pri | Summary | Source | Epic | Version | Status`; an older backlog may lack `Epic`/`Version`) — one cell per existing column, or the `Status` lands in the wrong one.
<!-- shared:row-header:end -->
- Dedup against existing rows first. Create the file from the template if it's missing.
- **The tail is one commit, naming both halves:** `git add docs/BACKLOG.md && git commit -m "brief(fixes): <slug> + backlog observations from review"`, over the brief staged above and these rows together. With nothing out of scope the tail is the brief alone: `git commit -m "brief(fixes): <slug>"`. On a clean verdict there is no brief, and the tail is the recorded field — with the rows, if any — under the `plan(reviewed):` subject above.
- List what you captured (IDs + one line each) under a short "Logged to backlog" note. If nothing was out of scope, say nothing.

## Close with the next command

The `→ Next` computed under "Report" is the last line, alone, with its concrete path. In every branch that ends in a re-review, the range named must contain the action taken — never the range this review read.

## Style

Specific ("`validateUser` in `src/auth.ts:42` doesn't handle an empty `email`", not "validation could be stronger"), blunt, not rude, no diplomatic preamble. Silence is a valid review.

## Constraints

- **No subagents** — one reader carrying the whole diff catches coupling that split readers each see half of; `/esq:converge` spawns this review, never the reverse.
- No code changes, no code commits, no inline fixes — triage only; `/esq:fix` applies the 🟢.
- Reuse recorded test results. Run code only for the covering `(auto)` verification needed to investigate missing outcome proof; no general test campaign.
- Leave task-by-task plan adherence to `/esq:check`.
- Output the review in chat; the corrective brief is a condensed, actionable subset of it, not a replacement.
