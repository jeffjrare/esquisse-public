---
name: audit-scripts
description: How a check is built in this repo — read before editing scripts/audit.sh, adding or changing a check, or touching docs/CONFORMANCE.md. Covers the single `run` dispatch, the exit-code contract, what earns a check at all, and the three passes (default, --release, --lab).
---

# Audit scripts — esquisse

`scripts/audit.sh` keeps the skills, the CLI and the package coherent. Reasoning: `docs/ARCHITECTURE.md § scripts/audit.sh`.

## Rules

- **Every check goes through the one `run "<label>" <cmd…>` helper.** It executes the command, prints ✓ with its summary or ✗
  with its whole output, and propagates the exit code into the tally. There is no second dispatch shape, no per-check `if [ ! -x
  … ]` branch to keep in sync, and therefore nothing to statically analyse — *why:* B-144 was a hand-written dispatch table
  rendering a delegate's exit 2 as a yellow skip above a green `Clean`. One helper removes the class instead of policing it.
- **Exit contract: 0 clean with a summary line on stdout, 1 findings one per line, 2 the input is unusable.** An empty corpus
  exits 2, never 0 — *why:* "nothing to check" and "everything clean" print the same green line and mean opposite things.
  **`run` fails the pass on every non-zero code, exit 2 included.** A check the flags selected is not optional, so one that
  cannot read its own inputs has not answered; it is reported as `could not run: <its reason>` and reds the summary.
- **A verdict a check withholds on purpose is not an unusable input, and must exit 0.** `check-release-version.sh` is the case:
  off `main` its drift half gives no verdict while the agreement half — the load-bearing claim — has already run and passed, so
  it says so and exits 0. Reserve 2 for inputs the check genuinely cannot read.
- **A check earns its place by catching a defect the code or a test cannot.** Two kinds qualify: *a reference that must
  resolve* (a section link, a command name, a README row, a file a skill loads) and *a format the code parses* (the
  `append-log` schema, the `verified` block, `**Branch:**`/`**Origin:**`, the `⏸` glyph, `B-NNN`, the backlog status set).
  **A check that asserts a sentence is present, a paragraph is byte-identical across carriers, a number matches a count, or a
  command is spelled a certain way in prose, does not qualify** — those were removed on 2026-09-22 and are not to come back
  under another name. There is no check of a check, and no framework for adding them.
- **Behavior belongs in a test, not in a grep.** If the property is about what the code *does*, write a `node --test` case or a
  functional shell case; if it is about what a document *says*, it is `docs/AUDIT.md`'s reading pass.
- **One pass over the corpus (one awk, one node), not a process per comparison** — *why:* the check that polices cost may not be
  the expensive one (D-the-auditor-pays-its-own-cost-rule).
- **Three passes, and the flags add rather than re-buy.** Default = the product pass, node product suites included. `--release`
  = the packaging and release checks *in addition*, run when packaging or release changes. `--lab` = the research fixture suites
  *in addition*. Never run `node --test` beside the default pass on the same tree — it already ran them.
- **Node suites are discovered by convention, never listed by hand** — `tests/{cli,hooks,audit}/**/*.test.mjs` for the product
  pass, the lab directories for `--lab`. A list maintained by hand silently omits a suite (that is how
  `tests/cli/worktree-landing.test.mjs` went unrun).
- **A subprocess that can hang is never bare:** node suites run through `scripts/check-bounded.sh <bound> <label> -- <cmd>`, and
  a `claude plugin …` call carries an inline `timeout --kill-after=5 <bound>` mapping rc 124/137 to a finding. Bounds are
  literal positional arguments, never environment variables — a positional bound is what lets a test inject a hang at 1 s.
  Every non-interactive `claude plugin …` call runs `claude --bare … </dev/null` on its own spawn line: the flag skips a
  bootstrap these subprocesses never needed (180 s → 0.52 s) and the redirection is what makes them non-interactive in fact.
- **`audit.sh` never reads or writes the live `~/.claude`.** A check needing an installed tree builds it in a `mktemp` sandbox,
  and that check lives under `--release`.
- **Token-spending scripts are never reachable from the default pass.** `probe-model-pins.mjs`, `smoke-work-capture.mjs` and
  `smoke-journeys.mjs` bill on purpose; their free `--parse` halves are covered by the `--lab` suites, which stub `claude` first
  on `PATH` and assert it was never spawned.
- **`docs/CONFORMANCE.md` holds the tokens a skill template WRITES and a conserved reader PARSES**, and `check-conformance.sh`
  evaluates it. That is the one defect class the `node --test` suites cannot reach: they prove the parser reads the shape, never
  that the template still writes it. **A clause pins the token, never the sentence around it** — a placeholder's explanation, a
  rule's wording and the order of two sentences are prose, and a correct rewrite of any of them must not be a finding. Where the
  parser itself routes on a marker and treats the rest as free (the `⏸` glyph, whose clause `markdown.mjs` says outright is
  prose), the clause pins the marker alone; two clauses over one marker is one clause written twice.
- **A release is not a regression.** `check-release-version.sh` still reports `releaseNeeded` — `update.sh` and
  `release-local.sh` read it to decide whether to publish — but "plugin/ has moved since the last bump" exits 0 as a state, not
  1 as a finding. Only a manifest disagreement or an unreadable version is a finding.

## See also
`docs/ARCHITECTURE.md § scripts/audit.sh`, `docs/AUDIT.md` (the reading pass), `scripts/audit.sh`'s own header for the `run`
contract.
