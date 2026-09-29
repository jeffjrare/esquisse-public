# Fixes brief: Codex as an independent adversary inside /esq:plan

Source: /esq:review on codex-adversary-in-plan, 2026-09-28
Reviewed at: 604f5a1

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- The `ESQ_CODEX` gate is never read: the announce line must be printed "before any tool call" yet varies on `$ESQ_CODEX`, and no step of the procedure runs a shell call that reads it. The model cannot see `.claude/settings.json` `env`, so a user who opts in gets a plan run with no counter-plan, no pre-mortem and no `Codex:` line (Done looks like, first bullet, unmet) — `plugin/skills/plan/SKILL.md:40` — fix: keep the first announce line unconditional; read the gate with `printf 'ESQ_CODEX=%s\n' "${ESQ_CODEX:-}"` chained into the first preflight shell call, and move the Codex bound suffix and the reference load to the step 11 target line, where the counter-plan launches — verify: `grep -n 'ESQ_CODEX:-' plugin/skills/plan/SKILL.md && ./scripts/audit.sh`
- The foreground pre-mortem runs `timeout 570 codex exec …` but the reference never tells the model to raise the Bash tool's own timeout (default 120000 ms), so a high-effort Codex pre-mortem is cut at 2 minutes on most runs and reported as `not run` — `plugin/skills/plan/references/codex-adversary.md:45` — fix: state that the § 2 call is made with the Bash tool's `timeout: 600000` — verify: `grep -n '600000' plugin/skills/plan/references/codex-adversary.md`

## 🟡 Needs a plan
Substantive — route through /esq:plan → /esq:build.
- No end-to-end proof that an opted-in `/esq:plan` run launches the counter-plan, kills it when late, and writes the `Adversary` block and the `Codex:` line; only the two schema smokes ran (execution log, "For Phase 2") — `plugin/skills/plan/references/codex-adversary.md` — why it needs planning: needs one recorded opted-in `/esq:plan` run on a scratch target, checking `git log -1 --format=%b` of its plan commit for the `Adversary (codex` block, after the two 🟢 fixes land.

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
