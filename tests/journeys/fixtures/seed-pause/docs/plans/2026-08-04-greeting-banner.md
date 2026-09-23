# Greeting banner

## Context

`lib/greet.mjs` builds `Helo, <name>!`. `node check.mjs` — the project's own verification, named in
`CLAUDE.md` — expects `Hello, world!` and exits 1 until the module is corrected. The demo banner at
`https://greet.internal.invalid/` renders whatever `greet()` returns, and only a person looking at
that page can say the banner itself came out right.

## Goal

The banner reads `Hello, world!`, and the module also produces a farewell.

## Done looks like

- `greet('world')` returns `Hello, world!` and `node check.mjs` exits 0
- the banner at `https://greet.internal.invalid/` reads `Hello, world!`
- `farewell('world')` returns `Goodbye, world!`

## Assurance
**Lane:** `direct` · **Requirements uncertainty:** low · **Implementation risk:** low

- *Uncertainty — low:* no uncertainty signal fired — both strings are settled.
- *Risk — low:* no risk signal fired — blast radius stays inside `lib/greet.mjs`.

## Phases

### Phase 1 — Correct the greeting
- **Goal:** `greet()` returns the canonical greeting, and the banner shows it.
- **Files touched:** `lib/greet.mjs`
- **Tasks:**
  - Task 1.1: correct the greeting in `lib/greet.mjs` so `greet('world')` returns `Hello, world!`
- **Verification:**
  - `(auto)` `node check.mjs` exits 0
  - `(manual)` [with the demo banner served at `https://greet.internal.invalid/`] open the banner in
    a browser → expected: it reads `Hello, world!`

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

### Phase 1 — ⏸ awaiting manual verification (2026-08-04)

**Plan committed at:** <PLAN-COMMIT>

**Commits:** <CODE-COMMIT>

**What got built:** `lib/greet.mjs` now returns the canonical greeting.

**Auto verification:**
- (auto) `node check.mjs` — exit 0

**Manual verification outstanding:** The `(manual)` step a human or browser/app agent must observe
before this phase is done:
- [with the demo banner served at `https://greet.internal.invalid/`] open the banner in a browser → expected: it reads `Hello, world!`

**Surprises / decisions made during execution:** None — phase executed as planned.
