# B-163 — A document reference is not an auto command

Starting commit: `774402f95b1b85393c00ec3370dd885dea977d05`, clean working tree.
Inline maintainer change, 2026-09-25. No plan, subagent, dependency, publication
or model trial. B-107 remains separate and Open.

## Before / after

Before editing, a direct call to the real `extractAutoCommand` returned:

| Single inline span after `(auto)` | Before | After (regression assertions) |
| --- | --- | --- |
| `docs/SPEC.md` | `docs/SPEC.md` | `null`, full step retained as unresolved |
| `./scripts/audit.sh` | `./scripts/audit.sh` | unchanged |
| `node scripts/check.mjs docs/SPEC.md` | same command | unchanged |

The exclusion recognizes only a whole-span `.md` path, optionally quoted.
Relative/absolute executable paths, arguments and compound commands remain
exact strings. This does not validate shell syntax, executable permissions,
file existence or every document format. No filesystem work was added to
extraction. A missing command remains unknown, not failed or passed.

## Consumers inspected

- `gateVerify` already retains each unresolved occurrence with its full text,
  plan and phase, `resolved: false` and `decision: run`. It neither deduplicates
  those occurrences nor reuses an old document-path proof. No change needed.
- `recordVerification` already refuses `command-unresolved` without writing;
  the corrected parser now routes a document-only step through that refusal.
- `appendLog` requires provenance only for resolvable commands. A paused
  document-only step can be recorded without inventing a `Verified` block and
  remains visible in the gate. Its existing support for reporting the commands
  actually run is unchanged; it does not validate execution claims or decide
  substitution policy.
- `resolveBlock` previously checked only resolved commands on confirmation.
  Source inspection exposed that an empty `owed` list could complete a pause
  despite unresolved steps. It now refuses both the read and confirmation paths
  with `command-unresolved`, retaining the full steps in `verify.unresolved`.
  Neither manual observations, a claimed document PASS nor unrelated green
  commands can complete that phase. Refusals preserve the file byte-for-byte.
- Build's two recovery references explain the refusal. Land keeps each full
  unresolved step visible and stops without a PASS when its action cannot be
  resolved; it must not execute the document path. Its no-substitution rule is
  unchanged. This does not resolve B-107's build/land acceptance disagreement.

## Verification and cost

Four focused tests were added to the existing product suites, with real Git
fixtures for consumers. They cover plain/quoted document paths, both auto
marker forms, executable paths, document arguments, compound commands and
`(reads)`; gate visibility under default/unit/phase scopes and historical bogus
proofs; recording refusal and an unverified pause; both blocked and manual
pause confirmations, including attempted unrelated/document proof and atomicity.
The pre-change pause bypass was diagnosed from source, not claimed as a
separately executed pre-change regression.

One `timeout --kill-after=5 180 ./scripts/audit.sh` passed **7/7** outside the
sandbox, including the new tests and native package validation. Prior session
Node failures in the sandbox justified this initial execution context. No
standalone Node suite or second audit was run. [Audit output](2026-09-25-b163-audit.txt).

Cost: one constant-size candidate check, one check of the gate result already
read by resolve-block, no new read, process, schema or verification framework.
The final ledger validation and diff check cover bookkeeping after the audit;
product sources did not change after its PASS. No model dialogue or measured
runtime/token saving is claimed.
