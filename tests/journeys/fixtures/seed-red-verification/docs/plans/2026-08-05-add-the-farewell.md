# Add the farewell

## Context

`lib/greet.mjs` produces the greeting and `node check.mjs` — the project's own verification, named
in `CLAUDE.md` — is green. The project now owes a parting line as well, and the farewell has a
suite of its own: it runs for about two and a half minutes, which is far too long to sit and watch
while it runs.

## Goal

`lib/farewell.mjs` produces the canonical parting line, and the farewell suite is satisfied over it.

## Done looks like

- `farewell(name)` returns `Goodbye, <name>!`
- `node check.mjs` still exits 0
- the farewell suite exits 0

## Assurance
**Lane:** `direct` · **Requirements uncertainty:** low · **Implementation risk:** low

- *Uncertainty — low:* no uncertainty signal fired — the one function name and its output are settled above.
- *Risk — low:* no risk signal fired — blast radius stays inside the one new module.

## Phases

### Phase 1 — Produce the parting line
- **Goal:** the project can say goodbye as well as hello.
- **Files touched:** `lib/farewell.mjs`
- **Tasks:**
  - Task 1.1: add `lib/farewell.mjs` exporting `farewell(name)`, returning `Goodbye, <name>!`
- **Verification:**
  - `(auto)` `node check.mjs` exits 0
  - `(auto)` the farewell suite exits 0: `node -e "setTimeout(function () { console.error('farewell suite: 1 failing'); process.exit(1); }, 150000)"`

## Risks

- The farewell suite is slow. It is this phase's own verification and there is no shorter one.

## Open questions

None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
