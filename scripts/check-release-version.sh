#!/usr/bin/env bash
#
# check-release-version.sh — has plugin/ moved past its last version bump, and
# do the two manifests agree on the version?
#
# This is audit.sh's check 51, extracted. It lives in its own file for two
# reasons. First, scripts/test-release-version-guard.sh injects the faults into
# throwaway git repositories and runs this check against them — inlined in
# audit.sh, each injected case would re-run fifty unrelated checks to observe
# one (question 1 of CLAUDE.md's cost pass). Second, scripts/release-local.sh
# consumes the same answer through --json, so the guard and the release command
# share one implementation of the version question rather than two copies of the
# same `git log` invocation drifting apart.
#
# THE RULE, and why one half is scoped to `main` and the other is not.
#
# B-097: 662 commits moved plugin/ without moving the version, and nothing in
# the repository read a version from anywhere. The signal that closes that gap
# is "work has landed on main and the version has not moved — release it".
#
#   * The DRIFT half is a REPORT, never a finding. `releaseNeeded` says whether
#     plugin/ has moved past its last bump; ./scripts/update.sh and
#     ./scripts/release-local.sh read it out of --json to decide whether to
#     publish, which is why this script owns the question at all. It exits 0
#     either way: a pending release is the ordinary state of every tree between
#     a merge and a publication, and reporting it as a defect made the product
#     gate red on a publication decision. It is still scoped to `main` for the
#     verdict wording — off main, or outside a git repository, the script exits
#     2 ("nothing to check") while --json still reports the facts.
#   * The AGREEMENT half is NOT scoped. Two manifests disagreeing on the version
#     is a defect on any branch, in or out of a git repository, and it is checked
#     first — before the branch is even looked at. A manifest that is present but
#     carries no readable version is the same defect one step earlier and is
#     reported the same way (exit 1), never as "nothing to check".
#
# Every line this script prints names the public handoff (`./scripts/update.sh`)
# and not the `release-local.sh --patch` primitive that command calls: whoever
# reads it needs exactly one command.
#
# ONE PASS. The bump commit is found with a single `git log -p` piped through one
# awk program — newest-first, first commit whose diff ADDS a "version" line to
# plugin/.claude-plugin/plugin.json. Written as a loop of `git show` per commit
# it would spawn a process per commit touching that file.
#
# Usage: scripts/check-release-version.sh [<repo-dir>] [--json]
#   --json  emit {sourceVersion, marketplaceVersion, lastBumpCommit,
#           changedFiles, releaseNeeded} on stdout and route findings to stderr,
#           so scripts/release-local.sh can read stdout as a document.
# Exit 0 = the manifests agree — whether or not a release is pending, and
#          whether or not the drift half could be judged here (summary on
#          stdout), 1 = findings: they disagree, or one carries no readable
#          version, 2 = the input is unusable: not a plugin checkout, or a
#          manifest that cannot be read at all (stderr).

set -uo pipefail

DIR=""
JSON=false
for arg in "$@"; do
  case "$arg" in
    --json) JSON=true ;;
    -*) echo "usage: check-release-version.sh [<repo-dir>] [--json]" >&2; exit 2 ;;
    *) DIR="$arg" ;;
  esac
done
[ -n "$DIR" ] || DIR="."

if [ ! -d "$DIR" ]; then
  echo "check-release-version.sh: '$DIR' is not a directory" >&2
  exit 2
fi

PLUGIN_MANIFEST="$DIR/plugin/.claude-plugin/plugin.json"
MARKET_MANIFEST="$DIR/.claude-plugin/marketplace.json"

for m in "$PLUGIN_MANIFEST" "$MARKET_MANIFEST"; do
  if [ ! -f "$m" ]; then
    echo "check-release-version.sh: $m is missing — not a plugin checkout, nothing to check" >&2
    exit 2
  fi
done

say_finding() {
  if [ "$JSON" = true ]; then printf '%s\n' "$1" >&2; else printf '%s\n' "$1"; fi
}

# One node process reads both documents. Refusing loudly on a shape it cannot
# read is the point: an absent version must never be compared as an empty
# string against another empty string and pass.
versions=$(node -e '
  const fs = require("fs");
  const src = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const mkt = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const entry = (mkt.plugins || []).find(p => p && p.name === "esq");
  if (typeof src.version !== "string") { console.error("plugin.json has no string version field"); process.exit(3); }
  if (!entry) { console.error("marketplace.json has no plugins entry named esq"); process.exit(3); }
  if (typeof entry.version !== "string") { console.error("the marketplace esq entry has no string version field"); process.exit(3); }
  process.stdout.write(src.version + "\t" + entry.version + "\n");
' "$PLUGIN_MANIFEST" "$MARKET_MANIFEST" 2>&1)
node_rc=$?
# Exit 3 is the reader's "present but unreadable" verdict: a manifest is there
# and carries no string version where one is required. That is a defect, not an
# absence of input — it is the hand-edit failure B-130 names, and reporting it
# as "nothing to check" would silence the agreement half exactly when a manifest
# stops carrying a version. So it is a finding on every branch, JSON or not,
# like the disagreement it belongs with. Every other non-zero is unusable input.
if [ "$node_rc" -eq 3 ]; then
  say_finding "a manifest carries no readable version — $versions; both plugin/.claude-plugin/plugin.json and the .claude-plugin/marketplace.json esq entry must declare a string \"version\" field (./scripts/update.sh writes both, through the release-local.sh primitive)"
  exit 1
fi
if [ "$node_rc" -ne 0 ]; then
  echo "check-release-version.sh: could not read a version from the manifests — $versions" >&2
  exit 2
fi

SRC_VERSION="${versions%%	*}"
MKT_VERSION="${versions##*	}"

emit_json() {
  # $1 lastBumpCommit (may be empty → null), $2 releaseNeeded (true|false|null),
  # remaining stdin lines on fd 3: changed files.
  local bump="$1" need="$2" files="$3" first=true
  printf '{\n  "sourceVersion": "%s",\n  "marketplaceVersion": "%s",\n' "$SRC_VERSION" "$MKT_VERSION"
  if [ -n "$bump" ]; then
    printf '  "lastBumpCommit": "%s",\n' "$bump"
  else
    printf '  "lastBumpCommit": null,\n'
  fi
  printf '  "changedFiles": ['
  if [ -n "$files" ]; then
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      if [ "$first" = true ]; then printf '\n'; first=false; else printf ',\n'; fi
      printf '    "%s"' "$f"
    done <<EOF
$files
EOF
    printf '\n  ],\n'
  else
    printf '],\n'
  fi
  printf '  "releaseNeeded": %s\n}\n' "$need"
}

# --- The agreement half: every branch, git repository or not. ---------------
if [ "$SRC_VERSION" != "$MKT_VERSION" ]; then
  [ "$JSON" = true ] && emit_json "" "null" ""
  say_finding "the two manifests disagree on the version — plugin/.claude-plugin/plugin.json reads $SRC_VERSION, .claude-plugin/marketplace.json reads $MKT_VERSION; they must be bumped together (./scripts/update.sh writes both, through the release-local.sh primitive)"
  exit 1
fi

# --- The drift half: reported everywhere, judged on main only. ---------------
#
# The facts (last bump, changed files, releaseNeeded) are computed wherever a
# git history can answer them, because scripts/release-local.sh --check must be
# able to report "a release is needed" from anywhere without being a gate. What
# is scoped to `main` is the VERDICT.
#
# A WITHHELD VERDICT IS NOT AN UNUSABLE INPUT, and these three exit 0 for that
# reason (changed 2026-09-22). Off `main`, outside a git repository, or with no
# bump commit in the history, the drift half gives no verdict — but the
# agreement half, which is the load-bearing claim, has already run and passed.
# Exit 2 is reserved for input this script genuinely cannot read: a directory
# that is not a plugin checkout, or a manifest it cannot parse. That matters
# because `scripts/audit.sh` now fails on any non-zero exit: a check that cannot
# run has not answered, and "I am on a feature branch" is an answer.
if ! git -C "$DIR" rev-parse --git-dir >/dev/null 2>&1; then
  [ "$JSON" = true ] && emit_json "" "null" ""
  [ "$JSON" = true ] || echo "versions agree at $SRC_VERSION — $DIR is not a git repository, so the drift half is not evaluated"
  exit 0
fi

branch=$(git -C "$DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)

# Newest-first; the first commit whose diff adds a "version" line to the plugin
# manifest is the last bump. `--format='commit %H'` replaces the whole header,
# so no commit message body can be mistaken for the marker line.
bump=$(git -C "$DIR" log --format='commit %H' -p -- plugin/.claude-plugin/plugin.json 2>/dev/null \
  | awk '/^commit [0-9a-f]+$/ { c = $2 } /^\+[^+]/ && /"version"/ { print c; exit }')

if [ -z "$bump" ]; then
  [ "$JSON" = true ] && emit_json "" "null" ""
  [ "$JSON" = true ] || echo "versions agree at $SRC_VERSION — no commit in this history writes a version into plugin/.claude-plugin/plugin.json, so there is no last bump to measure drift against"
  exit 0
fi

changed=$(git -C "$DIR" diff --name-only "$bump..HEAD" -- plugin/ 2>/dev/null)
count=$(printf '%s' "$changed" | grep -c . || true)

if [ "$count" -gt 0 ]; then
  need=true
else
  need=false
fi

if [ "$branch" != "main" ]; then
  [ "$JSON" = true ] && emit_json "${bump:0:7}" "$need" "$changed"
  [ "$JSON" = true ] || echo "versions agree at $SRC_VERSION — on branch '$branch', not main, so the drift half is not judged here (releaseNeeded $need)"
  exit 0
fi

# A PENDING RELEASE IS A STATE, NOT A REGRESSION. `releaseNeeded` is still
# computed and still reported — ./scripts/update.sh and ./scripts/release-local.sh
# both read it out of --json to decide whether to publish, and that is the whole
# reason this script owns the question. What changed on 2026-09-22 is that it no
# longer exits 1 for it: "plugin/ has moved since the last bump" is true of every
# tree between a merge and a release, and reddening the product gate on it made
# the audit report a publication decision as a defect. Only a manifest
# disagreement or an unreadable version is a finding here.
if [ "$need" = true ]; then
  [ "$JSON" = true ] && emit_json "${bump:0:7}" "true" "$changed"
  [ "$JSON" = true ] || echo "release pending — both manifests read $SRC_VERSION and $count file(s) changed since the ${bump:0:7} bump that released it; ./scripts/update.sh publishes them"
  exit 0
fi

if [ "$JSON" = true ]; then
  emit_json "${bump:0:7}" "false" ""
else
  echo "release version clean — both manifests read $SRC_VERSION and plugin/ is unchanged since the ${bump:0:7} bump that released it"
fi
exit 0
