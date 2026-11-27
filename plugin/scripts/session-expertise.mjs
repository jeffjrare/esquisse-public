// SessionStart: tell the session which expertise modules its own stack uses, and whether docs/
// holds imported specs esq has not adopted.
//
// One line of context per session, bounded before it is spent: a fixed header (at most
// HEADER_MAX characters, plus the catalog directory's absolute path written once), then one entry
// of at most ENTRY_MAX characters per module whose `**Stack:**` meets a package the project
// declares, at most ENTRY_LIMIT of them. A module the stack does not use costs nothing, whatever
// the catalog size. Only the description sentence is cut to fit; the file name never is.
//
// The handler reads only dependency key names (through `detectStack`), compares them against
// `**Stack:**` spans and never echoes one: its output is module file names, the plugin's own path
// and the plugin's own description sentences. It executes nothing from the project, makes no
// network call, writes no file, records no telemetry, and on any error prints nothing and exits 0.
//
// The intake line (at most INTAKE_LINE_MAX characters, first, only when intake is pending) comes
// from `scanDocs` with its narrow `peek`: directory entries, file sizes and the first 4 KB of
// docs/DECISIONS.md, docs/BACKLOG.md and docs/ROADMAP.md. It never reads an imported doc's content and never echoes a file name — only
// a count and a size. When the line is absent the expertise output is byte-identical to before.
//
// Output shape checked against https://code.claude.com/docs/en/hooks on 2026-10-26, Claude Code
// 2.1.310: SessionStart takes `hookSpecificOutput.additionalContext` (ignored at the top level),
// capped at 10,000 characters; its `source` is startup, resume, clear or compact, and the handler
// answers on every one so a compaction does not lose the line.
import path from 'node:path';
import { EXPERTISE_DIR, detectStack, readExpertiseCatalog, stackSpanMatches } from '../lib/expertise.mjs';
import { scanDocs } from '../lib/intake.mjs';
import { emit, isMain, readHookInput } from './hook-io.mjs';

export const HEADER_MAX = 300;
export const ENTRY_MAX = 160;
export const ENTRY_LIMIT = 40;
export const INTAKE_LINE_MAX = 200;
export const INTAKE_PEEK = 4096;

export function intakeLine(files, kb) {
  return `docs/ holds ${files} spec documents (${kb} KB) esq has not adopted — /esq:advance adopts them into decisions and backlog rows, then works the top.`;
}

// The intake line, or null. Its own failure never costs the expertise lines.
async function intakeNote(cwd) {
  try {
    const scan = await scanDocs(cwd, { peek: INTAKE_PEEK });
    if (!scan?.pending) return null;
    const line = intakeLine(scan.foreign.length, Math.round(scan.bytes / 1024));
    return line.length <= INTAKE_LINE_MAX ? line : null;
  } catch { return null; }
}

export function expertiseHeader(directory) {
  return `esq expertise modules live in ${directory} — read a module's file before changing code in its domain. `
    + 'The ones this project\'s stack uses follow; `esq expertise match --all` lists every other domain.';
}

// The description's first sentence, cut so `- <file>: <sentence>` fits ENTRY_MAX.
function entryLine(file, description) {
  const sentence = (/^(.*?[.!?])(\s|$)/.exec(description)?.[1] ?? description).trim();
  const prefix = `- ${file}: `;
  const room = ENTRY_MAX - prefix.length;
  return prefix + (sentence.length <= room ? sentence : `${sentence.slice(0, room - 1).trimEnd()}…`);
}

export async function sessionExpertise(input, environment = process.env, options = {}) {
  const cwd = (typeof input?.cwd === 'string' && input.cwd) || environment.CLAUDE_PROJECT_DIR;
  if (!cwd) return null;
  const directory = path.resolve(options.dir ?? EXPERTISE_DIR);
  const intake = await intakeNote(cwd);
  const catalog = (await readExpertiseCatalog(directory)).filter((module) => !module.reason);
  const lines = intake ? [intake] : [];
  if (catalog.length > 0) {
    const { packages } = await detectStack(cwd);
    const used = catalog.filter((module) => module.stack.some((span) => packages.some((name) => stackSpanMatches(span, name))));
    lines.push(expertiseHeader(directory));
    for (const module of used.slice(0, ENTRY_LIMIT)) lines.push(entryLine(path.basename(module.file), module.description));
    if (used.length > ENTRY_LIMIT) lines.push(`- and ${used.length - ENTRY_LIMIT} more: \`esq expertise match --all\``);
  }
  if (lines.length === 0) return null;
  return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lines.join('\n') } };
}

if (isMain(import.meta.url)) {
  try { emit(await sessionExpertise(await readHookInput())); } catch { /* silent: a session never pays for this hook's failure */ }
  process.exit(0);
}
