import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { detectStack, expertiseMatch, expertiseSpanMatches, stackSpanMatches } from '../../plugin/lib/cli.mjs';

// `esq expertise match`: pure string matching of paths against each expertise module's `**Paths:**`,
// stack detection against its `**Stack:**`, over fixture modules and the shipped catalog.
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const dir = fileURLToPath(new URL('./fixtures/expertise/', import.meta.url));
const match = (paths, options = {}) => expertiseMatch(paths, { dir, today: '2026-10-23', ...options });
const ids = (answer) => answer.skills.map((skill) => skill.id);

test('an Android path matches the Android skill only, with its age', async () => {
  const answer = await match(['shell/android/app/build.gradle']);
  assert.deepEqual(answer.skills, [{ id: 'esq:good', file: path.join(dir, 'good.md'), asOf: '2026-10-01', ageDays: 22, stale: false, matched: ['shell/android/app/build.gradle'] }]);
});

test('an iOS path that does not exist yet still matches, and a stale As of is flagged', async () => {
  const answer = await match(['shell/ios/App/App/Info.plist']);
  assert.deepEqual(ids(answer), ['esq:stale']);
  assert.equal(answer.skills[0].ageDays, 295);
  assert.equal(answer.skills[0].stale, true);
});

test('mixed paths match each skill on its own path, and an unrelated or vendored path matches nothing', async () => {
  const answer = await match(['shell/android/build.gradle', 'shell/ios/App/Podfile', 'frontend/src/App.tsx', 'node_modules/@capacitor/android/build.gradle']);
  assert.deepEqual(answer.skills.map(({ id, matched }) => ({ id, matched })), [
    { id: 'esq:good', matched: ['shell/android/build.gradle'] },
    { id: 'esq:stale', matched: ['shell/ios/App/Podfile'] },
  ]);
  assert.deepEqual(ids(await match(['frontend/src/App.tsx'])), []);
  assert.deepEqual(ids(await match(['node_modules/@capacitor/android/capacitor/build.gradle'])), []);
});

test('a module with no Paths line or a malformed Stack span lands in unread without failing the call', async () => {
  const answer = await match(['android/app/build.gradle']);
  assert.deepEqual(answer.unread, [
    { id: 'esq:badstack', reason: '**Stack:** span `Not A Package` is neither a package name nor @scope/*' },
    { id: 'esq:nopaths', reason: 'no **Paths:** line naming a backticked span' },
  ]);
});

test('a named id comes back named whether a path matched it or not, and an unknown id lands in unread', async () => {
  const answer = await match(['frontend/src/App.tsx'], { named: ['esq:stale', 'esq:nope'] });
  assert.deepEqual(answer.skills.map(({ id, matched, named }) => ({ id, matched, named })), [{ id: 'esq:stale', matched: [], named: true }]);
  assert.deepEqual(answer.unread.at(-1), { id: 'esq:nope', reason: 'no expertise module by that id' });
});

test('stack detection reads the root and tracked manifests, never node_modules, and counts what it skips', async () => {
  const env = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-stack-'));
  const git = (...args) => spawnSync('git', ['-C', root, ...args], { env, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { stripe: '1', '@stripe/stripe-js': '1' } }));
  await mkdir(path.join(root, 'backend'), { recursive: true });
  await writeFile(path.join(root, 'backend/package.json'), JSON.stringify({ devDependencies: { '@prisma/client': '1' } }));
  await mkdir(path.join(root, 'node_modules/stripe'), { recursive: true });
  await writeFile(path.join(root, 'node_modules/stripe/package.json'), JSON.stringify({ dependencies: { 'vendored-only': '1' } }));
  await mkdir(path.join(root, 'big'), { recursive: true });
  await writeFile(path.join(root, 'big/package.json'), JSON.stringify({ dependencies: { huge: '1' }, filler: 'x'.repeat(600 * 1024) }));
  await mkdir(path.join(root, 'bad'), { recursive: true });
  await writeFile(path.join(root, 'bad/package.json'), '{ not json');
  git('add', 'backend/package.json', 'big/package.json', 'bad/package.json');
  git('add', '-f', 'node_modules/stripe/package.json');
  // The root manifest is detected though untracked, from a subdirectory too.
  const stack = await detectStack(path.join(root, 'backend'));
  assert.deepEqual(stack, { packages: ['@prisma/client', '@stripe/stripe-js', 'stripe'], detection: { manifests: 2, skipped: 2 } });
  const answer = await match(['frontend/src/App.tsx'], { all: true, stack });
  assert.deepEqual(answer.detection, { manifests: 2, skipped: 2 });
  assert.deepEqual(answer.skills.map(({ id, matched, stack: found }) => ({ id, matched, stack: found })), [
    { id: 'esq:good', matched: [], stack: ['@stripe/stripe-js', 'stripe'] },
    { id: 'esq:prisma', matched: [], stack: ['@prisma/client'] },
    { id: 'esq:stale', matched: [], stack: [] },
  ]);
  // Outside a repository, the directory's own manifest is the whole stack.
  const plain = await mkdtemp(path.join(os.tmpdir(), 'esq-stack-plain-'));
  await writeFile(path.join(plain, 'package.json'), JSON.stringify({ peerDependencies: { react: '1' }, optionalDependencies: { bullmq: '1' } }));
  assert.deepEqual(await detectStack(plain), { packages: ['bullmq', 'react'], detection: { manifests: 1, skipped: 0 } });
  assert.equal(stackSpanMatches('@radix-ui/*', '@radix-ui/react-dialog'), true);
  assert.equal(stackSpanMatches('@radix-ui/*', '@radix-ui-x/react'), false);
  assert.equal(stackSpanMatches('stripe', 'stripe-node'), false);
});

test('segment matching: a directory span matches anywhere, a file span ends with the path, * stays in a segment', () => {
  assert.equal(expertiseSpanMatches('ios/', 'ios/'), true);
  assert.equal(expertiseSpanMatches('ios/', 'apps/mobile/ios/App/AppDelegate.swift'), true);
  assert.equal(expertiseSpanMatches('ios/', 'src/iosfoo/x.ts'), false);
  assert.equal(expertiseSpanMatches('*.xcodeproj/', 'ios/App/App.xcodeproj/project.pbxproj'), true);
  assert.equal(expertiseSpanMatches('Info.plist', 'Info.plist/other'), false);
  assert.equal(expertiseSpanMatches('capacitor.config.*', 'shell/capacitor.config.ts'), true);
  assert.equal(expertiseSpanMatches('*.gradle', 'a/b.gradle.kts'), false);
});

test('the CLI answers the shipped modules with their files, --all every module, and the preflight its named ids', async () => {
  const cli = spawnSync(process.execPath, [bin, 'expertise', 'match', 'shell/android/app/build.gradle', 'shell/ios/App/App/Info.plist', 'frontend/src/App.tsx'], { encoding: 'utf8' });
  assert.equal(cli.status, 0);
  const shipped = JSON.parse(cli.stdout);
  const android = shipped.skills.find((skill) => skill.id === 'esq:capacitor-android');
  assert.deepEqual(android.matched, ['shell/android/app/build.gradle']);
  assert.ok(existsSync(android.file) && android.file.endsWith(path.join('plugin', 'expertise', 'capacitor-android.md')));
  assert.deepEqual(shipped.skills.find((skill) => skill.id === 'esq:capacitor-ios').matched, ['shell/ios/App/App/Info.plist']);
  assert.ok(shipped.skills.every((skill) => !skill.matched.includes('frontend/src/App.tsx')));
  assert.deepEqual(shipped.unread, []);
  assert.match(spawnSync(process.execPath, [bin, 'expertise', 'match'], { encoding: 'utf8' }).stderr, /usage: esq expertise match/);
  const piped = JSON.parse(spawnSync(process.execPath, [bin, 'expertise', 'match', '--paths', '-'], { input: 'android/app/build.gradle\n', encoding: 'utf8' }).stdout);
  assert.ok(piped.skills.some((skill) => skill.id === 'esq:capacitor-android'));
  const all = JSON.parse(spawnSync(process.execPath, [bin, 'expertise', 'match', '--all'], { encoding: 'utf8' }).stdout);
  assert.ok(all.skills.length >= 8);
  assert.ok(all.skills.every((skill) => existsSync(skill.file) && Array.isArray(skill.matched) && Array.isArray(skill.stack)));
  assert.deepEqual(Object.keys(all.detection).sort(), ['manifests', 'skipped']);

  const env = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-expertise-'));
  const git = (...args) => spawnSync('git', ['-C', root, ...args], { env, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'user.name', 'Test');
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const plan = (touched, expertise = '') => `# A plan\n\n**Branch:** main\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- **Files touched:** ${touched}\n${expertise}- task\n\n## Execution log\n<!-- Appended by /esq:build -->\n`;
  const preflight = async (touched, expertise) => {
    await writeFile(path.join(root, 'docs/plans/app.md'), plan(touched, expertise));
    git('add', '-A');
    git('commit', '-q', '-m', 'plan');
    const run = spawnSync(process.execPath, [bin, 'next-phase', 'docs/plans/app.md', '--preflight'], { cwd: root, env, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    return JSON.parse(run.stdout).expertise;
  };
  const ios = await preflight('`ios/`');
  assert.deepEqual(ios.skills.map((skill) => skill.id), ['esq:capacitor-ios']);
  assert.deepEqual(ios.skills[0].matched, ['ios/']);
  assert.deepEqual((await preflight('`frontend/src/App.tsx`')).skills, []);
  const named = await preflight('`frontend/src/App.tsx`', '- **Expertise:** `esq:store-review`, `esq:nope`. Read for pointers.\n');
  assert.deepEqual(named.skills.map(({ id, matched, named: flag }) => ({ id, matched, named: flag })), [{ id: 'esq:store-review', matched: [], named: true }]);
  assert.deepEqual(named.unread, [{ id: 'esq:nope', reason: 'no expertise module by that id' }]);
});
