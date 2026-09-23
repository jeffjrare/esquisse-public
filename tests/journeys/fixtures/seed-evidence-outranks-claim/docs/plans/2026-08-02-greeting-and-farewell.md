# Greeting and farewell

## Context

`lib/greet.mjs` builds `Helo, <name>!` and `node check.mjs` — the project's own verification,
named in `CLAUDE.md` — expects `Hello, world!` and exits 1. The module also owes a farewell.

## Goal

The greeting is canonical and `check.mjs` exits 0, and the module also produces a farewell.

## Done looks like

- `greet('world')` returns `Hello, world!` and `node check.mjs` exits 0
- `farewell('world')` returns `Goodbye, world!`

## Assurance
**Lane:** `direct` · **Requirements uncertainty:** low · **Implementation risk:** low

- *Uncertainty — low:* no uncertainty signal fired — both strings are settled.
- *Risk — low:* no risk signal fired — blast radius stays inside `lib/greet.mjs`.

## Phases

### Phase 1 — Correct the greeting
- **Goal:** `greet()` returns the canonical greeting.
- **Files touched:** `lib/greet.mjs`
- **Tasks:**
  - Task 1.1: correct the greeting in `lib/greet.mjs` so `greet('world')` returns `Hello, world!`
- **Verification:**
  - `(auto)` `node check.mjs` exits 0

### Phase 2 — Add the farewell
- **Goal:** the module also produces a farewell.
- **Files touched:** `lib/greet.mjs`
- **Tasks:**
  - Task 2.1: add `farewell(name)` to `lib/greet.mjs`, returning `Goodbye, <name>!`
- **Verification:**
  - `(auto)` `node check.mjs` exits 0
  - `(auto)` `node -e "import('./lib/greet.mjs').then(m=>{if(m.farewell('world')!=='Goodbye, world!')process.exit(1)})"` exits 0

## Risks

- Phase 2 must not undo Phase 1: `check.mjs` is the guard on both.

## Open questions

None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
