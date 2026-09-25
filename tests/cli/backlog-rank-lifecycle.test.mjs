import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { formatRow, tableAt } from '../../plugin/lib/markdown.mjs';

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const header = ['ID', 'Date', 'Type', 'Pri', 'Rank', 'Summary', 'Source', 'Epic', 'Version', 'Status'];
const row = (id, rank, status = 'Open', pri = 'lo?') =>
  [id, '2026-09-24', '✨ improvement', pri, rank, 'task', 'manual', '', '', status];

async function fixture(t, rows = [], legacy = false) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-rank-lifecycle-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const env = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', CLAUDE_CONFIG_DIR: path.join(root, 'config') };
  await run('git', ['init', '--quiet', root], { env });
  await mkdir(path.join(root, 'docs'));
  const file = path.join(root, 'docs/BACKLOG.md');
  const columns = (cells) => legacy ? cells.filter((_, index) => index !== 4) : cells;
  await writeFile(file, '# Backlog\n\n' + [header, header.map(() => '---'), ...rows].map((cells) => formatRow(columns(cells))).join('\n') + '\n');
  const cli = async (...args) => JSON.parse((await run(process.execPath, [bin, ...args], { cwd: root, env, timeout: 5000 })).stdout);
  const ledger = async () => {
    const table = tableAt((await readFile(file, 'utf8')).split('\n'));
    return table.rows.map((cells) => Object.fromEntries(table.header.map((name, index) => [name, cells[index]])));
  };
  const valid = async () => {
    const ranks = (await ledger()).map((entry) => entry.Rank).filter(Boolean);
    assert.equal(new Set(ranks.map(Number)).size, ranks.length);
    assert.deepEqual((await cli('validate')).findings, []);
  };
  const add = (...args) => cli('backlog', 'add', '--type', '✨ improvement', '--summary', 'captured', '--source', 'observed: example', ...args);
  return { root, file, cli, ledger, valid, add };
}

for (const closed of ['Done', 'Dropped']) {
  test(`B-172: closing an existing row as ${closed} releases its rank`, async (t) => {
    const { cli, ledger, valid } = await fixture(t, [row('B-001', '100'), row('B-002', '200')]);
    await cli('backlog', 'set-status', 'B-001', closed);
    assert.equal((await ledger())[0].Rank, '');
    await valid();
    await cli('backlog', 'rank', '--order', 'B-002');
    await valid();
  });

  test(`B-172: add → state → ${closed} → rerank → reopen preserves order and provenance`, async (t) => {
    const { file, cli, ledger, valid, add } = await fixture(t, [row('B-001', '400', 'Open', 'hi'), row('B-002', '200', 'Planned', 'med?')]);
    const { id } = await add();
    assert.equal((await cli('state')).backlog.rows.find((entry) => entry.id === id).rank, '500');
    await valid();
    for (const status of ['Needs-decision', 'Planned', 'Open']) {
      await cli('backlog', 'set-status', id, status);
      assert.equal((await ledger()).find((entry) => entry.ID === id).Rank, '500');
      await valid();
    }
    const marker = closed === 'Done' ? ['--by', 'rank-lifecycle'] : ['--reason', 'no longer needed'];
    await cli('backlog', 'set-status', id, closed, ...marker, '--resolution', 'Historical evidence retained.');
    const source = (await ledger()).find((entry) => entry.ID === id).Source;
    assert.match(source, /^observed: example · (Done by rank-lifecycle|Dropped: no longer needed)$/);
    assert.equal((await ledger()).find((entry) => entry.ID === id).Rank, '');
    await valid();
    await cli('backlog', 'rank', '--order', 'B-002', 'B-001');
    await valid();
    await cli('backlog', 'set-status', id, 'Open');
    const reopened = (await cli('state')).backlog.rows;
    assert.deepEqual(reopened.map((entry) => [entry.id, entry.rank, entry.pri]), [['B-001', '200', 'hi'], ['B-002', '100', 'med?'], [id, '300', 'lo?']]);
    assert.equal(reopened.find((entry) => entry.id === id).source, source);
    assert.match(await readFile(file, 'utf8'), /Historical evidence retained\./);
    await valid();
  });
}

for (const mode of ['order', 'place', 'renumber', 'add', 'reopen']) {
  test(`B-172: ${mode} clears closed ranks already on disk`, async (t) => {
    const { cli, ledger, valid, add } = await fixture(t, [row('B-001', mode === 'renumber' ? '1' : '200'), row('B-002', '300'), row('B-003', '100', 'Done'), row('B-004', '250', 'Dropped')]);
    if (mode === 'order') await cli('backlog', 'rank', '--order', 'B-001', 'B-002');
    if (mode === 'place') await cli('backlog', 'rank', 'B-002', '--before', 'B-001');
    if (mode === 'renumber') assert.equal((await cli('backlog', 'rank', 'B-002', '--before', 'B-001')).renumbered, true);
    if (mode === 'add') await add();
    if (mode === 'reopen') await cli('backlog', 'set-status', 'B-003', 'Needs-decision');
    const rows = await ledger();
    assert.ok(rows.filter((entry) => ['Done', 'Dropped'].includes(entry.Status)).every((entry) => entry.Rank === ''));
    if (mode === 'reopen') assert.equal(rows.find((entry) => entry.ID === 'B-003').Rank, '400');
    await valid();
  });
}

for (const legacy of [false, true]) {
  test(`B-172: reopen is the first write in an all-closed ${legacy ? 'nine' : 'ten'} column ledger`, async (t) => {
    const { cli, ledger, valid, add } = await fixture(t, [row('B-001', '700', 'Dropped'), row('B-002', '100', 'Done')], legacy);
    await cli('backlog', 'set-status', 'B-001', 'Planned');
    assert.deepEqual((await ledger()).map((entry) => entry.Rank), ['100', '']);
    await valid();
    const { id } = await add('--status', 'Done');
    assert.equal((await ledger()).find((entry) => entry.ID === id).Rank, '');
    await valid();
  });

  for (const initial of ['empty', 'closed', 'unranked']) {
    test(`B-172: capture and reopen in ${legacy ? 'nine' : 'ten'} columns, ${initial} ledger`, async (t) => {
      const seed = initial === 'empty' ? [] : [row('B-001', initial === 'closed' ? '800' : '', initial === 'closed' ? 'Done' : 'Open')];
      const { cli, ledger, valid, add } = await fixture(t, seed, legacy);
      const { id } = await add('--status', 'Needs-decision', '--pri', 'med');
      assert.equal((await cli('state')).backlog.rows.find((entry) => entry.id === id).rank, '100');
      if (initial === 'unranked') assert.equal((await ledger())[0].Rank, '');
      await valid();
      await cli('backlog', 'set-status', id, 'Dropped');
      await valid();
      await cli('backlog', 'set-status', id, 'Planned');
      assert.equal((await ledger()).find((entry) => entry.ID === id).Rank, '100');
      await valid();
    });
  }
}

test('B-172: refused input and roadmap placement leave cleanup and migration atomic', async (t) => {
  const { root, file, cli, add } = await fixture(t, [row('B-001', '100'), row('B-002', '200'), row('B-003', '300', 'Done')]);
  await writeFile(path.join(root, 'docs/ROADMAP.md'), '# Roadmap\n\n## Now\n\n### first\n**covers:** B-001\n\n### second\n**covers:** B-002\n**needs:** first\n');
  const before = await readFile(file, 'utf8');
  for (const args of [
    ['backlog', 'rank', '--order', 'B-002', 'B-001'],
    ['backlog', 'rank', 'B-002', '--before', 'B-001'],
    ['backlog', 'rank', '--order', 'B-001'],
    ['backlog', 'set-status', 'B-003', 'Open', '--by', 'invalid'],
    ['backlog', 'set-status', 'B-001', 'Done', '--resolution', 'bad|cell'],
  ]) {
    await assert.rejects(cli(...args), (error) => error.code === 2);
    assert.equal(await readFile(file, 'utf8'), before);
  }
  await assert.rejects(add('--summary', 'bad\ncell'), (error) => error.code === 2);
  assert.equal(await readFile(file, 'utf8'), before);
  const broken = before.replace('| --- |', '| broken |');
  await writeFile(file, broken);
  await assert.rejects(add(), (error) => error.code === 2);
  await assert.rejects(cli('backlog', 'set-status', 'B-003', 'Open'), (error) => error.code === 2);
  assert.equal(await readFile(file, 'utf8'), broken);
});

test('B-172: a malformed rank on another row never blocks capture or reopening; validate names it', async (t) => {
  const { cli, ledger, add } = await fixture(t, [row('B-001', 'invalid'), row('B-003', '300'), row('B-002', '100', 'Done')]);
  const { id } = await add();
  assert.equal((await ledger()).find((entry) => entry.ID === id).Rank, '400');
  await cli('backlog', 'set-status', 'B-002', 'Open');
  assert.equal((await ledger()).find((entry) => entry.ID === 'B-002').Rank, '500');
  await assert.rejects(cli('validate'), (error) => error.code === 1 && /invalid backlog rank for B-001: invalid/.test(error.stdout));
});

test('B-172: an exhausted active tail refuses capture/reopening without writing', async (t) => {
  const { file, cli, add } = await fixture(t, [row('B-001', String(Number.MAX_SAFE_INTEGER)), row('B-002', '100', 'Done')]);
  const before = await readFile(file, 'utf8');
  await assert.rejects(add(), (error) => error.code === 2 && /rank/.test(error.stderr));
  await assert.rejects(cli('backlog', 'set-status', 'B-002', 'Open'), (error) => error.code === 2 && /rank/.test(error.stderr));
  assert.equal(await readFile(file, 'utf8'), before);
});
