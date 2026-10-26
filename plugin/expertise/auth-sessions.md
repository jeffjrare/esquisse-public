---
name: auth-sessions
description: Sign-in, sessions and account deletion: cookies, CSRF, rotation, revocation and native OAuth tokens. Use before writing or changing a login, signup, logout or password-reset flow, a session cookie or token, an auth library's configuration, a role or permission change, a native app's sign-in, or what deleting an account does.
---

# Auth and sessions: who is signed in, and how that ends

**As of:** 2026-10-26

**Paths:** `auth/`, `*Auth*`, `*auth.*`, `sessions/`, `*Session*`, `*Login*`

**Stack:** `better-auth`, `next-auth`, `@auth/*`, `lucia`, `passport`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a library default, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree. A native shell's cookie origin, Keychain storage and App-Bound Domains belong to `esq:capacitor-ios` (and the Android shell's to `esq:capacitor-android`); what App Store and Play reviewers require of sign-in methods and account deletion to `esq:store-review`; how long an account's personal information is kept after deletion to `esq:privacy-loi25`. This module owns how a session is issued, protected, rotated and ended.

An auth bug works on every demo: the author logs in, logs out, logs in. It shows up as someone else's session still alive, a request the user never made, or a "deleted" account that still signs in. Each rule below says how to see it first.

**These rules are documented, not yet tested in a shipped project.** They follow the OWASP cheat sheets and better-auth's documentation, checked on the date above. Treat each as a hypothesis to prove in the first flow that relies on it.

## The session cookie

- **A session cookie is `HttpOnly`, `Secure` and `SameSite=Lax` or `Strict`, host-only, with the narrowest path.** *Why:* without `HttpOnly` an XSS reads the session; without `Secure` it travels over plain HTTP; a `Domain` set to the parent domain sends it to every sibling subdomain, including the marketing site's third-party scripts. The `__Host-` prefix makes the browser enforce `Secure`, `Path=/` and no `Domain` ([OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), checked 2026-10-26). `SameSite=None` is only ever set with `Secure`, and only when a cross-site client truly needs the cookie. *Check:* read the `Set-Cookie` header of the login response in production mode, not in dev (some libraries drop `Secure` on `http://localhost`).
- **Conditional on better-auth:** cookies are `HttpOnly` and `SameSite=Lax` by default and `Secure` when the base URL is `https`; `crossSubDomainCookies` widens the domain and is off by default ([security](https://www.better-auth.com/docs/reference/security), checked 2026-10-26). Turn it on only with the most specific domain that works.

## CSRF, by method and origin

- **No state change on `GET`, and every state-changing method checks where the request came from.** *Why:* `SameSite=Lax` still sends the cookie on a cross-site top-level `GET`, and treats sibling subdomains as same-site, so it is defence in depth, not the defence ([OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), checked 2026-10-26). *Fix:* the framework's CSRF protection, or reject a non-safe method whose `Sec-Fetch-Site` is `cross-site`, falling back to an exact match of `Origin` (then `Referer`) against an allow-list; never allow-list `Origin: null`, and match the whole origin, so `example.org.attacker.com` fails. A signed double-submit token is the stateless option; the naive double-submit cookie is not. *Check:* a test sends the state-changing request with a foreign `Origin` and expects 403.
- **The login form needs it too.** *Why:* login CSRF signs the victim into the attacker's account, and what they type next (a card, a document) lands there. Rotation (below) closes the fixation half.
- **Conditional on better-auth:** state-changing routes require a non-simple request, `Origin` is checked against `trustedOrigins` (the base URL by default), and a request with no `Origin`, `Referer` or Fetch Metadata passes, which is how a native client gets through. `disableCSRFCheck` and `disableOriginCheck` turn the protection off, the second silently; neither belongs in production. Native schemes (`myapp://`) go in `trustedOrigins`; `localhost` does not.

## Rotation and revocation

- **Issue a new session id on login and on every privilege change (role, password, MFA enrolment), and destroy the old one.** *Why:* an id set before login and kept after it is a fixation: whoever planted it is now signed in as the user. *Check:* capture the session cookie before and after login and after a role change; all three differ, and the earlier ones are refused.
- **Logout and revocation happen on the server.** *Why:* clearing the cookie leaves a stolen copy working. Logout deletes the server-side session; a password change or a "sign out everywhere" ends every other session.
- **A cached session outlives its revocation by the cache's lifetime.** *Why:* conditional on better-auth, the cookie cache (`session.cookieCache`, `maxAge` in seconds) lets a revoked session keep working on other devices until it expires; sessions last 7 days by default, extended on use ([session management](https://www.better-auth.com/docs/concepts/session-management), checked 2026-10-26). *Fix:* a short `maxAge`, or `disableCookieCache: true` on sensitive reads; `revokeSessions` / `revokeOtherSessions` after a password change. The same holds for any stateless JWT session: its lifetime is the revocation delay. *Check:* revoke a session from a second device and time how long the first keeps working.

## Native OAuth and tokens

- **A native app signs in through the system browser with PKCE, never an embedded WebView login.** *Why:* an embedded view can read the password and providers block it; the system browser (`ASWebAuthenticationSession`, Custom Tabs) with PKCE and a claimed redirect is the documented pattern ([RFC 8252](https://www.rfc-editor.org/rfc/rfc8252), checked 2026-10-26). The shell's redirect scheme and entitlements are the platform modules' rules.
- **The server verifies a provider's ID token before trusting anything in it.** Signature against the provider's keys, `iss`, `aud` equal to this app's client id (each platform's client id when they differ), `exp`, and the `nonce` it issued. *Why:* an ID token minted for another app, or an email claim the client simply sends, signs anyone in as anyone. Link an existing account by the provider's subject id, and by email only when the provider marks it verified.
- **A native app's own session is a token the server can revoke.** Short-lived access, a refresh token stored only in the platform's secure storage, rotated on use, and refused once revoked. *Why:* a long-lived bearer token in plain storage is a session nobody can end.

## Account deletion that really deletes

- **Deleting an account ends every session, revokes every third-party grant, and removes or anonymises the person's data in one recorded operation.** *Why:* a flag that hides the account while its sessions, refresh tokens and provider grants live on is a deactivation, and both stores reject it. *Fix:* in order: revoke all sessions and refresh tokens; revoke provider tokens where the provider requires it (Sign in with Apple: `esq:store-review`); cancel what bills the person (`esq:payments-stripe`); delete or anonymise rows, and send jobs that would still email them nowhere. What must legally be kept, and for how long, is `esq:privacy-loi25`'s. *Check:* delete a test account, then try its old cookie, its refresh token and a fresh sign-in with the same provider; each must fail or create a new, empty account.
