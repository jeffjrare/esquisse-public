#!/usr/bin/env node
// adversary.mjs — the one place an opt-in Codex/Gemini adversary call is launched, waited
// for and read (D-adversary-runs-through-one-script). A skill calls it in one line:
//
//   node <refs>/adversary.mjs launch <codex|gemini> <slug> <call> <schema> <bound> [--effort <e>] [--attach <file>]   (prompt on stdin)
//   node <refs>/adversary.mjs wait   <slug> <call> <provider>… [--bound <s>]   (default 170; exit 0, or 124 while one is missing)
//   node <refs>/adversary.mjs read   <slug> <call> <provider>…                 (one JSON line per provider)
//
// Everything lands in <git-dir>/esq/<provider>-<slug>-<call>.{json,json.part,err,exit,meta.json}.
// It refuses (exit 2, nothing written) when the provider's gate is not exactly `on`, when git
// cannot name an existing absolute git dir and toplevel, when a slug or call could leave that
// directory, when the schema is missing or --attach is unreadable. Providers' answers are data:
// nothing here runs a command an answer names. Node built-ins only.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
const NAME = /^[a-z0-9][a-z0-9-]*$/;
// agy takes the prompt as one argv string; Linux caps one at 131,072 bytes (MAX_ARG_STRLEN).
const ARG_MAX = 120000;
const KILL_GRACE_MS = 5000;
// A wait sent right after a background launch can poll before the launch writes its meta.
const STARTUP_GRACE_MS = 3000;

export class Refusal extends Error {}

function refuse(message) { throw new Refusal(message); }

// --- Providers: one entry each. A new provider is one entry here and one row in adversary.md.
export const PROVIDERS = {
  codex: {
    gate: 'ESQ_CODEX',
    // `-s read-only` is Codex's own OS sandbox; stdout is discarded, the answer is `-o`.
    prepare({ top, schema, prompt, effort, env, files }) {
      const model = env.ESQ_CODEX_MODEL || '';
      const effortValue = effort || env.ESQ_CODEX_EFFORT || '';
      const argv = ['exec', '-s', 'read-only', '-C', top, '--ephemeral',
        ...(model ? ['-m', model] : []),
        ...(effortValue ? ['-c', `model_reasoning_effort=${effortValue}`] : []),
        '--output-schema', schema, '-o', files.json, '-'];
      return { command: 'codex', argv, cwd: top, input: prompt, stdout: null, model: model || 'config' };
    },
    answer({ files }) {
      const text = readText(files.json);
      if (text === null || text.trim() === '') return { reason: null };
      try { return { answer: JSON.parse(text) }; } catch { return { reason: 'the answer does not parse as JSON' }; }
    }
  },
  gemini: {
    gate: 'ESQ_GEMINI',
    // agy has no OS sandbox: plan mode plus session-only deny settings, a capability precondition
    // that fails closed, and never --dangerously-skip-permissions. Its workspace is its cwd, so it
    // runs from the toplevel (L-01e9c39011).
    prepare({ top, schema, prompt, effort, env, files }) {
      const help = spawnSync('agy', ['--help'], { encoding: 'utf8', env });
      if (help.error) return { refused: 'agy is not on PATH' };
      const text = `${help.stdout || ''}${help.stderr || ''}`;
      for (const flag of ['--settings', '--json-schema', '--mode']) {
        if (!text.includes(flag)) return { refused: `agy --help lists no ${flag}` };
      }
      let model = env.ESQ_GEMINI_MODEL || '';
      if (model && !model.startsWith('gemini-')) return { refused: `ESQ_GEMINI_MODEL=${model} is not a gemini-* model` };
      let listed = null;
      const list = () => listed ??= (spawnSync('agy', ['models'], { encoding: 'utf8', env }).stdout || '')
        .split('\n').map(line => line.trim().split(/\s+/)[0]).filter(Boolean);
      if (!model) model = list().find(id => id.startsWith('gemini-')) || '';
      if (!model) return { refused: 'agy models lists no gemini-* model' };
      if (effort) {
        const variant = `${model.replace(/-[^-]*$/, '')}-${effort}`;
        if (list().includes(variant)) model = variant;
      }
      const bytes = Buffer.byteLength(prompt);
      if (bytes > ARG_MAX) return { refused: `the prompt is ${bytes} bytes, over agy's ${ARG_MAX}-byte argument cap` };
      const argv = ['-p', prompt, '--mode', 'plan', '--settings', path.join(HERE, 'agy-readonly.json'),
        '--json-schema', schema, '--output-format', 'json', '--model', model];
      return { command: 'agy', argv, cwd: top, input: null, stdout: files.part, model };
    },
    // A soft-denied action still exits 0: the envelope's status decides, never the exit code.
    answer({ files }) {
      const text = readText(files.json);
      if (text === null || text.trim() === '') return { reason: null };
      let envelope;
      try { envelope = JSON.parse(text); } catch { return { reason: 'the envelope does not parse as JSON' }; }
      if (envelope?.status !== 'SUCCESS') {
        const message = typeof envelope?.error === 'string' ? envelope.error : envelope?.error?.message;
        return { reason: message || envelope?.status || 'the envelope carries no status' };
      }
      return { answer: envelope.structured_output };
    }
  }
};

// --- Helpers
function readText(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } }

// Through a temp file and a rename, so a concurrent `read` never parses a half-written meta.
function writeJson(file, value) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temp, file);
}

// The `.err` reason: the last line naming an error, else the last non-empty line.
export function errReason(text) {
  const lines = (text || '').split('\n').map(line => line.trim()).filter(Boolean);
  const named = [...lines].reverse().find(line => /^(error|fatal)\b/i.test(line));
  const line = named || lines.at(-1) || '';
  return line.length > 300 ? `${line.slice(0, 297)}...` : line;
}

// GNU coreutils' timeout, under either name it ships as (macOS Homebrew: gtimeout), or null.
function gnuTimeout(env) {
  for (const name of ['timeout', 'gtimeout']) {
    const result = spawnSync(name, ['--version'], { encoding: 'utf8', env });
    if (!result.error && /GNU coreutils/.test(result.stdout || '')) return name;
  }
  return null;
}

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error || result.status !== 0) return null;
  const value = result.stdout.trim();
  if (!value || !path.isAbsolute(value)) return null;
  try { return fs.statSync(value).isDirectory() ? value : null; } catch { return null; }
}

export function resolveRepo(cwd) {
  const gitDir = git(['rev-parse', '--absolute-git-dir'], cwd);
  const top = git(['rev-parse', '--show-toplevel'], cwd);
  if (!gitDir || !top) refuse('git names no existing absolute git directory and toplevel here');
  return { gitDir, top, dir: path.join(gitDir, 'esq') };
}

function checkName(kind, value) {
  if (!NAME.test(value || '')) refuse(`${kind} must match ${NAME} (got ${JSON.stringify(value ?? '')})`);
}

export function filesFor(dir, provider, slug, call) {
  const base = path.join(dir, `${provider}-${slug}-${call}`);
  return { base, json: `${base}.json`, part: `${base}.json.part`, err: `${base}.err`, exit: `${base}.exit`, meta: `${base}.meta.json` };
}

// --- Schema check: the subset the shipped schemas use.
export function validate(schema, value, at = '$') {
  if (!schema || typeof schema !== 'object') return null;
  const type = schema.type;
  const isType = {
    object: v => v !== null && typeof v === 'object' && !Array.isArray(v),
    array: Array.isArray, string: v => typeof v === 'string', number: v => typeof v === 'number',
    integer: Number.isInteger, boolean: v => typeof v === 'boolean', null: v => v === null
  };
  if (type && !(Array.isArray(type) ? type : [type]).some(t => isType[t]?.(value))) return `${at} is not ${type}`;
  if (schema.enum && !schema.enum.includes(value)) return `${at} is not one of ${schema.enum.join(', ')}`;
  if (isType.object(value)) {
    for (const key of schema.required || []) if (!(key in value)) return `${at}.${key} is missing`;
    const properties = schema.properties || {};
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) {
        const problem = validate(properties[key], child, `${at}.${key}`);
        if (problem) return problem;
      } else if (schema.additionalProperties === false) {
        return `${at}.${key} is not allowed`;
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i++) {
      const problem = validate(schema.items, value[i], `${at}[${i}]`);
      if (problem) return problem;
    }
  }
  return null;
}

// --- launch
export async function launch(provider, slug, call, schema, bound, { effort = null, attach = null, cwd = process.cwd(), env = process.env, prompt = '' } = {}) {
  const spec = PROVIDERS[provider];
  if (!spec) refuse(`unknown provider ${JSON.stringify(provider ?? '')}: ${Object.keys(PROVIDERS).join(' or ')}`);
  if (env[spec.gate] !== 'on') refuse(`${spec.gate} is not on`);
  checkName('slug', slug);
  checkName('call', call);
  const seconds = Number(bound);
  if (!Number.isInteger(seconds) || seconds <= 0) refuse(`bound must be a positive integer of seconds (got ${JSON.stringify(bound ?? '')})`);
  if (effort !== null) checkName('effort', effort);
  let attached = '';
  if (attach !== null) {
    const file = path.resolve(cwd, attach);
    try { attached = fs.readFileSync(file, 'utf8'); } catch { refuse(`--attach ${file} is not readable`); }
  }
  const schemaPath = path.isAbsolute(schema || '') ? schema : path.join(HERE, schema || '');
  if (!schema || !fs.existsSync(schemaPath)) refuse(`schema ${schemaPath} does not exist`);
  const { top, dir } = resolveRepo(cwd);
  // Read only once every refusal that needs no prompt has passed.
  const text = typeof prompt === 'function' ? prompt() : prompt;

  fs.mkdirSync(dir, { recursive: true });
  const files = filesFor(dir, provider, slug, call);
  const prefix = `${path.basename(files.base)}.`;
  for (const name of fs.readdirSync(dir)) if (name.startsWith(prefix)) fs.rmSync(path.join(dir, name), { force: true });

  const fullPrompt = attached ? `${text.replace(/\n?$/, '\n')}${attached}` : text;
  const meta = { provider, slug, call, schema: schemaPath, bound: seconds, effort, startedAt: new Date().toISOString(), model: null, stage: 'launching' };
  writeJson(files.meta, meta);

  const plan = spec.prepare({ top, schema: schemaPath, prompt: fullPrompt, effort, env, files });
  if (plan.refused) {
    Object.assign(meta, { stage: 'refused', reason: plan.refused });
    writeJson(files.meta, meta);
    fs.writeFileSync(files.err, `${plan.refused}\n`);
    fs.writeFileSync(files.exit, 'refused\n');
    return { provider, status: 'refused', reason: plan.refused, exit: 3 };
  }
  Object.assign(meta, { model: plan.model, stage: 'running' });
  writeJson(files.meta, meta);

  const errFd = fs.openSync(files.err, 'w');
  const outFd = plan.stdout ? fs.openSync(plan.stdout, 'w') : 'ignore';
  // GNU timeout owns the bound when there is one, so it holds even if this script is killed
  // outright (SIGKILL cannot be forwarded). Without it, the script's own timer bounds the call.
  const timeoutBin = gnuTimeout(env);
  const startedMs = Date.now();
  const [command, args] = timeoutBin
    ? [timeoutBin, [`--kill-after=${KILL_GRACE_MS / 1000}`, String(seconds), plan.command, ...plan.argv]]
    : [plan.command, plan.argv];
  const child = spawn(command, args, {
    cwd: plan.cwd, env, detached: true, stdio: [plan.input === null ? 'ignore' : 'pipe', outFd, errFd]
  });
  if (plan.input !== null) { child.stdin.on('error', () => {}); child.stdin.end(plan.input); }

  let stopped = false;
  const killGroup = signal => { try { process.kill(-child.pid, signal); } catch { /* already gone */ } };
  const terminate = () => { killGroup('SIGTERM'); setTimeout(() => killGroup('SIGKILL'), KILL_GRACE_MS).unref(); };
  let timerFired = false;
  const timer = timeoutBin ? null : setTimeout(() => { timerFired = true; terminate(); }, seconds * 1000);
  const forward = () => { stopped = true; terminate(); };
  const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'];
  for (const signal of signals) process.on(signal, forward);

  const code = await new Promise(resolve => {
    child.on('error', error => resolve({ spawnError: error.message }));
    child.on('exit', (status, signal) => resolve({ status, signal }));
  });
  if (timer) clearTimeout(timer);
  for (const signal of signals) process.off(signal, forward);
  fs.closeSync(errFd);
  if (typeof outFd === 'number') fs.closeSync(outFd);
  if (code.spawnError) fs.appendFileSync(files.err, `error: ${command} could not start: ${code.spawnError}\n`);
  // The envelope is kept whatever the exit: an ERROR envelope carries the reason.
  if (plan.stdout && fs.existsSync(plan.stdout)) fs.renameSync(plan.stdout, files.json);
  // A child ended by a signal reports it as 128 + its number, as a shell would (timeout's own
  // --kill-after SIGKILL reaches itself too, its process group's leader: 137).
  const bySignal = code.signal ? 128 + (os.constants.signals[code.signal] ?? 0) : 128;
  const exit = timerFired ? 124 : code.spawnError ? 127 : code.status ?? bySignal;
  // timeout exits 137 when the provider ignored SIGTERM and --kill-after had to SIGKILL it.
  const timedOut = !stopped && (exit === 124 || (exit === 137 && Date.now() - startedMs >= seconds * 1000));
  Object.assign(meta, { stage: 'done', exitCode: exit, timedOut, stopped, endedAt: new Date().toISOString() });
  writeJson(files.meta, meta);
  fs.writeFileSync(files.exit, `${exit}\n`);
  // The call ran: its own status is .exit and `read`; the script's exit stays 0, so 2 and 3 keep
  // meaning the script's refusal and a refused precondition.
  return { provider, status: 'done', providerExit: exit, exit: 0 };
}

// --- read
export function read(slug, call, providers, { cwd = process.cwd() } = {}) {
  checkName('slug', slug);
  checkName('call', call);
  const { dir } = resolveRepo(cwd);
  return providers.map(provider => {
    const spec = PROVIDERS[provider];
    if (!spec) refuse(`unknown provider ${JSON.stringify(provider ?? '')}`);
    const files = filesFor(dir, provider, slug, call);
    const metaText = readText(files.meta);
    if (metaText === null) return { provider, status: 'not-run', reason: 'never launched' };
    let meta;
    try { meta = JSON.parse(metaText); } catch { return { provider, status: 'running' }; }
    const base = { provider, model: meta.model };
    if (readText(files.exit) === null) return { ...base, status: 'running' };
    const notRun = reason => ({ ...base, status: 'not-run', reason });
    if (meta.stage === 'refused') return notRun(meta.reason);
    if (meta.timedOut) return notRun(`timed out after ${meta.bound} s`);
    if (meta.stopped) return notRun('stopped before it returned');
    const got = spec.answer({ files });
    const fromErr = () => errReason(readText(files.err)) || `exit ${meta.exitCode}`;
    if (got.reason !== undefined) return notRun(got.reason || fromErr());
    if (meta.exitCode !== 0 && provider === 'codex') return notRun(fromErr());
    const schema = JSON.parse(readText(meta.schema) ?? 'null');
    const problem = validate(schema, got.answer);
    if (problem) return notRun(`the answer does not match its schema: ${problem}`);
    return { ...base, status: 'ok', answer: got.answer };
  });
}

// --- wait
export async function wait(slug, call, providers, { bound = 170, cwd = process.cwd(), pollMs = 500 } = {}) {
  checkName('slug', slug);
  checkName('call', call);
  for (const provider of providers) if (!PROVIDERS[provider]) refuse(`unknown provider ${JSON.stringify(provider ?? '')}`);
  const seconds = Number(bound);
  if (!(seconds > 0)) refuse(`--bound must be a positive number of seconds (got ${JSON.stringify(bound)})`);
  const { dir } = resolveRepo(cwd);
  const started = Date.now();
  const deadline = started + seconds * 1000;
  // Launched and not returned: pending. No meta yet: pending through the startup grace, then never
  // launched (its launch refused before writing anything), so nothing is waited for in vain.
  const state = p => {
    const files = filesFor(dir, p, slug, call);
    if (fs.existsSync(files.exit)) return 'done';
    if (fs.existsSync(files.meta)) return 'pending';
    return Date.now() < Math.min(deadline, started + STARTUP_GRACE_MS) ? 'pending' : 'never';
  };
  const pending = () => providers.filter(p => state(p) === 'pending');
  while (pending().length && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, Math.min(pollMs, Math.max(1, deadline - Date.now()))));
  }
  const states = Object.fromEntries(providers.map(p => [p, state(p)]));
  const pick = value => providers.filter(p => states[p] === value);
  const left = pick('pending');
  return { done: pick('done'), pending: left, never: pick('never'), exit: left.length ? 124 : 0 };
}

// --- command line
const USAGE = 'usage: adversary.mjs launch <codex|gemini> <slug> <call> <schema> <bound> [--effort <e>] [--attach <file>] (prompt on stdin)'
  + ' | wait <slug> <call> <provider>… [--bound <s>] | read <slug> <call> <provider>…';

export function parseArgs(args, flagNames) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      if (!flagNames.includes(name) || i + 1 >= args.length) refuse(`unknown or empty flag ${arg}`);
      flags[name] = args[++i];
    } else positional.push(arg);
  }
  return { positional, flags };
}

export async function main(argv, { cwd = process.cwd(), env = process.env, stdin = () => fs.readFileSync(0, 'utf8') } = {}) {
  const [command, ...rest] = argv;
  if (command === 'launch') {
    const { positional, flags } = parseArgs(rest, ['effort', 'attach']);
    if (positional.length !== 5) refuse(USAGE);
    const [provider, slug, call, schema, bound] = positional;
    // Every refusal that needs no prompt is checked before stdin is read.
    const result = await launch(provider, slug, call, schema, bound, {
      effort: flags.effort ?? null, attach: flags.attach ?? null, cwd, env, prompt: stdin
    });
    return { output: [result], exit: result.exit };
  }
  if (command === 'wait') {
    const { positional, flags } = parseArgs(rest, ['bound']);
    if (positional.length < 3) refuse(USAGE);
    const [slug, call, ...providers] = positional;
    const result = await wait(slug, call, providers, { bound: flags.bound ?? 170, cwd });
    return { output: [result], exit: result.exit };
  }
  if (command === 'read') {
    const { positional } = parseArgs(rest, []);
    if (positional.length < 3) refuse(USAGE);
    const [slug, call, ...providers] = positional;
    return { output: read(slug, call, providers, { cwd }), exit: 0 };
  }
  refuse(USAGE);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  main(process.argv.slice(2)).then(({ output, exit }) => {
    for (const line of output) process.stdout.write(`${JSON.stringify(line)}\n`);
    process.exitCode = exit;
  }, error => {
    process.stderr.write(`adversary: ${error.message}\n`);
    process.exitCode = error instanceof Refusal ? 2 : 1;
  });
}
