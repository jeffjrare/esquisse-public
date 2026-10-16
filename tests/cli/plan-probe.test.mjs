import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { planProbe } from '../../plugin/lib/cli.mjs';
import { touchedPaths, touchesPath } from '../../plugin/lib/markdown.mjs';

// `esq plan probe` maps repository paths onto the phases whose `**Files touched:**` names them. The
// case it exists for, replayed from a real plan (2026-10-15): a removal grep scoped by hand to
// `backend frontend .ansible` left `.github/workflows/*.yml` setting the removed env vars, and a
// history doc the Done excepted sat inside the final grep's scope. Both are `unassigned` here.

const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

const PLAN = `# Leave the vendor

**Branch:** esq/leave-vendor

**Origin:** test

## Phases

### Phase 1 — Storage
- **Goal:** files on disk.
- **Files touched:**
  - \`backend/src/storage/{Factory.ts,adapters/Local.ts}\`
  - new \`backend/src/routes/files.ts\`, \`backend/prisma/migrations/<ts>_keys/\`
  - delete \`VendorAdapter.ts\`
  - \`backend/src/lib/startup-validation*\` (wherever \`validateStartup\` lives)
- **Tasks:**
  - Task 1.1: harden it.
- **Verification:**
  - \`(auto)\` \`grep -rn "vendor" backend/src/storage\` — no match

### Phase 2 — Docs
- **Files touched:** \`docs/ARCHITECTURE.md\`, the suites mocking \`lib/vendor\` (\`better-auth: ~1.7.7\`)
- **Verification:**
  - \`(auto)\` \`grep -rn "vendor" backend docs\` — no match

## Execution log
<!-- Appended by /esq:build. -->

### Phase 1 — completed 2026-10-15

**Files touched:** \`never/read/from/the/log.ts\`
`;

async function repository() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-probe-'));
  for (const directory of ['backend', 'docs', 'frontend', '.github']) await mkdir(path.join(root, directory));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  await writeFile(path.join(root, 'docs/plans/plan.md'), PLAN);
  return root;
}

test('Files touched is read from the item and its nested bullets, braces expanded, prose left unread', () => {
  const [one, two] = touchedPaths(PLAN);
  assert.deepEqual(one.paths, [
    'backend/src/storage/Factory.ts',
    'backend/src/storage/adapters/Local.ts',
    'backend/src/routes/files.ts',
    'backend/prisma/migrations/<ts>_keys',
    'VendorAdapter.ts',
    'backend/src/lib/startup-validation*',
  ]);
  assert.deepEqual(one.unread, ['validateStartup']);
  assert.deepEqual(two.paths, ['docs/ARCHITECTURE.md', 'lib/vendor']);
  assert.deepEqual(two.unread, ['better-auth: ~1.7.7']);
  // Nothing below `## Execution log` is plan material.
  assert.ok(!touchedPaths(PLAN).some((phase) => phase.paths.includes('never/read/from/the/log.ts')));
});

test('a phase with no Files touched item touches nothing, and an unbalanced brace is unread', () => {
  const text = '### Phase 1 — A\n- **Goal:** x\n\n### Phase 2 — B\n- **Files touched:** `src/{a,b.ts`\n';
  const [one, two] = touchedPaths(text);
  assert.deepEqual(one, { phase: 1, title: 'A', paths: [], unread: [] });
  assert.deepEqual(two.paths, []);
  assert.deepEqual(two.unread, ['src/{a,b.ts']);
});

test('a rooted entry covers itself and what it names as a directory, never a suffix or a sibling prefix', () => {
  assert.equal(touchesPath('backend/src/index.ts', 'backend/src/index.ts'), true);
  assert.equal(touchesPath('frontend/src/lib/file-upload', 'frontend/src/lib/file-upload/utils/api.ts'), true);
  assert.equal(touchesPath('src/index.ts', 'frontend/src/index.ts'), false);
  assert.equal(touchesPath('backend/src/lib', 'backend/src/library.ts'), false);
  assert.equal(touchesPath('backend/src/lib/startup-validation*', 'backend/src/lib/startup-validation.test.ts'), true);
  assert.equal(touchesPath('backend/src/lib/startup-validation*', 'backend/src/lib/other/startup-validation.ts'), false);
  assert.equal(touchesPath('backend/prisma/migrations/<ts>_keys', 'backend/prisma/migrations/20261015_keys/migration.sql'), true);
  assert.equal(touchesPath('backend/prisma/migrations/<ts>_keys', 'backend/prisma/migrations/a/b_keys/migration.sql'), false);
  // A dot is literal, not any character.
  assert.equal(touchesPath('docs/A.md', 'docs/AXmd'), false);
});

test('an unrooted entry is read as a whole-segment suffix', () => {
  assert.equal(touchesPath('VendorAdapter.ts', 'backend/src/storage/adapters/VendorAdapter.ts', { unrooted: true }), true);
  assert.equal(touchesPath('VendorAdapter.ts', 'backend/src/storage/adapters/OldVendorAdapter.ts', { unrooted: true }), false);
});

test('probe assigns each path to every phase that touches it and returns the rest as unassigned', async () => {
  const root = await repository();
  try {
    const answer = await planProbe(root, 'docs/plans/plan.md', { paths: [
      './backend/src/storage/Factory.ts',
      'backend/src/storage/adapters/VendorAdapter.ts',
      'backend/prisma/migrations/20261015_keys/migration.sql',
      'docs/ARCHITECTURE.md',
      '.github/workflows/backend-tests.yml',
      'frontend/FILE_UPLOAD_PLAN.md',
      '',
      'backend/src/storage/Factory.ts',
    ] });
    assert.equal(answer.probed, 6);
    assert.deepEqual(answer.phases.map((phase) => [phase.phase, phase.hits]), [[1, 3], [2, 1]]);
    assert.deepEqual(answer.unassigned, ['.github/workflows/backend-tests.yml', 'frontend/FILE_UPLOAD_PLAN.md']);
    assert.equal(answer.unassignedCount, 2);
    // `lib/vendor` is not a top-level entry of this repository, so it reads as a suffix — and a path
    // merely containing the word is still not covered by it.
    const suffix = await planProbe(root, 'docs/plans/plan.md', { paths: ['backend/src/lib/vendor/client.ts', 'backend/src/lib/vendors.ts'] });
    assert.deepEqual(suffix.unassigned, ['backend/src/lib/vendors.ts']);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('probe without paths answers the parsed touched sets, and lists at most 200 unassigned with the exact count', async () => {
  const root = await repository();
  try {
    const parsed = await planProbe(root, 'docs/plans/plan.md');
    assert.equal(parsed.phases[0].paths.length, 6);
    assert.equal('unassigned' in parsed, false);
    const many = Array.from({ length: 250 }, (_, index) => `frontend/file-${index}.ts`);
    const bounded = await planProbe(root, 'docs/plans/plan.md', { paths: many });
    assert.equal(bounded.unassignedCount, 250);
    assert.equal(bounded.unassigned.length, 200);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('esq plan probe reads paths from stdin, refuses a malformed call with exit 2, and refuses a plan with no phases', async () => {
  const root = await repository();
  try {
    const run = (args, input = '') => spawnSync(process.execPath, [bin, ...args], { cwd: root, input, encoding: 'utf8', timeout: 10_000 });
    const piped = run(['plan', 'probe', 'docs/plans/plan.md', '--paths', '-'], '.github/workflows/ci.yml\ndocs/ARCHITECTURE.md\n');
    assert.equal(piped.status, 0, piped.stderr);
    assert.deepEqual(JSON.parse(piped.stdout).unassigned, ['.github/workflows/ci.yml']);
    await writeFile(path.join(root, 'hits.txt'), 'docs/ARCHITECTURE.md\n');
    const fromFile = run(['plan', 'probe', 'docs/plans/plan.md', '--paths', 'hits.txt']);
    assert.equal(JSON.parse(fromFile.stdout).unassignedCount, 0);
    for (const args of [['plan', 'probe'], ['plan', 'probe', 'docs/plans/plan.md', '--paths'], ['plan', 'probe', 'docs/plans/plan.md', '--files', '-']]) {
      const refused = run(args);
      assert.equal(refused.status, 2, args.join(' '));
      assert.match(refused.stderr, /usage: esq plan probe/);
    }
    await writeFile(path.join(root, 'empty.md'), '# Nothing\n');
    const empty = run(['plan', 'probe', 'empty.md']);
    assert.equal(empty.status, 2);
    assert.match(empty.stderr, /plan contains no phases/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
