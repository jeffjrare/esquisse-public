#!/usr/bin/env bash
#
# check-bounded.sh — run one audit subprocess under a hard bound and turn a
# hang into a named finding.
#
# WHY THIS EXISTS. audit.sh's checks 30 and 31 ran `node --test` bare, output
# to /dev/null, with no bound. On 2026-08-18 the hook suite hung inside its
# end-to-end child-process test in a managed sandbox and the audit — this
# repo's only gate — never returned. node cannot unwind that case on its own:
# the test blocks in `spawnSync`, which holds the event loop, so node's own
# `--test-timeout` timer never gets to fire. An OUTER `timeout` is the only
# instrument that bounds it. node's per-test timeout is still wanted as a layer
# underneath (it names the *test* when the sandbox is slow rather than dead),
# which is why callers pass `--test-timeout` in the command; this runner only
# owns the outer bound, the diagnostic capture, and the finding wording.
#
# THE BOUNDS (decided in docs/plans/2026-08-19-bounded-audit-subprocesses.md):
#   120 s outer per node --test suite — ~250× the local runtime, well under
#         anything a contributor would wait for;
#   --test-timeout=30000 per test, passed by the caller inside the command;
#   --kill-after=5 — a child that ignores TERM still dies, so the worst case
#         is bound + 5 s, never unbounded.
# The bound is a positional argument, never an environment variable: the guard
# (scripts/test-bounded.sh) passes `1` to inject a hang, and nothing else
# has a reason to vary it.
#
# OUTPUT CONTRACT. The first line on stdout is the one the caller turns into
# its finding (or its green summary); anything after it is the captured
# diagnostic, already indented, for the caller to print as-is. The suite's own
# output is captured to a scratch file and shown on every finding, a hang
# included — a clean run prints one summary line and nothing else, so audit.sh
# stays quiet.
#
# WHICH PART OF THE CAPTURE. A failure's evidence is the FIRST words a suite
# printed; a hang's is the LAST. One window cannot serve both, and the tail was
# serving the hang: node keeps printing every passing test after the one that
# broke, so a check gating eight suites reported forty lines of `ok 41 -
# passing 39` and a `# fail 1` naming nothing, and the maintainer re-ran
# `node --test` by hand to read an error already on disk (B-090). So the
# diagnostic is two layers, in this order:
#
#   show_failures — one awk pass over the capture that keeps every `not ok N -
#     <name>` line at any indentation (so a nested subtest failure keeps both
#     its own line and its parent suite's) with the more-indented YAML block
#     under it — `location:`, `failureType:`, `error:` — plus the run's own
#     `# tests / # pass / # fail` totals. `duration_ms:` and `type:` are
#     dropped: they open every block, say nothing about the failure, and the
#     two lines they cost are two lines of a deepStrictEqual diff, which is
#     what the reader actually came for. Bounded by construction: at most
#     MAX_FAILURES blocks of at most MAX_BLOCK_LINES lines each, a marker line
#     wherever either bound truncates, and a count of the failures it did not
#     show — 58 lines of ceiling, never the whole capture.
#   show_tail — the last 40 lines, unchanged, and the right answer for
#     everything that is not a completed failure: a non-TAP command and a suite
#     that died before printing one — and, unconditionally, a HANG. A hang's
#     evidence is the last thing the suite managed to print, which narrows it
#     to the test that stopped; a suite that also failed a test earlier holds
#     a `not ok` block the extractor would happily print instead, under a line
#     that says "a hang, not a test failure", losing the only clue there was.
#     So the two timeout branches call show_tail directly and never the
#     extractor.
#
# show_diagnostic — the failure branch alone: the extractor, falling back to
# the tail whenever it extracts nothing, including on a machine with no awk,
# where it exits 127. It only ever narrows what is printed under a finding the
# exit code has already decided: it never reports, suppresses or changes one.
#
# EXIT CONTRACT.
#   0  the command exited 0 — one summary line on stdout.
#   1  a finding — the command timed out (timeout's rc 124, or 137 at or past
#      the bound, when the child ignored TERM and --kill-after had to KILL it;
#      "a hang, not a test failure") or exited non-zero ("failed (exit N)",
#      then the last 40 captured lines — a 137 that arrives before the bound is
#      an outside KILL, not the bound, and lands here). Both are red; neither
#      is ever downgraded to a warning.
#   2  unusable input — the bound is not a positive integer, the command's
#      executable is not found, or GNU `timeout` is missing. Never 0: an
#      unbounded run that looks green is the exact failure this script exists
#      to remove.
#
# Usage: scripts/check-bounded.sh <bound-s> <label> -- <command…>

set -uo pipefail

usage() {
  echo "usage: check-bounded.sh <bound-s> <label> -- <command…>" >&2
  exit 2
}

BOUND="${1:-}"
LABEL="${2:-}"
[ "${3:-}" = "--" ] || usage
shift 3
[ "$#" -ge 1 ] || usage

case "$BOUND" in
  ''|*[!0-9]*|0) echo "check-bounded.sh: bound must be a positive integer of seconds, got '$BOUND'" >&2; exit 2 ;;
esac
[ -n "$LABEL" ] || usage

# macOS ships no `timeout`; failing loud beats running unbounded.
if ! command -v timeout >/dev/null 2>&1; then
  echo "check-bounded.sh: GNU timeout not found — install coreutils" >&2
  exit 2
fi
if ! command -v "$1" >/dev/null 2>&1; then
  echo "check-bounded.sh: '$1' not found — cannot run $LABEL" >&2
  exit 2
fi

CAPTURE="$(mktemp)"
trap 'rm -f "$CAPTURE"' EXIT

# The last 40 captured lines, indented, for the caller to print as-is. The
# fallback layer: the TAP lines node printed before it stopped are the one free
# clue to WHICH test hung, and re-running by hand pays the bound again to learn
# what was already captured.
show_tail() { tail -n 40 "$CAPTURE" | sed 's/^/      /'; }

# The failing tests, extracted from that same capture. Exits non-zero — printing
# nothing — when the capture holds no `not ok` line, which is what makes the
# fallback below total. The bounds are constants, not arguments: nothing outside
# this file has a reason to vary them.
MAX_FAILURES=3
MAX_BLOCK_LINES=16

show_failures() {
  awk -v maxfail="$MAX_FAILURES" -v maxlines="$MAX_BLOCK_LINES" '
    function pad(n,   s) { s = ""; while (n-- > 0) s = s " "; return s }
    function emit(s) { printf "      %s\n", s }
    {
      match($0, /^[ \t]*/)
      ind = RLENGTH
      body = substr($0, ind + 1)
    }
    body ~ /^not ok [0-9]+( |$)/ {
      nfail++
      collecting = 0
      if (nfail <= maxfail) { emit($0); kept = 1; collecting = 1; base = ind }
      next
    }
    body ~ /^# (tests|pass|fail|cancelled|skipped|todo) / { totals[++ntot] = $0; next }
    collecting {
      # The YAML block belongs to the failure while it stays more indented than
      # the `not ok` line that opened it; the first line at or left of that
      # indentation is the next test.
      if (ind <= base) { collecting = 0; next }
      # Every block opens with these two and neither says anything about the
      # failure; the lines they would cost belong to the error instead. At the
      # block top level only: expected: and actual: dump the compared objects
      # one indent deeper, and a compared object carrying a type field would
      # otherwise have the very field under discussion silently removed.
      # (No apostrophes in here: this program is inside a single-quoted string.)
      if (ind == base + 2 && body ~ /^(duration_ms|type): /) next
      if (kept >= maxlines) {
        emit(pad(base + 2) "… diagnostic truncated at " maxlines " lines")
        collecting = 0
        next
      }
      emit($0)
      kept++
    }
    END {
      if (nfail == 0) exit 1
      if (nfail > maxfail)
        emit("… " (nfail - maxfail) " more failing test(s) in the captured output, not shown (" nfail " failed in all)")
      for (i = 1; i <= ntot; i++) emit(totals[i])
    }
  ' "$CAPTURE"
}

# The failure branch's diagnostic, and the one line the guard mutates to
# reproduce the pre-B-090 behavior. A hang never comes through here.
show_diagnostic() { show_failures || show_tail; }

SECONDS=0
timeout --kill-after=5 "$BOUND" "$@" >"$CAPTURE" 2>&1
rc=$?
elapsed=$SECONDS

if [ "$rc" -eq 0 ]; then
  echo "$LABEL passed within ${BOUND}s"
  exit 0
fi

if [ "$rc" -eq 124 ]; then
  echo "$LABEL timed out after ${BOUND}s — a hang, not a test failure; run the command directly outside the audit to tell a sandbox limit from a defect"
  show_tail
  exit 1
fi

# rc 137: the bound fired, the child ignored TERM, and --kill-after sent KILL —
# still a hang, never a test failure. But GNU timeout also exits 137 when the
# child is SIGKILLed by something else (OOM killer, a sandbox's process policy)
# long before the bound, so 137 reads as the hang only when the bound had time
# to fire; an early 137 falls through to the failure branch with its tail.
if [ "$rc" -eq 137 ] && [ "$elapsed" -ge "$BOUND" ]; then
  echo "$LABEL timed out after ${BOUND}s and ignored TERM — killed 5 s later; a hang, not a test failure; run the command directly outside the audit to tell a sandbox limit from a defect"
  show_tail
  exit 1
fi

echo "$LABEL failed (exit $rc)"
show_diagnostic
exit 1
