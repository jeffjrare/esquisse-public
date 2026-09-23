import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { branchCheck, landingSite, mergeLand } from '../../plugin/lib/cli.mjs';

// Real git, real linked worktrees, in throwaway repositories. Every claim here is a claim about what
// git's own registry says and about what a second checkout answers when it is asked directly, so a
// stub would only prove the stub agrees with itself. No network, no remote, no model run, and no
// billed anything: the one expensive step a landing takes is stood in for by a counter (the `land`
// helper below), because what these fixtures assert about it is that it never ran.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

async function write(root, file, text) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), text);
}

function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

// A repository laid out the way `/esq:worktree` lays one out, and the layout B-154 was observed in:
// the destination branch checked out in one directory, the shipping unit's branch in a linked worktree
// beside it. Both paths carry a space, because every path in this feature reaches git as an argv
// element and reaches a printed hand-off single-quoted — a fixture without one proves neither.
//
// `destination` defaults to something that is not `main`, so nothing here can pass by hard-coding it.
async function layout({ destination = 'trunk line', source = 'esq/feat one' } = {}) {
  const base = await mkdtemp(path.join(os.tmpdir(), 'esq wt-'));
  const dest = path.join(base, 'dest tree');
  await mkdir(dest, { recursive: true });
  git(dest, 'init', '-q', '-b', destination.replaceAll(' ', '-'));
  git(dest, 'config', 'user.email', 'test@example.invalid');
  git(dest, 'config', 'user.name', 'Test');
  const destBranch = destination.replaceAll(' ', '-');
  await write(dest, 'src/app.js', 'export const one = 1;\n');
  await write(dest, 'docs/BACKLOG.md', '| ID | Status |\n| --- | --- |\n');
  await write(dest, 'docs/DECISIONS.md', '| # | Statut |\n| --- | --- |\n');
  commit(dest, 'seed');

  const sourceBranch = source.replaceAll(' ', '-');
  const src = path.join(base, 'source tree');
  git(dest, 'worktree', 'add', '-q', '-b', sourceBranch, src, destBranch);
  git(src, 'config', 'user.email', 'test@example.invalid');
  git(src, 'config', 'user.name', 'Test');
  return { base, dest, src, destBranch, sourceBranch };
}

const cleanup = (base) => rm(base, { recursive: true, force: true });

// ── The resolver ─────────────────────────────────────────────────────────────

test('a destination nothing else has checked out resolves to the invoking tree', async (t) => {
  const { base, dest, src, destBranch, sourceBranch } = await layout();
  t.after(() => cleanup(base));

  // Asked from the checkout that holds it: `here`, which is the historical in-place merge.
  const here = landingSite(dest, destBranch);
  assert.equal(here.verdict, 'here');
  assert.equal(here.usable, true);
  assert.equal(here.path, git(dest, 'rev-parse', '--show-toplevel'));

  // A branch no worktree has out, and a branch that does not exist at all, are the same answer: git's
  // own `switch` and `mergeBegin`'s own `absent` refusal still decide, exactly as before.
  git(dest, 'branch', 'shelf');
  for (const branch of ['shelf', 'never-existed']) {
    const site = landingSite(src, branch);
    assert.equal(site.verdict, 'here', branch);
    assert.equal(site.usable, true, branch);
  }

  // And the source branch itself, asked from the source worktree.
  assert.equal(landingSite(src, sourceBranch).verdict, 'here');
});

test('a clean linked worktree holding the destination is the landing site, path and all', async (t) => {
  const { base, dest, src, destBranch } = await layout();
  t.after(() => cleanup(base));

  const site = landingSite(src, destBranch);
  assert.equal(site.verdict, 'worktree');
  assert.equal(site.usable, true);
  assert.equal(site.branch, destBranch);
  assert.equal(site.path, git(dest, 'rev-parse', '--show-toplevel'));
  assert.match(site.reason, /which is where the merge runs/);
  // A usable site has nothing to hand off — the landing proceeds.
  assert.equal(site.command, null);
});

test('every unusable destination names its real path and a command that clears it', async (t) => {
  // Each case breaks the checkout that holds the destination in one way, then resolves from the other
  // side — which is exactly what a landing does. The assertions are the same three every time: the
  // verdict, the real path, and a hand-off carrying that path, quoted, so it can be pasted anywhere.
  // `target` says which checkout is broken, because git itself constrains two of them: the main working
  // tree can be neither locked nor reported prunable, so those two cases break the linked worktree and
  // ask for *its* branch from the main checkout. `dirty` runs in the direction B-154 was observed in —
  // the destination in the main checkout, the unit's branch in the worktree resolving toward it.
  const cases = [
    ['dirty', 'destination', async (dest) => { await write(dest, 'src/app.js', 'export const one = 2;\n'); }, /not clean/, / status$/],
    ['locked', 'source', async (src, { dest }) => { git(dest, 'worktree', 'lock', src); }, /locked/, / worktree unlock /],
    ['gone', 'source', async (src) => { await rm(path.join(src, '.git'), { recursive: true, force: true }); }, /prunable/, / worktree prune$/],
  ];
  for (const [verdict, target, breakIt, reason, command] of cases) {
    const fixture = await layout();
    const broken = target === 'destination' ? fixture.dest : fixture.src;
    const from = target === 'destination' ? fixture.src : fixture.dest;
    const branch = target === 'destination' ? fixture.destBranch : fixture.sourceBranch;
    await breakIt(broken, fixture);
    const site = landingSite(from, branch);
    assert.equal(site.verdict, verdict, `${verdict}: ${site.reason}`);
    assert.equal(site.usable, false, verdict);
    assert.equal(site.path, broken, verdict);
    assert.match(site.reason, reason, verdict);
    assert.match(site.command, command, verdict);
    // The refusal names where the trouble actually is, and the command is pasteable: `prune` takes the
    // repository rather than the dead worktree, so what every case shares is a quoted path with a space
    // in it — an unquoted one would reach the shell as two words.
    assert.ok(site.reason.includes(broken), `${verdict} reason: ${site.reason}`);
    assert.match(site.command, /-C '[^']* [^']*'/, `${verdict}: ${site.command}`);
    await cleanup(fixture.base);
  }
});

test('a destination whose worktree switched away is merged in place, as it always was', async (t) => {
  const { base, dest, src, destBranch } = await layout();
  t.after(() => cleanup(base));

  // Rewrite the registry's branch line under the resolver's feet — the shape a race, or a stanza the
  // plain porcelain format garbled, would produce. The directory is asked itself, and disagrees.
  git(dest, 'branch', 'elsewhere');
  git(dest, 'switch', '-q', 'elsewhere');
  const site = landingSite(src, destBranch);
  // Nothing holds the destination now, so it is `here` — and that is the safe reading: `mergeBegin`
  // switches to it in the source tree exactly as it always did.
  assert.equal(site.verdict, 'here');
  assert.equal(site.usable, true);
});

test('a destination that is not a usable git ref never reaches git', async (t) => {
  const { base, src } = await layout();
  t.after(() => cleanup(base));
  for (const bad of ['--upload-pack=x', 'a..b', '', 'has space', null, undefined]) {
    const site = landingSite(src, bad);
    assert.equal(site.verdict, 'unsafe', String(bad));
    assert.equal(site.usable, false, String(bad));
    assert.equal(site.path, null, String(bad));
  }
});

// ── The fact on the branch verdict ───────────────────────────────────────────

const plan = (branch, origin) => `# P

**Branch:** ${branch}

**Origin:** ${origin}

## Phases

### Phase 1 — one
- **Tasks:**
  - Task 1.1: do it

## Execution log
<!-- Appended by /esq:build -->
`;

test('the branch verdict carries the landing site, and null when there is no origin to have one', async (t) => {
  const { base, dest, src, destBranch, sourceBranch } = await layout();
  t.after(() => cleanup(base));

  await write(src, 'docs/plans/p.md', plan(sourceBranch, destBranch));
  commit(src, 'plan: p');

  // From the source worktree, on the source branch: an `ok` verdict whose destination is the other tree.
  const ok = await branchCheck(src, 'docs/plans/p.md');
  assert.equal(ok.verdict, 'ok');
  assert.equal(ok.destination.verdict, 'worktree');
  assert.equal(ok.destination.path, git(dest, 'rev-parse', '--show-toplevel'));
  // Every key the verdict carried before is still there.
  for (const key of ['root', 'file', 'branch', 'head', 'recorded', 'origin', 'dirty', 'verdict', 'owners', 'unit', 'landed', 'coverage', 'refuse', 'reason']) {
    assert.ok(key in ok, key);
  }

  // A plan recording no origin is not a shipping unit, so it has no landing site at all.
  await write(src, 'docs/plans/legacy.md', plan(sourceBranch, '').replace('**Origin:** \n\n', ''));
  commit(src, 'plan: legacy');
  const legacy = await branchCheck(src, 'docs/plans/legacy.md');
  assert.equal(legacy.origin, null);
  assert.equal(legacy.destination, null);

  // And a refusing verdict reads it the same as a passing one — it is computed above every return.
  git(src, 'switch', '-q', '-c', 'somewhere-else');
  const mismatch = await branchCheck(src, 'docs/plans/p.md');
  assert.equal(mismatch.verdict, 'mismatch');
  assert.equal(mismatch.refuse, true);
  assert.equal(mismatch.destination.verdict, 'worktree');
});

// ── Landing through the checkout that owns the destination ───────────────────
//
// `/esq:land`'s expensive step is `esq gate verify`, which on a real suite costs minutes. What these
// fixtures assert about it is that it never runs on a refusal it could have predicted, so it is stood
// in for by a counter rather than by anything billed: `land` below plays the command's documented
// order — read the verdict, spend verification only if the destination is usable, then write — and the
// counter is what the assertions read. Nothing here spawns a model, a suite or a network call.
async function land(from, planPath, { onVerify } = {}) {
  const verdict = await branchCheck(from, planPath);
  if (verdict.destination && !verdict.destination.usable) {
    return { stoppedAt: 'destination', destination: verdict.destination, verified: false };
  }
  if (onVerify) await onVerify();
  const result = await mergeLand(from, planPath);
  return { stoppedAt: result.landed ? null : result.verdict, result, verified: true };
}

// Everything a refusal must leave untouched, in one comparable value, for *both* checkouts.
function snapshot(root) {
  let mergeHead = null;
  try { mergeHead = git(root, 'rev-parse', '--verify', '--quiet', 'MERGE_HEAD'); } catch { mergeHead = null; }
  return {
    head: git(root, 'rev-parse', 'HEAD'),
    branch: git(root, 'branch', '--show-current'),
    porcelain: git(root, 'status', '--porcelain'),
    mergeHead,
  };
}

// The fixture the whole feature exists for: a plan on a branch in a linked worktree, recording an
// origin that is checked out somewhere else. One commit of work on the source branch, so there is
// something to land.
async function unit(options) {
  const fixture = await layout(options);
  await write(fixture.src, 'docs/plans/p.md', plan(fixture.sourceBranch, fixture.destBranch));
  await write(fixture.src, 'src/feature.js', 'export const two = 2;\n');
  commit(fixture.src, 'feat: the work');
  return fixture;
}

test('a unit in a linked worktree lands through the checkout that owns its origin', async (t) => {
  const { base, dest, src, destBranch, sourceBranch } = await unit();
  t.after(() => cleanup(base));

  const before = { src: snapshot(src), destHead: git(dest, 'rev-parse', 'HEAD') };
  let verifications = 0;
  const run = await land(src, 'docs/plans/p.md', { onVerify: () => { verifications += 1; } });

  assert.equal(run.stoppedAt, null, run.result?.reason);
  assert.equal(run.result.landed, true);
  assert.equal(verifications, 1);
  // The merge ran in the other checkout, and the result says so.
  assert.equal(run.result.site.verdict, 'worktree');
  assert.equal(run.result.site.path, git(dest, 'rev-parse', '--show-toplevel'));
  assert.equal(run.result.destination, destBranch);
  // A landing hands back no command, so there is nowhere to run one.
  assert.equal(run.result.cwd, null);

  // The merge commit is on the origin, in the destination worktree, and carries the source's work.
  assert.notEqual(git(dest, 'rev-parse', 'HEAD'), before.destHead);
  assert.equal(git(dest, 'branch', '--show-current'), destBranch);
  assert.equal(git(dest, 'log', '-1', '--format=%s'), `merge: ${sourceBranch} into ${destBranch}`);
  assert.equal(git(dest, 'show', `${destBranch}:src/feature.js`), 'export const two = 2;');
  assert.equal(git(dest, 'status', '--porcelain'), '');

  // And the source checkout is exactly as it was found — still on its own branch, still clean.
  assert.deepEqual(snapshot(src), before.src);
});

test('an unusable destination refuses before verification is spent, and mutates nothing', async (t) => {
  // git will not lock a main working tree, so the locked case first moves the destination branch into a
  // linked worktree of its own. That is the same shape from the resolver's side — a registered worktree
  // that is not this one — and it is what lets both refusals be asserted against the same landing.
  const cases = [
    ['dirty', async (fixture) => { await write(fixture.dest, 'src/app.js', 'export const one = 99;\n'); return fixture.dest; }],
    ['locked', async (fixture) => {
      const parked = path.join(fixture.base, 'parked dest');
      git(fixture.dest, 'switch', '-q', '-c', 'parking');
      git(fixture.dest, 'worktree', 'add', '-q', parked, fixture.destBranch);
      git(fixture.dest, 'worktree', 'lock', parked);
      return parked;
    }],
  ];
  for (const [verdict, breakIt] of cases) {
    const fixture = await unit();
    const owner = await breakIt(fixture);
    const before = { src: snapshot(fixture.src), dest: snapshot(fixture.dest), owner: snapshot(owner) };

    let verifications = 0;
    const run = await land(fixture.src, 'docs/plans/p.md', { onVerify: () => { verifications += 1; } });

    // The whole point: the run stopped on a fact it already held, and bought nothing to learn it.
    assert.equal(run.stoppedAt, 'destination', verdict);
    assert.equal(verifications, 0, verdict);
    assert.equal(run.destination.verdict, verdict, verdict);
    assert.equal(run.destination.path, owner, verdict);
    assert.ok(run.destination.command, verdict);

    // No tree moved: no HEAD, no branch, no index, no held merge, in any checkout involved.
    assert.deepEqual(snapshot(fixture.src), before.src, verdict);
    assert.deepEqual(snapshot(fixture.dest), before.dest, verdict);
    assert.deepEqual(snapshot(owner), before.owner, verdict);
    await cleanup(fixture.base);
  }
});

test('the same refusal reaches the write path, so a direct merge land cannot bypass it', async (t) => {
  const { base, dest, src } = await unit();
  t.after(() => cleanup(base));
  await write(dest, 'src/app.js', 'export const one = 99;\n');
  const before = { src: snapshot(src), dest: snapshot(dest) };

  // `esq merge land` re-resolves the site itself rather than trusting a caller's preflight, so the
  // refusal holds even for a caller that never read the verdict.
  const result = await mergeLand(src, 'docs/plans/p.md');
  assert.equal(result.verdict, 'destination');
  assert.equal(result.landed, false);
  assert.equal(result.site.verdict, 'dirty');
  assert.match(result.command, /git -C '[^']* [^']*' status/);
  assert.deepEqual(snapshot(src), before.src);
  assert.deepEqual(snapshot(dest), before.dest);
});

test('a destination that goes dirty between the preflight read and the write refuses unmutated', async (t) => {
  const { base, dest, src } = await unit();
  t.after(() => cleanup(base));

  // The preflight sees a clean, usable destination.
  const verdict = await branchCheck(src, 'docs/plans/p.md');
  assert.equal(verdict.destination.usable, true);

  // Then it changes under the run, exactly as it can while a real verification spends its minutes.
  await write(dest, 'src/app.js', 'export const one = 99;\n');
  const before = { src: snapshot(src), dest: snapshot(dest) };

  const result = await mergeLand(src, 'docs/plans/p.md');
  assert.equal(result.verdict, 'destination');
  assert.equal(result.site.verdict, 'dirty');
  assert.deepEqual(snapshot(src), before.src);
  assert.deepEqual(snapshot(dest), before.dest);
});

test('a source that moves after verification refuses through the assertion, not the merge', async (t) => {
  const { base, dest, src } = await unit();
  t.after(() => cleanup(base));

  const at = (await branchCheck(src, 'docs/plans/p.md')).head;
  await write(src, 'src/later.js', 'export const three = 3;\n');
  commit(src, 'feat: committed while verification ran');
  const before = { src: snapshot(src), dest: snapshot(dest) };

  const asserted = await branchCheck(src, 'docs/plans/p.md', { at });
  assert.equal(asserted.verdict, 'moved');
  assert.equal(asserted.refuse, true);
  // The chain stops here; nothing merged, in either tree.
  assert.deepEqual(snapshot(src), before.src);
  assert.deepEqual(snapshot(dest), before.dest);
});

test('a conflict in a cross-worktree landing hands back a command and the directory to run it in', async (t) => {
  const { base, dest, src, sourceBranch, destBranch } = await unit();
  t.after(() => cleanup(base));

  // Both sides edit the same non-ledger file, which no rule reconciles.
  await write(src, 'src/app.js', 'export const one = 11;\n');
  commit(src, 'feat: source edit');
  await write(dest, 'src/app.js', 'export const one = 22;\n');
  commit(dest, 'feat: destination edit');
  const before = { src: snapshot(src), dest: snapshot(dest) };

  const result = await mergeLand(src, 'docs/plans/p.md');
  assert.equal(result.verdict, 'conflict');
  assert.equal(result.landed, false);
  assert.equal(result.command, `/esq:worktree merge ${sourceBranch} into ${destBranch}`);
  // A bare command would send the user to re-run it where it cannot work. The directory rides with it.
  assert.equal(result.cwd, git(dest, 'rev-parse', '--show-toplevel'));

  // And the abort restored the destination worktree, not the invoking one — including its branch.
  assert.deepEqual(snapshot(dest), before.dest);
  assert.deepEqual(snapshot(src), before.src);
});

test('an ordinary same-checkout landing is untouched, and carries a here site with no cwd', async (t) => {
  const { base, dest, src, destBranch, sourceBranch } = await unit();
  t.after(() => cleanup(base));

  // Retire the linked worktree, so the source branch and its origin share one checkout — the layout
  // every landing had before this feature existed.
  git(dest, 'worktree', 'remove', '--force', src);
  git(dest, 'switch', '-q', destBranch);
  await write(dest, 'docs/plans/p.md', plan(sourceBranch, destBranch));
  commit(dest, 'plan: p');

  const result = await mergeLand(dest, 'docs/plans/p.md');
  assert.equal(result.landed, true);
  assert.equal(result.site.verdict, 'here');
  assert.equal(result.cwd, null);
  assert.equal(git(dest, 'branch', '--show-current'), destBranch);
  assert.equal(git(dest, 'log', '-1', '--format=%s'), `merge: ${sourceBranch} into ${destBranch}`);
});
