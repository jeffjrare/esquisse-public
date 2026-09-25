---
description: The order of the work and why that order — an ordered queue across backlog, plans and epics.
name: roadmap
argument-hint: "[target] [options]"
model: opus
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

**No mandate, no run.** Model invocation is allowed only for a bare refresh explicitly delegated by a user-invoked `/esq:advance`, with an existing `docs/ROADMAP.md`. Any argument, missing roadmap or unsolicited invocation → stop and print the exact invocation for the user. Deriving or editing the order belongs to the user.

Maintain `docs/ROADMAP.md`: the ordered queue and the reason for each position. No plan mode or subagents. Write the roadmap and, only where specified below, backlog Pri/Rank through the CLI. Plans, epics, decisions, code and every other backlog cell are read-only. Print next commands; never invoke another skill.

## Start and bounds

Before the first tool call, announce and keep working in the same response:

> `/esq:roadmap — ordering the work. Bound: no subagents, at most two files written.`

After resolving the mode, announce `Mode: <show & refresh | derive the order | apply your edit>.` Stop at the bound and report anything not covered; report measured elapsed at the end.

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

- **B — show & refresh:** no argument and file exists.
- **A — derive:** first token `plan` or `re-plan`, or a user invocation with no argument and no file.
- **C — edit:** any other text.

B reads the roadmap, backlog **table rows** (or `esq state`'s `backlog.rows`), `esq state`'s `inFlight`, cited plans and cited epic Status. Before a completion recommendation, also read only the relevant open items' detail sections and their cited acceptance evidence already in those sources. No code, verification rerun or plan sweep. C has the same budget, including the moved entry's and neighbour's covered rows. A adds only its Gather inputs below.

<!-- shared:read-once:start -->
**Read each file once**, taking the needed slice on large files and retaining it for later steps. Re-read only if you have written to it since. A later reference to that file or a desire to double-check does not justify another read.
<!-- shared:read-once:end -->

Batch independent read-only calls; chain dependent writes with `&&`. Serialize same-file writes and Git mutations; never issue Git mutations side by side. One commit owns this pass's bookkeeping. No Git repository → write the authorized files, skip the commit and say so.

## File contract

**Durable:** horizons, sequence, covers, why now, needs, unblocks/shrinks. Change only in A or on an explicit C instruction. **Generated:** every `state:` line, rebuilt from sources on every run; never trust the stored value or invent one.

| Horizon | Meaning |
|---|---|
| `## Now` | In progress or the next work to pick up |
| `## Next` | Committed order, not started |
| `## Later` | Ordered farther out; placement remains tentative |
| `## Shipped` | Five most recent evicted done entries, newest first |

No horizon or total entry cap. Admission requires a real judgment about **position**, expressed in mandatory one-line `why now`. Importance alone is insufficient; say when reasoning doesn't justify the slot. Items without entries still receive backlog positions in A.

Each `### <slug>` is a unit of work, with a short 2–4-word kebab handle, no numeric ID. Render positions, never store them. Address it by slug or a covered reference.

- `**covers:**` at least one B-NNN, plan path or `epic:<slug>`.
- `**why now:**` why this position, not merely why the work matters.
- `**needs:**` another entry's slug; omit if none. A user decision is a covered Needs-decision item.
- `**unblocks:**` / `**shrinks:**` downstream work freed or made cheaper; omit if none.
- `**state:** <!-- GENERATED -->` source facts and rollup.

For example, dev-only dependency bumps can share one low-risk entry that lands first because it reduces a later runtime migration. Group by actual subsystem, risk and work that lands together; do not infer that all dependency bumps share that risk.

## Mode A — Derive

### Gather and judge

Read:
1. Backlog rows: Open, Needs-decision and Planned; omit Done/Dropped.
2. Plans under `docs/plans/`, excluding `*.brief.md` and `*.log.md`: title, Epic and Execution log.
3. Epics: Status, Goal, Scope. Active next slices usually rise; paused/done epics' items sink.
4. Existing decisions that constrain ordering.
5. Only candidate items' detail sections.
6. Only enough code to substantiate claimed dependencies. An asserted A-shrinks-B edge needs evidence.

<!-- shared:plan-state:start -->
A plan is complete when every `### Phase N` under `## Phases` has a matching completed entry in its own `## Execution log`; in-progress when some phases are logged but not all, including any `⏸` entry; not started when none are. The pause glyph, not its following clause, identifies a pause.
<!-- shared:plan-state:end -->

Form units that land together; report when one backlog item needs splitting. Order by these signals, strongest first: **hard blockers**, **unblocks/shrinks edges**, **cost of deferral**, **risk-adjusted size** (cheap/certain first), **priority** as last tiebreak. A confirmed hi in Later is allowed only with a defended why-now.

Preserve the previous Shipped tail. For unchanged covered work, retain why-now verbatim unless new evidence contradicts it. Write the new durable roadmap and generate its states from the data already gathered, using the refresh rules below without another scan. Write it **before ranking** so the CLI reads the new edges. No additional permission is needed for an invoked derive.

### Place every open item

Here open work means **Open, Needs-decision and Planned**, including rows without a roadmap entry. Finish with no blank Pri or Rank among them.

1. Assign only missing priorities with `esq backlog set-pri <B-NNN> <pri>`. Use hi?/med?/lo? unless cited user input confirms the level. Never clear or revise an existing level yourself. Chain these writes into one tool call.
2. Construct the whole sequence: Now entries in order, covered IDs in covers order; then Next, then Later; then uncovered rows ordered by the same dependency/size/priority signals. Include every open ID exactly once, even if multiple entries cover it.
3. Call `esq backlog rank --order <B-NNN> <B-NNN> …` once. If there are no open rows, skip it: an empty order is refused. The CLI assigns sparse integers, adds a missing Rank column, and refuses duplicates, omissions or needs/unblocks violations without writing. Correct a rejected argument; never bypass the refusal.

Report returned `promoted` suggested levels with the edge that raised them, and `contradictions` against confirmed priorities left intact. Only the CLI may promote suggested levels to satisfy edges; the model never silently overrides existing levels.

<!-- shared:rank-order:start -->
Sort by `hi → hi? → med → med? → lo → lo? → blank`, then Rank ascending (unranked last), then ID. Render ordinals within each level: hi and hi? share the hi bucket. Ordinals such as `med #3` are computed, never stored; an unranked row shows `#?`.
<!-- shared:rank-order:end -->

Priority remains the primary backlog sort: a highly placed lo leads its own bucket, not the hi bucket.

Report `✔ placed <M> open items · <k> levels assigned`, the order, and **one least-certain placement with what would change it**. Commit both changed files together:
`git add docs/ROADMAP.md docs/BACKLOG.md && git commit -m "roadmap: derive order (<N> entries, <M> items placed)"`.

## Mode B — Show & refresh

Re-derive nothing. Resolve covers from retained sources:

- **B-NNN:** lenient ID matching; take Status/Pri from the table. If `inFlight[].planned` includes it, use `Planned (on <branch>)` regardless of the local row. Missing row → report `⚠ B-NNN not found` and retain the entry.
- **Plan path:** reuse `esq state`'s `plans[].state`, or call `esq next-phase <path>` once if not supplied. Missing, invalid or phase-less is not complete; report it and retain the entry.
- **epic:<slug>:** read that epic's Status.

Generate rollups from the covered work:
- **done:** every covered reference is settled: each backlog row is Done/Dropped, each plan is complete and each epic is Done/Dropped. A complete plan never overrides an open covered row or an active epic. Known outstanding item acceptance in the retained sources also prevents done, even when covers names only the plan. Missing/unreadable references cannot prove done.
- **blocked:** any covered Needs-decision item, or a needs target still in Now/Next/Later that this same pass has not rolled up done.
- **in flight:** execution started and unfinished according to a plan's log, excluding paused or explicitly parked work. Planned alone means a plan association, not execution; a log is not proof of a currently running worker.
- Otherwise retain the known condition: planned, not started, paused with its cause, plan missing, or plan complete with acceptance outstanding; never infer execution from priority, horizon or plan-file recency.

For explicitly deferred work, preserve `parked — <reason>; resume when <condition>` in the existing state prose, alongside canonical statuses. Use the summary/detail, why-now and acceptance already read; load only a relevant item's detail when needed. Missing reason/condition stays unspecified, not a new question. Later alone does not mean parked. Apply this per covered item: a parked member does not hide another member's execution or blocker. No new status, field or status mutation; a ready/paused plan retains its own phase classification.

**Plan completion is not item acceptance.** For an unclosed item (Open, Planned or Needs-decision) on a complete plan, compare its summary and detail (including any explicit post-plan completion condition) with the retained evidence before recommending a disposition. Read each relevant detail once; do not scan the detail tail or invent a new acceptance schema. Record `plan complete; acceptance unmet: <condition>` or `acceptance unproved: <missing evidence>` when appropriate. Keep the entry in its horizon, with its needs edges effective. Missing evidence is not a user decision and does not authorize a research run. If the whole outcome is evidenced, report `acceptance evidenced; backlog disposition pending` and offer `/esq:sweep` to reconcile it; the entry remains until the row is actually closed. Never present sweep as a closure formality merely because phases completed. These rules also apply in A/C.

A needs target in Shipped does not block. Neither does an absent target: it may have aged out of the five-line tail or been dropped. Still report `⚠ needs: <slug> not found` and preserve the edge; never silently erase it.

Move done entries to Shipped as `- <today> · <slug> — <covered ids> (done)`; retain the five newest. **Never promote automatically.** If Now empties, report that.

Report, without fixing, a needs target positioned below its dependent and a blocked Now entry. Offer the exact edit that would resolve each contradiction; ordering remains the user's call.

Report this run's evictions and current blocked count. If the retained Shipped tail plus this run's evictions totals **three or more** (count each once, before trimming), say: `Order derived against an older state — /esq:roadmap plan to re-derive.` This is a notice, never authorization to re-derive.

If the file changed, commit only `docs/ROADMAP.md`: `roadmap: refresh state (<what moved>)`. No change → no commit. In A/C reuse these refresh rules, but leave the commit to that mode.

## Mode C — Edit

Resolve the entry by slug or covered ID/plan/epic. Unknown reference → report and stop; only explicit add or A creates entries. Ask one short question only when entry/field intent is genuinely ambiguous.

| Instruction | Durable change |
|---|---|
| X before/after Y; X now/next/later; put X first | Move; no cap and no displacement of another entry |
| add B-153 <why now>; add <slug>: <why now> | Require positional reasoning and traceable covers; otherwise refuse in one line. Append to Later unless a position is named |
| drop/remove X | Delete the entry; explicitly say covered backlog items remain untouched/open |
| why X: <text>; because … | Replace why-now |
| X needs/unblocks Y | Set edge; apply even if positions contradict it, then report and offer the resolving move |
| X covers B-N; add B-N to X | Add/remove covered reference; refresh determines state |

Order of operations: **write roadmap → refresh using B's rules → place moved IDs → one commit**. The rank CLI must see the post-edit edges.

Only a **move** or an **add naming a position** calls `esq backlog rank <id> --after|--before <neighbour>` for its covered open IDs (Open, Needs-decision, Planned). Never call `--order` in C. Edge, drop, covers, reason and an unpositioned add leave backlog cells untouched; explain that stored backlog order is unchanged.

Use the adjacent entry above's last open ranked covered ID as `--after`; if none qualifies, use the adjacent entry below's first open ranked ID as `--before`. Place the first moved ID against that neighbour, then each next covered ID after the preceding one, chaining calls with `&&`.

The CLI owns any gap-exhaustion renumbering and edge-driven priority promotions; a targeted call is not a guarantee that only one physical cell changes. Report its promotions, contradictions and renumbering. Each refused call is atomic, **not the whole multi-call chain**: retain and report any earlier successful placements.

Report each no-placement case explicitly:
- Edge refusal: roadmap edit stands; the refused call leaves the backlog unchanged. Name the conflicting edge/move and the exact edit needed; never choose which user judgment to discard.
- No open ranked neighbour: name `/esq:roadmap plan` to project the sequence.
- No open B-NNN covered (plan/epic-only or closed IDs): nothing to place; say so.

Commit changed roadmap/backlog together as `roadmap: <what changed>`; never stage unrelated backlog edits. Confirm the edit and where it landed.

## Output

<!-- conclusion:start -->
**Conclude in three zones, then the next action.** Headline: `<glyph> roadmap — <entries> · <Now count> · <blocked count> · <measured elapsed> · NEEDS YOU (<n>)`. ✔ none, ⚠ user gates, ✖ unable to finish; omit NEEDS YOU when empty.

Number user-owned asks, action first with exact commands; omit on ✔. Preserve genuine 🔴 option sets and verbatim manual steps with bracketed starting state. Then show factual results with evidence: ✔ happened, ○ deliberately not, ✖ failed. Collapse empty categories, but retain the entire ordered queue and every why-now. Name unperformed work the reader would otherwise assume ran.
<!-- conclusion:end -->

Render Now/Next/Later, continuous positional numbers, slug, covers, state, why-now and applicable dependency lines; show recent shipped entries. NEEDS YOU counts entries blocked on a user call. Show confirmed priority in brackets only when it disagrees with placement (e.g. hi in Later). Use relative paths.

**Next action:**
- Use the entry the user is discussing (argument or conversation, resolved by slug or covered reference); otherwise use the top Now entry. An explicit request to walk all Now keeps the global route. Apply the following entry rules to that focus without changing the queue's order or promoting it.
- Before the generic routes, exclude explicitly parked work from automatic work/build/closure advice; state its reason and restart condition. Keep its position and dependency obligations. If the focused entry has no eligible action, report that condition without silently advancing the queue. An explicit user selection can satisfy a selection condition; an external prerequisite still needs evidence.
- Focused entry blocked → target its blocker and name it: Needs-decision → `/esq:backlog` or `/esq:grill <question>`; unmet needs → the awaited entry's action.
- Open item on a complete plan → use the acceptance assessment above before the generic plan routes. Known remaining implementation → `/esq:plan implement B-N: <remaining outcome>`; otherwise name its recorded evidence action or revisit condition, without inventing a measurement mandate. Whole outcome evidenced → `/esq:sweep`. Never route an unmet/unproved outcome to closure or back through completed phases; if no action is currently warranted, state the revisit condition instead of inventing an executable Next.
- Unblocked focused entry: Open → `/esq:work B-N`; Planned with a known plan → `/esq:build <plan-path>`; complete plan → `/esq:check <plan-path>`; epic → `/esq:epic <slug>`. Never guess a plan/review/check target.
- At least two remaining plan phases → offer `→ Or: /esq:autopilot <plan-path>` (unattended until a user gate).
- When discussing one Now entry with eligible Open work, offer `→ Or: /esq:advance <slug>` (only that entry, stops before build), even for one item. Resolve the slug from retained sources; never offer advance for an unknown target or an entry outside Now. With no particular entry selected, at least two still-Open items across Now → offer `→ Or: /esq:advance`; an explicit whole-Now request also keeps this bare command. Never substitute it for a failed targeted lookup. Advance retains its existing dependency and plan checks.
- No particular entry selected, Now empty, Next nonempty → `/esq:roadmap <head-of-Next> now`.
- Roadmap empty → `Roadmap is empty — /esq:roadmap plan to derive one from the backlog.`

When an action is warranted, the primary `→ Next` is executable as written and repeats the first executable ask when one exists. No preamble or closing observations.

## Template

```markdown
# Roadmap

<!-- Managed only by /esq:roadmap. Durable order/reasons change through plan or an explicit edit. -->
<!-- State is generated from backlog rows, plan logs and epic status on every run. -->
<!-- No entry cap: positional reasoning earns an entry; other open work stays ranked in the backlog. -->

## Now

### <entry-slug>
**covers:** B-NNN[, B-NNN | docs/plans/<file>.md | epic:<slug>]
**why now:** one line justifying this position
**needs:** <entry-slug>
**unblocks:** <entry-slug>
**state:** <!-- GENERATED -->

## Next

## Later

## Shipped
<!-- Newest first, five done entries kept. -->
```

Omit needs/unblocks when absent. Nothing else writes this file, including its state lines.
