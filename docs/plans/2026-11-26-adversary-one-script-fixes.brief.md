# Fixes brief: The Codex/Gemini adversary runs through one shipped script

Source: /esq:review on adversary-one-script, 2026-11-26
Reviewed at: e7ee779

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- When the harness stops a launch with SIGKILL (a `TaskStop` the script cannot catch), the provider child, detached in its own process group, outlives the script with no bound: the timer that enforced `<bound>` lived in the killed process, so Codex or Gemini keeps spending until it ends on its own — `plugin/skills/plan/references/adversary.mjs:204-216` — fix: spawn the provider under `timeout --kill-after=5 <bound>` (exit 124 is the timeout), keeping the SIGTERM forwarding — verify: `node --test tests/cli/adversary.test.mjs` passes, the timeout case asserting `.exit` 124 and the logged argv starting with the provider (the fake sees its own argv, `timeout` is transparent)
- A lifecycle whose launch the script refused (exit 2: gate, git dir, slug) leaves no `.meta.json`, yet `wait` counts that provider as pending, so the run burns 170 s per `wait` call until it gives up — `plugin/skills/plan/references/adversary.mjs:283-285` — fix: a provider with no `.meta.json` is not pending (`read` already answers `never launched`) — verify: `node --test tests/cli/adversary.test.mjs` passes a case where `wait … codex gemini --bound 1` exits 0 with only codex launched
- `launch` exits with the provider's own exit code, so an `agy` exiting 2 or 3 reads as the script's refusal or refused precondition: `probe-gemini-readonly.sh` then exits inconclusive before checks 3–4, skipping the write and shell checks after a call that ran (Gemini F1) — `plugin/skills/plan/references/adversary.mjs:229-233`, `scripts/probe-gemini-readonly.sh:79-83` — fix: `launch` exits 0 once the provider ran (its status is `.exit` and `read`), 2 on a refusal, 3 on a refused precondition; the probe routes on `meta.stage` — verify: `node --test tests/cli/adversary.test.mjs` passes with a fake `agy` exiting 2 whose launch exits 0
- `read` racing a launch that is rewriting `.meta.json` can parse a truncated file and crash with exit 1, dropping every provider's result (Gemini F3) — `plugin/skills/plan/references/adversary.mjs:95,245` — fix: write `.meta.json` through a temp file and rename; a meta that does not parse reads as `running` — verify: `node --test tests/cli/adversary.test.mjs` passes a case with a corrupt `.meta.json` read as `running`
- Gemini's precondition runs `agy --help` and `agy models` under the ambient environment instead of the `env` the launch was given, so a caller passing its own `PATH` checks a different `agy` than the one it runs (Gemini F2) — `plugin/skills/plan/references/adversary.mjs:55,64` — fix: pass `env` to both `spawnSync` calls — verify: `node --test tests/cli/adversary.test.mjs` passes

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
