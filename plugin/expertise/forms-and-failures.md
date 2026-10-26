---
name: forms-and-failures
description: Forms and what a screen shows when a request fails. Use before writing or changing a form, a submit or save button, a dialog that sends data, a shared HTTP or API client, client or server validation, or the loading, error, empty and offline states of a screen.
---

# Forms and failures: every request ends in something visible

**As of:** 2026-10-25

**Paths:** `forms/`, `*Form.*`, `*-form.*`, `schemas/`, `*Dialog.*`, `api-client.*`, `http.*`

**Stack:** `react-hook-form`, `zod`, `formik`, `@tanstack/react-form`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a library's behaviour, and keep going.**

**A project skill on the same topic wins** where the two disagree. Contrast, focus indicators and accessible names belong to `esq:accessibility`; translated copy and locale formats to `esq:i18n-fr-en`.

A form is where a user hands the product their work. Each rule below exists because breaking it either loses that work or leaves the user unsure whether it was kept.

**These rules come from shipped projects, except one.** Mapping server field errors back onto their fields (below) is documented practice that no shipped project here has tested end to end yet. Treat it as a hypothesis to verify in the first form that relies on it.

## The request

- **Every request a control sends ends in something visible: success, or an error message.** Never only the button going back to its normal state. *Why:* when no answer comes back (offline, a server restarting, a proxy's error page with no CORS headers), `fetch` rejects with a `TypeError` instead of returning a response ([MDN `fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions), checked 2026-10-25). An unguarded `await` then throws past the component, the spinner stops, and the user sees nothing. *Fix:* resolve that rejection to a network-error result in the one shared HTTP client (and the auth client, if separate), so every form inherits it; give any call outside those clients the same guarantee. *Check:* on a built app, point the API base URL at a closed local port, press every submit button on the changed screens, and see a message each time. A jsdom test with a mocked `fetch` does not prove it: the mock decides what rejects.
- **An app store files a silent button as broken.** On a mobile build, see `esq:store-review` for the reviewer's consequence.
- **A double submit sends one request.** *Why:* a second click while the first request is in flight creates a duplicate record or charges twice; the network is slowest exactly when users click again. *Fix:* disable the submit while pending (and show that it is pending), and make a create idempotent on the server where a duplicate costs money or data (an idempotency key, or a unique constraint the handler turns into "already done"). *Check:* throttle the network in devtools, double-click submit, count the requests and the rows.

## The user's input

- **A failure never clears what the user typed.** *Why:* the form state is the only copy of their work; resetting it on error (or remounting the form because a parent re-keyed it) makes them retype everything, and many won't. *Check:* fill every field, make the request fail, confirm every field still holds its value.
- **Unsaved changes are shown, and save is disabled while nothing changed.** *Why:* without a dirty indicator the user cannot tell whether leaving loses work; an always-enabled save sends no-op writes and hides whether the last save took. Compare against the last saved values, not against "touched": typing and erasing returns to clean. Warn before navigating away from a dirty form (route guard plus `beforeunload`). *Check:* edit a field, see the indicator and an enabled save; restore the original value, see both go back.
- **Create and edit are built from the same field components.** *Why:* two implementations of one field drift: a validation rule or an option list fixed in one is still broken in the other, and an edit screen redesigned on its own has lost capabilities the create screen kept. *Check:* each field the edit screen shows is imported from the same component the create screen uses.

## Validation

- **The client validates for speed, the server validates for truth, and both use the same rules where they can.** *Why:* client checks can be bypassed or stale; server checks are the only ones that hold. If a schema library is shared between the two (Zod, Valibot, Yup in a TypeScript monorepo), define the schema once and import it on both sides; otherwise the server's rules decide and the client's are a subset.
- **The server's field errors land on their fields.** *Why:* a 400 shown as one toast ("Validation failed") leaves the user guessing which of twelve fields is wrong. Return errors keyed by field path, and map them onto the form's field errors (with react-hook-form, `setError(path, …)` for each). An error with no matching field goes in a message at the top of the form, never nowhere. *Check:* send a value the client accepts and the server refuses (a duplicate email), and see the error under that field.
- **On a failed submit, focus moves to the first field in error.** *Why:* the error may be off-screen, and a screen reader user hears nothing changed. Error text is tied to its field, as `esq:accessibility` describes. *Check:* submit an invalid form with the keyboard alone and land on the first error.

## The states of a screen

- **Every screen that loads data has four states, each designed: loading, error, empty, and loaded.** Offline is a fifth wherever the app runs on a phone. *Why:* the one left undesigned is the one a new user or a bad network sees first. An empty list with no explanation reads as broken; an error rendered as an empty list reads as data loss. The empty state says what goes here and offers the action that fills it. The error state says what failed and offers a retry. Loading keeps the layout's shape (a skeleton) rather than a blank screen. *Check:* force each state (no data, a failing API, a slow API) and look at it.

## Option lists

- **Options are sorted by their label in the user's language, with `localeCompare`, unless the set has an order of its own.** *Why:* an order taken from the database or from the source language's keys looks random once translated, and the user scans an alphabet they know. `a.label.localeCompare(b.label, locale)` (or an `Intl.Collator` reused across the sort) sorts accents and case correctly; `<` and `>` do not (`É` sorts after `z`). Ordered sets keep their order: dates, sizes, priorities, workflow steps, "most used" lists. *Check:* switch language and see the list re-sort.
