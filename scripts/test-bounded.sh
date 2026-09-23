#!/usr/bin/env bash
#
# test-bounded.sh — functional tests for scripts/check-bounded.sh.
#
# The behavior they hold: every node suite runs under a hard bound, and a hang
# becomes a red line that NAMES the suite and the bound — never an audit that
# does not return (2026-08-18, managed sandbox: the hook suite hung inside a
# spawnSync and the only gate this repo has sat there). Each case makes the
# outcome exist and asserts the runner's specific finding string for it, never
# a bare non-zero — a runner that refuses everything would pass a bare-exit
# test while the wording the audit prints is gone.
#
# Cost: no node fixture is needed for the bound itself — `sleep` under bound 1
# is the hang (~1 s), a TERM-ignoring `sleep` is the hang that needs KILL
# (~6 s, the one case that pays --kill-after), `false` is the failure, `true`
# is the clean run. Two real `node --test` cases (~0.6 s each) prove the two
# layers compose and that a failing test survives the passing ones printed
# after it. The whole file is ~9 s.
#
# On the diagnostic: the runner's evidence for a FAILURE is the first words the
# suite printed, and for a hang the last. Case 7 asserts the failing test
# survives 45 passing lines; cases 3 and 10 assert the tail is still what a
# non-TAP failure and a hang get; case 9 counts the command's own invocations,
# because a diagnostic obtained by re-running the suite would satisfy every
# other assertion here and cost the bound twice.
#
# On the node layer (case 5): under Node 22, `node --test --test-timeout=N`
# applies in the parent runner to the per-file test, so the failure names the
# test FILE and says `test timed out after Nms`. That is still the distinction
# the audit needs: "node's own timeout fired" (a slow but alive sandbox, named
# file, named bound) versus the outer `timed out after` line (a hang node could
# not unwind).
#
# Usage: scripts/test-bounded.sh [--quiet]
# Exit 0 = every case holds, 1 = the runner is missing an outcome or
#          overreaching, 2 = the runner itself is missing.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2
REPO_ROOT="$PWD"
CHECK="$REPO_ROOT/scripts/check-bounded.sh"

QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true

fails=0
say()  { [[ "$QUIET" == true ]] || printf '%s\n' "$1"; }
pass() { [[ "$QUIET" == true ]] || printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; fails=$((fails + 1)); }

[[ -x "$CHECK" ]] || { printf 'FATAL: %s is missing or not executable\n' "$CHECK" >&2; exit 2; }

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

# Runs the runner, asserts the exit code AND that the output carries the
# specific string the case injected for.
assert_case() {
  local want_rc="$1" want="$2" label="$3"; shift 3
  local out rc
  out=$("$CHECK" "$@" 2>&1); rc=$?
  if [[ "$rc" -ne "$want_rc" ]]; then
    fail "$label — expected exit $want_rc, got $rc. Output:"
    sed 's/^/      /' <<<"$out"
    return
  fi
  if grep -qF -- "$want" <<<"$out"; then
    pass "$label"
  else
    fail "$label — exit $rc as expected, but the wording is wrong. Wanted: \"$want\". Got:"
    sed 's/^/      /' <<<"$out"
  fi
}

# --- case 1: the hang — the failure actually observed -----------------------
# `sleep 30` under bound 1 must end as a named timeout within ~2 s. The timing
# assertion is what proves the bound is real: a runner that waited the sleep
# out and then reported a timeout would also print the right words.

say ""
say "1. A command that hangs is named, with its bound, inside the bound"

start=$(date +%s)
assert_case 1 "hang-case timed out after 1s" "sleep 30 under bound 1 fires the timed-out line naming the label" 1 hang-case -- sleep 30
elapsed=$(( $(date +%s) - start ))
if [[ "$elapsed" -gt 3 ]]; then
  fail "the hang case took ${elapsed}s — the bound is not bounding"
fi

# --- case 1b: the hang that ignores TERM --------------------------------------
# GNU timeout exits 137, not 124, when --kill-after has to send KILL. That is
# the one case --kill-after exists for, and it must still read as a hang: a
# runner that only matches 124 reports it as `failed (exit 137)` and loses the
# distinction. Bound 1 + kill-after 5 = ~6 s; 8 s is the ceiling.

say ""
say "1b. A command that hangs and ignores TERM is still named as a hang"

start=$(date +%s)
assert_case 1 "stubborn-case timed out after 1s" "a TERM-ignoring sleep under bound 1 is killed and reported as timed out" 1 stubborn-case -- bash -c 'trap "" TERM; sleep 30'
elapsed=$(( $(date +%s) - start ))
if [[ "$elapsed" -gt 8 ]]; then
  fail "the TERM-ignoring hang case took ${elapsed}s — --kill-after is not killing"
fi

# --- case 1c: a KILL from outside, before the bound, is not the hang ---------
# GNU timeout also exits 137 when the child is SIGKILLed by something else
# (OOM killer, a sandbox's process policy) long before the bound. A runner
# that maps every 137 to the hang wording sends the reader chasing a hang that
# never happened; it must fall through to `failed (exit 137)` instead.

say ""
say "1c. A child KILLed from outside before the bound is a failure, not a hang"

assert_case 1 "early-kill-case failed (exit 137)" "a self-KILLed child under bound 30 reads as failed (exit 137), never as timed out" 30 early-kill-case -- bash -c 'kill -KILL $$'

# --- case 2: the failure — distinct wording from the hang -------------------

say ""
say "2. A command that fails is named as failed, not as hung"

assert_case 1 "fail-case failed (exit 1)" "false fires the failed (exit 1) line" 5 fail-case -- false

# --- case 3: diagnostics are kept, not swallowed ----------------------------
# The old audit lines sent node's output to /dev/null and told the reader to
# re-run the suite themselves. The distinctive line must reach the screen.

say ""
say "3. A failing command's own output is printed under the finding"

assert_case 1 "DIAG-LINE-7f3a" "a distinctive diagnostic line survives into the output" 5 diag-case -- sh -c 'echo DIAG-LINE-7f3a; exit 1'

# --- case 4: the clean run — what the runner must NOT flag ------------------

say ""
say "4. A clean command passes and prints nothing red"

out=$("$CHECK" 5 clean-case -- true 2>&1); rc=$?
if [[ "$rc" -ne 0 ]]; then
  fail "true was flagged (exit $rc) — the runner overreaches:"
  sed 's/^/      /' <<<"$out"
elif grep -qE 'timed out|failed' <<<"$out"; then
  fail "true exited 0 but the output reads red: $out"
else
  pass "true exits 0 with a one-line summary and no finding wording"
fi

# --- case 5: the two layers compose -----------------------------------------
# A throwaway test file whose one test awaits a promise a live timer keeps
# pending, run the way checks 30/31 run the real suites. node's own
# --test-timeout must be what fires (the file is named, "test timed out after
# 500ms" is in the kept output) and the runner must report it as a FAILURE —
# the outer bound of 10 s is never reached.

say ""
say "5. node's own --test-timeout fires first and its diagnostic is kept"

mkdir -p "$SCRATCH/tests"
cat > "$SCRATCH/tests/hang.test.mjs" <<'EOF'
import { test } from 'node:test';
test('never resolves', async () => { await new Promise((r) => setTimeout(r, 60_000)); });
EOF
out=$("$CHECK" 10 throwaway-suite -- node --test --test-timeout=500 "$SCRATCH/tests/hang.test.mjs" 2>&1); rc=$?
if [[ "$rc" -ne 1 ]]; then
  fail "the hanging node test exited $rc from the runner, expected 1 (failed). Output:"
  sed 's/^/      /' <<<"$out"
elif ! grep -qF "throwaway-suite failed (exit" <<<"$out"; then
  fail "node's timeout was reported as something other than a failure — the outer bound fired instead? Output:"
  sed 's/^/      /' <<<"$out"
elif grep -qF "test timed out after 500ms" <<<"$out" && grep -qF "hang.test.mjs" <<<"$out"; then
  pass "node --test-timeout names the test file and the 500ms bound inside a failed finding"
else
  fail "the runner said failed but the kept output does not name the timed-out test. Got:"
  sed 's/^/      /' <<<"$out"
fi

# --- case 6: a missing executable is unusable input, never a pass -----------

say ""
say "6. A command that cannot be found exits 2, never 0"

"$CHECK" 5 missing-case -- definitely-not-an-executable-7f3a >/dev/null 2>&1; rc=$?
if [[ "$rc" -eq 2 ]]; then
  pass "a missing executable exits 2 rather than passing vacuously"
else
  fail "a missing executable exited $rc — expected 2"
fi

# --- case 7: a failure early in a long run keeps its name and its error ------
# B-090, exactly as observed on check 39: node prints the `not ok` line where
# the test broke and then every passing test after it, so the last 40 lines of
# a check gating several files are forty `ok` lines and a `# fail` count naming
# nothing — and the maintainer whose commit reds re-runs `node --test` by hand
# to read an error the audit already captured.

say ""
say "7. A failing test followed by 45 passing ones is still named, with its error"

cat > "$SCRATCH/tests/late.test.mjs" <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert';
test('outer suite', async (t) => {
  await t.test('inner failing thing', () => { assert.equal(1, 2, 'one is not two'); });
});
for (let i = 0; i < 45; i++) test(`passing ${i}`, () => {});
EOF
out=$("$CHECK" 30 late-failure-case -- node --test "$SCRATCH/tests/late.test.mjs" 2>&1); rc=$?
lines=$(wc -l <<<"$out")
if [[ "$rc" -ne 1 ]]; then
  fail "the failing suite exited $rc from the runner, expected 1 (failed). Output:"
  sed 's/^/      /' <<<"$out"
elif ! grep -qF "not ok 1 - inner failing thing" <<<"$out"; then
  fail "the failing test's name did not survive the 45 passing lines printed after it. Got:"
  sed 's/^/      /' <<<"$out"
elif ! grep -qF "one is not two" <<<"$out"; then
  fail "the failing test was named but its assertion error was dropped. Got:"
  sed 's/^/      /' <<<"$out"
elif ! grep -qF "late.test.mjs" <<<"$out"; then
  fail "neither the failing test's file nor its location reached the output. Got:"
  sed 's/^/      /' <<<"$out"
elif [[ "$lines" -gt 50 ]]; then
  fail "the diagnostic ran to $lines lines — it is not bounded, it is a dump"
else
  pass "the failing test, its file and its assertion survive, in $lines lines"
fi

# --- case 9: the diagnostic costs exactly one execution ----------------------
# The whole point of B-090 is not paying for the same output twice. A runner
# that re-ran the command to obtain details would satisfy every other assertion
# in this file, so the command counts its own invocations and the count is the
# assertion.

say ""
say "9. The diagnostic comes from the capture — the command runs exactly once"

COUNTER="$SCRATCH/invocations"
: > "$COUNTER"
cat > "$SCRATCH/fake-suite.sh" <<'EOF'
#!/usr/bin/env bash
echo run >> "$INVOCATION_LOG"
echo "TAP version 13"
echo "not ok 1 - the one that broke"
echo "  ---"
echo "  error: 'counted once'"
echo "  ..."
for i in $(seq 1 60); do echo "ok $((i + 1)) - filler $i"; done
echo "# fail 1"
exit 1
EOF
chmod +x "$SCRATCH/fake-suite.sh"
out=$(INVOCATION_LOG="$COUNTER" "$CHECK" 30 one-shot-case -- "$SCRATCH/fake-suite.sh" 2>&1)
runs=$(wc -l < "$COUNTER")
if [[ "$runs" -ne 1 ]]; then
  fail "the command ran $runs time(s) — the details must come from the capture, never from a re-run"
elif grep -qF "not ok 1 - the one that broke" <<<"$out" && grep -qF "counted once" <<<"$out"; then
  pass "one execution produced the failing name and its error"
else
  fail "one execution, but the diagnostic is missing. Got:"
  sed 's/^/      /' <<<"$out"
fi

# --- case 10: a hang still gets the tail ------------------------------------
# The extractor narrows a FAILURE. A hang has no completed failure block, and
# the lines it managed to print before it stopped are the one free clue to
# which test hung — they must still reach the screen.

say ""
say "10. A hang that printed before it stopped still shows those lines"

out=$("$CHECK" 1 progress-hang-case -- bash -c 'echo PROGRESS-4b1d; sleep 30' 2>&1); rc=$?
if [[ "$rc" -ne 1 ]]; then
  fail "the hang exited $rc from the runner, expected 1. Output:"
  sed 's/^/      /' <<<"$out"
elif ! grep -qF "progress-hang-case timed out after 1s" <<<"$out"; then
  fail "the hang was not reported as a timeout. Got:"
  sed 's/^/      /' <<<"$out"
elif grep -qF "PROGRESS-4b1d" <<<"$out"; then
  pass "the tail fallback still carries what the hung command printed"
else
  fail "the timeout was named but the lines before the hang were dropped. Got:"
  sed 's/^/      /' <<<"$out"
fi

# --- summary ---------------------------------------------------------------

say ""
if [[ "$fails" -eq 0 ]]; then
  [[ "$QUIET" == true ]] || printf '\033[32m%s\033[0m\n' "the bounded runner names a hang (TERM-honouring or not), a failure (including an early outside KILL) and a missing command, names the failing test from its own capture in one execution, keeps the tail for everything else, and passes a clean run"
  exit 0
else
  printf '\033[31m%s\033[0m\n' "$fails failure(s) — the bounded runner is not doing its job."
  exit 1
fi
