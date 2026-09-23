#!/usr/bin/env bash
#
# audit.sh — the verification esq's own development runs.
#
# ONE DISPATCH. Every check goes through `run "<label>" <cmd…>`, which executes
# it, prints ✓ with its summary or ✗ with its whole output, and folds its exit
# code into the tally. **Only 0 passes.** 1 is findings; 2 is a check that could
# not run at all — a corpus it cannot read, a required tool missing — and is a
# failure here, not a skip, because a selected check that cannot answer has not
# answered; anything else (a crashed interpreter, timeout's 124, a signal's 137)
# is the same. The flags below already decide which checks are selected, so
# nothing reaching this function is optional. There is no second dispatch shape
# to keep in sync.
#
# WHAT EARNS A CHECK. Two kinds: a reference that must resolve, and a format the
# code parses. Everything about what a document *says* is docs/AUDIT.md's
# reading pass — a great many lexical guards lived here until 2026-09-22 and
# gave the false impression that pass had been mechanized.
#
# THREE PASSES, and the flags add rather than re-buy:
#   (default)   the product: structure, package, no-push, node product suites
#   --release   + packaging and release, for a change that touches either
#   --lab       + the research fixture suites, which are not the product
#
# The node product suites run HERE. Never run `node --test` beside this on the
# same tree.
#
# Exit 0 = clean, 1 = findings, 2 = the corpus is unusable.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2

WITH_RELEASE=false
WITH_LAB=false
for arg in "$@"; do
  case "$arg" in
    --release) WITH_RELEASE=true ;;
    --lab)     WITH_LAB=true ;;
    -h|--help)
      printf 'usage: audit.sh [--release] [--lab]\n'
      printf '  (default)  structure, package, no-push, node product suites\n'
      printf '  --release  also the packaging and release checks\n'
      printf '  --lab      also the research fixture suites\n'
      exit 0 ;;
    *) printf 'audit.sh: unknown argument %s\n' "$arg" >&2; exit 2 ;;
  esac
done

CMD_DIR="plugin/skills"
[ -d "$CMD_DIR" ] || { printf 'audit.sh: %s is missing — nothing to check\n' "$CMD_DIR" >&2; exit 2; }

red()  { printf '\033[31m%s\033[0m\n' "$1"; }
warn() { printf '\033[33m%s\033[0m\n' "$1"; }
ok()   { printf '\033[32m%s\033[0m\n' "$1"; }

findings=0
checks=0

# The one dispatch. $1 is the label; the rest is the command.
run() {
  local label="$1" out rc
  shift
  checks=$((checks + 1))
  printf '\n\033[1m%s\033[0m\n' "$label"
  out=$("$@" 2>&1)
  rc=$?
  case "$rc" in
    0)
      if [ -n "$out" ]; then
        while IFS= read -r line; do [ -n "$line" ] && ok "  ✓ $line"; done <<<"$out"
      else
        ok "  ✓ clean"
      fi
      ;;
    1)
      while IFS= read -r line; do [ -n "$line" ] && red "  ✗ $line"; done <<<"$out"
      # An exit 1 with nothing to say is still a failure, and must not read as a
      # pass that printed nothing.
      [ -z "$out" ] && red "  ✗ $label failed with no output"
      findings=$((findings + 1))
      ;;
    2)
      # Nothing to check is not a pass. This exit means the check's own inputs
      # were missing or unreadable — `check-structure.sh` on a corpus or README
      # it cannot read, `check-bounded.sh` with no `timeout` or no executable —
      # and every one of those is a prerequisite of this repository, not a
      # condition to tolerate.
      red "  ✗ $label could not run: ${out:-no reason given}"
      findings=$((findings + 1))
      ;;
    *)
      red "  ✗ $label exited $rc — that is not an answer"
      [ -n "$out" ] && printf '%s\n' "$out"
      findings=$((findings + 1))
      ;;
  esac
}

# Node suites, discovered by convention. A hand-kept list is how
# tests/cli/worktree-landing.test.mjs and tests/audit/skill-corpus.test.mjs went
# unrun for as long as they existed. One bound, one node process, one number:
# a check per suite would pay the runner's startup and this script's budget once
# per suite for tests that share a responsibility.
node_suites() {
  local label="$1"
  shift
  local globs=()
  local dir
  for dir in "$@"; do
    [ -d "$dir" ] || continue
    # Only a directory that actually holds a suite; an empty one would make
    # node exit non-zero on an unmatched glob and read as a failure.
    compgen -G "$dir/*.test.mjs" >/dev/null 2>&1 && globs+=("$dir/*.test.mjs")
  done
  if [ "${#globs[@]}" -eq 0 ]; then
    printf '%s: no suite found under %s\n' "$label" "$*" >&2
    return 2
  fi
  # Globs are passed through unexpanded so node resolves them itself — a bare
  # directory does not resolve on Node 22 here (B-054).
  scripts/check-bounded.sh 120 "$label" -- node --test --test-timeout=30000 "${globs[@]}"
}

# ─── The product pass ────────────────────────────────────────────────────────

run "Structure — every reference resolves" \
  scripts/check-structure.sh "$CMD_DIR" README.md

run "Package — the plugin and its skills validate" \
  scripts/check-plugin.sh plugin

run "No push — nothing in the shipped plugin runs or spells one" \
  scripts/check-nopush.sh plugin

run "Conformance — the formats the code parses are intact" \
  scripts/check-conformance.sh "$CMD_DIR"

run "Version — the two manifests agree" \
  scripts/check-release-version.sh .

run "Bounded runner — a hang is a named red line, not a silent pass" \
  scripts/test-bounded.sh --quiet

run "Product suites — CLI, hooks and corpus helper (bounded 120 s)" \
  node_suites "the product suites" tests/cli tests/hooks tests/audit

# ─── --release ───────────────────────────────────────────────────────────────

if [ "$WITH_RELEASE" = true ]; then
  run "Plugin guards — unsafe invocation is refused" \
    scripts/test-plugin-guards.sh --quiet

  run "Install — the marketplace package installs in an isolated config" \
    scripts/test-plugin-install.sh --quiet

  run "Release — the release command refuses, proves, and never rewinds its own commit" \
    scripts/test-release-local.sh --quiet

  run "Update router — it publishes, audits nothing, and refuses before it spends" \
    scripts/test-update-guard.sh --quiet

  # The consumer contract, not a check of a check: update.sh and release-local.sh both
  # read `releaseNeeded` and the version pair out of --json, so the shape that guard
  # asserts is the shape they parse.
  run "Version JSON — the shape the release path reads" \
    scripts/test-release-version-guard.sh --quiet
fi

# ─── --lab ───────────────────────────────────────────────────────────────────

if [ "$WITH_LAB" = true ]; then
  run "Research fixture suites (bounded 120 s)" \
    node_suites "the research suites" \
      tests/cost-budgets tests/probe tests/measure tests/capture-schema tests/smoke tests/journeys
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

printf '\n\033[1mSummary\033[0m\n'
passes="product"
[ "$WITH_RELEASE" = true ] && passes="$passes + release"
[ "$WITH_LAB" = true ] && passes="$passes + lab"
if [ "$findings" -eq 0 ]; then
  ok "  Clean — $checks checks ($passes)."
  exit 0
fi
red "  $findings of $checks checks failed ($passes)."
exit 1
