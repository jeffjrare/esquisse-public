<!-- loaded-at: Load `${CLAUDE_SKILL_DIR}/references/decisions-and-backlog.md` **before any row is filed** -->
<!-- loaded-at: you load `${CLAUDE_SKILL_DIR}/references/decisions-and-backlog.md` for the entry's shape -->
<!-- loaded-at: Load `${CLAUDE_SKILL_DIR}/references/decisions-and-backlog.md` and look -->
## Capture backlog candidates

**This step runs before the execution-log entry is appended** — step 2 of `/esq:build`'s "Append to execution log". Look at the `backlogCandidates` list of the payload drafted there, not at the entry, which is not written yet.

**If it says "None.": file nothing, commit nothing, and return to step 3 — the unit re-read.** The closing step below reads `docs/BACKLOG.md` itself on the one phase it applies to.

**Otherwise**, append each candidate to `docs/BACKLOG.md` so it isn't lost (schema and template live in `/esq:backlog`):

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

1. If `docs/BACKLOG.md` doesn't exist, create it from the template. **Read its `| B-NNN |` table rows once here** — the rows carry every field this step and the closing step below need (ID, Status, Source, Epic); the per-item detail sections are the bulk of the file and neither step reads them — the closing step below reuses this same read rather than opening the file a second time.
2. For each candidate, dedup against existing rows by summary, then file it in one call:
   `esq backlog add --type "<type emoji + word>" --summary "<one-phrase summary>" --source "<source>"` — the
   source classified now, from evidence: `observed: <slug> Phase N` only when the finding is outside the
   promised work and this unit neither introduced nor aggravated it — it fails the same way on the unit's
   origin, nothing the unit changed (a caller, data, configuration, an interface) reaches or worsens it,
   and nothing the unit promised covers it; an untouched file or a pre-existing failure alone is not
   enough. `build: <slug> Phase N` otherwise.

   (Add a detail section only for anything needing more than its summary.)
3. Everything build captures is Status `Open` — build never assigns priority or `Needs-decision`; that's the user's call at triage.
4. Commit alone, and before the execution-log entry exists: `git add docs/BACKLOG.md && git commit -m "backlog: capture candidates from phase N (<slug>)"`.

This is additive and out-of-scope by construction — never turn a backlog candidate into code in this phase.

**Out of scope means outside the shipping *unit*, though, not outside this phase.** A 🐛 or ⚠️ in code this unit wrote never reached this step: `/esq:build`'s "A defect against this unit is not a backlog candidate" sends it to the task's own commit or to a `blockedBy` pause. What reaches it is classified by the source you file it under, and `esq plan append-log`'s gate reads nothing else: a `build:` 🐛/⚠️ blocks the phase's `completed` entry until it is fixed and closed, an `observed:` row never does. Pick the verb from the evidence above, never from which one lets the entry through — an `observed:` row that turns out to be the unit's own regression, an aggravation it caused, or a fix it promised is the one failure this classification must not produce.

A detail section is a heading and prose (`What` / `Why it matters` / `Notes`) — **no field lines**. `Date`, `Type`, `Pri`, `Source`, `Status`, `Epic` and `Version` live in the table row and nowhere else; a second copy drifts the moment someone closes the item. Same rule in every command that touches the backlog.

## Write decisions to DECISIONS.md

After the execution-log commit — step 6 of `/esq:build`'s "Append to execution log" — scan the **"Surprises / decisions made during execution"** list you just wrote.

**What qualifies as a decision:** any item where you chose between alternatives — a deliberate call that could have gone differently. A pure surprise (something unexpected with no real choice involved) does NOT qualify.

**If there are qualifying decisions:**

1. If `docs/DECISIONS.md` does not exist, create it:

```markdown
# Decisions

<!-- Registry of architectural, product, and functional decisions. Managed by /esq:plan and /esq:build. -->
<!-- An ID is a permanent citation key: never renumbered, never reused. Code, plans and commit messages may cite it. -->

| # | Date | Scope | Topic | Décision | Statut |
|---|------|-------|-------|----------|--------|

---
```

2. **Backfill missing topics — only when something is actually missing.** This is a one-time migration for pre-`Topic` registries, not per-phase work. Gate it with two cheap counts before reading anything:

   ```bash
   grep -c '^## D-' docs/DECISIONS.md; grep -c '^\*\*Topic:\*\*' docs/DECISIONS.md
   ```

   Equal counts → every entry already has a topic. **Skip this step entirely** — do not scan, do not read the entries. Only when the topic count is lower do you scan for the `## D-` entries missing `**Topic:**`, infer a topic for each from its title and content (free-form domain tag — e.g. "auth", "subscription", "seo", "checkout", "payments"), add `**Topic:** <inferred>` after the `**Scope:**` line, fill in the topic column in the corresponding table row, and include those changes in the same commit.
3. **Derive the ID from the title — it is a slug, never a number.** 3–5 lowercase words from the decision title, hyphen-joined (same convention as plan/brief/epic slugs), giving `D-<slug>`. If a `## D-<slug>` heading already exists, append `-2`, `-3`, … until unique. Numbered `D-NNN` entries predating this convention stay exactly as they are — never migrated, never renumbered.
4. For each decision, add a table row and a full entry:

```markdown
## D-<slug> — <Title>

**Scope:** <arch | prod | func | ux | infra | deps>
**Topic:** <free-form domain tag — e.g. "auth", "subscription", "seo", "checkout", "payments">
**Date:** YYYY-MM-DD
**Statut:** Active
**Fondement:** <optional — mandate — the plan clause, CLAUDE.md rule or accepted frame that covers this choice | user — where and when the user authorized this change: the brief's ## Resolved decisions, the answered question, the approved plan>

**Contexte:** Why this decision was needed — 1-2 sentences.
**Décision:** What was decided — 1 sentence.
**Raison:** The key tradeoff or reason — 2-3 sentences.
**Tradeoff:** What was gained and what was accepted as cost — 1 sentence each.
**Conséquences:** What this decision implies for future work — 1-2 sentences.
**Alternatives rejetées:** Other options and why they were not chosen.
```

**Fondement — what the authority rests on, never what was done.** Write `mandate — <the clause>` when the plan, `CLAUDE.md` or the accepted frame already delegated this choice — a worker records its own technical calls this way without asking anyone — and `user — <where and when>` for a change to an explicit constraint, a promised capability or a major commitment. **The citation after the em dash is the field:** a form with nothing behind it authorizes nothing, and neither do `Statut: Active`, the entry's date, or when its commit landed. Write no field at all when the entry only records an outcome. It is optional and purely additive — never backfill an existing entry, add no migration, and every consumer keeps reading an entry that carries none: the three states are `mandate`, `user` and absent.

5. Commit separately: `git add docs/DECISIONS.md && git commit -m "decisions: log decisions from phase N (<slug>)"`

**Scope values:** `arch` (architecture/patterns/stack), `prod` (product/features/priorities), `func` (functional behavior/business rules), `ux` (UX/design/interactions), `infra` (deployment/CI/CD), `deps` (libraries/versions)

**If there are no qualifying decisions** (only surprises, or the entry says "None"): skip this step entirely.

## Close the items this plan delivered

**Only on the plan's last phase, and only once it completed** (skip entirely on earlier phases, and on a paused or failed phase — nothing is closeable until the work is actually done).

`/esq:plan` marks the backlog items a plan picks up as `Planned` and stamps ` · Planned by <slug>` into their `Source`. Close the ones this plan actually delivered — yourself, from your own evidence, because you are the command holding it:

1. Work from the `docs/BACKLOG.md` content the capture step above already read — including the rows it just appended. Read the file here **only** if that step was skipped (no candidates) or the file didn't exist. Find every row not `Done`/`Dropped` whose `Source` names this plan's slug (`Planned by <slug>`). None → skip this step silently.
2. For each, compare its promised outcome — its `Summary` and the part of `## Done looks like` it maps to — with what this plan's execution log shows was built **and** verified:
   - **Delivered and verified** by an `(auto)` step, or by a `(manual)` step the user confirmed → close it: `esq backlog set-status <B-NNN> Done --by <slug> --resolution "<the outcome, and the commit or step that proves it>"`. Stage every close together and commit once: `git add docs/BACKLOG.md && git commit -m "backlog: close <ids> delivered by <slug>"`.
   - **Partly delivered, or verified only by a manual step still unconfirmed** → leave it as it stands and report one zone-3 line naming what is missing. Partial completion is not completion.
   - Never drop a row here, and never close one to make a later gate pass.

A row you left open is not a request to the user unless a real decision remains — whether the missing part is still wanted. Then it is one NEEDS YOU line with its options; otherwise it is a fact in zone 3. An unclosed row costs far less than a wrongly-closed one.
