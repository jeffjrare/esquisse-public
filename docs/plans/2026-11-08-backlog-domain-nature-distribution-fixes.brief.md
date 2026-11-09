# Fixes brief: Every backlog row classified by domain and nature, with its distribution in the roadmap

Source: /esq:review on backlog-domain-nature-distribution, 2026-11-08
Reviewed at: b9cece2

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- Two preamble lines still send a worker to `esq backlog reserve-id` to file a row. That is the hand-written path this plan closed: a `/esq:build` or `/esq:plan` run that follows them reserves an ID and writes the row by hand. The row then has no Concern or Layer, and against the 12-column header its Status shifts into the wrong cell, so `esq validate` reds at the session stop — `plugin/skills/build/SKILL.md:22`, `plugin/skills/plan/SKILL.md:21` — fix: replace "Use `esq backlog reserve-id` before adding a backlog row" (build) and "Use `esq backlog reserve-id` for new backlog rows" (plan) with "Use `esq backlog add --concern <concern> --layer <app|infra>` to file a backlog row" — verify: `git grep -n 'reserve-id' -- plugin/skills/build/SKILL.md plugin/skills/plan/SKILL.md` prints nothing (exit 1), and `./scripts/audit.sh` passes

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
