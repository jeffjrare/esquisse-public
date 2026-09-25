---
description: Produce a structured plan file from the codebase — the durable contract for /esq:build, /esq:check and /esq:review.
name: plan
argument-hint: "[target] [options]"
model: opus
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

**No mandate, no run.** Model invocation of this skill is legitimate only when a user-invoked orchestrator explicitly delegated this run and its target appears in the invoking turn. Invoked without that explicit target — or off a description match, on your own initiative — do not guess: stop and print the exact invocation for the user to run.

You are producing a planning document for a future execution session to follow. The plan file is a contract between thinking and execution — write it carefully.

## Deterministic CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

Use `esq backlog reserve-id` for new backlog rows, `esq backlog set-status <B-NNN> Planned` for rows this plan picks up, `esq brief depth <path>` before opening a corrective round, and `esq validate` before committing. The CLI owns structured mutations only; approaches, architecture, phases, risk, verification quality, and UX remain your decisions.

Do NOT toggle plan mode. The discipline is enforced by this prompt: read the codebase, reason, write ONE file, commit it, stop. Plan mode would block the file write you need to do.

## What a plan optimizes for

**Maximize useful, shipped product value.** Every phase should let a person do something new or better. Minimize overhead; for infrastructure-only work, state in `## Goal` what user-facing work it unblocks and when.

Priorities: a usable feature (logic and interface together), security, architecture that fits the current problem, then supporting work that serves those three. Security is a non-negotiable floor: design data models, module boundaries and trust boundaries here. Test real regression risks; do not add abstraction, configuration, extension points or test matrices without a current requirement.

**UI and UX are part of the feature.** A confusing flow or missing error state is unfinished work. Before writing any phase that renders UI or declares a `(manual)` step, load `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md`, including when investigation only later reveals that need. Right-sizing trims generality, never design.

## Announce, before anything

<!-- announce-open:start -->
Print this line first, before any tool call, then continue with the first call in the same response:

> `/esq:plan — writing one plan file. Bound: no subagents, at most 4 questions per round, at most 3 web searches per load-bearing decision.`

Stop at the bound and report what remains uncovered. Announce the resolved target after preflight.
<!-- announce-open:end -->

## Preflight

1. **Read the projection docs, if present.** They answer different questions:
   - `CLAUDE.md` at project root — *how* this codebase is built: conventions, architecture, gotchas.
   - `docs/SPEC.md` — *what* the product does, feature by feature, in PO language. Read the affected **Fonctionnement** and **Règles métier**; reuse what they establish. If the task changes a documented behavior, name it in `## Context`. A contradiction needs a question only when the mandate does not authorize the change. An absent or stale feature description is an evidence gap: inspect its implementation and cite that source for the proposal, without inventing a product rule. Never edit SPEC here or make its refresh a prerequisite to already authorized work; `/esq:spec` remains a user-triggered follow-up. An actual unresolved product rule still follows **Resolve blocking decisions**.
   - `docs/ARCHITECTURE.md` — *where* the change belongs: the components the task touches and its boundaries section. The Recommendation names the owning component and the boundary the change must not cross.
2. **Resolve the planning input.** Use the user's task description when given. Otherwise run `esq brief pending` and read `selected` in full: its scope, decisions, constraints and deferred work are the input. Announce its path and the other `pending` briefs this run will not plan. Derive the slug by stripping `.brief.md` and the leading date.
   Never choose by disk mtime: the CLI excludes consumed briefs, accounts for abandoned plans, and selects corrective briefs only while 🟡 items remain. No task and no pending brief → STOP and ask what to plan, even if older briefs remain on disk.

3. Note today's date in YYYY-MM-DD format
4. Determine a slug: from the brief filename if consuming a brief, else 3-5 lowercase words from the task description joined with hyphens
5. Determine the file path: `docs/plans/<YYYY-MM-DD>-<slug>.md`
6. If the file exists, append `-2` (then `-3`, etc.) to slug until unique
7. Ensure `docs/plans/` exists; create if missing
8. Fetch `AskUserQuestion`: call `ToolSearch "select:AskUserQuestion"`. Needed for interactive decisions during planning. Skip silently if unavailable.
9. **Check `docs/BACKLOG.md` if present.** Match `Open`/`Needs-decision` rows by the task's nouns in their Summary; read a detail section only after its row matches. Include only relevant items in `## Open questions` or `## Risks`; resolve blockers before planning proceeds. When writing the plan, mark each picked-up row with `esq backlog set-status <B-NNN> Planned --by <this-plan-slug>`. Update only the row; strip any legacy detail `**Status:**` rather than maintaining it. Commit these edits with the plan and decisions in the single tail commit.
10. **Check for an epic** when `docs/epics/` exists. Use the epic the user or brief names, or the single `Active` epic whose `## Scope` clearly covers the task. Otherwise omit it; never force a fit or create an epic here. For work exceeding one plan, mention `/esq:epic new <title>` if useful. Record the chosen slug in the plan header and fill blank Epic cells on the rows marked Planned in step 9, in the same edit.

11. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
    <!-- announce:start -->
    > `Planning <slug>.<, from <brief-path>>`
    <!-- announce:end -->

    This is the free moment to be redirected — the target is on screen before anything has been spent on it.

<!-- shared:batch-independent:start -->
**Batch independent, read-only calls in one turn.** A call that consumes another's result waits for it. Serialize Git mutations, writes to the same file, and reads of a file another call writes; never run them concurrently. Group ordered shell operations with `&&` in one call so failure stops the chain.

Keep one atomic, independently revertible implementation commit per task. Batching calls never merges tasks or justifies an unnecessary read; retain the read-once rule.
<!-- shared:batch-independent:end -->

There are two brief shapes, both ending in `.brief.md`:

- **Grill brief** (from `/esq:grill`, and from `/esq:ui` which writes the same shape — there its `## Constraints & context` carries the audit, including the URL of the published before/after page, and `## Resolved decisions` names the visual direction the user picked): has `## Task`, `## In scope`, `## Out of scope`, `## Resolved decisions`, `## Done looks like`, `## Deferred to planning`, and (for UI work) `## User-facing flow`. The brief already settled scope and the decisions only the user could make — **including any outside practice it cites, which is paid research you inherit rather than re-run.** Don't re-litigate them — fold `## Task` into `## Context`/`## Goal`, respect the scope boundaries, carry `## Resolved decisions` and `## Constraints & context` forward, and spend your effort on what it deferred: approaches, recommendation, phases. **Turn the `## User-facing flow` into `(manual)` verification steps** (with starting state) on the phases that build that UI — that's how the flow becomes provable rather than assumed. **Copy `## Done looks like` into the plan intact** (see the template), sharpening only what is genuinely unobservable.

- **Corrective brief** (`*-fixes.brief.md`, from `/esq:check` or `/esq:review`): has `## 🟢 Fix now`, `## 🟡 Needs a plan`, `## 🔴 Needs your decision`. Plan the **🟡 items** — those are why you're here. Ignore the 🟢 items (they're `/esq:fix`'s job; if any remain, mention that the user should run `/esq:fix` rather than plan them). Treat 🔴 items as open questions / blocking decisions — if one blocks the plan, resolve it via `AskUserQuestion` before writing. The plan's `## Context` should note it's a corrective plan addressing review/check findings on `<original-plan-slug>`.

**Corrective input only:** before investigation, load
`${CLAUDE_SKILL_DIR}/references/corrective-input.md`, which obtains `esq brief depth <brief-path>` once.
An `exhausted` verdict creates no plan or branch and flips no backlog status; the
reference gives the bounded correction/disposition route. Ordinary feature planning
loads none of this reference.

## Investigation

Read the codebase to understand context. Use `view`, `grep`, `glob`, follow imports. Read tests and types where relevant. Read git history if the change interacts with recent work.

Investigate proportionally. A small bug fix needs 2-3 files. A refactor needs the touched module plus boundaries. A feature might span more. Don't read everything; read what informs the plan.

For a feature, carry the brief's user, present friction and intended result into Context/Goal; with direct task input, infer them from the request and product evidence here. Distinguish assumptions from established facts. Use that result to choose an approach: a working mechanism that leaves the user's original work undone is not a useful slice. Resolve ordinary omissions within the mandate; ask only for the missing authority defined below, not for a second framing session by default.

For an improvement, anchor the recommendation in the actual behavior or artifact that falls short. Compare the proposed result on that same need and constraints; a hypothetical example can explain a design but cannot prove an improvement. Plan the smallest observation that can settle the claimed outcome. A format check proves format, not feature usefulness or model behavior; leave any unobserved outcome explicitly unproved rather than buying a general evaluation campaign.

If the task description is too vague to plan ("improve the codebase"), use `AskUserQuestion` to ask the user to scope it — offer 2–3 plausible interpretations you can infer from the codebase, plus the free-text escape (see *Resolve open questions*). If `AskUserQuestion` is unavailable, STOP and ask in plain text.

If you find during investigation that the task is much smaller than expected — a one-line fix, a trivial rename — say so. Suggest doing it directly without the plan-file overhead.

## Resolve blocking decisions

If your recommendation depends on a choice the ask-altitude block below marks **theirs**, use `AskUserQuestion` to resolve it before writing the plan. Present each option with its tradeoff as the description. One question maximum.

Anything else, make the call and note the reasoning in the plan.

<!-- ask-altitude:start -->
**Resolve questions from the repo, then outside research, before asking the user.** Read the mandate, code, approved plan and Active decisions. Engineering and UI choices within those goals and budget are yours: decide and record them in `docs/DECISIONS.md`.

Ask only for a named, unrecorded preference or authorization affecting product outcome, scope, a major architecture commitment, a stated constraint, or consequential cost/risk. Multiple viable approaches, uncertainty, UX/architecture subject matter or an absent authorizing decision do not alone justify asking. Failures and missing evidence require diagnosis, not a choice between causes. A prior decision authorizes only what its cited basis covers; an entry without one is context.

**Arbitrate constraints with `esq standards` first.** Where its clause covers the constraint class and observed overrun, decide and record the constraint, observed value, clause and `Fondement: mandate — <the clause>`. A silent or unreadable standard, an exceeded threshold, a non-arbitrable class or `(hard)` constraint leaves the decision to the user; disclose an unreadable standard.

**Research load-bearing choices:** new dependencies, repeated patterns, data models and trust boundaries. Fetch `ToolSearch "select:WebSearch,WebFetch"`; consult current official docs first, then relevant well-engineered products. At most **3 searches per decision**, only when the repo's conventions, architecture, decisions or code do not settle it. Reuse research cited by the brief. Record the source and date in one line beside the decision. If tools are unavailable, disclose that and decide from available evidence; do not turn it into a user question.
<!-- ask-altitude:end -->

Skip this step entirely if there are no blocking decisions.

## Write the plan file

Use this exact structure. The `## Execution log` section MUST be present (initially empty) — it's the contract with `/esq:build`.

**If any phase will render UI or owe a `(manual)` step, load `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md` before you write the phases** — including when investigation has only just widened the scope into a screen.

**Shipping-unit headers are this command's responsibility.** At the commit step, read
`git branch --show-current` once for `**Origin:**`, then create `esq/<slug>` for
`**Branch:**`. Put both above the first `##` heading. Detached HEAD or no repository:
omit both, create no branch, and report legacy behavior (build may run; land cannot).

For corrective input, use `esq branch resolve <slug>` instead of choosing a branch:
`reuse` copies its branch/origin without creating anything; `new` cuts from the stem's
returned origin. Never derive correction identity from suffixes yourself. At exhausted
depth none of these mutations is reached. For a new unit, an existing target branch is an ambiguity:
stop and name it, never attach or uniquify around it; an explicit `reuse` is different.
Pass refs as quoted Git arguments. A dirty tree alone is not a
refusal; preserve it and stage only this command's own writes at the commit step.

```
# <Title in plain English, not a slug>

<!-- Include the next line ONLY if this plan belongs to an epic (preflight step 10). -->
**Epic:** <epic-slug>

<!-- Omit BOTH of the next two fields ONLY on a detached HEAD or outside a git repository. -->
**Branch:** <the branch this plan's phases commit to>

**Origin:** <the branch it was cut from, and the branch it lands back on>

## Context
What's the situation. Current state. Why this is on the table now.
2-4 sentences of prose.

## Goal
One sentence: what does success look like, observable from outside. Name what a person
can do after this that they couldn't before — that is the value this plan delivers.
If the outcome is genuinely invisible to users (migration, infrastructure, tooling), say
so plainly and name the user-facing work it unblocks, and when that work happens.

## Done looks like
<!-- Carried from the brief's `## Done looks like` when there is one; written here when
     there isn't. This is the plan's answer to "what question was I asked?" — /esq:check
     reads it back against what shipped. Never delete it; a plan without it can only be
     audited against itself. -->
The observable conditions that would make the person who asked for this consider it done —
in their terms, not the implementation's. Not "the endpoint returns 200" but "a customer
whose card fails gets told why, and can fix it without contacting support."
If the work is genuinely invisible to users, state the condition that proves the *unblocked*
work is now possible.

## Approaches considered
Start with the simplest viable use of existing code. Add an alternative only when it
could materially improve the user's result within the actual constraints. For each
viable approach, name its user benefit, build/operating cost and decisive limitation
briefly. An approach violating a known constraint is not a candidate; mention its
rejection once only if that explains the choice. One viable approach is enough;
there is no quota and no invented scale. When the change introduces a data model, a
trust boundary or a pattern others will repeat, name one structurally different
alternative and why it loses.

## Recommendation
Which approach and why. Be direct. Reference the tradeoffs above. If the answer depends on something the user must decide, surface it as an open question instead of picking arbitrarily.
Where outside practice settled a choice, cite it in one line — source and the date you checked — so
a later session can tell a researched pick from a remembered one.

## Security notes
<!-- Include this section ONLY when the change crosses a trust boundary: untrusted input,
     authn/authz, secrets, one user's data, an external call, a new public surface.
     Omit it entirely otherwise — security theater on a change that crosses nothing is noise. -->
The boundary this change crosses and how it's held: who is allowed to call it, what is
validated and where, what must never be logged or returned. One short paragraph, concrete.

## Phases

Sequential and sized for one fresh execution session each. Prefer a first usable path
through the feature, including its necessary UX states, over separate data/API/UI
phases. If a technical prerequisite really needs its own phase, name the dependency
and the later phase where the user gets the result; do not call that prerequisite a
shipped feature. Keep the promised outcome intact when splitting the work.

### Phase 1 — <name>
- **Goal:** one sentence
- **Files touched:** explicit paths
- **Tasks:** 
  - Task 1.1: <one commit's worth of work, written as the commit subject would read>
  - Task 1.2: <next atomic change>
  - (One atomic commit per task; size the phase by its deliverable and session context.)
- **Verification:** observable. Tag each step `(auto)` or `(manual)` — see Verification discipline below. Examples:
  - `(auto)` `curl -sS localhost:3000/health` returns HTTP 200
  - `(auto)` `pnpm test src/api/users.test.ts` passes
  - `(auto)` `grep -r "deprecated_function" src/` returns no results
  - `(auto)` `node --test 'tests/cli/*.test.mjs'` — the CLI suite passes
  - `(manual)` [logged out, incognito] Open `/signup`, complete checkout with Stripe test card `4242 4242 4242 4242`, observe redirect to `/dashboard` showing an active subscription badge

### Phase 2 — <name>
[same shape]

[continue for all phases. Single-phase plans are fine — say so plainly.]

## Risks
What could go wrong specifically with THIS plan. Not generic risk theater. What you'd watch for during execution.

## Open questions
Things you couldn't decide without more input. Be specific about what would resolve each one.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
```

The `<!-- comment -->` after `## Execution log` is required — it signals to `/esq:build` that this section is reserved.

## Style for the plan content

Keep only what changes an implementation or product decision: the useful result,
chosen approach and cost, concrete tasks, verification and unresolved risks. State
each fact once and reference it elsewhere. Do not narrate the investigation, fill
sections with generic advice, invent alternatives, or repeat the plan in the final
response. Keep a written plan's required headings and parsed fields intact. Cut repeated rationale, not acceptance or implementation detail.

## Verification discipline

**Every step names an observable property and is tagged `(auto)` or `(manual)`.** Tests passing is evidence only for what they actually check.

- **`(auto)` is the default:** anything executable with machine-readable output, including all backend checks, APIs, queries, logs, tests and builds. Write one command in one inline-code span, then an em dash and its artifact/property: `` `(auto)` `pnpm test src/api` — the API suite passes ``. Landing extracts the command for proof reuse and reads the sentence as its PASS criterion: a grep proving no matches can pass at exit 1. A prose command or multiple commands in one step cannot be resolved for reuse and must be rerun in full.
- **`(manual)` is only for rendered screens and visual UX flows.** Every UI-touching phase needs at least one step observing the actual screen, not merely a component-mount test. Before authoring a UI phase or manual step, load `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md` for starting states, action-first wording, the browser-driver test and per-screen consolidation. Backend-only phases have no manual steps.
- **Choose verification by what the phase changes.** Target its tests; require a whole-repo run in the last phase and any phase changing code imported outside its package. Each earlier phase still needs its own proof of its stated deliverable.
- **Buy each proof once within a phase.** Inspect the actual work of each command, including nested builds and measurements. Reuse an already built artifact through the runner's supported no-build option when its inputs are unchanged; judge all relevant properties from one captured measurement instead of rerunning for another output format. Remove a narrower check when another covers its assertions under equivalent conditions. Keep genuinely distinct properties or environments, and name any uncertain overlap. A later phase's wide run does not replace an earlier phase's proof. Deduplicate here, never by silently skipping an execution step or attributing another command's PASS. Build's explicit exceptions still govern unrunnable commands and overbroad inherited suites.
- **Resolve commands by reading, never by running planned verification.** Check the executable exists and is executable, and arguments match its Usage header, documented help or existing call sites, in that order. Cite the call site used when other documentation is absent. A file this plan's tasks create is a valid future referent. Always name the artifact and property after the command so execution can recover its intent if the command cannot run; an ambiguous bare command cannot be safely substituted.
- **Use explicit `.mjs` files or quoted globs for `node --test`, never bare directories:** `node --test 'tests/cli/*.test.mjs'`.
- **Make results independent of ambient tool variants.** Prefer explicit path operands to searching a root and filtering printed path prefixes. Account for wrapped text, locale-dependent sorting and differing tool flags; the same assertion must mean the same thing in an interactive shell and a script.
- **`(reads)` declarations are optional promises.** After an auto step's property, `(reads)` may name its input paths so `esq gate verify` checks freshness against those paths. No declaration is the normal, complete case. Before writing any, load `${CLAUDE_SKILL_DIR}/references/reads-declaration.md`; never guess from memory or under-declare inputs. Plans without declarations do not load that reference.
- **No "deferred to live env" pass.** If a behavior cannot be verified within the phase, record it as a Risk or Open question; do not call the unverified change done.

## Right-size, then read it once

Use the context already held: no subagent, new artifact or unchanged-file reread.
Cut work whose only justification is a future uncommitted use case: single-use
abstractions, unused configuration, speculative extension points and restructuring
that unblocks nothing in this plan. Keep a task only for a concrete requirement or
risk. Never cut a trust boundary, necessary data semantics or usable design to make
the plan look small. For UI, states belong in the phase exposing the action.

Read the written plan once and correct these yourself:

1. Remove lifecycle work another command already owns (briefs, closing rows, repeated
   checks); name that owner where needed.
2. Keep acceptance, scope, phases and risks consistent. A measurement only possible
   after shipping belongs among the outstanding observations, not a promised green
   from code completion. Preserve the user's actual acceptance condition.
3. Name widened public schemas/data, existing consumers and any install/restart/release
   needed for the result to reach users; do not silently promise activation.
4. Try to falsify the recommendation with a legitimate existing case from the inspected
   code or data, not just the defect it fixes. Trace the proposed rule through both;
   correct it if it rejects valid behavior or changes the meaning of a source field.
   Distinguish source facts, derived conclusions and unknowns. Put the useful
   counterexample in the task's acceptance/test, not a separate review artifact.
   Cover relevant boundary/malformed inputs without inventing a test matrix.
5. Resolve every auto command against its documented usage and property. For each
   required command, identify what it proves that the others do not; when the project's
   final audit already runs the focused suite under the same conditions, keep the audit
   alone. A sentence promising no duplicate runs does not remove a duplicate command
   from the list. Correct unrunnable commands without weakening their criteria.

Size by deliverable and session context, not a task-count cap. Each task is one atomic
commit; unrelated changes are separate tasks. Leave working code after each phase.
Prefer a usable result; identify a necessary technical prerequisite and when its user
outcome arrives. Split if a phase alone needs roughly 50K+ tokens of context.

Ordinary omissions are yours to fix. Report only consequential adjustments, briefly.
Only a missing authority under **Resolve blocking decisions** earns a user question;
batch it with any other real open questions rather than adding an approval round.

## Resolve open questions

Review Open questions and Risks for missing user authority, using **Resolve blocking
decisions**. Settle engineering details yourself. Skip this step when nothing needs
the user; execution-time watchpoints do not earn a question.

Ask at most four related questions per call, with a recommendation and up to three
concrete options explaining their tradeoffs.

<!-- shared:escape-hatch:start -->
**Always leave a way to answer in their own words.** Make the last option on every question an explicit free-text escape — label it `✍️ Something else — I'll explain`, with a description saying you'll ask for the details. If they pick it, collect their wording with a short plain-text follow-up before continuing; every *other* answer in the same batch still stands. Don't rely on the harness's built-in "Other" row — it doesn't render in every client.
<!-- shared:escape-hatch:end -->

Fold answers into the affected scope, approach, phase or risk; remove resolved
questions. Ask another round only for newly exposed missing authority. If the question
tool is unavailable, ask in plain text and wait for the answer; never infer approval.

## Write decisions to registry

Only significant choices belong in `docs/DECISIONS.md`: a recommendation between real
alternatives or a resolved user decision. If there is no such choice, skip this step.
Otherwise load `${CLAUDE_SKILL_DIR}/references/decisions.md` for the record format.
Search only relevant existing decisions; never turn feature planning into a historical
registry migration.

## Commit and stop

After writing the plan file and updating DECISIONS.md (if applicable):

1. **Cut the shipping unit, and fill both fields from it**, here and not earlier.
   `git branch --show-current`, run once: that is `**Origin:**`. Then `git switch -c esq/<slug>`
   from it, and that name is `**Branch:**`. Write both into the plan file's header before staging. Empty output means detached HEAD, and a non-zero exit means no git repository: in both
   cases create no branch, omit both fields, and carry the reason into step 4. A corrective plan does
   what `esq branch resolve <slug>` answered — `reuse` copies the two fields and creates nothing, `new`
   cuts from the stem's `**Origin:**`; an `esq/<slug>` that already exists stops the command here.
2. **Stage this command's whole tail in one call**, naming only the files this run actually wrote: `git add docs/plans/<filename>` always, plus `docs/DECISIONS.md` if you updated it and `docs/BACKLOG.md` if preflight step 9 flipped any row to `Planned`. Never stage a file this run did not write — with one exception. **A corrective brief you planned is retired in this same commit.** From the `*-fixes*.brief.md` you planned, strike the `## 🟡 Needs a plan` section and every 🔴 item this run resolved through `AskUserQuestion`; when no 🟢, 🟡 or 🔴 item remains, `git rm` the brief, otherwise `git add` it with the rest intact — an unapplied 🟢 is still `/esq:fix`'s and an open 🔴 is still the user's. Never a grill brief, and never a brief this run did not plan. The why is `D-plan-retires-the-brief-it-plans`: `unit.findings` counts every corrective brief still on disk.
3. `git commit -m "plan: <slug>"` — **one** commit, not two: `/esq:plan` owns every one of these files in this one pass, and reverting the plan must revert the status flip it caused.
4. Tell the user:
   - The file path
   - **The shipping unit it created** — two lines, `Branch: esq/<slug>` and `Origin: <name>` — or,
     when the fields were omitted, which condition omitted them (detached HEAD, or no git
     repository) and that `/esq:build` will therefore treat the plan as legacy: it refuses
     nothing, and it never lands.
   - One-sentence summary of the recommendation
   - Suggested next step. **A plan with 2+ phases has two ways to execute, and the user picks — name both:**
     - Always: "Review the plan in your editor. When ready, `/clear` and run `/esq:build <plan-path>` to execute Phase 1."
     - When the plan has 2 or more phases, add: "Or `/esq:autopilot <plan-path>` to run all <N> phases unattended — it stops at the first gate that needs you. Cap the first run (`/esq:autopilot <plan-path> 2`) if you'd rather watch a couple land first."
     - A single-phase plan: `/esq:build` only. Orchestrating one phase is pure overhead.
   - **Elapsed, last, on its own line** — `8m14s`, measured against the preflight announcement. One number, not a report.
5. Stop. Do not execute anything beyond the plan file write.

## Constraints

- Do NOT make code changes outside the plan file — the ledgers aside, the one other file you touch is the corrective brief you planned, retired in "Commit and stop" step 2
- Do NOT spawn subagents — this command reads and reasons itself, and a fleet would each re-derive the same investigation. The bound you announce says **no subagents**.
- Do NOT load files speculatively beyond what informs the plan
- Do NOT execute the planned work — that's `/esq:build`'s job
- The plan file is single-document. Do not split across multiple files.
- If a git repo isn't initialized, write the plan file but skip commit; tell the user
- Do NOT populate the `## Execution log` section — leave the comment marker as-is
