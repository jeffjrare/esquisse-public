---
name: dates-and-timezones
description: Instants, local days and time zones. Use before storing or displaying a date or time, adding a date column or field, computing "today", a day boundary, a schedule or a recurrence, adding days to a date, accepting a time-zone parameter, parsing a date string, or writing a test that depends on the clock.
user-invocable: false
---

# Dates and time zones: an instant, a local day, and whose zone

**As of:** 2026-10-25

**Paths:** `*Date*`, `date.*`, `dates.*`, `dates/`, `*Time.*`, `*TimeZone*`, `*Timezone*`, `*time-zone*`, `*timezone*`, `timezones/`, `tz.*`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on an engine's support or behaviour, and keep going.**

**A project skill on the same topic wins** where the two disagree. How a date is *written* in French or English (`fr-CA` formats, month names) belongs to `esq:i18n-fr-en`; a date field's validation and error display to `esq:forms-and-failures`. This skill owns what is stored, which zone decides a local day, and the arithmetic in between.

Date bugs pass every test written on the author's machine: the author's zone, the author's season, the author's hour. They surface in production, at midnight, twice a year, or for the user abroad. Each rule below says how to see one before then.

**One rule here is documented, not tested in a shipped project:** the Temporal fallback (below) follows MDN's compatibility data and the polyfills' documentation; no shipped project here runs Temporal behind a polyfill yet. Prove it in the first module that adopts it, on Safari.

## What is stored

- **An instant is stored in UTC, as an instant type; a calendar date is stored as a date, not as midnight.** In PostgreSQL that is `timestamptz` for an instant (it stores UTC and converts on the way in and out) and `date` for a birthday, a due date or a "day of" record. *Why:* `timestamp` without a zone stores whatever wall clock the writer was in, and the reader cannot recover which. A date stored as `2026-03-08T00:00:00Z` shows as March 7 to anyone west of Greenwich. Conditional on Prisma: `DateTime` maps to `timestamp(3)` by default; add `@db.Timestamptz` for an instant and `@db.Date` for a date. *Check:* read the migration's column types for every date field this change adds.
- **`new Date('YYYY-MM-DD')` is parsed as UTC midnight, while `new Date('YYYY-MM-DDTHH:mm')` is parsed as local time.** *Why:* the ECMAScript date-time string format treats a date-only form as UTC and a date-time form without an offset as local ([MDN `Date.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse), checked 2026-10-25). So `new Date('2026-03-08').getDate()` returns 7 in Montréal. *Fix:* keep a calendar date as its `YYYY-MM-DD` string (or a `Temporal.PlainDate`) end to end, and build a `Date` only from an explicit instant or explicit parts in an explicit zone. *Check:* grep the change for `new Date(` on a string argument.

## Whose zone

- **A local day ("today", "this week", a daily limit, quiet hours) is computed in an explicit zone passed as a required parameter, and the owner of the data is the authority for it**: the user, or the organisation when several people share one calendar. *Why:* a defaulted or omitted zone falls back silently to the server's or the device's, nothing on screen says so, and two members of the same organisation then see the same record on different days. *Fix:* store the zone on the owner (an IANA name, e.g. `America/Toronto`), read it in one place, and make it a required argument (placed last, no default) of every function that cuts days. *Check:* a function signature in the change that computes a day without a zone argument is the bug.
- **A background job reads the zone off the stored owner, never from the process.** *Why:* a job has no request and no device; `new Date().getHours()` there is the server's hour, so a 22:00 cut-off fires at 22:00 UTC.
- **The server's or CI's zone differs from production's, and from the user's.** Containers usually run in UTC; a laptop runs in its owner's zone. Code that calls `getHours()`, `getDate()`, `setHours(0)` or `toLocaleDateString()` without a `timeZone` option is computing in whichever of those it runs on. *Check:* run the date tests under `TZ=UTC` and under a zone with DST (below).
- **Validate an incoming zone by constructing `Intl.DateTimeFormat` with it, never by looking it up in `Intl.supportedValuesOf('timeZone')`.** *Why:* that list holds canonical names only and omits links: Node 22 returns it without `America/Montreal` (a link to `America/Toronto` in the [IANA tz database](https://www.iana.org/time-zones)) and without `Europe/Kyiv`, so a lookup refuses zones the system itself reports. `new Intl.DateTimeFormat('en', { timeZone: tz })` accepts any valid name, link included, and throws `RangeError` otherwise. Do not compare `resolvedOptions().timeZone` with the input either: Node 22 resolves `America/Montreal` to `America/Toronto` (checked 2026-10-25, Node 22.22), and engines are moving to returning the input name. *Check:* a test validates `America/Montreal`, `UTC` and a garbage name.

## Arithmetic across DST

- **Adding a day is calendar arithmetic in a zone, not adding 24 hours.** *Why:* in Montréal (`America/Toronto`), clocks jump from 02:00 to 03:00 on the second Sunday of March and fall back from 02:00 to 01:00 on the first Sunday of November (2026: March 8 and November 1). From midnight on March 8, `+ 24 * 3600 * 1000` ms lands on March 9 at **01:00**; from midnight on November 1, it lands on November 1 at **23:00**. A daily schedule built that way drifts an hour, and a "per day" bucket double-counts or skips. *Fix:* add days in the zone (`Temporal.ZonedDateTime.add({ days: 1 })`, date-fns' `addDays` on a `TZDate` from `@date-fns/tz`, Luxon's `plus({ days: 1 })` on a zoned `DateTime`), and reserve millisecond arithmetic for durations.
- **A local time can fail to exist or exist twice.** 02:30 on March 8, 2026 does not exist in Montréal; 01:30 on November 1, 2026 happens twice (once in EDT, once in EST). *Why:* a reminder set for 02:30 daily silently moves or vanishes once a year, and an event logged at 01:30 is ambiguous without its offset. *Fix:* store the instant (or the offset with the local time), and choose the disambiguation explicitly where a wall-clock time is converted (Temporal's `disambiguation: 'compatible' | 'earlier' | 'later' | 'reject'`). *Check:* a test schedules across both 2026 transitions.
- **SQL that groups by local day or hour converts in the query, with the zone bound as a parameter.** *Why:* `date_trunc('day', created_at)` on a `timestamptz` truncates in the session's zone; `created_at AT TIME ZONE $1` makes the zone explicit. A zone concatenated into the SQL string is an injection point when users or admins set it.

## Temporal and its fallback

- **Temporal is not yet usable everywhere; ship it only behind a polyfill.** Per [MDN's compatibility data](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal#browser_compatibility) (`@mdn/browser-compat-data` 8.1.7, checked 2026-10-25): Chrome, Edge and Android WebView 144, Firefox 139, Node.js 26, Deno 2.7; **Safari only in Technology Preview, and no iOS browser or WKWebView**, so every iPhone user, and every Capacitor iOS app, lacks it. MDN marks it "Limited availability", not Baseline. *Fix:* import from `@js-temporal/polyfill` or `temporal-polyfill` rather than relying on the global, or use a mature library (date-fns with `@date-fns/tz`, Luxon) until Safari ships it. *Check:* `typeof Temporal` in the oldest supported Safari is `'undefined'`; the change must not reach the global there.

## Tests

- **A test that depends on the date pins both the clock and the zone.** *Why:* an unpinned test passes today and fails at month end, on a DST weekend, or on a CI runner in UTC. *Fix:* fake the clock (`vi.useFakeTimers(); vi.setSystemTime(...)` in Vitest, `jest.useFakeTimers().setSystemTime(...)` in Jest), and set the zone for the process before it starts (`TZ=America/Toronto vitest run` in the test script; setting `process.env.TZ` mid-run is not reliable across platforms). Run the date suites under at least two zones: `UTC` and one with DST; a zone far east (`Pacific/Auckland`) catches day-boundary bugs that both miss. *Check:* the test script names `TZ=`, and a test pins a time on each 2026 transition.
