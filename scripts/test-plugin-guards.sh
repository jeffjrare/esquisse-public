#!/usr/bin/env bash
# Fault injection for plugin structure checks.
#
# The hung-`claude` case costs ~1 s: check-plugin.sh takes its claude bound as a
# positional argument, so the guard passes `1` against a PATH-stubbed `claude`
# that sleeps — the 60 s production bound is never paid here. The guard still
# wraps that run in `timeout 10` so a regression in the bound itself cannot
# hang the audit. The closed-stdin cases at the bottom pay the same way: the
# de-stdin check-plugin.sh reds at its own 1 s bound, and the de-stdin
# test-plugin-install.sh — whose 60 s bound is a literal it does not expose — is
# stopped by a 3 s fixture bound instead. Every case here is bounded; none waits.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2

QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true
fails=0
SCRATCH=$(mktemp -d)
trap 'rm -rf "$SCRATCH"' EXIT

pass() { [[ "$QUIET" == true ]] || printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1"; fails=$((fails + 1)); }

mkdir -p "$SCRATCH/plugin"
cp -r plugin/.claude-plugin plugin/skills "$SCRATCH/plugin/"
# hooks.json travels too, so the same run (one validator invocation, not two) also proves the
# registration check fires when the SessionEnd closer of the session writer is dropped.
mkdir -p "$SCRATCH/plugin/hooks"
node -e 'const fs=require("node:fs"); const h=JSON.parse(fs.readFileSync("plugin/hooks/hooks.json","utf8")); delete h.hooks.SessionEnd; fs.writeFileSync(process.argv[1], JSON.stringify(h))' "$SCRATCH/plugin/hooks/hooks.json"

sed -i '/disable-model-invocation: true/d' "$SCRATCH/plugin/skills/backlog/SKILL.md"
out=$(scripts/check-plugin.sh "$SCRATCH/plugin" 2>&1); rc=$?
[[ "$rc" -ne 0 && "$out" == *'backlog can be invoked implicitly'* ]] \
  && pass 'mutating skill without invocation guard fails' \
  || fail "invocation-guard fault was missed: $out"
[[ "$rc" -ne 0 && "$out" == *'does not register PreToolUse, PostToolUse, Stop, SubagentStop and SessionEnd'* ]] \
  && pass 'hooks.json without the SessionEnd registration fails' \
  || fail "missing SessionEnd registration was missed: $out"
cp plugin/skills/backlog/SKILL.md "$SCRATCH/plugin/skills/backlog/SKILL.md"
cp plugin/hooks/hooks.json "$SCRATCH/plugin/hooks/hooks.json"

sed -i '2a disable-model-invocation: true' "$SCRATCH/plugin/skills/build/SKILL.md"
out=$(scripts/check-plugin.sh "$SCRATCH/plugin" 2>&1); rc=$?
[[ "$rc" -ne 0 && "$out" == *'the flag would break the unattended trio'* ]] \
  && pass 'flag on an orchestrator-invoked skill fails' \
  || fail "trio-breaking flag was missed: $out"
cp plugin/skills/build/SKILL.md "$SCRATCH/plugin/skills/build/SKILL.md"

# The roadmap joined the model-invocable set for advance's bare refresh; its guard is the
# in-body refusal too, so the flag coming back must fail exactly as it does on build.
sed -i '2a disable-model-invocation: true' "$SCRATCH/plugin/skills/roadmap/SKILL.md"
out=$(scripts/check-plugin.sh "$SCRATCH/plugin" 2>&1); rc=$?
[[ "$rc" -ne 0 && "$out" == *'roadmap is orchestrator-invoked'* ]] \
  && pass 'flag back on the roadmap refresh fails' \
  || fail "the roadmap's flag was missed: $out"
cp plugin/skills/roadmap/SKILL.md "$SCRATCH/plugin/skills/roadmap/SKILL.md"

sed -i '/No mandate, no run\./d' "$SCRATCH/plugin/skills/build/SKILL.md"
out=$(scripts/check-plugin.sh "$SCRATCH/plugin" 2>&1); rc=$?
[[ "$rc" -ne 0 && "$out" == *'no in-body mandate guard'* ]] \
  && pass 'model-invocable skill without mandate guard fails' \
  || fail "missing mandate guard was missed: $out"

cp plugin/skills/build/SKILL.md "$SCRATCH/plugin/skills/build/SKILL.md"

# A `claude` that hangs must become the named timeout finding, never a silent wait: the stub
# cannot pass --strict either, so the assertion is the hang wording specifically, not a bare failure.
mkdir -p "$SCRATCH/stub"
printf '#!/bin/sh\nsleep 30\n' > "$SCRATCH/stub/claude"
chmod +x "$SCRATCH/stub/claude"
out=$(PATH="$SCRATCH/stub:$PATH" timeout 10 scripts/check-plugin.sh "$SCRATCH/plugin" 1 2>&1); rc=$?
[[ "$rc" -eq 1 && "$out" == *'claude plugin validate --strict '*' timed out after 1s — a hang, not a validator failure'* ]] \
  && pass 'hung claude becomes the named timeout finding within the bound' \
  || fail "hung claude was not reported as a timeout (rc $rc): $out"

# --- Bare mode on every governed plugin-management invocation ----------------
# A non-interactive `claude plugin ...` subprocess does not need the interactive
# Claude runtime, and the bootstrap it would otherwise pay for is the boundary that
# was measured hanging on 2026-09-10: a `claude plugin update` sat through a full
# 180 s bound before printing "Checking for updates", while the same command with
# `--bare` returned in 0.52 s. Which bootstrap subsystem hung is not established and
# is not claimed here — the durable rule is the flag.
#
# The assertion reads each carrier's REAL argv rather than its source text: a logging
# stub `claude` first on PATH records every invocation and exits 0, which costs no
# validator and no install. The de-bared copies below are the fault injection —
# stripping `--bare` from either carrier must make the same assertion red.
mkdir -p "$SCRATCH/logstub"
cat > "$SCRATCH/logstub/claude" <<'STUB'
#!/bin/sh
printf '%s\n' "$*" >> "$CLAUDE_ARGV_LOG"
# STUB_READ_STDIN makes this stub do what the real plugin-management subprocess was
# measured doing: touch stdin before continuing. With the carrier's `</dev/null` in
# place that read hits EOF at once; on an inherited stdin that never EOFs it blocks,
# which is exactly the hang being guarded against. It is opt-in so the argv cases
# above, which run on whatever stdin the audit itself has, cannot block. Both fds go
# to /dev/null so a `cat` orphaned by the bound holds no caller's capture pipe open.
[ -n "${STUB_READ_STDIN:-}" ] && cat >/dev/null 2>&1
exit 0
STUB
chmod +x "$SCRATCH/logstub/claude"
export CLAUDE_ARGV_LOG="$SCRATCH/claude-argv.log"

# A root holding de-bared copies of both carriers. Each script cd's to its own
# parent, so plugin/ and the marketplace manifest are symlinked in rather than
# copied — nothing here writes into the repository.
mkdir -p "$SCRATCH/debared/scripts"
ln -s "$PWD/plugin" "$SCRATCH/debared/plugin"
ln -s "$PWD/.claude-plugin" "$SCRATCH/debared/.claude-plugin"
for script in check-plugin.sh test-plugin-install.sh; do
  sed 's/claude --bare /claude /g' "scripts/$script" > "$SCRATCH/debared/scripts/$script"
  chmod +x "$SCRATCH/debared/scripts/$script"
done

carrier_argv() { # $1 root, $2 script, $3… args → argv of that run, one per line
  : > "$CLAUDE_ARGV_LOG"
  local root="$1" script="$2"; shift 2
  PATH="$SCRATCH/logstub:$PATH" "$root/scripts/$script" "$@" >/dev/null 2>&1
  cat "$CLAUDE_ARGV_LOG"
}
bare_verdict() { # $1 argv text → "clean", "none" (nothing invoked) or the offending lines
  if [[ -z "$1" ]]; then printf 'none'; return; fi
  local bad; bad=$(grep -v '^--bare ' <<< "$1" | tr '\n' ';')
  [[ -z "$bad" ]] && printf 'clean' || printf '%s' "$bad"
}

argv=$(carrier_argv "$PWD" check-plugin.sh plugin)
[[ "$(bare_verdict "$argv")" == clean ]] \
  && pass "check-plugin.sh validates through claude --bare ($(wc -l <<< "$argv") invocation(s))" \
  || fail "check-plugin.sh invoked claude outside bare mode: $(bare_verdict "$argv")"

argv=$(carrier_argv "$SCRATCH/debared" check-plugin.sh plugin)
[[ "$(bare_verdict "$argv")" != clean && "$(bare_verdict "$argv")" != none ]] \
  && pass 'check-plugin.sh with --bare stripped is caught' \
  || fail "a de-bared check-plugin.sh was missed: $(bare_verdict "$argv")"

argv=$(carrier_argv "$PWD" test-plugin-install.sh --quiet)
[[ "$(bare_verdict "$argv")" == clean ]] \
  && pass "test-plugin-install.sh installs through claude --bare ($(wc -l <<< "$argv") invocation(s))" \
  || fail "test-plugin-install.sh invoked claude outside bare mode: $(bare_verdict "$argv")"

argv=$(carrier_argv "$SCRATCH/debared" test-plugin-install.sh --quiet)
[[ "$(bare_verdict "$argv")" != clean && "$(bare_verdict "$argv")" != none ]] \
  && pass 'test-plugin-install.sh with --bare stripped is caught' \
  || fail "a de-bared test-plugin-install.sh was missed: $(bare_verdict "$argv")"

# --- Closed stdin on every governed plugin-management invocation --------------
# `--bare` was only half of it. Measured 2026-09-10: a bare `claude plugin update`
# whose subprocess inherited an interactive terminal on stdin sat through its full
# 180 s bound with nothing printed, while the identical command with `</dev/null`
# completed in 0.50 s. The boundary is all that is proven — normal stdin inheritance
# hangs, /dev/null completes — and nothing here claims which subsystem waits on the
# descriptor. So each carrier closes stdin for its own child, and these cases prove it
# on the real subprocess rather than on the source text.
#
# The fixture supplies what a test runner cannot be assumed to have: a stdin that
# stays OPEN and never delivers anything. A fifo held open for writing by fd 9 is
# exactly that, and it is deterministic whether or not this suite has a TTY. The stub
# reads stdin before continuing (STUB_READ_STDIN), so a child that inherits the fifo
# blocks and a child handed /dev/null sees EOF immediately.
#
# Every run is bounded and writes to a FILE, never a pipe: when a bound fires it kills
# the carrier and leaves the blocked `cat` orphaned, and a capture pipe would keep the
# fixture waiting on that orphan instead of reporting the hang.
mkdir -p "$SCRATCH/nostdin/scripts"
ln -s "$PWD/plugin" "$SCRATCH/nostdin/plugin"
ln -s "$PWD/.claude-plugin" "$SCRATCH/nostdin/.claude-plugin"
for script in check-plugin.sh test-plugin-install.sh; do
  sed 's| </dev/null||g' "scripts/$script" > "$SCRATCH/nostdin/scripts/$script"
  chmod +x "$SCRATCH/nostdin/scripts/$script"
  if cmp -s "scripts/$script" "$SCRATCH/nostdin/scripts/$script"; then
    fail "the stdin fault injection changed nothing in $script — it closes no child's stdin"
  fi
done

HOLD="$SCRATCH/held-stdin"
mkfifo "$HOLD"
exec 9<>"$HOLD"   # read-write so opening never blocks; the write end is what keeps it open

held_run() { # $1 outer bound, $2 root, $3 script, $4… args → sets $rc and $out
  local bound="$1" root="$2" script="$3"; shift 3
  : > "$SCRATCH/held.out"
  STUB_READ_STDIN=1 PATH="$SCRATCH/logstub:$PATH" CLAUDE_ARGV_LOG="$CLAUDE_ARGV_LOG" \
    timeout --kill-after=2 "$bound" "$root/scripts/$script" "$@" \
    < "$HOLD" > "$SCRATCH/held.out" 2>&1
  rc=$?
  out=$(cat "$SCRATCH/held.out")
}

# check-plugin.sh takes its claude bound positionally, so its injected copy reds in
# about a second through its OWN named finding rather than through the fixture's bound.
held_run 30 "$PWD" check-plugin.sh plugin 1
if [[ "$rc" -ne 124 && "$out" != *'timed out after 1s'* ]]; then
  pass 'check-plugin.sh completes on a stdin that never EOFs — its validator child reads /dev/null'
else
  fail "check-plugin.sh did not complete on a never-EOF stdin (rc $rc): $out"
fi

held_run 30 "$SCRATCH/nostdin" check-plugin.sh plugin 1
if [[ "$rc" -eq 1 && "$out" == *'timed out after 1s'* ]]; then
  pass 'check-plugin.sh without </dev/null blocks on that stdin and reds at its own bound'
elif [[ "$rc" -eq 124 ]]; then
  fail 'a de-stdin check-plugin.sh ran past its own bound — the fixture had to stop it'
else
  fail "a de-stdin check-plugin.sh was missed (rc $rc): $out"
fi

# test-plugin-install.sh holds its 60 s bound as a literal, so its injected copy is
# stopped by the fixture's own 3 s bound instead — red, and never an unbounded wait.
held_run 60 "$PWD" test-plugin-install.sh --quiet
if [[ "$rc" -ne 124 ]]; then
  pass 'test-plugin-install.sh completes on a stdin that never EOFs — each plugin call reads /dev/null'
else
  fail "test-plugin-install.sh did not complete on a never-EOF stdin: $out"
fi

held_run 3 "$SCRATCH/nostdin" test-plugin-install.sh --quiet
if [[ "$rc" -eq 124 ]]; then
  pass 'test-plugin-install.sh without </dev/null blocks on that stdin and reds at the bound'
else
  fail "a de-stdin test-plugin-install.sh was missed (rc $rc): $out"
fi

# Release the write end: every `cat` still blocked on the fifo now reads EOF and exits,
# so no case above leaves a process behind.
exec 9>&-

if scripts/check-plugin.sh plugin >/dev/null 2>&1; then
  pass 'the unmodified plugin passes'
else
  fail 'the unmodified plugin fails'
fi

if [[ "$fails" -eq 0 ]]; then
  [[ "$QUIET" == true ]] || printf 'Clean — plugin guards fire on unsafe frontmatter, a hung claude, a plugin-management call that left bare mode and one that left its stdin open.\n'
  exit 0
fi
printf '%d failure(s) — plugin guards are not trustworthy.\n' "$fails"
exit 1
