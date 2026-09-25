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

You are applying corrections, not finding them. `/esq:check` and `/esq:review` did the finding and triaged every finding into three tiers; your job is to execute the safe tier with discipline and route the rest. This is the mutating half of the corrective loop.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Use `esq backlog reserve-id` for escalations and run `esq validate` before reporting.

**Resolve the brief once with `esq brief plan <brief-path>`** after preflight selects it. Keep its three fields even if this run later deletes the brief:
- `plan`: the sibling plan validated against the brief's `Source:`; this is the only source of the plan path.
- `range`: replaces `plan` only when `Source:` explicitly names the reviewed commit range.
- `finder`: `check`, `review`, or `null`.

Stop and report a refusal: missing plan, Source/filename disagreement, or ambiguous siblings. Never guess or reinterpret a failed plan lookup as a range. A brief without readable Source resolves by filename.

When `plan` is null, use "Working without a plan". Otherwise `esq plan record-verification` records only the proof described in "Record the proof you earned". The CLI owns IDs and invariants; safe-fix judgment and verification remain yours.

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
2. Read the corrective brief in full. Run `esq brief depth <brief-path>` and keep its verdict for every remaining-item handoff. **Keep what `esq brief plan` answered** — `plan`, `range` and
   `finder`. `→ Next` needs them on a route where the brief has been deleted by then, and none of the
   three is re-read.
3. Read `CLAUDE.md` at project root if present, and — **when `plan` is a path**, in this same batch —
   that plan, keeping its `## Phases` section's `(auto)` verification steps verbatim. They are what
   "Record the proof you earned" below matches an item's verification against, and they are read here
   because this batch is already going out: fetching them later would buy a round trip for bytes this
   one carries for free. A run that records nothing never looks at them again, and that costs nothing.
   **When `plan` is `null` there is no plan to read** — skip it, and see "Working without a plan".
4. Run `git status` to confirm a clean-enough working tree (warn the user if there are unrelated uncommitted changes before you start committing).
5. Fetch tools: call `ToolSearch "select:TaskCreate,TaskUpdate,TaskList,PushNotification"`. Continue without any unavailable.
6. Call `TaskList`. Set any stale `pending`/`in_progress` tasks to `completed` before creating fresh ones. Skip if unavailable.
7. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `<brief> — <N> 🟢 to apply, <M> 🟡 and <K> 🔴 escalated untouched.`
   <!-- announce:end -->

   This is the free moment to be redirected — the target is on screen before anything has been spent on it.

Before counting greens, a legacy 🟡 whose sole recorded reason is the former prohibition on plan-body edits may enter the safe pass only after every check in "Re-validate before you touch anything" succeeds. Report that narrow reclassification; an ambiguous reason, changed outcome or failed verification stays 🟡. This is the only upward reclassification allowed.

If the brief has zero 🟢 items and no explicitly authorized `--accept` disposition, apply nothing and use the depth-aware remaining-item handoff below. Do not send an exhausted brief back to `/esq:plan`.

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
3. For re-review, pair the original range's base with the **full hash of this run's last correction**: `/esq:review <base>..<last fix commit>`. The original upper bound excludes your fixes. If you committed no correction, return the original range and say the code did not move; do not invent a new bound or use someone else's commit.

A bare `/esq:review HEAD` reviews one commit, possibly bookkeeping. `<base>..HEAD` is cumulative and valid, but use your known correction hash for the normal handoff. After a user decision whose action has yet to run, use `<base>..HEAD` as described in `→ Next`.

Never create an anchor plan, record coverage, or recommend `/esq:land` or `/esq:converge` for this plan-less change. All other fix rules still apply.

## Re-validate before you touch anything

A 🟢 tag is check/review's judgment, made without editing. Before applying each green item, confirm it's actually safe:

1. Read the file and the exact lines the item points to. Confirm the described problem is really there and still present (it may already be fixed).
2. Confirm the fix is genuinely mechanical and contained — no hidden blast radius, no design decision lurking inside it.
3. Confirm a runnable verification exists or you can write one.
4. Confirm it's worth doing at all. A 🟢 must name a failure — something that breaks, for someone, under some input. An item that only makes the code tidier (a rename nobody needs, a guard for what can't happen, a comment restating the code) is **dropped, not applied**: say "dropped — polish, no failure named" and move on.

If any of 1–3 fails — the fix turns out to be substantive, ambiguous, or its blast radius is larger than the brief assumed — **downgrade it to 🟡** and do not apply it. Note the downgrade and why — escalating a borderline item beats applying a fix you're unsure of.

## Safe plan and document corrections

A 🟢 may correct a document or the prospective part of an existing plan, including a completed plan. Use the same safety/verification bar as code. Editing a plan is not itself a reason to downgrade; a changed product outcome, scope, architecture choice or weakened acceptance still is.

For a plan correction, keep the original text in memory and change only above `## Execution log`. Preserve `Branch`, `Origin`, phase identities, completion state and all historical log/proof bytes. Add a dated amendment beside the changed obligation naming the finding, old and new reference/wording, and why the same intended property is preserved. Never remove a required check, narrow its property, add a reads declaration merely to obtain reuse, or rewrite a historical PASS. Git retains the old prospective contract.

Use the corrected plan's exact `(auto)` step for the recording decision, not the preflight copy of a step you just changed. Stage → capture tree → run once → judge the full corrected criterion → commit → `record-verification`. This appends new evidence; it never transfers an old PASS to a new command or criterion. Other affected obligations remain for `gate verify --unit` to assess normally. If the plan lacks an execution entry, record nothing and report that limitation.

At exhausted depth, one attempt per 🟢 in this invocation; a failed or repeated same-cause correction becomes an unresolved item, never another automatic fix/converge cycle. Re-review checks the correction and its preserved intent.

## Apply the green items

Announce: "Applying N safe fixes from <brief> — at most one commit each, M items escalated untouched."

Call `TaskCreate` for each 🟢 item (title: `"Fix — <short description>"`, status `pending`). Note IDs. Skip silently if unavailable.

Green items are independent corrections, so this loop is **resilient, not halt-on-first-failure** (unlike `/esq:build`). For each 🟢 item, in order:

1. **Announce + start:** "Fixing: <description>". `TaskUpdate` → `in_progress`.
2. **Read first, edit second.** View the lines before changing them.
3. **Apply the fix.** Stay within CONVENTIONS.md. Make the smallest change that resolves the finding — no scope creep, no opportunistic refactors.
4. **Pick the path before you verify, never after.** A recording item stages before it runs, so this choice cannot wait for the result without buying a second execution. If the item's verification **is** one of the plan's current `(auto)` steps (use the corrected step after a prospective amendment) — the same step, not a narrower command and not a substitute — it is a **recording item**, and its order is fixed: **stage → `git write-tree` → one verification run → judge the criterion → commit the fix → record and commit the proof**, exactly as "Record the proof you earned" below spells it out. Otherwise it is an ordinary item: verify here, then stage and commit.
5. **Verify before committing — once.** Run the item's verification (or the project test command for the touched area). On a recording item that single run is step 3 of "Record the proof you earned", staged and executed there; nothing re-runs it here or below.
   - **Passes** → commit atomically. Conventional-commit format (`fix(scope): subject`, imperative, lowercase, ≤72 chars; body explains why if non-obvious). Stage only the files for this fix — on a recording item they are staged already, and the commit is the head of the chained call that section prescribes. Report: "Fixed (<short-hash>): <one line>." `TaskUpdate` → `completed`.
   - **Fails, or no verification possible** → do NOT commit. Discard this item's edits with `git restore --staged --worktree <the touched files>` — never a bare `git restore` or `git checkout --`, which restore the worktree *from the index*: a recording item staged its files before it verified, so restoring from the index leaves the red change staged for the next item's commit to carry and for the next recording item's `git write-tree` to certify. Downgrade the item to 🟡 with the reason ("verification failed: <what you saw>" or "no runnable verification"). `TaskUpdate` → `failed`. **Continue to the next item** — one failure does not stop the run.
6. If applying the fix surfaces that it's actually substantive (you find yourself making a judgment call), abandon the edit, restore the files, downgrade to 🟡, continue.

### Record the proof you earned

**You verify before every commit and, unless you record it, that result dies with the commit that staled it.** The only provenance `esq gate verify` can read is the `**Verified:**` block `/esq:build` wrote for the phase, and your fix commit moves `HEAD` past it — so the landing gate re-runs a command this shipping unit has already proved green on the exact tree it is landing. Recording what you actually proved is what stops that, and it appends evidence separately from any prospective correction.

**Only a step the plan itself writes, run verbatim, and only when its criterion was met in full.** This is the recording path the loop's step 4 selects, and it carries the item's **one** verification run — it never asks for a second. On a recording item, in this order, with the fix commit and everything after it in one chained call:

1. Stage only the files for this fix, and confirm the working tree carries nothing unstaged the command could read. If it does, record nothing: what you would be certifying is not what the commit carries.
2. `git write-tree` — that is the `tree` the proof names, taken from here and never derived from the commit.
3. Run the step's command **verbatim** — this *is* the item's verification from the loop's step 5, executed here and exactly once. Never broaden it, never substitute another, never run it again below, and never buy an extra execution just to produce a proof: if the item's verification was not that step, there is nothing to record.
4. Confront the observed result with the criterion sentence the step writes after its em dash — a `grep` proving no matches passes at exit 1, and only the step's own sentence says so. **Met in full, or record nothing.** That judgment is yours, exactly as it is `/esq:build`'s when it writes its block; the CLI matches text and git state and judges no criterion.
5. Chain the recording and its bookkeeping commit onto the item's own commit call, with **no recovery chained behind it**:

   ```
   git add <files> && git commit -m "fix(scope): …" \
     && esq plan record-verification <plan> --confirm '{"by":"<brief-slug> item <n>","at":"<the commit>","tree":"<the write-tree>","step":"<the step, verbatim>"}' \
     && git add <plan> && git commit -m "docs(plan): record the verification of <step>"
   ```

   The proof cannot ride the fix commit — the verb needs that commit's oid and its tree, and amending it would move the tree it just certified — so it is its own bookkeeping commit. That commit is invisible to the gate by construction: an append below `## Execution log` compares equal on the plan section, so recording a proof never buys an audit by itself.

**Never chain a recovery behind it — no `checkout`, no `reset`, no `clean`.** A `|| git checkout -- <plan>` tail reads as tidy and is not: reproduced in a throwaway repository with the proof staged and a hook refusing the commit, it restores the *index's* content, leaves the proof staged, and lets the whole chain exit 0. It guarantees neither a clean tree nor an honest success, which is the only thing such a tail could be for. **Distinguish the three issues by name, and report the one you are in:**

- **The fix commit, the recording and the proof commit all succeed.** The tree is clean again, the next item starts exactly as it does today, and its "stage only the files for this fix" rule never has to carry a stray plan edit. Continue normally.
- **The verb refuses, writing nothing.** It exits 1 and the plan is byte-identical — an unknown or ambiguous step, a command that will not resolve, an `at` that is not `HEAD`, a tree the commit does not carry, a phase with no entry. Nothing is staged, no proof exists, nothing is re-run, no broader command is substituted, and the landing gate runs that command exactly as it does today. Report the refusal by name and continue to the next item, provided the state still allows the loop to continue. **A refusal is final for that item** — never retry it with a different step, a wider command or a hand-written block.
- **A commit fails, a write fails unexpectedly, or a dirty tree blocks the rest.** Preserve files and index exactly as they stand and **stop**, reporting precisely which commit landed, what is staged and which path is dirty. Never claim success, and never issue a checkout, reset or clean to make the failure look like one.

**Route off the verb's exit code, never off its prose.** `refuse: true` and exit 1 is the refusal; anything else is a failure of the chain, which is the third issue above.

## Explicitly accepted findings

`--accept B-NNN,...` is a disposition of the named findings, not a request to implement their 🟡/🔴 changes. Honor it only when the invoking user or a recorded user choice explicitly accepts those exact outcomes staying unfixed. Depth, a recommendation, or a worker's own command is not authority.

Match each ID to an existing backlog row and a remaining brief item. Missing, ambiguous or unauthorized IDs stay untouched; report the precise mismatch. Keep the matched row read for the bookkeeping tail; do not buy a second ledger read. For each authorized match, call `esq backlog set-status <ID> Dropped --reason <user authority and accepted consequence> --resolution <what remains unfixed>`. Never mark accepted debt Done, alter a verification obligation, or suppress a failing check. Only a successful disposition permits removing that item from the brief in the normal bookkeeping tail. Preserve its original text in Git and its consequence in the row. Keep unrelated findings and promises open. A disposition-only run still hands back to review and can still fail the normal landing gate.

## Update the corrective brief

After the green pass, rewrite the corrective brief to reflect reality:

1. Remove the 🟢 items you successfully fixed (they're done — the commits are the record) and the ones you dropped as polish (they're closed too — the reason is in your report).
2. Keep any 🟢 items you downgraded, now listed under 🟡 with the downgrade reason.
3. Keep original 🟡 and 🔴 items unless their exact `--accept` disposition succeeded above. Do not re-escalate or recreate a disposed item.
   - Preserve the brief's header lines (`Source:`, `Reviewed at:`) verbatim — `/esq:review` uses the `Reviewed at:` stamp to scope delta re-reviews.
4. If nothing remains (all greens fixed, no ambers or reds), delete the brief instead of leaving an empty file. You already hold its `Source:` and its resolved plan path from preflight step 2 — do not go looking for either after this.
5. Stage it and hold: `git add <brief>` — or `git rm <brief>` if you deleted it — and do not commit yet. The escalation rows below are the other half of this same pass over this same brief, and `/esq:fix` owns both files at this moment, so its whole tail is **one** commit, made at the end of "Escalate to the backlog".

## Escalate to the backlog

After updating the corrective brief, write any remaining 🟡 and 🔴 items to `docs/BACKLOG.md` — the permanent ledger, which outlives a brief that gets deleted or superseded (see `/esq:backlog` for its schema).

**Map each remaining item to a backlog row:**
- 🟡 needs-plan → Type `⚠️ debt`, Status `Open` (a plan will pick it up later).
- 🔴 needs-decision → Type `⚠️ debt` (or `🐛 bug` if it's a defect), Status `Needs-decision` (nothing proceeds until the user answers).

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

**For each remaining 🟡 and 🔴 item:**

1. Check if it's already in BACKLOG.md. **Read its `| B-NNN |` table rows once here** — the rows carry every field this step and the closing step below need (ID, Status, Source, Summary); the per-item detail sections are the bulk of the file and neither step reads them. Dedup by summary against that one read, and the closing step reuses it rather than opening the file a second time.
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

A detail section is a heading and prose (`What` / `Why it matters` / `Notes`) — **no field lines**. `Date`, `Type`, `Pri`, `Source`, `Status`, `Epic` and `Version` live in the table row and nowhere else; a second copy drifts the moment someone closes the item. Same rule in every command that touches the backlog.

3. Number each row from `esq backlog reserve-id`.
4. **Commit the tail once, naming both halves:** `git add docs/BACKLOG.md && git commit -m "brief(fixes): update <slug> + escalate 🟡/🔴 items"`, over the brief staged above and these rows together. Reverting the escalation alone would restore rows for items whose brief already says they are escalated; reverting the brief alone would leave the ledger claiming items the brief still lists.

**If nothing remains** (brief deleted): create no escalation row. Stage `docs/BACKLOG.md` too when a named disposition changed it, then commit the deletion and dispositions together. Use `brief(fixes): clear <slug>` and report fixed versus accepted counts separately; accepted debt was not fixed. With no ledger change, commit only the staged brief deletion.

**If BACKLOG.md doesn't exist yet**, create it from the template in `/esq:backlog` — the header comments, the `ID | Date | Type | Pri | Summary | Source | Epic | Version | Status` table, and the `---` separator above the detail sections. The schema lives there and nowhere else. The status vocabulary is closed, so that header carries this line verbatim:

```markdown
<!-- Status: Open (actionable) | Needs-decision (blocked on user) | Planned (picked up by a plan) | Done | Dropped -->
```

## Close the backlog items you resolved

`/esq:work` routes a backlog item here whenever a corrective brief lists it as 🟢, and that routing is read-only — the item is still `Open` when you start, and no other command will ever close it. Escalating what you *didn't* fix while leaving what you *did* fix open files only the wrong half of the ledger.

Run this after the escalation step, and **only for 🟢 items you actually applied, verified, and committed** — never for one you dropped as polish, downgraded to 🟡, or couldn't verify.

1. Work from the `| B-NNN |` rows the escalation step above already read, including the ones it just appended. Read `docs/BACKLOG.md` here **only** if that step was skipped (nothing to escalate) or the file didn't exist. No file, or no `Open`/`Needs-decision` rows → skip silently. (Ignore the rows you just escalated: they are what remains, not what landed.)
2. Match each applied fix to at most one row — either the brief item cites its `B-NNN` outright, or the row's `Summary` plainly names the same defect in the same place. **Plainly** is the bar: a thematic overlap is not a match, and an unmatched fix closes nothing. One row, one fix.
3. **Close a match only when the row asks for exactly what you fixed.** Its whole outcome delivered and your verify step passed → `esq backlog set-status <B-NNN> Done --by <brief-slug> --resolution "<the fix>, in <hash>"`, every close in one `backlog: close <ids> fixed by <brief-slug>` commit. A row that covers more than this fix stays open, with one zone-3 line naming what remains — partial completion is not completion.

## Handing back a 🔴

You never choose a 🔴; an explicitly authorized `--accept` records a choice already made. For unresolved reds, you are the last agent to read both the brief and the code before the user does, so you are the one who makes sure the decision reaches them usable.

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

A brief written in that shape you relay **verbatim** — you have less context on a red than the finder that wrote it. A brief that carries a red as a bare question is the one case where you fill the shape in yourself, from the code you just re-validated, and mark the lean as yours. Completing an option set is not making the call; picking one is, and that stays the user's.

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

`→ Next`, first match wins. **Every branch names a target its command actually accepts** — `plan` when
`esq brief plan` answered one, `range` when it answered that instead:
- 🟡/🔴 remain, **exhausted plan target** → name the unresolved outcome and the actual scope/constraint or debt-acceptance decision; never recommend another corrective plan or repeat the failed fix automatically. An acceptance option names only matched existing IDs: `/esq:fix <brief-path> --accept <B-IDs>`. No landing promise.
- 🟡 remain, **open plan target** → `/clear` then `/esq:plan <brief-path>` (it picks up the updated brief and checks the backlog), then `/esq:build`.
- 🟡 remain, **plan-less target** → `/clear` then `/esq:plan <a sentence naming the work>`, with the finding quoted. There is no plan for `/esq:plan` to correct, so hand it the work rather than a brief it would resolve to nothing.
- Only 🔴 remain → `<N> decision(s) above — run the `do:` of the option you pick, then /esq:review <target>`. Never "answer the open questions": the options are already written above. `<target>` is the plan path on a plan target; on a plan-less one it is `<base>..HEAD`, written with the literal word `HEAD` and followed by *after running the action you picked* — git resolves it at review time, so the range contains whatever that action committed. Never the range you were given, which predates it.
- Nothing remains, `finder` is `review`, **plan target** → **the fixes are resolved and independent review is next, on the plan this run already resolved** — `/clear`, then `/esq:review <that plan path>`. A review's verdict is what these fixes invalidated, so a review re-establishes it: **an empty brief is not a verdict, and the unit is not clean, not covered and not ready to land because you emptied one.**
- Nothing remains, **plan-less target** → `/clear`, then `/esq:review <base>..<last fix commit>` — the base from preflight's range, paired with the full hash of the last correction this run committed, so the re-review reads the corrected result rather than the diff that produced these findings ("Working without a plan", point 3). Never a bare `/esq:review HEAD`, which is one commit and not a range; and where this run committed nothing, the original range unchanged, saying the code did not move. **Do not offer `/esq:land`**: landing is plan-based and this change is not a shipping unit.
- Nothing remains, `finder` is `check` or `null`, plan target → `/clear`, then `/esq:review <plan path>`. `/esq:check` records no coverage and neither did this run, so a review is still owed before anything lands.

**No branch ever invents its target.** If `esq brief plan` refused to name one, say which of its three refusals fired and hand back no path: **never guess a path, never fall back to the newest plan, and never let the review drop silently** — name `/esq:review` and let the user supply the target. And nothing here is spawned: `/esq:fix` recommends the next command, it never runs one.

Send a `PushNotification`: `"esq:fix — applied K/N fixes. <M escalated to plan, P need your decision>."`

## On trouble

If you hit something that isn't a per-item failure — the brief references files that no longer exist, the working tree is too dirty to commit cleanly, or the brief is malformed — STOP and report rather than guessing. Don't auto-revert work you've already committed; tell the user what's committed (`git log --oneline -5`) and let them decide.

## Constraints

- Implement 🟢 items ONLY. Explicit `--accept` records a disposition, never implements a 🟡 or 🔴, and allows no upward reclassification except the legacy writer-prohibition case in preflight.
- **no subagents** — this command is the executor of a triage someone else already did; `/esq:converge` buys agents, and it buys this one as a subagent rather than the other way round.
- Every applied fix gets its own atomic commit, verified before commit. No unverified commits — if you can't verify, escalate instead.
- Code and document corrections must be named 🟢 items; parsed ledger changes use their existing CLI writers. Prospective plan edits follow "Safe plan and document corrections"; the sole execution-log write remains `esq plan record-verification`. Historical entries and PASS records are never edited. The brief/backlog tail records verified fixes and explicitly accepted findings only; never delete a backlog row or close a partly delivered outcome as Done.
- Make the minimal change per finding. No refactors, no cleanups the brief didn't sanction, no scope creep.
- Honest reporting only. "Applied, verified" must mean you ran the verification and saw it pass. If you escalated something, say so plainly.
- Resilient run: a failed item is downgraded and the run continues; it does not abort the whole pass.
