# esquisse

*Esquisse* is French for the sketch before construction. It is a Claude Code
plugin that takes a feature from idea to merged code — **plan → build → review →
land** — with thoughtful design and a reviewable trail. Plans, backlog and decisions
live as Markdown in your repository, so a fresh session picks up where the last
one stopped.

## What it optimizes for

**The most shipped features you actually value.** Everything else is a constraint
on that, never a rival to it:

- **Value first.** A plan is written against what the feature is for, and review
  checks that this goal was delivered, not only that the code is sound. Every order
  esq proposes (the roadmap, a suggested priority, the next step) puts what you and
  your users get first; the rest follows common sense.
- **Cost is a requirement.** The whole workflow counts — model calls, context, tool
  round trips, subagents, elapsed time and repeated work — and stays proportionate
  to the value. Verification that still holds is reused; the same answer is never
  paid for twice.
- **It never blocks on what it can settle.** You decide product, architecture and
  design; intent, priority and tradeoffs on your constraints come to you. Anything
  it can find by reading, running or reasoning, it settles itself — and you are
  never its tester. A decision that is yours comes with options, consequences and a
  runnable next step.
- **Design is part of the feature.** Hierarchy, typography, interaction and
  feedback count as value. UI work is planned with its empty, loading, error and
  success states, and reviewed as part of the delivery. Right-sizing trims
  generality, never design.
- **Deterministic where it can be.** A dependency-free CLI owns structure, IDs and
  invariants; the model spends tokens only on judgment.

And two guarantees on how work gets done:

- **Every phase is verified, at the cost it earns.** Each plan phase has a
  deliverable and an explicit check matched to the failure it can catch — no audits
  of audits — and the result is recorded in the plan.
- **Nothing pushes.** Work lands with a local merge into the branch it started from.
  Publishing stays in your hands.

These are design commitments, not a claim of measured savings on every task.

## Install

You need Claude Code with plugin support, Node.js and Git. The plugin has no npm
dependencies.

In Claude Code:

```text
/plugin marketplace add jeffjrare/esquisse-public
/plugin install esq@esquisse
```

Restart Claude Code. The commands appear as `/esq:<name>`. To pick up a new
version later, run `/plugin marketplace update esquisse`, then restart.

Want to hack on esquisse itself? Clone the repository and see
[docs/MAINTAINING.md](docs/MAINTAINING.md).

## Your first feature

Run these in your project, clearing context between steps. Use the plan path that
`plan` reports:

```text
/esq:plan add CSV export to the invoices screen
/clear
/esq:build docs/plans/<date>-invoice-export.md
```

`plan` reads the codebase, writes a plan with verifiable phases and commits it on a
new branch. Before committing, it tries each check against the repository: test
commands are listed without being run, and every file a removal check would still
find is assigned to a phase or excluded by name, so `build` does not discover it
mid-run. `build` implements **one** phase, runs its verification and records
what it proved. Repeat `build` for the remaining phases, or hand them all to
`/esq:autopilot <plan>`.

Then review and land:

```text
/clear
/esq:review docs/plans/<date>-invoice-export.md
/clear
/esq:land docs/plans/<date>-invoice-export.md
```

`review` checks both that the goal was delivered and that the code is sound.
`land` confirms the whole branch is ready, then merges it locally into the branch
the plan started from.

**Not sure what to build yet?** Start with `/esq:grill <idea>`. It questions you
until the scope is clear and writes a brief that `plan` picks up. Asking for it in
the conversation ("grill B-12") is enough: Claude starts it for you. For a product with
no UI yet, it suggests `/esq:ui --greenfield` to put rendered design directions on
screen before any code.

**Out of ideas?** `/esq:ideas` reads what the product already is (the spec, its screens
and routes, the backlog, the decisions, where the history churns) and proposes a short
slate, user value first: new end-user features, then adjustments to what exists, then
content (copy, templates, onboarding, the defaults people start from), then container
(architecture, structure, the surfaces it lives on), each judged by the user value it
unlocks. Every idea names what it was read from, who gets what, its size and the command
that takes it further; nothing generic, nothing already in the backlog or decided against.
Narrow it with a focus (`/esq:ideas invoicing`) or an axis (`features`, `adjust`,
`content`, `container`). You pick in one question; what you pick becomes backlog rows
with a suggested priority, and the rest stays in a slate you can capture from later
(`/esq:ideas capture 4,7`) without generating again. It writes no code and no plan.

**An interface that works but looks dull?** `/esq:ui` (or `/esq:ui <screen>`) never reads
one page alone. It covers a slice: the journeys through the screen, and the screens a
change there would reach through a shared component, layout or token. It walks those
journeys end to end in the running app (steps, dead ends, labels that disagree, input lost
on back) and checks current practice, starting from the dated UI craft and accessibility
modules (see *Expertise*) and searching only what they leave open. Each direction comes from a
territory of your product's own domain (the trade's documents, tools, materials, places and printed
matter), not from the reference apps everyone looks at; when the direction is your call it also
finds references outside software itself and cites each with its URL and the date it checked it.
Then it renders the directions across every screen
they change, linked so you walk the journey, on a comparison page at the width people use
it. Hand it a spec document (`/esq:ui docs/<spec>.md`) or a long mandate and it reads the
whole thing. A surface too big for one run (more than 3 journeys or 6 screens) is cut into
slices, value first. Each next slice is filed as a backlog row carrying the mandate's
requirements for its journeys, so `/esq:ui B-NNN` (or `/esq:work`) picks it up and nothing
is lost between runs. A screen the mandate asks for that the app does not have yet is
rendered inside today's shell from the mandate's own content. A real defect it
finds outside the work is filed as a backlog row, committed with the brief before it asks
you anything. A direction answers what the screen should feel like, not just
the defects it counted: each carries its own signature and motion, built live on the page
so you play the hover, the press and the transitions before choosing. It may break the
app's own visual rules where only habit set them, and it ships only after it passes
contrast, focus, 44 px targets (48 px when shipping Android), phone width, reduced motion,
its empty, loading and error states, and each control's states, contrast and name. Each direction's own HTML (no embedded screenshots, one section per screen)
is committed beside the brief, and that is what `/esq:build` reads when it builds the screen,
so a mockup is never too big to read.

**A screen someone misread?** `/esq:ui B-NNN` (or a sentence saying what went wrong)
captures the screen as they met it, along with the screens of its journey and the ones
its fix would also change. It renders the fix where it lands (two directions when the
choice is yours) on a comparison page, and writes the brief `plan` picks up. `/esq:work`
routes such an item there itself.

**Does the product do what it says?** `/esq:promise` collects every promise the product
makes: the marketing site, pricing, onboarding and `docs/SPEC.md`. It walks each one in the
running app as the person it was made to would, and gives it a verdict with its evidence:
kept, partial, broken, absent, unverifiable here, or not testable at all ("the best").
Verdicts live in `docs/PROMISES.md`, so a re-run walks only what is not already proven
(`--all` re-proves everything). Each promise that does not hold becomes a backlog row
naming both remedies, make the product do it or change the words, for you to pick, and
what else it affects. A defect seen on the way is filed too, and the part of your ask no
promise can judge ("is the UX a pleasure?") is filed as one idea holding the `/esq:ui`
invocations that judge it. The report ends with one `/esq:roadmap` invocation that places
everything filed. It never writes to a production instance.
`/esq:promise --sense` sweeps the screens for what makes no sense: a button that does
nothing, a count that disagrees with its list, "Cancel" that saves, a field asked for and
never used, work lost on back. Each finding is filed with the step that shows it.
`/esq:promise --copy [page]` writes or improves a site's page copy, claiming only what was
proven, in the product's voice and its own names for things, checked to fit at phone
width. It shows each page before and after; what you approve is written into the source,
one commit per page.

**Small change?** `/esq:work fix the typo in the sign-in error` records the item,
sizes it, and — when it is truly small — makes the change, verifies it and commits,
with no plan. Anything that needs a plan, a grill or a screen direction hands on to
`/esq:advance B-NNN`, which takes it the rest of the way to a local merge. A real run:

```text
✔  work — B-078 · ⚠️ debt [med?] · verdict: inline · done · 59s

  ✔ reads as    The only head pipeline left under pipefail was an unused function in scripts/worktree.sh.
  ✔ sizing      One file, four lines deleted, no design choice.
  ✔ applied     ccff966               removed the unused main_worktree()
  ✔ verified    bash -n passes, no references left, ./scripts/audit.sh clean (7 checks)
  ✔ closed      B-078 → Done
  ○ if you disagree  keep the function and rewrite it without head, if you plan to call it soon

→ Next: /esq:work
```

**New to a codebase?** `/esq:status` orients you without changing anything.
`/esq:spec`, `/esq:arch` and `/esq:harvest` write a product spec, an architecture
map and a decision record on demand; none is a required setup step. Imported a folder of
specs written elsewhere into `docs/`? `/esq:harvest` reads it once, prints what you are building
and the contradictions it found, asks one round of questions, and turns it into decisions and one
backlog row per module; `/esq:roadmap plan` orders them next.

## Commands

| Command | Purpose | Main result |
|---|---|---|
| `/esq:grill <idea>` | Resolve scope and consequential choices before planning; a choice your reference stack covers is not asked | A brief in `docs/plans/` |
| `/esq:plan <brief-or-task>` | Design the work and its verifiable phases, starting architecture choices from your reference stack and reading the expertise modules its files or its stack touch | A plan committed on its own branch, its checks tried against the repository first, citing any lesson from `docs/LESSONS.md` that changed its design, each phase naming the expertise it loads, and a backlog row for a domain no module or project skill covers; when it replaces a surface, the inventory of what that surface did, any drop asked first |
| `/esq:build <plan>` | Implement and verify one phase, then stop, weighing the lessons earlier cycles left on its files and reading the expertise modules they touch or the plan names | Task commits and an execution-log entry; a repo fact in `docs/LESSONS.md` for a trap the phase hit and verified itself |
| `/esq:review <plan-or-commit-or-range>` | Assess the delivered goal, what it removed, correctness, security, UX and design, against the expertise modules the change touches or its plan names | Review findings, each marked `(repeats L-<id>)` when it repeats a defect a lesson recorded; the calls build decided for you by hat; a corrective brief when needed |
| `/esq:fix <fixes-brief> [--accept B-NNN,...]` | Apply safe corrections or record explicitly accepted findings | Verified fix commits and updated findings; a lesson in `docs/LESSONS.md` for a fix whose contrast recurs beyond its line |
| `/esq:land <plan>` | Verify readiness and merge the work into the branch it started from | A local merge or an explained refusal, then every rollout step esq can run, and the next plan still in flight; never a push |
| `/esq:check <plan>` | Diagnose missed tasks, divergence and unplanned work phase by phase | A report and corrective brief; no review coverage |
| `/esq:work [item-or-text] [route]` | Investigate one item; do it now if trivial, otherwise recommend the method | Code commit and backlog close for small work; otherwise the next command — `/esq:advance B-NNN` when it needs a plan, a grill or a screen direction |
| `/esq:backlog [text-or-IDs]` | Capture, list, prioritize and update tasks, each classified by type, concern and layer (`app`/`infra`) when it is filed; `publish` exports them | `docs/BACKLOG.md`; `publish` writes a CSV, and a Google Sheet when a connector is available |
| `/esq:sweep` | Reconcile backlog items against evidence of delivery | Backlog closures; questions only for unresolved cases |
| `/esq:roadmap [plan-or-edit]` | Show and refresh the queue; `plan` derives its order under your recorded criterion (lens) and shows what the open work is made of | `docs/ROADMAP.md`; backlog concern, layer, priority and rank updates when ordering; a concern × layer and type table above the order, and a rebalance proposal when the head of the queue is short on user value |
| `/esq:advance [Now-entry-or-B-NNN]` | Work the roadmap's `Now` items, or any one backlog item by its ID, render UI directions, then ask you once what only you can settle | Inline fixes, plans, rendered directions; grills you accept; each plan it wrote built, reviewed and landed locally; never pushes. In a project whose `docs/` holds imported specs esq has not adopted, it stops first and names `/esq:harvest` |
| `/esq:autopilot <plan>` | Build remaining phases sequentially, one worker per phase | Code and execution logs |
| `/esq:converge <plan-or-fixes-brief>` | Run review → fix, then plan → build → review any 🟡 left, or resume an existing brief | Readiness report, and a lesson for a 🟡 its corrective round closed whose contrast recurs; no merge |
| `/esq:epic [new title-or-slug]` | Group a theme spanning several plans and backlog items | `docs/epics/<slug>.md` |
| `/esq:worktree [name-or-action]` | Create, list, remove or merge linked worktrees | Separate working directories and reserved backlog ID blocks |
| `/esq:status` | Orient without changing anything | Plan, backlog, pending briefs, roadmap, whether the spec and architecture still describe the code (the verdict `/esq:land` uses), and next action — `/esq:harvest` when `docs/` holds imported specs esq has not adopted and no plan is under way |
| `/esq:harvest` | Recover decisions from the code, history and discussion; adopt a folder of imported specs in one pass | `docs/DECISIONS.md`; for imported specs, also an overview, the contradictions settled in one question round, and a backlog row per module and per blocking gate |
| `/esq:spec` | Describe the product's live features and business rules | `docs/SPEC.md`, free of dated history comments; what a refresh changed goes in its commit message |
| `/esq:arch` | Refresh architecture and project instructions from the code | `CLAUDE.md`, project skills and `docs/ARCHITECTURE.md` |
| `/esq:ideas [focus] [features\|adjust\|content\|container]`, `/esq:ideas capture <n,…>` | Propose grounded ideas, user value first: new features, adjustments, content and container (architecture, structure, surfaces) | A ranked slate you pick from in one question; picked ideas become backlog rows with a suggested priority, the rest kept for a later `capture` |
| `/esq:promise [page-or-feature] [--sense \| --copy] [--all]` | Check that what the product promises works in the running app; sweep it for UX nonsense; write or improve page copy | `docs/PROMISES.md` verdicts with evidence and a backlog row per promise that does not hold, per defect seen on the way and for the part of the ask it cannot judge; `--sense` backlog rows; `--copy` a before/after page, then approved copy committed page by page |
| `/esq:ui [screen-problem-spec-or-B-NNN] [--greenfield <brief-or-copy>]` | Inspect an existing interface (the journeys through a screen and every screen a change reaches, sliced when large, or a spec document of several journeys) or one screen a user misread, or explore one before implementation | A rendered recommended direction across the screens it changes (two in `--greenfield`, or when the choice is yours), each drawn from a territory of the product's own domain (its documents, tools, materials, places) and, when the choice is yours, from references outside software it finds and cites itself, live, animated and walkable, built against the UI craft and accessibility expertise modules, gated on contrast, focus, target size, phone width, reduced motion and states, component states, control contrast and accessible names, a comparison page, each direction's HTML source committed beside a planning brief; each next slice filed as a backlog row holding its share of the mandate (the source, not the page, is what `/esq:build` builds from); backlog rows for the defects outside the work |

In every example, use the actual paths the previous command reported. `review` and
`check` need an explicit target and ask for one when it is missing.

## Expertise

Besides its commands, esq ships **expertise modules**: generic, dated knowledge about a
domain where a first attempt is expensive to get wrong. They are plain files under
`plugin/expertise/`, not skills, so they have no slash command and a session pays
nothing for a module it does not read, however large the catalog grows. Nothing needs
installing or configuring.

Each module declares the paths it covers (`**Paths:**`) and the npm packages that show a
project uses its domain (`**Stack:**`). `esq expertise match <path…>` answers which modules
a set of paths touches, each with its file; `esq expertise match --all` answers every
module, with the packages your root and tracked `package.json` files declare that match it (only
dependency names are read, never through `node_modules`). `/esq:plan`, `/esq:build`, `/esq:review`
and `/esq:ui` read the matched modules automatically for the files a phase or a change
touches, and `/esq:ui` always reads the UI modules (`esq:visual-craft`, `esq:motion-and-states`,
`esq:accessibility`) whatever matched, since they are its whole domain. A plan names them in each phase's `**Expertise:**` item, together with any module
the work needs that no path shows, such as `esq:store-review` for a phase that submits a
build; ids written as `esq:<name>` in older plans still resolve.

**Each session hears about its own stack only.** When a session starts (and again after
`/clear` or a compaction), a hook reads the dependency names in those same `package.json`
files and adds one short note to the session: where the modules live, one line per module
the stack uses (`payments-stripe.md` for a project depending on `stripe`), and that
`esq expertise match --all` lists the rest. A project whose stack uses none, or that has no
`package.json`, gets the fixed pointer alone, and adding modules to the catalog leaves that
note unchanged. Only npm manifests are read today. When `docs/` holds at least three Markdown
files (20 KB) esq does not own and no esq decision registry, the note opens with one more line:
how many and how large, and that `/esq:harvest` adopts them.

- **A project skill wins.** Where your project carries its own skill on the same topic
  and the two disagree, Claude follows the project's.
- **Facts are dated.** Each module opens with an `**As of:**` date and the paths it
  covers. When a run finds the date more than 180 days old, it says so in one line
  before relying on a deadline, and keeps going. An old or unreadable module never stops a run.
  `/esq:ui` inherits a fresh module's dated facts instead of searching the web for them again,
  and spends its searches only on what the modules leave open.

| Module | Covers |
|---|---|
| `esq:accessibility` | WCAG 2.2 AA in practice: one global focus outline, focus not obscured, dialogs that trap and restore focus, contrast as token pairs, 24×24 px targets (44 px, or 48 px when shipping Android), errors and live regions, reduced motion, `lang` |
| `esq:auth-sessions` | Sign-in and sessions: cookie flags and `__Host-`, CSRF by method and origin (login included), rotation on login and privilege change, server-side revocation and cached-session delay, better-auth defaults, native OAuth with PKCE and verified ID tokens, account deletion that ends sessions and grants |
| `esq:background-jobs` | Jobs that run twice, fail and restart without harm: idempotent handlers, job ids that dedupe enqueueing, bounded retries with exponential backoff and jitter, failed jobs someone sees, graceful shutdown, Redis `noeviction`, one schedule across instances |
| `esq:capacitor-android` | A Capacitor app's Android shell: build origins, `versionCode`, API levels, `cap sync` output, the WebView origin and its cookies, App Links, signing, backup rules, insets |
| `esq:capacitor-ios` | A Capacitor app's iOS target: toolchain and CI without a Mac, signing, lifecycle and session survival, push (APNs vs FCM), privacy manifests, export compliance |
| `esq:dates-and-timezones` | Instants and local days: UTC instants and dates stored as dates, `new Date('YYYY-MM-DD')` as UTC, the owner's zone as a required parameter, link-tolerant zone validation, DST gaps and overlaps, Temporal's support and fallback, tests pinning clock and zone |
| `esq:deploy-vps` | Deploying to a VPS with nothing dropped: pm2 cluster `reload` with `wait_ready` (or systemd in turn), closing the server on `SIGINT`/`SIGTERM`, nginx forwarded headers and one trusted hop, upstream keepalive, body size and timeouts, Cloudflare Full (strict), the visitor IP restored from `CF-Connecting-IP`, the origin firewalled, no cached authenticated page, idempotent Ansible with Vault, build → migrate → reload → check → rollback |
| `esq:design-system` | Design tokens and the theme: semantic tokens over fixed shades, family roles, shadcn's `accent` and Tailwind 4's `@theme`, recorded exemptions, a theme known before first paint, twin token files, self-hosted fonts |
| `esq:forms-and-failures` | Forms and failure states: every request ends in something visible, double submits, input kept after a failure, unsaved changes, server field errors on their fields, loading/error/empty/offline states, option sorting |
| `esq:i18n-fr-en` | French/English for a Québec product: keys never literals, both locales in one commit with a parity check, the recipient's language in jobs and emails, Québec French and OQLF typography, `fr-CA` formats through `Intl`, plurals, Charter s. 52.1 |
| `esq:landing-seo` | A public site found, shared and fast: Core Web Vitals from field data with INP, images that reserve their space and a non-lazy hero, per-page title, description and absolute canonical, Open Graph's four tags and a 1200×630 card, staging kept out by `X-Robots-Tag` rather than `robots.txt`, a sitemap of canonical URLs, reciprocal `hreflang` with `x-default`, JSON-LD that matches the page, Astro's `<Image />` and `@astrojs/sitemap` |
| `esq:motion-and-states` | Motion and controls that answer: two duration bands as tokens, enter decelerating and exit accelerating, springs through `linear()`, the native primitives with dated support (`@starting-style`, view transitions, scroll-driven animations, Popover, anchor positioning, container queries, `:has()`), when a motion library earns its place, the component state matrix, safe areas, `dvh`/`svh`, the virtual keyboard, coarse pointers, bottom nav and sheets, haptics on the main action |
| `esq:observability` | Errors you can read and an app you know is up: the SDK initialised first, Bugsink as a self-hosted Sentry-compatible target, sourcemaps uploaded per release and never served, a deliberate production error as the check, `release` and `environment` set, `sendDefaultPii`/`dataCollection` and `beforeSend`, unhandled rejections reported before exit, a Capacitor app's web and native layers, a health endpoint with an outside uptime check, alerts someone reads |
| `esq:payments-stripe` | Stripe where a mistake costs money: signatures on the raw body, events handled once by id and in any order, test vs live secrets, granting on the webhook (async payments included), refunds and disputes, GST/HST and QST registration and what Stripe Tax does not watch |
| `esq:pwa-and-push` | A PWA that updates and push that keeps arriving: the waiting worker and an update prompt, `skipWaiting()` only from the user's reload, the worker script uncached and scoped where it lives, network-first HTML and no cached authenticated API, the install criteria, permission from a tap (iOS web push only from the Home Screen), one VAPID pair per environment and `userVisibleOnly`, tokens pruned on 404/410 or `UNREGISTERED`, FCM through HTTP v1 |
| `esq:prisma-postgres` | Schema changes and writes that lose nothing: expand then contract, `migrate dev` vs `deploy` (Prisma 7, with Prisma 8 noted), indexes on foreign keys and filters, `CREATE INDEX CONCURRENTLY` and `lock_timeout`, unique constraints over check-then-insert, short transactions and their timeout, isolation, pool size × instances |
| `esq:privacy-loi25` | Québec's Law 25 (P-39.1) and PIPEDA as engineering, never legal advice: a named person in charge, an assessment before a new system or a provider outside Québec, consent per purpose, private by default, retention then destruction or anonymisation, an incident register and notices, access and portability within 30 days |
| `esq:store-review` | What Google Play and App Store reviewers check, and the Console and App Store Connect forms that block a build or a review |
| `esq:testing-pitfalls` | Tests that can fail: break the code once to see red, assert what the caller observes, mocks only at boundaries you do not own and restored after each test, no shared state or order, a real PostgreSQL for queries and migrations, end-to-end waits on a state never a duration, flaky tests as findings, small reviewed snapshots |
| `esq:transactional-email` | Mail that reaches the inbox and links a scanner cannot spend: SPF, DKIM and DMARC aligned (RFC 9989), SPF under ten lookups, a sending subdomain with transactional apart from marketing, Gmail and Yahoo bulk-sender rules (one-click unsubscribe, spam rate under 0.3 %), bounce and complaint suppression, single-use hashed short-lived tokens confirmed by `POST`, a text part and dark-mode-safe HTML, CASL s. 6(6) |
| `esq:visual-craft` | The look of a screen: a font pairing with a job each, one scale, hierarchy by weight and colour, variable fonts, `oklch` ramps and tinted neutrals, one accent's budget, a designed dark theme, one way to separate surfaces, density and rhythm, one icon family, territories drawn from the product's domain and how to turn one into moves without pastiche, the generic "AI look" defaults and the move replacing each, where references come from outside software, and dated reference products per app class as the convergent baseline |
| `esq:web-security` | The server trusts nothing from the client: the OWASP Top 10:2025, schema validation at the boundary, parameterised queries, authorization per object (IDOR), SSRF checked after resolution, CORS with credentials on exact origins, CSP, rate limits per account and IP, secrets out of the bundle and the logs, audited and locked dependencies |

## How it works

esquisse is a plugin, not a service or a database. **The model handles judgment:**
which problem matters, what experience to design, how to implement it, what a test
proves and when a decision belongs to you. **A small local CLI handles the
repeatable facts:** parsing records, assigning IDs, checking branch and
verification state, and merging safely.

| Piece | Where | Responsibility |
|---|---|---|
| Skills | `plugin/skills/<name>/SKILL.md` | The `/esq:*` commands: understand the goal, make design and scope judgments, decide when your authority is needed |
| Expertise | `plugin/expertise/<name>.md` | Dated domain knowledge the esq flows read when a phase's files, its plan or the project's stack call for it; not registered as skills, so a module costs a session nothing until it is read |
| CLI | `plugin/bin/esq` and `plugin/lib/` | Parse plans and ledgers, assign IDs, check branches and review coverage, keep verification evidence, perform safe local merges, keep the lessons ledger (`esq lessons add` refuses an entry whose evidence does not resolve; `esq lessons match` returns at most six cues for the files in hand, and the build preflight and review scope carry them without an extra call; `esq lessons show` opens one), match paths and the project's stack to expertise modules (`esq expertise match` returns each module those paths touch with its file and age, never its text, `--all` every module with the npm packages that show it in use, and the build preflight carries the matches plus the ids the phase names), map the specs a user imported into `docs/` (`esq intake inventory`: the files esq does not own, their headings, the codes they define and cite, the links that do not resolve, and whether an intake is pending), return your reference stack (`esq stack`: the text of the file described under *Reference stack*, read-only), and read the spec and architecture by section (`esq projection outline` gives the heading tree, what each section costs, the projection's freshness and which given files changed since it was mined; `esq projection read` returns only the chosen sections, history comments stripped). It answers structured questions; it makes no product choices |
| Project records | `docs/` in your project, and Git | Keep plans, decisions, committed work and the execution log available to the next session |
| Hooks | `plugin/hooks/hooks.json` and `plugin/scripts/` | Five handlers on six events: name the expertise a session's stack uses when it starts, and say when `docs/` holds imported specs esq has not adopted, protect the installed plugin, validate changed records when a session stops, and keep optional local usage counters |

Skills pre-approve exactly one tool: the plugin's own CLI (`Bash(esq *)`), so
bookkeeping never waits on a permission prompt. Every other tool stays under your
permission settings.

### What lands in your repository

| File | Role |
|---|---|
| `docs/plans/*.brief.md` | Scope and review findings passed between commands |
| `docs/plans/*.md` | Goal, phases, verification and the execution log |
| `docs/BACKLOG.md` | Tasks with permanent `B-NNN` IDs, each with its type, concern and layer |
| `docs/DECISIONS.md` | Decisions and the authority behind each one |
| `docs/LESSONS.md` | Lessons from closed defects and verified repo facts, each tied to its evidence and the paths it is about |
| `docs/ROADMAP.md` | Your ordering criterion, then ordered `Now`, `Next` and `Later` work with the reason for each position |
| `docs/epics/<slug>.md` | A theme joining several plans and backlog items |
| `docs/SPEC.md` | The live product as users experience it |
| `docs/ARCHITECTURE.md` | Components, boundaries and implementation rules |

Backlog statuses are `Open`, `Planned`, `Needs-decision`, `Done` and `Dropped`.

## Review, fixes and landing

Review covers the original goal as well as the code. Each finding is sorted by who
has to act on it:

| Finding | What happens next |
|---|---|
| 🔴 Needs your decision | You pick one of the options it presents; red comes first. "No preference" lets it take its recommended option |
| 🟢 Mechanical, contained fix | `/esq:fix` applies and verifies it; a red its own change explains (a stale mock, a missed import) is corrected and re-run once before it would escalate |
| 🟡 Substantive change | `/esq:plan` defines the work |
| Clean | The work moves on toward landing |

`/esq:converge <plan>` runs review → fix for you and reports whether the work is
ready; it never merges. A 🟡 left over is not a question for you: converge plans it,
builds it phase by phase and reviews it again, within the two-corrective-plan bound
below, and stops only on a decision that is yours. `/esq:check` is an optional, deeper phase-by-phase
reconciliation; it does not count as a review.

Corrections are bounded: a piece of work gets at most two corrective plans. Past
that, safe fixes still go through `fix` → `review` → `land`, and
`fix --accept B-NNN,...` records your decision to leave named findings unfixed — as
`Dropped`, never `Done`, and without skipping verification.

**Landing** checks the whole branch, not just the named plan: plans complete or
explicitly abandoned, findings dealt with, review done, every module the branch
deleted or left unused accounted for, working tree clean (screenshots build left
behind are committed, never asked about). It
reuses verification that still holds and runs only what is owed. A red test is
diagnosed on the spot, alone and on the branch's origin: an inherited failure or a
flake lands, only a regression of the branch stops it. A red caused by your local
setup (a flag left on in a gitignored `.env`, a stale server, a cache, a test
database behind the branch's migrations — destructive ones included, since the test
suite owns that data; your local dev database too, after a dump that is its undo) is
fixed by the landing itself and reported with its undo, never handed back to you; only a
secret or a remote database is yours. A check the machine killed for low memory is re-run
once in the foreground after esq's own leftover servers are stopped. A backlog row the
branch only partly delivered is split: the delivered part closes, the rest becomes its own
row for you to triage whenever you like. It then merges
locally, listing once, by hat, the calls build decided for you with how to undo
each; silence is consent. Conflicts that need judgment come back to you with a recovery action.
When the feature needs more than a merge to reach users — a migration, an
environment variable, a restart — the plan's rollout steps are listed in the
landing report under **Rollout**, and the landing runs every step it can itself.
It stops only at a step that is yours — a push, a deploy, an action in your own
accounts — and once you have done it, `/esq:land <plan> --from <n>` (or saying
done in the same session) carries on. esquisse never pushes. A plan that lands into
another plan's branch rather than your trunk has shipped nothing yet: the report
says where that parent stands and points at its next step, and the deployment
steps come when the parent lands. When another plan is still in flight — a sibling from
the same roadmap entry first — the landing ends on its next command rather than on
"nothing to run".

**Replacing a screen, an editor or a form** keeps what the old one did unless you
say otherwise. `plan` reads the old code and lists each capability it carried — the
autocomplete, the map picker, the geolocation — as kept or moved (and where), or
dropped. Dropping one is always your call, asked before anything is built, and every
kept one gets a check proving it works on the new surface; `build` walks that list on
the new screen, not just the new flow. `review` names the feature behind every file
the change deleted or left unused and where it lives now — one that lives nowhere comes
to you as a decision — and `land` refuses while any of them is unaccounted for.

**Manual checks** need an actual observation of the stated behavior, and the
build makes it with a browser tool when one is available: a "phone" check runs at a
phone-sized viewport. A native phone behavior (install, push, haptics, camera) never
stops the run: the build prepares the artifact (the APK, the link) and `land` asks you,
once and after the merge, only whether the result is right on your device. Any other
step left unobserved pauses the phase; resume with `/esq:build <plan>`, which picks up
from the log and existing commits.

**Reviewing work without a plan:** `/esq:review <full-commit-hash>` or
`<base>..<tip>`. Avoid bare `HEAD` after `/esq:work`: the last commit is then the
backlog update, not the change. A plan-less review ends at its findings; `land`
only operates on planned work.

## Backlog, roadmap and epics

- `/esq:backlog <text>` captures an item; `/esq:work` takes one item at a time and,
  with no argument, picks the top of the roadmap.
- `/esq:roadmap plan` orders the open work and records why each item sits where it does.
  Say what leads once — `/esq:roadmap plan security first, then checks, then bugs, features last`
  — and it becomes the roadmap's **lens**: recorded at the top of `docs/ROADMAP.md` with the tiers
  it translates to, reused by every later bare `plan` and shown on every run, until you state
  another. With none, the lens is user and business value first. Each open item carries a
  **concern** (`user`, `security`, `legal`, `checks`, `deps`, `ops`, `internal`) and a **layer**
  (`app`, the product its users run; `infra`, hosting, CI, release and install). `esq backlog add`
  refuses a row without both, or with a type off the five, so every new item is classified when it
  is captured, and creates `docs/BACKLOG.md` when the repository has none; an older item's concern and layer are classified once by the first derive. A tier can name a layer
  (`security+infra:hi`). The CLI sorts the items no roadmap entry
  covers by the lens itself and the model only orders the entries. A derive also brings
  suggested (`?`) priorities into line with the lens; a priority you confirmed is never changed,
  only reported where it disagrees. Above the order, a derive prints how the open items split by
  concern × layer and by type (`esq backlog distribution`, read-only). When more than half of the
  first five items in the queue are known not to serve users and a user item could move up, one line says so and
  proposes the commands that would rebalance it; nothing moves until you run them.
  Bare `/esq:roadmap` refreshes state without reordering; `/esq:roadmap <edit>`
  applies one edit per line (`add`, `X before Y`, `why X: …`) in one run and one commit. A finished plan does
  not close its items by itself: `/esq:sweep` closes one only with evidence of its
  whole outcome.
- `/esq:advance` works the roadmap's `Now` items — or, given `B-NNN`, that one backlog item,
  wherever it sits — one worker per item, at most one
  new plan per entry, at most one UI render (skipped when an item beside it needs a
  grill, which may settle the screen question). Once that work
  is done it asks you in one round what only you can settle: grill ambiguous items now
  or later (one grill per roadmap entry, however many of its items need it), and which
  rendered direction to keep. A grill you accept runs right there; a screen it left
  unsettled is rendered right after it and its direction asked while you are still
  there. What the round settled gets one more plan. Last, each plan the run wrote is
  built with `/esq:autopilot`, reviewed with `/esq:converge` and landed with
  `/esq:land`, in the same session, each announcing its own bound and asking you at its
  own gates. The merge is local and nothing is pushed: publishing stays yours. Anything
  still waiting on you is one numbered list under NEEDS YOU, most valuable first, and
  `→ Next` is always its first line.
- `/esq:ideas [focus]` proposes grounded features, adjustments, content and container
  changes, and captures the ones you pick as backlog rows.
- `/esq:epic new <title>` creates a theme; tag work with `epic:<slug>`.

## Parallel sessions

Use separate Git worktrees for independent sessions:

```text
/esq:worktree feature-b
/esq:worktree ls
```

Open the reported directory in another terminal. Each tree has its own working
files and its own block of backlog IDs, so two sessions never hand out the same ID.
Merge with `/esq:worktree merge feature-b` from the destination checkout, or use
`land` for planned work. The merge reconciles the backlog and decision records; other
conflicts stay ordinary Git conflicts.

## Sessions and models

### Mode discipline

Use a fresh context (`/clear`) between planning, building and reviewing. The skills
write their own files, so Claude Code's plan mode is not needed and can block those
writes.

### Model recommendations

Workers request Opus. `status`, `backlog`, `epic`, `sweep` and `worktree` declare
Sonnet; `autopilot`, `converge` and `advance` use your session's model and request
Opus for their workers. A requested model is not a guarantee: if the host does not
honor it, the worker runs on your session's model.

## Privacy and options

- **Telemetry** is local and optional: counters and validated identifiers only —
  never prompts, responses, tool inputs or source code. Set `ESQ_TELEMETRY=off`
  before starting Claude Code to turn it off. It never blocks or authorizes anything.
- **Hooks** protect the installed plugin from direct edits and, when a session stops
  after changing a record, validate it once. At session start, one reads only the
  dependency names in your `package.json` files to name the expertise your stack uses,
  and the names and sizes of the files under `docs/` plus the first 4 KB of
  `docs/DECISIONS.md`, `docs/BACKLOG.md` and `docs/ROADMAP.md` to tell whether imported specs await `/esq:harvest`: it runs
  nothing from the project, writes nothing, sends nothing anywhere and repeats none of
  your manifest's or documents' content (not even a file name), and on any error it
  stays silent.
- **Codex or Gemini as a second opinion (opt-in).** With `ESQ_CODEX=on`, `/esq:plan` asks
  the local `codex` CLI for a blind counter-plan and a pre-mortem of the written plan;
  with `ESQ_GEMINI=on`, the local `gemini` CLI does the same. Turn on either or both:
  with both, the two run at the same time, so the plan waits no longer, and each
  one's verdicts stay attributed to it. Claude judges every answer against the code;
  none ever blocks the plan. **Opting in sends the goal text and whatever the model reads
  in your repository to its vendor under your own account: OpenAI for Codex, Google for
  Gemini.** Since 2026-06-18 Google serves the `gemini` CLI only through a Gemini API key
  (`GEMINI_API_KEY`), Vertex AI or an organization's Code Assist license; a personal
  Google sign-in, including the Google AI Plus, Pro and Ultra subscriptions, is refused,
  and the call then costs one `Gemini: not run` line. On the API's free tier Google may
  use what it reads to improve its products. Set it per project in `.claude/settings.json`:

  ```json
  { "env": { "ESQ_CODEX": "on", "ESQ_CODEX_MODEL": "gpt-6-astra", "ESQ_CODEX_EFFORT": "high",
             "ESQ_GEMINI": "on", "ESQ_GEMINI_MODEL": "gemini-3-pro" } }
  ```

  The models and effort are optional; unset, `~/.codex/config.toml` and Gemini's own
  settings apply. Codex runs in its read-only sandbox. Gemini has none, so it runs in
  plan mode under an allowlist policy that permits only reads, and is skipped when the
  installed `gemini` cannot enforce it. After installing `gemini`, run
  `scripts/probe-gemini-readonly.sh` once from this repository: four PASS lines prove it
  could read but not write; a FAIL means keep `ESQ_GEMINI` off. A missing or failing CLI
  costs one `Codex: not run — <reason>` or `Gemini: not run — <reason>` line.

### Reference stack

If you keep repeating the same proven choices across projects (runtime, data store, auth,
hosting, the repository that shows how), write them once in `~/.config/esq/stack.md`
(`$XDG_CONFIG_HOME/esq/stack.md` when that is set, or any path in `ESQ_STACK`). The file lives
outside every repository and is free Markdown; `esq stack` returns its text and parses none of it.
`/esq:plan` and `/esq:grill` then start architecture choices from it and say so in one line
(`Reference stack: <choice> (<path>)`). They depart only for a requirement your project states, and
ask you only when the departure is a major architecture commitment. A plan reads at most 5 files
from a repository the stack names, and only when a choice needs a concrete pattern. Keep the file
short: past 16 KB it is cut at a line. With no file, nothing changes.

```markdown
# Reference stack

- Runtime: Node 22, TypeScript, plain ESM
- Data: one PostgreSQL per app; isolation by tenant column, no row-level security
- Auth: magic-link email sessions; no third-party identity provider
- Hosting: one container on a single VM, Caddy in front
- Example: ~/projects/orchard-ledger shows the layout, the migrations and the auth flow
```

## Contributing

Read [CLAUDE.md](CLAUDE.md) for the project's goals and editing rules, and
[docs/MAINTAINING.md](docs/MAINTAINING.md) for the audit, release and research tools.
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) describes how the pieces fit.

## License

MIT — see [LICENSE](LICENSE). Contributions and forks welcome.
