import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function readHookInput() {
  // fs/promises readFile rejects numeric fds; only the sync form reads fd 0.
  const text = readFileSync(0, 'utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('esq hook received malformed JSON');
  }
}

export function isMain(metaUrl) {
  return Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1]).href;
}

export function emit(result) {
  if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
}

// One switch for every telemetry writer: `ESQ_TELEMETRY=0|false|off|no` or the conventional
// `DO_NOT_TRACK=1|true|yes|on` turns them off; any other value, including empty, leaves them on.
// The validator and the protect hook never consult it — they write nothing about the user.
const TELEMETRY_OFF = new Set(['0', 'false', 'off', 'no']);
const DO_NOT_TRACK_ON = new Set(['1', 'true', 'yes', 'on']);
const fold = value => (typeof value === 'string' ? value.trim().toLowerCase() : '');

export function telemetryOptedOut(env = process.env) {
  return TELEMETRY_OFF.has(fold(env?.ESQ_TELEMETRY)) || DO_NOT_TRACK_ON.has(fold(env?.DO_NOT_TRACK));
}

// The one predicate that decides supersession in the agent-telemetry writer and which row represents
// a run in the reader (D-whole-run-record-supersedes-fallback): a SubagentStop row whose usage was
// summed from the transcript. A SubagentStop row with `runUsage: null` (transcript missing) carries no
// more than a PostToolUse fallback does. Lives here so plugin/lib imports it without loading the handler.
export function carriesWholeRunUsage(record) {
  return record?.source === 'SubagentStop' && record.runUsage !== null && typeof record.runUsage === 'object';
}

// Two derivations every telemetry writer and every reader of what they write must apply
// identically — the session id a declaration log is named after, and the repository a row was
// recorded in (B-121). They live here, beside `carriesWholeRunUsage` and for the same reason: the
// handlers import them without loading the reader, and `plugin/lib/telemetry.mjs` re-exports them
// so the CLI and the telemetry reader key on the same bytes rather than a second definition.

// The two shapes a plan identity is made of, defined once because the writers enforce them and every
// reader must accept exactly what was written and nothing wider. `REPO_KEY_SHAPE` is `repoKey`'s own
// output — 32 lowercase hex characters — and `PLAN_SLUG_SHAPE` is the closed slug the `plan:` marker
// and the declaration log both admit. An identity is the *pair*: a slug is a repository-local name,
// so neither half means anything without the other.
export const REPO_KEY_SHAPE = /^[0-9a-f]{32}$/;
export const PLAN_SLUG_SHAPE = /^[a-z0-9][a-z0-9-]{0,63}$/;

// The canonical plan slug, from anything that names a plan: a plan file's dated stem
// (`2026-09-06-spawned-plan-identity-source`), the finder's `-2`/`-3` uniquifier, or the slug itself.
// One definition, here, for the same reason the two shapes above are here: `plugin/lib/cli.mjs` builds
// the join's plan index with it over plan filenames, and the agent recorder canonicalizes a declared
// `plan:` marker with it before persisting — a second definition anywhere would de-join every row it
// disagreed with by one character. Pure: no I/O, no lookup against `docs/plans/`, one short string.
export function canonicalPlanSlug(raw) {
  return raw.trim().replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-\d+$/, '');
}

// A harness-supplied session id, reduced to a fixed-length hex digest so it can name a file.
// `null` for anything that is not a plausible id — a non-string, an empty string, or one over 512
// characters. Never a substitution over the raw string: 32 hex characters are traversal-proof by
// construction, bounded regardless of input, and collision-resistant where character folding is
// none of those (D-session-id-hashed-never-interpolated).
export function sessionKey(id) {
  if (typeof id !== 'string' || id === '' || id.length > 512) return null;
  return createHash('sha256').update(id).digest('hex').slice(0, 32);
}

// The `.git` entry at or above `startDir`, as the *canonical common directory*: a directory is
// itself; a file carries `gitdir: <target>`, resolved against its own directory when relative, with
// a trailing `/worktrees/<name>` reduced away so a linked worktree lands on its main checkout's
// `.git` (`scripts/worktree.sh` is a supported path here). A submodule's `gitdir:` has no such
// segment and is kept as it is. `null` when no `.git` is found within MAX_REPO_WALK levels.
const MAX_REPO_WALK = 64;
const WORKTREE_SEGMENT = /[/\\]worktrees[/\\][^/\\]+[/\\]?$/;

function commonGitDir(startDir) {
  if (typeof startDir !== 'string' || startDir === '') return null;
  let dir = path.resolve(startDir);
  for (let level = 0; level < MAX_REPO_WALK; level += 1) {
    const entry = path.join(dir, '.git');
    let stats;
    try {
      stats = statSync(entry);
    } catch {
      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
      continue;
    }
    if (stats.isDirectory()) return entry;
    let target;
    try {
      target = /^gitdir:\s*(.+?)\s*$/m.exec(readFileSync(entry, 'utf8'))?.[1];
    } catch {
      return null;
    }
    if (!target) return null;
    const resolved = path.isAbsolute(target) ? path.resolve(target) : path.resolve(dir, target);
    return WORKTREE_SEGMENT.test(resolved) ? resolved.replace(WORKTREE_SEGMENT, '') : resolved;
  }
  return null;
}

// 128 bits of SHA-256 over that directory's real path — never a path, a name, a remote or a branch.
// Thirty-two characters rather than twelve because a collision here is a wrong attribution rather
// than a visible foreign row. Two clones of one project key differently; a checkout and its linked
// worktree key alike. `null` when the directory is not in a repository at all, which reads as
// `unscopedRepo` — never as local and never as foreign.
export function repoKey(startDir) {
  const commonDir = commonGitDir(startDir);
  if (!commonDir) return null;
  let real;
  try {
    real = realpathSync(commonDir);
  } catch {
    real = commonDir;
  }
  return createHash('sha256').update(real).digest('hex').slice(0, 32);
}
