import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { state } from '../../plugin/lib/cli.mjs';

// Real git, in throwaway repositories: `sinceDerive` is a claim about which commit last derived the
// roadmap, and a stub would prove only that the stub agrees with itself (B-191).
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function roadmap(shipped) {
  const tail = shipped === null ? '' : `## Shipped\n<!-- newest first -->\n${shipped.map((key) => `- ${key} — B-001 (done)`).join('\n')}\n`;
  return `# Roadmap\n\n## Now\n\n### head\n**covers:** B-001\n\n${tail}`;
}

async function repo() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-shipped-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  return root;
}

async function commit(root, subject, { shipped, backlog, body } = {}) {
  if (shipped !== undefined) await writeFile(path.join(root, 'docs/ROADMAP.md'), roadmap(shipped));
  if (backlog !== undefined) await writeFile(path.join(root, 'docs/BACKLOG.md'), backlog);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', subject, ...(body ? ['-m', body] : []));
}

const five = ['2026-09-30 · e', '2026-09-30 · d', '2026-09-29 · c', '2026-09-29 · b', '2026-09-28 · a'];
const shipped = async (root) => (await state(root)).roadmap.shipped;

test('right after a derive, a full tail is not new (the B-191 case)', async () => {
  const root = await repo();
  await commit(root, 'roadmap: derive order (1 entries, 1 items placed)', { shipped: five });
  assert.deepEqual(await shipped(root), { retained: 5, sinceDerive: 0 });
});

test('a refresh that adds one entry and trims the oldest counts one', async () => {
  const root = await repo();
  await commit(root, 'roadmap: derive order (1 entries, 1 items placed)', { shipped: five });
  await commit(root, 'roadmap: refresh state (f shipped)', { shipped: ['2026-10-01 · f', ...five.slice(0, 4)] });
  assert.deepEqual(await shipped(root), { retained: 5, sinceDerive: 1 });
});

test('history with no derive commit answers null, so the skill counts the retained tail', async () => {
  const root = await repo();
  await commit(root, 'roadmap: refresh state (seed)', { shipped: five });
  assert.deepEqual(await shipped(root), { retained: 5, sinceDerive: null });
});

test('no Shipped section retains nothing', async () => {
  const root = await repo();
  await commit(root, 'roadmap: derive order (1 entries, 1 items placed)', { shipped: null });
  assert.deepEqual(await shipped(root), { retained: 0, sinceDerive: 0 });
});

test('three entries since the derive count three; a second derive resets to zero', async () => {
  const root = await repo();
  await commit(root, 'roadmap: derive order (1 entries, 1 items placed)', { shipped: five });
  const later = ['2026-10-03 · i', '2026-10-02 · h', '2026-10-01 · g', ...five.slice(0, 2)];
  await commit(root, 'roadmap: refresh state (g, h, i shipped)', { shipped: later });
  assert.deepEqual(await shipped(root), { retained: 5, sinceDerive: 3 });
  await commit(root, 'roadmap: derive order (1 entries, 1 items placed)', { shipped: later, backlog: '# Backlog\n' });
  assert.deepEqual(await shipped(root), { retained: 5, sinceDerive: 0 });
});

test('a body line opening with the derive subject does not make a refresh the baseline', async () => {
  const root = await repo();
  await commit(root, 'roadmap: derive order (1 entries, 1 items placed)', { shipped: five });
  await commit(root, 'roadmap: refresh state (f shipped)', { shipped: ['2026-10-01 · f', ...five.slice(0, 4)], body: 'roadmap: derive is still owed' });
  assert.deepEqual(await shipped(root), { retained: 5, sinceDerive: 1 });
});

test('a derive that committed only the backlog is still the baseline', async () => {
  const root = await repo();
  await commit(root, 'roadmap: refresh state (seed)', { shipped: five.slice(1) });
  await commit(root, 'roadmap: refresh state (e shipped)', { shipped: five });
  await commit(root, 'roadmap: derive order (1 entries, 1 items placed)', { backlog: '# Backlog\n' });
  assert.deepEqual(await shipped(root), { retained: 5, sinceDerive: 0 });
});
