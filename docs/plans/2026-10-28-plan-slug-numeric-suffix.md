# Keep a plan's own numeric suffix in its slug

**Branch:** esq/plan-slug-numeric-suffix

**Origin:** main

## Context
`canonicalPlanSlug` (`plugin/scripts/hook-io.mjs:63`) strips the date prefix **and any trailing `-<digits>`**, on the assumption that a trailing number is always a finder's uniquifier. It is not: `ship-expertise-batch-2`, `-3` and `-4` are three plans, and every reader that joins on `normalizeSlug` (its re-export, `plugin/lib/cli.mjs:30`) folds them into `ship-expertise-batch`. B-198 records the cost: `/esq:review` on batch-4 took batch-2's `brief(fixes):` record as its delta base (`reviewBriefCandidate`, `cli.mjs:3840`, whose `Source:` check compares normalized slugs) and re-read a 2,800-line diff instead of ~600; telemetry files the three plans under one `planSlug`; `esq brief plan` on a `ship-expertise-batch-2-fixes` brief would refuse with "3 plans carry the slug". The places a `-N` uniquifier really occurs are already handled on their own: a corrective brief's `-fixes(-N)` group by `briefSlug` (`cli.mjs:41`) and `correctiveChain` (`cli.mjs:2364`), and the finders' `-2` on a plan or grill brief (`plan`/`grill`/`ui` SKILL.md step "append `-2`") becomes part of the new artifact's own slug, its branch `esq/<slug>-2` and its commit subjects. No SPEC behavior changes; `docs/SPEC.md:55` is consistent with the fix.

## Goal
A user running `/esq:review`, `esq brief plan`, `esq branch check` or telemetry on a plan whose name ends in a number gets that plan's own history and identity, never a sibling's.

## Done looks like
- Reviewing `ship-expertise-batch-4`-shaped plans never takes `-2`'s fixes brief or review record as the delta base: the review reads only what is new for that plan.
- `ship-expertise-batch-2`, `-3`, `-4` are three identities in every join (plan index, brief→plan, branch ownership, unit sources), and in telemetry `planSlug` for every row written after the release; rows already stored stay as they were (see Risks).
- Corrective chains still resolve exactly as before: `<stem>-fixes`, `<stem>-fixes-2`, `<stem>-fixes-2-fixes` all reach `<stem>`, and depth counts are unchanged.

## Approaches considered
- **Strip only the date in `canonicalPlanSlug` (chosen).** One-line change at the single definition; every caller inherits it. The `-fixes(-N)` uniquifier is already stripped as one group where it can occur (`briefSlug`, `correctiveChain`), so nothing that needs a `-N` removed relies on the generic strip. Limitation: telemetry rows already written for batch-2/-3/-4 stay under `ship-expertise-batch` (the store is append-only; the reader repairs nothing by design).
- **Keep the strip, but only when the un-suffixed plan exists on disk** (structurally different: identity by lookup). Loses: `canonicalPlanSlug` must stay pure (no I/O — the hook writer calls it per spawn), and the answer would change as files appear, so one plan could carry two identities over time.
- **Change the finders' uniquifier to an unambiguous form (`-v2`).** Loses: leaves every existing `-N` plan mis-joined and keeps a rule that guesses from digits.

## Recommendation
Strip only the date prefix. A plan's numeric suffix is part of its name — the finder that added it also wrote it into the branch, the commit subjects and the `plan:` marker, so every other record already treats it as identity. The fix moves the one function into line with them. Recorded as `D-a-plan-slug-keeps-its-numeric-suffix`; it narrows the canonicalization `D-plan-slug-canonicalized-at-the-writer` defines (two admitted forms and writer-side canonicalization unchanged).

## Phases

Single phase.

### Phase 1 — A plan's numeric suffix is its own
- **Goal:** `canonicalPlanSlug` drops only the `YYYY-MM-DD-` prefix, and every join keyed on it tells numbered plans apart while corrective chains resolve as before.
- **Files touched:** `plugin/scripts/hook-io.mjs`, `plugin/lib/cli.mjs` (comments only: lines ~18–40, ~2381–2399, ~2439, ~2891), `plugin/scripts/record-agent-telemetry.mjs` (comment at the `LABEL_PATTERN` block), `tests/hooks/hooks.test.mjs`, `tests/cli/branch.test.mjs`, `tests/cli/esq.test.mjs`, `tests/cli/review-scope.test.mjs`, `.claude/skills/plugin-runtime/SKILL.md` (line 85: "date prefix" only; the `-fixes(-N)` group belongs to the brief/chain readers)
- **Tasks:**
  - Task 1.1: fix(slug): keep a plan's own numeric suffix — `canonicalPlanSlug` strips only the date prefix; rewrite the comments that call `-N` noise to say the `-fixes(-N)` group is stripped by `briefSlug`/`correctiveChain` and a bare `-N` is identity; update `plugin-runtime` SKILL.md line 85. Tests in the same commit:
    - `tests/hooks/hooks.test.mjs:1161` flips to `planSlugFrom('2026-09-06-plan-2') === 'plan-2'`.
    - `tests/cli/branch.test.mjs:155`: `2026-09-01-thing-2.md` leaves the shared-unit fixture (it is no longer `thing`'s sibling); add an assertion that a `thing-2` plan recording `thing`'s branch reads `owned-elsewhere` — the counterexample proving the old fold.
    - `tests/cli/esq.test.mjs` (`esq brief plan` tests near line 726): with plans `batch-2`, `batch-3`, `batch-4` beside a `batch-2-fixes.brief.md` whose `Source:` names `batch-2`, the brief resolves to `batch-2` (previously refused as ambiguous), and a second-round `batch-4-fixes-2.brief.md` naming `batch-4` resolves to `batch-4`; existing `-fixes-2` cases (lines 665–680, 750, 2196–2230) pass unchanged.
    - `tests/cli/esq.test.mjs` (`esq brief pending`): a grill brief `foo-2.brief.md` is consumed by a `foo-2.md` plan and **not** by `foo.md`.
    - `tests/cli/review-scope.test.mjs`: with plans `widget-2` and `widget-4` and a `brief(fixes): widget-2` commit whose brief's `Source:` names `widget-2` (helper `brief(...)` at line 331), `reviewScope` on `widget-4` does not take it as delta base; and once `widget-4` has its own `brief(fixes): widget-4` record (newer or older than the sibling's), `reviewScope` answers a delta from **that** record's `Reviewed at:` stamp, so the fix is proved to narrow, not merely to fall back to full scope.
- **Verification:**
  - `(auto)` `./scripts/audit.sh` — PASS; it runs the `cli` and `hooks` node suites, which carry the new numbered-plan tests and the unchanged `-fixes`/`-fixes-2` chain tests (record in `esq plan append-log`'s `verified` block).

## Rollout
- `(user)` Publish the release with `./scripts/update.sh`, then confirm that the next `/esq:review` on a plan whose slug ends in a number reports a delta base from that plan's own records (or full scope), never a sibling's.

## Risks
- **Pre-mortem — the likeliest way this goes unnoticed:** the fix ships but a reader still strips `-N` through its own regex. Covered: `briefSlug` and `correctiveChain` only strip `-fixes(-N)`; no other `-\d+$` strip exists in `plugin/` (one definition, per `D-plan-slug-canonicalized-at-the-writer`).
- **Historical telemetry stays merged.** Rows already written for batch-2/-3/-4 carry `planSlug: ship-expertise-batch`; nothing rewrites the append-only store. New spawns carry the right slug. Not repaired here; a lab reader can remap via `LEGACY_IDENTITY` if a measurement ever needs it.
- **Same-slug plans on different dates still collide** (`2026-10-01-foo.md`, `2026-10-20-foo.md`): unchanged by this fix and already guarded by `/esq:plan` stopping on an existing `esq/<slug>` branch.
- **A grill brief uniquified as `foo-2.brief.md`** now waits for a `foo-2` plan instead of being consumed by `foo.md`. That is correct (`/esq:plan` derives `foo-2` from it), and the pending-brief test pins it.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
