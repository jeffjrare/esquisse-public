---
description: Reconcile the backlog with what actually shipped over a window of work — closes what the evidence settles.
name: sweep
argument-hint: "[target] [options]"
disable-model-invocation: true
model: sonnet
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

Reconcile `docs/BACKLOG.md` against completed work across one window. Close what evidence settles, ask only where user intent remains, and omit unsupported candidates from the itemized report.

No plan mode or subagents. Write **only BACKLOG.md**: dispositions, their provenance/resolution, an explicit release's Version and the sweep marker. Never reopen, reprioritize, rename, mint IDs or edit code/plans/briefs/logs/roadmap. A narrowly defined status-vocabulary repair below is the only exception to closure-only behavior.

## Start and CLI

Before the first tool call, announce and continue in the same response:

> `/esq:sweep — reconciling the backlog with what shipped. Bound: no subagents, at most one question, one file written.`

Stop at the bound and report anything not covered.

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Every Status change uses `esq backlog set-status <B-NNN> <canonical status>`. The CLI owns the cell, not the judgment that closes it. Run `esq validate` after edits and before the final report; surface remaining findings without claiming a clean ledger.

Retain each needed read; load only candidate detail, never the entire detail tail. Batch independent read-only calls, chain ordered writes with `&&`, and serialize same-file writes and all Git mutations.

## 1. Inputs and window

Read the backlog header and table **by column names**, not fixed positions. Missing file → stop: No docs/BACKLOG.md — nothing to reconcile.

Arguments:
- Empty → choose the first resolvable default below.
- `dry` → same analysis, **no writes, commits, marker or question**.
- Git ref/tag or `<ref>..<ref>` → explicit window; a single ref means ref..HEAD. Report an unresolvable explicit ref rather than silently substituting a default.
- Explicit release tag such as v0.0.87 or 1.4.0 → tag..HEAD, and set Version to that tag on items closed in this run. Do not guess a release from unrelated evidence.

Default window, first that resolves:
1. `<!-- last-sweep: <hash> YYYY-MM-DD -->` → hash..HEAD.
2. Earliest `plan: <slug>` commit among plans still cited by Planned rows → that commit..HEAD.
3. `git describe --tags --abbrev=0` → tag..HEAD.
4. Last **100 commits**; explicitly call this a fallback.

Retain the resolved window endpoint before making bookkeeping commits. Check Git status; a dirty tree is allowed, but announce once that uncommitted work is not evidence. Preserve existing user edits, including in BACKLOG.md; never stage them as sweep bookkeeping.

Announce `Window: <range> (from <resolution method>).` Include both again in the final report, even when nothing closes.

Read the window's commit list **once**, retaining hashes, subjects and bodies (for example `git log --format='%h %s%n%b' <window>`). Match IDs locally instead of one log --grep per item. Further diffs are read only to settle a surviving candidate.

## 2. Candidates and vocabulary

Candidates are Open, Planned and Needs-decision. Done/Dropped stay closed and are not revisited.

Inspect noncanonical Status values:
- Resolved, Fixed, Closed, Complete, Completed → Done; Wontfix, Won't-fix, Rejected → Dropped, **only with corroboration that the item was already closed**: a Resolution line, closure provenance in Source or summary explicitly saying it was resolved. Read that item's detail only if needed for this evidence.
- A synonym without corroboration, or any other value → an ambiguous status question quoting it verbatim. Never invent a sixth state or silently ignore it.

Report every vocabulary defect in a compact Ledger defects block. Settled normalization belongs in the settled commit; it is not a new delivery claim. An empty candidate set still processes vocabulary defects and the normal non-dry marker; report no open items to reconcile.

## 3. Evidence, cheapest first

For each candidate, stop gathering when the evidence settles it; group plan-linked candidates so each plan is read once. Before any signal can settle a closure, read that candidate's summary and detail section once, including explicit post-plan completion conditions, and compare them with the evidence. A commit citation or completed plan does not bypass this read. Conditions stay in the existing detail prose; no new field or executable gate is required.

1. **ID citation:** a commit subject/body names the ID and its actual change resolves the item. Exclude subjects beginning `plan:`, `plan(`, `brief`, `backlog:`, `decisions:`, `epic:`, `roadmap:`, `spec:`, `merge:`, `docs(claude):`, `docs(arch):`. A metadata close is not implementation evidence; a code citation is the strongest linkage, not automatic proof of completeness.
2. **Plan:** Source's ` · Planned by <slug>` identifies the plan. Read its phases/log once, using `esq next-phase <plan>` for current classification. It shipped only if every declared phase has a completed entry. A paused `⏸`, missing entry or phase-less/unreadable plan does not prove completion. No separate manual-confirmation check: an unconfirmed manual gate leaves the phase paused.
3. **Corrective brief:** establish that this item was a 🟢 in the relevant fixes brief, is now removed, and has a corresponding fix(...) commit in the window. Reuse known paths/history; mere absence of a brief or an unrelated fix commit proves nothing. Still listed → not applied by that signal.
4. **File overlap:** only now inspect matching changes for the file/module/screen named in an unresolved candidate's detail, reading that detail if not already retained. Overlap alone never settles it.
5. **Direct end state:** only for a remaining candidate whose requested state is unambiguous and checkable with **one command against the committed tree**: removed file, removed dependency, absent symbol. If the exact requested state holds, it can settle the item without an ID citation or causal commit. Working-tree/untracked state is insufficient; a passing test proves this run, not necessarily the promised outcome. If interpretation remains, classify accordingly.

## 4. Classify

**Settled:** an unambiguous work link and proof of the **whole** outcome, or the exact committed end state from signal 5. Examples: one cited defect plainly fixed; a completed plan covering the entire row; the linked corrective fix. Close without asking. A doubtful case never becomes settled merely because the unit/plan is complete.

An explicitly unmet completion condition or missing proof leaves the row open, even on a complete plan. Classify it as untouched unless a specific unrecorded user judgment really remains; do not ask permission to call an unmet outcome delivered, rerun completed phases, or launch an optional measurement merely to close the row. Reuse the recorded evidence and any revisit condition.

**Ambiguous:** evidence plus a specific remaining user judgment:
- completed plan covers only part of the summary;
- changes touch the area without an ID citation and leave a real scope question;
- Needs-decision appears answered by the work, but that answer belongs to the user;
- the phase covering this Planned item is paused;
- evidence supports competing interpretations;
- a noncanonical status lacks a settled mapping.

Name the evidence and the **specific doubt**, not a generic confirm. Research technical uncertainty yourself within the read budget; don't ask the user to choose a cause.

**Untouched:** no evidence, still mid-flight without an item-specific paused question, or investigation produced no defensible closure/intent question. Count only, never enumerate candidates just for rejection. Mid-flight plan items may appear in the dedicated left-open block for their build handoff.

## 5. Commit settled work before asking

In non-dry mode, write proved closures and corroborated vocabulary repairs first. Use canonical case:

`esq backlog set-status <id> Done --by "<plan-or-fix-slug>"`

For a bare commit use `--by "sweep <short-hash>"`; for direct end-state evidence cite the committed endpoint and the check. The CLI appends ` · Done by …` without duplicating the same marker. Normalize a proved prior rejection with Dropped, never with a fabricated delivery.

For an existing detail section, include `--resolution "<one sentence naming what shipped and its evidence>"`. Structured fields live only in the table. Strip legacy Date/Type/Pri/Rank/Source/Epic/Version/Status field lines from touched details, preserving unique information in Notes/Resolution, and mention cleanup. Never change ID or capture Date.

On an explicit release-tag run, set Version on newly closed rows, by header. Add a missing Version column and pad every row before writing it. No hand-written Status and no invented release value.

Chain same-file CLI writes, then commit all settled changes together:
`backlog: sweep closes B-003 B-005 B-009 (<window>)` (compress contiguous runs). Stage only this command's changes. **Do this before the question**, so an abandoned interaction retains every already-proved closure.

- No ambiguity → include the marker below in this same commit, or make the marker-only commit if there were no other changes.
- Ambiguity → leave the marker for the final answer transaction; the examined range is not claimed while its question remains unanswered.
- Dry → report what would close/normalize and what remains ambiguous; skip this whole write/question procedure.

### One question, only for genuine ambiguity

After the settled commit, ask in the project's working language, **plain text rather than AskUserQuestion**; the list may exceed that tool's option limit. One numbered line per item: ID, evidence, specific doubt.

Ask for numbers, all or none for closure candidates. A vocabulary defect requires the **canonical status explicitly named**; do not interpret all as Done for a row asking which status was intended. Keep both kinds in this one exchange, with the distinction clear.

Apply selected closures and explicit vocabulary answers under the same write rules, in **one further commit**, including the marker. None closes nothing; only the marker still advances. Never ask about settled or untouched items, never manufacture a question when the ambiguous tier is empty.

## 6. Marker and report

At completion, set/replace `<!-- last-sweep: <short-hash> YYYY-MM-DD -->` in the header using the **examined endpoint retained before bookkeeping**, not a newer unexamined HEAD. Include it in the last authorized commit above. With nothing else to commit: `backlog: sweep marker (<window>, nothing to close)`.

The marker advances even on an empty completed sweep or after declined candidates, so those facts are not bought again. It never advances on dry or while awaiting the question. Do not amend a settled commit after the user has already received it just to add the marker.

<!-- conclusion:start -->
Three zones, no preamble or closing observations, in the project's working language **including labels**:

1. **Headline:** `<glyph> sweep — <window> · <commits> · <closed> · <untouched> · <measured elapsed> · NEEDS YOU (<n>)`. ✔ completed without a user gate; ⚠ unanswered ambiguity; ✖ unable to perform the pass. Omit NEEDS YOU when empty. After applying the answer, don't repeat the question.
2. **User needs:** only the unanswered numbered judgment list, evidence and specific doubt; never a task this run can settle. Omit when empty.
3. **Ledger diff:** ✔ closed/confirmed with evidence; ○ left open; Ledger defects with before/after or unresolved value; ○ untouched as a count; ○ window with its resolution method. Collapse empty categories, but always retain the window and its origin. Dry labels say would close, never closed.
<!-- conclusion:end -->

Left open has only two itemized sources: candidates the user declined, and items on mid-flight plans. Other insufficient evidence belongs only in the untouched count. Report actual validation findings and commits; do not claim clean on a remaining defect.

End with one `→ Next`:
- Mid-flight plan work → `/esq:build <that plan>`.
- Otherwise remaining Open items → `/esq:work`.
- Backlog clear → say so.
- Still awaiting the question → answer the numbered judgments.

Show the undo form `/esq:backlog B-N reopen` beside recorded closures. A genuine uncaptured out-of-scope observation may earn only one capture command under Next; never mint its ID here or repeat an already-tracked item. No extra analysis blocks.
