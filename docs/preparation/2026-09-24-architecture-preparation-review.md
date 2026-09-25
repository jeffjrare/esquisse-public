# Preparation and architecture — targeted adversarial review

Date: 2026-09-24. Base: `040895c`. Scope: grill, plan, arch and plugin loading.
Reuse the B-043 preparation trials and B-075 product evidence; no new model trial,
subagent, corpus-wide review, installation or publication. This is a maintainer review,
not an independent audit or proof that every generated feature is good.

## Findings and action

| Finding | Concrete evidence | Action |
| --- | --- | --- |
| The approach template rewards filling slots | Plan requested 2–3 candidates despite also forbidding invented alternatives. The retained B-043 follow-up produced four alternatives, two violating constraints. | Remove the quota. Compare viable user benefits, costs and limits; reject incompatible approaches briefly. |
| Architecture can promote historical intent into current authority | Arch described each relevant decision as a rule ready to transmit. The real `D-relay-sonnet-workers-explicit-opus` remains Active/arch, while the three orchestrators now declare `model: inherit`. | Check current applicability and cited authority. Preserve history without reinstating retired rules. |
| Refresh reads and reports exceed their purpose | Arch asked for intent across scope categories and logs, read SPEC merely for a pointer, required a full draft/diff report, and treated zero cuts as a skipped review. | Select relevant decision details and missing log evidence. Read SPEC's existence/marker for its advisory. Reuse unchanged evidence. Allow justified zero cuts and link documents instead of pasting them. |
| A diagnosis or advisory can become an unnecessary user gate | Arch's report asked the user whether code or a decision was wrong and counted spec staleness in NEEDS YOU. | Resolve from current intent first; ask only for missing authority. Spec refresh remains optional. Expensive safety rules stay resident. |

These source corrections are B-183. They neither close B-181/B-182 nor deliver
B-169/C: better generated ideas, architecture and runtime cost still need outcome
evidence. Do not treat a smaller skill or another green validator as that evidence.

## Current Anthropic guidance

Six official pages checked on this date. This assesses the inspected mechanisms
against currently available documentation, not every command's runtime behavior.

- **Packaging:** the manifest, skills and hooks use documented locations. Native
  validation was already green in B-075; no packaging migration is justified.
  [Plugin reference](https://code.claude.com/docs/en/plugins-reference).
- **Loading:** skill bodies load when invoked, with invocation controls documented.
  Twenty-one skills do not mean twenty-one full bodies at startup. Invoked content
  remains in context, so trimming recurring instructions matters.
  [Skills](https://code.claude.com/docs/en/skills).
- **Authoring:** concise instructions and context-dependent freedom fit these tasks;
  mandatory alternative counts and repeated full reports add little decision value.
  [Skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
- **Complexity:** retain the CLI/model split and existing workflows. No observed
  need justifies another agent framework or specialist fleet here.
  [Effective agents](https://www.anthropic.com/engineering/building-effective-agents).
- **Context/review:** fresh sessions help isolate unrelated work; independent review
  can be useful when its judgment warrants the cost, not as a mandatory extra pass.
  [Claude Code practices](https://code.claude.com/docs/en/best-practices).
- **Evidence:** judge the resulting artifact/environment, not merely plausible
  narration. Keep source changes and generated-product quality distinct.
  [Agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

## Verification and cost

Real-record semantic check: the historical relay pin above must not override current
inheritance. Conversely, `D-standards-resolves-or-refuses`, whose cited mandate and
current CLI contract still apply, remains useful architectural intent. Neither case
needs a user to choose whether code or history is wrong. This is source/record
inspection, not a native arch execution or an invented product example.

Instruction size: arch **4,822 → 4,309 words**; plan **4,854 → 4,841 words**.
Total reduction: **526 whitespace-separated words**. No runtime-token saving claimed.
No parser, status, phase/header format, invocation guard, writer ownership or
freshness-marker protocol changed. No prose-presence tests were added.

One `./scripts/audit.sh`, bounded to 180 seconds: **7/7 PASS in 27.58 s**,
including native validation and product suites. [Captured output](2026-09-24-architecture-preparation-audit.txt).
No separate Node suite or additional B-075 real-case run was performed.
Final `esq validate` returned `valid: true`, with no findings; `git diff --check` passed.

## Fresh-session handoff

Select **B-003** as a new concrete case: a retained unmerged branch should not lose
its ID reservation when its worktree is removed. Reproduce current behavior first;
do not assume the old report still proves a defect. Explain the user's gain and the
smallest complete solution, with a legitimate counterexample and one verification
set. Keep UX and architecture quality, existing proof, concise bullets and local
commit/no publication. B-005 is related, not automatically part of the task.

This is a proposed next task, not an implementation already selected or started.
