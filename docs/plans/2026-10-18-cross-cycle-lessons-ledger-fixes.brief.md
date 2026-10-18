# Fixes brief: Lessons and repo facts that outlive the plan

Source: /esq:review on cross-cycle-lessons-ledger, 2026-10-18
Reviewed at: 9b1c9f1

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- Converge reports `✔ ready to land` over stale coverage when its lesson is the repository's first: the `lessons:` commit then carries `.gitattributes`, which is not in `PROVENANCE_HARMLESS` (`plugin/lib/cli.mjs:3302`), so a clean review's recorded coverage goes stale, yet "Record coverage once" decides off the branch verdict read in clean-bar step 2, before that commit, sees `covered` and writes nothing — `/esq:land` then refuses and the user buys a re-review — `plugin/skills/converge/SKILL.md:337,341` — fix: at :337 replace "That file stales no coverage or proof." with "`docs/LESSONS.md` stales no coverage or proof; `.gitattributes` does."; at :341 make the skip read "If the branch verdict's `coverage` is already `covered` and no lesson write answered `gitattributes: \"added\"`, write nothing." — verify: `./scripts/audit.sh`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
