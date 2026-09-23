// The budget checker's own guard: the README table is the single source of the
// ceilings, so a table shape it silently misreads would report ok on a group it
// never compared. Every exit code the tool promises is asserted here against a
// fixture, and the parser is asserted against a table it must not read (the
// direct-session one) as well as the one it must.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  TableError, commandKey, compare, fmtDur, fmtTok, parseBudgets, parseDuration,
} from '../../scripts/cost-budgets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const TOOL = path.join(ROOT, 'scripts', 'cost-budgets.mjs');
const fixture = (name) => path.join(here, 'fixtures', name);
const readFixture = (name) => readFileSync(fixture(name), 'utf8');

const run = (...args) => {
  const r = spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
};
const GOOD = ['--readme', fixture('table-good.md')];

test('a summary inside every budget exits 0 and says so', () => {
  const r = run(...GOOD, '--summary', fixture('ok.json'));
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /ok esq:build/);
  assert.match(r.out, /All 2 compared groups inside budget/);
});

test('an inflated median exits 1 and names the breached group and both numbers', () => {
  const r = run('--summary', fixture('breach.json'));
  assert.equal(r.code, 1, r.out + r.err);
  assert.match(r.out, /BREACH esq:review/);
  assert.match(r.out, /out 31\.0k > 20\.5k/);
  // A group over on duration alone is a breach too, and it is named separately.
  assert.match(r.out, /BREACH esq:check — duration 6m40s > 3m15s/);
  assert.doesNotMatch(r.out, /BREACH esq:build/);
  assert.match(r.out, /investigation, not a failure/);
});

test('an empty store exits 2 — nothing to check never prints the same green line as everything clean', () => {
  const r = run(...GOOD, '--summary', fixture('empty.json'));
  assert.equal(r.code, 2, r.out + r.err);
  assert.match(r.err, /nothing to check/);
});

test('a store where every budgeted group fell back to provisional exits 2, not 0', () => {
  const r = run(...GOOD, '--summary', fixture('provisional.json'));
  assert.equal(r.code, 2, r.out + r.err);
  assert.match(r.out, /not compared: provisional again/);
});

test('a malformed budget cell exits 1 and prints the offending line', () => {
  const r = run('--readme', fixture('table-malformed.md'), '--summary', fixture('ok.json'));
  assert.equal(r.code, 1, r.out + r.err);
  assert.match(r.err, /budget cell is not/);
  assert.match(r.err, /offending line: \| `\/esq:build`/);
});

test('a table with no budget column at all is a finding, not an empty pass', () => {
  const r = run('--readme', fixture('table-nobudget.md'), '--summary', fixture('ok.json'));
  assert.equal(r.code, 1, r.out + r.err);
  assert.match(r.err, /no Budget column/);
});

test('the repo README parses, and every budget it carries sits on a confirmed row', () => {
  const rows = parseBudgets(readFileSync(path.join(ROOT, 'README.md'), 'utf8'));
  const budgeted = rows.filter((r) => r.budget);
  assert.ok(budgeted.length >= 5, `expected the confirmed rows to carry budgets, got ${budgeted.length}`);
  for (const row of budgeted) {
    assert.match(row.line, /\| confirmed \|/, `${row.command} carries a budget on a row that is not confirmed`);
    assert.ok(row.budget.runs > 0 && /^\d{4}-\d{2}-\d{2}$/.test(row.budget.date));
  }
});

test('parseBudgets reads only the subagent table, keeps the dagger row, and skips em-dash cells', () => {
  const rows = parseBudgets(readFixture('table-good.md'));
  assert.deepEqual(rows.map((r) => r.command), ['esq:apply', 'esq:build', 'esq:work']);
  assert.equal(rows[0].budget, null);
  assert.deepEqual(rows[1].budget, { outputTokens: 43500, durationMs: 645000, runs: 33, date: '2026-01-02' });
  // The direct-session table below carries a 999.9k row; reading it would make
  // every ceiling meaningless.
  assert.equal(rows.filter((r) => r.command === 'esq:build').length, 1);
});

test('a section that is not there is a TableError, not a crash', () => {
  assert.throws(() => parseBudgets('# nothing here\n'), TableError);
});

test('compare skips a group the summary cannot speak to and never calls it ok', () => {
  const rows = parseBudgets(readFixture('table-good.md'));
  const results = compare(rows, { byCommand: { 'esq:build': { runs: 0 } } });
  assert.deepEqual(results.map((r) => r.state), ['skip', 'skip']);
  assert.match(results[0].why, /no run in this window/);
  assert.match(results[1].why, /no run in this window/);
});

test('compare reads a run with no token sample as skip, not as zero tokens', () => {
  const rows = parseBudgets(readFixture('table-good.md'));
  const [build] = compare(rows, { byCommand: { 'esq:build': { runs: 6, provisional: false } } });
  assert.equal(build.state, 'skip');
  assert.match(build.why, /6 runs, none with tokens/);
});

test('parseDuration and the formatters round-trip the shapes the column uses', () => {
  assert.equal(parseDuration('10m45s'), 645000);
  assert.equal(parseDuration('45s'), 45000);
  assert.equal(parseDuration('6h04m'), 21840000);
  assert.equal(parseDuration('soon'), null);
  assert.equal(fmtDur(645000), '10m45s');
  assert.equal(fmtDur(45000), '45s');
  assert.equal(fmtDur(21840000), '6h04m');
  assert.equal(fmtTok(43500), '43.5k');
  assert.equal(fmtTok(194), '194');
});

test('commandKey parses the backticked token, not the whole cell', () => {
  assert.equal(commandKey('`/esq:build`'), 'esq:build');
  assert.equal(commandKey('`esq:apply` †'), 'esq:apply');
  assert.equal(commandKey('esq:build'), null);
  assert.equal(commandKey('`not a command`'), null);
});
