---
description: The single capture bin for bugs, improvements, todos, ideas and deferred work — docs/BACKLOG.md. Adds, triages, updates, publishes.
name: backlog
argument-hint: "[target] [options]"
disable-model-invocation: true
model: sonnet
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

Maintain `docs/BACKLOG.md`: bugs, improvements, todos, ideas and deferred work, rather than decisions or the active plan. No plan mode, code changes or subagents. Modes A/B/C write only this file; Mode D also writes `docs/BACKLOG.csv` and may update an existing Google Sheet.

## CLI and working rules

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

The CLI owns IDs, Status, Pri and Rank mutations: `esq backlog add` / `reserve-id`, `set-status <B-NNN> <status>`, `set-pri <B-NNN> <pri>`, and `rank`. You judge type, priority, duplicates, epic, ordering, summary, resolution and whether work is done. Never hand-edit a rank or calculate an ID.

<!-- shared:read-once:start -->
**Read each file once**, taking the needed slice on large files and retaining it for later steps. Re-read only if you have written to it since. A later reference to that file or a desire to double-check does not justify another read.
<!-- shared:read-once:end -->

Batch independent read-only calls. Chain ordered writes with `&&`; serialize writes to the same file and all Git mutations. Announce the scope and bound before a long pass; report measured elapsed at the end. Run `esq validate` once after the final edits, before committing and reporting success.

## Mode selection

- No argument → **B, list & triage**.
- First token `publish` → **D**; remaining text is an optional Sheet URL/id.
- Leading backlog IDs → **C, update**; remaining text is the change for all targets. Match `B-7`, `B-007`, `#7` leniently; accept spaces, commas and ranges.
- Other text → **A, add**.

## Schema and ownership

Actual table headers determine cell positions; never write a fixed-width row under a different header.

`| ID | Date | Type | Pri | Rank | Summary | Source | Epic | Version | Status |`

- **ID:** permanent, monotonic `B-001` citation; never renumber or reuse.
- **Type:** 🐛 bug · ✨ improvement · ☑️ todo · 💡 idea · ⚠️ debt (deferred fix).
- **Status:** `Open` unresolved · `Needs-decision` blocked on a user call · `Planned` picked up by a plan · `Done` · `Dropped`. Open/Planned do not prove execution.
- **Pri:** confirmed `hi|med|lo`, suggested `hi?|med?|lo?`, or legacy blank. Every new/open item needs a level; never invent user confirmation.
- **Rank:** sparse integer maintained by the CLI. Add/reopen assigns the active sequence's tail; Done/Dropped clears it. `esq backlog rank` records deliberate placement and validates roadmap edges. Blank active ranks are legacy unplaced work; these writers supply a missing Rank column without classifying it.
- **Epic:** free-text slug joining `docs/epics/<slug>.md`; blank if none. Keep the actual slug, but capture requires no existence check.
- **Version:** free text; blank until deployed. Filled means deployed/ready for UA; `Done` means UA passed.

Older tables can lack Rank, Epic or Version, and can use `Priority` for `Pri`. Read missing cells as blank. Before writing Epic or Version into a table lacking that column, add the header and pad every row. The CLI creates rows against the actual header.

All structured fields live **only in the table**. Details below `---` contain a heading and prose: `What`, `Why it matters`, `Notes`, `Resolution`. On touching a legacy detail section, remove duplicate field lines (Date, Type, Pri, Rank, Summary, Source, Epic, Version, Status) in the same edit and mention the cleanup. Preserve unique qualifiers or fuller paths in Notes/Resolution. Whole-file migration requires a user request.

Preserve `<!-- last-sweep: <hash> YYYY-MM-DD -->`; only `/esq:sweep` writes it. Never add it yourself. Create a missing backlog from the template when a write needs it; listing a missing backlog reports empty.

## Mode A — Add

### Classify and deduplicate

1. Honor a case-insensitive type prefix, optional colon, and strip it: `bug`; `improvement|imp|enh`; `todo`; `idea`; `debt`. Otherwise infer: broken/fails/crashes/wrong/regression → bug; should/could/nicer/cleaner/refactor → improvement; maybe/what if/one day/could we → idea; other reminders → todo. When torn, choose the more actionable type and say which; don't ask.
2. Set confirmed priority only from a user signal: trailing `!!` or urgent/critical → hi; `!` → med; explicit lo/low/someday → lo. Otherwise suggest med? for bug/todo/debt, lo? for improvement/idea; bump to hi? for crash, data loss, security, broken, regression, blocks, can't ship, production, everyone; drop to lo? for cosmetic, nit, typo, polish, nice to have, someday.
3. Scan existing rows once for overlapping summaries. A clear duplicate in Open or Needs-decision → name its ID and stop without adding. Done/Dropped do not block re-addition. No ID arithmetic during this scan.
4. Extract `epic:<slug>` or `epic <slug>`, stripping it from the summary. No tag → blank. If the epic plainly isn't opened yet, mention `/esq:epic new …` without blocking capture.

### Append and place

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

Tighten the cleaned summary to one phrase, roughly ≤12 words, preserving the user's meaning. Ensure any needed Epic column exists, then call:

`esq backlog add --type "<emoji + type>" --summary "<summary>" --source manual --pri "<level>" --epic "<slug or empty>" --status Open`

The CLI writes today's Date, its allocated ID, a unique tail Rank, blank Version and one cell per actual header in one write. User-captured items start Open, never Needs-decision. Add a detail section only for multi-sentence context, reproduction notes or debt; one-line todos/ideas need only a row.

With the ten-column header above, the resulting row is:
`| B-NNN | <today> | <type emoji + word> | <pri> | <CLI rank> | <summary> | manual | <epic slug or blank> | | Open |`
This illustrates the schema, not a fixed-width fallback: a missing column must never shift Status into Version.

The default tail needs no second rank call. Only a deliberate placement calls `esq backlog rank B-NNN --after B-MMM`, `--before B-MMM` or `--last`; priority remains a separate judgment and the reader's primary sort key.

For ranking, open work includes Open, Needs-decision and Planned. Never invent the integer. The result carries `rank`, `renumbered`, `written`, and possibly `promoted` suggested priorities or `contradictions` against confirmed ones. Report promotions with their edge; leave confirmed levels intact and name the conflicting pair and remedy (change the blocker's priority or roadmap edge). A refused call writes nothing; correct the argument, never bypass it.

Validate, then commit the capture and placement together:
`git add docs/BACKLOG.md && git commit -m "backlog: add B-NNN <short summary>"`.

Confirm the row and rendered position, e.g. `Added B-007 — 🐛 bug [med? · med #3] — sync drops trailing newline (Open).` Add never prunes. Above **1500 lines**, append: `Backlog is <N> lines · /esq:backlog to triage and prune closed detail.`

## Mode B — List & triage

Status/priority changes require an explicit instruction in this turn; apply Mode C. Otherwise list read-only, apart from the threshold-triggered pruning below.

Group by status, actionable first. Open is one ordered sequence:

<!-- shared:rank-order:start -->
Sort by `hi → hi? → med → med? → lo → lo? → blank`, then Rank ascending (unranked last), then ID. Render ordinals within each level: hi and hi? share the hi bucket. Ordinals such as `med #3` are computed, never stored; an unranked row shows `#?`.
<!-- shared:rank-order:end -->

Show ID, type, summary, source, priority with `?` intact, and `«epic-slug»` after the summary when present. Show Planned separately; lift Needs-decision into the user-needs zone. Cap the closed summary at about five IDs and omit empty groups. Explain suggested versus confirmed priority with `/esq:backlog B-NNN pri:hi` or `… confirm`; `/esq:epic <slug>` gives the tagged theme's full view.

For explicitly deferred rows, show `parked — <reason>; resume when <condition>` alongside their canonical status, using retained prose or only that item's detail if needed. Preserve those facts in detail prose when capturing/updating deferred work; no new status or column. Unknown conditions stay unspecified. Exclude these rows from automatic work advice until their condition is met; priority/rank alone never resumes them.

If any open row is unranked, report `○ <n> of <m> open items carry no position yet`. Empty/missing file → `Backlog is empty — add with /esq:backlog <text>.`

**Next, first match:**

1. Needs-decision → resolve the 🔴 items: give the answer for an update or use `/esq:grill`.
2. Any ranked Open row → `/esq:work <first item of the rendered sequence>`, naming its bucket/ordinal.
3. Nothing ranked → if a roadmap exists, use its top Now entry's first still-Open covered item; otherwise a hi Open item; otherwise any Open item. Recommend `/esq:work B-NNN`, which chooses the method.
4. No actionable item → if open rows remain, name their recorded restart conditions or missing facts; otherwise `Backlog clear.`

If any open item is unranked, append only this alternative: `→ Or: /esq:roadmap plan (<n> of <m> open items carry no position — place them all)`.

### Prune closed detail

Only in Mode B, after any instructed updates, and only above **1500 lines**:

- Remove Done/Dropped detail bodies, preserving their table rows; append ` · detail in <short-hash>` to Source, naming the pre-prune commit. Full text remains at `git show <hash>:docs/BACKLOG.md`.
- Never prune Open, Planned or Needs-decision details. Leave any detail changed in this same pass for a later triage: its new prose is not yet recoverable from the pre-prune commit.
- Include pruning and any updates in this pass's single validated backlog commit; prune-only message: `backlog: prune detail for <N> closed item(s)`.
- Report before/after line counts and removed sections. If all closed details are already pruned, say so; don't shrink open work.

## Mode C — Update

Parse leading IDs separated by spaces/commas, including `B-3..B-7` or `B-3-B-7`. The first non-ID/range/separator token begins the change. Match zero-padding leniently. A range selects only existing IDs; any explicitly listed missing ID stops the entire batch **before mutation**.

Apply the same change to every target; combine fields when requested:

| Input | Mutation |
|---|---|
| done / close it; dropped; open / reopen; planned; needs-decision / block on me | `esq backlog set-status <id> <canonical status>`. Retain closed rows. For Done, append known ` · Done by <plan-or-fix-slug>` through `--by`; for Dropped, ` · Dropped: <reason>` through `--reason`, without duplicating existing provenance. For an existing detail section, pass `--resolution "<what closed it>"`. Never invent delivery evidence. |
| pri:hi/med/lo; bump to hi | `esq backlog set-pri <id> <bare level>`: an update confirms the user's level. Rank is unchanged; the priority sort moves buckets. |
| confirm / confirm priority | Strip the current suggestion's `?` via `set-pri`. |
| pri:none / drop priority | Refused by the CLI; ask which level instead. |
| version <value> / version:<value> / shipped in / deployed in | Set Version verbatim; version:none / clear version blanks it. |
| epic:<slug> / epic <slug> / assign to epic / part of the … epic | Set Epic; epic:none / clear epic / detach from epic blanks it. Never edit the epic file; `/esq:epic <slug>` regenerates its view. |
| type:bug etc. | Set Type. |
| summary: <text> / rename to | Tighten as in A; update Summary and any detail heading. Always refuse multi-ID renames and ask. |
| note: <text> / prose clearly adding context | Append Notes, creating a detail section if needed; keep existing notes unless told to replace. Multiple IDs require explicit intent to share the note. |

Never change ID or capture Date. Preserve Source except explicit rewrites and the closure/prune provenance above. Strip legacy detail field lines on each touched item; structured values stay in the row. Ask one short question if the target field is genuinely ambiguous.

Validate and commit the entire batch once: `backlog: update B-NNN (<what changed>)`, or list IDs (compress contiguous runs as `B-002..B-006`). In Mode B, defer this commit until pruning is settled. Confirm the change in one line, briefly noting per-item exceptions and legacy cleanup.

## Mode D — Publish

One-way projection; never edit items, read a Sheet back or merge external comments. The only BACKLOG.md write is its publish-target header.

1. Resolve Sheet id from the explicit URL/id after `publish`, else `<!-- publish-target: gsheet <id> -->`, else CSV only. Persist an explicit target in that comment, creating it if absent.
2. Read every row, including closed history, by header name. Emit exactly `ID,Date,Type,Pri,Summary,Source,Epic,Version,Status` — **no Rank**; missing columns are empty and Type keeps its emoji.
3. **Always write `docs/BACKLOG.csv`** with that header. Quote fields containing commas, double quotes or newlines; double embedded quotes.
4. With a target and a Google Sheets connector that writes cells/rows **in place by spreadsheet id**, write the same header and rows over the previous backlog range. Preserve partner annotations elsewhere; never overwrite the whole Sheet. Drive-only create/copy tools are unsuitable: skip the Sheet silently and offer CSV import. Sheet writing is best-effort; a failed write still leaves the CSV usable and is reported honestly.
5. Validate, stage CSV and any changed BACKLOG.md, and commit `backlog: publish (<N> items)`; skip a no-change commit. Confirm count and destinations, or explain CSV import and `/esq:backlog publish <url>` to bind a target.

## Conclusion

<!-- conclusion:start -->
Lead with `<glyph> backlog — <counters> · <measured elapsed> · NEEDS YOU (<n>)`: ✔ none, ⚠ a user gate, ✖ unable to finish. Omit NEEDS YOU when empty. For a view, counters describe the ledger and Needs-decision rows count as user needs.

Then numbered user-only asks, action first with exact commands; omit on ✔. Product decisions retain their 🔴 options; manual verification retains verbatim steps and bracketed starting state. Then factual result rows (✔ happened, ○ deliberately not, ✖ failed), with evidence. Collapse empty categories, but keep the requested open list and name work the reader would otherwise assume ran. Capture/update/publish confirmations supply their mode's result row.

End with the mode's `→ Next` (and its allowed alternative), repeating the first executable ask when present. No preamble or closing observations.
<!-- conclusion:end -->

## Templates

Create a missing file for a write:

```markdown
# Backlog

<!-- Task backlog, managed by /esq:backlog. -->
<!-- Type: 🐛 bug | ✨ improvement | ☑️ todo | 💡 idea | ⚠️ debt -->
<!-- Status: Open | Needs-decision | Planned | Done | Dropped -->
<!-- Pri: hi | med | lo (confirmed); hi? | med? | lo? (suggested). -->
<!-- Rank: CLI-only position; Epic: epic slug; Version: deployed release, Done: UA passed. -->

| ID | Date | Type | Pri | Rank | Summary | Source | Epic | Version | Status |
|----|------|------|-----|------|---------|--------|------|---------|--------|

---

<!-- Details: heading + prose only; required for debt and Needs-decision. -->
```

Add the real `publish-target` comment only when a Sheet is bound. Details are optional otherwise:

```markdown
## B-NNN — <summary>

**What:** What it is — 1–2 sentences.
**Why it matters:** Impact if left unaddressed.
**Notes:** Reproduction, links or context; omit if none.
**Resolution:** What closed it; omit while open.
```
