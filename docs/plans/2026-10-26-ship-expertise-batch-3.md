# Ship the third expertise batch, picked by each project's stack at no per-catalog cost

**Epic:** esq-decides-implementation-detail

**Branch:** esq/ship-expertise-batch-3

**Origin:** main

## Context
Eight expertise skills ship today as `user-invocable: false` skills under `plugin/skills/` (D-expertise-skills-declare-their-own-paths). Claude Code lists each one's description in every session of every project where esq is installed. That is about 100 tokens per skill, and the user pays for Capacitor's rules in a Python CLI. B-195 adds seven more: payments-stripe, auth-sessions, prisma-postgres, background-jobs, web-security, testing-pitfalls and a generic privacy-loi25. B-196 and B-197 add six more after that. Left as is, the standing cost reaches about 2,100 tokens per session. On 2026-10-25 the user decided the domains stay separate, but that the split must be smart and autonomous: « l'humain derrière la codebase n'a pas à configurer ça ». The per-session standing cost must not grow with the catalog, and each project's expertise is picked from its stack with no install and no per-project configuration. That answers B-195's open question about per-domain plugins: separate plugins would have to be installed, so they are ruled out.

## Goal
In any project where esq is installed, a session hears only about the expertise its stack uses (a Stripe project hears about payments, a Python CLI hears about none of it), the seven new domains exist, and adding a domain to the catalog adds nothing to a session whose stack does not use it.

## Done looks like
- A new session in a project whose `package.json` depends on `stripe`, `@prisma/client` and `bullmq` opens with one short line naming payments-stripe, prisma-postgres and background-jobs, each with its file to read. A project without those dependencies is not told about them. Nobody installs, configures or declares anything.
- The esquisse repository, which has no `package.json`, opens with only the fixed one-line pointer to the catalog. Adding a hundred modules to the catalog leaves that session's context byte-identical.
- `/esq:plan`, `/esq:build` and `/esq:review` still load the expertise a phase's files touch, plus anything a phase names in `**Expertise:**` (`esq:store-review` with no matching path), now by reading the module's file. An old plan's `esq:<name>` items still resolve.
- Each of the seven new modules states each failure mechanism, why it bites and how to check for it. A remedy that depends on a stack choice says which one, and each tax, legal or platform fact carries its primary source and the date it was checked. None names a client project, its domains, slugs or paths.
- One writer per shared fact: In-App Purchase and store account-deletion rules stay with `esq:store-review`, native sign-in shell setup stays with `esq:capacitor-ios`, and retries stay with background-jobs. The others point to these.

## Approaches considered
1. **Modules out of skill discovery, picked from the stack by a SessionStart hook (chosen).** The fifteen domains become `plugin/expertise/<name>.md` files that Claude Code does not register as skills, so none costs anything just by existing. Each declares `**Stack:**` (the npm packages that show the domain is in use) beside its `**Paths:**`. The `esq expertise` CLI reads the tracked `package.json` files and answers which modules the stack uses. A fifth hook handler, on `SessionStart`, injects one line: the matched modules, each with its file and the first sentence of its description, plus a fixed pointer to the rest. *Benefit:* the standing cost tracks the project's stack, not the catalog, with no configuration at all, and selection stays in deterministic code. *Cost:* a new hook, a CLI extension and the move of eight files. *Limit:* only npm manifests are read, so another ecosystem sees only the fixed line until a project needs more.
2. **Native `paths:` frontmatter on the existing skills.** Claude Code hides a skill until a file matching its globs is touched ([skills docs](https://code.claude.com/docs/en/skills), checked 2026-10-26). *Loses:* activation fires only on Read/Edit/Write, and a reported bug ([claudeissues #90004](https://claudeissues.com/issue/90004-bug-conditional-paths-skills-can-never-activate-in-auto-mode-the-trigger-is-wire), checked 2026-10-26) says such skills never activate in auto mode, where Bash does the reading. That is exactly how this user runs. Matching on paths also cannot see the stack, plugin support for `paths:` is not documented, and whether the `Skill` tool can invoke a skill that has not activated is unstated.
3. **One fixed router skill over bundled modules** (the counter-plan's structure). It costs about 100 tokens per session at any catalog size. *Loses to 1:* a generic description triggers less reliably than naming the project's own domains, and it still costs 100 tokens in a project with no matching stack. Its other parts carry over into 1: module bodies out of discovery, stack evidence from manifests, a test that the catalog size does not change the session's context, and old ids resolving through the CLI.
4. **Per-domain plugins in the esquisse marketplace.** Ruled out by the mandate, since each needs an install.

## Recommendation
Approach 1. It is the only approach where nobody configures anything and the cost tracks what the project actually uses.
- **Owning components** (ARCHITECTURE § CLI, § hooks, § skills): the CLI owns detection and matching (structure, no judgment), the hook only relays the CLI's answer, the modules own the knowledge, and plan, build and review keep the judgment of what to load beyond a path match. Detection lives in a new `plugin/lib/expertise.mjs`. `cli.mjs` re-exports it, and the hook imports it without loading the 6,000-line CLI.
- **Ids stay `esq:<name>`**, so every landed plan's `**Expertise:**` item still resolves. They are module ids now, not skills: plan, build and review `Read` the `file` the CLI answers, never the `Skill` tool.
- **CLI, extended in place** (plugin-runtime: no sibling verb):
  - `esq expertise match` adds `file` (absolute) to each entry.
  - `--all` adds every module, each with `matched` (possibly empty) and `stack` (the packages found, `[]` when none), plus `detection: {manifests, skipped}`.
  - The build preflight resolves the phase's `**Expertise:**` ids as `named: true` entries, and an unknown id lands in `unread`.
  - Detection reads the project root's own `package.json` (the git toplevel, or `cwd` outside a repository, tracked or not) plus the tracked `package.json` files `git ls-files` lists, never through `node_modules`. It is bounded at 50 manifests of at most 512 KB each, and anything over is counted in `skipped`, never silently dropped. It reads the `dependencies`, `devDependencies`, `peerDependencies` and `optionalDependencies` keys. A `**Stack:**` span is an exact package name or an `@scope/*` glob.
- **SessionStart output**, bounded before it is spent:
  - A fixed header of at most 300 characters, plus the catalog directory's absolute path written once, names `esq expertise match --all` for domains the stack does not show yet (a project adding Stripe).
  - One entry of at most 160 characters per stack-matched module, naming its file relative to that directory (`payments-stripe.md`), so a long install path never truncates a reference. Only the description sentence is cut to fit.
  - No entry at all for a module the stack does not use, whatever the catalog size.
  - Ordinary full-stack projects use about 14 of the 15 domains, which comes to about 300 tokens against about 1,500 today.
  - The handler runs on every `source` (`startup`, `resume`, `clear`, `compact`), so a compaction does not lose the line. It writes nothing, exits 0 with no output on any error, and its timeout is 5 s.
- **Starting `**Stack:**` spans** (build refines them, and each module keeps its batch-2 `**Paths:**`):
  - capacitor-android: `@capacitor/android`
  - capacitor-ios: `@capacitor/ios`
  - store-review: `@capacitor/core`
  - forms-and-failures: `react-hook-form`, `zod`, `formik`, `@tanstack/react-form`
  - design-system: `tailwindcss`, `@radix-ui/*`
  - accessibility: `react`, `react-dom`, `vue`, `svelte`, `@angular/core`
  - i18n-fr-en: `i18next`, `react-i18next`, `next-intl`, `vue-i18n`
  - dates-and-timezones: `date-fns`, `luxon`, `dayjs`, `@js-temporal/polyfill`
  - payments-stripe: `stripe`, `@stripe/*`
  - auth-sessions: `better-auth`, `next-auth`, `@auth/*`, `lucia`, `passport`
  - prisma-postgres: `prisma`, `@prisma/client`, `pg`, `postgres`
  - background-jobs: `bullmq`, `bull`, `pg-boss`, `agenda`
  - web-security: `express`, `fastify`, `hono`, `next`, `@nestjs/core`, `koa`
  - testing-pitfalls: `vitest`, `jest`, `@playwright/test`, `mocha`
  - privacy-loi25: the auth packages, since accounts mean personal information
- **Ownership between new and existing modules:**
  - payments-stripe owns webhooks (signature on the raw body, idempotency by event id, out-of-order delivery), test vs live keys and accounts, and GST/QST through Stripe Tax or the registrant's own rates. For iOS digital goods it points to store-review's 3.1.1.
  - auth-sessions owns cookies (`HttpOnly`, `Secure`, `SameSite`), CSRF, session rotation and revocation, native OAuth's token and session semantics, and how account deletion is carried out. It points to capacitor-ios for the shell, to store-review for what reviewers require, and to privacy-loi25 for retention.
  - prisma-postgres owns migrations that lose no data (expand, then contract), indexes, transactions and isolation, and `timestamptz` stays with dates-and-timezones.
  - background-jobs owns retries, backoff, idempotent handlers, dead letters and graceful shutdown. The language of an email sent from a job stays with i18n-fr-en.
  - web-security owns input trust, injection, SSRF, CORS, CSP, rate limits and secrets.
  - testing-pitfalls owns mocks that hide the defect, shared state, the clock and the zone pinned (pointing to dates-and-timezones), and integration coverage against a real database.
  - privacy-loi25 owns, generically, the person in charge, privacy impact assessments, consent, retention and destruction, incident reporting and transfers outside Québec. It cites the Act respecting the protection of personal information in the private sector (CQLR c. P-39.1) and PIPEDA, never as legal advice.
- **Sources, checked by build before it sets `**As of:**`** (at most 3 searches per fact that changes a rule):
  - Stripe's webhook and Tax docs, and Revenu Québec / CRA for the GST and QST registration threshold;
  - the better-auth docs and the OWASP cheat sheets (Session Management, CSRF);
  - the Prisma migrate docs and the PostgreSQL docs on locks (`CREATE INDEX CONCURRENTLY`);
  - the BullMQ docs;
  - the OWASP Top 10 (current edition);
  - LégisQuébec P-39.1 and the CAI guidance.

## Security notes
The new hook runs in every session of every project where esq is installed, and reads that project's root `package.json` and its tracked `package.json` files. It reads only dependency key names. It executes nothing from the project, makes no network call, writes no file and records no telemetry, and its output is module ids, plugin file paths and the plugin's own description sentences, never a byte of the project's content. A malformed or huge manifest is skipped and counted. A package name is only compared against `**Stack:**` spans, never echoed into the context.

## Capability inventory
| Source | Capability | Disposition |
|---|---|---|
| `plugin/skills/capacitor-android/SKILL.md` | Claude consults Android shell rules in any session, unprompted, from the description | moved: `plugin/expertise/capacitor-android.md`, announced at session start when the stack uses `@capacitor/android`, otherwise reachable through `esq expertise match --all` |
| `plugin/skills/capacitor-ios/SKILL.md` | the same, for iOS | moved: `plugin/expertise/capacitor-ios.md` (`@capacitor/ios`) |
| `plugin/skills/store-review/SKILL.md` | the same, for store review | moved: `plugin/expertise/store-review.md` (`@capacitor/core`) |
| `plugin/skills/forms-and-failures/SKILL.md` | the same, for forms and failure states | moved: `plugin/expertise/forms-and-failures.md` |
| `plugin/skills/design-system/SKILL.md` | the same, for tokens and the theme | moved: `plugin/expertise/design-system.md` |
| `plugin/skills/accessibility/SKILL.md` | the same, for WCAG 2.2 AA | moved: `plugin/expertise/accessibility.md` |
| `plugin/skills/i18n-fr-en/SKILL.md` | the same, for FR/EN localisation | moved: `plugin/expertise/i18n-fr-en.md` |
| `plugin/skills/dates-and-timezones/SKILL.md` | the same, for dates and zones | moved: `plugin/expertise/dates-and-timezones.md` |
| `tests/cli/fixtures/expertise/{good,nopaths,stale,command}/SKILL.md` | none: fixtures for the skill-shaped parser | moved: `tests/cli/fixtures/expertise/<name>.md` in the module shape (`command` dropped: no command can sit in `plugin/expertise/`) |

The free-session trigger narrows on purpose. The user's 2026-10-25 instruction (Context) authorizes it: a domain the stack does not show is no longer described in the session, only reachable through the fixed pointer. The parity steps are Phase 1's `match` checks and Phase 2's hook output checks.

## Phases

### Phase 1 — The catalog leaves skill discovery, and esq flows read it from the CLI
- **Goal:** the eight existing domains live under `plugin/expertise/` and cost a session nothing; `esq expertise match` answers their files, their stack signals and the phase's named ids; plan, build and review load them by `Read`.
- **Files touched:** `plugin/expertise/` (the eight modules, moved), `plugin/skills/{capacitor-android,capacitor-ios,store-review,forms-and-failures,design-system,accessibility,i18n-fr-en,dates-and-timezones}/SKILL.md` (removed), `plugin/lib/expertise.mjs` (new), `plugin/lib/cli.mjs`, `plugin/skills/plan/SKILL.md`, `plugin/skills/build/SKILL.md`, `plugin/skills/review/SKILL.md`, `scripts/check-plugin.sh`, `scripts/check-structure.sh`, `tests/cli/expertise.test.mjs`, `tests/cli/esq.test.mjs`, `tests/cli/fixtures/expertise/`, `docs/CONFORMANCE.md`, `README.md`, `CLAUDE.md`, `.claude/skills/skill-authoring/SKILL.md`
- **Tasks:**
  - Task 1.1: move the expertise reader and the stack detection into `plugin/lib/expertise.mjs`.
    - Modules are `plugin/expertise/<name>.md`, with frontmatter `name` and `description`, then `**As of:**`, `**Paths:**` and an optional `**Stack:**`.
    - `match` adds `file`, `--all` adds every module with `matched`, `stack` and `detection`, and the preflight carries `named` entries.
    - `git mv` the eight skills, drop `user-invocable` and add each one's `**Stack:**` line, all in the same commit.
    - The tests pin:
      - a Stripe and Prisma fixture repository detected, a sibling `node_modules/stripe/package.json` ignored, and a 600 KB manifest or malformed JSON counted in `skipped`;
      - a planned path that does not exist yet still matching;
      - `esq:store-review` named in a phase with no matching path coming back `named: true`, and `esq:nope` landing in `unread`;
      - an unchanged batch-2 case: `App.tsx` matches nothing.
  - Task 1.2: plan, build and review `Read` each module's `file` instead of invoking the `Skill` tool.
    - Plan chains `esq expertise match --all --paths -` into its wave and names modules from `matched` plus judgment informed by `stack`.
    - Build's step 5 reads the preflight's matched and `named` files in the working-set turn.
    - Review's step 4 chains `esq expertise match --all --paths -`, reads the files of the matched entries plus the ids the phases in scope name in `**Expertise:**` (found in that `--all` answer), and reports in one line any named id the answer lacks.
    - `README.md` § Expertise and its plan/build/review rows are rewritten for the new loading: what announces a module, how the rest are reached, and that nothing needs configuring.
    - `docs/CONFORMANCE.md` E-01 is rewritten for the module file, plus `**Stack:**`.
    - The `skill-authoring` project skill drops the expertise-skill shape.
  - Task 1.3: `check-plugin.sh` validates `plugin/expertise/*.md`:
    - `name` equal to the file stem;
    - a `description` of at most 460 characters;
    - the two parsed lines;
    - `**Stack:**` spans well-formed when present.

    Its expertise branch under `skills/` goes, because an expertise-shaped skill there now fails the command checks. `check-structure.sh` lists the expertise from `plugin/expertise/`, and `CLAUDE.md`'s Map names `plugin/expertise/`.
- **Verification:**
  - `(auto)` `node --test 'tests/cli/expertise.test.mjs'` — passes: file, `--all`, the stack fixtures, the bounds, the named ids and the unchanged path cases.
  - `(auto)` `scripts/check-plugin.sh plugin` — exits 0 and reports 23 skills and 15 expertise modules (the 15 set in Phase 4).
  - `(auto)` `scripts/check-structure.sh` — prints "structure clean", with every module listed under the README's `## Expertise`.
  - `(auto)` `git grep -lE '^user-invocable: false' -- plugin/skills` — no match (exit 1): no skill is left in the listing as standing expertise cost.
  - `(auto)` `plugin/bin/esq expertise match shell/android/app/build.gradle frontend/src/locales/fr.json frontend/src/App.tsx` — `esq:capacitor-android` and `esq:i18n-fr-en` matched, each with a `file` under `plugin/expertise/` that exists. No entry lists `App.tsx`, and `unread` is empty.

### Phase 2 — Each session hears about its own stack only
- **Goal:** a new session in any project opens with the expertise its stack uses and the fixed pointer, and nothing about the domains it does not use.
- **Files touched:** `plugin/scripts/session-expertise.mjs` (new), `plugin/hooks/hooks.json`, `scripts/check-plugin.sh`, `tests/hooks/session-expertise.test.mjs` (new), `README.md`, `CLAUDE.md`, `.claude/skills/plugin-runtime/SKILL.md`
- **Tasks:**
  - Task 2.1: add the `SessionStart` handler.
    - It is the pure `sessionExpertise(input, env)` behind `isMain`, reading stdin once through `hook-io.mjs` and answering `hookSpecificOutput.additionalContext` within the bounds of the Recommendation.
    - Before it is written, check the output shape against the hooks docs (one search), and record the Claude Code version and date in a comment.
    - Register it in `hooks.json` with a 5 s timeout. `check-plugin.sh` checks its syntax and that it is registered.
    - The tests pin:
      - a fixture repository and a fixture catalog: a Stripe module announced with a reference that resolves under a long install path, and an untracked root `package.json` and a non-git directory both detected;
      - a repository with no manifest getting the header only;
      - the same fixture against the shipped catalog and against one with 100 extra modules giving byte-identical output;
      - malformed stdin or an unreadable catalog giving no output and exit 0;
      - no manifest content in the output.
  - Task 2.2: README § Native hooks and the hook count. CLAUDE.md (five hook handlers, six events) and `plugin-runtime` state the handler's rule: it reads only key names, writes nothing and fails silent.
- **Verification:**
  - `(auto)` `node --test 'tests/hooks/session-expertise.test.mjs'` — passes: the stack line, header only with no manifest, byte-identical output with a larger catalog, silent failure, no content.
  - `(auto)` `printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$PWD" | node plugin/scripts/session-expertise.mjs` — in this repository (no `package.json`), one JSON object whose `additionalContext` is the header alone, at most 300 characters.
  - `(auto)` `scripts/check-plugin.sh plugin` — exits 0, with `SessionStart` registered.

### Phase 3 — Money and data: payments, auth, Prisma/Postgres, background jobs
- **Goal:** a project using Stripe, an auth library, Prisma or a job queue gets dated, generic expertise on the mistakes that cost money or data.
- **Files touched:** `plugin/expertise/{payments-stripe,auth-sessions,prisma-postgres,background-jobs}.md` (new), `plugin/expertise/store-review.md`, `plugin/expertise/capacitor-ios.md`, `README.md`
- **Expertise:** `esq:store-review`, `esq:capacitor-ios`, `esq:dates-and-timezones`, `esq:i18n-fr-en`. These are read so the new modules point to them instead of restating them.
- **Tasks:**
  - Task 3.1: add `payments-stripe`.
    - **Paths** start from: `*stripe*`, `*Stripe*`, `billing/`, `payments/`, `checkout/`, `webhooks/`.
    - It covers:
      - webhook signatures on the raw body;
      - idempotent event handling and out-of-order events;
      - test vs live keys, accounts and webhook secrets;
      - Checkout vs PaymentIntents state;
      - refunds and disputes;
      - GST and QST, Stripe Tax and the registration threshold, with a dated source.
    - The iOS IAP rule is a pointer to store-review.
    - Add the README row.
  - Task 3.2: add `auth-sessions`.
    - **Paths** start from: `auth/`, `*Auth*`, `*auth.*`, `sessions/`, `*Session*`, `*Login*`.
    - It covers:
      - cookie flags;
      - CSRF by method and origin;
      - session rotation on login and privilege change;
      - revocation;
      - better-auth specifics, stated as conditional;
      - native OAuth token handling;
      - account deletion that really deletes and revokes.
    - Store rules and shell setup are pointers. Trim any restated fact from `store-review` and `capacitor-ios` to a pointer, in the same commit.
    - Add the README row.
  - Task 3.3: add `prisma-postgres`.
    - **Paths** start from: `prisma/`, `schema.prisma`, `migrations/`, `*.sql`.
    - It covers:
      - expand-then-contract migrations;
      - `migrate dev` vs `deploy`;
      - indexes on foreign keys and filters;
      - `CREATE INDEX CONCURRENTLY` and its lock;
      - interactive transactions and their timeout;
      - unique constraints over check-then-insert;
      - connection pool limits in serverless and in pm2 clusters.
    - Add the README row.
  - Task 3.4: add `background-jobs`.
    - **Paths** start from: `jobs/`, `queues/`, `workers/`, `*Job.*`, `*.job.*`, `*.worker.*`.
    - It covers:
      - at-least-once delivery, so handlers are idempotent;
      - retries with backoff and a cap;
      - dead letters;
      - a job id for dedupe;
      - graceful shutdown;
      - Redis eviction policy;
      - scheduled jobs across instances.
    - Add the README row.
    - Then read the four modules against their sources side by side and record the result in the execution log: project identifiers, mechanism, *why*, check and conditional remedies, then sources with their dates.
- **Verification:**
  - `(auto)` `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/payments-stripe.md plugin/expertise/auth-sessions.md plugin/expertise/prisma-postgres.md plugin/expertise/background-jobs.md` — no match (exit 1).
  - `(auto)` `plugin/bin/esq expertise match backend/src/webhooks/stripe.ts backend/prisma/schema.prisma backend/src/jobs/sendDigest.job.ts backend/src/auth/session.ts frontend/src/App.tsx` — each of the four new modules matched on its own path, and none lists `App.tsx`.

### Phase 4 — The cross-cutting three: web security, testing pitfalls, privacy (Loi 25)
- **Goal:** any web project gets generic expertise on security, on tests that lie, and on Québec privacy obligations, and the whole unit passes the audit.
- **Files touched:** `plugin/expertise/{web-security,testing-pitfalls,privacy-loi25}.md` (new), `README.md`
- **Expertise:** `esq:auth-sessions`, `esq:dates-and-timezones`. These are read for pointers.
- **Tasks:**
  - Task 4.1: add `web-security`.
    - **Paths** start from: `middleware/`, `middleware.*`, `routes/`, `*cors*`, `*csp*`, `server.*`.
    - It covers:
      - validating input at the boundary;
      - parameterised queries;
      - authorization per object (IDOR);
      - SSRF on user URLs;
      - CORS with credentials;
      - CSP;
      - rate limits on auth and expensive endpoints;
      - secrets kept out of the client bundle and the logs;
      - dependency audits;
      - the current OWASP Top 10, dated.
    - Session and CSRF facts are a pointer to auth-sessions.
    - Add the README row.
  - Task 4.2: add `testing-pitfalls`.
    - **Paths** start from: `tests/`, `test/`, `__tests__/`, `e2e/`, `*.test.*`, `*.spec.*`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`.
    - It covers:
      - a mock that encodes the bug;
      - tests that pass with the feature removed;
      - shared state and test order;
      - the clock and the zone (a pointer);
      - a real database for queries and migrations;
      - flaky waits in end-to-end tests;
      - snapshot drift.
    - Add the README row.
  - Task 4.3: add `privacy-loi25`.
    - **Paths** start from: `privacy/`, `*privacy*`, `*Privacy*`, `consent/`, `*consent*`, `*Consent*`.
    - It covers, generically, under P-39.1 and PIPEDA, each with a dated LégisQuébec or CAI citation:
      - the person in charge of protecting personal information;
      - the privacy impact assessment before a transfer outside Québec or a new system;
      - consent per purpose;
      - privacy by default;
      - retention and destruction;
      - incident register and reporting;
      - access and portability requests.
    - Legal reading stays the project's own, never advice.
    - Add the README row.
    - Then run Phase 3's side-by-side reading on the three modules, and record it in the execution log.
- **Verification:**
  - `(auto)` `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/web-security.md plugin/expertise/testing-pitfalls.md plugin/expertise/privacy-loi25.md` — no match (exit 1).
  - `(auto)` `plugin/bin/esq expertise match backend/src/middleware/cors.ts frontend/src/__tests__/Form.test.tsx frontend/src/pages/PrivacyPolicy.tsx frontend/src/App.tsx` — web-security, testing-pitfalls and privacy-loi25 each matched on their own path, and none lists `App.tsx`.
  - `(auto)` `d=$(mktemp -d) && printf '{"dependencies":{"stripe":"1","@prisma/client":"1","bullmq":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs` — against the shipped catalog, `additionalContext` names `payments-stripe.md`, `prisma-postgres.md` and `background-jobs.md`, and no other module.
  - `(auto)` `./scripts/audit.sh` — PASS: plugin and structure (23 skills, 15 expertise modules, `SessionStart` registered), the product suites and conformance.

## Rollout
- `(user)` Publish the release with `./scripts/update.sh`, then confirm that a new session in a project using Stripe opens with the esq expertise line naming payments-stripe, and that the session's skill list no longer shows the eight former expertise skills.

## Risks
- **Pre-mortem: the session line is ignored.** The likeliest reason the expertise goes unused is that Claude sees a one-line pointer and never opens the file in a free session. Task 2.1 phrases it as an instruction tied to the work ("read `<file>` before changing <domain> code"), and esq flows never depend on it, because they read from `match`. Whether free sessions follow it can only be observed after shipping: that is the Rollout's `(user)` step. A follow-up row is filed then if they don't.
- **Native `paths:` gets fixed later.** If Claude Code fixes the auto-mode activation bug and documents plugin support, approach 2 becomes cheaper. The new decision records the bug and its date so a later session can retire this design on evidence.
- **Stack detection misses or overmatches.** A non-npm project sees only the header. A monorepo with a Stripe package elsewhere announces payments to every session. Both are cheap (one line, or nothing) and never gate anything. `skipped` makes a partial detection visible.
- **SessionStart output shape.** If the documented field differs, the session gets nothing, silently. Task 2.1 checks the docs before writing, and the Rollout's step observes it in a real session.
- **Tax and legal facts age fastest** (the QST threshold, the P-39.1 sections in force): each one carries its source and date, and the 180-day staleness line applies.
- **ARCHITECTURE and SPEC** describe expertise as skills until `/esq:arch` and `/esq:spec` are run. Both are stale already. That is their writers' job, never a prerequisite here.

## Open questions
None. The user's 2026-10-25 instruction settles the split and the authority to amend the decision. Everything else is decided above.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-10-26

**Plan committed at:** 869fc82

**Commits:** d262f9e, b8c20cd, bd3e6dd

**Verified:** bd3e6dda8d5095278e08301eeb0863c9497639e5
- `node --test 'tests/cli/expertise.test.mjs'`
- `scripts/check-plugin.sh plugin`
- `scripts/check-structure.sh`
- `git grep -lE '^user-invocable: false' -- plugin/skills`
- `plugin/bin/esq expertise match shell/android/app/build.gradle frontend/src/locales/fr.json frontend/src/App.tsx`
- `./scripts/audit.sh`

**What got built:** The eight expertise skills now live as plugin/expertise/<name>.md modules that Claude Code does not register, each with a **Stack:** line. plugin/lib/expertise.mjs (re-exported by cli.mjs) answers each module's file, --all every module with the stack packages found in the root and tracked package.json files, and the build preflight answers a phase's **Expertise:** ids as named entries. Plan, build and review Read the module files, and check-plugin/check-structure validate and list plugin/expertise/.

**Verification:**
- (auto) node --test 'tests/cli/expertise.test.mjs' — 8 pass, 0 fail: file, --all, stack fixtures (root untracked manifest, node_modules ignored, 600 KB and malformed JSON counted in skipped=2), the named ids (esq:store-review named:true with no path, esq:nope in unread), the planned ios/ path and App.tsx matching nothing
- (auto) scripts/check-plugin.sh plugin — exit 0, 'plugin, embedded CLI, native hooks, 23 skills and 8 expertise modules validate' (8 now; the plan's 15 is Phase 4's count)
- (auto) scripts/check-structure.sh — 'structure clean — … 23 commands, 8 expertise modules, README coverage …'
- (auto) git grep -lE '^user-invocable: false' -- plugin/skills — no match, exit 1
- (auto) plugin/bin/esq expertise match shell/android/app/build.gradle frontend/src/locales/fr.json frontend/src/App.tsx — esq:capacitor-android and esq:i18n-fr-en matched, each file under plugin/expertise/ exists, no entry lists App.tsx, unread empty
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), 26 s: cli.mjs and markdown.mjs are imported across the CLI, so the whole product pass ran here
- Mutation check of the new check-plugin branch: a wrong name, a malformed Stack span and a 584-character description each reported; a README missing esq:accessibility reds check-structure

**Decided for you:**
- architecture: check-plugin validates modules by importing the CLI's own readExpertiseCatalog in one node pass rather than re-parsing in awk — the gate refuses exactly what esq expertise match puts in unread — undo: restore an awk/grep parse in scripts/check-plugin.sh
- architecture: the preflight's **Expertise:** ids are read by a new phaseExpertise() in markdown.mjs rather than a field on touchedPaths, so touchedPaths' answer shape is unchanged — undo: fold it into touchedPaths in plugin/lib/markdown.mjs and update tests/cli/plan-probe.test.mjs

**Surprises / decisions made during execution:** - The skill-authoring project skill carried no expertise-skill shape to drop; it gained one line saying expertise is a module under plugin/expertise/, not a skill, since its 'only corpus' rule would otherwise mislead.
- The fixture 'command' was dropped as planned; two fixtures were added (prisma for stack-only matching, badstack for a malformed Stack span).
- tests/cli/esq.test.mjs needed no change: its preflight case still answers { skills: [], unread: [] } with no named ids.
- Module bodies still say 'this skill' in places; left as prose.

**Backlog candidates:** None.

**For Phase 2:** 1. plugin/lib/expertise.mjs exports readExpertiseCatalog(dir), detectStack(cwd) → { packages, detection } and stackSpanMatches; it imports nothing from cli.mjs, so the SessionStart hook can import it directly. Each catalog entry carries name, description, asOf, paths, stack (or reason).
2. detectStack honours the ESQ_TEST_GIT_ROOT seam only for rev-parse; under it ls-files yields nothing, so hook tests should use a real git fixture with NODE_ENV cleared, as tests/cli/expertise.test.mjs does.
3. check-plugin.sh's hook script list and the hooks.json registration check (line ~38-45) are where session-expertise.mjs and SessionStart must be added.

### Phase 2 — completed 2026-10-26

**Plan committed at:** d2a5ce5

**Commits:** b9fe6f5, 9eabf3e

**Verified:** 9eabf3eab21f2681d91c69417939cae14a3be5d4
- `node --test 'tests/hooks/session-expertise.test.mjs'`
- `printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$PWD" | node plugin/scripts/session-expertise.mjs`
- `scripts/check-plugin.sh plugin`
- `./scripts/audit.sh`

**What got built:** A fifth hook handler, plugin/scripts/session-expertise.mjs on SessionStart (5 s timeout, every source), adds hookSpecificOutput.additionalContext naming the catalog directory once and one line per module whose **Stack:** meets a package the project declares; a project with no matching stack hears the fixed header alone. check-plugin.sh checks its syntax and the SessionStart registration; README, CLAUDE.md and plugin-runtime document it.

**Verification:**
- (auto) node --test 'tests/hooks/session-expertise.test.mjs' — 5 pass, 0 fail: Stripe module announced under a 12-segment install path with a resolving file reference (git repo with untracked root manifest, and a non-git directory), header only with no manifest, byte-identical output after adding 100 modules to a copy of the shipped catalog, malformed/empty stdin silent with exit 0 and an unreadable catalog null, no package name, version or manifest field in the output
- (auto) printf SessionStart input with cwd=$PWD | node plugin/scripts/session-expertise.mjs — one JSON object, additionalContext the header alone on one line, 250 characters
- (auto) scripts/check-plugin.sh plugin — exit 0, 'plugin, embedded CLI, native hooks, 23 skills and 8 expertise modules validate', SessionStart now required by its hooks.json check
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), 25 s: check-plugin.sh is an audit check, so the whole product pass ran here
- Mutation check of the two new check-plugin conditions on a scratch copy: SessionStart removed from hooks.json and a syntax error in session-expertise.mjs each reported one finding; tree clean after

**Decided for you:**
- architecture: at most 40 stack-matched entries, any beyond folded into one 'and N more: esq expertise match --all' line — keeps the note well under SessionStart's 10,000-character additionalContext cap whatever the catalog grows to — undo: change ENTRY_LIMIT in plugin/scripts/session-expertise.mjs

**Surprises / decisions made during execution:** - The output shape was checked against the hooks reference (code.claude.com/docs/en/hooks) on Claude Code 2.1.310; it is recorded in the handler's header comment. A third-party post mentions a fifth SessionStart source, fork; the handler uses no matcher, so it answers on any source.
- sessionExpertise takes a third options argument ({dir}) so tests can point it at a fixture catalog; the hook itself calls it with (input) only.
- README has no '§ Native hooks' heading; the hook is documented in § Expertise (a new paragraph), the How it works Hooks row (now naming five handlers on six events) and § Privacy and options.

**Backlog candidates:** None.

**For Phase 3:** 1. The session note lists a module only through its **Stack:** line, so each new module in Phase 3 needs one (the Recommendation's spans) for a Stripe/Prisma/BullMQ project to hear about it; entries use the description's first sentence, cut to fit 160 characters, so make that sentence stand alone.
2. tests/hooks/session-expertise.test.mjs copies the shipped catalog and expects at least one entry for @capacitor/core + react; adding modules cannot break it.
3. Phase 4's hook check runs against the shipped catalog: a new module whose Stack includes stripe, @prisma/client or bullmq beyond the three intended (e.g. privacy-loi25 taking the auth packages only) keeps that check exact.

### Phase 3 — completed 2026-10-26

**Plan committed at:** 0a6f7e6

**Commits:** 0aacff5, 1f07101, 40f5b90, 2031359

**Verified:** 20313591ec5f9ee1221bb78ade02829b988f7ece
- `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/payments-stripe.md plugin/expertise/auth-sessions.md plugin/expertise/prisma-postgres.md plugin/expertise/background-jobs.md`
- `plugin/bin/esq expertise match backend/src/webhooks/stripe.ts backend/prisma/schema.prisma backend/src/jobs/sendDigest.job.ts backend/src/auth/session.ts frontend/src/App.tsx`
- `node --test tests/hooks/session-expertise.test.mjs`
- `scripts/check-plugin.sh plugin`
- `scripts/check-structure.sh`

**What got built:** Four new expertise modules under plugin/expertise/ (payments-stripe, auth-sessions, prisma-postgres, background-jobs), each with **Paths:**, the Recommendation's **Stack:** spans, dated primary sources and conditional remedies, plus their README rows; capacitor-ios's sign-in bullet and store-review's account-deletion line now point to auth-sessions instead of restating it.

**Verification:**
- (auto) git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- the four new modules — no match, exit 1
- (auto) plugin/bin/esq expertise match backend/src/webhooks/stripe.ts backend/prisma/schema.prisma backend/src/jobs/sendDigest.job.ts backend/src/auth/session.ts frontend/src/App.tsx — exactly the four new modules, each matched on its own path only; no entry lists App.tsx; unread empty
- Per task: scripts/check-plugin.sh plugin and scripts/check-structure.sh clean after each module (12 expertise modules validate, README coverage holds); descriptions 357/326/377/311 chars, under 460
- Extra (blast radius: the hook test copies the shipped catalog): node --test tests/hooks/session-expertise.test.mjs — 5 pass; and Phase 4's Stripe/Prisma/BullMQ hook check run early — additionalContext names background-jobs.md, payments-stripe.md and prisma-postgres.md and no other module
- Whole ./scripts/audit.sh skipped: this phase changed only Markdown modules and README rows, whose two audit checks (check-plugin, check-structure) ran after every task; Phase 4 runs the full audit

**Decided for you:**
- architecture: prisma-postgres states its Prisma rules for Prisma ORM 7 (stable on 2026-10-26) and names Prisma 8's differing commands and timeout-less transaction as a release candidate, rather than writing for 8 — the stable line is what projects run today — undo: rewrite the Which Prisma paragraph and the conditional rules in plugin/expertise/prisma-postgres.md

**Surprises / decisions made during execution:** - Side-by-side reading of the four modules against their sources (Stripe webhooks, fulfilment, disputes and Tax-in-Canada pages; CRA and Revenu Québec small-supplier pages; OWASP Session Management and CSRF cheat sheets; better-auth session-management, cookies and security pages; Prisma 7 migrate, transactions and connection-pool pages; PostgreSQL 18 CREATE INDEX; BullMQ going-to-production, retrying, job ids and job schedulers), all checked 2026-10-26: no project identifier; each rule states mechanism, why and a check; library-specific remedies are marked Conditional (better-auth, Prisma 7, BullMQ, Stripe Tax vs own rates); every tax, legal or platform fact carries its source and date. Two rules are not from a fetched page and are marked by their own wording: BullMQ's UnrecoverableError (named, not on the retrying page) and Prisma running a multi-statement migration as one implicit transaction (hedged 'confirm it applies in your version').
- Prisma 8 is a release candidate on 2026-10-26 with renamed migrate commands and no interactive-transaction timeout; the module names Prisma 7 and flags 8 (Decided for you).
- Stripe Tax monitors registration thresholds only outside the business's home country, so a Québec business must track the $30,000 GST/QST small-supplier limit itself — written as its own rule.
- auth-sessions and payments-stripe point to esq:privacy-loi25 and esq:background-jobs; privacy-loi25 lands in Phase 4, so that pointer resolves only then.
- README rows are inserted in alphabetical order.

**Backlog candidates:** None.

**For Phase 4:** 1. auth-sessions already points to esq:privacy-loi25 for retention after account deletion, and to nothing for web-security; web-security should point to auth-sessions for cookies, CSRF and rotation, and privacy-loi25 should own retention and destruction without restating deletion mechanics (auth-sessions owns them).
2. Phase 4's hook check already passes against the shipped catalog: keep privacy-loi25's **Stack:** to the auth packages and web-security's to the server frameworks so no module beyond the three takes stripe, @prisma/client or bullmq.
3. testing-pitfalls is named by prisma-postgres as the owner of testing queries against a real database; give it that rule.

### Phase 4 — completed 2026-10-26

**Plan committed at:** 1c928d5

**Commits:** 2428647, 0dfa135, fc32a24

**Verified:** fc32a24d2ac28b42bb86ebb8d391cde70a31ee69
- `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/web-security.md plugin/expertise/testing-pitfalls.md plugin/expertise/privacy-loi25.md`
- `plugin/bin/esq expertise match backend/src/middleware/cors.ts frontend/src/__tests__/Form.test.tsx frontend/src/pages/PrivacyPolicy.tsx frontend/src/App.tsx`
- `d=$(mktemp -d) && printf '{"dependencies":{"stripe":"1","@prisma/client":"1","bullmq":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs`
- `./scripts/audit.sh`

**What got built:** Three cross-cutting expertise modules under plugin/expertise/ (web-security, testing-pitfalls, privacy-loi25), each with **Paths:**, the Recommendation's **Stack:** spans, dated sources and pointers to auth-sessions, dates-and-timezones, prisma-postgres and background-jobs, plus their README rows; the catalog now holds all 15 modules.

**Verification:**
- (auto) git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- the three new modules — no match, exit 1
- (auto) plugin/bin/esq expertise match backend/src/middleware/cors.ts frontend/src/__tests__/Form.test.tsx frontend/src/pages/PrivacyPolicy.tsx frontend/src/App.tsx — web-security on cors.ts, testing-pitfalls on Form.test.tsx, privacy-loi25 on PrivacyPolicy.tsx (forms-and-failures also on Form.test.tsx via *Form*); no entry lists App.tsx; unread empty
- (auto) Stripe/Prisma/BullMQ temp package.json through plugin/scripts/session-expertise.mjs — additionalContext names background-jobs.md, payments-stripe.md and prisma-postgres.md and no other module
- (auto) ./scripts/audit.sh — Clean, 7 checks (product), exit 0 in 26 s: 23 skills and 15 expertise modules validate, structure clean, SessionStart registered in hooks.json, product suites passed, conformance intact
- Per task: scripts/check-plugin.sh plugin and scripts/check-structure.sh clean after each module (13, 14, 15 modules); descriptions 387/350/425 chars, under 460

**Surprises / decisions made during execution:** - Side-by-side reading of the three modules against their sources (OWASP Top 10:2025 index, OWASP SSRF Prevention cheat sheet, MDN CORS guide, Playwright actionability, CAI business pages on the person in charge, use and communication outside Québec, consent, retention and destruction, confidentiality incidents and access rights, OPC breach guidance), all checked 2026-10-26: no project identifier; each rule states mechanism, why and a check; framework-specific remedies are named as such (Vite/Next.js prefixes, Vitest/Jest flags, Playwright); every legal or list fact carries its source and date.
- LégisQuébec (and CanLII) refused automated reads (CloudFront 403) on 2026-10-26, so P-39.1's section numbers (3.1–3.8, 4.1, 8.1, 8.2, 9.1, 12, 14, 17, 23, 27, 32) are cited as commonly numbered, not re-read; the module says so in its Sources paragraph and asks to confirm a section on LégisQuébec before quoting it. The obligations themselves come from the CAI's pages; privacy-by-default (s. 9.1) rests on secondary sources only, marked in its rule.
- The OPC page checked does not state when PIPEDA applies to a Québec business; the module leaves that to the project's legal reading rather than asserting a scope.
- OWASP Top 10:2025 renumbers categories (A03 is now Software Supply Chain Failures, Injection is A05); web-security says to cite 2025 ids.
- The phase's match check also returns forms-and-failures for Form.test.tsx (its *Form* path): expected, the criterion only requires the three new modules on their own paths.

**Backlog candidates:** None.

**For Phase 5:** Last phase: the plan is complete. auth-sessions' pointer to esq:privacy-loi25 and prisma-postgres' pointer to testing-pitfalls now resolve. The Rollout's (user) step remains: publish with ./scripts/update.sh and observe a Stripe project's session line.
