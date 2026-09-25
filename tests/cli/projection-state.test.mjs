import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { state } from '../../plugin/lib/cli.mjs';

const ledger = `| ID | Summary | Status |
|---|---|---|
| B-129 | completion | Done |
| B-079 | handoff | Open |
| B-044 | transactions | Done |
| B-149 | old brief | Dropped |
`;
// Actual mixed-entry counterexample and stale epic row, kept without a freshness heuristic.
const roadmap = `# Roadmap
## Now
### dependable-queue
**covers:** B-129, B-079
**state:** <!-- GENERATED --> B-129 Done locally. B-079 remains Open. This combined entry remains in Now for B-079.
## Next
### cleanup
**covers:** B-149, B-999, epic:aug-18-improv
**state:** Both Open; no new schema.
## Later
### transactions
**covers:** B-044
## Shipped
### historical
**covers:** B-001
`;
const epic = `# Epic
## Backlog
- B-044 — Workflow transaction efficiency, measured — Open
- B-079 — scoped handoff — Open
## Log
- B-129 — a historical claim — Open
`;

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-projection-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'docs/epics'), { recursive: true });
  await Promise.all([
    writeFile(path.join(root, 'docs/BACKLOG.md'), ledger),
    writeFile(path.join(root, 'docs/ROADMAP.md'), roadmap),
    writeFile(path.join(root, 'docs/epics/aug-18-improv.md'), epic),
  ]);
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  return root;
}

test('state preserves projected order and mixed closed/open coverage without claiming staleness', async (t) => {
  const root = await fixture(t);
  const result = await state(root);
  assert.equal(result.roadmap.head.slug, 'dependable-queue');
  assert.equal(result.roadmap.head.state, roadmap.match(/GENERATED --> (.*)/)[1]);
  assert.equal(result.roadmap.freshness, 'unassessed');
  assert.deepEqual(result.roadmap.entries.map(({ horizon, slug }) => [horizon, slug]), [
    ['Now', 'dependable-queue'], ['Next', 'cleanup'], ['Later', 'transactions'],
  ]);
  assert.deepEqual(result.roadmap.entries[0].live, [{ id: 'B-129', status: 'Done' }, { id: 'B-079', status: 'Open' }]);
  assert.deepEqual(result.roadmap.entries[1].live, [
    { id: 'B-149', status: 'Dropped' }, { id: 'B-999', status: null, error: 'ID not found in docs/BACKLOG.md' },
  ]);
  assert.deepEqual(result.backlog.rows.map(({ id }) => id), ['B-079']);
  // The read cannot refresh either projection, nor mutate its authoritative ledger.
  for (const [file, expected] of [['BACKLOG.md', ledger], ['ROADMAP.md', roadmap], ['epics/aug-18-improv.md', epic]]) {
    assert.equal(await readFile(path.join(root, 'docs', file), 'utf8'), expected);
  }
});

test('epic compares only explicit projected status cells and excludes historical log claims', async (t) => {
  const root = await fixture(t);
  let result = (await state(root)).epics[0];
  assert.equal(result.stale, true);
  assert.deepEqual(result.rows.map(({ id, status, projectedStatus, mismatch }) => ({ id, status, projectedStatus, mismatch })), [
    { id: 'B-044', status: 'Done', projectedStatus: 'Open', mismatch: true },
    { id: 'B-079', status: 'Open', projectedStatus: 'Open', mismatch: false },
  ]);
  await writeFile(path.join(root, 'docs/epics/aug-18-improv.md'), epic.replace('measured — Open', 'measured — Done'));
  result = (await state(root)).epics[0];
  assert.equal(result.stale, false);
});

test('missing and malformed backlogs leave projections visible with unknown live statuses', async (t) => {
  const root = await fixture(t);
  for (const content of [null, '# no table', '| ID | Summary |\n|---|---|\n| B-129 | missing status |']) {
    const file = path.join(root, 'docs/BACKLOG.md');
    if (content === null) await rm(file); else await writeFile(file, content);
    const result = await state(root);
    assert.equal(result.roadmap.head.slug, 'dependable-queue');
    assert.ok(result.roadmap.entries[0].live.every((row) => row.status === null && row.error));
    assert.equal(result.epics[0].stale, null);
    assert.ok(result.epics[0].rows.every((row) => row.mismatch === null));
  }
});

test('duplicate IDs and invalid ledger or projected statuses cannot certify a comparison', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'docs/BACKLOG.md'), ledger + '| B-129 | duplicate | Open |\n| B-888 | invalid | Finished |\n');
  await writeFile(path.join(root, 'docs/epics/aug-18-improv.md'), '## Backlog\n- B-129 — duplicate — Done\n- B-888 — invalid — Done\n- B-079 — prose — Open perhaps\n');
  const result = await state(root);
  assert.match(result.roadmap.entries[0].live[0].error, /duplicate ID/);
  assert.equal(result.epics[0].stale, null);
  assert.ok(result.epics[0].rows.every((row) => row.mismatch === null));
  assert.match(result.epics[0].rows[1].error, /invalid backlog status/);
  assert.equal(result.epics[0].rows[2].projectedStatus, null);
});

test('absent or unreadable projections degrade locally without hiding healthy ledger facts', async (t) => {
  const root = await fixture(t);
  await rm(path.join(root, 'docs/ROADMAP.md'));
  await rm(path.join(root, 'docs/epics'), { recursive: true });
  let result = await state(root);
  assert.equal(result.roadmap, null);
  assert.deepEqual(result.epics, []);
  await mkdir(path.join(root, 'docs/ROADMAP.md'));
  await mkdir(path.join(root, 'docs/epics/broken.md'), { recursive: true });
  result = await state(root);
  assert.ok(result.roadmap.error);
  assert.ok(result.epics[0].error);
  assert.equal(result.epics[0].stale, null);
  assert.equal(result.backlog.counts.Done, 2);
});
