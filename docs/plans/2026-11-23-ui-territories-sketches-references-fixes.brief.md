# Fixes brief: Give /esq:ui a source of ideas: territories, sketches and self-sourced references

Source: /esq:review on ui-territories-sketches-references, 2026-11-23
Reviewed at: ba0c62a

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- The sketch pick's criteria do not require two territories, while Pass 4 later says "Two directions come from two different territories." On a two-direction run where the two strongest takes share one territory, the pick licenses developing both, then Pass 4 forbids it: the run either develops two variants of one domain idea (the convergence this plan fixes) or re-picks with no stated rule. — `plugin/skills/ui/SKILL.md:240` — fix: in "The pick." change "by these four criteria" to "by these five criteria" and insert "the two come from two different territories;" before "the two give different answers to the question the audit raised" — verify: `grep -n 'five criteria' plugin/skills/ui/SKILL.md && grep -n 'two different territories' plugin/skills/ui/SKILL.md | wc -l` prints the pick line and a count of 2, and `bash scripts/check-plugin.sh` exits 0

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
