import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readdir, readFile, symlink, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { protectInstalled } from '../../plugin/scripts/protect-installed.mjs';
import { repoKey, sessionKey, telemetryOptedOut } from '../../plugin/scripts/hook-io.mjs';
import { finalizeTranscript, initialTranscriptState, planSlugFrom, recordAgentTelemetry, recordSubagentStop, reduceTranscriptLine } from '../../plugin/scripts/record-agent-telemetry.mjs';
import { validateStop } from '../../plugin/scripts/validate-stop.mjs';

async function invalidProject() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-hook-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  await writeFile(path.join(root, 'docs/BACKLOG.md'), '# Backlog\n\n| ID | Status |\n|---|---|\n| B-001 | Impossible |\n');
  return root;
}

test('installed cache edits are denied while development sources remain editable', async () => {
  const installed = protectInstalled(
    { cwd: '/work/app', tool_input: { file_path: '/config/plugins/cache/esquisse/esq/1.0/skills/build/SKILL.md' } },
    { CLAUDE_PROJECT_DIR: '/work/app', CLAUDE_PLUGIN_ROOT: '/config/plugins/cache/esquisse/esq/1.0' }
  );
  assert.equal(installed.hookSpecificOutput.permissionDecision, 'deny');
  const development = protectInstalled(
    { cwd: '/work/esquisse', tool_input: { file_path: '/work/esquisse/plugin/skills/build/SKILL.md' } },
    { CLAUDE_PROJECT_DIR: '/work/esquisse', CLAUDE_PLUGIN_ROOT: '/work/esquisse/plugin' }
  );
  assert.equal(development, null);

  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-link-'));
  const pluginRoot = path.join(root, 'cache/esq');
  await mkdir(pluginRoot, { recursive: true });
  await writeFile(path.join(pluginRoot, 'SKILL.md'), 'installed');
  await symlink(path.join(pluginRoot, 'SKILL.md'), path.join(root, 'alias.md'));
  const alias = protectInstalled(
    { cwd: path.join(root, 'project'), tool_input: { file_path: path.join(root, 'alias.md') } },
    { CLAUDE_PROJECT_DIR: path.join(root, 'project'), CLAUDE_PLUGIN_ROOT: pluginRoot }
  );
  assert.equal(alias.hookSpecificOutput.permissionDecision, 'deny');
});

test('bash mutations of the installed cache are denied, reads and dev-tree edits pass', () => {
  const env = { CLAUDE_PROJECT_DIR: '/work/app', CLAUDE_PLUGIN_ROOT: '/config/plugins/cache/esquisse/esq/1.0' };
  const bash = command => protectInstalled({ cwd: '/work/app', tool_name: 'Bash', tool_input: { command } }, env);

  const absolute = bash("sed -i '2s/a/b/' /config/plugins/cache/esquisse/esq/1.0/skills/status/SKILL.md");
  assert.equal(absolute.hookSpecificOutput.permissionDecision, 'deny');
  const cdRelative = bash("cd /config/plugins/cache/esquisse/esq/1.0/.. && sed -i '2s/a/b/' plugin/skills/status/SKILL.md");
  assert.equal(cdRelative && 'hookSpecificOutput' in cdRelative, true);
  assert.equal(bash('grep -n snapshot /config/plugins/cache/esquisse/esq/1.0/skills/status/SKILL.md'), null);
  assert.equal(bash('sed -i s/a/b/ /work/app/src/index.js'), null);

  const dev = protectInstalled(
    { cwd: '/work/esquisse', tool_name: 'Bash', tool_input: { command: 'sed -i s/a/b/ /work/esquisse/plugin/skills/status/SKILL.md' } },
    { CLAUDE_PROJECT_DIR: '/work/esquisse', CLAUDE_PLUGIN_ROOT: '/work/esquisse/plugin' }
  );
  assert.equal(dev, null);
});

test('stop validation blocks one invalid stop and cannot loop', async () => {
  const root = await invalidProject();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  const blocked = await validateStop({ hook_event_name: 'Stop', cwd: root, stop_hook_active: false, background_tasks: [], session_crons: [] });
  assert.equal(blocked.decision, 'block');
  assert.match(blocked.reason, /invalid backlog status/);
  assert.equal(await validateStop({ hook_event_name: 'Stop', cwd: root, stop_hook_active: true }), null);
});

test('stop validation ignores defects the session did not leave uncommitted', async () => {
  const root = await invalidProject();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  process.env.ESQ_TEST_GIT_DIRTY = '0';
  try {
    assert.equal(await validateStop({ hook_event_name: 'Stop', cwd: root, stop_hook_active: false, background_tasks: [], session_crons: [] }), null);
  } finally {
    delete process.env.ESQ_TEST_GIT_DIRTY;
  }
});

test('stop validation waits for background work and ignores non-repositories', async () => {
  assert.equal(await validateStop({ hook_event_name: 'Stop', cwd: '/tmp', stop_hook_active: false, background_tasks: [{ id: '1' }] }), null);
  delete process.env.NODE_ENV;
  delete process.env.ESQ_TEST_GIT_ROOT;
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-not-git-'));
  assert.equal(await validateStop({ hook_event_name: 'Stop', cwd: root, stop_hook_active: false }), null);
});

test('hook entrypoints read the harness payload from stdin end to end', async () => {
  const scripts = path.join(fileURLToPath(new URL('.', import.meta.url)), '../../plugin/scripts');
  // timeout: a sandbox that is slow (not dead) at nested spawns kills the child
  // and surfaces here as ETIMEDOUT on result.error — failing THIS test by name
  // inside the kept diagnostics, rather than only as audit.sh's outer 120 s bound.
  const run = (script, payload, env = {}) => {
    const result = spawnSync(process.execPath, [path.join(scripts, script)], {
      input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, ...env }, timeout: 10_000
    });
    assert.equal(result.error, undefined, `${script} did not return within 10 s: ${result.error}`);
    return result;
  };

  const denied = run('protect-installed.mjs',
    { cwd: '/work/app', tool_input: { file_path: '/config/plugins/cache/esquisse/esq/1.0/skills/build/SKILL.md' } },
    { CLAUDE_PROJECT_DIR: '/work/app', CLAUDE_PLUGIN_ROOT: '/config/plugins/cache/esquisse/esq/1.0' });
  assert.equal(denied.status, 0, denied.stderr);
  assert.match(denied.stdout, /"permissionDecision":"deny"/);

  const notGit = await mkdtemp(path.join(os.tmpdir(), 'esq-stdin-'));
  const allowed = run('validate-stop.mjs', { hook_event_name: 'Stop', cwd: notGit, stop_hook_active: true });
  assert.equal(allowed.status, 0, allowed.stderr);
  assert.equal(allowed.stdout, '');

  // SubagentStop output would be injected into every subagent return: the hook must stay silent.
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const stopped = run('record-agent-telemetry.mjs',
    { hook_event_name: 'SubagentStop', session_id: 's', agent_id: 'agent-stdin', agent_type: 'general-purpose',
      agent_transcript_path: path.join(dataRoot, 'missing.jsonl'), last_assistant_message: 'done' },
    { CLAUDE_PLUGIN_DATA: dataRoot });
  assert.equal(stopped.status, 0, stopped.stderr);
  assert.equal(stopped.stdout, '');
  const written = await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
  assert.match(written, /"source":"SubagentStop"/);
  assert.match(written, /"agentId":"agent-stdin"/);

  // A labelled Agent spawn through stdin writes the label row, silently, and exits 0.
  const labelRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const labelled = run('record-agent-telemetry.mjs',
    { hook_event_name: 'PostToolUse', session_id: 's', tool_name: 'Agent',
      tool_input: { subagent_type: 'general-purpose', description: 'esq:check the plan', prompt: 'secret prompt' },
      tool_response: { status: 'completed', agentId: 'agent-label-stdin', content: [{ type: 'text', text: 'secret result' }] } },
    { CLAUDE_PLUGIN_DATA: labelRoot });
  assert.equal(labelled.status, 0, labelled.stderr);
  assert.equal(labelled.stdout, '');
  const labelWritten = await readFile(path.join(labelRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
  assert.match(labelWritten, /"source":"AgentLabel".*"esqCommand":"check"/);
  assert.doesNotMatch(labelWritten, /the plan|secret/);

  // A harness-internal stop — no agent type, no transcript — is skipped, silently, and creates no file.
  const untypedRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const untyped = run('record-agent-telemetry.mjs',
    { hook_event_name: 'SubagentStop', session_id: 's', agent_id: 'agent-internal', agent_type: '',
      agent_transcript_path: path.join(untypedRoot, 'never-written.jsonl'), last_assistant_message: 'Recap: …' },
    { CLAUDE_PLUGIN_DATA: untypedRoot });
  assert.equal(untyped.status, 0, untyped.stderr);
  assert.equal(untyped.stdout, '');
  assert.equal(existsSync(path.join(untypedRoot, 'telemetry/agent-runs.jsonl')), false);

  // An opted-out shell: the same real SubagentStop payload exits 0, prints nothing, writes nothing.
  const optedOutRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const optedOut = run('record-agent-telemetry.mjs',
    { hook_event_name: 'SubagentStop', session_id: 's', agent_id: 'agent-opted-out', agent_type: 'general-purpose',
      agent_transcript_path: path.join(optedOutRoot, 'missing.jsonl'), last_assistant_message: 'done' },
    { CLAUDE_PLUGIN_DATA: optedOutRoot, ESQ_TELEMETRY: '0' });
  assert.equal(optedOut.status, 0, optedOut.stderr);
  assert.equal(optedOut.stdout, '');
  assert.equal(existsSync(path.join(optedOutRoot, 'telemetry')), false);
});

test('agent telemetry records bounded usage fields without prompts or output', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const input = {
    session_id: 'session-1', tool_name: 'Agent',
    tool_input: { subagent_type: 'general-purpose', prompt: 'secret prompt' },
    tool_response: {
      status: 'completed', agentId: 'agent-1', content: [{ type: 'text', text: 'secret result' }],
      resolvedModel: 'claude-sonnet', modelsUsed: ['claude-sonnet'], totalDurationMs: 42,
      totalToolUseCount: 3, totalTokens: 99, usage: { input_tokens: 80, output_tokens: 19 }
    }
  };
  await recordAgentTelemetry(input, { CLAUDE_PLUGIN_DATA: dataRoot });
  const text = await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
  assert.match(text, /"durationMs":42/);
  assert.match(text, /"source":"PostToolUse"/);
  assert.doesNotMatch(text, /secret prompt|secret result/);

  // The same agentId completing twice — a second PostToolUse for a run already recorded — is one line, not two.
  assert.equal(await recordAgentTelemetry(input, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  const again = await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
  assert.equal(again.trim().split('\n').length, 1);
});

test('a labelled Agent description leaves the esq command slug beside the record, and nothing else', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const labelled = {
    session_id: 'session-1', tool_name: 'Agent',
    tool_input: { subagent_type: 'general-purpose', description: 'esq:build phase 2 of the plan', prompt: 'secret prompt' },
    tool_response: { status: 'completed', agentId: 'agent-l', content: [{ type: 'text', text: 'secret result' }], totalDurationMs: 7 }
  };
  await recordAgentTelemetry(labelled, { CLAUDE_PLUGIN_DATA: dataRoot });
  const lines = (await runsOf(dataRoot)).map(l => JSON.parse(l));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].source, 'AgentLabel');
  assert.equal(lines[0].esqCommand, 'build');
  assert.equal(lines[0].agentId, 'agent-l');
  assert.equal(lines[0].agentType, 'general-purpose');
  assert.equal(lines[1].source, 'PostToolUse');
  assert.equal(lines[1].agentId, 'agent-l');
  const text = await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
  assert.doesNotMatch(text, /phase 2 of the plan|secret prompt|secret result|"description"/);

  // A non-esq description — a consuming project's own agent — leaves no label.
  const plain = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  await recordAgentTelemetry({ ...labelled, tool_input: { ...labelled.tool_input, description: 'Explore the auth module' } }, { CLAUDE_PLUGIN_DATA: plain });
  const plainLines = await runsOf(plain);
  assert.equal(plainLines.length, 1);
  assert.doesNotMatch(plainLines[0], /AgentLabel|esqCommand/);

  // The regex is anchored and lowercase-only: these are not labels.
  for (const description of ['esq:Build', 'esq:', 'esq:build_phase', 'run esq:build', 'esq:-build']) {
    const shape = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
    await recordAgentTelemetry({ ...labelled, tool_input: { ...labelled.tool_input, description } }, { CLAUDE_PLUGIN_DATA: shape });
    assert.doesNotMatch((await runsOf(shape)).join('\n'), /AgentLabel/, description);
  }
});

test('a labelled spawn keeps the validated requestedModel from tool_input.model, and nothing outside the pattern', async () => {
  const base = {
    session_id: 'session-1', tool_name: 'Agent',
    tool_input: { subagent_type: 'general-purpose', description: 'esq:build phase 2 of the plan', prompt: 'secret prompt' },
    tool_response: { status: 'completed', agentId: 'agent-m', content: [{ type: 'text', text: 'secret result' }], totalDurationMs: 7 }
  };
  const labelOf = async input => {
    const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
    await recordAgentTelemetry(input, { CLAUDE_PLUGIN_DATA: dataRoot });
    const text = await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
    const label = text.trim().split('\n').map(l => JSON.parse(l)).find(r => r.source === 'AgentLabel');
    return { label, text };
  };

  // An alias is stored; a full id is stored; `inherit` is stored (the assertion reads it as unrequested).
  for (const model of ['opus', 'claude-opus-5', 'claude-opus-5[1m]', 'inherit']) {
    const { label } = await labelOf({ ...base, tool_input: { ...base.tool_input, model } });
    assert.equal(label.requestedModel, model, model);
  }

  // No `model` field: no key at all — not null, not an empty string.
  const { label: bare } = await labelOf(base);
  assert.equal(Object.hasOwn(bare, 'requestedModel'), false);
  assert.equal(bare.esqCommand, 'build');

  // A value outside the pattern is dropped, and the string never reaches the file.
  for (const model of ['opus; rm -rf', 'Opus', 'gpt-5', 'claude-', '', 42, null]) {
    const { label, text } = await labelOf({ ...base, tool_input: { ...base.tool_input, model } });
    assert.equal(Object.hasOwn(label, 'requestedModel'), false, String(model));
    if (typeof model === 'string' && model !== '') assert.equal(text.includes(model), false, model);
    assert.doesNotMatch(text, /rm -rf|phase 2 of the plan|secret prompt|secret result|"description"|"prompt"/);
  }
});

test('a label written first does not block the SubagentStop record it names', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  // A backgrounded spawn: PostToolUse fires at launch, before the run completes, with the agentId but no `completed`.
  await recordAgentTelemetry({
    session_id: 'session-1', tool_name: 'Agent',
    tool_input: { subagent_type: 'general-purpose', description: 'esq:build phase 2', prompt: 'secret prompt' },
    tool_response: { status: 'async_launched', agentId: 'agent-x' }
  }, { CLAUDE_PLUGIN_DATA: dataRoot });
  assert.equal((await runsOf(dataRoot)).length, 1);
  const stop = await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });
  assert.notEqual(stop, null);
  const lines = (await runsOf(dataRoot)).map(l => JSON.parse(l));
  assert.deepEqual(lines.map(l => l.source), ['AgentLabel', 'SubagentStop']);
  assert.equal(lines[0].esqCommand, 'build');
  assert.deepEqual(lines[1].runUsage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
});

// A subagent transcript the way the harness writes it: one content block per line, a streamed
// API request spread over several lines sharing message.id with output_tokens growing, user
// lines carrying the prompt and tool results, and no field this record may keep beyond numbers.
const T0 = Date.parse('2026-08-18T10:00:00.000Z');
const at = ms => new Date(T0 + ms).toISOString();
const line = (type, timestamp, message) => JSON.stringify({ type, timestamp, agentId: 'agent-x', message });
const usage = (input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens) =>
  ({ input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, service_tier: 'standard' });
const transcriptLines = [
  line('user', at(0), { role: 'user', content: 'secret prompt' }),
  line('assistant', at(1000), { id: 'msg_1', model: 'claude-a', content: [{ type: 'thinking', thinking: 'secret thought' }], usage: usage(2, 1, 100, 0) }),
  line('assistant', at(1100), { id: 'msg_1', model: 'claude-a', content: [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'secret input' } }], usage: usage(2, 1, 100, 0) }),
  line('assistant', at(1200), { id: 'msg_1', model: 'claude-a', content: [{ type: 'tool_use', id: 't2', name: 'Grep', input: {} }], usage: usage(2, 300, 100, 0) }),
  line('user', at(1500), { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'secret result "type":"assistant" inside a tool result' }] }),
  '{ this line is not json',
  line('assistant', at(3000), { id: 'msg_2', model: 'claude-b', content: [{ type: 'text', text: 'partial' }], usage: usage(4, 2, 0, 100) }),
  line('assistant', at(3500), { id: 'msg_2', model: 'claude-b', content: [{ type: 'text', text: 'the final answer' }], usage: usage(4, 50, 0, 100) })
];
async function writeTranscript(lines) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'esq-transcript-'));
  const file = path.join(dir, 'agent-x.jsonl');
  await writeFile(file, `${lines.join('\n')}\n`);
  return file;
}
const stopInput = (transcriptPath, extra = {}) => ({
  hook_event_name: 'SubagentStop', session_id: 'session-1', agent_id: 'agent-x', agent_type: 'general-purpose',
  agent_transcript_path: transcriptPath, last_assistant_message: 'the final answer', cwd: '/work/app', ...extra
});
const runsOf = async dataRoot => (await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8')).trim().split('\n');

test('SubagentStop sums whole-run usage over the last line per request and keeps numbers only', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  const { record } = await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });
  assert.equal(record.source, 'SubagentStop');
  assert.equal(record.agentId, 'agent-x');
  assert.equal(record.agentType, 'general-purpose');
  assert.deepEqual(record.models, ['claude-a', 'claude-b']);
  assert.equal(record.apiRequests, 2);
  assert.equal(record.toolUseCount, 2);
  assert.equal(record.durationMs, 3500);
  assert.deepEqual(record.runUsage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
  assert.equal(record.transcriptComplete, true);
  // B-040: the last assistant text is read transiently to compute transcriptComplete and never
  // written — the row carries none of the transcript's prompt, reasoning, tool result or answer.
  const [text] = await runsOf(dataRoot);
  assert.doesNotMatch(text, /secret prompt/);
  assert.doesNotMatch(text, /secret thought/);
  assert.doesNotMatch(text, /secret result/);
  assert.doesNotMatch(text, /the final answer/);
  assert.doesNotMatch(text, /secret|last_assistant_message|agent_transcript_path|cwd|"prompt"|tool_input/);
});

test('SubagentStop on a lagging transcript records what is there and says it is incomplete', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines.slice(0, 5));
  const { record } = await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });
  assert.equal(record.transcriptComplete, false);
  assert.equal(record.apiRequests, 1);
  assert.deepEqual(record.runUsage, { input_tokens: 2, output_tokens: 300, cache_creation_input_tokens: 100, cache_read_input_tokens: 0 });
});

test('SubagentStop with a missing transcript still records the run, with null usage', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const { record } = await recordSubagentStop(stopInput(path.join(dataRoot, 'nowhere.jsonl')), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });
  assert.equal(record.runUsage, null);
  assert.equal(record.durationMs, null);
  assert.equal(record.transcriptComplete, false);
  assert.deepEqual(record.models, []);
  assert.equal((await runsOf(dataRoot)).length, 1);
  const noPath = await recordSubagentStop(stopInput(undefined, { agent_id: 'agent-y' }), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });
  assert.equal(noPath.record.runUsage, null);
});

test('SubagentStop with no agent type and no transcript is skipped and creates no file', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const internal = stopInput(path.join(dataRoot, 'never-written.jsonl'), { agent_id: 'agent-internal', agent_type: '', last_assistant_message: 'Recap of the session' });
  assert.equal(await recordSubagentStop(internal, { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }), null);
  assert.equal(existsSync(path.join(dataRoot, 'telemetry')), false);
  const { agent_type: _omitted, ...noTypeField } = internal;
  assert.equal(await recordSubagentStop(noTypeField, { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }), null);
  assert.equal(existsSync(path.join(dataRoot, 'telemetry')), false);
});

test('SubagentStop with no agent type but a readable transcript is still recorded', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  const { record } = await recordSubagentStop(stopInput(transcript, { agent_type: '' }), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });
  assert.equal(record.agentType, '');
  assert.deepEqual(record.models, ['claude-a', 'claude-b']);
  assert.deepEqual(record.runUsage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
  assert.equal(record.transcriptComplete, true);
  assert.equal((await runsOf(dataRoot)).length, 1);
});

// The six race orders of B-037, one fixture each. Every fixture asserts the file's rows in order
// and that exactly one row carries `runUsage`: the file is append-only, a fallback row may stay
// beside the whole-run row that superseded it, and the reader keeps one record per agentId.
const postToolUse = {
  session_id: 'session-1', tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose', prompt: 'secret prompt' },
  tool_response: { status: 'completed', agentId: 'agent-x', totalDurationMs: 42, usage: { input_tokens: 4, output_tokens: 50 } }
};
const rowsOf = async dataRoot => (await runsOf(dataRoot)).map(l => JSON.parse(l));
const wholeRunRows = rows => rows.filter(r => r.runUsage && typeof r.runUsage === 'object');

test('race: PostToolUse first', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  assert.notEqual(await recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  const stop = await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });
  assert.notEqual(stop, null, 'the whole-run row supersedes the fallback instead of being skipped');
  const rows = await rowsOf(dataRoot);
  assert.deepEqual(rows.map(r => r.source), ['PostToolUse', 'SubagentStop']);
  assert.equal(wholeRunRows(rows).length, 1);
  assert.deepEqual(rows[1].runUsage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
});

test('race: SubagentStop first', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  assert.notEqual(await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }), null);
  assert.equal(await recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  const rows = await rowsOf(dataRoot);
  assert.deepEqual(rows.map(r => r.source), ['SubagentStop']);
  assert.equal(wholeRunRows(rows).length, 1);
});

test('race: concurrent', async () => {
  // The live probe's failure mode: both handlers pass the file scan before either has written.
  // Whichever takes the claim first, the whole-run row lands — the other waits for the claim.
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  const [stop] = await Promise.all([
    recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }),
    recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: dataRoot })
  ]);
  assert.notEqual(stop, null);
  const rows = await rowsOf(dataRoot);
  assert.equal(rows.filter(r => r.source === 'SubagentStop').length, 1);
  assert.ok(rows.filter(r => r.source === 'PostToolUse').length <= 1);
  assert.equal(rows.length, rows.filter(r => r.source === 'SubagentStop' || r.source === 'PostToolUse').length);
  assert.equal(wholeRunRows(rows).length, 1);
  assert.equal(rows.at(-1).source, 'SubagentStop', 'a fallback row, when present, precedes the row that supersedes it');
});

test('race: fallback only', async () => {
  // A harness that hands over no transcript fires PostToolUse only: one fallback row, and a repeat
  // of the same completion for the same agentId still leaves one line.
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  assert.notEqual(await recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.equal(await recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  const rows = await rowsOf(dataRoot);
  assert.deepEqual(rows.map(r => r.source), ['PostToolUse']);
  assert.equal(wholeRunRows(rows).length, 0);
  assert.equal(rows[0].finalRequestUsage.output_tokens, 50);
});

test('race: label before completion', async () => {
  // A backgrounded spawn: PostToolUse fires at launch with the agentId but no `completed` and writes
  // the label only; SubagentStop records; the completed PostToolUse that follows is skipped.
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  const labelled = { ...postToolUse, tool_input: { ...postToolUse.tool_input, description: 'esq:build phase 2' } };
  assert.equal(await recordAgentTelemetry({ ...labelled, tool_response: { status: 'async_launched', agentId: 'agent-x' } }, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.deepEqual((await rowsOf(dataRoot)).map(r => r.source), ['AgentLabel']);
  assert.notEqual(await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }), null);
  assert.equal(await recordAgentTelemetry(labelled, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  const rows = await rowsOf(dataRoot);
  assert.ok(rows.length <= 3);
  assert.deepEqual(rows.filter(r => r.source !== 'AgentLabel').map(r => r.source), ['SubagentStop'], 'one record');
  assert.equal(wholeRunRows(rows).length, 1);
  assert.equal(rows[0].esqCommand, 'build');
});

test('race: completion after fallback', async () => {
  // agent-x: the fallback row exists, then a SubagentStop whose transcript is missing arrives —
  // runUsage would be null, so it carries nothing more and does not supersede. agent-y: the same
  // fallback, then a SubagentStop with a readable transcript — it does.
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  assert.notEqual(await recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.equal(await recordSubagentStop(stopInput(path.join(dataRoot, 'nowhere.jsonl')), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }), null);
  assert.deepEqual((await rowsOf(dataRoot)).map(r => r.source), ['PostToolUse'], 'a transcript-less stop never supersedes a fallback');

  const forY = { ...postToolUse, tool_response: { ...postToolUse.tool_response, agentId: 'agent-y' } };
  assert.notEqual(await recordAgentTelemetry(forY, { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.notEqual(await recordSubagentStop(stopInput(transcript, { agent_id: 'agent-y' }), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }), null);
  const rows = await rowsOf(dataRoot);
  assert.deepEqual(rows.map(r => [r.source, r.agentId]), [['PostToolUse', 'agent-x'], ['PostToolUse', 'agent-y'], ['SubagentStop', 'agent-y']]);
  assert.equal(wholeRunRows(rows).length, 1);
  assert.equal(wholeRunRows(rows)[0].agentId, 'agent-y');
});

test('a whole-run writer waits a bounded time for a held claim; a fallback writer never waits', async () => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);
  await recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: dataRoot });
  const claim = path.join(dataRoot, 'telemetry', '.claim-agent-x');
  // Released inside the budget (5 x 20 ms): the whole-run row lands once the holder lets go.
  await writeFile(claim, '');
  setTimeout(() => unlink(claim), 30);
  assert.notEqual(await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 }), null);
  assert.deepEqual((await rowsOf(dataRoot)).map(r => r.source), ['PostToolUse', 'SubagentStop']);
  // Held past the budget: the writer gives up, exactly as the pre-retry claim did; nothing is written.
  const held = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  await mkdir(path.join(held, 'telemetry'));
  await writeFile(path.join(held, 'telemetry', '.claim-agent-x'), '');
  const before = Date.now();
  assert.equal(await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: held }, { lagWaitMs: 0 }), null);
  assert.ok(Date.now() - before < 1000, 'the wait is bounded');
  assert.equal(existsSync(path.join(held, 'telemetry', 'agent-runs.jsonl')), false);
  // A fallback writer finds the claim held and skips at once.
  assert.equal(await recordAgentTelemetry(postToolUse, { CLAUDE_PLUGIN_DATA: held }), null);
});

test('telemetry opt-out: ESQ_TELEMETRY off-values and DO_NOT_TRACK on-values silence both writers', async () => {
  for (const env of [{ ESQ_TELEMETRY: '0' }, { ESQ_TELEMETRY: 'off' }, { ESQ_TELEMETRY: 'FALSE' }, { ESQ_TELEMETRY: ' no ' },
    { DO_NOT_TRACK: '1' }, { DO_NOT_TRACK: 'yes' }, { DO_NOT_TRACK: 'On' }]) {
    assert.equal(telemetryOptedOut(env), true, JSON.stringify(env));
    const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
    const environment = { CLAUDE_PLUGIN_DATA: dataRoot, ...env };
    const transcript = await writeTranscript(transcriptLines);
    assert.equal(await recordSubagentStop(stopInput(transcript), environment, { lagWaitMs: 0 }), null);
    assert.equal(await recordAgentTelemetry({
      session_id: 'session-1', tool_name: 'Agent',
      tool_input: { subagent_type: 'general-purpose', description: 'esq:check the plan' },
      tool_response: { status: 'completed', agentId: 'agent-x', totalDurationMs: 42, usage: { input_tokens: 4, output_tokens: 50 } }
    }, environment), null);
    assert.equal(existsSync(path.join(dataRoot, 'telemetry')), false, JSON.stringify(env));
  }
  // Any other value — empty, "1", an unrelated word — leaves telemetry on; DO_NOT_TRACK=0 does too.
  for (const env of [{}, { ESQ_TELEMETRY: '' }, { ESQ_TELEMETRY: '1' }, { ESQ_TELEMETRY: 'maybe' }, { DO_NOT_TRACK: '0' }, { DO_NOT_TRACK: '' }]) {
    assert.equal(telemetryOptedOut(env), false, JSON.stringify(env));
    const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
    const transcript = await writeTranscript(transcriptLines);
    const written = await recordSubagentStop(stopInput(transcript), { CLAUDE_PLUGIN_DATA: dataRoot, ...env }, { lagWaitMs: 0 });
    assert.equal(written?.record?.source, 'SubagentStop', JSON.stringify(env));
  }
  assert.equal(telemetryOptedOut(undefined), false);
});

test('the transcript reducer resumes from a carried state without double-counting a request split across calls', () => {
  const oneCall = initialTranscriptState();
  for (const raw of transcriptLines) reduceTranscriptLine(oneCall, raw);
  const whole = finalizeTranscript(oneCall);
  assert.equal(whole.apiRequests, 2);
  assert.equal(whole.toolUseCount, 2);
  assert.deepEqual(whole.usage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
  assert.equal(whole.firstMs, T0);
  assert.equal(whole.lastMs, T0 + 3500);

  // Lines 1–3 then 4–6 (1-based): msg_1's three lines straddle the boundary, and the carried state
  // must replace its usage rather than add it. The state round-trips through JSON like a sidecar.
  const carried = initialTranscriptState();
  for (const raw of transcriptLines.slice(0, 3)) reduceTranscriptLine(carried, raw);
  const midway = finalizeTranscript(carried);
  assert.equal(midway.apiRequests, 1);
  assert.equal(midway.toolUseCount, 1);
  assert.equal(midway.usage.output_tokens, 1);
  const resumed = JSON.parse(JSON.stringify(carried));
  for (const raw of transcriptLines.slice(3)) reduceTranscriptLine(resumed, raw);
  assert.deepEqual(finalizeTranscript(resumed), whole);
  // The open request's lines arrive again through the carried state: still one request, usage replaced.
  reduceTranscriptLine(resumed, transcriptLines[transcriptLines.length - 1]);
  assert.deepEqual(finalizeTranscript(resumed), whole);

  // readText: false keeps no assistant text at all; the default keeps the last for the stop comparison.
  assert.equal(whole.lastAssistantText, 'the final answer');
  const blind = initialTranscriptState();
  for (const raw of transcriptLines) reduceTranscriptLine(blind, raw, { readText: false });
  assert.equal(finalizeTranscript(blind).lastAssistantText, null);
  assert.doesNotMatch(JSON.stringify(blind), /secret|final answer|partial/);
  assert.deepEqual(finalizeTranscript(blind).usage, whole.usage);
});

// ---- session writer (direct path): main-session transcripts the way the harness writes them ----
// User lines carry the typed-command marker as *string* content; tool results are array content;
// assistant lines are one content block per line sharing message.id; every text field holds a
// `secret …` string the writer must never keep.
import { recordSessionTelemetry } from '../../plugin/scripts/record-session-telemetry.mjs';

const sLine = (type, timestamp, message, extra = {}) => JSON.stringify({ type, timestamp, sessionId: 'main-1', ...extra, message });
const typedMarker = (ms, name, args = '') =>
  sLine('user', at(ms), { role: 'user', content: `<command-message>${name.slice(1)}</command-message>\n<command-name>${name}</command-name>${args ? `\n<command-args>${args}</command-args>` : ''}` });
const userPrompt = (ms, text) => sLine('user', at(ms), { role: 'user', content: text });
const toolResult = (ms, text) => sLine('user', at(ms), { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: text }] });
const assistant = (ms, id, model, blocks, u) => sLine('assistant', at(ms), { id, model, content: blocks, usage: u });
const textBlock = text => ({ type: 'text', text });
const thinkBlock = thinking => ({ type: 'thinking', thinking });
const toolBlock = (name, input) => ({ type: 'tool_use', id: 't1', name, input });

// A session: prompt, then /esq:status (two requests, one split over three lines), a tool result
// that quotes a marker, then /esq:plan through the Skill tool, then a typed /clear.
const sessionLines = [
  userPrompt(0, 'secret prompt before any command'),
  assistant(500, 'req_0', 'claude-a', [textBlock('secret answer before any command')], usage(1, 10, 0, 0)),
  typedMarker(1000, '/esq:status', 'secret command-args'),
  assistant(2000, 'req_1', 'claude-a', [thinkBlock('secret thought')], usage(2, 1, 100, 0)),
  assistant(2100, 'req_1', 'claude-a', [toolBlock('Read', { file_path: 'secret tool input' })], usage(2, 1, 100, 0)),
  assistant(2200, 'req_1', 'claude-a', [toolBlock('Grep', {})], usage(2, 300, 100, 0)),
  toolResult(2500, 'secret result that quotes <command-name>/esq:advance</command-name> in a tool result'),
  assistant(3000, 'req_2', 'claude-b', [textBlock('secret status report')], usage(4, 50, 0, 100)),
  assistant(4000, 'req_3', 'claude-b', [toolBlock('Skill', { skill: 'esq:plan', args: 'secret skill args' })], usage(8, 20, 0, 200)),
  toolResult(4500, 'secret plan skill body'),
  assistant(5000, 'req_4', 'claude-b', [toolBlock('Skill', { skill: 'plugin-runtime' })], usage(16, 40, 0, 400)),
  assistant(6000, 'req_5', 'claude-b', [textBlock('secret plan written')], usage(32, 80, 0, 800)),
  typedMarker(7000, '/clear'),
  assistant(7500, 'req_6', 'claude-b', [textBlock('secret after clear')], usage(64, 160, 0, 0))
];
async function writeSession(lines, { trailingNewline = true } = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'esq-session-'));
  const file = path.join(dir, 'main-1.jsonl');
  await writeFile(file, lines.join('\n') + (trailingNewline ? '\n' : ''));
  return file;
}
const sessionStop = (transcriptPath, extra = {}) => ({
  hook_event_name: 'Stop', session_id: 'main-1', transcript_path: transcriptPath, stop_hook_active: false,
  last_assistant_message: 'secret last assistant message', cwd: '/work/app', ...extra
});
const sessionRowsOf = async dataRoot => (await readFile(path.join(dataRoot, 'telemetry/session-runs.jsonl'), 'utf8')).trim().split('\n').map(l => JSON.parse(l));
// Production shape, and the fixtures below depend on it: the harness hands a hook a *per-plugin*
// `CLAUDE_PLUGIN_DATA` (`…/plugins/data/esq-inline`), and the session's declaration log lives in the
// sibling `esq-attribution/` one level up. A flat temporary directory would put that sibling in the
// shared system temp root, so every session fixture nests its data root the way the harness does and
// nothing this writer touches — rows, sidecar, claim or declaration log — leaves the fixture.
async function sessionData() {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const dataRoot = path.join(fixture, 'esq-inline');
  await mkdir(dataRoot, { recursive: true });
  return dataRoot;
}

const sidecarOf = dataRoot => path.join(dataRoot, 'telemetry/.cursor-main-1.json');
const FORBIDDEN = /secret|command-args|tool_input|"prompt"|transcript_path|cwd|last_assistant_message|"content"|"text"/;

test('session writer: a typed /esq:status opens a segment summed over its own requests only', async () => {
  const dataRoot = await sessionData();
  const transcript = await writeSession(sessionLines.slice(0, 8));
  const result = await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot });
  assert.equal(result.records.length, 1);
  const [row] = await sessionRowsOf(dataRoot);
  assert.equal(row.source, 'SessionStop');
  assert.equal(row.sessionId, 'main-1');
  assert.equal(row.segment, 0);
  assert.equal(row.esqCommand, 'status');
  assert.equal(row.via, 'typed');
  assert.equal(row.closedBy, null);
  assert.equal(row.startedAt, at(1000));
  assert.equal(row.lastAt, at(3000));
  assert.equal(row.durationMs, 2000);
  assert.deepEqual(row.models, ['claude-a', 'claude-b']);
  assert.equal(row.apiRequests, 2);
  assert.equal(row.toolUseCount, 2);
  // req_0 (before the marker) is not summed; req_1 counts its last line's usage once.
  assert.deepEqual(row.runUsage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
  assert.equal('agentId' in row, false);
  assert.equal('agentType' in row, false);
});

test('session writer: a top-level Skill esq:<cmd> tool_use opens a segment that includes the opening request', async () => {
  const dataRoot = await sessionData();
  const transcript = await writeSession([
    userPrompt(0, 'secret prompt'),
    assistant(500, 'req_0', 'claude-a', [textBlock('secret')], usage(1, 10, 0, 0)),
    assistant(1000, 'req_1', 'claude-a', [toolBlock('Skill', { skill: 'esq:arch' })], usage(2, 20, 0, 0)),
    toolResult(1500, 'secret skill body'),
    assistant(2000, 'req_2', 'claude-a', [textBlock('secret arch')], usage(4, 40, 0, 0))
  ]);
  await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot });
  const [row] = await sessionRowsOf(dataRoot);
  assert.equal(row.esqCommand, 'arch');
  assert.equal(row.via, 'skill-tool');
  assert.equal(row.startedAt, at(1000));
  assert.equal(row.apiRequests, 2);
  assert.equal(row.toolUseCount, 1);
  assert.deepEqual(row.runUsage, { input_tokens: 6, output_tokens: 60, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 });
});

test('session writer: two esq commands in one session are two segments, the first closed by the second, a /clear closes the last', async () => {
  const dataRoot = await sessionData();
  const transcript = await writeSession(sessionLines);
  const result = await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot });
  assert.equal(result.records.length, 2);
  const rows = await sessionRowsOf(dataRoot);
  assert.deepEqual(rows.map(r => [r.segment, r.esqCommand, r.via, r.closedBy]),
    [[0, 'status', 'typed', 'command'], [1, 'plan', 'skill-tool', 'command']]);
  // Usage splits at the second marker: status keeps req_1 + req_2; plan gets req_3 (its opener),
  // req_4 (a non-esq Skill is the command's own work, not a marker) and req_5, and stops at /clear.
  assert.deepEqual(rows[0].runUsage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
  assert.deepEqual(rows[1].runUsage, { input_tokens: 56, output_tokens: 140, cache_creation_input_tokens: 0, cache_read_input_tokens: 1400 });
  assert.equal(rows[1].apiRequests, 3);
  assert.equal(rows[1].toolUseCount, 2);
  assert.equal(rows[1].startedAt, at(4000));
  assert.equal(rows[1].lastAt, at(6000));
  assert.equal(rows[1].durationMs, 2000);
  // Nothing is open after /clear: a second Stop over the same file writes nothing new.
  assert.equal(await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.equal((await sessionRowsOf(dataRoot)).length, 2);
});

test('session writer: a session opened by /clear and a plain prompt writes no file; a sidechain marker is ignored', async () => {
  const dataRoot = await sessionData();
  const transcript = await writeSession([
    typedMarker(0, '/clear'),
    userPrompt(1000, 'secret ordinary prompt'),
    assistant(2000, 'req_0', 'claude-a', [textBlock('secret answer')], usage(1, 10, 0, 0)),
    sLine('user', at(3000), { role: 'user', content: '<command-name>/esq:status</command-name>' }, { isSidechain: true }),
    assistant(4000, 'req_1', 'claude-a', [textBlock('secret')], usage(1, 10, 0, 0))
  ]);
  assert.equal(await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.equal(existsSync(path.join(dataRoot, 'telemetry/session-runs.jsonl')), false);
  // The cursor still advances — the next Stop reads only what is appended.
  const cursor = JSON.parse(await readFile(sidecarOf(dataRoot), 'utf8'));
  assert.equal(cursor.open, null);
  assert.equal(cursor.nextSegment, 0);
  assert.ok(cursor.offset > 0);
});

test('session writer: malformed esq slugs open nothing', async () => {
  for (const name of ['/esq:Status', '/esq:', '/esq:build_phase', '/esq:-build', '/esq:status extra']) {
    const dataRoot = await sessionData();
    const transcript = await writeSession([
      typedMarker(0, name),
      assistant(1000, 'req_0', 'claude-a', [textBlock('secret')], usage(1, 10, 0, 0))
    ]);
    assert.equal(await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }), null, name);
    assert.equal(existsSync(path.join(dataRoot, 'telemetry/session-runs.jsonl')), false, name);
  }
  // And a Skill tool_use with a malformed slug, or a non-esq skill, opens nothing either.
  for (const skill of ['esq:Build', 'esq:', 'plugin-runtime', 'esq:build phase 2']) {
    const dataRoot = await sessionData();
    const transcript = await writeSession([
      assistant(1000, 'req_0', 'claude-a', [toolBlock('Skill', { skill })], usage(1, 10, 0, 0))
    ]);
    assert.equal(await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot }), null, skill);
    assert.equal(existsSync(path.join(dataRoot, 'telemetry/session-runs.jsonl')), false, skill);
  }
});

test('session writer: the bound — a second Stop reads only the appended bytes, a partial tail waits, a straddling request counts once', async () => {
  const dataRoot = await sessionData();
  const env = { CLAUDE_PLUGIN_DATA: dataRoot };
  // First Stop: lines 0–4 complete (through req_1's second line), line 5 (req_1's third) partial.
  const head = sessionLines.slice(0, 5);
  const partial = sessionLines[5].slice(0, 40);
  const transcript = await writeSession([...head, partial], { trailingNewline: false });
  await recordSessionTelemetry(sessionStop(transcript), env);
  const headBytes = Buffer.byteLength(`${head.join('\n')}\n`);
  let cursor = JSON.parse(await readFile(sidecarOf(dataRoot), 'utf8'));
  assert.equal(cursor.offset, headBytes, 'the partial line is not consumed');
  assert.equal(cursor.nextSegment, 1);
  assert.equal(cursor.open.esqCommand, 'status');
  let rows = await sessionRowsOf(dataRoot);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].apiRequests, 1);
  assert.equal(rows[0].runUsage.output_tokens, 1);
  assert.equal(rows[0].toolUseCount, 1);

  // The harness completes the partial line and appends the rest of the session. Before the second
  // Stop, make the already-read head unreadable-if-reread: overwrite the bytes below the offset
  // with a marker-bearing line of the same length — a writer that re-read from zero would see it.
  const all = sessionLines.join('\n') + '\n';
  await writeFile(transcript, all);
  const fd = await (await import('node:fs/promises')).open(transcript, 'r+');
  const poison = Buffer.alloc(headBytes, 0x20);
  const fake = Buffer.from(`${typedMarker(0, '/esq:review')}\n`);
  fake.copy(poison, 0, 0, Math.min(fake.length, headBytes));
  if (headBytes > fake.length) poison.write('\n', headBytes - 1);
  await fd.write(poison, 0, headBytes, 0);
  await fd.close();

  await recordSessionTelemetry(sessionStop(transcript), env);
  cursor = JSON.parse(await readFile(sidecarOf(dataRoot), 'utf8'));
  assert.equal(cursor.offset, Buffer.byteLength(all));
  assert.equal(cursor.open, null, '/clear closed the last segment');
  rows = await sessionRowsOf(dataRoot);
  assert.equal(rows.length, 3);
  // Cumulative: the status row now carries req_1 (counted once across the two Stops) and req_2.
  const status = rows.filter(r => r.esqCommand === 'status');
  assert.equal(status.length, 2);
  assert.equal(status[1].closedBy, 'command');
  assert.equal(status[1].apiRequests, 2);
  assert.equal(status[1].toolUseCount, 2);
  assert.deepEqual(status[1].runUsage, { input_tokens: 6, output_tokens: 350, cache_creation_input_tokens: 100, cache_read_input_tokens: 100 });
  assert.equal(rows.some(r => r.esqCommand === 'review'), false, 'bytes below the cursor were not re-read');
  assert.equal(rows[2].esqCommand, 'plan');
});

test('session writer: SessionEnd closes the open segment, writes its final row and removes the sidecar', async () => {
  const dataRoot = await sessionData();
  const env = { CLAUDE_PLUGIN_DATA: dataRoot };
  const transcript = await writeSession(sessionLines.slice(0, 8));
  await recordSessionTelemetry(sessionStop(transcript), env);
  assert.equal(existsSync(sidecarOf(dataRoot)), true);
  const ended = await recordSessionTelemetry(sessionStop(transcript, { hook_event_name: 'SessionEnd', reason: 'exit' }), env);
  assert.equal(ended.records.length, 1);
  const rows = await sessionRowsOf(dataRoot);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].source, 'SessionEnd');
  assert.equal(rows[1].closedBy, 'session-end');
  assert.equal(rows[1].segment, 0);
  assert.deepEqual(rows[1].runUsage, rows[0].runUsage);
  assert.equal(existsSync(sidecarOf(dataRoot)), false);
  // A SessionEnd after the sidecar is gone (a resumed session) re-reads from zero and re-derives
  // the same (sessionId, segment) row — idempotent for a reader that keeps the last — and leaves no sidecar.
  const again = await recordSessionTelemetry(sessionStop(transcript, { hook_event_name: 'SessionEnd' }), env);
  assert.equal(again.records.length, 1);
  assert.equal(again.records[0].segment, 0);
  assert.deepEqual(again.records[0].runUsage, rows[1].runUsage);
  assert.equal(existsSync(sidecarOf(dataRoot)), false);
  // SessionEnd with nothing open at all: no row, no sidecar.
  const empty = await sessionData();
  const plain = await writeSession([userPrompt(0, 'secret'), assistant(500, 'req_0', 'claude-a', [textBlock('secret')], usage(1, 1, 0, 0))]);
  assert.equal(await recordSessionTelemetry(sessionStop(plain, { hook_event_name: 'SessionEnd' }), { CLAUDE_PLUGIN_DATA: empty }), null);
  assert.equal(existsSync(path.join(empty, 'telemetry/session-runs.jsonl')), false);
  assert.equal(existsSync(path.join(empty, 'telemetry/.cursor-main-1.json')), false);
});

test('session writer: a live claim skips the run and leaves the sidecar; a stale claim is taken over', async () => {
  const dataRoot = await sessionData();
  const env = { CLAUDE_PLUGIN_DATA: dataRoot };
  const transcript = await writeSession(sessionLines.slice(0, 5));
  await recordSessionTelemetry(sessionStop(transcript), env);
  const before = await readFile(sidecarOf(dataRoot), 'utf8');
  await writeFile(transcript, `${sessionLines.slice(0, 8).join('\n')}\n`);
  const claim = path.join(dataRoot, 'telemetry/.claim-session-main-1');
  await writeFile(claim, '');
  assert.equal(await recordSessionTelemetry(sessionStop(transcript), env), null);
  assert.equal(await readFile(sidecarOf(dataRoot), 'utf8'), before);
  assert.equal((await sessionRowsOf(dataRoot)).length, 1);
  assert.equal(existsSync(claim), true, 'a live claim is not the skipper\'s to remove');
  // Older than 30 s by mtime: left by a crash, taken over.
  const { utimes } = await import('node:fs/promises');
  const old = new Date(Date.now() - 60_000);
  await utimes(claim, old, old);
  const result = await recordSessionTelemetry(sessionStop(transcript), env);
  assert.equal(result.records.length, 1);
  assert.equal((await sessionRowsOf(dataRoot)).length, 2);
  assert.equal(existsSync(claim), false);
});

test('session writer: SessionEnd waits for a live claim the async Stop still holds, then closes the segment and removes the sidecar', async () => {
  const dataRoot = await sessionData();
  const env = { CLAUDE_PLUGIN_DATA: dataRoot };
  const transcript = await writeSession(sessionLines.slice(0, 8));
  await recordSessionTelemetry(sessionStop(transcript), env);
  const claim = path.join(dataRoot, 'telemetry/.claim-session-main-1');
  await writeFile(claim, '');
  const { unlink } = await import('node:fs/promises');
  const { setTimeout: sleep } = await import('node:timers/promises');
  const started = Date.now();
  const release = sleep(300).then(() => unlink(claim));
  const ended = await recordSessionTelemetry(sessionStop(transcript, { hook_event_name: 'SessionEnd', reason: 'exit' }), env);
  await release;
  assert.ok(Date.now() - started >= 300, 'SessionEnd waited for the claim instead of giving up');
  assert.equal(ended.records.length, 1);
  const rows = await sessionRowsOf(dataRoot);
  assert.equal(rows.at(-1).source, 'SessionEnd');
  assert.equal(rows.at(-1).closedBy, 'session-end');
  assert.equal(existsSync(sidecarOf(dataRoot)), false);
  assert.equal(existsSync(claim), false);
});

test('session writer: opted out, or no transcript, writes no row and no sidecar', async () => {
  const transcript = await writeSession(sessionLines);
  for (const env of [{ ESQ_TELEMETRY: '0' }, { DO_NOT_TRACK: '1' }]) {
    const dataRoot = await sessionData();
    assert.equal(await recordSessionTelemetry(sessionStop(transcript), { CLAUDE_PLUGIN_DATA: dataRoot, ...env }), null);
    assert.equal(existsSync(path.join(dataRoot, 'telemetry')), false, JSON.stringify(env));
  }
  const dataRoot = await sessionData();
  assert.equal(await recordSessionTelemetry(sessionStop(path.join(dataRoot, 'nowhere.jsonl')), { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.equal(await recordSessionTelemetry(sessionStop(undefined), { CLAUDE_PLUGIN_DATA: dataRoot }), null);
  assert.equal(await recordSessionTelemetry(sessionStop(transcript), {}), null);
  assert.equal(existsSync(path.join(dataRoot, 'telemetry')), false);
});

test('session writer: neither the rows nor the sidecar carry any text — prompt, args, tool input, reasoning, answer', async () => {
  const dataRoot = await sessionData();
  const env = { CLAUDE_PLUGIN_DATA: dataRoot };
  const transcript = await writeSession(sessionLines.slice(0, 11));
  await recordSessionTelemetry(sessionStop(transcript), env);
  const rows = await readFile(path.join(dataRoot, 'telemetry/session-runs.jsonl'), 'utf8');
  const sidecar = await readFile(sidecarOf(dataRoot), 'utf8');
  assert.doesNotMatch(rows, FORBIDDEN);
  assert.doesNotMatch(sidecar, FORBIDDEN);
  assert.doesNotMatch(sidecar, /advance|review|plugin-runtime/);
  const { mode } = await (await import('node:fs/promises')).stat(path.join(dataRoot, 'telemetry/session-runs.jsonl'));
  assert.equal(mode & 0o777, 0o600);
  assert.equal(((await (await import('node:fs/promises')).stat(sidecarOf(dataRoot))).mode) & 0o777, 0o600);
});

test('session writer: the Stop entrypoint reads the harness payload from stdin, prints nothing, writes the row', async () => {
  const scripts = path.join(fileURLToPath(new URL('.', import.meta.url)), '../../plugin/scripts');
  const dataRoot = await sessionData();
  const transcript = await writeSession(sessionLines.slice(0, 8));
  const run = payload => spawnSync(process.execPath, [path.join(scripts, 'record-session-telemetry.mjs')], {
    input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, CLAUDE_PLUGIN_DATA: dataRoot }
  });
  const stopped = run(sessionStop(transcript));
  assert.equal(stopped.status, 0, stopped.stderr);
  assert.equal(stopped.stdout, '');
  const rows = await sessionRowsOf(dataRoot);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].esqCommand, 'status');
  assert.equal(rows[0].source, 'SessionStop');
  const ended = run(sessionStop(transcript, { hook_event_name: 'SessionEnd', reason: 'exit' }));
  assert.equal(ended.status, 0, ended.stderr);
  assert.equal(ended.stdout, '');
  assert.equal((await sessionRowsOf(dataRoot)).at(-1).closedBy, 'session-end');
  assert.equal(existsSync(sidecarOf(dataRoot)), false);
  assert.doesNotMatch(await readFile(path.join(dataRoot, 'telemetry/session-runs.jsonl'), 'utf8'), FORBIDDEN);
});

// ---------------------------------------------------------------------------
// The two shared derivations (B-121): a session id that has to name a file
// without escaping the directory it names, and a repository key that has to say
// "same repository" for a worktree and "different" for a second clone.
// ---------------------------------------------------------------------------

test('the derivations are one definition: plugin/lib re-exports them rather than restating them', async () => {
  const lib = await import('../../plugin/lib/telemetry.mjs');
  assert.equal(lib.sessionKey, sessionKey);
  assert.equal(lib.repoKey, repoKey);
});

test('a session id is hashed into a fixed-length key and never interpolated into a path', async () => {
  const attribution = await mkdtemp(path.join(os.tmpdir(), 'esq-attr-'));
  const hostile = ['../../x', '/etc/x', 'a/b', 'a\\b', '..', './.', 'x'.repeat(10_000), '', 'a b', 'a-b', 'a_b'];
  for (const id of hostile) {
    const key = sessionKey(id);
    assert.equal(key === null || /^[0-9a-f]{32}$/.test(key), true, JSON.stringify(id.slice(0, 20)));
    if (key !== null) assert.equal(path.join(attribution, `${key}.jsonl`).startsWith(`${attribution}${path.sep}`), true, id.slice(0, 20));
  }
  // Empty, oversized and non-string ids produce no key at all — and so, in Phase 2, no log.
  assert.equal(sessionKey(''), null);
  assert.equal(sessionKey('x'.repeat(513)), null);
  for (const id of [null, undefined, 42, {}, ['a'], true]) assert.equal(sessionKey(id), null, String(id));

  // Ids that `safeId`'s character folding would collide — `a/b`, `a b` and `a\b` all fold to `a_b` —
  // stay distinct here, and the derivation is pure: nothing was written anywhere.
  const folded = new Set(['a/b', 'a b', 'a\\b', 'a_b'].map(sessionKey));
  assert.equal(folded.size, 4);
  assert.deepEqual(await readdir(attribution), []);
});

// A main checkout, a linked worktree (absolute and relative `gitdir:`), a submodule and a second
// clone, built as directories rather than by running git: the derivation reads `.git` and nothing else.
async function repoFixtures() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-repo-'));
  const main = path.join(root, 'main');
  await mkdir(path.join(main, '.git', 'worktrees', 'wt'), { recursive: true });
  await mkdir(path.join(main, '.git', 'modules', 'sub'), { recursive: true });
  await mkdir(path.join(main, 'src', 'deep'), { recursive: true });

  const worktree = path.join(root, 'wt');
  await mkdir(worktree, { recursive: true });
  await writeFile(path.join(worktree, '.git'), `gitdir: ${path.join(main, '.git', 'worktrees', 'wt')}\n`);

  const relative = path.join(root, 'wt-relative');
  await mkdir(relative, { recursive: true });
  await writeFile(path.join(relative, '.git'), 'gitdir: ../main/.git/worktrees/wt\n');

  const submodule = path.join(main, 'sub');
  await mkdir(submodule, { recursive: true });
  await writeFile(path.join(submodule, '.git'), 'gitdir: ../.git/modules/sub\n');

  const other = path.join(root, 'other');
  await mkdir(path.join(other, '.git'), { recursive: true });

  const plain = path.join(root, 'plain');
  await mkdir(plain, { recursive: true });
  return { root, main, worktree, relative, submodule, other, plain };
}

test('a repository key is the canonical common directory: a worktree keys as its checkout, a second clone does not', async () => {
  const fx = await repoFixtures();
  const mainKey = repoKey(fx.main);
  assert.match(mainKey, /^[0-9a-f]{32}$/);

  // A linked worktree is the same repository — `scripts/worktree.sh` is a supported path here, and
  // keying it apart would read every worktree run as `foreignRepo`.
  assert.equal(repoKey(fx.worktree), mainKey, 'absolute gitdir');
  assert.equal(repoKey(fx.relative), mainKey, 'relative gitdir');
  // The walk finds the checkout from any depth inside it.
  assert.equal(repoKey(path.join(fx.main, 'src', 'deep')), mainKey);

  // A submodule's gitdir carries no `/worktrees/<name>` segment and is kept as it is: its own key.
  const subKey = repoKey(fx.submodule);
  assert.match(subKey, /^[0-9a-f]{32}$/);
  assert.notEqual(subKey, mainKey);

  // Two separate clones are two working histories on this machine.
  assert.notEqual(repoKey(fx.other), mainKey);

  // Nothing that could be a repository keys null — read as `unscopedRepo`, never as local and never
  // as foreign. The filesystem root is the stable case: the temporary directory these fixtures live
  // in is shared with every other suite on the machine, so its own ancestry is not ours to assert on.
  assert.equal(repoKey(path.parse(fx.root).root), null);
  for (const value of [null, undefined, '', 42]) assert.equal(repoKey(value), null, String(value));

  // A directory with no `.git` of its own is never attributed to the checkout beside it: it keys as
  // whatever encloses it, which here is the fixture root, and that is not `main`.
  assert.equal(repoKey(fx.plain), repoKey(fx.root));
  assert.notEqual(repoKey(fx.plain), mainKey);
});

test('every agent row carries its repository, and a labelled spawn also names the plan it works on', async () => {
  const fx = await repoFixtures();
  const expected = repoKey(fx.main);
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  const transcript = await writeTranscript(transcriptLines);

  await recordAgentTelemetry({
    session_id: 'session-1', cwd: fx.main, tool_name: 'Agent',
    tool_input: { subagent_type: 'general-purpose', description: 'esq:build plan:outcome-attribution-coverage', prompt: 'secret prompt', model: 'opus' },
    tool_response: { status: 'completed', agentId: 'agent-scope', content: [{ type: 'text', text: 'secret result' }], resolvedModel: 'claude-opus-5', modelsUsed: ['claude-opus-5'], totalDurationMs: 7, totalToolUseCount: 3, totalTokens: 12, usage: { input_tokens: 10, output_tokens: 2 } }
  }, { CLAUDE_PLUGIN_DATA: dataRoot });
  await recordSubagentStop({
    session_id: 'session-1', cwd: fx.main, agent_id: 'agent-stop', agent_type: 'general-purpose',
    agent_transcript_path: transcript, last_assistant_message: 'final answer'
  }, { CLAUDE_PLUGIN_DATA: dataRoot }, { lagWaitMs: 0 });

  const rows = await rowsOf(dataRoot);
  assert.deepEqual(rows.map(r => r.source), ['AgentLabel', 'PostToolUse', 'SubagentStop']);
  for (const row of rows) assert.equal(row.repoKey, expected, row.source);
  assert.equal(rows[0].planSlug, 'outcome-attribution-coverage');
  assert.equal(rows[0].esqCommand, 'build');

  // Data minimization: each row's key set is exactly its declared allowlist — a field added upstream
  // cannot ride along, and the three new values are the only ones this change adds.
  assert.deepEqual(Object.keys(rows[0]).sort(), [
    'agentId', 'agentType', 'esqCommand', 'planSlug', 'recordedAt', 'repoKey', 'requestedModel', 'sessionId', 'source'
  ]);
  assert.deepEqual(Object.keys(rows[1]).sort(), [
    'agentId', 'agentType', 'durationMs', 'finalRequestTokens', 'finalRequestUsage', 'modelsUsed',
    'recordedAt', 'repoKey', 'resolvedModel', 'sessionId', 'source', 'toolUseCount'
  ]);
  assert.deepEqual(Object.keys(rows[2]).sort(), [
    'agentId', 'agentType', 'apiRequests', 'durationMs', 'models', 'recordedAt', 'repoKey',
    'runUsage', 'sessionId', 'source', 'toolUseCount', 'transcriptComplete'
  ]);

  // Outside a repository the key is omitted, never null and never an empty string.
  const unscoped = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  await recordAgentTelemetry({
    session_id: 'session-1', cwd: path.parse(fx.root).root, tool_name: 'Agent',
    tool_input: { subagent_type: 'general-purpose', description: 'esq:build plan:outcome-attribution-coverage' },
    tool_response: { status: 'completed', agentId: 'agent-unscoped', totalDurationMs: 7 }
  }, { CLAUDE_PLUGIN_DATA: unscoped });
  for (const row of await rowsOf(unscoped)) assert.equal(Object.hasOwn(row, 'repoKey'), false, row.source);

  // No `cwd` on the payload: the recorder falls back to the project directory the harness exports.
  const fromEnv = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
  await recordAgentTelemetry({
    session_id: 'session-1', tool_name: 'Agent',
    tool_input: { subagent_type: 'general-purpose', description: 'esq:build plan:outcome-attribution-coverage' },
    tool_response: { status: 'completed', agentId: 'agent-env', totalDurationMs: 7 }
  }, { CLAUDE_PLUGIN_DATA: fromEnv, CLAUDE_PROJECT_DIR: fx.worktree });
  for (const row of await rowsOf(fromEnv)) assert.equal(row.repoKey, expected, row.source);
});

test('identity comes only from an explicit plan: marker — prose is never an identity, and no shape costs the row its repository', async () => {
  const fx = await repoFixtures();
  const expected = repoKey(fx.main);
  const labelOf = async description => {
    const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
    await recordAgentTelemetry({
      session_id: 'session-1', cwd: fx.main, tool_name: 'Agent',
      tool_input: { subagent_type: 'general-purpose', description, prompt: 'secret prompt' },
      tool_response: { status: 'completed', agentId: 'agent-shape', totalDurationMs: 7 }
    }, { CLAUDE_PLUGIN_DATA: dataRoot });
    const text = await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
    return { label: (await rowsOf(dataRoot)).find(r => r.source === 'AgentLabel'), text };
  };

  // A malformed marker value: no planSlug, and the raw token never reaches the file.
  for (const token of ['../../etc/passwd', 'Docs/Plans', 'docs/plans/x.md', '-leading-dash', 'UPPER', 'a'.repeat(200), 'has.dot', 'has_underscore']) {
    const { label, text } = await labelOf(`esq:build plan:${token}`);
    assert.equal(label.esqCommand, 'build', token);
    assert.equal(Object.hasOwn(label, 'planSlug'), false, token);
    assert.equal(label.repoKey, expected, token);
    assert.equal(text.includes(token), false, token);
    assert.doesNotMatch(text, /secret prompt|"description"|"prompt"/);
  }

  // An empty marker, and a marker that is not the token immediately after the command.
  for (const description of ['esq:build plan:', 'esq:build plan: outcome-attribution-coverage', 'esq:build phase 2 plan:outcome-attribution-coverage']) {
    const { label } = await labelOf(description);
    assert.equal(label.esqCommand, 'build', description);
    assert.equal(Object.hasOwn(label, 'planSlug'), false, description);
    assert.equal(label.repoKey, expected, description);
  }

  // A bare `esq:<command>` — a pre-plan spawn — is a label with a repository and no identity.
  const { label: bare } = await labelOf('esq:work');
  assert.equal(bare.esqCommand, 'work');
  assert.equal(Object.hasOwn(bare, 'planSlug'), false);
  assert.equal(bare.repoKey, expected);

  // The regression this marker exists for: a description is free prose, and prose is not identity.
  // Every one of these is a real label written before the convention, or a plausible one written
  // after it; a bare second token would have persisted `phase`, `the`, `2` or `outcome-…` as a plan.
  for (const [description, command] of [
    ['esq:build phase 2 of the plan', 'build'],
    ['esq:check the plan', 'check'],
    ['esq:review the implementation against the plan', 'review'],
    ['esq:fix the green items', 'fix'],
    ['esq:work B-121', 'work'],
    ['esq:apply option A', 'apply'],
    ['esq:build outcome-attribution-coverage', 'build']
  ]) {
    const { label, text } = await labelOf(description);
    assert.equal(label.esqCommand, command, description);
    assert.equal(Object.hasOwn(label, 'planSlug'), false, description);
    assert.equal(label.repoKey, expected, description);
    // No word of the description survives beyond the command slug. Short tokens are skipped rather
    // than asserted: `2` and `of` occur inside a timestamp and a field name, and testing them would
    // be testing JSON, not this rule — `planSlug` being absent above is what proves the rule itself.
    for (const word of description.split(/\s+/).slice(1).filter(w => w.length >= 4)) {
      assert.equal(text.includes(word), false, `${description} → ${word}`);
    }
  }

  // And the marker itself still works, at the head of a longer description.
  const { label: marked } = await labelOf('esq:fix plan:webhooks-fixes and nothing else');
  assert.equal(marked.esqCommand, 'fix');
  assert.equal(marked.planSlug, 'webhooks-fixes');
  assert.equal(marked.repoKey, expected);
});

test('the plan marker admits the dated stem and the canonical slug, and stores one spelling of both', async () => {
  const fx = await repoFixtures();
  const expected = repoKey(fx.main);
  const labelOf = async description => {
    const dataRoot = await mkdtemp(path.join(os.tmpdir(), 'esq-data-'));
    await recordAgentTelemetry({
      session_id: 'session-1', cwd: fx.main, tool_name: 'Agent',
      tool_input: { subagent_type: 'general-purpose', description, prompt: 'secret prompt' },
      tool_response: { status: 'completed', agentId: 'agent-marker', totalDurationMs: 7 }
    }, { CLAUDE_PLUGIN_DATA: dataRoot });
    const text = await readFile(path.join(dataRoot, 'telemetry/agent-runs.jsonl'), 'utf8');
    return { label: (await rowsOf(dataRoot)).find(r => r.source === 'AgentLabel'), text };
  };
  // Every `plan:` marker written to this machine's store before B-128 — 17 of 17 — carried the plan
  // file's dated stem, which the reader could not resolve. Both forms are accepted now, and both are
  // stored as the one slug the join resolves against.
  const dated = await labelOf('esq:build plan:2026-09-06-stats-worth-handing-to-a-doctor');
  assert.equal(dated.label.planSlug, 'stats-worth-handing-to-a-doctor');
  const canonical = await labelOf('esq:build plan:stats-worth-handing-to-a-doctor');
  assert.equal(canonical.label.planSlug, 'stats-worth-handing-to-a-doctor');
  // Identical rows, not merely identical slugs: the two descriptions are one declaration.
  const shape = ({ recordedAt, ...rest }) => rest;
  assert.deepEqual(shape(dated.label), shape(canonical.label));
  // The dated stem itself never reaches the file — only what it canonicalizes to.
  assert.equal(dated.text.includes('2026-09-06-stats'), false);

  // The boundaries, tested rather than reasoned about: 64 characters canonical, 75 dated (11 + 64),
  // and 76 in either form is outside both admitted forms. `LABEL_PATTERN` writes to an append-only
  // store, so a wrong admission cannot be edited out afterwards.
  const long = 'a'.repeat(64);
  const atBound = await labelOf(`esq:build plan:${long}`);
  assert.equal(atBound.label.planSlug, long);
  const datedAtBound = await labelOf(`esq:build plan:2026-09-06-${long}`);
  assert.equal(datedAtBound.label.planSlug, long);
  for (const token of ['a'.repeat(76), `2026-09-06-${'a'.repeat(65)}`]) {
    assert.equal(token.length, 76);
    const { label, text } = await labelOf(`esq:build plan:${token}`);
    assert.equal(Object.hasOwn(label, 'planSlug'), false, token);
    assert.equal(text.includes(token), false, token);
    assert.equal(label.esqCommand, 'build', token);
    assert.equal(label.repoKey, expected, token);
  }

  // The re-validation `planSlugFrom` does after canonicalizing, at the one input that needs it: a
  // capture the pattern admits whose canonical form is empty. It drops rather than storing a bare row.
  assert.equal(planSlugFrom('2026-09-06-'), undefined);
  assert.equal(planSlugFrom(undefined), undefined);
  assert.equal(planSlugFrom('2026-09-06-plan-2'), 'plan');
});

// ---- a direct session segment carries its repository and no plan ----------------------------
// `plan:<slug>` in a spawn description is the one plan identity, and only a SUBAGENT run carries one.
// A declaration log used to give a direct segment its own: `esq lane` appended `{slug, repoKey, at}`
// events and this writer consumed them. That verb retired with the lane on 2026-09-22, so the log,
// its reader and the cases that pinned its admission rules retired with it — a policy removed, not a
// guarantee dropped. What still has to hold is that a direct row carries `repoKey`, claims no plan,
// and lets no text out.

const declRepos = repoFixtures();

async function segmentWith(cwd, { end = false } = {}) {
  const dataRoot = await sessionData();
  const transcript = await writeSession([
    typedMarker(1000, '/esq:build', 'secret command-args'),
    assistant(2000, 'req_1', 'claude-a', [textBlock('secret build report')], usage(1, 10, 0, 0))
  ]);
  const stop = sessionStop(transcript, cwd === undefined ? {} : { cwd });
  const result = await recordSessionTelemetry(end ? { ...stop, hook_event_name: 'SessionEnd' } : stop, { CLAUDE_PLUGIN_DATA: dataRoot });
  return { dataRoot, transcript, result, row: result === null ? null : (await sessionRowsOf(dataRoot)).at(-1) };
}

test('session writer: a direct segment carries its repository key and claims no plan', async () => {
  const fx = await declRepos;
  const { row } = await segmentWith(fx.main);
  assert.equal(row.repoKey, repoKey(fx.main));
  assert.equal(row.planSlug, undefined, 'a direct segment names no plan');
  assert.equal(row.planAmbiguous, undefined, 'and makes no ambiguity claim either');
});

test('session writer: a direct row carries no text and no session id', async () => {
  const fx = await declRepos;
  const { dataRoot } = await segmentWith(fx.main, { end: true });
  const text = await readFile(path.join(dataRoot, 'telemetry/session-runs.jsonl'), 'utf8');
  assert.doesNotMatch(text, FORBIDDEN);
});
