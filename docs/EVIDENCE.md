# Harness evidence registry

Every claim this repository makes about how Claude Code behaves rests on a **measurement** — a billed
capture, taken on one version, on one day. This file is the registry of those measurements. `esq
evidence` is its only reader; it compares each claim's current measurement against the Claude Code
actually installed and reports `fresh`, `stale`, `never-measured` or `unknown`. Nothing here is
computed: every cell is written by hand when a measurement is taken, and the CLI does arithmetic on it,
never judgment.

**The registry is append-only.**

- **Immutability.** A `M-<slug>` is never renumbered, reused or repointed. The row it names is the
  permanent record of one run on one version. No row and no capture is ever deleted or edited in place
  — the sole edit any activation makes to an existing row is flipping its `State` from `current` to
  `superseded`.
- **Selection.** A claim's current measurement is **the single row whose `State` is `current`** — not
  the newest `Measured` date, not the last line in the table. Zero such rows for a claim, or two, is
  ambiguity and reads as `unknown`. Never as a guess.
- **Activation.** A new measurement is an **appended row** carrying `State: current`, and the same
  commit flips the previous `current` row for that claim to `superseded`. A capture written but never
  registered leaves its claim exactly as stale as it was; `esq evidence` lists any file under
  `docs/evidence/` that no row names, so that gap is visible rather than silent.

**What the columns mean.** `Claim` is what the measurement is evidence *of*, and one claim may
accumulate many measurements over time. `Governs` retains the historical classification
(`model-routing`) for compatibility with recorded measurements. Since 2026-09-22 no evidence
reading gates a product command or worker spawn: all verdicts are informational. The historical
rows below remain unchanged; they do not authorize reinstating the retired model preflight.
`Capture` is a repo-relative path to the records themselves, and **every row whose `State` is anything
other than `never-measured` names one**: a measured row with an empty cell is a finding, and it leaves
its claim `unknown`, because a `Version` cell is worth exactly the artifact underneath it. That cell must
equal the version those records recorded for themselves. For a **billed** measurement the capture is the
harness's own sanitized output, written by the script named under `Refreshed by`. For a **manual**
measurement — one a person takes by hand in a live session, which no harness can produce — it is the
small JSONL that session writes under `docs/evidence/` from what it observed: one record per reading,
carrying the Claude Code version, what was run, the observed result and the verdict, and nothing that
identifies the session. README § Model recommendations — the interactive pin protocol is the worked
example, and its last step writes the capture and appends the row in one commit. `Refreshed by` is the
exact command or documented protocol that produces a replacement — billed or hand-run, bounded, and
only ever run because a person typed it.

| Measurement | Claim | Governs | Capture | Version | Measured | Refreshed by | State |
|---|---|---|---|---|---|---|---|
| M-agent-model-2026-08-19 | E-model-routing | model-routing | tests/probe/fixtures/capture.jsonl | 2.1.235 | 2026-08-19 | `node scripts/probe-model-pins.mjs --only agent-model --out docs/evidence/<date>-agent-model.jsonl` | current |
| M-work-capture-2026-08-21 | E-work-capture | — | tests/smoke/fixtures/capture.jsonl | 2.1.238 | 2026-08-21 | `node scripts/smoke-work-capture.mjs --out docs/evidence/<date>-work-capture.jsonl` | current |
| M-journeys-2026-08-30 | E-orchestration-journeys | — | tests/journeys/fixtures/capture.jsonl | 2.1.251 | 2026-08-30 | `node scripts/smoke-journeys.mjs --out docs/evidence/<date>-journeys.jsonl` | current |
| M-interactive-pin-pending | E-interactive-pin | — | — | — | — | README § Model recommendations — the interactive pin protocol (one manual session) | never-measured |
| M-session-id-env-pending | E-session-id-env | — | — | — | — | README § Model recommendations — the session id protocol (one manual session) | never-measured |
| M-session-id-env-2026-09-06 | E-session-id-env | — | docs/evidence/2026-09-06-session-id-env.jsonl | 2.1.263 | 2026-09-06 | README § Model recommendations — the session id protocol (one manual session) | current |
| M-background-lifecycle-2026-09-08 | E-background-lifecycle | — | docs/evidence/2026-09-08-background-lifecycle.jsonl | 2.1.265 | 2026-09-08 | `node scripts/probe-background-lifecycle.mjs --out docs/evidence/<date>-background-lifecycle.jsonl` | current |

**E-session-id-env has one reading, and it covers the main session alone (`M-session-id-env-2026-09-06`).** B-121 names the
session's own `CLAUDE_CODE_SESSION_ID` as the key the declaration log is filed under, and the question that
reading answers is whether the variable a command actually sees in its environment is the id the harness
records for that session — a question only a live session can put, since no headless capture can compare a
running session against its own transcript. On 2026-09-06, on Claude Code 2.1.263, one session ran the protocol
README documents: the transcript's own `version` was checked against the installed one first, and the
variable read **present-and-matching** against that transcript's `sessionId`. The capture carries one record,
`where: main-session`; step 4's further readings — from a subagent and from a `Stop` hook — were not taken, so
the row says what it measured and implies nothing about the rest. `M-session-id-env-pending` stays exactly
as it is at `State: never-measured`, with no capture and no version: it is the placeholder the protocol was
written against, activation only ever flips a row that is `current`, and selection reads `current` rows
only. The claim governs nothing in either state, so neither the reading nor the readings still missing move
any relay; every failure mode of a missing or wrong id degrades a segment to *no identity*, never to a
wrong one, which is why the mechanism shipped ahead of its measurement.

**E-interactive-pin has never been measured.** B-047 asks whether a skill's `model:` pin bites when the
command is *typed* into a running interactive session — a question no headless capture can answer, so it
has no capture and no version. It stays `never-measured` until someone runs the protocol README
documents and appends a row; because it governs nothing, that gap stops no relay and reds no check.
