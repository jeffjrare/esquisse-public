---
name: testing-pitfalls
description: Tests that lie: mocks that encode the bug, tests that pass with the feature removed, shared state, real databases and flaky waits. Use before writing or changing a test, a mock or a fixture, test setup or teardown, a test runner's configuration, an end-to-end test, a snapshot, or before deciding that a change is covered because its tests are green.
---

# Testing pitfalls: a green test that proves nothing

**As of:** 2026-10-26

**Paths:** `tests/`, `test/`, `__tests__/`, `e2e/`, `*.test.*`, `*.spec.*`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`

**Stack:** `vitest`, `jest`, `@playwright/test`, `mocha`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a runner's API, and keep going.**

**A project skill on the same topic wins** where the two disagree. Pinning the clock and the time zone belongs to `esq:dates-and-timezones`; how a migration is written to lose nothing to `esq:prisma-postgres`; which failure states a form must show to `esq:forms-and-failures`. This module owns whether a test can fail when the code is wrong.

A test that cannot fail costs as much to write as one that can, and buys false confidence instead. It never announces itself: it is green in CI and green the day production breaks. Each rule below says how to make it red once, on purpose.

**These rules are general practice, not tied to one runner's release;** the Playwright specifics follow its documentation, checked on the date above.

## A test must be able to fail

- **Break the code and watch the test go red, once, before trusting it.** *Why:* a test whose assertion never runs (an `expect` inside a callback that is never called, a promise not awaited, an early `return`), or that asserts on the mock's own return value, passes with the feature deleted. *Fix:* for each new assertion, invert the condition or delete the line it guards, run the test, see it fail for the expected reason, restore. An async test `await`s or returns every promise it asserts in; `expect.assertions(n)` catches a callback that never ran. *Check:* the commit's test, run against the code with the change reverted, is red.
- **Assert on what the user or the caller observes, not on how the code got there.** *Why:* a test pinned to which internal function was called with which arguments passes when the result is wrong and fails on every harmless refactor, so it gets rewritten to match the code each time. *Fix:* assert the returned value, the rendered text, the row in the database, the HTTP response; spy on a call only when the call *is* the behaviour (an email sent, a charge made).

## Mocks

- **A mock encodes an assumption about the thing it replaces, and the bug often lives in that assumption.** *Why:* a mocked HTTP client that returns `{ data: [...] }` when the real API returns `{ items: [...] }`, a mocked database that accepts a duplicate the unique constraint refuses, a mocked payment that always succeeds: the code and its mock agree, and both are wrong. *Fix:* mock at the boundary you do not own (a third-party API, the clock, the network), never your own modules; build each fake response from a recorded real one, and keep one test per integration against the real thing (a sandbox, a container). *Check:* for each mock the change adds, name the real response it was copied from.
- **Mocks are restored between tests.** *Why:* a `vi.mock`, `jest.spyOn` or a replaced global left in place leaks into the next test, which then passes or fails depending on order. *Fix:* `restoreMocks: true` (Vitest, Jest) in the runner configuration, or `afterEach(() => vi.restoreAllMocks())`.

## Shared state and order

- **Each test builds what it needs and depends on no other test.** *Why:* a test that reads a row a previous test wrote, a module-level cache, a singleton or an environment variable set elsewhere passes in file order and fails alone, in parallel, or when a new test is inserted before it. *Fix:* create fixtures inside the test or a `beforeEach`, give each worker its own database or schema (or a transaction rolled back after each test), and reset module state. *Check:* run the file alone, run the suite in random order (`vitest --sequence.shuffle`, `jest --randomize`), and run one test with `.only`; the results do not change.

## The clock and the zone

- **A test that depends on the date pins both the clock and the zone.** The rules, the commands and the two DST transitions to test across are `esq:dates-and-timezones`'s. *Check:* the test script names `TZ=`, and the test fakes the system time.

## A real database for queries and migrations

- **Queries, constraints and migrations are tested against the same database engine as production.** *Why:* an in-memory fake or SQLite accepts what PostgreSQL refuses and refuses what it accepts: different types (`timestamptz`, `jsonb`), different collation and case rules, upsert and conflict behaviour that differs, no lock behaviour, and a unique constraint the fake never enforces. A mocked ORM proves only that the ORM was called. *Fix:* a disposable PostgreSQL of the production major version (a container, a CI service), migrated with the project's real migration command before the suite (`esq:prisma-postgres` for which one), and an integration test per query that filters, joins, upserts or relies on a constraint. *Check:* the CI job starts a database service, and a test inserts a duplicate and expects the constraint's error.

## End-to-end waits

- **An end-to-end test waits for a state, never for a duration.** *Why:* `waitForTimeout(2000)` or `sleep` is too short on a loaded CI runner and too long everywhere else, so the suite is both slow and flaky. Playwright waits before each action for the element to be visible, stable, enabled and able to receive events, and its web-first assertions (`await expect(locator).toBeVisible()`) retry until the condition holds ([actionability](https://playwright.dev/docs/actionability), checked 2026-10-26). *Fix:* act through locators and assert with `expect(locator)`; wait for the response or the text that proves the step finished (`page.waitForResponse`, a heading). A `force: true` click skips the checks that would have found the real problem. *Check:* grep the end-to-end tests for `waitForTimeout`, `setTimeout` and `force: true`.
- **A flaky test is a finding, not a retry setting.** *Why:* `retries: 3` turns an intermittent bug in the product (a race between two requests, a double submit) into a green build. *Fix:* keep retries for CI infrastructure noise, record every test that passed only on retry, and fix or quarantine it with a reason.

## Snapshots

- **A snapshot is reviewed like code, and kept small.** *Why:* a large snapshot of a rendered tree changes on every markup tweak, so `-u` is run without reading the diff, and a real regression is accepted with the rest. *Fix:* snapshot a small, stable output (a serialised value, an error message), prefer explicit assertions on what matters, and read every snapshot diff in review. *Check:* a commit that updates snapshots shows each changed one in its diff, and nobody approves a diff they did not read.
