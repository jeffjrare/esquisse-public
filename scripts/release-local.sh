#!/usr/bin/env bash
#
# release-local.sh — publish the verified checkout as this laptop's installed esq plugin.
#
# THE GAP THIS CLOSES. B-097: 662 commits moved plugin/ without moving the
# version, and until scripts/check-release-version.sh there was no signal when a
# maintainer forgot. That guard says "release it"; this script IS the release —
# the whole path between "the converge is clean" and "the version running in a
# fresh `claude` session is the one I just verified", which was four remembered
# commands in the right order and no proof at the end.
#
# WHY A REPOSITORY SCRIPT AND NOT A SKILL. A distributed /esq:release would be
# loaded from the *installed* plugin, so the command shipping a fix to the
# release path would itself be whatever version last shipped. The source
# checkout is the only copy immune to what it is about to replace. The work is
# also pure determinism — no judgment token is spent on it.
#
# THE ~/.claude BOUNDARY. CLAUDE.md forbids writing under ~/.claude directly.
# This script's ONLY mutation of that tree is the official
# `claude --bare plugin update esq@esquisse --scope user --yes` call. It never opens a
# path under it for writing — not to fix a manifest, not to place a file, not to
# clean a cache. Everything else it does there is read-only: installed_plugins.json
# for the version and gitCommitSha, and the install directory for the byte
# comparison. Nothing here pushes, tags, or reaches the network beyond that one
# official call.
#
# WHY --bare. The install is a non-interactive plugin-management subprocess and does
# not need the interactive Claude runtime. Measured 2026-09-10: the same call without
# the flag sat through its full 180 s bound before printing "Checking for updates" and
# left the plugin at the previous version with the release commit already made — the
# exact half-release the rule below is about — while
# `claude --bare --debug-file … plugin update esq@esquisse --scope user --yes`
# returned in 0.52 s and installed 0.3.4 byte-equal to plugin/. The proven boundary is
# Claude Code's normal bootstrap, not the plugin updater; which bootstrap subsystem
# hung is not established, and no log here claims one. The bound, the exit-code rules
# and the retry line are untouched — `--bare` is not a retry and not a longer timeout.
#
# WHY </dev/null. Bare mode alone was not enough. Measured 2026-09-10: the bare
# `plugin update` call below, run from an interactive terminal so the subprocess
# inherited that terminal on stdin, sat through its full 180 s bound with nothing
# printed; the identical command with `</dev/null` completed in 0.50 s and installed
# 0.3.5. What that establishes is a boundary and nothing more — normal stdin
# inheritance hangs, /dev/null completes — and which part of Claude Code waits on the
# descriptor is not established and is not claimed anywhere here. So the redirection
# rides the subprocess this script spawns, and rides the retry line it prints, rather
# than living in a maintainer's memory: the one command that replaces this laptop's
# installation must not depend on someone remembering to close stdin. It is not a
# retry, not a longer bound, and not a second install path; the bound, the exit-code
# classification and the commit-stands rule are untouched.
#
# ONCE THE COMMIT EXISTS, IT STANDS. Every failure after `git commit` reports
# what broke and prints the exact retry line. It never rewinds git and never
# reports success — a release that half-happened must be visible as a half, not
# erased into a puzzle. Before the commit the opposite rule holds: a refusal
# leaves the tree exactly as it was found, manifests included.
#
# WHY check-release-version.sh RUNS AFTER THE COMMIT, NOT BEFORE. Drift is what
# authorizes this release, so before the bump commit exists that check reports
# the drift it was called on and exits 1 — it can only be a proof once the commit
# it is measuring against has been made. What runs before the commit is the half
# that can be true there, and it is mechanical rather than judgemental: the tree
# was clean when this run started (the precondition below), both manifests still
# parse, both read the computed next patch, and the whole working tree holds
# exactly two modified paths whose only difference from their committed copies is
# that one version field. Anything else — a third path, a second changed line, a
# changed line that is not the version field — restores both manifests and
# refuses, before a commit exists.
#
# WHY THE PUBLISHER VALIDATES NOTHING. This script does not re-validate `plugin/`,
# and a successful release therefore invokes `claude` exactly once: the install.
# Plugin validation has an owner — `scripts/check-plugin.sh`, run as `audit.sh`
# check 26 by the audit /esq:land reuses or runs before the branch lands — and between
# that audit and this commit the only thing this script changes on a clean `main`
# is two version fields, which cannot stale a CLI, a hook, a skill or a manifest
# that was already validated. Re-running it here re-bought that proof at the
# price of two more nested `claude plugin validate --strict` processes inside the
# publisher, where they sat until their 60 s bounds while the identical commands
# returned instantly when run directly afterwards: the same defect
# D-update-publishes-converge-verifies removed one layer up, left behind one layer
# down (D-the-publisher-revalidates-nothing). What replaces it is not a weaker
# validation — it is the proof that nothing needing validation changed.
#
# installed_plugins.json IS UNDOCUMENTED HARNESS STATE. version, installPath and
# gitCommitSha are read from a file Claude Code owns and may reshape. A missing
# field is refused loudly and by name — an absent gitCommitSha is never treated
# as a match. Shape read on Claude Code 2.1.x, 2026-09-07.
#
# Usage: scripts/release-local.sh --patch|--check [update-bound-s]
#   --patch  bump the patch version, commit, install, and prove the install.
#   --check  report source version, installed version, commit and byte equality,
#            and whether a release is needed. Writes nothing, commits nothing,
#            and exits 0 whatever it reports — safe to run at any time, from any
#            branch. A report is not a gate: exit 2 out of the version guard
#            (every branch but main) is a fact to print, never a failure.
# Exit 0 = released and proven, or a --check report of any shape.
#        1 = --patch refused or failed (the message names which).
#
# NOTHING IN THIS SCRIPT IS SAFE TO RUN AGAINST A TREE YOU HAVE NOT AUDITED: it
# assumes ./scripts/audit.sh was green, and says so in its own output rather than
# re-buying fifty checks that already succeeded.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2
ROOT="$PWD"

CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
INSTALLED_MANIFEST="$CONFIG_DIR/plugins/installed_plugins.json"
KNOWN_MARKETPLACES="$CONFIG_DIR/plugins/known_marketplaces.json"
PLUGIN_MANIFEST="plugin/.claude-plugin/plugin.json"
MARKET_MANIFEST=".claude-plugin/marketplace.json"
PLUGIN_KEY="esq@esquisse"

MODE=""
BOUND=180
for arg in "$@"; do
  case "$arg" in
    --patch) MODE="patch" ;;
    --check) MODE="check" ;;
    -*) printf 'usage: release-local.sh --patch|--check [update-bound-s]\n' >&2; exit 2 ;;
    *)
      case "$arg" in
        ''|*[!0-9]*|0) printf 'release-local.sh: the update bound must be a positive integer of seconds, got %s\n' "$arg" >&2; exit 2 ;;
        *) BOUND="$arg" ;;
      esac
      ;;
  esac
done

if [ -z "$MODE" ]; then
  printf 'usage: release-local.sh --patch|--check [update-bound-s]\n' >&2
  exit 2
fi

say()    { printf '%s\n' "$1"; }
step()   { printf '  → %s\n' "$1"; }
good()   { printf '  ✓ %s\n' "$1"; }
bad()    { printf '  ✗ %s\n' "$1" >&2; }
refuse() { printf '\nrelease-local.sh refuses: %s\n' "$1" >&2; exit 1; }

# A local release can only reach Claude if its marketplace uses this checkout.
# Read Claude-owned state without changing it, before any version edit or commit.
check_marketplace() {
  node -e '
    const fs = require("fs");
    const [file, root] = process.argv.slice(1);
    try {
      const entry = JSON.parse(fs.readFileSync(file, "utf8")).esquisse;
      if (!entry) throw new Error("no registered esquisse marketplace");
      if (entry.source?.source !== "directory") {
        throw new Error("esquisse uses a " + (entry.source?.source || "missing") + " source, not this local checkout");
      }
      const source = entry.source.path;
      if (typeof source !== "string" || !source) throw new Error("esquisse has no readable source.path");
      console.log("registered source: " + source);
      if (fs.realpathSync(source) !== fs.realpathSync(root)) {
        throw new Error("esquisse points to another checkout; expected " + root);
      }
      if (typeof entry.installLocation !== "string" || fs.realpathSync(entry.installLocation) !== fs.realpathSync(root)) {
        throw new Error("esquisse installLocation does not resolve to " + root);
      }
    } catch (error) {
      console.error("marketplace source mismatch or unreadable: " + error.message);
      process.exitCode = 1;
    }
  ' "$KNOWN_MARKETPLACES" "$ROOT"
}

marketplace_repair_hint() {
  say "Register this checkout through Claude, then retry the installation:"
  printf '    claude --bare plugin marketplace add %q --scope user </dev/null\n' "$ROOT"
  say "    claude --bare plugin update $PLUGIN_KEY --scope user --yes </dev/null"
  say "    ./scripts/release-local.sh --check"
}

# Read both manifest versions through one node process. Refusing loudly on a
# shape it cannot read is the point — two unreadable versions must never be
# compared as empty strings and pass.
read_versions() {
  node -e '
    const fs = require("fs");
    const src = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const mkt = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
    const entry = (mkt.plugins || []).find(p => p && p.name === "esq");
    if (typeof src.version !== "string") { console.error("plugin.json has no string version field"); process.exit(3); }
    if (!entry || typeof entry.version !== "string") { console.error("marketplace.json has no esq entry with a string version"); process.exit(3); }
    process.stdout.write(src.version + " " + entry.version + "\n");
  ' "$PLUGIN_MANIFEST" "$MARKET_MANIFEST"
}

# Read the installed record, or say why it cannot be read. Used by both modes;
# a missing field is always named, never silently treated as a match.
read_installed() {
  node -e '
    const fs = require("fs");
    const [file, key] = process.argv.slice(1);
    let doc;
    try { doc = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error("installed_plugins.json could not be read: " + e.message); process.exit(3); }
    const rows = (doc.plugins || {})[key];
    if (!Array.isArray(rows) || rows.length === 0) { console.error("installed_plugins.json records no " + key + " installation"); process.exit(3); }
    const row = rows.find(r => r && r.scope === "user") || rows[0];
    for (const field of ["version", "installPath", "gitCommitSha"]) {
      if (typeof row[field] !== "string" || !row[field]) { console.error("the " + key + " record has no readable " + field + " — this shape was read on Claude Code 2.1.x, 2026-09-07"); process.exit(3); }
    }
    process.stdout.write([row.version, row.gitCommitSha, row.installPath].join(" ") + "\n");
  ' "$INSTALLED_MANIFEST" "$PLUGIN_KEY"
}

# ---------------------------------------------------------------------------
# --check — the report. It reads, it prints, it exits 0. Nothing below this
# point writes a file, stages a path or makes a commit, which is the whole
# reason the mode exists: the question "is what I am running the thing I
# verified" must be answerable without risking an answer that changes it.
# ---------------------------------------------------------------------------
if [ "$MODE" = "check" ]; then
  say "release-local.sh --check — reports only; nothing here writes, commits or installs."
  say ""

  if marketplace=$(check_marketplace 2>&1); then
    say "  marketplace:       $marketplace — this checkout"
  else
    say "  marketplace:       $marketplace"
    marketplace_repair_hint
  fi

  if versions=$(read_versions 2>&1); then
    set -- $versions
    say "  source version:    $1 (plugin.json), $2 (marketplace.json)"
    [ "$1" = "$2" ] || say "  ✗ the two manifests disagree — fix them by hand before releasing"
  else
    say "  source version:    unreadable — $versions"
  fi

  if git rev-parse --git-dir >/dev/null 2>&1; then
    head_sha=$(git rev-parse HEAD 2>/dev/null || printf 'none')
    head_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'none')
    say "  checkout:          ${head_sha:0:7} on $head_branch"
  else
    head_sha="none"
    say "  checkout:          not a git repository"
  fi

  if installed=$(read_installed 2>&1); then
    set -- $installed
    inst_version="$1"; inst_sha="$2"; inst_path="$3"
    say "  installed version: $inst_version"
    if [ "$inst_sha" = "$head_sha" ]; then
      say "  installed commit:  ${inst_sha:0:7} — equal to this checkout"
    else
      say "  installed commit:  ${inst_sha:0:7} — NOT this checkout (${head_sha:0:7})"
    fi
    if [ ! -d "$inst_path" ]; then
      say "  installed bytes:   the recorded installPath $inst_path is not a directory"
    elif diff -r "$ROOT/plugin" "$inst_path" >/dev/null 2>&1; then
      say "  installed bytes:   equal to plugin/"
    else
      say "  installed bytes:   DIFFER from plugin/ — run diff -r plugin $inst_path to read them"
    fi
  else
    say "  installed version: unreadable — $installed"
  fi

  # The version guard exits 2 on every branch but main, and that is its normal
  # state here. --check is a report, not a gate: exit 2 is printed as the fact
  # it is, and never read as a failure.
  check_json=$(scripts/check-release-version.sh . --json 2>/dev/null)
  need=$(printf '%s' "$check_json" | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      let d; try { d = JSON.parse(s); } catch (e) { return console.log("unknown"); }
      console.log(String(d.releaseNeeded) + " " + (d.lastBumpCommit || "none"));
    });
  ' 2>/dev/null)
  set -- $need
  case "${1:-unknown}" in
    true)  say "  release needed:    yes — plugin/ has moved since the ${2:-?} bump; run ./scripts/update.sh from a clean main" ;;
    false) say "  release needed:    no — plugin/ is unchanged since the ${2:-?} bump that released it" ;;
    *)     say "  release needed:    unknown — scripts/check-release-version.sh reached no verdict here" ;;
  esac

  say ""
  say "Reported nothing changed."
  exit 0
fi

# ---------------------------------------------------------------------------
# 1. Refuse anything that is not a primary, clean `main` checkout.
# ---------------------------------------------------------------------------
say "release-local.sh --patch — assumes ./scripts/audit.sh was green on this tree."
say ""
say "Preconditions"

git rev-parse --git-dir >/dev/null 2>&1 || refuse "this is not a git repository"

gitdir=$(cd "$(git rev-parse --git-dir)" && pwd -P)
commondir=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
if [ "$gitdir" != "$commondir" ]; then
  refuse "this is a linked worktree, not the primary checkout — a release is cut once, from the checkout that owns .git; run it from $commondir's working tree"
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$branch" != "main" ]; then
  refuse "on branch '$branch', not main — a release ships what has landed; merge the work first (esq merge land, or /esq:worktree merge) and run this from main"
fi

if [ -n "$(git status --porcelain)" ]; then
  refuse "the working tree is dirty — the release commit must contain exactly the two manifests and nothing else; commit or stash what is outstanding first"
fi
good "primary main checkout, clean tree"

# ---------------------------------------------------------------------------
# 2. Is there anything to release? One implementation of the version question,
#    shared with audit.sh check 51.
# ---------------------------------------------------------------------------
version_json=$(scripts/check-release-version.sh . --json 2>/dev/null)
facts=$(printf '%s' "$version_json" | node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    let d; try { d = JSON.parse(s); } catch (e) { console.error("the version guard emitted no readable JSON: " + e.message); process.exit(3); }
    process.stdout.write([d.sourceVersion, d.marketplaceVersion, String(d.releaseNeeded), d.lastBumpCommit || "none"].join(" ") + "\n");
  });
')
[ $? -eq 0 ] || refuse "scripts/check-release-version.sh did not answer the version question — nothing else here can be trusted"

set -- $facts
SRC_VERSION="$1"; MKT_VERSION="$2"; NEED="$3"; LAST_BUMP="$4"

if [ "$SRC_VERSION" != "$MKT_VERSION" ]; then
  refuse "the two manifests disagree before the bump — $PLUGIN_MANIFEST reads $SRC_VERSION, $MARKET_MANIFEST reads $MKT_VERSION; decide by hand which is right and commit them equal, then run this again"
fi

if [ "$NEED" != "true" ]; then
  if [ "$NEED" = "false" ]; then
    refuse "plugin/ has not changed since the $LAST_BUMP commit that released $SRC_VERSION — there is nothing to release"
  fi
  refuse "the version guard reached no verdict on whether a release is needed (releaseNeeded $NEED) — run scripts/check-release-version.sh . and fix what it names"
fi
good "plugin/ has moved since the $LAST_BUMP bump that released $SRC_VERSION"

if ! marketplace=$(check_marketplace 2>&1); then
  bad "$marketplace"
  marketplace_repair_hint
  refuse "Claude cannot install from this checkout — no version was changed and no release commit was made"
fi
good "$marketplace — this checkout"

# ---------------------------------------------------------------------------
# 3. Compute the next patch.
# ---------------------------------------------------------------------------
case "$SRC_VERSION" in
  *.*.*) ;;
  *) refuse "the current version '$SRC_VERSION' is not <major>.<minor>.<patch> — this script only bumps a patch, so fix the manifests by hand" ;;
esac
V_MAJOR="${SRC_VERSION%%.*}"
V_REST="${SRC_VERSION#*.}"
V_MINOR="${V_REST%%.*}"
V_PATCH="${V_REST#*.}"
for part in "$V_MAJOR" "$V_MINOR" "$V_PATCH"; do
  case "$part" in
    ''|*[!0-9]*) refuse "the current version '$SRC_VERSION' has a non-numeric component — this script only bumps a numeric patch" ;;
  esac
done
NEXT_VERSION="$V_MAJOR.$V_MINOR.$((V_PATCH + 1))"

say ""
say "Release $SRC_VERSION → $NEXT_VERSION"

# ---------------------------------------------------------------------------
# 4. Write both manifests. Textual replacement of the one version line, then a
#    re-parse proving the new value landed in the field that matters — a
#    whole-document rewrite would reformat files this repository hand-maintains.
# ---------------------------------------------------------------------------
restore_manifests() { git checkout -- "$PLUGIN_MANIFEST" "$MARKET_MANIFEST" 2>/dev/null; }

if ! node -e '
  const fs = require("fs");
  const [pluginPath, marketPath, from, to] = process.argv.slice(1);
  const bump = (file, check) => {
    const before = fs.readFileSync(file, "utf8");
    const pattern = new RegExp("\"version\"\\s*:\\s*\"" + from.replace(/\./g, "\\.") + "\"", "g");
    const hits = before.match(pattern);
    if (!hits || hits.length !== 1) {
      console.error(file + ": expected exactly one \"version\": \"" + from + "\" line, found " + (hits ? hits.length : 0));
      process.exit(3);
    }
    const after = before.replace(pattern, "\"version\": \"" + to + "\"");
    let parsed;
    try { parsed = JSON.parse(after); } catch (e) { console.error(file + ": the bump would not leave valid JSON — " + e.message); process.exit(3); }
    if (check(parsed) !== to) { console.error(file + ": the bumped line is not the version field this release reads"); process.exit(3); }
    fs.writeFileSync(file, after);
  };
  bump(pluginPath, d => d.version);
  bump(marketPath, d => ((d.plugins || []).find(p => p && p.name === "esq") || {}).version);
' "$PLUGIN_MANIFEST" "$MARKET_MANIFEST" "$SRC_VERSION" "$NEXT_VERSION"; then
  restore_manifests
  refuse "the manifests were not bumped — the tree is exactly as it was found"
fi

written=$(read_versions) || { restore_manifests; refuse "the bumped manifests could not be re-read — the tree is exactly as it was found"; }
set -- $written
if [ "$1" != "$NEXT_VERSION" ] || [ "$2" != "$NEXT_VERSION" ]; then
  restore_manifests
  refuse "the two manifests do not both read $NEXT_VERSION after the bump (plugin $1, marketplace $2) — the tree is exactly as it was found"
fi
good "both manifests read $NEXT_VERSION"

# ---------------------------------------------------------------------------
# 5. Prove the bump is the ONLY thing in this tree, mechanically. This is what
#    replaces re-validating plugin/: the landing gate validated these bytes, and
#    what has to be shown here is not that they are still valid but that they are
#    still the same bytes. Two assertions, both deterministic.
#
#    (a) The whole working tree — untracked files included, and enumerated one by
#        one rather than collapsed to a directory — holds exactly the two
#        manifests, modified. `--untracked-files=all` is spelled out rather than
#        left to the config the precondition read: `status.showUntrackedFiles`
#        can hide from a bare `git status --porcelain` exactly the stray path
#        this assertion exists to see.
#    (b) Each manifest differs from its committed copy on one line, and that line
#        differs only in its version field, moving SRC_VERSION → NEXT_VERSION.
#
#    Either one failing restores both manifests and refuses. No commit exists
#    yet, so a refusal here leaves the tree exactly as it was found.
# ---------------------------------------------------------------------------
step "the working tree holds the two version-field edits and nothing else"
tree_state=$(git status --porcelain --untracked-files=all 2>/dev/null | LC_ALL=C sort)
expected_state=" M .claude-plugin/marketplace.json
 M plugin/.claude-plugin/plugin.json"
if [ "$tree_state" != "$expected_state" ]; then
  restore_manifests
  unexpected=$(printf '%s' "$tree_state" | tr '\n' ';')
  refuse "after the bump the working tree reads [${unexpected:-empty}] rather than the two modified manifests alone — something other than this release changed the checkout; both manifests were restored and nothing was committed"
fi

if ! diff_proof=$(node -e '
  const fs = require("fs");
  const cp = require("child_process");
  const [from, to, ...files] = process.argv.slice(1);
  const field = /"version"\s*:\s*"([^"]*)"/;
  for (const file of files) {
    let head;
    try { head = cp.execFileSync("git", ["show", "HEAD:" + file], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }); }
    catch (e) { console.error(file + ": its committed copy could not be read — " + e.message); process.exit(3); }
    const now = fs.readFileSync(file, "utf8");
    const a = head.split("\n"), b = now.split("\n");
    if (a.length !== b.length) { console.error(file + ": the bump changed the line count, " + a.length + " → " + b.length); process.exit(3); }
    const moved = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) moved.push(i);
    if (moved.length !== 1) { console.error(file + ": " + moved.length + " line(s) differ from the committed copy, expected exactly 1"); process.exit(3); }
    const i = moved[0], was = a[i], is = b[i];
    const wasV = was.match(field), isV = is.match(field);
    if (!wasV || !isV) { console.error(file + ":" + (i + 1) + ": the one changed line is not a version field"); process.exit(3); }
    if (wasV[1] !== from || isV[1] !== to) { console.error(file + ":" + (i + 1) + ": the version field moves " + wasV[1] + " → " + isV[1] + ", not " + from + " → " + to); process.exit(3); }
    if (was.replace(field, "V") !== is.replace(field, "V")) { console.error(file + ":" + (i + 1) + ": the changed line differs outside its version field"); process.exit(3); }
  }
' "$SRC_VERSION" "$NEXT_VERSION" "$PLUGIN_MANIFEST" "$MARKET_MANIFEST" 2>&1); then
  restore_manifests
  refuse "$diff_proof — nothing was committed and the tree is exactly as it was found"
fi
good "the checkout was clean, both manifests parse and read $NEXT_VERSION, and the only change in the tree is that one version field in each"

# ---------------------------------------------------------------------------
# 6. The release commit. Exactly two paths, never `git add -A`.
# ---------------------------------------------------------------------------
if ! git add "$PLUGIN_MANIFEST" "$MARKET_MANIFEST"; then
  restore_manifests
  refuse "the two manifests could not be staged — nothing was committed"
fi
if ! git commit -q -m "chore(plugin): release $NEXT_VERSION"; then
  refuse "the release commit failed — the bumped manifests are staged and nothing was installed"
fi
RELEASE_SHA=$(git rev-parse HEAD)
good "committed chore(plugin): release $NEXT_VERSION (${RELEASE_SHA:0:7})"

# From here the commit stands. Nothing below rewinds git.

step "scripts/check-release-version.sh ."
if ! scripts/check-release-version.sh . >/dev/null 2>&1; then
  bad "the version guard still reports a finding after the release commit — run scripts/check-release-version.sh . and read it"
  bad "the release commit ${RELEASE_SHA:0:7} stands; nothing was installed"
  exit 1
fi
good "plugin/ is clean against its own release commit"

# ---------------------------------------------------------------------------
# 7. Install through the official path, under a hard bound.
# ---------------------------------------------------------------------------
say ""
say "Install"
RETRY_LINE="claude --bare plugin update $PLUGIN_KEY --scope user --yes </dev/null"
step "$RETRY_LINE"
timeout --kill-after=5 "$BOUND" claude --bare plugin update "$PLUGIN_KEY" --scope user --yes </dev/null
update_rc=$?
if [ "$update_rc" -ne 0 ]; then
  if [ "$update_rc" -eq 124 ]; then
    bad "the install timed out after ${BOUND}s"
  else
    bad "the install failed (exit $update_rc)"
  fi
  say ""
  say "The release commit ${RELEASE_SHA:0:7} stands — $NEXT_VERSION is committed and nothing was rewound."
  say "What is NOT done is the install. Retry it with:"
  say ""
  say "    $RETRY_LINE"
  say ""
  say "then prove it with ./scripts/release-local.sh --check."
  exit 1
fi
good "the official update call returned 0"

# ---------------------------------------------------------------------------
# 8. Prove it: version, commit and bytes. A missing field is a refusal, never a
#    match — installed_plugins.json is harness state this script does not own.
# ---------------------------------------------------------------------------
say ""
say "Proof"
record=$(read_installed)
if [ $? -ne 0 ]; then
  bad "the install cannot be proven — the release commit ${RELEASE_SHA:0:7} stands and the plugin may or may not be installed"
  bad "read $INSTALLED_MANIFEST yourself, then re-run: $RETRY_LINE"
  exit 1
fi

set -- $record
INST_VERSION="$1"; INST_SHA="$2"; INST_PATH="$3"
proof_failed=0

if [ "$INST_VERSION" = "$NEXT_VERSION" ]; then
  good "installed version $INST_VERSION"
else
  bad "installed version is $INST_VERSION, not the $NEXT_VERSION just released"
  proof_failed=1
fi

if [ "$INST_SHA" = "$RELEASE_SHA" ]; then
  good "installed gitCommitSha is the release commit ${RELEASE_SHA:0:7}"
else
  bad "installed gitCommitSha is ${INST_SHA:0:7}, not the release commit ${RELEASE_SHA:0:7}"
  proof_failed=1
fi

if [ ! -d "$INST_PATH" ]; then
  bad "the recorded installPath $INST_PATH is not a directory"
  proof_failed=1
elif diff_out=$(diff -rq "$ROOT/plugin" "$INST_PATH" 2>&1); then
  good "the installed tree is byte-equal to plugin/"
else
  bad "the installed tree differs from plugin/:"
  printf '%s\n' "$diff_out" | sed 's/^/      /' >&2
  printf '  → Full diff: diff -r %q %q\n' "$ROOT/plugin" "$INST_PATH" >&2
  proof_failed=1
fi

if [ "$proof_failed" -ne 0 ]; then
  say ""
  say "The release commit ${RELEASE_SHA:0:7} stands. The install did not land what was committed."
  say "Retry it with:"
  say ""
  say "    $RETRY_LINE"
  say ""
  exit 1
fi

say ""
say "Released $NEXT_VERSION — committed as ${RELEASE_SHA:0:7} and installed, with version, commit and bytes proven equal."
say "Restart every running Claude session: a session loaded the old plugin at startup and will keep running it until it is restarted."
exit 0
