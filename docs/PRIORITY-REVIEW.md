# ESQ priority review — 2026-09-23

## Purpose and basis

Reassess the public snapshot before choosing the next implementation. The objective is useful work shipped quickly, with fewer unnecessary user interruptions, reliable verification and design quality. This is a proposal, not a backlog disposition or a replacement for ROADMAP.md.

Reviewed all 47 Open/Planned table rows, the roadmap and autonomy epic, and selected implementation, skill and test paths. Deep inspection was concentrated on the leading candidates and claims contradicted by the current tree. This was not 47 runtime reproductions. Historical private plans are intentionally absent from the public snapshot; their absence does not prove work shipped or failed.

## Findings that change the order

1. **B-180 is reproducible against current code.** In an isolated synthetic Git repository, a completed phase runs `node check.mjs`, declaring both the script and `docs/plans/input.md` as inputs. The check passes; its full commit is recorded through `appendLog`. A later commit changes only the input from good to broken. `gateVerify` returns `reuse`, although executing the same command now exits 1. The lifecycle exemption in `plugin/lib/cli.mjs` precedes declared-input evaluation. This can conceal a failed check; it deserves the first implementation slot.
2. **B-179's conflicting routes remain.** `fix/SKILL.md` forbids editing plan bodies; `plan/SKILL.md` refuses another plan at exhausted corrective depth; `setAbandoned` rejects a completed plan. That last refusal was reproduced on the synthetic completed plan. These facts support the reported dead end, but no live model journey was run. Acceptance should prove a supported correction/disposition and landing without a new correction generation or rewriting historical verification.
3. **The roadmap's Now is stale.** It says the standards referent does not exist. `plugin/standards/STANDARDS.md`, `esq standards`, its tests and consumers exist. B-169 is an umbrella with remaining work; existence of standards does not close the epic. Preserve the user's A/D → B → C order while stating what remains.
4. **B-085/B-087 cannot be treated as wholly unimplemented.** Build already prescribes a bounded collection, process-group cleanup, and no revival from a delayed killed notification. Verify the remaining behavioral acceptance before closing or commissioning more work. Old cost measurements are historical evidence, not current savings estimates.
5. **B-129 remains a real contract ambiguity, but is not the first defect.** Roadmap refresh permits a done rollup from complete covered plans; status and sweep already require the whole outcome before closure. Its current evidence supports a misleading projection/handoff risk, not a demonstrated automatic false backlog closure.
6. **The queue omits recent problems from its ordering.** B-179/B-180 have blank ranks. `addRow` explicitly writes a blank Rank (B-172). Older prose-guard tasks dominate the roadmap despite the current policy against policing prose.

## Proposed order

### First: reconcile the planning documents

- Resolve obsolete scopes and verify delivered outcomes; use `esq backlog set-status` with a reason/evidence for each disposition. Do not bulk-close on age or missing historical files.
- Refresh B-169 and its epic to distinguish delivered standards from remaining specialist guidance. Do not silently reverse the user's recorded ordering.
- Replace the inherited roadmap narrative with current outcomes, acceptance and actual dependencies. `Planned` against an omitted historical plan is not evidence of active execution in this checkout.
- Rank every remaining active row through the CLI. Separate research and parked integration work from the execution queue.
- Keep SPEC, ARCHITECTURE and DECISIONS generic to ESQ. Preserve historical authority where useful; mark obsolete assertions rather than inventing new delivery evidence.

### Now: a trustworthy correction-to-landing path

1. B-180: input changes must invalidate verification, including declared plan/ledger inputs; retain reuse for bookkeeping that does not change a command's inputs.
2. B-179, within B-169: a bounded corrective loop needs a usable exit for a safe plan/document correction. Exercise fix → review → land and preserve historical proof.

These are separate changes with separate acceptance. Do not turn this into a redesign of the entire assurance system.

### Next: finish the autonomy outcome and make the queue dependable

- B-169 remainder: identify a concrete unmet specialist need before introducing a generic role framework. Existing standards are a starting point, not another feature to rebuild.
- B-129/B-079/B-172: truthful completion, scoped next action, complete ordering. B-043/B-075 can follow if a small correction to projections is insufficient; a new status is not automatically required.
- B-003: reproduce branch-retention ID collision and compare its impact with actual worktree usage. Reservation currently scans live worktrees and main's backlog, not retained unmerged branch contents.
- B-076: durable evidence for named UI states. Move ahead of worktree work when the next real ESQ use case is UI delivery; keep it lightweight.

### Later / conditional

- B-085/B-087: only their verified remaining gap, if any.
- Public adoption: one generic fresh-project install → change → review → land walkthrough to locate actual friction. Do not claim that release audit alone demonstrates this journey.
- B-006: revisit the Codex target when cross-host use is the selected product goal. It is not logically dependent on clearing every legacy backlog item.
- Optional research, telemetry and wider journeys: no delivery prerequisite without a current defect and a bounded question.

## Triage of all unresolved rows

“Candidate” means proposed disposition requiring the stated check, not a status change already made.

| Item | Assessment / next action |
| --- | --- |
| B-001 | Parked integration; revalidate external need/capability only when selected. |
| B-003 | Plausible current integrity defect from reservation code; reproduce retained-branch collision. |
| B-004 | Legacy audit-check numbering and duplicated-carrier premise; reframe around an observable ID/reference failure, not old prose coverage. |
| B-005 | Merge scan has related coverage; compare current fixtures with exact clean-auto-merge acceptance before closing. |
| B-006 | Strategic option, not demonstrably active work in the public checkout. |
| B-010 | Literal announce comparison is not a product outcome; candidate to drop/reframe under current guard policy. |
| B-013 | Legacy check.md trimming task; inspect current verdict behavior before retaining any work. |
| B-014 | Legacy ui.md trim prerequisite; retain only an actual current brief-contract mismatch. |
| B-022 | Two-tree/sharedblocks premise is obsolete; candidate to drop its prescribed solution. |
| B-024 | Potential unresolved-answer UX defect; reproduce current spec flow before ranking above known defects. |
| B-043 | Current projection drift makes the problem credible; prefer a small freshness/reporting change. |
| B-047 | Optional interactive-model measurement; no release or delivery gate. |
| B-050 | Re-scope headless verification guidance; no blanket permission-bypass requirement without a current bounded use case. |
| B-052 | Fold the stale-clause correction into B-050; not a separate feature. |
| B-056 | Lane mechanism retired; candidate to drop legacy lane-preflight assertions. |
| B-064 | Inline anchor retired; candidate to drop its prose-pin task. |
| B-070 | Savings remain unproved; keep research conditional instead of treating old measurements as a current optimization mandate. |
| B-075 | Real distinction between parked and in flight; solve reporting need before expanding the status schema. |
| B-076 | Product quality candidate: durable per-state UI evidence; validate current log capabilities. |
| B-078 | Old script locations/possible SIGPIPE; revalidate live commands, no confirmed current failure. |
| B-079 | Status already offers a scoped target; inspect roadmap handoff and retain only the remaining gap. |
| B-085 | Bounded collection protocol exists; candidate for acceptance verification, not immediate reimplementation. |
| B-087 | Cleanup/late-notification rules exist; verify behavior before disposition. |
| B-094 | Lab fixture maintenance debt; defer until adding a journey makes its cost relevant. |
| B-095 | Broad lab expansion includes retired contracts; split/re-scope to current behaviors. |
| B-096 | Broad correction-to-check mechanism; require a concrete repeated failure and useful test. |
| B-107 | Landing moved from converge to land; inspect remaining unrunnable-step handling there before retaining the old claim. |
| B-113 | Old audit check 48 output removed; candidate to drop. |
| B-114 | README now has a short model summary; old table/check references need re-scoping, not automatic new guard work. |
| B-118 | Optional live landing journey; existing deterministic coverage does not prove the live journey, but neither requires it to gate delivery. |
| B-122 | Script discoverability concern; establish missing user-facing operation before adding exhaustive table policing. |
| B-129 | Current roadmap completion ambiguity; mitigated by stricter status/sweep rules. |
| B-130 | Patch-only release interface still present; low priority until a minor/major release is needed. |
| B-133 | Candidate lifecycle and full-registry promotion are now documented in runner help/comments and architecture; candidate closure after matching complete acceptance. |
| B-141 | Decision contradictions deserve semantic review; do not promise a general mechanical contradiction detector. |
| B-149 | Historical corrective briefs absent from public snapshot; candidate to drop snapshot-local cleanup with that reason, not claim their corrections shipped. |
| B-158 | Reference-resolution check may have value; validate actual dead D- citations before broad registry work. |
| B-160 | Removed refload-check premise; candidate to drop/reframe only if a current load defect exists. |
| B-162 | Legacy mirror/fallback premises and prose-key pinning; candidate to drop/reframe around CLI consumer behavior. |
| B-163 | Extractor still accepts any lone code span; distinguish a document path from legitimate executable paths in a focused regression case. |
| B-165 | Failure reference still mentions three zones; trace load context before declaring a user-visible defect. |
| B-169 | Partly delivered umbrella; reconcile epic and finish concrete remaining autonomy needs. |
| B-171 | The cited tmpdir-leak assertion is not present in the current hooks suite; candidate to drop after identifying its replacement/removal. |
| B-172 | Confirmed blank Rank on add; queue-integrity work, illustrated by B-179/B-180. |
| B-176 | Proposed lexical pin conflicts with current guard policy; retain only an observable wrong-handoff regression. |
| B-179 | Conflicting corrective routes confirmed by inspection; completed-plan abandonment refusal reproduced; live journey still untested. |
| B-180 | Failing command hidden by reusable proof reproduced; first implementation candidate. |

## Verification and limits

The focused reproduction used synthetic data and temporary Git repositories, without touching product code or running paid model journeys. No secrets or private source material are needed for either leading regression. No backlog status/rank, roadmap order or product code was changed by this review. The proposal assumes delivery speed and reliability remain the primary product goal; prioritizing public adoption or native Codex support would change the later order.
