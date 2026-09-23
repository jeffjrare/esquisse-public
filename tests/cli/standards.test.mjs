import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmod, mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { standards } from '../../plugin/lib/cli.mjs';

// Real directories, no stubs: what this verb answers is a question about the filesystem — does the
// project have a standards file, does it say anything, can it be read, does the plugin default exist —
// and a stubbed `readText` would prove only that the stub agrees with itself.
//
// The plugin default is injected through `options.defaultPath` in every test that needs to control it,
// so a missing-default case is a path that does not exist rather than a repository file moved out of
// the way. One test asserts the *shipped* default resolves, which is the injection's counterweight.

async function project() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-standards-'));
  await mkdir(path.join(root, 'docs'), { recursive: true });
  return root;
}

async function defaultFile(root, body = '# esq standards referent\n\n## Part 1\n\n## Part 2\n') {
  const file = path.join(root, 'plugin-default.md');
  await writeFile(file, body);
  return file;
}

test('no project file — the plugin default resolves alone, and that is not a finding', async () => {
  const root = await project();
  try {
    const report = await standards(root, { defaultPath: await defaultFile(root) });
    assert.equal(report.project.present, false);
    assert.equal(report.project.speaks, false);
    assert.equal(report.project.text, null);
    assert.equal(report.project.path, 'docs/STANDARDS.md');
    assert.equal(report.default.present, true);
    assert.match(report.default.text, /## Part 1/);
    assert.deepEqual(report.findings, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a project file that speaks is returned beside the default, and neither is merged', async () => {
  const root = await project();
  try {
    await writeFile(path.join(root, 'docs/STANDARDS.md'), '# House rules\n\nDimensional: 2%.\n');
    const report = await standards(root, { defaultPath: await defaultFile(root) });
    assert.equal(report.project.speaks, true);
    assert.match(report.project.text, /Dimensional: 2%/);
    // The default is still returned in full — the CLI resolves, the reader judges which clause wins.
    assert.match(report.default.text, /## Part 2/);
    assert.deepEqual(report.findings, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an empty project file does not speak, and says so as a finding', async () => {
  const root = await project();
  try {
    await writeFile(path.join(root, 'docs/STANDARDS.md'), '   \n\n\t\n');
    const report = await standards(root, { defaultPath: await defaultFile(root) });
    assert.equal(report.project.present, true);
    assert.equal(report.project.speaks, false);
    assert.equal(report.project.text, null);
    assert.equal(report.findings.length, 1);
    assert.match(report.findings[0], /docs\/STANDARDS\.md is empty/);
    assert.equal(report.default.present, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an unreadable project file is a note beside a referent that still resolves', async (t) => {
  if (process.getuid && process.getuid() === 0) return t.skip('root reads a 0o000 file');
  const root = await project();
  const file = path.join(root, 'docs/STANDARDS.md');
  try {
    await writeFile(file, '# House rules\n');
    await chmod(file, 0o000);
    const report = await standards(root, { defaultPath: await defaultFile(root) });
    assert.equal(report.project.present, true);
    assert.equal(report.project.speaks, false);
    assert.equal(report.findings.length, 1);
    assert.match(report.findings[0], /could not be read/);
    assert.equal(report.default.present, true);
    assert.match(report.default.text, /## Part 1/);
  } finally {
    await chmod(file, 0o644).catch(() => {});
    await rm(root, { recursive: true, force: true });
  }
});

test('a missing plugin default still resolves when the project file speaks', async () => {
  const root = await project();
  try {
    await writeFile(path.join(root, 'docs/STANDARDS.md'), '# House rules\n');
    const report = await standards(root, { defaultPath: path.join(root, 'nowhere/STANDARDS.md') });
    assert.equal(report.default.present, false);
    assert.equal(report.default.text, null);
    assert.equal(report.project.speaks, true);
    assert.equal(report.findings.length, 1);
    assert.match(report.findings[0], /plugin default .* could not be read/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('neither file yields text — the verb throws rather than answering with no standard', async () => {
  const root = await project();
  try {
    await assert.rejects(
      () => standards(root, { defaultPath: path.join(root, 'nowhere/STANDARDS.md') }),
      /no standards referent resolves/,
    );
  } finally { await rm(root, { recursive: true, force: true }); }
});

// The resolution is repository-relative, not cwd-relative. A run whose cwd is any subdirectory of a
// project used to lose that project's file with no symptom at all — `present: false`, no finding,
// exit 0 — and arbitrate against the permissive plugin default. A real `git init` is the point here:
// the seam this fix turns on is git's own `rev-parse --show-toplevel`.
test('a subdirectory of a project still finds the project docs/STANDARDS.md', async () => {
  const root = await project();
  try {
    execFileSync('git', ['-C', root, 'init', '--quiet'], { stdio: ['ignore', 'pipe', 'pipe'] });
    await writeFile(path.join(root, 'docs/STANDARDS.md'), '# House rules\n\nDimensional: 2%.\n');
    await mkdir(path.join(root, 'plugin/lib'), { recursive: true });
    const top = await realpath(root);
    for (const cwd of [path.join(root, 'docs'), path.join(root, 'plugin/lib')]) {
      const report = await standards(cwd, { defaultPath: await defaultFile(root) });
      assert.equal(report.project.present, true, `from ${cwd}`);
      assert.equal(report.project.speaks, true, `from ${cwd}`);
      assert.match(report.project.text, /Dimensional: 2%/);
      // The reported root is the repository top, not the cwd the verb was handed.
      assert.equal(await realpath(report.root), top);
      assert.deepEqual(report.findings, []);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

// Outside a repository there is no top to resolve, and the handed root stands — the historical
// behavior every other test in this file exercises.
test('outside a repository the handed root still resolves docs/STANDARDS.md', async (t) => {
  const root = await project();
  try {
    try {
      execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { stdio: ['ignore', 'pipe', 'pipe'] });
      return t.skip(`${os.tmpdir()} is inside a repository on this machine`);
    } catch { /* no top — the case this test is about */ }
    await writeFile(path.join(root, 'docs/STANDARDS.md'), '# House rules\n');
    const report = await standards(root, { defaultPath: await defaultFile(root) });
    assert.equal(report.project.speaks, true);
    assert.equal(await realpath(report.root), await realpath(root));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('the shipped plugin default resolves with both named parts', async () => {
  const root = await project();
  try {
    const report = await standards(root);
    assert.equal(report.default.present, true);
    assert.match(report.default.path, /plugin\/standards\/STANDARDS\.md$/);
    assert.match(report.default.text, /^## Part 1 — /m);
    assert.match(report.default.text, /^## Part 2 — /m);
    assert.deepEqual(report.findings, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});
