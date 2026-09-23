#!/usr/bin/env node
// smoke-work-capture.mjs — does `/esq:work`'s free-text capture (docs/CONFORMANCE.md
// P-07) actually behave, on this machine's Claude Code, against a throwaway repo?
//
// P-07's eight conformance needles prove the load-bearing sentences are still in
// the skill file. They cannot prove a model run obeyed them. This runs four live
// headless sessions — one per branch of P-07 — against an isolated seed repo and
// reads the verdict off the scratch repo's commits and ledger rows. The model's
// own prose is recorded as a corroboration column
// and never gates a verdict: a judge that greps prose measures the skill's
// phrasing, which it is free to reword, instead of the contract, which it is not.
// The prose itself is never persisted — the corroboration is reduced to its
// boolean at capture time, and the capture holds derived records only.
//
//   node scripts/smoke-work-capture.mjs                    # live: bills four runs
//   node scripts/smoke-work-capture.mjs --only inline --out /tmp/i.jsonl
//                                                          # …one branch instead of four,
//                                                          #  writing its own capture
//   node scripts/smoke-work-capture.mjs --keep             # …and keep the scratch roots
//   node scripts/smoke-work-capture.mjs --parse < capture   # free: re-judge a saved capture
//
// What is *here* is P-07: the four rows, their four judges, and the harvest that
// reads this scenario's artifacts. Seeding, the legacy-shadow refusal, the
// bounded spawn, the reduction to records, the replay and the table live in
// scripts/lib/journey-runner.mjs, which `scripts/smoke-journeys.mjs` shares.
//
// Dependency-free. Never wired into audit.sh — it spends tokens on purpose.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  REPO, createRunner, git, parseLines, readStream, renderTable, runMain,
} from './lib/journey-runner.mjs';

export { REPO, parseLines, readStream, renderTable };

export const SEED = resolve(REPO, 'tests', 'smoke', 'fixtures', 'seed');
export const ROW_MARKER = 'smoke-row';
export const EVIDENCE_MARKER = 'smoke-evidence';
// The seed repo's reserved block. A captured row landing here and not on B-002
// proves the ID came from `.esq-id-block`, not from the ledger's global maximum.
export const BLOCK_LO = 200;
export const CAPTURED = `B-${BLOCK_LO}`;

const NAME = 'smoke-work-capture';
const CAPTURE_DEFAULT = resolve(REPO, 'tests', 'smoke', 'fixtures', 'capture.jsonl');

// ------------------------------------------------------------------ the rows

// One row per P-07 branch. `prompt` is what the headless session is given;
// `judge` reads only the harvested evidence; `corroboration` is the sentence the
// skill is *expected* to say — recorded, shown, never part of the verdict.
export const ROWS = [
  {
    branch: 'duplicate',
    prompt: '/esq:work "add locale support to the greeting module so greetings can be translated"',
    corroboration: /already tracked as B-0*1\b/i,
    judge: judgeDuplicate,
  },
  {
    branch: 'route-captures',
    prompt: '/esq:work "imp: check.mjs should print the expected and the actual greeting side by side" route',
    corroboration: /\broute\b/i,
    judge: judgeRouteCaptures,
  },
  {
    branch: 'refuses',
    prompt: '/esq:work B-999',
    corroboration: /no (row|item|match)|never invent|does not exist/i,
    judge: judgeRefuses,
  },
];

// `inline` is a CANDIDATE, not a registry row, and that is the runner's own word
// for this state: authored, judged and runnable by `--only`, absent from the
// aggregate, so a capture without it is not read as a table shorter than the
// registry.
//
// It is here because the anchor was removed on 2026-09-22 and its billed capture
// observed the product that wrote one — four commits and a `docs/plans/` file.
// Re-judging that record under today's rules says nothing either way, and editing
// it to match would be inventing an observation nobody made. `judgeInline` below
// already expects the product that exists; what it lacks is a run. It returns to
// `ROWS` on the first green `--only inline`.
export const CANDIDATES = [
  {
    branch: 'inline',
    prompt: '/esq:work "bug: lib/greet.mjs greets with Helo instead of Hello, so node check.mjs fails"',
    corroboration: /\binline\b/i,
    judge: judgeInline,
  },
];

export const BRANCHES = ROWS.map((r) => r.branch);
export const REPLAYED = BRANCHES;
export const rowFor = (branch) => ROWS.find((r) => r.branch === branch);

// --------------------------------------------------------------- the evidence

// The shape every judge reads, and the only thing a verdict may rest on:
//
//   { exit, timedOut, elapsedMs,
//     commits: [{ hash, subject, files: [...] }]  oldest-first, past the seed commit
//     backlogRows: [{ id, date, type, pri, summary, source, epic, version, status }]
//     anchors: [{ path, text }]                   everything under docs/plans/ —
//                                                 expected EMPTY on every branch
//     check: { exit } | null                      `node check.mjs` in the scratch root
//     dirty: [ '<porcelain line>', … ]            uncommitted paths at harvest time
//     cost, turns, cc, spawns }                   from the run's own stream
//     says: true | false                          the corroboration, already answered
//
// `says` is where the model's prose goes: `row.corroboration` is one regex, it is
// run at capture time by the harness, and only its answer is persisted. The prose
// itself reaches no file — see scripts/lib/capture-schema.mjs for why.

// `| B-001 | … | Open |` → an object keyed by the table's own header row, so a
// backlog missing `Epic`/`Version` still parses into the right cells.
export function parseBacklogRows(markdown) {
  const lines = String(markdown || '').split('\n');
  let keys = null;
  const rows = [];
  for (const line of lines) {
    if (!line.trim().startsWith('|')) { continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (!keys) {
      if (/^ID$/i.test(cells[0])) keys = cells.map((c) => c.toLowerCase());
      continue;
    }
    if (cells.every((c) => /^-*$/.test(c))) continue;
    if (!/^B-\d+$/i.test(cells[0])) continue;
    const row = {};
    keys.forEach((k, i) => { row[k] = cells[i] ?? ''; });
    rows.push(row);
  }
  return rows;
}

// B-1 and B-001 are the same citation key; the padding is cosmetic.
export const sameId = (a, b) => Number(String(a).replace(/^B-?/i, '')) === Number(String(b).replace(/^B-?/i, ''));
export const findRow = (rows, id) => (rows || []).find((r) => sameId(r.id, id));

// -------------------------------------------------------------- the judges

// Every judge returns { ok, failures: [...] }. A failure names the artifact that
// was wrong — "a second row B-201 was minted" — never "the run looked wrong".
const verdictOf = (failures) => ({ ok: failures.length === 0, failures });

const subjects = (e) => (e.commits || []).map((c) => c.subject);
const addCommits = (e) => (e.commits || []).filter((c) => /^backlog: add B-\d+/i.test(c.subject));
const planFiles = (e) => (e.anchors || []).map((a) => a.path);
const filesEqual = (commit, expected) => {
  const got = [...(commit.files || [])].sort();
  return got.length === expected.length && expected.every((f, i) => got[i] === f);
};

// P-07: "An open item that already covers the same text is routed instead of
// duplicated." The contract is that nothing was minted and nothing was written —
// not which method `work` then named. Sizing is judgment the skill is supposed to
// exercise; pinning `/esq:plan` vs `/esq:grill` here would redden on a legitimate
// call and train the maintainer to ignore this script.
export function judgeDuplicate(e) {
  const failures = [];
  const minted = (e.backlogRows || []).filter((r) => Number(String(r.id).replace(/^B-?/i, '')) >= BLOCK_LO);
  if (minted.length) failures.push(`a second row was minted: ${minted.map((r) => r.id).join(', ')}`);
  const added = addCommits(e);
  if (added.length) failures.push(`a capture commit was made: ${added.map((c) => c.subject).join(' · ')}`);
  if ((e.commits || []).length) failures.push(`${e.commits.length} commit(s) past the seed: ${subjects(e).join(' · ')}`);
  if (!findRow(e.backlogRows, 'B-001')) failures.push('the seeded B-001 is gone from docs/BACKLOG.md');
  return verdictOf(failures);
}

// P-07: "The `route` keyword still captures, because it disables execution and
// not target resolution." So: exactly the capture commit, and nothing `route`
// withholds — no code, no anchor, no close.
export function judgeRouteCaptures(e) {
  const failures = [];
  const commits = e.commits || [];
  if (commits.length !== 1) {
    failures.push(`expected exactly 1 commit, saw ${commits.length}: ${subjects(e).join(' · ') || '—'}`);
  }
  const capture = commits[0];
  if (capture) {
    if (!new RegExp(`^backlog: add ${CAPTURED}\\b`, 'i').test(capture.subject)) {
      failures.push(`the commit subject is not "backlog: add ${CAPTURED} …": ${capture.subject}`);
    }
    if (!filesEqual(capture, ['docs/BACKLOG.md'])) {
      failures.push(`the capture commit touched ${(capture.files || []).join(', ') || 'nothing'}, not docs/BACKLOG.md alone`);
    }
  }
  const row = findRow(e.backlogRows, CAPTURED);
  if (!row) failures.push(`no ${CAPTURED} row in docs/BACKLOG.md`);
  else {
    if (row.status !== 'Open') failures.push(`${CAPTURED} status is "${row.status}", not Open`);
    if (!/\bwork\b/.test(row.source || '')) failures.push(`${CAPTURED} Source is "${row.source}", which does not name work`);
    if (/\broute\s*$/i.test(row.summary || '')) failures.push(`${CAPTURED} summary keeps the route keyword: "${row.summary}"`);
  }
  if (planFiles(e).length) failures.push(`route wrote a plan anchor: ${planFiles(e).join(', ')}`);
  return verdictOf(failures);
}

// P-07: "An ID shape that matches no row is still a refusal, since the
// discriminator is the shape and not the lookup." A fat finger must not mint a
// permanent citation key.
export function judgeRefuses(e) {
  const failures = [];
  if ((e.commits || []).length) failures.push(`${e.commits.length} commit(s) past the seed: ${subjects(e).join(' · ')}`);
  if ((e.dirty || []).length) failures.push(`the tree is dirty: ${e.dirty.join(' · ')}`);
  if (findRow(e.backlogRows, 'B-999')) failures.push('a B-999 row was minted in docs/BACKLOG.md');
  return verdictOf(failures);
}

// P-07: the capture runs before the verdict and for every verdict, and an inline
// verdict then writes exactly two more things, one commit each, in order — the
// code, then the close.
//
// THE PLAN ANCHOR IS GONE (2026-09-22) and this judge asserts its ABSENCE. It
// used to require a third commit, a `docs/plans/` file carrying four sections,
// and `esq lane` answering `direct` on it. That artifact existed only to give
// the corrective loop something to aim at; the loop takes a commit range now
// (`esq review scope <A>..<B>`), so a run that still wrote one would be
// producing an artifact for a consumer that no longer reads it.
export function judgeInline(e) {
  const failures = [];
  const commits = e.commits || [];
  if (commits.length !== 3) {
    failures.push(`expected 3 commits, saw ${commits.length}: ${subjects(e).join(' · ') || '—'}`);
  }
  const [capture, code, close] = commits;
  if (capture) {
    if (!new RegExp(`^backlog: add ${CAPTURED}\\b`, 'i').test(capture.subject)) failures.push(`commit 1 is not "backlog: add ${CAPTURED} …": ${capture.subject}`);
    else if (!filesEqual(capture, ['docs/BACKLOG.md'])) failures.push(`the capture commit touched ${(capture.files || []).join(', ')}, not docs/BACKLOG.md alone`);
  }
  if (code) {
    if (!new RegExp(`\\(${CAPTURED}\\)`).test(code.subject)) failures.push(`commit 2 does not carry (${CAPTURED}): ${code.subject}`);
    if (!filesEqual(code, ['lib/greet.mjs'])) failures.push(`the code commit touched ${(code.files || []).join(', ')}, not lib/greet.mjs alone`);
  }
  if (close) {
    if (!new RegExp(`^backlog: update ${CAPTURED}\\b`, 'i').test(close.subject)) failures.push(`commit 3 is not "backlog: update ${CAPTURED} …": ${close.subject}`);
    else if (!filesEqual(close, ['docs/BACKLOG.md'])) failures.push(`the close commit touched ${(close.files || []).join(', ')}, not docs/BACKLOG.md alone`);
  }

  // The absence is the assertion: an inline verdict writes no plan file at all.
  const plans = planFiles(e);
  if (plans.length) failures.push(`the inline verdict wrote a plan file: ${plans.join(', ')} — the anchor was removed and nothing reads one`);

  const row = findRow(e.backlogRows, CAPTURED);
  if (!row) failures.push(`no ${CAPTURED} row in docs/BACKLOG.md`);
  else {
    if (row.status !== 'Done') failures.push(`${CAPTURED} status is "${row.status}", not Done`);
    if (!/Done inline/i.test(row.source || '')) failures.push(`${CAPTURED} Source is "${row.source}", which does not carry "Done inline"`);
  }
  if (!e.check) failures.push('node check.mjs was never run in the scratch root');
  else if (e.check.exit !== 0) failures.push(`node check.mjs still exits ${e.check.exit} — the defect was not fixed`);
  return verdictOf(failures);
}

// ----------------------------------------------------------------- the harvest

// Everything a judge is allowed to read, harvested from the scratch repo itself.
export function harvest(root, seedHash) {
  const log = git(root, ['log', '--reverse', '--format=%H%x00%s', `${seedHash}..HEAD`]);
  const commits = log.stdout ? log.stdout.split('\n').filter(Boolean).map((line) => {
    const [hash, subject] = line.split('\0');
    const files = git(root, ['show', '--name-only', '--format=', hash]).stdout;
    return { hash, subject, files: files ? files.split('\n').filter(Boolean) : [] };
  }) : [];

  let backlog = '';
  try { backlog = readFileSync(join(root, 'docs/BACKLOG.md'), 'utf8'); } catch { /* a run that deleted it is a finding the judges name */ }

  const plansDir = join(root, 'docs/plans');
  let anchors = [];
  try {
    anchors = readdirSync(plansDir).filter((f) => f.endsWith('.md')).sort().map((f) => ({
      path: `docs/plans/${f}`,
      text: readFileSync(join(plansDir, f), 'utf8'),
    }));
  } catch { /* no docs/plans/ is the expected state for three of four branches */ }

  // `check.mjs` is read here, from the repo under test and the
  // scratch root — never from whatever the child happened to run.
  let check = null;
  if (existsSync(join(root, 'check.mjs'))) {
    const r = spawnSync('node', ['check.mjs'], { cwd: root, encoding: 'utf8' });
    check = { exit: r.status ?? 1 };
  }

  const dirty = git(root, ['status', '--porcelain']).stdout;
  return {
    commits,
    backlogRows: parseBacklogRows(backlog),
    anchors,
    check,
    dirty: dirty ? dirty.split('\n').filter(Boolean) : [],
  };
}

// ------------------------------------------------------------------ the runner

export const USAGE = [
  'usage: smoke-work-capture.mjs [--only <branch>] [--keep] [--out <file>] [--timeout <s>]',
  '       smoke-work-capture.mjs --parse < <capture.jsonl>',
  '',
  `  live: one billed headless run per P-07 branch (${BRANCHES.join(', ')}), each against a`,
  '        throwaway seed repo; the verdict is read off that repo\'s commits, ledger rows,',
  '        never off the model\'s prose.',
  '  --parse: the same judges over a capture already saved on stdin — no spawn, no',
  '        repo, no network, no cost. This is how a judge is regression-tested.',
  '  --only requires --out: a narrowed run has no default destination, and refuses',
  '        before it spends rather than replacing rows it never bought. The checked-in',
  '        aggregate is earned, never aimed at: only a whole-registry run with no --out',
  '        that completed every row and re-judges green replaces it — so after a product',
  '        regression a red run keeps its capture at --out and leaves the aggregate alone.',
  '  Never wired into audit.sh — it bills on purpose.',
].join('\n');

const runner = createRunner({
  name: NAME,
  headerLabel: `${NAME} — /esq:work free-text capture (P-07)`,
  seedDir: SEED,
  seedLabel: 'tests/smoke/fixtures/seed/',
  rows: ROWS,
  candidates: CANDIDATES,
  harvest,
  rowMarker: ROW_MARKER,
  evidenceMarker: EVIDENCE_MARKER,
  rowKind: 'a P-07 branch',
  captureDefault: CAPTURE_DEFAULT,
  usage: USAGE,
  stdinHint: '--parse reads a capture on stdin: node scripts/smoke-work-capture.mjs --parse < tests/smoke/fixtures/capture.jsonl',
});

export const {
  captureRecords, judgeCapture, judgeEvidence, makeHeader, splitCapture, live, parse, main,
} = runner;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain(runner, NAME, process.argv.slice(2));
}
