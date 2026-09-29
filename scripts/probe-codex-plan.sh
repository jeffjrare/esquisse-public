#!/usr/bin/env bash
#
# probe-codex-plan.sh — one real opted-in `/esq:plan` run, end to end, with the
# Codex adversary on (B-186).
#
# A research instrument, never a gate: it is not wired into audit.sh, --lab or
# anything a skill reads, because every run spends Claude and Codex money. Re-run
# it by hand after an edit to plugin/skills/plan/references/codex-adversary.md.
#
# What it proves, one PASS/FAIL line each, exit 0 only when all five pass:
#   1. the counter-plan call is launched before the pre-mortem call;
#   2. the counter-plan is blind: its prompt carries no `## Phases`, and no plan
#      file existed in the scratch repo when it was launched (the reference's
#      prompt does name `docs/plans/<today>-<slug>*`, as the path NOT to read, so
#      a grep for that path would red on the prompt the reference requires);
#   3. the plan commit's body carries the `Adversary (codex config` block with
#      `counter-plan: not returned`;
#   4. the final report carries a `Codex:` line;
#   5. no counter-plan process is left alive once the run has ended.
#
# How: a `codex` shim goes first on PATH. It logs every call's argv and stdin.
# The counter-plan call (argv names codex-counter-plan.schema.json) sleeps past
# the run under a per-run marker, so kill-on-late is forced, not hoped for. Any
# other call execs the real `codex`, arguments unchanged, so the pre-mortem's
# -C / -o / stdin `-` / effort flag meet the real CLI. Claude's Bash tool
# re-sources the user's shell profile, which may prepend the real codex's
# directory again, so the shim is also put first by CLAUDE_ENV_FILE, which the
# tool sources before every command.
#
# Bound, printed before launch: one headless call, --max-budget-usd 5, a KILL at
# 1200 s, ESQ_CODEX_EFFORT=low. No retry. Isolation follows docs/headless-trial.md:
# a copied credential in a mode-700 temporary CLAUDE_CONFIG_DIR removed on exit,
# no session persistence, hooks off, ESQ_TELEMETRY=off. Nothing under ~/.claude/
# is written. Needs provider network: run it outside a network sandbox, in the
# background (it can outlast a 600 s foreground cap).
#
# Usage: scripts/probe-codex-plan.sh

set -u
umask 077

REPO=$(cd "$(dirname "$0")/.." && pwd)
CREDENTIALS="$HOME/.claude/.credentials.json"
BUDGET_USD=5
BOUND_S=1200
TASK='Add a --version flag to cli.js that prints the version from package.json'

REAL_CODEX=$(command -v codex) || { printf 'probe: no codex on PATH — nothing to probe\n' >&2; exit 2; }
command -v claude >/dev/null || { printf 'probe: no claude on PATH\n' >&2; exit 2; }
[ -r "$CREDENTIALS" ] || { printf 'probe: %s is not readable\n' "$CREDENTIALS" >&2; exit 2; }

SCRATCH=$(mktemp -d /tmp/esq-probe-codex-repo.XXXXXX)
RESULT=$(mktemp -d /tmp/esq-probe-codex-result.XXXXXX)
CONFIG=$(mktemp -d /tmp/esq-headless-auth.XXXXXX)
MARKER="esq-probe-counter-sleep-$$"
KEEP=1

cleanup() {
  pkill -KILL -f -- "$MARKER" 2>/dev/null
  rm -rf -- "$CONFIG"
  if [ "$KEEP" = 0 ]; then rm -rf -- "$SCRATCH" "$RESULT"; fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

printf 'probe: scratch repo %s\nprobe: result dir   %s\n' "$SCRATCH" "$RESULT"
printf 'probe: bound — one headless call, max %s USD, KILL at %s s, ESQ_CODEX_EFFORT=low\n' "$BUDGET_USD" "$BOUND_S"

# The scratch repository: one committed cli.js and package.json on main.
(
  cd "$SCRATCH" &&
  git init -q -b main &&
  git config user.name 'esq probe' && git config user.email 'probe@example.invalid' &&
  printf '{\n  "name": "probe-cli",\n  "version": "1.4.2",\n  "bin": { "probe-cli": "cli.js" }\n}\n' > package.json &&
  printf '#!/usr/bin/env node\nconst args = process.argv.slice(2);\nconsole.log(`hello ${args[0] ?? "world"}`);\n' > cli.js &&
  git add cli.js package.json && git commit -q -m 'init'
) || { printf 'probe: could not build the scratch repo\n' >&2; exit 2; }

# The codex shim.
mkdir -p "$RESULT/shim"
cat > "$RESULT/shim/codex" <<SHIM
#!/usr/bin/env bash
id=\$(date +%s%N)
cat > "$RESULT/stdin.\$id"
{
  printf '=== call %s\n' "\$id"
  printf 'argv:'; printf ' %q' "\$@"; printf '\n'
  printf -- '--- stdin ---\n'; cat "$RESULT/stdin.\$id"; printf -- '--- end ---\n'
} >> "$RESULT/codex-calls.log"
case " \$* " in
  *codex-counter-plan.schema.json*)
    cp "$RESULT/stdin.\$id" "$RESULT/counter.stdin"
    find "$SCRATCH/docs/plans" -name '*.md' ! -name '*.brief.md' 2>/dev/null > "$RESULT/counter.plans-at-launch"
    : > "$RESULT/counter.started"
    exec -a "$MARKER" sleep 1500
    ;;
  *) exec "$REAL_CODEX" "\$@" < "$RESULT/stdin.\$id" ;;
esac
SHIM
chmod 700 "$RESULT/shim/codex"
printf 'export PATH="%s:$PATH"\n' "$RESULT/shim" > "$RESULT/env.sh"

cp -- "$CREDENTIALS" "$CONFIG/.credentials.json"
chmod 600 "$CONFIG/.credentials.json"

# `claude --help` (2.1.x) carries every flag below; the tool list adds Bash, the
# write tools and TaskStop to the headless recipe's read-only set, and --add-dir
# lets the restricted file tools read the skill's references in $REPO/plugin.
start=$(date +%s)
rc=0
(
  cd "$SCRATCH" &&
  env -u ANTHROPIC_API_KEY -u CLAUDE_CODE_OAUTH_TOKEN -u ESQ_CODEX_MODEL \
    PATH="$RESULT/shim:$PATH" CLAUDE_ENV_FILE="$RESULT/env.sh" \
    CLAUDE_CONFIG_DIR="$CONFIG" ESQ_TELEMETRY=off \
    ESQ_CODEX=on ESQ_CODEX_EFFORT=low \
    timeout --signal=KILL "$BOUND_S" claude --plugin-dir "$REPO/plugin" --add-dir "$REPO/plugin" \
      -p "/esq:plan $TASK" \
      --model opus --effort medium --output-format stream-json --verbose \
      --permission-mode dontAsk --restricted \
      --tools Bash,Read,Write,Edit,Grep,Glob,Skill,TaskStop \
      --allowedTools Bash,Read,Write,Edit,Grep,Glob,Skill,TaskStop \
      --strict-mcp-config --setting-sources '' \
      --settings '{"disableAllHooks":true,"autoMemoryEnabled":false}' \
      --no-session-persistence --max-budget-usd "$BUDGET_USD" \
      < /dev/null > "$RESULT/stream.jsonl" 2> "$RESULT/stderr.txt"
) || rc=$?
elapsed=$(( $(date +%s) - start ))

# Stopping a background task is asynchronous; give it a moment before judging 5.
sleep 2

fails=0
pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s — %s\n' "$1" "$2"; fails=$((fails + 1)); }

log="$RESULT/codex-calls.log"
counter_line=$(grep -n -m1 '^argv:.*codex-counter-plan\.schema\.json' "$log" 2>/dev/null | cut -d: -f1)
premortem_line=$(grep -n -m1 '^argv:.*codex-premortem\.schema\.json' "$log" 2>/dev/null | cut -d: -f1)
if [ -n "$counter_line" ] && [ -n "$premortem_line" ] && [ "$counter_line" -lt "$premortem_line" ]; then
  pass '1 counter-plan launched before the pre-mortem'
else
  fail '1 counter-plan launched before the pre-mortem' \
    "counter-plan argv at line ${counter_line:-none}, pre-mortem at line ${premortem_line:-none} of codex-calls.log"
fi

if [ ! -f "$RESULT/counter.stdin" ]; then
  fail '2 counter-plan is blind' 'no counter-plan call was logged'
elif grep -q '^## Phases' "$RESULT/counter.stdin"; then
  fail '2 counter-plan is blind' 'its prompt carries a `## Phases` section'
elif [ -s "$RESULT/counter.plans-at-launch" ]; then
  fail '2 counter-plan is blind' "a plan existed at launch: $(head -1 "$RESULT/counter.plans-at-launch")"
else
  pass '2 counter-plan is blind (no ## Phases, no plan file at launch)'
fi

body=$(git -C "$SCRATCH" log -1 --format=%b)
subject=$(git -C "$SCRATCH" log -1 --format=%s)
if printf '%s\n' "$body" | grep -qF 'Adversary (codex config' &&
   printf '%s\n' "$body" | grep -qF 'counter-plan: not returned'; then
  pass '3 plan commit body carries the Adversary block, counter-plan not returned'
else
  fail '3 plan commit body carries the Adversary block' "last commit '$subject', body: $(printf '%s' "$body" | head -3 | tr '\n' '|')"
fi

readarray -t final < <(node -e '
  const lines = require("fs").readFileSync(process.argv[1], "utf8").split("\n");
  let r = null;
  for (const l of lines) { try { const o = JSON.parse(l); if (o.type === "result") r = o; } catch {} }
  const text = r && typeof r.result === "string" ? r.result : "";
  const codex = text.split("\n").find(l => /^[\s>*`-]*Codex:/.test(l)) ?? "";
  console.log(r && typeof r.total_cost_usd === "number" ? r.total_cost_usd : "unknown");
  console.log(codex.trim());
' "$RESULT/stream.jsonl" 2>/dev/null)
cost=${final[0]:-unknown}
codex_line=${final[1]:-}
if [ -n "$codex_line" ]; then
  pass "4 final report carries: $codex_line"
else
  fail '4 final report carries a Codex: line' 'no such line in the stream'"'"'s final result'
fi

left=$(pgrep -f -- "$MARKER" | tr '\n' ' ')
if [ -z "$left" ]; then
  pass '5 no counter-plan process left behind'
else
  fail '5 no counter-plan process left behind' "alive: pid $left"
fi

printf 'claude exit=%s elapsed_seconds=%s cost_usd=%s\n' "$rc" "$elapsed" "$cost"
printf -- '--- plan commit: %s ---\n%s\n--- end ---\n' "$subject" "$body"

if [ "$fails" = 0 ]; then
  KEEP=0
  exit 0
fi
printf 'probe: %s assertion(s) failed; scratch and result kept for diagnosis\n' "$fails"
exit 1
