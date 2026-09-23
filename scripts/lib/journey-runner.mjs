// journey-runner.mjs — the impure half of a bespoke runtime eval, once.
//
// A runtime eval in this repo has the same shape every time: seed a throwaway
// repo from a fixture dir, spawn one bounded headless `claude` in it with
// permissions bypassed and telemetry off, harvest the artifacts it left behind,
// reduce them to schema records, judge the records, print a table — and be able
// to replay that capture later, from a file, for nothing. Only three of those
// steps are specific to the scenario under test: the seed, the rows, and what a
// harvest reads. Everything else is this module.
//
// It exists because a second consumer arrived (`scripts/smoke-journeys.mjs`,
// B-032), not in anticipation of one: `scripts/smoke-work-capture.mjs` is the
// first, and the proof the extraction changed nothing is that its checked-in
// capture still replays four green without moving a byte.
//
//   const runner = createRunner({ name, headerLabel, seedDir, seedLabel, rows,
//                                 harvest, rowMarker, evidenceMarker, rowKind,
//                                 captureDefault, usage, stdinHint,
//                                 seedOverlay, postSeed, childEnv, columns });
//   runner.main(process.argv.slice(2));
//
// Dependency-free. Nothing here is wired into audit.sh — the live half bills.

import { spawn, spawnSync } from 'node:child_process';
import { accessSync, constants, cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRecord, openCapture, planCapture, writeCapture } from './capture-schema.mjs';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const TIMEOUT_DEFAULT_S = 600;

// How long after the group kill `runOne` still waits for `close` before it
// destroys the pipes and resolves with what it has. Overridable per call so the
// tests that prove this path stay sub-second inside check 39's bound.
export const KILL_GRACE_MS = 5000;

// ------------------------------------------------------------------ teardown

// The one teardown primitive: `SIGKILL` to the whole process group a `detached`
// spawn leads, addressed as a negative pid the way Node's own documentation
// specifies (`nodejs.org/api/child_process.html#optionsdetached`, checked
// 2026-09-09).
//
// Killing the pid alone is not a teardown: a killed `claude`'s own children keep
// the stdio pipes it inherited open, so `close` never fires and the deadline that
// waits for it is not a deadline (B-135). The group is the unit the run created,
// so it can only ever contain this run's own descendants.
//
// `ESRCH` means the group is already gone, which is success — and there is
// deliberately **no** fallback to `child.kill()` on it: on that race there is
// nothing left to signal, and a single-pid retry would be group teardown quietly
// weakened to something narrower. Every other error propagates: a teardown that
// cannot do what it says should say so, rather than hiding a half-killed tree
// behind a green run.
//
// Returns true when a signal was delivered, false when the group was already
// gone. Never called from a stored pid — only from inside the timer whose child
// is still referenced, because a negative pid computed from a reused number is a
// wider blast than anything this run started.
export function killGroup(pid) {
  try {
    process.kill(-pid, 'SIGKILL');
    return true;
  } catch (err) {
    if (err && err.code === 'ESRCH') return false;
    throw err;
  }
}

// ------------------------------------------------------------------ streams

export function parseLines(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* non-JSON noise (stderr, banners) is not evidence */ }
  }
  return out;
}

// Reads one run's stream for the columns a table shows. Never for a verdict:
// `system/init` gives the Claude Code version, `result` the bill, assistant text
// the corroboration, and every main-conversation `Agent`/`Task` tool_use is a
// spawn — a no-subagent command's non-zero count is a finding the table must
// show even when every artifact came out right.
export function readStream(events) {
  let text = '';
  let cost = null;
  let turns = null;
  let cc = null;
  let model = null;
  let spawns = 0;
  let backgroundLaunches = 0;
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    if (ev.type === 'system' && ev.subtype === 'init') {
      cc = ev.claude_code_version || cc;
      model = ev.model || model;
      continue;
    }
    if (ev.type === 'result') {
      if (typeof ev.total_cost_usd === 'number') cost = ev.total_cost_usd;
      if (typeof ev.num_turns === 'number') turns = ev.num_turns;
      continue;
    }
    if (ev.type !== 'assistant' || !ev.message) continue;
    const parent = ev.parent_tool_use_id ?? null;
    for (const part of ev.message.content || []) {
      if (!part) continue;
      if (part.type === 'text' && typeof part.text === 'string') text += part.text + '\n';
      if (parent === null && part.type === 'tool_use' && (part.name === 'Agent' || part.name === 'Task')) spawns++;
      // Every launch the run asked to run in the background, wherever it was
      // asked from: a phase's slow check is launched by the *worker*, so a count
      // restricted to the main conversation would read zero on the one run that
      // matters. The request is the fact — `run_in_background: true` on the tool
      // input — and nothing of the input itself survives past this counter.
      if (part.type === 'tool_use' && part.input && part.input.run_in_background === true) backgroundLaunches++;
    }
  }
  return { text, cost, turns, cc, model, spawns, backgroundLaunches };
}

// Which processes the run started were still alive in its scratch root when it
// concluded — the process half of a teardown judge (B-087), and the only half
// this plan ships: nothing clears a harness registration, so nothing here
// pretends to observe one (`M-background-lifecycle-2026-09-08`).
//
// Read from `/proc` alone, so it costs no dependency and no spawn. A pid whose
// cwd resolves inside `root` belongs to this run by construction: the root is a
// fresh `mkdtemp` nothing else on the machine is sitting in, and the runner
// never chdirs into it. Returns `null` where the platform has no `/proc`, so
// "not observable here" reads as absent rather than as a clean teardown.
export function survivingProcesses(root) {
  let entries;
  try { entries = readdirSync('/proc'); } catch { return null; }
  const self = resolve(root);
  const under = `${self}/`;
  const alive = [];
  for (const name of entries) {
    if (!/^\d+$/.test(name)) continue;
    let cwd;
    try { cwd = readlinkSync(join('/proc', name, 'cwd')); } catch { continue; }
    if (cwd === self || cwd.startsWith(under)) alive.push(Number(name));
  }
  return alive.sort((a, b) => a - b);
}

// ------------------------------------------------------------------- replay
//
// A capture is one row marker per branch, then one evidence record carrying that
// run's harvested artifacts and its already-derived columns. No harness event is
// persisted, so this still collects whatever sits between two markers only to
// replay a pre-schema capture.

export function splitCapture(events, { rowMarker, evidenceMarker }) {
  const rows = [];
  let cur = null;
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    if (ev.type === rowMarker) {
      cur = { branch: ev.branch, marker: ev, events: [], evidence: null };
      rows.push(cur);
      continue;
    }
    // Anything before the first marker belongs to no run and is not evidence.
    if (!cur) continue;
    if (ev.type === evidenceMarker) { cur.evidence = ev; continue; }
    cur.events.push(ev);
  }
  return rows;
}

// ------------------------------------------------------------------ the table

export const DEFAULT_COLUMNS = [
  ['branch', 'branch'], ['verdict', 'verdict'], ['commits', 'commits'],
  ['cost', 'cost'], ['turns', 'turns'], ['elapsed', 'elapsed'],
  ['spawns', 'spawns'], ['says', 'corroboration'], ['cc', 'cc'],
];

export function renderTable(header, judged, cols = DEFAULT_COLUMNS) {
  const width = cols.map(([k, h]) => Math.max(h.length, ...judged.map((r) => String(r[k]).length)));
  const line = (vals) => vals.map((v, i) => String(v).padEnd(width[i])).join('  ').trimEnd();
  const out = [header, '', line(cols.map(([, h]) => h)), line(width.map((w) => '-'.repeat(w)))];
  for (const r of judged) out.push(line(cols.map(([k]) => r[k])));
  for (const r of judged) {
    if (r.verdict === 'pass') continue;
    out.push('', `✖ ${r.branch}`);
    for (const f of r.failures) out.push(`    · ${f}`);
  }
  return out.join('\n');
}

// ------------------------------------------------------------------ live half
//
// The child writes and commits with permission checks bypassed, so the boundary
// is held three ways and none of them is prose: the cwd is a fresh mktemp root
// seeded from a fixture dir and no --add-dir is passed, so nothing outside that
// root is granted; ESQ_TELEMETRY=off is exported so neither hook writer records a
// proof run; and the run refuses before spawning anything when a legacy
// ~/.claude/commands/esq/ install would silently shadow the plugin under test.

export function git(root, args) {
  const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  return { exit: r.status ?? 1, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

export function claudeVersion() {
  const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return (r.stdout || '').trim().split(/\s+/)[0] || null;
}

export function createRunner(config) {
  const {
    name,                       // the script's own name, in every diagnostic
    headerLabel,                // the table header's first clause
    seedDir,                    // the fixture dir every scratch root is copied from
    seedLabel,                  // how that dir is named to a human, repo-relative
    rows,                       // [{ branch, prompt, corroboration, judge }]
    harvest,                    // (root, seedHash) → everything a judge may read
    rowMarker,
    evidenceMarker,
    rowKind,                    // "a P-07 branch", for the unknown-row diagnostic
    captureDefault,             // where a live run writes when --out is absent
    usage,
    stdinHint,
    columns = DEFAULT_COLUMNS,
    model = 'opus',
    shadowProbe = 'work.md',    // the legacy file whose presence means a shadow
    childEnv = () => ({}),      // per-root env the scenario needs (e.g. a seeded store)
    tmpPrefix = 'esq-smoke-',
    seedOverlay = () => null,   // (row) → a dir copied over the seed root, per row
    postSeed = null,            // ({ root, row, git, commit }) → history the run must find
    // Rows the product does not yet honor. A parked row keeps its seed, its judge
    // and its billed red capture — that capture is the evidence its backlog row
    // cites — but it is not in `branches`, so nothing judges it, nothing expects
    // it in a capture, and `--only <parked>` refuses naming the blocker rather
    // than re-buying a red everyone already knows about.
    parked = [],                // [{ branch, blockedOn, billed }]
    // Rows authored but not yet bought. A journey enters the registry only
    // behind a green live capture, so between the commit that writes its judge
    // and the run that pays for it there is a third state: runnable by
    // `--only`, judged when a capture of its own is replayed, and absent from
    // `branches` — so the aggregate is not expected to hold it and the free
    // path never reports a table shorter than the registry as green. It leaves
    // this list in one direction or the other: into `rows` on a green run, into
    // `parked` on a red one.
    candidates = [],            // [{ branch, … }] — full rows, minus the registry
  } = config;

  // The child of the row currently in flight, or null. `runOne` owns it; `live`
  // reads it from its signal handlers, which is the whole reason it is here and
  // not a local: `detached` took the child out of the terminal's foreground
  // group, so nothing but the runner will tear it down on an interrupt.
  let inFlight = null;

  const branches = rows.map((r) => r.branch);
  const rowFor = (branch) => rows.find((r) => r.branch === branch)
    || candidates.find((r) => r.branch === branch);
  const parkedFor = (branch) => parked.find((p) => p.branch === branch);

  function refuse(message) {
    console.error(`${name}: ${message}`);
    process.exit(2);
  }

  // Reads the persisted record and nothing else. Every column shown is a field
  // the record already carries — including `says`, which was answered by the
  // regex at capture time, because by here the prose it ran against is gone.
  function judgeEvidence(row, evidence) {
    const { ok, failures } = row.judge(evidence);
    return {
      branch: row.branch,
      verdict: ok ? 'pass' : 'FAIL',
      failures,
      cost: typeof evidence.cost === 'number' ? `$${evidence.cost.toFixed(2)}` : '—',
      turns: evidence.turns ?? '—',
      elapsed: typeof evidence.elapsedMs === 'number' ? `${(evidence.elapsedMs / 1000).toFixed(0)}s` : '—',
      spawns: evidence.spawns ?? '—',
      commits: (evidence.commits || []).length,
      says: evidence.says ? 'says it' : 'not said',
      cc: evidence.cc || '—',
    };
  }

  // The whole write side, in one function: what a billed run turns into on disk.
  // `live` calls it and so does its test, because an equivalence asserted against
  // a reimplementation of this proves nothing about what gets checked in.
  //
  // The raw stream goes in and does not come out. `readStream` reduces it to five
  // values, `row.corroboration` answers itself here, and `makeRecord` drops every
  // key the schema does not declare — so a field a future Claude Code adds to any
  // event never reaches the returned records, and neither does a word of prose.
  function captureRecords(row, { exit, timedOut, elapsedMs, events, harvested, survivors }) {
    const stream = readStream(events || []);
    const evidence = makeRecord(evidenceMarker, {
      exit,
      timedOut,
      elapsedMs,
      cost: stream.cost,
      turns: stream.turns,
      spawns: stream.spawns,
      cc: stream.cc,
      says: row.corroboration.test(stream.text || ''),
      // Declared by `journey-evidence` and not by `smoke-evidence`, so this is
      // kept for one and dropped at construction for the other — the schema
      // decides what a capture holds, never the call site.
      init: { model: stream.model, claude_code_version: stream.cc },
      // The two background-lifecycle facts, declared by `journey-evidence` and
      // by nothing else, so they are kept for a journey and dropped at
      // construction for the P-07 pair. Both are counts: how many launches the
      // run asked to run in the background, and which of the processes it
      // started were still alive in its scratch root when it concluded. A
      // platform that cannot answer the second leaves the key absent — never 0.
      backgroundLaunches: stream.backgroundLaunches,
      survivingProcesses: survivors == null ? undefined : survivors,
      ...harvested,
    });
    return [makeRecord(rowMarker, { branch: row.branch }), evidence];
  }

  // Replay compatibility, read side only. A capture written before the schema
  // kept the run's columns in a nested `stream` object beside the raw events; a
  // capture written now carries them flat, with `says` already answered. Both
  // still judge, and nothing here writes: what this branch reads, no path
  // produces any more.
  function withColumns(row, evidence, streamEvents) {
    if (typeof evidence.says === 'boolean') return evidence;
    const stream = evidence.stream || readStream(streamEvents);
    return {
      ...evidence,
      cost: stream.cost,
      turns: stream.turns,
      spawns: stream.spawns,
      cc: stream.cc || evidence.cc || null,
      says: row.corroboration.test(stream.text || ''),
    };
  }

  // Returns the judged rows plus `problems` — a capture that cannot be judged is
  // a finding of its own, never a silent pass over the rows that happened to parse.
  //
  // `expect` is the registry: every active branch must appear. Without it a
  // capture shorter than the registry replayed as a *green table over the rows
  // that happened to be there* — which is exactly how B-032's Phase 3 committed
  // four rows and two fixtures and left the free path agreeing the suite was
  // fine while the audit was red (D-the-registry-and-its-fixtures-are-a-bijection).
  // `{ only }` is the one deliberate narrowing, for replaying a single-journey
  // archive under `billed/`.
  function judgeCapture(events, { only = null } = {}) {
    const expected = only ? [only] : branches;
    const split = splitCapture(events, { rowMarker, evidenceMarker });
    const judged = [];
    const problems = [];
    const seen = new Set();
    for (const { branch, evidence, events: streamEvents } of split) {
      const row = rowFor(branch);
      if (!row) { problems.push(`the capture holds a row for "${branch}", which is not ${rowKind}`); continue; }
      if (seen.has(branch)) { problems.push(`the capture holds two rows for "${branch}"`); continue; }
      seen.add(branch);
      if (!evidence) { problems.push(`the "${branch}" row has no ${evidenceMarker} record — nothing to judge`); continue; }
      judged.push(judgeEvidence(row, withColumns(row, evidence, streamEvents)));
    }
    if (!split.length) problems.push(`no ${rowMarker} marker in the capture — this is not a ${name} capture`);
    for (const branch of expected) {
      if (!seen.has(branch)) {
        problems.push(`the capture holds no row for "${branch}", which is in the registry`
          + ' — a table shorter than the registry is not a green suite');
      }
    }
    const version = judged.map((r) => r.cc).find((c) => c && c !== '—')
      || split.map(({ events: ev }) => readStream(ev).cc).find(Boolean);
    return { judged, problems, version };
  }

  const makeHeader = ({ version, date, mode }) =>
    `${headerLabel} · Claude Code ${version || 'unknown'} · ${date}${mode ? ` · ${mode}` : ''}`;

  function parse(argv = []) {
    // The narrowing is resolved before stdin is touched, so `--parse --only` on a
    // parked branch refuses with its blocker rather than reporting the archive
    // it was pointed at as a capture missing every active row.
    const only = resolveOnly(argv);
    // A terminal stdin has no EOF until someone types one, so reading it first
    // would look like a hang to a contributor who forgot the redirection.
    if (process.stdin.isTTY) refuse(stdinHint);
    let text = '';
    try { text = readFileSync(0, 'utf8'); } catch { text = ''; }
    if (!text.trim()) refuse(stdinHint);
    const { judged, problems, version } = judgeCapture(parseLines(text), { only });
    const header = makeHeader({ version, date: new Date().toISOString().slice(0, 10), mode: 'parse (replayed, $0)' });
    console.log(judged.length ? renderTable(header, judged, columns) : header);
    for (const p of problems) console.error(`✖ capture: ${p}`);
    process.exit(problems.length || judged.some((r) => r.verdict !== 'pass') ? 1 : 0);
  }

  // Seed a throwaway repo and commit it, so every later commit is "past the
  // seed". The identity is passed per-command: a contributor with no global git
  // identity must not have this fail, and the child's own commits get theirs
  // from the env.
  //
  // `seedOverlay(row)` is copied over the seed *after* it, so a journey is an
  // overlay on one toy project and never a fork of it. `postSeed` then makes the
  // commits the scenario needs the run to *find* — a task that already landed, a
  // plan anchor older than it — and `seedHash` is re-read afterwards, so those
  // commits sit before the harvest range and can never be mistaken for the run's.
  function seedRoot(row = null) {
    const root = mkdtempSync(join(tmpdir(), tmpPrefix));
    cpSync(seedDir, root, { recursive: true });
    const overlay = row ? seedOverlay(row) : null;
    if (overlay) cpSync(overlay, root, { recursive: true });
    git(root, ['init', '-q', '-b', 'main']);
    git(root, ['add', '-A']);
    const commitAs = (message) => git(root, ['-c', 'user.name=esq smoke', '-c', 'user.email=smoke@esquisse.invalid', 'commit', '-q', '-m', message]);
    const commit = commitAs('seed: the toy project the smoke run works against');
    if (commit.exit !== 0) refuse(`could not seed ${root}: ${commit.stderr}`);
    if (postSeed) {
      const staged = postSeed({ root, row, git, commit: commitAs });
      if (staged && staged.exit !== 0) refuse(`could not pre-date ${row ? row.branch : 'the seed'} in ${root}: ${staged.stderr}`);
    }
    return { root, seedHash: git(root, ['rev-parse', 'HEAD']).stdout };
  }

  // Resolves at most once and always, inside `timeoutMs + graceMs`, whatever the
  // run left running underneath it. Two bounds, deliberately: the deadline takes
  // the process group down, which closes the inherited pipes and lets `close`
  // fire promptly — and the grace backstops that, because a process in
  // uninterruptible sleep cannot be killed by any signal and a harness that
  // assumes otherwise is back to the unbounded wait B-135 was filed for. On a
  // grace expiry the pipes are destroyed and whatever was buffered is returned.
  function runOne(prompt, root, timeoutMs, { graceMs = KILL_GRACE_MS } = {}) {
    return new Promise((resolvePromise, reject) => {
      const args = [
        '-p', '--model', model, '--plugin-dir', join(REPO, 'plugin'),
        '--output-format', 'stream-json', '--verbose',
        '--permission-mode', 'bypassPermissions',
      ];
      const child = spawn('claude', args, {
        cwd: root,
        // The child leads its own process group, so the deadline below can take
        // down the whole tree this run started rather than one pid inside it.
        // `unref()` is deliberately not paired with it: the runner must keep
        // waiting on this child. The cost is that the child leaves the
        // terminal's foreground group, so `SIGINT` no longer reaches it — `live`
        // repays that itself.
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ESQ_TELEMETRY: 'off',
          GIT_AUTHOR_NAME: 'esq smoke', GIT_AUTHOR_EMAIL: 'smoke@esquisse.invalid',
          GIT_COMMITTER_NAME: 'esq smoke', GIT_COMMITTER_EMAIL: 'smoke@esquisse.invalid',
          ...childEnv(root),
        },
      });
      inFlight = child;
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let settled = false;
      let grace = null;
      // Every exit from this promise goes through here, so the two timers, the
      // in-flight reference and the once-only guarantee are settled in one place
      // rather than at four call sites.
      const settle = (finish, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearTimeout(grace);
        if (inFlight === child) inFlight = null;
        finish(value);
      };
      const timer = setTimeout(() => {
        timedOut = true;
        try { killGroup(child.pid); } catch (err) { settle(reject, err); return; }
        grace = setTimeout(() => {
          // `close` has still not fired: something in that group outlived
          // SIGKILL or escaped it, and it is still holding the pipes open.
          // Destroying them is what makes the deadline a bound by construction.
          child.stdout.destroy();
          child.stderr.destroy();
          child.stdin.destroy();
          settle(resolvePromise, { code: null, stdout, stderr, timedOut: true });
        }, graceMs);
      }, timeoutMs);
      child.stdout.on('data', (d) => { stdout += d; });
      child.stderr.on('data', (d) => { stderr += d; });
      child.on('error', (e) => { settle(reject, e); });
      child.on('close', (code) => { settle(resolvePromise, { code, stdout, stderr, timedOut }); });
      child.stdin.end(prompt + '\n');
    });
  }

  function flagValue(argv, flag) {
    const i = argv.indexOf(flag);
    if (i < 0) return null;
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) refuse(`${flag} needs a value`);
    return value;
  }

  // The one place `--only` is resolved, for the billed path and the free one
  // alike: a parked branch refuses with its blocker before either can act on it.
  function resolveOnly(argv) {
    const only = flagValue(argv, '--only');
    if (!only) return null;
    const park = parkedFor(only);
    if (park) {
      refuse(`"${only}" is parked behind ${park.blockedOn} — nothing here re-buys a known red.\n`
        + `  Its billed capture is ${park.billed}; fix ${park.blockedOn}, then move the row back into the registry.`);
    }
    const runnable = [...branches, ...candidates.map((c) => c.branch)];
    if (!runnable.includes(only)) refuse(`--only takes one of ${runnable.join(', ')}`);
    return only;
  }

  // Where a live run's capture is allowed to land — resolved next to `--only`,
  // before the shadow probe and before any spawn, so every refusal below is free.
  //
  // A narrowed run has no default destination at all. `captureDefault` holds the
  // paid evidence for *every* row, so aiming one row's run at it replaces
  // evidence this run never bought — which is what B-098 is, and what cost the
  // $0.88 first escalation capture at b528629. The flag is required rather than
  // defaulted, and the refusal happens before a token is spent.
  //
  // Returns `{ outFile, explicit }`. `explicit` is the whole difference between
  // a destination the contributor named and the aggregate a run may only *earn*:
  // the aggregate is a candidate for a whole-registry run with no `--out`, never
  // for one that asked for it by name.
  //
  // What these checks are worth, stated here rather than only in the plan,
  // because the next reader is the one at risk of relying on them. Two of them
  // are deterministic — that `--out` resolves to `captureDefault`, and that its
  // parent exists and is a directory, are facts about the arguments and about a
  // path this repo owns. The other two are not: *does not exist* and *is
  // writable* are readings of a filesystem another process can change in the
  // next millisecond, so a run that passes them can still lose the race, and a
  // run that fails them was going to fail anyway. They are here to refuse a
  // likely mistake for free, before a token is spent — never to make the write
  // safe. Nothing below is a lock, and no `access(W_OK)` result is a security
  // property: the guarantee is the exclusive open itself, which `openSink` takes
  // — before the first spawn, through `openCapture`'s `wx` — and it is atomic
  // against every racer these reads cannot see. So a lost race now costs a
  // refusal at zero billed runs rather than a fallback after the spending.
  function resolveDestination(argv, only) {
    const requested = flagValue(argv, '--out');
    if (!requested) {
      if (only) {
        refuse(`--only ${only} has no default destination — pass --out <file>.\n`
          + `  ${captureDefault} is the whole registry's paid capture, and a ${only}-only run`
          + ' would replace rows it never bought.\n'
          + '  Pass a fresh path — nothing was spent.');
      }
      return { outFile: captureDefault, explicit: false };
    }

    const outFile = resolve(requested);
    if (outFile === resolve(captureDefault)) {
      refuse(`--out ${outFile} is the checked-in aggregate capture.\n`
        + '  It is earned, never aimed at: only a whole-registry run with no --out replaces it,'
        + ' and only when every row completed and the result re-judges green.\n'
        + '  Pass --out <a fresh file> instead — nothing was spent.');
    }
    if (existsSync(outFile)) {
      refuse(`--out ${outFile} already exists, and a capture is never written over.\n`
        + '  Pass --out <a path that does not exist yet> — nothing was spent.');
    }
    const parent = dirname(outFile);
    if (!existsSync(parent)) {
      refuse(`--out ${outFile} names a directory that does not exist: ${parent}\n`
        + '  Create it, or pass --out under a directory that is already there — nothing was spent.');
    }
    if (!statSync(parent).isDirectory()) {
      refuse(`--out ${outFile} is not under a directory: ${parent} is a file.\n`
        + '  Pass --out under a real directory — nothing was spent.');
    }
    // Best-effort, and last for that reason: a directory this says is writable
    // may not be by the time the capture is written, and one it says is not may
    // have been fixed by then. It buys a free refusal for the common case — a
    // read-only mount, a directory owned by someone else — and claims nothing.
    try {
      accessSync(parent, constants.W_OK);
    } catch {
      refuse(`--out ${outFile} is under a directory this process cannot write: ${parent}\n`
        + '  Pass --out somewhere writable — nothing was spent.');
    }
    return { outFile, explicit: true };
  }

  // Where this run's paid records land as they are produced. Claimed before the
  // first spawn, which is the whole of B-108: a row that completes is on disk
  // before the next one starts billing, so no exit path — a signal, a throw, a
  // crash, a `SIGKILL` of this process — can discard evidence already paid for,
  // and a destination that cannot be taken refuses at zero billed runs instead
  // of after the spending.
  //
  // Two shapes, and which one a run gets is the destination matrix's own first
  // decision, taken here rather than at the end:
  //
  //   - An `--out` the contributor named **is** the sink. It is theirs, it is
  //     created exclusively, and whatever the run turns out to be belongs in it:
  //     a red or a partial capture is evidence too, and it was paid for.
  //   - No `--out` → the aggregate is a *candidate*, never a destination, so the
  //     sink is a journal in a fresh `mkdtemp` directory (mode 0700, unpredictably
  //     named, for the same reason the fallback always was: a fixed path in a
  //     shared tmpdir is both a symlink someone else can pre-create and a
  //     world-readable copy of a capture nobody has reviewed for publication).
  //     The aggregate is still promoted at the end, atomically, and only by a run
  //     that earned it.
  //
  // Nothing about what a record may hold changes here: `openCapture` reduces
  // through the same `planCapture` as `writeCapture`, so the sink is the one
  // write path expressed on a stream rather than on a buffer.
  function openSink({ outFile, explicit }) {
    if (explicit) return { handle: openCapture(outFile), file: outFile, journal: null };
    let dir;
    try {
      dir = mkdtempSync(join(tmpdir(), `${tmpPrefix}capture-`));
    } catch (err) {
      return { handle: null, file: null, journal: null, error: err.code || err.name };
    }
    const file = join(dir, 'capture.jsonl');
    return { handle: openCapture(file), file, journal: dir };
  }

  // The rest of the destination matrix, once the spending is over. Every branch
  // either leaves the records where the run already put them, or adds the one
  // file this module may earn — no outcome of a live run reaches an existing
  // file, and the aggregate is reached by exactly one of them.
  //
  // The three rules, in the order they are decided, and only the last one writes:
  //
  //   1. Nothing captured → no file, anywhere, the claimed destination included:
  //      it was created by this run and never written to, so it is removed rather
  //      than published as an empty capture. B-098's empty-capture half stays dead.
  //   2. An `--out` the contributor named → it already holds every record; closing
  //      the descriptor is the whole of it.
  //   3. No `--out` → the aggregate is taken only by a whole-registry run that
  //      completed every row, timed none out, serialized clean and re-judges
  //      green, and then through `atomic`. Everything else stays in the journal,
  //      which is named rather than moved.
  function commitCapture({ sink, capture, outFile, explicit, only, expected, completed, timedOut }) {
    const closed = sink.handle.close();

    if (!closed.written) {
      discardSink(sink, closed);
      // Nothing reached disk, and there are two ways to arrive here that a
      // contributor must never see confused: a run that captured nothing bought
      // no record, while a run whose sink stopped accepting them bought rows and
      // lost them — a full disk on a long billed run appends nothing and leaves
      // `written` at 0 all the same. `capture` holds what was produced, so it is
      // what separates them; saying "no records were captured" over paid rows
      // contradicts the `stopped accepting records` line already printed.
      console.error(capture.length
        ? `${name}: ${capture.length} paid record(s) were produced and none could be written`
          + ' — this run bought evidence it could not keep. Nothing was saved, anywhere.'
          + `\n  ${resolve(captureDefault)} is untouched.`
        : `${name}: no records were captured — no capture file was written, anywhere.`
          + `\n  ${resolve(captureDefault)} is untouched.`);
      return 1;
    }

    if (explicit) return closed.status;

    const why = unearned({ only, expected, completed, timedOut, capture });
    if (why) return keptInPlace(sink, closed, `the aggregate is earned, and this run did not earn it — ${why}`);

    const res = writeCapture(outFile, capture, { mode: 'atomic' });
    if (!res.written) return keptInPlace(sink, closed, `${outFile} could not be replaced`);
    // The journal is now a second copy of what the aggregate holds, so it goes:
    // paid evidence is kept exactly once, and only where a reader would look.
    discardSink(sink, { written: 0 });
    return res.status;
  }

  // Why this run may not replace the aggregate, or null when it may. Ordered
  // cheapest-first, and every clause is about the capture rather than about the
  // table already printed: the assembled records are re-judged through the same
  // `judgeCapture` a `--parse` would run, so what earns the aggregate is what a
  // contributor replaying it will see, not what this process believed at the time.
  function unearned({ only, expected, completed, timedOut, capture }) {
    if (only) return `it covered only "${only}", not the whole registry`;
    if (completed !== expected) return `${completed} of ${expected} row(s) completed`;
    if (timedOut) return 'a row timed out';
    if (planCapture(capture).status !== 0) return 'a record did not survive the schema';
    const { judged, problems } = judgeCapture(capture);
    if (problems.length) return `the assembled capture does not replay — ${problems[0]}`;
    const red = judged.filter((r) => r.verdict !== 'pass').map((r) => r.branch);
    if (red.length) return `${red.join(', ')} did not pass`;
    return null;
  }

  // Evidence already billed is never discarded for want of a destination — and by
  // here it never has to be moved to keep that promise: every record went to the
  // sink as its row settled. So this reports where the records already are.
  //
  // The diagnostic names paths and record counts. Never a field value — the
  // fail-safe must not become the leak the schema exists to prevent.
  function keptInPlace(sink, closed, why) {
    console.error(`${name}: ${why}.\n  The ${closed.written} paid record(s) are at ${sink.file}`
      + `, and ${resolve(captureDefault)} is untouched.`);
    return 1;
  }

  // Removes a destination this run claimed and has nothing to publish in. Only
  // ever called with `written === 0` — a file `wx` created for this run and never
  // wrote a record to — or once the journal's records are safely in the aggregate.
  function discardSink(sink, closed) {
    if (closed.written) return;
    if (sink.journal) { try { rmSync(sink.journal, { recursive: true, force: true }); } catch { /* already gone */ } }
    else if (sink.file) { try { rmSync(sink.file, { force: true }); } catch { /* already gone */ } }
  }

  async function live(argv) {
    const only = resolveOnly(argv);
    const { outFile, explicit } = resolveDestination(argv, only);
    const keep = argv.includes('--keep');
    const timeoutS = Number(flagValue(argv, '--timeout') || TIMEOUT_DEFAULT_S);
    if (!Number.isFinite(timeoutS) || timeoutS <= 0) refuse('--timeout takes a positive number of seconds');

    // Refuse before spending: an installed legacy copy shadows the plugin
    // silently, so the run would measure the installed legacy mirror while
    // reporting on plugin/skills/.
    const shadow = join(homedir(), '.claude', 'commands', 'esq', shadowProbe);
    if (existsSync(shadow)) {
      refuse(`a legacy install would shadow the plugin under test: ${shadow}\n`
        + '  remove ~/.claude/commands/esq/ first — nothing was spent.');
    }
    if (!claudeVersion()) refuse('no working `claude` on PATH — nothing was spent.');

    const selected = only ? [rowFor(only)] : rows;
    const version = claudeVersion();
    console.error([
      `${name} — ${selected.length} billed headless run(s): ${selected.map((r) => r.branch).join(', ')}`,
      `  each in a throwaway repo seeded from ${seedLabel}, telemetry off,`,
      `  killed at ${timeoutS}s${keep ? '; scratch roots kept' : ''}`,
    ].join('\n'));

    // Claimed before the first spawn, and after every free refusal above: from
    // here on a row that completes is durable the moment it settles.
    const sink = openSink({ outFile, explicit });
    if (!sink.handle || !sink.handle.ok) {
      refuse(explicit
        ? `--out ${outFile} could not be claimed — nothing was spent.`
        : `no run journal could be opened${sink.error ? ` (${sink.error})` : ''}, so a completed row could not be kept`
          + ' — spawned nothing, nothing was spent.');
    }

    // Named before the first spawn, because from here on this path *is* where the
    // paid evidence is — and the run's own durability claim is only worth what a
    // contributor can find afterwards. A `SIGKILL`, a closed terminal, or a
    // `SIGINT` between two rows leaves the rows on disk and no diagnostic behind,
    // and a no-`--out` run's sink is an unpredictably-named 0700 `mkdtemp`
    // directory nobody can guess. So the sink is announced as what it is: the path
    // rows land in, and — when the contributor named no destination — the
    // aggregate it is promoted to only if the run earns it.
    console.error(explicit
      ? `  records land in ${sink.file} as each row settles`
      : `  records land in ${sink.file} as each row settles,`
        + `\n  promoted to ${resolve(outFile)} only by a run that earns it`);

    const capture = [];
    const judged = [];
    const kept = [];
    let failed = 0;
    let writeStatus = 0;
    let unpersisted = false;
    // The two facts the aggregate's eligibility rests on that the capture itself
    // cannot show: how many of the selected rows the loop actually got through,
    // and whether any of them was killed at the deadline. A capture holding a
    // timed-out row is still evidence — it is just not a whole-registry result.
    let completed = 0;
    let timedOutAny = false;
    // What `detached` costs, repaid. The child is no longer in the terminal's
    // foreground process group, so `SIGINT` from a contributor's Ctrl-C reaches
    // this process and nothing else: without these handlers an interrupted
    // billed run leaves a `claude` and every grandchild it started alive, with
    // their cwd inside a scratch root this loop is about to delete.
    //
    // `SIGHUP` is the same debt from the other direction. A terminal close or a
    // dropped ssh session hangs up the terminal's foreground group, which the
    // detached child left; on the default disposition this process dies there
    // and the whole tree keeps running, unwatched and still billing, in a
    // scratch root nobody is left to delete. So it is handled, not defaulted.
    //
    // The teardown is the same primitive and the same bound as the deadline's,
    // and it still writes no *record*: the row was killed mid-flight, so there is
    // no evidence for it to carry, and the conventional signal status is what the
    // shell that sent the signal expects to read.
    //
    // What it owes instead is a report, because the rows before it are already on
    // disk — appended as they settled rather than flushed from here, which is why
    // this path cannot lose them however abruptly it is reached.
    const interrupt = (status, root) => () => {
      const child = inFlight;
      const finish = () => {
        if (root && !keep) { try { rmSync(root, { recursive: true, force: true }); } catch { /* the root is scratch; the exit status is the report */ } }
        reportInterrupted();
        process.exit(status);
      };
      if (!child) return finish();
      // Visible rather than swallowed, for the same reason the deadline's is:
      // an EPERM here means the tree was not torn down, and the exit is about
      // to claim it was.
      try { killGroup(child.pid); } catch (err) { console.error(`${name}: could not tear down the run's process group (${err.code || err.name})`); }
      const grace = setTimeout(finish, KILL_GRACE_MS);
      child.once('close', () => { clearTimeout(grace); finish(); });
    };

    // What an interrupt says, and everything it does to disk. Synchronous
    // throughout — it runs with a process group being torn down and an exit one
    // statement away — and it never writes a record: closing the descriptor is
    // all the durability the kept rows need, because each was written when it
    // settled.
    //
    // Three things a contributor cannot infer from an exit status: that the run
    // is incomplete and which rows it got through, that the row in flight was
    // killed and is *not* in the capture, and where the rows that survived are.
    // The fourth is the replay, and it is stated as what it is — a partial
    // capture re-judged against the registry names the rows nobody bought, which
    // is not a green suite.
    const reportInterrupted = () => {
      const closed = sink.handle.close();
      if (!closed.written) {
        discardSink(sink, closed);
        console.error(`${name}: interrupted before any row completed — nothing was captured,`
          + ` and no capture file was written, anywhere.`
          + `\n  ${resolve(captureDefault)} is untouched.`);
        return;
      }
      console.error(`${name}: interrupted — this run is INCOMPLETE.`
        + ` ${completed} of ${selected.length} row(s) completed;`
        + ' the row in flight was killed and is not in the capture.'
        + `\n  The ${closed.written} paid record(s) are at ${sink.file}`
        + `, and ${resolve(captureDefault)} is untouched.`
        + `\n  Replay them for free with --parse < that file — it reports the rows this run never bought,`
        + ' never a green whole-registry suite.');
    };

    try {
      for (const row of selected) {
        process.stderr.write(`▸ ${row.branch} … `);
        const { root, seedHash } = seedRoot(row);
        const t0 = Date.now();
        // Installed for exactly the span this row's child can be in flight and
        // removed when it settles, so a multi-row run accumulates no listeners.
        const onInt = interrupt(130, root);
        const onTerm = interrupt(143, root);
        const onHup = interrupt(129, root);
        process.on('SIGINT', onInt);
        process.on('SIGTERM', onTerm);
        process.on('SIGHUP', onHup);
        let ran;
        try {
          ran = await runOne(row.prompt, root, timeoutS * 1000);
        } finally {
          process.off('SIGINT', onInt);
          process.off('SIGTERM', onTerm);
          process.off('SIGHUP', onHup);
        }
        const { code, stdout, stderr, timedOut } = ran;
        const elapsedMs = Date.now() - t0;
        // Read before the root is removed, and before anything else in the loop:
        // a process the run left behind is only observable while its cwd exists.
        //
        // One argument, and deliberately no exclusion list: the honesty of this
        // number comes from *when* it is read, not from what it hides. `runOne`
        // has already settled, and it can only have settled in one of two
        // states. If `close` fired, the group kill was reaped before this line
        // runs and the run's own child is gone — there is nothing left to
        // exclude. If the grace expired instead, everything still alive is a
        // process the runner tried and failed to kill, the original `claude`
        // first among them, and that failed teardown is precisely what this
        // list exists to publish. Filtering the child's own pid out would hide
        // the one case worth seeing, so `survivingProcesses` keeps its
        // one-argument shape and nothing here narrows what it returns.
        const survivors = survivingProcesses(root);
        const events = parseLines(stdout);
        // Evidence already billed is never discarded — but it is reduced before
        // it is kept: the two records go into the capture before anything can
        // fail on them, and the raw stream is never among them.
        const [marker, evidence] = captureRecords(row, {
          exit: code, timedOut, elapsedMs, events, harvested: harvest(root, seedHash), survivors,
        });
        capture.push(marker, evidence);
        // On disk before the next row starts billing (B-136, B-108). The append
        // is synchronous and goes straight to the held descriptor, so from this
        // statement on the row survives every way this process can end — and the
        // interrupt handlers below write nothing precisely because of it.
        const persisted = sink.handle.append([marker, evidence]);
        completed++;
        if (timedOut) timedOutAny = true;
        const verdict = judgeEvidence(row, evidence);
        judged.push(verdict);
        if (verdict.verdict !== 'pass') failed++;
        process.stderr.write(`${(elapsedMs / 1000).toFixed(0)}s, exit ${code}${timedOut ? ' (TIMED OUT)' : ''} — ${verdict.verdict}\n`);
        if (keep) { kept.push(root); }
        else rmSync(root, { recursive: true, force: true });
        if (!events.length) {
          console.error(`  no stream-json events for "${row.branch}" — ${(stderr || stdout).trim().slice(0, 2000)}`);
        }
        // A sink that stopped accepting records is the one condition that must
        // not be carried into another paid row: the next row's money would buy
        // evidence with nowhere to go, compounding a loss already taken.
        // `openCapture` has already said what failed; this says what it costs.
        if (persisted.status !== 0 || !sink.handle.ok) {
          unpersisted = true;
          console.error(`${name}: the capture stopped accepting records after "${row.branch}"`
            + ' — spawned nothing further rather than buying a row that could not be kept.');
          break;
        }
      }
    } finally {
      // The one path to disk, and the only place this module decides where paid
      // evidence goes. A record that fails its schema costs the run its exit
      // code, never a raw file: what lands is the verified prefix and a
      // capture-error — and never on top of a capture someone already bought.
      writeStatus = commitCapture({
        sink, capture, outFile, explicit, only, expected: selected.length, completed, timedOut: timedOutAny,
      });
      for (const root of kept) console.error(`kept: ${root}`);
    }

    console.log(renderTable(makeHeader({
      version: version || judged.map((r) => r.cc).find((c) => c && c !== '—'),
      date: new Date().toISOString().slice(0, 10),
      mode: 'live',
    }), judged, columns));
    process.exit(failed || writeStatus || unpersisted ? 1 : 0);
  }

  async function main(argv) {
    if (argv.includes('--help') || argv.includes('-h')) { console.log(usage); return; }
    // Free before billed: a run that meant `--parse` must never fall through to
    // billed spawns because a later flag was mistyped.
    if (argv.includes('--parse')) return parse(argv);
    return live(argv);
  }

  return {
    branches, rowFor, refuse, git,
    judgeEvidence, captureRecords, judgeCapture, makeHeader,
    splitCapture: (events) => splitCapture(events, { rowMarker, evidenceMarker }),
    renderTable: (header, judged) => renderTable(header, judged, columns),
    seedRoot, runOne, live, parse, main,
  };
}

// A script's own entry point, so no consumer repeats the `main().catch` dance.
export function runMain(runner, name, argv) {
  runner.main(argv).catch((err) => {
    console.error(`${name}: ${err.message}`);
    process.exit(2);
  });
}
