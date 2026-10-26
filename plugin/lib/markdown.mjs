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
//
// A ` — <prose>` after the ref is a comment on it, never part of it: a plan header written
// `**Origin:** esq/x — cut from \`esq/x\`, lands back on it` records `esq/x`. Reading it as no
// Origin made the plan legacy and sent the user to hand-edit a line the parser could already read.
function headerField(text, name) {
  const field = new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.*?)\\s*$`);
  for (const line of text.split('\n')) {
    if (/^##\s/.test(line)) break;
    const match = line.match(field);
    if (!match) continue;
    const value = match[1].split(/(?:^|\s+)—(?:\s|$)/)[0].replace(/^`\s*|\s*`$/g, '');
    if (value.includes('`')) return null;
    return value.length > 0 ? value : null;
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
// candidate span before the em dash, a lone Markdown path, or prose this rule cannot resolve returns null, and the caller
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
  if (candidates.length !== 1) return null;
  const command = candidates[0].text;
  // A lone Markdown reference is not an executable command. Only this whole-span shape is
  // excluded: paths to scripts and commands taking documents as arguments remain exact strings.
  // No filesystem lookup, executable-bit check or general shell validation belongs in extraction.
  const documentPath = /^(?:[^\s"'|&;<>()`$\\]+\.md|"[^"$`\\\r\n]+\.md"|'[^'\r\n]+\.md')$/i;
  return documentPath.test(command) ? null : command;
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
// bullet ends it. Fold only the Markdown line boundary below: whitespace inside a command
// is executable content and must also keep its exact identity against the recorded proof.
function listItems(lines) {
  const items = [];
  let current = null;
  const flush = () => {
    if (current !== null) items.push({ indent: current.indent, text: current.text.trim() });
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

// ── `**Files touched:**` — the paths a phase says it changes ─────────────────
// What `esq plan probe` maps a repository path back to. **Read, never inferred:** a phase touches
// exactly the paths its own `**Files touched:**` item names in inline-code spans, on the item's line
// and in the bullets nested under it. A span is a path when, once its brace group is expanded, every
// alternative is a plain path — a slash or a file extension, and nothing a sentence carries (a space,
// a quote, a colon, a parenthesis). `*` and a `<placeholder>` stand for one segment's characters. Any
// other span is `unread` and reported as such, because a prose item (`the 27 suites mocking …`) is a
// claim the model judges and no parser may settle.
const PATH_SPAN = /^[A-Za-z0-9._@+\-/*<>]+$/;

export function touchedPaths(text) {
  const plan = parsePlan(text);
  const planEnd = plan.logIndex < 0 ? plan.lines.length : plan.logIndex;
  return plan.phases.map((phase, index) => {
    let end = plan.phases[index + 1] ? plan.phases[index + 1].line - 1 : planEnd;
    for (let line = phase.line; line < end; line += 1) {
      if (/^#{1,3} /.test(plan.lines[line])) { end = line; break; }
    }
    const items = listItems(plan.lines.slice(phase.line, end));
    const header = items.findIndex((item) => /^\*\*Files touched:?\*\*/.test(item.text));
    const texts = [];
    if (header >= 0) {
      texts.push(items[header].text);
      for (const item of items.slice(header + 1)) {
        if (item.indent <= items[header].indent) break;
        texts.push(item.text);
      }
    }
    const paths = [];
    const unread = [];
    for (const span of texts.flatMap((item) => [...item.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()))) {
      const alternatives = pathAlternatives(span);
      if (alternatives === null) { if (!unread.includes(span)) unread.push(span); continue; }
      for (const entry of alternatives) if (!paths.includes(entry)) paths.push(entry);
    }
    return { phase: phase.number, title: phase.title, paths, unread };
  });
}

// The `esq:<name>` ids each phase's `**Expertise:**` item names, nested bullets included — the
// modules a plan said a phase loads beyond what its paths match. Prose around them is ignored.
export function phaseExpertise(text) {
  const plan = parsePlan(text);
  const planEnd = plan.logIndex < 0 ? plan.lines.length : plan.logIndex;
  return plan.phases.map((phase, index) => {
    let end = plan.phases[index + 1] ? plan.phases[index + 1].line - 1 : planEnd;
    for (let line = phase.line; line < end; line += 1) {
      if (/^#{1,3} /.test(plan.lines[line])) { end = line; break; }
    }
    const items = listItems(plan.lines.slice(phase.line, end));
    const header = items.findIndex((item) => /^\*\*Expertise:?\*\*/.test(item.text));
    const texts = [];
    if (header >= 0) {
      texts.push(items[header].text);
      for (const item of items.slice(header + 1)) {
        if (item.indent <= items[header].indent) break;
        texts.push(item.text);
      }
    }
    const ids = [];
    for (const item of texts) for (const match of item.matchAll(/`(esq:[a-z0-9][a-z0-9-]*)`/g)) if (!ids.includes(match[1])) ids.push(match[1]);
    return { phase: phase.number, ids };
  });
}

// One inline-code span read as paths: its brace group expanded, a leading `./` and a trailing `/`
// dropped, and `null` unless every alternative has the plain path shape above. Shared by
// `**Files touched:**` and the `**Paths:**` item of a `docs/LESSONS.md` entry, so the two read alike.
export function pathAlternatives(span) {
  const alternatives = expandBraces(String(span).trim()).map((entry) => entry.replace(/^\.\//, '').replace(/\/+$/, ''));
  const plain = alternatives.every((entry) => entry !== '' && PATH_SPAN.test(entry) && (entry.includes('/') || /\.[A-Za-z0-9]+$/.test(entry)));
  return plain ? alternatives : null;
}

// `a/{b,c/d}.ts` → `a/b.ts`, `a/c/d.ts`, nested groups included. An unbalanced brace is left as
// written, which then fails the path shape and lands in `unread` rather than being guessed at.
export function expandBraces(span) {
  const open = span.indexOf('{');
  if (open < 0) return [span];
  let depth = 0;
  const cuts = [];
  for (let index = open; index < span.length; index += 1) {
    const character = span[index];
    if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        const parts = [];
        let start = open + 1;
        for (const cut of cuts) { parts.push(span.slice(start, cut)); start = cut + 1; }
        parts.push(span.slice(start, index));
        const head = span.slice(0, open);
        const tail = span.slice(index + 1);
        return parts.flatMap((part) => expandBraces(`${head}${part}${tail}`));
      }
    } else if (character === ',' && depth === 1) cuts.push(index);
  }
  return [span];
}

// Does a touched entry cover a repository path? The whole path, or a directory it names — whole
// segments, as `declaresPath` reads a `(reads)` declaration — with `*` and `<placeholder>` matching
// within one segment. A rooted entry (its first segment is a top-level entry of the repository) is
// never read as a suffix: `src/index.ts` covering `frontend/src/index.ts` would assign a path no phase
// names. An `unrooted` one — a plan writing `delete \`SupabaseAdapter.ts\`` under the directory the
// line above named — can only be read as a whole-segment suffix, and is.
export function touchesPath(entry, candidate, { unrooted = false } = {}) {
  const source = entry.split(/(\*|<[^>/]*>)/).map((part) => (part === '*' || /^<[^>/]*>$/.test(part)
    ? '[^/]*'
    : part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))).join('');
  return new RegExp(`${unrooted ? '(?:^|/)' : '^'}${source}(?:/.*)?$`).test(candidate);
}

// ── Projection sections ─────────────────────────────────────────────────────
// The spec and architecture projections, cut into the sections a reader selects. ATX headings of
// level 2–4 only (esq's writers emit nothing else), outside fenced code and outside HTML comments — a
// changelog preamble kept in a comment is history, never structure. CRLF is tolerated: a line's
// trailing `\r` is ignored for detection and kept in the text.
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const SECTION_HEADING = /^(#{2,4})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;

function sourceLines(text) {
  const lines = text.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

// Index of the first `<!--` in `text` that no backtick code span holds, else -1. A run of N backticks
// opens a span the next run of exactly N on the same text closes; an unmatched run is literal. An
// inline `` `<!-- … -->` `` documents a comment, it never is one.
function commentOpenIndex(text) {
  let from = 0;
  for (;;) {
    const open = text.indexOf('<!--', from);
    const tick = text.indexOf('`', from);
    if (open === -1) return -1;
    if (tick === -1 || open < tick) return open;
    let end = tick;
    while (text[end] === '`') end += 1;
    const run = end - tick;
    let next = end;
    from = end;
    for (;;) {
      const at = text.indexOf('`', next);
      if (at === -1) break;
      let stop = at;
      while (text[stop] === '`') stop += 1;
      if (stop - at === run) { from = stop; break; }
      next = stop;
    }
  }
}

// Whether a comment is still open at the end of `line`, given whether one was open at its start.
function commentOpenAfter(line, comment) {
  let rest = line;
  for (;;) {
    if (comment) {
      const close = rest.indexOf('-->');
      if (close === -1) return true;
      rest = rest.slice(close + 3);
      comment = false;
    }
    const start = commentOpenIndex(rest);
    if (start === -1) return false;
    rest = rest.slice(start + 4);
    comment = true;
  }
}

// Walks the lines once and reports, per line, whether it is structure (outside a fence and outside a
// comment). A comment opened and closed on the same line does not hide that line's heading-ness,
// because a heading line never starts with `<!--`.
function structuralLines(lines) {
  const flags = [];
  let fence = null;
  let comment = false;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (fence) {
      flags.push(false);
      const close = line.match(FENCE_OPEN);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length && line.trim() === close[1]) fence = null;
      continue;
    }
    if (comment) {
      flags.push(false);
      comment = commentOpenAfter(line, true);
      continue;
    }
    const open = line.match(FENCE_OPEN);
    if (open) { flags.push(false); fence = open[1]; continue; }
    flags.push(true);
    comment = commentOpenAfter(line, false);
  }
  return flags;
}

// `[{ id, level, heading, from, to }]` in document order, `from`/`to` 1-based inclusive lines. Id 0 is
// everything before the first heading (title, marker, intro), level 1 and heading null; its `to` is 0
// when the document opens on a heading. A section runs to the line before the next heading of the
// same or a higher level, so it holds its children.
export function parseSections(text) {
  const lines = sourceLines(text);
  const structural = structuralLines(lines);
  const headings = [];
  lines.forEach((raw, index) => {
    if (!structural[index]) return;
    const match = raw.replace(/\r$/, '').match(SECTION_HEADING);
    if (match) headings.push({ level: match[1].length, heading: match[2], from: index + 1 });
  });
  const sections = [{ id: 0, level: 1, heading: null, from: 1, to: headings.length > 0 ? headings[0].from - 1 : lines.length }];
  headings.forEach((entry, index) => {
    const next = headings.slice(index + 1).find((later) => later.level <= entry.level);
    sections.push({ id: index + 1, level: entry.level, heading: entry.heading, from: entry.from, to: next ? next.from - 1 : lines.length });
  });
  return sections;
}

// Removes every `<!-- … -->` block, single- or multi-line, outside fenced code, except a line
// `keepLine(line)` accepts whole (the projection's own marker). A line the removal empties is dropped,
// and the blank-line run that leaves collapses to one blank line. Nothing else in the text changes.
export function stripComments(text, keepLine = () => false) {
  const trailing = text.endsWith('\n');
  const lines = sourceLines(text);
  const out = [];
  let fence = null;
  let comment = false;
  let cut = false;
  const blank = (line) => line.replace(/\r$/, '').trim() === '';
  const push = (line) => {
    if (blank(line)) {
      if (cut && (out.length === 0 || blank(out[out.length - 1]))) return;
      out.push(line);
      return;
    }
    out.push(line);
    cut = false;
  };
  for (const raw of lines) {
    const cr = raw.endsWith('\r') ? '\r' : '';
    const line = cr ? raw.slice(0, -1) : raw;
    if (fence) {
      const close = line.match(FENCE_OPEN);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length && line.trim() === close[1]) fence = null;
      push(raw);
      continue;
    }
    if (!comment) {
      const open = line.match(FENCE_OPEN);
      if (open) { fence = open[1]; push(raw); continue; }
      if (keepLine(line)) { push(raw); continue; }
    }
    let rest = line;
    let kept = '';
    let changed = false;
    while (rest.length > 0) {
      if (comment) {
        const close = rest.indexOf('-->');
        changed = true;
        if (close === -1) { rest = ''; break; }
        rest = rest.slice(close + 3);
        comment = false;
        continue;
      }
      const start = commentOpenIndex(rest);
      if (start === -1) { kept += rest; break; }
      kept += rest.slice(0, start);
      rest = rest.slice(start + 4);
      comment = true;
      changed = true;
    }
    if (!changed) { push(raw); continue; }
    if (kept.trim() === '') { cut = true; continue; }
    push(`${kept.replace(/[ \t]+$/, '')}${cr}`);
  }
  while (cut && out.length > 0 && blank(out[out.length - 1])) out.pop();
  return out.length > 0 ? `${out.join('\n')}${trailing ? '\n' : ''}` : '';
}
