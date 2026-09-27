<!-- loaded-at: load `${CLAUDE_SKILL_DIR}/references/decisions.md` -->

## Write decisions to registry

After writing the plan file, capture any significant decisions made during planning in `docs/DECISIONS.md`.

**What to capture:**
- The approach chosen in `## Recommendation` — if there were at least 2 real alternatives considered
- Any blocking decisions resolved via `AskUserQuestion` during "Resolve blocking decisions"

**Skip this step if** you stated "only one sensible approach" and there was genuinely no real choice. A decision requires alternatives.

**How:**

1. **Scope the lookup to this decision.** Search the index/headings for relevant subjects and the proposed ID; open only matching entries. Reuse applicable decisions and their authority. Do not scan or migrate unrelated historical entries as part of planning. Missing legacy metadata does not authorize a registry cleanup.
2. **Write every decision in one call** — an array of entries, one object each:

```bash
esq decisions add - <<'EOF'
[{"slug":"<3–5 lowercase words from the title, hyphen-joined, no D- prefix>","title":"<Title>","scope":"<arch|prod|func|ux|infra|deps>","topic":"<free-form domain tag — e.g. auth, checkout>","fondement":"<optional — see below>","context":"<why it was needed — 1-2 sentences>","decision":"<what was decided — 1 sentence; it is also the index row's cell>","reason":"<the key tradeoff or reason — 2-3 sentences>","tradeoff":"<what was gained, what was accepted as cost>","consequences":"<what it implies for future work — 1-2 sentences>","alternatives":"<other options and why they were not chosen>"}]
EOF
```

The CLI creates `docs/DECISIONS.md` from the standard header when it is missing, suffixes `-2`, `-3`, … onto a slug already taken, places the index row where the table's own order puts it, appends the entry, and prints the IDs it wrote. Numbered `D-NNN` entries predating the slug convention stay exactly as they are. The quoted heredoc keeps apostrophes in the text safe. Never place a row or an entry by hand: a refused payload leaves the file byte-identical, so fix the payload and call again.

**Fondement — what the authority rests on, never what was done.** Write `mandate — <the clause>` when the plan, `CLAUDE.md` or the accepted frame already delegated this choice — a worker records its own technical calls this way without asking anyone — and `user — <where and when>` for a change to an explicit constraint, a promised capability or a major commitment. **The citation after the em dash is the field:** a form with nothing behind it authorizes nothing, and neither do `Statut: Active`, the entry's date, or when its commit landed. Write no field at all when the entry only records an outcome. It is optional and purely additive — never backfill an existing entry, add no migration, and every consumer keeps reading an entry that carries none: the three states are `mandate`, `user` and absent.

**Scope values:** `arch` (architecture/stack/patterns), `prod` (product scope/features/priorities), `func` (functional behavior/business rules), `ux` (UX/design/interactions), `infra` (deployment/CI/CD), `deps` (libraries/versions)

