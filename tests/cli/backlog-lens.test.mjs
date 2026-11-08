import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { formatRow, tableAt } from '../../plugin/lib/markdown.mjs';
import { parseTiers } from '../../plugin/lib/cli.mjs';

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const header = ['ID', 'Date', 'Type', 'Pri', 'Rank', 'Summary', 'Source', 'Epic', 'Version', 'Status'];
const row = (id, type, pri, rank, status = 'Open') => [id, '2026-11-01', type, pri, rank, `row ${id}`, 'manual', '', '', status];

const roadmap = (tiers, entries = '') => `# Roadmap\n\n**Lens:** security first, then bugs, features last\n**Tiers:** ${tiers}\n\n## Now\n${entries}\n## Next\n\n## Later\n\n## Shipped\n`;

async function fixture(t, rows, roadmapText = null) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-lens-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const env = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', CLAUDE_CONFIG_DIR: path.join(root, 'config') };
  await run('git', ['init', '--quiet', root], { env });
  await mkdir(path.join(root, 'docs'));
  const file = path.join(root, 'docs/BACKLOG.md');
  await writeFile(file, '# Backlog\n\n' + [header, header.map(() => '---'), ...rows].map(formatRow).join('\n') + '\n');
  if (roadmapText !== null) await writeFile(path.join(root, 'docs/ROADMAP.md'), roadmapText);
  const exec = (...args) => run(process.execPath, [bin, ...args], { cwd: root, env, timeout: 5000 });
  const cli = async (...args) => JSON.parse((await exec(...args)).stdout);
  const refused = async (pattern, ...args) => {
    const before = await readFile(file, 'utf8');
    await assert.rejects(exec(...args), (error) => pattern.test(error.stderr));
    assert.equal(await readFile(file, 'utf8'), before);
  };
  const ledger = async () => {
    const table = tableAt((await readFile(file, 'utf8')).split('\n'));
    return Object.fromEntries(table.rows.map((cells) => [cells[0], Object.fromEntries(table.header.map((name, index) => [name, cells[index]]))]));
  };
  return { root, file, cli, refused, ledger };
}

test('tiers parse into type and concern words with levels that only fall', () => {
  assert.equal(parseTiers('# Roadmap\n\n## Now\n**Tiers:** bug:hi\n'), null, 'a tiers line under a horizon is prose, not the lens');
  assert.deepEqual(parseTiers('**Tiers:** security:hi · debt+security:med, bug · user:lo').map((tier) => [tier.term, tier.type, tier.concern, tier.level]), [
    ['security', null, 'security', 'hi'],
    ['debt+security', 'debt', 'security', 'med'],
    ['bug', 'bug', null, null],
    ['user', null, 'user', 'lo'],
  ]);
  assert.throws(() => parseTiers('**Tiers:** user:lo · security:hi'), /levels may only fall/);
  assert.throws(() => parseTiers('**Tiers:** perf:hi'), /names perf/);
  assert.throws(() => parseTiers('**Tiers:** security+legal'), /joins two concerns/);
  assert.throws(() => parseTiers('**Tiers:** app+infra'), /joins two layers/);
  assert.throws(() => parseTiers('**Tiers:** perf:hi'), /the layers app, infra/);
  assert.throws(() => parseTiers('**Tiers:** bug+user+app+x'), /is not <word>/);
  assert.deepEqual(parseTiers('**Tiers:** security+infra:hi · app:hi · bug+user+app:med').map((tier) => [tier.term, tier.type, tier.concern, tier.layer, tier.level]), [
    ['security+infra', null, 'security', 'infra', 'hi'],
    ['app', null, null, 'app', 'hi'],
    ['bug+user+app', 'bug', 'user', 'app', 'med'],
  ]);
  assert.throws(() => parseTiers('**Tiers:** bug · bug'), /listed twice/);
});

test('set-concern adds the column after Type, writes many rows at once, clears with none and refuses whole', async (t) => {
  const { cli, refused, ledger, file } = await fixture(t, [row('B-001', '🐛 bug', 'med?', '100'), row('B-002', '✨ improvement', 'lo?', '200')]);
  await refused(/invalid concern: perf/, 'backlog', 'set-concern', 'B-001', 'perf');
  await refused(/B-009 matches no row/, 'backlog', 'set-concern', 'B-001,B-009', 'security');
  const result = await cli('backlog', 'set-concern', 'B-001,B-002', 'security');
  assert.deepEqual([result.count, result.written, result.replaced], [2, 2, undefined]);
  assert.equal(tableAt((await readFile(file, 'utf8')).split('\n')).header.slice(2, 5).join(' '), 'Type Concern Pri');
  assert.deepEqual((await cli('backlog', 'set-concern', 'B-002', 'none')).replaced, { 'B-002': 'security' });
  const rows = await ledger();
  assert.deepEqual([rows['B-001'].Concern, rows['B-002'].Concern, rows['B-002'].Status], ['security', '', 'Open']);
  assert.deepEqual((await cli('state', '--rows')).backlog.rows.map((entry) => [entry.id, entry.type, entry.concern]), [['B-001', '🐛 bug', 'security'], ['B-002', '✨ improvement', '']]);
  assert.deepEqual((await cli('validate')).findings, []);
});

test('rank --lens keeps the head, appends the rest by tier and aligns only suggested levels', async (t) => {
  const tiers = 'security:hi · debt+security:med · bug:med · user:lo';
  const { cli, refused, ledger } = await fixture(t, [
    row('B-001', '✨ improvement', 'hi?', '100'), // user feature, guessed hi?
    row('B-002', '⚠️ debt', 'lo?', '200'), // security debt
    row('B-003', '🐛 bug', 'lo', '300'), // confirmed lo bug
    row('B-004', '☑️ todo', 'lo?', '400'), // security todo
    row('B-005', '🐛 bug', 'hi?', '500', 'Planned'),
    row('B-006', '💡 idea', '', '600'), // no concern, no tier
    row('B-007', '🐛 bug', 'med', '700', 'Done'),
  ], roadmap(tiers, '\n### pinned-feature\n**covers:** B-001\n**why now:** the owner pulled it in\n'));
  await refused(/B-007 is not open/, 'backlog', 'rank', '--order', 'B-007', '--lens');
  await cli('backlog', 'set-concern', 'B-002,B-004', 'security');
  await cli('backlog', 'set-concern', 'B-001', 'user');
  const result = await cli('backlog', 'rank', '--order', 'B-001', '--lens');
  assert.equal(result.mode, 'lens');
  assert.deepEqual(result.head, ['B-001']);
  // B-002 is security debt, but security alone is the earlier tier: the first match wins, then the
  // rows of a tier keep their current level and rank order.
  assert.deepEqual(result.appended, [{ tier: 'security', ids: ['B-002', 'B-004'] }, { tier: 'bug', ids: ['B-005', 'B-003'] }, { tier: '(no tier)', ids: ['B-006'] }]);
  assert.deepEqual(result.realigned, { 'lo?': ['B-001'], 'hi?': ['B-002', 'B-004'], 'med?': ['B-005'] });
  assert.deepEqual(result.confirmedApart, [{ id: 'B-003', pri: 'lo', tier: 'bug:med' }]);
  const rows = await ledger();
  assert.deepEqual(['B-001', 'B-002', 'B-004', 'B-005', 'B-003', 'B-006', 'B-007'].map((id) => [id, rows[id].Pri, rows[id].Rank]), [
    ['B-001', 'lo?', '100'], ['B-002', 'hi?', '200'], ['B-004', 'hi?', '300'], ['B-005', 'med?', '400'], ['B-003', 'lo', '500'], ['B-006', '', '600'], ['B-007', 'med', ''],
  ]);
  assert.deepEqual((await cli('validate')).findings, []);
});

test('rank --lens is refused without a tiers line, and plain --order still names every open row', async (t) => {
  const { refused } = await fixture(t, [row('B-001', '🐛 bug', 'med?', '100'), row('B-002', '🐛 bug', 'med?', '200')], '# Roadmap\n\n## Now\n');
  await refused(/no \*\*Tiers:\*\* line|there is none/, 'backlog', 'rank', '--order', '--lens');
  await refused(/must name every open row/, 'backlog', 'rank', '--order', 'B-001');
  await refused(/usage/, 'backlog', 'rank', 'B-001', '--last', '--lens');
});

test('capture under a lens takes its tier level unless a level is given; a broken lens never blocks it', async (t) => {
  const { cli, root, ledger } = await fixture(t, [row('B-001', '🐛 bug', 'med?', '100')], roadmap('security:hi · bug:med · user:lo'));
  const security = await cli('backlog', 'add', '--type', '✨ improvement', '--summary', 'rate-limit sign-in', '--source', 'manual', '--concern', 'security', '--layer', 'app');
  const stated = await cli('backlog', 'add', '--type', '✨ improvement', '--summary', 'copy a button', '--source', 'manual', '--concern', 'user', '--layer', 'app', '--pri', 'hi');
  const typed = await cli('backlog', 'add', '--type', '🐛 bug', '--summary', 'crash on save', '--source', 'build: x Phase 1', '--concern', 'internal', '--layer', 'app');
  let rows = await ledger();
  assert.deepEqual([security.id, stated.id, typed.id].map((id) => [rows[id].Pri, rows[id].Concern, rows[id].Layer]), [['hi?', 'security', 'app'], ['hi', 'user', 'app'], ['med?', 'internal', 'app']]);
  const lens = (await cli('state')).roadmap.lens;
  assert.deepEqual(lens, { text: 'security first, then bugs, features last', tiers: 'security:hi · bug:med · user:lo' });
  await writeFile(path.join(root, 'docs/ROADMAP.md'), roadmap('user:lo · security:hi'));
  const fallback = await cli('backlog', 'add', '--type', '💡 idea', '--summary', 'voice entry', '--source', 'manual', '--concern', 'user', '--layer', 'app');
  rows = await ledger();
  assert.equal(rows[fallback.id].Pri, 'lo?');
  assert.match((await cli('state')).roadmap.lens.error, /levels may only fall/);
  const validation = await run(process.execPath, [bin, 'validate'], { cwd: root, env: { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '' } }).catch((error) => error);
  assert.match(validation.stdout, /levels may only fall/);
});

test('validate names a concern off the vocabulary', async (t) => {
  const { root, file } = await fixture(t, [row('B-001', '🐛 bug', 'med?', '100')]);
  await writeFile(file, (await readFile(file, 'utf8')).replace('| Type |', '| Type | Concern |').replace('| --- | --- | --- |', '| --- | --- | --- | --- |').replace('| 🐛 bug |', '| 🐛 bug | perf |'));
  const validation = await run(process.execPath, [bin, 'validate'], { cwd: root, env: { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '' } }).catch((error) => error);
  assert.match(validation.stdout, /invalid backlog concern for B-001: perf/);
});

const classified = ['--concern', 'user', '--layer', 'app'];

test('add refuses an unclassified or mistyped row before reserving an ID, and lists the accepted words', async (t) => {
  const { cli, refused, ledger } = await fixture(t, [row('B-001', '🐛 bug', 'med?', '100')]);
  const base = ['backlog', 'add', '--summary', 'probe', '--source', 'manual'];
  await refused(/invalid type: ⚡ perf — one of bug, debt, idea, improvement, todo/, ...base, '--type', '⚡ perf', ...classified);
  await refused(/invalid type: ☑️ chore — one of bug, debt, idea, improvement, todo/, ...base, '--type', '☑️ chore', ...classified);
  await refused(/missing --concern .* one of user, security, legal, checks, deps, ops, internal/, ...base, '--type', 'bug', '--layer', 'app');
  await refused(/missing --concern/, ...base, '--type', 'bug', '--concern', 'none', '--layer', 'app');
  await refused(/invalid concern: perf/, ...base, '--type', 'bug', '--concern', 'perf', '--layer', 'app');
  await refused(/missing --layer .* one of app, infra/, ...base, '--type', 'bug', '--concern', 'user');
  await refused(/missing --layer/, ...base, '--type', 'bug', '--concern', 'user', '--layer', 'none');
  await refused(/invalid layer: cloud — one of app, infra/, ...base, '--type', 'bug', '--concern', 'user', '--layer', 'cloud');
  // No refusal above reserved an ID: the next accepted row takes the very next number.
  const bare = await cli(...base, '--type', 'bug', ...classified);
  const glyphed = await cli(...base, '--type', '✨ improvement', '--concern', 'security', '--layer', 'infra');
  assert.deepEqual([bare.id, glyphed.id], ['B-002', 'B-003']);
  const rows = await ledger();
  assert.deepEqual([rows['B-002'].Type, rows['B-002'].Concern, rows['B-002'].Layer], ['🐛 bug', 'user', 'app']);
  assert.deepEqual([rows['B-003'].Type, rows['B-003'].Concern, rows['B-003'].Layer], ['✨ improvement', 'security', 'infra']);
  assert.deepEqual(rows['B-001'].Concern + rows['B-001'].Layer, '', 'the legacy row is padded, never classified');
  assert.deepEqual((await cli('validate')).findings, []);
});

test('set-layer and set-type write whole batches, refuse whole, and Layer lands after Concern', async (t) => {
  const { cli, refused, ledger, file } = await fixture(t, [row('B-001', '⚡ perf', 'med?', '100'), row('B-002', 'bug', 'lo?', '200'), row('B-003', '☑️ chore', 'lo?', '300')]);
  await refused(/invalid layer: cloud/, 'backlog', 'set-layer', 'B-001', 'cloud');
  await refused(/B-009 matches no row/, 'backlog', 'set-layer', 'B-001,B-009', 'infra');
  await refused(/invalid type: chore/, 'backlog', 'set-type', 'B-003', 'chore');
  await refused(/B-009 matches no row/, 'backlog', 'set-type', 'B-001,B-009', 'bug');
  await refused(/usage: esq backlog set-type/, 'backlog', 'set-type', 'B-001');
  const layered = await cli('backlog', 'set-layer', 'B-001,B-002', 'infra');
  assert.deepEqual([layered.layer, layered.count, layered.written], ['infra', 2, 2]);
  await cli('backlog', 'set-concern', 'B-001', 'ops');
  assert.equal(tableAt((await readFile(file, 'utf8')).split('\n')).header.slice(2, 6).join(' '), 'Type Concern Layer Pri');
  const typed = await cli('backlog', 'set-type', 'B-001,B-003', 'improvement');
  assert.deepEqual([typed.type, typed.written, typed.replaced], ['✨ improvement', 2, { 'B-001': '⚡ perf', 'B-003': '☑️ chore' }]);
  await cli('backlog', 'set-type', 'B-002', '🐛 bug');
  assert.deepEqual((await cli('backlog', 'set-layer', 'B-002', 'none')).replaced, { 'B-002': 'infra' });
  const rows = await ledger();
  assert.deepEqual(['B-001', 'B-002', 'B-003'].map((id) => [rows[id].Type, rows[id].Concern, rows[id].Layer]), [['✨ improvement', 'ops', 'infra'], ['🐛 bug', '', ''], ['✨ improvement', '', '']]);
  assert.deepEqual((await cli('state', '--rows')).backlog.rows.map((entry) => [entry.id, entry.layer]), [['B-001', 'infra'], ['B-002', ''], ['B-003', '']]);
  const validation = await cli('validate');
  assert.deepEqual(validation.findings, []);
  assert.equal(validation.advisories.filter((line) => /non-canonical backlog type/.test(line)).length, 0);
});

test('a ledger without Concern or Layer reads blank, and validate only advises on a drifted type', async (t) => {
  const { cli, root, file } = await fixture(t, [row('B-001', '⚡ perf', 'med?', '100'), row('B-002', '🐛 bug', 'lo?', '200')]);
  assert.deepEqual((await cli('state', '--rows')).backlog.rows.map((entry) => [entry.id, entry.concern, entry.layer]), [['B-001', '', ''], ['B-002', '', '']]);
  const clean = await cli('validate');
  assert.deepEqual(clean.findings, []);
  assert.deepEqual(clean.advisories.filter((line) => /backlog type/.test(line)), ['non-canonical backlog type for B-001: ⚡ perf — one of 🐛 bug, ⚠️ debt, 💡 idea, ✨ improvement, ☑️ todo']);
  await writeFile(file, (await readFile(file, 'utf8')).replace('| Type |', '| Type | Layer |').replace('| --- | --- | --- |', '| --- | --- | --- | --- |').replace('| 🐛 bug |', '| 🐛 bug | cloud |').replace('| ⚡ perf |', '| ⚡ perf | app |'));
  const validation = await run(process.execPath, [bin, 'validate'], { cwd: root, env: { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '' } }).catch((error) => error);
  assert.match(validation.stdout, /invalid backlog layer for B-002: cloud/);
});

test('a layer tier sorts its rows under rank --lens and places a capture', async (t) => {
  const { cli, ledger } = await fixture(t, [
    row('B-001', '🐛 bug', 'lo?', '100'),
    row('B-002', '✨ improvement', 'lo?', '200'),
    row('B-003', '⚠️ debt', 'lo?', '300'),
  ], roadmap('security+infra:hi · app:med'));
  await cli('backlog', 'set-concern', 'B-001,B-003', 'security');
  await cli('backlog', 'set-layer', 'B-001', 'app');
  await cli('backlog', 'set-layer', 'B-003', 'infra');
  await cli('backlog', 'set-layer', 'B-002', 'app');
  const result = await cli('backlog', 'rank', '--order', '--lens');
  assert.deepEqual(result.appended, [{ tier: 'security+infra', ids: ['B-003'] }, { tier: 'app', ids: ['B-001', 'B-002'] }]);
  const captured = await cli('backlog', 'add', '--type', 'debt', '--summary', 'rotate the deploy key', '--source', 'manual', '--concern', 'security', '--layer', 'infra');
  const rows = await ledger();
  assert.deepEqual([rows['B-003'].Pri, rows['B-001'].Pri, rows[captured.id].Pri], ['hi?', 'med?', 'hi?']);
});
