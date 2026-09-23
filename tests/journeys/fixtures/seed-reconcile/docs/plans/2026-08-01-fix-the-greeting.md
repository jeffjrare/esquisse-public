# Fix the greeting

## Context

`lib/greet.mjs` builds `Helo, <name>!`. `node check.mjs` — the project's own verification,
named in `CLAUDE.md` — expects `Hello, world!` and exits 1 until the module is corrected.

## Goal

`node check.mjs` exits 0 against the canonical greeting.

## Done looks like

- `greet('world')` returns `Hello, world!`
- `node check.mjs` exits 0

## Assurance
**Lane:** `direct` · **Requirements uncertainty:** low · **Implementation risk:** low

- *Uncertainty — low:* no uncertainty signal fired — the expected string is written in `check.mjs`.
- *Risk — low:* no risk signal fired — blast radius stays inside `lib/greet.mjs`.

## Phases

### Phase 1 — Correct the greeting
- **Goal:** `greet()` returns the canonical greeting.
- **Files touched:** `lib/greet.mjs`
- **Tasks:**
  - Task 1.1: correct the greeting in `lib/greet.mjs` so `greet('world')` returns `Hello, world!`
- **Verification:**
  - `(auto)` `node check.mjs` exits 0

## Risks

- None beyond the one-line change; `check.mjs` is the whole contract.

## Open questions

None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
