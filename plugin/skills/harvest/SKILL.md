---
description: Build the decisions registry from codebase archaeology plus targeted questions. Writes docs/DECISIONS.md.
name: harvest
argument-hint: "[target] [options]"
disable-model-invocation: true
model: opus
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You are building a decisions registry for an existing project. You don't have the full history of why things were done — part of it is in the code, part is in the user's head. Your job is to recover as much as possible from artifacts first, then ask only what you can't infer.

Do NOT use plan mode. You need to write a file at the end.

## Announce, before anything

<!-- announce-open:start -->
**Announce in one line, then keep working in the same response.** Print the line below before any tool call, with nothing of your own above it — and never end your response on it: the run's first tool call follows in that same response. A bound named after the spending is a bill.

> `/esq:harvest — building docs/DECISIONS.md. Bound: no subagents, at most 150 commits read, at most 3 questions.`

If a pass would exceed it, stop at the bound and say what you did not cover. The resolved target lands in the second line, at the end of preflight.
<!-- announce-open:end -->

Archaeology is five sub-passes over the whole repo before a single question is asked. Naming them is what keeps the silence legible.

## Preflight

1. Read `CLAUDE.md` at project root if present.
2. Read `README.md` at project root if present.
3. Read `docs/DECISIONS.md` if it exists — note every decision ID already there to avoid duplicates. Also note what's already captured so you don't re-ask.
4. Fetch tools: call `ToolSearch "select:AskUserQuestion"`. Continue without it if unavailable — you'll ask in plain text instead.
5. Note today's date in YYYY-MM-DD format.
6. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `<N> decisions already in the registry — I won't re-ask those.`
   <!-- announce:end -->

   This is the free moment to be redirected — the target is on screen before anything has been spent on it.

## Phase 1 — Archaeology

Mine every available artifact for decision signals. Build an internal `candidates` list as you go. A candidate is: a deliberate choice between alternatives that shaped the project. Each candidate gets: a title, a scope guess, the evidence source, and what you could infer about context + reasoning.

### 1A — Git history

Run `git log --oneline --all` (at most 150 commits). Scan commit messages for decision signals:
- **Scope signals:** `use`, `switch to`, `replace`, `migrate`, `adopt`, `add`, `drop`, `remove`, `prefer`, `refactor`, `rewrite`
- **Rejection signals:** `instead of`, `over`, `rather than`, `not X`
- **Init/foundation commits:** first commits often encode foundational tech choices

For each signal commit, note what the decision appears to be and the commit hash as evidence. Don't read every commit's diff — just the message. Only `git show <hash>` for commits where the message is genuinely ambiguous and the diff would clarify scope.

### 1B — Existing plan files

Glob for `docs/plans/*.md` excluding `*.log.md` and `*.brief.md`. For each plan file found, read it and extract:
- `## Approaches considered` — each named approach is a candidate alternative
- `## Recommendation` — the chosen approach is a decision
- `**Surprises / decisions made during execution:**` lines in the execution log — each item that represents a choice (not a pure surprise) is a candidate

### 1C — Config and dependencies

Read the following if they exist (pick the relevant one for this project):
- `package.json` (or `pnpm-workspace.yaml`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `pubspec.yaml`)
- Top-level build/bundler config: `vite.config.*`, `webpack.config.*`, `rollup.config.*`, `esbuild.config.*`, `turbo.json`
- Linting/formatting: `.eslintrc*`, `biome.json`, `prettier.*`, `.rubocop.yml`
- CI/CD: `.github/workflows/*.yml` (first workflow file only)
- Containerization: `Dockerfile`, `docker-compose.yml`

For each file, extract: which tool/library was chosen (scope `deps` or `infra`). Don't enumerate every dependency — only choices that were clearly deliberate or unusual (e.g., using Bun over Node, Biome over ESLint, Turborepo, a specific state management library).

### 1D — Code comments

Run the following greps from the project root:

```bash
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" --include="*.go" --include="*.rs" \
  -E "(instead of|we use|because|NOTE:|WHY:|we (chose|picked|decided|switched))" \
  --max-count=3 -l
```

For each file returned, read just the matching lines (not the whole file). Each comment explaining a non-obvious choice is a candidate (scope `arch` or `func`).

### 1E — Product and functional signals

Mine non-code artifacts for product and functional decisions. These rarely appear in git commits or config files.

**In README.md (already read in preflight):** extract:
- What the project explicitly is NOT (scope exclusions)
- Who it's for, who it's NOT for (target user decisions)
- Features listed as "coming soon" or "v2" (cut scope)
- Any "why we built this" or "alternatives" section

**In CLAUDE.md (already read in preflight):** extract:
- "Don't use X" / "We use Y for Z" rules — often encode past decisions
- Scope constraints ("this is not a…", "we don't handle…")
- Conventions that imply a functional choice (e.g., "all mutations are server-side")

**In `docs/` (excluding `plans/`):** glob for `*.md` files. For each:
- Read the first 30 lines to determine relevance
- Read fully only if it contains spec, feature, roadmap, or decision language
- Extract: product bets, feature scope choices, UX principles, stated non-goals

These are often the richest source of `prod` and `func` decisions. Treat them as first-class archaeology, not a footnote.

### 1F — Consolidate candidates

Deduplicate (the same decision may appear in both git log and a plan file). Remove anything already in `docs/DECISIONS.md`. Group by scope: `arch`, `prod`, `func`, `ux`, `infra`, `deps`.

After deduplication, tally candidates per scope group. If `prod` and `func` are significantly underrepresented relative to `arch`/`deps`, note it — the interrogation phase must compensate for what the code couldn't reveal.

If archaeology produced zero candidates overall, note that explicitly — the interrogation phase will carry full weight.

## Phase 2 — Interrogation

Archaeology recovers what was documented. But product bets, functional invariants, and scope calls often live only in memory — things that "just happened" without a commit or a comment. This phase recovers them with equal weight across all three decision types.

**Coverage requirement:** your questions MUST cover all three scopes unless archaeology already saturated one:
- **Technical** (`arch`, `infra`, `deps`): stack choices, architecture shape, tooling bets
- **Product** (`prod`, `ux`): what was built vs. cut, who it's for, scope bets, UX principles
- **Functional** (`func`): business rules, invariants, behaviors that could have gone differently

If archaeology left product and functional gaps (common — code rarely encodes these), weight your questions toward those scopes. Don't default to asking one more technical question just because the code is familiar territory.

Prepare at most **3 AskUserQuestion calls**, each with 2–4 options. Adapt to the project — don't ask about mobile if there's no mobile code, don't ask about auth if auth is trivially absent.

**Question bank by scope — pick the highest-value unknowns:**

*Technical:*
- "How was [framework/lang] chosen?" — deliberate bet, team constraint, or default?
- "Was [tool X found in archaeology] actually evaluated against alternatives, or was it the obvious choice?"

*Product:*
- "What features or use cases were consciously cut from v1?" — scope decisions are almost never in code
- "Who is this NOT for?" — target user exclusions often encode important product bets

*Functional:*
- "Is there a business rule or invariant that isn't obvious from the code?" — e.g., "we never store X client-side", "Y is always validated server-side"
- "What does this system explicitly refuse to do?" — functional non-goals are often undocumented

**Do NOT ask:**
- Things already in DECISIONS.md
- Things archaeology answered with high confidence
- Generic questions ("any other decisions?") — make them specific
- More than one question about the same topic

Present each AskUserQuestion with clear options — include "Not a deliberate decision / just what was there" as an option where appropriate, so the user can dismiss a candidate without friction.

**An answer is a citation, not a new question.** Keep each question as asked and the operative words of its answer: Phase 3 writes them into that entry's `**Fondement:**` rather than re-confirming them, and an answer of the dismissal shape drops the candidate or records it with no basis at all.

<!-- shared:escape-hatch:start -->
**Always leave a way to answer in their own words.** Make the last option on every question an explicit free-text escape — label it `✍️ Something else — I'll explain`, with a description saying you'll ask for the details. If they pick it, collect their wording with a short plain-text follow-up before continuing; every *other* answer in the same batch still stands. Don't rely on the harness's built-in "Other" row — it doesn't render in every client.
<!-- shared:escape-hatch:end -->

Keep curated options to ≤3 so there's room for the escape.

After AskUserQuestion responses, merge the user's answers with the archaeology candidates to form the **confirmed list**.

## Phase 3 — Draft and confirm

Format the full draft of decisions as a code block in your response — the table rows, then each full entry in the Entry format below. Show it to the user before writing anything:

```
Proposed additions to docs/DECISIONS.md:

| D-vite-over-webpack | 2026-06-10 | arch  | bundler    | Use Vite over Webpack       | Active |
| D-pnpm-over-npm     | 2026-06-10 | deps  | tooling    | pnpm over npm               | Active |
| D-cli-first-no-gui  | 2026-06-10 | prod  | scope      | CLI-first, no GUI in v1     | Active |

---

[one full entry per row, in the Entry format below]
```

**Assemble each entry's basis from the confirmed list, never from a second ask:** an item the user answered carries `user — <the question, its date, the operative words>`; an item established by archaeology alone carries no `**Fondement:**`, because a historical deduction authorizes nothing; a found source that itself carries an explicit authorization is cited as that source, bounded by what it covers; a dismissed candidate carries neither a basis nor an entry.

**Then write it — the interrogation above was the question, this isn't a second one.** Every decision on the confirmed list is either something the user just answered or something the archaeology established; asking "does this look right?" over the assembled result re-asks what they already told you, and blocks on a file that `git revert` undoes.

## Phase 4 — Write and commit

1. Read `docs/DECISIONS.md` (create it if it doesn't exist, using the standard header below).
2. **Scope registry edits to harvested decisions.** Add Topic to each new entry and consult relevant existing entries for conflicts or duplicates. Do not migrate unrelated historical entries merely because this run appends decisions.
3. **Derive the ID from the title — it is a slug, never a number.** 3–5 lowercase words from the decision title, hyphen-joined (same convention as plan/brief/epic slugs), giving `D-<slug>`. If a `## D-<slug>` heading already exists, append `-2`, `-3`, … until unique. Numbered `D-NNN` entries predating this convention stay exactly as they are — never migrated, never renumbered.
4. Write all confirmed entries: add rows to the table, append full entries below the `---` separator.
5. `git add docs/DECISIONS.md`
6. `git commit -m "decisions: populate registry from archaeology (<N> decisions)"`
7. Tell the user: how many decisions were written and under which IDs, which came from the interrogation versus the archaeology, and any candidate you dropped with the reason. Close with the undo — `git revert <commit>`, or name an entry and you'll rewrite or remove it in place — and suggest running `/esq:plan` or `/esq:build` with awareness that the registry is now live.
8. **Elapsed, last, on its own line** — `9m18s`. One number, measured against the bound you announced in preflight. Not a report, and deliberately not the conclusion block.

**Standard header if creating from scratch:**

```markdown
# Decisions

<!-- Registry of architectural, product, and functional decisions. Managed by /esq:plan and /esq:build. -->
<!-- An ID is a permanent citation key: never renumbered, never reused. Code, plans and commit messages may cite it. -->

| # | Date | Scope | Topic | Décision | Statut |
|---|------|-------|-------|----------|--------|

---
```

**Entry format:**

```markdown
## D-<slug> — <Title>

**Scope:** <arch | prod | func | ux | infra | deps>
**Topic:** <free-form domain tag — e.g. "auth", "subscription", "seo", "checkout", "payments">
**Date:** YYYY-MM-DD
**Statut:** Active
**Fondement:** <optional — omit entirely for an entry mined from archaeology | user — the interrogation question, its date and the operative words of the answer | user — a found source that itself carries an explicit authorization, cited by path and date>

**Contexte:** Why this decision was needed — 1-2 sentences.
**Décision:** What was decided — 1 sentence.
**Raison:** The key tradeoff or reason — 2-3 sentences.
**Alternatives rejetées:** Other options and why they were not chosen. "None documented" if archaeology found no evidence of alternatives.
```

**Fondement — what the entry's authority rests on, and harvest has two origins.** **The citation after the em dash is the field:** a form with nothing behind it authorizes nothing, and neither do `Statut: Active`, the entry's date, or when its commit landed. Then, by origin:

- **Mined from archaeology** — git history, a plan file, a config, a comment → **no field at all.** A record of what was done is evidence, never authorization, and its age proves nothing.
- **Answered in the Phase 2 interrogation** → `user — /esq:harvest interrogation, <YYYY-MM-DD>: "<the question as asked>" → <the operative words of the answer>`, written straight from the answer already in hand — the operative words only, never the whole answer and never anything the question did not solicit.
- **A found source that itself carries an explicit authorization** — an approved plan's Goal or Recommendation, a brief's `## Resolved decisions`, a recorded answer → `user — <that source, cited by path and date>`, covering only what that source covers.

An answer dismissing the candidate — "not a deliberate decision, just what was there" — is not an authorization and produces no field, and a basis covers the decision as it was answered, never a later or larger change. It is optional and purely additive — never backfill an existing entry, add no migration, and every consumer keeps reading an entry that carries none.

**Scope values:**
- `arch` — Architecture, tech stack, design patterns, module structure
- `prod` — Product scope, features, priorities, what was cut
- `func` — Functional behavior, business rules, invariants
- `ux` — User experience, design, interaction patterns
- `infra` — Deployment, CI/CD, infrastructure, hosting
- `deps` — Libraries, frameworks, dependency choices

## Constraints

- Do NOT spawn subagents — archaeology is one reader deduplicating across five sources, and split across a fleet the same decision arrives three times under three titles. The announced bound says **no subagents** because nothing here fetches `Agent`.
- Do NOT write decisions the user didn't confirm.
- Do NOT invent alternatives that weren't mentioned — "None documented" is honest; fabricated context is not.
- Do NOT write entries for things already in DECISIONS.md.
- Keep entries factual — write what was decided and why, not what you think *should* have been decided.
- One commit, one file: only `docs/DECISIONS.md` changes in this session.
- If the user says "stop" or "skip writing" at any point during the interrogation: do NOT write or commit. Respect the pause — that is them withdrawing the task, not you pausing to check.
