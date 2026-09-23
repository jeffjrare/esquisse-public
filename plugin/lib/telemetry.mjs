import { createReadStream } from 'node:fs';
import { access, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { PLAN_SLUG_SHAPE, REPO_KEY_SHAPE, carriesWholeRunUsage, repoKey, sessionKey, telemetryOptedOut } from '../scripts/hook-io.mjs';

// Re-exported, never redefined: `sessionKey` and `repoKey` are rules the telemetry writers and every
// reader of what they write must apply identically, so they live in hook-io.mjs beside the opt-out and
// `carriesWholeRunUsage` (a handler loads them without loading this reader) and reach the CLI from
// here. A second definition on either side is the drift this stops.
export { PLAN_SLUG_SHAPE, REPO_KEY_SHAPE, repoKey, sessionKey };

// Reads the telemetry the hooks write — agent-runs.jsonl (plugin/scripts/record-agent-telemetry.mjs,
// one row per subagent run) and session-runs.jsonl (plugin/scripts/record-session-telemetry.mjs, one
// cumulative row per Stop per esq command run in the main session) — and sums the first per esq
// command, per agent type, per model and per command × model (with the model the orchestrator asked
// for, B-042), the second per esq command in its own `direct` section.
// Never writes. Every number comes from a field a handler stores today; a rename upstream makes a
// group report zeros, which the fixture under tests/cli catches before it ships.

export const RUNS_FILE = path.join('telemetry', 'agent-runs.jsonl');
export const SESSION_RUNS_FILE = path.join('telemetry', 'session-runs.jsonl');
const FILE_KINDS = [RUNS_FILE, SESSION_RUNS_FILE];

// Rows the session writer appends: `SessionStop` from the Stop hook, `SessionEnd` from the closer.
// They carry a sessionId + segment instead of an agentId, so they are read into `direct`, never
// joined or deduped with subagent rows (agent-runs.jsonl's reader would count one as an anonymous run).
const DIRECT_SOURCES = new Set(['SessionStop', 'SessionEnd']);
const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;
export const DIRECT_SEGMENTS_NOTE = 'direct rows sum the main session from an esq command to the next typed command or session end; subagent usage is never included; durations span your own waits';
export const TELEMETRY_OPT_OUT_NOTE = 'telemetry opt-out is set in this shell (ESQ_TELEMETRY / DO_NOT_TRACK) — hooks started from it write nothing';
export const PLUGIN_DATA_ENV_IGNORED_NOTE = 'CLAUDE_PLUGIN_DATA is exported in this shell but ignored — it is a harness→hook channel, not a CLI one; pass telemetry file paths explicitly to un-pool';

// Measured on Claude Code 2.1.235 (2026-08-19, B-036): a subagent stopped with TaskStop or an
// interrupt fires no SubagentStop, so its run leaves no row. Re-probe per Claude Code upgrade.
export const INTERRUPTED_RUNS_NOTE = 'interrupted subagents leave no row on Claude Code ≤ 2.1.235 (measured 2026-08-19), so the most expensive runs may be missing from every sum below';

// A group with fewer token-bearing runs than this is `provisional`: its medians are shown, but no
// tier or budget is argued from them (D-telemetry-sample-threshold-five-runs). Five is the
// conventional minimum cell count for reporting a figure from a small group, and the smallest n
// where a median has two observations on each side. Counted over `tokens.runs` — a fallback-only
// run contributes duration and tool calls but no token sample, so it does not make a group less
// provisional.
export const MIN_SAMPLE_RUNS = 5;

// Runs that are not measurements of real work, dropped before grouping and reported as
// `skipped.excluded` rather than deleted from the store — a median that quietly got better is the
// number a later reader over-trusts, so the exclusion is version-controlled, reviewable and visible
// in the output. One entry per run, each carrying the reason it is not evidence. The three below are
// throwaway `/esq:autopilot` proof runs made from a scratch repo during relay-worker-model-separation
// Phase 4 and written into the pooled store (B-051); they are 3 of the 6 runs in
// `esq:build · claude-opus-5`, the one cell B-029 exists to read. This list has no reason to grow: a
// scratch or proof run sets `ESQ_TELEMETRY=off` (README § Telemetry), which stops the row being
// written at all. A fourth entry is the signal to store a repo identity on the row instead.
export const EXCLUDED_RUNS = new Map([
  ['a634d2d30a36adcbe', 'B-051 — /esq:autopilot proof run from a scratch repo, 2026-08-19'],
  ['a2b524c78600b8d53', 'B-051 — /esq:autopilot proof run from a scratch repo, 2026-08-19'],
  ['a81db3a510d745fc2', 'B-051 — /esq:autopilot proof run from a scratch repo, 2026-08-19'],
]);

function pluginDataRoot(environment) {
  return path.join(environment.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'plugins', 'data');
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

// `CLAUDE_PLUGIN_DATA` is a harness→hook channel and is deliberately NOT read here: the harness-set
// value is never visible from a skill's Bash (measured, D-cli-ignores-plugin-data-env), so any value
// this process could see is a shell export or test injection — honoring it made the model assertion
// read an empty store and fail open (B-048). Every `esq` / `esq-*` plugin data directory under the
// Claude config dir is pooled —
// `esq-esquisse` for the marketplace install, `esq-inline` for `--plugin-dir` — so "what does a
// build phase cost" reads across both; an explicit path on the command line un-pools.
// Both file kinds are looked up by name per directory, never globbed: the session writer's
// `.cursor-*.json` sidecars and `.claim-*` files live in the same `telemetry/` directory.
async function presentFiles(dir) {
  const files = [];
  for (const kind of FILE_KINDS) {
    const file = path.join(dir, kind);
    if (await exists(file)) files.push(file);
  }
  return files;
}

export async function discoverTelemetryFiles(environment = process.env) {
  const root = pluginDataRoot(environment);
  let entries = [];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }
  const files = [];
  for (const entry of entries.filter((item) => item.isDirectory() && /^esq(-|$)/.test(item.name)).sort((a, b) => a.name.localeCompare(b.name))) {
    files.push(...(await presentFiles(path.join(root, entry.name))));
  }
  return { root, files };
}

async function* lines(file) {
  const stream = createReadStream(file, { encoding: 'utf8' });
  try {
    yield* createInterface({ input: stream, crlfDelay: Infinity });
  } finally {
    stream.destroy();
  }
}

// One row reader for the summary and the assertion: every non-blank line, parsed, as `{ row }` — `row`
// is null when the line is not a JSON object (a truncated append, a foreign line), so a caller can count
// it without either reader re-deciding what "malformed" means.
async function* parsedRows(file) {
  for await (const raw of lines(file)) {
    if (raw.trim() === '') continue;
    let row = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) row = parsed;
    } catch {
      // malformed: reported by the caller, never hides the rest of the file
    }
    yield { row };
  }
}

const TOKEN_FIELDS = { input: 'input_tokens', output: 'output_tokens', cacheCreation: 'cache_creation_input_tokens', cacheRead: 'cache_read_input_tokens' };

function emptyGroup() {
  return {
    runs: 0,
    tokens: { runs: 0, input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0, medianOutput: null, outputs: [] },
    toolCalls: { runs: 0, total: 0, median: null, values: [] },
    // Round trips: the run's API requests, the count whose product with the context size at each one
    // is what an agent actually costs (B-070). Stored per row by both writers since 2026-08-18.
    apiRequests: { runs: 0, total: 0, median: null, values: [] },
    durationMs: { runs: 0, total: 0, median: null, values: [] },
    // The calls-per-round-trip ratio's population: only a record carrying *both* counts advances
    // these, so a row predating `apiRequests` cannot put its tool calls over someone else's round
    // trips. Summed rather than averaged per run — a one-call run must not weigh as much as a
    // hundred-call one (D-calls-per-turn-over-a-paired-population).
    paired: { runs: 0, toolCalls: 0, apiRequests: 0 },
  };
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function usageTotal(usage) {
  let total = 0;
  for (const field of Object.values(TOKEN_FIELDS)) total += finite(usage[field]) ? usage[field] : 0;
  return total;
}

// The whole-run usage a record carries, or null: a SubagentStop row carries the transcript's, a
// direct (SessionStop/SessionEnd) row its segment's; a PostToolUse row carries only its last API
// request's, which would under-count a run twentyfold (B-035), and a `runUsage` summing to zero is
// a measurement failure, not a sample — no real API request costs nothing (B-037). Neither yields a
// token sample: the run still counts, with its duration and tool calls, and enters no token sum or median.
function wholeRunUsage(record) {
  const wholeRun = record.source === 'SubagentStop' || DIRECT_SOURCES.has(record.source);
  const usage = wholeRun && record.runUsage && typeof record.runUsage === 'object' ? record.runUsage : null;
  return usage && usageTotal(usage) > 0 ? usage : null;
}

// `modelsUsed` is never read: it names models the harness had on hand, not the ones the run used.
function contribute(group, record) {
  group.runs += 1;
  const usage = wholeRunUsage(record);
  if (usage) {
    group.tokens.runs += 1;
    for (const [key, field] of Object.entries(TOKEN_FIELDS)) group.tokens[key] += finite(usage[field]) ? usage[field] : 0;
    group.tokens.total += usageTotal(usage);
    group.tokens.outputs.push(finite(usage.output_tokens) ? usage.output_tokens : 0);
  }
  if (finite(record.toolUseCount)) {
    group.toolCalls.runs += 1;
    group.toolCalls.total += record.toolUseCount;
    group.toolCalls.values.push(record.toolUseCount);
  }
  if (finite(record.apiRequests)) {
    group.apiRequests.runs += 1;
    group.apiRequests.total += record.apiRequests;
    group.apiRequests.values.push(record.apiRequests);
  }
  if (finite(record.toolUseCount) && finite(record.apiRequests)) {
    group.paired.runs += 1;
    group.paired.toolCalls += record.toolUseCount;
    group.paired.apiRequests += record.apiRequests;
  }
  if (finite(record.durationMs)) {
    group.durationMs.runs += 1;
    group.durationMs.total += record.durationMs;
    group.durationMs.values.push(record.durationMs);
  }
}

function seal(groups) {
  const out = {};
  for (const key of Object.keys(groups).sort()) {
    const group = groups[key];
    const { outputs, ...tokens } = group.tokens;
    const { values: toolValues, ...toolCalls } = group.toolCalls;
    const { values: tripValues, ...apiRequests } = group.apiRequests;
    const { values: durationValues, ...durationMs } = group.durationMs;
    out[key] = {
      runs: group.runs,
      provisional: tokens.runs < MIN_SAMPLE_RUNS,
      tokens: { ...tokens, medianOutput: median(outputs) },
      toolCalls: { ...toolCalls, median: median(toolValues) },
      apiRequests: { ...apiRequests, median: median(tripValues) },
      durationMs: { ...durationMs, median: median(durationValues) },
      paired: { ...group.paired },
      // Tool calls per round trip over the runs carrying both counts, `null` when no run does —
      // never invented from a one-sided population (D-calls-per-turn-over-a-paired-population).
      callsPerTrip: group.paired.apiRequests > 0 ? group.paired.toolCalls / group.paired.apiRequests : null,
    };
  }
  return out;
}

// Direct groups are sealed by the same rule (so carry `provisional` against the same threshold) and
// additionally say how each segment was opened: typed at the prompt, or through the Skill tool.
function sealDirect(groups, vias, models) {
  const sealed = seal(groups);
  for (const key of Object.keys(sealed)) {
    sealed[key].via = { typed: vias[key]?.typed || 0, 'skill-tool': vias[key]?.['skill-tool'] || 0 };
    // The model(s) the segment's own requests ran on — what the orchestrator itself cost, as
    // opposed to the workers it spawned; a group spanning two models lists both, `+`-joined.
    sealed[key].models = joinModels([...(models[key] || [])].sort());
  }
  return sealed;
}

// The by-command×model groups carry, beside the same numbers, what the orchestrator asked for and
// the group's verdict. The model is fixed per key, so the verdict only varies with what was asked:
// `mismatch` if any labelled run in the group asked for another model (or ran on two families),
// `honored` if any run asked and none mismatched, `unrequested` when no labelled run asked at all
// (`—` in the table: the session model, inherited), `null` when runs asked but none carries model
// evidence (`unknown` key). `requested` is the asked alias/id, `+`-joined when a group was asked
// for under more than one spelling, `null` when nothing was asked.
function sealCommandModel(groups, spawns) {
  const sealed = seal(groups);
  for (const key of Object.keys(sealed)) {
    const spawn = spawns[key] || { requested: new Set(), honored: 0, mismatch: 0, unrequested: 0 };
    const requested = [...spawn.requested].sort();
    sealed[key].requested = requested.length ? requested.join('+') : null;
    sealed[key].verdict = spawn.mismatch > 0 ? 'mismatch' : spawn.honored > 0 ? 'honored' : requested.length > 0 ? null : 'unrequested';
  }
  return sealed;
}

// The session writer appends a cumulative row per Stop for an open segment, so several rows per
// (sessionId, segment) are the norm and file order is time order: the last one is the segment.
function directKey(row) {
  if (!DIRECT_SOURCES.has(row.source)) return null;
  const { sessionId, segment, esqCommand } = row;
  if (typeof sessionId !== 'string' || sessionId === '' || !Number.isInteger(segment) || segment < 0) return null;
  if (typeof esqCommand !== 'string' || !SLUG_PATTERN.test(esqCommand)) return null;
  return `${sessionId}\u0000${segment}`;
}

// The models a record is evidence for: a SubagentStop (or direct) row's `models[]` — the transcript's
// request lines — or a fallback row's `resolvedModel`, the harness's summary (weaker, B-035). One
// definition for the by-model key and the spawn-model verdict, so the two never disagree on a run.
function recordModels(record) {
  if (record.source === 'SubagentStop' || DIRECT_SOURCES.has(record.source)) {
    const models = Array.isArray(record.models) ? record.models.filter((model) => typeof model === 'string' && model !== '') : [];
    return [...new Set(models)].sort();
  }
  return typeof record.resolvedModel === 'string' && record.resolvedModel !== '' ? [record.resolvedModel] : [];
}

function joinModels(models) {
  return models.length ? models.join('+') : 'unknown';
}

function modelKey(record) {
  return joinModels(recordModels(record));
}

// ── Per-run join keys (`--rows`) ─────────────────────────────────────────────────────────────────
// The facts a caller needs to attribute one run to something outside telemetry — a plan's window, a
// release — and nothing else. The key set is a closed allowlist a test asserts exactly, so a field
// added to the store upstream cannot reach this surface without someone choosing it here: no sessionId,
// no path, no text (D-hook-telemetry-stops-at-observable-usage). One entry per run the
// summary counted and per direct segment it sealed, built from the records already gathered — `--rows`
// reads no file the summary did not already read, and changes nothing the summary emits without it.
// `agentId` is named here deliberately and is the one widening of this surface: it is the harness's
// own run identifier, already in `agent-runs.jsonl` and already matched on by `EXCLUDED_RUNS` in this
// module, and it is what lets a reader address one recorded run — a maintainer's
// `LEGACY_IDENTITY` remap keys on it (B-128, D-run-row-carries-the-agent-id). What the allowlist
// still excludes is unchanged: no sessionId, no path, no prompt, no response, no text.
// `repoKey`, `planSlug` and `planAmbiguous` join the allowlist for B-121: scope on **every** row,
// identity on the rows that declared one. Scope is unconditional because the rows coverage weighs
// hardest are exactly the ones with no slug — a key written only beside a slug would leave every miss
// unscoped, and a denominator that cannot separate a local miss from another project's run is not a
// measurement. All three are read back through the writers' own shapes (`REPO_KEY_SHAPE`,
// `PLAN_SLUG_SHAPE`), never a second pattern, so this surface admits exactly what was written.
export const RUN_ROW_KEYS = ['recordedAt', 'command', 'models', 'source', 'tokensTotal', 'apiRequests', 'toolCalls', 'durationMs', 'repoKey', 'planSlug', 'planAmbiguous', 'agentId'];

const shaped = (pattern, value) => (typeof value === 'string' && pattern.test(value) ? value : null);

// AN IDENTITY IS THE PAIR `(repoKey, planSlug)`, AND THE FALLBACK PRESERVES THE PAIR — it never
// resolves the two halves independently. A slug is a repository-local name and the store is
// machine-wide, so a slug is meaningless beside a key that did not arrive with it: taking the record's
// key and the label's slug whenever each happened to be present would publish a pair *no single writer
// declared*, and the join cannot tell such a row from a real one. That is a wrong attribution, which
// this design refuses everywhere, and the reason `record-session-telemetry.mjs` admits a declaration
// only on a matching key. The same rule, applied on read:
//
//   * NO LABEL — a direct segment, or an unlabelled subagent run. One writer, one row: the scope is
//     the record's, and the record's slug is published only if that same record also carries a valid
//     key. A slug on an unscoped row can form no pair and is dropped.
//   * A LABEL, AND THE RECORD IS SCOPED. The record is authoritative for where the run *executed*, so
//     its key is the row's. The label is the only source of `planSlug`, and its slug is published only
//     when the label's own key is valid and equal to the record's. A different key, an absent one or a
//     malformed one leaves the row scoped and *unidentified* — never ambiguous, because a declaration
//     that cannot be read is not a competing reading, and never carried across onto the other key.
//   * A LABEL, AND THE RECORD PREDATES SCOPING. With no key of its own the record can contradict
//     nothing, so the label supplies both halves — together, or neither.
//
// `planAmbiguous` is the direct writer's own verdict and is carried through untouched: it is a
// declared non-answer, and a key mismatch is not one of those.
function identityOf(record, label) {
  const recordKey = shaped(REPO_KEY_SHAPE, record.repoKey);
  if (label === null) {
    return { repoKey: recordKey, planSlug: recordKey === null ? null : shaped(PLAN_SLUG_SHAPE, record.planSlug) };
  }
  const labelKey = shaped(REPO_KEY_SHAPE, label.repoKey);
  const labelSlug = shaped(PLAN_SLUG_SHAPE, label.planSlug);
  if (recordKey === null) {
    return labelKey === null ? { repoKey: null, planSlug: null } : { repoKey: labelKey, planSlug: labelSlug };
  }
  return { repoKey: recordKey, planSlug: labelKey === recordKey ? labelSlug : null };
}

function runRow(record, command, models, label = null) {
  const identity = identityOf(record, label);
  const usage = wholeRunUsage(record);
  return {
    recordedAt: typeof record.recordedAt === 'string' && record.recordedAt !== '' ? record.recordedAt : null,
    command,
    models,
    source: typeof record.source === 'string' && record.source !== '' ? record.source : null,
    // A run carrying no whole-run usage is `null`, never 0: it is a gap in the sample, and a joiner
    // that summed it as zero would read a measurement failure as a free run (B-037).
    tokensTotal: usage ? usageTotal(usage) : null,
    apiRequests: finite(record.apiRequests) ? record.apiRequests : null,
    toolCalls: finite(record.toolUseCount) ? record.toolUseCount : null,
    durationMs: finite(record.durationMs) ? record.durationMs : null,
    repoKey: identity.repoKey,
    planSlug: identity.planSlug,
    // Literally `true` or absent on the wire (D-plan-identity-is-declared-not-inferred): anything
    // else is not an ambiguity this writer declared, so it reads as `false`. A key mismatch is
    // deliberately *not* one — an unusable identity is a scoped row that failed to declare, and
    // counting it as a second declaration would credit the writers with a disagreement neither had.
    planAmbiguous: record.planAmbiguous === true,
    // The record's own id, `null` when the run has none — a direct segment has no agent.
    agentId: typeof record.agentId === 'string' && record.agentId !== '' ? record.agentId : null,
  };
}

// Why a chosen subagent record carries no token sample (plan 2026-08-19-complete-run-telemetry):
// `fallbackOnly` — the run's only record is a PostToolUse (or legacy) row; `noUsage` — a SubagentStop
// whose transcript was missing (`runUsage: null`); `zeroUsage` — a `runUsage` that sums to zero. All
// three are runs; none is a sample. The header names each count so a median's floor is read with its gaps.
function tokenlessReason(record) {
  if (record.source !== 'SubagentStop') return 'fallbackOnly';
  if (!record.runUsage || typeof record.runUsage !== 'object') return 'noUsage';
  return usageTotal(record.runUsage) > 0 ? null : 'zeroUsage';
}

function isRun(record) {
  return (typeof record.agentType === 'string' && record.agentType !== '') || (record.runUsage != null && typeof record.runUsage === 'object');
}

function timestamp(value) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export async function summarizeTelemetry(files, options = {}) {
  const summary = {
    files: [],
    window: { first: null, last: null },
    runs: 0,
    withoutUsage: { total: 0, fallbackOnly: 0, noUsage: 0, zeroUsage: 0 },
    sampleThreshold: MIN_SAMPLE_RUNS,
    labelledWithoutRecord: { total: 0, byCommand: {} },
    byCommand: {},
    byAgentType: {},
    byModel: {},
    byCommandModel: {},
    spawnModel: { requested: 0, honored: 0, mismatch: 0, unrequested: 0 },
    skipped: { historicalNoise: 0, malformed: 0, duplicates: 0, supersededFallbacks: 0, excluded: 0 },
    direct: { segments: 0, sessions: 0, open: 0, superseded: 0, byCommand: {} },
    notes: [INTERRUPTED_RUNS_NOTE, DIRECT_SEGMENTS_NOTE],
  };
  const records = new Map(); // agentId → record (one per run; the whole-run row represents it)
  const segments = new Map(); // sessionId\0segment → last cumulative direct row
  const anonymous = []; // run records without an agentId — nothing to join or dedupe on
  const labels = new Map(); // agentId → { slug, requestedModel } (a repeat for one agentId is one label)
  const excluded = new Set(); // agentIds in EXCLUDED_RUNS actually seen — counted once per run, not per row
  const runRows = options.rows === true ? [] : null; // `--rows` only; null means the surface is off
  let legacyRows = 0;
  let first = null;
  let last = null;

  for (const file of files) {
    if (!(await exists(file))) {
      summary.notes.push(`file not found: ${file}`);
      continue;
    }
    let rows = 0;
    for await (const { row } of parsedRows(file)) {
      rows += 1;
      if (row === null) {
        summary.skipped.malformed += 1;
        continue;
      }
      // Excluded before anything else reads the row: every row of an excluded run — its label, its
      // fallback and its whole-run record — leaves the summary together, so no label survives into
      // `labelledWithoutRecord` and no timestamp of a throwaway run moves the reported window.
      if (typeof row.agentId === 'string' && EXCLUDED_RUNS.has(row.agentId)) {
        if (!excluded.has(row.agentId)) {
          excluded.add(row.agentId);
          summary.skipped.excluded += 1;
        }
        continue;
      }
      const at = timestamp(row.recordedAt);
      if (at !== null) {
        if (first === null || at < first) first = at;
        if (last === null || at > last) last = at;
      }
      if (row.source === 'AgentLabel') {
        if (typeof row.agentId === 'string' && row.agentId !== '' && typeof row.esqCommand === 'string' && row.esqCommand !== '' && !labels.has(row.agentId)) {
          labels.set(row.agentId, {
            slug: row.esqCommand,
            requestedModel: typeof row.requestedModel === 'string' && row.requestedModel !== '' ? row.requestedModel : null,
            repoKey: row.repoKey,
            planSlug: row.planSlug,
          });
        }
        continue;
      }
      if (DIRECT_SOURCES.has(row.source)) {
        const key = directKey(row);
        if (key === null) {
          summary.skipped.historicalNoise += 1;
          continue;
        }
        if (segments.has(key)) summary.direct.superseded += 1;
        segments.set(key, row);
        continue;
      }
      if (row.source === undefined) {
        legacyRows += 1;
        row.source = 'PostToolUse';
      }
      if (!isRun(row)) {
        summary.skipped.historicalNoise += 1;
        continue;
      }
      const agentId = typeof row.agentId === 'string' && row.agentId !== '' ? row.agentId : null;
      if (agentId === null) {
        anonymous.push(row);
        continue;
      }
      const seen = records.get(agentId);
      if (!seen) {
        records.set(agentId, row);
        continue;
      }
      // The writer's own rule, applied on read (D-whole-run-record-supersedes-fallback): a row carrying
      // whole-run usage represents the run and the fallback row it replaces is `superseded`, not a
      // duplicate — the writer appends it over a fallback on purpose, so two rows for one agentId are
      // the expected shape of a run whose PostToolUse landed first. A repeat of the same quality (two
      // fallback rows, two whole-run rows, a whole-run row then a fallback) is a genuine duplicate.
      if (carriesWholeRunUsage(row) && !carriesWholeRunUsage(seen)) {
        summary.skipped.supersededFallbacks += 1;
        records.set(agentId, row);
      } else {
        summary.skipped.duplicates += 1;
      }
    }
    summary.files.push({ file, rows });
  }

  const byCommand = {};
  const byAgentType = {};
  const byModel = {};
  const byCommandModel = {};
  const spawns = {}; // byCommandModel key → { requested: Set, honored, mismatch, unrequested }
  const bucket = (groups, key) => (groups[key] ||= emptyGroup());
  for (const [agentId, record] of [...records.entries(), ...anonymous.map((record) => [null, record])]) {
    summary.runs += 1;
    const reason = tokenlessReason(record);
    if (reason !== null) {
      summary.withoutUsage.total += 1;
      summary.withoutUsage[reason] += 1;
    }
    const label = agentId === null ? undefined : labels.get(agentId);
    const commandKey = label ? `esq:${label.slug}` : 'unlabelled';
    const models = recordModels(record);
    contribute(bucket(byCommand, commandKey), record);
    contribute(bucket(byAgentType, typeof record.agentType === 'string' && record.agentType !== '' ? record.agentType : 'unknown'), record);
    contribute(bucket(byModel, joinModels(models)), record);
    // Asked × ran: the same group numbers keyed by command and model together, plus what the
    // orchestrator asked for and whether the run honored it (B-042, spawnModelVerdict — the one rule).
    if (runRows) runRows.push(runRow(record, commandKey, models, label ?? null));
    const crossKey = `${commandKey} · ${joinModels(models)}`;
    contribute(bucket(byCommandModel, crossKey), record);
    const spawn = (spawns[crossKey] ||= { requested: new Set(), honored: 0, mismatch: 0, unrequested: 0 });
    if (label) {
      const verdict = spawnModelVerdict(label.requestedModel, models);
      if (verdict === 'unrequested') {
        spawn.unrequested += 1;
        summary.spawnModel.unrequested += 1;
      } else {
        spawn.requested.add(label.requestedModel);
        summary.spawnModel.requested += 1;
        if (verdict !== null) {
          spawn[verdict] += 1;
          summary.spawnModel[verdict] += 1;
        }
      }
    }
  }
  for (const [agentId, label] of labels) {
    if (records.has(agentId)) continue;
    summary.labelledWithoutRecord.total += 1;
    const key = `esq:${label.slug}`;
    summary.labelledWithoutRecord.byCommand[key] = (summary.labelledWithoutRecord.byCommand[key] || 0) + 1;
  }
  summary.byCommand = seal(byCommand);
  summary.byAgentType = seal(byAgentType);
  summary.byModel = seal(byModel);
  summary.byCommandModel = sealCommandModel(byCommandModel, spawns);
  const directByCommand = {};
  const directVia = {};
  const directModels = {};
  const directSessions = new Set();
  for (const row of segments.values()) {
    const key = `esq:${row.esqCommand}`;
    summary.direct.segments += 1;
    directSessions.add(row.sessionId);
    if (row.closedBy === null || row.closedBy === undefined) summary.direct.open += 1;
    contribute(bucket(directByCommand, key), row);
    const via = row.via === 'skill-tool' ? 'skill-tool' : 'typed';
    (directVia[key] ||= {})[via] = (directVia[key][via] || 0) + 1;
    const models = recordModels(row);
    if (runRows) runRows.push(runRow(row, key, models));
    for (const model of models) (directModels[key] ||= new Set()).add(model);
  }
  summary.direct.sessions = directSessions.size;
  summary.direct.byCommand = sealDirect(directByCommand, directVia, directModels);
  const environment = options.environment ?? process.env;
  if (telemetryOptedOut(environment)) summary.notes.push(TELEMETRY_OPT_OUT_NOTE);
  if (environment.CLAUDE_PLUGIN_DATA) summary.notes.push(PLUGIN_DATA_ENV_IGNORED_NOTE);
  summary.window = {
    first: first === null ? null : new Date(first).toISOString(),
    last: last === null ? null : new Date(last).toISOString(),
  };
  if (legacyRows > 0) summary.notes.push(`${legacyRows} row${legacyRows === 1 ? '' : 's'} predate the \`source\` field, read as PostToolUse`);
  if (options.searchedRoot && files.length === 0) summary.notes.push(`no telemetry file found under ${options.searchedRoot}`);
  // Appended last, so the object every existing consumer reads is byte-identical without `--rows`.
  // Chronological, because a temporal join walks windows in order; ties broken by command so two
  // runs recorded in the same second come out in the same order on every machine.
  if (runRows) {
    runRows.sort((a, b) => (a.recordedAt ?? '').localeCompare(b.recordedAt ?? '') || a.command.localeCompare(b.command));
    summary.runRows = runRows;
  }
  return summary;
}

// ── Spawn model assertion (B-042) ─────────────────────────────────────────────────────────────────
// Whether the model a run actually used is the one the orchestrator asked for. The evidence is the
// run's `models[]` — the transcript's request lines, the same evidence the probe judged from — and
// nothing weaker when it is there. One definition, exported: the summary's by-command×model table
// (Phase 2) reuses it rather than restating the family rule.
//
// `requested` is what the Agent call's `model` field said: an alias (`opus` ⇔ every entry of
// `models[]` starts with `claude-opus-`), or a full id (equal to every entry after stripping a `[1m]`
// long-context suffix from both sides — the explicit alias is billed under `claude-opus-5[1m]` while
// the request lines say `claude-opus-5`, Claude Code 2.1.235, 2026-08-19). Two families in `models[]`
// are a mismatch whatever was asked: the run did not stay on one model.
const MODEL_ALIASES = new Set(['opus', 'sonnet', 'haiku', 'fable']);
const LONG_CONTEXT_SUFFIX = /\[1m\]$/;

function stripSuffix(model) {
  return String(model).replace(LONG_CONTEXT_SUFFIX, '');
}

export function spawnModelVerdict(requested, models) {
  if (typeof requested !== 'string' || requested === '' || requested === 'inherit') return 'unrequested';
  const actual = Array.isArray(models) ? models.filter((model) => typeof model === 'string' && model !== '') : [];
  if (actual.length === 0) return null;
  const matches = MODEL_ALIASES.has(requested)
    ? (model) => model.startsWith(`claude-${requested}-`)
    : (model) => stripSuffix(model) === stripSuffix(requested);
  return actual.every(matches) ? 'honored' : 'mismatch';
}



export function humanCount(value) {
  if (value === null || value === undefined) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function humanDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  const seconds = ms / 1000;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  const whole = Math.round(seconds); // round first, so 59.9s reads 1m00s and never 60s
  if (whole >= 3600) return `${Math.floor(whole / 3600)}h${String(Math.floor((whole % 3600) / 60)).padStart(2, '0')}m`;
  if (whole >= 60) return `${Math.floor(whole / 60)}m${String(whole % 60).padStart(2, '0')}s`;
  return `${whole}s`;
}

// `extras` adds trailing columns: each its header and a function of the group giving the cell.
function table(title, label, groups, extras = []) {
  const header = [label, 'runs', 'out tok Σ', 'out tok med', 'all tok Σ', 'dur med', 'tools med', 'trips med', 'calls/trip', ...extras.map((extra) => extra.header)];
  // A run whose only record is a PostToolUse fallback is counted but carries no whole-run tokens;
  // when that happens the runs cell says how many runs the token columns actually sum. A provisional
  // row marks the runs cell once, directly after the first number (`4*`, `11* (9 w/ tokens)`) — never
  // a separate column, so the cell stays one token under a two-space split.
  const runsCell = (group) => {
    const marked = `${group.runs}${group.provisional ? '*' : ''}`;
    return group.tokens.runs < group.runs && group.tokens.runs > 0 ? `${marked} (${group.tokens.runs} w/ tokens)` : marked;
  };
  const rows = Object.entries(groups).map(([key, group]) => [
    key,
    runsCell(group),
    group.tokens.runs ? humanCount(group.tokens.output) : '—',
    humanCount(group.tokens.medianOutput),
    group.tokens.runs ? humanCount(group.tokens.total) : '—',
    humanDuration(group.durationMs.median),
    humanCount(group.toolCalls.median),
    humanCount(group.apiRequests.median),
    // Two decimals, never `humanCount`: the figures being compared sit between 1.0 and 1.3 (esq's
    // 1.068 against the same machine's non-esq 1.243), which one decimal cannot separate. A group
    // with no run carrying both counts prints `—` rather than a ratio over half a population.
    group.callsPerTrip === null ? '—' : group.callsPerTrip.toFixed(2),
    ...extras.map((extra) => extra.cell(group)),
  ]);
  if (rows.length === 0) rows.push(['(none)', ...header.slice(1).map(() => '—')]);
  const widths = header.map((_, column) => Math.max(...[header, ...rows].map((row) => [...row[column]].length)));
  const render = (row) => row.map((cell, column) => (column === 0 ? cell.padEnd(widths[column]) : cell.padStart(widths[column]))).join('  ').trimEnd();
  return [title, `  ${render(header)}`, ...rows.map((row) => `  ${render(row)}`)];
}

function shortDate(iso) {
  return iso ? iso.slice(0, 10) : '—';
}

function home(file) {
  const root = os.homedir();
  return root && file.startsWith(`${root}${path.sep}`) ? `~${file.slice(root.length)}` : file;
}

export function renderTelemetrySummary(summary) {
  const { total: withoutUsage, fallbackOnly, noUsage, zeroUsage } = summary.withoutUsage;
  const withUsage = summary.runs - withoutUsage;
  const { historicalNoise, malformed, duplicates, supersededFallbacks, excluded } = summary.skipped;
  const files = summary.files.length ? summary.files.map(({ file, rows }) => `${home(file)} (${rows} rows)`) : ['(none)'];
  const out = ['esq telemetry summary'];
  out.push(`  files:    ${files[0]}`);
  for (const file of files.slice(1)) out.push(`            ${file}`);
  out.push(`  window:   ${shortDate(summary.window.first)} → ${shortDate(summary.window.last)}`);
  out.push(`  runs:     ${summary.runs} recorded · ${withUsage} with usage · ${withoutUsage} without usage (${fallbackOnly} fallback-only / ${noUsage} no usage / ${zeroUsage} zero usage) · ${historicalNoise + malformed + duplicates + supersededFallbacks + excluded} skipped (${historicalNoise} noise / ${malformed} malformed / ${duplicates} duplicates / ${supersededFallbacks} superseded fallbacks / ${excluded} excluded)`);
  // The session writer's rows: one segment per esq command run in a main session, cumulative per
  // Stop (the superseded count is the earlier rows of the same segment). An open segment has no
  // closing marker yet — the session is still running, or it ended without a SessionEnd.
  const { segments, sessions, open, superseded } = summary.direct;
  out.push(`  direct:   ${segments} segment${segments === 1 ? '' : 's'} in ${sessions} session${sessions === 1 ? '' : 's'} · ${open} open (no closing marker — running, or the session ended without SessionEnd) · ${superseded} superseded`);
  out.push(`  provisional: * fewer than ${summary.sampleThreshold} runs with tokens — no tier or budget is argued from that row`);
  // AgentLabel is written at spawn time and the run's record at SubagentStop, so a label without a
  // record is a run still in flight — or one that stopped without a row (B-036) — never a broken join.
  const unrecorded = Object.entries(summary.labelledWithoutRecord.byCommand).map(([key, count]) => `${key} ${count}`).join(', ');
  out.push(`  labelled but unrecorded: ${summary.labelledWithoutRecord.total}${unrecorded ? ` (${unrecorded})` : ''}${summary.labelledWithoutRecord.total > 0 ? ' — still running, or interrupted (B-036)' : ''}`);
  // Asked × ran over the labelled runs (B-042). Printed even when every count is zero: a zero says
  // the orchestrators are not yet passing a `model` field, and every worker took the session model.
  const { requested, honored, mismatch, unrequested } = summary.spawnModel;
  out.push(`  spawn model: ${requested} requested (${honored} honored / ${mismatch} mismatch) · ${unrequested} spawned without a model field`);
  for (const note of summary.notes) out.push(`  note:     ${note}`);
  out.push('');
  out.push(...table('by command', 'command', summary.byCommand), '');
  out.push(...table('by agent type', 'agent type', summary.byAgentType), '');
  out.push(...table('by model', 'model', summary.byModel), '');
  // `requested` reads `opus ✔` (asked, honored), `opus ✖` (asked, ran on something else), `opus`
  // alone (asked, no model evidence), `—` (no model field on the spawn — the session model, inherited).
  const requestedCell = (group) => (group.requested === null ? '—' : `${group.requested}${group.verdict === 'honored' ? ' ✔' : group.verdict === 'mismatch' ? ' ✖' : ''}`);
  out.push(...table('by command × model', 'command · model', summary.byCommandModel, [{ header: 'requested', cell: requestedCell }]), '');
  out.push(...table('direct sessions · by command', 'command', summary.direct.byCommand, [
    { header: 'model', cell: (group) => group.models },
    { header: 'typed/skill', cell: (group) => `${group.via.typed}/${group.via['skill-tool']}` },
  ]));
  return `${out.join('\n')}\n`;
}
