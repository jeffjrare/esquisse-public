---
name: prisma-postgres
description: PostgreSQL schema changes and queries that lose no data and hold no lock too long, with Prisma conditional. Use before writing or changing a migration or schema.prisma, adding a column, index or constraint, renaming or dropping one, wrapping work in a transaction, guarding a uniqueness rule in code, or setting the database connection pool for serverless or a process cluster.
---

# Prisma and PostgreSQL: data survives every deploy

**As of:** 2026-10-26

**Paths:** `prisma/`, `schema.prisma`, `migrations/`, `*.sql`

**Stack:** `prisma`, `@prisma/client`, `pg`, `postgres`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a Prisma command or default, and keep going.** Prisma's commands moved between major versions; re-check the one in use before running it against a real database.

**A project skill on the same topic wins** where the two disagree. `timestamptz` vs `timestamp`, `@db.Date`, and grouping by local day belong to `esq:dates-and-timezones`; a duplicate submit turned into "already done" to `esq:forms-and-failures`; testing queries against a real database to `esq:testing-pitfalls`. This module owns how the schema changes and how writes stay correct under concurrency.

A migration that works on a laptop's ten rows can lock a production table for minutes or drop a column the old release still reads. Each rule below says how to see it before the deploy does.

**These rules are documented, not yet tested in a shipped project.** They follow the PostgreSQL 18 and Prisma documentation, checked on the date above. Treat each as a hypothesis to prove in the first migration that relies on it.

**Which Prisma.** On 2026-10-26, Prisma ORM 7 is the stable line and Prisma 8 a release candidate whose commands and transaction API differ (`migration plan`, `migrate`, `db.transaction` with no timeout). The Prisma rules below name Prisma 7; read `package.json` before applying one.

## Migrations that lose no data

- **A rename, a type change or a new `NOT NULL` column ships as expand, then contract, across at least two deploys.** *Why:* during a deploy the old release and the new one run against the same schema; a column dropped or renamed in one migration breaks every request the old release still serves, and a `NOT NULL` column without a default fails on existing rows. *Fix:* expand (add the new column nullable or with a default, write both, backfill in batches), switch reads, then contract (drop the old column) in a later release. Prisma generates a rename as drop-and-add: read the SQL. *Check:* read every generated `migration.sql` for `DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN … TYPE` and `SET NOT NULL` before committing it.
- **Conditional on Prisma 7: `migrate dev` on a laptop, `migrate deploy` everywhere else.** *Why:* `migrate dev` uses a shadow database, generates migrations and **prompts to reset the database** when history and schema drift; `migrate deploy` only applies pending migrations, never resets and never generates ([development and production](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production), checked 2026-10-26). `migrate dev` pointed at a shared or production URL is how a database gets emptied. *Check:* the deploy and CI scripts name `migrate deploy`, and no environment file used by them points `migrate dev` at a non-local host.
- **An applied migration is never edited.** *Why:* `migrate deploy` warns on a modified applied migration, `migrate dev` then asks to reset, and two databases end up with different schemas under the same history. Write a new migration instead.

## Indexes and locks

- **Every foreign key and every column a frequent query filters or sorts on has an index.** *Why:* PostgreSQL indexes primary keys and unique constraints, not foreign keys, so a delete on the parent scans the child and a filtered list scans the table; it is fast at a thousand rows and slow at a million. *Check:* `EXPLAIN (ANALYZE)` the changed queries on realistic volume, and look for `Seq Scan` on a large table.
- **On a table with traffic, build an index `CONCURRENTLY`, outside a transaction.** *Why:* a plain `CREATE INDEX` blocks every insert, update and delete for the whole build; `CONCURRENTLY` does not, at the cost of two table scans, and cannot run inside a transaction block ([CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html), PostgreSQL 18, checked 2026-10-26). A failed concurrent build leaves an `INVALID` index that still slows writes: drop it and build again. *Fix, conditional on Prisma:* a multi-statement migration file runs as one implicit transaction, so write `CREATE INDEX CONCURRENTLY` alone in its own migration file and confirm it applies in your version. *Check:* `\d table` after the deploy shows no `INVALID` index.
- **A migration sets a `lock_timeout`.** *Why:* an `ALTER TABLE` waiting behind a long transaction queues every later query behind itself, and the app stalls though the change itself is instant. `SET lock_timeout = '5s'` makes the migration fail fast and retry instead.

## Transactions and uniqueness

- **A uniqueness rule is a unique constraint, never a check-then-insert.** *Why:* two requests can both read "not there" and both insert; only the database sees both. *Fix:* a unique index (partial, `WHERE deleted_at IS NULL`, when soft deletes exist), and handle the violation (Prisma's `P2002`) as "already exists". *Check:* fire the same create twice in parallel and count the rows.
- **A transaction is short and holds no network call.** *Why:* conditional on Prisma 7, an interactive `$transaction` waits 2 s (`maxWait`) to start and is aborted after 5 s (`timeout`) by default ([transactions](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions), checked 2026-10-26); an HTTP call inside it holds locks and a pooled connection while it waits, and an email sent inside it is not rolled back with the writes. Prisma 8's transaction has no timeout at all, so the database's `idle_in_transaction_session_timeout` (or `transaction_timeout`, PostgreSQL 17+) is the bound there. *Fix:* compute and call out before or after, write inside.
- **Isolation is PostgreSQL's `READ COMMITTED` unless the code asks for more, and `SERIALIZABLE` means retrying.** *Why:* a read-modify-write (a balance, a counter, a quota) under `READ COMMITTED` loses updates; `SERIALIZABLE` raises `40001` (Prisma 7's `P2034`) instead, and the caller must retry. *Fix:* an atomic `UPDATE … SET n = n + 1` or `SELECT … FOR UPDATE` where it suffices; `SERIALIZABLE` with a bounded retry where it does not.

## Connections

- **Total connections are instances × pool size, and they must stay under the server's `max_connections`.** *Why:* conditional on Prisma 7 with a driver adapter, the driver owns the pool (`pg`: `max`, default 10) ([connection pool](https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/connection-pool), checked 2026-10-26). Every serverless instance and every pm2 cluster worker opens its own pool, so eight workers at 10 each take 80 connections before a migration or an admin can get one. *Fix:* one client per process (never one per request), a per-process `max` sized from the instance count, and an external pooler (PgBouncer in transaction mode) for serverless. *Check:* `SELECT count(*) FROM pg_stat_activity` under load, against `SHOW max_connections`.
