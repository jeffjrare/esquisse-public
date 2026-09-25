import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { derive, mergeAbort, mergeBegin, mergeLand, mergeScan, mergeSeal, state, validate } from '../../plugin/lib/cli.mjs';

// Real git, in throwaway repositories, for the reason `ship.test.mjs` gives: these verbs are claims
// about git's own state — whether MERGE_HEAD is alive, what `merge-base` says, what an abort restores
// — and a stub would prove only that the stub agrees with itself. No network, no remote, no push.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// `--quiet` still exits 1 when the ref is absent, and absent is an answer here, not a failure.
function mergeHead(root) {
  try { return git(root, 'rev-parse', '--verify', '--quiet', 'MERGE_HEAD'); }
  catch { return null; }
}

const backlog = (...rows) => `| ID | Pri | Status | Summary |\n| --- | --- | --- | --- |\n${rows.map((row) => `| ${row} |`).join('\n')}\n`;

async function write(root, file, text) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), text);
}

function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
}

// A repository forked at `seed`: `main` then applies `onMain`, `featB` applies `onBranch`, and HEAD
// comes back to `main` with a clean tree — the state every `begin` precondition is written against.
async function forked({ seed, onMain, onBranch }) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-merge-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await write(root, 'README.md', 'seed\n');
  for (const [file, text] of Object.entries(seed ?? {})) await write(root, file, text);
  commit(root, 'seed');
  git(root, 'switch', '-q', '-c', 'featB');
  for (const [file, text] of Object.entries(onBranch ?? {})) await write(root, file, text);
  if (onBranch) commit(root, 'featB');
  git(root, 'switch', '-q', 'main');
  for (const [file, text] of Object.entries(onMain ?? {})) await write(root, file, text);
  if (onMain) commit(root, 'main');
  return root;
}

// Everything a refusal must leave untouched, in one comparable value.
function snapshot(root) {
  return {
    head: git(root, 'rev-parse', 'HEAD'),
    branch: git(root, 'branch', '--show-current'),
    featB: git(root, 'rev-parse', 'refs/heads/featB'),
    porcelain: git(root, 'status', '--porcelain'),
  };
}

test('begin holds a clean merge open and reports the base it merged from', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'src/feature.txt': 'from featB\n' },
    onMain: { 'src/other.txt': 'from main\n' },
  });

  const held = mergeBegin(root, 'featB');
  assert.equal(held.verdict, 'held');
  assert.equal(held.refuse, false);
  assert.equal(held.clean, true);
  assert.equal(held.destination, 'main');
  assert.equal(held.switched, false);
  assert.deepEqual(held.conflicts, { ledger: [], other: [], rows: [] });

  // The merge is genuinely held: MERGE_HEAD is alive, nothing is committed, and the base the verdict
  // names is the one git computes from it.
  assert.equal(mergeHead(root), git(root, 'rev-parse', 'refs/heads/featB'));
  assert.equal(held.mergeBase, git(root, 'merge-base', 'HEAD', 'MERGE_HEAD'));
  assert.equal(git(root, 'log', '-1', '--format=%s'), 'main');
  assert.equal(await readFile(path.join(root, 'src/feature.txt'), 'utf8'), 'from featB\n');
});

test('begin splits the conflicted files into ledger and everything else', async () => {
  // Both sides edit both a ledger and a source file, so git raises one of each.
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared'), 'src/app.txt': 'seed\n' },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | hi | Open | shared'), 'src/app.txt': 'featB\n' },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Planned | shared'), 'src/app.txt': 'main\n' },
  });

  const held = mergeBegin(root, 'featB');
  assert.equal(held.verdict, 'held');
  assert.equal(held.refuse, false);
  assert.equal(held.clean, false);
  assert.deepEqual(held.conflicts.ledger, ['docs/BACKLOG.md']);
  assert.deepEqual(held.conflicts.other, ['src/app.txt']);
  // The non-ledger conflict is left exactly as git wrote it — begin resolves nothing.
  assert.match(await readFile(path.join(root, 'src/app.txt'), 'utf8'), /^<{7} /m);
});

test('begin switches to a destination it was given, and reports that it did', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'src/feature.txt': 'from featB\n' },
  });
  git(root, 'switch', '-q', '-c', 'somewhere-else');

  const held = mergeBegin(root, 'featB', 'main');
  assert.equal(held.verdict, 'held');
  assert.equal(held.destination, 'main');
  assert.equal(held.switched, true);
  assert.equal(git(root, 'rev-parse', '--abbrev-ref', 'HEAD'), 'main');
});

test('every begin precondition refuses at exit 1 and moves nothing', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'src/feature.txt': 'from featB\n' },
    onMain: { 'src/other.txt': 'from main\n' },
  });
  const before = snapshot(root);

  // A branch that does not exist.
  const absent = mergeBegin(root, 'nope');
  assert.equal(absent.verdict, 'absent');
  assert.equal(absent.refuse, true);
  assert.match(absent.reason, /branch nope does not exist/);

  // The branch you are standing on.
  const self = mergeBegin(root, 'main');
  assert.equal(self.verdict, 'self');
  assert.equal(self.refuse, true);

  // A destination that does not exist.
  const noDestination = mergeBegin(root, 'featB', 'nowhere');
  assert.equal(noDestination.verdict, 'absent');
  assert.equal(noDestination.refuse, true);

  // A name git itself would refuse never reaches an argv: no leading `-` read as a flag, no `..`.
  for (const hostile of ['--upload-pack=touch /tmp/pwned', '../../etc', 'has space', '']) {
    const refused = mergeBegin(root, hostile);
    assert.equal(refused.refuse, true, hostile);
    assert.match(refused.reason, /not a usable git ref/, hostile);
  }

  // A dirty working tree, since a merge would carry the uncommitted edit into the result.
  await write(root, 'src/other.txt', 'uncommitted\n');
  const dirty = mergeBegin(root, 'featB');
  assert.equal(dirty.verdict, 'dirty');
  assert.equal(dirty.refuse, true);
  git(root, 'checkout', '--', 'src/other.txt');

  // Nothing above moved HEAD, the source branch, or the working tree.
  assert.deepEqual(snapshot(root), before);

  // An already-merged branch is a no-op, not a failure — and the answer costs no checkout.
  mergeBegin(root, 'featB');
  git(root, 'commit', '-q', '-m', 'merge: featB into main');
  const upToDate = mergeBegin(root, 'featB');
  assert.equal(upToDate.verdict, 'up-to-date');
  assert.equal(upToDate.refuse, true);
  assert.match(upToDate.reason, /already an ancestor of main/);

  // And a second begin over a held merge refuses rather than compounding it.
  git(root, 'switch', '-q', '-c', 'featC');
  await write(root, 'src/c.txt', 'from featC\n');
  commit(root, 'featC');
  git(root, 'switch', '-q', 'main');
  await write(root, 'src/main2.txt', 'main again\n');
  commit(root, 'main again');
  assert.equal(mergeBegin(root, 'featC').verdict, 'held');
  const twice = mergeBegin(root, 'featC');
  assert.equal(twice.verdict, 'merge-in-progress');
  assert.equal(twice.refuse, true);
});

test('scan finds no duplicate in ledgers that merged clean', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | featB item') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-010 | med | Open | main item') },
  });
  const held = mergeBegin(root, 'featB');
  assert.deepEqual(held.conflicts.ledger, ['docs/BACKLOG.md']);

  // Resolve as the skill would: keep both sides' new rows, every ID as written.
  await write(root, 'docs/BACKLOG.md', backlog('B-001 | med | Open | shared', 'B-010 | med | Open | main item', 'B-020 | med | Open | featB item'));
  const scanned = await mergeScan(root);
  assert.equal(scanned.verdict, 'scanned');
  assert.equal(scanned.refuse, false);
  assert.equal(scanned.clean, true);
  assert.deepEqual(scanned.duplicates, []);
  assert.equal(scanned.mergeBase, git(root, 'merge-base', 'HEAD', 'MERGE_HEAD'));
});

test('scan classifies a duplicate present at the base as one item, two edits', async () => {
  // B-001 exists at the fork point and both sides edited it; the resolution below leaves two copies,
  // which is the mistake `scan` has to be able to describe without calling it a collision.
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared'), 'docs/DECISIONS.md': '| ID | Statut |\n| --- | --- |\n| D-shared | Active |\n\n## D-shared — the one\n' },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | hi | Open | shared') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Planned | shared') },
  });
  mergeBegin(root, 'featB');
  await write(root, 'docs/BACKLOG.md', backlog('B-001 | med | Planned | shared', 'B-001 | hi | Open | shared'));
  await write(root, 'docs/DECISIONS.md', '| ID | Statut |\n| --- | --- |\n| D-shared | Active |\n| D-shared | Active |\n\n## D-shared — the one\n\n## D-shared — the other\n');

  const scanned = await mergeScan(root);
  assert.equal(scanned.clean, false);
  assert.deepEqual(scanned.duplicates, [
    { file: 'docs/BACKLOG.md', kind: 'row', id: 'B-001', count: 2, classification: 'present-at-base' },
    { file: 'docs/DECISIONS.md', kind: 'row', id: 'D-shared', count: 2, classification: 'present-at-base' },
    { file: 'docs/DECISIONS.md', kind: 'section', id: 'D-shared', count: 2, classification: 'present-at-base' },
  ]);
  assert.match(scanned.reason, /0 of them absent at the merge base/);
});

test('B-005: a clean Git merge reconciles an ancestor-present ID through the attended path', async (t) => {
  // Both valid branches move the same existing row to different places and edit different cells.
  // Git shares the deletion and accepts both distant insertions, without a conflict hunk.
  const anchors = Array.from({ length: 10 }, (_, index) => `B-${String(index + 2).padStart(3, '0')} | med | Open | anchor ${index + 2}`);
  const file = 'docs/BACKLOG.md';
  const seed = backlog(...anchors.slice(0, 5), 'B-001 | med | Open | shared', ...anchors.slice(5));
  const ours = backlog('B-001 | med | Planned | shared', ...anchors);
  const theirs = backlog(...anchors, 'B-001 | hi | Open | shared');
  const root = await forked({
    seed: { [file]: seed },
    onMain: { [file]: ours },
    onBranch: { [file]: theirs },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const before = snapshot(root);
  const base = git(root, 'merge-base', 'main', 'featB');
  // Prove validity at all three inputs, not just unique IDs in an invented merged fixture.
  for (const ref of [base, 'featB', 'main']) {
    git(root, 'switch', '-q', '--detach', ref);
    assert.equal((await validate(root)).valid, true, ref);
    assert.equal((await readFile(path.join(root, file), 'utf8')).match(/^\| B-001 /gm).length, 1);
  }
  git(root, 'switch', '-q', 'main');
  assert.equal(git(root, 'show', `${base}:${file}`), seed.trim());

  const held = mergeBegin(root, 'featB');
  assert.equal(held.verdict, 'held');
  assert.equal(held.clean, true);
  assert.equal(held.mergeBase, base);
  assert.deepEqual(held.conflicts.ledger, []);
  assert.deepEqual(held.conflicts.other, []);
  assert.equal(mergeHead(root), before.featB);
  assert.equal(git(root, 'ls-files', '-u'), '');
  // No write after begin: these duplicate bytes come solely from the real Git merge.
  const merged = await readFile(path.join(root, file), 'utf8');
  assert.doesNotMatch(merged, /^(?:<{7}|={7}|>{7}|\|{7})(?: |$)/m);
  assert.equal(merged, backlog('B-001 | med | Planned | shared', ...anchors, 'B-001 | hi | Open | shared'));
  const scanned = await mergeScan(root);
  assert.equal(scanned.clean, false);
  assert.equal(scanned.mergeBase, base);
  assert.deepEqual(scanned.duplicates, [
    { file, kind: 'row', id: 'B-001', count: 2, classification: 'present-at-base' },
  ]);
  assert.deepEqual(scanned.rows, [{ file, id: 'B-001', cells: [
    { column: 'Pri', ours: 'med', theirs: 'hi', base: 'med', verdict: 'derived', value: 'hi', rule: 'one-side-unchanged' },
    { column: 'Status', ours: 'Planned', theirs: 'Open', base: 'Open', verdict: 'derived', value: 'Planned', rule: 'one-side-unchanged' },
  ] }]);
  assert.equal(await readFile(path.join(root, file), 'utf8'), merged);

  // /esq:worktree merge step 3: clean copies are collapsed by the attended caller, using the
  // returned values. This does not teach seal new precedence or assume automatic reconciliation.
  const columns = ['ID', 'Pri', 'Status', 'Summary'];
  let retained = false;
  const reconciled = merged.replace(/^\| B-001 .*\n/gm, (line) => {
    if (retained) return '';
    retained = true;
    const values = line.trim().slice(1, -1).split('|').map((cell) => cell.trim());
    for (const cell of scanned.rows[0].cells) {
      assert.equal(cell.verdict, 'derived');
      values[columns.indexOf(cell.column)] = cell.value;
    }
    return `| ${values.join(' | ')} |\n`;
  });
  await write(root, file, reconciled);
  const rescanned = await mergeScan(root);
  assert.equal(rescanned.clean, true);
  assert.deepEqual(rescanned.duplicates, []);
  assert.equal((await validate(root)).valid, true);
  const sealed = await mergeSeal(root);
  assert.equal(sealed.verdict, 'sealed');
  assert.deepEqual(sealed.applied, []); // The attended caller already applied the reported cells.
  assert.equal(await readFile(path.join(root, file), 'utf8'), backlog('B-001 | hi | Planned | shared', ...anchors));
  assert.equal((await validate(root)).valid, true);
  assert.equal(mergeHead(root), null);
  assert.equal(git(root, 'status', '--porcelain'), '');
  assert.equal(git(root, 'rev-parse', 'featB'), before.featB);
  assert.equal(git(root, 'rev-parse', 'HEAD^1'), before.head);
  assert.equal(git(root, 'rev-parse', 'HEAD^2'), before.featB);
});

test('scan classifies a duplicate absent at the base as a genuine collision', async () => {
  // Each side mints a *different* item under B-020, and a different decision under one slug. Neither
  // ID existed at the fork point: this is the case that must never seal.
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared'), 'docs/DECISIONS.md': '| ID | Statut |\n| --- | --- |\n' },
    onBranch: {
      'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | featB item'),
      'docs/DECISIONS.md': '| ID | Statut |\n| --- | --- |\n| D-clash | Active |\n\n## D-clash — from featB\n',
    },
    onMain: {
      'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | main item'),
      'docs/DECISIONS.md': '| ID | Statut |\n| --- | --- |\n| D-clash | Active |\n\n## D-clash — from main\n',
    },
  });
  mergeBegin(root, 'featB');
  await write(root, 'docs/BACKLOG.md', backlog('B-001 | med | Open | shared', 'B-020 | med | Open | main item', 'B-020 | med | Open | featB item'));
  await write(root, 'docs/DECISIONS.md', '| ID | Statut |\n| --- | --- |\n| D-clash | Active |\n| D-clash | Active |\n\n## D-clash — from main\n\n## D-clash — from featB\n');

  const scanned = await mergeScan(root);
  assert.equal(scanned.clean, false);
  assert.deepEqual(scanned.duplicates.map((duplicate) => [duplicate.id, duplicate.kind, duplicate.classification]), [
    ['B-020', 'row', 'absent-at-base'],
    ['D-clash', 'row', 'absent-at-base'],
    ['D-clash', 'section', 'absent-at-base'],
  ]);
  assert.match(scanned.reason, /3 of them absent at the merge base/);
});

test('scan reads boundaries, a ledger absent at the base, and refuses outside a merge', async () => {
  // No merge held at all.
  const idle = await forked({ seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | one') } });
  const outside = await mergeScan(idle);
  assert.equal(outside.verdict, 'no-merge');
  assert.equal(outside.refuse, true);
  assert.deepEqual(outside.duplicates, []);

  // A ledger that did not exist at the fork point: every ID in it is absent at the base, and a
  // neighbouring ID that merely shares a prefix is not the same ID.
  const root = await forked({
    seed: {},
    onBranch: { 'docs/BACKLOG.md': backlog('B-002 | med | Open | featB item') },
    onMain: { 'docs/BACKLOG.md': backlog('B-002 | med | Open | main item', 'B-0021 | med | Open | not the same id') },
  });
  mergeBegin(root, 'featB');
  await write(root, 'docs/BACKLOG.md', backlog('B-002 | med | Open | main item', 'B-0021 | med | Open | not the same id', 'B-002 | med | Open | featB item'));
  const scanned = await mergeScan(root);
  assert.deepEqual(scanned.duplicates, [
    { file: 'docs/BACKLOG.md', kind: 'row', id: 'B-002', count: 2, classification: 'absent-at-base' },
  ]);
});

test('abort restores the tree byte-for-byte and refuses when there is nothing to undo', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared'), 'src/app.txt': 'seed\n' },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | hi | Open | shared'), 'src/app.txt': 'featB\n' },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Planned | shared'), 'src/app.txt': 'main\n' },
  });
  const before = snapshot(root);
  const ledgerBefore = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');

  assert.equal(mergeBegin(root, 'featB').verdict, 'held');
  // Write a resolution first: an abort throws away the caller's work too, which is what makes the
  // escape cheap and total rather than partial.
  await write(root, 'docs/BACKLOG.md', backlog('B-001 | hi | Planned | shared'));

  const aborted = mergeAbort(root);
  assert.equal(aborted.verdict, 'aborted');
  assert.equal(aborted.refuse, false);
  assert.equal(mergeHead(root), null);
  assert.deepEqual(snapshot(root), before);
  assert.equal(await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8'), ledgerBefore);

  const again = mergeAbort(root);
  assert.equal(again.verdict, 'no-merge');
  assert.equal(again.refuse, true);
});

test('the three verbs over the binary: exit 0 when they act, 1 on every refusal', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | featB item') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-010 | med | Open | main item') },
  });
  const esq = (...args) => run(process.execPath, [bin, ...args], { cwd: root }).catch((error) => error);

  const begun = await esq('merge', 'begin', 'featB');
  assert.equal(begun.code, undefined);
  const held = JSON.parse(begun.stdout);
  assert.equal(held.verdict, 'held');
  assert.equal(held.mergeBase, git(root, 'merge-base', 'HEAD', 'MERGE_HEAD'));
  assert.equal(mergeHead(root), git(root, 'rev-parse', 'refs/heads/featB'));

  await write(root, 'docs/BACKLOG.md', backlog('B-001 | med | Open | shared', 'B-010 | med | Open | main item', 'B-020 | med | Open | featB item'));
  const scanned = await esq('merge', 'scan');
  assert.equal(scanned.code, undefined);
  assert.equal(JSON.parse(scanned.stdout).clean, true);

  const aborted = await esq('merge', 'abort');
  assert.equal(aborted.code, undefined);
  assert.equal(git(root, 'status', '--porcelain'), '');

  const nothing = await esq('merge', 'abort');
  assert.equal(nothing.code, 1);
  assert.equal(JSON.parse(nothing.stdout).verdict, 'no-merge');

  // A usage error is exit 2 and a shaped error, never a silent report.
  for (const args of [['merge'], ['merge', 'bagin', 'featB'], ['merge', 'begin'], ['merge', 'begin', 'featB', '--into'], ['merge', 'scan', 'extra']]) {
    const wrong = await esq(...args);
    assert.equal(wrong.code, 2, args.join(' '));
    assert.match(JSON.parse(wrong.stderr).error, /usage: esq merge/, args.join(' '));
  }

  await rm(root, { recursive: true, force: true });
});

test('derive settles one cell by rule, or asks and says which rule it could not reach for', async () => {
  // One case per rule. `base` is the fork point's value; `null` is a row that did not exist there.
  const derived = [
    [['hi', 'hi', 'med'], 'hi', 'both-sides-equal'],
    [['med', 'hi', 'med'], 'hi', 'one-side-unchanged'],
    [['hi', 'med', 'med'], 'hi', 'one-side-unchanged'],
    [['', 'med', 'lo'], 'med', 'blank-loses-to-non-blank'],
    [['med', '', 'lo'], 'med', 'blank-loses-to-non-blank'],
    [['Done', 'Planned', 'Open'], 'Done', 'status-ladder'],
    [['Needs-decision', 'Planned', 'Open'], 'Planned', 'status-ladder'],
    [['hi', 'med', 'lo'], 'hi', 'pri-ladder'],
    // Level first, confirmation second: `hi?` outranks `med`, and `hi` outranks `hi?`.
    [['hi?', 'med', 'lo'], 'hi?', 'pri-ladder'],
    [['hi', 'hi?', 'med'], 'hi', 'pri-ladder'],
    // A row absent at the fork point loses only the one-side-unchanged rule; the ladders still hold.
    [['hi', 'med', null], 'hi', 'pri-ladder'],
    // Whitespace is not a difference.
    [[' hi ', 'hi', 'med'], 'hi', 'both-sides-equal'],
  ];
  for (const [args, value, rule] of derived) {
    assert.deepEqual(derive(...args), { value, rule }, args.join(' vs '));
  }

  // Every `ask` class, each naming why the rules stop rather than guessing a position.
  const asked = [
    [['Dropped', 'Planned', 'Open'], /Dropped is a judgment, not a position on the status ladder/],
    [['Planned', 'Dropped', 'Open'], /Dropped is a judgment/],
    [['Blocked', 'Planned', 'Open'], /Blocked is not on the status ladder/],
    [['urgent', 'med', 'lo'], /urgent is not on the pri ladder/],
    [['main text', 'featB text', 'shared'], /two different non-blank values with no documented ordering/],
    // DECISIONS.md's Statut has no documented ordering, so there is no ladder to apply.
    [['Active', 'Superseded', 'Archived'], /no documented ordering/],
    [['a', 'b', null], /no documented ordering/],
  ];
  for (const [args, reason] of asked) {
    const verdict = derive(...args);
    assert.equal(verdict.value, undefined, args.join(' vs '));
    assert.match(verdict.ask, reason, args.join(' vs '));
  }
});

test('begin reports every shared row cell-wise, keyed by the header the file actually writes', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-002 | med | Open | other') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | hi | Open | shared', 'B-002 | med | Open | featB text') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Planned | shared', 'B-002 | med | Open | main text') },
  });

  const held = mergeBegin(root, 'featB');
  assert.equal(held.verdict, 'held');
  assert.deepEqual(held.conflicts.rows.map((row) => row.id), ['B-001', 'B-002']);

  // The derivable row: two cells, each with the rule that settled it and both sides as they stood.
  const [shared, other] = held.conflicts.rows;
  assert.equal(shared.file, 'docs/BACKLOG.md');
  assert.deepEqual(shared.cells, [
    { column: 'Pri', ours: 'med', theirs: 'hi', base: 'med', verdict: 'derived', value: 'hi', rule: 'one-side-unchanged' },
    { column: 'Status', ours: 'Planned', theirs: 'Open', base: 'Open', verdict: 'derived', value: 'Planned', rule: 'one-side-unchanged' },
  ]);
  // The free-text row: one `ask`, and the ID column is never among the cells — reconciliation
  // changes cells, never keys.
  assert.deepEqual(other.cells.map((cell) => [cell.column, cell.verdict]), [['Summary', 'ask']]);
  assert.match(other.cells[0].ask, /no documented ordering/);

  // `scan` answers the same question over the same refs, so a ledger that auto-merged cleanly is
  // reconciled from the same verdicts as one git raised a conflict on.
  const scanned = await mergeScan(root);
  assert.deepEqual(scanned.rows, held.conflicts.rows);
  await rm(root, { recursive: true, force: true });
});

test('seal applies what the rules settle and commits one row for the shared ID', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | hi | Open | shared') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Planned | shared') },
  });

  assert.equal(mergeBegin(root, 'featB').verdict, 'held');
  const sealed = await mergeSeal(root);
  assert.equal(sealed.verdict, 'sealed');
  assert.equal(sealed.refuse, false);
  assert.equal(sealed.branch, 'featB');
  assert.equal(sealed.destination, 'main');
  assert.deepEqual(sealed.applied, [{
    file: 'docs/BACKLOG.md',
    id: 'B-001',
    cells: [
      { column: 'Pri', value: 'hi', rule: 'one-side-unchanged' },
      { column: 'Status', value: 'Planned', rule: 'one-side-unchanged' },
    ],
  }]);

  // Exactly one row for that ID: Status the further-along value, Pri the higher, ID untouched.
  const merged = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
  assert.equal(merged.match(/^\| B-001 /gm).length, 1);
  assert.match(merged, /^\| B-001 \| hi \| Planned \| shared \|$/m);
  assert.equal(git(root, 'log', '-1', '--format=%s'), 'merge: featB into main');
  assert.equal(git(root, 'status', '--porcelain'), '');
  assert.equal(mergeHead(root), null);
  // The source branch and every commit on it are untouched by the landing.
  assert.equal(git(root, 'rev-parse', 'refs/heads/featB'), git(root, 'rev-parse', 'HEAD^2'));

  // And there is nothing left to seal.
  const again = await mergeSeal(root);
  assert.equal(again.verdict, 'no-merge');
  assert.equal(again.refuse, true);
  await rm(root, { recursive: true, force: true });
});

// B-105: the header and a row can diverge independently. A column added on the incoming branch only
// merges cleanly — the destination never touched that line — so the working tree ends up carrying the
// wider header while the reconciled rows are still rendered from `HEAD:<file>`'s narrower one. Every
// row the rules settle then lands a cell short of its own header and the new column's value is lost,
// silently: the table is still well-formed to a reader.
test('seal renders reconciled rows against the merged header, not the destination\'s older one', async () => {
  const wide = (...rows) => `| ID | Pri | Status | Summary | Epic |\n| --- | --- | --- | --- | --- |\n${rows.map((row) => `| ${row} |`).join('\n')}\n`;
  const root = await forked({
    // Two untouched rows sit between the header and the divergence, so git keeps them as context and
    // cannot widen the conflict hunk to swallow the header — the header merging cleanly on the branch
    // side alone is the whole premise of the case.
    seed: { 'docs/BACKLOG.md': backlog('B-001 | lo | Open | first', 'B-002 | lo | Open | second', 'B-003 | lo | Open | third') },
    // The branch widens the header and fills the new cell on the one row it edits; the rows it did not
    // touch keep their old width, which is exactly how a column migration lands in practice. The
    // destination edits that same row and nothing else.
    onBranch: { 'docs/BACKLOG.md': wide('B-001 | lo | Open | first', 'B-002 | lo | Open | second', 'B-003 | hi | Open | third | billing') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | lo | Open | first', 'B-002 | lo | Open | second', 'B-003 | med | Planned | third') },
  });

  assert.equal(mergeBegin(root, 'featB').verdict, 'held');
  const sealed = await mergeSeal(root);
  assert.equal(sealed.verdict, 'sealed');
  assert.equal(sealed.refuse, false);

  const merged = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
  // The header the merge produced is the one the rows are written against: five columns, and the
  // value that only exists on the incoming side survives the reconciliation.
  assert.match(merged, /^\| ID \| Pri \| Status \| Summary \| Epic \|$/m);
  assert.match(merged, /^\| B-003 \| hi \| Planned \| third \| billing \|$/m);
  assert.equal(merged.match(/^\| B-003 /gm).length, 1);
  // The rows neither side touched are left exactly as they were — reconciliation writes the rows it
  // settles and nothing else, so a column migration's own padding is not this verb's job.
  assert.match(merged, /^\| B-001 \| lo \| Open \| first \|$/m);
  assert.equal(git(root, 'status', '--porcelain'), '');
  assert.equal(mergeHead(root), null);
  await rm(root, { recursive: true, force: true });
});

test('seal refuses on a duplicate ID absent at the base, writing nothing at all', async () => {
  // Each side mints a *different* item under B-020. This is the refusal the design exists for.
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | featB item') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | main item') },
  });
  assert.equal(mergeBegin(root, 'featB').verdict, 'held');
  const held = snapshot(root);
  const ledgerHeld = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');

  const refused = await mergeSeal(root);
  assert.equal(refused.verdict, 'collision');
  assert.equal(refused.refuse, true);
  assert.match(refused.reason, /B-020 was minted on both sides/);
  assert.match(refused.reason, /no ID is ever reassigned/);
  assert.deepEqual(refused.collisions.map((collision) => [collision.id, collision.classification]), [['B-020', 'absent-at-base']]);

  // A total no-op: no commit, and not one byte of the held tree touched on the way to saying so.
  assert.deepEqual(refused.applied, []);
  assert.deepEqual(snapshot(root), held);
  assert.equal(await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8'), ledgerHeld);
  assert.equal(mergeHead(root), git(root, 'rev-parse', 'refs/heads/featB'));

  // The escape is still one command, and it restores everything.
  assert.equal(mergeAbort(root).verdict, 'aborted');
  assert.equal(git(root, 'status', '--porcelain'), '');
  await rm(root, { recursive: true, force: true });
});

test('seal refuses while any conflict marker survives — an ask cell, a section, a source file', async () => {
  // An `ask` cell: two different free texts, which no rule settles.
  const asked = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | featB text') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | main text') },
  });
  assert.equal(mergeBegin(asked, 'featB').verdict, 'held');
  const askRefused = await mergeSeal(asked);
  assert.equal(askRefused.verdict, 'markers');
  assert.equal(askRefused.refuse, true);
  assert.match(askRefused.reason, /conflict markers survive in docs\/BACKLOG\.md/);
  // The hunk is taken whole or not at all: nothing was half-reconciled behind the question.
  assert.deepEqual(askRefused.applied, []);
  assert.match(await readFile(path.join(asked, 'docs/BACKLOG.md'), 'utf8'), /^<{7} /m);
  assert.equal(git(asked, 'log', '-1', '--format=%s'), 'main');

  // A conflicted detail section is prose, not a row — the markers stay for the user to answer.
  const section = await forked({
    seed: { 'docs/BACKLOG.md': `${backlog('B-001 | med | Open | shared')}\n## B-001 — the item\n\nseed prose\n` },
    onBranch: { 'docs/BACKLOG.md': `${backlog('B-001 | med | Open | shared')}\n## B-001 — the item\n\nfeatB prose\n` },
    onMain: { 'docs/BACKLOG.md': `${backlog('B-001 | med | Open | shared')}\n## B-001 — the item\n\nmain prose\n` },
  });
  assert.equal(mergeBegin(section, 'featB').verdict, 'held');
  const sectionRefused = await mergeSeal(section);
  assert.equal(sectionRefused.verdict, 'markers');
  assert.deepEqual(sectionRefused.applied, []);

  // A non-ledger conflict is never this command's to resolve, and never silently committed either.
  const source = await forked({
    seed: { 'src/app.txt': 'seed\n' },
    onBranch: { 'src/app.txt': 'featB\n' },
    onMain: { 'src/app.txt': 'main\n' },
  });
  assert.equal(mergeBegin(source, 'featB').verdict, 'held');
  const sourceRefused = await mergeSeal(source);
  assert.equal(sourceRefused.verdict, 'markers');
  assert.match(sourceRefused.reason, /src\/app\.txt/);
  assert.equal(git(source, 'log', '-1', '--format=%s'), 'main');

  for (const root of [asked, section, source]) await rm(root, { recursive: true, force: true });
});

test('seal over the binary: exit 0 when it commits, 1 on every refusal, 2 on usage', async () => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | hi | Open | shared') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Planned | shared') },
  });
  const esq = (...args) => run(process.execPath, [bin, ...args], { cwd: root }).catch((error) => error);

  // Nothing held: a refusal, not a crash.
  const idle = await esq('merge', 'seal');
  assert.equal(idle.code, 1);
  assert.equal(JSON.parse(idle.stdout).verdict, 'no-merge');

  assert.equal(JSON.parse((await esq('merge', 'begin', 'featB')).stdout).verdict, 'held');
  const sealed = await esq('merge', 'seal');
  assert.equal(sealed.code, undefined);
  assert.equal(JSON.parse(sealed.stdout).verdict, 'sealed');
  assert.equal(git(root, 'log', '-1', '--format=%s'), 'merge: featB into main');

  const wrong = await esq('merge', 'seal', 'extra');
  assert.equal(wrong.code, 2);
  assert.match(JSON.parse(wrong.stderr).error, /usage: esq merge .*\|seal\|/);
  await rm(root, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// land — the unattended composition. Every test below asserts two things at once: what the verdict
// says, and that a refusal left the repository exactly as it was found. The second half is the whole
// safety claim, so it is never assumed from the first.

const PLAN = 'docs/plans/2026-09-04-unit.md';

const rankedBacklog = (...rows) => '| ID | Date | Type | Pri | Rank | Summary | Source | Epic | Version | Status |\n'
  + '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n'
  + rows.map(([id, rank, pri = 'med?']) => `| ${id} | 2026-09-24 | bug | ${pri} | ${rank} | work ${id} | manual | | | Open |\n`).join('');
const storedOrder = async (root) => (await state(root)).backlog.rows
  .sort((a, b) => Number(a.rank) - Number(b.rank)).map(({ id, rank, pri }) => [id, rank, pri]);

test('B-184: collision repair preserves deliberate sequences, not ID or priority order', async (t) => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': rankedBacklog(), [PLAN]: planFile('featB', 'main') },
    onMain: { 'docs/BACKLOG.md': rankedBacklog(['B-090', 100, 'lo'], ['B-010', 200, 'hi']) },
    onBranch: { 'docs/BACKLOG.md': rankedBacklog(['B-080', 100, 'lo?'], ['B-020', 200, 'hi?']) },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = git(root, 'rev-parse', 'featB');
  const landed = await mergeLand(root, PLAN);
  assert.equal(landed.verdict, 'landed', JSON.stringify(landed));
  assert.deepEqual(await storedOrder(root), [
    ['B-090', '100', 'lo'], ['B-080', '200', 'lo?'],
    ['B-010', '300', 'hi'], ['B-020', '400', 'hi?'],
  ]);
  assert.equal((await validate(root)).valid, true);
  assert.equal(git(root, 'rev-parse', 'featB'), source);
  assert.ok(landed.applied.some((row) => row.cells.some((cell) => cell.rule === 'rank-collision')));
});

test('B-184: a marker-free Git merge also repairs distinct rows with equal tail ranks', async (t) => {
  const seed = Array.from({ length: 8 }, (_, index) => [`B-00${index + 1}`, (index + 1) * 100]);
  const root = await forked({
    seed: { 'docs/BACKLOG.md': rankedBacklog(...seed) },
    onMain: { 'docs/BACKLOG.md': rankedBacklog(seed[0], ['B-010', 900], ...seed.slice(1)) },
    onBranch: { 'docs/BACKLOG.md': rankedBacklog(...seed, ['B-020', 900]) },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(mergeBegin(root, 'featB').clean, true);
  assert.equal((await mergeSeal(root)).verdict, 'sealed');
  assert.deepEqual((await storedOrder(root)).slice(-2), [['B-010', '900', 'med?'], ['B-020', '1000', 'med?']]);
  assert.equal((await validate(root)).valid, true);
});

test('B-184: opposing deliberate moves ask, abort unattended, and accept an attended resolution', async (t) => {
  const ledger = (middle) => rankedBacklog(['B-001', 100], ['B-002', middle], ['B-003', 300]);
  const root = await forked({
    seed: { 'docs/BACKLOG.md': ledger(200), [PLAN]: planFile('featB', 'main') },
    onMain: { 'docs/BACKLOG.md': ledger(50) },
    onBranch: { 'docs/BACKLOG.md': ledger(400) },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const before = snapshot(root);
  const refused = await mergeLand(root, PLAN);
  assert.equal(refused.verdict, 'ask');
  assert.equal(refused.asks[0].column, 'Rank');
  assert.deepEqual(snapshot(root), before);
  assert.equal(mergeHead(root), null);

  mergeBegin(root, 'featB');
  const conflicted = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
  assert.equal((await mergeSeal(root)).verdict, 'markers');
  assert.equal(await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8'), conflicted);
  await write(root, 'docs/BACKLOG.md', ledger(400));
  assert.equal((await mergeSeal(root)).verdict, 'sealed');
  assert.deepEqual((await storedOrder(root)).map(([id]) => id), ['B-001', 'B-003', 'B-002']);
});

test('B-184: a collision cannot erase an incoming placement relative to a moved anchor', async (t) => {
  const root = await forked({
    seed: { 'docs/BACKLOG.md': rankedBacklog(['B-001', 100]) },
    onMain: { 'docs/BACKLOG.md': rankedBacklog(['B-001', 300], ['B-010', 200]) },
    onBranch: { 'docs/BACKLOG.md': rankedBacklog(['B-001', 100], ['B-020', 200]) },
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const before = snapshot(root);
  mergeBegin(root, 'featB');
  const refused = await mergeSeal(root);
  assert.equal(refused.verdict, 'ask');
  assert.match(refused.reason, /B-001 before B-020/);
  assert.equal(git(root, 'rev-parse', 'HEAD'), before.head);
  assert.equal(mergeAbort(root).verdict, 'aborted');
  assert.deepEqual(snapshot(root), before);
});

// A plan header, written verbatim so a test can commit fields that are not refs at all. `null` omits
// the line entirely — which is how a legacy plan (no `**Origin:**`) is spelled.
function planFile(branch, origin) {
  const fields = [
    branch === null ? null : `**Branch:** ${branch}`,
    origin === null ? null : `**Origin:** ${origin}`,
  ].filter((line) => line !== null).join('\n');
  return `# The shipping unit\n\n${fields}\n\n## Context\n\nProse mentioning **Branch:** below the first heading, which is never read.\n`;
}

// featB ahead of main by one row edit that every rule settles, with the plan committed on both sides
// as the authority `land` reads. Extra branches are cut from main, so a landing into one of them is
// a real merge rather than a fast-forward no-op.
async function landable(branch = 'featB', origin = 'main', extra = []) {
  const root = await forked({
    seed: {
      'docs/BACKLOG.md': backlog('B-001 | med | Open | shared'),
      [PLAN]: planFile(branch, origin),
    },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | hi | Open | shared') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Planned | shared') },
  });
  for (const name of extra) git(root, 'branch', name, 'main');
  return root;
}

test('land merges the plan’s branch into the plan’s origin, and never lands twice', async () => {
  const root = await landable();
  const featB = git(root, 'rev-parse', 'refs/heads/featB');
  const landed = await mergeLand(root, PLAN);
  assert.equal(landed.verdict, 'landed');
  assert.equal(landed.landed, true);
  assert.equal(landed.refuse, false);
  assert.equal(landed.plan, PLAN);
  assert.equal(landed.branch, 'featB');
  assert.equal(landed.destination, 'main');
  assert.equal(landed.command, null);
  assert.equal(landed.commit, git(root, 'rev-parse', '--short', 'HEAD'));
  assert.equal(git(root, 'log', '-1', '--format=%s'), 'merge: featB into main');
  assert.equal(git(root, 'branch', '--show-current'), 'main');
  assert.equal(git(root, 'rev-parse', 'refs/heads/featB'), featB);
  assert.equal(git(root, 'status', '--porcelain'), '');
  assert.equal(mergeHead(root), null);
  assert.equal(await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8'), backlog('B-001 | hi | Planned | shared'));
  assert.deepEqual(
    landed.applied.flatMap((row) => row.cells.map((cell) => [cell.column, cell.value, cell.rule])),
    [['Pri', 'hi', 'one-side-unchanged'], ['Status', 'Planned', 'one-side-unchanged']],
  );
  // The ship-policy layer is gone from this verb's surface, and so is everything it carried.
  assert.equal(Object.hasOwn(landed, 'policy'), false);
  assert.equal(Object.hasOwn(landed, 'push'), false);

  // Landing twice is not a fault: the second call is the truthful no-op, and it writes nothing.
  const after = snapshot(root);
  const again = await mergeLand(root, PLAN);
  assert.equal(again.verdict, 'up-to-date');
  assert.equal(again.landed, false);
  assert.equal(again.refuse, true);
  assert.match(again.reason, /already an ancestor of main — nothing to merge/);
  assert.equal(again.command, '/esq:worktree merge featB into main');
  assert.deepEqual(snapshot(root), after);
  await rm(root, { recursive: true, force: true });
});

test('a plan that names no landing is refused before git, by field and never by value', async () => {
  // No plan file at all: the verb has no authority to read, so it reads none.
  const missing = await landable();
  const missingBefore = snapshot(missing);
  const noPlan = await mergeLand(missing, 'docs/plans/nothing-here.md');
  assert.equal(noPlan.verdict, 'plan');
  assert.equal(noPlan.landed, false);
  assert.equal(noPlan.refuse, true);
  assert.equal(noPlan.branch, null);
  assert.equal(noPlan.command, null);
  assert.match(noPlan.reason, /could not be read/);
  // And no plan path given at all is the same refusal, not a crash.
  assert.equal((await mergeLand(missing)).verdict, 'plan');
  assert.deepEqual(snapshot(missing), missingBefore);
  assert.equal(mergeHead(missing), null);

  // A legacy plan — a `**Branch:**` and no `**Origin:**` — never lands, and the hand-off it carries
  // is the attended command that would finish the job by hand.
  const legacy = await landable('featB', null);
  const legacyBefore = snapshot(legacy);
  const notLanded = await mergeLand(legacy, PLAN);
  assert.equal(notLanded.verdict, 'legacy');
  assert.equal(notLanded.landed, false);
  assert.equal(notLanded.branch, 'featB');
  assert.equal(notLanded.destination, null);
  assert.equal(notLanded.command, '/esq:worktree merge featB');
  assert.match(notLanded.reason, /records no \*\*Origin:\*\*/);
  assert.deepEqual(snapshot(legacy), legacyBefore);

  // Neither field: nothing to merge and nowhere to merge it.
  const headless = await landable(null, null);
  const headlessBefore = snapshot(headless);
  const noBranch = await mergeLand(headless, PLAN);
  assert.equal(noBranch.verdict, 'plan');
  assert.match(noBranch.reason, /records no \*\*Branch:\*\*/);
  assert.equal(noBranch.command, null);
  assert.deepEqual(snapshot(headless), headlessBefore);

  // A field git itself would refuse. The plan header is model-written text that may arrive on a
  // branch someone else wrote, so the refusal names the *field* — never the value, which reaches a
  // terminal and a log, and is never repaired into something that would run.
  // The hand-off carries whatever the plan established before the refusal and nothing more: an
  // unusable `**Branch:**` leaves no source to name, while an unusable `**Origin:**` still leaves a
  // branch a human can merge by hand into a destination they choose themselves.
  for (const [branch, origin, field, command] of [
    ['--upload-pack=touch /tmp/x', 'main', 'Branch', null],
    ['featB', 'refs/../../evil', 'Origin', '/esq:worktree merge featB'],
  ]) {
    const hostile = await landable(branch, origin);
    const before = snapshot(hostile);
    const refused = await mergeLand(hostile, PLAN);
    assert.equal(refused.verdict, 'unsafe');
    assert.equal(refused.landed, false);
    assert.match(refused.reason, new RegExp(`\\*\\*${field}:\\*\\* field is not a usable git ref`));
    assert.doesNotMatch(refused.reason, /upload-pack|evil/);
    assert.equal(refused.command, command);
    assert.deepEqual(snapshot(hostile), before);
    assert.equal(mergeHead(hostile), null);
    await rm(hostile, { recursive: true, force: true });
  }

  for (const root of [missing, legacy, headless]) await rm(root, { recursive: true, force: true });
});

test('every land no-op names its reason and the command that would finish it', async () => {
  // A branch the plan names that does not exist.
  const absent = await landable('featC');
  const absentBefore = snapshot(absent);
  const missing = await mergeLand(absent, PLAN);
  assert.equal(missing.verdict, 'absent');
  assert.match(missing.reason, /branch featC does not exist/);
  assert.equal(missing.command, '/esq:worktree merge featC into main');
  assert.deepEqual(snapshot(absent), absentBefore);

  // A plan whose branch and origin are the same branch.
  const itself = await landable('main');
  const itselfBefore = snapshot(itself);
  const self = await mergeLand(itself, PLAN);
  assert.equal(self.verdict, 'self');
  assert.equal(self.landed, false);
  assert.equal(self.command, '/esq:worktree merge main into main');
  assert.deepEqual(snapshot(itself), itselfBefore);

  // A dirty tree. `begin` reads it before HEAD moves, so the uncommitted edit is still there after.
  const dirty = await landable();
  await write(dirty, 'src/scratch.txt', 'uncommitted\n');
  const dirtyBefore = snapshot(dirty);
  const refusedDirty = await mergeLand(dirty, PLAN);
  assert.equal(refusedDirty.verdict, 'dirty');
  assert.match(refusedDirty.reason, /working tree is not clean/);
  assert.equal(refusedDirty.command, '/esq:worktree merge featB into main');
  assert.deepEqual(snapshot(dirty), dirtyBefore);
  assert.equal(await readFile(path.join(dirty, 'src/scratch.txt'), 'utf8'), 'uncommitted\n');

  // A merge somebody else is holding open is never taken over.
  const holding = await landable();
  assert.equal(mergeBegin(holding, 'featB').verdict, 'held');
  const heldHead = mergeHead(holding);
  const refusedHeld = await mergeLand(holding, PLAN);
  assert.equal(refusedHeld.verdict, 'merge-in-progress');
  assert.equal(refusedHeld.landed, false);
  assert.equal(refusedHeld.command, '/esq:worktree merge featB into main');
  // The held merge is still held: `land` did not abort a merge it did not begin.
  assert.equal(mergeHead(holding), heldHead);
  assert.equal(mergeAbort(holding).verdict, 'aborted');

  for (const root of [absent, itself, dirty, holding]) await rm(root, { recursive: true, force: true });
});

test('land aborts on the first ask, a non-ledger conflict and a minted-twice ID — each a total no-op', async () => {
  // An `ask`: two different free texts, which no rule settles and nobody is here to answer.
  const asked = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared'), [PLAN]: planFile('featB', 'main') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | featB text') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | main text') },
  });
  const askedBefore = snapshot(asked);
  const refusedAsk = await mergeLand(asked, PLAN);
  assert.equal(refusedAsk.verdict, 'ask');
  assert.equal(refusedAsk.landed, false);
  assert.equal(refusedAsk.command, '/esq:worktree merge featB into main');
  assert.deepEqual(refusedAsk.asks.map((ask) => [ask.file, ask.id, ask.column]), [['docs/BACKLOG.md', 'B-001', 'Summary']]);
  assert.match(refusedAsk.reason, /docs\/BACKLOG\.md B-001 — Summary: /);
  assert.deepEqual(snapshot(asked), askedBefore);
  assert.equal(mergeHead(asked), null);

  // A file outside the ledgers has no schema and no rule. The attended path leaves it for the user;
  // there is no user here, so the landing aborts rather than holding a merge open for nobody.
  const source = await forked({
    seed: { 'src/app.txt': 'seed\n', [PLAN]: planFile('featB', 'main') },
    onBranch: { 'src/app.txt': 'featB\n' },
    onMain: { 'src/app.txt': 'main\n' },
  });
  const sourceBefore = snapshot(source);
  const refusedSource = await mergeLand(source, PLAN);
  assert.equal(refusedSource.verdict, 'conflict');
  assert.deepEqual(refusedSource.conflicts, ['src/app.txt']);
  assert.match(refusedSource.reason, /conflicted outside the ledgers/);
  assert.equal(refusedSource.command, '/esq:worktree merge featB into main');
  assert.deepEqual(snapshot(source), sourceBefore);
  assert.equal(await readFile(path.join(source, 'src/app.txt'), 'utf8'), 'main\n');
  assert.equal(mergeHead(source), null);

  // Two items minted under one number. `seal` refuses on this too; `land` reaches it first so the
  // refusal can abort, and no ID is reassigned to make it go away.
  const minted = await forked({
    seed: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared'), [PLAN]: planFile('featB', 'main') },
    onBranch: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | featB item') },
    onMain: { 'docs/BACKLOG.md': backlog('B-001 | med | Open | shared', 'B-020 | med | Open | main item') },
  });
  const mintedBefore = snapshot(minted);
  const refusedMint = await mergeLand(minted, PLAN);
  assert.equal(refusedMint.verdict, 'collision');
  assert.match(refusedMint.reason, /B-020 was minted on both sides/);
  assert.equal(refusedMint.command, '/esq:worktree merge featB into main');
  assert.deepEqual(refusedMint.collisions.map((collision) => [collision.id, collision.classification]), [['B-020', 'absent-at-base']]);
  // The two rows also differ in every free-text cell, so the collision is reported *ahead* of the
  // `ask` it would otherwise arrive as: "no documented ordering for Summary" never mentions that
  // B-020 is now two items, and reconciling that cell is precisely the wrong answer.
  assert.deepEqual(refusedMint.asks, []);
  assert.deepEqual(snapshot(minted), mintedBefore);
  assert.equal(mergeHead(minted), null);

  // A conflicted detail section is prose: no row, no rule, and `seal`'s marker refusal is what stops
  // it. `land` turns that refusal into an abort, so nothing is left held here either.
  const section = await forked({
    seed: { 'docs/BACKLOG.md': `${backlog('B-001 | med | Open | shared')}\n## B-001 — the item\n\nseed prose\n`, [PLAN]: planFile('featB', 'main') },
    onBranch: { 'docs/BACKLOG.md': `${backlog('B-001 | hi | Open | shared')}\n## B-001 — the item\n\nfeatB prose\n` },
    onMain: { 'docs/BACKLOG.md': `${backlog('B-001 | med | Planned | shared')}\n## B-001 — the item\n\nmain prose\n` },
  });
  const sectionBefore = snapshot(section);
  const refusedSection = await mergeLand(section, PLAN);
  assert.equal(refusedSection.verdict, 'markers');
  assert.equal(refusedSection.landed, false);
  assert.equal(refusedSection.command, '/esq:worktree merge featB into main');
  assert.deepEqual(snapshot(section), sectionBefore);
  assert.equal(mergeHead(section), null);
  assert.equal(await readFile(path.join(section, 'docs/BACKLOG.md'), 'utf8'), `${backlog('B-001 | med | Planned | shared')}\n## B-001 — the item\n\nmain prose\n`);

  for (const root of [asked, source, minted, section]) await rm(root, { recursive: true, force: true });
});

test('land over the binary: exit 0 when it lands, 1 on every refusal, 2 on usage', async () => {
  const root = await landable('featB', null);
  const esq = (...args) => run(process.execPath, [bin, ...args], { cwd: root }).catch((error) => error);

  const refused = await esq('merge', 'land', '--plan', PLAN);
  assert.equal(refused.code, 1);
  assert.equal(JSON.parse(refused.stdout).verdict, 'legacy');
  assert.equal(JSON.parse(refused.stdout).command, '/esq:worktree merge featB');

  // The header is read from the working tree, in this process, immediately before the git write —
  // so recording the origin is all it takes for the same call to land.
  await write(root, PLAN, planFile('featB', 'main'));
  commit(root, 'record the origin');
  const landed = await esq('merge', 'land', '--plan', PLAN);
  assert.equal(landed.code, undefined);
  assert.equal(JSON.parse(landed.stdout).landed, true);
  assert.equal(git(root, 'log', '-1', '--format=%s'), 'merge: featB into main');

  // `land` takes one argument shape and no other: a bare branch is usage, not a landing.
  const wrong = await esq('merge', 'land');
  assert.equal(wrong.code, 2);
  assert.match(JSON.parse(wrong.stderr).error, /usage: esq merge .*\|land --plan <plan-path>>/);
  const bare = await esq('merge', 'land', 'featB');
  assert.equal(bare.code, 2);
  const flag = await esq('merge', 'land', '--plan');
  assert.equal(flag.code, 2);
  await rm(root, { recursive: true, force: true });
});

// The unattended caller is always standing on the branch it is landing: `/esq:converge` runs
// `esq branch check` in its preflight, before its first spawn, and refuses a branch the plan does not
// name (B-119) — so this is the only HEAD `land` ever actually sees in production, and it is the one
// no fixture above covers. That refusal is not what makes `land` correct, and the two are deliberately
// independent: the preflight keeps the run's own commits on the branch the plan names, while `land`
// takes its destination from the plan, never from where the run happens to be standing and never from
// a repository default — which is why the loop below calls it from a fourth branch that is neither
// source nor destination. Reading it off HEAD made converge land `featB` into `featB`, and reading it
// off `origin/HEAD` is the bug B-116 records — a user working on `dev` got a landing aimed at `main`,
// a branch they never named.
test('land takes its destination from the plan, not from HEAD and not from a repository default', async () => {
  // Called from the source branch, the way converge calls it.
  const onSource = await landable();
  git(onSource, 'switch', '-q', 'featB');
  const featB = git(onSource, 'rev-parse', 'refs/heads/featB');
  const landedFromSource = await mergeLand(onSource, PLAN);
  assert.equal(landedFromSource.verdict, 'landed');
  assert.equal(landedFromSource.destination, 'main');
  assert.equal(git(onSource, 'log', '-1', 'refs/heads/main', '--format=%s'), 'merge: featB into main');
  assert.equal(git(onSource, 'rev-parse', 'refs/heads/featB'), featB);
  assert.equal(git(onSource, 'status', '--porcelain'), '');
  assert.equal(mergeHead(onSource), null);
  await rm(onSource, { recursive: true, force: true });

  // Three origins, one of them the repository default and two of them not. Each run is called from a
  // fourth branch that is neither the source nor the destination, so nothing but the plan can be
  // supplying the answer.
  for (const origin of ['main', 'dev', 'test']) {
    const root = await landable('featB', origin, ['dev', 'test']);
    git(root, 'switch', '-q', '-c', 'staging');
    const staging = git(root, 'rev-parse', 'refs/heads/staging');
    const landed = await mergeLand(root, PLAN);
    assert.equal(landed.verdict, 'landed');
    assert.equal(landed.destination, origin);
    assert.equal(git(root, 'log', '-1', `refs/heads/${origin}`, '--format=%s'), `merge: featB into ${origin}`);
    assert.equal(git(root, 'branch', '--show-current'), origin);
    assert.equal(git(root, 'rev-parse', 'refs/heads/staging'), staging);
    // The two branches this landing did not name are exactly where they were.
    for (const other of ['main', 'dev', 'test'].filter((name) => name !== origin)) {
      assert.equal(git(root, 'log', '-1', `refs/heads/${other}`, '--format=%s'), 'main');
    }
    assert.equal(mergeHead(root), null);
    await rm(root, { recursive: true, force: true });
  }
});
