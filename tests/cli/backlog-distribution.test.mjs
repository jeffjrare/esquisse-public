import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { formatRow } from '../../plugin/lib/markdown.mjs';

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const header = ['ID', 'Date', 'Type', 'Concern', 'Layer', 'Pri', 'Rank', 'Summary', 'Source', 'Epic', 'Version', 'Status'];
// row(id, concern, layer, pri, rank, status, type)
const row = (id, concern, layer = 'app', pri = 'med', rank = '', status = 'Open', type = '✨ improvement') =>
  [id, '2026-11-01', type, concern, layer, pri, rank, `row ${id}`, 'manual', '', '', status];

async function fixture(t, rows, { columns = header, roadmap = null } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-distribution-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const env = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', CLAUDE_CONFIG_DIR: path.join(root, 'config') };
  await run('git', ['init', '--quiet', root], { env });
  await mkdir(path.join(root, 'docs'));
  const file = path.join(root, 'docs/BACKLOG.md');
  await writeFile(file, '# Backlog\n\n' + [columns, columns.map(() => '---'), ...rows].map(formatRow).join('\n') + '\n');
  if (roadmap !== null) await writeFile(path.join(root, 'docs/ROADMAP.md'), roadmap);
  const exec = (...args) => run(process.execPath, [bin, ...args], { cwd: root, env, timeout: 5000 });
  const cli = async (...args) => JSON.parse((await exec(...args)).stdout);
  // Every distribution call is read-only: the ledger is byte-identical afterwards.
  const distribution = async () => {
    const before = await readFile(file, 'utf8');
    const answer = await cli('backlog', 'distribution');
    assert.equal(await readFile(file, 'utf8'), before, 'distribution never writes the ledger');
    return answer;
  };
  return { root, file, cli, distribution };
}

const sum = (values) => values.reduce((a, n) => a + n, 0);

test('both axes add up to the open total, closed rows left out, in vocabulary order', async (t) => {
  const { distribution } = await fixture(t, [
    row('B-001', 'security', 'infra', 'hi', '', 'Open', '🐛 bug'),
    row('B-002', 'user', 'app', 'med', '', 'Needs-decision'),
    row('B-003', 'user', 'infra', 'lo', '', 'Planned', '☑️ todo'),
    row('B-004', 'checks', 'app', 'lo', '', 'Done'),
    row('B-005', 'user', 'app', 'lo', '', 'Dropped'),
    row('B-006', '', '', '', '', 'Open', '⚡ perf'),
  ]);
  const answer = await distribution();
  assert.deepEqual(answer.statuses, ['Open', 'Needs-decision', 'Planned']);
  assert.equal(answer.total, 4);
  assert.deepEqual(answer.domain, [
    { concern: 'user', layer: 'app', count: 1 },
    { concern: 'user', layer: 'infra', count: 1 },
    { concern: 'security', layer: 'infra', count: 1 },
    { concern: '(none)', layer: '(none)', count: 1 },
  ]);
  assert.equal(sum(answer.domain.map((cell) => cell.count)), answer.total);
  assert.deepEqual(answer.type, { bug: 1, debt: 0, idea: 0, improvement: 1, todo: 1, '(none)': 1 });
  assert.equal(sum(Object.values(answer.type)), answer.total);
  assert.deepEqual(answer.unclassified, { concern: 1, layer: 1, type: 1 });
  assert.deepEqual(answer.table, [
    '| concern | app | infra | — | total |',
    '| --- | ---: | ---: | ---: | ---: |',
    '| user | 1 | 1 | 0 | 2 |',
    '| security | 0 | 1 | 0 | 1 |',
    '| — | 0 | 0 | 1 | 1 |',
    '| **total** | 1 | 2 | 1 | **4** |',
    'type: 🐛 1 · ✨ 1 · ☑️ 1 · — 1',
  ]);
});

test('a ledger without Concern or Layer columns counts every row as (none)', async (t) => {
  const columns = ['ID', 'Date', 'Type', 'Pri', 'Summary', 'Source', 'Epic', 'Version', 'Status'];
  const { distribution } = await fixture(t, [
    ['B-001', '2026-11-01', '🐛 bug', 'hi', 'one', 'manual', '', '', 'Open'],
    ['B-002', '2026-11-01', 'bug', 'med', 'two', 'manual', '', '', 'Open'],
  ], { columns });
  const answer = await distribution();
  assert.equal(answer.total, 2);
  assert.deepEqual(answer.domain, [{ concern: '(none)', layer: '(none)', count: 2 }]);
  assert.deepEqual(answer.unclassified, { concern: 2, layer: 2, type: 0 });
  assert.equal(answer.type.bug, 2);
  assert.deepEqual(answer.head, { window: 5, size: 2, user: 0, nonUser: 0, unknown: 2, imbalanced: false, candidates: [] });
});

test('an empty backlog and one shorter than the window', async (t) => {
  const empty = await fixture(t, []);
  const none = await empty.distribution();
  assert.equal(none.total, 0);
  assert.deepEqual(none.domain, []);
  assert.deepEqual(none.head, { window: 5, size: 0, user: 0, nonUser: 0, unknown: 0, imbalanced: false, candidates: [] });
  assert.deepEqual(none.table.slice(-2), ['| **total** | 0 | 0 | 0 | **0** |', 'type: none']);

  const short = await fixture(t, [row('B-001', 'checks'), row('B-002', 'checks'), row('B-003', 'user', 'app', 'lo')]);
  const head = (await short.distribution()).head;
  assert.equal(head.size, 3);
  assert.equal(head.nonUser, 2);
  assert.equal(head.imbalanced, false, 'every row is in the head, so no user row waits outside it');
});

test('blank concerns at the head are unknown, never non-user', async (t) => {
  const { distribution } = await fixture(t, [
    row('B-001', '', ''), row('B-002', '', ''), row('B-003', '', ''), row('B-004', 'checks'), row('B-005', 'user'),
    row('B-006', 'user', 'app', 'lo'),
  ]);
  const head = (await distribution()).head;
  assert.deepEqual([head.user, head.nonUser, head.unknown], [1, 1, 3]);
  assert.equal(head.imbalanced, false);
});

test('the head follows level, then rank, then numeric ID', async (t) => {
  // Seven rows at the boundary of the window. Every `hi` row sorts above the `hi?` one whatever its rank;
  // ranked rows lead unranked ones, the tie at rank 100 falls to the lower ID, and among the unranked
  // rows B-999 precedes B-1000 numerically — so B-1000, the only `hi` user row, is left out.
  const { distribution } = await fixture(t, [
    row('B-1000', 'user', 'app', 'hi', ''),
    row('B-999', 'checks', 'app', 'hi', ''),
    row('B-005', 'checks', 'app', 'hi', '150'),
    row('B-004', 'checks', 'app', 'hi', '100'),
    row('B-003', 'checks', 'app', 'hi', '100'),
    row('B-002', 'checks', 'app', 'hi', '50'),
    row('B-001', 'user', 'app', 'hi?', '1'),
  ]);
  const head = (await distribution()).head;
  assert.deepEqual([head.size, head.user, head.nonUser], [5, 0, 5]);
  assert.equal(head.imbalanced, true);
  assert.deepEqual(head.candidates, [
    { id: 'B-1000', pri: 'hi', raiseTo: null },
    { id: 'B-001', pri: 'hi?', raiseTo: 'hi' },
  ], 'candidates follow the same order, and a hi? under a hi head is proposed hi');
});

test('the threshold: three non-user rows of five flag, two do not', async (t) => {
  const tail = [row('B-010', 'user', 'app', 'lo')];
  const over = await fixture(t, [row('B-001', 'checks'), row('B-002', 'ops'), row('B-003', 'internal'), row('B-004', 'user'), row('B-005', 'user'), ...tail]);
  const flagged = (await over.distribution()).head;
  assert.deepEqual([flagged.user, flagged.nonUser, flagged.imbalanced], [2, 3, true]);
  assert.deepEqual(flagged.candidates, [{ id: 'B-010', pri: 'lo', raiseTo: 'med' }]);

  const under = await fixture(t, [row('B-001', 'checks'), row('B-002', 'ops'), row('B-003', 'user'), row('B-004', 'user'), row('B-005', 'user'), ...tail]);
  const fine = (await under.distribution()).head;
  assert.deepEqual([fine.nonUser, fine.imbalanced, fine.candidates], [2, false, []]);
});

test('no flag when no user row exists outside the head', async (t) => {
  const { distribution } = await fixture(t, [
    row('B-001', 'checks'), row('B-002', 'checks'), row('B-003', 'checks'), row('B-004', 'user'), row('B-005', 'user'),
    row('B-006', 'internal', 'app', 'lo'),
  ]);
  const head = (await distribution()).head;
  assert.equal(head.nonUser, 3);
  assert.equal(head.imbalanced, false);
  assert.deepEqual(head.candidates, []);
});

test('a candidate in Needs-decision or behind an open needs-edge is left out', async (t) => {
  const roadmap = '# Roadmap\n\n## Now\n\n### blocker\n**covers:** B-001\n**why now:** first\n\n'
    + '### waits\n**covers:** B-007\n**why now:** after\n**needs:** blocker\n\n## Next\n\n## Later\n\n## Shipped\n';
  const rows = [
    row('B-001', 'checks'), row('B-002', 'checks'), row('B-003', 'checks'), row('B-004', 'checks'), row('B-005', 'checks'),
    row('B-006', 'user', 'app', 'lo', '', 'Needs-decision'),
    row('B-007', 'user', 'app', 'lo'),
    row('B-008', 'user', 'app', 'lo?'),
  ];
  const { distribution } = await fixture(t, rows, { roadmap });
  const head = (await distribution()).head;
  assert.equal(head.imbalanced, true);
  assert.deepEqual(head.candidates.map((candidate) => candidate.id), ['B-008'], 'B-006 waits on a decision, B-007 on an open B-001');

  const freed = await fixture(t, [...rows.slice(0, 7).map((cells) => (cells[0] === 'B-001' ? row('B-001', 'checks', 'app', 'med', '', 'Done') : cells)), row('B-008', 'user', 'app', 'lo?')], { roadmap });
  assert.deepEqual((await freed.distribution()).head.candidates.map((candidate) => candidate.id), ['B-007', 'B-008'], 'a closed blocker frees the edge');
});

test('a lo? candidate under a hi head is proposed raiseTo hi, and applying the proposal clears the flag', async (t) => {
  const { cli, distribution } = await fixture(t, [
    row('B-001', 'security', 'infra', 'hi', '100'),
    row('B-002', 'checks', 'app', 'hi', '200'),
    row('B-003', 'ops', 'infra', 'hi', '300'),
    row('B-004', 'internal', 'app', 'hi', '400'),
    row('B-005', 'user', 'app', 'hi', '500'),
    row('B-006', 'user', 'app', 'lo?', '600'),
    row('B-007', 'user', 'app', 'med', '700'),
    row('B-008', 'deps', 'app', 'lo', '800'),
    row('B-009', 'user', 'infra', 'lo?', '900'),
  ]);
  const before = (await distribution()).head;
  assert.deepEqual([before.user, before.nonUser, before.imbalanced], [1, 4, true]);
  assert.deepEqual(before.candidates, [
    { id: 'B-007', pri: 'med', raiseTo: 'hi' },
    { id: 'B-006', pri: 'lo?', raiseTo: 'hi' },
    { id: 'B-009', pri: 'lo?', raiseTo: 'hi' },
  ], 'three placed ahead leave two of the four non-user rows in the head');

  const first = 'B-001';
  for (const candidate of before.candidates) {
    if (candidate.raiseTo) await cli('backlog', 'set-pri', candidate.id, candidate.raiseTo);
    await cli('backlog', 'rank', candidate.id, '--before', first);
  }
  const after = (await distribution()).head;
  assert.equal(after.imbalanced, false);
  assert.ok(after.nonUser <= after.size * 0.5, `the share is restored: ${after.nonUser}/${after.size} non-user`);
});

test('the command takes at most a backlog path', async (t) => {
  const { root } = await fixture(t, []);
  const env = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', CLAUDE_CONFIG_DIR: path.join(root, 'config') };
  await assert.rejects(run(process.execPath, [bin, 'backlog', 'distribution', '--json'], { cwd: root, env }), (error) => /usage: esq backlog distribution/.test(error.stderr));
});
