# Fixes brief: Settle B-181 on three runs per arm instead of one

Source: /esq:review on b181-variance-then-fix, 2026-09-29
Reviewed at: d222989

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- B-181's detail section contradicts its `Done` status: d222989 overwrote the old `**Resolution:**` line (the invoice-export one that the "Reopened after user review" note calls "the previous resolution below … insufficient for Done"), so that sentence now disqualifies the new resolution. The "Variance trial" note, above that, still ends "B-181 is back to Open". Anyone reading B-181, whether the user or `/esq:roadmap`, sees Done beside two statements that it is not done, and the invoice-export history is gone. — `docs/BACKLOG.md:960-968` — fix: restore the pre-d222989 resolution as a dated historical line (`**Resolution (2026-09-24, superseded):** …`, verbatim from `git show 62eb89b:docs/BACKLOG.md` line 960). Keep the new one as `**Resolution (2026-09-29, re-scope):**`. It must say that the Done rule was not met, that the user closed B-181 by re-scoping C5→B-188 and C7→B-189 (the route in the plan's Risks), and that this supersedes the Variance note's "back to Open". — verify: `grep -c 'superseded' docs/BACKLOG.md` ≥ 1, and `sed -n '/^## B-181/,/^## B-182/p' docs/BACKLOG.md | grep -c 'Resolution'` = 2, then `esq validate`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
