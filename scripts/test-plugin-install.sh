#!/usr/bin/env bash
# Install the local marketplace and plugin with every Claude path sandboxed.
#
# BARE MODE. Every call here runs `claude --bare`: these are non-interactive plugin
# management subprocesses, and they do not need the interactive Claude runtime. On
# 2026-09-10 a `claude plugin update` without it sat through a full 180 s bound before
# printing "Checking for updates" while the same command with `--bare` returned in
# 0.52 s; the proven boundary is Claude Code's normal bootstrap, not the plugin
# subsystem, so the flag rides every governed management call in this repository.
#
# CLOSED STDIN. Every call here also runs `</dev/null`. Measured 2026-09-10: a bare
# `plugin update` that inherited an interactive terminal on stdin sat through its full
# 180 s bound with nothing printed, while the identical command with `</dev/null`
# completed in 0.50 s. The boundary is what is proven — normal stdin inheritance hangs,
# /dev/null completes — and no claim is made about which subsystem waits on the
# descriptor. The redirection rides run() itself, so a caller never has to remember it.
#
# THE CLAUDE BOUND. Every `claude plugin` call in run() is wrapped in GNU
# `timeout --kill-after=5 60`: the marketplace is this checkout and the install
# copies from it, so 60 s (the decided bound — see
# docs/plans/2026-08-19-bounded-audit-subprocesses.md) is a hang, not a slow
# network. rc 124 becomes `claude plugin <subcommand> timed out after 60s` on
# stderr and exit 1 — red, never a warning — worded like
# scripts/check-bounded.sh's finding so the reader classifies it the same way.
# The bound is a literal here: nothing fault-injects the *hang* in this script (a
# hung install would cost the full bound per case), and check-plugin.sh carries the
# proven twin of the same wiring. What is fault-injected is the `--bare` above:
# scripts/test-plugin-guards.sh runs this script against a logging stub `claude`,
# so the flag is asserted on the real argv and not merely grepped for.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2

QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true
SANDBOX=$(mktemp -d)
trap 'rm -rf "$SANDBOX"' EXIT
CLAUDE_BOUND=60

# `--bare` is mandatory on every call here, not a tuning knob: a plugin-management
# subprocess needs no interactive runtime, and the bootstrap that runtime pays for is
# what was measured hanging (see the header). scripts/test-plugin-guards.sh reads this
# script's real argv through a logging stub `claude` and reds if the flag is gone, and
# runs this script over a stdin that never reaches EOF against a stub that reads it,
# with the `</dev/null` below injected out — so both halves are proven on the real
# subprocess boundary rather than grepped for.
run() { CLAUDE_CONFIG_DIR="$SANDBOX" timeout --kill-after=5 "$CLAUDE_BOUND" claude --bare "$@" </dev/null; }
# claude_failed <subcommand> <rc> <output> — prints the finding for a non-zero run() and exits 1:
# rc 124 is the bound firing (137 when the child ignored TERM and --kill-after sent KILL —
# but only once elapsed >= the bound: an early 137 is an outside KILL, OOM killer or sandbox
# policy, and is reported as the command's own failure), anything else is the command's own
# failure text. Callers time each run() with SECONDS and leave the reading in `elapsed`.
claude_failed() {
  if [[ "$2" -eq 124 || ( "$2" -eq 137 && "$elapsed" -ge "$CLAUDE_BOUND" ) ]]; then
    printf 'claude plugin %s timed out after %ss — a hang, not an install failure; run the command directly outside the audit to tell a sandbox limit from a defect\n' "$1" "$CLAUDE_BOUND" >&2
  else
    printf 'sandbox %s failed: %s\n' "$1" "$3" >&2
  fi
  exit 1
}

if ! command -v claude >/dev/null 2>&1; then
  printf 'Claude Code is unavailable; sandbox installation was not exercised.\n' >&2
  exit 2
fi
if ! command -v timeout >/dev/null 2>&1; then
  # macOS ships no `timeout`; failing loud beats running the install unbounded.
  printf 'test-plugin-install.sh: GNU timeout not found — install coreutils\n' >&2
  exit 2
fi

SECONDS=0; out=$(run plugin marketplace add "$PWD" --scope user 2>&1); rc=$?; elapsed=$SECONDS
[[ "$rc" -eq 0 ]] || claude_failed "marketplace add" "$rc" "$out"
SECONDS=0; out=$(run plugin install esq@esquisse --scope user 2>&1); rc=$?; elapsed=$SECONDS
[[ "$rc" -eq 0 ]] || claude_failed "install" "$rc" "$out"

SECONDS=0; list=$(run plugin list --json 2>&1); rc=$?; elapsed=$SECONDS
[[ "$rc" -eq 0 ]] || claude_failed "list" "$rc" "$list"
grep -qF '"id": "esq@esquisse"' <<<"$list" || {
  printf 'sandbox install does not list esq@esquisse: %s\n' "$list" >&2
  exit 1
}

# Every skill in the source tree reached the cache — the claim is that the
# install carried the package whole, not that the package holds a fixed number.
want=$(find "plugin/skills" -mindepth 2 -maxdepth 2 -type f -name SKILL.md 2>/dev/null | wc -l)
count=$(find "$SANDBOX/plugins/cache/esquisse/esq" -type f -name SKILL.md 2>/dev/null | wc -l)
[[ "$count" -eq "$want" && "$want" -gt 0 ]] || {
  printf 'sandbox cache contains %s of the %s skills in plugin/skills\n' "$count" "$want" >&2
  exit 1
}

cli=$(find "$SANDBOX/plugins/cache/esquisse/esq" -type f -path '*/bin/esq' -print -quit)
[[ -n "$cli" && -x "$cli" ]] || {
  printf 'sandbox cache does not expose an executable bin/esq\n' >&2
  exit 1
}
cli_out=$(cd "$PWD" && "$cli" validate 2>&1) || {
  printf 'installed esq validate failed: %s\n' "$cli_out" >&2
  exit 1
}
grep -qF '"valid": true' <<<"$cli_out" || {
  printf 'installed esq validate returned no valid result: %s\n' "$cli_out" >&2
  exit 1
}

plugin_root=$(dirname "$(dirname "$cli")")
[[ -f "$plugin_root/hooks/hooks.json" ]] || {
  printf 'sandbox cache does not contain hooks/hooks.json\n' >&2
  exit 1
}
for script in protect-installed validate-stop record-agent-telemetry; do
  [[ -f "$plugin_root/scripts/$script.mjs" ]] || {
    printf 'sandbox cache does not contain scripts/%s.mjs\n' "$script" >&2
    exit 1
  }
done

outside=$(find "$SANDBOX/plugins/cache/esquisse/esq" -type l -exec readlink -f {} \; 2>/dev/null \
  | grep -v "^$SANDBOX/" || true)
[[ -z "$outside" ]] || {
  printf 'sandbox plugin contains links escaping its cache: %s\n' "$outside" >&2
  exit 1
}

[[ "$QUIET" == true ]] || printf 'marketplace install discovered all %s skills, the CLI and native hooks in an isolated Claude config\n' "$count"
