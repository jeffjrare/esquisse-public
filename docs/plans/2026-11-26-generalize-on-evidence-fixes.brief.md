# Fixes brief: Generalize on evidence: a counterweight to esq's anti-abstraction rule

Source: /esq:review on generalize-on-evidence, 2026-11-26
Reviewed at: f8cea2d

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- A reviewer meeting a diff that adds a third copy of an existing rule reads "to the backlog when the copies predate it" as matching (the other two predate it) and parks a copy this change introduced in the backlog — `plugin/skills/review/SKILL.md:153` — fix: route "🟡 when the diff adds the copy; to the backlog only when the diff merely touches duplication that predates it" — verify: `grep -c 'merely touches duplication that predates it' plugin/skills/review/SKILL.md` prints 1
- "never 🟢" sends a two-line extraction inside the changed files through a full `/esq:plan` → `/esq:build` cycle, paying a plan for a mechanical move — `plugin/skills/review/SKILL.md:153` — fix: "🟢 when the extraction is mechanical and contained in the changed files, 🟡 when it spans modules or needs a design" in place of "never 🟢" — verify: `grep -c 'mechanical and contained in the changed files' plugin/skills/review/SKILL.md` prints 1
- A `/esq:plan` run whose user task names no copies can read "when the task names one of (a)…(c)" as the user's task (the sense "the task or brief" has in (b)) and cut an extraction its own Investigation search justified (Gemini F1) — `plugin/skills/plan/SKILL.md:317` — fix: "when the plan's task for it names one of" — verify: `grep -c "when the plan's task for it names one of" plugin/skills/plan/SKILL.md` prints 1

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
