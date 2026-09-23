// Fixture tests for the verification-cost classifier. Every transcript here is synthetic and built
// in-process: nothing under ~/.claude is read, so these assertions hold on any machine and survive a
// corpus that changes under the live script.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTranscript, summarize } from '../../scripts/measure-wait-cost.mjs';

// ---------------------------------------------------------------- transcript builder
let clock = 0;
const stamp = () => new Date(Date.UTC(2026, 7, 22, 10, 0, clock++)).toISOString();

function reset() { clock = 0; }

function call(name, input, resultText = '', cacheRead = 100_000) {
  const id = `t${clock}`;
  return [
    { type: 'assistant', timestamp: stamp(), version: '2.1.239', message: { usage: { cache_read_input_tokens: cacheRead }, content: [{ type: 'tool_use', id, name, input }] } },
    { type: 'user', timestamp: stamp(), message: { content: [{ type: 'tool_result', tool_use_id: id, content: resultText }] } },
  ];
}
const bash = (command, options = {}) => call('Bash', { command, ...(options.background ? { run_in_background: true } : {}) }, options.result || '', options.cacheRead ?? 100_000);
const read = (file_path, options = {}) => call('Read', { file_path }, options.result || '', options.cacheRead ?? 100_000);
const edit = (file_path) => call('Edit', { file_path });
const conclude = (text = 'done, phase complete') => [
  { type: 'assistant', timestamp: stamp(), version: '2.1.239', message: { usage: { cache_read_input_tokens: 100_000 }, content: [{ type: 'text', text }] } },
];
const notification = () => [
  { type: 'user', timestamp: stamp(), message: { content: '[SYSTEM NOTIFICATION - NOT USER INPUT] <task-notification><status>killed</status></task-notification>' } },
];
const BACKGROUND_RESULT = 'Command running in background with ID: bx1. Output is being written to: /tmp/tasks/bx1.output. You will be notified when it completes. To check interim output, use Read on that file path.';

// ---------------------------------------------------------------- launches and observations
test('a foreground finite check is not a launch and costs no status turn', () => {
  reset();
  const result = classifyTranscript([...bash('pnpm test')]);
  assert.equal(result.finiteLaunches, 0);
  assert.equal(result.observations, 0);
  assert.equal(result.excessStatusTurns, 0);
});

test('a background finite check collected through one Read is a launch with no excess', () => {
  reset();
  const result = classifyTranscript([
    ...bash('pnpm test', { background: true, result: BACKGROUND_RESULT }),
    ...bash('git status --short'),
    ...read('/tmp/tasks/bx1.output'),
  ]);
  assert.equal(result.finiteLaunches, 1);
  assert.equal(result.launchesWithBackgroundFlag, 1);
  assert.equal(result.observations, 1, 'the Read of the launch output is the observation');
  assert.equal(result.excessStatusTurns, 0, 'one read of the result is not excess');
  assert.equal(result.launchesWithNoIndependentWorkFirst, 0);
});

test('a hand-rolled background check owns the log path it redirects to', () => {
  reset();
  const result = classifyTranscript([
    ...bash('( pnpm test > /tmp/run-a.log 2>&1 ) &'),
    ...bash('grep -q "Tests:" /tmp/run-a.log'),
  ]);
  assert.equal(result.launchesHandRolled, 1);
  assert.equal(result.launchesWithBackgroundFlag, 0);
  assert.equal(result.observations, 1);
});

test('repeated unsuccessful observations are excess; the final result read is kept', () => {
  reset();
  const result = classifyTranscript([
    ...bash('( pnpm test > /tmp/run-a.log 2>&1 ) &'),
    ...bash('grep -q "Tests:" /tmp/run-a.log', { cacheRead: 120_000 }),
    ...bash('grep -q "Tests:" /tmp/run-a.log', { cacheRead: 130_000 }),
    ...bash('tail -20 /tmp/run-a.log', { cacheRead: 140_000 }),
  ]);
  assert.equal(result.observations, 3);
  assert.equal(result.excessStatusTurns, 2, 'three observations of one finite check leave two excess');
  // Priced from the request that followed each excess observation, not from a corpus average.
  assert.equal(result.excessStatusCacheRead, 130_000 + 140_000);
});

test('independent work of any tool counts as overlap, not only Bash', () => {
  reset();
  const result = classifyTranscript([
    ...bash('( pnpm test > /tmp/run-a.log 2>&1 ) &'),
    ...read('/home/x/docs/plan.md'),
    ...edit('/home/x/docs/plan.md'),
    ...bash('git add -A'),
    ...bash('tail -5 /tmp/run-a.log'),
  ]);
  assert.deepEqual(result.independentCallsBeforeFirstObservation, [3]);
  assert.equal(result.launchesWithNoIndependentWorkFirst, 0);
});

test('a launch observed immediately is counted as buying no overlap', () => {
  reset();
  const result = classifyTranscript([
    ...bash('( pnpm test > /tmp/run-a.log 2>&1 ) &'),
    ...bash('grep -q "Tests:" /tmp/run-a.log'),
  ]);
  assert.equal(result.launchesWithNoIndependentWorkFirst, 1);
  assert.deepEqual(result.independentCallsBeforeFirstObservation, [0]);
});

test('two overlapping background tasks are tracked apart', () => {
  reset();
  const result = classifyTranscript([
    ...bash('( pnpm --filter a test > /tmp/run-a.log 2>&1 ) &'),
    ...bash('( pnpm --filter b test > /tmp/run-b.log 2>&1 ) &'),
    ...bash('grep -q done /tmp/run-a.log'),
    ...bash('grep -q done /tmp/run-a.log'),
    ...bash('grep -q done /tmp/run-b.log'),
  ]);
  assert.equal(result.finiteLaunches, 2);
  assert.equal(result.observations, 3);
  // A has two observations (one excess); B has one (none). A global "most recent launch" would have
  // charged all three to B.
  assert.equal(result.excessStatusTurns, 1);
});

test('a daemon is counted apart and its readiness probes are never excess', () => {
  reset();
  const result = classifyTranscript([
    ...bash('( pnpm --filter backend dev > /tmp/api.log 2>&1 ) &'),
    ...bash('grep -q listening /tmp/api.log'),
    ...bash('grep -q listening /tmp/api.log'),
    ...bash('grep -q listening /tmp/api.log'),
  ]);
  assert.equal(result.daemonLaunches, 1);
  assert.equal(result.finiteLaunches, 0);
  assert.equal(result.observations, 3);
  assert.equal(result.excessStatusTurns, 0, 'probing a server it just started is work, not waste');
});

test('an unrelated source Read is neither an observation nor a discovery call', () => {
  reset();
  const result = classifyTranscript([
    ...bash('( pnpm test > /tmp/run-a.log 2>&1 ) &'),
    ...read('/home/x/src/api/handler.ts'),
    ...bash('tail -5 /tmp/run-a.log'),
  ]);
  assert.equal(result.observations, 1);
  assert.equal(result.appendLogDiscoveryCalls, 0);
});

// ---------------------------------------------------------------- append-log discovery
test('help then a real write: the agent counts in both numerator and denominator', () => {
  reset();
  const agent = classifyTranscript([
    ...bash('esq plan append-log --help 2>&1 | head -40'),
    ...bash('esq plan append-log docs/plans/p.md \'{"phase":1,"status":"completed"}\''),
  ]);
  assert.equal(agent.appendLogDiscoveryCalls, 1);
  assert.equal(agent.wroteLogEntry, true);
  const summary = summarize({ build: [agent] }, { transcriptsOnDisk: 1, labelledByEsq: 1, outOfScope: 0 });
  assert.equal(summary.appendLogDiscovery.denominator, 1);
  assert.equal(summary.appendLogDiscovery.numerator, 1);
});

test('discovery without a write is in neither numerator nor denominator', () => {
  reset();
  const agent = classifyTranscript([...bash('esq plan append-log --help')]);
  assert.equal(agent.wroteLogEntry, false);
  const summary = summarize({ build: [agent] }, { transcriptsOnDisk: 1, labelledByEsq: 1, outOfScope: 0 });
  assert.equal(summary.appendLogDiscovery.denominator, 0);
  assert.equal(summary.appendLogDiscovery.numerator, 0);
});

test('mentioning append-log in a grep is not writing an entry', () => {
  reset();
  const agent = classifyTranscript([...bash('grep -rn "append-log" docs/ | head -5')]);
  assert.equal(agent.wroteLogEntry, false);
});

test('reading the CLI source counts as discovery only outside the esquisse checkout', () => {
  reset();
  const outside = classifyTranscript([...bash('grep -n appendLog /home/x/projects/esquisse/plugin/lib/cli.mjs')], { insideEsqRepo: false });
  reset();
  const inside = classifyTranscript([...bash('grep -n appendLog /home/x/projects/esquisse/plugin/lib/cli.mjs')], { insideEsqRepo: true });
  assert.equal(outside.appendLogDiscoveryCalls, 1);
  assert.equal(inside.appendLogDiscoveryCalls, 0, 'inside the repo, reading the CLI is the work');
});

// ---------------------------------------------------------------- lifecycle
test('a notification before the conclusion is not a post-conclusion resurrection', () => {
  reset();
  const result = classifyTranscript([...bash('git status'), ...notification(), ...bash('git add -A'), ...conclude()]);
  assert.equal(result.notifications, 1);
  assert.equal(result.concludedThenNotified, false);
});

test('a notification after the conclusion is', () => {
  reset();
  const result = classifyTranscript([...bash('git status'), ...conclude(), ...notification()]);
  assert.equal(result.notifications, 1);
  assert.equal(result.concludedThenNotified, true);
});

// ---------------------------------------------------------------- the window
test('--through excludes everything after the cutoff', () => {
  reset();
  const entries = [
    ...bash('( pnpm test > /tmp/run-a.log 2>&1 ) &'),
    ...bash('grep -q done /tmp/run-a.log'),
    ...bash('grep -q done /tmp/run-a.log'),
  ];
  const cutoff = entries[1].timestamp;          // the launch's own result — nothing after it is in window
  const full = classifyTranscript(entries);
  const clipped = classifyTranscript(entries, { through: cutoff });
  assert.equal(full.observations, 2);
  assert.equal(clipped.observations, 0, 'observations after the cutoff are outside the window');
  assert.ok(clipped.turns < full.turns);
});

test('--since excludes everything before the cutoff', () => {
  reset();
  const entries = [...bash('git status'), ...bash('git add -A')];
  const clipped = classifyTranscript(entries, { since: entries[2].timestamp });
  assert.equal(clipped.turns, 1);
});

test('the summary reports the window it was taken in', () => {
  const summary = summarize({ build: [] }, { since: '2026-08-01T00:00:00Z', through: '2026-08-22T12:00:00Z', transcriptsOnDisk: 0, labelledByEsq: 0, outOfScope: 0 });
  assert.equal(summary.window.through, '2026-08-22T12:00:00Z');
  assert.equal(summary.window.open, false);
  assert.equal(summary.measuredAt, '2026-08-22T12:00:00Z', 'measuredAt is the evidence cutoff, not the run date');
});

test('an open window says so', () => {
  const summary = summarize({ build: [] }, { transcriptsOnDisk: 0, labelledByEsq: 0, outOfScope: 0 });
  assert.equal(summary.window.open, true);
});
