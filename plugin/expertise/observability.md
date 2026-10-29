---
name: observability
description: Error tracking and uptime that point to the release, the original source line and nothing personal. Use before installing or configuring a Sentry-compatible SDK or a self-hosted Bugsink, uploading sourcemaps, setting a release or environment, scrubbing what the SDK sends, catching crashes and unhandled rejections, instrumenting a Capacitor app, adding a health endpoint or an uptime check, or tuning alerts.
---

# Observability: an error you can read, from the commit that caused it

**As of:** 2026-10-28

**Paths:** `*sentry*`, `*Sentry*`, `instrument.*`, `monitoring/`, `*observability*`

**Stack:** `@sentry/*`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on an SDK option or default, and keep going.** Sentry's SDK options move between versions; re-check the one in `package.json` before relying on a name below.

**A project skill on the same topic wins** where the two disagree. Which secrets and personal fields never reach any log belongs to `esq:web-security`; whether sending personal information to an error tracker hosted outside Québec needs an assessment to `esq:privacy-loi25`; where the deploy calls the health endpoint, and rolls back on it, to `esq:deploy-vps`. This module owns what the error tracker receives, how an error resolves to its source, and how the team hears the app is down.

An observability gap is invisible until the one night it matters: the error arrives as `a.b is not a function` at `index-4f2c.js:1:20931`, from no release, mixed with staging noise, or never arrives because the process died first. Each rule below says how to see that on a calm day.

**These rules are documented, not yet tested in a shipped project.** They follow the Sentry JavaScript, Bugsink and Node.js documentation, checked on the date above, and state the general rule first; Sentry and Bugsink specifics are conditional. Treat each as a hypothesis to prove in the first release that relies on it.

## One SDK, initialised first

- **The error tracker is initialised before anything else loads, once per process.** *Why:* the SDK instruments modules as they load; an `import` of the HTTP framework or the database client before `init` is not traced, and an error thrown during startup is lost. *Fix, conditional on `@sentry/node`:* a separate `instrument.*` file calling `Sentry.init`, loaded ahead of the app (`node --import ./instrument.mjs app.mjs`, or pm2's `node_args`) ([Node ESM setup](https://docs.sentry.io/platforms/javascript/guides/node/install/esm/), checked 2026-10-28). Without a `dsn` the SDK sends nothing, which is how a missing environment variable silences production. *Check:* start the production build with the DSN unset and see the startup log say so; set it and see a test event arrive.
- **A self-hosted tracker speaks the same SDK.** *Conditional on Bugsink:* it accepts events from the Sentry SDKs pointed at a Bugsink DSN, and supports sourcemaps from 2.0.14 with `sentry-cli` ([Bugsink sourcemaps](https://www.bugsink.com/docs/sourcemaps/), checked 2026-10-28). Features beyond errors (tracing, replay) are not promised by those docs: do not plan on them without checking the version in use.

## A stack trace that reads as source

- **Sourcemaps are uploaded on every release build and never served publicly.** *Why:* a minified trace points to column 20 931 of one line; a sourcemap left in the deployed output hands anyone the original source. *Fix, conditional on Sentry:* the bundler plugin (Vite, webpack, Rollup, esbuild) or `sentry-cli` injects debug IDs and uploads during the build ([sourcemaps](https://docs.sentry.io/platforms/javascript/sourcemaps/), checked 2026-10-28); generate maps as `hidden`, and delete them after upload (`filesToDeleteAfterUpload`) or deny `*.js.map` at the web server ([Vite upload](https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/), checked 2026-10-28). *Conditional on Bugsink:* `sentry-cli sourcemaps inject` then `sourcemaps upload`; it matches by debug ID, never by file name or release. Upload before the release serves traffic, or its first errors stay minified. *Check:* `curl -I https://…/assets/<bundle>.js.map` answers 404, and the deliberate error below resolves.
- **The check is a deliberate error thrown from a production build.** *Why:* every step above can fail silently (maps not generated, upload skipped in CI, a debug ID mismatch), and only a real event proves the chain. *Fix:* a guarded route or a console command that throws a known error in production, run after each change to the build or the SDK. *Check:* the event shows the original file and line, the release and the environment.

## Every error belongs to a release and an environment

- **`release` and `environment` are set explicitly from the build.** *Why:* without a release, an error cannot be tied to the commit that introduced it, a regression cannot be told from an old bug, and sourcemaps keyed by release do not apply; staging and local errors in the production project bury real ones. *Fix:* release from the commit (`SENTRY_RELEASE=$(git rev-parse --short HEAD)` at build time, the same value in the browser and server bundles), environment from the deploy target (`SENTRY_ENVIRONMENT`), never left to a default (Sentry's docs give `production` and also "development or production depending on packaging"). *Check:* an event from staging carries `environment: staging` and the deployed commit.

## What the SDK sends

- **The SDK sends no personal information it was not told to.** *Why:* request bodies, cookies, headers, IP addresses and the signed-in user are what an error tracker collects most readily, and it keeps them in a third-party store. *Fix, conditional on Sentry:* `sendDefaultPii` stays `false` (deprecated from SDK 10.54 per Sentry's docs in favour of `dataCollection`, which collects cookies and query parameters by default once an object is passed: set each category deliberately) ([options](https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/), checked 2026-10-28); a `beforeSend` that strips or redacts what remains, returning `null` to drop an event; `setUser` with an opaque id, never an email. What counts as a secret or personal field is `esq:web-security`'s and `esq:privacy-loi25`'s. *Check:* trigger an error from a signed-in request carrying a password field, and read the stored event: no cookie, no password, no email.

## Nothing dies unreported

- **Unhandled rejections and uncaught exceptions reach the tracker before the process exits.** *Why:* since Node 15 an unhandled rejection with no `unhandledRejection` listener is raised as an uncaught exception and kills the process ([`--unhandled-rejections`](https://nodejs.org/api/cli.html#--unhandled-rejectionsmode), checked 2026-10-28); the process manager restarts it, and without a report the only trace is a restart count. *Fix:* keep the SDK's default global handlers; a handler of your own reports, flushes (`await Sentry.flush(2000)`) and then exits, never swallows and carries on in an unknown state. *Check:* throw inside a `setTimeout` and reject an un-awaited promise in staging; both events arrive and pm2 (or systemd) shows the restart.
- **A Capacitor app reports both its web and its native layer.** *Why:* a JavaScript error and a native crash (a plugin, an out-of-memory kill) are different failures; the web SDK alone never sees the second. *Fix, conditional on `@sentry/capacitor`:* initialise it with the framework SDK's `init` as its second argument (`Sentry.init(options, SentryReact.init)`), and upload iOS dSYMs and Android mapping files with the build ([Capacitor](https://docs.sentry.io/platforms/javascript/guides/capacitor/), checked 2026-10-28). The shells' build specifics are `esq:capacitor-ios`'s and `esq:capacitor-android`'s. *Check:* a test build sends one JavaScript error and one native crash, each symbolicated.

## Up, and told when it is not

- **A health endpoint says whether this instance can serve, and an outside check calls it.** *Why:* a process that is up but cannot reach its database answers every request with a 500, and a server that is down sends no error at all, so the tracker stays silent exactly when the app is unreachable. *Fix:* `GET /health` that checks the dependencies a request needs (a `SELECT 1`, the cache ping) with a short timeout, answers 200 or 503, carries no secret and no version detail an attacker could use, and is excluded from rate limits and access logs; an uptime monitor outside the server's network calls it every minute or so and alerts after consecutive failures. Calling it during a deploy is `esq:deploy-vps`'s. *Check:* stop the database in staging; the endpoint answers 503 and the monitor alerts.

## Alerts someone still reads

- **An alert fires on something new or something rising, and goes to a person.** *Why:* an alert on every event trains the team to mute the channel, and the real outage arrives muted. *Fix:* alert on a new issue, a regression in a resolved one, and an error-rate or uptime threshold; ignore or fingerprint known noise (browser extensions, bots, cancelled requests) at the SDK (`ignoreErrors`, `denyUrls`) rather than resolving it by hand; route production alerts to someone, staging to nowhere. *Check:* over a normal week, count alerts that led to an action; one that never did is tuned or removed.
