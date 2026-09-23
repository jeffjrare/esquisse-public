import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { appendLog, branchCheck, gateVerify, projections, setAbandoned, setReviewed, state } from '../../plugin/lib/cli.mjs';
import { parseAbandoned } from '../../plugin/lib/markdown.mjs';

// What a landing can prove without re-running anything: projection freshness, review coverage, the
// unit's obligations and whether it already landed. Real git in throwaway repositories, because each
// verdict is a claim about git's own state. No network, no remote, no model run, and neither the
// contributor's git config nor the CLI's test seam can change an answer.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

async function write(root, file, text) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), text);
}

async function repo() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-landing-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await write(root, 'src/app.js', 'export const one = 1;\n');
  await write(root, 'docs/BACKLOG.md', '# Backlog\n');
  await write(root, 'docs/DECISIONS.md', '# Decisions\n');
  await write(root, 'CLAUDE.md', '# Project\n');
  await write(root, '.claude/skills/topic/SKILL.md', '# Topic\n');
  commit(root, 'seed');
  return root;
}

// The two projections, marked the way their owners write them: the date, then the HEAD they mined.
const spec = (date, at) => `# Spec\n<!-- last-spec: ${date}${at ? ` @ ${at}` : ''} -->\n\nfeatures\n`;
const arch = (date, at) => `# Architecture\n<!-- last-arch: ${date}${at ? ` @ ${at}` : ''} -->\n\nparts\n`;
const verdicts = (report) => Object.fromEntries(report.projections.map((entry) => [entry.name, entry.verdict]));

// ── Projection freshness ─────────────────────────────────────────────────────

test('same-day spec and arch refreshes prove each other fresh in either order', async () => {
  for (const order of [['spec', 'arch'], ['arch', 'spec']]) {
    const root = await repo();
    for (const name of order) {
      // Each owner records the HEAD it inspected, then commits its own projection on top of it.
      const mined = git(root, 'rev-parse', 'HEAD');
      if (name === 'spec') await write(root, 'docs/SPEC.md', spec('2026-09-10', mined));
      else { await write(root, 'docs/ARCHITECTURE.md', arch('2026-09-10', mined)); await write(root, 'CLAUDE.md', '# Project\n\nrefreshed\n'); }
      commit(root, name === 'spec' ? 'spec: refresh 2026-09-10 (1 features)' : 'docs(arch): refresh 2026-09-10');
    }
    const report = await projections(root);
    assert.deepEqual(verdicts(report), { spec: 'fresh', arch: 'fresh' }, `${order.join(' then ')}: ${JSON.stringify(report.projections.map((entry) => entry.reason))}`);
    assert.equal(report.fresh, true);
  }
});

test('bookkeeping keeps both fresh; code, decisions and every project-skill byte invalidate', async () => {
  const cases = [
    ['a plan and its brief', async (root) => { await write(root, 'docs/plans/p.md', '# P\n'); await write(root, 'docs/plans/sub/p-fixes.brief.md', '# B\n'); }, 'fresh'],
    ['the backlog', async (root) => { await write(root, 'docs/BACKLOG.md', '# Backlog\n\nrow\n'); }, 'fresh'],
    ['CLAUDE.md', async (root) => { await write(root, 'CLAUDE.md', '# Project\n\nedited by hand\n'); }, 'fresh'],
    ['source code', async (root) => { await write(root, 'src/app.js', 'export const one = 2;\n'); }, 'stale'],
    ['the decisions ledger', async (root) => { await write(root, 'docs/DECISIONS.md', '# Decisions\n\nmore\n'); }, 'stale'],
    ['a project SKILL.md', async (root) => { await write(root, '.claude/skills/topic/SKILL.md', '# Topic\n\nchanged\n'); }, 'stale'],
    ['a project skill reference', async (root) => { await write(root, '.claude/skills/topic/notes.md', 'new\n'); }, 'stale'],
    ['a non-Markdown file under docs/plans', async (root) => { await write(root, 'docs/plans/data.json', '{}\n'); }, 'stale'],
    ['a rename out of source into docs/plans', async (root) => { await mkdir(path.join(root, 'docs/plans'), { recursive: true }); git(root, 'mv', 'src/app.js', 'docs/plans/app.md'); }, 'stale'],
  ];
  for (const [label, mutate, expected] of cases) {
    const root = await repo();
    const mined = git(root, 'rev-parse', 'HEAD');
    await write(root, 'docs/SPEC.md', spec('2026-09-10', mined));
    await write(root, 'docs/ARCHITECTURE.md', arch('2026-09-10', mined));
    commit(root, 'refresh both');
    await mutate(root);
    commit(root, `chore: ${label}`);
    const report = await projections(root);
    assert.deepEqual(verdicts(report), { spec: expected, arch: expected }, `${label}: ${report.projections[0].reason}`);
    if (expected === 'stale') assert.ok(report.projections[0].changed.length > 0, label);
  }
});

test('missing, legacy, date-only, malformed, short and unresolvable provenance cannot prove freshness', async () => {
  const root = await repo();
  const head = git(root, 'rev-parse', 'HEAD');
  const unproven = async () => (await projections(root)).projections;

  // Missing entirely.
  let [specEntry, archEntry] = await unproven();
  assert.equal(specEntry.verdict, 'unproven');
  assert.match(specEntry.reason, /no `last-spec` marker/);
  assert.equal(archEntry.verdict, 'unproven');

  // Legacy: the retired sync marker records a date and never a commit.
  await write(root, 'CLAUDE.md', '# Project\n<!-- last-synced: 2026-08-01 -->\n');
  [, archEntry] = await unproven();
  assert.match(archEntry.reason, /legacy `last-synced`/);

  const shapes = [
    [spec('2026-09-10', null), /records a date and no commit/],
    ['# Spec\n<!-- last-spec: yesterday -->\n', /malformed/],
    [spec('2026-09-10', head.slice(0, 7)), /not a full 40-character commit/],
    [spec('2026-09-10', 'HEAD'), /not a full 40-character commit/],
    [spec('2026-09-10', 'c'.repeat(40)), /not a commit in this repository/],
  ];
  for (const [text, reason] of shapes) {
    await write(root, 'docs/SPEC.md', text);
    [specEntry] = await unproven();
    assert.equal(specEntry.verdict, 'unproven', text);
    assert.match(specEntry.reason, reason, text);
    assert.equal(specEntry.at === null || typeof specEntry.at === 'string', true);
  }
});

test('arch provenance falls back to CLAUDE.md when there is no architecture doc, and prose about a marker is not one', async () => {
  const root = await repo();
  const head = git(root, 'rev-parse', 'HEAD');
  await write(root, 'CLAUDE.md', `# Project\n<!-- last-arch: 2026-09-10 @ ${head} -->\n`);
  // A backticked marker inside a sentence is documentation, never the file's own record.
  await write(root, 'docs/SPEC.md', '# Spec\n\nStaleness reads the `<!-- last-spec: 2026-09-10 -->` marker.\n');
  commit(root, 'docs');
  const report = await projections(root);
  assert.equal(report.projections[1].file, 'CLAUDE.md');
  assert.equal(report.projections[1].verdict, 'fresh');
  assert.equal(report.projections[0].verdict, 'unproven');
  assert.equal(report.fresh, false);
});

test('esq projections over the binary is read-only and always exits 0', async () => {
  const root = await repo();
  const before = git(root, 'status', '--porcelain', '--untracked-files=all');
  const result = await run(process.execPath, [bin, 'projections'], { cwd: root });
  assert.equal(JSON.parse(result.stdout).fresh, false);
  assert.equal(git(root, 'status', '--porcelain', '--untracked-files=all'), before);
  const usage = await run(process.execPath, [bin, 'projections', '--json'], { cwd: root }).catch((error) => error);
  assert.equal(usage.code, 2);
});

// ── Review coverage ──────────────────────────────────────────────────────────

async function unitPlan(root, name, { branch = 'esq/stem', origin = 'main', steps = ['`(auto)` `pnpm test` — the suite is green'] } = {}) {
  const file = path.join(root, 'docs/plans', name);
  await write(root, `docs/plans/${name}`, `# ${name}\n\n**Branch:** ${branch}\n\n**Origin:** ${origin}\n\n## Phases\n\n### Phase 1 — one\n- **Verification:**\n${steps.map((step) => `  - ${step}`).join('\n')}\n\n## Execution log\n<!-- Appended by /esq:build -->\n`);
  return file;
}

test('set-reviewed records a full commit once, beside the header fields, and refuses what cannot prove anything', async () => {
  const root = await repo();
  const file = await unitPlan(root, 'p.md');
  commit(root, 'plan: p');
  const head = git(root, 'rev-parse', 'HEAD');

  await assert.rejects(setReviewed(root, file, head.slice(0, 7)), /full 40-character/);
  await assert.rejects(setReviewed(root, file, 'HEAD'), /full 40-character/);
  await assert.rejects(setReviewed(root, file, 'd'.repeat(40)), /not a commit in this repository/);
  const untouched = await readFile(file, 'utf8');
  assert.doesNotMatch(untouched, /Reviewed at/);

  const first = await setReviewed(root, file, head);
  assert.deepEqual(first, { file: 'docs/plans/p.md', reviewedAt: head, changed: true });
  const text = await readFile(file, 'utf8');
  assert.match(text, new RegExp(`\\*\\*Origin:\\*\\* main\\n\\n\\*\\*Reviewed at:\\*\\* ${head}\\n\\n## Phases`));
  assert.equal((await setReviewed(root, file, head)).changed, false);
  assert.equal(await readFile(file, 'utf8'), text);

  // A later review replaces the value in place rather than stacking a second field.
  commit(root, 'plan(reviewed): p');
  const later = git(root, 'rev-parse', 'HEAD');
  await setReviewed(root, file, later);
  assert.equal((await readFile(file, 'utf8')).match(/\*\*Reviewed at:\*\*/g).length, 1);

  const headerless = path.join(root, 'docs/plans/bare.md');
  await write(root, 'docs/plans/bare.md', '# Bare\n');
  await assert.rejects(setReviewed(root, headerless, head), /no ## heading/);
  const usage = await run(process.execPath, [bin, 'plan', 'set-reviewed', file], { cwd: root }).catch((error) => error);
  assert.equal(usage.code, 2);
});

test('coverage is covered, stale or unproven, and only the harmless list keeps it covered', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const file = await unitPlan(root, 'p.md');
  commit(root, 'plan: p');
  assert.equal((await branchCheck(root, file)).coverage.verdict, 'unproven');

  const reviewed = git(root, 'rev-parse', 'HEAD');
  await setReviewed(root, file, reviewed);
  commit(root, 'plan(reviewed): p');
  await write(root, 'docs/SPEC.md', spec('2026-09-10', reviewed));
  await write(root, 'docs/BACKLOG.md', '# Backlog\n\nclosed\n');
  commit(root, 'spec and backlog bookkeeping');
  const covered = await branchCheck(root, file);
  assert.equal(covered.coverage.verdict, 'covered');
  assert.equal(covered.coverage.reviewedAt, reviewed);

  await write(root, 'src/app.js', 'export const one = 9;\n');
  commit(root, 'fix(app): after the review');
  const stale = await branchCheck(root, file);
  assert.equal(stale.coverage.verdict, 'stale');
  assert.deepEqual(stale.coverage.changed, ['src/app.js']);
});

test('a unit whose review brief was emptied reads corrected, and one never reviewed stays unproven', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const file = await unitPlan(root, '2026-09-20-stem.md');
  commit(root, 'plan: stem');
  // Built, never reviewed: nothing in history says a review ever read this unit.
  await write(root, 'src/app.js', 'export const one = 2;\n');
  commit(root, 'build(stem): phase 1');
  const never = await branchCheck(root, file);
  assert.equal(never.coverage.verdict, 'unproven');
  assert.equal(never.coverage.plan, null);

  // /esq:review finds items and writes its brief. A clean verdict would have recorded
  // **Reviewed at:** instead, so the brief is the only trace the review leaves.
  await write(root, 'docs/plans/2026-09-20-stem-fixes.brief.md',
    '# Fixes\n\nSource: /esq:review on 2026-09-20-stem.md, phase 1\nReviewed at: `' + git(root, 'rev-parse', 'HEAD') + '`\n\n- 🟢 one thing\n');
  const wrote = commit(root, 'brief(fixes): stem');

  // /esq:fix applies every item and clears the brief.
  git(root, 'rm', '-q', 'docs/plans/2026-09-20-stem-fixes.brief.md');
  await write(root, 'src/app.js', 'export const one = 3;\n');
  commit(root, 'fix(stem): the one thing');
  commit(root, 'brief(fixes): clear stem, all fixes applied');

  // The state the loop turned on: no **Reviewed at:** anywhere, and yet the unit has been reviewed.
  const corrected = await branchCheck(root, file);
  assert.equal(corrected.coverage.verdict, 'corrected');
  assert.equal(corrected.coverage.plan, 'docs/plans/2026-09-20-stem.md');
  assert.equal(corrected.coverage.reviewedAt, null);
  assert.match(corrected.coverage.reason, new RegExp(`2026-09-20-stem-fixes\\.brief\\.md at ${wrote.slice(0, 7)}`));

  // A brief another command wrote is not a review: only `Source: /esq:review` counts.
  const other = await repo();
  git(other, 'switch', '-q', '-c', 'esq/stem');
  const checked = await unitPlan(other, '2026-09-20-stem.md');
  commit(other, 'plan: stem');
  await write(other, 'docs/plans/2026-09-20-stem-fixes.brief.md',
    '# Fixes\n\nSource: /esq:check on 2026-09-20-stem.md, phase 1\n\n- 🟢 one thing\n');
  commit(other, 'brief(fixes): stem');
  git(other, 'rm', '-q', 'docs/plans/2026-09-20-stem-fixes.brief.md');
  commit(other, 'brief(fixes): clear stem, all fixes applied');
  assert.equal((await branchCheck(other, checked)).coverage.verdict, 'unproven');

  // And a record that still covers HEAD outranks the brief: corrected is only ever read instead of
  // unproven, never instead of covered or stale.
  await setReviewed(root, file, git(root, 'rev-parse', 'HEAD'));
  commit(root, 'plan(reviewed): stem');
  assert.equal((await branchCheck(root, file)).coverage.verdict, 'covered');
});

test('recording a review never stales verification, and a requirement edit above the log still does', async () => {
  const root = await repo();
  const file = await unitPlan(root, 'p.md', { branch: 'main', origin: 'main' });
  commit(root, 'plan: p');
  const at = git(root, 'rev-parse', 'HEAD');
  await appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: [at.slice(0, 7)], whatBuilt: 'a thing', verification: ['(auto) pnpm test — pass'], verified: { at, commands: ['pnpm test'] } }));
  commit(root, 'plan(p): log phase 1 execution');
  assert.equal((await gateVerify(root, file)).commands[0].decision, 'reuse');

  await setReviewed(root, file, git(root, 'rev-parse', 'HEAD'));
  commit(root, 'plan(reviewed): p');
  const afterReview = await gateVerify(root, file);
  assert.equal(afterReview.commands[0].decision, 'reuse', afterReview.commands[0].reason);

  const text = await readFile(file, 'utf8');
  await writeFile(file, text.replace('### Phase 1 — one', '### Phase 1 — one, now also two'));
  commit(root, 'plan: widen phase 1');
  assert.equal((await gateVerify(root, file)).commands[0].decision, 'run');

  // The exclusion is the header field alone: the same line written inside a phase is a requirement.
  const second = await repo();
  const other = await unitPlan(second, 'q.md', { branch: 'main', origin: 'main' });
  commit(second, 'plan: q');
  const proved = git(second, 'rev-parse', 'HEAD');
  await appendLog(other, JSON.stringify({ phase: 1, status: 'completed', commits: [proved.slice(0, 7)], whatBuilt: 'a thing', verification: ['ok'], verified: { at: proved, commands: ['pnpm test'] } }));
  const logged = await readFile(other, 'utf8');
  await writeFile(other, logged.replace('- **Verification:**', `**Reviewed at:** ${proved}\n- **Verification:**`));
  commit(second, 'plan(q): log phase 1 execution');
  assert.equal((await gateVerify(second, other)).commands[0].decision, 'run');
});

// ── Recorded abandonment ─────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

test('abandon records one header marker, replaces rather than stacks, and refuses what could forge structure', async () => {
  const root = await repo();
  const file = await unitPlan(root, 'p.md');
  commit(root, 'plan: p');
  const pristine = await readFile(file, 'utf8');

  const refusals = [
    ['', /cannot be empty/],
    ['   ', /cannot be empty/],
    ['one\nline', /one line/],
    ['one\rline', /one line/],
    ['## Execution log', /heading or a \*\*field:\*\*/],
    ['**Branch:** main', /heading or a \*\*field:\*\*/],
    ['x'.repeat(201), /201 characters; at most 200/],
  ];
  for (const [reason, message] of refusals) {
    await assert.rejects(setAbandoned(root, file, reason), message, JSON.stringify(reason));
    assert.equal(await readFile(file, 'utf8'), pristine, JSON.stringify(reason));
  }
  await assert.rejects(setAbandoned(root, path.join(root, 'docs/plans/missing.md'), 'gone'), /ENOENT/);

  const first = await setAbandoned(root, file, 'x'.repeat(200));
  assert.deepEqual(first, { file: 'docs/plans/p.md', abandoned: { date: today(), reason: 'x'.repeat(200) }, changed: true });
  const text = await readFile(file, 'utf8');
  assert.match(text, new RegExp(`\\*\\*Origin:\\*\\* main\\n\\n\\*\\*Abandoned:\\*\\* ${today()} — x{200}\\n\\n## Phases`));
  assert.equal((await setAbandoned(root, file, 'x'.repeat(200))).changed, false);
  assert.equal(await readFile(file, 'utf8'), text);
  await setAbandoned(root, file, 'superseded by `q`');
  const replaced = await readFile(file, 'utf8');
  assert.equal(replaced.match(/\*\*Abandoned:\*\*/g).length, 1);
  assert.deepEqual(parseAbandoned(replaced), { date: today(), reason: 'superseded by `q`' });

  // A plan that shipped has nothing to abandon, and the refusal leaves it untouched.
  const done = await unitPlan(root, 'done.md');
  await appendLog(done, JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing', verification: ['ok'], verified: { at: git(root, 'rev-parse', 'HEAD'), commands: ['pnpm test'] } }));
  const shipped = await readFile(done, 'utf8');
  await assert.rejects(setAbandoned(root, done, 'too late'), /every phase completed/);
  assert.equal(await readFile(done, 'utf8'), shipped);

  // Over the binary: usage errors exit 2 and write nothing.
  const usage = await run(process.execPath, [bin, 'plan', 'abandon', done, 'no flag'], { cwd: root }).catch((error) => error);
  assert.equal(usage.code, 2);
  const refused = await run(process.execPath, [bin, 'plan', 'abandon', file, '--reason', '## x'], { cwd: root }).catch((error) => error);
  assert.equal(refused.code, 2);
  assert.equal(await readFile(file, 'utf8'), replaced);
});

test('a malformed marker is not abandonment, and prose below the header is not a marker', () => {
  const plan = (line) => `# P\n\n**Branch:** b\n\n${line}\n\n## Phases\n`;
  assert.deepEqual(parseAbandoned(plan('**Abandoned:** 2026-09-11 — superseded')), { date: '2026-09-11', reason: 'superseded' });
  assert.equal(parseAbandoned(plan('**Abandoned:** superseded')), null);
  assert.equal(parseAbandoned(plan('**Abandoned:** 2026-09-11')), null);
  assert.equal(parseAbandoned(plan('**Abandoned:** 2026-09-11 — ')), null);
  assert.equal(parseAbandoned('# P\n\n## Phases\n\n**Abandoned:** 2026-09-11 — in a phase\n'), null);
});

test('recording abandonment stales neither the unit\'s review coverage nor a phase\'s recorded verification', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const stem = await unitPlan(root, '2026-09-10-stem.md');
  commit(root, 'plan: stem');
  await logged(root, stem, 1, ['pnpm test']);
  const fixes = await unitPlan(root, '2026-09-11-stem-fixes.md');
  commit(root, 'plan: stem-fixes');
  await setReviewed(root, stem, git(root, 'rev-parse', 'HEAD'));
  commit(root, 'plan(converged): stem');
  assert.equal((await branchCheck(root, stem)).coverage.verdict, 'covered');
  assert.equal((await gateVerify(root, stem)).commands[0].decision, 'reuse');

  await setAbandoned(root, fixes, 'the finding was dropped');
  commit(root, 'plan(abandoned): stem-fixes');
  assert.equal((await branchCheck(root, stem)).coverage.verdict, 'covered');
  const reuse = await gateVerify(root, stem);
  assert.equal(reuse.commands[0].decision, 'reuse', reuse.commands[0].reason);

  // The same marker on the plan that recorded the proof still stales nothing, whatever the field order.
  const half = path.join(root, 'docs/plans/2026-09-11-half.md');
  await write(root, 'docs/plans/2026-09-11-half.md', '# half\n\n**Branch:** esq/stem\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- **Verification:**\n  - `(auto)` `pnpm lint` — clean\n\n### Phase 2 — two\n- **Verification:**\n  - `(auto)` `pnpm e2e` — green\n\n## Execution log\n<!-- Appended by /esq:build -->\n');
  commit(root, 'plan: half');
  await logged(root, half, 1, ['pnpm lint']);
  await setAbandoned(root, half, 'phase 2 is not needed');
  await setReviewed(root, half, git(root, 'rev-parse', 'HEAD'));
  commit(root, 'plan(abandoned): half');
  const lint = (await gateVerify(root, half)).commands.find((entry) => entry.command === 'pnpm lint');
  assert.equal(lint.decision, 'reuse', lint.reason);
});

// ── The unit's obligations ───────────────────────────────────────────────────

async function backlog(root, rows) {
  const header = '| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n';
  const body = rows.map(([id, type, source, status]) => `| ${id} | 2026-09-10 | ${type} | | summary of ${id} | ${source} | | | ${status} |\n`).join('');
  await write(root, 'docs/BACKLOG.md', `# Backlog\n\n${header}${body}`);
}

test('unit.promised is every undisposed row a unit plan picked up, membership read off Branch alone', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const file = await unitPlan(root, '2026-09-10-stem.md');
  // Same branch, unrelated name: a member. Shared filename prefix, other branch: not a member.
  await unitPlan(root, '2026-09-10-unrelated-name.md');
  await unitPlan(root, '2026-09-10-stem-extra.md', { branch: 'esq/elsewhere' });
  await backlog(root, [
    ['B-301', '✨ improvement', 'manual · Planned by stem', 'Planned'],
    ['B-302', '💡 idea', 'review: x · Planned by 2026-09-10-unrelated-name', 'Needs-decision'],
    ['B-303', '🐛 bug', 'manual · Planned by stem', 'Open'],
    ['B-304', '✨ improvement', 'manual · Planned by stem · Done by stem', 'Done'],
    ['B-305', '✨ improvement', 'manual · Planned by stem', 'Dropped'],
    ['B-306', '✨ improvement', 'manual · Planned by stem-extra', 'Planned'],
    ['B-307', '✨ improvement', 'manual', 'Planned'],
  ]);
  commit(root, 'plans and backlog');
  const verdict = await branchCheck(root, file);
  assert.deepEqual(verdict.unit.promised.map((row) => row.id), ['B-301', 'B-302', 'B-303']);
  assert.deepEqual(verdict.unit.promised[1], { id: 'B-302', type: '💡 idea', status: 'Needs-decision', source: 'review: x · Planned by 2026-09-10-unrelated-name' });
  // unit.open is unchanged by the new block: still 🐛/⚠️ rows a build: or fix: step filed.
  assert.deepEqual(verdict.unit.open, []);
});

test('unit.findings are live corrective briefs whose Source names a unit plan, with items still standing', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const file = await unitPlan(root, '2026-09-10-stem.md');
  await unitPlan(root, '2026-09-10-stem-fixes.md');
  await unitPlan(root, '2026-09-10-other.md', { branch: 'esq/other' });
  const brief = (source, body) => `# Fixes brief: x\n\nSource: ${source}, 2026-09-10\nReviewed at: abc1234\n\n${body}\n## For /esq:fix and /esq:plan\n`;
  await write(root, 'docs/plans/2026-09-10-stem-fixes.brief.md', brief('/esq:check on 2026-09-10-stem', '## 🟡 Needs a plan\n- a thing — `a.js:1` — why\n'));
  await write(root, 'docs/plans/2026-09-10-stem-fixes-fixes-2.brief.md', brief('/esq:review on stem-fixes', '## 🔴 Needs your decision\n- a decision\n  - **A · x** — y — do: `z`\n'));
  // Linked, but every item was struck: not a finding.
  await write(root, 'docs/plans/2026-09-11-stem-fixes.brief.md', brief('/esq:review on stem', '## 🟢 Fix now (safe)\n'));
  // Another unit's brief, a grill brief, and a brief whose filename looks like this unit but whose Source does not.
  await write(root, 'docs/plans/2026-09-10-other-fixes.brief.md', brief('/esq:check on other', '## 🟢 Fix now (safe)\n- g — `a.js:1` — fix: f — verify: v\n'));
  await write(root, 'docs/plans/2026-09-10-stem.brief.md', '# Brief: stem\n\n## 🟢 Not a finding\n- x\n');
  await write(root, 'docs/plans/2026-09-12-stem-fixes.brief.md', brief('/esq:check on other', '## 🟢 Fix now (safe)\n- g — `a.js:1` — fix: f — verify: v\n'));
  commit(root, 'briefs');
  const findings = (await branchCheck(root, file)).unit.findings;
  assert.deepEqual(findings.map((entry) => entry.file).sort(), ['docs/plans/2026-09-10-stem-fixes-fixes-2.brief.md', 'docs/plans/2026-09-10-stem-fixes.brief.md']);
  const yellow = findings.find((entry) => entry.source === 'check');
  assert.deepEqual([yellow.green, yellow.yellow, yellow.red], [0, 1, 0]);
  assert.equal(findings.find((entry) => entry.source === 'review').red, 1);
});

// ── Already landed ───────────────────────────────────────────────────────────

test('a landed unit reads landed from its destination, before the mismatch refusal can mask it', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const file = await unitPlan(root, 'p.md');
  await write(root, 'src/app.js', 'export const one = 5;\n');
  commit(root, 'feat(app): the work');
  const inFlight = await branchCheck(root, file);
  assert.equal(inFlight.verdict, 'ok');
  assert.equal(inFlight.landed, false);

  git(root, 'switch', '-q', 'main');
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge: esq/stem into main', 'esq/stem');
  const onDestination = await branchCheck(root, file);
  // Refusal behavior is unchanged — the verdict is still mismatch and still refuses — and the landed
  // fact rides beside it for the consumer that must ask it first.
  assert.equal(onDestination.verdict, 'mismatch');
  assert.equal(onDestination.refuse, true);
  assert.equal(onDestination.landed, true);
  // Back on the source branch the answer is the same fact.
  git(root, 'switch', '-q', 'esq/stem');
  assert.equal((await branchCheck(root, file)).landed, true);

  // Landed by content: every commit cherry-picked onto the destination.
  const picked = await repo();
  git(picked, 'switch', '-q', '-c', 'esq/stem');
  const pickedFile = await unitPlan(picked, 'p.md');
  const work = commit(picked, 'feat: plan and work');
  git(picked, 'switch', '-q', 'main');
  // The destination moved on first, so the pick is a new commit carrying the same patch.
  await write(picked, 'README.md', 'main moved\n');
  commit(picked, 'docs: main moves');
  git(picked, 'cherry-pick', work);
  assert.equal((await branchCheck(picked, path.join(picked, 'docs/plans/p.md'))).landed, 'equivalent');
  assert.ok(pickedFile);

  // A deleted branch is asked through its plan file: the commit that last changed it is on the origin,
  // so the unit landed. A legacy plan with no origin never lands at all.
  git(root, 'switch', '-q', 'main');
  git(root, 'branch', '-q', '-D', 'esq/stem');
  assert.equal((await branchCheck(root, file)).landed, true);
  const legacy = await repo();
  await write(legacy, 'docs/plans/l.md', '# L\n\n**Branch:** main\n\n## Phases\n\n### Phase 1 — one\n- task\n');
  assert.equal((await branchCheck(legacy, path.join(legacy, 'docs/plans/l.md'))).landed, null);
});

test('esq state carries the landing facts of a complete plan, and nothing for an unfinished one', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const file = await unitPlan(root, 'p.md');
  commit(root, 'plan: p');
  assert.equal((await state(root)).landing, null);

  const at = git(root, 'rev-parse', 'HEAD');
  await appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: [at.slice(0, 7)], whatBuilt: 'a thing', verification: ['ok'], verified: { at, commands: ['pnpm test'] } }));
  await backlog(root, [['B-401', '✨ improvement', 'manual · Planned by p', 'Planned']]);
  commit(root, 'plan(p): log phase 1 execution');
  const snapshot = await state(root);
  assert.equal(snapshot.landing.file, 'docs/plans/p.md');
  assert.equal(snapshot.landing.branch, 'esq/stem');
  assert.equal(snapshot.landing.origin, 'main');
  assert.equal(snapshot.landing.landed, false);
  assert.equal(snapshot.landing.coverage.verdict, 'unproven');
  assert.deepEqual(snapshot.landing.unit.promised.map((row) => row.id), ['B-401']);
});

// ── The whole unit ───────────────────────────────────────────────────────────
// `esq merge land` merges the branch, not a plan, so every fact a landing reads is asked of every plan
// recording that `**Branch:**`: one initial plan and two corrective plans, landed through any of them.

async function logged(root, file, phase, commands, at = git(root, 'rev-parse', 'HEAD')) {
  await appendLog(file, JSON.stringify({ phase, status: 'completed', commits: [at.slice(0, 7)], whatBuilt: 'a thing', verification: commands.map((command) => `(auto) ${command} — pass`), verified: { at, commands } }));
  return commit(root, `plan: log phase ${phase} of ${path.basename(file)}`);
}

async function threePlanUnit() {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const stem = await unitPlan(root, '2026-09-10-stem.md', { steps: ['`(auto)` `pnpm test` — the suite is green', '`(auto)` `./scripts/audit.sh` — the audit passes'] });
  commit(root, 'plan: stem');
  await logged(root, stem, 1, ['pnpm test', './scripts/audit.sh']);
  // A fix commit after the initial plan proved everything: its tests are no longer proved by anyone.
  await write(root, 'src/app.js', 'export const one = 2;\n');
  const fixed = commit(root, 'fix(app): the review finding');
  const fixes = await unitPlan(root, '2026-09-11-stem-fixes.md', { steps: ['`(auto)` `node --test tests/app.test.mjs` — 3 pass', '`(auto)` `./scripts/audit.sh` — the audit passes on the fixed tree'] });
  const again = await unitPlan(root, '2026-09-11-stem-fixes-fixes.md', { steps: ['`(auto)` `./scripts/audit.sh` — the audit passes, final', '`(auto)` `pnpm build` and `pnpm lint` — both clean'] });
  commit(root, 'plan: stem-fixes and stem-fixes-fixes');
  // The newer plan records the older proof: newest *proof* wins, whatever the plan's position.
  await logged(root, again, 1, ['./scripts/audit.sh'], fixed);
  await logged(root, fixes, 1, ['node --test tests/app.test.mjs', './scripts/audit.sh']);
  return { root, plans: [stem, fixes, again] };
}

test('landing through any unit plan verifies the union of every unit plan, deduplicated across plans', async () => {
  const { root, plans } = await threePlanUnit();
  const reports = [];
  for (const plan of plans) reports.push(await gateVerify(root, plan, { unit: true }));
  const shape = ({ head, commands, unresolved, unit }) => ({ head, commands, unresolved, unit });
  assert.deepEqual(shape(reports[1]), shape(reports[0]));
  assert.deepEqual(shape(reports[2]), shape(reports[0]));

  const [report] = reports;
  assert.deepEqual(report.unit, { branch: 'esq/stem', plans: ['docs/plans/2026-09-10-stem.md', 'docs/plans/2026-09-11-stem-fixes.md', 'docs/plans/2026-09-11-stem-fixes-fixes.md'], abandoned: [] });
  const byCommand = Object.fromEntries(report.commands.map((entry) => [entry.command, entry]));
  assert.deepEqual(Object.keys(byCommand).sort(), ['./scripts/audit.sh', 'node --test tests/app.test.mjs', 'pnpm test']);
  // The initial plan's test was staled by the fix commit, and only the initial plan names it.
  assert.equal(byCommand['pnpm test'].decision, 'run');
  assert.equal(byCommand['pnpm test'].plan, 'docs/plans/2026-09-10-stem.md');
  assert.match(byCommand['pnpm test'].reason, /src\/app\.js changed since docs\/plans\/2026-09-10-stem\.md Phase 1 verified/);
  assert.equal(byCommand['node --test tests/app.test.mjs'].decision, 'reuse');
  // One entry for three occurrences; the newest proof decides and its own criterion travels.
  const audit = byCommand['./scripts/audit.sh'];
  assert.equal(audit.decision, 'reuse');
  assert.equal(audit.plan, 'docs/plans/2026-09-11-stem-fixes.md');
  assert.equal(audit.step, '`(auto)` `./scripts/audit.sh` — the audit passes on the fixed tree');
  assert.deepEqual(audit.occurrences, [
    { plan: 'docs/plans/2026-09-10-stem.md', phase: 1 },
    { plan: 'docs/plans/2026-09-11-stem-fixes.md', phase: 1 },
    { plan: 'docs/plans/2026-09-11-stem-fixes-fixes.md', phase: 1 },
  ]);
  // The unresolvable step still runs in full, attributed to the plan that names it.
  assert.deepEqual(report.unresolved, [{ resolved: false, decision: 'run', plan: 'docs/plans/2026-09-11-stem-fixes-fixes.md', phase: 1, step: '`(auto)` `pnpm build` and `pnpm lint` — both clean' }]);

  // Without --unit the verb answers for the one plan, exactly as before — the defect the unit mode closes.
  const alone = await gateVerify(root, plans[2]);
  assert.deepEqual(alone.commands.map((entry) => entry.command), ['./scripts/audit.sh']);
  assert.equal(alone.unit, undefined);

  // Over the binary, flags on either side of the path.
  const cli = JSON.parse((await run(process.execPath, [bin, 'gate', 'verify', '--unit', plans[1]], { cwd: root })).stdout);
  assert.deepEqual(cli.commands, report.commands);
  const usage = await run(process.execPath, [bin, 'gate', 'verify', plans[1], '--units'], { cwd: root }).catch((error) => error);
  assert.equal(usage.code, 2);
});

test('coverage is the unit\'s: a review any unit plan recorded covers HEAD whichever plan is asked', async () => {
  const { root, plans } = await threePlanUnit();
  for (const plan of plans) assert.equal((await branchCheck(root, plan)).coverage.verdict, 'unproven');
  // The corrective plan's converge recorded the coverage; the initial plan records nothing.
  await setReviewed(root, plans[1], git(root, 'rev-parse', 'HEAD'));
  commit(root, 'plan(converged): stem-fixes');
  const answers = [];
  for (const plan of plans) answers.push((await branchCheck(root, plan)).coverage);
  assert.equal(answers[0].verdict, 'covered');
  assert.equal(answers[0].plan, 'docs/plans/2026-09-11-stem-fixes.md');
  assert.deepEqual(answers[1], answers[0]);
  assert.deepEqual(answers[2], answers[0]);

  // An older record that still covers never outranks the newest one: the newest commit decides.
  const early = git(root, 'rev-parse', 'HEAD~3');
  await setReviewed(root, plans[0], early);
  commit(root, 'plan(reviewed): stem, an older record');
  assert.equal((await branchCheck(root, plans[0])).coverage.plan, 'docs/plans/2026-09-11-stem-fixes.md');

  // A code change stales every record, and the newest one is named, with the same answer from every plan.
  await write(root, 'src/app.js', 'export const one = 3;\n');
  commit(root, 'fix(app): after the converge');
  const stale = [];
  for (const plan of plans) stale.push((await branchCheck(root, plan)).coverage);
  assert.equal(stale[0].verdict, 'stale');
  assert.equal(stale[0].plan, 'docs/plans/2026-09-11-stem-fixes.md');
  assert.deepEqual(stale[1], stale[0]);
  assert.deepEqual(stale[2], stale[0]);
});

// ── Whether the unit is finished ─────────────────────────────────────────────

test('unit.incomplete is every unfinished plan of the unit, the same from any member, and the gate is never needed to see it', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const stem = await unitPlan(root, '2026-09-10-stem.md');
  commit(root, 'plan: stem');
  await logged(root, stem, 1, ['pnpm test']);
  const fixes = await unitPlan(root, '2026-09-11-stem-fixes.md', { steps: ['`(auto)` `node --test tests/app.test.mjs` — 3 pass'] });
  commit(root, 'plan: stem-fixes');

  const fromStem = await branchCheck(root, stem);
  const fromFixes = await branchCheck(root, fixes);
  assert.deepEqual(fromStem.unit.incomplete, [{ plan: 'docs/plans/2026-09-11-stem-fixes.md', state: 'ready', phase: 1 }]);
  assert.deepEqual(fromStem.unit.abandoned, []);
  assert.deepEqual(fromFixes.unit.incomplete, fromStem.unit.incomplete);
  // The existing keys read exactly what they read before.
  assert.equal(fromStem.verdict, 'ok');
  assert.deepEqual(fromStem.unit.open, []);

  // Every unfinished shape is named with its state: paused, phase-less, unparseable — oldest first.
  await appendLog(fixes, JSON.stringify({ phase: 1, status: 'paused', commits: ['abc1234'], whatBuilt: 'half', verification: ['ok'], verified: { at: 'a'.repeat(40), commands: ['node --test tests/app.test.mjs'] }, manualOutstanding: ['[on /] look → expect: it renders'] }));
  await write(root, 'docs/plans/2026-09-12-stem-fixes-fixes.md', '# empty\n\n**Branch:** esq/stem\n\n**Origin:** main\n\n## Context\n');
  await write(root, 'docs/plans/2026-09-13-broken.md', '# broken\n\n**Branch:** esq/stem\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n\n## Execution log\n### Phase 1 — completed 2026-09-13\n### Phase 1 — completed 2026-09-13\n');
  commit(root, 'more plans');
  assert.deepEqual((await branchCheck(root, stem)).unit.incomplete, [
    { plan: 'docs/plans/2026-09-11-stem-fixes.md', state: 'paused', phase: 1 },
    { plan: 'docs/plans/2026-09-12-stem-fixes-fixes.md', state: 'no-phases', phase: null },
    { plan: 'docs/plans/2026-09-13-broken.md', state: 'invalid', phase: null },
  ]);
});

test('an abandoned plan leaves unit.incomplete and its unbuilt phases leave the unit gate, and nothing it promised is retracted', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const stem = await unitPlan(root, '2026-09-10-stem.md');
  commit(root, 'plan: stem');
  await logged(root, stem, 1, ['pnpm test']);
  const fixes = path.join(root, 'docs/plans/2026-09-11-stem-fixes.md');
  await write(root, 'docs/plans/2026-09-11-stem-fixes.md', '# fixes\n\n**Branch:** esq/stem\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- **Verification:**\n  - `(auto)` `pnpm lint` — clean\n\n### Phase 2 — two\n- **Verification:**\n  - `(auto)` `pnpm e2e` — green\n\n## Execution log\n<!-- Appended by /esq:build -->\n');
  await backlog(root, [['B-501', '✨ improvement', 'manual · Planned by stem-fixes', 'Planned']]);
  commit(root, 'plan: stem-fixes');
  await logged(root, fixes, 1, ['pnpm lint']);
  assert.deepEqual((await gateVerify(root, stem, { unit: true })).commands.map((entry) => entry.command).sort(), ['pnpm e2e', 'pnpm lint', 'pnpm test']);

  const recorded = await setAbandoned(root, fixes, 'phase 2 is superseded');
  commit(root, 'plan(abandoned): stem-fixes');
  for (const plan of [stem, fixes]) {
    const verdict = await branchCheck(root, plan);
    assert.deepEqual(verdict.unit.incomplete, []);
    assert.deepEqual(verdict.unit.abandoned, [{ plan: 'docs/plans/2026-09-11-stem-fixes.md', date: recorded.abandoned.date, reason: 'phase 2 is superseded' }]);
    // Abandonment retracts unbuilt phases, never a promise.
    assert.deepEqual(verdict.unit.promised.map((row) => row.id), ['B-501']);
  }

  // The unit gate drops the unbuilt phase's step and keeps the completed one's, from either member.
  const union = await gateVerify(root, stem, { unit: true });
  assert.deepEqual(union.commands.map((entry) => entry.command).sort(), ['pnpm lint', 'pnpm test']);
  assert.deepEqual(union.unit.abandoned, ['docs/plans/2026-09-11-stem-fixes.md']);
  assert.deepEqual((await gateVerify(root, fixes, { unit: true })).commands, union.commands);
  // Without --unit the verb answers exactly what it answered before: every step of the one plan.
  const alone = await gateVerify(root, fixes);
  assert.deepEqual(alone.commands.map((entry) => entry.command), ['pnpm lint', 'pnpm e2e']);
  assert.equal(alone.unit, undefined);

  // A malformed marker is not abandonment: the plan is back in unit.incomplete.
  const text = await readFile(fixes, 'utf8');
  await writeFile(fixes, text.replace(/\*\*Abandoned:\*\* .*/, '**Abandoned:** superseded'));
  commit(root, 'plan: a hand-mangled marker');
  const mangled = await branchCheck(root, stem);
  assert.deepEqual(mangled.unit.incomplete, [{ plan: 'docs/plans/2026-09-11-stem-fixes.md', state: 'ready', phase: 2 }]);
  assert.deepEqual(mangled.unit.abandoned, []);
});

test('esq state settles past an abandoned newest plan and carries unit completeness in its landing facts', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const stem = await unitPlan(root, '2026-09-10-stem.md');
  commit(root, 'plan: stem');
  await logged(root, stem, 1, ['pnpm test']);
  const fixes = await unitPlan(root, '2026-09-11-stem-fixes.md');
  commit(root, 'plan: stem-fixes');
  // The newest plan is unfinished, so nothing settles on a complete plan yet.
  assert.equal((await state(root)).landing, null);

  await setAbandoned(root, fixes, 'not needed');
  commit(root, 'plan(abandoned): stem-fixes');
  const snapshot = await state(root);
  const entry = snapshot.plans.find((plan) => plan.file === 'docs/plans/2026-09-11-stem-fixes.md');
  assert.deepEqual(entry.abandoned, { date: today(), reason: 'not needed' });
  assert.equal(entry.state, 'ready');
  assert.equal('abandoned' in snapshot.plans.find((plan) => plan.file === 'docs/plans/2026-09-10-stem.md'), false);
  assert.equal(snapshot.landing.file, 'docs/plans/2026-09-10-stem.md');
  assert.deepEqual(snapshot.landing.unit.incomplete, []);
  assert.deepEqual(snapshot.landing.unit.abandoned.map((row) => row.plan), ['docs/plans/2026-09-11-stem-fixes.md']);

  // A complete plan whose sibling is unfinished still settles, and its landing facts say the unit is not finished.
  const other = await repo();
  git(other, 'switch', '-q', '-c', 'esq/stem');
  await unitPlan(other, '2026-09-11-stem-fixes.md');
  commit(other, 'plan: stem-fixes');
  const done = await unitPlan(other, '2026-09-12-stem.md');
  commit(other, 'plan: stem');
  await logged(other, done, 1, ['pnpm test']);
  const blocked = await state(other);
  assert.equal(blocked.landing.file, 'docs/plans/2026-09-12-stem.md');
  assert.deepEqual(blocked.landing.unit.incomplete, [{ plan: 'docs/plans/2026-09-11-stem-fixes.md', state: 'ready', phase: 1 }]);
});

test('a commit made while verification ran refuses the merge, and an unmoved HEAD lands', async () => {
  const setup = async () => {
    const root = await repo();
    git(root, 'switch', '-q', '-c', 'esq/stem');
    const file = await unitPlan(root, 'p.md');
    await write(root, 'src/app.js', 'export const one = 7;\n');
    commit(root, 'feat(app): the work');
    return { root, file, head: (await gateVerify(root, file, { unit: true })).head };
  };
  // The chain /esq:land writes: the assertion and the merge in one call, so nothing sits between them.
  const chain = (root, file, head) => run('sh', ['-c', `"${process.execPath}" "${bin}" branch check "${file}" --at ${head} && "${process.execPath}" "${bin}" merge land --plan "${file}"`], { cwd: root });

  const moved = await setup();
  const mainBefore = git(moved.root, 'rev-parse', 'main');
  assert.equal((await branchCheck(moved.root, moved.file, { at: moved.head })).verdict, 'ok');
  assert.equal((await branchCheck(moved.root, moved.file)).head, moved.head);
  await write(moved.root, 'src/app.js', 'export const one = 8;\n');
  commit(moved.root, 'feat(app): committed while the suite ran');
  const refused = await chain(moved.root, moved.file, moved.head).catch((error) => error);
  assert.equal(refused.code, 1);
  const verdict = JSON.parse(refused.stdout);
  assert.equal(verdict.verdict, 'moved');
  assert.equal(verdict.refuse, true);
  assert.match(verdict.reason, /HEAD is [0-9a-f]{7} and esq\/stem is [0-9a-f]{7}, not/);
  // A no-op: nothing merged, nothing switched.
  assert.equal(git(moved.root, 'rev-parse', 'main'), mainBefore);
  assert.equal(git(moved.root, 'branch', '--show-current'), 'esq/stem');

  // An existing refusal keeps its own verdict under --at: a switch away is still a mismatch.
  git(moved.root, 'switch', '-q', '-c', 'elsewhere');
  assert.equal((await branchCheck(moved.root, moved.file, { at: moved.head })).verdict, 'mismatch');
  await assert.rejects(branchCheck(moved.root, moved.file, { at: moved.head.slice(0, 7) }), /full 40-character/);
  const usage = await run(process.execPath, [bin, 'branch', 'check', moved.file, '--at'], { cwd: moved.root }).catch((error) => error);
  assert.equal(usage.code, 2);

  const still = await setup();
  const landed = await chain(still.root, still.file, still.head);
  assert.equal(JSON.parse(landed.stdout.slice(landed.stdout.indexOf('}\n{') + 2)).landed, true);
});

test('a unit whose branch was deleted after landing reads landed, and status has nothing to recommend', async () => {
  const root = await repo();
  git(root, 'switch', '-q', '-c', 'esq/stem');
  const file = await unitPlan(root, 'p.md');
  commit(root, 'plan: p');
  const at = git(root, 'rev-parse', 'HEAD');
  await appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: [at.slice(0, 7)], whatBuilt: 'a thing', verification: ['ok'], verified: { at, commands: ['pnpm test'] } }));
  commit(root, 'plan(p): log phase 1 execution');
  await setReviewed(root, file, git(root, 'rev-parse', 'HEAD'));
  commit(root, 'plan(converged): p');
  git(root, 'switch', '-q', 'main');
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge: esq/stem into main', 'esq/stem');
  git(root, 'branch', '-q', '-d', 'esq/stem');

  const verdict = await branchCheck(root, file);
  assert.equal(verdict.landed, true);
  assert.equal(verdict.coverage.verdict, 'covered');
  // /esq:status routes rule 4 off `landing.landed` first, so a covered unit is no longer sent to land.
  const snapshot = await state(root);
  assert.equal(snapshot.landing.landed, true);

  // A branch deleted without landing proves nothing: the plan's last change is not on the origin.
  const abandoned = await repo();
  git(abandoned, 'switch', '-q', '-c', 'esq/stem');
  const other = await unitPlan(abandoned, 'p.md');
  commit(abandoned, 'plan: p');
  git(abandoned, 'switch', '-q', '--detach', 'esq/stem');
  git(abandoned, 'branch', '-q', '-D', 'esq/stem');
  assert.equal((await branchCheck(abandoned, other)).landed, null);
});
