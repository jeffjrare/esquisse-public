import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { errReason, launch, validate } from '../../plugin/skills/plan/references/adversary.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugin/skills/plan/references/adversary.mjs', import.meta.url));
const REFS = path.dirname(SCRIPT);
const SCHEMA = path.join(REFS, 'review-findings.schema.json');

// Fakes log their argv, cwd and stdin, then behave per FAKE_MODE. CommonJS: no package.json above them.
const FAKE_CODEX = `#!/usr/bin/env node
const fs = require('fs'); const a = process.argv.slice(2);
let input = ''; try { input = fs.readFileSync(0, 'utf8'); } catch {}
fs.writeFileSync(process.env.FAKE_LOG + '/codex.json', JSON.stringify({ argv: a, cwd: process.cwd(), input }));
const mode = process.env.FAKE_MODE || 'ok'; const out = a[a.indexOf('-o') + 1];
if (mode === 'sleep') { setTimeout(() => {}, 20000); return; }
if (mode === 'stubborn') { process.on('SIGTERM', () => {}); setTimeout(() => {}, 20000); return; }
if (mode === 'limit') { process.stderr.write("ERROR: You've hit your usage limit.\\ntokens used\\n48,118\\n"); process.exit(1); }
const answers = { ok: '{"findings":[]}', null: '{"findings":null}', item: '{"findings":[{}]}' };
fs.writeFileSync(out, answers[mode]);
`;
const FAKE_AGY = `#!/usr/bin/env node
const fs = require('fs'); const a = process.argv.slice(2);
if (a[0] === '--help') { console.log(['--settings', '--json-schema', '--mode'].filter(f => f !== process.env.FAKE_NOFLAG).join(' ')); return; }
if (a[0] === 'models') { console.log(process.env.FAKE_MODELS || 'gemini-4-neon-high  Gemini 4 Neon (High)\\ngemini-4-neon-medium  Gemini 4 Neon (Medium)'); return; }
fs.writeFileSync(process.env.FAKE_LOG + '/agy.json', JSON.stringify({ argv: a, cwd: process.cwd() }));
const mode = process.env.FAKE_MODE || 'ok';
if (mode === 'sleep') { setTimeout(() => {}, 20000); return; }
if (mode === 'error') { console.log('{"status":"ERROR","error":{"message":"quota exceeded"}}'); process.exit(1); }
if (mode === 'exit2') { console.log(JSON.stringify({ status: 'SUCCESS', structured_output: { findings: [] } })); process.exit(2); }
console.log(JSON.stringify({ status: 'SUCCESS', structured_output: { findings: [] } }));
`;

function setup() {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'esq-adversary-')));
  const root = path.join(base, 'repo');
  const bin = path.join(base, 'bin');
  const log = path.join(base, 'log');
  for (const dir of [root, bin, log, path.join(root, 'sub')]) fs.mkdirSync(dir, { recursive: true });
  spawnSync('git', ['init', '-q'], { cwd: root });
  fs.writeFileSync(path.join(bin, 'codex'), FAKE_CODEX, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'agy'), FAKE_AGY, { mode: 0o755 });
  const env = { PATH: `${bin}${path.delimiter}${process.env.PATH}`, HOME: base, ESQ_CODEX: 'on', ESQ_GEMINI: 'on', FAKE_LOG: log };
  const run = (args, { cwd = path.join(root, 'sub'), extra = {}, input = 'the prompt' } = {}) =>
    spawnSync(process.execPath, [SCRIPT, ...args], { cwd, env: { ...env, ...extra }, input, encoding: 'utf8' });
  const logged = name => { try { return JSON.parse(fs.readFileSync(path.join(log, `${name}.json`), 'utf8')); } catch { return null; } };
  const readOne = (slug, call, provider, opts) => JSON.parse(run(['read', slug, call, provider], opts).stdout.trim());
  return { base, root, bin, log, env, run, logged, readOne, esq: path.join(root, '.git', 'esq') };
}

test('codex runs read-only from the toplevel with today\'s argv, and --effort replaces ESQ_CODEX_EFFORT', () => {
  const t = setup();
  const launched = t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30'], { extra: { ESQ_CODEX_EFFORT: 'high' } });
  assert.equal(launched.status, 0, launched.stderr);
  const call = t.logged('codex');
  assert.deepEqual(call.argv, ['exec', '-s', 'read-only', '-C', t.root, '--ephemeral', '-c', 'model_reasoning_effort=high',
    '--output-schema', SCHEMA, '-o', path.join(t.esq, 'codex-s-review.json'), '-']);
  assert.equal(call.cwd, t.root);
  assert.equal(call.input, 'the prompt');
  assert.ok(fs.existsSync(path.join(t.esq, 'codex-s-review.exit')));
  assert.deepEqual(t.readOne('s', 'review', 'codex'), { provider: 'codex', model: 'config', status: 'ok', answer: { findings: [] } });

  t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30', '--effort', 'medium'], { extra: { ESQ_CODEX_EFFORT: 'high', ESQ_CODEX_MODEL: 'gpt-x' } });
  const second = t.logged('codex').argv;
  assert.deepEqual(second.slice(6, 10), ['-m', 'gpt-x', '-c', 'model_reasoning_effort=medium']);
  assert.equal(t.readOne('s', 'review', 'codex').model, 'gpt-x');
});

test('gemini runs in plan mode from the toplevel, and takes the -medium variant only when listed', () => {
  const t = setup();
  assert.equal(t.run(['launch', 'gemini', 's', 'review', 'review-findings.schema.json', '30']).status, 0);
  const call = t.logged('agy');
  assert.deepEqual(call.argv, ['-p', 'the prompt', '--mode', 'plan', '--settings', path.join(REFS, 'agy-readonly.json'),
    '--json-schema', SCHEMA, '--output-format', 'json', '--model', 'gemini-4-neon-high']);
  assert.equal(call.cwd, t.root);
  assert.equal(t.readOne('s', 'review', 'gemini').status, 'ok');

  t.run(['launch', 'gemini', 's', 'review', 'review-findings.schema.json', '30', '--effort', 'medium']);
  assert.equal(t.logged('agy').argv.at(-1), 'gemini-4-neon-medium');
  assert.equal(t.readOne('s', 'review', 'gemini').model, 'gemini-4-neon-medium');

  t.run(['launch', 'gemini', 's', 'review', 'review-findings.schema.json', '30', '--effort', 'medium'], { extra: { FAKE_MODELS: 'gemini-4-neon-high  only' } });
  assert.equal(t.logged('agy').argv.at(-1), 'gemini-4-neon-high');
});

test('a refused gemini precondition spawns nothing and reads as not-run with its reason', () => {
  for (const [extra, reason] of [
    [{ ESQ_GEMINI_MODEL: 'gpt-5' }, 'ESQ_GEMINI_MODEL=gpt-5 is not a gemini-* model'],
    [{ FAKE_NOFLAG: '--mode' }, 'agy --help lists no --mode']
  ]) {
    const t = setup();
    const launched = t.run(['launch', 'gemini', 's', 'probe', 'review-findings.schema.json', '30'], { extra });
    assert.equal(launched.status, 3, launched.stderr);
    assert.equal(t.logged('agy'), null);
    assert.deepEqual(t.readOne('s', 'probe', 'gemini'), { provider: 'gemini', model: null, status: 'not-run', reason });
  }
});

test('--attach is resolved from the caller\'s cwd and reaches each provider after the prompt', () => {
  const t = setup();
  fs.writeFileSync(path.join(t.root, 'sub', 'a.diff'), 'DIFF BODY\n');
  t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30', '--attach', 'a.diff']);
  assert.equal(t.logged('codex').input, 'the prompt\nDIFF BODY\n');
  t.run(['launch', 'gemini', 's', 'review', 'review-findings.schema.json', '30', '--attach', 'a.diff']);
  assert.equal(t.logged('agy').argv[1], 'the prompt\nDIFF BODY\n');
});

test('every refusal exits 2 before a file is written', () => {
  const t = setup();
  const cases = [
    { args: ['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30'], extra: { ESQ_CODEX: 'off' } },
    { args: ['launch', 'codex', '../x', 'review', 'review-findings.schema.json', '30'] },
    { args: ['launch', 'codex', 's', 'review/..', 'review-findings.schema.json', '30'] },
    { args: ['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30', '--attach', 'missing.diff'] },
    { args: ['launch', 'codex', 's', 'review', 'no-such.schema.json', '30'] },
    { args: ['launch', 'codex', 's', 'review', 'review-findings.schema.json', 'soon'] }
  ];
  for (const { args, extra } of cases) {
    const result = t.run(args, { extra });
    assert.equal(result.status, 2, `${args.join(' ')} → ${result.stderr}`);
  }
  assert.equal(fs.existsSync(t.esq), false);
  assert.equal(t.logged('codex'), null);

  // Outside any repository, and under a git that names nothing.
  const outside = fs.mkdtempSync(path.join(t.base, 'outside-'));
  const out = t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30'], { cwd: outside, extra: { GIT_CEILING_DIRECTORIES: t.base } });
  assert.equal(out.status, 2, out.stderr);
  const silentGit = path.join(t.base, 'silent-git');
  fs.mkdirSync(silentGit);
  fs.writeFileSync(path.join(silentGit, 'git'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const silent = t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30'], { extra: { PATH: `${silentGit}${path.delimiter}${t.env.PATH}` } });
  assert.equal(silent.status, 2, silent.stderr);
  assert.deepEqual(fs.readdirSync(outside), []);
  assert.equal(fs.existsSync(t.esq), false);
  assert.equal(t.logged('codex'), null);
});

test('read names why a call returned nothing usable', () => {
  const t = setup();
  t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30'], { extra: { FAKE_MODE: 'limit' } });
  assert.equal(t.readOne('s', 'review', 'codex').reason, "ERROR: You've hit your usage limit.");
  t.run(['launch', 'gemini', 's', 'review', 'review-findings.schema.json', '30'], { extra: { FAKE_MODE: 'error' } });
  assert.equal(t.readOne('s', 'review', 'gemini').reason, 'quota exceeded');
  // A provider exiting 2 or 3 never reads as the script's own refusal.
  assert.equal(t.run(['launch', 'gemini', 's', 'two', 'review-findings.schema.json', '30'], { extra: { FAKE_MODE: 'exit2' } }).status, 0);
  assert.equal(fs.readFileSync(path.join(t.esq, 'gemini-s-two.exit'), 'utf8').trim(), '2');
  t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30'], { extra: { FAKE_MODE: 'null' } });
  assert.equal(t.readOne('s', 'review', 'codex').reason, 'the answer does not match its schema: $.findings is not array');
  t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30'], { extra: { FAKE_MODE: 'item' } });
  assert.equal(t.readOne('s', 'review', 'codex').reason, 'the answer does not match its schema: $.findings[0].where is missing');
  assert.deepEqual(t.readOne('s', 'other', 'codex'), { provider: 'codex', status: 'not-run', reason: 'never launched' });

  // A launched call whose .exit is not written yet is running.
  fs.writeFileSync(path.join(t.esq, 'codex-s-pending.meta.json'), JSON.stringify({ model: 'config', stage: 'running' }));
  assert.equal(t.readOne('s', 'pending', 'codex').status, 'running');
  // A meta caught mid-write reads as running, never as a crash.
  fs.writeFileSync(path.join(t.esq, 'codex-s-torn.meta.json'), '{"mod');
  assert.equal(t.readOne('s', 'torn', 'codex').status, 'running');
});

test('a call past its bound is stopped, marked 124 and read as timed out', () => {
  const t = setup();
  const launched = t.run(['launch', 'codex', 's', 'slow', 'review-findings.schema.json', '1'], { extra: { FAKE_MODE: 'sleep' } });
  assert.equal(launched.status, 0, launched.stderr);
  assert.equal(fs.readFileSync(path.join(t.esq, 'codex-s-slow.exit'), 'utf8').trim(), '124');
  assert.equal(t.readOne('s', 'slow', 'codex').reason, 'timed out after 1 s');
});

test('wait exits 0 once every marker exists and 124 when one is missing', () => {
  const t = setup();
  t.run(['launch', 'codex', 's', 'review', 'review-findings.schema.json', '30']);
  const done = t.run(['wait', 's', 'review', 'codex', '--bound', '1']);
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(JSON.parse(done.stdout), { done: ['codex'], pending: [], never: [], exit: 0 });
  // A provider never launched is not waited for.
  const unlaunched = t.run(['wait', 's', 'review', 'codex', 'gemini', '--bound', '5']);
  assert.equal(unlaunched.status, 0, unlaunched.stderr);
  assert.deepEqual(JSON.parse(unlaunched.stdout).never, ['gemini']);
  // A bound shorter than the startup grace still settles a never-launched provider.
  const short = t.run(['wait', 's', 'review', 'gemini', '--bound', '1']);
  assert.equal(short.status, 0, short.stderr);
  assert.deepEqual(JSON.parse(short.stdout).never, ['gemini']);
  // One launched whose .exit is not written yet is.
  fs.writeFileSync(path.join(t.esq, 'gemini-s-review.meta.json'), JSON.stringify({ model: 'm', stage: 'running' }));
  const missing = t.run(['wait', 's', 'review', 'codex', 'gemini', '--bound', '1']);
  assert.equal(missing.status, 124);
  assert.deepEqual(JSON.parse(missing.stdout).pending, ['gemini']);
});

test('the schema check and the .err reason cover what the shipped schemas and CLIs produce', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(REFS, 'premortem.schema.json'), 'utf8'));
  const finding = { kind: 'scope', where: 'w', claim: 'c', evidence: 'e', fix: 'f' };
  assert.equal(validate(schema, { findings: [finding] }), null);
  assert.equal(validate(schema, { findings: [{ ...finding, kind: 'taste' }] }), '$.findings[0].kind is not one of missing-task, criterion-does-not-prove, criterion-between-phases, phase-order, scope, security, other');
  assert.equal(validate(schema, { findings: [], extra: 1 }), '$.extra is not allowed');
  assert.equal(errReason('working\nERROR: limit\ntokens used\n48,118\n'), 'ERROR: limit');
  assert.equal(errReason('one\nlast line\n'), 'last line');
});

test('the precondition checks the agy the launch was given, not the ambient one', async () => {
  const t = setup();
  const result = await launch('gemini', 's', 'envcheck', 'review-findings.schema.json', 30,
    { cwd: t.root, env: { ...t.env, FAKE_NOFLAG: '--mode' }, prompt: 'x' });
  assert.deepEqual(result, { provider: 'gemini', status: 'refused', reason: 'agy --help lists no --mode', exit: 3 });
});

test('a wait sent before its launch has written anything waits for it', async () => {
  const t = setup();
  const waiter = spawn(process.execPath, [SCRIPT, 'wait', 's', 'race', 'codex', '--bound', '10'], { cwd: t.root, env: t.env });
  let out = '';
  waiter.stdout.on('data', chunk => { out += chunk; });
  const finished = new Promise(resolve => waiter.on('close', status => resolve({ status, exitSeen: fs.existsSync(path.join(t.esq, 'codex-s-race.exit')) })));
  await new Promise(resolve => setTimeout(resolve, 800));
  t.run(['launch', 'codex', 's', 'race', 'review-findings.schema.json', '30']);
  const { status, exitSeen } = await finished;
  assert.equal(status, 0);
  assert.equal(exitSeen, true);
  assert.deepEqual(JSON.parse(out).done, ['codex']);
});

test('without a GNU timeout the script bounds the call itself', () => {
  const t = setup();
  for (const name of ['timeout', 'gtimeout']) fs.writeFileSync(path.join(t.bin, name), '#!/bin/sh\necho "BusyBox v1"\nexit 125\n', { mode: 0o755 });
  assert.equal(t.run(['launch', 'codex', 's', 'slow', 'review-findings.schema.json', '1'], { extra: { FAKE_MODE: 'sleep' } }).status, 0);
  assert.equal(t.readOne('s', 'slow', 'codex').reason, 'timed out after 1 s');
  assert.equal(t.run(['launch', 'codex', 's', 'quick', 'review-findings.schema.json', '30']).status, 0);
  assert.equal(t.readOne('s', 'quick', 'codex').status, 'ok');
});

test('a provider ignoring SIGTERM past its bound still reads as timed out', () => {
  const t = setup();
  assert.equal(t.run(['launch', 'codex', 's', 'stubborn', 'review-findings.schema.json', '1'], { extra: { FAKE_MODE: 'stubborn' } }).status, 0);
  // 137 under GNU timeout's --kill-after, 124 under the script's own timer: both are a timeout.
  assert.ok(['124', '137'].includes(fs.readFileSync(path.join(t.esq, 'codex-s-stubborn.exit'), 'utf8').trim()));
  assert.equal(t.readOne('s', 'stubborn', 'codex').reason, 'timed out after 1 s');
});
