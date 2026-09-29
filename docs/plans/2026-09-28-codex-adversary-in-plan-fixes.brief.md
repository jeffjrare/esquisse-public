# Fixes brief: Codex as an independent adversary inside /esq:plan

Source: /esq:review on codex-adversary-in-plan, 2026-09-28
Reviewed at: 604f5a1

## 🟡 Needs a plan
Substantive — route through /esq:plan → /esq:build.
- No end-to-end proof that an opted-in `/esq:plan` run launches the counter-plan, kills it when late, and writes the `Adversary` block and the `Codex:` line; only the two schema smokes ran (execution log, "For Phase 2") — `plugin/skills/plan/references/codex-adversary.md` — why it needs planning: needs one recorded opted-in `/esq:plan` run on a scratch target, checking `git log -1 --format=%b` of its plan commit for the `Adversary (codex` block, after the two 🟢 fixes land.

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
