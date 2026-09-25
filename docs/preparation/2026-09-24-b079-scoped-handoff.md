# B-079 — Continue the entry being discussed

Date: 2026-09-24. Starting commit: `214072a`. Inline maintainer change;
no retrospective plan, model journey, subagent, installation or publication.

## Finding and change

The backlog scope and roadmap projection said status already offered a scoped
advance. Reading the actual rule 6 showed that both status and roadmap offered
only bare `/esq:advance`, gated by two Open items across Now. Advance itself
already resolves a slug or covered ID within Now and refuses a failed lookup
without widening it. That implementation is reused unchanged.

Both handoffs now use the entry discussed in the argument or conversation.
An eligible Now entry gets `/esq:advance <slug>`, including when it has only one
Open item. An explicit whole-Now request keeps the bare command; general queue
orientation still offers it when at least two Open items are known. Existing
blocker, parking, acceptance and plan routes remain effective. README describes
the same behavior. No resolver, CLI verb, shared mechanism or lexical test added.

## Semantic verification

This is a reading of the changed instructions against inputs and advance's
existing preflight, not an observed native model execution or end-to-end walk.

| Input | Expected | Observed in the instruction paths |
|---|---|---|
| Actual pre-change `esq state`: dependable-queue in Now, B-129 Done, B-079 Open; user discusses B-079 | Continue only that entry despite a single Open item | Roadmap's focused entry and status rule 6 resolve dependable-queue and offer `/esq:advance dependable-queue`; advance preflight selects exactly that Now entry, skips settled work and stops before build |
| Same input; user explicitly asks to walk all Now | Keep the global path | Both handoffs retain `/esq:advance`; advance preflight takes every Now entry in file order. With a second eligible Now entry, the targeted path still selects one and the bare path selects both, subject to existing dependencies/plans |
| Actual worktree-integrity in Next, B-005 Open; or an unknown target | No invalid targeted advance and no fallback to all Now | Outside-Now focus can offer work for B-005, never advance; unknown focus exposes the queue/refuses resolution. Advance's own failed lookup still stops before spending |

No eligible count is inferred from projected state text. `docs/plans/README.md`
is no-phases, so it does not preempt the status case with a build recommendation.
Global multi-entry behavior above is a semantic counterexample, not a second
runtime fixture. The product audit is run once, with a 180-second bound; its
Node suites are not run separately.

## Records and cost

B-184's roadmap text was Open despite its Done ledger row and existing merge
proof. Correct that projection using the recorded B-184 result, without rerunning
its historical verification separately. B-005 remains Open. Close B-079 through
the existing CLI after verification and move the now fully settled
dependable-queue entry to Shipped; no other entry is promoted or reordered.

Cost: two local handoff rules, retained inputs, no additional runtime read or
model call. No measured token/time saving or model compliance claim.

One `timeout --kill-after=5 180 ./scripts/audit.sh`: **7/7 PASS**, including
native plugin/marketplace validation and the bounded product suites. No separate
suite invocation or second audit. [Captured output](2026-09-24-b079-audit.txt).
Only ledger/projection/evidence bookkeeping followed this PASS. Final
`esq validate` returned `valid: true`, no findings; `git diff --check` passed.
