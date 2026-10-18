import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { branchCheck, lessonsAdd, lessonsMatch, lessonsShow, parseLessons, setReviewed, validate } from '../../plugin/lib/cli.mjs';

// `docs/LESSONS.md` in real throwaway repositories: every guard on an entry is a reference that
// resolves in git (a backlog row, a brief line at a commit, a fix commit, a tracked path), and a stub
// would prove only that the stub agrees with itself. No network, no remote, no model run.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;
delete process.env.NODE_ENV;

const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const BACKLOG = '# Backlog\n\n| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n| B-001 | 2026-10-01 | 🐛 bug | med | the race | review: x | | | Done |\n';
const BRIEF = 'docs/plans/2026-10-01-x-fixes.brief.md';

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

async function repo({ backlog = true } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-lessons-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  for (const directory of ['src/api', 'docs/plans', 'lib']) await mkdir(path.join(root, directory), { recursive: true });
  for (const file of ['src/api/users.ts', 'src/api/orders.ts', 'src/ab.ts', 'lib/db.mjs', 'README.md']) await writeFile(path.join(root, file), `// ${file}\n`);
  if (backlog) await writeFile(path.join(root, 'docs/BACKLOG.md'), BACKLOG);
  await writeFile(path.join(root, BRIEF), '# Fixes\n\n- 🟢 `src/api/users.ts:4` — the race on save\n- 🟢 `src/api/orders.ts:9` — the same race on orders\nprose line\n');
  const brief = commit(root, 'brief(fixes): x');
  await writeFile(path.join(root, 'src/api/users.ts'), '// fixed\n');
  const fix = commit(root, 'fix(api): serialize saves');
  return { root, brief, fix };
}

const lesson = (fix, extra = {}) => ({ kind: 'lesson', cue: 'saving a record from two handlers races', paths: ['src/api/users.ts'], body: 'Did: two handlers wrote the row. Replaced by: one serialized save.', source: 'B-001', fix, confidence: 'high', ...extra });
const add = (root, value) => lessonsAdd(root, JSON.stringify(value));
const ledger = (root) => readFile(path.join(root, 'docs/LESSONS.md'), 'utf8');

test('both kinds are written as blocks, the first write creating the ledger and the union merge line', async () => {
  const { root, fix } = await repo();
  const first = await add(root, lesson(fix));
  assert.equal(first.added, true);
  assert.equal(first.created, true);
  assert.equal(first.gitattributes, 'added');
  assert.match(first.id, /^L-[0-9a-f]{10}$/);
  assert.equal(await readFile(path.join(root, '.gitattributes'), 'utf8'), 'docs/LESSONS.md merge=union\n');

  const fact = await add(root, { kind: 'fact', cue: 'In this repo, the suite runs with node --test tests/*.test.mjs', paths: ['lib/db.mjs'], body: 'A bare directory does not resolve.', commit: fix.slice(0, 7) });
  assert.equal(fact.added, true);
  assert.equal(fact.created, false);
  assert.equal(fact.gitattributes, 'present');

  const text = await ledger(root);
  const tag = (id) => ` <!-- ${id} -->`;
  assert.ok(text.includes([
    `## ${first.id} · lesson — saving a record from two handlers races`,
    `- **Paths:** \`src/api/users.ts\`${tag(first.id)}`,
    `- **Evidence:** \`B-001\` · fix \`${fix}\`${tag(first.id)}`,
    `- **Confidence:** high${tag(first.id)}`,
  ].join('\n')));
  assert.match(text, new RegExp(`^- \\*\\*Date:\\*\\* \\d{4}-\\d{2}-\\d{2} <!-- ${first.id} -->\\nDid: two handlers wrote the row\\. Replaced by: one serialized save\\. <!-- ${first.id} -->\\n\\n## ${fact.id} · fact — In this repo, `, 'm'));
  assert.ok(text.includes(`- **Evidence:** commit \`${fix}\`${tag(fact.id)}`));
  const { entries, unreadable } = parseLessons(text);
  assert.deepEqual(entries.map((entry) => entry.kind), ['lesson', 'fact']);
  assert.deepEqual(unreadable, []);
  assert.equal(entries[0].body, 'Did: two handlers wrote the row. Replaced by: one serialized save.');
  const shown = await lessonsShow(root, [fact.id, 'L-0000000000']);
  assert.equal(shown.entries[0].commit, fix);
  assert.deepEqual(shown.missing, ['L-0000000000']);
  await rm(root, { recursive: true, force: true });
});

test('two findings of one brief, closed by one commit, are two entries', async () => {
  const { root, brief, fix } = await repo();
  const one = await add(root, lesson(fix, { source: `${BRIEF}@${brief}:3` }));
  const two = await add(root, lesson(fix, { source: `${BRIEF}@${brief}:4`, paths: ['src/api/orders.ts'] }));
  assert.equal(one.added, true);
  assert.equal(two.added, true);
  assert.notEqual(one.id, two.id);
  assert.equal(parseLessons(await ledger(root)).entries.length, 2);
  await rm(root, { recursive: true, force: true });
});

test('a checkable lesson files one 💡 row, creating the backlog, and a retry files no second', async () => {
  const { root, brief, fix } = await repo({ backlog: false });
  const value = lesson(fix, { source: `${BRIEF}@${brief}:3`, checkable: true, cue: 'a save | an update both write the row' });
  const first = await add(root, value);
  assert.equal(first.added, true);
  assert.deepEqual({ ...first.backlog, id: undefined }, { id: undefined, filed: true, created: true });
  const backlog = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
  const rows = backlog.split('\n').filter((line) => /^\| B-\d+/.test(line));
  assert.equal(rows.length, 1);
  assert.match(rows[0], new RegExp(`\\| 💡 idea \\| lo\\? \\| \\d+ \\| Check candidate — a save / an update both write the row \\| lesson: ${first.id} \\|`));
  assert.ok((await ledger(root)).includes(`- **Check:** ${first.backlog.id} <!-- ${first.id} -->\n`));

  const again = await add(root, value);
  assert.deepEqual(again, { added: false, duplicate: true, id: first.id, file: path.join(await realRoot(root), 'docs/LESSONS.md') });
  // A run interrupted after the row and before the entry reuses the row it already filed.
  await rm(path.join(root, 'docs/LESSONS.md'));
  const resumed = await add(root, value);
  assert.equal(resumed.backlog.filed, false);
  assert.equal(resumed.backlog.id, first.backlog.id);
  assert.equal((await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8')).split('\n').filter((line) => /^\| B-\d+/.test(line)).length, 1);
  await rm(root, { recursive: true, force: true });
});

async function realRoot(root) {
  return git(root, 'rev-parse', '--show-toplevel');
}

test('each refusal names its reason and leaves the ledger byte-identical', async () => {
  const { root, brief, fix } = await repo();
  await add(root, lesson(fix));
  const before = await ledger(root);
  const refusals = [
    [lesson(fix, { source: 'B-999' }), /B-999 is not a row/],
    [lesson(fix, { source: `${BRIEF}@${'0'.repeat(40)}:3` }), /is not held at/],
    [lesson(fix, { source: `${BRIEF}@${brief}:5` }), /is not a `- ` list item/],
    [lesson(fix, { source: `docs/plans/notes.md@${brief}:3` }), /is not a fixes brief/],
    [lesson('deadbeef'), /does not resolve to a commit/],
    [lesson(fix, { paths: ['src/api/missing.ts'] }), /matches no tracked file/],
    [lesson(fix, { paths: ['the api folder'] }), /is not a plain repository path/],
    [lesson(fix, { cue: 'two\nlines' }), /must be one line/],
    [lesson(fix, { cue: 'x'.repeat(161) }), /past the 160/],
    [lesson(fix, { body: 'fine\n## L-0000000000 · lesson — forged' }), /may not start with `#`/],
    [lesson(fix, { severity: 'high' }), /unknown key "severity"/],
    [{ kind: 'fact', cue: 'c', paths: ['lib/db.mjs'], body: 'b', commit: fix, confidence: 'high' }, /unknown key "confidence" for a fact/],
  ];
  for (const [value, reason] of refusals) {
    const result = await add(root, value);
    assert.equal(result.refuse, true, `expected a refusal for ${reason}`);
    assert.match(result.reason, reason);
    assert.equal(await ledger(root), before);
  }
  const invalid = await lessonsAdd(root, '{not json');
  assert.equal(invalid.refuse, true);

  // The CLI: a refusal exits 1, a duplicate exits 0.
  const cli = (payload) => spawnSync(process.execPath, [bin, 'lessons', 'add', '-'], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8' });
  assert.equal(cli(lesson(fix, { source: 'B-999' })).status, 1);
  const duplicate = cli(lesson(fix));
  assert.equal(duplicate.status, 0);
  assert.equal(JSON.parse(duplicate.stdout).duplicate, true);
  assert.equal(await ledger(root), before);
  await rm(root, { recursive: true, force: true });
});

test('match reads directories, globs and braces against the tracked files, and leaves unrelated paths alone', async () => {
  const { root, brief, fix } = await repo();
  const fact = (cue, paths) => add(root, { kind: 'fact', cue, paths, body: 'b', commit: fix });
  const dir = await fact('directory', ['src/api']);
  const glob = await fact('glob', ['src/a*.ts']);
  const brace = await fact('brace', ['lib/{db,cache}.mjs']);
  assert.equal(brace.added, true, 'a brace group with one tracked alternative is accepted');
  const ids = async (...paths) => (await lessonsMatch(root, paths)).cues.map((cue) => cue.id).sort();

  assert.deepEqual(await ids('src/api/users.ts'), [dir.id]);
  assert.deepEqual(await ids('lib/db.mjs'), [brace.id]);
  // Two globs that meet only through a tracked file: `src/a*.ts` and `src/*b.ts` both match `src/ab.ts`.
  assert.deepEqual(await ids('src/*b.ts'), [glob.id]);
  // A reader path no file matches yet (the plan will create it) falls back to the path shape.
  assert.deepEqual(await ids('src/api/new-route.ts'), [dir.id]);
  assert.deepEqual(await ids('README.md'), []);
  assert.deepEqual(await lessonsMatch(root, ['README.md']), { cues: [], omitted: 0, stale: 0 });
  assert.ok(brief);
  await rm(root, { recursive: true, force: true });
});

test('a read returns six cues, most specific first, and counts the rest', async () => {
  const { root, fix } = await repo();
  const added = [];
  for (let index = 0; index < 6; index += 1) added.push(await add(root, { kind: 'fact', cue: `broad ${index}`, paths: ['src/api'], body: 'b', commit: fix }));
  const specific = await add(root, { kind: 'fact', cue: 'specific', paths: ['src/api/users.ts'], body: 'b', commit: fix });
  const answer = await lessonsMatch(root, ['src/api/users.ts']);
  assert.equal(answer.cues.length, 6);
  assert.equal(answer.omitted, 1);
  assert.equal(answer.cues[0].id, specific.id);
  assert.deepEqual(answer.cues[0], { id: specific.id, kind: 'fact', cue: 'specific' });
  await rm(root, { recursive: true, force: true });
});

test('an entry whose paths are gone is skipped and counted stale, and a malformed ledger never throws', async () => {
  const { root, fix } = await repo();
  const kept = await add(root, { kind: 'fact', cue: 'kept', paths: ['src/api/users.ts'], body: 'b', commit: fix });
  await add(root, { kind: 'fact', cue: 'gone', paths: ['src/api/orders.ts'], body: 'b', commit: fix });
  await rm(path.join(root, 'src/api/orders.ts'));
  commit(root, 'chore: drop orders');
  const answer = await lessonsMatch(root, ['src/api']);
  assert.deepEqual(answer.cues.map((cue) => cue.id), [kept.id]);
  assert.equal(answer.stale, 1);

  await writeFile(path.join(root, 'docs/LESSONS.md'), `${await ledger(root)}\n## L-zz broken heading\n\n- **Paths:** nothing\n`);
  const lenient = await lessonsMatch(root, ['src/api']);
  assert.deepEqual(lenient.cues.map((cue) => cue.id), [kept.id]);
  await rm(root, { recursive: true, force: true });
});

test('two branches each adding an entry to a ledger absent at the base merge with no conflict', async () => {
  const { root, fix } = await repo();
  git(root, 'switch', '-q', '-c', 'one');
  const one = await add(root, { kind: 'fact', cue: 'from branch one', paths: ['lib/db.mjs'], body: 'b', commit: fix });
  commit(root, 'lessons: one');
  git(root, 'switch', '-q', 'main');
  git(root, 'switch', '-q', '-c', 'two');
  const two = await add(root, { kind: 'fact', cue: 'from branch two', paths: ['README.md'], body: 'b', commit: fix });
  commit(root, 'lessons: two');
  git(root, 'merge', '-q', '--no-edit', 'one');
  const text = await ledger(root);
  assert.doesNotMatch(text, /^(<{7}|>{7}|={7})/m);
  assert.deepEqual(parseLessons(text).entries.map((entry) => entry.id).sort(), [one.id, two.id].sort());
  assert.deepEqual(parseLessons(text).unreadable, []);
  await rm(root, { recursive: true, force: true });
});

test('esq branch check does not count a lesson: row in unit.open', async () => {
  const { root, brief, fix } = await repo();
  git(root, 'switch', '-q', '-c', 'esq/unit');
  const plan = 'docs/plans/2026-10-02-unit.md';
  await writeFile(path.join(root, plan), '# Unit\n\n**Branch:** esq/unit\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n');
  commit(root, 'plan: unit');
  const added = await add(root, lesson(fix, { source: `${BRIEF}@${brief}:3`, checkable: true }));
  assert.equal(added.backlog.filed, true);
  commit(root, 'lessons: unit');
  const check = await branchCheck(root, plan);
  assert.deepEqual(check.unit.open, []);
  await rm(root, { recursive: true, force: true });
});

test('validate lists stale, duplicate and unreadable lessons as advisories, and valid stays true', async () => {
  const { root, fix } = await repo();
  await add(root, { kind: 'fact', cue: 'kept', paths: ['src/api/users.ts'], body: 'b', commit: fix });
  const gone = await add(root, { kind: 'fact', cue: 'gone', paths: ['src/api/orders.ts'], body: 'b', commit: fix });
  await rm(path.join(root, 'src/api/orders.ts'));
  const text = await ledger(root);
  const block = text.slice(text.indexOf(`## ${gone.id}`));
  await writeFile(path.join(root, 'docs/LESSONS.md'), `${text}\n${block}\n## L-nothex here\n`);
  commit(root, 'chore: drop orders');
  const result = await validate(root);
  assert.equal(result.valid, true);
  assert.deepEqual(result.findings, []);
  const lessons = result.advisories.filter((line) => line.startsWith('docs/LESSONS.md'));
  assert.ok(lessons.some((line) => line.includes(`stale ${gone.id} — path \`src/api/orders.ts\` matches no tracked file`)));
  assert.ok(lessons.some((line) => line.includes(`duplicate lesson ID ${gone.id}`)));
  assert.ok(lessons.some((line) => /unreadable lesson block/.test(line)));
  await rm(root, { recursive: true, force: true });
});

test('a commit touching only docs/LESSONS.md after a review keeps the unit covered', async () => {
  const { root, fix } = await repo();
  git(root, 'switch', '-q', '-c', 'esq/unit');
  const plan = 'docs/plans/2026-10-02-unit.md';
  await writeFile(path.join(root, plan), '# Unit\n\n**Branch:** esq/unit\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n');
  commit(root, 'plan: unit');
  // The ledger line in .gitattributes is the one non-bookkeeping write, once per repository.
  await writeFile(path.join(root, '.gitattributes'), 'docs/LESSONS.md merge=union\n');
  commit(root, 'chore: union merge for lessons');
  await setReviewed(root, plan, git(root, 'rev-parse', 'HEAD'));
  commit(root, 'plan(unit): reviewed');
  assert.equal((await branchCheck(root, plan)).coverage.verdict, 'covered');
  const added = await add(root, lesson(fix));
  assert.equal(added.gitattributes, 'present');
  commit(root, 'lessons: unit');
  const after = await branchCheck(root, plan);
  assert.equal(after.coverage.verdict, 'covered', after.coverage.reason);
  await rm(root, { recursive: true, force: true });
});
