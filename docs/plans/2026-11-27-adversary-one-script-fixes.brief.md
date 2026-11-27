# Fixes brief: The Codex/Gemini adversary runs through one shipped script

Source: /esq:review on adversary-one-script, 2026-11-27
Reviewed at: ce7472b

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- A `wait` sent right after a background `launch` can poll before the launch has written `.meta.json`, count the provider as never launched, exit 0 at once, and leave the merge reading `never launched` for a call that is running (Gemini F1, introduced by 12aaee8) — `plugin/skills/plan/references/adversary.mjs:284-290` — fix: a provider with no meta stays pending for a 10 s startup grace before it counts as never launched — verify: `node --test tests/cli/adversary.test.mjs` passes a case where `wait` started before a delayed launch waits for it
- On a system whose `timeout` is not GNU coreutils (macOS ships none; Homebrew names it `gtimeout`), every launch fails at spawn and the `.err` names the provider rather than `timeout` (Gemini F2) — `plugin/skills/plan/references/adversary.mjs:212-214` — fix: use `timeout`, else `gtimeout`, when `--version` names GNU coreutils, else bound the call with the script's own timer; a spawn failure names the command actually spawned — verify: `node --test tests/cli/adversary.test.mjs` passes a case with no GNU timeout on PATH that still times out at its bound
- When a provider ignores SIGTERM and `timeout --kill-after` escalates, `timeout` exits 137, not 124, so the call reads as `exit 137` or a parse failure instead of `timed out after <bound> s` (Gemini F3) — `plugin/skills/plan/references/adversary.mjs:235` — fix: a 137 at or past the bound is a timeout too — verify: `node --test tests/cli/adversary.test.mjs` passes a case with a fake ignoring SIGTERM read as timed out
- `probe-gemini-readonly.sh` prints `agy exited <rc>`, but `rc` is now the script's exit (0 when agy ran), so a failed agy reads as `agy exited 0` (Gemini F4) — `scripts/probe-gemini-readonly.sh:127` — fix: print `meta_field exitCode`, else `rc` — verify: `bash -n scripts/probe-gemini-readonly.sh`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
