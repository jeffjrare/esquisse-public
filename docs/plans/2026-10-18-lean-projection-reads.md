# Read the spec and architecture by section, know when they are stale, read CLAUDE.md once

**Branch:** esq/lean-projection-reads

**Origin:** main

## Context
Every esq skill that plans, reviews or ideates reads `docs/SPEC.md` and `docs/ARCHITECTURE.md` whole. Measured 2026-10-18 on the user's projects: events-tracker's SPEC is 426 KB (~105k tokens), 28% of it dated history comments (`<!-- mis à jour … -->`, `<!-- modifié … -->`, a 58 KB changelog preamble), and its ARCHITECTURE is 231 KB. `/esq:ideas` reads both in one turn (~160k tokens); review and check are told to read "the feature sections the diff touches" but nothing can cut a section out, so each run greps headings ad hoc. Those projections are also stale today (731 changed paths since the SPEC marker on assets-prospection, 238 on events-tracker), and only `/esq:plan` knows to distrust a stale rule; review and check can turn a rule an earlier, already-landed change superseded into a finding against the change under review — even a 🟡 corrective plan. Finally, Claude Code already loads the project's root `CLAUDE.md` into every session, yet eleven skills spend a preflight Read on it again.

## Goal
Every esq run on a project with a large spec and architecture pays only for the sections it uses, knows which of those sections may describe code that has since changed, and never re-reads `CLAUDE.md` — so planning, reviewing and ideating cost a fraction of today's tokens on events-tracker-sized projects without losing any evidence they relied on.

## Done looks like
- On events-tracker, a review of a change touching one feature loads the SPEC outline plus that feature's section, not 426 KB; `/esq:ideas` loads the outline and the sections its focus needs, not SPEC and ARCHITECTURE whole.
- The text a skill receives from the spec carries no history comments; git still holds every one of them.
- A review or check never files a finding against the change under review for a spec rule the code already broke on the base before it (an earlier landed change the spec never caught up with): that difference is reported as spec staleness instead.
- A plan sees which documented features describe code changed since the projection was mined, and inspects that code instead of trusting the text.
- No skill except `/esq:arch` and `/esq:harvest` (the two that edit or mine it) issues a Read of `CLAUDE.md`, and every skill still honors its conventions.
- `/esq:status` reports projection staleness from the same verdict `/esq:land` uses, not a days-or-phases guess.
- `/esq:spec` stops growing the spec with dated history comments; the refresh's change summary lives in its commit body.

## Approaches considered
- **CLI section reader over the two projections (chosen).** `esq projection outline <spec|arch>` returns the heading tree with line ranges, per-section byte cost and a one-line lead, plus the projection's freshness computed by the same code as `esq projections`; `esq projection read <spec|arch> [<id>…]` returns only the named sections, history comments stripped. Benefit: deterministic slicing every skill shares, freshness in the same answer, ~28% saved on comments before any slicing. Cost: one CLI verb pair and one prose pass over seven reader skills.
- **Skills use `grep -n '^#'` then `Read` with offset/limit.** No CLI change, but every run re-derives section boundaries (fenced code, nesting, the preamble) in prose, keeps paying for the comments, and gets no freshness — the "work a script could settle, paid again on every run" CLAUDE.md forbids.
- **Generic `esq docs outline|read <any file>` (Codex's counter-plan).** Same mechanism over any Markdown file, DECISIONS included. Loses: DECISIONS is already read by its index and selected entries, an arbitrary-path reader widens what the CLI can be pointed at for no current need, and freshness only exists for the two projections. Its structural points are kept: subtree sizes before selection, overlapping selections emitted once, a refused unknown id rather than a whole-file fallback.
- **Shrink the files instead (cap ARCHITECTURE.md, prune SPEC).** Lowers every read, but a cap trims design detail the owner judged worth keeping and still makes a one-feature review read every feature. Only the history comments are pruned at the source (`/esq:spec` stops writing them), because git already holds that history.

## Recommendation
The CLI section reader. Section identity, boundaries, comment stripping and freshness are structure — the CLI owns them; which sections matter stays the model's choice. Freshness reuses `esq projections`' computation through one extracted helper, so landing, status and readers can never disagree.

Contract, settled here:
- **Sections.** Headings of level 2–4 outside fenced code, ATX only (esq's writers emit nothing else), CRLF tolerated. A section runs from its heading to the next heading of the same or higher level, children included. `id` is the document-order index; `0` is everything before the first `##` (title, marker, intro). Each outline entry: `id`, `level`, `heading`, `from`/`to` (1-based inclusive lines of the source file), `bytes` (UTF-8, after stripping — what reading it costs, subtree included), `lead` (first non-empty stripped line under the heading, ≤160 chars).
- **Stripping.** `read` removes every `<!-- … -->` block (single- or multi-line) except the projection's own marker line, then collapses the blank-line runs that leaves. Outline reports `bytes` (raw whole file) and `strippedBytes` (comments removed). Nothing else in the text changes.
- **read.** Ids select subtrees; a child whose parent is also selected is emitted once, inside the parent; output in document order. No ids → the whole stripped document. An unknown id refuses (exit 1) naming the valid range — never a fallback to the whole file. Each emitted section carries `id`, `heading`, `from`, `to`, `text`.
- **Freshness.** Both answers carry `freshness: { verdict, date, at, reason, changedCount }` — `projections()`' entry for that projection, minus its full `changed` list (731 paths is the cost this plan removes). A missing file answers `exists: false`, exit 0.
- **touched.** `outline --paths <file>|-` (the `esq lessons match` convention) intersects the given repo-relative paths with the paths changed between the marker commit and `--upto <commit>` (default `HEAD`), and returns them as `touched`. When the marker commit is not an ancestor of `--upto` (the projection was mined after it), `touched` is `[]` with that reason. When freshness is not provable (no marker, legacy, malformed, unknown commit), `touched` is `null`: every rule a reader relies on counts as unverified.
- **Reader rules.** Plan: the outline (no paths) is the feature map at step 1; once the input is resolved and its candidate files are known, `outline --paths` at HEAD rides the investigation wave that already runs `esq lessons match`, and a feature whose code is in `touched` — or whose code the run cannot map to paths — is an evidence gap: inspect the code (plan's existing rule, now deterministic). Review: `--paths` = the diff's paths, `--upto <base>` from `esq review scope`. Check: the same, with its own whole-plan audit range base (the earliest implementation commit's parent), never review's delta base, so a defect an earlier phase of the plan introduced stays this plan's. Before **any** spec rule becomes a finding, compare it with the code **at that base** (`git show <base>:<path>`): already different there → spec staleness note (`→ run /esq:spec`), never a finding against this change — a refresh can keep a rule the code already broke, so an empty `touched` proves nothing; `touched` only tells the reader which rules to suspect while reading. Never a stop, never a refresh prerequisite.

## Phases

### Phase 1 — `esq projection outline|read`
- **Goal:** the CLI cuts a projection into sections, strips its history comments and says which given paths changed since it was mined.
- **Files touched:** `plugin/lib/markdown.mjs`, `plugin/lib/cli.mjs`, `tests/cli/projection-read.test.mjs`, `tests/cli/landing.test.mjs`, `README.md`
- **Tasks:**
  - Task 1.1: Add `parseSections(text)` and `stripComments(text, keepLine)` to `plugin/lib/markdown.mjs` — pure functions implementing the Sections and Stripping contract above.
  - Task 1.2: Extract the per-projection freshness computation out of `projections()` into one helper (`projectionFreshness`) that `projections()` keeps using unchanged, and let `provenSince` take an optional upper commit; then add `projectionOutline` / `projectionRead` and the `esq projection outline <spec|arch> [--paths <file>|-] [--upto <commit>]` / `esq projection read <spec|arch> [<id>…]` dispatch beside `projections`, with the usage line updated. Tests in `tests/cli/projection-read.test.mjs` over a temporary git repo: nested `##`/`###` subtrees and the preamble id 0; a `## ` line inside a fenced block is not a heading; CRLF; multi-line comments stripped while the `last-spec` marker survives; parent+child selected → child emitted once; unknown id refuses with exit 1; no ids → whole stripped document; `touched` for a path changed after the marker, `[]` for a path unchanged, `[]` with reason when `--upto` predates the marker, `null` without a marker; arch freshness found through the `CLAUDE.md` marker fallback; missing file → `exists: false`; a SPEC-shaped fixture carrying `mis à jour` / `modifié` history comments reports `strippedBytes < bytes` and a narrow read whose text contains no other section's heading.
  - Task 1.3: README — the CLI row of the architecture table names `esq projection outline|read` (section reads of the spec and architecture, with their freshness).
- **Verification:**
  - `(auto)` `node --test 'tests/cli/projection-read.test.mjs' 'tests/cli/landing.test.mjs'` — the new reader suite passes, and the landing suite's `projections()` verdicts are unchanged by the extraction

### Phase 2 — Every reader uses it; CLAUDE.md is read once
- **Goal:** each skill loads the outline and only the sections it needs, judges stale rules against the base, and stops re-reading `CLAUDE.md`.
- **Files touched:** `plugin/skills/plan/SKILL.md`, `plugin/skills/review/SKILL.md`, `plugin/skills/check/SKILL.md`, `plugin/skills/grill/SKILL.md`, `plugin/skills/ideas/SKILL.md`, `plugin/skills/promise/SKILL.md`, `plugin/skills/ui/SKILL.md`, `plugin/skills/status/SKILL.md`, `plugin/skills/spec/SKILL.md`, `plugin/skills/build/SKILL.md`, `plugin/skills/fix/SKILL.md`, `plugin/skills/work/SKILL.md`, `README.md`
- **Tasks:**
  - Task 2.1: Plan, review, check — read projections through `esq projection outline` then `read` of the chosen sections, batched with each skill's existing preflight calls; the `--paths`/`--upto` sourcing per skill and the base-comparison rule are the Recommendation's Reader rules (plan: outline at step 1, `--paths` in the lessons wave; review: `esq review scope`'s base; check: its own audit-range base). Review's and check's Spec conformance gain the base comparison; plan's evidence-gap rule names `touched` and unmapped code.
  - Task 2.2: Grill, ideas, promise, ui — the outline (headings + leads) is the feature and component map; each reads only the sections its purpose needs: grill the features the task touches, ideas the overview plus its focus (no focus → outline plus overview only), promise and ui the sections their step names (launch, pages and copy, design system). Ideas' one-turn batch keeps DECISIONS and the backlog grep as they are.
  - Task 2.3: Drop the preflight `Read CLAUDE.md` from plan, build, fix, review, check, grill, work, ui, promise, ideas and spec, saying instead that its conventions are already in context (Claude Code loads it); arch and harvest keep their Read. Promise's copy step ("any brand or voice guide in the repo (…, `CLAUDE.md`)") reuses the copy already in context instead of naming it as a read. Review's "a convention in CLAUDE.md … the change violates" stays.
  - Task 2.4: `/esq:status` § 5 reports each projection from one `esq projections` call (verdict and reason), replacing the hand-read markers and the >14 days / ≥3 phases heuristic.
  - Task 2.5: `/esq:spec` writes no dated history comment into `docs/SPEC.md` (`mis à jour`, `modifié`, a preamble changelog); the refresh's change summary — each rule changed with its confirmed intent — goes in the commit body. Existing comments are left in place (the reader strips them; history stays in git). `**Statut:** Retiré — date` is unchanged.
  - Task 2.6: README — update the `/esq:status` and `/esq:spec` rows and any paragraph describing what they report or write, in the same commit as the change it describes (fold into 2.4/2.5 commits when the row moves with them).
- **Verification:**
  - `(auto)` `git grep -niE 'read[^.]{0,40}CLAUDE\.md' -- plugin/skills ':!plugin/skills/arch' ':!plugin/skills/harvest'` — no match: no skill but arch and harvest reads `CLAUDE.md` (passes at exit 1). Plan's step 1 lists it under "Read the projection docs" without the pattern; Task 2.3 rewrites that bullet too
  - `(auto)` `git grep -lE "esq projection (outline|read)" -- plugin/skills/plan/SKILL.md plugin/skills/review/SKILL.md plugin/skills/check/SKILL.md plugin/skills/grill/SKILL.md plugin/skills/ideas/SKILL.md plugin/skills/promise/SKILL.md plugin/skills/ui/SKILL.md` — lists all seven reader skills
  - `(auto)` `./scripts/audit.sh` — PASS: package, structure (README table exhaustive), conformance and the product suites, the Phase 1 suite included

## Risks
- **Pre-mortem: a run picks too narrow a slice and misses a cross-cutting rule** (a global permission rule living in the overview or a shared "Règles" section). Answer: every reader's instruction names the overview (id 0 / `Vue d'ensemble`) and any shared-rules section as read alongside the feature, and the outline's leads make cross-cutting sections visible; Task 2.1/2.2.
- `touched` is file-level evidence, not a section→code map: a feature whose code moved to a new file shows nothing touched. Review's base comparison still applies whenever the reviewer is about to file a spec finding and `touched` cannot vouch for the path; written into the rule, not inferred.
- Large parent sections (ARCHITECTURE's ~8 KB `##` blocks) can recreate whole-file cost if selected wholesale; the outline's subtree `bytes` let the run pick children.
- Stripping all comments could hide a comment that carries product meaning; esq's writers put only markers and history in comments, and the marker is kept. A hand-written comment holding a rule is a spec defect `/esq:spec` owns.
- Ids are positional: an edit to the projection between outline and read shifts them. Each read section echoes its heading, so a mismatch is visible; within one run nothing edits a projection.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
