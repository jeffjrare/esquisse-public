import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { branchCheck, branchResolve } from '../../plugin/lib/cli.mjs';

// Real git, in throwaway repositories: the verdict is a claim about git's own state, and a stub
// would prove only that the stub agrees with itself. No network, no remote, no model run.
//
// The contributor's own git config cannot change a verdict — `init.defaultBranch`, an alias, a
// `merge.ff` setting — so both halves (the fixtures' git and the CLI's, which inherits this
// process's environment through execFileSync) run against no config at all. The test seam the rest
// of the CLI uses is likewise off here: these tests want the real thing.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// `origin` is what makes a plan a shipping unit: omit it and the plan is legacy — it records a
// branch, never lands, and claims that branch against nobody. Every ownership fixture below has to
// say which of the two it is writing.
async function plan(root, name, { branch, origin, body = '' } = {}) {
  const file = path.join(root, 'docs/plans', name);
  const branchLine = branch === undefined ? '' : `**Branch:** ${branch}\n`;
  const originLine = origin === undefined ? '' : `**Origin:** ${origin}\n`;
  await writeFile(file, `# ${name}\n\n${branchLine}${originLine}${body}\n## Context\n\nprose.\n\n## Phases\n\n### Phase 1 — one\n- task\n`);
  return path.relative(root, file);
}

// A repository whose only commit is on `defaultBranch`, plus whatever branches the caller names.
async function repo({ defaultBranch = 'main', branches = [], checkout = null } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-branch-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  git(root, 'init', '-q', '-b', defaultBranch);
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await writeFile(path.join(root, 'README.md'), 'seed\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-q', '-m', 'seed');
  for (const name of branches) git(root, 'branch', name);
  if (checkout) git(root, 'switch', '-q', checkout);
  return root;
}

test('the five verdicts, each decided on git and the plan header alone', async () => {
  // detached — HEAD belongs to no branch, so nothing could attribute the phase's commits later.
  const detached = await repo();
  const file = await plan(detached, 'p.md', { branch: 'main' });
  git(detached, 'checkout', '-q', '--detach');
  const onDetached = await branchCheck(detached, file);
  assert.equal(onDetached.verdict, 'detached');
  assert.equal(onDetached.refuse, true);
  assert.equal(onDetached.branch, null);

  // unrecorded — every plan written before the field existed keeps building unchanged.
  const legacy = await repo({ defaultBranch: 'main', branches: ['feat-x'], checkout: 'feat-x' });
  const legacyFile = await plan(legacy, 'p.md', {});
  const onLegacy = await branchCheck(legacy, legacyFile);
  assert.equal(onLegacy.verdict, 'unrecorded');
  assert.equal(onLegacy.refuse, false);
  assert.equal(onLegacy.recorded, null);

  // mismatch — the undeclared case: a plan recording feat-y while HEAD is on feat-x.
  const wrong = await repo({ branches: ['feat-x', 'feat-y'], checkout: 'feat-x' });
  const wrongFile = await plan(wrong, 'p.md', { branch: 'feat-y' });
  const onWrong = await branchCheck(wrong, wrongFile);
  assert.equal(onWrong.verdict, 'mismatch');
  assert.equal(onWrong.refuse, true);
  assert.equal(onWrong.recorded, 'feat-y');
  assert.equal(onWrong.branch, 'feat-x');

  // ok — the branch this shipping unit records, claimed by nobody else. `origin` is reported.
  const right = await repo({ branches: ['feat-y'], checkout: 'feat-y' });
  const rightFile = await plan(right, 'p.md', { branch: 'feat-y', origin: 'main' });
  const onRight = await branchCheck(right, rightFile);
  assert.equal(onRight.verdict, 'ok');
  assert.equal(onRight.refuse, false);
  assert.equal(onRight.origin, 'main');
  assert.deepEqual(onRight.owners, []);

  // owned-elsewhere — a different *shipping unit* already records this branch, and its work is not
  // merged into the origin that plan itself names.
  const shared = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  git(shared, 'commit', '-q', '--allow-empty', '-m', 'other work');
  const mine = await plan(shared, '2026-08-31-mine.md', { branch: 'feat-x', origin: 'main' });
  await plan(shared, '2026-08-20-theirs.md', { branch: 'feat-x', origin: 'main' });
  const onShared = await branchCheck(shared, mine);
  assert.equal(onShared.verdict, 'owned-elsewhere');
  assert.equal(onShared.refuse, true);
  assert.deepEqual(onShared.owners, [{ file: 'docs/plans/2026-08-20-theirs.md', branch: 'feat-x', origin: 'main', merged: false }]);
  assert.match(onShared.reason, /docs\/plans\/2026-08-20-theirs\.md/);
});

// The verdict trunk mode used to produce, without the special case that produced it. Thirty-odd
// plans in this repository record `**Branch:** main` and no origin; if any one of them owned that
// name, every other one — this plan included — would refuse and the repository would be unbuildable.
test('a legacy plan owns nothing, and nothing owns it', async () => {
  // Two legacy plans recording one branch: both `ok`, neither an owner, from either side.
  const both = await repo();
  const a = await plan(both, 'a.md', { branch: 'main' });
  const b = await plan(both, 'b.md', { branch: 'main' });
  for (const file of [a, b]) {
    const verdict = await branchCheck(both, file);
    assert.equal(verdict.verdict, 'ok');
    assert.equal(verdict.refuse, false);
    assert.equal(verdict.origin, null);
    assert.deepEqual(verdict.owners, []);
    assert.match(verdict.reason, /legacy/);
  }

  // A legacy plan and a shipping unit on one branch do not collide, in either direction: the legacy
  // plan claims nothing, and it is not an owner the shipping unit can be refused against.
  const mixed = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const unit = await plan(mixed, '2026-09-01-unit.md', { branch: 'feat-x', origin: 'main' });
  const old = await plan(mixed, '2026-08-01-old.md', { branch: 'feat-x' });
  const onUnit = await branchCheck(mixed, unit);
  assert.equal(onUnit.verdict, 'ok');
  assert.equal(onUnit.refuse, false);
  assert.deepEqual(onUnit.owners, []);
  const onOld = await branchCheck(mixed, old);
  assert.equal(onOld.verdict, 'ok');
  assert.equal(onOld.refuse, false);

  // Two shipping units on one branch still refuse — the guard B-102 exists for is intact.
  const units = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const first = await plan(units, '2026-09-01-first.md', { branch: 'feat-x', origin: 'main' });
  await plan(units, '2026-09-02-second.md', { branch: 'feat-x', origin: 'dev' });
  const onFirst = await branchCheck(units, first);
  assert.equal(onFirst.verdict, 'owned-elsewhere');
  assert.equal(onFirst.refuse, true);
  assert.equal(onFirst.owners[0].origin, 'dev');

  // …and a legacy plan's **Branch:** field keeps its build-time meaning: a mismatch still refuses.
  const away = await repo({ branches: ['feat-x', 'feat-y'], checkout: 'feat-x' });
  const awayFile = await plan(away, 'p.md', { branch: 'feat-y' });
  const onAway = await branchCheck(away, awayFile);
  assert.equal(onAway.verdict, 'mismatch');
  assert.equal(onAway.refuse, true);
});

test('a plan and its -fixes sibling are one shipping unit and share a branch', async () => {
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const file = await plan(root, '2026-08-31-thing.md', { branch: 'feat-x', origin: 'main' });
  await plan(root, '2026-08-31-thing-fixes.md', { branch: 'feat-x', origin: 'main' });
  await plan(root, '2026-09-01-thing-2.md', { branch: 'feat-x', origin: 'main' });
  await plan(root, '2026-09-02-thing-fixes-2.md', { branch: 'feat-x', origin: 'main' });
  const verdict = await branchCheck(root, file);
  assert.equal(verdict.verdict, 'ok');
  assert.equal(verdict.refuse, false);
  // …and the corrective sibling reads the same way from its own side.
  assert.equal((await branchCheck(root, 'docs/plans/2026-08-31-thing-fixes.md')).verdict, 'ok');
  // …including a second corrective round, whose `-2` uniquifier sits outside the `-fixes` suffix.
  assert.equal((await branchCheck(root, 'docs/plans/2026-09-02-thing-fixes-2.md')).verdict, 'ok');
});

test('a correction of a correction is still the same shipping unit', async () => {
  // The chain a real corrective round produces: `/esq:check` writes `<stem>-fixes`, a second finder
  // pass on *that* plan writes `<stem>-fixes-2` or `<stem>-fixes-fixes`, and a third writes
  // `<stem>-fixes-2-fixes`. Every one of them is more of the shipping unit `<stem>` already names,
  // so none of them may read as a second owner of the branch they all legitimately share.
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const stem = await plan(root, '2026-08-31-thing.md', { branch: 'feat-x', origin: 'main' });
  const chain = [
    '2026-09-01-thing-fixes.md',
    '2026-09-02-thing-fixes-2.md',
    '2026-09-03-thing-fixes-2-fixes.md',
    '2026-09-04-thing-fixes-fixes.md',
  ];
  for (const name of chain) await plan(root, name, { branch: 'feat-x', origin: 'main' });
  assert.equal((await branchCheck(root, stem)).verdict, 'ok');
  for (const name of chain) {
    const verdict = await branchCheck(root, `docs/plans/${name}`);
    assert.equal(verdict.verdict, 'ok', `${name} read as ${verdict.verdict}`);
    assert.equal(verdict.refuse, false);
  }
});

test('a name that merely ends in those letters is not a correction of anything', async () => {
  // The strip is anchored to the hyphen, and the recursion must not loosen that: `prefixes` is a
  // slug, not a correction of `pre`, and two unrelated plans on one branch is exactly what
  // `owned-elsewhere` exists to refuse.
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const lookalike = await plan(root, '2026-08-31-prefixes.md', { branch: 'feat-x', origin: 'main' });
  await plan(root, '2026-08-20-pre.md', { branch: 'feat-x', origin: 'main' });
  const verdict = await branchCheck(root, lookalike);
  assert.equal(verdict.verdict, 'owned-elsewhere');
  assert.equal(verdict.refuse, true);
});

test('a plan whose name is nothing but the suffix keeps a non-empty identity', async () => {
  // Degenerate, and it still has to answer: reducing `-fixes` to the empty string would make every
  // other nameless plan its sibling, which is a silent widening of the exemption.
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const bare = await plan(root, '-fixes.md', { branch: 'feat-x', origin: 'main' });
  await plan(root, '2026-08-20-thing.md', { branch: 'feat-x', origin: 'main' });
  const verdict = await branchCheck(root, bare);
  assert.equal(verdict.verdict, 'owned-elsewhere');
  // …and its own corrective sibling still joins it rather than being refused.
  await plan(root, '-fixes-fixes.md', { branch: 'feat-x', origin: 'main' });
  assert.equal((await branchCheck(root, 'docs/plans/-fixes-fixes.md')).owners.map((o) => o.file).includes('docs/plans/-fixes.md'), false);
});

test('a repository with neither main nor master still returns a usable verdict', async () => {
  const root = await repo({ defaultBranch: 'trunkless' });
  const file = await plan(root, 'p.md', { branch: 'trunkless', origin: 'trunkless' });
  const verdict = await branchCheck(root, file);
  // No origin/HEAD, no main, no master, and no remote to ask: the verdict never consults a default
  // branch at all, so a repository that has none is not a degraded case here — it is the ordinary one.
  assert.equal(Object.hasOwn(verdict, 'defaultBranch'), false);
  assert.equal(verdict.origin, 'trunkless');
  assert.equal(verdict.verdict, 'ok');
  assert.equal(verdict.refuse, false);
});

test('a dirty tree is reported as a fact and refuses nothing', async () => {
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const file = await plan(root, 'p.md', { branch: 'feat-x', origin: 'main' });
  const verdict = await branchCheck(root, file);
  assert.equal(verdict.dirty, true);
  assert.equal(verdict.refuse, false);
});

test('an owner whose branch was merged and its name retired still refuses', async () => {
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  git(root, 'commit', '-q', '--allow-empty', '-m', 'their work');
  git(root, 'switch', '-q', 'main');
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge feat-x', 'feat-x');
  git(root, 'branch', '-D', 'feat-x');
  // The name is retired, and reused: a second plan claims it and someone re-cuts the branch.
  git(root, 'switch', '-q', '-c', 'feat-x');
  const mine = await plan(root, '2026-08-31-mine.md', { branch: 'feat-x', origin: 'main' });
  await plan(root, '2026-08-20-theirs.md', { branch: 'feat-x', origin: 'main' });
  const verdict = await branchCheck(root, mine);
  // Merged-ness is asked of the *owning* plan's own origin, not of a repository default: `theirs`
  // records `main`, and its work is on `main`. Ownership alone decides — merged is carried for the
  // refusal's wording, never as its reason.
  assert.equal(verdict.verdict, 'owned-elsewhere');
  assert.equal(verdict.refuse, true);
  assert.equal(verdict.owners[0].merged, true);
});

test('a linked worktree sees its own plans, and git refuses the double checkout', async () => {
  const root = await repo({ branches: ['feat-x'] });
  const file = await plan(root, 'p.md', { branch: 'feat-x', origin: 'main' });
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'plan');
  git(root, 'branch', '-f', 'feat-x', 'HEAD');
  const linked = path.join(await mkdtemp(path.join(os.tmpdir(), 'esq-wt-')), 'feat-x');
  git(root, 'worktree', 'add', '-q', linked, 'feat-x');

  // From inside the linked worktree the verdict is truthful about what it can see: its own
  // docs/plans, its own HEAD.
  const verdict = await branchCheck(linked, file);
  assert.equal(verdict.branch, 'feat-x');
  assert.equal(verdict.verdict, 'ok');

  // Ownership is computed per working tree, so a second worktree's plans are invisible here — git's
  // own refusal to check one branch out twice is what actually prevents the collision.
  assert.throws(() => git(root, 'switch', 'feat-x'), /already (used by|checked out)/);
});

test('a recorded branch name is data, never a command', async () => {
  const root = await repo();
  const sentinel = path.join(root, 'docs/plans/sentinel');
  await writeFile(sentinel, 'intact\n');
  const file = await plan(root, 'p.md', { branch: '; rm -rf ' + root + '/docs' });
  const verdict = await branchCheck(root, file);
  assert.equal(verdict.verdict, 'mismatch');
  assert.equal(verdict.refuse, true);
  assert.equal(await readFile(sentinel, 'utf8'), 'intact\n');
});

test('branch resolve answers new for a slug that corrects nothing', async () => {
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });
  const answer = await branchResolve(root, 'thing');
  assert.deepEqual(
    { ...answer, reason: undefined },
    { slug: 'thing', stem: 'thing', corrective: false, mode: 'new', branch: 'esq/thing', origin: 'feat-x', reason: undefined },
  );
  // A lookalike is not a correction, so it takes the same straight path.
  assert.equal((await branchResolve(root, 'prefixes')).corrective, false);
});

test('branch resolve reuses a stem still in flight and cuts a new unit once it has landed', async () => {
  const root = await repo({ branches: ['esq/thing'], checkout: 'esq/thing' });
  await plan(root, '2026-08-31-thing.md', { branch: 'esq/thing', origin: 'main' });

  // In flight: the branch exists and is not an ancestor of the origin it lands on.
  git(root, 'commit', '-q', '--allow-empty', '-m', 'phase 1');
  const inFlight = await branchResolve(root, 'thing-fixes');
  assert.equal(inFlight.mode, 'reuse');
  assert.equal(inFlight.branch, 'esq/thing');
  assert.equal(inFlight.origin, 'main');
  assert.equal(inFlight.stem, 'thing');
  // …and a second corrective round reads the same, because the chain canonicalizes to one stem.
  assert.equal((await branchResolve(root, 'thing-fixes-2-fixes')).mode, 'reuse');

  // Landed: the correction must not be committed onto a branch nobody will merge again.
  git(root, 'switch', '-q', 'main');
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge esq/thing', 'esq/thing');
  const landed = await branchResolve(root, 'thing-fixes');
  assert.equal(landed.mode, 'new');
  assert.equal(landed.branch, 'esq/thing-fixes');
  assert.equal(landed.origin, 'main');

  // Retired: the name is gone, and the destination is still the stem's own origin.
  git(root, 'branch', '-D', 'esq/thing');
  const retired = await branchResolve(root, 'thing-fixes');
  assert.equal(retired.mode, 'new');
  assert.equal(retired.origin, 'main');
  assert.match(retired.reason, /no longer exists/);
});

test('a stem whose commits landed by cherry-pick is not still in flight', async () => {
  // B-138, replayed against real git and with no manual branch repair anywhere in it: the stem's
  // work reached `main` by cherry-pick, so the branch is no ancestor of `main` and ancestry alone
  // called it in flight — which sent the correction onto a branch nobody would merge again.
  const root = await repo({ branches: ['esq/thing'], checkout: 'esq/thing' });
  await plan(root, '2026-08-31-thing.md', { branch: 'esq/thing', origin: 'main' });
  await writeFile(path.join(root, 'a.txt'), 'phase one\n');
  git(root, 'add', 'a.txt');
  git(root, 'commit', '-q', '-m', 'phase 1');
  const landedCommit = git(root, 'rev-parse', 'HEAD');
  git(root, 'switch', '-q', 'main');
  // `main` moves on first: cherry-picking onto the stem's own parent would reproduce the very same
  // commit object, and the fixture would be testing a fast-forward rather than a cherry-pick.
  await writeFile(path.join(root, 'other.txt'), 'someone else\n');
  git(root, 'add', 'other.txt');
  git(root, 'commit', '-q', '-m', 'unrelated work');
  git(root, 'cherry-pick', landedCommit);
  git(root, 'switch', '-q', 'esq/thing');

  // git agrees the branch is no ancestor — the fixture really is the cherry-pick shape, not a merge.
  assert.throws(() => git(root, 'merge-base', '--is-ancestor', 'esq/thing', 'main'));

  const cherryPicked = await branchResolve(root, 'thing-fixes');
  assert.equal(cherryPicked.mode, 'new');
  assert.equal(cherryPicked.branch, 'esq/thing-fixes');
  assert.equal(cherryPicked.origin, 'main');
  assert.match(cherryPicked.reason, /cherry-pick or rebase/);

  // The same answer rides the ownership verdict's consumer-visible field: an owner that landed by
  // content reads as landed, never as in flight.
  const mine = await plan(root, '2026-09-01-other.md', { branch: 'esq/thing', origin: 'main' });
  const verdict = await branchCheck(root, mine);
  assert.equal(verdict.verdict, 'owned-elsewhere');
  assert.equal(verdict.owners[0].merged, 'equivalent');
});

test('a stem with one commit not upstream is still in flight', async () => {
  // The partial case is the one that must not move: some of the work was cherry-picked, some was
  // not, so the branch still carries commits nothing else has and reusing it is correct.
  const root = await repo({ branches: ['esq/thing'], checkout: 'esq/thing' });
  await plan(root, '2026-08-31-thing.md', { branch: 'esq/thing', origin: 'main' });
  await writeFile(path.join(root, 'a.txt'), 'phase one\n');
  git(root, 'add', 'a.txt');
  git(root, 'commit', '-q', '-m', 'phase 1');
  const picked = git(root, 'rev-parse', 'HEAD');
  await writeFile(path.join(root, 'b.txt'), 'phase two\n');
  git(root, 'add', 'b.txt');
  git(root, 'commit', '-q', '-m', 'phase 2');
  git(root, 'switch', '-q', 'main');
  // Same reason as the fixture above: `main` moves first, so the pick is a real cherry-pick and not
  // a reproduction of the stem's own commit object.
  await writeFile(path.join(root, 'other.txt'), 'someone else\n');
  git(root, 'add', 'other.txt');
  git(root, 'commit', '-q', '-m', 'unrelated work');
  git(root, 'cherry-pick', picked);
  git(root, 'switch', '-q', 'esq/thing');

  const partial = await branchResolve(root, 'thing-fixes');
  assert.equal(partial.mode, 'reuse');
  assert.equal(partial.branch, 'esq/thing');
  assert.match(partial.reason, /still in flight/);
});

test('every question branch resolve cannot answer is a new decision with its reason named', async () => {
  const root = await repo({ branches: ['feat-x'], checkout: 'feat-x' });

  // No plan carries the stem.
  const orphan = await branchResolve(root, 'ghost-fixes');
  assert.equal(orphan.mode, 'new');
  assert.equal(orphan.origin, 'feat-x');
  assert.match(orphan.reason, /no plan in docs\/plans carries the slug/);

  // Legacy stem: it records no origin, so it never lands and there is nothing to inherit.
  await plan(root, '2026-08-31-old.md', { branch: 'esq/old' });
  const legacy = await branchResolve(root, 'old-fixes');
  assert.equal(legacy.mode, 'new');
  assert.equal(legacy.origin, 'feat-x');
  assert.match(legacy.reason, /records no \*\*Origin:\*\*/);

  // A stem with an origin but no branch: nothing to reuse, and the destination is still its own.
  await plan(root, '2026-08-31-bare.md', { origin: 'main' });
  const bare = await branchResolve(root, 'bare-fixes');
  assert.equal(bare.mode, 'new');
  assert.equal(bare.origin, 'main');
  assert.match(bare.reason, /records no \*\*Branch:\*\*/);

  // Detached HEAD: there is no origin to record at all.
  git(root, 'checkout', '-q', '--detach');
  const detached = await branchResolve(root, 'thing');
  assert.equal(detached.mode, 'new');
  assert.equal(detached.origin, null);
  assert.match(detached.reason, /detached/);

  // Outside a git repository entirely.
  const bare_dir = await mkdtemp(path.join(os.tmpdir(), 'esq-nogit-'));
  const nogit = await branchResolve(bare_dir, 'thing');
  assert.equal(nogit.mode, 'new');
  assert.equal(nogit.origin, null);
  assert.match(nogit.reason, /no git repository/);
});

test('branch resolve exits 0 and creates no branch, whatever it answers', async () => {
  const root = await repo({ branches: ['esq/thing'], checkout: 'esq/thing' });
  await plan(root, '2026-08-31-thing.md', { branch: 'esq/thing', origin: 'main' });
  git(root, 'commit', '-q', '--allow-empty', '-m', 'phase 1');
  const before = git(root, 'branch', '--list');
  const { stdout } = await run(bin, ['branch', 'resolve', 'thing-fixes'], { cwd: root });
  assert.equal(JSON.parse(stdout).mode, 'reuse');
  assert.equal(git(root, 'branch', '--list'), before);
  await assert.rejects(run(bin, ['branch', 'resolve'], { cwd: root }), /usage: esq branch resolve <slug>/);
});

test('the subcommand exits 1 exactly when it refuses, and changes no repository state', async () => {
  const root = await repo({ branches: ['feat-x', 'feat-y'], checkout: 'feat-x' });
  const file = await plan(root, 'p.md', { branch: 'feat-y', origin: 'main' });
  const snapshot = () => ({ status: git(root, 'status', '--porcelain', '--untracked-files=all'), refs: git(root, 'for-each-ref', '--format=%(refname)', 'refs/heads') });
  const before = snapshot();

  const refused = await run(process.execPath, [bin, 'branch', 'check', file], { cwd: root }).catch((error) => error);
  assert.equal(refused.code, 1);
  assert.equal(JSON.parse(refused.stdout).verdict, 'mismatch');
  assert.equal(JSON.parse(refused.stdout).refuse, true);

  git(root, 'switch', '-q', 'feat-y');
  const allowed = await run(process.execPath, [bin, 'branch', 'check', file], { cwd: root });
  assert.equal(JSON.parse(allowed.stdout).verdict, 'ok');
  assert.equal(JSON.parse(allowed.stdout).refuse, false);

  // Reads only: no commit, no branch, no stash, no file the command wrote.
  git(root, 'switch', '-q', 'feat-x');
  assert.deepEqual(snapshot(), before);
  assert.equal(before.status, '?? docs/plans/p.md');
  assert.deepEqual(before.refs.split('\n').sort(), ['refs/heads/feat-x', 'refs/heads/feat-y', 'refs/heads/main']);
});

// ── The shipping unit and the defects it filed against itself ────────────────
// The unit key is `**Branch:**`, so a plan and its corrective siblings are one unit however many
// rounds deep the chain runs. What `unit.open` reports is what that unit wrote down against its own
// code and nobody disposed of — read off three table cells, with no severity judged here.

async function backlog(root, rows) {
  const header = '| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n';
  const body = rows.map(([id, type, source, status]) => `| ${id} | 2026-09-09 | ${type} | | summary of ${id} | ${source} | | | ${status} |\n`).join('');
  await mkdir(path.join(root, 'docs'), { recursive: true });
  await writeFile(path.join(root, 'docs/BACKLOG.md'), `# Backlog\n\n${header}${body}`);
}

test('the unit is every plan recording the same Branch, and unit.open is what it filed against its own code', async () => {
  const root = await repo({ branches: ['esq/stem', 'esq/other'], checkout: 'esq/stem' });
  const file = await plan(root, '2026-09-09-stem-fixes-fixes.md', { branch: 'esq/stem', origin: 'main' });
  await plan(root, '2026-09-09-stem.md', { branch: 'esq/stem', origin: 'main' });
  await plan(root, '2026-09-09-stem-fixes.md', { branch: 'esq/stem', origin: 'main' });
  await plan(root, '2026-09-09-elsewhere.md', { branch: 'esq/other', origin: 'main' });
  await backlog(root, [
    // Blocking: a bug and a debt row this unit's build and fix steps filed, neither disposed of.
    ['B-201', '🐛 bug', 'build: stem Phase 3', 'Open'],
    ['B-202', '⚠️ debt', 'fix: 2026-09-09-stem-fixes', 'Planned'],
    // Disposed of — the vocabulary /esq:backlog already writes, and the only thing that releases it.
    ['B-203', '🐛 bug', 'build: stem-fixes Phase 1', 'Done'],
    ['B-204', '🐛 bug', 'build: stem-fixes-fixes Phase 2', 'Dropped'],
    // Non-blocking by type: an idea is not a defect, whatever filed it.
    ['B-205', '💡 idea', 'build: stem Phase 2', 'Open'],
    // Non-blocking by source verb: a finder's row is not a defect a build or fix step parked.
    ['B-206', '⚠️ debt', 'check: stem', 'Open'],
    ['B-207', '🐛 bug', 'review: stem', 'Open'],
    // Another unit's defect, and a row no workflow verb filed at all.
    ['B-208', '🐛 bug', 'build: elsewhere Phase 1', 'Open'],
    ['B-209', '🐛 bug', 'manual', 'Open'],
  ]);

  const verdict = await branchCheck(root, file);
  assert.equal(verdict.verdict, 'ok');
  assert.equal(verdict.unit.branch, 'esq/stem');
  assert.deepEqual(verdict.unit.plans.sort(), [
    'docs/plans/2026-09-09-stem-fixes-fixes.md',
    'docs/plans/2026-09-09-stem-fixes.md',
    'docs/plans/2026-09-09-stem.md',
  ]);
  assert.deepEqual(verdict.unit.open.map((row) => row.id), ['B-201', 'B-202']);
  assert.deepEqual(verdict.unit.open[0], { id: 'B-201', type: 'bug', status: 'Open', source: 'build: stem Phase 3' });
  assert.equal(verdict.unit.open[1].type, 'debt');
  // Every existing key still reads what it read before the block was added.
  assert.equal(verdict.recorded, 'esq/stem');
  assert.deepEqual(verdict.owners, []);
  assert.equal(verdict.refuse, false);

  // Disposing of both releases it, and nothing else in the verdict moves.
  await backlog(root, [['B-201', '🐛 bug', 'build: stem Phase 3', 'Done'], ['B-202', '⚠️ debt', 'fix: 2026-09-09-stem-fixes', 'Dropped']]);
  assert.deepEqual((await branchCheck(root, file)).unit.open, []);
});

test('a plan recording no Branch belongs to no unit, and a missing backlog blocks nothing', async () => {
  const root = await repo({ branches: ['esq/stem'], checkout: 'esq/stem' });
  // No **Branch:** at all — the plan claims nothing, so there is no unit to have filed anything.
  const orphan = await plan(root, 'orphan.md', {});
  await backlog(root, [['B-201', '🐛 bug', 'build: orphan Phase 1', 'Open']]);
  const verdict = await branchCheck(root, orphan);
  assert.equal(verdict.verdict, 'unrecorded');
  assert.deepEqual(verdict.unit, { branch: null, plans: [], incomplete: [], abandoned: [], open: [], promised: [], findings: [] });

  // A unit whose repository has no docs/BACKLOG.md at all: nothing to read is nothing to block on.
  const bare = await repo({ branches: ['esq/stem'], checkout: 'esq/stem' });
  const file = await plan(bare, 'p.md', { branch: 'esq/stem', origin: 'main' });
  assert.deepEqual((await branchCheck(bare, file)).unit.open, []);
});
