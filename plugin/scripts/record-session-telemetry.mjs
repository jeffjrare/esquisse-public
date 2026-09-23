import { appendFile, mkdir, open, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { atomicWrite } from '../lib/markdown.mjs';
import { REPO_KEY_SHAPE, isMain, readHookInput, repoKey, telemetryOptedOut } from './hook-io.mjs';
import { finalizeTranscript, initialTranscriptState, reduceTranscriptLine } from './record-agent-telemetry.mjs';

// The direct path: a user typing `/esq:status` (or an orchestrator invoking `esq:plan` through the
// Skill tool) leaves no subagent and therefore no row in agent-runs.jsonl. This writer reads the
// main-session transcript the harness hands to Stop / SessionEnd (`transcript_path`) and attributes
// main-session usage to the esq command that opened the segment. Bound, per invocation: the bytes
// the transcript gained since the previous run for this session — one stat, one bounded read, one
// sidecar read, one atomic sidecar write, one append. Never a text block, not even transiently: only
// lines that can carry a marker are parsed for it, and the reducer runs with `readText: false`.
//
// Measured on Claude Code 2.1.235 (2026-08-19): a typed command is a user line whose *string*
// content starts with `<command-message>…</command-message>\n<command-name>/esq:<cmd></command-name>`;
// tool results are array-content user lines, so the marker never appears at the head of one; `/clear`
// opens a new session file whose first user line is the `/clear` marker; a top-level `Skill` tool_use
// carries `input.skill: "esq:<cmd>"`.

const SESSION_RUNS_FILE = 'session-runs.jsonl';
// A claim left by a crash would otherwise silence a whole session, not one run (appendRun's claim
// guards a single agentId and may stay) — so a session claim older than this is taken over.
const STALE_CLAIM_MS = 30_000;
// The Stop entry is async, so a SessionEnd can arrive while that Stop still holds the claim (measured
// 91 ms apart under `-p`). Stop gives up — the next Stop catches up — but SessionEnd is the last
// chance to close the segment and remove the sidecar, so it waits for the claim, bounded.
const SESSION_END_CLAIM_WAIT_MS = 3_000;
const CLAIM_RETRY_MS = 100;
// `repoKey`'s own output shape, imported from `hook-io.mjs` rather than restated, so this reader
// admits exactly what the writers emit.
const REPO_KEY = REPO_KEY_SHAPE;
const TYPED_MARKER = /^\s*(?:<command-message>[^<]*<\/command-message>\s*)?<command-name>\/([^<]*)<\/command-name>/;
const ESQ_SLUG = /^esq:([a-z][a-z0-9-]{0,31})$/;

function telemetryDir(dataRoot) {
  return path.join(dataRoot, 'telemetry');
}

function safeId(value) {
  return String(value).replace(/[^\w.-]/g, '_');
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

function freshCursor() {
  return { offset: 0, nextSegment: 0, open: null };
}

async function readCursor(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    if (!Number.isInteger(parsed?.offset) || parsed.offset < 0 || !Number.isInteger(parsed?.nextSegment)) return freshCursor();
    return { offset: parsed.offset, nextSegment: parsed.nextSegment, open: parsed.open ?? null };
  } catch {
    // Missing or torn: start from zero. Rows are cumulative and keyed by (sessionId, segment), so a
    // re-read of the whole session re-derives the same rows and the reader keeps the last.
    return freshCursor();
  }
}

// `atomicWrite` preserves the mode of an existing target; a sidecar's first write creates it at 0600.
async function writeCursor(file, cursor) {
  const content = `${JSON.stringify(cursor)}\n`;
  try {
    await atomicWrite(file, content);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await writeFile(file, '', { mode: 0o600 });
    await atomicWrite(file, content);
  }
}

// Exclusive-create claim per session. `EEXIST` on a fresh claim means another invocation is reading
// this session right now: skip, the cursor did not move, the next Stop catches up.
async function claimSession(dir, sessionId) {
  const claim = path.join(dir, `.claim-session-${safeId(sessionId)}`);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return { claim, handle: await open(claim, 'wx', 0o600) };
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      let age = 0;
      try {
        age = Date.now() - (await stat(claim)).mtimeMs;
      } catch {
        continue; // Released between our attempt and the stat: try once more.
      }
      if (age < STALE_CLAIM_MS) return null;
      await unlink(claim).catch(() => {});
    }
  }
  return null;
}

// The bytes appended since `offset`, split into complete lines; a trailing partial line (no newline
// yet — the harness writes in chunks) is left for the next run. Byte offsets are safe to carry
// because '\n' is a single byte in UTF-8 and never part of a multi-byte sequence.
async function readDelta(transcriptPath, offset) {
  let handle;
  try {
    handle = await open(transcriptPath, 'r');
    const { size } = await handle.stat();
    const start = offset > size ? 0 : offset;
    if (size <= start) return { lines: [], offset: start, reset: start !== offset };
    const buffer = Buffer.alloc(size - start);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, start);
    const end = buffer.lastIndexOf(0x0a, bytesRead - 1);
    if (end < 0) return { lines: [], offset: start, reset: start !== offset };
    const lines = buffer.toString('utf8', 0, end).split('\n');
    return { lines, offset: start + end + 1, reset: start !== offset };
  } finally {
    await handle?.close();
  }
}

// The repository a segment was opened in, on every row this recorder writes and whether or not the
// segment ever acquires a plan identity (B-121) — the same rule the agent recorder applies, so a row
// with no `repoKey` reads as `unscopedRepo` on both paths, never as local and never as foreign. It is
// derived once, when the segment opens, and carried on the cursor: the walk is bounded but it is a
// filesystem walk, and a `Stop` fires every turn, so recomputing it per turn would pay for the same
// answer for as long as the command runs.
// Memoized and lazy: a turn that opens no segment pays no walk at all, and a delta that opens two
// pays one. `null` — no repository above the working directory — is a real answer and is cached too.
function scopeOf(input, environment) {
  let key;
  return () => {
    if (key === undefined) key = repoKey(input?.cwd ?? environment.CLAUDE_PROJECT_DIR);
    return key;
  };
}

// The identity a direct session segment publishes: its repository key, and no plan slug.
//
// A declaration log used to carry one — `esq lane` appended a `{ slug, repoKey, at }` event per run
// and this writer consumed it. That verb retired with the lane on 2026-09-22, and a log nobody
// writes is a reader that always finds nothing, so the transfer went with it. `plan:<slug>` in a
// spawn description remains the one plan identity, which the AGENT recorder reads; a direct session
// row simply carries no plan. `planAmbiguous` stays in the row allowlist because the reader still
// accepts it from rows written before this change.
function identityOf(open) {
  return {};
}

function openSegment(cursor, esqCommand, via, startedMs, repo) {
  cursor.open = {
    segment: cursor.nextSegment, esqCommand, via,
    startedAt: startedMs === null ? null : new Date(startedMs).toISOString(),
    repoKey: repo(),
    state: initialTranscriptState()
  };
  cursor.nextSegment += 1;
  return cursor.open;
}

function rowFor(open, { source, sessionId, closedBy }) {
  const summary = finalizeTranscript(open.state);
  const startedMs = open.startedAt === null ? null : Date.parse(open.startedAt);
  const lastMs = summary.lastMs ?? startedMs;
  return {
    recordedAt: new Date().toISOString(),
    source,
    sessionId,
    segment: open.segment,
    esqCommand: open.esqCommand,
    via: open.via,
    ...(typeof open.repoKey === 'string' ? { repoKey: open.repoKey } : {}),
    ...identityOf(open),
    startedAt: open.startedAt,
    lastAt: lastMs === null ? null : new Date(lastMs).toISOString(),
    durationMs: startedMs !== null && lastMs !== null ? lastMs - startedMs : null,
    models: summary.models,
    apiRequests: summary.apiRequests,
    toolUseCount: summary.toolUseCount,
    runUsage: summary.usage,
    closedBy
  };
}

// A top-level `Skill` tool_use whose skill is `esq:<cmd>` opens a segment. Returns the slug or null.
function skillOpener(line) {
  const content = Array.isArray(line?.message?.content) ? line.message.content : [];
  for (const block of content) {
    if (block?.type !== 'tool_use' || block.name !== 'Skill') continue;
    const slug = ESQ_SLUG.exec(typeof block.input?.skill === 'string' ? block.input.skill : '')?.[1];
    if (slug) return slug;
  }
  return null;
}

// Folds the delta's lines into the cursor. Returns the rows to append: one final row per segment
// closed in this delta, each `closedBy: "command"`.
function segmentLines(cursor, lines, { source, sessionId, repo }) {
  const rows = [];
  const close = (closedBy) => {
    if (!cursor.open) return;
    rows.push(rowFor(cursor.open, { source, sessionId, closedBy }));
    cursor.open = null;
  };
  for (const raw of lines) {
    if (raw === '' || raw.includes('"isSidechain":true')) continue;
    if (raw.includes('"type":"user"')) {
      // Only a line that can carry a typed marker is parsed; a tool result is an array-content user
      // line and never matches the string-content rule below.
      if (!raw.includes('<command-name>')) continue;
      let line;
      try { line = JSON.parse(raw); } catch { continue; }
      if (line?.type !== 'user' || typeof line.message?.content !== 'string') continue;
      const typed = TYPED_MARKER.exec(line.message.content);
      if (!typed) continue;
      // Any typed command — /clear, /compact, a non-esq command, a malformed esq slug — closes the
      // open segment: the human changed activity. Only a valid esq slug opens the next one.
      close('command');
      const slug = ESQ_SLUG.exec(typed[1])?.[1];
      if (slug) {
        openSegment(cursor, slug, 'typed', timeOf(line), repo);
        cursor.open.dirty = true;
      }
      continue;
    }
    if (!raw.includes('"type":"assistant"')) continue;
    if (raw.includes('"name":"Skill"')) {
      let line;
      try { line = JSON.parse(raw); } catch { line = null; }
      const slug = line?.type === 'assistant' ? skillOpener(line) : null;
      if (slug) {
        // The opening request's own usage counts in the segment it opens: if its earlier lines
        // (one content block per line, same message.id) were reduced into the closing segment,
        // that segment gives the open request up rather than both counting it.
        const requestId = typeof line.message?.id === 'string' ? line.message.id : null;
        if (cursor.open && requestId !== null && cursor.open.state.lastRequest?.id === requestId) cursor.open.state.lastRequest = null;
        close('command');
        openSegment(cursor, slug, 'skill-tool', timeOf(line), repo);
      }
    }
    if (!cursor.open) continue;
    reduceTranscriptLine(cursor.open.state, raw, { readText: false });
    cursor.open.dirty = true;
  }
  return rows;
}

// Stop (every turn, async) reads the delta and appends one cumulative row for the open segment;
// SessionEnd reads the final delta, closes the open segment and removes the sidecar. Returns
// `{ file, records }` when at least one row was appended, otherwise null.
export async function recordSessionTelemetry(input, environment = process.env) {
  if (telemetryOptedOut(environment)) return null;
  const dataRoot = environment.CLAUDE_PLUGIN_DATA;
  const sessionId = input.session_id;
  if (!dataRoot || !sessionId) return null;
  const transcriptPath = expandHome(input.transcript_path);
  if (!transcriptPath) return null;
  try {
    if (!(await stat(transcriptPath)).isFile()) return null;
  } catch {
    return null; // Missing or unreadable: no row, no sidecar.
  }
  const ending = input.hook_event_name === 'SessionEnd';
  const source = ending ? 'SessionEnd' : 'SessionStop';
  const dir = telemetryDir(dataRoot);
  await mkdir(dir, { recursive: true });
  let claimed = await claimSession(dir, sessionId);
  for (let waited = 0; !claimed && ending && waited < SESSION_END_CLAIM_WAIT_MS; waited += CLAIM_RETRY_MS) {
    await sleep(CLAIM_RETRY_MS);
    claimed = await claimSession(dir, sessionId);
  }
  if (!claimed) return null;

  try {
    const cursorFile = path.join(dir, `.cursor-${safeId(sessionId)}.json`);
    const cursor = await readCursor(cursorFile);
    if (cursor.open) cursor.open.dirty = false;
    let delta;
    try {
      delta = await readDelta(transcriptPath, cursor.offset);
    } catch {
      return null;
    }
    if (delta.reset) {
      // The transcript is shorter than the cursor remembers: it is not the file the cursor was
      // written against. Start over; cumulative rows make the re-read idempotent.
      cursor.nextSegment = 0;
      cursor.open = null;
    }
    cursor.offset = delta.offset;
    const rows = segmentLines(cursor, delta.lines, { source, sessionId, repo: scopeOf(input, environment) });

    if (cursor.open) {
      if (ending) {
        rows.push(rowFor(cursor.open, { source, sessionId, closedBy: 'session-end' }));
        cursor.open = null;
      } else if (cursor.open.dirty) {
        rows.push(rowFor(cursor.open, { source, sessionId, closedBy: null }));
      }
      if (cursor.open) delete cursor.open.dirty;
    }

    const file = path.join(dir, SESSION_RUNS_FILE);
    // Rows before the cursor: a crash between the two re-reads this delta next time and rewrites
    // the same cumulative rows, which the reader dedupes; the other order would lose them.
    if (rows.length > 0) await appendFile(file, rows.map(row => `${JSON.stringify(row)}\n`).join(''), { mode: 0o600 });
    if (ending) await unlink(cursorFile).catch(() => {});
    else await writeCursor(cursorFile, cursor);
    return rows.length > 0 ? { file, records: rows } : null;
  } finally {
    await claimed.handle.close();
    await unlink(claimed.claim).catch(() => {});
  }
}

if (isMain(import.meta.url)) {
  const input = await readHookInput();
  await recordSessionTelemetry(input);
}
