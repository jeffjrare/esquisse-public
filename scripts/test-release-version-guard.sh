#!/usr/bin/env bash
#
# test-release-version-guard.sh — fault injection for scripts/check-release-version.sh.
#
# The rule it guards: after plugin work lands on main, the version must move —
# and the two manifests that carry it must never disagree. A check verified by
# reading is not a check, so each case below MAKES the defect exist in a
# throwaway git repository and asserts the check names it.
#
# Every case asserts the SPECIFIC finding string, never merely a nonzero exit. A
# fixture can fail for reasons that have nothing to do with the fault injected,
# and a test that accepts any failure passes while the guard it names is gone.
# The exit-2 cases assert the opposite direction just as hard: "nothing to
# check" must never be reachable by the paths that are supposed to find a defect
# (audit-scripts: an empty input exits 2, never 0).
#
# NOTHING HERE TOUCHES THE REAL REPOSITORY. Every fixture is a `mktemp -d` git
# repository built from scratch and committed with env-supplied identity, so a
# bug in this file cannot create a commit in this checkout or reach ~/.claude.
#
# Usage: scripts/test-release-version-guard.sh [--quiet]
# Exit 0 = every case holds, 1 = the guard is missing, overreaching or silent.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2
REPO_ROOT="$PWD"
CHECK="$REPO_ROOT/scripts/check-release-version.sh"

QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true

fails=0
say()  { [[ "$QUIET" == true ]] || printf '%s\n' "$1"; }
pass() { [[ "$QUIET" == true ]] || printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; fails=$((fails + 1)); }

[[ -x "$CHECK" ]] || { printf 'FATAL: %s is missing or not executable\n' "$CHECK" >&2; exit 2; }

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

export GIT_AUTHOR_NAME="release guard fixture" GIT_AUTHOR_EMAIL="fixture@invalid"
export GIT_COMMITTER_NAME="release guard fixture" GIT_COMMITTER_EMAIL="fixture@invalid"

manifests() { # $1 dir, $2 plugin version, $3 marketplace version
  mkdir -p "$1/plugin/.claude-plugin" "$1/.claude-plugin"
  cat > "$1/plugin/.claude-plugin/plugin.json" <<EOF
{ "name": "esq", "version": "$2", "description": "fixture" }
EOF
  cat > "$1/.claude-plugin/marketplace.json" <<EOF
{ "name": "esquisse", "plugins": [ { "name": "esq", "version": "$3", "source": "./plugin" } ] }
EOF
}

# A repository whose single commit is the bump that released $2 — the shape a
# clean main is in immediately after scripts/release-local.sh.
fresh() { # $1 case name, $2 version
  local dir="$SCRATCH/$1"
  mkdir -p "$dir/plugin/skills"
  git -C "$dir" init -q -b main 2>/dev/null || { git init -q "$dir" >/dev/null 2>&1; git -C "$dir" symbolic-ref HEAD refs/heads/main; }
  manifests "$dir" "$2" "$2"
  printf 'shipped\n' > "$dir/plugin/skills/build.md"
  git -C "$dir" add -A >/dev/null
  git -C "$dir" commit -q -m "chore(plugin): release $2" >/dev/null
  printf '%s' "$dir"
}

run() { # $@ passed to the check; sets $out and $rc
  out=$("$CHECK" "$@" 2>&1)
  rc=$?
}

# --- Case 1: plugin/ moved past the bump on main -----------------------------
# A PENDING RELEASE IS A STATE, NOT A FINDING (2026-09-22). It is reported and it exits
# 0: every tree between a merge and a publication is in exactly this condition, and
# reddening the product gate on it reported a publication decision as a defect. What the
# release path needs from this case is the *report* — ./scripts/update.sh and
# ./scripts/release-local.sh both route on `releaseNeeded` — so that is what is asserted.
say $'\nCase 1: a plugin change committed after the last bump, on main'
dir=$(fresh drift 0.3.1)
printf 'a new line the release has not shipped\n' >> "$dir/plugin/skills/build.md"
git -C "$dir" commit -qam "feat(build): something worth releasing" >/dev/null
run "$dir"
if [[ $rc -eq 0 && "$out" == *"release pending"* && "$out" == *"update.sh"* ]]; then
  pass "a pending release is reported at exit 0 and names the command that publishes it"
else
  fail "the pending release was not reported as a state (exit $rc): $out"
fi
# The resolution named is the public handoff, not the primitive it calls: a
# finding is read by whoever is standing in front of the red gate, and
# ./scripts/update.sh is the one command there is to hand them.
if [[ "$out" == *"./scripts/update.sh"* && "$out" != *"release-local.sh --patch"* ]]; then
  pass "the finding names its own one-command resolution, ./scripts/update.sh"
else
  fail "the drift finding does not name ./scripts/update.sh, or still sends the reader to the release-local.sh primitive: $out"
fi

# --- Case 2: the two manifests disagree, and it is NOT scoped to main --------
say $'\nCase 2: the two manifests disagree on the version, on a feature branch'
dir=$(fresh disagree 0.3.1)
git -C "$dir" switch -qc esq/some-feature
manifests "$dir" "0.3.2" "0.3.1"
git -C "$dir" commit -qam "chore: bump one manifest only" >/dev/null
run "$dir"
if [[ $rc -eq 1 && "$out" == *"disagree on the version"* && "$out" == *"0.3.2"* && "$out" == *"0.3.1"* ]]; then
  pass "disagreement fires off main too, naming both versions"
else
  fail "manifest disagreement did not fire off main (exit $rc): $out"
fi

# --- Case 3: a clean main stays silent ---------------------------------------
say $'\nCase 3: main, versions agree, plugin/ unchanged since the bump'
dir=$(fresh clean 0.3.1)
run "$dir"
if [[ $rc -eq 0 && "$out" == *"release version clean"* ]]; then
  pass "a released tree exits 0 with a summary"
else
  fail "a clean tree did not exit 0 (exit $rc): $out"
fi
# A commit that touches nothing under plugin/ is not a release trigger.
printf 'a doc change\n' > "$dir/README.md"
git -C "$dir" add -A >/dev/null && git -C "$dir" commit -qm "docs: unrelated" >/dev/null
run "$dir"
if [[ $rc -eq 0 ]]; then
  pass "a commit outside plugin/ does not demand a release"
else
  fail "a non-plugin commit was read as drift (exit $rc): $out"
fi

# --- Case 4: off main, no verdict --------------------------------------------
say $'\nCase 4: the drift verdict is scoped to main'
dir=$(fresh scoped 0.3.1)
git -C "$dir" switch -qc esq/some-feature
printf 'unreleased work in progress\n' >> "$dir/plugin/skills/build.md"
git -C "$dir" commit -qam "feat(build): work in progress" >/dev/null
# A WITHHELD VERDICT EXITS 0 (2026-09-22). Off `main` the drift half gives no
# verdict, but the agreement half — the load-bearing claim — has already run and
# passed, so the script says so and exits 0. It matters because `scripts/audit.sh`
# now fails on every non-zero code: exit 2 has to mean input the check cannot
# read, or every feature branch would red the gate.
run "$dir"
if [[ $rc -eq 0 && "$out" == *"not judged here"* && "$out" == *"versions agree"* ]]; then
  pass "off main the drift verdict is withheld at exit 0, saying so and naming the agreement that did hold"
else
  fail "a feature branch did not report a withheld verdict at exit 0 (exit $rc): $out"
fi
if [[ "$out" != *"has moved past its last version bump"* ]]; then
  pass "and it emits no finding there — the pre-commit gate stays true on esq/<slug>"
else
  fail "the drift finding leaked onto a feature branch: $out"
fi

# --- Case 5: the JSON shape the release script reads -------------------------
say $'\nCase 5: --json carries the five fields scripts/release-local.sh reads'
dir=$(fresh json 0.3.1)
json=$("$CHECK" "$dir" --json 2>/dev/null)
verdict=$(printf '%s' "$json" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    let d; try { d = JSON.parse(s); } catch (e) { console.log("unparseable: " + e.message); return; }
    const want = ["sourceVersion","marketplaceVersion","lastBumpCommit","changedFiles","releaseNeeded"];
    const missing = want.filter(k => !(k in d));
    if (missing.length) return console.log("missing: " + missing.join(","));
    if (d.sourceVersion !== "0.3.1" || d.marketplaceVersion !== "0.3.1") return console.log("wrong versions");
    if (typeof d.lastBumpCommit !== "string" || !/^[0-9a-f]{7}$/.test(d.lastBumpCommit)) return console.log("lastBumpCommit is not a short hash");
    if (!Array.isArray(d.changedFiles) || d.changedFiles.length !== 0) return console.log("changedFiles is not an empty array");
    if (d.releaseNeeded !== false) return console.log("releaseNeeded is not false");
    console.log("ok");
  });
')
if [[ "$verdict" == "ok" ]]; then
  pass "clean --json parses and reports releaseNeeded false against the bump commit"
else
  fail "the clean --json document is wrong — $verdict: $json"
fi

printf 'drifting\n' >> "$dir/plugin/skills/build.md"
git -C "$dir" commit -qam "feat(build): drift" >/dev/null
json=$("$CHECK" "$dir" --json 2>/dev/null)
verdict=$(printf '%s' "$json" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    let d; try { d = JSON.parse(s); } catch (e) { console.log("unparseable: " + e.message); return; }
    if (d.releaseNeeded !== true) return console.log("releaseNeeded is not true on drift");
    if (!Array.isArray(d.changedFiles) || !d.changedFiles.includes("plugin/skills/build.md")) return console.log("changedFiles does not name the changed file");
    console.log("ok");
  });
')
if [[ "$verdict" == "ok" ]]; then
  pass "drifting --json names the changed files and reports releaseNeeded true"
else
  fail "the drifting --json document is wrong — $verdict: $json"
fi

# --- Case 6: an unusable input exits 2, never 0 ------------------------------
say $'\nCase 6: an input the script cannot read exits 2, and only that'
empty="$SCRATCH/empty"; mkdir -p "$empty"
run "$empty"
if [[ $rc -eq 2 && "$out" == *"missing"* ]]; then
  pass "a directory with no manifests exits 2, naming what is missing"
else
  fail "a manifest-less directory did not exit 2 (exit $rc): $out"
fi
# Same reasoning as the feature branch: a readable pair of manifests outside git
# is a verdict withheld, not an unusable input. What stays exit 2 below is a
# directory with no manifests at all, and one that does not exist.
nogit="$SCRATCH/nogit"; mkdir -p "$nogit"; manifests "$nogit" 0.3.1 0.3.1
run "$nogit"
if [[ $rc -eq 0 && "$out" == *"not a git repository"* && "$out" == *"versions agree"* ]]; then
  pass "a plugin checkout outside git reports the agreement it could check, at exit 0"
else
  fail "a non-git checkout did not report the agreement at exit 0 (exit $rc): $out"
fi
run "$SCRATCH/does-not-exist"
if [[ $rc -eq 2 ]]; then
  pass "a missing directory exits 2"
else
  fail "a missing directory did not exit 2 (exit $rc): $out"
fi

# The inverse direction, and the reason case 6 is not only about absence: a
# manifest that IS present and carries no readable version is a defect, not an
# empty input. Until the reader's exit 3 was branched on, this fell through to
# "nothing to check" — audit.sh printed a yellow skip and exited 0, so the
# unscoped agreement half went silent exactly when a manifest stopped carrying
# a version, which is the hand-edit failure B-130 names.
unversioned=$(fresh unversioned 0.3.1)
cat > "$unversioned/.claude-plugin/marketplace.json" <<'EOF'
{ "name": "esquisse", "plugins": [ { "name": "esq", "source": "./plugin" } ] }
EOF
git -C "$unversioned" commit -qam "chore: drop the marketplace version by hand" >/dev/null
run "$unversioned"
if [[ $rc -eq 1 && "$out" == *"no readable version"* ]]; then
  pass "a present manifest with no version exits 1 rather than skipping"
else
  fail "a versionless marketplace entry did not exit 1 (exit $rc): $out"
fi
if [[ "$out" == *"marketplace esq entry has no string version field"* ]]; then
  pass "and the finding names the field that is missing"
else
  fail "the finding does not name the missing field: $out"
fi

if [[ $fails -eq 0 ]]; then
  say $'\n\033[32mAll release-version guard cases hold.\033[0m'
  exit 0
fi
printf '\n\033[31m%d case(s) failed.\033[0m\n' "$fails"
exit 1
