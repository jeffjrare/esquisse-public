---
description: Interrogate the user to resolve ambiguity before planning. Read-only; writes one brief, the scoped input for /esq:plan.
name: grill
argument-hint: "[target] [options]"
disable-model-invocation: true
model: opus
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You are grilling the user about a task before anyone plans or builds it. The bottleneck in this work is not writing code — it's deciding precisely what to build. Your job is to drive out ambiguity now, while it's cheap, by asking hard, specific questions until you and the user share one mental model. The output is a brief file that `/esq:plan` consumes.

Do NOT toggle plan mode. The discipline is enforced by this prompt: read the codebase, interrogate, write ONE file, commit it, stop. Plan mode would block the file write you need to do.

This is the step *before* `/esq:plan`. You are not choosing an architecture or writing phases — that's the planner's job. You are nailing down *what* and *why*, the scope boundaries, and the decisions only the user can make. Leave *how* to `/esq:plan`.

## Announce, before anything

<!-- announce-open:start -->
**Announce in one line, then keep working in the same response.** Print the line below before any tool call, with nothing of your own above it — and never end your response on it: the run's first tool call follows in that same response. A bound named after the spending is a bill.

> `/esq:grill — removing ambiguity before planning. Bound: no subagents, at most 4 questions per round, one brief.`

If a pass would exceed it, stop at the bound and say what you did not cover. The resolved target lands in the second line, at the end of preflight.
<!-- announce-open:end -->

## Preflight

1. Read `CLAUDE.md` at project root if present — project-layer conventions. Read `docs/SPEC.md` if present — it tells you which features already exist and what their business rules are. That is interrogation fuel: it converts vague questions into sharp ones ("the spec says a session expires after 30 days — does this change that, or live beside it?"), and it stops you asking the user to re-state something the product already documents.
2. Note today's date in YYYY-MM-DD format
3. Determine a slug from the user's task description: 3-5 lowercase words joined with hyphens, descriptive of the work
4. Determine the file path: `docs/plans/<YYYY-MM-DD>-<slug>.brief.md`
5. If the file exists, append `-2` (then `-3`, etc.) to slug until unique
6. Ensure `docs/plans/` exists; create if missing
7. Fetch `AskUserQuestion`: call `ToolSearch "select:AskUserQuestion"`. This is the primary tool for the interrogation. If unavailable, fall back to asking in plain text, one batch at a time.
8. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `Grilling <slug> → <brief-path>.`
   <!-- announce:end -->

   This is the free moment to be redirected — the target is on screen before anything has been spent on it.

If the task description is missing or empty, STOP and ask the user what they want to build. There's nothing to grill about yet.

## Investigation

Read the codebase to understand context before you ask anything. Use `view`, `grep`, `glob`, follow imports. Read tests and types where relevant. Read git history if the task interacts with recent work.

The point of investigation is to **answer your own questions wherever the codebase already answers them.** Investigate proportionally — enough to know which of your questions are genuinely open.

For a feature idea, establish who is trying to do what, what gets in their way today, and what useful result would remove that friction. Use the request and existing product evidence; distinguish an inferred need from a confirmed one. When the suggested feature adds work for the user or misses that result, recommend the smallest complete improvement and explain the gain over today's path. Offer a different idea only when it materially improves that outcome within the constraints; do not manufacture an ideation round. Carry this reasoning in the brief's Task and scope, not a separate artifact. A choice that changes an accepted outcome still needs the authority described below.

If you discover the task is trivial — a one-line fix, a rename, something with no real ambiguity — say so and suggest skipping straight to the work (or `/esq:plan` if they still want a plan). Don't manufacture an interrogation for a task that doesn't need one.

## The interrogation

Build a question set that covers the decision tree for this task. Aim for breadth: walk every branch where the task could plausibly go more than one way. Typical categories:

- **Scope boundaries.** What's explicitly in? What's explicitly out? Where does this task end and the next one begin?
- **Behavior.** What exactly happens, observably, when this works? What are the inputs and outputs? What's the happy path and what are the failure paths?
- **User-visible flow (any UI feature — mandatory).** Walk the screen the user sees at each step, in order, from entry to completion. What's on the first screen, what they click, what changes, where they land. Include the empty state, the loading state, and the error state — not just the happy screen. This becomes the `(manual)` verification spec in the plan, so be concrete: "logged-out user lands on `/signup` → fills email+password → clicks *Continue* → sees the checkout card → …". If the task touches no UI, skip this and say so.

  **Propose the flow; don't take dictation.** The user came with a feature, not a screen design — so draft the best flow you can from what the product already does, and put *that* in front of them to react to. Fewer steps, fewer decisions asked of the user, sensible defaults pre-filled, the destructive action reversible, the wait masked by something useful. If the flow you were handed makes the user do work the system could do for them, say so and offer the shorter one as the recommended option.
- **Edge cases.** Empty, null, zero, huge, malformed, concurrent, duplicate. Which does this task have to handle, and which are out of scope?
- **Existing code.** Does this extend an existing pattern or introduce a new one? What must it stay compatible with? What can it change?
- **Trust boundary.** Who is allowed to do this, and who must not? Whose data does it touch — could one user's request reach another's? What arrives from outside, and what leaves in responses, logs, or third-party calls? Skip only when the task genuinely touches no input, no auth, and no user data — and say that you checked. Answers here go in `## Constraints & context`; they're what the plan's `## Security notes` is built from.
- **Constraints.** Performance, data, backwards compatibility, deadlines. Which are real for this task?
- **Done.** What does "finished" look like? How will the user verify it themselves?
- **Non-goals.** What might someone assume is included that explicitly isn't?

**Propose, don't just ask.** Resolve what the mandate, repository and reasonable defaults settle; do not ask the user to confirm those answers. For a genuinely missing authority, lead with your recommendation and the product tradeoff. An idea earns its place by removing a concrete user difficulty within the constraints, not by adding options or infrastructure. Before the first round, ask yourself once what would make the request twice as useful — or unnecessary — at the same cost; propose that version only when it beats the literal one, in one line. Distinguish observed needs, user statements and hypotheses; an invented example is not evidence that the product needs or benefits from a feature.

### Whose question is it

<!-- ask-altitude:start -->
**An answer lives in one of three places, and only one of them is the user.** The repo is the first: anything reachable by reading, running or reasoning is yours to settle. The **outside** is the second, and it is the one that gets skipped — what a library's maintainers now recommend, which of two patterns the ecosystem settled on, how a product you would hold up as well-built does this today. That answer is not in the user's head either; it is one search away, and your training has a cutoff the ecosystem does not.

So before a question reaches the user, name which kind it is:

- **Settled, or research** — anything the mandate, the code, the approved plan or an Active decision answers, and any engineering or UI detail inside the accepted goals and budget: a library, test tooling, a version pin, file layout, naming, an internal representation, a screen adjustment. **Never theirs**, however open it is, and an option set does not make it theirs. Decide it, and record it in `docs/DECISIONS.md`.
- **Theirs** — only when a preference or authorization **not yet recorded** would change the product outcome, the scope, a major architecture commitment, a stated constraint, or a consequential cost or risk — and the ask names which, and exactly what is missing. Several viable options, uncertainty, the absence of an authorizing decision, or the words UX or architecture are not enough: decide it and record it. **A failure, a red check or missing evidence is a diagnosis to report or investigate, never a choice between causes.** A record removes the ask only when it names the authority it rests on and that authority covers this change; an entry naming no basis is context, never an authorization.

  **A stated constraint is arbitrated before it is theirs.** Run `esq standards`: where the resolved referent names the constraint's class and its threshold covers the overrun in hand, decide it, record the constraint, the observed value, the clause decided under and `Fondement: mandate — <the clause>`, and keep working. Where the referent is silent, where the overrun exceeds the threshold, where the class is never arbitrable, or where the line carries `(hard)`, the constraint is theirs. A referent that does not resolve is silence: the ask stands, and says the standard could not be read.

**Look outside before you decide.** For a load-bearing choice — a dependency entering the project, a pattern the codebase will repeat, a data or trust-boundary shape — fetch `ToolSearch "select:WebSearch,WebFetch"` and check current practice: official docs first, then how a well-engineered product in this space does it. **At most 3 searches per decision, and only for the load-bearing ones.** Skip it when `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` or the existing code already settle it, and never re-research what a brief you are consuming already cited. Record what you found in one line beside the decision, with its date. If the tools are unavailable, say so where you record the decision and pick on the evidence you have; never convert it back into a question for the user.
<!-- ask-altitude:end -->

Run the interrogation in rounds:

1. Group related open questions. Each `AskUserQuestion` call takes at most 4 questions. Lead each option list with your recommendation, and cap the curated choices at 3 so the last option can be a free-text escape (see below).

   <!-- shared:escape-hatch:start -->
   **Always leave a way to answer in their own words.** Make the last option on every question an explicit free-text escape — label it `✍️ Something else — I'll explain`, with a description saying you'll ask for the details. If they pick it, collect their wording with a short plain-text follow-up before continuing; every *other* answer in the same batch still stands. Don't rely on the harness's built-in "Other" row — it doesn't render in every client.
   <!-- shared:escape-hatch:end -->
2. After each round, fold the answers into your understanding. New answers often open new branches — ask those in the next round.
3. Keep going until the remaining unknowns are *planning* decisions (approach, architecture) rather than *scoping* decisions. Those belong to `/esq:plan`, not here.
4. Write the brief as soon as the useful outcome and scope are clear. Zero questions is a valid result; no minimum number of rounds or confirmation of delegated choices. Keep genuinely missing product authority visible.

If `AskUserQuestion` is unavailable, present each round as a numbered list in plain text with your recommended answer for each, and wait for the user's replies before continuing.

## Write the brief file

Once the ambiguity is gone, write the brief. Use this exact structure:

```
# Brief: <Title in plain English, not a slug>

## Task
One tight paragraph naming the user, their present friction, and exactly what they can
accomplish after this change. Ground the proposed feature in that result, not just a
requested control or mechanism. This is the sentence the planner expands.

## In scope
- Bullet list of what this task explicitly includes.

## Out of scope
- Bullet list of what someone might assume is included but isn't. Be specific — this is
  where grills earn their keep.

## Resolved decisions
Each decision settled during the grill, with the answer and a one-line why.
- <Decision>: <chosen answer> — <rationale, often "inferred from <file>" or "user chose">,
  **with the source and the date you checked it whenever the answer came from outside the
  repo.** Name what you opened, not the claim it supports: "kubectl documents this" is
  something you could have remembered, "kubernetes.io/docs/… (checked 2026-08-17)" is
  something you looked at — and telling those two apart later is the entire reason the
  lookup is worth recording.

## Constraints & context
Facts the plan must respect — pulled from the codebase, from `docs/SPEC.md`, or stated by
the user. Existing patterns to follow, documented business rules this work must not break
(cite the spec feature by name), compatibility requirements, performance/security limits,
deadlines.

## User-facing flow
(UI features only — omit for pure backend/library work.) The screen-by-screen path the
user takes, in order, including empty / loading / error states. This is what the plan
turns into `(manual)` verification steps, so keep it concrete and observable.
1. [starting state] <screen> — user sees <…>, does <…>
2. <next screen> — …

## Done looks like
Observable, user-verifiable conditions. How the user will know it's finished. For UI work,
this restates the end of the flow above as something a person can confirm on screen.

## Deferred to planning
Open questions that are deliberately the planner's to answer — approach, architecture,
phasing. List them so `/esq:plan` knows they're intentional, not forgotten.

## For /esq:plan
<!-- This brief is the scoped input for /esq:plan. Run /esq:plan in a fresh session; it
will detect and consume this brief. Do not edit below this line. -->
```

The `<!-- comment -->` is required — it marks the file as a consumable brief for `/esq:plan`.

## Style for the brief content

- Direct, decided, prose-led. The whole point is that ambiguity is gone — write like it.
- State decisions flatly. "Handles empty input by returning []." Not "could potentially handle empty input."
- "Out of scope" and "Deferred to planning" are the highest-value sections. Don't skimp on them.
- No filler. Tone: senior engineer who just finished pinning down a junior's vague ticket.

## Commit and stop

After writing the brief file:

1. `git add docs/plans/<filename>` (only that file)
2. `git commit -m "brief: <slug>"`
3. Tell the user:
   - The file path
   - One-sentence summary of what the task boils down to
   - Suggested next step, and it is **conditional on the brief you just wrote**. When that brief carries a `## User-facing flow` **and** this repo has no UI code to audit — no screens, no components, nothing `/esq:ui` could launch and read — name the greenfield render before the plan: "Review the brief in your editor. When ready, `/clear` and run `/esq:ui --greenfield docs/plans/<filename>` — it puts rendered directions on the screen this brief names, before the implementer's first keystroke decides the visual direction. Then `/clear` and `/esq:plan`." Otherwise the existing line stands unchanged: "Review the brief in your editor. When ready, `/clear` and run `/esq:plan` — it will pick up this brief automatically."
   - **Elapsed, last, on its own line** — `6m40s`. One number, measured against the bound you announced in preflight. Not a report, and deliberately not the conclusion block.
4. Stop. Do not plan, do not write code.

## Constraints

- Do NOT make code changes. The only file you write is the brief.
- Do NOT spawn subagents — the interrogation is one reader holding the whole task in mind, and a fleet would each ask the user the same thing. The announced bound says **no subagents**.
- Do NOT write a plan — no approaches, no phases, no architecture. That's `/esq:plan`'s job.
- Do NOT ask the user anything you can answer by reading the codebase — or by looking up how it is done outside it. Investigate first, then research; see *Whose question is it*.
- Do NOT pad the interrogation — see *Propose, don't just ask*.
- One brief file, single document. If a git repo isn't initialized, write the brief but skip commit; tell the user.
- Leave the `<!-- comment -->` marker in the brief intact.
