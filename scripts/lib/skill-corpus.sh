#!/usr/bin/env bash
#
# skill-corpus.sh — resolve a skill's text.
#
# A skill is `<root>/<name>/SKILL.md` plus the `references/*.md` beside it.
# That is the only shape there is: the flat mirror this helper used to also
# accept retired with the legacy installer on 2026-09-22, and accepting a shape
# nothing produces only kept its fixtures alive.
#
# Sourced, never executed. Four functions, plus the init that binds a root:
#
#   skill_corpus_init <root>     bind the corpus; refuse an unreadable or empty
#                                one with status 2
#   skill_names                  every skill name in the corpus, sorted
#   skill_files <name>           the files carrying that skill, entrypoint
#                                first, references sorted after it
#   skill_grep <name> [opts] <pattern>
#                                grep that skill wherever its text lives; opts
#                                and pattern are passed to grep unchanged and
#                                the files are appended
#   marker_carrier <name> <marker>
#                                the file(s) carrying `<marker>:start` for that
#                                skill — one line each, status 1 when none
#
# Every accessor takes the skill name first and refuses an unknown one with a
# nonzero status: a check that silently examines no files is the failure this
# whole helper exists to make impossible.

SKILL_CORPUS_ROOT=""

# Bind a corpus root. Status 2 — never 1 — on a root that is missing,
# unreadable or carries no skill, because exit 2 is reserved for
# nothing-to-check and a caller must be able to tell that apart from findings.
skill_corpus_init() {
  local root="${1:-}"
  SKILL_CORPUS_ROOT=""

  [ -n "$root" ] || return 2
  [ -d "$root" ] && [ -r "$root" ] || return 2

  local nested
  nested=$(find "$root" -mindepth 2 -maxdepth 2 -name 'SKILL.md' -type f 2>/dev/null | head -n 1)
  [ -n "$nested" ] || return 2

  SKILL_CORPUS_ROOT="$root"
  return 0
}

skill_names() {
  [ -n "$SKILL_CORPUS_ROOT" ] || return 2
  find "$SKILL_CORPUS_ROOT" -mindepth 2 -maxdepth 2 -name 'SKILL.md' -type f 2>/dev/null \
    | sed -E 's#.*/([^/]+)/SKILL\.md$#\1#' | sort
}

# The entrypoint first, then everything else sorted. The order is deterministic
# so a finding's file list reads the same on every run, and so a check that
# takes the first file gets the entrypoint rather than whichever reference the
# filesystem happened to hand back.
skill_files() {
  local name="${1:-}"
  [ -n "$SKILL_CORPUS_ROOT" ] || return 2
  [ -n "$name" ] || return 1

  local entry="$SKILL_CORPUS_ROOT/$name/SKILL.md"
  [ -f "$entry" ] || return 1
  printf '%s\n' "$entry"
  # `return 0` is load-bearing, not tidiness: callers run under `set -o
  # pipefail`, and a skill with no references/ leaves `grep -v` with nothing to
  # print, so the pipeline exits 1 and the function would report "no such
  # skill" for a skill it had just listed. Every caller reads that status.
  find "$SKILL_CORPUS_ROOT/$name" -mindepth 1 -name '*.md' -type f 2>/dev/null \
    | grep -v "^${entry}$" | sort
  return 0
}

# grep over that skill's whole text. Options and pattern pass through unchanged
# — callers keep their -q, -n, -F, -o, -E as written — and the file list is
# appended, so one call greps the entrypoint and its references together.
skill_grep() {
  local name="${1:-}"
  shift || return 1
  local files
  files=$(skill_files "$name") || return $?
  [ -n "$files" ] || return 2
  # shellcheck disable=SC2086
  grep "$@" $files
}

# The file carrying `<marker>:start` for this skill. One line per carrier, so a
# caller can count: a marker pair is meant to live in exactly one file, and two
# lines here is the defect rather than a tie to break.
marker_carrier() {
  local name="${1:-}" marker="${2:-}"
  [ -n "$marker" ] || return 1
  local files hits
  files=$(skill_files "$name") || return $?
  # shellcheck disable=SC2086
  hits=$(grep -l -F "${marker}:start" $files 2>/dev/null)
  [ -n "$hits" ] || return 1
  printf '%s\n' "$hits"
}
