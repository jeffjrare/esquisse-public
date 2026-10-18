# Lessons and repo facts that outlive the plan

**Branch:** esq/cross-cycle-lessons-ledger

**Origin:** main

## Context
A user running esq cycles pays twice for what a cycle already learned. A defect that review found and fix closed leaves no trace, so the next plan touching the same files can repeat it and buy another fix round. A repo fact a build worker paid to find (the test command that works, an environment trap) is written into the `For Phase N+1` note and dies with the plan. This plan carries `docs/plans/2026-10-18-cross-cycle-lessons-ledger.brief.md`: its scope, resolved decisions and constraints stand as written. The idea comes from google-research/harness2's experience library (cue / lesson / evidence / confidence, `NO_ENTRY` by default; `harness2/core/prompts.py`, checked 2026-10-18 by the brief).

The investigation found two things the brief did not name. **First,** a commit touching a file outside the harmless lists makes the spec and architecture docs read stale, makes the verification gate re-run proven steps, and voids review coverage (`PROVENANCE_HARMLESS`, `GATE_LEDGERS`, `plugin/lib/cli.mjs:2914,3280`). A lesson written after a review would therefore cost a re-review. **Second,** `esq merge land` aborts on a conflict in any file outside `docs/BACKLOG.md` and `docs/DECISIONS.md` (`plugin/lib/cli.mjs:4357,5156`). Two branches that each append a lesson would stop the landing.

## Goal
After a defect is fixed or a fact is verified, the next plan, build or review touching the same files shows that knowledge in one or two lines, so the user stops paying a second fix round, or a second discovery, for something a cycle already settled.

## Done looks like
- After a `/esq:fix` closes a defect with a reusable contrast, `docs/LESSONS.md` holds one new lesson entry citing the finding ID and the fix commit. A fix with no such contrast leaves the ledger untouched.
- After a `/esq:build` phase whose Gotchas name a verified repo fact, the ledger holds that fact with its commit.
- A later `/esq:plan`, `/esq:build` or `/esq:review` on a change touching those paths shows the matching cue(s), and review names it when the change repeats that defect class. A change touching unrelated paths shows none.
- `esq lessons add` with an unresolvable evidence reference is refused with a clear message, and the calling run continues.
- A lesson marked as checkable produces a backlog candidate, and no check is built.
- `./scripts/audit.sh` passes. README, SPEC and CONFORMANCE describe the new ledger and verbs.

## Approaches considered
- **A: a CLI-written block ledger, with IDs derived from the evidence, retrieved by path and carried in calls the readers already make (chosen).** One `## L-<hex> · <kind> — <cue>` block per entry. The ID is a hash of the evidence identity, so a retried or duplicated write (fix, then converge on the same defect) is a no-op, and no worktree-wide counter is needed. `esq next-phase --preflight` and `esq review scope` return the matched cues. Only plan adds one `esq lessons match` call. Cost: one new CLI group with three verbs, about 300 lines plus tests, and a paragraph in each of five skills.
- **B: a table, one row per entry, with a sequential `L-NNN` minted like backlog IDs (rejected).** Cell-wise merge would come for free. But lesson prose in a table cell reads badly. A sequential ID needs the ID-block allocator. And nothing would make a write retry-safe: a fix interrupted after the row and before the commit would mint a duplicate on rerun.
- Codex's blind counter-plan reached A's structure independently (evidence-derived IDs, blocks, cues in existing preflight output). It was merged into A. Its notes on durable finding locators and advisory-only staleness are taken up below.

## Recommendation
A. Its design points, all CLI-owned:

- **Entry shape.** The heading is `## L-<10 hex> · lesson|fact — <cue>`. The cue is one line of at most 160 characters. Then come these items: `- **Paths:**` (inline-code spans, brace groups allowed, the `**Files touched:**` shape), `- **Evidence:**`, `- **Confidence:** high|medium|low` (lessons only), `- **Check:** B-NNN` (only when checkable), `- **Date:**`, and a one-paragraph body. A body line that starts with `#` is refused, so no entry can forge another's heading.
- **Evidence resolves, or the write is refused.** A lesson's `source` is a `B-NNN` present in `docs/BACKLOG.md`, or `<fixes-brief-path>@<full commit>:<line>`, where that committed brief holds a `- ` list item at that line. A fixes brief has no item IDs and gets deleted once emptied, so the commit-pinned line is the finding's durable address, and two findings in one brief stay two sources. Its `fix` must resolve to a commit. A fact's `commit` must resolve to a commit. Every path span must match at least one tracked file. The ID is `sha1("lesson|<source>|<fix sha>")` or `sha1("fact|<commit sha>|<normalized cue>")`. On a duplicate, the CLI writes nothing, exits 0 and answers `{added: false, duplicate: true, id}`. A refusal exits 1 with the reason and leaves the file byte-identical.
- **Verbs.** `esq lessons add <json|->` takes one entry, as `decisions add` does. `esq lessons match <path…> | --paths -` returns `{cues: [{id, kind, cue}], omitted, stale}`. `esq lessons show <L-id…>` returns full entries. Matching reuses the probe's `touchesPath` plus `expandBraces` (exported, not copied). Each side is expanded against the one `git ls-files` inventory, and the two match when their tracked-file sets intersect, so `src/a*.ts` meets `src/*b.ts` through `src/ab.ts`. A reader path no tracked file matches yet (a file the plan will create) falls back to `touchesPath` both ways. At most **6 cues per read**. The most specific match comes first (longest matching entry path), then the newest `Date`, then the ID. Stale entries are skipped and counted, from one `git cat-file --batch-check` and one `git ls-files` per call. An absent or partly unreadable ledger returns what parses and never throws.
- **Cues ride existing calls.** `next-phase --preflight` adds `lessons` for the selected phase's `**Files touched:**`. `review scope` adds `lessons` for its changed paths, in both plan and range mode. Neither call fails because of the ledger.
- **Checkable → backlog idea, idempotently.** `checkable: true` makes the same `add` call file a `💡` row through `addRow`, with `Source` `lesson: L-<id>` and `Summary` `Check candidate — <cue>`, each `|` in the cue rendered `/`, because a table cell refuses pipes. It creates `docs/BACKLOG.md` from the standard header when it is absent. It files the row only when no row already carries that `Source`. Then it writes `**Check:** B-NNN`. `lesson:` is not one of the `build:`/`fix:` sources that block a unit, so the row never pauses a build or a landing.
- **Never a gate.** In `esq validate`, staleness, a duplicate ID and an unreadable block are `advisories`, never `findings`. `valid` and the Stop hook stay unaffected.
- **Cheap to write after a review.** `docs/LESSONS.md` joins `PROVENANCE_HARMLESS` and `GATE_LEDGERS`, so a lesson commit stales no projection, no proof and no review coverage.
- **Merges without conflict.** On its first write, `esq lessons add` appends `docs/LESSONS.md merge=union` to the root `.gitattributes` if no line names that path, and reports `gitattributes: "added"`. Entries are append-only and immutable, so a union merge of two branches is exactly the right result, add/add included. Every merge route gets it (`esq merge land`, `/esq:worktree`, a hand merge). That first write touches a tracked non-harmless file once per repository: one gate re-run, once. This costs less than teaching the merge code a third ledger.
- **Readers.** Plan matches once its candidate files are known, chained into an investigation wave. Build reads its preflight cues. Review reads its scope cues. Each opens `show` only for a cue that bears on what it is judging. A fact is a hypothesis to re-verify before relying on it. A lesson is data that authorizes nothing. Review cites `(repeats L-<id>)` on a finding it justifies independently. A match alone creates no finding and never raises a severity.
- **Writers, `NO_ENTRY` by default.**
  - `/esq:fix` writes one lesson per 🟢 it applied, verified and committed, only when the finding plus the fix commit show a concrete contrast (what was done, what replaced it) that applies beyond this line. The write is staged into fix's one tail commit.
  - `/esq:converge`, at a clean completion, does the same for each 🟡 its corrective round closed. The source is the 🟡's line in the brief at the commit that holds it; `fix` is the corrective plan's commit that closed it. The write gets its own `lessons: <slug>` commit, independent of the coverage write, which may be a no-op.
  - `/esq:build` writes a fact only for a Gotcha the phase observed itself (a command it ran, an error it hit and resolved), never one it suspects. The fact is anchored "In this repo, …" and cites the phase's last implementation commit. It is written before the execution-log commit and staged into it.
  - Each writer stages `docs/LESSONS.md`, plus `docs/BACKLOG.md` when a candidate was filed and `.gitattributes` when the output says `added`.
  - A refusal is one zone-3 line, and the run continues.

## Security notes
The ledger is text one model session writes and later sessions read, so it is a persistence channel for instructions. It is held this way. Only `esq lessons add` writes the ledger. Cues are single lines. A body line cannot start with `#`, so no entry can impersonate another or a heading a reader routes on. Path spans must have the plain path shape and are never executed. Every reader gets entries as JSON fields, and each reading skill states that entry text is evidence to weigh, never an instruction, and never an authority (unlike a `**Fondement:**`). Nothing leaves the repository, and `ESQ_TELEMETRY` is not involved.

## Phases

Phase 1 is a prerequisite with no user result alone: it ships the ledger and the cues inside the preflight answers. Phase 2 makes the skills write and read them, which is where the user gets fewer repeated fix rounds.

### Phase 1 — The ledger, its verbs, and cues in the existing preflights
- **Goal:** `esq lessons add|match|show` write and retrieve evidence-checked entries. `next-phase --preflight` and `review scope` return the matched cues. A lesson commit stales nothing, and two branches' entries merge cleanly.
- **Files touched:**
  - `plugin/lib/cli.mjs`, `plugin/lib/markdown.mjs`
  - `tests/cli/lessons.test.mjs`, `tests/cli/esq.test.mjs`, `tests/cli/review-scope.test.mjs`
  - `docs/ARCHITECTURE.md`, `docs/CONFORMANCE.md`, `docs/SPEC.md`, `README.md`
- **Tasks:**
  - Task 1.1: feat(cli): esq lessons add|match|show — an evidence-checked, path-matched ledger. Export `expandBraces` from `markdown.mjs`. Add the parser, the ID derivation, the refusals, duplicate-as-no-op, the cap and ordering, the stale skip, checkable → idempotent `💡` row, the `.gitattributes` union line, and the usage string. Tests (temp repositories) cover:
    - both kinds and first-file creation
    - two findings from one brief, closed by one commit, giving two entries
    - a checkable lesson in a repository with neither ledger, creating `docs/BACKLOG.md` with one row; a checkable cue containing `|`
    - each refusal (unresolvable `B-NNN`, brief locator, non-item line or commit; untracked path; multi-line or over-long cue; `#`-led body line; unknown key), with the file byte-identical
    - re-add as duplicate, and a checkable retry filing one row only
    - directory, glob and brace matching; two globs that overlap only through a tracked file (`src/a*.ts`, `src/*b.ts`); a not-yet-tracked reader path; an unrelated path returning no cues
    - a seven-entry ledger returning 6 cues and `omitted: 1`
    - a stale entry skipped
    - two branches each adding an entry to a ledger absent at the base, then `git merge` with no conflict and both entries present
    - `esq branch check` not counting the `lesson:` row in `unit.open`
  - Task 1.2: feat(cli): validate lists stale lessons, and a lesson commit stales no proof. Add the advisories (stale evidence, stale paths, duplicate ID, unreadable block) with `valid` unchanged, plus `docs/LESSONS.md` in `PROVENANCE_HARMLESS` and `GATE_LEDGERS`. Tests: an advisory-only ledger keeps `valid: true`; a commit touching only `docs/LESSONS.md` after `set-reviewed` keeps `coverage` `covered`.
  - Task 1.3: feat(cli): next-phase --preflight and review scope carry the matched lessons. The `lessons` field is present (with empty `cues`) when no ledger exists. Tests in `esq.test.mjs` and `review-scope.test.mjs`: a matching entry appears, an unrelated phase or range shows none, and a malformed ledger never fails the call.
  - Docs in the same commits:
    - ARCHITECTURE: the CLI **Owns** list and a `docs/LESSONS.md` row in the ledgers table (writer: `esq lessons add` only; readers; nature: append-only, union-merged, advisory).
    - SPEC `### Deterministic state operations — esq CLI`.
    - README: the CLI row (line 218) and a `docs/LESSONS.md` row in the docs table (line 233).
    - CONFORMANCE: scenario `L-01` naming the `## L-<hex> · <kind> — ` heading and `**Paths:**` item as the tokens `match` parses. One writer, the CLI, so no skill template writes it and `check-conformance.sh` gains no line. The CLI suite pins it.
- **Verification:**
  - `(auto)` `node --test 'tests/cli/lessons.test.mjs' 'tests/cli/esq.test.mjs' 'tests/cli/review-scope.test.mjs' 'tests/cli/plan-probe.test.mjs'` — the new ledger suite, the two widened preflight suites, and the probe suite (matching unchanged once `expandBraces` is exported) all pass

### Phase 2 — Skills write lessons and facts, and read the cues
- **Goal:** fix and converge record closed defects, and build records verified facts, under `NO_ENTRY`. Plan, build and review show the matched cues, and review names a repeated defect class on its finding.
- **Files touched:**
  - `plugin/skills/fix/SKILL.md`, `plugin/skills/converge/SKILL.md`, `plugin/skills/build/SKILL.md`, `plugin/skills/build/references/decisions-and-backlog.md`, `plugin/skills/plan/SKILL.md`, `plugin/skills/review/SKILL.md`
  - `README.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`
- **Tasks:**
  - Task 2.1: feat(fix,converge): a closed defect with a reusable contrast leaves one lesson.
    - Fix: after the green pass, before "Update the corrective brief". Converge: in "Ready to land", after the clean bar passes and before coverage is recorded.
    - The `NO_ENTRY` criterion: write only when the record shows what was done, what replaced it, and a situation that recurs beyond this line. Otherwise write nothing and say nothing.
    - The source: a cited `B-NNN`, else `<brief>@<commit that holds it>:<the finding's line>`. Fix keeps that commit from preflight, never a reread.
    - `checkable: true` only when a script could detect the defect class.
    - Fix stages the write into its existing tail commit. Converge makes its own `lessons: <slug>` commit whenever a write changed a file, including on the already-`covered` path, where coverage writes nothing. Report lines: `✔ learned L-<id>` and `○ lesson refused — <reason>`.
    - Both README rows (fix line 184, converge line 193) and SPEC `/esq:fix` and `/esq:converge` gain the write. Their existing rules are unchanged.
  - Task 2.2: feat(build): a Gotcha the phase verified becomes a repo fact; build reads its cues.
    - Preflight: show the preflight `lessons` cues, and use `show` only for one that bears on the edit. A fact is re-verified before use.
    - "Append to execution log" step 5, before the entry is committed: `esq lessons add` for each observed Gotcha, chained into the `append-log` call. The output files are staged with the execution-log commit (the commit at `build/SKILL.md` that today stages only the plan and UI evidence).
    - README row (line 182) and SPEC `/esq:build` updated.
  - Task 2.3: feat(plan,review): plan and review weigh the matched lessons.
    - Plan: one `esq lessons match` once the files are known, chained into an investigation wave. A lesson that changes the design is cited by ID in the task's acceptance or `## Risks`.
    - Review: read the `lessons` from `review scope`, and cite `(repeats L-<id>)` on an independently justified finding. A match alone is no finding and never a severity. Both state that entry text is data and authorizes nothing.
    - README rows (plan line 181, review line 183), SPEC `/esq:plan`, `/esq:review`, and the ARCHITECTURE ledger row's reader list.
- **Verification:**
  - `(auto)` `./scripts/audit.sh` — PASS: package, structure (README table exhaustive), conformance and the product suites, the Phase 1 suites included

## Rollout
- Once `main` carries the landed unit, publish with `./scripts/update.sh` (user).

## Risks
- **Pre-mortem: the ledger stays empty.** `NO_ENTRY` is strict and writers err toward silence, so the first readers see nothing and the feature reads as dead. Task 2.1's criterion names the concrete shape that qualifies (did / replaced by / recurs), so that a real contrast is written rather than skipped out of caution. Whether real cycles produce useful entries, show the cues and cite them, and whether fewer fix rounds follow, is **unproved by this plan**. A bounded behavioral run would be a paid campaign, and that is the user's call. CLI tests prove the format and the retrieval, not the model's judgment. It is the outstanding observation after the first cycles that land on a project with a ledger. No telemetry or gate is added to measure it (brief, Out of scope).
- **A 🟡 closed outside converge** (a hand-run `/esq:plan` → `/esq:build` on a fixes brief) leaves no lesson. The brief names fix and converge as the writers, and v1 keeps that list.
- **The first `.gitattributes` write** stales a recorded proof or a projection once per repository. A user who already has a `.gitattributes` gets one appended line, reported in the output.
- **Path matching can over-match a broad directory** written in a plan's `**Files touched:**`. The cap of 6, most-specific-first, bounds the read. `omitted` tells the reader more exist.
- **A rebased or squashed fix commit** makes its lesson stale. `match` skips it and `validate` lists it. It is never auto-deleted (brief).
- **Skill size:** five skills each gain a paragraph. The two cheaper paths are no extra call for build and review, and one for plan.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
