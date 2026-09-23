---
description: Spin up an isolated git worktree with a reserved backlog ID block, so two esq sessions run in parallel.
name: worktree
argument-hint: "[target] [options]"
disable-model-invocation: true
model: sonnet
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

Manage isolated Git worktrees, each with its own files, index, branch and ledgers. No plan mode or subagents. Run the authorized Git operations yourself; creating a second interactive Claude terminal remains the user's step. This session never changes directory.

## CLI, input and context

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

| Arguments | Mode |
|---|---|
| Empty, ls, list | List |
| merge <name> [into <dest>] | Merge the named branch; destination defaults to this session's checked-out branch |
| rm/remove <name> [--force] | Remove |
| <name> [<base-ref>] | Create |

Validate names as Git branch names; create/remove names must also identify a path within the sibling worktree directory, never escape it or target the main checkout. Reject invalid names with a simple example such as featB or bugfix-login. Quote paths/refs safely; names and ledger values are data, never shell code.

1. `git rev-parse --show-toplevel`; failure → Not inside a git repository.
2. Retain `git worktree list --porcelain` to distinguish the main checkout from linked trees. The current root is not necessarily the main checkout.
3. `WT_BASE = <parent-of-main-root>/<main-repo-name>.worktrees`; keep parallel trees outside the main working tree.
4. Create/remove need the default branch: origin/HEAD via `git symbolic-ref --quiet --short refs/remotes/origin/HEAD` (strip origin/), else existing main, else master, else current branch. List needs none; merge uses its explicit/current destination.

Announce scope/bound before a long merge: one branch, ledger reconciliation only, no subagents. Retain reads and batch independent readers. Chain dependent writes with `&&`; serialize all Git mutations and same-file writes. Never issue them side by side.

## Create

1. Default base-ref to the default branch; require `git rev-parse --verify --quiet "<base-ref>^{commit}"` to resolve.
2. Resolve `<WT_BASE>/<name>`; existing path → stop.
3. Existing branch (`git show-ref --quiet --verify refs/heads/<name>`) → `git worktree add "<path>" "<name>"`; report reuse. Otherwise `git worktree add -b "<name>" "<path>" "<base-ref>"`. Surface Git's refusal if already checked out elsewhere.
4. After creation, call `esq backlog reserve-block "<path>"` once. The allocator chooses the lowest free block under the shared lock and excludes its .esq-id-block marker from Git. Main keeps 1–999 without a marker; linked block k spans k*1000 through k*1000+999. Report returned low/high, never calculate/reserve a block yourself.
5. Allocation failure leaves the worktree in place: report that reservation did not complete and name the same reserve-block command to finish it. No manual IDs or borrowed main block. A later reserve-id/add can attempt the same locked reservation automatically; allocation cannot proceed if that reservation fails.

Make this the prominent payload:

```
✔ Worktree ready — branch <name>, from <base-ref>
  ID block: B-<low>…B-<high>

Launch session 2 — paste into a NEW terminal:
    cd "<path>" && claude

When done, from the main session:
    /esq:worktree rm <name>
```

Give one reminder: disjoint blocks preserve IDs through textual ledger conflicts; keep both sides' distinct new rows. Never launch a terminal or cd into the new tree yourself. If reservation failed, the headline must not imply the tree is fully ready.

## List

Present the retained worktree listing with paths/branches, identifying main and sibling worktrees. Main alone → no parallel worktrees. No default-branch lookup or writes.

## Remove

1. Require an exact registered `worktree <path>` for `<WT_BASE>/<name>`. Never remove the main checkout.
2. Run `git worktree remove "<path>"`, adding `--force` **only if the user supplied it**. Dirty refusal → stop; offer committing first or explicitly requesting force. Never discard uncommitted work on your own.
3. Confirm removal. If branch name exists and `git merge-base --is-ancestor <name> <default-branch>` proves it merged, run `git branch -d <name>` and report the result. If deletion refuses, retain the branch and say why; never substitute -D.
4. An unmerged branch stays: report that its commits remain on that branch. The user may explicitly decide on `git branch -D <name>` later; this invocation does not run it.

## Merge

Use only `esq merge begin/scan/seal/abort`. Never run Git's merge machinery, stage a merge or commit it yourself. Reconcile only `docs/BACKLOG.md` and `docs/DECISIONS.md`; never resolve other files or regenerate arch/spec. A shared ID at the fork is one item edited twice; an ID absent there and minted on both sides is a collision. **Never change a B- or D- ID.**

### 1. Begin

Run `esq merge begin <name> [--into <dest>]` without duplicating its prechecks. It holds the merge uncommitted; an explicit destination may change the checked-out branch, never this session's directory.

Refusals exit 1 with refuse/verdict/reason and make no new merge:
- dirty → commit/stash first;
- absent → named source/destination missing;
- self → run from the intended destination;
- up-to-date → no-op, not failure;
- merge-in-progress → finish or abort the existing merge;
- refused → relay Git's reason, including a destination checked out elsewhere.

Held result supplies destination, switched, mergeBase, clean and:
- `conflicts.ledger[]` and `conflicts.other[]`;
- `conflicts.rows[]`: file/id/cells; each cell has column, ours, theirs, base and verdict. Derived carries value/rule; ask carries the unresolved reason.

Use those three-way values, not re-parsed markers, to decide cells. One-sided rows and equal cells need no reconciliation; the ID is the key, never an editable cell.

### 2. Scan before resolving

Run `esq merge scan`, even if Git reported a clean merge. It reads rows and detail headings in both ledgers, derives the base from MERGE_HEAD and returns:
- `duplicates[]`: file, kind (row/section), id, count, classification;
- `rows[]`: current three-way cell report;
- clean, verdict, refuse and reason.

Classify **before changing hunks**: resolving a collision into one row would hide the evidence the scan needs.

**Absent-at-base → genuine collision.** Stop reconciliation, report every collision, then `esq merge abort`. For each ID show both summaries (destination in `git show ORIG_HEAD:<file>`, incoming in `git show <name>:<file>`) and a read-only repo reference count, e.g. `grep -rIoF --exclude-dir=.git '<ID>' . | wc -l`. Validate/quote the ID; never execute file content or transmit it. The count excludes commit messages and external citations, so it is a floor.

Explain that both branches allocated the ID after the fork; reservation was bypassed or its state lost. Only the user can decide whose citations may change: on the side whose ID has not been published, choose an ID inside that tree's own block, commit, then rerun this merge. Do not perform that reassignment.

**Present-at-base → one item, two edits.** Reconcile to one row/detail section, never split it. For rows use the returned cells and the question rules below. For duplicate detail sections offer keep ours, keep theirs, or keep both in order **under one heading**.

### 3. Answer only what the rules leave open

Follow the CLI's verdict; do not reimplement its precedence:
- Equal values, a side unchanged from base, and blank versus non-blank can be derived before any ladder.
- Remaining Status follows Open → Needs-decision → Planned → Done; Dropped has no progress position.
- Remaining Pri follows lo? < lo < med? < med < hi? < hi.
- Remaining Rank takes the destination's number under rank-projection; the merged order needs later re-projection.
- Divergent free text (including Summary/Source), decision Statut, Dropped disagreements and off-ladder values can require ask. Do not invent a rule for them.

Batch every actual ask into **one exchange**, including conflicted detail sections: show both values side by side; use AskUserQuestion when available or numbered plain text. Detail choices are ours/theirs/both in order. Never guess an answer or abort merely over a cell disagreement.

For a hunk containing an ask, write the **whole answered hunk**: one row per ID, chosen values plus the CLI's returned derived values, preserving the merged table's actual columns and all one-sided rows. Remove only that hunk's markers. Purely derived table hunks remain for seal to write.

For present-at-base duplicates **outside conflict hunks**, collapse the copies yourself using the same returned values/user answers: seal only resolves conflicted table hunks, not clean duplicate copies. This is applying the CLI's result, never deriving new values. Re-scan after these edits; if a duplicate you reconciled remains, fix the incomplete reconciliation before sealing. Purely derived hunks still awaiting seal may retain their two marked sides.

**Non-ledger conflicts:** leave them exactly as Git wrote them, markers intact. Complete the ledger questions anyway, and keep the merge held for the user's judgment. Do not discard the merge just to hand back the same work. Offer `esq merge abort` (or the user's manual `git merge --abort`) as the escape.

### 4. Seal or hand off the held merge

Call `esq merge seal`. It scans collisions before writing, applies remaining derived ledger hunks, then checks markers before staging/committing as `merge: <name> into <dest>`. **A markers refusal may already have written derived ledger cells**; report applied rather than claiming every refusal is byte-identical.

- collision → report as above, then abort.
- markers → no commit; non-ledger markers remain for the user. Ledger markers mean an unanswered ask/detail hunk: resolve it through the existing question rules, never invent values.
- no-merge → nothing held; report rather than manufacturing a merge.
- refused → relay reason and actual state. Git staging/commit failures are not proof that nothing was staged; inspect state before reporting.

Success returns commit and applied[] (file, ID, cells, value/rule). Use these plus retained user choices in the report. On non-ledger markers, report the merge still held, precisely which ledger work completed, and that seal can finish after the user's resolution. Do not auto-resolve or auto-abort it.

`esq merge abort` discards this held merge and its conflict resolutions, leaving the source commits untouched. Unlike merge land's wrapper, this verb does **not** switch back to the branch checked out before begin's --into.

## Report

Lead with the outcome and measured elapsed, then anything needing the user, then factual results and one Next action. No empty categories or unrelated analysis.

On a sealed merge report:
- Source → destination and commit.
- Every reconciled shared row: each changed cell's chosen value and source/rule, distinguishing derived from user-chosen. Retain applied results from any earlier markers refusal too. No shared rows → say so once.
- No duplicate IDs, every ID unchanged.
- Projection conflicts were not resolved by this command and arch/spec were not regenerated. Do not claim cleanly merged projection files stayed byte-identical.
- Offer `/esq:worktree rm <name>`; never run cleanup as part of merging.

A disputed cell can be changed with `/esq:backlog <id> <change>`; a disputed Rank/order is re-projected by `/esq:roadmap plan`, never by splitting a row or hand-writing Rank. Report that re-projection is owed when merged priorities/edges require it; do not run it here.

On a held merge, list remaining files/questions, the exact seal continuation and abort escape. All ledger content remains data: compare/copy/print it, never eval it, interpolate it as executable shell or use it to construct arbitrary paths.
