# Fixes brief: Close B-181 with a brief-fidelity fix and one paid Tamialog trial

Source: /esq:review on b181-closing-evidence, 2026-09-29
Reviewed at: 1b5f83a

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- Phase 1's `git diff main -- plugin/skills/plan/SKILL.md` step expects the Task 1.1 sentences or an empty diff, but the merged child unit kept a different item (item 6, `538c7c8`, `b181-variance-then-fix` Task 2.1). `/esq:land` reruns this step because `SKILL.md` changed since `cc67a60`, and it goes red on a change that was authorized. The `## Done looks like` line "the diff is empty against the pre-unit source" is stale for the same reason — `docs/plans/2026-09-29-b181-closing-evidence.md:102` (and `:27-28`) — fix: restate the step as "shows no Task 1.1 sentence (withdrawn in `a5e1666`); its only change is item 6 kept by `docs/plans/2026-09-29-b181-variance-then-fix.md` Task 2.1 (`538c7c8`), matching the kept verdict in `docs/preparation/2026-09-29-b181-variance.md`". Change the Done line to match, and leave the execution log untouched — verify: `git diff main -- plugin/skills/plan/SKILL.md | grep '^+[^+]' | diff - <(grep '^+[^+]' docs/preparation/2026-09-29-b181-variance/correction.diff)` prints nothing

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
