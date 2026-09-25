# Real landing verification excerpt

<!-- Verbatim verification/proof excerpts from events-tracker
     docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.md,
     read-only on 2026-09-25. Commands are test data, never executed. -->

## Phases

### Phase 1 — The household comes up with its proof, the three features appear, and the limit moves by what they cost
- **Verification:**
  - `(auto)` `pnpm --filter landing build` — `astro check` accepts both copy files against
    `Copy` (the `satisfies` catches a key present in one locale only), `astro build` emits, and
    `check-csp.mjs` passes.
  - `(auto)` `pnpm --filter landing test` — the landing vitest suite passes.
  - `(auto)` `node landing/scripts/audit.mjs` — exits 0 (AA in light and dark on every text
    node, including both fragments' notice and chips; header centred; both pages under the new
    limit). Its summary also shows, for every reading, `first « ~ » ends at … (above the fold)`
    at 1280x800 and `horizontal overflow no`, because those two are reported, not judged.
  - `(auto)` `grep -n "^  <\(Steps\|Forecasting\|Features\|LookingBack\|Discover\)" landing/src/pages/index.astro landing/src/pages/en/index.astro`
    — each file lists, in this order, Steps, Forecasting, Features, LookingBack, Discover.
  - `(auto)` `grep -rn "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md`
    — no match (exit 1). No reader states the old limit.
  - `(auto)` `grep -n "[[:alpha:]]'[[:alpha:]]" landing/src/copy/fr.json` — no match (exit 1): every French elision uses `’`, never an ASCII apostrophe.
  - `(auto)` `pnpm -r build` — all four packages typecheck and build.
  - `(auto)` `pnpm test` — the locale, legal and mark gates and every package's tests pass.

## Execution log

### Phase 1 — completed 2026-09-25

**Verified:** 1f8ddfbb0276e25b88474f57546370b98578705f
- `pnpm --filter landing build`
- `pnpm --filter landing test`
- `node landing/scripts/audit.mjs`
- `grep -n "^  <\(Steps\|Forecasting\|Features\|LookingBack\|Discover\)" landing/src/pages/index.astro landing/src/pages/en/index.astro`
- `grep -rn "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md`
- `grep -n "[[:alpha:]]'[[:alpha:]]" landing/src/copy/fr.json`
- `pnpm -r build`
- `pnpm test`
