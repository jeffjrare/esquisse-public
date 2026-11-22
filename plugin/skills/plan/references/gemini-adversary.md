<!-- loaded-at: with references/adversary.md, only when `ESQ_GEMINI=on` -->
## Gemini invocation

The lifecycle, prompts, judging, record and failure line are `references/adversary.md`'s; this file holds only how
the local `gemini` CLI is called. `<refs>`, `<d>`, `<slug>` and `<the prompt>` mean what they mean there. The record
names the provider `gemini` and its model `ESQ_GEMINI_MODEL`; the report line is `Gemini:`. The model flag passes nothing
when unset, and Gemini's own settings apply; the Gemini CLI documents no reasoning-effort flag, so there is none.

**Read-only, in three layers.** Gemini has no OS sandbox like `codex -s read-only`, so every call carries:
- `--approval-mode plan`, so the model has no write tool by default;
- `--admin-policy "<refs>/gemini-readonly.toml"`, the admin-tier allowlist beside this file: only the repository read
  tools are allowed, and everything else is denied, the shell, writes, leaving plan mode, the web and MCP tools included;
- **a capability precondition in the same call, failing closed.** `gemini` must be on `PATH`, `gemini --help` must list
  both `--admin-policy` and `plan`, and the platform's system policy directory (`/etc/gemini-cli/policies` on Linux,
  `/Library/Application Support/GeminiCli/policies` on macOS) must hold no `*.toml`, because supplemental admin
  policies are ignored when it does. A failed condition writes its reason to the `.err` file and the call never runs:
  it is skipped, never run with weaker permissions.

Gemini has no output-schema flag, so the schema goes to it as text: the prompt and the schema file are piped together
on stdin, and `-p` carries one instruction line. `-o json` wraps the answer in a `{response, stats, error?}` envelope,
written to a `.part` file and renamed on exit 0, so a counter-plan still running is never read half-written.

### The command

`<call>` is `counter` or `premortem`, `<schema>` its schema (`counter-plan.schema.json`, `premortem.schema.json`) and
`<bound>` its timeout (`900` for the background counter-plan, `570` for the foreground pre-mortem):

```bash
d="$(git rev-parse --absolute-git-dir)/esq" && mkdir -p "$d" && rm -f "$d/gemini-<slug>-<call>".* && \
e="$d/gemini-<slug>-<call>.err" && \
{ command -v gemini >/dev/null || { echo 'gemini is not on PATH' >"$e"; false; }; } && \
h="$(gemini --help 2>&1)" && \
{ printf '%s' "$h" | grep -q -- '--admin-policy' || { echo 'gemini --help lists no --admin-policy' >"$e"; false; }; } && \
{ printf '%s' "$h" | grep -qw 'plan' || { echo 'gemini --help lists no plan approval mode' >"$e"; false; }; } && \
{ ! ls /etc/gemini-cli/policies/*.toml "/Library/Application Support/GeminiCli/policies/"*.toml >/dev/null 2>&1 \
  || { echo 'a system policy *.toml exists, so --admin-policy would be ignored' >"$e"; false; }; } && \
{ cat <<'PROMPT'
<the prompt>
PROMPT
cat "<refs>/<schema>"; } | timeout <bound> gemini --approval-mode plan --admin-policy "<refs>/gemini-readonly.toml" \
  ${ESQ_GEMINI_MODEL:+-m "$ESQ_GEMINI_MODEL"} -o json \
  -p 'Do the task on stdin. Answer with one JSON object, and nothing else, that validates against the JSON schema at the end of stdin.' \
  >"$d/gemini-<slug>-<call>.json.part" 2>"$e" && \
mv "$d/gemini-<slug>-<call>.json.part" "$d/gemini-<slug>-<call>.json"
```

Its output is `<d>/gemini-<slug>-<call>.json`. Absent (the precondition failed, the call exited non-zero or timed out),
its reason is the `.err` file's last line.

### Reading the answer

Read the envelope's `response` and parse it as the schema's object, after stripping one surrounding Markdown code fence
if there is one. An envelope that is not JSON, an `error` field, or a `response` that is absent, not JSON or does not
match the schema gives `Gemini: not run — <reason>`, the reason taken from `error.message` when there is one, else the
`.err` file's last line, else what did not parse. There is no repair call.
