# Preparation quality — targeted follow-up, 2026-09-24

Base: `ea37a9e95b750bbe33580c004885fc83950a264d` (includes the user's 0.3.41 release after B-043).
Scope: the failed native B-043 preparation, plan recommendation/review instructions,
and the plugin mechanisms they use. This is not another general audit or a claim
that all skills produce good features.

## Adversarial findings

1. **Architecture that sounds correct can change product meaning.** The preserved
   candidate equates closed membership in Now/Next/Later with staleness, despite the
   valid mixed B-129/B-079 entry. Correct layering alone did not prevent this error.
   The planner's existing final self-review now tries its recommendation against a
   legitimate existing case as well as the defect. It must preserve source meaning
   and put the useful counterexample in acceptance, without another review artifact.
2. **Saying verification is deduplicated did not deduplicate it.** Both prior
   proposals list a focused Node suite and the final audit that runs that suite.
   The existing review now asks what distinct property each required command proves
   and removes the focused command when audit coverage and conditions are equivalent.
3. **Concision instructions did not enforce the requested output.** The previous
   candidate delivered 1,377 words against a 1,200-word bound. The style clause now
   explicitly applies that bound when the response is the deliverable.

Only `plugin/skills/plan/SKILL.md` changes: +117 whitespace-separated words over
4,737 (+2.5%). This spends some instruction context to target observed mistakes;
it is not a source-size reduction or evidence of lower runtime cost. No new role,
service, framework, automatic check, forced question or model-tier change.
The user-outcome and complete-feature guidance already exists in grill/plan; adding
another generic creativity checklist has no demonstrated benefit here.

## Anthropic sources checked today

- [Skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): concise instructions, appropriate freedom and evaluation against real tasks. Conditional references and deterministic scripts fit; successful format checks alone do not establish planning quality.
- [Claude Code skills](https://code.claude.com/docs/en/skills): bodies load on invocation, supporting files on demand; model/effort and invocation controls are documented. Twenty-one commands do not mean twenty-one full bodies at startup. Long invoked bodies still cost context; command count alone does not justify consolidation.
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): start simple and add coordination only for a useful tradeoff. Existing CLI/model separation fits that direction; no additional agent fleet is justified by this case.
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices): inspect outcome evidence and challenge results. This motivates the targeted counterexample, not an adversarial subagent on every command.
- [Plugin reference](https://code.claude.com/docs/en/plugins-reference) and [hooks](https://code.claude.com/docs/en/hooks): the inspected manifest, skills layout and bounded command hooks use documented mechanisms. Local validator evidence remains separate from generated-result quality. No packaging or hook migration selected.

These are the official pages available on the review date, not a certification of
all runtime paths or of future compatibility. Their suggestions are applied to the
observed need, not copied into additional mandatory ceremonies.

## Bounded outcome check

The user selected a real defect in esq and explicitly authorized one further
read-only native preparation, including sending repository excerpts to Anthropic.
The single run is bounded as below; no retry is commissioned.

Reuse the old candidate as reference; do not repay that run. Reconstruct the same
`42fa9ee` repository inputs with the six plugin files from `68a4eaa`, then replace
only `plugin/skills/plan/SKILL.md` with this correction. Use the unchanged
[original prompt](2026-09-24-b043-comparison/prompt.txt), Claude Code 2.1.282,
Opus/medium, Read/Grep/Glob/Skill only, hooks/MCP disabled, no persistence,
no agents, $3 maximum and 180 seconds. The isolated archive has 179 files and no
`.git`; no current B-043 implementation or later findings enter its context.

Predeclared judgment: useful live facts without changing the valid mixed entry's
meaning; closed visibility and unknown-source honesty; one writer and preserved
order; tests/consumers inspected rather than additive-compatibility assumed; no
duplicate focused/audit verification; output at most 1,200 words; no unnecessary
question. Retain the actual proposal, normalized read trace, source hashes, output
size and reported cost/time. One nonconcurrent follow-up cannot prove causality,
general reliability, UX quality or stable savings. No automatic retry or broad
campaign. B-181/B-182 remain Open unless their actual acceptance is demonstrated.

The follow-up completed successfully, with no tool error or permission denial, and
all 179 files unchanged. The local esq plugin and esq:plan were discovered; the
reported model was claude-opus-5-5. No second run was made.

Local verification: one bounded product audit **7/7 PASS**, including native plugin
validation. [Output and audited skill blob](2026-09-24-preparation-quality-audit.txt).
No prose-presence test or separate Node suite was added.

## Observed result — partial improvement, acceptance still open

| Measure | Prior candidate | Follow-up |
| --- | ---: | ---: |
| Final whitespace-separated words; maximum 1,200 | 1,377 | 1,301 |
| Tool calls | 20 | 25 |
| Characters returned by tools | 64,521 | 63,611 |
| Reported output tokens, including reasoning | 8,918 | 12,015 |
| Elapsed seconds | 90.57 | 121.71 |
| Estimated list-price USD | 0.6109666 | 0.7203984 |

**Observed gains:** the proposal explicitly tests the real mixed B-129 Done/B-079
Open entry as valid. Its verification list now contains the real-case CLI observation
and the final audit, with no separate Node suite. The unchanged repository supplied
other genuine stale epic witnesses, B-052/B-067. It retains live closed IDs, optional
refresh and single-writer boundaries.

**Unresolved quality:** it substitutes a new unsupported freshness predicate: an
entry with all covered IDs closed is called stale regardless of its projected text.
The queue's membership still does not itself establish a false status. Its ID-keyed
roadmap map does not specify the per-entry coverage needed to present live facts
in projected order, unlike the entry-oriented result implemented in B-043. It treats missing IDs as stale rather than a separate
unknown. It ignores malformed epic bullets, accepting silent false negatives.
It read the malformed-backlog test around line 145, but missed the whole-roadmap
assertion around line 82: preserving head alone still does not settle compatibility.
It also assigns plugin update to land/release too casually; local source use and
publication remain distinct responsibilities.

**Concision and cost:** the requested word limit still fails. The proposal invents
four alternatives, two of which immediately violate known constraints, and repeats
its recommendation in a final summary. Its terminal estimate “~6m” is unsupported;
measured elapsed was 121.71 seconds. Tool count, output tokens, elapsed and estimated
cost increased. The small reduction in returned characters and final words is not
an efficiency victory. This nonconcurrent sample cannot isolate model variability,
caching or causality; it demonstrates two corrected behaviors on one case only.

**Disposition:** retain the targeted instruction correction and its mixed evidence.
B-182 stays Open; B-181's effect is still not isolated, and B-169/C is not delivered.
Do not keep layering general reminders or buying the same case until it looks green.
The actual B-043 implementation and its verified behavior are unchanged.

Evidence: [exact proposal](2026-09-24-preparation-quality/proposal.md),
[normalized tool trace](2026-09-24-preparation-quality/read-trace.json), and
[metrics and input hashes](2026-09-24-preparation-quality/metrics.json).
Opaque provider signatures and session identifiers are not retained in the repository.

## Next fresh session

Select B-075 as a new real product case: parked versus executing work in existing
readers. Its recorded witnesses are B-001/B-006 and complete plans with remaining
acceptance; inspect their current behavior first. Preserve canonical statuses and
show the reason and restart condition without calling parked work active. Aim for
a useful, concise orientation result before considering a schema or general service.
This is a recommendation, not a claim that this item has begun or shipped.

Reuse this official-source review and the existing audits. Investigate only the
selected defect, implement the smallest complete user outcome, observe it on real
inputs, run the checks that change earns once, keep ledgers truthful and commit.
No push/publication, new role framework, broad audit or paid trial without a new
explicit bound and authorization. Report instruction corrections separately from
observed product gains. B-079 is not a prerequisite.
