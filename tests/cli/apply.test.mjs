import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { applyRoute } from '../../plugin/lib/cli.mjs';

// Fixture skill directories, never the shipped ones: the point of this verb is that the answer comes
// out of whatever frontmatter it is pointed at, so a test reading `plugin/skills/` would prove only
// that today's flags are today's flags. Real git for the ledger half — the observation is a claim
// about a file in a working tree — and the CLI's own test seam stays off.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
delete process.env.ESQ_TEST_GIT_ROOT;

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// One skill per case: flagged, unflagged, a flag value that is not a boolean, and a file with no
// frontmatter at all. The absent skill is the directory simply not being here.
async function skills() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'esq-skills-'));
  const write = async (name, body) => {
    await mkdir(path.join(directory, name), { recursive: true });
    await writeFile(path.join(directory, name, 'SKILL.md'), body);
  };
  await write('backlog', '---\nname: backlog\ndisable-model-invocation: true\nmodel: sonnet\n---\nprose\n');
  await write('land', '---\nname: land\ndisable-model-invocation: true\n---\nprose\n');
  await write('fix', '---\nname: fix\nmodel: opus\n---\nprose\n');
  await write('review', '---\nname: review\ndisable-model-invocation: false\n---\nprose\n');
  await write('odd', '---\nname: odd\ndisable-model-invocation: maybe\n---\nprose\n');
  await write('bare', '# no frontmatter at all\n');
  return directory;
}

// A backlog whose table is the real shape, plus the header variant older installs wrote, so the
// observation is read by column name rather than by position.
async function ledger(rows, { idHeader = 'ID' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-apply-'));
  await mkdir(path.join(root, 'docs'), { recursive: true });
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'user.name', 'Test');
  const table = [
    `| ${idHeader} | Date | Type | Pri | Summary | Source | Epic | Version | Status |`,
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map(({ id, status }) => `| ${id} | 2026-09-13 | 🐛 bug | med | a summary | manual |  |  | ${status} |`),
  ];
  await writeFile(path.join(root, 'docs/BACKLOG.md'), `# Backlog\n\n${table.join('\n')}\n`);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'seed');
  return root;
}

async function route(root, input, directory) {
  const { routes } = await applyRoute(root, [input], { skillsDir: directory });
  assert.equal(routes.length, 1);
  return routes[0];
}

test('a skill reserved for direct user invocation relays and is never spawnable', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  for (const input of ['/esq:backlog B-092 done', '/esq:land docs/plans/x.md']) {
    const answer = await route(root, input, directory);
    assert.equal(answer.route, 'relay');
    assert.equal(answer.invocation, 'user');
    assert.equal(answer.form, 'invocation');
    assert.match(answer.reason, /only the user may invoke it/);
  }
});

test('a model-runnable skill keeps the existing apply path', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  // `fix` has no flag at all; `review` records it false. Both are the same permission.
  for (const input of ['/esq:fix docs/plans/x-fixes.brief.md', '/esq:review docs/plans/x.md']) {
    const answer = await route(root, input, directory);
    assert.equal(answer.route, 'apply');
    assert.equal(answer.invocation, 'model');
    assert.equal(answer.applied, null);
    assert.equal(answer.confirm, null);
  }
});

test('a file, a line and a replacement is a change a subagent makes', async () => {
  const directory = await skills();
  const root = await ledger([]);
  const answer = await route(root, 'plugin/lib/cli.mjs:42 → `return null;` becomes `return 0;`', directory);
  assert.equal(answer.form, 'change');
  assert.equal(answer.route, 'apply');
  assert.equal(answer.skill, null);
  assert.equal(answer.command, 'plugin/lib/cli.mjs:42 → `return null;` becomes `return 0;`');
  // A replacement whose own backticks sit at both ends is content, not a brief's wrapping pair.
  const both = await route(root, '`return null;` becomes `return 0;`', directory);
  assert.equal(both.command, '`return null;` becomes `return 0;`');
  assert.equal(both.route, 'apply');
});

test('unknown and mixed execution requirements route to stop, never to a spawn', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  const cases = [
    ['', /empty/],
    ['   ', /empty/],
    ['/esq:backlog B-092 done && git commit -am x', /chains/],
    ['/esq:backlog B-092 done; /esq:land x', /names 2 esq commands/],
    ['/esq:backlog B-092 done | tee log', /chains/],
    ['close the row with /esq:backlog B-092 done', /inside other text/],
    ['/esq:backlog B-092 done and then /esq:review x', /names 2 esq commands/],
    ['/esq:nosuch B-092 done', /no skill named nosuch/],
    ['/esq:odd B-092 done', /neither true nor false/],
    ['/esq:bare B-092 done', /no frontmatter/],
  ];
  for (const [input, reason] of cases) {
    const answer = await route(root, input, directory);
    assert.equal(answer.route, 'stop', `${JSON.stringify(input)} must not be spawnable`);
    assert.match(answer.reason, reason);
    assert.equal(answer.applied, null);
  }
});

test('a relayed invocation is unapplied while the row still reads its old status', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Planned' }]);
  const answer = await route(root, '/esq:backlog B-092 done', directory);
  assert.equal(answer.route, 'relay');
  assert.equal(answer.applied, false);
  assert.deepEqual(answer.confirm, { ledger: 'docs/BACKLOG.md', id: 'B-092', expected: 'Done', observed: 'Planned' });
});

test('a relayed invocation is applied once the row reads the status it asked for', async () => {
  const directory = await skills();
  for (const [status, expected] of [['Done', 'Done'], ['Dropped', 'Dropped'], ['Needs-decision', 'Needs-decision']]) {
    const root = await ledger([{ id: 'B-092', status }]);
    const answer = await route(root, `/esq:backlog B-092 ${expected.toLowerCase()}`, directory);
    assert.equal(answer.applied, true, `${status} should read as applied`);
    assert.equal(answer.confirm.observed, status);
    assert.match(answer.reason, /the action is applied/);
  }
});

test('an observation nothing in the tree can settle is null, never false', async () => {
  const directory = await skills();
  const missing = await ledger([{ id: 'B-001', status: 'Open' }]);
  const noRow = await route(missing, '/esq:backlog B-092 done', directory);
  assert.equal(noRow.applied, null);
  assert.deepEqual(noRow.confirm, { ledger: 'docs/BACKLOG.md', id: 'B-092', expected: 'Done', observed: null });
  assert.match(noRow.reason, /carries no row B-092/);

  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  for (const [input, reason] of [
    ['/esq:backlog B-092', /no backlog row and status are named/],
    ['/esq:backlog triage', /no backlog row and status are named/],
    ['/esq:land docs/plans/x.md', /no backlog row and status are named/],
  ]) {
    const answer = await route(root, input, directory);
    assert.equal(answer.applied, null);
    assert.equal(answer.confirm, null);
    assert.match(answer.reason, reason);
  }
});

test('an older backlog heading is read by column name, not by position', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Done' }], { idHeader: '#' });
  const answer = await route(root, '/esq:backlog B-092 done', directory);
  assert.equal(answer.applied, true);
});

test('the string and its arguments survive byte-for-byte', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  const input = '`/esq:backlog B-092 dropped --reason "not worth it"`';
  const answer = await route(root, input, directory);
  // The backticks a brief wraps a `do:` in are stripped from the command; the input is kept verbatim.
  assert.equal(answer.do, input);
  assert.equal(answer.command, '/esq:backlog B-092 dropped --reason "not worth it"');
  assert.equal(answer.arguments, 'B-092 dropped --reason "not worth it"');
  assert.equal(answer.confirm.expected, 'Dropped');
});

test('every option of a gate is classified in one call, in order', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  const { routes } = await applyRoute(root, ['/esq:backlog B-092 done', '/esq:fix x', 'file:1 → y'], { skillsDir: directory });
  assert.deepEqual(routes.map((entry) => entry.route), ['relay', 'apply', 'apply']);
  assert.deepEqual(routes.map((entry) => entry.do), ['/esq:backlog B-092 done', '/esq:fix x', 'file:1 → y']);
});

test('the verb is read-only, exits 0 and answers against the shipped skills', async () => {
  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  const before = git(root, 'status', '--porcelain');
  // No `skillsDir`: this is the path the orchestrators take, resolved from cli.mjs's own location, so
  // it must work with no argument and no environment set up for it.
  const { stdout } = await run(bin, ['apply', 'route', '/esq:backlog B-092 done', 'docs/x.md:1 → y'], { cwd: root });
  const { routes } = JSON.parse(stdout);
  assert.deepEqual(routes.map((entry) => entry.route), ['relay', 'apply']);
  assert.equal(git(root, 'status', '--porcelain'), before);
});

test('the verb refuses to be called with nothing to classify', async () => {
  const root = await ledger([]);
  await assert.rejects(() => run(bin, ['apply', 'route'], { cwd: root }), (error) => {
    assert.match(error.stderr, /usage: esq apply route/);
    assert.equal(error.code, 2);
    return true;
  });
});

test('an action naming two rows or two statuses is never reported applied', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Done' }, { id: 'B-093', status: 'Open' }]);
  // B-092 already reads Done, so a first-match reading would answer `true` for an action that has
  // not touched B-093 at all — and converge would strike the red over half an effect.
  const rows = await route(root, '/esq:backlog B-092 B-093 done', directory);
  assert.equal(rows.applied, null);
  assert.equal(rows.confirm, null);
  assert.match(rows.reason, /names 2 backlog rows \(B-092, B-093\)/);

  const dropped = await ledger([{ id: 'B-092', status: 'Open' }]);
  const statuses = await route(dropped, '/esq:backlog B-092 --reason "still open" dropped', directory);
  assert.equal(statuses.applied, null);
  assert.equal(statuses.confirm, null);
  assert.match(statuses.reason, /names 2 statuses/);

  // The same id twice is one row, and still answerable.
  const twice = await route(dropped, '/esq:backlog B-092 B-092 open', directory);
  assert.equal(twice.applied, true);
});

// This sample is a fixture, never esq behavior: the chosen option folded a deferred refresh into
// its `do:`, and an orchestrator lifted `/esq:spec` out of it as a step to run first. The router was
// right to stop; this pins that it still does, beside the repairs a confirmed recovery may route.
// The fixture skill directory carries no `spec` — the stop is decided before any skill is read, so no
// skill name is special-cased.
test('a deferred mixed do: stops, an acceptance repair applies, and a user-only repair still relays', async () => {
  const directory = await skills();
  const root = await ledger([{ id: 'B-092', status: 'Open' }]);
  const incident = 'run /esq:spec after shipping while D-example-display-order remains Active';
  const acceptance = 'in the D-example-display-order entry of docs/DECISIONS.md, add **Accepted:** 2026-09-16 — current order retained and **Deferred:** refresh docs/SPEC.md after shipping, once src/example.js:196-205 shows the selected order';
  const deferredInside = 'in docs/DECISIONS.md add **Accepted:** 2026-09-16, then run /esq:spec after the ship';
  const inputs = [
    incident,
    '/esq:backlog B-092 done',
    'src/example.js:196 → swap the two example entries',
    acceptance,
    '/esq:land docs/plans/x.md',
    deferredInside,
  ];
  const { routes } = await applyRoute(root, inputs, { skillsDir: directory });
  assert.deepEqual(routes.map((entry) => entry.route), ['stop', 'relay', 'apply', 'apply', 'relay', 'stop']);
  assert.deepEqual(routes.map((entry) => entry.do), inputs);

  const [stopped, relayed, change, repair, userOnly, deferred] = routes;
  assert.equal(stopped.form, 'mixed');
  assert.equal(stopped.skill, null);
  assert.equal(stopped.command, null);
  assert.equal(stopped.applied, null);
  assert.match(stopped.reason, /inside other text/);
  assert.equal(relayed.invocation, 'user');
  assert.equal(change.form, 'change');
  assert.equal(repair.form, 'change');
  // Action-level authority: a present action only the user may invoke is proposed as that command,
  // and the router keeps it a relay — never an apply reached by respelling it as an edit.
  assert.equal(userOnly.form, 'invocation');
  assert.equal(userOnly.invocation, 'user');
  assert.equal(deferred.form, 'mixed');
  assert.match(deferred.reason, /inside other text/);
});
