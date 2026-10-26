---
name: web-security
description: Server-side web security: input trust, injection, object-level authorization, SSRF, CORS, CSP, rate limits and secrets. Use before writing or changing a route or an API handler, middleware, a query built from input, a fetch to a URL a user supplied, CORS or security headers, a login or other expensive endpoint, what the client bundle or the logs contain, or the project's dependencies.
---

# Web security: every byte from the client is the attacker's

**As of:** 2026-10-26

**Paths:** `middleware/`, `middleware.*`, `routes/`, `*cors*`, `*csp*`, `server.*`

**Stack:** `express`, `fastify`, `hono`, `next`, `@nestjs/core`, `koa`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a list or a framework default, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree. Session cookies, CSRF, rotation and revocation belong to `esq:auth-sessions`; webhook signatures to `esq:payments-stripe`; what a form shows when the server refuses it to `esq:forms-and-failures`. This module owns what the server trusts, what it lets through and what it leaks.

A security hole never shows in the author's own use: the author sends the requests the UI builds. It shows when someone edits an id in the URL, points a URL field at the cloud's metadata address, or reads the bundle. Each rule below says how to send that request first.

**These rules are documented, not yet tested in a shipped project.** They follow the OWASP Top 10 and cheat sheets and MDN, checked on the date above. Treat each as a hypothesis to prove on the first route that relies on it.

## The current list

- **The OWASP Top 10 is the 2025 edition** ([OWASP Top 10:2025](https://top10.owasp.org/2025/), checked 2026-10-26): A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions. Cite a category by its 2025 id; a 2021 id (`A03:2021 Injection`) now names something else.

## Input and queries

- **Validate every input at the boundary, against a schema, and keep only the fields the handler expects.** *Why:* a body passed whole to an ORM's `update` lets a client set `role`, `ownerId` or `price` (mass assignment); a type the code assumes (`string`) arrives as an object or an array and changes what a query means. *Fix:* parse with a schema (zod, valibot, the framework's validator) into a new object, reject unknown keys on writes, bound lengths and sizes. *Check:* send the route an extra `role` field and a value of the wrong type; the first is ignored or refused, the second gets a 400.
- **Queries take input as parameters, never as concatenated text.** *Why:* a string built from input is an injection point whatever the ORM: Prisma's `$queryRawUnsafe`, Knex's `raw` with interpolation, a sort column or an `ORDER BY` direction passed through. *Fix:* the tagged or parameterised form (`$queryRaw` with a template, `?` placeholders); a column or direction comes from an allow-list, never from the request. *Check:* grep the change for `Unsafe`, `raw(` and template strings inside SQL, and send `'` and `1 OR 1=1` to each filter.

## Authorization per object

- **Every handler that reads or changes a record checks that this user may touch this record, on the server, in the query.** *Why:* an id in a URL or a body is attacker input. Changing `/invoices/41` to `/invoices/42` returns someone else's invoice when the handler only checked that a user is signed in; this is A01, the top category. *Fix:* scope the query by owner or tenant (`where: { id, orgId: session.orgId }`), so a foreign id finds nothing, and return 404 rather than 403 to avoid confirming it exists. *Check:* a test signs in as user B and requests user A's record by id, for every route the change adds; each answers 404.

## Outbound requests to a URL a user gave

- **A server fetching a user-supplied URL is SSRF unless the destination is checked after resolution.** *Why:* a link preview, an import-from-URL or a webhook target pointed at `http://169.254.169.254/` reads the cloud's instance credentials, and one pointed at `localhost` reaches the admin port. *Fix:* an allow-list of destinations when the feature permits one; otherwise resolve the name, refuse private, loopback, link-local and metadata ranges in IPv4 and IPv6, connect to the validated address (so DNS rebinding cannot swap it), and turn off redirect following ([OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), checked 2026-10-26). *Check:* submit `http://127.0.0.1`, `http://[::1]`, `http://169.254.169.254` and a public URL that redirects to one of them; all are refused.

## CORS and CSP

- **CORS with credentials names exact origins, from an allow-list, with `Vary: Origin`.** *Why:* the browser refuses `Access-Control-Allow-Origin: *` on a credentialed request, so code "fixes" it by echoing the request's `Origin`, which hands every site the user's session; a response that changes by origin without `Vary: Origin` is cached for the wrong one ([MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), checked 2026-10-26). *Fix:* compare the whole origin against a fixed list, and send `Access-Control-Allow-Credentials: true` only for those. CORS protects the response from being read, never the server from the request: CSRF is still `esq:auth-sessions`'s. *Check:* `curl -H 'Origin: https://evil.example' -I` on an authenticated route shows no `Access-Control-Allow-Origin`.
- **A Content-Security-Policy is sent, without `unsafe-inline` for scripts.** *Why:* it is what still stands when an XSS gets through: it stops an injected inline script and limits where scripts load from and where data is sent. *Fix:* start in `Content-Security-Policy-Report-Only` to find what breaks, then enforce with nonces or hashes for the scripts the app needs, `object-src 'none'`, `base-uri 'none'` and `frame-ancestors` set. *Check:* the production response carries the header, and the browser console shows no violation on the main journeys.

## Rate limits

- **Login, signup, password reset, code verification and every endpoint that costs money or CPU are rate-limited per account and per IP, on the server.** *Why:* without it a password is guessed, a six-digit code is enumerated in hours, a reset or SMS endpoint is used to spam strangers on the project's bill, and an expensive export takes the server down. *Fix:* a limiter in front of those routes, keyed on the target account as well as the IP (one IP rotates; one account does not), with a shared store when more than one instance runs; behind a proxy, read the client IP only from the proxy's trusted header (`trust proxy` set to the actual hop count). *Check:* script twenty failed logins for one account and see the 429 before the twentieth.

## Secrets and logs

- **Nothing secret reaches the client bundle.** *Why:* the bundler inlines every variable it is told is public: Vite exposes `VITE_*`, Next.js `NEXT_PUBLIC_*`; a secret given that prefix, or imported into a client component, is in the JavaScript anyone downloads. *Fix:* secrets only in server code and unprefixed variables; a key the client must hold is a publishable one. *Check:* build for production and grep the output directory for the start of each secret (`sk_`, the database host, the JWT secret).
- **Logs carry no secret and no needless personal information.** *Why:* request logging that dumps headers or bodies writes session cookies, authorization headers, passwords and card details into a store with weaker access than the database, and keeps them; an error page that returns the stack trace tells the attacker the stack (A10). *Fix:* redact `authorization`, `cookie`, `password`, tokens and payment fields in the logger's configuration; return a generic error and log the detail server-side. What personal information may be kept, and how long, is `esq:privacy-loi25`'s.

## Dependencies

- **Dependencies are audited and locked.** *Why:* supply chain failures are A03: a vulnerable transitive package, or an install that resolves a different version than the one tested. *Fix:* commit the lockfile and install with `npm ci` (or the package manager's frozen mode) in CI and deploys; run `npm audit --omit=dev` (or the equivalent) in CI and fix or record each high finding; review a new dependency's install scripts and maintainers before adding it. *Check:* the CI log shows the audit step and the frozen install.
