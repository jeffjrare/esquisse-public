# Fixes brief: The Codex/Gemini adversary runs through one shipped script

Source: /esq:review on adversary-one-script, 2026-11-27
Reviewed at: 412c988

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- A `wait --bound` under 3 s over a never-launched provider returns 124 with the provider pending, and a caller repeating it on 124 loops forever (Gemini F2) — `plugin/skills/plan/references/adversary.mjs:306-323` — fix: the startup grace ends at the deadline at the latest — verify: `node --test tests/cli/adversary.test.mjs` passes `wait --bound 1` over a never-launched provider exiting 0 with it in `never`
- Without GNU timeout, a stop arriving near the bound lets the script's timer fire during shutdown and record 124 for a stopped call (Gemini F3) — `plugin/skills/plan/references/adversary.mjs:238-257` — fix: a stop clears the timer, and 124 needs `!stopped` — verify: `node --test tests/cli/adversary.test.mjs` passes
- The SIGTERM-ignoring test asserts `.exit` 137, which only GNU timeout writes, so it fails on a host without it (Gemini F1) — `tests/cli/adversary.test.mjs:231-236` — fix: assert the timeout reading, with 124 or 137 as the exit — verify: `node --test tests/cli/adversary.test.mjs` passes
- The race test parses the waiter's stdout on `exit`, which can fire before its stdout is drained, so it can flake with a SyntaxError under load (Gemini F4) — `tests/cli/adversary.test.mjs:212-219` — fix: resolve on `close` — verify: `node --test tests/cli/adversary.test.mjs` passes

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
