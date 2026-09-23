import { chmod, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function readText(file) {
  return readFile(file, 'utf8');
}

export async function atomicWrite(file, content) {
  const info = await stat(file);
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`);
  await writeFile(temporary, content, 'utf8');
  await chmod(temporary, info.mode);
  await rename(temporary, file);
}

export function splitTableRow(line) {
  const cells = [];
  let current = '';
  let escaped = false;
  let code = false;
  for (const char of line.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      current += char;
      escaped = true;
    } else if (char === '`') {
      current += char;
      code = !code;
    } else if (char === '|' && !code) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  if (cells[0] === '') cells.shift();
  if (cells.at(-1) === '') cells.pop();
  return cells;
}

export function tableAt(lines, requiredHeader = 'ID') {
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim().startsWith('|')) continue;
    const header = splitTableRow(lines[index]);
    if (!header.includes(requiredHeader)) continue;
    const separator = lines[index + 1] ? splitTableRow(lines[index + 1]) : [];
    if (separator.length !== header.length || !separator.every((cell) => /^:?-{3,}:?$/.test(cell))) {
      throw new Error(`malformed Markdown table separator after line ${index + 1}`);
    }
    let end = index + 2;
    while (end < lines.length && lines[end].trim().startsWith('|')) end += 1;
    return { start: index, end, header, rows: lines.slice(index + 2, end).map(splitTableRow) };
  }
  throw new Error(`Markdown table with ${requiredHeader} header not found`);
}

export function formatRow(cells) {
  return `| ${cells.join(' | ')} |`;
}

export function parsePlan(text) {
  const lines = text.split('\n');
  const logIndex = lines.findIndex((line) => line.trim() === '## Execution log');
  const planEnd = logIndex < 0 ? lines.length : logIndex;
  const phases = [];
  for (let index = 0; index < planEnd; index += 1) {
    const match = lines[index].match(/^### Phase (\d+) — (.+)$/);
    if (match) phases.push({ number: Number(match[1]), title: match[2], line: index + 1 });
  }
  const entries = new Map();
  if (logIndex >= 0) {
    let logEnd = lines.length;
    for (let index = logIndex + 1; index < lines.length; index += 1) {
      if (/^#{1,2} /.test(lines[index])) { logEnd = index; break; }
    }
    for (let index = logIndex + 1; index < logEnd; index += 1) {
      // The ⏸ glyph is the paused marker, and the clause after it is prose. There are two clauses —
      // `awaiting manual verification` and `blocked on an open same-unit defect` — and every consumer
      // routes on `status: 'paused'` rather than on either literal, so a third would need no parser
      // change. Matching the glyph rather than one sentence is what makes that true.
      const match = lines[index].match(/^### Phase (\d+) — (completed|⏸)(?:\s.*)?$/);
      if (!match) continue;
      const number = Number(match[1]);
      if (entries.has(number)) throw new Error(`duplicate execution-log entry for Phase ${number}`);
      entries.set(number, { number, status: match[2] === 'completed' ? 'completed' : 'paused', heading: lines[index], line: index + 1 });
    }
    return { lines, logIndex, logEnd, phases, entries };
  }
  return { lines, logIndex, logEnd: lines.length, phases, entries };
}

export function nextPhase(plan) {
  if (plan.phases.length === 0) throw new Error('plan contains no phases');
  const known = new Set(plan.phases.map((phase) => phase.number));
  for (const number of plan.entries.keys()) {
    if (!known.has(number)) throw new Error(`execution log references unknown Phase ${number}`);
  }
  for (const phase of plan.phases) {
    const entry = plan.entries.get(phase.number);
    if (entry?.status === 'paused') return { state: 'paused', phase, entry };
  }
  for (const phase of plan.phases) {
    if (plan.entries.get(phase.number)?.status !== 'completed') return { state: 'ready', phase };
  }
  return { state: 'complete', phases: plan.phases.length };
}

// The provenance a `/esq:build` phase records with its entry: the full commit its `(auto)` steps were
// judged on, and the exact commands judged PASS there. Parsed back loosely on purpose — `at` is read
// as whatever the file says, so a mutable ref hand-written into an entry reaches `esq gate verify`
// and is decided `run` there, rather than disappearing into a parse failure.
//
// **Every block a phase records, in document order — never only its first.** `/esq:build` writes one
// with the entry and `esq plan record-verification` appends another under its own
// `### Phase N — reverified <date>` heading when `/esq:fix` re-proves a step on a newer tree, so a
// phase carries as many blocks as it has proofs. Keeping the first would have let the build's older,
// already-stale block hide the fix's fresh one, which is the whole cost this transmission exists to
// remove. The list is what a reader has to fan out over; nothing here judges between them —
// `gateVerify` does that, on each block's own `at`, with its existing newest-proof-wins selection.
//
// Attribution is by the nearest `### Phase N — ` heading *above* the block, which for a recorded
// proof is the block's own `reverified` heading. So where a block sits relative to another phase's
// entry changes nothing: a Phase 1 proof appended after Phase 2's entry is still Phase 1's.
export function parseVerified(text) {
  const plan = parsePlan(text);
  const verified = new Map();
  if (plan.logIndex < 0) return verified;
  let phase = null;
  for (let index = plan.logIndex + 1; index < plan.logEnd; index += 1) {
    const heading = plan.lines[index].match(/^### Phase (\d+) — /);
    if (heading) { phase = Number(heading[1]); continue; }
    const match = plan.lines[index].match(/^\*\*Verified:\*\*\s*`?([^\s`]+)`?\s*$/);
    if (!match || phase === null) continue;
    const commands = [];
    for (let line = index + 1; line < plan.logEnd; line += 1) {
      const bullet = plan.lines[line].match(/^- `(.+)`$/);
      if (!bullet) break;
      commands.push(bullet[1]);
    }
    if (!verified.has(phase)) verified.set(phase, []);
    verified.get(phase).push({ phase, at: match[1], commands });
  }
  return verified;
}

// ── The two refs a plan's header records ─────────────────────────────────────
// `/esq:plan` writes `**Branch:** <name>` and `**Origin:** <name>` into the plan header, beside the
// optional `**Epic:**` line: the branch the shipping unit commits to, and the branch it came from
// and lands back into. Both are read only above the first `##` heading — the same string further
// down is prose about branches, never the plan's own record.
//
// One regex serves both, so the two fields cannot drift into parsing differently. Absent → null:
// no `**Branch:**` is the `unrecorded` verdict, and no `**Origin:**` marks a legacy plan, which
// owns no branch and never lands. Every plan written before either field existed keeps building.
//
// The values are data, never commands: they are compared, printed and `safeRef`-validated before
// they ever reach git, which is only ever called through an argument vector, never a shell.
function headerField(text, name) {
  const field = new RegExp(`^\\*\\*${name}:\\*\\*\\s*\`?\\s*([^\`]*?)\\s*\`?\\s*$`);
  for (const line of text.split('\n')) {
    if (/^##\s/.test(line)) break;
    const match = line.match(field);
    if (match) return match[1].length > 0 ? match[1] : null;
  }
  return null;
}

export function parseBranch(text) { return headerField(text, 'Branch'); }

export function parseOrigin(text) { return headerField(text, 'Origin'); }

// The third header field, and one of the two a command other than `/esq:plan` writes: the full commit a
// clean `/esq:review` or `/esq:converge` completion covered, recorded through `esq plan set-reviewed`.
// It is bookkeeping about the plan, never a requirement of it — which is why `esq gate verify` leaves
// this line and the `**Abandoned:**` marker out of the plan-section comparison and nothing else.
export function parseReviewedAt(text) { return headerField(text, 'Reviewed at'); }

export const REVIEWED_AT_LINE = /^\*\*Reviewed at:\*\*/;

// The fourth header field, written by `esq plan abandon` and nothing else: `**Abandoned:** <date> —
// <reason>`, the recorded decision that a plan of a shipping unit will not be built. Recorded, never
// inferred — a deleted plan file is not abandonment, because the rows citing its slug would silently
// stop counting. Like `**Reviewed at:**` it is bookkeeping about the plan, so `esq gate verify` leaves
// it out of the plan-section comparison too. Parsed with its own line match rather than
// `headerField`, whose value pattern stops at a backtick a reason may carry. A line with no date, or
// no reason after the dash, is not abandonment: `null`, exactly as if the line were absent.
export const ABANDONED_LINE = /^\*\*Abandoned:\*\*/;

export function parseAbandoned(text) {
  for (const line of text.split('\n')) {
    if (/^##\s/.test(line)) break;
    if (!ABANDONED_LINE.test(line)) continue;
    const match = line.match(/^\*\*Abandoned:\*\*\s*(\d{4}-\d{2}-\d{2})\s+—\s+(\S.*?)\s*$/);
    return match ? { date: match[1], reason: match[2] } : null;
  }
  return null;
}

// ── The `(auto)` verification step ───────────────────────────────────────────
// The extraction contract, defined here because it is the only place a command is ever recovered
// from plan prose — and nothing derived from Markdown is executed in this process. The CLI returns
// decisions and exact strings; the orchestrator keeps execution ownership.
//
// ONE MACHINE-READABLE `(auto)` STEP HAS EXACTLY ONE EXECUTABLE COMMAND: the single inline-code
// span that follows the `(auto)` marker and precedes the em dash opening the property sentence.
// The marker's own span is never the command — it is skipped **by position**, so a step written
// `` `(auto)` `pnpm test` — the suite is green `` yields `pnpm test` and never the literal `(auto)`.
//
// `null` is the honest answer, not a dropped step: a step with no span after the marker, a second
// candidate span before the em dash, or prose this rule cannot resolve returns null, and the caller
// turns that into an **unresolved** occurrence it runs conservatively through the complete-step path.
const AUTO_MARKER = '(auto)';

export function extractAutoCommand(step) {
  if (typeof step !== 'string' || step === '') return null;
  const spans = [...step.matchAll(/`([^`]+)`/g)]
    .map((match) => ({ start: match.index, end: match.index + match[0].length, text: match[1].trim() }));
  // The marker, however it is written: its own inline-code span, or the bare literal in prose.
  const markerSpan = spans.find((span) => span.text === AUTO_MARKER);
  const bare = step.indexOf(AUTO_MARKER);
  if (!markerSpan && bare < 0) return null;
  const markerEnd = markerSpan ? markerSpan.end : bare + AUTO_MARKER.length;
  // The em dash opens the property sentence — the criterion, never the command. A step with no em
  // dash is bounded by its own end, which is how the older `` `cmd` passes `` form still resolves.
  const dash = step.indexOf('—', markerEnd);
  // The `(reads)` declaration closes the command just as the em dash does — a step that declares its
  // inputs and carries no em dash would otherwise offer the declared paths as candidate commands and
  // resolve to null, which is a step run in full for punctuation it never owed.
  const reads = readsMarker(step, spans, markerEnd);
  const limit = Math.min(dash < 0 ? step.length : dash, reads ? reads.start : step.length);
  const candidates = spans.filter((span) => span.start >= markerEnd && span.end <= limit && span.text !== '');
  return candidates.length === 1 ? candidates[0].text : null;
}

// ── The `(reads)` declaration ────────────────────────────────────────────────
// What a step says its command reads, so `esq gate verify` can judge that command's freshness
// against those paths instead of against every path in the diff. **Authored, never inferred** — this
// parser recovers a declaration, it never derives one, and its whole job is to answer honestly which
// of three things a step carries.
//
// `null` — no declaration at all, which is every plan ever written and the conservative default.
// `{ malformed }` — a declaration the caller must ignore, with the reason, because a scope that
// cannot be read is not a scope to narrow a landing gate with.
// `{ paths }` — repo-relative path prefixes, deduplicated, each already proved to be a plain path.
//
// The marker is `` `(reads)` `` written as its own inline-code span; a bare mention of the literal
// is prose. The tail is strict on purpose: after the marker, only inline-code spans and the separators
// between them. Prose there is malformed rather than ignored — a sentence that continues past the
// declaration is exactly where a path would be described instead of named, and reading one as the
// other would narrow the gate on a word.
const READS_MARKER = '(reads)';
const READS_SEPARATOR = /^(?:[\s,;]|and(?![A-Za-z]))*$/;

// The marker is its own inline-code span and nothing else — unlike `(auto)`, which also answers to
// the bare literal because plans predate its code-span form. `(reads)` has no such history, and
// accepting the literal made every mention of it a marker: a command that greps for the rule
// (`grep -c '(reads)' README.md`) stopped resolving as a command at all, which both ran that step
// unresolved forever and took it out of reach of `appendLog`'s provenance refusal; a criterion
// sentence that merely named the rule was read as a broken declaration. The code-span form is the
// one every document shows, so requiring it costs an author nothing and makes prose just prose.
function readsMarker(step, spans, from) {
  const span = spans.find((candidate) => candidate.start >= from && candidate.text.trim() === READS_MARKER);
  return span ? { start: span.start, end: span.end } : null;
}

function declaredPath(raw) {
  const text = raw.trim();
  if (text === '') return { bad: 'names an empty path' };
  if (text.startsWith('/')) return { bad: `names \`${text}\`, an absolute path rather than a repository-relative one` };
  if (text.includes('\\')) return { bad: `names \`${text}\`, which is not a repository path` };
  if (/[*?]/.test(text)) return { bad: `names \`${text}\`, a glob — a declaration names paths, never patterns` };
  const trimmed = text.endsWith('/') ? text.slice(0, -1) : text;
  const segments = trimmed.split('/');
  if (trimmed === '' || segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return { bad: `names \`${text}\`, which does not resolve to a path inside the repository` };
  }
  return { path: trimmed };
}

export function declaredInputs(step) {
  if (typeof step !== 'string' || step === '') return null;
  const spans = [...step.matchAll(/`([^`]*)`/g)]
    .map((match) => ({ start: match.index, end: match.index + match[0].length, text: match[1] }));
  const marker = readsMarker(step, spans, 0);
  if (!marker) return null;

  const tail = step.slice(marker.end);
  const found = [];
  let cursor = 0;
  for (const match of tail.matchAll(/`([^`]*)`/g)) {
    if (!READS_SEPARATOR.test(tail.slice(cursor, match.index))) return { malformed: 'carries prose between its declared paths' };
    found.push(match[1]);
    cursor = match.index + match[0].length;
  }
  if (!READS_SEPARATOR.test(tail.slice(cursor))) return { malformed: 'carries prose after its declared paths' };
  if (found.length === 0) return { malformed: 'names no path' };

  const paths = [];
  for (const raw of found) {
    const resolved = declaredPath(raw);
    if (resolved.bad) return { malformed: resolved.bad };
    if (!paths.includes(resolved.path)) paths.push(resolved.path);
  }
  return { paths };
}

// Every `(auto)` step in the plan's phases, in phase order, as **complete step text** — the command
// and its property sentence together, continuation lines folded into one line. The criterion travels
// with the command because rerunning is not enough: a `grep` proving no matches passes at exit 1,
// and only the step's own sentence says so.
//
// Scoped to each phase's `**Verification:**` list, which is where `/esq:plan` writes them. A task
// bullet that merely *mentions* `(auto)` is prose about the contract, not a step to run, and a
// phase-wide sweep would hand the gate a sentence to execute. A phase that carries no verification
// list at all falls back to its own bullets — the pre-template shape, run rather than skipped.
export function autoSteps(text) {
  const plan = parsePlan(text);
  const planEnd = plan.logIndex < 0 ? plan.lines.length : plan.logIndex;
  const steps = [];
  for (const [index, phase] of plan.phases.entries()) {
    const start = phase.line; // the line after the heading, 0-based
    let end = plan.phases[index + 1] ? plan.phases[index + 1].line - 1 : planEnd;
    for (let line = start; line < end; line += 1) {
      if (/^#{1,3} /.test(plan.lines[line])) { end = line; break; }
    }
    for (const step of verificationItems(listItems(plan.lines.slice(start, end)))) {
      if (step.includes(AUTO_MARKER)) steps.push({ phase: phase.number, step });
    }
  }
  return steps;
}

// The items nested under `- **Verification:**`, or every item when the phase has no such bullet.
function verificationItems(items) {
  const header = items.findIndex((item) => /^\*\*Verification:?\*\*/.test(item.text));
  if (header < 0) return items.map((item) => item.text);
  const nested = [];
  for (const item of items.slice(header + 1)) {
    if (item.indent <= items[header].indent) break;
    nested.push(item.text);
  }
  return nested;
}

// Markdown list items, one `{ indent, text }` each, continuation lines folded in. A more-indented
// line that is not itself a bullet continues the item; a blank line, a shallower line or the next
// bullet ends it.
function listItems(lines) {
  const items = [];
  let current = null;
  const flush = () => {
    if (current !== null) items.push({ indent: current.indent, text: current.text.replace(/\s+/g, ' ').trim() });
    current = null;
  };
  for (const line of lines) {
    const bullet = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bullet) {
      flush();
      current = { indent: bullet[1].length, text: bullet[2] };
      continue;
    }
    if (current === null) continue;
    if (line.trim() === '' || line.match(/^(\s*)/)[1].length <= current.indent) { flush(); continue; }
    current.text += ` ${line.trim()}`;
  }
  flush();
  return items;
}
