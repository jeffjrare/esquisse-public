---
description: Generate grounded ideas for the product — new end-user features first, then adjustments to what exists, content, and container (architecture, structure, surfaces) — ranked by user value; you pick which to capture.
name: ideas
argument-hint: "[focus] [features|adjust|content|container] | capture <n,…>"
disable-model-invocation: true
model: opus
allowed-tools: Bash(esq *)
effort: high
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You generate ideas for this product, read from what it already is. The user is out of ideas, or wants a fresh look; your job is a short slate of ideas worth their attention, each grounded in something you observed, each saying who gets what. Then the user picks, and what they pick lands in the backlog. **What a person using the product would value leads every list, and every order.**

Four axes, in this order of weight:

- **Features: create.** A new thing an end user can do or get that the product does not offer today. The heaviest axis.
- **Adjustments: improve.** A change to a feature that exists: a step removed, a default changed, a rule relaxed, a state handled (empty, error, loading, first use), a flow joined to the one people take next.
- **Content: what the product carries.** The words, data, examples, templates, onboarding, help, notifications, the defaults a new user starts from. A product is often one good template or one clear sentence away from being understood.
- **Container: how it is shaped.** Architecture, structure, navigation, information architecture, packaging, the surfaces it lives on (mobile, API, export, integration, CLI). A container idea earns its place only by naming the user value it unlocks: "split the module" is not an idea, "offline mode, which this split makes possible" is.

**The failure mode this command exists to avoid: generic ideas.** "Add dark mode", "add AI", "improve onboarding", "add analytics" could be said of any product without reading it. Every idea here names the observation it comes from (a screen, a route, a rule in the spec, a dead end in a flow, a pattern in the backlog, a TODO, a hot spot in the history) and would not make sense for another product. An idea you cannot ground is cut, never padded in.

**This is not `/esq:grill`, `/esq:ui` or `/esq:promise`.** `/esq:grill` sharpens one idea the user already has. `/esq:ui` renders how a screen should look. `/esq:promise` checks what the product already claims. This command proposes what the product could become, and hands the chosen ideas to the queue; each idea names the command that takes it further.

## Announce, before anything

**Announce in one line, then keep working in the same response.** Print the line for the resolved mode before any tool call, with nothing of your own above it, and never end your response on it:

> `/esq:ideas — generating ideas. Bound: no subagents, at most 20 ideas, one round of 4 questions, at most 3 web searches, no code written.`
> `/esq:ideas capture — capturing picked ideas. Bound: no subagents, no generation, one backlog commit.`

If a pass would exceed it, stop at the bound and name what you did not cover. The resolved target lands in a second line at the end of preflight.

## CLI

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

The CLI owns backlog IDs, ranks and statuses (`esq backlog add`). You own every judgment: which ideas, their axis, their value, their order, their wording.

## Preflight

1. **Resolve the mode.** First token `capture` → **capture mode** (`## Capture`); the rest is the idea numbers (`1,4,7`, `1-3`, or `all`) and, optionally, a slate path. Anything else → **generate mode**: an axis word anywhere in the arguments narrows to that axis (`features`/`feature`/`fonctionnalités`, `adjust`/`ajustements`, `content`/`contenu`, `container`/`contenant`/`archi`); the remaining text is the **focus**: a feature, a screen, a persona, a market, a problem ("people drop at signup"). No focus means the whole product.
2. In one turn, read together: `esq projection outline spec` and `esq projection outline arch`, and `docs/DECISIONS.md` (its table and the Active `prod`/`func`/`ux` entries only) if present; `esq state --rows` (an answer that spilled names its file and `ranges`: read those in one batch, never re-run it); `git rev-parse --git-dir` with `git rev-parse --short HEAD` and today's date; and the `💡`/`✨` and `Dropped` rows of `docs/BACKLOG.md` (a `grep`, never the whole file). Read each once. `CLAUDE.md` is in context already (Claude Code loads it), so it is not opened again.

   **The outlines are the feature and component map.** In the next turn, one `esq projection read <spec|arch> <id…>` per projection: the overview plus the sections the focus needs; no focus → the overview alone, the outline's headings and leads standing in for the feature list.

   <!-- shared:projection-read:start -->
   **Projections are read by section, never whole.** `esq projection outline <spec|arch>` answers the heading tree (`id`, `heading`, `from`/`to`, subtree `bytes`, a one-line `lead`) and the projection's `freshness`; `esq projection read <spec|arch> <id…>` answers only those sections, history comments stripped. Read the overview (id 0 and `Vue d'ensemble`) and any shared-rules section alongside the feature, and pick a large parent's children by their `bytes`. An answer that spilled names `spill.file` and `spill.ranges`: Read those in one batch, never re-run it. An unknown id refuses: re-run the outline, never fall back to a whole-file Read. `exists: false` means there is no such projection.
   <!-- shared:projection-read:end -->
3. Fetch `AskUserQuestion` (`ToolSearch "select:AskUserQuestion"`), and `WebSearch` only when the focus names a market, a competitor or a category to compare against. If one is unavailable, continue without it and say where it mattered.
4. **Announce the resolved target** in a second line: the focus, the axes, and what you will read. For example, `Focus: invoicing — all four axes; reading SPEC (14 features), routes under app/invoices, 6 open backlog rows, history since 2026-07.` This is the free moment to be redirected.
5. Note the start time. You report elapsed at the end.

## Mine for signals

A signal is something observed that an idea can answer. Read for them proportionally, following the focus, never the whole codebase:

- **What users do today:** `docs/SPEC.md`'s features and rules (the outline, and the sections you read), else the entry points (routes, pages, commands, endpoints) and the domain entities. A feature that stops one step short of the job a person is doing is the richest signal there is: what do they do next, and where do they have to leave the product to do it?
- **Where it hurts:** unhandled empty, error and loading states; a rule that refuses without saying what to do instead; a manual step the product could take; a value the user types that the product already knows; TODO/FIXME/HACK comments on a user path.
- **What the backlog keeps asking:** several open rows circling one theme are one missing feature, not several bugs. `Source` cells naming `review:`, `promise:` or `observed:` are users' and reviewers' evidence.
- **Where the work goes:** `git log --since` over the focus (one call, `--stat` or `--name-only`, bounded to the last 3 months or 200 commits): the files that churn are where the product is still being figured out.
- **What is already decided:** an Active decision rejecting an idea, or a `Dropped` backlog row, removes it unless you observed something new since; then the idea says so (`re-opens D-<slug>` / `re-opens B-NNN`, and what changed).
- **The market, only when the focus asks:** at most 3 web searches, for what comparable products offer that this one does not. A competitor's feature is a signal, never an idea by itself: it becomes one only when you can say why *these* users would want it.

## Generate, then cut

Generate wide first, privately: for each axis, more candidates than you will keep, from different angles (the new user, the daily user, the admin, the buyer; the first minute, the hundredth use; what is slow, what is missing, what is confusing). Then cut to the slate:

1. **Grounded:** names its signal with a path, a route, a spec section or an ID. Otherwise cut.
2. **New:** not an open backlog row, not on the roadmap, not in a pending plan or brief (an idea that sharpens one cites it and says what it adds), not an Active decision's rejected option, not `Dropped` without new evidence.
3. **Valuable:** you can say in one sentence who gets what, in the user's terms. "Faster", "cleaner", "more scalable" are not values until they name the person and the moment.
4. **Right-sized:** the smallest version that delivers the value. A large idea keeps its smallest valuable first slice in its own line. Trim generality, never design: a feature without its empty, error and first-use states is not smaller, it is worse.

**Order** each axis by value to the user and the business first; the cost estimate breaks ties and never leads. **At most 20 ideas** in all: up to 8 features, 5 adjustments, 4 content, 3 container, unless the user narrowed to one axis (then up to 10 on it). Fewer is fine, and an axis with no grounded idea says `nothing grounded for <focus>`; never fill a quota.

Each idea is written in the product's working language (French for a French product), in this shape:

```markdown
### <n>. <Title — what the user gets, not how it is built>
**Axis:** feature (create) | adjustment | content | container
**For:** <who> — <the moment they hit it>
**Value:** <one sentence: what they get, or what they stop losing>
**Signal:** <what you observed, with path / route / spec section / B-NNN / D-slug>
**Idea:** <2–4 sentences: what it does, observably; the smallest valuable slice first>
**Size:** S (a day or less) | M (a phase or two) | L (a plan, or several)
**Next:** <the one command that takes it further: `/esq:grill <idea>` for a feature or anything L; `/esq:work` for an S adjustment once captured; `/esq:ui <screen>` when the idea is how a screen should flow; `/esq:promise --copy <page>` for page copy>
```

## The slate

Write every kept idea, numbered across the axes in order (features first), to `<git-dir>/esq/ideas/<date>-<focus-slug or whole>.md`, with a one-line header naming the focus, the commit read and the date. The git dir, never the working tree: the slate is a proposal, and nothing in it is a ledger the repository should carry until the user picks. `## Capture` reads it back instead of regenerating, so a pick made later costs no second generation.

Present the slate in your reply, compact: per axis, one line per idea, `<n>. <Title> — <Value> · <Size>`, so the user can choose without opening the file.

## Pick

One `AskUserQuestion` call, up to 4 questions, **one per axis that has ideas**, in the axis order, each `multiSelect: true` with that axis's top ideas as options (at most 4 per question; the label is the title, the description is the value and size). Ideas beyond the top 4 of an axis stay in the slate and are reached by `capture <n>`; say so once in the question text. Do not add a "none" option: picking nothing is an answer.

This is the user's priority, and the one question this command asks. If `AskUserQuestion` is unavailable, or the user picks nothing or dismisses it, capture nothing: the slate is on disk, and `→ Next` names the exact `capture` command for the top idea.

## Capture

In capture mode, read the slate (the path given, else the newest file under `<git-dir>/esq/ideas/`). A missing slate or a number not in it stops before any write, naming what exists. In generate mode, capture what the user picked.

One `esq backlog add` per picked idea, in order, chained with `&&` in a single call (they write the same file, so never side by side):

`esq backlog add --type "<💡 idea for a feature, content or container idea; ✨ improvement for an adjustment>" --summary "<the title, ≤12 words>" --source "ideas: <slate file name> #<n>" --pri "<med? if a user sees or feels it, else lo?>" --status Open`

A pick is interest, not a priority: the level stays suggested (`?`), and `/esq:backlog B-NNN pri:hi` confirms one. Then, under the backlog's `---`, add one detail section per captured row: `## B-NNN — <title>`, with **What:** (the idea's slice), **Why it matters:** (For + Value), **Notes:** (the signal, the size and the next command). Run `esq validate`, then one commit for the whole capture: `git add docs/BACKLOG.md && git commit -m "backlog: capture <n> idea(s) from /esq:ideas (<focus>)"`.

Never write a plan, a brief, a decision or code here. The captured row is the hand-off; its `Next` is the route.

<!-- conclusion:start -->
**Your conclusion is three zones, in this order, and nothing else.** The reader wants two facts — did it work, and does it need me — before any detail.

**1 · The headline.** One line, first, no preamble above it:

> `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`

`✔` refresh complete, nothing needs the user · `⚠` partial or unresolved · `✖` you could not do your job. Drop `NEEDS YOU` when nothing does, and never soften the glyph: one open gate makes the whole run `⚠`.

**2 · What needs you.** Only what the user still has to settle — never a notice, and never work this command could do itself. One short ask per numbered line, action first, an executable one carrying its exact command in backticks. A genuine product choice takes the 🔴 option-set shape; a manual verification is copied verbatim with its starting state bracketed at the front. Absent whenever the headline is `✔`.

**3 · What happened.** One line per fact, never a sentence: glyph, label, value, evidence in its own column.

> ```
> ✔ fixed       6 items            a1b2c3d..e4f5a6b
> ○ still open  1 🟡               docs/plans/webhooks-fixes.brief.md
> ○ not run     spec · CLAUDE.md refresh
> ```

`✔` happened · `○` did not, by design · `✖` failed. **A fact with nothing to report collapses or disappears** — never a line reading `None.`, and several unremarkable no-ops become one `○ clean  <what you checked>`. But a no-op the reader would assume happened keeps its line — `○ not run  <what, and why>` — because silence there claims everything ran.

Then `→ Next`, last and alone: the first executable ask's exact command, or `pick an option in <n>, then <the command that resumes>`, or the one command that runs next.

**Nothing outside the three zones.** No preamble, no closing observations, no invented heading.
<!-- conclusion:end -->

## Conclude

**Headline:** `<glyph>  ideas — <n> ideas (<f> features · <a> adjustments · <c> content · <k> container) · <p> captured · <elapsed>`. `✔` when the slate is written and the pick answered (capturing nothing is an answer); `⚠` when the pick is still open, with `NEEDS YOU (1)`; `✖` when no idea survived the cut, with what you read and the focus that would find more.

**Zone 2:** only when the pick is still open: `Pick the ideas worth keeping`, with the exact `/esq:ideas capture <n,…>` for your top recommendation.

**Zone 3:** `✔ captured` with the IDs and the commit (its evidence column carrying the undo, `git revert <hash>`), `○ kept in slate` with the count and the slate path, `○ cut` with the count of candidates the cut removed and the most common reason (ungrounded, already in the backlog, decided against), `○ not run  web search` when the focus did not ask for one.

```
✔  ideas — 14 ideas (6 features · 4 adjustments · 2 content · 2 container) · 3 captured · 6m12s

  ✔ captured        B-214 · B-215 · B-216     c4d5e6f · undo: git revert c4d5e6f
  ○ kept in slate   11                        .git/esq/ideas/2026-10-12-invoicing.md
  ○ cut             9 candidates              5 already in the backlog · 4 ungrounded

→ Next: /esq:grill Recurring invoices — bill a client every month without re-entering anything
```

`→ Next` is the first captured feature's `Next` command, else the first captured idea's; with nothing captured, `/esq:ideas capture <n>` for your top idea. When three or more rows were captured, add the one alternative `→ Or: /esq:roadmap plan (place the <n> captured ideas)`.

## Constraints

- Always user-triggered; it never runs from another command.
- No subagents: one reader holds the product in mind, and a fleet would each re-derive it.
- No code, no plan, no brief, no decision. The only write to the repository is the backlog capture; the slate lives in the git dir.
- Never present an idea as decided, scheduled or promised. Never confirm a priority.
- An idea that needs the user's data, account or credentials to be judged is still an idea; say what it would need in **Notes**, and never stop to ask for it.
