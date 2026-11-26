<!-- loaded-at: with references/adversary.md, only when `ESQ_CODEX=on` -->
## Codex invocation

The lifecycle, prompts, judging, record and failure line are `references/adversary.md`'s, or the calling command's own
lifecycle reference; this file holds only how Codex is called. `<refs>`, `<d>`, `<slug>` and `<the prompt>` mean what
they mean there. The model and effort flags pass nothing when unset, and `~/.codex/config.toml` applies:

```bash
${ESQ_CODEX_MODEL:+-m "$ESQ_CODEX_MODEL"} ${ESQ_CODEX_EFFORT:+-c model_reasoning_effort="$ESQ_CODEX_EFFORT"}
```

When the calling lifecycle names an `<effort>`, the effort flag is `-c model_reasoning_effort="<effort>"` instead, and
`ESQ_CODEX_EFFORT` is not read; the model flag is unchanged.

Every call runs `-s read-only` from the repository root, `--ephemeral`, the prompt on stdin (`-`), stdout discarded and
stderr to a file under `<d>`. The record names the provider `codex` and its model `ESQ_CODEX_MODEL`; the report line is `Codex:`.

### The command

The calling lifecycle names `<call>`, its `<schema>` (a file beside this one) and its `<bound>` in seconds. `/esq:plan`'s
two calls are:

| `<call>` | `<schema>` | `<bound>` | Where it runs |
|---|---|---|---|
| `counter` | `counter-plan.schema.json` | `900` | background |
| `premortem` | `premortem.schema.json` | `570` | foreground |

```bash
d="$(git rev-parse --absolute-git-dir)/esq" && mkdir -p "$d" && rm -f "$d/codex-<slug>-<call>.json" && \
timeout <bound> codex exec -s read-only -C "$(git rev-parse --show-toplevel)" --ephemeral <flags> \
  --output-schema "<refs>/<schema>" -o "$d/codex-<slug>-<call>.json" - \
  >/dev/null 2>"$d/codex-<slug>-<call>.err" <<'PROMPT'
<the prompt>
PROMPT
```

Its output is `<d>/codex-<slug>-<call>.json`.

**A prompt with an attached file.** When the lifecycle attaches a file, stdin is the heredoc followed by that file, and
the same command reads it from a group instead of the heredoc:

```bash
d="$(git rev-parse --absolute-git-dir)/esq" && mkdir -p "$d" && rm -f "$d/codex-<slug>-<call>.json" && \
{ cat <<'PROMPT'
<the prompt>
PROMPT
cat "<file>"; } | \
timeout <bound> codex exec -s read-only -C "$(git rev-parse --show-toplevel)" --ephemeral <flags> \
  --output-schema "<refs>/<schema>" -o "$d/codex-<slug>-<call>.json" - \
  >/dev/null 2>"$d/codex-<slug>-<call>.err"
```

The provider is never pointed at the path instead: it may lie outside the workspace it reads.
