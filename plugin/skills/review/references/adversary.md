<!-- loaded-at: preflight step 8, only when a provider's gate printed `on` and its filtered diff is sendable -->
## A blind review from another model family

Loaded with `${CLAUDE_SKILL_DIR}/../plan/references/adversary.md` (the gate rule, the shared shape of every call,
*Untrusted data*, § 4's block format and § 5's failure line) and the invocation reference of each provider whose gate
printed `on` and whose call goes out (`${CLAUDE_SKILL_DIR}/../plan/references/codex-adversary.md`,
`${CLAUDE_SKILL_DIR}/../plan/references/gemini-adversary.md`). This file replaces that file's § 1–3 for `/esq:review`.

### What is sent, and when nothing is

The provider reads the delta `esq review adversary-diff <base> <head>` answered, over the scope's own `base` and `head`.
Claude's own review keeps reading the unfiltered `diff`; this one only narrows what goes out. Each provider is judged
against its own cap, in this order, and the first that holds is its line:

| Condition | Line |
|---|---|
| mode `unresolved`, or no `base` | `<Provider>: not run — no resolved range` |
| `atHead: false` | `<Provider>: not run — range head is not the checkout` |
| `bytes: 0` | `<Provider>: not run — nothing reviewable after filtering` |
| `fits.<provider>: false` | `<Provider>: not run — diff too large (<n> KB filtered, cap <c> KB)` |

`<n>` is `bytes` and `<c>` the provider's `limits` value, each ÷ 1000 and rounded up. A provider with a not-run line loads
nothing and launches nothing. A `bookkeepingOnly: true` scope opens no file, so it calls nothing and records nothing.

### The call

One call per sendable provider, **in the background** (`run_in_background: true`), launched in the same response as the
target line. With both gates on and both sendable, both go out in that response and run at the same time. Its parameters:

| `<call>` | `<schema>` | `<bound>` | `<effort>` | `<slug>` |
|---|---|---|---|---|
| `review` | `review-findings.schema.json` | `300` | `medium` | `review-<the plan slug, or the range head's short hash>` |

`<refs>` is `${CLAUDE_SKILL_DIR}/../plan/references`. The attached file is the answer's `file`, through each invocation
reference's attached-file form. Gemini takes no effort flag: its effort is the model `ESQ_GEMINI_MODEL` names, and a
`-high` variant that overruns the 5 minutes is recorded `not returned`.

The prompt, in the product's working language, names both full commit IDs (`base`, `head`) and asks only for defects
the attached diff introduces inside that range, checked against the repository as it is at `head`. It states that the
diff leaves out fixtures, snapshots, lockfiles, generated output and historical docs, so their absence is no finding. It
asks for **at most 8** defects, each naming who hits it, under which input or condition, and what goes wrong: `where` a
`file:line` in the range, `failure` that sentence, `evidence` the `file:line` or hunk that shows it, `fix` the change.
Style, naming, layout and preference are excluded. It never carries Claude's findings, the plan or its brief: the call
is blind.

### Merge, just before *Report*

Claude's own findings are drafted first, privately, before any provider answer is opened, so `new` is judged against
something that already exists. A completion notice that arrives earlier only says the answer is ready.

Then read each provider's answer **only if its output exists and parses** (Gemini: the envelope's `structured_output`,
per its invocation reference). One that has not returned is stopped now (`TaskStop` on its background task; its
`timeout` bounds it otherwise) and recorded `not returned`, so no run under `/esq:converge` leaves a call spending.
Nothing waits for it.

Each provider's first 8 findings are judged; the rest are ignored. Each one is checked against the code at `head` and
goes through **The bar** and the tiers exactly as Claude's own: accepted, it takes its tier (🟢, 🟡, 🔴, or a backlog row
when it is about code outside this change) and is credited `new` when Claude's draft lacked it, `had` when it merges into
one Claude already had; rejected, it gets a one-clause reason (below the bar, not in the range, contradicted by
`<file:line>`). Two providers' findings that name the same defect are reported once and credited to both. The report,
the brief and their wording stay Claude's.

### Record

One § 4 block per provider whose gate printed `on`, a not-run one included, so a later count of opted-in runs has its
denominator:

```
Adversary (<provider> <its model variable's value, or "config">):
review: <a>/<j> accepted (<u> new) | not run — <reason> | not returned
F1 accepted new|had <🟢|🟡|🔴|backlog> — <one clause>
F2 rejected — <one clause>
…
```

The blocks are the tail commit's second `-m` (the `brief(fixes): …` or `plan(reviewed): …` commit), never the brief, so
`/esq:fix` pays nothing to read rejected findings. A review that makes no tail commit (a clean plan-less review, or a
clean plan review whose field was already current with no backlog rows) writes them to
`<git-dir>/esq/adversary-review-<head short hash>.md` instead.

Zone 3 gains one line per such provider: `○ Codex  <a>/<j> accepted (<u> new)`, `○ Codex  not returned`, or
`○ Codex  not run — <reason>` (`Gemini` likewise).
