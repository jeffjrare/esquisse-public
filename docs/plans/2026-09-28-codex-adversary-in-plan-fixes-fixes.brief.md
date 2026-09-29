# Fixes brief: Prove the opted-in Codex adversary end to end in /esq:plan

Source: /esq:review on codex-adversary-in-plan-fixes, 2026-09-28
Reviewed at: 963dae1

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- Assertion 5 cannot tell the skill's stop from host teardown: it only checks that no marker process survives after `claude -p` exits, and an exiting headless session can reap its own background tasks (the execution log already scopes kill-on-late to "the headless host only"; the result dir holding the stream is deleted on success, so the green run cannot show which happened), so a later edit to `codex-adversary.md` that drops "stop its background task" (line 61) still passes 5/5 — while an interactive `ESQ_CODEX=on` user is left with a late counter-plan running (and spending Codex tokens) until its `timeout`. This is the regression the probe exists to catch (Done bullet 2: "was stopped"). — `scripts/probe-codex-plan.sh:168` (node block) and `:185` (assertion 5) — fix: in the node block also print whether any `assistant` message in `stream.jsonl` carries a `tool_use` named `TaskStop`, and make assertion 5 FAIL `the skill never called TaskStop` when it is absent, besides the existing no-leftover-process check — verify: `bash -n scripts/probe-codex-plan.sh && scripts/probe-codex-plan.sh` (background, outside the sandbox, ≈0.5 USD) exits 0 with five `PASS` lines, assertion 5 naming the TaskStop call

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
