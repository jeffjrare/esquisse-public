import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { appendLog, gateVerify, resolveBlock } from '../../plugin/lib/cli.mjs';
import { nextPhase, parsePlan, parseVerified } from '../../plugin/lib/markdown.mjs';

// ── The recovery transition out of a `⏸` pause, under either of its clauses ──
// The freshness half of this verb is a claim about git's own state, so these run against real
// throwaway repositories rather than a stub that would only agree with itself. No network, no
// remote, no model run. The contributor's own git config cannot change a verdict.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const HEADER = '| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n';

async function backlog(root, rows) {
  const body = rows.map(([id, type, source, status]) => `| ${id} | 2026-09-09 | ${type} | | summary of ${id} | ${source} | | | ${status} |\n`).join('');
  await writeFile(path.join(root, 'docs/BACKLOG.md'), `# Backlog\n\n${HEADER}${body}`);
  git(root, 'add', 'docs/BACKLOG.md');
  git(root, 'commit', '-q', '-m', 'backlog: dispositions');
}

// A repository carrying one plan with one `(auto)` verification step, one source file that step
// stands for, and a backlog. The plan's Phase 1 is not logged yet — each case logs it the way its
// own story needs.
async function unit(rows, { command = 'node --test tests/thing.test.mjs' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-resolve-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  await mkdir(path.join(root, 'src'), { recursive: true });
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await writeFile(path.join(root, 'src/thing.mjs'), 'export const thing = 1;\n');
  const file = path.join(root, 'docs/plans/2026-09-09-stem-fixes.md');
  await writeFile(file, [
    '# Stem', '',
    '**Branch:** esq/stem',
    '**Origin:** main', '',
    '## Phases', '',
    '### Phase 1 — first',
    '- task',
    '- **Verification:**',
    ...(command === null
      ? ['  - (manual) [on /x] look → expect: it renders']
      : [`  - (auto) \`${command}\` — passes`]), '',
    '### Phase 2 — second',
    '- task', '',
    '## Execution log',
    '<!-- Appended by /esq:build -->', '',
  ].join('\n'));
  await backlog(root, rows);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'seed');
  return { root, file, relative: path.relative(root, file), command };
}

// The pause the phase wrote when it found the defect: `(auto)` green on the tree it ran on, the rows
// it could not dispose of named, and no `completed` entry attempted.
async function pauseOn(fixture, blockedBy, { manualOutstanding = null } = {}) {
  const at = git(fixture.root, 'rev-parse', 'HEAD');
  const payload = {
    phase: 1,
    status: 'paused',
    date: '2026-09-09',
    commits: ['abc1234'],
    verified: { at, commands: [fixture.command] },
    whatBuilt: 'the code',
    verification: [`(auto) ${fixture.command} — 12 pass, 0 fail`],
    blockedBy,
  };
  if (manualOutstanding) payload.manualOutstanding = manualOutstanding;
  await appendLog(fixture.file, JSON.stringify(payload));
  git(fixture.root, 'add', 'docs/plans');
  git(fixture.root, 'commit', '-q', '-m', 'plan(stem-fixes): pause phase 1 on an open same-unit defect');
  return at;
}

// The pause a phase writes when its `(auto)` steps passed and no instrument could observe its
// `(manual)` ones. It carries the proof: since B-152 `append-log` refuses this clause without it.
async function pauseForManual(fixture, steps, { verified = true } = {}) {
  const at = git(fixture.root, 'rev-parse', 'HEAD');
  await appendLog(fixture.file, JSON.stringify({
    phase: 1,
    status: 'paused',
    date: '2026-09-09',
    commits: ['abc1234'],
    whatBuilt: 'the code',
    ...(verified && fixture.command ? { verified: { at, commands: [fixture.command] } } : {}),
    verification: [`(auto) ${fixture.command ?? 'nothing to run'} — 12 pass, 0 fail`],
    manualOutstanding: steps,
  }));
  git(fixture.root, 'add', 'docs/plans');
  git(fixture.root, 'commit', '-q', '-m', 'plan(stem-fixes): pause phase 1 for manual verification');
  return at;
}

const TODAY = new Date().toISOString().slice(0, 10);
const runs = (report) => report.commands.filter((entry) => entry.decision === 'run').length;

const read = (fixture) => resolveBlock(fixture.root, fixture.relative);
const confirm = (fixture, payload) => resolveBlock(fixture.root, fixture.relative, JSON.stringify(payload));

test('blockers still open: the entry is byte-identical and the rows are named', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201']);
  const before = await readFile(fixture.file, 'utf8');

  const answer = await read(fixture);
  assert.equal(answer.refuse, true);
  assert.equal(answer.code, 'blockers-open');
  assert.match(answer.reason, /B-201 \(bug, Open\)/);
  assert.match(answer.reason, /The plan file is unchanged\./);

  // And confirming anyway refuses on the same fact — the write path re-derives it and never trusts
  // what a previous read said.
  const forced = await confirm(fixture, { phase: 1 });
  assert.equal(forced.code, 'blockers-open');
  assert.equal(await readFile(fixture.file, 'utf8'), before);
});

test('all Done: fresh evidence is reused, no command runs, and the entry resolves to completed', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201']);
  // Disposed with no code change: the ledger is one of the harmless paths, so the phase's own
  // provenance still describes HEAD and nothing is re-bought.
  await backlog(fixture.root, [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);

  const answer = await read(fixture);
  assert.equal(answer.refuse, false);
  assert.equal(answer.resolvesTo, 'completed');
  assert.deepEqual(answer.owed, []);
  assert.equal(answer.verify.commands[0].decision, 'reuse');
  assert.deepEqual(answer.blockedBy, [{ id: 'B-201', type: 'bug', status: 'Done', reason: null, summary: 'summary of B-201' }]);
  // The read call wrote nothing.
  assert.equal(parsePlan(await readFile(fixture.file, 'utf8')).entries.get(1).status, 'paused');

  const written = await confirm(fixture, { phase: 1 });
  assert.equal(written.refuse, false);
  assert.equal(written.status, 'completed');
  assert.deepEqual(written.reran, []);
  assert.deepEqual(written.reused, [fixture.command]);

  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /### Phase 1 — completed 2026-09-09/);
  // The pause's history survives it: the ids, and what the human decided about each.
  assert.match(text, /\*\*Blocked by \(resolved\):\*\*\n- B-201 \(bug\) — Done — summary of B-201/);
  assert.doesNotMatch(text, /\*\*Blocked by:\*\*/);
  // A completed entry names its results the way every other completed entry does.
  assert.match(text, /\*\*Verification:\*\*\n- \(auto\)/);
  assert.doesNotMatch(text, /\*\*Auto verification:\*\*/);
  const plan = parsePlan(text);
  assert.equal(plan.entries.get(1).status, 'completed');
  assert.equal(nextPhase(plan).state, 'ready');
  assert.equal(nextPhase(plan).phase.number, 2);
});

test('all Dropped: the reason a row was accepted rather than fixed is carried into the history', async () => {
  const fixture = await unit([
    ['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open'],
    ['B-202', '⚠️ debt', 'fix: 2026-09-09-stem-fixes', 'Open'],
  ]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201', 'B-202 (debt, Open) — summary of B-202']);
  await backlog(fixture.root, [
    ['B-201', '🐛 bug', 'build: stem-fixes Phase 1 · Dropped: duplicate of B-110', 'Dropped'],
    ['B-202', '⚠️ debt', 'fix: 2026-09-09-stem-fixes · Dropped: the cost is accepted', 'Dropped'],
  ]);

  const written = await confirm(fixture, { phase: 1 });
  assert.equal(written.status, 'completed');
  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /- B-201 \(bug\) — Dropped: duplicate of B-110 — summary of B-201/);
  assert.match(text, /- B-202 \(debt\) — Dropped: the cost is accepted — summary of B-202/);
});

test('mixed Done and Dropped: both dispositions ride into the same resolved list', async () => {
  const fixture = await unit([
    ['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open'],
    ['B-202', '⚠️ debt', 'fix: 2026-09-09-stem-fixes', 'Open'],
  ]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201', 'B-202 (debt, Open) — summary of B-202']);
  await backlog(fixture.root, [
    ['B-201', '🐛 bug', 'build: stem-fixes Phase 1 · Done by stem-fixes', 'Done'],
    ['B-202', '⚠️ debt', 'fix: 2026-09-09-stem-fixes · Dropped: out of the unit after all', 'Dropped'],
  ]);

  const answer = await read(fixture);
  assert.deepEqual(answer.blockedBy.map((row) => `${row.id}:${row.status}`), ['B-201:Done', 'B-202:Dropped']);
  await confirm(fixture, { phase: 1 });
  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /- B-201 \(bug\) — Done — summary of B-201/);
  assert.match(text, /- B-202 \(debt\) — Dropped: out of the unit after all — summary of B-202/);
});

test('stale verification: the one command git cannot prove runs once, and its result is recorded', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201']);
  // The row was Done because the code was fixed, so the tree the phase proved itself on is gone.
  await writeFile(path.join(fixture.root, 'src/thing.mjs'), 'export const thing = 2;\n');
  git(fixture.root, 'add', 'src/thing.mjs');
  git(fixture.root, 'commit', '-q', '-m', 'fix(thing): close B-201');
  await backlog(fixture.root, [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);

  const answer = await read(fixture);
  assert.equal(answer.refuse, false);
  assert.deepEqual(answer.owed, [fixture.command]);
  assert.match(answer.verify.commands[0].reason, /src\/thing\.mjs changed since Phase 1 verified/);

  // Confirming without the rerun's evidence is refused, and the plan stays paused.
  const before = await readFile(fixture.file, 'utf8');
  const short = await confirm(fixture, { phase: 1 });
  assert.equal(short.code, 'verification-owed');
  assert.match(short.reason, /verified\.commands` does not name it/);
  assert.equal(await readFile(fixture.file, 'utf8'), before);

  const at = git(fixture.root, 'rev-parse', 'HEAD');
  const written = await confirm(fixture, {
    phase: 1,
    verified: { at, commands: [fixture.command] },
    verification: [`(auto) ${fixture.command} — re-run after B-201: 12 pass, 0 fail`],
  });
  assert.equal(written.status, 'completed');
  assert.deepEqual(written.reran, [fixture.command]);
  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /re-run after B-201: 12 pass, 0 fail/);
  // The provenance moved to the tree the rerun was judged on, so the landing gate reads the new one.
  assert.equal(parseVerified(text).get(1)[0].at, at);
});

test('a rerun that reds leaves the phase paused, because a red step never enters the green list', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201']);
  await writeFile(path.join(fixture.root, 'src/thing.mjs'), 'export const thing = 3;\n');
  git(fixture.root, 'add', 'src/thing.mjs');
  git(fixture.root, 'commit', '-q', '-m', 'fix(thing): close B-201');
  await backlog(fixture.root, [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);
  const before = await readFile(fixture.file, 'utf8');

  // A red command is a command the caller omits from `verified.commands` — nothing about the red is
  // inferred, its absence is the whole evidence — and that omission is what holds the pause.
  const at = git(fixture.root, 'rev-parse', 'HEAD');
  const red = await confirm(fixture, { phase: 1, verified: { at, commands: ['some other command'] } });
  assert.equal(red.refuse, true);
  assert.equal(red.code, 'verification-owed');
  assert.equal(await readFile(fixture.file, 'utf8'), before);
  assert.equal(parsePlan(before).entries.get(1).status, 'paused');
});

test('blockedBy plus manualOutstanding: the pause survives under its other clause', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201'], { manualOutstanding: ['[on /settings] toggle → expect a repaint'] });
  await backlog(fixture.root, [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);

  const answer = await read(fixture);
  assert.equal(answer.resolvesTo, 'paused');
  assert.deepEqual(answer.manualOutstanding, ['[on /settings] toggle → expect a repaint']);

  const written = await confirm(fixture, { phase: 1 });
  assert.equal(written.status, 'paused');
  const text = await readFile(fixture.file, 'utf8');
  // The blocked clause is gone, the manual one stands, and the glyph still classifies it.
  assert.match(text, /### Phase 1 — ⏸ awaiting manual verification \(2026-09-09\)/);
  assert.match(text, /\*\*Blocked by \(resolved\):\*\*\n- B-201 \(bug\) — Done/);
  assert.match(text, /\*\*Manual verification outstanding:\*\*\n- \[on \/settings\]/);
  // A phase still owing a manual step is not done, so its results keep the paused template's label.
  assert.match(text, /\*\*Auto verification:\*\*/);
  assert.equal(parsePlan(text).entries.get(1).status, 'paused');
});

test('interruption is safe at every point, and a resolved entry is never resolved twice', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201']);
  const paused = await readFile(fixture.file, 'utf8');

  // Interrupted after the disposition, before the read: repeating the read changes nothing.
  await backlog(fixture.root, [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);
  const first = await read(fixture);
  const second = await read(fixture);
  assert.deepEqual(first, second);
  assert.equal(await readFile(fixture.file, 'utf8'), paused);

  // Interrupted during verification, before the write: still byte-identical.
  assert.equal(await readFile(fixture.file, 'utf8'), paused);

  await confirm(fixture, { phase: 1 });
  const resolved = await readFile(fixture.file, 'utf8');

  // Interrupted after the write: the entry is no longer blocked, and the verb refuses to touch it.
  const again = await confirm(fixture, { phase: 1 });
  assert.equal(again.refuse, true);
  assert.equal(again.code, 'already-resolved');
  assert.equal(await readFile(fixture.file, 'utf8'), resolved);
  // And a bare read says the same thing rather than inventing a phase to resolve.
  const bare = await read(fixture);
  assert.equal(bare.code, 'no-blocked-entry');
  assert.equal(await readFile(fixture.file, 'utf8'), resolved);
});

test('what this verb refuses to touch: another clause, another phase, a blocker deleted, a list naming none', async () => {
  // A phase paused for its manual steps is this verb's too now, but only an observation settles it:
  // a payload carrying none leaves the entry exactly as it found it.
  const manual = await unit([]);
  await appendLog(manual.file, JSON.stringify({
    phase: 1, status: 'paused', date: '2026-09-09', commits: ['abc1234'], whatBuilt: 'the code',
    verified: { at: git(manual.root, 'rev-parse', 'HEAD'), commands: [manual.command] },
    verification: ['(auto) ok'], manualOutstanding: ['[on /x] look'],
  }));
  const manualBefore = await readFile(manual.file, 'utf8');
  const unconfirmed = await resolveBlock(manual.root, manual.relative, JSON.stringify({ phase: 1 }));
  assert.equal(unconfirmed.code, 'manual-unconfirmed');
  assert.match(unconfirmed.reason, /carries no `manual`/);
  assert.equal(await readFile(manual.file, 'utf8'), manualBefore);

  // A phase the caller names that carries no entry at all.
  const absent = await resolveBlock(manual.root, manual.relative, JSON.stringify({ phase: 2 }));
  assert.equal(absent.code, 'no-blocked-entry');
  assert.equal(await readFile(manual.file, 'utf8'), manualBefore);

  // A blocker disposed of by deleting its row is not disposed of.
  const deleted = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(deleted, ['B-201 (bug, Open) — summary of B-201']);
  await backlog(deleted.root, []);
  const before = await readFile(deleted.file, 'utf8');
  const gone = await read(deleted);
  assert.equal(gone.code, 'blocker-missing');
  assert.match(gone.reason, /never by deleting the row/);
  assert.equal(await readFile(deleted.file, 'utf8'), before);

  // A `**Blocked by:**` line naming no row is an entry no mechanical transition can resolve.
  const malformed = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);
  await pauseOn(malformed, ['something a hand wrote']);
  const malformedBefore = await readFile(malformed.file, 'utf8');
  const unreadable = await read(malformed);
  assert.equal(unreadable.code, 'malformed-entry');
  assert.match(unreadable.reason, /naming no backlog id/);
  assert.equal(await readFile(malformed.file, 'utf8'), malformedBefore);
});

test('the subcommand exits 1 exactly when it refuses, and its payload is validated before the file is opened', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201']);
  const before = await readFile(fixture.file, 'utf8');

  const refused = await run(bin, ['plan', 'resolve-block', fixture.relative], { cwd: fixture.root }).catch((error) => error);
  assert.equal(refused.code, 1);
  assert.equal(JSON.parse(refused.stdout).code, 'blockers-open');

  // An unknown key never reaches the plan file, exactly as `append-log`'s payload contract does not.
  const bad = await run(bin, ['plan', 'resolve-block', fixture.relative, '--confirm', '{"phase":1,"nope":true}'], { cwd: fixture.root }).catch((error) => error);
  assert.equal(bad.code, 2);
  assert.match(JSON.parse(bad.stderr).error, /"nope" is not accepted/);
  assert.equal(await readFile(fixture.file, 'utf8'), before);

  // A payload with no phase is refused for the reason the key exists.
  const noPhase = await run(bin, ['plan', 'resolve-block', fixture.relative, '--confirm', '{}'], { cwd: fixture.root }).catch((error) => error);
  assert.equal(noPhase.code, 2);
  assert.match(JSON.parse(noPhase.stderr).error, /never resolve a different entry/);

  await backlog(fixture.root, [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);
  const ok = await run(bin, ['plan', 'resolve-block', fixture.relative, '--confirm', '{"phase":1}'], { cwd: fixture.root });
  assert.equal(JSON.parse(ok.stdout).status, 'completed');
});

// ── The manual clause: settled by an observation, and by nothing else ─────────

test('a confirmed observation completes the phase on the proof the pause already bought, and runs nothing', async () => {
  const fixture = await unit([]);
  const at = await pauseForManual(fixture, ['[on /settings] toggle dark mode → expect: the panel repaints']);

  const answer = await read(fixture);
  assert.equal(answer.refuse, false);
  assert.equal(answer.clause, 'manual');
  assert.deepEqual(answer.owed, []);
  assert.deepEqual(answer.manualOutstanding, ['[on /settings] toggle dark mode → expect: the panel repaints']);
  assert.equal(answer.verify.commands[0].decision, 'reuse');
  assert.match(answer.reason, /nothing is owed/);
  // The read call wrote nothing.
  assert.equal(parsePlan(await readFile(fixture.file, 'utf8')).entries.get(1).status, 'paused');

  const written = await confirm(fixture, {
    phase: 1,
    manual: [{ step: '[on /settings] toggle dark mode → expect: the panel repaints', observed: 'Playwright: the panel repainted with no reload' }],
  });
  assert.equal(written.refuse, false);
  assert.equal(written.status, 'completed');
  // THE COUNTER, half one: not one (auto) command ran to complete this phase.
  assert.deepEqual(written.reran, []);
  assert.deepEqual(written.reused, [fixture.command]);

  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /### Phase 1 — completed 2026-09-09/);
  assert.ok(text.includes(`**Manual verification:** confirmed ${TODAY}\n- [on /settings] toggle dark mode → expect: the panel repaints — Playwright: the panel repainted with no reload`));
  // The list it settles is gone, so nothing can read this entry as still owing the step.
  assert.doesNotMatch(text, /\*\*Manual verification outstanding:\*\*/);
  assert.match(text, /\*\*Verification:\*\*\n- \(auto\)/);
  // The provenance the pause recorded is the provenance the completed entry carries — same commands,
  // same commit, nothing re-judged and nothing invented.
  assert.deepEqual(parseVerified(text).get(1), [{ phase: 1, at, commands: [fixture.command] }]);
  const plan = parsePlan(text);
  assert.equal(plan.entries.get(1).status, 'completed');
  assert.equal(nextPhase(plan).phase.number, 2);

  // THE COUNTER, half two: the landing gate asks for nothing either, over the same tree.
  const landing = await gateVerify(fixture.root, fixture.relative);
  assert.equal(runs(landing), 0);
  assert.equal(landing.commands[0].decision, 'reuse');
  assert.equal(landing.commands[0].verifiedAt, at);
});

test('a relevant change while paused makes the command owed again, and a red one holds the pause', async () => {
  const fixture = await unit([]);
  await pauseForManual(fixture, ['[on /x] look → expect: it renders']);
  await writeFile(path.join(fixture.root, 'src/thing.mjs'), 'export const thing = 2;\n');
  git(fixture.root, 'add', 'src/thing.mjs');
  git(fixture.root, 'commit', '-q', '-m', 'fix(thing): change what the phase proved');

  const answer = await read(fixture);
  assert.deepEqual(answer.owed, [fixture.command]);
  assert.match(answer.verify.commands[0].reason, /src\/thing\.mjs changed since Phase 1 verified/);

  // The observation alone does not complete it: the automatic half is stale and owed.
  const before = await readFile(fixture.file, 'utf8');
  const observation = [{ step: '[on /x] look → expect: it renders', observed: 'Playwright: it renders' }];
  const stale = await confirm(fixture, { phase: 1, manual: observation });
  assert.equal(stale.code, 'verification-owed');
  assert.equal(await readFile(fixture.file, 'utf8'), before);

  // A rerun judged red is one the payload omits, and omitting it keeps the phase paused.
  const at = git(fixture.root, 'rev-parse', 'HEAD');
  const red = await confirm(fixture, { phase: 1, manual: observation, verified: { at, commands: ['some other command'] } });
  assert.equal(red.code, 'verification-owed');
  assert.equal(await readFile(fixture.file, 'utf8'), before);

  const written = await confirm(fixture, {
    phase: 1,
    manual: observation,
    verified: { at, commands: [fixture.command] },
    verification: [`(auto) ${fixture.command} — re-run on the new tree: 12 pass, 0 fail`],
  });
  assert.equal(written.status, 'completed');
  assert.deepEqual(written.reran, [fixture.command]);
  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /re-run on the new tree: 12 pass, 0 fail/);
  assert.equal(parseVerified(text).get(1)[0].at, at);
});

test('no observation, a partial one, or one naming a step nobody was owed: the phase stays paused', async () => {
  const fixture = await unit([]);
  const steps = ['[on /a] click → expect: a toast', '[on /b] submit → expect: the row appears'];
  await pauseForManual(fixture, steps);
  const before = await readFile(fixture.file, 'utf8');

  // No `manual` at all — the (auto) evidence is fresh and proves nothing about a screen.
  const none = await confirm(fixture, { phase: 1 });
  assert.equal(none.code, 'manual-unconfirmed');
  assert.match(none.reason, /carries no `manual`/);
  assert.deepEqual(none.manualOutstanding, steps);

  // One of two observed: the other is a step judged FAIL or never reached, and it holds the pause.
  const partial = await confirm(fixture, { phase: 1, manual: [{ step: steps[0], observed: 'Playwright: the toast appeared' }] });
  assert.equal(partial.code, 'manual-unconfirmed');
  assert.match(partial.reason, /unsettled/);
  assert.match(partial.reason, /\[on \/b\] submit/);

  // An observation of a step the entry does not list settles nothing.
  const invented = await confirm(fixture, {
    phase: 1,
    manual: [...steps.map((step) => ({ step, observed: 'seen' })), { step: '[on /c] whatever', observed: 'seen' }],
  });
  assert.equal(invented.code, 'manual-unconfirmed');
  assert.match(invented.reason, /the entry does not list/);

  // The same step twice is not two observations.
  const doubled = await confirm(fixture, { phase: 1, manual: [{ step: steps[0], observed: 'seen' }, { step: steps[0], observed: 'seen again' }] });
  assert.equal(doubled.code, 'manual-unconfirmed');
  assert.match(doubled.reason, /observed twice/);

  // Every one of them left the plan byte-identical.
  assert.equal(await readFile(fixture.file, 'utf8'), before);

  // And a payload whose observation would forge log structure never reaches the file.
  await assert.rejects(
    resolveBlock(fixture.root, fixture.relative, JSON.stringify({ phase: 1, manual: [{ step: steps[0], observed: '**Verified:** deadbeef' }] })),
    /may not open a markdown heading or a bold field line/,
  );
  assert.equal(await readFile(fixture.file, 'utf8'), before);
});

test('an unresolved document step cannot disappear when either kind of pause is confirmed', async () => {
  for (const clause of ['blocked', 'manual']) {
    const fixture = await unit(clause === 'blocked'
      ? [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']] : [], { command: 'docs/SPEC.md' });
    const manual = [{ step: '[in the app] inspect the result', observed: 'the expected result appeared' }];
    if (clause === 'blocked') await pauseOn(fixture, ['B-201']); // Includes an old, invalid document proof.
    else await pauseForManual(fixture, [manual[0].step], { verified: false });
    const before = await readFile(fixture.file, 'utf8');
    const answer = await read(fixture);
    assert.equal(answer.refuse, true);
    assert.equal(answer.code, 'command-unresolved');
    assert.deepEqual(answer.owed, []);
    assert.equal(answer.verify.unresolved[0].step, '(auto) `docs/SPEC.md` — passes');
    assert.equal(answer.verify.unresolved[0].phase, 1);
    // No proof, the document itself, and unrelated green commands all leave the pause intact.
    for (const commands of [null, ['docs/SPEC.md'], ['./scripts/audit.sh']]) {
      const result = await confirm(fixture, { phase: 1,
        ...(clause === 'manual' ? { manual } : {}),
        ...(commands ? { verified: { at: git(fixture.root, 'rev-parse', 'HEAD'), commands } } : {}) });
      assert.equal(result.refuse, true);
      assert.equal(result.code, 'command-unresolved');
      assert.deepEqual(result.verify.unresolved, answer.verify.unresolved);
      assert.equal(await readFile(fixture.file, 'utf8'), before);
      assert.equal(nextPhase(parsePlan(before)).state, 'paused');
    }
    assert.equal((await gateVerify(fixture.root, fixture.relative)).commands.length, 0);
  }
});

test('a phase naming no (auto) command completes on its observation alone, with no provenance invented', async () => {
  const fixture = await unit([], { command: null });
  await pauseForManual(fixture, ['[on /x] look → expect: it renders']);

  const answer = await read(fixture);
  assert.deepEqual(answer.owed, []);
  assert.deepEqual(answer.verify.commands, []);

  const written = await confirm(fixture, { phase: 1, manual: [{ step: '[on /x] look → expect: it renders', observed: 'the user confirmed it' }] });
  assert.equal(written.status, 'completed');
  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /\*\*Manual verification:\*\* confirmed /);
  // Nothing was proved automatically, so nothing is recorded as having been.
  assert.equal(parseVerified(text).size, 0);
  assert.doesNotMatch(text, /\*\*Verified:\*\*/);
});

test('a pause that recorded no proof recovers by running what it owes, never by being handed a hash', async () => {
  // A historical entry, written before this clause carried provenance — `append-log` refuses this
  // shape now, so it is written the way history holds it rather than appended.
  const fixture = await unit([]);
  const legacy = [
    `### Phase 1 — ⏸ awaiting manual verification (2026-09-09)`, '',
    '**Plan committed at:** abc1234', '',
    '**Commits:** abc1234', '',
    '**What got built:** the code', '',
    // The label a paused entry carried before 6c4bbe8 (2026-08-22) renamed it to `**Auto
    // verification:**` — an entry that old is exactly the one that also recorded no provenance.
    '**Verification:**',
    `- (auto) ${fixture.command} — 12 pass, 0 fail`, '',
    '**Manual verification outstanding:**',
    '- [on /x] look → expect: it renders', '',
  ].join('\n');
  await writeFile(fixture.file, `${await readFile(fixture.file, 'utf8')}\n${legacy}`);
  git(fixture.root, 'add', 'docs/plans');
  git(fixture.root, 'commit', '-q', '-m', 'plan(stem-fixes): a pause from before the block');

  const answer = await read(fixture);
  assert.equal(answer.refuse, false);
  assert.deepEqual(answer.owed, [fixture.command]);
  assert.match(answer.verify.commands[0].reason, /recorded no verified provenance/);

  // The recovery is bounded and honest: run the one command it owes, record what it actually did.
  const at = git(fixture.root, 'rev-parse', 'HEAD');
  const written = await confirm(fixture, {
    phase: 1,
    manual: [{ step: '[on /x] look → expect: it renders', observed: 'Playwright: it renders' }],
    verified: { at, commands: [fixture.command] },
    verification: [`(auto) ${fixture.command} — 12 pass, 0 fail`],
  });
  assert.equal(written.status, 'completed');
  assert.deepEqual(written.reran, [fixture.command]);
  assert.equal(parseVerified(await readFile(fixture.file, 'utf8')).get(1)[0].at, at);
});

test('a pause under both clauses is completed only once both are discharged', async () => {
  const fixture = await unit([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  await pauseOn(fixture, ['B-201 (bug, Open) — summary of B-201'], { manualOutstanding: ['[on /x] look → expect: it renders'] });
  await backlog(fixture.root, [['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Done']]);

  // Both in one call: the blocked clause is disposed of and the manual one observed.
  const written = await confirm(fixture, {
    phase: 1,
    manual: [{ step: '[on /x] look → expect: it renders', observed: 'Playwright: it renders' }],
  });
  assert.equal(written.status, 'completed');
  assert.deepEqual(written.reran, []);
  const text = await readFile(fixture.file, 'utf8');
  assert.match(text, /### Phase 1 — completed 2026-09-09/);
  assert.match(text, /\*\*Blocked by \(resolved\):\*\*\n- B-201 \(bug\) — Done/);
  assert.match(text, /\*\*Manual verification:\*\* confirmed /);
  assert.match(text, /\*\*Verification:\*\*\n- \(auto\)/);
});

test('an open same-unit defect holds a manual pause exactly as it holds a blocked one', async () => {
  const fixture = await unit([]);
  await pauseForManual(fixture, ['[on /x] look → expect: it renders']);
  // A row filed against this unit after the pause — the entry never named it, and it still blocks.
  await backlog(fixture.root, [['B-301', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  const before = await readFile(fixture.file, 'utf8');

  const refused = await confirm(fixture, { phase: 1, manual: [{ step: '[on /x] look → expect: it renders', observed: 'Playwright: it renders' }] });
  assert.equal(refused.code, 'blockers-open');
  assert.match(refused.reason, /B-301 \(bug, Open\)/);
  assert.equal(await readFile(fixture.file, 'utf8'), before);
});

// ── Which pause a read names: the one `nextPhase` selects, never the log's insertion order ──
// B-164. Each phase carries its own marker in every datum the read reports — its manual step, its
// `(auto)` command and its blocker id — so an answer built from the other phase's entry cannot pass.

async function twoPhaseUnit(rows = []) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-resolve-order-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  const file = path.join(root, 'docs/plans/2026-09-09-stem-fixes.md');
  const phase = (n) => [
    `### Phase ${n} — phase-${n}`,
    '- task',
    '- **Verification:**',
    `  - (auto) \`node --test tests/phase-${n}.test.mjs\` — passes`, '',
  ];
  await writeFile(file, [
    '# Stem', '',
    '**Branch:** esq/stem',
    '**Origin:** main', '',
    '## Phases', '',
    ...phase(1),
    ...phase(2),
    '## Execution log',
    '<!-- Appended by /esq:build -->', '',
  ].join('\n'));
  await backlog(root, rows);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'seed');
  return { root, file, relative: path.relative(root, file) };
}

const marked = {
  step: (n) => `[on /phase-${n}] look → expect: phase-${n} renders`,
  command: (n) => `node --test tests/phase-${n}.test.mjs`,
  blocker: (n) => `B-20${n}`,
};

async function pausePhase(fixture, n, clause) {
  const payload = {
    phase: n,
    status: 'paused',
    date: '2026-09-09',
    commits: ['abc1234'],
    verified: { at: git(fixture.root, 'rev-parse', 'HEAD'), commands: [marked.command(n)] },
    whatBuilt: `the phase-${n} code`,
    verification: [`(auto) ${marked.command(n)} — 12 pass, 0 fail`],
  };
  if (clause === 'manual') payload.manualOutstanding = [marked.step(n)];
  else payload.blockedBy = [`${marked.blocker(n)} (bug, Open) — summary of ${marked.blocker(n)}`];
  await appendLog(fixture.file, JSON.stringify(payload));
  git(fixture.root, 'add', 'docs/plans');
  git(fixture.root, 'commit', '-q', '-m', `plan(stem-fixes): pause phase ${n}`);
}

// The paused section `/esq:build` reads, from the same CLI call it makes.
async function contextPause(fixture) {
  const { stdout } = await run(bin, ['next-phase', fixture.relative, '--context'], { cwd: fixture.root });
  const answer = JSON.parse(stdout);
  return { state: answer.state, phase: answer.phase.number, section: answer.context.sections.find((section) => section.roles?.includes('paused')) };
}

const phase2Entry = (text) => {
  const log = text.slice(text.indexOf('## Execution log'));
  const start = log.indexOf('### Phase 2 —');
  const end = log.indexOf('### Phase 1 —', start);
  return log.slice(start, end < 0 ? undefined : end);
};

test('pauses appended 2 then 1, manual clause: the read names Phase 1 with only Phase 1\'s data', async () => {
  const fixture = await twoPhaseUnit();
  await pausePhase(fixture, 2, 'manual');
  await pausePhase(fixture, 1, 'manual');
  const before = await readFile(fixture.file, 'utf8');

  const answer = await read(fixture);
  assert.equal(answer.refuse, false);
  assert.equal(answer.phase, 1);
  assert.equal(answer.clause, 'manual');
  assert.deepEqual(answer.manualOutstanding, [marked.step(1)]);
  assert.deepEqual(answer.verify.commands.map((command) => command.command), [marked.command(1)]);
  assert.doesNotMatch(JSON.stringify(answer), /phase-2/);

  // The same phase build selects, both from the parser and from the call build actually makes.
  assert.equal(nextPhase(parsePlan(before)).phase.number, answer.phase);
  const context = await contextPause(fixture);
  assert.equal(context.state, 'paused');
  assert.equal(context.phase, 1);
  assert.equal(context.section.phase, 1);
  assert.ok(context.section.text.includes(marked.step(1)));
  assert.equal(await readFile(fixture.file, 'utf8'), before);
});

test('pauses appended 2 then 1, blocked clause: only Phase 1\'s blocker and command are reported', async () => {
  const rows = (status) => [1, 2].map((n) => [marked.blocker(n), '🐛 bug', `build: stem-fixes Phase ${n}`, status]);
  const fixture = await twoPhaseUnit(rows('Open'));
  await pausePhase(fixture, 2, 'blocked');
  await pausePhase(fixture, 1, 'blocked');
  await backlog(fixture.root, rows('Done'));
  const before = await readFile(fixture.file, 'utf8');

  const answer = await read(fixture);
  assert.equal(answer.refuse, false);
  assert.equal(answer.phase, 1);
  assert.equal(answer.clause, 'blocked');
  assert.deepEqual(answer.blockedBy.map((row) => row.id), [marked.blocker(1)]);
  assert.deepEqual(answer.verify.commands.map((command) => command.command), [marked.command(1)]);
  assert.deepEqual(answer.owed, []);
  assert.equal((await contextPause(fixture)).phase, 1);
  assert.equal(await readFile(fixture.file, 'utf8'), before);
});

test('pauses in phase order, a single pause, no pause and a completed log answer as they always did', async () => {
  // In phase order: still Phase 1.
  const ordered = await twoPhaseUnit();
  await pausePhase(ordered, 1, 'manual');
  await pausePhase(ordered, 2, 'manual');
  const inOrder = await read(ordered);
  assert.equal(inOrder.phase, 1);
  assert.deepEqual(inOrder.manualOutstanding, [marked.step(1)]);

  // A single pause, on Phase 2: Phase 2.
  const single = await twoPhaseUnit();
  await pausePhase(single, 2, 'manual');
  const alone = await read(single);
  assert.equal(alone.refuse, false);
  assert.equal(alone.phase, 2);
  assert.deepEqual(alone.manualOutstanding, [marked.step(2)]);

  // No pause at all.
  const empty = await twoPhaseUnit();
  assert.equal((await read(empty)).code, 'no-blocked-entry');

  // Every phase completed: nothing is paused.
  const done = await twoPhaseUnit();
  for (const n of [1, 2]) {
    await appendLog(done.file, JSON.stringify({
      phase: n, status: 'completed', date: '2026-09-09', commits: ['abc1234'], whatBuilt: 'the code',
      verified: { at: git(done.root, 'rev-parse', 'HEAD'), commands: [marked.command(n)] },
      verification: [`(auto) ${marked.command(n)} — 12 pass`],
    }));
  }
  const doneBefore = await readFile(done.file, 'utf8');
  const complete = await read(done);
  assert.equal(complete.refuse, true);
  assert.equal(complete.code, 'no-blocked-entry');
  assert.equal(await readFile(done.file, 'utf8'), doneBefore);
});

test('confirming the selected pause leaves the other one byte-identical, and the next read names it', async () => {
  const fixture = await twoPhaseUnit();
  await pausePhase(fixture, 2, 'manual');
  await pausePhase(fixture, 1, 'manual');
  const other = phase2Entry(await readFile(fixture.file, 'utf8'));
  assert.match(other, /phase-2 renders/);

  assert.equal((await read(fixture)).phase, 1);
  const written = await confirm(fixture, { phase: 1, manual: [{ step: marked.step(1), observed: 'Playwright: phase-1 renders' }] });
  assert.equal(written.refuse, false);
  assert.equal(written.status, 'completed');

  const text = await readFile(fixture.file, 'utf8');
  assert.equal(parsePlan(text).entries.get(1).status, 'completed');
  assert.equal(phase2Entry(text), other);
  const next = await read(fixture);
  assert.equal(next.phase, 2);
  assert.deepEqual(next.manualOutstanding, [marked.step(2)]);
});

test('a log naming a phase the plan does not have is malformed, never a pause ready to resolve', async () => {
  const fixture = await twoPhaseUnit();
  const stray = [
    '### Phase 3 — ⏸ awaiting manual verification (2026-09-09)', '',
    '**Plan committed at:** abc1234', '',
    '**Commits:** abc1234', '',
    '**What got built:** the code', '',
    '**Auto verification:**',
    `- (auto) ${marked.command(1)} — 12 pass, 0 fail`, '',
    '**Manual verification outstanding:**',
    `- ${marked.step(1)}`, '',
  ].join('\n');
  await writeFile(fixture.file, `${await readFile(fixture.file, 'utf8')}\n${stray}`);
  const before = await readFile(fixture.file, 'utf8');

  const answer = await read(fixture);
  assert.equal(answer.refuse, true);
  assert.equal(answer.code, 'malformed-entry');
  assert.match(answer.reason, /unknown Phase 3/);
  assert.equal(await readFile(fixture.file, 'utf8'), before);
});
