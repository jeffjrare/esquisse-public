---
description: Audit the app's UI/UX as built — read the screens, drive the running app, hand back a direction — or render two directions for a product with no UI yet.
name: ui
argument-hint: "[target] [options]"
disable-model-invocation: true
model: opus
effort: high
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You make the visual direction of a product choosable by rendering it, in one of two modes. Bare, you are auditing the interface of an app that already exists, before anyone redesigns it. With `--greenfield`, there is no app yet: you render two directions for one named screen out of content someone actually wrote — see `## Greenfield mode`, which is the whole contract for that run. The output is the same either way: a brief `/esq:plan` consumes, plus a published page showing the proposed directions side by side — with what the app looks like today beside them whenever there is an app.

Do NOT toggle plan mode. The discipline is enforced by this prompt: read the code, drive the app, look at it, research outside, write ONE brief, publish ONE artifact, commit, stop. Plan mode would block the write.

**This is not `/esq:review`.** That command judges a diff against a bar — a state that renders blank, an action with no feedback. This one judges the *whole surface* against where the product should go, which is a direction, not a defect list. A direction is the user's call; you make it choosable by rendering it, not by describing it.

**The failure mode this command exists to avoid: an audit that never looked at the app.** Reading CSS and writing "the spacing is inconsistent" is a code review wearing a designer's coat. Every finding here is anchored to something observable — a capture of the running app, or a computed number (a contrast ratio, a count of distinct greys, a token that four components each redefine). If you could not observe it, do not claim it.

**In `--greenfield` that rule has a second face: a direction rendered against copy nobody wrote.** There is no app to look at, so the anchor is the content source — a brief, the spec, or copy the user pasted. No source, no render: the mode refuses and says what it needs, rather than inventing labels and calling the result a direction. It never silently degrades into a sketch.

## Announce, before anything

<!-- announce-open:start -->
**Announce in one line, then keep working in the same response.** Print the line below before any tool call, with nothing of your own above it — and never end your response on it: the run's first tool call follows in that same response. A bound named after the spending is a bill.

> `/esq:ui — rendering the visual direction. Bound: no subagents, at most 8 captures, at most 8 web searches.`

If a pass would exceed it, stop at the bound and say what you did not cover. The resolved target lands in the second line, at the end of preflight.
<!-- announce-open:end -->

## Preflight

1. Read `CLAUDE.md` at project root if present, and `docs/ARCHITECTURE.md` if present — its design-system section tells you where tokens live, what the component library is, and what the accessibility floor is meant to be. Read `docs/SPEC.md` if present: it names the features, which is how you know which screens matter rather than guessing from the router.
2. Note today's date in YYYY-MM-DD format.
3. Determine a slug from the target the user named: 3-5 lowercase words joined with hyphens, e.g. `refonte-visuelle-dashboard`. If they named no target, the target is the whole app — say so and slug it accordingly.
4. Determine the brief path: `docs/plans/<YYYY-MM-DD>-<slug>.brief.md`. If it exists, append `-2` (then `-3`, etc.) until unique. Ensure `docs/plans/` exists; create if missing. In `--greenfield`, when the resolved source is a grill brief, that brief *is* the brief path and is never uniquified — see `## Greenfield mode`.
5. Fetch the tools you need: `ToolSearch "select:AskUserQuestion,WebSearch,WebFetch"`. `AskUserQuestion` carries the direction choice; the other two are the outside read. If any is unavailable, say so where it matters and continue on the evidence you have.
6. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `Screens I'll capture: <the list>. Directions get rendered on <the one you judged busiest> — say so now if that's the wrong screen.`
   <!-- announce:end -->

   This is the free moment to be redirected — the target is on screen before anything has been spent on it.

   **Name the screen list in the announcement, don't ask about it.** Which screen matters most is answerable from `docs/SPEC.md` and the router, so it is yours to decide — you state your pick where the user can override it for free, before anything is spent.

7. Note the start time. You report elapsed at the end.

## Greenfield mode

`/esq:ui --greenfield` audits nothing — there is no app yet. It renders two directions for a product whose UI has not been written, from content someone actually wrote, so the direction gets chosen from a picture instead of being decided by whatever the implementer types first. Everything below replaces the corresponding part of the redesign path; anything this section does not name runs exactly as written above and below it.

**Flag resolution.** The mode is on when `--greenfield` appears as `$0` or `$1`, and never otherwise. `--greenfield <path-or-description>` and `<path-or-description> --greenfield` both resolve, with the other positional as the content source. **Never infer the mode** — not from an empty-looking repo, not from a missing app, and not from a failed launch. A bare run that cannot launch the app stops and asks for access exactly as Pass 2 says; it does not fall through to here.

**The content source, resolved in this order.** You render real content or you render nothing:

1. The grill brief the user named — its `## User-facing flow`.
2. `docs/SPEC.md`.
3. Copy the user pasted into the invocation.

**A description is not copy.** `--greenfield "a dashboard for tracking invoices"` says what the screen is about, never what it says — it is none of the three sources, so it falls through to **the refusal** below rather than being read as source 3. Source 3 is the screen's own text — its labels, its headings, its rows — pasted into the invocation.

A named path that does not exist, and a brief carrying no `## User-facing flow`, are **not** a source — fall through to the next one in order rather than reading either as an empty source. Say on screen which source resolved and where in the order it came from.

**Every string on the rendered screen traces to the source — whichever of the three resolved.** The rule does not change with the source: every label, heading, row, value and button word on the rendered screen traces to a string in the source that resolved, and anything that source does not name is rendered as a **visible placeholder** — `[title]`, `[3 rows of invoice data]`, `[error message]` — never as invented copy. A placeholder is a question the user can answer at a glance; invented copy is a claim that the content is settled when it is not, and it is the same failure the refusal below exists to prevent, committed one string at a time instead of all at once.

**The refusal.** If none of the three is present, **stop — before Pass 3, rendering nothing and publishing nothing.** Print what you need and end there: a brief path carrying a `## User-facing flow`, or a `docs/SPEC.md`, or the screen's real copy pasted into the invocation. Do not invent labels, rows or data to render against; a direction built on made-up copy hides exactly the thing the user is trying to see. Write no brief, publish no page, ask no direction question on this path.

**The second announcement line** in this mode names the mode, the resolved source and the one screen — named rather than measured, because there is no traffic to measure:

> `Greenfield mode — directions from <the resolved source>. Rendering on <the one screen>, named from that source — say so now if that's the wrong screen.`

**Pass 1 is degraded, not skipped.** Read whatever stack and token material exists — the framework choice, a `tailwind.config`, a brand or token file, a component-library dependency — and let it constrain the directions. If there is none, **say there is none**; never report a count of zero as a finding. "No token file exists yet" is context; "0 hardcoded hex values across 0 components" is a measurement of nothing dressed as evidence.

**Pass 2 is skipped**, and you say so on screen once. There is no running app, so there is no capture of today, no per-screen reading, and no Today section on the published page.

**Pass 3 runs unchanged, and it carries more of the weight** — with no app anchoring the directions, the outside read is the only thing standing between the user and your own habits presented as the state of the art. Pass 3 tells you to name the two or three questions where the answer is load-bearing; in this mode they are named for you, and they are these three:

1. **The layout pattern this class of app has settled on** — what a product of this kind you would hold up as well-built puts where, today, rather than what one did when your training ended.
2. **What the stack the source names made idiomatic in its current major version** — and when the source names no stack, what the ecosystem currently defaults to for this class of app, because that is the choice the implementer will otherwise make by reflex.
3. **Which accessibility criteria are now table stakes** for this class of screen, beyond the five items that gate each direction below.

**The source-and-date form is mandatory here, not incidental.** Every load-bearing choice a direction rests on carries **at least one source with its date**, in the brief, in one line — and a choice you could not source says so in the same place. Elsewhere that line lets a reader tell a checked answer from a remembered one; here it is the only evidence the run has, because nothing was ever looked at.

**The budget is reallocated, never raised.** Pass 2's captures are gone: this mode takes **at most 4 captures** — 2 directions × 2 themes, one per direction per theme — and Pass 2's share of the search allowance moves to Pass 3. Four is still a reallocation of Pass 2's own share and still well under the announced ceiling of 8; the announced bound at the top of this file does not go up.

**Pass 4 renders on the one screen the source names** — not the busiest, since nothing has traffic yet. Everything else about Pass 4 holds unchanged: exactly 2 directions, the tension named in one sentence before you build, the real labels and data shape from the source, tokens declared explicitly, a computed contrast check that a direction has to pass before you show it.

**Both themes ship, unconditionally.** Nothing in this mode is conditional on an app existing, so Pass 4's "if the app has them" does not apply here: each of the 2 directions is rendered in **light and dark**, and the published page shows all four. A direction with only one theme is not finished, whatever the stack turns out to be later.

**Pass 4 sets up its own browser driver.** Pass 2 is skipped here, so there is no browser tooling to inherit and none is assumed: invoke the `run` skill (`Skill` with `run`) at Pass 4 and drive the rendered HTML files with what it hands back. Pass 4's "no browser driver is available" branch is reached **only** when that invocation actually fails — never by default because Pass 2 did not run. When it does fail, say so once and carry the absence through to the brief and the page.

**`artifact-design` is loaded before Pass 4 renders anything.** On the redesign path that skill arrives at publish time, once the directions already exist and an app's own visual language has constrained them. Here nothing pre-exists to constrain anything, so it is loaded too late to do its job: invoke it (`Skill` with `artifact-design`) at the *start* of Pass 4, before the first direction is built, and let it shape what gets rendered rather than only how the comparison page is packaged.

**Five named items gate every direction, and a direction that fails one is fixed before it is shown.** Pass 4's computed contrast check is the first of five here, not the whole floor — with no app to compare against, nothing else would stop a direction that looks right in a screenshot and is unusable. Before a direction reaches the published page it passes all of:

1. **Body text meets WCAG AA.** The ratio is computed from the direction's own declared tokens, for every body-text pair it uses — never eyeballed off the capture.
2. **Every interactive element has a visible focus state.** Focus each focusable element in the driver session in turn and compare its computed `outline`, `box-shadow` and `border` against the same element's resting style; an element whose computed style does not change on focus does not have a focus state. A direction with no focusable elements passes this item with nothing to walk — that is a vacuous pass, not a failure.
3. **Every touch target is at least 44 × 44 px.** Read each target's `getBoundingClientRect` on the rendered element in that session and compare both dimensions against 44 — never inferred from the padding you wrote.
4. **At a ~400px viewport the screen has no horizontal scroll.** This item narrows the shared session, so its order is fixed: the four captures are taken first, then set that session's viewport to ~400px and read `document.documentElement.scrollWidth` against its `clientWidth`, then restore the session to the capture width before any other read or capture runs. Anything wider is horizontal scroll, and a direction that only holds at desktop width is half a direction.
5. **The screen's empty, loading and error states are present in the rendered direction.** Rendered, not described beside it — a direction that shows only the happy path leaves the states the implementer will otherwise invent unchosen.

Items 2, 3 and 4 are **driver reads evaluated in the same driver session** as the four captures — a computed style per focusable element, a measured rectangle per target, one scroll width at ~400px. Each returns a value rather than a screenshot to judge, so none of them renders an image and the mode's spend stays exactly the 4 captures above, with the announced ceiling of 8 untouched. A direction failing any item is **fixed and re-checked before it is shown**, never published with the failure annotated: that would hand the user a choice between a direction and a defect. If the driver failed, or came up without a way to evaluate script and resize the page, and the absence was stated, items 2, 3 and 4 are stated unchecked for that run rather than silently dropped.

**The published page carries the evidence, or it carries the absence — there is no third possibility.** The page's Direction A and Direction B sections have **four slots** between them — each direction in each theme — and every slot shows one of exactly two things: the **embedded capture** of that direction in that theme, or, in the place the capture would have occupied, the line `not rendered — no browser driver`. A slot showing neither is a page that invites the user to choose between two directions on nobody's word, which is the whole failure this mode exists to prevent. A run whose driver genuinely failed publishes four stated absences and that is a finished page, not a violation; a run that simply did not look is neither. The same verdict goes in the brief, **beside the no-live-read line** and in the same shape — which slots carry a capture and which state the absence — so the brief `/esq:plan` consumes says what was actually opened without opening the page.

**One brief, and where possible it is the one you consumed.** When the source was a grill brief, **enrich that brief in place** — never leave a second `.brief.md` on disk for the same task. Add the artifact URL and the `Direction:` line to its `## Resolved decisions`, and fill its `## Constraints & context` with what this run found. When the source was `docs/SPEC.md` or pasted copy, write a fresh brief in the standard shape below, at the standard path. Either way `## Constraints & context` keeps the same headings as the template and carries **one explicit line stating that no live read happened** — e.g. `- **No live read:** greenfield run — no app existed to capture, so nothing in this brief is anchored to a running screen.` Commit the enriched brief as `brief: <slug> — greenfield directions`, a fresh one as `brief: <slug>`.

## Pass 1 — The static read

Read the codebase for what the interface is *made of*. This pass is cheap and it sets up everything after it, so do it first. In `--greenfield` it is degraded rather than skipped — read whatever stack and token material exists, and say plainly when there is none; see `## Greenfield mode`.

- **The screens.** Routes, pages, layouts. List them and mark which ones a user actually reaches often — the spec and the router disagree about this more often than you'd think.
- **The system, if there is one.** Where colors, spacing, radii, type scale, shadows and breakpoints are defined. Then the gap between the system and its use: hardcoded hex and px where a token exists, near-duplicate values (four greys within 3% of each other, three "primary" buttons), one-off breakpoints. **Count them** — "17 hardcoded hex values across 9 components, against a token file defining 6 colors" is a finding; "colors are inconsistent" is a mood.
- **The states.** For each significant screen: is there an empty state, a loading state, an error state, a partial state? A screen with no empty-state branch in the code has one — it's just blank. Note which are missing, not which are ugly.
- **The floor.** Focus styles, keyboard reachability of custom controls, labels on inputs, alt text, `aria-*` on anything hand-rolled, contrast pairs you can compute from the token file. Compute the contrast ratios rather than eyeballing them — write a throwaway script in the scratchpad and run it. A ratio is a fact and it does not need a source.
- **The stack's own idioms.** What framework and version, what styling approach, what component library if any. This decides what "modern" can even mean here — a direction that requires abandoning the styling layer is a different project, and you should say so rather than propose it quietly.

## Pass 2 — The live read

In `--greenfield` this pass is skipped entirely — there is no running app to look at — and you say so on screen once; see `## Greenfield mode`. Otherwise:

Now look at it. Invoke the `run` skill (`Skill` with `run`) — it finds this project's own launch path before falling back to generic patterns.

Capture the screens that matter, **at most 4 captures** — half the announced ceiling of 8, because the other half is reserved for Pass 4 and spending it here would leave the directions unrendered. Allocate those four deliberately: the highest-traffic screen first, then the densest one, then one that is mostly empty. Both themes if the app has them, one mobile width if it is responsive. Spend the budget on different *screens* before spending it on different *widths* — a second viewport of the same screen tells you less than a first look at another.

Then **look at each capture and write what you see**, per screen: what the eye lands on first, what competes with it, what is unreadable, where the rhythm breaks. This is the part a static read cannot produce and the part the brief is actually worth reading for.

If the app cannot be launched — it needs credentials, a seeded database, a device, a running backend you don't have — **stop and ask the user for access or for screenshots.** That is not a question the repo can answer, and an audit that skips this pass is the code review this command refuses to be. Say plainly which screens you still need. If they hand you screenshots instead of access, that is fine: read those.

## Pass 3 — The outside read

"Ultra modern, 2026 techniques" is not in your head reliably — left unchecked you will produce your own habits, dated, presented as the state of the art. So name the two or three questions where the answer is genuinely load-bearing for this product — the layout pattern for this class of app, what the framework's current major version made idiomatic, the accessibility criteria that became table stakes — and go find out.

### Whose question is it

<!-- ask-altitude:start -->
**An answer lives in one of three places, and only one of them is the user.** The repo is the first: anything reachable by reading, running or reasoning is yours to settle. The **outside** is the second, and it is the one that gets skipped — what a library's maintainers now recommend, which of two patterns the ecosystem settled on, how a product you would hold up as well-built does this today. That answer is not in the user's head either; it is one search away, and your training has a cutoff the ecosystem does not.

So before a question reaches the user, name which kind it is:

- **Settled, or research** — anything the mandate, the code, the approved plan or an Active decision answers, and any engineering or UI detail inside the accepted goals and budget: a library, test tooling, a version pin, file layout, naming, an internal representation, a screen adjustment. **Never theirs**, however open it is, and an option set does not make it theirs. Decide it, and record it in `docs/DECISIONS.md`.
- **Theirs** — only when a preference or authorization **not yet recorded** would change the product outcome, the scope, a major architecture commitment, a stated constraint, or a consequential cost or risk — and the ask names which, and exactly what is missing. Several viable options, uncertainty, the absence of an authorizing decision, or the words UX or architecture are not enough: decide it and record it. **A failure, a red check or missing evidence is a diagnosis to report or investigate, never a choice between causes.** A record removes the ask only when it names the authority it rests on and that authority covers this change; an entry naming no basis is context, never an authorization.

  **A stated constraint is arbitrated before it is theirs.** Run `esq standards`: where the resolved referent names the constraint's class and its threshold covers the overrun in hand, decide it, record the constraint, the observed value, the clause decided under and `Fondement: mandate — <the clause>`, and keep working. Where the referent is silent, where the overrun exceeds the threshold, where the class is never arbitrable, or where the line carries `(hard)`, the constraint is theirs. A referent that does not resolve is silence: the ask stands, and says the standard could not be read.

**Look outside before you decide.** For a load-bearing choice — a dependency entering the project, a pattern the codebase will repeat, a data or trust-boundary shape — fetch `ToolSearch "select:WebSearch,WebFetch"` and check current practice: official docs first, then how a well-engineered product in this space does it. **At most 3 searches per decision, and only for the load-bearing ones.** Skip it when `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` or the existing code already settle it, and never re-research what a brief you are consuming already cited. Record what you found in one line beside the decision, with its date. If the tools are unavailable, say so where you record the decision and pick on the evidence you have; never convert it back into a question for the user.
<!-- ask-altitude:end -->

Every claim about current practice carries its source and its date in the brief, in one line. A recommendation with no referent is a preference, and the reader has to be able to tell the two apart.

## Pass 4 — Render the directions

Describe nothing you can render. Build **exactly 2 directions**, on **exactly 1 screen** — the highest-traffic one from pass 2 — as standalone HTML in the scratchpad directory. In `--greenfield` that one screen is the one the content source names rather than the busiest, and its content comes from that source; see `## Greenfield mode`.

The two must differ in a way the user can *choose between*: not "blue vs. teal", but two different answers to the question the audit raised. Conservative-and-systematic against a genuine departure, if that's the tension; density against calm, if that's it. Name the tension in one sentence before you build, so the reader knows what they are picking.

Each direction:

- Uses the real content from the capture — the same labels, the same data shape, the same number of rows. A direction rendered with lorem ipsum is a direction that hides how it handles the real thing.
- Ships both themes, light and dark, if the app has them — in `--greenfield` there is no app to have them, so both themes ship unconditionally; see `## Greenfield mode`.
- Declares its tokens explicitly at the top (colors, spacing scale, type scale, radii) — those become the plan's raw material.
- **Passes a computed contrast check.** Run the ratios; a direction that fails WCAG AA on body text is not a direction, it's a draft. Fix it before showing it.

Then **render each one and look at it**, the same way as pass 2 — on Pass 4's own reserved share of **at most 4 captures**, one per direction per theme (2 directions × 2 themes, or 2 captures when the app has a single theme). That share is reserved rather than drawn from what Pass 2 left, so a Pass 2 that spent its full allowance never starves this step. Screenshot the file through the browser tooling pass 2 already set up — except in `--greenfield`, where pass 2 never ran and Pass 4 sets up its own driver instead; see `## Greenfield mode`. If no browser driver is available, say so explicitly in the brief and in the report — an unrendered direction is a guess, and the user needs to know which they're being handed.

## Publish the artifact

Load the `artifact-design` skill first, then build one page and publish it with the `Artifact` tool. In `--greenfield` that skill is already in hand — Pass 4 loaded it before it rendered anything, so it is not loaded a second time here — and the page has no **Today** section, pass 2 never ran, so it opens on the tension and the comparison starts at Direction A; see `## Greenfield mode`. Its job is comparison, in this order:

1. **Today** — the captures from pass 2, with your one-line reading under each.
2. **The tension** — the sentence naming what the two directions disagree about.
3. **Direction A / Direction B**, side by side on the same screen, both themes, with their token sets and computed contrast ratios shown as numbers.
4. **What is broken regardless of direction** — the findings from pass 1 that either direction inherits.

Embed captures as `data:` URIs; downscale them so the page stays under 16 MB. If the budget is tight, drop *captures*, never findings.

The page is private on publish. Record its URL — it goes in the brief.

## Write the brief and commit it — before you ask anything

**Order is load-bearing.** Everything the audit found is settled no matter which direction the user picks, so it gets written and committed first. Holding it until after the answer would gate paid work on a confirmation, and a user who walks away at the question would lose all of it.

Write the brief in the standard brief shape — `/esq:plan` already consumes this structure, and it must not learn a second one. In `--greenfield`, when the source was a grill brief you enrich *that* brief in place instead of writing a new one, and `## Constraints & context` carries the no-live-read line; see `## Greenfield mode`:

```
# Brief: <Title in plain English, not a slug>

## Task
One tight paragraph: what this redesign is, on which screens, ending in what the user
will see that they don't today. Written as if the direction were already chosen — you
update this sentence after the pick.

## In scope
- The screens the redesign touches, named.
- The system work it implies (token consolidation, component extraction) — but only what
  the chosen direction actually needs.

## Out of scope
- Screens deliberately left alone, and why.
- Findings from the audit that are real but belong in the backlog, not this work.

## Resolved decisions
- Direction: <A or B> — <the one-line reason, filled in after the pick>
- <Each thing the audit settled: the token set, the type scale, the breakpoint, the
  a11y floor> — <rationale, with source and date when it came from outside the repo>

## Constraints & context
The audit itself, and it is the section this brief exists for:
- **Visual evidence:** <artifact URL> — captures of today, both directions side by side.
- **What the interface is made of today:** the counted findings from pass 1.
- **What the app looks like today:** the per-screen reading from pass 2.
- **What the stack allows:** the styling layer, the component library, what a direction
  cannot ask for without becoming a different project.
- **Current practice, checked:** each claim with its source and date.

## User-facing flow
The redesigned screen, step by step, including empty / loading / error. This is what the
plan turns into `(manual)` verification, so keep it observable.

## Done looks like
What a person could confirm on screen. For a redesign this is unusually concrete — name
the screens, the states, and the contrast floor as conditions someone can check.

## Deferred to planning
Phasing, migration order, whether the token consolidation lands before or with the first
screen. The planner's, deliberately.

## For /esq:plan
<!-- This brief is the scoped input for /esq:plan. Run /esq:plan in a fresh session; it
will detect and consume this brief. Do not edit below this line. -->
```

The `<!-- comment -->` is required — it marks the file as a consumable brief.

Then: `git add docs/plans/<filename>` (only that file) and `git commit -m "brief: <slug>"`.

## Propose the leftovers into the backlog

Findings from pass 1 that are real but sit outside the redesign — a missing empty state on a screen nobody is touching, an unlabelled input in an old form — belong in `docs/BACKLOG.md`, not buried in a brief about something else. Propose them the way the rest of esquisse does: list them to the user with the one line each would carry, and offer `/esq:backlog` to capture the ones they want. Do not write the backlog yourself here.

## Then ask for the direction

Now, and only now, put the choice to the user with `AskUserQuestion`.

- The two options are the two directions you rendered, each labelled with the tension it resolves, each described in one line. **Lead with the one you'd pick**, marked `(Recommended)`, with the reason drawn from the audit — not from taste.
- Point them at the artifact URL in the question itself. Choosing between two directions from prose defeats the whole pass.

<!-- shared:escape-hatch:start -->
**Always leave a way to answer in their own words.** Make the last option on every question an explicit free-text escape — label it `✍️ Something else — I'll explain`, with a description saying you'll ask for the details. If they pick it, collect their wording with a short plain-text follow-up before continuing; every *other* answer in the same batch still stands. Don't rely on the harness's built-in "Other" row — it doesn't render in every client.
<!-- shared:escape-hatch:end -->

One round. This is one decision, and it is squarely theirs: what the product should look like is not something the repo or the ecosystem can answer.

**If the session ends before they pick, nothing is lost and nothing needs re-running** — the brief and the published page already hold both directions with their evidence, and the pick is one line in `## Resolved decisions`, editable by hand or settled in a one-sentence follow-up. Say this when you ask. Never re-run this command to collect the answer.

When the answer comes back, edit the brief — `## Task`, `## In scope`, and the `Direction:` line in `## Resolved decisions` — and commit it as `brief: <slug> — direction <A|B>`.

## Report and stop

Tell the user, in this order:

1. Whether the audit ran complete or a pass was cut short, and which.
2. The direction they picked, and the brief path.
3. The artifact URL.
4. What still needs them: leftover findings worth a backlog entry, screens you could not reach.
5. Elapsed time, and what it spent — captures taken, searches run, directions rendered.
6. Next step: "Review the brief in your editor. When ready, `/clear` and run `/esq:plan` — it will pick up this brief automatically."

Then stop. Do not plan, do not write code, do not touch a stylesheet.

## Constraints

- Do NOT make code changes. You write one brief and publish one page; the app's source is read-only here.
- Do NOT write a plan — no phases, no approaches. That's `/esq:plan`'s job.
- Do NOT spawn subagents. This command does its own reading, and a fleet of specialists would each re-derive the same audit from scratch.
- Do NOT claim a visual finding you did not observe — see the failure mode at the top. No capture and no rendered direction means you say so, in the brief and in the report.
- Do NOT build a design system here — no token files, no component library, nothing pushed to a design-system project. A system gets built after a direction is chosen and planned, or you pay to construct one you may throw away.
- One brief file. If a git repo isn't initialized, write the brief but skip the commits; tell the user.
- Leave the `<!-- comment -->` marker in the brief intact.
