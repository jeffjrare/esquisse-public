#!/usr/bin/env bash
# worktree.sh — manage isolated git worktrees for parallel esq sessions.
#
# Each worktree is a separate working tree on its own branch, so two Claude
# Code sessions never share an index, a working tree, or a plan file. That is
# the only collision-proof way to run two mutating esq commands (build, fix,
# sync, backlog) at the same time in one codebase.
#
# Worktrees live in a sibling dir "<repo>.worktrees/<name>" — OUTSIDE the main
# working tree, so editors and ripgrep don't index duplicated copies.
#
# Usage:
#   scripts/worktree.sh new <name> [base-ref]   Create a worktree + branch
#   scripts/worktree.sh ls                       List worktrees
#   scripts/worktree.sh rm <name> [--force]      Remove a worktree
#   scripts/worktree.sh -h | --help
#
# Notes for esq work:
#   - Each worktree carries its OWN docs/BACKLOG.md, docs/DECISIONS.md and
#     docs/plans/ on its branch. When you merge the branch back to the default
#     branch, those append-only files may conflict trivially — resolve by
#     keeping both sides' new rows.
#   - Creating a worktree RESERVES a backlog ID block for it (see below), so
#     two parallel sessions never mint the same B-NNN and the merge never has
#     to renumber anything.
#   - Generic: run it from any git repo, not just esquisse.

set -euo pipefail

# --- color output ---

if [ -t 1 ]; then
  c_red()    { printf '\033[31m%s\033[0m' "$1"; }
  c_green()  { printf '\033[32m%s\033[0m' "$1"; }
  c_yellow() { printf '\033[33m%s\033[0m' "$1"; }
  c_blue()   { printf '\033[34m%s\033[0m' "$1"; }
  c_dim()    { printf '\033[2m%s\033[0m' "$1"; }
  c_bold()   { printf '\033[1m%s\033[0m' "$1"; }
else
  c_red()    { printf '%s' "$1"; }
  c_green()  { printf '%s' "$1"; }
  c_yellow() { printf '%s' "$1"; }
  c_blue()   { printf '%s' "$1"; }
  c_dim()    { printf '%s' "$1"; }
  c_bold()   { printf '%s' "$1"; }
fi

die() { echo "$(c_red "✗") $1" >&2; exit 1; }

# --- repo context ---

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" \
  || die "Not inside a git repository."
REPO_NAME="$(basename "$REPO_ROOT")"
WT_BASE="$(dirname "$REPO_ROOT")/${REPO_NAME}.worktrees"

main_worktree() {
  # git lists the main working tree first in --porcelain output.
  git worktree list --porcelain | sed -n 's/^worktree //p' | head -n1
}

default_branch() {
  local d
  d="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')" || true
  if [[ -n "$d" ]]; then echo "$d"; return; fi
  for cand in main master; do
    if git show-ref --quiet --verify "refs/heads/$cand"; then echo "$cand"; return; fi
  done
  git symbolic-ref --short HEAD 2>/dev/null || echo main
}

# --- ID block reservation ---
#
# Backlog IDs are permanent citation keys: once a B-NNN is written, code,
# plans and commit messages may cite it, so it can never be renumbered. The
# only way two parallel worktrees can add items and still merge cleanly is for
# each to allocate from a range nobody else owns.
#
# The main working tree is block 0 — B-001..B-999 — and holds no marker file at
# all, which is exactly the historical behavior. Worktree index k owns
# k*1000 .. k*1000+999, recorded as a single line "id-block: <lo>-<hi>" in
# .esq-id-block at that worktree's root. A session finds its own block by
# reading that file at `git rev-parse --show-toplevel`; no file means block 0.

# The reservation is the CLI's and nothing else's: `esq backlog reserve-block`
# chooses the index and writes the marker inside one lock in the git common
# directory, re-reading the sibling worktrees once it holds that lock, so two
# worktrees created at once cannot choose the same block. This script used to
# carry its own copy of the choice as a fallback for a machine without node;
# that copy ran without the lock, which is the collision the lock exists to
# prevent, so it is gone — no allocator here means no allocation here.
ESQ_BIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/plugin/bin/esq"

# Refuses before anything is created when the canonical allocator cannot run.
require_id_block_allocator() {
  command -v node >/dev/null 2>&1 \
    || die "node is not on PATH, so the ID-block allocator (esq backlog reserve-block) cannot run — install node, then retry. No worktree was created."
  [[ -f "$ESQ_BIN" ]] \
    || die "The ID-block allocator is missing at $ESQ_BIN — run this from an esquisse checkout. No worktree was created."
}

# Reserve this worktree's block through the allocator. Echoes "<lo>-<hi>".
reserve_id_block() {
  local path="$1" out
  out="$(node "$ESQ_BIN" backlog reserve-block "$path")" || return 1
  node -e 'const r = JSON.parse(require("fs").readFileSync(0, "utf8")); process.stdout.write(`${r.low}-${r.high}`);' <<<"$out"
}

# --- help ---

print_help() {
  cat <<USAGE
$(c_bold "worktree.sh") — isolated git worktrees for parallel esq sessions.

$(c_bold "Commands:")
  new <name> [base-ref]   Create worktree "<name>" on a new branch "<name>".
                          Branches from base-ref (default: $(c_dim "$(default_branch)")).
                          If branch "<name>" already exists, checks it out instead.
  ls                      List all worktrees for this repo.
  rm <name> [--force]     Remove worktree "<name>". Refuses if it has uncommitted
                          changes unless --force. Offers to delete a merged branch.
  -h, --help              Show this help.

$(c_dim "Worktrees live in: $WT_BASE")
USAGE
}

# --- commands ---

cmd_new() {
  local name="${1:-}"
  local base="${2:-$(default_branch)}"
  [[ -n "$name" ]] || die "Usage: $0 new <name> [base-ref]"

  local path="$WT_BASE/$name"
  local branch="$name"

  [[ -e "$path" ]] && die "Path already exists: $path"
  require_id_block_allocator

  mkdir -p "$WT_BASE"

  if git show-ref --quiet --verify "refs/heads/$branch"; then
    echo "$(c_yellow "!") Branch $(c_bold "$branch") already exists — checking it out into the worktree."
    git worktree add "$path" "$branch"
  else
    git rev-parse --verify --quiet "$base^{commit}" >/dev/null \
      || die "Base ref not found: $base"
    git worktree add -b "$branch" "$path" "$base"
  fi

  local block
  block="$(reserve_id_block "$path")" \
    || die "The worktree exists at $path but its ID block could not be reserved — run: node \"$ESQ_BIN\" backlog reserve-block \"$path\" (its first esq backlog reserve-id also reserves one)."

  echo
  echo "$(c_green "✓") Worktree ready."
  echo "  Branch:   $(c_bold "$branch")  (from $(c_dim "$base"))"
  echo "  Path:     $(c_dim "$path")"
  echo "  ID block: $(c_bold "B-$block")  $(c_dim "(this worktree's backlog IDs — main keeps 1-999)")"
  echo
  echo "$(c_bold "Launch a second esq session there:")"
  echo "  $(c_blue "cd $path && claude")"
  echo
  echo "$(c_dim "Merge back when done:  git switch $(default_branch) && git merge $branch")"
  echo "$(c_dim "Then clean up:         $0 rm $name")"
}

cmd_ls() {
  echo "$(c_bold "Worktrees for $REPO_NAME:")"
  git worktree list
}

cmd_rm() {
  local name="" force=false
  for arg in "$@"; do
    case "$arg" in
      --force|-f) force=true ;;
      *) name="$arg" ;;
    esac
  done
  [[ -n "$name" ]] || die "Usage: $0 rm <name> [--force]"

  local path="$WT_BASE/$name"
  local branch="$name"

  # Captured first for the same reason. `|| wt_list=""` keeps the condition
  # byte-identical to the pipeline it replaces: a git that fails yielded a
  # failed pipeline, which yielded this die — and an empty list yields it too.
  local wt_list
  wt_list="$(git worktree list --porcelain)" || wt_list=""
  grep -qxF "worktree $path" <<<"$wt_list" \
    || die "No worktree registered at: $path"

  if [[ "$force" == true ]]; then
    git worktree remove --force "$path"
  else
    git worktree remove "$path" \
      || die "Worktree has uncommitted changes. Commit them, or re-run with --force to discard."
  fi
  echo "$(c_green "✓") Removed worktree $(c_dim "$path")"

  # Offer to delete the branch if it is fully merged into the default branch.
  local def; def="$(default_branch)"
  if git show-ref --quiet --verify "refs/heads/$branch"; then
    if git merge-base --is-ancestor "$branch" "$def" 2>/dev/null; then
      read -rp "Branch '$branch' is merged into $def. Delete it? [y/N] " reply
      if [[ "${reply:-n}" =~ ^[Yy]$ ]]; then
        git branch -d "$branch" && echo "$(c_green "✓") Deleted branch $(c_dim "$branch")"
      fi
    else
      echo "$(c_yellow "!") Branch $(c_bold "$branch") is NOT merged into $def — left in place."
      echo "  $(c_dim "Delete anyway with: git branch -D $branch")"
    fi
  fi
}

# --- dispatch ---

cmd="${1:-}"
[[ $# -gt 0 ]] && shift || true
case "$cmd" in
  new)        cmd_new "$@" ;;
  ls|list)    cmd_ls "$@" ;;
  rm|remove)  cmd_rm "$@" ;;
  -h|--help|"") print_help ;;
  *) die "Unknown command: $cmd (try --help)" ;;
esac
