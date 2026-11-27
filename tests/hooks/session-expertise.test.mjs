import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EXPERTISE_DIR } from '../../plugin/lib/expertise.mjs';
import { scanDocs } from '../../plugin/lib/intake.mjs';
import { ENTRY_MAX, HEADER_MAX, INTAKE_LINE_MAX, INTAKE_PEEK, expertiseHeader, intakeLine, sessionExpertise } from '../../plugin/scripts/session-expertise.mjs';

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

// The intake line: imported specs in docs/ esq has not adopted. Names are invented and marked
// `zz-` so a leak of any of them into the line is caught.
const REGISTRY = '# Decisions\n\n| # | Date | Scope | Topic | Décision | Statut |\n|---|------|-------|-------|----------|--------|\n';
async function imported(root, { registry } = {}) {
  await mkdir(path.join(root, 'docs', 'zz-modules'), { recursive: true });
  const padding = 'zz-secret-word '.repeat(600);
  await writeFile(path.join(root, 'docs', 'zz-secret-brief.md'), `# zz-secret-title\n\n${padding}\n`);
  await writeFile(path.join(root, 'docs', 'zz-pricing.md'), `# Pricing\n\n${padding}\n`);
  await writeFile(path.join(root, 'docs', 'zz-modules', 'M1-zz-billing.md'), `# M1\n\n${padding}\n`);
  if (registry !== undefined) await writeFile(path.join(root, 'docs', 'DECISIONS.md'), registry);
}

test('pending intake adds one line of at most 200 characters, naming no file, before the expertise output', async () => {
  const dir = await catalog(await mkdtemp(path.join(os.tmpdir(), 'esq-cat-')), [['payments-stripe', 'Stripe.', ['stripe']]]);
  const plain = await repository({ dependencies: { stripe: '1' } });
  const today = (await run(plain, dir)).hookSpecificOutput.additionalContext;
  const root = await repository({ dependencies: { stripe: '1' } });
  // A foreign DECISIONS.md (not esq's table) is a collision, still pending.
  await imported(root, { registry: '# Decisions D1..D9\n\n## D1 — zz-secret-decision\n' });
  const [line, ...rest] = (await run(root, dir)).hookSpecificOutput.additionalContext.split('\n');
  assert.match(line, /^docs\/ holds 4 spec documents \(\d+ KB\) esq has not adopted — \/esq:advance adopts them into decisions and backlog rows, then works the top\.$/);
  assert.equal(line, intakeLine(4, Number(/\((\d+) KB\)/.exec(line)[1])));
  assert.ok(line.length <= INTAKE_LINE_MAX, `${line.length} characters`);
  for (const fragment of ['zz-', 'M1', 'DECISIONS', 'Pricing', root]) assert.ok(!line.includes(fragment), fragment);
  assert.equal(rest.join('\n'), today);
  // An empty catalog still hears the intake line, alone.
  const empty = await mkdtemp(path.join(os.tmpdir(), 'esq-cat-'));
  assert.equal((await run(root, empty)).hookSpecificOutput.additionalContext, line);
});

test('no pending intake leaves the output byte-identical to today, and the peek reads 4 KB of three ledgers alone', async () => {
  const dir = await catalog(await mkdtemp(path.join(os.tmpdir(), 'esq-cat-')), [['payments-stripe', 'Stripe.', ['stripe']]]);
  const plain = await repository({ dependencies: { stripe: '1' } });
  const today = JSON.stringify(await run(plain, dir));
  // An esq registry: this project already runs esq.
  const registered = await repository({ dependencies: { stripe: '1' } });
  await imported(registered, { registry: REGISTRY });
  assert.equal(JSON.stringify(await run(registered, dir)), today);
  // Under the floor: two files.
  const small = await repository({ dependencies: { stripe: '1' } });
  await mkdir(path.join(small, 'docs'));
  await writeFile(path.join(small, 'docs', 'zz-one.md'), '# one\n');
  await writeFile(path.join(small, 'docs', 'zz-two.md'), '# two\n');
  assert.equal(JSON.stringify(await run(small, dir)), today);
  // A registry header past the first 4 KB is not seen by the hook's peek: it is a collision there,
  // while the full scan sees the esq registry.
  const late = await repository(undefined);
  await imported(late, { registry: `# Decisions\n\n${'x'.repeat(INTAKE_PEEK)}\n\n${REGISTRY}` });
  assert.equal((await scanDocs(late)).registry, 'esq');
  assert.equal((await scanDocs(late, { peek: INTAKE_PEEK })).registry, 'foreign');
  // The peek reads the head of BACKLOG.md and ROADMAP.md too; the two other ledger names are never
  // read by it: counted as esq's, unread.
  const named = await repository(undefined);
  await imported(named);
  await writeFile(path.join(named, 'docs', 'BACKLOG.md'), `# zz-secret backlog\n\n${'zz '.repeat(4000)}\n`);
  await writeFile(path.join(named, 'docs', 'SPEC.md'), `# zz-secret spec\n\n${'zz '.repeat(4000)}\n`);
  const peeked = await scanDocs(named, { peek: INTAKE_PEEK });
  assert.equal(peeked.ledgers['BACKLOG.md'], 'foreign');
  assert.equal(peeked.ledgers['SPEC.md'], 'unread');
  assert.ok(!peeked.foreign.some((file) => file.path === 'docs/SPEC.md'));
  assert.equal((await scanDocs(named)).ledgers['SPEC.md'], 'foreign');
});
