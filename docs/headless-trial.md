# Bounded read-only headless trial

<!-- Maintainer recipe, moved from README.md on 2026-09-26. -->


For one response-only preparation/review, reuse the
[B-182 success](preparation/2026-09-25-b182-tamialog.md#reprise-explicitement-autorisée-hors-sandbox)
(Claude Code 2.1.282). Name the still-unproved property and announce **one call,
at most 3 USD / 180 seconds** before launching. Preserve required spending and
host-execution authorizations; do not rerun an acquired reference.

**Host:** needs provider DNS/HTTPS, credential read, temporary config/result writes
and child-process-group termination. Here sandbox DNS failed; the authorized
outside-sandbox launch succeeded. Reuse that approved host context; if approval
is missing, obtain it before launching. Do not retry a known network failure or
change the product. Only for changed, uncertain networking,
`curl --head --max-time 5 https://api.anthropic.com` diagnoses reachability without
authentication or model cost; no mandatory preflight.

Prepare a disposable `/tmp` case with selected sources, instructions and local
`plugin/`; exclude `.git`, secrets, external symlinks, later answers and unrelated
context. Record its hashes. Use absolute paths and a response-only prompt; keep
results and credentials outside the case. This Linux/first-party recipe copies
an existing valid credential file without displaying it. If absent/expired,
arrange authorized authentication separately; never write under `~/.claude/`.

```bash
CASE_DIR=/tmp/selected-headless-case       # prepared copy, including plugin/
PROMPT_FILE=/absolute/path/to/prompt.txt
RESULT_DIR=/tmp/selected-headless-result  # new directory, outside CASE_DIR
MODEL=opus                               # record the resolved model from result
HEADLESS_CREDENTIALS="$HOME/.claude/.credentials.json"  # read only
(
  set +x
  set -eu
  umask 077
  headless_config=$(mktemp -d /tmp/esq-headless-auth.XXXXXX)
  trap 'rm -rf -- "$headless_config"' EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  trap 'exit 129' HUP
  cp -- "$HEADLESS_CREDENTIALS" "$headless_config/.credentials.json"
  chmod 600 "$headless_config/.credentials.json"
  mkdir -m 700 -- "$RESULT_DIR"
  cd -- "$CASE_DIR"
  headless_start=$(date +%s)
  headless_rc=0
  env -u ANTHROPIC_API_KEY -u CLAUDE_CODE_OAUTH_TOKEN \
    CLAUDE_CONFIG_DIR="$headless_config" ESQ_TELEMETRY=off \
    timeout --signal=KILL 180s claude --plugin-dir "$CASE_DIR/plugin" -p \
      --model "$MODEL" --effort medium --output-format stream-json --verbose \
      --permission-mode dontAsk --restricted \
      --tools Read,Grep,Glob,Skill --allowedTools Read,Grep,Glob,Skill \
      --strict-mcp-config --setting-sources '' \
      --settings '{"disableAllHooks":true,"autoMemoryEnabled":false}' \
      --no-session-persistence --max-budget-usd 3 \
      < "$PROMPT_FILE" > "$RESULT_DIR/stream.jsonl" 2> "$RESULT_DIR/stderr.txt" \
      || headless_rc=$?
  printf 'exit=%s elapsed_seconds=%s\n' "$headless_rc" \
    "$(( $(date +%s) - headless_start ))" > "$RESULT_DIR/launcher.txt"
  exit "$headless_rc"
)
```

Use Bash and available GNU `timeout`, without `--foreground`: the whole process
group is killed at 180 s without grace. Keep the command attached to its host;
do not detach it. Use the first-party environment without alternate-provider
routing; the unset variables prevent an ambient key/token overriding the copy.

**Model:** `--tools` exposes Read/Grep/Glob/Skill; `--allowedTools` permits them
without prompts, while `dontAsk` denies remaining approval requests. No Bash,
write, agent or web tools. `--restricted` confines file tools to the case, excluding
authentication. MCP, hooks, memory and session persistence are disabled; managed
policy still applies. These are model-tool restrictions, not an OS sandbox for
the host. Host network access grants no additional model tool or blanket bypass.
[CLI reference](https://code.claude.com/docs/en/cli-reference),
[config isolation](https://code.claude.com/docs/en/settings).

Retain exit/elapsed time, final result, resolved model, tool denials, cost and
before/after hashes. No final cost means **unknown**, never zero; 3 USD is the
configured CLI cap, not a measured bill. No automatic retry. Sanitize evidence
before retaining it, then delete the case/raw results. The trap removes temporary
authentication even after timeout; host loss/SIGKILL requires manual removal of
the leftover `/tmp/esq-headless-auth.*` directory belonging to this run.

Historical proof: **130.49 s, 1.0563188 USD** reported at list price, **482 files
unchanged**; the earlier network timeout's cost remains unknown. This establishes
this read-only case, not output quality or build/write permissions. No new trial,
installation or publication: [B-050 checks and limits](preparation/2026-09-25-b050-headless.md).

