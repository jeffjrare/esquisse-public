# Backlog

<!-- Task backlog: bugs, improvements, todos, ideas, and deferred work captured across esquisse sessions. -->
<!-- Add with `/esq:backlog <text>`. Review & triage with bare `/esq:backlog`. -->
<!-- Type: 🐛 bug | ✨ improvement | ☑️ todo | 💡 idea | ⚠️ debt (deferred fix) -->
<!-- Status: Open (actionable) | Needs-decision (blocked on user) | Planned (picked up by a plan) | Done | Dropped -->
<!-- Pri: hi | med | lo | (blank) -->
<!-- Epic: slug of the epic this item belongs to (docs/epics/<slug>.md, via /esq:epic); blank if none. -->
<!-- Version: release the item shipped in (e.g. v0.0.87); blank until deployed. Filled = ready for UA; Status Done = UA passed. -->
<!-- last-sweep: 88633cb 2026-09-21 -->

**Reconciled 2026-09-24 against public snapshot `d45188e`.** Basis: [PRIORITY-REVIEW.md](PRIORITY-REVIEW.md), current public code, and historical acceptance examined in the former development checkout before the work moved here. That history is context, not locally present plans or current runtime evidence; historical upstream commit IDs below are not refs in this snapshot. All 47 previously Open/Planned rows were reviewed, not reproduced at runtime. Current scope supersedes stale capture claims; each closure/abandonment carries its own reason. Goals remain useful features shipped quickly, fewer needless interruptions, reliable verification, beautiful design and proportionate total cost. Research and telemetry never gate delivery.

The execution proposal is [ROADMAP.md](ROADMAP.md). Rank projects its sequence; Pri remains the importance bucket, including confirmed hi on conditional work. Historical Planned status is not active execution: private plans are omitted per [plan archive](plans/README.md). Inactive Rank cells were cleared during reconciliation because rank --order then retained them while validate checked uniqueness across all rows; B-172 now maintains that lifecycle in the CLI (see its resolution). This public checkout is the development target from this reconciliation onward.


| ID | Date | Type | Pri | Rank | Summary | Source | Epic | Version | Status |
| ---- | ------ | ------ | ----- | --- | --------- | -------- | ------ | --------- | -------- |
| B-001 | 2026-07-08 | ✨ improvement | lo? | 2300 | Parked Sheets integration; revisit only when the product need is selected and connector capability is revalidated. | plan: backlog-publish-google-sheet Phase 2 |  |  | Open |
| B-002 | 2026-08-09 | 🐛 bug |  |  | spec.md's `Décisions liées: D-XXX` placeholder cites an ID format no longer allocated | build: prevent-ledger-id-collisions Phase 2 · Done inline |  |  | Done |
| B-003 | 2026-08-09 | 🐛 bug | med? |  | Reproduce ID-block reuse when an unmerged branch survives removal of its worktree; prevent duplicate allocation. | build: prevent-ledger-id-collisions Phase 3 · Done by retained-branch-id-witnesses |  |  | Done |
| B-004 | 2026-08-09 | 🐛 bug | med? |  | The citation-key invariant is replicated in 12 places but audit.sh check 10 guards only the 5 inside the id-allocation markers | build: prevent-ledger-id-collisions Phase 4 · Dropped: Retire literal citation-key parity guards; preserve ID integrity in B-003/B-005. |  |  | Dropped |
| B-005 | 2026-08-10 | ⚠️ debt | med? | 900 | Cover the exact clean-auto-merge, ancestor-present ledger reconciliation path. | fix: prevent-ledger-id-collisions-fixes |  |  | Open |
| B-006 | 2026-08-13 | 💡 idea | hi | 2200 | Parked Codex port; restart from current host needs and contracts when cross-host delivery is selected. | manual · Planned by harness-port-adapter-layer |  |  | Planned |
| B-007 | 2026-08-13 | ✨ improvement | med? |  | Any command that runs >1min must announce its itinerary and bound, agents or not | manual · Planned by long-commands-announce-their-bound · Done by long-commands-announce-their-bound · detail in 39fec30 |  |  | Done |
| B-008 | 2026-08-13 | ⚠️ debt | lo |  | Six commands conclude in their own shape, not the shared three-zone block — repriced 2026-08-16, only spec/arch earn it | plan: long-commands-announce-their-bound (cost pass) · Planned by three-zone-conclusion-spec-arch · detail in 39fec30 |  |  | Done |
| B-009 | 2026-08-13 | 🐛 bug |  |  | advance/autopilot/converge announce after their own preflight reads, so the bound still lands after the first tool call | build: long-commands-announce-their-bound Phase 1 · Done by long-commands-announce-their-bound Phase 2 |  |  | Done |
| B-010 | 2026-08-13 | 🐛 bug | med? |  | The announce-open boilerplate is duplicated in 16 command files and, unlike the other shared blocks, is not hash-compared | build: long-commands-announce-their-bound Phase 2 · Dropped: Retire hash comparison of announce prose. |  |  | Dropped |
| B-011 | 2026-08-14 | 🐛 bug |  |  | README's /esq:work worked example still prints the pre-three-zone output format | build: command-set-cost-trim Phase 2 · Done inline · detail in 39fec30 |  |  | Done |
| B-012 | 2026-08-15 | ✨ improvement | lo? |  | Trim commands/esq to the plan's 70,500 target — gap remeasured 2026-08-16 at 5,162 words, drifting ~2.5k/day unheld | manual · Planned by retire-legacy-rollback-path-fixes · Done by retire-legacy-rollback-path-fixes |  |  | Done |
| B-013 | 2026-08-15 | ⚠️ debt | med? |  | Reconcile check verdict wording with its three-zone report without losing outcome failure semantics. | check: command-set-cost-trim · Done by b013-check-report |  |  | Done |
| B-014 | 2026-08-15 | ⚠️ debt | med? |  | ui.md's brief template shares its shape with /esq:grill's output contract — parity must be verified before trimming | check: command-set-cost-trim · Dropped: Retire the legacy brief-template trim prerequisite. |  |  | Dropped |
| B-015 | 2026-08-16 | ✨ improvement | hi |  | build.md probes for a project run/verify skill but no command ever proposes writing one, so every plan's first UI phase re-derives how to launch, seed and authenticate the app | manual (transcript audit of a 4-phase autopilot run) · Done by probe-reports-the-empty-slot · detail in 39fec30 |  |  | Done |
| B-016 | 2026-08-16 | ✨ improvement | med |  | Under an orchestrator the phase agent's TaskCreate/TaskUpdate calls cost ~8% of all turns for a task list nobody is watching | manual (transcript audit) · Done by probe-reports-the-empty-slot · detail in 39fec30 |  |  | Done |
| B-018 | 2026-08-16 | ✨ improvement | hi |  | /esq:arch routed every rule by the miss test, which cannot classify a procedure — so it produced 7 knowledge skills and no runnable one, and each session re-derived how to launch the app | manual (transcript audit) · Done by runnable-skills-pass-the-re-derivation-test |  |  | Done |
| B-017 | 2026-08-16 | ✨ improvement | med |  | Every phase agent reads the plan file in full, so the execution log is re-read whole once per phase and grows linearly with phase count | manual (transcript audit) · Planned by narrow-build-execution-log-read · Done by narrow-build-execution-log-read · detail in 39fec30 |  |  | Done |
| B-019 | 2026-08-17 | ⚠️ debt |  |  | /esq:autopilot still reads the whole execution log in preflight and again after every phase, in an orchestrator context that never resets | fix: 2026-08-17-narrow-build-execution-log-read · Done by narrow-build-execution-log-read-fixes · detail in 39fec30 |  |  | Done |
| B-020 | 2026-08-17 | 🐛 bug |  |  | A build run interrupted between its last task commit and its log append leaves the phase indistinguishable from one that never ran | build: narrow-build-execution-log-read-fixes Phase 1 · Planned by build-reconciles-before-executing · Done by build-reconciles-before-executing · detail in 39fec30 |  |  | Done |
| B-021 | 2026-08-17 | ☑️ todo | med? |  | A phase editing commands/esq/ must verify with install.sh before audit.sh — check 10 reds by construction otherwise and the phase agent reads it as a failure | build: build-reconciles-before-executing Phase 1 · Planned by retire-legacy-rollback-path-fixes · Done by retire-legacy-rollback-path-fixes |  |  | Done |
| B-022 | 2026-08-18 | ⚠️ debt | lo |  | The "No mandate, no run." guard is duplicated verbatim in 6 skills ×2 trees — register it in check-sharedblocks.sh so copies cannot drift | manual (D-orchestrated-skills-guard-in-body) · Dropped: Retire the two-tree mandate-guard hash registry. |  |  | Dropped |
| B-023 | 2026-08-18 | 🐛 bug | med |  | Telemetry misses backgrounded subagents — interactive autopilot's phase agents return from PostToolUse before completion, so the runs most worth measuring record nothing; probe the SubagentStop hook event (does its payload carry usage?) | manual (first production autopilot, headless runs DO record) · Planned by subagent-stop-telemetry · Done by subagent-stop-telemetry |  |  | Done |
| B-024 | 2026-08-18 | 🐛 bug | med? |  | Give spec an explicit continuation after the user answers Je ne sais pas — montre-moi où. | review: three-zone-conclusion-spec-arch · Done by B-024 spec continuation |  |  | Done |
| B-025 | 2026-08-19 | ✨ improvement | hi |  | 19 of 20 skills were pinned `model: sonnet · effort: medium` (only ui at opus/high) — flip the default to Opus, keep Sonnet only for the five schema-bound skills (status, backlog, epic, sweep, worktree) | manual (external review 2026-08-18) · Done inline | aug-18-improv |  | Done |
| B-026 | 2026-08-19 | 🐛 bug | hi |  | Skill `model:` pins observed not to take effect: an `/esq:autopilot` session pinned sonnet ran 23/23 requests on claude-opus-5 and its phase subagent 89/89 after `Launching skill: esq:build` — add a runtime probe that reports what skills and nested skill agents actually run on | manual (external review 2026-08-18 + transcript 2010ce8e) · Done by model-runtime-probe · detail in 39fec30 | aug-18-improv |  | Done |
| B-027 | 2026-08-19 | 🐛 bug | med |  | SubagentStop telemetry records are empty in production — 29 of 30 rows in agent-runs.jsonl carry agentType "", models [], usage null, transcriptComplete false; B-023 was closed on the design, the data says nothing is recorded | manual (external review 2026-08-18 + agent-runs.jsonl) · Planned by subagent-telemetry-records · Done by subagent-telemetry-records · detail in 39fec30 | aug-18-improv |  | Done |
| B-028 | 2026-08-19 | ✨ improvement | med |  | `esq telemetry summary` — per skill/model: runs, tokens, tool calls, duration; today nothing reads agent-runs.jsonl, so telemetry is collected but never consumed | manual (external review 2026-08-18) · Planned by telemetry-summary · Done by telemetry-summary | aug-18-improv |  | Done |
| B-029 | 2026-08-19 | ✨ improvement | med |  | Measured model tiers and regression budgets — per-command medians from complete telemetry with a stated minimum sample threshold, so a downgrade from Opus is a measurement, never a guess; provisional below the threshold (depends on B-037, B-038, B-039 — not merely on B-028 existing) | manual (external review 2026-08-18) · refined 2026-08-19 · Planned by measured-model-tiers · Done by measured-model-tiers · detail in 39fec30 | aug-18-improv |  | Done |
| B-030 | 2026-08-19 | ✨ improvement | med |  | Lean assurance lane — two-axis classification (requirements uncertainty × implementation risk) routing to conformity check, code-risk review, the full corrective loop, or direct verification; lane + triggers recorded in the plan, escalable during build, never chosen on model confidence alone; plan/build/autopilot/check/review/converge agree; reopen and missed-defect rates measured (depends on B-037, B-039; follows B-042) | manual (external review 2026-08-18) · refined 2026-08-19 · Planned by lean-assurance-lane · Done by lean-assurance-lane · detail in 39fec30 | aug-18-improv |  | Done |
| B-031 | 2026-08-19 | 🐛 bug | med |  | `esq state` contract is incomplete for /esq:status — unsorted plan paths without mtime or activePlan, backlog counts only — so the skill must either violate its no-rescan rule or guess; return activePlan, mtimes, relevant backlog rows with priorities, and roadmap head | manual (external review 2026-08-18) · Planned by esq-state-for-status · Done by esq-state-for-status · detail in 39fec30 | aug-18-improv |  | Done |
| B-032 | 2026-08-19 | ✨ improvement | med |  | A small, version-aware set of **golden orchestration journeys** for `/esq:build` — one shared bespoke runner (`scripts/lib/journey-runner.mjs`), replayed deterministically from checked-in fixtures for free inside `audit.sh`, billed live only on explicit demand via `--only`, Claude Code version and model recorded per verdict, judged from artifacts (commits, execution-log entry headings, the hashes an entry cites, `esq lane`, `esq validate`, the seed project's own check) and never from the run's prose (D-a-runtime-eval-judges-artifacts). **Shipped v1 scope:** three active green journeys — U-02 reconciliation, U-02 evidence-outranks-claim, U-01 pause — each with a branch-local red mutation; a registry↔capture↔mutation bijection asserted both in `--parse` and in the suite, so a registry can never outrun its fixtures; and normal validation that touches no model, no network and nothing under `~/.claude/`. U-06's journey is **parked on B-093** with its billed red capture kept as that row's evidence; U-03, U-04, U-05 and the broader behavioral ambitions are **deferred to B-095**. Built on the bespoke-runner pattern `scripts/smoke-work-capture.mjs` proves (D-runtime-evidence-from-a-bespoke-runner) until `claude plugin eval` stops answering `early access` — deliberately not a general eval platform; CONFORMANCE.md stays lexical for static invariants | manual (external review 2026-08-18) · refined 2026-08-19 · reframed 2026-08-21 (roadmap correction) · Planned by runtime-evals-golden-journeys · scope cut to shipped v1 2026-08-31 (expansion → B-095) · Done by runtime-evals-golden-journeys + runtime-evals-golden-journeys-fixes · detail in 39fec30 | aug-18-improv |  | Done |
| B-033 | 2026-08-19 | ⚠️ debt | hi |  | audit.sh checks 30/31 run `node --test` unbounded — bound every hanging subprocess with a documented timeout, name the affected suite on timeout, exit non-zero, keep diagnostics; distinguish product defects from sandbox limits (CLI suite's nested child-process failure, hook suite's end-to-end hang at tests/hooks/hooks.test.mjs:91) | manual (external review 2026-08-18) · refined 2026-08-19 · Planned by bounded-audit-subprocesses · Done by bounded-audit-subprocesses · detail in 39fec30 | aug-18-improv |  | Done |
| B-034 | 2026-08-19 | 🐛 bug | hi |  | `esq state` exits 2 wholesale on one malformed plan (duplicate log entry, log citing an unknown Phase) or an ID-less backlog table — carry a malformed plan as `state: "invalid"` + machine-readable error, a malformed backlog as a scoped `backlog.error`, return every healthy plan/roadmap fact, and give `/esq:status` a defined path for partial or invalid state; acceptance: duplicate log entries, unknown phases, missing backlog IDs, valid+invalid mix | review: esq-state-for-status · refined 2026-08-19 · Planned by graceful-state-degradation · Done by graceful-state-degradation · detail in 39fec30 | aug-18-improv |  | Done |
| B-035 | 2026-08-19 | ☑️ todo |  |  | PostToolUse `modelsUsed` in `record-agent-telemetry.mjs` is likely the same aggregate as `result.modelUsage`, which on Claude Code 2.1.235 lists the harness's auxiliary haiku call (~950 in / 17 out) beside the agent's real model on every Opus run — a B-028 summary built on it would report mixed models for every agent and B-029 would downgrade on noise; the per-request transcript reading (`parseTranscript`) does not have this problem | build: model-runtime-probe Phase 1 · Planned by telemetry-summary · Done by telemetry-summary | aug-18-improv |  | Done |
| B-036 | 2026-08-19 | ⚠️ debt | med |  | Interrupted subagents leave no telemetry row on Claude Code 2.1.235 — a background `Agent` ended by `TaskStop` fires no `SubagentStop` to plugin hooks at all (probed 2026-08-19: transcript on disk, task `killed`, parent kept alive 12 s, zero events at a hooks-only fixture and zero rows from the production handler); B-028's summary must label the gap rather than read the file as complete | build: subagent-telemetry-records Phase 2 · Planned by telemetry-summary · Done by telemetry-summary · detail in 39fec30 | aug-18-improv |  | Done |
| B-037 | 2026-08-19 | 🐛 bug | med |  | A `PostToolUse` fallback row can win the claim race and permanently suppress the whole-run `SubagentStop` record (live file: 2 of 11 opus runs, 1 of 4 haiku runs token-less) — promote or replace the fallback when transcript data arrives, keep one logical run per agentId, report token-less runs (incl. the zero-token case) and the interrupted-run gap; race-order fixtures: PostToolUse first, SubagentStop first, concurrent, fallback only, label before completion, completion after fallback | build: telemetry-summary Phase 2 · refined 2026-08-19 · Planned by complete-run-telemetry · Done by complete-run-telemetry · detail in 39fec30 | aug-18-improv |  | Done |
| B-038 | 2026-08-19 | ✨ improvement | med |  | Direct-skill cost evidence — telemetry measures `Agent`-spawned subagents only, never a user-typed `/esq:status`, `/esq:plan`, `/esq:grill` or `/esq:arch`; add one evidence path (content-free top-level session telemetry, or a controlled benchmark runner for direct invocations) that yields per-command samples, separates direct sessions from orchestrated subagents and model identity from token quantity, invents no monetary cost, and documents what is and is not measured | manual (external review 2026-08-19) · Planned by direct-skill-cost-evidence · Done by direct-skill-cost-evidence · detail in 39fec30 | aug-18-improv |  | Done |
| B-039 | 2026-08-19 | ☑️ todo | med |  | Command-labelled sample sufficiency — verify `AgentLabel` rows reliably join to completed runs, collect representative samples for esq:build/check/review/fix/work/apply, and state a minimum sample threshold below which any tier or budget figure is marked provisional; B-029 is not actionable before it | manual (external review 2026-08-19) · Planned by telemetry-sample-sufficiency · Done by telemetry-sample-sufficiency · detail in 39fec30 | aug-18-improv |  | Done |
| B-040 | 2026-08-19 | 🐛 bug | lo |  | Telemetry privacy contract mismatch — README and the handler comment say transcript parsing never reads a text block, but `parseTranscript` reads the last assistant text transiently to judge completeness (`record-agent-telemetry.mjs:175`); either drop the comparison or document the transient, never-persisted read — no prompt, response, tool input or reasoning text may ever be written | manual (external review 2026-08-19) · Planned by complete-run-telemetry · Done by complete-run-telemetry · detail in 39fec30 | aug-18-improv |  | Done |
| B-041 | 2026-08-19 | ✨ improvement | med |  | Probe the `Agent` tool's explicit `model` field — extend `scripts/probe-model-pins.mjs` (never a second mechanism): Opus, Sonnet and Haiku workers from a controlled parent, foreground and background, the actual model read from runtime evidence with auxiliary harness calls detected and not misclassified; on-demand, replayable from a saved fixture, never in audit.sh, Claude Code version recorded per live verdict, an upgrade requires remeasurement | manual (external review 2026-08-19) · Planned by explicit-agent-model-probe · Done by explicit-agent-model-probe · detail in 39fec30 | aug-18-improv |  | Done |
| B-042 | 2026-08-19 | ✨ improvement | med |  | Separate orchestration cost from worker judgment — only if B-041 proves explicit per-Agent model selection reliable: relay orchestrators (autopilot, advance, converge) on the cheapest measured-adequate model, judgment workers (plan/build/check/review/fix/work/grill/arch) explicitly Opus, schema-bound workers (apply, projection refresh) Sonnet where evidence supports; per-spawn model assertion, telemetry by orchestrator × actual worker model, immediate fallback to all-Opus inheritance; success = equal-or-better accepted outcomes at lower model-adjusted usage, never fewer Opus calls | manual (external review 2026-08-19) · Planned by relay-worker-model-separation · Done by relay-worker-model-separation · detail in 39fec30 | aug-18-improv |  | Done |
| B-043 | 2026-08-19 | ✨ improvement | lo |  | Expose stale roadmap/epic state beside live ledger facts without adding a second writer. | manual (external review 2026-08-19 — ROADMAP.md showed B-028 Open after the backlog marked it Done) · Done by projection-live-state | aug-18-improv |  | Done |
| B-044 | 2026-08-19 | ✨ improvement | lo |  | Workflow transaction efficiency, measured not rewritten — batch plan-log, decision, backlog and projection updates once per completed phase or command where safe while implementation commits stay atomic and revertible; measure workflow-state commits per phase, model turns per accepted commit, projection refreshes per closed item, repeated reads per workflow; no loss of interruption recovery, attribution, auditability or single-writer authority | manual (external review 2026-08-19) · Planned by fewer-round-trips-per-run · Done on your call (consolidation shipped; measurement not pursued further) · detail in 1f3b94e | aug-18-improv |  | Done |
| B-045 | 2026-08-19 | 🐛 bug |  |  | `probe-model-pins.mjs` `aux` column reports the worker's own request billed under a `[1m]` usage key as `(usage-only)` — on 2.1.235 an opus worker reads `claude-opus-5[1m] (usage-only)`, readable as a second opus call; normalize the suffix in the usage-minus-requests compare, test from the fixture's opus rows | build: explicit-agent-model-probe Phase 2 · Done by sweep f94bf25 |  |  | Done |
| B-046 | 2026-08-19 | ☑️ todo |  |  | A plan verification step written `node --test tests/` reds before any test runs on Node 22 (`MODULE_NOT_FOUND` on a bare directory) — `/esq:plan` names the glob (`node --test 'tests/**/*.test.mjs'`) or the files, the form `audit.sh` checks 30–31 already take | build: explicit-agent-model-probe Phase 2 · Planned by node22-test-invocation · Done by node22-test-invocation | aug-18-improv |  | Done |
| B-047 | 2026-08-19 | ☑️ todo | med | 2100 | Optional interactive model-pin observation; no delivery or release prerequisite. | plan: relay-worker-model-separation · scoped into B-074 2026-08-21 | aug-18-improv |  | Open |
| B-048 | 2026-08-19 | 🐛 bug |  |  | `esq telemetry assert-model` and `summary` honor a `CLAUDE_PLUGIN_DATA` exported in the user's shell while the telemetry hook writes where the harness points it (`esq-inline` under `--plugin-dir`) — with the variable exported, the orchestrator's post-spawn assertion reads an empty store, returns `unlabelled`, and the report shows `⚠ worker model` on a spawn that was honored (observed live 2026-08-19); the lib's "a skill's Bash does not see it" holds only for the harness-set value — fall back to pooled discovery on no match under the env root, or have the hook publish the root it resolved | build: relay-worker-model-separation Phase 4 · Planned by relay-worker-model-separation-fixes · Done by relay-worker-model-separation-fixes | aug-18-improv |  | Done |
| B-049 | 2026-08-19 | 🐛 bug | hi |  | `esq plan append-log` renders a hollow entry when the JSON keys miss `renderLogEntry`'s (`whatBuilt`, `planCommittedAt`, `surprises`, `backlogCandidates`, `manualOutstanding`) — unknown keys are dropped silently and no key exists for the template's `For Phase N+1` / `Reconciled` fields; `/esq:build` names no schema, so an Opus worker guessed from the markdown template and shipped a hollow entry live (2026-08-19) before catching it — reject unknown keys and add the two fields, or state the schema beside the command in the skill | build: relay-worker-model-separation Phase 4 · B-086 merged in 2026-08-22 · Planned by execution-log-writer-integrity · Done by execution-log-writer-integrity · detail in 39fec30 | aug-18-improv |  | Done |
| B-050 | 2026-08-19 | ☑️ todo | med? | 2500 | Document headless verification permissions for a concrete bounded case, without a blanket bypass requirement. | build: relay-worker-model-separation Phase 4 | aug-18-improv |  | Open |
| B-051 | 2026-08-19 | 🐛 bug |  |  | Three throwaway `/esq:autopilot` proof runs from relay-worker-model-separation Phase 4 were written into the real pooled telemetry store (`esq-inline`) and are indistinguishable from real work — they are 3 of the 6 runs in `byCommandModel["esq:build · claude-opus-5"]`, the exact cell B-029 is told to compare relay × worker model from, and the sample threshold is 5; either mark or exclude runs made from a scratch repo (a `cwd`/repo field on the row, or a documented scrub), or B-029 argues its first table off a one-line-append phase — excluded at read by `EXCLUDED_RUNS` in `plugin/lib/telemetry.mjs`, reported as `3 excluded` on the runs line, with the store left untouched and `ESQ_TELEMETRY=off` for scratch runs written into the README | review: relay-worker-model-separation · Planned by measured-model-tiers · Done by measured-model-tiers | aug-18-improv |  | Done |
| B-052 | 2026-08-19 | ☑️ todo | med? |  | B-050's second clause is stale since B-048's fix ("must not export `CLAUDE_PLUGIN_DATA` — the hook ignores it, the CLI does not" — the CLI now ignores it too, so the advice misleads at triage); trim the clause when acting on B-050 | build: relay-worker-model-separation-fixes Phase 1 · Done by priority-reconciliation-2026-09-24 | aug-18-improv |  | Done |
| B-053 | 2026-08-19 | ☑️ todo |  |  | `tests/cost-budgets/` is run by no gate — unlike `tests/probe/` it bills nothing (13 tests, 331 ms), so a change to `scripts/cost-budgets.mjs` or to the README budget table’s shape breaks the checker and nothing reds before the commit; wiring it into `audit.sh` shifts the audit's check count, cited in `CLAUDE.md` and `docs/ARCHITECTURE.md` | build: measured-model-tiers Phase 3 · Planned by native-source-audit-reach · Done by native-source-audit-reach | aug-18-improv |  | Done |
| B-054 | 2026-08-19 | 🐛 bug |  |  | `node --test <dir>` exits 1 with `Cannot find module` on Node v22.22.3 for every test directory in this repo (`tests/probe`, `tests/cost-budgets`), so a contributor following the directory form reads a passing suite as a failing one; the file/glob form (`node --test 'tests/<dir>/*.test.mjs'`) works and is what audit.sh uses | build: measured-model-tiers Phase 3 · Planned by node22-test-invocation · Done by node22-test-invocation | aug-18-improv |  | Done |
| B-055 | 2026-08-20 | 🐛 bug |  |  | `/esq:converge`'s frontmatter `description:` and the README command table both state "check → fix → review → fix … at most four" unconditionally, but since lean-assurance-lane Phase 4 three of the four lanes buy two subagents — the user reads a four-subagent bound in the two places they calibrate cost *before* invoking; Phase 6 touches README.md only to document `esq lane stats`, so nothing in that plan corrects it | build: lean-assurance-lane Phase 4 · Done by sweep 761f8f4 | aug-18-improv |  | Done |
| B-056 | 2026-08-20 | ☑️ todo | med? |  | `/esq:check` and `/esq:review` each carry a lane-bearing preflight step and resolved-target line (lean-assurance-lane Phase 4) that no `docs/CONFORMANCE.md` scenario pins — R-05 covers `converge` only, so a packaging migration could drop both finders' lane prose and check 24 would stay green, leaving a user unable to tell which lane a finder was bought for; it is a fourth scenario and its own decision, which is why Phase 5 did not fold it in | build: lean-assurance-lane Phase 5 · Dropped: Retire lane-preflight prose assertions. | aug-18-improv |  | Dropped |
| B-057 | 2026-08-20 | 🐛 bug | med? |  | `esq lane stats` counts findings by tier from the corrective-brief files still on disk, but `/esq:fix` strips applied 🟢 items from a brief and deletes one whose items all applied — so the 🟢 column reads near-zero by construction (0 across this repo's five surviving briefs) and anyone comparing lanes by finding volume is misled in the direction that flatters the lean lane; the accurate source is each brief at its `brief(fixes):` commit, which is the per-plan history walk D-lane-stats-measures-from-ledgers-not-history rules out, so this is that bound being re-decided rather than a fix | build: lean-assurance-lane Phase 6 · Dropped: its whole subject was `esq lane stats`' finding-tier column, and that command retired with the assurance lanes on 2026-09-22 — there is no consumer left to mislead. Nothing here was a defect in the corrective loop itself. | aug-18-improv |  | Dropped |
| B-058 | 2026-08-20 | ☑️ todo |  |  | `docs/ARCHITECTURE.md` § `plugin/bin/esq` ("the summary alone prints prose by default") and the project skill `.claude/skills/plugin-runtime/SKILL.md` ("`telemetry summary` alone prints prose by default") both still state the CLI's prose exception as a count of one, but `esq lane stats` is now a second by D-lane-stats-prints-prose-for-a-human — a contributor reading either would reject a correct implementation or ship a JSON-only stats command; `/esq:arch` refreshes the first, nothing refreshes the second | build: lean-assurance-lane Phase 6 · Done by sweep 61169d6 | aug-18-improv |  | Done |
| B-059 | 2026-08-20 | ⚠️ debt |  |  | `esq lane stats`' `reopened` rate is not comparable across lanes — the `full` itinerary produces a second brief by design (check writes one, `/esq:fix` clears it, review writes another), which is exactly the `produced → applied → produced` sequence `reopened()` fires on, so a healthy `full` run scores a reopen (7/29 · 24% here, none of them a miss) while a one-finder lean lane structurally cannot; the companion `postPassDefects` rate needs re-deciding in the same pass, since it takes the earliest *surviving* brief as `closedAt` and a plan whose loop worked has none | fix: 2026-08-20-lean-assurance-lane-fixes · Planned by lean-assurance-lane-fixes · Done by lean-assurance-lane-fixes · detail in 39fec30 | aug-18-improv |  | Done |
| B-060 | 2026-08-20 | 🐛 bug | med? |  | Inline `/esq:work` verdict writes no plan anchor — `/esq:converge` refuses and `/esq:check`/`/esq:review` silently target the wrong plan | manual · Planned by work-inline-plan-anchor · Done by work-inline-plan-anchor · detail in 39fec30 |  |  | Done |
| B-061 | 2026-08-20 | ✨ improvement | lo? |  | `/esq:work` resolves only a B-NNN, no argument, or several IDs — free text falls through every branch, so a quick fix costs two commands and can land with no ID | manual · Planned by work-accepts-free-text · Done by work-accepts-free-text · detail in 39fec30 |  |  | Done |
| B-062 | 2026-08-20 | 🐛 bug |  |  | `check-longrun.sh` cannot run against `plugin/skills` — it walks a flat `*.md` dir and exits 2, so the announce rule is enforced only on the temporary legacy mirror | build: work-inline-plan-anchor Phase 1 · Planned by native-source-audit-reach · Done by native-source-audit-reach | aug-18-improv |  | Done |
| B-063 | 2026-08-20 | 🐛 bug |  |  | `README.md`'s legacy-install section still promises the rollback path goes away once the plugin passes "the twelve in `docs/CONFORMANCE.md`" — the contract has held sixteen scenarios since the lane work and seventeen since P-06, so anyone judging the plugin ready counts five fewer contracts than exist; the number has drifted with every scenario added because nothing compares it to `check-conformance.sh`'s own summary line | build: work-inline-plan-anchor Phase 2 · Done inline |  |  | Done |
| B-064 | 2026-08-20 | ☑️ todo | med? |  | `**A failed anchor never unwinds the code.**` in `/esq:work` step 5 is pinned by no `docs/CONFORMANCE.md` scenario (P-06 asserts what the anchor contains, not what happens when it will not parse) — a packaging migration that drops it lets a work run revert a landed, verified fix to protect a bookkeeping artifact while check 24 stays green; same gap B-056 reports for the finders' lane prose, and it wants the same answer | build: work-inline-plan-anchor Phase 2 · Dropped: Retire the inline-anchor prose pin. |  |  | Dropped |
| B-065 | 2026-08-21 | 🐛 bug |  |  | Duplicate of B-062 — same defect (`check-longrun.sh` cannot walk `plugin/skills`); its mechanism clause is folded into B-062 | build: work-accepts-free-text Phase 1 · Planned by native-source-audit-reach · Dropped: duplicate of B-062 | aug-18-improv |  | Dropped |
| B-066 | 2026-08-21 | ☑️ todo | med? |  | Verify the free-text capture end to end | work · Planned by verify-work-capture-end-to-end · Done by verify-work-capture-end-to-end | aug-18-improv |  | Done |
| B-067 | 2026-08-21 | 🐛 bug |  |  | A fresh smoke-work-capture run writes the maintainer's ambient environment into the capture, and only an ad-hoc trim keeps it out of the repo | build: verify-work-capture-end-to-end Phase 1 · Planned by sanitized-capture-at-write-time · Done by sanitized-capture-at-write-time · detail in 39fec30 | aug-18-improv |  | Done |
| B-068 | 2026-08-21 | 🐛 bug |  |  | `audit.sh` check 4 emits a false "missing from the table" finding at random — `set -o pipefail` promotes `echo`'s SIGPIPE to the status of `echo "$body" \| grep -q …` whenever grep matches early in a long section | build: verify-work-capture-end-to-end Phase 2 · Shipped by 2026-08-21-pipefail-sigpipe-grep-sites · detail in 39fec30 | aug-18-improv |  | Done |
| B-069 | 2026-08-21 | 🐛 bug | hi |  | `/esq:arch` records a run recipe without the environment needed to execute it, so later sessions must reconstruct setup and `/esq:build` skips its own readiness probe | manual · Done inline · detail in 39fec30 |  |  | Done |
| B-070 | 2026-08-21 | ✨ improvement | hi | 1600 | Reduce repeated file reads when a concrete current repetition is identified; historical savings remain unproved. | manual (esq telemetry summary + 621 agent transcripts, corrected 2026-08-21) · Planned by read-once-and-see-round-trips · measurement delivered as B-151, see detail | aug-18-improv |  | Planned |
| B-071 | 2026-08-21 | ✨ improvement | med |  | esq agents batch at **1.068 tool calls per turn against 1.243 for the 446 non-esq agents on the same machine in the same window** (`esq:build` worst at 1.037, 96.5% singleton) — same harness, same hardware, so the gap is the prompts. Closing to the machine's own non-esq rate is ~634 round trips, 4.0/run, ~35s off a 7m16s median, ~0.049 G cache-read; the adjacency ceiling is 2,032 trips (44.4% of turns) but is measured by adjacency, not dependency. The batching half of B-070; related to B-044 (workflow transaction efficiency) | manual (621 agent transcripts, 2026-08-21) · split from B-070 by read-once-and-see-round-trips · Planned by fewer-round-trips-per-run · Done on your call (batching mechanism shipped; round-trip drop unmeasured) · detail in 1f3b94e | aug-18-improv |  | Done |
| B-072 | 2026-08-21 | ☑️ chore |  |  | `docs/SPEC.md § Telemetry summary` and `README.md § Deterministic CLI` enumerate the summary's table columns verbatim ("runs, output tokens summed and median, all tokens, median duration, median tool calls") and now under-describe the output by two — `trips med` and `calls/trip` are missing from both prose lists | build: read-once-and-see-round-trips Phase 2 · Planned by fewer-round-trips-per-run · Done by fewer-round-trips-per-run Phase 3 | aug-18-improv |  | Done |
| B-073 | 2026-08-21 | ✨ improvement | hi |  | Outcome-linked workflow measurement — the epic promises accepted user value per unit of model usage while every shipped instrument measures spend alone, and D-tiers-held-until-a-second-cell-confirms already makes an outcome signal a precondition for moving any judgment-bearing pin. A **read-only** summary derived as far as possible from facts already committed (plan files and their execution logs, backlog acceptance and `Version` cells, corrective briefs, git history), segmented by assurance lane × actual model configuration × a defensible work-size proxy; `Done`/UA-passed is the acceptance anchor where available. Never one blended value score — cost and outcome are reported side by side. Persists no prompt, response or code content and invents no monetary cost (D-hook-telemetry-stops-at-observable-usage). The baseline must be instrumented **before** B-071/B-044 change the workflow it measures | manual (roadmap correction 2026-08-21) · Planned by outcome-linked-workflow-measurement · Done by outcome-linked-workflow-measurement · detail in 1f3b94e | aug-18-improv |  | Done |
| B-074 | 2026-08-21 | 🐛 bug | hi |  | Harness evidence goes stale silently — the worker-model proof every orchestrator spawn rests on (D-relay-sonnet-workers-explicit-opus, README § Model recommendations, `tests/probe/fixtures/capture.jsonl`) is measured on Claude Code **2.1.235**, this machine now runs **2.1.238**, and the newer smoke capture already records 2.1.238; README itself says an upgrade requires re-measurement and nothing makes the gap visible. Wanted: critical evidence records the harness version it validated; status makes stale evidence visible after an upgrade; stale worker-model evidence recommends the safe capable-session fallback (all-Opus inheritance) until an on-demand probe revalidates it; no live probe ever runs automatically (it stays out of `audit.sh`, D-model-pin-probe-reads-stream-json); B-047's interactive-pin question is folded into this same versioned compatibility/evidence suite rather than becoming an isolated mechanism | manual (roadmap correction 2026-08-21 — `claude --version` 2.1.238 vs the probe's 2.1.235 rows) · Planned by harness-evidence-freshness · Done by harness-evidence-freshness-fixes-2 | aug-18-improv |  | Done |
| B-075 | 2026-08-21 | ✨ improvement | med |  | Represent parked versus executing work honestly in existing readers; choose a minimal convention before adding a status. | manual (roadmap correction 2026-08-21) · Done by parked-work-readers |  |  | Done |
| B-076 | 2026-08-21 | ✨ improvement | med? |  | Retain a durable inspectable evidence reference per named UI state, using existing plan logging. | manual (roadmap correction 2026-08-21) |  |  | Done |
| B-077 | 2026-08-21 | 🐛 bug | hi |  | `/esq:advance` cannot be scoped to one roadmap entry — it is the only orchestrator of the three with no target: `/esq:autopilot` resolves a plan path from the argument (preflight 1) and `/esq:converge` resolves one too (preflight 1), while advance's preflight 2 unconditionally takes **every** `## Now` entry and its body never reads `$ARGUMENTS`. With `Now` at 7 entries that is 14 sequential Opus subagents — ~310k output tokens and ~75–85 min by this machine's own medians (`esq:work` 22.1k / 5m22s over 7 runs), before the plan-routed items add ~21.5k / 8m22s each — with no way to say "just work `audit-gate-reliability`". Accept an entry slug or a `B-NNN` and walk only that entry's items; the announce line already states `<N> item(s) across <E> Now entr(ies)`, so the bound reads correctly once the scope is resolvable | manual (roadmap correction follow-up 2026-08-21) · Planned by advance-entry-scoping · Done by advance-entry-scoping |  |  | Done |
| B-078 | 2026-08-21 | ⚠️ debt | med? | 2600 | Revalidate the remaining head/pipefail site before prescribing SIGPIPE cleanup. | plan: pipefail-sigpipe-grep-sites (scoped out) | aug-18-improv |  | Open |
| B-079 | 2026-08-21 | ✨ improvement | hi? |  | Offer a scoped advance target from roadmap when discussing one entry. | build: advance-entry-scoping Phase 1 · Done by scoped-entry-handoff |  |  | Done |
| B-080 | 2026-08-21 | ✨ improvement | hi |  | When a command needs the user to do something, the ask is buried in prose — the user has to dig to find the action. Zone 2 (`NEEDS YOU`) and every `→ Next` / manual-verification / decision block should be bullets: the action first, minimum words, no narration around it. Costs the user reading time on every run and the run output tokens on every command that stops | manual · Planned by ask-shape-action-first · Done by ask-shape-action-first · detail in 39fec30 |  |  | Done |
| B-081 | 2026-08-22 | ⚠️ debt |  |  | Three live documents told a maintainer that wiring a suite into `audit.sh` shifts a check count they cited as a literal — this row's own sibling B-053, `docs/ROADMAP.md`'s `audit-gate-reliability` rationale and `docs/epics/aug-18-improv.md` — and the literal went stale twice while they said it. A maintainer following B-053's instruction greps the number, finds nothing, and ships a stale count in `CLAUDE.md` and `docs/ARCHITECTURE.md`. Restate all three as "the audit's check count, cited in `CLAUDE.md` and `docs/ARCHITECTURE.md`" so no future renumber has to chase a number; this row's own "three documents" over-counts — `docs/AUDIT.md` cites individual checks and ranges but states no total, so it needs no edit | build: ask-shape-action-first Phase 3 · Planned by native-source-audit-reach · Done by native-source-audit-reach | aug-18-improv |  | Done |
| B-082 | 2026-08-22 | 🐛 bug | hi |  | `D-a-match-is-never-read-through-a-pipe` states as fact that `scripts/check-sigpipe-shape.sh` is audit check 35 and `scripts/test-sigpipe-shape-guard.sh` check 36, but neither script exists — `docs/plans/2026-08-21-pipefail-sigpipe-grep-sites.md` has an empty execution log — and checks 35/36 are now the ask-shape pair. The plan also names the exact count citations to bump from 34, which is already done and to 36. Whoever builds that plan must renumber to 37/38 and correct the decision entry's parenthetical, or the audit ends up with two check 35s | build: ask-shape-action-first Phase 3 · Done by 2026-08-21-pipefail-sigpipe-grep-sites (scripts landed as audit checks 37/38; D-a-match-is-never-read-through-a-pipe corrected) | aug-18-improv |  | Done |
| B-083 | 2026-08-22 | ⚠️ debt |  |  | Check 35 (`check-askshape.sh`) is run only against `commands/esq` (`scripts/audit.sh:1162`), and `check-skill-parity.sh` is one-directional for `build` (extra plugin lines pass, `:41-52`), so a prose ask added to `plugin/skills/build/references/reporting-and-stops.md` — the paused-phase relay, the stop surface users meet most — never reddens the commit gate. Sibling of B-062 (`check-longrun.sh`, same legacy-mirror-only reach) | fix: ask-shape-action-first-fixes · Planned by native-source-audit-reach · Done by native-source-audit-reach · detail in 39fec30 | aug-18-improv |  | Done |
| B-084 | 2026-08-22 | ⚠️ debt |  |  | `scripts/audit.sh`'s own headlines for checks 35 and 36 still describe the three-assertion guard (`over-long, two-sentence and narration-opener asks all fire`), but check 35 now carries a fourth assertion and its declared opener registry — so a contributor whose commit reds check 36 reads a title that never mentions the opener test and hunts the wrong assertion | build: ask-shape-action-first-fixes-2 Phase 1 · Done by sweep 3d44095 | aug-18-improv |  | Done |
| B-085 | 2026-08-22 | ✨ improvement | hi | 1400 | Collection protocol delivered; remaining operational acceptance is unproved and coupled to B-087. | manual (measure-wait-cost.mjs v2 + 2.1.239 harness probe, 2026-08-22) · plan wait-once-and-a-named-payload superseded before any phase ran · Planned by background-task-lifecycle | aug-18-improv |  | Planned |
| B-086 | 2026-08-22 | 🐛 bug | hi |  | Duplicate of B-049 — same defect (`esq plan append-log`'s payload is neither complete nor discoverable); its measured cost, 350 calls across 116 agents rediscovering the schema from `plugin/lib/cli.mjs`, is folded into B-049 | manual (transcript audit of 685 subagent transcripts, 2026-08-22) · merged into B-049 · detail in 39fec30 |  |  | Dropped |
| B-087 | 2026-08-22 | 🐛 bug | med | 1500 | Process teardown and elapsed-span reporting delivered; prevention of late harness notification remains unresolved. | manual (transcript forensics on agent a70e8db3, CC 2.1.239, 2026-08-22) · Planned by background-task-lifecycle | aug-18-improv |  | Planned |
| B-088 | 2026-08-26 | 🐛 bug | hi? |  | `test-sigpipe-shape-guard.sh` case 1 requires exactly 141, an unportable environment assumption | work · Done inline · detail in 39fec30 | aug-18-improv |  | Done |
| B-089 | 2026-08-26 | ⚠️ debt | med? |  | `check-skill-parity.sh` (check 27) is one-directional for `build` — lines present only under `plugin/` pass (`scripts/check-skill-parity.sh:41-52`) — so any contract carried only in a plugin reference file is invisible to the gate. Checks 16 and 35 now read `plugin/skills` directly, which closes the announce bound and the ask shape; every other clause in `build/references/*.md` is still unguarded, and a maintainer who adds one sees nothing red | build: native-source-audit-reach Phase 3 · Planned by retire-legacy-rollback-path · Done by retire-legacy-rollback-path | aug-18-improv |  | Done |
| B-090 | 2026-08-27 | 🐛 bug |  |  | `check-bounded.sh`'s failure diagnostic is the last 40 lines of the suite's output (`show_tail`, `scripts/check-bounded.sh:84`), so on a check that gates several suites the failing `not ok` line scrolls off — check 39's injected run showed forty lines of *passing* subtests and `pass 29 / fail 1`, naming neither the suite nor the test that broke, and the maintainer whose commit reds it has to re-run `node --test` by hand to find out what happened | build: native-source-audit-reach Phase 4 · Planned by show-the-failing-test · Done by show-the-failing-test · detail in 1f3b94e | aug-18-improv |  | Done |
| B-091 | 2026-08-29 | 🐛 bug | med? |  | audit check 40 names an ordinary English word as a bare directory when a valid `node --test <file>` invocation is followed by prose with no em dash or other terminator — a false red on a line that is correct | build: node22-test-invocation Phase 2 · Dropped: check 40 WAS scripts/check-nodetest-form.sh, the parser of node --test invocations written in prose; it retired on 2026-09-22. The rule it policed stays as an instruction in /esq:plan's verification discipline. | aug-18-improv |  | Dropped |
| B-092 | 2026-08-29 | 🐛 bug | med? |  | `/esq:converge` assumes every selected `do:` is agent-runnable, but an apply subagent cannot invoke a command carrying `disable-model-invocation: true` (14 of the 20 skills, `backlog` among them) — the spawn is wasted and the authorized decision goes unapplied; classify `do:` executability before spawning, relay user-only commands without an apply agent, and resume from observed state after the user runs them | manual · Planned by route-a-do-before-spawning · Done by route-a-do-before-spawning · detail in 1f3b94e |  |  | Done |
| B-093 | 2026-08-30 | 🐛 bug | hi? |  | `/esq:build`'s "Escalate the lane when the phase finds a trigger the plan missed" section did not fire on a trust boundary in two billed headless runs (Claude Code 2.1.251, 2026-08-30, `tests/journeys/fixtures/billed/escalation.jsonl`): given a `direct` plan recording low/low and one task persisting the caller's API token to `.tokens.json`, build wrote the module, completed Phase 1 normally and recorded no escalation — `esq lane` on the file still resolves `risk=low`, `source=plan`, so the next orchestrator reads an unraised lane. The corroboration regex `/escalat/i` was false on the second run: the word never appeared in the stream at all. U-06's runtime evidence (journey 3 of B-032) cannot be minted until this fires | build: runtime-evals-golden-journeys Phase 3 · Planned by build-escalation-actually-fires · Dropped: the behavior it waited on was removed, not fixed: /esq:build's assurance-escalation section, the lane it raised and append-log's escalation field all retired on 2026-09-22, so there is nothing for the parked escalation journey to unpark into. Its judge, overlay and billed red capture retire with it. |  |  | Dropped |
| B-094 | 2026-08-30 | ⚠️ debt | med? | 1700 | Use one-journey mutation overlays when new lab coverage makes full-copy fixture churn material. | plan: runtime-evals-golden-journeys re-plan (cut from Phase 3 as churn, not risk) | aug-18-improv |  | Open |
| B-095 | 2026-08-31 | ✨ improvement | med? | 1900 | Add only journeys for selected current behavioral gaps; retire the old model-assertion and lane campaign scope. | plan: runtime-evals-golden-journeys (scope cut 2026-08-31; design preserved at cd3485f) | aug-18-improv |  | Open |
| B-096 | 2026-08-31 | ✨ improvement | med? | 3000 | Mechanize a repeated correction only when it identifies a concrete observable defect. | manual (external comparison 2026-08-31: affaan-m/ECC `continuous-learning-v2`) |  |  | Open |
| B-097 | 2026-08-31 | 🐛 bug | med? |  | `plugin.json`'s version has not moved in 662 commits and no check guards it — frozen at `0.3.0` since 2026-08-17 while `plugin/` took 27 files, +2683/-220; zero git tags in the repo. This can block updates after publication: `claude plugin update` compares versions, so a GitHub installer of 0.3.0 never receives a single fix. `.claude-plugin/marketplace.json`'s `esq` entry carries no `version` field, so the `claude plugin tag` that validates plugin.json ↔ marketplace-entry agreement validates nothing. None of audit.sh's 41 checks reads the version. **The deliverable is the check, not the bump:** audit.sh reds when `plugin/` changed since the last version bump, with its fault injection. Secondary, same file: BACKLOG.md's `Version` column documents a UA workflow ("Filled = ready for UA; Status Done = UA passed") that 0 of 96 rows fill, and its documented example `v0.0.87` does not match the real scheme `0.3.0` — decide: wire it or drop the comment | manual · Planned by local-plugin-release-workflow · Done by local-plugin-release-workflow · detail in 1f3b94e |  |  | Done |
| B-098 | 2026-08-31 | ⚠️ debt |  |  | A live `--only` run of `scripts/smoke-journeys.mjs` writes the *whole* default capture, so the documented way to re-buy one journey's evidence — `node scripts/smoke-journeys.mjs --only pause`, the command `docs/CONFORMANCE.md` prints as U-01's runtime evidence — overwrites `tests/journeys/fixtures/capture.jsonl` with a single row pair and destroys the two journeys the contributor did not re-run; the same default also lands an *empty* file when the loop throws before the first row, because `writeCapture` writes whatever the `finally` holds — `scripts/lib/journey-runner.mjs:404` (`live`'s `outFile` default) and `:450` (the `finally` write) | fix: runtime-evals-golden-journeys · Planned by runtime-evals-golden-journeys-fixes · Done by runtime-evals-golden-journeys-fixes · detail in 39fec30 | aug-18-improv |  | Done |
| B-099 | 2026-08-31 | ⚠️ debt |  |  | `scripts/probe-model-pins.mjs` writes its capture with the `overwrite` mode of `writeCapture`, so `--out cap.jsonl` twice in a row destroys the first run's billed records. It shares the write path with the two harness consumers but not the harness, and its `--out` is always explicit with no aggregate default, so it is not B-098 — the hazard is a repeated path rather than an implicit one. `runtime-evals-golden-journeys-fixes` makes `mode` a required argument of `writeCapture` and has probe opt into `{ mode: 'overwrite' }` explicitly at its one call site, citing this row; converting that opt-in to `exclusive` — and letting the second run refuse — is what remains. Left out of `runtime-evals-golden-journeys-fixes` deliberately, so that plan's blast radius stayed the harness | plan: runtime-evals-golden-journeys-fixes (scoped out, not forgotten) · Planned by harness-evidence-freshness · Done: probe uses `openCapture`, which claims its `--out` with `wx` unconditionally — a repeated path already refuses, no `writeCapture`/`overwrite` opt-in remains | aug-18-improv |  | Done |
| B-100 | 2026-08-31 | ✨ improvement | med |  | A clean converge lands its branch locally; esquisse never pushes | manual · Planned by loop-lands-its-branch · Done by loop-lands-its-branch · detail in 1f3b94e |  |  | Done |
| B-101 | 2026-08-31 | ☑️ todo | med |  | Project ship policy is manual or merge-only; esquisse never pushes | manual · Planned by declared-ship-policy · Done by declared-ship-policy · detail in 1f3b94e |  |  | Done |
| B-102 | 2026-08-31 | ✨ improvement | med |  | A plan records the branch its phases commit to; `/esq:build` refuses a reused, already-merged branch name | manual · Planned by plan-owns-its-branch · detail in 39fec30 |  |  | Done |
| B-103 | 2026-08-31 | 🐛 bug | med? |  | `briefSlug` strips `-fixes` before the `-N` uniquifier, so a `-fixes-2` brief joins no plan and `esq lane stats` understates that lane’s corrective rate | review: plan-owns-its-branch · Dropped: two halves, neither standing: the `esq lane stats` consumer retired with the lanes on 2026-09-22, and briefSlug already strips -fixes(-N) as one group — verified at 58ddf9b and today, where a -fixes-2 brief resolves to its plan through esq brief plan. Dropped rather than Done: this pass did no work on it. |  |  | Dropped |
| B-104 | 2026-08-31 | ⚠️ debt |  |  | The ship-policy trust boundary is missing from `docs/ARCHITECTURE.md § Boundaries not to cross` | fix: declared-ship-policy · Done by arch 96d8d96 · detail in 1f3b94e |  |  | Done |
| B-105 | 2026-09-01 | 🐛 bug |  |  | `esq merge seal` renders reconciled rows against the destination's older header, dropping a column added on one side | build: loop-lands-its-branch Phase 3 · Done inline · detail in 1f3b94e |  |  | Done |
| B-106 | 2026-09-02 | 🐛 bug |  |  | Plans ship `(auto)` verification steps whose command cannot run as written, so a phase either halts on a step that could never pass or teaches the agent to reinterpret its own verification | build: loop-lands-its-branch Phase 7 · Planned by auto-step-that-cannot-run · Done by auto-step-that-cannot-run | aug-18-improv |  | Done |
| B-107 | 2026-09-02 | 🐛 bug | med? |  | Align land handling of an unrunnable verification command with build acceptance, without weakening the proved criterion. | build: auto-step-that-cannot-run Phase 2 · Done by repair-command-before-proof | aug-18-improv |  | Done |
| B-108 | 2026-09-02 | 💡 idea |  |  | `scripts/lib/journey-runner.mjs`'s `commitCapture` buffers a whole billed run and writes it once at the end, so a smoke or journey run killed after several completed journeys loses every paid row — the failure `openCapture` now prevents for the probe. The two harness consumers could claim their destination up front and append per journey the same way | build: harness-evidence-freshness Phase 1 · Planned by preserve-paid-rows-on-interrupt · Done by preserve-paid-rows-on-interrupt · detail in 1f3b94e | aug-18-improv |  | Done |
| B-109 | 2026-09-02 | 🐛 bug | med? |  | `tests/cli/merge.test.mjs` is gated by no audit check — check 30 names `esq.test.mjs`, `branch.test.mjs` and `ship.test.mjs` explicitly — so a red merge suite, covering the only CLI code that writes to git, still leaves `./scripts/audit.sh` at exit 0 | build: harness-evidence-freshness Phase 2 · Done by retire-manual-cli-fallbacks | aug-18-improv |  | Done |
| B-110 | 2026-09-02 | 🐛 bug | med? |  | `scripts/check-sharedblocks.sh` cannot be pointed at `plugin/skills` — it globs `<dir>/*.md` and exits 2 on the plugin tree, so the shared blocks are only ever compared in `commands/esq`; when the legacy rollback copies go, nothing checks the source of truth | build: harness-evidence-freshness Phase 3 · Planned by retire-legacy-rollback-path · Done by retire-legacy-rollback-path | aug-18-improv |  | Done |
| B-111 | 2026-09-02 | 🐛 bug |  |  | `docs/ARCHITECTURE.md` § `scripts/audit.sh` still says "44 numbered checks" and its extracted-pair list ends at 40/41 — 42, 43/44, 45/46 and 47/48 are missing, so a contributor reading the guard-suite contract gets a list that no longer describes the suite | build: harness-evidence-freshness Phase 4 · Done by sweep (docs(arch) refresh 2026-09-08 — text now cites 53 checks and names 42/47/48) | aug-18-improv |  | Done |
| B-112 | 2026-09-02 | 🐛 bug | hi |  | Stale routing evidence has no executable recovery — the three relays pin Sonnet, so `/model opus` cannot satisfy their own preflight | manual (blocked /esq:converge on harness-evidence-freshness, 2026-09-02) · Done by relay-inherits-the-session-model · detail in 1f3b94e | aug-18-improv |  | Done |
| B-113 | 2026-09-03 | 💡 idea | lo? |  | `scripts/audit.sh`'s green line for check 48 enumerates only the registry cases and never mentions the relay-model cases, so a reader auditing coverage from the audit output alone concludes a re-pinned relay is unguarded | build: relay-inherits-the-session-model Phase 2 · Dropped: Retire the removed audit check 48 label task. | aug-18-improv |  | Dropped |
| B-114 | 2026-09-03 | 🐛 bug | med? |  | Nothing mechanizes README § Model recommendations against the skills' actual `model:` frontmatter — check 47's assertion 4 reads only the `M-` measurement IDs — so a flipped pin leaves the table telling a reader the wrong model to set their session to; corrected by hand twice now (2026-08-19 relay pin, 2026-09-03 `inherit`) | review: relay-inherits-the-session-model · Dropped: Retire synchronization of the removed model-recommendations table. | aug-18-improv |  | Dropped |
| B-115 | 2026-09-03 | ⚠️ debt |  |  | README's own B-047 interactive-pin protocol produces rows `esq validate` reds — a `current`/`superseded` measurement with an empty `Capture` is a fault, so following the documented protocol blocks every session stop | review: harness-evidence-freshness · Planned by harness-evidence-freshness-fixes-2 · Done by harness-evidence-freshness-fixes-2 · detail in 1f3b94e | aug-18-improv |  | Done |
| B-116 | 2026-09-04 | 🐛 bug | hi |  | Branch lifecycle targets the repo default branch instead of the branch where work began | manual · Planned by origin-branch-owns-landing · detail in 1f3b94e |  |  | Done |
| B-117 | 2026-09-04 | ☑️ task | med? |  | Check 42's five branch-ownership assertions have no fault injection — it is inline in `audit.sh` with no paired `scripts/test-*.sh`, so a loosened needle or a broken `branch_holds` stops guarding silently | build: origin-branch-owns-landing Phase 4 · Dropped: check 42, the prose duplicate of the branch-ownership contract, was removed on 2026-09-22 — there is no longer an uninjected assertion to inject. The verdict itself is the CLI's and is covered by tests/cli/branch.test.mjs. |  |  | Dropped |
| B-118 | 2026-09-04 | 🐛 bug | med? | 2000 | Optional live plan-to-recorded-origin landing journey beyond deterministic merge tests. | check: origin-branch-owns-landing |  |  | Open |
| B-119 | 2026-09-04 | ⚠️ debt |  |  | Collapsing the landing to six gates deleted the only check of HEAD against the plan's `**Branch:**` and nothing replaced it — `/esq:converge <plan>` invoked from another branch commits its fixes there, then lands `esq/<slug>` into `**Origin:**` without them and reports `✔ landed` | fix: 2026-09-04-origin-branch-owns-landing-fixes · Planned by origin-branch-owns-landing-fixes · Done by origin-branch-owns-landing-fixes · detail in 1f3b94e |  |  | Done |
| B-120 | 2026-09-04 | ⚠️ debt |  |  | On the `owned-elsewhere` branch verdict, build's and converge's refusal option sets leave no `do:` that clears the gate — the leaning A (`git switch -c esq/<plan-slug>`) turns the next run into a `mismatch`, and B and C, the only options that reconcile the header, are explicitly dropped for that verdict | fix: 2026-09-04-origin-branch-owns-landing-fixes · Planned by origin-branch-owns-landing-fixes-fixes · Done by origin-branch-owns-landing-fixes-fixes · detail in 1f3b94e |  |  | Done |
| B-121 | 2026-09-05 | ✨ improvement |  |  | Telemetry carries no plan identity, so the outcome join can only attribute temporally and this repo's overlapping plans defeat it — 824 of 923 recorded runs land in two or more plan windows, leaving 11% coverage and 3 segmented plans out of 61, all thin, so the epic's cost-vs-outcome question stays unanswerable for anyone who runs the command; the fix is a plan slug on the telemetry label, not a looser window (D-a-run-belongs-to-one-plan-window) | build: outcome-linked-workflow-measurement Phase 3 · Planned by outcome-attribution-coverage · Done by owner decision 2026-09-07 (closed at observed coverage) · detail in 1f3b94e | aug-18-improv |  | Done |
| B-122 | 2026-09-05 | ✨ improvement | lo? |  | Nothing checks that a script under `scripts/` appears in README's Operations table — check 4 holds the `/esq:` command tables exhaustive but the scripts table is unguarded, so a contributor adding a script (as `outcome-join.mjs` just did) can ship it undiscoverable and the audit stays green | build: outcome-linked-workflow-measurement Phase 4 · Dropped: Retire exhaustive policing of the removed Operations table. |  |  | Dropped |
| B-123 | 2026-09-05 | 🐛 bug |  |  | `docs/ARCHITECTURE.md` quotes a measured test count and duration for check 39 that nothing verifies — it had drifted from 129 tests / 2.7 s to 155 / 1.7 s across three suite additions before Phase 4 re-measured it, so every reader between 2026-08-31 and 2026-09-05 cited a figure 26 tests low | build: outcome-linked-workflow-measurement Phase 4 · Done by sweep (docs cite 183 tests / 3.0 s measured 2026-09-06, no stale figure remains) |  |  | Done |
| B-124 | 2026-09-05 | ⚠️ debt |  |  | The outcome join's accepted rate escapes the sample threshold on its own denominator — `thin` is decided by plan count, but the rate is `acceptedDone / acceptedRows` over backlog rows, so a segment clearing 5 plans can publish an acceptance percentage computed from a single row beside reopen and defect rates resting on five | fix: 2026-09-05-outcome-linked-workflow-measurement-fixes · Planned by outcome-linked-workflow-measurement-fixes · Done by 2026-09-05-outcome-linked-workflow-measurement-fixes · detail in 1f3b94e | aug-18-improv |  | Done |
| B-125 | 2026-09-06 | ☑️ todo |  |  | A frozen outcome-baseline document carries no Claude Code version, so two baselines taken on different harness versions are indistinguishable — which breaks the one comparison the freeze exists for; emit `claudeCode` under `--json --baseline-gate` alone, through the same bounded `claude --version` seam `esq evidence` uses | build: outcome-attribution-coverage Phase 6 · Planned by outcome-attribution-coverage · Done by outcome-attribution-coverage | aug-18-improv |  | Done |
| B-126 | 2026-09-06 | 🐛 bug |  |  | The baseline gate judges one arbitrary cell per lane instead of asking whether *any* cell qualifies — `gateCell` returns the largest-plan segment, so a 6-plan cell with a thin accepted denominator fails a lane that holds a fully valid 5-plan cell, and the printed distance is that arbitrary cell's rather than the closest miss's | manual · Planned by outcome-attribution-coverage · Done by outcome-attribution-coverage · detail in 1f3b94e | aug-18-improv |  | Done |
| B-127 | 2026-09-06 | 🐛 bug | med? |  | `esq lane stats` undercounts corrective passes: `plugin/lib/cli.mjs:337` groups briefs with `/-fixes\.brief\.md$/`, which misses every `-fixes-2`/`-fixes-3` uniquifier the finders append and every `-fixes-fixes` re-round — ten of this repo's fifty-seven briefs — so a plan's brief count, its post-pass-defect accounting and the lane's finder budget all read low, and the lane-cost numbers those feed are cited as evidence | review: outcome-attribution-coverage · Dropped: its whole subject was `esq lane stats` undercounting corrective passes; that command retired with the assurance lanes on 2026-09-22. The brief-grouping shape it named is handled by CORRECTIVE_BRIEF, which matches -fixes, -fixes-N and -fixes-fixes alike (verified). |  |  | Dropped |
| B-128 | 2026-09-06 | 🐛 bug | hi |  | Plan-bearing orchestrator spawns can emit the dated filename stem (`2026-09-05-outcome-attribution-coverage`) instead of the canonical plan slug — the hook accepts it syntactically but `outcome-join` cannot resolve it, so valid check/review/fix runs classify as `unknownIdentity` (3 of 12 local rows; cohort coverage 56%, `--baseline-gate` exit 3), which blocks B-121's completion condition; canonical slug derivation must become machine-owned and shared by advance/autopilot/converge — another prose instruction is insufficient — and must decide explicitly how the three already-recorded dated identities are handled without silently forgiving arbitrary unknown slugs | manual (`node scripts/outcome-join.mjs --baseline-gate` against the live store, 2026-09-06 — exit 3) · Done by spawned-plan-identity-source · detail in 1f3b94e | aug-18-improv |  | Done |
| B-129 | 2026-09-06 | 🐛 bug | hi? |  | Make roadmap completion rollups respect outstanding item acceptance rather than equating a completed plan with a delivered outcome. | manual (roadmap refresh 2026-09-06, cc185da) · Done by roadmap-acceptance |  |  | Done |
| B-130 | 2026-09-07 | ✨ improvement | lo? | 2900 | Add a minor/major local release choice when a release actually requires it. | build: local-plugin-release-workflow Phase 2 |  |  | Open |
| B-131 | 2026-09-07 | ⚠️ debt | med? |  | `plugin/skills/plan/SKILL.md` sits at 499 lines against `check-plugin.sh`'s 500-line entrypoint cap, and a non-build skill has no sanctioned split — `check-skill-parity.sh` compares the legacy mirror byte-for-byte against the whole skill body — so the next addition to `/esq:plan` reds the audit with no remedy but deleting prose someone wrote on purpose | build: fewer-round-trips-per-run Phase 2 · Planned by retire-legacy-rollback-path · Done by retire-legacy-rollback-path |  |  | Done |
| B-132 | 2026-09-08 | 🐛 bug | hi |  | scripts/update.sh could never release: it runs the audit only when a release is needed, and check 51 fires exactly in that state, so the gate waited on the finding the run existed to clear | manual (a release blocked on its own drift finding) · Done inline |  |  | Done |
| B-133 | 2026-09-09 | ☑️ todo | med? | 1800 | Clarify the remaining journey-promotion cost/version warning at the point of use. | build: 2026-09-08-background-task-lifecycle Phase 3 |  |  | Open |
| B-134 | 2026-09-09 | 🐛 bug |  |  | Duplicate of B-110 — `scripts/check-sharedblocks.sh` cannot be pointed at the native skill tree; B-110 (2026-09-02) already carries this defect and stays Open | build: 2026-09-08-background-task-lifecycle Phase 4 · Dropped: duplicate of B-110 | aug-18-improv |  | Dropped |
| B-135 | 2026-09-09 | ⚠️ debt |  |  | `journey-runner`'s `runOne` resolves only on `close`, so a timeout's SIGKILL lands but the wait continues until every inherited pipe closes — and the `background-lifecycle` journey is the one run that deliberately leaves surviving children, so the leak it exists to red on is the case where its own deadline may not fire | fix: 2026-09-09-background-task-lifecycle-fixes · Planned by background-task-lifecycle-fixes · detail in 1f3b94e | aug-18-improv |  | Done |
| B-136 | 2026-09-09 | 🐛 bug |  |  | Interrupting a multi-row billed run discards the paid records of the rows that already completed — `live`'s SIGINT/SIGTERM handlers exit the process, so `commitCapture` in its `finally` never runs and nothing is kept anywhere; a contributor who Ctrl-Cs after row 1 of 4 loses that row's money, against this module's own rule that evidence already billed is never discarded | build: 2026-09-09-background-task-lifecycle-fixes Phase 1 · Planned by preserve-paid-rows-on-interrupt · Done by preserve-paid-rows-on-interrupt · detail in 1f3b94e | aug-18-improv |  | Done |
| B-137 | 2026-09-09 | 💡 idea |  |  | Nothing checks that a build phase actually recorded a `verified` block, so a phase that omits one silently returns the landing gate to full price | build: restore-converge-and-clean-handoffs Phase 2 · Planned by verified-provenance-is-required · Done by verified-provenance-is-required · detail in 1f3b94e |  |  | Done |
| B-138 | 2026-09-09 | 🐛 bug |  |  | `esq branch resolve` decides `reuse` from ancestry, so a stem landed by cherry-pick still reads as in flight and hands a correction a branch nobody will merge again — the exact failure the verb was added to remove | build: restore-converge-and-clean-handoffs Phase 3 · Planned by restore-converge-and-clean-handoffs-fixes-fixes · Done by restore-converge-and-clean-handoffs-fixes-fixes |  |  | Done |
| B-139 | 2026-09-09 | 🐛 bug |  |  | `check-update-handoff.sh`'s ARCHITECTURE exception matches any line carrying both `primitive` and `update.sh`, not the § Boundaries bullet it was written for — today that also matches the audit's check catalogue at line 37, so a handoff prescribed on either line ships unreported with check 55 green | build: restore-converge-and-clean-handoffs Phase 4 · Planned by restore-converge-and-clean-handoffs-fixes-fixes · Done by restore-converge-and-clean-handoffs-fixes-fixes |  |  | Done |
| B-140 | 2026-09-09 | 🐛 bug |  |  | `check-update-handoff.sh` scans line by line, so a prescription whose imperative cue wraps onto the previous line is invisible to it, and a plain Markdown reflow can move a cue onto the command's line and red the build for no change in meaning | build: restore-converge-and-clean-handoffs Phase 4 · Planned by restore-converge-and-clean-handoffs-fixes-fixes · Done by restore-converge-and-clean-handoffs-fixes-fixes |  |  | Done |
| B-141 | 2026-09-09 | ⚠️ debt | med? | 2800 | Resolve concrete contradictory Active decisions by semantic review; do not promise a generic contradiction detector. | check: restore-converge-and-clean-handoffs |  |  | Open |
| B-142 | 2026-09-09 | ⚠️ debt |  |  | Check 55 cannot see `scripts/release-local.sh` — `ROOT_SURFACES` omits the sibling whose `--check` report a maintainer reads on the way to a release, and the README-ops-row exception is justified by a sentence that does not describe the row it exempts | fix: 2026-09-09-restore-converge-and-clean-handoffs-fixes · Planned by restore-converge-and-clean-handoffs-fixes · Done by restore-converge-and-clean-handoffs-fixes · detail in 1f3b94e |  |  | Done |
| B-143 | 2026-09-09 | ⚠️ debt |  |  | `docs/SPEC.md` still documents the `/esq:converge` behavior this change replaced, in five places (Résumé, Fonctionnement, Règles métier's four-subagent bound, a `Superseded` decision citation, and a CLI verb list missing `esq branch resolve` and `esq gate verify`) | fix: 2026-09-09-restore-converge-and-clean-handoffs-fixes · Done by /esq:spec · detail in 1f3b94e |  |  | Done |
| B-144 | 2026-09-09 | 🐛 bug |  |  | A check script that fails to parse exits 2, which `audit.sh` renders as `– skipped:` and still summarises `Clean` — so a guard can be silently switched off while the gate stays green; hit for real when an apostrophe inside `check-update-handoff.sh`'s single-quoted awk program closed the quote and only running the check directly showed check 55 was no longer running | build: restore-converge-and-clean-handoffs-fixes Phase 2 · Planned by restore-converge-and-clean-handoffs-fixes-fixes · Done by restore-converge-and-clean-handoffs-fixes-fixes |  |  | Done |
| B-145 | 2026-09-09 | 🐛 bug |  |  | Four skills still define a paused phase by the literal `⏸ awaiting manual verification` rather than by the `⏸` glyph — /esq:check (SKILL.md:122 and its commands/esq mirror), /esq:status (:71, :83, :241), /esq:epic (:127) and /esq:roadmap (:103) — so a plan carrying a `⏸ blocked on an open same-unit defect` entry matches neither documented literal: /esq:check has no written instruction for it and /esq:status cannot classify it as paused, and the user auditing a blocked plan gets an incomplete report | build: restore-converge-and-clean-handoffs-fixes-fixes Phase 4 · Done by restore-converge-and-clean-handoffs-fixes-fixes |  |  | Done |
| B-146 | 2026-09-10 | 🐛 bug | med? |  | Roadmap refresh reports a `needs:` entry blocked forever once its target ages out of the 5-line Shipped tail | manual · Planned by roadmap-needs-survives-tail-pruning · Done by roadmap-needs-survives-tail-pruning · detail in 1f3b94e | roadmap |  | Done |
| B-147 | 2026-09-11 | ⚠️ debt |  |  | `/esq:review`'s delta scope reads only a prior brief's `Reviewed at:` stamp and never the plan's `**Reviewed at:**`, so every `stale` → `/esq:review <plan>` that `/esq:land` issues after a clean review buys a full re-review of the whole unit — even when the only commit since is a `docs(arch):` skills commit the review's own metadata filter ignores | fix: 2026-09-11-landing-is-its-own-command-fixes · Planned by landing-is-its-own-command-fixes · Done by landing-is-its-own-command-fixes · detail in 1f3b94e |  |  | Done |
| B-148 | 2026-09-11 | ⚠️ debt |  |  | Nothing retires a corrective brief once its 🟡s are planned, so `unit.findings` reports every planned brief as live forever and `/esq:land` step 8 refuses the unit, naming `/esq:plan <brief>` for work already planned — decided 2026-09-11: `/esq:plan` retires the brief it plans | fix: 2026-09-11-landing-is-its-own-command-fixes · Planned by landing-is-its-own-command-fixes · Done by landing-is-its-own-command-fixes · detail in 1f3b94e |  |  | Done |
| B-149 | 2026-09-11 | ☑️ todo | med? |  | Historical consumed-brief cleanup is outside this public snapshot. | plan: landing-is-its-own-command-fixes · Dropped: The snapshot-local historical brief cleanup has no subject in the public repository. |  |  | Dropped |
| B-150 | 2026-09-11 | ⚠️ debt |  |  | `/esq:land` checks phase completeness only for the plan it was handed, while coverage and verification cover the whole unit — an unbuilt `-fixes` plan on the same branch either reds the gate with a failing test as `→ Next` or merges a branch whose corrective plan never shipped | fix: 2026-09-11-land-verifies-the-whole-unit-fixes · Planned by land-verifies-the-whole-unit-fixes · Done by land-verifies-the-whole-unit-fixes · detail in 1f3b94e |  |  | Done |
| B-151 | 2026-09-12 | ✨ improvement |  |  | Per-path re-read instrument over esq-labelled agent transcripts — scripts/measure-rereads.mjs (classifier v3), its fixture suite gated by audit check 39, the frozen reading at docs/baselines/2026-09-11-reread-baseline.json, and the documented inconclusive result. The measurement deliverable B-070 asked for; it does NOT deliver B-070's performance improvement, which stays open | build: measure-the-reread-rate + measure-the-reread-rate-fixes · Done by measure-the-reread-rate · detail in 1f3b94e | aug-18-improv |  | Done |
| B-152 | 2026-09-12 | 💡 idea |  |  | A phase paused for its (manual) steps can still reach completed with no verified block — the next build run flips the header by hand, never through append-log, so the refusal that covers a completed entry does not cover that path | build: verified-provenance-is-required Phase 1 · Planned by preserve-proof-through-manual-pauses · Done by preserve-proof-through-manual-pauses · detail in 1f3b94e |  |  | Done |
| B-153 | 2026-09-13 | ✨ improvement | med |  | build's SKILL.md pays for the branch-refusal and manual-verification procedures on every ordinary phase — a subset of B-012, which it does not close | manual · Planned by build-loads-its-rare-procedures · Done by build-loads-its-rare-procedures · detail in 1f3b94e |  |  | Done |
| B-3000 | 2026-09-13 | tech-debt | P2 |  | /esq:plan's SKILL.md sits at 499 of check-plugin.sh's 500-line cap, and the split that would relieve it breaks check-skill-parity.sh's byte-equality rule for every skill but build | observed: /esq:build phase 2 of verification-buys-each-proof-once (2026-09-13) · Planned by plan-loads-what-it-needs · Done by plan-loads-what-it-needs · detail in 1f3b94e |  |  | Done |
| B-154 | 2026-09-13 | 🐛 bug | hi |  | `/esq:land` resolves no landing location: `esq merge land` always merges in the invoking checkout, so when the plan header's `**Origin:**` is checked out in another linked worktree the run pays the full `esq gate verify` audit and only then refuses at `git switch` — and the handoff it prints (`/esq:worktree merge <branch> into <dest>`) names no working directory, so re-running it from the same source worktree fails identically | observed: /esq:land docs/plans/2026-09-12-show-the-failing-test.md from a linked worktree (2026-09-13) · Planned by land-resolves-its-worktree · Done by land-resolves-its-worktree · detail in 1f3b94e |  |  | Done |
| B-155 | 2026-09-14 | improvement | med |  | The landing gate reruns a command whose inputs are all unchanged — `esq gate verify` invalidates a proof on *any* changed path outside its lifecycle exemptions, so a command that reads none of them still runs. Measured on `land-resolves-its-worktree` at its landing HEAD 28e6daa: four required commands, four runs, and `node --test tests/cli/merge.test.mjs` (proved at 0893d89) was invalidated only by README.md, commands/esq/land.md, docs/ARCHITECTURE.md, docs/CONFORMANCE.md, plugin/skills/land/SKILL.md, scripts/check-conformance.sh, scripts/test-conformance-guard.sh and tests/cli/worktree-landing.test.mjs — none of which that suite reads (it imports `plugin/lib/cli.mjs` and spawns `plugin/bin/esq`, and every docs path it touches is inside a throwaway temp repo it creates). The other three were legitimately invalidated: worktree-landing.test.mjs by its own file, branch.test.mjs by `plugin/lib/cli.mjs`, and `./scripts/audit.sh` by README.md (check 4 reads it) and the changed test file. Wanted: an opt-in, authored declaration of what a command reads, honored only where declared, never inferred from the command string — with the reason naming the whole invalidating set rather than only its first path | manual (evidence measured 2026-09-13 against the real landing gate, see summary) · Planned by scope-freshness-to-declared-inputs · Done by scope-freshness-to-declared-inputs · detail in 1f3b94e |  |  | Done |
| B-156 | 2026-09-14 | debt |  |  | `plugin/skills/plan/SKILL.md` is at 499 lines against `check-plugin.sh`'s hard `-lt 500` (scripts/check-plugin.sh:100), so the next contributor who adds one rule to `/esq:plan` reds the commit gate with no guidance — and the sanctioned relief, progressive disclosure into `references/`, is allowed by `check-skill-parity.sh` for `build` alone (scripts/check-skill-parity.sh:24-41): every other skill's legacy mirror must equal its SKILL.md body byte for byte. Adding the `(reads)` rule here cost one wrapped sentence joined elsewhere in the file to stay under the cap. Wanted: either the parity check learns the split layout for any skill, or the cap grows with a stated reason, so the choice is not between refusing a rule and compacting unrelated prose | observed: scope-freshness-to-declared-inputs Phase 2 · Planned by plan-loads-what-it-needs · Done by plan-loads-what-it-needs · detail in 1f3b94e |  |  | Done |
| B-157 | 2026-09-14 | ⚠️ debt | med? |  | check-skill-parity.sh (audit check 27) has no fault injection of its own, and the split-skill list it now reads makes one direction silent: a skill wrongly named in SPLIT_SKILLS drops from byte-equal parity to the weaker line-presence rule with no finding — a reworded or reordered legacy body would then pass. Every other check in the suite ships a test-*-guard.sh pair; this one never had one, so the audit-scripts contract ("a check with no fault injection is unproven") is unmet exactly where parity is now configurable | review: plan-loads-what-it-needs · Planned by retire-legacy-rollback-path · Done by retire-legacy-rollback-path |  |  | Done |
| B-158 | 2026-09-14 | ✨ improvement | lo? | 2700 | Check that actual D-slug references resolve, starting with a demonstrated dead reference. | review: build-cites-rather-than-recites |  |  | Open |
| B-159 | 2026-09-15 | ✨ improvement |  |  | build's SKILL.md plus reporting-and-stops.md pay 1,315 words for the failure report, decision and recovery procedure on every successful phase — a sibling of B-153, and it closes nothing of B-012 | manual · Planned by build-loads-failure-on-demand · Done by build-loads-failure-on-demand · detail in 1f3b94e |  |  | Done |
| B-160 | 2026-09-15 | ✨ improvement | lo? |  | check-refload.sh pins only entrypoint call sites, so the two load reminders manual-verification.md carries for the failure procedure can be deleted with nothing reddening — the obligation itself stays pinned in build's entrypoint, so this is thin coverage rather than an open route | build: build-loads-failure-on-demand Phase 1 · Dropped: Retire lexical refload-reminder coverage. |  |  | Dropped |
| B-161 | 2026-09-15 | ✨ improvement | med |  | /esq:build's CLI preflight spends a skeleton grep plus up to three dependent slice reads to obtain plan context that `esq next-phase` already parses — the classification response names the phase but carries none of the plan text, so the worker re-derives L/A and issues a second read stage for facts one response could supply | manual (read-path audit of build preflight step 4) · Done by build-reads-its-context-once · detail in 1f3b94e |  |  | Done |
| B-162 | 2026-09-15 | ✨ improvement | lo? |  | nothing mechanically checks that /esq:build's preflight prose names the keys `esq next-phase --context` actually emits — parity holds the two build carriers together and tests/cli/esq.test.mjs holds the response shape, but a renamed context key would leave the skill describing fields the CLI no longer returns with nothing reddening; the CLI-unavailable fallback still works, so this is thin coverage rather than an open route | build: build-reads-its-context-once Phase 1 · Dropped: Retire prose-key parity across removed mirrors and fallback. |  |  | Dropped |
| B-163 | 2026-09-15 | ✨ improvement | lo? |  | Stop extracting a documentation path as an executable auto-step command while preserving legitimate executable paths. | observed: build-reads-its-context-once Phase 1 · Done by B-163 auto-command correction |  |  | Done |
| B-164 | 2026-09-15 | 🐛 bug |  |  | esq plan resolve-block's read-only ask picks the pause in log insertion order (pausedPhase) while /esq:build routes to the lowest-numbered one (nextPhase) — on a log with two pauses appended out of phase order the worker settles the wrong phase's obligations and the pause build waits on stays open | review: build-reads-its-context-once · Planned by resolve-block-follows-build · Done by resolve-block-follows-build · detail in 1f3b94e |  |  | Done |
| B-165 | 2026-09-16 | ⚠️ debt | med? |  | build's failure route says "report in the three zones" but never loads the conclusion block that defines them | observed: bookkeeping-loads-on-demand · Done by existing failure report at e1c24c0 |  |  | Done |
| B-166 | 2026-09-17 | ⚠️ debt |  |  | an Active decision "the user made or approved" has no observable form — docs/DECISIONS.md records Scope, Topic, Date and Status, never who authorized an entry, so a decision a worker wrote about its own run reads as authorization to check, review and the ask-altitude threshold (plugin/skills/check/SKILL.md:141, plugin/skills/review/SKILL.md:177, both legacy mirrors); the discriminator must be chosen (commit provenance, or an explicit authorization field) and applied across both trees with a needle and a fault per clause, and it changes what /esq:build writes when it records a decision | review: ask-only-missing-authority · Planned by 2026-09-17-ask-only-missing-authority-fixes · Done by 2026-09-17-ask-only-missing-authority-fixes · detail in 1f3b94e |  |  | Done |
| B-167 | 2026-09-19 | 🐛 bug | lo? |  | The redesign path's capture budget can be fully consumed before the directions are rendered — `/esq:ui`'s announced bound is `at most 8 captures` and Pass 2 alone is allowed `at most 8 captures`, so a run that spends its Pass 2 allowance deliberately has nothing left for Pass 4's mandatory "render each one and look at it" (2 directions × 2 themes), and the bound's own remedy is to stop and say what it did not cover — i.e. hand back two directions nobody opened, which is exactly the failure the greenfield floor was built to prevent. Wanted: Pass 2's share stated as a number below the ceiling, with Pass 4's per-direction-per-theme captures reserved, the way `## Greenfield mode` now does it | review: ui-greenfield-output-floor · Done inline |  |  | Done |
| B-168 | 2026-09-19 | 🐛 bug |  |  | ui-greenfield-output-floor-fixes Phase 1's eyeball grep matches Pass 4's unchanged redesign sentence, so it can never pass as written | build: ui-greenfield-output-floor-fixes Phase 1 · Done by ui-greenfield-output-floor-fixes · detail in 1f3b94e |  |  | Done |
| B-169 | 2026-09-19 | ✨ improvement | hi | 450 | Autonomy epic: A and standards arbitration B delivered; finish D via B-179, then evidence-led specialist guidance C. | work | esq-decides-implementation-detail |  | Open |
| B-170 | 2026-09-20 | improvement | hi |  | Le backlog n'a aucun rang d'ordonnancement : 40 des 51 items ouverts n'ont aucune priorité et 3 seulement en portent une confirmée, donc « c'est quoi le prochain » n'a de réponse que pour les 16 blocs groupés de la roadmap. Voulu : chaque item porte en tout temps une priorité ET un rang à l'intérieur de cette priorité, assignés automatiquement, dans chaque projet — un ordre total, pas trois seaux | manual (user, 2026-09-20) · Planned by every-open-item-is-ranked · Done by every-open-item-is-ranked |  |  | Done |
| B-171 | 2026-09-20 | 🐛 bug | med? |  | The hooks tmpdir-leak assertion excludes only `esq-` prefixed entries, so running every suite in one node --test process reds it on `worktree-landing`'s deliberate `esq wt-` fixture | observed: every-open-item-is-ranked Phase 1 · Dropped: Retire the removed tmpdir-leak assertion defect. |  |  | Dropped |
| B-172 | 2026-09-20 | ✨ improvement | lo? |  | Assign an initial rank when adding a backlog row; keep the sequence complete without a separate rerank. | build: every-open-item-is-ranked Phase 3 · Done by backlog-rank-lifecycle |  |  | Done |
| B-173 | 2026-09-20 | ✨ improvement | lo? |  | /esq:roadmap Mode C edits the order but writes no Rank, so a move or an edge change leaves the stored sequence stale until /esq:roadmap plan is re-run | build: every-open-item-is-ranked Phase 4 · Planned by every-open-item-is-ranked-fixes · Done by every-open-item-is-ranked-fixes |  |  | Done |
| B-174 | 2026-09-21 | debt | med? |  | A `⏸ awaiting manual verification` pause on a project with no instrument can no longer be resolved by the written procedure — beb5e8f closed step 3 of `plugin/skills/build/references/manual-verification.md` to the missing-instrument case and the resume path re-runs the same procedure, so a driverless project pauses, re-probes, finds nothing, is barred from step 3 and loops; it also over-shoots `D-the-observation-path-not-the-instrument`, which preserves an ask about the *result*. Redraw: failed-launch/absent-resource-as-engineering-question closed, observation-result ask kept — a guard-assertion change across five files, not a reword | review: observation-path-before-manual · Planned by observation-path-before-manual-fixes · Done by observation-path-before-manual-fixes |  |  | Done |
| B-175 | 2026-09-21 | debt | med? |  | The two clauses that authorize and classify the `(manual)` pause still key on instrument presence, the trigger this unit retired — `plugin/skills/build/SKILL.md` and `plugin/skills/build/references/reporting-and-stops.md` — so the missing starting-state case (a run skill that launches the app but cannot create the record the step observes) reaches item 2 of the disposition, exceeds the phase mandate and is told to take the blocked or failure exit, while the only clause describing that exit for manual steps requires that no instrument was found at all: no bullet matches the run state and no [authority] stop is classified for it | review: observation-path-before-manual · Planned by observation-path-before-manual-fixes · Done by observation-path-before-manual-fixes |  |  | Done |
| B-176 | 2026-09-21 | debt | med? |  | Nothing pins the last phase's route-derived hand-off: a migration could delete "the route decides it, not a constant" from both carriers and the audit stays green, leaving every completed plan handing back a guessed command | observed: observation-path-before-manual-fixes Phase 1 · Dropped: Retire the lexical handoff-sentence pin. |  |  | Dropped |
| B-177 | 2026-09-21 | ⚠️ debt | hi |  | The parent plan's Phase 1 verification step still names the outrun fixed base 2ac72b6 for plugin/skills/plan/SKILL.md (docs/plans/2026-09-18-observation-path-before-manual.md:244), so it reds at landing on main's own work — merging main on 2026-09-20 brought 44c291e and 78ce894, which edit that file, and the fixed base can no longer isolate this unit's share; re-base the step to main as the sibling step in the fixes plan already is (authorized 2026-09-20, commit 7b00fdd), carrying the same amendment note | fix: observation-path-before-manual-fixes-fixes · Planned by observation-path-before-manual-fixes-fixes · Done by observation-path-before-manual-fixes-fixes |  |  | Done |
| B-178 | 2026-09-21 | ⚠️ debt | hi |  | Two `Done looks like` bullets assert plugin/skills/plan/SKILL.md is byte-unchanged from 2ac72b6 (docs/plans/2026-09-18-observation-path-before-manual-fixes.md:92 and docs/plans/2026-09-18-observation-path-before-manual.md:100), which is false at HEAD: main's own 44c291e and 78ce894 edit that file. The claim the bullets were written to make — this unit never touched the plan entrypoint — is true only against main, the reference the unit actually lands on; re-base both bullets there with the same amendment named | fix: observation-path-before-manual-fixes-fixes · Planned by observation-path-before-manual-fixes-fixes · Done by observation-path-before-manual-fixes-fixes |  |  | Done |
| B-179 | 2026-09-21 | debt | hi |  | Provide a bounded safe correction/disposition for a completed plan when corrective depth is exhausted. | observed: /esq:converge on observation-path-before-manual-fixes-fixes, 2026-09-21 | esq-decides-implementation-detail |  | Done |
| B-180 | 2026-09-21 | debt | hi? |  | Invalidate reused verification when declared plan or ledger inputs change, retaining harmless bookkeeping reuse. | review: observation-path-before-manual-fixes-fixes · Done by verification-inputs-before-lifecycle |  |  | Done |
| B-181 | 2026-09-25 | ✨ improvement | hi | 3100 | Carry the user outcome through feature framing, UX defaults and architecture tradeoffs without an unnecessary re-grill. | observed: grill-plan preparation review 2026-09-24 |  |  | Open |
| B-182 | 2026-09-25 | ✨ improvement | hi | 3200 | Keep preparation focused on real outcomes and relevant decisions, with conditional guidance and concise output. | observed: adversarial preparation review 2026-09-24 |  |  | Open |
| B-183 | 2026-09-25 | ✨ improvement | hi? |  | Correct architecture authority and reporting instructions; remove the planner alternative quota. | observed: adversarial preparation and architecture review 2026-09-24 · Done by architecture-preparation-review |  |  | Done |
| B-184 | 2026-09-25 | 🐛 bug | med? |  | Reconcile duplicate tail ranks when independently captured backlog rows merge. | observed: B-003 retained-branch regression; independent rows both carry Rank 100 · Done by merge-rank-collisions |  |  | Done |
| B-185 | 2026-09-25 | 🐛 bug | hi |  | Preserve significant whitespace in auto commands through Markdown extraction and landing proof reuse. | observed: events-tracker landing plan 2026-09-24-vitrine-fonctions-recentes-multi-membre, command line 232 and proof line 295 · Done by preserve-command-whitespace |  |  | Done |

---

<!-- Detail sections below. Required for ⚠️ debt and Needs-decision items; optional otherwise. -->

## B-184 — Independent captures can merge with duplicate tail ranks

**Observed (2026-09-24):** The B-003 scratch regression creates two independent
backlog rows through `addRow`, each starting from an empty backlog. They receive
distinct IDs (`B-1000`, `B-2000`) but both carry Rank 100. Both merges seal through
the existing engine; `validate` then reports `duplicate backlog rank 100: B-2000
and B-1000`. ID preservation succeeds; whole-ledger validity does not.

**Scope:** Reconcile ranks of different incoming rows without changing permanent
IDs, priority or intentional ordering. This interaction predates the B-003 scan:
tail allocation and merge code are unchanged. It is outside retained-branch ID
reservation and outside B-005's ancestor-present duplicate-ID scenario.

**Evidence:** [B-003 implementation record](preparation/2026-09-24-b003-retained-branch.md).
At capture, no correction or product-order decision was claimed. The local
correction and its verification are recorded in the resolution below and the
[B-184 implementation record](preparation/2026-09-24-b184-merge-ranks.md).

**Resolution:** 2026-09-24: Merge sealing reconciles independent equal ranks while preserving IDs, priorities and stored ordering edits; incompatible placements and divergent edits to the same Rank require resolution. B-003 now validates after both merges; four additional real-Git regressions cover deliberate order, marker-free collisions and refusal/abort/resolution. One native ./scripts/audit.sh passed 7/7 product checks. See docs/preparation/2026-09-24-b184-merge-ranks.md. Local only; no push or publication.

## B-003 — A freed ID block can be re-handed-out while an unmerged branch still holds its IDs

**Delivered scope (2026-09-24):** Reproduced on the current runtime, then fixed in the existing locked allocator. Local branch backlog blobs now witness occupied blocks after worktree removal. Allocation, reopening and both merges preserve the original IDs. See the resolution and linked evidence below; duplicate Rank cells are separately recorded in B-184.

**What:** Block reservation picks the lowest index held by no live worktree and witnessed by no
`B-NNN` in the *main* tree's `docs/BACKLOG.md`. `/esq:worktree rm` deliberately preserves an unmerged
branch after removing its directory — which removes the `.esq-id-block` marker too. The IDs that
branch already minted live only on the branch, so neither clause sees them: the index is free, the
next worktree gets it, and both branches end up holding the same `B-NNN`.

**Why it matters:** It is the exact collision this plan exists to prevent, reachable through documented
normal use (`rm` a worktree you're not done with, create another). Phase 4's merge abort catches it
loudly rather than renumbering, so nothing is silently corrupted — but the reservation is supposed to
make the abort unreachable.

**Historical proposal:** The likely fix was a third clause in the witness scan: also count IDs on branches that exist
but are not merged into the default branch (`git for-each-ref` + `git show <branch>:docs/BACKLOG.md`).
That is a heavier scan on every create, which is why it wasn't folded into Phase 3 unasked.

**Resolution:** 2026-09-24: Reproduced duplicate B-1000 through actual worktree.sh removal with a retained unmerged branch. The existing locked allocator now counts distinct backlog blobs at local branch tips. Real-Git regressions preserve B-1000/B-2000 through both merges, reserve a fresh block on reopening, reuse an unused block, and refuse unreadable objects without leaving a marker or lock. Final audit: 7/7 PASS. Rank reconciliation is separately recorded as B-184; B-005 remains Open. See docs/preparation/2026-09-24-b003-retained-branch.md. Local only; no publication.

## B-004 — The citation-key invariant can drift between its unguarded copies

**What:** "An ID is a permanent citation key: never renumbered, never reused" now appears in 12 places
— 9 across `commands/esq/` (`plan.md`, `build.md`, `harvest.md`, `backlog.md`, `check.md`,
`review.md`, `fix.md`, `worktree.md` ×3), 2 in `README.md`, 1 in `docs/DECISIONS.md`. `audit.sh`
check 10 hashes only the 5 copies inside the `<!-- id-allocation -->` markers. The three
`DECISIONS.md` header templates, `worktree.md`'s three statements and the README's two are unguarded.

**Why it matters:** The set's whole defense against drift between duplicated definitions is
mechanical comparison, and this rule is now its most-replicated sentence while being only partly
covered. It already bit once: Phase 4's original verification step was written against a README that
did not yet carry the invariant, and had to be amended because satisfying it would have meant
diverging one copy from the other eleven.

**Notes:** The `id-allocation` marker pattern generalizes — wrap the invariant sentence in its own
delimiter pair and extend check 10 (or add check 11) to hash that span across every carrier. The
`docs/AUDIT.md` § "Known duplicated definitions" entry would need the new pair registered alongside it.

**Resolution:** 2026-09-24, e1c24c0: The numbered check and commands/esq carriers are gone (308cb7c; retire-legacy-rollback-path). CLAUDE.md permits checks of resolving references and parsed formats, not identical sentences. No ID invariant is abandoned: allocation and merge behavior remain B-003/B-005.

## B-005 — Merge step 4's clean-auto-merge branch is verified by reading, not by running

**Current scope (2026-09-24):** tests/cli/merge.test.mjs covers clean merges, synthetic duplicates and seal reconciliation separately. That is related coverage, not proof of the requested combined marker-free path; retain the focused fixture gap.

**What:** `/esq:worktree merge` step 4 carries its own `$BASE` classifier precisely because a ledger
can auto-merge cleanly and reach step 4 with both copies of a shared row in place and no conflict
marker for step 3 to have caught. No fixture exercises that branch. All three scratch repos built for
`prevent-ledger-id-collisions-fixes` Phase 1 land in step 3 (git raised a conflict) or on the abort
path (ancestor-absent duplicate), and the two corrections applied on 2026-08-10 — generalizing the
classifier past `docs/BACKLOG.md`, and naming `ours`/`theirs` for the marker-free reconciliation —
were both verified by `grep` and a reading pass rather than by running the path they fix.

**Why it matters:** This is the branch where an error is least visible. Its failure mode is not a
crash but a wrong classification: a shared entry read as ancestor-absent aborts a legitimate merge
with the "something bypassed block reservation" diagnostic, and a botched reconciliation silently
splits one item into two rows carrying one ID — the exact outcome the whole design exists to prevent.
`audit.sh` is mechanical and cannot see either; both defects fixed on 2026-08-10 lived here and were
found by reading, which is not a repeatable guarantee.

**Notes:** Needs a fourth fixture: one pre-existing ledger row (or detail section) edited on both
sides in ways git merges without raising a conflict — edits far enough apart in the file, or two
detail sections that never overlap textually — then walk step 4 and confirm the ancestor-present
branch reconciles into a single row and re-runs the four predicates clean. Deferred from the fix pass
because building it is plan-shaped work, not a mechanical correction, and `/esq:fix` applies only what
a brief sanctioned as safe.

## B-006 — Port esquisse to other agentic harnesses via an install-time adapter layer

**Current scope (2026-09-24):** The historical six-phase plan has no execution entry; Planned records its existence, not active work. Preserve confirmed hi. Revisit on a selected cross-host use case, not after clearing every legacy task. Historical plan references describe prior acceptance only; no execution plan is present in this public checkout.

**What:** The 20 commands are ~4,950 lines of pure Markdown — no code, no SDK, no API calls. The
engine is the model, and the artifacts (`BACKLOG.md`, `DECISIONS.md`, `ROADMAP.md`, plan files,
`docs/epics/`) are plain files any agent can read. Everything expensive to design — the contracts
between commands, the three-zone conclusion, the ledger, the refusal rules — crosses to another
harness unchanged. The coupling is not spread across 20 commands; it is concentrated in five named
primitives, plus two conventions.

**Why it matters:** Codex is likely needed soon (2026-08-13), and the cost of the port is set by how
early the abstraction lands: every command edited before it is one more file naming a concrete tool.
Ported late, it is a 20-file rewrite; ported now, it is a shared block plus an installer flag.

**Notes — the coupling surface (measured 2026-08-13):**

| Primitive | Carriers | Without it |
| --- | --- | --- |
| Discovery: `~/.claude/commands/esq/*.md`, `/esq:` namespace, YAML frontmatter | `scripts/install.sh` | Codex reads `~/.codex/prompts/*.md`, invoked `/<name>` — no `:` namespace, no frontmatter, different argument convention. Verify against the current Codex release before building |
| `AskUserQuestion` | 12 of 20 files (`spec`, `arch`, `converge`, `build`, `harvest`, `worktree`, `advance`, `autopilot`, `grill`, `sweep`, `plan`, `ui`) | Degrades cleanly to lettered options in plain text ("answer A/B/C"). Worse UX, discipline intact — the option-set shape is prose, not a tool |
| Subagents (`Agent`, `general-purpose`, `run_in_background: false`) | `advance`, `autopilot`, `converge` | The real loss. These three *are* orchestration; with no subagent primitive they do not exist. Workaround below |
| `WebSearch` / `WebFetch` | `grill`, `plan`, `ui` | Codex has `--search`; elsewhere variable. Degrades to "ask the user for the reference" |
| `Artifact` | `ui` only | Write the HTML locally and open it in a browser |

Two conventions on top: the `/clear` ritual and "do NOT use plan mode" (19 of 20 files), which every
harness expresses as "new session"; and the README's Sonnet/Opus recommendation table, which is
provider-specific by nature.

**The subagent workaround:** `advance` / `autopilot` / `converge` need *a clean session per unit of
work*, not a true subagent — that is the whole reason the `[context]` stop is dissolvable there.
`codex exec "<prompt>"` (or `claude -p`) headless gives exactly that. The orchestrator shells out
instead of calling a tool; process startup costs more, the semantics are identical.

**Proposed shape — adapt at install time, not at run time.** `scripts/install.sh` is already a
transformer with a manifest; it becomes a transpiler.

1. `commands/esq/_harness.md` names the primitives abstractly (`ASK`, `SPAWN`, `WEB`, `PUBLISH`,
   `FRESH SESSION`); commands stop naming concrete tools and use only those verbs.
2. One adapter per target (`adapters/claude-code.md`, `adapters/codex.md`) binds the verbs to real
   tools and states each target's degraded fallback.
3. `install.sh --target codex` inlines the adapter into every command and renames to the target's
   convention — Codex prompts have no include mechanism, so inlining is mandatory, not a choice.
4. A new `audit.sh` check: no command may name a concrete tool, only an abstract verb. Without it
   portability rots silently at the first edit — the same class of drift check 10 exists to catch.

**HARD RULE — the installer must refuse the destructive run; no phase of this work may rely on
remembering it.** `install.sh` deletes manifest files no longer present in the repo (*plan orphan
removal*), and this port **is** a rename. One `./scripts/install.sh` run from the port branch erases
the working `/esq:` set for every codebase on this machine: one shared `~/.claude/.esquisse-manifest`,
no per-project isolation, hot reload straight into sessions already running. `ESQUISSE_HOME=…`,
`--check`, and `git checkout main && ./scripts/install.sh` make the mistake survivable and fully
reversible — **none of them prevent it**, and a precaution restated per session is the failure mode
this repo mechanizes against (`CLAUDE.md` § "Mechanize repeated corrections"). Three obligations,
in order:

1. **Ships before the rename, on `main`, installed.** A guard built on the port branch leaves the
   window between branching and the guard unprotected — which is precisely when the tree is
   half-renamed. This is the port's phase 0 and its gate: no file under `commands/` is renamed,
   moved, or added on any branch until the guard is installed and proven.
2. **Fault-injected, not reasoned about.** The proof is a scratch repo where the pruning run is
   *made* to happen and the guard is observed refusing it — plus the inverse, a legitimate prune
   still succeeding. A guard verified by reading is not a guard; `B-005` is the standing evidence of
   what that costs.
3. **Structural, not conditional on intent.** Two independent refusals, either sufficient:
   `install.sh` refuses the default `$HOME/.claude` target when run from a linked git worktree
   (`git rev-parse --git-dir` ≠ `--git-common-dir`) without an explicit override; and a prune that
   would remove an entire installed namespace requires explicit confirmation on any branch. `--target
   <t>` can then never touch a namespace it does not own — installing `codex` cannot reach
   `commands/esq/`, whatever branch it runs from.

**Phase 0 is green — shipped on `main` 2026-08-13, commit `c1eeace`.** Both refusals are in
`install.sh`, fault-injected by `scripts/test-install-guards.sh`, and wired as `audit.sh` check 20 so
they cannot regress silently. `/esq:plan` records it as already-done and does not re-plan it; the
gate below now reads as satisfied, and the rest of the port may proceed. One defect found on the way
and fixed in the same commit: `install.sh` exited 1 after a clean install, its final `find` being
hardcoded to `commands/esq` — which would have failed for every ported namespace.

**This rule travels or it does not exist.** It is not advice to the user; it is a constraint on every
command that touches this item. `/esq:plan` must copy it verbatim into the plan file's constraints —
that file is the only carrier `/esq:build`, `/esq:check` and `/esq:review` all read — and phase 0
above must be its first phase, gating the rest. A phase log that renames a command file without
phase 0 recorded green is a `/esq:check` finding, not a judgment call. Until the guard is installed,
a parallel namespace (`~/.claude/commands/esqx/`, invoked `/esqx:`) is the only sanctioned way to
exercise a ported command inside Claude Code.

**The real limit is the model, not the harness.** `build.md` is 533 lines of procedure to follow
without drifting, and every discipline in esquisse is enforced by prose — nothing mechanical stops a
command from doing what it must not. A weaker instruction-follower does not fail loudly; it produces
a plausible report having skipped three steps. That failure mode deserves more attention in the port
than any missing tool, and argues for a conformance fixture per target before trusting it.

---

**SUPERSEDED, 2026-08-15 — read the plan, not this section.** `docs/plans/2026-08-15-harness-port-adapter-layer.md`
and its brief are authoritative; this section is kept for the HARD RULE above and for the record of
how the idea started. Four things here are now wrong or out of date:

- **Scope is Codex only.** DeepSeek, Gemini CLI and Cursor are explicitly out of scope for v1 — one
  real second target proves the abstraction is genuine; a third costs conformance work against a
  need nobody has stated.
- **The carrier is skills, not prompts.** `~/.codex/skills/esq-<name>/SKILL.md`. OpenAI deprecated
  custom prompts in favour of skills, so every sentence above about `~/.codex/prompts/` is dead.
- **The coupling table undercounts and misstates.** There are at least eight primitives, not five —
  it misses `ToolSearch`, the `Task*` family, `PushNotification` and `Skill`; and its claims about
  Codex frontmatter and namespacing were wrong. The plan re-measured it.
- **No abstract-verb rewrite.** Point 1 of "Proposed shape" is out of scope. The abstraction lives
  in `docs/HARNESS.md` — a capability contract — plus marker-delimited spans, and no command's prose
  is rewritten. Point 4's audit check survives, but it validates against that contract.

Phase 0 remains green and remains the gate.

## B-012 — The command set is 5,162 words above the cost-trim plan's target

**What:** `commands/esq/` totals **75,662 words** against the plan's ≤70,500 Done-looks-like — 5,162
short, remeasured 2026-08-16. Every cut Appendices A–F of
`docs/plans/2026-08-14-command-set-cost-trim.md` named has been applied, so closing the gap needs a
fresh trim analysis rather than more of that list.

**Why it matters:** Every word in a command file is paid on every invocation, which is why the number
was made a target and not a hope. Left as-is the plan cannot close on its own terms, and the set drifts
back up from here with no budget anyone is holding it to.

**REMEASURED 2026-08-16 — the gap doubled in one day, and the drift is the finding.** This item was
filed at 73,119 (measured 73,144 at `7ad0cbe`). Seven commits on 2026-08-16 added **+2,518 words**, all
of them legitimate work, none of them priced against the budget at commit time:

| Commit | What | Δ words |
| --- | --- | --- |
| `eb42d6b` | build/plan — whole-repo suite on blast radius | +473 |
| `e30c8ef` | build — which rule wins on a step/plan conflict | +102 |
| `0caa745` | build+orchestrators — the probe reports its empty slot (**closes B-015, B-016**) | +994 |
| `4837833` | arch — the miss test cannot route a procedure | +316 |
| `fe352e9` | arch — the five parts of a runnable skill | +169 |
| `f5edc58` | announce — ban the preamble above the bound | +464 |

The day added nearly as much as the entire gap it was already carrying. `0caa745` is the sharpest
case: **+994 words spent to close the two largest token-saving items in this backlog** — a good trade
(B-015 measured 155 tool calls against 63 for the same class of phase) but one nobody priced. That is
the shape of the drift: each commit is defensible on its own and the budget is held by no one.

**The aggregate target may be the wrong instrument.** A run loads *one* command file, not twenty.
Closing the whole 5,162-word gap saves ~258 words — roughly 335 tokens — on an average invocation.
The number that actually bills is the individual file: `build.md` at **7,843 words (~10k tokens)** is
paid on every phase of every plan, and is 15× the smallest. A trim analysis ranked by per-invocation
cost would go at `build.md`, `plan.md` (5,403) and `backlog.md` (4,778) and ignore the aggregate.
Whether the target is retargeted per-file or kept as a set-wide cap is a decision this item needs
before the next analysis — and per `CLAUDE.md` § "Mechanize repeated corrections", a budget that has
now drifted twice belongs in `audit.sh` as a check that fails the build, not in a backlog row.

**Notes:** Measure with `wc -w commands/esq/*.md | tail -1`. Two known reserves are already priced:
Phase 5's shared-block trims landed 1,109 words under their ~2,900 budget, and Phase 3 spent +454
buying runtime scans with rule words (deliberate). The plan's own Open questions park two high-risk
candidates it declined to cut blind — check.md's verdict-options list (~6 prose sentences) and ui.md's
brief template (~50w, shared shape with `/esq:grill`) — both needing a decision before a cut, not just
a diff. Any new analysis is bound by the same bar: rationale and restatement only, never a rule.
Those two candidates are filed separately as `B-013` and `B-014`; closing this item does not close them.

2026-08-18 — `commands/esq/` measured 79,948 words before `three-zone-conclusion-spec-arch`; that plan adds
+731 (spec +354, arch +377) by decision, per-file, unoffset — see `D-conclusion-block-where-zone-two-fills`.

**Resolution:** Moot: the tree whose word count this row tracked was deleted by this unit's stem plan, and audit check 61 now reds on any live reference to it (green at bc1db0d). No word target survives the corpus it measured.

## B-013 — check.md's verdict-options list predates the three-zone headline

**Current scope (2026-09-24):** plugin/skills/check/SKILL.md still has the separate six-item Verdict options list below the three-zone report. Its precedence protects an unmet Done looks like; decide placement using actual output, not blind trimming.

**What:** `commands/esq/check.md` carries six prose verdict sentences (~lines 264–270) that state a
verdict in their own shape. The conclusion protocol's three-zone headline now carries the verdict as
counters, so the two overlap without either being redundant outright.

**Why it matters:** ~6 sentences are paid on every `/esq:check` invocation, and the cost-trim plan
listed them as a candidate it would not cut blind. Left unresolved, the next trim analysis meets the
same wall and parks them again — while a careless pass cuts wording the headline does not actually
replace, and `/esq:check` loses its verdict.

**Notes:** The cost-trim plan parked this as an Open question and promised to propose it as a backlog
item at Phase 6 if still unresolved. It was unresolved — Phase 6 deliberately left the six sentences
untouched — but logged `Backlog candidates: None.`, so the row was never written. The prerequisite is
a decision, not a diff: does verdict wording live in the headline counters or stay freestanding?

**Resolution:** 2026-09-25: Unified check outcome, gaps and next action in the existing report; preserved unmet acceptance precedence, missing-proof and false-complete distinctions, incomplete-phase resumption and genuine decisions. Two historical reports examined; editorial before/after and directed branch reading, not a new native model trial. Five product audit checks passed initially; only the two failed Node checks retried outside sandbox, both passed. Evidence: docs/preparation/2026-09-25-b013-check-report.md. Local only; no push or publication.

## B-014 — ui.md's brief template shares its shape with /esq:grill's output contract

**What:** The brief template in `commands/esq/ui.md` (~50w) is chattier than it needs to be, but its
shape is shared with `/esq:grill`'s output contract rather than being local to `ui.md`.

**Why it matters:** Trimming it in place would silently fork two templates that are meant to match,
so a brief written by one command stops being readable by whatever consumes the other's.

**Notes:** Parked by the cost-trim plan as an Open question with the same Phase 6 treatment as
`B-013`, and missed the same way. Verify parity against `/esq:grill` first; the trim is only safe
once both sides move together.

**Resolution:** 2026-09-24, e1c24c0: commands/esq/ui.md and the old cost-trim target no longer exist. Current plugin/skills/ui/SKILL.md and grill/SKILL.md own their brief outputs; no current consumer mismatch was established. This is an obsolete trimming task, not a claim of measured savings or of identical current templates.

## B-010 — The announce-open block is duplicated in 16 files and not hash-compared

**What:** Every long command carries the same announce-open framing around its own quoted
bound. All 16 copies of that framing are byte-identical today, and nothing holds them so.

**Why it matters:** It is the most-replicated paragraph in the set and the only heavily
duplicated one outside check 22's reach, so it drifts silently. Confirmed on 2026-08-16 while
editing all 16 at once to ban the preamble above the bound: adding a registry line for it did
**nothing**. Check 22 owns three-segment markers only (`<!-- prefix:name:start -->`) and
deliberately leaves two-segment ones to the older per-block checks — `announce-open:start` is
two. A registry entry for it is inert, which is worse than none: it reads as covered.

**Notes:** Closing it means renaming the markers to a three-segment namespace across 16 files.
`scripts/check-longrun.sh` parses `announce-open:start`/`:end` by name in four places (lines
~111, 115, 143, 174), so check 16 and its fault-injector check 21 move in the same commit or
the rename silently disables the long-run rule. Do not register the family without the rename.

**Resolution:** 2026-09-24, e1c24c0: scripts/check-sharedblocks.sh and the legacy carriers were removed; CLAUDE.md keeps the duty to announce a bound but rejects policing prose. This drops the proposed comparison mechanism, not bounded work or cost control.

---

## B-043 — Projection freshness without a second writer

**Current scope (2026-09-24):** This reconciliation demonstrates stale projections. Prefer a small freshness/reporting change after B-129; do not invent mandatory projection refreshes on the delivery path.

**What:** On 2026-08-19 `docs/ROADMAP.md` reported B-028 `Open` while the backlog marked it `Done`,
and the epic doc listed B-026/B-027/B-028/B-031 as `Open`. Read-only state should be able to see the
conflict without `/esq:roadmap` or `/esq:epic` being run.

**Why it matters:** A projection that can masquerade as current authoritative status is worse than no
projection.

**Notes:** Contract — `esq state` returns `roadmap.stale` (or an equivalent explicit signal), reports
the live backlog status for every ID the roadmap covers while preserving what the projection says
separately, may report a projection timestamp or source hash as deterministic freshness evidence,
and never rewrites ROADMAP.md (single writer stays `/esq:roadmap`). `/esq:status` distinguishes
projected order from stale status text; the epic projection gets comparable handling where apt.
Deliberately last with B-044: it must not destabilize authority rules while the reliability work
above is underway.

**Preparation finding (2026-09-24; not implementation):** Two bounded read-only proposals exposed a false freshness shortcut. `dependable-queue` legitimately covers B-129 Done and B-079 Open while remaining in Now for B-079; closed membership alone must not flag the projection as false. Likewise, unchanged status since a roadmap commit does not prove its original text correct. Preserve live facts and projected order separately; only claim a mismatch where the compared statuses support it. Evidence and rejected proposals: docs/preparation/2026-09-24-adversarial-review.md. B-043 remains Open.

**Resolution:** Delivered 2026-09-24: esq state preserves roadmap order/text and joins every explicitly covered backlog ID to live status, including Done/Dropped. Roadmap freshness stays unassessed; mixed B-129 Done/B-079 Open is not labelled stale. Epic Backlog status bullets compare against the same ledger with true/false/unknown mismatches. Missing, invalid and ambiguous sources remain unknown. Status instructions consume these fields without requiring refresh. Real checkout: unchanged mixed head, B-044/B-071/B-072 projected Open versus live Done, source bytes unchanged before this closure. Five behavior regressions and one 7/7 product audit pass. Evidence: docs/preparation/2026-09-24-b043-state.md. Generated status/preparation quality was not measured; B-181/B-182 remain Open.

## B-070 — An esq agent re-reads files it has already read, and pays a full round trip for each

**Current scope (2026-09-24):** The read-once rule and B-151 instrument shipped. docs/baselines/2026-09-11-reread-baseline.json does not support the old cohort comparison. Keep confirmed hi and historical Planned; no current savings claim, no research prerequisite for a directly demonstrated improvement. Historical plan references describe prior acceptance only; no execution plan is present in this public checkout.

**What:** an agent's bill and its wall-clock are both **the number of API round trips × the size of
the context at each one** — the work done inside them barely registers. Measured over 621 subagent
transcripts under `~/.claude/projects/*/*/subagents/` (2026-08-21), keyed on `message.id`:

```
604 agents · 24,403 tool-issuing round trips · 26,058 tool calls
    1 call/turn : 82.8% of turns          mean 1.068 (esq) / 1.243 (non-esq)
    2.748 G cache-read tokens  →  109,825 per round trip, 90,775 per tool call
```

Batching is possible on this Claude Code version — 4,199 turns in the corpus already carry more than
one `tool_use` block, up to 8 — so the "settle this first" gate this item opened with is discharged
without an experiment. But esq does not use it: splitting the 604 agents by whether `esq` telemetry
recorded them, **esq's own agents run at 1.068 calls/turn and 93.3% singleton turns, against 1.243
and 80.4% for the other 446 agents on the same machine in the same window** (`build` 1.037 / 96.5%
singleton, `fix` 1.080, `work` 1.077, `check` 1.176, `review` 1.214). Same harness, same hardware,
same window — the difference is the prompts.

**This item is now the re-read half only.** The batching half is B-071, with its own evidence.

**The surviving target: 757 round trips lost to re-reading a file the same agent run already read** —
4.8 per run across the 158 recorded esq agent runs, 16.5% of every tool-issuing turn, ≈42 s off a
7m16s `esq:build` median. The repeated targets are esquisse's own documents, which is what lets the
rule name them instead of moralizing about tokens: `docs/BACKLOG.md` ×71, `docs/DECISIONS.md` ×49,
`README.md` ×39, a skill's own `SKILL.md` ×37, `docs/SPEC.md` ×22, `plugin/lib/cli.mjs` ×41, and
individual plan files up to ×27. It needs no batching support from the harness, because it is a rule
about work already done, not about how many calls fit in a turn.

Two rows of this item's original arithmetic did not survive the correction:

| change | round trips saved | note |
|---|---|---|
| **re-reads eliminated** | **757 (16.5% of turns, 4.8/run)** | this item |
| independent reads batched 2 per turn | 318 (6.9%, 2.0/run) | repriced from 4,987 — reads are 30% of esq calls and mostly *not* adjacent; 1,701 of 2,353 solo-read streaks machine-wide have length 1 |
| `TaskCreate`/`TaskUpdate` dropped when unattended | **void** | esq agents make **zero** Task calls (4,903 esq calls: 1,463 read, 122 edit, 3,318 other). The 8.8% was entirely non-esq, and even there only 185 of 2,785 such calls sit alone in a turn |

`esq telemetry summary` says the same thing from the other side, over 59 `esq:build` runs:

| | min | q1 | **med** | q3 | max |
|---|---|---|---|---|---|
| duration | 1.6 min | 5.6 | **7.3 min** | 12.9 | 30.8 |
| tool calls | 10 | 35 | **47** | 61 | 153 |
| API requests | 11 | 36 | **46** | 59 | 148 |
| output tokens | 5.8k | 21k | **28k** | 38k | 119k |
| cache read | 458k | 2.7M | **3.44M** | 5.2M | 25.5M |

Requests track calls almost exactly, and duration tracks calls at ~8.7 s each: the 47-call median is
7m16s, and one measured 102-call phase took **14m51s**. On that run's two phase
agents, **23% of the file reads were re-reads within the same agent** — the plan 3×,
`docs/DECISIONS.md` 3×, and `build/references/decisions-and-backlog.md` and `reporting-and-stops.md`
twice each: esquisse re-reading its own references.

**Why it matters:** this is the dominant cost of the whole system, and every economy already written
into the skills is a rounding error beside it. `build/SKILL.md` slices the execution log, refuses to
re-run a check, scopes the whole-repo suite to blast radius and backgrounds the slow one — all
correct, all about the *work*. None of them touches the round-trip count, which is what is actually
being billed. For scale: the two fixes committed on 2026-08-21 against B-069 removed ~25.5 M
cache-read tokens across the entire recorded history of two projects. **One median build phase
spends 3.44 M. The 14m51s phase spent 17.8 M by itself.**

**Notes — where the evidence is, and how to re-measure it.** Subagent transcripts live at
`~/.claude/projects/<encoded-project>/<session-id>/subagents/agent-<id>.jsonl`; they are *not*
sidechain records in the parent file, and nothing under `~/.claude/` is ever to be modified. The
whole measurement is this, and it is the acceptance test too — run it before the change and after:

```python
import json, glob, os, collections
turn = {}
for f in glob.glob(os.path.expanduser('~/.claude/projects/*/*/subagents/agent-*.jsonl')):
    for l in open(f, errors='replace'):
        try: d = json.loads(l)
        except: continue
        if d.get('type') != 'assistant': continue
        m = d.get('message') or {}
        t = turn.setdefault((f, m.get('id')), {'cr': 0, 'tools': []})
        t['cr'] = max(t['cr'], (m.get('usage') or {}).get('cache_read_input_tokens', 0))
        t['tools'] += [c['name'] for c in (m.get('content') or [])
                       if isinstance(c, dict) and c.get('type') == 'tool_use']
tt = [t for t in turn.values() if t['tools']]
calls = sum(len(t['tools']) for t in tt); cr = sum(t['cr'] for t in tt)
print(len(tt), calls, calls / len(tt),
      collections.Counter(len(t['tools']) for t in tt), cr // len(tt))
```

Two rules it encodes, and the first version of this item broke both: **one turn is one `message.id`,
not one record** — a batched turn is written once per `tool_use` block with `usage` duplicated — and
**`usage` on a repeated id is replaced, never summed**. Keying by record inflated the corpus by 21%
and, by summing `cache_read` over text-only assistant records against a tool-call denominator,
inflated the cache-read total by 83% and the per-round-trip figure by 55% — which is also how the
corpus came out looking 100% singleton. The corrected figures are the ones above: 24,403 round trips,
2.748 G, 109,825 each.

Plus `./plugin/bin/esq telemetry summary`, whose `by command` row for `esq:build` carries the
`tool calls med`, `trips med` and `dur med` this item moves. **Do not add a check to `audit.sh` for
any of it** — it reads one machine's telemetry, exactly the reason `probe-model-pins.mjs` and
`cost-budgets.mjs` are deliberately not wired in (`CLAUDE.md`, "never in audit.sh").

**Note (2026-09-11) — the script above is not this item's instrument.** It keys turns by `message.id`
and prints calls/turn, the batching distribution and cache-read per turn: that is the **B-071** axis.
It never reads tool *inputs*, so it cannot produce the 4.8 re-reads/run this item closes on. That
instrument still has to be written — group `Read`/`Grep`/`Glob` calls by resolved path within one
`agent-<id>.jsonl` and count every occurrence after the first. Two constraints on the reading:
restrict it to agent runs postdating **2026-08-21** (`3d78a04`, where `shared:read-once` shipped),
because a corpus pooling both sides of the ship answers nothing; and note that
`./plugin/bin/esq telemetry summary` on 2026-09-11 read `esq:build` at calls/trip **1.03**, trips med
**55**, dur med **11m12s** over a window spanning both sides — so that row is not a post-change
figure either.

**This item closes on a measured re-read rate, not on a rule being present.** Shipping the shared
block is `read-once-and-see-round-trips`; re-measuring 4.8/run downward over runs that happen after
it ships is what closes B-070.

**Scope separation (2026-09-12) — what the shipping unit delivered, and what this item still owes.**
The `esq/measure-the-reread-rate` unit built the *instrument* this item asked for and took the reading;
it did not deliver the *improvement* this item is about. Those are two things, and this row had been
carrying both. So the completed measurement deliverable is now **B-151** — the instrument, its frozen
reading and its documented inconclusive result, recorded `Done by measure-the-reread-rate` with its
plans, evidence and decisions linked from its own detail section — and B-070 keeps its original
objective, its historical arithmetic, its references to that measurement, and its `Planned` status.

**The association that changed, verbatim, so a reader can reconstruct it.** This row's `Source` cell
read `manual (esq telemetry summary + 621 agent transcripts, corrected 2026-08-21) · Planned by
read-once-and-see-round-trips · Planned by measure-the-reread-rate` and now reads the same with the
last marker replaced by `· measurement delivered as B-151, see detail`. The `Planned by
measure-the-reread-rate` marker was **retracted, not erased**: it asserted that the unit would deliver
this item, and the unit's own reading is what showed it had not — 6% and 2% classification coverage on
the two local `esq:build` cohorts establishes nothing about the rule in either direction. Leaving the
marker would have recorded a promise the unit did not keep; deleting it silently would have hidden that
it was ever made. `Planned by read-once-and-see-round-trips` is untouched — that plan shipped the rule
itself and its association is unchanged by any of this.

**What this item still owes, unchanged:** a measured re-read rate moving downward over runs that
postdate the rule. Nothing below has been weakened to release the landing, and no threshold has been
invented. `/esq:work B-070` or a fresh plan is how it is picked up; the instrument is in the tree and
B-151's detail says how to run it.

**Reading (2026-09-11) — descriptive, and it proposes no disposition.** The instrument this item
asked for exists: `scripts/measure-rereads.mjs`, classifier **v3**, fixtures in `tests/measure/`,
never wired into `audit.sh`. One measurement pass over the local store, explicit closed bounds
`2026-01-01T00:00:00Z … 2026-09-11T23:19:31Z`, frozen at
`docs/baselines/2026-09-11-reread-baseline.json`. Whole-store matching coverage **590/590 labelled
rows have a transcript** (window-independent; the window excluded nothing). Per-cohort matching
coverage is **not computable** — an absent transcript has no command and no rule presence — and is
reported as such rather than estimated.

A **v2** reading was taken first and is superseded, not carried forward: it inferred a complete
delivery from the absence of `offset`/`limit` and published every slice inequality as legitimate. The
v2 document is retrievable at commit `2b31f9e`; no v2 figure is comparable with a v3 one. The
correction changed the corpus not at all — the same 590 runs, the same eligible counts of 54 / 34 / 8
— so this **is** a same-corpus comparison between the two classifiers.

Local `esq:build`, by rule presence, from the one v3 pass:

| | eligible runs | access calls | repeats | established (`identical`) | established /run | /access | repeat-only turns | /run | classification coverage | unresolved |
|---|---|---|---|---|---|---|---|---|---|---|
| `ruleLoaded` | 54 | 1992 | 520 | **28** | 0.52 | 0.014 | 6 | 0.11 | **6%** | 488 |
| `ruleAbsent` | 34 | 1188 | 203 | **2** | 0.06 | 0.002 | 2 | 0.06 | **2%** | 199 |
| `ruleLoadedMidRun` | 8 | 245 | 43 | 7 | 0.88 | 0.029 | 0 | 0.00 | 16% | 36 |

Class detail — `ruleLoaded`: `overlapUnknown` 312, `afterUnconfirmedRead` 108, `afterUnrecognizedWrite`
50, `historyIncomplete` 18, `broaderAccess` 4. `ruleAbsent`: `overlapUnknown` 93, `afterUnconfirmedRead`
60, `historyIncomplete` 26, `afterUnrecognizedWrite` 20, `broaderAccess` 2.

**What changed from v2, and it is the headline.** Established redundancy did not move at all (28 / 2 /
7): proving containment found no *additional* redundancy on this corpus, because shell reads record no
range and most `Read`-to-`Read` pairs had no proven range on the prior side. Access calls fell
(2087→1992, 1254→1188, 258→245) as redirected sources stopped counting as deliveries. What collapsed is
**classification coverage: 66% → 6%, 47% → 2%, 76% → 16%**, because v2's `differentSlice` — the largest
class in the report — was published as *legitimate* and counted as resolved, and v3 splits it into the
4 / 2 / 0 cases the results actually prove (`broaderAccess`) and the 312 / 93 / 26 they do not
(`overlapUnknown`, unresolved).

**What the corrected observations support.** Very little, and that is the finding. With 6% and 2% of
repeated access resolved, 28 and 2 established events sit on top of 488 and 199 unresolved ones, and
the cohorts are not even equally resolvable — `ruleLoaded` resolves three times as much of its own
repeat traffic as `ruleAbsent` does. **No comparison between the cohorts is supportable from this
reading**, in either direction. An earlier note argued the ordering was safe because a correction would
raise both cohorts' counts; that argument was wrong and is withdrawn — unequal corrections can reverse
a comparison, and removing false events can lower a count, so nothing about a prior conclusion was
protected. What this reading does establish is about the *instrument*: on a corpus of this shape it can
settle only a small minority of repeated accesses, and the dominant obstacles are named —
`overlapUnknown` where no result records a delivered range, then reads whose content was never
established, then interpreter heredocs and working-tree rewrites.

**The historical 4.8/run is not a comparand** and this reading does not claim to move it: its
definition was never recorded, and v3 counts a different thing.

**No threshold is imposed here, and the status is unchanged.** This item keeps the closing condition
it already carries, and completing the instrument is not the same as demonstrating the improvement the
item asks for. Whether any later evidence meets that condition is an argument a later proposal must
make in the open, citing counts and coverage together; on this reading nothing is demonstrated in
either direction.

## B-078 — The `head` half of B-068's SIGPIPE shape

**Current scope (2026-09-24):** scripts/worktree.sh:59 still pipes worktree output through head -n1; the other cited old sites/checks are removed or rewritten. No current user-visible failure reproduced; keep only this bounded investigation.

**What:** B-068 fixed the nine pipelines that end in `grep -q`. Five more end in `head`, which exits
just as early: `scripts/worktree.sh:59` (`git worktree list --porcelain | sed … | head -n1`), `:93`
(`sed … | head -n1`), `scripts/check-conformance.sh:36` and `:38` (`grep -RFl … | head -1`), and
`scripts/audit.sh:534` (`echo "$hits" | head -1 | cut …`). Under `pipefail` each can return 141 when the
producer outruns the reader.

**Why it matters:** not today — every one of the five drops the status into a `$(…)` assignment or a
function whose callers do not test it, so the 141 is discarded. Two things could change that. Whoever
next writes `if main_worktree; then` or `path=$(main_worktree) || die` starts consuming a status that
was never trustworthy, and `scripts/worktree.sh` runs under `set -euo pipefail`, where `-e` turns a
consumed 141 into an aborted script rather than a wrong answer. The guard shipped with B-068,
`scripts/check-sigpipe-shape.sh`, covers `grep -q` only and will not say a word about these.

**Notes:** the fix per site is the same here-string rewrite B-068 used, but it is five sites in three
files for no present defect, so it is worth doing deliberately rather than as scope creep — which is
why B-068's plan named it out of scope instead of widening the check. If they are fixed, extend
`check-sigpipe-shape.sh` to `head` in the same commit and add the case to
`scripts/test-sigpipe-shape-guard.sh`; if they are kept, the reason each status is provably unread
belongs in a comment at each site, because that is the fact the next reader needs and cannot see.

## B-085 — A build worker that runs out of work has no cheap way to wait for a finite check

**Current scope (2026-09-24):** 2026-09-08-background-task-lifecycle.md completed four phases, with pre/post journey captures. Gate A option (a), chosen 2026-09-08, explicitly leaves both rows open: process cleanup does not clear harness registration. The >=20-agent cohort and claimed savings are not proved here. No protocol reimplementation or delivery-blocking measurement campaign. Historical plan references describe prior acceptance only; no execution plan is present in this public checkout.

**What:** `build/SKILL.md` tells a phase to launch its slow check with `run_in_background: true` and
draft the log entry while it runs. It says nothing about how to *collect* the result, so the worker
improvises — a hand-rolled `( … ) &` into a log file, then a sequence of calls asking whether it has
finished. Each of those is a full API round trip whose only outcome is "not yet".

**Frozen baseline.** Invocation, exactly:

```
node scripts/measure-wait-cost.mjs --through 2026-08-22T12:00:00Z --json
```

Population: the esq `build`/`fix`/`work` agents esq telemetry labelled (`AgentLabel.esqCommand`),
joined to their transcripts. **This is one machine's local corpus — unversioned, not portable, and
growing.** It is a *datable local baseline*, not globally reproducible evidence; the cutoff is what
makes a figure quotable, and the same flags bound a post-change cohort.

```json
{ "classifierVersion": 2, "measuredAt": "2026-08-22T12:00:00Z",
  "transcriptsOnDisk": 694, "labelledByEsq": 205,
  "eligible": { "agents": 136, "versions": ["2.1.235","2.1.236","2.1.237","2.1.238","2.1.239"],
    "turns": 11365, "cacheReadTokens": 1021707371,
    "finiteLaunches": 96, "daemonLaunches": 56,
    "launchesWithBackgroundFlag": 121, "launchesHandRolled": 31,
    "observations": 297, "observationSeconds": 8038,
    "launchesWithNoIndependentWorkFirst": 35, "medianIndependentCallsBeforeFirstObservation": 2,
    "excessStatusTurns": 123, "excessStatusCacheReadTokens": 16140301,
    "agentsWithExcessStatusTurns": 40,
    "notifications": 2, "agentsNotifiedAfterConcluding": 2 },
  "perCommand": { "build": { "agents": 98, "excessStatusTurns": 123 },
                  "fix": { "agents": 30, "excessStatusTurns": 0 },
                  "work": { "agents": 8, "excessStatusTurns": 0 } } }
```

**It is build's rule, and build's alone.** All 123 excess status turns are `build` agents; `fix` (30
agents) and `work` (8) measure zero. The superseded plan's `shared:wait-once` block across three
carriers had no evidence behind two of them, and their lifecycles differ anyway — `fix` verifies each
correction before committing it and has no execution log to record a duration in, `work` verifies
before its single commit with almost nothing left to overlap.

**Three axes, kept apart.** (1) *Unavoidable runtime*: the check has to finish before the phase can
end, so almost none of the 134 minutes of observation wall-clock is a saving — only the overshoot
between "the check finished" and "a call noticed", which this measurement cannot see and does not
claim. (2) *Avoidable wall-clock*: 35 of 96 finite launches were observed with no independent call
issued first, so backgrounding bought nothing there. (3) *Avoidable model usage*: 123 excess round
trips, 16.1 M cache-read — **1.6% of the population's cache read**, not the dominant cost.

**`excessStatusTurns` is a counterfactual, and named as one.** For a finite check observed N times, it
keeps the last observation as the one that consumed the result and counts the N−1 before it, priced
from the request each actually produced. It does not read tool output to decide which observations
returned "not yet", so it is an estimate of the removable turns under the stated counterfactual, not a
census of failed polls. **Daemons are excluded entirely** (56 of 152 launches): probing a server the
phase just started is work, not waste.

**The unit is a round trip, not a `sleep`.** One bounded `until curl …; do sleep 1; done` inside a
single call is one round trip and may be the correct readiness primitive; three separate calls asking
the same question are three. Only the second shape is counted.

**Harness probe, Claude Code 2.1.239, subagent path (2026-08-22).** Protocol, replayable: spawn a
`general-purpose` agent; it calls `ToolSearch "select:TaskOutput,BashOutput,Monitor"`, launches
`bash -c 'sleep 25; echo …'` with `run_in_background: true`, issues four independent one-line Bash
calls in four separate turns, checks the task in no way, and reports what it observed. Results:

- **`TaskOutput` and `BashOutput` do not exist in a worker's tool set** — only `Monitor` resolved.
  Their absence from every transcript was never evidence of misuse, and no rule may require them. The
  background launch's own result names the primitive: *"To check interim output, use Read on that file
  path."*
- **No unsolicited completion message arrived while the agent was working** — though the agent
  exhausted its four calls in 5 seconds against a 25-second task, so this probe does not establish what
  a *still-busy* agent receives. That branch is unprobed.
- **The concluded agent was not resurrected** when its child finished 13 s later: 23 transcript entries
  before, 23 after. Its result had already gone to the parent.

So: **ending the turn is not a way to wait — it is a way to report a phase before its verification
lands.** What is removable is the repetition, not the wait.

**Why it is not planned yet.** `docs/ROADMAP.md` puts `runtime-evals` (B-032) ahead of every workflow
and cost rewrite — a safety net authored after the change is authored against the new behavior — and
the epic puts `outcome-instrumentation` (B-073) ahead of any change *called* cheaper, because a saving
argued from tokens alone is refused by this epic's own scope. This row needs both: B-032 for the safety
half (a premature completion here makes broken work look green) and B-073 for the value half. It is
planned together with B-087, the same background-task contract seen from the other end.

**Acceptance — operational, and not "prompt text shipped".** Cohort: the first ≥20 eligible `build`
agents after the change lands, on a single recorded Claude Code version, bounded by
`--since <merge-commit ISO> --through <cutoff ISO>`. Owner: the maintainer running the post-change
measurement, in the same sitting that closes the row.

| # | Metric | Numerator / denominator | Mechanism | Threshold | If it fails |
|---|---|---|---|---|---|
| 1 | Immediate-observe rate | `launchesWithNoIndependentWorkFirst` / `finiteLaunches` — baseline 35/96 = 36% | `measure-wait-cost.mjs` | ≤ 10% | the overlap rule did not take; reopen, do not close |
| 2 | Excess turns per finite check | `excessStatusTurns` / `finiteLaunches` — baseline 123/96 = 1.28 | same | ≤ 0.2 | the collection rule did not take |
| 3 | Excess share of usage | `excessStatusCacheReadTokens` / `cacheReadTokens` — baseline 1.6% | same | ≤ 0.3% | as above; report alongside 2, never alone |
| 4 | Post-conclusion notifications | `agentsNotifiedAfterConcluding` / `agents` — baseline 2/136 | same | 0 | B-087 is unfixed; the two rows close together or not at all |
| 5 | No green phase on an unfinished or red check | golden journeys, not this script | `runtime-evals` (B-032): one journey where the phase's suite reds and the log entry must not say `completed`; one where the background check never returns and the phase must gate rather than pass | both green before and after | revert the prompt change — this is the safety condition, and it outranks 1–3 |
| 6 | Value side | accepted work per unit of model usage | `outcome-instrumentation` (B-073) | no regression against its own pre-change baseline | the saving is not claimable as value; report cost and outcome side by side |

No verification-miss baseline is claimed here: the frozen baseline above contains no such measure, and
condition 5 names B-032's journeys as the mechanism that will supply one.

**Prerequisite contract, added 2026-08-31 (the B-032 scope cut), corrected the same day.** B-032
shipped the journey *runner* and three journeys over U-01 and U-02 — none of them about waiting — so
condition 5's mechanism is **not inherited by this row and must not be treated as already bought**.
Before a word of the wait protocol changes, **this row's own plan authors two journeys** on
`scripts/smoke-journeys.mjs`, to the same contract as the three that shipped (artifact-only judge,
branch-local mutation, a place in the registry↔fixture bijection, a `docs/CONFORMANCE.md` evidence
line naming the branch it bought):

1. **A red finite verification never produces `completed`.** A phase whose finite check reds must not
   yield a `### Phase N — completed` execution-log entry, however the wait was collected.
2. **A non-returning verification gates, tears down, and cannot resurrect a concluded worker.** A
   background check that never completes must reach a **bounded** gate — a deadline, or a key off
   actual task/process completion, never an unbounded sentinel poll — tear down every task and
   process the phase started before the entry is appended, and leave no registration that can notify
   a worker which has already concluded.

**What must be true before the implementation changes.** Both journeys' definitions, judges, seed
overlays and **branch-local mutation fixtures are committed, and each mutation reds its own judge.**
*That is the entire meaning of "red appropriately" on this row: it is a property of the mutation
fixtures, never a demanded live outcome.* Then **one pre-change live `--only` run per journey**,
which **records what the current build actually does and prescribes no colour**:

- Journey 1 may come back **evaluator-green** — if `/esq:build` already refuses to complete a phase
  over a red finite check, that is the correct pre-change reading and the net is still real, because
  the post-change run has to reproduce it.
- Journey 2 may come back **evaluator-green** if the lifecycle already holds, or **evaluator-red**,
  in which case it is **parked as this bug's evidence** —
  its capture kept, `--only` refusing, no `docs/CONFORMANCE.md` evidence line until it goes green.

**Neither result may be changed by weakening a judge** (`D-park-a-journey-never-loosen-its-judge`). A
judge that reds is a finding; a judge edited to stop reddening is the failure this whole suite exists
to prevent.

**After the protocol change, both live journeys must be evaluator-green before this row or B-087
closes.** That is condition 5's real bar, and it outranks conditions 1–3 as that row already says.

**Spend cap, explicit:** **one pre-change and one post-change `--only` run per journey — four
targeted runs maximum.** No automatic retry, never the full live suite, and a red never re-bought.
Journey 2 is B-087's contract from the waiting end; the pair serves both rows and they close
together, as condition 4 already says.

**Re-measure with** `scripts/measure-wait-cost.mjs` (`tests/measure/` fixtures the classifier). It
prints counts, durations, versions, dates and token totals only, and never persists a prompt, a
response, a command, a path or any tool-result text. Nothing under `~/.claude/` is ever modified.

**Notes:** 2026-08-29 — live recurrence in this repo, a shape the frozen baseline does not count. A
background shell stayed alive **3h27m** after its workflow had concluded, running
`until grep -qE '^Summary' <task-output>; do sleep 5; done; tail -6 <task-output>`. The expected marker
never appeared and the loop carried no deadline. Under *"the unit is a round trip"* this is one call,
not repeated model turns, so `excessStatusTurns` is blind to it — but it leaves a harness task alive
and can fire a notification long after the parent has reported, which is condition 4's failure from the
other side. **Acceptance is therefore short a condition:** a wait must forbid unbounded sentinel
polling — it carries a bounded deadline, or it keys off actual task/process completion — and every wait
is torn down before the worker concludes. Not yet written into the table above; the owner adds it in the
same sitting that runs the post-change cohort. B-087 carries the same condition from the lifecycle
end — an unbounded wait is exactly the registration a late notification arrives into.

## B-087 — A stopped background task stays registered, and its late notification resurrects the worker

**Current scope (2026-09-24):** The completed background-task-lifecycle plan explicitly disclaims clearing the harness registration. build now forbids reviving concluded work and orchestrators measure elapsed spans; these rules and green candidate captures do not prove zero late notifications. Revisit only with a concrete recurrence or a relevant harness capability change. Historical plan references describe prior acceptance only; no execution plan is present in this public checkout.

**What (corrected 2026-08-22 by transcript forensics — the first wording blamed the wrong object).**
The phase-2 worker of `a-way-to-reach-someone` (agent `a70e8db3`, Claude Code 2.1.239) issued its last
tool call at 04:46 and reported. At 05:37 — 51 minutes later — a background-task notification arrived
and resurrected it for a full-context turn. The notification was **`status: killed`** on task
`bp5itdoy3`, *"Background command 'Start this worktree's API on 3099' was stopped"*.

That server was not left running. The worker had **deliberately stopped it mid-phase** to restart it
with both origins trusted, and its own teardown was complete and correct: both throwaway ports free,
the fixture household destroyed, the user's own servers on 3004 and 5175 untouched — which is what the
resurrected turn spent itself confirming. What survived was the **harness's registration of the
background task**, whose status change was delivered long after the process behind it was gone.

**Why it matters:** two costs and one wrong number. The resurrection is a full round trip on a phase
already logged and committed, at a moment when nothing it says can reach the plan. The parent then
reports the agent's whole lifetime as the phase's cost — `finished · 1h13m22s` for 23 minutes of work —
and **the worker's own elapsed was right**: its conclusion says `· 23m`. So "tell the worker to report
honest elapsed" fixes nothing; the inflated figure is the orchestrator's line, read from the harness's
agent lifetime rather than from the span the worker reported.

**What is proven, and what is inference.** Proven from the transcript: the server process had been
stopped by the worker itself; a `status: killed` notification for that task arrived 51 minutes later;
the concluded worker was resumed by it for one full-context turn; and the parent displayed the agent's
lifetime rather than the 23-minute span the worker itself reported. **Inference, not yet proven:** that
the delay is the harness's task registration outliving the process. It is the best available reading —
the notification's own status says the task was stopped, not that it exited — but no controlled probe
has confirmed the mechanism, and the fix must not be prescribed from it.

**Probe before planning.** On the version in use, and inside an `Agent` rather than only the parent
session: (1) does `TaskStop` — or any task-cancellation primitive — exist in a worker's tool set at
all? The 2026-08-22 probe for B-085 found `TaskOutput` and `BashOutput` do not, so this cannot be
assumed. (2) Does stopping through that primitive suppress the notification, or deliver it at once?
(3) How do a PID stop, a process-group stop and a managed-task stop differ in what is left registered?
(4) What happens with a pipeline (`server | tail`), where the wrapper outlives the server? (5) Is a
`killed` notification queued immediately and delivered late, or generated late? (6) Does a finite task
behave differently from a daemon? Each answer is content-free and belongs beside B-085's probe record.

**Two fixes, and the second is not the worker's.** The lifecycle half — retain every task id the phase
creates; consume a finite check's completion exactly once; for a daemon, release only what this phase
started, never a pre-existing user process; confirm owned ports, processes and tasks are gone before
the execution-log entry is appended — is only prescribable once the probe says which primitive exists.
The elapsed half is not a worker instruction at all: the worker already reported `· 23m` correctly, so
telling it to "report honest elapsed" changes nothing. Nor is parsing that prose a robust source. The
fix belongs to whoever reports the number: the orchestrator should take the phase span from its own
timestamps around the spawn and the result it received, excluding anything delivered afterwards — or
the worker should return a structured span if that is to be the contract. Decide which before planning.

**Prerequisite contract, added 2026-08-31 (the B-032 scope cut), corrected the same day.** "After
`runtime-evals` (B-032)" no longer means the net exists: B-032 shipped the journey runner and three
journeys over U-01 and U-02, none of them about background work. This row's plan — the same plan as
B-085's — must author the two journeys itself, against `scripts/smoke-journeys.mjs`, and this row
owns the second: **a non-returning or background verification reaches a bounded gate, tears down
every task and process the phase started, and cannot notify a worker that has already concluded** —
no `completed` entry appended over a live registration, no unbounded sentinel poll, no
post-conclusion notification.

**Before the lifecycle rule changes:** the journey's definition, its artifact-only judge, its seed
overlay and its **branch-local mutation fixture are committed, and the mutation reds the judge.**
*"Red appropriately" means that and nothing else — a property of the mutation fixture, never a
demanded live outcome.* Then **one pre-change live `--only` run**, which records what the current
build actually does and prescribes no colour: it may come back **evaluator-green** if the lifecycle
already holds, or **evaluator-red**, in which case it is **parked as this row's own evidence** the
way a red journey is parked — capture kept, `--only` refusing, no `docs/CONFORMANCE.md`
evidence line until it goes green. **Neither result may be changed by weakening the judge**
(`D-park-a-journey-never-loosen-its-judge`); a red here is this bug reproduced under instrument,
which is worth more than a green.

**After the change, the live journey must be evaluator-green before this row or B-085 closes** — the
two close together, as B-085's condition 4 already requires. **Spend is capped at one pre-change and
one post-change `--only` run per journey — four targeted runs maximum across both rows**, no
automatic retry, never the full live suite. Its sibling journey (a red finite verification never
produces `completed`) is on B-085. The probe questions above still come first: the journey pins the
contract, the probe decides which primitive the fix may name.

Same background-task contract as B-085, from the other end; sequence them together, after
`runtime-evals` (B-032).

**Notes:** 2026-08-29 — acceptance owes a bounded-wait condition, shared with B-085 and unwritten on
both rows. Live recurrence in this repo: a background shell ran
`until grep -qE '^Summary' <task-output>; do sleep 5; done; tail -6 <task-output>` for **3h27m** after
its workflow had concluded — the sentinel never appeared and the loop carried no deadline. It is this
row's contract from the waiting end: the loop is what keeps a harness task registered, which is the
state a late notification arrives into. Whatever acceptance the lifecycle half gets must forbid
unbounded sentinel polling — a wait carries a bounded deadline, or it keys off actual task/process
completion — and every wait is torn down before the worker concludes. B-085's condition 4 is the metric
side of this; the rule side is not yet in either table.

---

## B-095 — Expanded runtime-eval coverage on the shipped journey runner

**Current scope (2026-09-24):** Mandatory model-mismatch stops, lanes and old U-number coverage are retired. Preserve useful candidate outcomes: authorization, honest verification, bounded corrections and named UI states. A concrete defect and bounded question must select each new journey; no broad campaign precedes delivery.

**What:** the behaviors removed from B-032 on 2026-08-31 when that row was reduced to the v1 it
actually delivered. The substrate they need now exists — `scripts/lib/journey-runner.mjs`,
`scripts/smoke-journeys.mjs`, the seed/overlay convention, the declared capture schema, the
per-branch mutation and the registry↔fixture bijection — so each item below is one journey on that
runner, not new machinery, with one exception noted.

Three named scenarios, each owing an artifact-only judge, a branch-local red mutation, and a
`docs/CONFORMANCE.md` **Runtime evidence** line that names the branch it actually bought:

- **U-05 — an orchestrator asserts the worker's model.** A seeded telemetry store *inside the scratch
  root* whose completed worker row is not `opus` → exactly one main-conversation `Agent` spawn, no
  Phase 2 entry, no commit past Phase 1. The named safe fallback is prose and is recorded as the
  corroboration boolean; the judge holds the stop.
- **U-03 — unattended execution retries only an unclassified phase.** A phase agent returning neither
  a log entry nor a reported failure earns exactly one reconciliation pass and no third spawn, no
  `### Phase 1 —` and no `### Phase 2 —` heading, no commit past the seeded anchor, and an attended
  `/esq:build` hand-off recorded as corroboration. **This buys one branch of U-03, not the scenario:**
  the mutually exclusive "a reported failure is relayed rather than retried" clause is a second
  journey, and the evidence line must say which branch it holds.
- **U-04 — a decision authorizes exactly what was offered.** Two ordered runs in one scratch root:
  run 1 stops at the red with the brief byte-unchanged and commits nothing; run 2, given the option
  letter, makes exactly the `do:`'s commit, closes that red, and re-spawns no finder. **This is the
  exception** — the harness runs one prompt per row per root, so a two-run journey is a runner
  capability to add first.

And the broad ambitions B-032's old description carried but never scoped to a journey: no
unauthorized mutation before a mandate; each lean-assurance classification routes exactly once;
malformed plan or backlog state degrades locally; corrective loops terminate within their documented
bounds; expensive workflows respect declared run or token budgets; orchestrators never spawn parallel
workers into one working tree; a UI phase observes every named state or pauses rather than
self-certifying from tests. Each needs a scenario in `docs/CONFORMANCE.md` before it can have a
journey — several do not have one yet, and writing the scenario is the first half of the work.

**Why it matters:** the substrate is worth what it is pointed at. Three journeys prove three
behaviors; the rest of the orchestration contract is still lexical, which means it is still only
proven to be *written down*.

**Read this first:** commit **`cd3485f`** holds the removed Phases 4–6 of
`docs/plans/2026-08-29-runtime-evals-golden-journeys.md` — seed overlays, judges, mutation shapes,
the per-phase bill and the exact `--only` discipline for minting each journey. That design was paid
for; re-planning without reading it re-derives four journeys from scratch.

**Sequencing, stated so this row is not mistaken for a gate.** It **follows** the
verification-collection objective rather than blocking it. A workflow change that needs a safety net
carries the journeys it needs as prerequisites on its own row — **B-085** and **B-087** already do:
definitions, judges, seeds and branch-local mutations committed and each mutation reddening its own
judge, then one pre-change `--only` run per journey that records the current behavior without
prescribing its colour, and evaluator-green on both after the change. This row is the general
coverage campaign, and a general campaign never sits ahead of the specific nets. **B-094** (a mutation as a
one-journey overlay instead of a full copy of the capture) is worth landing before any journey here:
without it, every journey added re-derives every mutation that came before it.

**Constraints inherited, not re-argued:** billed live only on explicit demand via `--only`, one run
per mint and a red never re-bought; free deterministic replay inside `audit.sh`; verdicts from
artifacts, never from the run's prose; every persisted field a declared shape in
`capture-schema.mjs`; the child sandboxed to a `mktemp` root with `ESQ_TELEMETRY=off` and the
legacy-shadow refusal ahead of every spawn; a journey the product does not honor is parked with its
red capture, never loosened.
## B-096 — No mechanical path from a repeated correction to a failing check

**Current scope (2026-09-24):** A generic observer/promotion system is not justified by current evidence. Preserve content-free hooks and no always-loaded learned prose; a future proposal must name the repeated failure and a useful behavior/reference/format test.

**What:** `mechanize-repeated-corrections` is a standing rule of this project: a correction the user
makes twice becomes a check that fails the build, fault-injected to prove it fires — restating it in
prose is not a fix. Every step of that path is currently a human one. Nothing observes that a
correction happened, nothing counts the second occurrence, nothing proposes the check. `/esq:harvest`
recovers *decisions* from artifacts and questions; `/esq:sweep` reconciles the backlog against what
shipped. Neither is watching a session while the user corrects the run.

**Why it matters:** it is the one gap the external comparison surfaced that the set does not cover
somewhere else, and it is self-limiting in the worst way — the rule that says "mechanize the repeated
correction" is itself the least mechanized rule in the repo. The evidence that a correction repeated
lives only in transcripts nobody re-reads, so the second occurrence is indistinguishable from the
first and the check is never written.

**Prior art, and why its shape is wrong here.** ECC's `continuous-learning-v2` (v2.1) is the closest
working implementation: `PreToolUse`/`PostToolUse` hooks append prompts and tool calls to a
per-repo `observations.jsonl`; a background Haiku observer extracts atomic *instincts* —
`{id, trigger, action, confidence 0.3–0.9, domain, source, scope, evidence}` — from user corrections,
error resolutions and repeated workflows; confidence rises with observations; an instinct seen in 2+
projects is promoted from project scope to global; `/evolve` clusters instincts into skills, commands
or agents. Three properties of that design are disqualifying for esq and must not be carried over:

1. **It persists content.** The observation log holds prompts and tool inputs. `plugin-runtime` is
   explicit: hooks are bounded and store numbers, never content. Whatever signal is captured here has
   to be content-free — a counter keyed by something already structural, not a transcript.
2. **It promotes into always-loaded context.** An instinct's payoff is that it is in the window at
   the right moment; ECC pairs 286 skills with 23 always-loaded rule packs on the same premise. That
   is precisely the class `shared:read-once` and "the round trip is the unit this system is billed in"
   exist to forbid. In esq the terminal form of a learned rule is a check that fails, which costs
   nothing to carry and cannot be ignored.
3. **A confidence score is not a justification.** Promotion at a threshold is CLAUDE.md's fourth cost
   question in its purest form — automating a manual step inherits the written rule and none of the
   unwritten one. The human judgment being replaced here is *whether the correction was the user
   teaching the system or the user changing their mind*, and no count distinguishes those.

**Wanted shape (to be argued, not assumed):** three separable pieces, each cheap on its own —
(a) a content-free correction signal recorded by an existing hook handler, keyed structurally;
(b) a user-typed command that reads those counters and hands back the candidates *as an option set
with a runnable `do:`* rather than acting on a threshold; (c) the promotion itself producing a
`scripts/check-*.sh` plus its fault injection, registered like any other check, with the backlog row
and `docs/AUDIT.md` entry that go with it. Note that (c) is the part that already exists — the audit
harness is the target, not a new mechanism — which is what makes this row plausible at `med` rather
than an epic.

**Open before planning:** what the structural key for (a) actually is. A correction is only
observable to a hook as a shape — an edit to a file the run just wrote, a rejected tool call, a
`/esq:fix` escalation — and if no such shape is reliably distinguishable content-free, this row
reduces to (b)+(c) driven off the artifacts the cycle already writes (fixes briefs, review findings,
check verdicts), which may well be the better answer and is strictly cheaper. Decide that before
spending anything on hooks.
## B-129 — Roadmap recommends closing an item whose completion condition has not been met

**Current scope (2026-09-24):** roadmap/SKILL.md still allows done from complete covered plans. status and sweep require whole-outcome evidence, so the demonstrated risk is misleading projection/handoff, not automatic false backlog closure. B-085/B-087 provide a current counterexample; do not revive outcome-join gates.

**What:** Bare `/esq:roadmap` treats "plan complete + backlog row still `Planned`" as stale
bookkeeping and emits a closure recommendation (`/esq:sweep`). On 2026-09-06 it did this for B-121,
whose detail section records an explicit post-plan completion condition — the row closes only when
`node scripts/outcome-join.mjs --baseline-gate` exits 0 — while the live gate exits 3 at 56% coverage
with two of its three conditions failing.

**Why it matters:** B-121 is the head of `Now` and carries both blocking edges in the roadmap. Closing
it on that recommendation would release `telemetry-round-trips-part-two` (B-071, B-044) and
`verification-collection-lifecycle` (B-085, B-087) to be worked against a baseline that was never
collected — and a pre-change baseline cannot be re-taken after the change it baselines.

**Notes:** Dedup — **not** folded into B-043. B-043 asks read-only state to report *staleness*: live
backlog status beside what a projection says, with freshness evidence, never rewriting `ROADMAP.md`.
Nothing in it requires any command to honor a conditional closeability rule, and reporting a stale
projection is not the same defect as recommending a false closure. B-121's own detail already forbids
`/esq:build` from proposing its closure, which is the same prose-only guard failing at a second
caller. Scope the answer to how a completion condition is recorded and read — by `/esq:roadmap` and
by `/esq:sweep`, since both propose closure — rather than to one command's output line.

**Implementation and acceptance evidence (2026-09-24):**

- Reproduced by reading the pre-change roadmap procedure against a scratch fixture: one `Planned` row, one covered plan with a completed Phase 1, and detail/log evidence that process teardown succeeded but late notifications remain. The real CLI returned `plans[0].state: complete` and the row `Planned`; the old `done` alternative admitted eviction while its read budget excluded the unmet condition. This is a reproduced instruction-path defect, not a newly captured model run or a false closure actually performed by sweep.
- Roadmap now requires every covered reference to be settled, preserves known outstanding acceptance even on a plan-only entry, and reads only relevant item details before disposition advice. An unmet or unproved condition keeps the entry and its dependencies active. Sweep reads that same existing detail prose before any evidence signal can settle closure. The CLI still owns plan/status structure; the model judges the whole outcome. No schema, executable outcome gate or telemetry was added.
- Six scratch-fixture checks exercised the existing CLI: complete plan with unmet, absent and sufficient item evidence all retain `Planned`; explicit `set-status Done` records disposition; a phase-less file returns `no-phases`; a missing plan supplies no completion state. The semantic reading pass traced roadmap A/B/C and sweep: unmet/unproved stays open without a closure question or repeat build; sufficient evidence earns reconciliation but no roadmap eviction before disposition; Done with a complete plan may ship; missing/phase-less references and active epics cannot. The `needs` target stays in the queue until disposition. This is manual scenario verification, not an automated model-behavior assertion; its repeatable reading contract is in `docs/AUDIT.md`.
- B-085/B-087 were checked as the retained counterexample: their existing current scopes explicitly leave operational acceptance unproved despite historical plan completion, so neither is closed or re-measured. Their historical proof and dispositions are unchanged. B-172, B-079 and B-169 are outside this change; the archive README is not an execution plan. No paid model journey, subagent, publication or release was used.

**Resolution:** 2026-09-24: roadmap retains unclosed item outcomes despite completed plans; roadmap and sweep read explicit completion conditions before disposition advice. Six local CLI fixture checks and the semantic scenario reading pass passed; ./scripts/audit.sh passed all 7 product checks outside the sandbox after a minimal test isolated sandbox-only Node diagnostic failures. No paid model journey, release or publication.

## B-131 — /esq:plan's entrypoint is one line from check-plugin.sh's 500-line cap

**What:** `check-plugin.sh` fails any `SKILL.md` at 500 lines or more. `plugin/skills/plan/SKILL.md` is at 499 after `fewer-round-trips-per-run` Phase 2 added its `## Self-audit` section, which only fit because Task 2.2's freshly written "Commit and stop" steps were reflowed onto single lines in the same pass.

**Why it matters:** The next person to add a paragraph to `/esq:plan` — a new check, a new preflight step, one more worked example — fails the audit, and the escape every other overlong skill would take is closed to this one: `check-skill-parity.sh` compares `commands/esq/plan.md` line 4..EOF against the entire skill body, so only `build` may live across a `references/` directory. The remaining options are deleting prose or changing the parity rule, and both are decisions, not edits.

**Notes:** Noticed while landing Phase 2 of `fewer-round-trips-per-run`; out of that plan's scope, which touches no audit script.

**Resolution:** The parity rule that forbade a non-build skill splitting into references/ is gone: scripts/check-skill-parity.sh and audit check 27 were deleted in 0a78928, and check-plugin.sh's 500-line cap still applies to */SKILL.md only. The remedy is restored without changing the cap.

## B-157 — check-skill-parity.sh has no fault injection, and its split list makes one direction silent

**What:** Audit check 27 runs `scripts/check-skill-parity.sh` with no `test-skill-parity-guard.sh` beside it — the only check in the suite without its own fault injection. Since `plan-loads-what-it-needs` the script reads a `SPLIT_SKILLS` list, so which parity rule a skill gets is now configuration.

**Why it matters:** One direction is silent. A skill wrongly named in the list drops from byte-equal parity to the weaker line-presence rule and nothing reports it: its legacy mirror could then be reworded or reordered and still pass, which is exactly the drift check 27 exists to catch. The other direction is loud — a split skill left off the list reds immediately — so the gap is asymmetric rather than total.

**Notes:** Pre-existing: the check has never had an injector, and `plan-loads-what-it-needs` neither introduced the gap nor widened the check's reach beyond its own two entries. Filed by `/esq:review` as out of scope for that unit. The fix is the house pair — `scripts/test-skill-parity-guard.sh` mutating a throwaway corpus (a byte-differing mirror, a reordered split union, a skill wrongly listed, a split skill unlisted) and an `audit.sh` section beside check 27.

**Resolution:** The unproven check is retired rather than injected: scripts/check-skill-parity.sh and audit check 27 were deleted in 0a78928, so no check in the suite is left without fault injection. Held by ./scripts/audit.sh exit 0 at 4a2fe6f.

## B-169 — esq blocks on implementation-detail questions instead of deciding and shipping

**Current scope (2026-09-24):** Four upstream tagged plans were recorded complete; none is present in this public snapshot. plugin/standards/STANDARDS.md and esq standards resolve project overrides; Part 2 domain defaults remains empty on purpose. The depth bound exists but B-179 exposes a missing safe exit. Preserve A/D -> B -> C and the user-value, cost and design objectives; do not close the umbrella or rebuild standards.

**What:** Three recurring stop shapes in ESQ runs: (1) a spent repair attempt identifies an exact next edit but hands it to the user; (2) an implementation detail triggers a user question even though the delegated worker can decide it within the stated constraints; (3) a `→ Next` names an outcome without a runnable action. Each case interrupts delivery without requiring a product decision.

**Why it matters:** the user is product owner and architect, not the detailed developer. A question is worth its round trip only when it needs product, scope, architecture or UX authority; everything below that altitude is delegated work esq re-charges to the human at the worst possible moment (mid-phase, tree dirty, context cold). The user states it as a hard requirement: blocking is the failure, shipping is the objective.

**Notes:** A measured run stopped after two of six phases despite having the exact fixture edit needed to continue. Repeated corrective briefs show the same pattern: ESQ can spend more work repairing its own process than delivering the user's requested change. The correction is to execute a diagnosed action within the mandate, use durable implementation standards for delegated defaults, and load specialist guidance when needed. These are three ordered initiatives, not an app-specific requirement.

**Preparation follow-up (2026-09-24):** B-181 separately addresses outcome continuity and a contradictory UI re-grill instruction in the existing preparation path. Its bounded worked example is not a live specialist-guidance acceptance for C; B-169 remains Open.

## B-170 — Le backlog n'a aucun rang d'ordonnancement : 40 des 51 items ouverts n'ont aucune priorité et 3 seulement en portent une confirmée, donc « c'est quoi le prochain » n'a de réponse que pour les 16 blocs groupés de la roadmap. Voulu : chaque item porte en tout temps une priorité ET un rang à l'intérieur de cette priorité, assignés automatiquement, dans chaque projet — un ordre total, pas trois seaux

**Resolution:** Every open row now carries a priority and a position end to end: the Rank column and the never-blank priority default (Phase 1, 1c2e0f4-era CLI suite), the two verbs that write them (Phase 2), /esq:backlog placing what it captures and printing one ordered sequence (Phase 3), and /esq:roadmap plan placing every open item including those that earn no entry (Phase 4, 48ac82a). Pinned by conformance scenario P-12 and proved by ./scripts/audit.sh at 2391707 — 60 checks clean.

## B-173 — /esq:roadmap Mode C edits the order but writes no Rank, so a move or an edge change leaves the stored sequence stale until /esq:roadmap plan is re-run

**Resolution:** Mode C now re-places the open ranked ids a moved entry covers in the same commit as the roadmap write (685c1b6), the reversed sentence is gone from all four carriers and the README (22160ee), and the contract is pinned as conformance scenario P-13 with two injected faults (4d70be0); proved by ./scripts/audit.sh exit 0 at 4d70be0.

## B-174 — a `⏸ awaiting manual verification` pause on a project with no instrument can no longer be resolved by the written procedure

**What:** Step 3 of `plugin/skills/build/references/manual-verification.md` (:36, mirrored at `commands/esq/build.md`:206) is the only written source of a user-supplied observation — `AskUserQuestion`, PASS / FAIL / couldn't get there, recorded as the `user confirmed` instrument at :42 and as `manual[].observed` in `resolve-block --confirm` at :58. `beb5e8f` closed it to the missing-instrument case (*"A missing instrument and a driver that will not launch are both that uncovered link, and neither is ever routed here"*). The resume path at :54 re-runs that same procedure, so a project with no driver pauses, re-probes, finds nothing, is barred from step 3, and loops.

**Why it matters:** the pause becomes unresolvable by any written route, and it over-shoots the decision it implements — `D-the-observation-path-not-the-instrument` preserves "genuine personal judgment and access only the user holds stay a legitimate ask **about the result**", and a PASS/FAIL on a screen the user looked at is a result ask, not a question about how to build an instrument. The boundary to redraw is failed-launch/absent-resource-as-*engineering-question* closed, observation-result ask kept.

**Notes:** escalated by `/esq:fix` from the observation-path-before-manual review brief as 🟡 — redrawing that boundary moves the `need P-10 build` needle for the ask condition in `scripts/check-conformance.sh`:195, the `ASK_CONDITION` injection in `scripts/test-conformance-guard.sh`:273, and the P-10 paragraph in `docs/CONFORMANCE.md`, so it is a guard-assertion change across five files, not a reword.

**Resolution:** Step 3 reopens as a result ask on a named condition (item 2 spent, user can reach what the run could not), bounded against fabrication and a second round; a resume honours a still-valid user observation rather than discarding it on a failed probe, which is what makes a pause created before this unit resolvable. da616c4, pinned by P-14 and its injections at 0e9a18e.

## B-175 — the clauses that authorize and classify the `(manual)` pause still key on instrument presence

**What:** `plugin/skills/build/SKILL.md`:245 ("`(manual)` steps left unobserved because the probe found no instrument at all") and `plugin/skills/build/references/reporting-and-stops.md`:105 ("a `(manual)` step left unobserved because the probe found no instrument") are the two clauses that actually authorize and classify the pause, and both still key on the trigger this unit retired.

**Why it matters:** the missing starting-state case — a run skill that launches the app but cannot create the record the step observes — now reaches item 2 of the disposition, exceeds the phase mandate, and is told to "take the existing blocked or failure exit", but the only clause describing that exit for manual steps requires that no instrument was found at all. The run has no bullet matching its state and no [authority] stop classified for it.

**Notes:** escalated by `/esq:fix` from the observation-path-before-manual review brief as 🟡 — fixing `SKILL.md` collides head-on with this unit's own recorded verification (`git diff --stat 2ac72b6 -- plugin/skills/plan/SKILL.md plugin/skills/build/SKILL.md` empty, verified at 9923cba), so the entrypoint edit, its legacy mirror `commands/esq/build.md`:351 and :832, and the retirement of that verification have to be planned together rather than applied under a fix.

**Resolution:** The pause is authorized, classified and summarized on an uncovered observation in all six carriers (build/SKILL.md, reporting-and-stops.md, autopilot/SKILL.md, the two legacy mirrors, README prose), so the missing starting-state case has a matching bullet and a classified [authority] stop. 8cab5dc, with the retired trigger refused by P-14 at 0e9a18e.

## B-176 — the last phase's route-derived hand-off is pinned by no conformance clause

**What:** `/esq:build`'s hand-off after the final phase is stated in two carriers and guarded in neither.
`plugin/skills/build/SKILL.md:82` (mirror `commands/esq/build.md:75`) says *"the last phase's `→ Next` is
computed from `route`"*; `plugin/skills/build/references/reporting-and-stops.md:51` (mirror
`commands/esq/build.md:680`) carries the mapping itself — *"Last phase → **the route decides it, not a
constant.** Take `route` from the lane preflight resolved and name its command, with its subagent count on
the same line so the bound is read before it is spent"* — plus the three route rows (`converge` → `/esq:converge <plan-path>`,
`check` → `/esq:check <plan-path>`, `review` → `/esq:review <plan-path>`) and their attended alternatives.
`grep` over `scripts/check-conformance.sh` and `docs/CONFORMANCE.md` returns no clause for any of it.

**Why it matters:** three distinct regressions ship green. A packaging migration that drops the mapping
leaves the hand-off unspecified, so a completed plan hands back a constant; dropping the `<plan-path>`
placeholder yields a command the user pastes and the receiving skill refuses for want of an argument;
dropping *"with its subagent count on the same line"* spends up to four subagents with no bound stated
before the spend, which is the cost rule in `CLAUDE.md § Cost is a requirement` going unenforced at the one
moment it is most expensive. Check 16 mechanizes the announce bound at the *start* of a command; nothing
mechanizes it at the hand-off.

**Notes:** Observed 2026-09-20, not by a migration but by a run: the final phase of
`observation-path-before-manual-fixes` reported `→ Next: /esq:land` — a constant, with no argument and no
subagent count — where `esq lane` returned `route: converge`. The prose was correct and had been read in
that same session, so this row is *not* a claim that the instruction is wrong or that a check would have
stopped that run; a lexical clause cannot make a model obey prose it read. What the row asks for is that the
sentences cannot be deleted silently, which is the same bar `P-14` and the `refuse` clauses hold elsewhere
in this file. Pre-existing on `main` and untouched by the unit that observed it — the unit's only edit to
`reporting-and-stops.md` is in the paused-report example and the stop taxonomy, ~30 lines above.

Shape a fix like the existing pairs: `need` clauses on the `build` carrier for the route sentence, for each
of the three route rows, and for the subagent-count requirement, each shipping its fault injection against
the native layout and the legacy copy, per the `audit-scripts` contract.

**Resolution:** 2026-09-24, e1c24c0: The row asks to pin a sentence in two carriers; only plugin/skills/build/references/reporting-and-stops.md remains and still routes the handoff. CLAUDE.md rejects checks of sentence presence. No observable wrong-handoff regression was established; the executable-next-action goal stays in B-169/B-079.

## B-177 — the parent plan's Phase 1 verification step still measures the plan entrypoint against the outrun fixed base

**What:** `docs/plans/2026-09-18-observation-path-before-manual.md:244` carries
`(auto)` `git diff --stat 2ac72b6 -- plugin/skills/plan/SKILL.md` and reads an empty diff as proof
that the plan entrypoint is unchanged, so the plan-side reference stays conditional. At HEAD that
command is no longer empty: 19 insertions and 3 deletions, all of it main's own `44c291e` and
`78ce894`, brought in when main was merged into the branch on 2026-09-20. Against `main` the diff
*is* empty. The fixes plan's own copy of the same step was re-based to `main` on 2026-09-20 with the
user's authorization (repair edit 1/3, commit `7b00fdd`); the parent's copy was never propagated.

**Why it matters:** `esq gate verify` runs the plan's `(auto)` commands at landing, so the shipping
unit reds on a step whose property is still true — the unit never touched the plan entrypoint — only
measured against a base that can no longer isolate the unit's share. The fix is the re-base already
authorized for the sibling step, carrying the same amendment note naming the two main commits.

**Notes:** Filed by `/esq:fix` rather than applied. Both remaining items in
`2026-09-21-observation-path-before-manual-fixes-fixes.brief.md` were tagged 🟢 by `/esq:check`, and
both are real and still present, but neither is `/esq:fix`'s to write: its single write to a plan
file is the `esq plan record-verification` proof block appended below `## Execution log`
(`docs/ARCHITECTURE.md § docs/ — ledgers and projections`), and this edit is to a prospective
`## Phases` verification step. `/esq:build` is the writer that makes a repair edit there, which is
exactly what `7b00fdd` was.

**Resolution:** The parent plan's Phase 1 (auto) step now reads git diff --stat main -- plugin/skills/plan/SKILL.md and carries the 2026-09-21 amendment note beside its 2026-09-20 one (commit 0874dce); verified empty output and esq gate verify returns the main command

## B-178 — two `Done looks like` bullets assert an emptiness that is false at HEAD

**What:** `docs/plans/2026-09-18-observation-path-before-manual-fixes.md:92` and
`docs/plans/2026-09-18-observation-path-before-manual.md:100` each state that
`plugin/skills/plan/SKILL.md` is byte-unchanged from `2ac72b6`. Since main was merged into the branch
on 2026-09-20, main's own `44c291e` and `78ce894` edit that file, so the assertion is false. The
claim the bullets were written to make — this unit never touched the plan entrypoint — holds against
`main`, which is the reference the unit actually lands on.

**Why it matters:** a completion criterion that is false at HEAD cannot be read as met, and the two
bullets are the prose half of the same defect `B-177` carries mechanically. Leaving them stale makes
the plan's own `Done looks like` unusable as the landing check it is read as, and invites the next
reader to conclude the unit changed the plan entrypoint when it did not.

**Notes:** Filed by `/esq:fix` rather than applied, for the same write-scope reason as `B-177`: these
are prospective `## Done looks like` sections in two plan files, and `/esq:fix` writes only its
`record-verification` proof block into a plan. Fix both bullets in one edit with `B-177`, naming the
same amendment.

**Resolution:** Both ## Done looks like bullets re-based to main with their amendment named and without re-arming the negative control (commit 14919c8); grep -n 'SKILL.md. is byte-unchanged from .2ac72b6' over both plans has no match

## B-021 — A phase editing commands/esq/ must verify with install.sh before audit.sh — check 10 reds by construction otherwise and the phase agent reads it as a failure

**Resolution:** Moot: the flat legacy mirror and check 10 were deleted by this unit's stem plan (0a78928, 83c5625, a87a960, 0f649d7, 010ed6c), so no phase can edit that tree or trip that check. Held gone by audit checks 61/62, green at bc1db0d.

## B-089 — `check-skill-parity.sh` (check 27) is one-directional for `build` — lines present only under `plugin/` pass (`scripts/check-skill-parity.sh:41-52`) — so any contract carried only in a plugin reference file is invisible to the gate. Checks 16 and 35 now read `plugin/skills` directly, which closes the announce bound and the ask shape; every other clause in `build/references/*.md` is still unguarded, and a maintainer who adds one sees nothing red

**Resolution:** Check 27's one-directional parity is retired with the mirror it compared (0a78928); Phase 2 repointed every structural check through scripts/lib/skill-corpus.sh, so a contract carried only in plugin/skills/build/references/*.md is now read by the audit directly. Proved by ./scripts/audit.sh exit 0 at 4a2fe6f — 59 checks, 21 commands.

## B-110 — `scripts/check-sharedblocks.sh` cannot be pointed at `plugin/skills` — it globs `<dir>/*.md` and exits 2 on the plugin tree, so the shared blocks are only ever compared in `commands/esq`; when the legacy rollback copies go, nothing checks the source of truth

**Resolution:** scripts/check-sharedblocks.sh walks a nested corpus as of Task 2.4 (a722b60/346d2dc) and its fault injection runs every case against a nested throwaway copy as well as a flat one; scripts/test-sharedblocks-guard.sh — 30 cases pass, re-proved inside ./scripts/audit.sh at 4a2fe6f.

## B-109 — `tests/cli/merge.test.mjs` is gated by no audit check — check 30 names `esq.test.mjs`, `branch.test.mjs` and `ship.test.mjs` explicitly — so a red merge suite, covering the only CLI code that writes to git, still leaves `./scripts/audit.sh` at exit 0

**Resolution:** scripts/audit.sh discovers tests/cli/**/*.test.mjs by convention since 2026-09-22, so merge.test.mjs — and every other suite a hand-kept list could omit — runs in the product pass. Verified: the glob covers all 11 tests/cli suites.

## B-001 — Parked Sheets integration; revisit only when the product need is selected and connector capability is revalidated.

**Current scope (2026-09-24):** Historically parked on an external connector. No current capability claim or connector investigation in this pass; not active execution.

## B-024 — Give spec an explicit continuation after the user answers Je ne sais pas — montre-moi où.

**Initial scope (2026-09-24):** plugin/skills/spec/SKILL.md offered that answer and required rules to be settled before writing, without a specific continuation after showing evidence. Verify an unresolved answer cannot silently authorize a spec change or produce a misleading success.

**Delivered scope (2026-09-25):** The explicit continuation, partial-write and honest-conclusion instructions are implemented and checked by directed reading. The real stale model-routing case was observed through the CLI and resolved against existing CLAUDE.md authority; no new user decision was invented. No native model dialogue or effective-model guarantee is claimed. Evidence and verification limits: [case record](preparation/2026-09-25-b024-spec-continuation.md).

**Resolution:** 2026-09-25: Explicit show-evidence continuation preserves unresolved rules, settled answers/edits and partial-refresh markers; asks only remaining intent. Actual stale E-model-routing observation and existing CLAUDE authority support a scoped spec correction without re-asking. Directed instruction reading, not a native model dialogue; effective worker model remains unknown. Product audit 5/7 initially; only the two failed Node checks retried outside sandbox, both pass. Evidence: docs/preparation/2026-09-25-b024-spec-continuation.md. Local only; no release or publication.

## B-047 — Optional interactive model-pin observation; no delivery or release prerequisite.

**Current scope (2026-09-24):** A headless result does not prove an interactive-session pin. Retain the narrow unanswered question; collect only when it informs a selected model decision.

## B-050 — Document headless verification permissions for a concrete bounded case, without a blanket bypass requirement.

**Current scope (2026-09-24):** The old CLAUDE_PLUGIN_DATA warning is obsolete: plugin/lib/telemetry.mjs ignores that variable, and B-052 is resolved by removing the claim here. A headless check should name the permissions it needs; unconditional bypassPermissions is not the acceptance criterion.

## B-075 — Represent parked versus executing work honestly in existing readers; choose a minimal convention before adding a status.

**Current scope (2026-09-24):** B-001/B-006 and completed plans with remaining acceptance show the distinction. Current canonical statuses remain unchanged; require readers to show reason and restart condition without calling parked work active.

**Resolution:** Delivered the minimal prose convention in status, roadmap and backlog: canonical statuses stay unchanged; explicit parking carries its reason and restart condition and suppresses automatic restart/closure advice. Planned alone no longer proves execution; complete plans require item acceptance before closure advice. esq state now retains existing roadmap acceptance text without another read or a new ledger field. Real B-001/B-006/B-085/B-087 inputs and the mixed B-129/B-079 counterexample inspected; one product audit passed 7/7 in 27.41 s. Evidence and limits: docs/preparation/2026-09-24-b075-parked-work.md. No native model trial, push or publication.

## B-076 — Retain a durable inspectable evidence reference per named UI state, using existing plan logging.

**Current scope (2026-09-24):** manual-verification.md already records an evidence line and instrument; a persistent screenshot/capture reference is not guaranteed. Accept when review can inspect the named state after the session, without a new screenshot platform. Move earlier for an actual UI delivery.

**Resolution:** 2026-09-25: Build retains state-specific durable evidence links in existing verification/manual.observed fields and commits local artifacts with the log. Check/review accept both completion paths, recover missing proof separately from visual failure, and preserve human confirmation without an extra image. Ten existing landing captures were recovered unchanged; two recording paths and a fresh local-clone reader resolved 17 references for six states. Product audit passed 7/7 once. Evidence and limits: docs/preparation/2026-09-25-b076-ui-evidence.md. Local only; events-tracker unchanged; no push or publication.

## B-079 — Offer a scoped advance target from roadmap when discussing one entry.

**Implementation finding (2026-09-24):** The prior scope said status already offered a scoped target. Reading the current sources showed both status rule 6 and roadmap offered only bare /esq:advance. Correct both handoffs using advance's existing Now-entry targeting; preserve the explicit whole-horizon route. Semantic cases and verification limits: [implementation record](preparation/2026-09-24-b079-scoped-handoff.md).

**Resolution:** 2026-09-24: Both roadmap and status now offer advance <slug> for the discussed eligible Now entry, even with one Open item; explicit whole-Now requests retain bare advance. Reused existing advance targeting without a runtime change. Targeted/global/outside-Now semantic paths reviewed; one product audit passed 7/7. No native model journey or model-compliance claim. See docs/preparation/2026-09-24-b079-scoped-handoff.md. Local only; no push or publication.

## B-094 — Use one-journey mutation overlays when new lab coverage makes full-copy fixture churn material.

**Current scope (2026-09-24):** tests/journeys/fixtures/mutated still contains copied captures. This is lab maintenance, not a blocker for a product correction; earn it when extending the registry.

## B-107 — Align land handling of an unrunnable verification command with build acceptance, without weakening the proved criterion.

**Current scope (2026-09-24):** Landing now lives in plugin/skills/land/SKILL.md: it runs gate-selected commands with no replacement, whereas build permits the named artifact/property exception. Keep the mismatch Open; reproduce a current case and preserve equivalent strictness rather than automatically broadening exceptions.

**Resolution:** 2026-09-25: Reproduced actual build proof versus land gate mismatch before editing. Build now repairs an unambiguous prospective command under its existing repair budget, preserves the criterion and history, and records actual-command proof on the tested committed tree. Land retains exact commands and freshness; historical cases require new proof. Three focused real-Git scenarios passed; red, ambiguous/unproved and stale cases remain unproved, with model-judgment limits documented. Reused B-163/B-185 evidence; no general audit or duplicate suite. Evidence: docs/preparation/2026-09-25-b107-command-repair.md. Local only; no user-project change, merge, push or publication.

## B-118 — Optional live plan-to-recorded-origin landing journey beyond deterministic merge tests.

**Current scope (2026-09-24):** tests/cli/merge.test.mjs and worktree-landing.test.mjs cover deterministic landing. They do not demonstrate the full model-authored-header journey; buy a bounded generic fresh-project walkthrough only when adoption friction is the selected question.

## B-130 — Add a minor/major local release choice when a release actually requires it.

**Current scope (2026-09-24):** scripts/release-local.sh remains patch-only. Keep lower priority until such a release; preserve the existing manifest agreement check.

## B-133 — Clarify the remaining journey-promotion cost/version warning at the point of use.

**Current scope (2026-09-24):** smoke-journeys.mjs documents CANDIDATES and whole-registry promotion in comments and usage. The usage does not explicitly join the single-version rule and total purchase before spending. Keep that bounded gap; no new lifecycle framework or paid run is needed to document it.

## B-141 — Resolve concrete contradictory Active decisions by semantic review; do not promise a generic contradiction detector.

**Current scope (2026-09-24):** The proposed arbitrary contradiction check cannot be inferred from status syntax alone. Keep a bounded review need only: identify the decision pair and its authority before superseding either; no automatic policy inference.

## B-158 — Check that actual D-slug references resolve, starting with a demonstrated dead reference.

**Current scope (2026-09-24):** Reference resolution can earn a deterministic guard under CLAUDE.md. No dead citation was established in this pass; keep conditional and separate from prose equality or semantic decision checks.

## B-163 — Stop extracting a documentation path as an executable auto-step command while preserving legitimate executable paths.

**Initial scope (2026-09-24):** extractAutoCommand in plugin/lib/markdown.mjs accepted the single inline span. Accept a focused document-path regression and valid executable-path counterexample; keep distinct from B-107 command substitution.

**Delivered scope (2026-09-25):** A lone `.md` reference remains unresolved, including at gate/proof consumers. Real executable paths and document arguments are preserved. The inspected resolve-block consumer now keeps either kind of pause intact while any auto step remains unresolved. Four focused tests passed within one 7/7 product audit. [Evidence and limits](preparation/2026-09-25-b163-auto-command.md); B-107 remains Open.

**Resolution:** 2026-09-25: Lone .md references now extract as unresolved; executable paths, document arguments and compound commands are preserved. Gate and proof recording retain/refuse unresolved steps; resolve-block now refuses to complete either pause while one remains, without changing the file. Four focused product tests cover extraction and consumers in one 7/7 final audit; no separate suite rerun. Evidence: docs/preparation/2026-09-25-b163-auto-command.md. B-107 remains Open; local only, no publication.

## B-172 — Assign an initial rank when adding a backlog row; keep the sequence complete without a separate rerank.

**What:** Keep the existing backlog Rank coherent throughout capture, closure, reranking and reopening. At selection, `addRow` wrote an empty Rank; `setStatus` retained a closed row's rank, and `rankOrder` could reuse it for active work, which `validate` then reported as a duplicate. Fix the lifecycle through the existing CLI writers.

**Why it matters:** Every capture should remain usable by the queue readers immediately. Manual rank repair adds an interruption and can make the next-work recommendation unreliable. This is deterministic ledger maintenance; priority and deliberate ordering remain user/model judgments.

**Authorized scope (2026-09-24):** The user selected B-172 as the next implementation and approved preparing `/esq:work B-172` for a fresh session. The default for a newly added or reopened active row is the end of the existing stored sequence. This is a neutral initial position, not a new priority judgment. Preserve existing priorities, relative order, IDs and provenance; retain explicit rank placement and roadmap-edge validation. Active means Open, Needs-decision or Planned; closed means Done or Dropped. At selection, a completed B-179 retained Rank 100 in this checkout, providing a concrete closed-rank witness; its later cleanup is not a change to that item's delivery evidence.

**Acceptance:**
1. On a valid ranked ledger, `esq backlog add` leaves the new active row with a unique numeric tail rank in the same successful write. `esq state` reads it immediately; no subsequent manual `backlog rank` call is needed for that new row. Existing active rows keep their relative order and priorities.
2. Closing a row as Done or Dropped and running `backlog rank --order` cannot leave duplicate ranks through a retained closed-row value. Account for closed ranks already on disk as well as newly closed rows.
3. Reopening a closed row places it at the active sequence's tail without reviving its old position or colliding with another rank. Transitions between active statuses preserve position. IDs, Source provenance and resolution text keep their existing contracts.
4. Preserve the existing legacy nine-column format support and an empty/all-closed ledger. Exercise those cases; do not invent priorities or silently classify unrelated pre-existing unranked work. Keep malformed-input refusals atomic and the existing explicit placement/edge behavior intact.
5. Real CLI regressions cover add -> state -> close -> rerank -> reopen -> state/validate, including Done and Dropped. Each successful lifecycle state has unique ranks; no newly active target remains unranked. Run the focused checks the implementation earns, then `./scripts/audit.sh` once for the final tree; do not run its product suites separately again beside it.

**Start here:** `plugin/lib/cli.mjs`: `addRow`, `setStatus`, `rankView`, `rankOrder`, `rankPlace`, `backlogRows` and the duplicate-rank validation. Existing tests are in `tests/cli/esq.test.mjs` (nine-column migration, addRow, duplicate ranks, ordering and placement); merge-derived Rank behavior has existing coverage there too. Read `.claude/skills/plugin-runtime/SKILL.md` before changing runtime/tests.

**Decision context:** `docs/DECISIONS.md` sections `D-a-rank-is-written-never-recomputed`, `D-a-rank-verb-refuses-what-it-cannot-make-total` and `D-a-blank-priority-is-no-longer-a-reachable-state` remain applicable. A neutral initial tail position implements this mandate; it does not authorize recomputing the queue on reads or changing priority-based reader sorting.

**Bounds:** B-172 only. Keep the schema, statuses and CLI verbs; use the existing atomic writers. No new ranking service, generic migration framework, prose-presence checks, mandatory telemetry or paid model journey. B-129 (truthful completion), B-079 (scoped handoff) and B-169/C (specialist guidance) remain separate. No implementation plan or corrective brief for this item is present in the public checkout; the historical `Source` names provenance, not an active plan to resume. In this snapshot, `esq state` may expose `docs/plans/README.md` as `activePlan` with `state: no-phases`; that file explains the archive omission and is not a B-172 implementation plan or a `/esq:build` target. Work should investigate and size this scope normally, then implement inline only if its actual bar is met or give a targeted planning handoff. No new product decision is pending.

**Historical fresh-session entry:** From this repository, load the current source plugin with `claude --plugin-dir ./plugin`, then invoke `/esq:work B-172`. This handoff left the item Open pending the whole acceptance; implementation and verification are now recorded below. No archive plan was resumed.

**Verification (2026-09-24):**

- Before the runtime correction, the initial CLI regression set failed 12 of 13 scenarios, reproducing blank capture ranks, retained closed ranks and reopening at the former position.
- `timeout 30s node --test tests/cli/backlog-rank-lifecycle.test.mjs`: 19/19 PASS in 8.5 s after correction. Real CLI calls in temporary Git repositories exercise add → state → Done/Dropped → rerank → reopen → state/validate; active-status transitions, retained closed ranks, nine-column first writes, empty/all-closed ledgers, legacy unranked work, explicit placement/renumbering, roadmap-edge refusals and malformed-input atomicity are covered.
- The first product audit passed 367/368 tests; its sole failure was an older provenance assertion expecting a blank capture Rank. That expectation was updated to the new tail rank without changing its provenance assertions. The final `./scripts/audit.sh` passed 7/7 product checks in about 26 s; no separate product-suite rerun followed it.
- The backlog skill now describes the CLI tail and no longer requires a second rank call on capture. No priority judgment, read-time ranking, schema, status, CLI verb, telemetry or model journey was added. B-129, B-079 and B-169 remain outside this implementation.

**Resolution:** 2026-09-24: Delivered locally. Capture and reopening assign a unique active tail; closure and explicit ranking clear retained Done/Dropped ranks in the same atomic write. Active positions, priorities, IDs and Source/resolution provenance are preserved. Nineteen real CLI regressions pass, including nine-column, empty/all-closed, explicit placement and atomic refusal cases; ./scripts/audit.sh passes all 7 product checks. No release or push.

## B-179 — Provide a bounded safe correction/disposition for a completed plan when corrective depth is exhausted.

**Current scope (2026-09-24):** Implemented locally: safe prospective corrections and explicitly authorized dispositions use the existing unit, with historical proofs preserved. The two-generation limit and completed-plan abandonment refusal remain. Deterministic correction -> review -> land scenarios pass; no live model journey claimed.

**Resolution:** 2026-09-24: Safe prospective plan/document corrections now use fix -> review -> land without another generation; historical execution evidence is preserved and new proof is appended. Explicitly accepted findings use existing Dropped dispositions, without waiving verification. Review scope and coverage include prospective plan changes. Three real-Git scenarios in tests/cli/corrective-exit.test.mjs cover both command forms, local landing and accepted debt with a failing check; product audit 7/7. No live model journey or release claimed.

## B-180 — Invalidate reused verification when declared plan or ledger inputs change, retaining harmless bookkeeping reuse.

**Current scope (2026-09-24):** Implemented after the public-document transfer. Known inputs now take precedence over lifecycle exemptions; the eight focused regression cases were observed failing before the fix and the product audit passes after it. The resolution below records the delivered scope; undeclared indirect dependencies remain the author’s responsibility.

**Resolution:** 2026-09-24: gateVerify resolves plain command operands and valid reads declarations before lifecycle exemptions. Changed plan/brief/ledger inputs, including the proof plan execution log, force run; unrelated bookkeeping still reuses. Eight real-Git regression cases failed with reuse before the fix and pass in the product audit after it; ./scripts/audit.sh passed 7/7 checks. Implemented and verified locally; no release or publication claimed.

## B-022 — The "No mandate, no run." guard is duplicated verbatim in 6 skills ×2 trees — register it in check-sharedblocks.sh so copies cannot drift

**Resolution:** 2026-09-24, e1c24c0: One skill corpus remains and check-sharedblocks.sh retired in 308cb7c. No mandate, no run remains a product rule; registering six copies across two trees is no longer an applicable solution under CLAUDE.md guard policy.

## B-052 — B-050's second clause is stale since B-048's fix ("must not export `CLAUDE_PLUGIN_DATA` — the hook ignores it, the CLI does not" — the CLI now ignores it too, so the advice misleads at triage); trim the clause when acting on B-050

**Resolution:** 2026-09-24: The obsolete CLAUDE_PLUGIN_DATA prohibition was removed from B-050 during this reconciliation. Its remaining headless-permission work stays Open and does not prescribe blanket bypassPermissions.

## B-056 — `/esq:check` and `/esq:review` each carry a lane-bearing preflight step and resolved-target line (lean-assurance-lane Phase 4) that no `docs/CONFORMANCE.md` scenario pins — R-05 covers `converge` only, so a packaging migration could drop both finders' lane prose and check 24 would stay green, leaving a user unable to tell which lane a finder was bought for; it is a fourth scenario and its own decision, which is why Phase 5 did not fold it in

**Resolution:** 2026-09-24, e1c24c0: a631b8a removed assurance lanes from the CLI and 2cea7b6 removed their delivery ritual. A finder cannot owe evidence of a lane the product no longer selects; this is retirement, not delivery of the old scenario.

## B-064 — `**A failed anchor never unwinds the code.**` in `/esq:work` step 5 is pinned by no `docs/CONFORMANCE.md` scenario (P-06 asserts what the anchor contains, not what happens when it will not parse) — a packaging migration that drops it lets a work run revert a landed, verified fix to protect a bookkeeping artifact while check 24 stays green; same gap B-056 reports for the finders' lane prose, and it wants the same answer

**Resolution:** 2026-09-24, e1c24c0: plugin/skills/work/SKILL.md now handles direct work without the old inline plan-anchor mechanism. The anchor guard has no subject; preserving completed work still follows the recovery contract. No new lexical guard is warranted.

## B-113 — `scripts/audit.sh`'s green line for check 48 enumerates only the registry cases and never mentions the relay-model cases, so a reader auditing coverage from the audit output alone concludes a re-pinned relay is unguarded

**Resolution:** 2026-09-24, e1c24c0: scripts/audit.sh now dispatches named product checks; check 48 and its registry/relay-model output are absent after 308cb7c. The old label cannot misreport current coverage.

## B-114 — Nothing mechanizes README § Model recommendations against the skills' actual `model:` frontmatter — check 47's assertion 4 reads only the `M-` measurement IDs — so a flipped pin leaves the table telling a reader the wrong model to set their session to; corrected by hand twice now (2026-08-19 relay pin, 2026-09-03 `inherit`)

**Resolution:** 2026-09-24, e1c24c0: README.md no longer contains the historical Model recommendations measurement table or check 47 contract; current model guidance is a short summary. Drop that prescribed table guard, not accurate model guidance; no current wrong recommendation was established.

## B-122 — Nothing checks that a script under `scripts/` appears in README's Operations table — check 4 holds the `/esq:` command tables exhaustive but the scripts table is unguarded, so a contributor adding a script (as `outcome-join.mjs` just did) can ship it undiscoverable and the audit stays green

**Resolution:** 2026-09-24, e1c24c0: README.md now documents user workflows and maintenance entry points without the former exhaustive scripts table (5b65c3b). outcome-join.mjs also retired. No missing current user operation was identified; a useful discoverability defect should name that operation, not require every research script in a table.

## B-160 — check-refload.sh pins only entrypoint call sites, so the two load reminders manual-verification.md carries for the failure procedure can be deleted with nothing reddening — the obligation itself stays pinned in build's entrypoint, so this is thin coverage rather than an open route

**Resolution:** 2026-09-24, e1c24c0: check-refload.sh was removed in 308cb7c. build/SKILL.md still explicitly loads failure-and-recovery.md on failure and manual-verification.md names that route. No broken load was established; adding a check that a sentence exists contradicts CLAUDE.md.

## B-162 — nothing mechanically checks that /esq:build's preflight prose names the keys `esq next-phase --context` actually emits — parity holds the two build carriers together and tests/cli/esq.test.mjs holds the response shape, but a renamed context key would leave the skill describing fields the CLI no longer returns with nothing reddening; the CLI-unavailable fallback still works, so this is thin coverage rather than an open route

**Resolution:** 2026-09-24, e1c24c0: The second skill tree and CLI-unavailable prose fallback have been removed. tests/cli/esq.test.mjs still exercises context data; no renamed-key consumer failure was established. The requested lexical pin is not a behavioral check.

## B-165 — build's failure route says "report in the three zones" but never loads the conclusion block that defines them

**Resolution:** 2026-09-24: build/SKILL.md explicitly loads references/failure-and-recovery.md before any failure report. That loaded file itself supplies all three zones in its opening report template and defines zone 2 below it. A second load of the success conclusion is unnecessary; this closes the missing-definition claim, not a live model-output guarantee.

## B-171 — The hooks tmpdir-leak assertion excludes only `esq-` prefixed entries, so running every suite in one node --test process reds it on `worktree-landing`'s deliberate `esq wt-` fixture

**Resolution:** 2026-09-24, e1c24c0: a631b8a removes the declaration-path test that scanned os.tmpdir() and excluded only esq- prefixes; the current hooks suite has no such global assertion. The reported cross-suite false positive has lost its source, rather than receiving a prefix workaround.

## B-149 — Historical consumed-brief cleanup is outside this public snapshot.

**Resolution:** 2026-09-24: docs/plans/README.md records intentional omission of private plans/briefs; no corrective brief is present here. Drop only this historical cleanup task, not a claim that its fixes shipped or that brief consumption implies no unit findings. B-179 retains the generic supported-disposition problem.

## B-181 — Carry the user outcome through feature framing, UX defaults and architecture tradeoffs without an unnecessary re-grill.

**Reopened after user review (2026-09-24):** The invoice-export exercise used invented case facts. It demonstrates neither a real before/after preparation improvement nor runtime quality. The previous resolution below is historical and insufficient for Done. Keep the implemented instruction correction; accept the outcome only on an actual scoped preparation case with inspectable output, preserved constraints and appropriate evidence. B-182 addresses the concrete cost/instruction findings from the follow-up adversarial review.

**Resolution:** Bounded preparation correction delivered: grill retains user/friction/outcome; plan compares architecture against that result and preserves a usable slice; the existing on-demand UI reference resolves delegated omissions instead of automatically returning to grill. Acceptance and the same-input invoice-export brief/recommendation are in docs/preparation/2026-09-24-invoice-export.md. Source-path reading and ./scripts/audit.sh passed (7/7, outside the sandbox after child-process failures inside it). This accepts the instruction correction and inspected worked proposal, not measured runtime quality, time-to-value or blocking-rate gains. No live model journey or invoice application was run; B-169/C remains Open.

## B-182 — Keep preparation focused on real outcomes and relevant decisions, with conditional guidance and concise output.

**Scope (2026-09-24):** Correct the observed routine historical-topic migration in plan/build/harvest, reduce repeated planning prose and unnecessary reference loads, and preserve the distinction between real outcomes and invented illustrations. Reconcile current model-gating prose with the retired mechanism; preserve all historical decisions and measurement rows. No new framework, schema, model gate or required review ceremony.

**Acceptance:** Source paths retain their authority, branch and parsed-format contracts; no unrelated historical Topic migration remains in the affected workflow. Relevant mechanical checks pass. A bounded read-only preparation of the real B-043 need supplies inspectable output for quality/cost comparison; record what actually improves and what does not, without equating shorter instructions with better proposals. Details and official Anthropic sources: docs/preparation/2026-09-24-adversarial-review.md. B-043 is a preparation specimen only and is not being implemented or closed here. No Done while the claimed preparation outcome lacks evidence.

**Observed comparison (2026-09-24):** Both user-authorized native Claude trials completed within $3 configured / 180 seconds each; total reported list-price estimate $1.341426. Candidate elapsed time and estimated cost were lower in this single pair, but its final proposal was longer (1,377 versus 1,253 words), read volume did not fall, and its architecture incorrectly labels the valid mixed B-129/B-079 roadmap entry as stale. Both proposals duplicate focused tests beside the final audit. Quality acceptance is not demonstrated; B-182 remains Open. Exact outputs, normalized traces, source hashes and limitations are retained in docs/preparation/2026-09-24-b043-comparison/ and assessed in the review above. No third trial, B-043 implementation or specialist-guidance claim.

**Further bounded observation (2026-09-24):** One explicitly authorized read-only follow-up changed only the planner instruction against the same archived inputs and prompt. It correctly preserves the mixed B-129/B-079 entry and removes duplicate focused/audit verification, but still invents an all-closed freshness predicate and misses the whole-object test. Output remains over the 1,200-word bound (1,301); 121.71 seconds and estimated list-price $0.7203984 exceed the prior candidate's 90.57 seconds/$0.6109666. These are partial gains on one nonconcurrent case, not full acceptance or stable savings. B-182 remains Open. Official-source review, exact proposal, trace, hashes, limitations and one 7/7 product audit: docs/preparation/2026-09-24-preparation-quality.md. No additional paid run.

## B-183 — Correct architecture authority and reporting instructions; remove the planner alternative quota.

**Resolution:** Corrected source-level contradictions: plan no longer imposes an alternative quota; arch selects applicable intent, preserves historical records without treating Active as authority, scopes refresh reads and evidence reuse, permits zero cuts, and reports short reasons with links. Real relay-pin and standards records checked; 526 instruction words removed. One product audit passed 7/7 in 27.58 s. This closes the instruction defects only; native generated-quality and runtime-cost acceptance remain unproved under B-181/B-182. Review, official Anthropic sources and next-case handoff: docs/preparation/2026-09-24-architecture-preparation-review.md. No paid trial, push or publication.

## B-185 — Preserve significant whitespace in auto commands through Markdown extraction and landing proof reuse.

**Resolution:** Removed global whitespace compression from listItems; preserved Markdown list and continuation handling and exact proof strings. Three regressions cover the real eight-command excerpt, significant spaces/tabs, continuations, exact proof recording, deduplication and reuse versus a distinct single-space command. One final product audit passed 7/7 in 26.61 s. Evidence: docs/preparation/2026-09-25-b185-command-whitespace.md. Local source only; events-tracker read-only, no installation or publication.
