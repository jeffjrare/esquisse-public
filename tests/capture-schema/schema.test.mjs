// The schema's own guard. The module it tests is the only thing standing between
// one operator's machine and a capture file checked into a public repository, so
// what is asserted here is fail-closed behaviour on six shapes — synthetic, no
// capture needed, no billed run:
//
//   1. a normal record round-trips
//   2. a source field the table does not declare is dropped, at every depth, with
//      no refusal — the truthful contract, and the one this module actually keeps
//   3. a record missing a required key is refused
//   4. an unknown record type is refused
//   5. a record that bypassed makeRecord is caught by assertSanitized
//   6. a failure mid-array leaves the verified prefix plus one capture-error on
//      disk, nothing else in the directory, and no field value on stderr
//
// Then the one assertion this whole change exists for: every capture checked into
// this repository, walked to every leaf against the table above.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  LEAF, RECORD_TYPES, SCHEMA, assertSanitized, isConstructed, makeRecord, openCapture, validateRecord,
  writeCapture,
} from '../../scripts/lib/capture-schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const MODULE = path.join(ROOT, 'scripts', 'lib', 'capture-schema.mjs');

const scratch = () => mkdtempSync(path.join(tmpdir(), 'capture-schema-'));
const lines = (file) => readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));

// A full smoke run's harvest, as the live path holds it: the declared evidence
// plus the fields that must never reach the file.
const SMOKE_SOURCE = {
  branch: 'inline',
  exit: 0,
  timedOut: false,
  elapsedMs: 41000,
  cost: 0.42,
  turns: 12,
  spawns: 0,
  cc: '2.1.235',
  says: true,
  commits: [{ hash: 'abc1234', subject: 'fix(greet): Hello', files: ['lib/greet.mjs'], author: 'someone@example.com' }],
  backlogRows: [{ id: 'B-200', status: 'Done', source: 'Done inline', summary: 'x', notes: 'undeclared' }],
  anchors: [{ path: 'docs/plans/p.md', text: '## Phases', mtime: 1 }],
  lane: { exit: 0, stdout: '{"lane":"direct"}', stderr: 'noise' },
  check: { exit: 0, stdout: 'ok' },
  dirty: [],
  // never declared, and each is a reason this module exists
  stream: { text: 'the model said something about /home/someone/projects' },
  session_id: 'f0e1d2c3-4b5a-6978-8796-a5b4c3d2e1f0',
  uuid: 'f0e1d2c3-4b5a-6978-8796-a5b4c3d2e1f0',
  cwd: '/home/someone/projects/esquisse',
};

// A full journey run's harvest, as `scripts/smoke-journeys.mjs` holds it before
// the record is built: the declared evidence plus the fields a judge must never
// be handed and the file must never publish.
const JOURNEY_SOURCE = {
  branch: 'reconcile',
  exit: 0,
  timedOut: false,
  elapsedMs: 63000,
  cost: 0.38,
  turns: 21,
  spawns: 0,
  cc: '2.1.251',
  says: true,
  init: { model: 'claude-opus-5', claude_code_version: '2.1.251', session_id: 'f0e1d2c3', cwd: '/home/someone' },
  commits: [{ hash: 'abc1234', subject: 'plan(x): log phase 1 execution', files: ['docs/plans/x.md'], author: 'someone@example.com' }],
  plan: { path: 'docs/plans/x.md', text: '### Phase 1 — completed 2026-08-30', mtime: 1 },  // text and mtime are undeclared
  logEntries: ['### Phase 1 — completed 2026-08-30'],
  citedCommits: [{ short: 'deadbee', resolved: 'deadbeef0123', subject: 'undeclared' }],
  // An escalated lane, as `esq lane` hands it back: the axes a judge reads, and the
  // `reason` the model wrote into the ledger, which is prose and must not be published.
  lane: {
    exit: 0,
    lane: 'code-risk',
    uncertainty: 'low',
    risk: 'high',
    recorded: 'direct',
    source: 'escalated',
    escalations: [{ phase: 1, axis: 'risk', to: 'high', reason: 'the phase writes the caller\'s API token to /home/someone/.tokens.json' }],
    stdout: '{"lane":"code-risk"}',
    stderr: 'noise',
  },
  validate: { exit: 0, valid: true, findings: ['/home/someone/docs/BACKLOG.md is unparseable'] },
  check: { exit: 0, stdout: 'ok' },
  dirty: [],
  // the two background-lifecycle facts, beside the registration-shaped fields
  // Gate A took out of this plan: neither is declared, so neither survives, and
  // the assertion below is what keeps a later phase from quietly adding one.
  backgroundLaunches: 2,
  survivingProcesses: [4111, 4112],
  registrationsLive: 1,
  lateDeliveries: [{ afterMs: 3_060_000, text: 'the model was resurrected to be told this' }],
  // never declared, and each is a reason this module exists
  stream: { text: 'the model reasoned out loud about /home/someone/projects' },
  prompt: '/esq:build docs/plans/x.md',
  session_id: 'f0e1d2c3-4b5a-6978-8796-a5b4c3d2e1f0',
  cwd: '/home/someone/projects/esquisse',
};

// A `system/init` event, whole, as the harness emits it.
const INIT_EVENT = {
  type: 'system',
  subtype: 'init',
  model: 'claude-opus-5',
  claude_code_version: '2.1.235',
  session_id: 'f0e1d2c3-4b5a-6978-8796-a5b4c3d2e1f0',
  cwd: '/home/someone/projects/esquisse',
  mcp_servers: [{ name: 'gmail', status: 'needs-auth' }],
  memory_paths: ['/home/someone/.claude/CLAUDE.md'],
  messaging_socket_path: '/run/user/1000/claude.sock',
  apiKeySource: 'none',
  tools: ['Bash', 'Read'],
  slash_commands: ['esq:work'],
  permissionMode: 'dontAsk',
  plugins: [{ name: 'esq', path: '/home/someone/projects/esquisse/plugin' }],
};

const leaves = (value, out = []) => {
  if (Array.isArray(value)) value.forEach((v) => leaves(v, out));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => { out.push(k); leaves(v, out); });
  return out;
};

// 1 ------------------------------------------------------------------ a normal record

test('a record built from declared fields round-trips through JSON', () => {
  const record = makeRecord('smoke-row', { branch: 'inline' });
  assert.deepEqual(JSON.parse(JSON.stringify(record)), { type: 'smoke-row', branch: 'inline' });
  assert.equal(validateRecord(record).ok, true);
  assert.equal(isConstructed(record), true);
});

test('every declared record type validates once its required keys are present', () => {
  for (const type of RECORD_TYPES) {
    const fields = {};
    for (const key of SCHEMA[type].required) fields[key] = 0;
    assert.equal(validateRecord(makeRecord(type, fields)).ok, true, type);
  }
});

// 2 -------------------------------------------- an undeclared field is dropped, not refused

test('a field the table does not declare is dropped at construction, with no refusal', () => {
  const record = makeRecord('smoke-evidence', SMOKE_SOURCE);
  // no refusal: dropping is what rule 1 does, and claiming a refusal here would be a lie
  assert.equal(validateRecord(record).ok, true);
  const keys = leaves(JSON.parse(JSON.stringify(record)));
  for (const forbidden of ['stream', 'session_id', 'uuid', 'cwd', 'branch', 'author', 'notes', 'mtime', 'stderr']) {
    assert.equal(keys.includes(forbidden), false, `${forbidden} survived construction`);
  }
  assert.equal(JSON.stringify(record).includes('/home/someone'), false, 'a home path survived construction');
  assert.equal(record.commits[0].hash, 'abc1234', 'judgeInline reads commits[].hash');
  assert.equal(record.lane.stdout, '{"lane":"direct"}');
});

test('a journey harvest keeps the ledger and drops the prose, the prompt and the findings', () => {
  const record = makeRecord('journey-evidence', JOURNEY_SOURCE);
  assert.equal(validateRecord(record).ok, true);
  // what a judge reads survives, to the leaf
  assert.deepEqual(record.logEntries, ['### Phase 1 — completed 2026-08-30']);
  assert.deepEqual(record.init, { model: 'claude-opus-5', claude_code_version: '2.1.251' });
  assert.deepEqual(record.citedCommits, [{ short: 'deadbee', resolved: 'deadbeef0123' }]);
  assert.deepEqual(record.validate, { exit: 0, valid: true });
  assert.deepEqual(Object.keys(record.plan), ['path'], 'the plan file\'s text is not a declared key');
  assert.deepEqual(record.lane, {
    exit: 0, lane: 'code-risk', uncertainty: 'low', risk: 'high', recorded: 'direct', source: 'escalated',
    escalations: [{ phase: 1, axis: 'risk', to: 'high' }],
  }, 'an escalation keeps the axis it raised and drops the sentence the model wrote for it');
  // and everything else is gone at construction
  const keys = leaves(JSON.parse(JSON.stringify(record)));
  for (const forbidden of ['stream', 'prompt', 'session_id', 'cwd', 'branch', 'author',
    'mtime', 'stderr', 'stdout', 'reason', 'findings', 'text']) {
    assert.equal(keys.includes(forbidden), false, `${forbidden} survived construction`);
  }
  assert.equal(record.commits[0].subject, 'plan(x): log phase 1 execution', 'a journey judge reads commits[].subject');
  assert.equal(JSON.stringify(record).includes('/home/someone'), false, 'a home path survived construction');
  assert.equal(JSON.stringify(record).includes('esq:build'), false, 'the prompt survived construction');
});

// The two background-lifecycle fields, walked to their leaves. Both are counts,
// and the point of asserting it here is that a count is the *whole* of what a
// teardown judge is allowed to read: the moment one of them grows a string, this
// file publishes something a model or a harness wrote.
test('the background-lifecycle fields are counts, and carry nothing content-bearing', () => {
  const record = makeRecord('journey-evidence', JOURNEY_SOURCE);
  assert.equal(record.backgroundLaunches, 2, 'a judge cannot tell a background launch from a foreground one without it');
  assert.deepEqual(record.survivingProcesses, [4111, 4112], 'the pids the run left alive in its own scratch root');

  const walked = JSON.parse(JSON.stringify(record));
  assert.equal(typeof walked.backgroundLaunches, 'number');
  for (const pid of walked.survivingProcesses) {
    assert.equal(typeof pid, 'number', 'a surviving process is a pid and never a command line');
  }

  // Gate A took registrations and post-result delivery out of this plan, so the
  // harvest must not carry them even when the source object does. A field
  // collected for no consumer is a wider privacy surface bought for nothing —
  // and `lateDeliveries[].text` is the shape of what it would have published.
  const keys = leaves(walked);
  for (const forbidden of ['registrationsLive', 'lateDeliveries', 'afterMs']) {
    assert.equal(keys.includes(forbidden), false, `${forbidden} survived construction — the harvest widened past its judge`);
  }
  assert.equal(JSON.stringify(record).includes('resurrected'), false, 'a late delivery\'s text survived construction');
});

// The count, asserted rather than trusted. Phase 2 of the background-task
// lifecycle plan was scoped to *two* new fields on this record and no others;
// this is the arithmetic that says so, and it is what a third field has to
// argue with rather than slip past.
test('journey-evidence declares exactly the two background-lifecycle fields it was scoped for', () => {
  const declared = Object.keys(SCHEMA['journey-evidence'].fields);
  const lifecycle = declared.filter((k) => k === 'backgroundLaunches' || k === 'survivingProcesses');
  assert.deepEqual(lifecycle.sort(), ['backgroundLaunches', 'survivingProcesses']);
  assert.equal(declared.length, 20, `journey-evidence declares ${declared.length} fields, not the 20 this scope allows`);

  // Neither is required: an older capture predates both, and reads as absent.
  for (const field of lifecycle) {
    assert.equal(SCHEMA['journey-evidence'].required.includes(field), false,
      `${field} is required, so every capture written before it stops validating`);
  }

  // And they are declared here and nowhere else — the P-07 pair drops them at
  // construction, the way it drops `init`.
  assert.equal('backgroundLaunches' in SCHEMA['smoke-evidence'].fields, false);
  assert.equal('survivingProcesses' in SCHEMA['smoke-evidence'].fields, false);
  const smoke = makeRecord('smoke-evidence', { ...SMOKE_SOURCE, backgroundLaunches: 3, survivingProcesses: [7] });
  assert.equal('backgroundLaunches' in smoke, false, 'a P-07 capture grew a journey field at the call site');
  assert.equal('survivingProcesses' in smoke, false);
});

test('a whole system/init event reduces to the two fields the probe table shows', () => {
  const record = makeRecord('probe-evidence', {
    exit: 0, main: ['claude-opus-5'], subagents: {}, usage: [], sawModel: 3, replied: true,
    spawns: { toolu_1: { model: 'claude-haiku-4-5', background: false, subagentType: 'general-purpose', prompt: 'secret' } },
    init: INIT_EVENT,
  });
  assert.deepEqual(record.init, { model: 'claude-opus-5', claude_code_version: '2.1.235' });
  assert.deepEqual(Object.keys(record.spawns.toolu_1), ['model', 'background', 'subagentType']);
  const serialized = JSON.stringify(record);
  for (const forbidden of ['session_id', 'mcp_servers', 'memory_paths', 'messaging_socket_path',
    'apiKeySource', 'slash_commands', 'permissionMode', 'plugins', 'cwd', '/home/someone', 'secret']) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} survived construction`);
  }
});

// 3 ------------------------------------------------------------- a missing required key

test('a record missing a required key is refused, and the diagnostic names the key', () => {
  const verdict = validateRecord({ type: 'smoke-row' });
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, 'missing required key(s)');
  assert.deepEqual(verdict.missing, ['branch']);
});

test('a required key present but null counts as present; only absence is missing', () => {
  assert.equal(validateRecord(makeRecord('smoke-row', { branch: null })).ok, true);
  assert.equal(validateRecord(makeRecord('smoke-row', { branch: undefined })).ok, false);
});

// 4 --------------------------------------------------------------- an unknown record type

test('an unknown record type is refused, and no harness event type is known', () => {
  for (const type of ['assistant', 'system', 'result', 'user', 'rate_limit_event']) {
    const verdict = validateRecord({ type, message: { model: 'claude-opus-5' } });
    assert.equal(verdict.ok, false, type);
    assert.equal(verdict.reason, 'unknown record type');
    assert.equal(verdict.recordType, type);
  }
  assert.throws(() => makeRecord('assistant', {}), /no such record type/);
});

test('a non-conforming type is never quoted back into a diagnostic', () => {
  const verdict = validateRecord({ type: '/home/someone/secret path that is not a type name' });
  assert.equal(verdict.recordType, '<non-conforming>');
  assert.equal(validateRecord(null).recordType, '<non-conforming>');
});

// 5 ------------------------------------------------------------------- a bypassed record

test('assertSanitized fires on a record that did not come from makeRecord', () => {
  const good = makeRecord('smoke-row', { branch: 'inline' });
  assert.equal(assertSanitized([good, good]).ok, true);
  // a copy is schema-shaped and still a bypass: the brand cannot be spread
  const copy = { ...good };
  assert.equal(validateRecord(copy).ok, true);
  const verdict = assertSanitized([good, copy]);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.index, 1);
  assert.match(verdict.reason, /internal bypass, not a harness field/);
  // and the shape the whole plan exists to stop
  assert.equal(assertSanitized([good, INIT_EVENT]).ok, false);
});

test('a record is frozen at construction, so it cannot gain a field after the brand', () => {
  const record = makeRecord('smoke-row', { branch: 'inline' });
  assert.throws(() => { 'use strict'; record.session_id = 'x'; }, TypeError);
});

// 6 ---------------------------------------------------------------- a failure mid-array

test('a failure writes the verified prefix and one capture-error, and nothing else', () => {
  const dir = scratch();
  try {
    const file = path.join(dir, 'capture.jsonl');
    const records = [
      makeRecord('smoke-row', { branch: 'inline' }),
      makeRecord('smoke-evidence', SMOKE_SOURCE),
      makeRecord('smoke-row', {}), // branded, and still refused: the schema check runs after the bypass check
      makeRecord('smoke-row', { branch: 'refuses' }),
    ];
    const result = writeCapture(file, records, { mode: 'exclusive' });
    assert.equal(result.status, 1);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl'], 'a second file appeared beside the capture');
    const written = lines(file);
    assert.equal(written.length, 3);
    assert.deepEqual(written[0], { type: 'smoke-row', branch: 'inline' });
    assert.equal(written[1].type, 'smoke-evidence');
    assert.deepEqual(written[2], {
      type: 'capture-error', index: 2, recordType: 'smoke-row', missing: ['branch'], reason: 'missing required key(s)',
    });
    // the record that failed is nowhere in the file, and neither is anything it carried
    assert.equal(readFileSync(file, 'utf8').includes('/home/someone'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a first-record failure writes a file holding one capture-error and nothing else', () => {
  const dir = scratch();
  try {
    const file = path.join(dir, 'capture.jsonl');
    assert.equal(writeCapture(file, [INIT_EVENT], { mode: 'exclusive' }).status, 1);
    const written = lines(file);
    assert.equal(written.length, 1);
    assert.equal(written[0].type, 'capture-error');
    assert.equal(written[0].index, 0);
    assert.equal(readFileSync(file, 'utf8').includes('mcp_servers'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the failure path puts no field value on stderr and writes no other file', () => {
  const dir = scratch();
  try {
    const file = path.join(dir, 'capture.jsonl');
    const script = `
      import { makeRecord, writeCapture } from ${JSON.stringify(MODULE)};
      const init = ${JSON.stringify(INIT_EVENT)};
      const r = writeCapture(${JSON.stringify(file)}, [makeRecord('smoke-row', { branch: 'inline' }), init], { mode: 'exclusive' });
      process.exit(r.status);
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
    assert.equal(run.status, 1, run.stderr);
    assert.equal(run.stdout, '');
    for (const value of ['/home/someone', 'mcp_servers', 'memory_paths', 'messaging_socket_path',
      'apiKeySource', 'claude.sock', 'f0e1d2c3', 'claude-opus-5', 'gmail', 'dontAsk']) {
      assert.equal(run.stderr.includes(value), false, `stderr carried ${value}`);
    }
    assert.match(run.stderr, /record 1 \(system\)/);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// 7 ------------------------------------------------------- the write mode is required
//
// B-098: the live half of the shared runner defaulted its destination to the
// checked-in aggregate capture and wrote it from a `finally`, so one narrowed run
// replaced three journeys' paid evidence with one row pair. The fix is a property
// of the *write*, not of the caller's diligence — `writeCapture` has no default
// mode, so the branch that replaces an existing capture cannot be reached by
// omission. What is asserted below is that every other mode preserves.

const PRIOR = 'the paid capture that must survive\n';

/** A scratch directory holding one pre-existing file, and its exact bytes. */
function withPrior() {
  const dir = scratch();
  const file = path.join(dir, 'capture.jsonl');
  writeFileSync(file, PRIOR);
  return { dir, file };
}

const GOOD = () => [makeRecord('smoke-row', { branch: 'inline' })];
// branded, and still refused: the schema check runs after the bypass check
const BAD = () => [makeRecord('smoke-row', { branch: 'inline' }), makeRecord('smoke-row', {})];

test('a write with no mode refuses and leaves a pre-existing capture byte-identical', () => {
  const { dir, file } = withPrior();
  try {
    const result = writeCapture(file, GOOD());
    assert.equal(result.status, 1);
    assert.equal(result.written, 0);
    assert.equal(result.mode, null);
    assert.equal(readFileSync(file, 'utf8'), PRIOR);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl'], 'the refusal wrote a file somewhere');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an unknown mode refuses the same way, and a non-object options bag does too', () => {
  const { dir, file } = withPrior();
  try {
    for (const options of [{ mode: 'clobber' }, { mode: 'OVERWRITE' }, { mode: true }, null, 'overwrite']) {
      assert.equal(writeCapture(file, GOOD(), options).status, 1);
    }
    assert.equal(readFileSync(file, 'utf8'), PRIOR);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('exclusive leaves a pre-existing capture byte-identical and reports the collision', () => {
  const { dir, file } = withPrior();
  try {
    const result = writeCapture(file, GOOD(), { mode: 'exclusive' });
    assert.equal(result.status, 1);
    assert.equal(result.written, 0);
    assert.equal(result.collision, file);
    assert.equal(readFileSync(file, 'utf8'), PRIOR);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('exclusive takes a fresh path, and the second run of the same command cannot take it again', () => {
  const dir = scratch();
  try {
    const file = path.join(dir, 'pause.jsonl');
    assert.equal(writeCapture(file, GOOD(), { mode: 'exclusive' }).status, 0);
    const bytes = readFileSync(file, 'utf8');
    assert.equal(writeCapture(file, [makeRecord('smoke-row', { branch: 'refuses' })], { mode: 'exclusive' }).status, 1);
    assert.equal(readFileSync(file, 'utf8'), bytes, 'the second exclusive write replaced the first capture');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a capture-error outcome never lands on a pre-existing file, under either mode', () => {
  for (const mode of ['exclusive', 'atomic']) {
    const { dir, file } = withPrior();
    try {
      const result = writeCapture(file, BAD(), { mode });
      if (mode === 'exclusive') {
        assert.equal(result.collision, file);
        assert.equal(readFileSync(file, 'utf8'), PRIOR, 'exclusive published a capture-error over paid evidence');
      } else {
        // `atomic` is the earned replacement: it is only ever aimed at the
        // aggregate by a caller that already decided the run qualifies, so the
        // assertion here is that it leaves no debris — the eligibility gate is
        // the runner's, and Phase 3 is where it is tested.
        assert.equal(result.status, 1);
        assert.equal(lines(file).at(-1).type, 'capture-error');
      }
      assert.deepEqual(readdirSync(dir), ['capture.jsonl'], `${mode} left a temp file behind`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('atomic replaces in one step and leaves no temp file behind on success', () => {
  const { dir, file } = withPrior();
  try {
    const result = writeCapture(file, GOOD(), { mode: 'atomic' });
    assert.equal(result.status, 0);
    assert.deepEqual(lines(file), [{ type: 'smoke-row', branch: 'inline' }]);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl'], 'a temp file survived the atomic write');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('atomic writes its temp file in the target directory, so the rename cannot cross a filesystem', () => {
  const source = readFileSync(MODULE, 'utf8');
  const atomic = source.slice(source.indexOf('function place('));
  assert.match(atomic, /path\.dirname\(path\.resolve\(file\)\)/);
  assert.equal(atomic.includes('tmpdir'), false, 'the atomic temp file left the target directory — rename can EXDEV');
  assert.match(atomic, /flag: 'wx'/, 'the atomic temp file is not exclusively created');
});

test('a serialization failure writes nothing and leaves no temp file', () => {
  const { dir, file } = withPrior();
  try {
    // a BigInt leaf: `makeRecord` keeps it, and `JSON.stringify` refuses it
    const result = writeCapture(file, [makeRecord('smoke-row', { branch: 1n })], { mode: 'atomic' });
    assert.equal(result.status, 1);
    assert.equal(result.written, 0);
    assert.equal(readFileSync(file, 'utf8'), PRIOR);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl'], 'a temp file survived a serialization failure');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a failed rename unlinks the temp file and leaves the destination untouched', () => {
  const dir = scratch();
  try {
    // the destination is a non-empty directory, so `rename` cannot take it
    const file = path.join(dir, 'capture.jsonl');
    mkdirSync(file);
    writeFileSync(path.join(file, 'occupied'), 'x');
    const result = writeCapture(file, GOOD(), { mode: 'atomic' });
    assert.equal(result.status, 1);
    assert.equal(result.written, 0);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl'], 'the temp file survived a failed rename');
    assert.deepEqual(readdirSync(file), ['occupied'], 'the failed rename disturbed the destination');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('overwrite still replaces byte-for-byte, and no script in the repo names it any more', () => {
  const { dir, file } = withPrior();
  try {
    const result = writeCapture(file, GOOD(), { mode: 'overwrite' });
    assert.equal(result.status, 0);
    assert.equal(readFileSync(file, 'utf8'), '{"type":"smoke-row","branch":"inline"}\n');
    assert.deepEqual(readdirSync(dir), ['capture.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // The legacy branch survives in the module, reachable only by name — and B-099
  // took its last caller: the probe claims its destination with `openCapture`
  // instead of replacing it after every row. Nothing under scripts/ may reacquire
  // it without this line failing first.
  const sites = spawnSync('git', ['grep', '-n', "mode: 'overwrite'", '--', 'scripts/'],
    { cwd: ROOT, encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean);
  assert.deepEqual(sites, [], `overwrite is named again under scripts/:\n${sites.join('\n')}`);
});

// ---------------------------------------------------------------- openCapture
//
// B-099: a billed run produces its records over minutes, and the only way it
// could keep a partial run's rows was to rewrite the whole file after each one —
// which needs a mode, and the only mode that tolerates an existing file destroys
// it. `openCapture` claims the destination instead. What is asserted here is the
// three properties that made it worth adding: the collision costs nothing and
// preserves everything, an interruption keeps what was already paid for, and no
// sibling file exists at any moment for a crash to strand.

test('openCapture refuses a destination that already holds a capture, and leaves it byte-identical', () => {
  const { dir, file } = withPrior();
  try {
    const handle = openCapture(file);
    assert.equal(handle.collision, file);
    assert.equal(handle.ok, false);
    // the refusal is readable before a caller spends anything
    assert.equal(readFileSync(file, 'utf8'), PRIOR);
    // and an append against a handle that never opened writes nowhere
    assert.equal(handle.append(GOOD()).written, 0);
    assert.equal(handle.close().status, 1);
    assert.equal(readFileSync(file, 'utf8'), PRIOR);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('openCapture appends record by record and creates no temp or sibling file at any point', () => {
  const dir = scratch();
  const file = path.join(dir, 'capture.jsonl');
  try {
    const handle = openCapture(file);
    for (const branch of ['one', 'two', 'three']) {
      handle.append([makeRecord('smoke-row', { branch })]);
      // mid-run, and after every single append: the capture and nothing beside it
      assert.deepEqual(readdirSync(dir), ['capture.jsonl'], 'a sibling file appeared mid-run');
    }
    const result = handle.close();
    assert.equal(result.status, 0);
    assert.equal(result.written, 3);
    assert.deepEqual(lines(file).map((r) => r.branch), ['one', 'two', 'three']);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a run killed mid-capture leaves every already-appended record on disk and parsable', () => {
  const dir = scratch();
  const file = path.join(dir, 'capture.jsonl');
  try {
    // SIGKILL, in a child, after two appends and with the handle never closed:
    // the strongest form of "interrupted", and the one a deadline actually causes.
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import { makeRecord, openCapture } from ${JSON.stringify(MODULE)};
      const h = openCapture(${JSON.stringify(file)});
      h.append([makeRecord('smoke-row', { branch: 'billed-1' })]);
      h.append([makeRecord('smoke-row', { branch: 'billed-2' })]);
      process.kill(process.pid, 'SIGKILL');
    `], { encoding: 'utf8' });
    assert.equal(r.signal, 'SIGKILL', `the child did not die by signal: ${r.stderr}`);
    assert.deepEqual(lines(file).map((r2) => r2.branch), ['billed-1', 'billed-2']);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl'], 'the killed run stranded a sibling file');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a schema failure mid-stream keeps the verified prefix, names its index in the whole stream, and closes', () => {
  const dir = scratch();
  const file = path.join(dir, 'capture.jsonl');
  try {
    const handle = openCapture(file);
    handle.append(GOOD());
    const failed = handle.append(BAD());
    assert.equal(failed.status, 1);
    // 0 and 1 are the two good records; the capture-error stands in for index 2
    assert.equal(failed.error.index, 2);
    assert.equal(handle.ok, false, 'the handle stayed open after a schema failure');
    // every later append is a no-op — the file is settled
    handle.append([makeRecord('smoke-row', { branch: 'after' })]);
    const records = lines(file);
    assert.deepEqual(records.map((r) => r.type), ['smoke-row', 'smoke-row', 'capture-error']);
    assert.equal(records[2].index, 2);
    assert.deepEqual(records[2].missing, ['branch']);
    assert.deepEqual(readdirSync(dir), ['capture.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------- the checked-in files
//
// The primary privacy proof, and deliberately not a grep: a secret that leaks
// leaks nested, and a grep for a key name reads the line it happens to sit on
// rather than the tree. Every `*.jsonl` under `tests/` is a capture some billed
// script wrote and this repository publishes, so all of them are walked — a
// fixture added later is covered by being found, not by being remembered.
//
// Three refusals, in this order of strength:
//
//   1. **An undeclared key.** Every key, at every depth, must be one the table
//      names for that record and that position. This is the total one: it refuses
//      the field a future Claude Code adds as readily as the ones named below.
//   2. **A key in the sensitive set.** Machine and account identity, named so the
//      failure says which class was published rather than "unknown key".
//   3. **A home-rooted string.** Any value spelling `os.homedir()` or a `/home/`
//      or `/Users/`-rooted path, at any depth, including an object's own keys —
//      `plugins[].path` is what leaked, and it leaked as a value.

const SENSITIVE_KEYS = new Set([
  'session_id', 'uuid', 'mcp_servers', 'memory_paths', 'messaging_socket_path',
  'apiKeySource', 'tools', 'slash_commands', 'cwd',
]);

const HOME = homedir();
const homeRooted = (value) => (HOME && HOME !== '/' && value.includes(HOME))
  || /(?<![\w.-])\/(?:home|Users)\//.test(value);

function checkString(value, where, fail) {
  if (homeRooted(value)) fail(`${where} carries a home-rooted path: ${value.slice(0, 80)}`);
}

function checkKey(key, where, fail) {
  if (SENSITIVE_KEYS.has(key)) fail(`${where}.${key} is machine or account identity, and it is published`);
  checkString(key, `${where}'s key`, fail);
}

// Walks one value against its field spec. `spec` is the table's own, so an
// undeclared key cannot be reached: it is refused at the object that holds it.
function walk(spec, value, where, fail) {
  if (value === null || value === undefined) return;
  if (spec === LEAF || spec.kind === 'leaf') {
    if (Array.isArray(value)) { value.forEach((v, i) => walk(LEAF, v, `${where}[${i}]`, fail)); return; }
    if (typeof value === 'object') { fail(`${where} is a declared leaf holding an object — an unreduced blob`); return; }
    if (typeof value === 'string') checkString(value, where, fail);
    return;
  }
  if (spec.kind === 'list') {
    if (!Array.isArray(value)) { fail(`${where} should be a list`); return; }
    value.forEach((v, i) => walk(spec.item, v, `${where}[${i}]`, fail));
    return;
  }
  if (spec.kind === 'map') {
    if (typeof value !== 'object' || Array.isArray(value)) { fail(`${where} should be an object`); return; }
    for (const [key, v] of Object.entries(value)) {
      checkKey(key, where, fail);
      walk(spec.value, v, `${where}.${key}`, fail);
    }
    return;
  }
  if (typeof value !== 'object' || Array.isArray(value)) { fail(`${where} should be an object`); return; }
  for (const [key, v] of Object.entries(value)) {
    checkKey(key, where, fail);
    if (!Object.prototype.hasOwnProperty.call(spec.fields, key)) {
      fail(`${where}.${key} is persisted and the schema does not declare it`);
      continue;
    }
    walk(spec.fields[key], v, `${where}.${key}`, fail);
  }
}

function auditRecords(records, where) {
  const findings = [];
  const at = (i) => `${where} record ${i}`;
  records.forEach((record, i) => {
    const fail = (message) => findings.push(message);
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      fail(`${at(i)} is not an object`);
      return;
    }
    const entry = SCHEMA[record.type];
    if (!entry) { fail(`${at(i)} has type "${record.type}", which the schema does not declare`); return; }
    if (record.type === 'capture-error') fail(`${at(i)} is a capture-error — this capture recorded a refusal and was checked in anyway`);
    for (const key of entry.required) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) fail(`${at(i)} (${record.type}) is missing the required key ${key}`);
    }
    walk({ kind: 'shape', fields: { type: LEAF, ...entry.fields } }, record, at(i), fail);
  });
  return findings;
}

function captureFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...captureFiles(full));
    else if (name.endsWith('.jsonl')) out.push(full);
  }
  return out.sort();
}

test('every capture checked into this repository carries only what the schema declares', () => {
  const files = captureFiles(path.join(ROOT, 'tests'));
  assert.ok(files.length >= 6, `found ${files.length} checked-in captures — the fixtures moved or the walk stopped finding them`);

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const records = lines(file);
    assert.ok(records.length, `${rel} is empty`);
    assert.deepEqual(auditRecords(records, rel), [], `${rel} publishes something the schema does not declare`);
  }
});

// The assertion above is only worth what it refuses. Each of these is the shape of
// one real leak, injected into a copy of a real record.
test('the walk refuses an undeclared key, a sensitive key and a home path, at depth', () => {
  const good = JSON.parse(JSON.stringify(makeRecord('smoke-evidence', SMOKE_SOURCE)));
  assert.deepEqual(auditRecords([good], 'f'), []);

  const undeclared = { ...good, plugins: [{ name: 'esq' }] };
  assert.match(auditRecords([undeclared], 'f')[0], /plugins is persisted and the schema does not declare it/);

  const nested = JSON.parse(JSON.stringify(good));
  nested.commits[0].session_id = 'e7c0ffee';
  const nestedFindings = auditRecords([nested], 'f');
  assert.match(nestedFindings[0], /session_id is machine or account identity/);
  assert.match(nestedFindings[1], /session_id is persisted and the schema does not declare it/);

  const home = JSON.parse(JSON.stringify(good));
  home.anchors[0].text = 'the plugin lives at /home/someone/projects/esquisse/plugin';
  assert.match(auditRecords([home], 'f')[0], /carries a home-rooted path/);

  const backticked = JSON.parse(JSON.stringify(good));
  backticked.anchors[0].text = 'the plugin lives at `/home/someone/projects/esquisse/plugin`';
  assert.match(auditRecords([backticked], 'f')[0], /carries a home-rooted path/);

  const blob = { ...good, dirty: [{ path: 'M lib/greet.mjs' }] };
  assert.match(auditRecords([blob], 'f')[0], /declared leaf holding an object/);

  const unknownType = { type: 'system', subtype: 'init' };
  assert.match(auditRecords([unknownType], 'f')[0], /the schema does not declare/);

  const errored = makeRecord('capture-error', { index: 0, recordType: 'smoke-row', missing: ['branch'], reason: 'missing required key(s)' });
  assert.match(auditRecords([JSON.parse(JSON.stringify(errored))], 'f')[0], /recorded a refusal and was checked in anyway/);
});
