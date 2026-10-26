---
name: background-jobs
description: Background jobs and queues that run twice, fail and restart without harm. Use before writing or changing a job handler, a queue or worker, retry and backoff settings, a scheduled or recurring job, how a worker shuts down on deploy, the Redis a queue runs on, or work a webhook or request hands off to run later.
---

# Background jobs: every job runs at least once, maybe twice

**As of:** 2026-10-26

**Paths:** `jobs/`, `queues/`, `workers/`, `*Job.*`, `*.job.*`, `*.worker.*`

**Stack:** `bullmq`, `bull`, `pg-boss`, `agenda`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a queue library's default, and keep going.**

**A project skill on the same topic wins** where the two disagree. The language of an email or a push a job sends belongs to `esq:i18n-fr-en`; the owner's zone that decides a job's "today" to `esq:dates-and-timezones`; why a payment webhook hands its work to a queue to `esq:payments-stripe`. This module owns retries, idempotency, dead letters, shutdown and scheduling for every job, and the others point here.

A queue hides its failures by design: the request returned, the user left, and the job that failed at 3 a.m. retries until it succeeds twice or is never heard from again. Each rule below says how to see that before a user does.

**These rules are documented, not yet tested in a shipped project.** They follow BullMQ's documentation, checked on the date above, and state the general rule first; the BullMQ specifics are conditional. Treat each as a hypothesis to prove in the first queue that relies on it.

## At least once, so idempotent

- **A handler can run more than once for the same job and must leave the same result.** *Why:* a worker killed mid-job (a deploy, an out-of-memory kill) leaves the job stalled, and it is picked up again by the next worker (BullMQ: after about 30 s by default) ([going to production](https://docs.bullmq.io/guide/going-to-production), checked 2026-10-26); a retry after a timeout reruns work that may have finished. A handler that charges, emails or increments twice is a bug that appears only under failure. *Fix:* key each side effect on the job's business id: a unique row per effect (`sent_emails(job_key)`), an idempotency key on the outside call, an upsert instead of an insert. *Check:* run the handler twice on the same payload in a test and assert one effect.
- **A job id dedupes enqueueing; it is not idempotency.** *Why:* conditional on BullMQ, adding a job whose `jobId` already exists is silently ignored, but once that job is removed (`removeOnComplete`, `removeOnFail`) the same id can be added again; ids must not contain `:` and must not be all digits ([job ids](https://docs.bullmq.io/guide/jobs/job-ids), checked 2026-10-26). *Fix:* a deterministic id (`digest-<userId>-<date>`) to stop double enqueueing, and the idempotent handler above for double running.

## Retries, backoff and dead letters

- **Retries are bounded, back off, and spread out.** *Why:* an immediate retry against a dependency that is down hammers it, and an unbounded one never ends. *Fix, conditional on BullMQ:* `attempts` greater than 1 (without it a job never retries), `backoff: { type: 'exponential', delay }`, which waits 2^(attempt − 1) × delay, with `jitter` so a burst of failures does not retry in lockstep ([retrying failing jobs](https://docs.bullmq.io/guide/retrying-failing-jobs), checked 2026-10-26). A failure that no retry can fix (invalid payload, deleted user) fails at once instead of spending every attempt (BullMQ's `UnrecoverableError`).
- **A job that exhausts its attempts lands somewhere someone looks.** *Why:* conditional on BullMQ, an exhausted job moves to the failed set, where nothing reads it unless something does, and `removeOnFail` can delete it unseen; completed and failed jobs are otherwise kept forever. *Fix:* keep failed jobs (a count or an age, not forever), alert on the `failed` event or the set's size, and give an operator a way to inspect and retry. That set, or a separate queue it feeds, is the dead-letter queue. *Check:* make a handler throw in staging and find the job, its error and its payload where the team will look.

## Shutdown and the Redis underneath

- **A worker closes gracefully on `SIGTERM` and `SIGINT`.** *Why:* a deploy that kills workers mid-job stalls every active job and reruns it. *Fix:* on both signals, `await worker.close()` before exiting, and give the process manager a stop timeout longer than a typical job (pm2's `kill_timeout`, a container's grace period); a job longer than that grace still stalls and reruns, which the idempotent handler absorbs.
- **Redis under a queue runs `maxmemory-policy noeviction`, with persistence.** *Why:* any eviction policy lets Redis delete queue keys under memory pressure, and jobs vanish with no error; BullMQ calls `noeviction` the only setting that guarantees correct behaviour, and recommends AOF persistence. A managed Redis often defaults to an eviction policy. *Check:* `redis-cli CONFIG GET maxmemory-policy` on every environment's queue Redis.
- **Attach error handlers to workers and queues.** *Why:* a lost Redis connection or an unhandled rejection otherwise crashes the process or fails silently. Conditional on BullMQ, a worker's connection uses `maxRetriesPerRequest: null`; do not override it.

## Scheduled jobs across instances

- **A schedule is registered in the queue, once, never as a timer in each process.** *Why:* a `setInterval` or `node-cron` inside the app runs once per instance, so two instances send every digest twice, and none sends it while the app is scaled to zero. *Fix, conditional on BullMQ:* `queue.upsertJobScheduler(id, { pattern, tz })`, which creates or updates one scheduler per id without duplicating it ([job schedulers](https://docs.bullmq.io/guide/job-schedulers), checked 2026-10-26); give a cron pattern its zone explicitly. A per-user local time (a 08:00 digest in each user's zone) is a per-user computation from the stored zone, not one server cron. *Check:* start two instances in staging and count one run per schedule tick.
