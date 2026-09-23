#!/usr/bin/env node
// live-runner.mjs — a runner whose *live* path is free, so the write side can be
// tested at all.
//
// Every other test in this directory asserts a refusal, and a refusal is cheap
// to observe: the run never reaches a write, so a stubbed `claude` that prints
// nothing is enough. `commitCapture` is the opposite — it only runs once the
// spending is over, so proving what a red run, a timeout, a throw or a lost race
// does to paid evidence means driving `live` all the way through. This fixture is
// what makes that free: two rows over the same toy seed, judges that answer from
// the environment rather than from a scratch repo, and a `claude` the test puts on
// PATH.
//
// It exists to *drive* the production live path, never to reimplement any part of
// it. There is no judging here, no capture assembly and no write: `createRunner`
// does all three, exactly as it does for both real consumers. If this file ever
// grows one of them, the tests stop testing what ships.
//
// Knobs, all via the environment so the argv under test stays the real one:
//
//   FIXTURE_AGGREGATE  the `captureDefault` this runner may earn — required, and
//                      always a test-owned temp path, never a checked-in capture
//   FIXTURE_RED=1      the second row's judge reds
//   FIXTURE_THROW=N    harvest throws on the Nth row (1 → nothing captured at
//                      all; 2 → one row's records, then the loop dies)
//   FIXTURE_RACE=path  harvest tries to create `path` with `wx`, the way a second
//                      esq run would, and writes `<path>.refused` when it loses —
//                      the destination is claimed before the first spawn now, so
//                      the competitor is the one who arrives second
//   FIXTURE_LISTENERS=path
//                      append this process's SIGINT/SIGTERM/SIGHUP listener counts,
//                      once per row while its child is in flight and once when
//                      the run is over — the only way from outside to see that
//                      `live`'s interrupt handlers are installed for a row and
//                      not accumulated across rows
//   FIXTURE_UNSCHEMA=N harvest omits a key the schema requires on the Nth row, so
//                      that row's record cannot be persisted — the only way from
//                      outside to fail the write boundary itself
//   FIXTURE_SINK_LOST=N
//                      close the descriptor the runner is holding the sink open on,
//                      during the Nth row's harvest — so that row's append fails
//                      with its records already produced and nothing on disk, which
//                      is what a full disk does to a billed run and the only way
//                      from outside to reach "bought and could not be kept". Reads
//                      /proc/self/fd to find the descriptor; the test that uses it
//                      skips where procfs is absent
//   FIXTURE_ROW_ENV    a JSON object keyed by row number ("1", "2") of extra env
//                      vars for *that row's* child — how a test makes one row
//                      complete while a later one blocks, which is the shape
//                      B-136 needs and the only shape a whole-run `claude` stub
//                      cannot produce

import { appendFileSync, closeSync, mkdirSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRunner, runMain } from '../../../scripts/lib/journey-runner.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

const aggregate = process.env.FIXTURE_AGGREGATE;
if (!aggregate) {
  console.error('live-runner: FIXTURE_AGGREGATE is required — this fixture never names a checked-in capture');
  process.exit(2);
}

const reds = (branch) => branch === 'omega' && process.env.FIXTURE_RED === '1';
const judgeOf = (branch) => () => (reds(branch)
  ? { ok: false, failures: ['omega was told to red'] }
  : { ok: true, failures: [] });

// `childEnv` is evaluated at spawn time — after `live` has installed this row's
// interrupt handlers and before it removes them — which makes it the one hook a
// fixture has inside the window under test. The `exit` handler is the other end
// of the same reading: by then every row has settled.
const listeners = process.env.FIXTURE_LISTENERS;
const noteListeners = (when) => {
  if (!listeners) return;
  appendFileSync(listeners, `${when} ${process.listenerCount('SIGINT')} ${process.listenerCount('SIGTERM')} ${process.listenerCount('SIGHUP')}\n`);
};
process.on('exit', () => noteListeners('settled'));

// `childEnv` is handed the root and not the row, so the row is counted here: the
// runner spawns in registry order, one child per row, so the nth call to
// `childEnv` is the nth row. Cheaper than widening the production signature for
// something only a fixture needs.
const rowEnv = process.env.FIXTURE_ROW_ENV ? JSON.parse(process.env.FIXTURE_ROW_ENV) : {};
let spawned = 0;

// `harvest` is called once per row, in registry order, after that row's run — so
// counting its calls is how this fixture names a row to fail on without needing
// the runner to hand it one.
let harvested = 0;

// Closes the descriptor the runner holds its run journal open on, which no knob
// can reach from the outside any other way: the sink is opened inside `live`, by
// the production code under test, and nothing is injected into it. The next
// append then fails the way a full disk fails — records produced, none on disk.
const loseSink = () => {
  let fds;
  try { fds = readdirSync('/proc/self/fd'); } catch { return false; }
  for (const fd of fds) {
    let target;
    try { target = readlinkSync(`/proc/self/fd/${fd}`); } catch { continue; }
    if (path.basename(target) !== 'capture.jsonl') continue;
    try { closeSync(Number(fd)); return true; } catch { return false; }
  }
  return false;
};

const runner = createRunner({
  name: 'live-runner',
  headerLabel: 'live-runner — the write side under test',
  seedDir: path.join(here, 'seed'),
  seedLabel: 'tests/smoke/fixtures/seed/',
  rows: [
    { branch: 'alpha', prompt: 'x', corroboration: /alpha/, judge: judgeOf('alpha') },
    { branch: 'omega', prompt: 'y', corroboration: /omega/, judge: judgeOf('omega') },
  ],
  harvest: () => {
    harvested++;
    if (process.env.FIXTURE_RACE) {
      mkdirSync(path.dirname(process.env.FIXTURE_RACE), { recursive: true });
      try {
        writeFileSync(process.env.FIXTURE_RACE, '{"type":"someone-else-got-here-first"}\n', { flag: 'wx' });
      } catch (err) {
        writeFileSync(`${process.env.FIXTURE_RACE}.refused`, `${err.code}\n`);
      }
    }
    if (process.env.FIXTURE_THROW === String(harvested)) {
      throw new Error(`live-runner: told to throw on row ${harvested}`);
    }
    if (process.env.FIXTURE_UNSCHEMA === String(harvested)) {
      return { commits: [], backlogRows: [], anchors: [] };
    }
    if (process.env.FIXTURE_SINK_LOST === String(harvested) && !loseSink()) {
      console.error('live-runner: found no sink descriptor to close — FIXTURE_SINK_LOST did nothing');
    }
    return { commits: [], backlogRows: [], anchors: [], dirty: [] };
  },
  childEnv: () => { noteListeners('in-flight'); spawned++; return rowEnv[String(spawned)] || {}; },
  rowMarker: 'smoke-row',
  evidenceMarker: 'smoke-evidence',
  rowKind: 'a live-runner branch',
  captureDefault: aggregate,
  usage: 'usage: live-runner [--only alpha|omega] [--out <file>] [--timeout <s>]',
  stdinHint: 'live-runner reads a capture on stdin',
  tmpPrefix: 'esq-live-runner-',
});

runMain(runner, 'live-runner', process.argv.slice(2));
