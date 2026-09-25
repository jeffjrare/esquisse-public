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

Initial comparison attempt (before authorization): the sandbox invocation could not reach Anthropic
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

## Authorized live comparison — acceptance not demonstrated

The user subsequently authorized both read-only trials and sending the repository
excerpts to Anthropic. Both completed within the configured $3 / 180-second limits;
there were no tool errors or permission denials. No further paid run was made.

Both arms used the same [prompt](2026-09-24-b043-comparison/prompt.txt) and repository
archive at `42fa9ee`. Only six plugin files changed in the candidate, to their versions
at `68a4eaa`; non-plugin inputs were identical. Claude Code discovered the local esq
plugin and `esq:plan`; the invocation used the native slash command, Opus/medium,
read-only tools, no hooks or MCP. Both reported model `claude-opus-5-5`.
Post-run comparison against expected Git blobs found all 177 baseline / 179 candidate
files unchanged and no extra files. Archives had no `.git`: the baseline's statement
that HEAD was detached is unsupported.

| Observation | Before | After |
| --- | ---: | ---: |
| Elapsed seconds | 114.28 | 90.57 |
| Reported list-price estimate, USD | 0.7304594 | 0.6109666 |
| Tool calls | 22 | 20 |
| Characters returned by tools | 63,909 | 64,521 |
| Reported output tokens (including reasoning) | 10,861 | 8,918 |
| Final whitespace-separated words; requested maximum 1,200 | 1,253 | 1,377 |

Total reported estimate: **$1.341426**, not an actual subscription bill. One concurrent
pair, with caching and model variability, does not establish stable savings or causality.
Final output became longer and reading volume did not decrease.

**User value:** both proposals expose live statuses including closed items, preserve
projection text and avoid another writer or mandatory refresh. Both identify real epic
rows B-044/B-071/B-072 shown Open while BACKLOG says Done. Neither proposal was built.

**Architecture:** the baseline adds two Git subprocesses and a historical backlog read
to compare status changes since the roadmap's commit. That comparison cannot establish
that the original projection was correct; it admits this limitation. The candidate
removes the history dependency, but substitutes an invalid rule: every Done/Dropped ID
still covered by Now/Next/Later is stale. The actual `dependable-queue` entry explicitly
reports B-129 Done and B-079 Open and remains in Now for B-079. The candidate's warning
therefore labels a correct mixed entry as stale. Lower runtime cost does not justify
changing the meaning of the user's queue. Structural facts belong in the CLI; a
section's membership is not an authoritative projected status.

**Verification and concision:** both plans prescribe the focused Node suite and the
audit that already runs it in the same final phase, despite saying not to duplicate
them. Both exceed the requested output bound. The candidate also wrongly treats an
unchanged `roadmap.head` as enough for test compatibility: the existing test compares
the whole `roadmap` object (`tests/cli/esq.test.mjs:82`).

**Verdict:** instructions were corrected, but improved preparation quality is **not
demonstrated**. B-181 and B-182 remain Open; B-169/C is not delivered. This pair compares
B-182's changes against a baseline already containing B-181, so it does not isolate
B-181's effect. It does not exercise grill, UI design, ledger writing or the avoided
historical Topic migration. No special guidance or additional ceremony is justified by
this evidence. The concrete next correction is to make a recommendation survive the
repo's valid mixed-entry counterexample, retaining live facts without inventing a
freshness predicate, and prescribe the final audit only for this one-phase change.

Evidence: unchanged [before](2026-09-24-b043-comparison/before.md) and
[after](2026-09-24-b043-comparison/after.md) proposals, aggregate
[metrics and source hashes](2026-09-24-b043-comparison/metrics.json), normalized
[read trace](2026-09-24-b043-comparison/read-trace.json). These are inspected proposals,
including their errors, not implementation instructions or accepted plans. Raw session
identifiers and opaque provider signatures are not part of the retained evidence.

No product source changed after the previously recorded 7/7 audit. This evidence-only
follow-up reuses that result; ledger validation and diff checks cover its documentation
changes without buying the same product suites again.


## Subsequent product correction — B-043

The authorized implementation now exposes live backlog statuses beside ordered
roadmap text and compares explicit epic Backlog status bullets. On the unchanged
real inputs, the mixed B-129 Done/B-079 Open head remains valid, and B-044/B-071/B-072
are reported as projected Open versus live Done. B-043 is completed locally.
[Implementation, limits and verification](2026-09-24-b043-state.md) retain the real
before/after evidence and one 7/7 product audit. This is a demonstrated CLI result,
not a new model-preparation comparison: B-181/B-182 remain Open and the prior
quality verdict and proposals above stand unchanged.
