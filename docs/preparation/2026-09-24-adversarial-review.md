# Preparation review — 2026-09-24

Scope: useful feature preparation, proportionate cost and current Anthropic integration.
Baseline: `42fa9ee`; installed Claude Code: `2.1.282`. This is a focused adversarial
reading, not an independent security audit or certification of all 21 commands.

## Findings and changes

| Finding | Evidence / consequence | Disposition |
| --- | --- | --- |
| B-181 was closed without demonstrating its outcome | The user rejected the invented invoice scenario. Its successful format audit did not establish better preparation. | Reopened through the CLI; retained the historical proposal, audit and original resolution with explicit corrections. |
| Routine planning could become a historical registry migration | Plan's decision-writing step asked to scan existing entries for missing Topic fields. This repository's DECISIONS.md has 141,381 whitespace-separated words. | Plan, build and harvest now limit reads/edits to relevant decisions; unrelated metadata is left alone. No registry was migrated. |
| Conditional procedures and repeated instructions crowd planning | Plan's entrypoint had 6,360 words, including corrective routing and decision-record detail even when inapplicable. | Entrypoint reduced to 4,737 words (25.5%). Decision format: 555 words only when recording a significant choice; corrective procedure: 288 words only for corrective input. These are source-size figures, not measured token savings. |
| Framing rewarded confirmation and could substitute examples for evidence | Grill praised a user confirming pre-answered questions and suggested typical rounds; the preceding session used invented facts as quality evidence. | Zero-question preparation is explicitly valid. Ground improvements in actual behavior, preserve constraints, and separate a design illustration from outcome evidence. |
| Current architecture/evidence prose reinstated retired model gates | ARCHITECTURE's model rule and EVIDENCE's Governs explanation contradicted CLAUDE.md, the CLI description and current skills. | Corrected current guidance only. Historical decisions and measurement rows remain intact; telemetry never gates delivery. |

The architectural choice is to keep judgment in the existing model instructions and
reuse conditional references. No new role framework, planner service, public schema,
mandatory question, telemetry gate, automatic projection writer or test ritual.
The CLI still owns IDs, ledger status and format validation.

## Official Anthropic guidance checked

Sources below were consulted during this session, not assumed from training data.
They describe the documentation available on the review date; this does not certify
every runtime behavior or promise compatibility with a future version.

| Area | Official guidance | Assessment of esq |
| --- | --- | --- |
| Plugin packaging | Standard manifest, skills and hooks locations; official strict validator. [Manifest reference](https://code.claude.com/docs/en/plugins-reference) | Matches the source layout. The product audit includes native validation; no install or publication is needed for this change. |
| Skill invocation and references | Skill bodies load on invocation, supporting files can load conditionally, and user-only skills are excluded from automatic invocation. Model/effort fields and CLAUDE_SKILL_DIR are supported. [Skills](https://code.claude.com/docs/en/skills) | Current mechanism is appropriate. Total corpus size is not startup cost. This pass trims the invoked planner, rather than adding a skill-count or line-count gate. |
| Context economy | Keep instructions concise, use progressive disclosure and grant discretion where judgment is required. [Skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | Real gap: historical-registry work and repetitive planning prose. Corrected at their source; no claim that word reduction alone improves reasoning. |
| Architecture and autonomy | Prefer simple composable workflows; extra agent coordination needs a demonstrated benefit. [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | CLI/model separation and bounded correction fit. Twenty-one commands are not themselves a defect, nor a reason to add more orchestration. No agents added here. |
| Verification quality | Use observable outcomes and review evidence. [Claude Code best practices](https://code.claude.com/docs/en/best-practices); evaluate agent outcomes, not merely plausible transcripts. [Agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | B-181 violated the distinction. One real preparation case is selected below; a mechanical audit is not its quality verdict. |
| Hooks | Native lifecycle events, bounded command hooks and asynchronous handling are documented. [Hooks reference](https://code.claude.com/docs/en/hooks) | No hook migration justified by this review. Existing product suites remain the evidence for their local contracts. |

## Real preparation case and acceptance

Selected case: **B-043**, stale roadmap/epic state beside live ledger facts. This is an
existing user-facing esq improvement, not an invented invoice application. Its recorded
incident is ROADMAP reporting B-028 Open after BACKLOG marked it Done. Current
`state()` exposes roadmap text and active backlog rows separately; closed rows are not
in that active-row projection. A proposal must account for that actual boundary.

Compare the same task against the same repository snapshot, changing only plugin
instructions. Ask for a read-only plan proposal, not implementation or ledger changes.
Use native `/esq:plan`, Opus/medium, only Read/Grep/Glob/Skill, no hooks, MCP or agents.
Bound: two model preparations, at most $3 configured budget and 180 seconds each.

Judge the outputs by the actual need: can a user distinguish current status from old
projection text without having to refresh it first? Does the proposal preserve
projected order, closed-item visibility, missing/malformed-source honesty, and the
single-writer rule? Does it avoid parsing free prose as authoritative status or adding
an unnecessary service? Does its verification exercise those outcomes without merely
checking strings? Record questions, read volume, output size and architecture tradeoffs;
one paired case cannot establish general reliability or a stable savings percentage.

## Reading checks

Reviewed ordinary/direct and brief-fed planning, UI discovered late, corrective depth
exhaustion, significant-decision and no-decision paths, reused/new/detached branches,
legacy decision records and final reporting. Conditional references have named loads;
plan header/log and decision formats remain available to their existing parsers.
No phrase-presence tests were added. CLI validation does not require migrating old
Topic metadata: it checks decision index/detail identity, which this change preserves.

The older SPEC projection and other long skill bodies are not silently refreshed or
mass-trimmed here. A further change needs a concrete misleading instruction or costly
path; this review does not commission a corpus-wide cleanup.

## Verification status

Live comparison pending. The first sandbox invocation could not reach Anthropic
(`EAI_AGAIN`), reported zero model tokens and no tool calls, and produced no proposal.
An unrestricted retry was rejected by automatic approval review because sending code
to Anthropic needed explicit user authorization. That approval was requested; this
failure is not a baseline quality result. B-181 and B-182 remain Open until their
claimed outcomes have adequate evidence.

Local verification completed: `./scripts/audit.sh` **7/7 PASS**, including native
plugin validation, resolvable references, parsed formats and product suites. Run once
outside the sandbox in this pass, reusing the established child-process diagnosis.
No extra Node suite, release audit or research suite was added. `esq validate` and
`git diff --check` pass. The adjacent `2026-09-24-adversarial-audit.txt` retains the
audit output and audited source blob IDs. These results support the source correction,
not a claim of improved generated features or architectures.
