import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { expertiseMatch, expertiseSpanMatches } from '../../plugin/lib/cli.mjs';

// `esq expertise match`: pure string matching of paths against each expertise skill's `**Paths:**`,
// over fixture skills (outside plugin/, so none counts as a plugin skill) and the shipped ones.
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
const skillsDir = fileURLToPath(new URL('./fixtures/expertise/', import.meta.url));
const match = (paths) => expertiseMatch(paths, { skillsDir, today: '2026-10-23' });
const ids = (answer) => answer.skills.map((skill) => skill.id);

test('an Android path matches the Android skill only, with its age', async () => {
  const answer = await match(['shell/android/app/build.gradle']);
  assert.deepEqual(answer.skills, [{ id: 'esq:good', asOf: '2026-10-01', ageDays: 22, stale: false, matched: ['shell/android/app/build.gradle'] }]);
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

test('a skill with no Paths line lands in unread without failing the call, and a command is never read', async () => {
  const answer = await match(['android/app/build.gradle']);
  assert.deepEqual(answer.unread, [{ id: 'esq:nopaths', reason: 'no **Paths:** line naming a backticked span' }]);
  assert.ok(!ids(answer).includes('esq:command'));
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

test('the CLI answers the shipped skills, and the preflight carries the expertise of a phase naming only ios/', async () => {
  const cli = spawnSync(process.execPath, [bin, 'expertise', 'match', 'shell/android/app/build.gradle', 'shell/ios/App/App/Info.plist', 'frontend/src/App.tsx'], { encoding: 'utf8' });
  assert.equal(cli.status, 0);
  const shipped = JSON.parse(cli.stdout);
  assert.deepEqual(shipped.skills.find((skill) => skill.id === 'esq:capacitor-android').matched, ['shell/android/app/build.gradle']);
  assert.deepEqual(shipped.skills.find((skill) => skill.id === 'esq:capacitor-ios').matched, ['shell/ios/App/App/Info.plist']);
  assert.ok(shipped.skills.every((skill) => !skill.matched.includes('frontend/src/App.tsx')));
  assert.match(spawnSync(process.execPath, [bin, 'expertise', 'match'], { encoding: 'utf8' }).stderr, /usage: esq expertise match/);
  const piped = JSON.parse(spawnSync(process.execPath, [bin, 'expertise', 'match', '--paths', '-'], { input: 'android/app/build.gradle\n', encoding: 'utf8' }).stdout);
  assert.ok(piped.skills.some((skill) => skill.id === 'esq:capacitor-android'));

  const env = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-expertise-'));
  const git = (...args) => spawnSync('git', ['-C', root, ...args], { env, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'user.name', 'Test');
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const plan = (touched) => `# A plan\n\n**Branch:** main\n\n**Origin:** main\n\n## Phases\n\n### Phase 1 — one\n- **Files touched:** ${touched}\n- task\n\n## Execution log\n<!-- Appended by /esq:build -->\n`;
  const preflight = async (touched) => {
    await writeFile(path.join(root, 'docs/plans/app.md'), plan(touched));
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
});
