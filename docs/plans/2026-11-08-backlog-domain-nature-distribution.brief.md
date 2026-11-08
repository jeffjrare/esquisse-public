# Brief: Every backlog row classified by domain and nature, with its distribution in the roadmap

## Task
The user, wearing their product-owner hat, orders work with `/esq:roadmap plan` and cannot see what the open backlog is
made of: most rows carry no Concern, `Concern` cannot tell app security from infra security, Type values drift (`⚡ perf`,
bare `improvement`), and no command counts rows by attribute (`esq state` counts by status only). After this change every
row carries a nature (Type, closed list) and a domain (Concern × a new Layer, `app | infra`), set when the row is written
and validated by the CLI. `/esq:roadmap plan` prints a compact distribution table that the CLI computes, and says in one
line when user value is underrepresented at the head of the queue, proposing a rebalance the user accepts or ignores.
The table does the job of the requested radar and stays readable in a terminal and on a phone.

## In scope
- **Layer**, a second closed axis beside Concern: `app` (the product the user ships, which users touch) | `infra`
  (hosting, CI, environment setup, release, the machinery around the product). "App security" = `security`+`app`,
  "infra security" = `security`+`infra`, "infra setup" = `ops`+`infra`. A lazy column placed after Concern and added on
  first write, like Concern and Rank.
- CLI: `--layer` on `esq backlog add`, an `esq backlog set-layer <ids> <app|infra|none>` matching `set-concern`, and
  `esq validate` reporting an off-list layer.
- **Reliability at write time:** `esq backlog add` refuses a row with no `--concern` or no `--layer`, and refuses a
  `--type` whose word is not one of the five known (bug, debt, idea, improvement, todo). The error message lists the
  accepted values, so the calling model corrects itself in one turn.
- Every skill call site of `esq backlog add` passes `--concern` and `--layer`: backlog, work's capture template, build's
  observed/split rows (`build/SKILL.md`, `build/references/decisions-and-backlog.md`), land's split, fix, check, review,
  promise, ideas.
- Roadmap tiers accept a layer word (`security+infra:hi`, `app:hi`). A term joins at most one type, one concern and one
  layer.
- **One-time backfill of every row in this repo's `docs/BACKLOG.md`**, closed rows included (the mandate says every row).
  Concern and layer are inferred from the summary and the row's detail only when the summary cannot tell. Drifted Type
  cells are normalized at the same time (`⚡ perf` → `✨ improvement`, bare `improvement` → `✨ improvement`).
- `/esq:roadmap plan`'s "classify what is unclassified, once" step also fills a blank layer, so projects that already
  exist get backfilled the same lazy way.
- A deterministic distribution command (the CLI owns the counts) over Open, Needs-decision and Planned rows: counts by
  concern × layer and by type, unclassified rows counted as such.
- `/esq:roadmap plan` prints that table before its ordering, then one imbalance line when it applies, with a proposed
  rebalance. It informs and never blocks.
- README and the backlog and roadmap skills document Layer, the new command and the stricter `add`, in the same commit.

## Out of scope
- A rendered radar or HTML page. The table replaces it.
- The table in `/esq:status`, `/esq:advance` or `/esq:backlog`. It lives in roadmap only.
- Per-project domain vocabularies. Concern and layer are the same closed lists in every project.
- Automatic quotas or a CLI reordering from the distribution. The imbalance line proposes; the user decides.
- New Type values (no `perf` type). Performance is an improvement whose concern says what it serves.
- Changing the seven concern words or their meanings.
- Migrating other projects' backlogs in bulk. They get backfilled lazily by their next `/esq:roadmap plan`.
- Charting history (distribution over time, closed-row trends).

## Resolved decisions
- Domain shape: Concern + a Layer column `app | infra`. User chose. It keeps one vocabulary across projects, which the
  CLI's tier sort needs.
- Display: a compact table inside `/esq:roadmap plan`. User chose.
- Effect on planning: an imbalance flag plus a proposed rebalance, never a gate. User chose. This matches the maximand
  (value first, never block).
- Rows classified: every row, closed included. The mandate says "every", and one pass over summaries costs little.
  Done/Dropped rows still stay out of the distribution counts, which describe open work.
- Classification is enforced at write time by the CLI, not checked afterwards. Inferred from CLAUDE.md principle 3
  (deterministic where it can be) and principle 5 (a guard verifies a parsed format is intact). A blank cell then means a
  legacy row, never a new one.
- Type normalization: the five existing type words are the closed nature list, and `⚡ perf` folds into improvement.
  Inferred from `TYPE_WORDS` in `plugin/lib/cli.mjs`: a perf row falls in no tier today.
- Layer for esq itself: `app` = the skills, CLI and hooks a user runs; `infra` = release, marketplace publishing, CI and
  install. Inferred from the repo map.
- No outside research: this is an internal ledger format with no dependency and no ecosystem pattern to follow.

## Constraints & context
- Existing machinery to extend, not duplicate: `CONCERN_COLUMN`/`CONCERNS`/`concernValue`, `setConcern`, `widenColumn`,
  `parseTiers`/`tierOf`, `addRow` and the `validate` concern finding in `plugin/lib/cli.mjs`. The `plugin-runtime` rules
  apply: atomic writes, JSON output, structure only.
- Rows move only through `esq backlog add|set-*`. The backfill uses `set-concern`/`set-layer` grouped by value in one
  chained call, never a hand edit. Type normalization needs a CLI path too (none exists today; the planner decides its
  shape).
- Older ledgers without Concern or Layer columns must keep parsing; a missing cell reads as blank.
- `parseTiers` throws on unknown words. Adding layer words must keep existing `**Tiers:**` lines valid.
- Value-first ordering stays the rule (memory: value first in every ordering). The imbalance line serves that rule and
  never overrides the user's ranking.
- README is public: the `/esq:backlog` and `/esq:roadmap` rows and their paragraphs change in the same commit.
- Trust boundary checked: there is no new input surface beyond CLI flags validated against closed lists, and no user
  data leaves the machine.

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

## Deferred to planning
- The distribution command's name, its JSON shape and how the table is laid out (two small tables or one cross-tab).
- The exact imbalance rule (the head window size, the user-share threshold), stated as a constant the CLI computes.
- How Type normalization is written (a `set-type` command or a one-off migration path) and whether `validate` flags an
  off-list type.
- Whether `set-layer` and `set-concern` merge into one `set-class` call.
- Phasing: CLI and validation first, then call sites and the backfill, then roadmap output.

## For /esq:plan
<!-- This brief is the scoped input for /esq:plan. Run /esq:plan in a fresh session; it
will detect and consume this brief. Do not edit below this line. -->
