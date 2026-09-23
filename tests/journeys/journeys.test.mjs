// The orchestration judges' own regression suite — free, and the only thing
// standing between `tests/journeys/fixtures/capture.jsonl` and a judge that has
// quietly stopped judging. The live script bills; this does not. Every assertion
// here runs over the checked-in capture or a copy of it mutated to break exactly
// one contract: a judge that never fails is not a judge.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  BRANCHES, CANDIDATES, EVIDENCE_MARKER, PARKED, PAUSED_HEADING, RED_SUITE_STEP, ROWS, ROW_MARKER,
  SLOW_CHECK_STEP, judgeCapture, parseLines, rowFor,
} from '../../scripts/smoke-journeys.mjs';
import { validateRecord } from '../../scripts/lib/capture-schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..');
const SCRIPT = path.join(REPO, 'scripts', 'smoke-journeys.mjs');
const CAPTURE = path.join(here, 'fixtures', 'capture.jsonl');
const mutatedPath = (branch) => path.join(here, 'fixtures', 'mutated', `${branch}.jsonl`);

const read = (file) => parseLines(readFileSync(file, 'utf8'));
const byBranch = (judged) => Object.fromEntries(judged.map((r) => [r.branch, r.verdict]));

test('the checked-in capture judges every orchestration journey green, with no problems', () => {
  const { judged, problems, version } = judgeCapture(read(CAPTURE));
  assert.deepEqual(problems, []);
  assert.deepEqual(judged.map((r) => r.branch), BRANCHES);
  for (const row of judged) {
    assert.equal(row.verdict, 'pass', `${row.branch}: ${row.failures.join(' · ')}`);
  }
  assert.match(version, /^\d+\.\d+\.\d+$/);
});

// The freshness claim the whole suite rests on: a verdict must say which harness
// and which model it was taken on, or a later session cannot tell what expired.
test('every verdict carries the Claude Code version and the model the run actually used', () => {
  for (const record of read(CAPTURE)) {
    if (record.type !== EVIDENCE_MARKER) continue;
    assert.match(record.cc, /^\d+\.\d+\.\d+$/, 'an evidence record with no Claude Code version');
    assert.ok(record.init && record.init.model, 'an evidence record that does not say which model produced it');
    assert.equal(record.init.claude_code_version, record.cc);
  }
});

for (const branch of BRANCHES) {
  test(`the mutated ${branch} capture reds ${branch} and leaves the other journeys green`, () => {
    const { judged, problems } = judgeCapture(read(mutatedPath(branch)));
    assert.deepEqual(problems, []);
    const verdicts = byBranch(judged);
    assert.equal(verdicts[branch], 'FAIL');
    for (const other of BRANCHES.filter((b) => b !== branch)) {
      assert.equal(verdicts[other], 'pass', `${other} reddened too — the mutation is not branch-local`);
    }
    const failed = judged.find((r) => r.branch === branch);
    assert.ok(failed.failures.length, 'a FAIL with no named failure tells the maintainer nothing');
  });
}

// The verdict rests on artifacts, and the corroboration is a column. A capture
// whose regex came out false but whose ledger is right must still pass — that is
// the whole reason the verdict was put on artifacts (D-a-runtime-eval-judges-artifacts).
test('the corroboration column is a persisted boolean and still gates nothing', () => {
  const records = read(CAPTURE).map((ev) => (
    ev && ev.type === EVIDENCE_MARKER ? { ...ev, says: false } : ev
  ));
  const { judged, problems } = judgeCapture(records);
  assert.deepEqual(problems, []);
  assert.equal(judged.length, BRANCHES.length);
  for (const row of judged) {
    assert.equal(row.verdict, 'pass', `${row.branch} reddened on the corroboration alone`);
    assert.equal(row.says, 'not said');
  }
});

// The widened schema, read from the side that has to survive it. The checked-in
// capture was billed before `backgroundLaunches` and `survivingProcesses`
// existed, so it is the older-capture boundary itself: the fields are absent,
// and absent must judge exactly as it did — never as a journey that failed to
// report a teardown.
test('the capture that predates the background-lifecycle fields still judges green with them absent', () => {
  const records = read(CAPTURE);
  const evidence = records.filter((r) => r.type === EVIDENCE_MARKER);
  assert.equal(evidence.length, BRANCHES.length);
  for (const rec of evidence) {
    assert.equal('backgroundLaunches' in rec, false, 'the checked-in capture was re-derived, and this boundary is gone');
    assert.equal('survivingProcesses' in rec, false);
  }
  const { judged, problems } = judgeCapture(records);
  assert.deepEqual(problems, []);
  for (const row of judged) assert.equal(row.verdict, 'pass', `${row.branch}: ${row.failures.join(' · ')}`);
});

// And the other direction: a capture that *does* carry them judges the same. No
// active journey reads either field yet — journey 2 is Phase 3's — so a widened
// record must move no verdict, including the leaked-process one.
test('a record carrying the background-lifecycle fields moves no existing verdict', () => {
  for (const lifecycle of [
    { backgroundLaunches: 0, survivingProcesses: [] },
    { backgroundLaunches: 3, survivingProcesses: [] },
    { backgroundLaunches: 1, survivingProcesses: [4111, 4112] },
  ]) {
    const records = read(CAPTURE).map((ev) => (
      ev && ev.type === EVIDENCE_MARKER ? { ...ev, ...lifecycle } : ev
    ));
    const { judged, problems } = judgeCapture(records);
    assert.deepEqual(problems, []);
    for (const row of judged) {
      assert.equal(row.verdict, 'pass',
        `${row.branch} moved on ${JSON.stringify(lifecycle)}: ${row.failures.join(' · ')}`);
    }
  }
});

// The seed gained the one file journey 2 needs, and gained it additively: the
// project's verification is still `node check.mjs`, and `slow-check.mjs` is the
// one a plan has to name deliberately. If this ever finishes on its own, the
// journey it exists for stops being able to tell a bounded gate from a check
// that simply answered.
test('the shared seed carries a verification that does not finish, beside the one that does', () => {
  const seed = path.join(REPO, 'tests', 'smoke', 'fixtures', 'seed');
  assert.ok(existsSync(path.join(seed, 'check.mjs')), 'the project verification the three active journeys run is gone');
  const slow = path.join(seed, 'slow-check.mjs');
  assert.ok(existsSync(slow), 'the non-returning verification journey 2 is built on is gone');

  const text = readFileSync(slow, 'utf8');
  assert.match(text, /SIGTERM/, 'a teardown that reaches the process must kill it, or a survivor proves nothing');
  assert.equal(/process\.exit\(0\)/.test(text), false, 'slow-check.mjs can now succeed on its own — it must not conclude');

  // It is still running when a journey's own gate would be reading it: the
  // deadline expires on the script, rather than the script concluding inside
  // the deadline. That distinction is the whole reason journey 2 can tell a
  // bounded gate from a check that simply answered.
  const r = spawnSync(process.execPath, [slow], { timeout: 1_200, encoding: 'utf8' });
  assert.equal(r.error && r.error.code, 'ETIMEDOUT',
    `slow-check.mjs concluded on its own with exit ${r.status} inside 1.2s — it is no longer non-returning`);
  assert.match(r.stdout, /slow-check: started/);
});

// The other half of the same contract, and it cannot be read off the test above:
// `spawnSync`'s timeout stops collecting the moment it kills, so a teardown has
// to be watched rather than timed out. A surviving process in a capture means
// nothing reached it only if a signal that *does* reach it kills it.
test('the seed\'s non-returning check dies when a teardown reaches it', async () => {
  const slow = path.join(REPO, 'tests', 'smoke', 'fixtures', 'seed', 'slow-check.mjs');
  const child = spawn(process.execPath, [slow], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (d) => { stderr += d; });
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('spawn', () => setTimeout(() => child.kill('SIGTERM'), 150));
    child.on('close', resolve);
  });
  assert.equal(code, 143, 'a SIGTERM did not tear the check down cleanly');
  assert.match(stderr, /torn down by SIGTERM/, 'the check died without saying a teardown reached it');
});

// Each judge holds its own scenario and nothing else. A record that reds one
// journey's contract must not red another's just by sitting in the same file.
test('a judge reads only its own row, and an unknown row is a named problem', () => {
  const good = read(CAPTURE);
  const { problems } = judgeCapture([...good, { type: ROW_MARKER, branch: 'not-a-journey' }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"not-a-journey", which is not an orchestration journey/);
});

// The invariant the failed first attempt at this phase lacked: `ROWS` grew by two
// and the fixtures grew by none, `--parse` printed a green two-line table over a
// four-branch registry and exited 0, and only this suite reddened — after the
// commit. The bijection is asserted here directly and mirrored in `judgeCapture`,
// so a phase cannot commit a registry its fixtures do not cover
// (D-the-registry-and-its-fixtures-are-a-bijection).
test('every active journey has exactly one row, one evidence record and one mutation', () => {
  const records = read(CAPTURE);
  const rows = records.filter((r) => r.type === ROW_MARKER).map((r) => r.branch);
  assert.deepEqual(rows, BRANCHES, 'the capture\'s rows are not the registry, in order');

  let current = null;
  const evidenceFor = new Map();
  for (const rec of records) {
    if (rec.type === ROW_MARKER) current = rec.branch;
    if (rec.type === EVIDENCE_MARKER) evidenceFor.set(current, (evidenceFor.get(current) || 0) + 1);
  }
  for (const branch of BRANCHES) {
    assert.equal(evidenceFor.get(branch), 1, `${branch} has ${evidenceFor.get(branch) || 0} evidence records, not 1`);
    assert.ok(existsSync(mutatedPath(branch)), `${branch} has no mutated/${branch}.jsonl — its judge is never seen to fail`);
  }

  // A mutation that is not a mutation of *this* capture is the drift the other
  // half of this phase re-derived: every mutated file carries every journey.
  for (const branch of BRANCHES) {
    const mutatedRows = read(mutatedPath(branch)).filter((r) => r.type === ROW_MARKER).map((r) => r.branch);
    assert.deepEqual(mutatedRows, BRANCHES, `mutated/${branch}.jsonl was not re-derived over the current capture`);
  }

  // Parked journeys are the complement, and the complement has to be exact: a
  // parked branch keeps its billed capture and appears in neither judged file.
  const mutations = readdirSync(path.join(here, 'fixtures', 'mutated')).sort();
  assert.deepEqual(mutations, BRANCHES.map((b) => `${b}.jsonl`).sort(), 'a mutation names a branch outside the registry');
  for (const row of PARKED) {
    assert.ok(existsSync(path.join(REPO, row.billed)), `${row.branch} is parked with no billed capture to cite`);
    assert.equal(rows.includes(row.branch), false, `${row.branch} is parked and still in the judged capture`);
    assert.equal(existsSync(mutatedPath(row.branch)), false, `${row.branch} is parked and still carries a mutation`);
  }

  // A candidate is the same complement seen from the other side: authored and
  // runnable, but nothing has been bought for it yet, so it may appear in
  // neither the aggregate nor the mutations. Adding a row before the run that
  // pays for it is exactly the failure the bijection exists to catch.
  for (const row of CANDIDATES) {
    assert.equal(BRANCHES.includes(row.branch), false, `${row.branch} is a candidate and already in the registry`);
    assert.equal(rows.includes(row.branch), false, `${row.branch} is a candidate and already in the judged capture`);
    assert.equal(existsSync(mutatedPath(row.branch)), false, `${row.branch} is a candidate and already carries a mutation`);
  }
});

// `judgeRedVerification` never reads a verification result out of the capture —
// it rests on the fixture's second `(auto)` step being red whatever the run does.
// If that step moved and the constant did not, the journey would be judging a
// plan whose verification might well have passed.
test('the red-verification overlay still carries the unconditionally red suite step', () => {
  const row = CANDIDATES.find((r) => r.branch === 'red-verification')
    || ROWS.find((r) => r.branch === 'red-verification')
    || PARKED.find((r) => r.branch === 'red-verification');
  assert.ok(row, 'the red-verification journey is gone — this test needs rewriting, not deleting');
  const text = readFileSync(path.join(here, 'fixtures', row.seed, row.plan), 'utf8');
  assert.ok(text.includes(RED_SUITE_STEP), `the overlay no longer carries the pinned step: ${RED_SUITE_STEP}`);

  // And it is red, rather than merely pinned: the command in the fixture is run
  // here, for free, and must exit non-zero. A step that started passing would
  // turn the journey green on a plan that no longer poses the question.
  const r = spawnSync('/bin/sh', ['-c', RED_SUITE_STEP.replace('150000', '10')], { encoding: 'utf8', timeout: 20_000 });
  assert.equal(r.status, 1, `the pinned suite step exits ${r.status}, not 1 — it no longer reds by construction`);
});


// The plan's "seed drift" risk, mechanized: an overlay per journey over one toy
// project is one chance each to fork it. An overlay may add a plan; it may not
// restate the code or the verification the judges read. A *parked* journey is
// held to the same rule as an active one — nothing in the registry names its
// overlay, so this test is the only thing standing between it and a contributor
// deleting it as unused.
test('every journey overlay is an overlay on the shared seed, never a fork of it', () => {
  const files = (dir, prefix = '') => readdirSync(dir).flatMap((name) => (
    statSync(path.join(dir, name)).isDirectory()
      ? files(path.join(dir, name), `${prefix}${name}/`)
      : [`${prefix}${name}`]
  ));
  const seeded = new Set(files(path.join(REPO, 'tests', 'smoke', 'fixtures', 'seed')));
  for (const row of [...ROWS, ...PARKED, ...CANDIDATES]) {
    const overlay = path.join(here, 'fixtures', row.seed);
    assert.ok(existsSync(overlay), `${row.branch} names a seed overlay that does not exist: ${row.seed}`);
    for (const f of files(overlay)) {
      assert.equal(seeded.has(f), false, `${row.seed}/${f} restates a seed file — the overlay forked the toy project`);
      assert.ok(f.startsWith('docs/'), `${row.seed}/${f} is outside docs/ — an overlay seeds a ledger, not a project`);
    }
    assert.ok(files(overlay).includes(row.plan), `${row.seed} does not carry ${row.plan}`);
  }
});

// `judgePause` compares the harvested heading against one string. If the overlay's
// heading moved and the constant did not, the journey would pass on a heading it
// never seeded — the two are pinned together here, for free.
test('the pause overlay still carries the exact ⏸ heading judgePause compares against', () => {
  const row = rowFor('pause');
  const text = readFileSync(path.join(here, 'fixtures', row.seed, row.plan), 'utf8');
  assert.ok(text.split('\n').some((line) => line.trim() === PAUSED_HEADING),
    `the overlay no longer carries the seeded heading: ${PAUSED_HEADING}`);
});

// The same pin for journey 2, and the same reason: `judgeBackgroundLifecycle`
// rests entirely on the phase's verification never answering. If the overlay
// stopped naming the seed's non-returning check, the journey would be reading a
// bounded gate off a run that simply finished — and the seed's own test above is
// what keeps that check non-returning.
test('the background-lifecycle overlay still names the seed verification that does not return', () => {
  const row = CANDIDATES.find((r) => r.branch === 'background-lifecycle')
    || ROWS.find((r) => r.branch === 'background-lifecycle')
    || PARKED.find((r) => r.branch === 'background-lifecycle');
  assert.ok(row, 'the background-lifecycle journey is gone — this test needs rewriting, not deleting');
  const text = readFileSync(path.join(here, 'fixtures', row.seed, row.plan), 'utf8');
  assert.ok(text.includes(SLOW_CHECK_STEP), `the overlay no longer names the pinned step: ${SLOW_CHECK_STEP}`);
  assert.equal(text.includes('node check.mjs'), true, 'the overlay dropped the short verification the run must still pass');
});

// A candidate's judge is reachable from no replay of the aggregate, so it can rot
// silently until the run that pays for it discovers the bug. So each candidate
// ships three captures of its own: the
// capture its pre-change live run bought, which its judge must pass; that same
// capture with one contract broken, which its judge must red *on that contract's
// own failure*; and the capture its post-change run bought against the build
// that carries the collection rule, which its judge must also pass.
//
// The green half is real evidence and the red half is derived from it, which is
// the `mutated/` relationship a journey gets once it is in `ROWS` — held here
// because a candidate is not in the aggregate yet. It is not in the aggregate
// because the aggregate carries one Claude Code version and is replaced only by
// a whole-registry run: `docs/EVIDENCE.md` pins `M-journeys-2026-08-30` to
// 2.1.251, and appending a 2.1.265 row to it makes that row's version claim
// false. These captures are single-version, cited by no registry row, and claim
// nothing beyond the run that bought them.
const candidateFixture = (name) => path.join(here, 'fixtures', 'candidate', `${name}.jsonl`);

const NAMED_FAILURE = {
  'red-verification': /logged completed over a verification that cannot pass/,
  'background-lifecycle': /still alive in its scratch root/,
};

for (const row of CANDIDATES) {
  test(`the ${row.branch} judge passes its green fixture and reds its mutation on the named failure`, () => {
    const green = read(candidateFixture(row.branch));
    const mutated = read(candidateFixture(`${row.branch}-mutated`));
    const postchange = read(candidateFixture(`${row.branch}-postchange`));
    for (const records of [green, mutated, postchange]) {
      assert.equal(records.length, 2, 'a candidate fixture is one row marker and one evidence record');
      for (const rec of records) {
        const verdict = validateRecord(rec);
        assert.equal(verdict.ok, true,
          `${row.branch}: the capture schema refuses a fixture record — ${verdict.reason}: ${verdict.missing.join(', ')}`);
      }
      assert.equal(records[0].branch, row.branch);
    }

    const pass = row.judge(green[1]);
    assert.equal(pass.ok, true, `${row.branch}'s judge reds its own green fixture: ${pass.failures.join(' · ')}`);

    const fail = row.judge(mutated[1]);
    assert.equal(fail.ok, false, `${row.branch}'s judge passes a capture that breaks its contract`);
    assert.ok(
      fail.failures.some((f) => NAMED_FAILURE[row.branch].test(f)),
      `${row.branch} reds, but not on the contract the mutation broke: ${fail.failures.join(' · ')}`,
    );

    // The pre-change capture was bought against a build that had no collection
    // rule written into it; the post-change one is the same journey against the
    // build that does. Both are green and both are kept, because the pair is
    // what shows the rule was written over observed behavior rather than in
    // place of it — and because a judge that only ever sees one green capture
    // cannot distinguish a contract from a coincidence.
    const after = row.judge(postchange[1]);
    assert.equal(after.ok, true,
      `${row.branch}'s judge reds its post-change capture: ${after.failures.join(' · ')}`);
  });
}

// The candidate fixtures are exactly the candidates' own, so a journey that has
// since been promoted or parked cannot leave a stale set behind pretending to
// still be the thing that proves its judge runs.
test('the candidate fixtures are exactly one green, one mutated and one post-change per candidate', () => {
  const expected = CANDIDATES.flatMap(
    (r) => [`${r.branch}.jsonl`, `${r.branch}-mutated.jsonl`, `${r.branch}-postchange.jsonl`],
  ).sort();
  assert.deepEqual(readdirSync(path.join(here, 'fixtures', 'candidate')).sort(), expected);
});

// --parse is the free path. If it can reach a spawn, a mistyped replay becomes
// one billed run per journey — so the stub is the assertion, not the exit code.
function runParse(file) {
  const stubDir = mkdtempSync(path.join(tmpdir(), 'esq-journey-stub-'));
  const marker = path.join(stubDir, 'spawned');
  writeFileSync(path.join(stubDir, 'claude'), `#!/bin/sh\ntouch ${marker}\nexit 0\n`);
  chmodSync(path.join(stubDir, 'claude'), 0o755);
  const r = spawnSync(process.execPath, [SCRIPT, '--parse'], {
    input: file ? readFileSync(file) : '',
    encoding: 'utf8',
    timeout: 30_000,
    env: { ...process.env, PATH: `${stubDir}:${process.env.PATH}` },
  });
  return { ...r, spawned: existsSync(marker) };
}

test('--parse replays the good capture at exit 0 and starts no claude process', () => {
  const r = runParse(CAPTURE);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.spawned, false, '--parse reached a claude spawn — the free path can bill');
  assert.match(r.stdout, /parse \(replayed, \$0\)/);
  for (const branch of BRANCHES) assert.match(r.stdout, new RegExp(`^${branch}\\s+pass`, 'm'));
});

for (const branch of BRANCHES) {
  test(`--parse exits 1 on the mutated ${branch} capture and names ${branch}`, () => {
    const r = runParse(mutatedPath(branch));
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.spawned, false);
    assert.match(r.stdout, new RegExp(`^${branch}\\s+FAIL`, 'm'));
    assert.match(r.stdout, new RegExp(`^✖ ${branch}$`, 'm'));
  });
}

test('--parse refuses an empty stdin with exit 2 rather than falling through to the billed path', () => {
  const r = runParse('');
  assert.equal(r.status, 2);
  assert.equal(r.spawned, false, 'an empty capture reached a claude spawn — the refusal is what keeps --parse free');
  assert.match(r.stderr, /reads a capture on stdin/);
});

test('every row resolves to a judge, a prompt and a seed overlay of its own', () => {
  for (const branch of BRANCHES) {
    const row = rowFor(branch);
    assert.equal(typeof row.judge, 'function', `${branch} has no judge`);
    assert.match(row.prompt, /^\/esq:/, `${branch}'s prompt does not invoke a command`);
    assert.ok(row.corroboration instanceof RegExp, `${branch}'s corroboration is not a regex`);
  }
  for (const row of CANDIDATES) {
    assert.equal(typeof row.judge, 'function', `${row.branch} has no judge`);
    assert.match(row.prompt, /^\/esq:/, `${row.branch}'s prompt does not invoke a command`);
    assert.ok(row.corroboration instanceof RegExp, `${row.branch}'s corroboration is not a regex`);
  }
  const seeds = [...ROWS, ...PARKED, ...CANDIDATES].map((r) => r.seed);
  assert.equal(new Set(seeds).size, seeds.length, 'two journeys share one seed overlay');
});
