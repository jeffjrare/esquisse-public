// capture-schema.mjs — the one place that decides what a billed capture may hold.
//
// The four billed evidence scripts (`scripts/smoke-work-capture.mjs`,
// `scripts/smoke-journeys.mjs`, `scripts/probe-model-pins.mjs` and
// the retired background-lifecycle probe) wrote a capture
// file that is checked into a public repository. Everything on the machine side of that file is untrusted for
// this purpose: the harness may add a field to any event at any version, and the
// model may say anything in its prose. So the contract runs one direction only —
//
//   1. Reduce at construction. A record is built by `makeRecord(type, fields)`,
//      which returns only the keys this table declares, at every depth. A field
//      the source object carries and the table does not is dropped there, by
//      construction, including one a future Claude Code adds.
//   2. Refuse an unknown or malformed record. `validateRecord` refuses a type this
//      table does not know and a record missing a required key. Its diagnostic
//      names key names, never a value.
//   3. `assertSanitized` is an internal-bypass check, not a harness-field
//      detector. It fails when a record did not come from `makeRecord` — a new
//      `capture.push` site, a merge that reinstated the stream. It cannot detect a
//      field rule 1 already dropped, and does not claim to.
//
// On failure nothing unreduced is written anywhere: no sibling file, no scratch
// file, no failure artifact, no diagnostic carrying a field value. What survives
// is the verified prefix plus one `capture-error` record in the offending record's
// place. Privacy outranks sunk evidence.
//
// Dependency-free, no filesystem reads, one write path — and that write path has
// no default destination behaviour: `writeCapture` requires an explicit `mode`,
// so the branch that replaces an existing capture can only be reached by name.
// `openCapture` is that same path expressed on a stream rather than a buffer, for
// a billed run that produces its records over minutes: it claims the destination
// before the first spawn and appends through the same reduction, so an
// interruption costs the rows it had not yet produced and never the ones it had.

import { randomBytes } from 'node:crypto';
import { closeSync, openSync, renameSync, unlinkSync, writeFileSync, writeSync } from 'node:fs';
import path from 'node:path';

// ------------------------------------------------------------------ field kinds

/** A value persisted as it stands: a number, a string, a boolean, an array of them. */
export const LEAF = { kind: 'leaf' };
/** An object reduced to exactly `fields`. */
export const shape = (fields) => ({ kind: 'shape', fields });
/** An array whose every element is reduced by `item`. */
export const list = (item) => ({ kind: 'list', item });
/** An object with caller-chosen keys whose every value is reduced by `value`. */
export const map = (value) => ({ kind: 'map', value });

// -------------------------------------------------------------------- the table
//
// Every persisted record type, and nothing else is persisted. No harness event —
// no `system`, `assistant`, `result`, `user` or `rate_limit_event` record, and no
// `{type}`-only remainder for the ones no judge reads.
//
// Each field is here because a named consumer reads it. Where the plan's table and
// the judge disagreed, the judge won: `smoke-evidence.commits[].hash` is kept
// because `judgeInline` cites the code commit's short hash into the anchor check
// (`smoke-work-capture.mjs:263`). It is a scratch repository's hash, not identity.

export const SCHEMA = {
  // `splitCapture` groups on `branch`; `rowFor(branch)` resolves the judge.
  'smoke-row': {
    required: ['branch'],
    fields: { branch: LEAF },
  },

  'smoke-evidence': {
    required: ['exit', 'timedOut', 'elapsedMs', 'says', 'commits', 'backlogRows', 'anchors', 'dirty'],
    fields: {
      // the run's own outcome, and the `elapsed` column
      exit: LEAF,
      timedOut: LEAF,
      elapsedMs: LEAF,
      // `judgeEvidence`'s cost / turns / spawns / cc columns
      cost: LEAF,
      turns: LEAF,
      spawns: LEAF,
      cc: LEAF,
      // the corroboration column, evaluated at capture time. Replaces the model's
      // prose: `row.corroboration` is one regex, and its answer is a boolean.
      says: LEAF,
      // `subjects()`, `filesEqual()`, the `commits` count, and `judgeInline`'s
      // "the execution log cites the code commit" check, which reads `hash`.
      commits: list(shape({ hash: LEAF, subject: LEAF, files: LEAF })),
      // `findRow`/`judgeDuplicate`/`judgeRouteCaptures`/`judgeInline`; the columns
      // are the seed backlog's own header row.
      backlogRows: list(shape({
        id: LEAF, date: LEAF, type: LEAF, pri: LEAF, summary: LEAF,
        source: LEAF, epic: LEAF, version: LEAF, status: LEAF,
      })),
      // `planFiles()` and `judgeInline`'s section and execution-log assertions
      anchors: list(shape({ path: LEAF, text: LEAF })),
      // `judgeInline`: `esq lane` answered "direct" on the anchor
      lane: shape({ exit: LEAF, stdout: LEAF }),
      // `judgeInline`: `node check.mjs` in the scratch root
      check: shape({ exit: LEAF }),
      // `judgeRefuses`: the tree is clean
      dirty: LEAF,
    },
  },

  // ---------------------------------------------------------------- journeys
  //
  // B-032's six orchestration journeys (`scripts/smoke-journeys.mjs`). Same two
  // shapes as the P-07 pair and the same grouping — `splitCapture` groups on
  // `branch`, `rowFor(branch)` resolves the judge — but a different evidence
  // record, because a journey's contract is a *ledger's* state and not a
  // backlog's: what the execution log now says, which commits it cites, and
  // whether the plan's lane moved.
  'journey-row': {
    required: ['branch'],
    fields: { branch: LEAF },
  },

  'journey-evidence': {
    required: ['exit', 'timedOut', 'elapsedMs', 'says', 'commits', 'logEntries', 'dirty'],
    fields: {
      // the run's own outcome, and the `elapsed` column
      exit: LEAF,
      timedOut: LEAF,
      elapsedMs: LEAF,
      // `judgeEvidence`'s cost / turns / spawns / cc columns
      cost: LEAF,
      turns: LEAF,
      spawns: LEAF,
      cc: LEAF,
      // the corroboration column, answered by the row's regex at capture time.
      says: LEAF,
      // which harness and which model this verdict was actually taken on, so a
      // later session can tell what the evidence is evidence *of*. `cc` is the
      // column; this is the pair, kept together the way `probe-evidence` keeps it.
      init: shape({ model: LEAF, claude_code_version: LEAF }),
      // every judge here counts commits, reads their subjects, and asserts which
      // files a commit was allowed to touch — "no new code commit" is a file list.
      commits: list(shape({ hash: LEAF, subject: LEAF, files: LEAF })),
      // journey 5 (U-05): the model each main-conversation spawn asked for, joined
      // to the `spawns` count. Declared here so the table is opened once.
      spawnModels: list(shape({ model: LEAF, subagentType: LEAF })),
      // which plan the run worked. Its *text* is deliberately not declared: no
      // judge reads it — `logEntries` and `citedCommits` below are the ledger
      // facts a verdict rests on — and the file it would publish carries the
      // execution-log entry the model wrote, which is prose by another route.
      plan: shape({ path: LEAF }),
      // its execution log's `### Phase N — …` heading lines, in order. The heading
      // is what classifies an entry (`completed` vs `⏸ awaiting manual
      // verification`), so it is the judged artifact and not a summary of one.
      logEntries: list(LEAF),
      // the short hashes an entry's `**Commits:**` line cites, each resolved
      // against the scratch repo: a reconciliation must cite commits that already
      // existed, which is a hash lookup and not a claim.
      citedCommits: list(shape({ short: LEAF, resolved: LEAF })),
      // `esq lane` on the harvested plan, already parsed. Journey 3 (U-06) reads
      // the escalation back the way the *next orchestrator* would: the axis that
      // rose, the lane the block still records, and the effective lane the file
      // now resolves to. The raw stdout is deliberately not declared — it carries
      // each escalation's `reason`, a sentence the model wrote into the ledger,
      // and `logEntries` exists precisely so that prose does not reach this file.
      lane: shape({
        exit: LEAF,
        lane: LEAF,
        uncertainty: LEAF,
        risk: LEAF,
        recorded: LEAF,
        source: LEAF,
        escalations: list(shape({ phase: LEAF, axis: LEAF, to: LEAF })),
      }),
      // The two background-lifecycle facts a teardown judge rests on (B-085/B-087),
      // and the whole of what this file learned about them. `backgroundLaunches`
      // is how many launches the run asked to run in the background; the number
      // alone is what distinguishes "gated a real background check" from "ran it
      // in the foreground and called it one". `survivingProcesses` is the pids
      // still alive in the run's own scratch root when it concluded — a list so
      // that an empty one is a *read* teardown and an absent one is a platform
      // that could not look. The bounded-gate half needs no field: `timedOut`,
      // `elapsedMs` and `turns` already say a run concluded inside its own
      // deadline in a bounded number of turns.
      //
      // Nothing here carries a harness registration or a post-result delivery,
      // and nothing should: on 2.1.265 no primitive clears a registration
      // (`M-background-lifecycle-2026-09-08`), so a field for either would be
      // collected for no consumer and widen this file for nothing. That evidence
      // lives in `docs/evidence/2026-09-08-background-lifecycle.jsonl`, once.
      backgroundLaunches: LEAF,
      survivingProcesses: list(LEAF),
      // `esq validate` in the scratch root: the ledgers still parse. Its findings
      // are not persisted — the verdict is the boolean, and a finding is prose.
      validate: shape({ exit: LEAF, valid: LEAF }),
      // `node check.mjs` in the scratch root: the toy project's own verification
      check: shape({ exit: LEAF }),
      // the tree is clean
      dirty: LEAF,
    },
  },

  // `withDefaults` + `judgeRow`. `prompt` is read by no judge and is dropped.
  'probe-row': {
    required: ['path', 'scope'],
    fields: {
      path: LEAF, scope: LEAF, kind: LEAF, session: LEAF, expect: LEAF, background: LEAF,
    },
  },

  'probe-evidence': {
    required: ['exit', 'main', 'subagents', 'spawns', 'usage', 'sawModel', 'replied'],
    fields: {
      exit: LEAF,
      // `judgeRow`, `verdict`, `auxColumn`
      main: LEAF,
      subagents: map(LEAF),
      // `judgeAgentModel` joins these to the subagent lines by spawn id
      spawns: map(shape({ model: LEAF, background: LEAF, subagentType: LEAF })),
      usage: LEAF,
      // the live path refuses a run whose stream carried no `message.model`
      sawModel: LEAF,
      // the `system/init model` and `cc` columns
      init: shape({ model: LEAF, claude_code_version: LEAF }),
      // gating, and a boolean: `LIVENESS[row.kind]` is known at capture time, so
      // the regex runs there and only its answer is persisted.
      replied: LEAF,
    },
  },

  // ------------------------------------------------- background lifecycle
  //
  // B-085/B-087's probe, removed 2026-09-22; the shape is kept so its checked-in captures still parse. Three rows,
  // one short headless run each, asking what a *worker* can call to collect and
  // tear down a background task and what its parent can read around a
  // synchronous `Agent` return. Same two shapes and the same grouping as the
  // pair above — `splitCapture` groups on the row marker, `judgeRow` resolves the
  // verdict — but a different evidence record, because what is judged here is a
  // *lifecycle*: which primitives resolved, which registrations were still live,
  // and what arrived after the run had concluded.
  'background-row': {
    required: ['id', 'path'],
    fields: {
      // `P-A` | `P-B` | `P-C` — the join key, and what `--only` selects on.
      id: LEAF, path: LEAF,
      // the B-085/B-087 questions this row is spent on, as their registry ids
      // (`B-087 Q1`, …). Constants of the probe, printed in the verdict table.
      questions: LEAF,
    },
  },

  'background-evidence': {
    required: ['exit', 'init', 'answers', 'toolCalls', 'sawModel'],
    fields: {
      // the run's own outcome, and the `elapsed` and `cost` columns
      exit: LEAF,
      timedOut: LEAF,
      elapsedMs: LEAF,
      cost: LEAF,
      turns: LEAF,
      spawns: LEAF,
      // the live path refuses a run whose stream carried no assistant line
      sawModel: LEAF,
      // which harness and which model this reading was taken on. `esq evidence`
      // reads `init.claude_code_version` to date the capture against the
      // installed Claude Code, so a probe capture without it registers nothing.
      init: shape({ model: LEAF, claude_code_version: LEAF }),
      // How many times each *declared* lifecycle tool name was actually called,
      // in the main conversation and under a spawn. The keys are the probe's own
      // allowlist (`TOOL_NAMES`), never whatever the stream happened to carry, so
      // this is the structural cross-check on the row's self-report and not a
      // second copy of the harness's tool list.
      // Named `toolCalls` rather than `tools`: `tools` is the ambient tool list a
      // `system/init` event carries, and the privacy walk in tests/capture-schema/
      // refuses that key at every depth. A declared field must not be the reason a
      // sensitive-key rule acquires an exemption.
      toolCalls: shape({ main: map(LEAF), worker: map(LEAF) }),
      // The row's answers, keyed by the probe's declared question keys and
      // reduced to a boolean or a whole number at capture time — the same
      // discipline as `probe-evidence.replied`, widened from one key to a
      // table. A key the run did not answer is absent; nothing else survives of
      // what the model wrote.
      answers: map(LEAF),
      // how many of the row's declared keys the run actually answered
      answered: LEAF,
    },
  },

  // The failure path below. Key names only — never a field value.
  'capture-error': {
    required: ['index', 'recordType', 'missing', 'reason'],
    fields: { index: LEAF, recordType: LEAF, missing: LEAF, reason: LEAF },
  },
};

export const RECORD_TYPES = Object.keys(SCHEMA);

// ------------------------------------------------------------------- reduction

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isPresent = (o, k) => Object.prototype.hasOwnProperty.call(o, k) && o[k] !== undefined;

function reduce(spec, value) {
  if (spec === LEAF || spec.kind === 'leaf') return value;
  if (spec.kind === 'list') return Array.isArray(value) ? value.map((v) => reduce(spec.item, v)) : null;
  if (spec.kind === 'map') {
    if (!isPlainObject(value)) return null;
    const out = {};
    for (const key of Object.keys(value)) out[key] = reduce(spec.value, value[key]);
    return out;
  }
  // shape
  if (!isPlainObject(value)) return null;
  const out = {};
  for (const key of Object.keys(spec.fields)) {
    if (isPresent(value, key)) out[key] = reduce(spec.fields[key], value[key]);
  }
  return out;
}

// Membership is held outside the object, so it cannot be spread, serialized or
// copied onto a record that did not go through here.
const constructed = new WeakSet();

/**
 * The only way a record is built. Returns a frozen `{ type, …declared keys }`,
 * carrying no key this table does not declare, at any depth.
 */
export function makeRecord(type, fields = {}) {
  const entry = SCHEMA[type];
  if (!entry) throw new TypeError(`capture-schema: no such record type: ${safeType(type)}`);
  if (!isPlainObject(fields)) throw new TypeError(`capture-schema: ${type} fields must be an object`);
  const record = { type };
  for (const key of Object.keys(entry.fields)) {
    if (isPresent(fields, key)) record[key] = reduce(entry.fields[key], fields[key]);
  }
  Object.freeze(record);
  constructed.add(record);
  return record;
}

/** True when `record` is the object `makeRecord` returned, and not a copy of one. */
export const isConstructed = (record) => isPlainObject(record) && constructed.has(record);

// ------------------------------------------------------------------ validation

// A record's own `type` is the one string from a record that a diagnostic quotes,
// and only when it looks like a type name. Anything else is named as its shape.
function safeType(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(value) ? value : '<non-conforming>';
}

/**
 * `{ ok }` on a record this table knows and whose required keys are all present;
 * otherwise `{ ok: false, recordType, missing, reason }`. `missing` holds key
 * names from this table. No field value ever appears in the result.
 */
export function validateRecord(record) {
  if (!isPlainObject(record)) {
    return { ok: false, recordType: '<non-conforming>', missing: [], reason: 'not an object' };
  }
  const entry = SCHEMA[record.type];
  if (!entry) {
    return { ok: false, recordType: safeType(record.type), missing: [], reason: 'unknown record type' };
  }
  const missing = entry.required.filter((key) => !isPresent(record, key));
  if (missing.length) {
    return { ok: false, recordType: record.type, missing, reason: 'missing required key(s)' };
  }
  return { ok: true, recordType: record.type, missing: [] };
}

/**
 * The internal-bypass check. `{ ok }` when every record came from `makeRecord`;
 * otherwise the index of the first that did not. It says what it is: this cannot
 * see a field `makeRecord` already dropped, and never claims to.
 */
export function assertSanitized(records) {
  const all = Array.isArray(records) ? records : [];
  for (let i = 0; i < all.length; i++) {
    if (!isConstructed(all[i])) {
      return {
        ok: false,
        index: i,
        recordType: isPlainObject(all[i]) ? safeType(all[i].type) : '<non-conforming>',
        missing: [],
        reason: 'record bypassed makeRecord (internal bypass, not a harness field)',
      };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------- the one write

const serialize = (records) => records.map((r) => JSON.stringify(r)).join('\n') + '\n';

/**
 * The verdict, with no filesystem in it. Validates in order — construction
 * first, then schema — and returns what a capture is *allowed* to hold:
 * `{ status, records, error }`, where `records` is the whole array when every
 * record passed, or the verified prefix `0..i-1` plus one `capture-error` in
 * the offending record's place. `status` is non-zero when a record failed.
 *
 * A caller can therefore learn a capture's sanitization verdict before choosing
 * where — or whether — it goes. Nothing here reads or writes a file.
 */
export function planCapture(records) {
  const all = Array.isArray(records) ? records : [];
  for (let i = 0; i < all.length; i++) {
    const bypass = assertSanitized([all[i]]);
    const verdict = bypass.ok ? validateRecord(all[i]) : bypass;
    if (verdict.ok) continue;
    const error = {
      index: i,
      recordType: verdict.recordType,
      missing: verdict.missing || [],
      reason: verdict.reason,
    };
    return {
      status: 1,
      records: [...all.slice(0, i), makeRecord('capture-error', error)],
      error,
    };
  }
  return { status: 0, records: all, error: null };
}

const WRITE_MODES = new Set(['exclusive', 'atomic', 'overwrite']);

/**
 * The only path to disk. `mode` is required and has no default, so a caller
 * cannot reach the destructive branch by omission:
 *
 *   - `exclusive` — `wx`. On `EEXIST` writes nothing and reports the collision.
 *   - `atomic`    — an exclusively-created, unpredictably-named temp file in the
 *                   *target's own directory* (never `os.tmpdir()`, or `rename`
 *                   becomes `EXDEV`), renamed into place only once the whole
 *                   capture has serialized, and unlinked on every failure path.
 *   - `overwrite` — the legacy branch, reachable only by naming it.
 *
 * Returns `{ status, written, error, mode, file, collision }`; `status` is
 * non-zero when a record failed its schema, when the mode is missing or unknown,
 * or when the destination could not be taken.
 */
export function writeCapture(file, records, options = {}) {
  const mode = isPlainObject(options) ? options.mode : undefined;
  if (!WRITE_MODES.has(mode)) {
    console.error(`capture-schema: writeCapture needs an explicit mode (${[...WRITE_MODES].join(', ')})`
      + `, got ${safeType(mode)} — wrote nothing, anywhere: ${file}`);
    return { status: 1, written: 0, error: null, mode: null, file, collision: null };
  }

  const planned = planCapture(records);

  // Serialization is inside the guard on purpose: `writeCapture` is called from a
  // `finally` on the billed path, where a throw would mask the run's own outcome.
  // It fails closed instead — nothing written, a non-zero status, and a diagnostic
  // naming the failure's code, never a field value.
  let placed;
  try {
    placed = place(file, serialize(planned.records), mode);
  } catch (err) {
    console.error(`capture-schema: could not write the capture (${mode}): ${err.code || err.name}`
      + ` — wrote nothing: ${file}`);
    return { status: 1, written: 0, error: planned.error, mode, file, collision: null };
  }
  if (placed.collision) {
    console.error(`capture-schema: ${file} already exists — wrote nothing, and the file is untouched.`
      + ' Pass a fresh --out.');
    return { status: 1, written: 0, error: planned.error, mode, file, collision: file };
  }

  const written = planned.records.length;
  if (planned.error) {
    const { index, recordType, missing, reason } = planned.error;
    console.error(`capture-schema: record ${index} (${recordType}) ${reason}`
      + `${missing.length ? `: ${missing.join(', ')}` : ''}`
      + ` — wrote the ${index} verified record(s) and a capture-error, and nothing else: ${file}`);
  } else {
    console.error(`capture saved: ${file}`);
  }
  return { status: planned.status, written, error: planned.error, mode, file, collision: null };
}

/**
 * The append-safe half of the one write path, for a billed run whose records
 * arrive over minutes rather than all at once.
 *
 * It claims `file` with `wx` *before* the caller spends anything: a destination
 * that already holds a capture is refused here, at zero runs billed, and left
 * byte-identical — `{ collision }` on the returned handle is that verdict, and it
 * is readable before the first spawn. Then each `append(records)` reduces through
 * the same `planCapture` as `writeCapture` and writes the reduced JSONL lines
 * straight to the held descriptor. No temp file, no sibling, no rewrite: a run
 * killed mid-flight leaves every record already appended on disk and parsable.
 *
 * The failure contract is the module's, unchanged: on the first record that fails
 * its schema what survives is the verified prefix plus one `capture-error` in the
 * offending record's place — here the prefix is already on disk, the
 * `capture-error` is appended after it at its true index in the whole stream, and
 * the descriptor closes. Every later `append` is a no-op.
 *
 * Returns `{ file, collision, ok, append, close }`; `close()` returns the same
 * `{ status, written, error, file, collision }` shape `writeCapture` does.
 */
export function openCapture(file) {
  let fd = null;
  let live = false;
  let status = 0;
  let written = 0;
  let error = null;
  let collision = null;

  try {
    fd = openSync(file, 'wx', 0o644);
    live = true;
  } catch (err) {
    status = 1;
    if (err.code === 'EEXIST') {
      collision = file;
      console.error(`capture-schema: ${file} already exists — wrote nothing, and the file is untouched.`
        + ' Pass a fresh --out.');
    } else {
      console.error(`capture-schema: could not claim the capture: ${err.code || err.name}`
        + ` — wrote nothing: ${file}`);
    }
  }

  const shut = () => {
    if (!live) return;
    live = false;
    // Whatever was already written is already on disk; a failed close cannot take
    // it back, and there is no temp file whose fate a close decides.
    try { closeSync(fd); } catch { /* already gone */ }
  };

  const state = () => ({ status, written, error, file, collision });

  function append(records) {
    if (!live) return state();
    const planned = planCapture(Array.isArray(records) ? records : []);
    // `planCapture` indexes within the batch it was handed; on disk the offending
    // record's index is its position in the whole stream.
    const failure = planned.error
      ? { ...planned.error, index: written + planned.error.index }
      : null;
    const out = failure
      ? [...planned.records.slice(0, -1), makeRecord('capture-error', failure)]
      : planned.records;

    if (out.length) {
      try {
        writeSync(fd, serialize(out));
      } catch (err) {
        console.error(`capture-schema: could not append to the capture (${err.code || err.name})`
          + ` — kept the ${written} record(s) already written: ${file}`);
        status = 1;
        shut();
        return state();
      }
      written += out.length;
    }

    if (failure) {
      const { index, recordType, missing, reason } = failure;
      console.error(`capture-schema: record ${index} (${recordType}) ${reason}`
        + `${missing.length ? `: ${missing.join(', ')}` : ''}`
        + ` — kept the ${index} verified record(s) and a capture-error, and appended nothing else: ${file}`);
      status = planned.status;
      error = failure;
      shut();
    }
    return state();
  }

  return {
    file,
    collision,
    get ok() { return live; },
    append,
    close() {
      const wasLive = live;
      shut();
      if (wasLive && !error) console.error(`capture saved: ${file}`);
      return state();
    },
  };
}

/**
 * Puts `data` at `file` under one of the three modes. Returns `{ collision }`;
 * throws whatever the filesystem threw for anything that is not a lost race.
 */
function place(file, data, mode) {
  if (mode === 'overwrite') {
    writeFileSync(file, data);
    return { collision: false };
  }
  if (mode === 'exclusive') {
    try {
      writeFileSync(file, data, { flag: 'wx' });
    } catch (err) {
      if (err.code === 'EEXIST') return { collision: true };
      throw err;
    }
    return { collision: false };
  }
  // atomic — the temp file lives in the target's own directory, so `rename` stays
  // within one filesystem and is therefore atomic.
  const dir = path.dirname(path.resolve(file));
  const temp = path.join(dir, `.capture-${randomBytes(12).toString('hex')}.tmp`);
  try {
    writeFileSync(temp, data, { flag: 'wx', mode: 0o600 });
    renameSync(temp, file);
  } catch (err) {
    try { unlinkSync(temp); } catch { /* the temp was never created, or is already gone */ }
    throw err;
  }
  return { collision: false };
}
