<!-- loaded-at: with references/adversary.md, only when `ESQ_CODEX=on` -->
## Codex invocation

The lifecycle, prompts, judging, record and failure line are `references/adversary.md`'s; this file holds only how
Codex is called. `<refs>`, `<d>`, `<slug>` and `<the prompt>` mean what they mean there. The model and effort flags
pass nothing when unset, and `~/.codex/config.toml` applies:

```bash
${ESQ_CODEX_MODEL:+-m "$ESQ_CODEX_MODEL"} ${ESQ_CODEX_EFFORT:+-c model_reasoning_effort="$ESQ_CODEX_EFFORT"}
```

Both run `-s read-only` from the repository root, `--ephemeral`, the prompt on stdin (`-`), stdout discarded and
stderr to a file under `<d>`. The record names the provider `codex` and its model `ESQ_CODEX_MODEL`; the report line is `Codex:`.

### Counter-plan

```bash
d="$(git rev-parse --absolute-git-dir)/esq" && mkdir -p "$d" && rm -f "$d/codex-<slug>-counter.json" && \
timeout 900 codex exec -s read-only -C "$(git rev-parse --show-toplevel)" --ephemeral <flags> \
  --output-schema "<refs>/counter-plan.schema.json" -o "$d/codex-<slug>-counter.json" - \
  >/dev/null 2>"$d/codex-<slug>-counter.err" <<'PROMPT'
<the prompt>
PROMPT
```

Its output is `<d>/codex-<slug>-counter.json`.

### Pre-mortem

```bash
d="$(git rev-parse --absolute-git-dir)/esq" && mkdir -p "$d" && \
timeout 570 codex exec -s read-only -C "$(git rev-parse --show-toplevel)" --ephemeral <flags> \
  --output-schema "<refs>/premortem.schema.json" -o "$d/codex-<slug>-premortem.json" - \
  >/dev/null 2>"$d/codex-<slug>-premortem.err" <<'PROMPT'
<the prompt>
PROMPT
```

Its output is `<d>/codex-<slug>-premortem.json`.
