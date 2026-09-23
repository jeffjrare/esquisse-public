# Backlog

<!-- Task backlog: bugs, improvements, todos, ideas, and deferred work captured across sessions. -->
<!-- Add with `/esq:backlog <text>`. Review & triage with bare `/esq:backlog`. -->
<!-- Type: 🐛 bug | ✨ improvement | ☑️ todo | 💡 idea | ⚠️ debt (deferred fix) -->
<!-- Status: Open (actionable) | Needs-decision (blocked on user) | Planned (picked up by a plan) | Done | Dropped -->
<!-- Pri: hi | med | lo | (blank) -->
<!-- Epic: slug of the epic this item belongs to (docs/epics/<slug>.md, via /esq:epic); blank if none. -->
<!-- Version: release the item shipped in (e.g. v0.0.87); blank until deployed. Filled = ready for UA; Status Done = UA passed. -->

| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |
|----|------|------|-----|---------|--------|------|---------|--------|
| B-001 | 2026-08-01 | ✨ improvement | | Add locale support to the greeting module so greetings can be translated | manual | | | Open |

---

## B-001 — Add locale support to the greeting module so greetings can be translated

**What:** `lib/greet.mjs` hard-codes one English greeting. Greetings should be selectable per locale.

**Why it matters:** every non-English caller has to post-process the string today.
