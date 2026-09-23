#!/usr/bin/env bash
# Functional tests for update.sh in disposable git repositories.
# Version, report/release and audit commands are stubs; no installation is touched.
# The router must trust only a successful boolean version verdict, report honestly,
# propagate failures and refuse dirty/non-main trees before invoking a delegate.
# Usage: scripts/test-update-guard.sh [--quiet]

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2
REPO_ROOT="$PWD"
UPDATE="$REPO_ROOT/scripts/update.sh"

QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true

fails=0
pass() { [[ "$QUIET" == true ]] || printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; fails=$((fails + 1)); }

[[ -x "$UPDATE" ]] || { printf 'FATAL: %s is missing or not executable\n' "$UPDATE" >&2; exit 2; }
command -v git  >/dev/null 2>&1 || { printf 'FATAL: git is required\n' >&2; exit 2; }
command -v node >/dev/null 2>&1 || { printf 'FATAL: node is required\n' >&2; exit 2; }

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

export GIT_AUTHOR_NAME="update fixture" GIT_AUTHOR_EMAIL="fixture@invalid"
export GIT_COMMITTER_NAME="update fixture" GIT_COMMITTER_EMAIL="fixture@invalid"

DRIFT="plugin/ changed; release needed"

# --- fixture <name> ----------------------------------------------------------
# A clean `main` checkout carrying update.sh and the three stubs it may reach.
# The stubs' log lives in $SCRATCH, never in the fixture, so the tree it commits
# stays clean across a run — update.sh refuses a dirty tree, and a stub that
# dirtied the fixture would make every case refuse for the wrong reason.
#
# audit.sh is stubbed even though update.sh must never call it. That is the
# point: a stub that is never invoked is the only way to assert it was never
# invoked, and a missing stub would make a restored call fail for the wrong
# reason (command not found) instead of being reported as the defect it is.
fixture() {
  local dir="$SCRATCH/$1"
  mkdir -p "$dir/scripts"
  cp "$UPDATE" "$dir/scripts/update.sh"

  cat > "$dir/scripts/check-release-version.sh" <<'STUB'
#!/usr/bin/env bash
printf 'check-release-version %s\n' "$*" >> "$STUB_LOG.version"
# Findings to stderr under --json, exactly as the real script does.
if [ -n "${STUB_FINDINGS:-}" ]; then printf '%s\n' "$STUB_FINDINGS" >&2; fi
if [ "${STUB_NEED:-true}" = "unparseable" ]; then
  # A verdict the reader cannot parse: the router must stop, never release.
  printf 'not JSON\n'
  exit 0
fi
printf '{ "sourceVersion": "0.3.1", "marketplaceVersion": "0.3.1", "releaseNeeded": %s }\n' "${STUB_NEED:-true}"
exit "${STUB_VERSION_RC:-0}"
STUB

  cat > "$dir/scripts/audit.sh" <<'STUB'
#!/usr/bin/env bash
printf 'ran\n' >> "$STUB_LOG.audit"
printf 'Clean — 56 checks, no wiring defects found.\n'
exit 0
STUB

  cat > "$dir/scripts/release-local.sh" <<'STUB'
#!/usr/bin/env bash
printf 'release-local %s\n' "$*" >> "$STUB_LOG"
if [ "$1" = --check ]; then
  printf '%s\n' "${STUB_CHECK_OUTPUT:-Installed plugin absent or different from checkout.}"
  exit "${STUB_CHECK_RC:-0}"
fi
exit "${STUB_RELEASE_RC:-0}"
STUB

  chmod +x "$dir/scripts"/*.sh
  git -C "$dir" init -q -b main
  git -C "$dir" add -A
  git -C "$dir" commit -qm "fixture"
  printf '%s' "$dir"
}

# --- run <fixture-dir> -------------------------------------------------------
# Runs update.sh in the fixture with a fresh stub log; leaves the run's output
# in $OUT, its exit code in $RC, and what it actually spawned in $RELEASED,
# $CHECKED, $VERSIONED and $AUDITED.
run() {
  local dir="$1"
  STUB_LOG="$SCRATCH/log"
  rm -f "$STUB_LOG" "$STUB_LOG.audit" "$STUB_LOG.version"
  OUT=$(STUB_LOG="$STUB_LOG" "$dir/scripts/update.sh" 2>&1)
  RC=$?
  # A release is `release-local.sh --patch` specifically: the up-to-date path
  # calls the same script with --check, which reports and mutates nothing.
  RELEASED=false;  grep -qF -- "--patch" "$STUB_LOG" 2>/dev/null && RELEASED=true
  CHECKED=false;   grep -qF -- "--check" "$STUB_LOG" 2>/dev/null && CHECKED=true
  AUDITED=false;   [ -s "$STUB_LOG.audit" ] && AUDITED=true
  VERSIONED=false; [ -s "$STUB_LOG.version" ] && VERSIONED=true
}

# --- The cases ---------------------------------------------------------------

F=$(fixture route)

# 1. A release is needed. It releases — and spends no audit doing it.
export STUB_NEED=true STUB_FINDINGS="$DRIFT"
run "$F"
if [ "$RC" -eq 0 ] && [ "$RELEASED" = true ] && [ "$AUDITED" = false ] && grep -qF "Releasing" <<< "$OUT"; then
  pass "a needed release reaches release-local.sh --patch and runs no audit"
else
  fail "the release route is wrong (rc=$RC, released=$RELEASED, audited=$AUDITED) — update.sh must publish without auditing: $OUT"
fi

# 2. Nothing to release: exit 0 through --check, no release, still no audit.
export STUB_NEED=false STUB_FINDINGS=""
run "$F"
if [ "$RC" -eq 0 ] && [ "$RELEASED" = false ] && [ "$CHECKED" = true ] && [ "$AUDITED" = false ] \
   && grep -qF "No new release needed" <<< "$OUT" \
   && grep -qF "Installed plugin absent or different" <<< "$OUT" \
   && ! grep -qF "your installed esq is already" <<< "$OUT"; then
  pass "an already-released checkout exits 0 through --check, releasing nothing and auditing nothing"
else
  fail "the up-to-date path changed — it must exit 0, report through --check, release nothing and run no audit (rc=$RC, patched=$RELEASED, checked=$CHECKED, audited=$AUDITED): $OUT"
fi

# 3. A verdict the router cannot parse is not a licence to release. This is the
#    case a route keyed on "not false" would let through.
export STUB_NEED=unparseable
run "$F"
if [ "$RC" -eq 1 ] && [ "$RELEASED" = false ] && [ "$AUDITED" = false ] \
   && grep -qF "version" <<< "$OUT" && [ "$CHECKED" = false ]; then
  pass "an unreadable version verdict stops with exit 1 rather than releasing over it"
else
  fail "an unknown verdict did not stop the run (rc=$RC, released=$RELEASED): $OUT"
fi

# 4. The preconditions refuse BEFORE anything is spawned — asserted from the
#    stub log, because "refused" and "refused having spent nothing" differ.
export STUB_NEED=true STUB_FINDINGS=""
D=$(fixture dirty)
printf 'uncommitted\n' > "$D/dirty.txt"
run "$D"
if [ "$RC" -eq 1 ] && [ "$RELEASED" = false ] && [ "$VERSIONED" = false ] && [ "$AUDITED" = false ] \
   && grep -qF "uncommitted changes" <<< "$OUT"; then
  pass "a dirty tree refuses before the version script or a release is reached"
else
  fail "a dirty tree no longer refuses first (rc=$RC, released=$RELEASED, versioned=$VERSIONED): $OUT"
fi

B=$(fixture branch)
git -C "$B" switch -qc esq/some-feature
run "$B"
if [ "$RC" -eq 1 ] && [ "$RELEASED" = false ] && [ "$VERSIONED" = false ] && [ "$AUDITED" = false ] \
   && grep -qF "not main" <<< "$OUT"; then
  pass "a feature branch refuses before the version script or a release is reached"
else
  fail "a non-main branch no longer refuses first (rc=$RC, released=$RELEASED, versioned=$VERSIONED): $OUT"
fi

# A syntactically valid JSON value is not necessarily a boolean verdict.
for verdict in null '"false"' 0; do
  export STUB_NEED="$verdict"
  run "$F"
  if [ "$RC" -eq 1 ] && [ "$RELEASED" = false ] && [ "$CHECKED" = false ] && [ "$AUDITED" = false ]; then
    pass "non-boolean releaseNeeded=$verdict refuses without a release or report"
  else
    fail "non-boolean verdict was accepted (rc=$RC): $OUT"
  fi
done

# Valid stdout cannot overrule a failed producer (e.g. disagreeing manifests).
for verdict in true false; do
  export STUB_NEED="$verdict" STUB_VERSION_RC=1 STUB_FINDINGS="manifest versions disagree"
  run "$F"
  if [ "$RC" -eq 1 ] && [ "$RELEASED" = false ] && [ "$CHECKED" = false ] && [ "$AUDITED" = false ] \
     && grep -qF 'manifest versions disagree' <<< "$OUT"; then
    pass "version failure with releaseNeeded=$verdict refuses and preserves its diagnostic"
  else
    fail "version failure was hidden (rc=$RC): $OUT"
  fi
done
unset STUB_VERSION_RC STUB_FINDINGS

export STUB_NEED=false STUB_CHECK_RC=7
run "$F"
if [ "$RC" -eq 7 ] && [ "$RELEASED" = false ] && [ "$CHECKED" = true ] && [ "$AUDITED" = false ] \
   && ! grep -qF 'No new release needed' <<< "$OUT"; then
  pass "a failed installation report propagates its exit code without a success message"
else
  fail "report failure was hidden (rc=$RC): $OUT"
fi
unset STUB_CHECK_RC

export STUB_NEED=true STUB_RELEASE_RC=9
run "$F"
if [ "$RC" -eq 9 ] && [ "$RELEASED" = true ] && [ "$AUDITED" = false ]; then
  pass "a failed release propagates its exit code"
else
  fail "release failure was hidden (rc=$RC): $OUT"
fi
unset STUB_RELEASE_RC

[ "$fails" -eq 0 ] || printf '%s failure(s) — the update router is not trustworthy.\n' "$fails"
exit $(( fails > 0 ? 1 : 0 ))
