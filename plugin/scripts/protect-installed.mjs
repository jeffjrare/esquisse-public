import path from 'node:path';
import { realpathSync } from 'node:fs';
import { emit, isMain, readHookInput } from './hook-io.mjs';

function canonical(candidate) {
  try { return realpathSync.native(candidate); }
  catch { return path.resolve(candidate); }
}

function contains(parent, candidate) {
  const relative = path.relative(canonical(parent), canonical(candidate));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

const MUTATION = /\bsed\s+(-\S+\s+)*-i|\btee\b|>>|\brm\b|\bmv\b|\bcp\b|\bchmod\b|\btruncate\b|\bln\b/;

function deny() {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: 'Refusing to edit the installed esq plugin cache. Change the plugin source repository, bump its version, and reinstall it instead.'
    }
  };
}

// A shell command reaches plugin files either by absolute path or by cd-ing near the
// root and using a relative `plugin/...` path — match both, mutations only.
function bashTouchesPlugin(command, pluginRoot) {
  const cites = command.includes(pluginRoot) || command.includes(canonical(pluginRoot))
    || (command.includes(path.dirname(pluginRoot)) && /(^|[\s'"/=])plugin\//.test(command));
  return cites && MUTATION.test(command);
}

export function protectInstalled(input, environment = process.env) {
  const pluginRoot = environment.CLAUDE_PLUGIN_ROOT;
  const projectRoot = environment.CLAUDE_PROJECT_DIR || input.cwd;
  if (!pluginRoot || !projectRoot) return null;

  // `--plugin-dir ./plugin` is a development source tree and must remain editable.
  if (contains(projectRoot, pluginRoot)) return null;

  if (input.tool_name === 'Bash') {
    const command = input.tool_input?.command;
    return command && bashTouchesPlugin(command, pluginRoot) ? deny() : null;
  }

  const file = input.tool_input?.file_path;
  if (!file || !contains(pluginRoot, file)) return null;
  return deny();
}

if (isMain(import.meta.url)) {
  emit(protectInstalled(await readHookInput()));
}
