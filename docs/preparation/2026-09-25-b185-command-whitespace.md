# B-185 — Preserve significant whitespace in landing commands

Inline maintainer correction, 2026-09-25, starting at clean `3c4e044` on `main`.
One runtime expression changes: `listItems()` no longer collapses all whitespace.
Markdown bullet removal, outer trimming and continuation-line folding remain.
No proof normalization, dependency, subagent, installation or publication.

## Real case and consumers

Read-only source: `/home/jeffgirard/projects/events-tracker/docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.md`,
command at line 232 and recorded proof at line 295. Both contain `^  <`.
Source SHA-256: `e7eaf9757a173d25f3c8751d0bce8b2fbf668b10fe69bcd94cf2913f22898890`.
The old global replacement turns that into `^ <` before extraction. This diagnosis
comes from source inspection and the supplied confirmed failure, not a new command
execution in events-tracker.

`tests/cli/fixtures/landing-command-whitespace.md` retains verbatim excerpts of
all eight auto steps (including continuations) and their historical proof. The
fixture has no external dependency. Its commands are data and are never executed.

Consumer reading: `extractAutoCommand` already preserves internal whitespace;
`parseVerified` reads proof strings verbatim; `gateVerify` groups by exact string
and uses `block.commands.includes(command)` before checking tree freshness.
`appendLog` renders the supplied proof strings unchanged. `recordVerification`
attributes a proof by the complete folded step, then stores its extracted command.
These consumers require no changes. No freshness exception was widened.
`commandInputs` tokenizes for conservative input-scope analysis only; it does not
rewrite the command identity or the returned executable string.

Three new tests in the existing gate suite cover the eight real command/proof
pairs; significant spaces and tabs, both bullet forms, bare/code auto markers,
continued criteria and commands, blank/shallow-line termination and verification
scope; and real Git gate decisions in a disposable repository. The last fixture
records the original proof strings against local commits, checks reuse for all
eight commands, keeps the single-space variant separate and unproved, deduplicates
exact repeats across phases, and records a new exact double-space proof through
`recordVerification`. This tests the gate contract, not the external project's
current freshness or whether its application checks pass.

## Final audit and cost

One `/usr/bin/time -p timeout --kill-after=5 180 ./scripts/audit.sh` passed
**7/7 product checks, exit 0, in 26.61 seconds**, including all three new tests.
[Audit output](2026-09-25-b185-audit.txt). No standalone test suite or second audit
ran. The existing product suite retains its 120-second bound. Prior documented
sandbox Node failures (B-024/B-163) justified running this audit outside the
sandbox from the outset, avoiding a known failed duplicate. No release or lab
pass was selected. The version line describes committed history at `3c4e044`;
the uncommitted runtime correction was exercised by the product suite, and this
PASS does not claim the installed plugin contains it.

Observed: all eight extracted real commands equal their untouched historical
proof strings. In the disposable Git repository, all eight are reusable; the
single-space variant is a ninth command with `run` because its exact string is
absent from the proof. Each repeated grep has phases `[1, 2]` within its own group.
Recording the original double-space command by its exact step succeeds. Markdown
continuations, spaces and tabs pass their assertions. No external application
command, landing, merge or freshness gate ran in events-tracker.

Only result bookkeeping follows the audit, with ledger validation and a diff
check before the local commit; runtime code and tests remain as audited.

Runtime cost decreases by one global replacement per list item; no additional
read, subprocess or pass is introduced. No measured token/runtime saving is
claimed. The fix removes an unnecessary rerun caused by altered command identity;
actual stale proofs and genuinely distinct commands still require their own proof.
