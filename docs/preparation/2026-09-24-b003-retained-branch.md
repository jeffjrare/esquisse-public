# B-003 — Retained branches keep their ID witnesses

Date: 2026-09-24. Starting commit: `eb6fd5e`. Maintainer implementation,
not an independent review or a native model trial. User selected B-003;
B-005 remains separate. No installation, push or publication.

## Reproduction before editing

A temporary real Git repository with an empty backlog, using the repository's
unchanged `scripts/worktree.sh` and `addRow`:

1. `worktree.sh new retained`; add and commit “retained work”: `B-1000`.
2. `worktree.sh rm retained`: directory removed; script reports the branch
   **NOT merged into main — left in place**. Its ref still resolves.
3. `worktree.sh new next`; add “different work”: **`B-1000` again**.

Observed `duplicate: true`. This confirms the current defect, independently of
the historical report. The temporary repository and its worktrees were removed.

## Smallest complete change

Keep the existing allocator, lock, marker format and CLI result. While holding
the common-directory lock, include backlog IDs at local branch tips among the
occupied-block witnesses. Pin commit objects, then deduplicate backlog blobs.
Read failures refuse before writing a marker; a missing backlog is harmless.

The user can remove a worktree, keep its unfinished branch, and create another
without this sequence minting the same citation for different work. Reopening
the retained branch allocates a new block for future items; old IDs do not move.

All local branches count, including merged ones: ancestry does not prove that
the main checkout currently contains their backlog. This avoids a default-branch
dependency. No history traversal, remote read, persistent registry or migration.

Cost: only a new block reservation adds the scan. With T distinct local tips and
B distinct backlog blobs, it adds 1 + T + B Git calls and reads each blob once.
Existing-marker and main-checkout fast paths stay unchanged. Many branches can
lengthen the existing critical section; no runtime saving is claimed. IDs that
exist only in deleted history, tags, remote refs or discarded uncommitted files
are outside this witness scope. Existing collisions are not repaired.

Legitimate counterexample: remove a worktree that reserved a block but committed
no IDs. That block remains reusable, even when its retained branch has no backlog.
Persisting every reservation forever would prevent that useful behavior and add
state needing its own lifecycle.

## Verification and cost record

Three real-Git regressions added to `tests/cli/autonomy.test.mjs`:

- Actual script create/remove/reopen path: `B-1000`, then `B-2000`; reopening
  allocates `B-3000` without changing the retained commit. Both branches merge
  through the existing engine; both original IDs and summaries survive once.
- Unused reservation and absent branch backlog: block 1000 remains reusable.
- Unreadable retained backlog blob: allocation refuses, no marker is written,
  and the lock is released.

Existing main/live-worktree witnesses, concurrent reservations and inventory
refresh under contention are reused through the product suite. The merge case
does not prove B-005's marker-free, ancestor-present reconciliation scenario.

The first audit (180-second bound) returned 5/7, with bounded-runner and product
failures whose Node child diagnostics were missing. A direct autonomy diagnostic
returned 11 passes and two failures in child-process paths. A minimal process
probe then demonstrated empty `execFile` output and `spawnSync ... EPERM` in the
sandbox. [Original audit output](2026-09-24-b003-sandbox-audit.txt) is retained;
it is not a PASS. This justified a second audit outside the sandbox, under the
same bound, without changing product code or verification criteria.

That [first native audit](2026-09-24-b003-first-native-audit.txt) returned 6/7:
376/377 tests passed. The new scenario's allocation and both merges passed, but
its extra full-ledger validation failed. One focused diagnostic (30-second bound)
identified `duplicate backlog rank 100: B-2000 and B-1000`. This is the existing
interaction between independent tail-rank allocation and merging different rows,
not an ID collision and not a behavior changed by the branch witness scan.

Recorded separately as B-184. The B-003 regression keeps its ID, summary and merge
assertions and removes the unrelated full-ledger-validity claim. No rank is
rewritten, no row closed to hide it, and no rank defect is claimed fixed. B-005
also remains open. This test-scope correction earns a final product audit; no
additional standalone suite is planned.

Final `./scripts/audit.sh`, outside the sandbox and bounded to 180 seconds:
**7/7 PASS**, including the product suites and native package validation.
[Captured final output](2026-09-24-b003-final-audit.txt). No standalone Node suite
was run after this PASS. After bookkeeping, `esq validate` returned `valid: true`
with no findings, and `git diff --check` passed. The product proof is reused.
