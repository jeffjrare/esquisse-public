import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { projectionOutline, projectionRead } from '../../plugin/lib/cli.mjs';
import { parseSections, stripComments } from '../../plugin/lib/markdown.mjs';

// Section reads of the spec and architecture projections: the boundaries, the comment stripping, the
// freshness and which given paths changed since the projection was mined. Real git in throwaway
// repositories; neither the contributor's git config nor the CLI's test seam can change an answer.
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
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-projection-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await write(root, 'src/app.js', 'export const one = 1;\n');
  await write(root, 'src/other.js', 'export const two = 2;\n');
  await write(root, 'CLAUDE.md', '# Project\n');
  commit(root, 'seed');
  return root;
}

// A SPEC-shaped document as esq's spec writer used to leave it: a changelog preamble in a comment
// (holding a heading of its own), dated history comments, nested features and a fenced example.
const specText = (at) => [
  '# Spec — app',
  `<!-- last-spec: 2026-10-01 @ ${at} -->`,
  '<!-- changelog',
  '## 2026-09-01 refresh',
  'many rules changed',
  '-->',
  '',
  'Intro line.',
  '',
  '## Vue d\'ensemble',
  'The app tracks events. <!-- mis à jour 2026-09-02 -->',
  '',
  '<!-- modifié 2026-09-03 : wording -->',
  '',
  '## Feature A',
  'Rule A1.',
  '',
  '### Sub A',
  'Rule A2.',
  '```md',
  '## not a heading',
  '```',
  '',
  '#### Deep A',
  'Rule A3.',
  '',
  '## Feature B',
  'Rule B1.',
  '',
].join('\n');

test('sections: nested subtrees, the preamble as id 0, fenced and commented headings ignored', () => {
  const sections = parseSections(specText('c'.repeat(40)));
  assert.deepEqual(sections.map(({ id, level, heading, from, to }) => [id, level, heading, from, to]), [
    [0, 1, null, 1, 9],
    [1, 2, 'Vue d\'ensemble', 10, 14],
    [2, 2, 'Feature A', 15, 26],
    [3, 3, 'Sub A', 18, 26],
    [4, 4, 'Deep A', 24, 26],
    [5, 2, 'Feature B', 27, 28],
  ]);
});

test('sections tolerate CRLF and keep the carriage return in the text', () => {
  const text = '# T\r\n\r\n## One\r\nrule\r\n### Two\r\nmore\r\n## Three\r\n';
  const sections = parseSections(text);
  assert.deepEqual(sections.map(({ heading, from, to }) => [heading, from, to]), [[null, 1, 2], ['One', 3, 6], ['Two', 5, 6], ['Three', 7, 7]]);
  assert.equal(stripComments('a\r\n<!-- x -->\r\n\r\nb\r\n'), 'a\r\n\r\nb\r\n');
});

test('stripping removes single- and multi-line comments, keeps the marker and collapses the gap', () => {
  const at = 'c'.repeat(40);
  const keep = (line) => /^<!--\s*last-spec:/.test(line);
  const stripped = stripComments(specText(at), keep);
  assert.ok(stripped.includes(`<!-- last-spec: 2026-10-01 @ ${at} -->`));
  assert.ok(!/mis à jour|modifié|changelog|2026-09-01 refresh/.test(stripped));
  assert.ok(stripped.includes('The app tracks events.\n\n## Feature A'), stripped);
  assert.ok(stripped.includes('```md\n## not a heading\n```'));
  assert.ok(!/\n\n\n/.test(stripped));
});

test('a comment written inside an inline code span is text, never a comment', () => {
  const text = [
    '# Arch',
    '',
    '## Markers',
    'A marker is `<!-- last-spec: YYYY-MM-DD @ <commit> -->`, computed from the ``<!-- x -->`` line. <!-- gone -->',
    'An unclosed opener `<!--` stays text.',
    '',
    '## Next',
    'rule',
    '',
  ].join('\n');
  const stripped = stripComments(text);
  assert.ok(stripped.includes('A marker is `<!-- last-spec: YYYY-MM-DD @ <commit> -->`, computed from the ``<!-- x -->`` line.\n'), stripped);
  assert.ok(!stripped.includes('gone'));
  assert.ok(stripped.includes('`<!--` stays text.\n\n## Next\nrule\n'), stripped);
  assert.deepEqual(parseSections(text).map(({ heading, from, to }) => [heading, from, to]), [[null, 1, 2], ['Markers', 3, 6], ['Next', 7, 8]]);
});

test('outline: subtree costs, leads, stripped size and freshness of a SPEC-shaped document', async () => {
  const root = await repo();
  const mined = git(root, 'rev-parse', 'HEAD');
  await write(root, 'docs/SPEC.md', specText(mined));
  commit(root, 'spec: refresh');
  const outline = await projectionOutline(root, 'spec');
  assert.equal(outline.exists, true);
  assert.equal(outline.file, 'docs/SPEC.md');
  assert.ok(outline.strippedBytes < outline.bytes);
  assert.deepEqual(outline.freshness, { verdict: 'fresh', date: '2026-10-01', at: mined, reason: outline.freshness.reason, changedCount: 0 });
  assert.equal(outline.touched, undefined);
  const byId = Object.fromEntries(outline.sections.map((section) => [section.id, section]));
  assert.equal(byId[1].lead, 'The app tracks events.');
  assert.equal(byId[2].lead, 'Rule A1.');
  assert.ok(byId[2].bytes > byId[3].bytes && byId[3].bytes > byId[4].bytes, 'a parent costs its subtree');
  assert.equal(byId[0].lead, '# Spec — app');
});

test('read: narrow sections, parent and child emitted once, whole document without ids', async () => {
  const root = await repo();
  const mined = git(root, 'rev-parse', 'HEAD');
  await write(root, 'docs/SPEC.md', specText(mined));
  commit(root, 'spec: refresh');

  const narrow = await projectionRead(root, 'spec', ['5']);
  assert.equal(narrow.sections.length, 1);
  assert.equal(narrow.sections[0].heading, 'Feature B');
  assert.ok(!/## Feature A|## Vue|### Sub A/.test(narrow.sections[0].text));

  const nested = await projectionRead(root, 'spec', ['4', '2', '3']);
  assert.deepEqual(nested.sections.map((section) => section.id), [2]);
  assert.equal((nested.sections[0].text.match(/#### Deep A/g) ?? []).length, 1);

  const overview = await projectionRead(root, 'spec', ['1']);
  assert.ok(!/mis à jour|modifié/.test(overview.sections[0].text));

  const whole = await projectionRead(root, 'spec');
  assert.equal(whole.sections.length, 1);
  assert.equal(whole.sections[0].id, null);
  assert.equal(whole.sections[0].text, stripComments(specText(mined), (line) => /^<!--\s*last-spec:/.test(line)));
});

test('read refuses an unknown id with exit 1 and never falls back to the whole file', async () => {
  const root = await repo();
  await write(root, 'docs/SPEC.md', specText(git(root, 'rev-parse', 'HEAD')));
  commit(root, 'spec');
  const refused = await projectionRead(root, 'spec', ['9']);
  assert.equal(refused.refuse, true);
  assert.match(refused.reason, /ids 0–5/);
  assert.equal(refused.sections, undefined);
  const result = await run(process.execPath, [bin, 'projection', 'read', 'spec', '9'], { cwd: root }).catch((error) => error);
  assert.equal(result.code, 1);
  assert.equal(JSON.parse(result.stdout).refuse, true);
  const usage = await run(process.execPath, [bin, 'projection', 'read', 'nope'], { cwd: root }).catch((error) => error);
  assert.equal(usage.code, 2);
});

test('touched: a path changed after the marker, an unchanged one, a base before the marker, no marker', async () => {
  const root = await repo();
  const before = git(root, 'rev-parse', 'HEAD');
  await write(root, 'src/app.js', 'export const one = 0;\n');
  const mined = commit(root, 'feat: early change');
  await write(root, 'docs/SPEC.md', specText(mined));
  commit(root, 'spec: refresh');
  await write(root, 'src/app.js', 'export const one = 3;\n');
  commit(root, 'feat: later change');

  const outline = await projectionOutline(root, 'spec', { paths: ['src/app.js', './src/other.js', ''] });
  assert.deepEqual(outline.touched, ['src/app.js']);
  assert.equal(outline.freshness.verdict, 'stale');
  assert.equal(outline.freshness.changedCount, 1);
  assert.equal(outline.freshness.changed, undefined);

  const early = await projectionOutline(root, 'spec', { paths: ['src/app.js'], upto: before });
  assert.deepEqual(early.touched, []);
  assert.match(early.touchedReason, /mined at .* after/);

  // Through the binary, the paths read from stdin as `esq lessons match` reads them.
  const piped = execFileSync(process.execPath, [bin, 'projection', 'outline', 'spec', '--paths', '-'], { cwd: root, input: 'src/app.js\nsrc/other.js\n', encoding: 'utf8' });
  assert.deepEqual(JSON.parse(piped).touched, ['src/app.js']);

  await write(root, 'docs/SPEC.md', '# Spec\n\n## A\nrule\n');
  commit(root, 'spec: lose the marker');
  const unmarked = await projectionOutline(root, 'spec', { paths: ['src/app.js'] });
  assert.equal(unmarked.touched, null);
  assert.equal(unmarked.freshness.verdict, 'unproven');
});

test('arch freshness is found through the CLAUDE.md marker fallback; a missing file answers exists: false', async () => {
  const root = await repo();
  const head = git(root, 'rev-parse', 'HEAD');
  await write(root, 'CLAUDE.md', `# Project\n<!-- last-arch: 2026-10-01 @ ${head} -->\n`);
  commit(root, 'docs(arch): refresh');
  const outline = await projectionOutline(root, 'arch');
  assert.equal(outline.exists, false);
  assert.equal(outline.file, 'docs/ARCHITECTURE.md');
  assert.deepEqual(outline.sections, []);
  assert.equal(outline.freshness.verdict, 'fresh');
  assert.equal(outline.freshness.at, head);
  const read = await run(process.execPath, [bin, 'projection', 'read', 'arch'], { cwd: root });
  assert.equal(JSON.parse(read.stdout).exists, false);
  assert.equal(git(root, 'status', '--porcelain', '--untracked-files=all'), '');
});
