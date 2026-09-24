import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { appendLog, branchCheck, briefDepth, briefPlan, gateVerify, recordVerification, reviewScope, setAbandoned, setReviewed } from '../../plugin/lib/cli.mjs';

process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const cli = (root, ...args) => JSON.parse(execFileSync(process.execPath, [bin, ...args], { cwd: root, encoding: 'utf8' }));
function commit(root, subject) {
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', subject);
  return git(root, 'rev-parse', 'HEAD');
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-corrective-exit-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, 'init', '-qb', 'main');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'user.email', 'test@example.invalid');
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  await writeFile(path.join(root, 'verify.mjs'), "import assert from 'node:assert/strict';\nassert.equal(2 + 2, 4);\n");
  await writeFile(path.join(root, 'docs/BACKLOG.md'), '# Backlog\n\n| ID | Date | Type | Pri | Summary | Source | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n\n---\n');
  commit(root, 'seed');
  git(root, 'switch', '-qc', 'esq/thing');
  const plans = [];
  for (const slug of ['thing', 'thing-fixes', 'thing-fixes-fixes']) {
    const file = `docs/plans/2026-09-24-${slug}.md`;
    const step = '`(auto)` `node verify.mjs` — arithmetic holds';
    await writeFile(path.join(root, file), `# ${slug}\n\n**Branch:** esq/thing\n\n**Origin:** main\n\n## Goal\nArithmetic holds.\n\n## Phases\n\n### Phase 1 — verify\n- **Verification:**\n  - ${step}\n\n## Execution log\n`);
    const at = commit(root, `plan: ${slug}`);
    execFileSync(process.execPath, ['verify.mjs'], { cwd: root });
    await appendLog(path.join(root, file), JSON.stringify({ phase: 1, status: 'completed', commits: [at.slice(0, 7)], whatBuilt: 'Arithmetic', verification: [step], verified: { at, commands: ['node verify.mjs'] } }));
    commit(root, `plan(${slug}): log phase 1`);
    plans.push(file);
  }
  const target = plans[2];
  const reviewed = git(root, 'rev-parse', 'HEAD');
  await setReviewed(root, target, reviewed);
  commit(root, `plan(reviewed): thing-fixes-fixes at ${reviewed}`);
  const brief = 'docs/plans/2026-09-24-thing-fixes-fixes-fixes.brief.md';
  await writeFile(path.join(root, brief), `# Fixes\n\nSource: /esq:review on thing-fixes-fixes, 2026-09-24\nReviewed at: ${reviewed}\n\n## 🟢 Fix now (safe)\n\n- Correct prospective verification wording\nPreserve the arithmetic property.\n`);
  commit(root, 'brief(fixes): thing-fixes-fixes');
  return { root, plans, target, brief, reviewed };
}

// Exercise the actual existing fix writers, review query and attended merge in a throwaway repo.
// This proves the deterministic path, not the model's safety judgment or its reading of a skill.
for (const changedCommand of [false, true]) {
  test(`an exhausted completed unit corrects, re-proves, reviews and lands (${changedCommand ? 'new command' : 'same command'})`, async (t) => {
    const { root, plans, target, brief, reviewed } = await fixture(t);
    assert.equal(briefDepth(brief).verdict, 'exhausted');
    assert.equal((await briefPlan(path.join(root, brief))).plan, path.join(root, target));
    assert.equal((await branchCheck(root, target)).unit.findings.length, 1);
    await assert.rejects(setAbandoned(root, target, 'not an escape'), /complete/);
    const before = await readFile(path.join(root, target), 'utf8');
    const historical = before.slice(before.indexOf('## Execution log')).trimEnd();
    const command = changedCommand ? 'node --no-warnings verify.mjs' : 'node verify.mjs';
    const step = `\`(auto)\` \`${command}\` — 2 + 2 equals 4`;
    const amended = before.replace('`(auto)` `node verify.mjs` — arithmetic holds', step)
      .replace('## Phases', 'Amendment 2026-09-24: specify the same arithmetic property; historical evidence unchanged.\n\n## Phases');
    await writeFile(path.join(root, target), amended);
    git(root, 'add', target);
    const tree = git(root, 'write-tree');
    execFileSync(process.execPath, changedCommand ? ['--no-warnings', 'verify.mjs'] : ['verify.mjs'], { cwd: root });
    // Even a metadata-looking subject cannot hide a prospective amendment from review.
    const at = commit(root, 'plan: clarify arithmetic verification');
    const beforeProof = await gateVerify(root, target);
    assert.equal(beforeProof.commands[0].decision, 'run');
    const recorded = await recordVerification(root, target, JSON.stringify({ by: `${brief} item 1`, at, tree, step }));
    assert.equal(recorded.refuse, false);
    commit(root, 'docs(plan): append new proof');
    const after = await readFile(path.join(root, target), 'utf8');
    assert.ok(after.slice(after.indexOf('## Execution log')).startsWith(historical));
    for (const file of plans.slice(0, 2)) assert.equal(await readFile(path.join(root, file), 'utf8'), git(root, 'show', `${at}:${file}`) + '\n');
    await rm(path.join(root, brief));
    commit(root, 'brief: retire corrected finding');
    const pending = await branchCheck(root, target);
    assert.deepEqual(pending.unit.findings, []);
    assert.deepEqual(pending.unit.incomplete, []);
    assert.deepEqual(pending.unit.abandoned, []);
    assert.equal(pending.coverage.verdict, 'stale');
    const scope = await reviewScope(root, target);
    assert.equal(scope.base, reviewed);
    assert.equal(scope.mode, 'delta');
    assert.equal(scope.bookkeepingOnly, false);
    assert.deepEqual(scope.paths, [{ status: 'M', path: target }]);
    const diff = execFileSync('sh', ['-c', scope.diff], { cwd: root, encoding: 'utf8' });
    assert.match(diff, /\+.*2 \+ 2 equals 4/);
    assert.doesNotMatch(diff, /^-\*\*Verified:\*\*/m);
    const gate = await gateVerify(root, target, { unit: true });
    assert.ok(gate.commands.every((entry) => entry.decision === 'reuse'));
    // The reviewer owns this judgment; the test records it only after inspecting the diff above.
    await setReviewed(root, target, scope.head);
    commit(root, `plan(reviewed): thing-fixes-fixes at ${scope.head}`);
    assert.equal((await branchCheck(root, target)).coverage.verdict, 'covered');
    assert.equal((await reviewScope(root, target)).bookkeepingOnly, true);
    const head = (await gateVerify(root, target, { unit: true })).head;
    assert.equal(cli(root, 'branch', 'check', target, '--at', head).refuse, false);
    assert.equal(cli(root, 'merge', 'land', '--plan', target).landed, true);
    assert.equal((await branchCheck(root, target)).landed, true);
    assert.deepEqual((await readdir(path.join(root, 'docs/plans'))).sort(), plans.map((file) => path.basename(file)).sort());
  });
}

test('accepting a finding records Dropped, keeps history, and never certifies a failing command', async (t) => {
  const { root, target, brief } = await fixture(t);
  cli(root, 'backlog', 'add', '--summary', 'Optional explanation omitted', '--type', 'debt', '--source', 'fix: thing-fixes-fixes · Planned by thing-fixes-fixes');
  const ledger = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
  const id = ledger.match(/\| (B-\d+) \|/)[1];
  await writeFile(path.join(root, brief), `# Fixes\n\nSource: /esq:review on thing-fixes-fixes, 2026-09-24\n\n## 🟡 Needs a plan\n- ${id}: Optional explanation omitted.\n`);
  commit(root, 'backlog: record finding');
  assert.equal((await branchCheck(root, target)).unit.open.length, 1);
  assert.equal((await branchCheck(root, target)).unit.promised.length, 1);
  cli(root, 'backlog', 'set-status', id, 'Dropped', '--reason', 'Fixture user accepts omitted explanation', '--resolution', 'Explanation remains absent; no delivery claimed');
  await rm(path.join(root, brief));
  commit(root, 'backlog: record accepted debt and retire finding');
  const disposed = await branchCheck(root, target);
  assert.deepEqual(disposed.unit.open, []);
  assert.deepEqual(disposed.unit.promised, []);
  assert.deepEqual(disposed.unit.findings, []);
  assert.match(await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8'), /Explanation remains absent; no delivery claimed/);
  assert.match(git(root, 'show', `HEAD~1:${brief}`), /Optional explanation omitted/);
  await writeFile(path.join(root, 'verify.mjs'), 'process.exit(1);\n');
  commit(root, 'break the verification');
  assert.equal((await gateVerify(root, target, { unit: true })).commands[0].decision, 'run');
  assert.throws(() => execFileSync(process.execPath, ['verify.mjs'], { cwd: root }));
  assert.equal((await branchCheck(root, target)).coverage.verdict, 'stale');
});
