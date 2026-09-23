import { createReadStream } from 'node:fs';
import { appendFile, mkdir, open, readFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as sleep } from 'node:timers/promises';
import { PLAN_SLUG_SHAPE, canonicalPlanSlug, carriesWholeRunUsage, isMain, readHookInput, repoKey, telemetryOptedOut } from './hook-io.mjs';

// `carriesWholeRunUsage` (hook-io.mjs) is the one predicate that decides supersession here and which
// row represents a run in the reader (plugin/lib/telemetry.mjs) — one definition for both sides.

const USAGE_FIELDS = ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'];

function runsFile(dataRoot) {
  return path.join(dataRoot, 'telemetry', 'agent-runs.jsonl');
}

// The existing record for an agentId, or null. When the file holds more than one — a fallback
// row and the whole-run row that superseded it — the whole-run row is the one returned, so a
// caller asking "is there anything left to add?" gets the answer from the best row present.
export async function hasRecord(dataRoot, agentId) {
  if (!dataRoot || !agentId) return null;
  let text;
  try {
    text = await readFile(runsFile(dataRoot), 'utf8');
  } catch {
    return null;
  }
  let found = null;
  for (const line of text.split('\n')) {
    if (!line.includes(agentId)) continue;
    try {
      const parsed = JSON.parse(line);
      // A label decorates a record; it never stands in for one. Counting it here would let a
      // label written first block the SubagentStop record it exists to name.
      if (parsed.source === 'AgentLabel') continue;
      if (parsed.agentId !== agentId) continue;
      if (carriesWholeRunUsage(parsed)) return parsed;
      found ??= parsed;
    } catch {
      // A malformed line never hides or fakes a record.
    }
  }
  return found;
}

// Whether `record` has anything to add over `existing`: everything when there is no record yet,
// and otherwise only a whole-run row over a row that is not one. Most complete wins, not first
// (D-whole-run-record-supersedes-fallback); a fallback never overwrites anything.
export function supersedes(record, existing) {
  if (!existing) return true;
  return carriesWholeRunUsage(record) && !carriesWholeRunUsage(existing);
}

// Two handlers can fire for one run within the same few hundred milliseconds — PostToolUse and
// SubagentStop, in either order — and both scanning the file first is a check-then-act race the
// live probe lost. The append is guarded by an exclusive-create claim file per agentId, which is
// atomic on every filesystem Node runs on: whoever creates it holds the scan-and-append, the other
// either skips or, when it carries whole-run usage the holder may not have, waits for the claim.
// Under the claim the rule is *most complete wins*: a whole-run row appends over an existing
// fallback row (the file stays append-only; the reader keeps one record per agentId and prefers
// the whole-run row), a row that carries nothing more than what is already there skips. A claim
// left behind by a crash keeps that one run unrecorded.
//
// The wait is bounded and named here: the holder is mid-scan-and-append, milliseconds, so a
// whole-run writer retries the claim CLAIM_RETRIES times, CLAIM_RETRY_MS apart, and then gives up
// exactly as a writer without the retry would — the fallback row stays and the run reads as
// fallback-only in the summary. A PostToolUse writer never waits: it could not supersede anything.
const CLAIM_RETRIES = 5;
const CLAIM_RETRY_MS = 20;

export async function appendRun(dataRoot, record) {
  const file = runsFile(dataRoot);
  await mkdir(path.dirname(file), { recursive: true });
  const claim = record.agentId ? path.join(path.dirname(file), `.claim-${String(record.agentId).replace(/[^\w.-]/g, '_')}`) : null;
  let handle = null;
  if (claim) {
    const retries = carriesWholeRunUsage(record) ? CLAIM_RETRIES : 0;
    for (let attempt = 0; handle === null; attempt += 1) {
      try {
        handle = await open(claim, 'wx', 0o600);
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;
        if (attempt >= retries) return null;
        await sleep(CLAIM_RETRY_MS);
      }
    }
  }
  try {
    if (claim && !supersedes(record, await hasRecord(dataRoot, record.agentId))) return null;
    await appendFile(file, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    return { file, record };
  } finally {
    if (handle) {
      await handle.close();
      await unlink(claim).catch(() => {});
    }
  }
}

// An orchestrator names the esq command a spawn runs by starting the Agent call's description with
// `esq:<command>`, and names the plan that spawn works on with an explicit `plan:<slug>` marker —
// written only when the orchestrator was itself invoked on that plan. Only the two validated slugs
// are kept, never the description, the prompt or the response.
//
// The marker is required, and it is the whole point: a description is free prose, so a *bare* second
// token cannot be told apart from the words people already write. `esq:build phase 2 of the plan`
// would persist `phase` and `esq:check the plan` would persist `the` — values that resolve to no plan
// at best and to an unrelated real one at worst. `plan:` is not prose, so identity is declared here
// exactly as it is everywhere else in this design, never inferred (D-plan-identity-is-declared-not-inferred).
// A marker whose value is outside the two admitted forms (`plan:../../etc/passwd`, `plan:Docs/Plans`,
// `plan:` alone, a 200-character value) leaves no `planSlug` at all and never stores the raw token —
// and neither a missing marker nor a malformed one ever costs the row its `esqCommand` or its `repoKey`.
//
// EXACTLY TWO DECLARED FORMS ARE ADMITTED, AND NO THIRD: the canonical slug
// `[a-z0-9][a-z0-9-]{0,63}` (64 characters) and the plan file's dated stem, that same slug behind a
// `\d{4}-\d{2}-\d{2}-` prefix (75 = 11 + 64). The finder's `-<digits>` uniquifier lives inside the
// 64-character budget rather than on top of it. Both are canonicalized before they are written, so
// the store accumulates one spelling of an identity and a reader needs no repair path: prose stated
// the "drop the date prefix" rule three times and was followed 0 times in 17 markers (B-128).
const LABEL_PATTERN = /^esq:([a-z][a-z0-9-]{0,31})(?:\s+plan:((?:\d{4}-\d{2}-\d{2}-)?[a-z0-9][a-z0-9-]{0,63}))?(?:\s|$)/;

// The admitted capture, canonicalized and then re-validated against the shape the store admits —
// `undefined` when either step fails, so the row carries no `planSlug` and no raw token. The
// re-validation is defensive by construction (nothing the two admitted forms can produce falls
// outside the shape) and it stays: it is what lets `LABEL_PATTERN` and `PLAN_SLUG_SHAPE` change
// independently without one silently widening the other.
export function planSlugFrom(capture) {
  if (typeof capture !== 'string') return undefined;
  const slug = canonicalPlanSlug(capture);
  return PLAN_SLUG_SHAPE.test(slug) ? slug : undefined;
}
// The model the orchestrator asked for, read from the Agent call's `model` field (an alias, a full
// id, or `inherit`) — kept only when it matches this closed shape, omitted otherwise: never `null`,
// never the raw string. The summary's `by command × model` table joins it to the run's `models[]`,
// after the fact and gating nothing (B-042).
const MODEL_PATTERN = /^(?:opus|sonnet|haiku|fable|inherit|claude-[a-z0-9.-]{1,63}(?:\[1m\])?)$/;

// The repository a row was recorded in, on every row this recorder writes, whatever its command class
// and whether or not it carries a plan identity (B-121). It is deliberately not conditional on the
// slug: the rows coverage weighs hardest are exactly the ones with no slug, and a key written only
// beside a slug would leave every miss unscoped. Absent — no repository above the working directory —
// the key is omitted and the row reads as `unscopedRepo`, never as local and never as foreign.
function scopeOf(input, environment) {
  const key = repoKey(input?.cwd ?? environment.CLAUDE_PROJECT_DIR);
  return key === null ? {} : { repoKey: key };
}

async function appendLabel(dataRoot, record) {
  const file = runsFile(dataRoot);
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  return { file, record };
}

export async function recordAgentTelemetry(input, environment = process.env) {
  if (telemetryOptedOut(environment)) return null;
  const dataRoot = environment.CLAUDE_PLUGIN_DATA;
  const response = input.tool_response || {};
  if (!dataRoot || input.tool_name !== 'Agent') return null;

  // The label lands independently of the full-record fallback and its `completed` gate: one
  // PostToolUse per call, a plain append, and a reader that tolerates a repeat.
  const description = input.tool_input?.description;
  const label = LABEL_PATTERN.exec(typeof description === 'string' ? description : '');
  const slug = label?.[1];
  const scope = scopeOf(input, environment);
  if (response.agentId && slug) {
    const planSlug = planSlugFrom(label[2]);
    const model = input.tool_input?.model;
    const requestedModel = typeof model === 'string' && MODEL_PATTERN.test(model) ? model : undefined;
    await appendLabel(dataRoot, {
      recordedAt: new Date().toISOString(),
      source: 'AgentLabel',
      sessionId: input.session_id,
      agentId: response.agentId,
      agentType: input.tool_input?.subagent_type,
      esqCommand: slug,
      ...(planSlug !== undefined ? { planSlug } : {}),
      ...(requestedModel !== undefined ? { requestedModel } : {}),
      ...scope
    });
  }

  if (response.status !== 'completed') return null;
  // A fallback row never supersedes anything: any record for this run, whole-run or not, ends it here.
  if (await hasRecord(dataRoot, response.agentId)) return null;

  const record = {
    recordedAt: new Date().toISOString(),
    source: 'PostToolUse',
    sessionId: input.session_id,
    agentId: response.agentId,
    agentType: input.tool_input?.subagent_type,
    resolvedModel: response.resolvedModel,
    modelsUsed: response.modelsUsed,
    durationMs: response.totalDurationMs,
    toolUseCount: response.totalToolUseCount,
    finalRequestTokens: response.totalTokens,
    finalRequestUsage: response.usage,
    ...scope
  };
  return appendRun(dataRoot, record);
}

function expandHome(filePath) {
  if (typeof filePath !== 'string' || filePath === '') return null;
  if (filePath === '~') return os.homedir();
  return filePath.startsWith('~/') ? path.join(os.homedir(), filePath.slice(2)) : filePath;
}

function timeOf(line) {
  const ms = Date.parse(line?.timestamp);
  return Number.isFinite(ms) ? ms : null;
}

// The per-line logic is a reducer over a carried state so a second writer can resume it from a
// byte offset across calls: the state holds running totals plus only the *last* request seen
// (`lastRequest`), and a later line sharing that request's id replaces its usage rather than
// adding it — streaming writes one API request as several lines sharing an id, one content block
// per line, usage is the last line's (it carries the final count), tool_use blocks add up. The
// state is plain JSON (no Map, no Set) so it can live in a sidecar between calls.
export function initialTranscriptState() {
  return {
    readable: false, first: true, firstMs: null, lastMs: null, models: [],
    closedRequests: 0, closedToolUses: 0, closedUsage: null, lastRequest: null,
    anonymousLines: 0, lastAssistantText: null
  };
}

function addUsage(total, usage) {
  if (!usage) return total;
  const out = total || Object.fromEntries(USAGE_FIELDS.map(field => [field, 0]));
  for (const field of USAGE_FIELDS) out[field] += usage[field];
  return out;
}

function closeRequest(state) {
  if (!state.lastRequest) return;
  state.closedRequests += 1;
  state.closedToolUses += state.lastRequest.toolUses;
  state.closedUsage = addUsage(state.closedUsage, state.lastRequest.usage);
  state.lastRequest = null;
}

// Folds one raw transcript line into `state` and returns it. Only lines that can be assistant
// messages are parsed, and from each one only ids, model, numbers, timestamps and the count of
// tool_use blocks are kept — never a tool input. `readText: true` (the subagent writer's default)
// additionally keeps the last assistant text for the `last_assistant_message` comparison; a
// caller that passes `false` never touches a text block, not even transiently.
export function reduceTranscriptLine(state, raw, { readText = true } = {}) {
  state.readable = true;
  const isAssistant = raw.includes('"type":"assistant"');
  if (!state.first && !isAssistant) return state;
  state.first = false;
  let line;
  try {
    line = JSON.parse(raw);
  } catch {
    return state;
  }
  const ms = timeOf(line);
  if (ms !== null) {
    if (state.firstMs === null || ms < state.firstMs) state.firstMs = ms;
    if (state.lastMs === null || ms > state.lastMs) state.lastMs = ms;
  }
  if (line?.type !== 'assistant') return state;
  const message = line.message;
  if (!message || typeof message !== 'object') return state;
  if (typeof message.model === 'string' && !state.models.includes(message.model)) state.models.push(message.model);
  const content = Array.isArray(message.content) ? message.content : [];
  const requestId = typeof message.id === 'string' ? message.id : `line:${state.anonymousLines++}`;
  if (state.lastRequest?.id !== requestId) {
    closeRequest(state);
    state.lastRequest = { id: requestId, usage: null, toolUses: 0 };
  }
  state.lastRequest.usage = normaliseUsage(message.usage);
  state.lastRequest.toolUses += content.filter(block => block?.type === 'tool_use').length;
  if (readText) {
    const text = content.filter(block => block?.type === 'text' && typeof block.text === 'string').map(block => block.text).join('');
    if (text !== '') state.lastAssistantText = text;
  }
  return state;
}

// The summary the writers record. Reads the state without closing it, so a caller can keep
// reducing into the same state afterwards (the open request may still gain lines).
export function finalizeTranscript(state) {
  const open = state.lastRequest;
  return {
    readable: state.readable,
    models: [...state.models],
    apiRequests: state.closedRequests + (open ? 1 : 0),
    toolUseCount: state.closedToolUses + (open ? open.toolUses : 0),
    firstMs: state.firstMs,
    lastMs: state.lastMs,
    usage: addUsage(state.closedUsage ? { ...state.closedUsage } : null, open?.usage),
    lastAssistantText: state.lastAssistantText
  };
}

// One streaming pass over the agent's transcript, from zero, through the reducer above. What it
// keeps: request ids, model ids, timestamps, usage numbers and tool_use counts. What it reads and
// does not keep: the last assistant text, held in memory only to compare with the hook payload's
// `last_assistant_message` and so judge `transcriptComplete` (the lag wait and re-parse hinge on
// it). No prompt, tool input, reasoning or response text is ever written to agent-runs.jsonl —
// the data-minimization assertions in tests/hooks hold that row by row (B-040).
async function parseTranscript(transcriptPath) {
  const state = initialTranscriptState();
  if (!transcriptPath) return finalizeTranscript(state);
  let stream;
  try {
    stream = createReadStream(transcriptPath, { encoding: 'utf8' });
    stream.on('error', () => {});
    const lines = createInterface({ input: stream, crlfDelay: Infinity });
    for await (const raw of lines) reduceTranscriptLine(state, raw);
  } catch {
    // Unreadable, missing or foreign-format: the record degrades to nulls, never throws.
  } finally {
    stream?.destroy();
  }
  return finalizeTranscript(state);
}

function normaliseUsage(usage) {
  if (!usage || typeof usage !== 'object') return null;
  const out = {};
  for (const field of USAGE_FIELDS) {
    const value = usage[field];
    out[field] = Number.isFinite(value) ? value : 0;
  }
  return out;
}

export async function recordSubagentStop(input, environment = process.env, options = {}) {
  if (telemetryOptedOut(environment)) return null;
  const dataRoot = environment.CLAUDE_PLUGIN_DATA;
  const agentId = input.agent_id;
  if (!dataRoot || !agentId) return null;
  // Only a whole-run row already in the file makes the parse pointless. A fallback row does not:
  // the transcript may be readable, and then this record supersedes it under the claim.
  if (carriesWholeRunUsage(await hasRecord(dataRoot, agentId))) return null;

  const lagWaitMs = options.lagWaitMs ?? 300;
  const transcriptPath = expandHome(input.agent_transcript_path);
  const expected = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : null;
  const matches = summary => expected === null || summary.lastAssistantText === expected;

  let summary = await parseTranscript(transcriptPath);
  // The transcript may lag the in-memory conversation at stop time: one bounded wait, one re-parse, no loop.
  if (summary.readable && !matches(summary) && lagWaitMs > 0) {
    await sleep(lagWaitMs);
    summary = await parseTranscript(transcriptPath);
  }

  // The harness's own recap, title and progress queries run in an agent context and fire
  // SubagentStop too, with agent_type "" and a transcript path derived from the id that was
  // never written (Claude Code 2.1.235, measured 2026-08-19: 29 such rows, one every ~31 s of a
  // backgrounded run). No type and no transcript is nothing to record; a real Agent-tool run
  // always carries its type, and a fork-shaped run without one still has a transcript.
  if ((input.agent_type == null || input.agent_type === '') && !summary.readable) return null;

  const record = {
    recordedAt: new Date().toISOString(),
    source: 'SubagentStop',
    sessionId: input.session_id,
    agentId,
    agentType: input.agent_type,
    models: summary.models,
    durationMs: summary.firstMs !== null && summary.lastMs !== null ? summary.lastMs - summary.firstMs : null,
    toolUseCount: summary.readable ? summary.toolUseCount : null,
    apiRequests: summary.readable ? summary.apiRequests : null,
    runUsage: summary.usage,
    transcriptComplete: summary.readable && matches(summary),
    ...scopeOf(input, environment)
  };
  return appendRun(dataRoot, record);
}

if (isMain(import.meta.url)) {
  const input = await readHookInput();
  if (input.hook_event_name === 'SubagentStop') await recordSubagentStop(input);
  else await recordAgentTelemetry(input);
}
