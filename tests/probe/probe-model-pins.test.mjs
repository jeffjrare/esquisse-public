import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import {
  LIVENESS, ROWS, ROW_DEADLINE_MS, ROW_MARKER, captureRecords, evidenceFor, judgeCapture, judgeRow,
  parseLines, readRun, renderTable, runBoundMs, runOne, selectRows, splitCapture, verdict, withDefaults,
} from '../../scripts/probe-model-pins.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(here, '..', '..', 'scripts', 'probe-model-pins.mjs');
const CAPTURE = path.join(here, 'fixtures', 'capture.jsonl');
const HAIKU = 'claude-haiku-4-5-20251001';
const OPUS = 'claude-opus-5';
const SONNET = 'claude-sonnet-4-5-20250929';

const A = (model, parent, text = 'pinned') => ({ type: 'assistant', parent_tool_use_id: parent, message: { model, content: [{ type: 'text', text }] } });
const R = (...models) => ({ type: 'result', subtype: 'success', modelUsage: Object.fromEntries(models.map((m) => [m, { inputTokens: 1 }])) });
// The parent's Agent tool_use — the spawn record an explicit row is judged against.
const S = (id, input, model = OPUS) => ({ type: 'assistant', parent_tool_use_id: null, message: { model, content: [{ type: 'tool_use', id, name: 'Agent', input }] } });
const INIT = (model, claude_code_version = '2.1.235') => ({ type: 'system', subtype: 'init', model, claude_code_version });
// The production write side, driven with the row under test: what `judgeRow` reads
// is the record a billed run would have persisted — never a hand-built twin, and
// never the raw stream, which no longer survives a capture.
const E = (row, events) => evidenceFor(withDefaults(row), 0, readRun(events));

const SONNET_FG = { path: 'Agent model: sonnet (fg)', scope: 'subagent', kind: 'agent-model', session: 'opus', expect: 'sonnet', background: false };
const SONNET_BG = { ...SONNET_FG, path: 'Agent model: sonnet (bg)', background: true };
const HAIKU_FG = { ...SONNET_FG, path: 'Agent model: haiku (fg)', expect: 'haiku' };

test('readRun groups assistant models by parent_tool_use_id and ignores user, system and result lines except modelUsage', () => {
  const run = readRun([
    { type: 'system', subtype: 'init', model: OPUS, claude_code_version: '2.1.235' },
    { type: 'system', subtype: 'thinking_tokens', estimated_tokens: 3 },
    { type: 'user', parent_tool_use_id: null, message: { model: 'not-a-request', content: [{ type: 'text', text: 'ignore me' }] } },
    A(OPUS, null, 'main text'),
    A(HAIKU, 'toolu_a'),
    A(HAIKU, 'toolu_a', 'nested — same spawner id per the 2.1.219 note'),
    { type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'text', text: 'no model field' }] } },
    R(HAIKU, OPUS),
  ]);
  assert.deepEqual(run.main, [OPUS]);
  assert.deepEqual([...run.subagents.entries()], [['toolu_a', [HAIKU, HAIKU]]]);
  assert.deepEqual(run.usage, [HAIKU, OPUS]);
  assert.equal(run.init.claude_code_version, '2.1.235');
  assert.match(run.text, /main text/);
  assert.doesNotMatch(run.text, /ignore me/);
});

test('readRun records every Agent/Task tool_use the main conversation made, with model and run_in_background, and ignores a subagent\'s own spawns', () => {
  const run = readRun([
    S('toolu_1', { model: 'sonnet', run_in_background: false, subagent_type: 'general-purpose', prompt: 'x' }),
    S('toolu_2', { model: 'haiku', run_in_background: true }),
    S('toolu_3', { subagent_type: 'general-purpose' }),
    { type: 'assistant', parent_tool_use_id: null, message: { model: OPUS, content: [{ type: 'tool_use', id: 'toolu_4', name: 'Task', input: { model: 'opus' } }] } },
    { type: 'assistant', parent_tool_use_id: 'toolu_1', message: { model: SONNET, content: [{ type: 'tool_use', id: 'toolu_nested', name: 'Agent', input: { model: 'haiku' } }] } },
    { type: 'assistant', parent_tool_use_id: null, message: { model: OPUS, content: [{ type: 'tool_use', id: 'toolu_skill', name: 'Skill', input: { skill: 's' } }] } },
  ]);
  assert.deepEqual([...run.spawns.entries()], [
    ['toolu_1', { model: 'sonnet', background: false, subagentType: 'general-purpose' }],
    ['toolu_2', { model: 'haiku', background: true, subagentType: undefined }],
    ['toolu_3', { model: undefined, background: false, subagentType: 'general-purpose' }],
    ['toolu_4', { model: 'opus', background: false, subagentType: undefined }],
  ]);
});

test('verdict: honored, ignored, partial on three hand-built variants — and not invoked on nothing', () => {
  assert.equal(verdict([HAIKU, HAIKU]), 'honored');
  assert.equal(verdict([OPUS, OPUS, OPUS]), 'ignored');
  assert.equal(verdict([HAIKU, OPUS, OPUS]), 'partial (1/3 on haiku)');
  assert.equal(verdict([]), 'not invoked');
});

test('judgeRow scopes the pin to the main conversation or to the subagents per row', () => {
  const run = [A(OPUS, null), A(HAIKU, 'toolu_a'), R(HAIKU, OPUS)];
  const TOP = { path: 'Skill tool @ top', scope: 'main' };
  const IN_AGENT = { path: 'Skill tool in Agent', scope: 'subagent' };
  const top = judgeRow(TOP, E(TOP, run));
  const agent = judgeRow(IN_AGENT, E(IN_AGENT, run));
  assert.equal(top.verdict, 'ignored');
  assert.equal(agent.verdict, 'honored');
  assert.equal(agent.main, `${OPUS}×1`, 'a subagent row still reports the main conversation, so an upward leak is visible');
  assert.equal(agent.subagents, `${HAIKU}×1`);
  assert.equal(agent.replied, 'pinned');
});

test('a subagent scope with no lines falls back to modelUsage only when the reply arrived, and says so', () => {
  const FORK = { path: 'context: fork', scope: 'subagent' };
  const forkOk = judgeRow(FORK, E(FORK, [A('<synthetic>', null), R(HAIKU)]));
  assert.equal(forkOk.verdict, 'honored (via modelUsage)');
  assert.equal(forkOk.main, '—', '<synthetic> is not a request');
  const forkLeak = judgeRow(FORK, E(FORK, [A('<synthetic>', null), R(OPUS)]));
  assert.equal(forkLeak.verdict, 'ignored (via modelUsage)');
  const silent = judgeRow(FORK, E(FORK, [A(OPUS, null, 'I could not find that skill'), R(OPUS)]));
  assert.equal(silent.verdict, 'not invoked');
});

test('an explicit Agent-model row is judged only from the lines under the spawn whose input carried its model and background flag', () => {
  const honored = [INIT(OPUS), S('toolu_s', { model: 'sonnet', run_in_background: false }), A(SONNET, 'toolu_s', 'probed'), A(SONNET, 'toolu_s', 'probed'), A(SONNET, 'toolu_s', 'probed'), A(OPUS, null, 'probed'), R(HAIKU, OPUS, SONNET)];
  const h = judgeRow(SONNET_FG, E(SONNET_FG, honored));
  assert.equal(h.verdict, 'honored');
  assert.equal(h.replied, 'probed');
  assert.equal(h.init, OPUS, 'the parent session model is per row, not the header');
  assert.equal(h.subagents, `${SONNET}×3`);

  const ignored = [INIT(OPUS), S('toolu_s', { model: 'sonnet', run_in_background: false }), A(OPUS, 'toolu_s', 'probed'), A(OPUS, 'toolu_s', 'probed'), A(OPUS, 'toolu_s', 'probed'), A(OPUS, null, 'probed'), R(HAIKU, OPUS)];
  assert.equal(judgeRow(SONNET_FG, E(SONNET_FG, ignored)).verdict, 'ignored');

  const mixed = [INIT(OPUS), S('toolu_s', { model: 'sonnet', run_in_background: false }), A(SONNET, 'toolu_s', 'probed'), A(OPUS, 'toolu_s'), A(OPUS, 'toolu_s', 'probed'), A(OPUS, null, 'probed'), R(HAIKU, OPUS, SONNET)];
  assert.equal(judgeRow(SONNET_FG, E(SONNET_FG, mixed)).verdict, 'partial (1/3 on sonnet)');

  const noModel = [INIT(OPUS), S('toolu_s', { run_in_background: false, subagent_type: 'general-purpose' }), A(OPUS, 'toolu_s', 'probed'), A(OPUS, null, 'probed'), R(OPUS)];
  const nm = judgeRow(SONNET_FG, E(SONNET_FG, noModel));
  assert.equal(nm.verdict, 'not invoked', 'the parent did not pass the field as told — the spawn record, not the reply, decides');
  assert.equal(nm.replied, 'probed', 'the reply arrived; the verdict still says not invoked');
  assert.equal(nm.subagents, `${OPUS}×1`, "the spawn's actual lines stay visible");

  const silent = [INIT(OPUS), S('toolu_s', { model: 'sonnet', run_in_background: false }), A(OPUS, null, 'the agent returned nothing'), R(HAIKU, OPUS, SONNET)];
  assert.equal(judgeRow(SONNET_FG, E(SONNET_FG, silent)).verdict, 'no evidence (0 requests under toolu_s)');
  assert.equal(judgeRow(SONNET_FG, E(SONNET_FG, silent)).replied, 'no "probed"');

  const fgOnly = [INIT(OPUS), S('toolu_s', { model: 'sonnet', run_in_background: false }), A(SONNET, 'toolu_s', 'probed'), A(OPUS, null, 'probed'), R(OPUS, SONNET)];
  assert.equal(judgeRow(SONNET_BG, E(SONNET_BG, fgOnly)).verdict, 'not invoked', 'a background row is not satisfied by a foreground spawn');
  assert.equal(judgeRow(SONNET_FG, E(SONNET_FG, fgOnly)).verdict, 'honored');

  const bg = [INIT(OPUS), S('toolu_b', { model: 'sonnet', run_in_background: true }), A(SONNET, 'toolu_b', 'probed'), A(OPUS, null, 'probed'), R(OPUS, SONNET)];
  assert.equal(judgeRow(SONNET_BG, E(SONNET_BG, bg)).verdict, 'honored');

  // modelUsage never reaches an explicit verdict: a haiku key with no haiku line under the spawn is the harness, not the worker.
  const usageOnly = [INIT(OPUS), S('toolu_h', { model: 'haiku', run_in_background: false }), A(OPUS, 'toolu_h', 'probed'), A(OPUS, null, 'probed'), R(HAIKU, OPUS)];
  assert.equal(judgeRow(HAIKU_FG, E(HAIKU_FG, usageOnly)).verdict, 'ignored');
});

test('aux names what modelUsage bills without a request line, and says when the worker masks it; cc is per row', () => {
  const auxRun = [INIT(OPUS), S('toolu_s', { model: 'sonnet', run_in_background: false }), A(SONNET, 'toolu_s', 'probed'), A(OPUS, null, 'probed'), R(HAIKU, OPUS, SONNET)];
  const r = judgeRow(SONNET_FG, E(SONNET_FG, auxRun));
  assert.equal(r.aux, `${HAIKU} (usage-only)`);
  assert.equal(r.cc, '2.1.235');

  const masked = [INIT(OPUS), S('toolu_h', { model: 'haiku', run_in_background: false }), A(HAIKU, 'toolu_h', 'probed'), A(OPUS, null, 'probed'), R(HAIKU, OPUS)];
  const m = judgeRow(HAIKU_FG, E(HAIKU_FG, masked));
  assert.equal(m.verdict, 'honored');
  assert.equal(m.aux, '— (masked: worker on haiku)');

  const explained = [INIT(OPUS), S('toolu_s', { model: 'sonnet', run_in_background: false }), A(SONNET, 'toolu_s', 'probed'), A(OPUS, null, 'probed'), R(OPUS, SONNET)];
  assert.equal(judgeRow(SONNET_FG, E(SONNET_FG, explained)).aux, '— (masked: worker on sonnet)', 'every key explained, but an aux call on the worker\'s own model could hide there');

  const clean = [S('toolu_s', { model: 'sonnet', run_in_background: false }), A(OPUS, null, 'nothing came back'), R(OPUS)];
  const c = judgeRow(SONNET_FG, E(SONNET_FG, clean));
  assert.equal(c.aux, '—');
  assert.equal(c.cc, '—', 'no system/init line, no version claimed');

  const TOP = { path: 'Skill tool @ top', scope: 'main' };
  const pinRow = judgeRow(TOP, E(TOP, [INIT(OPUS, '2.1.240'), A(OPUS, null), R(HAIKU, OPUS)]));
  assert.equal(pinRow.aux, `${HAIKU} (usage-only)`, 'the pin rows carry the column too');
  assert.equal(pinRow.cc, '2.1.240');
  const cols = renderTable('hdr', [r]).split('\n')[2];
  assert.match(cols, /result\.modelUsage\s+aux\s+cc$/);
});

test('a probe-row marker without session/expect/kind/background replays as the original defaults — opus session, haiku pin, foreground', () => {
  const [old, fresh] = splitCapture([
    { type: 'probe-row', path: 'Skill tool @ top', scope: 'main', prompt: 'p' }, A(OPUS, null),
    { type: 'probe-row', path: 'Agent model: haiku (bg)', scope: 'subagent', prompt: 'q', kind: 'agent-model', session: 'opus', expect: 'haiku', background: true }, A(OPUS, null, 'probed'),
  ]);
  assert.deepEqual([old.row.kind, old.row.session, old.row.expect, old.row.background], ['pin', 'opus', 'haiku', false]);
  assert.deepEqual([fresh.row.kind, fresh.row.session, fresh.row.expect, fresh.row.background], ['agent-model', 'opus', 'haiku', true]);
  assert.equal(judgeRow(old.row, E(old.row, old.events)).verdict, 'ignored', 'judged exactly as before the fields existed');
  assert.equal(judgeRow(fresh.row, E(fresh.row, fresh.events)).verdict, 'not invoked');
});

test('parseLines skips non-JSON noise; splitCapture honors probe-row markers and treats a bare stream as one row', () => {
  const events = parseLines(`garbage line\n${JSON.stringify(A(OPUS, null))}\n\n{"type":"result","modelUsage":{}}\n`);
  assert.equal(events.length, 2);
  assert.equal(splitCapture(events).length, 1);
  assert.equal(splitCapture(events)[0].row.path, 'capture');
  const marked = [{ type: 'probe-row', path: 'a', scope: 'main' }, A(OPUS, null), { type: 'probe-row', path: 'b', scope: 'subagent' }, A(HAIKU, 'x')];
  assert.deepEqual(splitCapture(marked).map((r) => [r.row.path, r.events.length]), [['a', 1], ['b', 1]]);
});

// --parse is the free path. If it can reach a spawn, a mistyped replay becomes ten
// billed runs — so the stub first on PATH is the assertion, not the exit code.
function runParse(input) {
  const stubDir = mkdtempSync(path.join(tmpdir(), 'esq-probe-stub-'));
  const marker = path.join(stubDir, 'spawned');
  writeFileSync(path.join(stubDir, 'claude'), `#!/bin/sh\ntouch ${marker}\nexit 0\n`);
  chmodSync(path.join(stubDir, 'claude'), 0o755);
  const r = spawnSync(process.execPath, [SCRIPT, '--parse'], {
    input,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${stubDir}:${process.env.PATH}` },
  });
  return { ...r, spawned: existsSync(marker) };
}

test('--parse replays the fixture at exit 0 and starts no claude process', () => {
  const r = runParse(readFileSync(CAPTURE));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.spawned, false, '--parse reached a claude spawn — the free path can bill');
  assert.match(r.stdout, /--parse/);
  for (const row of ROWS) assert.ok(r.stdout.includes(row.path), `${row.path} is missing from the replayed table`);
});

test('--parse refuses an empty stdin with exit 2 rather than falling through to the billed path', () => {
  const r = runParse('');
  assert.equal(r.status, 2);
  assert.equal(r.spawned, false, 'an empty capture reached a claude spawn — the refusal is what keeps --parse free');
  assert.match(r.stderr, /empty capture on stdin/);
});

test('the fixture capture judges to the ten rows measured on 2.1.235 and renders one line per row', async () => {
  const text = await readFile(path.join(here, 'fixtures', 'capture.jsonl'), 'utf8');
  const { judged, init } = judgeCapture(parseLines(text));
  assert.equal(init.claude_code_version, '2.1.235');
  assert.deepEqual(judged.map((r) => [r.path, r.verdict]), [
    ['typed /skill', 'honored'],
    ['Skill tool @ top', 'ignored'],
    ['Skill tool in Agent', 'ignored'],
    ['context: fork', 'honored (via modelUsage)'],
    ['Agent model: opus (fg)', 'honored'],
    ['Agent model: opus (bg)', 'honored'],
    ['Agent model: sonnet (fg)', 'honored'],
    ['Agent model: sonnet (bg)', 'honored'],
    ['Agent model: haiku (fg)', 'honored'],
    ['Agent model: haiku (bg)', 'honored'],
  ]);
  assert.ok(judged.every((r) => r.cc === '2.1.235'), 'every row carries the version it was measured on');
  assert.equal(judged[1].aux, `${HAIKU} (usage-only)`, "the harness's haiku call on an opus session is named, not mistaken for a worker");
  // The explicit rows' parent runs on a model the worker must differ from: sonnet for the opus workers, opus for the rest.
  assert.deepEqual(judged.slice(4).map((r) => r.init), ['claude-sonnet-5', 'claude-sonnet-5', 'claude-opus-5', 'claude-opus-5', 'claude-opus-5', 'claude-opus-5']);
  assert.deepEqual(judged.slice(4).map((r) => r.subagents), ['claude-opus-5×1', 'claude-opus-5×1', 'claude-sonnet-5×1', 'claude-sonnet-5×1', `${HAIKU}×2`, `${HAIKU}×2`], 'every explicit verdict rests on request lines under the spawn id');
  assert.ok(judged.slice(4).every((r) => r.replied === 'probed'));
  // On 2.1.235 the opus worker is billed under the long-context key, which no request line spells: the aux column explains it by the `claude-opus-5` request rather than flagging the worker as usage-only.
  assert.equal(judged[4].aux, `${HAIKU} (usage-only)`);
  assert.equal(judged[8].aux, '— (masked: worker on haiku)');
  const table = renderTable('hdr', judged);
  const lines = table.split('\n');
  assert.equal(lines[0], 'hdr');
  assert.equal(lines.length, 2 + 2 + 10, 'header, blank, column header, rule, ten rows');
  assert.ok(lines.slice(4).every((l) => /honored|ignored|partial|not invoked|no evidence/.test(l)));
});

// The equivalence the whole change rests on: nothing a judge or a displayed column
// reads may move. The ten rows below are what the probe measured on 2.1.235,
// written down as literals rather than recomputed — both sides of a comparison
// against `judgeCapture` would run this same code and agree with themselves, which
// is the defect Phase 2 found in its own equivalence test.
const JUDGED_TODAY = [
  { path: 'typed /skill', scope: 'main', verdict: 'honored', init: HAIKU, main: `${HAIKU}×2`, subagents: '—', replied: 'pinned', usage: HAIKU, aux: '— (masked: worker on haiku)', cc: '2.1.235' },
  { path: 'Skill tool @ top', scope: 'main', verdict: 'ignored', init: OPUS, main: `${OPUS}×2`, subagents: '—', replied: 'pinned', usage: `${HAIKU}, ${OPUS}`, aux: `${HAIKU} (usage-only)`, cc: '2.1.235' },
  { path: 'Skill tool in Agent', scope: 'subagent', verdict: 'ignored', init: OPUS, main: `${OPUS}×2`, subagents: `${OPUS}×2`, replied: 'pinned', usage: `${HAIKU}, ${OPUS}`, aux: `${HAIKU} (usage-only)`, cc: '2.1.235' },
  { path: 'context: fork', scope: 'subagent', verdict: 'honored (via modelUsage)', init: OPUS, main: '—', subagents: '—', replied: 'pinned', usage: HAIKU, aux: `${HAIKU} (usage-only)`, cc: '2.1.235' },
  { path: 'Agent model: opus (fg)', scope: 'subagent', verdict: 'honored', init: 'claude-sonnet-5', main: 'claude-sonnet-5×3', subagents: `${OPUS}×1`, replied: 'probed', usage: `${HAIKU}, claude-sonnet-5, ${OPUS}[1m]`, aux: `${HAIKU} (usage-only)`, cc: '2.1.235' },
  { path: 'Agent model: opus (bg)', scope: 'subagent', verdict: 'honored', init: 'claude-sonnet-5', main: 'claude-sonnet-5×6', subagents: `${OPUS}×1`, replied: 'probed', usage: `${HAIKU}, claude-sonnet-5, ${OPUS}[1m]`, aux: `${HAIKU} (usage-only)`, cc: '2.1.235' },
  { path: 'Agent model: sonnet (fg)', scope: 'subagent', verdict: 'honored', init: OPUS, main: `${OPUS}×3`, subagents: 'claude-sonnet-5×1', replied: 'probed', usage: `${HAIKU}, ${OPUS}, claude-sonnet-5`, aux: `${HAIKU} (usage-only)`, cc: '2.1.235' },
  { path: 'Agent model: sonnet (bg)', scope: 'subagent', verdict: 'honored', init: OPUS, main: `${OPUS}×4`, subagents: 'claude-sonnet-5×1', replied: 'probed', usage: `${HAIKU}, ${OPUS}, claude-sonnet-5`, aux: `${HAIKU} (usage-only)`, cc: '2.1.235' },
  { path: 'Agent model: haiku (fg)', scope: 'subagent', verdict: 'honored', init: OPUS, main: `${OPUS}×3`, subagents: `${HAIKU}×2`, replied: 'probed', usage: `${HAIKU}, ${OPUS}`, aux: '— (masked: worker on haiku)', cc: '2.1.235' },
  { path: 'Agent model: haiku (bg)', scope: 'subagent', verdict: 'honored', init: OPUS, main: `${OPUS}×4`, subagents: `${HAIKU}×2`, replied: 'probed', usage: `${HAIKU}, ${OPUS}`, aux: '— (masked: worker on haiku)', cc: '2.1.235' },
];

// Every key and every string value the persisted records may not carry, checked to
// every leaf rather than by grepping the file: a nested one is the one that gets
// missed. `text` is refused here, unlike in tests/smoke/: no probe record has a
// prose field at all, and `replied` is the only trace the model's reply leaves.
// `usage` is not refused — a probe-evidence `usage` is `result.modelUsage`'s keys,
// which are model names.
const FORBIDDEN_KEYS = new Set([
  'session_id', 'uuid', 'mcp_servers', 'memory_paths', 'messaging_socket_path',
  'apiKeySource', 'tools', 'slash_commands', 'cwd', 'permissionMode', 'plugins',
  'prompt', 'message', 'content', 'text', 'stream',
]);
function assertNoAmbient(value, where = 'record') {
  if (Array.isArray(value)) { value.forEach((v, i) => assertNoAmbient(v, `${where}[${i}]`)); return; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      assert.ok(!FORBIDDEN_KEYS.has(k), `${where}.${k} is persisted, and it is not something a judge reads`);
      assertNoAmbient(v, `${where}.${k}`);
    }
    return;
  }
  if (typeof value === 'string') {
    assert.ok(!value.includes('/home/'), `${where} carries a home-rooted path: ${value.slice(0, 80)}`);
  }
}

// Every ambient field a `system/init` line carries and every word of prose an
// `assistant` line carries — the input the boundary exists for. The capture holds
// none of it any more, which is the point, so the raw stream is rebuilt here from
// what the record kept: `readRun`'s inverse, wrapped in the identity the harness
// actually emits. A `<synthetic>` line is a harness-relayed message — it carries
// text and can host a spawn without being a request, which is how `context: fork`
// reaches a verdict with no main-conversation line of its own.
const AMBIENT = { session_id: 'e7c0ffee-1111-2222-3333-444455556666', uuid: '9a8b7c6d-0000-1111-2222-333344445555' };
const AMBIENT_INIT = {
  cwd: '/home/someone/projects/esquisse',
  apiKeySource: 'ANTHROPIC_API_KEY',
  permissionMode: 'bypassPermissions',
  mcp_servers: [{ name: 'claude_ai_Gmail', status: 'needs-auth' }],
  memory_paths: ['/home/someone/.claude/CLAUDE.md'],
  messaging_socket_path: '/run/user/1000/claude-messaging.sock',
  tools: ['Bash', 'Read', 'Skill', 'Agent'],
  slash_commands: ['esq:work', 'esq:plan'],
  plugins: [{ name: 'esq', path: '/home/someone/projects/esquisse/plugin', source: 'local', version: '0.1.0' }],
};

function ambientStream(row, ev) {
  const line = (model, parent, content) => ({ type: 'assistant', parent_tool_use_id: parent, ...AMBIENT, message: { model, content } });
  const events = [{
    type: 'system', subtype: 'init', ...AMBIENT, ...AMBIENT_INIT,
    model: ev.init.model, claude_code_version: ev.init.claude_code_version,
  }];
  const spawnParts = Object.entries(ev.spawns).map(([id, s]) => ({
    type: 'tool_use', id, name: 'Agent',
    input: { model: s.model, run_in_background: s.background, subagent_type: s.subagentType, prompt: agentModelPrompt },
  }));
  const reply = [{ type: 'text', text: `${LIVENESS[row.kind]} — and here is /home/someone/projects/esquisse, said out loud` }];
  events.push(line(ev.main[0] || '<synthetic>', null, [...reply, ...spawnParts]));
  for (const model of ev.main.slice(1)) events.push(line(model, null, [{ type: 'text', text: 'more of the parent\'s prose' }]));
  for (const [id, models] of Object.entries(ev.subagents)) {
    for (const model of models) events.push(line(model, id, [{ type: 'text', text: `the worker's prose, from ${id}` }]));
  }
  events.push({ type: 'result', ...AMBIENT, subtype: 'success', modelUsage: Object.fromEntries(ev.usage.map((m) => [m, { inputTokens: 1 }])) });
  events.push({ type: 'user', ...AMBIENT, message: { content: [{ type: 'tool_result', content: 'tool output' }] } });
  events.push({ type: 'rate_limit_event', ...AMBIENT, status: 'allowed_warning' });
  return events;
}
const agentModelPrompt = 'Reply with the single word `probed`; call no tools.';

test('an ambient run and its persisted record judge identically', async () => {
  const rows = splitCapture(parseLines(await readFile(CAPTURE, 'utf8')));
  assert.equal(rows.length, JUDGED_TODAY.length);

  rows.forEach(({ row, evidence }, i) => {
    assert.ok(evidence, `${row.path} has no persisted probe-evidence record`);
    // The raw stream goes in — ambient fields, prose and all, exactly as `claude`
    // emits it — through the production write side, never a twin of it.
    const [marker, rebuilt] = captureRecords(row, { exit: 0, events: ambientStream(row, evidence) });

    assert.deepEqual(Object.keys(marker), ['type', 'path', 'scope', 'kind', 'session', 'expect', 'background'],
      'the marker carries the join key and the row fields a judge reads, and nothing else');
    assert.deepEqual(Object.keys(rebuilt).filter((k) => k !== 'type').sort(),
      ['exit', 'init', 'main', 'replied', 'sawModel', 'spawns', 'subagents', 'usage'],
      'the evidence record carries the eight declared fields and no ninth');
    assertNoAmbient(JSON.parse(JSON.stringify([marker, rebuilt])), row.path);
    assertNoAmbient(JSON.parse(JSON.stringify(evidence)), `${row.path} (checked in)`);

    assert.deepEqual(judgeRow(row, rebuilt), JUDGED_TODAY[i],
      `${row.path} judges differently off the record an ambient run would persist`);
    assert.deepEqual(judgeRow(row, evidence), JUDGED_TODAY[i],
      `${row.path}'s checked-in record judges differently`);
    assert.equal(rebuilt.replied, true, `${row.path}'s liveness word moved`);
    assert.equal(JUDGED_TODAY[i].replied, row.kind === 'agent-model' ? 'probed' : 'pinned');
  });
});

// --------------------------------------------------------------- the billed path
//
// B-099. The live half is the half that spends money, so what is asserted here is
// what it does *before* and *after* the spending: the destination is claimed
// before the first spawn, the bill is declared before the first spawn, `--only`
// bills exactly the rows it names, and an interruption keeps every row already
// paid for. None of it starts a real Claude Code — a stub first on `PATH` is the
// instrument, and every test below counts what that stub was asked to do.

const INIT_LINE = '{"type":"system","subtype":"init","model":"claude-opus-5","claude_code_version":"2.1.258"}';
const REPLY_LINE = '{"type":"assistant","parent_tool_use_id":null,"message":{"model":"claude-opus-5","content":[{"type":"text","text":"probed"}]}}';

/**
 * A scratch `claude` first on `PATH` that answers with a minimal valid stream and
 * records every invocation. `hangFrom` makes the nth billed run (1-based) sleep
 * instead of exiting, which is how an interruption is staged.
 */
function liveStub({ hangFrom = 0 } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'esq-probe-live-'));
  const spawns = path.join(dir, 'spawns');
  const versions = path.join(dir, 'versions');
  const bin = path.join(dir, 'claude');
  writeFileSync(bin, [
    '#!/bin/sh',
    `if [ "$1" = "--version" ]; then echo v >> ${versions}; echo "2.1.258 (Claude Code)"; exit 0; fi`,
    `echo run >> ${spawns}`,
    `n=$(wc -l < ${spawns})`,
    'cat > /dev/null',
    `printf '%s\\n' '${INIT_LINE}'`,
    `printf '%s\\n' '${REPLY_LINE}'`,
    // The hang holds no inherited pipe: once the stub is killed, its `sleep` must
    // not keep the parent's stdout readable open, or a deadline that fired in
    // 400 ms still costs the suite the whole sleep.
    ...(hangFrom ? [`if [ "$n" -ge ${hangFrom} ]; then sleep 30 </dev/null >/dev/null 2>&1; fi`] : []),
    'exit 0',
  ].join('\n'));
  chmodSync(bin, 0o755);
  const count = (file) => (existsSync(file) ? readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).length : 0);
  return {
    dir,
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
    out: path.join(dir, 'capture.jsonl'),
    get billed() { return count(spawns); },
    get versionReads() { return count(versions); },
  };
}

const captureOf = (file) => readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

test('--only bills exactly the rows it names, and the capture holds those rows and no others', () => {
  const stub = liveStub();
  const r = spawnSync(process.execPath, [SCRIPT, '--only', 'pin', '--out', stub.out], { encoding: 'utf8', env: stub.env });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(stub.billed, selectRows('pin').length);
  assert.equal(stub.billed, 4, 'the pin subset is the original four rows');
  const markers = captureOf(stub.out).filter((rec) => rec.type === ROW_MARKER);
  assert.deepEqual(markers.map((m) => m.path), selectRows('pin').map((row) => row.path));
  assert.ok(markers.every((m) => m.kind === 'pin'), 'an agent-model row was billed under --only pin');
});

test('--only refuses a kind it does not know, before any spawn', () => {
  const stub = liveStub();
  const r = spawnSync(process.execPath, [SCRIPT, '--only', 'everything'], { encoding: 'utf8', env: stub.env });
  assert.equal(r.status, 2);
  assert.equal(stub.billed, 0, 'an unknown --only reached a billed spawn');
  assert.match(r.stderr, /--only takes one of: pin, agent-model/);
});

test('a second run against the same --out refuses before spending anything, and the first capture is byte-identical', () => {
  const stub = liveStub();
  const first = spawnSync(process.execPath, [SCRIPT, '--only', 'agent-model', '--out', stub.out], { encoding: 'utf8', env: stub.env });
  assert.equal(first.status, 0, first.stderr);
  const bytes = readFileSync(stub.out);
  const billedByTheFirstRun = stub.billed;

  const second = spawnSync(process.execPath, [SCRIPT, '--only', 'agent-model', '--out', stub.out], { encoding: 'utf8', env: stub.env });
  assert.equal(second.status, 2);
  assert.equal(stub.billed, billedByTheFirstRun, 'the collision was refused after billing a run');
  assert.equal(stub.versionReads, 1, 'the refused run still started a claude process');
  assert.deepEqual(readFileSync(stub.out), bytes, 'the refused run touched the capture it collided with');
  assert.match(second.stderr, /already exists — wrote nothing, and the file is untouched/);
  assert.doesNotMatch(second.stderr, /about to bill/, 'a run that will not happen declared a bill anyway');
});

test('the bill is declared before the first spawn, with the subset, the run count, the bound and its dated reading', () => {
  const stub = liveStub();
  const r = spawnSync(process.execPath, [SCRIPT, '--only', 'agent-model', '--out', stub.out], { encoding: 'utf8', env: stub.env });
  assert.equal(r.status, 0, r.stderr);
  const declared = r.stderr.indexOf('about to bill');
  const firstSpawn = r.stderr.indexOf('▸');
  assert.ok(declared >= 0, `no declaration on stderr:\n${r.stderr}`);
  assert.ok(firstSpawn > declared, 'the bill was named after the first spawn — that is a bill, not a bound');
  assert.match(r.stderr, /about to bill 6 live Claude Code runs/);
  assert.match(r.stderr, /subset:\s+agent-model — 6 of 10 rows/);
  assert.match(r.stderr, /maximum:\s+6 runs, one headless session each, no retries/);
  assert.match(r.stderr, new RegExp(`bound: +${ROW_DEADLINE_MS / 1000} s per run, ${runBoundMs(6) / 1000} s for the invocation`));
  assert.match(r.stderr, /cost:\s+~\$0\.90 at the 2026-08-19 reading/);
});

test('--help names --only, the run counts and the time bound, and starts no claude process', () => {
  const stub = liveStub();
  const r = spawnSync(process.execPath, [SCRIPT, '--help'], { encoding: 'utf8', env: stub.env });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(stub.billed + stub.versionReads, 0, '--help started a claude process');
  assert.match(r.stdout, /--only <kind>\s+pin \| agent-model/);
  assert.match(r.stdout, /--only agent-model\s+6 runs/);
  assert.match(r.stdout, /\(no --only\)\s+10 runs/);
  assert.match(r.stdout, new RegExp(`bound: ${ROW_DEADLINE_MS / 1000} s per run`));
});

test('a run killed partway through keeps every row it had already billed, and they parse', async () => {
  // The third billed run hangs; the two before it have already been appended.
  const stub = liveStub({ hangFrom: 3 });
  const child = spawn(process.execPath, [SCRIPT, '--out', stub.out], { encoding: 'utf8', env: stub.env, stdio: 'ignore' });
  try {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline && stub.billed < 3) await delay(25);
    assert.equal(stub.billed, 3, 'the stub never reached the hanging run');
    // give the two completed rows their appends, then kill without a chance to close
    while (Date.now() < deadline && (!existsSync(stub.out) || captureOf(stub.out).length < 4)) await delay(25);
    child.kill('SIGKILL');
  } finally {
    child.kill('SIGKILL');
  }
  const records = captureOf(stub.out);
  assert.equal(records.length, 4, 'the killed run did not keep exactly the two rows it had paid for');
  assert.deepEqual(records.map((rec) => rec.type), [ROW_MARKER, 'probe-evidence', ROW_MARKER, 'probe-evidence']);
  assert.deepEqual(records.filter((rec) => rec.type === ROW_MARKER).map((rec) => rec.path), ROWS.slice(0, 2).map((row) => row.path));
  assert.deepEqual(readdirSync(stub.dir).filter((f) => f.startsWith('.')), [], 'the killed run stranded a temp file');
});

test('a row that passes its deadline is killed rather than billed without a ceiling', async () => {
  const stub = liveStub({ hangFrom: 1 });
  const saved = process.env.PATH;
  process.env.PATH = stub.env.PATH;
  try {
    const t0 = Date.now();
    const result = await runOne({ session: 'opus', prompt: 'x' }, 400);
    assert.equal(result.timedOut, true, 'the deadline did not fire on a hanging run');
    assert.ok(Date.now() - t0 < 20_000, 'the run outlived its deadline by a long way');
    assert.equal(stub.billed, 1);
  } finally {
    process.env.PATH = saved;
  }
});
