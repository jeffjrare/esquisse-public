#!/usr/bin/env bash
#
# check-nopush.sh — no esq command pushes, and the shipped plugin does not even
# spell the command.
#
# THE RULE (D-esquisse-never-pushes). What esquisse writes to git is at most one
# merge commit on the destination branch of the LOCAL repository. The reason is
# blast radius: a local merge commit is recoverable by the person who ran the
# command, while a push can trigger a deploy, notify a team or start a
# pipeline, none of which is undoable from the terminal that caused it. This is
# a safety guarantee, and it is kept mechanical because "a capability that
# exists behind a guard is a capability one plausible edit away from firing".
#
# THE BAN IS ON THE LITERAL, comments and prose included, because a guard that
# distinguishes a push esquisse RUNS from one it merely NAMES has to decide
# statically which side of the line a string is on — and that answer changes
# with one refactor that passes a composed string to a shell instead of to a
# report. `resolvablePush` in plugin/lib/cli.mjs was exactly that case; it was
# fixed rather than exempted, and now reports the fact instead of composing the
# line. There are no opt-outs.
#
# WHAT IT READS. Every regular file under <dir>, one awk pass, two shapes:
#   1. the porcelain spelling — `git` plus dash-flags (each allowed one
#      argument, so `git -C /path push` is caught) then the subcommand;
#   2. the argv form — an array literal opening with the subcommand, which is
#      how an execution would actually be written here.
#
# WHAT IT DELIBERATELY DOES NOT READ: `git-push` (the man-page name), a
# subcommand assembled at runtime (nothing static catches that; it is
# docs/AUDIT.md's pass), and `.push(` / `PushNotification` / "never pushes" —
# a check that flagged those would be turned off within a week.
#
# Usage: scripts/check-nopush.sh <dir>
# Exit 0 = clean (summary on stdout), 1 = findings (one per line on stdout),
#          2 = the directory is unusable, or nothing in it is checkable.

set -uo pipefail

DIR="${1:-}"
if [ -z "$DIR" ]; then
  echo "usage: check-nopush.sh <dir>" >&2
  exit 2
fi
if [ ! -d "$DIR" ]; then
  echo "check-nopush.sh: '$DIR' is not a directory" >&2
  exit 2
fi

# An empty tree must not pass vacuously — "nothing to check" and "nothing in the
# shipped plugin pushes" print the same green line and mean opposite things.
FILES=()
while IFS= read -r f; do
  FILES+=("$f")
done < <(find "$DIR" -type f | LC_ALL=C sort)
if [ "${#FILES[@]}" -eq 0 ]; then
  echo "check-nopush.sh: no files under '$DIR'" >&2
  exit 2
fi

awk '
function finding(m) { print m; findings++ }

FNR == 1 { checked++ }

{
  line = $0

  # 1. The porcelain spelling. `git`, then any number of dash-flags — each
  #    allowed one non-flag argument, which is what `-C <path>` needs — then the
  #    subcommand as a whole word. Requiring the flags to start with `-` is what
  #    keeps prose like "git merge is a write; a push is not" silent: `merge`
  #    is not a flag, so the only remaining shape is `git` immediately followed
  #    by the subcommand.
  if (line ~ /(^|[^-A-Za-z0-9_])git([ \t]+-[^ \t]+([ \t]+[^-][^ \t]*)?)*[ \t]+push([^-A-Za-z0-9_]|$)/) {
    finding(FILENAME ":" FNR " spells the porcelain push command — esquisse never pushes, and the shipped plugin does not name it either (D-esquisse-never-pushes): " trim(line))
    next
  }

  # 2. The argv form: an array literal opening with the subcommand. Every git
  #    call in the CLI is an argv array, never a shell string, so an execution
  #    added here would be written exactly like this.
  if (line ~ /\[[ \t]*("push"|'"'"'push'"'"'|`push`)/) {
    finding(FILENAME ":" FNR " opens a git argument vector with `push` — esquisse never pushes (D-esquisse-never-pushes): " trim(line))
  }
}

function trim(s) { sub(/^[ \t]+/, "", s); return s }

END {
  if (checked == 0) {
    print "check-nopush.sh: nothing readable to check" > "/dev/stderr"
    exit 2
  }
  if (findings > 0) exit 1
  printf "%d file(s) read; nothing in the shipped plugin runs or spells a push\n", checked
}
' "${FILES[@]}"
rc=$?
[ "$rc" -eq 0 ] || exit "$rc"
