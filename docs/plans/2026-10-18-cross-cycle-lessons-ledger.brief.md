# Brief: Lessons and repo facts that outlive the plan

## Task
A user running esq cycles pays twice for what a cycle already learned. A defect that review found and fix closed leaves no trace, so the next plan touching the same files can repeat it and buy another fix round. A repo fact a build worker paid to discover, such as the test command that actually works or an environment trap, is written into the "For Phase N+1" hand-off and dies with the plan. After this change, esq keeps a `docs/LESSONS.md` ledger of two kinds of entry: **lessons** drawn from closed defects and **facts** drawn from build's hand-off. Plan, build and review read only the entries whose paths match the files in hand. The result is fewer corrective rounds on defect classes already seen and less rediscovery, so more shipped features for the same tokens. Inspired by the harnessing-level recursion in google-research/harness2 (arXiv 2610.14224): a per-domain experience library with cue / lesson / evidence / confidence entries and `NO_ENTRY` as the default.

## In scope
- New ledger `docs/LESSONS.md`, written only by the CLI (`esq lessons add`), one writer.
- Entry kinds: `lesson` (cue = shape of the situation, lesson = the operation to perform naming the component, evidence, confidence, paths) and `fact` (the verified fact, anchored "in this repo…", evidence, paths).
- Lesson writers: `/esq:fix` and `/esq:converge` when they close a defect. At most one entry per closed defect, and `NO_ENTRY` by default: an entry is written only when the record shows a concrete, reusable contrast.
- Fact writer: `/esq:build`, from the phase's Gotchas, only for facts the phase verified.
- Retrieval: `esq lessons match <paths>` is deterministic and path-based. It reuses the path matching behind `esq plan probe` and returns the matching cue lines only. The full entry is opened on demand.
- Readers: `/esq:plan` (avoid the trap when designing), `/esq:build` (warned while writing), `/esq:review` (checks the change does not repeat a known defect class).
- Promotion flag: an entry whose lesson could be a deterministic check is marked so. The writer then files a backlog candidate through `esq backlog add`. It never builds the check itself.
- README rows and paragraphs for every command whose behavior changes, plus SPEC/ARCHITECTURE/CONFORMANCE updates for the new parsed format, in the same commits.

## Out of scope
- harness2's per-task Propose–Probe–Compose (k candidate executions) and its blind anonymized selection. Both multiply cost per task.
- Building the deterministic checks that flagged lessons suggest. Those go to the backlog and the user decides.
- Lessons about esq's own development (skill edits, measurement verdicts). This is a product feature for the user's project. The lab-side "helped / hurt / confounded" verdict table is a separate idea.
- Any gate: a missing, stale or unmatched lesson never stops a command. No lesson ever blocks delivery.
- Semantic or embedding retrieval, and model-ranked relevance. Matching is by path only.
- Editing or merging existing entries by the model. Correction goes through the CLI or by hand.
- Writing lessons into CONVENTIONS.md, CLAUDE.md or DECISIONS.md. DECISIONS keeps its registry bar (decisions later work could break). A lesson is not a decision and authorizes nothing.
- Cross-project or global lessons, and telemetry on lesson use.

## Resolved decisions
- Home: a new `docs/LESSONS.md` with path-matched retrieval, not CONVENTIONS.md (user chose). The read cost stays flat as entries accumulate. CONVENTIONS.md is read in full on every run.
- Facts in v1: yes, same ledger, `kind: fact` (user chose). Build's Gotchas are already written and currently lost.
- Readers: plan, build and review (user chose). Review is the reader that turns a lesson into a fix round avoided.
- Promotion to a check: flagged and filed as a backlog candidate, never built automatically (user chose).
- Default is `NO_ENTRY`: an entry needs a concrete contrast from the record. A guessed lesson poisons later cycles. Taken from harness2's `experience()` prompt (github.com/google-research/harness2 `harness2/core/prompts.py`, checked 2026-10-18).
- Evidence must resolve: a lesson cites the finding or backlog ID and the fix commit, and a fact cites the commit of the phase that verified it. This is the guard CLAUDE.md allows: *a reference resolves*. Nothing checks the prose.
- A fact is a hypothesis on reuse: readers re-verify before relying on it, never trust it blindly. Taken from harness2's GENERALIZE block (same file, checked 2026-10-18).
- Lesson text is data, not instructions: readers treat an entry as evidence to weigh, never as a command. It cannot authorize anything (unlike a DECISIONS entry with `**Fondement:**`).
- Writing never stops an unattended run: fix and converge write or skip silently under `NO_ENTRY`. A refusal from `esq lessons add` (unresolvable evidence) is reported in one line and the run continues.
- Read bound: `esq lessons match` returns cue lines only, capped, so a reader's cost is stated before it is spent. The exact cap is the planner's call.
- Staleness: an entry whose evidence commit no longer resolves, or whose paths no longer exist, is reported by the CLI (skipped by `match`, listed by `esq validate`). It is never auto-deleted.

## Constraints & context
- CLAUDE.md: the CLI owns structure, IDs and invariants, and the model owns judgment (whether to write an entry, its wording). No prose fallback recomputes the ledger by hand.
- CLAUDE.md: one writer per file. `docs/LESSONS.md` is written only by `esq lessons add`. Changes to what a skill reads or writes in `docs/` follow ARCHITECTURE `§ docs/ — ledgers and projections`.
- CLAUDE.md: a guard verifies that a reference resolves or a parsed format is intact, never that a sentence is present. The new format is listed in `docs/CONFORMANCE.md`.
- CLAUDE.md: README is updated in the same commit as any change to what a command does, takes or returns. That covers fix, converge, build, plan and review, plus the new `esq lessons` CLI verbs.
- `esq plan probe` (commit c60437a, `plugin/lib/markdown.mjs`) already expands inline-code path spans and brace groups. Retrieval reuses that matching rather than a second matcher.
- SPEC `/esq:fix` and `/esq:converge` rules stand unchanged: a two-generation corrective bound, closing only rows a green fully delivers, and an emptied brief handing back to review. Lesson writing adds to them and alters none.
- Spend tokens like money: no new subagent and no new tool round-trip where an existing call can carry it (for example, preflight output may carry matched cues).
- `ESQ_TELEMETRY=off` is unaffected: the ledger is project docs, not telemetry.

## Done looks like
- After a `/esq:fix` closes a defect with a reusable contrast, `docs/LESSONS.md` holds one new lesson entry citing the finding ID and the fix commit. A fix with no such contrast leaves the ledger untouched.
- After a `/esq:build` phase whose Gotchas name a verified repo fact, the ledger holds that fact with its commit.
- A later `/esq:plan`, `/esq:build` or `/esq:review` on a change touching those paths shows the matching cue(s), and review names it when the change repeats that defect class. A change touching unrelated paths shows none.
- `esq lessons add` with an unresolvable evidence reference is refused with a clear message, and the calling run continues.
- A lesson marked as checkable produces a backlog candidate, and no check is built.
- `./scripts/audit.sh` passes. README, SPEC and CONFORMANCE describe the new ledger and verbs.

## Deferred to planning
- Exact `docs/LESSONS.md` format (table vs blocks), ID scheme, and how paths are stored and matched (glob, prefix, brace groups as in probe).
- CLI surface beyond `add` / `match`, such as `list` and stale reporting in `esq validate` or a dedicated verb.
- The cap on matched cues per read, and whether matched cues ride in existing preflight output (`esq next-phase --preflight`, `esq review scope`) instead of a separate call.
- Where in each skill the write and read happen, and the wording of the `NO_ENTRY` criterion in fix and converge.
- How build distinguishes a verified fact from an unverified gotcha in its hand-off payload.
- How review reports a repeated known defect class: as a finding with severity, or as context on an existing finding.
- Phasing and test fixtures.

## For /esq:plan
<!-- This brief is the scoped input for /esq:plan. Run /esq:plan in a fresh session; it
will detect and consume this brief. Do not edit below this line. -->
