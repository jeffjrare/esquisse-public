---
description: Apply the safe corrections from a fixes brief — commit and verify the green items, escalate the rest.
name: fix
argument-hint: "[target] [--accept B-NNN,...]"
model: opus
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

**No mandate, no run.** Model invocation of this skill is legitimate only when a user-invoked orchestrator explicitly delegated this run and its target appears in the invoking turn. Invoked without that explicit target — or off a description match, on your own initiative — do not guess: stop and print the exact invocation for the user to run.

You apply corrections, not find them: `/esq:check` and `/esq:review` triaged findings into three tiers; execute the safe tier and route the rest.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Use `esq backlog reserve-id` for escalations and run `esq validate` before reporting.

**Resolve the brief once with `esq brief plan <brief-path>`** after preflight selects it, and keep its three fields — none is re-read, even after this run deletes the brief:
- `plan`: the sibling plan validated against the brief's `Source:`; the only source of the plan path.
- `range`: replaces `plan` only when `Source:` explicitly names the reviewed commit range.
- `finder`: `check`, `review`, or `null`.

Stop and report a refusal: missing plan, Source/filename disagreement, or ambiguous siblings. Never guess or reinterpret a failed plan lookup as a range. When `plan` is null, use "Working without a plan".

Do NOT use plan mode. You write code.

## The three tiers (set by check/review)

- 🟢 **Fix now (safe)** — mechanical, contained, one clearly-correct fix, with a runnable verification. **These are yours to apply.**
- 🟡 **Needs a plan** — substantive: own tradeoffs, multi-file, or a design choice. **Not yours.** Leave for `/esq:plan` → `/esq:build`.
- 🔴 **Needs your decision** — only the user can resolve. **Not yours.** Surface and stop on these.

## Announce, before anything

<!-- announce-open:start -->
Print this line first, before any tool call, then continue with the first call in the same response:

> `/esq:fix — applying the brief's safe fixes. Bound: no subagents, at most one commit per 🟢 item.`

Stop at the bound and report what remains uncovered. Announce the resolved target after preflight.
<!-- announce-open:end -->

## Preflight

1. Determine the corrective brief:
   - If the user provided a path, use it.
   - Else, use the most recently modified `*-fixes.brief.md` in `docs/plans/`.
   - If none exists, STOP. Tell the user: "No fixes brief found. Run `/esq:check` or `/esq:review` first — they produce the corrective brief I act on." (If the user instead described fixes inline, triage those into the three tiers yourself and treat the 🟢 set as the work — but the brief is the normal path.)
2. Read the corrective brief in full. Run `esq brief depth <brief-path>` and keep its verdict for every remaining-item handoff, with what `esq brief plan` answered.
3. Read `CLAUDE.md` at project root if present, and — **when `plan` is a path**, in this same batch —
   that plan, keeping its `## Phases` section's `(auto)` verification steps verbatim for "Record the
   proof you earned". When `plan` is `null`, read no plan.
4. Run `git status`; warn the user of unrelated uncommitted changes before you start committing.
5. Fetch tools: call `ToolSearch "select:TaskCreate,TaskUpdate,TaskList,PushNotification"`. Continue without any unavailable.
6. Call `TaskList`. Set any stale `pending`/`in_progress` tasks to `completed` before creating fresh ones. Skip if unavailable.
7. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `<brief> — <N> 🟢 to apply, <M> 🟡 and <K> 🔴 escalated untouched.`
   <!-- announce:end -->

Before counting greens, a legacy 🟡 whose sole recorded reason is the former prohibition on plan-body edits may enter the safe pass only after every check in "Re-validate before you touch anything" succeeds; report it. An ambiguous reason, changed outcome or failed verification stays 🟡. This is the only upward reclassification allowed.

Zero 🟢 items and no authorized `--accept` disposition → apply nothing and use the depth-aware handoff below. Never send an exhausted brief back to `/esq:plan`.

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

## Working without a plan

When `esq brief plan` returns `plan: null` with a range:

1. Read no plan and skip "Record the proof you earned". Every item is ordinary: verify, stage, commit. Never call `esq plan record-verification` without a plan.
2. Verify each item using its brief's verification or the project check covering the changed file. Downgrade an unverifiable green to 🟡.
3. For re-review, pair the original range's base with the **full hash of this run's last correction**: `/esq:review <base>..<last fix commit>` — never a bare `/esq:review HEAD` (one commit). If you committed no correction, return the original range and say the code did not move; never invent a bound or use someone else's commit. After a user decision whose action has yet to run, use `<base>..HEAD` as `→ Next` says.

Never create an anchor plan, record coverage, or recommend `/esq:land` or `/esq:converge` for this plan-less change. All other fix rules still apply.

## Re-validate before you touch anything

Before applying each green item, confirm:

1. The problem is really at the lines the item points to, and still present.
2. The fix is genuinely mechanical and contained — no hidden blast radius, no design decision inside it.
3. A runnable verification exists or you can write one.
4. It names a failure — something that breaks, for someone, under some input. Pure tidying (an unneeded rename, a guard for the impossible, a comment restating code) is **dropped, not applied**: "dropped — polish, no failure named".

If any of 1–3 fails, **downgrade it to 🟡**, do not apply it, and note why.

## Safe plan and document corrections

A 🟢 may correct a document or the prospective part of an existing plan, including a completed plan. Use the same safety/verification bar as code. Editing a plan is not itself a reason to downgrade; a changed product outcome, scope, architecture choice or weakened acceptance still is.

For a plan correction, keep the original text in memory and change only above `## Execution log`. Preserve `Branch`, `Origin`, phase identities, completion state and all historical log/proof bytes. Add a dated amendment beside the changed obligation naming the finding, old and new reference/wording, and why the same intended property is preserved. Never remove a required check, narrow its property, add a reads declaration merely to obtain reuse, or rewrite a historical PASS. Git retains the old prospective contract.

Use the corrected plan's exact `(auto)` step for the recording decision, not the preflight copy, following "Record the proof you earned". New evidence is appended; an old PASS never transfers to a new command or criterion. Other affected obligations remain for `gate verify --unit`. If the plan lacks an execution entry, record nothing and report that limitation.

At exhausted depth, one attempt per 🟢 in this invocation; a failed or repeated same-cause correction becomes an unresolved item, never another automatic fix/converge cycle. Re-review checks the correction and its preserved intent.

## Apply the green items

Announce: "Applying N safe fixes from <brief> — at most one commit each, M items escalated untouched."

Call `TaskCreate` for each 🟢 item (title: `"Fix — <short description>"`, status `pending`). Note IDs. Skip silently if unavailable.

This loop is **resilient, not halt-on-first-failure**. For each 🟢 item, in order:

1. **Announce + start:** "Fixing: <description>". `TaskUpdate` → `in_progress`.
2. **Read first, edit second.** View the lines before changing them.
3. **Apply the fix.** Stay within CONVENTIONS.md. The smallest change that resolves the finding — no scope creep, no opportunistic refactors.
4. **Pick the path before you verify, never after.** If the item's verification **is** one of the plan's current `(auto)` steps (the corrected step after a prospective amendment) — the same step, not a narrower command or a substitute — it is a **recording item**, with a fixed order: **stage → `git write-tree` → one verification run → judge the criterion → commit the fix → record and commit the proof**, per "Record the proof you earned". Otherwise it is ordinary: verify, then stage and commit.
5. **Verify before committing — once.** Run the item's verification (or the project test command for the touched area). On a recording item that single run is step 3 of "Record the proof you earned"; nothing re-runs it.
   - **Passes** → commit atomically: `fix(scope): subject`, imperative, lowercase, ≤72 chars; body explains why if non-obvious. Stage only this fix's files (a recording item's are staged already; its commit heads that section's chained call). Report: "Fixed (<short-hash>): <one line>." `TaskUpdate` → `completed`.
   - **Fails, or no verification possible** → do NOT commit. Discard with `git restore --staged --worktree <the touched files>` — never a bare `git restore` or `git checkout --`, which restore from the index and leave a staged red change for the next commit or `git write-tree`. Downgrade to 🟡 with the reason ("verification failed: <what you saw>" or "no runnable verification"). `TaskUpdate` → `failed`. **Continue to the next item.**
6. If the fix turns out substantive (you are making a judgment call), abandon the edit, restore the files, downgrade to 🟡, continue.

### Record the proof you earned

Recording spares the landing gate a re-run of a command already proved green on this tree. **Only a step the plan itself writes, run verbatim, and only when its criterion was met in full.** It carries the item's **one** verification run — never a second. On a recording item, in this order, with the fix commit and everything after it in one chained call:

1. Stage only the files for this fix, and confirm the working tree carries nothing unstaged the command could read. If it does, record nothing.
2. `git write-tree` — the `tree` the proof names, taken here, never derived from the commit.
3. Run the step's command **verbatim**, exactly once — this *is* the item's verification. Never broaden it, substitute another, run it again, or buy an extra execution to produce a proof: if the item's verification was not that step, there is nothing to record.
4. Confront the result with the criterion sentence after the step's em dash (a `grep` proving no matches passes at exit 1 only when that sentence says so). **Met in full, or record nothing.** That judgment is yours; the CLI judges no criterion.
5. Chain the recording and its bookkeeping commit onto the item's own commit call, with **no recovery chained behind it**:

   ```
   git add <files> && git commit -m "fix(scope): …" \
     && esq plan record-verification <plan> --confirm '{"by":"<brief-slug> item <n>","at":"<the commit>","tree":"<the write-tree>","step":"<the step, verbatim>"}' \
     && git add <plan> && git commit -m "docs(plan): record the verification of <step>"
   ```

   The proof is its own bookkeeping commit — never amended into the fix commit, whose oid and tree it names.

**Never chain a recovery behind it — no `checkout`, no `reset`, no `clean`** (a `|| git checkout -- <plan>` tail leaves the proof staged and exits 0). **Report which of three issues you are in:**

- **The fix commit, the recording and the proof commit all succeed.** The tree is clean; continue normally.
- **The verb refuses, writing nothing** (exit 1, plan byte-identical: unknown or ambiguous step, unresolvable command, `at` not `HEAD`, tree not carried, phase with no entry). Nothing is re-run and no broader command substituted. Report the refusal by name and continue if the state allows. **A refusal is final for that item** — never retry with a different step, a wider command or a hand-written block.
- **A commit fails, a write fails unexpectedly, or a dirty tree blocks the rest.** Preserve files and index exactly and **stop**, reporting which commit landed, what is staged and which path is dirty. Never claim success, and never checkout, reset or clean to disguise it.

**Route off the verb's exit code, never off its prose.** `refuse: true` and exit 1 is the refusal; anything else is a failure of the chain, which is the third issue above.

## Explicitly accepted findings

`--accept B-NNN,...` is a disposition of the named findings, not a request to implement their 🟡/🔴 changes. Honor it only when the invoking user or a recorded user choice explicitly accepts those exact outcomes staying unfixed. Depth, a recommendation, or a worker's own command is not authority.

Match each ID to an existing backlog row and a remaining brief item. Missing, ambiguous or unauthorized IDs stay untouched; report the precise mismatch. Keep the matched rows read for the bookkeeping tail — no second ledger read. For each authorized match, call `esq backlog set-status <ID> Dropped --reason <user authority and accepted consequence> --resolution <what remains unfixed>`. Never mark accepted debt Done, alter a verification obligation, or suppress a failing check. Only a successful disposition removes that item from the brief. Keep unrelated findings open. A disposition-only run still hands back to review.

## Update the corrective brief

After the green pass, rewrite the corrective brief to reflect reality:

1. Remove the 🟢 items you fixed and the ones dropped as polish.
2. Keep any 🟢 items you downgraded, now listed under 🟡 with the downgrade reason.
3. Keep original 🟡 and 🔴 items unless their exact `--accept` disposition succeeded. Never re-escalate or recreate a disposed item.
   - Preserve the brief's header lines (`Source:`, `Reviewed at:`) verbatim — `/esq:review` scopes delta re-reviews by `Reviewed at:`.
4. If nothing remains, delete the brief rather than leave an empty file (its `Source:` and plan are already held from preflight).
5. Stage and hold: `git add <brief>` — or `git rm <brief>` — and do not commit yet: the whole tail is **one** commit, made at the end of "Escalate to the backlog".

## Escalate to the backlog

Then write any remaining 🟡 and 🔴 items to `docs/BACKLOG.md` (schema: `/esq:backlog`):
- 🟡 needs-plan → Type `⚠️ debt`, Status `Open`.
- 🔴 needs-decision → Type `⚠️ debt` (or `🐛 bug` if it's a defect), Status `Needs-decision`.

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

**For each remaining 🟡 and 🔴 item:**

1. **Read BACKLOG.md's `| B-NNN |` table rows once here** (never the detail sections) and dedup by summary; the closing step reuses this read.
2. If not present, add it:
   - A row in the table: `| B-NNN | YYYY-MM-DD | ⚠️ debt | <pri or blank> | <one-phrase summary> | fix: <brief-slug> | | | Open/Needs-decision |`.

     <!-- shared:row-header:start -->
     Match the table's **actual header row** rather than the literal cell count above (canonical: `ID | Date | Type | Pri | Summary | Source | Epic | Version | Status`; an older backlog may lack `Epic`/`Version`) — one cell per existing column, or the `Status` lands in the wrong one.
     <!-- shared:row-header:end -->
   - A full detail entry below the `---` separator:

```markdown
## B-NNN — <summary>

**What:** What the deferred item is — 1-2 sentences.
**Why it matters:** What degrades or breaks if this stays unaddressed.
**Notes:** Why it wasn't fixed in this pass.
```

A detail section is heading and prose only — **no field lines**; `Date`, `Type`, `Pri`, `Source`, `Status`, `Epic` and `Version` live in the table row alone.

3. Number each row from `esq backlog reserve-id`.
4. **Commit the tail once:** `git add docs/BACKLOG.md && git commit -m "brief(fixes): update <slug> + escalate 🟡/🔴 items"`, over the staged brief and these rows together.

**If nothing remains** (brief deleted): create no escalation row. Stage `docs/BACKLOG.md` too when a named disposition changed it, then commit the deletion and dispositions together. Use `brief(fixes): clear <slug>` and report fixed versus accepted counts separately; accepted debt was not fixed. With no ledger change, commit only the staged brief deletion.

**If BACKLOG.md doesn't exist yet**, create it from the `/esq:backlog` template — header comments, the `ID | Date | Type | Pri | Summary | Source | Epic | Version | Status` table, the `---` separator — with this line verbatim:

```markdown
<!-- Status: Open (actionable) | Needs-decision (blocked on user) | Planned (picked up by a plan) | Done | Dropped -->
```

## Close the backlog items you resolved

No other command closes a row a 🟢 fixed. Run this after escalation, **only for 🟢 items you actually applied, verified, and committed** — never one dropped, downgraded or unverified.

1. Work from the rows the escalation step already read; read `docs/BACKLOG.md` **only** if that step was skipped or the file didn't exist. No file, or no `Open`/`Needs-decision` rows → skip silently. Ignore the rows you just escalated.
2. Match each applied fix to at most one row — the brief item cites its `B-NNN`, or the row's `Summary` plainly names the same defect in the same place. A thematic overlap is not a match; an unmatched fix closes nothing.
3. **Close a match only when the row asks for exactly what you fixed.** Its whole outcome delivered and your verify step passed → `esq backlog set-status <B-NNN> Done --by <brief-slug> --resolution "<the fix>, in <hash>"`, every close in one `backlog: close <ids> fixed by <brief-slug>` commit. A row that covers more than this fix stays open, with one zone-3 line naming what remains — partial completion is not completion.

## Handing back a 🔴

You never choose a 🔴; an authorized `--accept` records a choice already made. For unresolved reds, make sure the decision reaches the user usable.

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

A red already in that shape you relay **verbatim**. A red carried as a bare question is the one case where you fill the shape yourself, from the code, and mark the lean as yours — never picking an option.

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## On success

```
⚠  fix — <slug> · 4 of 6 applied · 4 commits · 7m · NEEDS YOU (1)

  1  <the 🔴, shape from "Handing back a 🔴" — verb first, ≤10 words; options and leaning under it>

  ✔ fixed       4 items               abc1234, def5678, 9012abc, 3456def
     <one line per item, with its hash>
  ✔ closed      B-27                  fixed in abc1234
  ○ still open  B-31                  covers the export too — only the import was fixed
  ⚠ escalated   1 → 🟡                <why it needs a plan> — in the brief and BACKLOG.md as ⚠️ debt
  ○ downgraded  1                     <the 🟢 you could not safely apply, and why>
  ○ dropped     2 as polish           <one clause each — named no failure, closed not filed>
  ○ repo        <git log --oneline -4>

→ Next: <one branch — see below>
```

Every zone-3 line but `fixed` and `repo` disappears when it has nothing; none of them ever reads `None.`

`→ Next`, first match wins. **Every branch names a target its command accepts** — `plan` when
`esq brief plan` answered one, `range` otherwise:
- 🟡/🔴 remain, **exhausted plan target** → name the unresolved outcome and the actual scope/constraint or debt-acceptance decision; never recommend another corrective plan or repeat the failed fix automatically. An acceptance option names only matched existing IDs: `/esq:fix <brief-path> --accept <B-IDs>`. No landing promise.
- 🟡 remain, **open plan target** → `/clear` then `/esq:plan <brief-path>`, then `/esq:build`.
- 🟡 remain, **plan-less target** → `/clear` then `/esq:plan <a sentence naming the work>`, with the finding quoted — never the brief.
- Only 🔴 remain → `<N> decision(s) above — run the `do:` of the option you pick, then /esq:review <target>`. Never "answer the open questions". `<target>` is the plan path on a plan target; on a plan-less one `<base>..HEAD`, with the literal word `HEAD` and followed by *after running the action you picked* — never the range you were given.
- Nothing remains, `finder` is `review`, **plan target** → `/clear`, then `/esq:review <that plan path>`. **An empty brief is not a verdict: the unit is not clean, covered or ready to land because you emptied one.**
- Nothing remains, **plan-less target** → `/clear`, then `/esq:review <base>..<last fix commit>` per "Working without a plan", point 3 (never a bare `HEAD`; the original range, code unmoved, if nothing was committed). **Do not offer `/esq:land`**: this change is not a shipping unit.
- Nothing remains, `finder` is `check` or `null`, plan target → `/clear`, then `/esq:review <plan path>` — a review is still owed before anything lands.

**No branch ever invents its target.** If `esq brief plan` refused, say which of its three refusals fired and hand back no path: **never guess a path, never fall back to the newest plan, never let the review drop silently** — name `/esq:review` and let the user supply the target. Nothing here is spawned: `/esq:fix` recommends the next command, never runs it.

Send a `PushNotification`: `"esq:fix — applied K/N fixes. <M escalated to plan, P need your decision>."`

## On trouble

A non-per-item failure — the brief references files that no longer exist, the tree is too dirty to commit cleanly, or the brief is malformed — STOP and report rather than guess. Never auto-revert committed work; show `git log --oneline -5` and let the user decide.

## Constraints

- Implement 🟢 items ONLY. `--accept` records a disposition, never implements a 🟡 or 🔴.
- **No subagents.**
- No unverified commits — if you can't verify, escalate instead.
- Code and document corrections must be named 🟢 items; parsed ledger changes use their CLI writers. The sole execution-log write is `esq plan record-verification`; historical entries and PASS records are never edited. The brief/backlog tail records verified fixes and explicitly accepted findings only; never delete a backlog row or close a partly delivered outcome as Done.
- Honest reporting only: "applied, verified" means you ran the verification and saw it pass.
