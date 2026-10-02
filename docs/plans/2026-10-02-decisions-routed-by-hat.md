# Show each hat the decisions esq made for it, without ever blocking

**Epic:** esq-decides-implementation-detail

**Branch:** esq/decisions-routed-by-hat

**Origin:** main

## Context
The user wears three hats with esq: product owner (business rules, scope), architect (structure, dependencies, data
model, boundaries) and designer (UX, states, wording, visual direction), never developer or tester. Today a judgment
call ends one of two ways: a 🔴 stop, or silence. When `/esq:build` settles a business rule, an architecture choice or
a design choice within the mandate, the only trace is free prose under `**Surprises / decisions made during
execution:**`, which no reader collects. The PO finds the rule in the product. The missing middle state is "decided
for you, open to reversal". `rollout` already travels the route this needs: `esq plan append-log`
(`LOG_ENTRY_SCHEMA`, `plugin/lib/cli.mjs:959`, rendered at `:1150`) → `planRollout` (`:2590`) → `shippingUnit`
(`:2547`) → `unit.rollout` in `esq branch check` → `/esq:land`.

One brief premise does not hold: `/esq:review` never calls `esq branch check`. Its one CLI read is
`esq review scope <plan>` (`plugin/skills/review/SKILL.md:43`, `reviewScope` at `cli.mjs:3634`). To keep the brief's
rule (no extra tool call, the model re-reads no log), the decisions ride on `esq review scope`'s answer, collected by
the same extractor `esq branch check` uses.

## Goal
After this, each hat sees the business, architecture and design calls esq made for it, with the reason and how to
undo each, in the review and the landing report it already reads. No run asks anything more or stops more often.

## Done looks like
- A build phase that settles a product, architecture or design call writes it once in its log entry under
  `**Decided for you:**`, as `<hat>: <what> — <why> — undo: <how>`. A phase that settled none writes nothing.
- `/esq:review` on that plan shows a **Decided for you** block grouped Product / Architecture / Design, each line
  with its undo. That block is never a finding, never counted in NEEDS YOU, and costs no tool call beyond the one
  review already makes.
- `/esq:land` lists the same decisions once in its report and lands exactly as before. Silence is consent.
- `esq plan append-log` refuses an entry whose hat is not `product`, `architecture` or `design`, and leaves the
  plan byte-identical. `append-log --help` documents the key.
- `/esq:work`'s `○ if you disagree` line names the hat that owns the call.
- A one-way door (data loss, public contract, money, irreversible external effect) is never logged as decided. It
  stops the phase exactly as today, through build's existing missing-authority route. This plan adds no stop and
  changes none.

## Approaches considered
- **Mirror `rollout` (chosen).** One schema row, one renderer line, one extractor beside `planRollout`, one
  `unit.decisions` field, the same field on `esq review scope`, then prose in four skills. It costs nothing on a
  run with no decision and about one line per decision. Its limit: the hat is self-declared by the worker, so a
  misrouted decision reaches the wrong hat. That is judgment, which the CLI does not police.
- **Structured objects in the payload** (`{hat, what, why, undo}`). Every part could be validated, and readers
  would need no parsing. It loses: it validates prose parts (constraint 5 of `CLAUDE.md`), triples the payload
  surface for workers, and the brief already fixed the string form.
- **A `DECISIONS.md`-like ledger per hat.** Rejected by the brief (no new `docs/` file). It would also need a
  second writer per file.

## Recommendation
Mirror `rollout`. The CLI checks one thing, the hat prefix (a parsed format, since the hat is what readers group
on). The extractor splits the prefix into a `hat` field, so review and land group by hat without parsing a string.
`unit.decisions` comes from `shippingUnit`, so `esq branch check` carries it. `esq review scope <plan>` carries the
same list for the plan's unit. Range mode, which has no plan, carries none. `/esq:status`'s landing projection
(`cli.mjs:2170`) does not take the field: status presents no decisions, and its output stays smaller.

The existing `**Surprises / decisions made during execution:**` keeps its job: divergences from the plan. A hat
decision goes in `decisions` only and is not repeated there.

Two phases, not the brief's three. The four skill edits are each a few lines, and a third build session would pay
again for preflight, reconciliation and the audit.

## Phases

### Phase 1 — The CLI records, refuses and collects hat decisions
- **Goal:** `append-log` accepts and renders `decisions`, refuses an unknown hat, and `esq branch check` and
  `esq review scope` both return them.
- **Files touched:** `plugin/lib/cli.mjs`, `tests/cli/branch.test.mjs`, `tests/cli/review-scope.test.mjs`,
  `tests/cli/esq.test.mjs` (its append-log `--help` test, `:1601`, already asserts the help lists exactly the
  schema keys)
- **Tasks:**
  - Task 1.1: feat(cli): append-log accepts hat-prefixed `decisions` and renders them under `**Decided for you:**`.
    A new `LOG_ENTRY_SCHEMA` row after `rollout` with a new validator type: `stringArray`, plus each item matching
    `^(product|architecture|design): \S` and holding no CR or LF. Multi-line items are refused because the
    bullet extractor reads one line per item and would drop the undo. The refusal names the offending item and the three accepted hats. Its
    note says esq branch check and esq review scope collect it. The renderer adds `**Decided for you:**` then
    `- <item>` per entry, after `**Rollout:**`, on both statuses. `--help` follows from the schema.
  - Task 1.2: feat(cli): branch check collects `unit.decisions` from every unit plan's log, abandoned ones included.
    Unlike rollout: an abandoned plan's built phases still land, so their calls ship (user, 2026-10-02).
    `planDecisions(text)` sits beside `planRollout`. It reads only the execution-log span, from `## Execution log`
    to the next `#`/`##` heading, as `plugin/lib/markdown.mjs:75-79` bounds it. A list ends on the same
    `**X:**` / heading boundary. It returns `{ plan, source: 'Phase N', hat, decision }`, where `decision` is the
    text after `<hat>: `. Add `decisions: []` to every empty-unit literal (`shippingUnit`, the `unitForPlan`
    fallback, `branch.test.mjs:522`).
  - Task 1.3: feat(cli): review scope carries the plan unit's `decisions`. They are computed once, after the plan
    text is read and before any git-dependent early return, so every plan-mode answer carries the field. They come
    from the plan's `**Branch:**` unit (`unitHeaders` over `planHeaders`, abandoned included, as in 1.2). A legacy plan with no
    branch gives its own log. `reviewScopeRange` stays as it is.
- **Verification:**
  - `(auto)` `node --test tests/cli/esq.test.mjs tests/cli/branch.test.mjs tests/cli/review-scope.test.mjs` — passes, including new
    tests. (1) An entry `"decisions":["finance: x — y — undo: z"]` is refused, naming `finance:` and the three hats,
    and the plan bytes are unchanged. (2) An accepted completed entry renders `**Decided for you:**` followed by its
    bullets. A paused entry with `blockedBy` and `decisions` renders both. (3) `unit.decisions` lists two phases of
    one plan and one phase of a second same-branch plan in order, with `hat` split out, and excludes another
    branch's plan. They include an abandoned same-branch plan's built-phase entries, while its rollout stays
    excluded. (3b) A `**Decided for you:**` list under a `##` heading after the
    log is not collected. A multi-line item is refused, and the plan bytes are unchanged. (4) A `**Rollout:**` list right after `**Decided for you:**` is
    not swallowed into decisions, and the reverse. (5) `esq review scope <plan>` returns the same list. (6) A log
    with no decisions gives `decisions: []`. The existing `--help` test passes with the new row.

### Phase 2 — Build records them, review and land show them by hat
- **Goal:** workers record decisions against a stated bar. Review and land present them grouped by hat. Work names
  the hat on its disagree line.
- **Files touched:** `plugin/skills/build/SKILL.md`, `plugin/skills/review/SKILL.md`, `plugin/skills/land/SKILL.md`,
  `plugin/skills/work/SKILL.md`, `README.md`
- **Tasks:**
  - Task 2.1: docs(build): record hat decisions against the bar, never as a stop. The bar is (a) a hat could
    reasonably have chosen otherwise **and** (b) the result is visible to the end user or constrains later work.
    Everything else is ordinary work. A reversible call: decide, record, continue. A one-way door (data loss, public
    contract, money, irreversible external effect): it is never recorded as decided. It takes build's existing
    missing-authority route unchanged: a 🔴, or the paused entry with `blockedBy` when a same-unit row
    names it (`build/SKILL.md:193-197`). `blockedBy` names backlog rows only, so no new pause cause is invented. Add
    the `**Decided for you:**` field to the completed and paused templates beside `**Rollout:**`. Add a
    `"decisions":[…]` item to the completed example payload (`build/SKILL.md:296`). `esq.test.mjs:1697` replays
    that literal through the validator, so a malformed example fails the audit. State that a hat decision is not
    repeated under Surprises.
  - Task 2.2: docs(review): show "Decided for you" by hat from review scope. Read the `decisions` field of the
    `esq review scope` answer already held. When it is non-empty, add a block to the report grouped
    Product / Architecture / Design, one line each `<decision> · <plan> Phase N`, with its undo kept. It is never a
    finding, never a 🔴, never counted in NEEDS YOU, and never re-derived from the log. The user ratifies by
    silence. A reversal they ask for is ordinary work (`/esq:work "<the undo>"`).
  - Task 2.3: docs(land): list `unit.decisions` once in the report. A Facts entry `Decided for you`, grouped by hat,
    only when non-empty. It never stops, gates or adds NEEDS YOU. Silence is consent, because the merge is local and
    reversible.
  - Task 2.4: docs(work): name the hat on `○ if you disagree`. Both templates and the rule line become
    `○ if you disagree (<product|architecture|design>)  <runner-up> — <condition>`.
  - Task 2.5: docs(readme): the landing paragraph (`README.md:198`) and the review row (`:122`) mention the
    decided-for-you list in one clause each.
- **Verification:**
  - `(auto)` `./scripts/audit.sh` — PASS. It runs the product node suites, including Phase 1's tests on the final
    tree, plus the plugin, structure and conformance checks the skill edits touch. Its PASS goes in the final
    `append-log` `verified` block.

## Risks
- **Pre-mortem: no one records anything.** A worker under the build skill's length skips an optional key, and the
  feature ships empty. Task 2.1 puts the bar next to the payload field and the example carries one item, so the
  shape is copied. Whether workers apply the bar can only be seen on later real units. That remains unproved here,
  and no measurement campaign is bought for it.
- **The opposite failure: noise.** Workers log routine choices, and the block becomes text the hats skip. The bar's
  two-part test is the only control. A cap would be prose policing and is out of scope.
- **An undo that overstates reversibility.** A call logged as reversible that is really a one-way door skips the
  stop. Task 2.1 makes the undo name a concrete path. A call with no feasible undo is by definition a one-way door.
- **Re-shown on a delta review.** `esq review scope` returns the whole unit's decisions, so a second review shows
  ones already seen. This is accepted: a few lines, no call. Filtering by the reviewed range would need joining
  log entries to commits for little gain.
- **`(manual)`-free.** No rendered screen. The skill output is checked by the audit's format checks only. The real
  shape of the review and land report is seen on the next unit that logs a decision.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-10-02

**Plan committed at:** dc75c64

**Commits:** 35c3aed, db61b78, 9888d04

**Verified:** 9888d042567af1460a0a7639a99a83ec884b2dcb
- `node --test tests/cli/esq.test.mjs tests/cli/branch.test.mjs tests/cli/review-scope.test.mjs`
- `./scripts/audit.sh`

**What got built:** esq plan append-log accepts a hat-prefixed decisions array (product|architecture|design, one line each), refuses any other hat byte-identically and renders it under **Decided for you:**; esq branch check returns unit.decisions (abandoned unit plans included) and esq review scope carries the same list on every plan-mode answer.

**Verification:**
- (auto) node --test tests/cli/esq.test.mjs tests/cli/branch.test.mjs tests/cli/review-scope.test.mjs — 135 pass, 0 fail, 5 s; covers refusal (finance:, multi-line, empty), rendering on completed and blocked entries, unit collection with abandoned plan and other-branch exclusion, post-log ## heading excluded, rollout/decisions not swallowing each other, review scope parity (delta, --full, no-git legacy), empty list
- (blast radius) ./scripts/audit.sh — Clean, 7 checks, product suites within 120 s, 27 s wall-clock; cli.mjs is a shared core module so the whole product pass ran here

**Surprises / decisions made during execution:** None — phase executed as planned. Tests (1)(2) and the multi-line refusal live in tests/cli/esq.test.mjs beside the other append-log payload tests; the decisions validator is its own schema type (decisions) so its refusal names the offending item and the three hats.

**Backlog candidates:** None.

**For Phase 2:** 1. The payload key is decisions (array of "<hat>: <what> — <why> — undo: <how>"), rendered after **Rollout:**; esq.test.mjs replays build/SKILL.md append-log literals, so the example item added in Task 2.1 must use a valid hat prefix and one line. 2. Readers get objects {plan, source: "Phase N", hat, decision} from esq branch check (unit.decisions) and esq review scope (decisions); decision excludes the hat prefix. 3. /esq:status landing projection deliberately does not carry the field.
