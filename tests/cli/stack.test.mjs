import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Real directories and the real binary, no stubs: `esq stack` answers a question about the user's
// environment (which variable is set, does the file exist, what does it hold), so each test builds its
// own HOME and passes an explicit environment — nothing is inherited from the shell running the suite.

const BIN = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

const run = (cwd, env) => JSON.parse(execFileSync(process.execPath, [BIN, 'stack'], { cwd, encoding: 'utf8', env: { PATH: process.env.PATH, ...env } }));

// Every file under a directory, relative, sorted: the "no write anywhere" check compares two of these.
async function tree(root) {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      out.push(path.relative(root, full));
      if (entry.isDirectory()) await walk(full);
    }
  }
  await walk(root);
  return out.sort();
}

async function sandbox() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-stack-'));
  const home = path.join(root, 'home');
  const work = path.join(root, 'work');
  await mkdir(home, { recursive: true });
  await mkdir(work, { recursive: true });
  return { root, home, work };
}

const STACK = '# Reference stack\n\n- Runtime: Node 22, plain ESM\n- Data: one Postgres per app, no row-level security\n- Example repo: ~/projects/acme-orchard\n';

test('ESQ_STACK wins over XDG_CONFIG_HOME and HOME', async () => {
  const { root, home, work } = await sandbox();
  try {
    const chosen = path.join(root, 'chosen.md');
    await writeFile(chosen, STACK);
    await mkdir(path.join(root, 'xdg', 'esq'), { recursive: true });
    await writeFile(path.join(root, 'xdg', 'esq', 'stack.md'), '# not this one\n');
    const answer = run(work, { HOME: home, XDG_CONFIG_HOME: path.join(root, 'xdg'), ESQ_STACK: chosen });
    assert.equal(answer.path, chosen);
    assert.equal(answer.present, true);
    assert.equal(answer.text, STACK);
    assert.equal(answer.truncated, false);
    assert.deepEqual(answer.findings, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('without ESQ_STACK, XDG_CONFIG_HOME/esq/stack.md is read', async () => {
  const { root, home, work } = await sandbox();
  try {
    const xdg = path.join(root, 'xdg');
    await mkdir(path.join(xdg, 'esq'), { recursive: true });
    await writeFile(path.join(xdg, 'esq', 'stack.md'), STACK);
    await mkdir(path.join(home, '.config', 'esq'), { recursive: true });
    await writeFile(path.join(home, '.config', 'esq', 'stack.md'), '# not this one\n');
    const answer = run(work, { HOME: home, XDG_CONFIG_HOME: xdg });
    assert.equal(answer.path, path.join(xdg, 'esq', 'stack.md'));
    assert.equal(answer.text, STACK);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('without either variable, HOME/.config/esq/stack.md is read; an empty XDG_CONFIG_HOME counts as unset', async () => {
  const { root, home, work } = await sandbox();
  try {
    await mkdir(path.join(home, '.config', 'esq'), { recursive: true });
    await writeFile(path.join(home, '.config', 'esq', 'stack.md'), STACK);
    for (const env of [{ HOME: home }, { HOME: home, XDG_CONFIG_HOME: '' }]) {
      const answer = run(work, env);
      assert.equal(answer.path, path.join(home, '.config', 'esq', 'stack.md'));
      assert.equal(answer.present, true);
      assert.equal(answer.text, STACK);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an absent file is present: false, exit 0, no finding — and nothing is created', async () => {
  const { root, home, work } = await sandbox();
  try {
    const before = await tree(root);
    const answer = run(work, { HOME: home });
    assert.equal(answer.present, false);
    assert.equal(answer.text, null);
    assert.equal(answer.truncated, false);
    assert.deepEqual(answer.findings, []);
    assert.deepEqual(await tree(root), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an empty file is a finding, never an error exit', async () => {
  const { root, home, work } = await sandbox();
  try {
    const file = path.join(root, 'empty.md');
    await writeFile(file, '  \n\n\t\n');
    const answer = run(work, { HOME: home, ESQ_STACK: file });
    assert.equal(answer.present, true);
    assert.equal(answer.text, null);
    assert.equal(answer.findings.length, 1);
    assert.match(answer.findings[0], /is empty/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an unreadable path (a directory) is a finding, never an error exit', async () => {
  const { root, home, work } = await sandbox();
  try {
    const answer = run(work, { HOME: home, ESQ_STACK: root });
    assert.equal(answer.present, true);
    assert.equal(answer.text, null);
    assert.equal(answer.findings.length, 1);
    assert.match(answer.findings[0], /could not be read/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a 20 KB file is cut at a line boundary under 16 KB, with truncated: true and a finding — and no write anywhere', async () => {
  const { root, home, work } = await sandbox();
  try {
    const line = '- a proven choice, written once and kept short enough to read in one glance\n';
    let body = '# Reference stack\n\n';
    while (Buffer.byteLength(body) < 20 * 1024) body += line;
    const file = path.join(root, 'big.md');
    await writeFile(file, body);
    const before = await tree(root);
    const answer = run(work, { HOME: home, ESQ_STACK: file });
    assert.equal(answer.truncated, true);
    assert.ok(Buffer.byteLength(answer.text) <= 16 * 1024, 'the text stays within the 16 KB budget');
    assert.ok(Buffer.byteLength(answer.text) > 16 * 1024 - line.length, 'the cut is the last whole line, not earlier');
    assert.ok(answer.text.endsWith('\n'), 'the cut falls on a line boundary');
    assert.ok(body.startsWith(answer.text), 'the text is a prefix of the file');
    assert.equal(answer.findings.length, 1);
    assert.match(answer.findings[0], /cut at a line/);
    assert.deepEqual(await tree(root), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('esq stack takes no argument', () => {
  assert.throws(() => execFileSync(process.execPath, [BIN, 'stack', 'extra'], { stdio: 'pipe' }), /usage: esq stack/);
});
