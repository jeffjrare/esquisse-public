# Invoice export — bounded preparation comparison

> **Correction after user review (2026-09-24):** B-181 is reopened. This invented
> example did not demonstrate improved esq preparation on a real task. The prior
> acceptance/disposition statements below are retained as history, not current proof.
> The source correction and mechanical audit remain real; the claimed quality outcome
> remains unproved.

## Provenance and limits

This is a worked preparation exercise by the editing model in the 2026-09-24 session,
not a captured `/esq:grill` or `/esq:plan` run, a blind model comparison, or a delivered
invoice application. Its seed is README.md's `add CSV export to the invoices screen`.
The case facts below are supplied assumptions, not claims about code in esquisse.
The historical greeting-banner pause fixture was inspected first and rejected as a
product-design specimen: it tests verification resumption, not feature preparation.
These are the only two cases examined. Historical fixtures remain untouched.

Baseline source: `1ccdfa1`, specifically `plugin/skills/grill/SKILL.md`,
`plugin/skills/plan/SKILL.md` and its `references/screens-and-manual-steps.md`.
The last file is really loaded for UI work by the plan entrypoint, its writing step,
verification discipline and right-sizing pass. `references/reads-declaration.md`
is loaded only for optional `(reads)` declarations and does not supply UX guidance.
Grill currently has no reference load. Standards resolves constraint arbitration;
its empty Part 2 supplies no specialist design advice. The archive README is not a plan.

## Fixed input for both readings

An operator needs to send the currently filtered invoices to a colleague as CSV
without copying rows page by page. The existing invoice screen has status and date
filters, pagination at 25 rows and a matching-result count. In the example, 137
invoices match across six pages; none is individually selected. At most 500 match
under the supported workload. The user has authorized exporting all matches and
the existing displayed columns, within their organization; no new columns or access
rights. Preserve active filters. Deliver within two developer-days, without a new
dependency, queue, storage service or export-history screen.

For this exercise the application already has a server-side organization-scoped
invoice query, a bounded all-matches mode used by another report, a safe CSV encoder
used by that report, a download helper that rejects incomplete responses, shared
Button and InlineNotice components, and a test/browser harness. These are stipulated
capabilities; a real planning run must locate their real paths and contracts before
using them. The CSV encoding policy is inherited, not newly designed in this case.
There is no specified button label, pending feedback, retry placement or phase split.

## Before — source observation and walkthrough

The existing grill already says to propose the flow and cover empty/loading/error
states. Plan already carries acceptance forward, considers approaches, and warns
against trimming design. This is not evidence that all old proposals were generic.

The loaded UI reference nevertheless says:

> Read the codebase for the answers first; ask the user only what the code can't tell you

and:

> If a screen can't be answered for, the gap is scope ambiguity — send it back to `/esq:grill`

On the fixed input, repository components do not decide the new action's feedback or
retry copy. Following that referral literally sends these unresolved screen choices
back to grill despite the plan entrypoint's delegated-judgment rule. This is a
contradictory instruction path, not an observed historical user interruption.

The generic Task template can describe the requested CSV without retaining why a
25-row export is useless. Approaches need tradeoffs but need not connect those
tradeoffs to the operator's full result. The phase template calls every phase
independently shippable while its sizing rule accepts merely deployable code: an
endpoint phase followed by a UI phase can meet that weaker reading while leaving
the user unable to export anything. These are risks exposed by the reading, not
invented baseline output. No endpoint-only plan is attributed to an actual run.

## Acceptance fixed before the edit

For B-181's bounded preparation change:

- Remove the contradictory referral for delegated UI omissions while preserving
  questions for genuinely missing product authority or unauthorized cost/risk.
- Prepare the same case through a brief and a plan recommendation. The result must
  export all 137 matches, explain the scope before the action, preserve filters on
  failure and give a usable retry, without asking for implementation choices.
- Compare a plausible cheaper alternative and explain why the chosen architecture
  fits the bounded workload, trust boundary and two-day constraint. Name its cost.
- Keep the first usable delivery whole; show how completion is verified. Do not
  claim an app was built, a screen observed, runtime reliability measured, or B-169/C
  accepted from this exercise.
- Trace both brief-fed and direct planning, late-discovered UI and the no-UI path;
  run the product audit and ledger validation. No phrase-presence test.

The before/after comparison concerns inspectable preparation and instruction
consistency. A same-model, unblinded worked example cannot establish a causal gain
in esq runtime output quality, time to value or blocking rate.

## After — brief prepared from the fixed input

### Task

Let an operator send every invoice matching the current status/date filters to a
colleague in one CSV download from the invoice list. Today the operator must copy
across pages; a download of only the visible page would preserve that work and risk
an incomplete handoff. Put the export action beside the matching count so its scope
is clear without opening a configuration screen.

### In scope / out of scope

Export all matching invoices, in the list's order, with the already approved displayed
columns and organization boundary. Include pending, empty, failed and successful
download states. Exclude column selection, bulk selection semantics, scheduled exports,
email delivery and history: none is needed to send this filtered set once.

### Resolved decisions

The user already authorized all matches and the displayed columns; do not ask again.
Recommend one action, “Exporter les résultats (137)”, next to the existing count.
It needs no modal to repeat filters the user just chose. During the request, show
“Préparation du CSV…”, prevent duplicate submission and temporarily disable filter
changes so the named set cannot silently change. Keep the list visible. Use the
existing Button and InlineNotice semantics for keyboard focus and status announcement.
On failure retain filters and rows, explain that the export failed and offer “Réessayer”.
These are delegated design choices, not additional product authority.

### Constraints & context

The fixed input above is unchanged: two developer-days, 500 matching invoices at most,
25 per page, existing query/report/encoder/download components and no new dependency
or service. Do not broaden organization access or exported fields. The component and
query names here describe supplied capabilities; their real paths must be resolved
in an application before this specimen could become an executable implementation plan.

### User-facing flow

1. On the invoice list, an operator sees the current status/date filters, 137 matching
   invoices and 25 rows on page 1. The export label makes “all results” explicit.
2. Activate export by keyboard or pointer. Feedback appears immediately, the current
   filter values are retained, the list stays visible, and a second submission is unavailable.
3. On a complete response the download helper initiates the CSV download, feedback
   says “Téléchargement lancé — 137 factures”, and controls become available. Do not
   claim the file was saved to disk; the browser owns that step.
4. On request failure or incomplete response, no partial CSV is presented as success.
   The inline notice offers retry with the same filters. Once controls are re-enabled,
   changing a filter makes the next export use that new visible scope.
5. With zero matches, disable export and explain “Aucune facture à exporter”; keep
   filters available so the operator can change the search.

### Done looks like

- With the fixed 137-match dataset, an operator obtains all 137 invoices once each,
  in the approved order/columns, regardless of the page from which export starts.
- No invoice outside the operator's organization is exported.
- Pending and failure are visible; failure leaves filters intact and retry can finish
  the same work. Empty results do not produce a misleading success.
- The action and recovery work with keyboard navigation and existing accessible
  component behavior. No extra configuration step is required.

### Deferred to planning

Where to assemble the full matching set and CSV response; the corresponding trust
boundary, cost and verification. The flow and scope above remain the contract.

## After — plan recommendation prepared from that brief

### Context, goal and acceptance

The operator's current six-page copying task becomes one export from the filtered list.
Carry the brief's five acceptance conditions above intact. A new endpoint alone does
not achieve them; neither does a button that exports one page.

### Approaches and recommendation

| Approach | User outcome and correctness | Build / operational cost |
| --- | --- | --- |
| Collect all pages in the browser, then encode CSV | Can reach all 137, but must coordinate six requests in this case, preserve ordering and detect partial failure; concurrent list changes can move rows between requests | Superficially avoids a server route, but adds client orchestration and duplicates the existing report's all-matches capability |
| Reuse the bounded server report query and encoder behind an authorized export response | Uses the same filter semantics and organization scope in one request; serializes the full result before the existing helper initiates the download | One thin route/response adapter plus the list action and states; no new service, dependency, durable file or worker |

Choose the server path. Reuse filter validation, sorting, organization scoping and the
existing report's bounded read; apply authorization on the server, never from a client
organization parameter. Materialize the bounded result once, derive the exported
count from it and use the inherited safe CSV encoder. The 500-row supported workload
and existing all-matches mode make this proportionate. A job queue would add job
status, polling, retention and recovery with no stated need. If inspection contradicts
the supplied bound or reveals the existing report cannot meet the interaction, revise
the recommendation on that evidence; do not claim this design scales without limit.

Capture filter values when the action starts, excluding page/page-size parameters.
Use only the approved column mapping and the report's existing encoding policy. For
the fixed dataset, the response must contain 137 unique invoice rows; its count is
the response's result, not a promise based on a potentially stale list count. Do not
invent a guarantee of a historic snapshot from when the screen was first opened.

The extra implementation work over a page-only download is a response adapter,
request-state handling and failure/authorization coverage. Reusing the server report
avoids six-request client orchestration. Two days remains the supplied budget, not a
measured estimate or a delivery promise for an unseen codebase.

### One phase — export a filtered set completely

Implement the authorized response adapter and list action as one usable slice, with
pending/error/empty/success feedback and the existing download helper. Reuse the
shared components; do not introduce an export-center screen. A small connected change
can be one atomic task/commit. If real code inspection requires a separate prerequisite,
name it as such and keep all UX states in the phase that exposes the action.

Verification design (not executed against an invoice application here):

- Exercise the response with more than one page, the supported bound, no matches,
  invalid filters and another organization's records. Assert exact row identities,
  ordering and approved columns using the existing report/CSV test harness, including
  its encoding edge cases. Do not substitute response status or string presence for
  content correctness.
- Exercise rejection and an incomplete response: no successful download, filter values
  unchanged, controls re-enabled, a subsequent retry returns the intended result.
- Render the seeded invoice list with the existing browser harness: observe the full
  keyboard path, the 137-result scope, pending feedback without loss of list context,
  failure/retry and the empty state. Inspect the downloaded fixture file separately
  for all 137 unique rows. Screenshots alone cannot prove CSV completeness.

The observation path uses the stipulated invoice-list route, existing report seed,
Button/InlineNotice controls and browser/download harness; real paths and commands
must be resolved before building. This document deliberately does not fabricate
executable verification commands or mark these app observations PASS.

### Risks and open questions

No user authority is missing under the fixed input. The all-matches query, download
helper and component contracts are assumptions to verify in the real app. Existing
report timeout and CSV policy remain in force. Broadening the data set or rights,
adding a service, or breaking the two-day constraint would require a new assessment
under the mandate; unspecified labels and retry placement do not.

## What improved, and what was actually observed

The source correction removes the unconditional re-grill branch for an unspecified
screen. The worked output now contains an inspectable recommendation: a complete
137-row export, visible scope, one action without a new dialog, retained work on
failure and a retry. Architecture follows those requirements through a bounded,
authorized server read rather than a generic “add CSV” implementation. Delivery
includes interaction states in the usable slice. These are properties of the written
proposal above, reviewed against the same fixed input; no application behavior was
observed and no claim is made that the old model could not have produced them.

The baseline establishes an instruction contradiction, not a measured inferior model
output. The after artifact demonstrates the kind of preparation this edit asks for,
not causal efficacy or reliability in future invocations. B-181 can accept this bounded
instruction/preparation correction; B-169/C's live specialist outcome stays unproved.

## Integration and cost reading

- Grill uses the existing Task/scope sections; no new parsed section, CLI schema,
  planning gate, mandatory question, role, agent or artifact is introduced.
- Brief-fed plan inherits the result through its existing Task → Context/Goal mapping;
  direct plan performs the same framing in investigation. Neither reopens settled scope.
- Early or late UI discovery loads the same existing screens reference before phases;
  the right-sizing and verification paths already name that load. The reference now
  completes delegated UX details locally and connects set scope to the data boundary.
- Backend-only planning does not load the screens reference. Corrective planning
  retains its own finding scope and authority/depth rules; the new feature framing
  does not turn a corrective brief into an ideation exercise.
- The plan's final sizing advice agrees with the revised phase template: technical
  prerequisites may be necessary but are not described as shipped user value.
- Cost is a small increase in already-loaded prose, zero new required tool calls,
  searches, sessions or subagents. There is no speculative specialist load, no paid
  runtime journey and no extra ceremony. No successful verification is re-run here
  merely to compare wording. No time or token savings are claimed.
  Measured against the baseline by whitespace-separated words: grill +123, plan +188,
  and its conditional UI reference +93. These are source-size deltas, not token bills.

## Verification record

`./scripts/audit.sh` passed all seven product checks after running outside the managed
sandbox. The first sandbox run failed in the bounded-runner test and Node child
process suites. Two diagnostic invocations of the apply suite exposed empty child
stdout/stderr; the unrestricted audit passed without changing any runtime or test
code. This is evidence of an environment-dependent failure, not a reason to weaken
the audit. No fixture, historical proof, test assertion or CLI behavior was rewritten.
The second audit also includes the final wording alignment between the phase template
and verification discipline. The source-reading review covers the paths listed above;
mechanical success alone does not verify their judgment.

The check output and hashes of the audited skill/README inputs are retained in
`2026-09-24-invoice-export.audit.txt` beside this record. `esq validate` checks the
final ledger edits separately; there is no implementation plan or invented execution
log for this inline skill change. The CLI created and disposed B-181; its Date cell
uses UTC (2026-09-25), while this record follows the session's local date (2026-09-24).
Final `esq validate`: exit 0, `valid: true`, no findings. `git diff --check`: exit 0.
