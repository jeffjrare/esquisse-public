// The harness's own regression suite. `work-capture.test.mjs` proves the P-07
// judges still judge; this proves the machinery underneath them — the one
// `scripts/smoke-journeys.mjs` also runs on — still groups a capture, still
// refuses a capture it cannot judge, and still refuses *before* it can bill.
//
// Free: every assertion here builds its own two-row runner over records this
// file owns, or spawns the production script with a stubbed `claude` first on
// PATH and asserts it was never reached.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRunner, parseLines, readStream, splitCapture, survivingProcesses } from '../../scripts/lib/journey-runner.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..');
const SCRIPT = path.join(REPO, 'scripts', 'smoke-work-capture.mjs');

const ROW_MARKER = 'smoke-row';
const EVIDENCE_MARKER = 'smoke-evidence';

// A runner over two rows this file owns, so the harness is exercised without any
// P-07 judgment leaking in: `alpha` always passes, `omega` always fails.
const evidence = (fields = {}) => ({
  type: EVIDENCE_MARKER,
  exit: 0, timedOut: false, elapsedMs: 1000, says: true,
  commits: [], backlogRows: [], anchors: [], dirty: [], cc: '9.9.9',
  ...fields,
});

const testRunner = () => createRunner({
  name: 'test-runner',
  headerLabel: 'test-runner — the harness under test',
  seedDir: path.join(here, 'fixtures', 'seed'),
  seedLabel: 'tests/smoke/fixtures/seed/',
  rows: [
    { branch: 'alpha', prompt: 'x', corroboration: /alpha/, judge: () => ({ ok: true, failures: [] }) },
    { branch: 'omega', prompt: 'y', corroboration: /omega/, judge: () => ({ ok: false, failures: ['omega never holds'] }) },
  ],
  harvest: () => ({ commits: [], backlogRows: [], anchors: [], dirty: [] }),
  rowMarker: ROW_MARKER,
  evidenceMarker: EVIDENCE_MARKER,
  rowKind: 'a test branch',
  captureDefault: path.join(tmpdir(), 'never-written.jsonl'),
  usage: 'usage: test-runner',
  stdinHint: 'test-runner reads a capture on stdin',
});

test('a preamble before the first marker belongs to no run and is not evidence', () => {
  const rows = splitCapture([
    { type: 'system', subtype: 'init', claude_code_version: '9.9.9' },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'banner' }] } },
    { type: ROW_MARKER, branch: 'alpha' },
    evidence({ branch: 'alpha' }),
  ], { rowMarker: ROW_MARKER, evidenceMarker: EVIDENCE_MARKER });

  assert.deepEqual(rows.map((r) => r.branch), ['alpha']);
  assert.equal(rows[0].events.length, 0, 'the preamble was attached to a run');
  assert.equal(rows[0].evidence.type, EVIDENCE_MARKER);

  // …and the judged capture is unaffected by it. `only` narrows the registry to
  // the one row this archive holds, which is what replaying a single-branch
  // capture means; without it a one-row capture is a missing-row problem.
  const { judged, problems, version } = testRunner().judgeCapture([
    { type: 'system', subtype: 'init', claude_code_version: '9.9.9' },
    { type: ROW_MARKER, branch: 'alpha' },
    evidence({ branch: 'alpha' }),
  ], { only: 'alpha' });
  assert.deepEqual(problems, []);
  assert.deepEqual(judged.map((r) => r.verdict), ['pass']);
  assert.equal(version, '9.9.9');
});

// A journey is authored before it is bought, and the registry it will join is a
// bijection with the checked-in fixtures — so between the commit that writes its
// judge and the run that pays for it there has to be a state that is runnable and
// judged without being expected. `candidates` is that state, and the whole of it
// is: `rowFor` resolves it, `--only` accepts it, and `branches` does not carry it,
// so no replay of the aggregate reports a table shorter than the registry.
test('a candidate row is runnable and judged, and the registry does not expect it', () => {
  const runner = createRunner({
    name: 'test-runner',
    headerLabel: 'test-runner — the harness under test',
    seedDir: path.join(here, 'fixtures', 'seed'),
    seedLabel: 'tests/smoke/fixtures/seed/',
    rows: [
      { branch: 'alpha', prompt: 'x', corroboration: /alpha/, judge: () => ({ ok: true, failures: [] }) },
    ],
    candidates: [
      { branch: 'kappa', prompt: 'z', corroboration: /kappa/, judge: () => ({ ok: true, failures: [] }) },
    ],
    harvest: () => ({ commits: [], backlogRows: [], anchors: [], dirty: [] }),
    rowMarker: ROW_MARKER,
    evidenceMarker: EVIDENCE_MARKER,
    rowKind: 'a test branch',
    captureDefault: path.join(tmpdir(), 'never-written.jsonl'),
    usage: 'usage: test-runner',
    stdinHint: 'test-runner reads a capture on stdin',
  });

  assert.deepEqual(runner.branches, ['alpha'], 'a candidate reached the registry');
  assert.equal(runner.rowFor('kappa').branch, 'kappa', 'a candidate does not resolve to a row, so --only could never run it');

  // Its own capture judges, narrowed to it the way `--only kappa --out …` writes it.
  const own = runner.judgeCapture([
    { type: ROW_MARKER, branch: 'kappa' }, evidence({ branch: 'kappa' }),
  ], { only: 'kappa' });
  assert.deepEqual(own.problems, []);
  assert.deepEqual(own.judged.map((r) => r.verdict), ['pass']);

  // And the aggregate is complete without it: a registry-shaped capture that
  // holds no candidate row is green, with nothing reported missing.
  const aggregate = runner.judgeCapture([{ type: ROW_MARKER, branch: 'alpha' }, evidence({ branch: 'alpha' })]);
  assert.deepEqual(aggregate.problems, []);
  assert.deepEqual(aggregate.judged.map((r) => r.verdict), ['pass']);
});

test('a duplicate row is judged once and named as a problem', () => {
  const { judged, problems } = testRunner().judgeCapture([
    { type: ROW_MARKER, branch: 'alpha' }, evidence({ branch: 'alpha' }),
    { type: ROW_MARKER, branch: 'alpha' }, evidence({ branch: 'alpha' }),
  ], { only: 'alpha' });
  assert.equal(judged.length, 1, 'the second row was judged as well as named');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /two rows for "alpha"/);
});

test('an unknown branch, a missing evidence record and a foreign capture are all problems', () => {
  const runner = testRunner();

  const unknown = runner.judgeCapture([{ type: ROW_MARKER, branch: 'not-a-branch' }]);
  assert.deepEqual(unknown.judged, []);
  assert.match(unknown.problems[0], /"not-a-branch", which is not a test branch/);

  const bare = runner.judgeCapture([{ type: ROW_MARKER, branch: 'omega' }]);
  assert.deepEqual(bare.judged, []);
  assert.match(bare.problems[0], /has no smoke-evidence record — nothing to judge/);

  const foreign = runner.judgeCapture([{ type: 'assistant', message: { content: [] } }]);
  assert.match(foreign.problems[0], /no smoke-row marker in the capture — this is not a test-runner capture/);
});

// The mirror of the unknown-row problem, and the guard B-032's Phase 3 did not
// have: a capture *shorter* than the registry replayed as a green table over the
// rows that happened to be in it, so the free path agreed the suite was fine
// while the audit was red (D-the-registry-and-its-fixtures-are-a-bijection).
test('a registry row the capture never held is a named problem, not a shorter green table', () => {
  const { judged, problems } = testRunner().judgeCapture([
    { type: ROW_MARKER, branch: 'alpha' }, evidence({ branch: 'alpha' }),
  ]);
  assert.deepEqual(judged.map((r) => r.verdict), ['pass'], 'the row that is there still judges');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no row for "omega", which is in the registry/);

  // …and `only` is the one deliberate narrowing, for a single-branch archive.
  assert.deepEqual(testRunner().judgeCapture([
    { type: ROW_MARKER, branch: 'alpha' }, evidence({ branch: 'alpha' }),
  ], { only: 'alpha' }).problems, []);
});

test('the failing row reds, names its failure, and does not red the passing one', () => {
  const { judged, problems } = testRunner().judgeCapture([
    { type: ROW_MARKER, branch: 'alpha' }, evidence({ branch: 'alpha' }),
    { type: ROW_MARKER, branch: 'omega' }, evidence({ branch: 'omega' }),
  ]);
  assert.deepEqual(problems, []);
  const verdicts = Object.fromEntries(judged.map((r) => [r.branch, r.verdict]));
  assert.deepEqual(verdicts, { alpha: 'pass', omega: 'FAIL' });
  assert.deepEqual(judged.find((r) => r.branch === 'omega').failures, ['omega never holds']);

  const table = testRunner().renderTable('header', judged);
  assert.match(table, /^omega\s+FAIL/m);
  assert.match(table, /^✖ omega$/m);
});

test('readStream counts only main-conversation spawns and never returns a judge a stream', () => {
  const stream = readStream(parseLines([
    JSON.stringify({ type: 'system', subtype: 'init', claude_code_version: '9.9.9' }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Agent' }] } }),
    JSON.stringify({ type: 'assistant', parent_tool_use_id: 'toolu_1', message: { content: [{ type: 'tool_use', name: 'Agent' }] } }),
    'not json at all — a banner on stderr is not evidence',
    JSON.stringify({ type: 'result', total_cost_usd: 0.5, num_turns: 3 }),
  ].join('\n')));
  assert.deepEqual(stream, { text: '', cost: 0.5, turns: 3, cc: '9.9.9', model: null, spawns: 1, backgroundLaunches: 0 });
});

// A background launch is counted wherever it was asked from, and a spawn is
// counted only in the main conversation — the two rules differ on purpose. A
// phase's slow check is launched by the *worker*, so a background count
// restricted the way `spawns` is would read zero on the one run this whole plan
// is about.
test('readStream counts a background launch from a worker as readily as from the main conversation', () => {
  const stream = readStream(parseLines([
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'node slow-check.mjs', run_in_background: true } }] } }),
    JSON.stringify({ type: 'assistant', parent_tool_use_id: 'toolu_1', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'node slow-check.mjs', run_in_background: true } }] } }),
    // the foreground calls that must not be counted, including the false one
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'node check.mjs' } }] } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'node check.mjs', run_in_background: false } }] } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read' }] } }),
  ].join('\n')));
  assert.equal(stream.backgroundLaunches, 2);
  assert.equal(stream.spawns, 0, 'a background Bash call is not a subagent');
});

// A run that launched nothing in the background is the boundary the judge has to
// read as "did not gate a background check", never as missing evidence.
test('a run with zero background launches is a 0 and not an absence', () => {
  const stream = readStream(parseLines(JSON.stringify({ type: 'result', total_cost_usd: 0.1, num_turns: 2 })));
  assert.equal(stream.backgroundLaunches, 0);
  const [, record] = testRunner().captureRecords(
    { branch: 'alpha', corroboration: /alpha/ },
    { exit: 0, timedOut: false, elapsedMs: 1000, events: [], harvested: {} },
  );
  // dropped here only because `smoke-evidence` does not declare it; the field is
  // journey-evidence's, and the schema suite owns that half.
  assert.equal(record.backgroundLaunches, undefined);
});

// The process half. A fresh directory nothing is sitting in has no survivors —
// an empty list, which is a *read* teardown and the thing a judge passes on.
test('survivingProcesses reads an empty root as an empty list, never as an absence', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'esq-survivors-'));
  try {
    const alive = survivingProcesses(root);
    if (alive === null) return; // no /proc on this platform — absence, asserted below
    assert.deepEqual(alive, [], 'something was already sitting in a fresh mkdtemp root');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// And the leak it exists to catch: a process whose cwd is inside the root is one
// the run started, because nothing else on the machine is in there.
test('survivingProcesses finds a process still sitting in the scratch root', { skip: !existsSync('/proc') }, () => {
  const root = mkdtempSync(path.join(tmpdir(), 'esq-survivors-'));
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: root, stdio: 'ignore' });
  try {
    // the pid exists the moment spawn returns; its cwd is the root by construction
    const alive = survivingProcesses(root);
    assert.ok(alive.includes(child.pid), `the leaked pid ${child.pid} is not in ${JSON.stringify(alive)}`);
  } finally {
    child.kill('SIGKILL');
    rmSync(root, { recursive: true, force: true });
  }
});

// "Could not look" must not read as "nothing survived". A platform with no
// `/proc` answers `null`, and the record then carries no key at all — absent,
// which a judge can refuse, rather than an empty list, which it would pass.
test('a survivors reading of null leaves the key absent on the record, never empty', () => {
  const runner = createRunner({
    name: 'journey-test-runner',
    headerLabel: 'the journey record shape',
    seedDir: path.join(here, 'fixtures', 'seed'),
    seedLabel: 'tests/smoke/fixtures/seed/',
    rows: [{ branch: 'alpha', prompt: 'x', corroboration: /alpha/, judge: () => ({ ok: true, failures: [] }) }],
    harvest: () => ({}),
    rowMarker: 'journey-row',
    evidenceMarker: 'journey-evidence',
    rowKind: 'a test branch',
    captureDefault: path.join(tmpdir(), 'never-written.jsonl'),
    usage: 'usage: journey-test-runner',
    stdinHint: 'reads a capture on stdin',
  });
  const row = { branch: 'alpha', corroboration: /alpha/ };
  const base = { exit: 0, timedOut: false, elapsedMs: 1000, events: [], harvested: {} };

  const [, unreadable] = runner.captureRecords(row, { ...base, survivors: null });
  assert.equal('survivingProcesses' in unreadable, false, 'an unreadable platform published an empty teardown');

  const [, clean] = runner.captureRecords(row, { ...base, survivors: [] });
  assert.deepEqual(clean.survivingProcesses, [], 'a read teardown is an empty list, and the judge needs to see it');

  const [, leaked] = runner.captureRecords(row, { ...base, survivors: [4111] });
  assert.deepEqual(leaked.survivingProcesses, [4111]);

  // and it is never a required key: an older capture carries none of this
  const [, old] = runner.captureRecords(row, base);
  assert.equal('survivingProcesses' in old, false);
  assert.equal(old.backgroundLaunches, 0);
});

// Both refusals below must fire *before* a spawn. The stub is the assertion, not
// the exit code: a refusal that has already billed is not a refusal.
function stubbedRun(args, { home, input } = {}) {
  const stubDir = mkdtempSync(path.join(tmpdir(), 'esq-runner-stub-'));
  const marker = path.join(stubDir, 'spawned');
  writeFileSync(path.join(stubDir, 'claude'), `#!/bin/sh\ntouch ${marker}\nexit 0\n`);
  chmodSync(path.join(stubDir, 'claude'), 0o755);
  const r = spawnSync(process.execPath, args, {
    input: input ?? '',
    encoding: 'utf8',
    timeout: 30_000,
    env: { ...process.env, PATH: `${stubDir}:${process.env.PATH}`, ...(home ? { HOME: home } : {}) },
  });
  return { ...r, spawned: existsSync(marker) };
}

test('--parse on a terminal stdin refuses with the hint rather than blocking on EOF', () => {
  // A terminal stdin has no EOF until someone types one, so a --parse that read
  // it first would look like a hang. The isTTY flag is what the harness reads,
  // so the child sets it and calls the production script's own `parse`.
  const r = stubbedRun([
    '--input-type=module', '-e',
    `process.stdin.isTTY = true;\nconst m = await import(${JSON.stringify(SCRIPT)});\nm.parse();`,
  ]);
  assert.equal(r.status, 2, r.stderr);
  assert.equal(r.spawned, false, 'a TTY --parse reached a claude spawn — the free path can bill');
  assert.match(r.stderr, /--parse reads a capture on stdin/);
});

test('a legacy install that would shadow the plugin refuses before anything is spent', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'esq-runner-home-'));
  mkdirSync(path.join(home, '.claude', 'commands', 'esq'), { recursive: true });
  writeFileSync(path.join(home, '.claude', 'commands', 'esq', 'work.md'), '# a legacy copy\n');

  // `--out` is not incidental here: a narrowed run is refused for its missing
  // destination before the shadow probe is even reached, so the shadow refusal
  // can only be observed on an invocation that already names one.
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'esq-runner-out-')), 'capture.jsonl');
  const r = stubbedRun([SCRIPT, '--only', 'refuses', '--out', out, '--timeout', '5'], { home });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.equal(r.spawned, false, 'the shadow refusal fired after a claude spawn — it must fire before');
  assert.match(r.stderr, /a legacy install would shadow the plugin under test/);
  assert.match(r.stderr, /nothing was spent/);
});

test('an unknown --only and a valueless flag both refuse, and neither spawns', () => {
  const bad = stubbedRun([SCRIPT, '--only', 'not-a-branch']);
  assert.equal(bad.status, 2, bad.stderr);
  assert.equal(bad.spawned, false);
  assert.match(bad.stderr, /--only takes one of duplicate, route-captures, refuses, inline/);

  const valueless = stubbedRun([SCRIPT, '--out']);
  assert.equal(valueless.status, 2, valueless.stderr);
  assert.equal(valueless.spawned, false);
  assert.match(valueless.stderr, /--out needs a value/);
});

// B-098, mechanized: every way of aiming a live run at paid evidence refuses
// before a `claude` process exists, and leaves what is already on disk exactly
// as it found it. Both consumers ride the same runner and both check in an
// aggregate capture, so both are asserted here — the defect lived in the shared
// half, and a guard proven on one script only is one the other can lose to a
// refactor that never touches its tests.
const CONSUMERS = [
  {
    label: 'smoke-work-capture.mjs',
    script: SCRIPT,
    branch: 'refuses',
    aggregate: path.join(REPO, 'tests', 'smoke', 'fixtures', 'capture.jsonl'),
  },
  {
    label: 'smoke-journeys.mjs',
    script: path.join(REPO, 'scripts', 'smoke-journeys.mjs'),
    branch: 'pause',
    aggregate: path.join(REPO, 'tests', 'journeys', 'fixtures', 'capture.jsonl'),
  },
];

const scratch = () => mkdtempSync(path.join(tmpdir(), 'esq-runner-out-'));

// A refusal is only a refusal if nothing was spent and nothing on disk moved.
// The exit code is the weakest of the three claims and is checked last in spirit:
// `spawned` is what says the refusal beat the bill, and the byte comparison is
// what says it beat the clobber.
function assertRefused(r, pattern, guarded = []) {
  assert.equal(r.spawned, false, 'the refusal fired after a claude spawn — it must fire before');
  assert.match(r.stderr, pattern);
  assert.match(r.stderr, /nothing was spent/);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  for (const [file, before] of guarded) {
    assert.ok(readFileSync(file).equals(before), `${file} changed under a refused run`);
  }
}

for (const { label, script, branch, aggregate } of CONSUMERS) {
  const guardAggregate = () => [[aggregate, readFileSync(aggregate)]];

  test(`${label}: --only with no --out refuses, and the aggregate it would have replaced is untouched`, () => {
    const guarded = guardAggregate();
    const r = stubbedRun([script, '--only', branch, '--timeout', '5']);
    assertRefused(r, /has no default destination — pass --out <file>/, guarded);
    assert.match(r.stderr, new RegExp(`a ${branch}-only run`), 'the diagnostic does not name the run it refused');
  });

  test(`${label}: an --out aimed at the checked-in aggregate refuses, narrowed or whole`, () => {
    const guarded = guardAggregate();
    for (const args of [[script, '--out', aggregate], [script, '--only', branch, '--out', aggregate]]) {
      const r = stubbedRun(args);
      assertRefused(r, /is the checked-in aggregate capture/, guarded);
      assert.match(r.stderr, /earned, never aimed at/);
    }
  });

  test(`${label}: an --out that already exists refuses, and that file is byte-identical after`, () => {
    const out = path.join(scratch(), 'capture.jsonl');
    writeFileSync(out, '{"type":"already-here"}\n');
    const guarded = [...guardAggregate(), [out, readFileSync(out)]];
    assertRefused(stubbedRun([script, '--out', out]), /already exists, and a capture is never written over/, guarded);
  });

  test(`${label}: an --out whose parent is missing or is a file refuses before the spawn`, () => {
    const dir = scratch();
    const guarded = guardAggregate();

    const missing = path.join(dir, 'not-a-dir', 'capture.jsonl');
    assertRefused(stubbedRun([script, '--out', missing]), /names a directory that does not exist/, guarded);
    assert.equal(existsSync(path.join(dir, 'not-a-dir')), false, 'the refusal created the directory it refused');

    const file = path.join(dir, 'a-file');
    writeFileSync(file, 'not a directory\n');
    assertRefused(stubbedRun([script, '--out', path.join(file, 'capture.jsonl')]), /is not under a directory/, guarded);
  });

  test(`${label}: an --out under a directory this process cannot write refuses before the spawn`, () => {
    // Root bypasses the mode bits, so the read this asserts cannot fail there.
    // Skipping is honest; asserting a refusal that cannot fire would not be.
    if (typeof process.getuid === 'function' && process.getuid() === 0) return;
    const dir = scratch();
    const locked = path.join(dir, 'locked');
    mkdirSync(locked);
    chmodSync(locked, 0o500);
    try {
      assertRefused(
        stubbedRun([script, '--out', path.join(locked, 'capture.jsonl')]),
        /cannot write/,
        guardAggregate(),
      );
    } finally {
      chmodSync(locked, 0o700);
    }
  });
}


// ---------------------------------------------------------------- the write side
//
// B-098's other half. Everything above asserts a refusal, which never reaches a
// write; these drive `live` all the way through against `fixtures/live-runner.mjs`
// and a stubbed `claude`, and assert what each row of the destination matrix does
// to paid evidence. The claim under test is always the same one, stated two ways:
// the aggregate is byte-identical unless the run earned it, and the records the
// run paid for are still somewhere the diagnostic names.

const LIVE_RUNNER = path.join(here, 'fixtures', 'live-runner.mjs');

// What a previously-bought aggregate looks like to these tests. Its content is
// irrelevant — what matters is that it is on disk before the run and that its
// bytes can be compared afterwards.
const PRIOR = '{"type":"smoke-row","branch":"a-capture-someone-already-paid-for"}\n';

// A stub `claude` that answers `--version` version-shaped — without it `live`
// refuses at `no working claude on PATH` and never reaches a write, which is
// exactly why the refusal tests above can assert nothing about the aggregate.
function liveRun(args, { env = {}, sleep = null, aggregate = null } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'esq-live-'));
  const bin = path.join(dir, 'bin');
  const home = path.join(dir, 'home');
  mkdirSync(bin);
  mkdirSync(home);
  writeFileSync(path.join(bin, 'claude'), [
    '#!/bin/sh',
    'if [ "$1" = "--version" ]; then echo "9.9.9 (Claude Code)"; exit 0; fi',
    'cat > /dev/null',
    sleep ? `sleep ${sleep} >/dev/null 2>&1` : ':',
    'echo \'{"type":"system","subtype":"init","claude_code_version":"9.9.9","model":"opus"}\'',
    'echo \'{"type":"assistant","message":{"content":[{"type":"text","text":"alpha omega"}]}}\'',
    'echo \'{"type":"result","total_cost_usd":0.01,"num_turns":2}\'',
    'exit 0',
  ].join('\n'));
  chmodSync(path.join(bin, 'claude'), 0o755);

  const aggregatePath = aggregate ?? path.join(dir, 'aggregate.jsonl');
  writeFileSync(aggregatePath, PRIOR);
  const before = readFileSync(aggregatePath);

  const r = spawnSync(process.execPath, [LIVE_RUNNER, ...args], {
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      HOME: home,
      FIXTURE_AGGREGATE: aggregatePath,
      ...env,
    },
  });
  return { ...r, dir, aggregate: aggregatePath, before };
}

/** The aggregate never moved, and the atomic path left no temp file behind. */
function assertAggregateIntact({ aggregate, before }) {
  assert.ok(readFileSync(aggregate).equals(before), 'the aggregate was replaced by a run that did not earn it');
  assertNoTemp(aggregate);
}

function assertNoTemp(file) {
  const strays = readdirSync(path.dirname(file)).filter((f) => f.startsWith('.capture-'));
  assert.deepEqual(strays, [], 'a temp capture file survived the write');
}

/** The paid records the diagnostic points at, read back and counted. */
function keptElsewhere(stderr) {
  const m = stderr.match(/paid record\(s\) are at (\S+?),/);
  assert.ok(m, `the diagnostic named no fallback path:\n${stderr}`);
  const lines = readFileSync(m[1], 'utf8').trim().split('\n');
  rmSync(path.dirname(m[1]), { recursive: true, force: true });
  return { file: m[1], records: lines.map((l) => JSON.parse(l)) };
}

test('a complete green whole-registry run replaces the aggregate, and the replacement replays', () => {
  const r = liveRun(['--timeout', '30']);
  assert.equal(r.status, 0, r.stdout + r.stderr);

  const after = readFileSync(r.aggregate);
  assert.ok(!after.equals(r.before), 'the run that earned the aggregate did not replace it');
  assert.equal(after.toString().trim().split('\n').length, 4, 'two rows and two evidence records');
  assertNoTemp(r.aggregate);

  // The replacement is not merely present: it replays green through the same
  // `--parse` a contributor would run, which is the whole point of earning it.
  const replay = spawnSync(process.execPath, [LIVE_RUNNER, '--parse'], {
    input: after.toString(),
    encoding: 'utf8',
    env: { ...process.env, FIXTURE_AGGREGATE: r.aggregate },
  });
  assert.equal(replay.status, 0, replay.stdout + replay.stderr);
});

test('the sink the paid rows land in is named before the first row is bought', () => {
  // The durability claim is only worth what a contributor can find afterwards: a
  // `SIGKILL` leaves the rows on disk and nothing else behind, and a no-`--out`
  // run's journal is an unpredictably-named 0700 `mkdtemp` directory. So the path
  // has to be on stderr *before* the first row settles, and it has to be the path
  // the records are actually at.
  const r = liveRun(['--timeout', '30'], { env: { FIXTURE_RED: '1' } });
  const announced = r.stderr.match(/records land in (\S+) as each row settles/);
  assert.ok(announced, `the run never named where its paid rows land:\n${r.stderr}`);

  const settled = r.stderr.search(/s, exit \d+/);
  assert.ok(settled > 0, `no row settled, so the ordering proves nothing:\n${r.stderr}`);
  assert.ok(r.stderr.indexOf(announced[0]) < settled,
    'the sink was named only after a row had already been bought');
  assert.ok(r.stderr.includes(`promoted to ${r.aggregate} only by a run that earns it`),
    'the aggregate was not named as the candidate it is');

  assert.equal(keptElsewhere(r.stderr).file, announced[1],
    'the path announced before the spending is not where the paid records were kept');

  // An `--out` the contributor named is the sink, and is announced as such — no
  // second path, because there is no promotion to claim.
  const out = path.join(r.dir, 'named.jsonl');
  const named = liveRun(['--timeout', '30', '--out', out], { aggregate: path.join(r.dir, 'aggregate2.jsonl') });
  assert.equal(named.status, 0, named.stdout + named.stderr);
  assert.match(named.stderr, new RegExp(`records land in ${out} as each row settles`));
  assert.doesNotMatch(named.stderr, /promoted to/, 'a contributor-named destination claimed a promotion');
});

test('a red row does not replace the aggregate, and its paid records are kept elsewhere', () => {
  const r = liveRun(['--timeout', '30'], { env: { FIXTURE_RED: '1' } });
  assert.notEqual(r.status, 0, 'a red run exited 0');
  assertAggregateIntact(r);
  assert.match(r.stderr, /the aggregate is earned, and this run did not earn it — omega did not pass/);
  assert.equal(keptElsewhere(r.stderr).records.length, 4, 'the red run\'s paid records were discarded');
});

test('a timed-out row does not replace the aggregate, and its paid records are kept elsewhere', () => {
  const r = liveRun(['--timeout', '0.2'], { sleep: 1 });
  assert.notEqual(r.status, 0, 'a timed-out run exited 0');
  assertAggregateIntact(r);
  assert.match(r.stderr, /did not earn it — a row timed out/);
  assert.equal(keptElsewhere(r.stderr).records.length, 4);
});

test('a throw partway through does not replace the aggregate, and the rows already bought survive', () => {
  const r = liveRun(['--timeout', '30'], { env: { FIXTURE_THROW: '2' } });
  assert.notEqual(r.status, 0, 'a run that threw exited 0');
  assertAggregateIntact(r);
  assert.match(r.stderr, /did not earn it — 1 of 2 row\(s\) completed/);

  const { records } = keptElsewhere(r.stderr);
  assert.deepEqual(records.map((x) => x.type), ['smoke-row', 'smoke-evidence']);
  assert.equal(records[0].branch, 'alpha', 'the row that completed before the throw was lost');
});

test('a run that captured nothing writes no capture file at all', () => {
  const r = liveRun(['--timeout', '30'], { env: { FIXTURE_THROW: '1' } });
  assert.notEqual(r.status, 0);
  assertAggregateIntact(r);
  assert.match(r.stderr, /no records were captured — no capture file was written, anywhere/);
  assert.doesNotMatch(r.stderr, /paid record\(s\) are at/, 'an empty capture was written somewhere');
  assert.deepEqual(readdirSync(r.dir).sort(), ['aggregate.jsonl', 'bin', 'home']);
});

test('a run whose sink stopped accepting records says it bought them, not that it captured nothing', { skip: !existsSync('/proc/self/fd') && 'procfs is absent, so the sink descriptor cannot be found' }, () => {
  // A full disk on a long billed run appends nothing: the rows were paid for, the
  // records were produced, and `written` is 0 all the same. The knob reproduces
  // exactly that by taking the descriptor away mid-row; procfs is how it finds it.
  const r = liveRun(['--timeout', '30'], { env: { FIXTURE_SINK_LOST: '1' } });

  assert.notEqual(r.status, 0, 'a run that lost its evidence exited 0');
  assertAggregateIntact(r);
  assert.match(r.stderr, /stopped accepting records after "alpha"/);
  assert.match(r.stderr, /2 paid record\(s\) were produced and none could be written/,
    `the run did not say it bought records it could not keep:\n${r.stderr}`);
  assert.doesNotMatch(r.stderr, /no records were captured/,
    'a run that bought a row was told nothing was ever captured');
  assert.doesNotMatch(r.stderr, /paid record\(s\) are at/, 'a path was named for records that reached no file');
});

test('a whole-registry run with a fresh --out writes there — red included — and never touches the aggregate', () => {
  const r = liveRun(['--timeout', '30'], { env: { FIXTURE_RED: '1' } });
  // The same run again, this time naming its own destination.
  const out = path.join(r.dir, 'named.jsonl');
  const named = liveRun(['--timeout', '30', '--out', out], {
    env: { FIXTURE_RED: '1' },
    aggregate: path.join(r.dir, 'aggregate2.jsonl'),
  });
  assert.notEqual(named.status, 0, 'a red capture exited 0');
  assertAggregateIntact(named);
  assert.equal(readFileSync(out, 'utf8').trim().split('\n').length, 4,
    'an explicit --out did not receive the red capture it paid for');
  assertNoTemp(out);
});

test('the destination is claimed before the first spawn, so a later racer is the one refused', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'esq-live-race-'));
  const out = path.join(dir, 'raced.jsonl');
  const r = liveRun(['--timeout', '30', '--out', out], { env: { FIXTURE_RACE: out } });

  // The claim happens before the first spawn, so by the time a competitor tries
  // the same path it is taken — the lost `wx` race moved to the other side.
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(readFileSync(`${out}.refused`, 'utf8').trim(), 'EEXIST',
    'the destination was still free after the run had started spending');
  assert.equal(readFileSync(out, 'utf8').trim().split('\n').length, 4,
    'the run did not keep the records it paid for at the destination it claimed');
  assertAggregateIntact(r);
  assertNoTemp(out);
  rmSync(dir, { recursive: true, force: true });
});


// ------------------------------------------------------- the deadline as a bound
//
// B-135: `runOne` resolved from `close` alone, and `close` fires only once every
// inherited pipe is closed — which a killed `claude`'s own surviving children
// still hold. The `--timeout` the runner announces was a kill followed by an
// open-ended wait, on a harness three billed scripts spawn through.
//
// Everything below is free: `fixtures/fake-claude.sh` on PATH under the name
// `claude`, sub-second timeouts and graces so check 39's 120 s bound is never a
// concern, and real processes only because a process group is not a thing that
// can be faked.

const FAKE_CLAUDE = path.join(here, 'fixtures', 'fake-claude.sh');
const realKill = process.kill.bind(process);

/** Is this pid still answerable? Signal 0 asks without delivering anything. */
function alive(pid) {
  try { realKill(pid, 0); return true; } catch (err) { return err.code !== 'ESRCH'; }
}

/**
 * Puts the fake `claude` first on PATH and exports the knobs it reads. Returns
 * the restore, which every caller runs in a `finally`: PATH and env here are
 * this test process's own, and a leaked knob would reach a later test's spawn.
 */
function withFakeClaude(dir, knobs = {}) {
  const bin = path.join(dir, 'bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\nexec ${FAKE_CLAUDE} "$@"\n`);
  chmodSync(path.join(bin, 'claude'), 0o755);
  const savedPath = process.env.PATH;
  process.env.PATH = `${bin}:${savedPath}`;
  for (const [k, v] of Object.entries(knobs)) process.env[k] = String(v);
  return () => {
    process.env.PATH = savedPath;
    for (const k of Object.keys(knobs)) delete process.env[k];
  };
}

const scratchRoot = () => mkdtempSync(path.join(tmpdir(), 'esq-deadline-'));
const pidIn = (file) => {
  const n = Number(readFileSync(file, 'utf8').trim());
  assert.ok(Number.isInteger(n) && n > 0, `the fixture wrote no pid to ${file}`);
  return n;
};
const settleWait = (ms) => new Promise((r) => { setTimeout(r, ms); });

test('the deadline resolves and takes the whole tree with it, where killing the pid alone would not', async () => {
  const dir = scratchRoot();
  const self = path.join(dir, 'child.pid');
  const grand = path.join(dir, 'grandchild.pid');
  const restore = withFakeClaude(dir, {
    FAKE_CLAUDE_PIDFILE: self,
    FAKE_CLAUDE_GRANDCHILD_PIDFILE: grand,
  });
  try {
    const t0 = Date.now();
    const r = await testRunner().runOne('x', dir, 1000, { graceMs: 500 });
    const elapsed = Date.now() - t0;

    assert.equal(r.timedOut, true, 'the deadline did not fire');
    assert.ok(elapsed < 3000, `runOne took ${elapsed}ms — the current code would not have resolved at all`);
    // The reap is what makes Phase 2's survivor reading honest by ordering: by
    // the time this resolved, nothing in the group answers.
    await settleWait(100);
    assert.equal(alive(pidIn(self)), false, 'the `claude` itself outlived the deadline');
    assert.equal(alive(pidIn(grand)), false, 'the grandchild holding stdout open outlived the deadline');
  } finally {
    restore();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a child that exits before the deadline resolves once, from close, and is not reported timed out', async () => {
  const dir = scratchRoot();
  const restore = withFakeClaude(dir, { FAKE_CLAUDE_EMIT: '1' });
  try {
    const r = await testRunner().runOne('x', dir, 5000, { graceMs: 500 });
    assert.equal(r.timedOut, false, 'a child that beat the deadline was reported timed out');
    assert.equal(r.code, 0);
    assert.match(r.stdout, /alpha omega/, 'the buffered stream did not come back');
  } finally {
    restore();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the smallest positive timeout still resolves rather than throwing', async () => {
  const dir = scratchRoot();
  const self = path.join(dir, 'child.pid');
  const restore = withFakeClaude(dir, { FAKE_CLAUDE_PIDFILE: self, FAKE_CLAUDE_SLEEP: '30' });
  try {
    const t0 = Date.now();
    const r = await testRunner().runOne('x', dir, 1, { graceMs: 200 });
    assert.equal(r.timedOut, true);
    assert.ok(Date.now() - t0 < 2000, 'a 1 ms deadline did not resolve promptly');
    await settleWait(100);
    // A deadline this short can fire before the shell has finished writing its
    // own pid — an absent or half-written pidfile is the group kill winning a
    // race, not a failure. When the fixture did get that far, nothing it
    // recorded may still be alive.
    const recorded = existsSync(self) ? Number(readFileSync(self, 'utf8').trim()) : NaN;
    if (Number.isInteger(recorded) && recorded > 0) {
      assert.equal(alive(recorded), false, 'a 1 ms deadline left the child running');
    }
  } finally {
    restore();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an ESRCH group kill resolves under the grace, and no single-pid fallback is issued', async () => {
  const dir = scratchRoot();
  const self = path.join(dir, 'child.pid');
  const restore = withFakeClaude(dir, { FAKE_CLAUDE_PIDFILE: self, FAKE_CLAUDE_SLEEP: '30' });
  const calls = [];
  process.kill = (pid, signal) => {
    calls.push([pid, signal]);
    const err = new Error('kill ESRCH');
    err.code = 'ESRCH';
    throw err;
  };
  try {
    // Nothing is actually killed here, so this also proves the grace is a bound
    // in its own right: `close` cannot fire, and `runOne` resolves anyway.
    const t0 = Date.now();
    const r = await testRunner().runOne('x', dir, 200, { graceMs: 300 });
    assert.ok(Date.now() - t0 < 2000, 'the grace did not bound the wait');
    assert.equal(r.timedOut, true);
    assert.equal(r.code, null, 'a resolution from the grace claimed an exit code it never saw');
    assert.deepEqual(calls.map(([p]) => p), [-pidIn(self)],
      'the teardown issued something other than exactly one group kill — a single-pid fallback is group teardown weakened');
  } finally {
    process.kill = realKill;
    restore();
    try { realKill(-pidIn(self), 'SIGKILL'); } catch { /* already gone */ }
    rmSync(dir, { recursive: true, force: true });
  }
});

// ------------------------------------------- the grace, and the reading after it
//
// The deadline above is the ordinary path: the group kill reaches everything,
// `close` fires, the child is reaped before the survivor reading runs. This is
// the other one — a grandchild that `setsid`s out of the group, so the kill
// cannot reach it and `close` never fires. The grace is the only thing that can
// end the wait, and what the capture then publishes is a teardown that failed,
// which is exactly the row this reading exists for.

test('the grace ends a wait the group kill cannot, and the survivor reading still lists the escapee', { skip: !existsSync('/proc') }, async () => {
  const dir = scratchRoot();
  const self = path.join(dir, 'child.pid');
  const escapee = path.join(dir, 'escapee.pid');
  const probe = path.join(dir, 'escapee.probe');
  const restore = withFakeClaude(dir, {
    FAKE_CLAUDE_PIDFILE: self,
    FAKE_CLAUDE_ESCAPEE_PIDFILE: escapee,
    FAKE_CLAUDE_ESCAPEE_PROBE: '2',
    FAKE_CLAUDE_ESCAPEE_PROBEFILE: probe,
    FAKE_CLAUDE_SLEEP: '30',
  });
  let escaped = null;
  try {
    const t0 = Date.now();
    const r = await testRunner().runOne('x', dir, 400, { graceMs: 500 });
    const elapsed = Date.now() - t0;
    escaped = pidIn(escapee);

    // Settled once, inside timeout + grace, and from the grace rather than from
    // `close`: a null code is the shape only the grace resolution produces, and
    // the escapee still holding the pipe open is why `close` could not have.
    assert.equal(r.timedOut, true);
    assert.equal(r.code, null, 'this resolution came from `close`, so the grace was never the bound under test');
    assert.ok(elapsed < 3000, `runOne took ${elapsed}ms with an unreachable child holding stdout open`);
    assert.equal(alive(escaped), true, 'the escapee died on its own — the group kill reached it after all');

    // The reading, taken exactly as the loop takes it: one argument, nothing
    // excluded. The escapee is a process this run started and failed to kill,
    // and it is in the list.
    assert.equal(survivingProcesses.length, 1, 'survivingProcesses grew an exclusion argument — the reading is filtered now');
    const survivors = survivingProcesses(dir);
    assert.ok(survivors.includes(escaped), `the escapee ${escaped} is missing from ${JSON.stringify(survivors)}`);

    // And the pipes were destroyed rather than merely abandoned: the escapee
    // writes one line to the inherited stdout after the grace has expired, and
    // records the status of that write. A read end still held open answers 0.
    await settleWait(2500);
    const status = Number(readFileSync(probe, 'utf8').trim());
    assert.notEqual(status, 0, 'a write to the inherited stdout still succeeded — the grace resolved without destroying the pipes');
  } finally {
    restore();
    // By construction this one is outside every group the runner can signal, so
    // nothing but this line collects it — without it check 39 accumulates a
    // `sleep` per run.
    if (escaped) { try { realKill(escaped, 'SIGKILL'); } catch { /* already gone */ } }
    try { realKill(-pidIn(self), 'SIGKILL'); } catch { /* already gone */ }
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a non-ESRCH kill error is surfaced rather than swallowed', async () => {
  const dir = scratchRoot();
  const self = path.join(dir, 'child.pid');
  const restore = withFakeClaude(dir, { FAKE_CLAUDE_PIDFILE: self, FAKE_CLAUDE_SLEEP: '30' });
  process.kill = () => { const err = new Error('kill EPERM'); err.code = 'EPERM'; throw err; };
  try {
    await assert.rejects(
      () => testRunner().runOne('x', dir, 200, { graceMs: 300 }),
      /EPERM/,
      'a teardown that could not do what it says did not say so',
    );
  } finally {
    process.kill = realKill;
    restore();
    try { realKill(-pidIn(self), 'SIGKILL'); } catch { /* already gone */ }
    rmSync(dir, { recursive: true, force: true });
  }
});

// ------------------------------------------------------ the interrupt repayment
//
// `detached` is what makes the group kill possible and it is also what takes the
// child out of the terminal's foreground group, so `SIGINT` stops reaching it.
// Without the handlers `live` installs, interrupting a billed run leaves a
// `claude` and its grandchildren alive with their cwd inside a scratch root the
// loop is about to delete — invisible until someone interrupts a $3.75 run.

/** Spawns the live-runner fixture against the fake `claude`, without waiting. */
function liveProc(args, { env = {} } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'esq-interrupt-'));
  const bin = path.join(dir, 'bin');
  const home = path.join(dir, 'home');
  mkdirSync(bin);
  mkdirSync(home);
  writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\nexec ${FAKE_CLAUDE} "$@"\n`);
  chmodSync(path.join(bin, 'claude'), 0o755);

  const aggregate = path.join(dir, 'aggregate.jsonl');
  writeFileSync(aggregate, PRIOR);

  const child = spawn(process.execPath, [LIVE_RUNNER, ...args], {
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      HOME: home,
      FIXTURE_AGGREGATE: aggregate,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (d) => { stderr += d; });
  child.stdout.on('data', () => {});
  const done = new Promise((res) => { child.on('close', (code, signal) => res({ code, signal })); });
  return { child, dir, aggregate, done, stderrOf: () => stderr };
}

/** Waits for a path to appear, under a bound — never an open-ended sentinel. */
async function waitForFile(file, ms = 10_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (existsSync(file)) return true;
    await settleWait(50);
  }
  return false;
}

for (const [signal, status] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  test(`${signal} mid-row tears the group down, writes no capture, and exits ${status}`, async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'esq-signal-'));
    const self = path.join(dir, 'child.pid');
    const grand = path.join(dir, 'grandchild.pid');
    const run = liveProc(['--timeout', '60'], {
      env: {
        FAKE_CLAUDE_PIDFILE: self,
        FAKE_CLAUDE_GRANDCHILD_PIDFILE: grand,
        FAKE_CLAUDE_SLEEP: '60',
      },
    });
    const before = readFileSync(run.aggregate);
    try {
      assert.ok(await waitForFile(grand), 'the fixture never got as far as spawning a grandchild');
      run.child.kill(signal);
      const { code } = await run.done;

      assert.equal(code, status, `an interrupted run exited ${code}, not the conventional ${status}`);
      await settleWait(200);
      assert.equal(alive(pidIn(self)), false, `${signal} left the billed child alive`);
      assert.equal(alive(pidIn(grand)), false, `${signal} left a grandchild alive in a root about to be deleted`);
      assert.ok(readFileSync(run.aggregate).equals(before), 'an interrupted run replaced the aggregate');
      assert.doesNotMatch(run.stderrOf(), /paid record\(s\) are at/, 'an interrupted run wrote a capture for the row it killed');
    } finally {
      try { realKill(-pidIn(self), 'SIGKILL'); } catch { /* already gone */ }
      rmSync(dir, { recursive: true, force: true });
      rmSync(run.dir, { recursive: true, force: true });
    }
  });
}

// ------------------------------------------- the rows already bought survive it
//
// B-136: the loss the three tests above cannot see. They interrupt the *first*
// row, where there is nothing yet to lose — so `live` kept every completed row in
// memory and wrote them from a `finally` the signal handlers' `process.exit`
// never ran, and a contributor who interrupted row 2 of 4 lost rows 1's money.
// These drive a run where one row completes and the next one blocks.

/** The capture path an interrupted or unearned run named, without removing it. */
function keptAt(stderr) {
  const m = stderr.match(/paid record\(s\) are at (\S+?),/);
  assert.ok(m, `the diagnostic named no path for the paid records:\n${stderr}`);
  return m[1];
}

for (const [signal, status] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  test(`${signal} after a completed row keeps that row, exactly once, and says the run is incomplete`, async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'esq-signal-kept-'));
    const self = path.join(dir, 'child.pid');
    const grand = path.join(dir, 'grandchild.pid');
    // Row 1 emits and exits; row 2 emits, leaves a grandchild holding the pipe
    // open and sleeps. The grandchild's pidfile is therefore also the signal
    // that row 1 is already behind us.
    const run = liveProc(['--timeout', '60'], {
      env: {
        FAKE_CLAUDE_EMIT: '1',
        FIXTURE_ROW_ENV: JSON.stringify({
          2: { FAKE_CLAUDE_SLEEP: '60', FAKE_CLAUDE_PIDFILE: self, FAKE_CLAUDE_GRANDCHILD_PIDFILE: grand },
        }),
      },
    });
    const before = readFileSync(run.aggregate);
    try {
      assert.ok(await waitForFile(grand), 'the run never got as far as blocking on the second row');
      run.child.kill(signal);
      const { code } = await run.done;
      assert.equal(code, status, `an interrupted run exited ${code}, not the conventional ${status}`);
      await settleWait(200);

      assert.equal(alive(pidIn(self)), false, `${signal} left the billed child alive`);
      assert.equal(alive(pidIn(grand)), false, `${signal} left a grandchild alive in a root about to be deleted`);
      assert.ok(readFileSync(run.aggregate).equals(before), 'an interrupted run replaced the aggregate');

      const stderr = run.stderrOf();
      assert.match(stderr, /INCOMPLETE/, 'an interrupted run did not say it was incomplete');
      assert.match(stderr, /1 of 2 row\(s\) completed/);

      const file = keptAt(stderr);
      const records = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
      // Exactly once: two records, one row marker, and it is the row that finished.
      assert.deepEqual(records.map((r) => r.type), ['smoke-row', 'smoke-evidence'],
        'the row bought before the interrupt was lost, or kept more than once');
      assert.equal(records[0].branch, 'alpha');
      assert.equal(records.filter((r) => r.branch === 'omega').length, 0,
        'the row that was killed mid-flight was written as if it had completed');

      // And what survived does not replay as a whole registry: the missing row is
      // named as a problem, and the replay reds.
      const replay = spawnSync(process.execPath, [LIVE_RUNNER, '--parse'], {
        input: readFileSync(file, 'utf8'),
        encoding: 'utf8',
        env: { ...process.env, FIXTURE_AGGREGATE: run.aggregate },
      });
      assert.equal(replay.status, 1, 'a partial capture replayed green');
      assert.match(replay.stderr, /holds no row for "omega", which is in the registry/);

      rmSync(path.dirname(file), { recursive: true, force: true });
    } finally {
      try { realKill(-pidIn(self), 'SIGKILL'); } catch { /* already gone */ }
      rmSync(dir, { recursive: true, force: true });
      rmSync(run.dir, { recursive: true, force: true });
    }
  });
}

test('a capture that stops accepting records ends the run before the next paid row', () => {
  const r = liveRun(['--timeout', '30'], { env: { FIXTURE_UNSCHEMA: '1' } });

  assert.notEqual(r.status, 0, 'a run that could not keep its evidence exited 0');
  assertAggregateIntact(r);
  assert.match(r.stderr, /stopped accepting records after "alpha"/);
  assert.match(r.stderr, /spawned nothing further/);
  // One row's marker and the capture-error in its evidence's place — and no
  // second row, which is the point: the loss was not compounded.
  const records = readFileSync(keptAt(r.stderr), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(records.map((x) => x.type), ['smoke-row', 'capture-error']);
  assert.equal(records.filter((x) => x.branch === 'omega').length, 0, 'a second row was bought after the write failed');
});

test('the interrupt handlers live for one row and do not accumulate across rows', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'esq-listeners-'));
  const log = path.join(dir, 'listeners.txt');
  const run = liveProc(['--timeout', '30'], {
    env: { FIXTURE_LISTENERS: log, FAKE_CLAUDE_EMIT: '1' },
  });
  try {
    const { code } = await run.done;
    assert.equal(code, 0, `the two-row run did not finish green:\n${run.stderrOf()}`);
    const lines = readFileSync(log, 'utf8').trim().split('\n');
    assert.deepEqual(lines, ['in-flight 1 1 1', 'in-flight 1 1 1', 'settled 0 0 0'],
      'a second row either found the first row\'s handlers still installed, or found none of its own');
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(run.dir, { recursive: true, force: true });
  }
});
