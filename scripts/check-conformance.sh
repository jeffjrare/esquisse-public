#!/usr/bin/env bash
#
# check-conformance.sh — the shapes a skill writes and the CLI parses.
#
# `docs/CONFORMANCE.md` is the contract; this script is only its evaluator. Every
# clause below pins a section, a header field, a path form, a table row or a
# glyph that a skill TEMPLATE writes and a conserved reader parses. That is the
# gap the `node --test` suites cannot cover: they prove the parser reads the
# shape, never that the template still writes it — reword a template and every
# parser silently finds nothing, forever.
#
# It is NOT a check on how anything is worded. Clauses that pinned a rule's
# phrasing, an explanation, a recommendation or the order of two sentences were
# removed on 2026-09-22: a correct rewrite failed them, which made this an editor
# rather than a contract. Those rules live in the skills as instructions and in
# `docs/AUDIT.md`'s reading pass. Do not add one back under another name.
#
# ONE AWK PASS. A clause is one record on one line, fielded by control
# characters, and the whole set is matched in a single pass rather than forking a
# grep per clause. **A needle must therefore be a single line and must contain no
# \037 and no \036** — one that did would split its own record and could be
# answered by the wrong field. The awk program is a single-quoted shell string,
# so it must also contain no apostrophe.
#
# Usage: scripts/check-conformance.sh [skill-root]   (default: plugin/skills)
# Exit 0 = clean (summary on stdout), 1 = findings (one per line on stdout, then
#          the count), 2 = the path is not a directory. A directory holding no
#          skill is not a vacuous pass either: every clause reports its target
#          missing, so it exits 1 loudly rather than 0.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2

ROOT="${1:-plugin/skills}"
fails=0
checks=0

if [[ ! -d "$ROOT" ]]; then
  printf 'conformance root is not a directory: %s\n' "$ROOT" >&2
  exit 2
fi

# --- the engine -------------------------------------------------------------
# One clause kind, one awk pass. `need` builds a record; the pass answers them
# all at once rather than forking a grep each.
#
# A record's fields are separated by US and the paths inside its file list by
# RS. Both are control characters, and every needle is a single line, so one
# clause is exactly one record on one line. A clause carrying a newline, a
# \037 or a \036 would split its own record — do not write one.
US=$'\037'
RS=$'\036'
RECORDS=()

# `**/*.md` is what `grep -RFl --include='*.md'` read under a split skill;
# nullglob is what keeps a skill with no `references/` from yielding the pattern
# itself. Set here, beside the one glob in this file that needs them.
shopt -s globstar nullglob

declare -A TARGET_CACHE=()

# The scenarios this run actually evaluates, counted rather than written down.
# The number used to be a literal in the summary and it was two ahead of the
# truth — docs/CONFORMANCE.md carries scenarios whose whole evidence is a
# runtime journey and which therefore hold no clause here, so neither the
# heading count nor a hand-kept figure answers "how many did this check
# evaluate". This is the same reason the clause count is computed
# (D-the-auditor-pays-its-own-cost-rule): a tally nobody recomputes goes stale
# before anyone notices, and a stale one in a summary reads as a measurement.
declare -A SCENARIOS=()

# REPLY becomes the RS-joined files a command name resolves to, or "" when it
# resolves to nothing — `<root>/<name>.md`, else `<root>/<name>/SKILL.md`'s whole
# directory, else missing. Memoised: one name carries up to forty clauses, and a
# skill's glob and its LC_ALL=C sort are worth walking once per run rather than
# once per clause. The sort is not cosmetic — `need_before` judges ordering in
# the FIRST file holding its first literal, which is what `grep -R … | sort`
# meant, and that is the order these paths come out in.
resolve_target() {
  local name="$1" joined=""
  local -a found=() sorted=()

  if [[ -n "${TARGET_CACHE[$name]+set}" ]]; then
    REPLY="${TARGET_CACHE[$name]}"
    return
  fi

  if [[ -f "$ROOT/$name/SKILL.md" ]]; then
    found=("$ROOT/$name"/**/*.md)
    if (( ${#found[@]} > 0 )); then
      mapfile -t sorted < <(printf '%s\n' "${found[@]}" | LC_ALL=C sort)
      joined="$(IFS="$RS"; printf '%s' "${sorted[*]}")"
    fi
  fi

  TARGET_CACHE["$name"]="$joined"
  REPLY="$joined"
}

need() {
  local scenario="$1" name="$2" needle="$3" label="$4"
  SCENARIOS["$scenario"]=1
  checks=$((checks + 1))
  resolve_target "$name"
  RECORDS+=("need${US}${scenario}${US}${name}${US}${label}${US}${needle}${US}${REPLY}")
}

# THE CLAUSES. Each one pins a shape a skill WRITES and a conserved reader PARSES — a section, a
# field line, a path form, a table row, a glyph. That is the whole criterion, and it is what the
# `node --test` suites cannot reach: they prove the parser reads the shape, never that the template
# still writes it. Reword the template and every parser silently finds nothing.
#
# What is deliberately NOT here any more (2026-09-22): clauses that pinned a *formulation* — a rule's
# wording, an explanation, a recommendation, the order two sentences appear in. A correct rewrite
# failed them, which made the check an editor rather than a contract, and the rules they froze live in
# the skills as instructions and in `docs/AUDIT.md`'s reading pass, where a reader can judge them.

# --- `/esq:plan` writes the plan file that four readers parse ----------------
#
# Each needle is the TOKEN the parser matches on, and nothing around it. The
# prose in a template's placeholder — what the field means, which branch to put
# there — is prose, and freezing it would make a correct rewording a finding.
need P-02 plan '## Execution log' 'the `## Execution log` heading `parsePlan` finds the log span by, and `plan append-log` appends under'
need P-02 plan '**Branch:**' 'the `**Branch:**` header field `headerField` reads, and `esq branch check` and `esq merge land` take the shipping unit and the merge source from'
need P-02 plan '## Rollout' 'the `## Rollout` section heading `esq branch check` collects `unit.rollout` from, which `/esq:land` shows after the merge'
need P-02 plan '**Origin:**' 'the `**Origin:**` header field `esq merge land` takes the landing destination from — a plan missing it is refused rather than repaired'

# --- `/esq:build` writes the execution-log entry the classifier reads --------
#
# ONE clause, on the glyph. `markdown.mjs` matches `^### Phase N — (completed|⏸)`
# and says so in its own comment: the clause after the glyph is prose, every
# consumer routes on `status: "paused"`, and a third clause would need no parser
# change. Pinning the two sentences would have frozen exactly what that design
# left free — and two clauses over one marker is one clause written twice.
need U-01 build '### Phase N — ⏸' 'the paused-entry heading form `parsePlan` classifies a phase on — the `⏸` glyph, never the sentence after it'

# --- the finders write the corrective brief `esq brief plan` resolves --------
need P-03 check '-fixes.brief.md' 'the corrective-brief filename suffix `CORRECTIVE_BRIEF` matches and `briefPlan` resolves a plan from by slug'
need P-03 review '-fixes.brief.md' 'the same suffix on the other finder, since either may write the brief'

# --- `/esq:backlog` writes the row `backlogTable` parses ---------------------
need P-04 backlog '| B-NNN | <today>' 'the quick-add row shape the backlog table parser reads, ID column first'

# --- the pass ---------------------------------------------------------------
# Every target file is read once into memory and every clause is answered with
# index(), which is the fixed-string, line-scoped compare `grep -F` performed.
# Findings come back in declaration order, exactly as they were printed before.
answered=()
mapfile -t answered < <(printf '%s\n' "${RECORDS[@]}" | awk -v US="$US" -v SEP="$RS" '
BEGIN { FS = US }

function load(f,   i, line) {
  if (f in loaded) return
  loaded[f] = 1
  i = 0
  while ((getline line < f) > 0) { i++; LINES[f, i] = line }
  close(f)
  COUNT[f] = i
}

# Whether <f> holds <needle> anywhere — `grep -qF -- <needle> <f>`.
function at(f, needle,   i) {
  load(f)
  for (i = 1; i <= COUNT[f]; i++) if (index(LINES[f, i], needle) > 0) return i
  return 0
}

{
  # Counted in the rule itself, never as NR in END: awk reads every input record
  # whether or not a rule ran for it, so an END reporting NR would report a full
  # count for a program whose main rule never fires at all.
  seen++
  scenario = $2; name = $3; label = $4
  files = $6

  if (files == "") { printf "%s: %s command/skill is missing\n", scenario, name; next }
  n = split(files, F, SEP)

  # A clause is satisfied by ANY file of the carrier, which is what
  # `grep -RFl --include=*.md … | head -1` answered for a split skill. No
  # apostrophe may appear anywhere in this program: it is a single-quoted
  # shell string, and one would end it silently, leaving awk a program with
  # no main rule that reads every record and prints nothing.
  for (i = 1; i <= n; i++) if (at(F[i], $5) > 0) next
  printf "%s: %s lost %s\n", scenario, name, label
}

# How many records the main rule actually ran for, last and prefixed with US so
# no finding can be mistaken for it. It is the only thing that tells the shell
# this program ran at all.
END { printf "%s%d\n", US, seen + 0 }
')

# A pass that answered nothing prints nothing, and without this the script would
# report `Clean` having checked not one clause — on any root, including one that
# holds no command at all. Two ways in, both reproduced: an `awk` that fails, and
# a program the shell truncated (a balanced apostrophe anywhere in it is enough,
# which is why the comment above forbids one). Exit 2 is the unusable-input code,
# and audit.sh's check-24 dispatch already routes it to a finding.
sentinel=""
(( ${#answered[@]} > 0 )) && sentinel="${answered[-1]}"
if [[ "$sentinel" != "$US"* ]]; then
  printf 'check-conformance.sh: the matching pass did not run — 0 of %d clause(s) read\n' \
    "${#RECORDS[@]}" >&2
  exit 2
fi
unset 'answered[${#answered[@]}-1]'
if [[ "${sentinel#"$US"}" != "${#RECORDS[@]}" ]]; then
  printf 'check-conformance.sh: the matching pass read %s of %d clause(s)\n' \
    "${sentinel#"$US"}" "${#RECORDS[@]}" >&2
  exit 2
fi

findings=("${answered[@]}")
fails=${#findings[@]}

if [[ "$fails" -eq 0 ]]; then
  printf '%d behavioral scenarios, %d observable clauses present\n' "${#SCENARIOS[@]}" "$checks"
  exit 0
fi

printf '%s\n' "${findings[@]}"
printf '%d conformance finding(s) across %d clauses.\n' "$fails" "$checks"
exit 1
