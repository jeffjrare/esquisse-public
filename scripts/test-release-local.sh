#!/usr/bin/env bash
#
# test-release-local.sh — fault injection and proof for scripts/release-local.sh.
#
# THE RULE IT GUARDS. A release must be refused unless it is cut from a primary,
# clean `main` checkout with something to release; the bump must be the only
# thing in the tree when the commit is made; once that commit exists it must
# stand whatever happens next; and the run may only report success after proving
# the installed version, commit and bytes are the ones just committed — having
# invoked `claude` exactly once to do it. Reading the script cannot establish any
# of that, so every case here MAKES the condition exist and asserts the specific
# sentence.
#
# NOTHING HERE TOUCHES THE REAL INSTALLATION OR THE REAL REPOSITORY. Three walls,
# and each is load-bearing:
#   * a stub `claude` first on PATH — nothing reaches the real CLI or the network;
#   * CLAUDE_CONFIG_DIR pointed at a mktemp -d — the script reads and the stub
#     writes an installed_plugins.json inside the scratch directory, never ~/.claude;
#   * a throwaway `git clone` per case — the release commits land in a clone that
#     is deleted on exit, never in this checkout.
# The clone is of HEAD, so each fixture then OVERLAYS the working tree's copy of
# the two scripts under test and commits the overlay. Without it this suite
# would silently prove the last commit rather than the edit in front of the
# contributor running it — a guard that passes on a broken working tree.
# The clone is what makes the success path real rather than mimed: the fixture
# carries a genuine git history, so the pre-commit proof reads real committed
# manifests and the byte comparison compares genuine bytes. Local clones
# hardlink their objects, so a fixture costs about 0.4 s.
#
# ONE CLAUDE CALL, IN BARE MODE. A successful release invokes `claude` exactly once
# — the install — and that call runs `claude --bare`: a non-interactive
# plugin-management subprocess needs no interactive runtime, and one without the flag
# was measured sitting through a full 180 s bound while the same call with it returned
# in 0.52 s. Both halves are asserted on the argv the stub recorded, and case 13
# injects the flag's removal. The flag was only half of it: the same bare call also
# has to close its own stdin, because one that inherited an interactive terminal sat
# through its full 180 s bound while `</dev/null` completed in 0.50 s. Case 14 proves
# that on the subprocess — a fifo held open as stdin, a stub that reads it — and
# injects the redirection's removal. The single call is what it is because the publisher no
# longer re-validates plugin/: that is the
# landing gate's job, and two nested `claude plugin validate --strict` processes
# inside the publisher were what sat until their 60 s bounds while the same
# commands returned instantly outside it (D-the-publisher-revalidates-nothing).
# The stub therefore logs EVERY invocation and keeps its `plugin validate` arm,
# which nothing may now reach: a stub that is never invoked is the only way to
# assert it was never invoked, and a deleted arm would make a restored call fail
# as "command not found" rather than be reported as the defect it is. What the
# validation is replaced by — the tree holding exactly the two version-field
# edits — is injected against in case 5.
#
# Every case asserts the SPECIFIC message, never merely a nonzero exit. A fixture
# can fail for reasons that have nothing to do with the condition injected, and a
# test that accepts any failure passes while the refusal it names is gone.
#
# Usage: scripts/test-release-local.sh [--quiet]
# Exit 0 = every case holds, 1 = a refusal, a proof, the one-claude-call rule or
#          the commit-stands rule is gone.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2
REPO_ROOT="$PWD"
RELEASE="$REPO_ROOT/scripts/release-local.sh"

QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true

fails=0
say()  { [[ "$QUIET" == true ]] || printf '%s\n' "$1"; }
pass() { [[ "$QUIET" == true ]] || printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; fails=$((fails + 1)); }

[[ -x "$RELEASE" ]] || { printf 'FATAL: %s is missing or not executable\n' "$RELEASE" >&2; exit 2; }
command -v git >/dev/null 2>&1 || { printf 'FATAL: git is required\n' >&2; exit 2; }

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

export GIT_AUTHOR_NAME="release fixture" GIT_AUTHOR_EMAIL="fixture@invalid"
export GIT_COMMITTER_NAME="release fixture" GIT_COMMITTER_EMAIL="fixture@invalid"

# --- The stub `claude`, first on PATH -----------------------------------------
# Every invocation is appended to $STUB_LOG, and the cases read that log: what a
# release invokes is now an assertion, not a side effect. `plugin validate`
# passes and must never be reached (see ONE CLAUDE CALL above). `plugin update`
# is the whole point, and its behavior is env-driven so one stub covers success,
# a failing install and an install that silently lands the wrong bytes.
BIN="$SCRATCH/bin"
mkdir -p "$BIN"
cat > "$BIN/claude" <<'STUB'
#!/usr/bin/env bash
# The log keeps the argv EXACTLY as the release spelled it, --bare included, because
# that flag is one of the things the cases assert. Dispatch drops it afterwards.
printf '%s\n' "$*" >> "${STUB_LOG:-/dev/null}"
# STUB_READ_STDIN makes the stub touch stdin before continuing, the way the real
# plugin-management subprocess was measured doing. With the release's `</dev/null`
# in place that read hits EOF at once; on an inherited stdin that never EOFs it
# blocks. Opt-in, so every case but 14 runs on whatever stdin the suite was given.
[ -n "${STUB_READ_STDIN:-}" ] && cat >/dev/null 2>&1
[ "${1:-}" = "--bare" ] && shift
case "${1:-} ${2:-}" in
  "plugin validate") exit 0 ;;
  "plugin update")
    [ "${STUB_UPDATE_RC:-0}" -eq 0 ] || exit "${STUB_UPDATE_RC}"
    ver=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).version)' "$STUB_REPO/plugin/.claude-plugin/plugin.json") || exit 1
    sha=$(git -C "$STUB_REPO" rev-parse HEAD) || exit 1
    dest="$CLAUDE_CONFIG_DIR/plugins/cache/esquisse/esq/$ver"
    rm -rf "$dest"; mkdir -p "$dest"
    cp -r "$STUB_REPO/plugin/." "$dest/" || exit 1
    # STUB_STALE mimes an install that returned 0 while landing something other
    # than the committed bytes — the case the byte comparison exists for.
    [ -n "${STUB_STALE:-}" ] && printf 'not what was committed\n' > "$dest/stale-marker.txt"
    node -e '
      const fs = require("fs"), path = require("path");
      const [file, key, version, sha, installPath] = process.argv.slice(1);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const now = new Date().toISOString();
      fs.writeFileSync(file, JSON.stringify({ version: 2, plugins: { [key]: [
        { scope: "user", installPath, version, installedAt: now, lastUpdated: now, gitCommitSha: sha }
      ] } }, null, 2) + "\n");
    ' "$CLAUDE_CONFIG_DIR/plugins/installed_plugins.json" "esq@esquisse" "$ver" "$sha" "$dest" || exit 1
    exit 0 ;;
esac
exit 0
STUB
chmod +x "$BIN/claude"
export PATH="$BIN:$PATH"
export STUB_LOG="$SCRATCH/claude-calls.log"

# A fixture is a throwaway clone of this checkout with `main` at its HEAD, plus
# its own empty CLAUDE_CONFIG_DIR. Nothing outside $SCRATCH is written.
fixture() { # $1 case name → sets $dir, and exports CLAUDE_CONFIG_DIR/STUB_REPO
  dir="$SCRATCH/$1"
  git clone -q "$REPO_ROOT" "$dir" >/dev/null 2>&1 || { fail "could not clone a fixture for $1"; return 1; }
  git -C "$dir" checkout -qB main >/dev/null 2>&1
  for script in release-local.sh check-release-version.sh; do
    cp "$REPO_ROOT/scripts/$script" "$dir/scripts/$script"
  done
  if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
    git -C "$dir" commit -qam "test: overlay the working tree's release scripts" >/dev/null
  fi
  export CLAUDE_CONFIG_DIR="$SCRATCH/$1-config"
  mkdir -p "$CLAUDE_CONFIG_DIR/plugins"
  node -e '
    const fs = require("fs");
    const [file, root] = process.argv.slice(1);
    fs.writeFileSync(file, JSON.stringify({ esquisse: {
      source: { source: "directory", path: root }, installLocation: root
    } }));
  ' "$CLAUDE_CONFIG_DIR/plugins/known_marketplaces.json" "$dir"
  export STUB_REPO="$dir"
  unset STUB_UPDATE_RC STUB_STALE
}

drift() { # $1 dir — make plugin/ move past its last bump, on a real file
  printf '\n// fixture drift, not shipped\n' >> "$1/plugin/lib/markdown.mjs"
  git -C "$1" commit -qam "feat(lib): fixture drift worth releasing" >/dev/null
}

run() { # $@ passed to the fixture's own release-local.sh; sets $out and $rc
  : > "$STUB_LOG"   # what THIS run invoked, never what an earlier case did
  out=$("$dir/scripts/release-local.sh" "$@" 2>&1)
  rc=$?
}

claude_calls() { # $1 subcommand words, e.g. "plugin validate" → how many times
  sed 's/^--bare //' "$STUB_LOG" 2>/dev/null | grep -c "^$1" || true
}

bare_violations() { # → logged invocations that did NOT run in bare mode
  grep -cv '^--bare ' "$STUB_LOG" 2>/dev/null || true
}

# --- Case 1: a feature branch ------------------------------------------------
say $'\nCase 1: a release is refused off main'
if fixture branch; then
  drift "$dir"
  git -C "$dir" switch -qc esq/some-feature
  run --patch
  if [[ $rc -eq 1 && "$out" == *"not main"* ]]; then
    pass "a feature branch is refused and names the branch it was on"
  else
    fail "a feature branch was not refused (exit $rc): $out"
  fi
  [[ -z "$(git -C "$dir" status --porcelain)" ]] && pass "the refusal wrote nothing" || fail "the refusal left the tree dirty"
fi

# --- Case 2: a dirty tree ----------------------------------------------------
say $'\nCase 2: a release is refused on a dirty tree'
if fixture dirty; then
  drift "$dir"
  printf 'uncommitted\n' >> "$dir/README.md"
  run --patch
  if [[ $rc -eq 1 && "$out" == *"working tree is dirty"* ]]; then
    pass "a dirty tree is refused — the release commit carries the two manifests and nothing else"
  else
    fail "a dirty tree was not refused (exit $rc): $out"
  fi
  if [[ "$(git -C "$dir" log -1 --format=%s)" != chore\(plugin\)* ]]; then
    pass "and no release commit was made"
  else
    fail "a release commit was made on a dirty tree"
  fi
fi

# --- Case 3: a linked worktree ----------------------------------------------
say $'\nCase 3: a release is refused from a linked worktree'
if fixture worktree; then
  drift "$dir"
  wt="$SCRATCH/worktree-linked"
  git -C "$dir" worktree add -q -b esq/linked "$wt" >/dev/null 2>&1
  out=$("$wt/scripts/release-local.sh" --patch 2>&1); rc=$?
  if [[ $rc -eq 1 && "$out" == *"linked worktree"* ]]; then
    pass "a linked worktree is refused before the branch is even looked at"
  else
    fail "a linked worktree was not refused (exit $rc): $out"
  fi
fi

# --- Case 4: nothing to release ---------------------------------------------
say $'\nCase 4: a release is refused when plugin/ has not moved'
if fixture nothing; then
  node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const j=JSON.parse(fs.readFileSync(f,"utf8"));if(j.version)j.version="9.9.9";if(j.plugins)j.plugins.forEach(p=>{if(p&&p.name==="esq")p.version="9.9.9"});fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n")}' "$dir/plugin/.claude-plugin/plugin.json" "$dir/.claude-plugin/marketplace.json"
  git -C "$dir" commit -qam "chore(plugin): release 9.9.9" >/dev/null
  run --patch
  if [[ $rc -eq 1 && "$out" == *"nothing to release"* ]]; then
    pass "an unchanged plugin/ is refused, naming the bump it is unchanged since"
  else
    fail "an unchanged plugin/ was not refused (exit $rc): $out"
  fi
  if [[ ! -e "$CLAUDE_CONFIG_DIR/plugins/installed_plugins.json" && ! -e "$CLAUDE_CONFIG_DIR/plugins/cache" ]]; then
    pass "and nothing was installed"
  else
    fail "the refused run installed something"
  fi
fi

# --- Case 5: the bump is the only thing in the tree, or nothing is committed --
# The pre-commit proof that replaced re-validating plugin/, injected against in
# both its halves: WHICH paths changed, and HOW the two manifests changed.
#
#   (a) A stray path. Injected through git's own config rather than a stub,
#       because it is a state a real checkout can be in:
#       `status.showUntrackedFiles=no` hides the path from the bare
#       `git status --porcelain` the precondition reads, so the run gets past the
#       clean-tree precondition and has to be stopped by the proof's explicit
#       `--untracked-files=all`. A fixture that could not get past the
#       precondition would prove the precondition, not the proof.
#   (b) A manifest that moved on more than its version line. No outside state can
#       produce this — (a) would catch anything that changed a third path — so it
#       is injected where it could really come from: a bump that writes more than
#       it should. The fixture's own release-local.sh gains one line flipping an
#       unrelated field straight after the bump, which is what a future --minor
#       rewriting the whole document, or a regex matching one line too many,
#       would look like from here.
say $'\nCase 5: the bump is the only thing in the tree, or nothing is committed'
if fixture straypath; then
  drift "$dir"
  base=$(git -C "$dir" rev-parse HEAD)
  git -C "$dir" config status.showUntrackedFiles no
  printf 'not part of this release\n' > "$dir/stray.txt"
  run --patch
  if [[ $rc -eq 1 && "$out" == *"rather than the two modified manifests alone"* && "$out" == *"stray.txt"* ]]; then
    pass "a path the release did not write is refused, and the refusal names it"
  else
    fail "an unexpected working-tree change was not refused (exit $rc): $out"
  fi
  if [[ "$(git -C "$dir" rev-parse HEAD)" == "$base" ]]; then
    pass "and it refused before the commit — HEAD is still the drift commit"
  else
    fail "the release committed over an unexpected tree: $(git -C "$dir" log -1 --format=%s)"
  fi
  if [[ -z "$(git -C "$dir" diff --name-only)" ]]; then
    pass "both manifests were restored — the tree is exactly as it was found"
  else
    fail "the refusal left the bumped manifests behind: $(git -C "$dir" diff --name-only | tr '\n' ' ')"
  fi
  if [[ "$(claude_calls 'plugin update')" -eq 0 ]]; then
    pass "and nothing was installed"
  else
    fail "a refused release still invoked claude plugin update"
  fi
fi

if fixture widebump; then
  drift "$dir"
  # One line, straight after the bump: a second field moves with the version.
  printf '%s\n' 'sed -i "s/\"category\": \"productivity\"/\"category\": \"utilities\"/" "$MARKET_MANIFEST"' > "$SCRATCH/wide-bump.inject"
  sed -i '/^good "both manifests read \$NEXT_VERSION"$/r '"$SCRATCH/wide-bump.inject" "$dir/scripts/release-local.sh"
  git -C "$dir" commit -qam "test: inject a bump that writes more than the version" >/dev/null
  base=$(git -C "$dir" rev-parse HEAD)
  run --patch
  if [[ $rc -eq 1 && "$out" == *"line(s) differ from the committed copy, expected exactly 1"* ]]; then
    pass "a manifest that moved on more than its version line is refused, and the refusal counts the lines"
  else
    fail "a bump writing more than the version field was not refused (exit $rc): $out"
  fi
  if [[ "$(git -C "$dir" rev-parse HEAD)" == "$base" && -z "$(git -C "$dir" status --porcelain)" ]]; then
    pass "and nothing was committed — both manifests restored, the tree exactly as it was found"
  else
    fail "the wide bump was committed or left behind: $(git -C "$dir" log -1 --format=%s) / $(git -C "$dir" status --porcelain | tr '\n' ' ')"
  fi
fi

# --- Case 6: the success path, proven ---------------------------------------
say $'\nCase 6: the release happens once, and is proven'
if fixture release; then
  before=$(git -C "$dir" rev-parse HEAD)
  from=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).version)' "$dir/plugin/.claude-plugin/plugin.json")
  drift "$dir"
  run --patch
  next="${from%.*}.$(( ${from##*.} + 1 ))"
  if [[ $rc -eq 0 ]]; then
    pass "the release exits 0"
  else
    fail "the release did not exit 0 (exit $rc): $out"
  fi
  bumped=$(node -e '
    const fs = require("fs");
    const src = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const mkt = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
    const e = (mkt.plugins || []).find(p => p && p.name === "esq") || {};
    console.log(src.version + " " + e.version);
  ' "$dir/plugin/.claude-plugin/plugin.json" "$dir/.claude-plugin/marketplace.json")
  if [[ "$bumped" == "$next $next" ]]; then
    pass "both manifests were bumped together to $next"
  else
    fail "the two manifests do not both read $next: $bumped"
  fi
  commits=$(git -C "$dir" rev-list --count "$before..HEAD")
  if [[ "$commits" == "2" ]]; then
    pass "exactly one commit was added on top of the fixture's own drift commit"
  else
    fail "expected 2 commits since the fixture base (drift + release), found $commits"
  fi
  if [[ "$(git -C "$dir" log -1 --format=%s)" == "chore(plugin): release $next" ]]; then
    pass "its subject is chore(plugin): release $next"
  else
    fail "the release commit subject is wrong: $(git -C "$dir" log -1 --format=%s)"
  fi
  touched=$(git -C "$dir" show --name-only --format= HEAD | sort | tr '\n' ' ')
  if [[ "$touched" == ".claude-plugin/marketplace.json plugin/.claude-plugin/plugin.json " ]]; then
    pass "and it stages exactly the two manifests, never git add -A"
  else
    fail "the release commit touches more than the two manifests: $touched"
  fi
  installed=$(node -e '
    const fs = require("fs");
    const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const r = (d.plugins["esq@esquisse"] || [])[0] || {};
    console.log(r.version + " " + r.gitCommitSha);
  ' "$CLAUDE_CONFIG_DIR/plugins/installed_plugins.json" 2>/dev/null)
  if [[ "$installed" == "$next $(git -C "$dir" rev-parse HEAD)" ]]; then
    pass "the installed record carries the released version and the release commit"
  else
    fail "the installed record is wrong: $installed"
  fi
  if [[ "$out" == *"Restart every running Claude session"* ]]; then
    pass "and the run ends by telling the maintainer to restart running sessions"
  else
    fail "the success output never names the restart: $out"
  fi
  # ONE CLAUDE CALL. Validating plugin/ is the landing gate's job; the publisher
  # spending two nested `claude plugin validate --strict` processes on it is what
  # sat until their bounds. Asserted from the stub log, in both directions —
  # never validate, and update exactly once, never twice.
  if [[ "$(claude_calls 'plugin validate')" -eq 0 ]]; then
    pass "the release invokes no claude plugin validate — the landing gate owns that"
  else
    fail "the release invoked claude plugin validate $(claude_calls 'plugin validate') time(s) — the publisher must not re-validate plugin/"
  fi
  if [[ "$(claude_calls 'plugin update')" -eq 1 ]]; then
    pass "it invokes claude plugin update exactly once"
  else
    fail "the release invoked claude plugin update $(claude_calls 'plugin update') time(s), expected exactly 1"
  fi
  total=$(wc -l < "$STUB_LOG")
  if [[ "$total" -eq 1 ]]; then
    pass "and that install is the only claude invocation the whole release makes"
  else
    invoked=$(tr '\n' ';' < "$STUB_LOG")
    fail "the release invoked claude $total time(s): $invoked"
  fi
  # BARE MODE. Asserted on the real argv the stub recorded, not on the source text:
  # a plugin-management subprocess needs no interactive runtime, and the bootstrap it
  # would otherwise pay for is what was measured hanging. Case 13 injects its removal.
  if [[ "$total" -ge 1 && "$(bare_violations)" -eq 0 ]]; then
    pass "and the install runs claude --bare — no interactive runtime is bootstrapped"
  else
    invoked=$(tr '\n' ';' < "$STUB_LOG")
    fail "the release invoked claude without --bare: $invoked"
  fi
  RELEASE_FIXTURE="$dir"
  RELEASE_CONFIG="$CLAUDE_CONFIG_DIR"
  RELEASE_NEXT="$next"
fi

# --- Case 7: the install fails after the commit ------------------------------
say $'\nCase 7: a post-commit install failure keeps the commit and prints the retry'
if fixture installfail; then
  drift "$dir"
  export STUB_UPDATE_RC=1
  run --patch
  unset STUB_UPDATE_RC
  if [[ $rc -eq 1 ]]; then
    pass "the run reports failure rather than success"
  else
    fail "a failed install did not fail the run (exit $rc): $out"
  fi
  if [[ "$(git -C "$dir" log -1 --format=%s)" == chore\(plugin\):\ release\ * ]]; then
    pass "the release commit stands — nothing was rewound"
  else
    fail "the release commit did not stand: $(git -C "$dir" log -1 --format=%s)"
  fi
  if [[ "$out" == *"claude --bare plugin update esq@esquisse --scope user --yes"* && "$out" == *"stands"* ]]; then
    pass "and the output says the commit stands and prints the exact retry command"
  else
    fail "the failure output is missing the retry line or the commit-stands sentence: $out"
  fi
fi

# --- Case 8: the install returns 0 but lands the wrong bytes -----------------
say $'\nCase 8: an install that lands something other than what was committed'
if fixture stale; then
  drift "$dir"
  export STUB_STALE=1
  run --patch
  unset STUB_STALE
  if [[ $rc -eq 1 && "$out" == *"differs from plugin/"* ]]; then
    pass "the byte comparison catches an install that returned 0 with the wrong tree"
  else
    fail "a successful-looking install of the wrong bytes was reported as released (exit $rc): $out"
  fi
  if [[ "$out" != *"Restart every running Claude session"* ]]; then
    pass "and it never prints the success line"
  else
    fail "an unproven install printed the success line"
  fi
fi

# --- Case 9: --check reports and changes nothing -----------------------------
say $'\nCase 9: --check reports without mutating'
if [[ -n "${RELEASE_FIXTURE:-}" ]]; then
  dir="$RELEASE_FIXTURE"
  export CLAUDE_CONFIG_DIR="$RELEASE_CONFIG" STUB_REPO="$dir"
  head_before=$(git -C "$dir" rev-parse HEAD)
  run --check
  if [[ $rc -eq 0 ]]; then
    pass "--check exits 0"
  else
    fail "--check did not exit 0 (exit $rc): $out"
  fi
  if [[ "$(git -C "$dir" rev-parse HEAD)" == "$head_before" && -z "$(git -C "$dir" status --porcelain)" ]]; then
    pass "it makes no commit and leaves the tree clean"
  else
    fail "--check mutated the repository"
  fi
  if [[ "$out" == *"installed version: $RELEASE_NEXT"* && "$out" == *"equal to this checkout"* && "$out" == *"equal to plugin/"* ]]; then
    pass "and on a released checkout it reports version, commit and bytes all equal"
  else
    fail "--check does not report a released checkout as equal: $out"
  fi
  if [[ "$out" == *"release needed:    no"* ]]; then
    pass "and reports no release needed"
  else
    fail "--check does not report the released tree as needing nothing: $out"
  fi
else
  fail "case 9 could not run — case 6 produced no released fixture"
fi

# --- Case 10: --check is answerable off main, where the guard has no verdict --
say $'\nCase 10: --check is a report, not a gate'
if fixture checkoffmain; then
  drift "$dir"
  git -C "$dir" switch -qc esq/some-feature
  run --check
  if [[ $rc -eq 0 && "$out" == *"release needed:"* ]]; then
    pass "off main it still exits 0 and answers — the guard's exit 2 is not read as failure"
  else
    fail "--check off main did not report cleanly (exit $rc): $out"
  fi
  if [[ "$out" != *"refuses"* ]]; then
    pass "and it refuses nothing"
  else
    fail "--check emitted a refusal: $out"
  fi
fi

# --- Case 11: an unusable invocation exits 2, never 0 ------------------------
say $'\nCase 11: no mode is nothing to do, never a release'
out=$("$RELEASE" 2>&1); rc=$?
if [[ $rc -eq 2 && "$out" == *"usage:"* ]]; then
  pass "no mode prints the usage and exits 2"
else
  fail "a mode-less invocation did not exit 2 (exit $rc): $out"
fi
out=$("$RELEASE" --nonsense 2>&1); rc=$?
if [[ $rc -eq 2 ]]; then
  pass "an unknown flag exits 2 rather than guessing a mode"
else
  fail "an unknown flag did not exit 2 (exit $rc): $out"
fi

# --- Case 12: the same rule stated statically -------------------------------
# The dynamic cases above prove it on the routes they exercise. This one names
# the right thing on a route they do not have — a validation restored under a
# condition no fixture happens to reach. Comment lines are dropped and every
# double-quoted string with them, so the script's own header prose explaining
# why it does not validate is the opposite of an invocation.
say $'\nCase 12: no executable line in release-local.sh validates the plugin'
body=$(grep -v '^[[:space:]]*#' "$RELEASE" | sed 's/"[^"]*"//g')
plugin_checks=$(grep -c 'check-plugin\.sh' <<< "$body")
if [[ "$plugin_checks" -eq 0 ]]; then
  pass "it never calls scripts/check-plugin.sh"
else
  fail "release-local.sh calls scripts/check-plugin.sh on $plugin_checks line(s) — the publisher must not re-validate what the landing gate validated, and the call costs two nested claude validator processes per release"
fi
validators=$(grep -c 'plugin validate' <<< "$body")
if [[ "$validators" -eq 0 ]]; then
  pass "and never runs claude plugin validate itself"
else
  fail "release-local.sh runs claude plugin validate on $validators line(s) — a successful release invokes claude exactly once"
fi

# --- Case 13: fault injection — the install without --bare ------------------
# Proof that case 6's bare-mode assertion is load-bearing rather than decorative:
# strip the flag from the fixture's own copy of the release script and the same
# assertion must go red. The stub still installs, so this case is the guard being
# watched, never a claim about what the real updater does.
say $'\nCase 13: removing --bare from the install makes the bare-mode assertion red'
if fixture debared; then
  drift "$dir"
  sed -i 's/claude --bare plugin update/claude plugin update/g' "$dir/scripts/release-local.sh"
  git -C "$dir" commit -qam "test: strip --bare from the install call" >/dev/null
  run --patch
  if [[ "$(bare_violations)" -ge 1 ]]; then
    pass "a de-bared install is caught — the assertion fires on the argv, not on the source"
  else
    invoked=$(tr '\n' ';' < "$STUB_LOG")
    fail "an install without --bare passed the bare-mode assertion (exit $rc): $invoked"
  fi
  if [[ "$out" != *"claude --bare plugin update esq@esquisse --scope user --yes"* ]]; then
    pass "and the retry line it would print loses the flag with it"
  else
    fail "the de-bared script still printed a --bare retry line: $out"
  fi
fi

# --- Case 14: the install closes its own stdin ------------------------------
# `--bare` alone was not enough. Measured 2026-09-10: the bare `plugin update` call,
# run so the subprocess inherited an interactive terminal on stdin, sat through its
# full 180 s bound with nothing printed, while the identical command with `</dev/null`
# completed in 0.50 s. The boundary is what is proven — normal stdin inheritance
# hangs, /dev/null completes — and nothing here claims which subsystem waits.
#
# The fixture supplies what the suite cannot assume it has: a stdin that stays OPEN
# and never delivers anything. A fifo held open for writing on fd 9 is exactly that,
# with or without a TTY. STUB_READ_STDIN makes the stub read stdin before installing,
# so a child handed /dev/null proceeds and one that inherited the fifo blocks.
#
# Both runs are bounded and write to a FILE, never a pipe: when the bound fires it
# kills the release and leaves the blocked `cat` orphaned, and a capture pipe would
# leave the fixture waiting on that orphan instead of reporting the hang.
say $'\nCase 14: the install closes its own stdin'
if fixture heldstdin; then
  HOLD="$SCRATCH/held-stdin"
  mkfifo "$HOLD"
  exec 9<>"$HOLD"   # read-write so opening never blocks; the write end keeps it open
  held_release() { # $1 outer bound → sets $rc, $out; nothing here goes through a pipe
    : > "$STUB_LOG"
    STUB_READ_STDIN=1 timeout --kill-after=2 "$1" "$dir/scripts/release-local.sh" --patch \
      < "$HOLD" > "$SCRATCH/held-release.out" 2>&1
    rc=$?
    out=$(cat "$SCRATCH/held-release.out")
  }

  drift "$dir"
  held_release 60
  if [[ $rc -eq 0 && "$out" == *"Restart every running Claude session"* ]]; then
    pass "the release completes on a stdin that never EOFs — its install child reads /dev/null"
  else
    fail "the release did not complete on a never-EOF stdin (exit $rc): $out"
  fi
  if [[ "$(claude_calls 'plugin update')" -eq 1 ]]; then
    pass "and it still made exactly one install call"
  else
    fail "the held-stdin release invoked claude plugin update $(claude_calls 'plugin update') time(s)"
  fi

  drift "$dir"
  sed -i 's| </dev/null||g' "$dir/scripts/release-local.sh"
  if git -C "$dir" diff --quiet -- scripts/release-local.sh; then
    fail "the stdin fault injection changed nothing — release-local.sh closes no child's stdin"
  fi
  git -C "$dir" commit -qam "test: strip the /dev/null redirection from the install call" >/dev/null
  held_release 3
  if [[ $rc -eq 124 ]]; then
    pass "an install without </dev/null blocks on that stdin and reds at the fixture's bound"
  else
    fail "an install without </dev/null did not hang on a never-EOF stdin (exit $rc): $out"
  fi
  if [[ "$out" != *"Restart every running Claude session"* ]]; then
    pass "and it never reached the success line"
  else
    fail "the de-stdin install reported success: $out"
  fi
  # Release the write end: any `cat` still blocked on the fifo reads EOF and exits,
  # so this case leaves no process behind.
  exec 9>&-
fi

say $'\nCase 15: a wrong or unreadable marketplace refuses before the bump'
for source_case in other missing malformed remote stale_location; do
  if fixture "source-$source_case"; then
    drift "$dir"
    base=$(git -C "$dir" rev-parse HEAD)
    node -e '
      const fs = require("fs");
      const [file, kind, other] = process.argv.slice(1);
      const doc = JSON.parse(fs.readFileSync(file));
      if (kind === "missing") { fs.unlinkSync(file); process.exit(); }
      if (kind === "malformed") { fs.writeFileSync(file, "{"); process.exit(); }
      if (kind === "other") doc.esquisse.source.path = other;
      if (kind === "remote") doc.esquisse.source = { source: "github", repo: "example/esquisse" };
      if (kind === "stale_location") doc.esquisse.installLocation = other;
      fs.writeFileSync(file, JSON.stringify(doc));
    ' "$CLAUDE_CONFIG_DIR/plugins/known_marketplaces.json" "$source_case" "$REPO_ROOT"
    run --patch
    if [[ $rc -eq 1 && "$out" == *"marketplace source mismatch or unreadable"* && "$out" == *"plugin marketplace add"* && "$(git -C "$dir" rev-parse HEAD)" == "$base" && -z "$(git -C "$dir" status --porcelain)" && ! -s "$STUB_LOG" ]]; then
      pass "$source_case source refuses with a repair command, unchanged HEAD and manifests, and no Claude call"
    else
      fail "$source_case source did not refuse before mutation (exit $rc): $out"
    fi
    run --check
    if [[ $rc -eq 0 && "$out" == *"marketplace source mismatch or unreadable"* && ! -s "$STUB_LOG" ]]; then
      pass "--check reports $source_case without installing"
    else
      fail "--check did not report $source_case cleanly (exit $rc): $out"
    fi
  fi
done

say $'\nCase 16: a symlink to the same checkout is accepted'
if fixture source_symlink; then
  drift "$dir"
  ln -s "$dir" "$SCRATCH/source alias"
  node -e '
    const fs = require("fs");
    const [file, alias] = process.argv.slice(1);
    const doc = JSON.parse(fs.readFileSync(file));
    doc.esquisse.source.path = alias;
    doc.esquisse.installLocation = alias;
    fs.writeFileSync(file, JSON.stringify(doc));
  ' "$CLAUDE_CONFIG_DIR/plugins/known_marketplaces.json" "$SCRATCH/source alias"
  run --patch
  if [[ $rc -eq 0 && "$(claude_calls 'plugin update')" -eq 1 ]]; then
    pass "the same real directory through a symlink with spaces releases successfully"
  else
    fail "an alias to the correct source was refused (exit $rc): $out"
  fi
fi

say ""
if [[ $fails -eq 0 ]]; then
  say "release-local guard: every case holds."
  exit 0
fi
printf '%d release-local case(s) failed.\n' "$fails"
exit 1
