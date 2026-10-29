# Ship the fourth expertise batch: being found and staying up

**Epic:** esq-decides-implementation-detail

**Branch:** esq/ship-expertise-batch-4

**Origin:** main

**Reviewed at:** 4041482392076f4c8cf165eb1645af106be2b1fd

## Context
ship-expertise-batch-3 moved the catalog out of skill discovery. Modules are now `plugin/expertise/<name>.md` files, picked for each session from the project's `package.json` by the `SessionStart` hook and read by plan, build and review from `esq expertise match`. Fifteen modules ship. B-196 adds five that cover what keeps a product reachable and running: deploy-vps (Ansible, pm2, nginx, Cloudflare, restarts that drop no requests), transactional-email (SPF/DKIM/DMARC, deliverability, token links), landing-seo (Astro, performance, meta, OG, sitemap), pwa-and-push (service worker, cache, FCM/APNs) and observability (Bugsink, sourcemaps). The infrastructure is in place, so adding modules costs nothing in a session whose stack does not use them. This unit only writes content, its README rows and the pointers that keep one writer per fact.

## Goal
A project that deploys to a VPS, sends email, has a landing page, ships a PWA or push notifications, or reports errors gets dated, generic expertise on the mistakes that drop requests, land mail in spam, hide the site from search, leave users on a stale app or leave errors unreadable. Its session names the modules its stack uses, and plan, build and review load them from the files a phase touches.

## Done looks like
- A new session in a project whose `package.json` depends on `pm2`, `nodemailer` and `@sentry/node` names deploy-vps, transactional-email and observability. One that depends on `astro`, `vite-plugin-pwa` and `web-push` names landing-seo and pwa-and-push. A project with neither is told about none of them.
- A plan touching `ansible/`, an `emails/` template, an `instrument.ts`, an `.astro` page or a service worker gets the matching module from `esq expertise match`, with no configuration.
- Each of the five modules states each failure mechanism, why it bites and how to check for it. A remedy that depends on a stack choice says which one (pm2 or systemd, Bugsink or Sentry, Astro or another generator, Workbox or a hand-written worker). Each platform, mailbox-provider or legal fact (bulk-sender rules, CASL, iOS web push support, FCM's API) carries its primary source and the date it was checked. None names a client project, its domains, slugs or paths.
- One writer per shared fact. Worker shutdown stays with `esq:background-jobs`. Pool size across pm2 instances stays with `esq:prisma-postgres`. Secrets and personal information in logs, CSP and rate limits stay with `esq:web-security`. Session effects of a password reset stay with `esq:auth-sessions`. The language of an email or a push stays with `esq:i18n-fr-en`. The native shell's push token and entitlement stay with `esq:capacitor-ios` and `esq:capacitor-android`, and lock-screen content rules with `esq:store-review`. Self-hosted fonts stay with `esq:design-system`. The new modules point to these and never restate them.

## Approaches considered
1. **Five modules in the batch-3 shape, through the existing catalog (chosen).** Each module gets frontmatter `name` and `description` (≤460 characters, its first sentence standing alone for the session line), `**As of:**`, `**Paths:**` and `**Stack:**`, and its rules as mechanism, *why*, *fix* and *check*. *Benefit:* zero new code. `check-plugin.sh`, `check-structure.sh`, `esq expertise match` and the hook already validate, list and announce whatever lands in `plugin/expertise/`. *Limit:* deploy-vps's tools (Ansible, nginx, Cloudflare) are not npm packages, so its `**Stack:**` is only `pm2`. A project deploying with systemd hears about it from its paths (`ansible/`, `nginx/`) through plan, build and review, but not at session start.
2. Nothing structurally different is warranted: the data model, trust boundary and pattern were settled by batch 3 (its decision `D-expertise-skills-declare-their-own-paths`, amended there). Detecting non-npm stacks (an `ansible.cfg`, an `nginx.conf`) would add detection code for one module. It is left until a session demonstrably misses deploy-vps.

## Recommendation
Approach 1, built exactly as batch 3's Phases 3 and 4: one task per module, its README row in the same commit, then the side-by-side reading of each module against its sources, recorded in the execution log.
- **Each module keeps batch 3's "documented, not yet tested in a shipped project" paragraph.** Its checks are concrete things a project can run, such as a request held open across a reload, a received message's `Authentication-Results` header, a reset link opened by a scanner and then by the user, or an installed PWA updated across a deploy. A module never claims it has observed them.
- **Owning component** (ARCHITECTURE § skills/expertise): the modules own the knowledge. No CLI, hook or check changes. If a module cannot be expressed in the parsed format, that is a defect for this unit to fix in `plugin/lib/expertise.mjs`, not a reason to bend the format.
- **Starting `**Stack:**` spans** (exact names or `@scope/*`, the only forms `stackSpanMatches` accepts; build refines them, keeping the fixture packages below matching):
  - deploy-vps: `pm2`
  - transactional-email: `nodemailer`, `resend`, `postmark`, `@sendgrid/*`, `mailgun.js`, `@aws-sdk/client-ses`, `@aws-sdk/client-sesv2`, `@react-email/*`, `react-email`, `mjml`
  - landing-seo: `astro`, `@astrojs/*`, `next-sitemap`
  - pwa-and-push: `vite-plugin-pwa`, `workbox-window`, `workbox-build`, `serwist`, `@serwist/*`, `web-push`, `@capacitor/push-notifications`, `@capacitor-firebase/messaging`, `firebase-admin`
  - observability: `@sentry/*`
- **No span collides with an existing module's.** `react` and `next` stay with accessibility and web-security, and `firebase` (auth and database users) is left out on purpose.
- **Ownership:**
  - **deploy-vps** owns:
    - reloads that drop no requests (pm2 cluster `reload` with `wait_ready`/`listen_timeout`, or systemd socket handoff, and the app closing its server on `SIGINT`);
    - nginx as reverse proxy (`proxy_set_header`, `X-Forwarded-*` and the app's trust-proxy setting, upstream keepalive, body size, timeouts);
    - Cloudflare in front: Full (strict) TLS with an origin certificate, the real client IP from `CF-Connecting-IP` restored at nginx, the origin firewalled to Cloudflare's ranges, and cache rules that never cache an authenticated response;
    - Ansible runs that are idempotent, with secrets in Vault;
    - deploy order: build, migrate, reload, health check, rollback.
  - It points to background-jobs for worker shutdown, to prisma-postgres for the pool across instances and migrate deploy, and to web-security for rate limits that need the restored IP.
  - **transactional-email** owns:
    - SPF, DKIM and DMARC with alignment, and a sending subdomain;
    - transactional and marketing mail separated;
    - the mailbox providers' bulk-sender rules (Gmail and Yahoo since 2024: DMARC, one-click unsubscribe for bulk, the spam-rate ceiling), dated;
    - bounce and complaint webhooks feeding a suppression list;
    - token links: single use, short expiry, hashed at rest, and confirmed by a POST because link scanners prefetch a GET;
    - a plain-text part and dark-mode-safe HTML;
    - CASL's line between transactional and commercial messages, dated and never as legal advice.
  - It points to background-jobs for sending from a queue, to i18n-fr-en for the recipient's language, and to auth-sessions for what a reset does to sessions.
  - **landing-seo** owns:
    - Core Web Vitals with INP, and images sized against layout shift;
    - title, description and canonical;
    - Open Graph and Twitter cards and their image size;
    - sitemap and `robots.txt`, with staging kept out of the index;
    - `hreflang` between the FR and EN pages, with the copy pointing to i18n-fr-en;
    - structured data;
    - Astro specifics, conditional (static output, islands, `@astrojs/sitemap`).
  - It points to design-system for fonts and to accessibility for semantics.
  - **pwa-and-push** owns:
    - the service worker's scope and update lifecycle (an old worker serving a stale app after a deploy; `skipWaiting` mid-session);
    - cache strategies (never cache-first for HTML or an authenticated API; versioned assets);
    - a manifest that makes the app installable;
    - web push: VAPID keys, permission asked on a user gesture, iOS web push only from a home-screen install (dated);
    - the server's token lifecycle: pruning on 404/410 or `UNREGISTERED`, and FCM's HTTP v1 API, dated.
  - It points to capacitor-ios and capacitor-android for the native token and entitlement, to store-review for lock-screen content, and to background-jobs for sending.
  - **observability** owns:
    - error tracking through a Sentry-compatible SDK, with Bugsink as the self-hosted case, conditional;
    - sourcemaps uploaded per release and never served publicly;
    - `release` and `environment` set, so an error points to a commit;
    - scrubbing what the SDK sends (`sendDefaultPii`, `beforeSend`);
    - unhandled rejections and process crashes captured;
    - a Capacitor app's native and web layers;
    - a health endpoint and an uptime check;
    - alert noise;
    - a deliberate error thrown from a production build, as the check that the error resolves to its original source line.
  - It points to web-security for secrets in logs, to privacy-loi25 for personal information sent to a processor outside Québec, and to deploy-vps for where the health check runs.
- **Sources, checked by build before it sets `**As of:**`** (at most 3 searches per fact that changes a rule):
  - the pm2 docs (graceful reload), the nginx docs, and Cloudflare's docs (SSL modes, restoring visitor IPs, IP ranges), plus the Ansible Vault docs;
  - Google's and Yahoo's sender guidelines, RFC 7489 and the DMARC docs of the provider in use, and CRTC/fightspam.gc.ca on CASL;
  - web.dev (Core Web Vitals, INP), Google Search Central (canonical, hreflang, sitemaps), the Open Graph protocol, and the Astro docs;
  - MDN and web.dev (service worker lifecycle, caching), WebKit's announcement of web push for iOS, Firebase's FCM HTTP v1 docs, and RFC 8292 (VAPID);
  - the Sentry JavaScript docs (sourcemaps, `beforeSend`) and Bugsink's docs.

## Phases

### Phase 1 — Staying up and reaching inboxes: deploy-vps, observability, transactional-email
- **Goal:** a project deploying to a VPS, reporting errors or sending email gets dated expertise on dropped requests, unreadable errors and mail landing in spam.
- **Files touched:** `plugin/expertise/{deploy-vps,observability,transactional-email}.md` (new), `plugin/expertise/auth-sessions.md`, `README.md`
- **Expertise:** `esq:background-jobs`, `esq:prisma-postgres`, `esq:web-security`, `esq:auth-sessions`, `esq:i18n-fr-en`, `esq:privacy-loi25`. Each is read so the new modules point to it instead of restating it.
- **Tasks:**
  - Task 1.1: add `deploy-vps` (Recommendation's ownership and sources).
    - **Paths** start from: `ansible/`, `deploy/`, `infra/`, `nginx/`, `*nginx*`, `ecosystem.config.*`, `playbook*`.
    - `ansible/roles/app/tasks/main.yml` and `ecosystem.config.cjs` must match.
    - Add the README row.
  - Task 1.2: add `observability`.
    - **Paths** start from: `*sentry*`, `*Sentry*`, `instrument.*`, `monitoring/`, `*observability*`.
    - `backend/src/instrument.ts` must match.
    - Add the README row.
  - Task 1.3: add `transactional-email`.
    - **Paths** start from: `email/`, `emails/`, `mail/`, `mailer/`, `*mailer*`, `*Mailer*`, `*.mjml`.
    - `backend/src/emails/passwordReset.tsx` must match.
    - In the same commit, add a pointer in `auth-sessions.md` from its password-reset scope to transactional-email for the link token, and add the README row.
    - Then read the three modules against their sources side by side and record the result in the execution log: project identifiers, mechanism, *why*, check and conditional remedies, then sources with their dates.
- **Verification:**
  - `(auto)` `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/deploy-vps.md plugin/expertise/observability.md plugin/expertise/transactional-email.md` — no match (exit 1).
  - `(auto)` `plugin/bin/esq expertise match ansible/roles/app/tasks/main.yml ecosystem.config.cjs backend/src/instrument.ts backend/src/emails/passwordReset.tsx frontend/src/App.tsx` — deploy-vps, observability and transactional-email each matched on its own paths, no entry lists `App.tsx`, and `unread` is empty.
  - `(auto)` `d=$(mktemp -d) && printf '{"dependencies":{"pm2":"1","nodemailer":"1","@sentry/node":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs` — `additionalContext` names `deploy-vps.md`, `observability.md` and `transactional-email.md`, and no other module.
  - `(auto)` `scripts/check-plugin.sh plugin` — exits 0 and reports 23 skills and 18 expertise modules, each description under 460 characters (20 after Phase 2).

### Phase 2 — Being found and staying current: landing-seo, pwa-and-push
- **Goal:** a project with a landing page, a PWA or push notifications gets dated expertise on being indexed and shared, on stale cached apps and on push that silently stops arriving, and the whole unit passes the audit.
- **Files touched:** `plugin/expertise/{landing-seo,pwa-and-push}.md` (new), `plugin/expertise/capacitor-ios.md`, `plugin/expertise/capacitor-android.md`, `README.md`
- **Expertise:** `esq:capacitor-ios`, `esq:capacitor-android`, `esq:store-review`, `esq:i18n-fr-en`, `esq:design-system`, `esq:accessibility`, `esq:background-jobs`. Each is read for pointers.
- **Tasks:**
  - Task 2.1: add `landing-seo`.
    - **Paths** start from: `*.astro`, `astro.config.*`, `landing/`, `marketing/`, `robots.*`, `sitemap*`, `*Seo*`, `*seo*`.
    - `site/src/pages/index.astro` must match.
    - Add the README row.
  - Task 2.2: add `pwa-and-push`.
    - **Paths** start from: `sw.*`, `service-worker.*`, `*serviceWorker*`, `manifest.webmanifest`, `push/`, `*Push*`, `*push*`.
    - `frontend/src/sw.ts` and `backend/src/push/send.ts` must match.
    - In the same commit, trim to a pointer any server-side sending fact restated in the Push sections of `capacitor-ios.md` and `capacitor-android.md`, keeping each shell's own facts. Also trim capacitor-ios's lock-screen content rule, which restates store-review's 4.5.4 line, to a pointer to store-review. Add the README row.
    - Then run Phase 1's side-by-side reading on the two modules and record it in the execution log.
- **Verification:**
  - `(auto)` `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/landing-seo.md plugin/expertise/pwa-and-push.md` — no match (exit 1).
  - `(auto)` `plugin/bin/esq expertise match site/src/pages/index.astro frontend/src/sw.ts backend/src/push/send.ts frontend/src/App.tsx` — landing-seo and pwa-and-push each matched on their own paths, no entry lists `App.tsx`, and `unread` is empty.
  - `(auto)` `d=$(mktemp -d) && printf '{"dependencies":{"astro":"1","vite-plugin-pwa":"1","web-push":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs` — `additionalContext` names `landing-seo.md` and `pwa-and-push.md`, and no other module.
  - `(auto)` `d=$(mktemp -d) && printf '{"dependencies":{"react":"1","next":"1","firebase":"1","express":"1","tailwindcss":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs` — against the finished catalog, `additionalContext` names none of `deploy-vps.md`, `transactional-email.md`, `observability.md`, `landing-seo.md` or `pwa-and-push.md`: no new span catches a common unrelated stack.
  - `(auto)` `./scripts/audit.sh` — PASS: plugin and structure (23 skills, 20 expertise modules, each in the README's `## Expertise`), the product suites and conformance.

## Rollout
- `(user)` Publish the release with `./scripts/update.sh`, then confirm that a new session in a project depending on `pm2` or `nodemailer` opens with the esq expertise line naming deploy-vps or transactional-email.

## Risks
- **Pre-mortem: deploy-vps is never announced.** The project most likely to need it deploys with Ansible and nginx, and neither appears in `package.json`. If it does not use pm2, its session never names the module. Plan, build and review still load it from `ansible/`, `nginx/` and `deploy/` paths, which is where deploy work happens. Non-npm detection waits for an observed miss (Approach 2).
- **Overmatching paths.** `*push*` and `*mailer*` can catch unrelated files, such as a git push helper or a `pushState` wrapper. A false match costs one module read and never gates anything. Build narrows a span when its own fixture paths show the noise.
- **Fastest-aging facts:** the Gmail/Yahoo bulk-sender thresholds, iOS web push support, FCM API versions, Cloudflare's IP ranges and INP thresholds. Each carries its source and date, and the 180-day staleness line applies.
- **A source refuses automated reads,** as LégisQuébec did in batch 3. The module then says which fact was not re-read and where to confirm it, and never asserts it as checked.
- **ARCHITECTURE and SPEC** are already stale. Refreshing them is the job of `/esq:arch` and `/esq:spec`, never a prerequisite here.

## Open questions
None. B-196 names the five domains and their scope, and batch 3 settled the pattern.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-10-28

**Plan committed at:** 8994e25

**Commits:** a9bfa11, 6d67bed, 329db76

**Verified:** 329db76861b6c9889fad7d48a98967c78c4963e0
- `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/deploy-vps.md plugin/expertise/observability.md plugin/expertise/transactional-email.md`
- `plugin/bin/esq expertise match ansible/roles/app/tasks/main.yml ecosystem.config.cjs backend/src/instrument.ts backend/src/emails/passwordReset.tsx frontend/src/App.tsx`
- `d=$(mktemp -d) && printf '{"dependencies":{"pm2":"1","nodemailer":"1","@sentry/node":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs`
- `scripts/check-plugin.sh plugin`

**What got built:** Three new expertise modules ship: deploy-vps (zero-drop reloads, nginx and Cloudflare in front, idempotent Ansible, deploy order and rollback), observability (SDK first, sourcemaps per release never served, release/environment, scrubbing, crashes reported, Capacitor layers, health and uptime, alert noise) and transactional-email (aligned SPF/DKIM/DMARC, bulk-sender rules, suppression, scanner-safe token links, text part and dark mode, CASL s. 6(6)), each with its README row; auth-sessions now points its reset link to transactional-email.

**Verification:**
- (auto) git grep for client identifiers, backlog and decision ids in the three modules: no match, exit 1 — PASS
- (auto) plugin/bin/esq expertise match ansible/roles/app/tasks/main.yml ecosystem.config.cjs backend/src/instrument.ts backend/src/emails/passwordReset.tsx frontend/src/App.tsx: deploy-vps matched the Ansible task and ecosystem file, observability instrument.ts, transactional-email passwordReset.tsx, no entry lists App.tsx, unread empty — PASS
- (auto) SessionStart hook on a package.json with pm2, nodemailer and @sentry/node: additionalContext names deploy-vps.md, observability.md and transactional-email.md and no other module — PASS
- (auto) scripts/check-plugin.sh plugin: exit 0, 23 skills and 18 expertise modules validate; descriptions 354, 409 and 419 characters (under 460) — PASS
- Side-by-side reading of the three modules against their sources: no project identifier (step 1); every rule states mechanism, why, fix and check; remedies that depend on a stack are conditional (pm2 or systemd, Sentry or Bugsink, React Email or nodemailer, nginx before or after 1.29.7); every platform, provider and legal fact cites its primary source dated 2026-10-28 (pm2 graceful start and cluster mode, nginx upstream keepalive, Cloudflare Full (strict) and restoring visitor IPs, Ansible Vault, Node --unhandled-rejections, Sentry options, sourcemaps, Vite upload and Capacitor, Bugsink sourcemaps, Gmail and Yahoo sender rules, RFC 9989, CASL s. 6 consolidated to 2026-09-30). The CRTC FAQ refused automated reads (403); the module says so and cites the statute only.
- Suite scope: content-only phase (Markdown modules, README rows, one pointer line), so no node suite was earned here; the whole ./scripts/audit.sh runs in Phase 2, the plan's last phase. Wall-clock under a minute.

**Surprises / decisions made during execution:** - DMARC is now RFC 9989 (2026, Proposed Standard), which obsoletes the RFC 7489 the plan named; transactional-email cites RFC 9989.
- Sentry's docs mark sendDefaultPii deprecated from SDK 10.54 in favour of dataCollection, whose object form collects cookies and query parameters by default; observability states both and says to set each category deliberately. The version number comes from Sentry's docs alone.
- nginx 1.29.7 made proxy_http_version 1.1 the default; deploy-vps makes the older setting conditional on the version.
- The CRTC's CASL FAQ answered 403 to automated reads; the CASL line rests on the consolidated statute and says where to confirm the interpretation.
- Sentry's docs give two conflicting defaults for environment; observability says to set it explicitly instead of naming one.

**Backlog candidates:** None.

**For Phase 2:** 1. Eighteen modules now validate; Phase 2's two bring the count to 20, and Phase 2's audit checks each has a README row (rows are alphabetical in the README table).
2. transactional-email and observability already point to esq:capacitor-ios/-android only for build specifics; pwa-and-push owns push and should point to background-jobs for sending, as these modules do.
3. Watch path noise: Phase 2's `*push*` span should be tried against a `pushState` or git-push file before it ships.

### Phase 2 — completed 2026-10-28

**Plan committed at:** 32f3463

**Commits:** 0523459, ad5ceed

**Verified:** ad5ceeda957bf0dc5614d93c0f5ee5a886bbaa0b
- `git grep -niE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' -- plugin/expertise/landing-seo.md plugin/expertise/pwa-and-push.md`
- `plugin/bin/esq expertise match site/src/pages/index.astro frontend/src/sw.ts backend/src/push/send.ts frontend/src/App.tsx`
- `d=$(mktemp -d) && printf '{"dependencies":{"astro":"1","vite-plugin-pwa":"1","web-push":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs`
- `d=$(mktemp -d) && printf '{"dependencies":{"react":"1","next":"1","firebase":"1","express":"1","tailwindcss":"1"}}' > "$d/package.json" && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$d" | node plugin/scripts/session-expertise.mjs`
- `./scripts/audit.sh`

**What got built:** Two new expertise modules ship: landing-seo (field Core Web Vitals with INP, images that reserve space and a non-lazy hero, per-page title, description and absolute canonical, Open Graph and a 1200x630 card, staging kept out by X-Robots-Tag rather than robots.txt, a sitemap of canonical URLs, reciprocal hreflang with x-default, JSON-LD matching the page, Astro's Image and sitemap integration) and pwa-and-push (the waiting worker and an update prompt, skipWaiting only from the user's reload, an uncached worker script scoped where it lives, network-first HTML and no cached authenticated API, install criteria, permission from a tap with iOS Home Screen web push, VAPID per environment and userVisibleOnly, tokens pruned on 404/410 or UNREGISTERED, FCM through HTTP v1), each with its README row; capacitor-ios and capacitor-android now point to pwa-and-push for server-side sending, and capacitor-ios to store-review for lock-screen content.

**Verification:**
- (auto) git grep for client identifiers, backlog and decision ids in landing-seo.md and pwa-and-push.md: no match, exit 1 — PASS
- (auto) plugin/bin/esq expertise match site/src/pages/index.astro frontend/src/sw.ts backend/src/push/send.ts frontend/src/App.tsx: landing-seo matched index.astro, pwa-and-push matched sw.ts and push/send.ts, no entry lists App.tsx, unread empty — PASS
- (auto) SessionStart hook on a package.json with astro, vite-plugin-pwa and web-push: additionalContext names landing-seo.md and pwa-and-push.md and no other module — PASS
- (auto) SessionStart hook on react, next, firebase, express, tailwindcss: additionalContext names accessibility.md, design-system.md and web-security.md, none of the five new modules — PASS
- (auto) ./scripts/audit.sh: Clean — 7 checks (product), exit 0; structure 23 commands and 20 expertise modules with README coverage, package 23 skills and 20 modules validate, conformance intact, product suites passed within 120 s — PASS
- Side-by-side reading of the two modules against their sources: no project identifier (step 1); every rule states mechanism, why, fix and check; stack-dependent remedies are conditional (Astro or another generator, vite-plugin-pwa or Workbox, firebase-admin or a Google Auth Library token); every platform fact cites its primary source dated 2026-10-28 (web.dev Web Vitals, Search Central canonical, robots, noindex, sitemaps, localized versions and structured data, ogp.me, Facebook sharing images, Astro images and sitemap, web.dev SW lifecycle and install criteria, MDN register and subscribe, vite-plugin-pwa prompt, WebKit web push for iOS 16.4, RFC 8292, RFC 8030, Firebase token management and auth-server). X's card docs (402) and Firebase's FCM migration guide (404) refused automated reads; each module says so and where to confirm.
- Path noise: src/lib/pushState.ts and scripts/git-push.sh no longer match pwa-and-push; src/hooks/usePushNotifications.ts does. Audit: one run.

**Surprises / decisions made during execution:** - pwa-and-push's Paths narrow the plan's starting `*push*` to `push.*`, `*webpush*` and `*web-push*` (with `push/` and `*Push*` kept): `*push*` matched a pushState helper and a git-push script.
- Firebase's token-management page now recommends registering Firebase Installation IDs over legacy registration tokens; pwa-and-push states it and says to check the SDK in use.
- RFC 8030 specifies 404 for an expired subscription; 410 for an unsubscribed endpoint is push-service practice, stated as such.
- Firebase's FCM migration guide answered 404 and X's card docs 402 to automated reads; the legacy-FCM shutdown date rests on a search quote of the guide and the X fallback is left to confirm, each said in the module.
- Astro's docs list upgrade guides up to v7; landing-seo names no Astro major version.

**Backlog candidates:** None.

**For Phase 3:** Last phase: the unit is ready for /esq:review; publishing (./scripts/update.sh) is the user's rollout step.
