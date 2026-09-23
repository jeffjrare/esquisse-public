#!/usr/bin/env bash
#
# check-structure.sh — the references that must resolve.
#
# Four properties, all of the same kind: something names something else, and the
# named thing has to exist. That is the whole class of prose defect a machine
# can settle. Anything about what a document *says* — a rule stated twice and
# differently, a procedure that lost its condition — is docs/AUDIT.md's reading
# pass and is not attempted here.
#
#   1. A section cross-reference resolves inside its own skill.
#   2. Every `/esq:<name>` mentioned has a source file.
#   3. Every command appears in the README's command table.
#   4. Every `references/<file>.md` a skill names exists.
#   5. Every section a grill brief writes is named by the command that reads it.
#
# Usage: check-structure.sh [<skills-dir>] [<readme>]
# Exit 0 = clean (summary on stdout), 1 = findings (one per line), 2 = the
# corpus is unusable.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2

CMD_DIR="${1:-plugin/skills}"
README="${2:-README.md}"

source "$(dirname "${BASH_SOURCE[0]}")/lib/skill-corpus.sh"

if ! skill_corpus_init "$CMD_DIR"; then
  printf 'check-structure.sh: %s is missing, unreadable or carries no skill — nothing to check\n' \
    "$CMD_DIR" >&2
  exit 2
fi
if [ ! -r "$README" ]; then
  printf 'check-structure.sh: %s is missing or unreadable — nothing to check\n' "$README" >&2
  exit 2
fi

findings=0
finding() { printf '%s\n' "$1"; findings=$((findings + 1)); }

# --- 1. Section cross-references resolve ------------------------------------
#
# `build`'s "see 'Resolve a paused phase'" must point at a heading that exists
# in that same skill. Only quoted phrases in explicit navigation context count:
# a bare quoted string is usually a task title or a literal.
#
# Per SKILL, not per file: the unit a reference has to resolve inside is the one
# loaded together at runtime — the entrypoint plus the references/ it names.

# Loop-invariant: every heading text in the corpus, computed once. Piping into
# an early-exiting reader would SIGPIPE the producer under pipefail, so both
# heading lists are captured first and matched from a here-string.
all_heads=$(for n in $(skill_names); do skill_grep "$n" -hE '^#{2,6} '; done | sed -E 's/^#+ *//')

crossout=$(mktemp)
for n in $(skill_names); do
  heads=$(skill_grep "$n" -hE '^#{2,6} ' | sed -E 's/^#+ *//')
  skill_grep "$n" -ohE '(see|See|under|Under|via|Via|Run|Go to|through) "[^"]{6,60}"' 2>/dev/null \
    | sed -E 's/^[A-Za-z ]+"//; s/"$//; s/[.,;:]+$//' | sort -u | while read -r ref; do
      # A ref starting with # names a heading in the *user's* project file
      # (CLAUDE.md's "### Conventions"), not a section of this command.
      case "$ref" in \#*) continue ;; esac
      # Fixed-string compare: section names carry backticks and parens.
      grep -qxF "$ref" <<<"$heads" && continue
      # Or the phrase is a bolded label defined inline in this skill.
      skill_grep "$n" -qF "**${ref}" && continue
      if grep -qxF "$ref" <<<"$all_heads"; then
        echo "$n: points at \"$ref\" — that heading lives in another command" >> "$crossout"
      else
        echo "$n: points at \"$ref\" — no such heading anywhere" >> "$crossout"
      fi
  done
done
if [ -s "$crossout" ]; then
  cat "$crossout"
  findings=$((findings + $(wc -l < "$crossout")))
fi
rm -f "$crossout"

# --- 2. Referenced commands exist -------------------------------------------
esq_refs=$( { for n in $(skill_names); do skill_grep "$n" -ohE '/esq:[a-z]+'; done
             grep -ohE '/esq:[a-z]+' "$README"; } 2>/dev/null | sort -u)
while read -r ref; do
  [ -n "$ref" ] || continue
  skill_files "${ref#/esq:}" >/dev/null 2>&1 && continue
  finding "$ref referenced but no such command exists in $CMD_DIR"
done <<EOF
$esq_refs
EOF

# --- 3. The README command table is exhaustive ------------------------------
#
# One table, read heading-to-next-heading so it can move inside the README
# without breaking this. A command missing from it is a command a reader cannot
# discover; that is the whole claim, and "is it described *correctly*" stays a
# reading pass.
readme_section() {
  awk -v h="$1" 'index($0, "## " h) == 1 { f = 1; next } f && /^## / { exit } f' "$README"
}

commands_body=$(readme_section "Commands")
if [ -z "$commands_body" ]; then
  finding "$README has no \"## Commands\" section — command coverage cannot be verified"
else
  for n in $(skill_names); do
    # The plain spelling, backticks or not: the claim is that a reader scanning
    # this section meets every command, not that each is typeset one way.
    grep -qE "/esq:$n([^a-z]|\$)" <<<"$commands_body" \
      || finding "/esq:$n is missing from the \"Commands\" section of $README"
  done
fi

# --- 4. Every reference a skill names exists --------------------------------
#
# A split skill loads its procedures by path. A path that resolves to nothing is
# a branch that reaches no instructions — which is the failure the whole
# references/ arrangement can produce and nothing else catches.
for n in $(skill_names); do
  skill_grep "$n" -ohE 'references/[A-Za-z0-9._-]+\.md' 2>/dev/null | sort -u | while read -r ref; do
    [ -n "$ref" ] || continue
    [ -f "$CMD_DIR/$n/$ref" ] && continue
    echo "$n: names \`$ref\`, which does not exist"
  done
done > "${crossout:=$(mktemp)}"
if [ -s "$crossout" ]; then
  cat "$crossout"
  findings=$((findings + $(wc -l < "$crossout")))
fi
rm -f "$crossout"

# --- 5. Brief sections have a consumer --------------------------------------
#
# A brief exists solely to be consumed, so every section it defines must be
# named by the command that consumes it. `## Done looks like` was written into
# every grill brief and read by no command at all, so the cycle could only ever
# audit a plan against itself.
if skill_files grill >/dev/null 2>&1 && skill_files plan >/dev/null 2>&1; then
  while read -r sec; do
    [ -z "$sec" ] && continue
    case "$sec" in "For /esq:plan") continue ;; esac
    skill_grep plan -qF "## $sec" \
      || finding "brief section \"$sec\" is written by grill but named by no consumer"
  done <<EOF
$(skill_files grill | while IFS= read -r gf; do
    sed -n '/^# Brief: /,/^## For \/esq:plan/p' "$gf"
  done | grep -E '^## ' | sed -E 's/^## //')
EOF
fi

# ---------------------------------------------------------------------------
if [ "$findings" -gt 0 ]; then
  exit 1
fi
printf 'structure clean — section references, %s commands, README coverage, every references/ path and every brief section resolve\n' \
  "$(skill_names | wc -l | tr -d ' ')"
exit 0
