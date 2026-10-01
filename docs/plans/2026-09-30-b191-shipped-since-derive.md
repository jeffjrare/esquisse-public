# Roadmap refresh notice counts only what shipped since the last derive

**Branch:** esq/b191-shipped-since-derive

**Origin:** main

## Context
`/esq:roadmap`'s bare refresh prints `Order derived against an older state — /esq:roadmap plan to re-derive.` when "the retained Shipped tail plus this run's evictions totals three or more" (`plugin/skills/roadmap/SKILL.md:125`). Mode A keeps the previous Shipped tail (line 80), and the tail holds five lines, so once five entries have shipped every refresh nags, including the one right after a derive. Real case: derive `11a445e` (2026-09-30) committed a 5-line tail, and a refresh straight after it counts 5 ≥ 3. The notice is computed by the model from prose. Nothing records which Shipped lines the last derive already took into account. B-191 is the backlog row.

## Goal
A user who just ran `/esq:roadmap plan` and then `/esq:roadmap` sees no re-derive notice. They see it again only once three entries have shipped since that derive, so the notice means something again.

## Done looks like
- Right after a derive, a bare `/esq:roadmap` prints no `Order derived against an older state` line, even with a full five-line Shipped tail.
- After a derive, the notice comes back once three entries have shipped. These are lines added to Shipped since the derive commit plus this run's evictions.
- A repository whose history holds no derive commit (a roadmap never derived through `/esq:roadmap plan`) behaves as today: it counts the whole retained tail. `esq state` already requires a git repository (`plugin/lib/cli.mjs:2059`), so a non-git directory is out of scope.
- The count comes from `esq state`. The model never works it out from git history by hand.

## Approaches considered
- **CLI field from the last derive commit (chosen).** `roadmapState` already parses `docs/ROADMAP.md` for `esq state`, which Mode B reads once anyway. It also parses the `## Shipped` lines (`- <date> · <slug> — …`), finds the newest commit whose subject starts with `roadmap: derive` (Mode A's fixed subject, SKILL line 99), and parses that commit's Shipped lines. `sinceDerive` is the number of current lines whose `date · slug` key that version did not hold. Cost: two git calls inside a read the skill already makes, and no change to the file format or to any writer. Limitation: with no derive commit the answer is `null`, which falls back to today's behaviour.
- **A marker or counter the derive writes into the file** (e.g. `<!-- derived-through: <date> · <slug> -->`, or a cumulative shipped-since-derive count that derive resets and each eviction increments; Codex's counter-plan proposed the latter). It works without git, but every Mode A run, and every refresh or edit that evicts, has to maintain it, so it adds a new parsed format and a new writer obligation the model can forget. A forgotten marker brings the bug back without anyone noticing. It loses because the derive commit already records the same fact.
- **Prose only** ("count lines dated after the last derive"): dates are day-granular (`11a445e` and three of its tail lines share 2026-09-30), and the model would re-read git history on every run, which is exactly the work CLAUDE.md rule 3 gives to the CLI. Rejected.

## Recommendation
Use the CLI field. `esq state` gains `roadmap.shipped: { retained, sinceDerive }`. `retained` counts the parsed Shipped lines, and `sinceDerive` is the count above or `null` when no derive commit or historical file can be read. The skill's notice becomes `(sinceDerive ?? retained) + this run's evictions ≥ 3`, and Mode A never prints it (its own run is the derive). The key is `date · slug` and not the whole line, so a later edit to an entry's prose does not make it look new. The fallback to `retained` keeps today's behaviour exactly where no derive can be found, instead of staying silent. `D-the-roadmap-is-read-beside-the-ledger` (no git call) governs ledger *verbs* such as `backlog rank`. `esq state` already calls git (`branch`, `inFlight`), so this does not conflict.

## Phases

Single phase: the field and its one consumer ship together, because the field alone changes nothing a user sees.

### Phase 1 — Count Shipped lines since the last derive
- **Goal:** `esq state` reports how many Shipped entries are new since the last derive, and `/esq:roadmap` bases its notice on that number.
- **Files touched:** `plugin/lib/cli.mjs`, `tests/cli/roadmap-shipped.test.mjs` (new), `docs/CONFORMANCE.md`, `docs/ARCHITECTURE.md`, `plugin/skills/roadmap/SKILL.md`
- **Tasks:**
  - Task 1.1: `feat(cli): esq state reports Shipped entries added since the last roadmap derive`:
    - In `roadmapState` (`plugin/lib/cli.mjs:1926`), parse `## Shipped` lines matching `^- (\d{4}-\d{2}-\d{2}) · (\S+)` into `date · slug` keys. Add a small helper that both the current text and the historical text go through.
    - Look up `gitTry(repository, ['log', '--format=%H %s', '--grep=^roadmap: derive'])`. Leave out the `-- docs/ROADMAP.md` path filter, because a derive that changed only the backlog still commits under the derive subject. `--grep` also matches lines in the commit body, so take the first line whose *subject* starts with `roadmap: derive`. Then call `gitTry(repository, ['show', `${sha}:${file}`])`. A failed or empty lookup, or a commit where the file does not exist, gives `sinceDerive: null`.
    - Return `shipped: { retained, sinceDerive }` beside `freshness`. The read-error branch returns no `shipped`.
    - New test file, using real git in a throwaway repo the way `tests/cli/branch.test.mjs:25` does, with `ESQ_TEST_GIT_ROOT` unset. It covers four cases:
      1. Derive commit with a 5-line tail and an identical working tree → `{ retained: 5, sinceDerive: 0 }`. This is the B-191 case.
      2. A refresh commit adds one line on top and trims the oldest → `sinceDerive: 1` with `retained: 5`.
      3. History holding only a `roadmap: refresh state` commit → `sinceDerive: null`.
      4. No `## Shipped` section → `retained: 0`.
      5. Three lines added since the derive → `sinceDerive: 3`. A second derive commit after them → back to `0`.
      6. A newer `roadmap: refresh state` commit whose *body* has a line starting with `roadmap: derive` does not become the baseline.
      7. A derive commit that touched only `docs/BACKLOG.md` is still the baseline.
    - Add a CONFORMANCE scenario for the Shipped line and the `roadmap: derive` subject as parsed formats.
    - Add one clause to ARCHITECTURE's `state` paragraph.
  - Task 1.2: `fix(roadmap): the refresh notice counts Shipped entries added since the last derive`. Rewrite `plugin/skills/roadmap/SKILL.md:125`: the notice fires when `roadmap.shipped.sinceDerive` (else `retained` when it is null) plus this run's evictions is ≥ 3, and Mode A never prints it. Keep "a notice, never authorization to re-derive". Line 127's "In A/C reuse these refresh rules" must not reintroduce the notice in A.
- **Verification:**
  - `(auto)` `node -e "import('./plugin/lib/cli.mjs').then(async (m) => { const s = (await m.state('.')).roadmap.shipped; console.log(JSON.stringify(s)); if (s.sinceDerive !== 0) process.exit(1); })"` — on this repository, whose `docs/ROADMAP.md` Shipped tail is unchanged since derive `11a445e`, prints `{"retained":5,"sinceDerive":0}` and exits 0
  - `(auto)` `./scripts/audit.sh` — PASS. It runs the CLI product suite, including `tests/cli/roadmap-shipped.test.mjs` with its seven cases, and the skill/structure checks.

## Risks
- **Pre-mortem: the user never sees a difference because the derive commit is not found.** A derive committed under another subject (hand-edited, or a future subject change) gives `null`, and the fallback brings back the old nagging. Task 1.1's CONFORMANCE scenario names the subject as a parsed format, so changing it in SKILL line 99 is visibly a contract change.
- `git log --grep=^roadmap: derive` reads the whole commit history on every `esq state`. That is one pass, and it matches few commits. Watch the `esq state` wall-clock in the test run, but add no cache.
- **The skill side is not machine-proved.** The audit does not check what the prose means (`scripts/audit.sh`), so these three points rest on Task 1.2's wording and on review: Mode A stays silent, `0` is not read as `null` (use `??`, not `||`), and evictions are added once. They are observable the next time `/esq:roadmap` runs after a derive.
- A derive that changes nothing creates no commit, so the older derive stays the baseline. That case is rare, because a derive regenerates every `state:` line and re-ranks the backlog. Accepted rather than forcing empty commits.
- A derive done on another branch and not yet merged is invisible from the current branch, which falls back to the older derive. That is correct for that branch's file.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
