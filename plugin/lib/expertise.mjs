// ── Expertise modules: which plugin knowledge a set of paths, or a project's stack, touches ────
// An expertise module is `plugin/expertise/<name>.md`: frontmatter `name` and `description`, then
// `**As of:** YYYY-MM-DD`, `**Paths:**` (backticked spans) and an optional `**Stack:**` (backticked
// npm package names, or `@scope/*`). It lives outside `plugin/skills/`, so Claude Code registers none
// as a skill and none costs a session anything by existing. The directory resolves relative to this
// file the way `DEFAULT_STANDARDS` does, so one path serves the checkout and the installed plugin.
//
// The CLI answers ids, files, dates, the paths that matched and the stack packages found — never a
// module's body, and never which module a phase *should* load beyond what its paths, its stack and
// its own `**Expertise:**` item say; that judgment stays the model's. This file imports nothing from
// `cli.mjs`, so a hook handler can import it without loading the whole CLI.
import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXPERTISE_DIR = fileURLToPath(new URL('../expertise/', import.meta.url));
export const EXPERTISE_STALE_DAYS = 180;
export const EXPERTISE_DESCRIPTION_MAX = 460;
// Detection bounds, stated before anything is read: at most this many manifests, each at most this
// many bytes. Anything over is counted in `detection.skipped`, never silently dropped.
export const STACK_MANIFEST_LIMIT = 50;
export const STACK_MANIFEST_BYTES = 512 * 1024;
const DEPENDENCY_KEYS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
// An npm package name, or a whole scope (`@radix-ui/*`).
const STACK_SPAN = /^(?:@[a-z0-9][a-z0-9._~-]*\/(?:\*|[a-z0-9][a-z0-9._~-]*)|[a-z0-9][a-z0-9._~-]*)$/;

// The segments a span or a path is made of, and whether it names a directory (a trailing `/`).
function expertiseSegments(raw) {
  const value = String(raw).trim().replace(/^\.\//, '');
  return { directory: value.endsWith('/'), segments: value.replace(/\/+$/, '').split('/').filter((segment) => segment !== '') };
}

function expertiseSegmentMatches(pattern, segment) {
  const source = pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*');
  return new RegExp(`^${source}$`).test(segment);
}

// Pure string, segment-wise and unanchored, so a path that does not exist yet still matches. A
// directory span matches its segments anywhere in the path; a file span must end where the path does.
// A path through `node_modules` never matches: a vendored copy of a platform is not the project's.
export function expertiseSpanMatches(span, candidate) {
  const pattern = expertiseSegments(span);
  const target = expertiseSegments(candidate);
  if (pattern.segments.length === 0 || target.segments.includes('node_modules')) return false;
  const width = pattern.segments.length;
  for (let start = 0; start + width <= target.segments.length; start += 1) {
    const ends = start + width === target.segments.length;
    if (!pattern.directory && !ends) continue;
    if (pattern.segments.every((segment, offset) => expertiseSegmentMatches(segment, target.segments[start + offset]))) return true;
  }
  return false;
}

// An exact package name, or `@scope/*` for every package of that scope.
export function stackSpanMatches(span, name) {
  if (span.endsWith('/*')) return name.startsWith(span.slice(0, -1)) && name.length > span.length - 1;
  return span === name;
}

export function isStackSpan(span) {
  return STACK_SPAN.test(span);
}

function spans(line) {
  return line === null ? [] : [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()).filter(Boolean);
}

// One module file: `{ name, description, asOf, paths, stack }`, or `{ reason }` when a parsed line is
// missing or malformed. The reasons are what `check-plugin.sh` prints, so the gate and the reader
// refuse the same file for the same cause.
export function parseExpertiseModule(text) {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!frontmatter) return { reason: 'no frontmatter' };
  const name = /^name:\s*(\S.*?)\s*$/m.exec(frontmatter[1])?.[1] ?? null;
  const description = /^description:\s*(\S.*?)\s*$/m.exec(frontmatter[1])?.[1] ?? null;
  if (name === null) return { reason: 'no frontmatter name' };
  if (description === null) return { reason: 'no frontmatter description' };
  const body = text.slice(frontmatter[0].length);
  const asOf = /^\*\*As of:\*\*\s+(\d{4}-\d{2}-\d{2})\s*$/m.exec(body)?.[1] ?? null;
  const paths = spans(/^\*\*Paths:\*\*(.*)$/m.exec(body)?.[1] ?? null);
  const stackLine = /^\*\*Stack:\*\*(.*)$/m.exec(body)?.[1] ?? null;
  const stack = spans(stackLine);
  const date = asOf === null ? null : new Date(`${asOf}T00:00:00Z`);
  if (asOf === null || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== asOf) return { reason: 'no parsed **As of:** YYYY-MM-DD line' };
  if (paths.length === 0) return { reason: 'no **Paths:** line naming a backticked span' };
  if (stackLine !== null && stack.length === 0) return { reason: 'a **Stack:** line naming no backticked package' };
  const malformed = stack.find((span) => !isStackSpan(span));
  if (malformed !== undefined) return { reason: `**Stack:** span \`${malformed}\` is neither a package name nor @scope/*` };
  return { name, description, asOf, paths, stack };
}

// Every module in the catalog, sorted by id: `{ id, file, ...parsed }` or `{ id, file, reason }`.
// An unreadable catalog is an empty one: no caller ever fails on it.
export async function readExpertiseCatalog(directory = EXPERTISE_DIR) {
  let names = [];
  try { names = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => entry.name).sort(); } catch { names = []; }
  const modules = [];
  for (const entry of names) {
    const stem = entry.slice(0, -3);
    const file = path.join(directory, entry);
    let text;
    try { text = await readFile(file, 'utf8'); } catch { continue; }
    let parsed;
    try { parsed = parseExpertiseModule(text); } catch (error) { parsed = { reason: String(error.message ?? error) }; }
    if (!parsed.reason && parsed.name !== stem) parsed = { reason: `frontmatter name ${parsed.name} is not the file stem ${stem}` };
    modules.push({ id: `esq:${stem}`, file, ...parsed });
  }
  return modules;
}

function gitOut(cwd, args) {
  if (process.env.NODE_ENV === 'test' && process.env.ESQ_TEST_GIT_ROOT) {
    return args.join(' ') === 'rev-parse --show-toplevel' ? process.env.ESQ_TEST_GIT_ROOT : null;
  }
  try { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 }); }
  catch { return null; }
}

// The npm packages a project declares: the root's own `package.json` (the git toplevel, or `cwd`
// outside a repository, tracked or not) plus every tracked `package.json` git lists, never one
// through `node_modules`. Only dependency key names are kept; nothing from the project is executed.
export async function detectStack(cwd) {
  const top = gitOut(cwd, ['rev-parse', '--show-toplevel'])?.trim() || cwd;
  const listed = gitOut(top, ['ls-files', '-z', '--', 'package.json', ':(glob)**/package.json']) ?? '';
  const tracked = listed.split('\0')
    .filter((entry) => entry !== '' && path.posix.basename(entry) === 'package.json' && !entry.split('/').includes('node_modules') && entry !== 'package.json')
    .sort();
  const candidates = ['package.json', ...tracked];
  const packages = new Set();
  let manifests = 0;
  let skipped = 0;
  for (const relative of candidates) {
    const file = path.join(top, relative);
    let size;
    try {
      const info = await stat(file);
      if (!info.isFile()) continue;
      size = info.size;
    } catch { continue; }
    if (manifests >= STACK_MANIFEST_LIMIT || size > STACK_MANIFEST_BYTES) { skipped += 1; continue; }
    let manifest;
    try { manifest = JSON.parse(await readFile(file, 'utf8')); } catch { skipped += 1; continue; }
    if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) { skipped += 1; continue; }
    manifests += 1;
    for (const key of DEPENDENCY_KEYS) {
      const block = manifest[key];
      if (block && typeof block === 'object' && !Array.isArray(block)) for (const name of Object.keys(block)) packages.add(name);
    }
  }
  return { packages: [...packages].sort(), detection: { manifests, skipped } };
}

function ageOf(asOf, today) {
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${asOf}T00:00:00Z`)) / 86_400_000);
}

// Read-only, and never throws on a malformed module: that module is reported under `unread`.
// - default: the modules a path matched, each with its `file`.
// - `named`: ids a plan named in `**Expertise:**`; each is answered `named: true` whether a path
//   matched it or not, and an id the catalog lacks lands in `unread`.
// - `all`: every module, `matched` possibly empty, `stack` the project packages its `**Stack:**`
//   meets (`[]` when none), and `detection` for the manifests read.
export async function expertiseMatch(readerPaths, options = {}) {
  const directory = options.dir ?? EXPERTISE_DIR;
  // The caller's own calendar day, not UTC's: an age read in the evening is not a day older.
  const now = new Date();
  const today = options.today ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const readers = [...new Set(readerPaths.map((entry) => String(entry).trim()).filter((entry) => entry !== ''))];
  const named = new Set((options.named ?? []).map((entry) => String(entry).trim()).filter(Boolean));
  const catalog = await readExpertiseCatalog(directory);
  const detected = options.all ? (options.stack ?? await detectStack(options.root ?? process.cwd())) : null;
  const skills = [];
  const unread = [];
  for (const module of catalog) {
    if (module.reason) { unread.push({ id: module.id, reason: module.reason }); continue; }
    const matched = readers.filter((reader) => module.paths.some((span) => expertiseSpanMatches(span, reader)));
    const isNamed = named.has(module.id);
    if (!options.all && matched.length === 0 && !isNamed) continue;
    const ageDays = ageOf(module.asOf, today);
    const entry = { id: module.id, file: module.file, asOf: module.asOf, ageDays, stale: ageDays > EXPERTISE_STALE_DAYS, matched };
    if (detected) entry.stack = detected.packages.filter((name) => module.stack.some((span) => stackSpanMatches(span, name)));
    if (isNamed) entry.named = true;
    skills.push(entry);
  }
  for (const id of named) {
    if (!catalog.some((module) => module.id === id)) unread.push({ id, reason: 'no expertise module by that id' });
  }
  return detected ? { skills, unread, detection: detected.detection } : { skills, unread };
}
