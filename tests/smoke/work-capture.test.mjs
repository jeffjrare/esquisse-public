// The judge's own regression suite — free, and the only thing standing between
// `tests/smoke/fixtures/capture.jsonl` and a judge that has quietly stopped
// judging. The live script bills; this does not. Every assertion here runs over
// the checked-in capture or a copy of it mutated to break exactly one contract:
// a judge that never fails is not a judge.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  BRANCHES, EVIDENCE_MARKER, REPLAYED, ROW_MARKER, captureRecords, judgeCapture, judgeEvidence,
  parseLines, rowFor, splitCapture,
} from '../../scripts/smoke-work-capture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..');
const SCRIPT = path.join(REPO, 'scripts', 'smoke-work-capture.mjs');
const CAPTURE = path.join(here, 'fixtures', 'capture.jsonl');
const mutatedPath = (branch) => path.join(here, 'fixtures', 'mutated', `${branch}.jsonl`);

const read = (file) => parseLines(readFileSync(file, 'utf8'));
const byBranch = (judged) => Object.fromEntries(judged.map((r) => [r.branch, r.verdict]));

test('the checked-in capture judges every replayed P-07 branch green, with no problems', () => {
  const { judged, problems, version } = judgeCapture(read(CAPTURE));
  assert.deepEqual(problems, []);
  assert.deepEqual(judged.map((r) => r.branch), REPLAYED);
  for (const row of judged) {
    assert.equal(row.verdict, 'pass', `${row.branch}: ${row.failures.join(' · ')}`);
  }
  assert.match(version, /^\d+\.\d+\.\d+$/);
});

// `inline` has no mutation here because it has no saved capture here — see REPLAYED.
for (const branch of REPLAYED) {
  test(`the mutated ${branch} capture reds ${branch} and leaves the others green`, () => {
    const { judged, problems } = judgeCapture(read(mutatedPath(branch)));
    assert.deepEqual(problems, []);
    const verdicts = byBranch(judged);
    assert.equal(verdicts[branch], 'FAIL');
    for (const other of REPLAYED.filter((b) => b !== branch)) {
      assert.equal(verdicts[other], 'pass', `${other} reddened too — the mutation is not branch-local`);
    }
    const failed = judged.find((r) => r.branch === branch);
    assert.ok(failed.failures.length, 'a FAIL with no named failure tells the maintainer nothing');
  });
}

// The judges read `smoke-evidence` and nothing else. A capture whose corroboration
// came out false but whose artifacts are right must still pass — that is the whole
// reason the verdict was put on artifacts in the first place. The column is now a
// persisted boolean rather than prose the judge re-greps, so this is asserted where
// it now lives: `says: false` on every evidence record, with no text to fall back to.
test('the corroboration column is a persisted boolean and still gates nothing', () => {
  const records = read(CAPTURE).map((ev) => (
    ev && ev.type === EVIDENCE_MARKER ? { ...ev, says: false, stream: undefined } : ev
  ));
  const { judged, problems } = judgeCapture(records);
  assert.deepEqual(problems, []);
  assert.equal(judged.length, BRANCHES.length);
  for (const row of judged) {
    assert.equal(row.verdict, 'pass', `${row.branch} reddened on the corroboration alone`);
    assert.equal(row.says, 'not said');
  }
});

test('splitCapture groups each run between its markers and drops anything before the first one', () => {
  const rows = splitCapture([
    { type: 'system', subtype: 'init', claude_code_version: '9.9.9' },
    { type: ROW_MARKER, branch: 'refuses' },
    { type: 'assistant', message: { content: [] } },
    { type: EVIDENCE_MARKER, branch: 'refuses', commits: [] },
    { type: ROW_MARKER, branch: 'inline' },
    { type: 'result', total_cost_usd: 1 },
    null,
  ]);
  assert.deepEqual(rows.map((r) => r.branch), ['refuses', 'inline']);
  assert.equal(rows[0].events.length, 1);
  assert.equal(rows[0].evidence.commits.length, 0);
  assert.equal(rows[1].evidence, null);
  assert.equal(rows[1].events.length, 1);
});

test('a capture that cannot be judged is a problem, never a silent pass', () => {
  assert.match(judgeCapture([{ type: 'assistant' }]).problems[0], /no smoke-row marker/);

  const noEvidence = judgeCapture([{ type: ROW_MARKER, branch: 'inline' }]);
  assert.deepEqual(noEvidence.judged, []);
  assert.match(noEvidence.problems[0], /has no smoke-evidence record/);

  const unknown = judgeCapture([{ type: ROW_MARKER, branch: 'not-a-branch' }]);
  assert.match(unknown.problems[0], /not a P-07 branch/);

  const twice = judgeCapture([
    { type: ROW_MARKER, branch: 'refuses' }, { type: EVIDENCE_MARKER, branch: 'refuses' },
    { type: ROW_MARKER, branch: 'refuses' }, { type: EVIDENCE_MARKER, branch: 'refuses' },
  ]);
  assert.equal(twice.judged.length, 1);
  assert.match(twice.problems[0], /two rows for "refuses"/);
});

// --parse is the free path. If it can reach a spawn, a mistyped replay becomes
// four billed runs — so the stub is the assertion, not the exit code.
function runParse(file) {
  const stubDir = mkdtempSync(path.join(tmpdir(), 'esq-smoke-stub-'));
  const marker = path.join(stubDir, 'spawned');
  writeFileSync(path.join(stubDir, 'claude'), `#!/bin/sh\ntouch ${marker}\nexit 0\n`);
  chmodSync(path.join(stubDir, 'claude'), 0o755);
  const r = spawnSync(process.execPath, [SCRIPT, '--parse'], {
    input: file ? readFileSync(file) : '',
    encoding: 'utf8',
    env: { ...process.env, PATH: `${stubDir}:${process.env.PATH}` },
  });
  return { ...r, spawned: existsSync(marker) };
}

test('--parse replays the good capture at exit 0 and starts no claude process', () => {
  const r = runParse(CAPTURE);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.spawned, false, '--parse reached a claude spawn — the free path can bill');
  assert.match(r.stdout, /parse \(replayed, \$0\)/);
  for (const branch of BRANCHES) assert.match(r.stdout, new RegExp(`^${branch}\\s+pass`, 'm'));
});

for (const branch of BRANCHES) {
  test(`--parse exits 1 on the mutated ${branch} capture and names ${branch}`, () => {
    const r = runParse(mutatedPath(branch));
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.spawned, false);
    assert.match(r.stdout, new RegExp(`^${branch}\\s+FAIL`, 'm'));
    assert.match(r.stdout, new RegExp(`^✖ ${branch}$`, 'm'));
  });
}

test('--parse refuses an empty stdin with exit 2 rather than falling through to the billed path', () => {
  const r = runParse('');
  assert.equal(r.status, 2);
  assert.equal(r.spawned, false, 'an empty capture reached a claude spawn — the refusal is what keeps --parse free');
  assert.match(r.stderr, /reads a capture on stdin/);
});

// The equivalence the whole change rests on. A raw stream carrying every ambient
// field the harness emits goes through `captureRecords` — the production write
// side itself, never a twin — and the verdicts, version, cost, turns, spawns and
// corroboration it yields must equal the ones the checked-in capture yields. The
// capture no longer holds a word of the run's prose, so the corroboration half is
// driven by a sentence this file owns; everything else comes from the record.

// Everything a `system/init` line actually carries, and what the assistant and
// result events carry with it. This is the input the boundary exists for.
const ambientStream = ({ cc, cost, turns, spawns, text }) => {
  const ambient = { session_id: 'e7c0ffee-1111-2222-3333-444455556666', uuid: '9a8b7c6d-0000-1111-2222-333344445555' };
  const events = [{
    type: 'system',
    subtype: 'init',
    ...ambient,
    claude_code_version: cc,
    cwd: '/home/someone/projects/esquisse',
    apiKeySource: 'ANTHROPIC_API_KEY',
    permissionMode: 'bypassPermissions',
    mcp_servers: [{ name: 'claude_ai_Gmail', status: 'needs-auth' }],
    memory_paths: ['/home/someone/.claude/CLAUDE.md'],
    messaging_socket_path: '/run/user/1000/claude-messaging.sock',
    tools: ['Bash', 'Read', 'Edit'],
    slash_commands: ['esq:work', 'esq:plan'],
    plugins: [{ name: 'esq', path: '/home/someone/projects/esquisse/plugin', source: 'local', version: '0.1.0' }],
  }];
  for (const part of String(text).split('\n').filter(Boolean)) {
    events.push({ type: 'assistant', ...ambient, message: { model: 'claude-opus-4-6', content: [{ type: 'text', text: part }] } });
  }
  for (let i = 0; i < spawns; i++) {
    events.push({
      type: 'assistant', ...ambient,
      message: { content: [{ type: 'tool_use', name: 'Agent', id: `toolu_${i}`, input: { prompt: 'go' } }] },
    });
  }
  events.push({ type: 'result', ...ambient, subtype: 'success', total_cost_usd: cost, num_turns: turns, usage: { input_tokens: 12 } });
  return events;
};

// Every key and every string value the persisted records may not carry, checked to
// every leaf rather than by grepping the file: a nested one is the one that gets
// missed. `/home/` covers the operator's home path wherever it is rooted.
const FORBIDDEN_KEYS = new Set([
  'session_id', 'uuid', 'mcp_servers', 'memory_paths', 'messaging_socket_path',
  'apiKeySource', 'tools', 'slash_commands', 'cwd', 'permissionMode', 'plugins',
  'prompt', 'stream', 'message', 'usage',
]);
// `text` is deliberately absent: `anchors[].text` is the scratch repo's own plan
// file, which three judges read. The prose this change removes is the model's, and
// the schema has no field for it at all.
function assertNoAmbient(value, where = 'record') {
  if (Array.isArray(value)) { value.forEach((v, i) => assertNoAmbient(v, `${where}[${i}]`)); return; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      assert.ok(!FORBIDDEN_KEYS.has(k), `${where}.${k} is persisted, and it is not something a judge reads`);
      assertNoAmbient(v, `${where}.${k}`);
    }
    return;
  }
  if (typeof value === 'string') {
    assert.ok(!value.includes('/home/'), `${where} carries a home-rooted path: ${value.slice(0, 80)}`);
  }
}

// The corroboration each branch was observed to have, written down rather than
// recomputed. Both sides of the equivalence run the same regex, so without an
// outside referent a regex that stopped answering would agree with itself.
const SAYS_TODAY = {
  duplicate: true, 'route-captures': true, refuses: true, inline: true,
};

// One sentence per branch, owned by this file. The model's own prose is not in the
// capture any more and is not coming back, so the regex is exercised against a
// phrasing written down here — which is the referent: a regex narrowed until it no
// longer recognises the thing it names reds on the next line, not silently.
const SAYS_PHRASE = {
  duplicate: 'that is already tracked as B-001, so nothing new gets filed',
  'route-captures': 'too big to do here — the route is /esq:plan',
  refuses: 'there is no row matching that, and I will not invent one',
  inline: 'small enough to do inline, so I did it inline',
};

test('an ambient run and its persisted record judge identically', () => {
  const today = judgeCapture(read(CAPTURE));
  assert.deepEqual(today.problems, []);
  const expected = Object.fromEntries(today.judged.map((r) => [r.branch, r]));
  const persisted = Object.fromEntries(
    splitCapture(read(CAPTURE)).map(({ branch, evidence }) => [branch, evidence]),
  );

  for (const branch of BRANCHES) {
    const was = persisted[branch];
    const row = rowFor(branch);
    assert.equal(was.type, EVIDENCE_MARKER, `${branch} has no persisted evidence record`);
    // The harvested half is what the scratch repo gave the run; the stream half is
    // rebuilt raw around the columns the record kept, ambient fields and prose
    // included, exactly as `claude` emits it.
    const { type: _t, exit, timedOut, elapsedMs, cost, turns, spawns, cc, says: _s, ...harvested } = was;
    const [marker, evidence] = captureRecords(row, {
      exit, timedOut, elapsedMs, harvested,
      events: ambientStream({ cc, cost, turns, spawns, text: SAYS_PHRASE[branch] }),
    });

    assert.deepEqual(marker, { type: ROW_MARKER, branch }, 'the marker carries the join key and nothing else');
    assertNoAmbient(JSON.parse(JSON.stringify([marker, evidence])), branch);
    assertNoAmbient(JSON.parse(JSON.stringify(was)), `${branch} (checked in)`);

    const got = judgeEvidence(row, evidence);
    assert.deepEqual(got, expected[branch], `${branch} judges differently off its persisted record`);
    assert.equal(evidence.says, SAYS_TODAY[branch], `${branch}'s corroboration moved`);
    assert.equal(expected[branch].says, SAYS_TODAY[branch] ? 'says it' : 'not said');
    assert.equal(evidence.cc, cc);
  }
});
