---
description: Read-only orientation snapshot — active plan, current phase, pending briefs, backlog, staleness, and the one next action.
name: status
argument-hint: "[target] [options]"
disable-model-invocation: true
model: sonnet
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

Produce a compact, one-screen workflow snapshot. **Read-only:** no plan mode, file writes, code changes, commits or execution of recommended actions.

## CLI and read budget

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Run `esq state`, `esq brief pending` and `esq validate` once, batching these independent readers. Surface validation findings. Do not glob plans/briefs or parse backlog/roadmap facts the CLI supplies.

| Reader/field | Facts to retain |
|---|---|
| `state.root, branch, dirty` | Git state |
| `activePlan` | Most recently modified plan file, not necessarily one in progress |
| `plans[]` | Already newest-first: file, mtime, state (ready/paused/complete/no-phases/invalid), phase, paused entry; optional abandoned date/reason; invalid entries carry error |
| `backlog.counts` | Open, Needs-decision, Planned, Done, Dropped |
| `backlog.rows` | Open/Needs-decision/Planned rows: id, pri, rank, summary, status, epic, source |
| `roadmap.head` | Top Now entry: slug, covers, whyNow, needs, unblocks, state (GENERATED marker stripped) |
| `landing` | For the CLI's settled complete plan: file, branch, origin, landed, coverage, unit |
| `brief pending` | pending/consumed lists, selected path, file, slug, kind, mtime; corrective yellow count and consumption reason |

A missing backlog/roadmap is `null`; an empty Now is `roadmap.head: null`. Check `backlog.error` **before** counts/rows: malformed tables return that field alone. Counts are unknown, never zero. An invalid plan's error is likewise a fact beside healthy results, not a reason to reconstruct the ledger by hand.

Read only facts absent from those answers: healthy plan headings/Epic/log details, unresolved brief content, epic metadata and arch/spec markers. Cache each plan's phase headings, Epic, log dates, hashes and work description on its first read. All subsequent steps reuse that cache; never re-read an unchanged file. Batch independent reads. Announce the read-only scope before a long pass and report measured elapsed.

## 1. Settle the plan and current phase

`activePlan` may be invalid, abandoned or phase-less. Report its condition; do not silently redefine that field.

For the snapshot's **settled plan**, take the first newest-first entry with phases that is neither invalid nor abandoned. If the active file is no-phases, say so and use this newest healthy plan with phases. An abandoned active plan gets `○ abandoned <file> <date> — <reason>`, never a build/land recommendation. Abandoned readable plans still count in epic and dated-log totals. Invalid files are never read or counted.

No activePlan → `No active plan found.` No eligible settled plan → `No readable plan with phases.`; skip the phase overview and plan-dependent next rules.

Read the settled plan once in full for headings, Epic and log evidence, but use its `plans[].state` and `phase` as the classification:
- ready → next phase to execute;
- paused → the returned phase and entry; classify the pause by `⏸`, and read `manualOutstanding` / `blockedBy` for its cause;
- complete → all phases complete.

Show each phase's name and status. A complete phase has its completed Execution-log entry; an unlogged phase is unstarted unless the interrupted-attempt check below finds evidence.

**Landing facts must belong to this settled plan.** Reuse `state.landing` when its file matches. The CLI currently skips invalid/abandoned plans but not no-phases when choosing landing; if that leaves no matching landing for a complete fallback plan, call `esq branch check <settled-plan>` once. Its `recorded` is landing's branch; reuse origin, landed, coverage and unit. This read can exit 1 for a branch refusal while returning valid landing facts; inspect its JSON, including landed, rather than treating exit 1 as unavailable data. Never compute coverage or branch ancestry yourself.

## 2. Epic and interrupted attempt

If the settled plan carries `**Epic:** <slug>`, read its epic file if present and report title/slug plus total member plans and completed members. Membership comes from healthy plans' Epic lines, read only when not cached; completion comes from `plans[].state === "complete"`. No Epic or no epics directory → omit.

For a **ready current phase**, detect unlogged work with one `git log --oneline <last-logged-hash>..HEAD`. Retain every cited log hash; with no entries, use the `plan: <slug>` commit as the range start. Establish that base from Git if needed; never guess one. Skip paused, complete, invalid, abandoned or phase-less targets.

Remove workflow metadata subjects beginning:
`plan:`, `plan(`, `brief`, `backlog:`, `decisions:`, `epic:`, `roadmap:`, `spec:`, `merge:`, `docs(claude):`, `docs(arch):`.

Remaining commits indicate **attempted, incomplete** work. Report count, hashes and subjects; never assert the phase failed or diagnose a cause. They may be fixes or hand commits. Display at most the ten newest and state how many were elided; do not cap the input before counting/filtering.

## 3. Pending briefs

Use `esq brief pending`'s paths and `kind`, never filename globs or a suffix guess:
- `grill` in pending → awaiting `/esq:plan`.
- `corrective` in pending → apply remaining 🟢 through `/esq:fix`, then plan 🟡 through `/esq:plan`.
- A consumed grill brief is historical input, not pending work.
- A consumed corrective brief may still hold 🟢/🔴; `reason: no-yellow-left` means it no longer owes a plan, **not** that all findings vanished. Use retained unit.findings where available; otherwise inspect only these returned corrective paths for unresolved items. Report unresolved user gates without proposing already-consumed planning again.

Use selected for the newest planning candidate, with unresolved corrective work kept visible. Never invent a review/check target from a brief name; `esq brief plan <brief>` resolves a corrective target if needed.

## 4. Backlog and roadmap

Show Open total and hi count from pri, Needs-decision separately, and Planned separately. Closed items contribute counts only. Missing file → `No BACKLOG.md found.` On backlog.error, render `✖ backlog <error as given>`, counts unknown, and skip closure candidates and count-based backlog advice.

For Planned rows, retain Source's ` · Planned by <slug>` marker; skip rows without it. Group by slug and match the named plan in the retained plan list, reading `docs/plans/<slug>.md` only if not already cached and classification is still needed. Missing → `plan file not found`, no hunt. Invalid → `plan unreadable`, not a candidate. Complete plan → **candidate to close**, never proof that the individual item shipped. Show its ID; never edit or assert Done. Omit an empty candidate block.

Display `roadmap.head` as written, including covers/state. Never refresh it: only `/esq:roadmap` writes generated state. If it disagrees with known backlog facts, append `(state may be stale — /esq:roadmap to refresh)`. Missing roadmap → omit its line, without urging creation; empty Now → say Now is empty.

The head reader supplies only one entry, not the full queue or a total Now count. Use its proven covered rows for routing. If a blocker or promotion target cannot be resolved from returned facts, recommend `/esq:roadmap` to expose it rather than guessing a command target or parsing the file as a second reader.

## 5. Architecture/spec advisories

Read CLAUDE.md's `<!-- last-arch: YYYY-MM-DD -->` (optional ` @ <commit>`) or legacy `last-synced` marker; either supplies the date. Check whether `docs/ARCHITECTURE.md` exists; last-synced without that file means the project predates arch's eviction pass — report it.

Count completed build phases dated **after** the marker from healthy cached logs, reading only uncached plans. Architecture staleness is notable at **>14 days OR ≥3 completed phases**. No marker → `Architecture projection never built (no marker).`

Read `docs/SPEC.md` and its `<!-- last-spec: YYYY-MM-DD -->` marker:
- Missing → `No SPEC.md — run /esq:spec to generate one.` This is optional advice.
- No marker → age unknown.
- Count only completed **user-facing** phases after the marker (routes, screens, commands, business rules), not refactors/infra/tooling.
- Spec staleness is notable at **≥2 user-facing phases OR >30 days with at least one**.

These are advisories; neither blocks landing or changes the primary next action.

## 6. Choose exactly one → Next

First matching rule wins. Plan rules use the settled healthy, non-abandoned plan; no usable plan falls through to briefs. An unreadable file is a user-needs item, never a build target.

1. **Paused phase** → `/esq:build <plan-path>`; note Phase N and the actual cause (manual verification and/or named same-unit defects).
2. **Interrupted attempt** → `/esq:build <plan-path>`; give unlogged count and explain that build verifies the phase's auto steps and reconciles its log before implementing more. `git show <hash>` is optional, never a prerequisite.
3. **Ready phase** → `/esq:build <plan-path>`, naming Phase N/name. With **≥2 phases remaining**, append `→ Or: /esq:autopilot <plan-path>` (runs M phases unattended until a user gate). One phase → build alone.
4. **Complete plan**, in this exact order:
   - `landed === true` or `'equivalent'` → `✔ landed <branch> → <origin>`; recommend nothing more for this plan and fall through to 5. This includes a deleted branch proved landed by the CLI.
   - `unit.incomplete` nonempty → `/esq:build <first entry's plan>`, naming how many unit plans remain unbuilt/paused. Offer `→ Or: esq plan abandon <plan> --reason "<why>" && git commit -m "plan(abandoned): <slug>" -- <plan>`: user's choice; promised rows/briefs still block afterward. If that entry is invalid/no-phases, report its ledger defect instead of offering a build that cannot run; never skip the unit obligation.
   - `unit.findings` nonempty → `/esq:fix <brief-path>` if it lists 🟢, otherwise `/esq:plan <brief-path>`; unresolved 🔴 remains a user gate.
   - `coverage.verdict === "unproven"` → `/esq:review <plan-path>` (no review has read this unit); offer `→ Or: /esq:converge <plan-path>` (reviews/fixes unattended, at most two subagents, stops at a user gate).
   - `stale` → `/esq:review <coverage.plan>`, falling back to settled plan only if coverage.plan is null; note code changed since reviewedAt and land refuses stale coverage.
   - `corrected` → the same review target rule; one delta review after findings were fixed and the brief cleared. Never send it back through the unproven pair.
   - covered, `origin === null` → legacy plan: nothing to land; fall through to 5.
   - covered, `unit.open` nonempty → `/esq:work <first id>`; note same-unit defect, or user acceptance via `/esq:backlog <id> dropped`; land refuses until disposed.
   - covered, `unit.promised` nonempty → `/esq:backlog <first id> done` **if delivered**; otherwise `/esq:plan implement <id>: <summary>`; land refuses until disposed.
   - covered, nothing owed → `/esq:land <plan-path>`: verifies the whole unit and lands on origin. Stale arch/spec stays optional advice.
5. **Unresolved brief, no remaining plan action** → corrective: `/esq:fix <brief-path>` for safe fixes first, then `/esq:plan` for unplanned 🟡; grill: `/esq:plan <brief-path>`. Preserve a remaining 🔴 as a user ask; consumed briefs do not restart planning.
6. **No plan/brief action, roadmap exists** → top Now entry's action: Open item → `/esq:work B-N`; epic → `/esq:epic <slug>`. Name slug/whyNow. A blocked head targets its known blocker; if the head is empty or required facts are unavailable, `/esq:roadmap` exposes the queue. When returned facts establish **at least two still-Open items in Now**, offer `→ Or: /esq:advance` (one subagent each, stops before build); never invent the rest-of-Now count.
7. **No plan, brief or roadmap action** → `/esq:grill` to start an initiative; offer `→ Or: /esq:roadmap plan` to derive backlog order first.

Allowed secondary lines after Next:
- Stale architecture → `→ Also: /esq:arch`.
- Known Needs-decision count >0 → `→ Also: /esq:backlog` (M items); skip on backlog.error.
- One closure candidate → `→ Also: /esq:backlog B-N done` (if delivered, still Planned on a complete plan).
- Two or more candidates → `→ Also: /esq:sweep` (K items; settles evidence and asks about the rest).
- Stale spec → `→ Also: /esq:spec`, with user-facing phase count.

## 7. Render the snapshot

<!-- conclusion:start -->
Three zones, no preamble or closing observations:

1. **Headline:** `<glyph> status — <slug/current phase> · <backlog counters> · <measured elapsed> · NEEDS YOU (<n>)`. ✔ no user needs; ⚠ any user gate/unreadable ledger; ✖ unable to produce the snapshot. Omit NEEDS YOU when empty.
2. **User needs:** numbered action-first asks, exact commands where executable. Include outstanding manual steps (verbatim, bracketed starting state), blockedBy rows, Needs-decision items and unresolved gates. Retain genuine product decisions' 🔴 option sets; never ask for technical work this command can settle.
3. **Snapshot:** glyph, label, value, evidence/path. ✔ happened, ○ deliberately not, ✖ failed. Show settled plan and epic rollup, indented phases with their own pause clauses, unlogged commits, closure candidates, pending briefs, backlog, roadmap head and staleness. Collapse empty categories; no `None.` lines. Name work the reader would otherwise assume ran.

Finish with `→ Next` and only the allowed Or/Also lines. If a user decision must precede an executable action, say which option to pick and the resume command.
<!-- conclusion:end -->

Every invalid plan and backlog.error earns one action-first user-needs line: fix the named file by hand, with its **error exactly as returned**; `esq validate` lists faults. No esq command repairs these ledgers. Deduplicate the same fault from state and validate.

Use relative paths. No settled plan → omit phases. Report missing inputs when their section requires it; absent optional epic/roadmap remains omitted. Never turn missing/invalid data into zero counts, assert a phase failed, close a Planned row, or add recommendations outside Next/Or/Also.
