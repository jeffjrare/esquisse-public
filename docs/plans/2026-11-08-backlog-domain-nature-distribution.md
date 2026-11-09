# Every backlog row classified by domain and nature, with its distribution in the roadmap

**Branch:** esq/backlog-domain-nature-distribution

**Origin:** main

## Context
Wearing the product-owner hat, the user orders work with `/esq:roadmap plan` but cannot see what the open backlog is
made of. On this repo 199 of 200 rows have a blank Concern. `Concern` cannot tell app security from infra security.
Type cells have drifted (`⚡ perf`, `☑️ task`, `☑️ chore`, `tech-debt`, bare `bug`/`debt`/`improvement`). And no
command counts rows by attribute: `esq state` counts by status only. This plan carries out the grill brief
`docs/plans/2026-11-08-backlog-domain-nature-distribution.brief.md` (backlog row B-199). It changes a documented
behavior: SPEC § Backlog lists the row as `ID · Date · Type · Pri · Rank · …`. That section and § Roadmap are stale
against `plugin/lib/cli.mjs` (`touched`), so this plan cites the code, and `/esq:spec` refreshes the text afterwards
(user-triggered).

## Goal
A product owner running `/esq:roadmap plan` sees, before the order, how many open items serve users versus security,
checks, ops and so on, split app/infra and by nature. When the head of the queue is short on user value, one line
says so and proposes a rebalance. Every row filed from now on is classified when it is written, so the table stays
true without anyone tending it.

## Done looks like
- `esq backlog add` without `--concern` or `--layer`, or with an unknown type word, exits non-zero and lists the
  accepted values.
- Every row in `docs/BACKLOG.md` has a valid Type, Concern and Layer, and `esq validate` passes.
- The distribution command prints concern × layer and type counts over open rows; on this repo the counts add up to the
  open-row total.
- `/esq:roadmap plan` shows the table before the order and, when the head of the queue is dominated by non-user rows,
  one line saying so with a proposed rebalance.
- A `**Tiers:**` term like `security+infra:hi` sorts the matching rows to its tier.
- `./scripts/audit.sh` passes.

## Approaches considered
- **Extend the existing lazy-column machinery (chosen).** Add a `Layer` column next to `Concern` through `widenColumn`.
  Generalize `setConcern` into one internal closed-vocabulary cell setter, which backs `set-concern`, `set-layer` and
  `set-type`. Make `addRow` strict, and add a read-only `esq backlog distribution`. User benefit: the table and the flag
  are computed by the CLI on every derive. Cost: one CLI change plus prose edits at about ten skill call sites.
  Limitation: legacy ledgers stay partly blank until their next derive, as the brief accepts.
- **Validate after the fact instead of at write time** (`esq validate` reds a blank concern/layer). Structurally
  different: the format is policed afterwards instead of being enforced where rows are made. It loses because every
  existing esq project would red at its next session stop. That blocks, and it breaks principle 1.
- Counter-plan (Codex) merged: the same structure. Taken from it: strict type validation kept apart from the lenient
  `typeWord` reader, since `☑️ chore` carries the todo glyph and `typeWord` would accept it; a head window of 5; blank
  concerns counted as unknown, never as non-user. Its `esq state --distribution` and its paid `claude --plugin-dir` runs
  for proof are rejected (see Recommendation and Risks).

## Recommendation
Extend the existing machinery, in three phases. The seam change (strict `add`) ships in the same phase as every one of
its consumers. The backfill runs once the CLI paths exist. The roadmap output comes last, built on the backfilled data.

Decisions taken here (the brief deferred them):
- **Distribution command:** `esq backlog distribution [backlog]`. It is a read-only command in the backlog group, not a
  flag on `esq state`, because roadmap needs this one small answer and none of `state`'s payload. JSON:
  `{ file, statuses: ["Open","Needs-decision","Planned"], total, domain: [{concern, layer, count}…],
  type: {bug, debt, idea, improvement, todo, "(none)"}, unclassified: {concern, layer, type},
  head: {window, size, user, nonUser, unknown, imbalanced, candidates: [B-NNN…]}, table: [<markdown lines>] }`.
  `domain` follows the fixed vocabulary order (concerns as `CONCERNS`, then a `(none)` bucket; layers `app`, `infra`,
  `(none)`) and omits zero cells. `table` is one cross-tab, ready to print: concern rows × `app | infra | — | total`
  columns, a total row, then one line `type: 🐛 6 · ✨ 7 · ⚠️ 3 · …`. Five narrow columns read fine on a phone.
- **Imbalance rule (CLI constants):** `HEAD_WINDOW = 5` and `MIN_USER_SHARE = 0.5`. The head is the first
  `min(5, total)` open rows in the shared rank order (`hi → hi? → … → blank`, then Rank, then ID: the `shared:rank-order`
  rule). `imbalanced` is true when the head's known non-user rows (a non-blank concern other than `user`) outnumber
  `size × MIN_USER_SHARE`, **and** an eligible `user` row exists outside the head. `candidates` lists the first eligible
  user rows outside the head in rank order, as many as would restore the share, each as `{id, pri, raiseTo}`. A row is
  eligible when it is not Needs-decision and no `docs/ROADMAP.md` needs-edge (`rankEdges`) waits on an open row.
  Because the head sorts by level before rank, a rank move alone cannot lift a `lo?` row above five `hi` rows.
  `raiseTo` is therefore the level of the head's last row when the candidate's level sorts below it, else `null`. Blank concerns count as `unknown`, never as non-user.
  Layer plays no part: user value is `concern = user`.
- **Type normalization:** `esq backlog set-type <ids> <bug|debt|idea|improvement|todo>` writes the canonical cell
  (`🐛 bug`, `⚠️ debt`, `💡 idea`, `✨ improvement`, `☑️ todo`). `add` writes the same canonical cell from a valid word,
  with or without its glyph. Validation is strict: it takes the word part, which must be one of the five; a glyph
  cannot carry a wrong word. The lenient `typeWord` stays the reader for legacy cells and tiers.
- **`set-layer` and `set-concern` stay separate** commands, sharing one internal setter. A merged `set-class` would
  rename a documented command for no user gain.
- **`esq validate`:** an off-list Layer is a finding, like Concern. An off-list Type is an **advisory**. Other
  projects' ledgers hold drifted types, and a finding would red their session stop.
- **Hand-written rows go through the CLI.** `work`, `review`, `check` and `fix` today write the row by hand after
  `reserve-id`, which would bypass the strict `add`. They switch to `esq backlog add --concern --layer`, with any detail
  section appended afterwards. That fits the CLAUDE.md rule "Rows move only through `esq backlog add|set-status`".

No outside research: this is an internal ledger format (the brief settled this).

## Phases

### Phase 1 — Classification enforced where rows are written
- **Goal:** every new backlog row carries a canonical Type, a Concern and a Layer, refused at write time otherwise, and
  tiers can name a layer.
- **Files touched:** `plugin/lib/cli.mjs`, `tests/cli/backlog-lens.test.mjs`, `tests/cli/backlog-rank-lifecycle.test.mjs`,
  `tests/cli/corrective-exit.test.mjs`, `tests/cli/autonomy.test.mjs`, `tests/cli/esq.test.mjs`,
  `tests/cli/lessons.test.mjs` (only if its checkable-lesson assertions read row cells),
  `plugin/skills/backlog/SKILL.md`, `plugin/skills/work/SKILL.md`, `plugin/skills/review/SKILL.md`,
  `plugin/skills/check/SKILL.md`, `plugin/skills/fix/SKILL.md`, `plugin/skills/build/SKILL.md`,
  `plugin/skills/build/references/decisions-and-backlog.md`, `plugin/skills/land/SKILL.md`,
  `plugin/skills/promise/SKILL.md`, `plugin/skills/ideas/SKILL.md`, `plugin/skills/ui/SKILL.md`,
  `plugin/skills/plan/SKILL.md` (its expertise-candidate `add`),
  `plugin/skills/roadmap/SKILL.md` (the § Lens tier-word sentence only), `README.md`, `docs/CONFORMANCE.md`
- **Tasks:**
  - Task 1.1: `feat(cli): Layer column, strict backlog add, set-layer and set-type`.
    - `LAYERS = ['app','infra']` and `LAYER_COLUMN = 'Layer'`, widened after `Concern` (anchors `['Concern','Type']`).
    - `addRow` requires a concern and a layer (`none` refused on add) and a type whose word is one of the five. It
      writes the canonical type cell and widens Concern and then Layer before formatting the row. **Every refusal
      happens before `reserveId`**, so a refused call reserves no ID and writes nothing. Each error lists the accepted
      values.
    - The generalized setter backs `set-concern`, `set-layer` and `set-type`: comma-joined ids, one atomic write,
      whole-batch refusal on an unknown or duplicated id, and `none` clears concern and layer.
    - `backlogRows` returns `layer`. `parseTiers` accepts up to three words (at most one type, one concern and one
      layer; its error message names the layers), and `tierOf` matches on layer in both `rankOrder` and `addRow`.
    - `validate` adds the layer finding and the type advisory.
    - The internal `addRow` caller (checkable lesson, `cli.mjs` ≈4732) passes `concern: 'checks', layer: 'app'`.
    - The usage strings are updated (the `add`, `set-*` usages and the top-level one).
    - Tests are updated to pass `concern`/`layer` and to expect the extra columns, with new tests for: each refusal
      and its listed values; no reservation on refusal; `☑️ chore` refused; a bare `bug` written as `🐛 bug`;
      `set-layer`/`set-type` batches; `security+infra:hi` and `app:hi` tiers; an existing two-word `**Tiers:**` line
      still parsing; a legacy ledger without Concern/Layer still reading blank.
  - Task 1.2: `skills: every backlog capture passes --concern and --layer`.
    - Every listed skill call site passes both flags, with the layer rule in one line:
      `app` is the product its users run, `infra` is hosting, CI, environment, release and install.
    - The hand-written row templates in `work`, `review`, `check` and `fix` become `esq backlog add` calls (the
      detail section is appended afterwards), and the `shared:row-header` block they no longer need is removed from all
      four.
    - Split rows (`build` reference, `land`) carry the original row's concern and layer when those are valid. A legacy
      parent with a blank concern or layer, or a drifted type, is classified and normalized by the splitting command,
      which holds the evidence, before it calls `add`. The suite gets a fixture that splits a legacy parent (no
      Concern/Layer columns, type `⚡ perf`) through `add` with the judged values and checks the row is written.
    - `build/SKILL.md`'s `observed:` fragment (≈216) and `plan/SKILL.md`'s expertise-candidate `add` (≈105) name
      both flags as well; the probe found them among the call sites the brief did not list.
    - `/esq:backlog` documents Layer, `set-layer`, `set-type` (its `type:` update now uses it) and a `layer:` update.
      It keeps its "resulting row" line, which starts `| B-NNN | <today>` (`scripts/check-conformance.sh` P-04 reads
      that shape), widened with the Concern and Layer cells.
    - The roadmap § Lens tier-word sentence names the layer words.
    - README: the `/esq:backlog` row and the concern paragraph in § Backlog, roadmap and epics name Layer and the
      stricter `add`.
    - `docs/CONFORMANCE.md` P-06 names the third tier word.
- **Verification:**
  - `(auto)` `node --test 'tests/cli/*.test.mjs'` — the CLI suite passes, including the new refusal, setter, tier and
    legacy-ledger tests
  - `(auto)` `esq backlog add --type perf --summary probe --source manual --concern user --layer app` — exits
    non-zero, names `bug, debt, idea, improvement, todo`, and leaves `docs/BACKLOG.md` unchanged
  - `(auto)` `esq backlog add --type bug --summary probe --source manual` — exits non-zero and names the concern words
    `user, security, legal, checks, deps, ops, internal` (the concern is checked first; the layer refusal is covered by
    the suite)
  - `(auto)` `git grep -nE '\| B-NNN \| <today>|shared:row-header' -- plugin/skills/work/SKILL.md plugin/skills/review/SKILL.md plugin/skills/check/SKILL.md plugin/skills/fix/SKILL.md` — no match (exit 1): no hand-written row template is left
    in a capture skill
  - `(auto)` `git grep -nE 'esq backlog add --' -- plugin/skills | grep -vE -- '--concern .*--layer|--layer .*--concern'` —
    no match (exit 1): every command template in a skill passes both flags

### Phase 2 — This repo's backlog classified, every row
- **Goal:** every one of `docs/BACKLOG.md`'s rows, closed ones included, carries a canonical Type, a Concern and a
  Layer, written only through the CLI.
- **Files touched:** `docs/BACKLOG.md`
- **Tasks:**
  - Task 2.1: `backlog: classify every row by type, concern and layer`.
    - Judge each row from its summary, reading the row's detail only when the summary cannot tell. Layer for esq:
      `app` covers the skills, CLI and hooks a user runs; `infra` covers release, marketplace publishing, CI and
      install.
    - Write sequentially in one chained call, grouped by value:
      `esq backlog set-type … todo && esq backlog set-concern … user && … && esq backlog set-layer … infra`.
    - Normalize the drifted types: `⚡ perf` and bare `improvement` → `improvement`; `☑️ task` and `☑️ chore` →
      `todo`; `tech-debt` and bare `debt` → `debt`; bare `bug` → `bug`.
    - Never hand-edit a cell, and leave every other field and all detail prose as they are.
- **Verification:**
  - `(auto)` `awk -F'|' '/^\| B-/ && ($4 !~ /^ (🐛 bug|✨ improvement|☑️ todo|💡 idea|⚠️ debt) $/ || $5 ~ /^ *$/ || $6 ~ /^ *$/)' docs/BACKLOG.md` —
    prints no row: Type is canonical and Concern and Layer are set on every row (columns 4–6 are Type, Concern, Layer
    once Phase 1's widening has placed Layer after Concern)
  - `(auto)` `esq validate` — passes, with no layer finding and no type advisory

### Phase 3 — The distribution in `/esq:roadmap plan`
- **Goal:** `/esq:roadmap plan` prints the CLI-computed concern × layer and type table before its order, plus one
  imbalance line with a proposed rebalance when the head is short on user value. It also fills blank layers on legacy
  ledgers.
- **Files touched:** `plugin/lib/cli.mjs`, `tests/cli/backlog-distribution.test.mjs` (new),
  `plugin/skills/roadmap/SKILL.md`, `README.md`
- **Tasks:**
  - Task 3.1: `feat(cli): esq backlog distribution`.
    - Implement the shape, order and imbalance rule set in Recommendation, with `HEAD_WINDOW` and `MIN_USER_SHARE` as
      named constants. The command reads only and never writes.
    - Tests cover: sums equal to `total` on both axes; Done/Dropped excluded; a ledger without Concern/Layer counted
      as `(none)`; an empty backlog and one shorter than the window; ties in priority, rank and ID; blank concerns as
      `unknown`; both sides of the threshold; no flag when no user row exists outside the head; the ledger
      byte-identical after the call; a candidate blocked by a needs-edge or in Needs-decision left out; a `lo?`
      candidate under a `hi` head carrying `raiseTo: "hi"`. One fixture also checks that the proposal works: it applies
      the proposal (`set-pri` to `raiseTo` plus a `rank` placement ahead of the head) and asserts the re-run's
      `head.imbalanced` is false.
  - Task 3.2: `roadmap: show the distribution and flag an imbalance`.
    - In Mode A, "Classify what is unclassified, once" also fills a blank layer (grouped `set-layer`, in the same
      chained call), and the report counts classified layers.
    - After `rank --order --lens`, the derive calls `esq backlog distribution` once and prints its `table` above the
      order.
    - When `head.imbalanced`, print one line: `⚠ user value: <user>/<size> at the head — rebalance: <the executable
      commands placing the candidates ahead>`. That is one Mode C placement per candidate (an `add` for a row no
      entry covers), preceded by `/esq:backlog B-NNN pri:<raiseTo>` when `raiseTo` is set. Raising a level is the
      user's call, so it is only proposed. The line goes in the results zone, never NEEDS YOU, and the derive never
      applies it.
    - README: the `/esq:roadmap` row and the roadmap paragraph name the table and the imbalance line.
- **Verification:**
  - `(auto)` `node --test tests/cli/backlog-distribution.test.mjs` — the distribution suite passes
  - `(auto)` `esq backlog distribution | node -e 'const j=JSON.parse(require("fs").readFileSync(0,"utf8"));const rows=require("fs").readFileSync("docs/BACKLOG.md","utf8").split("\n").filter(l=>/^\| B-/.test(l)&&/\| (Open|Needs-decision|Planned) \|$/.test(l)).length;const d=j.domain.reduce((a,r)=>a+r.count,0);const t=Object.values(j.type).reduce((a,n)=>a+n,0);process.exit(j.total===rows&&d===rows&&t===rows&&j.unclassified.concern===0&&j.unclassified.layer===0?0:1)'` —
    exits 0: on this repo both axes add up to the open-row total and nothing is unclassified
  - `(auto)` `./scripts/audit.sh` — PASS (it runs the node product suites itself; no separate `node --test` beside it)

## Risks
- **Pre-mortem:** the likeliest way this goes unused is that the table is printed but nobody reads it, because it
  lands among the derive's other report lines. Task 3.2 places it directly above the order and keeps it to five
  columns. The imbalance line is the only part that asks for attention.
- **The model-side output is not proved by build.** That covers the table's placement, the wording of the imbalance
  line and the derive filling blank layers. Running `/esq:roadmap plan` would reorder the user's real roadmap, and
  fixture runs under `claude --plugin-dir` cost model runs no one has authorized. The first real `/esq:roadmap plan`
  is that observation.
- The strict `add` breaks any capture path this plan misses. A recorded lab transcript (`tests/smoke/fixtures/*.jsonl`)
  that replays an old `add` would show it under `--lab`. That is off the default path, and build re-records only if
  `--lab` is run.
- `addRow` widening both columns changes header widths in existing tests (`esq.test.mjs` asserts 10 cells after the
  first write). Those assertions follow the new width; they are not loosened.
- A non-canonical type cell surviving in another project's ledger stays readable through `typeWord` and earns only an
  advisory: the backfill there happens lazily, through roadmap's classify step.

## Open questions
None. The brief settled every user-owned choice, and the rest is decided above.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-08

**Plan committed at:** d876de0

**Commits:** 69219fa, 423b0b1

**Verified:** 423b0b1893112bee63121a46af6a4ba1d876aa8e
- `node --test 'tests/cli/*.test.mjs'`
- `esq backlog add --type perf --summary probe --source manual --concern user --layer app`
- `esq backlog add --type bug --summary probe --source manual`
- `git grep -nE '\| B-NNN \| <today>|shared:row-header' -- plugin/skills/work/SKILL.md plugin/skills/review/SKILL.md plugin/skills/check/SKILL.md plugin/skills/fix/SKILL.md`
- `git grep -nE 'esq backlog add --' -- plugin/skills | grep -vE -- '--concern .*--layer|--layer .*--concern'`

**What got built:** `esq backlog add` now refuses a row without a concern and a layer, or with a type word off the five, before reserving an ID, and writes the canonical type cell; a Layer column widens after Concern; one closed-vocabulary setter backs set-concern, set-layer and set-type; tiers take a layer word; validate names an off-list layer and advises on a drifted type. Every skill capture site calls `esq backlog add --concern --layer`, the hand-written row templates in work, review, check and fix are gone.

**Verification:**
- (auto) node --test 'tests/cli/*.test.mjs' — 422 pass, 0 fail (≈14 s), including the new refusal, no-reservation, set-layer/set-type, layer-tier, legacy-ledger and legacy-split tests; four source mutations each redden backlog-lens, source restored
- (auto) esq backlog add --type perf … --concern user --layer app — exit 2, `invalid type: perf — one of bug, debt, idea, improvement, todo`, docs/BACKLOG.md byte-identical
- (auto) esq backlog add --type bug --summary probe --source manual — exit 2, `missing --concern — … one of user, security, legal, checks, deps, ops, internal`
- (auto) git grep for `| B-NNN | <today>` / shared:row-header in work, review, check, fix — no match (exit 1)
- (auto) git grep 'esq backlog add --' in plugin/skills without both flags — no match (exit 1)
- (extra) check-structure.sh, check-conformance.sh, check-plugin.sh — exit 0 each (the skill edits earn them; the full audit is the last phase's)

**Surprises / decisions made during execution:** - `esq state --rows` rows now carry a `layer` key; the state test's expected rows were updated (esq.test.mjs), not loosened.
- The checkable-lesson row's template (`BACKLOG_TEMPLATE`) now carries Concern and Layer, and that row is filed `checks`/`app`.
- `--concern none` / `--layer none` on add are refused as missing, matching the plan's 'none refused on add'.
- The legacy-split fixture lives in backlog-lens.test.mjs (Task 1.2's commit), next to the other add tests.
- README's concern paragraph says only an older item's *concern* is classified by the derive today; Phase 3 extends that to layer and should update the sentence.

**Backlog candidates:** None.

**For Phase 2:** 1. `esq backlog set-type <ids> <word>`, `set-concern`, `set-layer` take comma-joined ids and write in one atomic call; set-layer on this repo's ledger widens Layer after Concern on first use.
2. `esq validate` now lists one `non-canonical backlog type for B-NNN` advisory per drifted row (B-072 ☑️ chore, B-117 ☑️ task, B-3000 tech-debt, B-155 improvement, …); Phase 2's done-state is zero such advisories and no layer finding.
3. Phase 3: README § Backlog says the derive classifies only an older item's concern — widen it to layer when roadmap's classify step fills blank layers.

### Phase 2 — completed 2026-11-08

**Plan committed at:** 2fc8125

**Commits:** 8fd843b

**Verified:** 8fd843beb7404876fba98ad74d468936ff156ed1
- `awk -F'|' '/^\| B-/ && ($4 !~ /^ (🐛 bug|✨ improvement|☑️ todo|💡 idea|⚠️ debt) $/ || $5 ~ /^ *$/ || $6 ~ /^ *$/)' docs/BACKLOG.md`
- `esq validate`

**What got built:** All 200 rows of docs/BACKLOG.md carry a canonical Type, a Concern and a Layer, written by one chained call of grouped esq backlog set-type, set-concern and set-layer; the Layer column widened after Concern; only table lines changed.

**Verification:**
- (auto) awk canonical-type / blank Concern / blank Layer scan over docs/BACKLOG.md — prints no row
- (auto) esq validate — valid, 0 findings, 0 advisories

**Decided for you:**
- product: token/turn-cost and telemetry/measurement rows are classified internal, not user, so user means a feature, an output or a defect a user hits (78 user, 65 internal, 49 checks, 5 security, 3 ops) — undo: esq backlog set-concern <ids> user
- architecture: audit.sh checks, lab instruments (probes, journeys, measures) and release/install rows are layer infra; skills, CLI, hooks and their tests are app (136 app, 64 infra) — undo: esq backlog set-layer <ids> app

**Surprises / decisions made during execution:** - Drifted types normalized: B-198 bug; B-3000, B-156, B-174, B-175, B-176, B-179, B-180 debt; B-155, B-170, B-193 (⚡ perf), B-194..B-197 improvement; B-072 (☑️ chore), B-117 (☑️ task) todo.
- B-068 has a blank Status cell; left as is (outside this phase: it touches only Type, Concern and Layer).

**Backlog candidates:** None.

**For Phase 3:** 1. docs/BACKLOG.md is fully classified (0 unclassified concern or layer, canonical types), so Phase 3's on-repo distribution check should see unclassified 0/0.
2. B-068 has a blank Status, so it is not counted as open by the Phase 3 awk row filter (Open|Needs-decision|Planned), and the distribution must not count it either.
3. Open-row concerns lean internal/checks; the imbalance line may fire on this repo, which is expected.

### Phase 3 — completed 2026-11-08

**Plan committed at:** 7669824

**Commits:** 1b49fab, ed9d6e1

**Verified:** ed9d6e1e83fd003450c4aa3d51f45439fc16d176
- `node --test tests/cli/backlog-distribution.test.mjs`
- `esq backlog distribution | node -e 'const j=JSON.parse(require("fs").readFileSync(0,"utf8"));const rows=require("fs").readFileSync("docs/BACKLOG.md","utf8").split("\n").filter(l=>/^\| B-/.test(l)&&/\| (Open|Needs-decision|Planned) \|$/.test(l)).length;const d=j.domain.reduce((a,r)=>a+r.count,0);const t=Object.values(j.type).reduce((a,n)=>a+n,0);process.exit(j.total===rows&&d===rows&&t===rows&&j.unclassified.concern===0&&j.unclassified.layer===0?0:1)'`
- `./scripts/audit.sh`

**What got built:** esq backlog distribution (read-only) counts open rows by concern × layer and by type, prints a ready cross-tab, and flags a head of five short on user value with ranked rebalance candidates (raiseTo when rank alone cannot lift them); /esq:roadmap plan fills blank layers, prints the table above the order and proposes the rebalance in one results-zone line.

**Verification:**
- (auto) node --test tests/cli/backlog-distribution.test.mjs — 10 pass, 0 fail (mutating the share threshold and the eligibility filter turned 4 tests red; source restored)
- (auto) esq backlog distribution | node -e … (on-repo sums) — exit 0: total 17 open rows, both axes sum to 17, unclassified concern 0 and layer 0
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), exit 0 in 25s

**Decided for you:**
- product: the rebalance proposal raises each candidate to the level of the last row still in the head after the move (not the original fifth row), so that placing every candidate ahead actually restores the share; when eligible user rows run out the candidates list all of them even if the share is not fully restored — undo: change the anchor in backlogDistribution in plugin/lib/cli.mjs
- design: the cross-tab labels a blank concern or layer "—", always shows the four count columns, and the type line omits zero counts — undo: distributionTable in plugin/lib/cli.mjs

**Surprises / decisions made during execution:** - The head order breaks ID ties numerically (B-999 before B-1000), whereas rankOrder compares ID strings; numeric is the correct reading of "then ID" for a ledger holding B-3000.
- On this repo the imbalance fires (2/5 user at the head, candidates B-199 and B-001, both raiseTo med), as Phase 2 anticipated.
- The model-side output (table placement, imbalance-line wording, layer fill in the derive) is not proved by build, as the plan's Risks state; the first real /esq:roadmap plan is that observation.

**Backlog candidates:** None.

**For Phase 4:** Last phase: next is /esq:review of the plan; /esq:spec should refresh SPEC § Backlog and § Roadmap (Layer column, distribution command), as the plan Context notes.
