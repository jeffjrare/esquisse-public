import { execFileSync } from 'node:child_process';
import { validate } from '../lib/cli.mjs';
import { emit, isMain, readHookInput } from './hook-io.mjs';

// Pre-existing defects committed long before this session must not block its stop —
// that forces the session to mutate state outside its own contract (seen live with
// /esq:grill on 2026-08-18). Only uncommitted structured-state changes are ours to answer for.
//
// It resolves the work tree root itself rather than taking one from `validate`, because it now runs
// BEFORE `validate` — and the pathspecs below are repo-relative, so running them from a subdirectory
// would match nothing and read as clean. A `cwd` outside a git work tree throws here and answers
// false, which is the same "nothing to answer for" the caller wants.
function structuredStateDirty(cwd) {
  if (process.env.NODE_ENV === 'test' && process.env.ESQ_TEST_GIT_ROOT) {
    return process.env.ESQ_TEST_GIT_DIRTY !== '0';
  }
  try {
    const git = (args) => execFileSync('git', ['-C', cwd, ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const root = git(['rev-parse', '--show-toplevel']);
    return execFileSync('git',
      ['-C', root, 'status', '--porcelain', '--', 'docs/BACKLOG.md', 'docs/DECISIONS.md', 'docs/plans'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() !== '';
  } catch { return false; }
}

// THE CHEAP QUESTION FIRST. This used to validate the whole repository and only then ask whether
// anything in the registry paths had changed — so a stop that touched no ledger still paid a readdir
// of docs/plans plus a parse of every plan file in it, on every turn, to reach a verdict it was
// always going to discard. The order is now: one `git status --porcelain` over three paths, and the
// scan only when that says this session actually wrote something structured.
export async function validateStop(input) {
  if (input.hook_event_name !== 'Stop' || input.stop_hook_active) return null;
  if ((input.background_tasks || []).length || (input.session_crons || []).length) return null;

  const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (!structuredStateDirty(cwd)) return null;

  const result = await validate(cwd);
  if (result.findings.length === 1 && result.findings[0] === 'not inside a git working tree') return null;
  if (result.valid) return null;
  return {
    decision: 'block',
    reason: `esq validate found structured-state defects:\n${result.findings.map((finding) => `- ${finding}`).join('\n')}\nFix them or explain why they cannot be fixed before stopping. This guard blocks only once.`
  };
}

if (isMain(import.meta.url)) {
  emit(await validateStop(await readHookInput()));
}
