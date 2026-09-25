# Decisions

<!-- Registry of architectural, product, and functional decisions. Managed by /esq:plan and /esq:build. -->
<!-- An ID is a permanent citation key: never renumbered, never reused. Code, plans and commit messages may cite it. -->

| # | Date | Scope | Topic | Décision | Statut |
|---|------|-------|-------|----------|--------|
| D-bounded-correction-exit-preserves-proof | 2026-09-24 | func | corrective-loop | Exhaustion limits new plans; safe prospective fixes and explicit dispositions preserve proof and owe review | Active |
| D-standards-resolves-or-refuses | 2026-09-21 | arch | standards | `esq standards` serves a partial referent with a finding, but refuses when neither file yields text | Active |
| D-001 | 2026-06-19 | arch | esquisse | Phase grouping by file for DX improvements plan | Active |
| D-002 | 2026-07-07 | arch | esquisse | Task backlog in docs/BACKLOG.md; DEFERRED.md folded in | Active |
| D-003 | 2026-07-08 | arch | backlog | Backlog→Google Sheet is a one-way, CSV-first mirror (not Trello sync) | Active |
| D-004 | 2026-08-09 | arch | ledgers | ID reservations live in an untracked per-worktree marker file, never in a branch | Active |
| D-narrow-check-not-canonical-wording | 2026-08-09 | arch | audit | Narrow a verification check to its intent rather than diverge a replicated invariant | Active |
| D-merge-base-decides-shared-row | 2026-08-10 | arch | ledgers | The merge base decides whether a repeated ID is one item edited twice or two items | Active |
| D-derive-else-ask-on-cell-conflict | 2026-08-10 | ux | ledgers | Same-cell divergence auto-resolves where a rule exists, asks the user where none does | Active |
| D-boundary-anchored-ledger-id-match | 2026-08-10 | func | ledgers | The ID matcher is boundary-anchored, so B-002 never matches B-0021 nor D-auth D-auth-rotation | Active |
| D-classifier-restated-in-both-merge-steps | 2026-08-10 | arch | ledgers | The merge-base classifier is written into both the resolution step and the detection step | Active |
| D-long-run-is-an-opt-out-list | 2026-08-13 | arch | audit | "Runs long" is an opt-out list in audit.sh, not an enrolment marker per command | Active |
| D-five-commands-adopt-the-conclusion-block | 2026-08-13 | ux | audit | plan/spec/arch/grill/harvest adopt the shared conclusion block instead of a bespoke elapsed line | Superseded |
| D-elapsed-footer-over-conclusion-block | 2026-08-13 | ux | audit | The five report elapsed in one line; adopting the conclusion block is separate work (B-008) | Active |
| D-announce-in-two-beats | 2026-08-13 | ux | audit | The bound is announced above preflight, the resolved target at the end of it — two marked regions | Active |
| D-named-anchor-for-announcement-placement | 2026-08-13 | arch | audit | The "before the work" anchor is a named heading (## Preflight / ## Mode X / ## Step N), never inferred | Active |
| D-check-longrun-is-one-awk-pass | 2026-08-13 | arch | audit | The long-run check is a single awk pass, because its own fault injection runs it seven times per audit | Active |
| D-corroborate-one-bound-phrase | 2026-08-13 | arch | audit | One matched bound phrase must recur in the body, not every matched phrase | Active |
| D-plan-glob-excludes-log-md | 2026-08-14 | arch | commands | Every bare-invocation plan glob excludes `*.log.md`; check and review adopt it rather than build dropping it | Active |
| D-two-git-views-is-not-double-processing | 2026-08-14 | arch | commands | A second git call over the same range stays when it returns data the first one's pathspec filters out | Active |
| D-description-routes-readme-explains | 2026-08-14 | arch | commands | A `description:` gets someone to the command and nothing more; mode and argument syntax lives only in the body and README | Active |
| D-restore-the-borderline-clause | 2026-08-14 | arch | commands | A hash-guarded block's borderline clause is restored, never argued — only named rationale is cut | Active |
| D-one-rulebook-under-constraints | 2026-08-15 | arch | commands | An orchestrator states each rule once, in the `## Constraints` section every command already ends with | Active |
| D-cut-to-the-appendix-report-the-gap | 2026-08-15 | arch | commands | A trim phase cuts what its analysis named and reports the shortfall; it never freelances to hit a number | Active |
| D-log-the-phase-record-the-miss | 2026-08-15 | arch | plans | A phase whose only failing check is an already-adjudicated plan-level target is logged with the miss recorded, not left unlogged | Active |
| D-registry-not-a-check-per-block | 2026-08-15 | arch | audit | A new shared paragraph is enrolled in one registry, never given its own hard-coded check | Active |
| D-shared-only-what-is-identical-by-design | 2026-08-15 | arch | audit | Marker-delimited spans hold text identical by design; text that merely matches today stays outside | Active |
| D-the-auditor-pays-its-own-cost-rule | 2026-08-15 | infra | audit | A check runs as one pass over the corpus rather than a process per comparison | Active |
| D-harness-contract-is-the-external-referent | 2026-08-15 | arch | harness-port | A capability contract doc states each essence and its conformance assertion; transpiler, checker and fixture all read it | Active |
| D-markers-not-an-abstract-vocabulary | 2026-08-15 | arch | harness-port | Harness coupling is wrapped in marker-delimited spans; the command prose is never rewritten into abstract verbs | Active |
| D-identity-adapter-by-omission | 2026-08-15 | arch | harness-port | `claude-code` has no adapter file — an unbound span passes through, so byte-identity is structural | Active |
| D-lexical-rewrite-outside-the-markers | 2026-08-15 | arch | harness-port | The `/esq:<name>` invocation literal is rewritten by a declared lexical rule, not wrapped in markers | Active |
| D-two-guards-against-implicit-invocation | 2026-08-15 | arch | harness-port | A mutating Codex skill is guarded twice: the config policy and a refusal inside the artifact | Active |
| D-port-precedes-the-drift-guards | 2026-08-15 | prod | harness-port | `command-file-drift-guards` does not block the port; the roadmap's ordering rationale assumed a rewrite that is now out of scope | Active |
| D-park-the-port-while-esq-is-load-bearing | 2026-08-15 | prod | harness-port | The port is planned and parked, not started — it edits the command source a machine-wide install deploys from | Active |
| D-narrow-the-read-not-the-plan-file | 2026-08-17 | arch | build | The execution log stays in the plan file; `/esq:build` reads it in targeted slices rather than rotating old entries to a sidecar | Active — derivation clause amended 2026-09-15 by D-build-asks-the-cli-for-its-plan-context |
| D-anchor-is-the-plan-file-head-at-read-time | 2026-08-17 | arch | build | `Plan committed at` is the last commit touching the plan file at preflight, computed once per invocation | Active |
| D-one-skeleton-grep-two-carriers | 2026-08-17 | arch | build | `/esq:build` and `/esq:autopilot` derive the plan file's structure from one hash-enforced `shared:log-skeleton` grep, not from two independent regexes | Active — build's carriage amended 2026-09-15 by D-build-asks-the-cli-for-its-plan-context |
| D-verification-arbitrates-an-unlogged-phase | 2026-08-17 | arch | build | Commit evidence only triggers reconciliation; the phase's own `(auto)` verification decides whether it already ran | Active |
| D-count-phases-not-spawns-against-the-cap | 2026-08-17 | func | autopilot | `/esq:autopilot`'s phase cap counts phases logged, not subagents spawned — one build invocation can log two | Active |
| D-plugin-primary-legacy-rollback | 2026-08-17 | arch | distribution | The `esq` Claude plugin is primary; install.sh and its manifest remain only until plugin/CLI/hooks conformance is complete | Superseded |
| D-context-fork-only-after-proof | 2026-08-17 | arch | skills | No skill forks yet; add `context: fork` only after a controlled runtime test proves no authority or resume state is lost | Active |
| D-cli-owns-structure-model-owns-judgment | 2026-08-17 | arch | cli | The plugin CLI owns parsing, IDs, cells, log appends and invariants; the model owns architecture, scope, quality, risk and UX | Active |
| D-codex-port-paused-for-claude-base | 2026-08-17 | prod | harness-port | B-006 remains paused until the Claude-native plugin, CLI and hooks architecture stabilizes | Active |
| D-semantic-notifications-stay-in-skills | 2026-08-17 | arch | hooks | Completion and gate notifications remain explicit PushNotification calls in the skills, not a generic Stop hook | Active |
| D-audit-at-boundaries-not-after-edits | 2026-08-17 | arch | hooks | Full audits run before commits and stops, never after every Edit/Write call | Active |
| D-hook-telemetry-stops-at-observable-usage | 2026-08-17 | arch | hooks | Record bounded subagent duration/tool/token telemetry; do not invent monetary cost absent from the hook payload | Active — amended by D-direct-session-telemetry-stop-cursor |
| D-native-agents-cannot-compose-guarded-skills | 2026-08-17 | arch | agents | Do not duplicate mutating skill bodies into agents or weaken manual-invocation guards merely to preload them | Active |
| D-orchestrated-skills-guard-in-body | 2026-08-18 | arch | skills | The six trio-invoked skills drop `disable-model-invocation` and carry an in-body mandate refusal instead — the harness has no explicit-only flag | Active — amended 2026-09-11 by D-advance-preserves-units-and-its-branch |
| D-subagent-stop-telemetry-from-transcript | 2026-08-18 | arch | hooks | SubagentStop is the primary telemetry writer, usage summed from the agent transcript (numbers only); PostToolUse stays as a deduped fallback | Active |
| D-telemetry-dedupe-by-claim-file | 2026-08-18 | arch | hooks | Telemetry handlers dedupe a run through an exclusive-create claim file, not a scan-then-append | Active — amended by D-whole-run-record-supersedes-fallback |
| D-conclusion-block-where-zone-two-fills | 2026-08-18 | ux | audit | The shared conclusion block is carried where zone 2 has real content on a normal run — spec and arch join; plan, grill, harvest, ui keep the elapsed footer | Active |
| D-opus-default-sonnet-only-mechanical | 2026-08-19 | arch | skills | Skills pin Opus by default; Sonnet only where the work is schema-bound and the CLI owns structure (status, backlog, epic, sweep, worktree); any further downgrade is made on telemetry, not by guess | Active — orchestrator clause amended by D-relay-sonnet-workers-explicit-opus |
| D-model-pin-probe-reads-stream-json | 2026-08-19 | infra | skills | The model-pin probe runs headless `stream-json` sessions and reads `message.model` per `parent_tool_use_id`; it never reads `~/.claude` transcripts and never joins `audit.sh` | Active |
| D-skip-untyped-transcriptless-subagent-stops | 2026-08-19 | arch | hooks | A `SubagentStop` with no agent type and no readable transcript is a harness-internal query (recap, title, progress), not a subagent run: the handler skips it instead of writing an empty row | Active |
| D-esq-state-carries-status-facts | 2026-08-19 | arch | cli | `esq state` is extended in place with `activePlan`, `plans[].mtime`, `backlog.rows` (Open/Needs-decision/Planned) and `roadmap.head` — no second read-only subcommand, no return to prose scans in /esq:status | Active |
| D-fork-verdict-from-usage-synthetic-not-a-request | 2026-08-19 | arch | model-pins | The probe judges a `context: fork` row from `result.modelUsage` when the stream forwards no subagent lines and says so in the verdict; a `<synthetic>` assistant line is never a request but does satisfy the exit-2 guard | Active |
| D-telemetry-summary-is-a-cli-subcommand | 2026-08-19 | arch | cli | `esq telemetry summary` is a read-only CLI subcommand (human report by default, `--json` for machines, discovers `~/.claude/plugins/data/esq-*`); models come from the transcript or `resolvedModel`, never `modelsUsed`; untyped usage-less rows are skipped, fallback rows never feed the token sum, medians beside totals, and the B-036 blind spot is named in the output | Active — discovery clause amended by D-cli-ignores-plugin-data-env |
| D-esq-spawns-labelled-by-description-prefix | 2026-08-19 | arch | hooks | Orchestrators start every `Agent` description with `esq:<command>`; the PostToolUse hook stores only that anchored slug as an `AgentLabel` row, and the summary joins it by agentId — over plugin agent definitions and over deferring per-command cost | Active |
| D-explicit-agent-rows-judged-from-spawn-id | 2026-08-19 | arch | model-pins | The probe's explicit `Agent` `model` rows are judged only from request lines under the parent's matching `Agent` tool_use id, with the parent on a model the worker must differ from and `CLAUDE_CODE_SUBAGENT_MODEL` scrubbed; `result.modelUsage` never reaches an explicit verdict, it feeds an `aux` column | Active |
| D-relay-sonnet-workers-explicit-opus | 2026-08-19 | arch | model-pins | The three orchestrators are pinned `sonnet` and pass `model: opus` explicitly on every `Agent` spawn (apply agents included); the worker's model is never inherited from the session, which may run on anything; the interactive relay saving is the user's `/model sonnet`, since a typed pin is not observed to bite there | Active — relay-pin clause superseded by `D-relay-inherits-the-session-model` |
| D-spawn-model-asserted-from-telemetry-mismatch-stops | 2026-08-19 | func | telemetry | After every spawn an orchestrator runs `esq telemetry assert-model <agentId>` (label `requestedModel` vs the run's `models[]`, bounded 10 s wait, never writes); `mismatch`/`unrequested` stops the run before the next spawn with the fallback named (orchestrate from an Opus session; re-probe), `unknown` is a fact line, never a stop | Active |
| D-roadmap-horizons-uncapped | 2026-08-19 | func | roadmap | Now / Next / Later hold any number of entries; the position-justifying `why now` is the only admission test — over the 3 / 4 / 5 caps | Active |
| D-bounded-subprocess-runner | 2026-08-19 | infra | audit | Audit subprocesses run through one extracted bounded runner (`check-bounded.sh` + guard) — outer GNU `timeout` plus node per-test/per-call timeouts — over inline `timeout` or node-only bounds | Active |
| D-esq-state-degrades-per-source | 2026-08-19 | arch | cli | `esq state` never exits on a malformed ledger: a broken plan rides in `plans[]` as `state: "invalid"` + `error`, a broken backlog as `backlog.error`, every healthy fact still returned; `/esq:status` treats `esq` present as the primary path even when partial — over a validate-first refusal or a prose fallback | Active |
| D-whole-run-record-supersedes-fallback | 2026-08-19 | arch | hooks | A telemetry record carrying whole-run usage (SubagentStop with `runUsage`) supersedes a fallback row for the same agentId — appended under the claim, chosen by the reader; the file stays append-only | Active |
| D-telemetry-sample-threshold-five-runs | 2026-08-19 | func | telemetry | `esq telemetry summary` marks any group with fewer than 5 token-bearing runs `provisional` (threshold exported as `sampleThreshold` in `--json`, one legend line in the report); the threshold is a CLI constant, never a flag — B-029 argues no tier or budget from a provisional row | Active |
| D-direct-session-telemetry-stop-cursor | 2026-08-19 | arch | hooks | User-typed and top-level `Skill`-invoked esq commands are billed by a content-free main-session writer: `Stop` with a per-session byte cursor (reads only what the transcript gained) plus `SessionEnd` as the closer, cumulative rows in a separate `session-runs.jsonl` keyed `(sessionId, segment)`, one opt-out (`ESQ_TELEMETRY=0` / `DO_NOT_TRACK=1`) for both writers — over one read at SessionEnd or a whole re-parse per Stop | Active |
| D-session-row-per-touched-segment | 2026-08-19 | func | hooks | The session writer appends a cumulative row only for a segment the delta touched (opened, or gained an assistant line); a Stop that adds nothing writes nothing; a Skill-tool opener takes its whole request with it | Active |
| D-summary-opt-out-note-via-hook-io | 2026-08-19 | arch | telemetry | `esq telemetry summary` reports the shell's telemetry opt-out by importing `telemetryOptedOut` from `plugin/scripts/hook-io.mjs` into `plugin/lib/telemetry.mjs` (`options.environment` on `summarizeTelemetry`), rather than duplicating the rule in `lib` or moving it there | Active |
| D-claude-calls-bounded-inline-positional | 2026-08-19 | infra | audit | The `claude plugin` calls in checks 26/29 carry an inline `timeout --kill-after=5 60` with a finding worded like `check-bounded.sh`'s, not a call through the runner; `check-plugin.sh` takes its bound as a second positional argument (default 60) so the guard injects the hang at 1 s | Active |
| D-writer-reader-predicate-lives-in-hook-io | 2026-08-19 | arch | telemetry | `carriesWholeRunUsage` — the one predicate deciding supersession in the agent-telemetry writer and which row represents a run in the reader — lives in `plugin/scripts/hook-io.mjs` and is imported by both, rather than restated in `plugin/lib/telemetry.mjs` | Active |
| D-conformance-needles-pin-sentences-not-tokens | 2026-08-19 | arch | audit | A conformance needle is the load-bearing sentence, never a bare token another part of the file could satisfy | Active |
| D-a-completed-phase-records-what-proved-it | 2026-09-11 | arch | build | A completed entry whose phase names a runnable `(auto)` command must carry its `verified` block | Active |

| D-command-model-group-verdict-worst-of-asked | 2026-08-19 | func | telemetry | A by-command×model group's verdict is `mismatch` if any labelled run mismatched, else `honored` if any run asked, else `unrequested`; `requested` lists every spelling asked, `+`-joined; the header counts every run individually | Active |
| D-cli-ignores-plugin-data-env | 2026-08-19 | arch | cli | `discoverTelemetryFiles` never honors a `CLAUDE_PLUGIN_DATA` from its own environment — the variable is a harness→hook channel; the CLI always pools `~/.claude/plugins/data/esq-*`, un-pooled only by explicit file arguments, and `summary` notes an exported-and-ignored var | Active |
| D-invalid-samples-excluded-not-deleted | 2026-08-19 | arch | telemetry | A known-invalid telemetry run is dropped by the reader from a documented `agentId → reason` set and counted as `excluded` in the report — never deleted from the store, never distinguished by a new row field | Active — the no-repo-identity clause amended 2026-09-06 by D-plan-identity-is-declared-not-inferred; noted 2026-09-07 that a second agentId map now exists in the reader |
| D-cost-budget-checked-outside-the-audit | 2026-08-19 | infra | telemetry | The regression budget lives in the README table it documents and is compared against live telemetry by `scripts/cost-budgets.mjs`, run on demand beside `probe-model-pins.mjs` — never a check in `audit.sh` | Active |
| D-tiers-held-until-a-second-cell-confirms | 2026-08-19 | prod | model-pins | Measured on 104 runs (2026-08-19), no command has a confirmed cell on a second model, so every model pin holds unchanged; a tier moves only when a second model reaches `MIN_SAMPLE_RUNS` for that command **and** an outcome signal exists, since telemetry measures spend and not quality | Active |
| D-budget-is-one-and-a-half-times-the-median | 2026-08-19 | infra | telemetry | A regression budget is 1.5× the median measured beside it, on median output tokens and median duration, set only on a confirmed subagent row and carrying the `n` and date it came from; a group back below the threshold is skipped, never passed | Active |
| D-the-finder-budget-follows-the-itinerary | 2026-09-09 | arch | assurance | `esq lane stats`' reopen budget keeps computing from the itinerary rather than from the lane a plan recorded, so with one fixed itinerary it is two for every plan and historical lean-lane plans are rescored under it | Active |
| D-lane-is-two-axes-computed-by-the-cli | 2026-08-20 | arch | assurance | The plan records two axis values (requirements uncertainty × implementation risk) with the concrete triggers behind them; `esq lane` maps them to the route through a table that exists once, folds in build escalations one-way, and refuses an axis no trigger backs | Active |
| D-direct-lane-keeps-one-finder | 2026-08-20 | prod | assurance | The low×low lane still runs check → fix rather than ending at the build's own verification, so every lane leaves an artifact its missed-defect rate can be computed from | Active |
| D-converge-selects-its-itinerary-from-the-lane | 2026-08-20 | arch | assurance | `/esq:converge` resolves the lane at preflight and runs the matching two- or four-step itinerary, selected once and never re-decided mid-run; an unresolvable lane is `full` | Superseded |
| D-assurance-block-is-axes-guidance-is-a-comment | 2026-08-20 | func | assurance | A plan's `## Assurance` block is the two axis values plus one trigger bullet each; the trigger lists and the lane table live in the template's guidance comment and are dropped when the plan is written | Active |
| D-converge-step-numbers-are-full-positions | 2026-08-20 | arch | assurance | `/esq:converge`'s step numbers 1–4 are fixed positions in the `full` itinerary; no lean lane runs a subset any more, and the only run that starts at step 3 is one entered from an existing brief | Active |
| D-lane-stats-prints-prose-for-a-human | 2026-08-20 | arch | cli | A CLI read whose audience is a person at a terminal and off which no skill routes prints a table by default with `--json` beside it; `telemetry summary` and `lane stats` are the two, and the criterion is the audience rather than the count | Active |
| D-lane-stats-measures-from-ledgers-not-history | 2026-08-20 | arch | assurance | `esq lane stats` reads the plans, the corrective briefs and the backlog as they stand plus one `git log --oneline --grep`, never a per-plan history walk — accepting that the 🟢 tier undercounts, because `/esq:fix` strips applied greens from the brief | Active — rates clause amended by D-reopen-rate-normalized-to-the-lane-itinerary |
| D-reopen-rate-normalized-to-the-lane-itinerary | 2026-08-20 | arch | assurance | `esq lane stats`' two rates are normalized to the itinerary each plan's lane bought — a reopen is a corrective pass beyond that budget, and post-pass defects are backlog citations after the budgeted loop closed | Active |
| D-inline-fix-leaves-a-direct-lane-anchor | 2026-08-20 | arch | assurance | `/esq:work`'s inline verdict writes a minimal `docs/plans/` anchor as a third commit — `## Done looks like`, an `## Assurance` block computing `direct`, one phase and an execution-log entry citing the fix commit — so the corrective loop and `esq lane stats` resolve to that fix instead of to the newest unrelated plan | Active |
| D-work-captures-free-text-before-routing | 2026-08-20 | arch | backlog | `/esq:work` accepts item text as a target: it mints and commits the backlog row first — every verdict, `route` included — then routes that ID through the unchanged ladder; a duplicate routes the existing row, and an ID shape matching no row is still refused | Active |
| D-conformance-needle-traces-to-its-scenario | 2026-08-20 | arch | audit | A `need` line pins a sentence its scenario paragraph actually asserts — a load-bearing clause with no scenario behind it gets a scenario of its own or a backlog row, never a needle | Active |
| D-pinned-sentence-outranks-a-rewrite | 2026-08-21 | arch | audit | A rewrite that collides with a sentence `docs/CONFORMANCE.md` pins reshapes itself around the pinned clause and keeps it verbatim — the needle is only updated when the pinned behavior itself changed | Active |
| D-a-needle-may-pin-a-shared-sentence | 2026-08-21 | arch | audit | A conformance needle may pin a sentence that lives inside a shared block, because `need` greps only that command's own target and `check-sharedblocks` already holds every copy byte-equal — the coupling is recorded, not avoided | Active |
| D-runtime-evidence-from-a-bespoke-runner | 2026-08-21 | infra | audit | P-07's runtime evidence is a bespoke headless runner under `scripts/`, never wired into `audit.sh`, because `claude plugin eval` — the vehicle B-032 names — answers `early access` and does nothing on 2.1.238; the port back is B-032's call, not a reason to wait | Active |
| D-a-runtime-eval-judges-artifacts | 2026-08-21 | arch | audit | A runtime evaluation's verdict is read from the run's artifacts — commits and their file lists, ledger rows, the anchor, `esq lane`'s output — and the model's own prose is recorded as corroboration that never gates the verdict | Active |
| D-journeys-share-one-runner-harness | 2026-08-29 | arch | audit | The six golden orchestration journeys and the P-07 work capture share one `scripts/lib/journey-runner.mjs` — seeding, the shadow refusal, the bounded headless spawn, reduction to records, replay and the table — with each script keeping only its rows, judges and harvest; the extraction is proved by the existing checked-in capture replaying green, byte-unchanged | Active |
| D-journeys-stay-bespoke-on-2-1-251 | 2026-08-29 | infra | audit | Re-checked on Claude Code 2.1.251: `claude plugin eval --help` renders a full surface but `init` and the run path both answer `early access` and exit 0, so B-032's journeys are built on the bespoke runner; the port back belongs to `harness-evidence-freshness` (B-074), and whoever attempts it must assert on the refusal line, never on the exit status | Active |
| D-a-mutated-fixture-carries-evidence-only | 2026-08-21 | arch | audit | A judge's fault-injection fixture is a copy of the capture's `smoke-row` and `smoke-evidence` records only, without the stream events, because the verdict rests on artifacts and a test pins that it does | Active |
| D-read-once-ships-as-a-shared-block | 2026-08-21 | arch | cost | The read-once rule ships as a marked `shared:read-once` paragraph copied into the five worker skills (build, check, review, fix, work), not as one canonical copy nor as a hook | Active |
| D-calls-per-turn-over-a-paired-population | 2026-08-21 | arch | telemetry | `esq telemetry summary`'s calls/trip is calls ÷ round trips summed over the runs carrying both fields, not a median of per-run ratios | Active |
| D-ratio-sealed-with-its-population | 2026-08-21 | arch | telemetry | The sealed group carries `paired` and `callsPerTrip` beside the raw axes, and the table prints the ratio to two decimals rather than through `humanCount` | Active |
| D-a-measured-figure-is-dated-not-refreshed | 2026-08-21 | arch | cost | A measurement written into a ledger carries its date and stays as measured; a correction states the old figure's error as a magnitude and never re-quotes the superseded number | Active |
| D-a-match-is-never-read-through-a-pipe | 2026-08-21 | infra | audit | Under `pipefail`, no script pipes into an early-exiting reader: a `grep -q` test reads a here-string or a `case`, and the shape is refused by `check-sigpipe-shape.sh` rather than tolerated at the call site | Active |
| D-advance-target-selects-within-now | 2026-08-21 | arch | roadmap | `/esq:advance` accepts an entry slug or `B-NNN` that selects within the `Now` horizon and refuses anything outside it, rather than reaching into `Next`/`Later` or falling back to the full walk | Active |
| D-ask-shape-lives-in-zone-two | 2026-08-21 | ux | reporting | The one-line action-first ask shape is stated inside the conclusion block's zone 2 rather than as a new shared family, and guarded by an extracted check/fault-injection pair over the conclusion templates | Active — amended 2026-09-11 by D-announcements-and-asks-stay-minimal |
| D-an-ask-cap-measures-the-rendered-line | 2026-08-22 | infra | audit | The ask-shape cap counts characters as a reader sees them, not bytes, and treats a run of two or more spaces as a column separator rather than a sentence break — both pinned by must-not-flag fault-injection cases | Active |
| D-an-action-first-test-is-a-verb-registry | 2026-08-22 | infra | audit | "The action first" is tested positively, against a declared registry of opening action verbs, rather than by a denylist of narration words — the shape of the opener only chooses the finding message | Active |
| D-wait-once-ships-as-a-shared-block | 2026-08-22 | arch | cost | The discipline for waiting on a slow check is one registered shared paragraph carried by `build`, `fix` and `work`, not a bullet in the one command that measured worst | Superseded |
| D-append-log-refuses-an-unknown-key | 2026-08-22 | func | ledgers | One canonical log-entry schema in the CLI: the validator and `--help` are both derived from it, and a payload is refused — unknown key, missing or empty required key, wrong type, illegal status combination — before the plan file is read | Active |
| D-wait-protocol-waits-for-the-safety-net | 2026-08-22 | prod | cost | B-085's wait protocol is not planned until `runtime-evals` (B-032) exists, because it changes how a verification result is collected; B-049's deterministic half is split out and proceeds now | Active |
| D-a-guard-reads-the-source-then-the-mirror | 2026-08-26 | infra | audit | A reach-limited guard reads `plugin/skills` as a first-class corpus through one shared enumeration and runs against `commands/esq` as a second pass, rather than trusting the parity check to make the mirror a proxy for the source | Active |
| D-a-conclusion-carrier-is-the-skill | 2026-08-26 | infra | audit | For a native skill split across `SKILL.md` and `references/*.md`, the unit a corpus check judges is the skill, not the file: a region opened anywhere in the carrier covers every one of its files | Active |
| D-the-budget-suite-is-not-the-budget-check | 2026-08-26 | infra | audit | `tests/cost-budgets/` is wired into `audit.sh` while `scripts/cost-budgets.mjs` stays outside it — the suite reads checked-in fixtures, the script reads one machine's telemetry store, and only the second could redden a commit that did not cause it | Active |
| D-corpus-refuses-a-directory-of-prose | 2026-08-26 | infra | audit | A fleet check's corpus enumeration accepts a flat directory only when a top-level `*.md` carries frontmatter, so a directory of prose documents is refused as unusable input rather than judged as twenty commands | Active |
| D-coverage-is-pinned-by-count | 2026-08-26 | infra | audit | A check widened to a second corpus is pinned by asserting the two corpora agree on what they counted, never by an exit code — a check that silently narrows still exits 0 | Active |
| D-audit-injection-runs-on-a-scratch-repo | 2026-08-27 | infra | audit | A fault injection that must red the whole `audit.sh` run is proved against a throwaway copy of the repository, never by mutating a tracked script in place | Active |
| D-a-capture-persists-derived-records-only | 2026-08-29 | infra | evidence-capture | A billed capture persists only records the script constructs to an explicit schema — no harness event, no model prose — and a schema failure writes the sanitized prefix plus a key-names-only error record, never the raw evidence | Active |
| D-the-construction-brand-is-held-outside-the-record | 2026-08-29 | infra | evidence-capture | `assertSanitized` recognises a record by membership in a module-private `WeakSet`, not by a field on the record — so the brand cannot be spread, serialized or forged, and a record parsed back from a capture file is never branded | Active |
| D-an-equivalence-needs-an-outside-referent | 2026-08-29 | infra | evidence-capture | The smoke equivalence test pins the four corroboration columns as literals, because both sides of the comparison run the same production regex and a chain validated only against itself confirms rather than audits | Active |
| D-the-pre-schema-capture-stays-replayable | 2026-08-29 | infra | evidence-capture | `judgeCapture` keeps a read-side branch that derives the columns from a nested `stream` object, so a capture written before the schema still judges; no write path produces that shape | Active |
| D-the-refused-key-set-is-per-script | 2026-08-29 | infra | evidence-capture | The recursive privacy walk's refused-key set is per script, not shared: `text` is refused in tests/probe/ and cannot be in tests/smoke/, `usage` is refused in neither — a key that is identity in one schema is a displayed column in the other | Active |
| D-the-ambient-stream-is-rebuilt-in-the-test | 2026-08-29 | infra | evidence-capture | Once the fixtures hold no harness event, each equivalence test rebuilds an ambient raw stream from what the record kept and drives the production write side with it, rather than a raw capture being kept on disk to feed it | Active |
| D-the-privacy-walk-is-total-against-the-schema | 2026-08-29 | infra | evidence-capture | The primary privacy proof refuses any key the schema does not declare, at every depth, over every `*.jsonl` under tests/; the named sensitive set is a second refusal that classifies a leak rather than the thing that detects it | Active |
| D-an-extraction-is-proved-by-an-unchanged-consumer | 2026-08-30 | arch | evidence-capture | An extraction that must change nothing keeps the consumer's import names and its checked-in fixture byte-identical, so the proof is the old test passing unedited over the new code | Active |
| D-a-journey-capture-holds-ledger-facts-not-the-file | 2026-08-30 | infra | evidence-capture | A runtime-eval capture persists the derived ledger facts a judge reads — entry headings, cited hashes, verdicts — and never the artifact file they came from, because the file carries the prose the model wrote | Active |
| D-a-journey-seeds-mid-orchestration | 2026-08-30 | arch | evidence-capture | A journey starts from an overlay on the shared toy project plus pre-dated commits made by the harness, with the harvest range opened after them, rather than from a forked seed tree | Active |
| D-park-a-journey-never-loosen-its-judge | 2026-08-30 | arch | runtime-evals | A journey whose contract the product does not honor is parked behind its backlog row, with seed, judge and billed red captures kept as evidence | Active |
| D-the-registry-and-its-fixtures-are-a-bijection | 2026-08-30 | arch | runtime-evals | Every active journey has exactly one capture record and one mutation, enforced in `judgeCapture` and in the suite, not by convention | Active |
| D-a-billed-capture-is-evidence-only-with-its-seed | 2026-08-30 | infra | evidence-capture | A billed capture stays checked in only while the seed overlay that produced it still exists; a run superseded by a re-seed is named in history, never carried forward as comparable evidence | Active |
| D-the-escalation-answer-is-required | 2026-08-30 | arch | assurance-lane | `esq plan append-log` requires an `escalation` answer on every entry — a named trigger or the literal `"none"` — and its refusal prints the trigger list at the moment the entry is written | Active |
| D-close-a-row-on-what-shipped | 2026-08-31 | prod | runtime-evals | A backlog row is rewritten to the scope actually delivered and the unbuilt remainder is moved to a new row citing the commit that preserves its design — never carried as unexecuted phases in a shipped plan | Active |
| D-a-billed-run-never-overwrites-paid-evidence | 2026-08-31 | arch | evidence-capture | A billed run has no implicit destination: `--only` requires `--out`, an existing file or the aggregate is refused before the spawn, and the aggregate checked-in capture is replaced — atomically — only by a whole-registry run that completed every row and re-judges green; every other outcome preserves its records in a fresh or temporary path named in the diagnostic | Active |
| D-the-one-write-path-never-throws | 2026-08-31 | infra | evidence-capture | `writeCapture` fails closed rather than throwing — a missing or unknown mode, a serialization failure and a lost `wx` race each return a non-zero status having written nothing — because the billed callers invoke it from a `finally`, where a throw would replace the run's own outcome with the writer's | Active |
| D-the-aggregate-is-earned-by-a-replay | 2026-08-31 | arch | evidence-capture | A live run earns the right to replace the checked-in aggregate by re-judging the capture it is about to write through the same `judgeCapture` a `--parse` runs — not by trusting the verdicts the loop already printed | Active |
| D-a-doc-contract-check-greps-the-docs | 2026-08-31 | arch | audit | A mechanical check that a documented command still teaches the contract greps the documentation referent (README, `docs/`) and the scripts' own help text — never the implementation directory, whose flag-parsing site matches the pattern forever | Active |
| D-a-plan-owns-its-branch-trunk-owns-nothing | 2026-08-31 | arch | git-hygiene | A plan records the branch its phases commit to and `/esq:build` refuses a branch it does not own — computed by `esq branch check`, never by skill prose; a plan recording the default branch declares trunk mode, claims that name for nobody, and any *different* plan owning a branch refuses whether or not it is merged, exempting only plans sharing a slug stem | Active |
| D-ship-policy-lives-in-a-committed-esquisse-json | 2026-08-31 | prod | safe-shipping | The ship policy is declared in `.esquisse.json` at the repository root — one tracked, reviewed file, one key `shipPolicy`, one of three values, no version field and no gitignored sibling; unknown other top-level keys are ignored so the file grows later without a migration | Superseded |
| D-ship-policy-defaults-to-manual | 2026-08-31 | prod | safe-shipping | The ship policy defaults to `manual` — absence or malformed configuration never authorizes a merge or a push; `/esq:build` never merges, only a clean `/esq:converge` may initiate shipping, `merge-and-push` must be explicitly declared and must announce remote, source and destination before acting, and the mechanism is `/esq:worktree merge` or one primitive extracted from it, never a second merge implementation | Superseded |
| D-one-merge-engine-in-the-cli | 2026-09-01 | arch | safe-shipping | One canonical merge engine lives in the CLI as `esq merge begin\|scan\|seal\|abort`, with `esq merge land` a composition of those verbs and nothing else — neither `/esq:worktree merge` nor `/esq:converge` may implement or hand-emulate git merge; the `Status` and `Pri` ladders move into the CLI as a total order over a closed vocabulary, every `ask` stays with the model, and `land` reads its authority in-process immediately before the git write — the plan header's `**Branch:**` and `**Origin:**` since 2026-09-04, the ship policy before that — while the attended verbs are ungated | Active |
| D-ship-policy-reader-stands-beside-branch-check | 2026-08-31 | arch | safe-shipping | The ship-policy reader is a standalone `shipPolicy(root)` beside `branchCheck`, sharing only the existing `defaultBranchOf` helper — no git-facts extraction for one caller, and no fusion into `esq branch check` whose exit-code contract it contradicts | Superseded |
| D-ship-policy-authority-from-the-destination-ref | 2026-08-31 | arch | safe-shipping | Ship-policy authority is read from `refs/heads/<destination>:.esquisse.json`, never from the working tree; a checked-out copy is a floor that can only lower the policy, and a remote is usable only if `git remote` actually lists it | Superseded |
| D-malformed-ship-policy-reds-validate | 2026-08-31 | func | safe-shipping | A malformed `.esquisse.json` that exists makes `esq validate` exit 1 with a value-free finding, while `esq ship policy` still reports it and safely resolves to `manual`; absent and valid-with-extra-keys stay green | Superseded |
| D-ship-policy-report-is-total | 2026-08-31 | arch | safe-shipping | `esq ship policy` is total: outside a repository, bare, no default branch, missing destination ref, no remotes or several ambiguous ones each return a fully-shaped `manual` verdict at exit 0, never a throw | Superseded |
| D-esquisse-never-pushes | 2026-09-01 | prod | safe-shipping | No esq command pushes, ever — the ship-policy vocabulary names no push, no flag, environment variable or confirmation prompt revives one, and the promise is mechanized by a build-failing check on any `git push` reaching `plugin/` rather than stated in a README | Active |
| D-ship-policy-is-a-two-value-vocabulary | 2026-09-01 | func | safe-shipping | `SHIP_POLICIES` is `['manual', 'merge-only']`; a repository still declaring the removed `merge-and-push` is malformed like any unrecognized value — it resolves to `manual` and reds `esq validate`, with the migration one edit rather than a silent downgrade, and the floor stays an index comparison over the ordered array rather than collapsing to a boolean | Superseded |
| D-a-merge-refusal-never-moves-head | 2026-09-01 | arch | safe-shipping | Every `esq merge begin` precondition is answered against the refs before HEAD moves — the switch is the last step before `git merge`, a merge git declines to start switches back, and after any refusal HEAD, the source branch and the porcelain are byte-identical to before the call | Active |
| D-seal-applies-the-rules-and-refuses-the-rest | 2026-09-01 | arch | safe-shipping | `esq merge seal` writes every ledger cell the derive rules settle and commits the held merge; a conflict hunk is taken whole or not at all, so anything carrying an `ask`, a conflicted detail section or a non-ledger conflict keeps git's markers and seal refuses on them — which is what leaves the attended and unattended paths differing only in who answers an `ask` | Active |
| D-a-seal-is-arbitrated-by-the-text-not-the-index | 2026-09-01 | func | safe-shipping | Whether a conflict is resolved is read from the working tree's text, never from an unmerged index entry — `git add` is seal's own first write, so an unmerged entry is the normal state on the way in; the marker scan looks for `<<<<<<< ` and `>>>>>>> ` and deliberately not `=======`, which is also a setext underline | Active |
| D-a-precondition-is-read-not-re-run | 2026-09-02 | arch | safe-shipping | `/esq:worktree merge` states `esq merge begin`'s refusal verdicts and reads them, rather than re-checking the clean tree, the branch's existence and the self-merge by hand before calling it — the verb answers all three against the refs, and a hand pre-check buys three round trips per merge for an answer the next call already gives | Active |
| D-a-collision-is-reported-before-a-question | 2026-09-02 | func | safe-shipping | `esq merge land` runs the duplicate-ID scan ahead of its `ask` check, so two items minted under one number are reported as a collision naming the ID rather than as a free-text question about the cells they happen to differ in | Active |
| D-a-refused-landing-is-a-truthful-no-op | 2026-09-02 | prod | safe-shipping | Every way `/esq:converge` does not land is a no-op, never a failure: nothing is written, the source branch and every commit on it are untouched, and the run reports `○ not landed — <reason>` with the exact `/esq:worktree merge` line a human would run — a bare reason with no command is a defect, and a trunk-mode plan or an already-merged branch is reported as a no-op rather than as an error | Superseded |
| D-an-unrunnable-auto-step-substitutes-once | 2026-09-02 | arch | verification | An `(auto)` step's referent is resolved by reading at plan time; build substitutes once on unambiguous prose and logs it, halts otherwise | Superseded |
| D-repair-command-before-proof | 2026-09-25 | func | verification | Repair an unrunnable prospective command and prove its exact tree; land never substitutes | Active |
| D-unknown-harness-evidence-is-treated-as-stale | 2026-09-02 | func | harness-evidence | Unreadable, missing, malformed or never-measured model-routing evidence is handled exactly as stale — a relay warns once on Opus and stops before its first spawn on anything else; evidence that does not govern model-routing is status-only in every state and never blocks a relay | Active |
| D-a-capture-is-claimed-before-it-is-billed | 2026-09-02 | arch | harness-evidence | A billed capture's destination is claimed exclusively (`wx`) before the first spawn and appended to row by row through `capture-schema.mjs`'s own writer, so a collision refuses at zero billed runs, an interruption keeps every completed row, and no temp or sibling file is ever placed | Active |
| D-the-current-measurement-is-a-cell-not-a-date | 2026-09-02 | arch | harness-evidence | `docs/EVIDENCE.md` is append-only and a claim's current measurement is the single row whose `State` cell is `current`, never the newest date or the last line; zero or two such rows is ambiguity and resolves to `unknown` | Active |
| D-a-shipping-unit-lands-where-it-started | 2026-09-04 | arch | safe-shipping | A shipping unit lands on the branch it was created from: `/esq:plan` records `**Origin:**` beside `**Branch:**` and cuts `esq/<slug>`, and `esq merge land --plan <plan>` reads both fields in-process immediately before the git write — the `.esquisse.json` ship-policy layer, its reader, its subcommand and the `trunk` verdict are deleted, and a plan with no `**Origin:**` is legacy: it owns no branch and never auto-lands | Active |
| D-a-landing-runs-where-the-destination-lives | 2026-09-13 | arch | safe-shipping | A landing runs the one merge engine in the checkout that owns its destination: `esq branch check` reports a read-only `destination` site resolved from `git worktree list --porcelain`, `/esq:land` stops on an unusable one before it spends verification, and `esq merge land` re-resolves the site in-process from the plan header and roots `begin`/`scan`/`seal` there — never switching, detaching or unlocking a worktree it does not own, and never leaving the source checkout off its branch | Active |
| D-user-owns-the-branch-header-escape | 2026-09-05 | arch | safe-shipping | The `**Branch:**` single-writer rule binds commands, not the user: on `owned-elsewhere` the refusal's option A names two steps — cut `esq/<slug>`, then edit the plan header yourself — and no new CLI writer of the field is created | Active |
| D-a-deadline-resolves-at-the-kill | 2026-09-02 | arch | harness-evidence | A billed run's per-row deadline resolves the row the moment the child is killed, with whatever already streamed, rather than waiting for the child's `close` event — a killed process's own children hold the inherited stdio pipes open, and a deadline that waits for them is not a deadline | Active |
| D-the-relay-verdict-is-one-field | 2026-09-02 | arch | harness-evidence | `esq evidence` collapses the whole routing decision to one top-level `relay` string (`proceed` or `opus-only`), so a relay reads one field rather than searching the claim list; no routing claim, or two, is `opus-only` like every other non-fresh shape | Active |
| D-a-capture-states-its-own-version | 2026-09-02 | arch | harness-evidence | A registry row's `Version` cell is verified against the version the capture recorded for itself — `init.claude_code_version` or the judge column `cc`, whichever the capture carries — and a capture recording two distinct versions is a finding, never a pick | Active |
| D-relay-inherits-the-session-model | 2026-09-03 | arch | model-pins | The three relay orchestrators declare `model: inherit` instead of a `sonnet` pin, so the stale-evidence stop's advertised recovery (`/model opus`, then re-invoke) actually changes the relay's own model; the cheap relay becomes the user's `/model sonnet` or `--model sonnet`, and the worker clause (explicit `model: opus`, asserted from telemetry) is unchanged | Active |
| D-a-manual-measurement-names-a-capture | 2026-09-03 | arch | harness-evidence | A measurement taken by hand is registered like any other — the interactive-pin protocol writes a sanitized JSONL under `docs/evidence/` and the appended row names it; the reader's rule that only a `never-measured` row may carry an empty `Capture` is left exactly as it is | Active |
| D-the-never-measured-placeholder-is-never-retired | 2026-09-03 | arch | harness-evidence | Once a claim gets its first real measurement, its `never-measured` placeholder row stays exactly as it is — not deleted, not flipped to `superseded` — because activation only ever flips a `current` row and a captureless `superseded` row is a finding; both IDs stay live and README names both | Active |
| D-a-documented-protocol-is-run-not-read | 2026-09-03 | arch | harness-evidence | Check 47 verifies README's measurement protocol by extracting the registry row it tells a maintainer to write, materializing it with a capture in a throwaway root and reading it back through `esq evidence` — a fixture-scoped assertion, not a prose comparison | Active |
| D-a-refusal-hands-back-what-it-established | 2026-09-04 | func | merge | A `land` refusal carries the `/esq:worktree merge` line built from the fields the plan established before the refusal — branch and destination when both validate, branch alone when the origin does not, no command when the branch does not — and never echoes, repairs or guesses a field that failed `safeRef` | Active |
| D-a-run-belongs-to-one-plan-window | 2026-09-05 | arch | measurement | The outcome join attributes a telemetry run to the single plan whose `[opened, closed]` window contains it — a run inside two windows is `ambiguous` and enters no segment, a run inside none is `outside`, and both counts print before any number they qualify | Active — superseded as the attribution rule 2026-09-06 by D-plan-identity-is-declared-not-inferred; retained in full as the `--temporal-diagnostic` reading |
| D-work-size-is-phases-executed | 2026-09-05 | arch | measurement | The join's work-size proxy is the plan's executed-phase count (`small` 1, `medium` 2–3, `large` 4+), read from the `## Execution log`, not a diff size | Active |
| D-the-join-lives-outside-the-cli | 2026-09-05 | arch | measurement | The cost↔outcome join is a script over the two `--json` surfaces, not a `lane stats` mode: the CLI gains only additive structural fields, and every inference lives in `scripts/outcome-join.mjs` | Active |
| D-the-branch-guard-refuses-before-the-first-spawn | 2026-09-04 | arch | safe-shipping | Converge's HEAD-versus-`**Branch:**` guard is restored as a preflight refusal before the first subagent, not as a seventh landing gate and not as a HEAD check inside `esq merge land` — the exposure is fix commits written to the wrong branch, which only a preflight stop prevents | Active |
| D-rows-flag-refuses-without-json | 2026-09-05 | arch | measurement | `telemetry summary --rows` exits 2 without `--json` rather than being silently ignored — a machine-only projection on a prose-first read is refused, never dropped | Active |
| D-an-unexecuted-plan-has-no-window | 2026-09-05 | arch | measurement | A plan whose execution log is empty opens no attribution window at all — it has no closing date and no work size, so it neither takes a run nor makes one ambiguous | Active |
| D-a-plan-window-is-a-day-range | 2026-09-05 | arch | measurement | The join's window covers both end days inclusively, because ledger dates are authored days and `recordedAt` is a UTC instant; a run on the closing day is a tie, resolved as ambiguity like any other | Active |
| D-a-model-configuration-keeps-its-context-pin | 2026-09-05 | arch | measurement | A segment's model key keeps a context pin (`[1m]`, someone's choice) and drops a dated snapshot (`-20251001`, a release), so a snapshot bump never forks a segment | Active |
| D-the-join-reuses-the-repo-sample-threshold | 2026-09-05 | arch | measurement | The outcome join declares no threshold of its own: it takes the value `lane stats` publishes (`laneDoc.sampleThreshold`, 5) and applies it to each rate against that rate's own denominator — `telemetryDoc.sampleThreshold` is never read, and the two surfaces agree today only because both publish one shared constant | Active |
| D-a-rate-is-withheld-by-its-own-denominator | 2026-09-05 | arch | measurement | Each rate the outcome join prints is gated on the denominator it was computed from as well as on its segment's plan count — the accepted rate (`done / claimed rows`) is published only when the segment clears 5 plans *and* its own row count clears 5 | Active |
| D-plan-identity-is-declared-not-inferred | 2026-09-05 | arch | measurement | Every new telemetry row carries a content-free `repoKey`, unconditionally; identity is then `(repoKey, planSlug)`, declared by the command that knows it — an explicit `plan:<slug>` marker on the `esq:<command>` spawn label, written only by an orchestrator that already holds the plan, and one event appended to a session-scoped append-only log (named by a hashed session key, never an interpolated one) by the `esq lane <plan-or-brief-path>` call every plan-bearing command already makes — never inferred from a transcript argument, a branch, a path or a clock, and never resolved by keeping the last of two declarations | Active |
| D-a-slug-is-validated-at-two-altitudes | 2026-09-06 | arch | measurement | The writers validate a plan slug's **shape** only (a closed `^[a-z0-9][a-z0-9-]{0,63}$`, no separators, no dots, no path); the join validates its **resolution** against `esq lane stats --json` and names what fails as `unknownIdentity` or `staleIdentity` — both counted, both printed | Active |
| D-a-session-id-is-hashed-into-a-filename | 2026-09-06 | arch | telemetry | A harness-supplied session id is never interpolated into a path: one shared `sessionKey(id)` rejects a non-string, an empty string or an id over 512 characters and otherwise returns the first 32 hex characters of its SHA-256, used by writer and reader alike | Active |
| D-two-declarations-are-ambiguity | 2026-09-06 | arch | measurement | A segment holding two distinct valid slugs is `planAmbiguous: true` with its `repoKey` and no `planSlug` — it enters no segment, counts in the coverage denominator and against the numerator, and can never satisfy the baseline gate; repeated declarations of the same slug are deduped | Active |
| D-identity-is-required-optional-or-impossible | 2026-09-06 | arch | measurement | Every local row is plan-bearing (always in the coverage denominator), pre-plan (in it only when it declared) or non-plan-bearing (never in it), decided by what the command is *invoked on* and never by what its name suggests — a closed list applied identically by writers, join, gate and prose | Active |
| D-the-baseline-gate-floor-is-95-percent | 2026-09-06 | arch | measurement | `--baseline-gate` requires cohort coverage ≥ 95% — derived from a 100% structural ceiling, so the 5% is an operational budget — plus *some* cell of the `full` lane and some cell of the `conformity` lane holding `sampleThreshold` plans, deterministically selected and judged by both cell conditions, with every published rate in those two cells clearing its own denominator; each ✗ carries the distance to it, and the freeze refuses to write a document whose harness version it could not read | Active (amended 2026-09-06 — the cells question is existential, the selection is deterministic, and the freeze carries `claudeCode`) |
| D-plan-slug-canonicalized-at-the-writer | 2026-09-06 | arch | measurement | A spawn's `plan:` marker admits exactly two bounded declared forms — the canonical slug (64 chars) and the plan file's dated stem (75) — and the **writer** canonicalizes the admitted capture with one shared pure function (`canonicalPlanSlug`, defined once in `plugin/scripts/hook-io.mjs`, byte-identical to `normalizeSlug`) and re-validates it against `PLAN_SLUG_SHAPE` before persisting; the reader normalizes nothing, so a writer regression still surfaces as `unknownIdentity` | Active |
| D-run-row-carries-the-agent-id | 2026-09-07 | arch | measurement | `RUN_ROW_KEYS` gains `agentId` — the harness-generated run identifier already in the store and already matched on by `EXCLUDED_RUNS` — so a reader can key a row without a slug; the allowlist still names no prompt, response, path, session id or code content, and no hook writes anything new | Active |
| D-release-command-lives-in-the-repo | 2026-09-07 | infra | release | The local release path is `./scripts/release-local.sh` in the source checkout, never a distributed `/esq:*` skill — a release command loaded from the installed plugin can itself be stale; the version question has one implementation (`scripts/check-release-version.sh`), read by `audit.sh` as a guard and by the release script as its own refusal and `--check` report, and the drift half is scoped to `main` | Active |
| D-scoped-verdict-not-scoped-measurement | 2026-09-07 | arch | audit | `check-release-version.sh` scopes its drift **verdict** to `main` (exit 2 elsewhere) while still **measuring** drift on every branch through `--json`, and `audit.sh` check 51 prints that exit 2 as a yellow skip rather than a green pass | Active |
| D-the-release-commit-stands | 2026-09-07 | infra | release | `release-local.sh` refuses before it writes and never rewinds after: every failure past `git commit` — a failing or timed-out install, an unreadable harness record, a version, commit or byte mismatch — keeps the release commit, prints the verbatim retry line and reports failure, and `check-release-version.sh` therefore runs *after* the commit, where it can be a proof rather than the drift that authorized the run | Active — the pre-commit clause naming `check-plugin.sh` amended 2026-09-10 by D-the-publisher-revalidates-nothing |
| D-manifest-disagreement-is-refused-not-reconciled | 2026-09-07 | infra | release | Two manifests already disagreeing before a bump refuse the release rather than being silently reconciled by it — choosing which of two versions is right is judgment the script does not have | Active |
| D-a-guard-tests-the-working-tree | 2026-09-07 | arch | audit | A fault-injection suite whose fixtures are clones of this checkout overlays the working tree's copy of the scripts under test over each clone before running — otherwise it proves the last commit rather than the edit in front of whoever runs it, and stays green on a broken working tree | Active |
| D-parallel-reads-sequential-git-mutations | 2026-09-07 | arch | workflow-cost | Round-trip batching splits into two mechanisms that are never conflated — independent **read-only** calls issued as parallel `tool_use` blocks in one turn, and ordered or shared-state work chained sequentially inside **one** tool call — with git mutations belonging only to the second; separately, a command's own bookkeeping writes consolidate to one commit where it owns every file, while implementation commits stay one per task, atomic and independently revertible | Active |
| D-the-router-accepts-its-own-pending-drift | 2026-09-08 | infra | release | `update.sh` runs the audit only when a release is needed and check 51 fires exactly then, so requiring exit 0 made it unable to ever release; it requires green **but for that finding** instead — the audit's Summary count must equal the findings `check-release-version.sh` emitted on stderr during the same `--json` call, and each must appear in the log verbatim, so a second finding or one of another kind still refuses and the accepted text is never restated in the router | Superseded |
| D-name-the-teardown-primitive-from-a-probe | 2026-09-08 | arch | workflow-cost | A background verification's collection and teardown rule may name only a primitive a dated probe found in a **worker's** own tool set on the Claude Code in use — the 2026-08-22 reading (2.1.239) expired against the installed 2.1.263, so the probe is retaken before the rule is written and its answer is registered in `docs/EVIDENCE.md` rather than inferred from the transcript forensics that opened B-087 | Active |
| D-a-declared-field-never-forces-a-privacy-exemption | 2026-09-08 | arch | evidence | A capture field is renamed rather than exempted when its name collides with the privacy walk's sensitive-key set — `background-evidence` carries `toolCalls`, because `tools` is the ambient tool list a `system/init` event publishes and the walk refuses that key at every depth | Active |
| D-a-conditional-answer-key-is-declared | 2026-09-08 | arch | evidence | A probe key that measures *how long after* something happened is owed only when the boolean it hangs off came back true, and that dependency is declared in the probe rather than inferred from a naming convention — with the guard true the same missing key is still a named problem | Active |
| D-an-unreadable-teardown-is-absent-never-clean | 2026-09-09 | arch | evidence | A harvested lifecycle fact the platform could not read leaves its key **absent**, never an empty value — `survivingProcesses` is `[]` only when `/proc` was actually walked, so a judge that would pass a clean teardown cannot be passed by a machine that never looked | Active |
| D-the-shared-seed-grows-only-by-addition | 2026-09-09 | arch | evidence | A file may be added to the runtime-eval seed every journey is judged against, but the instructions the existing journeys read may not change — `slow-check.mjs` sits beside `check.mjs` and the seed's `CLAUDE.md` is untouched, so the journey that needs it names it in its own overlay plan | Active |
| D-a-background-launch-counts-wherever-it-was-asked | 2026-09-09 | arch | evidence | `backgroundLaunches` counts a launch from a worker as readily as from the main conversation, deliberately unlike `spawns`, which counts only the main conversation — a phase's slow check is launched by the worker, so the `spawns` rule would read zero on the one run the contract is about | Active |
| D-a-journey-is-a-candidate-before-it-is-a-row | 2026-09-09 | arch | runtime-evals | A new runtime journey lives in a third state — authored, runnable by `--only`, judged by `--parse --only`, and outside the registry — until a run pays for it, because the registry and its checked-in fixtures are a bijection and neither can be written first | Active |
| D-the-journey-aggregate-is-re-bought-never-appended | 2026-09-09 | arch | runtime-evals | A journey enters `ROWS` on a whole-registry run that re-buys every row on one Claude Code version, never by pasting its own `--only` capture into the aggregate — the aggregate is the capture a registry row in `docs/EVIDENCE.md` pins to one version | Active |
| D-a-conformance-scenario-cites-both-readings | 2026-09-09 | arch | conformance | A conformance scenario whose rule was written over behavior already observed cites **both** its pre-change and post-change green readings, rather than superseding the first with the second — the pair is what distinguishes a contract from a claim to have fixed something | Active |
| D-kill-the-group-then-read-survivors | 2026-09-09 | arch | evidence-harness | A billed run's deadline kills the child's whole process group and resolves under a second, bounded grace | Active |
| D-converge-means-one-itinerary | 2026-09-09 | prod | assurance-lane | `/esq:converge` always runs check → fix → review → fix at four subagents; the assurance lane stays advisory metadata whose `route` recommends the cheaper standalone `/esq:check` or `/esq:review`, and `itinerary`/`subagents` leave the lane table so no lane can shorten what invoking the command means | Active |
| D-the-cli-decides-a-corrective-branch | 2026-09-09 | arch | branch-ownership | Whether a corrective plan reuses its stem's shipping unit or opens a new one is answered by `esq branch resolve <slug>` from git's own merge-base, never reasoned out in `/esq:plan`'s prose — and corrective stems canonicalize recursively, so `<stem>-fixes-2-fixes` owns the same branch as `<stem>` | Active |
| D-update-publishes-converge-verifies | 2026-09-09 | infra | release | `./scripts/update.sh` is a publisher, not a second verifier: on a clean `main` it exits 0 through the read-only check or calls `release-local.sh --patch`, and never runs `./scripts/audit.sh` — `/esq:converge`'s landing gate owns the full audit and `release-local.sh` keeps its installed version/commit/byte proof, and no cache or attestation is added | Superseded |
| D-the-publisher-revalidates-nothing | 2026-09-10 | infra | release | `release-local.sh --patch` re-validates nothing: plugin validation is `check-plugin.sh` under the landing gate, and a successful release invokes `claude` exactly once — the install. What runs before the commit instead is a proof that nothing needing validation moved: the whole tree reads as exactly the two modified manifests, each differing from its committed copy on one line whose only difference is the version field | Active |
| D-auto-steps-are-read-from-the-verification-list | 2026-09-09 | arch | landing-gate | An `(auto)` step is collected from a phase's `**Verification:**` list, never from a sweep of the phase section — a task bullet quoting the marker is prose about the contract, and a phase with no verification list falls back to its own bullets so a pre-template plan runs rather than being skipped | Active |
| D-a-shared-block-holds-only-carrier-neutral-clauses | 2026-09-09 | arch | shared-blocks | `shared:collect-once` carries the three clauses that are true wherever a run waits on something it started; the clause naming what each carrier does *afterwards* — build's execution-log append, converge's `esq merge land` — stays outside the markers in each carrier's own words | Active |
| D-a-conformance-scenario-id-is-permanent | 2026-09-09 | arch | conformance | A `docs/CONFORMANCE.md` scenario id is a permanent citation key like a backlog or decision id: a new scenario takes the next free number, and an id a plan asked for that is already taken is never freed by renumbering the scenario holding it | Active |
| D-freshness-is-proved-from-the-tree | 2026-09-09 | arch | landing-gate | `/esq:converge`'s gate 4 reuses a recorded `(auto)` result only when the execution log names the commit it was verified at, the command is in that entry's **PASS** list, and `git diff --name-only <at> HEAD` touches only the command-owned lifecycle paths landing gates 2, 3 and 5 already re-read — never a commit-message classification; absent, malformed or unresolvable provenance, an unresolvable `(auto)` step, any other changed path, and any `HEAD` movement by an apply or fix worker all force the run, and identical commands across phases are settled newest-first — command and PASS criterion together — and run once per gate, while an unresolved step comes back shaped and runs conservatively | Superseded |
| D-corrective-branch-resolved-never-copied | 2026-09-09 | arch | plans | A corrective plan's branch is resolved from the stem's recorded refs, and `new` is the answer to every question that cannot be proven | Active |
| D-the-router-publishes-never-verifies | 2026-09-09 | arch | release | `./scripts/update.sh` is a publisher and holds no judgement: it runs no audit, because verifying a tree is `/esq:converge`'s job before the branch lands and re-running it there re-proves a fact the workflow already holds — the audit-acceptance rule B-132 forced on it disappears with the call | Superseded |
| D-a-handoff-is-single-and-checked | 2026-09-09 | arch | release | There is exactly one public command a maintainer runs to put a change into service, `release-local.sh --patch` is the primitive it calls, and check 55 mechanizes the difference — the primitive may be described anywhere and prescribed nowhere, recognized by an imperative cue anywhere on the line with two declared exceptions rather than by cue position or a multi-line window | Superseded |
| D-check-55-runs-once-on-the-native-corpus | 2026-09-09 | arch | audit | A fleet check whose other inputs are singular repo-root files runs once, on `plugin/skills`, rather than once per corpus: check 27 holds the legacy mirror byte-equal, so a second pass would only double-report `CLAUDE.md`, `README.md` and `docs/ARCHITECTURE.md` | Active |
| D-exempt-only-the-primitives-own-row | 2026-09-09 | arch | release | Check 55's README exception is narrowed from any `./scripts/…` reference row to the primitive's own index row, so its stated reason — the table indexes every script, and the only imperative that row carries names a different command as a precondition — describes the row it actually exempts | Active |
| D-an-exception-anchors-on-its-line | 2026-09-09 | arch | audit | Check 55's ARCHITECTURE exception anchors on the release-path bullet's own opening literal, the shape `opsrow()` already uses, rather than on a conjunction of tokens that is only accidentally unique | Active |
| D-a-delegate-that-cannot-run-is-a-finding | 2026-09-09 | arch | audit | An `audit.sh` delegate exiting anything but 0 or 1 is a finding, never a yellow skip above a green summary, and a class-wide static check holds every call site to it with check 51's off-`main` scoping the one declared opt-out | Active |
| D-a-cue-is-read-in-its-block | 2026-09-09 | arch | release | Check 55 judges an imperative cue over the Markdown block the command sits in rather than over the line alone — a paragraph is one unit, a table row and a list bullet are each their own — so a rewrap cannot change the verdict in either direction; supersedes the line-only rule of D-a-handoff-is-single-and-checked | Active |
| D-a-landed-stem-is-recognized-by-content | 2026-09-09 | arch | workflow | `esq branch resolve` asks ancestry first and, only when it says no, asks `git cherry`: a stem whose every commit has an upstream equivalent has landed, so a correction is cut fresh rather than put back on a branch nobody will merge again | Active |
| D-a-shipping-unit-is-its-branch | 2026-09-09 | arch | workflow | A shipping unit is every plan recording the same `**Branch:**`, so recursive corrective plans are one unit — the join key is the header field, never a slug shape, and it is the field `esq branch check` already reads | Active |
| D-a-same-unit-defect-is-never-a-backlog-row | 2026-09-09 | arch | workflow | A 🐛/⚠️ row a `build:` or `fix:` step of the active shipping unit filed blocks that phase's `completed` entry and converge's first spawn until its `Status` reads `Done` or `Dropped`; ordinary omissions are corrected inside the phase, substantive ones pause it | Active — amended 2026-09-11 by D-evidence-settles-backlog-dispositions |
| D-a-cued-block-reds-every-naming-line-in-it | 2026-09-09 | arch | audit | Check 55 reports **every** line naming the release primitive inside a block that carries an imperative cue, not just the first — a surface's fixtures must therefore mirror the real file's block structure rather than the check narrowing its report | Active |
| D-a-delegate-exit-must-reach-finding | 2026-09-09 | arch | audit | An `audit.sh` delegate exit other than 0 or 1 must reach `finding` by whatever route — the explicit `-ne 1` clause and the two-branch `else` that captures the delegate's stderr both qualify — so check 57 polices the destination and never the spelling | Active |
| D-an-unreadable-guard-branch-is-a-finding | 2026-09-09 | arch | audit | A delegate rc clause check 57 cannot classify is reported as a finding rather than passed over, because a guard branch nobody can read is exactly the unenforced state the check exists to refuse | Active |
| D-a-cherry-picked-stem-has-landed | 2026-09-09 | arch | branch-ownership | Whether a shipping unit has landed is answered by ancestry first and patch equivalence second, and `merged` is a three-state answer (`true`, `'equivalent'`, `false`) rather than a boolean — a squash-merged stem still reading as in flight is the accepted residue | Active |
| D-a-defect-against-the-unit-is-not-a-row | 2026-09-09 | arch | build-lifecycle | Duplicate of `D-a-same-unit-defect-is-never-a-backlog-row`, written before that entry was read, and it stated the rule on the wrong criterion (the failing file) rather than the one that shipped (the row's `Source` cell) | Superseded |
| D-the-unit-is-keyed-on-branch | 2026-09-09 | arch | build-lifecycle | The shipping unit is every plan recording the same `**Branch:**`, and the gate reads three backlog table cells — so a 💡 idea is non-blocking by type and a finder-sourced row by source verb, with no exemption list to maintain | Active |
| D-a-pause-must-name-its-cause | 2026-09-09 | arch | build-lifecycle | A paused execution-log entry carries `manualOutstanding`, `blockedBy`, or both, and never neither — relaxing the first to optional without that rule would let a pause say nothing about why it paused | Active |
| D-a-pause-is-classified-by-its-glyph | 2026-09-09 | arch | build-lifecycle | Every consumer classifies a paused entry by the `⏸` glyph and never by the clause after it, so a second pause cause needed no parser change and a third will need none | Active |
| D-plugin-management-runs-bare | 2026-09-10 | infra | release | Every non-interactive `claude plugin …` management subprocess in this repository runs `claude --bare`: they need no interactive Claude runtime, and the normal bootstrap that runtime pays for is the boundary measured hanging for a full 180 s bound where the same call returned in 0.52 s bare — no retry, no longer bound and no claim about which bootstrap subsystem hung | Active |
| D-needs-blocks-on-queue-presence | 2026-09-10 | func | roadmap | A `needs:` edge blocks only while its target is still an entry in a horizon; a target absent from the file raises `⚠ needs: <slug> not found` and never blocks, mirroring the `covers:` rule for a cited `B-NNN` with no backlog row | Active |
| D-plugin-management-closes-stdin | 2026-09-10 | infra | release | Every non-interactive `claude --bare plugin …` subprocess in this repository redirects its own stdin from `/dev/null`, and so does the retry line the release prints: `--bare` was only half the fix, and the same bare `plugin update` that inherited an interactive terminal on stdin sat through its full 180 s bound with nothing printed while `</dev/null` completed in 0.50 s — the carrier closes stdin for its child so no maintainer has to remember the redirection, with no retry, no longer bound and no claim about which subsystem waits on the descriptor | Active |
| D-landing-is-its-own-command | 2026-09-10 | prod | safe-shipping | `/esq:land <plan>` is the explicit landing: it reads already-landed first, refuses as a no-op on any durable prerequisite that does not hold, reuses what git proves, runs the rest at most once and calls `esq merge land`; `/esq:converge` ends at ready to land and never merges, and nothing lands, pushes or publishes on its own | Active — projection clause amended by D-projection-freshness-is-advice-at-landing; verification, coverage and already-landed clauses amended by D-land-verifies-the-whole-unit; unfinished-plan clause amended by D-a-unit-lands-when-every-plan-is-built-or-abandoned |
| D-land-reuses-proved-verification | 2026-09-10 | arch | landing-gate | `/esq:land` routes verification off `esq gate verify` with its existing invalidation rules, never passing `--workers-moved`; only the `**Reviewed at:**` header field is excluded from the plan-section comparison, a projection refresh still invalidates, no landing journal is kept, and the final phase's recorded audit PASS is what a landing reuses | Active — scope amended by D-land-verifies-the-whole-unit: the landing asks `--unit`; exclusion amended by D-a-unit-lands-when-every-plan-is-built-or-abandoned: `**Abandoned:**` is the second excluded header field |
| D-update-publishes-land-verifies | 2026-09-10 | infra | release | `./scripts/update.sh` stays a publisher that runs no audit, and the verification it defers to is `/esq:land`'s before the branch lands; publishing remains a separate step after landing | Active |
| D-projections-carry-their-mining-commit | 2026-09-10 | arch | projections | `/esq:spec` and `/esq:arch` record the full HEAD they mined as `@ <commit>` in their date markers, and `esq projections` proves freshness from it against a short harmless list; missing, legacy, malformed or unresolvable provenance proves nothing, and prose edited after mining is deliberately not certified | Active — the landing-refusal consequence amended by D-projection-freshness-is-advice-at-landing |
| D-a-landing-reads-coverage-and-obligations | 2026-09-10 | arch | landing-gate | A clean review or converge completion records `**Reviewed at:**` through `esq plan set-reviewed`; `esq branch check` answers `coverage`, `unit.promised` (undisposed rows planned by the unit, `Needs-decision` included) and `unit.findings` (live briefs whose `Source` names a unit plan), membership keyed on `**Branch:**`, and a landing refuses on any of them | Active — amended 2026-09-11 by D-evidence-settles-backlog-dispositions |
| D-plan-retires-the-brief-it-plans | 2026-09-11 | func | landing-gate | `/esq:plan` strikes from a corrective brief the 🟡s it planned and the 🔴s it resolved, and `git rm`s the brief in its own `plan: <slug>` commit when nothing remains; `unit.findings` is unchanged | Active |
| D-review-delta-base-is-a-reviews-own-record | 2026-09-11 | arch | landing-gate | A re-review's delta base is the newest commit a review read — a review brief's `Reviewed at:` stamp or a `plan(reviewed):`-committed `**Reviewed at:**` — and never a converge record, which commits as `plan(converged):` | Active — the computation amended 2026-09-14 by D-review-scope-is-one-deterministic-query: the CLI verb this decision rejected now resolves it, every clause of the rule unchanged |
| D-land-verifies-the-whole-unit | 2026-09-11 | arch | landing-gate | `/esq:land` verifies the union of every unit plan's `(auto)` steps through `esq gate verify --unit` (dedup across plans, newest proof wins), reads `coverage` as the unit's (any unit plan's `**Reviewed at:**` covering HEAD), asserts the verified HEAD with `esq branch check --at <head>` chained into `esq merge land` in one call, and reads a unit whose branch no longer resolves as landed when the plan file's last change is an ancestor of the origin — the merge engine, its authority read, `safeRef` and every existing refusal verdict unchanged | Active — completeness amended by D-a-unit-lands-when-every-plan-is-built-or-abandoned: the unit's, not the named plan's |
| D-projection-freshness-is-advice-at-landing | 2026-09-11 | prod | landing-gate | `/esq:land` still reads `esq projections` and reports a spec or arch that is not `fresh` as one zone-3 line naming its owner, but never refuses on it; `/esq:status` and `/esq:converge` stop presenting a refresh as owed before landing, while `esq projections`, the `@ <commit>` markers and what `/esq:spec` and `/esq:arch` do are unchanged | Active |
| D-a-unit-lands-when-every-plan-is-built-or-abandoned | 2026-09-11 | func | landing-gate | A shipping unit lands only when every plan recording its `**Branch:**` is complete or carries a recorded `**Abandoned:** <date> — <reason>` header line written by `esq plan abandon`; deleting a plan file is not abandonment, and an abandoned plan's promised rows and live briefs still block | Active |
| D-evidence-settles-backlog-dispositions | 2026-09-11 | arch | workflow | Commands file observations and update or close backlog rows through the CLI when their own evidence justifies the disposition, recording provenance and resolution in the same write; a finding is classified `observed:` at filing time only when it is outside the promised work and neither introduced nor aggravated by the unit — an untouched file or a pre-existing failure alone does not qualify; Done means the promised outcome was delivered and verified; nothing is dropped, re-filed or closed to pass a gate, and `/esq:land` never closes `unit.promised` wholesale | Active — amended 2026-09-21 by D-a-landing-closes-the-delivery-it-can-cite |
| D-a-linked-worktree-reserves-its-block-under-one-lock | 2026-09-11 | arch | ledgers | A linked worktree with no `.esq-id-block` reserves the lowest free block itself, choosing and writing inside one lock in the git common directory; `esq backlog reserve-block` is the one allocator `reserve-id`, `/esq:worktree` and `scripts/worktree.sh` all call, and the main checkout keeps 1-999 | Active |
| D-advance-preserves-units-and-its-branch | 2026-09-11 | arch | roadmap | `/esq:advance` resolves coverage planned on any branch before working, turns one Now entry's still-unplanned items into at most one new plan, never replaces or duplicates an existing plan, returns to its starting branch after every item and plan (stopping rather than forcing), and refreshes the roadmap through its model-invocable bare mode only | Active |
| D-announcements-and-asks-stay-minimal | 2026-09-11 | ux | reporting | An announcement is one line with a real bound, continued in the same response by the first tool call; NEEDS YOU holds only unresolved requests, each executable one with its exact command, and `→ Next` repeats the first; the assurance lane never appears in user-facing output | Active |
| D-the-reread-instrument-is-a-sibling-script | 2026-09-11 | arch | telemetry | The re-read instrument is a fourth `scripts/*.mjs` sibling reading one machine's stores, never an `esq` subcommand and never folded into `measure-wait-cost.mjs` | Active |
| D-a-reread-is-judged-against-the-shipped-rule | 2026-09-11 | func | telemetry | A re-read is counted against the rule that shipped: a path's counter is reset only by a write whose success is established, path history is shared across tools, and every repeated access falls in one of three reported groups — established redundancy, classified legitimate access, unresolved | Active |
| D-the-reread-instrument-prints-paths-for-one-repository | 2026-09-11 | arch | telemetry | Local and foreign runs are separate cohorts, never a pooled rate; a path is published only when the path itself resolves inside this repository, in text and JSON alike | Active |
| D-reread-cohorts-split-on-rule-presence | 2026-09-11 | arch | telemetry | Rule presence is read from the run's own skill-delivery record and is five-valued — missing evidence is `ruleUnknown`, never `ruleAbsent`; a window selects whole runs and never truncates a run's history | Active |
| D-redundancy-is-proven-from-the-delivered-range | 2026-09-11 | func | telemetry | Redundancy is decided by the range a call actually delivered, read from `toolUseResult.file`, never by the shape of the request; unprovable overlap is unresolved, and stdout redirected to a file is not a delivery | Active |
| D-paid-rows-are-durable-before-the-next-one | 2026-09-12 | arch | evidence-capture | A billed row's reduced records are appended through `openCapture` before the next paid row is spawned, so no exit path can lose them; the aggregate stays a separate, earned-only atomic promotion and the interrupt handler writes nothing | Active |
| D-executability-is-read-from-the-skill | 2026-09-13 | arch | orchestration | Whether a chosen `do:` can be run by a subagent is read from the target skill's own frontmatter through `esq apply route`, never from a list written down anywhere else, and an unclassifiable string routes to a stop rather than to a spawn | Active |
| D-a-relayed-decision-is-selected-until-state-confirms-it | 2026-09-13 | arch | orchestration | A decision whose action only the user may invoke is recorded as selected in the brief and relayed verbatim; the itinerary resumes only when the tree shows the action's effect, and the decision is never put to the user twice | Active |
| D-a-phase-buys-each-proof-once | 2026-09-13 | arch | assurance | A phase declares a required `(auto)` command only when no other required command of that phase already buys its tests and its PASS criterion under equivalent conditions; the choice is made at planning time by reading the scripts and the runner config, uncertain inclusion keeps the obligation, and nothing at the gate skips a declared step | Active |
| D-a-manual-pause-records-what-proved-it | 2026-09-13 | arch | build | A pause whose only cause is unobserved `(manual)` steps carries the same `verified` block a completed entry owes, because it is by construction a phase that already judged every `(auto)` step PASS | Active |
| D-one-verb-resolves-both-pause-clauses | 2026-09-13 | arch | build-lifecycle | `esq plan resolve-block` settles both clauses of a `⏸` pause; the manual clause requires one observation per outstanding step and an unnamed step holds the pause | Active |
| D-a-failure-shows-its-failing-test | 2026-09-13 | arch | audit | A bounded run reports the failing test extracted from its capture, with the tail as the fallback | Active |
| D-a-step-declares-what-it-reads | 2026-09-13 | arch | assurance | An `(auto)` verification step may declare the repository paths its command reads, and `esq gate verify` then judges that command's freshness against those paths alone; the declaration is authored, never inferred, and absent, malformed or operand-uncovered it changes nothing | Active |
| D-a-reference-declares-its-call-sites | 2026-09-14 | arch | skills | The conditional half of a skill's prompt is disclosed into `references/`, and the load is guarded at the call site the reference itself declares — an entrypoint keeps the trigger and the decision, `check-refload.sh` reds a load removed, degraded to a pointer or naming an orphan file, and parity's split layout stays a named list of skills | Active |
| D-review-scope-is-one-deterministic-query | 2026-09-14 | arch | landing-gate | `/esq:review` resolves its scope through the read-only `esq review scope <plan>` — pinned `HEAD`, mode, base with its provenance and the changed paths — and carries no procedure for computing any of them; the delta rule is unchanged and every failure answers full scope, never a narrower one | Active |
| D-a-fix-hands-back-to-the-finder-that-found-it | 2026-09-14 | arch | corrective-loop | A `/esq:fix` run that empties a `/esq:review`-originated brief hands the user back to `/esq:review` on the exact plan `esq lane <brief>` already resolved, and never claims the unit is clean, covered or landable; every other source keeps the check-or-ship line | Active |
| D-a-brief-identity-is-validated-never-ranked | 2026-09-14 | arch | corrective-loop | `esq lane <corrective-brief>` resolves the plan by filename and validates it against the brief's own `Source:`, refusing a disagreement or an ambiguous slug by naming what clashed rather than ranking the two sources or taking the first match | Active |
| D-a-conformance-needle-lives-in-both-trees | 2026-09-15 | arch | audit | A conformance needle may only name text the flat legacy mirror carries too, so a split's new plugin-only routing text is pinned by `check-refload.sh` rather than by check 24 | Superseded |
| D-build-asks-the-cli-for-its-plan-context | 2026-09-15 | arch | build | `/esq:build` obtains its plan context from one `esq next-phase <plan> --context` response — the classification plus the plan section, the append anchor, any appendix and the newest/`⏸` log slices, the pause being the one that response itself classifies — and the skeleton grep becomes the CLI-unavailable fallback; the selected spans are unchanged | Active — corrected 2026-09-15, plan-section boundary amended 2026-09-15 by D-the-plan-slice-stops-before-an-entry-heading |
| D-the-plan-slice-stops-before-an-entry-heading | 2026-09-15 | arch | build | The `plan` section of `esq next-phase --context` ends at the `## Execution log` heading plus at most one line, and that line is taken only when it does not open a `### ` heading — the append anchor is carried when present, an entry's heading never is | Active |
| D-replay-built-change-above-plan | 2026-09-16 | infra | review | A change built outside any plan is shipped by cutting a new unit from its base, committing the plan first, and replaying the built commits above it — never by planning on top of them or rewriting them | Active |
| D-resolve-block-selects-through-nextphase | 2026-09-16 | func | pause-resolution | The read-only `esq plan resolve-block` names the pause `nextPhase` selects; a `--confirm` payload keeps naming its own phase | Active |
| D-unclassifiable-do-is-quoted-never-handed-off | 2026-09-16 | func | orchestration | A `do:` settles only the present decision (deferred work in its consequence; keeping what exists verifies and records acceptance against the specific decision); a pick routed `stop` is never handed off as a command — esq proposes a confirmed repair of that same action (a user-only present action stays that command and relays), `converge` keeps append-only history whose last line is the effective state, and verification is scoped to the named decision entry and code state; the router stays unchanged | Active |
| D-a-repair-is-routed-as-the-action-taken | 2026-09-17 | func | orchestration | An approved repair is the action taken: its worker gets the replacement and the repair's `verify:` alone (the original is history), a relayed repair closes on converge's resume only on observed `applied: true` with the orchestrator striking, a failed repair stops the attempt with a replacement only on a user-chosen resume, and every bound adds one apply agent only when the approved action routes `apply` | Active |
| D-instruction-budget-trims-rationale-before-obligations | 2026-09-17 | arch | instruction-budget | When a unit's own wording cannot meet an entrypoint byte bound without cutting an obligation, pre-existing rationale clauses are cut before the bound moves; needles and obligations stay | Active |
| D-failed-verification-commits-nothing | 2026-09-17 | func | corrective-loop | An apply worker commits and strikes only after its change passes verification; a failed one commits, strikes and discards nothing and the orchestrator stops on the dirty tree, for an ordinary option as for a repair | Active |
| D-a-question-needs-a-missing-authority | 2026-09-17 | arch | escalation | A question or 🔴 is authored only when an unrecorded preference or authorization would change product outcome, scope, a major architecture commitment, a stated constraint or an unauthorized consequential cost or risk; failures are diagnosed, never turned into a choice | Active |
| D-every-orchestrator-relays-a-diagnosis | 2026-09-17 | func | escalation | autopilot, advance and converge relay a worker's no-option-set report as its diagnosis and action, never recast as a decision | Active |
| D-a-decision-authorizes-by-its-basis | 2026-09-17 | arch | escalation | A decision authorizes by the basis it names — `**Fondement:** mandate — <citation>` for a delegated technical choice, `user — <citation>` for a change to something stated — never by its author, its Statut, its date or its commit order; absence is context | Active |
| D-a-pinned-clause-covers-its-writer | 2026-09-17 | arch | conformance | A conformance scenario pins the command that *writes* a field as well as the commands that read it, so a template deleted from its writer cannot leave every consumer needle green | Active |
| D-harvest-basis-by-entry-origin | 2026-09-17 | arch | conformance | `/esq:harvest` records `**Fondement:**` by the origin of each entry — an answered interrogation question is a `user —` citation, mined archaeology carries no field — rather than copying the writers' single rule | Active |
| D-a-writer-set-check-closes-the-gap | 2026-09-17 | arch | conformance | A set-scoped conformance clause requires the basis rule of every file carrying a registry entry template, so a writer nobody listed by name cannot ship without it | Active |
| D-a-fix-records-what-it-proved | 2026-09-18 | arch | verification | `/esq:fix` appends an append-only `**Verified:**` provenance block to the plan's execution-log span, resolved and refused by the CLI, rather than a sidecar ledger or an amendment of the build's block | Active |
| D-an-unreachable-rail-is-kept-and-said-so | 2026-09-19 | arch | verification | A guard another rail makes unreachable is kept, documented as unreachable, and tested on the property that is observable | Active |
| D-greenfield-is-a-ui-mode | 2026-09-19 | arch | commands | Greenfield direction-rendering is a `--greenfield` mode on `/esq:ui`, not a 22nd skill, and it refuses to render without a named content source | Active |
| D-the-greenfield-floor-is-mode-scoped | 2026-09-19 | ux | commands | The five-item output floor every direction must pass lives in `## Greenfield mode`, not in Pass 4's shared per-direction bullets, so the redesign path is unchanged | Active |
| D-greenfield-keeps-pasted-copy-as-a-source | 2026-09-19 | prod | commands | Narrowing greenfield's content sources removes `## Task` only; the brief's `## User-facing flow`, `docs/SPEC.md` and pasted copy all remain, and the refusal sentence stays verbatim | Active |
| D-greenfield-gate-reads-values-not-looks | 2026-09-19 | func | commands | Greenfield's five-item gate answers items 2, 3 and 4 with driver reads that return values, not looks at a capture, so the mode's 4-capture budget funds everything it asserts | Active |
| D-a-repair-budget-replaces-the-ceiling | 2026-09-19 | func | build | A build phase spends a budget of three distinct in-plan repairs, never one attempt | Active |
| D-corrective-generations-bounded-at-two | 2026-09-19 | arch | convergence | A corrective chain opens at most two generations; the third is a decision, not a plan | Active |
| D-brief-depth-refuses-a-path-it-cannot-place | 2026-09-19 | arch | convergence | `esq brief depth` refuses a path that is neither a plan nor a brief rather than answering `depth: 0` — the one wrong answer a caller could not tell from a right one | Active |
| D-the-corrective-bound-refuses-before-investigation | 2026-09-19 | arch | convergence | /esq:plan answers `esq brief depth` at the corrective-brief bullet, before investigation is paid for, not beside the branch resolve | Active |
| D-one-shared-block-carries-the-corrective-refusal | 2026-09-19 | arch | convergence | The third-round 🔴 is one marker-delimited `shared:corrective-bound` block across plan, check and review — never three copies | Active |
| D-a-skill-edit-mirrors-in-its-own-task-commit | 2026-09-19 | infra | build | The legacy mirror lands in the commit that changes the skill, even when a later task names the mirroring | Active |
| D-a-brief-is-consumed-by-the-plan-that-carries-its-slug | 2026-09-20 | arch | commands | A brief is consumed by the plan beside it carrying its slug — computed by `esq brief pending`, never recorded by deleting the brief and never guessed from an mtime | Active |
| D-a-rank-is-written-never-recomputed | 2026-09-20 | arch | ledgers | Every open backlog row carries a written `Rank` the model decides and the CLI numbers; no rank is recomputed on read and none is hand-editable | Active |
| D-an-edge-promotes-but-never-overrides-the-user | 2026-09-20 | func | ledgers | An item that unblocks another inherits at least its priority level — raising a suggested priority, reporting a confirmed one rather than overwriting it | Active |
| D-adoption-gates-the-rule-not-the-header | 2026-09-20 | arch | ledgers | A ledger is held to a new invariant once it has *adopted* the feature, not once its table carries the column — the column arrives on the first ordinary write | Active |
| D-the-roadmap-is-read-beside-the-ledger | 2026-09-20 | arch | ledgers | A ledger verb resolves a sibling ledger by the path of the file it was handed, never from a repository root or a git call | Active |
| D-a-rank-verb-refuses-what-it-cannot-make-total | 2026-09-20 | func | ledgers | `esq backlog rank` refuses any input it cannot turn into one total order over every open row, and renumbers rather than refusing a placement whose gap is exhausted | Active |
| D-a-blank-priority-is-no-longer-a-reachable-state | 2026-09-20 | func | ledgers | Every open backlog row carries a priority and a position, so `/esq:backlog` stops offering ways to leave either blank — `pri:none` is refused and the unranked tail is named on every list | Active |
| D-a-contradiction-is-reported-where-it-is-computed | 2026-09-20 | arch | ledgers | A roadmap/priority contradiction is surfaced by the write that computed it, never re-derived by the read-only list | Active |
| D-an-order-edit-reports-staleness-never-re-ranks | 2026-09-20 | func | ledgers | `/esq:roadmap` Mode C changes the order and writes no `Rank`: it names the staleness and the command that clears it, rather than writing a sequence the user did not ask for | Superseded |
| D-a-roadmap-move-re-places-what-it-moved | 2026-09-20 | func | ledgers | A `/esq:roadmap` Mode C instruction that changes an entry’s position re-places exactly the ids that entry covers, through `esq backlog rank --before/--after`; an edge, drop, covers or reason edit still writes no cell | Active |
| D-the-admission-test-admits-entries-never-positions | 2026-09-20 | prod | ledgers | The roadmap's `why now` test governs which items earn a written entry; every open item earns a position regardless, and the two obligations are written as two | Active |
| D-the-observation-path-not-the-instrument | 2026-09-18 | arch | verification | A `(manual)` step is declared only once its four-link observation path — access, state and what creates it, action, observation — names the existing resource supplying each link; naming an instrument is not a path | Active |
| D-the-guard-is-a-conformance-clause | 2026-09-18 | arch | conformance | The observation-path rule is mechanized by `need`/`refuse` clauses in the existing conformance check, which already runs over both trees, rather than by a new `check-*.sh` | Active |
| D-readme-prose-is-part-of-the-clause-edit | 2026-09-18 | arch | conformance | Narrative documentation of a routing rule is corrected in the commit that replaces the rule, not deferred to a backlog row — a stale sentence asserts an exemption the skills no longer hold | Active |
| D-the-result-ask-survives-the-engineering-close | 2026-09-18 | arch | verification | The `(manual)` ask to the user is closed to engineering questions and kept open for the *result*, reached only once the uncovered link has been settled inside the phase mandate; the pause is keyed on the uncovered observation, never on an absent instrument | Active |
| D-the-pause-is-keyed-on-the-uncovered-observation | 2026-09-20 | arch | verification | The `(manual)` pause is authorized and classified on a link the observation needs being uncovered, closing it having exceeded the phase mandate or failed inside its bound, and neither the run nor the user having observed the result — and a pause so keyed carries a cause and an action, so a resume reads its diagnosis instead of re-deriving it | Active |
| D-a-measurement-base-outrun-by-main-moves | 2026-09-21 | arch | verification | A fixed-base assertion that main's own commits have outrun is re-based to `main`, the reference the shipping unit lands on, with the outrunning commits and the authorization named in the open — never re-pinned to the merge-base and never deleted | Active |
| D-a-landing-closes-the-delivery-it-can-cite | 2026-09-21 | arch | landing-gate | `/esq:land` closes a `unit.promised` row whose whole promised outcome a citable commit or execution-log line delivers, through `esq backlog set-status … done --by … --resolution …` in one bookkeeping commit, then re-reads the branch verdict; completeness, split evidence and every `unit.open` row remain stops, and the reserved `/esq:backlog` skill is never invoked | Active |
| D-a-standard-arbitrates-a-stated-constraint | 2026-09-21 | prod | ask-threshold | A stated constraint whose class the standards referent covers, inside the threshold that class names, is arbitrated and decided with the standard cited as its basis, instead of reaching the user as a 🔴 — a class the referent does not cover, a departure past its threshold, a security or privacy constraint at any magnitude, and a `(hard)`-marked `## Done looks like` bullet all still ask | Active |
| D-the-referent-ships-in-the-plugin-and-the-cli-resolves-it | 2026-09-21 | arch | ask-threshold | The default standards referent ships at `plugin/standards/STANDARDS.md` and is resolved by `esq standards`, which returns the project's `docs/STANDARDS.md` over it; a `references/` file under one skill cannot be addressed by the other carriers, because `CLAUDE_SKILL_DIR` names only the running skill's own directory | Active |
| D-the-consult-rides-both-ask-block-families | 2026-09-21 | arch | ask-threshold | The consult clause is appended byte-identically to the `ask-altitude` block and to the `decision-block`, the two families U-15 already holds to one threshold, rather than moving `ask-altitude` into four commands that would then carry five of its sentences twice | Active |
| D-an-unresolved-referent-keeps-the-ask | 2026-09-21 | arch | ask-threshold | A run whose `esq standards` cannot resolve reads the unreachable verb as silence — the constraint stays the user's, the ask stands, and the ask names the unreadable standard — rather than arbitrating against the project `docs/STANDARDS.md` alone, whose thresholds live in the unaddressable plugin default | Active |
| D-an-unresolved-referent-is-unresolved-however | 2026-09-21 | arch | ask-threshold | The consult clause states the condition — a referent that does not resolve — and names its two causes behind it (`esq` unavailable on the legacy path, `esq standards` exiting non-zero), rather than shipping one cause as the condition or splitting the two over a ninth sentence | Active |
| D-the-audit-reads-the-shipped-tree | 2026-09-22 | arch | audit | The guard suite resolves its corpus from `plugin/skills/` directly — each structural check repointed at the nested tree, proved equivalent against the byte-parity mirror before it is deleted — rather than flattening the tree into a temp view or deleting the mirror first | Active |
| D-corpus-root-is-bound-once | 2026-09-22 | arch | audit | The audit binds one corpus root through `skill_corpus_init` and its four accessors read it, rather than each accessor taking a root argument | Active |
| D-a-mirror-check-names-the-mirror | 2026-09-22 | arch | audit | A check whose subject is the legacy mirror names `commands/esq` literally and never follows `ESQ_AUDIT_CORPUS`, so the corpus switch moves only the checks whose subject is the skill corpus | Superseded |
| D-the-printed-region-is-the-skill-minus-its-artifacts | 2026-09-22 | arch | audit | Check 18's conclusion region becomes the marker-carrying file from its marker onward plus every reference file in full, excluding only the entrypoint's text above the marker, rather than a marker-to-end-of-document scope the nested tree cannot reproduce | Active |
| D-a-shared-block-finding-names-the-command | 2026-09-22 | arch | audit | `check-sharedblocks.sh` names the command a drifted or unregistered block belongs to, never the file carrying it, so one expected finding string drives its fault injection against either corpus shape | Active |
| D-a-retired-path-is-held-by-a-check | 2026-09-22 | arch | audit | A path retired from the repository is held retired by an audit check with its own fault injection, never by a one-shot grep in a plan's verification step | Active |
| D-a-retirement-record-names-the-thing-not-the-path | 2026-09-22 | arch | audit | After a path is deleted, the repository spells it only where a reader must act on it — the installed `~/.claude/commands/esq/` directory — and every other mention names the thing that retired | Active |
| D-a-path-guard-reads-the-path-not-only-the-content | 2026-09-22 | arch | audit | A guard holding a deleted path deleted judges each file's own path as well as its content — a reintroduced directory carries the banned literal in neither its lines nor its prose | Active |
| D-a-prose-sweep-corrects-what-its-grep-cannot-see | 2026-09-22 | arch | verification | A prose sweep is completed against the property its step describes, not against the set of matches its command returns — an occurrence the check cannot observe is corrected, and the gap is recorded | Active |
| D-an-auto-step-names-the-tool-it-means | 2026-09-22 | arch | verification | An `(auto)` step's verdict must not depend on which implementation of an ambient tool the shell resolves — the rule is stated as a class, with the ugrep/GNU case as its worked example, not as a fact about `grep` | Active |
| D-a-two-tree-claim-in-a-check-label-is-the-phase-s | 2026-09-22 | arch | audit | A stale claim a phase's own verification surfaces in code this unit wrote is corrected in that phase and the proof re-bought, never filed as a row | Active |
---

## D-an-auto-step-names-the-tool-it-means — An `(auto)` step's verdict must not depend on which ambient tool the shell resolves

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — Task 3.1 of `docs/plans/2026-09-22-retire-legacy-rollback-path-fixes.md`, which asks for the rule to be added to `/esq:plan`'s Verification discipline beside the referent-resolution rule it extends

**Contexte:** The stem plan's third `(auto)` step filtered a recursive search by `^./` — an anchor GNU grep prints and the ugrep shim behind Claude Code's Bash tool does not — so the same command excluded an archive in a script and nothing at all where `/esq:build` actually runs it, returning 102 matches against 1150. The defect hid a failed verification for a whole phase. Task 3.1 asks for the rule; how wide to state it was open.
**Décision:** The clause bans the class — an `(auto)` step whose verdict depends on which implementation of an ambient tool the shell resolves — prescribes explicit path operands over a search root plus a path-prefix filter, and names three further instances (a line-based match blind to a claim wrapped across a line break, locale-dependent `sort`, GNU versus BSD `date`) with the ugrep case as its worked example.
**Raison:** Phase 2 of this same plan supplied the second instance before the rule was written: its own `(auto)` grep passed green over three two-tree claims it could not see, because they wrapped across a line break. A rule stated as a fact about `grep`'s `./` prefix would have been satisfied by that step and is one tool away from being re-learned; a rule stated as a class covers the next instance nobody has met yet. The needle checks 45/46 hold is the general sentence, so the guard binds the class rather than the example.
**Tradeoff:** Gained: the rule covers instances the observed defect did not exhibit, and the check binds the sentence that generalizes. Accepted: a longer bullet in an entrypoint now at 494 of a 500-line cap, and a clause a planner can satisfy lexically without obeying — the same lexical ceiling every needle in check 45 has.
**Conséquences:** The next clause `plugin/skills/plan/SKILL.md` earns does not fit as prose in place and takes the reference-file route check 59 governs. A planner writing a step that shells out now owes the operand shape as well as the referent resolution.
**Alternatives rejetées:** Stating the rule as the `./`-prefix fact alone — it is the plan's literal wording and the cheapest bullet, but Phase 2's line-break case, already recorded in this same plan's log, would pass it. Adding a mechanical check that reads authored plans for the shape — `check-auto-referent.sh` deliberately does not read `docs/plans/`, for the recorded reason that rewriting a landed plan falsifies history.

## D-a-two-tree-claim-in-a-check-label-is-the-phase-s — A stale claim the phase's own verification surfaces is the phase's to correct

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — `/esq:build` § A defect against this unit is not a backlog candidate: an ordinary omission in code this unit wrote is corrected in the task's own commit, never filed

**Contexte:** Phase 3's `(auto)` suite printed check 46's own label — "fires on either half removed", "when removed from either tree" — a live present-tense claim that the guard runs against two corpora, false since the mirror's retirement earlier in this same unit and stale a second way once the rule gained a third clause. Phase 2 swept `scripts/audit.sh` for exactly this and missed it; the suite had already passed at that point.
**Décision:** Corrected in this phase (bc1db0d) and the whole suite re-run, so the entry's `verified` block names the commit that carries the fix.
**Raison:** It is an omission in this unit's own code, which the rule sends to a commit rather than to a row — and the row would have blocked this phase's `completed` entry in any case. Re-running was not optional once the file changed: a `verified` block naming a commit the fix is not in records a proof of a tree nobody has.
**Tradeoff:** Gained: an honest proof and one fewer false claim in the audit's own output. Accepted: a second three-minute suite run, paid because the first one's tree no longer exists.
**Conséquences:** A phase whose own verification output surfaces a stale claim in this unit's code fixes it and re-buys the proof, rather than logging the finding for a later pass. The cost is bounded by how late in the phase it surfaces.
**Alternatives rejetées:** Filing it as a backlog row — forbidden for a defect against the unit, and it would have blocked this entry. Committing the fix and recording the earlier run's commit as `verified.at` — cheaper by three minutes and dishonest by exactly the fix.

## D-a-brief-identity-is-validated-never-ranked — A brief's plan identity is validated, never ranked

**Scope:** arch
**Topic:** corrective-loop
**Date:** 2026-09-14
**Statut:** Active

**Contexte:** `/esq:fix` began routing a resolved review brief to `/esq:review <plan>` on the path `esq lane <brief>` returns. That resolver derived its slug from the brief's filename alone, never read the brief's `Source:`, and selected the first sorted match — so a brief named for `alpha` whose `Source:` says `beta` resolved to `alpha`, and two plans normalizing to one slug resolved to whichever sorted first. The route depended on an identity guarantee the resolver did not make.
**Décision:** `planForBrief` reads the brief once, parses its `Source:` with the existing strict `REVIEW_BRIEF_SOURCE`, collects every filename match, and refuses — naming both slugs, or every candidate — when the two disagree or when more than one plan matches.
**Raison:** The validation belongs at the boundary every caller already crosses, once, rather than as a comparison a model repeats on each run and no check can prove. Refusing rather than ranking is the substance: which of the filename and the `Source:` carries the mistake is not knowable here, and either preference converts a visible clash into a silent wrong answer. A brief with no parseable `Source:` keeps resolving by filename, so nothing already written changes.
**Tradeoff:** Gained: a hand-off that can no longer name a plan the brief does not identify. Accepted: `esq lane <brief>` gains two grounds on which it exits non-zero, a contract change its one caller's prose must carry.
**Conséquences:** Any later consumer of `esq lane` on a brief inherits the refusal and must treat it as a reportable resolution problem, never as a reason to guess a path. The principle already stated for `unit.findings` — a live brief belongs to a unit through its `Source:`, not its filename — is now enforced rather than only documented.
**Alternatives rejetées:** Comparing `Source:` against the returned path in the skill prose — that is exactly the arrangement that failed, since prose trusting a resolver is not a guarantee and no check can observe it. Resolving from `Source:` with a filename fallback — it silently decides `Source:` wins a disagreement, which resolves the observed case to `beta` with no sign anything was wrong.

## D-a-fix-hands-back-to-the-finder-that-found-it — A fix hands a resolved brief back to the finder that wrote it

**Scope:** arch
**Topic:** corrective-loop
**Date:** 2026-09-14
**Statut:** Active

**Contexte:** `/esq:fix`'s `→ Next` sent every emptied brief to the same place — "re-run `/esq:check` to confirm, or ship." On a brief written by `/esq:review` that is the wrong destination twice over: `/esq:check` reconciles the plan against the implementation and records no review coverage, and "ship" walks into `/esq:land`'s refusal on unproven coverage. Only `/esq:review` records coverage, through `esq plan set-reviewed` after a clean verdict.
**Décision:** When a `/esq:fix` run resolves every finding in a brief whose `Source:` names `/esq:review`, its `→ Next` is `/clear` then `/esq:review <the plan `esq lane <brief>` already resolved>` — and it says the listed fixes are resolved, never that the unit is clean, covered or ready to land.
**Raison:** The finder that wrote the brief is the one whose verdict the fixes invalidated, so it is the one that has to be re-run; and the plan it must be re-run on is already in the run's hands, because `esq lane <brief>` resolves a corrective brief to the plan it corrects. Routing off the brief's own `Source:` costs no new resolver, no new CLI verb and no extra tool call. A `/esq:check` brief keeps its existing destination because a check's verdict is what a check re-establishes.
**Tradeoff:** Gained: the user's next command after a review fix is the one that actually restores the coverage they invalidated, with no guessing at the plan path. Accepted: one more branch in the `→ Next` ladder, and two facts — the `Source:` line and the resolved plan path — that the run must carry past the point where it deletes the brief.
**Conséquences:** A fix still records no review coverage for itself, and nothing about the brief's deletion, the atomic verified commits, the 🔴/🟡 precedence or the unattended `/esq:converge` itinerary moves. A brief whose source or plan cannot be resolved reports that and hands back no path — there is no fallback resolver, by design.
**Alternatives rejetées:** Re-reading the brief's `Source:` when composing the report — the brief has just been deleted on exactly this route, and `shared:read-once` forbids the re-read anyway. A new `esq` verb answering "what follows this brief" — a routing framework for one branch of one command, and judgment the CLI is not allowed to own.

## D-the-audit-reads-the-shipped-tree — The audit reads the shipped tree, not a copy of it

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** user — this session, 2026-09-22: the maintainer read the `commands/esq/` clause in `CLAUDE.md`, asked what it was costing, rejected keeping the mirror as generated build output, and directed that the path be retired.

**Contexte:** `commands/esq/` was kept as a byte-parity rollback copy under `D-plugin-primary-legacy-rollback`, and became the corpus the audit actually reads: 21 of 60 checks resolve `commands/esq` and nothing else, against 3 that read `plugin/skills` alone. The tree users run is certified by transitivity through check 27, whose parity rule is one-directional for the two split skills, so a contract living only under `plugin/` is invisible to the gate — the mechanism that already shipped B-062 and B-083.
**Décision:** Each of the 21 checks is repointed at the nested `plugin/skills/` tree through a shared corpus helper, and the conversion is proved by diffing the audit's output across both corpora while the mirror is still byte-parity — after which the mirror, its installer and its three supporting checks are deleted.
**Raison:** Two cheaper options were on the table and both keep a flattening step. Deleting first and repointing after leaves 21 checks passing green over an absent corpus, which is the one verdict a guard suite must never produce. Flattening the tree into a per-run temp view keeps the diff small but reintroduces the derived artifact the work exists to remove, and degrades every finding message to a line number in a concatenation that exists nowhere on disk.
**Tradeoff:** Gained: the guard suite reads the product, so a rule added to any reference file is inside its reach for the first time, and four backlog rows that were artifacts of the mirror close. Accepted: ~21 mechanical check conversions instead of ~4, one phase that runs the audit twice per verification, and the loss of a per-command rollback install — which the legacy frontmatter could not have restored faithfully anyway, carrying no `model:` pin and no `disable-model-invocation`.
**Conséquences:** The check numbers 10, 20 and 27 are retired and their numbers left as gaps: 381 citations of check numbers exist across the prose and the plan archive, so renumbering to close three gaps would invalidate all of them. `check-plugin.sh`'s 500-line entrypoint cap survives untouched and applies to `*/SKILL.md` alone, so deleting the parity rule restores splitting into `references/` as the remedy for it rather than raising it. A conformance needle may from now on name text that exists only under `plugin/`.
**Alternatives rejetées:** Flatten into a temp view at audit time (keeps the derived artifact, and gives findings line numbers into a file that does not exist). Delete the mirror first and repoint afterwards (21 checks green over nothing, which `audit-scripts` already forbids by its exit-2 contract). Keep the mirror as generated build output (the maintainer rejected it: it preserves the machinery whose removal is the point, and the mirror cannot express the frontmatter the product depends on).

## D-plugin-primary-legacy-rollback — Plugin primary, legacy rollback temporary

**Scope:** arch
**Topic:** distribution
**Date:** 2026-08-17
**Statut:** Superseded by [D-the-audit-reads-the-shipped-tree] on 2026-09-22 — its own exit condition was met and measured: `scripts/check-conformance.sh plugin/skills` is clean at 41 scenarios, the CLI and hook suites pass as audit checks 30/31, and the plugin is the installed product. So `commands/esq/`, `install.sh`, `uninstall.sh` and `.esquisse-manifest` are deleted, and there is no per-command rollback path any more: git for this repository, `claude plugin` for the installed package. Kept rather than deleted, because the **Précision** below is still live — a set installed before that date still shadows the plugin, and nothing here removes it.

**Contexte:** Claude Code now distributes namespaced native skills, agents, hooks and
executables as plugins. The legacy installer is machine-wide and unsafe during a branch
rename, but it is the proven rollback path until every later component passes the Phase 0
behavior contract.
**Décision:** `plugin/` is the canonical distributed package and the repository is its
marketplace. Keep `commands/esq/`, `install.sh` and `.esquisse-manifest` temporarily,
parity-checked and exercised only in a sandbox from worktrees. Remove them only after the
plugin, CLI and hooks all pass conformance.
**Raison:** This makes the native path installable now without exchanging a reversible
migration for a flag day.
**Alternatives rejetées:** Delete the installer during skill migration (no proven rollback);
keep legacy commands as the permanent source (the plugin remains a generated afterthought).
**Précision (2026-08-18, validation runtime):** an installed `~/.claude/commands/esq/` set
**shadows** the plugin's skills — proven byte-for-byte during live testing
(`docs/plans/2026-08-18-plugin-runtime-validation.md`). Coexistence therefore leaves the
plugin inert: the cutover ran `uninstall.sh`, and rollback means *reinstalling* the legacy
set from `main` (`./scripts/install.sh`), never keeping both installed. Running `install.sh`
after cutover silently re-shadows the plugin — that is the rollback lever, not a routine step.

## D-context-fork-only-after-proof — Context fork only after proof

**Scope:** arch
**Topic:** skills
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** A forked skill receives its instructions in an isolated subagent and does not
inherit conversation history. That is useful for context hygiene but can silently drop the
user intent or gate answer that mutating workflows depend on.
**Décision:** Keep every skill inline. Add `context: fork` only after a controlled runtime
scenario proves its inputs, authority gates and resume semantics survive isolation. The
candidate `/esq:status` test was not run against this repository because doing so would
transmit repository-derived data to an external service; schema validation alone is not
behavioral proof.
**Raison:** Isolation is a per-command behavior choice, not a blanket optimization.
**Alternatives rejetées:** Fork all long commands (loses conversation state without proof);
declare the read-only status pilot proven from schema validation alone (tests syntax, not
whether the resulting subagent preserves behavior).

## D-cli-owns-structure-model-owns-judgment — CLI structure, model judgment

**Scope:** arch
**Topic:** cli
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** The command corpus repeatedly parses Markdown tables and execution logs,
allocates IDs, updates cells, and checks git/ledger invariants. Those operations have exact
answers but prose execution made them probabilistic.
**Décision:** Ship a dependency-free `esq` executable in the plugin. It exclusively owns
the structured operations named in S-09–S-14 and returns JSON. Skills still own every hard
judgment: architecture, decomposition, materiality, severity, risk, verification and UX.
The legacy prose remains only as a temporary fallback when the plugin CLI is absent.
**Raison:** Deterministic state changes become testable and atomic without turning product
or engineering judgment into brittle code.
**Alternatives rejetées:** A CLI that also selects approaches or severity (encodes judgment
without context); keeping table and log mutation in prompts (unnecessarily probabilistic).

## D-codex-port-paused-for-claude-base — Codex port waits for Claude-native stability

**Scope:** prod
**Topic:** harness-port
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** B-006 targets the old prompt-heavy command architecture. Porting it now would
duplicate migration work while plugin skills, the deterministic CLI and hooks are changing
the extension boundary.
**Décision:** Keep B-006 planned but paused until the Claude-native architecture is stable.
**Raison:** The later port can target a smaller, explicit plugin/CLI contract instead of
translating transient prompt machinery.
**Alternatives rejetées:** Port in parallel (duplicates the churn and weakens parity proof);
drop B-006 (the cross-harness need remains valid).

## D-semantic-notifications-stay-in-skills — Semantic notifications stay in skills

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** A Claude `Notification` hook observes notifications that Claude Code already
emitted; it does not create the workflow-specific message. A generic `Stop` hook sees the
last response but cannot reliably distinguish an esq success, authority gate, ordinary
answer, or user interruption. The long-running skills already emit precise
`PushNotification` messages at completion, pause, failure and before an unattended gate.
**Décision:** Keep semantic end/block notifications in the skills and reject S-16 as a
plugin hook. Preserve those clauses through the behavioral conformance suite.
**Raison:** The producing skill knows the phase, counts, next action and gate; a Stop hook
would reconstruct that semantics from prose and notify on unrelated turns.
**Alternatives rejetées:** A generic Stop notification (false positives and weaker text); a
platform notification command (not portable, and duplicates Claude Code notification UX).

## D-audit-at-boundaries-not-after-edits — Audit boundaries, not edits

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** One coherent skill change commonly takes several Edit/Write calls. A
`PostToolUse` hook would run the whole repository audit after every intermediate state,
including states where the native skill and legacy mirror intentionally differ for seconds.
Running it asynchronously adds overlapping audits whose result arrives after later edits.
**Décision:** Reject S-18. Keep the full audit as a pre-commit boundary and use the bounded
`esq validate` Stop hook for structured state.
**Raison:** One audit per coherent boundary gives stronger evidence at a fraction of the
cost and avoids reporting transient parity failures as defects.
**Alternatives rejetées:** Synchronous audit after each edit (repeated cost and noisy
transient failures); asynchronous audit (races the file state it claims to validate).

## D-hook-telemetry-stops-at-observable-usage — Telemetry stops at observable usage

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-17
**Statut:** Active — amended 2026-08-19 by [D-direct-session-telemetry-stop-cursor]: reading the *main-session* transcript for numbers, model ids, timestamps, tool-use counts and the fixed-pattern `esq:<cmd>` slug is inside the contract, on the same floor as `D-subagent-stop-telemetry-from-transcript`; still never a prompt, description, tool input, reasoning or response, and no monetary figure.

**Contexte:** A `PostToolUse` hook on a completed foreground Agent receives wall-clock
duration, tool count, resolved models, final-request tokens and usage. It receives no exact
monetary charge, and background launches carry no usage fields.
**Décision:** Store only those bounded fields as JSONL under `CLAUDE_PLUGIN_DATA`; never
store prompts or agent output. Treat tokens/model as cost inputs, not a fabricated currency
total, and leave background runs unrecorded rather than writing misleading zeroes.
**Raison:** The record is useful for the repo's cost pass and stays truthful about the
official event contract.
**Alternatives rejetées:** Parse private transcripts (unstable and captures content) —
transcript-parsing rejection superseded by `D-subagent-stop-telemetry-from-transcript`
(2026-08-18); calculate currency from a hard-coded price table (goes stale and misprices
subscription use).

## D-native-agents-cannot-compose-guarded-skills — Native agents cannot compose guarded skills

**Scope:** arch
**Topic:** agents
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** The orchestrators delegate to mutating `/esq:build`, `/esq:work`,
`/esq:plan`, `/esq:check`, `/esq:review` and `/esq:fix` skills. S-04 deliberately sets
`disable-model-invocation: true` on every one. Claude Code's current agent contract cannot
preload a skill with that guard; plugin-agent `permissionMode` is also ignored. The attempted
`context: fork` pilot remains unproven under D-context-fork-only-after-proof.
**Décision:** Reject S-21 and S-22 for this architecture. Keep the existing explicit Agent
prompts and bounds until Claude can compose manual-only skills without weakening their guard,
or a controlled fork test proves a safe replacement. Do not copy whole skill bodies into
agent files.
**Raison:** Duplicating procedures recreates the drift being removed; dropping the guard
lets the model invoke mutating workflows without the user.
**Alternatives rejetées:** Remove `disable-model-invocation` from worker skills (regresses
S-04); duplicate their bodies in configured agents (two authorities); declare schema-valid
agent frontmatter behavioral proof (does not exercise invocation, authority, or resume).

## D-orchestrated-skills-guard-in-body — Trio-invoked skills trade the frontmatter guard for an in-body refusal

**Scope:** arch
**Topic:** skills
**Date:** 2026-08-18
**Statut:** Active — amended 2026-09-11 by [D-advance-preserves-units-and-its-branch]: `roadmap` joins the model-invocable set, for `/esq:advance`'s bare refresh only, behind the same in-body refusal — seven skills now.

**Contexte:** The first production `/esq:autopilot` run after cutover proved the assumption
in D-native-agents-cannot-compose-guarded-skills wrong one level down: `disable-model-invocation:
true` blocks not only preloading but **every** Skill-tool call, including a subagent explicitly
delegated by a user-invoked orchestrator ("Skill esq:build cannot be used with Skill tool").
Verified against the official docs 2026-08-18: no mechanism distinguishes explicit model
invocation from implicit description-matched firing — the flag is all-or-nothing.
**Décision:** The six skills the trio's subagents invoke (`build`, `check`, `review`, `fix`,
`work`, `plan`) drop the flag and carry the shared **"No mandate, no run."** in-body refusal:
model invocation is legitimate only when a user-invoked orchestrator delegated the run with
its target in the invoking turn; anything else stops and prints the invocation. The other
fourteen skills keep `disable-model-invocation: true`. `check-plugin.sh` enforces both sides
and `test-plugin-guards.sh` proves each refusal fires.
**Raison:** With no explicit-only flag in the harness, the only alternatives were a broken
unattended trio (option A forever) or protection in prose — the same two-guard split the
harness-port plan reached for its arg-guard: config stops what it can, the artifact stops
the rest.
**Alternatives rejetées:** Keep the flag and run all phases attended (loses the trio, the
architecture the plugin exists to serve); re-delegate after stripping the flag at runtime
(a session mutating its own installed skills); duplicate the six bodies into agent files
(two authorities — already rejected by D-native-agents-cannot-compose-guarded-skills).

## D-001 — Phase grouping by file for DX improvements plan

**Scope:** arch
**Topic:** esquisse
**Date:** 2026-06-19
**Statut:** Active

**Contexte:** Four DX improvements needed phasing: new status skill, build sync prompt, richer decisions format (2 files), and plan audit step. Three grouping strategies were viable.
**Décision:** Group phases by file touched — Phase 1 creates status.md, Phase 2 edits build.md, Phase 3 edits plan.md.
**Raison:** File-grouping keeps each session's context focused on one file, making verification simple and blast radius small. The decisions format change spans Phase 2 and 3 by design — Phase 3 mirrors Phase 2 — rather than landing as a single multi-file change.
**Alternatives rejetées:** Single-phase monolith (high blast radius, hard to roll back); one improvement per phase (4 sessions for changes that are naturally file-coupled).

## D-002 — Task backlog in docs/BACKLOG.md; DEFERRED.md folded in

**Scope:** arch
**Topic:** esquisse
**Date:** 2026-07-07
**Statut:** Active

**Contexte:** esquisse needed a durable, in-repo task backlog for bugs/improvements/todos/ideas — captured both by a low-friction user command and by esq itself while working. A narrow `docs/DEFERRED.md` already existed for `/esq:fix` escalations, creating two overlapping ledgers of "work not done yet."
**Décision:** One `docs/BACKLOG.md` registry (schema: ID/Date/Type/Pri/Summary/Source/Status) owned by a new arg-driven `/esq:backlog` skill. DEFERRED.md is retired and its role folded in: 🟡 needs-plan → `⚠️ debt`/`Open`, 🔴 needs-decision → `Needs-decision`. build/review/check auto-propose out-of-scope findings into it; plan marks picked-up items `Planned`; status and sync read it.
**Raison:** A single capture bin removes the DEFERRED-vs-backlog ambiguity and gives every skill one place to route "noticed but not now." Type/Status columns absorb the old scope semantics without a second file. Arg-driven single skill keeps manual capture frictionless (`/esq:backlog <text>`) while bare invocation triages.
**Tradeoff:** Gained one coherent ledger and a capture path from every skill; accepted a one-time migration cost for existing projects that still have a populated `DEFERRED.md` (must be moved into BACKLOG.md by hand).
**Conséquences:** New skills/registries should route deferred or out-of-scope work to BACKLOG.md, never reintroduce a parallel ledger. `Needs-decision` is reserved for fix-escalations; user/build captures are always `Open`.
**Alternatives rejetées:** Keep DEFERRED.md separate (two ledgers, ongoing ambiguity about where an item belongs); capture-only command with no triage view (loses the "where's my backlog?" answer that status/sync now lean on).

## D-003 — Backlog→Google Sheet is a one-way, CSV-first mirror (not Trello sync)

**Scope:** arch
**Topic:** backlog
**Date:** 2026-07-08
**Statut:** Active

**Contexte:** The technical backlog lives in `docs/BACKLOG.md`, invisible to a non-technical partner who works in Google Sheets and runs UA after deploys. Trello integration was explored but Trello already covers the *business* backlog; esquisse's is the *technical* one.
**Décision:** `/esq:backlog publish` renders the backlog one-way to a `docs/BACKLOG.csv` (always) and to a Google Sheet (best-effort, when a connector is present). `BACKLOG.md` stays the single source of truth; the Sheet is a reflection, refreshed on demand. Partner comments flow back only in a later, gated Phase 2.
**Raison:** The partner needs to *see* the backlog, not co-edit it, so a one-way mirror is proportionate. Making the CSV the reliable spine keeps the feature shippable and verifiable regardless of which Google connector the user has, with the connector write riding on top. Full two-way sync (Trello or Sheets) is fragile in a prompt runtime and disproportionate to the need.
**Tradeoff:** Gained a zero-dependency, testable publish path and partner visibility; accepted "publish on demand" (the Sheet is only as fresh as the last publish) rather than real-time sync.
**Conséquences:** The comment round-trip (Phase 2) is gated on a connector that can read a range and write cells — validate via `/mcp` before building. Future backlog-sharing work extends the one-way mirror, not a bidirectional sync.
**Alternatives rejetées:** Trello sync (Trello already owns the business backlog; full field/ID/status mapping disproportionate); connector-only push with no CSV (hard-couples to an unverified cell-write capability); full two-way sync (fragile, disproportionate — partner only needs to view plus later comment).

## D-004 — ID reservations live in an untracked per-worktree marker file, never in a branch

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-08-09
**Statut:** Active

**Contexte:** Making `B-NNN` collision-free at allocation requires each worktree to hold a disjoint numeric block, which requires the reservation to be recorded somewhere both the creating session (in main) and the consuming session (inside the worktree) can read.
**Décision:** The reservation is an untracked `.esq-id-block` file at each worktree's root, excluded via `.git/info/exclude`; blocks are discovered by enumerating `git worktree list --porcelain`, and no marker means block `1-999`.
**Raison:** Coordination state placed inside a versioned ledger merges back into `main`, where it is meaningless and adds a conflict surface to the very file the scheme exists to protect. A disk-local marker never enters a commit, so it cannot merge, conflict, or go stale; it is released automatically when the worktree directory is removed; and the absent-marker default makes every project that never creates a worktree behave exactly as it does today, with zero migration.
**Tradeoff:** Gained a reservation that cannot pollute or conflict with any branch, and a strict no-op for single-tree projects; accepted a new untracked file and a repo-wide `.git/info/exclude` append — the first mutation an esq command makes outside the working tree.
**Conséquences:** Allocation becomes block-scoped (`max` within your block, `+1`), which is what keeps `main` clear of live blocks permanently even after a worktree's higher-numbered items merge in. Both worktree-creation paths (`worktree.md` and `scripts/worktree.sh`) must write the marker identically, since `audit.sh` cannot compare prose to bash.
**Alternatives rejetées:** Committing the marker into the worktree branch's `BACKLOG.md` header (travels with the branch, but merges into `main` as meaningless state and adds conflict surface to the most conflict-prone file); deriving the block from a hash of the branch name (needs no coordination at all, but is probabilistic where the requirement is absolute, and yields unpredictable non-sequential ranges).

## D-narrow-check-not-canonical-wording — A verification check narrows to its intent rather than diverging a replicated invariant

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-09
**Statut:** Active

**Contexte:** Phase 4's verification demanded `grep -i 'renumber' README.md` return 0, to prove merge no longer renumbers. Phase 1 had since put the canonical invariant sentence ("an ID is a permanent citation key: never renumbered, never reused") into the README, so the check could not pass while the README stated the rule correctly.
**Décision:** Narrow the check to what it actually meant — no remaining claim that *merge* renumbers — rather than reword the README's copy of the invariant to dodge the grep.
**Raison:** That sentence is replicated verbatim in twelve places, five of which `audit.sh` check 10 keeps byte-identical. Rewording one copy to satisfy a file-wide grep would have bought a green check by making the project state its own rule two different ways. A check that forces the artifact to get worse is measuring the wrong thing; the artifact was right and the check was over-broad.
**Tradeoff:** Gained a verification step that tests the behavior it names and a single canonical wording across the set; accepted a check that is more specific and so would not catch a *new* renumbering claim phrased in wording it does not anticipate.
**Conséquences:** When a grep-based check collides with replicated canonical wording, the wording wins and the check is narrowed — and the amendment is recorded inline in the plan, as `781592e` did, so the loosened check is not mistaken for an oversight. It also argues for extending `audit.sh`'s byte-identity guard beyond the five `id-allocation` copies to the invariant's other carriers.
**Alternatives rejetées:** Rewording the README's invariant line to avoid the word (diverges the canonical sentence from nine command-file copies, for a check's convenience); dropping the check entirely (loses the only mechanical proof that the renumbering claims are gone); excluding the README from the grep wholesale (would also stop catching a genuine renumbering claim anywhere else in the file).

## D-merge-base-decides-shared-row — The merge base decides whether a repeated ID is one item or two

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-08-10
**Statut:** Active

**Contexte:** `/esq:worktree merge` unioned conflicting ledger rows and then aborted on any repeated ID. Two sessions editing the *same* pre-existing backlog item produce two rows for one ID, so the ordinary case looked identical to a genuine collision — and the abort's remedy would have split one item into two.
**Décision:** With the merge held uncommitted, classify every repeated ID against `git merge-base HEAD MERGE_HEAD`: present at the fork point means one shared item to reconcile cell-wise; absent means two independently minted entries, which aborts as before.
**Raison:** The command had one predicate ("does this ID appear twice?") answering two different questions, and the second question has an exact answer available from git. A content heuristic — same ID plus matching `Date`/`Summary` — would guess where evidence exists, falsely aborting when both sides edited a summary and silently fusing two same-day items that happen to look alike.
**Tradeoff:** Gained an exact discriminator that leaves the collision abort strictly more precise rather than weaker; accepted a longer procedure in a prose command file, executed by an agent rather than by code.
**Conséquences:** The abort now means one specific thing — an ID minted twice — so its diagnostic ("something bypassed block reservation") is finally true whenever it fires. The scenario in B-003, where a freed block is re-handed-out, still aborts correctly, since independently minted IDs are absent at the fork point by construction.
**Alternatives rejetées:** Handing every ledger conflict back to the user with plain git (trivially correct, but deletes the command's only reason to exist and sacrifices the frequent case to fix the rare one); a content heuristic on `Date`/`Summary` (needs no extra git commands, but guesses where `git merge-base` answers).

## D-derive-else-ask-on-cell-conflict — Same-cell divergence derives where a rule exists, asks where none does

**Scope:** ux
**Topic:** ledgers
**Date:** 2026-08-10
**Statut:** Active

**Contexte:** Once a shared ledger row is reconciled cell by cell, disjoint edits merge unambiguously — but both sides may have changed the *same* cell to different values, and the command needs a policy that never splits the item and never silently discards an edit.
**Décision:** Auto-resolve and report where an ordering genuinely exists — `Status` by lifecycle progress, `Pri` by level, blank losing to non-blank — and ask the user once, showing both values, where none does: two different free texts, `Dropped` against another status, `DECISIONS.md`'s `Statut`, and a conflicted detail section.
**Raison:** A `Planned`-versus-`Done` disagreement has an obvious answer the command can reach itself, and `docs/AUDIT.md`'s round-trip rule makes asking it a defect. A rewritten summary has no such answer, and picking one by rule would drop the other side's wording into a report the user may never read. Splitting the policy by whether a rule actually exists is what keeps both halves honest.
**Tradeoff:** Gained hands-off resolution for the cases that have a right answer and zero silent loss for the cases that don't; accepted a ladder that must stay true to a status vocabulary defined in `backlog.md`, plus one possible prompt inside a command otherwise designed to run unattended.
**Conséquences:** `worktree.md` now carries an ordering over `backlog.md`'s `Status` and `Pri` vocabularies, which `audit.sh` cannot guard — a status added there and not here degrades to "ask the user", which is the safe direction but is still drift. The rule text names `backlog.md` as the vocabulary's owner for that reason.
**Alternatives rejetées:** Asking on every same-cell divergence (no ladder to maintain, but a round-trip for questions the command could answer); resolving everything by rule with the destination winning free text (fully deterministic and scriptable, but drops the incoming side's summary unless the user acts on the report).

## D-boundary-anchored-ledger-id-match — The ledger ID matcher is boundary-anchored

**Scope:** func
**Topic:** ledgers
**Date:** 2026-08-10
**Statut:** Active

**Contexte:** Merge mode now decides whether a repeated ID is one item or two by testing that ID against the merge base. The plan's fixture wrote that test as `grep -c '^| *B-002 '`, which is fine as a one-off check of a known row but becomes the rule an agent applies to every ID it meets.
**Décision:** The test written into `worktree.md` is `grep -cE '^(\| *|## *)<ID>([^A-Za-z0-9-]|$)'` — anchored at the line start on either a table pipe or a `##` heading, and terminated by an explicit non-ID character class.
**Raison:** Without the trailing class, `B-002` matches inside `B-0021` and — far worse — `D-auth` matches inside `D-auth-token-rotation`, since decision IDs are hyphenated slugs of unbounded length. A false *present* silently classifies a genuine two-item collision as one shared item and fuses two unrelated entries, which is a worse outcome than the bug this plan set out to fix.
**Tradeoff:** Gained a predicate that is correct for every ID shape the ledgers use, including legacy `D-NNN`; accepted a regex dense enough that its intent has to be stated in prose beside it, which the file does.
**Conséquences:** Any future ID test in this command set should copy this form rather than the plan's convenience form. The table-row and heading alternation also means one predicate covers both the row and the detail section, so the classifier is stated once per step instead of twice.
**Alternatives rejetées:** The plan's `'^| *B-002 '` (shorter, and correct for the fixture, but wrong for slugs and for any ID that prefixes another); an exact field split on `|` (precise, but does not cover `## D-<slug>` headings and needs the header row to be parsed first).


## D-read-once-ships-as-a-shared-block — The read-once rule ships as a shared block in the five worker skills

**Scope:** arch
**Topic:** cost
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** 757 of the round trips across 158 recorded esq agent runs re-read a file the same run had already read — 4.8 per run, and the repeated targets are esquisse's own ledgers. The rule that stops it had to reach users' runs, not just this repo's.
**Décision:** The rule is a `shared:read-once` marked paragraph copied verbatim into `build`, `check`, `review`, `fix` and `work`, registered in `check-sharedblocks.sh` so drift fails the build.
**Raison:** A command file cannot dereference another file's section at runtime, which is the stated premise of the shared-block check — so one canonical copy is a rule the agent never reads, and `CLAUDE.md` would confine it to this repo. A hook that remembered read paths would cross two boundaries the architecture holds: a hook does not decide semantics, and telemetry stores numbers, never content.
**Tradeoff:** Gained: the rule is where the agent reads it, and drift is mechanical rather than hoped for. Accepted: five copies of a paragraph and ten files edited counting the legacy mirrors.
**Conséquences:** The carrier set is the five commands the telemetry is keyed to, not the 17 skills a spawn-language grep matches; a sixth shared block costs one registry line and a fault injection, as the pattern intends.
**Alternatives rejetées:** One canonical copy referenced from each skill — impossible at runtime. A hook detecting a re-read — crosses the semantics and the content boundary.

## D-calls-per-turn-over-a-paired-population — Calls per round trip is a paired aggregate, not a median of ratios

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** `apiRequests` is recorded on 213 of 369 telemetry rows and read by nothing; surfacing it needs a ratio, and 156 rows predate the field.
**Décision:** `calls/trip` is tool calls ÷ round trips summed over the runs carrying both fields, rendered `—` when no run in the group carries both.
**Raison:** The same population top and bottom means a row predating `apiRequests` cannot skew the ratio, and it matches how the corrected corpus script computes esq's 1.068 — so the summary and the acceptance test say the same thing. A median of per-run ratios would let a one-call run weigh as much as a hundred-call one.
**Tradeoff:** Gained: a figure directly comparable to the external referent (the machine's non-esq agents at 1.243). Accepted: a weighted mean hides the spread, which the provisional `*` marker already caveats for thin rows.
**Conséquences:** The new accumulator sits beside `toolCalls` and must never alter which runs enter a token sample; `MIN_SAMPLE_RUNS` is unchanged.
**Alternatives rejetées:** A median of per-run ratios (unweighted, misleading on short runs). A separate subcommand (a second surface for one number).

---


## D-ratio-sealed-with-its-population — The ratio is sealed with its denominator and printed to two decimals

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** Phase 2 of `read-once-and-see-round-trips` had to decide where `calls/trip` lives — derived at render time from the raw axes, or sealed into the group — and how many decimals it prints.
**Décision:** `seal()` stores `paired: { runs, toolCalls, apiRequests }` and `callsPerTrip` on every group, and `table()` renders the ratio with `toFixed(2)`, never `humanCount`.
**Raison:** A float with no visible denominator is a number nobody can argue with; shipping the paired population in `--json` lets a reader see the ratio was computed over 2 runs and not 61. And the comparison this column exists for is esq's 1.068 against the same machine's non-esq 1.243 — `humanCount`'s single decimal renders those 1.1 and 1.2, which is the whole signal lost to formatting.
**Tradeoff:** Gained: a ratio a reader can check and a precision that separates the figures being compared. Accepted: two more fields on the summary's JSON contract, and a cell that does not match the humanised style of its neighbours.
**Conséquences:** Any future column whose purpose is a comparison between close figures states its own precision rather than inheriting `humanCount`; a consumer of `telemetry summary --json` may rely on `paired` to reject a thin ratio.
**Alternatives rejetées:** Deriving the ratio in `renderTelemetrySummary` only (no JSON consumer could re-derive it without reimplementing the paired rule). `humanCount` for consistency (collapses 1.068 and 1.243 to 1.1 and 1.2).
## D-classifier-restated-in-both-merge-steps — The merge-base classifier is written into both merge steps

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-08-10
**Statut:** Active

**Contexte:** Step 3 (resolve conflicts) and step 4 (detect duplicate IDs) both need to know whether a repeated ID existed at the fork point. The obvious economy is to classify once in step 3 and have step 4 trust the result.
**Décision:** Both steps carry the full classifier — `BASE=$(git merge-base HEAD MERGE_HEAD)` plus the ID test — and step 4 reconciles ancestor-present duplicates itself rather than assuming step 3 already did.
**Raison:** Step 3 only ever sees files git raised a *conflict* on. A ledger where both sides' edits land far enough apart auto-merges cleanly and reaches step 4 with two copies of a shared row and no marker step 3 could have caught; two detail sections for one ID that never overlapped textually do the same. A step 4 that trusted step 3 would abort on exactly that case — the ordinary one — which is the bug this plan exists to remove.
**Tradeoff:** Gained correctness on the clean-auto-merge path, which is common and was invisible to the original design; accepted a second copy of the classifier that can drift from the first, guarded only by the plan's `grep -c 'merge-base'` floor of 2.
**Conséquences:** A future edit that factors the classifier into one step must first prove the clean-auto-merge path is handled, or it silently reintroduces the false abort. `audit.sh` cannot see this — it is one procedure stated twice, not a duplicated definition with a delimited span, so it belongs to the reading pass in `docs/AUDIT.md`.
**Alternatives rejetées:** Classify only in step 3 and have step 4 read a list it left behind (no duplication, but blind to every ledger that never conflicted); make step 4 the only classifier and let step 3 union blindly (one site, but it recreates the two-rows-for-one-item state that step 4 then has to unpick).

---

## D-long-run-is-an-opt-out-list — "Runs long" is an opt-out list, not an enrolment

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-13
**Statut:** Active

**Contexte:** `audit.sh` check 16 required an up-front bound only from commands that spawn subagents. `/esq:plan`, `/esq:spec` and `/esq:arch` spawn none and ran for minutes in silence; one 8-minute `/esq:plan` was read as hung and interrupted, throwing away 26k tokens of reasoning (`B-007`).
**Décision:** The check enforces the announcement on every command **except** those named in a `SHORT_COMMANDS` list in `audit.sh`, each carrying a one-line reason.
**Raison:** The defect was not a wrong rule but a proxy criterion — "spawns agents" stood in for "runs long without handing back", and it missed. Any opt-in successor (a marker in the command file, a fixed list of long commands) is missed by exactly the command that forgets it, which is the failure being fixed. Only a default of *long* fails closed on a command added later.
**Tradeoff:** Gained a guard a new command cannot escape by omission; accepted that roughly 14 of 20 commands now open with a line they did not have, so the announcement is capped at one line plus one itinerary line or the cure becomes the disease.
**Conséquences:** Adding a command means announcing or arguing in writing for an exemption. Exemptions are reviewable because the reason sits beside the name; `status` is the closest call and holds its place only while its reason line stays true.
**Alternatives rejetées:** A declared marker per command (opt-in, and the forgetful command forgets the marker too); inference from file length or verb counts (`spec.md` is 109 lines and slow, `status.md` is 192 and fast — the proxy ranks them backwards and produces a green audit on a silent command).

---

## D-five-commands-adopt-the-conclusion-block — The five silent commands adopt the conclusion block rather than a bespoke elapsed line

**Scope:** ux
**Topic:** audit
**Date:** 2026-08-13
**Statut:** Superseded by [D-elapsed-footer-over-conclusion-block] the same day — the cost pass measured what the entry below calls "one phase of rewriting" and found it was also 409 words on every invocation, forever. Kept rather than deleted: the consistency argument is still the right one for `B-008` to weigh.

**Contexte:** The widened rule needs an elapsed report at the end. Thirteen commands already get one free from the shared conclusion block's headline; `plan`, `spec`, `arch`, `grill` and `harvest` carry no block and improvise their closing report.
**Décision:** Those five adopt the full three-zone conclusion block, byte-identical to the existing carriers, and join `CONCLUDE_FILES`.
**Raison:** A bespoke elapsed line satisfies the check for one release and leaves the set split between two ways of concluding — the exact drift check 18 exists to prevent. The block's headline already carries `<elapsed>`, so the bill arrives as a consequence of consistency rather than as a second mechanism.
**Tradeoff:** Gained one conclusion shape across the whole set; accepted a phase of rewriting five closing reports, each of which is a contract another command reads.
**Conséquences:** `CONCLUDE_FILES` grows to eighteen and `worktree`/`ui` become the only non-carriers — a future pass should decide whether that is deliberate. Each adoption commit must update `CONCLUDE_FILES` in the same commit, since check 18 fails a carrier that is not listed.
**Alternatives rejetées:** A one-line elapsed footer per command (cheapest, satisfies the grep, entrenches two conclusion shapes); no elapsed at all for the five (fails the rule's second half — a bound with no bill cannot be checked against reality).

---

## D-elapsed-footer-over-conclusion-block — The bill is one line; the conclusion block is a separate purchase

**Scope:** ux
**Topic:** audit
**Date:** 2026-08-13
**Statut:** Active

**Contexte:** The widened rule needs an elapsed report from `plan`, `spec`, `arch`, `grill` and `harvest`, which carry no conclusion block. Adopting the block was chosen first, then measured: 409 words added to every invocation of those five — **+28% on `spec.md`**, the shortest and most focused file in the set — and three of the plan's nine tasks.
**Décision:** The five report elapsed in one closing line. Adopting the conclusion block is filed as `B-008` and judged separately.
**Raison:** The block buys one consistent conclusion shape; it does not buy the bill, which is one number. Bundling it into a cost fix means a permanent per-invocation tax rides in on a change whose stated purpose was reducing waste — the same shape as the two defects of 2026-08-12. `arch.md` already argues that always-loaded text competes for attention on every task it has nothing to do with; that argument does not stop applying because the text is well-written.
**Tradeoff:** Gained a 3-task plan instead of a 9-task one and no recurring cost; accepted that seven commands still conclude in their own shape, which is a real inconsistency and stays visible as `B-008`.
**Conséquences:** The widened check asserts `elapsed` appears in the file — satisfied by the footer or by the block, so `B-008` can land later without touching the check. Any future "adopt the shared block" proposal should carry its word count and the per-invocation growth, because that is the number that decided this. Narrowed 2026-08-18 to `plan`, `grill`, `harvest`, `ui` by [D-conclusion-block-where-zone-two-fills]; `spec` and `arch` now carry the block.
**Alternatives rejetées:** Adopting the block now (bundles a consistency purchase into a cost fix, and was reversed for exactly that); no elapsed at all (a bound with no bill cannot be checked against reality).

---

## D-conclusion-block-where-zone-two-fills — The shared conclusion block is carried where zone 2 has real content on a normal run

**Scope:** ux
**Topic:** audit
**Date:** 2026-08-18
**Statut:** Active

**Contexte:** `D-elapsed-footer-over-conclusion-block` deferred adopting the three-zone block in the six non-carriers to `B-008`, with an instruction to price it per file first. Repriced 2026-08-16: the block is 303 words, and the block's only expanding zone is zone 2 — *what needs you*. Of the six, only `spec` (the "pas voulu" regressions) and `arch` (a code/`DECISIONS.md` contradiction, spec staleness) have real zone-2 content on a normal run, and both bury it as the penultimate item of a commit checklist. `plan`, `grill`, `harvest` and `ui` hand back a file path and a next command — `✔` every run, zone 2 permanently absent.
**Décision:** A command carries the shared conclusion block when its zone 2 has real content on a normal run. `spec` and `arch` join the carriers (15); `plan`, `grill`, `harvest`, `ui` keep the one-line elapsed footer, named with this criterion beside `CONCLUDE_FILES` in `audit.sh` check 18 and in `docs/AUDIT.md`. `worktree` is not a candidate (`check-longrun.sh` `SHORT_COMMANDS`). The harness-port gate on `B-008` no longer applies: `62be306` dropped the roadmap edge, `D-codex-port-paused-for-claude-base` paused the port, and a future port targets the plugin/CLI contract, not command prose.
**Raison:** The block buys one thing — the reader sees what needs them before any detail — and that purchase is worth 303 words exactly where zone 2 fills. Reordering spec/arch to lead with zone 2 without the block would fix the burial for free and add two more bespoke conclusion shapes nothing mechanical guards (check 18 sees only carriers), which is the drift class the block exists to end. Carrying it in all six spends ≈ 1,670 net words to format four file paths.
**Tradeoff:** Gained the two runs whose most valuable output was buried now leading with it, under a shape check 18 holds byte-identical; accepted per-file growth, priced and unoffset — measured at build (`wc -w`, 2026-08-18): `spec.md` 1,675 → 2,029 (+354, +21%), `arch.md` 3,949 → 4,326 (+377, +9.5%); the block is +303 gross in each, and the zone-assignment text that replaced the old closing steps came out heavier than what it replaced (spec 210 vs 159 words, arch 211 vs 137), so the net is +731 across both, not the ≈ +450 the brief estimated; `commands/esq/` 79,948 → 80,679 words — and an exemption list of four that must carry its reason.
**Conséquences:** `B-008` closes on this criterion rather than narrowing again; a future "adopt the block in X" proposal answers one question — does X's zone 2 fill on a normal run — and prices per file. `B-012`'s aggregate moves against its target by design; retargeting it is its own item. Any edit to the block's text is now a 15-carrier change.
**Alternatives rejetées:** Reorder spec/arch to lead with zone 2 and keep the footer (free, but two more unguarded bespoke shapes — the `D-001` consistency argument decides against it); adopt in all six (rejected at repricing: zone 2 structurally empty in four); keep the footer everywhere (leaves the run's most valuable output as step 7 of 8).

---

## D-announce-in-two-beats — The bound is announced above preflight, the resolved target at the end of it

**Scope:** ux
**Topic:** audit
**Date:** 2026-08-13
**Statut:** Active

**Contexte:** The announcement was first written as the last step of `## Preflight`, carrying the command, the itinerary, the bound and the target in one line. Every long command's preflight opens with file reads, so "one line, before you read anything" contradicted its own position. Observed live: `/esq:arch` run headless emitted 25 tool calls and zero text — the line never reached the screen, and all five `(auto)` verification steps passed anyway.
**Décision:** Two marked regions per command — `announce-open` above the preflight heading carrying the command, the itinerary and the bound, and `announce` as the last preflight step carrying only what preflight resolved (the window, the item, the phase, the refresh date).
**Raison:** A single line can be *early* or *resolved*, not both. Moving it up alone would have cost the free-correction moment `/esq:ui` was built around — the user redirecting a wrong screen list, window or item before anything is spent on it. Splitting keeps zero silence before the first tool call and keeps that moment, at the price of one extra line of output.
**Tradeoff:** Gained an announcement that is genuinely before the spend *and* a target the user can correct for free; accepted a second line on every run of thirteen commands, and a second marked region for the audit to assert.
**Conséquences:** The bound is printed once, in the opener — the in-preflight block lost its bound rather than repeating it. The widened check must attach its four assertions to `announce-open`, not to `announce`, and must not reuse check 16's `sed -n '/Announce/,/^$/p'`, which now spans both regions. A new long command needs both blocks.
**Alternatives rejetées:** Moving the single line above preflight (simplest, one region — but the line can no longer name what preflight resolves, so `sweep`'s window, `arch`'s refresh date and bare `/esq:work`'s item lose their correction moment); reordering each preflight so the reads come last (one line, no extra output — but three commands genuinely need a read to resolve their line, so it is half a fix across thirteen reorderings).

---

## D-named-anchor-for-announcement-placement — The "before the work" anchor is a named heading, never an inferred one

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-13
**Statut:** Active

**Contexte:** Check 16 has to assert that a command's announcement arrives *before* it starts working — a bound stated afterwards is a bill. That needs a line number to compare against, and the plan said only "sits in preflight, not after the work".
**Décision:** The anchor is the first heading matching `## Preflight`, `## Mode X` or `## Step N`. A command with none of them fails the check.
**Raison:** Both inferences tried rank real files backwards. "The first `## ` heading" puts `plan.md`'s prose section — no tool call in it — ahead of the announcement; "the first section with a numbered list" does the same to `advance.md`'s principles section. A named anchor is a convention the check enforces and the set already follows; a proxy is a rule that reports the wrong files.
**Tradeoff:** Gained an exact, non-proxy placement test; accepted that a new command must name its first work section one of three ways, or say why in `SHORT_COMMANDS`.
**Conséquences:** Adding a command with an unconventional first heading fails the audit until the heading is renamed or the exemption is argued — which is the intended fail-closed direction. `roadmap.md`, which has no `## Preflight`, is anchored by its `## Mode A` heading and needed no change.
**Alternatives rejetées:** First `## ` heading (flags `plan.md`, `sweep.md`, `fix.md` and the three orchestrators, all correct today); first numbered-list section (flags `plan.md` and `advance.md`); line-number thresholds (Approach B in the plan — no proxy survives contact).

---

## D-check-longrun-is-one-awk-pass — The long-run check is a single awk pass

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-13
**Statut:** Active

**Contexte:** `scripts/test-longrun-guard.sh` runs `check-longrun.sh` seven times per audit, once per injected fault plus the inverse cases. The check's own runtime is therefore multiplied by seven against the plan's 4s audit ceiling.
**Décision:** The entire per-file scan is one awk program invoked once with every command file, rather than greps per assertion or a bash line loop.
**Raison:** Measured, not assumed: greps-per-assertion cost 0.6s a run (~200 processes), a bash line loop 0.35s, and either put the full audit at 5.3s — over the ceiling the plan set as the tripwire against this exact failure. One awk pass costs 0.03s, the guard 0.25s, the audit 2.795s.
**Tradeoff:** Gained an audit that stays well inside its budget with nine assertions of fault injection added; accepted that the check's logic is an embedded awk program, which is less approachable than the shell it replaced.
**Conséquences:** Adding an assertion means editing awk, and the finding strings live inside a single-quoted shell block where apostrophes have to be escaped or avoided. The 4s ceiling stays the tripwire — if a future assertion needs a subprocess per file, this is the number that will notice.
**Alternatives rejetées:** Cutting fault-injection cases (buys speed by removing the coverage the phase exists to add); running each case against a one-file scratch directory (faster, but stops proving the check finds the fault among twenty files); accepting 5.3s (silently spends the ceiling the plan wrote as a guard).

---

## D-corroborate-one-bound-phrase — One matched bound phrase must recur, not every one

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-13
**Statut:** Active

**Contexte:** A stated bound is not a true one, and no grep can tell them apart. The corroboration assertion requires the announcement's cap phrase to appear a second time in the file body, so a cap invented for the slot has to be invented twice. An announcement usually names several caps.
**Décision:** At least one of the matched bound phrases must recur in the body, outside both marked regions.
**Raison:** The strict reading — every matched phrase must recur — fails `work`, `roadmap` and `ui` today and would force three text edits whose only purpose is satisfying a grep. Phrase families are coarse either way (`at most` recurring anywhere corroborates `at most 8 captures` no better under either rule), so the strict version buys churn rather than truth. The plan's own wording is singular.
**Tradeoff:** Gained a check that passes the set as written and still forces a wholly invented bound to be invented twice; accepted that a file stating two caps, one real and one fictional, passes on the real one.
**Conséquences:** Whether a bound is *honored* stays a reading-pass question, recorded in `docs/AUDIT.md` § 5 question 2. The check proves a phrase recurs and claims nothing more.
**Alternatives rejetées:** Every matched phrase must recur (three edits today, and the same coarse granularity); no corroboration at all (twelve announcements from one template is twelve plausible caps and a green audit — the risk the plan names).

---

## D-plan-glob-excludes-log-md — Every plan glob excludes `*.log.md`

**Scope:** arch
**Topic:** commands
**Date:** 2026-08-14
**Statut:** Active

**Contexte:** Ten places in the command set resolve "the active plan" by globbing `docs/plans/*.md`. Eight excluded `*.log.md`; `check.md` and `review.md` did not. The cost-trim plan flagged the disagreement and left the direction open: add the exclusion to the two, or delete it from the eight.
**Décision:** The exclusion is part of the plan-glob convention, and `check.md` and `review.md` adopt it.
**Raison:** No `*.log.md` has ever existed in `docs/plans/` and nothing in the set writes one, so the token is inert either way and the choice is purely about which state is cheaper to keep true. Two files disagreeing with eight is a drift the next reader has to re-adjudicate; making the ten identical is a two-line diff against an eight-place removal, and it leaves the set able to tolerate such a file if one ever appears.
**Tradeoff:** Gained a glob that reads the same in all ten resolvers, so a future scan-merge or shared block can hash them. Accepted that the set carries an exclusion for a filename nothing currently produces.
**Conséquences:** Any new command resolving a plan path copies the same clause verbatim. If a `*.log.md` artifact is ever introduced, no resolver needs revisiting. Should the set later decide such files should be visible, the removal is now a single uniform edit rather than a reconciliation.
**Alternatives rejetées:** Deleting the exclusion from the eight that carry it — a larger diff, it removes a guard against a file the naming convention plainly anticipates, and it makes the convention harder to restate than to keep.

---

## D-two-git-views-is-not-double-processing — A second view of one range is not a redundant scan

**Scope:** arch
**Topic:** commands
**Date:** 2026-08-14
**Statut:** Active

**Contexte:** The cost-trim plan's Phase 3 removes same-run double-processing. `check.md`'s preflight runs two commands over one range: `git log --oneline <range>` for the commit list, and `git log --stat <range> -- . ':!docs/plans' ':!docs/BACKLOG.md' ':!docs/DECISIONS.md'` for file-level material. Since `--stat` also prints subject lines, the pair looks like an obvious merge.
**Décision:** Both calls stay; only the genuinely redundant per-commit `git show --stat` was removed.
**Raison:** The `--stat` call carries pathspec exclusions, so a commit touching only excluded paths never appears in its output at all. Cross-cutting analysis needs the unfiltered commit list to find unplanned commits — merging the two would silently narrow what that step can see, trading a correctness property for one saved git call. Two *different* projections of one range are two answers, not one answer fetched twice.
**Tradeoff:** Gained a preflight that still shows every commit in the range to the step that must see them all. Accepted one extra git invocation per `/esq:check` run, which is cheap next to the reads it feeds.
**Conséquences:** The test for "double-processing" in this set is whether the second call returns data the first already held, not whether it names the same range. A future cost pass that reaches for this merge should read this entry first. `review.md` is unaffected — it resolves file scope with a single `git diff --name-status` and has no equivalent pair.
**Alternatives rejetées:** Folding `--oneline` into the `--stat` call and reading subjects from its headers — it drops metadata-only and excluded-path commits from the list, which is precisely the material the unplanned-commits check exists to surface. Dropping the exclusions from `--stat` so one call could serve both — that re-admits the esquisse metadata churn the exclusions were added to remove, on the far larger of the two outputs.

---

## D-restore-the-borderline-clause — Restore the borderline clause; cut only named rationale

**Scope:** arch
**Topic:** commands
**Date:** 2026-08-14
**Statut:** Active

**Contexte:** Phase 5 trimmed the four hash-guarded shared blocks in lockstep across 29 carrier slots. Appendix E.2's draft for the decision shape proposed cutting three clauses, two of them pure rationale and one — "never present one option as though it were the answer" — on the grounds that never-apply and leaning-is-not-deciding already subsume it. The appendix annotated that third one "restore if any doubt", and the task text adds "restore any borderline clause rather than argue".
**Décision:** The subsumption-based cut was not taken: the clause stays in all seven copies, and only the two sentences the draft names as rationale were removed.
**Raison:** The clause states a behavior neither survivor states. Two-or-three-options requires that two options exist; leaning-is-not-deciding says who picks. Neither forbids listing two and framing one as settled, which is the leaning-as-verdict failure — and its converse, "never withhold the lean to look neutral", was kept in the same sentence, so cutting it would have left half a pair. AUDIT.md's standing note on this block is that the wording *is* the contract, and it is paid seven times over, which is exactly the pressure that makes a rule look like a restatement.
**Tradeoff:** Gained a decision shape that still forbids every failure it forbade before the trim, with no reliance on a reader deriving one rule from two others. Accepted 11 words per copy (~77 across the set) of the phase's word budget, part of why Phase 5 delivered −1,791 against a budgeted −2,900.
**Conséquences:** The bar for cutting inside a hash-guarded block is now explicit: a sentence goes only if it is rationale for a rule stated elsewhere, never if it is itself a rule that another rule merely implies. A future trim proposing a subsumption argument against one of these blocks should expect to be refused on the same grounds. It also means Appendix E's remaining word estimates are ceilings, not commitments.
**Alternatives rejetées:** Taking the cut as drafted — it buys 11 words per copy by removing a rule clause from a block whose whole reason for being hashed is that its wording is load-bearing, and the appendix itself flagged the doubt rather than resolving it. Rewording the three clauses into one shorter sentence — that is a rewrite of contract text authored outside the draft the task points at, in a block where every copy must match, which is precisely the freelancing the lockstep procedure forbids.

---

## D-description-routes-readme-explains — A description routes; it never documents

**Scope:** arch
**Topic:** commands
**Date:** 2026-08-14
**Statut:** Active

**Contexte:** The 20 `description:` frontmatter fields totalled 983 words, loaded into every session of every consuming project whether or not an esq command is ever invoked. Six of them (worktree 101w, work 87w, backlog 79w, sweep 68w, roadmap 65w, epic 64w) spent most of that on enumerating their own modes and argument forms.
**Décision:** A description says what the command is and when to reach for it, in ≤20 words; mode and argument syntax lives in the command body and README's per-command tables, and nowhere else.
**Raison:** The two audiences are different and are served at different moments. The description is read by a session deciding *which* command applies — routing, which a distinguishing sentence does as well as a syntax dump; `check.md` at 21 words had been proving that for months. Syntax is read by someone who has already chosen, at which point they are in the file or the README. Paying for the second audience in every session of every project buys nothing at the moment the words are actually loaded.
**Tradeoff:** Gained 630 words off the standing per-session cost of adopting esquisse at all — the only cut in this plan that is paid even by a project that never runs a command. Accepted that the mode forms now have exactly one home, so a new mode that lands in a command file without a README row is invisible to a user reading descriptions.
**Conséquences:** Adding a mode to a command means updating README, not the description — which is already CLAUDE.md's rule for every skill edit, now with real consequences. A future description that starts growing a syntax list is regressing this entry. audit.sh check 4 already fails a command missing from either exhaustive README table, so the routing floor is mechanized even though the prose is not.
**Alternatives rejetées:** An abbreviated syntax hint per multi-mode command (`bare · <ID> <change> · publish`) — it holds those six around 30–35 words for ~500 total, and re-creates a second copy of the mode list that drifts from README the first time a mode changes, which is the exact class of defect this plan's Phase 8 exists to hash-guard. Leaving the long descriptions and cutting elsewhere — the other phases cut per-invocation cost; this is the only line item billed per *session*, so it is the highest-leverage 630 words in the set.

---

## D-one-rulebook-under-constraints — One rulebook, under the heading every command already has

**Scope:** arch
**Topic:** commands
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** `advance`, `autopilot` and `converge` each carried two rule lists — a mid-file `## What you may never do` and an end-of-file `## Constraints`. The 2026-08-14 cost audit measured 10 of 11 bullets restating across the pair in advance, and the same shape in the other two: ~560 words of second copy across the three files, drifting independently.
**Décision:** Each of the three states every rule once, in a single list under `## Constraints`; `## What you may never do` is gone from all three.
**Raison:** Two lists of the same rules is the drift generator this repo's audit exists to catch, and it is invisible to `audit.sh` because both copies are prose. Of the two headings, `## Constraints` is the one every command in the set already ends with, so consolidating there leaves the set uniform instead of introducing a third convention. Check 2 resolves quoted section references against real headings, so keeping the universal heading is also the option that cannot break a future cross-reference — and a grep confirmed `What you may never do` had none anywhere in `commands/esq/`, `README.md` or `docs/`.
**Tradeoff:** Gained one authoritative rulebook per orchestrator and ~560 words. Accepted that the prohibitions now sit at the end of the file rather than adjacent to the procedure they constrain, so a reader skimming the middle of `advance.md` no longer meets "never build" in place.
**Conséquences:** A new rule for one of these three commands has exactly one home, and a future edit that adds a second list is regressing this entry. It also removes three files' worth of near-duplicate prose from the set Phase 8.1 is about to hash — less text to keep identical, and no ambiguity about which copy is canonical.
**Alternatives rejetées:** Keeping both lists and making one a pointer — a pointer is still a second place to look, and the drift the audit found was between two lists that each already claimed to be complete. Merging under a new `## The rulebook` heading — it reads better in isolation and makes these three files the only ones in the set that do not end with `## Constraints`, which costs more in convention than it buys in naming.

---

## D-cut-to-the-appendix-report-the-gap — Cut what the analysis named; report the shortfall

**Scope:** arch
**Topic:** commands
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** Phase 6's verification sets a `wc -w` target per file "within ±10% of Appendix targets". After applying every Appendix A/B entry for the eight files, three landed above their bare number and inside the band: advance 4,517 (4,400), converge 4,514 (4,500), work 2,632 (2,600). The appendix's own per-file estimates realized at about 62% — the same ratio Phase 5 measured for Appendix E's shared-block arithmetic.
**Décision:** The phase stopped at the appendix's named cuts and recorded the gap, rather than finding unnamed text to cut in order to reach the bare numbers.
**Raison:** The phase's own manual verification step is "every removal is rationale/restatement **per Appendix**" — cutting beyond it to satisfy the numeric step would make the two steps contradict each other, and the prose step is the one that protects the rules. A word target is a proxy for "the restatements are gone"; once the named restatements are gone the proxy has served its purpose, and continuing to cut is optimizing the measure instead of the thing. The ±10% band in the step exists for exactly this margin.
**Tradeoff:** Gained a diff where every removal traces to a line in the analysis of record, reviewable against that list. Accepted that the plan's ≤70,500 total is now further out of reach and that closing it is a decision the user will have to make rather than something the phases quietly absorb.
**Conséquences:** Phase 7 inherits a 4,163-word gap against ~3,200 of named cuts, and its hand-off says to report that rather than close it by freelancing. More generally: in this repo an appendix word estimate is a ceiling to cut toward, not a commitment to hit, and a phase that misses one reports the miss instead of manufacturing the difference.
**Alternatives rejetées:** Cutting unnamed text to hit the targets — it buys three numbers at the cost of the property the phase actually exists to guarantee, and every such cut is one no reviewer can check against the appendix. Rewriting the targets in the plan mid-flight to match what was achieved — that edits the contract to fit the result, and the continuity check exists to make exactly that visible.

## D-log-the-phase-record-the-miss — Log the phase; record the miss inside it

**Scope:** arch
**Topic:** plans
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** `/esq:build` says "Do NOT append to the execution log on failure. The phase is incomplete", and a failing `(auto)` verification step is a failure. Phase 7 of the cost-trim plan ended with all four task commits applied, `audit.sh` and `check-longrun.sh` green, the diff-read clean, and one step failing: a plan-level `wc -w` total of 72,826 against a ≤70,500 target. That gate had already been put to the user and answered one session earlier — `eacfc20` books the 2,326-word remainder as `B-012` and keeps 70,500 as the goal.

**Décision:** The phase was logged `completed` with the failing step written into the entry verbatim, its number, and the commit that disposed of it — rather than left unlogged.

**Raison:** The no-log-on-failure rule exists so an unproven phase never reads as done, and that risk is absent here: every task-level check passes and the one failure is a plan-level aggregate the user has already adjudicated. Withholding the entry would not have preserved a gate — the gate was spent — it would only have frozen Phase 8 permanently and made every future `/esq:build` re-attempt four commits that already exist in git, which is the re-run-what-succeeded cost failure `CLAUDE.md` names as the expensive one.

**Tradeoff:** Gained a plan that can close, and a log entry that states the miss where the next reader meets it. Accepted that a `completed` header now covers a phase with one red check, so the entry's body has to carry that weight instead of the header.

**Conséquences:** The distinction that matters is *whose* check failed: a task-level or per-file check failing means the phase is unproven and stays unlogged, and nothing here relaxes that. A plan-level aggregate the user has already ruled on is booked work, not an open gate, and the phase logs with the number in it. A `completed` header is not a claim that every step was green — the `**Verification:**` block is where that is read.

**Alternatives rejetées:** Leaving Phase 7 unlogged — the honest-looking option, but it strands the plan and re-buys four commits on every subsequent invocation, and no reader is protected by an absence. Re-asking the user whether to log it — the same gate answered twice, which `/esq:build`'s own one-round-per-gate rule forbids and which turns an unattended run into an interrogation. Rewriting `## Done looks like` down to 72,826 so the step would pass — that edits the contract to fit the result, already rejected in `D-cut-to-the-appendix-report-the-gap`.

## D-registry-not-a-check-per-block — Shared paragraphs are enrolled in a registry, not given a check each

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** Phase 8 had to guard eleven more duplicated-paragraph sets. The four existing shared-block checks (11/14/15/18) each hash one block with its carrier list hard-coded, about forty lines apiece.
**Décision:** Check 22 is a registry — one line per family naming its carriers — with a single engine, rather than eleven more per-block checks.
**Raison:** Eleven copies of a forty-line check is 400 lines of near-identical bash: the exact duplication defect the checks exist to catch, relocated into the auditor. A registry makes enrolling the twelfth set cost one line and a marker pair per carrier, which is the difference between a guard people extend and one they route around.
**Tradeoff:** Gained a mechanism that scales to the next shared paragraph at near-zero cost; accepted that per-block rationale now lives in `docs/AUDIT.md` rather than beside each check, so the reason a family is registered is one file away from the code that enforces it.
**Conséquences:** The four older checks stay as they are — each carries assertions beyond the hash (check 18 also proves every conclusion template leads with a headline), so converting them buys nothing. Anything new goes in the registry.
**Alternatives rejetées:** Eleven new hard-coded checks — rejected on the duplication it would create. Folding checks 11/14/15/18 into the registry too — rejected because their extra assertions have nowhere to go, and rewriting working guards to look uniform is churn.

## D-shared-only-what-is-identical-by-design — Marker spans hold text identical by design, not text that happens to match

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** The orchestrator paragraphs advance/autopilot/converge share are wording-identical in their rules and genuinely different in their particulars — each names its own artifact (brief file / backlog row / execution log), its own unit (step / item / phase) and its own follow-on rules.
**Décision:** Only text that is identical *by design* goes inside a shared marker; everything a command must say in its own terms stays outside, even when it currently reads almost the same.
**Raison:** A hash check makes whatever is inside the markers unchangeable in one file without changing all of them. Wrapping a paragraph that legitimately differs would force three commands to describe an artifact two of them do not read — a worse defect than the drift the markers prevent, and one that would be discovered by a confused agent rather than by a check.
**Tradeoff:** Gained honest carriers and a guard nobody has a reason to fight; accepted that the guarded surface is smaller than the measured overlap, so some near-duplicate wording stays unguarded.
**Conséquences:** Enrolling a family means first asking whether its carriers *must* say the same thing, not whether they currently do. Where only part of a paragraph is shared, wrap that part and leave the rest — which is what `shared:row-header` and `shared:read-artifact` do.
**Alternatives rejetées:** Wrapping the whole paragraph and normalizing role nouns in the comparison — rejected as a comparison nobody can predict from reading the files. Leaving the near-duplicates unguarded — rejected: that is the state the cost audit found and named.

## D-the-auditor-pays-its-own-cost-rule — A check runs as one pass, not a process per comparison

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** The first `check-sharedblocks.sh` ran grep + tr + sed + md5sum per copy. Run thirteen times by its own fault injection, that was ~3,000 processes and 6.3s — more than doubling a 2.9s audit that runs before every command change.
**Décision:** The engine is one awk pass over the command set, comparing whitespace-normalized span text directly rather than hashing it.
**Raison:** CLAUDE.md audits every change for what it spends whether or not the change is about cost, and a check whose subject is duplication is the worst possible place to pay for the same work repeatedly. The same reasoning already produced `check-longrun.sh`'s single awk pass; this is that precedent applied rather than rediscovered.
**Tradeoff:** Gained 6.3s → 0.27s for the same thirteen assertions; accepted an awk program that is harder to read than the shell pipeline it replaced.
**Conséquences:** A future check over the whole command set should be written as one pass from the start. Where a check needs fault injection, extracting it into a script that takes a command dir is what makes the injected cases affordable.
**Alternatives rejetées:** Keeping the pipeline and cutting fault-injection cases to hold the time down — rejected: the cases are the guard, and trading proof for speed inverts the point. Caching hashes between runs — rejected as state to invalidate for a check that must be correct on a dirty tree.

## D-markers-not-an-abstract-vocabulary — Wrap the harness coupling; do not rewrite the prose

**Scope:** arch
**Topic:** harness-port
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** B-006 proposed making all 20 command files harness-neutral by replacing every concrete tool name with abstract verbs (`ASK`, `SPAWN`, `WEB`, `PUBLISH`) defined in a `_harness.md` the installer inlines. The port's governing requirement is that no command's behavior changes on any target.
**Décision:** Harness-specific passages are wrapped in `<!-- harness:<kind>:start -->` / `:end` pairs and left exactly as written; an adapter per non-default target supplies replacement text per kind.
**Raison:** An abstract-verb rewrite produces a ~5,000-line diff in which a faithful rewording and a behavior change are indistinguishable to a reviewer — the exact failure the parity requirement exists to prevent. The marker diff is markers-only and reviewable line by line, and it reuses the three-segment marker grammar this repo already enforces as checks 22/23 rather than inventing a second scheme.
**Tradeoff:** Gained a reviewable diff and a live set that provably did not move; accepted that the source still names concrete Claude tools, so "harness-neutral" is a property of the seam rather than of the prose.
**Conséquences:** A third target costs binding every registered marker kind, not rewriting any file. A new command must carry markers from the day it lands, which audit check 24 enforces.
**Alternatives rejetées:** The abstract-verb rewrite — rejected on diff reviewability under a parity requirement. Runtime detection ("if you are Codex, do X" inside each command) — rejected: every invocation pays for a branch forever, and the branch that is never exercised is the one that rots.

## D-identity-adapter-by-omission — The default target has no adapter, so identity is structural

**Scope:** arch
**Topic:** harness-port
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** The port must leave `~/.claude/commands/esq/` byte-identical to its source, and the brief required that identity be asserted mechanically rather than read.
**Décision:** `adapters/claude-code.md` does not exist. The transform substitutes a span's body only when the target's adapter binds that kind; with no adapter, every span passes through and `--target claude-code` is a byte-for-byte copy.
**Raison:** An identity adapter that restated each span's text would be a second copy of the same prose — the drift defect `check-sharedblocks.sh` exists to prevent, reintroduced inside the porting machinery. Omission makes identity a property the code cannot easily violate; the assertion then confirms rather than carries it.
**Tradeoff:** Gained structural identity and zero duplicated prose; accepted that "no adapter" is a meaningful configuration a reader must be told about rather than infer.
**Conséquences:** Any future target that wants to inherit most Claude bindings gets them free by binding only the kinds it differs on. An unbound kind on a non-default target is a hard error, never a silent pass-through — otherwise omission would mean two opposite things.
**Alternatives rejetées:** A full `adapters/claude-code.md` mirroring every span — rejected as duplicated prose that would drift. A `--target claude-code` short-circuit that skips the transform entirely — rejected: it would leave the transform's identity path untested by the path that actually ships.

## D-lexical-rewrite-outside-the-markers — The invocation literal is a rule, not a marker

**Scope:** arch
**Topic:** harness-port
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** `/esq:<name>` appears in nearly every paragraph of every command file, and Codex invokes skills as `$esq-<name>`. Wrapping each occurrence in markers was the consistent thing to do.
**Décision:** The transform runs one declared lexical rewrite pass (`/esq:<name>` → `$esq-<name>`, `~/.claude/commands/esq/` → the target's skill path) and reserves markers for the ten semantic bindings.
**Raison:** Several hundred marker pairs carrying a mechanical rename would bury the ten spans where a real mechanism differs, and the point of the markers is that a reviewer can see every place behavior is bound. A rename that is correct everywhere by construction does not need per-site review.
**Tradeoff:** Gained a legible marker set; accepted two substitution mechanisms in one transform, so audit check 24's tool-name vocabulary must be written not to trip over the lexical one.
**Conséquences:** A target whose invocation convention is not a simple rename needs a new rule in its adapter, not new markers in every file.
**Alternatives rejetées:** A `harness:invocation` marker at every call site — rejected on noise. Leaving `/esq:` untranslated and telling Codex users to mentally substitute — rejected: a command that prints an unrunnable next step is a broken command.

## D-two-guards-against-implicit-invocation — Config policy and an in-artifact refusal, both

**Scope:** arch
**Topic:** harness-port
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** Codex skills activate implicitly when the model matches a request to the skill's `description`, and `/esq:build` commits code. Separately, Codex documents no argument-passing mechanism, so a mutating skill can be entered with no path or ID in view.
**Décision:** Every mutating command ships `agents/openai.yaml` with `policy: allow_implicit_invocation: false`, **and** a `harness:arg-guard` span that stops and prints the explicit invocation when no argument is in view.
**Raison:** These guard two different failures — being fired unasked, and proceeding on a guessed argument — so neither substitutes for the other. openai/codex#19695 (checked 2026-08-15) reports the explicit-only contract is not yet fully reliable, which settles it: the guard that matters cannot live in a config field alone.
**Tradeoff:** Gained a refusal that holds even if the config is ignored; accepted that Codex gains a stop Claude Code does not have, which is a difference in the invocation surface rather than in what a command does once running.
**Conséquences:** A new mutating command must ship both. If Codex later documents real argument passing, the arg-guard becomes a fallback rather than the primary contract — and should be re-read then, not deleted.
**Alternatives rejetées:** The config field alone — rejected on the reported unreliability. The prose refusal alone — rejected: it fires after the skill has already been entered, which for an implicit invocation is one step too late.

## D-port-precedes-the-drift-guards — The ordering rationale assumed an approach now out of scope

**Scope:** prod
**Topic:** harness-port
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** `docs/ROADMAP.md` places `harness-port` third, behind `command-file-drift-guards` (B-004, B-010, B-002), because the port "rewrites all 20 files and would otherwise edit 16 of them twice."
**Décision:** `command-file-drift-guards` is not a blocker for the port; the roadmap entry's `needs:` is stale and should be dropped by `/esq:roadmap`. The port was nonetheless parked for an unrelated reason — see [[D-park-the-port-while-esq-is-load-bearing]].
**Raison:** That rationale was written against B-006's abstract-verb rewrite, which this work explicitly puts out of scope. Under the marker approach nothing is rewritten, and B-010's work — registering the `announce-open` block in `check-sharedblocks.sh` — touches a different marker family in a different registry with no overlap. B-004 and B-002 are unrelated to the port entirely.
**Tradeoff:** Gained the freedom to sequence the two on their own merits; accepted that the roadmap now carries a dependency edge nobody has removed yet.
**Conséquences:** A roadmap dependency justified by an implementation approach must be re-read when the approach changes, not inherited. This one survived a brief and a plan before anyone checked its premise.
**Alternatives rejetées:** Absorbing B-004/B-010/B-002 into this plan's first phase — rejected: unrelated work inflating a plan whose parity requirement already makes every extra edit suspect. Honoring the stated order — rejected once its premise was found not to hold.

## D-harness-contract-is-the-external-referent — The capability list is a document, not a list inside the checker

**Scope:** arch
**Topic:** harness-port
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** The port's first design had the marker kinds enumerated inside `check-harness.sh` and re-described in `adapters/codex.md` and the conformance fixture. Reviewing it, the architecture across two harnesses could not be stated: "same essence" was a judgment made per span with no document to make it against.
**Décision:** `docs/HARNESS.md` holds one entry per capability — id, essence in user terms, the obligation a command may assume, and the conformance assertion proving a target provides it. `adapt.sh`, `check-harness.sh` and `conformance.sh` all read it; none may carry its own copy of the list, and each fails loudly if it is missing or malformed.
**Raison:** A checker validating markers against a registry it owns is a chain checked link to link — it confirms consistency and audits nothing. Naming the external referent turns "this target is equivalent" from an assertion into a passing assertion, and turns a third target from a judgment call into a filling-in exercise with a definition of done. It also makes the parity ledger a test rather than a table in a brief.
**Tradeoff:** Gained one place where the abstraction is stated and three consumers that must agree with it; accepted one more document that can rot, and a rule (contract entry before marker) that every future command edit has to honor.
**Conséquences:** Adding a capability means editing `docs/HARNESS.md` first; a marker naming an undefined id is a hard error. An entry describing a *mechanism* rather than an essence silently makes Claude Code's implementation the standard, so the essence wording is the part worth reviewing.
**Alternatives rejetées:** The registry inside `check-harness.sh`, following `check-sharedblocks.sh`'s precedent — rejected: that registry lists *carriers* of a block whose content is self-evidently the referent, whereas here the referent is a claim about behavior and has to be written down. Deriving the list by scanning the markers — rejected outright: it makes the code the specification, so a capability accidentally dropped from every file would pass.

## D-park-the-port-while-esq-is-load-bearing — Planned and parked, not started

**Scope:** prod
**Topic:** harness-port
**Date:** 2026-08-15
**Statut:** Active

**Contexte:** The port was fully planned on 2026-08-15 with the dependency on `command-file-drift-guards` found not to hold, leaving nothing technical between the plan and Phase 1. esq is in heavy daily use on this machine across several codebases.
**Décision:** The plan is committed and Phase 1 is not started. The work resumes on a real need to run esq under Codex, and when it does it is built on a `/esq:worktree`, never on `main`.
**Raison:** Every phase edits `commands/esq/*.md`, which is the same source `./scripts/install.sh` deploys to a single machine-wide `~/.claude/commands/esq/` with no per-project isolation and hot reload into running sessions. The exposure is not the Codex target — that is additive and revertible by deleting a directory — it is a half-markered command set reaching a session mid-work. Nothing about the port gets harder by waiting now that the design is written down; B-006's "more expensive by waiting" argument was about the abstraction landing before more files accumulate concrete tool names, and the plan is that abstraction.
**Tradeoff:** Gained an untouched live command set during the weeks it is most used; accepted that four dated Codex facts in the plan will need re-verifying, and that any command edited meanwhile is one more file to marker.
**Conséquences:** `B-006` stays `Planned by harness-port-adapter-layer` — the plan is the durable artifact and the row is how `/esq:build` finds it again. The plan carries a `## How to resume` section with the worktree instruction and the four claims to re-check. The roadmap entry should move out of `Now`, which is `/esq:roadmap`'s call, not a hand edit.
**Alternatives rejetées:** Starting Phase 1 on `main` behind the installer's guards — rejected: guard 1 protects against installing *from* a worktree, and nothing protects a plain `./scripts/install.sh` on `main` mid-port, which is the actual hazard. Dropping the plan and re-planning later — rejected: the research and the parity reasoning are the expensive part and they are already paid for.

## D-narrow-the-read-not-the-plan-file — Narrow the read, don't split the plan file

**Scope:** arch
**Topic:** build
**Date:** 2026-08-17
**Statut:** Active — amended 2026-09-15 by [D-build-asks-the-cli-for-its-plan-context]: where `esq` is available the phase agent no longer derives the spans itself — `esq next-phase <plan> --context` computes them and returns the selected text with the classification, and the skeleton grep is the fallback for the temporary legacy path. **Which slices are read is unchanged** — the same plan section, the same appendix, the same newest and `⏸` entries — so the narrowing this decision bought stands exactly as written, and the Conséquences below still bind: a field a phase agent needs must still be locatable by that one expression, because the fallback still has to find it.

**Contexte:** `/esq:build` reads the plan file in full every phase, so the execution log is re-read whole once per phase — measured at 7.0k, 8.5k then 10.3k tokens across three consecutive phases of one plan (B-017).
**Décision:** The log stays in the plan file; the phase agent derives spans from one skeleton grep and reads only the entry headers, the newest entry and any `⏸` entry.
**Raison:** The alternative that keeps the read simple — rotating older entries into a `<slug>.log.md` sidecar — splits the artifact that `/esq:check`, `/esq:status` and `/esq:autopilot` all read, and makes a phase's log-write a two-file operation that can half-fail. "The file is the state, not the session" is the invariant those commands are built on, and a token bill is not worth spending it. Trimming the entry template instead (the third option) leaves the read linear in phase count with a smaller constant, and it is already B-012's territory.
**Tradeoff:** Gained a log-read cost that is constant in phase count and no change to any other command; accepted a longer preflight procedure in `build.md`, in a repo actively trying to shrink `commands/esq/`.
**Conséquences:** Any future field a phase agent needs from the log must be locatable by the skeleton grep — a heading, or a `**Field:**` line registered in the procedure. Content buried mid-entry is no longer reachable by a targeted read, which is a constraint on the entry template from here on.
**Alternatives rejetées:** Sidecar rotation (splits the state file, four readers to update, half-failing writes). Shrinking the entry template (does not change the shape of the growth, and trades away content `/esq:check` audits).

## D-anchor-is-the-plan-file-head-at-read-time — The continuity anchor is the plan file's HEAD at preflight

**Scope:** arch
**Topic:** build
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** `/esq:build`'s continuity check reads `Plan committed at <commit>` from the newest execution-log entry, but neither entry template ever wrote it — the two plans carrying it improvised two different shapes, one per session. A targeted read cannot tolerate that ambiguity.
**Décision:** `**Plan committed at:** <short-hash>` is the first field line of both entry templates, and the hash is `git log -1 --format=%h -- <plan-path>` computed once in preflight, before the invocation commits anything, and reused for every entry that run writes.
**Raison:** The check asks whether the plan section changed since the most recent entry, so the anchor must mean "the state of the plan file I read". Preflight HEAD says exactly that and is one deterministic command; the observed alternative — carrying the plan's authoring commit forward across every entry — makes the diff include every intervening log commit, which the check then has to reason past.
**Tradeoff:** Gained an anchor that is computed identically by every session and a diff that is empty in the normal case; accepted that entries predating this change carry no anchor and need a documented fallback.
**Conséquences:** The fallback for legacy entries is the newest commit touching the plan file whose subject matches `^plan(` — build's own log, pause and confirm commits — and no continuity check when there is none. Renaming those commit subjects would break it.
**Alternatives rejetées:** The plan's authoring commit copied forward (diff includes all log commits since; relies on copying rather than computing). Recomputing `git log -1` at check time instead of reading the entry (it returns the current state, so the check would silently always pass).

## D-one-skeleton-grep-two-carriers — One skeleton grep, carried by build and autopilot

**Scope:** arch
**Topic:** build
**Date:** 2026-08-17
**Statut:** Active — amended 2026-09-15 by [D-build-asks-the-cli-for-its-plan-context]: `build` still carries the block, byte-identical and hash-enforced, but now as its CLI-unavailable fallback rather than as its route; `/esq:autopilot` carries it unchanged as its route. One definition of the file's structure, two carriers, and the regex remains the thing both a fallback reader and autopilot depend on.

**Contexte:** `/esq:build` derives the plan file's structure from a skeleton grep (D-narrow-the-read-not-the-plan-file); `/esq:autopilot` needs the same structure to classify phases and collect commit hashes, and today reads the plan and the whole log instead (B-019).
**Décision:** One expression — `^#{1,3} |^\*\*(Plan committed at|Commits):\*\*` — defined in a `shared:log-skeleton` marker block registered in `scripts/check-sharedblocks.sh` and carried identically by `build.md` and `autopilot.md`; each command states outside the markers which derived values it uses.
**Raison:** The regex is the whole design of the targeted read — the previous plan's Risks said so — and a silently wrong span is the failure mode. Two independent regexes describing one file format is exactly the drift the shared-block mechanism exists to prevent, and CLAUDE.md makes registration the standing answer for a rule two commands must both carry. The narrower autopilot-only regex saves 52 grep lines per read against the 293 the change recovers, and loses the `A` boundary that keeps a post-log appendix from being read as log.
**Tradeoff:** Gained one definition of the file's structure, hash-enforced by `audit.sh` check 22, and eight extra grep output lines for `/esq:build` on an eight-entry plan; accepted a restructure of a preflight step that shipped the same day, plus one registry line and two marker pairs.
**Conséquences:** Any field a future reader needs from the log must enter this one expression, and every carrier pays for it. `/esq:converge` references the classification rather than carrying the block — it derives nothing — and adding it as a carrier later would duplicate text it does not use.
**Alternatives rejetées:** A narrower autopilot-only regex (two regexes for one format, no `A` boundary, ~1% of the saving). Caching the preflight classification and never re-reading (converts "decide from the execution log, never from a subagent's self-report" into "decide from what I remember").

## D-verification-arbitrates-an-unlogged-phase — Verification, not commit matching, decides whether a phase already ran

**Scope:** arch
**Topic:** build
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** A build run that dies between its last task commit and its log append leaves a completed phase indistinguishable from one that never started (B-020), so `/esq:build` re-executes work already in the tree and `/esq:autopilot` halts on a phase that succeeded. Reconciling means deciding, mechanically, that a phase "is already done" — and the only evidence on hand is commit subjects and the working tree.
**Décision:** Unlogged commits in `<continuity-anchor>..HEAD` matching this phase's tasks only *trigger* reconciliation; the phase's own `(auto)` verification steps decide, and a failing verification falls through to executing the phase exactly as today.
**Raison:** A reconciled entry is read by every later phase and by `/esq:check` as though it were built, so it must be proven to the same standard — and the `(auto)` steps are that standard for every normal phase. Commit-subject matching is a string comparison whose one success (the manual recovery in B-020) worked because the subjects happened to match verbatim; a near-match would log a phase complete with a task that never landed. Keeping the two conditions conjunctive also blocks the vacuous-verification case, where a `grep returns no results` step passes before the phase runs.
**Tradeoff:** Gained a reconciled entry that is exactly as trustworthy as a built one, at the cost of one verification run — which the re-run path was going to pay anyway.
**Conséquences:** Reconciliation is bounded to one phase per invocation and continues into the next phase, mirroring the self-observed paused-phase rule. Ambiguous evidence is reported and then executed rather than gated, following `/esq:status`'s posture on the identical signal — so no new stop enters `/esq:build`. `/esq:autopilot` gains one bounded reconcile pass per phase whose entry is missing.
**Alternatives rejetées:** Commit-subject matching as the arbiter (cheapest, but the proof is a string comparison and the failure is a wrong log entry nothing downstream distrusts). Gating on any unlogged commit (fires on every stray doc fix, contradicts `/esq:status`'s "report it; do not diagnose it", and neither option can carry a `do:` that runs as written without inventing a build flag).

## D-count-phases-not-spawns-against-the-cap — The phase cap counts phases, not spawns

**Scope:** func
**Topic:** autopilot
**Date:** 2026-08-17
**Statut:** Active

**Contexte:** `/esq:build` reconciles at most one phase per invocation and, because reconciling writes no code, continues into the following phase (D-verification-arbitrates-an-unlogged-phase). So a single phase agent can return with execution-log entries for phase N *and* phase N+1, which `/esq:autopilot`'s loop — one spawn, one phase, then re-read the log — had no rule for. Its `/esq:autopilot <plan> 3` cap became ambiguous the moment that became possible.
**Décision:** The cap counts phases that got logged, not subagents spawned: autopilot records a report line per logged phase, charges each against the cap, and advances the loop past all of them — never re-spawning a phase that already carries a `completed` entry.
**Raison:** The cap is the user's instrument for bounding how much unwatched work lands, and what lands is phases, not agents; counting spawns would let a three-phase cap ship five phases. Advancing past both is not optional either — re-spawning a logged phase is running it twice, which the announced bound forbids and which the classification table already reads as done. Counting phases also keeps the number in the report meaning the same thing whether or not a reconciliation happened.
**Tradeoff:** Gained a cap that bounds what it claims to bound and a loop that cannot double-run a phase; accepted that the number of subagents a run spends is now less predictable than the number of phases it delivers — which is why the announcement states the per-phase rate rather than a total.
**Conséquences:** Any future change letting one `/esq:build` invocation cover more than two phases inherits this rule for free. The cap can be reached mid-spawn, so a run may stop with a phase logged that autopilot did not itself request — the report must show it, which the per-phase line already does.
**Alternatives rejetées:** Counting spawns (simpler to implement, but a cap of 3 could deliver 6 phases — it stops bounding the thing the user set it to bound). Forbidding build's reconcile-then-continue under an orchestrator (would re-introduce a session-shaped stop for a bookkeeping repair, and autopilot cannot tell build to behave differently without paraphrasing its procedure).

## D-subagent-stop-telemetry-from-transcript — SubagentStop telemetry from the agent transcript

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-18
**Statut:** Active

**Contexte:** Subagents run in the background by default since Claude Code v2.1.198, so the `PostToolUse` Agent response carries no usage for them and the first production autopilot recorded nothing (B-023). Probed 2026-08-18: `SubagentStop` fires for every run but its payload carries no usage, duration or model — only `agent_transcript_path`, the subagent's own JSONL, whose assistant lines hold `message.model`, `message.usage` and timestamps.
**Décision:** `SubagentStop` becomes the primary writer of `telemetry/agent-runs.jsonl`, deriving whole-run usage as the sum of the last usage per `message.id`, models, duration and tool count from that transcript — numbers, ids and timestamps only, never a text block; `PostToolUse` remains as a fallback and whichever event fires second skips on a seen `agentId`.
**Raison:** It is the only channel the harness offers to a background run's cost, and the run total it yields is truer than the final-request-only fields of `PostToolUse`. The transcript's line schema is private, so every read is optional-chained and degrades to `runUsage: null` with a `transcriptComplete` flag rather than a throw or a silent zero.
**Tradeoff:** Gained a datapoint for every subagent run, autopilot phases included; accepted a dependency on an undocumented file shape, held by defensive parsing and a visible null.
**Conséquences:** Supersedes the "parse private transcripts" rejection in `D-hook-telemetry-stops-at-observable-usage`; its other half — no invented monetary cost — stands. A run of null usages after a Claude Code upgrade means the schema moved and the parser needs a look.
**Alternatives rejetées:** Record only the payload's ids at `SubagentStop` (stable but answers nothing about cost); pair `SubagentStart`/`SubagentStop` for a harness-authoritative duration (a second hook and a marker file for a precision nothing needs).

## D-telemetry-dedupe-by-claim-file — Telemetry dedupe by claim file

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-18
**Statut:** Active — amended 2026-08-19 by [D-whole-run-record-supersedes-fallback]: the claim file stays the serialization primitive, but *first writer wins* gives way to *most complete record wins*; two rows for one agentId with different sources are now expected, two with the same source still mean the claim path was bypassed.

**Contexte:** A foreground subagent run fires both `PostToolUse` and `SubagentStop` within the same few hundred milliseconds, in no documented order. The planned dedupe — each handler scans `agent-runs.jsonl` for the agentId and skips on a hit — lost the race in the Phase 1 live probe: `SubagentStop`'s bounded lag wait sits between its scan and its append, `PostToolUse` landed in that window, and one run left two lines.
**Décision:** `appendRun` takes an exclusive-create claim file per agentId (`telemetry/.claim-<agentId>`, `open(..., 'wx')`), re-checks the file under the claim, appends, then unlinks the claim; a handler that hits `EEXIST` skips.
**Raison:** Exclusive create is atomic on every filesystem Node runs on, so first-writer-wins holds in either order or at the same instant, which a narrower check-then-act window never guarantees. It costs one tiny transient file per run and no lock library.
**Tradeoff:** Gained a dedupe that does not depend on timing; accepted that a crash between claim and append leaves that one run unrecorded — never duplicated — and a stale `.claim-*` file behind.
**Conséquences:** Anything that adds a third writer to `agent-runs.jsonl` goes through `appendRun` and inherits the guard. Two identical lines for one agentId in the file now mean the claim path was bypassed, not that the events raced.
**Alternatives rejetées:** Re-check `hasRecord` immediately before the append (shrinks the window to the append's latency, does not close it — the two events are dispatched at nearly the same instant); a permanent per-agent marker file as the dedupe record (correct, but accumulates one file per run forever); a file lock library (a dependency for the one thing `wx` already does).

## D-opus-default-sonnet-only-mechanical — Opus by default, Sonnet only where confirmed enough

**Scope:** arch
**Topic:** skills
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** The plugin cutover (4b95cf9) turned the README's old *recommendation* of Sonnet into a
frontmatter pin on 19 of 20 skills — so a user running an Opus session would have every plan, build
and review silently downgraded (if the pin takes effect; see B-026). The 2026-08-18 external review
called it out; the user's standing rule is Opus everywhere except where Sonnet is confirmed good enough.
**Décision:** `model: opus · effort: medium` on every skill that plans, builds, reviews, sizes,
projects or reads a codebase — including the three orchestrators, so a subagent they spawn never
inherits less than the skill it runs. `model: sonnet` stays on the five whose work is schema-bound
with the deterministic CLI owning structure: `status`, `backlog`, `epic`, `sweep`, `worktree`.
`ui` keeps `high` effort. Any further downgrade requires telemetry evidence (B-028, B-029) —
never a guess about what "should" be enough.
**Alternatives rejetées:** Keep Sonnet and bump per run (the pin makes the session model
irrelevant, so "bump" is a source edit nobody makes mid-run); `inherit` everywhere (a Sonnet
session would then silently downgrade the judgment skills — the exact failure the pin exists to
prevent).
**Conséquences:** ~5× token price on the judgment skills relative to Sonnet, accepted; the cost
pass now looks for redone work and unbounded runs, not for a cheaper model. **The orchestrator
clause above is superseded by `D-relay-sonnet-workers-explicit-opus` (2026-08-19):** the three
orchestrators are pinned `sonnet`, not `opus`, so the Sonnet set is eight rather than five, and a
worker is put on Opus by the explicit `model` field of the `Agent` spawn rather than by the relay
inheriting its own pin. The rest of this decision — Opus by default on every skill that plans,
builds, reviews, sizes, projects or reads a codebase, and no further downgrade without telemetry —
stands, and is the schema-bound authority the newer decision cites.

## D-model-pin-probe-reads-stream-json — The model-pin probe reads the headless `stream-json` stream, not transcript files

**Scope:** infra
**Topic:** skills
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** B-026 observed a `model: sonnet` pin read by the harness yet every request of the
session and of its phase subagent running on Opus. Deciding whether the README's model table and
D-opus-default-sonnet-only-mechanical mean anything needs a probe that shows, per invocation path
(user-typed, `Skill` tool, `Skill` inside `Agent`, `context: fork`), which model actually served.
**Décision:** `scripts/probe-model-pins.mjs` runs four `claude -p --output-format stream-json
--verbose --forward-subagent-text` sessions on Opus against a fixture plugin whose skills pin haiku
(`tests/fixtures/model-pin-probe/`), and reads each `assistant` line's `message.model` grouped by
`parent_tool_use_id`, cross-checked against the `result` line's `modelUsage`. It is on-demand only.
**Raison:** The stream is the harness's documented output channel and carries the subagent nesting
tree explicitly (`parent_tool_use_id`, nested depths since 2.1.219); the reading is a pure function
testable on a saved capture. Reading `~/.claude/projects/…` transcripts (the item's own suggestion)
depends on an undocumented layout, touches the directory this repo's critical rule forbids, and on a
subagent-transcript lifetime that is itself the open question in B-027.
**Tradeoff:** Gained: no filesystem archaeology, a testable reader, one stream per run. Accepted:
four billed runs per probe (never in `audit.sh`), and a dependency on `--forward-subagent-text`
(Claude Code ≥ 2.1.211).
**Conséquences:** B-029 measures against this probe's table rather than the B-026 anecdote; the
`--out` captures double as raw evidence for B-027; a pin found ignored on any path becomes a new
backlog item, not an edit to the pins.
**Alternatives rejetées:** Transcript files under `~/.claude/projects` (undocumented layout, live
config dir, B-027's lifetime question); a hook-based capture (hook payloads carry no model field —
established in the SubagentStop telemetry plan — so it collapses into transcript reading).

## D-skip-untyped-transcriptless-subagent-stops — Skip untyped, transcript-less SubagentStop events

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** In production 29 of 30 rows of `telemetry/agent-runs.jsonl` were `SubagentStop` records with `agentType: ""`, no models and null usage (B-027). Read off the Claude Code 2.1.235 bundle on 2026-08-19: the harness builds the payload with `agent_type: a ?? ""` and derives `agent_transcript_path` from the id, and its own recap/title/progress queries run in an agent context and fire the event — one phantom row landed 40 ms after a `system/away_summary` line, 26 landed at a ~31 s cadence while a background agent ran and the main conversation was idle. The `Agent` runner always passes a real `agent_type`.
**Décision:** `recordSubagentStop` returns without writing when `agent_type` is empty **and** the transcript is unreadable; every other stop — typed, or untyped with a transcript — is recorded exactly as before.
**Raison:** The two conditions are already computed by the handler, the rule is provable by `node --test` offline, and it cannot drop a real subagent: real runs carry a type from the runner, and a fork-shaped run without one still has a transcript from its first line. A row that names no agent and no usage answers nothing the file exists to answer.
**Tradeoff:** Gained a file whose rows are runs; accepted one async node spawn per internal query (tens of milliseconds, off the session's critical path) and a dependency on measured rather than documented `agent_type` semantics, watched by counting `"agentType":""` rows after each Claude Code upgrade.
**Conséquences:** The 29 historical phantom rows stay in the live file (never touch `~/.claude`); B-028's summary treats `agentType: ""` with null usage as noise. Whether an interrupted (`TaskStop`'d) subagent is recorded is measured by the plan's probe and, if not, becomes a backlog row rather than a workaround.
**Alternatives rejetées:** A `hooks.json` `SubagentStop` matcher on a non-empty agent type (zero spawn cost, but empty-string matcher semantics are undocumented, untestable offline, and a wrong guess silently drops every row); writing every stop tagged `kind: "internal"` for readers to filter (grows the file at the harness's recap cadence — 26:1 in the measured session — and pushes the filter into every future reader).

## D-esq-state-carries-status-facts — `esq state` carries the facts `/esq:status` reports

**Scope:** arch
**Topic:** cli
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `/esq:status` was told to run `esq state` once and skip its scans, but the JSON held
plans in `readdir` order without mtime or `activePlan`, and the backlog as counts only — so every run
either re-scanned or guessed (B-031, external review 2026-08-18).
**Décision:** Extend `state()` in place: `plans[]` sorted by mtime with `activePlan`, `backlog.counts`
plus `backlog.rows` for Open / Needs-decision / Planned (with `source`), and `roadmap.head` from the
top `## Now` entry; the status skill's steps then name the field they read.
**Raison:** `state` has one reader and that reader's steps are the contract; a second subcommand
would be a second JSON shape kept in step for a caller that does not exist, and dropping the rule
would spend model tokens at every session start on files the CLI can hand over deterministically.
**Tradeoff:** Gained one call that makes the no-rescan instruction true and keeps the Sonnet pin's
justification; accepted a `backlog` shape change (counts move under `counts`) that touches the one
existing test and the skill paragraph.
**Conséquences:** `esq state` is the read model for `/esq:status`; a status step that needs a new
fact adds it to `state()` and its fixture test rather than reading the file in prose. `Planned` rows
travel with their `source` so Step 4.5 needs no table read.
**Alternatives rejetées:** A separate `esq status-facts` subcommand (two parsers over the same files,
no second caller); letting `/esq:status` re-scan and deleting the rule (concedes B-031 and the cost the
CLI exists to remove).

## D-fork-verdict-from-usage-synthetic-not-a-request — Fork rows are judged from `modelUsage`; `<synthetic>` is not a request but satisfies the guard

**Scope:** arch
**Topic:** model-pins
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** On Claude Code 2.1.235 a `context: fork` skill's subagent lines are not forwarded into the headless `stream-json` output even with `--forward-subagent-text`; the parent stream carries one `<synthetic>` assistant line with the fork's reply and a `result.modelUsage` billing the pinned model only. The probe's first reading called that row `not invoked`, and after `<synthetic>` was filtered its exit-2 guard ("no assistant line carried `message.model`") tripped on it.
**Décision:** `<synthetic>` never counts as a request (its text counts, its model does not); a subagent-scope row with no lines but a delivered reply is judged from `modelUsage` with a verdict that says so (`honored (via modelUsage)`); the exit-2 guard trips only when no assistant line at all carried `message.model` — a `<synthetic>` line satisfies it (option A, chosen by the user over B: "a delivered reply counts").
**Raison:** The plan's guard, read literally, is about the field being present, and the synthetic line has it. Reading the fork from usage is the only evidence left and labelling it keeps a reviewer from mistaking it for a per-request reading. `modelUsage` alone is not evidence in general — every Opus session also lists the harness's own auxiliary haiku call — so the fallback is confined to the case where nothing better exists.
**Tradeoff:** Gained: the fork row is measured rather than aborted or mislabelled, and the guard still refuses a stream with no model field. Accepted: the fork verdict is a weaker reading than the other three rows', flagged in the verdict text rather than in a separate column.
**Conséquences:** A future Claude Code that forwards fork lines will silently upgrade that row to a per-request verdict; one that stops forwarding `Agent` lines would fall to the same usage reading, again labelled. B-029 should read the fork row as "usage-level" evidence.
**Alternatives rejetées:** B — trip the guard only when neither a model line nor the word `pinned` arrived (loosens the plan's stated refusal to a reply check); dropping the guard entirely (a stream with no model field would print four `not invoked` rows and exit 0, which reads as a measurement).

## D-telemetry-summary-is-a-cli-subcommand — `esq telemetry summary` is a read-only CLI subcommand

**Scope:** arch
**Topic:** cli
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `agent-runs.jsonl` had a writer and no reader (B-028); the live file mixes whole-run
`SubagentStop` rows, pre-fix untyped empty rows, and `PostToolUse` fallback rows whose usage is one
API request, and `CLAUDE_PLUGIN_DATA` is not visible from a skill's Bash tool.
**Décision:** Add `esq telemetry summary [--json] [file…]` in the plugin CLI: a human report by default
(header, then per-command / per-agent-type / per-model tables with totals and medians), JSON on
`--json`, read-only, discovering
`~/.claude/plugins/data/esq-*/telemetry/agent-runs.jsonl` (or `CLAUDE_PLUGIN_DATA`, or named files);
a row's model is the transcript `models[]` (joined `+` when several) or `resolvedModel` for fallback
rows — `modelsUsed` is never read (B-035); `agentType: ""` + `runUsage: null` rows are counted as
skipped history; fallback rows count as runs with tool calls and duration but never feed the token
sum; every output carries the note that interrupted runs are absent on Claude Code ≤ 2.1.235 (B-036).
**Raison:** Arithmetic over a JSONL file is exactly what `D-cli-owns-structure-model-owns-judgment`
keeps out of the model; a subcommand is unit-testable offline and is the machine-readable substrate
B-029 needs. Folding it into `esq state` would make every session start depend on the home directory
for numbers status does not report.
**Tradeoff:** Gained one deterministic, testable reader a person can read in a terminal; accepted
one exception to "every `esq` subcommand emits JSON" (the default is text, `--json` restores it), and
that `esq-inline` and `esq-esquisse` rows are pooled (listed in `files[]`, un-pooled by an explicit path). **The
discovery clause "(or `CLAUDE_PLUGIN_DATA`, or named files)" is amended by
`D-cli-ignores-plugin-data-env` (2026-08-19):** the CLI's discovery no longer honors the variable —
it was measured invisible from a skill's Bash in this very entry's Contexte, so the only values the
CLI ever saw were foreign exports, and one blinded the post-spawn model assertion live (B-048).
Named files remain the un-pooling lever; the rest of this decision stands.
**Conséquences:** B-029 (measured tiers) and B-030 (lean lane) consume this summary, not the raw
file; a rendered view, if ever wanted, sits on top of it in `/esq:status`; the B-036 note is
re-probed per Claude Code upgrade and dropped when an interrupted agent gets a row.
**Alternatives rejetées:** A `/esq:telemetry` skill (model re-spends tokens to add numbers, three
README tables and the long-run check gain an entry, B-029 still needs numbers underneath); folding
the totals into `esq state` (every `state` caller pays the scan, and `state` stays repo-scoped);
attributing a multi-model run's whole usage to each model (double-counts; the `+` key keeps sums
additive).

## D-esq-spawns-labelled-by-description-prefix — esq spawns are labelled by an `esq:<command>` description prefix

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** A telemetry row names the agent type, never the esq command; every autopilot /
converge / advance subagent is `general-purpose`, so a per-agent-type summary of esq's own work is
one bucket. Per-command cost is what B-029 needs and what the user asked the summary to show.
**Décision:** The three orchestrators start every `Agent` call's `description` with `esq:<command>`
(`esq:build`, `esq:check`, `esq:review`, `esq:fix`, `esq:work`, `esq:apply`); the `PostToolUse`
handler runs one anchored regex and appends an `AgentLabel` row holding the slug and the agentId —
never the description, prompt or response; `esq telemetry summary` joins labels onto records.
**Raison:** Chosen by the user on 2026-08-19 over the alternatives: it is one sentence in a shared
block the orchestrators already carry plus a few hook lines, it needs no live probe, and a miss is
visible as `unlabelled` rather than silent. A label with no record also gives the first measurable
edge of the interrupted-run gap (B-036).
**Tradeoff:** Gained per-command cost at minimal change; accepted that the label relies on the
orchestrator following the instruction and that the file carries a second row kind the reader joins.
**Conséquences:** The record's text-free contract now admits one enumerated slug; `hasRecord` must
ignore label rows; if labels prove unreliable on real runs, plugin agent definitions (agentType as
the command) are the structural upgrade.
**Alternatives rejetées:** Plugin agent definitions (`plugin/agents/esq-build.md`, …) — cleanest
data and a home for per-step model pins, but two more phases, six orchestrator files and a probe of
namespacing and tool inheritance; deferring per-command cost to a later item — cheapest today, but
the summary would be correct and useless on esq's own runs.

## D-roadmap-horizons-uncapped — Roadmap horizons are uncapped; `why now` is the only admission test

**Scope:** func
**Topic:** roadmap
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `/esq:roadmap` capped its horizons at 3 / 4 / 5 entries (12 total) and framed the
cap as the thing that kept the file from becoming the backlog re-sorted. `/esq:advance` cited the
`Now` cap of 3 as its cost bound. The user asked for unlimited items per section.
**Décision:** No horizon has a cap, per section or in total. The admission test is unchanged and now
carries the whole weight: an entry exists only when its position relative to other work is a real
judgment, shown in a `why now` line that justifies the position. `/esq:advance`'s bound is the
count of open items in `Now`, which it reads and announces before spawning anything.
**Raison:** The count was a proxy for the rule; the rule is what the reader needs. A short `Now`
padded to three, or a real sequence of six truncated to three, both make the file lie about the
order — which is the one thing it exists to state.
**Tradeoff:** Gained a roadmap that can hold the real sequence; accepted that a long `Now` makes an
`/esq:advance` run longer — bounded by the announced item count, not by a constant.
**Conséquences:** Mode C moves never displace an entry; Mode A never drops a "thirteenth" entry;
README, SPEC, ARCHITECTURE, CLAUDE.md and the ROADMAP.md header no longer state a cap.
**Alternatives rejetées:** Keeping a cap on `Now` only (as advance's bound) — the bound is already
stated from the count read in preflight, so the cap bought nothing the announce line does not.

## D-bounded-subprocess-runner — Audit subprocesses run through one extracted bounded runner

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `audit.sh` checks 30/31 ran `node --test` with no bound and output discarded; in a
managed sandbox the hook suite's `spawnSync` end-to-end test hung and the audit never returned
(B-033). The `claude plugin` calls in checks 26/29 were unbounded the same way.
**Décision:** The node suites (checks 30/31) run under `scripts/check-bounded.sh
<bound-s> <label> -- <command…>` (GNU `timeout --kill-after=5`, diagnostics captured and printed on
failure, exit 124 reported as a named timeout), with node's `--test-timeout` and `child_process`
`timeout:` options as the inner layer; the `claude plugin` calls in checks 26/29 carry the same
timeout inline with mirrored wording (D-claude-calls-bounded-inline-positional);
`scripts/test-bounded-guard.sh` fault-injects a hang, a failure and a clean run. Bounds are literal arguments (120 s per suite, 30 s per test, 60 s per
`claude` call), never environment variables.
**Raison:** The outer `timeout` is the only layer that catches the hang observed — `spawnSync`
blocks the event loop, so node's own timers cannot unwind it. Extracting the runner is what makes
the fault injection cost four sub-second cases instead of a re-run of the whole audit
(`audit-scripts` rule 1, D-the-auditor-pays-its-own-cost-rule). An inline `timeout` on two lines
would be unproven, and a check with no fault injection is the class of defect this repo mechanized
against.
**Tradeoff:** Gained an audit that always terminates with a red line naming the suite and the bound,
and kept diagnostics; accepted one new script pair, a check renumber (32/33 → 33/34) with its
citation updates, and a ~1 s guard case on every audit run.
**Conséquences:** A new audit subprocess that can hang goes through the runner or carries a literal
`timeout` with a named finding — never bare. A sandbox-only hang is a named, bounded red, never a
silent pass or a warning; classifying it as environment vs product defect is done by re-running the
command directly, which the finding text says.
**Alternatives rejetées:** Inline `timeout` on the two call sites — no fault injection without
re-running the whole audit, output still swallowed. Node-only bounds (`--test-timeout`, per-call
`timeout:`) — cannot bound a `spawnSync` hang or a hang in the test runner's child plumbing, which
is the case observed; kept as the inner layer only.

## D-esq-state-degrades-per-source — `esq state` degrades per source, never wholesale

**Scope:** arch
**Topic:** cli
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `state()` let `parsePlan`/`nextPhase` throws and any non-`ENOENT` backlog error escape,
so one malformed plan or an ID-less backlog table made `esq state` exit 2 with no JSON — and
`/esq:status`, which reads its facts off that JSON since D-esq-state-carries-status-facts, had a
fallback written only for `esq` *absent* (B-034, external review 2026-08-19).
**Décision:** `state()` catches per source: a malformed plan becomes `{ file, mtime, state: "invalid",
error }` in `plans[]` (still mtime-sorted, so it can hold `activePlan`), a malformed backlog becomes
`backlog: { error }` with no counts/rows; git and roadmap facts always return. `/esq:status` treats
`esq` present as the primary path even when partial — unreadable sources land in the NEEDS YOU zone
with their error, and the next action is computed over the healthy facts.
**Raison:** The error messages already exist in `validate()` per file; reusing them keeps the two
commands naming one fault identically, and the healthy facts are exactly what the snapshot is for.
A failed `esq state` that sends the model back to prose scans spends tokens re-deriving what the
CLI knows, on the trees most likely to be large — the cost class CLAUDE.md forbids.
**Tradeoff:** Gained a snapshot that always exists and names its own holes; accepted a third
non-phase `state` value every reader must check before touching `phase` (today: status only).
**Conséquences:** Any new reader of `plans[]` checks `state` before `phase`/`entry` and `backlog.error`
before `counts`; `esq validate` remains the command that *exits* on a fault. Plan:
`docs/plans/2026-08-19-graceful-state-degradation.md`.
**Alternatives rejetées:** `state()` validating first and refusing with findings — a softer exit code
that still drops every healthy fact (explicitly rejected by the review). `/esq:status` falling back to
prose scans on a nonzero `esq state` — re-reads every plan and the whole table with Sonnet on a file
the deterministic parser already rejected.

## D-whole-run-record-supersedes-fallback — The whole-run record supersedes the fallback row

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** Under D-telemetry-dedupe-by-claim-file the first handler to claim an agentId writes and the other skips. When `PostToolUse` lands first (measured: 303 ms ahead of `SubagentStop` on the pre-claim pair `aff07359`, and three fallback-only rows since the claim landed), the transcript-bearing `SubagentStop` row is skipped forever and the run enters every median with no tokens — a biased sample, not a missing one (B-037).
**Décision:** A record *carries whole-run usage* iff `source === 'SubagentStop'` and `runUsage` is an object; under the claim such a record is appended even when a fallback row exists for the agentId, a record without it skips when any record exists; `SubagentStop` retries the claim a bounded number of times on `EEXIST`, `PostToolUse` skips. The reader (`summarizeTelemetry`) keeps one record per agentId, the one carrying whole-run usage, counts the replaced fallback under `supersededFallbacks` (distinct from `duplicates`), and reports every token-less run — fallback-only, no usage, zero usage — with no token sample from any of them.
**Raison:** The file stays append-only and the claim file stays the only serialization primitive; the reader already prefers the whole-run row, so the writer merely stops blocking it. A zero-token run is impossible for a real API request, so a zero-sum `runUsage` is a measurement failure to report, never a sample to median.
**Tradeoff:** Gained order-independent completeness for every run whose transcript the harness hands over, with the gaps named on every report; accepted two physical rows per run in the raw file when `PostToolUse` wins the first claim, and a bounded claim retry in the `SubagentStop` handler.
**Conséquences:** Anything reading `agent-runs.jsonl` goes through `summarizeTelemetry` or reimplements its per-agentId rule; `D-telemetry-dedupe-by-claim-file`'s "two lines mean the claim path was bypassed" now holds only for two lines of the same source. SPEC § Telemetry summary and § Session guards and telemetry are refreshed by `/esq:spec` after the plan ships.
**Alternatives rejetées:** Rewrite the file in place to drop the fallback row (a read-modify-write inside a hook, racing concurrent `AgentLabel` appends, cost growing with the file); make `PostToolUse` sleep so `SubagentStop` lands first (narrows the race, never closes it, and a wall-clock cost on every spawn); drop `transcriptComplete` to avoid reading the last assistant text for B-040 (every completeness check still reads the text; the invariant that matters is that none is ever written, which the tests hold).

## D-telemetry-sample-threshold-five-runs — A per-group figure is provisional below five token-bearing runs

**Scope:** func
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `esq telemetry summary` printed a median from one run with the same confidence as one from fifty, and B-029 (measured model tiers) reads those figures; B-039 asked for a stated minimum sample below which any tier or budget figure is provisional. The `AgentLabel`→record join was verified on the live files the same day (4 of 4 completed labelled runs join to a whole-run record; the 2 unrecorded labels were in flight — a label is written at `PostToolUse`, which for a backgrounded spawn fires at spawn time), so the rule sits on a join that holds.
**Décision:** Every group the summary seals (by command, agent type, model) carries `provisional: tokens.runs < 5`, where `tokens.runs` counts runs that contributed a token sample; the summary carries `sampleThreshold: 5`; the human report marks the runs cell (`4*`) and explains the marker once in the header; the labelled-but-unrecorded line says those runs may be in flight or interrupted (B-036). The threshold is an exported constant in `plugin/lib/telemetry.mjs`, not a flag.
**Raison:** Five is the conventional minimum cell count for reporting a figure from a small group (minimum-cell-count suppression practice, `n < 5`, checked 2026-08-19) and the smallest n at which a median has two observations on each side; counting token-bearing runs rather than all runs keeps a fallback-only run from making a token median look better-founded than it is. One rule in the one reader both consumers go through is what removes the ambiguity B-039 names.
**Tradeoff:** Gained a per-row sufficiency signal B-029 can gate on and a report that says "not yet" instead of a thin number; accepted that changing the threshold is a code change and that duration/tool-call medians share the flag even where they rest on more runs.
**Conséquences:** B-029 treats `provisional: true` as "do not argue a tier from this row", never as "exclude"; samples accrue from orchestrated runs (advance/autopilot/converge) and the marker drops off on its own; direct-run invisibility is B-038's. SPEC § Telemetry summary gains the rule via `/esq:spec` after the plan ships.
**Alternatives rejetées:** Suppress thin rows to `—` (hides the counts that say how far from sufficient a command is, and valid duration/tool-call medians with them); a `--min-sample N` flag (a config surface nothing sets, and two readers could disagree on what provisional means); counting all runs rather than token-bearing ones (a fallback-only run would raise the count without adding a token sample).

## D-direct-session-telemetry-stop-cursor — Direct esq commands are billed from the main-session transcript at Stop, through a per-session cursor

**Scope:** arch
**Topic:** hooks
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** Telemetry measured `Agent`-spawned subagents only; a user-typed `/esq:status` or `/esq:plan` left no row (B-038). The brief chose content-free main-session telemetry over a benchmark runner, a default-on opt-out, command-marker-to-next-marker segments, and a separate report section; it deferred the hook event, the file layout, how a running total is carried between Stops, and the opt-out semantics.
**Décision:** A fourth handler (`record-session-telemetry.mjs`) runs at `Stop` (async) and `SessionEnd`. Per run it reads only the bytes the transcript gained since the previous run for that session — a sidecar `telemetry/.cursor-<sessionId>.json` carries the byte offset past the last complete line, the open segment's accumulators and the last request id — and appends one **cumulative** row per open segment to `telemetry/session-runs.jsonl` (`source: SessionStop|SessionEnd`, keyed `(sessionId, segment)`, `via: typed|skill-tool`, `closedBy: null|command|session-end`, numbers/ids/timestamps/slug only); the reader keeps the last row per key and seals direct groups with the same `provisional` rule. A segment opens at a typed `<command-name>/esq:<cmd>` marker or a top-level `Skill` tool_use with `skill: esq:<cmd>`, closes at the next typed marker of any name, the next esq opener, or session end; a model-invoked non-esq `Skill` is not a marker. Both telemetry writers return early when `ESQ_TELEMETRY ∈ {0,false,off,no}` or `DO_NOT_TRACK ∈ {1,true,yes,on}` (`telemetryOptedOut` in `hook-io.mjs`); the Stop validator and the protect hook ignore it. The writer is serialized by an exclusive-create session claim, taken over when older than 30 s.
**Raison:** The per-turn bound must be a property, not a sentence: a cursor makes each Stop O(turn) where a re-parse is O(session) on files already 12 MB; Stop rather than SessionEnd keeps the running session visible to `esq telemetry summary` and loses at most one turn on a crash, where a SessionEnd-only writer loses every command of a session whose terminal was closed. A separate file because `agent-runs.jsonl`'s reader keys on `agentId` and would count a direct row as an anonymous subagent run.
**Tradeoff:** Gained bounded per-turn cost, in-session visibility and crash tolerance; accepted a sidecar per live session, one more node process per turn (~50–60 ms, measured on `validate-stop`), one cumulative row per turn in the raw file, and an attribution rule ("most recent opener") that hands the tail of `/esq:advance` after a nested `esq:plan` to `plan` and loses the remainder after a typed `/compact` — both named in the contract and separable by `via`.
**Conséquences:** `esq telemetry summary` gains a `direct` section that is never pooled with subagent groups; B-029 reads direct and orchestrated cost as two units. README § Native hooks, ARCHITECTURE § Billing a subagent and SPEC (via `/esq:spec`) state what the main-session read keeps. `D-hook-telemetry-stops-at-observable-usage` is amended: the main-session transcript is readable for numbers on the same floor as the agent transcript. Any later reader of `session-runs.jsonl` applies the last-row-per-`(sessionId, segment)` rule or goes through `summarizeTelemetry`.
**Alternatives rejetées:** One read at `SessionEnd` (simplest writer, but a closed terminal loses the whole session silently and the current session never shows until exit — the brief's headline scenario fails in-session); a whole re-parse of the transcript at every Stop (O(session) per turn, unbounded — rejected by CLAUDE.md's cost rule); rows in `agent-runs.jsonl` with the reader taught a second shape (every reader must learn the `agentId`-less shape; separation by file is separation by construction); delta rows summed in the reader (a lost delta silently under-counts where a lost cumulative row is at worst stale).

## D-session-row-per-touched-segment — A cumulative session row is written per segment the delta touched, not per Stop unconditionally

**Scope:** func
**Topic:** hooks
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `D-direct-session-telemetry-stop-cursor` says "one cumulative row per open segment per Stop". Building the writer (direct-skill-cost-evidence Phase 2) met two cases the sentence does not settle: a Stop whose delta added no assistant line to the open segment, and a `Skill esq:<cmd>` tool_use line whose earlier same-`message.id` lines (one content block per line) were already reduced into the segment it closes.
**Décision:** The writer appends the open segment's cumulative row only when this run opened it or reduced at least one assistant line into it (a `dirty` flag that never reaches the sidecar); a segment closed in the delta always gets its final `closedBy: "command"` row and `SessionEnd` always writes the closing row. When a Skill-tool opener shares its request id with the closing segment's open `lastRequest`, that request is released from the closing segment and counted in the segment it opens.
**Raison:** A row that is byte-identical to the previous one is bytes, not information — the reader keeps the last row per `(sessionId, segment)` and would discard it anyway, and the raw file is what a human greps. Counting a split request once, in the opening segment, is the plan's own rule ("that request's own usage counts in the segment it opens") applied to the harness's one-block-per-line layout; the alternative double-counts exactly the request that sits on every `advance → plan` boundary.
**Tradeoff:** Gained a smaller raw file and no double count at Skill boundaries; accepted that a reader cannot infer "a Stop happened" from a row's presence (it never could reliably — async Stops may be skipped by a live claim), and that the closing segment's `toolUseCount` excludes a tool_use block of the released request if one preceded the opener line.
**Conséquences:** README § Native hooks (Phase 3) states the rule as "one cumulative row per Stop that changed a segment"; `esq telemetry summary`'s `superseded` count is rows minus segments and stays meaningful. A reader that wants per-turn granularity must derive it from the transcript, not from row counts.
**Alternatives rejetées:** Unconditional row per Stop (identical rows per idle turn, e.g. a Stop after a typed non-esq command that closed nothing new); counting the straddling request in both segments (double-counts the boundary request); splitting it by line (no per-line usage exists — usage is the request's last line).

## D-summary-opt-out-note-via-hook-io — The summary's opt-out note reuses the hooks' `telemetryOptedOut` by importing it into the CLI library

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** direct-skill-cost-evidence Phase 3 has `esq telemetry summary` say, when the shell it runs from is opted out (`ESQ_TELEMETRY` / `DO_NOT_TRACK`), that hooks started from it write nothing. The rule lives in `plugin/scripts/hook-io.mjs` (`telemetryOptedOut`, Phase 1); `plugin/lib` had never imported from `plugin/scripts`.
**Décision:** `plugin/lib/telemetry.mjs` imports `telemetryOptedOut` from `../scripts/hook-io.mjs`; `summarizeTelemetry` takes `options.environment` (default `process.env`) and pushes `TELEMETRY_OPT_OUT_NOTE` into `notes` when it is true, so `--json` and the prose carry the same note and a test can pass an explicit environment.
**Raison:** One definition of the opt-out is the point of the variable — a copy in `lib` is the rule stated twice and drifting once. `hook-io.mjs` imports node built-ins only, and the scripts already import `plugin/lib/markdown.mjs`, so the import adds no cycle and no dependency. Moving the function into `lib` would make every hook load the CLI library for one predicate.
**Tradeoff:** Gained a single rule and a testable seam; accepted that `plugin/lib` now depends on one file under `plugin/scripts` (the direction scripts → lib was already crossed the other way).
**Conséquences:** A future `telemetryOptedOut` change is visible to both writers and the reader at once; anything that splits `plugin/scripts` from `plugin/lib` into separate packages must carry `hook-io.mjs`'s pure helpers with `lib`.
**Alternatives rejetées:** Duplicating the predicate in `telemetry.mjs` (two copies of one rule); moving it to `plugin/lib` and importing it from the hooks (hooks would load the CLI library for a predicate; the hooks' own `hook-io.mjs` is where `tests/hooks` exercises it); reading the environment in `cli.mjs` and appending the note after the fact (the lib's `--json` output and the human report would be built from two places).

## D-claude-calls-bounded-inline-positional — The `claude plugin` calls carry an inline `timeout`, and `check-plugin.sh`'s bound is positional

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** Phase 3 of `2026-08-19-bounded-audit-subprocesses` bounded the last two unbounded
audit subprocesses — the `claude plugin validate` calls in `check-plugin.sh` (check 26) and the
`claude plugin marketplace add / install / list` calls in `test-plugin-install.sh` (check 29). The
plan's Task 3.1 text said inline `timeout`; its Phase 2 hand-off suggested routing them through
`scripts/check-bounded.sh` to keep one owner of the wording; its Task 3.2 asked the guard to prove
the hang fires with the bound "literal" yet within 10 s.
**Décision:** Each script wraps its `claude` calls in `timeout --kill-after=5 "$CLAUDE_BOUND"`
itself and maps rc 124 to a finding that mirrors the runner's wording verbatim (`… timed out after
<bound>s — a hang, not a <validator|install> failure; run the command directly outside the audit to
tell a sandbox limit from a defect`); `check-plugin.sh` takes the bound as its second positional
argument with the literal default 60 in its header, `test-plugin-install.sh` keeps a pure literal 60.
**Raison:** The runner's first-line contract swallows stdout on success, and check 29's `plugin list
--json` needs that stdout; check 26's failure finding embeds the validator's whole output on one
line, which the runner's indented 40-line tail would scatter into many audit findings. A positional
bound is the plan's own convention ("the guard passes `1` to inject a hang, and nothing else has a
reason to vary it") — it is the only way the hung-`claude` case costs ~1 s; a literal 60 s bound
cannot be proven to fire in under 60 s, and a 60 s guard case would have failed the phase's own ≤10 s
audit-timing step.
**Tradeoff:** Gained a 1 s fault-injected proof and the scripts' existing output contracts; accepted
that the hang wording now lives in three scripts (mirrored by hand, not shared) and that
`test-plugin-install.sh`'s bound is unproven by injection (a hung install would cost the full bound
per case; `check-plugin.sh` carries the proven twin of the same wiring).
**Conséquences:** A future change to the hang wording touches `check-bounded.sh`, `check-plugin.sh`
and `test-plugin-install.sh` together; if a third script needs the bound varied, it takes it as a
positional argument, never an environment variable.
**Alternatives rejetées:** Routing both scripts through `check-bounded.sh` (stdout swallowed on
success, failure output scattered); a literal bound with the guard asserting within `timeout 70`
(+60 s on every audit run, contradicting the timing bound); an environment variable for the bound
(the plan's convention forbids it — the guard is the only legitimate varier).

## D-writer-reader-predicate-lives-in-hook-io — The writer/reader supersession predicate has one definition, in `hook-io.mjs`

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** [D-whole-run-record-supersedes-fallback] makes one predicate (`source === 'SubagentStop'
&& runUsage` is an object) decide both what the writer appends over a fallback and which row the
reader lets represent a run. Phase 1 exported it from `record-agent-telemetry.mjs`; `plugin/lib`
may not import the handler, so Phase 2 had to restate it in `telemetry.mjs` or move it.
**Décision:** `carriesWholeRunUsage` lives in `plugin/scripts/hook-io.mjs` beside `telemetryOptedOut`
and is imported by the handler and by `plugin/lib/telemetry.mjs` — one definition for both sides.
**Raison:** A predicate restated in two files drifts the day one side learns a new field, and the
failure is silent: the writer supersedes on one rule and the reader counts on another, so the file
and the summary disagree with no test naming the gap. `hook-io.mjs` is already the one place the lib
reads from `scripts` ([D-summary-opt-out-note-via-hook-io]) and stays built-ins only, so the import
adds no cycle and no dependency; the boundary rule — "the lib imports only `hook-io.mjs`'s pure
helpers" — is unchanged, only the count of helpers grows.
**Tradeoff:** Gained one rule, one place, covered by both test suites; accepted that `hook-io.mjs`
now carries a telemetry-domain predicate next to I/O helpers, and that `docs/ARCHITECTURE.md`'s
"one predicate only" wording lags until `/esq:arch` runs.
**Conséquences:** Any future rule both the writer and the reader must agree on (what counts as a
run, what counts as usage) goes into `hook-io.mjs` the same way; a second shared file, or an import
of a handler into the lib, is the boundary break the architecture forbids.
**Alternatives rejetées:** Restating the one-liner in `telemetry.mjs` (two definitions of one rule,
drift undetected); importing `record-agent-telemetry.mjs` into the lib (the lib would load a hook
handler — the boundary `docs/ARCHITECTURE.md § Boundaries not to cross` names).

## D-explicit-agent-rows-judged-from-spawn-id — Explicit `Agent` model rows are judged from the lines under their own spawn id, never from usage

**Scope:** arch
**Topic:** model-pins
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** B-041 extends `scripts/probe-model-pins.mjs` with Opus/Sonnet/Haiku workers spawned with the `Agent` tool's per-invocation `model`, foreground and background. On 2.1.235 `result.modelUsage` bills the harness's own haiku call on every Opus session, so a Haiku-worker row read from usage is indistinguishable from the harness; an Opus worker spawned from an Opus parent is indistinguishable from inheritance.
**Décision:** An explicit row is judged only from `assistant` lines whose `parent_tool_use_id` is the id of the parent's `Agent` tool_use whose input carried the expected `model` and background flag (`not invoked` when no such call was made, `no evidence` when it forwarded no request); the parent runs on a model the worker must differ from (sonnet parent for the opus worker, opus for the others); `CLAUDE_CODE_SUBAGENT_MODEL` is removed from the child environment; `result.modelUsage` feeds an `aux` column (billed models with no request line) and never a verdict.
**Raison:** The verdict must be tied to the call the parent actually made and to per-request evidence — the item's own rule (no prompt claims, no aggregate usage alone). Distinguishability decides the parent model: the B-042 direction (relay on Sonnet, worker explicitly Opus) is the one row that matters and it needs a non-Opus parent.
**Tradeoff:** Gained: a verdict a reviewer can trace to one tool_use id and its request lines, and a harness call that is named rather than misread. Accepted: a second session model in the table (readable per row from `system/init model`), and a `no evidence` row where a future version stops forwarding worker lines instead of a usage guess.
**Conséquences:** A later version that forwards auxiliary calls under the worker's id shows as `partial` with both counts — classify it then, on evidence. B-042 cites the six rows; an upgrade re-runs the probe (the version is per row).
**Alternatives rejetées:** Fixture agent definitions with `model:` frontmatter (measures resolution step 3, not the per-invocation field B-041 names — a follow-up row if step 2 proves unreliable); reusing the fork row's `modelUsage` fallback for explicit rows (the haiku worker and the harness's haiku call share a key); keeping the parent on opus for every row (the opus-worker row would prove nothing).

## D-relay-sonnet-workers-explicit-opus — Relay orchestrators pinned Sonnet, every worker spawned explicitly on Opus

**Scope:** arch
**Topic:** model-pins
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** B-041 measured the `Agent` tool's explicit `model` field honored 6/6 on Claude Code 2.1.235. Until now orchestrators spawned workers with no `model`, so the worker inherited the session model — in practice `claude-fable-5` on this machine (27/27 direct rows on 2026-08-19 despite `model: opus` pins; B-026 saw a sonnet pin run on opus the same way), i.e. the skill pin is not observed to bite when a command is typed into a running interactive session, only when it opens a headless one.
**Décision:** `/esq:autopilot`, `/esq:converge`, `/esq:advance` carry `model: sonnet`; every `Agent` spawn they make — build, check, review, fix, work and the apply agent — passes `model: opus` explicitly (user confirmed `opus` over `fable`, 2026-08-19); the README says the interactive relay saving is `/model sonnet` before the command and that worker quality no longer depends on it.
**Raison:** The relay is the one place esq designed judgment out (decisions read off log headings, ledger rows, `git log`; option sets relayed verbatim), so it is the schema-bound case D-opus-default-sonnet-only-mechanical allows; the explicit field is the only measured lever that puts a worker on a chosen model regardless of the session, and it removes a silent dependency on the user's session setting that existed before any pin was changed.
**Tradeoff:** Gained: worker model chosen by esq and measured, relay cost separable, a per-command × model telemetry dimension for B-029. Accepted: the relay pin only bites headless; the explicit `opus` alias bills under `claude-opus-5[1m]` (SKU question for B-029); `esq:apply` stays Opus until its cell has evidence.
**Conséquences:** No orchestrator spawn may omit `model:` (conformance check); a harness upgrade re-runs `scripts/probe-model-pins.mjs` before the pins are trusted; README § Model recommendations counts eight Sonnet skills and separates the headless and interactive pin paths (B-047 probes the latter). **The relay-pin clause is superseded by `D-relay-inherits-the-session-model` (2026-09-03):** the three relays declare `model: inherit`, the Sonnet set is five again, and README § Model recommendations counts five. The worker clause — explicit `model: opus` per spawn, asserted from telemetry — stands.
**Alternatives rejetées:** `CLAUDE_CODE_SUBAGENT_MODEL=opus` as the mechanism (per shell, invisible to the skill, unmeasured, pins a consuming project's own agents too — named as a fallback lever only); `fable` workers (unmeasured alias, and B-042 names Opus); keeping orchestrators on Opus with explicit workers (no relay saving, the half of B-042 that pays).

## D-spawn-model-asserted-from-telemetry-mismatch-stops — Every spawn's model is asserted from telemetry; a mismatch stops the run

**Scope:** func
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** B-042 requires a runtime assertion that every spawned worker received the expected model, and an immediate all-Opus fallback if explicit selection proves unreliable. The parent has no documented way to read a worker's actual model (sub-agents.md, 2026-08-19); the `Agent` result carries the agentId, and `SubagentStop` telemetry already stores the worker's per-request `models[]` under that id.
**Décision:** The `AgentLabel` row gains the validated `requestedModel` from `tool_input.model`; `esq telemetry assert-model <agentId>` joins it to the run's `models[]` (family match on an alias, `[1m]`-stripped exact match on a full id; `resolvedModel` only for a fallback-only run, named as such) with a bounded 10 s wait for the async writer, writes nothing, exits 1 on `mismatch`/`unrequested`. The orchestrator runs it after every spawn: `honored` continues, `unknown`/`unlabelled` continue as a ⚠ fact line, `mismatch`/`unrequested` stop the run before the next spawn with the evidence line and the fallback named — orchestrate from an Opus session (workers inherit Opus, the pre-B-042 shape) and re-run the probe before trusting the field again. The summary groups runs by command × actual model with the requested model beside it.
**Raison:** The evidence is the worker's own request lines — the same the probe judged from — through the one join key telemetry has (`agentId`); continuing after a mismatch spends Opus-priced judgment on an unchosen model, while an `unknown` is an instrument gap (B-036) not a contradiction, and stopping on it would halt good runs.
**Tradeoff:** Gained: a per-spawn contract the run itself checks, and the table B-029 needs. Accepted: one CLI read per spawn with up to a 10 s wait; a mismatched worker's commits stand (the run stops, it does not revert).
**Conséquences:** `requestedModel` is the second validated field a label stores (pattern in writer and reader, `tests/hooks` holds it); the family rule has one definition in `telemetry.mjs`, shared by `assert-model` and the summary; `ASSERT_WAIT_MS` is a constant raised only on evidence.
**Alternatives rejetées:** Asserting from the `Agent` result (no model in it); trusting `tool_response.modelsUsed`/`resolvedModel` as primary evidence (B-035); treating a mismatch as a warning (silent quality cut); stopping on `unknown` (halts on B-036's blind spot).

## D-command-model-group-verdict-worst-of-asked — A by-command×model group's verdict is worst-of over what was asked; the header counts runs one by one

**Scope:** func
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** `esq telemetry summary`'s `by command × model` table (plan relay-worker-model-separation, Phase 2) is keyed `esq:<slug> · <model>`, so the model is fixed per group and only what the orchestrator asked for can vary across its runs — old rows spawned without a `model` field beside new rows asking `opus`, or the same family asked as `opus` and as `claude-opus-5`. The plan fixed the key and named one `requested` and one `verdict` per group without saying how a mixed group collapses.
**Décision:** Per group, `verdict` is `mismatch` if any labelled run asked for another model (or ran on two families), else `honored` if at least one run asked, else `unrequested` (the row reads `—`); `null` — rendered as the bare alias, no mark — when runs asked but the key is `unknown` (no model evidence). `requested` is every spelling asked, sorted and `+`-joined, or `null`. The `spawn model:` header line counts every labelled run individually (requested / honored / mismatch / unrequested), so the runs a group's single mark hides are still visible on the screen.
**Raison:** A mismatch anywhere in a group is the fact B-029 must not miss, so it wins; a group whose runs all ran on the asked-for model is honored whether or not every run asked, because the model column already says what ran — the asked/inherited split is the header's job, per run. Splitting the key on `requested` would scatter one command × model's cost across rows and defeat the table's purpose.
**Tradeoff:** Gained: one row per command × model with a readable mark, and no second statement of the family rule (`spawnModelVerdict` is reused). Accepted: a mixed honored+unrequested group reads `opus ✔` — the unrequested count lives in the header, not the row.
**Conséquences:** Phase 3 should pass one spelling (`opus`) so `requested` stays a single token; B-029 reads `verdict` per row and `spawnModel` for the per-run split; if a per-row split is ever needed, add counts to the group rather than changing the key.
**Alternatives rejetées:** Keying on `command · model · requested` (scatters cost, breaks the plan's key); `unrequested` winning over `honored` (a 9-honored/1-inherited group would read as un-asked); a fourth `mixed` verdict (a value the plan's three-way contract and README do not name, for a transitional case the header already counts).

## D-conformance-needles-pin-sentences-not-tokens — A conformance needle is the load-bearing sentence, never a bare token another part of the file could satisfy

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** Scenario U-05 had to prove the orchestrators pass `model: opus` on every spawn. The plan's wording was "grep for the literal `model: opus` inside the spawn block", but `check-conformance.sh` greps whole files, and a skill whose frontmatter was still pinned `model: opus` — the very state this plan replaces — would satisfy a bare-token needle with no spawn sentence at all.
**Décision:** U-05's needles are the sentence `Pass \`model: opus\` on every spawn, explicitly`, the CLI string `esq telemetry assert-model`, and the clause `\`mismatch\` / \`unrequested\` → **STOP before the next spawn.**` — each one the instruction itself, in the words the shared block carries.
**Raison:** The check is lexical and file-wide by design (one fixed-string pass per command file); its precision therefore comes from the needle, not the scope. A sentence can only be matched by the instruction being present; a token can be matched by metadata, a code block or an unrelated mention. The existing scenarios already follow this shape (`Log it and do not re-run a single task.`), so this writes the rule down rather than invents it.
**Tradeoff:** Gained: a frontmatter pin, a README row or a stray `model: opus` in prose can never stand in for the spawn instruction. Accepted: rewording that sentence in `orch-shared:spawn-sync` fails check 24 until the needle is updated with it — which is the point, since the shared-block registry would fail on the same edit anyway.
**Conséquences:** Future scenarios name the instruction sentence as their needle; a token-shaped needle is a finding in the reading pass. The fault injection strips the sentence (not the token) to prove the check reds.
**Alternatives rejetées:** A bare `model: opus` needle (satisfied by the old frontmatter — the exact false positive this plan must not ship); a second grep scoped to the span between the `orch-shared:spawn-sync` markers (a check per block, which D-registry-not-a-check-per-block rejects, and the sharedblocks registry already proves the three copies are one text).

## D-conformance-needle-traces-to-its-scenario — Every conformance needle traces to a sentence of its own scenario

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** P-06 pins `/esq:work`'s new plan anchor. The build phase inherited a list of load-bearing sentences from Phase 1 that was wider than the scenario paragraph the plan specified — it included `**A failed anchor never unwinds the code.**`, a real behavioral clause the P-06 text does not assert.
**Décision:** P-06's nine needles are exactly the clauses its `docs/CONFORMANCE.md` paragraph states; the unasserted sentence was filed as a backlog candidate for a scenario of its own rather than pinned silently.
**Raison:** `docs/CONFORMANCE.md` is the contract and `check-conformance.sh` is only its evaluator. A needle with no sentence behind it makes the check assert more than the contract says, so the document stops being readable as the whole of what a packaging migration must preserve — and the reverse, a scenario clause with no needle, is invisible to the check. Keeping the two in bijection is what lets either one be read alone.
**Tradeoff:** Gained: the scenario paragraph is an exhaustive account of what check 24 enforces for that command. Accepted: a clause worth pinning waits for its own scenario instead of riding along on an existing one.
**Conséquences:** Adding a needle means adding or extending the scenario sentence it answers to, in the same commit. A clause found unpinned during a build is a backlog row (as `**A failed anchor never unwinds the code.**` and B-056 now are), not a quiet addition.
**Alternatives rejetées:** Pinning every load-bearing sentence the phase could find (the check outruns the contract, and `docs/CONFORMANCE.md` no longer states what is enforced); widening the P-06 paragraph mid-build to cover the extra clause (rewriting the plan's stated scenario without the user, for a clause the plan deliberately scoped out).

## D-cli-ignores-plugin-data-env — CLI telemetry discovery ignores `CLAUDE_PLUGIN_DATA`

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** With `CLAUDE_PLUGIN_DATA` exported in the user's shell, `esq telemetry assert-model`
read an empty store and answered `unlabelled` for a labelled, honored spawn — the relay/worker
model guard failed open on the exact condition it exists to catch (B-048, observed live
2026-08-19). The hooks write where the harness points them and never shell out to `esq`; the
harness-set variable is invisible from a skill's Bash (measured, `D-telemetry-summary-is-a-cli-subcommand`).
**Décision:** `discoverTelemetryFiles` drops its `CLAUDE_PLUGIN_DATA` branch: the CLI always pools
`~/.claude/plugins/data/esq-*`, un-pooled only by explicit `[file…]` arguments; when the variable
is exported anyway, `summary` carries a note saying it is a hook-side channel and was ignored.
**Raison:** The variable is a harness→hook channel, not a user→CLI one — in the CLI's actual
runtime contexts (skill Bash, user terminal) every value it could see is foreign. Deleting the
branch closes the fail-open entirely, where falling back on an empty root would still fail open on
a stale non-empty pin, and having the hook publish its root adds a writer to cover a harness layout
that does not exist.
**Tradeoff:** Gained: a guard that cannot be disarmed by ambient shell state, and one discovery
rule instead of two. Accepted: the documented env-pinning lever for `summary` is gone — scoping now
requires explicit file paths, and the note is what tells an old habit where the lever went.
**Conséquences:** Tests isolate via `CLAUDE_CONFIG_DIR`, never via `CLAUDE_PLUGIN_DATA`; B-050's
"must not export `CLAUDE_PLUGIN_DATA`" clause goes moot once this ships and should be trimmed when
that row is worked; hooks keep reading the variable from the harness env, untouched.
**Alternatives rejetées:** Fallback to pooled discovery when the env root holds no telemetry files
(still fails open on a stale non-empty root, and makes a pin's meaning depend on filesystem state);
the hook publishing the root it resolved (a new artifact and writer whose pointer could only live
where pooled discovery already looks).

## D-invalid-samples-excluded-not-deleted — An invalid sample is excluded in the reader, not deleted from the store

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active — the no-repo-identity clause amended 2026-09-06

**Contexte:** Three throwaway `/esq:autopilot` proof runs from a scratch repo (relay-worker-model-separation Phase 4) were written into the pooled telemetry store and are indistinguishable from real work (B-051). They are 3 of the 6 runs in `esq:build · claude-opus-5` — the exact cell B-029 reads — and their outputs (4.4k / 3.0k / 4.7k) sit an order of magnitude below the real runs' (60.7k / 58.1k / 119.0k), so the printed median of 31.4k is the midpoint of two unrelated populations.
**Décision:** `summarizeTelemetry` drops runs whose `agentId` appears in an exported `EXCLUDED_RUNS` map (agentId → one-line reason) before grouping, and reports the count as `skipped.excluded` in the human report and in `--json`. The store is never written to by the CLI, and no new field is added to a telemetry row. Recurrence is prevented by documentation, not machinery: a scratch or proof run sets `ESQ_TELEMETRY=off`, an opt-out the writers already honor.
**Raison:** The exclusion is version-controlled, reviewable and reversible, and — decisively — it is visible in the output: the summary says three runs were dropped and why, which a deletion cannot. A median that quietly got better is the number a later reader over-trusts, and "no silent caps" is the same discipline the summary's header already applies to fallback-only, no-usage and zero-usage runs.
**Tradeoff:** Gained an honest, auditable median and a report that names its own gaps; accepted that three of one machine's opaque agentIds live in distributed plugin code until the rows age out, and that the reader carries a small denylist concept it did not have before.
**Conséquences:** A fourth entry in `EXCLUDED_RUNS` is the signal that documentation is not preventing recurrence and that a row-level repo identity should be reconsidered. B-029 argues its tiers from the post-exclusion summary; `esq:build · claude-opus-5` falls to 3 runs and is therefore `provisional`, which is the honest state.
**Alternatives rejetées:** Scrub the three lines from `agent-runs.jsonl` by hand (edits data under `~/.claude/` unrepeatably and unverifiably, and leaves a clean table with no record that anything was removed); a content-free repo-identity field on every run row (does nothing for rows already written, so a scrub or exclusion is still needed, and it widens the telemetry row against the data-minimization boundary for a recurrence `ESQ_TELEMETRY=off` already prevents at zero cost).

**Amendement (2026-09-06, B-121) — the rejected alternative is now taken, on every new row rather than only beside a slug.** This entry rejected a content-free repository identity on a run row *conditionally*: it bought nothing for the recurrence `ESQ_TELEMETRY=off` already prevents, and no caller needed it. B-121 is that caller. Attribution coverage has to weigh the rows with **no** plan identity — a local plan-bearing run that failed to declare must lower this repository's rate, while the identically-shaped run in another project must not touch it — and on a machine-wide store those two rows are indistinguishable unless both carry a scope. A slug-conditional key cannot establish that scope, because it is precisely the miss that has no slug to hang it on: both rows would arrive slug-less *and* key-less, and the join would be back to guessing. So `repoKey` goes on every row both writers emit, its content-free shape and its cost argued in full at `D-plan-identity-is-declared-not-inferred` rather than assumed here, and the widening of a deliberately minimal store is accepted deliberately rather than quietly. **What is unchanged is everything this entry actually decided:** exclusion still happens in the reader, from the version-controlled `EXCLUDED_RUNS` map, reported as `skipped.excluded`; the three historical entries stay exactly as they are and are not re-litigated by scope; the CLI still never writes to the store; and no row is ever deleted. The "fourth entry is the signal" rule above also still holds — it just no longer implies that a repo identity is the open question, since that question is now answered.

**Amendé 2026-09-06 — la clause « aucun champ d'identité de dépôt » tombe, le reste tient.** This entry rejected a content-free repository identity on a run row for want of a caller, and named "a fourth entry in `EXCLUDED_RUNS`" as the signal to reconsider. B-121 is that caller and it arrived first: the telemetry store is pooled machine-wide across `~/.claude/plugins/data/esq-*`, a plan slug is a repository-local name, and two projects can hold a plan of the same name — so an outcome join keyed on the slug alone would silently merge two repositories' work. A `repoKey` is therefore written, and — against this entry's instinct — on **every** new row rather than only beside a slug. The narrower reading was tried and does not work: the rows a coverage rate turns on are precisely the ones with no plan identity, so a key written only beside a slug would leave a local miss and another project's run in the same key-less, slug-less shape, and no reader could tell them apart. The key is 32 hexadecimal characters of SHA-256 over the real path of the canonical git common directory — never the path, the name or a remote — and the widening is accepted deliberately, as the only way to scope a missing identity. Everything else here stands unchanged: the three historical `EXCLUDED_RUNS` entries are still excluded in the reader rather than deleted, the CLI still never writes the store, and a scratch run is still prevented by `ESQ_TELEMETRY=off` rather than by machinery. The new key does nothing for rows already written, which was the other half of the objection and remains true — those rows carry no key, are classified `unscopedRepo`, and are reported under that count rather than folded into either repository.

**Note (2026-09-07, B-128) — a second version-controlled agentId map now exists in the reader, and it is not this one.** `scripts/outcome-join.mjs` carries `LEGACY_IDENTITY`, keyed on `agentId` exactly as `EXCLUDED_RUNS` is and modeled on it deliberately. It is **not** an extension of this decision and the two are asserted disjoint by test. The difference is what they do to a row: `EXCLUDED_RUNS` **drops** rows that are not measurements, so an excluded row leaves the denominator entirely and is reported as `skipped.excluded`; `LEGACY_IDENTITY` **re-labels** rows that are measurements — three runs whose `plan:` marker was written before the writer canonicalized it (`D-plan-slug-canonicalized-at-the-writer`) — so a remapped row stays in the denominator, moves from `unknownIdentity` into `identified`, and is reported as `legacyRemapped` beside every rate it moved. Its match is three fields, all exact and unnormalized (`agentId`, `repoKey`, the recorded slug), so it forgives nothing adjacent. **What this note does not do is amend anything here.** The "a fourth entry is the signal that documentation is not preventing recurrence" rule above applies to `EXCLUDED_RUNS` alone and is not diluted by a second map with a different purpose — a fourth `LEGACY_IDENTITY` entry would instead mean the *writer* fix regressed, which is a different signal with a different remedy. Exclusion still happens in the reader, from a version-controlled map, visibly in the output; the CLI still never writes the store; no row is ever deleted.

## D-cost-budget-checked-outside-the-audit — The regression budget is one table, compared on demand

**Scope:** infra
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** B-029 must state a regression budget per command group. A budget stated in prose with nothing reading it is exactly the failure CLAUDE.md names — a worst case named afterwards is a bill, not a bound — but the comparison reads a machine-specific telemetry store, so it cannot be hermetic.
**Décision:** The budget lives as columns on the measured-cost table in `README.md § Model recommendations` — the same table a reader consults — and `scripts/cost-budgets.mjs` parses that table and compares it against `esq telemetry summary --json` (or `--summary <file>` for a fixture replay), exiting 1 on a breach, 2 on nothing to check, and 1 naming the offending line on a table it cannot parse. It sits beside `probe-model-pins.mjs` as an on-demand tool and is deliberately not a `check-*` in `audit.sh`.
**Raison:** One source removes the drift a separate budgets file would create between the documented figure and the checked one. Keeping it out of `audit.sh` keeps the commit gate hermetic: a cost regression is a property of accumulated telemetry, not of the diff in front of it, and failing an unrelated commit for one would train people to skip the gate.
**Tradeoff:** Gained a bound that something actually reads, at the cost of a markdown-table parser and a tool that only runs when someone remembers to run it.
**Conséquences:** Any change to the measured-cost table's shape must keep it parseable; the tool fails loudly rather than silently skipping, which is what makes that safe. If cost checking later needs to be routine, the hook is a scheduled or post-plan invocation, not an audit check.
**Alternatives rejetées:** A separate `budgets.json` read by both the doc and the tool (two artifacts, and the README copy drifts); a `check-cost-budgets.sh` inside `audit.sh` (non-hermetic, machine-specific, and it blocks commits that did not cause the regression); prose-only budgets with no checker (the named-afterwards-is-a-bill failure this decision exists to avoid).
## D-tiers-held-until-a-second-cell-confirms — Every model pin holds until a second cell confirms and an outcome signal exists

**Scope:** prod
**Topic:** model-pins
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** B-029 exists to replace the model recommendations with measurements. `esq telemetry summary` now reports per-command × model medians over 104 recorded runs (2026-08-18 → 2026-08-20), with the three B-051 proof runs excluded (D-invalid-samples-excluded-not-deleted) and `MIN_SAMPLE_RUNS = 5` marking a thin group provisional. Read post-exclusion, **no command has a confirmed cell on more than one model.** `esq:build`, `esq:check`, `esq:fix` and `esq:review` each hold exactly 4 `claude-opus-5` runs, one short of the threshold; every confirmed cell in the set is `claude-fable-5`, which is the session model that happened to be running rather than a tier anyone chose. `esq:check` is the closest thing to a comparison — 6.6k median output on Opus over 4 runs against 6.7k on fable-5 over 9, at 2m07s against 2m03s — and it is still provisional. Six commands (`/esq:advance`, `/esq:arch`, `/esq:epic`, `/esq:harvest`, `/esq:ui`, `/esq:worktree`) have no rows at all.

**Décision:** Every pin in `README.md § Model recommendations` holds unchanged, and the README states for each group *why* it holds: measured with a second model one run short (build, check, fix, review), measured on one model only (apply, work, roadmap, plan, grill, spec), or held structurally and unmeasured (the three relays and the five CLI-owned commands, per D-relay-sonnet-workers-explicit-opus and D-opus-default-sonnet-only-mechanical). A tier moves only when **both** conditions hold for that command: a second model reaches `MIN_SAMPLE_RUNS` runs with tokens in its own cell, **and** an outcome signal exists for the work — accepted results, reopen rates, or corrective loops per run. Spend alone never moves a judgment-bearing pin in either direction.

**Raison:** The measurement B-029 asked for came back with no confirmed comparison, and that is a result, not a licence to fall back on the prior rationale. Telemetry records tokens, duration and tool calls; it does not record whether the plan was accepted, whether the review caught the bug or whether a phase was built twice — so "cheaper model, same quality" has no evidence here in either direction, and a downgrade argued from a spend table alone would be a recommendation dressed as a measurement, which is the exact failure this item was opened to end. The second condition is what stops the first from being met trivially by five more runs of the same kind.

**Tradeoff:** Gained: the README now states a number and a sample count where it used to state a rationale, and names the specific run that would reopen each verdict. Accepted: a phase whose visible outcome is "nothing changed", and a table whose medians are stale the moment more runs land — the dated heading and the budget tool (D-cost-budget-checked-outside-the-audit), not the table, are what any later argument cites.

**Conséquences:** A fifth Opus run of `/esq:check`, `/esq:fix`, `/esq:review` or `/esq:build` flips that cell to confirmed and makes its comparison quotable — but still only on spend, so B-029's successor is an outcome signal, not more runs. `/esq:build`'s Opus cell (59.4k out, 18m12s, 97.5 tools against fable-5's 26.8k / 6m57s / 37) is confounded by plan size and must not be read as a model effect. The tables carry a date in their heading and are re-read, never patched piecemeal.

**Alternatives rejetées:** Downgrading `/esq:check` on its near-identical spend cells (4 runs, below threshold, and spend parity says nothing about whether the gate still catches drift); waiting for more runs before writing anything (the measurement and its insufficiency are both the finding, and an unwritten one gets re-derived next quarter); a monetary column to make the comparison vivid (this repo holds no per-model price — a fabricated dollar figure would be the most quoted and least sourced number in the README); pooling subagent and direct-session rows to reach the threshold faster (two populations, one measured end to end by the harness and one spanning the user's own waits).

## D-budget-is-one-and-a-half-times-the-median — A regression budget is 1.5× the median it was set from

**Scope:** infra
**Topic:** telemetry
**Date:** 2026-08-19
**Statut:** Active

**Contexte:** D-cost-budget-checked-outside-the-audit settled *where* the budget lives and *what reads it*; it left open what number goes in the cell. Telemetry says nothing about normal variance — the 34 `/esq:build` runs behind that group's median span plans of very different sizes — so any ceiling is a judgment, and a per-row judgment is one nobody can re-derive six months later.

**Décision:** A budget is **1.5× the median beside it**, rounded up to the next 0.5k output tokens and the next 15 seconds, on the two figures `esq telemetry summary --json` can re-derive: median output tokens and median duration. It is set only on a **confirmed** row of the **subagent** table, and the cell carries the `n` and the date it was set from. A budgeted group that later falls back below `MIN_SAMPLE_RUNS` is reported as not compared, never as ok — and when no budgeted group has a confirmed sample the tool exits 2, not 0.

**Raison:** One stated multiplier is re-derivable from the table it sits on, which a hand-tuned per-command ceiling is not. 1.5× is wide enough to absorb the spread already visible between plans and narrow enough that a doubling is caught the first time it is run. Confirmed-only and subagent-only follow rules the README already states for its own figures: a provisional median is a figure and not evidence, and a direct session's duration includes the user's own waits (one row reads 6h04m), so a ceiling there would bound human idle time rather than the command.

**Tradeoff:** Gained a ceiling anyone can recompute from the table and a breach that names its own basis; accepted that 1.5× is calibrated against a single week of runs and will look arbitrary if a command's spread turns out to be wider than that.

**Conséquences:** Enrolment is the budget cell itself — a group without one is neither breach nor error, so adding a command to the check means adding a cell. Re-reading the table (new medians, new date) means recomputing the ceilings by the same rule rather than keeping the old ones. A breach is an investigation, not a failure: the tool names the group and both numbers, and a person decides whether it was a regression, a fatter plan, or a fair price for new work.

**Alternatives rejetées:** A per-command hand-set ceiling (unre-derivable, and every future edit becomes a negotiation); a statistical bound such as p90 or a standard-deviation multiple (the summary computes neither, so the doc and the checker would stop agreeing on a number anyone can see); budgeting on total tokens (dominated by cache reads, and the summary computes no median over totals); budgeting direct sessions on tokens only (its one confirmed row pools three session models, so the ceiling would track which model was typed at, not the command).

## D-lane-is-two-axes-computed-by-the-cli — The assurance lane is two axes, computed by the CLI

**Scope:** arch
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** B-030 asks for a lean assurance route that a model may not pick on confidence alone, agreed across six commands whose `→ Next` lines are separate prose.
**Décision:** The plan records `requirements uncertainty` and `implementation risk` with the triggers that fired; `esq lane <plan>` computes the route from a four-row table defined once, folds execution-log escalations in one-way, and refuses a block whose axes are absent, out of the closed set, unbacked by a trigger, or disagreeing with its own written lane.
**Raison:** A route re-derived in six command files from a table copied six times is the drift the shared-block registry exists to catch, and "do not pick lean because you feel confident" has nothing behind it as prose. Splitting it on the repo's own line — skills judge, the CLI structures — makes which triggers fired a judgment and what they mean a function, so each lane gets a fixture that runs offline in under a second.
**Tradeoff:** Gained a routing decision that is testable per lane and refuses its own malformed input; accepted a new CLI subcommand, its tests and four plan fixtures.
**Conséquences:** Every consumer calls `esq lane` rather than reading the block itself, and a plan with no block resolves to `full` — the pre-existing behavior, so nothing already written changes.
**Alternatives rejetées:** Prose-only contract with conformance clauses (cheapest, but the classification stays a per-session judgment in six places). Classifying at the backlog-item level so `/esq:work` and `/esq:advance` route too (the triggers are only knowable after the investigation `/esq:plan` performs — a row is written before anyone read the code).

## D-direct-lane-keeps-one-finder — The lowest lane still buys one finder

**Scope:** prod
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** B-030's low-uncertainty × low-risk cell was specified as "direct verification or the smallest existing lane that preserves evidence" — two materially different floors.
**Décision:** `direct` runs check → fix, the same route as `conformity`; it never ends at the build's own `(auto)` verification alone.
**Raison:** A lane that produces no assurance artifact cannot have a missed-defect rate computed for it, so the cheapest route would also be the one whose cost was unmeasurable — which is how a lean lane starts looking cheap by deferring defects. Inventing a narrower fifth pass instead would put two commands on the same case behaving differently, the defect class `docs/AUDIT.md` exists for.
**Tradeoff:** Gained a measurable floor under every lane; accepted two subagents on the cheapest work rather than none.
**Conséquences:** `direct` and `conformity` share a route and differ only in the record. If `esq lane stats` shows their rates converge over five plans each, the honest follow-up is merging the lanes, not keeping a distinction the data does not support.
**Alternatives rejetées:** No finder at all on low×low — the largest saving, but its missed defects surface only as later reopens, with no artifact to attribute them to.

## D-converge-selects-its-itinerary-from-the-lane — Converge buys the route, not the constant

**Scope:** arch
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Superseded by D-converge-means-one-itinerary

**Contexte:** `/esq:converge` announces a fixed four-subagent bound before reading anything, so a lean plan pays the full corrective loop to anyone who types the command out of habit — which is where most of B-030's saving would otherwise leak.
**Décision:** Converge resolves the lane in preflight and selects one of three itineraries (`full` → check → fix → review → fix; `conformity`/`direct` → check → fix; `code-risk` → review → fix), stating the derived bound in its resolved-target line; the selection happens once and is never re-decided mid-run, and an unresolvable lane is `full`.
**Raison:** The command's principle is a fixed itinerary rather than a router, and selecting it once from a file written before the run preserves exactly that — what it stops being is a *constant*. Letting an escalation recorded mid-run lengthen the itinerary would break the announce-before-you-spend contract instead.
**Tradeoff:** Gained the actual saving on lean plans; accepted that converge now reads the plan file for something beyond phase classification, and that a mid-run escalation is honored by the next run rather than this one.
**Conséquences:** The opening announcement keeps its worst case of four, since it is emitted before any read; the resolved-target line carries the real bound. Scenario R-05 pins the select-once rule so a later packaging migration cannot quietly turn it into a router.
**Alternatives rejetées:** Leaving converge four-step and routing only through `/esq:build` and `/esq:autopilot`'s `→ Next` — untouched contract, but the saving then depends on the user following a recommendation rather than on the system.

## D-assurance-block-is-axes-guidance-is-a-comment — The assurance block is the axes; the trigger lists are guidance

**Scope:** func
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** The plan template had to carry four things for the lane — the trigger lists, the four-lane table, the "triggers, not confidence" rule and the `full`-by-default fallback — and the template is copied verbatim into every plan file `/esq:plan` writes.
**Décision:** Only the `**Lane:**` field line and one trigger bullet per axis go into the written plan; the trigger lists, the lane table, the rule and the fallback ride in a `<!-- -->` guidance comment that the plan author drops, the same convention `## Security notes` already uses in that template.
**Raison:** `esq lane` reads the axis values and the trigger bullets and nothing else, so a four-row table copied into every plan is bytes no consumer reads, re-paid by every session that loads a plan file. The rule still binds because it is mechanized elsewhere — a `high` axis with no trigger bullet does not parse — rather than because the plan restates it.
**Tradeoff:** Gained a block that stays two lines plus two bullets in every plan; accepted that a reader of a plan file alone sees the axes without the trigger vocabulary behind them, and must read `/esq:plan` or the README table for it.
**Conséquences:** A model that leaves the guidance comment in place must not break the parser, so the comment deliberately contains no `**Lane:**`, `**Requirements uncertainty:**` or `**Implementation risk:**` field label and no bullet leading with `Uncertainty` or `Risk` — a constraint any future edit of that comment inherits.
**Alternatives rejetées:** Putting the lane table in the block itself, so a plan is self-describing — rejected as bloat the parser never reads, and as a fourth copy of a table that already exists once in `plugin/lib/cli.mjs` and once in the README.
## D-converge-step-numbers-are-full-positions — Converge's step numbers are positions, not a count

**Scope:** arch
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** `/esq:converge` names its steps by number in roughly a dozen places — "why no re-check after step 2", "after a finder (steps 1 and 3)", "after a fixer (steps 2 and 4)", "resumes at step 4". Once the itinerary became lane-derived, a two-step lane had to be described without those sentences going false.
**Décision:** Step numbers 1–4 are permanent positions in the `full` itinerary, stated once in the itinerary section; `conformity` and `direct` run positions 1 and 2, `code-risk` runs positions 3 and 4, and no lane renumbers its steps from 1.
**Raison:** The alternative was renaming every reference into roles ("the finder", "the fixer after it"), which churns most of the file for no behavior change and loses the ordering the numbers carry. Fixing the positions instead left every existing sentence true, so the diff is the lane logic rather than a rewrite the reader has to re-read.
**Tradeoff:** Gained a small, reviewable diff and prose that still reads linearly; accepted that a `code-risk` run's first step is called "step 3", which is momentarily odd until the convention line is read.
**Conséquences:** Any future edit to `/esq:converge` — and any conformance clause pinned to it — must keep the numbers meaning positions. A report line saying `2/2 steps` on a `code-risk` run is counting steps run, not position numbers; the two are deliberately different quantities.
**Alternatives rejetées:** Renumbering per lane so every run starts at step 1 — reads naturally in isolation, but then "step 2" means a fix on one lane and a review on another, and every cross-reference in the file becomes lane-conditional.

## D-lane-stats-prints-prose-for-a-human — A CLI read for a human prints prose; the criterion is the audience

**Scope:** arch
**Topic:** cli
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** Every `esq` subcommand emits one JSON object because skills parse the output — with one documented exception, `telemetry summary`, which prints a report. `esq lane stats` arrived with the same shape: a table for a person deciding whether a lean lane is actually cheap, and no skill routing off its numbers. The existing rule was written as a count ("the summary alone"), which a second such command makes false.
**Décision:** The exception is stated as a criterion, not a list: a read whose audience is a person at a terminal and off which no skill routes prints a table by default and gives the same numbers behind `--json`. `telemetry summary` and `lane stats` are the two that satisfy it today.
**Raison:** The rule's reason was always the audience — "skills parse the JSON; a human reads the summary" — so freezing it as a count of one made the next honest case look like a violation. Writing it as a criterion keeps a mutating or skill-facing subcommand JSON-only, which is the part that actually protects callers, while letting a measurement command be readable without a `| jq` pipeline.
**Tradeoff:** Gained a rule that survives the next human-facing read and a stats command that is legible as typed; accepted a second renderer to maintain and two documentation sites (`docs/ARCHITECTURE.md`, the `plugin-runtime` project skill) that still state the old count and now need updating.
**Conséquences:** A new subcommand must answer the audience question before choosing its output shape, and any subcommand a skill later starts parsing must keep `--json` as the stable contract — the prose is not an interface. The two stale prose sites are filed as a backlog item rather than edited from a phase that does not touch them.
**Alternatives rejetées:** JSON-only with `lane stats` piped through an external formatter — keeps the rule literally true, but the command exists to be read and would ship needing a second tool to read it. Making the prose the only output — loses the machine-readable form the acceptance criteria and any future dashboard need.

## D-lane-stats-measures-from-ledgers-not-history — Lane stats measures from the ledgers plus one git grep

**Scope:** arch
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** `esq lane stats` has to report, per lane, how often the corrective loop reopened and how many defects arrived after the lane's own pass closed. Both facts are historical, and the tempting source is git: a `git show` per plan over every commit that touched its brief. That would make the command that measures cost the expensive one — the failure `scripts/check-longrun.sh` exists to name.
**Décision:** The command reads the plan files, the corrective briefs and `docs/BACKLOG.md` as they stand today, plus exactly one `git log --oneline --grep='brief(fixes):'` over commit subjects; nothing else touches history.
**Raison:** Subjects alone carry enough to compute the reopen rate, because `/esq:fix` commits a distinguishable application marker (`clear <slug>, …` / `update <slug> …`) between one brief and the next. Dates come from the ledger filenames, which are already date-prefixed by convention. One bounded invocation gives both rates the acceptance criteria name, at a cost that does not grow with the number of plans.
**Tradeoff:** Gained a measurement command that runs in well under a second on any repo size; accepted one wrong column — the 🟢 tier count reads near-zero forever, because `/esq:fix` strips applied greens from the brief and deletes a brief whose items all applied, so the files on disk under-report exactly the findings the lean lane is supposed to be judged on.
**Conséquences:** Comparing lanes by finding *volume* is not supported by this command as built. **The other half of that claim — "the two rates are" — did not hold, and is amended by `D-reopen-rate-normalized-to-the-lane-itinerary` (2026-08-20):** as first built, `reopened` fired on `produced → applied → produced`, which is `full`'s own itinerary rather than a miss, and `closedAt` read the earliest *surviving* brief, so a loop that worked lost its date to `/esq:fix`'s deletion. Both rates are now normalized to the finder budget of the lane's itinerary, and the dates come from the history read rather than from the ledger filenames this entry's Raison named. What did hold is this entry's cost bound: still exactly one `git log`, now `--format='%h %ad %s' --date=short`, still O(1) in the number of plans. Correcting the green column means revisiting that bound, which is a decision about cost and not a bug fix — filed as **B-057** so the tradeoff is re-decided rather than quietly widened.
**Alternatives rejetées:** A `git show <commit>:<brief>` per producing commit — correct tiers, but O(plans) subprocesses in a command whose whole point is that measurement should be cheap enough to run habitually. Stamping the tier counts into the brief's commit message at production time — accurate and free to read later, but it changes what three other commands write for the benefit of a fourth, and says nothing about the briefs already in history.

---

## D-reopen-rate-normalized-to-the-lane-itinerary — The lane rates are normalized to the itinerary the lane bought

**Scope:** arch
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** `esq lane stats`' `reopened` rate fired on `produced → applied → produced`, which is not a miss on the `full` lane but `full`'s own itinerary running correctly — check writes a brief, `/esq:fix` clears it, review writes a second. A healthy `full` run therefore scored a reopen (7/29 · 24% in this repo, none of them a miss) while a one-finder lean lane structurally could not score one at all, and the bias ran toward flattering the lean lane — the exact drift the command exists to detect. `postPassDefects` carried the same bias through `closedAt`, which took the earliest *surviving* brief and so fell back to the execution log whenever the loop actually worked.
**Décision:** Both rates are normalized to the finder budget of the itinerary the plan's lane buys (`full` two, every lean lane one): a plan is *reopened* when more corrective briefs were produced for it than its lane bought, and `closedAt` is the date of the last brief-loop event inside that budget — with post-pass defects counting `docs/BACKLOG.md` citations only, so a brief beyond the budget is read once, as a reopen.
**Raison:** What the table compares *is* which itinerary each plan bought, so a rate defined against a constant cannot compare them. Normalizing to the lane's own budget makes one fact explain both rates, and it removes both readings' dependence on which briefs happen to survive on disk after `/esq:fix`. The cost bound of `D-lane-stats-measures-from-ledgers-not-history` is preserved: still exactly one `git log`, now with `--format='%h %ad %s' --date=short` so the dates come from the history rather than from whichever file was not deleted.
**Tradeoff:** Gained two rates that mean the same thing in every row of the table; accepted that the budget is a ceiling, not an exact expectation — a `/esq:converge` run entered from an existing brief spends one finder fewer, so a genuine reopen on such a run reads as normal.
**Conséquences:** `D-lane-stats-measures-from-ledgers-not-history`'s claim that "the two rates are [supported by this command as built]" is amended by this entry; its one-history-read bound stands. The 🟢/🟡/🔴 tier columns remain undercounted by design (B-057) — that is the same decision's other tradeoff and is not touched here.
**Alternatives rejetées:** Encoding each itinerary's expected `produced → applied` pairs and firing past the last one — more machinery for the same verdict on every history this repo contains, and it leaves `closedAt` broken. Withdrawing the reopen rate entirely — honest and smallest, but it deletes the most direct evidence a lane was too cheap and leaves the command with one working rate over a thin sample.

## D-inline-fix-leaves-a-direct-lane-anchor — An inline fix leaves an anchor, not nothing

**Scope:** arch
**Topic:** assurance
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** `/esq:work` verdict 9 committed a fix and closed the backlog row while writing nothing to `docs/plans/`, so `/esq:converge` refused for want of a plan path and bare `/esq:check` / `/esq:review` fell back to the most recently modified plan — a full adversarial pass over someone else's diff, reported as if it were about the fix (B-060).
**Décision:** The inline verdict writes `docs/plans/<date>-<slug>.md` as a third commit, carrying `## Done looks like`, an `## Assurance` block whose axes compute `direct`, one phase, and a `## Execution log` entry (written through `esq plan append-log`) citing the fix commit; `route` still writes nothing.
**Raison:** The three consumers already resolve their target from `docs/plans/`, so giving them the file they look for fixes a defect in one command instead of editing three. It also settles the debt `D-direct-lane-keeps-one-finder` took on — every route was supposed to leave an artifact its missed defects could be attributed to, and the inline path was the one still leaving none.
**Tradeoff:** Gained a corrective loop and a `lane stats` row that point at the change that was actually made; accepted a third commit and one `docs/plans/` entry per typo.
**Conséquences:** `docs/plans/` gains a class of member no phase was ever built from, so `esq lane stats` will show `direct` rows carrying a finder budget they never spent — a known bias to capture and correct in the stats, never by mis-declaring the anchor's lane. `docs/SPEC.md` § *Working an item* and `docs/ARCHITECTURE.md`'s `docs/plans/` writer row are refreshed by their own commands once this ships.
**Alternatives rejetées:** An anchor with no `## Assurance` block — `esq lane` defaults a block-less plan to `full`, so a two-line fix would advertise a four-subagent loop. Teaching `/esq:check`, `/esq:review` and `/esq:converge` to refuse a bare fallback instead — it makes the nuisance louder without giving the user anything to point the loop at, and edits three commands to fix a defect in a fourth.

## D-work-captures-free-text-before-routing — Free text is a target, captured before the verdict

**Scope:** arch
**Topic:** backlog
**Date:** 2026-08-20
**Statut:** Active

**Contexte:** `/esq:work`'s preflight resolved a target three ways — an ID, no argument, or several IDs — and free text matched none of them: unspecified rather than refused. The documented quick path was therefore two commands (`/esq:backlog <text>` then `/esq:work B-NNN`), and that friction pushed toward fixes landing with no row at all, invisible to `/esq:sweep` and `esq lane stats` and unjoinable from the commit subject (B-061).
**Décision:** An argument that is neither an ID shape nor `route` nor empty is item text: `/esq:work` mints the row from the working tree's reserved ID block, commits `docs/BACKLOG.md` alone, and enters the existing verdict ladder with that ID — for every verdict, `route` included, since the row *is* the resolved target. An overlapping open row is routed rather than duplicated; an ID shape matching no row keeps hitting the existing refusal.
**Raison:** The ID has to exist before the verdict is printed, because the verdict's copy-pasteable `→ Next` line, the code commit's `(B-NNN)` subject and B-060's plan anchor are all keyed on it — minting it lazily on the inline path only would starve the plan and grill verdicts of the very thing they need. Capturing by reference to `/esq:backlog` Mode A rather than by copying its type, priority, dedup and epic-tag heuristics keeps one copy of rules no audit check compares across files.
**Tradeoff:** Gained the one-command quick path B-061 asks for and a `B-NNN` on every fix that goes through it; accepted that `/esq:work` is no longer read-only outside the inline verdict, that it becomes the sixth minter of a permanent citation key, and that one more commit lands per free-text pass.
**Conséquences:** `work` joins `audit.sh`'s `ALLOC_FILES` as the sixth carrier of the `B-NNN` allocation rule, held byte-identical with the other five. README § `/esq:work`'s "read-only for every other verdict" and its artifacts cell stop being true and are rewritten here; `docs/SPEC.md` § *Working an item* and `docs/ARCHITECTURE.md`'s `docs/BACKLOG.md` writer row are refreshed by their own commands once this ships. Every quick fix now leaves a row, which biases `esq lane stats` toward `direct` in the same direction B-060's anchor does — capture it, never record less to flatten it.
**Alternatives rejetées:** Recognising free text and printing the two-command line — it documents the fall-through without closing it, so the friction the item is about survives. Routing the text with no row and minting the ID only on an inline verdict — it splits one rule along a seam decided long after the target must be named, and leaves `/esq:plan` nothing to mark `Planned`. Copying `/esq:backlog` Mode A's heuristics into `work` — a seventh unguarded duplicate of definitions `docs/AUDIT.md` already tracks as a drift source.

## D-pinned-sentence-outranks-a-rewrite — A pinned conformance sentence survives a rewrite of the paragraph around it

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** Phase 1 of `work-accepts-free-text` rewrote `/esq:work`'s first Constraints bullet to name a second mutation path, and in doing so reworded a sentence `docs/CONFORMANCE.md` P-06 pins verbatim — five audit findings, from a change whose meaning P-06 does not police.
**Décision:** When an edit collides with a pinned sentence, the paragraph is reshaped around that sentence and the clause kept byte-for-byte; the `need` line is edited only when the *behavior* it pins actually changed.
**Raison:** A needle is cheap to edit and that is exactly the danger — updating it to match whatever the file now says converts the guard into a mirror of the file, which can never fail. Preserving the sentence keeps the pin external to the edit, which is what makes it evidence. It also costs almost nothing: a bullet can carry a new claim and an old sentence in the same breath.
**Tradeoff:** Gained — the conformance guard keeps its independence from the text it guards. Accepted — pinned regions are stiffer to edit, and a rewrite there costs one reconciliation pass.
**Conséquences:** Any plan whose phases touch a region another plan pinned must budget for reconciliation (this plan's own Risks section named the collision in advance), and `check-conformance.sh` must be run against both `plugin/skills` and `commands/esq` before such a commit.
**Alternatives rejetées:** Update the `need` line to the new wording — fast, and it makes the guard follow the file instead of constraining it. Drop the needle — retires a contract nobody decided to retire.

## D-a-needle-may-pin-a-shared-sentence — A conformance needle may pin a sentence from a shared block

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** P-07 has to pin that a captured `B-NNN` comes from the working tree's reserved ID block and not from the backlog's global maximum. The only sentence in `plugin/skills/work/SKILL.md` that says so is inside the `<!-- id-allocation -->` markers — the same paragraph, byte-identical, in six command files.
**Décision:** Pin that shared sentence as the P-07 needle rather than writing a `work`-specific paraphrase beside it.
**Raison:** `need` greps only the one command's target, so a shared sentence is no weaker a pin than a unique one; and `check-sharedblocks` already fails the build if the six copies diverge, so the needle cannot be satisfied by a copy that drifted. Writing a paraphrase to avoid the coupling would put a second statement of the allocation rule into the very file the block exists to keep from having one — the drift `docs/AUDIT.md` § *Known duplicated definitions* tracks.
**Tradeoff:** Gained — no second wording of the allocation rule, and the pin rides a paragraph a registry already holds identical. Accepted — narrowing or rewording the `id-allocation` block now reddens P-07 as well as the block registry, so both must move together.
**Conséquences:** A future edit to the `id-allocation` block is a two-file change: the six carriers and `scripts/check-conformance.sh`'s P-07 needle. That coupling is the reason it is written down here rather than discovered by whoever next narrows the block.
**Alternatives rejetées:** A `work`-only paraphrase of the allocation rule — a seventh statement of a rule that exists as one block precisely so there is only one. Leaving the reserved-block clause unpinned — P-07's scenario asserts it, and D-conformance-needle-traces-to-its-scenario runs both ways: a sentence the scenario states and no needle checks is a scenario that overstates what is enforced.

## D-runtime-evidence-from-a-bespoke-runner — P-07's runtime evidence is a bespoke runner, because `claude plugin eval` is gated

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** `docs/CONFORMANCE.md`'s preamble says the lexical check proves an instruction is present and that "plugin smoke tests must add that runtime evidence when the plugin exists". B-066 is that gap for P-07, and B-032 — the general form, roadmap `Later` — names `claude plugin eval` as the candidate vehicle for exactly this class of work.
**Décision:** Build `scripts/smoke-work-capture.mjs`, a dependency-free headless runner shaped like `scripts/probe-model-pins.mjs` (billed, on demand, `--parse` replays for free, never reachable from `audit.sh`), and revisit the port to `claude plugin eval` under B-032.
**Raison:** On Claude Code 2.1.238 both `claude plugin eval --json` and `claude plugin eval init --bare` print `` `plugin eval` is currently in early access `` and exit without doing anything (checked 2026-08-21, this machine), so its grader vocabulary cannot even be read to design against. Planning around a surface that cannot be exercised is planning around a guess, and P-07 is unverified today either way.
**Tradeoff:** Gained — runtime evidence for the free-text contract now, on a shape this repo has already proven and documented. Accepted — a second billed script to maintain, and a probable port once the gate opens.
**Conséquences:** B-032's campaign inherits a working precedent (seed a repo, run headless, harvest artifacts, judge purely, replay a capture) rather than a blank page, and whichever vehicle it picks has four concrete branch assertions to reproduce. `tests/smoke/` joins the ungated suites B-053 is about.
**Alternatives rejetées:** Author a `claude plugin eval` suite now — the subcommand is inert on this account, so the suite could be neither run nor validated. Extend `scripts/check-conformance.sh` with a live mode — fuses a free check every `audit.sh` run executes with a billed one that must never be in `audit.sh`, and hands stream-json and git parsing to bash.

## D-a-runtime-eval-judges-artifacts — A runtime evaluation is judged on artifacts, not on the model's prose

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** The four P-07 branches all announce themselves in the transcript — `Already tracked as B-001 — routing that one.`, the `Captured from your text.` clause, the refusal line — so greping the transcript is the obvious way to judge a run, and the wrong one.
**Décision:** Each branch's verdict is computed from the scratch repo's state after the run — commits and their file lists, `docs/BACKLOG.md` rows, the `docs/plans/` anchor and `esq lane`'s output on it, the seeded check's exit code — and the corroborating sentence is recorded as an observation column that never gates the verdict.
**Raison:** The skill is free to reword any sentence it prints and is not free to change what it writes to the ledger; a prose judge therefore reddens on a harmless rewrite and stays green on a real regression that kept the wording. It also keeps the runtime evidence orthogonal to `check-conformance.sh`, which is already the pinned-sentence guard — two checks of the same sentence would be one check reported twice.
**Tradeoff:** Gained — a judge that measures the contract rather than the phrasing, and one that a skill rewrite cannot silently satisfy. Accepted — the harvester must know each artifact's shape, so it carries more code than a grep and moves whenever the artifacts themselves change.
**Conséquences:** Every future runtime evaluation states which artifacts it reads before it states which prompt it sends, and a branch judge never over-specifies judgment the skill is supposed to exercise — the duplicate branch asserts that no second row was minted, not whether `work` answered `/esq:plan` or `/esq:grill`.
**Alternatives rejetées:** Grade the transcript with an LLM judge — pays a model to answer a question `git log` answers deterministically, and makes the verdict itself non-replayable. Assert both prose and artifacts as gates — every skill rewording becomes a red branch, which trains the maintainer to ignore the script.

## D-a-mutated-fixture-carries-evidence-only — A fault-injection capture carries the evidence records, not the stream

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** `tests/smoke/` proves each of the four P-07 judges reds under its own fault, which needs four mutated copies of `tests/smoke/fixtures/capture.jsonl` — each breaking exactly one contract while the other three branches stay green. A full copy is 29 KB, so four of them add 115 KB of near-identical JSONL to the repo for four one-field edits.
**Décision:** A mutated fixture holds only the capture's `smoke-row` markers and `smoke-evidence` records — the stream events are dropped — and the mutated branch's marker carries a `mutation` field naming what was broken.
**Raison:** [[D-a-runtime-eval-judges-artifacts]] already puts the verdict on artifacts alone, so the events cannot change one; the evidence record embeds its own `stream` summary, so the rendered table is identical either way. What makes the trim safe rather than merely convenient is that a test asserts it: blanking every assistant message and every `stream.text` in the good capture must leave all four verdicts green and every corroboration cell reading `not said`.
**Tradeoff:** Gained — half the bytes per fixture, and a diff a reviewer can read. Accepted — the mutated fixtures exercise `splitCapture`'s event grouping less than the checked-in capture does, so the good capture stays full and is the one that covers it.
**Conséquences:** Regenerating a mutated fixture means editing one field of one `smoke-evidence` record in a copy of the good capture, never re-running a billed session. A future judge that needs a stream event to decide something is a signal to revisit [[D-a-runtime-eval-judges-artifacts]], not to fatten the fixtures.
**Alternatives rejetées:** Check in four full copies — 115 KB of duplicate transcript whose every byte but one is noise in review. Build the mutations in the test file instead of on disk — then `--parse` itself is never exercised on a red capture, and the CLI's exit-1 path goes untested.

## D-a-measured-figure-is-dated-not-refreshed — A ledger's measurement is dated, and a correction never re-quotes the wrong number

**Scope:** arch
**Topic:** cost
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** B-070's rewrite had to replace a wrong measurement with a right one, over a corpus that grows every time an agent runs. Re-running the corrected script during the same phase already returned 1.210 calls/turn over 24,467 turns against the 1.068 / 24,403 being written — the glob covers every project's subagents, including the runs doing the writing.
**Décision:** The figure in the ledger is the one measured on its stated date and is not refreshed to whatever the script returns today; and the paragraph correcting an earlier figure states the error as a magnitude (`+21%`, `+83%`) rather than quoting the superseded number.
**Raison:** A number without a date is unfalsifiable — a reader cannot tell a moving corpus from a moved metric, which is exactly the confusion the acceptance test exists to resolve. And the plan's own `(auto)` step greps for the stale figures; a grep cannot distinguish a citation from a claim, so quoting the old number inside its own correction fails the check that guards it — as this phase's first commit did.
**Tradeoff:** Gained — every figure in the backlog is falsifiable against a named date and a runnable script, and the stale-figure guard can stay a plain grep. Accepted — the ledger drifts from the live corpus between deliberate re-measurements, and a reader wanting today's number must run the script.
**Conséquences:** Any later item repricing this one re-runs the embedded script, writes its own dated block, and describes the delta rather than restating the old figures. A guard that greps for superseded values stays viable for the whole family of cost items.
**Alternatives rejetées:** Refresh the figures on every read — makes the acceptance test unfalsifiable, since the baseline moves with the measurement. Loosen the grep to allow quoted history — removes the only mechanical protection against a stale number being copied forward, which is how the original per-round-trip figure survived unchallenged for as long as it did.

## D-a-match-is-never-read-through-a-pipe — A `grep -q` test never reads through a pipe

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** `scripts/audit.sh` and `scripts/worktree.sh` run under `pipefail` and held nine pipelines
ending in `grep -q`. `grep -q` exits on its first match, the producer upstream dies of SIGPIPE with
status 141, and `pipefail` promotes that to the pipeline's status — so a successful match reads as a
failure. B-068 saw it twice in the wild on the repo's only pre-commit gate, at roughly 1 in 500.

**Décision:** in any script setting `pipefail`, a match test captures its input first — `grep -q P
<<<"$var"`, or `case "$var" in *"$s"*)` where the test is a plain substring on a scalar — and never
pipes a producer into an early-exiting reader. `scripts/check-sigpipe-shape.sh` refuses the shape
across `scripts/*.sh`, fault-injected by `scripts/test-sigpipe-shape-guard.sh`; they landed on
2026-08-22 as audit checks 37 and 38 — the next free numbers, the ask-shape pair having taken 35/36.

**Raison:** the alternative fixes all hide the status rather than repair it. Tolerating 141 at each call
site (`|| [ $? -eq 141 ]`, or a local `set +o pipefail`) makes a producer that died for a real reason —
malformed input, a failing `git` — indistinguishable from a successful match, which is the same defect
one level down. `trap '' PIPE` does not even fix it: the write still fails, at status 1 instead of 141.
Capturing first is the only form where the producer runs to completion and the status means what it says.

**Tradeoff:** gained, a gate whose red lines are believable and a check that makes the class
unrepeatable; accepted, a variable held in memory where a pipe used to stream, and one more numbered
check with its own fault injection to maintain.

**Conséquences:** new guard scripts follow the same rule, and the check will report any that do not.
The guard covers `grep -q` only — five `| head` sites remain, live-defect-free because their status is
discarded, tracked as B-078; widening the check without fixing them first would redden the audit.

**Alternatives rejetées:** tolerate 141 per site (destroys the meaning of a genuine failure, and B-068's
own notes rule it out); ignore SIGPIPE process-wide (does not fix the non-zero status, and breaks the
legitimate `| head` idioms in the same files); relax `pipefail` for these scripts (it is load-bearing in
every other pipeline in both files).

## D-advance-target-selects-within-now — `/esq:advance`'s target selects within `Now`, never outside it

**Scope:** arch
**Topic:** roadmap
**Date:** 2026-08-21
**Statut:** Active

**Contexte:** `/esq:advance` was the only one of the three orchestrators with no target — its preflight took every `## Now` entry unconditionally and its body never read `$ARGUMENTS` — so a seven-entry horizon was 14 sequential Opus subagents or nothing (B-077).
**Décision:** The argument resolves to exactly one `## Now` entry — by slug heading, or by a `B-NNN` named in an entry's `covers:` — and anything it cannot resolve there is a hard stop before the first spawn, never a fallback to the full walk and never a reach into `Next` or `Later`.
**Raison:** The command's own constraint is that the roadmap's `Now` order is its input, never re-derived, re-sorted or skipped ahead; letting an argument target a `Next` entry would repeal that on the caller's say-so and make the horizon line advisory. The refusal is also the safety property the bug is about — a mis-aimed run that silently falls back costs exactly as much as an unaimed one while looking obedient.
**Tradeoff:** Gained: a walk that can be aimed, with a cost bound that reads true before anything is spent. Accepted: a target sitting in `Next` is refused rather than worked, and the user promotes it with `/esq:roadmap` or works the item with `/esq:work B-N`.
**Conséquences:** All three orchestrators now resolve a target in preflight in the same shape. A future scoping surface for `/esq:advance` — a horizon selector, multiple entries — is a new decision, not an extension of this one.
**Alternatives rejetées:** Resolving across every horizon (repeals the ordering constraint the command rests on). Filtering after the scan (a target matching nothing yields an empty list and reports as "the horizon is clear", which cannot be told from a typo).

## D-ask-shape-lives-in-zone-two — The ask shape lives in zone 2, not in a new shared block

**Scope:** ux
**Topic:** reporting
**Date:** 2026-08-21
**Statut:** Active — amended 2026-09-11 by [D-announcements-and-asks-stay-minimal]: zone 2 now holds only unresolved requests, each executable one carrying its exact command, and `→ Next` repeats the first; the character cap and the opener registry are unchanged.

**Contexte:** B-080 reported that every ask an esq command makes — decision, manual verification, next step — arrives as prose, so the actionable part must be extracted by the reader. The shape had to be stated once and mechanized rather than restated in twenty files.
**Décision:** State the shape inside the conclusion block's zone 2 (one numbered action-first line per ask, ≤ 12 words, starting state bracketed first, no lead-in and no restatement), and guard it with `scripts/check-askshape.sh` + `scripts/test-askshape-guard.sh` over the conclusion templates.
**Raison:** Zone 2 *is* the ask surface, and check 18 already hashes that block across its 15 carriers with `check-skill-parity.sh` holding the mirrors byte-equal — so the rule costs no new marker family, no registry line and no carrier list. A separate `shared:ask-shape` family would reach `plan`/`grill`/`ui`, but those already route their asks through the `decision-block` and `escape-hatch` blocks, so the extra reach is mostly notional while its cost lands in all 30 files.
**Tradeoff:** Gained one rule in one place, already enforced by existing hash checks; accepted that the shape is only stated where a conclusion is printed, and that the new guard covers the templates the model imitates rather than a given run's runtime prose.
**Conséquences:** A command that asks outside a conclusion inherits the shape only through the decision block; if a future ask surface needs it standalone, that is a new decision. The guard is an extracted pair (checks 35–36) because fault-injecting an inline check would re-run the other 34.
**Alternatives rejetées:** A new `shared:ask-shape` registry family — rejected on cost in all carriers for reach the decision block already provides. Extending check 18 inline — rejected because its fault injection would have to run the whole audit.

## D-an-ask-cap-measures-the-rendered-line — An ask-shape cap measures the line a reader sees

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-22
**Statut:** Active

**Contexte:** `scripts/check-askshape.sh` caps a zone-2 ask at 100 characters and rejects a second sentence on the line. Both assertions are trivially wrong when taken literally against this corpus: `mawk`'s `length()` counts bytes, and the longest legitimate ask — `commands/esq/fix.md`'s 🔴 placeholder — is 97 characters but 107 bytes, so a byte cap reds a clean set on the day it lands. Every conclusion template also hangs evidence off the right of an ask behind a run of spaces (`attempts?   ⚠️ debt`, `<other>.md by hand — <error>   → esq validate`), which a naive sentence-boundary test reads as a second sentence.
**Décision:** The cap counts characters — byte length minus the UTF-8 continuation bytes, computed in the same awk pass — and a sentence break is `[.?!]` followed by a *single* space and more text, so two or more spaces are a column separator. A narration opener matches as a whole word, never as a prefix. Each rule is pinned by a fault-injection case that must **not** fire: a 96-character/109-byte ask, a `?` before a column, and `Weigh` as a verb that starts with `We`.
**Raison:** A guard whose measurement disagrees with what the reader sees does not enforce the rule — it enforces an artifact of the tool, and the first thing it costs is the template it was built to protect. The must-not-flag cases are what make that durable: a future rewrite to the obvious `length($0)` reds immediately instead of quietly forcing a worse template. It is the same principle as D-narrow-check-not-canonical-wording one layer down — narrow the check to its intent rather than make the corpus lie.
**Tradeoff:** Gained a cap that means what it says and a guard that cannot be simplified back into wrongness. Accepted three heuristics that are corpus-shaped rather than universal — a template that abandoned the multi-space column convention would need this revisited, and the script header says the cap is widened rather than the line mangled if a legitimate ask ever exceeds it.
**Conséquences:** Any future check measuring prose length in this repo counts characters, and any check reading these templates treats a multi-space run as structure. <!-- corrigé 2026-08-26 : la portée décrite ici est périmée --> The reach clause this entry once carried — that `check-askshape.sh` only ever sees `commands/esq`, and that `check-skill-parity.sh` (check 27) carries the enforcement to `plugin/skills/` — stopped being true on 2026-08-26: the check now reads both corpora directly (D-a-guard-reads-the-source-then-the-mirror), and check 27's parity was never a proxy for `build`, which is one-directional there.
**Alternatives rejetées:** A byte cap raised to 110 to accommodate the emoji — rejected: the number then means nothing to a template author and drifts with every multibyte character added. Requiring `gawk` for character-aware `length()` — rejected: the audit runs on whatever `awk` the machine has, and one arithmetic line costs nothing. Stripping multibyte characters before measuring — rejected: it makes the reported length wrong in the finding the author has to act on.

## D-an-action-first-test-is-a-verb-registry — An action-first test is a declared verb registry, not a narration denylist

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-22
**Statut:** Active

**Contexte:** `scripts/check-askshape.sh` claimed to enforce "the action first" with a six-word narration denylist (`Please|You|We|Note|It|There`). Replayed against the four asks B-080 was actually filed about — `Retry budget on the webhook sender`, `src/billing/ledger.ts appends out of order — …`, `B-153 blocks redis-queue-trio — …`, `Panier — la spec dit …` — the guard shipped green on all four: none is over the cap, none is two sentences, none opens with one of the six words.
**Décision:** Assert the opener positively. After stripping a leading `[<starting state>]` and exempting a pure-placeholder line, the ask's first word must appear in a registry of declared action verbs kept in the script; what the opener *looks* like (a path, a `B-NNN`, a backticked token) only selects which finding is printed.
**Raison:** A denylist tests for six ways to be wrong; the rule is one way to be right, and only a positive test can measure it. It is what the ecosystem uses for the same problem — gitlint's `title-imperative-mood` (Z1) and pydocstyle's `D401` both match the first word against a verb wordlist rather than parsing (checked 2026-08-22). The corpus is 19 lines across 15 templates, so a registry is cheap to seed and the false-positive surface is visible in the file rather than implied by a heuristic.
**Tradeoff:** Gained a check that reds on the bug it was built for. Accepted that a new legitimate verb stops the commit gate until someone adds one registry line, that the registry is language-scoped (`Capturer` is already in it), and that prose hidden inside `<…>` escapes this assertion — the cap and the sentence test still cover it, and the script header says so.
**Conséquences:** Any future check in this repo asserting a shape rather than forbidding a wording states the accepted set explicitly and prints the line to edit in its own finding. This is a declared-opener test and deliberately not a parts-of-speech one: `Retry` is caught because it is undeclared, not because it is a noun.
**Alternatives rejetées:** Shape rules alone (flag a path, an ID, a word followed by an em dash) — rejected: `Retry budget on the webhook sender` passes every one of them, so the review's first example would still ship green. A grammar or parts-of-speech heuristic — rejected: no dependency for it is available to a pure-awk audit, and its false positives would not be visible to the author who hits them.

## D-wait-once-ships-as-a-shared-block — The wait discipline ships as a shared block, not as build's bullet

**Scope:** arch
**Topic:** cost
**Date:** 2026-08-22
**Statut:** Superseded by [D-wait-protocol-waits-for-the-safety-net] the same day, before any phase ran — a 2.1.239 harness probe and a corrected population measurement removed both of this entry's premises. Kept rather than deleted: the registry-over-per-block-check argument is still right, and the carriers it names are the ones a future protocol has to reconcile.

**Correction 2026-08-22:** the measurement below is stated over 685 subagent records; the eligible population is the 141 `esq:build`/`fix`/`work` agents esq telemetry labelled, where the figures are 152 removable poll turns in 47 agents and 38 of 153 launches followed immediately by a status call (B-085). The protocol this entry assumed — background everything slow, then wait — was also unprobed: `BashOutput` and `TaskOutput` do not exist in a worker's tool set on 2.1.239, and a subagent that stops with a live background child is finished, not waiting. And the three carriers do not share a lifecycle: `fix` verifies each correction before committing it and has no execution log to record a duration in, `work` verifies before its single commit with almost nothing left to overlap. A shared block may hold only what is identical by design, and this was not. The frozen baseline then settled it empirically — **all 123 excess status turns are `build` agents; `fix` (30 agents) and `work` (8) measure zero** — so two of the three carriers had no evidence behind them at all.

**Contexte:** A transcript audit over 685 subagent records (2026-08-22) measured 210 blocking waits of five seconds or more costing 4.6 hours — more than every test suite, typecheck and build in the same corpus — with 71 of 127 background launches followed immediately by a blocking wait. `build/SKILL.md` told the agent to background the slow check and never told it how to collect the result, so every agent improvised a `sleep` loop. `fix` and `work` run the same shape at their own verification step.
**Décision:** State the rule once as `shared:wait-once`, carried byte-equal by `build`, `fix` and `work` in both trees and registered as one line in `check-sharedblocks.sh`; `check` and `review` are deliberately not carriers.
**Raison:** The rule is identical in all three by design — launch in the background, spend the result-independent work first, wait at most twice, record the duration — and nothing downstream tests that a prompt worked, so a carrier stating it weaker *is* the defect rather than a style difference. That is the same reasoning that put `shared:read-once` in the registry, and the registry costs one line where a per-block check costs forty.
**Tradeoff:** Gained a rule that cannot drift and a fault injection that proves a softened copy reds. Accepted that the guard runs against `commands/esq` alone, so a softened *plugin* copy of the `build` block can still pass until B-083 closes — which is why the phase diffs both trees by hand.
**Conséquences:** A fourth command that ever runs a slow check joins the carrier list rather than writing its own paragraph. `check` and `review` stay out for as long as they run no slow check; a copy in a command that never waits would be text it never uses, which is the `shared:log-skeleton` precedent.
**Alternatives rejetées:** One bullet in `build/SKILL.md` — rejected: `fix` and `work` keep improvising, and an unmechanized prose rule that has already been stated once is not a fix. An `esq wait <task-id>` subcommand — rejected twice over: the CLI owns structure and never orchestration (`D-cli-owns-structure-model-owns-judgment`), and it cannot see the harness's background-task table at all, so it could only poll worse than the agent can.

## D-append-log-refuses-an-unknown-key — One canonical log-entry schema, and a refusal derived from it

**Scope:** func
**Topic:** ledgers
**Date:** 2026-08-22
**Statut:** Active

**Contexte:** `renderLogEntry` ignores any key it does not know, has none for the `**Reconciled:**` and `**For Phase N+1:**` fields `build/SKILL.md`'s template requires, renders a paused entry's results under a heading that template does not use, and `esq plan append-log --help` reads `--help` as the plan path. An Opus worker guessed the payload from the markdown template and shipped a hollow entry live on 2026-08-19 (B-049); 60 of the 87 eligible agents that wrote an entry have since gone to the source to find the interface, 240 calls and 29.6 M cache-read.
**Décision:** One `LOG_ENTRY_SCHEMA` constant in `cli.mjs` — key, type, per-status requirement, illegal combinations — from which both the validator and `--help` are generated. A payload is refused before the plan file is read when it carries an unknown key, omits a required key, carries a required key whose value is empty, gives a key the wrong type, or puts `forNextPhase` on a paused entry. The worker prompt carries one exact `completed` and one exact `paused` example and a pointer to `--help`, never a third copy of the field list.
**Raison:** Unknown-key rejection alone removes the symptom and leaves the incident: a payload of valid-but-empty keys still renders `completed` with `- Not recorded.`, which is what the hollow entry was made of. Deriving help from the same constant is what stops documentation drifting from validation, and it is cheaper than the audit check that would otherwise be needed to hold two descriptions equal.
**Tradeoff:** Gained a ledger that cannot silently lose a field and an interface a worker can read in one call. Accepted a contract change — a caller sending an unknown or empty-required key now exits nonzero — which is why the three real payloads (build completed, build paused, `/esq:work`'s inline anchor) are replayed in the tests rather than reasoned about.
**Conséquences:** A field added to a log-entry template gets its schema key in the same change, or the template cannot be satisfied through the CLI the skill mandates. `planCommittedAt` keeps its `'unversioned'` default because `/esq:work` relies on it. The prompt example stays deliberately partial; expanding it into a field table re-creates the drift this avoids.
**Alternatives rejetées:** Warn and continue — the current behavior wearing a message; the hollow entry still ships. Render unknown keys generically — a typo would invent a field in a ledger other commands parse. Document the schema in the skill only — the worker reaches for `--help` first and the missing keys stay missing. A new audit check that every subcommand answers `--help`, with its fault-injection pair — refused by the right-sizing audit: two scripts, two permanent checks and a global renumber colliding with B-082, for a class with one measured instance, and it would have parsed a user-facing error string as a subcommand registry.

## D-wait-protocol-waits-for-the-safety-net — The wait protocol waits for the runtime evals; the ledger fix does not

**Scope:** prod
**Topic:** cost
**Date:** 2026-08-22
**Statut:** Active

**Contexte:** B-085 (how a worker waits for a slow check) and B-049 (the execution-log payload) were planned together on 2026-08-22 as "the same defect on two surfaces". An adversarial review and a 2.1.239 harness probe found the coupling was abstract and the ordering wrong: `docs/ROADMAP.md` puts `runtime-evals` (B-032) ahead of every workflow and cost rewrite, and B-085 changes the exact surface — collecting a verification result — where a premature completion makes broken work look green.
**Décision:** Split them. B-049 ships as `execution-log-writer-integrity`, closed by deterministic tests — behind `audit-gate-reliability` (B-068), which the roadmap already names as its prerequisite and which reproduced its random red during this very correction session. B-085 is not planned until **both** `runtime-evals` (B-032), for the safety half, and `outcome-instrumentation` (B-073), for the value half, exist; it is then planned together with B-087, the same background-task contract seen from the other end.
**Raison:** A behavioral safety net authored after the change is authored against the new behavior, which is not a net — the roadmap's own reasoning, and this change is squarely in the class it was written for. B-073 is the second prerequisite for a reason this epic states itself: a saving argued from token totals alone is refused, and 16.1 M cache-read is 1.6% of the population's usage, which is exactly the size of claim that needs an outcome number beside it. The probe also removed the protocol this plan would have prescribed: `BashOutput`/`TaskOutput` do not exist in a worker's tool set, and a subagent that stops with a live background child has already returned its result to its parent, so "end the turn and wait for the notification" would report a phase before its verification landed.
**Tradeoff:** Gained a reliability fix that can ship as soon as its own gate is trustworthy, and a cost change that can be attributed because the baseline predates it. Accepted that ~16 M cache-read of excess polling keeps accruing until B-032 and B-073 land, at 1.6% of eligible worker cache read — a knowable price, paid deliberately.
**Conséquences:** B-085 stays `Open` behind a six-condition acceptance table — each with its numerator, denominator, mechanism, threshold and failure reading — rather than closing when prompt text ships; the safety condition is owned by B-032's journeys and outranks the three cost conditions. Any later plan touching how a worker collects a verification result inherits the same order. And every quoted figure from this corpus now carries the `--through` cutoff it was taken at, because the corpus grows underneath the script.
**Alternatives rejetées:** Keep one plan and build it now — refused: it bypasses a roadmap edge the user set, and it would make the cost change unattributable. Plan B-085 now and build it after B-032 — refused as false economy: the probe already changed the protocol once, and a plan written against an unbuilt safety net would be re-derived anyway. Drop B-085 — refused: the removable polling is real, measured, and 47 of 141 agents pay it.

## D-a-guard-reads-the-source-then-the-mirror — A reach-limited guard reads the source, then the mirror

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-26
**Statut:** Active

**Contexte:** `check-longrun.sh` (audit check 16) and `check-askshape.sh` (check 35) both enumerate their input as `<dir>/*.md`, a glob that only ever resolves to `commands/esq` — the temporary legacy rollback copy. Pointed at `plugin/skills` both exit 2. The parity check that was supposed to close the gap is one-directional for `build` (`scripts/check-skill-parity.sh:41-52`), so a clause added only on the plugin side reddens nothing (B-062, B-065, B-083).
**Décision:** Both checks read their corpus through one sourced enumeration that understands two layouts — flat `<dir>/*.md`, and native `<dir>/<skill>/SKILL.md` plus that skill's `references/*.md` — and `audit.sh` runs each check once per corpus, `plugin/skills` first.
**Raison:** The gate must read the tree that ships. A mirror is evidence about a copy, and this one is temporary by construction: `commands/esq` is deleted the day plugin, CLI and hooks pass conformance (D-plugin-primary-legacy-rollback), at which point a mirror-only guard covers nothing at all. Running both corpora costs one extra pass of a check measured at 38 ms and 9 ms respectively, and the day the mirror goes, the second call goes with it and the first is already correct.
**Tradeoff:** Gained coverage of the distributed source and a guard that survives the mirror's deletion. Accepted that two checks now share one helper where they shared nothing, so a defect in the enumeration is a defect in both.
**Conséquences:** Any future check whose reach is limited by a flat glob is fixed here rather than by widening the parity check. When `commands/esq` is deleted, each affected check loses its second call and nothing else.
**Alternatives rejetées:** Add a second call to the existing scripts unchanged — the glob matches nothing under `plugin/skills` and every carrier would be named `SKILL`. Make `check-skill-parity.sh` bidirectional — false by design (`build` is deliberately split, and the plugin carries frontmatter the flat file cannot) and temporary by design.

## D-a-conclusion-carrier-is-the-skill — A carrier is the skill, not the file

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-26
**Statut:** Active

**Contexte:** `check-askshape.sh` reads from `conclusion:start` to end of file, per file. That is exact for the flat mirror, where each command is one file. In the native tree, `build`'s conclusion marker sits in `references/decisions-and-backlog.md` while its three zone-2 asks sit in `references/reporting-and-stops.md` — a file carrying no marker of its own, and precisely the paused-phase relay B-083 was filed about.
**Décision:** For a native skill, the unit a corpus check judges is the carrier — `SKILL.md` plus its `references/*.md` — and a region opened anywhere in the carrier covers every file in it, the marker-bearing file's own pre-marker lines excepted.
**Raison:** A split skill is one prompt disclosed progressively, so its contract is not divisible by file. Fixing only the glob and keeping the file-scoped region would ship a check that reads `plugin/skills`, prints a clean summary, and covers none of the three asks it was extended for — a false green produced by the change meant to remove one.
**Tradeoff:** Gained coverage that follows the prompt rather than the filesystem. Accepted a wider region on the native side, so a numbered line in a reference file that is not an ask would now be judged as one — pinned by must-not-flag cases rather than left to inference.
**Conséquences:** Every corpus check reading a marked region inherits this scoping. Adding a reference file to a skill extends that skill's checked region with no wiring, which is the opt-out property the audit already requires of coverage.
**Alternatives rejetées:** Require a `conclusion:start` marker in every reference file — enrolment, which is the failure mode the long-run opt-out list exists to avoid; the file that forgets the marker is the one that drifted. Check only `SKILL.md` — leaves the surface B-083 filed uncovered.

## D-the-budget-suite-is-not-the-budget-check — Wiring the suite is not wiring the checker

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-26
**Statut:** Active

**Contexte:** B-053 asks for `tests/cost-budgets/` to be gated. D-cost-budget-checked-outside-the-audit keeps `scripts/cost-budgets.mjs` deliberately out of `audit.sh`, and the two read as a contradiction to anyone who meets them a year from now — which is how a later maintainer "resolves" it by unwiring the suite.
**Décision:** Wire `tests/cost-budgets/` into `audit.sh` as a numbered check, through the same `bounded_suite` helper checks 30 and 31 use, and say in the check's own comment what it is not: the suite reads checked-in fixtures and bills nothing, while `scripts/cost-budgets.mjs` reads one machine's telemetry store and stays outside.
**Raison:** The two artifacts fail differently. A broken checker is a repo defect any contributor can cause and every contributor should see. A budget breach is one machine's telemetry, and gating on it would redden a commit that did not cause it — the reason the script is out, and a reason that says nothing about its test suite. The suite also needs no fault injection of its own: it runs through `check-bounded.sh`, and check 32 already proves that runner turns a hang or a failure into a named red line.
**Tradeoff:** Gained a gate on the checker for ~0.59 s of audit time. Accepted one more numbered check, and the standing obligation to keep the distinction stated where the check is defined rather than only here.
**Conséquences:** `tests/probe/` and `tests/measure/` were folded in on the user's authorization of 2026-08-26 rather than left for a second wiring pass, so the check that shipped — 39, *The deterministic fixture-only suites pass* — gates all three in one `node --test` process under one bound and is headlined by the **set's** shared responsibility, not by one suite's. That supersedes this entry's original "headlined by its own suite" clause: adding a fourth fixture-only suite is still a line rather than a rename, but the responsibility the headline names is fixtures-only determinism. `tests/smoke/` waits on B-067 sanitizing its environment capture.
**Alternatives rejetées:** Leave the suite ungated — the defect B-053 filed, and the checker is the thing every budget claim rests on. Wire `scripts/cost-budgets.mjs` itself — refused by D-cost-budget-checked-outside-the-audit and by the audit's rule that a token- or machine-state-dependent script is never reachable from the gate.

## D-corpus-refuses-a-directory-of-prose — A directory of prose is unusable input, not a corpus of bad commands

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-26
**Statut:** Active

**Contexte:** `scripts/lib-corpus.sh` turns a directory into the ordered carrier list the fleet checks read, resolving both the flat legacy layout and the native `<skill>/SKILL.md` one. Stated purely as a layout test — "flat when the directory holds `*.md` at its top level" — it accepts `docs/`, whose seven top-level documents would then be judged as commands that run long and announce nothing.
**Décision:** A directory qualifies as a flat corpus only when at least one of its top-level `*.md` files opens with `---` frontmatter; every top-level `*.md` is then enumerated, frontmatter or not. A directory qualifying as neither layout is refused, and each caller turns that refusal into its own exit 2.
**Raison:** The vacuous-pass rule has a second direction nobody had written down. "Nothing to check" must never print as green — and a page of findings about `docs/SPEC.md` must never print as red, because a red on correct input is exactly the defect B-068 closed, and the fix for it gets applied to the corpus rather than to the check. Frontmatter is the one structural fact every command and every skill entrypoint already carries and no ledger document does, so the test needs nothing new to be maintained.
**Tradeoff:** Gained a refusal that is honest in both directions, and a `docs`-shaped verification step that passes as written. Accepted that the qualifier is a property of command files rather than of the layout, so a corpus of carriers that all dropped their frontmatter would be refused rather than flagged — loudly, and at the first run.
**Conséquences:** Coverage stays opt-out: qualification is decided by *any* frontmatter-bearing file, then every top-level `*.md` is a carrier, so a command that forgets its frontmatter is still judged rather than skipped. Any future fleet check reading a corpus inherits the refusal for free and only has to choose its exit code.
**Alternatives rejetées:** Enumerate on layout alone and let the caller filter — every caller then reimplements the same judgement, and the first one to forget prints nonsense findings. Require frontmatter per file — a carrier that lost its frontmatter would silently stop being covered, which is the enrolment hole the opt-out list exists to prevent. Hard-code an allowlist of corpus directories — the helper would then have to be edited before it could read a worktree, a copy, or a fixture.

## D-coverage-is-pinned-by-count — Coverage is pinned by a count, not by an exit code

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-26
**Statut:** Active

**Contexte:** Phase 3 of `native-source-audit-reach` widened `check-askshape.sh` from the flat mirror to the native tree and moved its region from the file to the carrier. The plan's own Risks name the failure that change can cause: carrier scoping silently *narrowing* what is covered — a false green on the one artifact whose whole job is not to be green when it should be red. Every obvious assertion misses it. A check narrowed back to file scope still exits 0 on `plugin/skills`; it just stops reading `build`'s reference file and reports sixteen asks instead of nineteen.
**Décision:** A fleet check widened to a second corpus carries an assertion comparing **what the two corpora counted** — asks, carriers, commands — and that assertion, not the exit code, is what pins the coverage.
**Raison:** The exit code answers "did anything red", which is exactly the question a check that has stopped looking also answers cleanly. The count answers "did it read the same corpus", which is the property actually at risk when the unit of judgement changes. And the mirror is the free control: the two trees hold the same twenty prompts, so any divergence in what they count is a defect in the check rather than in either tree — for as long as `commands/esq` exists, which is the window in which this class of change is being made.
**Tradeoff:** Gained an assertion that reds on a silent narrowing, proved against a scratch copy of the check with the narrowing applied rather than asserted by reading. Accepted that it is a *relative* pin: it goes quiet the day `commands/esq` is deleted, and the absolute counts in the plan's verification steps are what survive that.
**Conséquences:** Every guard covering both corpora states the comparison in one place and names the number, so a maintainer reading the pass line reads what was covered rather than that nothing failed. When the legacy mirror goes, each such assertion becomes an absolute count and must be restated, not deleted.
**Alternatives rejetées:** Grep the clean summary for the reference file's path — tried first and it fails on a *correct* check, because the summary names only the longest ask's location. Assert a bare non-zero exit on the fault cases and nothing on the clean one — the whole failure class here is a clean run over a corpus that shrank. Snapshot the summary line — pins formatting rather than coverage, and reds on every wording change.

## D-audit-injection-runs-on-a-scratch-repo — A whole-audit fault injection is proved on a copy, never on the tree

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-27
**Statut:** Active

**Contexte:** Check-level injections in this repo already copy their corpus (`cp -r plugin/skills "$T"`), but a check that can only be observed through a full `./scripts/audit.sh` run has no corpus argument to redirect — so plan steps reached for `sed -i` on the tracked script and a restore afterwards. Check 39's injection is the first of that shape: `scripts/cost-budgets.mjs` is production source, and the audit reads it at its real path.
**Décision:** Copy the whole repository — working tree and `.git` — into a scratch directory, mutate the copy, run `./scripts/audit.sh` there, and delete it; never `sed -i` a tracked file with a restore step as the safety net.
**Raison:** A restore step is only as good as the run that reaches it. An unattended agent killed mid-injection, a failed assertion that returns early, or a timeout all leave a corrupted production script in a tree that looks clean until the next commit ships it. The copy has no such window: the tracked tree is never in a broken state for a single instant, and the evidence is identical because the copy is byte-for-byte the tree under test.
**Tradeoff:** Gained an injection that cannot leave damage behind and needs no restore step to be trusted. Accepted ~53 MB and a few seconds of copy per injection, and a second full audit run rather than a mutate-restore pair over one.
**Conséquences:** Any future audit-level injection — a broken script, a deleted fixture, a corrupted ledger — is written against a scratch repo, and the pristine run on the real tree is what supplies the restored-and-green half of the assertion. Plan steps that spell an injection as an in-place `sed -i` on a tracked path are a finding in the reading pass, not a step to follow literally.
**Alternatives rejetées:** In-place `sed -i` with a `$T` restore, as check 39's plan step spells it — correct when it completes, and silently destructive when it does not. A `git worktree` instead of `cp -r` — cheaper, but the audit's own worktree-sensitive checks (10, install guards) behave differently from a linked worktree, so the copy would not be the tree under test. Asserting the finding from `bounded_suite` alone without an audit run — proves the helper reds, not that the gate does.

## D-a-capture-persists-derived-records-only — A capture persists derived records, never the harness's stream

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** `scripts/smoke-work-capture.mjs` and `scripts/probe-model-pins.mjs` both push the harness's `stream-json` events into their capture array verbatim and serialize that array into a file the repo checks in. A `system/init` line carries `mcp_servers`, `memory_paths`, `messaging_socket_path`, `session_id` and `apiKeySource`; every event carries `session_id` and `uuid`; every `assistant` line carries free-form model prose that can echo a path or an environment detail whatever its field name says. Both checked-in fixtures were trimmed once by a scratchpad script that did not survive its session, inconsistently — and `tests/smoke/fixtures/capture.jsonl` still publishes the maintainer's home path in `plugins[].path` (B-067).
**Décision:** Neither script persists a harness event at all. `scripts/lib/capture-schema.mjs` holds one table of the record types the scripts construct themselves — `smoke-row`, `smoke-evidence`, `probe-row`, `probe-evidence`, `capture-error` — each field justified by a named judge or a displayed column; `makeRecord` returns only schema keys, `writeCapture` refuses an unknown or incomplete record, and `assertSanitized` catches a record that bypassed `makeRecord`.
**Raison:** The only construction that makes free-form prose safe is not writing it, and the corroboration both judges compute from prose is a single regex that can run at capture time and persist as a boolean — smoke's `says` and probe's `replied`. Removing the events costs a capability the suite had already stopped using: smoke's `judgeCapture` prefers the persisted record over recomputing, and the four mutated fixtures carry no events at all and judge correctly (D-a-mutated-fixture-carries-evidence-only).
**Tradeoff:** Gained a checked-in artifact publishable without review and a fixture-only suite the audit can gate. Accepted that a capture can be re-judged only under the rule that captured it, and that `probe-model-pins.mjs` gains the evidence record it did not have.
**Conséquences:** **A schema failure never persists raw evidence** — not to a sibling, a temp file, a failure artifact or stderr. What survives is the sanitized prefix plus one `capture-error` record naming the index, the record type and the missing *key names*; privacy outranks sunk billed evidence. **The fail-closed contract is stated as it behaves:** an unknown field on a record the script constructs is dropped by `makeRecord` and never reaches the assertion, an unknown record type or a missing required key is refused, and `assertSanitized` detects an internal bypass — it is not a harness-field detector, and no document may claim it names a field a future Claude Code added. **This is the pattern B-032 inherits** for its six golden journeys: a billed live refresh on explicit demand, derived records persisted through this same schema, deterministic replay of that fixture in the gate — never a live run reachable from `audit.sh`, and never "store all model prose".
**Alternatives rejetées:** Allowlist the harness events and keep persisting them — smaller diff, but it keeps free-form prose in a public file and hands B-032 the wrong pattern. Sanitize inside `writeCapture` alone — covers every path to disk, but the raw stream survives in memory and there is no place to state the failure contract. A post-hoc `--sanitize <file>` subcommand — the scratchpad script with a nicer name, whose safety depends on a human remembering. A denylist of known-sensitive keys — refused by the requirement and by the evidence: the hand trim was a denylist applied from memory, and `plugins[].path` is what it missed.

## D-the-construction-brand-is-held-outside-the-record — The construction brand is held outside the record

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** `assertSanitized` (D-a-capture-persists-derived-records-only) has to answer one question at write time: did this record come from `makeRecord`, or did some other code path push it into the capture array? It needs a mark that survives from construction to the write, and that no other path can produce.
**Décision:** Membership is held in a module-private `WeakSet` inside `scripts/lib/capture-schema.mjs`, never as a property — symbol-keyed, non-enumerable or otherwise — on the record itself; records are frozen at construction as well.
**Raison:** A property is copyable. `{ ...record }` is exactly the idiom the live capture paths use today (`capture.push({ type: EVIDENCE_MARKER, ...evidence })`), so a property brand would travel onto a spread copy and certify a record `makeRecord` never reduced. A `WeakSet` cannot be spread, cannot be assigned and adds nothing to the serialized line, so the check answers about the object rather than about its contents.
**Tradeoff:** Gained a mark that no path outside this module can produce, and zero serialization surface. Accepted that the brand does not survive JSON: a record parsed back out of a capture file is unbranded and `writeCapture` refuses it.
**Conséquences:** Anything that rewrites a capture — regenerating a checked-in fixture, merging two captures — must rebuild each record through `makeRecord` rather than write the parsed objects back, which is the intended direction: a rewrite re-applies the current schema instead of preserving whatever an older one let through. A future record type must be constructed inside this module's `makeRecord`, never assembled by a caller and blessed afterwards.
**Alternatives rejetées:** A symbol-keyed non-enumerable property — invisible in JSON, but `Object.assign` and spread copy own symbol keys, so the copy would pass. A structural check (“the record has exactly the schema's keys”) — that is `validateRecord`, and it cannot distinguish a reduced record from a hand-built lookalike, which is the whole point of the bypass check. A counter or registry keyed by identity string — needs an id on the record, which is a field, which is copyable.

---

## D-an-equivalence-needs-an-outside-referent — An equivalence test needs a referent outside both sides

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** Task 2.3 asserts that a run captured through the new derived-record path judges exactly as the checked-in capture judges today. Both sides call the same production code — `row.corroboration` is one regex, run by `captureRecords` on the new side and by `withColumns` on the legacy side.
**Décision:** The four branches' corroboration columns are written into the test as literals (`SAYS_TODAY`), and the equivalence is asserted against those as well as against the other side.
**Raison:** A mutation that made the regex answer `false` everywhere left the test green: both halves moved together, so the comparison agreed with itself. The literal is the only value in the assertion that a change to the production code cannot move.
**Tradeoff:** Gained a test that reds when the corroboration stops being answered. Accepted that a deliberate change to a `corroboration` regex now costs one line of test maintenance, which is the point — it should be visible.
**Conséquences:** Phase 3's probe equivalence (Task 3.4) must pin its ten verdicts the same way; asserting the new path against the old one alone would reproduce the defect. Any later "the rewrite judges identically" test in this repo inherits the rule.
**Alternatives rejetées:** Comparing only the two production paths — the shape that was green under the mutation. Recomputing the expected value from the fixture's prose in the test — that is a third copy of the same regex, not an outside referent. Snapshotting the whole judged table to a file — a snapshot that regenerates on demand records whatever the code now does, which is the same failure with an extra artifact.

---

## D-the-pre-schema-capture-stays-replayable — A pre-schema capture stays replayable, on the read side only

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** The capture written before this change kept the run's columns in a nested `stream` object beside the raw harness events; the capture written now carries them flat with `says` already answered. The checked-in fixtures are not regenerated until Phase 4, and the plan's own risk note forbids reordering those phases.
**Décision:** `judgeCapture` derives the columns through a `withColumns` branch when a record carries no `says` boolean, so both shapes judge; `judgeEvidence` and every write path know only the new one.
**Raison:** The requirement is about what reaches disk, not about what can be read back. Deleting the branch would have forced the fixtures to be regenerated inside Phase 2, which is exactly the reordering that would destroy the "before" side of the equivalence the regeneration is checked against.
**Tradeoff:** Gained a phase boundary that holds without a flag day. Accepted one read path in the judge that no writer feeds after Phase 4.
**Conséquences:** Phase 4 may delete `withColumns` once both fixtures are regenerated, or keep it as a courtesy to a capture a contributor still has on disk — either is defensible, and the decision is recorded so the choice is made rather than inherited.
**Alternatives rejetées:** Regenerating the fixtures in Phase 2 — reorders the plan and removes the referent Task 2.3 compares against. Refusing a legacy capture outright — turns a contributor's saved evidence into a hard error for no privacy gain, since reading a file that already exists leaks nothing.

## D-the-refused-key-set-is-per-script — The refused-key set is per script, not one shared list

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** Phase 2 left `assertNoAmbient` and its `FORBIDDEN_KEYS` in `tests/smoke/work-capture.test.mjs` as the first draft of the recursive assertion Task 4.2 makes the primary privacy proof, with a note to reuse the walk. Porting it to `tests/probe/` showed the list cannot be reused as it stands: smoke refuses `usage`, and a `probe-evidence` `usage` is `result.modelUsage`'s keys — model names, and a displayed column. Smoke cannot refuse `text`, because `anchors[].text` is the scratch repo's own plan file that three judges read; probe must, because no probe record has a prose field at all.
**Décision:** The walk is shared and its refused set is not: each suite states the keys its own schema may never carry, with the asymmetries commented where they sit.
**Raison:** A key name means nothing on its own — what makes it a leak is the schema it appears in. One merged list is only safe at the intersection of both scripts, which is where it stops refusing `text` for probe, the exact class this whole change exists to remove.
**Tradeoff:** Gained a refusal that is as tight as each script's own schema allows. Accepted two lists to keep in step, each of which must be re-read when its schema gains a field.
**Conséquences:** Task 4.2 writes one walk over both fixtures with the refused set supplied per file, not one list for the repo. Phase 2's suggestion to refuse unknown keys against `SCHEMA` remains the stronger form and composes with this: the per-script list is the second line, naming what is forbidden even if a schema ever declared it.
**Alternatives rejetées:** One repo-wide list — drops to the intersection and stops refusing prose in probe. Renaming probe's `usage` field to avoid the collision — changes a persisted schema to suit a test's vocabulary, and the next collision is one field away.

## D-the-ambient-stream-is-rebuilt-in-the-test — The ambient stream is rebuilt in the test, never kept on disk

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** Both equivalence tests took their "ambient run" from the checked-in capture — smoke through the evidence record's nested `stream` object, probe through `splitCapture`'s raw events. Phase 4 regenerates both fixtures into schema records only, which removes exactly that input. The tests are the guard against a schema that blinds a judge, so losing them was not an option, and keeping a raw capture somewhere to feed them would reinstate the file this whole change exists to stop publishing.
**Décision:** Each test rebuilds the raw stream itself — `readRun`'s and `readStream`'s inverse over the fields the record kept, wrapped in the ambient identity the harness actually emits and the prose the model actually says — and drives `captureRecords`, the production write side, with it.
**Raison:** What the equivalence has to prove is that a stream carrying ambient fields and prose reaches disk as neither. That input has to exist somewhere; the only question is whether it exists as a checked-in file or as test code. As code it is readable, it names every field it is asserting gets dropped, and it cannot leak, because nothing about one operator's machine is in it.
**Tradeoff:** Gained a round trip that survives the fixtures being sanitized, with the leak classes spelled out where the assertion is. Accepted that the input is now a reconstruction: a field the harness emits that the reconstruction does not spell is a field the test does not exercise.
**Conséquences:** Both referents stay outside the code under test — probe's ten rows measured on 2.1.235 and smoke's four corroboration booleans, and smoke's per-branch sentence is owned by the test file now that the run's prose is gone. A future harness field belongs in `AMBIENT_INIT` in both suites, which is the one place to add it.
**Alternatives rejetées:** Keeping one raw capture out of the walk to feed the tests — republishes the environment under another name. Dropping the round trip and asserting only over the persisted records — proves the fixture is clean and says nothing about what the next billed run would write, which is the failure B-067 actually was.

## D-the-privacy-walk-is-total-against-the-schema — The privacy walk refuses undeclared keys, not just named ones

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** D-the-refused-key-set-is-per-script settled that a per-suite refused list cannot be merged, and left Task 4.2 to write "one walk over both fixtures with the refused set supplied per file". Writing it showed the per-file list is the weaker half: a list refuses what someone remembered, and the class this change exists to stop is the field a future Claude Code adds to an event nobody has read yet.
**Décision:** The primary proof, in `tests/capture-schema/`, walks every `*.jsonl` under `tests/` against `SCHEMA` itself — a key the table does not declare for that record at that position is a finding, at any depth — with one shared sensitive set as a second refusal and a home-rooted-string check as a third. The per-suite `FORBIDDEN_KEYS` lists stay where they are, guarding their own suite's records.
**Raison:** The schema is already the total statement of what may be persisted, so reading it is both the strongest refusal available and the one that cannot drift from what the writer enforces. The named set survives because a failure saying "machine or account identity" tells a maintainer which class was published, where "undeclared key" only tells them something was.
**Tradeoff:** Gained a refusal that covers fields nobody has thought of, and a walk that covers a fixture added later by finding it rather than by being told. Accepted that the walk is now coupled to the schema module, so a schema loosened in the permissive direction loosens the proof with it.
**Conséquences:** A new persisted field is a schema edit and nothing else — the walk follows. Adding a fixture needs no registration. `docs/ARCHITECTURE.md` records that check 39 gates this suite, so the walk runs on every commit rather than when someone remembers to replay it.
**Alternatives rejetées:** The per-file refused set as the primary proof — refuses only what was remembered, which is how the home path survived a hand trim. Grepping the fixtures for key names — reads the line a key sits on rather than the tree, and a nested leak is the one that gets missed.

## D-journeys-share-one-runner-harness — One runner harness under two billed evidence scripts

**Scope:** arch
**Topic:** audit
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** B-032's six orchestration journeys need exactly the machinery `scripts/smoke-work-capture.mjs` already has — a throwaway seed repo, a bounded headless spawn, reduction to schema records, a free `--parse` replay and a table — and copying it would fork roughly 350 lines that then drift.
**Décision:** The impure half moves into `scripts/lib/journey-runner.mjs`, parameterized by seed dir, rows and a harvest function; `smoke-work-capture.mjs` and the new `smoke-journeys.mjs` each keep only their rows, their judges and their own harvest.
**Raison:** The abstraction has two implementations in the plan that creates it, which is the only condition under which this repo builds one. The extraction is also the rare refactor with a free, exact proof: the checked-in P-07 capture must replay four green and must not change by one byte, so "nothing moved" is a verification step rather than a claim.
**Tradeoff:** Gained one place where the spawn, the shadow refusal and the write path are held, so a hygiene fix lands once. Accepted one phase whose deliverable is invisible to any user, and a coupling that makes the P-07 suite a regression test for journey work it does not care about.
**Conséquences:** A third billed evidence script is rows plus judges plus harvest. A change to how a run is spawned or persisted is reviewed once, against both captures.
**Alternatives rejetées:** A second standalone script — fastest to a first green journey, and the duplication this repo already refuses for shared prose. Extending `smoke-work-capture.mjs` with journeys — puts orchestration contracts inside a file named for one `/esq:work` scenario.

## D-journeys-stay-bespoke-on-2-1-251 — The journeys stay bespoke, re-checked on 2.1.251

**Scope:** infra
**Topic:** audit
**Date:** 2026-08-29
**Statut:** Active

**Contexte:** [[D-runtime-evidence-from-a-bespoke-runner]] made the bespoke runner conditional on `claude plugin eval` being gated, and dated that reading to Claude Code 2.1.238. B-032 is the item whose call the port back was deferred to, so the condition had to be re-read before planning, not assumed.
**Décision:** Stay bespoke. Measured on this machine on 2026-08-29, Claude Code 2.1.251: `claude plugin eval --help` renders a full surface — cases, graders, `scaffold_script`, `--max-cost-usd`, `--threshold`, `--json` — and both `claude plugin eval init` and the run path print `` `plugin eval` is currently in early access `` and exit 0.
**Raison:** A vehicle that refuses to run is not a vehicle, and the exit-0 refusal is worse than an error because a suite wired to its status would read green. The native runner also has no replay: a case bills every time it is judged, so porting would cost the free half of B-032's requirement even after the gate lifts.
**Tradeoff:** Gained a suite that runs today and replays for nothing. Accepted maintaining a runner the vendor will eventually supersede, and a dated claim that goes stale on the next upgrade.
**Conséquences:** The port back is `harness-evidence-freshness` (B-074)'s, which exists to keep dated harness claims fresh; this entry is the first thing it reads. Whoever attempts it asserts on the absence of the `early access` line, never on the exit status.
**Alternatives rejetées:** Port now — blocked, both entry points refuse. Wait for the gate — the roadmap puts `runtime-evals` ahead of two entries that rewrite the very surfaces these journeys guard, and a net authored after the change is not a net.

## D-an-extraction-is-proved-by-an-unchanged-consumer — An extraction that must change nothing is proved by its consumer's test passing unedited

**Scope:** arch
**Topic:** evidence-capture
**Date:** 2026-08-30
**Statut:** Active

**Contexte:** Moving the impure half of `scripts/smoke-work-capture.mjs` into `scripts/lib/journey-runner.mjs` had no user-visible output of its own: the only thing that could go wrong was a silent behavior change in a script whose checked-in capture is a public artifact, and the obvious way to land it — rename the moved functions, then update `tests/smoke/work-capture.test.mjs` to import them from their new home — destroys the only evidence available.
**Décision:** The extracted harness is reached through the consumer script, which re-exports every name its test already imported (`parseLines`, `readStream`, `splitCapture`, `captureRecords`, `judgeCapture`, `judgeEvidence`, `renderTable`), so `tests/smoke/work-capture.test.mjs` and `tests/smoke/fixtures/capture.jsonl` both stayed byte-identical across the change, and their passing is the proof.
**Raison:** A test edited in the same commit as the code it covers proves that the pair agree, not that the behavior held; the fifteen assertions written against the pre-extraction script are the only outside referent available, and they are worth more than tidier import paths. The capture makes it exact rather than merely suggestive: it is a recording of four billed runs, so replaying it green through the new code is a comparison against evidence nothing in this change could have influenced.
**Tradeoff:** Gained a refactor whose correctness argument costs nothing and cannot be gamed. Accepted a consumer that re-exports a handful of names it does not itself define, which reads as indirection until you know why it is there — hence this entry.
**Conséquences:** Any later move of harness internals is held to the same bar: if a test has to change to keep passing, the change is not a pure extraction and must be argued on its own. A second consumer (`scripts/smoke-journeys.mjs`) imports `createRunner` directly and owes no such re-export — the rule is about proving a move, not about how a new script is written.
**Alternatives rejetées:** Rewrite the test's imports and rely on it still passing — the same commit changes both sides, so a behavior change hidden in the move survives it. Diff the two files by hand — reading is not evidence, and this is a script that spawns bypassed-permission children. Re-run the four billed branches to prove equivalence — a few dollars for an answer the free replay already gives, and a fresh model run is not a controlled comparison.

## D-a-journey-capture-holds-ledger-facts-not-the-file — A journey capture holds ledger facts, not the file they came from

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-30
**Statut:** Active

**Contexte:** B-032's journeys judge a plan's execution log, so the obvious harvest is the plan file itself — and the plan for the work said to declare `plan.text` in `journey-evidence`. That same phase's verification step said the checked-in capture must hold no `"text"` key at all.
**Décision:** `journey-evidence` declares `plan.path` and the derived facts — `logEntries`, `citedCommits`, `lane`, `validate`, `check` — and never the plan file's text; `harvest` reads the file and persists nothing of it.
**Raison:** No judge needed the text: every assertion the two U-02 judges make is over a heading list, a hash lookup or an exit code. And the plan file *after* a build run contains the execution-log entry the model wrote, so publishing it would put model prose into a public capture by a route the security notes never considered — the prose is barred from the stream side and would have walked in through the artifact side.
**Tradeoff:** Gained a capture that cannot leak an entry's prose and a judge that reads structure rather than re-parsing markdown; accepted that a later journey wanting a new fact about the plan must declare that fact in the schema instead of grepping a blob.
**Conséquences:** Phase 3's escalation judge cannot read the plan text — it must harvest the rendered `**Assurance escalation:**` line as a declared field, or read the axes back out of `lane.stdout`. The same rule applies to `smoke-evidence.anchors[].text`, which predates it and is not migrated here.
**Alternatives rejetées:** Persist the text and relax the verification grep — rejected because the grep is the phase's own arbiter and the looser rule is the one that ships a leak. Persist a redacted text — rejected as a second sanitizer to maintain beside the schema, which is the thing `capture-schema.mjs` exists to prevent.

## D-a-journey-seeds-mid-orchestration — A journey seeds mid-orchestration, through the shared harness

**Scope:** arch
**Topic:** evidence-capture
**Date:** 2026-08-30
**Statut:** Active

**Contexte:** P-07's branches start from a clean repo, so `seedRoot()` made exactly one commit. Every orchestration scenario starts from a *state* instead — a task committed and unlogged, an entry left `⏸` — and with one seed commit the plan anchor and the already-landed task land together, so `build` correctly saw a clean slate and the journey tested nothing.
**Décision:** The shared harness gains `seedOverlay(row)`, which copies one journey's overlay over the same toy project, and `postSeed`, which makes the commits the run must find; `seedHash` is re-read after it.
**Raison:** Re-reading `seedHash` after the pre-dated commits is what makes the evidence sound: the harvest range then holds only what the run itself did, so history the harness planted can never be counted as work the run performed. Putting both hooks on the harness rather than in the journeys script keeps one seeding path for both consumers, and `smoke-work-capture.mjs` passes neither, so its capture replays four green unmoved.
**Tradeoff:** Gained journeys that begin in the middle of an orchestration and a harness that stays the single seeding path; accepted two more configuration hooks on `createRunner`, and a fixture set where the interesting state lives in code (`preDate`) rather than entirely in files.
**Conséquences:** Every later journey seeds this way. An overlay may only add files under `docs/` and may never restate a seed file — `tests/journeys/journeys.test.mjs` refuses one that does, which is the plan's seed-drift risk mechanized rather than remembered.
**Alternatives rejetées:** A committed fixture repository per journey (a `.git` directory checked in) — rejected as six forks of the toy project, which is the drift the overlay rule exists to stop. A second seeding path inside `smoke-journeys.mjs` — rejected on the same argument that produced the harness: the shared paragraph lives in one place.

## D-park-a-journey-never-loosen-its-judge — Park a journey behind its blocker; never loosen the judge to green it

**Scope:** arch
**Topic:** runtime-evals
**Date:** 2026-08-30
**Statut:** Active

**Contexte:** Journey 3 of the orchestration suite (U-06, a durable one-way escalation) reddened on two billed headless runs against two different seeds: `/esq:build` completed a phase that persists the caller's API token and recorded no escalation, so `esq lane` on the harvested plan still resolved `risk=low`. The judge was right and the product was not (B-093), and the phase that bought the evidence had already committed the journey into the active registry.
**Décision:** A journey whose contract the product does not currently honor moves out of the active registry into a `PARKED` list naming its blocker, keeping its seed overlay, its judge and its billed red captures checked in; `--only <parked>` refuses and names the blocker, and `docs/CONFORMANCE.md` carries no runtime-evidence line for it until it goes green.
**Raison:** The two alternatives both destroy the artifact's value. Loosening `judgeEscalation` until the red capture passes converts the suite from a net into a mirror — it would then assert exactly the behavior the bug produces. Deleting the journey throws away two billed runs that are the only evidence B-093 has, and loses the seed and judge that Phase 6 must re-run against. Parking keeps main green, keeps the evidence, and makes the debt visible in a place that refuses to spend money on it.
**Tradeoff:** Gained a green main, an honest external referent and a preserved $1.58 of evidence; accepted a second registry to keep in sync and a scenario (U-06) that stays without runtime evidence until B-093 is fixed.
**Conséquences:** A red live run is never answered by editing the judge. Parked rows are held to the same overlay no-fork rule as active ones, so nobody deletes an "unused" seed. Phase 6 of `runtime-evals-golden-journeys` is gated on B-093 reaching `Done` and confirms it from the ledger before spending a run.
**Alternatives rejetées:** Loosen the judge to accept a completed phase with no escalation — rejected: it would pin the bug as the contract. Delete the escalation journey and its fixtures — rejected: it discards B-093's only evidence and Phase 6's starting point. Leave the journey active and main red until B-093 is fixed — rejected: an audit that is red for a known reason stops being read, and every unrelated commit then ships without a gate.

## D-the-registry-and-its-fixtures-are-a-bijection — The active journey registry and its checked-in fixtures cannot disagree

**Scope:** arch
**Topic:** runtime-evals
**Date:** 2026-08-30
**Statut:** Active

**Contexte:** The failed Phase 3 committed a four-branch `ROWS` against a two-branch `capture.jsonl` and a two-file `mutated/`. `judgeCapture` reported a row it did not recognize but said nothing about a row it never saw, so `node scripts/smoke-journeys.mjs --parse` printed a two-line green table and exited 0 while `./scripts/audit.sh` was red on nine tests in the same suite. The free path agreed the suite was fine.
**Décision:** Missing-row completeness becomes a named capture problem in `judgeCapture` — the mirror of the unknown-row problem already there — with `--parse --only <branch>` the one deliberate narrowing for a single-journey archive; and `tests/journeys/journeys.test.mjs` asserts the bijection directly: one `journey-row`, one `journey-evidence` and one `mutated/<branch>.jsonl` per active branch, no capture record outside the registry, and a `billed/<branch>.jsonl` for every parked one.
**Raison:** The invariant has to hold on both surfaces because they answer different questions. The test is what fails the commit; the runner check is what stops a contributor reading a short green table as a passing suite. Putting it only in the test would leave `--parse` — the command `## Done looks like` actually names — lying. Putting it only in the runner would leave the mutation half unguarded, since a missing mutated file is not a capture record at all.
**Tradeoff:** Gained a registry that cannot outrun its evidence and a `--parse` that cannot under-report; accepted one flag combination (`--parse --only`) and a completeness rule the shared harness now applies to `smoke-work-capture.mjs` too.
**Conséquences:** Adding a journey is now a single atomic change — row, capture record, mutation — or the build reds. Phase 6 uses that red deliberately: it re-adds `escalation` to `ROWS` and watches the bijection test fail for the right reason before spending the run that fixes it.
**Alternatives rejetées:** A prose rule in `CLAUDE.md` or the plan — rejected by this repo's own standing rule that a correction made twice becomes a check that fails the build. A check in `scripts/audit.sh` rather than in the suite — rejected: the suite already owns these fixtures and check 39 already runs it, so a new check would be a second registry of the same fact.

## D-a-billed-capture-is-evidence-only-with-its-seed — A billed capture is evidence only while its seed still reproduces it

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-30
**Statut:** Active

**Contexte:** The `escalation` journey reddened twice, and the plan that parked it said both red captures stay checked in. On disk there was one file: the second billed run had overwritten the first when the journey was re-captured against a corrected seed overlay (`b528629`), so the first red survived only in git at `3cdea76` — and the overlay that produced it no longer exists.
**Décision:** `billed/<branch>.jsonl` holds the captures still reproducible from the seed overlay checked in beside them. A run superseded by a re-seed is named in the log entry and left in git history; it is not restored into the archive as if it were comparable evidence.
**Raison:** [[D-park-a-journey-never-loosen-its-judge]] keeps a red capture because Phase 6 re-judges it against the current judge, and a backlog row cites it as what the product actually did. Both uses assume the run can be re-run from the seed beside it. A capture whose seed is gone answers neither: re-judging it says nothing about today's contract, and it would put a duplicate `journey-row` in an archive the harness would then name as malformed.
**Tradeoff:** Gained an archive where every file is a run someone can reproduce and re-judge; accepted that the count in a backlog row can exceed the number of files, so the row must say where a superseded run lives.
**Conséquences:** A journey re-seeded mid-campaign loses its earlier captures as *archive*, not as *record* — the commit that replaced them is the citation. B-093's row names two red runs and one file, and the phase log says why.
**Alternatives rejetées:** Restore the superseded capture into the same file — rejected: two `journey-row` records for one branch is exactly the duplicate the harness names as a capture problem, and Phase 6 would re-judge a run whose seed it cannot rebuild. Keep it as a second file under a distinct name — rejected: it makes the parked-branch bijection (`one billed/<branch>.jsonl`) a special case for the sake of a run nothing can reproduce.

## D-the-escalation-answer-is-required — The escalation answer is required, and its refusal carries the trigger list

**Scope:** arch
**Topic:** assurance-lane
**Date:** 2026-08-30
**Statut:** Active

**Contexte:** `/esq:build`'s escalation section, its CLI field, its renderer and `esq lane`'s fold-in were all correct and all unused: two billed headless runs over a `direct` plan whose phase persisted a credential recorded no escalation, and the word never appeared in one of the two streams (B-093). The rule was written clearly and skipped anyway.
**Décision:** `esq plan append-log`'s `escalation` key becomes required on both statuses, accepting either `{axis, to?, reason}` or the literal `"none"`, and the refusal thrown when it is missing prints the risk and uncertainty trigger lists rather than the generic accepted-keys line.
**Raison:** The failure was not a misjudged trigger but an unasked question — the section sits 100 lines above the payload the model copies, and both canonical examples omitted the key, so the shape reproduced was one with the question absent. A required field puts the question inside the call that writes the entry, and the refusal is the only place in the system where the trigger list is read at the moment of decision. The CLI still owns no judgment: it never decides whether a trigger fired, only refuses an entry that never said (`D-cli-owns-structure-model-owns-judgment`).
**Tradeoff:** Gained: an execution-log entry cannot exist without the escalation question having been answered, and the answer is durable in the ledger rather than in a session. Accepted: a breaking change to the payload contract every worker skill writes through, and one refused call plus a retry whenever a caller forgets — which is why the canonical examples carry `"escalation":"none"` so the common path pays nothing.
**Conséquences:** Any new writer of an execution-log entry must answer the escalation question, and any example that drifts out of the schema is caught by the example-extraction test rather than by a billed run. Whether this makes a model actually escalate is observable only by the `escalation` journey, which is why the fix is not done until that run is green.
**Alternatives rejetées:** Strengthening the prose alone — the fix `CLAUDE.md` says is not one, since the rule already read correctly and was skipped, and nothing would distinguish "fixed" from "got lucky". Detecting the trigger from the phase's diff inside the CLI — that is judgment, which the CLI never owns, a trust boundary is not a grep, and an escalation is one-way, so a false positive buys two subagents forever.

## D-close-a-row-on-what-shipped — A row closes on what shipped; the remainder becomes its own row

**Scope:** prod
**Topic:** runtime-evals
**Date:** 2026-08-31
**Statut:** Active

**Contexte:** `runtime-evals-golden-journeys` executed three of six planned phases and delivered a
complete, useful v1 — a shared journey runner, three green journeys, one parked, a registry↔fixture
bijection. Phases 4–6 were expanded coverage on that substrate, and one of them (U-06) was blocked on
a product bug with its own plan. B-032's description still promised all of it.

**Décision:** Rewrite the plan's `## Goal` and `## Done looks like` and B-032's summary to the v1 that
exists, delete the unexecuted phases from the plan rather than leaving them as intent, and move the
removed behaviors to a new row (**B-095**) that cites the commit preserving their design (`cd3485f`).

**Raison:** An unexecuted phase in a shipped plan is indistinguishable from a phase that is about to
run, and a backlog summary describing work nobody scheduled makes the ledger unreadable as a queue.
Deleting the phases is only safe because git holds the design and a row cites the commit — the
alternative failure, losing paid-for design, is prevented by the citation rather than by leaving dead
phases in the file. The execution log stays byte-truthful: phases that ran are logged, phases that did
not are gone rather than pretended.

**Tradeoff:** Gained a plan and a row that both state exactly what exists, so `/esq:check` can audit
the plan against reality instead of against ambition. Accepted that the removed design is one
indirection away — a reader must follow the cited commit — and that B-095 is a row whose first task is
reading history.

**Conséquences:** A plan whose remaining phases turn out to be a different item is cut and re-filed
rather than carried; the new row must name the preserving commit, and the plan's `## Context` must
record the cut with its date and authority. Downstream rows that were waiting on the original scope
(B-085, B-087) inherit no net they were not explicitly given, so each now carries the journeys its own
change needs as a prerequisite.

**Alternatives rejetées:** *Keep Phases 4–6 in the plan and mark B-032 Done anyway* — the plan would
claim work it never bought and `/esq:check` would red against its own contract forever. *Keep the
phases and keep B-032 open* — the item stays open on work that is not its own, and blocks nothing
usefully while the substrate it delivered goes uncited. *Drop the removed phases entirely* — throws
away paid-for design (seed overlays, judges, mutation shapes, per-journey bills) that a later coverage
push would re-derive at full cost.

## D-a-billed-run-never-overwrites-paid-evidence — a billed run never overwrites paid evidence

**Scope:** arch
**Topic:** evidence-capture
**Date:** 2026-08-31
**Statut:** Active

**Contexte:** The shared live runner defaulted its capture destination to the aggregate checked-in file regardless of how narrow the run was, and wrote it from a `finally` block, so the documented single-journey re-mint destroyed the journeys it did not re-run and a throw before the first row left an empty file (B-098). It had already cost one $0.88 billed capture at `b528629`.

**Décision:** A billed run has no implicit destination. `--only` requires an explicit `--out`; a destination that is the aggregate, already exists, or sits in a missing or unwritable directory is refused before any spawn; the aggregate is replaced — through a same-directory temp file and one `rename` — only by a run that covered the whole registry, completed every row, timed none out, serialized clean and re-judges green; and every other outcome preserves its sanitized records in an exclusively-created `--out` or a `mkdtemp` path named in the diagnostic, writing nothing at all when there are no records.

**Raison:** The danger was never `--only` — it was an implicit destination written from a `finally`, and stating the rule on the *write* fixes both consumers of the harness at once rather than one command's flag handling. Every refusal is free and lands before the first token, so the guarantee costs nothing on the path where money is actually at stake. And the aggregate stays a single artifact that means one thing: what this Claude Code version did, across the whole registry, green.

**Tradeoff:** Gained a write path where no failure mode — bad flag, missing directory, throw, timeout, red judge, schema violation, lost race — can leave a checked-in capture anything but byte-identical or completely refreshed; accepted one extra flag on the documented re-mint command and a manual copy step when a contributor wants to bank a red capture.

**Conséquences:** `scripts/smoke-work-capture.mjs` inherits the contract unchanged, since both consumers share `scripts/lib/journey-runner.mjs`; `writeCapture`'s `mode` becomes a **required** argument with no default — a call that names none refuses and writes nothing — so `journey-runner.mjs` may name only `exclusive` or `atomic` and `scripts/probe-model-pins.mjs` keeps its legacy behavior by opting into `overwrite` explicitly at one site, citing B-099; the pre-spawn path checks are refusals of a likely mistake, never the guarantee, which is the exclusive open; and the documented commands in `docs/CONFORMANCE.md` and `README.md` must name an output path, guarded by the refusal itself rather than by a new audit check. Closing B-098 and B-032 stays a user act: `/esq:backlog` carries `disable-model-invocation: true`, so the build proves the Done criteria and hands back the commands.

**Alternatives rejetées:** A permissive default on the shared writer — `mode = 'overwrite'` would have kept every existing call site untouched, at the cost of making the destructive branch the one a future call site gets by forgetting an argument, which is the same shape as the implicit destination this decision exists to remove. Merging a narrowed run's rows into the existing capture in registry order — it puts a write to the aggregate back on the narrowed path, must parse a file the failure it guards against may itself have produced, and launders rows measured on different harness versions into one artifact that says nothing about the mix. Defaulting a narrowed run to a per-branch file — the destination stays implicit, so the second run on the same branch silently destroys the first, which is precisely what `b528629` did.

---

## D-the-one-write-path-never-throws — the one write path never throws

**Scope:** infra
**Topic:** evidence-capture
**Date:** 2026-08-31
**Statut:** Active

**Contexte:** Both billed consumers call `writeCapture` from a `finally` block, at the end of a run that has already spent money. Making `mode` required (D-a-billed-run-never-overwrites-paid-evidence) added three new ways for that call to fail — no mode, an unknown mode, a lost `wx` race — on top of the serialization failure a `BigInt` or a cycle in a record could always have produced.

**Décision:** `writeCapture` returns `{ status, written, error, mode, file, collision }` on every path and throws on none: it refuses an absent or unknown mode before touching the filesystem, serializes inside the same guard that wraps the write, and reports a lost exclusive race as `collision` rather than as an exception.

**Raison:** A throw out of a `finally` replaces the run's own exit code and table with the writer's stack, so the operator learns that the file did not land and loses what the billed run actually found. A status the caller can read lets the run report both. It also keeps the failure diagnostics on one path, where the rule that they name paths, codes and record counts — never a field value — is stated once.

**Tradeoff:** Gained a writer that cannot lose a billed run's own outcome and that a `finally` can call safely; accepted that a caller ignoring the return value now silently keeps nothing, which is why `status` is folded into both consumers' exit codes.

**Conséquences:** Phase 3's `commitCapture` branches on the returned `collision` for its `mkdtemp` fallback rather than re-stat-ing the target — the race is reported, not re-read. `planCapture` is the throw-free half in the same spirit: it answers the sanitization verdict with no filesystem in it, so a caller can decide *where* a capture goes from what it holds.

**Alternatives rejetées:** Let the writer throw and have each consumer wrap its own call — three sites to keep in step, on the path that runs least often and costs most when it is wrong. Catch only the write and let serialization throw — the one failure mode that is a property of the records themselves, and the one most likely to appear when a schema gains a field.

## D-the-aggregate-is-earned-by-a-replay — the aggregate is earned by a replay, not by a running total

**Scope:** arch
**Topic:** evidence-capture
**Date:** 2026-08-31
**Statut:** Active

**Contexte:** `commitCapture` has to decide, at the end of a billed run, whether that run may replace the checked-in aggregate capture. The loop has already judged every row and knows its own failure count, so `failed === 0` was the cheap answer sitting right there.

**Décision:** Eligibility is decided against the assembled capture: `planCapture` over the records about to be written, then `judgeCapture` over the whole array, requiring no problems and no red row — in addition to the two facts the records cannot carry, whether every selected row completed and whether any timed out.

**Raison:** The aggregate's only value is that a contributor can replay it and see what this harness version did. A running total says what this process believed while it ran; a replay says what the *file* will say to the next reader. They come apart exactly where it matters — a duplicate row, an evidence record that failed its schema, a capture that ends up shorter than the registry — and every one of those is a green loop over a file that does not replay. The check is free: both functions are pure and the capture is already in memory.

**Tradeoff:** Gained an aggregate whose replacement is guaranteed to replay green, so the checked-in capture and the free suite can never disagree; accepted that eligibility is now judged twice per run, and that a bug in `judgeCapture` refuses a good capture rather than accepting a bad one — the safe direction, since the records are still kept in the fallback path.

**Conséquences:** `completed` and `timedOut` are tracked in the loop and passed in, because they are the only two facts about a run that its own records cannot show: a timed-out row still produces both records, and a two-record capture is indistinguishable from a one-row registry. Any future eligibility clause belongs in `unearned` and should be expressed over the capture wherever it can be.

**Alternatives rejetées:** Trust the loop's `failed` counter — cheap, and blind to every way an assembled capture can fail to replay. Re-read and re-parse the file after writing it — proves the same thing but only after the aggregate has already been replaced, which is the one moment there is nothing left to protect.

## D-a-doc-contract-check-greps-the-docs — a documented-command check greps the docs, never the implementation

**Scope:** arch
**Topic:** audit

**Date:** 2026-08-31

**Statut:** Active

**Contexte:** Phase 4 of `runtime-evals-golden-journeys-fixes` had to prove that no documented `--only` invocation still teaches a mint without `--out`. Its `(auto)` step grepped `README.md docs/CONFORMANCE.md docs/ARCHITECTURE.md scripts/` for `--only` and subtracted the lines carrying `--out` or a refusal word, expecting nothing left.

**Décision:** A check of this shape names the documentation referent — the prose files and the scripts' `USAGE` text a contributor actually reads — and never a source directory; the survivors that make it un-passable are the flag's own parsing site and the comments explaining it.

**Raison:** `scripts/lib/journey-runner.mjs` must contain `--only` to implement `--only`: `const only = flagValue(argv, '--only')` matches the pattern by construction, as do the three comments describing where the destination is resolved. A step whose clean state is unreachable teaches the next reader to eyeball its output and wave it through, which is the failure mode a mechanical check exists to remove.

**Tradeoff:** Gained a step that can actually be green, and whose red means a real documented command lost its output path; accepted that a fresh invocation written into a *comment* inside `scripts/lib/` would not be caught — a place no contributor pastes from.

**Conséquences:** The step as written in the plan was executed and reported with its four survivors named rather than narrowed or skipped (`/esq:build` may narrow only a whole-repo suite). If this check is ever mechanized into `audit.sh`, it greps the referent, not the tree — and the refusal at exit 2, which costs a contributor $0, remains the primary guard.

**Alternatives rejetées:** Extend the `grep -v` filter until the implementation lines fall out — a filter tuned to today's comment wording, which reds on the next honest edit. Reword the comments until they no longer match — changing source prose to satisfy a grep, which inverts the referent relationship the check exists to assert.

## D-a-plan-owns-its-branch-trunk-owns-nothing — a plan owns its branch, and trunk owns nothing

**Scope:** arch
**Topic:** git-hygiene
**Date:** 2026-08-31
**Statut:** Active

**Contexte:** The branch name is the only thing tying a commit range to the item it was bought for, and nothing recorded it: the plan template had no branch field and `/esq:build` never read the branch it stood on. Observed live, the branch `B-003-auth-email-failure-visible` silently ended up owning three unrelated plans (B-102), and both B-101 and B-100 would otherwise land a commit range nothing can attribute.
**Décision:** `/esq:plan` records `**Branch:**` at the head of every plan file, and `/esq:build` refuses — before it reads plan content and before it edits anything — on a detached HEAD, on a branch other than the one its plan recorded, or on a branch a *different* plan already owns; the whole predicate is one deterministic `esq branch check <plan>` verdict, never skill prose.
**Raison:** The determination is a branch-name comparison, a set membership test and `git merge-base --is-ancestor` — mechanical throughout, which is the CLI's half of `D-cli-owns-structure-model-owns-judgment`. Putting it in the CLI is what makes it provable against real throwaway repositories offline, for about a second of audit runtime, instead of arguable in prose at the price of a model run. Two sub-rules were the user's: the default branch is never owned, so a plan recording it declares trunk mode and no reuse refusal fires on that name; and any different plan owning a branch refuses whether or not that work is merged, exempting only plans that share a slug stem, since `x.md` and `x-fixes.md` are one shipping unit.
**Tradeoff:** Gained: branch reuse is refused at the moment it starts rather than after the merge welds two items' history together, and the refusal costs one subprocess and zero file reads. Accepted: a false positive stops the only path that ships code, which is why the refusal is a lettered option set with a runnable `do:` and why a plan with no `**Branch:**` field never refuses at all.
**Conséquences:** Every plan written from now on carries the field; the 31 written before it are grandfathered as the `unrecorded` verdict and keep building unchanged. `esq validate` deliberately does not require the field. B-100 and B-101 read `defaultBranch`, `dirty` and each owner's merged-ness off this same verdict rather than re-deriving them, and a trunk-mode plan is what makes B-100's "already on the destination, nothing to merge" a truthful no-op rather than a silent skip. Ownership is computed from `docs/plans/` in the current working tree, so one worktree cannot see another's plans — git's refusal to check a branch out twice is what covers that case.
**Alternatives rejetées:** Deciding it in `/esq:build`'s prose — five-way predicate plus an ancestry test in the model, unverifiable except by buying a run, and a second copy of the default-branch recipe `worktree` already carries. A `PreToolUse` hook blocking the first edit — hooks here are bounded and store numbers, never content, and it would fire on `/esq:fix`, `/esq:work` and the user's own editing. Refusing the default branch outright — it would stop esquisse's own workflow, where all 31 plans were built on `main`, and contradicts the no-op B-100 owes for execution on the destination branch. Refusing only an already-merged owner — the observed damage forms while the branch is still live.

## D-ship-policy-lives-in-a-committed-esquisse-json — the ship policy is declared in one tracked file at the repository root

**Scope:** prod
**Topic:** safe-shipping
**Date:** 2026-08-31
**Statut:** Superseded by [D-ship-policy-is-a-two-value-vocabulary] on 2026-09-01 — only the vocabulary line moved: the value is now one of `manual` or `merge-only`. Kept rather than deleted, because everything else it settles is unchanged and still binding: the file's name and location, that it is tracked and reviewed rather than gitignored, the single key, the absence of a version field, and the ignore-unknown-keys rule every future esquisse config key inherits.

**Contexte:** `D-ship-policy-defaults-to-manual` settled what a ship policy means and what absence resolves to, but esquisse had no configuration file at all — which is why B-101 exists. The place the declaration lives had to be settled before the reader could be written, and it fixes the shape every future esquisse config key inherits.
**Décision:** `.esquisse.json` at the repository root, tracked in git. One key, `shipPolicy`, whose value is one of `manual`, `merge-only`, `merge-and-push`. No version field; unknown other top-level keys are ignored rather than rejected. No gitignored per-developer sibling. `esq ship policy` is the only way to read what esquisse makes of it, and this repo carries its own declaration — `merge-only` — as the dogfood.
**Raison:** Tracked rather than local is what makes `D-ship-policy-authority-from-the-destination-ref` possible at all: authority is read from the blob on the destination branch, which requires the file to be in git. A team's shipping stance is also a team decision, reviewed like the code it would ship, not a per-developer preference. Outside practice was checked on the same shape during the brief — Claude Code's own committed `.claude/settings.json` beside its gitignored `.local.json` sibling (code.claude.com/docs/en/settings, checked 2026-08-31) — and the split exists there precisely to separate shared policy from personal override; esquisse takes only the shared half, because a personal override of a security boundary is the elevation path the authority decision closes.
**Tradeoff:** Gained: one file, one key, reviewable, and readable out of a ref. Accepted: a developer cannot locally opt into a policy the project has not declared — they can only tighten, through the working-tree floor.
**Conséquences:** `README.md` and `docs/SPEC.md` document the file; every future esquisse configuration key lands in this same file under the same trusted-ref rule, ignoring unknown keys means the second key needs no migration, and B-100 reads its authorization from `esq ship policy` rather than from any file of its own.
**Alternatives rejetées:** A gitignored `.esquisse.local.json` for per-developer overrides — it would be an unreviewed file granting authority, which is exactly what the authority decision forbids; the working-tree floor already covers the legitimate half (tightening). A `version` field — nothing to migrate yet, and ignoring unknown keys buys the same forward compatibility without a field every writer must set. Folding the key into an existing file such as `package.json` — esquisse is language-agnostic and must work in repositories that have no such file.

## D-ship-policy-defaults-to-manual — the ship policy defaults to manual, and a green loop is not authorization

**Scope:** prod
**Topic:** safe-shipping
**Date:** 2026-08-31
**Statut:** Superseded by [D-esquisse-never-pushes] on 2026-09-01 — one clause of it fell, and it is the clause this entry spent the most words on: there is no declarable `merge-and-push`, so nothing announces a remote before acting, because nothing acts on a remote. Kept rather than deleted, because the rest is not merely still true but is what the removal rests on — the default is `manual`, absence and malformation never authorize, `/esq:build` never merges, only a clean `/esq:converge` may land, and there is exactly one merge implementation. Its own reasoning predicted this: an announce is a chance to refuse, and the user chose to remove the thing being announced instead.

**Contexte:** B-100 wants a clean loop to land its own branch and B-101 wants a project to declare how far that may go. Settled here, during B-102's planning and ahead of both, because a default decided after the merge is already automated means shipping the unsafe default first and revoking it later. The hazard is concrete and asymmetric: in Tamialog a push to `main` auto-deploys the API, so an autonomous push is a production deploy nobody asked for.
**Décision:** The ship policy defaults to `manual`. Absence or malformed configuration never authorizes a merge or a push. `/esq:build` never merges — it has not completed the assurance lane — and only a clean `/esq:converge`, after the whole plan and its lane are complete, may initiate shipping. `merge-and-push` must be explicitly declared and must announce the exact remote, source branch and destination branch before acting. The mechanism is `/esq:worktree merge` or one primitive extracted from it; never a second merge implementation.
**Raison:** A validation loop that ends green is evidence about the code, not permission to deploy it — treating the two as the same thing is how an autonomous finish becomes an unannounced production change. Defaulting to `manual` rather than `merge-only` means a malformed or half-written declaration degrades to the safest behavior instead of the merely-safer one, which is the only way absence can never be read as consent. Naming the remote and both branches before acting is what makes an announced deploy refusable in the one second before it happens.
**Tradeoff:** Gained: no configuration state, no parse failure and no unfinished lane can produce a merge or a push. Accepted: projects that would be safe to land automatically must declare it once before they get the autonomous finish.
**Conséquences:** Binds B-101 (where the declaration lives, and its default) and B-100 (which command may land, and what it must announce). It also fixes what B-100 must do about work already merged, or executed directly on the destination branch: a truthful no-op that says so, never a silent success. The single-merge-implementation rule means B-100 extends or extracts from `/esq:worktree merge`, whose ledger-union semantics and duplicate-ID refusal stay authoritative.
**Alternatives rejetées:** Defaulting to `merge-only` — safer than pushing, but it still makes absence of configuration into authorization to write the default branch. Letting `/esq:build` land its own phase — it stops mid-plan with the assurance lane unbought, so it has no evidence a landing could rest on. A second, simpler merge path for the automated case — two merge implementations means two sets of conflict, duplicate-ID and dirty-tree semantics, and the automated one would be the untested one.

## D-ship-policy-reader-stands-beside-branch-check — the ship-policy reader stands beside branch check, not inside it

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-08-31
**Statut:** Superseded by [D-a-shipping-unit-lands-where-it-started] on 2026-09-04 — the ship-policy layer it settles no longer exists: authority for a landing is the plan header, read in-process by `esq merge land --plan`. Kept rather than deleted, because an ID is a permanent citation key.

**Contexte:** B-101 needs the CLI to resolve a declared ship policy and report the remote and destination a push would target. `D-a-plan-owns-its-branch-trunk-owns-nothing` asks that those facts be read "off this same verdict rather than re-derived", which reads at first as a call to refactor `branchCheck`.
**Décision:** `shipPolicy(root)` is a new standalone export in `plugin/lib/cli.mjs`, reached by `esq ship policy`; it reuses the existing module-level `defaultBranchOf()` and touches `branchCheck` not at all.
**Raison:** `defaultBranchOf()` already *is* the shared resolution the earlier decision asks for — the only fact the two verdicts have in common — so extracting a `gitFacts()` helper would rewrite a function pinned by a 211-line suite and audit check 42 to serve one caller wanting one of its four fields. Folding the policy into `esq branch check` is worse still: that command takes a plan path and exits 1 when it refuses, while the policy report takes no argument and always exits 0, so every `/esq:build` preflight would pay a config read for a value it never uses.
**Tradeoff:** Gained: the smallest diff that satisfies B-101, with the branch-ownership verdict untouched and its tests unperturbed. Accepted: two verdict objects each carry their own `defaultBranch`-derived field, and a future third caller may make the extraction worth doing then.
**Conséquences:** B-100 reads one object from `esq ship policy` for both its authorization and its announce, and calls `esq branch check` separately for ownership — two cheap reads with distinct exit-code contracts rather than one overloaded verdict.
**Alternatives rejetées:** Extracting a shared `gitFacts(root)` from `branchCheck` — an abstraction with one and a half implementations, bought against tested code. Growing `esq branch check`'s verdict with ship-policy fields — it fuses a report with a guard whose exit code the report must not set.

## D-ship-policy-authority-from-the-destination-ref — authority comes from the destination branch, and a checked-out copy can only lower it

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-08-31
**Statut:** Superseded by [D-a-shipping-unit-lands-where-it-started] on 2026-09-04 — the ship-policy layer it settles no longer exists: authority for a landing is the plan header, read in-process by `esq merge land --plan`. Kept rather than deleted, because an ID is a permanent citation key.

**Contexte:** `.esquisse.json` is a tracked file, so any checked-out branch — including a PR from outside — can contain a declaration saying `merge-and-push`. B-101's brief accepted that hazard and relied on the announce `D-ship-policy-defaults-to-manual` mandates as the mitigation. The user reversed that during this plan's review: an announce is a chance to refuse, not a source of authority, and a branch that can grant itself shipping rights has already won before anyone reads the announcement.
**Décision:** The policy is read from the committed destination branch — `refs/heads/<destination>:.esquisse.json`, via `git cat-file`, with the destination resolved by `defaultBranchOf` — and never from disk. The working-tree copy is consulted only as a floor: the effective policy is `min(trusted, local)` over `manual < merge-only < merge-and-push`, so a local, staged or feature-branch edit can reduce authority and never raise it, and a local copy that is malformed counts as `manual` in that minimum. Unknown destination, missing ref, missing path or any parse fault resolves to `manual`. The verdict reports the trusted ref and commit. A remote is usable only if it appears in `git remote`'s output: the destination branch's configured upstream remote if listed, else `origin` if listed, else the sole remote, else `null` — arbitrary config text and `.` are never push authority, and no network probe is made.
**Raison:** A declaration that authorizes autonomous writes to the default branch must itself have passed through the review that landing on that branch requires; reading it from the working tree makes the proposal its own approval. Taking the minimum rather than ignoring the local copy keeps the useful half of a local declaration — tightening — without reintroducing the elevation path, and makes trunk mode fall out of the same rule with the destination branch's committed HEAD as the trusted source. Validating a remote against `git remote` rather than trusting `branch.<x>.remote` verbatim closes the same class of hole one level down, where a repo-local config value would otherwise name where a push goes.
**Tradeoff:** Gained: no unreviewed change to any file can increase what an autonomous finish may do, and the verdict can name the exact commit its authority came from. Accepted: a project turning the policy on must land the change before it takes effect, and a fresh branch cannot test an elevated policy without merging it first.
**Conséquences:** B-100 announces `trusted.ref` and `trusted.commit` alongside the remote and both branch names, so the authority behind a landing is quotable rather than assumed. The reader needs no working-tree read to answer, and stays total (see `D-ship-policy-report-is-total`). Any future config key inherits the same trusted-ref rule by construction.
**Alternatives rejetées:** Reading the working-tree file and relying on the announce alone — the brief's original position, which makes a checked-out branch the author of its own authority. Ignoring the working-tree copy entirely — simpler, but it discards a declaration that only ever tightens, and it would make a deliberate local `manual` unenforceable. Requiring a signed commit or a second key — real defence in depth, and far past what B-101 has a caller for.

## D-malformed-ship-policy-reds-validate — a malformed shipping declaration is a validation failure, not just a report line

**Scope:** func
**Topic:** safe-shipping
**Date:** 2026-08-31
**Statut:** Superseded by [D-a-shipping-unit-lands-where-it-started] on 2026-09-04 — the ship-policy layer it settles no longer exists: authority for a landing is the plan header, read in-process by `esq merge land --plan`. Kept rather than deleted, because an ID is a permanent citation key.

**Contexte:** B-101's brief resolved that a malformed `.esquisse.json` would be surfaced by `esq ship policy` only and never by `esq validate`, so an optional config file's typo could not block a session stop. The user reversed it during this plan's review: this particular optional file governs whether an autonomous run may write to the default branch.
**Décision:** `esq validate` examines each declaration that exists — the working-tree file when present, and the destination ref's blob when both resolve — and exits 1 with one finding per malformed source, naming the source and the fault class (`invalid JSON`, `shipPolicy missing`, `shipPolicy is not a string`, `shipPolicy is not one of manual|merge-only|merge-and-push`) and never the declared value. No declaration is green; a valid declaration carrying unrelated extra top-level keys is green. `esq ship policy` is unchanged by this: it still reports the fault and still exits 0, resolving to `manual`.
**Raison:** Degrading safely and passing silently are different things — a typo that quietly costs a project its declared policy is exactly the failure a validator exists to surface, and the cost of surfacing it is one line a person fixes in seconds. Keeping the value out of the finding matters because on a hostile branch that string is attacker-supplied text being written into a developer's terminal and, through `/esq:build`, into a model's context.
**Tradeoff:** Gained: a security-sensitive configuration typo cannot produce a clean validation result. Accepted: a session stop can now be blocked by a malformed optional file, which is the outcome the brief originally traded away.
**Conséquences:** The two commands split cleanly by audience — the report never refuses and is safe for an orchestrator to route off, the validator refuses and is what a human's commit gate runs. The `esq validate` read is wrapped like the backlog and decisions reads beside it, so a fault in this path degrades to a finding and never throws inside a stop hook.
**Alternatives rejetées:** The brief's original position, malformed-is-report-only — it lets a typo silently revoke a declared policy. A warning that does not affect the exit code — `esq validate` has no warning channel, and inventing one for a single case buys a second severity vocabulary the audit would then have to hold.
**Amendement 2026-09-01:** the fault class quoted above now reads `shipPolicy is not one of manual|merge-only` — the string is generated from `SHIP_POLICIES`, which lost `merge-and-push` under [D-ship-policy-is-a-two-value-vocabulary]. The decision itself is unchanged: this entry is about *which* sources are examined and that the value never reaches the finding, not about the vocabulary's size.

## D-ship-policy-report-is-total — the ship-policy report is total and always exits 0

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-08-31
**Statut:** Superseded by [D-a-shipping-unit-lands-where-it-started] on 2026-09-04 — the ship-policy layer it settles no longer exists: authority for a landing is the plan header, read in-process by `esq merge land --plan`. Kept rather than deleted, because an ID is a permanent citation key.

**Contexte:** The first version of B-101's reader opened with a throwing `git rev-parse --show-toplevel`, contradicting its own promise of an always-exit-0 report: outside a repository it would have produced a stack trace rather than a verdict. B-100 will route off this object, and an orchestrator that has to distinguish a crash from an answer has no cheap way to do so.
**Décision:** `esq ship policy` is total. Every git call in the path goes through `gitTry` and every read is wrapped, so outside a repository, in a bare repository, with no resolvable default branch, with a missing destination ref, with no remotes, and with several remotes and no unambiguous candidate, the command prints a fully-shaped verdict with `policy: "manual"`, `null` for each unresolved fact, a `reason` naming what could not be resolved, and exits 0. All six cases are pinned by tests.
**Raison:** A report whose contract is "always exit 0" must have no path that exits otherwise, or every consumer needs a second, undocumented failure mode. Naming the missing fact in the verdict is also strictly more useful downstream than an exception: B-100 refuses to act on incomplete target facts, which it can only do if the incompleteness arrives as data.
**Tradeoff:** Gained: one shape for every caller, and a degenerate environment is answerable rather than fatal. Accepted: a genuinely broken git installation reads as `manual` with null facts rather than surfacing its own error, so the reason string is the only place that distinguishes them.
**Conséquences:** `esq ship policy` never participates in an exit-code protocol; refusals in this area belong to `esq validate` (`D-malformed-ship-policy-reds-validate`) and, later, to B-100's own gate. The six degenerate cases are part of the suite, so a future refactor that reintroduces a throw fails the audit rather than a user's run.
**Alternatives rejetées:** Throwing outside a repository, as most other subcommands do — consistent with them, but it breaks this command's stated contract and forces B-100 to parse stderr. Exiting nonzero on an unresolved destination — that is a refusal, and this command is a report; B-100 owns the refusal with the facts in hand.

## D-a-collision-is-reported-before-a-question — a collision is reported before a question

**Scope:** func
**Topic:** safe-shipping
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** `esq merge land` aborts on three things — a non-ledger conflict, an `absent-at-base` duplicate ID, and the first `ask` cell no rule settles — and the plan listed them in that order with the `ask` first. Two items minted on both sides under one `B-` number are present on both sides of the merge, so they are reported as one shared row whose every free-text cell differs; checking the `ask` first therefore caught the collision as an ordinary disagreement.

**Décision:** `land` runs `esq merge scan` before it inspects the `ask` cells, so an `absent-at-base` duplicate is always reported as a collision naming the ID, never as a question about a cell.

**Raison:** The two messages are not equally true. `Summary: two different non-blank values with no documented ordering` is accurate about the cell and silent about the fact that matters — `B-020` has become two items — and its obvious remedy, answering the question by picking a side, is exactly the forbidden answer: it publishes the collision under one ID. The ID fact is also the cheaper one to explain and the one the user can act on, on the branches, before any merge.

**Tradeoff:** Gained: the refusal a user meets names the thing that is actually wrong, and the fix it implies is the right one. Cost: `mergeScan` now runs on every landing that gets past `begin`, including ones that would have stopped one step earlier at an `ask`.

**Conséquences:** The ordering is a behavioral contract, not an implementation detail — the minted-twice fixture in `tests/cli/merge.test.mjs` asserts `asks` is empty on a collision, so a future reordering reds rather than silently degrading the message. Anything else that composes these verbs inherits the same rule: classify the IDs before reconciling the cells.

**Alternatives rejetées:** *Keep the plan's order and let the `ask` fire first* — cheapest, and it is what shipped for one test run; rejected because the message it produces is misleading in exactly the case the whole duplicate-ID machinery exists for. *Report both, and let the caller decide which to show* — an honest report, but `land` is the unattended path and there is no caller to choose; a refusal has one reason or it has none.

## D-one-merge-engine-in-the-cli — one merge engine, four verbs, and `land` as a composition

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-01
**Statut:** Active

**Contexte:** B-100 makes `/esq:converge` land the branch its plan records, and `D-ship-policy-defaults-to-manual` had already refused "a second merge implementation" in advance — the automated one would be the untested one. The brief resolved that both paths delegate to one extracted primitive and that the primitive is a CLI write rather than a subagent (`plugin/skills/worktree/SKILL.md` carries `disable-model-invocation: true`, so a converge subagent could not invoke `/esq:worktree merge` at all). What it deferred was the surface: how the attended path's *held* merge and the unattended single shot are expressed against one implementation without either becoming a special case of the other.
**Décision:** `plugin/lib/cli.mjs` gains `esq merge begin | scan | seal | abort` — the held `merge --no-ff --no-commit`, the mechanical scans (conflicted-file split, the merge-base discriminator, the four duplicate-ID predicates), the seal, the abort — plus `esq merge land`, which composes exactly those verbs with the derive rules. The `Status` and `Pri` ladders and the blank-loses rule become a pure `derive(ours, theirs, base)` in the CLI, returning a resolved cell with the rule that resolved it or `{ask: <reason>}`; the attended skill asks the user about exactly the `ask` cells and `land` aborts on them. `esq ship policy` stays the read-only authority report; `esq merge` is the group that writes to git and exits 1 when it refuses. `land` resolves the ship policy itself, in-process, immediately before the git write and refuses anything but `merge-only`; `begin` and `seal` are not policy-gated, because the policy governs autonomous landing and a user typing `/esq:worktree merge` is the authority.
**Raison:** Four verbs over one held merge are the states git itself exposes, so naming them is cheaper to read than hiding them behind a `--hold` flag — and it is what lets the unattended path be a composition rather than a parallel implementation, making it a strict subset of the attended one by construction instead of by discipline. Putting the ladders in the CLI follows `D-cli-owns-structure-model-owns-judgment`: a total order over a vocabulary `cli.mjs` already holds is structure, and free-text reconciliation, which is judgment, stays with the model. Re-reading the policy inside `land` closes the window between the authority read and the write, and makes the gate impossible to bypass by calling the CLI directly.
**Tradeoff:** Gained: one merge implementation, tested by `tests/cli`, with the ladders defined once and both paths reconciling identically. Accepted: five subcommands where the brief provisionally named one, and an attended procedure that is now a sequence of CLI calls with skill prose between them rather than one continuous narrative.
**Conséquences:** `plugin/lib/cli.mjs` performs its first git *write*, which is a new trust boundary recorded in `docs/ARCHITECTURE.md § Boundaries not to cross`; every branch name reaching git stays an argv element, never a shell string. Any future landing behavior — a second orchestrator, a different destination policy — composes these verbs or it is a second engine. `/esq:worktree merge`'s rewrite is a pure refactor pinned by a `docs/CONFORMANCE.md` scenario, because the attended path has no automated behavioral test.
**Alternatives rejetées:** A single `esq ship land` with a `--hold` flag — the attended path becomes exactly the special case the brief warned against, the scans reappear as output shape instead of as verbs, and a read-only report and a git write end up in one group with two exit-code contracts, the overload `D-ship-policy-reader-stands-beside-branch-check` already rejected. Leaving the mechanics in the skill and giving converge its own narrow safe-merge subcommand — the cheapest thing that appears to work, and precisely the second implementation this decision exists to prevent.

**Amendement 2026-09-04:** `land`'s in-process authority read is now the **plan header** — `**Branch:**` as the source, `**Origin:**` as the destination, both through `safeRef` — and not the ship policy, which was deleted with `.esquisse.json` and `esq ship policy` under [D-a-shipping-unit-lands-where-it-started]. The surface is `esq merge land --plan <plan-path>`. Everything else this decision settles is unchanged and still binding: one engine, four attended verbs plus `land` as their composition, the ladders in the CLI, every `ask` with the model, the attended verbs ungated, and the read happening in the same process as the write so no window opens between the authority and the git write.

## D-esquisse-never-pushes — no esq command pushes, ever

**Scope:** prod
**Topic:** safe-shipping
**Date:** 2026-09-01
**Statut:** Active

**Contexte:** `D-ship-policy-defaults-to-manual` settled that `merge-and-push` had to be explicitly declared and had to announce the exact remote, source and destination before acting — the announce being the mitigation for the one operation in esquisse that leaves the machine. B-100's brief put the question again, now that something was about to act on the verdict, and the user reversed the position: the hazard the announce mitigates is a production deploy nobody asked for, and an announcement is a chance to refuse, not a control.
**Décision:** No esq command pushes. `merge-and-push` leaves the ship-policy vocabulary entirely rather than being disabled, defaulted off, or kept behind a confirmation. There is no flag, no environment variable, no prompt and no second code path that revives it, and the promise is held by `scripts/check-nopush.sh`, which fails the build on any `git push` reaching `plugin/` and ships with its own fault injection. What esquisse writes to git is at most one merge commit on the destination branch of the local repository; the resolved `remote` stays in the ship-policy verdict solely so a command can *name* the push it is not making.
**Raison:** The blast radius is what decides it. A local merge commit is recoverable by the person who ran the command; a push can trigger a deploy, notify a team, or start a pipeline, and none of that is undoable from the terminal that caused it. The value was also never load-bearing for the feature: B-100 wants a clean branch landed, and landing is complete at the merge commit — pushing is a separate act with a separate audience. And a capability that exists behind a guard is a capability one plausible edit away from firing, which is the shape of failure this repo mechanizes against rather than argues about.
**Tradeoff:** Gained: the most dangerous operation in the design is absent rather than guarded, so no configuration state, parse fault, prompt-fatigue or future refactor can produce one. Accepted: a team that genuinely wants an autonomous push must run it themselves or use their own tooling, and esquisse will not grow the capability back.
**Conséquences:** `docs/SPEC.md`, `README.md` and `docs/ARCHITECTURE.md § Boundaries not to cross` describe two values and no push. `esq ship policy` still resolves and reports a `remote`, which is now reporting-only. The migration cost is real and stated: a repository that had declared `merge-and-push` starts failing `esq validate`, which the Stop hook blocks a session on, and the fix is one edit to `merge-only` or `manual` — a user meets this as a blocked session rather than as a changelog, so the fix is named in the finding's own vocabulary. esquisse itself declares `merge-only` and is unaffected.
**Alternatives rejetées:** Keeping `merge-and-push` in the vocabulary but never acting on it — a declared value that silently does nothing is worse than an unrecognized one, because the project believes it declared something. Reviving it behind a flag, an environment variable or a confirmation prompt — each is a capability one edit from firing, and a prompt is exactly the announce this decision rejects as a control. Deleting the `remote` resolution from the verdict too — it costs nothing, it is the only way a refusal can name the push it is not making, and removing it would have to be re-added the first time someone asks what would have happened.
**Amendement 2026-09-02:** the guard landed as `scripts/check-nopush.sh` with `scripts/test-nopush-guard.sh` (audit checks 43–44), and building it settled what "name the push it is not making" means in the one place it was ambiguous. `resolvablePush` had composed the porcelain command as a copy-paste string, which put the command inside the shipped plugin — so *naming* the push is now the remote, its tracking ref and the ahead count, and never a spelled command. That site was **fixed rather than exempted**: the check has no opt-out list, and refuses the literal in comments and prose too, because a guard that distinguishes a push esquisse runs from one it merely names has to make that call statically and gets it wrong after one refactor that passes the composed string somewhere else. Neither half of the decision moved — the remote is still resolved and still reported.

## D-ship-policy-is-a-two-value-vocabulary — the vocabulary is two values, and the removed one is malformed

**Scope:** func
**Topic:** safe-shipping
**Date:** 2026-09-01
**Statut:** Superseded by [D-a-shipping-unit-lands-where-it-started] on 2026-09-04 — the ship-policy layer it settles no longer exists: authority for a landing is the plan header, read in-process by `esq merge land --plan`. Kept rather than deleted, because an ID is a permanent citation key.

**Contexte:** [D-esquisse-never-pushes] removes the capability; this settles what happens to the word. `SHIP_POLICIES` was `['manual', 'merge-only', 'merge-and-push']`, ordered weakest-first, with the working-tree floor implemented as an index comparison over it. Dropping to two values raises two questions the removal does not answer on its own: what a repository that already declared the third value now reads as, and whether an ordered array is still the right shape once only two members remain.
**Décision:** `SHIP_POLICIES` is `['manual', 'merge-only']`. `merge-and-push` is not special-cased anywhere: it is an unrecognized value like `MERGE-ONLY` or a typo, so it resolves to `manual`, sets `malformed: true`, reds `esq validate` with a finding naming the source and the fault class, and — like every other fault — never echoes the declared value back into a terminal, a log or a model's context. The floor stays a `min` over the ordered array, written as an index comparison; it does not collapse into a boolean.
**Raison:** Malformed rather than silently-downgraded is the honest reading: a project that wrote `merge-and-push` asked for something this tool no longer does, and quietly giving it `manual` would let it believe it had declared a policy it had not. `esq validate` is where that surfaces, and the Stop hook makes it unmissable — which is the point, since the alternative is discovering it at the moment a landing does not happen. Keeping the array ordered is the cheaper insurance: the index comparison is the mechanism that made a third value safe to add, and rewriting it as `policy === 'merge-only'` would have to be un-rewritten by whoever adds one, under exactly the conditions where a chain of `if`s falls through into more authority than it names.
**Tradeoff:** Gained: one closed vocabulary, one comparison, no migration branch in the reader, and a loud rather than silent transition. Accepted: `esq validate` breaks for anyone who declared the removed value, and it breaks at a session stop — a cost taken knowingly, mitigated only by the fix being one line.
**Conséquences:** `tests/cli/ship.test.mjs` runs its resolution table over two values and carries the removed one as a fault case, including the assertion that the string never reaches the verdict. The elevation floor is now proved on the only pair that remains — a feature branch declaring `merge-only` over a destination declaring `manual` — plus a branch still carrying the removed value, which *lowers* the answer rather than raising it, because malformed counts as `manual` in the minimum. The generated fault-class string `shipPolicy is not one of manual|merge-only` appears in `esq validate`'s findings and is amended into [D-malformed-ship-policy-reds-validate].
**Alternatives rejetées:** Mapping `merge-and-push` to `merge-only` for compatibility — it grants authority the project did not ask for under a name this tool no longer honors, and it is a silent migration of a security-relevant setting. Keeping it in the array but refusing to act on it — the value would resolve non-malformed, so nothing would ever tell the project its declaration is dead. Collapsing the floor to a boolean now that two values remain — it deletes the mechanism, and the mechanism is what the next value depends on.

## D-a-merge-refusal-never-moves-head — every merge precondition is answered off the refs, before HEAD moves

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-01
**Statut:** Active

**Contexte:** `esq merge begin` is the CLI's first write to git. Its preconditions — a clean tree, the branch exists, it is not being merged into itself, the destination exists, it is not already an ancestor — can each be evaluated either after switching to the destination (the order the skill prose used, because a human is standing there) or before, against the refs alone. B-100's unattended path makes the difference load-bearing: `esq merge land` refuses far more often than it lands, and a refusal that has already checked out a different branch leaves the caller somewhere it never asked to be.
**Décision:** Every precondition is checked against refs, in one order, before the switch; the switch is the last thing that happens before `git merge`, and a merge git declines to start switches HEAD back to where it was found. The already-an-ancestor answer in particular is read with `merge-base --is-ancestor refs/heads/<branch> refs/heads/<dest>`, which needs no checkout at all, and it is reported by `begin` rather than only by the composition above it.
**Raison:** A refusal is the common path, so its cost and its side effects are what the design is judged on: this ordering makes "nothing happened" literally true — `git rev-parse <branch>`, `git rev-parse HEAD`, the current branch and `git status --porcelain` are all byte-identical to before the call — and that invariant is a single assertion a test can hold over every refusal at once, which is exactly how `tests/cli/merge.test.mjs` pins it. It also costs less: a ref comparison is one subprocess where a checkout is a working-tree rewrite.
**Tradeoff:** Gained: one snapshot assertion covers every precondition refusal, and the unattended path can refuse as often as it likes without ever stranding the user's HEAD. Accepted: the checks cannot use anything only a checkout reveals, so any future precondition that genuinely needs the destination in the working tree must be added after the switch and must undo it on refusal.
**Conséquences:** Phase 5's `esq merge land` inherits the invariant rather than re-establishing it, and its no-op verdicts are refusals at exit 1 with the same shape. `begin` also refuses on a merge already in progress, which the plan did not list, because the alternative is compounding state git would otherwise have refused to describe. The `esq merge` group reads git through a total `gitRun`/`gitOut` pair rather than `cli.mjs`'s throwing `git()`: `git merge` exits 1 on exactly the conflicts these verbs exist to report, and an outcome must not arrive as an exception.
**Alternatives rejetées:** Switching first and aborting on refusal — it makes the refusal path the one that writes to the working tree, and any failure between the switch and the abort leaves HEAD somewhere the caller did not choose. Leaving the already-an-ancestor case to `land` alone — `begin` would then start a merge git resolves to a no-op, and there would be no `MERGE_HEAD` for `scan` to read a base from, so the caller learns about it as a missing field rather than as a verdict.

## D-seal-applies-the-rules-and-refuses-the-rest — the derivable half is written in one place, and only there

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-01
**Statut:** Active

**Contexte:** Phase 3's task list described `esq merge seal` as `git add -A` plus a commit, with the reconciled rows written by whoever called it — the skill by hand on the attended path, `esq merge land` in code on the unattended one. Its own verification step asked for something stricter: `begin` then `seal`, with nothing between them, leaving exactly one row for a shared ID with `Status` the further-along value and `Pri` the higher. A held merge still carries git's conflict markers, so a seal that applied nothing would have refused itself, and the two paths would have differed in more than who answers a question.
**Décision:** `seal` applies every cell `derive` settles before it stages anything, and refuses to commit whatever is left: a duplicate ID absent at the merge base, or any surviving conflict marker. The application is hunk-scoped and all-or-nothing — a conflict hunk that is not purely table rows, or that carries one `ask` cell, is left exactly as git wrote it.
**Raison:** The phase's goal was that the two paths reconcile identically and differ only in who answers an `ask`; that is only true if the derivable half has one implementation, and the only place both paths pass through is `seal`. All-or-nothing per hunk is what keeps it honest — a row is never half-settled by a rule and half by a human, so what survives is exactly the set of questions, and the refusal that follows is a complete statement of them.
**Tradeoff:** Gained: one reconciliation implementation, a `seal` that cannot commit git's unresolved text, and an `applied[]` report naming every cell written and the rule that wrote it — which is the per-cell "which rule, from which side" line the plan's own risk section warns about losing. Accepted: `seal` writes file content, which is a wider surface than the commit the task list described, and a hunk mixing one derivable row with one prose line is refused whole rather than partly resolved.
**Conséquences:** Phase 4's skill rewrite answers `ask` cells and nothing else — re-applying derived cells by hand would fight `seal` for the same lines. Phase 5's `land` needs no cell-application step of its own: it aborts on the first `ask` it sees in `begin`'s report and otherwise calls `seal`.
**Alternatives rejetées:** Leaving the application to each caller — the attended and unattended paths would then reconcile by two implementations, which is the second implementation `D-ship-policy-defaults-to-manual` refused in advance, and the phase's verification could not have been run as written. Rewriting the whole ledger file from the parsed three-way tables — it would have to reproduce every detail section and every line of prose around the table, so a bug there loses content git had merged correctly; hunk-scoped editing can only ever replace text git itself marked as contested.

## D-a-seal-is-arbitrated-by-the-text-not-the-index — an unmerged index entry is the normal state on the way in

**Scope:** func
**Topic:** safe-shipping
**Date:** 2026-09-01
**Statut:** Active

**Contexte:** `seal` must refuse to commit an unresolved conflict. The obvious test is git's own: a path still listed by `git diff --diff-filter=U` is unmerged. The first implementation used it and refused every legitimate seal — a caller resolves a conflict by editing the file, and `git add` is `seal`'s own first write, so the index is unmerged right up until the moment `seal` stages it.
**Décision:** The arbiter is the working tree's text. `seal` scans the files the merge touched for git's markers and refuses naming them; the index's unmerged state is not consulted as a refusal condition. The markers it looks for are `<<<<<<< ` and `>>>>>>> ` — seven characters and the label git writes — and deliberately not `=======`.
**Raison:** What must never be committed is git's unresolved text, and that lives in the file, not in the index; an index entry says only that nobody has run `git add` yet, which is a statement about workflow rather than about content. Excluding `=======` matters for the same reason in the other direction: it is also an ordinary setext underline, and a guard that reds on ordinary prose is one people learn to bypass.
**Tradeoff:** Gained: a caller resolves by editing, exactly as the skill has always described, and a file someone staged with markers still in it is caught — the index-based check would have missed that case entirely. Accepted: a caller who resolves a conflict by deleting the contested text rather than choosing a side passes the check, because there is then nothing unresolved left to see.
**Conséquences:** `esq merge seal` needs no `git add` from its caller and performs its own; the skill's step 5 collapses to one CLI call. A future non-text conflict class — a binary file, a submodule — is not covered by a marker scan and would need its own condition.
**Alternatives rejetées:** Refusing on any unmerged index entry — it refuses the normal path. Requiring the caller to `git add` before sealing — it moves the one destructive-looking step out of the verb that owns it and gives a caller a way to stage markers past the check.

## D-a-precondition-is-read-not-re-run — the verb answers it, the skill reports the verdict

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** Phase 4's task list scoped the rewrite to merge mode's steps 2–5, leaving step 1's preconditions as prose telling the model to run `git status --porcelain`, `git show-ref` and `git branch --show-current` and stop if any failed. `esq merge begin` checks every one of them itself, against the refs, before HEAD moves — so keeping the old step meant three git round trips per attended merge whose only outcome was to be checked again by the next call.
**Décision:** Step 1 was rewritten too. It now names `begin`'s six refusal verdicts — `dirty`, `absent`, `self`, `up-to-date`, `merge-in-progress`, `refused` — and what the skill says for each, and it instructs the model not to pre-check them by hand.
**Raison:** A precondition checked in two places is not checked twice as carefully; it is checked once and then guessed at, because the two implementations can disagree and only one of them gates the write. Reading the verdict is also the cheaper half: the user sees the same refusals with the same messages, and the run pays one subprocess instead of four.
**Tradeoff:** Gained: one authority for every precondition, three fewer round trips per merge, and refusal messages the CLI's own tests pin. Accepted: a divergence from the phase's stated task boundary, and a skill that can no longer explain *why* it refused without the verb having run — which is correct, since before the verb runs there is nothing to refuse.
**Conséquences:** Any precondition added to `esq merge begin` later reaches the attended path by adding a verdict line to step 1, never by adding a git command to it. The same shape applies to Phase 6: `/esq:converge` reads `esq merge land`'s verdict rather than pre-computing the gates the verb re-checks itself.
**Alternatives rejetées:** Leaving step 1 verbatim to keep the phase inside its stated task list — it preserves the task boundary at the cost of the behavior the phase exists to establish, which is that the CLI owns the mechanism. Deleting step 1 entirely and letting the verdict speak for itself — the skill would then have no written account of what a refusal means, and a model meeting `self` for the first time would have to invent the "run this from your main session, not from inside the worktree" advice that made the old step worth reading.
## D-a-refused-landing-is-a-truthful-no-op — not landing is a fact the run reports, not a failure it suffers

**Scope:** prod
**Topic:** safe-shipping
**Date:** 2026-09-02
**Statut:** Superseded by [D-landing-is-its-own-command] on 2026-09-10 — the rule itself stands and moved with the landing: every way `/esq:land` does not land is a no-op naming its reason and the command that clears it. What fell is the carrier: `/esq:converge` no longer lands, so its landing line became a `ready to land` / `not ready` line.

**Contexte:** `/esq:converge` gained seven gates between a clean itinerary and a merge commit — branch ownership, a clean tree, every phase logged complete, `esq validate`, every phase's `(auto)` step re-run, no surviving finding, and `esq merge land`, which re-reads the ship policy itself. Seven gates is a long list of ways not to land, and most runs will meet one: a repository that never declared `merge-only`, a trunk-mode plan, a branch already merged, one 🟡 nobody resolved. The plan's own risk note named the failure mode — a user whose runs never land and who cannot tell why — and the shape a landing step takes decides whether that user is informed or merely disappointed.
**Décision:** Every path that does not land is a **no-op**, and it is reported as a fact rather than as an error. Nothing is written: the held merge is aborted inside the primitive, HEAD returns to where it was found, and the source branch and every commit on it are untouched. The report carries one line that is never absent — `○ not landed — <reason>` — and that line always names **the exact command a human would run instead**, the `/esq:worktree merge <branch> into <dest>` string the primitive itself composed. A bare reason with no command is a defect, not a detail. A trunk-mode plan and a branch already an ancestor of the destination are reported as no-ops, not as failures: there was nothing to land, and the run's other work still stands.
**Raison:** The alternative shapes both lie. Reporting a refusal as a failure makes an ordinary, correct outcome — this project declares `manual` — read as something broken, and a user who sees that twice stops reading the landing line at all. Reporting nothing is worse: silence where a landing line belongs reads as a claim that the branch is on the destination. And a reason without a command hands the user a diagnosis instead of an action, which is the same defect the option-set rule exists to prevent one level up. The command is cheap to carry — `land` already composed it for its own refusals — so there is no case where omitting it buys anything.
**Tradeoff:** Gained: a landing step that can refuse in seven ways without ever leaving a user unable to finish by hand, and a report whose absence of a `✔` is never ambiguous. Accepted: the report is slightly longer on every run that does not land, and `land` carries a `command` field on refusal paths whose only consumer is prose.
**Conséquences:** Converge's zone-3 landing line is mandatory in both forms, and any gate added later has to supply a reason *and* a command before it can be added at all. The same shape holds one level down: `esq merge land` exits 1 on every refusal with `{landed: false, reason, command}`, so a caller other than converge inherits it. A resolvable push is reported the same way — as a `○` fact naming the remote, its tracking ref and the ahead count — and carries no command, because esquisse does not spell one (`D-esquisse-never-pushes`).
**Alternatives rejetées:** Exiting nonzero from `/esq:converge` when it does not land — it conflates "this project has not authorized landing" with "something went wrong", and the run's real work (the itinerary, the fixes, the findings) is what the exit code should be about. Omitting the landing line when nothing landed — silence is read as success by every user who has seen the `✔` form once. Naming the reason without the command — measured against the plan's own risk note, that is precisely the state where a user cannot tell why their runs never land.

## D-an-unrunnable-auto-step-substitutes-once — resolved by reading at plan time, substituted once and logged at build time

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-02
**Statut:** Superseded

**Superseded by:** D-repair-command-before-proof (2026-09-25). Plan-time reading remains; build's command substitution becomes a bounded prospective repair with fresh proof.

**Contexte:** Three `(auto)` verification steps in one plan named commands that could not run as written — the scripts existed and were executable, and the defect was in the argument shape. The build agent recognised two of them, ran the check the step's prose described, and recorded the substitution in the execution log, correctly and under no license at all (B-106).
**Décision:** The defect is caught where the plan is authored — `/esq:plan` resolves every `(auto)` command's referent **by reading** before writing the step, never by running it — and `/esq:build` keeps a licensed fallback as a **second** named exception to executing a step exactly as written: when the command cannot run and the step's own sentence names the artifact and the property being checked, it runs that check at the same or greater strictness and logs command-run / command-named / why; when the prose is ambiguous it halts as a failure.
**Raison:** Halting on a typo costs a full session, and the halt reason is a plan defect the resuming agent has to fix anyway — CLAUDE.md's third cost question, resuming into a stop buys a full agent to be told what you already know. Reading buys the same signal as running without the side effects or the three-to-four minutes a step naming `./scripts/audit.sh` would cost per plan, and it keeps plan text out of the execution surface.
**Tradeoff:** Gained: all three observed cases are caught at authoring time for the price of a few file reads, and behavior the build agent already performed twice is now licensed with its conditions named rather than inherited. Accepted: the mechanized half is lexical — it proves both texts carry the rule, not that a planner obeyed it — and build now runs, under stated conditions, a command the plan did not write.
**Conséquences:** `build/SKILL.md` counts two exceptions and only two, each carrying the same log obligation, so a third has to argue with a number rather than join a list. The record rides the existing `verification` and `backlogCandidates` fields of `esq plan append-log`; no new write path. `/esq:converge`'s landing gate re-runs `(auto)` steps with no equivalent fallback and is left untouched here.
**Alternatives rejetées:** Executing each `(auto)` command at plan time — side effects, minutes per plan, and it makes plan text an execution surface. Validating argument shape in `esq validate` — the CLI owns structure and never judgment, and it would have caught 0 of the 3 observed cases. Halting on every unrunnable command — it pays a full session for a typo whose fix is already known.

## D-unknown-harness-evidence-is-treated-as-stale — Unknown harness evidence is handled exactly as stale

**Scope:** func
**Topic:** harness-evidence
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** The freshness brief made an unreadable `claude --version`, a missing registry or a malformed row render green and never block a relay, on the reasoning that the tool should not redden on its own failure to measure.
**Décision:** Any model-routing evidence that is not provably `fresh` — stale, never-measured, missing, malformed or unreadable — puts the relay on the same path: warn once and proceed if the session is Opus, otherwise stop before the first spawn with `/model opus`; evidence that does not govern model-routing is status-only in every state.
**Raison:** Green-on-unknown is the unsafe direction: the whole point of the registry is that worker routing rests on a measurement, and "we could not check" leaves it resting on nothing while looking checked. Stale and unknown differ in what the report says, never in what the relay does.
**Tradeoff:** Gained: no path where unverified routing evidence silently authorizes a spawn. Accepted: a machine where `claude` is not resolvable on `PATH` stops every relay in a non-Opus session, for the cost of one `/model opus` and a re-invoke.
**Conséquences:** The relay's verdict is a two-value question — proceed, or Opus-only — so the CLI can emit it deterministically while the session-model comparison stays the skill's. `unknown` still renders differently from `stale` in `/esq:status`, because the remedy differs.
**Alternatives rejetées:** Green on unknown (the brief's original rule) — unsafe, as above. A third `degraded` tier with its own relay behavior — a compatibility claim nobody measured, and the same objection that kept semver tiering out of scope.

## D-a-capture-is-claimed-before-it-is-billed — A billed capture claims its destination before the first spawn

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** `scripts/probe-model-pins.mjs` re-saved its whole capture after every row in `overwrite` mode, so pointing `--out` at an existing path destroyed the previous run's billed records — and only after ten fresh billed runs had already been spent (B-099).
**Décision:** The destination is claimed once with `wx` before the first spawn and appended to row by row through a new `openCapture` writer in `scripts/lib/capture-schema.mjs`; a collision refuses at zero billed runs and leaves the existing file untouched.
**Raison:** The three requirements — never destroy an existing capture, never lose a completed billed row to an interruption, never place an undeclared sibling — are only jointly satisfiable by a held descriptor. Claiming with `exclusive` and then rewriting through `atomic` leaves a `.capture-*.tmp` beside the target on a SIGKILL, which the module's own preamble forbids.
**Tradeoff:** Gained: the refusal costs nothing, and an interrupted run keeps every row it paid for. Accepted: ~50 lines of new lifecycle code in the repo's most safety-critical file, and a second exported writer the two smoke scripts do not use.
**Conséquences:** `capture-schema.mjs` remains the repo's one write path — that contract is about the module, not about a single function — so any future billed script gets the claim-and-append behavior by using it rather than by re-deriving a guard in its own caller.
**Alternatives rejetées:** `exclusive` claim then `atomic` rewrites (the temp-file sibling, plus re-serializing the whole capture once per row). An `existsSync` guard in the probe (a TOCTOU check, and it puts the refusal outside the module that owns writing).

## D-the-current-measurement-is-a-cell-not-a-date — A claim's current measurement is an explicit cell

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** `docs/EVIDENCE.md` is a series: one row per measurement, appended forever, several rows per claim over time. Something has to say which row the freshness verdict is computed from.
**Décision:** A claim's current measurement is the single row whose `State` cell reads `current`; activation is an appended row plus flipping the previous row to `superseded`, and no capture or row is ever deleted or edited in place. Zero or two `current` rows for one claim is ambiguity and resolves to `unknown`.
**Raison:** Any inferred rule — newest date, last line — silently promotes a capture the moment it is written, which is the opposite of what a deliberate revalidation should mean, and ties break non-deterministically. An explicit cell also makes the failure legible: a capture written and never activated is a visible gap rather than a silent one, and `esq evidence` lists any capture under `docs/evidence/` that no row names so the gap cannot become permanent.
**Tradeoff:** Gained: a deterministic, auditable selection with no inference. Accepted: activation is a two-cell hand edit, which is a second-writer risk the unregistered-capture listing is there to catch.
**Conséquences:** The registry can hold the whole history — every superseded measurement and its capture stay exactly as measured — without any of it affecting a verdict. D-a-measured-figure-is-dated-not-refreshed is untouched: freshness is a derived verdict about a measurement, never an edit to one.
**Alternatives rejetées:** Newest `Measured` date wins (promotes on write, ties non-deterministically). Last matching row in file order (makes row order load-bearing in an append-only file, so a rebase could change a verdict).

## D-a-deadline-resolves-at-the-kill — A deadline resolves at the kill, not at the child's close

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** `scripts/probe-model-pins.mjs` gained a 180 s per-row deadline (B-099's neighbour: the probe had no runtime ceiling at all). The obvious implementation kills the child on expiry and lets the existing `close` handler resolve the row.
**Décision:** The timeout handler kills the child and resolves the row itself, with the stdout and stderr accumulated so far and a `null` exit code; `close` may or may not arrive afterwards and is ignored.
**Raison:** Node fires `close` only once the process has exited **and** its stdio pipes have closed. A killed child's own children inherit those pipes, so a grandchild outliving the kill keeps the promise pending — the deadline fires, the child dies, and the run still waits. Observed directly in the phase's own test: a 400 ms deadline cost 60 s of wall clock.
**Tradeoff:** Gained: the bound is what it says it is, under any child-process tree. Accepted: a row killed on its deadline is judged on a truncated stream, and a stray grandchild is not reaped — it is orphaned, not waited on.
**Conséquences:** Any future bounded spawn in this repo resolves at its own kill. Reaping the whole tree (`detached: true` plus a process-group kill) is the alternative if orphans ever matter; it was not needed here, because the stream already in hand is the row's evidence and a killed `claude` takes its own work down with it.
**Alternatives rejetées:** Waiting for `close` — the defect itself. Killing the process group — more machinery, a portability surface (`detached` semantics differ across platforms), and it would still have to resolve at the kill to bound anything.

## D-the-relay-verdict-is-one-field — The relay reads one field, not the claim list

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** The plan puts the relay verdict on the `model-routing` claim: `relay: "proceed"` when fresh, `"opus-only"` otherwise. That shape has no answer for the two cases where the claim is not there to carry it — a registry naming no `model-routing` claim at all, and one naming two.
**Décision:** `esq evidence` keeps the per-claim field and adds a single top-level `relay` string. It is `proceed` only when exactly one claim governs `model-routing` and that claim reads `fresh`; every other shape — none, two, stale, never-measured, unknown — is `opus-only`.
**Raison:** A relay must route off one value it can read without reasoning, and the corrected unknown rule says evidence nobody can locate is exactly as unsafe as evidence that is out of date. Putting the collapse in the CLI keeps the judgment-free half deterministic and leaves the skill with the one comparison only it can make — the session's own model.
**Tradeoff:** Gained: no consumer searches, filters or counts the claim list, so no consumer can get the missing-claim case wrong. Accepted: one field duplicates information already present per claim, and the two can only agree because the same code computes both.
**Conséquences:** Phase 3's shared relay block quotes `relay` and nothing else for the decision; `claims[]` supplies only the words of the stop — the version pair, the reason and the refresh command.
**Alternatives rejetées:** Per-claim only, as planned — leaves the caller to decide what a missing claim means, which is the judgment the CLI is supposed to have removed. Making a missing routing claim a hard error — `esq evidence` is a total report that always exits 0, and a repository registering no routing evidence is not broken, only ungoverned.

## D-a-capture-states-its-own-version — A capture states its own version, and the registry is checked against it

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-02
**Statut:** Active

**Contexte:** Every registry row carries a `Version` cell, hand-written when a measurement is activated. A hand-written version is exactly the kind of cell that drifts from the run it describes — which is the failure this plan exists to stop, one level down.
**Décision:** The `Version` cell is never trusted on its own: `esq evidence` reads the version the capture recorded for itself and refuses the row when they differ. The version is taken from `init.claude_code_version` where the capture reduced the harness init event and from the judge column `cc` where it did not, and a capture recording two distinct versions is a finding rather than a choice between them.
**Raison:** The plan said to read `init.claude_code_version`; `tests/smoke/fixtures/capture.jsonl` has no init record at all, because `smoke-work-capture.mjs` reduces only the judge columns. Accepting either key registers the captures that exist rather than requiring a billed re-run to satisfy the reader. Refusing a two-version capture preserves what the probe's per-row `cc` column was added for: a capture merged across two harness versions is not one measurement.
**Tradeoff:** Gained: no row can claim a version its own evidence does not support, and no billed run was spent to make the three existing captures registrable. Accepted: the reader knows two key names, so a third capture shape would have to teach it a third.
**Conséquences:** Registering a new measurement cannot be done from prose — the capture has to be on disk and has to agree. A future capture writer that records no version anywhere cannot be registered until it does.
**Alternatives rejetées:** Requiring `init.claude_code_version` everywhere — would have meant re-buying the smoke capture to register it. Trusting the cell and skipping the capture read — the drift this plan is about. Taking the first version found in the file — makes a merged capture pass as one measurement.

## D-relay-inherits-the-session-model — A relay declares `model: inherit`, so its own stop is escapable

**Scope:** arch
**Topic:** model-pins
**Date:** 2026-09-03
**Statut:** Active

**Contexte:** The harness-evidence preflight stops `advance`, `autopilot` and `converge` before their first spawn when the routing measurement was not taken on the installed Claude Code and the session is not itself Opus, and it advertises `/model opus` then re-invoke as the fix. All three carried `model: sonnet`, so the relay read Sonnet for itself whatever the session ran, stopped again, and printed the same advice — observed blocking `/esq:converge` on 2026-09-02 (B-112), leaving a billed remeasurement as the only escape.
**Décision:** The three relays declare `model: inherit` and take the session's model; a fixed pin on any command carrying `orch-shared:evidence-preflight` fails `scripts/check-evidence.sh`.
**Raison:** With no pin there is no question of whether a pin bites, so the recovery stops depending on `E-interactive-pin`, the one claim this repo registers as `never-measured`. The saving the pin was buying was already doubtful on the typed path — B-026 saw a `sonnet`-pinned `/esq:autopilot` run 23/23 requests on Opus, and 27/27 direct orchestrator rows took the session model on 2026-08-19 — so the pin was trading a real guard failure for an unmeasured discount.
**Tradeoff:** Gained: the printed recovery is an action rather than a loop, on both the typed and headless paths, with the refusal itself untouched. Accepted: an unattended run now bills at the session's model by default, and the cheap relay is something the user types.
**Conséquences:** README § Model recommendations and `docs/ARCHITECTURE.md` name `/model sonnet` (or `claude -p … --model sonnet`) as the relay saving; `docs/SPEC.md`'s "the orchestrators run cheap" sentence is stale until `/esq:spec` refreshes it. Any future relay must declare `inherit` or fail the build.
**Alternatives rejetées:** Keeping the pin and letting the first worker spawn under the `esq telemetry assert-model` post-check — relaxes a refusal shipped the day before against an unverified field, and pays a worker to learn what the gate suspected. Doing both — largest surface, and the guard stops refusing anything before spending.
## D-a-manual-measurement-names-a-capture — A manual measurement names a capture, like every other row

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-03
**Statut:** Active

**Contexte:** README's interactive-pin protocol — the one-session procedure that closes B-047 — tells the reader to append a `current` row with an empty `Capture` and flip the placeholder to `superseded`. The reader allows an empty cell only on `never-measured`, so both rows red, `E-interactive-pin` reads `unknown`, and the findings ride on `esq validate`, which blocks the session stop: following the documented protocol leaves every stop blocked until someone deletes a row the registry forbids deleting (B-115, review of `harness-evidence-freshness`).
**Décision:** A manual measurement is evidenced the same way a billed one is. The protocol's last steps write `docs/evidence/<date>-interactive-pin.jsonl` — one sanitized record per direction carrying `cc`, the command, the invocation path, the observed `models[]` and the verdict — and the appended row names that file. The reader is not relaxed.
**Raison:** The alternative was to let a `current` row carry an empty `Capture`, which makes one cell mean both "this measurement has no artifact" and "somebody forgot to name one" — and the reader cannot tell them apart, so every future row could then assert a version nothing corroborates. That is the silent rot `check-evidence.sh` exists to catch, and lowering the floor for one row lowers it for all of them. Requiring the artifact also keeps the reading itself — which model the typed command actually ran on, in both directions — readable by someone who was not in the session.
**Tradeoff:** Gained: one rule covers billed and manual measurements, `D-a-capture-states-its-own-version` stays true of every registered row, and the manual reading outlives its session. Accepted: the protocol's two directions must run on one Claude Code version, because a capture recording two is refused, and the session ends with a write step it did not have.
**Conséquences:** Any future by-hand measurement must produce a committed capture before it can be activated. `scripts/check-evidence.sh` gains an assertion that the row README's protocol tells you to write is one the reader accepts — the defect class here was a documented procedure whose output the reader refuses, which no comparison of registry against prose could see.
**Alternatives rejetées:** Allowing an empty `Capture` outside `never-measured` — three lines of README, at the cost of the registry's floor. A third `State` value, `manual`, status-only and never `fresh` — a new value in a closed set that the reader, the registry doc, README and check 47 all must learn, bought so one row can skip its artifact, and it leaves E-interactive-pin permanently unable to read fresh, which is the point of measuring it.

## D-the-never-measured-placeholder-is-never-retired — A `never-measured` placeholder is never retired

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-03
**Statut:** Active

**Contexte:** README's interactive-pin protocol ended by flipping `M-interactive-pin-pending` to `superseded` — "the placeholder is retired, never deleted". That row carries no capture and no version, and the reader refuses a capture-less row in every state but `never-measured`, so the flip turns the placeholder into a finding and leaves `E-interactive-pin` reading `unknown` at the exact moment it is finally measured. `D-a-manual-measurement-names-a-capture` settles what the new row names; it does not say what becomes of the old one (B-115, Phase 2).
**Décision:** The placeholder stays untouched at `never-measured`, beside the new `current` row for the same claim. Nothing retires it, and nothing deletes it.
**Raison:** The registry's activation rule already says the sole edit an activation makes to an existing row is flipping a `current` row to `superseded` — a `never-measured` row is not eligible, and the reader's own selection rule counts `current` rows only, so a placeholder sitting beside a current row is not ambiguity and reads as the current measurement. The alternatives both cost more than they buy: deleting the row breaks immutability, and relaxing the reader so a `superseded` row may name no capture reopens the empty-cell ambiguity `D-a-manual-measurement-names-a-capture` had just closed.
**Tradeoff:** Gained: the protocol edits no registered row at all, so every step of it is an append. Accepted: the claim permanently carries a row that records nothing, and because check 47 holds README's prose and the registry's *live* measurements to the same set, README must go on naming a placeholder that no longer describes the state of the world.
**Conséquences:** Any claim that is registered `never-measured` before it is measured keeps two live rows forever, and the prose that names its measurements names both. A future check that wants "one live measurement per claim" would be wrong on that shape.
**Alternatives rejetées:** Flipping the placeholder to `superseded` — what the protocol used to say, and precisely the second half of B-115. Deleting it — forbidden by the registry's immutability rule and unnecessary, since it gates nothing. Relaxing the reader to allow a capture-less `superseded` row — undoes the floor `D-a-manual-measurement-names-a-capture` was chosen to keep, and Phase 1's test now pins the refusal deliberately.
---

## D-a-documented-protocol-is-run-not-read — A documented protocol is verified by running its output, not by reading its prose

**Scope:** arch
**Topic:** harness-evidence
**Date:** 2026-09-03
**Statut:** Active

**Contexte:** B-115 was a documented procedure whose output the reader refuses: README's interactive-pin protocol told a maintainer to append a measured row with an empty `Capture`, which `esq validate` reds and which blocks every session stop. Check 47 existed, was green, and could not see it — its README assertion compares the registry's live measurements against the IDs README's prose *names*, and never against the row README tells you to *write*.
**Décision:** Check 47's sixth assertion extracts the fenced template row from README § "The interactive pin", substitutes its two placeholders, materializes it with a matching capture in a throwaway git root, and reads it back through `esq evidence --json`.
**Raison:** The only instrument that can say whether a registry row is legal is the reader itself; any check holding its own copy of the row, or its own restatement of the rule, agrees with itself while the README rots. Materializing the documented artifact and running the real reader over it costs one extra `esq evidence` run — 0.2 s inside a check already budgeted under one second — and makes the assertion exactly as strong as the production path.
**Tradeoff:** Gained: a protocol that stops producing a legal registry reds the build instead of surfacing the next time a person follows it. Accepted: the row is parsed out of prose, so a reworded template makes the check exit 2 rather than fail — deliberately, since a template it cannot find is "nothing to check" and must never read as agreement.
**Conséquences:** Assertion 6 is scoped to findings naming the template measurement or its capture, plus that claim's own verdict, because a one-row fixture necessarily raises the registry-level `no claim governs model-routing`. Any future documented protocol whose output is a ledger row is verifiable the same way, and the same scoping rule applies to it.
**Alternatives rejetées:** Asserting against a hard-coded copy of the row — the check would then agree with itself, which is the failure mode B-115 already demonstrated. Asserting on the README text alone (that the `Capture` cell is non-empty) — restates one of the reader's rules in a second place, and would have missed the version cross-check and the path-confinement rule entirely. Seeding a model-routing row into the fixture so "any finding fails" — buys an unscoped assertion at the cost of a second fabricated row and a second capture, and makes the fixture a small copy of the real registry rather than the one row under test.

## D-a-shipping-unit-lands-where-it-started — a shipping unit lands on the branch it was created from

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-04
**Statut:** Active

**Contexte:** `esq merge land` asked `.esquisse.json`, read from `refs/heads/<default>:.esquisse.json`, both whether a run may land and where. The second answer was always the repository default branch, so work begun on `dev` landed on `main` — a branch the user never named (B-116).
**Décision:** `/esq:plan` records the invoking branch as `**Origin:**` and cuts `esq/<slug>` as `**Branch:**`; `esq merge land --plan <plan>` reads both from the plan header in the same process as the git write; `.esquisse.json`, `esq ship policy` and every reader behind them are deleted, as is `esq branch check`'s `trunk` verdict and `defaultBranchOf`.
**Raison:** The consent an autonomous landing needs already happened when the user stood on a branch and typed `/esq:plan`; a repository-level declaration answers a question it was never the authority on. Once the destination comes from the plan, the policy guards nothing the plan does not state, and reading the declaration from the *destination* ref — the mechanism that made it meaningful — no longer matches a destination the plan chose. Blast radius stays one local merge commit on a local branch, recoverable with `git reset`, and nothing is pushed.
**Tradeoff:** Gained: the landing goes where the work began, one converge gate and one preflight subprocess disappear, and the hostile-`.esquisse.json` input class goes with the reader. Accepted: consent is per shipping unit rather than per repository — there is no longer a repo-wide "never merge here" switch — and two model-written header fields now reach git as refs, held by `safeRef` and argv-only calls.
**Conséquences:** Every plan from here on cuts a work branch, which changes how esquisse itself is worked. A plan carrying no `**Origin:**` is legacy: it is excluded from the ownership scan, keeps its build-time `**Branch:**` guard, and converges to a truthful `○ not landed` with the `/esq:worktree merge` hand-off. `D-esquisse-never-pushes` is untouched and `scripts/check-nopush.sh` remains the mechanism holding it.
**Alternatives rejetées:** Keeping the policy and pointing only the destination at `**Origin:**` — authority then splits across two mechanisms that can disagree, since a declaration reviewed on `main` would gate a merge into `dev`, and it keeps five decisions and one hostile-input path for a gate that guards nothing. A per-plan `**Land:**` opt-in field — asks for consent a second time, and is the kind of field everyone sets once and never reads again.

**Supersedes:** `D-ship-policy-lives-in-a-committed-esquisse-json`, `D-ship-policy-defaults-to-manual`, `D-ship-policy-reader-stands-beside-branch-check`, `D-ship-policy-authority-from-the-destination-ref`, `D-malformed-ship-policy-reds-validate`, `D-ship-policy-report-is-total`, `D-ship-policy-is-a-two-value-vocabulary`. **Amends:** `D-a-plan-owns-its-branch-trunk-owns-nothing` (the trunk clause falls) and `D-one-merge-engine-in-the-cli` (`land`'s in-process authority read is the plan header, not the ship policy).

## D-the-branch-guard-refuses-before-the-first-spawn — The branch guard refuses before the first spawn, not at the landing

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-04
**Statut:** Active

**Contexte:** Collapsing converge's landing to six gates folded `esq branch check` into `esq merge land`'s own header read and deleted the only comparison of HEAD against the plan's `**Branch:**`. `/esq:converge <plan>` run from another branch commits its fix commits there, lands `esq/<slug>` into `**Origin:**` without them, and reports `✔ landed` (B-119).
**Décision:** Converge runs `esq branch check <plan-path>` in preflight, immediately after it resolves the plan path and before its first spawn, and routes off `refuse` exactly as `/esq:build` does; the landing stays six gates and `esq merge land` stays HEAD-independent.
**Raison:** The merge itself was never wrong — it lands the refs the plan names either way. What is lost is up to four subagents' worth of fix commits written onto a branch nobody will merge, and that damage is complete before the landing runs. A guard that fires after the spending reports a fact one subprocess knew before any of it, which is CLAUDE.md cost questions 1 and 3 in one defect.
**Tradeoff:** Gained: the refusal costs one subprocess, reuses the existing five-verdict vocabulary with no new CLI code, and leaves the six-gate count that `docs/SPEC.md`, `docs/ARCHITECTURE.md`, R-08's needle and `scripts/test-conformance-guard.sh` all pin exactly where it is. Accepted: the guard is skill prose in two carriers, so it holds only as long as check 42 asserts it — which is why growing check 42 to the converge carrier ships in the same plan.
**Conséquences:** `esq branch check` now has two callers, and `docs/ARCHITECTURE.md § Boundaries not to cross` records both positions — build before the plan read, converge before the first spawn. Scenario R-06 widens from build to both. Any future command that spawns workers against a plan inherits the same obligation.
**Alternatives rejetées:** A seventh landing gate — it refuses after the itinerary has run and after the fix commits are already on the wrong branch, and it moves a count four carriers pin. A HEAD check inside `mergeLand` — it inverts `D-a-shipping-unit-lands-where-it-started`, whose whole point is that the invocation branch is never an input, and it breaks the test at `tests/cli/merge.test.mjs:896` that proves the destination comes from the plan by landing from a fourth branch.

## D-a-refusal-hands-back-what-it-established — A land refusal hands back exactly the refs it established

**Scope:** func
**Topic:** merge
**Date:** 2026-09-04
**Statut:** Active

**Contexte:** `esq merge land --plan <plan>` now takes both refs from the plan header, and either can fail `safeRef` on a plan written by a model on a branch someone else wrote. Every refusal owes the user the attended `/esq:worktree merge` line that would finish the job by hand, but a refusal caused by an unusable field cannot name that field.
**Décision:** The hand-off is built from what the plan established *before* the refusal: both refs when both validate, the branch alone when only `**Origin:**` is unusable, and no command at all when `**Branch:**` is.
**Raison:** A partial hand-off is still runnable — `/esq:worktree merge <branch>` merges into the branch the user is standing on, so an unusable origin costs them one choice rather than the whole path back. An unusable branch leaves nothing truthful to print, and printing the rejected value so the line "looks complete" would put attacker-supplied text into a terminal as something to run, which is precisely what refusing rather than sanitizing exists to prevent.
**Tradeoff:** Gained: every refusal that *can* carry a next step does, without any refusal ever echoing a value git itself would reject. Accepted: the hand-off's shape varies by refusal, so a caller relaying it must handle `command: null`.
**Conséquences:** Any future field that becomes a ref argument follows the same rule — validate, then name the field and omit the value. A relaying command (`/esq:converge`) prints the line when there is one and states plainly that there is none when there is not; it never composes one itself.
**Alternatives rejetées:** Always emitting a full line (would require printing or repairing the rejected field — the sanitize path the security note forbids). Never emitting one on any field failure (throws away a runnable escape the user does have, and a bare reason with no next step is the defect the hand-off was added for).

## D-user-owns-the-branch-header-escape — The user owns the header edit that clears `owned-elsewhere`

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** `esq branch check`'s `owned-elsewhere` verdict fires only where the plan already records the branch HEAD is on, so the refusal's option A (`git switch -c esq/<plan-slug>`) leaves the header naming the contested branch and the next run reads `mismatch` — every offered `do:` led back to a refusal (B-120).
**Décision:** Option A gains a second step the *user* performs — edit the plan header's `**Branch:**` to the new branch unless it already names it — and the single-writer rule is restated as binding commands, not the human who owns the file.
**Raison:** The property B-102 bought is that no refusing command rewrites the field to let itself proceed; the human editing their own plan was never what it forbade, and option C already asked for exactly that edit on `mismatch`. Stating the existing contract costs four prose carriers and two needles; creating a second writer would cost a CLI subcommand, its tests, both usage strings, the README and check 42.
**Tradeoff:** Gained: an authority stop whose escape runs as written, with no new surface and no weakening of the guard. Accepted: a two-line `do:` where a single command would read better, and a slug the user retypes from the line above.
**Conséquences:** `docs/SPEC.md § Branch ownership` states what the hand-back contains, and R-06 pins the escape per carrier. Any future mechanization of the rewrite is a new decision, not an implementation detail of this one.
**Alternatives rejetées:** `esq branch adopt <plan-path>`, cutting the branch and rewriting the header atomically — better ergonomics, but a second writer of a single-writer field and a guard whose escape hatch is itself a command; filed as a follow-up if the two-step escape is typed wrong in practice. Teaching `branchCheck` to treat the switch as reconciling the header implicitly — rejected outright: it makes the recorded field advisory, which is the property B-102 bought.

## D-a-run-belongs-to-one-plan-window — A run belongs to one plan window or to none

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** Telemetry rows carry a timestamp and an `esq:<command>` slug but no plan slug, so joining spend to a plan's outcome (B-073) can only be temporal, and this repo's plans overlap in time.
**Décision:** A run is attributed to a plan only when exactly one plan's `[opened, closed]` window contains its `recordedAt`; runs inside two or more are counted as `ambiguous`, runs inside none as `outside`, and neither enters a segment.
**Raison:** Pro-rating a run across overlapping plans invents precision the timestamps do not carry, and makes a segment's cost depend on how many unrelated plans happened to be open beside it. An exclusive rule keeps every attributed number defensible and moves the uncertainty into a coverage figure a reader can weigh.
**Tradeoff:** Gained: every number under the coverage line is an unsplit observation. Accepted: a busy period may attribute almost nothing, and the report will say so rather than fill in.
**Conséquences:** If coverage proves too low to argue from, the fix is carrying a plan slug on the telemetry label — a capture change, deliberately out of B-073's scope — not a looser window.
**Alternatives rejetées:** Pro-rating by window overlap (invents precision); nearest-window attribution (silently guesses); widening a window until every run lands somewhere (guarantees full coverage and measures nothing).

**Amendement (2026-09-06, B-121) — identity supersedes the window; it never merges with it.** The fix this entry named as the only acceptable one shipped: a telemetry row now carries a declared `(repoKey, planSlug)` identity (`D-plan-identity-is-declared-not-inferred`), so a local row whose slug resolves to a known plan is that plan's **with no temporal test applied at all**, and a local row with no slug enters no segment. The window is not consulted for those rows and the two readings are never blended — a merged rule would let a clock quietly overrule a declaration, which is the failure the identity work exists to remove. Every rule stated above is retained unchanged where it still runs: attribution by `[opened, closed]` window survives as a *diagnostic* behind `--temporal-diagnostic`, over local unidentified rows alone, printed under a heading that says it is not evidence, absent from `segments` in `--json`, and refused outright in combination with `--baseline-gate` — a gate resting on evidence may not be argued from a reading this repo has labelled non-evidence. The refusal at the heart of this entry is therefore intact and was never relaxed: no window was widened, nothing was pro-rated, and the 11%-of-923 reading it produced on 2026-09-05 stands as the measurement that justified replacing it.

## D-work-size-is-phases-executed — Work size is phases executed

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** B-073 segments by "a defensible work-size proxy", and a plan's size can be read as planned phases, executed phases, or the diff it produced.
**Décision:** The proxy is the count of `## Execution log` entries — `small` 1, `medium` 2–3, `large` 4+.
**Raison:** It measures what was actually built rather than what was proposed, it is already committed in the artifact the join reads, and it costs no `git` call per plan. A diff size rewards verbose changes and would make the proxy vary with formatting.
**Tradeoff:** Gained: a proxy that is free to compute and cannot drift from the ledger. Accepted: a single-phase plan that took three days reads as `small`.
**Conséquences:** A plan with no execution log has no size and is reported as unattributed rather than bucketed.
**Alternatives rejetées:** Lines changed (rewards verbosity, costs a git read per plan); planned phase count (measures the plan, not the work); task count (not recorded after execution).

## D-the-join-lives-outside-the-cli — The cost↔outcome join is a script, not a CLI mode

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** B-073's join could be a `esq lane stats --with-usage` mode or a script over the two existing `--json` surfaces.
**Décision:** A dependency-free `scripts/outcome-join.mjs`, sibling to `cost-budgets.mjs`; the CLI gains only additive structural fields (`openedAt`, phase counts and backlog acceptance on `lane stats`, a `--rows` projection on `telemetry summary`).
**Raison:** The join is a best-effort temporal inference, and the CLI every skill routes off owns structure and never judgment. Keeping it in a script also keeps `lane stats` a pure ledger read, so the same repo answers the same on two machines.
**Tradeoff:** Gained: the inference is one reviewable file, and both inputs replay as saved JSON. Accepted: two subprocess calls and one more top-level script.
**Conséquences:** The script stays out of `audit.sh` for the reason D-cost-budget-checked-outside-the-audit already states; only its fixture-only suite is gated, under check 39.
**Alternatives rejetées:** A `lane stats` mode (puts inference in the deterministic CLI and makes it machine-dependent); per-plan windowed telemetry queries (one full pass over the store per plan, for facts one pass already has).
## D-rows-flag-refuses-without-json — A machine-only flag on a prose-first read is refused, never ignored

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** `telemetry summary` prints a report by default and the same numbers as one object behind `--json` (D-lane-stats-prints-prose-for-a-human). Its new `--rows` projection is per-run join keys — a machine surface with no line in the report — so `--rows` without `--json` has no rendering.
**Décision:** `esq telemetry summary --rows` without `--json` throws the usage error and exits 2; the flag is never accepted and ignored.
**Raison:** The alternative failure is silent: the caller gets the ordinary report, exit 0, and discovers the missing rows only when its join comes back empty against a document that looks well-formed. A usage error costs one retry and names the fix; a silently dropped flag costs a debugging session downstream. The refusal is also structural — the CLI is answering "this combination has no output", not judging what the caller wants.
**Tradeoff:** Gained: a flag that cannot be silently dropped, so a saved replay fixture is either complete or refused at the point it was produced. Accepted: one more usage path to keep in step with the usage string, and `--rows` can never grow a prose rendering without revisiting this.
**Conséquences:** Any later machine-only projection on a prose-first read follows the same rule rather than degrading to the report. A replay fixture for `scripts/outcome-join.mjs` must be saved with both flags, and a `runRows`-less document is a missing input rather than an empty one.
**Alternatives rejetées:** Accept and ignore (silent, and the empty join is diagnosed far from the cause); imply `--json` when `--rows` is given (changes the output format from a flag whose subject is content, and would surprise a caller piping the report); render the rows in the report (922 rows on this repo's own store — a projection for a joiner, not for a person at a terminal).

## D-an-unexecuted-plan-has-no-window — A plan that never executed a phase opens no window

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** `lane stats` gives a plan a `closedAt` only once it has an execution-log entry, so a plan that was written and never built carries an opening date and nothing else. Under D-a-run-belongs-to-one-plan-window such a plan would need a window running to now.
**Décision:** A plan with zero executed phases takes part in no attribution: it gets no window, is counted on the coverage line as "never executed a phase", and appears in no segment. An executed plan that is still open does run to now.
**Raison:** An unbounded window on work that never happened would claim every recent run and, worse, would make every other plan's run ambiguous — turning a plan nobody built into the largest single source of lost coverage. Refusing the window is the same refusal D-a-run-belongs-to-one-plan-window already makes, applied one step earlier.
**Tradeoff:** Gained: coverage loss is confined to real temporal overlap, and the count of unbuilt plans is reported instead of hidden inside `ambiguous`. Accepted: an abandoned plan whose runs really did happen contributes nothing, which is correct here only because it also has no size to segment by.
**Conséquences:** The coverage line carries a fourth number — plans with no window — beside the three run counts, so a repo full of unbuilt plans reads as such rather than as a windowing failure.
**Alternatives rejetées:** A window running to now (an unbuilt plan poisons every overlapping plan's attribution); a window of the opening day alone (invents a closing date the ledger never recorded); dropping the plan silently (hides how much of the corpus was never built).

## D-a-plan-window-is-a-day-range — A plan window covers both end days, and a tie is ambiguity

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** `lane stats` dates are whole authored days (`2026-08-19`) taken from a filename and a log entry; a telemetry row's `recordedAt` is a UTC instant. Joining them means choosing what a date means as a bound.
**Décision:** A window is `[openedAt 00:00Z, closedAt + 1 day 00:00Z)` — inclusive of both end days — and a run landing on the closing day of one plan and inside another is a tie, resolved as `ambiguous` by the ordinary rule rather than by a tie-break.
**Raison:** The two clocks are genuinely different and `lane stats` already carries that caveat for its own dates; inventing a second rule here would make the join disagree with the surface it reads. Half-open at the opening day would drop the run that started the work — usually the most attributable run there is.
**Tradeoff:** Gained: one rule, inherited rather than invented, and every boundary run is either attributed or declared uncertain. Accepted: a day of overlap at each end is real ambiguity that a finer clock would resolve.
**Conséquences:** Nothing downstream may add a tie-break — a boundary run that two plans claim is `ambiguous`, not the nearer plan's. Sharpening this needs a plan slug on the telemetry label, not a narrower window.
**Alternatives rejetées:** A half-open window excluding the closing day (loses the phase that closes the plan, which is the work); nearest-midpoint tie-breaking (silently guesses, and D-a-run-belongs-to-one-plan-window rejects guessing); parsing a time out of the ledger (there is none to parse).

## D-a-model-configuration-keeps-its-context-pin — A configuration keeps the context pin and drops the snapshot date

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** Telemetry model ids arrive in three shapes — `claude-opus-5`, `claude-opus-5[1m]`, `claude-haiku-4-5-20251001` — and the join segments by "model configuration", so it has to decide which differences are configuration and which are noise.
**Décision:** A model key keeps a context pin (`[1m]`) and drops a trailing dated snapshot (`-20251001`); a plan's configuration is the sorted set of the normalised ids its attributed runs actually used, joined with `+`.
**Raison:** A context window is a choice someone made and is exactly the kind of decision this measurement exists to inform; a dated snapshot is a release the harness picked, and treating it as a configuration would fork a segment on every model refresh — over an already thin sample, that is the difference between a comparable cell and a cell of one.
**Tradeoff:** Gained: segments stay comparable across snapshot bumps, and the one configuration a user actually chooses stays visible. Accepted: a genuine behavior change shipped in a dated snapshot is pooled with the version before it.
**Conséquences:** A plan whose runs used more than one model gets a compound key (`a+b`) rather than being counted under either — mixed-model work is its own configuration, not a member of both.
**Alternatives rejetées:** The raw id (a snapshot bump forks every segment); the family alone (loses `[1m]`, the only configuration a user picks); the plan's most-used model (hides that the work was mixed, and a majority over two runs means nothing).

## D-the-join-reuses-the-repo-sample-threshold — The join withholds a rate at the threshold `lane stats` publishes

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** `esq telemetry summary` marks a group `provisional` below five token-bearing runs and `esq lane stats` withholds a lane's rates below five plans, both from the single constant `MIN_SAMPLE_RUNS` (D-telemetry-sample-threshold-five-runs). The outcome join segments on three axes at once — lane × model configuration × work size — so its cells are far thinner than either input's, and it had to decide what counts as too thin to quote.
**Décision:** The join declares no threshold and reads exactly one document for it: `laneDoc.sampleThreshold`, falling back to 5 when the field is absent (`scripts/outcome-join.mjs:253`). `telemetryDoc.sampleThreshold` is never read. The two surfaces carry the same number today because both publish one shared constant — `MIN_SAMPLE_PLANS = MIN_SAMPLE_RUNS` (`plugin/lib/cli.mjs:29`, `plugin/lib/telemetry.mjs:39`) — not because the join reads or reconciles both documents. That single value is then applied to each rate against the denominator that rate was computed from (D-a-rate-is-withheld-by-its-own-denominator): a segment below it prints its plan and run counts and withholds the rates it cannot support, as `lane stats` does today.
**Raison:** A second threshold would let the same corpus be honest on one surface and confident on another, and whichever number was chosen would have to be argued from nothing — the join has no sample of its own to argue from. Taking it from the lane document rather than hard-coding it also means a change to `MIN_SAMPLE_RUNS` moves all three surfaces at once — which is the only way the three can be quoted in the same sentence — and because both surfaces derive from that one constant, a divergence between them would be a bug in the sharing, not a disagreement this script is expected to arbitrate.
**Tradeoff:** Gained: one number, one rule, and a report that cannot be more confident than the surfaces it summarises. Accepted: a three-axis segmentation over a corpus this size leaves most cells thin, so the first runs show more withheld rates than quoted ones — which is the honest reading, not a defect to tune away.
**Conséquences:** Raising confidence in a segment is a matter of getting more attributable runs into it — a plan slug on the telemetry label (B-121) — never of lowering the bar here. A consumer that wants the raw counts has them: they print beside the withheld rates and are in `--json`. If `telemetry summary` ever published a threshold of its own, the join would not notice: it would go on using the lane document's number, so splitting the two constants is work this script would have to be changed for.
**Alternatives rejetées:** A lower join-specific threshold (invents confidence the inputs refuse, over a strictly thinner sample); dropping thin segments entirely (hides how much of the corpus is thin, which is the reading the coverage line exists to give); segmenting on fewer axes to fatten the cells (the three axes are the question B-073 was filed to answer).

## D-a-rate-is-withheld-by-its-own-denominator — A rate is withheld by its own denominator

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** `scripts/outcome-join.mjs` gated all three outcome rates on one segment-wide `thin` flag decided by plan count, but the accepted rate's denominator is backlog rows — so a segment clearing five plans could print an acceptance percentage computed from one row beside a reopen and a defect rate each resting on five (B-124).
**Décision:** The accepted rate is published only when the segment clears the plan threshold *and* its own row count clears the same threshold; the withheld cell shows `done/rows` and names which threshold it missed, and `--json` carries the denominator and the reason.
**Raison:** The thin-sample guard is the instrument's honesty claim, and one rate quietly exempt from it makes the whole row's provenance unreadable. `plugin/lib/cli.mjs`'s own `rate(count, of)` helper already withholds against the denominator it was given, so gating each rate on its own `of` applies a rule this repo had already written down rather than inventing a second one.
**Tradeoff:** Gained: every printed percentage cleared a threshold on the sample it was actually computed from. Accepted: two distinct reasons a cell can be withheld, which the legend and the JSON both have to distinguish.
**Conséquences:** Any rate added to this report later declares the denominator it answers to; a rate that cannot name one is a pair of counts, as `lane stats` already treats plan acceptance. This refines D-the-join-reuses-the-repo-sample-threshold rather than replacing it — still one number, taken from the lane document, now applied per denominator.
**Alternatives rejetées:** Dropping the accepted rate to counts only (discards a rate whose denominator the ledger does hold — done over claimed — leaving readers to diff integers by eye); recasting acceptance as a per-plan boolean to unify the denominators (a plan closing nine of ten rows would score identically to one closing none, buying a tidier table by making the metric coarser).

## D-plan-identity-is-declared-not-inferred — Plan identity is declared by the command, never inferred

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-05
**Statut:** Active

**Contexte:** The outcome join attributes a telemetry run to a plan by asking which plan's window contains its `recordedAt`, and on this repo's own store that attributes 99 of 923 runs — 11% — because the plans overlap almost continuously (B-121). `D-a-run-belongs-to-one-plan-window` already refuses the looser window that would fake coverage, so the identity has to be carried rather than guessed, and the question was where it comes from.
**Décision:** Identity is the pair `(repoKey, planSlug)`. `repoKey` is written on **every** row both recorders produce — agent label, subagent fallback, whole-run subagent record and direct session segment — regardless of command class and regardless of whether the row carries a slug; an ambiguous segment keeps the key and drops the slug. It is 32 hexadecimal characters of SHA-256 over the real path of the **canonical git common directory**: `<root>/.git` for a main checkout, and for a linked worktree the same directory, reached by following the `gitdir:` file and reducing a trailing `/worktrees/<name>`. Matching means local, a different value means `foreignRepo`, and an absent value means `unscopedRepo` — never silently either. The slug half is what the party that knows the plan writes down, only when it actually knows it. A subagent's Agent description becomes `esq:<command> plan:<plan-slug>` — the marker appended only by an orchestrator that was itself invoked on that plan (`autopilot`, `converge`), never by one whose spawn precedes any plan (`advance`'s `esq:work` and `esq:apply`). The `plan:` prefix is load-bearing rather than decorative: a description is free prose, so a *bare* second token is not syntactically distinguishable from the words descriptions already carry — `esq:build phase 2 of the plan` would persist `phase` and `esq:check the plan` would persist `the`, values that resolve to no plan at best and to an unrelated real one at worst. An unprefixed token is prose and is never read as identity. A direct session declares through the `esq lane <plan-or-brief-path>` call that `autopilot`, `build`, `check`, `converge`, `fix`, `plan`, `review` and `work` make: the CLI validates by parsing the plan's `## Assurance` block (resolving a `*-fixes.brief.md` to the plan its stem names), normalises with the same `normalizeSlug` that keys `lane stats`'s `byPlan` rows, and appends one `{ slug, at }` event to a session-scoped, append-only log the session recorder transfers into the open segment and then deletes. No transcript argument, branch name, filesystem path or timestamp is ever read for identity.
**Raison:** Both viable mechanisms reach the same 201 of 201 direct plan-bearing rows on this store — the six commands in that class are each invoked on a path that already exists — so the required denominator did not decide it. Three other things did. Declaration also captures the runs that *precede* a plan and then declare one, so `/esq:plan`'s 67 direct segments and plan-routed `/esq:work` stop being invisible and a plan's recorded cost stops silently excluding the session that produced it. It keeps the judgment out of the hook: the writers enforce a slug's shape, the join enforces its resolution. And an append-only log can *detect* a second declaration, where a single argument or a single overwritten claim file structurally cannot — which is what makes ambiguity a classification rather than a silent last-writer win.
**Tradeoff:** Gained: 100% of the plan-bearing class reachable, pre-plan cost visible, a join key identical to `lane stats`'s by construction, no new round trip, two distinct declarations that announce themselves, and a label shape under which every description written before this convention reads as *no identity* rather than as a wrong one. Accepted: a documented read-only verb acquires a write side effect outside the repository; the mechanism depends on `CLAUDE_CODE_SESSION_ID`, an undocumented harness variable registered as `E-session-id-env`; and an event log is more machinery than one claim file, which is the price of detecting the second declaration.
**Conséquences:** Coverage follows the *commands that call `esq lane`*, so a command that later needs attributing gains it by making that call, not by teaching a parser a new argument shape — which is why `esq lane` learns to take a corrective brief, closing direct `/esq:fix` and moving the plan-bearing ceiling from 96% to 100%. A segment holding two distinct slugs is `ambiguousIdentity`: no `planSlug`, no segment, counted against coverage, never able to satisfy the baseline gate. Every failure mode — a lost event, an absent session id, a stale or orphaned log — degrades to *no identity*, never to a wrong one. The log path is derived by one shared function on both sides, so the CLI never has to trust a `CLAUDE_PLUGIN_DATA` it is forbidden to read (`D-cli-ignores-plugin-data-env`), and the write answers to the same `telemetryOptedOut` predicate as every other telemetry write. Its filename is `sessionKey(id)` — a bounded, fixed-length hex digest — because a harness-supplied identifier is never interpolated into a filesystem path; `safeId`'s character substitution is neither traversal-proof by construction nor collision-free, and both writer and reader use the one derivation. Repository scope is read before identity, and it cannot be conditional on identity: the rows coverage turns on are the ones with **no** slug, since a local plan-bearing run that failed to declare must lower the rate while the identically-shaped run in another project must not touch it — and a slug-conditional key would leave both slug-less and key-less, indistinguishable. So the key goes on every row. `foreignRepo` and `unscopedRepo` are reported with their own counts and sit outside the cohort, the denominator, every segment and the gate; only local rows are classified further, and among them an undeclared plan-bearing row stays in the denominator. Thirty-two hex characters rather than a shorter prefix because a truncated key colliding *and* meeting the same plan slug would produce a wrong attribution rather than a visible foreign row. This widens a deliberately minimal store on every row, which is accepted here rather than in passing; it is the caller `D-invalid-samples-excluded-not-deleted` was waiting for, and that entry is amended rather than overturned. `docs/SPEC.md` § *Session guards and telemetry* states the superseded privacy rule and must be refreshed by `/esq:spec`, its only writer.
**Alternatives rejetées:** Parsing the structured invocation — `<command-args>` on a typed command, `input.args` on a Skill `tool_use`, both measured on real transcripts here — which reaches the same required denominator but captures no pre-plan declaration at all, moves a filesystem-validation judgment into a hook that today only counts, reads an arbitrary user-supplied argument string, and cannot represent a second declaration because there is only ever one argument. A dedicated `esq telemetry attribute <plan-path>` verb, which is more honest about writing but buys the same coverage for one extra Bash round trip in each of eight skills plus their `commands/esq/` mirrors. A single overwritten claim file, rejected because it can only keep the last of two declarations and would assign a whole segment's cost to one of two plans with no signal that it had chosen. Loosening the temporal window, refused outright by `D-a-run-belongs-to-one-plan-window`.


## D-a-slug-is-validated-at-two-altitudes — A slug's shape is the writer's, its resolution is the reader's

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-06
**Statut:** Active

**Contexte:** A declared plan slug reaches a telemetry row through a hook (`plan:<slug>` on a spawn label) or through the CLI (`esq lane`'s declaration event), and is read back by `scripts/outcome-join.mjs`. Both ends could check that the slug names a real plan. Only one of them should (B-121).
**Décision:** The writers enforce **shape** and nothing else — a closed `^[a-z0-9][a-z0-9-]{0,63}$`, no separators, no dots, no path — and a value outside it leaves no `planSlug` at all, never a stored raw token. The join enforces **resolution**, against the plan slugs in `esq lane stats --json`: a slug naming no plan is `unknownIdentity`, and one naming a plan that never executed a phase — so it has no window and no size — is `staleIdentity`. Both counts print beside the coverage rate.
**Raison:** A hook owns structure and never judgment (`plugin-runtime`): "is this a real plan" is a repository question whose answer changes as plans are written, renamed and deleted, and a hook that answered it would have to read `docs/` on every spawn and would bake one moment's answer into an append-only store. Shape, by contrast, is a property of the string itself and is exactly what keeps a traversal or a 200-character value out of the row. Putting resolution in the reader also means the same rows re-resolve correctly as the ledger changes, and a miss stays *visible* — a slug the join cannot resolve is a named count, not a silently dropped row.
**Tradeoff:** Gained: a hook that stays a counter, a store that never holds a judgment about a repository state it did not read, and two distinct misses a reader can act on differently. Accepted: a malformed-in-context slug can be persisted and only discovered on the read side, so the coverage rate can fall for a reason the writing session never saw.
**Conséquences:** Anything else that later declares an identity validates shape at the write and resolution at the read, and the shapes are shared constants (`PLAN_SLUG_SHAPE`, `REPO_KEY_SHAPE`) re-exported rather than re-declared, so the join admits exactly what the hooks emit and nothing wider. `unknownIdentity` and `staleIdentity` count against coverage: a miss the reader cannot see is a number that quietly got better.
**Alternatives rejetées:** Resolving in the hook (a filesystem judgment in a counter, a `docs/` read per spawn, and an answer frozen at write time); dropping unresolvable slugs silently at read time (the rate improves by hiding its own misses); storing the raw token when it fails the shape (persists arbitrary description prose, which is the data-minimization boundary this store is built on).

## D-a-session-id-is-hashed-into-a-filename — A harness identifier is hashed, never interpolated into a path

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-09-06
**Statut:** Active

**Contexte:** The declaration log is session-scoped, so its filename has to be derived from `CLAUDE_CODE_SESSION_ID` — a value the harness supplies, whose shape is undocumented (`E-session-id-env`) and which the CLI and a hook must both derive identically (B-121).
**Décision:** One shared `sessionKey(id)`: reject a non-string, an empty string or an id longer than 512 characters — which yields no log at all — and otherwise return the first 32 hex characters of its SHA-256. Writer and reader both call it; nothing else ever constructs that filename.
**Raison:** The output is fixed-length, hex-only and traversal-proof *by construction* rather than by filtering, so no value the harness supplies can escape, absolutize or collide its way out of `esq-attribution/`. The existing `safeId` character substitution is none of those: it is a filter, its output length follows its input, and two distinct ids can substitute to one name. A bound before hashing keeps an absurd input from being read at all, and every rejection degrades to *no identity* rather than to a wrong file.
**Tradeoff:** Gained: a filename that is safe without anyone auditing what the harness may put in the variable, and one derivation both sides agree on without trusting the other's environment. Accepted: the log's name is opaque, so an orphaned file cannot be traced back to its session by eye — which is also the privacy property.
**Conséquences:** Any future session-scoped artifact keys the same way. Debugging a stale log means listing the directory and reading the events, never reversing the name. This is the second half of the shared-derivation rule the log's directory already follows: the *root* is the caller's, the *filename* is the shared function's, so the CLI can honor `D-cli-ignores-plugin-data-env` without either side trusting the other.
**Alternatives rejetées:** Reusing `safeId` (a substitution filter, neither traversal-proof by construction nor collision-free); the raw id (interpolating a harness value into a path); a truncation to 8 or 12 hex characters (collisions merge two sessions' declarations, which manufactures ambiguity out of nothing); one shared log for all sessions (a session must be able to consume and unlink its own without racing another's).

## D-two-declarations-are-ambiguity — Two declarations are ambiguity, never a last-writer win

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-06
**Statut:** Active

**Contexte:** A session can legitimately run `esq lane` on more than one plan, and a subagent's Bash may inherit its parent's `CLAUDE_CODE_SESSION_ID`, so one segment's declaration log can hold two distinct slugs (B-121).
**Décision:** The log is append-only and event-preserving precisely so the second declaration cannot erase the first. A segment whose admitted events carry two or more distinct valid slugs — or a log too long to read — publishes `planAmbiguous: true` and its `repoKey`, with **no** `planSlug`. It enters no segment in the join, counts in the coverage denominator and against the numerator, and can never satisfy the baseline gate. Repeated declarations of the *same* slug are deduped and are a no-op; an event that does not arrive with the segment's own repository key is ignored outright and is not a competing reading.
**Raison:** The one thing this design will not trade a missing identity for is a wrong one. A last-writer win would assign a whole segment's cost to one of two plans with no signal that it had chosen, and the resulting number would be indistinguishable from a correct one — which is exactly the class of error the temporal rule was replaced for. An ambiguous row, by contrast, announces itself, is counted, and pushes the coverage rate *down*, so the mechanism's own weakness shows up in the instrument rather than in a plan's cost.
**Tradeoff:** Gained: ambiguity is a classification a reader can see and act on, and no wrong attribution is representable. Accepted: a legitimate multi-plan session loses its cost attribution entirely, and the coverage rate carries that loss.
**Conséquences:** This is what makes the append-only event log worth more than a single claim file — a file that is overwritten structurally cannot detect the second declaration. Slugs are unioned onto the open segment's cursor before the log is unlinked, so a crash between append and unlink re-transfers a duplicate rather than a second identity. If ambiguous rows become a large share of the misses, the finding is about which commands declare, not about how ties should be broken: there is no tie-breaking path to add.
**Alternatives rejetées:** Keeping the last declaration (assigns a segment to one of two plans, invisibly); keeping the first (same, with a different arbitrary rule); splitting the cost across both (invents precision the events do not carry, and `D-a-run-belongs-to-one-plan-window` already refused pro-rating for the same reason); dropping ambiguous rows from the denominator (the rate improves by hiding the mechanism's own failure).

## D-identity-is-required-optional-or-impossible — What a command is invoked on decides whether it owes an identity

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-06
**Statut:** Active

**Contexte:** A coverage rate needs a denominator, and not every esq command can name a plan: `/esq:backlog` has none to name, and `/esq:plan` runs *before* the plan it will create exists (B-121).
**Décision:** Three closed classes, decided by what each command is *invoked on* and never by what its name suggests. **Plan-bearing** — `build`, `check`, `review`, `fix`, `autopilot`, `converge` — is invoked on a plan or a corrective brief that already exists, so it owes an identity and is in the coverage denominator always, identified or not. **Pre-plan** — `plan`, `work`, `grill`, `ui`, `apply` — precedes plan creation, so it joins the denominator only when it actually declared. **Non-plan-bearing** — `backlog`, `roadmap`, `spec`, `arch`, `sweep`, `worktree`, `epic`, `status`, `advance`, `decisions`, and every unlabelled subagent — never counts. The same list is applied identically by the writers, the join, the gate and the prose, and a pre-plan run is never assigned to a plan that appeared later.
**Raison:** Without the taxonomy the denominator is either every row — in which case `/esq:backlog` permanently caps coverage below any usable floor and the rate measures the command mix rather than the mechanism — or only identified rows, in which case a run that failed to declare improves the rate by failing, which is the one arithmetic this instrument must not have. Deciding by invocation rather than by name is what keeps the list checkable: `apply` sits in pre-plan because `advance` spawns it outside any plan while `autopilot` and `converge` spawn it inside one, so the class is right for the row that cannot declare and generous to the row that can. Refusing to assign a pre-plan run to the plan it later produced is the same refusal as everywhere else: there is no structural key that would join them, and inventing one from time, branch or prose is the failure the whole design removes.
**Tradeoff:** Gained: a denominator that measures the mechanism rather than the command mix, and a miss that can only lower the rate. Accepted: `/esq:plan`'s own cost is attributed only when it declares, so a plan's recorded cost can exclude part of the session that produced it; and the taxonomy is a judgment that will be re-litigated as the command set moves.
**Conséquences:** A new command is placed in one of the three sets when it ships, in one place, and the three sets stay closed — a count is never special-cased to accommodate one command. If the spawn mix shifts, the fix is moving a command between sets, not adding a fourth. `esq lane` learning to accept a corrective brief is what puts direct `/esq:fix` inside reach and raises the plan-bearing ceiling to 100%, which is the ceiling `D-the-baseline-gate-floor-is-95-percent` is derived from.
**Alternatives rejetées:** Every row in the denominator (measures the command mix, and caps coverage at a number no mechanism can move); only identified rows (a failed declaration improves the rate); classifying by command name or by whether a slug happened to be present (the second is the same defect stated as a rule); assigning a pre-plan run to the plan created shortly afterwards (a clock join, refused everywhere else in this design).

## D-the-baseline-gate-floor-is-95-percent — The gate's floor is 95%, derived from a 100% ceiling

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-06
**Statut:** Active — amended 2026-09-06 (B-125, B-126). The floor, the two lanes and the ceiling it is derived from are unchanged; what the amendment adds is below, under *Amendement*.

**Contexte:** B-121 exists to take a pre-change baseline that B-071, B-044, B-085 and B-087 will be argued against, and "is the baseline usable yet" needed an answer a machine can give rather than a reader's impression (B-121).
**Décision:** `--baseline-gate` answers three conditions, each owning one distinct miss so no shortfall is reported twice, and each ✗ carrying the distance to it: cohort coverage clears `GATE_COVERAGE` = 0.95; a `full` cell **and** a `conformity` cell (`GATE_LANES`) each hold `sampleThreshold` distinct plans; and in those two qualifying cells every published rate clears its own denominator. A lane with no qualifying cell is the second condition's miss and is not judged again by the third. Under the flag the verdict *is* the exit code — 0 usable, 3 not — and 2 is never returned: an empty cohort is a failing condition with a distance, not a missing report.
**Raison:** 95% is not a round number chosen for comfort. Every local plan-bearing row is structurally reachable by the mechanism once `esq lane` accepts a corrective brief, so the ceiling is **100%** and the 5% is an operational budget for the ways a declaration is lost in practice — an absent `CLAUDE_CODE_SESSION_ID`, a `/compact` typed mid-command, a command that aborts before declaring, an ambiguous multi-declaration. A floor much lower would admit a reading where one row in ten is missing, and those missing rows could be one systematically biased command class rather than noise. The two lane cells are required because the baseline exists to support a *comparison* between assurance lanes; a single-cell baseline cannot carry the argument the downstream rows want to make. And a distance is printed with every miss because "not yet" without a number is a verdict nobody can act on.
**Tradeoff:** Gained: one command, one exit code, and an operator who reads how many more plans of which lane are needed. Accepted: the gate is a threshold on a rate this project also controls, so it has to be defended against being quietly lowered — which is why the ceiling it derives from is written down beside it.
**Conséquences:** A gate sitting at 90% for a long stretch reads as the mechanism *losing declarations* — a defect to find, not a threshold to lower. The lane of a plan is computed from its own axes and is never chosen, so a `conformity` cell cannot be manufactured by writing weaker assurance blocks; if the queue is exhausted and a required cell is still short, the shortfall is recorded in B-121 and handed to the user as an option set, and nothing synthetic is created. `GATE_COVERAGE` and `GATE_LANES` are exported constants that the README's threshold prose quotes, so a change to the floor moves the prose with it.
**Alternatives rejetées:** A simple majority (the segments would describe whichever runs happened to fall in a quiet week, which is a sample nobody chose); 100% (a single lost session would block the baseline indefinitely, and the losses are known to be operational); no gate at all, read by eye (the number that decides whether four blocked backlog rows may proceed is exactly the number that should not rest on an impression); one condition combining all three (a single ✗ that cannot say which shortfall to act on).

**Amendement (2026-09-06, B-125 and B-126) — not a supersession.** The floor is still 95%, the lanes are still `full` and `conformity`, and the ceiling the floor is derived from is still 100%. Three things the first writing left underdetermined, and one implementation read the wrong way:

1. **The cells condition is existential.** "A `full` cell and a `conformity` cell each hold `sampleThreshold` plans" is a claim that *some* cell of each lane does, never a claim about the lane's biggest cell. `gateCell` answered it about the largest, so a 6-plan cell with a thin accepted denominator failed a lane that also held a fully valid 5-plan cell — a usable baseline reported as a miss (B-126).
2. **One cell per lane is selected, and both cell conditions judge that same one.** Evidence is never assembled from a plan count in one cell and a backlog denominator in another. The selection (`selectGateCell`) is a total order over that lane's cells reading only fields of the cell, so the verdict cannot depend on the order segments arrive in: a cell clearing both floors, greatest `plans` with ties by key; else the plan-qualified cell with the smallest accepted-row shortfall, so the printed distance is the closest miss a reader can act on rather than an arbitrary one; else the lane's greatest `plans`; else `null`, which is the cells condition's miss exactly as before.
3. **A frozen baseline names its harness, or is not written.** `--json --baseline-gate` emits `claudeCode`, read once through the same bounded `claude --version` seam `esq evidence` uses (exported from `plugin/lib/cli.mjs` rather than duplicated), and that combination alone spawns anything — an ordinary join, `--json` without the gate and a text-only `--baseline-gate` read no version at all. On the freeze path an unreadable version is an operational error, not a soft field: an otherwise-passing gate exits **1**, names the seam's own reason and writes no document, because a reading that cannot say which harness produced it is not comparable with a later one, and comparability is the whole purpose of freezing it. The version is **not a fourth condition** — a gate already failing still exits 3 with its distances (B-125). The commit-message convention that stood in for this is withdrawn from README and `docs/baselines/README.md`: a self-describing document does not depend on a message being written correctly.

## D-plan-slug-canonicalized-at-the-writer — Canonical plan-slug derivation is machine-owned, at the writer

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-06
**Statut:** Active

**Contexte:** Every `plan:` marker ever written to this machine's telemetry store carries the plan file's dated stem (`2026-09-05-outcome-attribution-coverage`) rather than the canonical slug `scripts/outcome-join.mjs` resolves against — 17 of 17 markers, six sessions, two repositories. The hook admitted the value syntactically and stored it verbatim, so three genuine runs classified as `unknownIdentity` and held the cohort at 56% coverage (B-128). The rule "drop the date prefix" had been written correctly in prose three times and followed zero times out of seventeen.
**Décision:** `LABEL_PATTERN` admits exactly two bounded declared forms — the canonical slug `[a-z0-9][a-z0-9-]{0,63}` (64 characters) and its `YYYY-MM-DD-` dated form (75) — and the **writer** canonicalizes the admitted capture through one shared pure function, `canonicalPlanSlug`, defined once in `plugin/scripts/hook-io.mjs` beside `PLAN_SLUG_SHAPE` and byte-identical to `plugin/lib/cli.mjs`'s `normalizeSlug` (which becomes a re-export of it), then re-validates the result against `PLAN_SLUG_SHAPE` before persisting. Nothing outside the two admitted forms enters canonicalization, is persisted raw, or costs its row `esqCommand`, `requestedModel` or `repoKey`.
**Raison:** Canonicalizing at the reader would convert every future malformed declaration into apparently valid evidence — the instrument would stop being able to see its own writer break, and its coverage number would improve exactly when the thing it measures got worse. At the writer, a regression still surfaces as `unknownIdentity` and still fails the gate. The byte-identity with `normalizeSlug`, uniquifier stripping included, is not a preference: the join's plan index is built from that exact function over plan filenames, so a "strip the date only" variant would silently de-join any plan whose filename ends in a digit group.
**Tradeoff:** Gained — declared identity survives the form the orchestrator actually writes, at zero new cost (one pure call on a string the handler already holds; no subprocess, no file read, no extra round trip). Accepted — `LABEL_PATTERN` writes to an append-only store, so a wrong admission cannot be edited out later, only remapped; the two bounds are therefore pinned and tested at 64, 75 and 76 characters rather than reasoned about.
**Conséquences:** Identity stays *declared*: the `plan:` marker remains required, the `esq lane` declaration log gains no new consumer, and a spawn that declares nothing still records no `planSlug` (`D-plan-identity-is-declared-not-inferred` upheld in full). `D-a-slug-is-validated-at-two-altitudes` is upheld with the writer's altitude unchanged — shape in, shape out, canonicalization strictly between the two checks. Any future derivation of a plan slug from a filename — B-127's brief grouping included — consumes `canonicalPlanSlug` rather than adding a third definition, and an audit check with its fault injection fails the build on a second one.
**Alternatives rejetées:** *Normalize at the reader* — one file, and it would have repaired the three existing rows for free, but it blinds the instrument to its own writer and was rejected on that alone. *Restate the rule in prose* — the option this repo has already taken three times, with a measured compliance rate of 0 of 17.

## D-run-row-carries-the-agent-id — The run-row allowlist names the agentId, and still nothing else

**Scope:** arch
**Topic:** measurement
**Date:** 2026-09-07
**Statut:** Active

**Contexte:** `RUN_ROW_KEYS` (`plugin/lib/telemetry.mjs`) is a closed allowlist over the rows the read-only run projection republishes, and its own comment read *"no agentId, no sessionId, no path, no text"*. B-128 needed to recover three already-written rows whose `plan:` marker carried the plan file's dated stem, and the recovery resolved by the brief is a closed, exact, version-controlled remap whose match key is the `agentId` — the same key `EXCLUDED_RUNS` has always matched on inside that same module. The rows `scripts/outcome-join.mjs` reads had no way to carry it.
**Décision:** `agentId` joins `RUN_ROW_KEYS` and `runRow` (the record's own id, `null` where the run has none), and the surface's comment is rewritten to say why the allowlist now names it. Nothing else is added: the allowlist still names no prompt, no response, no file path, no session id and no code content, and the document produced without `--rows` is byte-identical to before.
**Raison:** `D-hook-telemetry-stops-at-observable-usage` governs what the *handlers write*; this changes only which of the already-written fields a read-only projection republishes. The agentId is a harness-generated run identifier, not content — it is opaque, carries no user text, and is already persisted in `agent-runs.jsonl` and already read from there by `EXCLUDED_RUNS` in the same module. So the widening is of the projection's surface, never of the store's, and no hook writes anything new.
**Tradeoff:** Gained — a reader can address a single row deterministically, which is what makes a three-field-exact remap (and any future one) possible without inventing a synthetic key or a new persisted field. Accepted — a minimization comment that had been absolute now carries an exception, and an exception recorded once is an exception that can be cited to justify a second; the mitigation is that this entry exists rather than the comment quietly changing meaning, and that the allowlist stays closed and short.
**Conséquences:** The projection's row is one field wider forever, on an append-only store's read path. Any further addition argues against this entry rather than against a comment. `EXCLUDED_RUNS` and `LEGACY_IDENTITY` both key on the field this decision publishes and are two distinct maps with disjoint keys, asserted by test — see the 2026-09-07 note on `D-invalid-samples-excluded-not-deleted`.
**Alternatives rejetées:** *Key the remap on `(recordedAt, repoKey, planSlug)`* — no allowlist change at all, but the three `recordedAt` values could only be measured from one machine's live store at implementation time, so the map could not be pinned in a plan, reviewed against anything, or reproduced by a second reader; it was the fallback, not the choice. *Leave the three rows lost* — they are worth roughly 60 billed subagent runs of distance on the baseline gate, and losing them silently is the failure mode the coverage rate exists to make visible.

## D-release-command-lives-in-the-repo — The release command lives in the repository, not in the plugin it ships

**Scope:** infra
**Topic:** release
**Date:** 2026-09-07
**Statut:** Active

**Contexte:** B-097: `plugin.json`'s version had not moved in 662 commits, nothing in `audit.sh` read a version, and the path from "the converge is clean" to "a fresh `claude` session runs what I just verified" was four remembered commands with no signal when they were forgotten. The maintainer asked for one command after a clean converge.
**Décision:** The release is `./scripts/release-local.sh --patch`, a script in the source checkout — explicitly not a twenty-first `/esq:*` skill — and the version question it asks is the same one `audit.sh` asks, implemented once in `scripts/check-release-version.sh` and read by both. The drift half of that check is scoped to `main`; the manifest-agreement half is not scoped.
**Raison:** A release command distributed inside the plugin is loaded from the installed copy, so the command that ships a fix is whatever version last shipped — a stale releaser releasing a fix to the releaser is the one loop this repo cannot pay for. The source checkout is the only copy guaranteed to be the one just verified. Scoping the drift check to `main` is what keeps the pre-commit gate true: fired on `esq/<slug>` branches it would red every commit of every plugin change and be worked around within a week.
**Tradeoff:** Gained — the authoritative release path cannot be stale, and the guard and the script can never disagree about whether a release is needed, because there is one implementation of the question. Accepted — the release is available only from a `main` checkout of this repository, never from a Claude session in another project, and `audit.sh` stays red on `main` between a plugin landing and its release.
**Conséquences:** The release is deterministic shell, so it spends no judgment tokens and needs no model. Its only write to `~/.claude` is `claude plugin update esq@esquisse --scope user --yes`, which keeps `CLAUDE.md`'s never-modify rule intact by construction. Git tagging (`claude plugin tag`) stays out of scope on B-097's notes until the repository is published; a minor or major bump remains a hand edit the guard then accepts.
**Alternatives rejetées:** *A distributed `/esq:release` skill* — the natural home, rejected on the staleness loop above and on spending judgment on pure determinism. *Script plus git tags* — real value once the repo is published, but the repository carries zero tags, nobody consumes one, and the manifest agreement the tag would validate is checked directly here.

## D-scoped-verdict-not-scoped-measurement — The drift verdict is scoped to main; the drift measurement is not

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-07
**Statut:** Active

**Contexte:** The plan for the local release workflow said two things that cannot both be literally true: the drift check "exits 2 off `main`", and Phase 1's own verification requires `scripts/check-release-version.sh --json` to report `releaseNeeded false` at the phase's HEAD — which is an `esq/<slug>` branch. Phase 2 then needs `release-local.sh --check` to answer "is a release needed" from anywhere without ever being a gate.
**Décision:** The exit code is scoped, the measurement is not. Off `main` the script still computes `lastBumpCommit`, `changedFiles` and `releaseNeeded` and reports them through `--json`, but gives no verdict and exits 2; `audit.sh` check 51 renders that exit 2 as a yellow `– skipped:` line naming the branch, and raises a finding only when the delegate is missing or not executable.
**Raison:** The two questions are different. "Has `plugin/` moved past its bump" is a fact a git history answers identically on any branch, and a reporting mode that refuses to answer it is useless to `--check`. "Should this tree be red right now" is a policy, and on `esq/<slug>` the answer is no, because unreleased plugin work is the normal state of a feature branch. Separating them lets one implementation serve both callers without either lying.
**Tradeoff:** Gained — `--check` reports honestly from a feature branch, and the pre-commit gate stays true where plugin work actually happens. Accepted — check 51 is genuinely evaluated only on `main`, so its own wiring is exercised in ordinary development only by check 52's fault injection.
**Conséquences:** Any future consumer of `check-release-version.sh` must read the JSON for facts and the exit code for the verdict, and must not treat exit 2 as failure. `audit.sh` gains a third rendering beside pass and finding — a skip — which every later delegating check with a legitimately-inapplicable state should reuse rather than inventing a fourth.
**Alternatives rejetées:** *Exit 2 with no JSON off `main`* — the plan's literal reading; rejected because it makes Phase 1's own verification unsatisfiable and leaves `--check` unable to answer on a feature branch. *Fire the drift finding everywhere* — rejected on the reason the plan already gives: it reds `audit.sh` on every commit of every plugin branch and the gate gets worked around. *Treat check 51's exit 2 as a finding, like the other delegating checks* — rejected because exit 2 is its normal state off `main`, so the pre-commit gate would be permanently red for the opposite reason.

## D-the-release-commit-stands — Refuse before writing; once the release commit exists, it stands

**Scope:** infra
**Topic:** release
**Date:** 2026-09-07
**Statut:** Active — amended 2026-09-10 by [D-the-publisher-revalidates-nothing]: the hinge and both its rules are unchanged, and so is the ordering argument for `check-release-version.sh`; what fell is one clause of the sentence naming the pre-commit half. `scripts/check-plugin.sh` no longer runs there — the two-manifests-agree assertion does, beside a mechanical proof that the bump is the only thing in the tree.

**Contexte:** `scripts/release-local.sh` writes the two things nothing else in this repository writes: a commit here, and the maintainer's live laptop-wide plugin installation. Between those two writes sits a call — `claude plugin update` — that can fail, hang, or return 0 having landed something other than what was committed. A run that half-happened needs a defined shape.
**Décision:** Two rules with the commit as the hinge. Before it, every refusal is a no-op that leaves the tree exactly as it was found, manifests restored included. After it, nothing rewinds git: a failing or timed-out install, an unreadable `installed_plugins.json`, or a version, commit or byte mismatch each report failure, say the commit stands, and print the exact `claude plugin update esq@esquisse --scope user --yes` retry line. `scripts/check-release-version.sh` consequently runs *after* the commit; only `scripts/check-plugin.sh` and the two-manifests-agree assertion run before it.
**Raison:** Drift is what authorizes the release, so before the bump commit exists the version guard necessarily reports that drift and exits 1 — it can only be a proof once the commit it measures against exists. And a `git reset --hard` on a failed install would erase the one artifact the maintainer can act on, turning a half-release into a puzzle: the commit is cheap to keep and expensive to reconstruct, while the install is one idempotent command away.
**Tradeoff:** Gained — every outcome is recoverable by re-running one printed line, and no state is ever silently unwound. Accepted — a failed install leaves `main` carrying a release commit for a version that is not installed, which `--check` reports and the next `--patch` refuses as "nothing to release" until the install is retried.
**Conséquences:** Any later step added to this script must declare which side of the commit it is on, and anything added after it may only report and never repair. A future `--minor`/`--major` inherits both rules unchanged.
**Alternatives rejetées:** *Rewind the commit on install failure* — rejected above: it destroys the actionable artifact. *Run every validation before the commit* — the plan's literal task text; impossible for the drift check, which measures against a commit that does not yet exist. *Re-run `./scripts/audit.sh` inside the release* — rejected as re-buying work that already succeeded (CLAUDE.md's first cost question); the script states in its own output that it assumes a green audit.

## D-manifest-disagreement-is-refused-not-reconciled — A disagreement the release could paper over is refused instead

**Scope:** infra
**Topic:** release
**Date:** 2026-09-07
**Statut:** Active

**Contexte:** `release-local.sh --patch` computes the next version from `plugin.json` and writes both manifests, so a tree whose two manifests already disagree would be silently "fixed" by any release — the disagreement would vanish into a bump nobody reviewed.
**Décision:** A pre-existing disagreement is a fifth refusal, beyond the four the plan named (linked worktree, not `main`, dirty tree, nothing to release). It names both files and both versions and asks for a hand decision committed equal, then a re-run.
**Raison:** Which of two versions is right is judgment — one of them may have shipped, may be referenced, or may be the typo. The script's whole authority comes from being deterministic; silently resolving a question it cannot answer is exactly the kind of automation that inherits the written rule and none of the unwritten one.
**Tradeoff:** Gained — a state `audit.sh` check 51 already reds is never erased by the command meant to resolve it. Accepted — one more way for the release to refuse, on a state that should never occur.
**Conséquences:** The refusal set is now five, and any future mode (`--minor`, `--major`) must carry it too. `--check` reports the same disagreement without refusing, because reporting is never a gate.
**Alternatives rejetées:** *Bump both to the next patch of `plugin.json`'s version* — rejected: it picks a winner by file order, not by evidence. *Refuse only when the guard's `releaseNeeded` is null* — rejected as the same behavior expressed less legibly; the disagreement deserves its own sentence.

## D-a-guard-tests-the-working-tree — A fixture built from a clone must overlay the working tree

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-07
**Statut:** Active

**Contexte:** `scripts/test-release-local.sh` needs a real plugin tree to release, so each fixture is a throwaway `git clone` of this checkout. As first written it passed every case — and would have passed them just as happily with the working tree's `release-local.sh` deleted, because a clone carries HEAD and not the uncommitted edit in front of the contributor running it.
**Décision:** Each fixture copies the working tree's `release-local.sh`, `check-release-version.sh` and `check-plugin.sh` over the clone and commits the overlay before any case runs.
**Raison:** A guard that reports on the last commit rather than on the current edit is green precisely when it matters least — during the edit that breaks the rule. It also breaks the `audit-scripts` contract's central promise, since `./scripts/audit.sh` is run *before* committing: pre-commit, the clone is by definition one commit behind the change being gated.
**Tradeoff:** Gained — the three hand-injected faults (removing the branch refusal, replacing the byte comparison with `true`, rewinding on install failure) each red the suite, which without the overlay none of them would. Accepted — a fixture is one commit richer than a pristine clone, so any case asserting an exact commit count measures from its own base rather than from the clone's HEAD.
**Conséquences:** Any future guard that builds fixtures by cloning this repository inherits this rule; a fixture that must genuinely test HEAD has to say so in its own header, because the default reading of a passing guard is now "the working tree is sound".
**Alternatives rejetées:** *Build the fixture from scratch instead of cloning* — rejected because `check-plugin.sh` needs a genuine plugin (bin, lib, hooks, 20 skills) and the byte comparison needs genuine bytes; hand-assembling one would prove a mime. *Copy the whole `scripts/` directory* — rejected as wider than the rule needs; three named scripts is the dependency closure, and widening it silently would drag unrelated edits into the fixture.

## D-parallel-reads-sequential-git-mutations — Parallel reads, sequential git mutations, and a bounded consolidation of bookkeeping

**Scope:** arch
**Topic:** workflow-cost
**Date:** 2026-09-07
**Statut:** Active

**Contexte:** esq's own agents issue 1.068 tool calls per turn against 1.243 for the 446 non-esq agents measured on the same machine in the same window (2026-08-21, 621 transcripts) — ~634 round trips, 4.0 per run. B-044 names the same waste on the write side: one model turn per metadata git transaction, and command tails that write two or three bookkeeping commits over files a single command owns. The first draft of the plan closing them said a tail's git transactions could "go out together", which reads as concurrent tool calls over a shared index.
**Décision:** Two mechanisms, stated apart and never conflated. **Parallel tool calls** — several `tool_use` blocks in one assistant turn — are for read-only work with no shared mutable state. **Sequential commands inside one tool call** — chained with `&&` — are how ordered or shared-state work collapses a round trip. Git mutations (`add`, `commit`, `switch`, `rm`, `mv`, `merge`) belong only to the second and are never issued in parallel. Separately and independently: a command's own bookkeeping writes consolidate into one commit wherever that command owns every file involved in the same pass, while implementation commits remain one per task, atomic and independently revertible. The whole rule ships as one drift-guarded `shared:batch-independent` block carried by `build`, `check`, `review`, `fix`, `work` and `plan`.
**Raison:** `git add` and `git commit` contend for the index, `HEAD` and the working tree; run as parallel calls they can race the index lock or commit a tree the other call just restaged, so a round-trip optimization would have bought a corruption class. Chaining in one Bash call buys the identical round-trip saving with none of it. On the consolidation half, B-044's "do not optimize for fewer commits in isolation" forbids trading auditability for a metric — it does not forbid a command committing its own bookkeeping once; reverting a plan commit that also carries the backlog status flip it caused restores a consistent state rather than a torn one. A per-command instruction was rejected as unguarded and duplicative — worse than elsewhere, because a safety clause restated six times is a safety clause five of whose copies can be softened unnoticed — and a CLI verb was rejected as the wrong layer, since which calls are independent is judgment the CLI does not hold.
**Tradeoff:** Gained — the round-trip saving on both the read and the write side, one wording, and a hazard that is forbidden in terms rather than left to inference. Accepted — six byte-identical copies to keep in step, and coarser revert granularity on consolidated bookkeeping (reverting `/esq:check`'s tail drops the brief and the observations together).
**Conséquences:** The block is subordinate to `shared:read-once`: read-once decides whether a call happens, batching decides only which turn it lands in. Consolidation is bounded by lifecycle ownership — never across commands, never a file whose writer is a different command, never an implementation commit — and a consolidated subject that would have to name two unrelated concerns is the signal the writes were not one command's bookkeeping. The drift guard carries a fault-injection case for the no-parallel-git clause specifically, so the safety half cannot be softened in one carrier without failing the build. `/esq:work`'s "three writes, one commit each" invariant is amended to two in the same change that consolidates it, never left to contradict itself.
**Alternatives rejetées:** *Treat separate git transactions as independent calls and issue them together* — the first draft's wording; rejected as a shared-state race over the index, `HEAD` and the working tree. *A per-command instruction at each point of use* — brighter, but unguarded and duplicative, and it multiplies the places a safety clause can be lost. *An `esq` verb that performs a batched commit* — wrong layer, and it would solve only the smaller write half while leaving the read half untouched. *Keep every commit count fixed* — rejected because it protects avoidable bookkeeping commits with an argument that only applies to implementation commits.

## D-the-router-accepts-its-own-pending-drift — The update router requires green *but for* the finding it exists to clear

**Scope:** infra
**Topic:** release
**Date:** 2026-09-08
**Statut:** Superseded by D-update-publishes-converge-verifies

**Contexte:** `scripts/update.sh` runs `./scripts/audit.sh` only when `check-release-version.sh` says a release is needed, and check 51 *is* `check-release-version.sh` — its drift half fires on `main` exactly when a release is needed. The audit was therefore red by construction at the only line that ever reads its exit code, and the gate was `if ! ./scripts/audit.sh; then stop`. The router could never release: it waited for the finding it was running to clear (B-132). The state was reached the day plugin work merged to `main`, and the failure read to the maintainer as six unrelated audit problems, five of which were an unrelated transient hang of the `claude` CLI.

**Décision:** The releasable-tree question stays `audit.sh`'s, but the answer the router requires is *green but for the findings `check-release-version.sh` reported for this tree*. Both halves are asserted: the audit's own Summary count (`N finding(s) across M checks.`, the number `audit.sh` prints, never a count of `✗` glyphs — nested suites emit those too) must equal the number of findings the version guard emitted, and each of those findings must appear in the log matched as a **fixed string**. The expected text is never restated in the router: it is the sentence the owning script itself wrote to stderr during the same `--json` call that answered `releaseNeeded`, so one `git log -p` serves both questions and the two scripts cannot drift into disagreeing about which finding a pending release may carry. An audit that dies before printing a Summary matches nothing and refuses.

**Raison:** Deleting check 51 or exempting it inside `audit.sh` would have removed the signal that makes releases happen at all, and scoping it away from the router by *number* would break the moment the checks renumber. Matching by count alone would let any single unrelated finding through — the exact coincidence the third fault-injection case exists to forbid. Matching by text the router holds itself would restore the second implementation the router's whole design rejects.

**Tradeoff:** Gained — a router that can release, and one that still refuses a second finding, a differently-worded single finding and a summary-less audit failure. Accepted — the router now owns one judgement rather than none, so it needs a fault-injection suite of its own (`scripts/test-update-guard.sh`, check 54); and the coupling to `audit.sh`'s Summary wording is now load-bearing, which the guard pins by constructing that line.

**Conséquences:** On `main`, between a plugin merge and its release, `./scripts/audit.sh` exits 1 by construction — the one place `CLAUDE.md`'s before-every-commit rule reads as a pending release rather than a defect, and `./scripts/update.sh` is what clears it. Any future caller that wants "releasable" must ask for the same two-part answer rather than for exit 0.

**Alternatives rejetées:** *Run the audit before asking whether a release is needed* — the ordering does not help; the drift exists either way. *An `--expect-drift` flag on `audit.sh`* — an opt-out that silences the agreement half of check 51 too, exactly when a manifest stops carrying a version. *Release first and audit after* — inverts the gate: `release-local.sh` writes the maintainer's live installation, and a tree proven only afterwards has already shipped.

## D-name-the-teardown-primitive-from-a-probe — The teardown primitive is named by a probe, never by inference

**Scope:** arch
**Topic:** workflow-cost
**Date:** 2026-09-08
**Statut:** Active

**Contexte:** B-087's mechanism — that a stopped background task's harness registration outlives the process and delivers a late notification into it — is transcript inference, and its supporting probe was measured on Claude Code 2.1.239 while this machine runs 2.1.263. B-085's wait rule and B-087's teardown rule both have to name a primitive.

**Décision:** The collection-and-teardown rule may name only what a bounded, content-free probe found in a **worker's** tool set on the harness in use; the probe is retaken first and registered in `docs/EVIDENCE.md` as a dated, status-only claim.

**Raison:** The 2026-08-22 probe already disproved an assumption that looked safe — `TaskOutput` and `BashOutput` do not exist in a worker's tool set — so a rule written from the parent session's tool list would prescribe a call the worker cannot make. A claim is worth exactly the version it was measured on, and 2.1.239 is not the version anyone will run this on.

**Tradeoff:** Gained — a rule whose primitive is known to exist where it is invoked, and a dated row a later session can tell apart from a remembered answer. Accepted — one phase and a small billed probe before any behavior changes, and a rule that must be re-read when the probe next expires.

**Conséquences:** If the probe finds no task-cancellation primitive in a worker's set, the teardown clause is process-group ownership plus explicit confirmation, and B-087's resurrection half is mitigated rather than eliminated — which the rule and the row must say rather than imply a fix that is not there.

**Mesuré 2026-09-08, Claude Code 2.1.265 (`M-background-lifecycle-2026-09-08`, `docs/evidence/2026-09-08-background-lifecycle.jsonl`):** three billed headless rows, no retry, 263 s, $1.23. What Phase 4's rules may name, and what they may not:

- **Collection — `Monitor` or `TaskStop`, and nothing else.** Inside an `Agent`, only `TaskStop` and `Monitor` resolve; `TaskOutput`, `BashOutput` and `KillShell` do not. The 2026-08-22 reading holds on a newer harness, and the launch's own tool result names the collector, so "collect once, with the primitive the launch named" is writable as a rule. The finite task was collected in a single call.
- **Teardown — no primitive clears the registration.** A PID kill, a process-group kill and the managed primitive all left the harness registration in place; two of P-A's three launches were still live at the agent's last turn. **Gate A is raised.** Phase 4 does not start, and no rule may claim B-087's resurrection half is solved: a teardown reaches the *processes* and not the *registration*. The three options Gate A names go to the user, and this plan does not pick among them.
- **Elapsed — Gate B is cleared.** A field on the tool result and a bounded procedure are both available to an orchestrator around a synchronous `Agent` return; no harness-supplied value in the turn. Task 4.2 may name either. Prose parsing stays refused, as in every branch.
- **The still-busy branch is real.** A completion message reached an agent 13 258 ms into 73 711 ms of continuous work — B-085's explicitly unprobed branch, answered yes, so a wait rule cannot assume delivery waits for a quiet turn.

One question is absent from the capture and is not a gap in it: `deliveryAfterMs` measures how long after the result a late delivery arrived, and on P-B nothing arrived. The probe declares that dependency rather than counting the question as unanswered; with a delivery observed, the same missing key is still a named problem.

**Alternatives rejetées:** *A primitive-agnostic rule (properties only, no call named)* — leaves the worker improvising, which is the defect B-085 measures, and cannot distinguish the PID stop from the managed stop that B-087 turns on. *Prescribe from the 2.1.239 record* — refused by the evidence rule this repo already enforces; the version moved.

## D-a-declared-field-never-forces-a-privacy-exemption — Rename the field, never exempt the key

**Scope:** arch
**Topic:** evidence
**Date:** 2026-09-08
**Statut:** Active

**Contexte:** `background-evidence` needed a field holding per-tool call counts, and the obvious name was `tools`. But `tools` is the ambient tool list a `system/init` event carries, and the privacy walk in `tests/capture-schema/` refuses that key at every depth, in every record — so the checked-in capture reds the moment it is added.

**Décision:** A declared capture field whose name collides with a sensitive key is **renamed**; the walk's key set is never given an exemption to accommodate it. The field is `toolCalls`.

**Raison:** The walk's value is that it is total — every key, at every depth, refused by name and not by position. One exemption keyed on "this record type, this field" converts a rule anyone can verify into a list of special cases, and the next leak is the one that arrives under an exempted name. A rename costs one identifier and leaves the guard exactly as strong as it was.

**Tradeoff:** Gained — a sensitive-key rule that stays total and needs no reading of the schema to trust. Accepted — a field whose name is chosen against a guard rather than for its own clarity, which is why the reason is written beside it in `capture-schema.mjs`.

**Conséquences:** Any later widening of a capture — Phase 2's harvest included — picks a name outside the sensitive set rather than arguing for an exemption. If a collision is ever genuinely unavoidable, that is a decision to reopen here, not a patch to make in the walk.

**Alternatives rejetées:** *Exempt `tools` where the schema declares it* — the exemption has to be keyed on record type and field path, so it is a second implementation of the schema inside the guard, and it silences the key for the one record that would carry a real leak. *Drop the field* — the tool counts are the structural cross-check on the row's self-report; without them a verdict rests on the model's own line alone.

## D-a-conditional-answer-key-is-declared — A key that measures a delay is owed only when there was one

**Scope:** arch
**Topic:** evidence
**Date:** 2026-09-08
**Statut:** Active

**Contexte:** `scripts/probe-background-lifecycle.mjs` reports a row that left declared questions unanswered as a named problem, so a run that billed and returned an incomplete reading can never pass as green. The live 2026-09-08 reading then answered `deliveryAfterConclusion=no` — nothing arrived after the child's result — which left `deliveryAfterMs` with nothing to measure and the whole reading permanently red, on a capture nobody can re-buy.

**Décision:** A key that measures *how long after* something happened is **owed only when the boolean it hangs off came back true**, and the dependency is declared in the probe (`ANSWER_DEPENDS`) rather than inferred from a naming convention.

**Raison:** A question that cannot have an answer is not one the run failed to answer, and reporting it as missing makes a complete reading read as incomplete forever. The declaration is what keeps this from being a loosened judge: with the guard true the same missing key is still a named problem, a key whose guard is itself unanswered is not owed either (that guard is already the reported problem), and the test asserts both directions.

**Tradeoff:** Gained — a registered capture that replays clean and a judge that still refuses a genuinely incomplete row. Accepted — one more thing a new question key must declare, and a dependency that is wrong if written wrong, which is why it is a named predicate with a test rather than a pattern match on the key's name.

**Conséquences:** Any question added to this probe states whether it is unconditional or names its guard. The same shape is what a later probe should reach for rather than dropping a key from the owed list to make a run go green.

**Alternatives rejetées:** *Accept any missing key* — that is the loosened judge, and it would have let a row that answered nothing at all pass. *Answer `0` when nothing arrived* — a zero-millisecond delay is a measurement, and this run took none; publishing one would be a fabricated reading in a registered capture. *Leave the capture red and note it* — a registered measurement whose own replay reds is one every later reader has to be told to ignore.

## D-an-unreadable-teardown-is-absent-never-clean — "Could not look" is not "nothing survived"

**Scope:** arch
**Topic:** evidence
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** The journey harvest learned to record which processes a run left alive in its own scratch root, read straight from `/proc`. A platform without `/proc` can answer nothing, and the obvious encoding of "found nothing" and "could not look" is the same empty list.
**Décision:** `survivingProcesses` is an empty list only when the scan actually ran; where it could not, the key is absent from the record entirely.
**Raison:** The judge this field exists for passes a run whose teardown left nothing behind. Encoding an unreadable platform as `[]` would hand that judge a pass it never earned, and it would do so silently, on the one machine where the evidence is weakest. Absent is the only value a judge can be made to refuse.
**Tradeoff:** Gained a field whose empty value is a real observation; accepted that every consumer must distinguish absent from empty rather than reading one boolean.
**Conséquences:** A journey judge that reads `survivingProcesses` must red on absent rather than pass it, and the same rule governs any later lifecycle fact read from a platform-specific source.
**Alternatives rejetées:** `[]` for both — the silent false pass above. A separate `survivorsReadable` boolean — a second field for what absence already says, and one more thing a judge can forget to read.

## D-the-shared-seed-grows-only-by-addition — Add a file to the seed, never change what the others read

**Scope:** arch
**Topic:** evidence
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** The background-lifecycle journey needs a verification that never finishes. An overlay may only add files under `docs/`, so the script has to live on the shared seed — the same toy project three already-billed journeys are judged against.
**Décision:** `slow-check.mjs` is added beside `check.mjs`, and the seed's `CLAUDE.md` — which names `check.mjs` as the project's verification — is left untouched; a journey that needs the slow check names it in its own overlay plan.
**Raison:** A new file no existing prompt mentions changes nothing about what the three active journeys do, and the free `--parse` replay of their checked-in capture is the proof. A line in `CLAUDE.md` would change the instructions every future run reads, which is a re-derivation of three billed captures bought for a convenience.
**Tradeoff:** Gained three journeys that judge exactly what they judged before, at zero cost; accepted that the journey needing the slow check must name it explicitly rather than inheriting it from the project's conventions.
**Conséquences:** Any later addition to `tests/smoke/fixtures/seed/` is held to the same rule — a file, never an instruction — and a journey wanting new behavior states it in its own plan overlay.
**Alternatives rejetées:** Naming `slow-check.mjs` in the seed's `CLAUDE.md` — changes what every journey reads. A second seed for this journey alone — the seed-drift risk the overlay mechanism exists to prevent.

## D-a-background-launch-counts-wherever-it-was-asked — Count the launch, not the conversation it came from

**Scope:** arch
**Topic:** evidence
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `readStream` already counts `spawns`, and counts them only in the main conversation — a subagent's own spawn is not the orchestrator's. The new `backgroundLaunches` counter sits in the same loop, and the parallel invites the same rule.
**Décision:** A `run_in_background: true` tool call is counted wherever it was issued, main conversation or under a spawn.
**Raison:** The contract being measured is a *phase's* — and a phase runs as a worker. Restricting the count the way `spawns` is restricted would read zero on precisely the run the whole plan exists to observe.
**Tradeoff:** Gained a count that answers the question actually being asked; accepted that two counters in one loop follow visibly different rules, which is a comment's worth of explanation at the call site.
**Conséquences:** A judge reading `backgroundLaunches` cannot infer where the launch came from, and must not try; if that ever matters, it is a second field with its own reason, not a narrowing of this one.
**Alternatives rejetées:** Counting main-conversation launches only, for symmetry with `spawns` — symmetry with a rule that answers a different question. Splitting into `{ main, worker }` — a shape bought for no consumer, against a schema this repo keeps as narrow as its judges.

## D-a-journey-is-a-candidate-before-it-is-a-row — A journey is a candidate before it is a row

**Scope:** arch
**Topic:** runtime-evals
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `ROWS` in `scripts/smoke-journeys.mjs` and the fixtures under `tests/journeys/fixtures/` are a bijection (`D-the-registry-and-its-fixtures-are-a-bijection`), and `--only` refuses a branch outside the registry. Authoring a new journey therefore had no legal first move: registering it reds the free path over a capture nobody could have bought yet, and buying the capture needed it registered.
**Décision:** A new journey is registered as a **candidate** — a full row, resolved by `rowFor`, accepted by `--only`, judged by `--parse --only`, and absent from `branches` — until one live run promotes it into `ROWS` or parks it under `PARKED`.
**Raison:** The deadlock is real and recurs on every journey anyone adds, so the fix belongs in the harness rather than in a contributor's judgment about which invariant to break first. Keeping the candidate out of `branches` is what preserves the invariant: no replay of the aggregate reports a table shorter than the registry, and no fixture is expected for a run that has not happened.
**Tradeoff:** Gained a legal path from a written judge to a bought capture, with every existing guard intact; accepted a third state in a script whose whole point is that the registry is exact, and one more list a reader has to hold.
**Conséquences:** The candidate list is empty at rest — a journey passes through it rather than living in it — so `tests/smoke/runner.test.mjs` holds the runner to the behavior rather than relying on a candidate being present to exercise it.
**Alternatives rejetées:** Registering the journey and accepting one red commit until the run lands — that is exactly the failure `D-the-registry-and-its-fixtures-are-a-bijection` was written for, and it makes the audit's verdict meaningless for the length of a phase. Running the journey through a one-off script outside the harness — the capture would then be produced by a path nothing tests, which is the opposite of what a runtime eval is for.

## D-the-journey-aggregate-is-re-bought-never-appended — The journey aggregate is re-bought, never appended

**Scope:** arch
**Topic:** runtime-evals
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Promoting a green candidate looked like appending its `--only` capture to `tests/journeys/fixtures/capture.jsonl`. That file is the capture `docs/EVIDENCE.md` pins to one Claude Code version through `M-journeys-2026-08-30`, and the registry guard reds a capture recording two — which it did, taking `esq validate` and check 29's sandbox install down with it.
**Décision:** A journey enters `ROWS` only on a whole-registry run with no `--out` that completes every row and re-judges green; the aggregate is never assembled by hand out of per-journey captures.
**Raison:** A claim is worth exactly the version it was measured on, and the aggregate carries a version claim on behalf of a registry row. `resolveDestination` already said the same thing from the write side — the aggregate is earned, never aimed at — so this decision records one rule two guards were independently enforcing, rather than inventing a third.
**Tradeoff:** Gained an aggregate whose version claim is true by construction; accepted that adding one journey costs a re-buy of every row (five runs, ~$3.75 at 2026-09-09 prices) rather than one.
**Conséquences:** A phase that promotes a journey budgets the whole registry, and states that bound before it spends. A candidate's own billed capture is kept beside its judge in the meantime, single-version and cited by no registry row, so the reading is never lost while it waits.
**Alternatives rejetées:** Teaching the evidence guard that a capture may span versions — that loosens the one rule the registry exists to enforce, to fit a defect. Citing the newest version in the registry row — the row would then claim a reading for a version three of its five rows were never taken on.

## D-a-conformance-scenario-cites-both-readings — A conformance scenario cites both its readings when the rule postdates the behavior

**Scope:** arch
**Topic:** conformance
**Date:** 2026-09-09

**Statut:** Active

**Contexte:** Phase 3 bought both journeys green *before* the collection rule was written, and Phase 4 bought them green again after. The obvious move was to let the post-change capture supersede the pre-change one in U-08 and U-09's runtime-evidence lines, since only the post-change run exercises the shipped text.
**Décision:** Each scenario's runtime-evidence line names both captures, with what each was measured against, and keeps the pre-change one as evidence rather than history.
**Raison:** A single green reading taken after a rule ships is indistinguishable from a rule that fixed something, and these rules fixed nothing — `/esq:build` already declined to log over a red verification and already bounded its own wait. The pair is the only honest way to say what the change is: a written contract pinning behavior that already held, so a future regression has a named scenario to red against.
**Tradeoff:** Gained an evidence line that cannot be misread as a repair claim, and a second green per judge inside the free suite; accepted two captures per candidate where one would replay, and a longer line for a reader to parse.
**Conséquences:** A phase that pins existing behavior budgets a reading on each side of the change and keeps both. Where a rule genuinely repairs something, the pre-change capture is red and the pairing carries even more — but the rule is the same either way, so nobody has to decide retroactively which kind of change they made.
**Alternatives rejetées:** Citing only the post-change capture — shorter, and it silently upgrades a contract into a fix. Citing only the pre-change one — it is evidence about a build that no longer exists, and check 39 would be replaying a judge against text the skill no longer carries. Skipping the pre-change run in the first place — that was never available: without it, nothing distinguishes a journey that pins behavior from one that would have redded all along.

## D-kill-the-group-then-read-survivors — A billed run's deadline kills the process group, then reads the survivors

**Scope:** arch
**Topic:** evidence-harness
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `scripts/lib/journey-runner.mjs` resolved `runOne` from the child's `close` event alone, so a timeout's SIGKILL landed on `claude` while the wait continued until every inherited pipe closed — pipes the killed process's own surviving children still hold (B-135).
**Décision:** Spawn the billed child `detached`, kill its whole process group on the deadline, resolve under a second bounded grace if `close` still does not fire, and take the unfiltered `survivingProcesses` reading after that — the honesty comes from when it is read, never from excluding a pid.
**Raison:** The thing that holds a headless run open is the tree, not the pid, so a bound on the pid is not a bound at all. Killing the group closes the inherited pipes, which makes `close` prompt and makes the survivor reading mean something precise: whatever is still sitting in the scratch root escaped the runner's own teardown. The grace exists because a process in uninterruptible sleep answers no signal, and a harness that assumes otherwise is back to an unbounded wait.
**Tradeoff:** Gained a deadline that is bounded twice over and a survivor list that stays whole — a child the teardown failed to kill is published rather than filtered; accepted process-group semantics in a shared harness three billed scripts spawn through, and the interrupt handling `detached` makes the runner owe — Ctrl-C no longer reaches the child through the terminal's foreground group.
**Conséquences:** Any future spawn in this harness inherits the same contract: it owns its group's teardown, and any reading taken about processes it started is taken after the reap, never during it. A timed-out row's survivor list is what outlived the kill, not a teardown verdict — `timedOut` is the verdict there.
**Alternatives rejetées:** Resolving at the timer as `scripts/probe-background-lifecycle.mjs` does — it makes the deadline real and every timeout a false leak, since the still-dying `claude` has its own cwd in the scratch root, and it leaves the grandchildren running. Excluding the run's own child pid from the reading — it removes A's false leak and hides the real one, since after a grace expiry that pid *is* the failed teardown. Polling `survivingProcesses` until it settles while keeping the single-pid kill — it never runs, because `runOne` has not resolved, and it confuses "unchanged for a second" with "teardown finished".

## D-converge-means-one-itinerary — Invoking /esq:converge always means check → fix → review → fix

**Scope:** prod
**Topic:** assurance-lane
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** A plan whose `## Assurance` block resolved to `conformity` landed after `check → fix`, and a `/esq:review` run minutes later found a user-visible omission the landing gate had already passed. The lane had been allowed to change what a command *means*.
**Décision:** `esq lane` returns the constant itinerary `['check','fix','review','fix']` and `subagents: 4` for every lane; `lane`, `route` and the two axes survive as metadata, with `route` recommending the cheaper standalone `/esq:check` or `/esq:review`.
**Raison:** A user invoking `/esq:converge` is buying a stable meaning, not a lane-dependent one, and the failure mode is asymmetric — a lane that over-buys shows up on the bill, while one that silently skips a finder shows up as a defect in production. Putting the constant in the lane table is what stops the CLI from publishing an itinerary no consumer obeys.
**Tradeoff:** Gained: one meaning for one command, and a landing gate that cannot be shortened by a plan's own self-assessment. Accepted: a lean plan's converge costs four subagents instead of two, and `lane stats`' finder budget becomes a single threshold rather than a per-lane one.
**Conséquences:** `/esq:build` and `/esq:autopilot` keep naming the lane's `route` on the last phase's `→ Next` as the cheap attended path; scenario R-05 pins the fixed itinerary; and any `reopened` figure recorded before this change was read under a per-lane budget.
**Alternatives rejetées:** Leaving `LANE_TABLE` alone and rewriting only converge's prose — the CLI would keep publishing a two-step itinerary that nothing obeys, which is exactly the drift shape check 5 exists to catch. Deleting the lanes entirely — it throws away the routing that is genuinely useful.

## D-the-cli-decides-a-corrective-branch — Branch reuse is a merge-base question, not a prose rule

**Scope:** arch
**Topic:** branch-ownership
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `/esq:plan`'s corrective rule was "copy the stem plan's `**Branch:**` and `**Origin:**` verbatim". After a stem branch had merged, that put the next corrective plan onto an already-landed branch, and the user had to `git switch -c`, cherry-pick and hand-edit a header to recover.
**Décision:** A read-only `esq branch resolve <slug>` answers `reuse` or `new` from git's own merge-base and hands back the two header fields, and corrective stems canonicalize recursively so `<stem>-fixes-2-fixes` and `<stem>-fixes-fixes` own the same branch as `<stem>`.
**Raison:** Whether a branch has landed into its origin is structure, which is what `plugin-runtime` says the CLI may own; asking a planning session to reason about merge-base in prose is judgment in the wrong place, and `plugin/skills/plan/SKILL.md` sits at 499 of its 500 permitted lines (B-131), so the prose budget for it does not exist either.
**Tradeoff:** Gained: the normal corrective lifecycle needs no git surgery from the user, and pre-landing siblings still share one shipping unit. Accepted: a new public CLI verb and JSON shape to keep documented and tested.
**Conséquences:** `/esq:plan`'s corrective bullet routes off the verb rather than restating the rule; check 42 gains the verb as a carrier; and the recursion is scoped to branch ownership only — `briefSlug` and `lane stats` grouping remain B-103 and B-127.
**Alternatives rejetées:** Teaching `/esq:plan` to run `git merge-base --is-ancestor` itself — it spends prose the file cannot afford and puts the same decision in a second place. Always cutting a new branch for a corrective plan — it breaks the pre-landing sibling case and splits one shipping unit in two.

## D-update-publishes-converge-verifies — update.sh publishes; the landing gate verifies

**Scope:** infra
**Topic:** release
**Date:** 2026-09-09
**Statut:** Superseded by [D-update-publishes-land-verifies] on 2026-09-10 — `update.sh` still publishes and never audits; the verifier it defers to is now `/esq:land`, not `/esq:converge`.

**Contexte:** `./scripts/update.sh` re-ran `./scripts/audit.sh` immediately after a clean `/esq:converge` had run it: four internal `claude` validator calls hit their 60-second bounds and the redundant attempt burned about seven silent minutes to re-confirm what had just been proven.
**Décision:** `update.sh` is a publisher — on a clean `main` it exits 0 through the read-only `release-local.sh --check` path when nothing is pending, or calls `./scripts/release-local.sh --patch` when something is, and it never invokes `audit.sh`. No audit cache, attestation file, telemetry or new artifact is added.
**Raison:** Paid work done twice is the costly failure class (CLAUDE.md cost question 1), and the verification already has an owner: `/esq:converge`'s landing gate runs the full audit before the branch lands, while `release-local.sh` keeps its own narrow `check-plugin.sh` validation and its installed version/commit/byte proof. *(That narrow validation is what [D-the-publisher-revalidates-nothing] removed on 2026-09-10 — this entry stopped one layer short of the defect it names.)* A cache or attestation would buy back the same signal at the price of a new artifact to trust.
**Tradeoff:** Gained: the habitual update costs seconds, and each question keeps exactly one owner. Accepted: a maintainer who releases from a `main` that never went through a converge gets no audit before publishing — the audit is one command away and the release is laptop-local and reversible.
**Conséquences:** The B-132 deadlock ceases to exist, because the router no longer waits on a finding it was running to clear; check 54's subject becomes "`audit.sh` is never invoked, and both routes still resolve"; and `check-release-version.sh`'s findings name `./scripts/update.sh` as their resolution, since it is now the sole public laptop-update command.
**Alternatives rejetées:** Caching the audit result or writing an attestation the router reads — a new artifact whose freshness is a second thing to get wrong, and explicitly excluded. Keeping the audit and narrowing it — it re-buys the expensive `claude` validator calls, which are the cost being removed.

## D-the-publisher-revalidates-nothing — The publisher validates nothing; it proves nothing moved

**Scope:** infra
**Topic:** release
**Date:** 2026-09-10
**Statut:** Active

**Contexte:** [D-update-publishes-converge-verifies] removed `./scripts/audit.sh` from `update.sh` because four nested `claude` validator calls sat until their 60-second bounds inside the publisher. One layer down, `release-local.sh --patch` still called `scripts/check-plugin.sh plugin`, which is two more `claude plugin validate --strict` processes — and they behaved identically: both hit their bounds inside the publisher, while the exact same commands, and `scripts/check-plugin.sh plugin` itself, returned instantly when run directly a moment later. A successful release cost three `claude` invocations, two of them re-proving what the landing gate had already proven.
**Décision:** `release-local.sh --patch` does not validate the plugin. `scripts/check-plugin.sh` and the official `claude plugin validate` stay exactly where they were — `audit.sh` check 26, run by `/esq:converge`'s landing gate before the branch lands — and nothing about pre-merge validation is weakened. A successful release now invokes `claude` exactly once: `claude plugin update esq@esquisse --scope user --yes`. In the validation's place, before the release commit, the script proves mechanically that (1) the tree was clean when the run started, (2) both manifests parse, (3) both read the computed next patch, and (4) `git status --porcelain --untracked-files=all` reads as exactly the two modified manifests, each differing from its committed copy on one line whose only difference is that version field. Any of the four failing restores both manifests and refuses before a commit exists. No retry, no longer bound, no bypass flag and no second public update command is added.
**Raison:** On a clean `main` checkout the publisher changes two version fields and nothing else, and a deterministic two-field edit cannot stale a CLI, a hook, a skill or a plugin manifest that was validated minutes earlier — so the question the validator was answering was already answered, and the question that actually remained was *did anything else change*, which is cheap, local and exact. Paid work done twice is the costly failure class (CLAUDE.md cost question 1), and the same answer here is stronger than the validator's: `check-plugin.sh` would pass on a tree that had also grown a stray file, while the proof will not.
**Tradeoff:** Gained — a release is one `claude` call, it cannot hang on a nested validator, and the tree it commits is proven rather than assumed. Accepted — a maintainer who releases from a `main` that never went through a converge gets no plugin validation at release time; the audit is one command away, `check-release-version.sh` reds `main` until the release is cut, and the release is laptop-local and reversible.
**Conséquences:** Anything later added to the pre-commit half must be deterministic and local, never a subprocess that can hang; check 53 now asserts the one-`claude`-call rule from the stub log *and* statically over the script, so a validation restored "just to be safe" reds the build on a route no fixture happens to exercise; and a future `--minor`/`--major` inherits the proof unchanged, since it too changes exactly two version fields.
**Alternatives rejetées:** *Raise the 60 s validator bound, or retry it* — treats a symptom, keeps the redundant work, and makes the release slower in the case where it does succeed. *Narrow `check-plugin.sh` to the manifests* — still spawns a nested `claude`, still re-buys a landing-gate proof, and adds a second definition of what "the plugin is valid" means. *A bypass flag* — the release path would then have two behaviors and the untested one would be the one used in a hurry. *Validate after the commit instead* — a validation whose failure cannot un-commit is a report, and the entry above already settles that nothing past the commit may repair.

## D-freshness-is-proved-from-the-tree — Gate 4 reuses a result only when git proves it fresh

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-09
**Statut:** Superseded by [D-land-reuses-proved-verification] on 2026-09-10 — the reuse condition is unchanged and now serves `/esq:land`'s verification step rather than converge's gate 4; the one amendment is that the plan-section comparison leaves out the `**Reviewed at:**` header field, and `--no-renames` makes a rename report the path it left.

**Contexte:** In a measured ESQ run: Phase 3 ran `pnpm test` green on the final implementation tree in ~9m30, no implementation or fix commit followed, and `/esq:converge`'s gate 4 re-ran the identical command for another ~9 minutes before landing — while also replaying identical commands named by several phases, repeated frontend builds among them.
**Décision:** Gate 4 stops replaying the plan's `(auto)` list and routes off `esq gate verify <plan>`, which extracts one command per machine-readable `(auto)` step — the single inline-code span after the `(auto)` marker and before the em dash — groups occurrences by exact string, evaluates them newest phase first so one fresh green occurrence settles a command once, and returns that occurrence's phase and **complete step text** alongside the command so the orchestrator can re-judge a rerun against the real PASS criterion. `reuse` requires that occurrence's entry to carry a `verified` block whose `at` is a full immutable commit id git can resolve, whose PASS list contains the command, and whose `git diff --name-only <at> HEAD` touches only paths landing gates 2, 3 and 5 already re-read. Everything else is `run`, including any `HEAD` movement by an apply or fix worker; a step the extractor cannot resolve comes back as a shaped unresolved entry carrying its phase and raw step, never as a dropped command.
**Raison:** Re-proving a fact already in hand is question 1 of CLAUDE.md's cost pass, and the gate is not too expensive because verification is expensive. But a landing gate is a correctness surface, so the reuse condition has to be mechanical rather than persuasive: the tree decides, not the commit message, because a message-classified "workflow-only" commit is prose and prose is what must not be trusted here. Every ambiguity — absent provenance, malformed provenance, an unresolvable commit, a non-green record, an unreadable git — resolves to running the command.
**Tradeoff:** Gained: a landing that does not re-buy a proven pass, with the duplicate-command replay removed as a side effect. Accepted: `/esq:build` must record the provenance, so a plan built before this lands re-runs everything — which is exactly today's behavior — and the workflow-ledger path list becomes a small piece of judgement that must never grow to include a path carrying implementation.
**Conséquences:** The execution-log entry gains one optional `verified` key and no new file is created — no audit cache, attestation or measurement artifact. What that key records is the phase's **PASS judgement**, not a raw exit code, because this repo deliberately accepts expected non-zero results such as a `grep` proving no matches; a red step therefore never enters provenance, and a reused red cannot exist. `/esq:fix` and applied decisions are caught twice over — by the paths they touch, and by the `HEAD` movement converge records around every apply and fix worker. `/esq:plan` authors future `(auto)` steps as one command in one span after the marker so the extractor is a lookup rather than an inference, and any step it cannot resolve falls back to running through the complete-step path. Resolved commands proven identical are deduplicated; unresolved occurrences never are, because their identity cannot be proved. A rerun that is slow follows the same collect-once lifecycle `/esq:build` states, extracted as the shared block `shared:collect-once`.
**Alternatives rejetées:** Taking the first inline-code span on the line — that span is the `(auto)` marker itself, so the extractor would return `(auto)` for every step. A `.esq-verify.json` cache beside the plan — precise, but a new artifact whose staleness is a second thing to get wrong, and excluded outright. Classifying commits by message prefix — cheaper to implement and exactly the prose-trusting shortcut the requirement forbids. A permissive extractor picking the first plausible command out of an ambiguous step — it would reuse a proof of a different command, which is worse than running it. Deleting gate 4 — it is the only pass this run's fix commits ever get.

## D-the-finder-budget-follows-the-itinerary — The reopen budget is one threshold, and it rescores history

**Scope:** arch
**Topic:** assurance
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Fixing `/esq:converge`'s itinerary at check → fix → review → fix on every lane moves `finderBudget`, which counts the finders in that itinerary. The budget is what `esq lane stats` scores a *reopen* against, so the change reaches a measurement taken over plans that ran under the old routing — one conformity plan in the test corpus stopped counting as a reopen the moment the constant landed.
**Décision:** The budget keeps being computed from the itinerary, so it is two for every plan and every past plan is rescored under it, rather than being frozen per-plan at the lane that plan recorded.
**Raison:** The column answers "did this plan need a pass beyond what its loop bought", and after this change every loop buys the same two — a plan that produced two briefs was inside its loop whenever it ran, because `/esq:converge` would buy it two today. Freezing the old budgets would make the column mean two different things depending on a plan's date, with nothing in the table saying which, and the whole point of `lane stats` is that the numbers are comparable down the column.
**Tradeoff:** Gained: one threshold, comparable across every row and every date, and a budget that still moves with the itinerary rather than being a literal typed twice. Accepted: reopen rates measured before 2026-09-09 are not comparable with the ones printed after it, and the lean lanes look better in hindsight than they were.
**Conséquences:** `lane stats`' reopened column no longer distinguishes lanes at all on the budget side — it is one number, and a lane that only *looks* cheap now shows up in the post-pass-defects column or nowhere. `D-converge-step-numbers-are-full-positions` keeps its first half (steps 1–4 are fixed positions) and loses its second: no lean lane runs a subset any more, and the only run that starts at step 3 is one entered from an existing brief.
**Alternatives rejetées:** Freezing each plan's budget at its recorded lane — historically faithful, and it makes one column mean two things with no marker saying where the boundary is. Writing the budget as the literal `2` — the same number today, and it stops tracking the itinerary the moment anyone changes it, which is exactly the drift the constant was extracted to prevent. Resetting the corpus so only post-change plans are scored — it throws away the only evidence the lane scheme was ever measured against.

## D-auto-steps-are-read-from-the-verification-list — An `(auto)` step comes from the verification list, not from the phase

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** The extractor that recovers a command from an `(auto)` step needs a set of steps to run over. The obvious source — every bullet in the phase section — was tried first and immediately produced a "command" out of this plan's own Task 2.1 bullet, which quotes `` `(auto)` `` while *describing* the extraction rule.
**Décision:** Steps are collected from each phase's `- **Verification:**` list only; a phase carrying no such list falls back to its own bullets.
**Raison:** A landing gate executes what this returns. A phase section is prose plus tasks plus verification, and prose about `(auto)` is exactly the text a plan gains when someone plans work *on* the gate — so a phase-wide sweep gets worse precisely on the plans that touch this machinery. The verification list is where `/esq:plan`'s template puts the steps, so scoping to it costs nothing on a plan written to the template.
**Tradeoff:** Gained: a task bullet can quote the marker freely and is never handed to a gate as a command. Accepted: a plan that puts its `(auto)` steps somewhere other than a verification list relies on the fallback, which is the old permissive behavior.
**Conséquences:** The fallback runs rather than skips, which keeps a pre-template plan verified at full price instead of quietly under-verified — the same direction every other ambiguity in this gate resolves. A plan that renames its verification bullet loses the scoping and lands on the fallback, not on silence.
**Alternatives rejetées:** Sweeping the whole phase section — measurably wrong on the first real plan it met. Requiring a marker in the plan file — a migration for every existing plan, to buy what the template already encodes. Filtering task bullets by prefix (`Task N.M:`) — a heuristic over free prose, which is what this gate must not trust.

## D-a-shared-block-holds-only-carrier-neutral-clauses — A shared paragraph stops where the carriers diverge

**Scope:** arch
**Topic:** shared-blocks
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `/esq:build`'s collect-once paragraph is five clauses, and `/esq:converge` needed it once its landing gate could re-run a slow command. Two of the five name what the carrier does *after* the wait — build confirms its processes gone before the execution-log entry is appended, wording scenario U-09 pins verbatim; converge has no log entry and calls `esq merge land` instead.
**Décision:** `shared:collect-once` holds the opener and the three carrier-neutral clauses — one collection, a bounded wait, the primitives a worker can actually resolve — and each carrier states its own teardown deadline immediately after the closing marker, in its own terms.
**Raison:** This is the registry's own rule (`check-sharedblocks.sh`: only text identical in every carrier *by design* goes inside the markers) applied rather than bent. The alternative was to neutralize build's clause into something both could say, which would have rewritten a sentence a conformance needle pins and left converge claiming it writes a log entry.
**Tradeoff:** Gained: one wait discipline, provably identical across both commands, with no carrier forced to lie about what it does next. Accepted: the teardown clause is now stated twice, in two wordings, and can drift — bounded by both being fault-injected through their own scenarios (U-09 for build, R-09 for converge).
**Conséquences:** A third carrier of `shared:collect-once` inherits the three clauses and owes its own teardown sentence. The opener no longer counts the clauses that follow it, because the count differs per carrier.
**Alternatives rejetées:** Sharing all five verbatim — converge would carry "before the execution-log entry is appended", which it never does. Rewording build's clause to a neutral form — it breaks a needle pinned by a measured scenario to buy tidiness. Giving converge its own unshared copy of the whole paragraph — the exact duplication the registry exists to prevent, and the wait clause is where two runs polling differently costs 3h27m.

## D-a-conformance-scenario-id-is-permanent — A scenario id is a citation key, not a slot

**Scope:** arch
**Topic:** conformance
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** This plan specified its new landing-gate scenario as `R-07`. `R-07` (worktree merge refuses a collision) and `R-08` (converge lands only through gates it did not lower) already existed, each with needles in `check-conformance.sh`, fault injections in `test-conformance-guard.sh` and references in prose.
**Décision:** The new scenario landed as `R-09`, the next free id, with exactly the content the plan specified. The existing scenarios keep their numbers.
**Raison:** A scenario id is cited the same way a `B-NNN` or a `D-` slug is — by a check, a guard, a plan and a log entry — so renumbering to honor a plan's guess is a rename across four files that buys nothing and silently invalidates every prior citation. A plan naming an id is naming intent, not reserving a slot.
**Tradeoff:** Gained: every existing citation stays true, and the divergence is one line in an execution log. Accepted: this plan's prose says `R-07` where the tree says `R-09`, which a reader of the plan has to reconcile.
**Conséquences:** `check-conformance.sh`'s summary hardcodes the scenario count, so adding one is always two edits — the needles and that line. A future plan asking for a taken id gets the same answer.
**Alternatives rejetées:** Renumbering the existing `R-07`/`R-08` to free the slot — a four-file rename that breaks citations to satisfy a number. Adding the scenario as `R-07b` — a shape no other id in the registry has, invented to preserve a guess. Refusing the phase over an id collision — the phase's work is the contract, not its label.

## D-corrective-branch-resolved-never-copied — A corrective plan's branch is resolved from the stem's refs, never copied

**Scope:** arch
**Topic:** plans
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `/esq:plan` filled a corrective plan's `**Branch:**` and `**Origin:**` by copying its stem plan's two fields verbatim. That is right only while the stem's shipping unit is still in flight; once the stem had landed, the copy put the correction onto an already-merged branch and the maintainer repaired it by hand with a `git switch -c`, a cherry-pick and a header edit.
**Décision:** The two fields are computed by the read-only `esq branch resolve <slug>` verb from the stem plan's own recorded refs and git's ancestry — `reuse` only where the stem's branch exists and is provably not yet an ancestor of its origin, `new` otherwise — and every question the verb cannot answer resolves to `new` with its reason named rather than to a refusal.
**Raison:** The failure was not the copy but the missing question: nothing asked whether the unit being joined was still open. Making `reuse` require a positive proof (`merged === false`, never a falsy test) means a deleted branch, an unreadable plan, a legacy stem or a detached HEAD can never be mistaken for in-flight. And `new` is the cheap side of the asymmetry: cutting a fresh branch loses a shared name, where a wrong `reuse` writes commits somewhere they cannot land.
**Tradeoff:** Gained: the maintainer never repairs a corrective plan's branch by hand, and a chain of corrections of any depth stays one shipping unit. Accepted: the verb decides on ancestry, which is not identity — a stem landed by cherry-pick still reads as in flight, the same imprecision `esq branch check` carries for its wording, and here it decides a `mode`.
**Conséquences:** `/esq:plan` states the rule and the CLI owns the judgment-free part of it, so a future change to what "landed" means is one function, not a paragraph in two skill trees. R-06 pins the post-landing case, and check 42 fails the build if the plan template stops naming the verb or the subcommand disappears from the README or either usage string.
**Alternatives rejetées:** Keeping the copy and letting `/esq:build`'s `mismatch` verdict hand the user a `git switch` — that is the hand repair, relocated, and it fires after the plan file is already written. Refusing to write the plan when the stem has landed — an authority stop over a question the tree can answer, which is the cost this repo already refuses to pay. Always cutting a new branch for a correction — it works, and it loses the in-flight case where a correction genuinely belongs to the unit it corrects.


## D-the-router-publishes-never-verifies — The update router publishes; it does not verify

**Scope:** arch
**Topic:** release
**Date:** 2026-09-09
**Statut:** Superseded by [D-update-publishes-land-verifies] on 2026-09-10 — the router still holds no judgement and runs no audit; the tree is verified by `/esq:land` before the branch lands, which is the one clause this entry assigned to converge.

**Contexte:** `./scripts/update.sh` ran `./scripts/audit.sh` before every release, and then had to decide which findings a pending release was allowed to carry — because `audit.sh` check 51 *is* `check-release-version.sh`, whose drift half fires on `main` exactly when a release is needed. Demanding exit 0 made the router structurally unable to ever release: it waited for the finding it was running to clear (B-132). The acceptance rule that unblocked it left a router owning one judgement, and a ~7-minute redundant audit immediately after a clean converge had already run one.
**Décision:** The audit call is removed from `update.sh`; it is a publisher and a router, with four preconditions, one `check-release-version.sh --json` call and two routes, and no judgement of its own.
**Raison:** Question 1 of the cost pass: a tree is verified by `/esq:converge`'s landing gate before the branch lands, so auditing again at release time re-proves a fact the workflow already holds. Removing the call removes the deadlock and the judgement together — a router that asks each question of the script that owns it cannot drift from those scripts, and cannot drift from a rule it no longer has. Check 51 still reds `main` between a plugin merge and its release; it now surfaces in the audit where it belongs, naming `./scripts/update.sh` as its resolution.
**Tradeoff:** Gained — a release costs seconds rather than minutes, the B-132 deadlock ceases to exist, and the router holds no rule that can rot. Accepted — nothing re-checks the tree at release time, so a defect landed on `main` outside a converge ships until the next audit finds it.
**Conséquences:** Check 54's subject moved with it: the guard now stubs `audit.sh` so any invocation is recorded and every route asserts none was, plus one static case for a route the fixtures do not have. Any future "just to be safe" audit call reds the build rather than costing minutes silently.
**Alternatives rejetées:** Keeping the audit and keeping the acceptance rule — it works, and it is a judgement in a router plus a coupling to `audit.sh`'s Summary wording, paid on every release. Keeping the audit but demanding exit 0 — that is the deadlock. Caching the audit result beside the plan — a new artifact whose staleness is a second thing to get wrong, and the user excluded it outright.

## D-a-handoff-is-single-and-checked — One public command, and a check that keeps it that way

**Scope:** arch
**Topic:** release
**Date:** 2026-09-09
**Statut:** Superseded by D-a-cue-is-read-in-its-block

**Contexte:** With the audit gone from `update.sh`, `release-local.sh --patch` is a primitive: it refuses on a feature branch, a dirty tree, a secondary checkout and an unmoved `plugin/`, and "nothing to release" is exit 1 there. Handing a reader that command hands them four refusals to interpret — and the release path was already documented two ways at once, with `check-release-version.sh`'s own findings sending whoever stood in front of the red gate to the primitive.
**Décision:** The primitive may be **described** anywhere and **prescribed** nowhere; `scripts/check-update-handoff.sh` (check 55) reads the public handoff surfaces in one awk pass and reports any line naming `release-local.sh --patch` that also carries an imperative cue, with two declared exceptions — the README Operations reference rows and the ARCHITECTURE paragraph documenting the relationship.
**Raison:** A rule corrected twice becomes a check that fails the build; restating it in prose is not a fix, and this one had already been restated in three files. The cue is matched anywhere on the line rather than before the command, because a line that both names the primitive and tells someone to run something is the shape being policed — precision comes from the two declared exceptions, not from the cue's position. `runs` and `ran` are deliberately not cues: third-person description of what `update.sh` does is exactly what the rule permits.
**Tradeoff:** Gained — a handoff written into any skill, `CLAUDE.md`, `README.md`, `docs/ARCHITECTURE.md` or a finding string reds the build with its path and line. Accepted — a line-by-line scan misses an instruction whose cue wraps onto the previous line, and the ARCHITECTURE exception is matched by two words rather than by the paragraph, so it is broader than the bullet it was written for (both filed as backlog rows).
**Conséquences:** The check takes an optional `<repo-root>` second argument, defaulting to its own repository, purely so its guard can inject faults into a throwaway copy of the four root surfaces rather than only into the corpus. Its guard (check 56) fixtures **both** directions — the baseline root carries both declared exceptions written as prescriptively as they legitimately read — because a check that flagged every mention of the primitive would red the two places whose job is documenting it, and be worked around within a week.
**Alternatives rejetées:** A two-line cue window to catch wrapped instructions — every finding then depends on where a paragraph happens to wrap, and a check that reds on a reflow gets worked around. Flagging every line that names the primitive at all — it reds the reference rows and the architecture paragraph, which is the overreach direction the guard exists to refuse. Deleting the primitive's documentation instead of exempting it — the release path's contract has to live somewhere.

## D-check-55-runs-once-on-the-native-corpus — A fleet check with singular inputs runs once, not once per corpus

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Checks 16, 35 and 40 run once per corpus — `plugin/skills` and `commands/esq` — each finding prefixed with the tree that failed, because a defect present only in the shipped tree reddens nothing (B-062). Check 55 reads a corpus too, but its other four inputs are repo-root files that exist exactly once.
**Décision:** Check 55 runs once, against `plugin/skills`, the tree a user installs.
**Raison:** Check 27 holds the legacy mirror byte-equal, so a corpus defect in `commands/esq` cannot exist without also existing in `plugin/skills`, where this check reads it. A second pass would add nothing about the corpus and would report every `CLAUDE.md`, `README.md` and `docs/ARCHITECTURE.md` finding twice — a duplicated finding trains a reader to skim the audit, which is the failure mode a gate can least afford.
**Tradeoff:** Gained — one pass, no duplicate findings, and the native tree is the one read. Accepted — the coverage argument now leans on check 27 rather than standing alone, so removing parity would silently narrow this check.
**Conséquences:** The dependency is written in the script's header and in check 55's comment, so whoever retires parity meets it. Any future fleet check whose inputs mix a corpus with singular repo-root files should follow the same rule rather than the once-per-corpus shape.
**Alternatives rejetées:** Running once per corpus like checks 16/35/40 — it double-reports the four singular surfaces for no corpus coverage that parity does not already give. Splitting into two checks, one for the corpus and one for the root files — two numbers, two guards and two headers for one rule.

## D-exempt-only-the-primitives-own-row — The README ops-row exception exempts one row, and its reason describes that row

**Scope:** arch
**Topic:** release
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Check 55 exempted any README table line whose first cell was a `./scripts/…` command, justified by "a row states what a command is, it does not hand anyone a procedure" — a sentence that does not describe the row it was written for, which carries `(maintainer; run after ./scripts/audit.sh is green; B-097)`. The gap was found by `/esq:review` on `restore-converge-and-clean-handoffs` (B-142).
**Décision:** The exemption is narrowed to the table line whose first cell is the primitive's own command, and its stated reason is rewritten to describe that line: the Operations table is this repository's index of every script, primitives included, and the only imperative the row carries names a *different* command as a precondition.
**Raison:** The finding was that the exemption was wider than the reason that justified it, so the fix is to make them the same width rather than to write a better sentence around the wide version. Every other Operations row loses a blanket cover it never needed, and the one row that documents the rule stops quoting the imperative it polices.
**Tradeoff:** Gained — an exemption one row wide, and a reason that survives being read back. Accepted — the README row describing check 55 had to be reworded to say `prescribes` rather than quote `run`, and any future row that legitimately needs to name the primitive must do so without an imperative cue.
**Conséquences:** A new Operations row may name the primitive freely and is exempt from nothing; the guard asserts both directions, so the narrowing cannot silently widen again. `scripts/release-local.sh` joins the scanned surfaces in the same unit, which means the file that *is* the primitive must describe itself without prescribing itself.
**Alternatives rejetées:** Attributing an imperative cue to the command it governs — more general, but it makes every finding depend on word order inside a table cell, the same fragility check 55's header already rejected when it refused a two-line window. Deleting the exception and rewording every row — check 55 would then red the index of scripts and the paragraph documenting the primitive, which is the shape the guard's overreach direction exists to prevent.

## D-an-exception-anchors-on-its-line — A declared exception anchors on the line it exempts, not on tokens that happen to be unique

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Check 55's second declared exception matched any `docs/ARCHITECTURE.md` line carrying both `primitive` and `update.sh`, while its stated reason claimed to describe "the one place the relationship is written down". Two lines qualified, and the second one had just become the paragraph most likely to gain a prescription.
**Décision:** `archprose()` anchors on the release-path bullet's own opening literal — `^- **The release path` — the same shape `opsrow()` uses for exception 1.
**Raison:** An accidentally-unique conjunction is what produced B-139: nothing reports the day a third line acquires all the tokens, so the exemption widens silently and its declared reason quietly stops being true. An anchored literal identifies a line, which makes the reason checkable against it, and a reword of that line reds the build rather than widening the exemption.
**Tradeoff:** Gained a failure direction that is always closed and always reported; accepted that a deliberate retitle of that bullet is a two-file edit.
**Conséquences:** Both of check 55's exceptions now read the same way, and any future exception in this suite is expected to name a line rather than a class. The audit-inventory paragraph is reworded to describe the rule without quoting the command form, so it is scanned rather than exempt.
**Alternatives rejetées:** A larger semantic conjunction (`primitive` + `update.sh` + `claude plugin update`) survives a retitle but reproduces the original defect with a longer fuse. Leaving both lines exempt keeps the reason false and the blind spot live.

## D-a-delegate-that-cannot-run-is-a-finding — A guard that could not run is a finding, never a skip

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `scripts/check-update-handoff.sh` exiting 2 was rendered by `audit.sh` as a yellow `– skipped:` line that did not increment `findings`, so the `Summary` still printed `Clean`. It happened for real: an apostrophe inside a single-quoted awk program closed the quote, and check 55 was switched off with the gate green (B-144).
**Décision:** Check 55 adopts the `-ne 1 → finding` shape the other nine delegates already use, and a new class-wide check holds every `audit.sh` delegate call site to it, with check 51's off-`main` exit 2 the single declared opt-out carrying its reason.
**Raison:** "Nothing to check" and "everything is clean" must not print the same conclusion — the exit-code contract already says so for the check scripts, and the audit's own rendering is where that contract was being lost. The defect is invisible by construction, since a guard that stopped running prints green, so only a structural assertion can catch it; and structure costs the same for eleven call sites as for one.
**Tradeoff:** Gained a gate that cannot be silently switched off, and coverage of every delegate rather than the one that broke; accepted a check that proves the wiring rather than the exit code — `finding()` increments `findings` and the `Summary` exits 1 on `findings > 0`, so the wiring is the whole of the claim.
**Conséquences:** A legitimate skip must now be declared with a reason in the new check's opt-out list, which is the same opt-out-not-enrolment shape the long-run check uses. New delegate call sites are covered the day they land.
**Alternatives rejetées:** Proving the rendering behaviorally by stubbing the delegate and running `./scripts/audit.sh` re-runs fifty-odd unrelated checks — including node suites and a sandbox plugin install — to observe one, which is the paid-work-done-twice this repo extracts checks to avoid. Fixing only check 55's branch leaves the next delegate free to be written the same way.

## D-a-cue-is-read-in-its-block — A cue is read in its block, not on its line

**Scope:** arch
**Topic:** release
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Check 55 matched an imperative cue on the same line as `release-local.sh --patch` and nowhere else. That misses an instruction whose cue wrapped onto the previous line, and it lets a plain Markdown reflow move a cue onto the command's line and red the build for no change in meaning — B-140, filed by the phase that wrote the rule and accepted in D-a-handoff-is-single-and-checked's own tradeoff.
**Décision:** A line naming the primitive is judged against the Markdown block it sits in, where a block ends at a blank line, a heading, a fence delimiter, a list-item start and a table row; the finding is still reported at the line naming the command.
**Raison:** The two-line window was rejected because the verdict then depends on where a paragraph happens to wrap. A block does not have that property — it is precisely the unit a rewrap moves text *within* — so this answers the objection rather than ignoring it. It also keeps both declared exceptions anchored on exactly the lines they anchor on today, because a table row and a list bullet are each their own block.
**Tradeoff:** Gained a verdict invariant under rewrapping in both directions, and the wrapped-cue blind spot closed; accepted that a long paragraph naming the primitive and later telling the reader to run something else now reds, which is a line to reword and the direction this guard fails in.
**Conséquences:** The `KNOWN LIMIT` paragraph in the check's header is replaced by the block rule and why a block is not a window. The previously-carried risk that rewording `docs/ARCHITECTURE.md:37` must avoid introducing a line break disappears — after this the break cannot change the answer.
**Alternatives rejetées:** The two-line window, for the reason above. Leaving the line-only rule and accepting B-140, which is what produced a guard whose stated coverage was wider than its behavior.

## D-a-landed-stem-is-recognized-by-content — A stem that landed by cherry-pick is not still in flight

**Scope:** arch
**Topic:** workflow
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `esq branch resolve` decided `reuse` from `merge-base --is-ancestor` alone, so a stem whose commits reached `main` by cherry-pick or rebase still read as in flight and handed a correction the branch that had already landed — B-138, and the exact failure (B-102) the verb was added to remove.
**Décision:** Ancestry is asked first and unchanged; only when it says no does the verb ask `git cherry <into> <ref>`, and every commit having an upstream equivalent is read as landed by content.
**Raison:** This is git's own patch-id comparison rather than a heuristic, so the answer stays deterministic and costs one extra subprocess only on the branch that today answers wrongly. Matching commit subjects proves nothing, and comparing trees answers a different question — whether the branch adds nothing *now*, which is also true of an empty branch that never landed.
**Tradeoff:** Gained the cherry-pick and rebase shapes, without loosening the in-flight answer that a branch with one unlanded commit still gets; accepted that a squash-merge produces one commit patch-equivalent to none of the originals and still reads as in flight.
**Conséquences:** `owners[].merged` on the `esq branch check` verdict widens from a boolean to a three-state answer, so an owner that landed by content reads as landed. The squash limit is recorded in `mergedInto`'s own comment, where the next reader meets it.
**Alternatives rejetées:** Subject matching and tree comparison, above. Leaving the verb ancestry-only and repairing the branch by hand afterwards, which is the manual repair B-102 already paid for once.

## D-a-shipping-unit-is-its-branch — A shipping unit is every plan recording the same Branch

**Scope:** arch
**Topic:** workflow
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** A defect belongs to a shipping unit, not to a plan file: `restore-converge-and-clean-handoffs`, its `-fixes` and its `-fixes-fixes` are three plan files and one thing being shipped. Any gate that reasons about "this unit" needs a join key that recursion cannot break.
**Décision:** The unit is every plan in `docs/plans` recording the same `**Branch:**` as the plan in hand.
**Raison:** The header field is declared rather than inferred, it is already what `esq branch check` reads to decide ownership, and it is the field `esq merge land` takes the source ref from — so the unit key and the landing key are the same fact. A slug-shape rule would work only while corrective names keep their current suffix grammar, which is the class of accidental-uniqueness rule B-139 exists to warn about.
**Tradeoff:** Gained a key that survives any depth of correction and needs no new field; accepted that a plan recording no `**Branch:**` belongs to no unit and is gated by nothing, which matches how ownership already treats it.
**Conséquences:** `esq branch check` gains a `unit` block naming those plans, and every gate that asks "what has this unit left open" asks it there. Two worktrees recording the same branch name see only their own copy, exactly as ownership already does.
**Alternatives rejetées:** Joining on the stem slug via `stripCorrective` — it already exists, but it makes the unit a naming convention rather than a declared field. Joining on the epic, which groups plans that ship separately.

## D-a-same-unit-defect-is-never-a-backlog-row — A defect against the unit you are shipping is not backlog

**Scope:** arch
**Topic:** workflow
**Date:** 2026-09-09
**Statut:** Active — amended 2026-09-11 by [D-evidence-settles-backlog-dispositions]: the gate itself stands; what changed is who may close a row and how an observation is classified — commands close rows their own verified evidence settles, and a genuinely outside-unit observation is filed `observed:` at filing time instead of blocking the phase and being dropped and re-filed by hand.

**Contexte:** `/esq:build` classified a backlog candidate as "out-of-scope things you noticed while building this phase", testing only whether the phase did the work and never whether the row's own `Source` named a `build:` or `fix:` step of the unit being shipped. `/esq:autopilot` reads no entry body, `/esq:converge`'s preflight and landing gates never open `docs/BACKLOG.md`, and both finders pathspec-exclude it — so a row was a write-only sink. This unit filed six against its own code, and the only one that came back was rediscovered by a paid review agent as the 🟡 that stopped the landing, which is what produced a three-deep corrective chain.
**Décision:** A 🐛/⚠️ row whose `Source` names a `build:` or `fix:` step of the active shipping unit blocks that unit's next `completed` execution-log entry and `/esq:converge`'s first spawn, until its `Status` reads `Done` or `Dropped`. An ordinary omission is corrected inside the phase and files nothing; a substantive one pauses the phase, naming the row.
**Raison:** The rows already carry every cell the rule needs — `Type`, `Source`, `Status` — and the plan header carries the unit key, so nothing is added to the ledger and nothing parses prose. The release condition is the existing closed status vocabulary: `Done` for fixed, `Dropped` with its reason for deliberately accepted, both written by `/esq:backlog`, so the disposition stays a human's. B-137 falls out as non-blocking by type and B-141 by source verb, with no exemption list to maintain.
**Tradeoff:** Gained a defect that cannot be parked while its phase reports done, and a refusal that costs one subprocess at preflight instead of four subagents and a rediscovery; accepted that a phase now pauses where it used to complete, which is a change to a rule `docs/SPEC.md` documents, and that a defect nobody writes down is still invisible.
**Conséquences:** `esq plan append-log` refuses a `completed` entry against a live row, leaving the plan byte-identical; the paused entry gains a second clause, so the execution-log heading is classified by its `⏸` glyph rather than by the manual-verification wording that six commands and `plugin/lib/markdown.mjs` matched literally. *Out of scope* now means outside the unit, not outside the phase.
**Alternatives rejetées:** Gating on the log entry's `backlogCandidates` prose — the field is free text by contract, so the check would be a parser guessing at sentences and would drift with wording. Teaching the finders to read the backlog — it pays a subagent to rediscover what the ledger already says, which is the cost this decision exists to remove.

## D-a-cued-block-reds-every-naming-line-in-it — A cued block reds every naming line inside it

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Check 55 now judges the imperative cue over the Markdown block a naming line sits in rather than over that line alone (B-140). A block can hold more than one line naming `release-local.sh --patch`, and the rule had to say what happens then. It surfaced immediately: the guard's `scripts/release-local.sh` fixture jammed its header, its usage string and its two `--check` banner lines into one block with no blank lines, so one injected cue red all four and case 4's exactly-one-finding assertion failed.
**Décision:** Every naming line in a cued block is reported, and the fixture gains the blank lines the real script has, rather than the check reporting only one line per block.
**Raison:** A block is the author's own unit of prose, so a cue anywhere in it applies to everything the block says — reporting only the first naming line would leave the other three unfixed while calling the file clean. The failing assertion was the fixture being unfaithful to the surface it stands in for, not the rule overreaching: the real `scripts/release-local.sh` separates those four regions with blank lines, and the check is clean against it.
**Tradeoff:** Gained a report that names every line a maintainer has to edit, and a fixture that can no longer pass a shape the real file does not have; accepted that one cue in a densely packed block produces several findings, which reads as noisier than it is.
**Conséquences:** Any future fixture for this check must carry the real surface's blank lines, because block structure is now part of what is being fixtured. Prose that packs several mentions of the primitive into one paragraph with a cue will red on all of them at once.
**Alternatives rejetées:** Reporting only the first naming line per cued block — it under-reports the work a fix needs and makes the finding count depend on line order. Suppressing the extra findings by de-duplicating per block — same defect, dressed as economy. Leaving the fixture as it was and exempting it — a fixture that passes on a shape the real file cannot have proves nothing.

## D-a-delegate-exit-must-reach-finding — A delegate exit is judged by where it lands, not how it is spelled

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Check 57 had to decide what an `audit.sh` delegate rc chain must look like. B-144's defect was `-eq 2 → warn "– skipped:"` — a delegate that could not run rendered as yellow above a green `Clean`. But three live delegates (checks 24, 25's plugin half and 26) use a two-branch chain with no explicit non-0/non-1 clause at all: `if -eq 0 then ok; else <findings loop>`.
**Décision:** The rule is that every exit other than 0 or 1 must **reach** `finding`, by whatever route, so the two-branch shape passes and only `warn`, `ok` or no handler at all is a finding.
**Raison:** Those three chains do red the build on an exit 2: `audit.sh` captures each delegate with `2>&1`, so the refusal message the delegate writes to stderr becomes a finding line through the same loop. Requiring the explicit `-ne 1` clause instead would have reddened three delegates carrying no defect, and a guard that reds correct code is worked around within a week — the failure mode check 55's own two declared exceptions exist to avoid.
**Tradeoff:** Gained a check that fires on the defect and on nothing else, so it can stay wired in unconditionally; accepted that `audit.sh` now carries two legitimate spellings of the same contract, and that the two-branch one relies on `2>&1` being present at the capture site — which nothing here verifies.
**Conséquences:** A future delegate may be written either way. Anyone dropping `2>&1` from a two-branch capture silently removes that chain's only route from exit 2 to a finding, and check 57 will not see it — that is the known edge of this rule, and the explicit `-ne 1` clause is the shape to prefer for anything new.
**Alternatives rejetées:** Requiring the explicit `-ne 1 → finding` clause on every delegate — reds three correct chains, which is how a guard gets disabled. Requiring it only for delegates documented as exiting 2 — an enrolment list, and coverage in this repo is opt-out and never enrolment. Widening the check to verify `2>&1` at each capture site as well — a second, differently-shaped assertion inside a check whose whole value is that it reads one thing exactly.

## D-an-unreadable-guard-branch-is-a-finding — A guard branch nobody can read is a finding, not a silence

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** Check 57 classifies each delegate rc clause by the exit codes its condition takes. A condition it cannot parse — an unfamiliar operator, a compound test, an `elif` that does not mention the variable — had to be routed somewhere, and the cheap option was to skip it.
**Décision:** An unclassifiable clause is reported as a finding, and its chain is exempted from the end-of-group "routes nothing at all" assertion only — the check cannot know what an unread clause covers, so it must not also accuse the chain of covering nothing.
**Raison:** B-144 was invisible for exactly as long as it lived because the audit's own dispatch table had a branch that said nothing. A check that goes quiet on a branch it cannot read commits that defect a second time, one level up, and it is the more dangerous spelling because it looks like coverage. The cost of the strict direction is bounded: no such clause exists in `audit.sh` today, so the finding fires only when someone writes one.
**Tradeoff:** Gained a check that can never pass by not understanding its input; accepted that a legitimate but unusual rc condition reds the build until the check is taught to read it, which is a real edit someone will have to make.
**Conséquences:** Adding a new condition form to an `audit.sh` rc chain means extending `check-delegate-rc.sh`'s classifier in the same commit. `test-delegate-rc-guard.sh` case 1 — the live `audit.sh` clean — is what makes that failure immediate rather than discovered later.
**Alternatives rejetées:** Skipping the clause and checking the rest of the chain — the silent lie B-144 already taught this repo to distrust. Skipping it and counting the group as unchecked, then exiting 2 if any group is unchecked — turns one readable finding into a whole-check refusal, and "nothing to check" would then depend on one line of shell somewhere in 1900. Assuming an unparsed clause routes everything, so the chain passes — agreement with itself, which is the shape `D-a-documented-protocol-is-run-not-read` was filed against.

## D-a-cherry-picked-stem-has-landed — A stem whose commits reached its origin by patch has landed

**Scope:** arch
**Topic:** branch-ownership
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `mergedInto` asked `git merge-base --is-ancestor` and nothing else, so "has this shipping unit landed?" was answered by ancestry alone. A stem whose commits reached its origin by cherry-pick or rebase is no ancestor of it, so it read as in flight, and `esq branch resolve` told the next correction to reuse a branch nobody would merge again (B-138).
**Décision:** Ancestry is asked first and unchanged; only when it says no is patch equivalence asked, through `git cherry <into> <ref>` — every commit having an upstream equivalent is the third answer `'equivalent'`, and `merged` becomes three-state rather than boolean everywhere it is consumer-visible, including `esq branch check`'s `owners[].merged`.
**Raison:** The question the verb is really asking is whether the work is on the destination, and content is what makes that true — ancestry is one way of achieving it, not the definition. Widening the answer rather than collapsing `'equivalent'` into `true` keeps the two routes distinguishable in the reason the user reads, and keeping `true` for ancestry leaves every existing consumer and assertion reading what it already read.
**Tradeoff:** Gained the correct routing for the cherry-pick and rebase shapes, at the cost of a second git call on exactly the branches ancestry rejects, and of a consumer-visible field that is no longer a boolean.
**Conséquences:** Anything testing `merged` for truthiness must read `'equivalent'` as landed. A squash-merged stem is patch-equivalent to no individual commit of the branch and still reads `false` — B-138 is narrowed, not closed, and the residue fails in the safe direction because a wrongly-`new` answer costs a branch name where a wrongly-`reuse` one costs the commits.
**Alternatives rejetées:** Returning `true` for patch equivalence as well — cheapest, but the reason the user reads could no longer say how the stem landed, which is the half of the message that makes the answer checkable. Comparing trees or diffing the branch against its origin — reimplements `git cherry` less well and answers nothing it does not. Reading the reflog or the merge history for a squash — needs a message convention nobody enforces, and a guard that depends on a convention is not a guard.

## D-a-defect-against-the-unit-is-not-a-row — A defect against this unit is not a backlog candidate

**Scope:** arch
**Topic:** build-lifecycle
**Date:** 2026-09-09
**Statut:** Superseded by `D-a-same-unit-defect-is-never-a-backlog-row`

**Superseded because:** it duplicates that entry, written in the same session without reading it first, and it stated the rule on the criterion that did *not* ship — the failing file's path — where the gate joins on the row's `Source` cell and never opens the file the defect is in. The surviving entry states it correctly; this one is kept as a citation key and corrected below rather than left contradicting it.

**Contexte:** `/esq:build` defined a backlog candidate as something noticed while building this phase and deliberately not done, and the only test applied was *did I do it in this phase* — never *did this unit's own build or fix steps file it*. The row that resulted was a write-only sink: `/esq:autopilot` reads no entry body, `/esq:converge`'s preflight never opened `docs/BACKLOG.md`, and both finders pathspec-exclude it from their diff. The `restore-converge-and-clean-handoffs` unit filed six rows against its own changed files and landed none of them; two came back only because a paid finder rediscovered them, and each rediscovery cost a whole corrective plan.
**Décision:** A 🐛 or ⚠️ in code the active shipping unit wrote is not a backlog candidate: an ordinary omission is corrected inside the phase in the task's own commit, a substantive one pauses the phase with `blockedBy` naming the rows. The gate that enforces it joins on the row's `Source` cell, not on the failing file, so it refuses a `completed` entry against **any** undisposed 🐛/⚠️ this unit's `build:`/`fix:` steps filed, wherever the failure lives.
**Raison:** The gate belongs at the moment the claim is made, because `completed` *is* the claim that the phase left nothing behind. Putting it in the CLI rather than in prose is what makes it survive a run that did not read the rule, and refusing before the plan file is read keeps the target byte-identical after every refusal, exactly as the schema refusals already do.
**Tradeoff:** Gained a unit that cannot land with its own known bugs open, and a rediscovery loop that no longer costs a corrective plan; accepted that a phase can now be stopped by a row the user has to dispose of first, which is a real interruption and by design.
**Conséquences:** A phase that finds a same-unit defect either fixes it or pauses. Closing the row is still the user's, through `/esq:backlog` — the only writer of a `Status` cell — so no command closes a defect on their behalf. Because the join is the `Source` cell, a 🐛/⚠️ the phase files about code *outside* the unit blocks it too — conservative by design, wider than the rule reads and never narrower. The gate is only as honest as the filing: a defect a phase never writes down is still invisible, and this closes the parking of a known defect, not the not-noticing of one.
**Alternatives rejetées:** Gating on the execution log's `backlogCandidates` prose — the field is free prose by contract, so the gate would be a parser guessing at sentences, unfalsifiable and drifting with wording. Leaving it to the finders — that is the loop being replaced, and it costs a paid subagent per rediscovery with no guarantee the defect falls inside the delta range (B-144 did not, and never came back). A convention in prose alone — this repo's own rule is that a correction made twice becomes a check that fails the build.

## D-the-unit-is-keyed-on-branch — The shipping unit is every plan recording the same Branch

**Scope:** arch
**Topic:** build-lifecycle
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** The gate above needs to know which plans are one unit and which backlog rows belong to it. Recursive corrective plans (`<stem>`, `<stem>-fixes`, `<stem>-fixes-fixes`) are one shipping unit and legitimately share a branch, so a slug or a filename join would split them into three.
**Décision:** The unit key is `**Branch:**` — the same header field `esq branch check` already reads to decide ownership — and `unit.open` is computed from three `docs/BACKLOG.md` table cells: `Type` is 🐛 or ⚠️, `Source` names `build:` or `fix:` on one of the unit's slugs, `Status` is neither `Done` nor `Dropped`.
**Raison:** Nothing has to be added to the ledger. The disposition vocabulary that releases the gate already exists and is already written by `/esq:backlog`, and the two exclusions this needs fall out of the cells rather than out of a list: a 💡 idea is non-blocking by type, and a row a finder filed (`check:`, `review:`) by source verb. An exemption list would have to be maintained, and would be wrong the first time nobody updated it.
**Tradeoff:** Gained a unit identity that costs one header field and no new artifact; accepted that the CLI now reads the backlog on a write path that never touched it before, and that a row whose `Source` cell is hand-written into a shape no verb matches is invisible to the gate.
**Conséquences:** A plan recording no `**Branch:**` belongs to no unit and is blocked by nothing, as is a repository with no `docs/BACKLOG.md`. `/esq:converge` reads the same block at preflight and refuses before its first spawn, so the answer is computed once, in the CLI, and relayed rather than re-derived.
**Alternatives rejetées:** Joining on the plan slug — splits a corrective chain into separate units, which is the exact opposite of what makes them one. Joining on the epic — not every plan has one, and an epic is wider than a branch. A per-unit manifest file — a new artifact for a fact two existing fields already carry.

## D-a-pause-must-name-its-cause — A paused entry carries manualOutstanding, blockedBy, or both

**Scope:** arch
**Topic:** build-lifecycle
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** A pause had exactly one cause, so `manualOutstanding` could be `required` on a paused entry and that requirement was itself the guarantee that the entry said why it paused. Adding the blocked-on-a-defect cause meant relaxing it to optional.
**Décision:** `blockedBy` joins the payload schema as a paused-only key, `manualOutstanding` relaxes to optional, and `validateLogEntry` gains a conjunctive rule: a paused payload must carry at least one of the two.
**Raison:** Relaxing the requirement without the rule would have let a paused entry name no cause at all — a `⏸` heading a later run has no way to resolve, which is worse than either cause. The conjunctive rule restores exactly the guarantee `required` was providing, without pinning it to one of the two keys.
**Tradeoff:** Gained a schema that can express both causes and refuses a hollow pause; accepted one rule that is not expressible as a per-key requirement and therefore sits beside the schema loop rather than inside it.
**Conséquences:** A third pause cause adds a key and joins the same disjunction. The heading picks `blocked on an open same-unit defect` whenever `blockedBy` is present, because the defect is what has to be disposed of first; the manual steps are still rendered below it when both are given.
**Alternatives rejetées:** A separate `blocked` status beside `completed` and `paused` — every consumer routes on two statuses today, and a third would have to be taught everywhere for a state that is a pause in every respect that matters. Making `blockedBy` required on paused — inverts the problem and breaks every existing manual pause. Leaving `manualOutstanding` required and overloading it with the row text — a field named for steps a human observes, carrying something no human can observe.

## D-a-pause-is-classified-by-its-glyph — A pause is classified by ⏸, never by the clause after it

**Scope:** arch
**Topic:** build-lifecycle
**Date:** 2026-09-09
**Statut:** Active

**Contexte:** `plugin/lib/markdown.mjs` matched the heading `⏸ awaiting manual verification` as a single literal, and six commands' prose told their readers to look for that same sentence. A second pause cause would have added a second literal to every one of those places.
**Décision:** The parser matches the `⏸` glyph and treats whatever follows as prose; every command's prose says to classify on the glyph and never on the clause.
**Raison:** The clause is the reason for the pause and belongs to the entry; the glyph is the state and belongs to the grammar. Separating them meant the second cause needed no consumer change at all, and a rule naming one clause is a rule that silently lets the other through as unclassified — which is the failure mode `/esq:autopilot` is most exposed to, since it stops on a pause and would otherwise have read a blocked phase as merely unlogged.
**Tradeoff:** Gained a pause grammar that extends without touching a parser or six skills; accepted that the heading's clause is no longer machine-checkable, so a typo in it is prose drift rather than a parse error.
**Conséquences:** A third pause cause is a heading clause and a payload key, nothing more. Anything that needs to know *which* pause reads the entry's fields (`**Blocked by:**`, `**Manual verification outstanding:**`), not its heading.
**Alternatives rejetées:** Widening the literal to an alternation of both sentences — works once, and puts the cost back on every later cause. Encoding the cause as a machine token in the heading (`⏸[blocked]`) — makes the log entry less readable to the human it is written for, to solve a problem no consumer has.

## D-plugin-management-runs-bare — Non-interactive plugin management runs `claude --bare`

**Scope:** infra
**Topic:** release
**Date:** 2026-09-10
**Statut:** Active

**Contexte:** `scripts/release-local.sh --patch` cut release 0.3.4 and then hung: `claude plugin update esq@esquisse --scope user --yes` sat through the whole 180 s bound before printing "Checking for updates", the bound fired, and the run ended exactly as [D-the-release-commit-stands] requires — commit made, install not done, retry line printed, installed plugin still 0.3.3. The identical command with one flag added, `claude --bare --debug-file /tmp/esq-plugin-update.debug plugin update esq@esquisse --scope user --yes`, completed in 0.52 s and installed 0.3.4 (commit 59287e4) byte-equal to `plugin/`. This is the third sighting of the same shape: [D-update-publishes-converge-verifies] and [D-the-publisher-revalidates-nothing] each removed nested `claude` validator calls that sat until their bounds inside a publisher while the same commands returned instantly outside it. Those two entries read the cost as redundant work and removed it — correctly, and the removals stand — but the hang itself was never explained, and it has now been seen on a call that is not redundant and cannot be removed.
**Décision:** Every non-interactive `claude plugin …` management subprocess in this repository is invoked as `claude --bare plugin …`. Three carriers, all of them: `scripts/check-plugin.sh`'s two `plugin validate --strict` calls, `scripts/test-plugin-install.sh`'s `marketplace add` / `install` / `list` calls, and `scripts/release-local.sh`'s one `plugin update` — whose printed retry line carries the flag too, so what a maintainer is told to re-run is what the script ran. Model sessions and every other `claude` call keep their runtime: `plugin/lib/cli.mjs`'s bounded `claude --version`, the token-spending probes, `claude --plugin-dir ./plugin`. Nothing else moves — no retry, no raised bound, no bypass flag, no new command, and no direct write under `~/.claude`. The bounds, the exit-code rules, the sandboxed `CLAUDE_CONFIG_DIR`, the install proof and the commit-stands rule are exactly as they were.
**Raison:** A plugin-management command reads and writes a manifest and a cache directory; it needs none of what the interactive runtime bootstraps. The measurement bounds the fault to that bootstrap and no further: 180 s versus 0.52 s across one flag, on the same binary, the same command and the same machine, minutes apart. Which bootstrap subsystem stalled is *not* established — no log here proves one, and naming a suspect would put a guess in a registry that is cited as fact. The durable rule is therefore stated at the level the evidence supports: skip the bootstrap these subprocesses never needed. It also retro-explains the two earlier sightings without weakening either removal, and it is the cheapest possible fix — one flag, no new state, no work re-run.
**Tradeoff:** Gained — the one call the release cannot avoid no longer risks a half-release that leaves the maintainer with a commit and no install, and the two audit carriers stop paying a bootstrap per invocation. Accepted — `--bare` is Claude Code's flag, so a rename or a semantic change to it breaks three scripts at once; the guards below fail loudly rather than silently if the flag is dropped, but nothing here can detect the flag changing meaning. Accepted too — the root cause stays open. This is a boundary-level mitigation, not a diagnosis.
**Conséquences:** The flag is asserted on the *argv each carrier actually spelled*, never on its source text: `scripts/test-plugin-guards.sh` (check 28) runs `check-plugin.sh` and `test-plugin-install.sh` against a logging stub `claude` that records every invocation and exits 0 — costing no validator and no install — and `scripts/test-release-local.sh` (check 53) reads the same thing out of its existing stub log. Each is paired with its fault injection: a de-bared copy of each carrier must make the same assertion red. A fourth `claude plugin` carrier added later inherits the rule and must be enrolled in check 28's list, in the same commit.
**Alternatives rejetées:** *Raise the 180 s bound, or retry the install* — pays for the bootstrap rather than skipping it, makes a successful release slower, and CLAUDE.md's cost rule names re-run work as the expensive class. *Name the bootstrap subsystem that hung* — no log in hand proves one; a diagnosis written down as fact is worse than a boundary stated honestly. *Apply `--bare` to every `claude` call* — model sessions and `--plugin-dir` loads need the runtime; a blanket flag would break them to fix something they do not have. *Grep the scripts for `--bare` instead of reading the argv* — the flag's own parsing site and the comments explaining it match forever, and a check that agrees with the source text cannot see a carrier whose call was built up in a variable.

## D-plugin-management-closes-stdin — Non-interactive plugin management closes its own stdin

**Scope:** infra
**Topic:** release
**Date:** 2026-09-10
**Statut:** Active

**Contexte:** [D-plugin-management-runs-bare] fixed half of it. After that flag landed, `claude --bare plugin update esq@esquisse --scope user --yes` typed at an interactive terminal still sat through the whole 180 s bound without printing "Checking for updates"; the identical command with `</dev/null` appended completed in 0.50 s and installed 0.3.5, which `./scripts/release-local.sh --check` then proved on all three axes — source 0.3.5, installed 0.3.5, installed commit f9f329e, bytes equal. Reading back the earlier runs closed the case: every validator, release and update invocation that had *succeeded* had its stdin redirected from `/dev/null` by the way it was invoked, and every one that hung had inherited the terminal. `--bare` removes a bootstrap these subprocesses never needed; closing stdin is what makes them genuinely non-interactive. Both are required, and the second was being supplied by accident.

**Décision:** Every repository-owned non-interactive `claude --bare plugin …` subprocess redirects its own stdin from `/dev/null`, at the point where it is spawned. Three carriers, the same three: `scripts/check-plugin.sh`'s `claude_bounded`, `scripts/test-plugin-install.sh`'s `run`, and `scripts/release-local.sh`'s one `plugin update` — whose printed retry line carries `</dev/null` too, so what a maintainer is told to re-run is what the script ran. The maintainer never has to remember the redirection, and neither does a caller: it is not an argument, an environment variable or a convention, it is part of the command each carrier issues. Nothing else moves — no retry, no raised bound, no telemetry, no new public command, no alternate install path. Every existing timeout, exit-code classification, sandboxed `CLAUDE_CONFIG_DIR`, validation step, scope, `--yes`, the version/commit/byte proof and the no-push rule are exactly as they were.

**Raison:** What the two measurements establish is a boundary and nothing beyond it: normal stdin inheritance hangs, `/dev/null` completes — 180 s against 0.50 s, same binary, same command, same machine, minutes apart. Which part of Claude Code waits on the descriptor is *not* established, and naming a suspect would put a guess into a registry cited as fact. Stating the rule at the level the evidence supports also fixes where it has to live: a boundary that only holds when a human remembers a redirection is not held at all, and the accidental redirections in the earlier successful runs are exactly how a defect this cheap survived a release. Putting it on the carrier costs nothing per run and cannot be forgotten.

**Tradeoff:** Gained — the one call the release cannot avoid, and both audit carriers, are now non-interactive in fact rather than by the luck of how they were launched; a half-release that leaves a commit with no install has one fewer way to happen. Accepted — a `claude plugin` subcommand that ever legitimately needs to read stdin cannot use these carriers unchanged, which is the correct default for a non-interactive audit and release path. Accepted too — the root cause stays open, exactly as it does for [D-plugin-management-runs-bare]. This is a second boundary-level mitigation, not a diagnosis.

**Conséquences:** The redirection is asserted on the *subprocess boundary*, never on the source text, and never on the test runner happening to have a TTY. Both guards hand their carrier a fifo held open for writing — a stdin that stays open and never reaches EOF, deterministic with or without a terminal — while an opt-in `STUB_READ_STDIN` makes the stub `claude` read stdin before continuing: a child handed `/dev/null` sees EOF at once and proceeds, a child that inherited the fifo blocks. `scripts/test-plugin-guards.sh` (check 28) covers `check-plugin.sh` and `test-plugin-install.sh`, `scripts/test-release-local.sh` (check 53) covers the install, and each is paired with its fault injection: a de-stdin copy of each of the three carriers must make the same assertion red. Every one of those runs is bounded and writes to a file rather than a pipe, so a lost redirection reds at a bound instead of waiting on the reader the bound orphaned — the de-stdin `check-plugin.sh` through its own 1 s claude bound, the other two through a 3 s fixture bound. A fourth `claude plugin` carrier added later inherits both this rule and [D-plugin-management-runs-bare], and must be enrolled in the same lists in the same commit.

**Alternatives rejetées:** *Leave the redirection to the caller, documented* — this is the defect: the successful runs already had it by accident, and nothing told the maintainer that the failing ones did not. *Raise the bound or retry the install* — pays for the wait rather than removing it, and CLAUDE.md's cost rule names re-run work as the expensive class. *Name the subsystem that waits on stdin* — no log in hand proves one, and a diagnosis written as fact is worse than an honest boundary. *Close stdin for every `claude` call* — model sessions, `--plugin-dir` loads and the token-spending probes are not this class; a blanket rule would break what it does not apply to. *Grep the carriers for `</dev/null`* — a redirection can be built up in a variable, moved into a wrapper, or restored in a comment, and a check that agrees with the source text sees none of it; only the child's own stdin proves it.

## D-needs-blocks-on-queue-presence — A `needs:` edge blocks on queue presence, not on the Shipped tail

**Scope:** func
**Topic:** roadmap
**Date:** 2026-09-10
**Statut:** Active

**Contexte:** `/esq:roadmap` Mode B marked an entry `blocked` when its `needs:` named "an entry not yet shipped", and the only record of what shipped was the `## Shipped` tail — which the same mode prunes to five lines. Once a target's tail line aged out, the waiting entry re-declared itself blocked on every later refresh, silently and permanently (B-146). This repo's own roadmap was already in that state on two edges, with the workaround written by hand into the file's header comments.

**Décision:** A `needs:` blocks only while its target is still an entry in `Now`/`Next`/`Later`. A target found in the tail, or absent from the file entirely, does not block; an absent target is reported as `⚠ needs: <slug> not found` and left in place.

**Raison:** The defect's cause is a capped, self-pruning list answering an uncapped question, so the fix has to take the tail off the correctness path rather than prop it up. Blocking is only ever right for work still queued, which is exactly what horizon presence means; "absent" covers shipped-and-pruned and dropped alike, and forever-blocking is wrong for both. The `⚠`-and-leave-in-place treatment is not new judgment — it is the rule `covers:` already applies to a cited `B-NNN` with no backlog row, and B-146 identified the missing symmetry.

**Tradeoff:** Gained a `needs:` edge that stays correct for the life of the file, with no new mutation path and no change to the eviction cap; accepted that a dropped entry and a shipped-then-pruned one surface as the same `⚠`, since telling them apart would need durable history the tail is explicitly designed not to hold.

**Conséquences:** The `## Shipped` tail returns to the job its own comment claims — history, and a hint about what just cleared — and is no longer load-bearing for a verdict. `/esq:advance` carries the same rule in its step-4 classification, and the two copies are held together only by review: nothing mechanical binds roadmap's prose to advance's, so a second correction of this rule is the point at which it earns an audit check.

**Alternatives rejetées:** Resolving `needs:` against the backlog rows the target covered — dead, since pruning the tail line destroys the only surviving record of those ids at exactly the moment the bug fires. Having eviction clear the dependents' `needs:` lines — has a refresh that "re-derives nothing" rewrite durable hand-authored lines, and destroys the edge the user wants kept as a record. Exempting a referenced tail line from the five-line cap — correct and small, but keeps the tail load-bearing and adds a retention rule that must be re-read whenever the cap is touched.

## D-landing-is-its-own-command — Landing is an explicit command, and the loop stops at ready to land

**Scope:** prod
**Topic:** safe-shipping
**Date:** 2026-09-10
**Statut:** Active — amended 2026-09-11: the projection prerequisite by [D-projection-freshness-is-advice-at-landing] (a stale projection is reported, never refused on), and the verification, coverage and already-landed prerequisites by [D-land-verifies-the-whole-unit] (asked of every plan recording the branch, the verified HEAD asserted before the merge, a deleted branch read through its plan file), and the unfinished-plan prerequisite by [D-a-unit-lands-when-every-plan-is-built-or-abandoned] (asked of every plan of the unit, with a recorded abandonment as the one way out). Every other clause stands.

**Contexte:** `/esq:converge` closed the corrective loop and then landed the branch through six gates and `esq merge land`. A clean loop was therefore the only way to land, and nothing durable recorded the facts a landing actually rests on: that a review covered the tree, that the product spec and the architecture projection still described it, that the unit disposed of the backlog rows it promised. A unit that had already landed read as a branch mismatch from its destination branch, because the refusal was decided before anyone asked whether there was anything left to land.
**Décision:** `/esq:land <plan>` is a new, explicit command (the twenty-first skill). It asks `landed` first — before the branch verdict can mask it — then refuses, cheapest first and each as a truthful no-op naming the command that clears it, on: no origin, a branch that is not the unit's, a dirty tree, an unfinished plan, `esq validate` findings, an undisposed `unit.open` or `unit.promised` row, a live finding, missing or stale review coverage, and a projection `esq projections` cannot prove fresh. Only then does it route the `(auto)` verification off `esq gate verify`, run each required command at most once with bounded collection and process-group teardown (`shared:collect-once` moved here from converge), and call the existing `esq merge land --plan <plan>`. `/esq:converge` keeps its itinerary, conditional fixes and decision stops; its clean completion records `**Reviewed at:**` and reports ready to land, and it never merges. `/esq:status` recommends `/esq:land` for a complete, covered, unmerged plan and recommends nothing for one that landed.
**Raison:** A landing and a corrective loop answer different questions with different evidence. Folding them made the landing's prerequisites whatever the loop happened to have in hand, and made a second landing attempt cost a second loop. Separating them lets the landing check durable facts any command can record, and lets the loop stop where its evidence stops.
**Tradeoff:** Gained: one explicit step whose refusals are all named and cheap, a loop that no longer writes git history nobody authored, and an already-landed unit reported as landed. Accepted: two commands where there was one, and a landing that blocks on backlog rows the unit promised until `/esq:backlog` disposes of them.
**Conséquences:** The single merge engine, the plan header's Branch/Origin authority read in-process, `safeRef` and every refusal verdict are unchanged. `/esq:land` never pushes or publishes; `./scripts/update.sh` stays a separate operation after landing. Scenario R-08 now pins the landing in `/esq:land` and the ready-to-land stop in `/esq:converge`. It carries `D-a-refused-landing-is-a-truthful-no-op`'s rule forward unchanged. The landing's own session is classified non-plan-bearing by `scripts/outcome-join.mjs`: it declares no plan identity, so counting it would make every landing a coverage miss.
**Alternatives rejetées:** Keeping the landing inside converge and adding the new prerequisites as further gates — it keeps the coupling that made a clean loop the only way to land. A landing journal so a refused merge does not re-run landing-only checks — a new artifact whose staleness is a second thing to get wrong, excluded by the mandate.

## D-land-reuses-proved-verification — The landing reuses a phase's proof, and the audit runs where the change is proved

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-10
**Statut:** Active — amended 2026-09-11 by [D-land-verifies-the-whole-unit]: `/esq:land` asks `esq gate verify --unit`, so the evidence it reuses and the commands it runs are the whole unit's; the invalidation rules, the `**Reviewed at:**` exclusion and the no-journal clause are unchanged. Amended 2026-09-11 by [D-a-unit-lands-when-every-plan-is-built-or-abandoned]: two header fields, not one, are left out of the plan-section comparison — `**Reviewed at:**` and the `**Abandoned:**` line `esq plan abandon` writes, both bookkeeping about the plan — and `--unit` drops an abandoned plan's phases with no `completed` entry.

**Contexte:** `D-freshness-is-proved-from-the-tree` made converge's gate 4 reuse a recorded `(auto)` PASS that git could still prove. With the landing moved to `/esq:land`, the same question has a new asker, and two new writes reach the plan and the tree after the last phase: the `**Reviewed at:**` field and the projection refreshes. CLAUDE.md meanwhile still read as "run `./scripts/audit.sh` before every commit", which prescribes the whole suite beside every narrower check a phase already ran.
**Décision:** `/esq:land` calls `esq gate verify` without `--workers-moved` — it moves no `HEAD` and spawns no worker, so it relies on durable evidence; the flag stays for any caller whose worker did. Exact-command deduplication, the complete PASS criterion, expected non-zero passes and conservative unresolved steps are unchanged. The invalidation rules are unchanged but for one exclusion: the `**Reviewed at:**` header line (with the blank line `set-reviewed` inserts) is left out of the plan-section comparison. A projection refresh still invalidates a command proof. No landing journal is kept, so a landing-only rerun after a refused merge runs again. CLAUDE.md's audit rule is amended: phases run the checks their change earns, cross-package changes earn broader verification, the final phase names and runs `./scripts/audit.sh` and records its genuine PASS through the existing `verified` provenance, and a landing reuses that PASS or runs the audit once.
**Raison:** Question 1 of the cost pass: the audit already proved on the final tree is not re-bought unless something outside the lifecycle bookkeeping moved. Recording a review is bookkeeping about the plan, so it must not stale the evidence the review relied on; a projection refresh is not, and pretending otherwise would let a documentation commit that touches skills slip past the proof.
**Tradeoff:** Gained: a landing that re-runs nothing a phase proved, and a commit rule that no longer prescribes the audit beside every narrower check. Accepted: exact-command reuse cannot remove every overlap — a phase's standalone check and an audit that runs the same check stay two commands — and no subsystem is added to solve it; a refresh after the final phase costs one audit re-run.
**Conséquences:** `gateVerify`'s diff now passes `--no-renames`, so a rename out of an invalidating path reports that path and can only turn a reuse into a run. Scenario R-09 pins the step in `/esq:land`. `tests/cli/gate.test.mjs` and `tests/cli/merge.test.mjs`, previously ungated, run under check 30 with the new landing suite.
**Alternatives rejetées:** Inferring per-command dependencies or recognizing a check nested inside the audit — a dependency model is judgment the CLI must not own. Treating projection files as harmless for command proofs — `CLAUDE.md` and the skills it routes to are read by the commands being proved.

## D-update-publishes-land-verifies — The publisher defers to the landing, not to the loop

**Scope:** infra
**Topic:** release
**Date:** 2026-09-10
**Statut:** Active

**Contexte:** `D-update-publishes-converge-verifies` and `D-the-router-publishes-never-verifies` both justify `update.sh` running no audit by naming `/esq:converge`'s landing gate as the verifier. The landing is now `/esq:land`.
**Décision:** `./scripts/update.sh` is unchanged in behavior — a publisher and router with no audit and no judgement — and every message and rationale naming the verifier names `/esq:land`. Publishing stays a separate step run after landing; `/esq:land` never invokes it.
**Raison:** The two superseded entries were right about ownership and wrong only about the owner's name; a message pointing a maintainer at the command that no longer lands is a hand-off that does not run.
**Tradeoff:** Gained: a release path whose rationale matches the workflow. Accepted: nothing re-checks the tree at release time, exactly as before.
**Conséquences:** `scripts/update.sh`, `scripts/release-local.sh`, `scripts/test-update-guard.sh` and `audit.sh` check 54's comment name `/esq:land`; check 54's assertions are unchanged.
**Alternatives rejetées:** Having `/esq:land` publish after a successful merge — it would put the one command that replaces the maintainer's installation behind a merge nobody re-reads, and landing is a local, recoverable write while a release is not.

## D-projections-carry-their-mining-commit — A projection is fresh only when the commit it mined still describes HEAD

**Scope:** arch
**Topic:** projections
**Date:** 2026-09-10
**Statut:** Active — amended 2026-09-11 by [D-projection-freshness-is-advice-at-landing]: the consequence "`/esq:land` refuses on anything but `fresh`" no longer holds — `/esq:land` reports a projection that is not `fresh` and lands anyway. The marker, the harmless list and every verdict of `esq projections` are unchanged.

**Contexte:** `docs/SPEC.md` and the architecture projection carried a date marker only. A date says when a projection was written, never which tree it describes, so a landing had no way to know whether either still matched the code about to merge.
**Décision:** Each owner records the full `HEAD` it inspected at mining time in its existing marker — `<!-- last-spec: YYYY-MM-DD @ <commit> -->`, `<!-- last-arch: YYYY-MM-DD @ <commit> -->` — an existing commit, never a self-referential one and never an amendment. `esq projections` is read-only and answers per projection: `fresh` when that commit resolves and nothing changed since outside `docs/SPEC.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, Markdown under `docs/plans/` and `docs/BACKLOG.md`; `stale` naming the paths otherwise, every `.claude/skills/` byte included; `unproven` for a missing, legacy, date-only, malformed, short or unresolvable marker.
**Raison:** A refresh commit and a landing's bookkeeping touch only that list, so same-day spec and arch refreshes prove each other fresh in either order, while any implementation or skill change is a change the projection never saw.
**Tradeoff:** Gained: a mechanical freshness answer with no cache and no attestation file. Accepted: prose edited by hand after mining still reads fresh — the list admits the projection files by design, so this does not certify manual edits.
**Conséquences:** `/esq:status` keeps reading the date for staleness; `/esq:land` refuses on anything but `fresh`. The arch provenance is read from `docs/ARCHITECTURE.md`, falling back to `CLAUDE.md`. `/esq:arch` writes project skills, which are not bookkeeping, so recording its mining commit and committing skills on top would make every skill-routing refresh stale on arrival — found by this unit's own first refresh. It therefore commits changed skills first and records that existing commit; with no skill change, the mining commit stands. The same-day both-orders property holds for refreshes that move no skill; when arch moves skills, `/esq:spec` runs after it.
**Alternatives rejetées:** Comparing marker dates against commit dates — a date cannot say which tree was read. Hashing the projection content — it proves the prose did not change, never that the code it describes did not.

## D-a-landing-reads-coverage-and-obligations — Coverage and the unit's obligations are facts the CLI returns

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-10
**Statut:** Active — amended 2026-09-11 by [D-land-verifies-the-whole-unit]: `coverage` is the unit's — any plan recording the same `**Branch:**` whose `**Reviewed at:**` still covers HEAD — and `landed` reads a deleted branch through its plan file; `unit.promised`, `unit.findings` and `unit.open` are unchanged. — amended 2026-09-11 by [D-evidence-settles-backlog-dispositions]: `/esq:backlog` is no longer the only writer of a `Status` cell; `/esq:land` still never closes `unit.promised`, and puts each standing row to the user as a delivered / not-delivered choice.

**Contexte:** Nothing recorded that a review had covered a tree: `/esq:review` stamped `Reviewed at:` only inside a brief it wrote, and a clean review wrote no brief. `unit.open` covered the defects a unit's build and fix steps filed, but not the backlog rows its plans picked up, and a corrective brief still listing items was visible only to whoever opened it.
**Décision:** A clean `/esq:review` verdict and a clean `/esq:converge` completion record `**Reviewed at:** <full commit>` in the plan header through `esq plan set-reviewed`, once. `esq branch check` returns `coverage` (`covered` / `stale` / `unproven`, against the same harmless list as projection freshness), keeps `unit.open`, and adds `unit.promised` — undisposed rows carrying `Planned by <unit slug>`, any type, `Needs-decision` included — and `unit.findings` — live corrective briefs whose `Source:` names a unit plan and still list an item — plus `landed`. Unit membership is every plan recording the same `**Branch:**`, never a filename prefix. `esq state` carries the same facts for a complete plan.
**Raison:** Each is table cells, a header field or a brief's own header — structure the CLI owns, with no severity judged. `/esq:backlog` stays the only writer of a `Status` cell, so a landing blocks on a promise until a human disposes of it rather than inferring delivery.
**Tradeoff:** Gained: a landing whose refusals are exact and a status that stops recommending a loop for a covered plan. Accepted: a deleted brief is never reconstructed from history, so a finding someone deleted by hand is gone.
**Conséquences:** The new verdict keys are additive; every existing key reads what it read before, and build's and converge's routing off `refuse` is unchanged.
**Alternatives rejetées:** Inferring unit membership from filename prefixes — two unrelated plans sharing a prefix would block each other, and a corrective plan with a different stem would escape its unit. Reading coverage from the brief's `Reviewed at:` stamp — a clean review writes no brief.

## D-plan-retires-the-brief-it-plans — `/esq:plan` retires the corrective brief it plans

**Scope:** func
**Topic:** landing-gate
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** `unit.findings` counts any corrective brief still on disk whose `Source` names a unit plan, and nothing removed one once its 🟡s were planned — so `/esq:land` refused those units forever and named `/esq:plan` for work already planned (B-148; nine such briefs on disk).
**Décision:** `/esq:plan`, consuming a `*-fixes*.brief.md`, strikes the 🟡s it planned and any 🔴 it resolved, and `git rm`s the brief in its own `plan: <slug>` commit when no item remains — otherwise it stages the edited brief; `unit.findings` is unchanged.
**Raison:** The user chose option A on 2026-09-11 (`96bd370`): the command that consumed the finding is the one that retires it, the same shape `/esq:fix` step 4 already has for the 🟢s it applies. Striking rather than deleting whole is the edge the decision did not reach: a brief carrying an unapplied 🟢 or an undecided 🔴 keeps them live, so the landing names `/esq:fix` or the decision rather than losing them.
**Tradeoff:** Gains a landing that stops re-routing planned work, with no CLI change. Accepts a second command that deletes briefs, and an `esq lane stats` that undercounts 🟡s the way it already undercounts 🟢s.
**Conséquences:** A deleted brief stays readable from history, which is all `/esq:review`'s delta step needs. Briefs planned before this rule shipped are not retired by it (B-149).
**Alternatives rejetées:** `unit.findings` skipping a brief whose slug has a plan — a plan existing is not the brief's items being planned, and it would hide an unapplied 🟢 beside them. Deleting the brief whole — loses the tiers `/esq:plan` does not own.

## D-review-delta-base-is-a-reviews-own-record — A re-review narrows only to what a review read

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-11
**Statut:** Active — amended 2026-09-14 by [D-review-scope-is-one-deterministic-query]: the rejected alternative — a CLI verb computing the base — is now how it is computed, after three runs of the prose in one shipping unit. Every clause of the rule below stands unchanged, and `/esq:converge`'s distinct commit subject is still what keeps its record out of the candidate set.

**Contexte:** `/esq:review` narrowed to a delta only from a review brief's `Reviewed at:` stamp, so every `stale` landing after a clean review re-read the whole unit (B-147). The plan's `**Reviewed at:**` field is the natural base, but `/esq:converge` writes it too, over final `/esq:fix` commits no review read, and both committed it as `plan(reviewed): <slug> at <short hash>`.
**Décision:** The delta base is the newer of a review brief's stamp and the `**Reviewed at:**` recorded by the newest `^plan(reviewed): <slug> at ` commit; `/esq:converge` commits its record as `plan(converged): <slug> at <short hash>` and is never a base; a candidate not an ancestor of `HEAD` is dropped, and no candidate means full scope.
**Raison:** It reuses the join key the step already reads (a commit subject, as `brief(fixes): <slug>` is), touches no parser, and every failure — a rewritten commit, a missing field, no matching subject — falls back to the full review, never to a narrower one. `git log --all --grep='plan(reviewed)'` was empty on 2026-09-11, so the rename reinterprets no history.
**Tradeoff:** Gains a stale-by-bookkeeping landing that costs a review of the change rather than of the unit. Accepts a commit subject as a contract two skills must keep distinct, enforced by conformance needles rather than a parser.
**Conséquences:** Any future command that records `**Reviewed at:**` without itself reviewing must commit under a subject other than `plan(reviewed):`. A rebased or squashed unit loses its narrowed base and pays one full review.
**Alternatives rejetées:** Writing the recorder into the field (`· review`) — widens a header line the gate exclusion, the coverage reader and the landing suite all parse, for a distinction only the review consumes. A CLI verb computing the base — a new public surface for a two-candidate history read already in skill prose.

## D-land-verifies-the-whole-unit — The landing verifies the branch it merges, and only the HEAD it verified

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-11
**Statut:** Active — amended 2026-09-11 by [D-a-unit-lands-when-every-plan-is-built-or-abandoned]: phase completeness is the unit's too — `/esq:land` stops on `unit.incomplete` rather than on `esq next-phase` for the plan it was handed, so an unbuilt or paused sibling stops the landing before findings, coverage or verification, and the gate's `--unit` union leaves out an abandoned plan's unbuilt phases. Every other clause stands.

**Contexte:** A shipping unit is every plan recording one `**Branch:**`, and `esq merge land` merges that whole branch — yet `/esq:land` verified and read coverage for the one plan it was handed. Three defects followed. Landing through a `-fixes` plan could merge a branch whose initial plan's tests a fix commit had staled and nobody re-ran; landing through the initial plan refused "coverage unproven" when a `-fixes` plan's converge covered the same `HEAD`. Verification runs for minutes and the merge took whatever the branch ref pointed at afterwards, so a commit made in between landed unverified and unreviewed. And once a landed branch was deleted, `landed` read `null` while coverage stayed covered, so `/esq:status` recommended `/esq:land` again and land answered `mismatch → git switch <deleted branch>` — reproduced in a throwaway repository.
**Décision:** `esq gate verify --unit <plan>` answers for the union of the `(auto)` steps of every plan in the unit: exact-command deduplication across plans, each occurrence judged against the plan that recorded its proof with the invalidation rules unchanged, the newest verified commit deciding among several proofs (plan position — date, corrective depth, name — breaking ties and choosing whose step text travels when nothing proves it), unresolved steps run in full, and nothing executed; without `--unit` the verb answers as before. `coverage` on `esq branch check` and `esq state` is the unit's: `covered` when any unit plan's `**Reviewed at:**` still covers `HEAD` under the existing harmless list, the newest record deciding, with `coverage.plan` naming it — the same answer whichever unit plan is passed. `/esq:land` keeps the `head` the gate returned and writes `esq branch check <plan> --at <head> && esq merge land --plan <plan>` as one call; `--at` runs after every existing verdict and refuses as `moved` when `HEAD` or `refs/heads/<Branch>` is not that commit. When the recorded branch no longer resolves, `landed` is `true` if the commit that last changed the plan file (from `HEAD`) is an ancestor of the recorded origin.
**Raison:** Every fact the landing reads should be about the thing it merges — the branch — and about the tree that will merge. Each answer stays structure the CLI owns: plan headers, recorded commits, ancestry and a ref comparison, no severity judged and no commit message parsed.
**Tradeoff:** Gained: one question with one answer across a unit, and no window between verification and merge. Accepted: the unit gate evaluates every occurrence of every plan (tens of millisecond-scale git calls, nothing executed); a plan first committed on its origin whose branch was deleted unmerged would read landed — plans are committed on their unit's branch, so this is not a path the workflow takes.
**Conséquences:** The merge engine, the plan header's Branch/Origin authority read in-process, `safeRef` and every existing refusal verdict are unchanged — `moved` exists only under `--at`. `esq branch check` gains the additive `head` and `root` keys; gate entries gain `plan` and `occurrences`. `esq plan resolve-block` still asks the one phase it resolves. Scenario R-08 pins unit coverage, the `moved` refusal and the chained call; R-09 pins `--unit` and the union. `branchResolve` still reads a deleted stem branch as retired: it asks whether to reuse a branch, not whether a unit landed.
**Alternatives rejetées:** A sibling verb for unit verification — a second instrument whose answer could drift from the gate's. Checking `HEAD` inside `esq merge land` — it changes the merge engine the mandate kept closed. Recording a landing journal of what verification ran — a new artifact whose staleness is a second thing to get wrong. Parsing `merge:` commit subjects to recognize a landed unit — message text is not a git fact.

## D-projection-freshness-is-advice-at-landing — A stale projection is reported at landing, never refused on

**Scope:** prod
**Topic:** landing-gate
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** `D-landing-is-its-own-command` made fresh spec and arch a landing prerequisite. Each refresh is a paid Opus session, so every landing bought two, and an ordering dance followed: `/esq:arch` before `/esq:spec` (an arch skills commit stales a spec mined before it), and a refresh after converge staled the verification a phase recorded, so the order of arch, spec, converge and a further refresh mattered to what landing re-ran.
**Décision:** `/esq:land` still reads `esq projections` and, for each projection that is not `fresh`, carries one zone-3 line naming its verdict and owner (`/esq:arch` before `/esq:spec` when both are owed); it never stops on it, never makes it the `→ Next` and never runs either owner. `/esq:status` and `/esq:converge` stop presenting a refresh as required before landing. `esq projections`, the `@ <commit>` markers and what `/esq:spec` and `/esq:arch` do are unchanged.
**Raison:** Review coverage and backlog disposition protect what merges; a projection describing older code misleads a reader without making the merged code wrong. A prerequisite that costs two sessions per landing and protects documentation is the wrong price for the wrong asset, and the advice line keeps the fact visible.
**Tradeoff:** Gained: a landing that costs no refresh and no ordering dance. Accepted: `main` can carry a spec and architecture projection that describe an earlier tree until someone chooses to refresh them; `/esq:status`'s staleness lines and land's advisory line are what surface it.
**Conséquences:** R-08's prerequisite sentence now reads that review coverage and backlog disposition are prerequisites and projection freshness is advice, with its fault injection. 7e0368d changed the one sentence in `/esq:spec` and `/esq:arch` (and their `commands/esq/` mirrors) that described the landing refusal, so it now says `/esq:land` reports an unprovable projection as not fresh.
**Alternatives rejetées:** Dropping the projections read from the landing — the fact is cheap and the reader still wants it. Refreshing projections automatically after a landing — a paid session nobody asked for, the cost this decision removes.

## D-a-unit-lands-when-every-plan-is-built-or-abandoned — A unit lands when every plan on its branch is built or recorded abandoned

**Scope:** func
**Topic:** landing-gate
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** `/esq:land` checked phase completeness only for the plan it was handed, while coverage and verification became the unit's (B-150). An unbuilt `-fixes` sibling then either redded the gate on steps with no provenance or merged a branch whose corrective plan never shipped — and requiring every plan to be complete needs a way out for a plan someone decided not to build.
**Décision:** `esq branch check` and `esq state` carry `unit.incomplete` (every unit plan neither complete nor abandoned) and `/esq:land` stops on it; a plan leaves that requirement only through `esq plan abandon <plan> --reason <text>`, which writes one `**Abandoned:** <date> — <reason>` header line and commits nothing.
**Raison:** Disposition is recorded, never inferred — the rule `Done`/`Dropped` already applies to backlog rows. A deleted plan file would also silently release every `Planned by <slug>` row it carried from `unit.promised`, landing an unkept promise nobody decided on; a marker keeps the slug resolvable and the promise owed.
**Tradeoff:** Gained: one unit-wide completeness answer every consumer reads from the same membership rule, and an abandonment a later reader can see and date. Accepted: a new header field and CLI verb, and `planSection` now leaves two bookkeeping header lines out of the proof comparison instead of one.
**Conséquences:** An abandoned plan's completed phases still count toward `esq gate verify --unit`, its unbuilt ones do not; its `unit.promised` rows and `unit.findings` still block. `/esq:status` never routes `/esq:build` to an abandoned plan, settles past one, and sends a complete plan whose unit still has an incomplete sibling to `/esq:build` on that sibling rather than to `/esq:land`; `/esq:converge` names unit completeness among what the landing checks. Scenario R-08 pins the unit-wide prerequisite, its place before verification and the recorded-never-inferred rule, each with a fault injection. An abandonment marker only counts while the plan is unfinished: a plan built after it was abandoned is complete, and the marker is inert. The undo is reverting the `plan(abandoned):` commit — no un-abandon verb until one is needed.
**Alternatives rejetées:** Deleting the plan file as abandonment — no vocabulary, but promised rows escape the unit unseen. No abandonment rule — one abandoned plan blocks its unit forever with no documented way out. Completeness computed in the land skill by calling `esq next-phase` per plan — restates unit membership in prose and leaves `/esq:status` without the fact.

## D-evidence-settles-backlog-dispositions — The command holding the evidence carries out the disposition

**Scope:** arch
**Topic:** workflow
**Date:** 2026-09-11
**Statut:** Active — amended 2026-09-21 by [D-a-landing-closes-the-delivery-it-can-cite]: the principle stands and so does every bar it set; what changes is the `/esq:land` carve-out, which forbade the landing from closing a promised row on *completeness* and was read as forbidding it on *cited delivery* too. Land now closes a row whose whole outcome a commit or execution-log line delivers — the same bar build's last phase and fix already close on — and closes nothing on completeness, on split evidence, or on a `unit.open` row.

**Contexte:** In a measured ESQ run, a build filed an observation outside its promised work. `unit.open` then blocked completion, and the command handed row disposition back to the user. Across commands, `/esq:backlog` being the only writer of a `Status` cell made every disposition a TODO even when the command already had the evidence.
**Décision:** Commands file observations (`esq backlog add`) and update or close rows (`esq backlog set-status --by / --reason / --resolution`) when their own evidence justifies it, recording provenance and resolution atomically. A phase classifies an observation at filing time: `observed:` only for a finding outside the promised work that the unit neither introduced nor aggravated — it fails the same way on the unit's origin, nothing the unit changed (callers, data, configuration, interfaces) reaches or worsens it, and nothing the unit promised covers it — `build:` otherwise. An untouched file does not establish it, since a changed caller can break an unchanged consumer, and neither does a pre-existing failure, which the unit may have aggravated or promised to fix. A regression or an unfulfilled promise is never routed around `unit.open`. Build's last phase and fix close a row only when its whole promised outcome was delivered and verified; partial delivery stays open. Nothing is dropped, re-filed or re-classified to get past a gate. `/esq:land` never closes `unit.promised` because a unit is complete and reviewed — a complete unit can carry an abandoned plan whose promise was never delivered — and asks about each standing row as a delivered / not-delivered choice.
**Raison:** The evidence lives in the command that did the work; routing it through the user added a round trip and no judgment. The honest constraint is the direction of error: a row closed that was not delivered is worse than one left open, so the bar is delivered and verified, and a gate is never the reason for a disposition.
**Tradeoff:** Gained: no mechanical ledger chores, and no drop-and-re-file dance. Accepted: the filing classification is a judgment made by the phase, bounded by stated evidence and by the rule that an unplaceable finding is `build:`.
**Conséquences:** `unit.open` still blocks `build:`/`fix:` 🐛/⚠️ rows; `observed:` joins `check:` and `review:` as a non-blocking source. The CLI records, it never decides. Amends `D-a-same-unit-defect-is-never-a-backlog-row` and `D-a-landing-reads-coverage-and-obligations`.
**Alternatives rejetées:** Letting land close promised rows once the unit is complete and covered — complete does not prove delivered. Filing every outside-unit finding as a 💡 idea to dodge the gate — it would mis-type real bugs.

## D-a-linked-worktree-reserves-its-block-under-one-lock — Selection and reservation are one critical section

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** `reserveId` fell back to `1-999` whenever `.esq-id-block` was absent, including in a linked worktree created without `/esq:worktree`. This caused duplicate IDs during concurrent work. The existing allocators chose a free index and wrote the marker without a lock, so two worktrees could choose the same block even with an atomic write.
**Décision:** `esq backlog reserve-block` is the one allocator: in a linked worktree with no marker it takes an exclusive-create lock in the git common directory, re-reads the marker, collects the indices held by live worktrees and witnessed by main's backlog, writes the lowest free block's marker with an exclusive create, appends `.esq-id-block` to `info/exclude`, and releases the lock. `reserve-id` calls it; `scripts/worktree.sh` and `/esq:worktree` call it on the tree they create; the prose rule remains only as the no-`esq` fallback, which now stops in a linked worktree rather than minting from `1-999`. The main checkout keeps `1-999` and writes nothing.
**Raison:** An atomic write protects the file, not the choice; the choice is what collided. One lock around choose-and-write, in the one directory every worktree shares, is the smallest thing that makes concurrent reservations distinct.
**Tradeoff:** Gained: no silent collision, and a worktree created any way reserves its block on first use. Accepted: a lock left by a crashed process makes the next reservation refuse after ten seconds, naming the file, rather than guessing it stale.
**Conséquences:** Six concurrent reservations in sibling worktrees are tested to produce six distinct blocks. `esq state` reports `idBlock` (`main`, `marker` or `missing`).
**Alternatives rejetées:** Treating an old lock as stale and taking it over — two processes can both decide so and both proceed. A general allocation service — the mandate rules it out and the problem is one critical section.

## D-advance-preserves-units-and-its-branch — Advance hands off what exists and comes back to where it started

**Scope:** arch
**Topic:** roadmap
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** In a measured ESQ run, `/esq:advance` ended on a plan branch: a roadmap refresh landed there instead of on the starting branch, earlier plans became invisible, and the user had to repair the handoff. The run needed a way to track plans on unmerged branches.
**Décision:** Advance reads `esq state`, whose new `inFlight` lists units living on unmerged branches (their plans, when the header names that branch, and their undisposed `Planned by` rows), and hands off any item planned anywhere without re-working it. `/esq:work` no longer chains into `/esq:plan` inside the item subagent; the items of one entry that come back to plan go to one `/esq:plan` spawn, never extending an existing plan. After every item and plan advance returns to its starting branch, and stops with the exact blocker when the tree is dirty or git refuses the switch. `/esq:roadmap` accepts a delegated model invocation for its bare refresh only, which reorders nothing and now reads `inFlight`.
**Raison:** A plan is a shipping unit with its own branch authority; the orchestrator must neither absorb it nor lose sight of it. Returning to the starting branch keeps later commits where they belong, and `inFlight` is what keeps that return from hiding the planning already done.
**Tradeoff:** Gained: a second run discovers the first run's plans, and one topic yields one plan. Accepted: one extra subagent per entry that needs planning, since work and plan no longer share one.
**Conséquences:** Scenario U-12 pins it; `check-plugin.sh` holds `roadmap` to the in-body guard. Amends `D-orchestrated-skills-guard-in-body`.
**Alternatives rejetées:** One new plan per Now entry regardless of existing plans — it would replace or duplicate units already in flight. Retiring advance — the defects were structural and fixable.

## D-announcements-and-asks-stay-minimal — Say less, and make what is left runnable

**Scope:** ux
**Topic:** reporting
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** In local transcripts from 2026-09-07 to 2026-09-11, 5 of ~500 esq invocations ended with only "I'll start with the announcement." (sometimes followed by the announcement) and no tool call; the user re-sent each. That phrase was quoted in every announce block as an anti-example. Announcements ran to paragraphs nobody read, NEEDS YOU lines carried prose instructions or notices, and plan/build/autopilot/converge printed an assurance-lane line that has not changed what converge runs since 2026-09-09.
**Décision:** Every announcement is one line with a real bound, and the block says the run's first tool call follows in the same response; the anti-example is gone and check 16 fails if it returns or the clause is lost. No duration is estimated. Zone 2 holds only requests the user still has to settle, never a notice or work the command can do; an executable ask carries its exact command, a genuine choice may be a concise option set without an invented command, and `→ Next` repeats the first pending action. The assurance lane stays internal to plans and the CLI.
**Raison:** The stop was invited by the prompt; removing the invitation is the only change a static instruction can make. What remains in front of the user should be what they act on, in the form they run.
**Tradeoff:** Gained: shorter output and a last line that is always actionable. Accepted: a static check cannot prove the intermittent stop is gone — only later transcripts can — and no billed replay or telemetry was added to measure it.
**Conséquences:** The shared conclusion block changed in every carrier. Amends `D-ask-shape-lives-in-zone-two`.
**Alternatives rejetées:** Removing announcements entirely — the bound before spending is still the cost rule. A billed replay campaign to prove the fix — excluded, and it could not prove an intermittent absence either.

## D-the-reread-instrument-is-a-sibling-script — The re-read instrument is a sibling script, not a CLI verb

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** B-070 closes on a measured per-path re-read rate, and nothing on disk can take that reading — the script in its notes reads turns, never tool inputs. Where the new instrument lives decides who may read it and what it may judge.
**Décision:** It is `scripts/measure-rereads.mjs`, a fourth sibling to `cost-budgets.mjs`, `measure-wait-cost.mjs` and `outcome-join.mjs`: pure classifier plus live join, never wired into `audit.sh`, fixture suite gated in check 39 under `tests/measure/`.
**Raison:** "This read was avoidable" is judgment, and the CLI owns structure and never judgment (`plugin-runtime`) — the same reason `outcome-join.mjs` was kept out of it. A CLI verb would also ship a machine-local measurement into the distributed plugin. Folding it into `measure-wait-cost.mjs` would break that file's flat header promise never to print a path, for the whole file rather than for the one report that needs it.
**Tradeoff:** Gained: an established shape, a reviewer's existing reading, free test wiring, and a privacy boundary stated per file. Accepted: the two local-store walkers are duplicated a third time.
**Conséquences:** Any future instrument over `~/.claude` follows the same shape. `docs/ARCHITECTURE.md` and `README.md` now enumerate four never-wired machine-state scripts, not three.
**Alternatives rejetées:** An `esq telemetry rereads` subcommand — puts judgment in the CLI and ships a local measurement into the plugin. Extending `measure-wait-cost.mjs` — different population, different question, and it would qualify a promise that is currently unqualified.

## D-a-reread-is-judged-against-the-shipped-rule — A re-read is counted against the rule that shipped, not against a purer one

**Scope:** func
**Topic:** telemetry
**Date:** 2026-09-11
**Statut:** Active

**Révisé:** 2026-09-11, twice, before implementation — the plan was revised and this entry corrected rather than amended, because nothing had been built against it yet. The second revision separated classified-legitimate access from uncertainty, and stopped resolving uncertain write and read outcomes in either direction.
**Contexte:** B-070 prescribes grouping `Read`/`Grep`/`Glob` by resolved path and counting every occurrence after the first. The rule actually shipped in `3d78a04` carries a write exception the prescription omits; in this repository agents are instructed to read with `cat`; and a repeated access is not the same fact as redundant content.
**Décision:** Path history is shared across `Read`, `Grep`, `Glob` and recognized shell reads, so tool switching hides nothing. A path's counter is reset only by a write whose success is **established** — a recognized write (`Edit`/`Write`/`NotebookEdit`, an `esq` CLI write with the target taken from the invocation, or a closed list of shell writes) whose own tool result is recorded and is not an error. Every repeat is then classified into one of three reported groups: **established redundancy** (`identical`), **classified legitimate access** (`differentSlice`, `afterTruncation`), and **unresolved** (`afterUnrecognizedWrite`, `afterUncertainWrite`, `afterUnconfirmedRead`, `historyIncomplete`). Classification coverage is reported separately from the redundancy count, and only `identical` is claimed as established redundancy.
**Raison:** Without the write exception the instrument scores every correct append-then-verify sequence as waste, making the rule look violated by the runs that follow it best — and a *failed* write that reset the counter would hide real waste. Without shared history the number could improve because agents changed tool rather than behaviour. Reading a different slice, or recovering after the harness truncated the previous result, is legitimate work that the classifier can actually *resolve*, so grouping it with genuine uncertainty would make the reading look less complete than it is. And an outcome that is not established stays unestablished in both directions: an absent tool result is not a confirmed write, a failed compound command may have written before failing, and a read whose result is missing or errored never put the content in front of the agent — each of those is an unresolved class, never a reset and never a redundancy.
**Tradeoff:** Gained: a figure that measures the rule as written, cannot be gamed by tool choice, and states its own residue and its own coverage. Accepted: three groups and seven classes to read instead of one number, and a bounded recognizer that leaves some outcomes unresolved rather than guessing at them.
**Conséquences:** The classifier owns the exception and the classes, so the fixture suite pins each. Any later change to the `shared:read-once` block's exception has to change this classifier too, or the measurement stops matching the rule. The unresolved classes are reported beside every redundancy figure as classification coverage; they gate no verdict, because the instrument issues none.
**Alternatives rejetées:** B-070's prescription taken literally — measures a rule nobody shipped, and would count recovery as waste. A general-purpose shell parser to resolve every write — unbounded, untestable, and it would trade a stated residue for a hidden error rate. Treating an absent tool result as a successful write — the cheap reading, and it silently erases real repeats. Requiring established redundancy to exceed a share of all repeats before a reading counts — that made legitimate classified access look like uncertainty and would have made a successful intervention, which leaves few redundant repeats, read as an unusable measurement.

## D-the-reread-instrument-prints-paths-for-one-repository — Foreign runs count toward the rate; only local paths are ever printed

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-09-11
**Statut:** Active

**Révisé:** 2026-09-11, before implementation — pooling was dropped and the path test was moved from the run to the path.
**Contexte:** The transcript store is machine-wide and holds prompts, tool inputs and other projects' file layouts. This instrument's headline output is file paths, which its three siblings never emit. A local `cwd` says where the agent stood, not where it read.
**Décision:** Local and foreign runs are measured as **separate cohorts and never summed into one rate**. A path is published only when that path itself, resolved against the run's `cwd` and through `realpath`, lands inside this repository's root — which is what rejects an absolute path elsewhere, a `../` escape and a symlink out. The boundary applies identically to the text render and to `--json`, and the report states how many paths it withheld.
**Raison:** Two repositories with different ledger layouts do not share a denominator, so a pooled headline would be a number about no population in particular. Naming *which file* is the part that leaks, and a per-run test leaks anyway: a run standing in this repository can read `~/.ssh/config` or `../other-project/src`. Resolution, not the agent's working directory, is the only test that holds for the three escape shapes.
**Tradeoff:** Gained: cohorts that mean something and a path boundary that survives symlinks and escapes. Accepted: a smaller local denominator than pooling would give, and a `realpath` call per distinct path.
**Conséquences:** The pure classifier receives `scopePath(cwd, raw)` as an injected callback and has no filesystem access, so all four non-local shapes are provable on fixtures with no real store present.
**Alternatives rejetées:** Pooling every run into one rate — mixes populations and produces an average that could fall for reasons unrelated to the rule. Trusting the run's `cwd` — passes an absolute external path, a `../` escape and a symlink out. Hashing foreign paths — an opaque digest nobody can act on, at the cost of a surface that still encodes a layout.

## D-reread-cohorts-split-on-rule-presence — The read-once cohorts split on rule presence, not on a commit timestamp

**Scope:** arch
**Topic:** telemetry
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** B-070 closes on whether the `shared:read-once` block changed behaviour. `3d78a04` is when that block entered the tree, but an agent reads the plugin that was *loaded*: no telemetry row carries an esq version, and a transcript carries the Claude Code version only, so a commit timestamp is an upper bound on when the rule could have been read, never proof that it was.
**Révisé:** 2026-09-11, before implementation — the binary split became five-valued, because a missing marker is missing evidence and not an absent rule.
**Décision:** Rule presence is read from a **relevant delivery record** — an `isMeta` user text record carrying the anchor `Base directory for this skill: …/plugin/skills/<name>` where `<name>` is one of the five block-carrying worker skills — and is five-valued: `ruleLoaded` (a relevant record carries the needle, with at most one tool call before it), `ruleLoadedMidRun` (the same with two or more tool calls before it, so earlier activity was not exposed), `ruleAbsent` (a relevant record is present and none carries the needle), `ruleNotCarried` (delivery records name no block-carrying skill), `ruleUnknown` (no relevant delivery record at all). The primary comparison is `ruleLoaded` against `ruleAbsent`; the other three are counted, printed and excluded from it. Needle and anchor are constants beside `CLASSIFIER_VERSION`. `--since`/`--through` survive as a window on the corpus, they select **whole runs by first timestamp** and classify the full transcript, and they are never the cohort rule.
**Raison:** The evidence is in the artifact rather than inferred from a clock — the skill body is delivered into the run and is therefore observable per run. But a bare marker test conflates "the rule was not delivered" with "no delivery record survives", and over the 981 transcripts on disk that is the difference between 289 genuine `ruleAbsent` runs and 295 runs with no relevant delivery record at all. Of first needle occurrences sampled, 145 of 148 are in an `isMeta` record against 3 in a `tool_result` — exactly the false positive, an agent that merely read a `SKILL.md`, that the record constraint excludes. The mid-run value is grounded in the observed shape: a delivery record follows exactly one tool call (the skill invocation) in 608 transcripts, two in 7, and three or more in 67 — those last are runs that worked before they were handed the rule. Filtering record-by-record instead of run-by-run would truncate a run's read and write history at the boundary and let one run land in both cohorts.
**Tradeoff:** Gained: a cohort boundary that is evidence rather than inference, immune to install timing and to when a release was cut, and that says plainly when it does not know. Accepted: a smaller primary comparison than a binary split would have claimed, presence proves delivery and not compliance, and the needle must be revised whenever the shared block's wording is — which is why a block edit forces a classifier-version bump.
**Conséquences:** Only the five worker skills carry the block, so the comparison is within-command and `esq:build` is the primary row. `docs/EVIDENCE.md` is not involved: this is a claim about esquisse's own prompts, not about how Claude Code behaves.
**Alternatives rejetées:** Splitting on `3d78a04`'s timestamp — measures when a commit landed, not what an agent read. Splitting on the first release that carried the block — releases begin only at 0.3.1 on 2026-09-07, weeks after the rule shipped, and say nothing about a development checkout loaded with `--plugin-dir`. A binary present/absent test on the needle alone — treats 295 transcripts with no surviving delivery record as proof the agent never received the rule. Pooling mid-run deliveries into `ruleLoaded` — counts activity that preceded the rule as activity under it.

## D-redundancy-is-proven-from-the-delivered-range — Redundancy is proven from the delivered range, never inferred from the request

**Scope:** func
**Topic:** telemetry
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** Classifier v2 decided what an access delivered from the shape of the *request*: a `Read` with no `offset`/`limit` was taken as a whole file, and any slice inequality was published as `differentSlice`, a *classified legitimate* outcome counted as resolved. Both halves were unearned — a whole-file request can be truncated, and overlap between two slices is usually unknowable — and `cat SRC > DST` was recorded as a confirmed delivery of bytes the agent never saw.
**Décision:** Every access carries the range the result says it delivered — `startLine`, `numLines`, `totalLines` and `truncatedByTokenCap` from `toolUseResult.file`, and nothing else from that object. Containment then decides: the same access identity, or a new range provably contained in a prior confirmed delivery, is established redundancy; a range reaching lines the prior did not is `broaderAccess` and legitimate; everything else is `overlapUnknown` and **unresolved**. A segment whose stdout goes to a file is not a content access at all.
**Raison:** The evidence was already in every transcript and was not being read — 2000 structured `Read` records in this machine's store, 1138 of them a provably complete delivery and 862 provably partial. Reading it makes the whole-then-slice case provable instead of assumed, and makes the slice-to-slice case honestly unresolved instead of published as legitimate; v2's grouping inflated classification coverage with the largest class in the report. Every rule here fails towards *unresolved*, because under-counting an access can withhold a redundancy claim but can never manufacture one.
**Tradeoff:** Gained: a redundancy count the transcript supports, and a coverage figure that stops claiming the unprovable. Accepted: classification coverage falls against v2, the class set changes shape (`differentSlice` becomes two classes) so v2 and v3 documents do not share keys, and the instrument now reads one more field family out of a machine-wide store.
**Conséquences:** `CLASSIFIER_VERSION` is 3 and no v2 reading is comparable with a v3 one. `content` and `filePath` sit beside the four numbers in that object and are never read — the access path keeps coming from the call's own input, through the unchanged `realpath` publication boundary. Nothing reads a baseline automatically, so the changed key set breaks no consumer.
**Alternatives rejetées:** Demoting `differentSlice` to unresolved without reading the result — fixes the overstatement by discarding the provable cases with the unprovable ones, and still calls a redirected `cat` a delivery. Parsing the delivered range out of the result body — that body is absent from most records (43 numbered results across 250 transcripts against 2000 structured ones) and reading it would put file content in the classifier's hands for nothing.

## D-a-completed-phase-records-what-proved-it — A completed phase records what proved it

**Scope:** arch
**Topic:** build
**Date:** 2026-09-11
**Statut:** Active

**Contexte:** `esq gate verify` reuses a phase's `(auto)` result only against the `verified` block its execution-log entry recorded, and `LOG_ENTRY_SCHEMA` left that block optional on a `completed` entry — so a phase that ran its steps, judged them green and omitted the block was accepted in silence, and the landing re-bought the verification (B-137).
**Décision:** `esq plan append-log` refuses a `completed` entry that carries no `verified` block when the phase's own verification list names at least one resolvable `(auto)` command, naming that phase's commands and the field to add.
**Raison:** The omission is detected in the same call the worker was already making, while the evidence is still live and one `git rev-parse HEAD` from being written down — a later sweep would find it when the only honest repairs left are re-running the commands or fabricating them. The trigger is exactly the set a landing could reuse, so a phase with nothing to prove is asked for nothing, and the refusal reads the plan without writing it, joining the refusal class `appendLog` already documents as necessarily after the read.
**Tradeoff:** Gained: the omission-triggered rerun `Phase N recorded no verified provenance` used to force cannot be reached through this writer. Accepted: a published payload contract tightened, so a phase that cannot state both halves honestly must pause or fail rather than log a hollow `completed` entry.
**Conséquences:** The block is required, never its contents — `build/SKILL.md`'s two substitution exceptions mean the command honestly run may differ from the one the plan named, and nothing compares the two lists. `paused` entries keep the block optional: a pause released through `esq plan resolve-block` is already made to prove every owed command green, and a pause that stopped before judging its steps must stay able to say so.
**Alternatives rejetées:** Making `verified` `required` on `completed` in the schema — wrong for a phase whose verification is `(manual)` only or names no resolvable command, where it buys a fabricated list or a wedged phase. An `esq validate` finding or an audit sweep over `docs/plans/` — it reports a session later, when the worker that ran the commands is gone, and over history it flags entries nobody can supply evidence for.

## D-paid-rows-are-durable-before-the-next-one — A billed row's evidence is durable before the next row is spawned

**Scope:** arch
**Topic:** evidence-capture
**Date:** 2026-09-12
**Statut:** Active

**Contexte:** `scripts/lib/journey-runner.mjs` buffered every completed row's records in memory and wrote them once from `live`'s outer `finally`, while the `SIGINT`/`SIGTERM`/`SIGHUP` handlers it installs per row exit through `process.exit` — which does not run that `finally`. Interrupting row 2 of a billed run therefore discarded row 1's paid evidence entirely (B-136), the failure `openCapture` had already been built to prevent for the two probes (B-108).
**Décision:** The runner claims its capture destination before the first spawn and appends each completed row's two records through `openCapture` as that row settles; the aggregate remains a candidate promoted atomically at the end, from the assembled capture, only by a whole-registry run that earned it.
**Raison:** Durability stops depending on which exit path the process takes. A flush from the signal handler would cover only the exits someone remembered to handle — a throw, a `SIGKILL`, a crashed parent and a signal arriving between two handler installs all still lose the rows — and it would put the earned-or-not decision inside a handler that must stay bounded and synchronous while a process group is being torn down. Claiming up front also moves a lost `--out` race from after the spending to before it.
**Tradeoff:** Gained: no exit path can discard a row already paid for, and a taken `--out` refuses at zero billed runs. Accepted: a run with no `--out` writes its records twice — once to a `0700` journal, once to the promoted aggregate, the journal removed only after that promotion succeeds — and an interrupted run leaves that journal directory behind, unswept, because it is the evidence.
**Conséquences:** Both smoke consumers inherit this through the shared harness, so all four billed scripts now persist through `openCapture`. The interrupt handler writes nothing: it closes the descriptor, removes a claimed file it never wrote to, and prints where the kept rows are and that the run is incomplete. A partial capture still fails `judgeCapture`'s registry check, so replaying what survived reports the missing rows rather than a short green table. Two things follow that the runner did not have before: a sink that stops accepting records ends the run before the next paid row, because the next row's money would buy evidence with nowhere to go; and `keepElsewhere` is gone — it existed to move paid records somewhere after the fact, and they are now already there, so the unearned path names the journal instead of writing a second copy of it.
**Alternatives rejetées:** Flush the buffer from the interrupt handler — a guard on one door of a room with four, and it duplicates the write decision. Append straight into the aggregate and undo it if unearned — it holds a paid, checked-in capture open for writing for the whole run and puts the repair in exactly the code an interrupt prevents from running.

## D-executability-is-read-from-the-skill — A chosen `do:`'s executability is read from the target skill, not from a list

**Scope:** arch
**Topic:** orchestration
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** The three orchestrators spawned one `esq:apply` subagent on every chosen option's `do:` without asking whether a subagent may run it. Fourteen of the twenty-one skills carry `disable-model-invocation: true`, and `/esq:backlog B-NNN done` — the form a decision brief most often emits — is squarely in that set, so the spawn was wasted and the authorized decision went unapplied (B-092).
**Décision:** One read-only CLI verb, `esq apply route '<do>'…`, classifies each string and reads the answer out of the named skill's own `SKILL.md` frontmatter, resolved relative to `cli.mjs` so one path serves the checkout and the installed plugin. Its three routes — `apply`, `relay`, `stop` — are what the skills dispatch on, and nothing else.
**Raison:** A list of restricted skills written into a prompt or a script is stale the first time a flag moves, and B-092's own notes were already stale by one skill when the row was filed. Reading the flag at call time cannot rot. Putting the classification in the CLI also makes the half that must not be guessed — whether the string even *is* one clear `/esq:<skill>` invocation — deterministic and fault-injectable, where a prompt clause is only assertable.
**Tradeoff:** Gained: the restricted set has exactly one source, and the routing mechanism is testable with no model run. Accepted: one more subcommand and one subprocess per gate, plus a recognizer narrow enough that anything but a clear single invocation is a stop.
**Conséquences:** Recognition is deliberately bounded — one `/esq:<skill>` token at the start, no shell chaining — and every other shape, including an unknown skill or a frontmatter flag that is not a boolean, fails closed to `stop`. No caller may widen that by pattern-matching a command name, and a skill that gains or loses the flag needs no edit anywhere.
**Alternatives rejetées:** Telling the model to grep the frontmatter in prose — three carriers restating a lookup nothing can test, over a path that differs between a checkout and an installed plugin. A hard-coded list of user-only skills — the rot this decision exists to prevent. Keeping the spawn and letting the agent report its own refusal — the spawn is the waste, and it cannot make the change either way.

## D-a-relayed-decision-is-selected-until-state-confirms-it — A relayed decision is selected, not applied

**Scope:** arch
**Topic:** orchestration
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** With the relay in place, a gate whose chosen option only the user may invoke has an answer but no change: the decision is authorized, the command is unrun, and the 🔴 is still in the brief the next step reads. Something has to hold that state without either re-asking the user or proceeding as though the work were done.
**Décision:** `/esq:converge` writes one `Selected:` line into that 🔴 — the letter, the label and the literal command — commits it alone, prints the command and stops; the red stays. On resume that line is the answer, and the itinerary moves only when `esq apply route` reports the action's effect present in the tree (`applied: true`); `false` reprints the command and stops, and `null` says the state cannot settle it and hands off, erasing nothing.
**Raison:** Selected and applied are different facts, and conflating them costs in both directions: striking the red on selection makes the brief lie to the next reader, while leaving no record buys the user the same question again — the interrogation `One round per gate` already forbids. Resuming on observed state rather than on a claim keeps the authority where it belongs: the command that runs is the user's, and the evidence that it ran is the ledger's.
**Tradeoff:** Gained: no decision is asked twice, no red is closed before its effect exists, and no run proceeds because an instruction was merely displayed. Accepted: the corrective brief gains a line another reader could meet, and a relayed action the CLI cannot observe (`applied: null`) ends the run rather than resuming it.
**Conséquences:** The observable is computed only where structure allows it — an invocation naming a `B-NNN` and a status from `STATUSES`, compared against `docs/BACKLOG.md`. Everything else is `null`, which is a stop and never an optimistic resume; the brief's red is then the user's own to strike. A relayed gate adds no apply agent, so the run's stated subagent bound goes down rather than up.
**Alternatives rejetées:** Asking the user on resume whether they ran it — resumes on a claim instead of on state, and re-enters a gate that is already answered. Striking the red at selection time — the record the next reader needs, deleted at the one moment it becomes load-bearing. Substituting the CLI call or a hand edit for the user-only command — reaching the restricted end by another road, which is the restriction itself.

## D-a-phase-buys-each-proof-once — A phase's mandatory verification buys each proof once

**Scope:** arch
**Topic:** assurance
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** A completed plan in another repository declared, inside one phase, a jest run over four named test directories (22 suites, 580 tests, 148.972 s) *and* the same runner under the same `TZ`, `NODE_ENV` and `DATABASE_URL_TEST` with no path filter (62 suites, 1358 tests, 173.908 s). Both are `(auto)`, so both were obligations; `esq gate verify` enforced exactly the two it was given and both ran at the same landing, the first's 580 tests re-run inside the second's 1358. Nothing was broken — `/esq:plan`'s existing rules forbid a whole-repo suite copied into *every phase*, and say nothing about two commands standing side by side inside *one* set.
**Décision:** The redundancy is removed where it is created. Before a phase's `(auto)` set is final, `/esq:plan` reads what each command actually selects — the package script it resolves to, the paths and config deciding which tests run, the environment it sets — and prescribes the broader command alone when it already buys a narrower one's tests *and* its PASS criterion under equivalent conditions. It ships as a Verification-discipline rule and as self-audit check 8, which is why the pass is now nine checks. Both steps are kept whenever the narrower proves something the broader does not, and whenever inclusion cannot be settled by reading; a command's name is never proof of coverage.
**Raison:** Coverage inference from a command string is judgment, not structure — jest path filters, pnpm script indirection, `testPathIgnorePatterns` — and `plugin-runtime` keeps judgment out of the CLI. A gate that inferred containment and skipped a declared step would lower a correctness condition on every landing to save minutes on some; an authoring rule costs nothing at runtime and cannot drop an obligation that was never written. It is also where the reader has the evidence: the planner is already reading the scripts to resolve each command's referent.
**Tradeoff:** Gained: a phase pays for each proof once, forever, at every landing that plan ever runs. Accepted: it reaches only plans written from here on, and it is instruction text — the conformance guards prove the clauses are present in both carriers, they cannot prove a session applies them.
**Conséquences:** `esq gate verify` is untouched: exact-command matching, freshness, PASS-per-step judgment and unresolved-step conservatism all stand, a plan already written keeps every obligation it declared, and a broader command's PASS is never provenance for a command it does not literally match. The rule decides one phase's own set and never the plan's, so an earlier phase's targeted step survives a later phase's whole-repo run — the whole-repo-suite rule in `/esq:plan` and the blast-radius exception in `/esq:build` keep deciding that. Scenario P-08 pins the five cases.
**Alternatives rejetées:** Runtime subsumption in the gate or in `/esq:land` — unsound from a command string, and its failure mode is a silently dropped obligation. A CLI coverage cache or attestation — a second definition of what a command proves, stale the first time a config moves. Migrating historical plans — rewriting a completed plan to obtain reuse is the fabricated provenance the landing gate exists to refuse.

## D-a-manual-pause-records-what-proved-it — A manual pause records what proved it

**Scope:** arch
**Topic:** build
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** `D-a-completed-phase-records-what-proved-it` left `verified` optional on every `paused` entry, on the grounds that a pause which stopped before judging its steps must stay able to say so. That grounds holds for the blocked clause and not for the other one: a pause whose only cause is `manualOutstanding` is written by a phase that committed its code and judged every `(auto)` step PASS — `/esq:build` logs nothing at all for a red step, and a phase that also hit a same-unit defect pauses under `blockedBy` instead. So the one pause that always holds both halves of the evidence was the one allowed to drop them, and the hand-written header that later completed it lost them for good (B-152).
**Décision:** `esq plan append-log` refuses a `paused` entry that carries `manualOutstanding`, no `blockedBy`, and no `verified` block when the phase's own verification names at least one resolvable `(auto)` command — the same refusal, on the same trigger, that a `completed` entry already faces.
**Raison:** It is the earliest write boundary at which the worker still holds the results, and it costs a `git rev-parse HEAD` already run. Requiring it at the resume instead would ask a later session to re-buy commands the paused session had judged green, which is the rerun this whole line of work exists to stop.
**Tradeoff:** Gained: a manual pause can no longer reach `completed` — by any path — with nothing recorded of what it proved. Accepted: a phase that owes manual steps and cannot honestly state both halves must pause under `blockedBy` (the row its unrunnable step earned) rather than under the manual clause, and the refusal has to say so to be actionable.
**Conséquences:** The blocked clause keeps the block optional, unchanged. `esq plan resolve-block` therefore finds a manual pause already carrying its proof and, when git can still prove it, spends nothing to complete the phase.
**Alternatives rejetées:** Requiring `verified` on every `paused` entry — wrong for the blocked clause, which can legitimately stop before judging its steps. Detecting the omission at the resume — a session later, when the only honest repairs left are re-running the commands or inventing them. A sweep over `docs/plans/` — it flags historical entries nobody can supply evidence for.

## D-one-verb-resolves-both-pause-clauses — One verb resolves both clauses of a pause

**Scope:** arch
**Topic:** build-lifecycle
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** `esq plan resolve-block` owned the blocked clause and refused the manual one with `not-blocked`, handing it back to a reference that completed the phase by rewriting its heading in Markdown. That hand edit passes through no validator, so it could complete a phase with no provenance, with an open same-unit row, or with a manual step nobody observed (B-152).
**Décision:** The verb selects the paused entry by its `⏸` glyph and settles either clause: the blocked one exactly as before, the manual one on a `manual` payload naming every outstanding step exactly once with the observation that settled it. A step the payload does not name is a step judged FAIL, and its absence holds the pause; `not-blocked` is retired.
**Raison:** The freshness question at the resume is identical for both clauses and is already answered — `gateVerify` scoped to the phase, reuse what git can prove, run what it cannot, a red being a command omitted from `verified.commands`. A second verb would duplicate that judgment in a second place and would still need both to settle an entry paused under both clauses.
**Tradeoff:** Gained: one transition, one freshness implementation, and a manual pause that can no longer be completed by editing a heading. Accepted: the verb's name now reads narrower than what it does, and one published refusal code disappears from the prose that routes on it.
**Conséquences:** Automatic evidence never settles a manual step — the observations are a required, separate payload key — and an entry paused under both clauses is completed only once both are discharged, in one call or two.
**Alternatives rejetées:** A sibling `esq plan resolve-manual` — ~90% the same body, a second place for the rules to drift, a new entry in every doc contract listing the CLI's verbs, and two verbs to settle one entry. Routing the resume back through `append-log` — it refuses a phase that already has an entry, so it would have to grow an update mode in the more load-bearing writer.

## D-a-failure-shows-its-failing-test — A bounded run's failure diagnostic is its failing tests, not its last 40 lines

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** `check-bounded.sh` printed the last 40 lines of a suite's capture under every finding, which names a hang but scrolls the `not ok` line off any failure followed by more than 40 passing tests (B-090).
**Décision:** On a finding, extract the failing `not ok` lines and their YAML blocks from the capture already on disk, under a hard bound, and keep the tail only as the fallback when no failure line is found.
**Raison:** The failing line is the first words of a failure and the last words of a hang, so one window cannot serve both; the capture already holds the answer, and re-running `node --test` by hand to read it is paid work done twice. A line-shaped `awk` pass answers it without a TAP parser or a dependency inside the one script whose job is to not itself hang.
**Tradeoff:** Gained: the failing test, its file and its assertion on the first red run. Accepted: the extractor is heuristic, so an unrecognized shape degrades to the existing tail rather than to a better answer.
**Conséquences:** A diagnostic extractor may only narrow what is printed under an already-decided finding — never the exit code, the bound, or whether a finding is reported at all — and its fallback is proven by a fault injection that removes it.
**Alternatives rejetées:** A real TAP parser (generality nothing asks for, in the script that must stay simple and hang-proof); grepping the last `not ok` line alone (names the test but not the assertion, and loses one half of a nested failure).

## D-a-landing-runs-where-the-destination-lives — A landing runs in the checkout that owns its destination

**Scope:** arch
**Topic:** safe-shipping
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** `esq merge land` reached its destination with `git switch` in whichever checkout invoked it, and git refuses to check one branch out twice — so in the layout `/esq:worktree` itself creates, a source branch in a linked worktree beside its origin in the main checkout could not land at all. The refusal arrived *after* `/esq:land` had paid a four-minute `esq gate verify`, and the hand-off it printed named no directory, so re-running it where the user stood failed identically (B-154).
**Décision:** Which checkout owns the destination is a read-only fact computed once in `cli.mjs` from `git worktree list --porcelain` — carried on the branch verdict as `destination`, so the landing can stop on an unusable one before it spends anything, and re-resolved in-process by `esq merge land` from the origin it just read out of the plan header, which then roots `mergeBegin`, `mergeScan` and `mergeSeal` at that path.
**Raison:** The three verbs already do the whole merge correctly; what was wrong was only *where* they ran, so moving the root reuses every reconciliation, refusal and abort rather than adding a second implementation. Resolving it on the verdict costs the landing no round trip — it already reads that verdict in preflight — and re-resolving it at the write keeps the merge engine's own rule that no value a caller resolved earlier is trusted across the window before a git write.
**Tradeoff:** Gained: the normal worktree layout lands, and an unusable destination refuses in seconds with its real path and one command that clears it. Accepted: two working directories are in play during one merge, so the abort path must restore the destination worktree's branch rather than the invoking one, and the fixtures have to assert both checkouts on every refusal.
**Conséquences:** The merge moves; the verification does not — `esq gate verify` stays rooted at the invoking checkout and against the source tree, and a caller that ever handed it the destination path would verify the destination's older code. A worktree that is dirty, locked, prunable, on another branch, or not provably the same repository is refused and never repaired: nothing detaches, switches, unlocks or removes a checkout the run does not own.
**Alternatives rejetées:** Refusing early and never landing — it removes the wasted audit but leaves the layout `/esq:worktree` creates permanently unable to land, finishing every merge by hand. Merging in place off the source checkout, by `git switch --ignore-other-worktrees` or a detached-HEAD merge pushed onto the destination ref — it overrides the exact guard that stops two checkouts fighting over one branch's index, and leaves the other worktree's `HEAD` no longer describing its tree, for the length of a merge that can be held open on a conflict.

## D-a-step-declares-what-it-reads — A verification step declares what its command reads

**Scope:** arch
**Topic:** assurance
**Date:** 2026-09-13
**Statut:** Active

**Contexte:** `esq gate verify` invalidates every command of a unit on any changed path outside a short command-owned lifecycle list, whatever that command actually reads. Measured at the `land-resolves-its-worktree` landing (`HEAD` `28e6daa`): four required commands, four runs, and `node --test tests/cli/merge.test.mjs` — proved at `0893d89` — was invalidated only by `README.md`, `commands/esq/land.md`, `docs/ARCHITECTURE.md`, `docs/CONFORMANCE.md`, `plugin/skills/land/SKILL.md`, `scripts/check-conformance.sh`, `scripts/test-conformance-guard.sh` and `tests/cli/worktree-landing.test.mjs`, none of which that suite reads.
**Décision:** An `(auto)` step may carry a trailing `(reads)` declaration naming the repository paths its command reads; `esq gate verify` narrows that one command's invalidation set to those paths, and to nothing else.
**Raison:** What a command reads cannot be read soundly off a command string — the same objection that closed coverage subsumption at the gate (`D-a-phase-buys-each-proof-once`) — so the answer comes from the party that can read the command and its imports, at the moment the obligation is created. The CLI parses, validates and intersects; it never guesses. The conservative default is the absence of a declaration, which is every plan already written.
**Tradeoff:** Gained: a command whose inputs the unit never touched stops being re-bought at every landing, and the run reason now names the whole invalidating set so the next declaration can be written truthfully. Accepted: a declaration that is wrong under-verifies, and no mechanical guard can read that it is wrong — bounded by making it opt-in, by refusing a declaration that does not cover the command's own path operands, and by an authoring rule that withholds it whenever reading does not settle the answer.
**Conséquences:** Exact-command matching, the PASS-per-step criterion, the unresolved-step conservatism and the refusal to credit one command's PASS to another are all untouched — only which changed paths count against one command's own proof moves. A declaration lives above `## Execution log`, so editing one stales that plan's own proofs through the rule already there. `workersMoved`, missing or movable provenance, an unresolvable commit, an unreadable diff and a command absent from the green list all still force a run before scoping is consulted, and the honoured set is always a subset of what survives today's exemptions, so no reuse that exists today can become a run.
**Alternatives rejetées:** Inferring the inputs from the command string — a dynamic import, a runtime fixture read, a shelled-out binary or an unnamed config file each makes the inferred set a subset of the real one, and the failure mode is a silently dropped obligation rather than a red. A repository-level map of command pattern to inputs — nothing ties an entry to a step, so it drifts silently, and the map itself would have to invalidate everything. Recording an already-earned result, or reordering the final edits before verification — neither reaches the measured case, because no run re-proved that command after its phase and the invalidating commits come after the proof by construction.

## D-a-reference-declares-its-call-sites — A reference declares the call sites that must load it

**Scope:** arch
**Topic:** skills
**Date:** 2026-09-14
**Statut:** Active

**Contexte:** `/esq:plan`'s entrypoint reached 499 lines of a hard 500-line cap at 9,569 words, all of it loaded on every planning run, while roughly 1,100 of those words serve paths an ordinary backend plan never takes — the opt-in `(reads)` declaration, whose own text says its absence is the default, and the UI/screens material. B-3000 and B-156 recorded the same wall from two different ships. The sanctioned relief, progressive disclosure into `references/`, carried a known silent failure mode: `check-skill-parity.sh` reads a split skill one-directionally (B-089) and `check-conformance.sh` resolves a skill to `<root>/<name>/**/*.md`, so a needle is answered by a file the reached path never opened and the check stays green — which is how `build`'s blocked→paused route shipped with its reference load missing and was caught by reading on 2026-09-13.
**Décision:** The conditional half of a planning payload is disclosed into `references/`, and every reference file declares the entrypoint call sites that must load it in a `<!-- loaded-at: … -->` header, which `scripts/check-refload.sh` verifies verbatim — plus a load imperative at every naming site and no orphan reference — over every skill carrying a `references/` directory. `check-skill-parity.sh`'s split layout becomes a named list of skills rather than a single `build` exception, and the 500-line cap is not raised.
**Raison:** Compression alone tops out at what is genuinely duplicated — the measurement narratives `docs/DECISIONS.md` already holds — and leaves the conditional words on every path; extraction without a guard adds a second skill to a layout whose failure mode is documented and already realised once. A declared call site is the repo's own conformance idiom applied one level down: the literal a reference names is the sentence whose removal is the defect, so the check reds where the route actually is instead of where a recursive grep can reach.
**Tradeoff:** Gained: an ordinary planning run stops buying the UI material and an optimization it is not using, the next rule added to `/esq:plan` has somewhere to go, and a removed reference load reds the build for the first time. Accepted: a UI or manual-step plan pays one extra read and one extra turn; `plan` trades byte-exact legacy parity for the line-presence rule `build` already uses; and the guard cannot see a route nobody declared — no static check can, so that half stays in `docs/AUDIT.md`'s reading pass.
**Conséquences:** The user-question procedure stays inline on purpose — `shared:escape-hatch` has four carriers, `ask-altitude` is hashed identical across `plan`, `grill` and `ui`, and four routes reach it, so four routing instructions against 395 words is not a saving. Coverage of the new check is opt-out rather than enrolment, so `build`'s six references declare their call sites in the same ship. `docs/SPEC.md` § Planning is untouched: what `/esq:plan` does for a user does not change, only how much instruction text it reads to do it.
**Alternatives rejetées:** Raising the `-lt 500` cap — it answers the line count and not the payload, which is what a run is billed for. A directory-wide text-presence parity rule for all twenty-one skills — it replaces exact parity with a check that cannot tell a moved clause from a deleted-and-retyped one, for the benefit of skills that are not split. Extracting the user-question procedure — its shared blocks belong to other carriers and its routing would cost more than the text it moves. Trusting `check-conformance.sh` to prove reachability — its recursive resolution is precisely why it cannot.

## D-review-scope-is-one-deterministic-query — A review's scope is resolved by the CLI, not re-derived in prose

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-14
**Statut:** Active

**Contexte:** `/esq:review`'s preflight steps 3–5 were 387 words of deterministic procedure the model re-walked on every review: eleven metadata subject prefixes to filter, a `brief(fixes): <slug>` history grep, a `git show` of a brief out of a commit that may since have deleted it, an exact `Source:` comparison, a second anchored grep for `^plan(reviewed): <slug> at `, a `git show` of the plan out of that commit, a header field read, two ancestry checks and a newer-of-two pick — then the changed paths. `D-review-delta-base-is-a-reviews-own-record` rejected a CLI verb for exactly this as "a new public surface for a two-candidate history read already in skill prose"; the `build-cites-rather-than-recites` unit then ran the prose three times (initial review, a review after `/esq:fix` had deleted the brief, a bookkeeping-only re-review at landing), and the failure mode it risks — a base one commit too new — leaves shipped code unreviewed with no symptom in the report it produces.
**Décision:** `esq review scope <plan> [--full]` is read-only, always exits 0, pins `HEAD` once and answers `{mode, base, provenance, reason, candidates, commits, paths, diff}`; `/esq:review`'s preflight calls it once and routes off `mode`, carrying no procedure for candidates, ancestry, metadata filtering or path resolution. The rule it computes is `D-review-delta-base-is-a-reviews-own-record` verbatim: a review brief's stamp kept only on an exact `Source: /esq:review on <slug>,`, the `**Reviewed at:**` of the newest `^plan(reviewed): <slug> at ` commit, a `plan(converged):` record never a candidate, a non-ancestor candidate dropped, no candidate meaning full scope. `mode: "unresolved"`, a non-zero exit and no `esq` at all route to one place — full scope, resolved the way the command always did, and said in one line.
**Raison:** The rule is worth keeping exactly and worth nothing as prose. It is a rule whose violation is silent, so it belongs where a fault injection can fire on it rather than where a model re-reads it; the fixtures that now pin it (a deleted brief, a sibling `-fixes` candidate, an unresolvable stamp, a non-ancestor stamp, a later converge stamp over unreviewed fix code, a bookkeeping-only delta) are assertions no amount of prose can make. The public-surface objection is answered by scope rather than argued with: one read verb, no write, no verdict, no `set-reviewed`, and every failure conservative in the widening direction.
**Tradeoff:** Gained: one model-facing call where a review made six or more, the mechanical rule under test, and 387 words off the loaded path of the one command that reads a whole diff. Accepted: a new public CLI surface, and a review whose scope now depends on the CLI being present — which is why absence is a named full-scope fallback rather than a refusal.
**Conséquences:** Scenario R-08's re-review clauses are about the resolved answer and the conservative fallback rather than about the model's history read, and `scripts/check-conformance.sh`'s two `review` needles moved with them; `/esq:converge`'s needle is untouched, because its distinct commit subject is still the mechanism. `esq branch check`'s `coverage` is still not a delta base and must never become one: `unitCoverage` reads `**Reviewed at:**` whoever wrote it, `/esq:converge` included. `docs/SPEC.md` and `docs/ARCHITECTURE.md` still describe the prose procedure; they are `/esq:spec`'s and `/esq:arch`'s alone and go stale until refreshed.
**Alternatives rejetées:** Keeping the prose and adding the verb beside it as an optional accelerator — the procedure stays loaded on every review, so the cost is still paid in words, and one rule with two implementations is the drift `docs/AUDIT.md` exists to catch. Folding the base into `esq branch check`'s `coverage` — it is the wrong fact twice over: it reads a field `/esq:converge` also writes over fix commits no review read, and it answers for the shipping unit where a review's scope is one plan's. Letting the verb record the clean verdict when the filtered range is empty — a review that opened no file has judged nothing, and coverage is a judgment.

## D-a-conformance-needle-lives-in-both-trees — A conformance needle may only name text both trees carry

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-15
**Statut:** Superseded by [D-the-audit-reads-the-shipped-tree] on 2026-09-22 — the constraint it imposed was that a needle name text the flat legacy mirror carries too, and there is no second tree to carry anything. A needle may now name text that exists only under `plugin/`, including a load line, so the residue this entry accepted (a plugin-only line with no mechanical guard) is closed rather than documented. Kept rather than deleted: its division of labour still holds — check 24 asks whether the contract is stated, `check-refload.sh` asks whether the route that needs it opens the file.

**Contexte:** Moving `build`'s failure procedure into `references/failure-and-recovery.md` added three lines that exist only under `plugin/`: the mandatory named load in `SKILL.md` and the two reminders in `references/manual-verification.md` that restate it for the routes reaching the procedure from inside a reference. The obvious way to protect them was a `docs/CONFORMANCE.md` needle, and it does not work: `scripts/check-conformance.sh` resolves each clause against the carrier *in the tree it was handed*, and audit check 24 hands it both `commands/esq` and `plugin/skills`, so a needle naming plugin-only text passes natively and reds the legacy mirror. Nothing in the check says so — the finding it prints is `build lost <label>`, which reads as a deleted clause rather than as a needle that could never have been satisfiable.
**Décision:** A needle is only ever a sentence the flat legacy mirror carries as well, which for a split skill means a sentence that was *moved between* the carrier's files rather than *added* to one of them. Text that exists only under `plugin/` is pinned by `scripts/check-refload.sh`, the check that reads the native tree alone, through the `<!-- loaded-at: … -->` declaration its reference carries. Scenario U-14 is written on that division: its eleven needles pin the behavior the move had to preserve — the conditions that classify a failure, no auto-revert, no execution-log entry over a failure, the notification ahead of the prompt, one round per gate, the orchestrator fallback — and its Runtime-evidence paragraph names the load site as `check-refload.sh`'s business, including the reference-side sites that check structurally cannot pin.
**Raison:** The two checks have different corpora because they answer different questions, and that is worth keeping rather than papering over: check 24 asks whether both shipped trees still state the same contract, which is meaningless for text one of them cannot have; check 59 asks whether the native package's disclosure is reachable, which is meaningless for a flat file with no references at all. Trying to make either cover the other's ground produces a check that is green for the wrong reason.
**Tradeoff:** Gained: a rule that says where a new clause's guard lives before the clause is written, so the next split does not discover it from a red legacy corpus. Accepted: a plugin-only line that is neither a declared load site nor near one has no mechanical guard at all — which is exactly B-160, filed rather than hidden.
**Conséquences:** Every future disclosure into `references/` should expect its *routing* text to be guarded by the declaration and its *rules* by needles, and a plan that promises a conformance needle for a load line is promising something the suite cannot deliver. `docs/AUDIT.md`'s reading pass keeps the residue: a reference-side load reminder, which no declaration is looked for outside an entrypoint.
**Alternatives rejetées:** Adding the new lines to `commands/esq/build.md` so a needle could name them — the legacy mirror carries no `${CLAUDE_SKILL_DIR}` path anywhere and describing a plugin load in a flat command file would be false. Running `check-conformance.sh` against only the native tree — check 24's whole point since 2026-08-26 is that the legacy mirror being valid does not save the commit, and narrowing it would drop 233 clauses of legacy coverage to protect three lines. Teaching `check-refload.sh` to accept a declaration satisfied by a reference file — the declaration exists to pin *where the route is*, and a route that only ever points at another reference is the orphan case that check already refuses.

## D-build-asks-the-cli-for-its-plan-context — Build asks the CLI for its plan context, in one response

**Scope:** arch
**Topic:** build
**Date:** 2026-09-15
**Statut:** Active — corrected 2026-09-15, same day, on two counts before independent review: the selected `⏸` entry is now taken from the verdict this same response carries rather than re-derived by a helper with a different priority (the two disagree on a log appended out of phase order, and the response named one pause while shipping another's body), and the cost claims below are restated as *prescribed read stages* rather than observed model-facing tool calls, with `build`'s always-loaded instruction growth added to the accounting. The Phase 1 execution-log entry is left as written; this line is what supersedes its cost framing.

**Contexte:** `/esq:build`'s preflight bought the plan file's context in two dependent stages. The `shared:log-skeleton` grep named `L` and `A`; only then could the reads that depend on them go out — the plan section `1 → L+1`, any appendix `A → EOF`, the newest execution-log entry and a `⏸` entry outside it — and beside them the *Deterministic CLI* block already spent a third call on `esq next-phase`, whose answer the worker then re-derived from the grep output in "Identify the next phase". Every boundary being derived was one `parsePlan` had already computed and discarded: `lines`, `logIndex`, `logEnd`, `phases`, `entries`, with `logEntrySpan` and `pausedPhase` beside them in `cli.mjs`. Measured on three representative plans, the procedure as *written* prescribes 3, 4 and 5 shell/read operations across **two** dependent read stages, because the second stage cannot be issued until the first has answered (B-161).
**Décision:** `esq next-phase <plan> --context` returns the existing classification plus a `context` object — `phases` with each phase's entry status, `completed`, `log` (`line`, `end`, `appendix`), and `sections`: the selected source text in document order with 1-based `from`/`to` ranges, as `plan`, `entry` (roled `newest`/`paused`) and `appendix`. **The `⏸` entry a context carries is the one `nextPhase` selected for that same response** — handed to the context builder, never re-derived — so the verdict and the text under it can never name different phases. The plan is read once for it, the flag is opt-in and the unflagged response is untouched. `/esq:build` routes through it after `esq branch check` and before anything else, and the `shared:log-skeleton` block stays verbatim as the CLI-unavailable fallback. **Amended 2026-09-15 by [D-the-plan-slice-stops-before-an-entry-heading]:** the `plan` section is no longer `1 → L+1` unconditionally — it ends at `L`, extended by one line only when that line is inside the log span and does not open a `### ` heading, so on an anchorless log the first entry's heading stays with its own `entry` section instead of being eaten by the plan slice. Which entries are selected is unchanged; the `from`/`to` values returned for an anchorless log are not.
**Raison:** The second stage is a data dependency, not a batching failure — the slice boundaries *are* the grep's output — so no instruction about batching can collapse it while the procedure is written as "grep, then read what it told you". That is a claim about the prescribed procedure, not about an unavoidable bill: a worker could in principle chain the whole derivation inside one shell call, so the two stages are what this command asks for rather than a measured floor on billed round trips. The CLI already owns every definition involved; returning the text it selected rather than the coordinates a worker must then act on is the same "the CLI owns structure, the model owns judgment" division applied to a read. Nothing about *which* text is selected changes, so B-017's and B-019's narrowing (D-narrow-the-read-not-the-plan-file) is carried forward rather than re-argued.
**Tradeoff:** Gained 3–5 prescribed operations collapsed to one and two prescribed read stages to one, with the skeleton grep's own output no longer in the response (net −124 to −427 response words). **Paid for in two places, and the total is net growth.** The response itself is 435–649 bytes larger JSON-escaped (+0.5% to +2.4%); and `plugin/skills/build/SKILL.md`, which every phase of every plan loads whichever route it takes, grew **+475 words / +2,798 bytes** (9,379 → 9,854 words) to carry the new route beside the retained fallback. Full source-plus-response accounting per route — first phase, later phase, paused — is **+351 / +64 / +48 words** and **+3,400 / +3,233 / +3,447 bytes**. These are source and response sizes, not token, dollar or latency measurements. Also accepted: a second documented route in `build`'s preflight, and the fact that nothing mechanically checks the skill's prose against the keys the CLI emits (B-162).
**Conséquences:** A field a future phase agent needs must be reachable *both* ways — added to `context` and locatable by the skeleton expression — because the fallback is a real route, not decoration. `/esq:autopilot` is untouched: it carries the block as its own route and reads artifacts on its own thin loop. A consumer that only wants the classification keeps calling the verb unflagged and pays nothing for this.
**Alternatives rejetées:** A new top-level `esq plan context <plan>` verb — build would call two verbs for one question, which is the second stage again unless the new verb also classifies, at which point two answers exist for one question. Batching the grep with the slice reads — impossible, the boundaries are the grep's output. Caching the context across invocations — a phase per invocation with `/clear` between them means there is nothing to cache, and a cache would convert "decide from the execution log" into "decide from what I remember", which D-one-skeleton-grep-two-carriers already rejected. Returning `parsePlan`'s raw `lines` — that is the whole-file read this route exists to avoid.

## D-the-plan-slice-stops-before-an-entry-heading — The plan slice carries the anchor, never an entry's heading

**Scope:** arch
**Topic:** build
**Date:** 2026-09-15
**Statut:** Active

**Contexte:** `contextSections` took the plan section as `1 → L+1` unconditionally, the extra line existing to carry the reserved `<!-- Appended by /esq:build … -->` append anchor. On a log with no anchor, line `L+1` is the first execution-log entry's own `### Phase N — …` heading, so the overlap trim started the `entry` section one line late — and where the entry was heading-only, the trimmed span was empty and the section was dropped entirely. Both build carriers describe an `entry` section as the entry "verbatim, continuity field and hand-off text included", and "Identify the next phase" classifies a pause off its heading line, so on an anchorless log the response matched neither sentence. Reproduced on five fixtures before the correction was written (`/esq:check` on build-reads-its-context-once).
**Décision:** The plan section ends at `L`, extended by exactly one further line only when that line lies inside the log span and does not match `^### `. The anchor is carried whenever it exists; an entry's heading never is, so every selected `entry` section begins with its own heading.
**Raison:** Three promises the context makes — the whole plan section, entry slices verbatim, no duplicated lines — can all hold at once, but only if the plan slice's end is a condition rather than a constant offset. Making the entry re-include a heading the plan slice already carried would break the third; giving the anchor its own section kind would widen a public surface for one line of boilerplate on the case that was never broken. The condition is the only one of the three that leaves the anchored and appendix controls byte-identical, which is what makes "nothing else moved" checkable.
**Tradeoff:** Gained a boundary whose stated contract is true of every input `esq plan append-log` accepts rather than only of the ones `/esq:plan` authors. Accepted that the plan section's end is no longer a constant offset from `L`, so the carriers have to state the condition, and that the `from`/`to` values returned for an anchorless log change — the response shape does not.
**Conséquences:** A future section boundary in this response is stated as a condition over the file, never as an offset assumed from a heading. `esq plan append-log` still does not require the anchor comment, deliberately: the correction is on the reader, and tightening the writer is a separate change with a different blast radius.
**Alternatives rejetées:** Stopping the plan slice at `L` always and emitting the anchor as a fourth section kind — widens a public surface every consumer must learn, and changes the shape of the case that was never broken. Keeping `1 → L+1` and letting each entry re-include its heading — trades a missing line for a duplicated one, and a phase agent reading both sections in order sees the `⏸` clause twice.

## D-replay-built-change-above-plan — A change built outside a plan ships by replay above its plan commit

**Scope:** infra
**Topic:** review
**Date:** 2026-09-16
**Statut:** Active

**Contexte:** The bookkeeping-on-demand change was implemented and audited directly on `esq/bookkeeping-loads-on-demand` (`c6a362f`, `d5419fb`) with no plan, so it had no shipping unit, no recorded `verified` provenance and no review route. `reviewFullBase` resolves a review's base to the plan's own `plan: <slug>` commit and reviews `base..HEAD`, so where the plan commit sits decides what the independent review sees.
**Décision:** Cut `esq/ship-bookkeeping-on-demand` from the same base (`main` at `0a87ebb`), commit the plan first, and have its one phase cherry-pick the two commits in order, correct on top, and record the audit through `esq plan append-log`.
**Raison:** A plan committed after the implementation puts the implementation below the review base, and the review then covers only the corrections — the loading change, the block move and the guard updates would ship unreviewed. Replaying keeps the source branch and its hashes intact, which the session report and the invoking notes both cite. `main` had not moved, so the replay applies to the identical tree.
**Tradeoff:** Gained a review range covering the whole change and genuine provenance without rewriting history. Accepted one extra branch, two replayed commits, and a replay precondition check (base unmoved, no duplicate backlog ID) in the build phase.
**Conséquences:** Any future change built ahead of its plan ships the same way: the plan commit must precede the work it describes, because the review base is read from it. A plan written after its work, on the same branch, is a plan whose review is silently partial.
**Alternatives rejetées:** Planning on top of the existing branch — cheapest, but `/esq:review` would never see the implementation. Rebasing the source branch to slide the plan commit under the work — the same range, but it rewrites commits that are already cited elsewhere, for a saving of one cherry-pick.

## D-resolve-block-selects-through-nextphase — The pause resolver reads the phase build selected

**Scope:** func
**Topic:** pause-resolution
**Date:** 2026-09-16
**Statut:** Active

**Contexte:** `resolveBlock`'s read path picked a pause through `pausedPhase` (log insertion order) while `/esq:build` routes through `nextPhase` (phase order); a log with two pauses appended out of phase order made them name different phases (B-164).
**Décision:** Without a payload, `resolveBlock` derives its phase from `nextPhase(plan)`, maps its throw to `malformed-entry`, and `pausedPhase` is deleted; the `--confirm` path keeps `payload.phase` unchanged.
**Raison:** One classification is the fix `D-build-asks-the-cli-for-its-plan-context` already applied to `planContext`; a second sort would be a second priority rule that can drift again. The confirm path keeps its identity so no payload is silently retargeted and no new authority rule is invented.
**Tradeoff:** Gained a resolver that cannot disagree with build. Accepted that a confirmation naming a non-selected paused phase still resolves it, as before.
**Conséquences:** Any future consumer asking "which pause" consumes `nextPhase`'s verdict; none walks `plan.entries` for priority.
**Alternatives rejetées:** Sorting inside `pausedPhase` — duplicates the priority rule. Passing the verdict in from the dispatcher — widens a one-caller signature and moves malformed-plan handling away from the refusal codes.

## D-unclassifiable-do-is-quoted-never-handed-off — An unclassifiable action is repaired on confirmation, never handed off

**Scope:** func
**Topic:** orchestration
**Date:** 2026-09-16
**Statut:** Active

**Contexte:** A chosen `do:` mixed a deferred `/esq:spec` step with the present action. The router correctly stopped, but `/esq:converge` then told the user to run the deferred command immediately; consumers lacked a `stop`-specific recovery path.
**Décision:** The shared `decision-block` requires a `do:` to settle only the present decision, with deferred work in its consequence and a verified, entry-scoped acceptance for keeping what exists; on a `stop` pick the orchestrators never hand the string off as a command, but inspect only what the chosen option names and propose a repair of that same action (keeps · now · deferred · verify · does not) for confirmation — a present action only the user may invoke is proposed as that command and relays, never respelled to route `apply` — with `converge` recording `Selected:`, `Repair approved #n` (naming any approval it supersedes), `Paused:` and `Repair failed #n` as append-only brief history whose last line is the effective state on resume, so an approval followed by a pause runs nothing until a replacement is approved and neither the original nor a malformed repair is routed twice — while the existing apply agent verifies against the named decision entry and code state, reusing recorded evidence rather than re-running an untouched suite, before striking the red.
**Raison:** The user owns the product choice; repairing its malformed action is procedural work esq owns, and a confirmation keeps a repair from being a silent substitution. An append-only history read from its last line makes resume follow the current authorization rather than the oldest one, and reusing the apply path adds no worker and keeps the strike behind verification.
**Tradeoff:** Gained: no inferred prerequisite or timing change, no user-composed edits or manual brief surgery, no new normal-path call, worker or CLI surface. Accepted: a narrow new permission for orchestrators to compose one procedural action, a bounded read batch and one question on the rare `stop` path, about 0.5 KB per decision-block carrier and 2–4 KB per orchestrator, `autopilot`/`advance` holding no history (an applied repair survives by its commit; a pause or unapplied approval lives only in that run's report), the history being prose-parsed rather than CLI-parsed, and guarantees that stay lexical until a billed journey observes them.
**Conséquences:** Any new consumer of `esq apply route` gives `stop` its own record, confirmed repair, pause and `→ Next`; any new option-set author follows the present-action clause. U-13 pins both; the conformance engine's `refuse` clause keeps the combined relay/stop sentence from returning, and two swap-tested orderings pin record-before-ask and replacement-first resume. Nothing project-specific enters skill text.
**Alternatives rejetées:** Teaching the router timing — a natural-language parser in a CLI that owns structure, never judgment. Re-spawning the finder — paid work redone and an option the user never picked. "Settle the gate yourself" (first version) — the user diagnoses and hand-edits the brief. A repair free to respell any action as an edit (third version, pre-build) — would let a user-only command be reached by another road. Precedence of the first approval over later lines (third version) — an older approval would override a later pause and a malformed repair would be routed on every resume. A user-written clarified action (second version) — the user composes a file edit in router-acceptable syntax, and a repository-wide grep proved nothing about the specific decision.

## D-a-repair-is-routed-as-the-action-taken — An approved repair is routed, verified, closed and counted as the action actually taken

**Scope:** func
**Topic:** orchestration
**Date:** 2026-09-17
**Statut:** Active

**Contexte:** After D-unclassifiable-do-is-quoted-never-handed-off shipped, `/esq:check` and `/esq:review` found its apply worker still told the malformed original and its verification, a relayed repair re-relayed forever on resume, a failed repair free to re-propose within one run, bounds that counted a stopped gate as spawning nothing, and converge 555 bytes over its 4.0 KB bound.
**Décision:** Ordinary apply sends the chosen `do:`; repaired apply sends the approved replacement, its `verify:` alone and the deferred boundary, keeping the original as history (quoted in converge's `brief(decided):` body); converge resumes a relayed repair through `esq apply route` on the replacement and strikes the red itself only on `applied: true`; a repair that routes `stop`, cannot apply or fails verification stops the attempt, with a replacement proposed only on a later user-chosen resume; every bound adds one apply agent per decision only when the approved action routes `apply`; growth stays within 4.0 KB of 13eddfb per orchestrator carrier over the whole unit.
**Raison:** Each route has one worker input, one proof, one completion and one cost, so the bound stated before spending is the one paid. Observed completion reuses the CLI already trusted for plain relays instead of buying a worker, and stopping on failure keeps a malformed repair from becoming an unbounded loop.
**Tradeoff:** Gained: no worker applying the wrong string, no endless relay, no in-run repair loop, bounds that match spending. Accepted: the orchestrator's strike authority extends to relayed repairs, a wording-only trim to meet the budget, and guarantees that remain lexical until a billed journey observes them.
**Conséquences:** Any new consumer of an approved repair routes the replacement, never the original, and states its bound by route. U-13 refuses the retired "propose a replacement", "adds no agent at all" and "Only the apply agent strikes" sentences.
**Alternatives rejetées:** One plan per finding — five audits over shared carriers. Re-proposing within the run — the loop finding 3 names. Measuring the bound per task — the redefinition finding 4 names. A permanent audit check for the byte budget — its 13eddfb baseline is meaningless once the unit lands.

## D-instruction-budget-trims-rationale-before-obligations — An instruction budget trims older rationale before an obligation or the bound

**Scope:** arch
**Topic:** instruction-budget
**Date:** 2026-09-17
**Statut:** Active

**Contexte:** `unclassifiable-do-never-handed-off-fixes` Task 1.3 had to bring converge within +4000 bytes of 13eddfb by trimming only this unit's own wording. It stopped at +4309, because everything left was an obligation, a conformance needle, a brief line format or the shared decision block.
**Décision:** The user chose to cut three pre-13eddfb rationale clauses in converge, keeping the U-04 needle sentences they follow, rather than pause and re-plan the bound (b58753d).
**Raison:** Rationale explains a rule and does not impose one, and `skill-authoring` already says an entrypoint cites its evidence rather than recites it. Cutting it preserves every obligation and the bound. Moving the bound was the redefinition the check brief had flagged.
**Tradeoff:** Gained a met bound with no obligation lost. Accepted that converge no longer says why `/esq:fix` needs the red closed or what a finder re-run costs.
**Conséquences:** A later budget overrun should look first for rationale that can be cited instead of recited, then for the plan's source limit, and never cut a needle or an obligation. The bound is reported as measured over the whole unit.
**Alternatives rejetées:** Pausing the phase to re-plan the bound (costs a session and moves a bound the user kept). Cutting a needle or obligation (forbidden by the plan).

## D-failed-verification-commits-nothing — A change that fails its verification commits nothing, repair or not

**Scope:** func
**Topic:** corrective-loop
**Date:** 2026-09-17
**Statut:** Active

**Contexte:** `/esq:review` found that no apply-worker template said what to do when the change fails its verification, so a failed repair was committed and its 🔴 struck (unclassifiable-do-never-handed-off-fixes-fixes).
**Décision:** Every worker template commits — and in converge strikes — only once the verification passes, for any approved action. A change that cannot be applied makes no edit. One that fails its verification stops: nothing committed, nothing struck, nothing reset, restored, cleaned or discarded, and the failure and the edits left are reported. Each orchestrator branches on "could not apply or verify": converge and autopilot stop, and advance walks on only over a clean tree, so failed edits are its dirty-tree halt. Amended by the user before Phase 1 ran, replacing "change nothing", which only a revert could honour.
**Raison:** Committing a change that fails the verification its own item names is the same defect whether the action was a repair or the option picked. One clause for both is also fewer bytes than a repair-scoped one, under a bound converge is already at.
**Tradeoff:** Gained: no path commits an unverified change, and no path destroys work — the worker's or anyone's already in the tree — to look clean. Accepted: an ordinary option with a wrong named verification now stops the run instead of landing, a failed apply leaves a dirty tree for the user, and advance halts its walk there.
**Conséquences:** "Ordinary apply is unchanged" holds for what the worker receives, not for its failure path. A failed repair still records `Repair failed #n` in converge.
**Alternatives rejetées:** Scoping the clause to repairs (leaves the defect on ordinary options, costs more bytes); stating it only in the shared block (the worker never receives it); "change nothing" on a failed verification (only an automatic revert satisfies it, which can discard pre-existing work); advance recording the failure and walking on (the next item would commit over the failed edits).

## D-a-question-needs-a-missing-authority — A question needs a missing authority, not a topic

**Scope:** arch
**Topic:** escalation
**Date:** 2026-09-17
**Statut:** Active

**Contexte:** The user delegated engineering and UI/UX implementation detail explicitly, yet `ask-altitude` sorted questions by topic (UX, architecture → theirs), the decision block admitted a diagnosis between two causes as a 🔴, review/check asked on every spec difference, build stopped for the user on every red test, and land handed promised rows back undiagnosed.
**Décision:** One threshold, carried in place of the old sentences by `ask-altitude` and the decision block: look in the mandate, code, approved plan and Active decisions first; ask only when a named, unrecorded preference or authorization would change product outcome, scope, a major architecture commitment, a stated constraint, or a consequential cost or risk not authorized — and a failure or missing evidence is reported as a diagnosis with its action, never as a choice.
**Raison:** The threshold has to hold where a 🔴 is born; filtering at the relay leaves attended runs asking and makes an orchestrator judge a diagnosis it never made. Replacing the two existing blocks reuses the hashes that keep their copies identical instead of stacking a third block.
**Tradeoff:** Gained: fewer unjustified interruptions in attended and unattended runs, with the user's authority unchanged on limits, promised capabilities and incompatible intents. Accepted: build spends one repair attempt per phase per invocation on its own diagnosis inside the planned approach, files and criteria — verified before commit, leaving edits uncommitted and nothing logged when it fails — and the evidence is lexical until a billed journey observes it.
**Conséquences:** U-14 changes from "the user decides" to "a 🔴 only for a user-held authority"; a spec difference is staleness when authorized, a defect when the rule is clear, and a 🔴 only when intent is genuinely missing; recorded evidence proves a done-condition only when it passed, covers it and is still fresh; autopilot and advance relay a diagnosis as a diagnosis. `docs/SPEC.md` reads stale on four features until `/esq:spec` runs.
**Alternatives rejetées:** A new `shared:escalation-threshold` block (a third block on the same subject, contradictions left in place); downgrading 🔴 at the orchestrator relay (wrong altitude, attended runs untouched, overlaps the 0.3.23 repair path).

## D-every-orchestrator-relays-a-diagnosis — Every orchestrator relays a diagnosis as a diagnosis

**Scope:** func
**Topic:** escalation
**Date:** 2026-09-17
**Statut:** Active

**Contexte:** The ask-only-missing-authority plan scoped the relay fix to autopilot and advance, but converge carried the same contradiction: its spawn prompt had the step agent dress a diagnosis as an option set and its constraint forbade relaying a diagnosis.
**Décision:** All three orchestrators use one wording: a worker returns a no-authority failure as a diagnosis, a report with no option set is relayed as the agent's diagnosis and action with nothing authored around it, and a re-ask happens only for a named missing authority.
**Raison:** Leaving converge would keep, inside the same unit, the contradiction the user asked removed, and converge was already a carrier this unit edited. One wording lets U-15 pin all three orchestrators with the same needles.
**Tradeoff:** Gained: no orchestrator manufactures a decision from a diagnosis. Accepted: a file outside Phase 4's list changed (+588 bytes per tree), flagged for review.
**Conséquences:** A converge step agent's technical failure hands off its own action instead of an attended re-run; bare-question reds in a brief still go to the attended re-run of the step that produced them.
**Alternatives rejetées:** Filing converge as a backlog row (a same-unit contradiction parked instead of fixed); leaving converge unchanged (the plan's literal scope, but the unit's goal unmet).

## D-a-decision-authorizes-by-its-basis — A decision authorizes by the basis it names, not by who wrote it

**Scope:** arch
**Topic:** escalation
**Date:** 2026-09-17
**Statut:** Active
**Fondement:** user — the planning mandate of 2026-09-17 quoted in `docs/plans/2026-09-17-ask-only-missing-authority-fixes.md` § Context, which sets the criterion ("le fondement de l'autorité, pas l'identité de l'auteur") and rules out both rejected alternatives

**Contexte:** `/esq:check`, `/esq:review` and the shared missing-authority threshold all read "an Active decision the user made or approved", but `docs/DECISIONS.md` records Scope, Topic, Date and Statut — never what an entry's authority rests on, so a worker's record of its own run is indistinguishable from an authorization the user gave (B-166).
**Décision:** A decision entry may carry one `**Fondement:**` line naming the basis its authority rests on, with a mandatory citation: `mandate — <the clause that covers this choice>` or `user — <where the user authorized this change>`; consumers classify by that basis, and an entry with no field is context.
**Raison:** The criterion has to be the foundation of the authority rather than the identity of the author, so that a delegated technical choice stays esq's to make and record, while a change to an explicit constraint, a promised capability or a major commitment needs a basis that covers it. Absence being a meaningful third state is what avoids a registry migration and keeps old entries from becoming blockers.
**Tradeoff:** Gained: an authorization claim that a reader can check, and no new user question. Accepted: nothing mechanically validates that a cited mandate actually covers the change — that stays the model's appreciation.
**Conséquences:** `/esq:plan` and `/esq:build` write the field when recording a decision; `check`, `review` and every author of a question read it; `docs/ARCHITECTURE.md`'s description of the registry falls one field stale until `/esq:arch` is run.
**Alternatives rejetées:** Commit provenance (an entry recorded in or before the plan's commit counts as approved) — it is the timing-and-identity test the mandate rejects, and a rebase rewrites the evidence; a self-declared `**Autorisé:** yes|no` flag — written by the same worker that wrote the drift, and it forces every old entry into a refusal.

## D-a-pinned-clause-covers-its-writer — A conformance scenario pins the writer of a field, not only its readers

**Scope:** arch
**Topic:** conformance
**Date:** 2026-09-17
**Statut:** Active
**Fondement:** mandate — `docs/plans/2026-09-17-ask-only-missing-authority-fixes.md` § Phases, Task 1.4 ("add a needle per new clause"), read with the project skill `audit-scripts`' rule that a load-bearing clause found unpinned is a backlog row rather than a quiet addition; which of the two to apply was a technical call inside the accepted frame

**Contexte:** Task 1.4 enumerated needles for `check`, `review` and the twenty carriers of the shared sentence — all readers of `**Fondement:**`. The field's own template, added to `/esq:plan` and `/esq:build` by Task 1.1, was named by no needle.
**Décision:** U-15 pins the writers too — two needles each for `plan` and `build` over the field's writing rule, with a fault injected per needle — rather than filing the gap as a backlog row.
**Raison:** An unpinned template is the one failure mode the readers' needles cannot see: delete `**Fondement:**` from both writers and every consumer clause still matches, so the audit stays green while `check` and `review` read a field nothing emits. Pinning it costs four clause records and two faults in a guard that already runs; a backlog row would leave the hole open for as long as the row waits.
**Tradeoff:** Gained: the field cannot be silently removed from the only two commands that write it. Accepted: U-15 now constrains the writers' wording as well as the readers', so rephrasing the template means updating the scenario, its needles and its faults together.
**Conséquences:** Any future change to the `**Fondement:**` template in `/esq:plan` or `/esq:build` reds checks 24/25 until `docs/CONFORMANCE.md`, `scripts/check-conformance.sh` and `scripts/test-conformance-guard.sh` are updated in the same commit.
**Alternatives rejetées:** File the unpinned writer clause as a backlog row and ship Task 1.4 exactly as enumerated — it is what `audit-scripts` prescribes by default, but it defers a guard that costs less than the row's own triage and leaves the readers pinned against a writer that is not.

## D-harvest-basis-by-entry-origin — Harvest records a basis keyed to where the entry came from

**Scope:** arch
**Topic:** conformance
**Date:** 2026-09-17
**Statut:** Active
**Fondement:** user — the `/esq:plan` mandate of 2026-09-17 on `docs/plans/2026-09-17-ask-only-missing-authority-fixes-fixes.brief.md`: "Étends à harvest le contrat Fondement existant", with the three origins named and bounded in the same message ("Une décision effectivement exprimée par l'utilisateur : enregistrer son fondement avec la question concernée, la date et le contenu pertinent de sa réponse… Une déduction issue du code ou de l'historique : conserver comme contexte, sans inventer d'autorisation… Une source retrouvée contenant une autorisation explicite : citer cette source et vérifier ce qu'elle couvre")

**Contexte:** `/esq:harvest` is the registry's third writer and gained no `**Fondement:**` when the field shipped, so the answers its interrogation collects — product bets, scope cuts, functional invariants — are written as entries that the new classifier reads as context and never as authorization.
**Décision:** Harvest's entry template carries the universal citation sentence the other two writers carry, plus a three-way rule keyed to the entry's origin: mined archaeology writes no field, an answered Phase 2 question writes `user —` with the question, the date and the operative words of the answer, and a found source carrying an explicit authorization is cited as that source and bounded by what it covers.
**Raison:** Harvest has two entry origins where `plan` and `build` have one, and the writers' existing paragraph is written for a worker recording its own delegated calls — a role harvest never plays. Copied literally it would push a miner holding a commit toward `mandate — <the commit>`, which is exactly the fabricated provenance the parent unit refused. Keying the rule to the origin is what keeps absence meaningful and stops age from reading as consent.
**Tradeoff:** Gained: an authorization the user actually expressed survives the session that collected it, and a deduction from history stays a deduction. Accepted: harvest's rule is no longer byte-identical to the other two writers', so only the sentence all three genuinely share can be pinned across the set.
**Conséquences:** A registry built by `/esq:harvest` can authorize a spec difference through an answered question; entries it mined cannot, and no backfill gives them one. Future edits to harvest's template must keep the shared citation sentence intact or the writer-set clause reds.
**Alternatives rejetées:** Paste the `plan`/`build` paragraph into harvest unchanged — one edit, byte-identical, and wrong for mined entries, which it steers toward inventing a basis; a separate `**Origine:** archéologie | interrogation` field — a second vocabulary for what `**Fondement:**` already says, ruled out by the mandate's "aucun nouveau fichier de provenance", and a bare token with no citation behind it is the self-declared flag the parent unit rejected.

## D-a-writer-set-check-closes-the-gap — A conformance clause can require something of a set, not only of a named carrier

**Scope:** arch
**Topic:** conformance
**Date:** 2026-09-17
**Statut:** Active
**Fondement:** mandate — this repo's standing rule that a correction made twice becomes a check that fails the build (`docs/AUDIT.md`, and B-096 which frames the same doctrine), applied inside the mandate's own bound "Réutilise les mécanismes existants : aucun nouveau CLI"; which mechanism to extend was a technical call inside the accepted frame

**Contexte:** `docs/CONFORMANCE.md`'s clause kinds are all carrier-scoped: `need`, `refuse` and `need_before` each name the command they check. The registry's basis rule has now been missed once per writer that nobody listed — the parent unit pinned `plan` and `build` after noticing its own gap, and still shipped without `harvest` — which is the failure a per-carrier needle is structurally blind to.
**Décision:** Add one set-scoped clause kind, `need_each <scenario> <file-marker> <needle> <label>`, and apply it to U-15 so that every `.md` under a tree whose content matches the entry-template marker `^\*\*Statut:\*\* Active$` must also hold the shared citation sentence — with an injected fault adding a fourth writer that carries the template and no rule.
**Raison:** The failure is a carrier that exists and is not in anybody's list, so the fix has to be keyed to a property of the file rather than to its name. Extending `check-conformance.sh` with one clause kind costs a records branch inside a check the audit already runs, where a new `check-*`/`test-*` pair would cost two scripts, an audit wiring line and a check-count bump across every citation of it.
**Tradeoff:** Gained: a fourth registry writer cannot ship without the basis rule, and any scenario can now assert something of a set. Accepted: the clause scans the whole tree rather than a resolved carrier, so an over-broad marker demands the needle of files that merely quote it, and the marker must be re-verified whenever the entry template is reworded.
**Conséquences:** `scripts/check-conformance.sh` gains a fourth clause kind available to every scenario; `scripts/test-conformance-guard.sh` gains the fault that proves it fires. Rewording the entry template's `**Statut:**` line changes what the clause selects.
**Alternatives rejetées:** Add `harvest` to U-15's existing per-carrier needle list and stop — it fixes today's miss and leaves the class open for the next writer, which is the same bet that just failed; a dedicated `check-registry-writers.sh` / `test-registry-writers-guard.sh` pair — correct but heavier, adding an audit check number and its citations for an assertion that fits inside an existing check.

## D-a-fix-records-what-it-proved — A fix records what it proved, where the gate already reads it

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-18
**Statut:** Active
**Fondement:** mandate — CLAUDE.md § *Cost is a requirement*, question 1: "What does this re-run that already succeeded? Paid work done twice is the costly failure."

**Contexte:** `/esq:fix` verifies before every commit and leaves the result nowhere, so `esq gate verify` can only ever see the `**Verified:**` block `/esq:build` wrote — which the fix commit itself stales. A reproducer over the real `appendLog` and `gateVerify` pins the cost: the same command, the same criterion, the tested tree identical to the committed tree, and the landing gate still buys a second execution.
**Décision:** `/esq:fix` records its proof as an append-only `### Phase N — reverified <date>` block inserted at the end of the resolved phase's own entry span, written through a new `esq plan record-verification` verb that attributes the proof by **exact text identity with the plan's `(auto)` step** — one match or it refuses; `parseVerified` returns every block a phase records and `gateVerify` judges each on its own `at`.
**Raison:** The block is the shape the gate already opens and already invalidates, so no second evidence path and no second staleness rule enters the system. The heading is invisible to `parsePlan`'s entry regex (`completed|⏸`), so `nextPhase`, `esq validate`, build's duplicate-entry refusal and both pause clauses are untouched. Attribution is by step rather than by command because two phases can name one command under different criteria, and picking the lowest-numbered one attributes a PASS nobody earned; an unknown or ambiguous match records nothing and leaves `run` standing, without widening or re-running anything. The tree equality is a consistency check, not a proof of execution: `git write-tree` describes the index, so what it buys is that the committed tree is the tree that was staged when the verification ran — the PASS itself stays an attestation by the run that made it, exactly as `/esq:build`'s block is today.
**Tradeoff:** Gained: a verification the unit already paid for survives to the landing gate, at one CLI call and one bookkeeping commit per recording item — both chained into the call that item already makes, so no prescribed round trip is added — and no extra command execution. Counted per item and nothing more: an item whose recording the verb **refuses** still spent one CLI call, because a call that refuses is a call; this is a count of prescribed operations, never a measured economy in model turns, tokens or dollars, and none is claimed. Accepted: a second command now writes into a file `/esq:build` owns, which must be held by a `docs/CONFORMANCE.md` clause rather than by the file's own structure. Accepted also: the cycle carries no recovery chain — a `|| git checkout -- <plan>` tail was reproduced restoring the index's content, leaving the proof staged and still exiting 0, so a failed commit or write preserves files and index, reports the precise state, and stops rather than being masked.
**Conséquences:** `**Verified:**` has two writers, and any future consumer must read every block a phase records rather than its first — attributed by the block's own `### Phase N — reverified` heading, which is what `parseVerified` keys on, so where the block sits relative to another phase's entry is readability and not attribution. A recorded proof is its own bookkeeping commit — the verb needs the fix commit's oid and tree, so the proof cannot ride it and amending it would move the tree it certifies — and that commit is invisible to the gate because an append below `## Execution log` already compares equal on `planSection`. `/esq:fix`'s "don't edit the plan file" constraint is narrowed to this one append, and `/esq:fix` now reads the plan's `(auto)` steps once in preflight. `docs/ARCHITECTURE.md`'s writer row for `docs/plans/<date>-<slug>.md` is stale until `/esq:arch` refreshes it.
**Alternatives rejetées:** A sidecar `docs/plans/<slug>.verified.jsonl` — strictly one writer per file, but it buys a second artifact format, a second parser, a second set of invalidation rules to keep in step, a new plan-glob exclusion and `esq merge land` union logic, all to avoid a heading `parsePlan` already ignores. Amending the build's existing `**Verified:**` block through the `esq plan resolve-block` machinery — it overwrites a historical PASS, which the mandate forbids, and makes a fix's proof indistinguishable from a build's.

## D-an-unreachable-rail-is-kept-and-said-so — An unreachable rail is kept, documented as unreachable, and tested on what is observable

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** mandate — the plan's Phase 1 Task 1.2, which lists `a block already recording that same `at` for that phase` among the refusals the verb owes, alongside the `at` not equal to `HEAD` refusal that makes it unreachable.

**Contexte:** `esq plan record-verification` was specified with both an `at` must equal `HEAD` refusal and a duplicate-proof refusal. Implementing them showed the second cannot fire: a block naming HEAD's own object id cannot already sit inside HEAD's own tree, because the text would have had to be fixed before the oid it names existed. The test written for it could not be made to reach it, only to construct states the earlier rails caught first.
**Décision:** Keep the duplicate refusal, say in the code exactly why it is unreachable and what would make it reachable, and test the property that *is* observable — two proofs of one step across two commits append two distinct blocks — rather than manufacture a state no run produces.
**Raison:** Dropping it would have been silent: if the `at` must equal `HEAD` rail is ever relaxed, double-recording one proof becomes possible, and a phase silently carrying its evidence twice is exactly what the reader's fan-out would then have to absorb. Keeping it undocumented would have been worse — a guard nobody can trigger reads as dead code and gets deleted by the next person who notices, with no record of what it was protecting. One map lookup is the whole cost of not discovering that later.
**Tradeoff:** Gained: a relaxation of the HEAD rail cannot silently double a phase's evidence, and the next reader finds the reason rather than rediscovering it. Accepted: one branch of the verb has no fault injection proving it fires, and its comment is the only thing holding the claim that it is unreachable.
**Conséquences:** Any change that lets `at` name a commit other than `HEAD` must bring that branch a test, because it becomes reachable that day. A test asserting a guard's *code* is not owed here; a test asserting the observable behaviour is, and `tests/cli/gate.test.mjs` carries it.
**Alternatives rejetées:** Drop the refusal as dead code — it is dead only because of a neighbouring rail, and nothing would record that. Relax the `at` must equal `HEAD` rail to make the duplicate case reachable and testable — it would loosen the tie between a proof and the commit carrying the tree it was judged on, which is the one mechanical guarantee this whole transmission rests on.

## D-greenfield-is-a-ui-mode — Greenfield direction-rendering is a mode on `/esq:ui`, never a 22nd command

**Scope:** arch
**Topic:** commands
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** user — `docs/plans/2026-09-19-ui-greenfield-directions.brief.md` § Resolved decisions, "Mode on `/esq:ui`, not a distinct command — user chose" and "Content source: any named source, refusal when none — user chose" (2026-09-19).

**Contexte:** `/esq:ui` can only run against an app that already exists — Pass 2 drives it, Pass 4 renders on the screen Pass 2 found busiest — so a product with no code has no step anywhere in the cycle that renders two choosable directions, and its visual direction is decided by whatever the implementer types first. The question was where that capability lives.
**Décision:** A `--greenfield` mode on `/esq:ui`, selected by an explicit flag and never inferred, that keeps Pass 3, Pass 4, the published comparison page and the brief contract, skips Pass 2, degrades Pass 1, resolves real content from a grill brief then `docs/SPEC.md` then pasted copy — and stops and asks when none of the three is present.
**Raison:** A 22nd skill would duplicate ~60% of the file: Pass 3, Pass 4, the publication step and the brief template are word-for-word identical, so they would have to become `<!-- shared: -->` blocks with a registry line — permanent synchronisation debt — on top of two asserted 21-skill counts, three README places and a second legacy mirror. A mode inside a skill already has precedent in the set (`/esq:work`'s `route`, `/esq:roadmap`'s delegated bare refresh). The refusal is the structural twin of the refusal Pass 2 already carries: an audit that never looked at the app is what the command exists to prevent, and a direction rendered on invented copy is that same failure in a new coat — it hides how the direction holds the real thing and moves "decided by default" one notch instead of closing it.
**Tradeoff:** Gained: one command, one brief contract, no shared-block debt, no count bump, and a greenfield product that can choose its direction from a picture. Accepted: `/esq:ui` now carries two run shapes in one file, so every future edit to a shared pass has to be read against both, and the flat skill's 500-line bound is closer than it was.
**Conséquences:** The mode is explicit and never inferred — a redesign run that cannot launch the app still stops and asks for access, and never degrades into a sketch. When the mode consumed a grill brief it enriches that same file rather than writing a rival, so `/esq:plan`'s most-recently-modified resolution cannot pick a briefer without a direction. `/esq:grill` gains a conditional `→ Next` naming the mode, and `docs/CONFORMANCE.md` gains its first scenario pinning `/esq:ui`.
**Alternatives rejetées:** A 22nd skill `/esq:greenfield` — priced above, rejected for the shared-block debt and the duplicated counts. Auto-detecting greenfield from the absence of UI code — rejected because it turns the redesign command's refusal into a silent fallback, which is the exact failure mode the command was written to prevent. Generating plausible product copy when no source exists — rejected: it makes the rendering possible and the choice meaningless.


## D-the-greenfield-floor-is-mode-scoped — The output floor gates greenfield directions only

**Scope:** ux
**Topic:** commands
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** mandate — `docs/plans/2026-09-19-ui-greenfield-output-floor.brief.md` § Out of scope, "The redesign path. Nothing outside `## Greenfield mode` changes except where a defect names a shared line", which delegates the placement call to planning while fixing its boundary.

**Contexte:** `/esq:ui` Pass 4 renders directions in both modes, and the new five-item floor (computed WCAG AA body-text contrast, visible focus, 44px touch targets, ~400px with no horizontal scroll, the screen's empty / loading / error states) could live either in `## Greenfield mode` or in Pass 4's shared per-direction bullet list at `:130`-`:135`. The second placement would silently apply it to the redesign path too.
**Décision:** The floor is stated inside `## Greenfield mode`. Pass 4's shared bullets keep the computed contrast check they already carry and gain nothing.
**Raison:** A redesign direction is anchored to an app Pass 1 measured and Pass 2 captured — its focus styles, its touch targets and its missing states are already findings of that audit, so the floor would restate obligations the redesign path discharges elsewhere. A greenfield direction has no such anchor: Pass 1 may legitimately be empty, so the floor is the only thing standing between the mode and an ungoverned render. Widening it by placement would also be a scope change smuggled in as an edit location.
**Tradeoff:** Gained: the redesign path's diff stays empty and the floor sits where its justification sits. Accepted: the two modes now state their per-direction obligations in two places, so a future sixth item has to be added deliberately to whichever mode earns it.
**Conséquences:** A later decision to hold redesign directions to the same floor is a separate change with its own reasoning, not a side effect of this one.
**Alternatives rejetées:** Placing the five items in Pass 4's shared bullets — rejected: it changes the redesign path's contract without a defect naming it, against the brief's stated scope. Duplicating the list into both modes — rejected: two copies of one obligation is the synchronisation debt `D-greenfield-is-a-ui-mode` avoided by making greenfield a mode rather than a skill.

## D-greenfield-keeps-pasted-copy-as-a-source — Narrowing the source list removes `## Task` and nothing else

**Scope:** prod
**Topic:** commands
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** user — asked and answered during planning on 2026-09-19: the brief's `## Resolved decisions` said the source order would "name two sources, not three" while removing only `## Task`, which leaves three numbered entries; the user chose to keep all three.

**Contexte:** `/esq:ui --greenfield` resolves its content source in order: the grill brief's `## User-facing flow` then its `## Task`, `docs/SPEC.md`, then copy pasted into the invocation. The brief removed `## Task` — a fallback that could only ever fire on a brief with no screen, precisely the invented-copy case the guard exists to block — but its wording also read as removing pasted copy.
**Décision:** Only `## Task` leaves the source order. The brief's `## User-facing flow`, `docs/SPEC.md` and pasted copy all remain sources, and the refusal sentence "If none of the three is present" stays verbatim.
**Raison:** Nothing in the brief justified removing pasted copy — the entire argument was about `## Task`'s fallback being the invented-copy case — and removing it would delete a working capability: a user with real screen text and no brief could no longer run the mode at all. Keeping three entries also leaves all eight of P-10's pinned needles and their sixteen fault-injection cases untouched, so the narrowing is prose in one file and its mirror rather than a four-file edit through the conformance guard.
**Tradeoff:** Gained: no capability lost, no needle moved, the smallest diff that fixes the actual defect. Accepted: the source list stays three entries deep, so the trace-or-placeholder rule has to be written to apply to all three rather than to a pair.
**Conséquences:** `docs/CONFORMANCE.md` § P-10's `Given` clause stops naming `## Task` and keeps naming the other three conditions; `check-conformance.sh` and `test-conformance-guard.sh` are untouched by this unit.
**Alternatives rejetées:** Narrowing to two sources by dropping pasted copy as well — rejected: it removes a capability nothing asked to remove and forces the refusal sentence and two needles to be rewritten across four files. Leaving `## Task` in place — rejected: it is the fallback that fires exactly when the brief names no screen, which is the case the copy guard exists to refuse.

## D-greenfield-gate-reads-values-not-looks — Greenfield's gate reads values, never a capture

**Scope:** func
**Topic:** commands
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** mandate — `docs/plans/2026-09-19-ui-greenfield-output-floor-fixes.brief.md` § 🟡, "the fix must choose the instrument before it can state a number", which hands the instrument choice to planning; and `CLAUDE.md` § "Cost is a requirement, not a nice-to-have", which decides it between two options that both clear the floor.

**Contexte:** The five-item gate told the run to *see* a focus indicator and to narrow the viewport and *look*, while the paragraph below asserted those items bought no capture against a 4-capture budget every one of whose captures is already published.
**Décision:** Items 2 and 4 become driver reads returning a value — computed focus styles against the resting state, `scrollWidth` against `clientWidth` at ~400px — joining item 3's `getBoundingClientRect` and item 1's computed contrast ratio; the budget stays at 4.
**Raison:** Item 1 already forbids eyeballing a ratio off the capture, so reading the other items the same way is the consistent reading of the floor rather than a new position. It also makes the sweep exhaustive: funding the looks with two extra captures would have sampled a focus state and reported it as "every interactive element", which is the self-certification the gate exists to prevent — and it would have raised what every greenfield run spends for a signal the driver answers exactly.
**Tradeoff:** Gained: a true budget sentence, one instrument family across all five items, exhaustive coverage, and no added spend per run. Accepted: a run can no longer notice, while looking, that a focus ring is present in the computed style yet visually useless.
**Conséquences:** Any item added to this gate later must name the primitive that answers it; an item that can only be judged by eye needs a capture named in the budget first.
**Alternatives rejetées:** Raising the greenfield budget to 6 to fund the looks — under the announced ceiling of 8, but it samples what it claims to sweep and spends more per run for a weaker signal. Dropping items 2 and 4 — a floor without focus and small-width behavior is not a floor, and the defect was the accounting, not the ambition.


## D-a-repair-budget-replaces-the-ceiling — A repair budget, not a repair ceiling

**Scope:** func
**Topic:** build
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** user — the epic `esq-decides-implementation-detail` `## Order`, lever A, decided by the user 2026-09-19: "a diagnosed failure that already names its exact fix applies it instead of handing it back. The repair-attempt ceiling becomes a budget, not a wall."

**Contexte:** `/esq:build` allowed one repair attempt per phase per invocation, and `references/failure-and-recovery.md` printed the exact next action together with the refusal to take it. The observed specimen ended a 40-minute, 9-commit run so the user could type a two-field fixture edit the agent had already written out.
**Décision:** The ceiling becomes a budget of three repair edits per phase per invocation, guarded by a distinct-cause rule: an attempt is legitimate only against a cause this phase has not already spent one on, and a second red from the same cause is exhaustion rather than a new attempt.
**Raison:** The number bounds wall-clock, the distinct-cause rule bounds thrash; neither alone is safe. One exceeds the observed specimen with margin for a phase carrying two independent stale fixtures plus one genuine repair, and three distinct diagnosed causes in one phase is the point where the plan rather than the code is the suspect — which the report states by printing `repairs <n>/3`.
**Tradeoff:** Gained: the most expensive stop in the corpus disappears where it is cheapest to remove. Accepted: a phase whose plan is wrong can now spend three re-verification runs before it says so.
**Conséquences:** Any later change to how a phase recovers states its bound as a count the report prints, never as a wall. `/esq:autopilot`, `/esq:advance` and `/esq:converge` need no edit — the budget lives strictly inside one invocation, and their "never retries a reported failure" rule is untouched.
**Alternatives rejetées:** Dropping the ceiling entirely — a wrong plan then thrashes for a whole session and the signal disappears with the guard. Keeping the ceiling and having the orchestrator auto-resume — the halt reason is still in the artifact the next invocation reads, so resuming buys a full agent to be told what esq already knew, which is CLAUDE.md cost question 3 verbatim.

## D-corrective-generations-bounded-at-two — A corrective chain opens at most two generations

**Scope:** arch
**Topic:** convergence
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** user — the epic `esq-decides-implementation-detail` `## Order`, lever D, decided by the user 2026-09-19: a bound on `-fixes-fixes` recursion depth, shipped with lever A as one unit.

**Contexte:** Nothing bounded corrective recursion. `esq lane stats` counts 13 corrective briefs over 109 plans here, this repo carries two depth-2 chains, and the reported specimen on another repository is `…-fixes-2-fixes-fixes-2.brief.md`, a fourth generation. The user's words for it: "on s'enfonce, on overengineer, on perd de vue la priorité".
**Décision:** A corrective chain may open two generations; `/esq:plan` refuses to write a corrective plan at generation three and hands back one 🔴 — accept what stands and land, or abandon the unit and re-plan the stem — while `/esq:check` and `/esq:review` still write their brief and route their `→ Next` to that same decision.
**Raison:** The bound is cut where a round is *opened* rather than where findings are recorded, because suppressing the brief would lose the findings while suppressing the plan removes the loop. Two generations is what this repo's own landed chains cost; the pathology the user named begins above them.
**Tradeoff:** Gained: esq cannot spend the user's money correcting esq indefinitely, and the stop it does make is a genuine scope decision. Accepted: a brief written at the bound still blocks the landing through `unit.findings` until `/esq:fix` disposes of it.
**Conséquences:** The generation is computed by the CLI (`esq brief depth`) from the canonical `-fixes(-<n>)?` strip already used for slug canonicalization, so no command re-derives the rule from a filename. A later change to the bound moves one exported constant.
**Alternatives rejetées:** Suppressing the brief at the bound — the findings would live only in a chat report. Bounding at `/esq:fix` — that command applies and escalates, it opens no round, so the bound there would refuse the one terminal route.

## D-brief-depth-refuses-a-path-it-cannot-place — `esq brief depth` refuses a path it cannot place

**Scope:** arch
**Topic:** convergence
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** mandate — the plan `stop-applies-its-own-fix` Task 2.3, which names "a path that is neither a plan nor a brief" as a case the verb must cover, and D-cli-owns-structure-model-owns-judgment for where the answer stops.

**Contexte:** `esq brief depth` answers from the filename alone, so every string is a syntactically valid argument: `notes.txt` and `<stem>.log.md` both reduce to a name with no `-fixes` group and would have answered `depth: 0, verdict: "open"`.
**Décision:** A path whose basename is not a `.md` plan or brief — `.log.md` included — is refused by name at exit 2, while the verdict itself (`open` or `exhausted`) always exits 0.
**Raison:** `depth: 0, open` is indistinguishable from the right answer for a first-generation plan, so a mistyped or mis-resolved path would silently license the very round the bound forbids — the one failure this verb exists to prevent. A refusal is loud, and the caller learns at the argument rather than at the consequence. The plan's "exit 0 always" governs the *verdict*, which is an answer and not a refusal; a malformed argument is what every other verb in this CLI already throws on.
**Tradeoff:** Gained: no caller can be handed a permissive answer for a path the verb never placed. Accepted: a caller holding a path with an unusual extension must classify it before asking.
**Conséquences:** `/esq:plan`, `/esq:check` and `/esq:review` route off `verdict` for a placed path and treat exit 2 as a stop, never as `open`. Widening what counts as a plan or brief is one predicate in `briefDepth`.
**Alternatives rejetées:** Answering `depth: 0` for anything — it fails open on the bound. Reading the file to prove it exists — the caller is `/esq:plan` deciding whether to *write* that file, so requiring it to exist would refuse the verb's main use.

## D-the-corrective-bound-refuses-before-investigation — /esq:plan answers the depth verdict in preflight, not beside the branch resolve

**Scope:** arch
**Topic:** convergence
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** mandate — CLAUDE.md's cost pass, question 1: "What does this re-run that already succeeded?" — and the plan's Task 3.1, which requires only that the verb be called where `esq branch resolve <slug>` is, without fixing the order.

**Contexte:** Task 3.1 says to call `esq brief depth <brief>` "beside the existing `esq branch resolve <slug>`". That call sits in `/esq:plan`'s "Write the plan file" section, which runs after the whole investigation pass.
**Décision:** The verdict is answered at the corrective-brief bullet at the end of preflight — the first point at which `/esq:plan` knows it holds a corrective brief — and the branch-resolve bullet only records that preflight already answered `open`.
**Raison:** A refusal placed after investigation spends the entire reading pass on a plan it will not write; placed at the brief bullet it costs one subprocess and nothing else. Both calls are still named in the corrective-plan routing, which is what "beside" buys the reader.
**Tradeoff:** Gained: the refusal is free. Accepted: the two CLI calls a corrective plan makes are now a few hundred lines apart, so a future edit to one has to look for the other — the branch-resolve bullet names it explicitly for that reason.
**Conséquences:** Any further pre-write refusal `/esq:plan` grows belongs at the same bullet, not in the writing section.
**Alternatives rejetées:** Calling it literally beside `esq branch resolve` — correct to the letter of the task and wrong on cost, since the plan's own `## Goal` is about not paying for work a stop makes worthless.

## D-one-shared-block-carries-the-corrective-refusal — the third-round option set is marker-delimited, not copied three times

**Scope:** arch
**Topic:** convergence
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** mandate — CLAUDE.md's skill-authoring contract: "A paragraph two skills must carry identically goes inside `<!-- shared:<name>:start/end -->` markers, and one registry line in `scripts/check-sharedblocks.sh` names its carriers."

**Contexte:** Phase 3 gives `/esq:plan`, `/esq:check` and `/esq:review` the same 🔴 option set. The plan's tasks describe the text per command and do not say how the three copies are held together.
**Décision:** The verdict call, the refusal sentence and the two options are one `shared:corrective-bound` block registered to those three carriers; what each command does around the refusal stays outside the markers.
**Raison:** The option labels and their `do:` lines *are* the deliverable — nothing downstream tests that a user understood them — so three commands offering three differently-worded versions of one decision is exactly the drift check 22 exists to catch. The per-command halves genuinely differ (plan writes nothing; the finders still write the brief), so wrapping them would force a carrier to lie.
**Tradeoff:** Gained: one wording, mechanically held. Accepted: `plugin/skills/plan/SKILL.md` grew to 492 lines against the 500-line entrypoint bound, so the next addition there has to cut rationale first.
**Conséquences:** A fourth command that could open a corrective round carries the block and is added to the registry line; scenario U-17's needles are scoped to the marker rather than to a list of names, so it cannot ship the block without the contract.
**Alternatives rejetées:** Three independent copies pinned only by conformance needles — the needles would hold the sentences that happen to be pinned and let everything around them drift, which is the state the 2026-08-14 cost audit found the command set in.

## D-a-skill-edit-mirrors-in-its-own-task-commit — the legacy mirror lands with the change, even when a later task names the mirroring

**Scope:** infra
**Topic:** build
**Date:** 2026-09-19
**Statut:** Active
**Fondement:** mandate — CLAUDE.md's skill-authoring contract: "Edit `plugin/skills/<name>/SKILL.md`; mirror the body into `commands/esq/<name>.md` in the same commit — the mirror is the rollback path."

**Contexte:** This plan's Task 3.3 collects "mirror all three skills into `commands/esq/`" into the last task, while Tasks 3.1 and 3.2 make the plugin-side edits.
**Décision:** Each task mirrored its own skill in its own commit; Task 3.3 kept the conformance scenario, its needles and its fault injection. The shared-block registry line was likewise widened in the commit that added each carrier, so `plan` alone was registered at 3.1 and `plan check review` at 3.2.
**Raison:** A commit that leaves `commands/esq/` out of step with `plugin/skills/` is not a rollback point, which is the only reason the mirror exists; it would also have left check 22 and check 27 red at two of the phase's three commits. Task 3.3's obligation is satisfied at the end of 3.3 either way.
**Tradeoff:** Gained: every commit of the phase is independently green and independently revertible. Accepted: one registry line was edited twice across two commits.
**Conséquences:** A plan that puts mirroring in its own task is read as naming the obligation, not as licensing an unmirrored intermediate commit.
**Alternatives rejetées:** Following the task split literally and mirroring all three files in 3.3 — two commits that cannot be rolled back to, to honor a task boundary the repo rule already overrides.

## D-a-brief-is-consumed-by-the-plan-that-carries-its-slug — A brief is consumed by the plan that carries its slug

**Scope:** arch
**Topic:** commands
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** user — "Décide et applique le correctif […] Quoi qu'il arrive, « aucun brief non consommé » doit tomber dans le STOP de l'étape 2 plutôt que de ressortir un vieux brief." (2026-09-20, reported against `~/projects/synergietg`).

**Contexte:** `/esq:plan` preflight step 2 resolved a bare invocation to "the most recently modified `*.brief.md` in `docs/plans/`", and nothing ever takes a brief out of that glob — "Commit and stop" retires a corrective brief and never a grill brief. Briefs therefore accumulate, and on a repository with two briefs both planned, built and merged, a bare `/esq:plan` was about to re-plan the newer of them. On this repository the same read finds 28 briefs, every one of them already planned.
**Décision:** Consumption is computed, not stored: a brief is consumed when a plan beside it carries its slug (`normalizeSlug`, the join this repo already uses between a plan, its briefs, its commits and its backlog rows). `esq brief pending` is the read — `pending`, `consumed` and the `selected` head of `pending`, newest first — with two structural refinements: a plan recorded abandoned consumes nothing, and a corrective brief is pending only while it still lists a 🟡, since `/esq:plan` strikes that section and leaves the 🟢 and 🔴 items standing. Step 2 takes `selected`, names the other pending briefs, and an empty `pending` falls into its existing STOP.
**Raison:** The brief is durable input — the plan cites it, `/esq:ui` enriches it, and a reader comes back to it — so recording consumption by deleting it destroys evidence to fix a lookup, and a mtime answers a different question than the one asked ("which brief was touched last", not "which brief still owes a plan"). Computing it needs no new state, no new writer and no migration: every brief already on disk is classified correctly by the plans beside it. Refusing to guess — listing the briefs and stopping — was rejected for the ordinary case because it buys a user round trip for an answer the directory already holds; the stop is kept for the case where there is genuinely nothing to plan.
**Tradeoff:** Gained: a bare `/esq:plan` cannot re-plan work that is already built and merged, and the CLI owns the slug arithmetic rather than each run re-deriving it from filenames. Accepted: a brief and a plan whose slugs differ only by a uniquifier count as one pair, exactly as everywhere else this join is used — a false "consumed" lands in the STOP, which asks, rather than in a wrong plan.
**Conséquences:** Any later consumer that asks "is this brief still to be planned" calls `esq brief pending` instead of globbing; `/esq:work`'s grill-brief gate routes to `/esq:build` when a plan already carries the brief's slug. `/esq:fix`'s own `*-fixes.brief.md` fallback is untouched: it applies 🟢 items and strikes them, so a brief it has already applied offers it nothing.
**Alternatives rejetées:** Deleting the grill brief in the `plan: <slug>` commit — it makes the plan the only record of a scope the user settled, and `/esq:ui`'s published audit would go with it. Refusing to guess and listing the pending briefs — the round trip is the cost, and the announcement's second line already puts the resolved brief on screen before anything is spent on it.

## D-a-rank-is-written-never-recomputed — A rank is written down, never recomputed on read

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** user — the 2026-09-20 option set (stored column / computed-never-stored / total roadmap) and the follow-up in which the user rejected the computed option's fallback

**Contexte:** 40 of 51 open rows carried no priority and the only order in the system was the 16 grouped entries `/esq:roadmap plan` happened to write, so "what is next, then what" had no answer. The user asked for an intelligence that classifies everything, at all times, in every project.
**Décision:** `docs/BACKLOG.md` gains a `Rank` cell; the model decides the sequence and the CLI assigns the sparse integers, through one verb both `/esq:backlog` and `/esq:roadmap plan` call. Priority is the primary sort key and rank breaks ties inside its bucket; the displayed per-bucket ordinal is computed at render time and never stored.
**Raison:** A rank recomputed on read is either expensive or unstable, and two consecutive reads that disagree are worse than no order at all. For the majority of rows — the ones no roadmap entry covers — a computed rank degrades to a type-and-age sort, which is a dumb sort presented as a classification. Writing it down is what makes "en tout temps" true between two commands.
**Tradeoff:** Gained: a stable, citable order over every open item, refreshed on capture and on re-derivation, with no hand-maintained cell. Accepted: a tenth column on a durable schema that the merge engine, `esq state` and six skills read, and a second file carrying order beside `docs/ROADMAP.md`.
**Conséquences:** The roadmap stops being the only place order exists and keeps what a flat list cannot hold — the groupings, the `needs:`/`unblocks:` edges and the `why now` prose. Its admission test still governs which items earn a written *entry*; it no longer governs which items have a *position*. `esq validate` refuses a duplicate rank or an open row with no priority. Originally, `derive` treated divergent `Rank` cells as projections. **2026-09-24 clarification (user mandate, B-184: preserve intentional order):** different edits to the same Rank require an order resolution; the destination's number is not authority. Equal ranks on independent rows are reconciled at merge only when stored ordering edits survive, without changing IDs or priorities.
**Alternatives rejetées:** Computing the rank on every read — withdrawn the same day it was recommended, once its no-entry fallback was shown to the user. Making the roadmap total, one entry per open item — it destroys the admission test and charges a `why now` paragraph for items whose position nobody is arguing about.

## D-an-edge-promotes-but-never-overrides-the-user — An edge promotes a suggested priority, and reports a confirmed one

**Scope:** func
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** mandate — `## Recommendation` of `docs/plans/2026-09-20-every-open-item-is-ranked.md`, under the accepted frame that priority is the primary sort key

**Contexte:** With priority as the primary sort key, a low-priority item that gates a high-priority one sinks below everything in the higher bucket and the item it blocks can never be worked. It is reachable today: `gate-guards-what-it-claims` carries no priority and `unblocks:` `legacy-tree-trim`, which is `lo?`.
**Décision:** An item whose roadmap edge `unblocks:` another inherits at least that item's priority level. A *suggested* priority (`med?`) is raised silently; a *confirmed* one is left exactly as the user set it and the contradiction is reported instead.
**Raison:** The two sort keys the user asked for — priority first, rank under it — can contradict the dependency graph, and something has to reconcile them without a round trip. Raising an unconfirmed guess is the cheap half. Overwriting a level the user actually chose is the move that would make the ledger untrustworthy, and the roadmap already carries that rule for its own entries.
**Tradeoff:** Gained: the two keys can never produce an order in which a blocker is unreachable. Accepted: a reported contradiction the user must settle, rather than a system that always resolves itself.
**Conséquences:** `esq backlog rank` refuses an order that contradicts an edge, naming both entries; the promotion runs as a closure over the roadmap's edges each time a rank is written. Any later rule that writes a priority must preserve the confirmed/suggested distinction, since it is what decides between raising and reporting.
**Alternatives rejetées:** Always promoting, confirmed levels included — it silently rewrites the user's own judgment. Never promoting and only refusing — it turns an ordinary graph fact into a stop the user has to clear by hand, on a command whose point is that it decides for them.

## D-adoption-gates-the-rule-not-the-header — Adoption gates the new rule, not the column's presence

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** mandate — Phase 1 of `docs/plans/2026-09-20-every-open-item-is-ranked.md`, whose verification requires `esq validate` to exit 0 against a backlog the schema addition is optional for

**Contexte:** Phase 1 added the `Rank` column and taught `validate` to report an open row with no priority. Both findings were first gated on the column being present — which reads as "this backlog has adopted ranking". It does not. The column is added lazily by the first ordinary write into any backlog, so `validate` went red on 40 pre-existing rows the moment this very phase filed one backlog candidate into this repository.
**Décision:** `validate` gates a duplicate rank on the column existing, and an unprioritized open row on at least one rank having actually been assigned. The two findings are checked on two different signals.
**Raison:** The column's arrival and the project's adoption of ranking are separate events, and a lazily-added column makes the gap unavoidable: every backlog sits between them from the moment a row is filed until its first `/esq:roadmap plan`. Gating an invariant on a header punishes every project for a rule it has not opted into, and `esq validate` blocks the session stop — so the cost is not a warning, it is a halted session in every esquisse project on disk.
**Tradeoff:** Gained: the tenth column is genuinely optional, and the intermediate state between shipping it and the first ranking run is legal rather than red. Accepted: an unranked project is never told its rows are unprioritized, so the finding cannot be what first draws attention to the problem.
**Conséquences:** Any later invariant riding a lazily-added ledger field is gated the same way — on a value existing, not on the header existing. The first rank this repository assigns turns the priority finding on for every open row still carrying none, which is what Phase 4 clears.
**Alternatives rejetées:** Gating both findings on the header — it red this repository's own backlog during the phase that introduced it, which is the cheapest possible demonstration that it is wrong. Dropping the priority finding entirely — Phase 1's task list requires it, and without it nothing mechanical ever notices a blank priority.

## D-the-roadmap-is-read-beside-the-ledger — A ledger verb reads its sibling ledger beside the file it was handed

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** mandate — Task 2.3 of `docs/plans/2026-09-20-every-open-item-is-ranked.md`, which requires the rank verbs to hold an order to the roadmap's `needs:`/`unblocks:` edges

**Contexte:** `esq backlog rank` has to read `docs/ROADMAP.md` to check an edge, and every other verb in `cli.mjs` that needs a second ledger takes a repository root and joins `docs/<name>.md` onto it — which means a `git rev-parse --show-toplevel`, a test-mode git shim, and a fixture that has to look like a repository before it can be ranked.
**Décision:** The rank verbs resolve the roadmap as the sibling of the backlog file they were handed — `<dirname of the backlog>/ROADMAP.md` — and take no repository root at all.
**Raison:** The two ledgers are siblings by construction in every esquisse project, so the file's own directory carries the information the root was being fetched to supply. Dropping the root removes a git call from a pure text operation, and it makes a linked worktree, a `git show` of another branch's ledger and a three-line test fixture resolve the pair identically, with no shim in the path. A missing roadmap is an ordinary `ENOENT` meaning "no edges", not a broken repository.
**Tradeoff:** Gained: two verbs that are pure functions of two files, testable without a git working tree. Accepted: a caller that hands the verb a backlog copied somewhere on its own gets no edges rather than the repository's — correct, but silently so.
**Conséquences:** Any later verb reading one ledger against another resolves it the same way, from the path it was given. A project that ever moved `ROADMAP.md` out of `docs/` would need this rule revisited rather than a root reintroduced.
**Alternatives rejetées:** Passing the repository root and joining `docs/ROADMAP.md` — it is what every neighbouring verb does, but it buys a git call and a test shim for a path the argument already determines. Passing the roadmap path explicitly as a third argument — it pushes the coupling out to every caller, including two skills, for a location none of them chooses.

## D-a-rank-verb-refuses-what-it-cannot-make-total — A rank verb refuses what it cannot make total, and repairs what it can

**Scope:** func
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** mandate — `## Goal` of `docs/plans/2026-09-20-every-open-item-is-ranked.md`: every open item carries a position, with no blanks and no ties

**Contexte:** `esq backlog rank --order` is handed a sequence a model decided. That list can be short of the open rows, name an item twice, name a closed row, or be empty; and a single placement can land in a gap with no integer left in it. Each needed an answer, and the two kinds of trouble do not have the same one.
**Décision:** Anything that would leave the ledger without one total order over every open row is refused, naming exactly what is wrong and leaving the file byte-identical — a partial list, a duplicate, an empty list, a closed or unknown id, a placement against itself or against an unranked row. An exhausted gap is not refused: the sequence is renumbered at the canonical spacing and the result says `renumbered: true`.
**Raison:** A half-ranked backlog is worse than an unranked one — it reads as an order while silently omitting rows, and no reader can tell the difference. But an exhausted gap is not a malformed request: the caller asked for something meaningful and there is exactly one correct answer, so refusing would hand back a state the caller has no verb to repair. Refuse ambiguity; repair arithmetic.
**Tradeoff:** Gained: any backlog the verb has touched is totally ordered, and every refusal is free of side effects. Accepted: `/esq:roadmap plan` must hand over the complete open sequence in one call rather than ranking incrementally, and a renumber occasionally touches rows the caller did not name.
**Conséquences:** Phase 3's capture path must use the single-placement mode, since `--order` is only usable by a caller holding the whole sequence. Any future mode is held to the same split: it either produces a total order or changes nothing.
**Alternatives rejetées:** Ranking the named subset and leaving the rest blank — it is the half-ranked ledger this rule exists to prevent. Refusing an exhausted gap and telling the caller to re-rank — it converts a solvable arithmetic problem into a stop, on the command whose whole point is that it decides for the user.

## D-a-blank-priority-is-no-longer-a-reachable-state — A blank priority is no longer a state a command will put a row in

**Scope:** func
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** mandate — `## Done looks like` of `docs/plans/2026-09-20-every-open-item-is-ranked.md`: "No row is missing a priority", and every open row carries a position

**Contexte:** `/esq:backlog` Mode C accepted `pri:none` / "drop priority" and wrote a blank `Pri` cell, and Mode B offered to derive an order only past five open items and only when no `docs/ROADMAP.md` existed. Both predate the rule this unit ships, and both are ways a command itself puts a row into the state the unit exists to abolish.
**Décision:** `pri:none` is refused — `esq backlog set-pri` rejects the empty value and the skill asks which level is meant instead — and the conditional second line of Mode B's `→ Next` now fires whenever *any* open row carries no rank, naming the count, rather than on a five-item threshold.
**Raison:** A rule that every open item is prioritized and placed is only true if no command offers the opposite; leaving a documented "drop priority" verb in the one command users triage with would make the invariant advisory. The five-item threshold existed because an order nothing maintained was not worth nagging about — capture now maintains it, so the only unranked rows are a finite leftover tail that one command clears, and its count is more useful than silence.
**Tradeoff:** Gained: no `/esq:` path writes a blank priority, and a partially placed backlog always says so on screen. Accepted: a user who genuinely wants a row unprioritized has no verb for it, and a two-item backlog with no ranks now gets a line the old threshold suppressed.
**Conséquences:** Anything later reading a blank `Pri` is reading history rather than a current state. `esq validate`'s unprioritized-open-row finding becomes the migration signal for existing ledgers rather than a warning about ongoing behavior.
**Alternatives rejetées:** Keeping `pri:none` and letting `/esq:roadmap plan` re-fill the blank — the blank is reachable at any moment between two runs, which is exactly the "ingérable" state the user described. Keeping the five-item threshold — it hides the one fact the list cannot otherwise show, that part of the queue has no position.

## D-a-contradiction-is-reported-where-it-is-computed — A contradiction is reported by the write that computed it

**Scope:** arch
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** mandate — `## Recommendation` of `docs/plans/2026-09-20-every-open-item-is-ranked.md`: a confirmed priority below what it gates "is reported as a contradiction and left alone"; the plan does not name which command reports it

**Contexte:** `esq backlog rank` returns `contradictions` when a priority the user confirmed sits below one it gates through a roadmap edge. Phase 2's hand-off note suggested Mode B — the bare `/esq:backlog` list — as where that belongs on screen, since that is where a user would look at the queue.
**Décision:** The contradiction is surfaced by the calls that produce it — Mode A's placement and Mode C's priority write — and Mode B says nothing about edges.
**Raison:** Mode B is read-only and issues no rank call, so showing a contradiction there would mean reading `docs/ROADMAP.md` and re-deriving every entry's `covers` on every bare `/esq:backlog` — real work on the command run most often, to recompute a fact the write path already held and could have reported for free. A contradiction is also a change in the user's own two judgments, which is precisely when they are already looking.
**Tradeoff:** Gained: the cheapest read path stays a read of one file. Accepted: a contradiction introduced by editing `docs/ROADMAP.md` directly is not announced until the next rank or priority write touches the pair.
**Conséquences:** Any later consumer wanting a standing contradiction report asks `esq`, which already computes it, rather than teaching a skill to re-derive edges. `/esq:roadmap plan` in Phase 4 is the other write path and inherits the same obligation.
**Alternatives rejetées:** Computing edges in Mode B — it pays a second file read and an entry-by-entry join on every list, for a fact the writer had in hand. Storing the contradiction in the ledger — it would be a fourth judgment to keep in sync, and the plan's whole design rests on the rank being a projection of two.

## D-the-admission-test-admits-entries-never-positions — The admission test admits entries, never positions

**Scope:** prod
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** mandate — the plan's Phase 4 Task 4.1, which requires the two to be "stated as separate obligations so neither reads as the other", and its `## Context`, which records the misreading as the cause of 40 of 51 open rows carrying no priority.

**Contexte:** `/esq:roadmap`'s one admission rule — an item earns an entry only when its position is a real judgment — was read as *no paragraph, no position*, so items that earned no `why now` were left with no order at all. That reading is why most of the backlog was unordered while the command that could have ordered it ran clean.
**Décision:** The admission test governs which items earn a **written entry** and nothing else. `/esq:roadmap plan` places every open item, entry or no entry, and the skill states the two as two obligations in adjacent sentences.
**Raison:** The test exists to stop `docs/ROADMAP.md` becoming the backlog recopied — a rule about *the file*, which says nothing about the *order*. Separating them keeps the file's admission bar exactly where it was while removing the only reason most items had no position. An item nobody is arguing about needs a slot, not a paragraph.
**Tradeoff:** Gained: one command places a whole project's backlog, and the roadmap keeps its bar. Accepted: the two rules now sit side by side in prose that a later compression could merge back into one, which is what scenario P-12 pins them separately against.
**Conséquences:** Any future rewording of either rule has to keep them distinguishable; check 24 reds on the sentence that scopes the test to entries and on the sentence that promises the coverage, independently.
**Alternatives rejetées:** Approach C of the plan — give every open item a roadmap entry — which destroys the admission test by requiring 56 `why now` paragraphs. Leaving the test as written and ranking nothing, which is the state this unit exists to end.

## D-an-order-edit-reports-staleness-never-re-ranks — An order edit reports staleness, never re-ranks

**Scope:** func
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Superseded by `D-a-roadmap-move-re-places-what-it-moved`
**Fondement:** mandate — the plan's `## Recommendation`, which forbids silently overriding the user's own stated judgment, applied to the sequence as it already is to a confirmed priority.

**Contexte:** `/esq:roadmap` Mode C moves an entry or sets a `needs:`/`unblocks:` edge. Once a rank exists, such an edit can leave the stored sequence out of step with the order the user just changed, and Mode C had no stated behavior for it.
**Décision:** Mode C writes no backlog cell. It names the staleness in one line and names `/esq:roadmap plan` as the command that re-places the items.
**Raison:** Re-ranking on the side of an edit would write a whole sequence from one small instruction — the model deciding the position of every open item because the user moved one entry. That is the same move the plan refuses for a confirmed priority, for the same reason: the ledger stops being trustworthy the moment a command changes more than it was asked to.
**Tradeoff:** Gained: an edit does exactly what it says, and the rank stays a projection written by one verb from one deliberate pass. Accepted: between a Mode C edit and the next `/esq:roadmap plan`, the printed order can disagree with the roadmap's — announced, not silent.
**Conséquences:** B-173 carries the follow-up if the gap turns out to matter in use; closing it needs a decision about what a partial re-rank would even mean, which is why it is a row rather than a task.
**Alternatives rejetées:** Re-ranking the affected items only — there is no bounded "affected" set, since an edge change can reorder anything downstream. Re-ranking everything — the silent overwrite above. Saying nothing — the failure this decision exists to avoid, since a stale order nobody flags is worse than no order.


## D-a-roadmap-move-re-places-what-it-moved — A roadmap move re-places what it moved

**Scope:** func
**Topic:** ledgers
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** user — the question answered during this planning pass on 2026-09-20, choosing "re-place only what moved" over "offer it, never perform it"; it reverses `D-an-order-edit-reports-staleness-never-re-ranks`, which is marked Superseded.

**Contexte:** The rank is defined as a projection of two judgments — the priority and the roadmap. The priority half projects on the spot; the roadmap half did not, so `/esq:roadmap <move>` left the stored sequence describing the order as it was before the edit until someone typed `/esq:roadmap plan` (B-173).
**Décision:** A Mode C instruction that changes an entry's **position** — a move, or an add naming one — re-places exactly the open `B-NNN` ids in that entry's `covers:` line, through chained `esq backlog rank <B-NNN> --before|--after` calls; an edge, drop, covers or reason edit still writes no backlog cell.
**Raison:** The earlier decision rejected a partial re-rank on the ground that there is no bounded affected set. That is true of an **edge**, whose consequences run downstream without limit, and false of a **move**, whose affected set is written on the entry that moved. Splitting the two instruction kinds is what makes a bounded write available at all, and it leaves the rejected case rejected.
**Tradeoff:** Gained: the ledger stops disagreeing with the roadmap the moment the judgment changes, at a write of a handful of rows. Accepted: Mode C is no longer read-only against `docs/BACKLOG.md`, and it gains refusal paths — an edge contradiction, a neighbour entry covering nothing ranked — where it previously could not fail.
**Conséquences:** `docs/BACKLOG.md`'s `Rank` cell now has two writers among the roadmap's modes rather than one, both going through the same CLI verb; the refusal leaves the backlog byte-identical and is reported rather than repaired, because choosing between a user's edge and a user's move is exactly what that verb refuses to do.
**Alternatives rejetées:** Offering the placement command instead of issuing it — the ledger is still stale between the edit and the moment the user types it, which is the finding with better ergonomics on top. Re-running the whole `--order` projection after any edit — the silent overwrite the superseded decision rejected, and it still stands rejected.

## D-the-observation-path-not-the-instrument — The observation path, not the instrument's name

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-18
**Statut:** Active
**Fondement:** user — the invocation of 2026-09-18 that retained P1 bounded to "le chemin complet d'observation", naming a missing observation path and a missing starting state as two distinct holes

**Contexte:** `/esq:plan` decides a `(manual)` step exists and never asks whether the run can reach what it observes; `/esq:build` discovers the gap mid-phase and prescribes a backlog row.
**Décision:** A `(manual)` step may be declared only once its four links — access, starting state and what creates it, the user action, the expected observation — each name the resource that supplies them, existing or created by a task of the same plan, or are marked uncovered; and at build time the criterion is that same scenario coverage, never the presence of an instrument.
**Raison:** Naming an instrument alone does not establish that a manual step can be observed. A run skill may launch an app without creating the required state, and a script may produce output without providing a way to inspect it. The plan and build checks therefore need to cover each observation link for the specific scenario.
**Tradeoff:** Gained: both shapes are refused by construction, the presence-of-a-skill exemption is removed rather than qualified, and the neutral case — every link covered, add nothing — is explicit. Accepted: more words in two conditionally-loaded references and their two flat legacy mirrors, and a judgment ("does this resource cover *this* scenario") that no check can grade.
**Conséquences:** An uncovered blocking link is completed and verified inside the phase's existing mandate and bounds when the plan provides for it or the mandate permits it, and committed with the phase; when it exceeds that mandate or fails inside the bound that already exists, the run preserves its evidence and edits under the current rules, declares no PASS, and takes the existing blocked or failure exit with the diagnosis and the exact next action — no implicit scope extension, no troubleshooting loop, no technical diagnostic question to the user. Never a new skill, framework or infrastructure phase by default, and never work for a scenario no phase observes. A recipe actually used is preserved whether it was found or improvised. Genuine personal judgment and access only the user holds stay a legitimate ask about the result. Establishing the path is never a PASS: `/esq:build` still probes its own session and observes the result.
**Alternatives rejetées:** Naming the instrument alone — the shipped rule under which both defects were already filed and closed, and the closure of local B-015. A project-instrument sweep as its own phase or skill — the systematic tooling chantier this unit is bounded against, billed on projects whose path is already complete.

## D-the-guard-is-a-conformance-clause — The guard is a clause in the control that exists

**Scope:** arch
**Topic:** conformance
**Date:** 2026-09-18
**Statut:** Active
**Fondement:** mandate — the invocation's "Réutiliser les contrôles existants … Pas de nouveau moteur de vérification", and CLAUDE.md § audit-scripts

**Contexte:** The observation-path rule is a clause corrected twice, so it owes a check that fails the build rather than more prose — and the same clause must survive in four carriers (two plugin references, two flat legacy copies).
**Décision:** Mechanize it as `need`/`refuse` clauses under a new `docs/CONFORMANCE.md` scenario, with fault injections in `scripts/test-conformance-guard.sh`, and add no new `check-*.sh`. The clauses hold the routing defect as well as the wording: a `refuse` on the retired "a found skill exempts this" exemption, and one clause each for the two inverse controls — a covered path adds no tooling, a real human need is not automated away.
**Raison:** `scripts/audit.sh` already runs `check-conformance.sh` once over `commands/esq` and once over `plugin/skills`, and runs `test-conformance-guard.sh` too, so a single `need` clause pins the sentence in every carrier and makes the mirror obligation mechanical at no new pass. A presence-only clause set would stay green with the old exemption restored beside the new text, which is the defect that let a found-but-incomplete skill through; `refuse` is what closes it.
**Tradeoff:** Gained: the mirror obligation and the retired routing are both enforced by the control that exists. Accepted: the clauses are single-line literal matches — **lexical, never a behavioral replay of the two missing-link cases**: they prove the sentences are present and the exemption absent, never that a run obeyed the rule, and a replacement worded close to a retired sentence will red its own `refuse`.
**Alternatives rejetées:** A dedicated `check-observation-path.sh` — a second traversal of the same two trees, opted into the audit's coverage lists, for a lexical assertion the conformance check already expresses. Prose alone in the four carriers — the failure mode this project's own standing rule names.

## D-readme-prose-is-part-of-the-clause-edit — README prose is part of the clause edit, not a follow-up

**Scope:** arch
**Topic:** conformance
**Date:** 2026-09-18
**Statut:** Active
**Fondement:** mandate — CLAUDE.md § "A defect against this unit is not a backlog candidate" (an ordinary omission is corrected inside the phase, in the task's own commit)

**Contexte:** Replacing the build-side presence-of-a-skill block left two README sentences describing the retired routing — a paragraph opening "When the probe finds no *project* instrument" and closing "Both are skipped when a project skill already exists", and a line promising that `/esq:build` files the candidate whenever it improvised a driver. The plan's `Files touched` names four carriers and `docs/`, not `README.md`.
**Décision:** Correct both sentences inside Task 1.2's own commit, as part of the clause edit, rather than file a backlog row or leave them for a later pass.
**Raison:** A narrative that still states the retired exemption is not merely stale — it asserts a routing the skills no longer carry, and README is where a reader goes before the skill files. It is a defect in text this unit itself invalidated, which the standing rule sends to the task's commit rather than to a row; a row would be closed when some plan ships, while the contradiction would stand in the meantime. The `refuse` clause pins only the two skill carriers, so nothing mechanical would have caught it.
**Tradeoff:** Gained: no carrier of the rule contradicts the shipped version, and the correction lands in the commit whose change caused it. Accepted: one file outside the plan's declared `Files touched` list was edited, recorded here and in the phase's log entry rather than passed off as planned work.
**Alternatives rejetées:** A backlog row — forbidden for a defect in code this unit wrote, and it would leave README asserting the retired exemption until some future plan. Leaving it untouched and noting the drift in the log entry — the log entry is not read by anyone reading README. Rewriting the README section wholesale — beyond the unit, and the two sentences are the only ones the replacement invalidated.

## D-the-result-ask-survives-the-engineering-close — The engineering question stays closed, the observation ask stays open

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-18
**Statut:** Active
**Fondement:** user — the invocation of 2026-09-18 on `observation-path-before-manual-fixes`: "le but est de faire le travail automatisable dans les bornes, pas de rendre impossible une confirmation humaine lorsque l'agent ne peut pas observer", with "ne rétablis pas pour autant le renvoi automatique au premier échec de lancement"

**Contexte:** `beb5e8f` closed step 3 of `build/references/manual-verification.md` — the only written source of a user-supplied observation — to the missing-instrument case, so a project with no driver pauses, re-probes, finds nothing, is barred from step 3 and loops (B-174). The two clauses that authorize and classify that pause were meanwhile never re-keyed and still require that no instrument was found at all, leaving the missing starting-state case with no matching bullet and no classified `[authority]` stop (B-175).
**Décision:** The boundary is drawn on the *kind* of question, not on the presence of a resource: an absent or broken instrument never reaches the user as an engineering question, and reaches them as a *result* ask only once the uncovered link has been diagnosed and settled inside the phase's existing mandate and bound; and the pause, its stop classification and every summary of it key on an uncovered observation rather than on an absent instrument.
**Raison:** The two findings are one fault seen from each end — the run was denied the only exit that could settle it, while the exit that should have classified it described a state the run was not in. Reverting `beb5e8f` would restore the automatic fall-through from a first failed launch to the user, which is the defect it was written to close; adding a third pause clause would spend a new state on a wrong trigger. Re-keying the trigger and reopening one named condition closes both without new machinery.
**Tradeoff:** Gained: every point in the procedure has a classified way out, a pause carries a cause and an action that changes the state, and a pause created before this unit becomes resolvable. Accepted: the build entrypoint grows and every build run pays that growth, including a backend-only one; and two judgments no lexical check can grade — "is item 2 spent" and "is this observation still valid".
**Conséquences:** The three outcomes are distinguished by the exits that already exist — result not observed is `⏸ awaiting manual verification`, result observed false is the failure report, plan or task not executable is the failure report or `⏸ blocked on an open same-unit defect`. No new CLI state. The parent plan's criterion requiring an empty diff of both entrypoints is falsified by this decision and is corrected in place rather than dropped, with its execution log left intact. `docs/SPEC.md` and `docs/ARCHITECTURE.md` carry the retired trigger in prose and are refreshed by their own commands after the ship.
**Alternatives rejetées:** Reverting `beb5e8f` — it re-establishes the first-failed-launch fall-through the invocation forbids, and leaves the under-shot half unexplained. A third pause clause in `esq plan append-log` — a new state machine the invocation excludes, teaching every consumer a third clause to solve a wrong trigger.

## D-the-pause-is-keyed-on-the-uncovered-observation — The pause names the uncovered link, not the absent instrument

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-20
**Statut:** Active
**Fondement:** user — the invocation of 2026-09-18 on `observation-path-before-manual-fixes`, whose boundary half is registered as [[D-the-result-ask-survives-the-engineering-close]]; this entry registers the pause half that decision names in a clause and does not itself define: what authorizes the stop, what classifies it, and what a later run may read off it.

**Contexte:** `D-the-result-ask-survives-the-engineering-close` settled which questions reach the user. It left open what the resulting stop is keyed on. Every clause that authorized, classified or summarized the `(manual)` pause still keyed on instrument presence — `build/SKILL.md`, the `[authority]` stop taxonomy, `autopilot`'s gate summary, the three legacy mirrors and the README prose — so the missing starting-state case reached the disposition, exceeded the phase mandate, was told to take the existing blocked or failure exit, and found that the only clause describing that exit required no instrument be found at all (B-175).
**Décision:** The pause is authorized and classified on one condition, stated identically in every carrier: a link the observation needs is uncovered, closing it exceeded this phase's mandate or failed inside its bound, and neither the run nor the user has observed the result. A pause so keyed records a cause and an action rather than an absence, so the diagnosis is written into the entry and a resume reads it instead of re-deriving it; a complement the entry already records as spent is not re-attempted, and an explicit user observation still valid for that step settles the pause rather than being discarded because the probe still finds no driver.
**Raison:** A stop keyed on an absent instrument can only describe one of the states that reach it, so the shape this unit exists to serve had no matching bullet — and a pause that records an absence gives the next invocation nothing to act on, which is why the loop the review found could form at all. Keying on the uncovered link makes the same stop describe every state that reaches it and carry what resolves it.
**Tradeoff:** Gained: one condition covers every route into the pause, the stop is classified for the flagship shape, and a pause created before this unit becomes resolvable because its diagnosis is read rather than re-probed. Accepted: the condition is longer than the sentence it replaced and is repeated across six carriers, so it costs prose in the build entrypoint that every build run loads; and "is this observation still valid" is a judgment no lexical check grades.
**Conséquences:** The retired trigger is refused on the `build` carrier, so restoring it beside the new text reds `check-conformance.sh`. Scenario P-14 pins the new condition and both retired routings together, each with its fault injection in the native layout and the legacy copy. The three outcomes stay distinguishable from the artifact alone, and no new CLI state exists — `esq plan append-log` and `esq plan resolve-block` are unchanged.
**Alternatives rejetées:** Leaving the pause keyed on the instrument and widening only the ask — the missing starting-state case would still reach an exit whose clause describes a state it is not in, which is the half of the fault the review filed separately. Adding a third pause clause — a new state for every consumer to learn, spent on a trigger that was simply wrong.

## D-a-measurement-base-outrun-by-main-moves — a fixed base main has outrun is re-based to `main`, not re-pinned

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** user — authorized 2026-09-20 during `observation-path-before-manual-fixes` Phase 1 for the sibling step (commit `7b00fdd`, repair edit 1/3); this plan propagates that same authorization to the two carriers it was never applied to

**Contexte:** Three assertions in the `observation-path-before-manual` unit measured `plugin/skills/plan/SKILL.md` against `2ac72b6`, a base chosen on 2026-09-18. Merging `main` on 2026-09-20 brought `44c291e` and `78ce894`, two commits of main's own that edit that file, so the base could no longer isolate this unit's share and the live `(auto)` step reds at landing on work that is not ours.
**Décision:** Re-base such an assertion to `main` — the branch the unit lands on — keeping the property it was written to prove and naming, in place, the commits that outran the old base and when the re-base was authorized.
**Raison:** The claim being made is *this unit changed nothing here*, and the only reference against which that claim stays both true and meaningful is the one the unit merges into. A fixed base proves it only until main touches the same file, after which it proves something nobody asked.
**Tradeoff:** Gained: the assertion survives main moving, and the unit reads consistently because its sibling step already measures this way. Accepted: the reference is no longer immutable, so a late main commit to the same file reds the step again — answered by merging main and re-running, not by re-pinning.
**Conséquences:** Growth-measurement steps keep their fixed base — they measure a delta, not an emptiness, and a moving reference would destroy the comparison. Execution-log entries and `**Verified:**` hashes are never re-based; they record what was proved on the day, and the correction is made in the prospective section beside them.
**Alternatives rejetées:** Re-pinning to the merge-base `759a64a9` — it falls after this unit's Phase 1 work began, so a diff against it no longer measures "this unit changed nothing", and it would leave one property with two references. Deleting the assertion — that drops a declared protection at exactly the moment it is being tested, which is dropping a criterion rather than correcting it.

## D-a-landing-closes-the-delivery-it-can-cite — A landing carries out the disposition its own research proved

**Scope:** arch
**Topic:** landing-gate
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** user — authorized 2026-09-21 in session, on the report that `/esq:land` researches a promised row's delivery and then hands back a command the user copy-pastes unchanged; the authorization is explicitly narrowed here to a cited whole delivery, the user having named the `dropped` direction as theirs

**Contexte:** [D-evidence-settles-backlog-dispositions] moved dispositions to the command holding the evidence, and scenario U-15 case (d) already classes a promised row's delivery as something to research rather than ask about — but it carved `/esq:land` out, and `/esq:land` step 7 therefore researched each row fully and then printed `/esq:backlog <B-NNN> done` with the commit beside it for the user to paste back. The carve-out's own words name completeness as the thing it refuses (`never closes unit.promised because a unit is complete and reviewed`) and its rejected alternative is `letting land close promised rows once the unit is complete and covered`; both are about an *inference*, not about a delivery the command can cite. Read as covering cited delivery too, it left the landing the one command forbidden to act on research it was required to do.
**Décision:** `/esq:land` step 7 closes a `unit.promised` row when a commit or execution-log line delivers its **whole** promised outcome, with `esq backlog set-status <B-NNN> done --by <slug> --resolution "<evidence>"` — the deterministic verb, never the reserved `/esq:backlog` skill — chained into one shell call, committed once as the command's own bookkeeping, and followed immediately by a fresh `esq branch check` whose verdict every later step uses. Completeness alone closes nothing, partial or split evidence closes nothing, and a `unit.open` row is never closed here.
**Raison:** The bar this sets is the one build's last phase and fix already close on; what was asymmetric was who may apply it, not what it is. The direction of error is unchanged — a row closed that was not delivered is worse than one left open — so the close is gated on a citation written into the ledger rather than on the landing's own confidence, and every disposition that is a judgment (accepting a defect unfixed, resolving split evidence) stays a stop. The round trip it removes carried no judgment: the command had already read the row, the `## Done looks like`, the logs and the commits before it printed the line for the user to paste.
**Tradeoff:** Gained: the landing's most common stop disappears when the evidence is unambiguous, and the evidence lands in the ledger instead of in a terminal the user retypes from. Accepted: `/esq:land` is no longer write-free before the merge — one prerequisite makes one commit — so its announced bound names that commit, the prerequisite sequence is no longer uniformly a no-op, and the run must re-read its facts after its own write or step 11's moved-HEAD guard would fire on it.
**Conséquences:** `docs/BACKLOG.md` is in `GATE_LEDGERS` and in the projection harmless list, so the bookkeeping commit stales neither `esq gate verify` nor the unit's review coverage; no CLI change was needed. A row closed here stays closed when a later prerequisite refuses the landing, because it records a delivery that happened. Scenario U-15 pins the close, its whole-outcome bar, the CLI-verb-not-skill rule and the unfixed-defect authority that stays the user's; R-08 pins the single write, the re-read and the closed row surviving a refusal. `/esq:status` still only advises — it is read-only and routes, it does not dispose.
**Alternatives rejetées:** Dropping `disable-model-invocation` from `/esq:backlog` — it would hand a model the `dropped` decision, which is the user accepting a known defect unfixed, and this change needs no frontmatter at all. Leaving the carve-out and shortening the hand-off line instead — it is the round trip that costs, not the line. Closing on completeness, as the 2026-09-11 alternative proposed — still rejected, and now stated as such in step 7 rather than implied by the absence of any close.

## D-a-standard-arbitrates-a-stated-constraint — A stated constraint is arbitrated against a written standard before it becomes the user's

**Scope:** prod
**Topic:** ask-threshold
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** user — `docs/plans/2026-09-21-standards-referent.brief.md` § Resolved decisions, 2026-09-21: "Whether a standard may settle a `stated constraint` 🔴: yes, unless marked hard — user chose", with the recording form fixed there as `docs/DECISIONS.md` naming the standard as its basis

**Contexte:** [D-a-question-needs-a-missing-authority] lists a stated constraint among five absolute ask triggers, and all ten authors of a 🔴 carry that sentence. B-169's specimen 2 is what it costs: a 265px overrun against a 4800px budget written into `## Done looks like` stopped the run to ask whether 5.5% was acceptable, with no written standard to arbitrate against — verified 2026-09-19 and again on 2026-09-21, no engineering or design referent exists anywhere in `docs/` or `plugin/skills/`.
**Décision:** A stated constraint whose class the referent covers, departed from inside the threshold that class names, is decided by the run and recorded in `docs/DECISIONS.md` with `**Fondement:** mandate — <the standard's clause>`. A class the referent does not cover, a departure past its threshold, a security, privacy or data-retention constraint at any magnitude, and any `## Done looks like` bullet written `(hard)` raise the 🔴 exactly as before. The other four triggers of [D-a-question-needs-a-missing-authority] are untouched.
**Raison:** The trigger was absolute because there was nothing to arbitrate against; a referent removes the reason rather than the guard. The direction of error is held by making every class not arbitrable by default and naming only the ones that are — a class wrongly opened ships a violated constraint silently, where a class wrongly held costs one 🔴 the user can answer in a line.
**Tradeoff:** Gained: the most common velocity-killing stop in the epic's evidence disappears wherever a written standard already answers it. Accepted: the threshold now depends on a file that must be right, and a referent that overreaches converts the user's constraint into a suggestion — which is why the `(hard)` escape is the author's and costs nothing to type.
**Conséquences:** Scenario U-15's prose and needles change with it, and `docs/SPEC.md`'s statement of the trigger becomes stale until `/esq:spec` refreshes it after the ship. The `**Fondement:**` field gains no fourth state: an arbitration is `mandate`, because the referent is the accepted frame written down.
**Alternatives rejetées:** Leaving the trigger absolute and writing the referent as advisory — the specimen still stops, and a standard nothing may act on is documentation. Making every stated constraint arbitrable with no class taxonomy — that is not arbitration, it is discretion, and it would let a run decide a deadline or a public API shape.

## D-the-referent-ships-in-the-plugin-and-the-cli-resolves-it — The default referent is a plugin-root file the CLI resolves, never a skill reference

**Scope:** arch
**Topic:** ask-threshold
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** mandate — `docs/plans/2026-09-21-standards-referent.brief.md` § Deferred to planning, which hands "how the plugin default file is located at runtime, and where it sits in the plugin tree" to the plan

**Contexte:** Seven and then ten commands must reach one file, from the plugin tree and from the temporary legacy `commands/esq/` tree, on a developer checkout and from the marketplace cache. The obvious home — a `references/` file under one skill — is addressed in skill prose as `${CLAUDE_SKILL_DIR}/references/<file>.md`, and that variable names the *running* skill's directory, so nine of the ten carriers would resolve it to a path that does not exist. `scripts/check-refload.sh` would additionally demand one verbatim load declaration per call site.
**Décision:** The default ships at `plugin/standards/STANDARDS.md` and is reached through a new `esq standards` verb, which returns the project's `docs/STANDARDS.md` where it exists and the plugin default beside it, paths and text, in one call. The project file is read by every author and written by nothing in this unit.
**Raison:** Path resolution is structure, which is the CLI's to own and the model's to be spared; one verb reads the same from both trees because both reach the same installed binary; and one call hands the run the whole referent rather than a path it must then read. The file sits outside `plugin/skills/`, so `check-refload.sh` is not in play at all rather than being satisfied ten times.
**Tradeoff:** Gained: one clause, one command, identical in twenty carriers, and a project override that costs the project nothing but a file. Accepted: a new CLI verb and a new top-level plugin directory, plus a fallback sentence in the clause for a run with no `esq` on `PATH` — which reads `docs/STANDARDS.md` if the project has one and otherwise asks as before.
**Conséquences:** `esq standards` is additive: no existing consumer parses it, and no existing verb changes. A later unit that fills part 2 edits one file and ships it with the next release; a project that wants to differ writes `docs/STANDARDS.md` and nothing else.
**Alternatives rejetées:** A `references/` file under `plan` or `build` cited by the others — it cannot be addressed, per the Contexte. An absolute path written into the clause — correct on one machine. Inlining the taxonomy into the shared clause itself — a project could never differ, part 2 would have nowhere to grow, and `plugin/skills/plan/SKILL.md` has seven lines of headroom against a hard cap (B-131).

## D-the-consult-rides-both-ask-block-families — The consult extends the two families that already carry one threshold

**Scope:** arch
**Topic:** ask-threshold
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** mandate — `docs/plans/2026-09-21-standards-referent.brief.md` § Deferred to planning, which hands "whether the consult is one clause inside `ask-altitude` or a named sub-block within it, and the phase order across 14 files" to the plan

**Contexte:** The brief describes spreading the `ask-altitude` block from `grill`, `plan` and `ui` to `build`, `fix`, `autopilot` and `advance`. Those four already carry the `decision-block`, whose *And it has to be theirs* paragraph states the same five threshold sentences — scenario U-15 exists precisely to hold the two families to one wording so neither drifts alone. Moving the block would leave four files saying the same five sentences twice.
**Décision:** The consult is one paragraph appended, byte-identical, to the host line of both families: the `ask-altitude` block's `**Theirs**` bullet in `plan`, `grill` and `ui`, and the `decision-block`'s *And it has to be theirs* paragraph in `check`, `review`, `fix`, `autopilot`, `converge`, `advance` and `build`'s `references/failure-and-recovery.md`. No carrier set changes, so audit checks 14 and 19 need no edit.
**Raison:** It delivers the brief's `## Done looks like` literally — the four named commands carry the clause byte-identical with the original three, in both trees — while reaching `check`, `review` and `converge` as well, at no extra cost. Appending to an existing line also keeps every carrier line-neutral, which is what lets `plugin/skills/plan/SKILL.md` stay at 493 against `check-plugin.sh`'s 500-line cap.
**Tradeoff:** Gained: ten authors instead of seven, no duplicated paragraph, no carrier-list edit in `audit.sh` and no new fault case for the hash checks. Accepted: the two host lines are long, and the identity of the appended text across families is held by U-15's needles rather than by a single hash.
**Conséquences:** A future author of a 🔴 gets the consult by carrying either family, and U-15 remains the single place the two are held to one threshold. No third block on this subject is created — the shape [D-a-question-needs-a-missing-authority] already rejected once.
**Alternatives rejetées:** Moving the whole `ask-altitude` block into the four commands — five sentences duplicated per file, a carrier-list edit in two audit checks, and roughly ten lines added to files that need none. A new `shared:escalation-threshold` block — a third block on the same subject, named and rejected in [D-a-question-needs-a-missing-authority]'s own *Alternatives rejetées*.

## D-standards-resolves-or-refuses — `esq standards` refuses rather than answering with no standard

**Scope:** arch
**Topic:** standards
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** mandate — the plan's Phase 1 task 1.2 names the four cases the verb must cover (no project file, an empty one, an unreadable one, a missing plugin default) and leaves their contract to the implementation

**Contexte:** `esq standards` resolves a project `docs/STANDARDS.md` over the plugin default, and either file can be absent, empty or unreadable. The verb had to state what it does when a file contributes nothing, and what it does when nothing is left.
**Décision:** An empty or unreadable file is a `findings` note beside a referent that still resolves and exit 0; only a call where *neither* file yields text throws, exiting 2.
**Raison:** A caller that gets an answer must always have a standard to arbitrate against. Answering with an empty referent would let a run read "no clause covers this" off a broken installation and decide a constraint it had no authority over — the one direction part 1 is written to avoid, since a wrongly-arbitrable constraint ships silently where a wrongly-hard one costs a single 🔴.
**Tradeoff:** Gained: no caller can mistake an unresolvable referent for a silent one. Accepted: a broken plugin install turns a read-only verb into a non-zero exit the carriers' clause has to tolerate.
**Conséquences:** The consult clause Phase 2 appends may treat any successful `esq standards` as a complete referent, and must treat a non-zero exit as *no standard*, which falls back to the pre-existing 🔴 rather than to arbitration.
**Alternatives rejetées:** Returning an empty referent with a finding — it moves a safety decision into ten prose carriers that would each have to check `findings`. Throwing on an unreadable project file — a project-side permission fault would then block every run rather than falling back to the default that covers it.

## D-an-unresolved-referent-keeps-the-ask — An unresolved standards referent is silence, and the ask says so

**Scope:** arch
**Topic:** ask-threshold
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** mandate — `standards-referent`'s Approach A, which listed "a run with no `esq` on `PATH` needs a fallback sentence in the clause" as a cost of the chosen approach, and the corrective brief's 🟡 which names delivering that sentence as this unit's work.

**Contexte:** The consult clause shipped into twenty carriers naming `esq standards` with no instruction for a run where the verb cannot resolve, while the six sibling CLI-dependent instructions in the same files all carry an explicit unavailability fallback. A run had to infer the safe reading from a sentence written about the referent's content rather than its reachability.
**Décision:** One sentence appended byte-identically to all twenty carriers: an unresolved referent is silence, so the constraint is the user's, the ask stands, and the ask names the unreadable standard as its reason.
**Raison:** The alternative that keeps arbitration alive on a degraded install — read the project's `docs/STANDARDS.md` directly, which is addressable by a repository-relative path even when the verb is not — arbitrates against half a referent: the classes, the thresholds, the never-arbitrable list and the `(hard)` marker all live in the plugin default, which is exactly the file no carrier can address (`D-the-referent-ships-in-the-plugin-and-the-cli-resolves-it`). A project file overriding only part 2 would leave a run holding a referent with no thresholds in it, and the direction of that error is the expensive one — a class it cannot place read as licence rather than as silence.
**Tradeoff:** Gained: no path arbitrates against a referent it did not read, and the failure direction is one interruption the user might have been spared. Accepted: a project that wrote a permissive `docs/STANDARDS.md` loses the arbitration it paid for whenever the run cannot reach the CLI.
**Conséquences:** The clause's reachability condition is now pinned by its own U-15 needle beside the two content sentences, so a fifth condition added later must be appended to the same host line as prose — the append pattern runs out of readability well before it runs out of the seven lines `plugin/skills/plan/SKILL.md` has left against its cap (B-131).
**Alternatives rejetées:** Reading `docs/STANDARDS.md` directly and arbitrating against whatever it yields — arbitration against a referent missing its own thresholds, decided by a run that has just lost its CLI, with a second judgment ("is this half enough?") imposed at the worst moment. Renouncing the sentence and recording the silence reading in this registry alone — the registry is not what a run reads at the moment it needs to know, and nothing would catch a future author who infers the other way.

## D-an-unresolved-referent-is-unresolved-however — The clause states the condition, not one of its causes

**Scope:** arch
**Topic:** ask-threshold
**Date:** 2026-09-21
**Statut:** Active
**Fondement:** mandate — `D-standards-resolves-or-refuses`'s `**Conséquences:**`, which requires the consult clause to treat a non-zero `esq standards` exit as *no standard*, and `D-an-unresolved-referent-keeps-the-ask`, which decides the reading for "an unresolved referent" without qualifying how it became one

**Contexte:** The reachability sentence shipped into twenty carriers naming one cause of an unresolved referent — `esq` unavailable on the temporary legacy path. `esq standards` also exits non-zero with `esq` present, whenever neither `docs/STANDARDS.md` nor the plugin default yields text (`plugin/lib/cli.mjs:5011`), and that second cause had no stated reading.
**Décision:** The sentence states the condition first — a referent that does not resolve — and names both causes behind an em dash, keeping the reading, the single needle and the single fault injection unchanged.
**Raison:** The narrowing rested on a case the verb never produces: the stem ruled the exit out as "a diagnosis from a verb that *did* resolve", but `standards()` throws in exactly one place and that place is the one where nothing resolved. Leading with the condition also makes a third way of failing to resolve read as covered rather than excluded.
**Tradeoff:** Gained: the carrier says what the two governing decisions decided, in one sentence, with no second sentence to keep in sync. Accepted: a parenthetical clause on the block's longest host line, in the place the stem's own Risks flagged as running out of readability.
**Conséquences:** A later change to what `esq standards` exits non-zero on needs no carrier edit — the clause names the condition, not the code. A ninth sentence remains the wrong shape for anything that is still "the referent did not resolve".
**Alternatives rejetées:** A ninth sentence covering the exit separately — two sentences saying one thing, a drift surface the family hashes cannot see, and a second needle and fault for an identical reading. Recording the narrowing as deliberate — it contradicts `D-standards-resolves-or-refuses`, which would have to be superseded rather than cited, and the investigation it prescribes is unavailable to a run the verb has already told that nothing resolves.

## D-corpus-root-is-bound-once — The corpus root is bound once, not passed to every accessor

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — the plan's Task 1.1, which specifies four functions "over a corpus root" and leaves the binding shape to the implementation, and `audit-scripts`' nothing-to-check contract, which reserves exit 2 for a corpus that cannot be read

**Contexte:** `scripts/lib/skill-corpus.sh` serves twenty-one checks that each resolve a skill's files, and during the equivalence proof it serves two corpora of different shapes in the same run. Either every accessor takes the root as an argument, or the root is bound once and the accessors read it.
**Décision:** `skill_corpus_init <root>` binds the root, detects the shape and refuses an unreadable or empty corpus with status 2; `skill_names`, `skill_files`, `skill_grep` and `marker_carrier` then take the skill name first and read the bound root.
**Raison:** A root argument repeated at twenty-one call sites is twenty-one chances to pass the wrong one, and a check that silently reads the wrong corpus is the exact failure the plan's Risks section names as the one a guard suite must never produce. Binding once also gives the unreadable-corpus refusal a single place to live, at audit start, before any check has run.
**Tradeoff:** Gained: one call site decides the corpus, and the refusal happens before a check can pass green over nothing. Accepted: two shell globals (`SKILL_CORPUS_ROOT`, `SKILL_CORPUS_SHAPE`), and an accessor called before the init returns status 2 rather than reading a default.
**Conséquences:** Phase 2 converts a call site by substituting the accessor for the `grep` and dropping the path, with no root threading. Phase 3's collapse removes the `ESQ_AUDIT_CORPUS` case statement and leaves a single `skill_corpus_init plugin/skills`.
**Alternatives rejetées:** A root argument on every accessor — it makes each call self-describing, at the cost of twenty-one chances to pass the wrong corpus and no single place for the nothing-to-check refusal. A default root baked into the helper — it would make an un-initialized accessor read something plausible instead of failing, which is the silent-green shape being designed against.


## D-a-mirror-check-names-the-mirror — A check about the mirror names the mirror

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Superseded by [D-the-audit-reads-the-shipped-tree] on 2026-09-22 — the six checks it governed named `commands/esq` because their subject was the mirror, and the mirror is gone with `ESQ_AUDIT_CORPUS` and three of those checks. Kept rather than deleted: the rule it states is the right one for any future check whose subject is a specific tree rather than the corpus.
**Fondement:** mandate — the plan's Phase 2 goal, that every *structural* check resolves its files through the helper and the audit returns the same verdicts against either corpus, and its Phase 3 Task 3.2, which retires these call sites with the mirror

**Contexte:** Six checks referenced `$CMD_DIR` without their subject being the skill corpus: check 10 compares the legacy mirror against the legacy install target, and checks 16, 35, 40, 42 and 45 already read *both* trees, naming `plugin/skills` first and the mirror second. Repointed at the selected corpus they would have read `plugin/skills` twice under `ESQ_AUDIT_CORPUS=plugin` and reported one tree as two, which is the equivalence proof failing for a reason unrelated to any conversion.
**Décision:** Those six name `commands/esq` literally — check 10 through a `LEGACY_DIR` constant, the other five in their root lists — and the corpus switch reaches only the checks whose subject is the skill corpus.
**Raison:** `$CMD_DIR` means "the corpus the structural checks read", and a check that reads the mirror *because it is the mirror* was never asking that question. Substituting the switch there would have coupled an unrelated check to a variable it does not depend on, and the cost of being wrong is not a wrong verdict but a false difference in the one diff that certifies this phase.
**Tradeoff:** Gained: an empty equivalence diff that means what it says, and six checks whose root says why it is that root. Accepted: six literal `commands/esq` strings back in `audit.sh`, all of which Phase 3 deletes or collapses.
**Conséquences:** Phase 3 finds every retiring call site with `grep -n "commands/esq" scripts/audit.sh` rather than by re-reading each check. The dual-root loops collapse to `plugin/skills` alone, and check 10 goes with the installer.
**Alternatives rejetées:** Letting all six follow the switch and accepting a non-empty diff with a written explanation — it turns the phase's one mechanical proof into a judgement call, and the next reader cannot tell an explained difference from an unexplained one. Deduplicating the root list at runtime — it makes the plugin run print one line where the legacy run prints two, so the diff is still not empty and the check now behaves differently depending on a variable it should not read.

## D-the-printed-region-is-the-skill-minus-its-artifacts — The conclusion region is the skill's printed output, not a document tail

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — the plan's Task 2.2, which converts the marker-block checks and leaves the region each one scans to the implementation, and `D-conclusion-block-where-zone-two-fills`, which fixes which commands carry the block

**Contexte:** Check 18 scans from `<!-- conclusion:start -->` to end of file and asserts two things over that span: every report template leads with a headline glyph, and no line's value is `"None."`. In the flat mirror that span is well defined because a skill is one file. In the nested tree `build`'s block lives in `references/reporting-and-stops.md`, and the mirror splices references in at their citation points, so "everything after the marker" is a different set of text in each corpus and cannot be reconstructed from the nested tree.
**Décision:** The region is the marker-carrying file from its marker onward, plus every reference file of the skill in full, and nothing of the entrypoint above the marker.
**Raison:** The scope exists to exclude exactly one thing — an *artifact* template above the marker in the entrypoint, such as `build`'s execution-log format, which is right to say `(Or "None.")` because a reader opens that file months later. Everything else in a skill is printed-report territory, so defining the region by what it excludes reproduces the flat verdict while reaching report templates in `references/` that no check could see before.
**Tradeoff:** Gained: `build`'s failure-report template in `references/failure-and-recovery.md` is inside the guard suite's reach for the first time, and the verdict is unchanged today on all sixteen carriers. Accepted: a skill that later puts an artifact template in a reference file would be flagged, and would have to move it or earn an exclusion.
**Conséquences:** A report template added to any reference file is checked from the moment it lands. Phase 3 changes nothing here — the helper is shape-agnostic and the flat branch simply stops being exercised.
**Alternatives rejetées:** The carrier's tail plus every file sorted after it — closest to a literal reading of "marker to EOF", but alphabetical ordering would decide coverage, and it silently drops `build`'s failure template because `failure-and-recovery.md` sorts before `reporting-and-stops.md`. Scanning the whole skill — it flags `build`'s execution-log `(Or "None.")` line, which is the one thing the scope was created to protect.

## D-a-shared-block-finding-names-the-command — A shared-block finding names the command, never the file

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — the plan's Task 2.4, which makes `check-sharedblocks.sh` accept a nested corpus (B-110) and extends its fault injection to a nested copy

**Contexte:** `check-sharedblocks.sh` reported `converge.md's orch-shared:runs-long block differs from advance.md's`, and `test-sharedblocks-guard.sh` asserts that exact string. Once the check reads a nested corpus the carrier may be `converge/SKILL.md` or any file under `build/references/`, so either the finding names a path that differs per shape, or it names something both shapes share.
**Décision:** The finding names the command — `converge's orch-shared:runs-long block differs from advance's` — and the script derives that command from the first path segment under the corpus root rather than from a basename.
**Raison:** Every carrier in the registry is a command, the reader's next action is to open that command whichever shape they are in, and one string means the guard runs all fourteen injection cases against a flat and a nested copy with no per-shape expectations. A basename would have called every nested entrypoint `SKILL` and every reference by a name the registry does not list.
**Tradeoff:** Gained: one finding vocabulary, and a fault injection that exercises both code paths instead of certifying one by reading the other. Accepted: a drift finding in a split skill says which command and not which of its files, so the reader greps for the marker.
**Conséquences:** Adding a corpus shape later costs a path rule in one `FNR == 1` block and no test changes. Phase 3 removes the flat branch of the guard's loop and leaves the finding strings untouched.
**Alternatives rejetées:** Naming the real file path — the most useful message for a split skill, at the cost of shape-specific expected strings in every guard case, which is exactly the duplication the registry exists to prevent, relocated into its test. Keeping the `.md` suffix on the command name — it would have left the flat expectations untouched while asserting a filename that does not exist in the tree users run.

## D-a-retired-path-is-held-by-a-check — A retired path is held retired by a check

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — CLAUDE.md § What esq is for, rule 3: work moved from the model to a local script is won twice, cheaper and repeatable, and work left to the model that a script could settle is paid again on every run.

**Contexte:** The plan that retired `commands/esq/` asserted its end state with one `grep` in a phase's verification step. The step could not express its own sentence — its `^./docs/plans/` filter is inert under the ugrep shim that Claude Code's Bash tool resolves `grep` to, and returns the history ledgers under GNU grep — so the property was never checked at all, and would have been checked exactly once if it had been.
**Décision:** The property becomes `scripts/check-legacy-absent.sh` with `scripts/test-legacy-absent-guard.sh` beside it, wired as audit checks 61/62 on the `check-nopush.sh` shape, rather than a corrected grep in a plan file.
**Raison:** The coupling being retired survived five weeks because nothing mechanical was watching it, and the repo's own argument against a capability behind no guard — one plausible edit from returning — applies to a path exactly as it applies to a push. A guard also names the real file and the real line, where a grep pipeline in a plan names whatever the shell happened to resolve.
**Tradeoff:** Gained: the property is held on every commit, by an instrument whose reach is stated in its own header and whose silence is fault-injected. Accepted: one more check pair in a sixty-check suite, and a carve-out rule that has to be written correctly once.
**Conséquences:** Any future retirement of a path in this repository has a shape to copy, and the plan that retires it declares the check rather than a grep. The next path to retire adds a literal to one script instead of a step to a plan.
**Alternatives rejetées:** Correcting the filter and widening the exclusion list — the smallest diff, and it buys the proof for one commit and leaves the property unheld forever after. Deleting every remaining mention to satisfy the grep literally — it would delete the `~/.claude/commands/esq/` instruction a shadowed install depends on and the refusal in `journey-runner.mjs` that stops a billed run measuring the wrong tree.

## D-a-retirement-record-names-the-thing-not-the-path — A retirement record names the thing, not the path

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** user — the diagnosis put to the user on 2026-09-22, answered by keeping the stem plan's criterion as stated and asking for the approach to be re-planned rather than the criterion relaxed.

**Contexte:** With the filter corrected, 102 mentions of the retired path stood in 12 files, and the diagnosis reported none of them removable: the history ledgers record what happened, and the live prose either records the retirement or tells an operator to delete `~/.claude/commands/esq/`, a directory that still shadows the plugin on machines that installed it. A criterion stating that nothing in the repository still references the path was therefore unsatisfiable as any tool could read it.
**Décision:** After a path is deleted, the repository spells it only where a reader has to act on it — the installed directory — and the history ledgers keep their records; every other mention names the thing that retired, so "the `commands/esq/` mirror is deleted" becomes "the flat legacy mirror is deleted".
**Raison:** The distinction the grep could not make is real and is the whole content of the criterion: a path that is gone is a thing a reader can only be misled by, while a path that exists on their machine is the one instruction they need. Writing the rule down makes the criterion enforceable with no vague judgment inside the check.
**Tradeoff:** Gained: a criterion a check can hold, and a record that loses nothing a reader needs. Accepted: the record is one indirection further from the path, so a reader chasing history goes through `docs/DECISIONS.md` rather than a grep.
**Conséquences:** `check-legacy-absent.sh` carves out an occurrence preceded by `.claude/` and nothing else, and names `docs/plans/`, `docs/DECISIONS.md`, `docs/BACKLOG.md`, `docs/ROADMAP.md` and `docs/baselines/` as opt-outs with a reason each.
**Alternatives rejetées:** Exempting the live prose files wholesale — a guard whose only finding is on its own opt-out list guards nothing, which is `check-nopush.sh`'s recorded reason for having no opt-outs at all. Keeping the path in the record for precision — precision about a path that no longer resolves is the thing that misleads.

## D-a-path-guard-reads-the-path-not-only-the-content — A path guard reads the path, not only the content

**Scope:** arch
**Topic:** audit
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — the plan's Task 1.3, which requires the fault injection to red on a reintroduced `commands/esq/plan.md`.

**Contexte:** `check-legacy-absent.sh` was specified as a pass over the content of every regular file under a root. Its fault injection was specified to reintroduce the flat mirror as a directory — and a reintroduced `commands/esq/plan.md` holding an ordinary skill prompt carries the banned literal in neither its lines nor its prose, so a content-only check would have reported that tree clean.
**Décision:** The check judges each file's path relative to the root as well as its content, under the same carve-out, and reports a path finding by path rather than by file and line.
**Raison:** The reintroduction that matters most is the one that leaves no text behind: a directory comes back as a `git mv` or a `cp -r`, not as a sentence. A guard blind to it would have passed exactly the edit the retirement was spent removing, while reading green on the prose it can see — the same shape as the stem plan's own failure, a guard passing over a corpus it could not read.
**Tradeoff:** Gained: the mirror cannot come back as a tree of innocuous files. Accepted: the check now has two halves with one carve-out spelled twice, and a path finding carries no line number to quote.
**Conséquences:** Any later guard holding a deleted path copies both halves; the path half belongs in the loop that already has the relative path in hand, so it costs no second pass over the tree.
**Alternatives rejetées:** Narrowing the guard's injection to a content-bearing file — it satisfies the plan's sentence and proves nothing about a directory, which is the shape a mirror actually returns in. A separate check for paths — one pass over the corpus is the suite's cost rule, and two checks would split one property across two numbers.

## D-a-prose-sweep-corrects-what-its-grep-cannot-see — A prose sweep corrects what its grep cannot see

**Scope:** arch
**Topic:** verification
**Date:** 2026-09-22
**Statut:** Active
**Fondement:** mandate — the plan's Phase 2 Goal, that the projection docs and the behavioral contract describe one corpus, and the `## Done looks like` bullet that a maintainer reading them is not told a second tree exists.

**Contexte:** Phase 2's own `(auto)` step is a line-based `grep` for `both trees\|legacy mirror` over four named files. Three live claims in `docs/CONFORMANCE.md` sat wrapped across a line break — `present in every author in both` / `trees`, `the citation sentence in every file of either tree` / `carrying the entry template`, `present, identical` / `across both trees` — so the step returned no match for them and would have gone green with all three standing.
**Décision:** The three wrapped occurrences were corrected with the rest, and the blind spot recorded in the execution log rather than left for the lane's `/esq:check` pass.
**Raison:** The step exists to observe a property — that no live contract document still says there are two trees — and the command is only the instrument that reads it. A sweep completed against the instrument's output ships the falsehood the instrument cannot see, which is the same failure the whole unit is correcting: the stem plan's guard passed green over a corpus it could not read. Correcting on sight costs three edits; leaving them costs a `/esq:check` round that finds a claim the phase had already read.
**Tradeoff:** Gained: the property holds rather than the check passing. Accepted: the phase's recorded proof is weaker than its result — the step attests to less than was actually fixed, and nothing mechanical will notice if the next wrapped claim is missed.
**Conséquences:** The phase's `(auto)` step stays as the plan wrote it — it is the durable guard's job to catch a reintroduction, not this step's — and the gap is named in the log so `/esq:check` reads the sweep's completeness against the property rather than against the grep. This is the wrapping half of the defect class Phase 3 writes into `/esq:plan`, whose clause as planned covers only the ambient-tool half.
**Alternatives rejetées:** Leaving the wrapped occurrences for `/esq:check` — it defers a correction already in hand to a paid subagent round, and the plan's own `high` uncertainty axis is bought for claims phrased differently, not for ones the phase read and declined to fix. Rewriting the step to a wrap-insensitive command — an `(auto)` step is a check on a property, not the guard that holds it, and widening it here would substitute a different check for the one the plan named.

## D-bounded-correction-exit-preserves-proof — A bounded exit preserves intent and historical evidence

**Date:** 2026-09-24
**Scope:** func
**Topic:** corrective-loop
**Statut:** Active
**Fondement:** user — implement B-179 after B-180, providing a usable exhausted-loop exit without a new generation or rewriting historical evidence, preserving ESQ's first principles.

**Contexte:** `fix` forbade plan-body edits; `plan` refused a third generation; the proposed abandon route refused completed plans. Filing remaining findings as Open also left landing blocked. Review excluded all plan paths, so merely allowing the edit would hide it from review.
**Décision:** Safe corrections can amend a prospective plan/document while preserving the intended property, branch/origin, phase identities and historical log. A dated amendment explains the correction; new verification is executed once and appended through the existing writer. Depth does not force a user question for a safe fix. Named findings explicitly accepted by the user can be disposed through `fix --accept B-IDs`, recorded as Dropped with reason/resolution and retired from the brief; debt acceptance neither claims delivery nor waives a verification. Every cleared brief hands back to review, and all normal landing obligations remain.
**Raison:** The model judges safety and authority; existing CLI writers retain structure. Review now includes changed prospective plan contracts and invalidates prior coverage for them, while proof-only appends remain bookkeeping.
**Tradeoff:** Review pays two Git object reads per changed plan, plus a changed-path query. No new CLI verb, status, plan generation, mandatory model run or prose guard is introduced. A genuinely changed scope or failed same-cause correction is not promoted to safe to escape the bound.
**Conséquences:** This replaces only the exhausted-exit option set of D-corrective-generations-bounded-at-two and the carriers described by D-one-shared-block-carries-the-corrective-refusal; their historical reasoning and the two-generation bound remain. Completed-plan abandonment remains refused. D-a-phase-buys-each-proof-once still prohibits rewriting obligations merely to obtain reuse.
**Validation:** `tests/cli/corrective-exit.test.mjs` exercises completed depth-two units through correction, append-only proof, delta review and local merge, with both changed and unchanged command strings. A separate disposition case keeps a failing verification visible. These are real-Git deterministic scenarios, not live model journeys.


## D-repair-command-before-proof — Repair the command before claiming its proof

**Date:** 2026-09-25
**Scope:** func
**Topic:** verification
**Statut:** Active
**Fondement:** user — B-107 mandate of 2026-09-25: reproduce build/proof/land mismatch, make the smallest coherent correction without presupposing landing substitutions, preserve criterion, actual command, provenance and freshness.

**Contexte:** The current CLI reproduction records a legitimate replacement PASS, then land's gate requests the missing original command. Evidence: docs/preparation/2026-09-25-b107-command-repair.md.
**Décision:** Keep plan-time referent reading. Replace build's unrunnable-command substitution with a prospective correction under its existing three-repair/distinct-cause budget. Preserve the criterion, artifact/property, reads declarations, Branch/Origin, phase identity and historical proof. Record a dated amendment and the original/actual command, diagnosis, criterion and amendment commit in the execution evidence. Stage and capture the tree, run once, judge, commit only on PASS and attribute only to that tree. Land keeps exact commands and normal freshness; completed historical cases use check/review → fix with new proof.
**Raison:** Fix the durable obligation at its authoring side instead of making land infer equivalence from prose. The current append-log, record-verification and gate contracts already carry the required evidence; no schema or runtime change is needed.
**Tradeoff:** One bounded plan repair and its commit replace a substitution that leaves the next invocation blocked. Ambiguous intent, an unproved tree and red output cannot authorize proof. The unrelated phase-suite narrowing exception remains, including its existing exact-command landing behavior.
**Conséquences:** Supersedes D-an-unrunnable-auto-step-substitutes-once while retaining plan-time reading. Historical PASS blocks stay untouched and cannot transfer to an amended obligation. The model judges intent and criteria; the CLI enforces identity and freshness, not truthful execution claims.
**Alternatives rejetées:** Permit equivalent substitutions in land — broadens its mandate and adds semantic reuse rules. Reject every recoverable typo — leaves a known repair for another session. Rewrite old proof or normalize commands — loses execution identity or freshness.
