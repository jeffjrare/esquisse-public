import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// The helper is bash, sourced by scripts/audit.sh and scripts/check-structure.sh, so it is exercised
// the way they use it: a real shell, the real repository corpus, and the status code the caller
// routes on. Stubbing the filesystem here would prove only that a stub agrees with itself — and the
// whole point of this helper is that it reads what is actually on disk.
//
// The flat cases retired with the flat corpus on 2026-09-22: building a shape nothing produces, to
// prove a branch nothing reaches, is the fixture keeping the branch alive rather than the other way
// round.

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HELPER = path.join(REPO, 'scripts', 'lib', 'skill-corpus.sh');

// Runs a snippet with the helper sourced. Returns { status, stdout } — never throws on a nonzero
// exit, because the nonzero exit is frequently the thing under test.
function sh(snippet) {
  try {
    const stdout = execFileSync('bash', ['-c', `set -uo pipefail; source "${HELPER}"; ${snippet}`], {
      cwd: REPO,
      encoding: 'utf8',
    });
    return { status: 0, stdout };
  } catch (err) {
    return { status: err.status ?? 1, stdout: (err.stdout ?? '').toString() };
  }
}

const lines = (out) => out.split('\n').filter(Boolean);

test('the corpus resolves to every skill on disk, and to nothing else', () => {
  const nested = sh('skill_corpus_init plugin/skills && skill_names');
  assert.equal(nested.status, 0);
  const names = lines(nested.stdout);
  assert.ok(names.length > 0, 'the corpus is not empty');
  assert.deepEqual(names, [...names].sort(), 'names are sorted, so findings are stable');
  assert.ok(names.includes('build') && names.includes('review'));
});

test('skill_files resolves a split skill to its entrypoint plus its references', () => {
  const nested = sh('skill_corpus_init plugin/skills && skill_files build');
  const got = lines(nested.stdout);
  assert.equal(got[0], 'plugin/skills/build/SKILL.md', 'the entrypoint comes first');
  assert.ok(got.length > 1, 'the references are carried too');
  assert.ok(got.slice(1).every((f) => f.includes('/references/')));
  assert.deepEqual(got.slice(1), [...got.slice(1)].sort(), 'references are sorted, so findings are stable');
});

test('a skill with no references/ still resolves under pipefail', () => {
  // The audit runs `set -uo pipefail`, and the nested branch of skill_files ends in a pipeline whose
  // `grep -v` prints nothing when a skill has no references — so the function exited 1 while having
  // printed its entrypoint, and every caller reads that status as "no such skill". Twenty of the
  // twenty-one skills are reference-less, so the corpus switch was inert for almost the whole corpus.
  const files = sh('skill_corpus_init plugin/skills && skill_files advance');
  assert.equal(files.status, 0, 'a reference-less skill is not an error');
  assert.deepEqual(lines(files.stdout), ['plugin/skills/advance/SKILL.md']);

  const hit = sh(String.raw`skill_corpus_init plugin/skills && skill_grep advance -ohF -- '<!-- conclusion:start -->'`);
  assert.equal(hit.status, 0);
  assert.equal(lines(hit.stdout).length, 1, 'skill_grep reads the entrypoint of a reference-less skill');

  const carrier = sh('skill_corpus_init plugin/skills && marker_carrier advance conclusion');
  assert.equal(carrier.status, 0);
  assert.deepEqual(lines(carrier.stdout), ['plugin/skills/advance/SKILL.md']);
});

test('an unknown skill name is a nonzero status, never an empty file set', () => {
  assert.equal(sh('skill_corpus_init plugin/skills && skill_files no-such-skill').status, 1);
  assert.equal(sh('skill_corpus_init plugin/skills && skill_grep no-such-skill -q x').status, 1);
  assert.equal(sh('skill_corpus_init plugin/skills && marker_carrier no-such-skill shared:read-once').status, 1);
});

test('skill_grep searches the whole skill, so a reference-only string is found', () => {
  // A string that lives in build's references and not in its entrypoint: reading the entrypoint
  // alone is blind to it, and that blindness is the gap this helper exists to close.
  const needle = 'The failure report, the decision and the recovery';
  const nested = sh(`skill_corpus_init plugin/skills && skill_grep build -l -F '${needle}'`);
  assert.equal(nested.status, 0);
  assert.deepEqual(lines(nested.stdout), ['plugin/skills/build/references/failure-and-recovery.md']);

  assert.equal(
    sh(`grep -q -F '${needle}' plugin/skills/build/SKILL.md`).status,
    1,
    'the needle lives only in a reference file — the entrypoint alone cannot see it',
  );
});

test('skill_grep passes its options and pattern through to grep unchanged', () => {
  assert.equal(sh("skill_corpus_init plugin/skills && skill_grep build -q -F 'Announce'").status, 0);
  assert.equal(sh("skill_corpus_init plugin/skills && skill_grep build -q -F 'zzz-not-present-zzz'").status, 1);
});

test('marker_carrier names the file holding the pair', () => {
  const nested = sh('skill_corpus_init plugin/skills && marker_carrier build shared:read-once');
  assert.equal(nested.status, 0);
  assert.deepEqual(lines(nested.stdout), ['plugin/skills/build/SKILL.md']);

  assert.equal(sh('skill_corpus_init plugin/skills && marker_carrier build no:such:marker').status, 1);
});

test('a marker that lives in a reference file is attributed to its skill', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-corpus-'));
  try {
    await mkdir(path.join(root, 'demo', 'references'), { recursive: true });
    await writeFile(path.join(root, 'demo', 'SKILL.md'), '# demo\n');
    await writeFile(path.join(root, 'demo', 'references', 'r.md'), '<!-- shared:x:start -->\n<!-- shared:x:end -->\n');

    const out = sh(`skill_corpus_init '${root}' && marker_carrier demo shared:x`);
    assert.equal(out.status, 0);
    assert.deepEqual(lines(out.stdout), [path.join(root, 'demo', 'references', 'r.md')]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an unreadable, missing or empty corpus is status 2 — nothing-to-check, not a finding', async () => {
  assert.equal(sh('skill_corpus_init /nonexistent-corpus-path').status, 2);
  assert.equal(sh('skill_corpus_init ""').status, 2);
  assert.equal(sh('skill_corpus_init').status, 2);

  const empty = await mkdtemp(path.join(os.tmpdir(), 'esq-corpus-empty-'));
  try {
    assert.equal(sh(`skill_corpus_init '${empty}'`).status, 2);
  } finally {
    await rm(empty, { recursive: true, force: true });
  }

  // Bound but unusable: the accessors refuse rather than returning an empty set a check would read
  // as "nothing wrong here".
  assert.equal(sh('skill_names').status, 2);
  assert.equal(sh('skill_files build').status, 2);
});
