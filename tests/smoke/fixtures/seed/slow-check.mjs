#!/usr/bin/env node
// slow-check.mjs — the toy project's *long* verification, and the only thing in
// this seed that does not finish.
//
// It exists so a journey can put a phase in the position `build/SKILL.md` tells
// it to be in: a check too slow to sit and watch, launched in the background
// while the log entry is drafted. Here the check never finishes at all, which is
// the same position with the ambiguity removed — a run that concluded cannot
// have concluded because the check answered, so whatever bounded its wait and
// whatever tore the launch down are the only things the artifacts can be
// showing. `check.mjs` is untouched and stays the project's verification; this
// is the one a plan has to name deliberately.
//
// Predictability is the whole design (the plan's "hard to observe without
// becoming flaky" risk):
//
//   * It prints one line immediately, then a heartbeat every 10s, so a reader
//     can tell "started and still going" from "never started" without waiting.
//   * It never exits on its own inside any journey's timeout. The 30-minute cap
//     below is a leak stop for the maintainer's machine, never a result: it is
//     far outside `--timeout`, and a run that reached it has already been killed.
//   * It dies on SIGTERM and SIGINT, so a teardown that reaches the process
//     works — a survivor in the capture then means nothing reached it, not that
//     the script ignored what did.
//
// Dependency-free, writes nothing, and reads no file: everything it could
// corrupt in a scratch root, it does not touch.

import { writeSync } from 'node:fs';

const HEARTBEAT_MS = 10_000;
const CAP_MS = 30 * 60_000;

const started = Date.now();
console.log('slow-check: started; this check does not finish on its own');

const beat = setInterval(() => {
  console.log(`slow-check: still running after ${Math.round((Date.now() - started) / 1000)}s`);
}, HEARTBEAT_MS);

// Every exit here clears the timers and sets `exitCode` rather than calling
// `process.exit`, and writes its line with `writeSync` rather than
// `console.error`. The teardown line is the evidence that a signal reached this
// script, and an asynchronous write to a pipe can still be queued when the
// process ends — so it goes out synchronously, inside the handler.
const cap = setTimeout(() => {
  clearInterval(beat);
  writeSync(2, `slow-check: hit the ${CAP_MS / 60_000}-minute leak stop and gave up — nothing here concluded\n`);
  process.exitCode = 1;
}, CAP_MS);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    clearInterval(beat);
    clearTimeout(cap);
    writeSync(2, `slow-check: torn down by ${signal} after ${Math.round((Date.now() - started) / 1000)}s\n`);
    process.exitCode = 143;
  });
}
