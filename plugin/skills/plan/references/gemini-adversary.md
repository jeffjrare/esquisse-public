<!-- loaded-at: with references/adversary.md, only when `ESQ_GEMINI=on` -->
## Gemini invocation

The lifecycle, prompts, judging, record and failure line are `references/adversary.md`'s. This file holds only how
Gemini is called, through the Antigravity CLI `agy` that a Google AI subscription signs in to. `<refs>`, `<d>`, `<slug>`
and `<the prompt>` mean what they mean there. The record names the provider `gemini` and its model the `gemini-*` id the
call resolved (`$m` below). The report line is `Gemini:`.

**The model is always a Gemini one, so the provider stays a second family.** A set `ESQ_GEMINI_MODEL` is passed as
`--model` and must start with `gemini-`, else the call is refused. When it is unset, the model is the first `gemini-*` id
`agy models` lists (listing costs no quota), and the call is refused when there is none.

**Read-only, in three layers.** `agy` has no OS sandbox like `codex -s read-only`, so every call carries:
- `--mode plan`;
- `--settings "<refs>/agy-readonly.json"`, session-only settings beside this file whose `permissions.deny` closes
  `write_file(*)`, `command(*)`, `mcp(*)`, `read_url(*)` and `execute_url(*)`. In agy, deny beats ask beats allow and
  explicit rules win over the execution mode, so no `permissions.allow` the user keeps reopens a write or a shell. In
  headless mode an action that cannot be approved is soft-denied, never left waiting. Reads follow agy's own read
  permissions: the workspace by default;
- **a capability precondition in the same call, failing closed.** `agy` must be on `PATH`, and `agy --help` must list
  `--settings`, `--json-schema` and `--mode`. A failed condition, like a refused model, writes its reason to the `.err`
  file and the call never runs: it is skipped, never run with weaker permissions. `--dangerously-skip-permissions` is
  never passed.

`agy` takes its cwd as its workspace, so the call runs from the repository top level. The prompt goes in as the `-p`
argument, built from the heredoc into a variable. The schema goes through `--json-schema`, and `--output-format json`
wraps the answer in an envelope written to a `.part` file and renamed on exit 0, so a counter-plan still running is never
read half-written.

### The command

`<call>` is `counter` or `premortem`, `<schema>` its schema (`counter-plan.schema.json`, `premortem.schema.json`) and
`<bound>` its timeout (`900` for the background counter-plan, `570` for the foreground pre-mortem):

```bash
cd "$(git rev-parse --show-toplevel)" && d="$(git rev-parse --absolute-git-dir)/esq" && mkdir -p "$d" && rm -f "$d/gemini-<slug>-<call>".* && \
e="$d/gemini-<slug>-<call>.err" && \
{ command -v agy >/dev/null || { echo 'agy is not on PATH' >"$e"; false; }; } && \
h="$(agy --help 2>&1)" && \
{ printf '%s' "$h" | grep -q -- '--settings' || { echo 'agy --help lists no --settings' >"$e"; false; }; } && \
{ printf '%s' "$h" | grep -q -- '--json-schema' || { echo 'agy --help lists no --json-schema' >"$e"; false; }; } && \
{ printf '%s' "$h" | grep -q -- '--mode' || { echo 'agy --help lists no --mode' >"$e"; false; }; } && \
m="${ESQ_GEMINI_MODEL:-}" && \
{ case "$m" in gemini-*|'') true ;; *) echo "ESQ_GEMINI_MODEL=$m is not a gemini-* model" >"$e"; false ;; esac; } && \
{ [ -n "$m" ] || m="$(agy models 2>/dev/null | awk '/^gemini-/ { print $1; exit }')"; \
  [ -n "$m" ] || { echo 'agy models lists no gemini-* model' >"$e"; false; }; } && \
p="$(cat <<'PROMPT'
<the prompt>
PROMPT
)" && \
timeout <bound> agy -p "$p" --mode plan --settings "<refs>/agy-readonly.json" \
  --json-schema "<refs>/<schema>" --output-format json --model "$m" \
  >"$d/gemini-<slug>-<call>.json.part" 2>"$e" && \
mv "$d/gemini-<slug>-<call>.json.part" "$d/gemini-<slug>-<call>.json"
```

Its output is `<d>/gemini-<slug>-<call>.json`. When it is absent (the precondition failed, the model was refused, or the
call exited non-zero or timed out), the reason is the `.err` file's last line.

### Reading the answer

A soft-denied action still exits 0, so the exit code alone proves nothing. Read the envelope: its `status` must be
`SUCCESS` and its `structured_output` an object that matches the schema. Otherwise the line is
`Gemini: not run — <reason>`, and the reason is the envelope's `error.message` when there is one, else its `status`, else
the `.err` file's last line, else what did not parse. There is no repair call.
