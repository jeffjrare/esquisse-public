import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { appendLog, gateVerify, recordVerification } from '../../plugin/lib/cli.mjs';
import { autoSteps, declaredInputs, extractAutoCommand, nextPhase, parsePlan, parseVerified } from '../../plugin/lib/markdown.mjs';

// Real git, in throwaway repositories: what this verb answers is a question about git's own state,
// and a stub would prove only that the stub agrees with itself. No network, no remote, no model run.
// The contributor's own git config cannot change a verdict, and the CLI's test seam is off here.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

async function repo() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-gate-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  await mkdir(path.join(root, 'docs/epics'), { recursive: true });
  await mkdir(path.join(root, 'src'), { recursive: true });
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 1;\n');
  for (const [file, text] of [['docs/BACKLOG.md', '# Backlog\n'], ['docs/DECISIONS.md', '# Decisions\n'], ['docs/ROADMAP.md', '# Roadmap\n'], ['docs/epics/one.md', '# Epic\n']]) {
    await writeFile(path.join(root, file), text);
  }
  commit(root, 'seed');
  return root;
}

function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

// A plan whose phases carry the given verification lists — one array of step strings per phase.
async function plan(root, steps, name = 'p.md') {
  const phases = steps.map((list, index) => [
    `### Phase ${index + 1} — phase ${index + 1}`,
    '- **Tasks:**',
    `  - Task ${index + 1}.1: this bullet mentions \`(auto)\` in prose, which is never a step`,
    '- **Verification:**',
    ...list.map((step) => `  - ${step}`),
    '',
  ].join('\n'));
  const file = path.join(root, 'docs/plans', name);
  await writeFile(file, `# A plan\n\n**Branch:** main\n\n**Origin:** main\n\n## Phases\n\n${phases.join('\n')}\n## Execution log\n<!-- Appended by /esq:build -->\n`);
  commit(root, 'plan: a plan');
  return file;
}

// Log Phase `phase` as completed, proving `commands` on the tree HEAD is at right now, then commit
// the append the way /esq:build does — so the plan file's own diff is an execution-log append.
async function logPhase(root, file, phase, commands) {
  const at = git(root, 'rev-parse', 'HEAD');
  await appendLog(file, JSON.stringify({
    phase, status: 'completed', commits: [at.slice(0, 7)], whatBuilt: 'a thing',
    verification: commands.map((command) => `(auto) ${command} — pass`),
    verified: { at, commands },
  }));
  commit(root, `plan(a-plan): log phase ${phase} execution`);
  return at;
}

const decisions = (report) => Object.fromEntries(report.commands.map((entry) => [entry.command, entry.decision]));

const unrunnable = './scripts/missing-check src/report.txt';
const reportCheck = 'grep -n "TODO" src/report.txt';
const reportCriterion = 'src/report.txt contains no TODO';
const reportStep = (command) => `(auto) \`${command}\` — ${reportCriterion}`;

// The model owns the criterion judgment. This fixture has one explicit criterion: no TODO.
// Exit 1 with empty output proves it; exit 0 with matches disproves it; errors prove nothing.
function checkReport(root) {
  const result = spawnSync('/bin/sh', ['-c', reportCheck], { cwd: root, encoding: 'utf8' });
  return { exit: result.status, pass: result.status === 1 && result.stdout === '' && result.stderr === '' };
}

async function amendReport(file) {
  const before = await readFile(file, 'utf8');
  const [prospective, history] = before.split('## Execution log');
  const amendment = `\nAmendment 2026-09-25: \`${unrunnable}\` is absent; use \`${reportCheck}\` to check the same artifact for absence of TODO.\n`;
  await writeFile(file, prospective.replace(reportStep(unrunnable), reportStep(reportCheck)) + amendment + '## Execution log' + history);
  assert.equal((await readFile(file, 'utf8')).split('## Execution log')[1], history);
  assert.deepEqual(autoSteps(await readFile(file, 'utf8')).map(({ step }) => step), [reportStep(reportCheck)]);
}

test('B-107: build proves the corrected obligation on its committed tree; stale and red stay unproved', async (t) => {
  const root = await repo();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'src/report.txt'), 'ready\n');
  const file = await plan(root, [[reportStep(unrunnable)]]);
  await amendReport(file);
  git(root, 'add', file);
  const tree = git(root, 'write-tree');
  assert.deepEqual(checkReport(root), { exit: 1, pass: true });
  const at = commit(root, 'fix(plan): correct the unrunnable command');
  assert.equal(git(root, 'rev-parse', 'HEAD^{tree}'), tree);
  assert.equal(git(root, 'status', '--porcelain'), '');
  await appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: [at], whatBuilt: 'report',
    verification: [`Original: ${unrunnable}; actual: ${reportCheck}; criterion: ${reportCriterion}; missing script; amended at ${at}; no matches, PASS at exit 1`],
    verified: { at, commands: [reportCheck] } }));
  commit(root, 'plan: record actual verification');
  const proof = parseVerified(await readFile(file, 'utf8')).get(1);
  assert.equal(proof[0].at, at);
  assert.deepEqual(proof[0].commands, [reportCheck]);
  const fresh = await gateVerify(root, file, { unit: true });
  assert.equal(fresh.commands[0].decision, 'reuse');
  assert.equal(fresh.commands[0].verifiedAt, at);
  assert.equal(fresh.commands[0].step, reportStep(reportCheck));

  await writeFile(path.join(root, 'src/report.txt'), 'TODO\n');
  commit(root, 'change: invalidate the proved artifact');
  const stale = await gateVerify(root, file, { unit: true });
  assert.equal(stale.commands[0].decision, 'run');
  assert.match(stale.commands[0].reason, /src\/report.txt changed/);
  assert.deepEqual(checkReport(root), { exit: 0, pass: false });
  // A red is never submitted to either proof writer. The old block is history, not a PASS now.
  assert.deepEqual(parseVerified(await readFile(file, 'utf8')).get(1), proof);
  assert.equal((await gateVerify(root, file, { unit: true })).commands[0].decision, 'run');
});

test('B-107: a historical substitution cannot transfer PASS through a prospective amendment', async (t) => {
  const root = await repo();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'src/report.txt'), 'ready\n');
  const file = await plan(root, [[reportStep(unrunnable)]]);
  // Historical data from the pre-change reproduction, not another execution of that check.
  const oldAt = await logPhase(root, file, 1, [reportCheck]);
  const before = await gateVerify(root, file, { unit: true });
  assert.equal(before.commands[0].command, unrunnable);
  assert.equal(before.commands[0].decision, 'run');
  assert.match(before.commands[0].reason, /green list does not name/);
  await amendReport(file);
  git(root, 'add', file);
  const tree = git(root, 'write-tree');
  const history = (await readFile(file, 'utf8')).split('## Execution log')[1];
  // This exercises fix's existing stage → tree → run → commit → record sequence.
  assert.deepEqual(checkReport(root), { exit: 1, pass: true });
  const at = commit(root, 'fix(plan): amend the historical obligation');
  const amended = await gateVerify(root, file, { unit: true });
  assert.equal(amended.commands[0].command, reportCheck);
  assert.equal(amended.commands[0].decision, 'run');
  assert.match(amended.commands[0].reason, /changed above its ## Execution log/);
  const recorded = await recordVerification(root, file, JSON.stringify({ by: 'B-107 fixture', at, tree, step: reportStep(reportCheck) }));
  assert.equal(recorded.refuse, false);
  commit(root, 'plan: append new proof');
  const text = await readFile(file, 'utf8');
  assert.ok(text.split('## Execution log')[1].startsWith(history));
  assert.deepEqual(parseVerified(text).get(1).map((block) => block.at), [oldAt, at]);
  const fresh = await gateVerify(root, file, { unit: true });
  assert.equal(fresh.commands[0].decision, 'reuse');
  assert.equal(fresh.commands[0].verifiedAt, at);
});

test('B-107: an unjudged unrunnable obligation has no proof and cannot complete without one', async (t) => {
  const root = await repo();
  t.after(() => rm(root, { recursive: true, force: true }));
  // Neither sentence supplies the artifact/property authority for an amendment. The CLI does
  // not judge that ambiguity: it must keep the full obligation and refuse completion sans proof.
  for (const [index, step] of [`(auto) \`${unrunnable}\``, `(auto) \`${unrunnable}\` — report is good`].entries()) {
    const file = await plan(root, [[step]], `ambiguous-${index}.md`);
    const before = await readFile(file, 'utf8');
    const at = git(root, 'rev-parse', 'HEAD');
    await assert.rejects(() => appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: [at],
      whatBuilt: 'report', verification: ['CAN\'T RUN: missing script; no unambiguous criterion'] })), /without its verified provenance/);
    assert.equal(await readFile(file, 'utf8'), before);
    const report = await gateVerify(root, file);
    assert.equal(report.commands[0].step, step);
    assert.equal(report.commands[0].decision, 'run');
    assert.equal(report.commands[0].verifiedAt, null);
    assert.equal(parseVerified(before).size, 0);
  }
});

// The extraction contract, fixture by fixture. A command recovered from plan prose is the input to
// a landing gate that decides what to re-run, so every shape the rule cannot resolve must come back
// `null` — never a guess, and never the marker itself.

test('the command is the single span after the (auto) marker, and never the marker', () => {
  assert.equal(extractAutoCommand('`(auto)` `pnpm test` — the suite is green'), 'pnpm test');
  // The marker's own span is skipped by position, so a step whose property sentence talks *about*
  // `(auto)` still yields the command.
  assert.equal(extractAutoCommand('`(auto)` `pnpm test` — the `(auto)` step is judged PASS'), 'pnpm test');
  // A bare marker, unwrapped, is the older shape and resolves the same way.
  assert.equal(extractAutoCommand('(auto) `pnpm test` — the suite is green'), 'pnpm test');
  // No em dash: the step is its own boundary, which is how `` `cmd` passes `` still resolves.
  assert.equal(extractAutoCommand('`(auto)` `pnpm test` passes'), 'pnpm test');
});

test('an unresolvable step is null, never a guess', () => {
  // No span after the marker at all.
  assert.equal(extractAutoCommand('`(auto)` run the suite by hand — it is green'), null);
  // Two candidate spans before the em dash: which one is the command cannot be proved.
  assert.equal(extractAutoCommand('`(auto)` `pnpm build` and `pnpm test` — both are green'), null);
  // Not an `(auto)` step at all.
  assert.equal(extractAutoCommand('`(manual)` `pnpm test` — a human watches'), null);
  assert.equal(extractAutoCommand(''), null);
  assert.equal(extractAutoCommand(undefined), null);
});

test('a lone Markdown path is unresolved, but executable paths and document arguments survive', () => {
  for (const candidate of ['docs/SPEC.md', './docs/SPEC.md', 'README.md', '/repo/docs/SPEC.md',
    '"docs/Product spec.md"', "'docs/SPEC.md'"]) {
    for (const marker of ['(auto)', '`(auto)`']) {
      assert.equal(extractAutoCommand(`${marker} \`${candidate}\` — the rule is documented`), null, candidate);
    }
  }
  for (const command of ['./scripts/audit.sh', './docs/check', '../tools/check', '/opt/tools/check',
    'node scripts/check.mjs docs/SPEC.md', 'cat docs/SPEC.md', './scripts/audit.sh docs/SPEC.md',
    './scripts/audit.sh && test -f docs/SPEC.md']) {
    assert.equal(extractAutoCommand(`(auto) \`${command}\` — criterion`), command);
  }
  assert.equal(extractAutoCommand('(auto) `docs/SPEC.md` `(reads)` `docs/`'), null);
});

// The declaration contract, fixture by fixture. What a step says its command reads is the only
// thing that can narrow a landing gate's freshness, so every shape this parser cannot read cleanly
// has to come back as `malformed` — ignored by the caller and run — rather than as a shorter list.

test('a step with no (reads) marker declares nothing, which is every plan ever written', () => {
  assert.equal(declaredInputs('`(auto)` `pnpm test` — the suite is green'), null);
  assert.equal(declaredInputs('`(auto)` `pnpm test` — it reads the source and the tests'), null);
  assert.equal(declaredInputs(''), null);
  assert.equal(declaredInputs(undefined), null);
});

// The marker is its own code span and nothing else. A step that merely *mentions* the literal —
// a command that greps for the rule, or a criterion sentence naming it — declares nothing, and
// more importantly is still a command: reading the mention as a marker cut the command span off
// at it, so the step resolved to null, ran unresolved at every landing forever, and slipped past
// `appendLog`'s refusal, which only fires where a phase names a *resolvable* command.
test('a mention of the literal is prose, and leaves the command resolving', () => {
  const greps = '`(auto)` `grep -c "(reads)" README.md` — at least one match';
  assert.equal(extractAutoCommand(greps), 'grep -c "(reads)" README.md');
  assert.equal(declaredInputs(greps), null);

  const prose = '`(auto)` `./scripts/check-reads.sh` — the (reads) rule is pinned in both carriers';
  assert.equal(extractAutoCommand(prose), './scripts/check-reads.sh');
  assert.equal(declaredInputs(prose), null);
});

test('a declaration is the inline-code spans after the marker, deduplicated and trailing-slash-free', () => {
  assert.deepEqual(declaredInputs('`(auto)` `pnpm test` — green `(reads)` `src/`, `tests/one.test.mjs`'), { paths: ['src', 'tests/one.test.mjs'] });
  // `and` is a separator like the comma.
  assert.deepEqual(declaredInputs('`(auto)` `pnpm test` — green `(reads)` `src` and `pkg/lib`'), { paths: ['src', 'pkg/lib'] });
  // `src/` and `src` are one prefix, named twice.
  assert.deepEqual(declaredInputs('`(auto)` `pnpm test` — green `(reads)` `src/`, `src`'), { paths: ['src'] });
});

test('the command still resolves beside a declaration, em dash or not', () => {
  assert.equal(extractAutoCommand('`(auto)` `pnpm test` — green `(reads)` `src/`'), 'pnpm test');
  // No em dash: the declaration closes the command, where the step's own end used to. Without that
  // boundary the declared path would be a second candidate span and the step would run in full.
  assert.equal(extractAutoCommand('`(auto)` `pnpm test` `(reads)` `src/`'), 'pnpm test');
});

test('a declaration that cannot be read cleanly is malformed, never a shorter list', () => {
  const malformed = (step) => declaredInputs(step).malformed;
  // Nothing declared at all.
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)`'), /names no path/);
  // Prose where a path belongs — the one place a path would be described instead of named.
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `src/` and the config it loads'), /prose after its declared paths/);
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `src/` plus `lib/`'), /prose between its declared paths/);
  // Not a repository-relative path.
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `/etc/hosts`'), /absolute path/);
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `../other`'), /does not resolve to a path inside the repository/);
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `./src`'), /does not resolve to a path inside the repository/);
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `src//lib`'), /does not resolve to a path inside the repository/);
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `/`'), /absolute path/);
  // A pattern, not a path: matching is by whole path segment and never a glob, so a glob that
  // looked honoured would narrow the gate on a rule the gate does not implement.
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` `src/*.js`'), /a glob/);
  assert.match(malformed('`(auto)` `pnpm test` — green `(reads)` ``'), /names an empty path/);
});

const PLAN = `# A plan

## Phases

### Phase 1 — one
- **Tasks:**
  - Task 1.1: state that one \`(auto)\` step has exactly one command, in \`the single span\` — prose, not a step
- **Verification:**
  - \`(auto)\` \`node --test tests/one.test.mjs\` — 12 pass
  - \`(auto)\` \`grep -rn "todo" src/\` — no results, which is a pass at exit 1
  - \`(manual)\` [logged in] open /one → expect the badge

### Phase 2 — two
- **Verification:**
  - \`(auto)\` \`node --test tests/one.test.mjs\` — 12 pass, unchanged
  - \`(auto)\` \`pnpm build\` and \`pnpm lint\` — both clean

## Execution log
<!-- Appended by /esq:build -->
`;

test('steps are collected from the verification list only, phase by phase', () => {
  const steps = autoSteps(PLAN);
  assert.deepEqual(steps.map((step) => step.phase), [1, 1, 2, 2]);
  // The task bullet mentioning `(auto)` is prose about the contract, not a step to execute.
  assert.ok(!steps.some((step) => step.step.includes('Task 1.1')));
  // The complete step text travels, criterion included — an exit-1 grep is a PASS and only the
  // sentence says so.
  assert.equal(steps[1].step, '`(auto)` `grep -rn "todo" src/` — no results, which is a pass at exit 1');
  assert.deepEqual(steps.map((step) => extractAutoCommand(step.step)), [
    'node --test tests/one.test.mjs',
    'grep -rn "todo" src/',
    'node --test tests/one.test.mjs',
    null,
  ]);
});

const whitespaceFixture = new URL('./fixtures/landing-command-whitespace.md', import.meta.url);

test('real landing commands retain the exact strings in their historical proof', async () => {
  const text = await readFile(whitespaceFixture, 'utf8');
  const commands = autoSteps(text).map(({ step }) => extractAutoCommand(step));
  assert.equal(commands.length, 8);
  assert.deepEqual(commands, parseVerified(text).get(1)[0].commands);
  assert.ok(commands[3].includes('"^  <'));
});

test('Markdown bullets and continuations preserve spaces and tabs inside commands', () => {
  const command = 'printf "a  b\tc"';
  const continued = 'grep -n "^  <" src/app.js';
  const text = [
    '### Phase 1 — whitespace',
    '- **Verification:**',
    `  - \`(auto)\` \`${command}\``,
    '    — exact output,',
    '    including spaces and tabs',
    '  * `(auto)`',
    '    `grep -n "^  <"',
    '    src/app.js` — a wrapped command',
    '',
    '    prose after a blank line is not a continuation',
    `  - (auto) \`${command}\` — another bullet`,
    '  shallower prose is not a continuation',
    '- **Notes:**',
    '  - `(auto)` `ignored` — outside verification',
  ].join('\n');
  const steps = autoSteps(text);
  assert.deepEqual(steps.map(({ step }) => extractAutoCommand(step)), [command, continued, command]);
  assert.equal(steps[0].step, `\`(auto)\` \`${command}\` — exact output, including spaces and tabs`);
  assert.equal(steps[1].step, `\`(auto)\` \`${continued}\` — a wrapped command`);
  assert.equal(steps[2].step, `(auto) \`${command}\` — another bullet`);
});

test('gate reuse and deduplication distinguish significant whitespace, including proof recording', async () => {
  // Only the proof commit is adapted to the disposable repository. No fixture command is run.
  const text = await readFile(whitespaceFixture, 'utf8');
  const steps = autoSteps(text).map(({ step }) => step);
  const commands = parseVerified(text).get(1)[0].commands;
  const exact = commands[3];
  const different = exact.replace('^  <', '^ <');
  const differentStep = steps[3].replace(exact, different);
  const root = await repo();
  const file = await plan(root, [[...steps, differentStep], [`${steps[3]} Again.`, differentStep]]);
  await logPhase(root, file, 1, commands);
  await logPhase(root, file, 2, [exact]);

  const report = await gateVerify(root, file);
  assert.equal(report.unresolved.length, 0);
  assert.equal(report.commands.length, 9);
  for (const command of commands) assert.equal(decisions(report)[command], 'reuse');
  const original = report.commands.find(({ command }) => command === exact);
  const variant = report.commands.find(({ command }) => command === different);
  assert.deepEqual(original.phases, [1, 2]);
  assert.deepEqual(variant.phases, [1, 2]);
  assert.equal(variant.decision, 'run');
  assert.match(variant.reason, /green list does not name this command/);

  // A verbatim step with significant whitespace must also match record-verification.
  // The same command has a distinct criterion in Phase 2, so this step is unambiguous.
  const at = git(root, 'rev-parse', 'HEAD');
  const recorded = await recordVerification(root, file, JSON.stringify({
    by: 'whitespace regression', at, tree: git(root, 'rev-parse', 'HEAD^{tree}'), step: steps[3],
  }));
  assert.equal(recorded.refuse, false);
  assert.equal(recorded.command, exact);
  assert.deepEqual(parseVerified(await readFile(file, 'utf8')).get(1).at(-1).commands, [exact]);
});

test('unchanged final-tree evidence is reused, and a post-verification implementation commit forces the rerun', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
  await logPhase(root, file, 1, ['pnpm test']);

  const reused = await gateVerify(root, file);
  assert.equal(reused.commands.length, 1);
  assert.equal(reused.commands[0].decision, 'reuse');
  assert.equal(reused.commands[0].verifiedAt.length, 40);
  assert.match(reused.commands[0].reason, /Phase 1 proved it on/);
  // The step travels whole, criterion included: rerunning is not enough if nobody can judge it.
  assert.equal(reused.commands[0].step, '`(auto)` `pnpm test` — the suite is green');

  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  commit(root, 'fix(app): change one');
  const rerun = await gateVerify(root, file);
  assert.equal(rerun.commands[0].decision, 'run');
  assert.match(rerun.commands[0].reason, /src\/app\.js changed since Phase 1 verified/);
});

test('a command three phases name is one entry, and unresolved occurrences are never deduplicated', async () => {
  const root = await repo();
  const file = await plan(root, [
    ['`(auto)` `pnpm test` — the suite is green', '`(auto)` `pnpm build` and `pnpm lint` — both clean'],
    ['`(auto)` `pnpm test` — the suite is green'],
    ['`(auto)` `pnpm test` — the suite is green', '`(auto)` `pnpm build` and `pnpm lint` — both clean'],
  ]);
  const report = await gateVerify(root, file);
  assert.equal(report.commands.length, 1);
  assert.deepEqual(report.commands[0].phases, [1, 2, 3]);
  // Two occurrences of one unresolvable step stay two: their identity cannot be proved, so each runs.
  assert.equal(report.unresolved.length, 2);
  assert.deepEqual(report.unresolved.map((entry) => entry.phase), [1, 3]);
  for (const entry of report.unresolved) {
    assert.equal(entry.resolved, false);
    assert.equal(entry.decision, 'run');
    assert.equal(entry.step, '`(auto)` `pnpm build` and `pnpm lint` — both clean');
  }
});

test('document-only steps stay visible in every gate scope and cannot acquire a proof', async () => {
  const root = await repo();
  const document = '(auto) `docs/SPEC.md` — the product rule is documented';
  const commands = ['./scripts/audit.sh', 'node scripts/check.mjs docs/SPEC.md'];
  const file = await plan(root, [[document, ...commands.map((command) => `(auto) \`${command}\` — passes`)], [document]]);
  // Historical metadata may claim the document itself passed; it must not become reusable proof.
  await logPhase(root, file, 1, ['docs/SPEC.md', ...commands]);
  await logPhase(root, file, 2, ['docs/SPEC.md']);
  for (const options of [{}, { unit: true }, { phase: 2 }]) {
    const report = await gateVerify(root, file, options);
    assert.deepEqual(report.commands.map((entry) => entry.command), options.phase ? [] : commands);
    assert.ok(report.commands.every((entry) => entry.decision === 'reuse'));
    assert.deepEqual(report.unresolved.map((entry) => entry.phase), options.phase ? [2] : [1, 2]);
    for (const entry of report.unresolved) {
      assert.equal(entry.step, document);
      assert.equal(entry.resolved, false);
      assert.equal(entry.decision, 'run');
      assert.equal(entry.plan, path.relative(root, file));
      assert.equal(entry.verifiedAt, undefined);
    }
  }
  // A distinct single occurrence reaches command extraction, rather than the duplicate-step refusal.
  const other = await plan(root, [[document]], 'document.md');
  const refused = await byteIdentical(other, () => record(root, other, proofFor(root, document)));
  assert.equal(refused.refuse, true);
  assert.equal(refused.code, 'command-unresolved');
  assert.equal(parseVerified(await readFile(other, 'utf8')).size, 0);
});

test('logging a pause with a document-only step invents no command provenance', async () => {
  const root = await repo();
  const step = '(auto) `docs/SPEC.md` — the rule is documented';
  const file = await plan(root, [[step]]);
  await appendLog(file, JSON.stringify({ phase: 1, status: 'paused', commits: ['abc1234'],
    whatBuilt: 'the implementation', verification: ['Document step remains unresolved'],
    manualOutstanding: ['[in the app] inspect the result'] }));
  const text = await readFile(file, 'utf8');
  assert.equal(nextPhase(parsePlan(text)).state, 'paused');
  assert.equal(parseVerified(text).size, 0);
  assert.deepEqual((await gateVerify(root, file)).unresolved.map((entry) => entry.step), [step]);
});

test('absent, malformed and unresolvable provenance each force the rerun', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
  // Absent: a plan built before the key existed, or a phase that could not state both halves.
  assert.match((await gateVerify(root, file)).commands[0].reason, /Phase 1 recorded no verified provenance/);

  // Malformed: a mutable ref hand-written into the file. It is refused at append time — and so now is
  // an entry with no block at all — so the only way either reaches a plan is by hand, which is how
  // this entry is written; the gate decides `run` on it rather than trusting it.
  const text = await readFile(file, 'utf8');
  await writeFile(file, `${text}\n### Phase 1 — completed 2026-09-09\n\n**Commits:** abc1234\n\n**Verified:** main\n- \`pnpm test\`\n`);
  commit(root, 'plan(a-plan): log phase 1 execution');
  assert.match((await gateVerify(root, file)).commands[0].reason, /`main`, a name that can move/);

  // A commit no longer in this repository is provenance nobody can check.
  const gone = await repo();
  const other = await plan(gone, [['`(auto)` `pnpm test` — the suite is green']]);
  const absent = await readFile(other, 'utf8');
  await writeFile(other, `${absent}\n### Phase 1 — completed 2026-09-09\n\n**Commits:** abc1234\n\n**Verified:** ${'b'.repeat(40)}\n- \`pnpm test\`\n`);
  commit(gone, 'plan(a-plan): log phase 1 execution');
  assert.match((await gateVerify(gone, other)).commands[0].reason, /is not in this repository/);
});

// What the refusal in `appendLog` buys, counted rather than asserted about: the number of commands
// the landing would have to run. The two plans differ in one thing — whether Phase 1's entry carries
// the block — and that is exactly the entry `appendLog` now refuses to write, so the omission-driven
// rerun is unreachable through the writer rather than merely discouraged.
test('the provenance a phase records is the difference between zero commands to run and one', async () => {
  const runs = (report) => report.commands.filter((entry) => entry.decision === 'run').length;

  const proved = await repo();
  const withBlock = await plan(proved, [['`(auto)` `pnpm test` — the suite is green']]);
  await logPhase(proved, withBlock, 1, ['pnpm test']);
  const reused = await gateVerify(proved, withBlock);
  assert.equal(reused.commands.length, 1);
  assert.equal(runs(reused), 0);

  // The same phase, its entry written the way a worker used to be allowed to write it. `appendLog`
  // refuses this payload now, so the entry has to be hand-written to exist at all.
  const omitted = await repo();
  const noBlock = await plan(omitted, [['`(auto)` `pnpm test` — the suite is green']]);
  await assert.rejects(
    appendLog(noBlock, JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing', verification: ['(auto) pnpm test — pass'] })),
    /Phase 1 cannot log completed without its verified provenance/,
  );
  const text = await readFile(noBlock, 'utf8');
  await writeFile(noBlock, `${text}\n### Phase 1 — completed 2026-09-11\n\n**Commits:** abc1234\n\n**What got built:** a thing\n\n**Verification:**\n- (auto) pnpm test — pass\n`);
  commit(omitted, 'plan(a-plan): log phase 1 execution');
  const rerun = await gateVerify(omitted, noBlock);
  assert.equal(runs(rerun), 1);
  assert.match(rerun.commands[0].reason, /Phase 1 recorded no verified provenance/);

  // And the freshness gate is untouched by any of it: an implementation commit after the proof
  // still costs that command its reuse.
  await writeFile(path.join(proved, 'src/app.js'), 'export const one = 3;\n');
  commit(proved, 'fix(app): change one');
  const stale = await gateVerify(proved, withBlock);
  assert.equal(runs(stale), 1);
  assert.match(stale.commands[0].reason, /src\/app\.js changed since Phase 1 verified/);
});

test('a command absent from the green list is run even where the tree is unchanged', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green', '`(auto)` `pnpm lint` — clean']]);
  await logPhase(root, file, 1, ['pnpm test']);
  const report = await gateVerify(root, file);
  assert.equal(decisions(report)['pnpm test'], 'reuse');
  assert.equal(decisions(report)['pnpm lint'], 'run');
  assert.match(report.commands.find((entry) => entry.command === 'pnpm lint').reason, /green list does not name this command/);
});

test('an expected non-zero PASS is reusable, and its own criterion is what travels', async () => {
  const root = await repo();
  const step = '`(auto)` `grep -rn "todo" src/` — no results, which is a pass at exit 1';
  const file = await plan(root, [[step]]);
  await logPhase(root, file, 1, ['grep -rn "todo" src/']);
  const [entry] = (await gateVerify(root, file)).commands;
  assert.equal(entry.decision, 'reuse');
  assert.equal(entry.step, step);
});

test('a newer fresh occurrence outranks an older stale one and supplies the criterion', async () => {
  const root = await repo();
  const file = await plan(root, [
    ['`(auto)` `pnpm test` — the suite is green'],
    ['`(auto)` `pnpm test` — the suite is green, on the final tree'],
  ]);
  await logPhase(root, file, 1, ['pnpm test']);
  // Phase 2's implementation commit staled Phase 1's evidence; Phase 2's own is fresh.
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'feat(app): phase two');
  await logPhase(root, file, 2, ['pnpm test']);
  const [entry] = (await gateVerify(root, file)).commands;
  assert.equal(entry.decision, 'reuse');
  assert.equal(entry.phase, 2);
  assert.equal(entry.step, '`(auto)` `pnpm test` — the suite is green, on the final tree');
});

test('the harmless set is exactly the command-owned lifecycle, and nothing else', async () => {
  const cases = [
    ['an execution-log-only append', async () => {}, 'reuse'],
    ['another plan', async (root) => { await writeFile(path.join(root, 'docs/plans/other.md'), '# Other\n'); }, 'reuse'],
    ['a corrective brief', async (root) => { await writeFile(path.join(root, 'docs/plans/p-fixes.brief.md'), '# Brief\n'); }, 'reuse'],
    ['the backlog', async (root) => { await writeFile(path.join(root, 'docs/BACKLOG.md'), '# Backlog\n\n| B-001 |\n'); }, 'reuse'],
    ['the decisions ledger', async (root) => { await writeFile(path.join(root, 'docs/DECISIONS.md'), '# Decisions\n\nmore\n'); }, 'reuse'],
    ['the roadmap', async (root) => { await writeFile(path.join(root, 'docs/ROADMAP.md'), '# Roadmap\n\nmore\n'); }, 'run'],
    ['an epic', async (root) => { await writeFile(path.join(root, 'docs/epics/one.md'), '# Epic\n\nmore\n'); }, 'run'],
    ['the plan above its execution log', async (root, file) => {
      const text = await readFile(file, 'utf8');
      await writeFile(file, text.replace('### Phase 1 — phase 1', '### Phase 1 — phase 1 rewritten'));
    }, 'run'],
  ];
  for (const [label, mutate, expected] of cases) {
    const root = await repo();
    const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
    await logPhase(root, file, 1, ['pnpm test']);
    await mutate(root, file);
    // The log-only case already committed its append inside logPhase, so there may be nothing here.
    if (git(root, 'status', '--porcelain') !== '') commit(root, `chore: ${label}`);
    const [entry] = (await gateVerify(root, file)).commands;
    assert.equal(entry.decision, expected, `${label}: ${entry.reason}`);
  }
});


// B-180: these are real checks over data whose location used to exempt every change. Prove both
// halves: unrelated bookkeeping buys no rerun, but changing an input cannot hide a failing command.
for (const [input, declaration] of [
  ['docs/plans/input.md', 'docs/plans/input.md'],
  ['docs/plans/inputs/input.md', 'docs/plans/inputs'],
  ['docs/plans/p-fixes.brief.md', 'docs/plans/p-fixes.brief.md'],
  ['docs/BACKLOG.md', 'docs/BACKLOG.md'],
  ['docs/DECISIONS.md', 'docs/DECISIONS.md'],
  ['docs/plans/input.md', null],
  ['docs/BACKLOG.md', null],
]) {
  test(`changed ${input} invalidates ${declaration ? 'declared' : 'operand'} input proof`, async () => {
    const root = await repo();
    await mkdir(path.dirname(path.join(root, input)), { recursive: true });
    await writeFile(path.join(root, input), '# Good input\n');
    await writeFile(path.join(root, 'check.mjs'), [
      "import assert from 'node:assert/strict';",
      "import { readFileSync } from 'node:fs';",
      `assert.equal(readFileSync(process.argv[2] ?? ${JSON.stringify(input)}, 'utf8'), ${JSON.stringify('# Good input\n')});`,
    ].join('\n'));
    const command = `node check.mjs${declaration ? '' : ` ${input}`}`;
    const reads = declaration ? ` \`(reads)\` \`check.mjs\`, \`${declaration}\`` : '';
    const file = await plan(root, [[`\`(auto)\` \`${command}\` — input is good${reads}`]]);
    const args = ['check.mjs', ...(declaration ? [] : [input])];
    execFileSync(process.execPath, args, { cwd: root, stdio: 'pipe' });
    await logPhase(root, file, 1, [command]);
    // Recording the proof itself, and an unrelated brief, remain reusable.
    await writeFile(path.join(root, 'docs/plans/unrelated.brief.md'), '# Bookkeeping\n');
    commit(root, 'docs: unrelated bookkeeping');
    assert.equal((await gateVerify(root, file)).commands[0].decision, 'reuse');
    await writeFile(path.join(root, input), '# Broken input\n');
    commit(root, 'docs: change a verification input');
    assert.throws(() => execFileSync(process.execPath, args, { cwd: root, stdio: 'pipe' }));
    for (const unit of [false, true]) {
      const [entry] = (await gateVerify(root, file, { unit })).commands;
      assert.equal(entry.decision, 'run', entry.reason);
      assert.ok(entry.reason.includes(`${input} changed`), entry.reason);
    }
  });
}

test('a declared read of the proof plan includes its execution log', async () => {
  const root = await repo();
  await writeFile(path.join(root, 'check.mjs'), [
    "import assert from 'node:assert/strict';",
    "import { readFileSync } from 'node:fs';",
    "assert.ok(!readFileSync('docs/plans/p.md', 'utf8').includes('### Phase 1 — completed'));",
  ].join('\n'));
  const file = await plan(root, [['`(auto)` `node check.mjs` — no completed phase `(reads)` `check.mjs`, `docs/plans/p.md`']]);
  execFileSync(process.execPath, ['check.mjs'], { cwd: root, stdio: 'pipe' });
  await logPhase(root, file, 1, ['node check.mjs']);
  assert.throws(() => execFileSync(process.execPath, ['check.mjs'], { cwd: root, stdio: 'pipe' }));
  const [entry] = (await gateVerify(root, file)).commands;
  assert.equal(entry.decision, 'run', entry.reason);
  assert.match(entry.reason, /docs\/plans\/p.md changed/);
});

// A declared scope narrows one command's freshness and nothing else. Every case below is a case
// where the gate must still run: that is the half worth the fixtures, because the economising half
// only ever costs minutes and this half is what a landing rests on.

test('a change outside what the step declares its command reads no longer stales the proof', async () => {
  const root = await repo();
  const step = '`(auto)` `node --test tests/one.test.mjs` — the suite is green `(reads)` `src/`, `tests/one.test.mjs`';
  const file = await plan(root, [[step]]);
  await logPhase(root, file, 1, ['node --test tests/one.test.mjs']);

  // A README the suite never opens. Without the declaration this is a full rerun.
  await writeFile(path.join(root, 'README.md'), '# Readme\n\nrewritten\n');
  commit(root, 'docs(readme): rewrite');
  const [scoped] = (await gateVerify(root, file)).commands;
  assert.equal(scoped.decision, 'reuse');
  assert.match(scoped.reason, /outside what the step declares this command reads/);

  // The same tree, the same commit, the same command — declaring nothing. This is the control: the
  // decision moved because of the declaration and nothing else.
  const bare = await repo();
  const undeclared = await plan(bare, [['`(auto)` `node --test tests/one.test.mjs` — the suite is green']]);
  await logPhase(bare, undeclared, 1, ['node --test tests/one.test.mjs']);
  await writeFile(path.join(bare, 'README.md'), '# Readme\n\nrewritten\n');
  commit(bare, 'docs(readme): rewrite');
  assert.equal((await gateVerify(bare, undeclared)).commands[0].decision, 'run');
});

test('a change inside the declared set still runs the command, by whole path segment', async () => {
  const cases = [
    ['a file under a declared directory', 'src/app.js', 'run'],
    ['a declared file itself', 'tests/one.test.mjs', 'run'],
    ['a sibling whose name merely starts with a declared one', 'srcloader.js', 'reuse'],
    ['an undeclared directory', 'vendor/x.js', 'reuse'],
  ];
  for (const [label, target, expected] of cases) {
    const root = await repo();
    const file = await plan(root, [['`(auto)` `node --test tests/one.test.mjs` — green `(reads)` `src/`, `tests/one.test.mjs`']]);
    await mkdir(path.join(root, 'tests'), { recursive: true });
    await writeFile(path.join(root, 'tests/one.test.mjs'), 'export const t = 1;\n');
    await mkdir(path.join(root, 'vendor'), { recursive: true });
    await writeFile(path.join(root, 'vendor/x.js'), 'export const v = 1;\n');
    await writeFile(path.join(root, 'srcloader.js'), 'export const s = 1;\n');
    commit(root, 'chore: seed');
    await logPhase(root, file, 1, ['node --test tests/one.test.mjs']);
    await writeFile(path.join(root, target), '// moved\n');
    commit(root, `chore: ${label}`);
    const [entry] = (await gateVerify(root, file)).commands;
    assert.equal(entry.decision, expected, `${label}: ${entry.reason}`);
  }
});

test('a declaration the gate cannot trust is ignored whole, and the command runs', async () => {
  const cases = [
    // Malformed: the parser said so, so nothing is narrowed.
    ['`(auto)` `node --test tests/one.test.mjs` — green `(reads)` `../elsewhere`', /declaration names `\.\.\/elsewhere`/],
    ['`(auto)` `node --test tests/one.test.mjs` — green `(reads)` `src/*`', /declaration names `src\/\*`, a glob/],
    ['`(auto)` `node --test tests/one.test.mjs` — green `(reads)`', /declaration names no path/],
    ['`(auto)` `node --test tests/one.test.mjs` — green `(reads)` `src/` and whatever it loads', /declaration carries prose/],
    // A root-level input the declaration omits — the case the slash-only rail missed entirely.
    ['`(auto)` `node check.mjs` — green `(reads)` `src/`', /does not cover `check\.mjs`, a path the command itself names/],
    // A subcommand is an operand too, because nothing tells it apart from a filename.
    ['`(auto)` `pnpm test src` — green `(reads)` `src/`', /does not cover `test`, a path the command itself names/],
    // A form this gate does not decompose: refused whole rather than interpreted.
    ["`(auto)` `grep -r \"todo\" src/` — green `(reads)` `src/`", /cannot be checked against `\"todo\"`, a token this gate does not decompose/],
    ["`(auto)` `node --test 'tests/*.test.mjs'` — green `(reads)` `tests/`", /cannot be checked against `'tests\/\*\.test\.mjs'`, a token this gate does not decompose/],
    // A short option carrying its value attached reads exactly like a two-letter short cluster, so
    // both are refused: `-Iinc` names `inc/` and skipping it honoured a declaration that omitted it.
    ['`(auto)` `cc -Iinc main.c` — green `(reads)` `main.c`', /cannot be checked against `-Iinc`, a token this gate does not decompose/],
    ['`(auto)` `grep -rn todo src/` — green `(reads)` `src/`', /cannot be checked against `-rn`, a token this gate does not decompose/],
    // Well-formed, but it does not cover a path the command itself names — the likeliest authoring
    // slip there is, a declaration copied from the step beside it.
    ['`(auto)` `node --test tests/one.test.mjs` — green `(reads)` `docs/`', /does not cover `tests\/one\.test\.mjs`, a path the command itself names/],
  ];
  for (const [step, reason] of cases) {
    const root = await repo();
    const file = await plan(root, [[step]]);
    await logPhase(root, file, 1, [extractAutoCommand(step)]);
    await writeFile(path.join(root, 'README.md'), '# Readme\n\nrewritten\n');
    commit(root, 'docs(readme): rewrite');
    const [entry] = (await gateVerify(root, file)).commands;
    assert.equal(entry.decision, 'run', step);
    assert.match(entry.reason, /README\.md changed since Phase 1 verified/);
    assert.match(entry.reason, reason);
  }
});

test('no declaration narrows a check that runs before the paths are consulted', async () => {
  const declared = '`(auto)` `pnpm test src` — green `(reads)` `src/`';
  // An edit above the plan's own `## Execution log` — where the declaration itself lives.
  const root = await repo();
  const file = await plan(root, [[declared]]);
  await logPhase(root, file, 1, ['pnpm test src']);
  const text = await readFile(file, 'utf8');
  await writeFile(file, text.replace('### Phase 1 — phase 1', '### Phase 1 — phase 1 rewritten'));
  commit(root, 'chore: edit the plan above its log');
  const [edited] = (await gateVerify(root, file)).commands;
  assert.equal(edited.decision, 'run');
  assert.match(edited.reason, /changed above its ## Execution log/);

  // A worker that moved HEAD, and a command absent from the green list: both decided before any
  // path is read, so a declaration cannot reach either.
  const second = await repo();
  const other = await plan(second, [[declared, '`(auto)` `pnpm lint` — clean `(reads)` `src/`']]);
  await logPhase(second, other, 1, ['pnpm test src']);
  assert.equal((await gateVerify(second, other, { workersMoved: true })).commands[0].decision, 'run');
  const report = await gateVerify(second, other);
  assert.equal(decisions(report)['pnpm test src'], 'reuse');
  assert.equal(decisions(report)['pnpm lint'], 'run');
  assert.match(report.commands.find((entry) => entry.command === 'pnpm lint').reason, /green list does not name this command/);
});

// ── The measured case ────────────────────────────────────────────────────────
// Shaped on the real one, which is why the eight paths are the real eight. Landing
// `land-resolves-its-worktree` at HEAD 28e6daa required four commands and ran four. Three were
// owed: `worktree-landing.test.mjs` had changed its own file, `branch.test.mjs` had `plugin/lib`
// change under it, and `./scripts/audit.sh` reads both `README.md` and the changed test file. The
// fourth, `node --test tests/cli/merge.test.mjs` proved at 0893d89, was invalidated by exactly the
// paths below — and that suite reads none of them. Counted here rather than reasoned about: the
// command is executed for real whenever the gate says `run`, and the counter is what moves.
const MEASURED_INVALIDATORS = [
  'README.md',
  'docs/ARCHITECTURE.md',
  'docs/CONFORMANCE.md',
  'plugin/skills/land/SKILL.md',
  'scripts/check-conformance.sh',
  'scripts/lib/skill-corpus.sh',
  'scripts/test-conformance-guard.sh',
  'tests/cli/worktree-landing.test.mjs',
];

// A repository carrying a real suite that reads one real module, plus the eight paths it does not.
async function measuredRepo(step) {
  const root = await repo();
  for (const dir of ['plugin/lib', 'plugin/skills/land', 'scripts/lib', 'scripts', 'tests/cli']) {
    await mkdir(path.join(root, dir), { recursive: true });
  }
  await writeFile(path.join(root, 'plugin/lib/thing.mjs'), 'export const answer = 42;\n');
  await writeFile(path.join(root, 'tests/cli/merge.test.mjs'), [
    "import assert from 'node:assert/strict';",
    "import test from 'node:test';",
    "import { answer } from '../../plugin/lib/thing.mjs';",
    "test('the module answers', () => { assert.equal(answer, 42); });",
    '',
  ].join('\n'));
  for (const file of MEASURED_INVALIDATORS) await writeFile(path.join(root, file), 'before\n');
  commit(root, 'chore: seed the suite and the paths it does not read');
  const file = await plan(root, [[step]]);
  await logPhase(root, file, 1, ['node --test tests/cli/merge.test.mjs']);
  return { root, file };
}

// Everything the gate decides `run`, actually run — the counter is executions, not decisions.
// `NODE_TEST_CONTEXT` is scrubbed because this runs *inside* `node --test`: a nested runner that
// inherits it reports to the parent instead of owning its own exit code and comes back 0 on a
// failing suite, which would make every regression below read as caught when none was.
function executeGate(root, report, args = ['--test', 'tests/cli/merge.test.mjs']) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  let executions = 0;
  let failures = 0;
  for (const entry of report.commands) {
    if (entry.decision !== 'run') continue;
    executions += 1;
    try {
      execFileSync(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      failures += 1;
    }
  }
  return { executions, failures };
}

// A command whose only input sits at the repository root, which is the shape the coverage rail used
// to miss entirely: `check.mjs` carries no `/`, so it named no operand, so a declaration that never
// mentioned it was accepted. The PASS recorded here is genuine — the command really runs, and really
// exits 0, before its provenance is written.
async function rootInputRepo(declaration) {
  const root = await repo();
  await writeFile(path.join(root, 'src/unused.txt'), 'unchanged\n');
  await writeFile(path.join(root, 'check.mjs'), "import assert from 'node:assert/strict'; assert.equal(1, 1);\n");
  commit(root, 'chore: seed a root-level command input');
  const file = await plan(root, [[`\`(auto)\` \`node check.mjs\` — exits zero ${declaration}`]]);
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  execFileSync(process.execPath, ['check.mjs'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  await logPhase(root, file, 1, ['node check.mjs']);
  return { root, file };
}

const DECLARED = '`(auto)` `node --test tests/cli/merge.test.mjs` — the merge suite is green `(reads)` `plugin/bin/`, `plugin/lib/`, `plugin/scripts/`, `tests/cli/merge.test.mjs`';
const UNDECLARED = '`(auto)` `node --test tests/cli/merge.test.mjs` — the merge suite is green';

test('the run reason names the whole invalidating set, not only its first path', async () => {
  const { root, file } = await measuredRepo(UNDECLARED);
  for (const target of MEASURED_INVALIDATORS) await writeFile(path.join(root, target), 'after\n');
  commit(root, 'chore: the eight paths that invalidated it');
  const [entry] = (await gateVerify(root, file)).commands;
  // The first path first, so a one-path run reads exactly as it always did; then three more by
  // name and a count of the rest, because the sentence is one a person reads.
  assert.match(entry.reason, /^README\.md changed since Phase 1 verified, and so did /);
  for (const named of MEASURED_INVALIDATORS.slice(1, 4)) assert.ok(entry.reason.includes(named), named);
  assert.match(entry.reason, /and 4 more$/);

  // One path is still one sentence — no list, no count.
  const single = await repo();
  const alone = await plan(single, [['`(auto)` `pnpm test` — the suite is green']]);
  await logPhase(single, alone, 1, ['pnpm test']);
  await writeFile(path.join(single, 'src/app.js'), 'export const one = 9;\n');
  commit(single, 'fix(app): change one');
  assert.equal((await gateVerify(single, alone)).commands[0].reason, 'src/app.js changed since Phase 1 verified');
});

test('the measured rerun: one execution without the declaration, none with it', async () => {
  const before = await measuredRepo(UNDECLARED);
  for (const file of MEASURED_INVALIDATORS) await writeFile(path.join(before.root, file), 'after\n');
  commit(before.root, 'chore: the eight paths that invalidated it');
  const rerun = await gateVerify(before.root, before.file);
  assert.equal(rerun.commands[0].decision, 'run');
  assert.equal(executeGate(before.root, rerun).executions, 1);

  // The same eight commits, the same command, the same suite — declaring what it reads.
  const after = await measuredRepo(DECLARED);
  for (const file of MEASURED_INVALIDATORS) await writeFile(path.join(after.root, file), 'after\n');
  commit(after.root, 'chore: the eight paths that invalidated it');
  const reused = await gateVerify(after.root, after.file);
  assert.equal(reused.commands[0].decision, 'reuse');
  assert.equal(executeGate(after.root, reused).executions, 0);
});

test('a declared input that changes runs the command, and the run still catches the break', async () => {
  // Inside the declared set and harmless: it runs, and it passes.
  const kept = await measuredRepo(DECLARED);
  await writeFile(path.join(kept.root, 'plugin/lib/thing.mjs'), 'export const answer = 42; // touched\n');
  commit(kept.root, 'refactor(lib): touch the module the suite reads');
  const ran = await gateVerify(kept.root, kept.file);
  assert.equal(ran.commands[0].decision, 'run');
  assert.deepEqual(executeGate(kept.root, ran), { executions: 1, failures: 0 });

  // Inside the declared set and breaking: the same run is what catches it. Reuse never hides a
  // regression, because a regression can only arrive through a declared path.
  const broken = await measuredRepo(DECLARED);
  await writeFile(path.join(broken.root, 'plugin/lib/thing.mjs'), 'export const answer = 41;\n');
  commit(broken.root, 'fix(lib): break the module the suite reads');
  const caught = await gateVerify(broken.root, broken.file);
  assert.equal(caught.commands[0].decision, 'run');
  assert.deepEqual(executeGate(broken.root, caught), { executions: 1, failures: 1 });
});

test('a long flag and a single short flag still decompose, so the declaration is honoured', async () => {
  for (const [step, command] of [
    ['`(auto)` `node --test tests/one.test.mjs` — green `(reads)` `tests/one.test.mjs`', 'node --test tests/one.test.mjs'],
    ['`(auto)` `node -e tests/one.test.mjs` — green `(reads)` `tests/one.test.mjs`', 'node -e tests/one.test.mjs'],
    ['`(auto)` `node --loader=tests/hook.mjs tests/one.test.mjs` — green `(reads)` `tests/`', 'node --loader=tests/hook.mjs tests/one.test.mjs'],
  ]) {
    const root = await repo();
    const file = await plan(root, [[step]]);
    await mkdir(path.join(root, 'tests'), { recursive: true });
    await writeFile(path.join(root, 'tests/one.test.mjs'), 'export const t = 1;\n');
    await writeFile(path.join(root, 'tests/hook.mjs'), 'export const h = 1;\n');
    commit(root, 'chore: seed');
    await logPhase(root, file, 1, [command]);
    await writeFile(path.join(root, 'README.md'), '# Readme\n\nrewritten\n');
    commit(root, 'docs(readme): rewrite');
    const [entry] = (await gateVerify(root, file)).commands;
    assert.equal(entry.decision, 'reuse', `${command}: ${entry.reason}`);
  }
});

test('a root-level command input the declaration omits is caught, and the break with it', async () => {
  // The wrong declaration: `src/` names nothing the command reads, and `check.mjs` is never in it.
  const wrong = await rootInputRepo('`(reads)` `src/`');
  await writeFile(path.join(wrong.root, 'check.mjs'), "import assert from 'node:assert/strict'; assert.equal(1, 2);\n");
  commit(wrong.root, 'fix: break the file the command names');
  const caught = await gateVerify(wrong.root, wrong.file);
  assert.equal(caught.commands[0].decision, 'run');
  assert.match(caught.commands[0].reason, /does not cover `check\.mjs`, a path the command itself names/);
  // And the run that follows really fails, which is the whole point of not reusing here.
  assert.deepEqual(executeGate(wrong.root, caught, ['check.mjs']), { executions: 1, failures: 1 });

  // The same shape declared honestly still buys its reuse: the changed file is outside the set.
  const right = await rootInputRepo('`(reads)` `check.mjs`');
  await writeFile(path.join(right.root, 'src/unused.txt'), 'changed\n');
  commit(right.root, 'chore: touch something the command does not read');
  const reused = await gateVerify(right.root, right.file);
  assert.equal(reused.commands[0].decision, 'reuse');
  assert.equal(executeGate(right.root, reused, ['check.mjs']).executions, 0);

  // And a change to the declared root-level file still runs it.
  await writeFile(path.join(right.root, 'check.mjs'), "import assert from 'node:assert/strict'; assert.equal(1, 2);\n");
  commit(right.root, 'fix: break the declared file');
  const rerun = await gateVerify(right.root, right.file);
  assert.equal(rerun.commands[0].decision, 'run');
  assert.deepEqual(executeGate(right.root, rerun, ['check.mjs']), { executions: 1, failures: 1 });
});

test('--workers-moved forces every command, whatever the paths say', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
  await logPhase(root, file, 1, ['pnpm test']);
  assert.equal((await gateVerify(root, file)).commands[0].decision, 'reuse');
  const moved = await gateVerify(root, file, { workersMoved: true });
  assert.equal(moved.workersMoved, true);
  assert.equal(moved.commands[0].decision, 'run');
  assert.match(moved.commands[0].reason, /moved HEAD/);
});

// ── A phase records more than one block ──────────────────────────────────────
// `/esq:build` writes one with the entry; `esq plan record-verification` appends another when
// `/esq:fix` re-proves a step on a newer tree. The reader has to see both, and the gate has to judge
// each on its own `at` — a stale first block that shadowed a fresh second one would leave the gate
// re-running a command the unit has already proved green, which is the whole cost this transmission
// removes. A plan carrying one block per phase must still gate byte-identically.

// Append a second `**Verified:**` block to a phase, under its own `### Phase N — reverified` heading,
// exactly as `esq plan record-verification` writes it — then commit it as the bookkeeping append.
async function appendReverified(root, file, phase, at, commands, by = 'a-fixes-brief item 1') {
  const text = await readFile(file, 'utf8');
  const block = [
    `### Phase ${phase} — reverified 2026-09-18`,
    '',
    `**Reverified by:** ${by}`,
    '',
    `**Verified:** ${at}`,
    ...commands.map((command) => `- \`${command}\``),
    '',
  ].join('\n');
  await writeFile(file, `${text.replace(/\s*$/, '\n')}\n${block}`);
  commit(root, `docs(plan): record ${phase}`);
}

test('one block per phase gates exactly as it always did', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
  const at = await logPhase(root, file, 1, ['pnpm test']);
  const verified = parseVerified(await readFile(file, 'utf8'));
  // The shape is a list, and a one-proof phase is a list of one.
  assert.deepEqual(verified.get(1), [{ phase: 1, at, commands: ['pnpm test'] }]);
  const report = await gateVerify(root, file);
  assert.equal(report.commands.length, 1);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, at);
});

test('a second block on a phase is judged on its own at, never shadowed by the first', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
  const stale = await logPhase(root, file, 1, ['pnpm test']);

  // A fix lands: the build's block is now stale, and the gate says so.
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 2;\n');
  const fixed = commit(root, 'fix(app): correct the constant');
  assert.equal((await gateVerify(root, file)).commands[0].decision, 'run');

  // The fix records what it re-proved on that very commit. Both blocks are now readable, in order.
  await appendReverified(root, file, 1, fixed, ['pnpm test']);
  const blocks = parseVerified(await readFile(file, 'utf8')).get(1);
  assert.deepEqual(blocks.map((block) => block.at), [stale, fixed]);

  // The newer proof decides, and the older one neither shadows it nor reads as fresh.
  const report = await gateVerify(root, file);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, fixed);
});

test('a second block older than the first leaves the freshest proof deciding', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
  const older = git(root, 'rev-parse', 'HEAD');
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 3;\n');
  commit(root, 'feat(app): move on');
  const newer = await logPhase(root, file, 1, ['pnpm test']);
  // An out-of-order append, naming a commit the phase's own entry already outranks.
  await appendReverified(root, file, 1, older, ['pnpm test']);
  const report = await gateVerify(root, file);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, newer);
});

test('a block whose commands do not name the command leaves the other block deciding', async () => {
  const root = await repo();
  const file = await plan(root, [['`(auto)` `pnpm test` — the suite is green']]);
  const at = await logPhase(root, file, 1, ['pnpm test']);
  await appendReverified(root, file, 1, at, ['pnpm lint']);
  const report = await gateVerify(root, file);
  assert.equal(report.commands.length, 1);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, at);
});

// ── `esq plan record-verification` ───────────────────────────────────────────
// The writer of the second block. Every refusal below must leave the plan byte-identical and record
// nothing at all: a proof the verb cannot attribute, cannot resolve to one command, or cannot tie to
// the tree its commit carries is a proof that never enters the ledger, and the landing gate then
// re-runs that command exactly as it does today.

const STEP_ONE = '`(auto)` `pnpm test` — the suite is green';
const STEP_TWO = '`(auto)` `pnpm test` — the suite is green and reports 24 tests';

// A plan whose phases carry `steps`, with Phase 1..N each logged completed on the current tree.
async function recorded(steps, { logged = null } = {}) {
  const root = await repo();
  const file = await plan(root, steps);
  for (const phase of logged ?? steps.map((_, index) => index + 1)) {
    await logPhase(root, file, phase, [extractAutoCommand(steps[phase - 1][0])].filter(Boolean));
  }
  return { root, file };
}

// The payload a fix would build after committing: HEAD, HEAD's own tree, the step verbatim.
function proofFor(root, step, by = 'webhooks-fixes item 1') {
  const at = git(root, 'rev-parse', 'HEAD');
  return { by, at, tree: git(root, 'rev-parse', `${at}^{tree}`), step };
}

const record = (root, file, payload) => recordVerification(root, file, JSON.stringify(payload));

async function byteIdentical(file, run) {
  const before = await readFile(file, 'utf8');
  const result = await run();
  assert.equal(await readFile(file, 'utf8'), before, 'the plan file must be byte-identical after a refusal');
  return result;
}

test('a proof is recorded against the phase whose step text it names', async () => {
  const { root, file } = await recorded([[STEP_ONE]]);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 4;\n');
  commit(root, 'fix(app): correct the constant');
  const payload = proofFor(root, STEP_ONE);
  const result = await record(root, file, payload);
  assert.equal(result.refuse, false);
  assert.equal(result.phase, 1);
  assert.equal(result.command, 'pnpm test');

  const text = await readFile(file, 'utf8');
  assert.match(text, /^### Phase 1 — reverified \d{4}-\d{2}-\d{2}$/m);
  assert.match(text, /^\*\*Reverified by:\*\* webhooks-fixes item 1$/m);
  // Read back as Phase 1's second block, and judged fresh where the build's is stale.
  assert.deepEqual(parseVerified(text).get(1).map((block) => block.at).slice(-1), [payload.at]);
  commit(root, 'docs(plan): record the proof');
  const report = await gateVerify(root, file);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, payload.at);
});

test('the payload is refused before the plan is opened', async () => {
  const { root, file } = await recorded([[STEP_ONE]]);
  const good = proofFor(root, STEP_ONE);
  await assert.rejects(() => recordVerification(root, file, '{'), /not valid JSON/);
  await assert.rejects(() => record(root, file, { ...good, extra: 1 }), /"extra" is not accepted/);
  for (const key of ['by', 'at', 'tree', 'step']) {
    const missing = { ...good };
    delete missing[key];
    await assert.rejects(() => record(root, file, missing), new RegExp(`"${key}" is required`));
  }
  await assert.rejects(() => record(root, file, { ...good, at: 'HEAD' }), /a name, not provenance/);
  await assert.rejects(() => record(root, file, { ...good, tree: good.tree.slice(0, 7) }), /a name, not provenance/);
  await assert.rejects(() => record(root, file, { ...good, by: '' }), /"by" must be a non-empty string/);
  await assert.rejects(() => record(root, file, { ...good, by: '**Verified:** forged' }), /may not open a markdown heading/);
  await assert.rejects(() => record(root, file, { ...good, step: '   ' }), /copied verbatim/);
});

test('a step no phase carries, and one two phases carry, each record nothing', async () => {
  const { root, file } = await recorded([[STEP_ONE], [STEP_TWO]]);
  const unknown = await byteIdentical(file, () => record(root, file, proofFor(root, '`(auto)` `pnpm lint` — clean')));
  assert.equal(unknown.refuse, true);
  assert.equal(unknown.code, 'step-unknown');

  // Two phases naming the same *command* under different criteria: attribution is by step, so the
  // step whose criterion was not met records nothing and the other records normally.
  const one = await record(root, file, proofFor(root, STEP_ONE));
  assert.equal(one.phase, 1);

  // One step *text* carried by two phases is ambiguous, and names both.
  const twice = await recorded([[STEP_ONE], [STEP_ONE]]);
  const ambiguous = await byteIdentical(twice.file, () => record(twice.root, twice.file, proofFor(twice.root, STEP_ONE)));
  assert.equal(ambiguous.refuse, true);
  assert.equal(ambiguous.code, 'step-ambiguous');
  assert.deepEqual(ambiguous.phases, [1, 2]);
  assert.match(ambiguous.reason, /Phases 1, 2/);
});

test('a step resolving to no single command records nothing', async () => {
  const unresolvable = '`(auto)` run `pnpm test` and `pnpm lint` — both are green';
  const { root, file } = await recorded([[unresolvable]], { logged: [] });
  await logPhase(root, file, 1, ['pnpm test']);
  const refused = await byteIdentical(file, () => record(root, file, proofFor(root, unresolvable)));
  assert.equal(refused.code, 'command-unresolved');
});

test('a commit that is not HEAD, not in the repository, or carrying another tree records nothing', async () => {
  const { root, file } = await recorded([[STEP_ONE]]);
  const good = proofFor(root, STEP_ONE);

  const absent = await byteIdentical(file, () => record(root, file, { ...good, at: 'a'.repeat(40) }));
  assert.equal(absent.code, 'commit-unknown');

  // A commit that exists but is behind HEAD: the tree it carries is not the tree that was judged.
  const parent = git(root, 'rev-parse', 'HEAD~1');
  const behind = await byteIdentical(file, () => record(root, file, { ...good, at: parent, tree: git(root, 'rev-parse', `${parent}^{tree}`) }));
  assert.equal(behind.code, 'not-head');

  // The tautology rail: `tree` comes from the payload, so a tree the commit does not carry refuses.
  const mismatch = await byteIdentical(file, () => record(root, file, { ...good, tree: git(root, 'rev-parse', `${parent}^{tree}`) }));
  assert.equal(mismatch.code, 'tree-mismatch');
});

test('an edit between write-tree and the commit is exactly what the tree equality catches', async () => {
  const { root, file } = await recorded([[STEP_ONE]]);
  // The tree as staged when the verification ran…
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 5;\n');
  git(root, 'add', '-A');
  const tested = git(root, 'write-tree');
  // …then a file edited and staged before the commit, so the commit carries a different tree.
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 6;\n');
  const at = commit(root, 'fix(app): a tree nobody verified');
  const caught = await byteIdentical(file, () => record(root, file, { by: 'x', at, tree: tested, step: STEP_ONE }));
  assert.equal(caught.code, 'tree-mismatch');
});

test('a dirty working tree records nothing', async () => {
  const { root, file } = await recorded([[STEP_ONE]]);
  const good = proofFor(root, STEP_ONE);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 7;\n');
  const dirty = await byteIdentical(file, () => record(root, file, good));
  assert.equal(dirty.code, 'tree-dirty');
});

test('a phase with no execution-log entry, and a plan with no log section, record nothing', async () => {
  const { root, file } = await recorded([[STEP_ONE], [STEP_TWO]], { logged: [1] });
  const unlogged = await byteIdentical(file, () => record(root, file, proofFor(root, STEP_TWO)));
  assert.equal(unlogged.code, 'no-entry');
  assert.equal(unlogged.phase, 2);

  const bare = await repo();
  const noLog = path.join(bare, 'docs/plans/n.md');
  await writeFile(noLog, '# A plan\n\n**Branch:** main\n\n## Phases\n\n### Phase 1 — one\n\n- **Verification:**\n  - ' + STEP_ONE + '\n');
  commit(bare, 'plan: no log');
  const refused = await byteIdentical(noLog, () => record(bare, noLog, proofFor(bare, STEP_ONE)));
  assert.equal(refused.code, 'no-log');
});

test('two proofs of one step across two commits append two blocks, never a duplicate', async () => {
  const { root, file } = await recorded([[STEP_ONE]]);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 8;\n');
  commit(root, 'fix(app): the first item');
  const first = proofFor(root, STEP_ONE);
  assert.equal((await record(root, file, first)).refuse, false);
  commit(root, 'docs(plan): record the first proof');

  await writeFile(path.join(root, 'src/app.js'), 'export const one = 9;\n');
  commit(root, 'fix(app): the second item');
  const second = proofFor(root, STEP_ONE);
  assert.equal((await record(root, file, second)).refuse, false);
  commit(root, 'docs(plan): record the second proof');

  // Three blocks on the phase — the build's and one per item — each with its own commit, and the
  // freshest deciding. The `already-recorded` guard below the `at` must be HEAD rail is unreachable
  // by construction: a block naming HEAD's oid cannot be inside HEAD's own tree.
  const blocks = parseVerified(await readFile(file, 'utf8')).get(1);
  assert.equal(blocks.length, 3);
  assert.equal(new Set(blocks.map((block) => block.at)).size, 3);
  assert.deepEqual(blocks.map((block) => block.at).slice(1), [first.at, second.at]);
  const report = await gateVerify(root, file);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, second.at);
});

test('a Phase 1 proof appended after Phase 2 entry is still attributed to Phase 1', async () => {
  // The real attribution test. `parseVerified` keys on the nearest `### Phase N — ` heading above a
  // block, and the block this verb writes carries its own — so the insertion point is readability,
  // and the heading is what has to be right.
  const { root, file } = await recorded([[STEP_ONE], [STEP_TWO]]);
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 9;\n');
  commit(root, 'fix(app): a change');
  const result = await record(root, file, proofFor(root, STEP_ONE));
  assert.equal(result.phase, 1);

  const text = await readFile(file, 'utf8');
  const blocks = parseVerified(text);
  assert.equal(blocks.get(1).length, 2);
  assert.equal(blocks.get(2).length, 1);
  assert.equal(blocks.get(1).at(-1).at, result.at);
  // And the proof genuinely sits inside Phase 1's entry, above Phase 2's.
  assert.ok(text.indexOf('### Phase 1 — reverified') < text.indexOf('### Phase 2 — completed'));

  // Written at the end of the log instead, the heading still attributes it to Phase 1 — which is
  // what makes the placement a readability choice rather than a rail.
  const moved = text.replace(/### Phase 1 — reverified[\s\S]*?(?=\n### Phase 2 — completed)/, '').replace(/\s*$/, '\n')
    + `\n### Phase 1 — reverified 2026-09-18\n\n**Reverified by:** x\n\n**Verified:** ${result.at}\n- \`pnpm test\`\n`;
  const after = parseVerified(moved);
  assert.equal(after.get(1).length, 2);
  assert.equal(after.get(1).at(-1).at, result.at);
  assert.equal(after.get(2).length, 1);
});

test('the reverified heading is invisible to every other reader of the log span', async () => {
  const { root, file } = await recorded([[STEP_ONE], [STEP_TWO]], { logged: [1] });
  await writeFile(path.join(root, 'src/app.js'), 'export const one = 10;\n');
  commit(root, 'fix(app): a change');
  await record(root, file, proofFor(root, STEP_ONE));
  const text = await readFile(file, 'utf8');
  const parsed = parsePlan(text);
  // `parsePlan` sees one entry, so Phase 2 is still the next phase and Phase 1 still refuses a
  // second entry — the duplicate-entry rail `appendLog` routes off.
  assert.deepEqual([...parsed.entries.keys()], [1]);
  assert.equal(nextPhase(parsed).phase.number, 2);
  await assert.rejects(() => appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'x', verification: ['(auto) pnpm test — pass'], verified: { at: 'b'.repeat(40), commands: ['pnpm test'] } })), /already has an execution-log entry/);
  // And an entry appended below it still lands after the block, leaving attribution intact.
  await appendLog(file, JSON.stringify({ phase: 2, status: 'completed', commits: ['abc1234'], whatBuilt: 'x', verification: ['(auto) pnpm test — pass'], verified: { at: git(root, 'rev-parse', 'HEAD'), commands: ['pnpm test'] } }));
  const blocks = parseVerified(await readFile(file, 'utf8'));
  assert.equal(blocks.get(1).length, 2);
  assert.equal(blocks.get(2).length, 1);
});

// ── The measured case: a fix's proof surviving to the landing gate ───────────
// The whole point of the verb, counted rather than reasoned about. One green item whose verification
// *is* the plan's own `(auto)` step: the command runs once inside the fix, and the landing gate then
// either reuses that proof or buys a second execution over a tree it has already passed on. The
// counter is what moves, and the command is really executed every time it is counted.

const FIX_STEP = '`(auto)` `node --test tests/cli/merge.test.mjs` — the merge suite is green';

// A repository carrying a real suite over a real module, with Phase 1 logged completed on the seed.
async function fixRepo() {
  const root = await repo();
  for (const dir of ['plugin/lib', 'tests/cli']) await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, 'plugin/lib/thing.mjs'), 'export const answer = 42;\n');
  await writeFile(path.join(root, 'tests/cli/merge.test.mjs'), [
    "import assert from 'node:assert/strict';",
    "import test from 'node:test';",
    "import { answer } from '../../plugin/lib/thing.mjs';",
    "test('the module answers', () => { assert.ok(answer > 0); });",
    '',
  ].join('\n'));
  commit(root, 'chore: seed the suite and the module it reads');
  const file = await plan(root, [[FIX_STEP]]);
  await logPhase(root, file, 1, ['node --test tests/cli/merge.test.mjs']);
  return { root, file };
}

// The command of the step, executed for real. `counter.runs` is the number this whole scenario is
// about; `NODE_TEST_CONTEXT` is scrubbed for the reason the measured gate harness above scrubs it.
function runStep(root, counter) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  counter.runs += 1;
  try {
    execFileSync(process.execPath, ['--test', 'tests/cli/merge.test.mjs'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch { return false; }
}

// A pre-commit hook that refuses while the sentinel file exists — the way a real repository's hook
// refuses a commit, so the failure is git's own rather than a simulated one.
async function refuseCommits(root, sentinel = 'refuse-commit') {
  const hook = path.join(root, '.git/hooks/pre-commit');
  await writeFile(hook, `#!/bin/sh\n[ -e "$(git rev-parse --git-dir)/${sentinel}" ] && exit 1\nexit 0\n`, { mode: 0o755 });
  const dir = git(root, 'rev-parse', '--git-dir');
  return {
    on: () => writeFile(path.join(root, dir, sentinel), ''),
    off: () => execFileSync('rm', ['-f', path.join(root, dir, sentinel)]),
  };
}

// The cycle "Record the proof you earned" prescribes, with **no recovery chained behind it**. It
// returns which of the three issues it is in; nothing here ever issues a checkout, reset or clean.
async function proofCycle(root, file, { files, message, step, by, counter, record = true }) {
  git(root, 'add', ...files);
  // Nothing unstaged the command could read, or there is nothing honest to certify.
  const unstaged = git(root, 'status', '--porcelain').split('\n').filter((line) => line.trim() !== '' && line[1] !== ' ');
  if (unstaged.length > 0) return { issue: 'unstaged', unstaged };
  const tree = git(root, 'write-tree');
  const green = runStep(root, counter);
  // A green that fails verification is reverted and never committed — the loop's step 5 discards
  // the item's edits and bumps it to 🟡, so nothing red ever reaches a commit.
  if (!green) {
    git(root, 'restore', '--staged', '--worktree', ...files);
    return { issue: 'verification-failed', head: git(root, 'rev-parse', 'HEAD') };
  }
  try { git(root, 'commit', '-q', '-m', message); }
  catch (error) { return { issue: 'fix-commit-failed', head: git(root, 'rev-parse', 'HEAD'), status: git(root, 'status', '--porcelain'), error: String(error.status) }; }
  const at = git(root, 'rev-parse', 'HEAD');
  if (!record) return { issue: 'committed-without-proof', at };
  const result = await recordVerification(root, file, JSON.stringify({ by, at, tree, step }));
  if (result.refuse) return { issue: 'refused', at, code: result.code, reason: result.reason };
  git(root, 'add', file);
  try { git(root, 'commit', '-q', '-m', `docs(plan): record the verification of ${by}`); }
  catch { return { issue: 'proof-commit-failed', at, head: git(root, 'rev-parse', 'HEAD'), status: git(root, 'status', '--porcelain') }; }
  return { issue: 'recorded', at, tree, proof: git(root, 'rev-parse', 'HEAD') };
}

test('the measured case: one execution across fix and land, where today it is two', async () => {
  // Today — the fix records nothing, so the landing gate re-runs the command over the tree the fix
  // already proved it green on.
  const today = await fixRepo();
  const before = { runs: 0 };
  await writeFile(path.join(today.root, 'plugin/lib/thing.mjs'), 'export const answer = 43;\n');
  const unrecorded = await proofCycle(today.root, today.file, {
    files: ['plugin/lib/thing.mjs'], message: 'fix(thing): correct the answer', step: FIX_STEP, by: 'p-fixes item 1', counter: before, record: false,
  });
  assert.equal(unrecorded.issue, 'committed-without-proof');
  const stale = await gateVerify(today.root, today.file);
  assert.equal(stale.commands[0].decision, 'run');
  assert.deepEqual(executeGate(today.root, stale), { executions: 1, failures: 0 });
  assert.equal(before.runs + 1, 2, 'today the command is executed twice for one tree');

  // With the proof recorded, the gate reuses it and the command is executed once, in the fix.
  const now = await fixRepo();
  const after = { runs: 0 };
  await writeFile(path.join(now.root, 'plugin/lib/thing.mjs'), 'export const answer = 43;\n');
  const recorded_now = await proofCycle(now.root, now.file, {
    files: ['plugin/lib/thing.mjs'], message: 'fix(thing): correct the answer', step: FIX_STEP, by: 'p-fixes item 1', counter: after,
  });
  assert.equal(recorded_now.issue, 'recorded');
  const fresh = await gateVerify(now.root, now.file);
  assert.equal(fresh.commands[0].decision, 'reuse');
  assert.equal(fresh.commands[0].verifiedAt, recorded_now.at);
  assert.deepEqual(executeGate(now.root, fresh), { executions: 0, failures: 0 });
  assert.equal(after.runs + 0, 1, 'the command is executed once, and the landing reuses that result');
});

test('the refusals still refuse, and land re-runs exactly as it does today', async () => {
  // A relevant input changed after the proof.
  const changed = await fixRepo();
  const counter = { runs: 0 };
  await writeFile(path.join(changed.root, 'plugin/lib/thing.mjs'), 'export const answer = 44;\n');
  await proofCycle(changed.root, changed.file, { files: ['plugin/lib/thing.mjs'], message: 'fix(thing): one', step: FIX_STEP, by: 'item 1', counter });
  await writeFile(path.join(changed.root, 'plugin/lib/thing.mjs'), 'export const answer = -1;\n');
  commit(changed.root, 'chore: a later change the proof never saw');
  const after = await gateVerify(changed.root, changed.file);
  assert.equal(after.commands[0].decision, 'run');
  // And the rerun catches the break, which is what makes `run` the right answer.
  assert.deepEqual(executeGate(changed.root, after), { executions: 1, failures: 1 });

  // A fix that verified red commits nothing and records nothing — the item is reverted and bumped.
  const red = await fixRepo();
  const redCounter = { runs: 0 };
  const redHead = git(red.root, 'rev-parse', 'HEAD');
  await writeFile(path.join(red.root, 'plugin/lib/thing.mjs'), 'export const answer = -2;\n');
  const outcome = await proofCycle(red.root, red.file, { files: ['plugin/lib/thing.mjs'], message: 'fix(thing): a red one', step: FIX_STEP, by: 'item 1', counter: redCounter });
  assert.equal(outcome.issue, 'verification-failed');
  assert.equal(git(red.root, 'rev-parse', 'HEAD'), redHead, 'nothing was committed');
  assert.equal(git(red.root, 'status', '--porcelain'), '', 'the item edits were discarded');
  assert.equal(parseVerified(await readFile(red.file, 'utf8')).get(1).length, 1, 'Phase 1 still carries exactly one **Verified:** block');
  // HEAD never moved, so the build's own proof is still fresh: the failed attempt leaves the gate
  // exactly as it found it.
  assert.equal((await gateVerify(red.root, red.file)).commands[0].decision, 'reuse');

  // A step the plan never names records nothing, and nothing is re-run to produce a proof.
  const narrower = await fixRepo();
  await writeFile(path.join(narrower.root, 'plugin/lib/thing.mjs'), 'export const answer = 45;\n');
  const refused = await proofCycle(narrower.root, narrower.file, {
    files: ['plugin/lib/thing.mjs'], message: 'fix(thing): narrower', step: '`(auto)` `node --test tests/cli/merge.test.mjs` — one test passes', by: 'item 1', counter: { runs: 0 },
  });
  assert.equal(refused.issue, 'refused');
  assert.equal(refused.code, 'step-unknown');
  assert.equal(git(narrower.root, 'status', '--porcelain'), '', 'a refusal leaves nothing staged');
  assert.equal((await gateVerify(narrower.root, narrower.file)).commands[0].decision, 'run');
});

test('two green items in a row: each proof on its own tree, no append lost, tree clean at exit', async () => {
  const { root, file } = await fixRepo();
  const counter = { runs: 0 };
  await writeFile(path.join(root, 'plugin/lib/thing.mjs'), 'export const answer = 46;\n');
  const first = await proofCycle(root, file, { files: ['plugin/lib/thing.mjs'], message: 'fix(thing): item one', step: FIX_STEP, by: 'p-fixes item 1', counter });
  assert.equal(first.issue, 'recorded');

  await writeFile(path.join(root, 'tests/cli/merge.test.mjs'), [
    "import assert from 'node:assert/strict';",
    "import test from 'node:test';",
    "import { answer } from '../../plugin/lib/thing.mjs';",
    "test('the module answers', () => { assert.ok(answer > 0); });",
    "test('and answers twice', () => { assert.ok(answer > 1); });",
    '',
  ].join('\n'));
  const second = await proofCycle(root, file, { files: ['tests/cli/merge.test.mjs'], message: 'fix(suite): item two', step: FIX_STEP, by: 'p-fixes item 2', counter });
  assert.equal(second.issue, 'recorded');

  // Each proof is attached to the commit whose tree it was verified on…
  const blocks = parseVerified(await readFile(file, 'utf8')).get(1);
  assert.equal(blocks.length, 3, 'the build block plus one per item — no append lost behind the next item staging');
  assert.deepEqual(blocks.map((block) => block.at).slice(1), [first.at, second.at]);
  assert.equal(git(root, 'rev-parse', `${blocks[1].at}^{tree}`), first.tree);
  assert.equal(git(root, 'rev-parse', `${blocks[2].at}^{tree}`), second.tree);
  // …the tree is clean at normal exit, and the command was executed twice — once per item, never
  // once per item plus once at landing.
  assert.equal(git(root, 'status', '--porcelain'), '');
  assert.equal(counter.runs, 2);
  const report = await gateVerify(root, file);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, second.at);
  assert.deepEqual(executeGate(root, report), { executions: 0, failures: 0 });
});

test('a fix commit that fails preserves files and index, and records nothing', async () => {
  const { root, file } = await fixRepo();
  const hook = await refuseCommits(root);
  const head = git(root, 'rev-parse', 'HEAD');
  const planBefore = await readFile(file, 'utf8');
  await writeFile(path.join(root, 'plugin/lib/thing.mjs'), 'export const answer = 47;\n');
  await hook.on();

  const outcome = await proofCycle(root, file, { files: ['plugin/lib/thing.mjs'], message: 'fix(thing): refused', step: FIX_STEP, by: 'item 1', counter: { runs: 0 } });

  // The reported result is the failure, not a success — and the git state is preserved, not repaired.
  assert.equal(outcome.issue, 'fix-commit-failed');
  assert.equal(git(root, 'rev-parse', 'HEAD'), head, 'HEAD did not move');
  assert.equal(git(root, 'status', '--porcelain'), 'M  plugin/lib/thing.mjs', 'the edit is still staged, not discarded');
  assert.equal(await readFile(path.join(root, 'plugin/lib/thing.mjs'), 'utf8'), 'export const answer = 47;\n');
  assert.equal(await readFile(file, 'utf8'), planBefore, 'no proof was recorded');
  assert.equal(parseVerified(planBefore).get(1).length, 1);
  // And the gate is untouched by the failed attempt: HEAD never moved, so the build's own proof is
  // still fresh and the gate reuses it. A landing refuses this dirty tree before it asks the gate
  // anything.
  assert.equal((await gateVerify(root, file)).commands[0].decision, 'reuse');
});

test('a proof commit that fails after staging preserves the staged proof and never claims success', async () => {
  const { root, file } = await fixRepo();
  const hook = await refuseCommits(root);
  await writeFile(path.join(root, 'plugin/lib/thing.mjs'), 'export const answer = 48;\n');

  // The fix commit lands; the hook then refuses the bookkeeping commit — the window a recovery chain
  // would have "cleaned up" by restoring the index's content and exiting 0.
  git(root, 'add', 'plugin/lib/thing.mjs');
  const tree = git(root, 'write-tree');
  const counter = { runs: 0 };
  const green = runStep(root, counter);
  assert.equal(green, true);
  git(root, 'commit', '-q', '-m', 'fix(thing): item one');
  const at = git(root, 'rev-parse', 'HEAD');
  const result = await recordVerification(root, file, JSON.stringify({ by: 'item 1', at, tree, step: FIX_STEP }));
  assert.equal(result.refuse, false);
  git(root, 'add', file);
  await hook.on();
  let failed = false;
  try { git(root, 'commit', '-q', '-m', 'docs(plan): record'); } catch { failed = true; }

  // Reported as the failure it is; nothing restored, nothing discarded, nothing pretending to succeed.
  assert.equal(failed, true);
  assert.equal(git(root, 'rev-parse', 'HEAD'), at, 'HEAD is the fix commit, and nothing moved it back');
  assert.equal(git(root, 'status', '--porcelain'), `M  ${path.relative(root, file)}`, 'the proof is still staged');
  const blocks = parseVerified(await readFile(file, 'utf8')).get(1);
  assert.equal(blocks.length, 2, 'the proof is still in the working tree — it was not checked out from under the failure');
  assert.equal(blocks.at(-1).at, at);
  // The gate reads the plan from the **working tree**, so it does see this uncommitted proof and
  // would reuse it — which is exactly why this failure has to stop rather than be papered over. The
  // proof is not in history, and a landing refuses a dirty tree before it ever asks the gate
  // anything, so the honest state is "dirty, one commit landed, the proof staged and uncommitted".
  const report = await gateVerify(root, file);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.notEqual(git(root, 'status', '--porcelain'), '', 'the tree is dirty, which is what stops a landing');
  assert.equal(git(root, 'show', `${at}:${path.relative(root, file)}`).includes('reverified'), false, 'and nothing in history carries the proof');

  // This is exactly what `|| git checkout -- <plan>` would have done, and why it is forbidden: it
  // restores the index's content, so the proof stays staged, the tree stays dirty — and it exits 0.
  const restore = execFileSync('git', ['-C', root, 'checkout', '--', path.relative(root, file)], { encoding: 'utf8' });
  assert.equal(restore, '');
  assert.equal(git(root, 'status', '--porcelain'), `M  ${path.relative(root, file)}`, 'the checkout restored the index, not HEAD — the proof is still staged');
});

test('a commit recording nothing but a proof invalidates no proof, including its own', async () => {
  const { root, file } = await fixRepo();
  const counter = { runs: 0 };
  await writeFile(path.join(root, 'plugin/lib/thing.mjs'), 'export const answer = 49;\n');
  const outcome = await proofCycle(root, file, { files: ['plugin/lib/thing.mjs'], message: 'fix(thing): item one', step: FIX_STEP, by: 'item 1', counter });
  assert.equal(outcome.issue, 'recorded');

  // HEAD is now the bookkeeping commit, one past the commit the proof names. It changed only the
  // plan's execution log, so the proof it just recorded is still fresh.
  assert.notEqual(git(root, 'rev-parse', 'HEAD'), outcome.at);
  const report = await gateVerify(root, file);
  assert.equal(report.commands[0].decision, 'reuse');
  assert.equal(report.commands[0].verifiedAt, outcome.at);
  assert.deepEqual(executeGate(root, report), { executions: 0, failures: 0 });
});
