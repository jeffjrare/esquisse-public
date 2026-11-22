import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFile, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { state } from '../../plugin/lib/cli.mjs';
import { intakeInventory, scanDocs } from '../../plugin/lib/intake.mjs';

// Real throwaway repositories built from `fixtures/intake/`, no stubs: the inventory answers a
// question about the files on disk, and a stubbed reader would only agree with itself. The
// fixtures use invented names; the size floor is crossed by padding a copy, never a fixture.

const FIXTURES = fileURLToPath(new URL('./fixtures/intake/', import.meta.url));
const BIN = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

async function repo(fixture) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-intake-'));
  if (fixture) await cp(path.join(FIXTURES, fixture), root, { recursive: true });
  execFileSync('git', ['init', '-q', '-b', 'main', root]);
  execFileSync('git', ['-C', root, 'add', '-A']);
  execFileSync('git', ['-C', root, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '--allow-empty', '-m', 'fixture']);
  return root;
}

const commit = (root) => {
  execFileSync('git', ['-C', root, 'add', '-A']);
  execFileSync('git', ['-C', root, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'more']);
};
const porcelain = (root) => execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' });
const pad = (root) => appendFile(path.join(root, 'docs/product-brief.md'), `\n${'flour order cut-off week '.repeat(1100)}\n`);
const cli = (root, ...args) => JSON.parse(execFileSync(process.execPath, [BIN, ...args], { cwd: root, encoding: 'utf8' }));

const REGISTRY = `# Decisions

| # | Date | Scope | Topic | Décision | Statut |
|---|------|-------|-------|----------|--------|

---
`;

test('foreign files are inventoried, esq-owned paths are not', async () => {
  const root = await repo('foreign');
  try {
    const inventory = await intakeInventory(root);
    const paths = inventory.files.map((file) => file.path).sort();
    assert.deepEqual(paths, ['docs/ROADMAP.md', 'docs/SPEC.md', 'docs/decisions-log.md', 'docs/modules/M1-billing.md', 'docs/product-brief.md']);
    // A chat-written SPEC.md (no last-spec marker) and a prompt-list ROADMAP.md (no `## Now`) are foreign.
    assert.equal(inventory.ledgers['SPEC.md'], 'foreign');
    assert.equal(inventory.ledgers['ROADMAP.md'], 'foreign');
    assert.equal(inventory.ledgers['DECISIONS.md'], 'absent');
    assert.deepEqual(inventory.nonMarkdown, [{ path: 'docs/notes.txt', bytes: 17 }]);
    const brief = inventory.files.find((file) => file.path === 'docs/product-brief.md');
    assert.deepEqual(brief.headings.map((heading) => [heading.level, heading.text]), [[1, 'Ledgerly — product brief'], [2, 'Who it is for'], [2, 'First slice']]);
    assert.ok(brief.words > 40);
    // Nothing under docs/plans/ and no owned top-level ledger is read: D300 lives only there.
    assert.equal(inventory.codes.find((code) => code.code === 'D300'), undefined);
    // A code fence is skipped whole: its `## D77` is neither a heading nor a code.
    assert.equal(inventory.codes.find((code) => code.code === 'D77'), undefined);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('codes: defined in a heading, a table row or a file name, cited elsewhere', async () => {
  const root = await repo('foreign');
  try {
    const { codes, undefinedCited, multiplyDefined } = await intakeInventory(root);
    const byCode = Object.fromEntries(codes.map((code) => [code.code, code]));
    // D5 is defined by a heading in the decision log and cited from another file.
    assert.deepEqual(byCode.D5.defined.map((definition) => definition.where), ['heading', 'heading']);
    assert.ok(byCode.D5.citedIn.includes('docs/product-brief.md'));
    // D1: a table row and its section heading — how a registry is written, not a clash.
    assert.deepEqual(byCode.D1.defined.map((definition) => definition.where).sort(), ['heading', 'table']);
    assert.ok(!multiplyDefined.some((entry) => entry.code === 'D1'));
    // D5's two headings are a code defined twice.
    assert.deepEqual(multiplyDefined.map((entry) => entry.code), ['D5']);
    // M1 is defined by its file name.
    assert.deepEqual(byCode.M1.defined, [{ path: 'docs/modules/M1-billing.md', line: null, where: 'file' }]);
    // D99 and M2 are cited and defined nowhere.
    assert.deepEqual(undefinedCited.map((entry) => entry.code).filter((code) => ['D99', 'M2'].includes(code)), ['D99', 'M2']);
    assert.ok(!undefinedCited.some((entry) => entry.code === 'D2'));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('links: each relative link and docs/ path says whether it resolves', async () => {
  const root = await repo('foreign');
  try {
    const { links } = await intakeInventory(root);
    const verdict = Object.fromEntries(links.map((link) => [link.target, link.resolves]));
    assert.equal(verdict['decisions-log.md'], true);
    assert.equal(verdict['pricing-v0.md'], false);
    assert.equal(verdict['docs/modules/M1-billing.md'], true);
    assert.equal(verdict['docs/modules/M2-export.md'], false);
    // An external URL and an in-page anchor are not links to a file.
    assert.equal(verdict['https://example.com/docs'], undefined);
    assert.equal(verdict['#who-it-is-for'], undefined);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('pending: true with no registry above the floor, false under it', async () => {
  const root = await repo('foreign');
  try {
    const small = await intakeInventory(root);
    assert.equal(small.pending, false);
    assert.match(small.reason, /below the floor/);
    await pad(root);
    const large = await intakeInventory(root);
    assert.equal(large.pending, true);
    assert.equal(large.registryCollision, false);
    assert.ok(large.totals.bytes >= 20 * 1024);
    assert.equal(large.totals.files, 5);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('pending: true with a foreign DECISIONS.md (a registry collision), false with an esq registry', async () => {
  const root = await repo('foreign');
  try {
    await pad(root);
    await writeFile(path.join(root, 'docs/DECISIONS.md'), '# Decisions D1..D64\n\n## D1 — Use the invented stack\n');
    const collision = await intakeInventory(root);
    assert.equal(collision.pending, true);
    assert.equal(collision.registryCollision, true);
    assert.equal(collision.registry, 'foreign');
    assert.ok(collision.files.some((file) => file.path === 'docs/DECISIONS.md'));
    await writeFile(path.join(root, 'docs/DECISIONS.md'), REGISTRY);
    const registered = await intakeInventory(root);
    assert.equal(registered.pending, false);
    assert.equal(registered.registry, 'esq');
    assert.ok(!registered.files.some((file) => file.path === 'docs/DECISIONS.md'));
  } finally { await rm(root, { recursive: true, force: true }); }
});

// A numbered decision table is how chat-written registries look; only esq's leading columns are esq's.
test('pending: true with a foreign `| # | Decision | Status |` DECISIONS.md', async () => {
  const root = await repo('foreign');
  try {
    await pad(root);
    await writeFile(path.join(root, 'docs/DECISIONS.md'), '# Decisions\n\n| # | Decision | Status |\n|---|---|---|\n| D1 | Use the invented stack | Open |\n');
    const inventory = await intakeInventory(root);
    assert.equal(inventory.registry, 'foreign');
    assert.equal(inventory.registryCollision, true);
    assert.equal(inventory.pending, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

// A project that runs esq through its backlog and roadmap may never have recorded a decision.
test('pending: false with an esq BACKLOG.md and ROADMAP.md and no DECISIONS.md', async () => {
  const root = await repo(null);
  try {
    await import('node:fs/promises').then((fs) => fs.mkdir(path.join(root, 'docs')));
    const padding = 'deploy the invented service '.repeat(300);
    for (const name of ['api.md', 'deploy.md', 'guide.md']) await writeFile(path.join(root, 'docs', name), `# ${name}\n\n${padding}\n`);
    await writeFile(path.join(root, 'docs/ROADMAP.md'), '# Roadmap\n\n## Now\n\n- B-1\n');
    await writeFile(path.join(root, 'docs/BACKLOG.md'), '# Backlog\n\n| ID | Date | Type | Concern | Layer | Pri | Rank | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n\n---\n');
    const intake = (await state(root)).intake;
    assert.equal(intake.pending, false);
    assert.match(intake.reason, /esq ledger/);
    const peeked = await scanDocs(root, { peek: 4096 });
    assert.equal(peeked.pending, false);
    assert.equal(peeked.ledgers['DECISIONS.md'], 'absent');
    assert.equal(peeked.ledgers['BACKLOG.md'], 'esq');
    assert.ok(peeked.bytes >= 20 * 1024);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an esq-format ROADMAP.md is excluded', async () => {
  const root = await repo('esq-roadmap');
  try {
    const inventory = await intakeInventory(root);
    assert.equal(inventory.ledgers['ROADMAP.md'], 'esq');
    assert.deepEqual(inventory.files, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('no docs/ answers an empty inventory, never pending', async () => {
  const root = await repo(null);
  try {
    const inventory = await intakeInventory(root);
    assert.equal(inventory.docs, null);
    assert.equal(inventory.pending, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('the CLI answer spills under the git dir above the budget, and leaves the tree unchanged', async () => {
  const root = await repo('foreign');
  try {
    await pad(root);
    const headings = Array.from({ length: 1500 }, (_, index) => `## Section ${index} — about module MOD-${index}\n`).join('');
    await writeFile(path.join(root, 'docs/big-spec.md'), `# Big spec\n\n${headings}`);
    commit(root);
    const before = porcelain(root);
    const answer = cli(root, 'intake', 'inventory');
    assert.equal(answer.pending, true);
    assert.equal(answer.file, path.join(await import('node:fs').then((fs) => fs.realpathSync(root)), '.git/esq/intake.json'));
    assert.ok(answer.ranges.length > 1);
    assert.equal(answer.counts.files, 6);
    const spilled = JSON.parse(await readFile(answer.file, 'utf8'));
    assert.equal(spilled.files.length, 6);
    assert.equal(porcelain(root), before);
    assert.equal(before, '');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('the walk stops at 500 entries and counts the overflow', async () => {
  const root = await repo(null);
  try {
    await import('node:fs/promises').then((fs) => fs.mkdir(path.join(root, 'docs')));
    await Promise.all(Array.from({ length: 520 }, (_, index) => writeFile(path.join(root, `docs/note-${String(index).padStart(3, '0')}.md`), '# note\n')));
    const inventory = await intakeInventory(root);
    assert.equal(inventory.examined, 500);
    assert.equal(inventory.overflow, 20);
    assert.equal(inventory.files.length, 500);
  } finally { await rm(root, { recursive: true, force: true }); }
});

// `esq state` carries the verdict /esq:status and /esq:advance route on, from the same scan.
test('state().intake: pending, not pending, and null with no docs/', async () => {
  const root = await repo('foreign');
  try {
    const small = (await state(root)).intake;
    assert.deepEqual(Object.keys(small), ['pending', 'files', 'kb', 'reason']);
    assert.equal(small.pending, false);
    assert.equal(small.files, 5);
    assert.match(small.reason, /below the floor/);
    await pad(root);
    const large = (await state(root)).intake;
    const inventory = await intakeInventory(root);
    assert.equal(large.pending, true);
    assert.equal(large.pending, inventory.pending);
    assert.equal(large.files, inventory.totals.files);
    assert.equal(large.kb, inventory.totals.kb);
    assert.ok(large.kb >= 20);
    assert.equal(large.reason, inventory.reason);
    await writeFile(path.join(root, 'docs/DECISIONS.md'), REGISTRY);
    const registered = (await state(root)).intake;
    assert.equal(registered.pending, false);
    assert.match(registered.reason, /esq registry/);
  } finally { await rm(root, { recursive: true, force: true }); }
  const bare = await repo(null);
  try {
    assert.equal((await state(bare)).intake, null);
  } finally { await rm(bare, { recursive: true, force: true }); }
});

// Harvest files module rows in a repository that has no backlog yet.
test('esq backlog add creates docs/BACKLOG.md from the template, and a second add appends', async () => {
  const root = await repo(null);
  try {
    const add = (summary) => cli(root, 'backlog', 'add', '--type', 'todo', '--summary', summary, '--source', 'intake: docs/brief.md#Billing', '--concern', 'user', '--layer', 'app');
    const first = add('Billing module');
    assert.equal(first.created, true);
    const text = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
    assert.match(text, /^# Backlog\n/);
    assert.match(text, /\| ID \| Date \| Type \|/);
    assert.match(text, /Billing module/);
    const second = add('Export module');
    assert.equal(second.created, undefined);
    assert.notEqual(second.id, first.id);
    const after = await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8');
    assert.match(after, /Billing module[^\n]*\n[^\n]*Export module/);
    // A refused add on a repository with no backlog creates nothing.
    const bare = await repo(null);
    try {
      assert.throws(() => execFileSync(process.execPath, [BIN, 'backlog', 'add', '--type', 'todo', '--summary', 'x', '--source', 'y', '--layer', 'app'], { cwd: bare, stdio: 'pipe' }));
      assert.equal(porcelain(bare), '');
    } finally { await rm(bare, { recursive: true, force: true }); }
  } finally { await rm(root, { recursive: true, force: true }); }
});
