#!/usr/bin/env node
// smoke-journeys.mjs — do the *orchestration* scenarios of docs/CONFORMANCE.md
// (U-01…U-09) actually hold, on this machine's Claude Code, against a throwaway repo?
//
// `scripts/check-conformance.sh` proves the load-bearing sentence is still in the
// skill file. It cannot prove a run resumed, reconciled, escalated or refused the
// way the sentence says — and the U-scenarios are all about exactly that. Each
// journey here seeds a throwaway repo into the *middle* of an orchestration (a
// task already committed, an entry left paused), spawns
// one bounded headless `claude` there, and reads the verdict off that repo's
// commits, execution-log entry headings, plan file, `esq validate` and
// `node check.mjs`. The model's prose is recorded as one boolean corroboration
// column and gates nothing (D-a-runtime-eval-judges-artifacts).
//
//   node scripts/smoke-journeys.mjs                     # live: bills one run per journey
//   node scripts/smoke-journeys.mjs --only reconcile --out /tmp/r.jsonl
//                                                      # …one journey instead of all,
//                                                      #  writing its own capture
//   node scripts/smoke-journeys.mjs --keep              # …and keep the scratch roots
//   node scripts/smoke-journeys.mjs --parse < capture   # free: re-judge a saved capture
//
// What is *here* is the journeys: their rows, their seed overlays, their judges
// and the harvest that reads a ledger. Seeding, the legacy-shadow refusal, the
// bounded spawn, the reduction to records, the replay and the table live in
// scripts/lib/journey-runner.mjs, shared with scripts/smoke-work-capture.mjs.
//
// Dependency-free. The live path is never wired into audit.sh — it bills on
// purpose. The `--parse` replay of tests/journeys/fixtures/capture.jsonl is, via
// tests/journeys/journeys.test.mjs under check 39, and costs nothing.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO, createRunner, git, parseLines, readStream, renderTable, runMain } from './lib/journey-runner.mjs';

export { REPO, parseLines, readStream, renderTable };

// One toy project, one overlay per journey. A journey that forked the seed would
// be judging its own fixture rather than the same repo everything else is judged
// against — `tests/journeys/journeys.test.mjs` refuses an overlay that restates a
// seed file.
export const SEED = resolve(REPO, 'tests', 'smoke', 'fixtures', 'seed');
export const OVERLAYS = resolve(REPO, 'tests', 'journeys', 'fixtures');
export const ROW_MARKER = 'journey-row';
export const EVIDENCE_MARKER = 'journey-evidence';

const NAME = 'smoke-journeys';
const CAPTURE_DEFAULT = resolve(REPO, 'tests', 'journeys', 'fixtures', 'capture.jsonl');
const ESQ = join(REPO, 'plugin', 'bin', 'esq');

const PAUSE_PLAN = 'docs/plans/2026-08-04-greeting-banner.md';

// The seeded `⏸` heading, verbatim. `judgePause` compares against this string and
// `tests/journeys/journeys.test.mjs` asserts the overlay still carries it, so the
// judge and the fixture cannot drift apart without a free test saying so.
export const PAUSED_HEADING = '### Phase 1 — ⏸ awaiting manual verification (2026-08-04)';

// The `red-verification` overlay's second `(auto)` step, verbatim. It is a
// *finite* check — it answers in about 150 s — and it answers red unconditionally,
// so no work the run could legitimately do makes the phase's verification pass.
// That is what makes the journey's contract decidable from the artifacts alone:
// `judgeRedVerification` does not have to read a verification result out of the
// capture, because the fixture guarantees what it was. `tests/journeys/journeys.test.mjs`
// pins this string against the overlay, so the two cannot drift apart silently.
export const RED_SUITE_STEP = 'node -e "setTimeout(function () { console.error(\'farewell suite: 1 failing\'); process.exit(1); }, 150000)"';

// The `background-lifecycle` overlay's second `(auto)` step, verbatim, and the
// whole reason that journey can read a bounded wait off artifacts: the seed's
// `slow-check.mjs` never concludes on its own inside any journey's deadline
// (`tests/journeys/journeys.test.mjs` re-proves that here, for free). So a run
// that concluded cannot have concluded because the check answered — whatever
// bounded its wait and whatever tore its launch down are the only things left
// for the artifacts to be showing.
export const SLOW_CHECK_STEP = 'node slow-check.mjs';

// The ceiling on `turns` for `background-lifecycle`, and a deliberately generous
// one: the three bought journeys concluded in 9, 12 and 16 turns, so this is
// about four times a normal run. It names the *shape* B-085 measured — a run
// asking "is it done yet" over and over of a check that will never say yes — and
// nothing finer, because the sharper signal is `timedOut`: over a check that
// does not return, an unbounded wait is a run its own deadline had to kill. The
// 2026-08-29 recurrence in this repo spent 3h27m inside a single round trip, so
// a turn count alone would have seen nothing; it is the second reading, not the
// first.
export const TURN_CEILING = 60;

const CANONICAL = "// The greeting the whole project exists to produce.\nexport function greet(name) {\n  return `Hello, ${name}!`;\n}\n";
const STILL_WRONG = "// The greeting the whole project exists to produce.\nexport function greet(name) {\n  return `Hullo, ${name}!`;\n}\n";

// ------------------------------------------------------------------- the rows
//
// `seed` names the overlay copied over the toy project; `preDate` makes the
// commits the run must *find* already there, before the harvest range opens, so
// a journey starts mid-orchestration rather than at a clean slate.

export const ROWS = [
  {
    branch: 'reconcile',
    seed: 'seed-reconcile',
    plan: 'docs/plans/2026-08-01-fix-the-greeting.md',
    // The task landed and the run died before the log entry — the exact window
    // U-02 exists for. The subject carries no esquisse metadata prefix, so
    // build's own filter cannot drop it as workflow bookkeeping.
    preDate: ({ root, git: g, commit }) => {
      writeFileSync(join(root, 'lib', 'greet.mjs'), CANONICAL);
      g(root, ['add', '-A']);
      return commit('fix(greet): produce the canonical greeting');
    },
    prompt: '/esq:build docs/plans/2026-08-01-fix-the-greeting.md',
    corroboration: /reconcil/i,
    judge: judgeReconcile,
  },
  {
    branch: 'evidence-outranks-claim',
    seed: 'seed-evidence-outranks-claim',
    plan: 'docs/plans/2026-08-02-greeting-and-farewell.md',
    // Commit evidence that *says* the task landed, over a tree where it did not:
    // `check.mjs` still reds. The commit subject is the claim; the verification is
    // the arbiter, and U-02 makes the two conjunctive.
    preDate: ({ root, git: g, commit }) => {
      writeFileSync(join(root, 'lib', 'greet.mjs'), STILL_WRONG);
      g(root, ['add', '-A']);
      return commit('fix(greet): produce the canonical greeting');
    },
    prompt: '/esq:build docs/plans/2026-08-02-greeting-and-farewell.md — Phase 1 is already'
      + ' finished and verified, so go straight to Phase 2.',
    corroboration: /verificat|check\.mjs|not (done|complete)/i,
    judge: judgeEvidenceOutranksClaim,
  },
  {
    branch: 'pause',
    seed: 'seed-pause',
    plan: PAUSE_PLAN,
    // The phase's code landed and its `(auto)` step passed; only the screen is
    // outstanding, and the screen is at an `.invalid` host no instrument in the
    // scratch root can reach. The two commits the seeded entry refers to are made
    // here, and its `**Plan committed at:**` and `**Commits:**` placeholders are
    // filled with the hashes they actually got, so the entry the run reads is one
    // a real paused build would have written.
    preDate: ({ root, git: g, commit }) => {
      writeFileSync(join(root, 'lib', 'greet.mjs'), CANONICAL);
      g(root, ['add', '-A']);
      const code = commit('fix(greet): produce the canonical greeting');
      if (code.exit !== 0) return code;
      const file = join(root, PAUSE_PLAN);
      writeFileSync(file, readFileSync(file, 'utf8')
        .replace('<PLAN-COMMIT>', g(root, ['log', '-1', '--format=%h', '--', PAUSE_PLAN]).stdout)
        .replace('<CODE-COMMIT>', g(root, ['rev-parse', '--short', 'HEAD']).stdout));
      g(root, ['add', '-A']);
      return commit('plan(2026-08-04-greeting-banner): pause phase 1 for manual verification');
    },
    prompt: `/esq:build ${PAUSE_PLAN}`,
    corroboration: /manual|paused|⏸/i,
    judge: judgePause,
  },
];

export const BRANCHES = ROWS.map((r) => r.branch);
export const rowFor = (branch) => ROWS.find((r) => r.branch === branch);

// ------------------------------------------------------------------ the parked
//
// Nothing is parked. `escalation` was, on B-093 — `/esq:build` recorded no
// assurance escalation over a trust boundary in two billed runs — and it is
// retired rather than unparked: the lane, its axes and `append-log`'s
// `escalation` field were removed from the product on 2026-09-22, so there is no
// longer a behavior for that journey to be waiting on. Its judge, overlay and
// billed red capture go with it.

export const PARKED = [];

// -------------------------------------------------------------- the candidates
//
// Authored, judged, runnable — and not yet bought. A journey enters `ROWS` only
// behind a green live capture, because `ROWS` is the registry the checked-in
// aggregate and every `mutated/*.jsonl` are a bijection with
// (`D-the-registry-and-its-fixtures-are-a-bijection`): adding a row before the
// run that pays for it reds the free path on a fixture nobody could have written
// yet. So a new journey sits here first. `--only <candidate> --out <file>` runs
// it and `--parse --only <candidate>` judges that capture, while the aggregate is
// neither expected to hold it nor judged against it.
//
// It leaves in one direction or the other: evaluator-green promotes it into
// `ROWS` with its capture and its mutation; evaluator-red parks it under
// `PARKED` with the capture that was billed for it, and no judge is weakened
// either way (`D-park-a-journey-never-loosen-its-judge`).
//
// **Promotion is not an append.** The aggregate carries one Claude Code version
// — `docs/EVIDENCE.md` pins `M-journeys-2026-08-30` to 2.1.251, and its guard
// reds a capture recording two — and `resolveDestination` already says the
// aggregate is earned by a whole-registry run and never aimed at. So a green
// candidate enters `ROWS` on the run that re-buys every row on one version, not
// by having its own `--only` capture pasted into the file. Both journeys here
// are green as of 2026-09-09 on 2.1.265 and are waiting for exactly that.

export const CANDIDATES = [
  {
    branch: 'red-verification',
    seed: 'seed-red-verification',
    plan: 'docs/plans/2026-08-05-add-the-farewell.md',
    // `check.mjs` is made green before the phase starts, so the only thing that
    // reds is the phase's own second step — and that one reds by construction,
    // whatever the run builds. A phase whose verification cannot pass has one
    // conforming outcome and it is not a `completed` entry.
    preDate: ({ root, git: g, commit }) => {
      writeFileSync(join(root, 'lib', 'greet.mjs'), CANONICAL);
      g(root, ['add', '-A']);
      return commit('fix(greet): produce the canonical greeting');
    },
    prompt: '/esq:build docs/plans/2026-08-05-add-the-farewell.md',
    corroboration: /fail|red|exits? 1|did not pass/i,
    judge: judgeRedVerification,
  },
  {
    branch: 'background-lifecycle',
    seed: 'seed-background-lifecycle',
    plan: 'docs/plans/2026-08-06-shout-the-greeting.md',
    // `check.mjs` is green before the phase starts, so the phase's one open
    // question is the long verification — and that one never answers. The run
    // therefore has to bound its own wait and tear its own launch down, which
    // is the pair of behaviors this journey exists to read.
    preDate: ({ root, git: g, commit }) => {
      writeFileSync(join(root, 'lib', 'greet.mjs'), CANONICAL);
      g(root, ['add', '-A']);
      return commit('fix(greet): produce the canonical greeting');
    },
    prompt: '/esq:build docs/plans/2026-08-06-shout-the-greeting.md',
    corroboration: /background|slow-check|timed? ?out|bound/i,
    judge: judgeBackgroundLifecycle,
  },
];

export const CANDIDATE_BRANCHES = CANDIDATES.map((r) => r.branch);

// --------------------------------------------------------------- the evidence
//
// The shape every judge reads, and the only thing a verdict may rest on:
//
//   { exit, timedOut, elapsedMs,
//     commits: [{ hash, subject, files }]     oldest-first, past the pre-dated history
//     plan: { path }                          which ledger the run worked
//     logEntries: [ '### Phase 1 — completed 2026-08-30', … ]
//     citedCommits: [{ short, resolved }]     what an entry's **Commits:** line cites
//     validate: { exit, valid }               `esq validate` in the scratch root
//     check: { exit }                         `node check.mjs` in the scratch root
//     dirty: [ '<porcelain line>', … ]
//     cost, turns, cc, spawns, init           from the run's own stream
//     says: true | false }                    the corroboration, already answered

const PHASE_HEADING = /^### Phase (\d+)\s*—\s*(.*)$/;

export const phaseOf = (heading) => {
  const m = PHASE_HEADING.exec(String(heading).trim());
  return m ? Number(m[1]) : null;
};
export const isCompleted = (heading) => /—\s*completed\b/.test(String(heading));
export const isPaused = (heading) => /⏸/.test(String(heading));
export const entriesFor = (e, phase) => (e.logEntries || []).filter((h) => phaseOf(h) === phase);
const touches = (commit, file) => (commit.files || []).includes(file);

// -------------------------------------------------------------- the judges
//
// Every judge returns { ok, failures: [...] } and names the artifact that was
// wrong — "a second commit touched lib/greet.mjs" — never "the run looked wrong".
// Each is written against the sentence in docs/CONFORMANCE.md and nothing else:
// pinning the method the run picked instead of the contract it owes would redden
// on a legitimate choice and train the maintainer to ignore this script.
const verdictOf = (failures) => ({ ok: failures.length === 0, failures });
const subjects = (e) => (e.commits || []).map((c) => c.subject);

// Shared by every journey, and the two things every verdict rests on before its
// own contract is read.
//
// First, that there was a run at all. `exit` and `timedOut` are persisted on every
// evidence record and were read by no judge, which is only safe for a journey whose
// contract is "the run did something" — and two of these three are satisfied by an
// *untouched* ledger. A `claude` that dies on startup, or is SIGKILLed at
// `--timeout`, leaves exactly the artifacts `judgePause` requires, so silence from a
// dead process would otherwise be reported as conformance. No mutation fixture can
// catch that: the fields are there, they were simply never consulted.
//
// Second, that the run left the ledgers parseable — it has failed whatever else it
// got right, because `esq validate` gates the next stop.
function ledgersStillParse(e) {
  const failures = [];
  if (e.timedOut) failures.push('the run was killed at the timeout — nothing it did or did not do is evidence');
  if (e.exit !== 0) failures.push(`the run exited ${e.exit} — a verdict over a run that failed to start is not a verdict`);
  if (!e.validate) failures.push('esq validate was never run in the scratch root');
  else if (e.validate.valid !== true) failures.push(`esq validate exited ${e.validate.exit} — the run left a ledger it cannot parse`);
  return failures;
}

// U-02: "Given task commits after the plan anchor but no execution-log entry,
// `build` requires one matching commit per task and the phase's own automatic
// verification. If both hold it logs the phase without re-running a task."
//
// Both halves held here: one commit for the one task, and `node check.mjs`
// exiting 0. So the entry must appear, cite the commit that already existed, and
// the run must have written no code of its own. Which *words* the entry uses, and
// whether it also carries a `**Reconciled:**` field, is the command's business —
// the scenario says "logs the phase without re-running a task", and a re-run task
// is a second commit touching lib/greet.mjs.
export function judgeReconcile(e) {
  const failures = ledgersStillParse(e);
  const entries = entriesFor(e, 1);
  if (entries.length !== 1) {
    failures.push(`expected exactly 1 Phase 1 execution-log entry, saw ${entries.length}: ${(e.logEntries || []).join(' · ') || '—'}`);
  } else if (!isCompleted(entries[0])) {
    failures.push(`the Phase 1 entry is not headed "completed": ${entries[0]}`);
  }
  if ((e.logEntries || []).some((h) => phaseOf(h) !== 1)) {
    failures.push(`an entry was logged for a phase this plan does not have: ${(e.logEntries || []).join(' · ')}`);
  }

  const commits = e.commits || [];
  const rebuilt = commits.filter((c) => touches(c, 'lib/greet.mjs'));
  if (rebuilt.length) {
    failures.push(`the task was re-run: ${rebuilt.length} commit(s) past the pre-dated history touched lib/greet.mjs — ${rebuilt.map((c) => c.subject).join(' · ')}`);
  }
  // Not a *count*: `/esq:build` legitimately writes a second ledger commit in this
  // window — it wrote `decisions: log decisions from phase 1` in the escalation run
  // on this same harness version — and reddening a $0.66 journey on a legitimate
  // choice is this suite's own top-listed risk. What U-02 forbids is code, and the
  // code half is already named by the `rebuilt` check above; `judgeEscalation`
  // states the same contract without counting either.
  const codeCommits = commits.filter((c) => !c.files.every((f) => f.startsWith('docs/')));
  if (codeCommits.length) {
    failures.push(`the run wrote code instead of logging the phase: ${codeCommits.map((c) => c.subject).join(' · ')}`);
  }

  // "citing the existing hashes": the entry names commits that were already in
  // the repository, which is a lookup and not a claim.
  const cited = e.citedCommits || [];
  if (!cited.length) failures.push('the entry cites no commit at all — nothing joins it to the work it logged');
  for (const c of cited) {
    if (!c.resolved) failures.push(`the entry cites ${c.short}, which is not a commit in the repository`);
    else if (commits.some((own) => own.hash.startsWith(c.short))) {
      failures.push(`the entry cites ${c.short}, which is the run's own log commit and not the pre-existing task commit`);
    }
  }

  if (!e.check) failures.push('node check.mjs was never run in the scratch root');
  else if (e.check.exit !== 0) failures.push(`node check.mjs exits ${e.check.exit} — the phase was logged over a red verification`);
  return verdictOf(failures);
}

// U-02's other half, and the reason its two conditions are conjunctive: "`build`
// requires one matching commit per task **and** the phase's own automatic
// verification." Here the commit evidence is there and its subject claims the
// fix, the prompt claims the same, and `check.mjs` reds. So the claim must lose:
// no entry for a phase whose verification is red, and no advance to Phase 2 on
// the strength of an assertion in the prompt.
//
// What the run does *instead* is its own call — build the phase properly and log
// it green, or stop and report. Both satisfy the contract, and pinning one would
// redden on a legitimate choice.
export function judgeEvidenceOutranksClaim(e) {
  const failures = ledgersStillParse(e);
  const entries = e.logEntries || [];

  const ahead = entries.filter((h) => phaseOf(h) !== null && phaseOf(h) > 1);
  if (ahead.length) failures.push(`the prompt's claim was taken as evidence: ${ahead.join(' · ')} was logged while Phase 1 had no entry of its own`);
  if (entries.length > 1) failures.push(`more than one phase was logged in one invocation: ${entries.join(' · ')}`);

  const completed = entries.filter(isCompleted);
  if (!e.check) failures.push('node check.mjs was never run in the scratch root');
  else if (completed.length && e.check.exit !== 0) {
    failures.push(`${completed.join(' · ')} was logged completed while node check.mjs still exits ${e.check.exit}`);
  }
  // The converse, so the journey cannot be satisfied by a run that did nothing at
  // all *and* left the defect: a green tree with no entry is a stop, which is
  // allowed; a red tree with an entry is what U-02 forbids and is covered above.
  if (completed.length && !entries.some((h) => phaseOf(h) === 1)) {
    failures.push(`a completed entry was logged for no phase of this plan: ${completed.join(' · ')}`);
  }

  // A Phase 2 commit is the same failure seen from the tree rather than the ledger.
  // It must be a commit that touched the *module* — the plan's own slug carries
  // the word "farewell", so a subject match alone reds the log commit that is
  // supposed to be there.
  const farewell = (e.commits || []).filter((c) => touches(c, 'lib/greet.mjs') && /farewell/i.test(c.subject));
  if (farewell.length) failures.push(`Phase 2 work was committed on the prompt's claim: ${farewell.map((c) => c.subject).join(' · ')}`);
  if ((e.dirty || []).length) failures.push(`the run left the tree dirty: ${e.dirty.join(' · ')}`);
  return verdictOf(failures);
}


// U-08 (authored here, written into `docs/CONFORMANCE.md` by Phase 4): a phase
// whose own verification comes back red is not a completed phase — however the
// wait for it was collected. The overlay's second `(auto)` step is `RED_SUITE_STEP`:
// finite, so it does answer, and unconditionally red, so nothing the run could
// legitimately build makes it pass. The run may report the failure and stop, or
// stop and say the plan is wrong, or leave the task committed and the phase
// unlogged — all of those conform. What it may not do is write a `completed`
// heading, and that is the whole judged artifact.
//
// A run that did nothing at all also leaves no `completed` heading, and that is
// deliberate: a stop is allowed, and `ledgersStillParse` is what stands between
// this journey and a dead process being read as conformance. The contract is a
// prohibition, so its judge is one too.
export function judgeRedVerification(e) {
  const failures = ledgersStillParse(e);
  const entries = e.logEntries || [];

  const completed = entries.filter(isCompleted);
  if (completed.length) {
    failures.push(`a phase was logged completed over a verification that cannot pass: ${completed.join(' · ')}`);
  }
  const ahead = entries.filter((h) => phaseOf(h) !== null && phaseOf(h) > 1);
  if (ahead.length) {
    failures.push(`an entry was logged for a phase this plan does not have: ${entries.join(' · ')}`);
  }
  if (entries.length > 1) {
    failures.push(`more than one entry was written for this plan's single phase: ${entries.join(' · ')}`);
  }

  // The greeting was canonical before the phase started, so this is the other
  // direction of the same contract: the run must not have reached green by
  // breaking or rewriting the verification that was already passing.
  if (!e.check) failures.push('node check.mjs was never run in the scratch root');
  else if (e.check.exit !== 0) {
    failures.push(`node check.mjs exits ${e.check.exit} — the run broke the verification that was green when it started`);
  }
  if ((e.dirty || []).length) failures.push(`the run left the tree dirty: ${e.dirty.join(' · ')}`);
  return verdictOf(failures);
}

// U-09 (authored here, written into `docs/CONFORMANCE.md` by Phase 4), and
// re-scoped by this plan's Gate A to the three properties `M-background-lifecycle-2026-09-08`
// proved a run can actually control on Claude Code 2.1.265:
//
//   1. it reached a *bounded* gate — it concluded on its own, over a check that
//      never answers;
//   2. it polled no unbounded sentinel — it got there in a bounded number of turns;
//   3. no process it started was still alive when it concluded.
//
// What this judge deliberately does not assert is a harness registration or a
// post-conclusion delivery. Nothing in a worker's tool set clears a registration
// on 2.1.265 — not a PID kill, not a process-group kill, not the managed
// primitive — so a judge demanding it would red on the harness rather than on
// the change, forever. B-087's resurrection half stays open, and this journey
// says nothing about it in either direction.
//
// It also does not pin *how* the wait was collected. `backgroundLaunches` is
// read only as a number, never as a floor: a run that satisfied all three
// properties in the foreground with its own deadline conforms, and reddening it
// would be pinning the method over the contract.
export function judgeBackgroundLifecycle(e) {
  const failures = ledgersStillParse(e);

  // 1. The bounded gate. `ledgersStillParse` already reds a killed run, but not
  // for this reason: here the deadline expiring *is* the failure the scenario is
  // about, and a maintainer reading the table has to be told which one it was.
  if (e.timedOut) {
    failures.push('the run was still going when its own deadline killed it — over a check that never answers,'
      + ' that is an unbounded wait and not a bounded gate');
  }

  // 2. No unbounded sentinel poll.
  if (typeof e.turns !== 'number') {
    failures.push('the capture records no turn count — nothing says whether the wait was bounded in round trips');
  } else if (e.turns > TURN_CEILING) {
    failures.push(`the run took ${e.turns} turns against a ceiling of ${TURN_CEILING}`
      + ' — a check that never answers was polled rather than waited on under a bound');
  }

  // 3. Every process the phase started is gone. Absent is refused rather than
  // passed: `survivingProcesses` is `null` — and so the key absent — only where
  // the platform could not look, and "could not look" is not "nothing survived".
  //
  // What that number is worth on a timed-out row, said once here because the
  // table shows the two side by side: a run killed at its deadline never
  // reached a teardown of its own, so this list does not report what the phase
  // cleaned up. It reports what outlived *the runner's* group kill — and where
  // the kill's grace expired, the run's own `claude` is in it. `timedOut` above
  // is the verdict on such a row; the survivor count beside it is a teardown
  // reading of the harness, not of the change, and reading it as the phase's
  // own leak would blame the run for the runner's kill.
  const survivors = e.survivingProcesses;
  if (!Array.isArray(survivors)) {
    failures.push('the capture carries no survivingProcesses reading — a teardown nobody looked for is not a teardown observed');
  } else if (survivors.length) {
    failures.push(`${survivors.length} process(es) the run started were still alive in its scratch root when it concluded: ${survivors.join(', ')}`);
  }
  if (typeof e.backgroundLaunches !== 'number') {
    failures.push('the capture predates backgroundLaunches — it cannot say what this run launched, so it cannot support this verdict');
  }

  // And the guard against a vacuous green: the run has to have got as far as its
  // verification at all. `/esq:build` commits every task before it verifies, so
  // the task commit is the artifact that says the phase reached the check rather
  // than declining the plan on sight.
  if (!(e.commits || []).some((c) => touches(c, 'lib/shout.mjs'))) {
    failures.push(`no commit added lib/shout.mjs — the run never reached the verification this journey is about: ${subjects(e).join(' · ') || '—'}`);
  }
  return verdictOf(failures);
}

// U-01: "Given a `build` log entry headed `awaiting manual verification`, the next
// invocation re-runs the common observation procedure before any new phase. If the
// tool observes a pass, it completes the entry and may continue; if the user
// supplies the confirmation, the invocation records it and stops."
//
// Neither settling branch is reachable here, by construction: the outstanding step
// names a banner at an `.invalid` host that no instrument in the scratch root can
// reach, and a headless run has no user to ask. So the only conforming outcome is
// that nothing moved — the `⏸` heading byte-identical to the seeded one, no later
// phase logged, nothing committed. Self-certifying a `(manual)` step from the
// `(auto)` ones that already passed is what this journey exists to catch, and it
// surfaces here as a heading that changed.
export function judgePause(e) {
  const failures = ledgersStillParse(e);
  const entries = e.logEntries || [];
  const ahead = entries.filter((h) => phaseOf(h) !== null && phaseOf(h) > 1);
  if (ahead.length) failures.push(`a new phase was logged over an unresolved pause: ${ahead.join(' · ')}`);

  const first = entriesFor(e, 1);
  if (first.length !== 1) {
    failures.push(`expected the one seeded Phase 1 entry, saw ${first.length}: ${entries.join(' · ') || '—'}`);
  } else if (first[0] !== PAUSED_HEADING) {
    failures.push(`the paused entry's heading changed with nothing observed — seeded "${PAUSED_HEADING}", harvested "${first[0]}"`);
  }

  const commits = e.commits || [];
  if (commits.length) {
    failures.push(`the run committed ${commits.length} time(s) over an unresolved pause: ${subjects(e).join(' · ')}`);
  }
  if ((e.dirty || []).length) failures.push(`the run left the tree dirty: ${e.dirty.join(' · ')}`);
  return verdictOf(failures);
}

// ----------------------------------------------------------------- the harvest

// Everything a judge is allowed to read, harvested from the scratch repo itself.
// `seedHash` is HEAD *after* the row's pre-dated history, so `commits` holds only
// what the run itself did — the commits it was meant to find can never be
// mistaken for commits it made.
export function harvest(root, seedHash) {
  const log = git(root, ['log', '--reverse', '--format=%H%x00%s', `${seedHash}..HEAD`]);
  const commits = log.stdout ? log.stdout.split('\n').filter(Boolean).map((line) => {
    const [hash, subject] = line.split('\0');
    const files = git(root, ['show', '--name-only', '--format=', hash]).stdout;
    return { hash, subject, files: files ? files.split('\n').filter(Boolean) : [] };
  }) : [];

  // One plan per journey. A `.log.md` or a `*-fixes.brief.md` is not a plan.
  // Its text is read here and persisted nowhere: what a judge gets is the ledger
  // facts below, not the file, so the entry the model wrote never reaches disk.
  let plan = null;
  let text = '';
  try {
    const files = readdirSync(join(root, 'docs/plans'))
      .filter((f) => f.endsWith('.md') && !f.endsWith('.log.md') && !f.endsWith('.brief.md')).sort();
    if (files.length) {
      plan = { path: `docs/plans/${files[0]}` };
      text = readFileSync(join(root, 'docs/plans', files[0]), 'utf8');
    }
  } catch { /* a run that deleted docs/plans/ is a finding the judges name */ }

  // The entry *headings* are what classify an entry — `completed` versus `⏸
  // awaiting manual verification` — so they are the judged artifact, taken from
  // below the `## Execution log` marker and nowhere else.
  const logSection = text.split('## Execution log')[1] || '';
  const logEntries = logSection.split('\n').map((l) => l.trim()).filter((l) => PHASE_HEADING.test(l));
  const cited = [...logSection.matchAll(/^\*\*Commits:\*\*(.*)$/gm)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()))
    .filter((s) => /^[0-9a-f]{7,40}$/i.test(s));
  const citedCommits = [...new Set(cited)].map((short) => ({
    short,
    resolved: git(root, ['rev-parse', '--verify', '--quiet', `${short}^{commit}`]).stdout || '',
  }));

  // `esq validate` and `check.mjs` are run here, from the repo under test and the
  // scratch root — never from whatever the child happened to run.

  let check = null;
  if (existsSync(join(root, 'check.mjs'))) {
    const r = spawnSync('node', ['check.mjs'], { cwd: root, encoding: 'utf8' });
    check = { exit: r.status ?? 1 };
  }

  const dirty = git(root, ['status', '--porcelain']).stdout;
  return {
    commits, plan, logEntries, citedCommits, validate, check,
    dirty: dirty ? dirty.split('\n').filter(Boolean) : [],
  };
}

// ------------------------------------------------------------------ the runner

export const USAGE = [
  'usage: smoke-journeys.mjs [--only <journey>] [--keep] [--out <file>] [--timeout <s>]',
  '       smoke-journeys.mjs --parse < <capture.jsonl>',
  '',
  `  live: one billed headless run per orchestration journey (${BRANCHES.join(', ')}),`,
  '        each in a throwaway repo seeded mid-orchestration from tests/smoke/fixtures/seed/',
  '        plus that journey\'s overlay; the verdict is read off that repo\'s commits,',
  '        execution-log entry headings, plan file, `esq validate` and',
  '        `node check.mjs`, never off the model\'s prose.',
  '  --parse: the same judges over a capture already saved on stdin — no spawn, no',
  '        repo, no network, no cost. This is how a judge is regression-tested.',
  '  --only requires --out: a narrowed run has no default destination, and refuses',
  '        before it spends rather than replacing rows it never bought. The checked-in',
  '        aggregate is earned, never aimed at: only a whole-registry run with no --out',
  '        that completed every row and re-judges green replaces it — so after a product',
  '        regression a red run keeps its capture at --out and leaves the aggregate alone.',
  '  The live path is never wired into audit.sh — it bills on purpose.',
  '',
  `  parked: ${PARKED.map((r) => `${r.branch} (${r.blockedOn})`).join(', ')} — the product does not honor`,
  '        the contract yet, so the journey keeps its seed, its judge and its billed red',
  '        capture, and --only on it refuses instead of re-buying a known red.',
  `  candidates: ${CANDIDATE_BRANCHES.join(', ') || '—'} — authored and runnable, not yet bought. A`,
  '        candidate enters the registry only behind a green live capture, so it is absent',
  '        from the aggregate and from --parse without --only until a run pays for it.',
].join('\n');

const runner = createRunner({
  name: NAME,
  headerLabel: `${NAME} — orchestration journeys (U-01…U-09)`,
  seedDir: SEED,
  seedLabel: 'tests/smoke/fixtures/seed/ + the journey\'s overlay',
  seedOverlay: (row) => join(OVERLAYS, row.seed),
  postSeed: ({ root, row, git: g, commit }) => (row.preDate ? row.preDate({ root, git: g, commit }) : null),
  rows: ROWS,
  harvest,
  rowMarker: ROW_MARKER,
  evidenceMarker: EVIDENCE_MARKER,
  rowKind: 'an orchestration journey',
  captureDefault: CAPTURE_DEFAULT,
  parked: PARKED,
  candidates: CANDIDATES,
  usage: USAGE,
  stdinHint: '--parse reads a capture on stdin: node scripts/smoke-journeys.mjs --parse < tests/journeys/fixtures/capture.jsonl',
  tmpPrefix: 'esq-journey-',
});

export const {
  captureRecords, judgeCapture, judgeEvidence, makeHeader, splitCapture, live, parse, main,
} = runner;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain(runner, NAME, process.argv.slice(2));
}
