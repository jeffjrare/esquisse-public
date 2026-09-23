# Shout the greeting

## Context

`lib/greet.mjs` produces the greeting and `node check.mjs` — the project's own verification, named
in `CLAUDE.md` — is green. Callers now want the same greeting in upper case for banners.

The project also carries a long verification, `node slow-check.mjs`, which `CLAUDE.md` does not
name because no phase before this one has been slow enough to owe it. It is far too slow to sit and
watch: it prints that it started, then a heartbeat, and a phase that runs it has to get on with
something else while it does.

## Goal

`lib/shout.mjs` returns the greeting in upper case, and the phase that adds it satisfies the
project's long verification as well as its short one.

## Done looks like

- `shout(name)` returns `HELLO, <NAME>!`
- `node check.mjs` still exits 0
- the long verification exits 0

## Assurance
**Lane:** `direct` · **Requirements uncertainty:** low · **Implementation risk:** low

- *Uncertainty — low:* no uncertainty signal fired — the one function name and its output are settled above.
- *Risk — low:* no risk signal fired — blast radius stays inside the one new module.

## Phases

### Phase 1 — Shout it
- **Goal:** the greeting is available in upper case.
- **Files touched:** `lib/shout.mjs`
- **Tasks:**
  - Task 1.1: add `lib/shout.mjs` exporting `shout(name)`, returning `greet(name)` from
    `lib/greet.mjs` in upper case
- **Verification:**
  - `(auto)` `node check.mjs` exits 0
  - `(auto)` the project's long verification exits 0: `node slow-check.mjs`

## Risks

- The long verification is slow. It is this phase's own verification and there is no shorter one.

## Open questions

None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
