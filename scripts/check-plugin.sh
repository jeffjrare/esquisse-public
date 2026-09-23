#!/usr/bin/env bash
# Validate the Claude Code plugin and the migration invariants around its skills.
#
# Usage: scripts/check-plugin.sh [root] [claude-bound-s]
#
# THE CLAUDE BOUND. Each `claude plugin validate` call runs under GNU
# `timeout --kill-after=5 <bound>`, 60 s by default: the validator reads a local
# directory and touches no network, so 60 s (the decided bound — see
# docs/plans/2026-08-19-bounded-audit-subprocesses.md) is a hang, never a slow
# run. rc 124 becomes a finding `claude plugin validate timed out after <bound>s`
# — red, exit 1, never a warning — worded like scripts/check-bounded.sh's so the
# reader classifies it the same way (re-run the command directly, outside the
# audit's child process, to tell a sandbox limit from a defect). The bound is the
# second positional argument, never an environment variable: only the guard
# (scripts/test-plugin-guards.sh) passes `1`, to prove the hang fires, and
# nothing else has a reason to vary it.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2

ROOT="${1:-plugin}"
CLAUDE_BOUND="${2:-60}"
case "$CLAUDE_BOUND" in
  ''|*[!0-9]*|0) printf 'check-plugin.sh: claude bound must be a positive integer of seconds, got %s\n' "$CLAUDE_BOUND" >&2; exit 2 ;;
esac
PLUGIN="$ROOT/.claude-plugin/plugin.json"
SKILLS="$ROOT/skills"
HOOKS="$ROOT/hooks/hooks.json"
fails=0

fail() { printf '  ✗ %s\n' "$1"; fails=$((fails + 1)); }

[[ -f "$PLUGIN" ]] || { printf 'plugin manifest is missing: %s\n' "$PLUGIN" >&2; exit 2; }
[[ -d "$SKILLS" ]] || { printf 'skills directory is missing: %s\n' "$SKILLS" >&2; exit 2; }
[[ -x "$ROOT/bin/esq" ]] || fail 'plugin/bin/esq is missing or not executable'
[[ -f "$ROOT/lib/cli.mjs" && -f "$ROOT/lib/markdown.mjs" ]] || fail 'CLI library files are missing'
node --check "$ROOT/lib/cli.mjs" >/dev/null 2>&1 || fail 'CLI syntax validation failed'
[[ -f "$HOOKS" ]] || fail 'plugin/hooks/hooks.json is missing'
for script in hook-io protect-installed validate-stop record-agent-telemetry record-session-telemetry; do
  file="$ROOT/scripts/$script.mjs"
  [[ -f "$file" ]] || { fail "plugin/scripts/$script.mjs is missing"; continue; }
  node --check "$file" >/dev/null 2>&1 || fail "hook script syntax failed: $script.mjs"
done
if [[ -f "$HOOKS" ]]; then
  node -e 'const h=JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).hooks; if (!h?.PreToolUse || !h?.PostToolUse || !h?.Stop || !h?.SubagentStop || !h?.SessionEnd) process.exit(1)' "$HOOKS" \
    || fail 'hooks.json does not register PreToolUse, PostToolUse, Stop, SubagentStop and SessionEnd'
fi

# Runs `claude --bare "$@"` under the bound, with stdin from /dev/null. `--bare` is
# mandatory, not a tuning knob: a plugin-management subprocess needs no interactive
# runtime, and one measured on 2026-09-10 sat through a full 180 s bound before
# printing "Checking for updates" while the same command with `--bare` returned in
# 0.52 s. The boundary proven there is Claude Code's normal bootstrap, not the plugin
# subsystem being called — which is why the flag rides every governed call rather than
# one of them.
#
# `</dev/null` IS THE SECOND HALF, AND THE CARRIER OWNS IT. Measured the same day: the
# same bare `plugin update` that inherited this shell's interactive terminal on stdin
# sat through its full 180 s bound with nothing printed, while the identical command
# with `</dev/null` completed in 0.50 s. What is proven is the boundary, not a cause —
# normal stdin inheritance hangs, /dev/null completes; which subsystem waits on the
# descriptor is not established and is not claimed here. The redirection therefore
# lives on the subprocess this script spawns, never in a caller's memory: no maintainer
# and no audit has to remember to add it. scripts/test-plugin-guards.sh runs this
# script against a stub `claude` that reads stdin before continuing, over a stdin that
# never reaches EOF, and injects the redirection's removal.
#
# rc 124 is the bound firing, 137 the bound firing on a child that ignored TERM
# (--kill-after sent KILL) — both are the hang. A 137 that arrives before the bound
# is an outside KILL (OOM killer, sandbox policy), not a hang,
# so callers time the call (SECONDS) and only read 137 as the hang once elapsed >= bound.
claude_bounded() { timeout --kill-after=5 "$CLAUDE_BOUND" claude --bare "$@" </dev/null; }
hung="timed out after ${CLAUDE_BOUND}s — a hang, not a validator failure; run the command directly outside the audit to tell a sandbox limit from a defect"
# claude_hung <rc> <elapsed> — true when the run was the bound firing, not the command failing.
claude_hung() { [[ "$1" -eq 124 ]] || { [[ "$1" -eq 137 && "$2" -ge "$CLAUDE_BOUND" ]]; }; }

if ! command -v timeout >/dev/null 2>&1; then
  # macOS ships no `timeout`; failing loud beats running the validator unbounded.
  printf 'check-plugin.sh: GNU timeout not found — install coreutils\n' >&2; exit 2
elif command -v claude >/dev/null 2>&1; then
  SECONDS=0; out=$(claude_bounded plugin validate --strict "$ROOT" 2>&1); rc=$?; elapsed=$SECONDS
  if claude_hung "$rc" "$elapsed"; then fail "claude plugin validate --strict $ROOT $hung"
  elif [[ "$rc" -ne 0 ]]; then fail "Claude plugin validator rejected the package: $out"; fi
  if [[ "$ROOT" == plugin && -f .claude-plugin/marketplace.json ]]; then
    SECONDS=0; out=$(claude_bounded plugin validate --strict . 2>&1); rc=$?; elapsed=$SECONDS
    if claude_hung "$rc" "$elapsed"; then fail "claude plugin validate --strict . $hung"
    elif [[ "$rc" -ne 0 ]]; then fail "Claude marketplace validator rejected distribution: $out"; fi
  fi
else
  fail 'Claude Code is unavailable; the official plugin validator did not run'
fi

# No count and no line cap: a number in a guard is a number to renumber, and
# an entrypoint's length is a readability judgment (docs/AUDIT.md's pass), not
# a defect a script can recognize. What is checked is the frontmatter contract
# the harness actually reads.
count=$(find "$SKILLS" -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l)
[[ "$count" -gt 0 ]] || fail "no skill found under $SKILLS"

for file in "$SKILLS"/*/SKILL.md; do
  [[ -f "$file" ]] || continue
  name=$(basename "$(dirname "$file")")
  grep -qF "name: $name" "$file" || fail "$name has no stable frontmatter name"
  # The unattended trio's subagents invoke these seven via the Skill tool — roadmap for
  # /esq:advance's bare refresh only — and the harness offers no flag that permits explicit
  # invocation while blocking implicit (verified against the docs 2026-08-18) — so their guard
  # is the in-body mandate refusal instead.
  if [[ " build check review fix work plan roadmap " == *" $name "* ]]; then
    grep -qF 'disable-model-invocation' "$file" && fail "$name is orchestrator-invoked; the flag would break the unattended trio"
    grep -qF 'No mandate, no run.' "$file" || fail "$name is model-invocable but carries no in-body mandate guard"
  else
    grep -qF 'disable-model-invocation: true' "$file" || fail "$name can be invoked implicitly"
  fi
  grep -qE '^model: (sonnet|opus|haiku|inherit)$' "$file" || fail "$name has no supported model selection"
  grep -qE '^effort: (low|medium|high|xhigh|max)$' "$file" || fail "$name has no effort selection"
  if [[ "$name" != status ]]; then
    grep -qF '$ARGUMENTS' "$file" || fail "$name does not consume invocation arguments"
    grep -qF '$0' "$file" || fail "$name does not expose positional arguments"
  fi
done

forked=$(grep -RlF 'context: fork' "$SKILLS" --include=SKILL.md 2>/dev/null || true)
[[ -z "$forked" ]] || fail "context: fork is present without a completed runtime proof: $forked"

if [[ "$fails" -eq 0 ]]; then
  printf 'plugin, embedded CLI, native hooks and %d skills validate\n' "$count"
  exit 0
fi
printf '%d plugin finding(s).\n' "$fails"
exit 1
