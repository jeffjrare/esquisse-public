# Epic: August-18 external review — value per model usage

<!-- Epic: a theme spanning multiple plans over time. Managed by /esq:epic. -->
<!-- Join key: the slug below. It appears in BACKLOG.md's Epic column and as an -->
<!-- **Epic:** <slug> line under the title of each plan that belongs to this epic. -->
<!-- Slug: aug-18-improv -->

**Status:** Active
**Started:** 2026-08-19

## Goal
Maximum **accepted user value per unit of model usage**: prove and then improve what each esq command delivers per model turn, token and wall-clock minute — without weakening correctness, judgment quality, or the user's ownership of every decision. Refreshed 2026-08-19 from the second external review; refocused 2026-08-21 on the numerator.

**Usage, never price.** The unit is model usage — turns, tokens, tool calls, duration, spawns — because that is what the harness actually reports. This repo holds no per-model price and computes none (D-hook-telemetry-stops-at-observable-usage), so "model-dollar" is retired from this epic's wording: a monetary figure here would be the most quoted and least sourced number in the project.

**And the numerator is a first-class deliverable, not an assumption.** Every instrument shipped so far measures spend. Until an outcome signal exists beside it, this epic can report what a command *cost* but not whether the work was any good — which is precisely why D-tiers-held-until-a-second-cell-confirms refuses to move any judgment-bearing model pin on a spend table alone.

## Scope
- **First, dependable verification and orientation** — an audit that always terminates and names a timed-out suite (B-033, done); `esq state` / `/esq:status` that degrade locally when one plan or the backlog is malformed (B-034, done); a pre-commit gate that does not red on correct input, enforced over the whole tree (B-068, B-062, B-065, B-053); a test-invocation form that does not red before a test runs (B-054, B-046).
- **Telemetry complete enough to decide on** — no whole-run record lost to a fallback winning the claim race (B-037); an honest measurement scope that reaches user-typed commands, not only `Agent`-spawned subagents (B-038); command-labelled samples verified and a minimum sample threshold stated (B-039); a privacy contract that matches the handler (B-040). All done.
- **Model choice measured, never guessed** — the explicit `Agent` `model` field probed on the supported Claude Code version (B-041); relay orchestrators separated from judgment workers only if that probe holds, with a per-spawn assertion and an all-Opus fallback (B-042); tiers and regression budgets from complete data above the threshold (B-029). All done — **and now dated**: that proof was measured on Claude Code 2.1.235 while the harness has moved on, so critical evidence must record the version it validated and make itself visibly stale after an upgrade, with the safe capable-session fallback recommended until an on-demand probe revalidates it (B-074, folding in B-047).
- **A lean assurance lane** classified on two axes — requirements uncertainty × implementation risk — recorded in the plan with its triggers, escalable during build, measured on reopen and missed-defect rates (B-030, done); its lane report corrected once its samples are worth comparing (B-057).
- **Runtime evaluations for the contracts a lexical check cannot see** — a small, version-aware set of golden orchestration journeys, fixture-replayable for free and billed live on demand only (B-032). It is the safety net the workflow changes below are made against, not a follow-up to them.
- **The outcome half of the ratio** — a read-only summary that joins what a unit of work cost to whether it was accepted, segmented by assurance lane, actual model configuration and a defensible work-size proxy, derived from facts already committed and never persisting prompts, responses or code content (B-073). Cost and outcome are reported side by side; there is no blended value score. It is instrumented **before** the workflow changes below, because a baseline cannot be measured afterwards.
- **Then transaction and round-trip efficiency** — fewer wasted round trips and fewer workflow-state turns and commits per accepted phase, measured (B-071, B-044), with the projection-freshness work that keeps stale state from masquerading as current (B-043).
- **Out:** deployment, CI/CD, hosting, release automation, infrastructure provisioning and every other DevOps concern — esquisse may *consume* an external acceptance or deployment signal without becoming a deployment product; new skills and new workflow stages (a `/beautify` command is refused by name — beauty is preserved through durable visual evidence the finders can inspect, B-076, not another stage); packaging/installer work; any model downgrade without runtime evidence **and** an outcome signal; any saving declared from raw token totals alone; any monetary cost figure this repo cannot source.

## Order
<!-- Human-written mirror of docs/ROADMAP.md as of 2026-08-21 — the roadmap is authoritative; re-run /esq:roadmap for live state. -->
1. **Now** — `audit-gate-reliability` (B-068, B-062, B-065, B-053) → `node22-test-invocation` (B-054, B-046) → `smoke-runner-hygiene` (B-067) → `runtime-evals` (B-032) → `harness-evidence-freshness` (B-074, B-047) → `outcome-instrumentation` (B-073) → `telemetry-round-trips-part-two` (B-071, B-044, B-072). The chain is one edge repeated: nothing is verified until the gate is honest, nothing is optimized until a journey can tell cheaper from broken, and nothing is *called* cheaper until an outcome baseline predates the change.
2. **Next** — `execution-log-writer-integrity` (B-049) → `command-file-drift-guards` → `worktree-ledger-integrity` → `lane-report-accuracy` (B-057, once its samples are worth comparing).
3. **Later** — `projection-freshness` (B-043, with B-075) → `command-prose-reconciliation` → `legacy-tree-trim` → `harness-port-adapter-layer`, last and parked.

## Success signals
The campaign is successful when evidence shows:
1. Audits always terminate, identify timed-out suites, and do not red on correct input.
2. `/esq:status` remains useful when one state artifact is invalid.
3. Telemetry no longer loses a whole-run `SubagentStop` record because a fallback won a race.
4. Reports clearly disclose sample completeness and measurement scope.
5. Direct and orchestrated commands can be compared using actual runtime model and usage evidence.
6. Orchestrator relay work uses a cheaper model where proven safe, while judgment-heavy workers retain the necessary quality tier — and that proof carries the harness version it was measured on, going visibly stale after an upgrade.
7. Lean assurance reduces model usage without increasing reopen, corrective-loop, or missed-defect rates.
8. The critical orchestration journeys are covered by version-aware runtime evaluations that replay for free.
9. Stale roadmap or epic projections are visible and cannot masquerade as current authoritative state.
10. Workflow-state maintenance consumes fewer turns and transactions without losing recovery or auditability.
11. **Accepted outcomes are measured beside usage** — model turns and tokens from approved plan to accepted outcome, elapsed cycle time, acceptance without reopen or post-pass defect, rebuilt phases and corrective passes, and human decisions and pauses — segmented by lane, model configuration and work size, with no blended score and no invented monetary figure.
12. **No model-tier change is argued from spend alone** — a pin moves only with a second confirmed cell *and* an outcome signal for the work (D-tiers-held-until-a-second-cell-confirms).

## Plans
<!-- GENERATED by /esq:epic — rebuilt by scanning docs/plans/ for **Epic:** <slug>. -->
<!-- Do not hand-edit; your changes are overwritten on the next refresh. -->
- docs/plans/2026-08-19-bounded-audit-subprocesses.md — Bound every hanging audit subprocess and name the suite that timed out — complete
- docs/plans/2026-08-19-complete-run-telemetry.md — Complete-run telemetry: the whole-run record always wins, and every token-less run is reported — complete
- docs/plans/2026-08-19-direct-skill-cost-evidence.md — Direct-skill cost evidence — session telemetry for user-typed esq commands — complete
- docs/plans/2026-08-19-esq-state-for-status.md — `esq state` carries what `/esq:status` needs, so its no-rescan rule is honorable — complete
- docs/plans/2026-08-19-explicit-agent-model-probe.md — Probe whether the `Agent` tool's explicit `model` field actually selects the worker's model — complete
- docs/plans/2026-08-19-graceful-state-degradation.md — `esq state` degrades locally on a malformed plan or backlog, and `/esq:status` has a defined path for partial state — complete
- docs/plans/2026-08-19-measured-model-tiers.md — Measured model tiers and regression budgets — complete
- docs/plans/2026-08-19-model-runtime-probe.md — A runtime probe that shows which invocation paths honor a skill's `model:` pin — complete
- docs/plans/2026-08-19-relay-worker-model-separation-fixes.md — Telemetry discovery stops honoring a shell-exported CLAUDE_PLUGIN_DATA — complete
- docs/plans/2026-08-19-relay-worker-model-separation.md — Relay orchestrators on Sonnet, judgment workers explicitly on Opus, every spawn asserted — complete
- docs/plans/2026-08-19-subagent-telemetry-records.md — Make the SubagentStop telemetry record real subagent runs and nothing else — complete
- docs/plans/2026-08-19-telemetry-sample-sufficiency.md — Telemetry sample sufficiency: the summary says when a per-command figure is too thin to argue from — complete
- docs/plans/2026-08-19-telemetry-summary.md — `esq telemetry summary` — what each esq command costs, readable at a glance — complete
- docs/plans/2026-08-20-lean-assurance-lane-fixes.md — The reopen rate counts the full lane's own itinerary as a miss — complete
- docs/plans/2026-08-20-lean-assurance-lane.md — The lean assurance lane — complete
- docs/plans/2026-08-21-read-once-and-see-round-trips.md — Read each file once, and make the round trip visible — complete
- docs/plans/2026-08-21-verify-work-capture-end-to-end.md — A replayable live check that `/esq:work`'s free-text capture actually behaves — complete

## Backlog
<!-- GENERATED by /esq:epic — rebuilt by scanning BACKLOG.md's Epic column. -->
<!-- Do not hand-edit; your changes are overwritten on the next refresh. -->
- B-032 — A small, version-aware set of golden orchestration journeys, fixture-replayable and billed live on demand only — Open
- B-043 — Projection freshness — `esq state` reports `roadmap.stale` and live status beside projected text — Open
- B-044 — Workflow transaction efficiency, measured — batch workflow-state updates per phase, atomic commits kept — Open
- B-047 — Probe whether a skill `model:` pin is honored when typed into a running interactive session — Open
- B-049 — `esq plan append-log` renders a hollow entry on missing JSON keys — reject unknown keys or state the schema — Open
- B-050 — Plan verification through headless `claude -p` must carry `--permission-mode bypassPermissions` — Open
- B-052 — B-050's second clause is stale since B-048's fix — trim it when acting on B-050 — Open
- B-053 — `tests/cost-budgets/` is run by no gate; wiring it in shifts the audit's check count, cited in `CLAUDE.md` and `docs/ARCHITECTURE.md` — Open
- B-056 — No CONFORMANCE.md scenario pins check's and review's lane-bearing preflight and resolved-target lines — Open
- B-057 — `esq lane stats` counts findings by tier from surviving brief files, so the 🟢 column reads near-zero — Open
- B-067 — A fresh smoke-work-capture run writes the maintainer's ambient environment into the capture — Open
- B-070 — Round trips × context size — 757 trips lost to re-reading a file the same esq run already read — Planned
- B-071 — esq agents batch at 1.068 tool calls per turn against 1.243 for non-esq agents on the same machine — Open
- B-072 — SPEC and README under-describe the telemetry summary's columns by two (`trips med`, `calls/trip`) — Open
- B-073 — Outcome-linked workflow measurement — accepted outcomes beside usage, no blended score, no invented cost — Open
- B-074 — Harness evidence goes stale silently — the worker-model proof is dated 2.1.235 against a 2.1.238 harness — Open

_History: 23 items Done (B-025, B-026, B-027, B-028, B-029, B-030, B-031, B-033, B-034, B-035, B-036, B-037, B-038, B-039, B-040, B-041, B-042, B-048, B-051, B-055, B-058, B-059, B-066)._

## Log
<!-- Milestones, human-written. Appended over time, newest at the bottom. -->
- 2026-08-19 — Epic opened from the 2026-08-18 external review; B-025 (Opus default) done inline the same session.
- 2026-08-19 — `scripts/probe-model-pins.mjs` measured skill `model:` pins on Claude Code 2.1.235: **honored** when the user types `/skill` (whole session switches) and for `context: fork`; **ignored** whenever the model invokes the skill through the `Skill` tool — at top level and inside an `Agent`, which is the `/esq:autopilot` → `/esq:build` path B-026 observed. Written into README "Model recommendations"; B-029 decides what it changes.
- 2026-08-19 — Four plans shipped the same day: `esq-state-for-status` (B-031), `model-runtime-probe` (B-026), `subagent-telemetry-records` (B-027), `telemetry-summary` (B-028, B-035, B-036). The epic and roadmap projections still showed those items Open — corrected in this refresh; B-043 makes that staleness visible mechanically.
- 2026-08-19 — Second external review: structure judged sound, next priority is value per model-dollar. Goal, Scope, Order and Success signals rewritten; B-029/030/032/033/034/037 refined; B-038..B-044 added; roadmap re-derived in the review's chain (`8802f77`). Deployment/DevOps explicitly out of scope.
- 2026-08-19 — `explicit-agent-model-probe` (B-041): the `Agent` tool's explicit `model` field measured on Claude Code 2.1.235 — **honored** in all six cases (opus worker from a sonnet parent, sonnet and haiku workers from an opus parent, foreground and background), judged from the worker's own requests under the spawn id, never from `result.modelUsage`. Written into README "Model recommendations" with the per-row version; B-042's premise holds on this version and it plans from that table.
- 2026-08-19 — `relay-worker-model-separation` (B-042): the three orchestrators pinned `sonnet`; every worker spawn carries an explicit `model: opus` and is asserted from the worker's own request lines (`esq telemetry assert-model`) before the next spawn — `mismatch`/`unrequested` stops the run with the fallback named; `esq telemetry summary` gained the `by command × model` table, the spawn-model header line and the direct `model` column. The relay pin is honored when the command opens a headless session and not observed to hold when typed into a running one (B-047 carries the probe row); README "Model recommendations" says so. B-029 measures the comparison from the new table.
- 2026-08-21 — Roadmap correction. The epic was claiming *accepted value per model-dollar* while every shipped instrument measured spend only, and no plan in scope produced an outcome signal — so B-073 (outcome-linked workflow measurement) is filed as the numerator and ordered immediately before B-071/B-044, since a baseline cannot be measured after the workflow it baselines. "model-dollar" is retired in favor of *model usage*: this repo holds no per-model price and D-hook-telemetry-stops-at-observable-usage forbids inventing one. B-074 files the harness-evidence gap the version numbers make plain — the worker-model proof under every orchestrator spawn is dated Claude Code 2.1.235 and this machine runs 2.1.238 — and absorbs B-047. B-032 is reframed from an open-ended eval suite to six golden orchestration journeys on the proven bespoke-runner pattern, and promoted ahead of the cost work. B-075 (parked-work representation) and B-076 (durable UI visual evidence; `/beautify` refused by name) are filed outside the epic. Roadmap re-derived to 15 entries (7 Now, 4 Next, 4 Later). No `docs/DECISIONS.md` entry was written: the two rules a decision would have carried are already standing (D-tiers-held-until-a-second-cell-confirms — spend alone never moves a judgment-bearing pin; D-park-the-port-while-esq-is-load-bearing — the port is planned and parked), and that ledger's writers are `/esq:plan`, `/esq:build` and `/esq:grill`.
