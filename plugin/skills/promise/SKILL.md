---
description: Check that what the product promises (the marketing site, pricing, onboarding, the spec) works in the running app; or sweep it for UX nonsense; or write and improve a site's page copy from what was proven.
name: promise
argument-hint: "[target] [--sense | --copy] [--all]"
disable-model-invocation: true
model: opus
allowed-tools: Bash(esq *)
effort: high
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You hold the product to its word, by driving it. A promise is anything the product tells a person they can do or will get: a landing-page headline, a pricing row, a feature list, an onboarding tooltip, a feature in `docs/SPEC.md`. One command, three modes:

- **Bare: the promise audit.** Collect the promises, walk each one in the running app as the person it was made to would, and give each a verdict with its evidence. A promise that does not hold becomes a backlog row.
- **`--sense`: the nonsense sweep.** Walk the screens and catch what makes no sense to the person using it: a button that does nothing, a count that disagrees with its list, "Cancel" that saves, a field asked for and never used.
- **`--copy`: the copy writer.** Write or improve the text of a site's pages, page by page, claiming only what the audit proved. The proposal goes on a before/after page. What the user approves is written into the source and committed.

**The failure mode this command exists to avoid: a verdict nobody observed.** Reading the code that implements "export to CSV" and calling the promise kept is a code review, not an audit. A promise is kept when you did what it says, in the app, and saw the result. Every verdict names the steps you took and what answered them. A claim you could not walk is marked unverifiable, with what would verify it, and never upgraded.

**This is not `/esq:ui` and not `/esq:review`.** `/esq:ui` renders a direction for how the product should look and flow. `/esq:review` judges a diff. This command judges the product as it stands against what it says about itself, and its findings are defects with evidence, filed where the work queue reads them.

## Announce, before anything

**Announce in one line, then keep working in the same response.** Print the line for the resolved mode before any tool call, with nothing of your own above it, and never end your response on it:

> `/esq:promise — auditing promises. Bound: no subagents, at most 25 promises walked, at most 6 captures, no web search.`
> `/esq:promise --sense — sweeping for UX nonsense. Bound: no subagents, at most 12 screens, at most 6 captures, no web search.`
> `/esq:promise --copy — writing page copy. Bound: no subagents, at most 5 pages, at most 4 captures, at most 4 web searches.`

If a pass would exceed it, stop at the bound and name what you did not cover, with the invocation that covers it. The resolved target lands in a second line at the end of preflight.

## Preflight

1. Read `CLAUDE.md` and `docs/ARCHITECTURE.md` if present: they say how the app launches, where its pages and copy live (components, MDX, CMS exports, i18n files), and which locales ship. Read `docs/SPEC.md` if present. Read `docs/PROMISES.md` if present: it is this command's register (see `## The register`). These reads go out together in one turn.
2. Note today's date (YYYY-MM-DD) and `git rev-parse --short HEAD`.
3. **Resolve the mode and the target.** `--sense` or `--copy` anywhere in the arguments sets the mode, and the remaining positional is the target. Never infer a mode. A target narrows the run:
   - a page (a route, a file, or a URL of the marketing site): the promises made on that page, the screens reached from it, or the copy of that page;
   - a feature name: the promises about it, wherever they are made;
   - `--copy docs/copy/<file>.md`: an earlier copy proposal, applied without regenerating it (see `## --copy: apply`);
   - nothing: the whole product, cut to the bound in the order below.
4. `--all` (bare mode only) re-proves kept promises too. Without it a re-run walks only what is not already proven (see `## The register`).
5. Fetch the tools you need: `ToolSearch "select:AskUserQuestion"`, and `WebSearch,WebFetch` in `--copy`. If one is unavailable, say so where it matters and continue.
6. **Announce the resolved target** in a second line: the mode, the sources or screens or pages you will cover, and what the bound leaves for a next run. For example, `Promises from: site/index, site/pricing, onboarding, SPEC — 31 found, 25 walked this run (hero and pricing first); next: /esq:promise "integrations"`. This is the free moment to be redirected.
7. Note the start time. You report elapsed at the end.

## Driving the app

Every mode drives the app. Invoke the `run` skill (`Skill` with `run`) when it is listed: it finds the project's own launch path. Otherwise use the project's launch skill or documented start command, and whatever browser tooling the session has. A marketing site served apart from the app is driven the same way, from the repo or from its URL.

**Never write to production.** Walk a local or staging instance with test data. When the only instance is a production URL, take only steps that change nothing: no submit that creates an account, pays, sends a message or deletes. A promise that needs such a step is unverifiable here, and its evidence line says it needs a staging instance or a test account.

If the app cannot be launched (credentials, a seeded database, a backend you do not have), **stop and ask the user for access or a test account**, naming the promises or screens still waiting on it. That answer is in their hands, not the repo's. Do not fall back to reading the code and calling it verified.

A walk is driver reads, not captures: a URL, a DOM value, a network status, a computed style, the text of a message. Each returns a value and costs no image. Spend a capture only where the evidence is visual (a layout that breaks, an overlap, a screen that renders blank) and the read alone would not show it.

## The register

`docs/PROMISES.md` is this command's ledger, written by `/esq:promise` alone. One row per promise, keyed by a slug you choose once and never rename:

```
# Promises
<!-- Written by /esq:promise. One row per promise; evidence detail below the table. -->

| Promise | Claim | Made in | Verdict | Evidence | Checked | Backlog |
|---|---|---|---|---|---|---|
| P-csv-export | "Export your data to CSV in one click" | site/pricing.mdx:42 · app onboarding step 3 | 🔴 broken | Export → 500 on /api/export | 2026-10-10 @abc1234 | B-312 |
```

- **Claim** is the promise's wording, verbatim from its most visible place. **Made in** lists every place it is made: one promise said on three pages is one row with three places.
- **Verdict** is one of a closed set:
  - ✅ kept: you did what it says and saw the result;
  - 🟡 partial: it holds only under a condition the claim does not state (desktop only, the paid plan only, up to a limit, after a manual step);
  - 🔴 broken: the path exists and fails;
  - ⚫ absent: nothing in the product does it;
  - ❔ unverifiable here: walking it needs what this run cannot have (a payment, a third party, a scale or legal claim). The evidence names what would verify it.
  - 〰 not testable: the claim states nothing a person could check ("the best", "powerful", "seamless"). This is a copy finding, not a defect, and `--copy` rewrites it.
- **Evidence** is one line: the steps and the read. A longer walk goes in a `## P-<slug>` section below the table.
- **Checked** is the date and the commit the verdict was observed on.
- **Backlog** is the row a non-kept verdict filed, or blank.

**A re-run never re-pays for proof it holds.** Without `--all`, a run walks the promises the sources now make that the register does not hold, every promise whose verdict is not ✅, and every promise whose claim text changed. A ✅ row stays as proven at its commit. The report says how old the oldest kept proof is ("18 kept, oldest proven at abc1234, 63 commits ago; `--all` re-proves them") and leaves the choice to the user. A promise the sources no longer make keeps its row, with its verdict replaced by `retired <date>`.

## Bare: the promise audit

### Collect the promises

Read every place the product makes a promise, in order of how many people read it:

1. **The marketing site.** The landing page, feature pages, pricing, FAQ and comparison pages: in the repo (pages, MDX, CMS exports) or at a URL the target names.
2. **The app's own words.** Onboarding, empty states that say what you can do, upgrade prompts, tooltips, transactional email templates.
3. **The store and package listings** when the repo carries them (app-store text, a package README that is the product's front page).
4. **`docs/SPEC.md`.** Each feature and business rule is a promise the team made to itself; it ranks last because no customer reads it, yet a spec feature the app lacks is still ⚫.

For each promise, write its **testable form** before you walk it: who, starting from where, does what, and observes what. "Invite your team in seconds" becomes: an account owner opens settings, invites an email, and the invitee receives a link that joins the workspace. A claim with no testable form is 〰 and is not walked.

Then rank: claims on the landing page and pricing first, then feature pages, then in-app, then the spec. The first 25 not already proven are walked this run. The rest are named in the report with the invocation that covers them.

### Walk each promise

Walk the testable form as its person would, from a fresh state when the promise is about a first experience (a new account, an empty workspace). Record each step and the read that answers it. Then set the verdict:

- A claim with a number ("in under a second", "up to 10 projects", "works offline") is measured where the driver can measure it: a timing from the Performance API, the limit reached by doing it, the network set offline. A number you could not measure is ❔, never assumed.
- A claim about a device or width ("works on mobile") is walked at that width, ~390 px.
- A security, privacy, compliance or uptime claim is ❔ here unless a read observes it directly (a header, a cookie flag, a redirect to HTTPS). Never assert compliance.
- A claim that holds through a path the claim does not describe (the export works, but only from an admin page three menus deep while the site says "one click") is 🟡, with the condition named.

**The other direction too.** While walking, note what the product does well that no page promises: a shipped feature nobody sells. It is not a defect and files nothing. It is material for `--copy`, listed in the register's notes and in the report.

### File what does not hold

For each 🔴, ⚫ and 🟡 verdict without an open backlog row, add one. Check the backlog for `promise: P-<slug>` in a `Source` cell first, so a re-run never files the same promise twice.

<!-- id-allocation:start -->
**Allocate IDs through the CLI:** `esq backlog add` writes a row; `esq backlog reserve-id` supplies an ID when this command writes the row. The CLI uses this worktree's reserved block, reserves one under the shared lock when needed, and never borrows main's `1-999` for a linked worktree.

Report a refusal and its recovery action; never calculate an ID from the ledger or bypass block limits. IDs are permanent: never renumber or reuse them.
<!-- id-allocation:end -->

`esq backlog add --type "🐛 bug" --summary "<summary>" --source "promise: P-<slug>" --pri "<level>" --status Open`

- **Summary**, ≤ ~12 words: `Broken promise: <claim, shortened>`, `Partial promise: <claim> — <condition>`, or `Promised, absent: <claim>`.
- **Priority** is suggested, never confirmed: `hi?` for a claim on the landing page or pricing that is broken or absent (the product sells what fails), `med?` for one made elsewhere and for a partial one, `lo?` for a spec-only gap.
- Add a `## B-NNN` detail section with the claim, every place it is made, the walk and the read. For a ⚫ or 🟡 verdict, name both remedies (make the product do it, or change the words) without picking: which one is the product owner's call, and `/esq:work` routes it.

Write the register, then commit the register and the backlog together, once: `git add docs/PROMISES.md docs/BACKLOG.md && git commit -m "promise: audit <target or 'all'> — <n> kept, <n> not"`.

## --sense: the nonsense sweep

Walk the screens and look for what makes no sense to the person using them. It is the product contradicting itself, not a matter of taste. Cover the target's screens, or with no target, the screens the most-used journeys pass through, at most 12. On each screen, act like its person: open every menu, press every control that changes nothing permanent, submit with good and with bad input, go back, reload.

Every finding is one of these classes, observed by a read:

- **Dead control.** A clickable that changes nothing: no navigation, no request, no state change between the read before and the read after.
- **Disabled with no reason.** A disabled control and nothing on screen saying why or how to enable it.
- **Numbers that disagree.** A badge or count against the length of its list, a total against the sum of its rows, "3 results" over two.
- **Words that lie.** A label that does something else: "Delete" that archives, "Cancel" that saves, "Next" on the last step, "Free" that ends on a payment wall.
- **Impossible state.** An empty state shown over data, "no results" while still loading, success and error at once, an end date before its start accepted, a negative quantity accepted.
- **Asked, never used.** A required field whose value appears nowhere afterwards, or the same information asked twice.
- **Out of order.** A step that needs what only a later step provides, or a confirmation before the choice it confirms.
- **Dead end.** A screen with no way forward or back except the browser's.
- **One name, two things, or two names, one thing.** The same word for two objects, or two controls doing the same thing under different labels.
- **Work lost.** Back, reload or an error that clears typed input without a warning.
- **Unguarded destruction.** A delete or overwrite with neither a confirmation nor an undo.
- **No answer.** An action whose result nothing on screen shows.
- **Leaked internals.** `undefined`, `NaN`, `[object Object]`, a raw i18n key, lorem ipsum, a stack trace, or two languages mixed on one screen.
- **Copy against copy.** Two screens stating different limits, prices or rules for the same thing.

Each finding names the screen, the step, the read and, in one line, why a person would be lost or misled. Severity follows the harm: lost work, unguarded destruction and words that lie about money or data are `hi?`; a misleading contradiction is `med?`; leaked internals and cosmetic disagreement are `lo?`.

File each finding with `esq backlog add` (the id-allocation rule above holds) with `--type "🐛 bug"`, `--source "promise --sense: <screen>"` and a detail section carrying the evidence, after checking the backlog for the same screen and class so a re-run never files twice. A screen beyond the 12 is named in the report with the invocation that covers it. Commit once: `git add docs/BACKLOG.md && git commit -m "promise: sense sweep <target or 'all'> — <n> findings"`.

## --copy: the copy writer

Write the text of a site's pages, or improve it, at most 5 pages per run (the target page, or the most visited ones first: landing, pricing, then feature pages). A page with no copy yet (placeholders, a new route) is written from scratch. A page with copy is improved.

**Copy claims only what was proven.** Read `docs/PROMISES.md` first. Every promise a page makes (old or new) must have a register row:

- ✅ is claimed as proven;
- 🟡 is claimed with its condition stated;
- 🔴 and ⚫ are not claimed. The new copy drops them, and the page lists each dropped claim with its backlog row. Announcing one as "coming soon" is a product commitment, so it is the user's call, offered as an option and never written by default;
- 〰 is rewritten into a concrete claim the product keeps, or dropped;
- a claim with no row, or with a ❔ row, is walked first the way the bare mode walks it, within this run's bound. One you could not prove stays out of the copy and is listed.

The shipped features nobody sells (from the register's notes) are material: a page may claim them once they are ✅.

**What an improvement is**, page by page:

- The headline says what the product does, for whom, in the reader's words. The sub-line says how. One primary action per page, and its label says what happens next.
- Every benefit rests on a ✅ promise, and the page cites the row beside the claim on the proposal.
- The page uses the app's own names for things: the label on the button the copy describes, the object names the app shows. Use the `--sense` vocabulary, never a third word for the same thing.
- The voice is the product's. Read the existing copy and any brand or voice guide in the repo (`docs/BRAND.md`, a style guide, `CLAUDE.md`), and keep the language and register. An improvement is clearer and more concrete, never in a different voice.
- The page carries its basics: one `h1`, a `<title>` and a meta description that say the same thing as the headline, alt text on every image that carries meaning. Check current practice for page structure and metadata with at most 4 web searches, each cited with its source and date on the proposal.
- Every locale the page ships gets its version, written in that language rather than translated word for word.
- The copy fits its slot. Render the page with the new copy and read, at ~390 px and at desktop width, that no text overflows its container, that no line of a headline wraps to a single word, and that `scrollWidth` does not exceed `clientWidth`. Copy that breaks its layout is shortened, never shipped with the break.

**The proposal.** Write `docs/copy/<YYYY-MM-DD>-<slug>.md` (never under `docs/plans/`, where every Markdown file that is not a brief or a log is read as a plan). Per page, it holds the source file and each text slot (title, meta description, headline, sub-line, each section, each action label, alt text), with its current text, the proposed text, one line on why, and the register row each claim rests on. It ends with the dropped claims and their backlog rows. This file is what the apply step reads, so an approval later never regenerates anything. Build one before/after page from it: per page, the current render and the proposed render, captured (4 captures at most, landing first), with the slots side by side. Publish it with the `Artifact` tool when the session has it; otherwise write it as `docs/copy/<YYYY-MM-DD>-<slug>.html`. Create `docs/copy/` when missing, then commit the proposal (and the local page) once: `git add docs/copy/<YYYY-MM-DD>-<slug>.* && git commit -m "copy: proposal <slug>"`.

**Then ask, once.** With `AskUserQuestion`, one question per page (four at most in one call, the rest in a second), pointing at the before/after page:

- `Apply all (Recommended)`;
- `Apply all but the slots I name`;
- `Leave this page`;
- `✍️ Something else — I'll explain`, whose wording you collect with a short follow-up.

A claim marked "coming soon" is offered as a separate option on its page, never folded into "apply all". Where the tool is unavailable, end on the page and the proposal path. The pick is applied later by `/esq:promise --copy <proposal>`, without regeneration.

## --copy: apply

Apply what the user approved, from the proposal file, and nothing it does not hold:

1. Edit the source of each approved slot (the component, the MDX, the i18n file) for every locale the proposal carries. Copy changes nothing but text: if a slot cannot change without touching logic or layout, leave it and name it.
2. Verify: the project's own build or typecheck and lint, then render each changed page and repeat the fit reads above. Also read that no raw i18n key or empty slot appears. If a check fails and the fix is not a trivial correction of your own edit, commit nothing for that page: leave its diff, show the failure, and continue with the next page.
3. Commit one page per commit, text only: `copy: <page> — <one-line summary>`. Mark the applied pages in the proposal file and commit that once, at the end: `git add docs/copy/<file>.md && git commit -m "copy: applied <slug>"`.

## Report and stop

Lead with the headline, then what needs the user, then the next action:

1. The headline. Bare: `<n> promises walked — <n> ✅ · <n> 🟡 · <n> 🔴 · <n> ⚫ · <n> ❔ · <n> 〰`. `--sense`: `<n> screens swept, <n> findings`. `--copy`: `<n> pages proposed, <n> applied`. Say whether the run was complete or which bound cut it.
2. What needs the user: the 🔴 and ⚫ on the landing page and pricing, by name with their rows (the product is selling them now); the remedies they choose between; screens or promises waiting on access; the age of the oldest kept proof.
3. Every backlog row filed, one line each. The register path, the proposal and before/after page when there is one.
4. What the bound left, each with its invocation.
5. Elapsed time and what it spent: promises walked, screens swept, pages written, captures taken, searches run.
6. Next step. With broken promises filed: `/esq:work <the highest one>`. After a sense sweep: the same. After a proposal: open the before/after page and answer. After an apply: review the copy commits with `/esq:review <first>..<last>`.

Then stop.

## Constraints

- Bare and `--sense` change no code: they write `docs/PROMISES.md` and backlog rows, nothing else. Only `--copy`'s apply step edits the source, and only text slots the user approved.
- Never write to a production instance (see `## Driving the app`).
- Never call a promise kept, or a screen clean, without having walked it. No walk means ❔ or unswept, stated.
- Do NOT spawn subagents. One walk, shared by every promise it passes through.
- Do NOT pick between "build it" and "change the words" for a promise that does not hold. Name both, file the row, and let `/esq:work` route it.
- Git mutations are never issued side by side.
