import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EXPERTISE_DIR } from '../../plugin/lib/expertise.mjs';
import { ENTRY_MAX, HEADER_MAX, expertiseHeader, sessionExpertise } from '../../plugin/scripts/session-expertise.mjs';

// The SessionStart handler: one line per stack-matched module, the fixed header otherwise, silent on
// any error. Fixture repositories are real git repositories, with the git seam cleared.
const script = fileURLToPath(new URL('../../plugin/scripts/session-expertise.mjs', import.meta.url));
const gitEnv = { ...process.env, NODE_ENV: '', ESQ_TEST_GIT_ROOT: '', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };

function moduleText(name, description, stack) {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\n**As of:** 2026-10-26\n\n**Paths:** \`${name}/\`\n\n**Stack:** ${stack.map((span) => `\`${span}\``).join(', ')}\n\nBody.\n`;
}

async function repository(manifest, { git = true } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-session-'));
  if (git) spawnSync('git', ['-C', root, 'init', '-q', '-b', 'main'], { env: gitEnv });
  if (manifest !== undefined) await writeFile(path.join(root, 'package.json'), typeof manifest === 'string' ? manifest : JSON.stringify(manifest));
  return root;
}

// detectStack honours the git seam only under NODE_ENV=test; clear it for the in-process call.
async function run(cwd, dir) {
  const saved = { NODE_ENV: process.env.NODE_ENV, ESQ_TEST_GIT_ROOT: process.env.ESQ_TEST_GIT_ROOT };
  delete process.env.ESQ_TEST_GIT_ROOT;
  try {
    return await sessionExpertise({ hook_event_name: 'SessionStart', source: 'startup', cwd }, {}, dir === undefined ? {} : { dir });
  } finally {
    for (const [key, value] of Object.entries(saved)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}

async function catalog(parent, modules) {
  const dir = path.join(parent, 'expertise');
  await mkdir(dir, { recursive: true });
  for (const [name, description, stack] of modules) await writeFile(path.join(dir, `${name}.md`), moduleText(name, description, stack));
  return dir;
}

const headerLength = (dir) => expertiseHeader(dir).length - dir.length;

test('a Stripe stack announces the payments module with a reference that resolves under a long install path', async () => {
  const install = path.join(await mkdtemp(path.join(os.tmpdir(), 'esq-install-')), ...Array.from({ length: 12 }, (_, index) => `very-long-install-segment-${index}`));
  const longDescription = `Stripe payments: ${'webhooks, refunds, disputes and taxes, '.repeat(8)}all of it. A second sentence never shown.`;
  const dir = await catalog(install, [
    ['payments-stripe', longDescription, ['stripe', '@stripe/*']],
    ['capacitor-ios', 'The iOS shell.', ['@capacitor/ios']],
  ]);
  for (const root of [await repository({ dependencies: { stripe: '1' } }), await repository({ dependencies: { '@stripe/stripe-js': '1' } }, { git: false })]) {
    const answer = await run(root, dir);
    assert.equal(answer.hookSpecificOutput.hookEventName, 'SessionStart');
    const [header, ...entries] = answer.hookSpecificOutput.additionalContext.split('\n');
    assert.equal(header, expertiseHeader(dir));
    assert.ok(headerLength(dir) <= HEADER_MAX);
    assert.equal(entries.length, 1);
    assert.ok(entries[0].startsWith('- payments-stripe.md: Stripe payments:'));
    assert.ok(entries[0].length <= ENTRY_MAX, `${entries[0].length} characters`);
    assert.ok(!entries[0].includes('second sentence'));
    assert.ok(existsSync(path.join(dir, /^- (\S+):/.exec(entries[0])[1])));
  }
});

test('a repository with no manifest hears the header alone', async () => {
  const dir = await catalog(await mkdtemp(path.join(os.tmpdir(), 'esq-cat-')), [['payments-stripe', 'Stripe.', ['stripe']]]);
  const answer = await run(await repository(undefined), dir);
  assert.equal(answer.hookSpecificOutput.additionalContext, expertiseHeader(dir));
});

test('a hundred extra modules the stack does not use leave the output byte-identical', async () => {
  const dir = path.join(await mkdtemp(path.join(os.tmpdir(), 'esq-cat-')), 'expertise');
  await cp(EXPERTISE_DIR, dir, { recursive: true });
  const root = await repository({ dependencies: { '@capacitor/core': '1', react: '1' } });
  const before = await run(root, dir);
  assert.ok(before.hookSpecificOutput.additionalContext.split('\n').length > 1);
  for (let index = 0; index < 100; index += 1) await writeFile(path.join(dir, `extra-${index}.md`), moduleText(`extra-${index}`, `Extra domain ${index}.`, [`extra-package-${index}`]));
  assert.equal(JSON.stringify(await run(root, dir)), JSON.stringify(before));
});

test('malformed stdin or an unreadable catalog gives no output and exit 0', async () => {
  const malformed = spawnSync(process.execPath, [script], { input: '{ not json', encoding: 'utf8', env: gitEnv });
  assert.equal(malformed.status, 0);
  assert.equal(malformed.stdout, '');
  const empty = spawnSync(process.execPath, [script], { input: '', encoding: 'utf8', env: gitEnv });
  assert.equal(empty.status, 0);
  assert.equal(empty.stdout, '');
  const root = await repository({ dependencies: { stripe: '1' } });
  assert.equal(await run(root, path.join(root, 'no-such-catalog')), null);
  assert.equal(await sessionExpertise({}, {}), null);
});

test('no manifest content reaches the output', async () => {
  const dir = await catalog(await mkdtemp(path.join(os.tmpdir(), 'esq-cat-')), [['private-domain', 'A domain module.', ['zz-private-dep']]]);
  const root = await repository({ name: 'zz-secret-project', description: 'zz-secret-text', dependencies: { 'zz-private-dep': 'zz-secret-version', 'zz-other-dep': '1' } });
  const text = (await run(root, dir)).hookSpecificOutput.additionalContext;
  assert.ok(text.includes('- private-domain.md: A domain module.'));
  for (const fragment of ['zz-private-dep', 'zz-other-dep', 'zz-secret', root]) assert.ok(!text.includes(fragment), fragment);
});
