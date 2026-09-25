import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { addRow, branchCheck, idBlock, mergeBegin, mergeScan, mergeSeal, reserveBlock, reserveId, setStatus, state, validate } from '../../plugin/lib/cli.mjs';

// What lets esq run without babysitting, proved on real git in throwaway repositories: a linked
// worktree reserves its own ID block under one lock, a backlog disposition carries its provenance in
// the same write, an observation outside the unit never blocks it, and a unit planned on another
// branch stays visible from the branch that planned it. No network, no model run, and neither the
// contributor's git config nor the CLI's test seam can change an answer.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const HEADER = '| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n';

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', message);
}

async function write(root, file, text) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), text);
}

async function repo(rows = '') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-autonomy-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await write(root, 'docs/BACKLOG.md', `# Backlog\n\n${HEADER}${rows}`);
  commit(root, 'seed');
  return root;
}

function worktree(root, name) {
  const target = path.join(path.dirname(root), `${path.basename(root)}-${name}`);
  git(root, 'worktree', 'add', '-q', '-b', name, target);
  return target;
}

// ── ID blocks ────────────────────────────────────────────────────────────────

test('the main checkout keeps 1-999 and writes nothing; a linked worktree with no marker reserves its own block', async () => {
  const root = await repo('| B-004 | 2026-09-11 | 🐛 bug | | x | manual | | | Open |\n');
  assert.deepEqual(await idBlock(root), { low: 1, high: 999, source: 'main' });
  const main = await reserveBlock(root);
  assert.equal(main.source, 'main');
  assert.equal(main.reserved, false);
  await assert.rejects(readFile(path.join(root, '.esq-id-block'), 'utf8'), /ENOENT/);
  assert.equal((await reserveId(root, path.join(root, 'docs/BACKLOG.md'))).id, 'B-005');

  const linked = worktree(root, 'feat');
  assert.equal((await idBlock(linked)).source, 'missing');
  // The fallback that minted from main's block is gone: the first ID a linked worktree allocates comes
  // from a block it reserved, and the reservation is recorded and kept out of git.
  const first = await reserveId(linked, path.join(linked, 'docs/BACKLOG.md'));
  assert.equal(first.id, 'B-1000');
  assert.equal(first.reservedBlock, true);
  assert.equal(await readFile(path.join(linked, '.esq-id-block'), 'utf8'), 'id-block: 1000-1999\n');
  assert.match(await readFile(path.join(root, '.git/info/exclude'), 'utf8'), /^\.esq-id-block$/m);
  assert.equal(git(linked, 'status', '--porcelain'), '');
  // Asked again, it reads the marker and reserves nothing new.
  const again = await reserveBlock(linked);
  assert.deepEqual([again.low, again.source, again.reserved], [1000, 'marker', false]);
});

test('a block already witnessed by an ID in main, or held by a live worktree, is never handed out again', async () => {
  const root = await repo('| B-1003 | 2026-09-11 | 🐛 bug | | merged from an old worktree | manual | | | Open |\n');
  const one = worktree(root, 'one');
  await writeFile(path.join(one, '.esq-id-block'), 'id-block: 2000-2999\n');
  const two = worktree(root, 'two');
  const reserved = await reserveBlock(two);
  assert.deepEqual([reserved.low, reserved.high], [3000, 3999]);
});

test('concurrent reservations in sibling worktrees produce distinct blocks', async () => {
  const root = await repo();
  const trees = ['a', 'b', 'c', 'd', 'e', 'f'].map((name) => worktree(root, name));
  // Separate processes, launched together, so the lock is contended for real.
  const results = await Promise.all(trees.map((tree) => run(process.execPath, [bin, 'backlog', 'reserve-block'], { cwd: tree })));
  const lows = results.map((result) => JSON.parse(result.stdout).low);
  assert.equal(new Set(lows).size, trees.length, `blocks collided: ${lows.join(', ')}`);
  assert.deepEqual([...lows].sort((x, y) => x - y), [1000, 2000, 3000, 4000, 5000, 6000]);
  for (const tree of trees) assert.match(await readFile(path.join(tree, '.esq-id-block'), 'utf8'), /^id-block: \d+-\d+\n$/);
  await assert.rejects(readFile(path.join(root, '.git/esq-id-block.lock'), 'utf8'), /ENOENT/);
});

test('B-003: removing a worktree preserves its committed IDs through allocation and both merges', async (t) => {
  const root = await repo();
  const script = fileURLToPath(new URL('../../scripts/worktree.sh', import.meta.url));
  const trees = `${root}.worktrees`;
  t.after(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(trees, { recursive: true, force: true });
  });
  const manage = (...args) => run('/bin/bash', [script, ...args], { cwd: root });
  await manage('new', 'retained');
  const retained = path.join(trees, 'retained');
  const first = await addRow(retained, path.join(retained, 'docs/BACKLOG.md'), { type: 'bug', summary: 'retained work', source: 'manual' });
  assert.equal(first.id, 'B-1000');
  commit(retained, 'retained item');
  const retainedHead = git(retained, 'rev-parse', 'HEAD');
  await manage('rm', 'retained');
  assert.equal(existsSync(retained), false);
  assert.equal(git(root, 'rev-parse', 'refs/heads/retained'), retainedHead);
  assert.throws(() => git(root, 'merge-base', '--is-ancestor', 'retained', 'main'));

  await manage('new', 'next');
  const next = path.join(trees, 'next');
  const second = await addRow(next, path.join(next, 'docs/BACKLOG.md'), { type: 'bug', summary: 'different work', source: 'manual' });
  assert.equal(second.id, 'B-2000');
  commit(next, 'next item');
  // Reopening the retained branch must also leave its old citations alone.
  await manage('new', 'retained');
  assert.equal((await reserveId(retained, path.join(retained, 'docs/BACKLOG.md'))).id, 'B-3000');
  assert.equal(git(retained, 'rev-parse', 'HEAD'), retainedHead);

  for (const branch of ['next', 'retained']) {
    assert.equal(mergeBegin(root, branch).refuse, false);
    assert.deepEqual((await mergeScan(root)).duplicates, []);
    const sealed = await mergeSeal(root);
    assert.equal(sealed.verdict, 'sealed', JSON.stringify(sealed));
  }
  const ledger = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
  for (const id of [first.id, second.id]) assert.equal(ledger.split('\n').filter((line) => line.startsWith(`| ${id} |`)).length, 1);
  assert.match(ledger, /retained work/);
  assert.match(ledger, /different work/);
  // B-184: both captures began at Rank 100; the second seal repairs that mechanical collision.
  assert.deepEqual((await state(root)).backlog.rows.map(({ id, rank, pri }) => [id, rank, pri]),
    [['B-2000', '100', 'med?'], ['B-1000', '200', 'med?']]);
  assert.equal((await validate(root)).valid, true);
});

test('a removed reservation with no committed ID is reusable, and a branch without a backlog is harmless', async (t) => {
  const root = await repo();
  const unused = worktree(root, 'unused');
  const next = path.join(path.dirname(root), `${path.basename(root)}-next`);
  t.after(async () => {
    for (const directory of [root, unused, next]) await rm(directory, { recursive: true, force: true });
  });
  assert.equal((await reserveBlock(unused)).low, 1000);
  git(unused, 'rm', 'docs/BACKLOG.md');
  commit(unused, 'branch without backlog');
  git(root, 'worktree', 'remove', unused);
  worktree(root, 'next');
  assert.equal((await reserveBlock(next)).low, 1000);
});

test('an unreadable retained backlog refuses allocation and releases the lock without writing a marker', async (t) => {
  const root = await repo();
  const retained = worktree(root, 'retained');
  const next = path.join(path.dirname(root), `${path.basename(root)}-next`);
  t.after(async () => {
    for (const directory of [root, retained, next]) await rm(directory, { recursive: true, force: true });
  });
  await addRow(retained, path.join(retained, 'docs/BACKLOG.md'), { type: 'bug', summary: 'retained work', source: 'manual' });
  commit(retained, 'retained item');
  const blob = git(retained, 'rev-parse', 'HEAD:docs/BACKLOG.md');
  git(root, 'worktree', 'remove', retained);
  worktree(root, 'next');
  await rm(path.join(root, '.git/objects', blob.slice(0, 2), blob.slice(2)));
  await assert.rejects(reserveBlock(next), /cat-file/);
  assert.equal(existsSync(path.join(next, '.esq-id-block')), false);
  assert.equal(existsSync(path.join(root, '.git/esq-id-block.lock')), false);
});

test('a sibling worktree created and allocated while a reservation waits on the lock is never omitted', async () => {
  const root = await repo();
  const waiting = worktree(root, 'waiting');
  // Hold the shared lock ourselves, so the reservation below reads its inventory and then waits.
  const lock = path.join(root, '.git/esq-id-block.lock');
  await writeFile(lock, 'held by the test\n', { flag: 'wx' });
  const pending = reserveBlock(waiting);
  // While it waits: a new sibling appears and takes the lowest free block, as a reservation that
  // held the lock before this one would have.
  await new Promise((resolve) => { setTimeout(resolve, 150); });
  const late = worktree(root, 'late');
  await writeFile(path.join(late, '.esq-id-block'), 'id-block: 1000-1999\n');
  await rm(lock);
  const reserved = await pending;
  // An inventory read before the wait would not list `late`, and would hand out 1000 a second time.
  assert.deepEqual([reserved.low, reserved.high, reserved.reserved], [2000, 2999, true]);
  assert.equal(await readFile(path.join(waiting, '.esq-id-block'), 'utf8'), 'id-block: 2000-2999\n');
});

test('worktree.sh refuses to create a worktree when the allocator cannot run, and never allocates without it', { skip: ['/usr/bin/node', '/bin/node'].some((file) => existsSync(file)) && 'node is installed on the reduced PATH, so it cannot be hidden' }, async () => {
  const root = await repo();
  const script = fileURLToPath(new URL('../../scripts/worktree.sh', import.meta.url));
  // No node on PATH: the canonical allocator cannot run, so nothing may be created or allocated.
  const refused = await run('/bin/bash', [script, 'new', 'noalloc'], { cwd: root, env: { ...process.env, PATH: '/usr/bin:/bin' } }).catch((error) => error);
  assert.notEqual(refused.code ?? 0, 0);
  assert.match(refused.stderr, /allocator/);
  assert.equal(git(root, 'worktree', 'list', '--porcelain').split('\n').filter((line) => line.startsWith('worktree ')).length, 1);
  // With the allocator available, creation reserves through it.
  const created = await run('/bin/bash', [script, 'new', 'withalloc'], { cwd: root });
  assert.match(created.stdout, /ID block: B-1000-1999/);
  assert.equal(await readFile(path.join(path.dirname(root), `${path.basename(root)}.worktrees`, 'withalloc', '.esq-id-block'), 'utf8'), 'id-block: 1000-1999\n');
});

// ── Backlog dispositions and filings ─────────────────────────────────────────

test('set-status records the disposition and its provenance in one write, and refuses what would break the table', async () => {
  const root = await repo('| B-010 | 2026-09-11 | ✨ improvement | | ten | manual · Planned by p | | | Planned |\n| B-011 | 2026-09-11 | 🐛 bug | | eleven | manual | | | Open |\n\n---\n\n## B-010 — ten\n\nWhat it is.\n');
  const file = path.join(root, 'docs/BACKLOG.md');
  const done = await setStatus(file, 'B-010', 'Done', { by: 'p', resolution: 'the export carries the declared expectation, verified in a1b2c3d' });
  assert.equal(done.provenance, 'Done by p');
  assert.equal(done.resolution, 'written');
  const text = await readFile(file, 'utf8');
  assert.match(text, /\| B-010 \|.*\| manual · Planned by p · Done by p \|.*\| Done \|/);
  assert.match(text, /## B-010 — ten\n\nWhat it is\.\n\n\*\*Resolution:\*\* the export carries/);

  // The plan that picks a row up stamps the marker `unit.promised` reads, through the CLI.
  await setStatus(file, 'B-011', 'Planned', { by: 'next-plan' });
  assert.match(await readFile(file, 'utf8'), /\| B-011 \|.*manual · Planned by next-plan \|.*\| Planned \|/);
  await setStatus(file, 'B-011', 'Dropped', { reason: 'duplicate of B-010' });
  assert.match(await readFile(file, 'utf8'), /\| B-011 \|.*manual · Planned by next-plan · Dropped: duplicate of B-010 \|.*\| Dropped \|/);

  const before = await readFile(file, 'utf8');
  await assert.rejects(setStatus(file, 'B-011', 'Done', { by: 'a | b' }), /pipe/);
  await assert.rejects(setStatus(file, 'B-011', 'Open', { by: 'p' }), /Done or Planned only/);
  await assert.rejects(setStatus(file, 'B-011', 'Done', { reason: 'x' }), /Dropped only/);
  assert.equal(await readFile(file, 'utf8'), before);

  const usage = await run(process.execPath, [bin, 'backlog', 'set-status', 'B-011', 'Done', '--by'], { cwd: root }).catch((error) => error);
  assert.equal(usage.code, 2);
});

test('a resolution supplied for an item with no detail section is stored, with its status and provenance, in one write', async () => {
  const root = await repo();
  const file = path.join(root, 'docs/BACKLOG.md');
  const filed = await addRow(root, file, { type: '✨ improvement', summary: 'the export carries the declared expectation', source: 'manual · Planned by export' });
  const done = await setStatus(file, filed.id, 'Done', { by: 'export', resolution: 'shipped in a1b2c3d, verified by the export suite' });
  assert.equal(done.resolution, 'created');
  const text = await readFile(file, 'utf8');
  assert.match(text, new RegExp(`\\| ${filed.id} \\|.*\\| manual · Planned by export · Done by export \\|.*\\| Done \\|`));
  // The minimal detail section, in the format /esq:backlog writes, below the table's separator.
  assert.match(text, new RegExp(`\\n---\\n\\n## ${filed.id} — the export carries the declared expectation\\n\\n\\*\\*Resolution:\\*\\* shipped in a1b2c3d, verified by the export suite\\n$`));
  // A second item reuses the separator rather than adding another one.
  const second = await addRow(root, file, { type: '🐛 bug', summary: 'second', source: 'manual' });
  await setStatus(file, second.id, 'Dropped', { reason: 'duplicate', resolution: 'folded into the first' });
  const after = await readFile(file, 'utf8');
  assert.equal(after.match(/^---$/gm).length, 1);
  assert.match(after, new RegExp(`## ${second.id} — second\\n\\n\\*\\*Resolution:\\*\\* folded into the first\\n$`));
  // And the binary path persists it the same way.
  const third = await addRow(root, file, { type: '☑️ todo', summary: 'third', source: 'manual' });
  await run(process.execPath, [bin, 'backlog', 'set-status', third.id, 'Done', '--by', 'x', '--resolution', 'done by hand'], { cwd: root });
  assert.match(await readFile(file, 'utf8'), new RegExp(`## ${third.id} — third\\n\\n\\*\\*Resolution:\\*\\* done by hand\\n$`));
});

test('an observation filed outside the unit never blocks it; a defect filed against the unit still does', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  await write(root, 'docs/plans/2026-09-11-stem.md', '# Stem\n\n**Branch:** esq/stem\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n<!-- x -->\n');
  commit(root, 'plan: stem');
  const file = path.join(root, 'docs/BACKLOG.md');
  const observed = await addRow(root, file, { type: '🐛 bug', summary: 'a pre-existing wrap at 360 px', source: 'observed: stem Phase 1' });
  assert.equal(observed.id, 'B-001');
  assert.deepEqual((await branchCheck(root, 'docs/plans/2026-09-11-stem.md')).unit.open, []);
  const own = await addRow(root, file, { type: '🐛 bug', summary: 'the new guard misses the empty case', source: 'build: stem Phase 1' });
  assert.equal(own.id, 'B-002');
  assert.deepEqual((await branchCheck(root, 'docs/plans/2026-09-11-stem.md')).unit.open.map((row) => row.id), ['B-002']);
  // Capture writes the neutral tail after Pri; a row filed with no stated priority carries the
  // type's suggested `med?`. Neither cell changes the Source classification the unit reads.
  assert.match(await readFile(file, 'utf8'), /\| B-001 \| \d{4}-\d{2}-\d{2} \| 🐛 bug \| med\? \| 100 \| a pre-existing wrap at 360 px \| observed: stem Phase 1 \|  \|  \| Open \|/);
  await assert.rejects(addRow(root, file, { type: 'bug', summary: 'two\nlines', source: 'observed: stem' }), /line break/);
});

// ── Units planned on other branches ──────────────────────────────────────────

test('a unit planned on its own branch stays visible from the branch that planned it, until it lands', async () => {
  const root = await repo('| B-020 | 2026-09-11 | ✨ improvement | | twenty | manual | | | Open |\n| B-021 | 2026-09-11 | ✨ improvement | | twenty-one | manual | | | Open |\n');
  // Advance's shape: plan on esq/topic, flip B-020 Planned there, then return to main.
  git(root, 'switch', '-q', '-c', 'esq/topic');
  await write(root, 'docs/plans/2026-09-11-topic.md', '# Topic\n\n**Branch:** esq/topic\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n<!-- x -->\n');
  await setStatus(path.join(root, 'docs/BACKLOG.md'), 'B-020', 'Planned');
  const backlog = path.join(root, 'docs/BACKLOG.md');
  await writeFile(backlog, (await readFile(backlog, 'utf8')).replace('| twenty | manual |', '| twenty | manual · Planned by topic |'));
  commit(root, 'plan: topic');
  // A plan on a branch its header does not name is not that branch's unit, and is not reported.
  git(root, 'switch', '-q', '-c', 'scratch', 'main');
  await write(root, 'docs/plans/2026-09-11-stray.md', '# Stray\n\n**Branch:** esq/elsewhere\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- task\n');
  commit(root, 'plan: stray');
  git(root, 'switch', '-q', 'main');

  const snapshot = await state(root);
  assert.equal(snapshot.branch, 'main');
  assert.deepEqual(snapshot.inFlight.map((unit) => unit.branch), ['esq/topic']);
  const [unit] = snapshot.inFlight;
  assert.equal(unit.origin, 'main');
  assert.deepEqual(unit.plans.map((plan) => [plan.file, plan.slug, plan.state]), [['docs/plans/2026-09-11-topic.md', 'topic', 'ready']]);
  assert.deepEqual(unit.planned.map((row) => [row.id, row.status]), [['B-020', 'Planned']]);
  // The working tree on main still reads B-020 Open — which is exactly why the branch fact is needed.
  assert.equal(snapshot.backlog.rows.find((row) => row.id === 'B-020').status, 'Open');

  // A second run from main discovers the same unit again, unchanged, and nothing was written to find it.
  const before = git(root, 'status', '--porcelain', '--untracked-files=all');
  assert.deepEqual((await state(root)).inFlight, snapshot.inFlight);
  assert.equal(git(root, 'status', '--porcelain', '--untracked-files=all'), before);

  // Once it lands, its plans are in this tree and it is no longer in flight.
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge: esq/topic into main', 'esq/topic');
  assert.deepEqual((await state(root)).inFlight.map((u) => u.branch), []);
});

test('a plan recorded abandoned on an unmerged branch is not in flight, and neither are the rows it planned', async () => {
  const root = await repo('| B-030 | 2026-09-11 | ✨ improvement | | thirty | manual | | | Open |\n');
  git(root, 'switch', '-q', '-c', 'esq/topic');
  await write(root, 'docs/plans/2026-09-11-topic.md', '# Topic\n\n**Branch:** esq/topic\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n<!-- x -->\n');
  await setStatus(path.join(root, 'docs/BACKLOG.md'), 'B-030', 'Planned');
  const backlog = path.join(root, 'docs/BACKLOG.md');
  await writeFile(backlog, (await readFile(backlog, 'utf8')).replace('| thirty | manual |', '| thirty | manual · Planned by topic |'));
  commit(root, 'plan: topic');
  git(root, 'switch', '-q', 'main');
  assert.deepEqual((await state(root)).inFlight.map((unit) => unit.branch), ['esq/topic']);

  // Abandoned on its own branch and committed there: a branch whose plans are all abandoned is no unit.
  git(root, 'switch', '-q', 'esq/topic');
  await run(process.execPath, [bin, 'plan', 'abandon', 'docs/plans/2026-09-11-topic.md', '--reason', 'superseded'], { cwd: root });
  assert.match(await readFile(path.join(root, 'docs/plans/2026-09-11-topic.md'), 'utf8'), /\*\*Abandoned:\*\*/);
  commit(root, 'plan: abandon topic');
  git(root, 'switch', '-q', 'main');
  assert.deepEqual((await state(root)).inFlight, []);
});
