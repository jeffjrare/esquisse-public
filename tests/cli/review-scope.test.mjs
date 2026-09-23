import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { reviewScope, setReviewed } from '../../plugin/lib/cli.mjs';

// Real git, in throwaway repositories: what this verb answers is a question about git's own history —
// which commits a review read, whether a stamp survived a rebase, what a range actually changed — and
// a stub would prove only that the stub agrees with itself. No network, no remote, no model run.
//
// EVERY EXPECTED SCOPE IS STATED FROM THE FIXTURE'S OWN HISTORY. Each test keeps the hashes its
// commits returned and asserts against those, never against a second call to `reviewScope` — a test
// that computed its expectation the way the implementation does would pass on a wrong rule.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

async function repo() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-review-scope-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  await mkdir(path.join(root, 'src'), { recursive: true });
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 1;\n');
  await writeFile(path.join(root, 'docs/BACKLOG.md'), '# Backlog\n');
  await writeFile(path.join(root, 'docs/DECISIONS.md'), '# Decisions\n');
  commit(root, 'seed');
  return root;
}

// A plan file whose header records a branch and whose execution log carries one completed entry — the
// shape every consumer of this verb is pointed at. Committed as `plan: <slug>`, which is the fallback
// base the preflight has always named.
async function plan(root, slug) {
  const relative = `docs/plans/2026-09-14-${slug}.md`;
  const body = [
    `# ${slug}`,
    '',
    '**Branch:** esq/unit',
    '',
    '**Origin:** main',
    '',
    '## Phases',
    '',
    '### Phase 1 — do the thing',
    '- **Goal:** one sentence',
    '',
    '## Execution log',
    '<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->',
    '',
  ];
  await writeFile(path.join(root, relative), `${body.join('\n')}\n`);
  const at = commit(root, `plan: ${slug}`);
  await writeFile(path.join(root, relative), `${[...body,
    '### Phase 1 — completed 2026-09-14',
    '',
    `**Plan committed at:** ${at.slice(0, 7)}`,
    '',
    '**Commits:** none',
    '',
  ].join('\n')}\n`);
  return { relative, at };
}

// One corrective brief as `/esq:review` writes it, committed under the subject the candidate scan
// greps for. `source` is what the brief's `Source:` line names, so a test can hand it a sibling slug.
async function brief(root, slug, stamp, { source = slug, suffix = '-fixes', verb = 'review' } = {}) {
  const relative = `docs/plans/2026-09-14-${slug}${suffix}.brief.md`;
  await writeFile(path.join(root, relative), [
    `# Fixes brief: ${slug}`,
    '',
    `Source: /esq:${verb} on ${source}, 2026-09-14`,
    `Reviewed at: ${stamp}`,
    '',
    '## 🟢 Fix now (safe)',
    '- something — `src/app.js:1` — fix: do it — verify: run it',
    '',
  ].join('\n'));
  return { relative, at: commit(root, `brief(fixes): ${slug}`) };
}

// A clean review's record, exactly as `/esq:review` makes it: the field through `esq plan set-reviewed`
// and the commit under `plan(reviewed): <slug> at <short hash>`.
async function recordClean(root, relative, slug, at) {
  await setReviewed(root, relative, at);
  return commit(root, `plan(reviewed): ${slug} at ${at.slice(0, 7)}`);
}

const subjects = (scope) => scope.commits.map((entry) => entry.subject);
const paths = (scope) => scope.paths.map((entry) => entry.path);
const candidate = (scope, source) => scope.candidates.find((entry) => entry.source === source);

// ── The initial review ───────────────────────────────────────────────────────

test('with no review baseline the scope is the whole unit from the plan commit, metadata commits filtered out', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  commit(root, 'feat(app): change one');
  await writeFile(path.join(root, 'docs/BACKLOG.md'), '# Backlog\n\n| B-001 |\n');
  commit(root, 'backlog: file a row');
  await writeFile(path.join(root, 'src/other.js'), 'export const two = 2;\n');
  const last = commit(root, 'docs(build): say it once');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.provenance, 'plan-commit');
  assert.equal(scope.base, at);
  assert.equal(scope.head, last);
  assert.equal(scope.slug, 'widget');
  // The two implementation commits, and neither of the metadata ones. `docs(build):` is implementation;
  // `backlog:` and the `plan:` commit itself are not.
  assert.deepEqual(subjects(scope), ['docs(build): say it once', 'feat(app): change one']);
  assert.equal(scope.excluded, 1);
  assert.equal(scope.bookkeepingOnly, false);
  // The plan file and both ledgers are excluded from the paths; the code is not.
  assert.deepEqual(paths(scope).sort(), ['src/app.js', 'src/other.js']);
  assert.equal(scope.diff, `git diff ${at} ${last} -- . ':!docs/plans' ':!docs/BACKLOG.md' ':!docs/DECISIONS.md'`);
  await rm(root, { recursive: true, force: true });
});

test('the execution log-s own **Plan committed at:** is the base when it resolves, before any history search', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  commit(root, 'feat(app): change one');
  // The `plan:` commit is still reachable, so this proves the log is consulted rather than the grep:
  // the log records that same commit, and the reason names the log.
  const scope = await reviewScope(root, relative);
  assert.equal(scope.base, at);
  assert.match(scope.reason, /\*\*Plan committed at:\*\*/);
  await rm(root, { recursive: true, force: true });
});

// ── The re-review, and what it may narrow to ─────────────────────────────────

test('a now-deleted corrective brief still supplies its historical Reviewed at stamp', async () => {
  const root = await repo();
  const { relative } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const reviewed = commit(root, 'feat(app): the implementation the review read');
  const written = await brief(root, 'widget', reviewed.slice(0, 7));
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'fix(app): apply the green');
  // /esq:fix clears the brief by deleting it. Nothing on disk names the stamp any more.
  await rm(path.join(root, written.relative));
  const cleared = commit(root, 'brief(fixes): clear widget, all fixes applied');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'delta');
  assert.equal(scope.provenance, 'review-brief');
  assert.equal(scope.base, reviewed);
  assert.equal(scope.head, cleared);
  // The fix commit is what the re-review reads, and the brief's own two commits are not.
  assert.deepEqual(subjects(scope), ['fix(app): apply the green']);
  assert.equal(scope.bookkeepingOnly, false);
  assert.deepEqual(paths(scope), ['src/app.js']);
  await rm(root, { recursive: true, force: true });
});

test('a newer clean review record wins over an older review brief stamp', async () => {
  const root = await repo();
  const { relative } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const firstReview = commit(root, 'feat(app): the first implementation');
  await brief(root, 'widget', firstReview.slice(0, 7));
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  const fix = commit(root, 'fix(app): apply the green');
  await recordClean(root, relative, 'widget', fix);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 4;\n');
  const after = commit(root, 'fix(app): one more, after the clean review');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'delta');
  assert.equal(scope.provenance, 'clean-review');
  assert.equal(scope.base, fix);
  assert.equal(candidate(scope, 'review-brief').commit, firstReview);
  assert.equal(candidate(scope, 'review-brief').kept, true);
  assert.deepEqual(subjects(scope), ['fix(app): one more, after the clean review']);
  assert.equal(scope.head, after);
  await rm(root, { recursive: true, force: true });
});

test('an older clean review record loses to a newer review brief stamp', async () => {
  const root = await repo();
  const { relative } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const firstReview = commit(root, 'feat(app): the first implementation');
  await recordClean(root, relative, 'widget', firstReview);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  const second = commit(root, 'fix(app): a later change');
  await brief(root, 'widget', second.slice(0, 7));
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 4;\n');
  commit(root, 'fix(app): after the second review');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.provenance, 'review-brief');
  assert.equal(scope.base, second);
  assert.deepEqual(subjects(scope), ['fix(app): after the second review']);
  await rm(root, { recursive: true, force: true });
});

test('a plan(converged) record never becomes a base, so fix code no review read stays in scope', async () => {
  const root = await repo();
  const { relative } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const reviewed = commit(root, 'feat(app): the implementation the review read');
  await recordClean(root, relative, 'widget', reviewed);
  // The converge loop then applies two fixes nobody reviewed and records coverage over them, under
  // its own subject.
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'fix(app): the first unreviewed fix');
  await writeFile(path.join(root, 'src/other.js'), 'export const two = 2;\n');
  const lastFix = commit(root, 'fix(app): the second unreviewed fix');
  await setReviewed(root, relative, lastFix);
  const converged = commit(root, `plan(converged): widget at ${lastFix.slice(0, 7)}`);

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'delta');
  assert.equal(scope.provenance, 'clean-review');
  // The base is the review's own commit, not the converge record's, so both fixes are still read.
  assert.equal(scope.base, reviewed);
  assert.notEqual(scope.base, lastFix);
  assert.deepEqual(subjects(scope).sort(), ['fix(app): the first unreviewed fix', 'fix(app): the second unreviewed fix']);
  assert.deepEqual(paths(scope).sort(), ['src/app.js', 'src/other.js']);
  assert.equal(scope.head, converged);
  // And no candidate was sourced from the converge commit at all.
  assert.equal(scope.candidates.length, 2);
  await rm(root, { recursive: true, force: true });
});

// ── Plan identity ────────────────────────────────────────────────────────────

test('a sibling -fixes brief never answers for the plan it corrects', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const other = commit(root, 'feat(app): change one');
  // A brief correcting `widget-fixes` — its `Source:` names that plan, so the comma ends the slug and
  // the hit is dropped however well its commit subject greps.
  await brief(root, 'widget-fixes', other.slice(0, 7), { source: 'widget-fixes' });
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  const last = commit(root, 'chore: a later commit');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.equal(candidate(scope, 'review-brief').kept, false);
  assert.match(candidate(scope, 'review-brief').reason, /Source:/);
  assert.equal(scope.head, last);
  await rm(root, { recursive: true, force: true });
});

test('a check brief is not a review baseline, however exactly its Source names this plan', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const checked = commit(root, 'feat(app): change one');
  await brief(root, 'widget', checked.slice(0, 7), { verb: 'check' });
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'chore: a later commit');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.equal(candidate(scope, 'review-brief').kept, false);
  await rm(root, { recursive: true, force: true });
});

test('a sibling -fixes plan(reviewed) record never answers for the plan it corrects', async () => {
  const root = await repo();
  const sibling = await plan(root, 'widget-fixes');
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const other = commit(root, 'feat(app): change one');
  await recordClean(root, sibling.relative, 'widget-fixes', other);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  const last = commit(root, 'chore: a later commit');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.equal(candidate(scope, 'clean-review').kept, false);
  assert.equal(scope.head, last);
  // And the sibling, asked for itself, gets its own record.
  const siblingScope = await reviewScope(root, sibling.relative);
  assert.equal(siblingScope.mode, 'delta');
  assert.equal(siblingScope.base, other);
  await rm(root, { recursive: true, force: true });
});

test('a uniquified brief for an unrelated plan is not a baseline', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const other = commit(root, 'feat(app): change one');
  // `widgetry` greps as a `brief(fixes): widget…` substring; its `Source:` is what refuses it.
  await brief(root, 'widgetry', other.slice(0, 7), { source: 'widgetry', suffix: '-fixes-2' });
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'chore: a later commit');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.equal(candidate(scope, 'review-brief').kept, false);
  await rm(root, { recursive: true, force: true });
});

// A commit body is not a subject. `git log --grep` searches the whole message, and a candidate is a
// thing that narrows a review — so the identity these two pin is the subject line alone.

test('a commit body naming brief(fixes) under another subject supplies no baseline', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const reviewed = commit(root, 'feat(app): change one');
  // A real, exactly-sourced brief — committed under a subject that is not `brief(fixes): widget`.
  await writeFile(path.join(root, 'docs/plans/2026-09-14-widget-fixes.brief.md'), [
    '# Fixes brief: widget', '', 'Source: /esq:review on widget, 2026-09-14', `Reviewed at: ${reviewed.slice(0, 7)}`, '',
    '## 🟢 Fix now (safe)', '- something — `src/app.js:1` — fix: do it — verify: run it', '',
  ].join('\n'));
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'chore: tidy up', '-m', 'brief(fixes): widget was mentioned down here');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.equal(candidate(scope, 'review-brief').kept, false);
  await rm(root, { recursive: true, force: true });
});

test('a commit body naming plan(reviewed) under another subject supplies no baseline', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const reviewed = commit(root, 'feat(app): change one');
  // The field really is recorded, and the plan really is in this commit — only the subject is wrong.
  await setReviewed(root, relative, reviewed);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'chore: tidy up', '-m', `plan(reviewed): widget at ${reviewed.slice(0, 7)}`);

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.equal(candidate(scope, 'clean-review').kept, false);
  assert.match(candidate(scope, 'clean-review').reason, /whose subject is/);
  await rm(root, { recursive: true, force: true });
});

test('a commit body naming plan: <slug> under another subject is not the full-scope base', async () => {
  const root = await repo();
  // No execution log entry, so the base can only come from the `plan: <slug>` commit — and the commit
  // that carries the plan file has that text in its body, not its subject.
  const relative = 'docs/plans/2026-09-14-widget.md';
  await writeFile(path.join(root, relative), '# widget\n\n**Branch:** esq/unit\n\n## Phases\n\n## Execution log\n<!-- x -->\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'chore: add a plan', '-m', 'plan: widget');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'unresolved');
  assert.equal(scope.base, null);
  assert.equal(scope.paths, null);
  await rm(root, { recursive: true, force: true });
});

// ── Candidates git refuses ───────────────────────────────────────────────────

test('a stamp this repository does not hold is dropped and the scope widens', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  commit(root, 'feat(app): change one');
  await brief(root, 'widget', 'deadbee');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'chore: a later commit');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  const dropped = candidate(scope, 'review-brief');
  assert.equal(dropped.kept, false);
  assert.equal(dropped.at, 'deadbee');
  assert.match(dropped.reason, /not a commit in this repository/);
  await rm(root, { recursive: true, force: true });
});

test('a stamp that is no ancestor of the pinned HEAD is dropped and the scope widens', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  // A commit on a side branch: it resolves, and it is no ancestor of main.
  git(root, 'switch', '-q', '-c', 'side');
  await writeFile(path.join(root, 'src/side.js'), 'export const side = 1;\n');
  const orphan = commit(root, 'feat(side): abandoned');
  git(root, 'switch', '-q', 'main');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  commit(root, 'feat(app): change one');
  await brief(root, 'widget', orphan.slice(0, 7));
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'chore: a later commit');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.match(candidate(scope, 'review-brief').reason, /no ancestor of/);
  await rm(root, { recursive: true, force: true });
});

test('a brief that records no Reviewed at stamp is dropped without consulting an older brief', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const early = commit(root, 'feat(app): change one');
  await brief(root, 'widget', early.slice(0, 7));
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'fix(app): apply it');
  // A second round whose brief lost its stamp. The newest matching brief is the candidate, and its
  // failure does not fall back to the first round's usable one.
  await writeFile(path.join(root, 'docs/plans/2026-09-14-widget-fixes-2.brief.md'), [
    '# Fixes brief: widget', '', 'Source: /esq:review on widget, 2026-09-14', '',
    '## 🟢 Fix now (safe)', '- something — `src/app.js:1` — fix: do it — verify: run it', '',
  ].join('\n'));
  commit(root, 'brief(fixes): widget, round two');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'full');
  assert.equal(scope.base, at);
  assert.notEqual(scope.base, early);
  assert.match(candidate(scope, 'review-brief').reason, /records no `Reviewed at:` stamp/);
  await rm(root, { recursive: true, force: true });
});

// ── The bookkeeping-only delta ───────────────────────────────────────────────

test('a delta whose every commit is metadata reports no implementation commit, with the paths it still changed', async () => {
  const root = await repo();
  const { relative } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const reviewed = commit(root, 'feat(app): the implementation the review read');
  await recordClean(root, relative, 'widget', reviewed);
  // A spec and an architecture refresh: files a review never reads, under subjects the filter drops.
  await writeFile(path.join(root, 'docs/SPEC.md'), '# Spec\n');
  commit(root, 'spec: refresh 2026-09-14');
  await writeFile(path.join(root, 'CLAUDE.md'), '# Project\n');
  const last = commit(root, 'docs(arch): refresh 2026-09-14');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'delta');
  assert.equal(scope.base, reviewed);
  assert.deepEqual(scope.commits, []);
  assert.equal(scope.bookkeepingOnly, true);
  assert.equal(scope.excluded, 3);
  // The paths are still reported — the commit filter is what decides this, never the path list.
  assert.deepEqual(paths(scope).sort(), ['CLAUDE.md', 'docs/SPEC.md']);
  assert.equal(scope.head, last);
  await rm(root, { recursive: true, force: true });
});

// ── The user-requested full re-review ────────────────────────────────────────

test('--full takes the whole unit and resolves no candidate at all', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const reviewed = commit(root, 'feat(app): change one');
  await recordClean(root, relative, 'widget', reviewed);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'fix(app): apply the green');

  const delta = await reviewScope(root, relative);
  assert.equal(delta.mode, 'delta');
  assert.equal(delta.base, reviewed);

  const scope = await reviewScope(root, relative, { full: true });
  assert.equal(scope.mode, 'full');
  assert.equal(scope.provenance, 'requested-full');
  assert.equal(scope.base, at);
  assert.deepEqual(scope.candidates, []);
  assert.match(scope.reason, /full re-review was requested/);
  assert.deepEqual(subjects(scope).sort(), ['feat(app): change one', 'fix(app): apply the green']);
  await rm(root, { recursive: true, force: true });
});

// ── Paths: quoting, deletion, rename ─────────────────────────────────────────

test('a path with a space or a quote comes back as its own bytes, and a deletion keeps its status', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await mkdir(path.join(root, 'src/odd dir'), { recursive: true });
  await writeFile(path.join(root, 'src/odd dir/a "quoted" file.js'), 'export const odd = 1;\n');
  await rm(path.join(root, 'src/app.js'));
  const last = commit(root, 'feat(app): odd paths, and one deletion');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.base, at);
  const byPath = Object.fromEntries(scope.paths.map((entry) => [entry.path, entry.status]));
  assert.equal(byPath['src/odd dir/a "quoted" file.js'], 'A');
  assert.equal(byPath['src/app.js'], 'D');
  assert.equal(scope.head, last);
  await rm(root, { recursive: true, force: true });
});

test('a rename carries both paths, the old one under from', async () => {
  const root = await repo();
  const { relative } = await plan(root, 'widget');
  git(root, 'mv', 'src/app.js', 'src/renamed.js');
  commit(root, 'refactor(app): rename it');

  const scope = await reviewScope(root, relative);
  const moved = scope.paths.find((entry) => entry.path === 'src/renamed.js');
  assert.ok(moved, `expected src/renamed.js among ${JSON.stringify(paths(scope))}`);
  assert.match(moved.status, /^R/);
  assert.equal(moved.from, 'src/app.js');
  await rm(root, { recursive: true, force: true });
});

// ── Failures that must never look clean ──────────────────────────────────────

test('a plan whose own commit cannot be resolved is unresolved, never an empty diff', async () => {
  const root = await repo();
  // The plan file exists and is committed, but under no subject this can recognise and with no
  // execution log entry, so neither base source answers.
  const relative = 'docs/plans/2026-09-14-widget.md';
  await writeFile(path.join(root, relative), '# widget\n\n**Branch:** esq/unit\n\n## Phases\n\n## Execution log\n<!-- x -->\n');
  commit(root, 'chore: sneak the plan in');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'unresolved');
  assert.equal(scope.base, null);
  assert.equal(scope.paths, null);
  assert.equal(scope.commits, null);
  assert.equal(scope.diff, null);
  assert.equal(scope.bookkeepingOnly, null);
  assert.match(scope.reason, /review the whole change and say so/);
  await rm(root, { recursive: true, force: true });
});

test('outside a git repository the answer is unresolved, with paths null', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-review-scope-nogit-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const relative = 'docs/plans/2026-09-14-widget.md';
  await writeFile(path.join(root, relative), '# widget\n\n## Phases\n\n## Execution log\n<!-- x -->\n');

  const scope = await reviewScope(root, relative);
  assert.equal(scope.mode, 'unresolved');
  assert.equal(scope.head, null);
  assert.equal(scope.paths, null);
  assert.match(scope.reason, /git could not be read here/);
  await rm(root, { recursive: true, force: true });
});

test('an unresolved answer is never a delta, and a resolved one always carries a base its range can use', async () => {
  const root = await repo();
  const { relative, at } = await plan(root, 'widget');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  commit(root, 'feat(app): change one');
  for (const scope of [await reviewScope(root, relative), await reviewScope(root, relative, { full: true })]) {
    assert.notEqual(scope.mode, 'unresolved');
    assert.equal(scope.base, at);
    assert.ok(Array.isArray(scope.paths));
    assert.ok(scope.diff.startsWith(`git diff ${at} ${scope.head} -- `));
  }
  await rm(root, { recursive: true, force: true });
});

// ── The CLI surface ──────────────────────────────────────────────────────────

test('esq review scope refuses an unknown flag and a second path, and exits 0 on an answer', async () => {
  const root = await repo();
  const { relative } = await plan(root, 'widget');
  const esq = (...args) => execFileSync(process.execPath, [path.join(process.cwd(), 'plugin/bin/esq'), ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const answer = JSON.parse(esq('review', 'scope', relative));
  assert.equal(answer.slug, 'widget');
  assert.equal(answer.mode, 'full');
  for (const args of [['review', 'scope'], ['review', 'scope', relative, '--picky'], ['review', 'scope', relative, relative]]) {
    assert.throws(() => esq(...args), (error) => {
      assert.equal(error.status, 2);
      assert.match(String(error.stderr ?? ''), /usage: esq review scope/);
      return true;
    }, `expected a usage refusal for ${args.join(' ')}`);
  }
  await rm(root, { recursive: true, force: true });
});
