#!/usr/bin/env node
// probe-model-pins.mjs — which invocation paths honor a skill's `model:` pin, and
// does the `Agent` tool's explicit `model` field select the worker's model?
//
// Runs ten short headless Claude Code sessions — four on the SESSION model with
// the throwaway fixture plugin under tests/fixtures/model-pin-probe (two skills
// pinned haiku), six that ask the parent to spawn one `Agent` with an explicit
// `model` (opus/sonnet/haiku × foreground/background) from a parent on a
// different model — reads every `assistant` line's `message.model` grouped by
// `parent_tool_use_id` (null = main conversation, a tool id = the subagent it
// spawned) plus every `Agent` tool_use the parent made, and prints one verdict
// row per path. `CLAUDE_CODE_SUBAGENT_MODEL` is scrubbed from the child's env:
// it outranks the per-invocation field, so a maintainer who has it set would
// measure the env var, not the field.
//
//   node scripts/probe-model-pins.mjs                 # live: bills ten runs
//   node scripts/probe-model-pins.mjs --out cap.jsonl # …and save the derived records
//   node scripts/probe-model-pins.mjs --only agent-model --out cap.jsonl  # six of them
//   node scripts/probe-model-pins.mjs --parse < cap.jsonl   # replay, zero tokens
//
// A revalidation is a *second* run against a destination that already holds paid
// evidence, so `--out` is claimed before the first spawn and a collision refuses
// there, at zero runs billed, leaving the existing capture byte-identical.
//
// Dependency-free. Never wired into audit.sh — it spends tokens on purpose, and
// says how much before it spends any: every live run opens by declaring its
// subset, its exact maximum run count, its time bound and its dated cost reading.

import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { makeRecord, openCapture } from './lib/capture-schema.mjs';

export const SESSION_MODEL = 'opus';
export const PIN = 'haiku';
const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures', 'model-pin-probe');
const SKILL_INLINE = 'model-pin-probe:pin-inline';
const SKILL_FORK = 'model-pin-probe:pin-fork';

// One row per invocation path. `scope` names whose lines the row is supposed to
// govern: `main` for the two top-level rows, `subagent` for those that spawn one.
// `kind` is `pin` (a skill's `model:` pin, liveness word `pinned`) or `agent-model`
// (the `Agent` tool's explicit `model` field, liveness word `probed`); `session` is
// the parent's `--model`, `expect` the model the row is supposed to land on, and
// `background` the `run_in_background` flag an `agent-model` row's spawn must carry.
export const ROWS = [
  { path: 'typed /skill', scope: 'main', prompt: `/${SKILL_INLINE}` },
  { path: 'Skill tool @ top', scope: 'main',
    prompt: `Use the Skill tool to invoke the skill "${SKILL_INLINE}", then reply with exactly what it replied and nothing else.` },
  { path: 'Skill tool in Agent', scope: 'subagent',
    prompt: `Use the Agent tool (subagent_type: general-purpose) exactly once with this prompt: 'Use the Skill tool to invoke the skill "${SKILL_INLINE}" and return its reply verbatim.' Then reply with what the agent returned and nothing else.` },
  { path: 'context: fork', scope: 'subagent', prompt: `/${SKILL_FORK}` },
  // The parent runs on a model the worker must differ from, or honored and
  // ignored are indistinguishable: opus workers ← a sonnet parent (the B-042
  // direction), sonnet and haiku workers ← an opus parent.
  { path: 'Agent model: opus (fg)', scope: 'subagent', kind: 'agent-model', session: 'sonnet', expect: 'opus', background: false, prompt: agentModelPrompt('opus', false) },
  { path: 'Agent model: opus (bg)', scope: 'subagent', kind: 'agent-model', session: 'sonnet', expect: 'opus', background: true, prompt: agentModelPrompt('opus', true) },
  { path: 'Agent model: sonnet (fg)', scope: 'subagent', kind: 'agent-model', session: 'opus', expect: 'sonnet', background: false, prompt: agentModelPrompt('sonnet', false) },
  { path: 'Agent model: sonnet (bg)', scope: 'subagent', kind: 'agent-model', session: 'opus', expect: 'sonnet', background: true, prompt: agentModelPrompt('sonnet', true) },
  { path: 'Agent model: haiku (fg)', scope: 'subagent', kind: 'agent-model', session: 'opus', expect: 'haiku', background: false, prompt: agentModelPrompt('haiku', false) },
  { path: 'Agent model: haiku (bg)', scope: 'subagent', kind: 'agent-model', session: 'opus', expect: 'haiku', background: true, prompt: agentModelPrompt('haiku', true) },
].map(withDefaults);

// The worker is one word; a background parent is told to wait so it does not
// answer before the notification (the stream would close with no worker lines).
function agentModelPrompt(expect, background) {
  return `Use the Agent tool exactly once, with model: ${expect}, run_in_background: ${background}, subagent_type: general-purpose, and this prompt: 'Reply with the single word \`probed\`; call no tools.'`
    + (background ? ' Wait for the agent to finish, then reply with what it returned and nothing else.' : ' Then reply with what it returned and nothing else.');
}

// A row (or a replayed `probe-row` marker) missing the newer fields is one of the
// original four: session opus, expect haiku, a pin row, foreground. One
// parameter on purpose: `.map(withDefaults)` must not hand it the array index.
export function withDefaults(row) {
  return {
    ...row,
    kind: row.kind || 'pin',
    session: row.session || SESSION_MODEL,
    expect: row.expect || PIN,
    background: row.background === true,
  };
}

// What a live run may spend, in one place, so the declaration below and the
// enforcement further down cannot drift. A row that has not answered in three
// minutes is not going to: the child is killed, the row is not retried, and the
// invocation stops — a probe that hangs bills without a ceiling, which is the
// failure this bound exists for. The whole-invocation bound is the per-row
// deadline across the selected rows plus one minute of process overhead.
export const ROW_DEADLINE_MS = 180_000;
export const RUN_SLACK_MS = 60_000;
export const runBoundMs = (n) => n * ROW_DEADLINE_MS + RUN_SLACK_MS;

// The only cost figure in this file, and it is a *reading* rather than a rate
// card: README § Model recommendations, 2026-08-19 — ten runs, ~75 s, ~$1.50
// total. Re-measure it, do not adjust it.
export const COST_READING = '2026-08-19 reading: ten runs, ~75 s, ~$1.50 total';
export const COST_PER_RUN = 0.15;

// The subsets `--only` selects. A revalidation usually needs one lever re-measured
// and not the other, and six billed runs are not paid for ten rows of evidence.
export const KINDS = ['pin', 'agent-model'];

/** `ROWS`, or the rows of one `kind`. An unknown kind is the caller's to refuse. */
export function selectRows(only) {
  return only ? ROWS.filter((row) => row.kind === only) : ROWS;
}

export const ROW_MARKER = 'probe-row';
export const EVIDENCE_MARKER = 'probe-evidence';
export const LIVENESS = { pin: 'pinned', 'agent-model': 'probed' };

// The liveness word a row's reply has to carry. Known from the row alone, so the
// regex runs at capture time and only its answer is persisted.
const livenessWord = (row) => LIVENESS[row.kind] || LIVENESS.pin;

// ---------------------------------------------------------------- pure reading

export function parseLines(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* non-JSON noise (stderr, banners) is not evidence */ }
  }
  return out;
}

// Reads one run's events. Only `assistant` lines with `message.model` count as
// evidence; `result.modelUsage` is kept as a cross-check; `system/init` gives the
// version and session model; every `Agent`/`Task` tool_use in a main-conversation
// assistant line is a spawn record (its id keys the subagent's lines, its input is
// what the parent actually asked for); everything else (user, thinking_tokens,
// rate limits) is ignored.
export function readRun(events) {
  const main = [];
  const subagents = new Map();
  const spawns = new Map();
  let text = '';
  let usage = [];
  let sawModel = 0;
  let init = null;
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    if (ev.type === 'system' && ev.subtype === 'init') { init = ev; continue; }
    if (ev.type === 'result') {
      if (ev.modelUsage && typeof ev.modelUsage === 'object') usage = Object.keys(ev.modelUsage);
      continue;
    }
    if (ev.type !== 'assistant' || !ev.message || typeof ev.message.model !== 'string') continue;
    const parent = ev.parent_tool_use_id ?? null;
    for (const part of ev.message.content || []) {
      if (!part) continue;
      if (part.type === 'text' && typeof part.text === 'string') text += part.text + '\n';
      // B-036 established `run_in_background` as the flag name; absent means foreground.
      if (parent === null && part.type === 'tool_use' && (part.name === 'Agent' || part.name === 'Task') && typeof part.id === 'string') {
        const input = part.input && typeof part.input === 'object' ? part.input : {};
        spawns.set(part.id, { model: input.model, background: input.run_in_background === true, subagentType: input.subagent_type });
      }
    }
    sawModel++;
    const model = ev.message.model;
    // `<synthetic>` is a harness-made message (e.g. a forked skill's reply relayed
    // into the parent), not an API request — its text counts, its "model" does not.
    if (model === '<synthetic>') continue;
    if (parent === null) main.push(model);
    else {
      if (!subagents.has(parent)) subagents.set(parent, []);
      subagents.get(parent).push(model);
    }
  }
  return { main, subagents, spawns, usage, init, text, sawModel };
}

// The whole write side, in one function: what a billed run turns into on disk.
// `live` calls it and so does its test, because an equivalence asserted against a
// reimplementation of this proves nothing about what gets checked in.
//
// The raw stream goes in and does not come out. `readRun` reduces it, the row's
// liveness word answers itself here, and `makeRecord` drops every key the schema
// does not declare — so a field a future Claude Code adds to any event never
// reaches the returned records, and neither does a word of model prose.
export function captureRecords(rawRow, { exit, events }) {
  const row = withDefaults(rawRow);
  const marker = makeRecord(ROW_MARKER, {
    path: row.path, scope: row.scope, kind: row.kind,
    session: row.session, expect: row.expect, background: row.background,
  });
  return [marker, evidenceFor(row, exit, readRun(events || []))];
}

// `readRun`'s in-memory shape reduced to the record the judges read. `subagents`
// and `spawns` are Maps in memory and plain objects on disk; `run.text` is the
// model's prose and has no field at all — `replied` is its only surviving trace.
export function evidenceFor(row, exit, run) {
  return makeRecord(EVIDENCE_MARKER, {
    exit: exit ?? null,
    main: run.main,
    subagents: Object.fromEntries(run.subagents),
    spawns: Object.fromEntries(run.spawns),
    usage: run.usage,
    sawModel: run.sawModel,
    init: run.init,
    replied: new RegExp(`\\b${livenessWord(row)}\\b`, 'i').test(run.text || ''),
  });
}

function counts(models) {
  const c = new Map();
  for (const m of models) c.set(m, (c.get(m) || 0) + 1);
  return c;
}

const fmtCounts = (models) => models.length
  ? [...counts(models)].map(([m, n]) => `${m}×${n}`).join(', ')
  : '—';

// honored: every request in scope on the pin; ignored: none; partial: mixed.
export function verdict(models, pin = PIN) {
  if (!models.length) return 'not invoked';
  const onPin = models.filter((m) => m.includes(pin)).length;
  if (onPin === models.length) return 'honored';
  if (onPin === 0) return 'ignored';
  return `partial (${onPin}/${models.length} on ${pin})`;
}

// The pin's scope had no assistant lines in the stream (a `context: fork` skill's
// subagent is not forwarded on 2.1.235). If the skill's reply still arrived, the
// only evidence left is `result.modelUsage`, which also counts the harness's own
// auxiliary calls — so the verdict says where it came from.
function verdictFromUsage(usage, replied, pin) {
  if (!replied || !usage.length) return 'not invoked';
  const onPin = usage.filter((m) => m.includes(pin)).length;
  if (onPin === usage.length) return 'honored (via modelUsage)';
  if (onPin === 0) return 'ignored (via modelUsage)';
  return `partial (via modelUsage: ${usage.join(', ')})`;
}

// An explicit `Agent model:` row is judged only from the request lines under the
// spawn the parent actually made with that `model` and background flag — never
// from `result.modelUsage`, whose haiku key is also the harness's auxiliary call.
function judgeAgentModel(row, ev) {
  const ids = Object.entries(ev.spawns || {})
    .filter(([, s]) => s && s.model === row.expect && s.background === row.background)
    .map(([id]) => id);
  if (!ids.length) return 'not invoked';
  const lines = ids.flatMap((id) => (ev.subagents || {})[id] || []);
  if (!lines.length) return `no evidence (0 requests under ${ids.join(', ')})`;
  return verdict(lines, row.expect);
}

const subLines = (ev) => Object.values(ev.subagents || {}).flat();

// `aux` = what `result.modelUsage` bills that no request line in the run explains.
// Usage keys may carry the long-context suffix (`claude-opus-5[1m]`) that no
// request line spells: the same model, billed under another SKU, is explained.
function auxColumn(row, ev) {
  const norm = (m) => m.replace(/\[1m\]$/, '');
  const requested = new Set([...(ev.main || []), ...subLines(ev)].map(norm));
  const usage = ev.usage || [];
  const aux = usage.filter((m) => !requested.has(norm(m)));
  if (aux.length) return aux.map((m) => `${m} (usage-only)`).join(', ');
  if (usage.some((m) => m.includes(row.expect))) return `— (masked: worker on ${row.expect})`;
  return '—';
}

// Reads the persisted record and nothing else. Every column it shows is a field
// the record already carries — including `replied`, which was answered by the
// liveness regex at capture time, because by here the prose it was run against is
// gone. `replied` is gating on a pin row, and a boolean is all the gate needs.
export function judgeRow(rawRow, ev, pin = PIN) {
  const row = withDefaults(pin === PIN ? rawRow : { ...rawRow, expect: rawRow.expect || pin });
  const main = ev.main || [];
  const usage = ev.usage || [];
  const scoped = row.scope === 'main' ? main : subLines(ev);
  const word = livenessWord(row);
  const replied = ev.replied === true;
  let result;
  if (row.kind === 'agent-model') result = judgeAgentModel(row, ev);
  else result = !replied ? 'not invoked' : scoped.length ? verdict(scoped, row.expect) : verdictFromUsage(usage, replied, row.expect);
  const subagents = Object.values(ev.subagents || {});
  return {
    path: row.path,
    scope: row.scope,
    verdict: result,
    init: (ev.init && ev.init.model) || '—',
    main: fmtCounts(main),
    subagents: subagents.length ? subagents.map(fmtCounts).join(' | ') : '—',
    replied: replied ? word : `no "${word}"`,
    usage: usage.length ? usage.join(', ') : '—',
    aux: auxColumn(row, ev),
    cc: (ev.init && ev.init.claude_code_version) || '—',
  };
}

export function renderTable(header, judged) {
  const cols = [
    ['path', 'path'], ['scope', 'scope'], ['verdict', 'verdict'], ['init', 'system/init model'],
    ['main', 'main conversation'], ['subagents', 'subagent(s)'],
    ['replied', 'reply'], ['usage', 'result.modelUsage'], ['aux', 'aux'], ['cc', 'cc'],
  ];
  const width = cols.map(([k, h]) => Math.max(h.length, ...judged.map((r) => String(r[k]).length)));
  const line = (vals) => vals.map((v, i) => String(v).padEnd(width[i])).join('  ').trimEnd();
  const out = [header, '', line(cols.map(([, h]) => h)), line(width.map((w) => '-'.repeat(w)))];
  for (const r of judged) out.push(line(cols.map(([k]) => r[k])));
  return out.join('\n');
}

export function makeHeader({ version, date, mode }) {
  return `probe-model-pins — Claude Code ${version || 'unknown'} · session model per row · skill pin ${PIN} · CLAUDE_CODE_SUBAGENT_MODEL unset · ${date}${mode ? ` · ${mode}` : ''}`;
}

// ------------------------------------------------------------------- replay
//
// A capture is one `probe-row` marker per path, then one `probe-evidence` record
// carrying that run's already-derived columns. Replay re-judges each row from its
// evidence record — the same judges, the same verdicts, at zero cost. No harness
// event is persisted, so `splitCapture` collects whatever sits between two markers
// only to replay a pre-schema capture. Markers from before the newer fields
// existed replay with the defaults (pin, opus, haiku, foreground). A capture with
// no markers is one row.

export function splitCapture(events) {
  const rows = [];
  let cur = null;
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    if (ev.type === ROW_MARKER) {
      cur = { row: withDefaults({ path: ev.path, scope: ev.scope, kind: ev.kind, session: ev.session, expect: ev.expect, background: ev.background }), evidence: null, events: [] };
      rows.push(cur);
      continue;
    }
    if (!cur) { cur = { row: withDefaults({ path: 'capture', scope: 'main' }), evidence: null, events: [] }; rows.push(cur); }
    if (ev.type === EVIDENCE_MARKER) { cur.evidence = ev; continue; }
    cur.events.push(ev);
  }
  return rows;
}

// Replay compatibility, read side only. A capture written before the schema kept
// the raw stream instead of an evidence record; deriving one here re-judges it
// exactly as it always judged. Nothing on this branch writes, and after the
// fixtures are regenerated no path in the repo produces the shape it reads.
const evidenceOf = ({ row, evidence, events }) => evidence || evidenceFor(row, null, readRun(events));

export function judgeCapture(events, pin = PIN) {
  const rows = splitCapture(events).map((r) => ({ row: r.row, ev: evidenceOf(r) }));
  const judged = rows.map(({ row, ev }) => judgeRow(row, ev, pin));
  const init = rows.map(({ ev }) => ev.init).find(Boolean);
  return { judged, init };
}

// ------------------------------------------------------------------- live run

function claudeVersion() {
  const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return (r.stdout || '').trim().split(/\s+/)[0] || null;
}

export function runOne(row, deadlineMs = ROW_DEADLINE_MS) {
  return new Promise((resolvePromise, reject) => {
    const args = [
      '-p', '--model', row.session, '--plugin-dir', FIXTURE,
      '--output-format', 'stream-json', '--verbose', '--forward-subagent-text',
      '--permission-mode', 'dontAsk', '--allowedTools', 'Skill,Agent,Task,TaskOutput',
    ];
    // CLAUDE_CODE_SUBAGENT_MODEL outranks the Agent tool's `model` field (sub-agents
    // docs, 2026-08-19): left in place it would be what the explicit rows measure.
    const { CLAUDE_CODE_SUBAGENT_MODEL: _scrubbed, ...env } = process.env;
    const child = spawn('claude', args, { stdio: ['pipe', 'pipe', 'pipe'], env });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    // SIGKILL, not SIGTERM: a headless session that has stopped answering is not
    // owed a graceful shutdown, and whatever it streamed is already in `stdout`.
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      // Resolved here rather than at `close`: a killed child's own children keep
      // the inherited stdio pipes open, and `close` waits for those pipes — a
      // deadline that waits for them is not a deadline. Whatever streamed before
      // the kill is already in hand, and it is what the row is judged on.
      resolvePromise({ code: null, stdout, stderr, timedOut });
    }, deadlineMs);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
    child.on('close', (code) => { clearTimeout(timer); resolvePromise({ code, stdout, stderr, timedOut }); });
    // A child that is already gone — killed on its deadline, or exited before it
    // read stdin — makes this write EPIPE. That is the outcome the `close`
    // handler above is there to report, not a reason to take the process down and
    // lose the rows already appended.
    child.stdin.on('error', () => {});
    child.stdin.end(row.prompt + '\n');
  });
}

async function live(outFile, rows, only) {
  // The one path to disk, and the only one. The destination is claimed here —
  // before the first spawn, so a `--out` that already holds paid evidence refuses
  // at zero runs billed and stays byte-identical — and each row's two records are
  // appended to the held descriptor as they are produced. A run killed halfway
  // keeps every row it had already paid for; a record that fails its schema costs
  // the run its exit code, never a raw file. `openCapture` announces the file.
  const cap = outFile ? openCapture(outFile) : null;
  if (cap && !cap.ok) {
    console.error('probe-model-pins: nothing was billed — pass a fresh --out and run again.');
    process.exit(2);
  }
  const keep = (...records) => { if (cap) cap.append(records); };
  const shut = () => (cap ? cap.close().status : 0);

  console.error(declaration({ rows, only, outFile }));

  // Read after the claim, so a refused destination starts no `claude` at all —
  // not even the free one.
  const version = claudeVersion();
  const started = Date.now();
  const invocationDeadline = started + runBoundMs(rows.length);
  const runs = [];
  for (const row of rows) {
    // The whole-invocation bound is checked where it can still prevent a spawn.
    if (Date.now() >= invocationDeadline) {
      console.error(`probe-model-pins: the ${runBoundMs(rows.length) / 1000} s invocation bound expired before "${row.path}"`
        + ` — spawned nothing further; the ${runs.length} row(s) already billed are in the capture.`);
      shut();
      process.exit(2);
    }
    process.stderr.write(`▸ ${row.path} … `);
    const t0 = Date.now();
    const { code, stdout, stderr, timedOut } = await runOne(row);
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    const events = parseLines(stdout);
    // Evidence already billed is never discarded — but it is reduced before it is
    // kept: the failing row's two records go into the capture before either guard
    // below can end the run, and the raw stream is never among them.
    const [marker, ev] = captureRecords(row, { exit: code, events });
    keep(marker, ev);
    if (cap && !cap.ok) {
      process.stderr.write('\n');
      console.error('probe-model-pins: the capture closed on a schema failure — spawned nothing further; every row already appended is in it.');
      process.exit(1);
    }
    if (timedOut) {
      process.stderr.write('\n');
      console.error(`probe-model-pins: "${row.path}" passed its ${ROW_DEADLINE_MS / 1000} s deadline and was killed.`
        + ' It is not retried; every row already appended is in the capture.');
      shut();
      process.exit(2);
    }
    if (/forward-subagent-text/i.test(stderr) && /unknown|unrecognized|error/i.test(stderr)) {
      process.stderr.write('\n');
      console.error(`probe-model-pins: this Claude Code rejects --forward-subagent-text (needs 2.1.211+):\n${stderr.trim()}`);
      shut();
      process.exit(2);
    }
    if (!ev.sawModel) {
      process.stderr.write('\n');
      console.error(`probe-model-pins: no assistant line carried message.model on "${row.path}" (exit ${code}).\n${(stderr || stdout).trim().slice(0, 2000)}`);
      shut();
      process.exit(2);
    }
    process.stderr.write(`${secs}s, exit ${code}\n`);
    runs.push({ row, ev });
  }
  const init = runs.map((r) => r.ev.init).find(Boolean);
  const header = makeHeader({
    version: version || (init && init.claude_code_version),
    date: new Date().toISOString().slice(0, 10),
    mode: 'live',
  });
  console.log(renderTable(header, runs.map(({ row, ev }) => judgeRow(row, ev))));
  if (shut()) process.exit(1);
}

async function parseMode() {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  const { judged, init } = judgeCapture(parseLines(text));
  if (!judged.length) { console.error('probe-model-pins: empty capture on stdin'); process.exit(2); }
  const header = makeHeader({
    version: init && init.claude_code_version,
    date: 'replay',
    mode: '--parse',
  });
  console.log(renderTable(header, judged));
}

// What this invocation is about to spend, printed before the first spawn. A bound
// named after the spending is a bill.
export function declaration({ rows, only, outFile }) {
  const n = rows.length;
  return [
    `probe-model-pins: about to bill ${n} live Claude Code run${n === 1 ? '' : 's'}. Nothing has been spawned yet.`,
    `  subset:   ${only || 'all rows'} — ${n} of ${ROWS.length} row${n === 1 ? '' : 's'}`,
    `  maximum:  ${n} run${n === 1 ? '' : 's'}, one headless session each, no retries`,
    `  bound:    ${ROW_DEADLINE_MS / 1000} s per run, ${runBoundMs(n) / 1000} s for the invocation;`
      + ' a run that exceeds its deadline is killed and every row already appended survives',
    `  cost:     ~$${(n * COST_PER_RUN).toFixed(2)} at the ${COST_READING}`,
    `  capture:  ${outFile ? `${outFile} — claimed, and nothing else may take it` : 'not saved (pass --out to keep the evidence)'}`,
  ].join('\n');
}

// What a live run is about to spend, stated where it can still be read for free.
function usage() {
  return [
    'usage: probe-model-pins.mjs [--only <kind>] [--out <file>] | --parse < capture.jsonl',
    '',
    `  --only <kind>   ${KINDS.join(' | ')} — measure one lever instead of both`,
    `  --out <file>    save the derived records; the path is claimed before the first spawn,`,
    '                  and a path that already holds a capture refuses at zero runs billed',
    '  --parse         replay a capture from stdin: the same verdicts, zero tokens',
    '',
    `  bound: ${ROW_DEADLINE_MS / 1000} s per run; a whole invocation is capped at`
      + ` runs × ${ROW_DEADLINE_MS / 1000} s + ${RUN_SLACK_MS / 1000} s. ~$${COST_PER_RUN.toFixed(2)}/run at the ${COST_READING}.`,
    '',
    '  live run counts, one billed headless Claude Code session each and no retries:',
    ...KINDS.map((kind) => `    ${`--only ${kind}`.padEnd(20)}${selectRows(kind).length} runs`),
    `    ${'(no --only)'.padEnd(20)}${ROWS.length} runs`,
  ].join('\n');
}

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(usage());
    return;
  }
  if (argv.includes('--parse')) return parseMode();
  const i = argv.indexOf('--out');
  const outFile = i >= 0 ? argv[i + 1] : null;
  if (i >= 0 && !outFile) { console.error('--out needs a file'); process.exit(2); }
  const j = argv.indexOf('--only');
  const only = j >= 0 ? argv[j + 1] : null;
  if (j >= 0 && !KINDS.includes(only)) {
    console.error(`--only takes one of: ${KINDS.join(', ')}`);
    process.exit(2);
  }
  return live(outFile, selectRows(only), only);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => { console.error(`probe-model-pins: ${err.message}`); process.exit(2); });
}
