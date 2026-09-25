# B-107 — Repair an unrunnable obligation before recording its proof

Inline maintainer change, 2026-09-25, starting at clean `89dfb35` on `main`.
No runtime/schema change, subagent, user-project modification, merge, push,
installation or publication.

## Before / after

- Before: build could complete with an actual substitute in `verified.commands`,
  while land still owed the original command and prohibited substitution.
- After: build repairs the prospective command under the existing three-edit,
  distinct-cause budget. The criterion sentence, artifact/property, reads,
  Branch/Origin, phase identity and historical log remain intact. A dated
  amendment and execution evidence name the original command, actual command,
  diagnosis, criterion and amendment commit. Stage → capture tree → run once →
  judge → commit only on PASS → attribute to that same tree. Land keeps its
  exact-command rule; completed historical cases use the existing corrective
  route and append new proof.

The alternative of teaching land to accept equivalent substitutes was rejected:
its semantic and freshness contract would grow for a defect build can repair at
its source. Simply rejecting every recoverable typo would leave the known defect
for the next invocation. The unrelated phase-suite narrowing exception remains.

## Current reproduction, before any policy edit

A standalone script imported the actual `appendLog` and `gateVerify` exports,
created a disposable Git repository, executed the two commands below, recorded
what actually ran with a full commit, committed the log, and asked the gate.
It then removed its temporary repository. Bound: 30 seconds; exit 0.

| Field | Observed |
| --- | --- |
| Original command | `./scripts/missing-check src/report.txt` |
| Original criterion | `src/report.txt contains no TODO` |
| Actual replacement | `grep -n "TODO" src/report.txt` |
| Artifact | `ready` followed by newline |
| Original exit | 127 — script absent |
| Replacement exit/output | 1 / empty — criterion met |
| Recorded `verified.at` | `bcc156049979883a1f3b3add329dfb35c3a0cb76` (temporary repository) |
| Recorded commands | Only the actual replacement |
| Gate command | Original missing command |
| Gate decision | `run` |
| Gate reason | `Phase 1's green list does not name this command` |
| Gate `verifiedAt` | `null` |

This is a real CLI/proof-consumer reproduction, not a live model build or a
landing/merge. The historic mismatch is retained as fixture data in the second
new test; its missing command was not executed a second time.

## Focused verification and its limits

One execution, bounded at 60 seconds:

`timeout --kill-after=5 60 node --test --test-name-pattern='^B-107:' tests/cli/gate.test.mjs`

**3 tests passed, 0 failed; Node reported 851.383906 ms.**
[Exact output](2026-09-25-b107-tests.txt). It ran outside the sandbox, following
B-163/B-185's documented Node execution constraint. No other test suite or audit
was run. The three real-Git scenarios exercise:

1. A corrected build obligation, verification before commit, equality of tested
   and committed trees, full provenance and gate reuse. Changing the artifact
   invalidates that proof. A grep then returns matches at exit 0: the criterion
   is red, no new proof is submitted, and the gate still says `run`.
2. A historical substitute cannot prove the original command. Amending the
   prospective step preserves the historical log byte-for-byte and invalidates
   even the old block naming the now-correct command. The existing fix sequence
   runs once, appends through `recordVerification`, and land's gate reuses only
   the new full commit.
3. A bare missing command and an ambiguous `report is good` criterion stay
   unproved. The CLI refuses a completion without provenance, preserves the file
   and returns the full owed step. The fixture supplies no invented PASS.

Targeted semantic reading checked the author and consumer together:

| Case | Build / recording | Land |
| --- | --- | --- |
| Missing command, explicit artifact/property | Bounded prospective repair; unchanged criterion; new exact-tree proof only on PASS | Exact corrected command, reuse only if gate says so |
| Bare command, missing property or two plausible intentions | CAN'T RUN; no guessed amendment or proof; recovery asks only for missing user authority | Unverified stop; no substitute |
| Executable command disproves criterion | FAIL; repair actual defect, never replace the check to erase red | Stop on red, including exit 0 with forbidden matches |
| Old substitute, changed plan or changed input | Historical proof remains; no transfer to new command/tree | Existing exact identity and freshness return `run` |
| Repair budget exhausted / repeated cause | No further edit or completed entry | No newly manufactured PASS |

The tests execute a prescribed procedure and real CLI consumers. They do not
prove that a live model obeys prose, judges intent correctly or reports results
truthfully. Those judgments remain outside the CLI: `appendLog` accepts claimed
PASS commands and does not independently execute them. No universal semantic
safety claim or new model-journey evidence is made.

## Reused evidence and cost

- [B-163](2026-09-25-b163-auto-command.md): document paths remain unresolved,
  executable paths survive, and gate/recording/pause consumers retain unresolved
  obligations. Its 7/7 audit is historical evidence, not a new PASS for this tree.
- [B-185](2026-09-25-b185-command-whitespace.md): exact command strings, significant
  whitespace, proof recording and freshness are already covered. Its 7/7 audit
  is reused, not repeated. No parser or gate runtime changed here.

No general audit, release pass, lab run or duplicated B-163/B-185 verification was
bought. New work is one pre-change reproduction and three focused scenarios;
final bookkeeping earns only ledger validation and a diff check. The policy adds
one bounded amendment/commit for the defect, no schema, process, new reader or
mandatory agent in normal runs. It removes the durable missing-command halt;
it does not claim measured downstream token or time savings.

Final bookkeeping: `plugin/bin/esq validate` returned `valid: true`, no findings;
`git diff --check` passed. B-107 was closed through `esq backlog set-status`,
the roadmap entry was refreshed in place, and the superseded decision is retained
with its replacement citation. Product runtime files remain unchanged.
