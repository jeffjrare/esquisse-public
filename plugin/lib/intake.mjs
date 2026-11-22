// ── The intake inventory: a deterministic map of the specs a user imported into docs/ ───────────
// A user who writes specs in a chat and drops them into a fresh repository hands esq a folder it
// reads none of: briefs, a decision registry coded D1..D64, a module list, a roadmap of prompts.
// This module answers what is there, syntactically — which files esq does not own, their headings,
// the codes they define and cite, the links that do not resolve — and whether intake is pending.
// It never judges what a document means, whether a decision is settled, or what to adopt: that is
// `/esq:harvest`'s one reading. Read-only: it writes nothing, anywhere.
//
// It imports nothing from `cli.mjs`, so the SessionStart hook can load it without the CLI.

import { open, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// The bounds, stated before anything is read. Depth counts path segments under docs/ (a file
// directly in docs/ is depth 1), and the entry limit counts every file and directory examined.
export const INTAKE_DEPTH = 4;
export const INTAKE_ENTRY_LIMIT = 500;
// Intake is pending at 3 foreign Markdown files totalling 20 KB, with no parseable esq registry.
export const INTAKE_MIN_FILES = 3;
export const INTAKE_MIN_BYTES = 20 * 1024;

// Paths esq owns whatever their content: its own directories, and the top-level ledgers no
// imported spec plausibly shares a name with.
const OWNED_DIRECTORIES = new Set(['plans', 'epics', 'copy']);
const OWNED_FILES = new Set(['PROMISES.md', 'LESSONS.md', 'EVIDENCE.md', 'CONFORMANCE.md', 'AUDIT.md', 'STANDARDS.md']);
// Names a chat-written spec does share with an esq ledger or projection: each counts as esq's only
// when it is in esq's format, otherwise it is foreign and gets read like any other import.
const FORMAT_OWNED = {
  'SPEC.md': (text) => /<!-- last-spec:/.test(text.split('\n').slice(0, 10).join('\n')),
  'ARCHITECTURE.md': (text) => /<!-- last-arch:/.test(text.split('\n').slice(0, 10).join('\n')),
  'DECISIONS.md': (text) => /^\|\s*#\s*\|/m.test(text),
  'BACKLOG.md': (text) => /^\|\s*ID\s*\|/m.test(text),
  'ROADMAP.md': (text) => /^## Now\b/m.test(text),
};

// The format-owned names the hook's peek reads the head of.
const PEEKED = new Set(['DECISIONS.md', 'BACKLOG.md', 'ROADMAP.md']);

const MARKDOWN = /\.(md|markdown)$/i;
// A code: `D58`, `MOD-12`, `B-139-2`, `3.A`. Syntactic only — `UTF-8` matches too, and the
// defined-versus-cited split plus harvest's reading are what filter it. Never claimed a decision.
const CODE = /(?<![A-Za-z0-9._-])(?:[A-Z]{1,5}-?\d{1,4}(?:-\d{1,4})?|\d{1,2}\.[A-Z])(?![A-Za-z0-9])/g;
const LEADING_CODE = /^(?:[A-Z]{1,5}-?\d{1,4}(?:-\d{1,4})?|\d{1,2}\.[A-Z])(?![A-Za-z0-9])/;
const MARKUP = /^[\s*_`[(>]+/;

// The code that opens a string, after emphasis, backticks or a bracket.
function leadingCode(text) {
  const stripped = text.replace(MARKUP, '');
  const match = stripped.match(LEADING_CODE);
  return match ? { code: match[0], index: text.length - stripped.length } : null;
}

async function walk(docs) {
  const files = [];
  const deep = [];
  let examined = 0;
  let overflow = 0;
  const queue = [{ directory: docs, relative: '', depth: 1 }];
  while (queue.length > 0) {
    const { directory, relative, depth } = queue.shift();
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch { continue; }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      // Past the limit an entry is counted, never examined: a lower bound, since a directory
      // left unread past the limit has entries no one counted.
      if (examined >= INTAKE_ENTRY_LIMIT) { overflow += 1; continue; }
      examined += 1;
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (depth === 1 && OWNED_DIRECTORIES.has(entry.name)) continue;
        if (depth < INTAKE_DEPTH) queue.push({ directory: path.join(directory, entry.name), relative: name, depth: depth + 1 });
        else deep.push(`docs/${name}/`);
      } else if (entry.isFile()) {
        files.push({ name, absolute: path.join(directory, entry.name), depth });
      }
    }
  }
  return { files, deep, examined, overflow };
}

// The first `limit` bytes of a file, never more.
async function head(file, limit) {
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(limit);
    const { bytesRead } = await handle.read(buffer, 0, limit, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally { await handle.close(); }
}

// The cheap half: which files are foreign, how big, and what each ledger name holds. It reads the
// content of the five format-owned names only.
//
// `peek` is the SessionStart hook's narrower read: the first `peek` bytes of docs/DECISIONS.md,
// docs/BACKLOG.md and docs/ROADMAP.md, and no other content at all. The two other format-owned
// names are then counted as esq's unread (`ledgers` says `unread`), so the hook errs toward
// silence, never toward a false nudge.
//
// Intake is not pending once any ledger is in esq's format: a project that runs esq through its
// backlog or roadmap may never have recorded a decision.
export async function scanDocs(root, { peek = null } = {}) {
  const docs = path.join(root, 'docs');
  try { if (!(await stat(docs)).isDirectory()) return null; }
  catch { return null; }
  const { files, deep, examined, overflow } = await walk(docs);
  const ledgers = Object.fromEntries(Object.keys(FORMAT_OWNED).map((name) => [name, 'absent']));
  const foreign = [];
  const nonMarkdown = [];
  for (const file of files) {
    const relative = `docs/${file.name}`;
    const top = file.depth === 1;
    if (top && OWNED_FILES.has(file.name)) continue;
    let bytes;
    try { bytes = (await stat(file.absolute)).size; } catch { continue; }
    if (top && FORMAT_OWNED[file.name]) {
      if (peek !== null && !PEEKED.has(file.name)) { ledgers[file.name] = 'unread'; continue; }
      let text = '';
      try { text = peek !== null ? await head(file.absolute, peek) : await readFile(file.absolute, 'utf8'); } catch { text = ''; }
      const esq = FORMAT_OWNED[file.name](text);
      ledgers[file.name] = esq ? 'esq' : 'foreign';
      if (esq) continue;
    }
    if (MARKDOWN.test(file.name)) foreign.push({ path: relative, absolute: file.absolute, bytes });
    else nonMarkdown.push({ path: relative, bytes });
  }
  const bytes = foreign.reduce((sum, file) => sum + file.bytes, 0);
  const registry = ledgers['DECISIONS.md'];
  let pending = false;
  let reason;
  const ledger = Object.keys(ledgers).find((name) => ledgers[name] === 'esq');
  if (registry === 'esq') reason = 'docs/DECISIONS.md is an esq registry — this project already runs esq';
  else if (ledger) reason = `docs/${ledger} is an esq ledger — this project already runs esq`;
  else if (foreign.length < INTAKE_MIN_FILES || bytes < INTAKE_MIN_BYTES) {
    reason = `below the floor: ${foreign.length} foreign Markdown file(s), ${Math.round(bytes / 1024)} KB — intake needs at least ${INTAKE_MIN_FILES} files and ${INTAKE_MIN_BYTES / 1024} KB`;
  } else {
    pending = true;
    reason = `${foreign.length} foreign Markdown files (${Math.round(bytes / 1024)} KB) and no esq registry${registry === 'foreign' ? ' — docs/DECISIONS.md exists but is not in esq\'s format' : ''}`;
  }
  return { pending, reason, registry, registryCollision: registry === 'foreign', ledgers, foreign, nonMarkdown, bytes, deep, examined, overflow };
}

function analyze(text, relative) {
  const lines = text.split('\n');
  const headings = [];
  const definitions = [];
  const citations = [];
  const links = [];
  let fence = null;
  lines.forEach((line, index) => {
    const number = index + 1;
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return;
    }
    if (marker) { fence = marker[1]; return; }
    let lead = null;
    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      headings.push({ level: heading[1].length, text: heading[2], line: number });
      const start = line.indexOf(heading[2]);
      const found = leadingCode(heading[2]);
      if (found) lead = { ...found, index: start + found.index, where: 'heading' };
    } else if (/^\s*\|/.test(line) && !/^\s*\|[\s:|-]+$/.test(line)) {
      const open = line.indexOf('|') + 1;
      const close = line.indexOf('|', open);
      const cell = close < 0 ? line.slice(open) : line.slice(open, close);
      const found = leadingCode(cell);
      if (found) lead = { ...found, index: open + found.index, where: 'table' };
    }
    for (const match of line.matchAll(CODE)) {
      if (lead && match.index === lead.index) definitions.push({ code: match[0], path: relative, line: number, where: lead.where });
      else citations.push({ code: match[0], path: relative, line: number });
    }
    for (const match of line.matchAll(/\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
      links.push({ from: relative, line: number, target: match[1], kind: 'link' });
    }
    for (const match of line.matchAll(/`(docs\/[^`\s]+)`/g)) {
      links.push({ from: relative, line: number, target: match[1], kind: 'path' });
    }
  });
  const words = text.split(/\s+/).filter(Boolean).length;
  return { headings, definitions, citations, links, words };
}

async function exists(file, cache) {
  if (!cache.has(file)) cache.set(file, await stat(file).then(() => true, () => false));
  return cache.get(file);
}

// The full map `esq intake inventory` answers. `null` docs/ answers an empty inventory, not pending.
export async function intakeInventory(root) {
  const scan = await scanDocs(root);
  if (!scan) {
    return { root, docs: null, pending: false, reason: 'no docs/ directory', registry: 'absent', registryCollision: false, ledgers: {}, totals: { files: 0, bytes: 0, kb: 0, words: 0 }, examined: 0, overflow: 0, tooDeep: [], files: [], codes: [], undefinedCited: [], multiplyDefined: [], links: [], nonMarkdown: [] };
  }
  const files = [];
  const codes = new Map();
  const code = (name) => {
    if (!codes.has(name)) codes.set(name, { code: name, defined: [], cited: 0, citedIn: new Set() });
    return codes.get(name);
  };
  const links = [];
  const cache = new Map();
  let words = 0;
  for (const file of scan.foreign) {
    let text;
    try { text = await readFile(file.absolute, 'utf8'); } catch { continue; }
    const result = analyze(text, file.path);
    words += result.words;
    files.push({ path: file.path, bytes: file.bytes, words: result.words, headings: result.headings });
    const named = leadingCode(path.basename(file.path));
    if (named && named.index === 0) code(named.code).defined.push({ path: file.path, line: null, where: 'file' });
    for (const definition of result.definitions) code(definition.code).defined.push({ path: definition.path, line: definition.line, where: definition.where });
    for (const citation of result.citations) {
      const entry = code(citation.code);
      entry.cited += 1;
      entry.citedIn.add(citation.path);
    }
    for (const link of result.links) {
      let target = link.target;
      if (link.kind === 'link') {
        if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
        target = target.replace(/[#?].*$/, '');
        if (target === '') continue;
        try { target = decodeURIComponent(target); } catch { /* the raw spelling is checked */ }
      } else {
        target = target.replace(/#.*$/, '').replace(/[.,;:]+$/, '');
        if (/[*<>{}]/.test(target)) continue;
      }
      const base = link.kind === 'path' || target.startsWith('/') ? root : path.dirname(path.join(root, file.path));
      const resolved = path.join(base, target.replace(/^\//, ''));
      links.push({ from: link.from, line: link.line, target: link.target, resolves: await exists(resolved, cache) });
    }
  }
  const all = [...codes.values()]
    .map((entry) => ({ code: entry.code, defined: entry.defined, cited: entry.cited, citedIn: [...entry.citedIn].sort() }))
    .sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  // Defined twice means two definitions of the same kind — two headings, two table rows, two file
  // names. An index table row beside its section heading is how a registry is written, not a clash.
  const multiplyDefined = all.filter((entry) => ['heading', 'table', 'file'].some((where) => entry.defined.filter((definition) => definition.where === where).length > 1));
  return {
    root,
    docs: 'docs',
    pending: scan.pending,
    reason: scan.reason,
    registry: scan.registry,
    registryCollision: scan.registryCollision,
    ledgers: scan.ledgers,
    totals: { files: files.length, bytes: scan.bytes, kb: Math.round(scan.bytes / 1024), words },
    examined: scan.examined,
    overflow: scan.overflow,
    tooDeep: scan.deep,
    files,
    codes: all,
    undefinedCited: all.filter((entry) => entry.defined.length === 0 && entry.cited > 0).map(({ code: name, cited, citedIn }) => ({ code: name, cited, citedIn })),
    multiplyDefined: multiplyDefined.map(({ code: name, defined }) => ({ code: name, defined })),
    links,
    nonMarkdown: scan.nonMarkdown,
  };
}
