# Brief: Close B-181 with a brief-fidelity fix and one paid Tamialog trial

## Task
B-181 stays Open because nothing has yet shown its outcome, carrying the user's result from grill to plan without a re-grill, on a real case. The retained Tamialog "after" proposal (`docs/preparation/2026-09-25-b181-tamialog/after-proposal.md`, fix `7a79ffa`) already restores the requested drawer notice, removes the SPEC gate and asks no re-grill question. One defect in B-181's own scope remains. The brief asks to replace the fixed "1 comprimé" value, but the plan keeps the field ("Le champ reste « 1 comprimé »", line 46) and adds the pastilles beneath it, using "fidelity to the real form" as the reason to silently override an explicit brief instruction. This unit fixes that behavior in `/esq:plan`. It then runs one authorized paid read-only trial on the identical archived Tamialog inputs, and B-181 is closed or kept Open based on that run's inspectable output.

## In scope
- A brief-fidelity correction in the `/esq:plan` path (entrypoint and/or `plan/references/screens-and-manual-steps.md`). An explicit instruction in the brief (replace, remove, reorder) outranks a consistency preference derived from the repo. A real conflict is reported in the plan and never resolved in silence. Keep it to a few lines that replace or extend existing guidance, with no new checklist, role or prose-presence test.
- One Opus read-only preparation trial on the archived Tamialog inputs at `33e750a1` (hashes in `docs/preparation/2026-09-25-b181-tamialog/inputs.json`) with the same `prompt.txt`, options and tool set as the retained B-181 pair. The bound is 3 USD / 180 s, announced before launch.
- One retained evidence file `docs/preparation/2026-09-29-b181-fidelity.md` (plus its trace, metrics and proposal beside it, in the same shape as the 2026-09-25 folders), with a comparison table against the retained "after" arm.
- A B-181 disposition recorded through `esq backlog set-status`, with a detail note linking the evidence.
- The final `./scripts/audit.sh` PASS in the phase's `verified` block.

## Out of scope
- **The 900-word cap, output length, read volume and cost reduction.** These belong to B-182 (whose scope is "concise output"). The trial reports them and they do not decide B-181.
- A second trial, a retry to get a success, or a run of the "before" arm again. A launch failure caused by infrastructure (DNS/sandbox, authentication) is diagnosed and reported. Relaunching it needs a new explicit authorization.
- A new case, an invented scenario, a grill run on Tamialog, or any Tamialog build or UI delivery.
- B-169/C (specialist guidance) and any claim of a general grill → plan improvement.
- Reopening the withdrawn B-182 split (`8a4a2e6`).
- Any write in `events-tracker`/Tamialog or under `~/.claude/`.

## Resolved decisions
- Evidence that closes B-181: the fix plus **one** paid trial — the user chose it (2026-09-29) over closing on the retained case plus the fix without a run.
- Trial protocol: same as the retained B-181 pair (Claude Code headless, Opus/medium, Read/Grep/Glob/Skill, `dontAsk` + `--restricted`, MCP/hooks off, config under `/tmp`, isolated copy without `.git`). Inferred from `docs/preparation/2026-09-25-b181-tamialog.md` § Protocole: this keeps the comparison with the "after" arm valid.
- Sending the Tamialog inventory to Anthropic: the user explicitly authorized it for these trials (B-181 § Protocole, 2026-09-25). The user's choice of the paid run now extends that authorization to this single run on the same inventory.
- Sandbox: run outside the sandbox. Precedent: the DNS failure diagnosed in `docs/preparation/2026-09-25-b182-tamialog.md` before the authorized retry.
- **Closing criterion (B-181 → Done)**: the proposal replaces the fixed quantity value as the brief asks, or flags an explicit conflict instead of overriding it silently, **and** keeps the gains of the "after" arm:
  - the drawer notice read from `QuickLogSheet` rather than a modal
  - no SPEC gate and no re-grill question
  - Household placed after Steps, before Forecasting
  - FR/EN copy complete, including "powdered-formula"
  - one complete phase with the build, landing tests and `--no-build` audit
  - no invented Git state required (reported)
- Failure: B-181 stays Open. If the run regresses on a retained gain, the fix is withdrawn and the plan source restored exactly, following the B-182 precedent (`8a4a2e6`). If it only fails to fix the field without regressing, the fix is kept and the failure recorded. There is no further run either way.
- Judgment: made by the reader (the build model, then the user in review) against the criteria in `judgment.md` and the list above. There is no automatic word-presence score (from `judgment.md`).

## Constraints & context
- CLAUDE.md: no research instrument gates delivery. This trial gates **only** B-181's status, never a shipped feature.
- Cost: bound announced before spending (3 USD / 180 s). About 1.1 USD is expected (after arm: 1.136 USD / 162.9 s). There is one run, and no retry or rerun of an arm that already succeeded.
- The judgment's `judgment.md` stays out of the model's context, as do the historical final plan, the later decisions and the B-076 captures.
- The archive of 437 files lived under `/tmp` in 2026-09-25 and may be gone. It is rebuilt from `inputs.json` (git blobs and SHA-256 at `33e750a1`), and its hashes are checked before launch.
- The plugin copied into the archive is the current source plus the fix, with its hashes recorded. The comparison therefore also covers the plan changes since `f6f6278` (codex adversary gated by `ESQ_CODEX`, preflight, waves, and so on). This limit must be named in the evidence and never hidden.
- `ESQ_CODEX` stays unset during the trial.
- CLAUDE.md § Verification: the final phase runs `./scripts/audit.sh` without running `node --test` beside it.

## Done looks like
- The plan fix is committed, and its diff and word delta are in the evidence file.
- `docs/preparation/2026-09-29-b181-fidelity.md` exists with the protocol, the before-launch bound, source hashes, the proposal kept whole, a normalized trace, metrics, and an after-arm vs new-run table on each closing criterion plus words/time/cost (reported, not gating).
- B-181 is either Done, with a note citing the run and its limits, or still Open with the reason. When a regression occurred, the fix is withdrawn and the diff is empty against the pre-unit source.
- `./scripts/audit.sh` PASS is recorded.

## Deferred to planning
- Exact wording and placement of the fix (entrypoint vs UI reference, or both).
- How to rebuild and check the archive from `inputs.json`, and the headless command (reuse of the 2026-09-25 scripts/recipes).
- How to normalize the trace and metrics (take the format of the retained folders).
- Phasing: probably one phase (fix → audit → trial → evidence → disposition). The planner decides whether the trial should come after the audit.

## For /esq:plan
<!-- This brief is the scoped input for /esq:plan. Run /esq:plan in a fresh session; it
will detect and consume this brief. Do not edit below this line. -->
