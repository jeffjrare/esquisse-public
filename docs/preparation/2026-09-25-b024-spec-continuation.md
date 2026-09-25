# B-024 — Show the disagreement, then resume only what remains

Starting tree: `7e260cf1d895df1aa4ceb496c098b3a059ed35a4`, initially clean.
Inline maintainer change, 2026-09-25. No plan, subagent, new framework, paid
model trial, push or publication. The specimen is this repository, not an
invented application or a fabricated user response.

## Before: actual disagreement and consequence

At the starting commit, `docs/SPEC.md:418` says a stale harness measurement
refuses a non-Opus session before its first spawn. Lines 464–470 likewise
make unattended work depend on the routing measurement.

One actual read-only `plugin/bin/esq evidence --json` returned exit 0:

```json
{
  "registry": "docs/EVIDENCE.md",
  "present": true,
  "installed": { "version": "2.1.282", "reason": null },
  "modelRoutingClaim": {
    "claim": "E-model-routing",
    "governs": "model-routing",
    "verdict": "stale",
    "reason": "measured on 2.1.235, installed is 2.1.282",
    "measurement": "M-agent-model-2026-08-19",
    "capture": "tests/probe/fixtures/capture.jsonl"
  },
  "findings": []
}
```

This is an excerpt: `modelRoutingClaim` labels the selected member of the
returned `claims` array, not a CLI field. No measurement was refreshed.
The actual response has no `relay` gate verdict. `plugin/lib/cli.mjs`'s
`evidence` return at the starting commit (line 3681) reports observations;
`plugin/skills/autopilot/SKILL.md` preflight does not consult this measurement.
`plugin/skills/advance/SKILL.md:109` explicitly requests the model without
checking telemetry or stopping for missing evidence. These last statements
are source readings, not an observed orchestration run.

User consequence: the old documentation tells a reader that this stale
measurement prevents unattended work and can prompt an unnecessary paid
refresh. The observed stale verdict proves neither that a model request is
honored today nor that it is ignored.

## Applied continuation on this case

The request to show where is handled by the evidence above, followed by its
consequence, without treating the code as authority. Intent is already settled:
`CLAUDE.md`, “What esq is for”, rule 1 says **“No research instrument,
measurement registry or telemetry reading ever gates delivery.”** Its model
policy and `docs/ARCHITECTURE.md`'s current worker rule agree. Historical
routing decisions remain evidence of the old policy, not authority to restore it.

Therefore no new product choice is owed on this specimen. Asking again whether
to remove the measurement gate would repeat a settled decision. The resulting
scoped spec edit removes that requirement, records the old → new rule and its
basis, and leaves the historical decisions and measurement records untouched.
The document-wide date and `last-spec` marker remain byte-identical: this is
not a full spec refresh. Other sections were not certified.

Still unknown: which model an actual newly spawned worker would receive.
No new experiment is needed to choose the documented policy, and none was
launched. This uncertainty is a diagnosis, not a user permission request.

## Instruction verification and its limits

Before, the offered “Je ne sais pas — montre-moi où” had no continuation;
writing required every changed rule to be settled, and the conclusion declared
success unless the user had answered “pas voulu”. After, a directed reading
of the entrypoint's refresh → confirmation → write → conclusion path establishes:

- Evidence is linked and its user consequence explained; executed observation,
  source reading and missing facts stay distinct. The real case above uses this
  path and existing authority, not presumed correctness of the code.
- A missing product choice gets only the remaining adopt/retain/defer question.
  An unanswered or deferred choice keeps that rule unchanged and visibly
  unresolved. It authorizes neither a rewrite nor a regression classification.
- Independent settled edits can be committed once. Partial work keeps the
  original freshness marker/date; no settled edit means no empty commit.
- Resume retains prior answers and evidence, revisiting only the pending item
  or changed facts. Deferral cannot loop immediately into the same question.
- The conclusion warns on unresolved items, names evidence gaps without
  disguising them as choices, and cannot present a partial refresh as complete.

The unresolved/adopt/retain branches above were checked by reading their
instructions, not by fabricating additional answers from this user. This run
is not a native Claude `/esq:spec` trial and does not prove model compliance
across sessions. The actual CLI observation and applied scoped spec correction
are the runtime/document evidence available here; no stronger claim is made.

## Cost and verification

The change stays in the existing spec entrypoint, its README description and
its product documentation. No reference split, schema, CLI code, automated
prose assertion, model call or repeated experiment was added. The actual
`esq evidence` response was reused; it was not rerun for this record. Some
initial searches returned excessive historical text; no token-saving or
runtime-cost improvement is claimed.

The mandatory product audit is run once with a 180-second bound and retained
beside this record. Its Node suites are not run separately. This is mechanical
verification, not a general semantic audit or proof of generated dialogue.

Results: the initial audit exited 1, with **5/7 PASS**. Native package validation
passed; the bounded-runner check and product Node suites failed inside the
sandbox (including child test-file failures). Only those two checks were retried
outside the sandbox, on the unchanged product source, under one 160-second
outer bound: **bounded=0, product=0**. Both passed. This is five initial passes
plus two successful retries, **not** an uninterrupted 7/7 audit. No initial
successful check was separately rerun. Logs:

- [Initial audit](2026-09-25-b024-audit.txt)
- [Bounded-runner retry](2026-09-25-b024-bounded-retry.txt) (execution summary; quiet on success, exit 0)
- [Product-suite retry](2026-09-25-b024-product-retry.txt)

Final bookkeeping checks confirm the original spec marker/update date stayed
identical and the historical decisions/measurement files were not changed.
B-024's closure concerns the explicit instruction continuation and scoped case
above; it does not certify native model dialogue or model-routing behavior.

`plugin/bin/esq validate`: `valid: true`, no findings. `git diff --check`: PASS.
