<!-- loaded-at: load `${CLAUDE_SKILL_DIR}/references/decisions.md` -->

## Write decisions to registry

After writing the plan file, capture any significant decisions made during planning in `docs/DECISIONS.md`.

**What to capture:**
- The approach chosen in `## Recommendation` — if there were at least 2 real alternatives considered
- Any blocking decisions resolved via `AskUserQuestion` during "Resolve blocking decisions"

**Skip this step if** you stated "only one sensible approach" and there was genuinely no real choice. A decision requires alternatives.

**How:**

1. If `docs/DECISIONS.md` does not exist, create it:

```markdown
# Decisions

<!-- Registry of architectural, product, and functional decisions. Managed by /esq:plan and /esq:build. -->
<!-- An ID is a permanent citation key: never renumbered, never reused. Code, plans and commit messages may cite it. -->

| # | Date | Scope | Topic | Décision | Statut |
|---|------|-------|-------|----------|--------|

---
```

2. **Scope the lookup to this decision.** Search the index/headings for relevant subjects and the proposed ID; open only matching entries. Reuse applicable decisions and their authority. Add a Topic to the new entry; do not scan or migrate unrelated historical entries as part of planning. Missing legacy metadata does not authorize a registry cleanup.
3. **Derive the ID from the title — it is a slug, never a number.** 3–5 lowercase words from the decision title, hyphen-joined (same convention as plan/brief/epic slugs), giving `D-<slug>`. If a `## D-<slug>` heading already exists, append `-2`, `-3`, … until unique. Numbered `D-NNN` entries predating this convention stay exactly as they are — never migrated, never renumbered.
4. For each decision, add a row to the table and a full entry below the `---`:

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
**Conséquences:** What this implies for future work — 1-2 sentences.
**Alternatives rejetées:** Other options and why they were not chosen.
```

**Fondement — what the authority rests on, never what was done.** Write `mandate — <the clause>` when the plan, `CLAUDE.md` or the accepted frame already delegated this choice — a worker records its own technical calls this way without asking anyone — and `user — <where and when>` for a change to an explicit constraint, a promised capability or a major commitment. **The citation after the em dash is the field:** a form with nothing behind it authorizes nothing, and neither do `Statut: Active`, the entry's date, or when its commit landed. Write no field at all when the entry only records an outcome. It is optional and purely additive — never backfill an existing entry, add no migration, and every consumer keeps reading an entry that carries none: the three states are `mandate`, `user` and absent.

**Scope values:** `arch` (architecture/stack/patterns), `prod` (product scope/features/priorities), `func` (functional behavior/business rules), `ux` (UX/design/interactions), `infra` (deployment/CI/CD), `deps` (libraries/versions)

