<!-- loaded-at: preflight step 4, generate mode only, only when a provider's gate printed `on` -->
## A blind slate from another model family

Loaded with `${CLAUDE_SKILL_DIR}/../plan/references/adversary.md` (the gate rule, *Providers*, *The script*,
*Untrusted data*, § 4's block format and § 5's failure line). This file replaces that file's § 1–3 for `/esq:ideas`.
`capture` mode never loads it.

### The call

One call per provider, **in the background** (`run_in_background: true`), launched in the same response as the target
line; with both gates on, both go out in that response and run at the same time. Its parameters:

| `<call>` | `<schema>` | `<bound>` | `<effort>` | `<slug>` |
|---|---|---|---|---|
| `slate` | `idea-slate.schema.json` | `900` | none: the user's `ESQ_CODEX_EFFORT` applies | `ideas-<the slate's focus slug, or whole>` |

`<refs>` is `${CLAUDE_SKILL_DIR}/../plan/references`, and each call is
`node "<refs>/adversary.mjs" launch <provider> <slug> slate idea-slate.schema.json 900` with the prompt on stdin, no
`--effort` and no file attached.

The prompt, in the product's working language, carries: the focus (or "the whole product"), the axes this run covers
with their weights (features heaviest, then adjustments, content, container; a narrowed run names its one axis), and
the four cuts. **Grounding is the first:** each idea's `signal` names a path, a route, a spec section or a backlog or
decision ID the provider actually read in this repository, and an idea it cannot ground is left out. It asks for **at
most 10** ideas, each a user value in the user's terms, never generic ("add dark mode", "add AI"), each the smallest
valuable slice. It names the `docs/BACKLOG.md` rows and `docs/DECISIONS.md` entries an idea must not repeat. It never
carries Claude's candidates or slate: the call is blind.

### Merge, at *Generate, then cut*

Claude's own candidate pool is written first, privately, before any provider answer is opened, so `new` is judged
against something that already exists. A completion notice that arrives earlier only says the answer is ready.

Then `read` each provider (*The script* in `${CLAUDE_SKILL_DIR}/../plan/references/adversary.md`); only an `ok` answer is judged. One still
`running` is waited for now with `wait`: the pool is written, so the wait is only the provider's remaining
time, never more than its bound since launch.

Each provider's first 10 ideas join the candidate pool **before** the cut and go through the same four cuts as
Claude's own. A `signal` naming a path that does not exist (checked with one `git ls-files`/`test -e` call for all of
them) is cut as ungrounded. An idea that duplicates one of Claude's merges into it and is credited `had`; one Claude
lacked and that survives is credited `new`. Two providers' ideas that duplicate each other merge once, and both are
credited. The slate's caps, order and wording stay Claude's.

### Record

The slate file ends with an `## Adversary` section holding one § 4 block per provider whose gate printed `on`:

```
Adversary (<provider> <the model `read` named>):
slate: <k> of <n> kept (<u> new) | not run — <reason> | not returned
I1 kept new|had → #<slate number> — <the provider's title>
I2 cut <ungrounded|already in the backlog|decided against|not valuable|duplicate> — <the provider's title>
…
```

Zone 3 gains one line per such provider: `○ Codex  <k> of <n> kept (<u> new)`, or `○ Codex  not run — <reason>`
(`Gemini` likewise).
