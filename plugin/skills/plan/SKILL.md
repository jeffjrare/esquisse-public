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
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
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

1. **Read the two projection docs, if present.** They answer different questions and you need both:
   - `CLAUDE.md` at project root — *how* this codebase is built: conventions, architecture, gotchas.
   - `docs/SPEC.md` — *what* the product does, feature by feature, in PO language. Locate the feature section(s) your task touches and read their **Fonctionnement** and **Règles métier**. Three things to do with them: (a) don't re-derive from code what the spec already states; (b) if the task would **change** a documented behavior or business rule, say so explicitly in the plan's `## Context` and name the feature — that's a product change, not just a code change; (c) if the task would **contradict** a rule with no sign the user meant to, raise it as an `## Open question` before writing phases. Never edit `docs/SPEC.md` here — refreshing it is `/esq:spec`'s job, user-triggered, after the code ships.
2. **Resolve the planning input.** Use the user's task description when given. Otherwise run `esq brief pending` and read `selected` in full: its scope, decisions, constraints and deferred work are the input. Announce its path and the other `pending` briefs this run will not plan. Derive the slug by stripping `.brief.md` and the leading date.
   Never choose by disk mtime: the CLI excludes consumed briefs, accounts for abandoned plans, and selects corrective briefs only while 🟡 items remain. No task and no pending brief → STOP and ask what to plan, even if older briefs remain on disk.

3. Note today's date in YYYY-MM-DD format
4. Determine a slug: from the brief filename if consuming a brief, else 3-5 lowercase words from the task description joined with hyphens
5. Determine the file path: `docs/plans/<YYYY-MM-DD>-<slug>.md`
6. If the file exists, append `-2` (then `-3`, etc.) to slug until unique
7. Ensure `docs/plans/` exists; create if missing
8. Fetch `AskUserQuestion`: call `ToolSearch "select:AskUserQuestion"`. Needed for interactive decisions during planning. Skip silently if unavailable.
9. **Check `docs/BACKLOG.md` if present.** Match `Open`/`Needs-decision` rows by the task's nouns in their Summary; read a detail section only after its row matches. Include only relevant items in `## Open questions` or `## Risks`; resolve blockers before planning proceeds. When writing the plan, use the CLI to mark picked-up rows `Planned`, appending ` · Planned by <this-plan-slug>` to Source. Update only the row; strip any legacy detail `**Status:**` rather than maintaining it. Commit these edits with the plan and decisions in the single tail commit.
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

<!-- shared:corrective-bound:start -->
**Two corrective generations, and the third is not yours to open.** Before anything opens another corrective round, run `esq brief depth <brief-path>` and route off its `verdict` alone — never off the filename, and never off a generation you counted yourself. `open` changes nothing. `exhausted` means this unit has already been corrected twice, and what is left is a budget call only the user holds — so hand back this 🔴, a decision in this exact shape, and nothing else:

> **🔴 Third corrective round on `<stem>` — accept it or re-plan it**
> - **Why yours:** two corrective rounds have already landed on this unit, and whether to keep spending on it is an authorization only you hold.
> - **A · accept what stands** — the 🟢 items are applied and every finding left becomes a recorded backlog row, so the unit lands with its debt written down — do: `/esq:fix <brief-path>`
> - **B · abandon and re-plan the stem** — this unit's unbuilt plans are retired and the work is planned again from `<stem>`, at the price of a fresh planning pass — do: `esq plan abandon <plan-path> --reason "third corrective round refused"`, then `/esq:plan <stem>`
> - **Leaning:** **A** — the debt is recorded either way, and a third round costs more than it retires.

No finding is lost to this refusal: the corrective brief stays on disk, so `unit.findings` keeps the landing blocked until option A's `do:` disposes of it.
<!-- shared:corrective-bound:end -->

For `/esq:plan` that verdict is answered here, before a byte of investigation is paid for. At `exhausted`, **write no plan file, create no branch, flip no backlog row, and print that 🔴 as the whole of the run** — `<brief-path>` is the corrective brief you were handed, and `<plan-path>` is the stem's in-flight plan it corrects.

## Investigation

Read the codebase to understand context. Use `view`, `grep`, `glob`, follow imports. Read tests and types where relevant. Read git history if the change interacts with recent work.

Investigate proportionally. A small bug fix needs 2-3 files. A refactor needs the touched module plus boundaries. A feature might span more. Don't read everything; read what informs the plan.

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

**Record the branch, in the header.** Two fields, and they are the whole shipping unit.
`**Origin:**` is the branch you were standing on when this plan was written — `git branch
--show-current`, read once, at the moment you commit the plan (step 1 of "Commit and stop"), not
earlier — and it is where this unit's work lands when it is done. `**Branch:**` is the branch its
phases commit to: `esq/<slug>`, cut from that origin with `git switch -c esq/<slug>` so the plan
file's own commit is the first thing on it and the origin is left exactly as you found it. Both go
beside `**Epic:**`, above the first `##` heading, which is the only place `esq branch check` and
`esq merge land` read them from. They are this command's fields and no other's — no later command rewrites them.

The slug is already three to five lowercase hyphen-joined words (preflight step 4); `esq/`-prefix
it and hand it to git as an argument, never through a shell. Four cases leave that straight path:

- **A corrective plan** — slug `<stem>-fixes`, and so is a correction of a correction, since
  `-fixes-2`, `-fixes-fixes` and `-fixes-2-fixes` all canonicalize to the same stem — never picks its
  branch by hand — and preflight has already answered `esq brief depth <brief-path>` `open` for it, so on
  `exhausted` this bullet is never reached. **Run `esq branch resolve <slug>` and route off its `mode`:** `reuse` (the stem's
  unit is still in flight) copies the returned `branch` and `origin` into the header and creates
  nothing; `new` (the stem has landed or was retired) cuts `esq/<slug>` from the returned `origin`,
  the stem's own destination and never wherever the finder left you. Anything else is `new` with a reason.
- **`esq/<slug>` already exists** — stop the command and say so, naming the branch. Never attach to
  it and never uniquify around it: the collision means the work already has a shipping unit, and
  which of the two the user meant is theirs to say rather than yours to guess.
- **Detached HEAD, or outside a git repository** — **omit both lines entirely** rather than
  inventing a name, create no branch, and say which condition omitted them in the closing summary.
  A plan with no `**Branch:**` is the `unrecorded` verdict, which refuses nothing; a plan with no
  `**Origin:**` is legacy, so it still builds and it never lands.
- **A dirty tree is not a refusal.** `git switch -c` carries uncommitted work onto the new branch,
  which is where the user was heading anyway. Stage the plan file and nothing else.

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
2-3 candidate approaches, each with:
- A name (one phrase)
- One paragraph describing it
- Tradeoffs — what it gains, what it costs

If the task admits only one sensible approach, say so explicitly and justify in one sentence. Don't manufacture alternatives for structure's sake.

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

Sequential, atomic, each shippable independently. Each phase fits in one fresh execution session.

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

- Direct, opinionated, prose-led
- Bullets only where genuinely list-shaped
- Recommendations stated plainly
- Uncertainty surfaced as open questions, not papered over
- Tone: senior engineer reviewing a junior's design
- No filler ("consider potentially evaluating")

## Verification discipline

**Every step names an observable property and is tagged `(auto)` or `(manual)`.** Tests passing is evidence only for what they actually check.

- **`(auto)` is the default:** anything executable with machine-readable output, including all backend checks, APIs, queries, logs, tests and builds. Write one command in one inline-code span, then an em dash and its artifact/property: `` `(auto)` `pnpm test src/api` — the API suite passes ``. Landing extracts the command for proof reuse and reads the sentence as its PASS criterion: a grep proving no matches can pass at exit 1. A prose command or multiple commands in one step cannot be resolved for reuse and must be rerun in full.
- **`(manual)` is only for rendered screens and visual UX flows.** Every UI-touching phase needs at least one step observing the actual screen, not merely a component-mount test. Before authoring a UI phase or manual step, load `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md` for starting states, action-first wording, the browser-driver test and per-screen consolidation. Backend-only phases have no manual steps.
- **Choose verification by what the phase changes.** Target its tests; require a whole-repo run in the last phase and any phase changing code imported outside its package. Each earlier phase still needs its own proof to be independently shippable.
- **Buy each proof once within a phase.** Read the scripts, selected paths, runner config, environment and assertions of every required command. Remove a narrower step only when another required step covers both its tests and PASS criterion under equivalent conditions. Keep distinct typechecks, builds, lint, negative controls, tree assertions, environments or flags. Names such as "full" prove nothing. If inclusion is uncertain, keep both. A later phase's wide run does not replace an earlier phase's targeted proof. Deduplicate the plan here; never instruct executors to silently skip steps or reuse a broader command's PASS for a different command string. Build's explicit execution exceptions still govern an unrunnable command or an overbroad inherited suite.
- **Resolve commands by reading, never by running planned verification.** Check the executable exists and is executable, and arguments match its Usage header, documented help or existing call sites, in that order. Cite the call site used when other documentation is absent. A file this plan's tasks create is a valid future referent. Always name the artifact and property after the command so execution can recover its intent if the command cannot run; an ambiguous bare command cannot be safely substituted.
- **Use explicit `.mjs` files or quoted globs for `node --test`, never bare directories:** `node --test 'tests/cli/*.test.mjs'`.
- **Make results independent of ambient tool variants.** Prefer explicit path operands to searching a root and filtering printed path prefixes. Account for wrapped text, locale-dependent sorting and differing tool flags; the same assertion must mean the same thing in an interactive shell and a script.
- **`(reads)` declarations are optional promises.** After an auto step's property, `(reads)` may name its input paths so `esq gate verify` checks freshness against those paths. No declaration is the normal, complete case. Before writing any, load `${CLAUDE_SKILL_DIR}/references/reads-declaration.md`; never guess from memory or under-declare inputs. Plans without declarations do not load that reference.
- **No "deferred to live env" pass.** If a behavior cannot be verified within the phase, record it as a Risk or Open question; do not call the unverified change done.

## Right-size, then read it once

Two passes over the plan you have just written, both in the context you already hold — no subagent, no
extra artifact, no re-read of a file this run has read.

**First, right-size what it proposes to build.** Take every task and ask: **what breaks today if this
isn't there?** If the answer is "nothing yet, but we'll want it when…", cut it. Specifically:

- An abstraction, interface, or base class with exactly one implementation and no second one anywhere in this plan.
- Configuration, feature flags, or extension points that nothing in this plan sets.
- A generalization justified by a use case the project hasn't committed to.
- A phase whose whole deliverable is restructuring code that works, unless something else in this plan is blocked by its current shape.

Cutting is the default; keeping needs a reason you can state in one line. Anything cut that still feels
worth doing is a backlog item (`/esq:backlog`), not a phase.

**The opposite failure is just as real, and this pass does not excuse it.** A plan is **under**-built,
not lean, when it skips a trust boundary, ships a screen with no error state, or picks a data model a
requirement already on the table will break. **Trim generality, never design.** A UI phase's states are
tasks, not polish — load `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md` if it is not
already in hand, and check that phase against it.

**Then read the plan once, as written, for the five things a reader would catch and a writer misses.**
Each names what fixing it yourself means; none of them is a question to the user:

1. **No lifecycle step another command already owns.** A phase that has the builder write a fixes brief, close a backlog row a later command closes, or re-run a check that command runs anyway, duplicates someone else's lifecycle. *Fix it yourself:* delete the task and name the owning command in one line where the phase described it.
2. **`## Done looks like`, the scope exclusions, the phases and `## Risks` do not contradict each other**, and every done-bullet is readable off the tree alone — a bullet only a number collected after the ship can confirm belongs in `## Context` or `## Risks` as the reading to take later. *Fix it yourself:* change whichever of the four is wrong, usually the exclusion list, written before the phases were.
3. **Any widening of a public schema or data surface is explicit**, and so is any activation a change needs before a user gets it — an install, a release, a restart. *Fix it yourself:* say so in the task that widens it, name the consumers that must keep parsing the old shape, and put the activation in `## Risks` naming whose call it is.
4. **Boundary values and malformed input are covered by a phase.** Empty, absent, zero, one, the maximum, the wrong type, the file that will not parse. *Fix it yourself:* add them to that phase's verification, or as a task where the handling does not exist yet.
5. **Every `(auto)` command was resolved against its own script's documented usage**, and no phase's mandatory verification buys one proof twice. Read the script — its path, its flags, its exit codes — rather than assuming them: a step that cannot run as written breaks the next `/esq:build`. *Fix it yourself:* correct the command, or replace it with one checking the same property at the same or greater strictness, never a narrower one; and delete a narrower step a broader one already covers.

**Phases are sized by what they deliver, not by a task count.** There is no cap: a phase with six
mechanical edits to one file is one commit's worth of work, and splitting it buys a second session for
nothing. Size against these instead:

- **Each task = one atomic commit's worth.** A task description with "and" connecting two unrelated changes is two tasks.
- **Each phase shippable independently.** After phase N completes, the codebase is in a working, deployable state.
- **Phase fits a fresh session.** If one phase alone needs 50K+ tokens of context, split it.
- **Verification is runnable.** "The function exists" is not verification. "Calling X with Y produces Z" is.

**Then escalate almost nothing.** An ordinary omission is corrected in place and mentioned in one line
in your report — "the read added the malformed-input case to Phase 2 and dropped Task 3.2, which
`/esq:check` already owns". Only a choice the ask-altitude block marks **theirs** becomes an
`AskUserQuestion`, and it rides the batch "Resolve open questions" is about to send rather than buying
a round trip of its own. A question you could have answered by reading the code, the scripts or the
projection docs is not theirs — it is the omission, still unfixed.

## Resolve open questions

After writing the initial plan file, review `## Open questions` and `## Risks` for items the user can decide now — questions where the answer would refine or change the plan, not just risks to watch during execution.

Run every candidate through *Resolve blocking decisions* above before it goes in a batch. An open question about tooling, dependencies, versions or file layout is one you owe an answer to — resolve it by research and fold the answer into the plan, rather than spending one of the four slots on it.

For each resolvable item, prepare an `AskUserQuestion` entry:
- The question should be clear and actionable
- Offer up to 3 concrete resolution options, with tradeoffs as the description

<!-- shared:escape-hatch:start -->
**Always leave a way to answer in their own words.** Make the last option on every question an explicit free-text escape — label it `✍️ Something else — I'll explain`, with a description saying you'll ask for the details. If they pick it, collect their wording with a short plain-text follow-up before continuing; every *other* answer in the same batch still stands. Don't rely on the harness's built-in "Other" row — it doesn't render in every client.
<!-- shared:escape-hatch:end -->

Present at most 4 questions per call. After receiving answers, check if more resolvable questions remain — if so, present the next batch. Repeat until all actionable open questions are resolved.

After all rounds, edit the plan file to reflect the decisions:
- Fold resolved open questions into the relevant phase, approach, or a brief note — remove them from `## Open questions`
- Annotate resolved risks with the chosen mitigation
- Leave only genuine unknowns (things that truly cannot be decided yet) in `## Open questions`

If `AskUserQuestion` is unavailable, ask the questions in plain text and wait for the user's responses before updating the plan.

**Skip entirely** if `## Open questions` is empty and `## Risks` contains only execution-time watchpoints with nothing for the user to decide now.

## Write decisions to registry

After writing the plan file, capture any significant decisions made during planning in `docs/DECISIONS.md`.

**What to capture:**
- The approach chosen in `## Recommendation` — if there were at least 2 real alternatives considered
- Any blocking decisions resolved via `AskUserQuestion` during "Resolve blocking decisions"

**Skip this step if** you stated "only one sensible approach" and there was genuinely no real choice. A decision requires alternatives.

**How:**

1. If `docs/DECISIONS.md` does not exist, create it:

```markdown
# Decisions

<!-- Registry of architectural, product, and functional decisions. Managed by /esq:plan and /esq:build. -->
<!-- An ID is a permanent citation key: never renumbered, never reused. Code, plans and commit messages may cite it. -->

| # | Date | Scope | Topic | Décision | Statut |
|---|------|-------|-------|----------|--------|

---
```

2. **Backfill missing topics:** Before adding new entries, scan existing `## D-` entries for any missing `**Topic:**` field. For each one, infer a topic from the entry title and content (free-form domain tag — e.g. "auth", "subscription", "seo", "checkout", "payments"). Add `**Topic:** <inferred>` after the `**Scope:**` line, and fill in the topic column in the corresponding table row. Include these changes in the same commit.
3. **Derive the ID from the title — it is a slug, never a number.** 3–5 lowercase words from the decision title, hyphen-joined (same convention as plan/brief/epic slugs), giving `D-<slug>`. If a `## D-<slug>` heading already exists, append `-2`, `-3`, … until unique. Numbered `D-NNN` entries predating this convention stay exactly as they are — never migrated, never renumbered.
4. For each decision, add a row to the table and a full entry below the `---`:

```markdown
## D-<slug> — <Title>

**Scope:** <arch | prod | func | ux | infra | deps>
**Topic:** <free-form domain tag — e.g. "auth", "subscription", "seo", "checkout", "payments">
**Date:** YYYY-MM-DD
**Statut:** Active
**Fondement:** <optional — mandate — the plan clause, CLAUDE.md rule or accepted frame that covers this choice | user — where and when the user authorized this change: the brief's ## Resolved decisions, the answered question, the approved plan>

**Contexte:** Why this decision was needed — 1-2 sentences.
**Décision:** What was decided — 1 sentence.
**Raison:** The key tradeoff or reason — 2-3 sentences.
**Tradeoff:** What was gained and what was accepted as cost — 1 sentence each.
**Conséquences:** What this implies for future work — 1-2 sentences.
**Alternatives rejetées:** Other options and why they were not chosen.
```

**Fondement — what the authority rests on, never what was done.** Write `mandate — <the clause>` when the plan, `CLAUDE.md` or the accepted frame already delegated this choice — a worker records its own technical calls this way without asking anyone — and `user — <where and when>` for a change to an explicit constraint, a promised capability or a major commitment. **The citation after the em dash is the field:** a form with nothing behind it authorizes nothing, and neither do `Statut: Active`, the entry's date, or when its commit landed. Write no field at all when the entry only records an outcome. It is optional and purely additive — never backfill an existing entry, add no migration, and every consumer keeps reading an entry that carries none: the three states are `mandate`, `user` and absent.

**Scope values:** `arch` (architecture/stack/patterns), `prod` (product scope/features/priorities), `func` (functional behavior/business rules), `ux` (UX/design/interactions), `infra` (deployment/CI/CD), `deps` (libraries/versions)

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
