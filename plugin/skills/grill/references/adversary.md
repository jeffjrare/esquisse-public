<!-- loaded-at: preflight step 8, only when a provider's gate printed `on` -->
## A blind assumption pass from another model family

Loaded with `${CLAUDE_SKILL_DIR}/../plan/references/adversary.md` (the gate rule, *Providers*, *The script*,
*Untrusted data*, § 4's block format and § 5's failure line). This file replaces that file's § 1–3 for `/esq:grill`.

### The call

One call per provider, **in the background** (`run_in_background: true`), launched in the same response as the target
line; with both gates on, both go out in that response and run at the same time. Its parameters:

| `<call>` | `<schema>` | `<bound>` | `<effort>` | `<slug>` |
|---|---|---|---|---|
| `probe` | `grill-probe.schema.json` | `300` | `medium` | `grill-<the brief's slug>` |

`<refs>` is `${CLAUDE_SKILL_DIR}/../plan/references`, and each call is
`node "<refs>/adversary.mjs" launch <provider> <slug> probe grill-probe.schema.json 300 --effort medium` with the prompt
on stdin and no file attached.

The prompt, in the product's working language, is the user's task text verbatim, then the instruction: read this
repository and name **at most 8** hidden assumptions, edge cases or contradictions with the code that would change what
gets built. Each has `kind` (`assumption`, `edge-case` or `contradiction`), `claim` the point in one sentence, `evidence`
the `file:line` that shows it, and `question` the one question it would put to whoever owns the answer. It states that
the provider must not read `docs/plans/<today>-<slug>*`. It never carries Claude's questions, rounds or draft brief: the
call is blind.

### Merge, at the first point the grill holds anyway

Claude's own question set for the round is drafted first, privately, before any provider answer is opened, so `new` is
judged against something that already exists. A completion notice that arrives earlier only says the answer is ready.

The merge point is the first that exists: **before round 1** when the answer has returned by then; else **before the
next round** that is held anyway; else **before the brief is written**. `read` each provider (*The script* in
`${CLAUDE_SKILL_DIR}/../plan/references/adversary.md`); only an `ok` answer is judged. One still `running` at brief time is waited for then
with `wait`, never more than its bound since launch. No round is held to give
it time.

Each provider's first 8 findings are judged; the rest are ignored. Each is checked against the code it cites, and one
that does not hold is rejected with a one-clause reason (contradicted by `<file:line>`, already settled by the task, not a
change to what gets built). An accepted one is sorted under *Whose question is it*, exactly as Claude's own:

- **settled by the repo** → a `## Resolved decisions` line, `<decision>: <answer> — inferred from <file>, raised by
  <Provider>`;
- **a planning matter** (approach, architecture, phasing) → a `## Deferred to planning` line;
- **a genuinely missing authority** → a question, in one of that round's ≤4 slots, under the same bar as any question.

A finding opens a round of its own only when it names a missing authority; otherwise it never adds a round. Each
accepted one is credited `new` when Claude's draft lacked it, `had` when it merges into one Claude already had. Two
providers' findings that name the same point land once and are credited to both. The brief and its wording stay Claude's.

### Record

One § 4 block per provider whose gate printed `on`:

```
Adversary (<provider> <the model `read` named>):
probe: <a>/<j> accepted (<u> new) | not run — <reason> | not returned
F1 accepted new|had <resolved|deferred|asked> — <one clause>
F2 rejected — <one clause>
…
```

The blocks are the brief commit's second `-m`, never the brief, so `/esq:plan` pays nothing to read rejected findings.
The report's elapsed line is preceded by one line per such provider: `Codex: <a>/<j> accepted (<u> new)`,
`Codex: not returned`, or `Codex: not run — <reason>` (`Gemini:` likewise); a count line is followed by its block's `F<n>`
lines, indented two spaces.
